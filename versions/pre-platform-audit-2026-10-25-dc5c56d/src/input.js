'use strict';

function isMobileDevice(){return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<=1024)}
function syncMobileOrientation(){
  const mobile=isMobileDevice(),blocked=mobile&&VH>VW,changed=blocked!==orientationBlocked;
  orientationBlocked=blocked;document.documentElement.dataset.mobile=String(mobile);document.documentElement.dataset.portrait=String(blocked);
  document.getElementById('rotateNotice').hidden=!blocked;document.getElementById('ui').inert=blocked;
  const options=document.getElementById('battleOptions'),layout=mobile?'mobile':'desktop';if(options.dataset.layout!==layout){options.open=!mobile;options.dataset.layout=layout}
  if(started&&!gameOver&&(changed||(blocked&&!paused)))applyGamePause(pauseIntent||blocked);
  updateFullscreenButton();
}
function updateFullscreenButton(){const button=document.getElementById('fullscreenBtn');button.hidden=!isMobileDevice()||!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);button.textContent=(document.fullscreenElement||document.webkitFullscreenElement)?'전체 화면 해제':'전체 화면'}
async function requestGameFullscreen(){
  if(!isMobileDevice()||document.fullscreenElement||document.webkitFullscreenElement)return false;
  const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;if(!request)return false;
  try{await request.call(root,{navigationUI:'hide'});updateFullscreenButton();return true}catch{updateFullscreenButton();return false}
}
addEventListener('resize',syncMobileOrientation);addEventListener('orientationchange',syncMobileOrientation);
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{resize();syncMobileOrientation()});
for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{resize();syncMobileOrientation()});
document.getElementById('fullscreenBtn').addEventListener('click',()=>{if(document.fullscreenElement||document.webkitFullscreenElement){const exit=document.exitFullscreen||document.webkitExitFullscreen;try{const result=exit?.call(document);result?.catch(()=>{})}catch{}}else requestGameFullscreen()});
document.getElementById('skipIntro').addEventListener('click',completeWormIntro);

/* ---------------- Input ---------------- */
function nativeKeyboardTarget(e){return e.target.closest?.('input,select,textarea,[contenteditable="true"]')||([' ','Enter'].includes(e.key)&&e.target.closest?.('button,summary,a[href]'))}
addEventListener('keydown',e=>{
  if(orientationBlocked)return;
  if(e.target.closest?.('#audioControls,#homeAudioControls,#angleControls'))return;
  if(nativeKeyboardTarget(e))return;
  if(wormIntro&&e.key!=='Escape')return;
  if(document.querySelector('dialog[open]'))return;
  if(e.shiftKey&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(!e.repeat)nudgeAim(e.key==='ArrowUp'?1:-1);return}
  const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=true;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  if(!started)return;if(e.repeat)return;if(!paused&&(e.key==='w'||e.key==='W'))jump();if(e.key===' ')fireStart();if(e.key==='Escape'&&!e.repeat)setPaused(!paused);
  if(e.key==='Enter'&&!paused&&!turnLocked&&!isCPU()&&retreatUntil===0)nextTurn(0);
  if(e.key==='c'||e.key==='C')followWorm();if(e.key==='m'||e.key==='M')toggleOverview();if(e.key==='+'||e.key==='=')setCameraZoom(cameraZoom*1.2);if(e.key==='-')setCameraZoom(cameraZoom/1.2);
  if(['1','2','3','4','5','6','7','8','9'].includes(e.key))selectWeapon(['bazooka','grenade','shotgun','banana','sacred','cluster','homing','mortar','airstrike'][+e.key-1])
});
addEventListener('blur',()=>{if(started&&!gameOver)setPaused(true);else clearInput()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!gameOver)setPaused(true)});
addEventListener('keyup',e=>{if(e.target.closest?.('#audioControls,#homeAudioControls')||nativeKeyboardTarget(e)){clearInput();return}const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false;if(e.key===' ')fireEnd()});
document.addEventListener('focusin',e=>{if(e.target.closest?.('input,select,textarea,button,summary,a[href],[contenteditable="true"]'))clearInput()});
// Pointer selection returns Space/Enter to the battlefield; Tab focus keeps native activation.
document.addEventListener('click',e=>{const button=e.target.closest?.('button');if(button&&e.detail>0&&document.activeElement===button)button.blur()});

