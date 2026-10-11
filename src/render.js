'use strict';

/* ---------------- Render ---------------- */
function drawSky(){
  const g=ctx.createLinearGradient(0,0,0,VH);g.addColorStop(0,sudden?'#4c5979':'#18394e');g.addColorStop(.62,sudden?'#81879e':'#578b99');g.addColorStop(1,'#e4dcc0');ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  const sunWorld=WW*.78;const sx=sunWorld-camera.x*.12;ctx.fillStyle=sudden?'rgba(242,226,178,.66)':'rgba(255,232,182,.92)';ctx.beginPath();ctx.arc(sx,VH*.16,33,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=sudden?'rgba(220,224,232,.56)':'rgba(220,236,225,.30)';
  for(const c of clouds){const x=c.x-camera.x*.55,y=c.y-camera.y*.2,s=c.s;if(x<-120||x>VW+120)continue;ctx.beginPath();ctx.ellipse(x,y,42*s,16*s,0,0,Math.PI*2);ctx.ellipse(x+28*s,y-8*s,27*s,18*s,0,0,Math.PI*2);ctx.ellipse(x-27*s,y-5*s,25*s,14*s,0,0,Math.PI*2);ctx.fill()}
  const sy=(waterY-camera.y)*cameraZoom;const sea=ctx.createLinearGradient(0,sy,0,VH);sea.addColorStop(0,sudden?'#3b536f':'#62b4ba');sea.addColorStop(1,'#0b4d80');ctx.fillStyle=sea;ctx.fillRect(0,sy,VW,VH-sy);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<VW;x+=12){const y=sy+Math.sin((x+camera.x+worldTime*.05)*.04)*2;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()
}
function drawTerrain(){ctx.drawImage(terrain,camera.x,camera.y,VW/cameraZoom,VH/cameraZoom,0,0,VW/cameraZoom,VH/cameraZoom)}
function drawWorm(w){drawExplorer(w)}
function drawObjects(){
  for(const c of crates){if(c.taken)continue;const x=screenX(c.x),y=screenY(c.y);if(x<-20||x>VW+20)continue;ctx.save();ctx.translate(x,y);ctx.fillStyle=c.type==='health'?'#5bd17a':'#b88449';ctx.fillRect(-9,-9,18,18);ctx.strokeStyle='#fff8';ctx.strokeRect(-9,-9,18,18);ctx.fillStyle='#fff';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(c.type==='health'?'+':'?',0,4);ctx.restore()}
  for(const m of mines){if(!m.armed)continue;const x=screenX(m.x),y=screenY(m.y);ctx.fillStyle=m.timer>0?'#ff5a5f':'#303845';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#eee';ctx.fillRect(x-1,y-10,2,5)}
  ctx.fillStyle='#778497';for(const g of girders){ctx.save();ctx.translate(screenX(g.x),screenY(g.y));ctx.fillRect(-g.w/2,-g.h/2,g.w,g.h);ctx.strokeStyle='#c5ced8';ctx.strokeRect(-g.w/2,-g.h/2,g.w,g.h);ctx.restore()}
  if(rope){const w=current();if(w){ctx.strokeStyle='#eee7cb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(screenX(rope.ax),screenY(rope.ay));ctx.lineTo(screenX(w.x),screenY(w.y));ctx.stroke()}}
  for(const o of walkers){const x=screenX(o.x),y=screenY(o.y);ctx.font='22px serif';ctx.textAlign='center';ctx.fillText('🐑',x,y+7)}
}
function drawProjectile(p){
  const x=screenX(p.x),y=screenY(p.y);ctx.save();ctx.translate(x,y);let col='#4c5668';
  if(p.type==='grenade')col='#35633d';if(p.type==='banana')col='#f4d13e';if(p.type==='sacred')col='#f7f7f2';if(p.type==='cluster')col='#cf6f4e';if(p.type==='homing')col='#b8c8db';if(p.type==='mortar')col='#d89c4c';if(p.type==='mini')col='#ff8353';if(p.type==='air')col='#2b3039';if(p.type==='dynamite')col='#d33f3f';if(p.type==='drill')col='#abb2bb';
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();if(['bazooka','air','homing'].includes(p.type)){ctx.fillStyle='#ffae44';ctx.beginPath();ctx.moveTo(-p.r,0);ctx.lineTo(-p.r-10,rand(-3,3));ctx.lineTo(-p.r-2,4);ctx.fill()}if(p.type==='sacred'){ctx.strokeStyle='#ffd84e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-7,5,0,Math.PI*2);ctx.stroke()}ctx.restore()
}
function drawEffects(){
  for(const e of explosions){const r=lerp(2,e.max,1-e.life);ctx.fillStyle=`rgba(255,${Math.floor(145+90*e.life)},55,${Math.max(0,e.life)*.63})`;ctx.beginPath();ctx.arc(screenX(e.x),screenY(e.y),r,0,Math.PI*2);ctx.fill()}
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(screenX(p.x),screenY(p.y),p.size,p.size);ctx.globalAlpha=1}
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
  ctx.save();ctx.translate(sx,sy);drawSky();ctx.save();ctx.scale(cameraZoom,cameraZoom);drawTerrain();drawObjects();for(const t of teams)for(const w of t.worms)drawWorm(w);for(const p of projectiles)drawProjectile(p);drawEffects(dt);ctx.restore();ctx.restore();drawMini();
  if(paused){ctx.fillStyle='rgba(5,8,14,.55)';ctx.fillRect(0,0,VW,VH);ctx.fillStyle='#fff';ctx.font='900 38px system-ui';ctx.textAlign='center';ctx.fillText('일시정지',VW/2,VH/2)}
}
