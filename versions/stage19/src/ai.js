'use strict';

let cpuWalk=null,cpuStatus='';
const cpuLevels={easy:{move:75,angles:12,powers:.18,error:9},normal:{move:130,angles:8,powers:.12,error:4},hard:{move:180,angles:6,powers:.10,error:1}};
function scheduleAI(){cpuWalk=null;cpuStatus='상황 판단 중';aiBusy=true;updateHUD();aiTimer=scheduleCombat(cpuAct,650)}
function nearestEnemy(w){return living(1-w.team).slice().sort((a,b)=>dist(w.x,w.y,a.x,a.y)-dist(w.x,w.y,b.x,b.y))[0]}
// Probe one walking segment without mutating the terrain or live worm.
function cpuSafeStep(w,dir){
 const nx=w.x+dir*4;if(nx<w.r+8||nx>WW-w.r-8)return null;
 let y=w.y;
 if(bodyBlocked(w,nx,y)){if(bodyBlocked(w,nx,y-6))return null;y-=6}
 let supported=false;
 for(let drop=0;drop<=12;drop++){if(pointBlocked(nx,y+w.r+.5)){supported=true;break}y++}
 if(!supported||y>waterY-30||bodyBlocked(w,nx,y))return null;
 if(mines.some(m=>m.armed&&dist(nx,y,m.x,m.y)<52))return null;
 if(teams.some(t=>t.worms.some(o=>o.alive&&!(o.team===w.team&&o.idx===w.idx)&&dist(nx,y,o.x,o.y)<w.r+o.r+2)))return null;
 return {x:nx,y};
}
function cpuPositionValue(w,target){
 const d=dist(w.x,w.y,target.x,target.y);
 let value=-Math.abs(d-250)*.025;
 for(const c of crates)if(!c.taken&&c.type==='health'&&w.hp<75)value+=Math.max(0,110-dist(w.x,w.y,c.x,c.y))*.2;
 for(const m of mines)if(m.armed)value-=Math.max(0,95-dist(w.x,w.y,m.x,m.y));
 return value;
}
function chooseCpuMove(w,target){
 const limit=cpuLevels[difficulty].move;let best={value:cpuPositionValue(w,target),x:w.x};
 for(const dir of [-1,1]){let probe={...w};for(let i=4;i<=limit;i+=4){const step=cpuSafeStep(probe,dir);if(!step)break;Object.assign(probe,step);const value=cpuPositionValue(probe,target)-i*.005;if(value>best.value+.2)best={value,x:probe.x}}}
 return best.x;
}
function cpuMoveDirection(w){
 if(!cpuWalk||cpuWalk.w!==w||turnEnding||gameOver||turnLocked||!isCPU()){cpuWalk=null;return 0}
 if(gameNow>=cpuWalk.until||Math.abs(cpuWalk.x-w.x)<5||turnLeft<7||!cpuSafeStep(w,Math.sign(cpuWalk.x-w.x))){cpuWalk=null;w.vx=0;cpuStatus='사격 계산 중';aiTimer=scheduleCombat(cpuShoot,200);return 0}
 return Math.sign(cpuWalk.x-w.x);
}
function cpuAct(){
 if(!isCPU()||gameOver||paused||turnLocked||turnEnding)return;
 const w=current(),target=w&&nearestEnemy(w);if(!target){nextTurn(0);return}
 const x=chooseCpuMove(w,target);focusOn(w.x,w.y,false);
 if(Math.abs(x-w.x)>8&&w.onGround&&turnLeft>9){cpuWalk={w,x,until:gameNow+3500};cpuStatus='안전한 위치로 이동 중'}else cpuShoot();
}
function cpuBlastValue(w,type,end){
 if(['water','bounds','limit'].includes(end.event))return -100;
 const profile=weaponBalance[type];let value=0;
 for(const t of teams)for(const o of t.worms){if(!o.alive)continue;const d=dist(end.x,end.y,o.x,o.y);const hit=profile.damage*Math.max(0,1-d/profile.radius);value+=(o.team===w.team?-2.2:1)*Math.min(o.hp,hit);if(o.team!==w.team&&hit>=o.hp&&hit>0)value+=18}
 return value-(limited.includes(type)?3:0);
}
function planCpuShot(w){
 const cfg=cpuLevels[difficulty],targets=living(1-w.team).slice().sort((a,b)=>dist(w.x,w.y,a.x,a.y)-dist(w.x,w.y,b.x,b.y)).slice(0,2);
 let best={score:-Infinity,type:'bazooka',angle:-45,power:.65,face:1,target:targets[0]},simulations=0;
 const types=['bazooka','grenade','homing'].filter(type=>!limited.includes(type)||teams[w.team].ammo[type]>0);
 for(const target of targets){const face=target.x>=w.x?1:-1;for(const type of types)for(let angle=-82;angle<=6;angle+=cfg.angles)for(let power=.28;power<=1.001;power+=cfg.powers){
 const end=simulateShot(w,type,power,angle,face,type==='homing'?{x:target.x,y:target.y}:null);simulations++;
 const score=cpuBlastValue(w,type,end)-dist(end.x,end.y,target.x,target.y)*.025;
 if(score>best.score)best={score,type,angle,power,face,target};
 }}best.simulations=simulations;return best;
}
function cpuShoot(){
 if(!isCPU()||gameOver||paused||turnLocked||turnEnding)return;
 const w=current(),target=w&&nearestEnemy(w);if(!w||!w.alive||!target){nextTurn(0);return}
 cpuWalk=null;w.vx=0;cpuStatus='사격 계산 중';facing=target.x>=w.x?1:-1;
 if(dist(w.x,w.y,target.x,target.y)<43){selected='bat';aiBusy=false;meleeBat();return}
 const plan=planCpuShot(w),cfg=cpuLevels[difficulty];
 // Preserve the computed solution on hard; lower levels have a bounded aiming error.
 const angle=clamp(plan.angle+rand(-cfg.error,cfg.error),-86,10),power=clamp(plan.power+rand(-cfg.error,cfg.error)/250,.18,1);
 selected=plan.type;aim=angle;facing=plan.face;updateHUD();const turn=turnNo;
 aiTimer=scheduleCombat(()=>{
 if(gameOver||turnEnding||!isCPU()||current()!==w||turnNo!==turn||!w.alive||attackCommitted)return;
 aiBusy=false;cpuStatus='';
 if(plan.score<0){toast('CPU가 안전한 사격을 찾지 못해 턴을 넘깁니다');nextTurn(0);return}
 if(!hasAmmo(plan.type)){nextTurn(0);return}spend(plan.type);
 spawnBallistic(plan.type,w,power,angle,plan.face,plan.type==='homing'?{x:plan.target.x,y:plan.target.y}:null);updateHUD();
 },difficulty==='easy'?650:350);
}
function findShotSolution(w,target,type){
  const angles=[];for(let a=-82;a<=-18;a+=4)angles.push(a);
  const powers=[];for(let p=.28;p<=1.001;p+=.06)powers.push(p);
  let best={score:1e9,angle:-45,power:.7};
  const missNoise=difficulty==='easy'?rand(65,150):difficulty==='normal'?rand(20,65):rand(4,20);
  for(const angle of angles)for(const power of powers){
    const end=simulateShot(w,type,power,angle,target.x>=w.x?1:-1);
    const score=dist(end.x,end.y,target.x,target.y)+(end.hit?0:35);
    if(score<best.score)best={score,angle,power}
  }
  best.angle=clamp(best.angle+rand(-3,3)*(difficulty==='hard'?.35:1),-86,-12);
  best.power=clamp(best.power+rand(-.03,.03),.18,1);
  if(Math.random()<.55&&missNoise>0)best.power=clamp(best.power+rand(-missNoise,missNoise)/1100,.18,1);
  return best
}
function simulateShot(w,type,pwr,ang,face,target=null){
  const p=createBallistic(type,w,pwr,ang,face,target),maxSteps=Math.ceil(p.life/FIXED_DT)+1;
  for(let i=0;i<maxSteps;i++){const event=advanceBallistic(p,FIXED_DT);if(event)return{x:p.x,y:p.y,hit:!['water','bounds'].includes(event),event,steps:i+1,bounces:(ballisticRules[type].bounce||0)-p.bounce}}
  return{x:p.x,y:p.y,hit:false,event:'limit',steps:maxSteps,bounces:0}
}
