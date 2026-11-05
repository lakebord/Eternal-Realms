// Live test against the real Supabase project: signs in as a guest, plays, checks saves/chat/security, then deletes the test account.
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../index.html')+'?online');await p.waitForFunction(()=>!!document.querySelector('[data-a=authguest]'),null,{timeout:45000});
await p.click('[data-a=authguest]');await p.waitForFunction(()=>NET.uid&&NET.mode==='online',null,{timeout:45000});
console.log('1 guest signed in:',await p.evaluate(()=>({uid:NET.uid.slice(0,8),guest:NET.guest,host:NET.isHost,canWrite:NET.canWrite})));
await p.click('[data-a=newchar]');await p.fill('#cc_user','TestGuest');await p.fill('#cc_name','TestGuest');await p.click('.ccside .b.gilt');await p.waitForTimeout(3000);
console.log('2 in game:',await p.evaluate(()=>UI.started&&S.P.name));
const saved=await p.evaluate(async()=>{const ok=await saveCloud();await publishProfile(true);return ok;});
const meta=await p.evaluate(async()=>{const c=await peekCloud();return c&&{level:c.level,chunks:c.chunks};});
console.log('3 cloud save:',saved,'meta read back:',meta);
const loaded=await p.evaluate(async()=>{const c=await loadCloud();return c&&c.obj&&c.obj.P&&c.obj.P.name;});console.log('4 cloud load:',loaded);
await p.waitForTimeout(1500);
console.log('5 leaderboard sees me:',await p.evaluate(()=>Object.values(NET.players).map(x=>x.user)));
const chat=await p.evaluate(async()=>{NET.lastSend=0;return await netSendChat('global','hello from the test');});
const flood=await p.evaluate(async()=>{try{await NET.db.doc('chat/'+NET.uid).set({user:'x',msgs:[]});return 'allowed';}catch(e){return 'blocked: '+e.code;}});
console.log('6 chat sent:',chat,'| instant 2nd write:',flood);
const sec=await p.evaluate(async()=>{const r={};
  try{await NET.db.doc('world/meta').set({hack:1});r.world='WRITE ALLOWED (bad)';}catch(e){r.world='blocked';}
  try{await NET.db.doc('players/8f369ea2-0775-426e-918c-1ebcdb3829c3').set({user:'hacked'});r.otherPlayer='WRITE ALLOWED (bad)';}catch(e){r.otherPlayer='blocked';}
  try{const {data}=await SUPA.client.from('user_docs').select('owner').neq('owner',NET.uid);r.othersSaves=(data||[]).length?'VISIBLE (bad)':'not visible';}catch(e){r.othersSaves='blocked';}
  return r;});
console.log('7 security:',sec);
console.log('8 presence peers (excluding me):',await p.evaluate(()=>NET.peers));
await p.evaluate(async()=>{await supaDeleteAccount();});
const after=await p.evaluate(async()=>{const {data}=await SUPA.client.from('docs').select('id').eq('id',NET.uid);return data;});
console.log('9 test account deleted; leftover rows visible:',after);
console.log('errs',errs.slice(0,4));await b.close();})();
