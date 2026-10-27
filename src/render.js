'use strict';

/* ---------------- Render ---------------- */
function drawSky(){
  const theme=getMapTheme(),scenic=artImages[theme.file];if(scenic){const scale=Math.max(VW/scenic.width,VH/scenic.height),dw=scenic.width*scale,dh=scenic.height*scale;ctx.drawImage(scenic,(VW-dw)/2,(VH-dh)/2,dw,dh);if(sudden){ctx.fillStyle='rgba(57,39,74,.4)';ctx.fillRect(0,0,VW,VH)}}
  if(!scenic){
  const g=ctx.createLinearGradient(0,0,0,VH);g.addColorStop(0,sudden?'#4c5979':theme.sky[0]);g.addColorStop(.62,sudden?'#81879e':theme.sky[1]);g.addColorStop(1,theme.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  const sunWorld=WW*.78;const sx=sunWorld-camera.x*.12;ctx.fillStyle=sudden?'rgba(242,226,178,.66)':'rgba(255,232,182,.92)';ctx.beginPath();ctx.arc(sx,VH*.16,33,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=sudden?'rgba(220,224,232,.56)':'rgba(220,236,225,.30)';
  for(const c of clouds){const x=c.x-camera.x*.55,y=c.y-camera.y*.2,s=c.s;if(x<-120||x>VW+120)continue;ctx.beginPath();ctx.ellipse(x,y,42*s,16*s,0,0,Math.PI*2);ctx.ellipse(x+28*s,y-8*s,27*s,18*s,0,0,Math.PI*2);ctx.ellipse(x-27*s,y-5*s,25*s,14*s,0,0,Math.PI*2);ctx.fill()}
  }
  const sy=(waterY-camera.y)*cameraZoom;const sea=ctx.createLinearGradient(0,sy,0,VH);sea.addColorStop(0,theme.water[0]);sea.addColorStop(1,theme.water[1]);ctx.fillStyle=sea;ctx.fillRect(0,sy,VW,VH-sy);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<VW;x+=12){const y=sy+Math.sin((x+camera.x+worldTime*.05)*.04)*2;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()
}
function drawTerrain(){ctx.drawImage(terrain,camera.x,camera.y,VW/cameraZoom,VH/cameraZoom,0,0,VW/cameraZoom,VH/cameraZoom)}
function drawWorm(w){drawExplorer(w)}
function drawTrajectory(){
  const trace=getShotPreview();if(!trace)return;ctx.save();ctx.strokeStyle='rgba(255,228,155,.95)';ctx.lineWidth=2.2/cameraZoom;ctx.setLineDash([5/cameraZoom,5/cameraZoom]);ctx.beginPath();trace.points.forEach((p,i)=>i?ctx.lineTo(screenX(p.x),screenY(p.y)):ctx.moveTo(screenX(p.x),screenY(p.y)));ctx.stroke();ctx.setLineDash([]);
  const rawX=screenX(trace.end.x)*cameraZoom,rawY=screenY(trace.end.y)*cameraZoom,outside=rawX<18||rawX>VW-18||rawY<88||rawY>VH-136,x=clamp(rawX,18,VW-18),y=clamp(rawY,88,Math.max(89,VH-136));
  ctx.scale(1/cameraZoom,1/cameraZoom);ctx.translate(x,y);ctx.lineWidth=2;ctx.strokeStyle=outside?'#9edbff':'#ffe49b';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.moveTo(-11,0);ctx.lineTo(11,0);ctx.moveTo(0,-11);ctx.lineTo(0,11);ctx.stroke();
  ctx.font='700 10px system-ui';const label={water:'수면 도달',bounds:'맵 밖',range:'최대 거리',anchor:'연결 예상',worm:'피격 예상',fuse:'폭발 예상',terrain:'착탄 예상',limit:'예상 끝'}[trace.end.event]||'도착 예상',text=(outside?'화면 밖 · ':'')+label+(trace.type==='rope'?'':' · 힘 '+Math.round(trace.power*100)+'%'),width=Math.min(VW-24,ctx.measureText(text).width+22),lx=clamp(x,12+width/2,VW-12-width/2)-x,ly=clamp(y-24,96,Math.max(96,VH-166))-y;
  ctx.fillStyle='#102a3bed';ctx.beginPath();ctx.roundRect(lx-width/2,ly-11,width,22,6);ctx.fill();ctx.fillStyle='#ffe49b';ctx.font='700 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,lx,ly);ctx.restore();
}
function drawObjects(){
  for(const c of crates){if(c.taken)continue;const x=screenX(c.x),y=screenY(c.y);if(x<-20||x>VW+20)continue;ctx.save();ctx.translate(x,y);ctx.fillStyle=c.type==='health'?'#5bd17a':'#b88449';ctx.fillRect(-9,-9,18,18);ctx.strokeStyle='#fff8';ctx.strokeRect(-9,-9,18,18);ctx.fillStyle='#fff';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(c.type==='health'?'+':'?',0,4);ctx.restore()}
  for(const m of mines){if(!m.armed)continue;const x=screenX(m.x),y=screenY(m.y);const art=ART_MANIFEST.icons.mine;if(drawArt(art.file,art.bounds,x-10,y-7,20,12)){if(m.timer>0){ctx.fillStyle='#ff5757';ctx.beginPath();ctx.arc(x,y-5,3,0,Math.PI*2);ctx.fill()}continue}ctx.fillStyle=m.timer>0?'#ff5a5f':'#303845';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#eee';ctx.fillRect(x-1,y-10,2,5)}
  ctx.fillStyle='#778497';for(const g of girders){ctx.save();ctx.translate(screenX(g.x),screenY(g.y));ctx.fillRect(-g.w/2,-g.h/2,g.w,g.h);ctx.strokeStyle='#c5ced8';ctx.strokeRect(-g.w/2,-g.h/2,g.w,g.h);ctx.restore()}
  if(rope){const w=current();if(w){ctx.strokeStyle='#eee7cb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(screenX(rope.ax),screenY(rope.ay));ctx.lineTo(screenX(w.x),screenY(w.y));ctx.stroke()}}
  for(const o of walkers){const x=screenX(o.x),y=screenY(o.y),a=ART_MANIFEST.icons.sheep;ctx.save();ctx.translate(x,y);ctx.scale(Math.sign(o.vx)||1,1);if(!drawArt(a.file,a.bounds,-16,-23,32,29)){ctx.fillStyle='#f5a443';ctx.fillRect(-12,-16,24,12);ctx.fillStyle='#133647';ctx.beginPath();ctx.arc(-7,-1,4,0,Math.PI*2);ctx.arc(7,-1,4,0,Math.PI*2);ctx.fill()}ctx.restore()}
}
function projectileFuse(p){return ['grenade','banana','sacred','cluster','dynamite'].includes(p.type)&&p.life>0?String(Math.max(1,Math.ceil(p.life))):null}
function drawProjectile(p){
  if(p.trail?.length>1){ctx.save();ctx.strokeStyle='rgba(255,223,154,.72)';ctx.lineWidth=3/cameraZoom;ctx.lineCap='round';ctx.beginPath();p.trail.forEach((q,i)=>i?ctx.lineTo(screenX(q.x),screenY(q.y)):ctx.moveTo(screenX(q.x),screenY(q.y)));ctx.lineTo(screenX(p.x),screenY(p.y));ctx.stroke();ctx.restore()}
  const x=screenX(p.x),y=screenY(p.y),scale=Math.max(1.6,6/(Math.max(1,p.r)*cameraZoom));ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(Math.atan2(p.vy,p.vx));let col='#4c5668';
  if(p.type==='grenade')col='#35633d';if(p.type==='banana')col='#75d7b1';if(p.type==='sacred')col='#f7f7f2';if(p.type==='cluster')col='#cf6f4e';if(p.type==='homing')col='#b8c8db';if(p.type==='mortar')col='#d89c4c';if(p.type==='mini')col='#ff8353';if(p.type==='air')col='#2b3039';if(p.type==='dynamite')col='#d33f3f';if(p.type==='drill')col='#abb2bb';
  const art=['grenade','sacred','dynamite'].includes(p.type)?ART_MANIFEST.icons[p.type]:null;if(art&&artImages[art.file]){const h=Math.max(14,p.r*3),ww=h*art.bounds.w/art.bounds.h;drawArt(art.file,art.bounds,-ww/2,-h/2,ww,h)}else{ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();}if(['bazooka','air','homing'].includes(p.type)){ctx.fillStyle='#ffae44';ctx.beginPath();ctx.moveTo(-p.r,0);ctx.lineTo(-p.r-10,rand(-3,3));ctx.lineTo(-p.r-2,4);ctx.fill()}if(p.type==='sacred'){ctx.strokeStyle='#ffd84e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-7,5,0,Math.PI*2);ctx.stroke()}ctx.restore();const fuse=projectileFuse(p);if(fuse){ctx.save();ctx.translate(x,y);ctx.scale(1/cameraZoom,1/cameraZoom);ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#102337';ctx.strokeText(fuse,0,-18);ctx.fillStyle='#ffec9e';ctx.fillText(fuse,0,-18);ctx.restore()}
}
function drawEffects(){
  for(const e of explosions){const r=lerp(2,Math.max(e.max,(e.kind==='death'?38:30)/cameraZoom),1-e.life),x=screenX(e.x),y=screenY(e.y);ctx.save();ctx.globalAlpha=clamp(e.life,0,1);const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,'#fffce5');g.addColorStop(.32,e.kind==='death'?'#b9ffeb':'#ffdb6b');g.addColorStop(1,'#f9792500');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=e.kind==='death'?'#a2ffe7':'#ffdd86';ctx.lineWidth=2.5/cameraZoom;ctx.beginPath();ctx.arc(x,y,r*.88,0,Math.PI*2);ctx.stroke();ctx.restore()}
  for(const p of particles){ctx.save();ctx.globalAlpha=clamp(p.life,0,1)*(p.kind==='smoke'?.28:1);ctx.fillStyle=p.color;if(p.kind==='smoke'){const r=Math.max(p.size,6/cameraZoom)*(1+(1-p.life/1.25)*.8);ctx.beginPath();ctx.arc(screenX(p.x),screenY(p.y),r,0,Math.PI*2);ctx.fill()}else{const s=Math.max(p.size,1.6/cameraZoom);ctx.fillRect(screenX(p.x),screenY(p.y),s,s)}ctx.restore()}
  for(const label of damageLabels){ctx.save();const short=VH<=320,sx=clamp(screenX(label.w?.x??label.x)*cameraZoom+24,28,VW-28),sy=clamp(screenY(label.w?.y??label.y)*cameraZoom-(short?74:92)-Math.min(label.rise||0,short?12:36),short?84:112,Math.max(short?84:112,VH-142));ctx.translate(sx/cameraZoom,sy/cameraZoom);ctx.scale(1/cameraZoom,1/cameraZoom);ctx.globalAlpha=Math.min(1,label.life*2);ctx.font=(short?'900 18px':'900 22px')+' system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#122333';ctx.fillStyle='#fff0a6';ctx.strokeText('−'+label.amount,0,0);ctx.fillText('−'+label.amount,0,0);ctx.restore()}
}
function drawMini(){
  const mw=mini.width,mh=mini.height;mctx.clearRect(0,0,mw,mh);mctx.fillStyle='#79c9f6';mctx.fillRect(0,0,mw,mh);
  mctx.drawImage(terrain,0,0,WW,WH,0,0,mw,mh);
  const wy=waterY/WH*mh;mctx.fillStyle='rgba(21,110,173,.72)';mctx.fillRect(0,wy,mw,mh-wy);
  for(let t=0;t<2;t++)for(const w of teams[t].worms)if(w.alive){mctx.fillStyle=teams[t].color;mctx.beginPath();mctx.arc(w.x/WW*mw,w.y/WH*mh,3,0,Math.PI*2);mctx.fill()}
  mctx.strokeStyle='#fff';mctx.lineWidth=2;mctx.strokeRect(camera.x/WW*mw,camera.y/WH*mh,VW/cameraZoom/WW*mw,VH/cameraZoom/WH*mh)
}
function render(dt){
  let sx=0,sy=0;if(cameraShake>0){sx=rand(-cameraShake,cameraShake);sy=rand(-cameraShake,cameraShake);}
  ctx.save();ctx.translate(sx,sy);drawSky();ctx.save();ctx.scale(cameraZoom,cameraZoom);drawTerrain();drawObjects();drawTrajectory();drawAimGuide();for(const t of teams)for(const w of t.worms)drawWorm(w);for(const p of projectiles)drawProjectile(p);drawEffects(dt);ctx.restore();ctx.restore();drawMini();
  if(paused){ctx.fillStyle='rgba(5,8,14,.55)';ctx.fillRect(0,0,VW,VH);ctx.fillStyle='#fff';ctx.font='900 38px system-ui';ctx.textAlign='center';ctx.fillText('일시정지',VW/2,VH/2)}
}
