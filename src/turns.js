'use strict';

function createWorm(team,idx,x){
  return{team,idx,name:`${team===0?'내캐릭':'NPC'}${idx+1}`,x,y:groundY(x)-10,vx:0,vy:0,r:9,hp:100,alive:true,onGround:true,hurt:0}
}
const SPAWN_GAP=150;
function safeSpawn(team,idx,desired,left,right){
  const candidates=[desired];for(let offset=8;offset<=right-left;offset+=8)candidates.push(desired-offset,desired+offset);
  for(const x of candidates){if(x<left||x>right)continue;const w=createWorm(team,idx,x);let top=Math.max(0,groundY(x)-4);while(top<waterY-60&&!solid(x,top))top++;
    if(top>=waterY-60)continue;w.y=top-w.r+.2;
    if(!bodyBlocked(w,x,w.y)&&pointBlocked(x,w.y+w.r+.2)&&teams.every(t=>t.worms.every(other=>Math.abs(x-other.x)>=SPAWN_GAP)))return w;
  }
  return null;
}
function placeWorms(){
  const n=+document.getElementById('count').value,total=n*2,left=WW*.07,right=WW*.93,spacing=(right-left)/(total-1);let spots=null;
  for(let attempt=0;attempt<24&&!spots;attempt++){
    teams.forEach(t=>t.worms=[]);
    for(let i=0;i<total;i++){const desired=clamp(left+i*spacing+rand(-.18,.18)*spacing,left,right),w=safeSpawn(0,i,desired,left,right);if(!w)break;teams[0].worms.push(w)}
    if(teams[0].worms.length===total)spots=teams[0].worms.slice().sort((a,b)=>a.x-b.x);
  }
  if(!spots)throw Error('안전한 시작 지점을 찾을 수 없습니다. 맵을 다시 선택해주세요.');
  const order=Array.from({length:total},(_,i)=>i<n?0:1);
  for(let attempt=0;attempt<24;attempt++){for(let i=total-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}if(n===1||order.slice(1).filter((t,i)=>t!==order[i]).length>=2)break;if(attempt===23)order.forEach((_,i)=>order[i]=i%2)}
  teams.forEach(t=>t.worms=[]);
  spots.forEach((w,i)=>{const team=order[i],idx=teams[team].worms.length;Object.assign(w,{team,idx,name:`${team===0?'내캐릭':'NPC'}${idx+1}`});teams[team].worms.push(w)});
}
function living(t){return teams[t].worms.filter(w=>w.alive)}
function teamHP(t){return living(t).reduce((s,w)=>s+w.hp,0)}
function current(){
  if(turnWorm)return turnWorm;
  const arr=teams[activeTeam].worms;if(!arr.length)return null;
  for(let i=0;i<arr.length;i++){const j=(activeIdx[activeTeam]+i)%arr.length;if(arr[j]?.alive){activeIdx[activeTeam]=j;return arr[j]}}
  return null
}
function isCPU(){return mode==='cpu'&&activeTeam===1}

function startGame(){
  wormIntro=null;pauseIntent=false;initialBattleView=false;previewFit=false;shotPreviewCache=null;
  injuredWorms=[];injuryZoom=null;shotFocus=null;cameraShake=0;deploymentRetreatUntil=0;
  cpuWalk=null;cpuStatus='';saveSettings();beginMatchRecord();
  stopSFX();ensureAudio();
  cameraZoom=1;overview=false;physicsAccumulator=0;combatTasks=[];pendingEmissions=0;turnWorm=null;turnEnding=false;attackCommitted=false;clearInput();aiBusy=false;
  mode=document.getElementById('mode').value;difficulty=document.getElementById('difficulty').value;
  teams[0].name=document.getElementById('inputA').value.trim()||'플레이어';teams[1].name=document.getElementById('inputB').value.trim()||(mode==='cpu'?'CPU':'블루 팀');
  teams.forEach(t=>t.ammo={...defaultAmmo});turnSec=+document.getElementById('turnTime').value;sdAt=+document.getElementById('sdTurn').value;
  crateRate=+document.getElementById('crateRate').value;initialMineCount=+document.getElementById('mineCount').value;
  ui.nameA.textContent=teams[0].name;ui.nameB.textContent=teams[1].name;
  buildWorld(+document.getElementById('mapSize').value);placeWorms();seedMines(initialMineCount);
  projectiles=[];particles=[];explosions=[];damageLabels=[];walkers=[];rope=null;jetpack=false;targetMode=null;targetPoint=null;
  activeTeam=0;activeIdx=[0,0];turnNo=0;sudden=false;gameOver=false;paused=false;started=true;waterY=baseWater;document.getElementById('pauseBtn').textContent='⏸ 일시정지';
  selected='bazooka';ui.overlay.style.display='none';turnLeft=turnSec;turnStart=gameNow;ensureAudio();beginWormIntro();syncMobileOrientation();
}

