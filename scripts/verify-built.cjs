const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),site=path.join(root,'release/site'),out=path.join(root,'test-results');
fs.mkdirSync(out,{recursive:true});
const tests=[],errors=[],missing=[],remoteRequests=[];let browser;
const pass=name=>tests.push({name,pass:true});
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname;
  if(!pathname.startsWith('/Worms/')){res.writeHead(404);res.end();return}
  const relative=decodeURIComponent(pathname.slice('/Worms/'.length))||'index.html',file=path.resolve(site,relative);
  if(!file.startsWith(site+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.setHeader('Content-Type',require('./mime.cjs')(file));res.end(fs.readFileSync(file));
});
function watch(page,base){
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remoteRequests.push(r.url())});
}
async function battle(page,name,touch){
  await page.selectOption('#mode','pvp');await page.click('#start');
  await page.waitForFunction(()=>!document.getElementById('wormIntro').hidden);
  await page.click('#skipIntro');await page.selectOption('#aimPreset','60');await page.click('#aimPlus');
  assert.equal(await page.locator('#aimCurrent').textContent(),'61°');pass(name+': start, intro and precise aiming');
  await page.click('#previewFitBtn');assert.equal(await page.locator('#previewFitBtn').getAttribute('aria-pressed'),'true');
  if(touch){const fire=await page.locator('[data-act="fire"]').boundingBox();assert.ok(fire);await page.touchscreen.tap(fire.x+fire.width/2,fire.y+fire.height/2)}
  else{await page.keyboard.down('Space');await page.waitForTimeout(200);await page.keyboard.up('Space')}
  assert.equal(await page.locator('#previewFitBtn').getAttribute('aria-pressed'),'false');pass(name+': trusted input fires and exits trajectory view');
  await page.click('#pauseBtn');assert.ok((await page.locator('#pauseBtn').textContent()).includes('계속하기'));
  await page.click('#pauseBtn');await page.click('#quitBtn');await page.click('#quitConfirm');
  assert.equal(await page.locator('#overlay').evaluate(el=>getComputedStyle(el).display),'flex');pass(name+': pause, resume and return to home');
}
(async()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'release/manifest.json'),'utf8'));
  const version=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/name="wormfront-version" content="(\d+)"/)[1];
  assert.equal(manifest.version,version);
  const actual=fs.readdirSync(site,{recursive:true}).filter(f=>fs.statSync(path.join(site,f)).isFile()).map(f=>f.split(path.sep).join('/')).sort();
  assert.deepEqual(actual,manifest.files.map(f=>f.file).sort(),'Unexpected or missing files in release/site');
  for(const row of manifest.files){
    const data=fs.readFileSync(path.join(site,row.file));assert.equal(data.length,row.bytes,row.file);assert.equal(hash(data),row.sha256,row.file);
    const source=row.file==='offline/wormfront.html'?`dist/wormfront-stage${version}-offline.html`:row.file;
    assert.equal(hash(data),hash(fs.readFileSync(path.join(root,source))),row.file+' differs from source');
  }
  pass('Built file set, version, sizes and SHA-256 match manifest and current inputs');
  const offline=fs.readFileSync(path.join(site,'offline/wormfront.html'),'utf8');
  assert.equal(/<script[^>]+src=|<link[^>]+rel="(?:stylesheet|manifest)"/.test(offline),false);
  for(const source of JSON.parse(fs.readFileSync(path.join(root,'scripts/source-order.json'),'utf8')))assert.ok(offline.includes(fs.readFileSync(path.join(root,source),'utf8')),'Stale offline script: '+source);
  assert.ok(offline.includes(fs.readFileSync(path.join(root,'styles/game.css'),'utf8')),'Stale offline CSS');
  pass('Standalone embeds every current game script and stylesheet');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/Worms/';
  const channel=process.env.WORMFRONT_BROWSER_CHANNEL;
  browser=await chromium.launch({headless:true,...(channel&&channel!=='chromium'?{channel}:{})});
  for(const profile of [{name:'desktop',viewport:{width:1280,height:720}},{name:'phone',viewport:{width:844,height:390},hasTouch:true,isMobile:true}]){
    const context=await browser.newContext(profile);
    await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined});
    const page=await context.newPage();watch(page,base);await page.goto(base);await page.waitForFunction(()=>artReady);
    assert.equal(await page.locator('meta[name="wormfront-version"]').getAttribute('content'),version);
    assert.equal(await page.evaluate(()=>artFailures.length),0);
    await battle(page,profile.name,profile.hasTouch);await page.screenshot({path:path.join(out,profile.name+'-home.png')});
    if(profile.hasTouch){
      await page.setViewportSize({width:390,height:844});await page.locator('#rotateNotice').waitFor({state:'visible'});assert.equal(await page.locator('#rotateNotice').isHidden(),false);
      await page.setViewportSize(profile.viewport);await page.locator('#rotateNotice').waitFor({state:'hidden'});pass('Phone orientation notice follows viewport changes');
    }
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    const cached=await page.evaluate(async()=>{const c=await caches.open('worms-v'+document.querySelector('meta[name="wormfront-version"]').content);return(await c.keys()).filter(r=>r.url.includes('/assets/images/')).length});
    assert.equal(cached,30);await context.setOffline(true);await page.reload();await page.waitForFunction(()=>artReady);
    await page.selectOption('#mapTheme','snow');await page.waitForFunction(()=>!document.getElementById('themePreviewImage').hidden);assert.equal(await page.evaluate(()=>artFailures.length),0);
    await battle(page,profile.name+' cached offline',profile.hasTouch);pass(profile.name+': first-visit cache retains all 30 images and unseen theme');
    await context.close();
  }
  const context=await browser.newContext({offline:true,viewport:{width:1280,height:720}}),page=await context.newPage();watch(page,base);
  await page.goto(pathToFileURL(path.join(site,'offline/wormfront.html')).href);await page.waitForFunction(()=>!document.getElementById('themePreviewImage').hidden);
  await battle(page,'standalone file',false);await context.close();pass('Standalone file works with network disabled');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.deepEqual(remoteRequests,[]);pass('No JavaScript errors, missing responses or external network dependencies');
})().catch(error=>{tests.push({name:'Built artifact verification',pass:false,error:error.stack});console.error(error);process.exitCode=1}).finally(async()=>{
  if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  fs.writeFileSync(path.join(out,'built.json'),JSON.stringify({tests,errors,missing,remoteRequests},null,2));
  console.log(JSON.stringify({checks:tests.length,failed:tests.filter(t=>!t.pass),errors,missing,remoteRequests}));
});
