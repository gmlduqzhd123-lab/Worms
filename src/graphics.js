'use strict';

const ART_MANIFEST={"background":{"file":"coast.png","source":"source-01.png","method":"imagegen scenic layer, no HUD"},"icons":{"bazooka":{"id":"bazooka","file":"tool-bazooka.png","width":256,"height":205,"bounds":{"x":0,"y":0,"w":256,"h":205},"source":"project-generated angle-tools-atlas.png","sourceCell":0,"sourceCrop":{"left":20,"top":52,"width":376,"height":301}},"grenade":{"id":"grenade","file":"tool-grenade.png","width":256,"height":200,"bounds":{"x":0,"y":0,"w":256,"h":200},"source":"project-generated angle-tools-atlas.png","sourceCell":1,"sourceCrop":{"left":396,"top":64,"width":361,"height":282}},"sacred":{"id":"sacred","file":"tool-sacred.png","width":212,"height":256,"bounds":{"x":0,"y":0,"w":212,"h":256},"source":"project-generated angle-tools-atlas.png","sourceCell":2,"sourceCrop":{"left":840,"top":31,"width":302,"height":365}},"rope":{"id":"rope","file":"tool-rope.png","width":256,"height":200,"bounds":{"x":0,"y":0,"w":256,"h":200},"source":"project-generated angle-tools-atlas.png","sourceCell":3,"sourceCrop":{"left":1216,"top":73,"width":365,"height":285}},"sheep":{"id":"sheep","file":"tool-sheep.png","width":233,"height":256,"bounds":{"x":0,"y":0,"w":233,"h":256},"source":"project-generated angle-tools-atlas.png","sourceCell":4,"sourceCrop":{"left":1624,"top":18,"width":325,"height":357}},"dynamite":{"id":"dynamite","file":"tool-dynamite.png","width":248,"height":256,"bounds":{"x":0,"y":0,"w":248,"h":256},"source":"project-generated angle-tools-atlas.png","sourceCell":5,"sourceCrop":{"left":44,"top":408,"width":322,"height":333}},"mine":{"id":"mine","file":"tool-mine.png","width":256,"height":207,"bounds":{"x":0,"y":0,"w":256,"h":207},"source":"project-generated angle-tools-atlas.png","sourceCell":6,"sourceCrop":{"left":422,"top":442,"width":352,"height":284}},"punch":{"id":"punch","file":"tool-punch.png","width":256,"height":247,"bounds":{"x":0,"y":0,"w":256,"h":247},"source":"project-generated angle-tools-atlas.png","sourceCell":7,"sourceCrop":{"left":823,"top":396,"width":363,"height":350}},"teleport":{"id":"teleport","file":"tool-teleport.png","width":256,"height":254,"bounds":{"x":0,"y":0,"w":256,"h":254},"source":"project-generated angle-tools-atlas.png","sourceCell":8,"sourceCrop":{"left":1226,"top":403,"width":349,"height":346}},"jetpack":{"id":"jetpack","file":"tool-jetpack.png","width":256,"height":232,"bounds":{"x":0,"y":0,"w":256,"h":232},"source":"project-generated angle-tools-atlas.png","sourceCell":9,"sourceCrop":{"left":1606,"top":411,"width":363,"height":329}}},"characters":[{"id":"scout","name":"삼각봇","file":"bot-scout.png","width":324,"height":369,"bounds":{"x":0,"y":0,"w":324,"h":369},"source":"project-generated angle-bots-atlas.png","sourceCell":0,"sourceCrop":{"left":38,"top":13,"width":324,"height":369}},{"id":"prism","name":"프리즘봇","file":"bot-prism.png","width":319,"height":363,"bounds":{"x":0,"y":0,"w":319,"h":363},"source":"project-generated angle-bots-atlas.png","sourceCell":1,"sourceCrop":{"left":441,"top":18,"width":319,"height":363}},{"id":"orbit","name":"궤도봇","file":"bot-orbit.png","width":314,"height":369,"bounds":{"x":0,"y":0,"w":314,"h":369},"source":"project-generated angle-bots-atlas.png","sourceCell":2,"sourceCrop":{"left":841,"top":13,"width":314,"height":369}},{"id":"maker","name":"공작봇","file":"bot-maker.png","width":323,"height":367,"bounds":{"x":0,"y":0,"w":323,"h":367},"source":"project-generated angle-bots-atlas.png","sourceCell":3,"sourceCrop":{"left":1242,"top":15,"width":323,"height":367}},{"id":"spark","name":"번개봇","file":"bot-spark.png","width":308,"height":371,"bounds":{"x":0,"y":0,"w":308,"h":371},"source":"project-generated angle-bots-atlas.png","sourceCell":4,"sourceCrop":{"left":1649,"top":11,"width":308,"height":371}},{"id":"relay","name":"통신봇","file":"bot-relay.png","width":331,"height":360,"bounds":{"x":0,"y":0,"w":331,"h":360},"source":"project-generated angle-bots-atlas.png","sourceCell":5,"sourceCrop":{"left":30,"top":412,"width":331,"height":360}},{"id":"comet","name":"혜성봇","file":"bot-comet.png","width":336,"height":346,"bounds":{"x":0,"y":0,"w":336,"h":346},"source":"project-generated angle-bots-atlas.png","sourceCell":6,"sourceCrop":{"left":434,"top":427,"width":336,"height":346}},{"id":"polar","name":"빙하봇","file":"bot-polar.png","width":335,"height":311,"bounds":{"x":0,"y":0,"w":335,"h":311},"source":"project-generated angle-bots-atlas.png","sourceCell":7,"sourceCrop":{"left":837,"top":459,"width":335,"height":311}},{"id":"captain","name":"대장봇","file":"bot-captain.png","width":335,"height":362,"bounds":{"x":0,"y":0,"w":335,"h":362},"source":"project-generated angle-bots-atlas.png","sourceCell":8,"sourceCrop":{"left":1238,"top":411,"width":335,"height":362}},{"id":"nova","name":"새별봇","file":"bot-nova.png","width":321,"height":359,"bounds":{"x":0,"y":0,"w":321,"h":359},"source":"project-generated angle-bots-atlas.png","sourceCell":9,"sourceCrop":{"left":1640,"top":411,"width":321,"height":359}}],"themes":[{"id":"coast","name":"햇살 해안","file":"coast.png","source":"source-01.png","description":"푸른 바다와 등대가 보이는 밝은 섬","top":"#ba8644","bottom":"#573c25","rim":"#8fcf38","edge":["#5e9c21","#b5df43"],"rock":["#735536","#c29961"],"speck":["#483221","#ecc48b"],"water":["#38abd8","#0b4d80"],"sky":["#4aa5ed","#bddffa"]},{"id":"ruins","name":"폐허 도시","description":"노을 아래 벽돌 건물과 무너진 다리","top":"#8f7c72","bottom":"#3c3b47","rim":"#bcb0a0","edge":["#928d86","#d5c7b6"],"rock":["#655d5b","#b19885"],"speck":["#413e45","#c4b3a2"],"water":["#947183","#302b49"],"sky":["#686390","#eaae82"],"file":"theme-ruins.png","source":"source-02.png"},{"id":"canyon","name":"사막 협곡","description":"주황빛 사암과 겹겹이 이어지는 메사","top":"#cc8144","bottom":"#743b2e","rim":"#edbd73","edge":["#c58e55","#f0c986"],"rock":["#a34f37","#e09d59"],"speck":["#74392e","#f4bc78"],"water":["#b47c66","#674657"],"sky":["#9483bc","#ffc17d"],"file":"theme-canyon.png","source":"source-03.png"},{"id":"fort","name":"군사 해안","description":"레이더 기지와 바다 건너 정박한 함선","top":"#918260","bottom":"#494a38","rim":"#9fa866","edge":["#77834e","#b7bf7e"],"rock":["#6a705a","#b2ad88"],"speck":["#4a4b38","#c1b490"],"water":["#3d98b2","#183f60"],"sky":["#459bde","#d3ecfa"],"file":"theme-fort.png","source":"source-04.png"},{"id":"meadow","name":"초록 언덕","description":"작은 성과 마을, 강이 흐르는 초원","top":"#94754a","bottom":"#4a3928","rim":"#95cb49","edge":["#60982e","#c4e079"],"rock":["#6d573e","#c6ae80"],"speck":["#4a3928","#d9bd82"],"water":["#6cafb0","#284e68"],"sky":["#64b2ec","#d9edee"],"file":"theme-meadow.png","source":"source-05.png"},{"id":"snow","name":"오로라 설원","description":"달빛과 오로라가 비치는 얼어붙은 해안","top":"#899ead","bottom":"#3b4c67","rim":"#edf5ff","edge":["#bbd4ee","#ffffff"],"rock":["#647b99","#bfcedc"],"speck":["#344864","#d0e0ee"],"water":["#6595b7","#173656"],"sky":["#183a65","#5c869d"],"file":"theme-snow.png","source":"source-06.png"},{"id":"scrap","name":"고철 야적장","description":"크레인 실루엣과 초록빛 오염수","top":"#756850","bottom":"#30332e","rim":"#7e9b3b","edge":["#547a30","#b3c35d"],"rock":["#4e4c43","#9b8870"],"speck":["#2b322b","#a69d6c"],"water":["#70c630","#1e5427"],"sky":["#14294a","#53677f"],"file":"theme-scrap.png","source":"source-07.png"},{"id":"castle","name":"용암 성채","description":"보랏빛 밤하늘과 용암 계곡의 고성","top":"#746569","bottom":"#342a38","rim":"#ad8272","edge":["#88676b","#ccb19b"],"rock":["#56464e","#a68a82"],"speck":["#342a38","#bea293"],"water":["#ffad32","#a42622"],"sky":["#352441","#965264"],"file":"theme-castle.png","source":"source-08.png"},{"id":"moon","name":"달 기지","description":"별빛과 지구를 바라보는 회색 달 표면","top":"#9997a8","bottom":"#474654","rim":"#cdceda","edge":["#9596a8","#e0e2ee"],"rock":["#6c6c80","#b8b8ca"],"speck":["#444453","#d0cfdb"],"water":["#626681","#252638"],"sky":["#090d24","#35425a"],"file":"theme-moon.png","source":"source-09.png"},{"id":"sunset","name":"노을 섬","description":"황금빛 수평선과 먼 화산섬","top":"#9b764b","bottom":"#4b392c","rim":"#afa052","edge":["#7f813c","#d4bd69"],"rock":["#6e583d","#bfa076"],"speck":["#493627","#d8b78a"],"water":["#b67b62","#183c59"],"sky":["#83435b","#f4a063"],"file":"theme-sunset.png","source":"source-10.png"}]};
const artImages={},artFailures=[];let artReady=false;
function artUrl(file){return (window.WORMFRONT_ASSET_DATA||{})[file]||'./assets/images/'+file}
function loadArtwork(){const files=['coast.png',...Object.values(ART_MANIFEST.icons).map(a=>a.file),...ART_MANIFEST.characters.map(a=>a.file)];return Promise.all(files.map(loadArtFile)).then(()=>{artReady=true})}

