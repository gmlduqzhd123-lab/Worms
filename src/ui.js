'use strict';

function battlePhase(){
  if(gameOver)return {id:'over',text:'전투 종료',timer:'—'};
  if(!started)return {id:'ready',text:'전투 준비',timer:String(turnSec)};
  if(paused)return {id:'paused',text:'일시정지',timer:'Ⅱ'};
  if(pairNeedsReady)return {id:'pairReady',text:(activeTeam+1)+'P 준비 대기',timer:String(turnSec)};
  if(practice)return {id:'practice',text:practice.complete?'탄도 비교':practice.prediction?'발사 진행 중':'시간 제한 없음',timer:'∞'};
  if(wormIntro)return {id:'intro',text:wormIntro.overview?'양 팀 전체 위치':'전장 둘러보기 · '+(wormIntro.index+1)+' / '+wormIntro.worms.length,timer:(2-wormIntro.elapsed).toFixed(1)};
  if(turnEnding)return {id:'handoff',text:'다음 팀으로 교대',timer:'↔'};
  if(deploymentRetreatActive())return {id:'retreat',text:'설치한 폭탄에서 벗어나세요',timer:((deploymentRetreatUntil-gameNow)/1000).toFixed(1)};
  if(attackCommitted||turnLocked){const flying=projectiles.length||walkers.length||pendingEmissions;return {id:'resolve',text:flying?'공격 진행 중':healthAnimating()?'체력 감소 표시 중':deathPending()?'사망 연출 중':'충돌 화면 확인',timer:'…'}};
  if(retreatUntil>gameNow)return {id:'retreat',text:'안전한 곳으로 후퇴',timer:((retreatUntil-gameNow)/1000).toFixed(1)};
  if(charging)return {id:'charge',text:'발사력 '+Math.round(clamp((gameNow-chargeAt)/1600,.12,1)*100)+'%',timer:String(Math.max(0,Math.ceil(turnLeft)))};
  return {id:'aim',text:isCPU()?(cpuStatus||'상황 판단 중'):'이동 · 무기 선택 · 조준',timer:String(Math.max(0,Math.ceil(turnLeft)))};
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
      button.disabled=!canUseWeapon(id);
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

const hud={
  root:document.getElementById('ui'),top:document.getElementById('top'),
  session:document.getElementById('sessionControls'),preview:document.getElementById('previewFitBtn'),
  preset:document.getElementById('aimPreset'),custom:document.getElementById('aimCurrent'),
  angle:document.getElementById('aimReadout'),fireText:document.getElementById('fireButtonText'),
  coach:document.getElementById('fireCoach'),endTurn:document.getElementById('endTurnBtn'),
  aimButtons:document.querySelectorAll('#aimMinus,#aimPlus,#aimPreset,#previewFitBtn'),
  controls:document.querySelectorAll('.ctrl'),weaponName:document.getElementById('weaponQuickName'),
  weaponUse:document.getElementById('weaponQuickUse'),practiceStep:document.getElementById('practiceStep'),
  previousRow:document.getElementById('practicePreviousRow'),previousInfo:document.getElementById('practicePreviousInfo'),
  previousToggle:document.getElementById('practicePrevious'),
  practiceCompare:document.getElementById('practiceCompare')
};
let weaponHUDState='';
function setHUDText(node,text){if(node.textContent!==text)node.textContent=text}
function setHUDAttribute(node,key,value){if(node.getAttribute(key)!==value)node.setAttribute(key,value)}
function setHUDFlag(node,key,on){if(node[key]!==on)node[key]=on}

function syncBattleControls(aimGuide,canChoose){
  const move=canMoveCurrent(),fire=canFireCurrent();
  for(const control of hud.controls){
    const action=control.dataset.act;
    const enabled=action==='fire'?fire:action==='jump'?move&&!rope&&!jetpack:
      action==='aimup'||action==='aimdown'?aimGuide:
      action==='rise'||action==='descend'?move&&jetpack:
      action==='ropein'||action==='ropeout'?move&&!!rope:move;
    setHUDFlag(control,'disabled',!enabled);
  }
  for(const button of hud.aimButtons)setHUDFlag(button,'disabled',!aimGuide||(!!practice?.lesson&&button!==hud.preview));
  setHUDFlag(hud.endTurn,'disabled',!canEndCurrentTurn());
  setHUDFlag(weaponPicker,'disabled',!canChoose&&!weaponDialog.open);
}

function updateWeaponHUD(canChoose){
  const snapshot=[activeTeam,selected,canChoose,jetpack,...limited.map(id=>teams[activeTeam].ammo[id])].join('|');
  if(snapshot===weaponHUDState)return;
  weaponHUDState=snapshot;
  setHUDText(hud.weaponName,weaponNames[selected]+' · '+ammoLabel(selected));
  setHUDText(hud.weaponUse,weaponUses[selected]);
  for(const button of weaponDockButtons){
    const id=button.dataset.w,active=id===selected;
    button.classList.toggle('active',active);
    setHUDAttribute(button,'aria-pressed',String(active));
    const label=weaponNames[id]+' · '+ammoLabel(id)+' · '+weaponUses[id];
    setHUDAttribute(button,'title',label);
    setHUDAttribute(button,'aria-label',label);
    setHUDFlag(button,'disabled',!canChoose||!canUseWeapon(id));
    if(limited.includes(id))setHUDText(button.querySelector('.ammo'),String(teams[activeTeam].ammo[id]));
  }
}

function updateHUD(){
  const max=Math.max(1,teams[0].worms.length*100);
  for(const [i,fill,meta] of [[0,ui.fillA,ui.metaA],[1,ui.fillB,ui.metaB]]){
    const bots=living(i),hp=bots.reduce((sum,bot)=>sum+bot.hp,0),percent=Math.round(100000*hp/max)/1000;
    if(parseFloat(fill.style.width)!==percent)fill.style.width=percent+'%';
    setHUDText(meta,hp+' HP · '+bots.length+'명');
  }
  const w=wormIntro?wormIntro.worms[wormIntro.index]:current();
  setHUDText(ui.turnLabel,gameOver?'전투 종료':wormIntro&&w
    ?teams[w.team].name+' · '+w.name
    :teams[activeTeam].name+' · '+(w?w.name+' · ':'')+weaponNames[selected]);
  const phase=battlePhase(),arrow=wind>=0?'→':'←',windSpeed=Math.abs(wind*100).toFixed(1);
  const turn=playerTurnLabel(),mobile=document.documentElement.dataset.mobile==='true';
  const timer=/^\d+$/.test(phase.timer)?phase.timer+'초':phase.timer;
  setHUDText(ui.timer,timer);
  setHUDAttribute(ui.timer,'data-phase',phase.id);
  setHUDAttribute(ui.timer,'aria-label',phase.text+' · '+timer);
  const pairProgress=pairedLessonBattle?' · 짝 대전 '+turnNo+'/'+pairTurnLimit+'턴':'';
  setHUDText(ui.wind,'바람 '+arrow+' '+windSpeed+(pairProgress||' · '+turnNo+'턴'));

  const aimPhase=phase.id==='aim'||phase.id==='charge';
  const status=aimPhase?(mobile?turn:turn+' · '+phase.text):phase.text;
  const mobileStatus={resolve:{'공격 진행 중':'발사 중','체력 감소 표시 중':'피해 표시','사망 연출 중':'전투 연출','충돌 화면 확인':'착탄 확인 중'}[phase.text],retreat:'후퇴',handoff:'턴 교대'}[phase.id]||status;
  setHUDText(ui.subhud,mobile
    ?(practice?(practice.lesson?'각도 탐구':'한 발 연습')+' · 바람 없음':wormIntro?mobileStatus:mobileStatus+' · 바람 '+arrow+' '+windSpeed+(pairedLessonBattle?' · '+turnNo+'/'+pairTurnLimit+'턴':''))
    :status+(sudden?' · 수위 상승':''));
  setHUDAttribute(hud.top,'data-team',String(activeTeam));
  setHUDFlag(hud.session,'hidden',!started);
  const readyPanel=document.getElementById('pairReadyPanel');
  setHUDFlag(readyPanel,'hidden',!pairNeedsReady||paused||gameOver);
  if(hud.root.classList.contains('waitingForPair')!==pairNeedsReady)hud.root.classList.toggle('waitingForPair',pairNeedsReady);
  if(pairNeedsReady){
    setHUDText(document.getElementById('pairReadyTitle'),(activeTeam+1)+'P 차례 · '+turnNo+'/'+pairTurnLimit+'턴');
    setHUDText(document.getElementById('pairReadyAction'),(activeTeam+1)+'P 준비');
    for(const button of readyAngles)setHUDAttribute(button,'aria-pressed',String(Number(button.dataset.pairAngle)===pairPlannedAngle));
    for(const button of readyPredictions)setHUDAttribute(button,'aria-pressed',String(button.dataset.pairPrediction===pairPrediction));
    setHUDFlag(document.getElementById('pairReadyStudy'),'hidden',!recentLesson?.shots[1]);
    const startAngle=pairPlannedAngle===null?'기본 45°':pairPlannedAngle+'°';
    setHUDText(document.getElementById('pairReadyStatus'),startAngle+'로 시작해요. 발사 버튼을 길게 눌러 힘을 조절해요.');
    const saved=pairStored&&recentPair?.id===matchId&&recentPair.turn===turnNo;
    setHUDText(document.getElementById('pairReadySave'),saved
      ?'이 차례 저장됨 · 새로 열면 이 준비 화면부터 이어져요.'
      :'이 차례는 이 브라우저에 저장되지 않았어요.');
  }
  const saveProgress=document.getElementById('pairSaveProgress');
  const savingNext=pairedLessonBattle&&!pairNeedsReady&&!gameOver&&!paused&&['resolve','retreat','handoff'].includes(phase.id);
  setHUDFlag(saveProgress,'hidden',!savingNext);
  if(savingNext)setHUDText(saveProgress,turnNo<pairTurnLimit
    ?'다음 준비 화면에서 저장돼요.'
    :'이번 차례가 끝나면 결과 화면이 열려요.');
  const remindShot=pairedLessonBattle&&!pairTurnFired&&!turnEnding&&aimPhase&&turnLeft<=10&&turnLeft>0;
  setHUDFlag(document.getElementById('pairShotReminder'),'hidden',!remindShot);
  const aimGuide=canShowAimGuide(),canChoose=canSelectWeapon();
  if(hud.root.classList.contains('aiming')!==aimGuide)hud.root.classList.toggle('aiming',aimGuide);
  if(hud.root.classList.contains('openingView')!==initialBattleView)hud.root.classList.toggle('openingView',initialBattleView);
  setHUDAttribute(hud.preview,'aria-pressed',String(previewFit));
  setHUDText(hud.preview,previewFit?'봇 보기':'탄도 전체');
  const angle=Math.round(-aim),preset=[0,30,45,60,90].includes(angle)?String(angle):'custom';
  setHUDText(hud.custom,angle+'°');
  if(hud.preset.value!==preset)hud.preset.value=preset;
  const percent=Math.round(shotPower()*100),width=percent+'%',usesPower=!['rope','homing'].includes(selected);
  const hideAngle=readingLessonAngle()&&!practice.angleRevealed;
  if(hud.root.classList.contains('readingAngle')!==hideAngle)hud.root.classList.toggle('readingAngle',hideAngle);
  setHUDText(hud.angle,hideAngle?'힘 '+percent+'% 고정':
    '각도 '+angle+'°'+(usesPower?' · 힘 '+(selected==='shotgun'&&shotgunRemain===1?100:percent)+'%':''));
  setHUDText(hud.fireText,charging?width:'발사');
  if(charging&&ui.power.style.width!==width)ui.power.style.width=width;
  setHUDFlag(hud.coach,'hidden',!!practice||phase.id!=='aim'||turnNo!==1||firstChargeStarted||!aimGuide||!usesPower);
  syncBattleControls(aimGuide,canChoose);
  updateWeaponHUD(canChoose);
  if(practice)updatePracticeHUD(angle);
}

function nextPracticeAngle(angle){return angle===60?30:60}

function updatePracticeHUD(angle){
  if(angle===30)practice.aimed=true;
  const guided=!!practice.lesson,second=!!practice.previous;
  let text;
  if(practice.complete){
    const {angle,power,end}=practice.prediction;
    const matched=dist(end.x,end.y,practice.impact.x,practice.impact.y)<2;
    text=angle+'°의 예상점과 실제 착탄점'+(matched?'이 일치했어요.':'을 비교해 보세요.');
    if(guided)text=second?'30°·60° 탐구 완료 · 힘 35% 고정':'1/2 · 30° 완료 · 같은 힘으로 60°를 쏴 보세요.';
    else text=angle+'° · 힘 '+power+'% · '+text;
    setHUDText(hud.practiceCompare,'같은 힘으로 '+nextPracticeAngle(angle)+'° 쏘기');
  }else if(practice.prediction)text='실제 포탄이 날아가는 모습을 보세요.';
  else if(guided)text=second?'2/2 · 60° · 힘 35% 고정 · 발사 버튼을 눌러 보세요.':
    '1/2 · 힘 35% 고정 · 0° 수평선부터 조준선까지 몇 도인지 짝과 말해 봐요.';
  else if(!practice.aimed)text='각도 선택에서 30°를 골라 보세요.';
  else if(practice.lockedPower!==null)text='힘 '+Math.round(practice.lockedPower*100)+'% 고정 · 발사해 두 탄도를 비교해 보세요.';
  else text=(isMobileDevice()?'발사 버튼':'Space 또는 발사 버튼')+'을 누르고 힘을 모아, 놓아 보세요.';
  if(guided&&practice.complete&&!lessonStored)text+=' · 이 창에서만 이어할 수 있어요.';
  setHUDText(hud.practiceStep,text);
  setHUDFlag(document.getElementById('lessonReadAngle'),'hidden',!readingLessonAngle());
  if(readingLessonAngle()){
    setHUDText(document.getElementById('lessonAngleAnswer'),practice.angleRevealed?'0°에서 조준선까지 30°예요.':'읽어 본 뒤 발사해요.');
    setHUDFlag(document.getElementById('lessonRevealAngle'),'disabled',!!practice.angleRevealed);
  }
  setHUDFlag(hud.previousRow,'hidden',!second||guided);
  setHUDAttribute(hud.previousToggle,'aria-pressed',String(practice.showPrevious));
  setHUDFlag(hud.previousInfo,'hidden',!practice.showPrevious);
  if(practice.showPrevious&&!guided){
    const previous=practice.previous.prediction;
    setHUDText(hud.previousInfo,'보라 점선 · 이전 '+previous.angle+'° · 힘 '+previous.power+'%');
  }
  if(practice.complete){
    setHUDFlag(hud.practiceCompare,'hidden',guided&&second);
    setHUDFlag(document.getElementById('practiceRetry'),'hidden',guided&&!second);
    setHUDText(document.getElementById('practiceRetry'),guided?'다시 탐구':'한 발 더');
    setHUDFlag(document.getElementById('practiceLarge'),'hidden',guided&&!second);
    setHUDFlag(document.getElementById('practicePair'),'hidden',!guided||!second);
  }
}
function retryPractice(samePower){
  if(!practice?.complete)return;
  if(practice.lesson&&!samePower){openLessonIntro();return}
  const previous={fieldHeight:practice.fieldHeight,prediction:practice.prediction,path:practice.path,impact:practice.impact,origin:practice.origin,stats:practice.stats};
  startGame({
    training:true,previous,
    lesson:practice.lesson,
    lockedPower:samePower?previous.prediction.powerValue:null,
    startingAngle:samePower?nextPracticeAngle(previous.prediction.angle):null
  });
}
function togglePreviousPractice(){
  if(!practice?.previous)return;
  practice.showPrevious=!practice.showPrevious;
  updatePracticeHUD(Math.round(-aim));
  if(practice.complete)fitPracticeView();
}
function capturePracticeShot(trace,power){
  const w=current();practice.origin={x:w.x,y:w.y};
  practice.prediction={...trace,angle:Math.round(-aim),power:Math.round(power*100),powerValue:power};
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
  practice.stats=measureTrajectory(practice);
  saveLessonCheckpoint();
  hud.root.classList.add('comparing');
  document.getElementById('practiceActions').hidden=false;
  updatePracticeHUD(Math.round(-aim));
  fitPracticeView();
  (hud.practiceCompare.hidden?document.getElementById('practiceLarge'):hud.practiceCompare).focus();
}
function fitPracticeView(){
  const points=practice.showPrevious?[...practice.path,...practice.previous.path]:practice.path;
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
  const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const panel=document.getElementById('practicePanel').getBoundingClientRect();
  const field=canvas.getBoundingClientRect();
  const top=78,bottom=Math.max(top+32,panel.top-field.top-13);
  cameraZoom=Math.min(1,Math.max(32,VW-90)/Math.max(40,maxX-minX),Math.max(32,bottom-top)/Math.max(40,maxY-minY));
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
  const framing=VH<=400&&readingLessonAngle() ? .68 : aimSpace ? .58 : .46;
  camera.targetX=clamp(x-cw*.5,minX,Math.max(minX,WW-cw));camera.targetY=clamp(y-ch*framing,minY,Math.max(minY,WH-ch));
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
  if(practice?.showPrevious)points.push(...practice.previous.path);
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
