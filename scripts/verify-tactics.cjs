const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const evidence=path.join(root,'verification','stage9');fs.mkdirSync(evidence,{recursive:true});
const injection=`
function resetCheck(){
 cameraZoom=1;overview=false;camera.manualUntil=0;heldControls.clear();cameraPointers.clear();dragCamera=null;physicsAccumulator=0;physicsSteps=0;settledSince=null;combatTasks=[];pendingEmissions=0;started=true;paused=false;gameOver=false;mode='pvp';activeTeam=0;activeIdx=[0,0];turnWorm=null;turnEnding=false;attackCommitted=false;turnLocked=false;retreatUntil=0;turnSec=45;turnStart=gameNow;turnNo=1;selected='bazooka';charging=false;shotgunRemain=0;aim=-45;facing=1;sudden=false;
 projectiles=[];walkers=[];mines=[];crates=[];girders=[];rope=null;jetpack=false;particles=[];explosions=[];keys.a=keys.d=keys.w=keys.s=false;
 WW=2600;WH=900;waterY=780;wind=0;terrain.width=WW;terrain.height=WH;tctx.clearRect(0,0,WW,WH);tctx.fillStyle='#527d3b';tctx.fillRect(0,500,WW,400);refreshTerrainCollision();
 teams.forEach((t,i)=>{t.ammo={...defaultAmmo};t.worms=[0,1].map(j=>({team:i,idx:j,name:'test-'+i+'-'+j,x:i?1400+j*700:100+j*600,y:491,vx:0,vy:0,r:9,hp:100,alive:true,onGround:true,hurt:0}));});turnWorm=current();ui.overlay.style.display='none';updateHUD();
}
function stepCheck(seconds){for(let i=0;i<Math.ceil(seconds*60);i++)advanceFrame(FIXED_DT);updateHUD()}
window.stage1Check={run:(s)=>eval(s)};
`;
const sourceFiles=[...html.matchAll(/<script defer src="\.\/([^\"]+)"><\/script>/g)].map(m=>m[1]);
const combined=sourceFiles.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const instrumented=html.replace(/<script defer src="\.\/[^\"]+"><\/script>/g,'').replace('</body>','<script>\n'+combined.replace('updateAudioButtons();resize();requestAnimationFrame(loop);',injection+'updateAudioButtons();resize();')+'\n</script></body>');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/test'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(instrumented);return}
 const relative=pathname.startsWith('/wormfront/')?pathname.slice('/wormfront/'.length):pathname.slice(1);
 const file=relative===''?'index.html':relative;
 if(!['index.html','styles/game.css',...sourceFiles,...fs.readdirSync(path.join(root,'assets','images')).map(f=>'assets/images/'+f)].includes(file)){res.writeHead(404);res.end();return}
 const type=file.endsWith('.png')?'image/png':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html';res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(fs.readFileSync(path.join(root,file)))
});
const results=[],errors=[];let browser;const timings=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/test');
 async function check(name,code){assert.equal(await page.evaluate(s=>window.stage1Check.run(s),code),true,name);results.push({test:name,pass:true})}
 const setup="resetCheck();cpuWalk=null;cpuStatus='';mode='cpu';activeTeam=1;turnWorm=teams[1].worms[0];teams[0].worms[0].x=1000;teams[0].worms[1].alive=false;teams[1].worms[1].alive=false;difficulty='hard';";
 await check('Safe ground movement improves distance',setup+"const x=chooseCpuMove(turnWorm,nearestEnemy(turnWorm));x<turnWorm.x&&x>=turnWorm.x-180");
 await check('CPU walks through real fixed-step physics',setup+"const x=turnWorm.x;cpuAct();const walking=!!cpuWalk;stepCheck(1);walking&&turnWorm.x<x-20&&turnWorm.alive");
 await check('CPU stops at a cliff without falling',setup+"tctx.clearRect(1300,500,100,400);refreshTerrainCollision();const x=chooseCpuMove(turnWorm,nearestEnemy(turnWorm));x===turnWorm.x");
 await check('CPU avoids armed mines',setup+"mines=[{x:1360,y:491,armed:true,timer:0}];cpuSafeStep(turnWorm,-1)===null");
 await check('CPU avoids walls and bodies',setup+"tctx.fillRect(1380,450,12,50);refreshTerrainCollision();const wall=cpuSafeStep(turnWorm,-1)===null;tctx.clearRect(1380,450,12,50);refreshTerrainCollision();teams[1].worms[1].alive=true;teams[1].worms[1].x=1380;wall&&cpuSafeStep(turnWorm,-1)===null");
 await check('Low health prefers reachable health crate',setup+"teams[0].worms[0].x=1150;turnWorm.hp=40;crates=[{x:1470,y:491,type:'health',taken:false}];chooseCpuMove(turnWorm,nearestEnemy(turnWorm))>turnWorm.x");
 await check('Pause freezes CPU walking and pending shot',setup+"cpuAct();const x=turnWorm.x,time=gameNow;setPaused(true);stepCheck(4);x===turnWorm.x&&time===gameNow");
 await check('Turn transition cancels movement',setup+"cpuAct();nextTurn(0);cpuWalk===null");
 await check('CPU shot score penalizes friendly damage',setup+"const e={x:1000,y:491,event:'terrain'};const solo=cpuBlastValue(turnWorm,'bazooka',e);teams[1].worms[1].alive=true;teams[1].worms[1].x=1000;cpuBlastValue(turnWorm,'bazooka',e)<solo");
 await check('Water and out-of-bounds shots are rejected',setup+"cpuBlastValue(turnWorm,'bazooka',{x:1000,y:491,event:'water'})===-100&&cpuBlastValue(turnWorm,'bazooka',{x:1000,y:491,event:'bounds'})===-100");
 await check('CPU obeys ammo and planner does not mutate game',setup+"teams[1].ammo.homing=0;const before=JSON.stringify({teams,projectiles,terrainReadbacks});const p=planCpuShot(turnWorm);p.type!=='homing'&&p.simulations<=600&&before===JSON.stringify({teams,projectiles,terrainReadbacks})");
 for(const level of ['easy','normal','hard']){
 const data=await page.evaluate(s=>window.stage1Check.run(s),setup+`difficulty='${level}';const before=performance.now();const p=planCpuShot(turnWorm);({ms:performance.now()-before,score:p.score,simulations:p.simulations,type:p.type})`);timings.push({level,...data});assert.ok(data.simulations<=900);assert.ok(data.ms<2000);results.push({test:level+' planner completes within 2-second QA ceiling',pass:true});
 }
 await check('CPU executes an attack with a valid owner',setup+"cpuShoot();stepCheck(.4);attackCommitted&&projectiles.length>0&&projectiles[0].owner===turnWorm");
 await check('CPU does not shoot after turn changes',setup+"cpuShoot();nextTurn(0);stepCheck(.6);activeTeam===0&&projectiles.length===0");
 await check('No safe shot yields a pass without spending ammo',setup+"teams[0].worms[0].x=turnWorm.x;teams[0].worms[0].y=turnWorm.y-100;teams[1].worms[1].alive=true;teams[1].worms[1].x=turnWorm.x;teams[1].worms[1].y=turnWorm.y-100;const before=JSON.stringify(teams[1].ammo);cpuShoot();stepCheck(3);activeTeam===0&&before===JSON.stringify(teams[1].ammo)&&projectiles.length===0");
 await check('Explosions apply configured center damage',"resetCheck();turnWorm.x=500;projectileStep({type:'bazooka',x:500,y:491,vx:0,vy:0,life:0},FIXED_DT);turnWorm.hp===50");
 await check('Banana child count and damage differ from cluster',"resetCheck();splitBomb({type:'banana',x:500,y:100},weaponBalance.banana.children);const banana=projectiles.length===4&&projectiles.every(p=>p.damage===24);projectiles=[];splitBomb({type:'cluster',x:500,y:100},weaponBalance.cluster.children);banana&&projectiles.length===6&&projectiles.every(p=>p.damage===18)");
 await check('Rare wide-area weapons have one initial round',"defaultAmmo.banana===1&&defaultAmmo.airstrike===1&&weaponBalance.sacred.damage===75");
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(evidence,'tactics.json'),JSON.stringify({browser:await browser.version(),tests:results,timings,errors},null,2));console.log(JSON.stringify({checks:results.length,timings,errors},null,2));
})().catch(e=>{fs.writeFileSync(path.join(evidence,'tactics.json'),JSON.stringify({tests:results,timings,failure:e.stack},null,2));console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close()});
