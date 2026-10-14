'use strict';

function createWorm(team,idx,x){
  return{team,idx,name:`${team===0?'내캐릭':'NPC'}${idx+1}`,x,y:groundY(x)-10,vx:0,vy:0,r:9,hp:100,alive:true,onGround:true,hurt:0}
}
function safeSpawn(team,idx,desired,left,right){
  const candidates=[desired];for(let offset=8;offset<=right-left;offset+=8)candidates.push(desired-offset,desired+offset);
  for(const x of candidates){if(x<left||x>right)continue;const w=createWorm(team,idx,x);let top=Math.max(0,groundY(x)-4);while(top<waterY-60&&!solid(x,top))top++;
    if(top>=waterY-60)continue;w.y=top-w.r+.2;
    if(!bodyBlocked(w,x,w.y)&&pointBlocked(x,w.y+w.r+.2)&&teams.every(t=>t.worms.every(other=>dist(x,w.y,other.x,other.y)>40)))return w;
  }
  return null;
}
function placeWorms(){
  const n=+document.getElementById('count').value;teams.forEach(t=>t.worms=[]);
  const leftA=WW*.05,rightA=WW*.42,leftB=WW*.58,rightB=WW*.95;
  for(let i=0;i<n;i++){
    const jitter=rand(-70,70);
    const a=safeSpawn(0,i,clamp(lerp(leftA,rightA,n===1?.5:i/(n-1))+jitter,leftA,rightA),leftA,rightA);
    const b=safeSpawn(1,i,clamp(lerp(leftB,rightB,n===1?.5:i/(n-1))+jitter,leftB,rightB),leftB,rightB);
    if(!a||!b)throw Error('안전한 시작 지점을 찾을 수 없습니다.');
    teams[0].worms.push(a);teams[1].worms.push(b)
  }
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
  injuredWorms=[];injuryZoom=null;
  cpuWalk=null;cpuStatus='';saveSettings();beginMatchRecord();
  ensureAudio();playSFX('turn');
  cameraZoom=1;overview=false;physicsAccumulator=0;combatTasks=[];pendingEmissions=0;turnWorm=null;turnEnding=false;attackCommitted=false;clearInput();aiBusy=false;
  mode=document.getElementById('mode').value;difficulty=document.getElementById('difficulty').value;
  teams[0].name=document.getElementById('inputA').value.trim()||'플레이어';teams[1].name=document.getElementById('inputB').value.trim()||(mode==='cpu'?'CPU':'블루 팀');
  teams.forEach(t=>t.ammo={...defaultAmmo});turnSec=+document.getElementById('turnTime').value;sdAt=+document.getElementById('sdTurn').value;
  crateRate=+document.getElementById('crateRate').value;initialMineCount=+document.getElementById('mineCount').value;
  ui.nameA.textContent=teams[0].name;ui.nameB.textContent=teams[1].name;
  buildWorld(+document.getElementById('mapSize').value);placeWorms();seedMines(initialMineCount);
  projectiles=[];particles=[];explosions=[];damageLabels=[];walkers=[];rope=null;jetpack=false;targetMode=null;targetPoint=null;
  activeTeam=0;activeIdx=[0,0];turnNo=0;sudden=false;gameOver=false;paused=false;started=true;waterY=baseWater;document.getElementById('pauseBtn').textContent='⏸ 일시정지';
  selected='bazooka';ui.overlay.style.display='none';beginTurn()
}

function beginTurn(){
  if(gameOver)return;if(!living(0).length||!living(1).length){finishGame();return}
  if(injuryZoom!==null)cameraZoom=injuryZoom;injuryZoom=null;injuredWorms=[];shotFocus=null;cpuWalk=null;cpuStatus='';turnNo++;if(!sudden&&turnNo>=sdAt)startSuddenDeath();if(Math.random()<crateRate)spawnCrate();
  turnWorm=null;turnEnding=false;attackCommitted=false;clearInput();turnLocked=false;charging=false;retreatUntil=0;targetMode=null;targetPoint=null;rope=null;jetpack=false;jetFuel=0;shotgunRemain=0;
  ui.targetTip.style.display='none';turnLeft=turnSec;turnStart=gameNow;wind=rand(-.062,.062);aim=-45;facing=activeTeam===0?1:-1;
  const w=current();turnWorm=w;w.jumpAt=-Infinity;w.jumpState=0;if(overview){overview=false;cameraZoom=1;document.getElementById('overviewBtn').textContent='전체 맵'}camera.manualUntil=0;focusOn(w.x,w.y,true);toast(`${teams[activeTeam].name} · ${w.name}`,1200);playSFX('turn');updateHUD();
  if(isCPU())scheduleAI()
}
function nextTurn(delay=900){
  if(turnEnding||gameOver)return;
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
  const msg=a===b?'무승부!':a>b?`${teams[0].name} 승리!`:`${teams[1].name} 승리!`;recordMatchResult();playSFX('victory');bigBanner(msg,2300);ui.turnLabel.textContent=msg;
  const finishedMatch=matchId;
  setTimeout(()=>{if(!gameOver||matchId!==finishedMatch)return;document.querySelector('#panel h1').textContent=msg;document.querySelector('#panel p').textContent='전투 종료. 다시 시작하면 새로운 초대형 전장이 만들어집니다.';ui.overlay.style.display='flex'},2100)
}
function startSuddenDeath(){sudden=true;playSFX('sudden');bigBanner('갑작스러운 죽음!',1700);toast('수위가 상승하기 시작합니다!',2200)}
