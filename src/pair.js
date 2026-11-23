'use strict';

const PAIR_KEY='wormfront.paired-battle.v1';
const pairResume=document.getElementById('pairResume');
const pairSetup=document.getElementById('pairSetup');
const readyAngles=[...document.querySelectorAll('[data-pair-angle]')];
const PAIR_LANDING_LABELS={terrain:'지형 착탄',worm:'봇 명중',water:'수면 도달',bounds:'전장 밖',fuse:'신관 폭발',range:'최대 거리'};
let recentPair=null,pairStored=true,queuedPairLimit=null;

function validSavedPair(s){
  const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
  const position=o=>o&&finite(o.x,-1000,21000)&&finite(o.y,-20000,8000);
  const list=(a,max,check)=>Array.isArray(a)&&a.length<=max&&a.every(check);
  const worm=w=>position(w)&&finite(w.vx,-100,100)&&finite(w.vy,-100,100)&&
    finite(w.hp,0,100)&&typeof w.alive==='boolean'&&typeof w.onGround==='boolean'&&finite(w.knockTime,0,20);
  const team=t=>t&&list(t.worms,2,worm)&&t.worms.length===2&&
    Object.keys(defaultAmmo).every(id=>Number.isInteger(t.ammo?.[id])&&finite(t.ammo[id],0,99));
  const shot=o=>o===null||(o&&Object.hasOwn(weaponNames,o.weapon)&&finite(o.angle,-13,90)&&finite(o.power,0,100)&&
    finite(o.wind,-.1,.1)&&(o.landing===null||(position(o.landing)&&Object.hasOwn(PAIR_LANDING_LABELS,o.landing.event))));
  return s?.version===1&&typeof s.id==='string'&&s.id.length>0&&s.id.length<=80&&
    [2,4].includes(s.limit)&&Number.isInteger(s.turn)&&finite(s.turn,1,s.limit)&&s.team===(s.turn-1)%2&&
    list(s.activeIdx,2,i=>[0,1].includes(i))&&s.activeIdx.length===2&&
    [-1,1].includes(s.facing)&&[null,30,60].includes(s.plannedAngle)&&finite(s.wind,-.1,.1)&&
    Object.hasOwn(weaponNames,s.selected)&&finite(s.clock,0,1e12)&&finite(s.startedAt,0,s.clock)&&typeof s.classroom==='boolean'&&
    Number.isInteger(s.width)&&Number.isInteger(s.height)&&finite(s.width,1,20000)&&finite(s.height,1,6000)&&
    s.width*s.height<=26000000&&finite(s.water,0,s.height)&&finite(s.baseWater,0,s.height)&&
    typeof s.field==='string'&&s.field.length<=3500000&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s.field)&&
    list(s.teams,2,team)&&s.teams.length===2&&s.teams[s.team].worms[s.activeIdx[s.team]]?.alive&&
    list(s.shots,2,shot)&&s.shots.length===2&&
    list(s.mines,20,m=>position(m)&&typeof m.armed==='boolean'&&finite(m.timer,0,3)&&
      [-1,0,1].includes(m.owner)&&(m.armAt==null||finite(m.armAt,0,1e12)))&&
    list(s.girders,30,g=>position(g)&&finite(g.w,1,500)&&finite(g.h,1,100))&&
    list(s.crates,30,c=>position(c)&&(c.type==='health'||Object.hasOwn(defaultAmmo,c.type))&&typeof c.taken==='boolean')&&
    list(s.clouds,100,c=>position(c)&&finite(c.s,0,5));
}
function loadPairCheckpoint(){
  const saved=readSaved(PAIR_KEY);
  return validSavedPair(saved)&&!matchHistory.some(match=>match.id===saved.id)?saved:null;
}
function clearPairCheckpoint(id){
  if(id&&recentPair?.id!==id)return;
  recentPair=null;
  try{localStorage.removeItem(PAIR_KEY)}catch{}
  blockedStorageKeys.delete(PAIR_KEY);
}
function savePairCheckpoint(){
  if(!pairedLessonBattle||!pairNeedsReady||gameOver)return;
  pairStored=false;
  try{
    const checkpoint={
      version:1,id:matchId,limit:pairTurnLimit,turn:turnNo,team:activeTeam,activeIdx:[...activeIdx],
      clock:gameNow,startedAt:matchStartedAt,facing,plannedAngle:pairPlannedAngle,selected,wind,
      classroom:!!classroomAudioBase,width:WW,height:WH,water:waterY,baseWater,
      field:terrain.toDataURL('image/png'),
      teams:teams.map(t=>({ammo:{...t.ammo},worms:t.worms.map(w=>({
        x:w.x,y:w.y,vx:w.vx,vy:w.vy,hp:w.hp,alive:w.alive,onGround:w.onGround,knockTime:w.knockTime||0
      }))})),
      mines:mines.map(m=>({...m,timer:Math.max(0,m.timer||0)})),girders:girders.map(g=>({...g})),crates:crates.map(c=>({...c})),
      clouds:clouds.map(c=>({...c})),shots:pairLastShots.map(o=>o&&{...o})
    };
    if(!validSavedPair(checkpoint))return;
    recentPair=checkpoint;
    pairStored=writeSaved(PAIR_KEY,checkpoint);
  }catch{}
}
function setPairReadyAngle(degrees){
  if(!pairNeedsReady||paused||gameOver||orientationBlocked)return;
  pairPlannedAngle=pairPlannedAngle===degrees?null:degrees;
  aim=-(pairPlannedAngle??45);
  if(recentPair?.id===matchId&&recentPair.turn===turnNo){
    recentPair.plannedAngle=pairPlannedAngle;
    pairStored=writeSaved(PAIR_KEY,recentPair);
  }
  updateHUD();
}
function restorePairWorld(s,image){
  WW=s.width;WH=s.height;baseWater=s.baseWater;waterY=s.water;
  terrain.width=WW;terrain.height=WH;tctx.drawImage(image,0,0);refreshTerrainCollision();
  activeMapTheme='coast';loadArtFile(getMapTheme().file);
  mines=s.mines.map(m=>({...m}));girders=s.girders.map(g=>({...g}));crates=s.crates.map(c=>({...c}));clouds=s.clouds.map(c=>({...c}));
  s.teams.forEach((saved,i)=>{
    teams[i].ammo={...saved.ammo};
    teams[i].worms=saved.worms.map((w,idx)=>({...w,team:i,idx,r:9,name:wormName(i,idx),hurt:0,jumpAt:-Infinity,jumpState:0}));
  });
}
function resumePairTurn(s){
  matchId=s.id;matchStartedAt=s.startedAt;gameNow=s.clock;worldTime=gameNow;
  turnNo=s.turn;activeTeam=s.team;activeIdx=[...s.activeIdx];turnWorm=current();turnLocked=false;
  retreatUntil=0;settledSince=null;shotgunRemain=0;turnStart=gameNow;turnLeft=turnSec;
  pairNeedsReady=true;pairPlannedAngle=s.plannedAngle;pairLastShots=s.shots.map(o=>o&&{...o});
  selected=s.selected;wind=s.wind;aim=-(pairPlannedAngle??45);facing=s.facing;
  if(turnNo===1){initialBattleView=true;fitBattleView()}else focusOn(turnWorm.x,turnWorm.y,true);
  last=performance.now();updateHUD();
  document.getElementById('pairReadyAction').focus();
}
async function resumeSavedPair(){
  const checkpoint=recentPair;
  if(!checkpoint||pairResume.disabled)return;
  const status=document.getElementById('pairResumeStatus');
  pairResume.disabled=true;status.textContent='전장을 여는 중이에요.';
  const image=new Image();
  try{
    await new Promise((resolve,reject)=>{
      image.onload=resolve;image.onerror=reject;image.src=checkpoint.field;
    });
    if(image.naturalWidth!==checkpoint.width||image.naturalHeight!==checkpoint.height)throw Error('World size differs');
    if(!lessonIntro.open||document.getElementById('lessonSaved').hidden||recentPair!==checkpoint)return;
    afterLessonIntro=()=>startGame({pairPractice:true,pairTurns:checkpoint.limit,restoredPair:{checkpoint,image}});
    lessonIntro.close();
  }catch{
    status.textContent='저장된 전장을 열지 못했어요. 새 모둠 활동을 시작할 수 있어요.';
    return;
  }finally{pairResume.disabled=false}
  status.textContent='';
}
function openPairSetup(){
  queuedPairLimit=null;
  openGameDialog(pairSetup);
}
function renderPairReflection(){
  const map=document.getElementById('pairShotMap'),pen=map.getContext('2d');
  map.hidden=!pairLastShots.some(shot=>shot?.landing&&shot.landing.event!=='bounds');
  if(!map.hidden){
    pen.fillStyle='#2d5870';pen.fillRect(0,0,map.width,map.height);
    pen.fillStyle='#145a83';pen.fillRect(0,waterY/WH*map.height,map.width,map.height);
    pen.drawImage(terrain,0,0,map.width,map.height);
  }
  pairLastShots.forEach((shot,i)=>{
    let text='조준 발사 기록 없음';
    if(shot){
      const breeze=Math.abs(shot.wind*100).toFixed(1);
      text=weaponNames[shot.weapon]+' '+shot.angle+'° · 힘 '+shot.power+'% · 바람 '+(breeze==='0.0'?'없음':(shot.wind<0?'← ':'→ ')+breeze);
      const landing=shot.landing;
      if(landing){
        text+=' · '+PAIR_LANDING_LABELS[landing.event];
        if(landing.event!=='bounds'){
          text+=' · 왼쪽에서 '+Math.round(clamp(landing.x,0,WW)/10)+'칸';
          const x=clamp(landing.x/WW*map.width,14,map.width-14),y=clamp(landing.y/WH*map.height,14,map.height-14);
          const labelY=clamp(y+(i?14:-10),13,map.height-4);
          pen.fillStyle=teams[i].color;pen.strokeStyle='#102337';pen.lineWidth=2;
          pen.beginPath();pen.arc(x,y,5,0,Math.PI*2);pen.fill();pen.stroke();
          pen.font='900 13px system-ui';pen.textAlign='center';pen.lineWidth=3;
          pen.strokeText((i+1)+'P',x,labelY);pen.fillText((i+1)+'P',x,labelY);
        }
      }
    }
    document.getElementById('pairShot'+(i+1)).textContent=(i+1)+'P · '+text;
  });
}

readyAngles.forEach(btn=>btn.addEventListener('click',()=>setPairReadyAngle(Number(btn.dataset.pairAngle))));
pairResume.addEventListener('click',resumeSavedPair);
document.getElementById('pairSetupClose').addEventListener('click',()=>pairSetup.close());
document.querySelectorAll('[data-pair-turns]').forEach(btn=>btn.addEventListener('click',()=>{
  queuedPairLimit=Number(btn.dataset.pairTurns);
  pairSetup.close();
}));
pairSetup.addEventListener('close',()=>{
  closeGameDialog();
  if(queuedPairLimit)startGame({pairPractice:true,pairTurns:queuedPairLimit});
  queuedPairLimit=null;
});
