// Phone-size, dark-mode screenshots of the main screens.
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7'],colorScheme:'dark'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.stack));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(800);const S_=process.env.SHOTS;
await p.click('[data-a=newchar]');await p.fill('#cc_user','Pocketknight');await p.fill('#cc_name','Brann Ashford');await p.screenshot({path:S_+'/m1-create.png'});
await p.click('.ccside .b.gilt');await p.waitForTimeout(800);await p.screenshot({path:S_+'/m2-world.png'});
await p.evaluate(()=>{const P=S.P;startEncounter('greenmarch');});await p.waitForTimeout(1500);await p.screenshot({path:S_+'/m3-combat.png'});
await p.evaluate(()=>{if(C&&!C.ended){C.ended=false;}});for(let t=0;t<30;t++){if(await p.$('[data-a=cclose]'))break;const a=await p.$('[data-a=ca][data-v=attack]');if(a)await a.click();await p.waitForTimeout(450);}await p.click('[data-a=cclose]').catch(()=>{});
await p.click('[data-a=tab][data-v=chat]:visible');await p.waitForTimeout(6000);await p.screenshot({path:S_+'/m4-chat.png'});
await p.click('[data-a=more]:visible');await p.waitForTimeout(300);await p.screenshot({path:S_+'/m5a-more.png'});await p.click('[data-a=gotab][data-v=ranks]');await p.waitForTimeout(300);await p.screenshot({path:S_+'/m5-ranks.png'});
const w=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);console.log('overflow px',w,'errors',errs.length,errs[0]||'');await b.close();})();
