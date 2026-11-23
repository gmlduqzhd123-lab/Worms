'use strict';

const LESSON_POWER=.35;
const LESSON_KEY='wormfront.lesson.v1';
const CLASS_CARD_KEY='wormfront.class-card.v1';
const lessonIntro=document.getElementById('lessonIntro');
const practiceResult=document.getElementById('practiceResult');
const lessonBegin=document.getElementById('lessonBegin');
const observationInput=document.getElementById('practiceObservation');
const previousTrack={color:'#e3bbff',dash:[5,6],shape:'diamond'};
const currentTrack={color:'#72e4ff',dash:[],shape:'circle'};
let openSharedLesson=false;
let pairAfterClose=false,nextGroupAfterCard=false;
let sharedLessonLink=false,sharedPairLimit=null,recentLesson=null,lessonStored=true;
let recentClassCard=null,classCardStored=true;
let afterLessonIntro=null,shownResult=null,shownClassCard=null;

function readingLessonAngle(){
  return !!practice?.lesson&&!practice.previous&&!practice.prediction;
}
function validLessonShot(shot,angle){
  const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=10000&&Math.abs(p.y)<=10000;
  const list=points=>Array.isArray(points)&&points.length>0&&points.length<=500&&points.every(point);
  return shot?.prediction?.angle===angle&&shot.prediction.powerValue===LESSON_POWER&&shot.prediction.power===35&&
    point(shot.origin)&&point(shot.impact)&&point(shot.prediction.end)&&list(shot.path)&&list(shot.prediction.points);
}
function validLessonDraft(saved){
  const guesses=[...lessonIntro.querySelectorAll('input')].map(choice=>choice.value);
  return saved?.version===1&&guesses.includes(saved.guess)&&Array.isArray(saved.shots)&&saved.shots.length<=2&&
    saved.shots.every((shot,i)=>validLessonShot(shot,[30,60][i]))&&typeof saved.observation==='string';
}
function readLessonCheckpoint(){
  const saved=readSaved(LESSON_KEY);
  if(!validLessonDraft(saved))return null;
  return {version:1,guess:saved.guess,shots:saved.shots,observation:saved.observation.slice(0,100)};
}
function readClassCard(){
  const card=readSaved(CLASS_CARD_KEY);
  const labels=list=>Array.isArray(list)&&list.length===2&&list.every(label=>typeof label==='string'&&label.length<=300);
  if(card?.version!==1||typeof card.id!=='string'||!/^[a-z0-9-]{1,80}$/i.test(card.id)||
    !Number.isFinite(Date.parse(card.completedAt))||!validLessonDraft(card.lesson)||card.lesson.shots.length!==2||
    typeof card.report?.title!=='string'||card.report.title.length>100||
    !labels(card.report.lines)||!labels(card.report.summary))return null;
  card.lesson.observation=card.lesson.observation.slice(0,100);
  return card;
}
function persistClassCard(card){
  recentClassCard=card;
  classCardStored=writeSaved(CLASS_CARD_KEY,card);
  updateClassCardAccess();
}
function saveClassCard(){
  if(!recentLesson?.shots[1])return;
  persistClassCard({
    version:1,id:matchId,completedAt:new Date().toISOString(),lesson:{...recentLesson},
    report:{
      title:'짝 대전 · 마지막 조준 발사 ('+turnNo+'/'+pairTurnLimit+'턴)',
      lines:pairLastShots.map(formatPairShot),
      summary:pairLastShots.map(formatPairShotSummary)
    }
  });
}
function updateClassCardAccess(){
  document.getElementById('homeClassCard').hidden=!recentClassCard;
}
function persistLesson(draft){
  recentLesson=draft;
  lessonStored=writeSaved(LESSON_KEY,draft);
}
function saveLessonCheckpoint(){
  if(!practice?.lesson)return;
  const shots=[];
  for(const shot of [practice.previous,practice.complete?practice:null]){
    if(shot)shots.push({origin:shot.origin,impact:shot.impact,path:shot.path,prediction:shot.prediction});
  }
  persistLesson({version:1,guess:practice.lesson.guess,shots,observation:practice.observation});
}
function restoreLessonShot(shot){
  const {origin,impact,path,prediction}=shot;
  return {origin,impact,path,prediction,fieldHeight:820,stats:measureTrajectory(shot)};
}
function openLessonDraft(draft){
  const previous=draft.shots[0]?restoreLessonShot(draft.shots[0]):null;
  startGame({
    training:true,previous,lockedPower:LESSON_POWER,startingAngle:previous?60:30,
    lesson:{guess:draft.guess,shared:sharedLessonLink}
  });
  practice.observation=draft.observation;
  if(draft.shots[1]){
    Object.assign(practice,restoreLessonShot(draft.shots[1]));
    turnLocked=true;
    finishPractice();
    showPracticeResult();
  }else saveLessonCheckpoint();
}

