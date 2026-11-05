// Live test: two guests see each other online and exchange chat, then both test accounts delete themselves.
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ps=[];
for(const name of ['GuestAlpha','GuestBravo']){const p=await (await b.newContext({...devices['Pixel 7']})).newPage();p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+require('path').resolve(__dirname,'../index.html')+'?online');await p.waitForSelector('[data-a=authguest]',{timeout:45000});await p.click('[data-a=authguest]');
  await p.waitForFunction(()=>NET.uid&&NET.mode==='online',null,{timeout:45000});await p.click('[data-a=newchar]');await p.fill('#cc_user',name);await p.fill('#cc_name',name);await p.click('.ccside .b.gilt');await p.waitForTimeout(2500);ps.push(p);}
await ps[0].waitForTimeout(6000);
for(const p of ps)console.log(await p.evaluate(()=>S.P.name),'sees online:',await p.evaluate(()=>Object.values(NET.peerMap).map(x=>x.user)));
await ps[0].evaluate(async()=>{NET.lastSend=0;await netSendChat('global','hi Bravo, can you hear me?');});await ps[1].waitForTimeout(4000);
console.log('Bravo received chat:',await ps[1].evaluate(()=>(S.chat.global||[]).filter(m=>m.real).map(m=>m.text||m[2]||JSON.stringify(m).slice(0,80))));
for(const p of ps)await p.evaluate(async()=>{await supaDeleteAccount();});console.log('both test accounts deleted');await b.close();})();
