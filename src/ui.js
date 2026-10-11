'use strict';

function updateHUD(){
  const max=Math.max(1,teams[0].worms.length*100);ui.fillA.style.width=100*teamHP(0)/max+'%';ui.fillB.style.width=100*teamHP(1)/max+'%';
  ui.metaA.textContent=`${teamHP(0)} HP · ${living(0).length}명`;ui.metaB.textContent=`${teamHP(1)} HP · ${living(1).length}명`;
  const w=current();ui.turnLabel.textContent=gameOver?'전투 종료':`${teams[activeTeam].name} · ${w?w.name:''} · ${weaponNames[selected]}`;
  ui.timer.textContent=Math.max(0,Math.ceil(turnLeft));ui.wind.textContent=`바람 ${Math.abs(wind*100).toFixed(1)} ${wind>=0?'→':'←'} · ${turnNo}턴`;
  if(isCPU()&&!gameOver)ui.subhud.textContent=aiBusy?'CPU · '+(cpuStatus||'상황 판단 중'):'CPU 턴';
  else if(retreatUntil>gameNow)ui.subhud.textContent=`후퇴 ${(retreatUntil-gameNow)/1000|0}+초`;
  else ui.subhud.textContent=`맵 ${Math.round(WW)}×${Math.round(WH)}${sudden?' · 수위 상승 중':''}`;

  document.querySelectorAll('.weapon').forEach(b=>{
    const id=b.dataset.w;b.classList.toggle('active',id===selected);
    const am=b.querySelector('.ammo');if(limited.includes(id))am.textContent=teams[activeTeam].ammo[id]
  })
}
function toast(msg,dur=1300){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove('show'),dur)}
function bigBanner(msg,dur=1300){ui.banner.textContent=msg;ui.banner.classList.add('show');clearTimeout(bigBanner.t);bigBanner.t=setTimeout(()=>ui.banner.classList.remove('show'),dur)}

function clampCamera(){
  const cw=VW/cameraZoom,ch=VH/cameraZoom,minX=Math.min(0,(WW-cw)/2),minY=Math.min(0,(WH-ch)/2);
  camera.x=clamp(camera.x,minX,Math.max(minX,WW-cw));camera.y=clamp(camera.y,minY,Math.max(minY,WH-ch));
  camera.targetX=camera.x;camera.targetY=camera.y
}
function focusOn(x,y,instant=false){
  const cw=VW/cameraZoom,ch=VH/cameraZoom,minX=Math.min(0,(WW-cw)/2),minY=Math.min(0,(WH-ch)/2);
  camera.targetX=clamp(x-cw*.5,minX,Math.max(minX,WW-cw));camera.targetY=clamp(y-ch*.46,minY,Math.max(minY,WH-ch));
  if(instant){camera.x=camera.targetX;camera.y=camera.targetY}
}
function setCameraZoom(value,sx=VW/2,sy=VH/2){
  const point=worldFromScreen(sx,sy);cameraZoom=clamp(value,Math.min(.35,VW/WW,VH/WH),1.8);
  camera.x=point.x-sx/cameraZoom;camera.y=point.y-sy/cameraZoom;clampCamera();camera.manualUntil=Infinity
}
function toggleOverview(){overview=!overview;if(overview){setCameraZoom(Math.min(VW/WW,VH/WH));focusOn(WW/2,WH/2,true)}else followWorm();document.getElementById('overviewBtn').textContent=overview?'전투 보기':'전체 맵'}
function followWorm(){overview=false;document.getElementById('overviewBtn').textContent='전체 맵';cameraZoom=1;camera.manualUntil=0;const w=current();if(w)focusOn(w.x,w.y,true)}
function panCamera(dx,dy){overview=false;camera.x+=dx/cameraZoom;camera.y+=dy/cameraZoom;clampCamera();camera.manualUntil=Infinity}
function updateCamera(dt){
  if(gameNow<camera.manualUntil||overview)return;
  const f=projectiles[0]||walkers[0]||current();if(f)focusOn(f.x,f.y,false);
  camera.x=lerp(camera.x,camera.targetX,1-Math.pow(.002,dt));camera.y=lerp(camera.y,camera.targetY,1-Math.pow(.002,dt))
}
