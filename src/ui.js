'use strict';

function battlePhase(){
  if(gameOver)return {id:'over',text:'전투 종료',timer:'—'};
  if(!started)return {id:'ready',text:'전투 준비',timer:String(turnSec)};
  if(paused)return {id:'paused',text:'일시정지',timer:'Ⅱ'};
  if(practice)return {id:'practice',text:practice.complete?'탄도 비교':practice.prediction?'발사 진행 중':'시간 제한 없음',timer:'∞'};
  if(wormIntro)return {id:'intro',text:wormIntro.overview?'양 팀 전체 위치':'전장 둘러보기 · '+(wormIntro.index+1)+' / '+wormIntro.worms.length,timer:(2-wormIntro.elapsed).toFixed(1)};
  if(turnEnding)return {id:'handoff',text:'다음 팀으로 교대',timer:'↔'};
  if(deploymentRetreatActive())return {id:'retreat',text:'설치한 폭탄에서 벗어나세요',timer:((deploymentRetreatUntil-gameNow)/1000).toFixed(1)};
  if(attackCommitted||turnLocked){const flying=projectiles.length||walkers.length||pendingEmissions;return {id:'resolve',text:flying?'공격 진행 중':healthAnimating()?'체력 감소 표시 중':deathPending()?'사망 연출 중':'충돌 화면 확인',timer:'…'}};
  if(retreatUntil>gameNow)return {id:'retreat',text:'안전한 곳으로 후퇴',timer:((retreatUntil-gameNow)/1000).toFixed(1)};
  if(charging)return {id:'charge',text:'발사력 '+Math.round(clamp((gameNow-chargeAt)/1600,.12,1)*100)+'%',timer:String(Math.max(0,Math.ceil(turnLeft)))};
  return {id:'aim',text:isCPU()?'CPU · '+(cpuStatus||'상황 판단 중'):'이동 · 무기 선택 · 조준',timer:String(Math.max(0,Math.ceil(turnLeft)))};
}
const weaponGroups=[
  {name:'공격',items:{bazooka:'바람의 영향을 받는 포탄',grenade:'튕긴 뒤 폭발',shotgun:'직선으로 두 번 발사',banana:'폭발하면 파편이 흩어짐',sacred:'넓은 범위에 폭발',cluster:'작은 캡슐로 흩어짐',homing:'지정한 목표를 향해 이동',mortar:'높이 날아가 파편 방출',airstrike:'지정한 위치에 공중 지원',bat:'가까운 상대를 밀어냄',punch:'가까운 상대를 위로 띄움',sheep:'지면을 따라 달린 뒤 폭발',drill:'아래 지형을 파고듦'}},
  {name:'설치',items:{dynamite:'설치 후 시간이 지나면 폭발',mine:'가까이 다가오면 작동',girder:'지정한 자리에 발판 설치'}},
  {name:'이동',items:{rope:'지형에 줄을 걸어 이동',jetpack:'연료가 있는 동안 비행',teleport:'지정한 위치로 순간 이동'}}
];
const weaponUses=Object.assign({},...weaponGroups.map(group=>group.items));
const weaponDockButtons=[...document.querySelectorAll('#weaponDock .weapon')];
const weaponDialog=document.getElementById('weaponDialog');
const weaponPicker=document.getElementById('weaponPickerBtn');
let pendingWeapon=null;
const ammoLabel=id=>limited.includes(id)?'남은 수량 '+teams[activeTeam].ammo[id]:'무제한';