function showLessonChoice(fresh=false){
  const saved=!fresh&&!!recentLesson;
  const resumePair=!fresh&&!!recentPair;
  const differentLimit=resumePair&&sharedPairLimit&&sharedPairLimit!==recentPair.limit;
  document.getElementById('lessonSaved').hidden=!saved&&!resumePair;
  document.getElementById('lessonPrediction').hidden=saved||resumePair;
  document.getElementById('lessonClassCard').hidden=fresh||!recentClassCard;
  document.getElementById('pairSaved').hidden=!resumePair;
  pairResume.hidden=!resumePair;
  document.getElementById('lessonSavedText').hidden=!saved;
  document.getElementById('lessonResume').hidden=!saved;
  document.getElementById('lessonRestart').textContent=sharedPairLimit?'새 '+sharedPairLimit+'턴 활동 시작':'새 모둠 시작';
  if(sharedPairLimit)document.getElementById('lessonPairPreset').textContent=differentLimit
    ?'이 수업 링크의 새 활동은 '+sharedPairLimit+'턴으로 진행해요.'
    :'수업 링크 · 탐구를 마치면 '+sharedPairLimit+'턴 짝 대전을 해요.';
  if(resumePair){
    document.getElementById('pairSavedText').textContent='저장된 준비 화면 · '+recentPair.turn+'/'+recentPair.limit+'턴 · '+(recentPair.team+1)+'P 차례';
    pairResume.textContent=differentLimit?'이전 '+recentPair.limit+'턴 이어하기':(recentPair.team+1)+'P 준비부터 이어하기';
    document.getElementById('pairResumeStatus').textContent='';
  }
  if(saved){
    const howFar=['30° 발사 준비','30° 완료 · 60°부터 이어할 수 있어요.','30°·60° 비교 완료 · 관찰 내용을 다시 볼 수 있어요.'][recentLesson.shots.length];
    document.getElementById('lessonSavedText').textContent=howFar+(lessonStored?'':' 이 창에서만 이어할 수 있어요.');
    document.getElementById('lessonResume').textContent=recentLesson.shots.length===2?'탐구 결과 다시 보기':'이어하기';
  }
}
function openLessonIntro(fresh=false){
  if(orientationBlocked||lessonIntro.open)return;
  for(const choice of lessonIntro.querySelectorAll('input'))choice.checked=false;
  lessonBegin.disabled=true;
  showLessonChoice(fresh);
  openGameDialog(lessonIntro);
}
function maybeOpenSharedLesson(){
  if(!openSharedLesson||orientationBlocked||started)return;
  openSharedLesson=false;
  openLessonIntro();
}
function initLessonSharing(){
  recentLesson=readLessonCheckpoint();
  recentPair=loadPairCheckpoint();
  recentClassCard=readClassCard();updateClassCardAccess();
  const params=new URL(location.href).searchParams;
  sharedLessonLink=params.get('lesson')==='angle';
  const limit=params.get('turns');
  if(sharedLessonLink&&['2','4'].includes(limit)){
    sharedPairLimit=Number(limit);
    const preset=document.getElementById('lessonPairPreset');
    preset.hidden=false;
  }
  openSharedLesson=sharedLessonLink;
  maybeOpenSharedLesson();
  addEventListener('resize',maybeOpenSharedLesson);
  addEventListener('orientationchange',maybeOpenSharedLesson);
  window.visualViewport?.addEventListener('resize',maybeOpenSharedLesson);
}
function startPairBattle(){
  if(!practice?.complete||!practice.lesson||!practice.previous)return;
  if(practiceResult.open){
    pairAfterClose=true;
    practiceResult.close();
    return;
  }
  if(sharedPairLimit)startGame({pairPractice:true,pairTurns:sharedPairLimit});
  else openPairSetup();
}

