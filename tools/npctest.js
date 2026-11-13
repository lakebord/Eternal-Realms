// Talk to every townsperson in every town and try every dialogue option; also check profile actions give visible feedback.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.stack));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(800);
await p.click('[data-a=newchar]');await p.fill('#cc_user','Talker');await p.fill('#cc_name','Talky');await p.click('.ccside .b.gilt');await p.waitForTimeout(800);
await p.evaluate(()=>{S.P.gold=99999;});
const towns=await p.evaluate(()=>Object.keys(TOWNSFOLK));let talks=0,opts=0,dead=[];
for(const t of towns){await p.evaluate(t=>{S.P.loc=t;closeModal();UI.tab='world';UI.dirty=true;render();},t);await p.waitForTimeout(150);
  const folks=await p.$$eval('#view [data-a=talk]',els=>els.map(e=>e.dataset.v));
  for(const f of folks){await p.evaluate(()=>closeModal());await p.click(`#view [data-a=talk][data-v="${f.replace(/"/g,'\\"')}"]`);await p.waitForTimeout(120);talks++;
    if(!(await p.$('#modal:not([hidden]) .dialog'))){dead.push(f+' (no dialog)');continue;}
    const keys=await p.$$eval('#modal [data-a=folksay]',els=>els.map(e=>e.dataset.v).filter(k=>k!=='bye'));
    for(const k of keys){await p.evaluate(()=>{if(!document.querySelector('#modal .dialog'))ACT.talk(UI.lastFolk);});
      const before=await p.evaluate(()=>document.getElementById('modal-body').innerHTML);
      const btn=await p.$(`#modal [data-a=folksay][data-v=${k}]`);if(!btn){continue;}await btn.click();await p.waitForTimeout(80);opts++;
      const after=await p.evaluate(()=>document.getElementById('modal-body').innerHTML);if(after===before)dead.push(`${f} → ${k}`);
      if(!(await p.$('#modal .dialog'))){await p.evaluate(v=>ACT.talk(v),f);}}}}
// profile actions
await p.evaluate(()=>{closeModal();S.P.loc='valeria';});const n=await p.evaluate(()=>S.npcs.find(n=>!online(n)).id);await p.evaluate(id=>ACT.profile(id),n);
const toasts0=await p.$$eval('#toasts .toast',e=>e.length);await p.click('#modal [data-a=invite]');await p.waitForTimeout(200);const toasts1=await p.$$eval('#toasts .toast',e=>e.length);
console.log({towns:towns.length,talks,optionsTried:opts,deadButtons:dead.slice(0,10),inviteOfflineShowsFeedback:toasts1>toasts0});console.log('ERRORS',errs.length,errs[0]||'');await b.close();})();
