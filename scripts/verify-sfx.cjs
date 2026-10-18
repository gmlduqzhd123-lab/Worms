require('./test-presentation.cjs')();
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),live=process.argv.includes('--live');
const folder=path.join(root,'verification',live?'live-stage20':'stage20');fs.mkdirSync(folder,{recursive:true});
const tests=[],errors=[],measurements={};let browser;
const server=http.createServer((req,res)=>{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':require('./mime.cjs')(file)});res.end(fs.readFileSync(file));
});
const requiredCues=['farewell','explosion','launch','shotgun','jump','pickup','turn','rope','mine','melee','splash','teleport','holy','airstrike','sheep','sudden','victory','click','throw','bounce','step','land','hurt','punch','place','fuse','homing','mortar','girder','ropeRelease','jetpack','drill','jetpackStop'];
let oneShots=[];
function record(name,ok,detail){assert.ok(ok,name+(detail?' '+JSON.stringify(detail):''));tests.push({name,pass:true});}
async function signal(page,duration=300){return page.evaluate(async duration=>{
 const values=new Float32Array(window.sfxProbe.fftSize);let peak=0,sum=0,samples=0,finite=true;
 const until=performance.now()+duration;
 do{window.sfxProbe.getFloatTimeDomainData(values);for(const value of values){finite=finite&&Number.isFinite(value);peak=Math.max(peak,Math.abs(value));sum+=value*value;samples++;}await new Promise(r=>setTimeout(r,12));}while(performance.now()<until);
 return{peak,rms:Math.sqrt(sum/samples),finite,samples};
},duration);}
async function offlineRender(page,source,names,options={}){return page.evaluate(async({source,names,options})=>{
 const sampleRate=44100,seconds=options.seconds||3.5;
 const offline=new OfflineAudioContext(2,Math.ceil(sampleRate*seconds),sampleRate);
 const context=new Proxy(offline,{get(target,key){if(key==='state')return'running';const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
 const fakeWindow={AudioContext:function(){return context;}},fakeDocument={hidden:false,addEventListener(){},getElementById(){return null;}};
 const run=new Function('window','document','names','options',`
 let paused=false,started=true,gameOver=false,gameNow=0,jetpack=false,projectiles=[],keys={};
 const turnWorm={alive:true,onGround:true,vx:0,vy:0},current=()=>turnWorm,saveSettings=()=>{};
 ${source}
 musicEnabled=false;sfxEnabled=options.enabled!==false;sfxVolume=options.volume===undefined?.72:options.volume;
 ensureAudio();for(const name of names)playSFX(name);
 `);
 run(fakeWindow,fakeDocument,names,options);
 const rendered=await offline.startRendering();let peak=0,sum=0,samples=0,finite=true,active=0,tail=0;
 for(let c=0;c<rendered.numberOfChannels;c++){const data=rendered.getChannelData(c);for(let i=0;i<data.length;i++){const value=data[i];finite=finite&&Number.isFinite(value);peak=Math.max(peak,Math.abs(value));sum+=value*value;samples++;if(Math.abs(value)>.00001){active++;tail=Math.max(tail,i/sampleRate);}}}
 return{peak,rms:Math.sqrt(sum/samples),finite,activeSamples:active,lastAudibleSampleSeconds:tail,sampleRate,seconds};
},{source,names,options});}
(async()=>{
 if(!live)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=live?'https://gmlduqzhd123-lab.github.io/Worms/':'http://127.0.0.1:'+server.address().port+'/';
 browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>errors.push(e.message));
 // This suite isolates audio timing: gameplay physics are covered by verify-browser.
 // Trusted clicks still create the real browser AudioContext; continuous-sound
 // lifecycle fixtures call updateSFX explicitly, without advancing combat.
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto(base);await page.locator('#advancedSettings').evaluate(el=>el.open=true);record('Initial page does not autoplay audio',await page.evaluate(()=>audio===null));
 const cueNames=await page.evaluate(()=>Object.keys(SFX_CUES));
 record('Sound catalogue contains every existing and newly connected gameplay cue',requiredCues.every(name=>cueNames.includes(name)),cueNames);
 oneShots=cueNames;
 const sourceResponse=await page.request.get(base+'src/audio.js?audio-verification='+Date.now());
 assert.ok(sourceResponse.ok(),'Audio source is available');const source=await sourceResponse.text();
 for(const name of oneShots){
  const measured=await offlineRender(page,source,[name]);measurements[name]=measured;
  record('Synthesized '+name+' has finite audible output below full-scale clipping',measured.finite&&measured.peak>.0001&&measured.peak<.99&&measured.rms>.00001,measured);
  record('Synthesized '+name+' decays before the end of its render window',measured.lastAudibleSampleSeconds<3.3,measured);
 }
 const overlap=await offlineRender(page,source,['explosion','launch','shotgun','holy','airstrike','sudden','victory','splash','mortar','farewell','punch'],{volume:1,seconds:4});measurements.overlap=overlap;
 record('Simultaneous explosions and weapon effects remain finite and below full-scale clipping at 100%',overlap.finite&&overlap.peak>.01&&overlap.peak<.99,overlap);
 for(const options of [{volume:0},{enabled:false}]){const muted=await offlineRender(page,source,oneShots,options);record(options.volume===0?'All effects are silent at 0%':'All effects are silent while SFX is OFF',muted.peak===0,muted);}
 await page.selectOption('#mode','pvp');await page.click('#start');await page.waitForFunction(()=>audio&&audio.state==='running'&&musicBuffer&&musicSource,null,{polling:50});
 await page.evaluate(()=>{window.sfxProbe=audio.createAnalyser();sfxProbe.fftSize=2048;sfxGain.connect(sfxProbe);stopSFX();});await page.waitForTimeout(200);
 await page.evaluate(()=>playSFX('explosion'));measurements.runtimeExplosion=await signal(page,650);
 record('Real AudioContext explosion produces finite audible output',measurements.runtimeExplosion.finite&&measurements.runtimeExplosion.peak>.001,measurements.runtimeExplosion);
 await page.evaluate(()=>playSFX('shotgun'));await page.waitForTimeout(100);
 record('Prominent weapon sound ducks selected background-music volume',await page.evaluate(()=>musicGain.gain.value<musicVolume*.8));
 await page.waitForTimeout(1800);record('Background music recovers to its selected volume',await page.evaluate(()=>Math.abs(musicGain.gain.value-musicVolume)<.005));
 await page.evaluate(()=>playSFX('step'));await page.waitForTimeout(100);
 record('Quiet movement feedback does not repeatedly duck background music',await page.evaluate(()=>Math.abs(musicGain.gain.value-musicVolume)<.005));
 await page.evaluate(()=>{stopSFX();setAudioVolume('sfx',0);});await page.waitForTimeout(250);await page.evaluate(()=>playSFX('explosion'));measurements.runtimeZero=await signal(page,180);
 record('Real AudioContext SFX 0% remains silent',measurements.runtimeZero.peak<.00001,measurements.runtimeZero);
 await page.evaluate(()=>{setAudioVolume('sfx',72);setSfx(false);playSFX('explosion');});await page.waitForTimeout(220);measurements.runtimeOff=await signal(page,180);
 record('Real AudioContext SFX OFF remains silent',measurements.runtimeOff.peak<.00001,measurements.runtimeOff);
 await page.evaluate(()=>setSfx(true));
 await page.evaluate(()=>{stopSFX();jetpack=true;keys.w=true;updateSFX(1/60);});
 await page.waitForTimeout(650);measurements.jetpack=await signal(page,250);
 record('Jetpack engine remains audible while thrust is active',await page.evaluate(()=>sfxLoops.has('jetpack'))&&measurements.jetpack.peak>.0001,measurements.jetpack);
 await page.evaluate(()=>{jetpack=false;keys.w=false;updateSFX(1/60);});await page.waitForTimeout(1200);
 measurements.jetpackEnded=await signal(page,180);
 record('Jetpack loop ends when flight ends',await page.evaluate(()=>!sfxLoops.has('jetpack'))&&measurements.jetpackEnded.peak<.00001,measurements.jetpackEnded);
 await page.evaluate(()=>{projectiles=[{type:'drill',x:current().x,y:current().y,life:4}];updateSFX(1/60);});
 await page.waitForTimeout(650);measurements.drill=await signal(page,250);
 record('Drill motor remains audible throughout the active drill projectile',await page.evaluate(()=>sfxLoops.has('drill'))&&measurements.drill.peak>.0001,measurements.drill);
 await page.evaluate(()=>{projectiles=[];updateSFX(1/60);});await page.waitForTimeout(500);measurements.drillEnded=await signal(page,180);
 record('Drill loop ends when its projectile disappears',await page.evaluate(()=>!sfxLoops.has('drill'))&&measurements.drillEnded.peak<.00001,measurements.drillEnded);
 await page.evaluate(()=>{jetpack=true;keys.w=true;updateSFX(1/60);playSFX('holy');stopSFX();});await page.waitForTimeout(180);measurements.stopped=await signal(page,200);
 record('stopSFX removes both scheduled effects and continuous engines',await page.evaluate(()=>sfxEvents.size===0&&sfxLoops.size===0)&&measurements.stopped.peak<.00001,measurements.stopped);
 await page.evaluate(()=>{updateSFX(1/60);setSfx(false);updateSFX(1/60);});await page.waitForTimeout(220);measurements.mutedLoop=await signal(page,150);
 record('Switching SFX OFF during thrust removes the continuous sound',await page.evaluate(()=>sfxLoops.size===0)&&measurements.mutedLoop.peak<.00001,measurements.mutedLoop);
 await page.evaluate(()=>{setSfx(true);updateSFX(1/60);});await page.waitForTimeout(180);
 record('Enabling SFX restores an active engine through the state update',await page.evaluate(()=>sfxLoops.has('jetpack')));
 await page.click('#pauseBtn');await page.waitForTimeout(220);measurements.paused=await signal(page,180);
 record('Trusted pause button stops all active audio effects',await page.evaluate(()=>paused&&sfxEvents.size===0&&sfxLoops.size===0)&&measurements.paused.peak<.00001,measurements.paused);
 await page.evaluate(()=>{playSFX('explosion');updateSFX(1/60);});await page.waitForTimeout(80);
 record('Paused gameplay cannot recreate effect voices',await page.evaluate(()=>sfxEvents.size===0&&sfxLoops.size===0));
 await page.click('#pauseBtn');await page.evaluate(()=>updateSFX(1/60));
 record('Resume restores only currently active continuous effects',await page.evaluate(()=>!paused&&sfxLoops.has('jetpack')));
 await page.evaluate(()=>{window.preRestartEvents=[...sfxEvents];startGame();});
 record('Restart removes previous audio events and continuous engines',await page.evaluate(()=>!jetpack&&sfxLoops.size===0&&preRestartEvents.every(event=>!sfxEvents.has(event)&&event.disposed&&event.sources.size===0&&event.nodes.size===0)));
 await page.waitForTimeout(2500);
 record('Completed one-shot voices are removed after their envelopes end',await page.evaluate(()=>sfxEvents.size===0));
 const storm=await page.evaluate(names=>{stopSFX();for(let i=0;i<100;i++)playSFX('step');const repeated=sfxEvents.size;for(const name of names)playSFX(name);return{repeated,events:sfxEvents.size,nodes:[...sfxEvents].reduce((count,event)=>count+event.nodes.size,0)};},oneShots);
 measurements.voiceStorm=storm;record('Repeated movement and overlapping weapons keep voice and node counts bounded',storm.repeated<=1&&storm.events<=18&&storm.nodes<=128,storm);
 const randomCalls=await page.evaluate(names=>{stopSFX();const original=Math.random;let count=0;Math.random=()=>{count++;return original();};try{for(const name of names)playSFX(name);}finally{Math.random=original;}return count;},oneShots);
 record('Sound variation does not consume the gameplay Math.random sequence',randomCalls===0,{randomCalls});
 await page.evaluate(()=>{stopSFX();jetpack=true;keys.w=true;updateSFX(1/60);});await page.evaluate(()=>audio.suspend());await page.waitForTimeout(150);
 record('Suspending AudioContext releases continuous and scheduled sources',await page.evaluate(()=>audio.state==='suspended'&&sfxLoops.size===0&&sfxEvents.size===0));
 await page.evaluate(()=>{jetpack=false;keys.w=false;return audio.resume();});await page.waitForTimeout(120);measurements.afterResume=await signal(page,180);
 record('Resuming AudioContext does not replay stale effects',measurements.afterResume.peak<.00001,measurements.afterResume);
 await page.evaluate(async()=>{window.previousAudio=audio;window.previousMusicBuffer=musicBuffer;await audio.close();ensureAudio();});
 await page.waitForFunction(()=>audio!==previousAudio&&audio.state==='running'&&musicSource,null,{polling:50});
 record('Closed AudioContext is recreated with the decoded music buffer retained',await page.evaluate(()=>previousAudio.state==='closed'&&audio!==previousAudio&&musicBuffer===previousMusicBuffer&&musicSource.loop&&sfxLoops.size===0));
 await page.evaluate(()=>{window.sfxProbe=audio.createAnalyser();sfxProbe.fftSize=2048;sfxGain.connect(sfxProbe);playSFX('launch');});measurements.recreatedContext=await signal(page,350);
 record('Recreated AudioContext can output a new weapon effect',measurements.recreatedContext.finite&&measurements.recreatedContext.peak>.0001,measurements.recreatedContext);
 assert.deepEqual(errors,[]);record('No browser JavaScript errors during audio verification',true);
 fs.writeFileSync(path.join(folder,'sfx.json'),JSON.stringify({browser:await browser.version(),tests,measurements,errors,scope:'Real Edge AudioContext output and controlled OfflineAudioContext synthesis. Physical speaker listening and perceptual similarity to original game audio are not verified.'},null,2));
 console.log(JSON.stringify({checks:tests.length,effects:oneShots.length,errors,browser:await browser.version()}));
})().catch(e=>{fs.writeFileSync(path.join(folder,'sfx.json'),JSON.stringify({tests,measurements,errors,failure:e.stack},null,2));console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close();});
