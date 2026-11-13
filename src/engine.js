/* ETERNAL REALMS — core engine: rng, time, items, stats, progression */
'use strict';
const U = {
  r: Math.random,
  ri(a,b){return a+Math.floor(U.r()*(b-a+1));},
  rf(a,b){return a+U.r()*(b-a);},
  pick(a){return a[Math.floor(U.r()*a.length)];},
  chance(p){return U.r()<p;},
  clamp(v,a,b){return v<a?a:v>b?b:v;},
  shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(U.r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},
  wpick(items,wf){let tot=0;const ws=items.map(i=>{const w=Math.max(0,wf(i));tot+=w;return w;});if(tot<=0)return null;let x=U.r()*tot;for(let i=0;i<items.length;i++){x-=ws[i];if(x<=0)return items[i];}return items[items.length-1];},
  uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);},
  fmt(n){n=Math.floor(n);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':n.toLocaleString('en-US');},
  esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));},
  cap(s){return s?s[0].toUpperCase()+s.slice(1):s;},
  sig(x){return 1/(1+Math.exp(-x));},
  seeded(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
};

/* ---------- time ---------- (S.time = game minutes) */
const T = {
  day(t){return Math.floor(t/1440)+1;},
  hour(t){return Math.floor((t%1440)/60);},
  isNight(t){const h=T.hour(t);return h<6||h>=20;},
  str(t){const h=T.hour(t),m=Math.floor(t%60);return `Day ${T.day(t)}, ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;},
  part(t){const h=T.hour(t);return h<5?'deep night':h<8?'dawn':h<12?'morning':h<17?'afternoon':h<20?'evening':'night';}
};

/* ---------- progression ---------- */
const LEVEL_CAP = 100;
function xpNext(l){return Math.floor(40*Math.pow(l,1.75)+60);}
function monXp(l,mon){let x=10+l*l*0.9+l*6;if(mon&&mon.boss)x*=Math.max(3,(mon.hp||1)*0.6);if(mon&&mon.b&&mon.b.includes('elite'))x*=2;return Math.round(x);}
function masteryNeed(lv){return Math.floor(12+lv*lv*0.6+lv*4);}
function masteryTier(lv){for(const [m,n] of MASTERY_TIERS)if(lv>=m)return n;return 'Untrained';}
function mKey(k){const m=MASTERY[k];return m&&m.t==='alias'?m.of:k;}
function mLv(a,k){k=mKey(k);const v=a.mastery&&a.mastery[k];if(v==null)return 0;return typeof v==='number'?v:v.lv;}

/* ---------- items ---------- */
function tierFor(l){let t=TIERS[0];for(const x of TIERS)if(l>=x[0])t=x;return t;}
function isGear(it){return it&&it.b!=null;}
function itemDef(it){return isGear(it)?ITEM_BASES[it.b]:ITEMS[it.k];}
function makeGear(b,l,r,opts){
  l=U.clamp(Math.round(l),1,100);const base=ITEM_BASES[b];if(!base)return null;
  if(r==null){const x=U.r()*100;r=x<0.6?4:x<3.5?3:x<14?2:x<40?1:0;}
  const it={b,l,r,uid:U.uid()};const pool=Object.keys(AFFIXES).filter(k=>{const a=AFFIXES[k];if(a.wOnly&&base.t!=='weapon')return false;if(a.aOnly&&base.t==='weapon')return false;return true;});
  it.a=[];const n=RARITY[r].aff;for(let i=0;i<n;i++)it.a.push(U.pick(pool));
  if(opts&&opts.u){it.u=opts.u;it.a=UNIQUES[opts.u].aff.slice();it.r=4;}
  if(opts&&opts.set&&SETS[opts.set])it.set=opts.set;
  if(opts&&opts.ench)it.ench=opts.ench;
  return it;
}
function makeUnique(u,l){return makeGear(UNIQUES[u].b,l,4,{u});}
function randomGearBase(kind,cls){
  const C=cls&&CLASSES[cls];
  if(kind==='weapon'){if(C&&U.chance(0.8))return U.pick(C.weapons.filter(w=>ITEM_BASES[w]));return U.pick(['sword','axe','mace','spear','dagger','bow','staff','orb','fist','greatsword','greataxe','halberd']);}
  if(kind==='armor'){const ac=C?C.armor:U.pick(['cloth','leather','plate']);const sl=U.pick(['head','chest','legs','hands','feet']);return `${sl}_${ac}`;}
  if(kind==='acc')return U.pick(['ring','amulet']);
  if(kind==='offhand')return U.pick(['shield','tome']);
  return U.pick(Object.keys(ITEM_BASES));
}
function makeSetItem(setId,l,r){const SD=SETS[setId];const pieces=['head','chest','legs','hands','feet'].map(s=>`${s}_${SD.ac}`);return makeGear(U.pick(pieces),l,r!=null?r:(U.chance(0.25)?3:2),{set:setId});}
function randomGear(l,cls,r){const k=U.wpick(['weapon','armor','acc','offhand'],x=>({weapon:3,armor:5,acc:1.2,offhand:0.8})[x]);return makeGear(randomGearBase(k,cls),l,r);}
function itemName(it){
  if(!it)return '';
  if(!isGear(it)){const d=ITEMS[it.k];return d?d.n:it.k;}
  if(it.u)return UNIQUES[it.u].n;
  if(it.set){const b=ITEM_BASES[it.b];let suf='';for(const a of it.a||[]){if(!AFFIXES[a].pre){suf=' '+AFFIXES[a].n;break;}}return `${SETS[it.set].n} ${b.n}${suf}`;}
  const base=ITEM_BASES[it.b],t=tierFor(it.l);let mat;
  if(base.t==='armor')mat=base.ac==='cloth'?t[2]:base.ac==='leather'?t[3]:t[4];else if(base.t==='acc')mat=t[5];else mat=t[1];
  let pre='',suf='';for(const a of it.a||[]){const A=AFFIXES[a];if(A.pre&&!pre)pre=A.n+' ';else if(!A.pre&&!suf)suf=' '+A.n;}
  return `${pre}${mat} ${base.n}${suf}`;
}
function affUnit(l){return 1+Math.floor(l/6);}
function itemStats(it){
  const s={atk:0,matk:0,def:0,mdef:0,crit:0,spd:0,steal:0,gold:0,el:{},res:{}};
  if(!isGear(it))return s;
  const base=ITEM_BASES[it.b],rm=RARITY[it.r].m,sc=6+it.l*2.4,ar=2+it.l*1.1;
  if(base.t==='weapon'){s.atk=sc*(base.a||0)*rm;s.matk=sc*(base.m||0)*rm;}
  if(base.t==='offhand'||base.t==='armor'){s.def=ar*(base.d||0)*rm;s.mdef=ar*(base.md||0)*rm;if(base.m)s.matk=sc*base.m*rm;}
  if(base.t==='acc'){for(const k of ATTRS)s[k]=(s[k]||0);const u=affUnit(it.l);s.luck=(s.luck||0)+Math.round(u*0.5);s.mdef+=ar*0.2*rm;}
  s.crit+=base.crit||0;s.spd+=base.spd||0;
  const u=affUnit(it.l);
  for(const a of it.a||[]){const A=AFFIXES[a];for(const k in A.s){const v=A.s[k];
    if(ATTRS.includes(k))s[k]=(s[k]||0)+Math.round(v*u);
    else if(k==='crit')s.crit+=v*u;else if(k==='mdef')s.mdef+=v*u*2;else if(k==='steal')s.steal+=0.03;else if(k==='gold')s.gold+=0.05;
    else if(k.startsWith('el_'))s.el[k.slice(3)]=(s.el[k.slice(3)]||0)+0.08;
    else if(k.startsWith('res_'))s.res[k.slice(4)]=(s.res[k.slice(4)]||0)+8;}}
  if(it.ench){const A=AFFIXES[it.ench];if(A)for(const k in A.s){const v=A.s[k];if(ATTRS.includes(k))s[k]=(s[k]||0)+Math.round(v*u);else if(k.startsWith('el_'))s.el[k.slice(3)]=(s.el[k.slice(3)]||0)+0.08;else if(k==='crit')s.crit+=v*u;else if(k==='steal')s.steal+=0.03;else if(k==='mdef')s.mdef+=v*u*2;}}
  return s;
}
function itemValue(it){
  if(!it)return 0;
  if(!isGear(it)){const d=ITEMS[it.k];return d?d.v:1;}
  return Math.round((8+it.l*it.l*0.9+it.l*6)*RARITY[it.r].v*(it.u?3:1)*(it.set?1.6:1)*(it.ench?1.3:1));
}
function gearScore(eq){let g=0;for(const sl of EQUIP_SLOTS){const it=eq[sl];if(it)g+=it.l*RARITY[it.r].m;}return Math.round(g);}
function canEquip(a,it){
  const base=ITEM_BASES[it.b];if(!base)return [false,'Not equippable'];
  if(it.l>a.level+5)return [false,`Requires level ${it.l-5}`];
  return [true,''];
}
// proficiency: equipping off-class gear is allowed but less effective (encourages but doesn't force)
function proficiency(a,it){
  const base=ITEM_BASES[it.b],C=CLASSES[a.cls];if(!C)return 1;
  if(base.t==='weapon'){if(C.weapons.includes(base.wt))return 1;const m=mLv(a,base.wt);return m>=20?1:0.8+m*0.01;}
  if(base.t==='armor'){if(base.ac===C.armor)return 1;if(C.armor==='plate')return 1;if(C.armor==='leather'&&base.ac==='cloth')return 1;return base.ac==='plate'?0.85:0.95;}
  return 1;
}
/* inventory: fixed items stack {k,q}; gear objects are individual */
function invAdd(a,k,q=1){
  if(typeof k==='object'){a.inv.push(k);return;}
  if(!ITEMS[k])return;const e=a.inv.find(x=>x.k===k);if(e)e.q+=q;else a.inv.push({k,q});
}
function invCount(a,k){const e=a.inv.find(x=>x.k===k);return e?e.q:0;}
function invRemove(a,k,q=1){const i=a.inv.findIndex(x=>x.k===k);if(i<0||a.inv[i].q<q)return false;a.inv[i].q-=q;if(a.inv[i].q<=0)a.inv.splice(i,1);return true;}

/* ---------- actor stats ---------- */
function calcStats(a){
  const R=RACES[a.race]||RACES.human;const st={};
  for(const k of ATTRS)st[k]=(a.attr[k]||0);
  const eq=a.equip||{};const gs={atk:0,matk:0,def:0,mdef:0,crit:0,spd:0,steal:0,gold:0,el:{},res:{}};
  for(const sl of EQUIP_SLOTS){const it=eq[sl];if(!it)continue;const s=itemStats(it),pf=proficiency(a,it);
    gs.atk+=s.atk*pf;gs.matk+=s.matk*pf;gs.def+=s.def*pf;gs.mdef+=s.mdef*pf;gs.crit+=s.crit;gs.spd+=s.spd;gs.steal+=s.steal;gs.gold+=s.gold;
    for(const k of ATTRS)if(s[k])st[k]+=s[k];for(const e in s.el)gs.el[e]=(gs.el[e]||0)+s.el[e];for(const e in s.res)gs.res[e]=(gs.res[e]||0)+s.res[e];}
  const w=eq.weapon,wb=w?ITEM_BASES[w.b]:null,wt=wb?wb.wt:'fist';
  const L=a.level,d={};
  d.attr=st;
  d.mhp=Math.round((40+st.vit*7+st.end*2+L*18)*(R.hp||1));
  d.mmp=Math.round(20+st.int*4+st.wis*4+L*3);
  d.msp=Math.round(40+st.end*4+st.agi*1.5+L*2);
  const dexW=['bow','dagger'].includes(mKey(wt));
  d.patk=gs.atk+(dexW?st.dex*1.6+st.str*0.4:st.str*1.6+st.dex*0.4);
  if(wt==='fist')d.patk+=st.agi*0.6+L*1.2;
  d.matk=gs.matk+st.int*1.8+st.wis*0.6;
  d.pdef=gs.def+st.vit*0.8+st.end*0.8+L*0.5;
  d.mdef=gs.mdef+st.wis*1.0+st.int*0.4+st.vit*0.3+L*1.5;
  d.acc=85+st.dex*0.6+st.luck*0.2+L*0.4+(R.acc||0);
  d.eva=Math.min(45,4+st.agi*0.45+st.luck*0.15+(R.eva||0));
  d.crit=Math.min(60,4+st.dex*0.2+st.luck*0.35+gs.crit+(a.race==='halfling'?5:0));
  d.critDmg=150+st.str*0.15+st.dex*0.15;
  d.spd=(10+st.agi*0.8+gs.spd)*(R.spd||1);
  d.steal=gs.steal;d.goldFind=gs.gold;d.wt=wt;d.reach=!!(wb&&(wb.reach||wb.ranged));d.ranged=!!(wb&&wb.ranged);
  d.el=gs.el;d.res=Object.assign({},R.res);for(const e in gs.res)d.res[e]=(d.res[e]||0)+gs.res[e];
  // equipment set bonuses
  d.sets={};for(const sl of EQUIP_SLOTS){const it=eq[sl];if(it&&it.set)d.sets[it.set]=(d.sets[it.set]||0)+1;}
  for(const sid in d.sets){const n=d.sets[sid],SD=SETS[sid];for(const B of [n>=2?SD.two:null,n>=4?SD.four:null]){if(!B)continue;for(const k in B){const v=B[k];
    if(k.startsWith('res_'))d.res[k.slice(4)]=(d.res[k.slice(4)]||0)+v;else if(['crit','eva','spd','critDmg'].includes(k))d[k]+=v;else d[k]=d[k]*(1+v);}}}
  d.mhp=Math.round(d.mhp);d.mmp=Math.round(d.mmp);
  // class tuning (balance pass): keeps every class viable solo and in a fight against two foes
  const CM=CLASS_MOD[a.cls];if(CM){if(CM.atk){d.patk*=CM.atk;d.matk*=CM.atk;}if(CM.def){d.pdef*=CM.def;d.mdef*=CM.def;}if(CM.hp)d.mhp=Math.round(d.mhp*CM.hp);}
  // race multipliers
  if(R.patk)d.patk*=R.patk;if(R.matk)d.matk*=R.matk;if(R.pdef)d.pdef*=R.pdef;
  if(a.race==='halfling'&&wb&&wb.two&&!wb.ranged)d.patk*=0.9;
  // advanced class: modest bonus (no runaway power)
  if(a.adv){d.patk*=1.06;d.matk*=1.06;d.mhp=Math.round(d.mhp*1.06);}
  const ctier=classTier(a);if(ctier){const m=[1,1.05,1.1][ctier];d.patk*=m;d.matk*=m;d.mhp=Math.round(d.mhp*m);d.pdef*=1+ctier*0.03;d.mdef*=1+ctier*0.03;}
  // weapon mastery bonus: +0.6%/lvl, crit at 25, penetration at 75
  const wm=mLv(a,wt);d.patk*=1+wm*0.006;if(wm>=25)d.crit+=5;d.pen=wm>=75?0.15:0;
  d.gs=gearScore(eq);
  d.power=Math.round(d.mhp*0.15+Math.max(d.patk,d.matk)*1.2+d.pdef*0.6+d.mdef*0.4+d.spd*0.8+d.crit*2);
  return d;
}
function stats(a){if(!a._st)a._st=calcStats(a);return a._st;}
function dirty(a){a._st=null;}

/* starting attributes */
function baseAttrs(race,bg){const at={};for(const k of ATTRS)at[k]=8+((RACES[race].mods||{})[k]||0)+(((BACKGROUNDS[bg]||{}).attr||{})[k]||0);return at;}
function classGrowth(a){const g=Object.assign({},CLASSES[a.cls].growth);if(a.adv){const A=ADV_CLASSES[a.adv].growth;for(const k in A)g[k]=(g[k]||0)+A[k]*0.5;}return g;}
// free points priority for NPC auto allocation
const CLASS_PRIO = {warrior:['str','vit','end'],knight:['vit','end','str'],swordsman:['dex','str','agi'],archer:['dex','agi','luck'],rogue:['dex','agi','luck'],mage:['int','wis','vit'],
  cleric:['wis','vit','int'],summoner:['int','wis','vit'],paladin:['str','wis','vit'],berserker:['str','vit','agi'],monk:['agi','str','wis'],necromancer:['int','wis','vit'],
  druid:['wis','int','vit'],spearman:['str','end','vit'],merchant:['luck','dex','int']};
Object.assign(CLASS_PRIO,CLASS_PRIO_EXT);

/* ---------- skills available to an actor ---------- */
function skillList(a){
  const out=[];const C=CLASSES[a.cls];
  if(C)for(const s of C.skills){const S=SKILLS[s];if((S.lv||1)<=a.level)out.push(s);}
  if(a.adv)for(const s of ADV_CLASSES[a.adv].skills)out.push(s);
  const ts=TIER_SKILLS[a.cls],ct=classTier(a);if(ts){if(ct>=1)out.push(ts[1]);if(ct>=2)out.push(ts[2]);}
  if(a.race==='draconian')out.push('dragon_breath');
  for(const id in SKILLS){const S=SKILLS[id];if((S.tech||S.spell)&&S.m&&mLv(a,S.m)>=Math.max(1,S.lv)){if(S.tech){const w=a.equip&&a.equip.weapon;const wt=w?mKey(ITEM_BASES[w.b].wt):'fist';if(S.m!=='shield'&&S.m!==wt)continue;if(S.m==='shield'&&!(a.equip&&a.equip.offhand&&a.equip.offhand.b==='shield'))continue;}out.push(id);}}
  return [...new Set(out)];
}

/* ---------- monsters ---------- */
function makeMonster(id,l,opts={}){
  const M=MONSTERS[id];l=U.clamp(Math.round(l),1,120);
  const diff=opts.diff||1;
  // tuned for a real challenge: early zones hit noticeably harder, late zones get a smaller bump
  const ez=Math.max(0,1-l/45)*(M.boss?0.4:1),hc=1.04+0.16*ez,hh=1.15+0.2*ez;
  const m={id,name:M.n,mon:1,level:l,cat:M.cat,boss:!!M.boss,b:M.b||[],e:M.e||null,w:M.w||[],r:M.r||[],st:M.st||null,
    mhp:Math.round((40+l*16)*(M.hp||1)*diff*hh),atk:(10+l*4.5)*(M.at||1)*diff*hc,matk:(10+l*4.5)*(M.md||M.at||1)*0.85*diff*hc,pdef:(3+l*1.5)*(M.df||1),mdef:(3+l*1.5)*(M.md||1),
    acc:85+l*0.8,eva:Math.min(40,(4+l*0.3)*(M.ev||1)),spd:(9+l*0.5)*(M.sp||1),crit:5,critDmg:150,row:(M.b||[]).includes('ranged')||(M.b||[]).includes('caster')?'back':'front'};
  if(M.boss&&!M.world&&!/^trial|^warlord/.test(id)){m.mhp=Math.round(m.mhp*1.9);m.atk*=1.3;m.matk*=1.3;m.pdef*=1.15;}
  m.hp=m.mhp;m.mp=999;m.fx={};m.cd={};m.phase=1;
  return m;
}
function rollLoot(id,l,luck=0,mult=1){
  const M=MONSTERS[id],out={gold:0,items:[]};
  out.gold=Math.round((M.g||0.5)*(2+l*1.5)*U.rf(0.6,1.4)*mult);
  for(const [k,c,q] of M.loot||[])if(U.chance(Math.min(1,c*(1+luck*0.004))))out.items.push({k,q:U.ri(1,q)});
  if(M.gear&&U.chance(Math.min(1,M.gear*(1+luck*0.005)))){const r=M.boss?(U.chance(0.25)?3:U.chance(0.6)?2:1):undefined;out.items.push(randomGear(l+U.ri(-2,2),null,r));}
  if(M.boss&&M.gear>=1)for(let i=1;i<M.gear;i++)out.items.push(randomGear(l,null,U.chance(0.3)?3:2));
  if(M.uniq&&U.chance(M.world?0.35:0.5))out.items.push(makeUnique(M.uniq,l));
  if(M.set&&U.chance(M.world?0.6:0.35))out.items.push(makeSetItem(M.set,l));
  if(typeof evMod==='function'){out.gold=Math.round(out.gold*evMod('gold'));if(evMod('loot')>1&&U.chance(evMod('loot')-1)&&out.items.length)out.items.push(Object.assign({},out.items[0],out.items[0].b?{uid:U.uid()}:{}));}
  if(U.chance(0.12))out.items.push({k:l<15?'hpot1':l<35?'hpot2':l<60?'hpot3':'hpot4',q:1});
  if(U.chance(0.06))out.items.push({k:l<20?'mpot1':l<50?'mpot2':'mpot3',q:1});
  return out;
}
function locMonsterLevel(loc){const L=LOCS[loc];return U.ri(L.lv[0],L.lv[1]);}

/* ---------- graph / travel ---------- */
const GRAPH = {};
for(const k in LOCS)GRAPH[k]={};
for(const [a,b,h] of ROUTES){GRAPH[a][b]=h;GRAPH[b][a]=h;}
function neighbors(loc){return Object.keys(GRAPH[loc]||{});}
function path(a,b,allowHidden){ // dijkstra
  const dist={},prev={},Q=new Set(Object.keys(LOCS));for(const k of Q)dist[k]=Infinity;dist[a]=0;
  while(Q.size){let u=null;for(const k of Q)if(u===null||dist[k]<dist[u])u=k;if(dist[u]===Infinity)break;Q.delete(u);if(u===b)break;
    for(const v in GRAPH[u]){if(!allowHidden&&LOCS[v].hid&&v!==b&&!allowHidden)continue;const alt=dist[u]+GRAPH[u][v];if(alt<dist[v]){dist[v]=alt;prev[v]=u;}}}
  if(dist[b]===Infinity)return null;const p=[b];let c=b;while(prev[c]){c=prev[c];p.unshift(c);}return {path:p,hours:dist[b]};
}
function isTown(loc){const t=LOCS[loc].ty;return t==='city'||t==='town'||t==='village';}
function hasSvc(loc,s){return (LOCS[loc].sv||[]).includes(s);}

/* ---------- names ---------- */
function raceNameGroup(r){return {human:'human',highelf:'elf',woodelf:'elf',darkelf:'elf',halfelf:'elf',dwarf:'dwarf',orc:'orc',beastkin:'beast',draconian:'draco',halfling:'halfling'}[r]||'human';}
function genCharName(race){const f=U.pick(NAME_PARTS.first[raceNameGroup(race)]);return U.chance(0.5)?f:`${f} ${U.pick(NAME_PARTS.last)}`;}
function genUsername(taken){
  for(let i=0;i<50;i++){let n;const x=U.r();const P=NAME_PARTS;
    if(x<0.55)n=U.pick(P.pre)+U.pick(P.suf);
    else if(x<0.7)n=U.pick(P.pre)+U.pick(P.suf)+U.ri(1,99);
    else if(x<0.8)n='xX'+U.pick(P.pre)+U.pick(P.suf)+'Xx';
    else if(x<0.88)n=(U.pick(P.pre)+'_'+U.pick(P.suf)).toLowerCase();
    else if(x<0.94)n=U.pick(P.pre)+U.pick(P.suf)+'_'+['TV','YT','OP','GG','EU','NA'][U.ri(0,5)];
    else n=U.pick(P.suf)+U.pick(P.pre).toLowerCase()+U.ri(0,9);
    if(!taken.has(n.toLowerCase())){taken.add(n.toLowerCase());return n;}}
  return 'Adventurer'+U.ri(1000,9999);
}
