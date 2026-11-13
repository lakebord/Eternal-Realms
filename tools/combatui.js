// Combat UI test: every menu opens, skills/magic/items/summon/party/inspect/targeting actually work by clicking.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.stack));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(800);
await p.click('[data-a=newchar]');await p.fill('#cc_user','Clicker');await p.fill('#cc_name','Clicky');await p.click('[data-v="cls|'+(process.argv[2]||'summoner')+'"]');await p.fill('#cc_user','Clicker');await p.fill('#cc_name','Clicky');await p.click('.ccside .b.gilt');await p.waitForTimeout(800);
await p.evaluate(()=>{S.P.level=12;S.P.mastery.fire={lv:5,xp:0};dirty(S.P);const st=stats(S.P);S.P.hp=st.mhp;S.P.mp=st.mmp;S.P.sp=st.msp;invAdd(S.P,'hpot1',3);
  startCombat([makeMonster('wolf',3),makeMonster('wolf',3)],{type:'pve'});});
const waitTurn=async()=>{for(let i=0;i<40;i++){if(await p.$('#combat [data-a=ca][data-v=attack]'))return true;if(await p.$('[data-a=cclose]'))return false;await p.waitForTimeout(150);}return false;};
const res={};const tryMenu=async(menu,itemSel,label)=>{if(!(await waitTurn())){res[label]='combat ended';return;}const before=await p.evaluate(()=>C.log.length);
  await p.click(`#combat [data-a=cmenu][data-v=${menu}]`).catch(()=>{});await p.waitForTimeout(250);const opened=!!(await p.$(`#combat ${itemSel}`));
  if(opened){await p.click(`#combat ${itemSel}:not([disabled])`).catch(()=>{});await p.waitForTimeout(500);}const after=await p.evaluate(()=>C.log.slice(-6).map(x=>x[0]).join(' | '));
  res[label]=(opened?'menu opened':'MENU DID NOT OPEN')+' → '+(await p.evaluate(b=>C.log.length>b,before)?'action happened':'nothing happened');};
await tryMenu('skills','[data-a=cskill]','Skills');await tryMenu('magic','[data-a=cskill]','Magic');await tryMenu('items','[data-a=citem]','Items');await tryMenu('summon','[data-a=csummon]','Summon');
if(await waitTurn()){await p.click('#combat [data-a=cinspect]');await p.waitForTimeout(250);res.Inspect=(await p.$('#combat .inspect'))?'panel shown':'NO PANEL';}
if(await waitTurn()){const t0=await p.evaluate(()=>C.target);await p.click('#combat .actor.e:not(.sel):not(.dead)').catch(()=>{});await p.waitForTimeout(200);res.Target=(await p.evaluate(()=>C.target))!==t0&&(await p.$('#combat .actor.e.sel'))?'switches + highlight':'highlight not updated';}
for(const a of ['defend','quick','heavy','dodge','parry','counter','row']){if(!(await waitTurn()))break;const before=await p.evaluate(()=>C.log.length);await p.click(`#combat [data-a=ca][data-v=${a}]`).catch(()=>{});await p.waitForTimeout(400);res[a]=await p.evaluate(b=>C.log.length>b,before)?'ok':'nothing';}
console.log(res);console.log('ERRORS',errs.length,errs[0]||'');await b.close();})();
