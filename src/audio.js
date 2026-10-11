'use strict';

let audio=null,masterGain=null,musicGain=null,sfxGain=null,noiseBuf=null,musicTimer=null;
let musicEnabled=true,sfxEnabled=true,musicStep=0;
function ensureAudio(){
  try{
    if(!audio){
      audio=new (window.AudioContext||window.webkitAudioContext)();
      masterGain=audio.createGain();musicGain=audio.createGain();sfxGain=audio.createGain();
      masterGain.gain.value=.78;musicGain.gain.value=.105;sfxGain.gain.value=.72;
      musicGain.connect(masterGain);sfxGain.connect(masterGain);masterGain.connect(audio.destination);
      noiseBuf=audio.createBuffer(1,audio.sampleRate*.7,audio.sampleRate);
      const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    }
    if(audio.state==='suspended')audio.resume();
    if(musicEnabled&&!musicTimer)startMusic();
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
function beep(freq=300,dur=.06,type='square',gain=.03){if(!sfxEnabled)return;ensureAudio();tone(freq,dur,type,gain)}
function playSFX(name){
  if(!sfxEnabled)return;ensureAudio();
  switch(name){
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
function midi(n){return 440*Math.pow(2,(n-69)/12)}
function musicVoice(note,dur,gain,type='triangle',when=0){tone(midi(note),dur,type,gain,when,'music')}
function scheduleMusicStep(){
  if(!audio||!musicEnabled)return;
  const step=musicStep++%64,beat=step%16,bar=Math.floor(step/16);
  const roots=[48,43,45,41],root=roots[bar];
  if(beat%4===0){musicVoice(root,.20,.042,'triangle');musicVoice(root+12,.12,.018,'square',.02)}
  if(beat===2||beat===6||beat===10||beat===14)noise(.035,.010,4800,0,'highpass');
  const melody=[60,64,67,72,67,64,62,67,71,74,71,67,60,65,69,72];
  if(beat%2===0){const n=melody[(bar*4+beat/2)%melody.length];musicVoice(n,.13,.026,'square');musicVoice(n+12,.08,.010,'triangle',.025)}
  if(beat===7||beat===15)musicVoice(root+7,.16,.018,'triangle');
}
function startMusic(){
  if(!musicEnabled||!audio||musicTimer)return;musicStep=0;scheduleMusicStep();musicTimer=setInterval(scheduleMusicStep,132)
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
function setMusic(on){musicEnabled=on;if(musicGain)musicGain.gain.setTargetAtTime(on?.105:.0001,audio.currentTime,.05);if(on){ensureAudio();startMusic()}else stopMusic();updateAudioButtons();saveSettings()}
function setSfx(on){sfxEnabled=on;if(sfxGain&&audio)sfxGain.gain.setTargetAtTime(on?.72:.0001,audio.currentTime,.03);updateAudioButtons();saveSettings()}
function updateAudioButtons(){
  const mb=document.getElementById('musicBtn'),sb=document.getElementById('sfxBtn');if(!mb||!sb)return;
  mb.textContent=musicEnabled?'🎵 음악 ON':'🎵 음악 OFF';sb.textContent=sfxEnabled?'🔊 효과음 ON':'🔇 효과음 OFF';mb.classList.toggle('off',!musicEnabled);sb.classList.toggle('off',!sfxEnabled)
}