const MAP_THEMES=ART_MANIFEST.themes;let activeMapTheme='coast';
const artRequests={};
function getMapTheme(){return MAP_THEMES.find(t=>t.id===activeMapTheme)||MAP_THEMES[0]}
function loadArtFile(file){if(artRequests[file])return artRequests[file];artRequests[file]=new Promise(resolve=>{const img=new Image();img.onload=()=>{artImages[file]=img;resolve(true)};img.onerror=()=>{artFailures.push(file);for(const [id,a] of Object.entries(ART_MANIFEST.icons))if(a.file===file){const el=document.querySelector('[data-w="'+id+'"] .ico');if(el)el.innerHTML=weaponIcon(id)}resolve(false)};img.src=artUrl(file)});return artRequests[file]}
function updateThemePreview(){const el=document.getElementById('mapTheme'),theme=MAP_THEMES.find(t=>t.id===el.value)||MAP_THEMES[0];const preview=document.getElementById('themePreview');preview.style.setProperty('--theme-sky',theme.sky[0]);document.getElementById('themeName').textContent=theme.name;document.getElementById('themeDescription').textContent=theme.description;const img=document.getElementById('themePreviewImage');img.hidden=true;const requested=theme.id;loadArtFile(theme.file).then(ok=>{if(el.value!==requested)return;img.hidden=!ok;if(ok)img.src=artUrl(theme.file)});}
function initThemes(){updateThemePreview();document.getElementById('mapTheme').addEventListener('change',()=>{updateThemePreview();if(!started)buildWorld(+document.getElementById('mapSize').value)});}
function drawArt(file,bounds,x,y,width,height){const img=artImages[file];if(!img)return false;ctx.drawImage(img,bounds.x,bounds.y,bounds.w,bounds.h,x,y,width,height);return true}
function characterArt(w){const start=+document.getElementById(w.team===0?'appearanceA':'appearanceB').value;return ART_MANIFEST.characters[(start+w.idx)%10]}

