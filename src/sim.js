/* ETERNAL REALMS — world simulation: autonomous adventurers, guilds, economy, politics, events */
'use strict';
let S = null; // world state
const GAME_MIN_PER_SEC = 1; // 1 real second = 1 game minute
const BUS = {fns:[],on(f){this.fns.push(f);},emit(type,d){for(const f of this.fns){try{f(type,d);}catch(e){console.error(e);}}}};

const NPC_XP_RATE=0.3; // simulated adventurers level at a human-like pace so the ladder stays meaningful in a world that never stops
function relKey(a,b){return a<b?`${a}-${b}`:`${b}-${a}`;}
function rel(a,b){if(a===b)return 100;return S.rel[relKey(a,b)]||0;}
function setRel(a,b,v){S.rel[relKey(a,b)]=U.clamp(Math.round(v),-100,100);}
function npc(id){return S.byId[id];}
function actorName(id){if(id==='P')return S.P.user;const n=npc(id);return n?n.user:'?';}
function news(txt,kind='world'){S.news.unshift([S.time,txt,kind]);if(S.news.length>80)S.news.length=80;}
function hist(n,txt){n.hist.unshift([S.time,txt]);if(n.hist.length>14)n.hist.length=14;}
function guild(id){return S.guilds.find(g=>g.id===id);}
function traitsLabel(n){const t=n.tr;const L=[];const m={friendly:t.kind>0.65&&t.social>0.5,competitive:t.compet>0.65,arrogant:t.arrog>0.7,cautious:t.caution>0.65,helpful:t.kind>0.75,greedy:t.greed>0.7,
  shy:t.social<0.25,talkative:t.talk>0.75,strategic:t.caution>0.5&&t.ambit>0.6,aggressive:t.brave>0.75&&t.caution<0.35,adventurous:t.brave>0.6&&t.explore>0.6,ambitious:t.ambit>0.75,lazy:t.lazy>0.7,loyal:t.loyal>0.75,independent:t.social<0.4&&t.loyal<0.4,funny:t.humor>0.75};
  for(const k in m)if(m[k])L.push(k);return L.slice(0,4).length?L.slice(0,4):['easygoing'];}