const cameraPointers=new Map();let dragCamera=null,pinchDistance=0;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();const p=viewportPoint(e.clientX,e.clientY);if(!wormIntro&&!orientationBlocked)setCameraZoom(cameraZoom*(e.deltaY<0?1.15:1/1.15),p.x,p.y)},{passive:false});
canvas.addEventListener('pointerdown',e=>{
  if(wormIntro||orientationBlocked)return;
  cameraPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
  dragCamera={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
  if(cameraPointers.size===2){const [a,b]=[...cameraPointers.values()];pinchDistance=dist(a.x,a.y,b.x,b.y);dragCamera.moved=true}
});
canvas.addEventListener('pointermove',e=>{
  if(!cameraPointers.has(e.pointerId))return;cameraPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(cameraPointers.size===2){const [a,b]=[...cameraPointers.values()],d=dist(a.x,a.y,b.x,b.y),p=viewportPoint((a.x+b.x)/2,(a.y+b.y)/2);if(pinchDistance>0)setCameraZoom(cameraZoom*d/pinchDistance,p.x,p.y);pinchDistance=d;dragCamera.moved=true;return}
  if(!dragCamera)return;
  if(dist(dragCamera.startX,dragCamera.startY,e.clientX,e.clientY)>6)dragCamera.moved=true;
  if(dragCamera.moved)panCamera(dragCamera.x-e.clientX,dragCamera.y-e.clientY);
  dragCamera.x=e.clientX;dragCamera.y=e.clientY
});
function endCameraPointer(e,cancelled=false){
  const drag=dragCamera;cameraPointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  if(!cancelled&&drag&&!drag.moved&&targetMode&&!isCPU()){const p=worldFromScreen(e.clientX,e.clientY);useTarget(p.x,p.y)}
  if(cameraPointers.size===0){dragCamera=null;pinchDistance=0}else if(cameraPointers.size===1){const point=[...cameraPointers.values()][0];dragCamera={x:point.x,y:point.y,startX:point.x,startY:point.y,moved:true};pinchDistance=0}else if(dragCamera){dragCamera.moved=true}
}
canvas.addEventListener('pointerup',e=>endCameraPointer(e));canvas.addEventListener('pointercancel',e=>endCameraPointer(e,true));
mini.addEventListener('pointerdown',e=>{const r=mini.getBoundingClientRect();focusOn((e.clientX-r.left)/r.width*WW,(e.clientY-r.top)/r.height*WH,true);camera.manualUntil=Infinity});
document.getElementById('zoomIn').addEventListener('click',()=>setCameraZoom(cameraZoom*1.2));
document.getElementById('zoomOut').addEventListener('click',()=>setCameraZoom(cameraZoom/1.2));
document.getElementById('overviewBtn').addEventListener('click',toggleOverview);
document.getElementById('followBtn').addEventListener('click',followWorm);
document.getElementById('endTurnBtn').addEventListener('click',()=>{if(started&&!paused&&!turnLocked&&!isCPU()&&retreatUntil===0)nextTurn(0)});

document.querySelectorAll('.weapon').forEach(b=>b.addEventListener('click',()=>{playSFX('click');selectWeapon(b.dataset.w)}));
document.getElementById('pauseBtn').addEventListener('click',()=>setPaused(!paused));
document.getElementById('musicBtn').addEventListener('click',()=>setMusic(!musicEnabled));
document.getElementById('sfxBtn').addEventListener('click',()=>setSfx(!sfxEnabled));
document.getElementById('start').addEventListener('click',()=>{requestGameFullscreen();startGame()});
document.getElementById('quitBtn').addEventListener('click',()=>{if(started)openGameDialog(document.getElementById('quitDialog'))});
document.getElementById('quitCancel').addEventListener('click',()=>document.getElementById('quitDialog').close());
document.getElementById('quitDialog').addEventListener('close',()=>closeGameDialog());
document.getElementById('quitConfirm').addEventListener('click',()=>{returnToStart();document.getElementById('quitDialog').close()});
document.getElementById('battleOptions').addEventListener('click',e=>{if(document.documentElement.dataset.mobile==='true'&&e.target.closest('#helpAccess button,#cameraControls button'))document.getElementById('battleOptions').open=false});
document.getElementById('aimMinus').addEventListener('click',()=>nudgeAim(-1));
document.getElementById('aimPlus').addEventListener('click',()=>nudgeAim(1));
document.getElementById('aimPreset').addEventListener('change',e=>{if(e.target.value!=='custom')setAimElevation(Number(e.target.value))});
const heldControls=new Map();
function controlKey(action){return{left:'a',right:'d',aimup:'ArrowUp',aimdown:'ArrowDown',rise:'w',descend:'s',ropein:'w',ropeout:'s'}[action]}
function syncHeldKeys(){for(const k of ['a','d','ArrowUp','ArrowDown','w','s'])keys[k]=[...heldControls.values()].some(a=>controlKey(a)===k)}
document.querySelectorAll('.ctrl').forEach(btn=>{
  const action=btn.dataset.act;btn.addEventListener('contextmenu',e=>e.preventDefault());
  btn.addEventListener('pointerdown',e=>{e.preventDefault();if(heldControls.has(e.pointerId)||!started||paused||gameOver||wormIntro)return;btn.setPointerCapture(e.pointerId);heldControls.set(e.pointerId,action);syncHeldKeys();if(action==='jump')jump();if(action==='fire')fireStart()});
  function release(e,cancelled){if(!heldControls.has(e.pointerId))return;heldControls.delete(e.pointerId);syncHeldKeys();if(action==='fire'){if(cancelled){charging=false;ui.powerBox.classList.remove('show')}else fireEnd()}}
  btn.addEventListener('pointerup',e=>release(e,false));btn.addEventListener('pointercancel',e=>release(e,true));btn.addEventListener('lostpointercapture',e=>release(e,true));
});

for(const [id,kind] of [['musicVolume','music'],['sfxVolume','sfx'],['homeMusicVolume','music'],['homeSfxVolume','sfx']])document.getElementById(id).addEventListener('input',e=>setAudioVolume(kind,e.target.value));
document.getElementById('audioControls').addEventListener('focusin',clearInput);
document.getElementById('volumeControls').addEventListener('keydown',e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary').focus();e.stopPropagation()}});

document.getElementById('homeAudioControls').addEventListener('focusin',clearInput);
