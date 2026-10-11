'use strict';

// Original vector artwork. No remote images, fonts, or game assets are used.
const ICON_PATHS={
 bazooka:'M5 12h20v8H5z M25 11l5 5-5 5 M9 20l-2 7h6l2-7',
 grenade:'M10 13h13l3 12-4 4H11l-4-4z M14 13V8h7 M18 8V4',
 shotgun:'M5 12h24v4H15l-3 4H8l-3 5 M19 16v8h-5v-7',
 banana:'M7 7q-1 21 17 20q-11-6-9-16 M6 6l5 1',
 sacred:'M16 7v14 M9 14h14 M8 24l8 6 8-6 M6 5l-2-2 M26 5l2-2',
 cluster:'M8 9h16l3 15-5 4H10l-5-4z M11 14h2 M19 14h2 M15 21h2',
 homing:'M4 16h24 M16 4v24 M8 8a12 12 0 1 1 0 16 M12 12h8v8h-8z',
 mortar:'M8 26l5-19 9 3-8 19 M4 29h24 M19 6l2-3',
 airstrike:'M16 3l3 10 11 6v3l-11-3v7l4 3H9l4-3v-7L2 22v-3l11-6z',
 dynamite:'M6 13h5v15H6z M13 11h5v17h-5z M20 13h5v15h-5z M15 11V6q8-6 10 1',
 mine:'M5 24q0-11 11-11t11 11z M9 13l-3-4 M23 13l3-4 M16 12V7',
 bat:'M8 27l17-21q5-4 5 1L11 30z M5 29l4-3',
 punch:'M8 18V9h4v7-9h4v9-8h4v8-6h4v14l-6 5h-8l-5-7v-7h4',
 sheep:'M8 21q-7-10 3-13q6-5 12 2q8 1 6 8l-5 5H8z M7 23v5 M21 23v5 M25 11l5-3',
 drill:'M11 4h10v9H11z M9 13h14l-7 17z M12 18h8 M14 23h4',
 rope:'M9 11q-9-1-5-7q9-8 14 4q7 4 7 12q0 10-10 8q-11-2-4-11q8-5 9 3 M9 11l10-3',
 jetpack:'M7 9h7v15H7z M19 9h7v15h-7z M14 14h5 M8 27l3 4 2-4 M20 27l3 4 2-4',
 teleport:'M5 22q-4-16 11-18q16 1 13 17 M7 27h18 M12 12h8v10h-8z M3 9l3-5 4 3',
 girder:'M3 12h26v12H3z M3 12l9 12 9-12 8 12',
 target:'M5 16a11 11 0 1 0 22 0a11 11 0 1 0-22 0 M16 8v16 M8 16h16',
 jump:'M6 27l12-20 M10 8l8-1 1 9 M4 29h24',
 rocket:'M5 12h20v8H5z M25 11l5 5-5 5 M3 13l-2 3 2 3',
 map:'M3 8l9-4 8 4 9-4v21l-9 4-8-4-9 4z M12 4v21 M20 8v21',
 flag:'M8 29V4l18 3-5 6 5 6-18-3'
};
function weaponIcon(id){return '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="'+(ICON_PATHS[id]||ICON_PATHS.target)+'"/></svg>'}
function initGraphics(){for(const b of document.querySelectorAll('.weapon'))b.querySelector('.ico').innerHTML=weaponIcon(b.dataset.w)}
function drawExplorer(w){
  if(!w.alive)return;const x=screenX(w.x),y=screenY(w.y);if(x<-55||x>VW/cameraZoom+55||y<-70||y>VH/cameraZoom+70)return;
  const active=w===current()&&!gameOver,dir=w===current()?facing:w.team===0?1:-1,color=teams[w.team].color;
  ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.rotate(w.hurt>0?Math.sin(worldTime*.09)*.1:clamp(w.vx*.025,-.1,.1));
  ctx.fillStyle='rgba(8,27,35,.25)';ctx.beginPath();ctx.ellipse(0,10,11,3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#163747';ctx.beginPath();ctx.roundRect(-11,-9,7,15,3);ctx.fill();ctx.strokeStyle='#71d8cd';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle=w.hurt>0?'#fff4cb':color;ctx.strokeStyle='#153447';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-8,8);ctx.quadraticCurveTo(-10,-11,0,-16);ctx.quadraticCurveTo(13,-18,11,-5);ctx.quadraticCurveTo(10,6,5,10);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff5db';ctx.beginPath();ctx.roundRect(-3,-13,15,8,4);ctx.fill();ctx.stroke();ctx.fillStyle='#163747';ctx.fillRect(1,-11,2,3);ctx.fillRect(7,-11,2,3);
  ctx.strokeStyle='#153447';ctx.beginPath();ctx.moveTo(2,-1);ctx.lineTo(w.hurt>0?6:8,w.hurt>0?-3:-1);ctx.stroke();
  ctx.fillStyle='#ffe49b';ctx.fillRect(-7,3,13,3);ctx.strokeStyle='#ffe49b';ctx.beginPath();ctx.moveTo(-1,-16);ctx.lineTo(-3,-21);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(-3,-22,2.5,0,Math.PI*2);ctx.fill();ctx.restore();
  if(active){ctx.strokeStyle='#ffe49b';ctx.lineWidth=1.6;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
  ctx.font='800 10px system-ui';ctx.textAlign='center';ctx.strokeStyle='#143347';ctx.lineWidth=3;ctx.strokeText(w.name+' · '+w.hp,x,y-30);ctx.fillStyle='#fff6dd';ctx.fillText(w.name+' · '+w.hp,x,y-30);
  if(active&&!turnLocked&&!isCPU()&&!projectiles.length&&!targetMode&&!['mine','dynamite','bat','punch','sheep','drill','jetpack'].includes(selected)){const a=aim*Math.PI/180,tx=x+Math.cos(a)*facing*48,ty=y+Math.sin(a)*48;ctx.strokeStyle='#fff1c7';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();ctx.strokeStyle='#ffe49b';ctx.beginPath();ctx.arc(tx,ty,4,0,Math.PI*2);ctx.moveTo(tx-7,ty);ctx.lineTo(tx+7,ty);ctx.stroke()}
}