function measureTrajectory(shot){
  const peak=shot.path.reduce((highest,point)=>point.y<highest.y?point:highest,shot.path[0]);
  return {
    peak,
    height:Math.max(0,shot.origin.y-peak.y)/10,
    distance:Math.abs(shot.impact.x-shot.origin.x)/10
  };
}
function arcMarker(context,x,y,shape,size){
  context.beginPath();
  if(shape==='diamond'){
    context.moveTo(x,y-size);context.lineTo(x+size,y);
    context.lineTo(x,y+size);context.lineTo(x-size,y);context.closePath();
  }else context.arc(x,y,size,0,Math.PI*2);
  context.fill();context.stroke();
}
function drawPracticeTrack(shot,previous){
  const {color,dash,shape}=previous?previousTrack:currentTrack;
  ctx.save();
  strokeShotPath(shot.path,color,3,dash);
  ctx.scale(1/cameraZoom,1/cameraZoom);
  const x=point=>screenX(point.x)*cameraZoom,y=point=>screenY(point.y)*cameraZoom;
  ctx.fillStyle=color;ctx.strokeStyle='#102b41';ctx.lineWidth=2;
  arcMarker(ctx,x(shot.impact),y(shot.impact),shape,previous?8:5);
  const peak=shot.stats.peak,px=x(peak)+(previous?-16:16),py=y(peak)-11;
  if(px>16&&px<VW-16&&py>48&&py<VH-18){
    ctx.font='800 12px system-ui';ctx.textAlign='center';
    ctx.lineWidth=4;ctx.strokeText(shot.prediction.angle+'°',px,py);ctx.fillText(shot.prediction.angle+'°',px,py);
  }
  ctx.restore();
}

