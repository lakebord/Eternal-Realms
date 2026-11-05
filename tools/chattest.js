// Live chat test: idle chatter volume, guild chat, follow-up conversation, chat updating while typing elsewhere.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.stack));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(800);
await p.click('[data-a=newchar]');await p.fill('#cc_user','Chatter');await p.fill('#cc_name','Chatty');await p.click('[data-v="cls|ranger"]');await p.fill('#cc_user','Chatter');await p.fill('#cc_name','Chatty');await p.click('.ccside .b.gilt');await p.waitForTimeout(800);
const count=()=>p.evaluate(()=>['global','local','trade','recruit','guild','party','system'].reduce((s,k)=>s+(S.chat[k]||[]).length,0));
await p.focus('#ff');await p.type('#ff','thinking about it',{delay:50}); // typing in another box must not freeze chat
const c0=await count();const dom0=await p.evaluate(()=>document.querySelectorAll('#side .cl').length);await p.waitForTimeout(40000);const c1=await count();const dom1=await p.evaluate(()=>document.querySelectorAll('#side .cl').length);
console.log('idle 40s: messages',c1-c0,'| chat DOM lines before/after while typing elsewhere',dom0,dom1);
// join a guild
await p.evaluate(()=>{const g=S.guilds.find(g=>g.members.map(npc).filter(n=>n&&online(n)).length>=3)||S.guilds[0];S.P.guild=g.id;S.P.grank='Member';g.members.push('P');UI.dirty=true;});await p.click('#side [data-a=chch][data-v=guild]');
await p.waitForTimeout(500);await p.fill('#chatmsg','hey guild, how is everyone?');await p.press('#chatmsg','Enter');await p.waitForTimeout(14000);
const guildLines=await p.evaluate(()=>(S.chat.guild||[]).slice(-8).map(m=>(m.from==='P'?S.P.user:npc(m.from).user)+': '+m.text));console.log('GUILD:\n '+guildLines.join('\n '));
// global follow-up conversation
await p.click('#side [data-a=chch][data-v=global]');await p.waitForTimeout(300);
await p.fill('#chatmsg','how are you all doing today?');await p.press('#chatmsg','Enter');await p.waitForTimeout(10000);
await p.fill('#chatmsg','what are you doing right now?');await p.press('#chatmsg','Enter');await p.waitForTimeout(12000);
const g=await p.evaluate(()=>(S.chat.global||[]).filter(m=>m.from==='P'||m.text.toLowerCase().includes('@chatter')).slice(-8).map(m=>(m.from==='P'?S.P.user:npc(m.from).user)+': '+m.text));console.log('GLOBAL with me:\n '+g.join('\n '));
await p.screenshot({path:(process.env.SHOTS||'.')+'/14-livechat.png'});
console.log('ERRORS',errs.length,errs[0]||'');await b.close();})();
