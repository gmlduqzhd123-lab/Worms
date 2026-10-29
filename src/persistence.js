'use strict';

const STORAGE_KEYS={settings:'wormfront.settings.v1',results:'wormfront.results.v1',guide:'wormfront.guide.v1'};
const OPTION_IDS=['mode','difficulty','inputA','inputB','count','turnTime','mapSize','crateRate','sdTurn','mineCount','appearanceA','appearanceB','mapTheme'];
const blockedStorageKeys=new Set();
let matchId='',matchStartedAt=0,matchRecorded=false,matchHistory=[],guideStep=0,modalPauseOwned=false,modalReturnFocus=null,deleteArmed=false;
function storageStatus(message){document.getElementById('storageStatus').textContent=message}
function readSaved(key){
  try{const value=localStorage.getItem(key);return value?JSON.parse(value):null}
  catch{blockedStorageKeys.add(key);storageStatus('저장 내용을 읽을 수 없어 이번 화면에서만 유지합니다.');return null}
}
function writeSaved(key,value){
  if(blockedStorageKeys.has(key))return false;
  try{localStorage.setItem(key,JSON.stringify(value));return true}
  catch{blockedStorageKeys.add(key);storageStatus('브라우저 저장을 사용할 수 없어 이번 화면에서만 유지합니다.');return false}
}
function settingsSnapshot(){
  const options={};for(const id of OPTION_IDS){const el=document.getElementById(id);options[id]=el.tagName==='INPUT'?el.value.trim().slice(0,40):el.value}
  return{version:1,options,audio:{music:musicEnabled,sfx:sfxEnabled,musicVolume,sfxVolume}}
}
function saveSettings(){if(writeSaved(STORAGE_KEYS.settings,settingsSnapshot())&&!blockedStorageKeys.has(STORAGE_KEYS.results))storageStatus('설정이 이 브라우저에 저장됐습니다.')}
function loadSettings(){
  const saved=readSaved(STORAGE_KEYS.settings);if(!saved||saved.version!==1||!saved.options)return;
  for(const id of OPTION_IDS){const value=saved.options[id],el=document.getElementById(id);if(typeof value!=='string')continue;
    if(el.tagName==='INPUT')el.value=value.slice(0,40);else if([...el.options].some(o=>o.value===value))el.value=value;
  }
  if(typeof saved.audio?.music==='boolean')musicEnabled=saved.audio.music;
  if(typeof saved.audio?.sfx==='boolean')sfxEnabled=saved.audio.sfx;
  for(const kind of ['musicVolume','sfxVolume']){const value=saved.audio?.[kind];if(typeof value==='number'&&Number.isFinite(value)){const safe=Math.max(0,Math.min(1,value));if(kind==='musicVolume')musicVolume=safe;else sfxVolume=safe;}}
}
function validResult(r){return !!(r&&typeof r==='object'&&!Array.isArray(r)&&typeof r.id==='string'&&typeof r.savedAt==='string'&&Number.isFinite(Date.parse(r.savedAt))&&['cpu','pvp'].includes(r.mode)&&Number.isInteger(r.turns)&&r.turns>=0&&Number.isFinite(r.seconds)&&r.seconds>=0&&(r.winner===null||r.winner===0||r.winner===1)&&Array.isArray(r.teams)&&r.teams.length===2&&r.teams.every(t=>t&&typeof t==='object'&&!Array.isArray(t)&&typeof t.name==='string'&&Number.isFinite(t.hp)&&t.hp>=0&&Number.isInteger(t.survivors)&&t.survivors>=0))}
function loadResults(){
  const saved=readSaved(STORAGE_KEYS.results);matchHistory=[];if(saved===null)return;
  const readable=saved?.version===1&&Array.isArray(saved.matches),valid=readable?saved.matches.filter(validResult):[];
  matchHistory=valid.slice(0,30);
  if(!readable||valid.length!==saved.matches.length){blockedStorageKeys.add(STORAGE_KEYS.results);storageStatus('일부 대전 기록을 읽을 수 없어 제외했습니다. 원본은 유지하며 새 기록은 이번 화면에서만 저장합니다. 기록 삭제로 초기화할 수 있습니다.')}
}
function beginMatchRecord(){matchId=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);matchStartedAt=gameNow;matchRecorded=false;document.getElementById('matchSummary').hidden=true}
function recordMatchResult(){
  if(matchRecorded)return;matchRecorded=true;
  const a=living(0).length,b=living(1).length;
  const result={id:matchId||'session-'+Date.now(),savedAt:new Date().toISOString(),mode,difficulty,winner:a===b?null:a>b?0:1,turns:turnNo,seconds:Math.max(0,Math.round((gameNow-matchStartedAt)/1000)),teams:teams.map(t=>({name:t.name.slice(0,40),hp:t.worms.reduce((n,w)=>n+(w.alive?w.hp:0),0),survivors:t.worms.filter(w=>w.alive).length}))};
  matchHistory=[result,...matchHistory.filter(r=>r.id!==result.id)].slice(0,30);writeSaved(STORAGE_KEYS.results,{version:1,matches:matchHistory});
  const summary=document.getElementById('matchSummary');summary.hidden=false;summary.textContent=result.turns+'턴 · '+formatDuration(result.seconds)+' · 남은 체력 '+result.teams.map(t=>t.name+' '+t.hp).join(' / ');renderHistory();
}
function formatDuration(seconds){return Math.floor(seconds/60)+'분 '+seconds%60+'초'}
function renderHistory(){
  const list=document.getElementById('historyList');list.replaceChildren();
  if(!matchHistory.length){const p=document.createElement('p');p.textContent='아직 완료한 대전이 없습니다. 끝까지 플레이하면 결과가 여기에 남습니다.';list.append(p);return}
  for(const r of matchHistory){const item=document.createElement('article');item.className='historyItem';const title=document.createElement('strong');title.textContent=r.winner===null?'무승부':r.teams[r.winner].name+' 승리';const detail=document.createElement('p');detail.textContent=r.teams.map(t=>t.name+' '+t.hp+'HP').join(' vs ')+' · '+r.turns+'턴 · '+formatDuration(r.seconds);const date=document.createElement('small');date.textContent=new Date(r.savedAt).toLocaleString('ko-KR')+' · '+(r.mode==='cpu'?'CPU 대전':'로컬 대전');item.append(title,detail,date);list.append(item)}
}
function openGameDialog(dialog){modalReturnFocus=document.activeElement;modalPauseOwned=started&&!paused&&!gameOver;if(modalPauseOwned)setPaused(true);dialog.showModal()}
function closeGameDialog(){if(modalPauseOwned&&!gameOver)setPaused(false);modalPauseOwned=false;modalReturnFocus?.focus()}
const GUIDE_STEPS=[
  {title:'작은 전장, 큰 한 수',body:'두 팀이 번갈아 움직입니다. 상대 팀을 모두 쓰러뜨리거나 물에 빠뜨리면 승리합니다. 코랄 탐사대와 민트 탐사대의 전장을 시작해 보세요.',hint:'처음에는 로컬 2인 대전과 작은 맵을 선택하면 조작을 익히기 쉽습니다.',icon:'target'},
  {title:'움직이고, 두 번 뛰기',body:'A/D 또는 좌우 버튼으로 이동합니다. W 또는 점프 버튼으로 뛰고, 0.33초 안에 다시 누르면 뒤로 백플립합니다.',hint:'높은 곳에서 떨어지면 피해를 받습니다. 물에 닿으면 탈락합니다.',icon:'jump'},
  {title:'수평선부터 각도 읽기',body:'수평선은 0°입니다. 30°·45°·60°·90°를 선택하거나 ±1°로 조준합니다. Shift+↑/↓도 1°씩 바꿉니다. Space나 발사 버튼을 누른 채 힘을 모으고 놓으면 발사합니다.',hint:'점선은 현재 힘으로 계산한 예상 경로입니다. 힘을 모으면 경로가 바뀌고, 탄도 전체로 도착점까지 볼 수 있습니다. 미충전은 최소 힘 12%입니다. 유도탄은 목표 선택 후 경로가 표시됩니다.',icon:'target'},
  {title:'전장을 멀리 보기',body:'화면을 드래그하면 카메라가 이동합니다. 휠·확대 버튼·두 손가락으로 확대하고 전체 맵에서 상대 위치를 찾으세요. 봇 추적 버튼이나 C로 돌아옵니다.',hint:'별똥지원·좌표비콘은 목표를 탭합니다. 목표 선택 중 드래그하면 카메라만 이동합니다.',icon:'map'},
  {title:'자석와이어와 쌍날개팩',body:'자석와이어를 선택해 발사하면 지형에 연결됩니다. A/D로 흔들고 W/S 또는 로프 버튼으로 길이를 바꿉니다. Space를 다시 누르면 해제됩니다. 쌍날개팩은 상승·하강 버튼 또는 W/S로 조절합니다.',hint:'고정 지형이 파괴되면 와이어가 해제됩니다. 연료와 제한된 탄약을 확인하세요.',icon:'rope'},
  {title:'준비 완료',body:'Enter나 턴 넘김 버튼으로 차례를 넘길 수 있습니다. 정지 버튼을 누르거나 가이드를 열면 전투가 멈춥니다. 완료한 대전 결과와 선택한 설정은 이 브라우저에 저장됩니다.',hint:'다른 기기·브라우저로 자동 동기화되지 않습니다. 기록 화면에서 JSON으로 내보낼 수 있습니다.',icon:'flag'}
];
function renderGuide(){const step=GUIDE_STEPS[guideStep];document.getElementById('guideTitle').textContent=step.title;document.getElementById('guideBody').textContent=step.body;document.getElementById('guideHint').textContent=step.hint;document.getElementById('guideProgress').textContent=String(guideStep+1).padStart(2,'0')+' / 06';document.getElementById('guideArt').innerHTML=weaponIcon(step.icon);document.getElementById('guidePrev').disabled=guideStep===0;document.getElementById('guideNext').textContent=guideStep===5?'가이드 완료':'다음'}
function openGuide(){guideStep=0;renderGuide();openGameDialog(document.getElementById('guideDialog'))}
function openHistory(){deleteArmed=false;document.getElementById('clearHistory').textContent='기록 삭제';renderHistory();openGameDialog(document.getElementById('historyDialog'))}
function initPersistence(){
  document.getElementById('homeCredits').addEventListener('click',()=>openGameDialog(document.getElementById('creditsDialog')));
  document.getElementById('creditsClose').addEventListener('click',()=>document.getElementById('creditsDialog').close());
  document.getElementById('creditsDialog').addEventListener('close',closeGameDialog);
  loadSettings();loadResults();
  if(readSaved(STORAGE_KEYS.guide)?.completed===true)document.getElementById('homeGuide').textContent='플레이 가이드 다시 보기';
  for(const id of OPTION_IDS)document.getElementById(id).addEventListener('change',saveSettings);
  for(const id of ['guideBtn','homeGuide'])document.getElementById(id).addEventListener('click',openGuide);
  for(const id of ['historyBtn','homeHistory'])document.getElementById(id).addEventListener('click',openHistory);
  for(const id of ['guideDialog','historyDialog'])document.getElementById(id).addEventListener('close',closeGameDialog);
  document.getElementById('guideClose').addEventListener('click',()=>document.getElementById('guideDialog').close());
  document.getElementById('historyClose').addEventListener('click',()=>document.getElementById('historyDialog').close());
  document.getElementById('guidePrev').addEventListener('click',()=>{guideStep=Math.max(0,guideStep-1);renderGuide()});
  document.getElementById('guideNext').addEventListener('click',()=>{if(guideStep<5){guideStep++;renderGuide()}else{writeSaved(STORAGE_KEYS.guide,{version:1,completed:true});document.getElementById('guideDialog').close()}});
  document.getElementById('clearHistory').addEventListener('click',()=>{if(!deleteArmed){deleteArmed=true;document.getElementById('clearHistory').textContent='정말 삭제';return}try{localStorage.removeItem(STORAGE_KEYS.results);blockedStorageKeys.delete(STORAGE_KEYS.results)}catch{storageStatus('브라우저의 기록을 삭제할 수 없습니다.')}matchHistory=[];deleteArmed=false;document.getElementById('clearHistory').textContent='기록 삭제';renderHistory()});
  document.getElementById('exportHistory').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,matches:matchHistory},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wormfront-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
}