function focusIntroWorm(){
  if(!wormIntro)return;if(wormIntro.overview){fitBattleView();document.getElementById('introName').textContent='아군과 적 NPC의 위치를 함께 확인하세요.';document.getElementById('introProgress').textContent='전체';return}const w=wormIntro.worms[wormIntro.index];cameraZoom=1;overview=false;camera.manualUntil=0;focusOn(w.x,w.y,true);
  document.getElementById('introName').textContent=teams[w.team].name+' · '+w.name+' · HP '+w.hp;
  document.getElementById('introProgress').textContent=(wormIntro.index+1)+' / '+wormIntro.worms.length;
}
function beginWormIntro(){
  last=performance.now();
  wormIntro={worms:teams.flatMap(t=>t.worms).filter(w=>w.alive),index:0,elapsed:0,overview:true};
  turnLocked=true;clearInput();document.getElementById('ui').classList.add('introducing');document.getElementById('wormIntro').hidden=false;focusIntroWorm();updateHUD();
}
function advanceWormIntro(dt){
  if(!wormIntro||paused||document.hidden)return;wormIntro.elapsed+=dt;
  while(wormIntro&&wormIntro.elapsed+1e-9>=2){wormIntro.elapsed-=2;if(wormIntro.overview){wormIntro.overview=false;focusIntroWorm();continue}wormIntro.index++;if(wormIntro.index>=wormIntro.worms.length){completeWormIntro();return}focusIntroWorm()}
}
function completeWormIntro(){
  if(!wormIntro)return;wormIntro=null;last=performance.now();physicsAccumulator=0;clearInput();document.getElementById('wormIntro').hidden=true;document.getElementById('ui').classList.remove('introducing');beginTurn();
}

function beginTurn(){
  if(gameOver)return;if(!living(0).length||!living(1).length){finishGame();return}
  deploymentRetreatUntil=0;previewFit=false;shotPreviewCache=null;
  if(injuryZoom!==null)cameraZoom=injuryZoom;injuryZoom=null;injuredWorms=[];shotFocus=null;cpuWalk=null;cpuStatus='';turnNo++;if(!sudden&&turnNo>=sdAt)startSuddenDeath();if(Math.random()<crateRate)spawnCrate();
  turnWorm=null;turnEnding=false;attackCommitted=false;clearInput();turnLocked=false;charging=false;retreatUntil=0;targetMode=null;targetPoint=null;rope=null;jetpack=false;jetFuel=0;shotgunRemain=0;
  ui.targetTip.style.display='none';turnLeft=turnSec;turnStart=gameNow;wind=rand(-.062,.062);aim=-45;facing=activeTeam===0?1:-1;
  const w=current(),enemy=nearestEnemy(w);if(enemy)facing=enemy.x>=w.x?1:-1;turnWorm=w;w.jumpAt=-Infinity;w.jumpState=0;if(overview){overview=false;cameraZoom=1;document.getElementById('overviewBtn').textContent='전체 맵'}camera.manualUntil=0;focusOn(w.x,w.y,true);toast(`${teams[activeTeam].name} · ${w.name}`,1200);playSFX('turn');updateHUD();
  initialBattleView=turnNo===1;if(initialBattleView)fitBattleView();
  if(isCPU())scheduleAI()
}

function returnToStart(){
  previewFit=false;shotPreviewCache=null;
  clearInput();stopSFX();stopMusic();combatTasks=[];pendingEmissions=0;aiBusy=false;aiTimer=null;cpuWalk=null;cpuStatus='';
  started=false;gameOver=true;paused=false;pauseIntent=false;wormIntro=null;initialBattleView=false;turnLocked=true;turnEnding=false;attackCommitted=false;physicsAccumulator=0;
  projectiles=[];walkers=[];particles=[];explosions=[];damageLabels=[];injuredWorms=[];shotFocus=null;injuryZoom=null;rope=null;jetpack=false;deploymentRetreatUntil=0;retreatUntil=0;matchId='';matchRecorded=false;finishTarget();
  document.getElementById('wormIntro').hidden=true;document.getElementById('ui').classList.remove('introducing','aiming');document.getElementById('battleOptions').open=!isMobileDevice();
  document.querySelector('#panel h1').textContent='조준! 각도왕';document.querySelector('#panel p').textContent='각도를 읽고, 전략을 세우자!';document.getElementById('matchSummary').hidden=true;
  clearTimeout(toast.t);clearTimeout(bigBanner.t);ui.toast.classList.remove('show');ui.banner.classList.remove('show');ui.overlay.style.display='flex';updateHUD();
  if(document.fullscreenElement||document.webkitFullscreenElement){try{const result=(document.exitFullscreen||document.webkitExitFullscreen)?.call(document);result?.catch(()=>{})}catch{}}
  document.getElementById('start').focus();
}
function nextTurn(delay=900){
  if(turnEnding||gameOver||wormIntro)return;
  if(combatUnsettled()||presentationPending()){commitAttack(0);return}
  cpuWalk=null;cpuStatus='';turnEnding=true;turnLocked=true;clearInput();rope=null;jetpack=false;finishTarget();
  cancelCombat(aiTimer);aiBusy=false;
  const handoff=()=>{if(combatUnsettled()||presentationPending()){scheduleCombat(handoff,100);return}activeIdx[activeTeam]=(activeIdx[activeTeam]+1)%teams[activeTeam].worms.length;activeTeam=1-activeTeam;beginTurn()};
  scheduleCombat(handoff,delay)
}
function startRetreat(sec=2.6){commitAttack(sec)}
function finishGame(){
  if(gameOver)return;
  cpuWalk=null;cpuStatus='';gameOver=true;turnLocked=true;clearInput();combatTasks=[];pendingEmissions=0;cancelCombat(aiTimer);const a=living(0).length,b=living(1).length;
  const msg=a===b?'무승부!':a>b?`${teams[0].name} 승리!`:`${teams[1].name} 승리!`;recordMatchResult();stopSFX();playSFX('victory');bigBanner(msg,2300);ui.turnLabel.textContent=msg;
  const finishedMatch=matchId;
  setTimeout(()=>{if(!gameOver||matchId!==finishedMatch)return;document.querySelector('#panel h1').textContent=msg;document.querySelector('#panel p').textContent='전투 종료. 다시 시작하면 새로운 초대형 전장이 만들어집니다.';ui.overlay.style.display='flex'},2100)
}
function startSuddenDeath(){sudden=true;playSFX('sudden');bigBanner('갑작스러운 죽음!',1700);toast('수위가 상승하기 시작합니다!',2200)}
