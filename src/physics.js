'use strict';

function pointBlocked(x,y){return solid(x,y)||girders.some(g=>x>=g.x-g.w/2&&x<=g.x+g.w/2&&y>=g.y-g.h/2&&y<=g.y+g.h/2)}
function bodyBlocked(w,x,y){
  const r=w.r-.6;
  return pointBlocked(x,y)||pointBlocked(x-r,y)||pointBlocked(x+r,y)||pointBlocked(x,y-r)||pointBlocked(x,y+r)||pointBlocked(x-r*.7,y-r*.7)||pointBlocked(x+r*.7,y-r*.7)||pointBlocked(x-r*.7,y+r*.7)||pointBlocked(x+r*.7,y+r*.7)
}
function moveBody(w,dx,dy,stepUp=false){
  const count=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))));let hitDown=false;
  for(let i=0;i<count;i++){
    const nx=clamp(w.x+dx/count,w.r,WW-w.r);
    if(!bodyBlocked(w,nx,w.y))w.x=nx;
    else if(stepUp&&!bodyBlocked(w,nx,w.y-6)){w.x=nx;w.y-=6}else w.vx=0;
    const ny=w.y+dy/count;
    if(!bodyBlocked(w,w.x,ny))w.y=ny;else{if(dy>0)hitDown=true;w.vy=0}
  }
  w.onGround=hitDown||pointBlocked(w.x,w.y+w.r+.2);return hitDown
}
function wormStep(w,dt){
  if(!w.alive)return;const cw=current(),deploying=deploymentRetreatActive(),can=started&&!paused&&!gameOver&&(!turnLocked||deploying)&&w===cw&&(projectiles.length===0||deploying)&&walkers.length===0&&!isCPU();
  w.knockTime=Math.max(0,(w.knockTime||0)-dt);
  if(jetpack&&w===cw&&can){
    jetFuel-=dt;if(keys.a){w.vx-=.16;facing=-1}if(keys.d){w.vx+=.16;facing=1}
    w.vy+=.07;if(keys.w)w.vy-=.24;if(keys.s)w.vy+=.20;w.vx=clamp(w.vx*.97,-4,4);w.vy=clamp(w.vy*.97,-5,5);
    moveBody(w,w.vx,w.vy);if(jetFuel<=0){jetpack=false;w.knockTime=.45;playSFX('jetpackStop');toast('쌍날개팩 연료 소진');startRetreat(2)}
  }else if(rope&&w===cw){
    if(!pointBlocked(rope.ax,rope.ay)){rope=null;w.knockTime=.45;playSFX('ropeRelease');toast('로프 고정점이 사라졌습니다');return}
    if(can){if(keys.a)w.vx-=.14;if(keys.d)w.vx+=.14;if(keys.w)rope.len=clamp(rope.len-1.5,30,300);if(keys.s)rope.len=clamp(rope.len+1.5,30,300)}
    w.vy+=G*.65;w.vx=clamp(w.vx*.997,-9,9);w.vy=clamp(w.vy*.997,-9,9);
    let nx=w.x+w.vx,ny=w.y+w.vy;const dx=nx-rope.ax,dy=ny-rope.ay,d=Math.max(1,Math.hypot(dx,dy));
    if(d>rope.len){nx=rope.ax+dx/d*rope.len;ny=rope.ay+dy/d*rope.len;const radial=(w.vx*dx+w.vy*dy)/(d*d);w.vx-=dx*radial;w.vy-=dy*radial}
    moveBody(w,nx-w.x,ny-w.y)
  }else{
    const wasGround=w.onGround,knocked=w.knockTime>0;
    const cpuDir=w===cw&&!knocked&&isCPU()&&!turnLocked&&!turnEnding&&projectiles.length===0?cpuMoveDirection(w):0;
    if(cpuDir){w.vx+=cpuDir*MOVE*.11;facing=cpuDir}
    if(can&&!knocked){if(keys.a||keys.ArrowLeft){w.vx-=MOVE*.11;facing=-1}if(keys.d||keys.ArrowRight){w.vx+=MOVE*.11;facing=1}}
    w.vx*=knocked||!wasGround?.985:.82;w.vx=clamp(w.vx,knocked||!wasGround?-12:-MOVE,knocked||!wasGround?12:MOVE);w.vy=Math.min(FALLMAX,w.vy+G);
    const impact=w.vy,oldX=w.x,landed=moveBody(w,w.vx,w.vy,wasGround&&!knocked);
    if(landed){w.jumpState=0;if(!wasGround&&impact>1.4)playSFX('land');if(impact>6.25){const fd=(impact-6.25)*9.5;damage(w,fd);if(fd>8)toast(`${w.name} 낙하 피해 ${Math.round(fd)}`)}}
    if(w.onGround&&wasGround&&!knocked&&Math.abs(w.x-oldX)>.2&&gameNow-(w.stepSoundAt??-Infinity)>190){w.stepSoundAt=gameNow;playSFX('step')}
  }
  for(const c of crates)if(!c.taken&&dist(w.x,w.y,c.x,c.y)<19)pickup(w,c);
  if(w.y>waterY-2){killWater(w);if(w===cw&&!turnLocked)nextTurn(700)}w.hurt=Math.max(0,w.hurt-dt*2)
}
function updateMines(dt){
  for(const m of mines){if(!m.armed)continue;if(m.timer>0){m.timer-=dt;if(m.timer<=0){m.armed=false;explode(m.x,m.y,55,52,'mine')}}
    else if(gameNow>=(m.armAt??0)&&teams.some(t=>t.worms.some(w=>w.alive&&dist(m.x,m.y,w.x,w.y)<38))){m.timer=.65;playSFX('mine')}}
}
function jump(){
  const w=current(),deploying=deploymentRetreatActive();if(!w||!w.alive||paused||(turnLocked&&!deploying)||(projectiles.length&&!deploying)||walkers.length||gameOver||isCPU()||rope||jetpack)return;
  if(w.onGround){w.vy=JUMP;w.onGround=false;w.jumpAt=gameNow;w.jumpState=1;playSFX('jump')}
  else if(w.jumpState===1&&gameNow-w.jumpAt<=330){w.vy=-6.25;w.vx=-facing*2.6;w.knockTime=.4;w.jumpState=2;toast('백플립!',600);playSFX('jump')}
}

function updateEffects(dt){
  for(const label of damageLabels){label.life-=dt;label.y-=dt*24}damageLabels=damageLabels.filter(label=>label.life>0);
  for(const e of explosions)e.life-=dt*2.5;explosions=explosions.filter(e=>e.life>0);
  for(const p of particles){p.life-=dt;p.vy+=.08*dt*60;p.x+=p.vx*dt*60;p.y+=p.vy*dt*60}particles=particles.filter(p=>p.life>0);
  for(const c of clouds){c.x+=c.v*dt*60;if(c.x>WW+180)c.x=-180}
  if(cameraShake>0){cameraShake*=Math.pow(.86,dt*60);if(cameraShake<.35)cameraShake=0}
}
