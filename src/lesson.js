'use strict';

const LESSON_POWER=.35;
const lessonIntro=document.getElementById('lessonIntro');
const practiceResult=document.getElementById('practiceResult');
const lessonBegin=document.getElementById('lessonBegin');
const observationInput=document.getElementById('practiceObservation');
const previousTrack={color:'#e3bbff',dash:[5,6],shape:'diamond'};
const currentTrack={color:'#72e4ff',dash:[],shape:'circle'};
let openSharedLesson=false;
let pairAfterClose=false;

function openLessonIntro(){
  if(orientationBlocked||lessonIntro.open)return;
  for(const choice of lessonIntro.querySelectorAll('input'))choice.checked=false;
  lessonBegin.disabled=true;
  openGameDialog(lessonIntro);
}
function maybeOpenSharedLesson(){
  if(!openSharedLesson||orientationBlocked||started)return;
  openSharedLesson=false;
  openLessonIntro();
}
function initLessonSharing(){
  openSharedLesson=new URL(location.href).searchParams.get('lesson')==='angle';
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
  startGame({pairPractice:true});
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

function trajectoryRows(){
  const shots=practice.previous?[practice.previous,practice]:[practice];
  return shots.map(shot=>({
    shot,
    angle:shot.prediction.angle,
    power:shot.prediction.power,
    ...shot.stats,
    matched:dist(shot.prediction.end.x,shot.prediction.end.y,shot.impact.x,shot.impact.y)<2,
    style:shot===practice?currentTrack:previousTrack
  }));
}
const cells=value=>value.toFixed(1)+'칸';
function resultCondition(rows){
  const equal=!practice.previous||practice.previous.prediction.powerValue===practice.prediction.powerValue;
  return (equal?'공통 발사력 '+rows[0].power+'%':'발사력 '+rows.map(row=>row.power+'%').join(' / '))+' · 평지 · 바람 없음';
}
function explainLessonFinding(rows){
  const highest=rows.reduce((a,b)=>a.height>b.height?a:b);
  const difference=Math.abs(rows[0].distance-rows[1].distance);
  return '내 예상 '+practice.lesson.guess+' · 이 조건에서는 '+highest.angle+'°가 더 높았고, 가로로 간 거리는 '+cells(difference)+' 차이였어요.';
}
function drawResultFigure(surface,rows,note=null){
  surface.width=960;surface.height=note===null?410:555;
  const pen=surface.getContext('2d');
  pen.fillStyle='#0c2639';pen.fillRect(0,0,surface.width,surface.height);
  pen.fillStyle='#fff2c2';pen.font='800 28px system-ui';pen.fillText('조준! 각도왕 · 탄도 비교',30,41);
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
    let line='',lineY=475;
    for(const char of note||'________________________________'){
      if(line&&pen.measureText(line+char).width>890){pen.fillText(line,30,lineY);line='';lineY+=26}
      line+=char;
    }
    if(line)pen.fillText(line,30,lineY);
  }
}
function showPracticeResult(){
  if(!practice?.complete)return;
  const rows=trajectoryRows(),summary=document.getElementById('trajectoryDetails');
  drawResultFigure(document.getElementById('trajectoryFigure'),rows);
  summary.textContent=rows.map(row=>row.angle+'° · 최고 높이 '+cells(row.height)+' · 가로 거리 '+cells(row.distance)+
    (row.matched?' · 이 각도의 예상점과 실제 착탄점이 일치했어요.':' · 이 각도의 예상점과 실제 착탄점을 비교해 보세요.')).join(' ');
  const finding=document.getElementById('lessonFinding'),paired=!!practice.lesson&&rows.length===2;
  finding.hidden=!paired;
  if(paired)finding.textContent=explainLessonFinding(rows)+' 짝 대전에서는 언덕을 넘기려면 어떤 각도가 좋을지 시험해 보세요.';
  document.getElementById('resultPair').hidden=!paired;
  observationInput.value=practice.observation;
  openGameDialog(practiceResult);
}

document.getElementById('lessonStart').addEventListener('click',openLessonIntro);
document.getElementById('lessonClose').addEventListener('click',()=>lessonIntro.close());
lessonIntro.addEventListener('change',()=>{lessonBegin.disabled=!lessonIntro.querySelector('input:checked')});
lessonIntro.addEventListener('close',closeGameDialog);
lessonBegin.addEventListener('click',()=>{
  const choice=lessonIntro.querySelector('input:checked');
  if(!choice)return;
  requestGameFullscreen();
  lessonIntro.close();
  startGame({training:true,lockedPower:LESSON_POWER,startingAngle:30,lesson:{guess:choice.value}});
});
document.getElementById('practiceLarge').addEventListener('click',showPracticeResult);
document.getElementById('practicePair').addEventListener('click',startPairBattle);
document.getElementById('resultPair').addEventListener('click',startPairBattle);
document.getElementById('practiceResultClose').addEventListener('click',()=>practiceResult.close());
practiceResult.addEventListener('close',()=>{
  closeGameDialog();
  if(pairAfterClose){pairAfterClose=false;startPairBattle()}
});
observationInput.addEventListener('input',()=>{if(practice)practice.observation=observationInput.value});
document.getElementById('practiceDownload').addEventListener('click',()=>{
  if(!practice?.complete)return;
  const image=document.createElement('canvas'),link=document.createElement('a');
  drawResultFigure(image,trajectoryRows(),practice.observation.trim());
  link.download='조준-각도왕-탄도-결과.png';link.href=image.toDataURL('image/png');
  link.click();
});
