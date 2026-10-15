'use strict';

let audio=null,masterGain=null,musicGain=null,sfxGain=null,noiseBuf=null;
let musicEnabled=true,sfxEnabled=true;
const MUSIC_VOLUME=.18;
let musicVolume=MUSIC_VOLUME,sfxVolume=.72;
let musicBuffer=null,musicSource=null,musicLoading=null,musicOffset=0,musicStartedAt=0,musicError=null;
function ensureAudio(){
  try{
    if(!audio){
      audio=new (window.AudioContext||window.webkitAudioContext)();
      masterGain=audio.createGain();musicGain=audio.createGain();sfxGain=audio.createGain();
      masterGain.gain.value=.78;musicGain.gain.value=musicVolume;sfxGain.gain.value=sfxEnabled?sfxVolume:0;
      musicGain.connect(masterGain);sfxGain.connect(masterGain);masterGain.connect(audio.destination);
      noiseBuf=audio.createBuffer(1,audio.sampleRate*.7,audio.sampleRate);
      const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    }
    if(audio.state==='suspended')audio.resume();
    if(musicEnabled)startMusic();
  }catch{}
}
function tone(freq,dur=.08,type='square',gain=.05,when=0,dest='sfx',endFreq=null){
  if(!audio)return;const t=audio.currentTime+when,o=audio.createOscillator(),g=audio.createGain(),bus=dest==='music'?musicGain:sfxGain;
  o.type=type;o.frequency.setValueAtTime(Math.max(25,freq),t);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(25,endFreq),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.02)
}
function noise(dur=.15,gain=.08,filter=1000,when=0,mode='lowpass'){
  if(!audio||!noiseBuf)return;const t=audio.currentTime+when,n=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();
  n.buffer=noiseBuf;f.type=mode;f.frequency.value=filter;g.gain.setValueAtTime(Math.max(.0002,gain),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  n.connect(f);f.connect(g);g.connect(sfxGain);n.start(t);n.stop(t+dur+.02)
}
function beep(freq=300,dur=.06,type='square',gain=.03){if(!sfxEnabled||sfxVolume===0)return;ensureAudio();tone(freq,dur,type,gain)}
function playSFX(name){
  if(!sfxEnabled||sfxVolume===0)return;ensureAudio();duckMusic();
  switch(name){
    case 'farewell': noise(.14,.08,850,0,'lowpass');tone(90,.18,'sine',.05,0,'sfx',45);break;
    case 'explosion': noise(.32,.30,420,0,'lowpass');noise(.10,.11,2400,0,'highpass');tone(92,.34,'sawtooth',.12,0,'sfx',42);tone(58,.42,'sine',.14);break;
    case 'launch': noise(.14,.09,1500,0,'bandpass');tone(185,.16,'sawtooth',.075,0,'sfx',92);break;
    case 'shotgun': noise(.19,.30,1700,0,'bandpass');tone(76,.16,'square',.10,0,'sfx',48);break;
    case 'jump': tone(330,.07,'square',.05,0,'sfx',510);break;
    case 'pickup': tone(520,.08,'triangle',.055);tone(660,.08,'triangle',.055,.07);tone(840,.13,'sine',.05,.14);break;
    case 'turn': tone(420,.07,'square',.035);tone(620,.09,'triangle',.035,.08);break;
    case 'rope': tone(620,.09,'triangle',.055,0,'sfx',310);noise(.07,.025,1800,0,'highpass');break;
    case 'mine': tone(930,.065,'square',.045);tone(930,.065,'square',.045,.12);break;
    case 'melee': noise(.08,.12,1000,0,'bandpass');tone(118,.11,'square',.07,0,'sfx',70);break;
    case 'splash': noise(.28,.16,1250,0,'bandpass');tone(180,.15,'sine',.035,0,'sfx',95);break;
    case 'teleport': tone(260,.34,'sine',.05,0,'sfx',950);tone(520,.24,'triangle',.035,.08,'sfx',1200);break;
    case 'holy': tone(523,.55,'sine',.05);tone(659,.55,'sine',.045,.04);tone(784,.65,'sine',.045,.08);break;
    case 'airstrike': noise(.75,.10,900,0,'bandpass');tone(120,.65,'sawtooth',.025,0,'sfx',190);break;
    case 'sheep': tone(330,.12,'triangle',.045,0,'sfx',420);tone(250,.16,'triangle',.045,.11,'sfx',185);break;
    case 'jetpack': noise(.42,.09,1850,0,'highpass');tone(88,.4,'sawtooth',.035);break;
    case 'drill': tone(95,.35,'square',.055,0,'sfx',130);noise(.3,.055,2200,0,'bandpass');break;
    case 'sudden': tone(220,.45,'sawtooth',.065,0,'sfx',420);tone(420,.45,'sawtooth',.055,.38,'sfx',220);break;
    case 'victory': [523,659,784,1047].forEach((n,i)=>tone(n,.42,'triangle',.045,i*.11));break;
    case 'click': tone(480,.035,'square',.018);break;
    default: tone(300,.07,'square',.03)
  }
}
function boomSound(){playSFX('explosion')}
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
  if(!musicEnabled||!audio||paused||document.hidden||musicSource)return;
  if(!musicBuffer){
    if(!musicLoading)musicLoading=(async()=>{
      const response=await fetch(window.WORMFRONT_AUDIO_DATA||'./assets/audio/bouncy-tactical-groove.mp3');
      if(!response.ok)throw Error('Music HTTP '+response.status);
      musicBuffer=makeMusicLoop(await audio.decodeAudioData(await response.arrayBuffer()));musicError=null;startMusic();
    })().catch(e=>{musicError=e.message;console.warn('Background music unavailable:',e.message)}).finally(()=>{musicLoading=null});
    return;
  }
  musicSource=audio.createBufferSource();musicSource.buffer=musicBuffer;musicSource.loop=true;musicSource.connect(musicGain);
  musicStartedAt=audio.currentTime;musicSource.start(0,musicOffset%musicBuffer.duration);
  musicGain.gain.setTargetAtTime(musicVolume,audio.currentTime,.15);
}
function stopMusic(){
  if(!musicSource)return;musicOffset=(musicOffset+audio.currentTime-musicStartedAt)%musicBuffer.duration;
  musicSource.stop();musicSource.disconnect();musicSource=null;
}
function duckMusic(){
  if(!musicSource||!musicEnabled)return;const now=audio.currentTime;
  musicGain.gain.cancelScheduledValues(now);musicGain.gain.setTargetAtTime(musicVolume*.45,now,.025);
  musicGain.gain.setTargetAtTime(musicVolume,now+.45,.22);
}
function setMusic(on){musicEnabled=on;if(on)ensureAudio();else stopMusic();updateAudioButtons();saveSettings()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMusic();else if(musicEnabled&&audio)startMusic()});
function setSfx(on){sfxEnabled=on;if(sfxGain&&audio)sfxGain.gain.setTargetAtTime(on?sfxVolume:0,audio.currentTime,.03);updateAudioButtons();saveSettings()}
function updateAudioButtons(){
  const mb=document.getElementById('musicBtn'),sb=document.getElementById('sfxBtn');if(!mb||!sb)return;
  mb.textContent=musicEnabled?'🎵 음악 ON':'🎵 음악 OFF';sb.textContent=sfxEnabled?'🔊 효과음 ON':'🔇 효과음 OFF';updateVolumeControls();mb.classList.toggle('off',!musicEnabled);sb.classList.toggle('off',!sfxEnabled)
}

function setAudioVolume(kind,value){
  const number=Number(value);if(!Number.isFinite(number))return;
  const volume=Math.max(0,Math.min(100,number))/100;
  if(kind==='music')musicVolume=volume;else if(kind==='sfx')sfxVolume=volume;else return;
  ensureAudio();
  if(audio){const gain=kind==='music'?musicGain:sfxGain;gain.gain.cancelScheduledValues(audio.currentTime);gain.gain.setTargetAtTime(kind==='music'?musicVolume:(sfxEnabled?sfxVolume:0),audio.currentTime,.03);}
  updateVolumeControls();saveSettings();
}
function updateVolumeControls(){
  for(const [id,value] of [['musicVolume',musicVolume],['sfxVolume',sfxVolume],['homeMusicVolume',musicVolume],['homeSfxVolume',sfxVolume]]){
    const input=document.getElementById(id),output=document.getElementById(id+'Value');
    if(input)input.value=Math.round(value*100);if(output)output.textContent=Math.round(value*100)+'%';
  }
}
