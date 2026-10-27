'use strict';

function damage(w,amount,kx=0,ky=0){
  if(!w.alive)return;const shown=displayedHP(w),before=w.hp;w.hp=Math.max(0,w.hp-Math.max(0,Math.round(amount)));const lost=before-w.hp;
  if(lost>0){if(!injuredWorms.includes(w))injuredWorms.push(w);w.hpAnim={from:shown,to:w.hp,at:gameNow,duration:clamp((shown-w.hp)*45,900,4000)+350};if(!shotFocus)rememberImpact(w.x,w.y)}
  if(lost>0){w.hitAt=gameNow;w.hitStrength=clamp(lost/35,.35,1);w.hitDirection=Math.sign(kx)||1;damageLabels.push({x:w.x,y:w.y,w,amount:lost,life:1.4,age:0,rise:0,color:teams[w.team].color});playSFX('hurt')}
  w.vx+=kx;w.vy+=ky;if(kx||ky){w.knockTime=.65;w.onGround=false}w.hurt=1;
  if(w.hp<=0){w.alive=false;const at=w.hpAnim.at+w.hpAnim.duration;w.death={at,burstAt:at+900,end:at+2300,burst:false}}updateHUD()
}
function updateDeaths(){
  for(const t of teams)for(const w of t.worms){const d=w.death;if(!d||d.burst||gameNow<d.burstAt)continue;d.burst=true;
    if(gameNow>=d.end)continue;
    // A cosmetic farewell burst: no damage, craters or chain reactions.
    visualBlast(w.x,w.y-12,48,'death');playSFX('farewell');
  }
}
function killWater(w){if(!w.alive)return;damage(w,w.hp);w.alive=false;rememberImpact(w.x,waterY);playSFX('splash');burst(w.x,waterY,'#a1edff',30);toast(`${w.name} 물에 빠짐!`);updateHUD()}
function carve(x,y,r){
  tctx.save();tctx.globalCompositeOperation='destination-out';const g=tctx.createRadialGradient(x,y,r*.1,x,y,r);g.addColorStop(0,'#000');g.addColorStop(.78,'#000');g.addColorStop(1,'rgba(0,0,0,0)');
  tctx.fillStyle=g;tctx.beginPath();tctx.arc(x,y,r,0,Math.PI*2);tctx.fill();tctx.restore();refreshTerrainCollision(x-r-2,y-r-2,r*2+4,r*2+4)
}
function burst(x,y,color,n=18){for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),s=rand(1,5);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rand(0,2),life:rand(.35,1),color,size:rand(2,5)})}}
function visualBlast(x,y,r,kind='impact'){
  explosions.push({x,y,max:r*1.5,life:1,decay:kind==='death'?1.4:1.8,kind});burst(x,y,kind==='death'?'#9ff3e1':'#ffc84f',kind==='death'?38:36);
  for(let i=0;i<(kind==='death'?12:9);i++)particles.push({x:x+rand(-8,8),y:y+rand(-7,7),vx:rand(-.8,.8),vy:rand(-1.8,-.4),life:rand(.85,1.25),maxLife:1.25,color:'#486778',size:rand(9,18),kind:'smoke'});
  if(particles.length>900)particles.splice(0,particles.length-900);
}
function explode(x,y,r=58,maxD=55,soundType=null){
  rememberImpact(x,y);
  boomSound(r,soundType);carve(x,y,r*.77);cameraShake=Math.max(cameraShake,Math.min(6,r*.07));visualBlast(x,y,r);
  for(const t of teams)for(const w of t.worms){if(!w.alive)continue;const d=dist(x,y,w.x,w.y);if(d<r){const f=1-d/r,n=Math.max(.001,d);damage(w,maxD*f,(w.x-x)/n*f*4.4,(w.y-y)/n*f*4.4-1.4*f)}}
  for(const m of mines)if(m.armed&&dist(x,y,m.x,m.y)<r*.72)m.timer=.12
}
function spawnCrate(){
  for(let q=0;q<40;q++){const x=rand(90,WW-90),y=groundY(x)-11;if(y<waterY-18){const types=[...limited,'health','health','health'];crates.push({x,y,type:types[Math.floor(rand(0,types.length))],taken:false});return}}
}
function pickup(w,c){
  c.taken=true;if(c.type==='health'){w.hp=Math.min(100,w.hp+30);w.hpAnim=null;toast(`${w.name} 체력 +30`)}else{teams[w.team].ammo[c.type]++;toast(`${weaponNames[c.type]} 획득!`)}
  playSFX('pickup');updateHUD()
}
