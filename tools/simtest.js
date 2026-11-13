// Headless test: loads game modules, builds a world, runs the simulation, plays combats.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=['data','expansion','classes2','engine','sim','player','combat','chat','chat2','events','net'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8')).join('\n;\n');
const ctx={performance,console,Math,Date,JSON,Object,Array,String,Number,Set,Map,Promise,setTimeout,Blob:undefined,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};
vm.createContext(ctx);vm.runInContext(src+`\n;this.G={fastForward,startEvent,specialStock,factionAccept,FACTION_CHAINS,makeSetItem,getS2:()=>S,CLASSES,CLASS_PRIO,baseAttrs,startCombat,newWorld,createPlayer,processHour,advance,startEncounter,combatStep,playerAction,stats,makeMonster,serialize,ambient,flushChat,CQ,getS:()=>S,getC:()=>C,setP:p=>S.P=p,playerChat,LOCS,winChance,npcGainXp,xpNext,makeGear,itemName,calcStats,enterDungeon,BUS};`,ctx);
const G=ctx.G;let t0=Date.now();const S=G.newWorld(12345);console.log('world gen ms',Date.now()-t0,'npcs',S.npcs.length,'guilds',S.guilds.length);
const P=G.createPlayer({user:'Tester',name:'Test',race:'human',cls:process.argv[2]||'warrior',bg:'soldier',gender:'f',age:20,diff:'normal'});G.setP(P);
t0=Date.now();for(let i=0;i<72;i++)G.advance(60);console.log('72h sim ms',Date.now()-t0);
const lv=S.npcs.map(n=>n.level);console.log('avg lvl',(lv.reduce((a,b)=>a+b)/lv.length).toFixed(1),'max',Math.max(...lv),'news',S.news.slice(0,8).map(n=>n[1]));
console.log('market',S.market.length,'boss',S.boss&&S.boss.id,'wars',S.wars.length,'retired',S.npcs.filter(n=>n.retired).length);
const ifang=S.npcs.find(n=>n.user==='IronFang');console.log('IronFang',ifang.level,ifang.loc,ifang.act,ifang.hist.slice(0,5));
const ser=G.serialize();console.log('save size KB',(ser.length/1024).toFixed(0));
// combat balance: simulate player auto-attacking same-level monsters
function fight(level,monId,n=1){P.level=level;P.attr=Object.assign({},P.attr);P.equip={};const C_=G.CLASSES[P.cls];P.equip.weapon=G.makeGear(C_.weapons[0]==='greatsword'?'sword':C_.weapons[0],level,1);
  for(const sl of ['head','chest','legs','hands','feet'])P.equip[sl]=G.makeGear(sl+'_'+C_.armor,level,1);
  const base={...P.attr};for(const k in base)P.attr[k]=base[k];
  P._st=null;const st=G.stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;
  G.startCombat(Array.from({length:n},()=>G.makeMonster(monId,level)),{type:'pve'});let turns=0,C;
  while(true){const r=G.combatStep();C=G.getC();if(r==='end')break;if(r==='wait'){G.playerAction('attack');turns++;}if(turns>200)break;}
  return {res:C.result,turns,hpLeft:Math.round(P.hp/st.mhp*100)};}
// grow attributes as if leveled
function grow(level){const a=G.baseAttrs('human','soldier');const g=G.CLASSES[P.cls].growth;const pr=G.CLASS_PRIO[P.cls];for(let i=1;i<level;i++){for(const k in g)a[k]+=g[k];a[pr[0]]++;a[pr[1]]++;}P.attr=a;}
for(const [L,m,n] of [[1,'goblin',1],[1,'wolf',2],[10,'bandit',1],[10,'bandit',2],[20,'frost_wolf',2],[40,'drowned',1],[40,'drowned',2],[60,'wraith',1],[60,'orc_raider',2],[80,'sentinel',1],[80,'voidspawn',1]]){
  let w=0,tt=0,hp=0;for(let i=0;i<20;i++){grow(L);const r=fight(L,m,n);if(r.res==='win')w++;tt+=r.turns;hp+=r.hpLeft;}console.log(`L${L} vs ${n}x ${m}: win ${w}/20 avgTurns ${(tt/20).toFixed(1)} avgHp% ${(hp/20).toFixed(0)}`);}
// chat
G.ambient();G.ambient();G.playerChat('global','Anyone want to help me clear the abandoned mine?');console.log('CQ',G.CQ.length,G.CQ.slice(0,5).map(q=>q.text));
const acts={};for(const n of S.npcs)acts[n.act]=(acts[n.act]||0)+1;console.log('acts',acts);
const hs=S.npcs.reduce((s,n)=>s+n.hist.length,0);console.log('hist entries',hs,'kills sample',S.npcs.slice(20,25).map(n=>[n.user,n.level,n.xp,n.act,n.loc]));
(async()=>{
  // events & invasions
  for(const k of ['bloodmoon','invasion','treasure','fair']){const ev=G.startEvent(k);console.log('event',k,!!ev,ev&&ev.loc);}
  for(let i=0;i<20;i++)G.advance(60);console.log('events after 20h',(S.events||[]).map(e=>e.kind),S.news.slice(0,4).map(n=>n[1]));
  // fast-forward 5 real hours -> 300 game hours
  const t=Date.now();const h=await G.fastForward(Date.now()-5*3600e3,Date.now());console.log('ff hours',h,'ms',Date.now()-t,'day',Math.floor(S.time/1440)+1,'digest news',S.digest.news.length);
  // set items + specialty stock
  const it=G.makeSetItem('lionguard',30);console.log('set item',ctx.itemName?'':'',it.set,it.b);
  P.loc='valeria';const st=G.specialStock('valeria');console.log('special stock',st.items.length,!!st.featured);
  const lv=S.npcs.map(n=>n.level);console.log('avg lvl after ff',(lv.reduce((a,b)=>a+b)/lv.length).toFixed(1),'retired',S.npcs.filter(n=>n.retired).length,'guilds',S.guilds.length);
})();
