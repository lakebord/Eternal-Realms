// Live test: real-player parties and friends between two guests. Test accounts always delete themselves, even on failure.
const {chromium,devices}=require('playwright');const path=require('path');const URL_=process.env.GAME_URL||('file://'+path.resolve(__dirname,'../index.html')+'?online');
const tag=String(Date.now()).slice(-5);
(async()=>{const b=await chromium.launch();const ps=[];const errs=[];
try{
  for(const name of ['PtA'+tag,'PtB'+tag]){const p=await (await b.newContext({...devices['Pixel 7']})).newPage();
    p.on('pageerror',e=>errs.push(name+': '+String(e.stack).split('\n').slice(0,3).join(' | ')));p.on('console',m=>{if(m.type()==='warning')errs.push(name+' warn: '+m.text().slice(0,200));});
    await p.goto(URL_);await p.waitForSelector('[data-a=authguest]',{timeout:45000});await p.click('[data-a=authguest]');
    await p.waitForFunction(()=>NET.uid&&NET.mode==='online',null,{timeout:45000});ps.push(p);
    await p.waitForTimeout(1500);await p.click('[data-a=newchar]');await p.waitForSelector('#cc_user',{timeout:15000});await p.fill('#cc_user',name);await p.fill('#cc_name',name);await p.click('.ccside .b.gilt');
    await p.waitForFunction(()=>S.P&&UI.started,null,{timeout:20000});await p.evaluate(()=>{publishProfile(true);netPresence(true);});}
  const [A,B]=ps;const aKey=await A.evaluate(()=>NET.myKey),bKey=await B.evaluate(()=>NET.myKey);
  await A.waitForFunction(k=>!!NET.peerMap[k],bKey,{timeout:20000});await B.waitForFunction(k=>!!NET.peerMap[k],aKey,{timeout:20000});console.log('1 see each other: yes');
  await A.evaluate(k=>partyInvite(k),bKey);await B.waitForFunction(()=>partyInvitesToMe().length>0,null,{timeout:15000});console.log('2 Bravo sees invite: yes');
  await B.evaluate(k=>partyAccept(k),aKey);
  await A.waitForFunction(()=>partyMates().length===1,null,{timeout:15000});await B.waitForFunction(()=>partyMates().length===1,null,{timeout:15000});
  console.log('3 in party: Alpha sees',await A.evaluate(()=>partyMates().map(p=>p.user)),'| Bravo sees',await B.evaluate(()=>partyMates().map(p=>p.user)));
  await B.waitForTimeout(8000);console.log('4 still together after 8s:',await A.evaluate(()=>partyMates().length),await B.evaluate(()=>partyMates().length));
  const allies=await A.evaluate(()=>{const rc=UI.runCombat;UI.runCombat=()=>{};startCombat([makeMonster('wolf',1)],{type:'pve'});const r=C.allies.map(a=>a.name);C.closed=true;C.ended=true;document.getElementById('combat').hidden=true;UI.runCombat=rc;return r;});
  console.log('5 Alpha fight allies:',allies);
  await A.evaluate(()=>{NET.lastSend=0;netSendChat('party','party only hello');});
  await B.waitForFunction(()=>(S.chat.party||[]).some(m=>JSON.stringify(m).includes('party only hello')),null,{timeout:15000}).then(()=>console.log('6 party chat delivered: yes')).catch(()=>console.log('6 party chat delivered: NO'));
  const fr=await A.evaluate(async k=>{await friendAdd(k);return friendState(k);},bKey);
  if(fr==='sent'){await B.waitForFunction(()=>friendRequests().length>0,null,{timeout:15000}).catch(()=>{});console.log('7 friend request seen by Bravo:',await B.evaluate(()=>friendRequests().map(realName)));
    await B.evaluate(async k=>{await friendAdd(k);},aKey);await A.waitForFunction(()=>realFriendIds().length>0,null,{timeout:15000}).catch(()=>{});
    console.log('8 friends: Alpha',await A.evaluate(()=>realFriendIds().map(realName)),'| Bravo',await B.evaluate(()=>realFriendIds().map(realName)));}
  else console.log('7 friends: not saved (database update for friends not applied yet)');
  await A.evaluate(k=>partyKick(k),bKey);await B.waitForFunction(()=>partyMates().length===0&&!NET.live.party.lead,null,{timeout:20000}).then(()=>console.log('9 kick works: yes')).catch(()=>console.log('9 kick works: NO'));
}catch(e){console.log('TEST FAILED:',e.message.split('\n')[0]);}
finally{for(const p of ps)await p.evaluate(async()=>{try{await supaDeleteAccount();return 'deleted';}catch(e){return 'delete failed '+e.message;}}).then(r=>console.log('cleanup:',r)).catch(e=>console.log('cleanup error',e.message));
  console.log('errs',errs.slice(0,5));await b.close();}})();