function trajectoryRows(result){
  const shots=result.previous?[result.previous,result]:[result];
  return shots.map(shot=>({
    shot,
    angle:shot.prediction.angle,
    power:shot.prediction.power,
    powerValue:shot.prediction.powerValue,
    ...shot.stats,
    matched:dist(shot.prediction.end.x,shot.prediction.end.y,shot.impact.x,shot.impact.y)<2,
    style:shot===result?currentTrack:previousTrack
  }));
}
const cells=value=>value.toFixed(1)+'칸';
function resultCondition(rows){
  const equal=rows.every(row=>row.powerValue===rows[0].powerValue);
  return (equal?'공통 발사력 '+rows[0].power+'%':'발사력 '+rows.map(row=>row.power+'%').join(' / '))+' · 평지 · 바람 없음';
}
function explainLessonFinding(rows,guess){
  const highest=rows.reduce((a,b)=>a.height>b.height?a:b);
  const difference=Math.abs(rows[0].distance-rows[1].distance);
  return '내 예상 '+guess+' · '+highest.angle+'°가 더 높았어요. 가로 거리 차이는 '+cells(difference)+'이에요.';
}
function drawWrappedResultText(pen,text,y,step){
  let line='';
  for(const char of text){
    if(line&&pen.measureText(line+char).width>890){
      const lastSpace=line.lastIndexOf(' ');
      const end=lastSpace>0?lastSpace:line.length;
      pen.fillText(line.slice(0,end),30,y);
      line=line.slice(end).trimStart();y+=step;
    }
    line+=char;
  }
  if(line)pen.fillText(line,30,y);
  return y+step;
}
function drawResultFigure(surface,rows,note=null,pairReport=null){
  surface.width=960;surface.height=pairReport?745:note===null?410:555;
  const pen=surface.getContext('2d');
  pen.fillStyle='#0c2639';pen.fillRect(0,0,surface.width,surface.height);
  pen.fillStyle='#fff2c2';pen.font='800 28px system-ui';pen.fillText('조준! 각도왕 · '+(pairReport?'수업 결과 카드':'탄도 비교'),30,41);
  pen.fillStyle='#d6e8f2';pen.font='600 19px system-ui';pen.fillText(resultCondition(rows)+' · 단위: 게임 칸',30,72);

  const top=113,bottom=295,start=46,span=820;
  const baseY=Math.max(...rows.flatMap(({shot})=>shot.path.map(p=>p.y-shot.origin.y)));
  const highY=Math.min(...rows.flatMap(({shot})=>shot.path.map(p=>p.y-shot.origin.y)));
  const maxX=Math.max(1,...rows.flatMap(({shot})=>shot.path.map(p=>p.x-shot.origin.x)));
  const getX=(point,shot)=>start+(point.x-shot.origin.x)/maxX*span;
  const getY=(point,shot)=>bottom-(baseY-(point.y-shot.origin.y))/Math.max(1,baseY-highY)*(bottom-top);
  pen.strokeStyle='#6c8799';pen.lineWidth=1.5;pen.beginPath();
  pen.moveTo(start,bottom);pen.lineTo(925,bottom);pen.stroke();
  pen.fillStyle='#c7dbe9';pen.font='600 15px system-ui';pen.fillText('출발',start,bottom+22);
  rows.forEach(({shot,angle,peak,style},i)=>{
    const {color,dash,shape}=style;
    pen.strokeStyle=color;pen.lineWidth=4;pen.setLineDash(dash);
    pen.beginPath();shot.path.forEach((point,j)=>j?pen.lineTo(getX(point,shot),getY(point,shot)):pen.moveTo(getX(point,shot),getY(point,shot)));
    pen.stroke();pen.setLineDash([]);
    const x=getX(shot.impact,shot),y=getY(shot.impact,shot),labelX=Math.min(890,Math.max(90,x-25+i*45));
    const labelY=bottom+(i?44:22);
    pen.strokeStyle=color;pen.lineWidth=1.5;pen.beginPath();pen.moveTo(x,y);pen.lineTo(labelX,labelY-8);pen.stroke();
    pen.strokeStyle='#0c2639';pen.fillStyle=color;
    arcMarker(pen,x,y,shape,shape==='diamond'?9:5);
    pen.font='800 18px system-ui';pen.fillText(angle+'°',labelX+4,labelY);
    const peakX=getX(peak,shot)+(i?18:-18),peakY=getY(peak,shot)-11;
    pen.lineWidth=5;pen.strokeText(angle+'°',peakX,peakY);pen.fillText(angle+'°',peakX,peakY);
  });
  rows.forEach(({angle,power,height,distance,style},i)=>{
    const x=30+i*450;
    pen.fillStyle=style.color;pen.font='800 21px system-ui';pen.fillText(angle+'° · 힘 '+power+'%',x,365);
    pen.fillStyle='#eef6fc';pen.font='600 18px system-ui';pen.fillText('최고 높이 '+cells(height)+'   가로 거리 '+cells(distance),x,393);
  });
  if(note!==null){
    pen.fillStyle='#fff2c2';pen.font='800 21px system-ui';pen.fillText('내가 발견한 점',30,444);
    pen.fillStyle='#e3edf3';pen.font='500 22px system-ui';
    drawWrappedResultText(pen,note||'________________________________',475,26);
  }
  if(pairReport){
    pen.strokeStyle='#6c8799';pen.lineWidth=1;pen.beginPath();pen.moveTo(30,548);pen.lineTo(930,548);pen.stroke();
    pen.fillStyle='#fff2c2';pen.font='800 21px system-ui';pen.fillText(pairReport.title,30,580);
    pen.fillStyle='#e3edf3';pen.font='600 20px system-ui';
    let y=618;
    for(const line of pairReport.lines)y=drawWrappedResultText(pen,line,y,26)+10;
  }
}
function showPracticeResult(result=practice,{quickReview=false,classCard=null}={}){
  if(!result?.complete)return;
  shownResult=result;shownClassCard=classCard;
  const pairReport=classCard?.report;
  document.getElementById('practiceResultTitle').textContent=pairReport?'수업 결과 카드':'탄도 비교 결과';
  document.getElementById('practiceDownloadStatus').textContent=classCard&&!classCardStored?'이 카드가 브라우저에 저장되지 않았어요. PNG로 남길 수 있어요.':'';
  document.getElementById('practiceResultScroll').scrollTop=0;
  const rows=trajectoryRows(result),summary=document.getElementById('trajectoryDetails');
  const condition=document.getElementById('practiceCondition');
  condition.hidden=!quickReview;
  if(quickReview)condition.textContent=resultCondition(rows);
  drawResultFigure(document.getElementById('trajectoryFigure'),rows);
  summary.textContent=rows.map(row=>row.angle+'° · 최고 높이 '+cells(row.height)+' · 가로 거리 '+cells(row.distance)+
    (row.matched?' · 이 각도의 예상점과 실제 착탄점이 일치했어요.':' · 이 각도의 예상점과 실제 착탄점을 비교해 보세요.')).join(' ');
  const finding=document.getElementById('lessonFinding'),paired=!!result.lesson&&rows.length===2;
  document.getElementById('lessonQuickSummary').hidden=!paired||quickReview;
  document.getElementById('lessonQuickShots').hidden=!pairReport;
  if(paired)finding.textContent=explainLessonFinding(rows,result.lesson.guess);
  document.getElementById('resultPair').hidden=!paired||result!==practice;
  document.getElementById('cardNextGroup').hidden=!classCard;
  if(paired&&sharedPairLimit)document.getElementById('resultPair').textContent=sharedPairLimit+'턴 짝 대전 시작';
  document.getElementById('practiceObservationGroup').hidden=quickReview;
  document.getElementById('practiceResultFooter').hidden=quickReview;
  document.getElementById('practicePairReport').hidden=!pairReport;
  if(pairReport){
    document.getElementById('practicePairReportTitle').textContent=pairReport.title;
    pairReport.lines.forEach((line,i)=>{document.getElementById('practicePairShot'+(i+1)).textContent=line});
    pairReport.summary.forEach((line,i)=>{document.getElementById('lessonQuickShot'+(i+1)).textContent=line});
  }
  observationInput.value=result.observation;
  openGameDialog(practiceResult);
  document.getElementById('practiceResultScroll').scrollTop=0;
}

