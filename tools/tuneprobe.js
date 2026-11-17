// Balance probe: how gear tier, level gap, crits, weakness, buffs, skills and DoTs each move the numbers.
const fs=require('fs'),vm=require('vm'),path=require('path');
const files=['data','expansion','classes2','winter','engine','sim','player','combat','chat','chat2','events','net'];
const src=files.map(f=>fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8')).join('\n;\n');
const ctx={performance,console,Math,Date,JSON,Object,Array,String,Number,Set,Map,Promise,setTimeout};vm.createContext(ctx);
vm.runInContext(src+`\n;if(typeof rarityName==='undefined')var rarityName=()=>'';if(typeof E==='undefined')var E=s=>String(s);\n;this.G={newWorld,createPlayer,setP:p=>S.P=p,stats,makeMonster,makeGear,CLASSES,CLASS_PRIO,ITEM_BASES,LOCS,MONSTERS,SKILLS,STATUS,AFFIXES,dirty:p=>p._st=null,actorFromChar,actorFromMon,damage,kConst,skillList,setC:c=>{C=c}};`,ctx);
const G=ctx.G;G.newWorld(7,{sim:1});
function hero(cls,L,o={}){const P=G.createPlayer({user:'B',name:'B',race:'human',cls,bg:'commoner',diff:'normal',start:'brookhollow'});G.setP(P);P.level=L;const C=G.CLASSES[cls];const g=C.growth,pr=G.CLASS_PRIO[cls];
  for(let i=1;i<L;i++){for(const k in g)P.attr[k]+=g[k];if(!o.nopts){P.attr[pr[0]]++;P.attr[pr[1]]++;}}
  P.equip={};if(o.r!=null&&o.r>=0){const gl=Math.max(1,L+(o.gl||0));const aff=o.aff;const mk=(b)=>{const it=G.makeGear(b,gl,o.r);if(aff)it.a=it.a.map((_,i)=>aff[i%aff.length]);return it;};
    P.equip.weapon=mk(C.weapons.find(w=>G.ITEM_BASES[w]));for(const sl of ['head','chest','legs','hands','feet'])P.equip[sl]=mk(`${sl}_${C.armor}`);P.equip.ring=mk('ring');P.equip.amulet=mk('amulet');if(!G.ITEM_BASES[P.equip.weapon.b].two)P.equip.offhand=mk(C.role==='tank'?'shield':'tome');}
  for(const k in C.mastery){P.mastery[k]=P.mastery[k]||{lv:0,xp:0};P.mastery[k].lv=Math.min(100,C.mastery[k]+Math.round(L*0.7));}
  if(L>=20)P.tiers[cls]=L>=50?2:1;G.dirty(P);const st=G.stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;return P;}
G.setC({allies:[],enemies:[]});
const flat=x=>Object.assign({},x,{row:'front',ranged:true,reach:true,fx:Object.assign({},x.fx)});
const avg=(a,d,o,n=400)=>{let s=0;for(let i=0;i<n;i++)s+=G.damage(flat(a),flat(d),Object.assign({ranged:true},o)).d;return s/n;};
const mob=(L,id='wolf')=>G.actorFromMon(G.makeMonster(id,L));
const line=(a,m)=>{const mag=a.matk>a.patk;const hd=avg(a,m,{kind:mag?'mag':'phys'});const md=avg(Object.assign({},m,{patk:m.atk}),a,{kind:'phys'});const hit=Math.min(98,Math.max(5,mag?95-m.eva*0.3:a.acc-m.eva)),mhit=Math.min(98,Math.max(5,m.acc-a.eva));
  return `kill ${(m.mhp/hd/(hit/100)).toFixed(1)}t  die ${(a.mhp/md/(mhit/100)).toFixed(1)}t  dmg ${Math.round(hd)} hp ${a.mhp} crit ${a.crit.toFixed(0)}%x${Math.round(a.critDmg)} hit ${hit.toFixed(0)}% mobhit ${mhit.toFixed(0)}%`;};
const RN=['common','uncommon','rare','epic','legendary'];
console.log('=== A. GEAR TIER (vs same-level wolf; turns to kill / turns to die, counting misses) ===');
for(const cls of ['warrior','mage','rogue'])for(const L of [20,50,80]){console.log(`-- ${cls} L${L}`);
  console.log('  no gear        ',line(G.actorFromChar(hero(cls,L,{r:-1}),'a'),mob(L)));console.log('  no gear,no pts ',line(G.actorFromChar(hero(cls,L,{r:-1,nopts:1}),'a'),mob(L)));
  console.log('  common  L-10   ',line(G.actorFromChar(hero(cls,L,{r:0,gl:-10}),'a'),mob(L)));
  for(let r=0;r<5;r++)console.log('  '+RN[r].padEnd(15),line(G.actorFromChar(hero(cls,L,{r}),'a'),mob(L)));}
console.log('\n=== B. LEVEL GAP (rare gear at hero level) ===');
for(const cls of ['warrior','mage'])for(const L of [20,50]){console.log(`-- ${cls} L${L}`);for(const g of [-10,-5,0,5,10])console.log(`  mob L${L+g}`.padEnd(12),line(G.actorFromChar(hero(cls,L,{r:2}),'a'),mob(L+g)));}
console.log('\n=== C. CRIT & STACKED BUILDS (legendary, all affixes one kind) L60 ===');
for(const [cls,aff] of [['rogue',['keen']],['rogue',['lucky']],['warrior',['mighty']],['warrior',['vampiric','mighty']],['mage',['arcane']],['mage',['embers']],['warrior',['sturdy']]]){const a=G.actorFromChar(hero(cls,60,{r:4,aff}),'a');console.log(`  ${cls} all-${aff.join('+')}`.padEnd(28),line(a,mob(60)),'steal',a.steal,'el',JSON.stringify(a.el));}
console.log('\n=== D. WEAKNESS / RESIST / BUFFS (mage L40 rare, firebolt-like mag hit on same-level mob) ===');
{const a=G.actorFromChar(hero('mage',40,{r:2}),'a');const base=avg(a,mob(40),{kind:'mag',sk:{e:'fire'}});const m=mob(40);
 const t=(n,ao,mo)=>{const A=Object.assign({},a,{fx:ao||{}}),M=Object.assign({},m,mo||{});console.log('  '+n.padEnd(34),(avg(A,M,{kind:'mag',sk:{e:'fire'}})/base).toFixed(2)+'x');};
 t('neutral');t('weak to fire',null,{w:['fire']});t('resists fire',null,{r:['fire']});t('focus buff',{focus:{d:3}});t('focus+might+blessed',{focus:{d:3},might:{d:3},blessed:{d:3}});t('focus+might+blessed+frenzy+resolve',{focus:{d:3},might:{d:3},blessed:{d:3},frenzy:{d:3},resolve:{d:3}});
 t('all buffs vs weak+marked+weaken',{focus:{d:3},might:{d:3},blessed:{d:3},frenzy:{d:3},resolve:{d:3}},{w:['fire'],fx:{marked:{d:3},weaken:{d:3}}});t('target defending',null,{fx:{defend:{d:1}}});t('target defend+fortify+bear+blessed',null,{fx:{defend:{d:1},fortify:{d:1},bear:{d:1},blessed:{d:1}}});}
console.log('\n=== E. SKILLS: strongest damage skills per class at L50 (power x hits, cost, cooldown) vs basic=1.0 ===');
for(const cls of Object.keys(G.CLASSES)){const P=hero(cls,50,{r:2});const sk=G.skillList(P).map(id=>Object.assign({id},G.SKILLS[id])).filter(s=>s.k==='phys'||s.k==='mag').map(s=>({n:s.n,pw:(s.p||1)*(s.hits||1)*(1+(s.crit||0)/200),tg:s.tg,cd:s.cd||0,c:s.c})).sort((a,b)=>b.pw-a.pw).slice(0,3);
  console.log('  '+cls.padEnd(12),sk.map(s=>`${s.n} ${s.pw.toFixed(1)}x${s.tg==='all'?' AoE':''} cd${s.cd} [${s.c}]`).join(' | '));}
console.log('\n=== F. DoT per tick (% of max HP): ',Object.entries(G.STATUS).filter(([k,v])=>v.dot).map(([k,v])=>k+' '+(v.dot*100)+'%').join(', '),' (bosses x0.25)');