/* ---------------- WORLD CREATION ---------------- */
function newWorld(seed){
  const rng=U.seeded(seed||20261104);const saved=U.r;U.r=rng;
  S={v:3,seed:seed||20261104,time:8*60,real:Date.now(),npcs:[],byId:{},guilds:[],rel:Object.assign({},INIT_RELATIONS),wars:[],control:{},econ:{},market:[],boss:null,nextBoss:30*60,
    tourney:{next:7*1440+18*60,state:'idle',entrants:[],reg:false,round:0,matches:[],log:[]},news:[],chat:{global:[],local:[],trade:[],guild:[],party:[],recruit:[],system:[],pm:{}},
    quests:{},rumors:[],flags:{},kd:{},hall:[],idn:0,lastDay:1,P:null,pmUnread:{}};
  for(const k of KINGDOMS)S.kd[k]={army:U.ri(80,120),treasury:U.ri(5000,20000),weary:0};
  for(const l in LOCS)if(LOCS[l].f)S.control[l]=LOCS[l].f;
  for(const l in LOCS)if(hasSvc(l,'market')||hasSvc(l,'shop')){S.econ[l]={};for(const c of ['weapon','armor','con','mat','food'])S.econ[l][c]={s:50,d:50};}
  const taken=new Set(['p']);
  // famous adventurers
  const FAMOUS=[['DragonSlayer','human','warrior','dragonknight',97],['VoidKnight','darkelf','knight','deathknight',95],['LunaMist','highelf','mage','archmage',93],
    ['CrimsonQueen','human','paladin','grandpaladin',90],['ShadowWolf','beastkin','rogue','shadowassassin',86],['SilverFox','woodelf','archer','arcanearcher',83],
    ['AetherMage','halfelf','summoner','grandsummoner',81],['DarkReaper','orc','swordsman','swordmaster',79],['NightHunter','halfling','rogue',null,77],['StormHeart','dwarf','spearman','runicknight',74],
    ['MerchantX','halfling','merchant',null,40],['IronFang','orc','berserker',null,12],['LunaPaw','beastkin','druid',null,9],['xXBladeXx','human','swordsman',null,6],['Mossbeard','dwarf','cleric',null,16]];
  for(const f of FAMOUS){taken.add(f[0].toLowerCase());S.npcs.push(genNpc({user:f[0],race:f[1],cls:f[2],adv:f[3],level:f[4],famous:1}));}
  while(S.npcs.length<500){const x=U.r();const L=x<0.6?U.ri(1,25):x<0.85?U.ri(25,55):x<0.97?U.ri(55,85):U.ri(85,94);S.npcs.push(genNpc({user:genUsername(taken),level:L}));}
  reindex();
  genGuilds();
  for(const n of S.npcs){ // initial social graph
    for(let i=0;i<U.ri(0,3);i++){const o=U.pick(S.npcs);if(o!==n&&!n.friends.includes(o.id)){n.friends.push(o.id);o.friends.push(n.id);}}
    if(n.tr.compet>0.6&&U.chance(0.4)){const o=U.pick(S.npcs.filter(o=>Math.abs(o.level-n.level)<8&&o!==n));if(o){n.rivals.push(o.id);if(U.chance(0.5))o.rivals.push(n.id);}}
  }
  S.npcs.find(n=>n.user==='IronFang').goal={type:'level',target:15};
  for(const l in LOCS)if(hasSvc(l,'board'))S.quests[l]=genQuests(l);
  for(let i=0;i<30;i++)npcListLoot(U.pick(S.npcs),true);
  U.r=saved;
  news('The Realms awaken. Adventurers gather in Valeria\'s Plaza.','world');
  return S;
}
function newNpcId(){return 'n'+(S.idn++);}
function genNpc(o){
  const race=o.race||U.wpick(Object.keys(RACES),r=>({human:4,highelf:1.5,woodelf:1.5,darkelf:1,dwarf:1.6,orc:1.6,beastkin:1.4,halfelf:1.2,draconian:0.6,halfling:1.2})[r]);
  const cls=o.cls||U.pick(Object.keys(CLASSES));
  const L=o.level||1;
  const bg=U.pick(Object.keys(BACKGROUNDS));
  const n={id:newNpcId(),user:o.user,name:genCharName(race),race,cls,adv:o.adv||null,level:L,xp:Math.floor(xpNext(L)*U.r()*0.8),attr:baseAttrs(race,bg),bg,
    gold:Math.round(20+Math.pow(L,1.7)*5*U.rf(0.4,1.8)),equip:{},inv:[],mastery:{},
    tr:{brave:U.r(),greed:U.r(),social:U.r(),compet:U.r(),kind:U.r(),arrog:U.r(),caution:U.r(),ambit:U.r(),lazy:U.r()*0.8,loyal:U.r(),talk:U.r(),humor:U.r(),explore:U.r()},
    goal:null,loc:null,path:[],busy:0,act:'idle',guild:null,grank:null,friends:[],rivals:[],fame:0,mem:{},hist:[],ach:[],
    pvp:{r:1000+U.ri(-60,60),w:0,l:0},dung:0,boss:0,kills:0,deaths:0,conf:0.5,hpPct:1,retired:false,famous:!!o.famous,
    prof:U.pick(['mining','herbalism','smithing','alchemy','cooking','enchanting','fishing','trading']),knows:[],
    sched:{start:U.ri(0,23),len:U.chance(0.12)?U.ri(16,22):U.ri(4,12)},quiet:0,listed:0,crafted:0,bestDrop:null,created:S.time};
  if(cls==='merchant')n.prof='trading';
  // attributes: class growth + free points
  const g=CLASSES[cls].growth,prio=CLASS_PRIO[cls];
  for(let i=1;i<L;i++){for(const k in g)n.attr[k]+=g[k];for(let p=0;p<2;p++){const x=U.r();n.attr[x<0.55?prio[0]:x<0.8?prio[1]:x<0.92?prio[2]:U.pick(ATTRS)]++;}}
  if(n.adv){const A=ADV_CLASSES[n.adv].growth;for(const k in A)n.attr[k]+=Math.round(A[k]*Math.max(0,L-ADV_CLASSES[n.adv].lvl)*0.5);}
  // masteries
  for(const k in CLASSES[cls].mastery)n.mastery[mKey(k)]=Math.min(100,Math.round(CLASSES[cls].mastery[k]+L*U.rf(0.6,1.0)));
  if(n.adv){const A=ADV_CLASSES[n.adv];for(const k in A.req||{})n.mastery[k]=Math.max(n.mastery[k]||0,A.req[k]+U.ri(0,15));}
  n.mastery[n.prof]=U.ri(1,Math.min(100,L+10));
  // gear
  equipNpcFull(n,L);
  // location: home or level-appropriate area
  const home=RACES[race].home;n.home=home;
  n.loc=L<5?home:(U.chance(0.5)?bestHuntLoc(n)||home:U.pick(Object.keys(LOCS).filter(l=>isTown(l)&&!LOCS[l].hid)));
  n.knows=[home,...neighbors(home)];for(const l in LOCS)if(!LOCS[l].hid&&LOCS[l].lv[0]<=L+5&&U.chance(0.55))n.knows.push(l);n.knows=[...new Set(n.knows)];
  if(L>=60&&U.chance(0.5))n.knows.push(U.pick(['hollow','skyreach','cove']));
  n.goal=pickGoal(n);
  n.fame=Math.round(Math.pow(L,1.6)*U.rf(0.5,1.5)+(o.famous?2000:0));n.kills=Math.round(L*L*U.rf(2,5));n.dung=Math.round(L*U.rf(0.2,1.2));n.boss=Math.round(L*U.rf(0.05,0.3));
  n.pvp.r=Math.round(1000+L*5*U.rf(0.3,1.6)*(0.5+n.tr.compet));n.pvp.w=Math.round(L*n.tr.compet*U.rf(0.5,3));n.pvp.l=Math.round(L*U.rf(0.3,2));
  if(L>20&&U.chance(0.3))hist(n,`Cleared ${LOCS[U.pick(['mine','grimward','undervault','aethermoor'])].n}`);
  hist(n,`Started adventuring in ${LOCS[home].n}`);
  if(L>=50)n.ach.push('lv50');if(L>=25)n.ach.push('lv25');if(L>=10)n.ach.push('lv10');if(n.adv)n.ach.push('advclass');
  if(n.adv==='dragonknight')n.flags={slew_dragon:1};
  n.conf=U.clamp(0.3+L/150+n.tr.brave*0.3,0,1);
  return n;
}
function equipNpcFull(n,L){
  const C=CLASSES[n.cls];const rr=()=>{const x=U.r();const bonus=L/200;return x<0.02+bonus*0.3?3:x<0.12+bonus?2:x<0.45+bonus?1:0;};
  const lv=()=>U.clamp(L+U.ri(-4,1),1,100);
  n.equip.weapon=makeGear(U.pick(C.weapons.filter(w=>ITEM_BASES[w])),lv(),rr());
  for(const sl of ['head','chest','legs','hands','feet'])if(U.chance(0.55+L/200))n.equip[sl]=makeGear(`${sl}_${C.armor}`,lv(),rr());
  if(!ITEM_BASES[n.equip.weapon.b].two&&U.chance(0.6))n.equip.offhand=makeGear(['knight','paladin','warrior','spearman'].includes(n.cls)?'shield':(['mage','cleric','summoner','necromancer','druid'].includes(n.cls)?'tome':'shield'),lv(),rr());
  if(U.chance(0.3+L/150))n.equip.ring=makeGear('ring',lv(),rr());if(U.chance(0.25+L/150))n.equip.amulet=makeGear('amulet',lv(),rr());
  if(n.famous&&L>70){const u={DragonSlayer:'fireblade',LunaMist:'eternal_orb',SilverFox:'starbow',VoidKnight:'frostmourn',ShadowWolf:'hydrafang'}[n.user];if(u){const it=makeUnique(u,L);const sl=ITEM_BASES[it.b].sl;n.equip[sl]=it;}}
  dirty(n);
}
function reindex(){S.byId={};for(const n of S.npcs)S.byId[n.id]=n;S.byLoc={};for(const n of S.npcs){if(n.retired)continue;(S.byLoc[n.loc]=S.byLoc[n.loc]||[]).push(n);}}
function genGuilds(){
  const pool=S.npcs.filter(n=>n.level>=30).sort((a,b)=>b.level-a.level);
  const fixedLeaders={'Crimson Legion':'CrimsonQueen','Order of the Void':'VoidKnight','Moonlit Court':'LunaMist','Dragonsbane':'DragonSlayer','Night Ravens':'ShadowWolf','The Gilded Purse':'MerchantX'};
  GUILD_NAMES.forEach(([name,tag],i)=>{
    let leader=fixedLeaders[name]?S.npcs.find(n=>n.user===fixedLeaders[name]):null;
    if(!leader)leader=pool.find(n=>!n.guild&&n.level>=30);if(!leader)return;
    const g={id:'g'+i,name,tag,leader:leader.id,officers:[],members:[leader.id],lvl:1,xp:0,treasury:U.ri(500,20000),hq:U.pick(['valeria','crossroads','saltmere','khazgard','lothirien','bloodrock','duskhaven','ironford']),
      rep:0,allies:[],rivals:[],goal:U.pick(['raid','pvp','wealth','explore','social']),req:Math.max(1,Math.round(leader.level*U.rf(0.15,0.6))),morale:0.7,created:-U.ri(10,400),isPlayer:false,
      motto:U.pick(['Glory or nothing.','Together we rise.','Profit is power.','No one left behind.','Fear the night.','We hunt.','Cozy vibes only.','Strength and honor.','Light the way.'])};
    if(name==='Cozy Tavern Club')g.req=1;if(name==='Crimson Legion')g.req=40;
    leader.guild=g.id;leader.grank='Leader';S.guilds.push(g);
  });
  for(const n of S.npcs){if(n.guild||!U.chance(0.55))continue;const opts=S.guilds.filter(g=>g.req<=n.level&&g.members.length<60);if(!opts.length)continue;
    const g=U.wpick(opts,g=>1+ (g.goal==='pvp'?n.tr.compet:0)+(g.goal==='wealth'?n.tr.greed:0)+(g.goal==='raid'?n.tr.brave:0)+(g.goal==='social'?n.tr.social:0));joinGuild(n,g,true);}
  for(const g of S.guilds){const ms=g.members.map(npc).filter(m=>m.id!==g.leader).sort((a,b)=>b.level-a.level);g.officers=ms.slice(0,Math.min(3,Math.ceil(ms.length/8))).map(m=>m.id);for(const o of g.officers)npc(o).grank='Officer';
    g.xp=g.members.length*U.ri(200,800);g.lvl=guildLevel(g.xp);g.rep=Math.round(guildPower(g)/10);}
  for(let i=0;i<8;i++){const a=U.pick(S.guilds),b=U.pick(S.guilds);if(a!==b&&!a.rivals.includes(b.id)){a.rivals.push(b.id);b.rivals.push(a.id);}}
  for(let i=0;i<5;i++){const a=U.pick(S.guilds),b=U.pick(S.guilds);if(a!==b&&!a.rivals.includes(b.id)&&!a.allies.includes(b.id)){a.allies.push(b.id);b.allies.push(a.id);}}
}
function guildLevel(xp){return Math.min(30,1+Math.floor(Math.sqrt(xp/400)));}
function guildPower(g){let p=0;for(const id of g.members){const m=id==='P'?S.P:npc(id);if(m&&!m.retired)p+=stats(m).power;}return Math.round(p);}
function joinGuild(n,g,silent){if(n.guild)leaveGuild(n,true);n.guild=g.id;n.grank='Member';if(!g.members.includes(n.id))g.members.push(n.id);if(!silent){hist(n,`Joined ${g.name}`);BUS.emit('guild_join',{n,g});}}
function leaveGuild(n,silent){const g=guild(n.guild);if(!g)return;g.members=g.members.filter(x=>x!==n.id);g.officers=g.officers.filter(x=>x!==n.id);n.guild=null;n.grank=null;
  if(!silent){hist(n,`Left ${g.name}`);BUS.emit('guild_leave',{n,g});}
  if(g.leader===n.id){const next=g.officers[0]||g.members.find(x=>x!=='P');if(next&&next!=='P'){g.leader=next;npc(next).grank='Leader';g.officers=g.officers.filter(x=>x!==next);news(`${actorName(next)} is now the leader of ${g.name}.`,'guild');}
    else if(!g.members.length){S.guilds=S.guilds.filter(x=>x!==g);news(`${g.name} has disbanded.`,'guild');}}}

/* ---------------- GOALS ---------------- */
function pickGoal(n){
  const t=n.tr;const opts=[
    [{type:'level',target:Math.min(100,n.level+U.ri(2,6))},0.6+t.ambit],
    [{type:'gear'},0.4+t.greed*0.4+(gearScore(n.equip)<n.level*7?1:0)],
    [{type:'wealth',target:Math.round((n.gold+200)*U.rf(1.5,3))},t.greed*1.4],
    [{type:'pvp',target:n.pvp.r+U.ri(50,150)},t.compet*1.3],
    [{type:'boss'},t.brave*(n.level>=30?1:0.1)],
    [{type:'explore'},t.explore*0.9],
    [{type:'dungeon'},0.3+t.brave*0.5],
    [{type:'craft'},['smithing','alchemy','cooking','enchanting'].includes(n.prof)?0.6:0.05]];
  return U.wpick(opts,o=>o[1])[0];
}
function goalMet(n){const g=n.goal;if(!g)return true;
  if(g.type==='level')return n.level>=g.target;if(g.type==='wealth')return n.gold>=g.target;if(g.type==='pvp')return n.pvp.r>=g.target;
  if(g.type==='gear')return gearScore(n.equip)>=n.level*8.5;if(g.type==='boss')return g.done;if(g.type==='explore')return g.done;if(g.type==='dungeon')return g.done;if(g.type==='craft')return g.done;return false;}

/* ---------------- ONLINE SCHEDULE ---------------- */
function online(n,t=S.time){if(n.retired)return false;const h=T.hour(t);const s=n.sched.start,e=(s+n.sched.len)%24;return s<e?(h>=s&&h<e):(h>=s||h<e);}

/* ---------------- COMBAT ABSTRACTION FOR SIM ---------------- */
function kConst(l){return 50+l*8;}
function estDmg(st,lvl,tgt){ // average dmg per action vs a target {pdef,mdef,eva}
  const K=kConst(lvl);const ph=st.patk*K/(K+tgt.pdef*(1-(st.pen||0))),mg=st.matk*1.15*K/(K+tgt.mdef);
  const hit=U.clamp((st.acc-tgt.eva)/100,0.3,0.97);return Math.max(ph,mg)*hit*(1+st.crit/100*0.5)*1.25;}
