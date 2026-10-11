'use strict';

const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const terrain=document.createElement('canvas'),tctx=terrain.getContext('2d',{willReadFrequently:true});
const mini=document.getElementById('minimap'),mctx=mini.getContext('2d');

let VW=innerWidth,VH=innerHeight,DPR=1;
let WW=4200,WH=900,waterY=780,baseWater=780;
let terrainCollision=new Uint8Array(0),collisionWidth=0,collisionHeight=0;
let terrainReadbacks=0,terrainReadPixels=0;
const FIXED_DT=1/60,MAX_FRAME_DELTA=.25;
let physicsAccumulator=0,physicsSteps=0;
let cameraZoom=1,overview=false;
let camera={x:0,y:0,targetX:0,targetY:0,manualUntil:0};
let graphicsInitialized=false;
let started=false,paused=false,gameOver=false,mode='cpu',difficulty='normal';
let activeTeam=0,activeIdx=[0,0],turnSec=45,turnLeft=45,turnStart=0,turnLocked=false,turnNo=0,sdAt=20,sudden=false;
let selected='bazooka',aim=-45,facing=1,wind=0,retreatUntil=0,chargeAt=0,charging=false,lastJumpTap=0;
let targetMode=null,targetPoint=null,shotgunRemain=0,rope=null,jetpack=false,jetFuel=0;
let projectiles=[],particles=[],explosions=[],damageLabels=[],mines=[],crates=[],girders=[],clouds=[],walkers=[];
let worldTime=0,last=performance.now(),cameraShake=0,crateRate=.58,initialMineCount=10;
let aiBusy=false,aiTimer=null;
let gameNow=performance.now(),turnWorm=null,turnEnding=false,attackCommitted=false;
let shotFocus=null,injuredWorms=[],injuryZoom=null;
function injuryMoving(w){return w.alive&&(!w.onGround||w.knockTime>0||Math.abs(w.vx)>.2)}
function injuryPending(){return injuredWorms.some(w=>injuryMoving(w)||w.hpAnim&&gameNow<w.hpAnim.at+w.hpAnim.duration)}
function rememberImpact(x,y){shotFocus={x,y,at:gameNow}}
function displayedHP(w){const a=w.hpAnim;if(!a||gameNow>=a.at+a.duration)return w.hp;const t=clamp((gameNow-a.at)/(a.duration-350),0,1);return lerp(a.from,a.to,t)}
function healthAnimating(){return teams.some(t=>t.worms.some(w=>w.hpAnim&&gameNow<w.hpAnim.at+w.hpAnim.duration))}
function presentationPending(){return !!(shotFocus&&gameNow-shotFocus.at<3000)||healthAnimating()||injuryPending()}
let combatTasks=[],taskSequence=0,retreatDuration=2.5,pendingEmissions=0,settledSince=null;
function scheduleCombat(fn,delay){const id=++taskSequence;combatTasks.push({id,at:gameNow+delay,fn});return id}
function cancelCombat(id){combatTasks=combatTasks.filter(t=>t.id!==id)}
function runCombatTasks(){const due=combatTasks.filter(t=>t.at<=gameNow);combatTasks=combatTasks.filter(t=>t.at>gameNow);for(const t of due){if(!gameOver)t.fn()}}
function combatUnsettled(){return projectiles.length>0||walkers.length>0||pendingEmissions>0||mines.some(m=>m.armed&&m.timer>0)||teams.some(t=>t.worms.some(w=>w.alive&&!w.onGround&&Math.abs(w.vy)>.75))}
function commitAttack(sec=2.5){attackCommitted=true;settledSince=null;turnLocked=true;retreatDuration=sec;charging=false;ui.powerBox.classList.remove('show');rope=null;jetpack=false;finishTarget()}
function resolveCombat(){if(turnEnding||gameOver)return;if(attackCommitted){if(combatUnsettled()||presentationPending()){settledSince=null;return}if(settledSince===null)settledSince=gameNow;if(gameNow-settledSince>=250){turnLocked=false;attackCommitted=false;retreatUntil=gameNow+retreatDuration*1000}}else if(!current()?.alive&&!turnLocked){nextTurn(0)}}
function clearInput(){heldControls.clear();cameraPointers.clear();dragCamera=null;for(const k of Object.keys(keys))keys[k]=false;charging=false;ui.powerBox.classList.remove('show')}
function setPaused(on){if(!started||gameOver)return;paused=on;physicsAccumulator=0;document.getElementById('pauseBtn').textContent=paused?'▶ 계속하기':'⏸ 일시정지';clearInput();if(paused)stopMusic();else if(musicEnabled)startMusic();updateHUD()}
const keys={};
const G=.225,MOVE=1.42,JUMP=-5.15,FALLMAX=9.5;

const ui={
  overlay:document.getElementById('overlay'),nameA:document.getElementById('nameA'),nameB:document.getElementById('nameB'),
  fillA:document.getElementById('fillA'),fillB:document.getElementById('fillB'),metaA:document.getElementById('metaA'),metaB:document.getElementById('metaB'),
  turnLabel:document.getElementById('turnLabel'),timer:document.getElementById('timer'),wind:document.getElementById('wind'),
  subhud:document.getElementById('subhud'),toast:document.getElementById('toast'),banner:document.getElementById('banner'),
  powerBox:document.getElementById('powerBox'),power:document.getElementById('power'),targetTip:document.getElementById('targetTip')
};

const weaponNames={
  bazooka:'로켓',grenade:'수류탄',shotgun:'산탄총',banana:'바나나탄',sacred:'성스러운 폭탄',cluster:'클러스터',
  homing:'유도 미사일',mortar:'박격포',airstrike:'공습',dynamite:'다이너마이트',mine:'지뢰',bat:'야구 배트',
  punch:'파이어 펀치',sheep:'양 폭탄',drill:'드릴',rope:'닌자 로프',jetpack:'제트팩',teleport:'텔레포트',girder:'거더'
};
const limited=['banana','sacred','cluster','homing','mortar','airstrike','dynamite','mine','punch','sheep','drill','jetpack','teleport','girder'];
const defaultAmmo={banana:1,sacred:1,cluster:3,homing:2,mortar:3,airstrike:1,dynamite:2,mine:3,punch:2,sheep:2,drill:2,jetpack:2,teleport:2,girder:3};

const teams=[
  {name:'플레이어',color:'#ef8d79',worms:[],ammo:{...defaultAmmo}},
  {name:'CPU',color:'#65c9b4',worms:[],ammo:{...defaultAmmo}}
];

function rand(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function dist(a,b,c,d){return Math.hypot(c-a,d-b)}
function screenX(x){return x-camera.x}
function screenY(y){return y-camera.y}
function worldFromScreen(sx,sy){return{x:sx/cameraZoom+camera.x,y:sy/cameraZoom+camera.y}}
