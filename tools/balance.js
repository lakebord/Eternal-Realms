// Balance harness: every class, smart AI (uses skills/heals like a player would), level-appropriate gear,
// vs. standard zone encounters at several levels. Prints win rate, turns, HP left.
const fs=require('fs'),vm=require('vm'),path=require('path');
const files=['data','expansion','classes2','engine','sim','player','combat','chat','chat2','events','net'];
const src=files.map(f=>fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8')).join('\n;\n');
const ctx={performance,console,Math,Date,JSON,Object,Array,String,Number,Set,Map,Promise,setTimeout};vm.createContext(ctx);
vm.runInContext(src+`\n;if(typeof rarityName==='undefined')var rarityName=()=>'';if(typeof E==='undefined')var E=s=>String(s);\n;this.G={compActor,newWorld,createPlayer,setP:p=>S.P=p,getS:()=>S,stats,makeMonster,makeGear,baseAttrs,CLASSES,CLASS_PRIO,classGrowth,startCombat,combatStep,allyAI,endTurn,getC:()=>C,dirty,LOCS,ITEM_BASES,isTown,checkEnd,monXp,xpNext};`,ctx);
const G=ctx.G;G.newWorld(7);
const ZONES={1:'greenmarch',5:'whisperwood',10:'watchtower',20:'frostpeak',30:'mire',45:'citadel',60:'necropolis',80:'spire'};
function hero(cls,L){const P=G.createPlayer({user:'B',name:'B',race:'human',cls,bg:'commoner',diff:'normal',start:'brookhollow'});G.setP(P);
  P.level=L;const C=G.CLASSES[cls];const g=C.growth,pr=G.CLASS_PRIO[cls];for(let i=1;i<L;i++){for(const k in g)P.attr[k]+=g[k];P.attr[pr[0]]++;P.attr[pr[1]]++;}
  const r=L<10?1:L<30?1:2;P.equip={weapon:G.makeGear(C.weapons.find(w=>G.ITEM_BASES[w]),Math.max(1,L-1),r)};
  for(const sl of ['head','chest','legs','hands','feet'])P.equip[sl]=G.makeGear(`${sl}_${C.armor}`,Math.max(1,L-1),r);
  if(!G.ITEM_BASES[P.equip.weapon.b].two)P.equip.offhand=G.makeGear(['tank'].includes(C.role)?'shield':'tome',Math.max(1,L-1),r);
  for(const k in C.mastery){const kk=k;P.mastery[kk]=P.mastery[kk]||{lv:0,xp:0};P.mastery[kk].lv=Math.min(100,C.mastery[k]+Math.round(L*0.7));}
  if(L>=20)P.tiers[cls]=L>=50?2:1;G.dirty(P);const st=G.stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;return P;}
function fight(cls,L,pack){const P=hero(cls,L);const z=G.LOCS[ZONES[L]];const lv=Math.min(Math.max(L,z.lv[0]),z.lv[1]);
  const en=[];for(let i=0;i<pack;i++)en.push(G.makeMonster(z.mon[i%z.mon.length],lv));G.startCombat(en,{type:'pve',noParty:true});let C=G.getC();if(P.comps.length){C.allies.push(G.compActor(Object.assign(P.comps[0],{level:L})));}
  // player acts via the same smart AI party members use
  let guard=0;while(guard++<400){const r=G.combatStep();C=G.getC();if(r==='end')break;if(r==='wait'){const a=C.order[C.oi];C.waiting=false;G.allyAI(a);G.endTurn(a);C.oi++;if(G.checkEnd())break;}}
  return {win:C.result==='win',turns:C.round,hp:C.allies[0].hp/C.allies[0].mhp};}
const classes=Object.keys(G.CLASSES);const levels=(process.argv[2]||'1,5,10,20,30,45,60,80').split(',').map(Number);const N=+process.argv[3]||12;
const out={};for(const pack of [1,2]){console.log(`\n=== pack of ${pack} (win% / avg HP left) ===`);console.log('class'.padEnd(12)+levels.map(l=>('L'+l).padStart(10)).join(''));
  for(const c of classes){let row=c.padEnd(12);for(const L of levels){let w=0,hp=0;for(let i=0;i<N;i++){const r=fight(c,L,pack);if(r.win){w++;hp+=r.hp;}}row+=(`${Math.round(w/N*100)}/${w?Math.round(hp/w*100):0}`).padStart(10);(out[c]=out[c]||[]).push(w/N);}console.log(row);}}
console.log('\nkills per level (same-level mob):',[5,20,50,90].map(l=>`L${l}:${Math.round(G.xpNext(l)/G.monXp(l))}`).join(' '));

// dungeon boss with a party of three (you + simulated tank + healer), all at the dungeon's top level
function bossFight(cls,loc,solo){const D=G.LOCS[loc];const L=D.lv[1];const P=hero(cls,L);const S=G.getS();
  const tank=S.npcs.find(n=>G.CLASSES[n.cls].role==='tank'),heal=S.npcs.find(n=>G.CLASSES[n.cls].role==='healer');
  for(const n of [tank,heal]){n.level=L;n.attr=G.baseAttrs(n.race,'commoner');const g=G.CLASSES[n.cls].growth,pr=G.CLASS_PRIO[n.cls];for(let i=1;i<L;i++){for(const k in g)n.attr[k]+=g[k];n.attr[pr[0]]++;n.attr[pr[1]]++;}
    n.equip={weapon:G.makeGear(G.CLASSES[n.cls].weapons.find(w=>G.ITEM_BASES[w]),L-1,1)};for(const sl of ['head','chest','legs','hands','feet'])n.equip[sl]=G.makeGear(`${sl}_${G.CLASSES[n.cls].armor}`,L-1,1);n.hpPct=1;G.dirty(n);}
  P.party=solo?[]:[tank.id,heal.id];tank.inParty=heal.inParty=!solo;
  G.startCombat([G.makeMonster(D.boss,L+2)],{type:'pve'});let C=G.getC();if(P.comps.length)C.allies.push(G.compActor(Object.assign(P.comps[0],{level:L})));
  let guard=0;while(guard++<600){const r=G.combatStep();C=G.getC();if(r==='end')break;if(r==='wait'){const a=C.order[C.oi];C.waiting=false;G.allyAI(a);G.endTurn(a);C.oi++;if(G.checkEnd())break;}}
  P.party=[];tank.inParty=heal.inParty=false;return C.result==='win';}
console.log('\n=== dungeon boss, party of 3 (win%) ===');const dg=['mine','warrens','grimward','crystalcaves','undervault','webdepths','citadel','tomb','necropolis','spire'];
console.log('class'.padEnd(12)+dg.map(d=>d.slice(0,9).padStart(10)).join(''));
for(const c of ['warrior','mage','rogue','cleric','bard','summoner','ranger']){let row=c.padEnd(12);for(const d of dg){let w=0;for(let i=0;i<6;i++)if(bossFight(c,d))w++;row+=(Math.round(w/6*100)+'%').padStart(10);}console.log(row);}
console.log('\n=== dungeon boss SOLO (win%) ===');
for(const c of ['warrior','mage','rogue','cleric','bard','summoner','ranger']){let row=c.padEnd(12);for(const d of dg){let w=0;for(let i=0;i<6;i++)if(bossFight(c,d,true))w++;row+=(Math.round(w/6*100)+'%').padStart(10);}console.log(row);}