function winChance(n,m,pack=1){
  const st=stats(n);const role=CLASSES[n.cls].role;
  const myD=estDmg(st,n.level,m)*(role==='summoner'?1.25:1);
  const K=kConst(m.level);const monD=Math.max(m.atk*K/(K+st.pdef),m.matk*K/(K+st.mdef)*0.9)*U.clamp((m.acc-st.eva)/100,0.3,0.97);
  const hp=st.mhp*n.hpPct*(role==='healer'?1.35:1)*(role==='tank'?1.2:1);
  const tKill=m.mhp*pack/myD,tDie=hp/(monD*(1+(pack-1)*0.8));
  return U.sig(2.2*Math.log(tDie/tKill)+0.4);
}
function duelChance(a,b){const sa=stats(a),sb=stats(b);
  const da=estDmg(sa,a.level,{pdef:sb.pdef,mdef:sb.mdef,eva:sb.eva}),db=estDmg(sb,b.level,{pdef:sa.pdef,mdef:sa.mdef,eva:sa.eva});
  return U.sig(2.0*Math.log((sa.mhp/db)/(sb.mhp/da)));}

/* ---------------- NPC PROGRESSION ---------------- */
function npcGainXp(n,x){
  if(n.level>=LEVEL_CAP)return;n.xp+=Math.round(x*NPC_XP_RATE*(n.level<20?1:n.level<50?0.8:n.level<80?0.6:0.4));
  while(n.level<LEVEL_CAP&&n.xp>=xpNext(n.level)){n.xp-=xpNext(n.level);n.level++;
    const g=classGrowth(n),prio=CLASS_PRIO[n.cls];for(const k in g)n.attr[k]+=Math.round(g[k]);for(let p=0;p<2;p++)n.attr[U.chance(0.6)?prio[0]:U.chance(0.6)?prio[1]:prio[2]]++;
    dirty(n);n.fame+=n.level;
    if(n.level%5===0||n.level>=50){hist(n,`Reached level ${n.level}`);BUS.emit('levelup',{n});}
    for(const [lv,a] of [[10,'lv10'],[25,'lv25'],[50,'lv50'],[75,'lv75'],[100,'lv100']])if(n.level>=lv&&!n.ach.includes(a)){n.ach.push(a);if(lv>=50)news(`${n.user} reached level ${lv}!`,'fame');}
    if(n.level>=LEVEL_CAP){news(`${n.user} has reached the level cap: Lv.100!`,'fame');BUS.emit('cap',{n});}
    checkNpcAdvance(n);
  }
}
function npcMastery(n,k,amt){k=mKey(k);const v=(n.mastery[k]||0);if(v>=100)return;if(U.chance(amt/(4+v*0.25)))n.mastery[k]=v+1;}
function checkNpcAdvance(n){
  if(n.adv)return;for(const id in ADV_CLASSES){const A=ADV_CLASSES[id];if(advEligible(n,A).ok&&U.chance(0.3)){n.adv=id;dirty(n);hist(n,`Became a ${A.name}`);n.ach.push('advclass');news(`${n.user} has become a ${A.name}!`,'fame');BUS.emit('advance',{n,A});return;}}
}
function advEligible(a,A){
  const why=[];
  if(A.from&&!A.from.includes(a.cls))why.push(`Class must be ${A.from.map(c=>CLASSES[c].name).join('/')}`);
  if(a.level<A.lvl)why.push(`Level ${A.lvl}`);
  for(const k in A.req||{})if(mLv(a,k)<A.req[k])why.push(`${MASTERY[k].n} ${A.req[k]}`);
  if(A.reqAny&&A.reqAny.schools&&!SCHOOL_M.some(s=>mLv(a,s)>=A.reqAny.schools))why.push(`Any magic school ${A.reqAny.schools}`);
  if(A.reqAnySchool&&!SCHOOL_M.some(s=>mLv(a,s)>=A.reqAnySchool))why.push(`Any magic school ${A.reqAnySchool}`);
  if(A.reqAnyWeapon&&!WEAPON_M.some(s=>mLv(a,s)>=A.reqAnyWeapon))why.push(`Any weapon mastery ${A.reqAnyWeapon}`);
  if(A.weaponCount&&WEAPON_M.filter(s=>mLv(a,s)>=30).length<A.weaponCount)why.push(`${A.weaponCount} weapon masteries at 30`);
  if(A.flag&&!((a.flags||{})[A.flag]))why.push('Slay a dragon world boss');
  if(A.comps&&(a.comps?a.comps.length:(a.level>45?3:0))<A.comps)why.push(`${A.comps} bonded companions`);
  if(A.tamed&&(a.comps?a.comps.length:(a.level>35?2:0))<A.tamed)why.push(`${A.tamed} tamed creatures`);
  return {ok:!why.length,why};
}
function npcDie(n,cause){n.deaths++;n.hpPct=0.3;n.conf=U.clamp(n.conf-0.08,0,1);const lost=Math.round(n.gold*0.05);n.gold-=lost;
  const town=nearestTown(n.loc);n.loc=town;n.path=[];n.busy=S.time+U.ri(30,90);n.act='recovering';hist(n,`Was defeated ${cause}`);BUS.emit('npc_death',{n,cause});}
function nearestTown(loc){if(isTown(loc)&&!LOCS[loc].hid)return loc;let best=null,bd=1e9;for(const l in LOCS){if(!isTown(l)||LOCS[l].hid)continue;const p=path(loc,l,true);if(p&&p.hours<bd){bd=p.hours;best=l;}}return best||'crossroads';}
function bestHuntLoc(n){const L=n.level;const c=Object.keys(LOCS).filter(l=>{const x=LOCS[l];return !isTown(l)&&x.mon.length&&(!x.hid||n.knows.includes(l))&&x.lv[0]<=L+2&&x.lv[1]>=L-6&&(!x.pvp||n.tr.brave>0.5);});
  if(!c.length){const all=Object.keys(LOCS).filter(l=>!isTown(l)&&LOCS[l].mon.length&&!LOCS[l].hid).sort((a,b)=>Math.abs(LOCS[a].lv[1]-L)-Math.abs(LOCS[b].lv[1]-L));return all[0];}
  return U.wpick(c,l=>1+(n.loc===l?2:0)+(n.knows.includes(l)?1:0));}

/* ---------------- NPC ACTIONS ---------------- */
function startTravel(n,dest,why){if(n.loc===dest)return false;const p=path(n.loc,dest,true);if(!p)return false;n.path=p.path.slice(1);n.dest=dest;n.act='travel';n.why=why;stepTravel(n);return true;}
function stepTravel(n){const next=n.path.shift();if(!next){n.dest=null;n.act='idle';return;}const h=GRAPH[n.loc][next]||2;n.busy=S.time+h*60;n.pendingLoc=next;}
function arrive(n){if(n.pendingLoc){const from=n.loc;n.loc=n.pendingLoc;n.pendingLoc=null;if(!n.knows.includes(n.loc)){n.knows.push(n.loc);if(LOCS[n.loc].hid){hist(n,`Discovered ${LOCS[n.loc].n}`);BUS.emit('discover',{n,loc:n.loc});}}
    if(!n.path.length){n.dest=null;n.act='idle';}}}
function npcHunt(n,hours){
  const loc=n.loc,L=LOCS[loc];if(!L.mon.length)return;
  let fights=U.ri(2,4)*hours,xp=0,gold=0,won=0,items=[];n.act='hunting';
  for(let i=0;i<fights;i++){const id=U.pick(L.mon),lv=locMonsterLevel(loc),M=MONSTERS[id];const m=makeMonster(id,lv);const pack=(M.b||[]).includes('pack')?U.ri(1,3):1;
    const p=winChance(n,m,pack);
    if(U.chance(p)){won++;xp+=monXp(lv,M)*pack*(RACES[n.race].xp||1);const lt=rollLoot(id,lv,n.attr.luck);gold+=lt.gold;items.push(...lt.items);n.kills+=pack;n.hpPct=U.clamp(n.hpPct-U.rf(0.02,0.25)*(1-p),0.05,1);
      npcMastery(n,stats(n).wt,2);for(const k in CLASSES[n.cls].mastery)if(MASTERY[mKey(k)].t==='school')npcMastery(n,k,1.5);}
    else{n.hpPct-=U.rf(0.3,0.7);if(n.hpPct<=0.05){if(U.chance(0.5+n.tr.caution*0.4)){n.hpPct=0.15;n.act='fleeing';break;}npcDie(n,`by a ${M.n} in ${L.n}`);return;}}
    if(n.hpPct<0.25&&n.tr.caution>0.3)break;}
  npcGainXp(n,xp);n.gold+=gold;n.conf=U.clamp(n.conf+won*0.002,0,1);
  for(const it of items){if(isGear(it)){if(npcConsiderEquip(n,it))continue;n.inv.push(it);if(it.r>=3){hist(n,`Found ${itemName(it)} in ${L.n}`);BUS.emit('loot',{n,it,loc});}}else{const e=n.inv.find(x=>x.k===it.k);if(e)e.q+=it.q;else n.inv.push({k:it.k,q:it.q});}}
  if(n.inv.length>12)n.inv.splice(0,n.inv.length-12);
  n.busy=S.time+hours*60;
}
function npcConsiderEquip(n,it){const base=ITEM_BASES[it.b];if(!base)return false;const sl=base.sl;if(it.l>n.level+5)return false;const C=CLASSES[n.cls];
  if(base.t==='weapon'&&!C.weapons.includes(base.wt))return false;if(base.t==='armor'&&base.ac!==C.armor)return false;if(base.t==='weapon'&&base.two&&n.equip.offhand){}
  const cur=n.equip[sl];const sc=x=>x?x.l*RARITY[x.r].m:0;if(sc(it)>sc(cur)*1.05){if(cur)n.inv.push(cur);n.equip[sl]=it;if(base.two&&n.equip.offhand){n.inv.push(n.equip.offhand);n.equip.offhand=null;}dirty(n);return true;}return false;}
