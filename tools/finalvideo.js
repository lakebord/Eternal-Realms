// Records the final-battle death → comeback sequence to a video file.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const OUT=process.env.OUT||'.';
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1280,height:720},recordVideo:{dir:OUT,size:{width:1280,height:720}},colorScheme:'dark'});const tPage=Date.now();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.stack));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(600);
await p.click('[data-a=newchar]');await p.fill('#cc_user','Ysolde');await p.fill('#cc_name','Ysolde');await p.click('[data-v="cls|paladin"]');await p.fill('#cc_user','Ysolde');await p.fill('#cc_name','Ysolde');await p.click('.ccside .b.gilt');await p.waitForTimeout(400);
await p.evaluate(()=>{const P=S.P;P.level=95;const CL=CLASSES[P.cls],pr=CLASS_PRIO[P.cls];for(let i=1;i<95;i++){for(const k in CL.growth)P.attr[k]+=CL.growth[k];P.attr[pr[0]]++;P.attr[pr[1]]++;}for(const k in CL.mastery){P.mastery[k]=P.mastery[k]||{lv:0,xp:0};P.mastery[k].lv=70;}P.equip.weapon=makeGear('greatsword',95,3);for(const sl of ['head','chest','legs','hands','feet'])P.equip[sl]=makeGear(sl+'_plate',95,3);P.tiers.paladin=2;dirty(P);const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;P.loc='spire';invAdd(P,'hpot4',5);UI.dirty=true;render();startFinalBattle(false);});
const recAt=await p.evaluate(()=>{audInit();audStart&&audStart();if(AUD.ctx.state!=='running')AUD.ctx.resume();const d=AUD.ctx.createMediaStreamDestination();AUD.master.connect(d);window.__ch=[];const r=new MediaRecorder(d.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:160000});r.ondataavailable=e=>window.__ch.push(e.data);r.start(500);window.__rec=r;return Date.now();});
const t0=Date.now();let p2At=0;
while(Date.now()-t0<150000){const st=await p.evaluate(()=>({cin:!!document.getElementById('cutscene'),phase:C.finalPhase||1,ended:C.ended}));
  if(st.phase===2&&!st.cin&&!p2At)p2At=Date.now();if(p2At&&Date.now()-p2At>45000)break;if(st.ended)break;
  const drank=!st.cin&&!st.ended&&await p.evaluate(()=>{const a=C.allies[0];if(!C.waiting||a.hp>a.mhp*0.35)return false;const i=S.P.inv.findIndex(x=>x.k==='hpot4');if(i<0)return false;playerAction('item',i);UI.runCombat();return true;});
  const a=await p.$('#combat [data-a=ca][data-v=heavy]');if(a&&!st.cin&&!drank){await p.waitForTimeout(st.phase===2?1100:500);await a.click().catch(()=>{});}await p.waitForTimeout(150);}
await p.evaluate(()=>new Promise(r=>{window.__rec.onstop=r;window.__rec.stop();}));
const b64=await p.evaluate(async()=>{const bl=new Blob(window.__ch,{type:'audio/webm'});const buf=new Uint8Array(await bl.arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode.apply(null,buf.subarray(i,i+32768));return btoa(s);});
fs.writeFileSync(OUT+'/audio.webm',Buffer.from(b64,'base64'));fs.writeFileSync(OUT+'/offset.txt',String((recAt-tPage)/1000));
const vid=await p.video().path();await ctx.close();await b.close();console.log('video',vid,'errors',errs.length,errs[0]||'');fs.writeFileSync(OUT+'/last.txt',vid);})();
