'use strict';

let audio=null,masterGain=null,musicGain=null,sfxGain=null,noiseBuf=null,sfxCompressor=null,outputLimiter=null;
let musicEnabled=true,sfxEnabled=true;
const MUSIC_VOLUME=.18;
let musicVolume=MUSIC_VOLUME,sfxVolume=.72;
let musicBuffer=null,musicSource=null,musicLoading=null,musicOffset=0,musicStartedAt=0,musicError=null,audioGeneration=0;
// Original procedural effects: cartoon Foley, mechanical attacks and rounded blasts.
// No sound samples from Worms Armageddon are included.
const SFX_CUES=Object.freeze({
  farewell:{gap:.06,priority:3},explosion:{gap:.025,priority:4,duck:true},
  rocketExplode:{gap:.025,priority:4,duck:true},grenadeExplode:{gap:.025,priority:4,duck:true},
  dynamiteExplode:{gap:.05,priority:4,duck:true},holyBlast:{gap:.08,priority:4,duck:true},
  mineExplode:{gap:.04,priority:4,duck:true},clusterExplode:{gap:.035,priority:3,duck:true},
  smallExplode:{gap:.045,priority:2},mortarExplode:{gap:.04,priority:4,duck:true},
  airstrikeExplode:{gap:.035,priority:4,duck:true},sheepExplode:{gap:.04,priority:4,duck:true},
  drillExplode:{gap:.04,priority:3,duck:true},launch:{gap:.06,priority:3},
  throw:{gap:.08,priority:2},homing:{gap:.08,priority:3},mortar:{gap:.08,priority:3},
  shotgun:{gap:.08,priority:4,duck:true},jump:{gap:.08,priority:2},pickup:{gap:.14,priority:3},
  turn:{gap:.25,priority:3},rope:{gap:.1,priority:2},ropeRelease:{gap:.09,priority:1},
  mine:{gap:.16,priority:3},fuse:{gap:.18,priority:1},melee:{gap:.09,priority:3},
  punch:{gap:.09,priority:3},hurt:{gap:.12,priority:2},splash:{gap:.09,priority:3},
  teleport:{gap:.16,priority:3},holy:{gap:.2,priority:3},airstrike:{gap:.25,priority:3},
  sheep:{gap:.2,priority:2},jetpack:{gap:.15,priority:2},jetpackStop:{gap:.15,priority:1},
  drill:{gap:.2,priority:2},sudden:{gap:.5,priority:3},victory:{gap:.5,priority:4},
  click:{gap:.045,priority:1},step:{gap:.15,priority:0},land:{gap:.12,priority:1},
  bounce:{gap:.075,priority:1},place:{gap:.12,priority:1},girder:{gap:.15,priority:2}
});
const sfxEvents=new Set(),sfxLastPlayed=new Map(),sfxLoops=new Map();
const MAX_SFX_EVENTS=18,MAX_SFX_NODES=128;
let buildingSfx=null,sfxRandomState=(Date.now()^0x6d2b79f5)>>>0||1;
function audioRandom(){let n=sfxRandomState;n^=n<<13;n^=n>>>17;n^=n<<5;sfxRandomState=n>>>0;return sfxRandomState/4294967296}
function ensureAudio(){
  try{
    if(!audio||audio.state==='closed'){
      stopSFX();stopMusic();
      for(const node of [masterGain,musicGain,sfxGain,sfxCompressor,outputLimiter])try{node?.disconnect()}catch{}
      audio=new (window.AudioContext||window.webkitAudioContext)();audioGeneration++;musicLoading=null;
      masterGain=audio.createGain();musicGain=audio.createGain();sfxGain=audio.createGain();
      sfxCompressor=audio.createDynamicsCompressor();outputLimiter=audio.createDynamicsCompressor();
      masterGain.gain.value=.78;musicGain.gain.value=musicVolume;sfxGain.gain.value=sfxEnabled?sfxVolume:0;
      sfxCompressor.threshold.value=-17;sfxCompressor.knee.value=12;sfxCompressor.ratio.value=5;
      sfxCompressor.attack.value=.003;sfxCompressor.release.value=.14;
      outputLimiter.threshold.value=-2;outputLimiter.knee.value=0;outputLimiter.ratio.value=20;
      outputLimiter.attack.value=.001;outputLimiter.release.value=.08;
      musicGain.connect(masterGain);sfxGain.connect(sfxCompressor);sfxCompressor.connect(masterGain);
      masterGain.connect(outputLimiter);outputLimiter.connect(audio.destination);
      noiseBuf=audio.createBuffer(1,Math.ceil(audio.sampleRate*2),audio.sampleRate);
      const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=audioRandom()*2-1;
      const context=audio;
      context.addEventListener('statechange',()=>{if(audio===context&&context.state!=='running')stopSFX()});
    }
    if(audio.state==='suspended'||audio.state==='interrupted')audio.resume().catch(()=>{});
    if(musicEnabled)startMusic();
  }catch{}
}
function disposeSfx(event){
  if(!event||event.disposed)return;event.disposed=true;
  for(const source of event.sources){source.onended=null;try{source.stop()}catch{}}
  for(const node of event.nodes)try{node.disconnect()}catch{}
  event.sources.clear();event.nodes.clear();sfxEvents.delete(event);
  if(event.loop)sfxLoops.delete(event.name);
}
function newSfxEvent(name,priority=1,loop=false){
  const event={name,priority,loop,sources:new Set(),nodes:new Set(),disposed:false,at:audio.currentTime};
  sfxEvents.add(event);return event;
}
function trackSfx(source,nodes,event=buildingSfx){
  if(!event)event=newSfxEvent('tone');
  event.sources.add(source);for(const node of [source,...nodes])event.nodes.add(node);
  source.onended=()=>{
    event.sources.delete(source);
    for(const node of [source,...nodes]){try{node.disconnect()}catch{}event.nodes.delete(node)}
    if(!event.sources.size)disposeSfx(event);
  };
}
function effectEnvelope(param,t,dur,gain,attack=.004){
  const rise=Math.min(attack,dur*.22);param.setValueAtTime(.0001,t);
  param.linearRampToValueAtTime(Math.max(.0002,gain),t+rise);
  param.exponentialRampToValueAtTime(Math.max(.00015,gain*.45),t+Math.max(rise,dur*.22));
  param.exponentialRampToValueAtTime(.0001,t+dur);
}
function tone(freq,dur=.08,type='triangle',gain=.05,when=0,dest='sfx',endFreq=null){
  if(!audio||audio.state==='closed')return;
  const t=audio.currentTime+Math.max(0,when),o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();
  o.type=type;o.frequency.setValueAtTime(Math.max(25,freq),t);
  if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(25,endFreq),t+dur);
  f.type='lowpass';f.frequency.value=type==='square'?2200:4400;f.Q.value=.4;
  effectEnvelope(g.gain,t,dur,gain);o.connect(f);f.connect(g);g.connect(dest==='music'?musicGain:sfxGain);
  trackSfx(o,[f,g]);o.start(t);o.stop(t+dur+.012);
}
function noise(dur=.15,gain=.08,filter=1000,when=0,mode='lowpass',endFilter=null){
  if(!audio||!noiseBuf||audio.state==='closed')return;
  const t=audio.currentTime+Math.max(0,when),n=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();
  n.buffer=noiseBuf;n.loop=true;f.type=mode;f.Q.value=mode==='bandpass'?.85:.5;f.frequency.setValueAtTime(filter,t);
  if(endFilter)f.frequency.exponentialRampToValueAtTime(Math.max(30,endFilter),t+dur);
  effectEnvelope(g.gain,t,dur,gain);n.connect(f);f.connect(g);g.connect(sfxGain);
  trackSfx(n,[f,g]);n.start(t,audioRandom()*noiseBuf.duration);n.stop(t+dur+.012);
}
function stopSFX(){
  for(const event of [...sfxEvents])disposeSfx(event);
  sfxLoops.clear();sfxLastPlayed.clear();buildingSfx=null;
  if(audio&&musicGain){musicGain.gain.cancelScheduledValues(audio.currentTime);musicGain.gain.setTargetAtTime(musicVolume,audio.currentTime,.06)}
}
function reserveSfx(priority,nodeBudget=24){
  let nodes=0;for(const event of sfxEvents)nodes+=event.nodes.size;
  while(sfxEvents.size>=MAX_SFX_EVENTS||nodes+nodeBudget>MAX_SFX_NODES){
    const expendable=[...sfxEvents].filter(e=>!e.loop&&e.priority<=priority).sort((a,b)=>a.priority-b.priority||a.at-b.at)[0];
    if(!expendable)return false;nodes-=expendable.nodes.size;disposeSfx(expendable);
  }
  return true;
}
function beep(freq=300,dur=.06,type='triangle',gain=.03){
  if(!sfxEnabled||sfxVolume===0||document.hidden||paused)return;
  ensureAudio();if(!audio||audio.state==='closed'||!reserveSfx(1,3))return;tone(freq,dur,type,gain);
}
function blast(body=.27,tail=.55,pitch=81,crack=1){
  noise(.045,.22*crack,3400,0,'highpass',1500);noise(tail,body,950,.012,'lowpass',130);
  noise(tail*.55,body*.42,1750,.035,'bandpass',400);
  tone(pitch,.25,'triangle',body*.58,0,'sfx',31);tone(52,tail,'sine',body*.5,.015,'sfx',27);
  noise(.12,body*.10,1900,.12,'highpass');noise(.14,body*.07,2500,.22,'highpass');
}
function playSFX(name){
  const cue=SFX_CUES[name];if(!cue||!sfxEnabled||sfxVolume===0||document.hidden||paused)return;
  ensureAudio();if(!audio||audio.state==='closed')return;
  const now=audio.currentTime;
  if(now-(sfxLastPlayed.get(name)??-Infinity)<cue.gap||!reserveSfx(cue.priority,27))return;
  sfxLastPlayed.set(name,now);buildingSfx=newSfxEvent(name,cue.priority);if(cue.duck)duckMusic();
  // Audio-only PRNG: variation cannot change seeded terrain or CPU decisions.
  const v=.94+audioRandom()*.12;
  try{switch(name){
    case 'farewell': noise(.08,.08,1800);tone(165,.14,'triangle',.09,0,'sfx',65);noise(.22,.09,520,.025);break;
    case 'explosion': case 'rocketExplode': blast(.30,.62,83);break;
    case 'grenadeExplode': blast(.25,.49,108,1.18);noise(.2,.065,3900,.09,'highpass');break;
    case 'dynamiteExplode': blast(.34,.83,65,.9);noise(.48,.09,180,.09);break;
    case 'holyBlast': blast(.35,.95,59,1.2);tone(1046,.38,'sine',.028,.12);tone(1568,.48,'sine',.023,.15);break;
    case 'mineExplode': blast(.24,.40,117,1.25);break;
    case 'clusterExplode': blast(.24,.45,102,1.12);break;
    case 'smallExplode': blast(.12,.25,145,.55);break;
    case 'mortarExplode': blast(.30,.67,73,1.1);break;
    case 'airstrikeExplode': blast(.25,.54,78,1.12);break;
    case 'sheepExplode': blast(.28,.62,91,.95);break;
    case 'drillExplode': blast(.21,.44,92,.75);noise(.14,.08,2800,.05,'bandpass');break;
    case 'launch': noise(.055,.13,1800,0,'bandpass');tone(150,.20,'triangle',.12,0,'sfx',44);noise(.28,.16,2300,.02,'bandpass',320);break;
    case 'throw': noise(.13,.075,750,0,'bandpass',2600);tone(780,.035,'sine',.018);tone(340,.045,'triangle',.024,.06,'sfx',210);break;
    case 'homing': tone(940,.045,'sine',.04);tone(1250,.04,'sine',.035,.055);noise(.30,.15,2000,.1,'bandpass',400);tone(190,.22,'triangle',.09,.1,'sfx',70);break;
    case 'mortar': tone(110,.20,'sine',.18,0,'sfx',38);noise(.075,.18,1050);noise(.28,.10,2200,.025,'bandpass',400);tone(640,.36,'sine',.018,.09,'sfx',1200);break;
    case 'shotgun': noise(.042,.38,2700,0,'highpass');noise(.22,.24,1350,.008);tone(110,.14,'triangle',.14,0,'sfx',39);noise(.075,.07,2700,.25,'bandpass');tone(230,.04,'square',.025,.31);break;
    case 'jump': tone(190*v,.13,'sine',.075,0,'sfx',530*v);noise(.055,.025,1100,0,'bandpass');tone(430*v,.08,'triangle',.025,.045,'sfx',680*v);break;
    case 'step': noise(.045,.035,850*v,0,'bandpass');tone(145*v,.055,'sine',.024,0,'sfx',82);break;
    case 'land': noise(.10,.075,560*v);tone(135*v,.11,'sine',.07,0,'sfx',48);break;
    case 'bounce': tone(610*v,.07,'triangle',.035,0,'sfx',390);tone(1380*v,.05,'sine',.025);noise(.045,.05,2200,0,'bandpass');break;
    case 'place': noise(.065,.065,1250);tone(190,.08,'triangle',.04,0,'sfx',110);break;
    case 'girder': noise(.065,.1,2300,0,'bandpass');tone(460,.18,'triangle',.055);tone(719,.12,'sine',.035,.04);noise(.07,.06,1800,.14,'bandpass');break;
    case 'pickup': [659,880,1319].forEach((f,i)=>{tone(f,.20,'sine',.07,i*.07);tone(f*2,.10,'triangle',.014,i*.07)});break;
    case 'turn': tone(740,.10,'sine',.07);tone(988,.21,'sine',.065,.11);tone(1482,.12,'triangle',.012,.11);break;
    case 'rope': noise(.075,.075,1200,0,'bandpass',4800);tone(1200,.055,'triangle',.04,.055,'sfx',580);noise(.05,.045,2900,.07,'highpass');break;
    case 'ropeRelease': noise(.05,.035,2200,0,'highpass');tone(370,.08,'triangle',.024,0,'sfx',140);break;
    case 'mine': [0,.18,.36].forEach(t=>tone(1350,.055,'sine',.055,t));break;
    case 'fuse': noise(.12,.035,4700,0,'highpass');tone(1600,.025,'sine',.012);break;
    case 'melee': noise(.06,.12,1200,0,'bandpass');tone(220,.12,'triangle',.15,0,'sfx',58);tone(520,.10,'sine',.055,.015,'sfx',155);break;
    case 'punch': noise(.09,.12,1700,0,'bandpass',3500);tone(130,.19,'triangle',.16,.035,'sfx',42);noise(.16,.14,600,.04);break;
    case 'hurt': tone(290*v,.09,'triangle',.055,0,'sfx',175*v);noise(.055,.035,850,0,'bandpass');break;
    case 'splash': noise(.13,.18,1600,0,'bandpass',600);noise(.48,.10,4200,.04,'highpass');[0,.06,.13,.23].forEach((t,i)=>tone(390-i*48,.11,'sine',.035,t,'sfx',110+i*30));break;
    case 'teleport': [1,1.5,2].forEach((f,i)=>tone(250*f,.34,'sine',.04,i*.025,'sfx',1700*f));noise(.20,.055,3000,.2,'bandpass',700);tone(1080,.18,'sine',.055,.34,'sfx',360);break;
    case 'holy': [523,659,784,1046].forEach((f,i)=>{tone(f,.8,'sine',.045,i*.035);tone(f*2,.65,'triangle',.009,i*.035)});break;
    case 'airstrike': noise(.95,.11,400,0,'bandpass',1600);tone(95,.85,'sawtooth',.045,0,'sfx',150);tone(99,.85,'sawtooth',.025,.015,'sfx',154);noise(.35,.05,1900,.55,'bandpass',500);break;
    case 'sheep': [0,.09,.18].forEach((t,i)=>{tone(255-i*16,.12,'sawtooth',.035,t,'sfx',330-i*48);tone(765-i*48,.11,'sine',.019,t,'sfx',900-i*100)});break;
    case 'jetpack': noise(.12,.10,1700,0,'bandpass');tone(95,.12,'triangle',.045,0,'sfx',155);break;
    case 'jetpackStop': noise(.16,.05,1800,0,'bandpass',200);tone(120,.15,'triangle',.03,0,'sfx',45);break;
    case 'drill': noise(.08,.085,1800,0,'bandpass');tone(120,.12,'square',.04,0,'sfx',77);break;
    case 'sudden': [0,.36].forEach(t=>{tone(210,.32,'triangle',.065,t,'sfx',320);tone(315,.32,'sine',.025,t,'sfx',480)});break;
    case 'victory': [523,659,784,1047].forEach((f,i)=>{tone(f,.48,'triangle',.05,i*.13);tone(f*1.5,.4,'sine',.018,i*.13)});break;
    case 'click': tone(650,.035,'sine',.035,0,'sfx',430);noise(.018,.012,1800,0,'bandpass');break;
  }}finally{const event=buildingSfx;buildingSfx=null;if(!event.sources.size)disposeSfx(event)}
}
function boomSound(size=60,type=null){
  if(typeof size==='string'){type=size;size=60}
  const names={bazooka:'rocketExplode',homing:'rocketExplode',grenade:'grenadeExplode',banana:'dynamiteExplode',
    dynamite:'dynamiteExplode',sacred:'holyBlast',mine:'mineExplode',cluster:'clusterExplode',mini:'smallExplode',
    mortar:'mortarExplode',air:'airstrikeExplode',sheep:'sheepExplode',drill:'drillExplode'};
  playSFX(names[type]||(size<40?'smallExplode':size>=90?'dynamiteExplode':'explosion'));
}
function setEngineSound(name,on,thrust=0){
  let event=sfxLoops.get(name);if(!on){if(event)disposeSfx(event);return}
  if(!event){
    if(!reserveSfx(2,9))return;event=newSfxEvent(name,2,true);sfxLoops.set(name,event);
    const n=audio.createBufferSource(),filter=audio.createBiquadFilter(),hiss=audio.createGain();
    const o=audio.createOscillator(),body=audio.createGain(),lfo=audio.createOscillator(),mod=audio.createGain();
    n.buffer=noiseBuf;n.loop=true;filter.type='bandpass';filter.Q.value=.65;filter.frequency.value=name==='jetpack'?1400:1800;
    n.connect(filter);filter.connect(hiss);hiss.connect(sfxGain);hiss.gain.value=0;
    o.type=name==='jetpack'?'triangle':'sawtooth';o.frequency.value=name==='jetpack'?72:95;body.gain.value=0;o.connect(body);body.connect(sfxGain);
    lfo.frequency.value=name==='jetpack'?18:32;mod.gain.value=name==='jetpack'?6:18;lfo.connect(mod);mod.connect(o.frequency);
    trackSfx(n,[filter,hiss],event);trackSfx(o,[body],event);trackSfx(lfo,[mod],event);
    event.hiss=hiss;event.body=body;event.filter=filter;event.osc=o;
    n.start(0,audioRandom()*noiseBuf.duration);o.start();lfo.start();
  }
  const t=audio.currentTime,power=Math.max(0,Math.min(1,thrust));
  // Schedule only when thrust changes, avoiding an unbounded automation list at 60 Hz.
  if(event.power===power)return;event.power=power;
  for(const param of [event.hiss.gain,event.body.gain,event.osc.frequency,event.filter.frequency])param.cancelScheduledValues(t);
  event.hiss.gain.setTargetAtTime(name==='jetpack'?.038+power*.025:.045,t,.06);
  event.body.gain.setTargetAtTime(name==='jetpack'?.018+power*.012:.025,t,.06);
  event.osc.frequency.setTargetAtTime(name==='jetpack'?72+power*35:96,t,.06);
  event.filter.frequency.setTargetAtTime(name==='jetpack'?1100+power*900:1700,t,.06);
}
function updateSFX(dt){
  // Fixed-step activity drives continuous audio; no timer can outlive a game reset.
  if(!audio||audio.state!=='running'||!sfxEnabled||sfxVolume===0||paused||document.hidden||!started||gameOver){
    for(const event of [...sfxLoops.values()])disposeSfx(event);return;
  }
  setEngineSound('jetpack',!!jetpack&&!!current()?.alive,keys.w?1:((keys.a||keys.d)? .55:.2));
  setEngineSound('drill',projectiles.some(p=>p.type==='drill'&&p.life>0));
}
function makeMusicLoop(buffer){
  // Overlap the last and first half-second to soften the repeat seam.
  const overlap=Math.min(Math.floor(buffer.sampleRate*.5),Math.floor(buffer.length/8));
  const loop=audio.createBuffer(buffer.numberOfChannels,buffer.length-overlap,buffer.sampleRate);
  for(let channel=0;channel<buffer.numberOfChannels;channel++){
    const input=buffer.getChannelData(channel),output=loop.getChannelData(channel);
    output.set(input.subarray(0,output.length));
    for(let i=0;i<overlap;i++){const mix=i/overlap;output[i]=input[i]*mix+input[output.length+i]*(1-mix);}
  }
  return loop;
}
function startMusic(){
  if(!musicEnabled||!audio||audio.state==='closed'||paused||document.hidden||musicSource)return;
  if(!musicBuffer){
    if(!musicLoading){const context=audio,generation=audioGeneration;
      musicLoading=(async()=>{
        const response=await fetch(window.WORMFRONT_AUDIO_DATA||'./assets/audio/bouncy-tactical-groove.mp3');
        if(!response.ok)throw Error('Music HTTP '+response.status);
        const decoded=await context.decodeAudioData(await response.arrayBuffer());
        if(audio!==context||audioGeneration!==generation)return;
        musicBuffer=makeMusicLoop(decoded);musicError=null;startMusic();
      })().catch(e=>{if(audioGeneration===generation){musicError=e.message;console.warn('Background music unavailable:',e.message)}})
        .finally(()=>{if(audioGeneration===generation)musicLoading=null});
    }
    return;
  }
  musicSource=audio.createBufferSource();musicSource.buffer=musicBuffer;musicSource.loop=true;musicSource.connect(musicGain);
  musicStartedAt=audio.currentTime;musicSource.start(0,musicOffset%musicBuffer.duration);
  musicGain.gain.setTargetAtTime(musicVolume,audio.currentTime,.15);
}
function stopMusic(){
  if(!musicSource)return;
  if(audio&&musicBuffer)musicOffset=(musicOffset+Math.max(0,audio.currentTime-musicStartedAt))%musicBuffer.duration;
  try{musicSource.stop()}catch{}musicSource.disconnect();musicSource=null;
}
function duckMusic(){
  if(!musicSource||!musicEnabled)return;const now=audio.currentTime;
  musicGain.gain.cancelScheduledValues(now);musicGain.gain.setTargetAtTime(musicVolume*.45,now,.025);
  musicGain.gain.setTargetAtTime(musicVolume,now+.45,.22);
}
function setMusic(on){musicEnabled=on;if(on)ensureAudio();else stopMusic();updateAudioButtons();saveSettings()}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();stopSFX()}else if(musicEnabled&&audio)startMusic()});
function setSfx(on){sfxEnabled=on;if(!on)stopSFX();if(sfxGain&&audio)sfxGain.gain.setTargetAtTime(on?sfxVolume:0,audio.currentTime,.03);updateAudioButtons();saveSettings()}
function updateAudioButtons(){
  const mb=document.getElementById('musicBtn'),sb=document.getElementById('sfxBtn');if(!mb||!sb)return;
  mb.textContent=musicEnabled?'🎵 음악 ON':'🎵 음악 OFF';sb.textContent=sfxEnabled?'🔊 효과음 ON':'🔇 효과음 OFF';updateVolumeControls();mb.classList.toggle('off',!musicEnabled);sb.classList.toggle('off',!sfxEnabled)
}
function setAudioVolume(kind,value){
  const number=Number(value);if(!Number.isFinite(number))return;
  const volume=Math.max(0,Math.min(100,number))/100;
  if(kind==='music')musicVolume=volume;else if(kind==='sfx')sfxVolume=volume;else return;
  ensureAudio();if(kind==='sfx'&&volume===0)stopSFX();
  if(audio){const gain=kind==='music'?musicGain:sfxGain;gain.gain.cancelScheduledValues(audio.currentTime);gain.gain.setTargetAtTime(kind==='music'?musicVolume:(sfxEnabled?sfxVolume:0),audio.currentTime,.03);}
  updateVolumeControls();saveSettings();
}
function updateVolumeControls(){
  for(const [id,value] of [['musicVolume',musicVolume],['sfxVolume',sfxVolume],['homeMusicVolume',musicVolume],['homeSfxVolume',sfxVolume]]){
    const input=document.getElementById(id),output=document.getElementById(id+'Value');
    if(input)input.value=Math.round(value*100);if(output)output.textContent=Math.round(value*100)+'%';
  }
}