function npcShop(n){ // buy an upgrade from the smith in town
  const city=n.loc;if(!hasSvc(city,'smith'))return false;const C=CLASSES[n.cls];
  const slots=['weapon','chest','legs','head','hands','feet','offhand','ring','amulet'];
  const sc=x=>x?x.l*RARITY[x.r].m:0;let worst=null,ws=1e9;for(const sl of slots){if(sl==='offhand'&&n.equip.weapon&&ITEM_BASES[n.equip.weapon.b].two)continue;const s=sc(n.equip[sl]);if(s<ws){ws=s;worst=sl;}}
  if(!worst)return false;
  const lv=Math.min(n.level+2,100),r=n.gold>itemValue({b:'sword',l:lv,r:2})*1.5&&U.chance(0.4)?2:U.chance(0.6)?1:0;
  let base=worst==='weapon'?U.pick(C.weapons.filter(w=>ITEM_BASES[w])):worst==='offhand'?'shield':(worst==='ring'||worst==='amulet')?worst:`${worst}_${C.armor}`;
  const it=makeGear(base,lv,r);const price=Math.round(itemValue(it)*priceMult(city,ITEM_BASES[base].t==='weapon'?'weapon':'armor')*1.2);
  if(price>n.gold*0.7||sc(it)<=ws)return false;
  n.gold-=price;const cur=n.equip[worst];if(cur)n.inv.push(cur);n.equip[worst]=it;dirty(n);demand(city,ITEM_BASES[base].t==='weapon'?'weapon':'armor',1);
  hist(n,`Bought ${itemName(it)} for ${U.fmt(price)}g`);BUS.emit('buy',{n,it,price,city});n.busy=S.time+30;n.act='shopping';
  if(n.goal&&n.goal.type==='gear'&&goalMet(n))BUS.emit('goal_done',{n,goal:n.goal});
  return true;
}
function npcSell(n){ // vendor junk & list valuables on the market
  const city=n.loc;if(!isTown(city))return;let earned=0;
  n.inv=n.inv.filter(it=>{
    if(isGear(it)){if(it.r>=2&&(hasSvc(city,'market'))&&S.market.length<140&&(n.tr.greed>0.35||it.r>=3)){listItem(n,it,Math.round(itemValue(it)*U.rf(1.0,1.6)*(1+n.tr.greed*0.5)));return false;}
      const v=Math.round(itemValue(it)*0.35*priceMult(city,'weapon'));earned+=v;supply(city,'weapon',0.5);return false;}
    const d=ITEMS[it.k];if(d&&d.t==='mat'&&!(['smithing','alchemy','cooking','enchanting'].includes(n.prof)&&U.chance(0.5))){earned+=Math.round(d.v*it.q*0.6*priceMult(city,'mat'));supply(city,'mat',it.q*0.2);return false;}
    return true;});
  n.gold+=earned;if(earned>0){n.act='trading';n.busy=S.time+20;}
}
function npcListLoot(n,init){const lv=Math.max(1,n.level+U.ri(-5,3));const it=randomGear(lv,null,U.chance(0.15)?3:U.chance(0.5)?2:1);listItem(n,it,Math.round(itemValue(it)*U.rf(1.0,1.7)),init);}
function listItem(n,it,price,silent){const L={id:U.uid(),item:it,price:Math.max(5,price),seller:n.id,t:S.time};S.market.push(L);n.listed++;if(!silent&&(it.r>=2||U.chance(0.3)))BUS.emit('wts',{n,L});return L;}
function npcBuyMarket(n){ // buy listings that are upgrades
  if(!S.market.length)return false;const sc=x=>x?x.l*RARITY[x.r].m:0;const C=CLASSES[n.cls];
  for(const L of U.shuffle(S.market.slice()).slice(0,12)){const it=L.item;if(!isGear(it)||L.seller===n.id)continue;const b=ITEM_BASES[it.b];if(it.l>n.level+5)continue;
    if(b.t==='weapon'&&!C.weapons.includes(b.wt))continue;if(b.t==='armor'&&b.ac!==C.armor)continue;
    const cur=n.equip[b.sl];if(sc(it)<=sc(cur)*1.1)continue;const fair=itemValue(it)*(1.6-n.tr.greed*0.5);if(L.price>fair||L.price>n.gold*0.8)continue;
    buyListing(n,L);return true;}
  return false;
}
function buyListing(buyer,L){const i=S.market.indexOf(L);if(i<0)return false;S.market.splice(i,1);
  const isP=buyer==='P'||buyer===S.P;const b=isP?S.P:buyer;b.gold-=L.price;
  const tax=Math.round(L.price*0.05);
  if(L.seller==='P'){S.P.gold+=L.price-tax;S.P.stats.sold=(S.P.stats.sold||0)+1;BUS.emit('player_sold',{L,buyer:b});}
  else if(L.seller&&L.seller.startsWith&&L.seller.startsWith('n')){const s=npc(L.seller);if(s){s.gold+=L.price-tax;if(L.price>500)hist(s,`Sold ${itemName(L.item)} for ${U.fmt(L.price)}g`);
    if(isP)remember(s,`Bought my ${itemName(L.item)} for ${U.fmt(L.price)}g`,4);}}
  if(isP){invAdd(S.P,L.item.b!=null?L.item:L.item.k,L.item.q||1);}else{npcConsiderEquip(b,L.item)||b.inv.push(L.item);hist(b,`Bought ${itemName(L.item)} at auction`);}
  return true;}
function npcCraft(n){const R=RECIPES.filter(r=>r.m===n.prof&&(n.mastery[n.prof]||0)>=r.lv&&!r.ench);if(!R.length)return false;
  const r=U.pick(R.slice(-4));n.mastery[n.prof]=Math.min(100,(n.mastery[n.prof]||0)+(U.chance(0.3)?1:0));n.crafted++;
  let it;if(r.gear){it=makeGear(randomGearBase(r.gear),r.ilvl+U.ri(-2,3),U.chance(0.08+(n.mastery[n.prof]||0)/400)?2:U.chance(0.5)?1:0);it.crafter=n.user;}else it={k:r.out,q:U.ri(1,3)};
  const cost=Object.entries(r.in).reduce((s,[k,q])=>s+ITEMS[k].v*q,0);n.gold-=Math.min(n.gold,Math.round(cost*0.7));
  if(hasSvc(n.loc,'market')&&S.market.length<140)listItem(n,it,Math.round((isGear(it)?itemValue(it):ITEMS[it.k].v*it.q)*U.rf(1.1,1.5)));else n.gold+=Math.round((isGear(it)?itemValue(it):ITEMS[it.k].v*it.q)*0.8);
  if(n.goal&&n.goal.type==='craft'&&n.crafted%5===0)n.goal.done=true;
  n.act='crafting';n.busy=S.time+U.ri(60,120);return true;}