document.getElementById('lessonStart').addEventListener('click',()=>openLessonIntro());
document.getElementById('lessonClose').addEventListener('click',()=>lessonIntro.close());
lessonIntro.addEventListener('change',()=>{lessonBegin.disabled=!lessonIntro.querySelector('input:checked')});
lessonIntro.addEventListener('close',()=>{
  closeGameDialog();
  const resume=afterLessonIntro;
  afterLessonIntro=null;
  if(resume)resume();
});
function launchLessonDraft(draft){
  requestGameFullscreen();
  applyClassroomAudio(sharedLessonLink);
  ensureAudio();
  afterLessonIntro=()=>openLessonDraft(draft);
  lessonIntro.close();
}
lessonBegin.addEventListener('click',()=>{
  const choice=lessonIntro.querySelector('input:checked');
  if(!choice)return;
  blockedStorageKeys.delete(LESSON_KEY);
  clearPairCheckpoint();
  launchLessonDraft({version:1,guess:choice.value,shots:[],observation:''});
});
document.getElementById('lessonRestart').addEventListener('click',()=>{
  showLessonChoice(true);
  lessonIntro.querySelector('input').focus();
});
document.getElementById('lessonResume').addEventListener('click',()=>{if(recentLesson)launchLessonDraft(recentLesson)});
document.getElementById('lessonRevealAngle').addEventListener('click',()=>{
  if(!readingLessonAngle())return;
  practice.angleRevealed=true;
  updateHUD();
});
document.getElementById('practiceLarge').addEventListener('click',()=>showPracticeResult());
function showSavedLessonResult({quickReview=false,classCard=null}={}){
  const draft=classCard?.lesson??recentLesson;
  if(!draft?.shots[1])return;
  showPracticeResult({
    ...restoreLessonShot(draft.shots[1]),previous:restoreLessonShot(draft.shots[0]),
    lesson:{guess:draft.guess},observation:draft.observation,complete:true
  },{quickReview,classCard});
}
function openClassCard(){if(recentClassCard)showSavedLessonResult({classCard:recentClassCard})}
document.getElementById('pairLessonReview').addEventListener('click',openClassCard);
document.getElementById('homeClassCard').addEventListener('click',openClassCard);
document.getElementById('lessonClassCard').addEventListener('click',()=>{
  afterLessonIntro=openClassCard;
  lessonIntro.close();
});
document.getElementById('pairReadyStudy').addEventListener('click',()=>{if(pairNeedsReady)showSavedLessonResult({quickReview:true})});
document.getElementById('pairNextGroup').addEventListener('click',()=>openLessonIntro(true));
document.getElementById('practicePair').addEventListener('click',startPairBattle);
document.getElementById('resultPair').addEventListener('click',startPairBattle);
document.getElementById('practiceResultClose').addEventListener('click',()=>practiceResult.close());
document.getElementById('cardNextGroup').addEventListener('click',()=>{
  nextGroupAfterCard=true;
  practiceResult.close();
});
practiceResult.addEventListener('close',()=>{
  shownResult=null;shownClassCard=null;
  closeGameDialog();
  if(pairAfterClose){pairAfterClose=false;startPairBattle()}
  if(nextGroupAfterCard){nextGroupAfterCard=false;openLessonIntro(true)}
});
observationInput.addEventListener('input',()=>{
  if(!shownResult)return;
  shownResult.observation=observationInput.value;
  if(shownClassCard){
    shownClassCard.lesson.observation=shownResult.observation;
    persistClassCard(shownClassCard);
  }else if(shownResult===practice)saveLessonCheckpoint();
  else if(recentLesson)persistLesson({...recentLesson,observation:shownResult.observation});
});
function classCardFilename(card){
  const time=new Date(card.completedAt);
  const stamp=new Date(time.getTime()-time.getTimezoneOffset()*60000).toISOString().slice(0,19).replace('T','_').replaceAll(':','');
  return '조준-각도왕-수업-결과_'+stamp+'_'+card.id.slice(0,6)+'.png';
}
function downloadLessonFigure(rows,observation,classCard,status){
  try{
    const image=document.createElement('canvas'),link=document.createElement('a');
    drawResultFigure(image,rows,observation.trim(),classCard?.report);
    link.download=classCard?classCardFilename(classCard):'조준-각도왕-탄도-결과.png';
    link.href=image.toDataURL('image/png');
    document.body.append(link);link.click();link.remove();
    status.textContent='PNG 내려받기를 시작했어요.';
  }catch{
    status.textContent='PNG를 만들지 못했어요. 다시 눌러 주세요.';
  }
}
document.getElementById('practiceDownload').addEventListener('click',()=>{
  if(!shownResult?.complete)return;
  downloadLessonFigure(trajectoryRows(shownResult),shownResult.observation,shownClassCard,document.getElementById('practiceDownloadStatus'));
});
document.getElementById('pairDownload').addEventListener('click',()=>{
  if(recentClassCard?.id!==matchId)return;
  const draft=recentClassCard.lesson;
  const previous=restoreLessonShot(draft.shots[0]),lastShot=restoreLessonShot(draft.shots[1]);
  downloadLessonFigure(trajectoryRows({...lastShot,previous}),draft.observation,recentClassCard,document.getElementById('pairDownloadStatus'));
});
