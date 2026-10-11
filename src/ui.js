'use strict';

function battlePhase(){
  if(gameOver)return {id:'over',text:'전투 종료',timer:'—'};
  if(!started)return {id:'ready',text:'전투 준비',timer:String(turnSec)};
  if(paused)return {id:'paused',text:'일시정지',timer:'Ⅱ'};
  if(turnEnding)return {id:'handoff',text:'다음 팀으로 교대',timer:'↔'};
  if(attackCommitted||turnLocked){const flying=projectiles.length||walkers.length||pendingEmissions;return {id:'resolve',text:flying?'공격 진행 중':'폭발·낙하 결과 확인',timer:'…'}};
  if(retreatUntil>gameNow)return {id:'retreat',text:'안전한 곳으로 후퇴',timer:((retreatUntil-gameNow)/1000).toFixed(1)};
  if(charging)return {id:'charge',text:'발사력 '+Math.round(clamp((gameNow-chargeAt)/1600,0,1)*100)+'%',timer:String(Math.max(0,Math.ceil(turnLeft)))};
  return {id:'aim',text:isCPU()?'CPU · '+(cpuStatus||'상황 판단 중'):'이동 · 무기 선택 · 조준',timer:String(Math.max(0,Math.ceil(turnLeft)))};
}
function updateHUD(){
  const max=Math.max(1,teams[0].worms.length*100);ui.fillA.style.width=100*teamHP(0)/max+'%';ui.fillB.style.width=100*teamHP(1)/max+'%';
  ui.metaA.textContent=`${teamHP(0)} HP · ${living(0).length}명`;ui.metaB.textContent=`${teamHP(1)} HP · ${living(1).length}명`;
  const w=current();ui.turnLabel.textContent=gameOver?'전투 종료':`${teams[activeTeam].name} · ${w?w.name:''} · ${weaponNames[selected]}`;
  const phase=battlePhase();ui.timer.textContent=phase.timer;ui.timer.dataset.phase=phase.id;
  ui.timer.setAttribute('aria-label',phase.text+' · '+phase.timer);ui.subhud.textContent=phase.text+(sudden?' · 수위 상승':'');
  ui.wind.textContent=`바람 ${Math.abs(wind*100).toFixed(1)} ${wind>=0?'→':'←'} · ${turnNo}턴`;
  document.getElementById('top').dataset.team=activeTeam;

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