/* dungeon expeditions: forms a real party of NPCs */
function npcDungeon(leader){
  const dungeons=Object.keys(LOCS).filter(l=>LOCS[l].boss&&LOCS[l].lv[0]<=leader.level+3&&LOCS[l].lv[1]>=leader.level-8);if(!dungeons.length)return false;
  const d=dungeons.includes(leader.loc)?leader.loc:U.pick(dungeons);
  const pool=(S.byLoc[leader.loc]||[]).filter(o=>o!==leader&&!o.retired&&o.busy<=S.time&&online(o)&&Math.abs(o.level-leader.level)<=8&&!o.inParty);
  const party=[leader];const need=['tank','healer','dps'];
  for(const role of need){const c=pool.filter(o=>!party.includes(o)&&CLASSES[o.cls].role===role).sort((a,b)=>(leader.friends.includes(b.id)?1:0)-(leader.friends.includes(a.id)?1:0)+(b.guild===leader.guild?1:0)-(a.guild===leader.guild?1:0));if(c[0])party.push(c[0]);}
  if(party.length<3){if(U.chance(0.12))BUS.emit('lfg',{n:leader,loc:d,need:need.filter(r=>!party.some(p=>CLASSES[p.cls].role===r))});return false;}
  // resolve expedition
  const D=LOCS[d],floors=D.floors||3;let alive=party.slice(),xp=0,loot=[],gold=0;
  for(let f=0;f<floors&&alive.length;f++){const id=U.pick(D.mon),lv=U.ri(D.lv[0],D.lv[1])+f;const m=makeMonster(id,lv);
    const avg=alive.reduce((s,p)=>s+winChance(p,m,1),0)/alive.length;const pw=U.clamp(avg+alive.length*0.06,0,0.995);
    if(U.chance(pw)){xp+=monXp(lv,MONSTERS[id])*3;const lt=rollLoot(id,lv,10,2);gold+=lt.gold;loot.push(...lt.items);}else{const v=U.pick(alive);v.hpPct=0.1;alive=alive.filter(x=>x!==v);npcDie(v,`in ${D.n}`);}}
  let cleared=false;
  if(alive.length){const bl=D.lv[1]+2;const bm=makeMonster(D.boss,bl);const avg=alive.reduce((s,p)=>s+winChance(p,bm,1),0)/alive.length;const pw=U.clamp(avg*0.9+alive.length*0.08,0,0.97);
    if(U.chance(pw)){cleared=true;xp+=monXp(bl,MONSTERS[D.boss]);const lt=rollLoot(D.boss,bl,15,3);gold+=lt.gold;loot.push(...lt.items);}
    else{for(const p of alive)if(U.chance(0.5))npcDie(p,`by ${MONSTERS[D.boss].n}`);}}
  for(const p of party){if(p.loc!==d&&p.act!=='recovering')p.loc=p.act==='recovering'?p.loc:d;npcGainXp(p,xp/party.length*1.2);p.gold+=Math.round(gold/party.length);if(cleared){p.dung++;p.boss++;p.fame+=Math.round(D.lv[1]*1.5);if(p.goal&&p.goal.type==='dungeon')p.goal.done=true;}
    if(p.act!=='recovering'){p.busy=S.time+U.ri(150,240);p.act='dungeon';}
    for(const o of party)if(o!==p&&!p.friends.includes(o.id)&&U.chance(cleared?0.25:0.08)){p.friends.push(o.id);}}
  // loot distribution: need-based round robin
  let i=0;for(const it of loot){const cand=party.filter(p=>p.act!=='recovering'||true);const p=cand[i++%cand.length];if(isGear(it)){if(!npcConsiderEquip(p,it))p.inv.push(it);if(it.r>=3||it.u){hist(p,`Looted ${itemName(it)} from ${D.n}`);BUS.emit('loot',{n:p,it,loc:d});}}else{const e=p.inv.find(x=>x.k===it.k);if(e)e.q+=it.q;else p.inv.push({k:it.k,q:it.q});}}
  for(const p of party)if(p.inv.length>12)p.inv.splice(0,p.inv.length-12);
  BUS.emit('dungeon',{party,loc:d,cleared});
  if(cleared){for(const p of party)hist(p,`Cleared ${D.n} with ${party.filter(x=>x!==p).map(x=>x.user).join(', ')}`);if(D.lv[0]>=38)news(`${party.map(p=>p.user).join(', ')} cleared ${D.n}!`,'dungeon');}
  return true;
}
function npcDuel(n){
  const city=n.loc;if(!hasSvc(city,'arena'))return false;
  const opp=(S.byLoc[city]||[]).filter(o=>o!==n&&online(o)&&o.busy<=S.time&&Math.abs(o.pvp.r-n.pvp.r)<250&&!o.retired);if(!opp.length)return false;
  const o=n.rivals.map(npc).find(r=>opp.includes(r))||U.pick(opp);
  const p=duelChance(n,o);const win=U.chance(p);const [w,l]=win?[n,o]:[o,n];eloUpdate(w,l);
  w.pvp.w++;l.pvp.l++;w.fame+=5;n.busy=S.time+30;o.busy=S.time+30;n.act=o.act='dueling';
  if(l.tr.arrog>0.6&&!l.rivals.includes(w.id)&&U.chance(0.5)){l.rivals.push(w.id);hist(l,`Swore revenge on ${w.user}`);}
  if(n.goal&&n.goal.type==='pvp'&&goalMet(n))BUS.emit('goal_done',{n,goal:n.goal});
  BUS.emit('duel',{w,l,city,upset:(win?p:1-p)<0.3});return true;
}
function eloUpdate(w,l,k=32){const rw=w.pvp.r,rl=l.pvp.r;const ew=1/(1+Math.pow(10,(rl-rw)/400));w.pvp.r=Math.round(rw+k*(1-ew));l.pvp.r=Math.round(rl-k*(1-ew));}

function npcAct(n){
  if(n.inParty)return;
  if(typeof npcEventAct==='function'&&npcEventAct(n))return;
  if(n.pendingLoc&&n.busy<=S.time)arrive(n);
  if(n.busy>S.time||!online(n))return;
  if(n.path.length){stepTravel(n);return;}
  if(goalMet(n)){const old=n.goal;if(old){hist(n,`Achieved goal: ${goalText(old)}`);BUS.emit('goal_done',{n,goal:old});}n.goal=pickGoal(n);}
  // passive recovery
  if(isTown(n.loc))n.hpPct=U.clamp(n.hpPct+0.4,0,1);else n.hpPct=U.clamp(n.hpPct+0.08,0,1);
  const t=n.tr,g=n.goal||{},inTown=isTown(n.loc);const L=LOCS[n.loc];
  const gsLag=gearScore(n.equip)<n.level*7.5;
  const opts=[];
  opts.push(['rest',(n.hpPct<0.5?3:0)+t.lazy*0.6]);
  opts.push(['hunt',0.9+t.ambit*0.5+(g.type==='level'?0.8:0)+(g.type==='wealth'?0.4:0)-(n.hpPct<0.5?1:0)]);
  opts.push(['shop',inTown&&n.gold>n.level*40&&gsLag?1.8+t.greed*0.3:0.05]);
  opts.push(['market',inTown&&hasSvc(n.loc,'market')&&n.gold>n.level*30?0.35+(g.type==='gear'?0.6:0):0]);
  opts.push(['sell',inTown&&n.inv.length>=5?1.5:0]);
  opts.push(['craft',['smithing','alchemy','cooking','enchanting'].includes(n.prof)&&inTown&&n.gold>40?0.3+(g.type==='craft'?1.2:0):0]);
  opts.push(['dungeon',n.level>=5&&n.hpPct>0.7?0.35+t.brave*0.4+(g.type==='dungeon'?1.0:0)+(g.type==='gear'?0.3:0)+t.social*0.2:0]);
  opts.push(['duel',hasSvc(n.loc,'arena')?t.compet*0.8+(g.type==='pvp'?1.2:0):(g.type==='pvp'?0.6:0)]);
  opts.push(['boss',S.boss&&n.level>=S.boss.lvl-22&&n.hpPct>0.6?0.6+t.brave*0.8+(g.type==='boss'?1.5:0)+(n.guild?0.3:0):0]);
  opts.push(['explore',t.explore*0.5+(g.type==='explore'?1.2:0)]);
  opts.push(['social',inTown?t.social*0.5+t.lazy*0.3:0]);
  opts.push(['war',S.wars.length&&n.level>=15&&t.brave>0.6?0.15:0]);
  const choice=U.wpick(opts,o=>o[1])||['rest'];
  switch(choice[0]){
    case 'rest':if(!inTown){startTravel(n,nearestTown(n.loc),'rest');return;}n.hpPct=1;n.act='resting';n.busy=S.time+U.ri(30,120);break;
    case 'hunt':{if(L.mon.length&&L.lv[0]<=n.level+2&&L.lv[1]>=n.level-6){npcHunt(n,U.ri(1,3));}else{const b=bestHuntLoc(n);if(b&&b!==n.loc)startTravel(n,b,'hunt');else if(L.mon.length)npcHunt(n,1);}break;}
    case 'shop':if(!npcShop(n)){if(!hasSvc(n.loc,'smith'))startTravel(n,nearestTown(n.loc),'shop');else{n.busy=S.time+30;n.act='browsing';}}break;
    case 'market':if(!npcBuyMarket(n)){n.busy=S.time+20;n.act='browsing';}break;
    case 'sell':npcSell(n);break;
    case 'craft':if(!npcCraft(n)){n.busy=S.time+30;}break;
    case 'dungeon':if(!npcDungeon(n)){n.busy=S.time+30;n.act='looking for group';}break;
    case 'duel':if(!hasSvc(n.loc,'arena')){startTravel(n,U.pick(['valeria','crossroads','bloodrock','khazgard','saltmere','duskhaven']),'arena');}else if(!npcDuel(n)){n.busy=S.time+30;n.act='waiting at arena';}break;
    case 'boss':if(S.boss){if(n.loc!==S.boss.loc)startTravel(n,S.boss.loc,'boss');else raidBoss([n]);}break;
    case 'explore':{const unk=Object.keys(LOCS).filter(l=>!n.knows.includes(l)&&(!LOCS[l].hid||U.chance(0.02))&&LOCS[l].lv[0]<=n.level+5);if(unk.length){const d=U.pick(unk);if(!startTravel(n,d,'explore'))n.busy=S.time+60;}else{if(g.type==='explore')g.done=true;n.busy=S.time+60;}break;}
    case 'social':n.act='chatting';n.busy=S.time+U.ri(20,60);BUS.emit('social',{n});break;
    case 'war':{const w=U.pick(S.wars);n.act='at war';n.busy=S.time+180;S.kd[w.a].army+=0.3;hist(n,`Fought for ${FACTIONS[w.a].n} in the war`);break;}
  }
  // career change / retirement (rare, driven by history)
  if(n.deaths>8+n.level/4&&n.conf<0.2&&U.chance(0.03)){
    if(n.level>40&&U.chance(0.4)){n.retired=true;hist(n,'Retired from adventuring');news(`${n.user} has retired from adventuring after ${n.deaths} defeats.`,'fame');BUS.emit('retire',{n});if(n.guild)leaveGuild(n);}
    else{const old=n.prof;n.prof=U.pick(['smithing','alchemy','cooking','trading']);n.conf=0.5;n.deaths=0;hist(n,`Gave up front-line fighting to focus on ${MASTERY[n.prof].n}`);BUS.emit('career',{n,old});n.goal={type:'craft'};}}
  if(n.conf>0.85&&n.tr.caution>0.6&&U.chance(0.01)){n.tr.caution-=0.1;n.tr.brave+=0.1;hist(n,'Became more daring');}
}
function goalText(g){return ({level:`reach level ${g.target}`,gear:'upgrade equipment',wealth:`save ${U.fmt(g.target||0)} gold`,pvp:`reach ${g.target} PvP rating`,boss:'kill a world boss',explore:'explore the world',dungeon:'clear a dungeon',craft:'craft and sell wares'})[g.type]||g.type;}

