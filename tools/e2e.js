// Browser smoke test: create a character, explore, fight, chat, open every tab.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:Number(process.env.W||1280),height:900}});const errs=[];
p.on('pageerror',e=>errs.push('pageerror: '+e.stack));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(800);
const shot=async n=>{if(process.env.SHOTS)await p.screenshot({path:`${process.env.SHOTS}/${n}.png`,fullPage:false});};
await shot('01-title');
await p.click('[data-a=newchar]');await p.waitForTimeout(300);
await p.fill('#cc_user','Wanderly');await p.fill('#cc_name','Ysolde Brightwater');
await p.click('[data-v="race|halfelf"]');await p.fill('#cc_user','Wanderly');await p.fill('#cc_name','Ysolde Brightwater');
await p.click('[data-v="cls|bard"]');await p.fill('#cc_user','Wanderly');await p.fill('#cc_name','Ysolde Brightwater');await p.fill('#cc_hair','silver braids');await p.click('[data-v="start|brookhollow"]');await p.fill('#cc_user','Wanderly');await p.fill('#cc_name','Ysolde Brightwater');
await shot('02-create');
await p.click('.ccside .b.gilt');await p.waitForTimeout(800);await shot('03-world');
const tryClick=async sel=>{const el=await p.$(sel);if(el&&await el.isVisible()){try{await el.click({timeout:4000});}catch(e){console.log('click skipped',sel);return false;}await p.waitForTimeout(250);return true;}return false;};
for(let i=0;i<3;i++){await tryClick('[data-a=explore]');if(await p.$('#combat:not([hidden])'))break;}
// fight
if(!(await p.$('#combat:not([hidden])')))await tryClick('[data-a=travel][data-v=greenmarch]');
for(let k=0;k<4&&!(await p.$('#combat:not([hidden])'));k++)await tryClick('[data-a=hunt]');
await p.waitForTimeout(600);await shot('04-combat');
for(let t=0;t<40;t++){if(await p.$('[data-a=cclose]'))break;if(await p.$('[data-a=ca][data-v=attack]')){if(t===1&&await p.$('[data-a=cmenu][data-v=summon]')){await p.click('[data-a=cmenu][data-v=summon]');await p.waitForTimeout(150);await tryClick('[data-a=csummon]');}else await p.click('[data-a=ca][data-v=attack]');}await p.waitForTimeout(500);}
await shot('05-combat-end');await tryClick('[data-a=cclose]');
// chat
await p.click('[data-a=tab][data-v=chat]:visible');await p.waitForTimeout(200);
await p.fill('#chatmsg','Anyone want to help me clear the abandoned mine?');await p.press('#chatmsg','Enter');await p.waitForTimeout(9000);
await shot('06-chat');
const chatText=await p.textContent('#view');
const m=chatText.match(/([\w\-]+): (sure, I'm lvl|I can help|I'm down|omw\. lvl|Sure\. I'm level)/i);console.log('agreed:',m&&m[1]);
if(m){await p.fill('#chatmsg','/invite '+m[1]);await p.press('#chatmsg','Enter');await p.waitForTimeout(500);}
else{const q=chatText.match(/([\w\-]+): (What level are you\?|lvl\?|what lvl r u\?|what's your level\?)/i);console.log('asked:',q&&q[1]);if(q){await p.fill('#chatmsg','level 1');await p.press('#chatmsg','Enter');await p.waitForTimeout(16000);const t2=await p.textContent('#view');console.log('reply:',t2.replace(/\s+/g,' ').slice(-300));const m2=t2.match(/([\w\-]+): .*send me an invite/i);if(m2){await p.fill('#chatmsg','/invite '+m2[1]);await p.press('#chatmsg','Enter');await p.waitForTimeout(500);}}}
const agreed=await p.evaluate(()=>{const n=S.npcs.find(n=>n.agreedP&&online(n));if(!n)return null;playerChat('global','/invite '+n.user);return n.user+' inParty='+S.P.party.includes(n.id);});console.log('invite:',agreed);
await p.click('[data-a=tab][data-v=social]:visible');await p.waitForTimeout(200);console.log('party:',(await p.textContent('#view')).replace(/\s+/g,' ').slice(0,250));await shot('06b-party');
await p.click('[data-a=tab][data-v=world]:visible');await tryClick('[data-a=travel][data-v=greenmarch]');await p.waitForTimeout(300);
for(let r=0;r<2;r++){if(!(await p.$('#combat:not([hidden])')))await tryClick('[data-a=hunt]');await p.waitForTimeout(500);await shot('06c-partyfight'+r);
for(let t=0;t<40;t++){if(await p.$('[data-a=cclose]'))break;await tryClick('[data-a=ca][data-v=attack]');await p.waitForTimeout(450);}
console.log('fight:',(await p.textContent('.cwrap')).replace(/\s+/g,' ').slice(-260));await shot('06d-partyfight-end'+r);await tryClick('[data-a=cclose]');}
for(const t of ['map','char','bag','quests','social','ranks','market','codex','menu','world']){await p.click(`[data-a=tab][data-v=${t}]:visible`);await p.waitForTimeout(250);await shot('07-'+t);}
// services
await p.click('[data-a=tab][data-v=world]:visible');await tryClick('[data-a=travel][data-v=brookhollow]');await p.waitForTimeout(300);if(await p.$('[data-a=cclose]')){for(let t=0;t<40;t++){if(await p.$('[data-a=cclose]'))break;await tryClick('[data-a=ca][data-v=attack]');await p.waitForTimeout(400);}await tryClick('[data-a=cclose]');}
for(const s of ['inn','shop','board','smith']){if(await tryClick(`[data-a=svc][data-v=${s}]`)){await shot('08-svc-'+s);await tryClick('[data-a=close]');}}
await p.click('[data-a=tab][data-v=map]:visible');await tryClick('[data-a=mapsel][data-v=valeria]');await shot('09-mapsel');
await p.evaluate(()=>{S.P.loc='valeria';startEvent('invasion',{loc:'valeria'});startEvent('blessing');UI.tab='world';UI.dirty=true;render();});await p.waitForTimeout(400);await shot('10-events');
await tryClick('[data-a=svc][data-v=special]');await p.waitForTimeout(300);await shot('11-special');await tryClick('[data-a=close]');
await tryClick('[data-a=defend]');await p.waitForTimeout(800);for(let t=0;t<40;t++){if(await p.$('[data-a=cclose]'))break;await tryClick('[data-a=ca][data-v=attack]');await p.waitForTimeout(350);}await shot('12-defend');await tryClick('[data-a=cclose]');
await tryClick('[data-a=svc][data-v=board]');await p.waitForTimeout(300);await shot('13-board');await tryClick('[data-a=close]');
console.log('chat excerpt:',chatText.replace(/\s+/g,' ').slice(-700));
console.log('ERRORS',errs.length);errs.slice(0,15).forEach(e=>console.log(e));await b.close();})();
