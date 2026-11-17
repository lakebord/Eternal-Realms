// Performance probe: a mid-range phone (4x CPU slowdown), measures frame times and main-thread work per screen.
//   node tools/perf.js [file]
const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7'],colorScheme:'dark'});const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
const errs=[];p.on('pageerror',e=>errs.push(e.message));
if(process.env.EXP)await p.addInitScript(e=>{window.__EXP=e;},process.env.EXP);
await p.goto('file://'+path.resolve(process.argv[2]||path.join(__dirname,'../index.html')));
if(process.env.CSS)await p.addStyleTag({content:process.env.CSS});
if(process.env.EXP)await p.evaluate(()=>{if(__EXP.includes('noblur')){const o=CanvasRenderingContext2D.prototype;Object.defineProperty(o,'shadowBlur',{set(){},get(){return 0},configurable:true});}if(__EXP.includes('nofx'))window.fxAdd=()=>{};if(__EXP.includes('noembers'))window.startEmbers=()=>{};if(__EXP.includes('noscene'))window.startTitleScene=()=>{};});await p.waitForTimeout(1500);
const measure=async(label,ms=4000,during)=>{const m0=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const pr=p.evaluate(ms=>new Promise(res=>{const fr=[];let last=performance.now();const end=last+ms;let long=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())long+=e.duration;}).observe({type:'longtask',buffered:false});}catch(e){}
    const f=t=>{fr.push(t-last);last=t;if(t<end)requestAnimationFrame(f);else{fr.sort((a,b)=>a-b);res({frames:fr.length,fps:Math.round(fr.length/(ms/1000)),p50:fr[fr.length>>1].toFixed(1),p95:fr[Math.floor(fr.length*0.95)].toFixed(1),worst:fr[fr.length-1].toFixed(0),longTaskMs:Math.round(long)});}};requestAnimationFrame(f);}),ms);
  if(during)await during();const r=await pr;
  const m1=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  r.scriptMs=Math.round((m1.ScriptDuration-m0.ScriptDuration)*1000);r.layoutMs=Math.round((m1.LayoutDuration-m0.LayoutDuration)*1000);r.styleMs=Math.round((m1.RecalcStyleDuration-m0.RecalcStyleDuration)*1000);r.taskMs=Math.round((m1.TaskDuration-m0.TaskDuration)*1000);
  r.nodes=m1.Nodes;console.log(label.padEnd(16),JSON.stringify(r));};
if(!process.env.ONLY||process.env.ONLY==='title')await measure('title idle');
await p.click('[data-a=newchar]');await p.fill('#cc_user','Perf');await p.fill('#cc_name','Perf Tester');await p.click('.ccside .b.gilt');await p.waitForFunction(()=>S&&S.P&&UI.started,null,{timeout:30000});
await p.evaluate(()=>{for(let i=0;i<10;i++)gainXp(3000);});await p.waitForTimeout(5000);
if(process.env.ONLY!=='battle'){await measure('world idle');
await measure('world scroll',3000,async()=>{for(let i=0;i<10;i++){await p.mouse.wheel(0,300);await p.waitForTimeout(120);}for(let i=0;i<10;i++){await p.mouse.wheel(0,-300);await p.waitForTimeout(120);}});
await measure('tab switching',3000,async()=>{for(const t of ['bag','char','quests','map','world','bag','world']){await p.evaluate(t=>ACT.tab(t)||(UI.tab=t,UI.dirty=true,render()),t);await p.waitForTimeout(250);}});
}
await p.evaluate(()=>{S.P.loc='mine';ACT.hunt();render();});
await measure('battle',6000,async()=>{for(let i=0;i<6;i++){for(let k=0;k<50;k++){if(await p.$('#combat [data-a=ca][data-v=attack]')||await p.$('#combat [data-a=cclose]'))break;await p.waitForTimeout(100);}const a=await p.$('#combat [data-a=ca][data-v=attack]');if(a)await a.click();await p.waitForTimeout(400);}});
console.log('errors',errs);await b.close();})();