/* ---------------- WORLD BOSSES ---------------- */
const WORLD_BOSSES=[['b_grubnak','whisperwood',20,3],['b_hydra','mire',45,2],['b_frostwyrm','summit',58,2],['b_dragon','ashen',80,1.2],['b_lich','necropolis',90,1]];
function spawnBoss(){const [id,loc,lvl]=U.wpick(WORLD_BOSSES.concat(WORLD_BOSSES_EXT),b=>b[3]);const m=makeMonster(id,lvl);S.boss={id,loc,lvl,hp:m.mhp,mhp:m.mhp,contrib:{},start:S.time,end:S.time+U.ri(20,36)*60,deaths:0};
  news(`World Boss ${MONSTERS[id].n} has appeared in ${LOCS[loc].n}!`,'boss');BUS.emit('boss_spawn',{boss:S.boss});}
function raidBoss(group){const B=S.boss;if(!B)return;const m=makeMonster(B.id,B.lvl);
  for(const n of group){if(n.busy>S.time&&n.act==='raiding')continue;const st=stats(n);const d=estDmg(st,n.level,m)*U.ri(6,12);B.hp-=d;B.contrib[n.id]=(B.contrib[n.id]||0)+d;n.act='raiding';n.busy=S.time+60;
    const p=winChance(n,m,1);if(U.chance((1-p)*0.35)){B.deaths++;npcDie(n,`by ${MONSTERS[B.id].n}`);}
    if(B.hp<=0){killBoss(n.id);return;}}}
function killBoss(lastHit){const B=S.boss;if(!B)return;const M=MONSTERS[B.id];S.boss=null;S.nextBoss=S.time+U.ri(30,60)*60;
  const ranked=Object.entries(B.contrib).sort((a,b)=>b[1]-a[1]);
  news(`${M.n} has been slain! Final blow: ${actorName(lastHit)}.`,'boss');
  ranked.slice(0,25).forEach(([id,dmg],i)=>{const n=id==='P'?S.P:npc(id);if(!n)return;
    if(id==='P'){BUS.emit('player_boss_reward',{rank:i+1,M,B,lastHit});return;}
    n.boss++;n.fame+=Math.round(B.lvl*(i<3?6:2));npcGainXp(n,monXp(B.lvl,M)/Math.max(4,ranked.length)*2);
    if(i<5){const lt=rollLoot(B.id,B.lvl,20,2);n.gold+=lt.gold;for(const it of lt.items)if(isGear(it)){if(!npcConsiderEquip(n,it))n.inv.push(it);if(it.u||it.r>=3){hist(n,`Looted ${itemName(it)} from ${M.n}`);if(it.u)news(`${n.user} obtained the legendary ${itemName(it)}!`,'fame');}}}
    if(M.cat==='dragon'){n.flags=n.flags||{};n.flags.slew_dragon=1;}
    hist(n,`Helped slay ${M.n}${i===0?' (top damage)':''}`);if(n.goal&&n.goal.type==='boss')n.goal.done=true;});
  BUS.emit('boss_dead',{M,B,lastHit,ranked});}

/* ---------------- ECONOMY ---------------- */
function priceMult(city,cat){const e=S.econ[city];if(!e||!e[cat])return 1;let m=Math.sqrt(e[cat].d/e[cat].s);
  const f=S.control[city];if(f&&S.wars.some(w=>w.a===f||w.b===f)&&(cat==='weapon'||cat==='armor'||cat==='con'))m*=1.15;return U.clamp(m,0.65,1.7);}
function demand(city,cat,q){const e=S.econ[city];if(e&&e[cat])e[cat].d+=q;}
function supply(city,cat,q){const e=S.econ[city];if(e&&e[cat])e[cat].s+=q;}
function econTick(){for(const c in S.econ)for(const k in S.econ[c]){const e=S.econ[c][k];e.s+=(50-e.s)*0.03;e.d+=(50-e.d)*0.03;}
  S.market=S.market.filter(L=>{if(S.time-L.t>4*1440&&L.seller!=='P'){const s=npc(L.seller);if(s&&isGear(L.item)&&s.inv.length<12)s.inv.push(L.item);return false;}return true;});}

/* ---------------- POLITICS ---------------- */
function politicsDay(){
  for(let i=0;i<KINGDOMS.length;i++)for(let j=i+1;j<KINGDOMS.length;j++){const a=KINGDOMS[i],b=KINGDOMS[j];let r=rel(a,b);
    const atWar=S.wars.find(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a));r+=U.ri(-4,4)+(atWar?-1:0)+(r>50?1:0);
    for(const w of S.wars){if(w.a!==a&&w.a!==b&&w.b!==a&&w.b!==b){if((w.a===a||w.b===a)&&(w.a===b||w.b===b))continue;}}
    setRel(a,b,r);
    if(!atWar&&r<-62&&U.chance(0.18)&&S.wars.length<2){const contested=CONTESTED.filter(l=>S.control[l]===a||S.control[l]===b||S.control[l]==='free');
      const w={a,b,start:S.time,score:0,front:U.pick(contested.length?contested:CONTESTED),days:0};S.wars.push(w);
      news(`WAR! ${FACTIONS[a].n} has declared war on ${FACTIONS[b].n}! Fighting breaks out at ${LOCS[w.front].n}.`,'war');BUS.emit('war',{w});}
    if(!atWar&&r>70&&U.chance(0.05)&&!S.flags['ally_'+relKey(a,b)]){S.flags['ally_'+relKey(a,b)]=1;news(`${FACTIONS[a].n} and ${FACTIONS[b].n} sign a treaty of friendship.`,'politics');BUS.emit('treaty',{a,b});}}
  for(const w of S.wars.slice()){w.days++;const A=S.kd[w.a],B=S.kd[w.b];const pa=A.army*U.rf(0.7,1.3),pb=B.army*U.rf(0.7,1.3);
    if(pa>pb){w.score++;B.army-=U.ri(2,8);A.army-=U.ri(0,4);}else{w.score--;A.army-=U.ri(2,8);B.army-=U.ri(0,4);}
    if(Math.abs(w.score)>=3&&S.control[w.front]!==(w.score>0?w.a:w.b)&&U.chance(0.5)){const winner=w.score>0?w.a:w.b;const old=S.control[w.front];S.control[w.front]=winner;
      news(`${FACTIONS[winner].n} has seized ${LOCS[w.front].n}${old?` from ${FACTIONS[old].n}`:''}!`,'war');BUS.emit('conquest',{w,winner,loc:w.front});}
    A.weary+=1;B.weary+=1;
    if((w.days>4&&U.chance(0.12+w.days*0.02))||A.army<40||B.army<40){S.wars=S.wars.filter(x=>x!==w);setRel(w.a,w.b,rel(w.a,w.b)+35);A.weary=0;B.weary=0;
      news(`Peace is declared between ${FACTIONS[w.a].n} and ${FACTIONS[w.b].n} after ${w.days} days of war.`,'war');BUS.emit('peace',{w});}}
  for(const k of KINGDOMS){const K=S.kd[k];K.army=U.clamp(K.army+U.ri(1,4),20,160);K.treasury+=U.ri(-300,800);}
}