function openWeaponPicker(){
  if(!canSelectWeapon())return;
  const container=document.getElementById('weaponGroups');
  container.replaceChildren();
  for(const group of weaponGroups){
    const section=document.createElement('section'),heading=document.createElement('h3'),grid=document.createElement('div');
    heading.textContent=group.name;
    grid.className='weaponGroupGrid';
    for(const [id,use] of Object.entries(group.items)){
      const button=document.createElement('button'),name=document.createElement('strong'),description=document.createElement('span');
      button.type='button';
      button.className='weaponOption';
      button.disabled=!hasAmmo(id);
      button.setAttribute('aria-pressed',String(id===selected));
      name.textContent=weaponNames[id]+' · '+ammoLabel(id);
      description.textContent=use;
      button.append(name,description);
      button.addEventListener('click',()=>{pendingWeapon=id;weaponDialog.close()});
      grid.append(button);
    }
    section.append(heading,grid);
    container.append(section);
  }
  pendingWeapon=null;
  openGameDialog(weaponDialog);
}
weaponPicker.addEventListener('click',openWeaponPicker);
document.getElementById('weaponDialogClose').addEventListener('click',()=>weaponDialog.close());
weaponDialog.addEventListener('close',()=>{
  closeGameDialog();
  if(pendingWeapon){playSFX('click');selectWeapon(pendingWeapon)}
  pendingWeapon=null;
});