// Vector fallbacks for items not supplied in the artwork ZIP.
const ICON_PATHS={
 bazooka:'M3 10h16v14H3z M19 8h10v18H19z M22 12h4v10h-4 M7 24v4h9v-4',
 grenade:'M16 4a12 12 0 1 0 0 24a12 12 0 1 0 0-24 M4 16h24 M10 6l3 4 M21 25l-3-4',
 shotgun:'M5 12h24v4H15l-3 4H8l-3 5 M19 16v8h-5v-7',
 banana:'M8 25Q1 15 13 5Q24 1 26 14Q26 28 8 25 M11 21l10-12 M11 13h3 M17 20h3',
 sacred:'M16 2l4 9 10 1-8 7 2 11-8-6-8 6 2-11-8-7 10-1z',
 cluster:'M8 9h16l3 15-5 4H10l-5-4z M11 14h2 M19 14h2 M15 21h2',
 homing:'M4 16h24 M16 4v24 M8 8a12 12 0 1 1 0 16 M12 12h8v8h-8z',
 mortar:'M8 26l5-19 9 3-8 19 M4 29h24 M19 6l2-3',
 airstrike:'M16 3l3 10 11 6v3l-11-3v7l4 3H9l4-3v-7L2 22v-3l11-6z',
 dynamite:'M5 7l11-5 11 5v20H5z M16 11a7 7 0 1 0 0 14a7 7 0 1 0 0-14 M16 14v4l3 2',
 mine:'M3 11l13-8 13 8v14l-13 5-13-5z M16 10a6 6 0 1 0 0 12a6 6 0 1 0 0-12',
 bat:'M13 15h6v16h-6z M4 5h24v12H4z M7 8h18',
 punch:'M6 4h20v12H6z M10 16l12 4-12 4 12 4 M7 30h18',
 sheep:'M4 9h24v13H4z M9 25a3 3 0 1 0 0 .1 M23 25a3 3 0 1 0 0 .1 M10 3v6 M6 3h8 M19 12a3 3 0 1 0 0 .1',
 drill:'M11 4h10v9H11z M9 13h14l-7 17z M12 18h8 M14 23h4',
 rope:'M3 4h16v23H3z M7 8h8v15H7z M19 10q11-4 10 8v9h-7v-9 M22 24h7',
 jetpack:'M6 6h8v18H6z M18 6h8v18h-8z M3 8l3 15 M29 8l-3 15 M9 24l1 7 2-7 M20 24l2 7 1-7',
 teleport:'M16 3l9 8-9 8-9-8z M16 19v7 M5 30l11-4 11 4 M5 22v8 M27 22v8',
 girder:'M3 12h26v12H3z M3 12l9 12 9-12 8 12',
 target:'M5 16a11 11 0 1 0 22 0a11 11 0 1 0-22 0 M16 8v16 M8 16h16',
 jump:'M6 27l12-20 M10 8l8-1 1 9 M4 29h24',
 rocket:'M5 12h20v8H5z M25 11l5 5-5 5 M3 13l-2 3 2 3',
 map:'M3 8l9-4 8 4 9-4v21l-9 4-8-4-9 4z M12 4v21 M20 8v21',
 flag:'M8 29V4l18 3-5 6 5 6-18-3'
};
function weaponIcon(id){const a=ART_MANIFEST.icons[id];if(a&&!artFailures.includes(a.file)){const b=a.bounds;return '<svg viewBox="'+b.x+' '+b.y+' '+b.w+' '+b.h+'" aria-hidden="true"><image href="'+artUrl(a.file)+'" width="'+(a.width||1254)+'" height="'+(a.height||1254)+'"/></svg>'}return '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="'+(ICON_PATHS[id]||ICON_PATHS.target)+'"/></svg>'}
function initGraphics(){graphicsInitialized=true;loadArtwork();const labels=ART_MANIFEST.characters.map(c=>c.name);for(const id of ['appearanceA','appearanceB']){const el=document.getElementById(id);el.innerHTML=labels.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join('');el.value=id==='appearanceA'?'0':'2'}for(const b of document.querySelectorAll('.weapon'))b.querySelector('.ico').innerHTML=weaponIcon(b.dataset.w)}
function drawHealthLabel(w,x,y){
 const a=w.hpAnim,animating=!!(a&&gameNow<a.at+a.duration),hp=Math.ceil(displayedHP(w));
 if(!w.alive&&!animating&&!deathAnimating(w))return;
 const compact=VH<=320&&(initialBattleView||wormIntro?.overview);
 ctx.save();ctx.translate(x,y);ctx.scale(1/cameraZoom,1/cameraZoom);x=0;y=(compact?18:0)-Math.max(0,(cameraZoom-1)*34);ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#102337';ctx.font=compact?'800 8px system-ui':'800 10px system-ui';ctx.strokeText(w.name,x,y-64);ctx.fillStyle=teams[w.team].color;ctx.fillText(w.name,x,y-64);
 ctx.font=compact?'900 10px system-ui':'900 12px system-ui';ctx.strokeText('HP '+hp,x,y-48);ctx.fillStyle=animating?'#ffdd8b':'#fff8df';ctx.fillText('HP '+hp,x,y-48);
 ctx.fillStyle='#102337';ctx.fillRect(x-18,y-43,36,5);if(animating){ctx.fillStyle='#ffd387';ctx.fillRect(x-17,y-42,34*a.from/100,3)}ctx.fillStyle=animating?'#ff7373':teams[w.team].color;ctx.fillRect(x-17,y-42,34*hp/100,3);ctx.restore();
}
// Aim elevation is measured from the horizontal in the worm's facing direction.
// Keep this HUD in screen pixels so camera zoom cannot shrink the degree labels.
function canShowAimGuide(){
 const w=current();
 return !!(w?.alive&&started&&!paused&&!wormIntro&&!gameOver&&!overview&&!turnLocked&&!turnEnding&&retreatUntil<=gameNow&&!isCPU()&&!projectiles.length&&!walkers.length&&(!targetMode||targetMode==='homing')&&!rope&&!jetpack&&['bazooka','grenade','shotgun','banana','sacred','cluster','mortar','homing','rope'].includes(selected));
}
function aimGuideState(){
 if(!canShowAimGuide())return null;const w=current();
 const x=screenX(w.x)*cameraZoom,y=screenY(w.y)*cameraZoom;
 if(x<0||x>VW||y<0||y>VH)return null;
 return{x,y,radius:Math.min(VW,VH)<500?68:96,angle:-aim,facing};
}
function drawAimGuide(){
 const guide=aimGuideState();if(!guide)return;
 const {x,y,radius,angle,facing:dir}=guide;
 const point=(deg,r)=>({x:Math.cos(deg*Math.PI/180)*dir*r,y:-Math.sin(deg*Math.PI/180)*r});
 ctx.save();ctx.scale(1/cameraZoom,1/cameraZoom);ctx.translate(x,y);
 ctx.save();ctx.scale(dir,1);ctx.fillStyle='rgba(16,42,61,.14)';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,-Math.PI/2,Math.max(0,-angle*Math.PI/180));ctx.closePath();ctx.fill();
 ctx.strokeStyle='rgba(245,250,255,.85)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(0,0,radius,-Math.PI/2,0);ctx.stroke();ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(radius,0);ctx.moveTo(0,-radius+6);ctx.lineTo(0,-radius-5);ctx.stroke();ctx.restore();
 ctx.font='800 '+(radius===68?10:12)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 for(let deg=0;deg<=90;deg+=15){
  const a=point(deg,radius-5),b=point(deg,radius+3);ctx.strokeStyle='rgba(245,250,255,.9)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  if([0,30,45,60,90].includes(deg)&&Math.abs(angle-deg)>=8){const p=point(deg,deg===0&&radius===68?radius-12:radius+15);if(deg===0&&radius===68)p.y-=12;if(deg===90&&radius===68)p.x+=dir*20;ctx.strokeStyle='#153044';ctx.lineWidth=3;ctx.strokeText(deg+'°',p.x,p.y);ctx.fillStyle='#fff8e6';ctx.fillText(deg+'°',p.x,p.y)}
 }
 const tickA=point(angle,radius-7),tickB=point(angle,radius+6);
 ctx.strokeStyle='#ffe49b';
 ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(tickA.x,tickA.y);ctx.lineTo(tickB.x,tickB.y);ctx.stroke();
 // Put the readout outside the tick labels and keep it inside the viewport.
 const label=point(angle,radius===68&&angle<15?radius-12:radius+38);if(radius===68&&angle<15)label.y-=24;
 const labelX=clamp(x+label.x,24,VW-24)-x,labelY=clamp(y+label.y,13,VH-13)-y;
 ctx.fillStyle='rgba(17,43,61,.94)';ctx.strokeStyle='rgba(255,228,155,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(labelX-23,labelY-11,46,22,10);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffe49b';ctx.font='900 12px system-ui';ctx.fillText((Math.round(angle)<0?'−'+Math.abs(Math.round(angle)):Math.round(angle))+'°',labelX,labelY);ctx.restore();
}
function drawExplorer(w){
  const x=screenX(w.x),y=screenY(w.y),dying=!w.alive&&deathAnimating(w);if(!w.alive&&(!dying||gameNow>=w.death.burstAt)){drawHealthLabel(w,x,y);return;}if(x<-55||x>VW/cameraZoom+55||y<-70||y>VH/cameraZoom+70)return;
  const active=w.alive&&w===current()&&!gameOver,dir=w===current()?facing:w.team===0?1:-1,color=teams[w.team].color;
  const viewScale=(initialBattleView||previewFit||wormIntro?.overview||injuredWorms.includes(w)&&presentationPending())?Math.max(1,.55/cameraZoom):1,pulse=w.hitAt===undefined?w.hurt:clamp(1-(gameNow-w.hitAt)/600,0,1),strength=w.hitStrength||.5;
  ctx.save();ctx.translate(x,y);ctx.scale(dir*viewScale,viewScale);if(pulse>0){const kick=Math.sin((1-pulse)*Math.PI)*strength;ctx.translate(-(w.hitDirection||1)*kick*5/(cameraZoom*viewScale),-kick*3/(cameraZoom*viewScale));ctx.scale(1+kick*.13,1-kick*.13)}ctx.rotate(pulse>0?Math.sin(worldTime*.065)*pulse*.32*strength:clamp(w.vx*.025,-.1,.1));
  if(dying){const t=clamp((gameNow-w.death.at)/900,0,1);ctx.translate(0,-Math.sin(t*Math.PI)*18);ctx.rotate(Math.sin(t*Math.PI*5)*.32);ctx.scale(1-t*.25,1-t*.3);ctx.globalAlpha=1-t*.25}
  ctx.fillStyle='rgba(20,30,20,.28)';ctx.beginPath();ctx.ellipse(0,10,15,4,0,0,Math.PI*2);ctx.fill();
  const art=characterArt(w),h=44,ww=h*art.bounds.w/art.bounds.h,bob=w.onGround?Math.sin(worldTime*.016)*Math.min(1.5,Math.abs(w.vx)):0;
  if(!drawArt(art.file,art.bounds,-ww/2,-34+bob,ww,h)){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(16,5);ctx.lineTo(-16,5);ctx.closePath();ctx.fill();ctx.fillStyle='#ffcf55';ctx.beginPath();ctx.arc(4,-8,5,0,Math.PI*2);ctx.fill()}
  if(pulse>0){ctx.globalAlpha=pulse*.6;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,-10,14,22,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  if(active&&!turnLocked&&ART_MANIFEST.icons[selected]&&['bazooka','rope','teleport','punch'].includes(selected)){const tool=ART_MANIFEST.icons[selected];ctx.save();ctx.translate(7,-11);ctx.rotate(aim*Math.PI/180);drawArt(tool.file,tool.bounds,-2,-5,24,24*tool.bounds.h/tool.bounds.w);ctx.restore()}
  ctx.restore();
  if(pulse>0){ctx.save();ctx.translate(x,y);ctx.scale(1/cameraZoom,1/cameraZoom);ctx.globalAlpha=pulse;ctx.strokeStyle='#ffe49b';ctx.lineWidth=2;for(let i=0;i<5;i++){const a=i*Math.PI*2/5+worldTime*.003,r=20+(1-pulse)*12;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,-22+Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+5),-22+Math.sin(a)*(r+5));ctx.stroke()}ctx.restore()}
  if(active){ctx.strokeStyle='#ffe49b';ctx.lineWidth=1.6;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    const ay=y-78+Math.sin(worldTime*.008)*2;ctx.fillStyle='#ffe49b';ctx.strokeStyle='#153044';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-6,ay-7);ctx.lineTo(x+6,ay-7);ctx.lineTo(x,ay);ctx.closePath();ctx.fill();ctx.stroke()}
  drawHealthLabel(w,x,y);
}