/* ---------------- GUILD SIM ---------------- */
function guildTick(){
  for(const g of S.guilds.slice()){if(g.isPlayer){playerGuildTick(g);continue;}
    const leader=npc(g.leader);if(!leader||leader.retired){const next=g.officers.map(npc).find(o=>o&&!o.retired)||g.members.map(npc).find(o=>o&&!o.retired);if(next){g.leader=next.id;next.grank='Leader';news(`${next.user} took over leadership of ${g.name}.`,'guild');}else{S.guilds=S.guilds.filter(x=>x!==g);continue;}}
    const L=npc(g.leader);
    // recruit
    if(g.members.length<60&&U.chance(0.5)){const cand=S.npcs.filter(n=>!n.guild&&!n.retired&&online(n)&&n.level>=g.req).slice(0,40);const c=U.pick(cand);
      if(c){if(U.chance(0.25+c.tr.social*0.4+c.tr.loyal*0.2)){joinGuild(c,g);}else if(U.chance(0.3))BUS.emit('recruit_ad',{g,L});}
      else if(U.chance(0.4))BUS.emit('recruit_ad',{g,L});}
    // guild activity → xp & treasury
    const act=g.members.filter(id=>{const m=npc(id);return m&&online(m);}).length;g.xp+=act*U.ri(5,20);g.treasury+=act*U.ri(2,12);const nl=guildLevel(g.xp);if(nl>g.lvl){g.lvl=nl;news(`${g.name} reached guild level ${nl}.`,'guild');BUS.emit('guild_level',{g});}
    // morale & departures
    g.morale=U.clamp(g.morale+U.rf(-0.06,0.06)+(L.tr.kind-0.5)*0.03+(g.rep>200?0.01:0),0.1,1);
    if(g.morale<0.35&&U.chance(0.3)){const m=npc(U.pick(g.members.filter(x=>x!==g.leader)));if(m&&m.tr.loyal<0.6){leaveGuild(m);BUS.emit('guild_quit',{n:m,g});}}
    if(g.morale<0.25&&U.chance(0.1)){const o=g.officers.map(npc).find(o=>o&&o.tr.ambit>0.6);if(o){const old=L;g.leader=o.id;o.grank='Leader';old.grank='Officer';g.officers=g.officers.filter(x=>x!==o.id);g.officers.push(old.id);g.morale=0.6;
      hist(old,`Lost control of ${g.name} to ${o.user}`);hist(o,`Seized leadership of ${g.name}`);news(`Coup in ${g.name}! ${o.user} has overthrown ${old.user}.`,'guild');BUS.emit('coup',{g,o,old});}}
    // guild vs guild
    if(g.rivals.length&&U.chance(0.06)){const r=guild(U.pick(g.rivals));if(r){const pa=guildPower(g)*U.rf(0.7,1.3),pb=guildPower(r)*U.rf(0.7,1.3);const [w,l]=pa>pb?[g,r]:[r,g];w.rep+=20;l.rep=Math.max(0,l.rep-10);w.morale+=0.05;l.morale-=0.05;
      news(`Guild war: ${w.name} defeated ${l.name} in a battle near ${LOCS[w.hq].n}.`,'guild');BUS.emit('gvg',{w,l});}}
    if(U.chance(0.01)&&g.allies.length<3){const o=U.pick(S.guilds);if(o!==g&&!g.rivals.includes(o.id)&&!g.allies.includes(o.id)){g.allies.push(o.id);o.allies.push(g.id);news(`${g.name} and ${o.name} formed an alliance.`,'guild');}}
    if(g.treasury>15000&&U.chance(0.05)){g.treasury-=10000;g.hall=(g.hall||0)+1;news(`${g.name} expanded their guild hall in ${LOCS[g.hq].n}.`,'guild');}
    if(U.chance(0.1))BUS.emit('guild_chatter',{g});
  }
}
function playerGuildTick(g){
  g.xp+=g.members.length*U.ri(3,10);g.lvl=guildLevel(g.xp);
  for(const id of g.members.slice()){if(id==='P')continue;const m=npc(id);if(!m||m.retired){g.members=g.members.filter(x=>x!==id);continue;}
    const aff=(m.mem.P||{}).aff||0;g.treasury+=online(m)?U.ri(1,6):0;
    const happy=0.5+aff/200+(g.morale-0.5)+(m.tr.loyal-0.5)*0.4;
    if(happy<0.25&&U.chance(0.15)){leaveGuild(m);remember(m,`Left ${g.name} because I was unhappy`,-5);BUS.emit('pguild_quit',{n:m,g});}
    else if(U.chance(0.04))BUS.emit('pguild_suggest',{n:m,g});}
  g.morale=U.clamp(g.morale+U.rf(-0.03,0.02),0.1,1);
}

/* ---------------- TOURNAMENT ---------------- */
function tourneyTick(){
  const T_=S.tourney;
  if(T_.state==='idle'&&S.time>=T_.next-12*60){T_.state='reg';T_.entrants=[];T_.log=[];news(`Registration for the Grand Tournament in Valeria is open! It starts at ${T.str(T_.next)}.`,'arena');BUS.emit('tourney_reg',{});}
  if(T_.state==='reg'&&S.time>=T_.next){
    const cands=S.npcs.filter(n=>!n.retired&&n.level>=20).sort((a,b)=>b.pvp.r-a.pvp.r).slice(0,40);const ent=U.shuffle(cands).slice(0,T_.reg?15:16).map(n=>n.id);if(T_.reg)ent.push('P');
    T_.entrants=U.shuffle(ent);T_.alive=T_.entrants.slice();T_.round=1;T_.state='running';T_.pending=null;news(`The Grand Tournament has begun! 16 champions compete.`,'arena');BUS.emit('tourney_start',{});runTourneyRound();}
  else if(T_.state==='running'&&T_.pending&&S.time>T_.pending.deadline){T_.log.push(`${S.P.user} forfeited against ${actorName(T_.pending.opp)}.`);T_.alive=T_.alive.filter(x=>x!=='P');T_.pending=null;T_.next2=true;runTourneyRound(true);}
}
function runTourneyRound(cont){
  const T_=S.tourney;if(T_.pending)return;
  if(!cont||!T_.cur){T_.cur=[];for(let i=0;i<T_.alive.length;i+=2)T_.cur.push([T_.alive[i],T_.alive[i+1]]);T_.winners=[];}
  while(T_.cur.length){const [a,b]=T_.cur[0];
    if(!b){T_.winners.push(a);T_.cur.shift();continue;}
    if(a==='P'||b==='P'){T_.pending={opp:a==='P'?b:a,deadline:S.time+4*60,round:T_.round};BUS.emit('tourney_player',{opp:T_.pending.opp,round:T_.round});return;}
    const A=npc(a),B=npc(b);const w=U.chance(duelChance(A,B))?A:B;const l=w===A?B:A;T_.winners.push(w.id);T_.log.push(`R${T_.round}: ${w.user} defeated ${l.user}`);eloUpdate(w,l,16);T_.cur.shift();}
  T_.alive=T_.winners;T_.round++;
  if(T_.alive.length===1){const champ=T_.alive[0];T_.state='idle';T_.next=S.time+7*1440;T_.champion=champ;T_.reg=false;news(`${actorName(champ)} is the Grand Tournament Champion!`,'arena');
    if(champ!=='P'){const c=npc(champ);c.fame+=500;c.gold+=5000;hist(c,'Won the Grand Tournament');c.ach.push('champion');}BUS.emit('tourney_end',{champ});return;}
  runTourneyRound();
}
function tourneyPlayerResult(won){const T_=S.tourney;if(!T_.pending)return;const opp=T_.pending.opp;T_.log.push(`R${T_.round}: ${won?S.P.user:actorName(opp)} defeated ${won?actorName(opp):S.P.user}`);
  T_.winners.push(won?'P':opp);T_.cur.shift();T_.pending=null;if(!won)T_.alive=T_.alive.filter(x=>x!=='P');
  if(won&&T_.alive.length===2&&T_.winners.length===1&&!T_.cur.length){}
  runTourneyRound(true);
  if(T_.champion==='P'&&T_.state==='idle'){S.P.stats.tourneyWins=(S.P.stats.tourneyWins||0)+1;S.P.gold+=5000;S.P.fame+=500;}}

/* ---------------- QUESTS ---------------- */
function pl(n){return /[^aeiou]y$/i.test(n)?n.slice(0,-1)+'ies':/f$/.test(n)?n.slice(0,-1)+'ves':/(s|x|ch|sh)$/.test(n)?n+'es':n+'s';}
function genQuests(town){
  const nearby=Object.keys(LOCS).filter(l=>{const p=path(town,l);return p&&p.hours<=9&&!isTown(l)&&LOCS[l].mon.length&&!LOCS[l].hid;});
  const q=[];const n=U.ri(4,6);
  for(let i=0;i<n;i++){const loc=U.pick(nearby.length?nearby:['greenmarch']);const L=LOCS[loc];const lvl=Math.round((L.lv[0]+L.lv[1])/2);
    if(U.chance(0.22)&&typeof npcRequest==='function'){const rq=npcRequest(town);if(rq){q.push(rq);continue;}}
    const type=U.wpick(['kill','gather','bounty','explore','deliver','dungeon','escort'],t=>({kill:4,gather:2.5,bounty:1,explore:1,deliver:1,dungeon:L.boss?1.5:0,escort:1})[t]);
    const base={id:U.uid(),type,loc,lvl,giver:town,prog:0};
    if(type==='kill'){const m=U.pick(L.mon);Object.assign(base,{mon:m,qty:U.ri(3,8),n:`Cull the ${pl(MONSTERS[m].n)}`,d:`${pl(MONSTERS[m].n)} have been sighted in ${L.n}. Slay ${'{qty}'} of them.`});}
    if(type==='gather'){const r=U.pick(L.res.length?L.res:[['herb_sun','herbalism']]);Object.assign(base,{item:r[0],qty:U.ri(3,6),n:`Gather ${ITEMS[r[0]].n}`,d:`The ${town==='valeria'?'Royal Alchemist':'quartermaster'} needs ${'{qty}'} ${ITEMS[r[0]].n} from ${L.n}.`});}
    if(type==='bounty'){const m=U.pick(L.mon);Object.assign(base,{mon:m,qty:1,elite:1,n:`Bounty: ${MONSTERS[m].n} Alpha`,d:`A huge ${MONSTERS[m].n} is terrorizing travelers in ${L.n}. Bring back proof.`});base.lvl+=3;}
    if(type==='explore'){Object.assign(base,{qty:1,n:`Survey ${L.n}`,d:`Explore ${L.n} and report anything unusual.`});}
    if(type==='deliver'){const dests=Object.keys(LOCS).filter(l=>isTown(l)&&l!==town&&!LOCS[l].hid);const d=U.pick(dests);Object.assign(base,{loc:d,qty:1,n:`Courier to ${LOCS[d].n}`,d:`Deliver a sealed parcel to ${LOCS[d].n}.`});base.lvl=Math.max(1,lvl-3);}
    if(type==='dungeon'){Object.assign(base,{qty:1,n:`Clear ${L.n}`,d:`Defeat ${MONSTERS[L.boss].n} in ${L.n}.`});base.lvl=L.lv[1];}
    if(type==='escort'){const dests=Object.keys(LOCS).filter(l=>isTown(l)&&l!==town&&!LOCS[l].hid&&path(town,l).hours<=8);const d=U.pick(dests);Object.assign(base,{loc:d,qty:1,escort:1,n:`Escort a caravan to ${LOCS[d].n}`,d:`A merchant caravan needs a guard to ${LOCS[d].n}. Bandits will try their luck on the way.`});base.lvl=Math.max(1,lvl);}
    base.d=base.d.replace('{qty}',base.qty);
    const mult={kill:1,gather:0.8,bounty:2,explore:0.6,deliver:0.7,dungeon:4,escort:1.4}[type];
    base.xp=Math.round(monXp(base.lvl)*base.qty*0.6*mult+monXp(base.lvl)*2);base.gold=Math.round((10+base.lvl*base.lvl*0.6)*mult*U.rf(0.8,1.2));
    base.rep={};const f=S.control[town]||LOCS[town].f;if(f)base.rep[f]=Math.round(3*mult);
    if(U.chance(0.25))base.reward=randomGear(base.lvl,null,U.chance(0.3)?2:1);
    q.push(base);}
  return q;
}