function updateHUD(){
  const max=Math.max(1,teams[0].worms.length*100);ui.fillA.style.width=100*teamHP(0)/max+'%';ui.fillB.style.width=100*teamHP(1)/max+'%';
  ui.metaA.textContent=`${teamHP(0)} HP · ${living(0).length}명`;ui.metaB.textContent=`${teamHP(1)} HP · ${living(1).length}명`;
  const w=wormIntro?wormIntro.worms[wormIntro.index]:current();ui.turnLabel.textContent=gameOver?'전투 종료':wormIntro?`${teams[w.team].name} · ${w.name}`:`${teams[activeTeam].name} · ${w?w.name:''} · ${weaponNames[selected]}`;
  const phase=battlePhase(),arrow=wind>=0?'→':'←',windSpeed=Math.abs(wind*100).toFixed(1);
  const turn=mode==='cpu'?(isCPU()?'PC 차례':'내 차례'):(activeTeam===0?'A팀 차례':'B팀 차례');
  const mobile=document.documentElement.dataset.mobile==='true';
  ui.timer.textContent=/^\d+$/.test(phase.timer)?phase.timer+'초':phase.timer;ui.timer.dataset.phase=phase.id;
  ui.timer.setAttribute('aria-label',phase.text+' · '+ui.timer.textContent);ui.subhud.textContent=phase.text+(sudden?' · 수위 상승':'');
  ui.wind.textContent=`바람 ${arrow} ${windSpeed} · ${turnNo}턴`;
  if(mobile){
    const status={aim:turn,charge:turn,resolve:{'공격 진행 중':'발사 중','체력 감소 표시 중':'피해 표시','사망 연출 중':'전투 연출','충돌 화면 확인':'착탄 확인'}[phase.text],retreat:'후퇴',handoff:'턴 교대'}[phase.id]||phase.text;
    ui.subhud.textContent=practice?'한 발 연습 · 바람 없음':wormIntro?status:`${status} · 바람 ${arrow} ${windSpeed}`;
  }
  document.getElementById('top').dataset.team=activeTeam;
  document.getElementById('sessionControls').hidden=!started;
  document.getElementById('ui').classList.toggle('aiming',canShowAimGuide());
  document.getElementById('ui').classList.toggle('openingView',initialBattleView);
  const previewButton=document.getElementById('previewFitBtn');previewButton.setAttribute('aria-pressed',String(previewFit));previewButton.textContent=previewFit?'봇 보기':'탄도 전체';
  const angle=Math.round(-aim),preset=document.getElementById('aimPreset');document.getElementById('aimCurrent').textContent=angle+'°';preset.value=[0,30,45,60,90].includes(angle)?String(angle):'custom';
  const percent=Math.round(shotPower()*100);
  const usesPower=!['rope','homing'].includes(selected);
  document.getElementById('aimReadout').textContent='각도 '+angle+'°'+(usesPower?' · 힘 '+(selected==='shotgun'&&shotgunRemain===1?100:percent)+'%':'');
  document.getElementById('fireButtonText').textContent=charging?percent+'%':'발사';
  const coach=document.getElementById('fireCoach');
  coach.hidden=!!practice||phase.id!=='aim'||turnNo!==1||firstShotFired||!canShowAimGuide()||!usesPower;
  coach.textContent=(mobile?'발사 버튼':'Space')+'을 누르고 힘을 모아, 놓으면 발사돼요.';
  weaponPicker.disabled=!canSelectWeapon()&&!weaponDialog.open;
  document.getElementById('weaponQuickName').textContent=weaponNames[selected]+' · '+ammoLabel(selected);
  document.getElementById('weaponQuickUse').textContent=weaponUses[selected];

  weaponDockButtons.forEach(b=>{
    const id=b.dataset.w;b.classList.toggle('active',id===selected);b.setAttribute('aria-pressed',String(id===selected));
    const label=weaponNames[id]+' · '+ammoLabel(id)+' · '+weaponUses[id];
    if(b.title!==label){b.title=label;b.setAttribute('aria-label',label)}
    const am=b.querySelector('.ammo');if(limited.includes(id))am.textContent=teams[activeTeam].ammo[id]
  })
  if(practice)updatePracticeHUD(angle);
}
function updatePracticeHUD(angle){
  if(angle===30)practice.aimed=true;
  const message=document.getElementById('practiceStep');
  let text;
  if(practice.complete){
    const {angle,power,end}=practice.prediction;
    const matched=dist(end.x,end.y,practice.impact.x,practice.impact.y)<2;
    text=`${angle}° · 힘 ${power}% · 노란 점선은 예상, 파란 실선은 실제. ${matched?'도착점이 일치했어요.':'두 도착점을 비교해 보세요.'}`;
  }else if(practice.prediction)text='실제 포탄이 날아가는 모습을 보세요.';
  else if(!practice.aimed)text='각도 선택에서 30°를 골라 보세요.';
  else text=(isMobileDevice()?'발사 버튼':'Space 또는 발사 버튼')+'을 누르고 힘을 모아, 놓아 보세요.';
  if(message.textContent!==text)message.textContent=text;
}
function capturePracticeShot(trace,power){
  practice.prediction={...trace,angle:Math.round(-aim),power:Math.round(power*100)};
  practice.path=[trace.points[0]];
}
function trackPracticeShot(projectile,ended){
  const position={x:projectile.x,y:projectile.y};
  practice.path.push(position);
  if(!ended)return;
  practice.impact=position;
  practice.completeAt=gameNow+700;
}
function finishPractice(){
  practice.complete=true;
  document.getElementById('ui').classList.add('comparing');
  document.getElementById('practiceActions').hidden=false;
  fitPracticeView();
  document.getElementById('practiceRetry').focus();
}
function fitPracticeView(){
  const points=practice.path,minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
  const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const top=78,bottom=VH-112;
  cameraZoom=Math.min(1,Math.max(32,VW-72)/Math.max(40,maxX-minX),Math.max(32,bottom-top)/Math.max(40,maxY-minY));
  camera.x=camera.targetX=(minX+maxX)/2-VW/2/cameraZoom;
  camera.y=camera.targetY=(minY+maxY)/2-(top+bottom)/2/cameraZoom;
  camera.manualUntil=Infinity;
}
function toast(msg,dur=1300){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove('show'),dur)}
function bigBanner(msg,dur=1300){ui.banner.textContent=msg;ui.banner.classList.add('show');clearTimeout(bigBanner.t);bigBanner.t=setTimeout(()=>ui.banner.classList.remove('show'),dur)}

