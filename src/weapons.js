'use strict';

function selectWeapon(id){if(!started||paused||turnLocked||charging||shotgunRemain>0||gameOver||isCPU()||retreatUntil>gameNow||projectiles.length||walkers.length)return;selected=id;targetMode=null;targetPoint=null;ui.targetTip.style.display='none';updateHUD()}
function hasAmmo(id){return !limited.includes(id)||teams[activeTeam].ammo[id]>0}
function spend(id){if(limited.includes(id))teams[activeTeam].ammo[id]--}

function beginTargeting(type,text){
  if(!hasAmmo(type)){toast('탄약이 없습니다');return}targetMode=type;if(type==='homing'){const enemy=nearestEnemy(current());targetPoint=enemy?{x:enemy.x,y:enemy.y}:null}else if(type==='girder'){const w=current();targetPoint={x:w.x+facing*100,y:w.y-45}}ui.targetTip.style.display='block';ui.targetTip.textContent=text||'목표 지점을 클릭하세요.'
}
function fireStart(){
  const w=current();if(!w||!w.alive||gameOver||paused||turnLocked||retreatUntil>gameNow||projectiles.length||walkers.length||isCPU())return;
  if(selected==='rope'){toggleRope();return}
  if(selected==='jetpack'){toggleJetpack();return}
  if(selected==='teleport'){beginTargeting('teleport','이동할 지형을 클릭하세요.');return}
  if(selected==='airstrike'){beginTargeting('airstrike','공습 목표 지점을 클릭하세요.');return}
  if(selected==='homing'){beginTargeting('homing','유도 미사일의 목표 지점을 클릭하세요.');return}
  if(selected==='girder'){beginTargeting('girder','연결발판: 초록색은 설치 가능, 빨간색은 설치 불가입니다. 위치를 클릭하세요.');return}
  if(selected==='mine'){placeMine();return}
  if(selected==='dynamite'){placeDynamite();return}
  if(selected==='bat'){meleeBat();return}
  if(selected==='punch'){firePunch();return}
  if(selected==='sheep'){releaseSheep();return}
  if(selected==='drill'){dropDrill();return}
  if(selected==='shotgun'&&shotgunRemain===1){shootShotgun(w,1);return}
  if(!charging){charging=true;chargeAt=gameNow;ui.powerBox.classList.add('show')}
}
function fireEnd(){
  if(!charging||paused||gameOver||turnLocked||retreatUntil>gameNow)return;charging=false;ui.powerBox.classList.remove('show');const w=current();if(!w)return;
  const pwr=clamp((gameNow-chargeAt)/1600,.12,1);
  if(selected==='shotgun'){shotgunRemain=2;shootShotgun(w,pwr);return}
  if(!hasAmmo(selected)){toast('탄약이 없습니다');return}
  if(['banana','sacred','cluster','mortar'].includes(selected))spend(selected);
  spawnBallistic(selected,w,pwr,aim,facing);updateHUD()
}
// Single source for direct explosions and the CPU damage estimate.
const weaponBalance={bazooka:{radius:58,damage:50},grenade:{radius:60,damage:55},homing:{radius:55,damage:45},sacred:{radius:78,damage:75},air:{radius:40,damage:30},mini:{radius:30,damage:18},banana:{radius:38,damage:30,children:4,childDamage:24},cluster:{radius:32,damage:24,children:6,childDamage:18},mortar:{radius:32,damage:24,children:4,childDamage:18}};
// Scale both velocity components equally so the aiming angle is the launch angle.
// Scaling acceleration equally keeps fuse timing and roughly doubled reach.
// Live shots and CPU simulations both use these shared rules.
const SHOT_RANGE_SCALE=2;
const ballisticRules={
  bazooka:{base:10,mul:9,life:8,r:5,wind:true},
  grenade:{base:8.2,mul:7.5,life:3,r:5,bounce:3},
  banana:{base:8.3,mul:8.3,life:3.2,r:7,bounce:3},
  sacred:{base:7.6,mul:7.5,life:3.5,r:7,bounce:3},
  cluster:{base:8.3,mul:7.8,life:3,r:5,bounce:3},
  mortar:{base:11,mul:8,life:6,r:5,wind:true},
  homing:{base:10,mul:9,life:8,r:5},air:{wind:true},mini:{wind:true}
};
function createBallistic(type,w,pwr,ang,face,target=null){
  const rule=ballisticRules[type];if(!rule||rule.base===undefined)throw Error('Unknown ballistic weapon: '+type);
  const rad=ang*Math.PI/180,speed=(rule.base+pwr*rule.mul)*SHOT_RANGE_SCALE;
  return{type,x:w.x+Math.cos(rad)*face*16,y:w.y+Math.sin(rad)*16,
    vx:Math.cos(rad)*face*speed,vy:Math.sin(rad)*speed,r:rule.r,life:rule.life,bounce:rule.bounce||0,owner:w,target}
}
function spawnBallistic(type,w,pwr,ang,face,target=null){
  projectiles.push(createBallistic(type,w,pwr,ang,face,target));commitAttack();
  playSFX(['grenade','banana','sacred','cluster'].includes(type)?'throw':type==='homing'?'homing':type==='mortar'?'mortar':'launch')
}
// Shared by live projectiles and CPU prediction. Only the projectile is mutated.
function advanceBallistic(p,dt){
  p.life-=dt;
  if(p.life<=1e-9)return 'fuse';
  if(p.type==='homing'&&p.target){
    const dx=p.target.x-p.x,dy=p.target.y-p.y,n=Math.max(1,Math.hypot(dx,dy));
    p.vx=lerp(p.vx,dx/n*11*SHOT_RANGE_SCALE,.035*dt*60);p.vy=lerp(p.vy,dy/n*11*SHOT_RANGE_SCALE,.035*dt*60)
  }else{const scale=ballisticRules[p.type]?.base===undefined?1:SHOT_RANGE_SCALE;if(ballisticRules[p.type]?.wind)p.vx+=wind*dt*60*scale;p.vy+=G*dt*60*scale}
  const dx=p.vx*dt*60,dy=p.vy*dt*60,slices=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));
  for(let i=0;i<slices;i++){
    const ox=p.x,oy=p.y;p.x+=dx/slices;p.y+=dy/slices;
    if(p.y>waterY)return 'water';
    if(p.x<-80||p.x>WW+80||p.y>WH+100)return 'bounds';
    const hitGirder=girders.some(g=>girderContains(g,p.x,p.y));
    if(solid(p.x,p.y)||hitGirder){
      if((ballisticRules[p.type]?.bounce||0)>0&&p.bounce>0){
        p.x=ox;p.y=oy;p.bounce--;
        const wall=solid(ox+dx/slices,oy)||(hitGirder&&Math.abs(dx)>Math.abs(dy));
        if(wall){p.vx*=-.52;p.vy*=.75}else{p.vy*=-.52;p.vx*=.75}
        return null
      }
      return 'terrain'
    }
    for(const t of teams)for(const w of t.worms){if(w.alive&&w!==p.owner&&dist(p.x,p.y,w.x,w.y)<w.r+p.r)return 'worm'}
  }
  return null
}
function traceShot(w,type,pwr,ang,face,target=null){
  const p=createBallistic(type,w,pwr,ang,face,target),points=[{x:p.x,y:p.y}],maxSteps=Math.ceil(p.life/FIXED_DT)+1;let bounces=0;
  for(let i=0;i<maxSteps;i++){const before=p.bounce,event=advanceBallistic(p,FIXED_DT);if(before>p.bounce)bounces++;if(i%2===0||before>p.bounce||event)points.push({x:p.x,y:p.y});if(event)return{points,end:{x:p.x,y:p.y,event},steps:i+1,bounces}}
  return{points,end:{x:p.x,y:p.y,event:'limit'},steps:maxSteps,bounces};
}
function traceShotgun(w,pwr,ang,face){
  const rad=ang*Math.PI/180,range=(450+pwr*560)*SHOT_RANGE_SCALE,step=7;let x=w.x+Math.cos(rad)*face*14,y=w.y+Math.sin(rad)*14,hit=null,event='range';const points=[{x,y}];
  for(let i=0;i<range/step;i++){x+=Math.cos(rad)*face*step;y+=Math.sin(rad)*step;
    for(const t of teams)for(const o of t.worms)if(o.alive&&o!==w&&dist(x,y,o.x,o.y)<o.r+3){hit=o;break}
    if(hit||pointBlocked(x,y)||x<0||x>WW||y<0||y>WH){event=hit?'worm':pointBlocked(x,y)?'terrain':'bounds';break}}
  points.push({x,y});return{points,end:{x,y,event},hit,bounces:0};
}
function traceRope(w,ang,face){
  const rad=ang*Math.PI/180,points=[{x:w.x,y:w.y}];let x=w.x,y=w.y,event='range';
  for(let i=0;i<300;i+=4){x+=Math.cos(rad)*face*4;y+=Math.sin(rad)*4;if(pointBlocked(x,y)){event='anchor';break}}
  points.push({x,y});return{points,end:{x,y,event},bounces:0};
}
function getShotPreview(){
  if(!canShowAimGuide())return null;const w=current(),type=selected;if(type==='homing'&&(!targetPoint||targetMode!=='homing'))return null;
  const power=type==='homing'?.72:type==='shotgun'&&shotgunRemain===1?1:charging?clamp((gameNow-chargeAt)/1600,.12,1):.12;
  const key=[matchId,type,w.x,w.y,aim,facing,power,wind,waterY,terrainReadbacks,WW,WH,targetPoint?.x,targetPoint?.y,teams.flatMap(t=>t.worms).map(o=>[o.x,o.y,o.alive].join(':')).join(';'),JSON.stringify(girders)].join('|');
  if(shotPreviewCache?.key===key)return shotPreviewCache.value;
  const trace=type==='shotgun'?traceShotgun(w,power,aim,facing):type==='rope'?traceRope(w,aim,facing):traceShot(w,type,power,aim,facing,type==='homing'?targetPoint:null);
  const value={...trace,type,power,angle:aim,face:facing};shotPreviewCache={key,value};return value;
}
function shootShotgun(w,pwr){
  const trace=traceShotgun(w,pwr,aim,facing),{x,y}=trace.end,hit=trace.hit;
  rememberImpact(x,y);carve(x,y,15);burst(x,y,'#ffe3a0',9);if(hit)damage(hit,25,(hit.x-w.x>0?1:-1)*1.8,-1.4);shotgunRemain--;playSFX('shotgun');
  if(shotgunRemain>0)toast('확산포 1발 남음',800);else{startRetreat(2.6)}
}
function placeMine(){
  if(!hasAmmo('mine')){toast('감응타일이 없습니다');return}const w=current();spend('mine');mines.push({x:w.x+facing*15,y:w.y+4,armed:true,armAt:gameNow+1800,timer:0,owner:activeTeam});playSFX('place');beginDeploymentRetreat(2.5);updateHUD()
}
function placeDynamite(){
  if(!hasAmmo('dynamite')){toast('시간큐브가 없습니다');return}const w=current();spend('dynamite');
  projectiles.push({type:'dynamite',x:w.x+facing*13,y:w.y+3,vx:0,vy:0,r:6,life:3,bounce:0,owner:w});playSFX('place');toast('3… 2… 1…');beginDeploymentRetreat(3);updateHUD()
}
function meleeBat(){
  const w=current(),targets=teams[1-activeTeam].worms.filter(o=>o.alive&&dist(w.x,w.y,o.x,o.y)<45);
  if(!targets.length){toast('공격 범위에 상대가 없습니다');return}const o=targets.sort((a,b)=>dist(w.x,w.y,a.x,a.y)-dist(w.x,w.y,b.x,b.y))[0];
  damage(o,30,facing*6,-5);burst(o.x,o.y,'#ffe2a3',8);playSFX('melee');startRetreat(2.4)
}
function firePunch(){
  if(!hasAmmo('punch')){toast('탄약이 없습니다');return}const w=current(),targets=teams[1-activeTeam].worms.filter(o=>o.alive&&Math.abs(o.x-w.x)<42&&o.y<w.y+18&&o.y>w.y-70);
  if(!targets.length){toast('공격 범위에 상대가 없습니다');return}spend('punch');const o=targets[0];damage(o,35,facing*2,-7);burst(o.x,o.y,'#ff9b4d',12);playSFX('punch');startRetreat(2.4);updateHUD()
}
function releaseSheep(){
  if(!hasAmmo('sheep')){toast('태엽수레가 없습니다');return}const w=current();spend('sheep');playSFX('sheep');walkers.push({type:'sheep',x:w.x+facing*16,y:w.y,vx:facing*1.65,vy:0,life:7,team:activeTeam});commitAttack();updateHUD()
}
function dropDrill(){
  if(!hasAmmo('drill')){toast('드릴이 없습니다');return}const w=current();spend('drill');playSFX('drill');projectiles.push({type:'drill',x:w.x,y:w.y+14,vx:0,vy:3,r:5,life:4,owner:w});commitAttack();updateHUD()
}
function toggleJetpack(){
  const w=current();if(!w)return;
  if(jetpack){jetpack=false;playSFX('jetpackStop');toast('쌍날개팩 종료');startRetreat(2.2);return}
  if(!hasAmmo('jetpack')){toast('쌍날개팩이 없습니다');return}spend('jetpack');jetpack=true;jetFuel=5;playSFX('jetpack');toast('쌍날개팩: A/D 이동 · W 상승 · S 하강',1700);updateHUD()
}
function toggleRope(){
  const w=current();if(!w)return;if(rope){rope=null;w.knockTime=.45;playSFX('ropeRelease');toast('로프 해제');return}
  const trace=traceRope(w,aim,facing),hit=trace.end.event==='anchor'?trace.end:null;
  if(!hit){toast('로프가 닿지 않습니다');return}rope={ax:hit.x,ay:hit.y,len:Math.max(35,dist(hit.x,hit.y,w.x,w.y))};playSFX('rope')
}
function teleportDestination(w,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<w.r+1||x>WW-w.r-1||y<0||y>WH)return null;
  let best=null;
  // Search supported clear spaces at the chosen column, including cave floors.
  for(let cy=w.r+1;cy<waterY-w.r-4;cy++){
    if(!pointBlocked(x,cy+w.r+.2)||bodyBlocked(w,x,cy))continue;
    if(teams.some(t=>t.worms.some(o=>o!==w&&o.alive&&dist(x,cy,o.x,o.y)<w.r+o.r+2)))continue;
    const score=Math.abs(cy-y);if(!best||score<best.score)best={x,y:cy,score};
  }
  return best;
}
function girderPlacement(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return{girder:null,valid:false,reason:'올바른 위치를 선택하세요.'};
  const g={x,y,w:110,h:10},left=x-g.w/2,right=x+g.w/2,top=y-g.h/2,bottom=y+g.h/2;
  const reject=reason=>({girder:g,valid:false,reason});
  if(left<0||right>WW||y<60||y>waterY-30)return reject('전장 안의 물 위 공간을 선택하세요.');
  for(let py=Math.floor(top);py<=Math.ceil(bottom);py++)for(let px=Math.floor(left);px<=Math.ceil(right);px++)if(solid(px,py))return reject('지형과 겹쳐 설치할 수 없습니다.');
  if(girders.some(o=>Math.abs(o.x-x)<(o.w+g.w)/2&&Math.abs(o.y-y)<(o.h+g.h)/2))return reject('다른 연결발판과 겹쳐 설치할 수 없습니다.');
  if(teams.some(t=>t.worms.some(w=>w.alive&&Math.hypot(w.x-clamp(w.x,left,right),w.y-clamp(w.y,top,bottom))<=w.r+2)))return reject('캐릭터와 겹쳐 설치할 수 없습니다.');
  return{girder:g,valid:true,reason:'설치 가능'};
}
function useTarget(x,y){
  const w=current();if(!w||!w.alive||!targetMode||paused||gameOver||turnLocked||retreatUntil>gameNow)return;
  if(targetMode==='teleport'){
    const destination=teleportDestination(w,x,y);if(!destination){toast('이동할 수 없는 위치');return}playSFX('teleport');spend('teleport');burst(w.x,w.y,'#a78bff',15);w.x=destination.x;w.y=destination.y;w.vx=w.vy=0;w.onGround=true;burst(w.x,w.y,'#a78bff',15);finishTarget();startRetreat(1.2)
  }else if(targetMode==='airstrike'){
    playSFX('airstrike');spend('airstrike');const dir=wind>=0?1:-1;pendingEmissions=7;commitAttack();for(let i=0;i<7;i++)scheduleCombat(()=>{pendingEmissions--;projectiles.push({type:'air',x:x-dir*170+i*38*dir,y:0-rand(20,100),vx:dir*1.8,vy:8.4,r:5,life:7})},i*100)
  }else if(targetMode==='homing'){
    spend('homing');targetPoint={x,y};spawnBallistic('homing',w,.72,aim,facing,targetPoint);finishTarget()
  }else if(targetMode==='girder'){
    targetPoint={x,y};const placement=girderPlacement(x,y);if(!placement.valid){toast(placement.reason);return}if(!hasAmmo('girder')){toast('탄약이 없습니다');return}
    spend('girder');girders.push(placement.girder);playSFX('girder');finishTarget();startRetreat(1.5)
  }updateHUD()
}
function finishTarget(){targetMode=null;ui.targetTip.style.display='none'}