/* ---------------- RUMORS (knowledge from world state) ---------------- */
function rumors(loc){
  const R=[];
  if(S.boss)R.push(`They say ${MONSTERS[S.boss.id].n} is rampaging in ${LOCS[S.boss.loc].n}. Raiders are gathering.`);
  for(const w of S.wars)R.push(`${FACTIONS[w.a].n} and ${FACTIONS[w.b].n} are at war. The front is at ${LOCS[w.front].n}.`);
  for(const c in S.econ){const m=priceMult(c,'weapon');if(m>1.25)R.push(`Weapons are expensive in ${LOCS[c].n}. Smiths can't keep up.`);if(m<0.8)R.push(`${LOCS[c].n} is flooded with cheap weapons.`);}
  const top=S.npcs.filter(n=>!n.retired).sort((a,b)=>b.level-a.level)[0];R.push(`Everyone's talking about ${top.user}, the strongest adventurer alive at level ${top.level}.`);
  if(S.tourney.state==='reg')R.push('The Grand Tournament is open for registration at the Valeria Arena.');
  if(!S.P.explored.includes('hollow')&&['thornvale','lothirien','moonfall'].includes(loc))R.push('An old warden swears there\'s a vale west of Moonfall Glade where the dead whisper. It isn\'t on any map.');
  if(!S.P.explored.includes('cove')&&['saltmere','aethermoor'].includes(loc))R.push('Sailors say Silk-Eye\'s pirates hide in sea caves south-west of Saltmere.');
  if(!S.P.explored.includes('skyreach')&&['khazgard','frostpeak','deepforge'].includes(loc))R.push('There\'s a monastery above Khazgard, past the end of the dwarf roads. Monks there fly, apparently.');
  const recent=S.news.filter(n=>n[2]==='dungeon'||n[2]==='fame').slice(0,3).map(n=>n[1]);R.push(...recent);
  if(LOCS[loc].lv&&!isTown(loc))R.push(`Watch out in ${LOCS[loc].n}. ${MONSTERS[U.pick(LOCS[loc].mon)].n}s are common here.`);
  return U.shuffle(R).slice(0,3);
}

/* ---------------- MAIN TICKS ---------------- */
function processHour(){
  reindex();
  for(const n of S.npcs){try{npcAct(n);}catch(e){console.error('npc',n.user,e);}}
  econTick();
  if(!S.boss&&S.time>=S.nextBoss)spawnBoss();
  if(S.boss){const B=S.boss;const here=(S.byLoc[B.loc]||[]).filter(n=>online(n)&&n.level>=B.lvl-22&&n.hpPct>0.4);if(here.length)raidBoss(here.slice(0,30));
    if(S.boss&&S.time>S.boss.end){news(`${MONSTERS[S.boss.id].n} retreated from ${LOCS[S.boss.loc].n}, wounded but alive.`,'boss');BUS.emit('boss_flee',{B:S.boss});S.boss=null;S.nextBoss=S.time+U.ri(24,48)*60;}}
  if(T.hour(S.time)%6===0)guildTick();
  tourneyTick();
  const d=T.day(S.time);if(d!==S.lastDay){S.lastDay=d;politicsDay();populationDay();for(const l in S.quests)S.quests[l]=S.quests[l].filter(q=>q.taken).concat(genQuests(l)).slice(-6);BUS.emit('newday',{d});}
  if(U.chance(0.04))worldEvent();
  if(typeof eventsTick==='function')eventsTick();
  BUS.emit('hour',{});
}
/* population churn: newcomers arrive, burned-out veterans retire */
function populationDay(){const active=S.npcs.filter(n=>!n.retired);
  const arrivals=U.ri(0,2)+(active.length<480?2:0);const taken=new Set(S.npcs.map(n=>n.user.toLowerCase()));if(S.P)taken.add(S.P.user.toLowerCase());
  for(let i=0;i<arrivals&&active.length+i<560;i++){const n=genNpc({user:genUsername(taken),level:U.ri(1,4)});n.loc=n.home;S.npcs.push(n);S.byId[n.id]=n;hist(n,'Joined the Realms');if(U.chance(0.5))BUS.emit('newcomer',{n});}
  for(const n of active){if(n.level>=95&&U.chance(0.01)||n.level>=60&&n.deaths>20&&U.chance(0.02)){n.retired=true;hist(n,'Retired from adventuring');news(`${n.user} (Lv.${n.level}) has retired from adventuring.`,'fame');BUS.emit('retire',{n});if(n.guild)leaveGuild(n);}}
  // keep the world (and the save file) from growing forever on long sessions
  if(S.npcs.length>600){const keep=n=>!n.retired||(n.mem&&n.mem.P)||(S.P&&(S.P.friends||[]).includes(n.id));S.npcs=S.npcs.filter(keep);reindex();}
  trimWorld();}
function trimWorld(){for(const n of S.npcs){if(n.inv&&n.inv.length>12)n.inv.splice(0,n.inv.length-12);if(n.hist&&n.hist.length>10)n.hist.length=10;
    if(n.friends&&n.friends.length>25)n.friends.splice(0,n.friends.length-25);if(n.rivals&&n.rivals.length>10)n.rivals.splice(0,n.rivals.length-10);
    if(n.mem)for(const k in n.mem){const m=n.mem[k];if(m&&m.notes&&m.notes.length>8)m.notes.length=8;}}
  if(S.chat&&S.chat.pm){const ks=Object.keys(S.chat.pm);if(ks.length>30)for(const k of ks.slice(0,ks.length-30))delete S.chat.pm[k];}
  if(S.market&&S.market.length>200)S.market.splice(0,S.market.length-200);}
function worldEvent(){
  const e=U.pick(['caravan','festival','plague','meteor','merchant','bandits']);
  const city=U.pick(Object.keys(S.econ));
  if(e==='caravan'){supply(city,'con',20);supply(city,'mat',20);news(`A large merchant caravan arrived in ${LOCS[city].n}. Potions and materials are cheaper.`,'econ');}
  if(e==='festival'){news(`${LOCS[city].n} celebrates a harvest festival. Inns are full and spirits high.`,'world');demand(city,'food',20);}
  if(e==='plague'){demand(city,'con',25);news(`A coughing sickness spreads in ${LOCS[city].n}. Potion prices are rising.`,'econ');}
  if(e==='meteor'){news('A meteor streaks across the night sky toward the Scorch Dunes. Rare Aether Shards may be scattered there.','world');S.flags.meteor=S.time;}
  if(e==='merchant'){news(`A traveling merchant from the far isles is selling rare goods in ${LOCS[city].n}.`,'econ');for(let i=0;i<3;i++)listItem({id:'merchant',listed:0},randomGear(U.ri(10,60),null,3),U.ri(800,6000),true);}
  if(e==='bandits'){const k=S.control[city];demand(city,'weapon',15);news(`Bandits raided the roads around ${LOCS[city].n}. Weapon demand is up.`,'econ');}
  BUS.emit('world_event',{e,city});
}
/* advance world clock by minutes (player actions & real time) */
function advance(min){const before=S.time;S.time+=min;const hb=Math.floor(before/60),ha=Math.floor(S.time/60);let n=Math.min(ha-hb,96);for(let i=0;i<n;i++)processHour();}

/* memory of the player */
function remember(n,txt,aff=0){const m=n.mem.P=n.mem.P||{aff:0,notes:[],met:S.time};m.aff=U.clamp(m.aff+aff,-100,100);if(txt){m.notes.unshift([S.time,txt]);if(m.notes.length>10)m.notes.length=10;}m.last=S.time;}
function affinity(n){return (n.mem.P||{}).aff||0;}
