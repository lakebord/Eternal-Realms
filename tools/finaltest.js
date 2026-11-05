// Final battle: phase 1 must end in defeat, the cinematic plays, the hero rises with buffs, phase 2 is winnable.
const {chromium}=require('playwright');const path=require('path');const D=process.env.SHOTS||'.';
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:1100,height:820}});const errs=[];p.on('pageerror',e=>errs.push(e.stack));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(800);
await p.click('[data-a=newchar]');await p.fill('#cc_user','Finale');await p.fill('#cc_name','Finale');await p.click('.ccside .b.gilt');await p.waitForTimeout(800);
await p.evaluate(()=>{audStart();const P=S.P;P.level=95;for(const k in P.attr)P.attr[k]+=60;P.attr.str+=150;P.attr.vit+=120;P.equip.weapon=makeGear('greatsword',95,4);for(const sl of ['head','chest','legs','hands','feet'])P.equip[sl]=makeGear(sl+'_plate',95,3);P.tiers.warrior=2;dirty(P);const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;P.loc='spire';UI.fast=true;invAdd(P,'hpot4',14);startFinalBattle(false);});
const snap=async n=>p.screenshot({path:`${D}/f-${n}.png`});let shots=0,seen={};
for(let t=0;t<1400;t++){const st=await p.evaluate(()=>({ending:!!document.querySelector('#ending .thanks'),endingOn:!!document.getElementById('ending'),cin:!!document.getElementById('cutscene'),phase:C.finalPhase||1,ended:C.ended,res:C.result,mood:AUD.mood,mode:CS.s&&CS.cv?CS.s.mode:'',title:CS.cv&&CS.s.title>0.5?CS.titleText:'',line:CS.cv&&CS.s.line>0.5?CS.lineText:''}));
  if(st.cin&&!seen.cin){seen.cin=1;await p.waitForTimeout(2200);await snap('0-rise');}
  if(st.title==='SUNFALL'&&!seen.sun){seen.sun=1;await snap('0b-sunfall');}
  if(st.mode==='glitch'&&!seen.glitch){seen.glitch=1;await p.waitForTimeout(900);await snap('1-glitch');}
  if(st.mode==='shards'&&!seen.shat){seen.shat=1;await p.waitForTimeout(900);await snap('2-shatter');}
  if(st.line.startsWith('You have died...')&&!seen.dead){seen.dead=1;await snap('3-dead');}
  if(st.line.startsWith('Not while I still')&&!seen.rise){seen.rise=1;await p.waitForTimeout(1500);await snap('4-rise');console.log('music during rise:',st.mood);}
  if(st.mode==='reform'&&!seen.ref){seen.ref=1;await p.waitForTimeout(700);await snap('4b-reform');}
  if(st.title==='UNBROKEN'&&!seen.unb){seen.unb=1;await p.waitForTimeout(500);await snap('4c-unbroken');}
  if(st.phase===2&&!st.cin&&!seen.p2){seen.p2=1;await p.waitForTimeout(400);await snap('5-phase2');console.log('phase 2 buffs:',await p.evaluate(()=>Object.keys(C.allies[0].fx).join(',')),'hp',await p.evaluate(()=>C.allies[0].hp+'/'+C.allies[0].mhp),'mood',st.mood);}
  if(st.ended&&!seen.end){seen.end=1;console.log('sunfall round',await p.evaluate(()=>C.sunRound),'result:',st.res,'phase',st.phase,'| phase1 death happened:',!!seen.dead);await snap('6-end');}
  if(st.endingOn&&!seen.eon){seen.eon=1;await p.waitForTimeout(2500);await snap('7-ending');}
  if(st.ending){await snap('8-thanks');break;}
  const drank=!st.cin&&!st.ended&&await p.evaluate(()=>{const a=C.allies[0];if(!C.waiting||a.hp>a.mhp*0.35)return false;const i=S.P.inv.findIndex(x=>x.k==='hpot4');if(i<0)return false;playerAction('item',i);UI.runCombat();return true;});
  const a=await p.$('#combat [data-a=ca][data-v=attack]');if(a&&!st.cin&&!drank)await a.click().catch(()=>{});await p.waitForTimeout(120);}
console.log('ERRORS',errs.length,errs[0]||'');await b.close();})();
