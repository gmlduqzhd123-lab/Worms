'use strict';

function resize(){
  DPR=Math.max(1,Math.min(2,devicePixelRatio||1));VW=innerWidth;VH=innerHeight;
  canvas.width=Math.round(VW*DPR);canvas.height=Math.round(VH*DPR);canvas.style.width=VW+'px';canvas.style.height=VH+'px';ctx.setTransform(DPR,0,0,DPR,0,0);
  mini.width=500;mini.height=130;
  if(!graphicsInitialized)return;
  if(!started) buildWorld(+document.getElementById('mapSize').value);else clampCamera();
}
addEventListener('resize',resize);

function buildWorld(mult){
  activeMapTheme=MAP_THEMES.some(t=>t.id===document.getElementById('mapTheme').value)?document.getElementById('mapTheme').value:'coast';loadArtFile(getMapTheme().file);
  WW=Math.max(2600,Math.round(VW*mult));WH=Math.max(820,Math.round(VH*1.18));
  terrain.width=WW;terrain.height=WH;baseWater=WH*.875;waterY=baseWater;
  generateTerrain();
  camera.x=0;camera.y=Math.max(0,WH-VH);
}

function refreshTerrainCollision(x=0,y=0,width=WW,height=WH){
  if(collisionWidth!==WW||collisionHeight!==WH){collisionWidth=WW;collisionHeight=WH;terrainCollision=new Uint8Array(WW*WH);x=0;y=0;width=WW;height=WH}
  const left=Math.max(0,Math.floor(x)),top=Math.max(0,Math.floor(y));
  const right=Math.min(WW,Math.ceil(x+width)),bottom=Math.min(WH,Math.ceil(y+height));
  if(right<=left||bottom<=top)return;
  const rw=right-left,rh=bottom-top,pixels=tctx.getImageData(left,top,rw,rh).data;
  terrainReadbacks++;terrainReadPixels+=rw*rh;
  for(let row=0;row<rh;row++){const src=row*rw*4,dst=(top+row)*WW+left;for(let col=0;col<rw;col++)terrainCollision[dst+col]=pixels[src+col*4+3]>40?1:0}
}
function solid(x,y){
  if(x<0||x>=WW||y<0||y>=WH)return false;
  return terrainCollision[Math.floor(y)*WW+Math.floor(x)]===1
}
function groundY(x,start=0){
  for(let y=Math.max(0,start);y<waterY-2;y+=3)if(solid(x,y))return y;
  return waterY-3
}

function generateTerrain(){
  const theme=getMapTheme();
  tctx.setTransform(1,0,0,1,0,0);tctx.clearRect(0,0,WW,WH);
  const pts=[],base=WH*.60,seed=rand(0,200);
  for(let x=0;x<=WW;x+=22){
    let y=base+Math.sin(x*.0055+seed)*54+Math.sin(x*.013+seed*.37)*31+Math.sin(x*.002+seed*1.6)*75+rand(-7,7);
    if(Math.sin(x*.0012+seed)>0.65)y-=45;
    pts.push([x,clamp(y,WH*.34,WH*.77)])
  }
  const g=tctx.createLinearGradient(0,WH*.3,0,WH);g.addColorStop(0,theme.top);g.addColorStop(1,theme.bottom);
  tctx.fillStyle=g;tctx.beginPath();tctx.moveTo(0,WH);pts.forEach(p=>tctx.lineTo(p[0],p[1]));tctx.lineTo(WW,WH);tctx.closePath();tctx.fill();
  tctx.strokeStyle=theme.rim;tctx.lineWidth=8;tctx.beginPath();pts.forEach((p,i)=>i?tctx.lineTo(p[0],p[1]):tctx.moveTo(p[0],p[1]));tctx.stroke();

  // Paint inside the existing terrain alpha so decoration does not alter collision geometry.
  tctx.save();tctx.globalCompositeOperation='source-atop';
  for(let i=0;i<pts.length-1;i++){const [x,y]=pts[i];tctx.fillStyle=theme.edge[i%2];tctx.beginPath();tctx.moveTo(x,y+1);tctx.lineTo(x+6,y-5);tctx.lineTo(x+11,y+5);tctx.lineTo(x+18,y-2);tctx.lineTo(x+22,y+9);tctx.lineTo(x,y+10);tctx.closePath();tctx.fill()}
  for(let i=0;i<WW/40;i++){const x=rand(0,WW),y=rand(WH*.45,WH);tctx.fillStyle=theme.rock[i%2];tctx.beginPath();tctx.ellipse(x,y,rand(3,8),rand(2,5),rand(-1,1),0,Math.PI*2);tctx.fill()}
  tctx.restore();
  refreshTerrainCollision();
  tctx.save();tctx.globalAlpha=.24;
  for(let i=0;i<Math.min(4000,WW*1.2);i++){
    const x=rand(0,WW),y=rand(WH*.4,WH);if(solid(x,y)){tctx.fillStyle=theme.speck[Math.random()<.5?0:1];tctx.fillRect(x,y,rand(1,4),rand(1,4))}
  }tctx.restore();

  tctx.globalCompositeOperation='destination-out';
  for(let i=0;i<Math.floor(WW/280);i++){
    const x=rand(90,WW-90),y=rand(WH*.57,WH*.78);
    tctx.beginPath();tctx.ellipse(x,y,rand(25,78),rand(16,48),rand(-.8,.8),0,Math.PI*2);tctx.fill()
  }
  tctx.globalCompositeOperation='source-over';
  refreshTerrainCollision();

  clouds=Array.from({length:Math.max(12,Math.floor(WW/340))},()=>({x:rand(-200,WW),y:rand(55,WH*.30),s:rand(.55,1.35),v:rand(.012,.045)}));
  mines=[];crates=[];girders=[];walkers=[];
  seedMines(initialMineCount)
}
function seedMines(n){
  for(let i=0;i<n;i++){const x=rand(100,WW-100),y=groundY(x)-6;if(y<waterY-10)mines.push({x,y,armed:true,timer:0,owner:-1})}
}