function clampCamera(){
  const cw=VW/cameraZoom,ch=VH/cameraZoom,minX=Math.min(0,(WW-cw)/2),minY=Math.min(0,(WH-ch)/2);
  camera.x=clamp(camera.x,minX,Math.max(minX,WW-cw));camera.y=clamp(camera.y,minY,Math.max(minY,WH-ch));
  camera.targetX=camera.x;camera.targetY=camera.y
}
function focusOn(x,y,instant=false){
  const cw=VW/cameraZoom,ch=VH/cameraZoom,minX=Math.min(0,(WW-cw)/2),minY=Math.min(0,(WH-ch)/2,projectiles.length?y-ch*.46:0);
  const aimSpace=VH<=360&&VW>VH&&matchMedia('(pointer:coarse)').matches&&canShowAimGuide();
  camera.targetX=clamp(x-cw*.5,minX,Math.max(minX,WW-cw));camera.targetY=clamp(y-ch*(aimSpace ? .58 : .46),minY,Math.max(minY,WH-ch));
  if(instant){camera.x=camera.targetX;camera.y=camera.targetY}
}
function fitBattleView(){
  const units=teams.flatMap(t=>t.worms).filter(w=>w.alive);if(!units.length)return;
  const css=getComputedStyle(document.documentElement),safe=k=>parseFloat(css.getPropertyValue('--safe-'+k))||0;
  const mobile=document.documentElement.dataset.mobile==='true',left=safe('left')+48,right=VW-safe('right')-48;
  const short=mobile&&VH<=320,upper=safe('top')+(mobile?(short?76:84):155),lower=VH-safe('bottom')-(mobile?(short?100:112):180);
  const minX=Math.min(...units.map(w=>w.x)),maxX=Math.max(...units.map(w=>w.x)),minY=Math.min(...units.map(w=>w.y)),maxY=Math.max(...units.map(w=>w.y));
  cameraZoom=Math.max(.02,Math.min(1,(right-left)/Math.max(1,maxX-minX+120),(lower-upper-(short?64:84))/Math.max(40,maxY-minY)));
  camera.x=(minX+maxX)/2-(left+right)/2/cameraZoom;camera.y=(minY+maxY)/2-(upper+lower+(short?44:64))/2/cameraZoom;
  camera.targetX=camera.x;camera.targetY=camera.y;camera.manualUntil=0;
}
function fitShotPreview(instant=false,dt=FIXED_DT){
  const trace=getShotPreview();if(!trace)return;const w=current(),points=[...trace.points,{x:w.x,y:w.y}],left=40,right=VW-40,top=VH<500?94:150,bottom=VH-(VH<500?142:180);
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const zoom=Math.max(.02,Math.min(1,(right-left)/Math.max(1,maxX-minX+110),(bottom-top)/Math.max(1,maxY-minY+160)));
  const blend=instant?1:1-Math.pow(.001,dt);cameraZoom=zoom<cameraZoom?zoom:lerp(cameraZoom,zoom,blend);
  camera.targetX=(minX+maxX)/2-(left+right)/2/cameraZoom;camera.targetY=(minY+maxY)/2-(top+bottom)/2/cameraZoom;camera.x=lerp(camera.x,camera.targetX,blend);camera.y=lerp(camera.y,camera.targetY,blend);camera.manualUntil=0;
}
function togglePreviewFit(){if(!canShowAimGuide())return;if(!getShotPreview()){toast('목표를 선택하면 예상 경로가 표시됩니다');return}if(previewFit){followWorm();return}previewFit=true;initialBattleView=false;overview=false;document.getElementById('overviewBtn').textContent='전체 맵';fitShotPreview(true);updateHUD()}
function setCameraZoom(value,sx=VW/2,sy=VH/2){
  if(wormIntro||orientationBlocked)return;
  injuryZoom=null;initialBattleView=false;previewFit=false;
  const point={x:sx/cameraZoom+camera.x,y:sy/cameraZoom+camera.y};cameraZoom=clamp(value,Math.min(.35,VW/WW,VH/WH),1.8);
  camera.x=point.x-sx/cameraZoom;camera.y=point.y-sy/cameraZoom;clampCamera();camera.manualUntil=Infinity
}
function toggleOverview(){if(wormIntro||orientationBlocked)return;overview=!overview;if(overview){setCameraZoom(Math.min(VW/WW,VH/WH));focusOn(WW/2,WH/2,true)}else followWorm();document.getElementById('overviewBtn').textContent=overview?'전투 보기':'전체 맵'}
function followWorm(){if(wormIntro||orientationBlocked)return;initialBattleView=false;previewFit=false;injuryZoom=null;overview=false;document.getElementById('overviewBtn').textContent='전체 맵';cameraZoom=1;camera.manualUntil=0;const w=current();if(w)focusOn(w.x,w.y,true)}
function panCamera(dx,dy){if(wormIntro||orientationBlocked)return;initialBattleView=false;previewFit=false;injuryZoom=null;overview=false;camera.x+=dx/cameraZoom;camera.y+=dy/cameraZoom;clampCamera();camera.manualUntil=Infinity}
function injuryFrame(){
  const victims=injuredWorms.filter(w=>w.alive||deathAnimating(w)||w.hpAnim&&gameNow<w.hpAnim.at+w.hpAnim.duration);
  if(!victims.length||!presentationPending())return null;
  // Reserve space for the HUD and keep labels readable at every zoom.
  const short=VH<=320,top=short?70:VH<500?84:150,bottom=short?105:VH<500?128:180;
  const left=72,right=VW-72,upper=Math.min(top,VH*.3),lower=Math.max(upper+90,VH-bottom);
  const minX=Math.min(...victims.map(w=>w.x)),maxX=Math.max(...victims.map(w=>w.x));
  const minY=Math.min(...victims.map(w=>w.y)),maxY=Math.max(...victims.map(w=>w.y));
  const head=short?80:120,foot=16,zoom=Math.max(.02,Math.min(1,injuryZoom??cameraZoom,(right-left)/Math.max(1,maxX-minX),(lower-upper-head-foot)/Math.max(1,maxY-minY)));
  return {minX,maxX,minY,maxY,left,right,upper,lower,head,foot,zoom};
}
function updateCamera(dt){
  if(wormIntro)return;
  if(previewFit&&canShowAimGuide()){if(targetMode!=='homing')fitShotPreview(false,dt);return}
  if(initialBattleView){if(!attackCommitted&&!projectiles.length&&!walkers.length&&!presentationPending()){fitBattleView();return}initialBattleView=false;cameraZoom=1;camera.manualUntil=0}
  if(gameNow<camera.manualUntil||overview)return;
  const blend=1-Math.pow(.002,dt);
  if(injuredWorms.length&&presentationPending()){
    if(injuryZoom===null)injuryZoom=cameraZoom;
    const frame=injuryFrame();
    if(frame){
      // Zoom out immediately to retain every victim; ease zooming back in.
      cameraZoom=frame.zoom<cameraZoom?frame.zoom:lerp(cameraZoom,frame.zoom,blend);
      const z=cameraZoom;
      camera.targetX=(frame.minX+frame.maxX)/2-VW/2/z;
      camera.targetY=(frame.minY+frame.maxY)/2-(frame.upper+frame.lower+frame.head-frame.foot)/2/z;
      camera.x=lerp(camera.x,camera.targetX,blend);camera.y=lerp(camera.y,camera.targetY,blend);
      // Constrain smoothing so fast knockback never leaves a victim offscreen.
      camera.x=clamp(camera.x,frame.maxX-frame.right/z,frame.minX-frame.left/z);
      camera.y=clamp(camera.y,frame.maxY-(frame.lower-frame.foot)/z,frame.minY-(frame.upper+frame.head)/z);
      return;
    }
  }
  if(!presentationPending())injuredWorms=[];
  if(injuryZoom!==null){cameraZoom=lerp(cameraZoom,injuryZoom,blend);if(Math.abs(cameraZoom-injuryZoom)<.002){cameraZoom=injuryZoom;injuryZoom=null}}
  const f=projectiles[0]||walkers[0]||(presentationPending()?shotFocus:null)||current();if(f)focusOn(f.x,f.y,false);
  camera.x=lerp(camera.x,camera.targetX,blend);camera.y=lerp(camera.y,camera.targetY,blend)
}
