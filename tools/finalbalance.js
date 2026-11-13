// Final boss balance: smart-AI hero (same AI party members use), level 95, every class. Reports phase-1 length,
// boss HP carried into phase 2, and phase-2 win rate / rounds / HP left.
const fs=require('fs'),vm=require('vm'),path=require('path');
const files=['data','expansion','classes2','engine','sim','player','combat','chat','chat2','events','net'];
const src=files.map(f=>fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8')).join('\n;\n');
const ctx={performance,console,Math,Date,JSON,Object,Array,String,Number,Set,Map,Promise,setTimeout};vm.createContext(ctx);
vm.runInContext(src+`\n;if(typeof rarityName==='undefined')var rarityName=()=>'';if(typeof E==='undefined')var E=s=>String(s);this.G={newWorld,createPlayer,setP:p=>S.P=p,stats,makeGear,CLASSES,CLASS_PRIO,combatStep,allyAI,endTurn,getC:()=>C,dirty,ITEM_BASES,checkEnd,startFinalBattle,finalRebirth,invAdd,compActor,SPECIES};`,ctx);
const G=ctx.G;G.newWorld(7);
function hero(cls,L,pots){const P=G.createPlayer({user:'B',name:'B',race:'human',cls,bg:'commoner',diff:'normal',start:'brookhollow'});G.setP(P);
  P.level=L;const C=G.CLASSES[cls];const g=C.growth,pr=G.CLASS_PRIO[cls];for(let i=1;i<L;i++){for(const k in g)P.attr[k]+=g[k];P.attr[pr[0]]++;P.attr[pr[1]]++;}
  P.equip={weapon:G.makeGear(C.weapons.find(w=>G.ITEM_BASES[w]),L,3)};for(const sl of ['head','chest','legs','hands','feet'])P.equip[sl]=G.makeGear(`${sl}_${C.armor}`,L,3);
  if(!G.ITEM_BASES[P.equip.weapon.b].two)P.equip.offhand=G.makeGear(['tank'].includes(C.role)?'shield':'tome',L,3);
  for(const k in C.mastery){P.mastery[k]=P.mastery[k]||{lv:0,xp:0};P.mastery[k].lv=Math.min(100,C.mastery[k]+70);}
  P.tiers[cls]=2;for(const c of P.comps){c.level=L;while(G.SPECIES[c.sp].evo&&L>=G.SPECIES[c.sp].evo[0])c.sp=G.SPECIES[c.sp].evo[1];}G.dirty(P);const st=G.stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;return P;}
function run(cls,pots=+process.env.POTS||0){const P=hero(cls,95);G.startFinalBattle(false);let C=G.getC();const summon=()=>{if(P.comps.length&&!C.allies.some(x=>x.ref===P.comps[0].id&&x.hp>0))C.allies.push(G.compActor(P.comps[0]));};summon();
  const loop=(stop)=>{let g=0;while(g++<4000){if(stop())break;const r=G.combatStep();C=G.getC();if(r==='end'||stop())break;
    if(r==='wait'){const a=C.order[C.oi];C.waiting=false;const cost=15+Math.round(95*0.5);if(a.isPlayer&&pots>0&&a.hp<a.mhp*0.35){pots--;a.hp=Math.min(a.mhp,a.hp+1600);}else if(a.isPlayer&&P.comps.length&&a.mp>=cost&&!C.allies.some(x=>x.ref===P.comps[0].id&&x.hp>0)){a.mp-=cost;C.allies=C.allies.filter(x=>x.ref!==P.comps[0].id);summon();}else G.allyAI(a);G.endTurn(a);C.oi++;G.checkEnd();}}};
  loop(()=>C.cinema||C.ended);const b=C.enemies.find(e=>e.finalBoss);const r1=C.round;
  if(!C.cinema)return {p1:false,r1,boss:b.hp/b.mhp};
  G.finalRebirth();summon();loop(()=>C.ended);
  return {p1:true,r1,win:C.result==='win',r2:C.round-r1,hp:C.allies[0].hp/C.allies[0].mhp,boss:Math.max(0,b.hp)/b.mhp,potsLeft:pots};}
const N=+process.argv[2]||4;const classes=(process.argv[3]||Object.keys(G.CLASSES).filter(c=>!G.CLASSES[c].from).join(',')).split(',');
let tw=0,tp=0,tn=0;console.log('class'.padEnd(12),'p1win%','p1rnds','p2win%','p2rnds','hpLeft%','bossLeft%(losses)');
for(const c of classes){let p1=0,w=0,r1=0,r2=0,hp=0,bl=0,nl=0;for(let i=0;i<N;i++){const r=run(c);r1+=r.r1;if(r.p1){p1++;r2+=r.r2;if(r.win){w++;hp+=r.hp;}else{bl+=r.boss;nl++;}}else{bl+=r.boss;nl++;}}
  tw+=w;tp+=p1;tn+=N;console.log(c.padEnd(12),String(Math.round(p1/N*100)).padStart(6),String(Math.round(r1/N)).padStart(6),String(p1?Math.round(w/p1*100):'-').padStart(6),String(p1?Math.round(r2/p1):'-').padStart(6),String(w?Math.round(hp/w*100):'-').padStart(7),String(nl?Math.round(bl/nl*100):'-').padStart(9));}
console.log('reached phase 2',Math.round(tp/tn*100)+'%','| overall win',Math.round(tw/tn*100)+'%');
