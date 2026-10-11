'use strict';

/* ---------------- Update ---------------- */
function update(dt,ts){
  worldTime=gameNow;if(!started||paused||gameOver){updateCamera(dt);return}
  ts=gameNow;runCombatTasks();
  if(sudden)waterY=Math.max(WH*.51,waterY-dt*1.55);
  if(!turnLocked&&retreatUntil===0){turnLeft=turnSec-(ts-turnStart)/1000;if(turnLeft<=0){turnLeft=0;nextTurn(600)}}
  if(retreatUntil>0&&ts>=retreatUntil){retreatUntil=0;nextTurn(0)}
  const w=current();
  if(w&&!turnLocked&&projectiles.length===0&&walkers.length===0&&!isCPU()){if(keys.ArrowUp)aim=clamp(aim-.68*dt*60,-89,13);if(keys.ArrowDown)aim=clamp(aim+.68*dt*60,-89,13)}
  if(keys.z&&!isCPU())panCamera(-6,0)
  if(keys.x&&!isCPU())panCamera(6,0)

  for(const t of teams)for(const wm of t.worms)wormStep(wm,dt);updateMines(dt);
  const processing=projectiles;projectiles=[];for(const p of processing)if(!projectileStep(p,dt))projectiles.push(p);
  walkers=walkers.filter(o=>!walkerStep(o,dt));
  resolveCombat();
  if(charging)ui.power.style.width=clamp((gameNow-chargeAt)/1600,0,1)*100+'%';
  if((!living(0).length||!living(1).length)&&!attackCommitted&&!combatUnsettled())finishGame();
  updateEffects(dt);updateCamera(dt)
}

function advanceFrame(elapsed){
  if(!started||paused||gameOver){physicsAccumulator=0;return 0}
  physicsAccumulator+=Math.max(0,Math.min(MAX_FRAME_DELTA,elapsed));
  let steps=0;
  while(physicsAccumulator+1e-9>=FIXED_DT){
    physicsAccumulator=Math.max(0,physicsAccumulator-FIXED_DT);gameNow+=FIXED_DT*1000;physicsSteps++;steps++;
    update(FIXED_DT,gameNow);
    if(paused||gameOver){physicsAccumulator=0;break}
  }
  return steps
}
function loop(ts){const elapsed=Math.max(0,(ts-last)/1000);last=ts;advanceFrame(elapsed);if(started)updateHUD();render(Math.min(MAX_FRAME_DELTA,elapsed));requestAnimationFrame(loop)}
