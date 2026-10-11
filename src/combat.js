'use strict';

function damage(w,amount,kx=0,ky=0){
  if(!w.alive)return;w.hp=Math.max(0,w.hp-Math.max(0,Math.round(amount)));w.vx+=kx;w.vy+=ky;if(kx||ky){w.knockTime=.65;w.onGround=false}w.hurt=1;
  if(w.hp<=0){w.alive=false;burst(w.x,w.y,teams[w.team].color,25)}updateHUD()
}
function killWater(w){if(!w.alive)return;w.alive=false;w.hp=0;playSFX('splash');burst(w.x,waterY,'#a1edff',30);toast(`${w.name} 물에 빠짐!`);updateHUD()}
function carve(x,y,r){
  tctx.save();tctx.globalCompositeOperation='destination-out';const g=tctx.createRadialGradient(x,y,r*.1,x,y,r);g.addColorStop(0,'#000');g.addColorStop(.78,'#000');g.addColorStop(1,'rgba(0,0,0,0)');
  tctx.fillStyle=g;tctx.beginPath();tctx.arc(x,y,r,0,Math.PI*2);tctx.fill();tctx.restore();refreshTerrainCollision(x-r-2,y-r-2,r*2+4,r*2+4)
}
function burst(x,y,color,n=18){for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),s=rand(1,5);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rand(0,2),life:rand(.35,1),color,size:rand(2,5)})}}
function explode(x,y,r=58,maxD=55){
  boomSound();carve(x,y,r*.77);cameraShake=Math.max(cameraShake,Math.min(18,r*.18));explosions.push({x,y,max:r,life:1});burst(x,y,'#ffc84f',30);
  for(const t of teams)for(const w of t.worms){if(!w.alive)continue;const d=dist(x,y,w.x,w.y);if(d<r){const f=1-d/r,n=Math.max(.001,d);damage(w,maxD*f,(w.x-x)/n*f*4.4,(w.y-y)/n*f*4.4-1.4*f)}}
  for(const m of mines)if(m.armed&&dist(x,y,m.x,m.y)<r*.72)m.timer=.12
}
function spawnCrate(){
  for(let q=0;q<40;q++){const x=rand(90,WW-90),y=groundY(x)-11;if(y<waterY-18){const types=[...limited,'health','health','health'];crates.push({x,y,type:types[Math.floor(rand(0,types.length))],taken:false});return}}
}
function pickup(w,c){
  c.taken=true;if(c.type==='health'){w.hp=Math.min(100,w.hp+30);toast(`${w.name} 체력 +30`)}else{teams[w.team].ammo[c.type]++;toast(`${weaponNames[c.type]} 획득!`)}
  playSFX('pickup');updateHUD()
}