function splitBomb(p,count=5){
  const balance=weaponBalance[p.type];explode(p.x,p.y,balance.radius,balance.damage,p.type);
  for(let i=0;i<count;i++){const a=lerp(-Math.PI*.92,-Math.PI*.08,i/(count-1));projectiles.push({type:'mini',damage:balance.childDamage,x:p.x,y:p.y-4,vx:Math.cos(a)*rand(4,6.6),vy:Math.sin(a)*rand(4,6.6),r:4,life:2.7,bounce:1})}
}
function projectileStep(p,dt){
  if(!p.trail)p.trail=[];p.trail.push({x:p.x,y:p.y});if(p.trail.length>28)p.trail.shift();
  if(['grenade','banana','sacred','cluster','dynamite'].includes(p.type)&&p.life>0){
    const tick=Math.ceil(p.life);if(p.fuseTick!==tick){p.fuseTick=tick;playSFX('fuse')}
    if(p.type==='sacred'&&p.life<=.85&&!p.holyPlayed){p.holyPlayed=true;playSFX('holy')}
  }
  if(p.type==='dynamite'){p.life-=dt;if(p.life<=1e-9){explode(p.x,p.y,78,75,'dynamite');return true}return false}
  if(p.type==='drill'){
    p.life-=dt;p.y+=p.vy*dt*60;carve(p.x,p.y,8);if(p.life<=1e-9||p.y>waterY){explode(p.x,p.y,58,52,'drill');return true}return false
  }
  const bounces=p.bounce,event=advanceBallistic(p,dt);if(p.bounce<bounces)playSFX('bounce');if(!event)return false;
  if(event==='water'){playSFX('splash');burst(p.x,waterY,'#9eeeff',12);return true}
  if(event==='bounds')return true;
  if(['banana','cluster'].includes(p.type)){splitBomb(p,weaponBalance[p.type].children);return true}
  if(p.type==='mortar'){splitBomb(p,4);return true}
  if(p.type==='sacred'){if(!p.holyPlayed)playSFX('holy');explode(p.x,p.y,weaponBalance.sacred.radius,weaponBalance.sacred.damage,'sacred');bigBanner('별빛 방출!',850);return true}
  const balance=weaponBalance[p.type]||weaponBalance.bazooka;
  explode(p.x,p.y,balance.radius,p.damage??balance.damage,p.type);return true
}
function walkerStep(o,dt){
  o.life-=dt;o.vy=Math.min(8,o.vy+G*dt*60);let nx=o.x+o.vx*dt*60,ny=o.y+o.vy*dt*60;
  if(solid(nx+Math.sign(o.vx)*8,o.y)){o.vy=-4.2;o.vx*=.98}
  if(o.vy>=0&&solid(nx,ny+8)){let yy=ny;for(let k=0;k<14&&solid(nx,yy+8);k++)yy--;ny=yy;o.vy=0}
  o.x=nx;o.y=ny;
  for(const w of teams[1-o.team].worms)if(w.alive&&dist(o.x,o.y,w.x,w.y)<30){o.life=0;break}
  if(o.life<=0||o.y>waterY){explode(o.x,o.y,70,65,'sheep');return true}return false
}
