require('./test-presentation.cjs')();
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'verification/stage20'),tests=[],errors=[],requests=[];let browser;
(async()=>{
 browser=await chromium.launch({headless:true,channel:'msedge'});const context=await browser.newContext({offline:true}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 await page.addInitScript(()=>{const Native=window.AudioContext;window.audioOutputs=[];window.AudioContext=class extends Native{constructor(){super();window.audioProbeContext=this;}createDynamicsCompressor(){const node=super.createDynamicsCompressor();audioOutputs.push(node);return node;}}});
 await page.goto(pathToFileURL(path.join(root,'dist/wormfront-stage20-offline.html')).href);await page.locator('#advancedSettings').evaluate(el=>el.open=true);await page.selectOption('#mode','pvp');await page.click('#start');await page.click('#musicBtn');
 await page.evaluate(()=>{window.outputProbe=audioProbeContext.createAnalyser();outputProbe.fftSize=2048;audioOutputs.at(-1).connect(outputProbe)});await page.waitForTimeout(500);
 async function peak(){return page.evaluate(async()=>{const data=new Float32Array(outputProbe.fftSize);let peak=0;for(let i=0;i<20;i++){outputProbe.getFloatTimeDomainData(data);for(const v of data)peak=Math.max(peak,Math.abs(v));await new Promise(r=>setTimeout(r,10))}return peak})}
 await page.click('[data-w="shotgun"]');await page.keyboard.down('Space');await page.waitForTimeout(150);await page.keyboard.up('Space');const audible=await peak();assert.ok(audible>.001&&audible<1);tests.push({name:'Standalone offline UI shotgun produces an audible finite output',pass:true,peak:audible});
 await page.waitForTimeout(800);await page.click('#sfxBtn');await page.waitForTimeout(200);await page.keyboard.press('Space');const muted=await peak();assert.ok(muted<.00001);tests.push({name:'Standalone offline SFX OFF suppresses the second shotgun output',pass:true,peak:muted});
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);tests.push({name:'Offline sound test has no network dependency or browser JavaScript error',pass:true});
 fs.writeFileSync(path.join(folder,'sfx-offline.json'),JSON.stringify({tests,errors,requests},null,2));console.log(JSON.stringify({checks:tests.length,errors,requests}));
})().catch(e=>{fs.writeFileSync(path.join(folder,'sfx-offline.json'),JSON.stringify({tests,errors,requests,failure:e.stack},null,2));console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
