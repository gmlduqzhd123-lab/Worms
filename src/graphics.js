'use strict';

const ART_MANIFEST={"background":{"file":"coast.png","source":"source-01.png","method":"imagegen scenic layer, no HUD"},"icons":{"bazooka":{"id":"bazooka","file":"item-bazooka.png","bounds":{"x":16,"y":335,"w":1229,"h":600},"source":"source-11.png"},"grenade":{"id":"grenade","file":"item-grenade.png","bounds":{"x":251,"y":82,"w":766,"h":1106},"source":"source-12.png"},"sacred":{"id":"sacred","file":"item-sacred.png","bounds":{"x":48,"y":31,"w":1158,"h":1165},"source":"source-13.png"},"rope":{"id":"rope","file":"item-rope.png","bounds":{"x":9,"y":338,"w":1236,"h":670},"source":"source-14.png"},"sheep":{"id":"sheep","file":"item-sheep.png","bounds":{"x":72,"y":97,"w":1135,"h":1030},"source":"source-15.png"},"dynamite":{"id":"dynamite","file":"item-dynamite.png","bounds":{"x":244,"y":39,"w":883,"h":1172},"source":"source-16.png"},"mine":{"id":"mine","file":"item-mine.png","bounds":{"x":57,"y":327,"w":1139,"h":654},"source":"source-17.png"},"punch":{"id":"punch","file":"item-punch.png","bounds":{"x":245,"y":41,"w":985,"h":1123},"source":"source-18.png"},"teleport":{"id":"teleport","file":"item-teleport.png","bounds":{"x":81,"y":279,"w":1096,"h":748},"source":"source-19.png"},"jetpack":{"id":"jetpack","file":"item-jetpack.png","bounds":{"x":19,"y":148,"w":1212,"h":944},"source":"source-20.png"}},"characters":[{"id":"soldier","file":"worm-soldier.png","bounds":{"x":188,"y":100,"w":881,"h":1055},"source":"source-21.png"},{"id":"pilot","file":"worm-pilot.png","bounds":{"x":166,"y":83,"w":923,"h":1088},"source":"source-22.png"},{"id":"miner","file":"worm-miner.png","bounds":{"x":208,"y":80,"w":856,"h":1103},"source":"source-23.png"},{"id":"pirate","file":"worm-pirate.png","bounds":{"x":162,"y":28,"w":1009,"h":1167},"source":"source-24.png"},{"id":"ninja","file":"worm-ninja.png","bounds":{"x":98,"y":94,"w":1131,"h":1061},"source":"source-25.png"},{"id":"scientist","file":"worm-scientist.png","bounds":{"x":184,"y":29,"w":972,"h":1130},"source":"source-26.png"},{"id":"cowboy","file":"worm-cowboy.png","bounds":{"x":165,"y":58,"w":1012,"h":1103},"source":"source-27.png"},{"id":"winter","file":"worm-winter.png","bounds":{"x":155,"y":70,"w":996,"h":1088},"source":"source-28.png"},{"id":"knight","file":"worm-knight.png","bounds":{"x":148,"y":42,"w":1027,"h":1130},"source":"source-29.png"},{"id":"astronaut","file":"worm-astronaut.png","bounds":{"x":181,"y":100,"w":936,"h":1070},"source":"source-30.png"}],"themes":[{"id":"coast","name":"햇살 해안","file":"coast.png","source":"source-01.png","description":"푸른 바다와 등대가 보이는 밝은 섬","top":"#ba8644","bottom":"#573c25","rim":"#8fcf38","edge":["#5e9c21","#b5df43"],"rock":["#735536","#c29961"],"speck":["#483221","#ecc48b"],"water":["#38abd8","#0b4d80"],"sky":["#4aa5ed","#bddffa"]},{"id":"ruins","name":"폐허 도시","description":"노을 아래 벽돌 건물과 무너진 다리","top":"#8f7c72","bottom":"#3c3b47","rim":"#bcb0a0","edge":["#928d86","#d5c7b6"],"rock":["#655d5b","#b19885"],"speck":["#413e45","#c4b3a2"],"water":["#947183","#302b49"],"sky":["#686390","#eaae82"],"file":"theme-ruins.png","source":"source-02.png"},{"id":"canyon","name":"사막 협곡","description":"주황빛 사암과 겹겹이 이어지는 메사","top":"#cc8144","bottom":"#743b2e","rim":"#edbd73","edge":["#c58e55","#f0c986"],"rock":["#a34f37","#e09d59"],"speck":["#74392e","#f4bc78"],"water":["#b47c66","#674657"],"sky":["#9483bc","#ffc17d"],"file":"theme-canyon.png","source":"source-03.png"},{"id":"fort","name":"군사 해안","description":"레이더 기지와 바다 건너 정박한 함선","top":"#918260","bottom":"#494a38","rim":"#9fa866","edge":["#77834e","#b7bf7e"],"rock":["#6a705a","#b2ad88"],"speck":["#4a4b38","#c1b490"],"water":["#3d98b2","#183f60"],"sky":["#459bde","#d3ecfa"],"file":"theme-fort.png","source":"source-04.png"},{"id":"meadow","name":"초록 언덕","description":"작은 성과 마을, 강이 흐르는 초원","top":"#94754a","bottom":"#4a3928","rim":"#95cb49","edge":["#60982e","#c4e079"],"rock":["#6d573e","#c6ae80"],"speck":["#4a3928","#d9bd82"],"water":["#6cafb0","#284e68"],"sky":["#64b2ec","#d9edee"],"file":"theme-meadow.png","source":"source-05.png"},{"id":"snow","name":"오로라 설원","description":"달빛과 오로라가 비치는 얼어붙은 해안","top":"#899ead","bottom":"#3b4c67","rim":"#edf5ff","edge":["#bbd4ee","#ffffff"],"rock":["#647b99","#bfcedc"],"speck":["#344864","#d0e0ee"],"water":["#6595b7","#173656"],"sky":["#183a65","#5c869d"],"file":"theme-snow.png","source":"source-06.png"},{"id":"scrap","name":"고철 야적장","description":"크레인 실루엣과 초록빛 오염수","top":"#756850","bottom":"#30332e","rim":"#7e9b3b","edge":["#547a30","#b3c35d"],"rock":["#4e4c43","#9b8870"],"speck":["#2b322b","#a69d6c"],"water":["#70c630","#1e5427"],"sky":["#14294a","#53677f"],"file":"theme-scrap.png","source":"source-07.png"},{"id":"castle","name":"용암 성채","description":"보랏빛 밤하늘과 용암 계곡의 고성","top":"#746569","bottom":"#342a38","rim":"#ad8272","edge":["#88676b","#ccb19b"],"rock":["#56464e","#a68a82"],"speck":["#342a38","#bea293"],"water":["#ffad32","#a42622"],"sky":["#352441","#965264"],"file":"theme-castle.png","source":"source-08.png"},{"id":"moon","name":"달 기지","description":"별빛과 지구를 바라보는 회색 달 표면","top":"#9997a8","bottom":"#474654","rim":"#cdceda","edge":["#9596a8","#e0e2ee"],"rock":["#6c6c80","#b8b8ca"],"speck":["#444453","#d0cfdb"],"water":["#626681","#252638"],"sky":["#090d24","#35425a"],"file":"theme-moon.png","source":"source-09.png"},{"id":"sunset","name":"노을 섬","description":"황금빛 수평선과 먼 화산섬","top":"#9b764b","bottom":"#4b392c","rim":"#afa052","edge":["#7f813c","#d4bd69"],"rock":["#6e583d","#bfa076"],"speck":["#493627","#d8b78a"],"water":["#b67b62","#183c59"],"sky":["#83435b","#f4a063"],"file":"theme-sunset.png","source":"source-10.png"}]};
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
function weaponIcon(id){const a=ART_MANIFEST.icons[id];if(a&&!artFailures.includes(a.file)){const b=a.bounds;return '<svg viewBox="'+b.x+' '+b.y+' '+b.w+' '+b.h+'" aria-hidden="true"><image href="'+artUrl(a.file)+'" width="1254" height="1254"/></svg>'}return '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="'+(ICON_PATHS[id]||ICON_PATHS.target)+'"/></svg>'}
function initGraphics(){graphicsInitialized=true;loadArtwork();const labels=['병사','비행사','광부','해적','닌자','과학자','카우보이','겨울 병사','기사','우주인'];for(const id of ['appearanceA','appearanceB']){const el=document.getElementById(id);el.innerHTML=labels.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join('');el.value=id==='appearanceA'?'0':'2'}for(const b of document.querySelectorAll('.weapon'))b.querySelector('.ico').innerHTML=weaponIcon(b.dataset.w)}
function drawHealthLabel(w,x,y){
 const a=w.hpAnim,animating=!!(a&&gameNow<a.at+a.duration),hp=Math.ceil(displayedHP(w));
 if(!w.alive&&!animating)return;
 ctx.save();ctx.translate(x,y);ctx.scale(1/cameraZoom,1/cameraZoom);x=0;y=-Math.max(0,(cameraZoom-1)*34);ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#102337';ctx.font='800 10px system-ui';ctx.strokeText(w.name,x,y-64);ctx.fillStyle=teams[w.team].color;ctx.fillText(w.name,x,y-64);
 ctx.font='900 12px system-ui';ctx.strokeText('HP '+hp,x,y-48);ctx.fillStyle=animating?'#ffdd8b':'#fff8df';ctx.fillText('HP '+hp,x,y-48);
 ctx.fillStyle='#102337';ctx.fillRect(x-18,y-43,36,5);if(animating){ctx.fillStyle='#ffd387';ctx.fillRect(x-17,y-42,34*a.from/100,3)}ctx.fillStyle=animating?'#ff7373':teams[w.team].color;ctx.fillRect(x-17,y-42,34*hp/100,3);ctx.restore();
}
function drawExplorer(w){
  const x=screenX(w.x),y=screenY(w.y);if(!w.alive){drawHealthLabel(w,x,y);return;}if(x<-55||x>VW/cameraZoom+55||y<-70||y>VH/cameraZoom+70)return;
  const active=w===current()&&!gameOver,dir=w===current()?facing:w.team===0?1:-1,color=teams[w.team].color;
  ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.rotate(w.hurt>0?Math.sin(worldTime*.09)*.1:clamp(w.vx*.025,-.1,.1));
  ctx.fillStyle='rgba(20,30,20,.28)';ctx.beginPath();ctx.ellipse(0,10,15,4,0,0,Math.PI*2);ctx.fill();
  const art=characterArt(w),h=44,ww=h*art.bounds.w/art.bounds.h,bob=w.onGround?Math.sin(worldTime*.016)*Math.min(1.5,Math.abs(w.vx)):0;
  if(!drawArt(art.file,art.bounds,-ww/2,-34+bob,ww,h)){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,-8,11,19,0,0,Math.PI*2);ctx.fill()}
  if(w.hurt>0){ctx.globalAlpha=w.hurt*.3;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,-10,14,22,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  if(active&&!turnLocked&&ART_MANIFEST.icons[selected]&&['bazooka','rope','teleport','punch'].includes(selected)){const tool=ART_MANIFEST.icons[selected];ctx.save();ctx.translate(7,-11);ctx.rotate(aim*Math.PI/180);drawArt(tool.file,tool.bounds,-2,-5,24,24*tool.bounds.h/tool.bounds.w);ctx.restore()}
  ctx.restore();
  if(active){ctx.strokeStyle='#ffe49b';ctx.lineWidth=1.6;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    const ay=y-78+Math.sin(worldTime*.008)*2;ctx.fillStyle='#ffe49b';ctx.strokeStyle='#153044';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-6,ay-7);ctx.lineTo(x+6,ay-7);ctx.lineTo(x,ay);ctx.closePath();ctx.fill();ctx.stroke()}
  drawHealthLabel(w,x,y);
  if(active&&!turnLocked&&!isCPU()&&!projectiles.length&&!targetMode&&!['mine','dynamite','bat','punch','sheep','drill','jetpack'].includes(selected)){const a=aim*Math.PI/180,tx=x+Math.cos(a)*facing*48,ty=y+Math.sin(a)*48;ctx.strokeStyle='#fff1c7';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();ctx.strokeStyle='#ffe49b';ctx.beginPath();ctx.arc(tx,ty,4,0,Math.PI*2);ctx.moveTo(tx-7,ty);ctx.lineTo(tx+7,ty);ctx.stroke()}
}
