// Existing combat suites enter battle immediately. The new presentation suite tests
// the unmodified orientation, fullscreen and intro flows separately.
const {chromium}=require('playwright');let installed=false;
module.exports=()=>{if(installed)return;installed=true;const launch=chromium.launch.bind(chromium);
 chromium.launch=async options=>{const channel=process.env.WORMFRONT_BROWSER_CHANNEL;if(channel)options={...options,channel:channel==='chromium'?undefined:channel};const browser=await launch(options),newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{const context=await newContext(options);await context.addInitScript(()=>{
   try{Object.defineProperty(navigator,'maxTouchPoints',{get:()=>0})}catch{}
   Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;
   addEventListener('DOMContentLoaded',()=>{
    if(typeof window.startGame==='function'){const original=window.startGame;window.startGame=function(...args){const result=original(...args);window.completeWormIntro?.();return result}}
    document.addEventListener('click',e=>{if(e.target.closest?.('#start')){const intro=document.getElementById('wormIntro');if(intro&&!intro.hidden)document.getElementById('skipIntro').click()}});
   });
  });return context};
  browser.newPage=async options=>(await browser.newContext(options)).newPage();return browser;
 };
};
