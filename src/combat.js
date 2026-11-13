/* ETERNAL REALMS — tactical turn-based combat engine */
'use strict';
let C = null; // active combat

function actorFromChar(a,side,opts={}){
  const st=stats(a);const isP=a===S.P;
  const x={ref:isP?'P':a.id,name:isP?a.user:(opts.name||a.user),side,level:a.level,isPlayer:isP&&side==='a'&&!opts.ai,char:a,
    mhp:st.mhp,hp:isP?a.hp:Math.round(st.mhp*(opts.full?1:Math.max(0.35,a.hpPct||1))),mmp:st.mmp,mp:isP?a.mp:st.mmp,msp:st.msp,sp:isP?a.sp:st.msp,
    patk:st.patk,matk:st.matk,pdef:st.pdef,mdef:st.mdef,acc:st.acc,eva:st.eva,crit:st.crit,critDmg:st.critDmg,spd:st.spd,pen:st.pen,el:st.el,res:Object.assign({},st.res),
    steal:st.steal,wt:st.wt,reach:st.reach,ranged:st.ranged||MAGIC_WT.includes(st.wt),row:isP?a.row:(CLASSES[a.cls].role==='tank'||['warrior','berserker','swordsman','monk','paladin'].includes(a.cls)?'front':'back'),
    fx:{},cd:{},skills:skillList(a),role:CLASSES[a.cls].role,cls:a.cls,cat:'humanoid',b:[],w:[],r:[],race:a.race};
  if(opts.rowFront)x.row='front';
  return x;
}
function actorFromMon(m,side='e'){m.side=side;m.fx=m.fx||{};m.cd=m.cd||{};m.msp=m.msp||100;m.sp=m.sp||100;m.mmp=m.mmp||999;m.res=m.res||{};m.el={};return m;}
function compActor(c){const m=compStats(c);m.side='a';m.row='front';m.fx={};m.cd={};m.sp=100;m.msp=100;m.mp=999;m.mmp=999;m.res={};m.el={};m.ref=c.id;return m;}

function startEncounter(loc,opts={}){
  const L=LOCS[loc];if(!L.mon.length){log('Nothing to fight here.');return;}
  const P=S.P,dm=DIFFS[P.diff].m;
  let id=U.pick(L.mon);let n=1;const M=MONSTERS[id];
  const lowLv=P.level<6;if((M.b||[]).includes('pack'))n=lowLv?U.ri(1,2):U.ri(2,3);else if(U.chance(lowLv?0.15:0.3))n=2;if(L.ty==='dungeon'&&U.chance(0.5))n++;
  n=Math.min(n,2+partyMembers().length);
  // monsters scale within the zone's range toward your level (a zone above you stays dangerous)
  let lv=U.clamp(P.level+U.ri(-2,1),L.lv[0],L.lv[1])+Math.round(evMod('monLv')-1);const en=[];
  if(evMod('drakes')>1&&!isTown(loc)&&U.chance(0.25))id='drake';if(evMod('lightning')>1&&U.chance(0.2))id='storm_elemental';
  for(let i=0;i<n;i++){const mid=i===0?id:(U.chance(0.6)?id:U.pick(L.mon));en.push(makeMonster(mid,U.clamp(lv+U.ri(-1,1),1,120),{diff:dm}));}
  // bounty elite
  const bq=P.quests.find(q=>q.type==='bounty'&&q.loc===loc&&!q.done);if(bq&&U.chance(0.35)){const e=makeMonster(bq.mon,bq.lvl,{diff:dm*1.3});e.name=`${MONSTERS[bq.mon].n} Alpha`;e.mhp*=2.5;e.hp=e.mhp;e.elite=1;en.splice(0,1,e);}
  // PvP zone: hostile adventurer instead
  if(L.pvp&&U.chance(0.25)){const pk=(S.byLoc[loc]||[]).filter(o=>online(o)&&!o.inParty&&o.tr.brave>0.5&&o.tr.kind<0.5&&Math.abs(o.level-P.level)<12);if(pk.length){const o=U.pick(pk);log(`${o.user} (Lv.${o.level}) attacks you! This is a PvP zone.`,'bad');startPvP(o,{type:'wpvp'});return;}}
  startCombat(en,Object.assign({type:'pve',loc},opts));
}
function startPvP(n,opts={}){const P=S.P;const e=actorFromChar(n,'e',{full:true});e.pvpRef=n.id;startCombat([e],Object.assign({type:'pvp',title:opts.title||`Duel vs ${n.user}`,noParty:opts.type==='duel'||opts.type==='arena'||opts.type==='tourney'},opts,{opp:n}));}
function startCombat(enemies,opts={}){
  const P=S.P;
  // packs: each extra monster softens the group a little so crowds are tense, not a coin flip
  if(enemies.length>1){const k=1-0.08*Math.min(3,enemies.length-1);for(const e of enemies)if(!e.packAdj){e.packAdj=1;e.atk*=k;e.matk*=k;}}
  const allies=[actorFromChar(P,'a')];
  if(!opts.noParty)for(const n of partyMembers())allies.push(actorFromChar(n,'a',{ai:1}));
  if(!opts.noParty&&typeof coopPartner==='function'){const cp=coopPartner();if(cp&&cp.loc===P.loc&&cp.cs){const a=actorFromSnap(cp.cs,cp.user+' ●','a');a.coop=1;allies.push(a);opts.coop=cp;}}
  C={allies,enemies:enemies.map(e=>e.side?e:(e.mon?actorFromMon(e):e)),round:0,order:[],oi:0,log:[],opts,ended:false,waiting:false,target:0,tactic:P.tactic||'free',inspected:{},startHp:P.hp,dmgDealt:0,dmgByP:0};
  for(const e of C.enemies)e.side='e';
  if(opts.ambush){for(const a of allies)a.fx.ambushed={d:1};clog('You were caught off guard!','bad');}
  for(const e of C.enemies)if(e.b&&e.b.includes('ambush')&&U.chance(0.4)){e.fx.ambusher={d:1};}
  clog(opts.title?`⚔ ${opts.title}`:`⚔ Encounter: ${C.enemies.map(e=>`${e.name} (Lv.${e.level})`).join(', ')}`,'head');
  if(typeof UI!=='undefined')UI.openCombat();
  newRound();
  if(typeof UI!=='undefined')UI.runCombat();
}
function clog(t,cls=''){if(!C)return;C.log.push([t,cls]);if(C.log.length>120)C.log.shift();}
function alive(list){return list.filter(a=>a.hp>0&&!a.fled);}
function foesOf(a){return alive(a.side==='a'?C.enemies:C.allies);}
function friendsOf(a){return alive(a.side==='a'?C.allies:C.enemies);}
function hasFx(a,k){return a.fx[k]&&a.fx[k].d>0;}
function addFx(a,k,d,v){if(STATUS[k]&&STATUS[k].bad)vfx('debuff',a);if(hasFx(a,'ward')&&STATUS[k]&&STATUS[k].bad){clog(`${a.name}'s ward blocks ${STATUS[k].n}.`);return;}if(a.boss&&(k==='stun'||k==='freeze')&&U.chance(0.6)){clog(`${a.name} resists ${STATUS[k].n}!`);return;}a.fx[k]={d,v:v||0};}
function initiative(a){let s=a.spd*(hasFx(a,'haste')?1.5:1)*(hasFx(a,'slow')?0.6:1)+U.ri(1,20);if(hasFx(a,'ambusher'))s+=1000;if(hasFx(a,'ambushed'))s-=1000;if(a.quickNext){s+=12;a.quickNext=0;}if(a.heavyNext){s-=12;a.heavyNext=0;}return s;}
function newRound(){C.round++;const all=alive(C.allies).concat(alive(C.enemies));C.order=all.map(a=>[a,initiative(a)]).sort((x,y)=>y[1]-x[1]).map(x=>x[0]);C.oi=0;
  // extra actions: hasted and enraged dragon bosses
  for(const a of all)if((a.boss&&a.b.includes('dragon')&&a.phase>=3)||hasFx(a,'haste')&&U.chance(0.35))C.order.push(a);}

/* process one actor; returns 'wait' | 'cont' | 'end' */
function combatStep(){
  if(!C||C.ended)return 'end';
  if(checkEnd())return 'end';
  if(C.oi>=C.order.length)newRound();
  const a=C.order[C.oi];
  if(!a||a.hp<=0||a.fled){C.oi++;return 'cont';}
  if(!a._started){a._started=true;if(!startTurn(a)){a._started=false;C.oi++;return checkEnd()?'end':'cont';}}
  if(a.isPlayer){C.waiting=true;return 'wait';}
  if(a.side==='a')allyAI(a);else enemyAI(a);
  C.acted=true;endTurn(a);C.oi++;
  return checkEnd()?'end':'cont';
}
function startTurn(a){ // returns false if turn is skipped
  for(const [k,dk] of [['poison','poison'],['burn','burn'],['bleed','bleed']])if(hasFx(a,k)){const d=Math.max(1,Math.round(a.mhp*STATUS[k].dot*(a.boss?0.25:1)));a.hp-=d;clog(`${a.name} suffers ${d} ${STATUS[k].n.toLowerCase()} damage.`,'dot');if(a.hp<=0){die(a);return false;}}
  if(hasFx(a,'regen')){const h=Math.round(a.mhp*0.07);a.hp=Math.min(a.mhp,a.hp+h);clog(`${a.name} regenerates ${h} HP.`,'heal');}
  if(a.b&&a.b.includes('regen')&&a.hp<a.mhp){const h=Math.round(a.mhp*0.04);a.hp=Math.min(a.mhp,a.hp+h);}
  if(a.sp<a.msp)a.sp=Math.min(a.msp,a.sp+Math.round(a.msp*0.05));if(a.mp<a.mmp&&a.mmp<999)a.mp=Math.min(a.mmp,a.mp+Math.round(a.mmp*0.03));
  for(const k in a.cd)if(a.cd[k]>0)a.cd[k]--;
  delete a.fx.defend;delete a.fx.dodge;delete a.fx.parry;
  if(hasFx(a,'stun')||hasFx(a,'freeze')){clog(`${a.name} is ${hasFx(a,'stun')?'stunned':'frozen'} and can't act!`,'dot');tickFx(a);a._started=false;return false;}
  return true;
}
function tickFx(a){for(const k in a.fx){if(['defend','dodge','parry'].includes(k))continue;a.fx[k].d--;if(a.fx[k].d<=0){delete a.fx[k];if(k==='shield')continue;}}}
function endTurn(a){tickFx(a);a._started=false;}
function checkEnd(){if(C.ended||C.cinema)return true;
  const pa=C.allies.find(x=>x.isPlayer);
  // the final battle: the first defeat is not the end
  if(C.opts.final&&C.sunfall&&!C.reborn&&pa&&pa.hp<=0){C.reborn=true;C.cinema=true;C.waiting=false;return true;}
  if(!alive(C.enemies).length){finishCombat('win');return true;}
  if(!pa||pa.hp<=0){finishCombat('lose');return true;}
  return false;}

/* ---------------- damage ---------------- */
function elemOf(att,sk){if(sk&&sk.e)return sk.e;if(att.e)return att.e;let best=null,bv=0;for(const e in att.el||{})if(att.el[e]>bv){bv=att.el[e];best=e;}return best;}
function hitRoll(att,def,kind,bonus=0){if(hasFx(def,'stealth')&&att.side!==def.side)bonus-=40;if(hasFx(att,'stealth'))return true;
  let eva=def.eva+(hasFx(def,'dodge')?35:0)-(hasFx(def,'root')?def.eva:0);if(hasFx(att,'blind'))bonus-=30;
  const p=kind==='mag'?95-eva*0.3+bonus*0.5:att.acc+bonus-eva;return U.r()*100<U.clamp(p,5,98);}
function damage(att,def,opts={}){
  const kind=opts.kind||'phys';const sk=opts.sk||null;const power=opts.power||1;
  const pa=att.patk!=null?att.patk:(att.atk||0),ma=att.matk!=null?att.matk:(att.atk||0);let base=kind==='mag'?ma:pa;if(opts.hybrid)base=(pa+ma)*0.62;
  const K=kConst(att.level);let dv=kind==='mag'?def.mdef:def.pdef*(1-(att.pen||0));if(hasFx(def,'sunder'))dv*=0.6;
  let d=base*power*K/(K+Math.max(0,dv));
  const e=kind==='mag'||opts.hybrid||sk&&sk.e?elemOf(att,sk):(att.e&&att.mon?att.e:null);
  let tag='';
  if(e){if((def.w||[]).includes(e)){d*=1.5;tag=' (weak!)';}if((def.r||[]).includes(e)){d*=0.5;tag=' (resisted)';}d*=1-Math.min(75,(def.res||{})[e]||0)/100;}
  if(!att.mon&&att.el)for(const x in att.el)if(x!==e)d*=1+att.el[x]*0.5;else d*=1+att.el[x];
  if(sk&&sk.m&&att.char)d*=1+mLv(att.char,sk.m)*0.006;
  if(att.race==='draconian'&&e==='fire')d*=1.15;if(att.race==='orc'&&att.hp<att.mhp*0.3)d*=1.15;
  if(hasFx(att,'resolve'))d*=1.3;if(hasFx(def,'resolve'))d*=0.75;
  if(hasFx(att,'might'))d*=1.25;if(kind==='mag'&&hasFx(att,'focus'))d*=1.4;if(hasFx(att,'frenzy'))d*=1.4;if(kind==='phys'&&hasFx(att,'bear'))d*=1.5;if(hasFx(att,'blessed'))d*=1.15;if(hasFx(att,'weaken'))d*=0.75;
  if(att.phase>=2&&att.boss&&!att.finalBoss)d*=1.2;
  if(e&&typeof evMod==='function')d*=evMod(e);
  if(hasFx(def,'marked'))d*=1.3;if(hasFx(def,'weaken'))d*=1.15;if(hasFx(def,'defend'))d*=0.5;if(hasFx(def,'fortify'))d*=0.6;if(hasFx(def,'bear'))d*=0.67;if(hasFx(def,'blessed'))d*=0.87;if(hasFx(def,'frenzy'))d*=1.2;
  // rows
  if(kind==='phys'&&!opts.ranged&&!att.reach&&!(sk&&sk.reach)&&!att.ranged&&att.mon!==1){if(att.row==='back')d*=0.5;if(def.row==='back'&&alive(def.side==='a'?C.allies:C.enemies).some(x=>x.row==='front'))d*=0.6;}
  if(att.mon&&kind==='phys'&&!att.b.includes('ranged')&&def.row==='back'&&alive(def.side==='a'?C.allies:C.enemies).some(x=>x.row==='front'))d*=0.6;
  if(hasFx(att,'ambusher')&&U.chance(1)){d*=1.5;}
  let crit=false;const cc=att.crit+(opts.crit||0)+(att.race==='darkelf'&&T.isNight(S.time)?10:0);
  if(hasFx(att,'stealth')||U.r()*100<cc){crit=true;d*=(att.critDmg||150)/100;if(hasFx(att,'stealth'))delete att.fx.stealth;}
  d*=U.rf(0.9,1.1);d=Math.max(1,Math.round(d));
  if(hasFx(def,'shield')){const ab=Math.min(def.fx.shield.v||0,d);def.fx.shield.v-=ab;d-=ab;if(ab)tag+=` [${ab} absorbed]`;if(def.fx.shield.v<=0)delete def.fx.shield;}
  return {d,crit,tag,e};
}
function floatFx(a,txt,kind){if(!C)return;(C.floats=C.floats||[]).push({a,txt,kind});if(kind==='miss')vfx('miss',a);}
function vfx(t,a,x){if(!C)return;(C.vfx=C.vfx||[]).push(Object.assign({t,a},x||{}));}
function applyHit(att,def,r,label){if(att.finalBoss&&def.side!==att.side)r.d=Math.max(1,Math.round(r.d*FINAL_DMG));def.hp-=r.d;
  if(def.finalBoss&&!C.reborn&&def.hp<def.mhp*0.5){def.hp=Math.round(def.mhp*0.5);if(!def.floored){def.floored=1;clog(`${def.name} reels, then lifts its hands to the broken sun. The sky begins to burn white.`,'boss');vfx('phase',def);}}vfx('hit',def,{s:att,e:r.e||'phys',crit:r.crit,melee:!att.ranged});floatFx(def,(r.crit?'✦':'')+r.d,r.crit?'crit':'dmg');C.dmgDealt+=att.side==='a'?r.d:0;if(att.isPlayer)C.dmgByP+=r.d;
  clog(`${att.name} ${label} ${def.name} for ${r.d}${r.crit?' CRITICAL':''}${r.tag}.`,att.side==='a'?(r.crit?'crit':'hit'):'hurt');
  if(att.steal||hasFx(att,'lifesteal')){const h=Math.round(r.d*((att.steal||0)+(hasFx(att,'lifesteal')?0.3:0)));if(h>0){att.hp=Math.min(att.mhp,att.hp+h);}}
  if(def.hp<=0)die(def,att);
  else if(def.hp>0&&hasFx(def,'counter')&&!att.ranged&&att.side!==def.side&&U.chance(0.7)){const c=damage(def,att,{power:0.8});att.hp-=c.d;clog(`${def.name} counters for ${c.d}!`,'crit');if(att.hp<=0)die(att,def);}
  if(def.boss&&def.hp>0)bossPhase(def);
}
function die(a,by){a.hp=0;vfx('death',a,{final:!!(a.finalBoss&&C.reborn)});if(a.side==='e'){clog(`${a.name} is defeated!`,'kill');}else clog(`${a.name} has fallen!`,'bad');
  if(a.side==='e'&&a.mon)a.killedBy=by&&by.isPlayer;}
function bossPhase(b){const pct=b.hp/b.mhp;if(b.phase===1&&pct<0.66){b.phase=2;vfx('phase',b);clog(`${b.name} becomes enraged!`,'boss');
    if(b.b.includes('undead')||b.id==='b_lich'){for(let i=0;i<2;i++)C.enemies.push(actorFromMon(makeMonster('skeleton',Math.round(b.level*0.8))));clog('Bones rise from the ground to defend their master!','boss');}
    if(b.id==='b_grubnak'||b.id==='b_foreman'){C.enemies.push(actorFromMon(makeMonster(b.id==='b_grubnak'?'goblin':'kobold',b.level-4)));clog('Reinforcements arrive!','boss');}}
  if(b.phase===2&&pct<0.33){b.phase=3;clog(`${b.name} is desperate. Its attacks grow wild!`,'boss');}}

/* ---------------- actions ---------------- */
function costOk(a,sk){const [mp,sp]=sk.c||[0,0];if(a.mp<mp||a.sp<sp)return false;if((a.cd[sk.id]||0)>0)return false;if(sk.gold&&a.isPlayer&&S.P.gold<sk.gold)return false;return true;}
function payCost(a,sk){const [mp,sp]=sk.c||[0,0];a.mp-=mp;a.sp-=sp;a.cd[sk.id]=(sk.cd||0)+1;if(sk.gold&&a.isPlayer)S.P.gold-=sk.gold;}
function basicAttack(a,t,mode){
  const magBasic=MAGIC_WT.includes(a.wt)&&a.matk>a.patk&&!a.mon;let power=1,acc=0,crit=0,sp=0,label='attacks';
  if(mode==='heavy'){power=1.6;acc=-15;sp=8;label='slams';a.heavyNext=1;}if(mode==='quick'){power=0.7;acc=15;crit=5;sp=3;label='quickly strikes';a.quickNext=1;}
  if(a.sp<sp){power=1;acc=0;}else a.sp-=sp;
  if(!hitRoll(a,t,magBasic?'mag':'phys',acc)){clog(`${a.name} ${label} ${t.name} but misses.`,'miss');return;}
  if(!magBasic&&hasFx(t,'parry')&&!a.ranged&&U.chance(0.45+mLv(t.char||{},'sword')*0.004)){const c=damage(t,a,{power:0.8});a.hp-=c.d;clog(`${t.name} parries and ripostes ${a.name} for ${c.d}!`,'crit');if(a.hp<=0)die(a,t);return;}
  const r=damage(a,t,{kind:magBasic?'mag':'phys',power,crit,ranged:magBasic||a.ranged});applyHit(a,t,r,magBasic?'blasts':label);
  if(a.st&&U.chance(a.st[1])&&t.hp>0){addFx(t,a.st[0],a.st[2]);clog(`${t.name} is ${STATUS[a.st[0]].n.toLowerCase()}.`,'dot');}
  if(a.char&&a.isPlayer){gainMastery(a.wt,mode==='heavy'?4:3);}
}
function useSkill(a,id,tIdx){
  const sk=Object.assign({id},SKILLS[id]);if(!costOk(a,sk)){if(a.isPlayer)clog('Not enough resources or on cooldown.','bad');return false;}payCost(a,sk);
  const foes=foesOf(a),friends=friendsOf(a);let targets=[];
  if(sk.tg==='enemy')targets=[foes[tIdx]||foes[0]];else if(sk.tg==='all')targets=foes;else if(sk.tg==='self')targets=[a];else if(sk.tg==='allies')targets=friends;
  else if(sk.tg==='ally')targets=[tIdx!=null&&friends[tIdx]?friends[tIdx]:friends.slice().sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0]];
  else if(sk.tg==='pet'){const pet=friends.find(f=>f.isComp);if(!pet){clog('You have no summon in battle.','bad');a.mp+=sk.c[0];a.sp+=sk.c[1];a.cd[id]=0;return false;}targets=[pet];}
  else if(sk.tg==='dead')targets=C.allies.filter(x=>x.hp<=0).slice(0,1);
  targets=targets.filter(Boolean);
  clog(`${a.name} uses ${sk.n}!`,'skill');
  if(sk.m&&a.isPlayer)gainMastery(sk.m,sk.k==='mag'||sk.k==='heal'?5:4);else if(a.isPlayer&&(sk.k==='phys'))gainMastery(a.wt,4);
  if(sk.k==='phys'||sk.k==='mag'){
    for(const t of targets){const hits=sk.hits||1;for(let i=0;i<hits&&t.hp>0;i++){
      if(!hitRoll(a,t,sk.k,sk.acc||0)){clog(`${a.name}'s ${sk.n} misses ${t.name}.`,'miss');continue;}
      let power=sk.p;if(id==='rampage')power*=1+(1-a.hp/a.mhp);if(id==='coin_toss')power+=a.char?stats(a.char).attr.luck*0.03:0;if(id==='judgement'&&t.cat==='undead')power*=1.6;
      const r=damage(a,t,{kind:sk.k,power,crit:sk.crit||0,sk,hybrid:sk.hybrid,ranged:sk.k==='mag'||a.ranged});applyHit(a,t,r,'hits');
      if(sk.drain){const h=Math.round(r.d*sk.drain);a.hp=Math.min(a.mhp,a.hp+h);clog(`${a.name} drains ${h} HP.`,'heal');}
      if(sk.st&&t.hp>0&&U.chance(sk.st[1])){addFx(t,sk.st[0],sk.st[2]);clog(`${t.name} is ${STATUS[sk.st[0]].n.toLowerCase()}!`,'dot');}}}
    if(sk.self){const s=Math.round(a.mhp*sk.self);a.hp=Math.max(1,a.hp-s);}
  } else if(sk.k==='heal'){
    for(const t of targets){if(sk.tg==='dead'){t.hp=Math.round(t.mhp*0.5);clog(`${t.name} is revived!`,'heal');continue;}
      let h=(sk.p<=1&&!sk.m&&sk.tg!=='ally')?t.mhp*sk.p:(a.matk*0.9+(a.char?stats(a.char).attr.wis*2:a.level*2))*sk.p;if(sk.m&&a.char)h*=1+mLv(a.char,sk.m)*0.006;h=Math.round(h);
      if(h>0){t.hp=Math.min(t.mhp,t.hp+h);clog(`${t.name} recovers ${h} HP.`,'heal');floatFx(t,'+'+h,'heal');vfx('heal',t);}
      if(sk.mpRegen){const m=Math.round(t.mmp*sk.mpRegen/100);t.mp=Math.min(t.mmp,t.mp+m);clog(`${t.name} restores ${m} MP.`,'heal');}
      if(sk.cleanse)for(const k in t.fx)if(STATUS[k]&&STATUS[k].bad)delete t.fx[k];}
  } else if(sk.k==='buff'){
    if(sk.self){const s=Math.round(a.mhp*sk.self);a.hp=Math.max(1,a.hp-s);clog(`${a.name} pays ${s} HP.`,'dot');}
    for(const t of targets){vfx('buff',t);const [k,,d]=sk.st;const v=k==='shield'?Math.round(Math.max(a.mhp*0.22,a.matk*2.2)):0;t.fx[k]={d:d+1,v};if(k==='taunt')t.fx.taunt={d:d+1};}
    clog(`${targets.map(t=>t.name).join(', ')} ${targets.length>1?'are':'is'} ${STATUS[sk.st[0]].n.toLowerCase()}.`,'buff');
  } else if(sk.k==='debuff'){
    for(const t of targets){if(U.chance(sk.st[1])){addFx(t,sk.st[0],sk.st[2]);clog(`${t.name} is ${STATUS[sk.st[0]].n.toLowerCase()}.`,'dot');}else clog(`${t.name} resists.`,'miss');}
  } else if(sk.k==='util'){
    if(id==='bribe'){const t=targets[0];const cost=t.level*12;if(t.cat!=='humanoid'||t.boss||!t.mon){clog(`${t.name} cannot be bribed.`,'miss');}else if(S.P.gold<cost){clog(`You need ${cost}g to bribe.`,'bad');}else{S.P.gold-=cost;t.fled=1;t.bribed=1;clog(`${t.name} pockets ${cost}g and walks away.`,'buff');}}
  } else if(sk.k==='summon'){
    if(sk.undead){for(let i=0;i<sk.undead;i++){const m=actorFromMon(makeMonster('skeleton',Math.round(a.level*0.85)),'a');m.name='Raised Skeleton';m.mhp=Math.round(m.mhp*0.7);m.hp=m.mhp;m.row='front';m.summoned=1;C.allies.push(m);vfx('summon',m);}clog('The dead rise to serve!','buff');}
    if(sk.turret){for(let i=0;i<sk.turret;i++){const m=actorFromMon(makeMonster('construct',Math.round(a.level*0.8)),'a');m.name='Clockwork Turret';m.mhp=Math.round(m.mhp*0.6);m.hp=m.mhp;m.row='back';m.b=['ranged'];m.summoned=1;C.allies.push(m);vfx('summon',m);}clog('Clockwork turrets whir to life!','buff');}
    if(sk.merc){if(S.P.gold<50){clog('You need 50 gold.','bad');}else{S.P.gold-=50;const m=actorFromMon(makeMonster('bandit',a.level),'a');m.name='Hired Sellsword';m.row='front';m.summoned=1;C.allies.push(m);clog('A sellsword joins the fight for 50g.','buff');}}
    if(id==='twin_call'||sk.legion){const out=C.allies.filter(x=>x.isComp).map(x=>x.ref);const cs=S.P.comps.filter(c=>!out.includes(c.id)).slice(0,sk.legion?6:1);for(const c of cs){C.allies.push(compActor(c));clog(`${c.name} answers your call!`,'buff');}if(!cs.length)clog('No other bonded creatures answer.','miss');}
  }
  return true;
}
function playerAction(act,arg,tIdx){
  if(!C||!C.waiting)return;const a=C.order[C.oi];if(!a||!a.isPlayer)return;
  const foes=foesOf(a);const t=foes[tIdx!=null?tIdx:C.target]||foes[0];let used=true;
  switch(act){
    case 'attack':basicAttack(a,t);break;case 'heavy':basicAttack(a,t,'heavy');break;case 'quick':basicAttack(a,t,'quick');break;
    case 'defend':a.fx.defend={d:1};a.sp=Math.min(a.msp,a.sp+Math.round(a.msp*0.15));clog(`${a.name} braces for impact.`,'buff');gainMastery('shield',2);break;
    case 'dodge':if(a.sp<6){clog('Too exhausted to dodge.','bad');used=false;break;}a.sp-=6;a.fx.dodge={d:1};clog(`${a.name} readies to dodge.`,'buff');break;
    case 'parry':a.fx.parry={d:1};clog(`${a.name} takes a parrying stance.`,'buff');break;
    case 'counter':if(a.sp<10){clog('Not enough stamina.','bad');used=false;break;}a.sp-=10;a.fx.counter={d:2};a.fx.defend={d:1};clog(`${a.name} waits for an opening to counter.`,'buff');break;
    case 'skill':used=useSkill(a,arg,tIdx!=null?tIdx:C.target);break;
    case 'item':{const P=S.P;const it=P.inv[arg];if(!it){used=false;break;}const d=ITEMS[it.k];
      if(d.escape){invRemove(P,it.k);clog('You vanish in a cloud of smoke!','buff');finishCombat('fled');return;}
      if(d.bomb){invRemove(P,it.k);for(const e of foes){const r=Math.round(d.dmg*(1+P.level*0.25));e.hp-=r;clog(`${e.name} is engulfed in flames for ${r}!`,'hit');if(e.hp<=0)die(e,a);}break;}
      if(d.buff){invRemove(P,it.k);a.fx[d.buff]={d:4};clog(`${a.name} drinks ${d.n}.`,'buff');break;}
      if(d.revive){const dead=C.allies.find(x=>x.hp<=0&&!x.isPlayer);if(!dead){clog('No fallen ally to revive.','bad');used=false;break;}invRemove(P,it.k);dead.hp=Math.round(dead.mhp*0.4);clog(`${dead.name} is revived!`,'heal');break;}
      P.hp=a.hp;P.mp=a.mp;P.sp=a.sp;if(!useItem(arg,true)){used=false;break;}const hp0=a.hp;a.hp=Math.min(a.mhp,P.hp);a.mp=Math.min(a.mmp,P.mp);a.sp=Math.min(a.msp,P.sp);if(d.cure)for(const k of ['poison','burn','bleed'])delete a.fx[k];clog(`${a.name} uses ${d.n}${a.hp>hp0?` (+${a.hp-hp0} HP)`:''}.`,'heal');break;}
    case 'summon':{const P=S.P;const c=P.comps.find(c=>c.id===(arg||P.activeComp));if(!c){clog('No companion.','bad');used=false;break;}if(C.allies.some(x=>x.ref===c.id&&x.hp>0)){clog(`${c.name} is already fighting.`,'bad');used=false;break;}
      const cost=15+Math.round(c.level*0.5);if(a.mp<cost){clog(`Summoning costs ${cost} MP.`,'bad');used=false;break;}a.mp-=cost;const ca=compActor(c);C.allies.push(ca);vfx('summon',ca);clog(`${a.name} summons ${c.name} (Lv.${c.level})!`,'buff');gainMastery('summoning',5);break;}
    case 'tame':{const P=S.P;if(!canTame()){clog('You lack the skill to bond with creatures.','bad');used=false;break;}const M=MONSTERS[t.id];if(!t.mon||!M||!M.tame||t.boss){clog(`${t.name} cannot be bonded.`,'bad');used=false;break;}
      if(t.hp>t.mhp*0.3){clog(`${t.name} is too strong-willed. Weaken it below 30% first.`,'bad');used=false;break;}if(P.comps.length>=8){clog('You can bond with at most 8 creatures.','bad');used=false;break;}
      const ch=0.3+mLv(P,'summoning')*0.006+(1-t.hp/t.mhp)*0.3+(P.cls==='summoner'||P.adv==='beastmaster'?0.15:0)-(t.level-P.level)*0.03;
      if(U.chance(U.clamp(ch,0.05,0.9))){t.fled=1;t.tamed=1;const sp=M.tame;const c={id:U.uid(),sp,name:SPECIES[sp].n,level:Math.max(1,t.level-2),xp:0};P.comps.push(c);if(!P.activeComp)P.activeComp=c.id;clog(`✨ ${t.name} bonds with you! ${c.name} joins your companions.`,'crit');gainMastery('summoning',15);checkAch();}
      else clog(`${t.name} breaks free of your bond!`,'miss');break;}
    case 'row':a.row=a.row==='front'?'back':'front';S.P.row=a.row;clog(`${a.name} moves to the ${a.row} row.`,'buff');break;
    case 'tactic':C.tactic=arg;S.P.tactic=arg;clog(`Party tactic: ${({free:'Free fighting',focus:'Focus my target',defensive:'Defensive'})[arg]}.`,'buff');return;
    case 'escape':{if(C.opts.noEscape){clog('There is no escape from this fight!','bad');used=false;break;}const fs=foes.reduce((m,e)=>Math.max(m,e.spd),0);const ch=U.clamp(0.45+(a.spd-fs)*0.02-(foes.some(e=>e.boss)?0.3:0),0.08,0.92);
      if(U.chance(ch)){clog('You escape!','buff');finishCombat('fled');return;}clog('You fail to escape!','bad');break;}
    case 'surrender':clog('You yield the duel.','bad');finishCombat('lose');return;
  }
  if(!used)return;
  C.waiting=false;endTurn(a);C.oi++;
  if(typeof UI!=='undefined')UI.runCombat(true);
}

/* ---------------- AI ---------------- */
function pickTarget(a,foes){
  const taunt=foes.find(f=>hasFx(f,'taunt'));if(taunt&&U.chance(0.85))return taunt;
  const front=foes.filter(f=>f.row==='front');const canBack=a.ranged||a.reach||(a.b&&(a.b.includes('ranged')||a.b.includes('caster')))||a.boss;
  const pool=(front.length&&!canBack)?front:foes;
  if(a.b&&a.b.includes('aggressive'))return pool.slice().sort((x,y)=>x.hp-y.hp)[0];
  if(a.side==='a'){if(C.tactic==='focus'){const t=foes[C.target];if(t)return t;}return pool.slice().sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0];}
  // enemies: prefer player a bit, healers, low hp
  return U.wpick(pool,f=>1+(f.isPlayer?0.6:0)+(f.role==='healer'?0.4:0)+(1-f.hp/f.mhp));
}
function aiChooseSkill(a,filter){const alone=friendsOf(a).filter(f=>f.hp>0).length<=1;const ids=(a.skills||[]).filter(id=>{const s=SKILLS[id];if(s&&alone&&s.st&&s.st[0]==='taunt')return false;return s&&filter(s,id)&&costOk(a,Object.assign({id},s));});if(!ids.length)return null;
  return ids.sort((x,y)=>(SKILLS[y].p||0)*(SKILLS[y].tg==='all'?1.5:1)-(SKILLS[x].p||0)*(SKILLS[x].tg==='all'?1.5:1))[0];}
function allyAI(a){
  const foes=foesOf(a),friends=friendsOf(a);if(!foes.length)return;
  if(a.mon){ // companion/summon
    const t=pickTarget(a,foes);if(a.b&&a.b.includes('healer')&&friends.some(f=>f.hp<f.mhp*0.5)&&U.chance(0.5)){const f=friends.sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0];const h=Math.round(a.matk*1.2);f.hp=Math.min(f.mhp,f.hp+h);clog(`${a.name} heals ${f.name} for ${h}.`,'heal');return;}
    monsterAttack(a,t);return;}
  const low=friends.slice().sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0];const def=C.tactic==='defensive';
  if(low&&low.hp<low.mhp*(def?0.7:0.5)){const h=aiChooseSkill(a,s=>s.k==='heal'&&s.tg!=='dead');if(h){useSkill(a,h,friends.indexOf(low));return;}}
  const dead=C.allies.find(x=>x.hp<=0&&!x.summoned);if(dead){const r=aiChooseSkill(a,s=>s.tg==='dead');if(r){useSkill(a,r);return;}}
  if(a.role==='tank'&&foes.length>1&&!hasFx(a,'taunt')){const tt=aiChooseSkill(a,(s,id)=>id==='taunt');if(tt){useSkill(a,tt);return;}}
  if(def&&a.role==='tank'&&U.chance(0.3)){a.fx.defend={d:1};clog(`${a.name} guards the party.`,'buff');return;}
  if(U.chance(0.25)){const b=aiChooseSkill(a,s=>s.k==='buff'&&s.tg!=='pet'&&!(s.st&&friends.every(f=>hasFx(f,s.st[0]))));if(b){useSkill(a,b);return;}}
  if(a.role==='healer'&&U.chance(def?0.6:0.3)&&friends.some(f=>f.hp<f.mhp*0.8)){const h=aiChooseSkill(a,s=>s.k==='heal'&&s.tg!=='dead');if(h){useSkill(a,h,friends.indexOf(low));return;}}
  if(U.chance(0.65)){const o=aiChooseSkill(a,s=>(s.k==='phys'||s.k==='mag')&&(s.tg!=='all'||foes.length>1));const t=pickTarget(a,foes);if(o){useSkill(a,o,foes.indexOf(t));return;}}
  basicAttack(a,pickTarget(a,foes));
}
function enemyAI(a){
  const foes=foesOf(a),friends=friendsOf(a);if(!foes.length)return;
  if(a.finalBoss&&!C.reborn&&a.floored){clog(`${a.name} raises the shattered sun overhead.`,'boss');clog('S U N F A L L','boss');C.sunfall=1;C.sunRound=C.round;vfx('phase',a);for(const f of foes){vfx('hit',f,{s:a,e:'holy',crit:true});f.fx={};f.hp=0;die(f,a);}return;}
  if(!a.mon){ // hostile adventurer (pvp)
    if(a.hp<a.mhp*0.4){const h=aiChooseSkill(a,s=>s.k==='heal');if(h&&U.chance(0.6)){useSkill(a,h,friends.indexOf(a));return;}}
    if(U.chance(0.2)){const b=aiChooseSkill(a,s=>s.k==='buff'&&s.tg!=='pet'&&!(s.st&&hasFx(a,s.st[0])));if(b){useSkill(a,b);return;}}
    if(U.chance(0.65)){const o=aiChooseSkill(a,s=>s.k==='phys'||s.k==='mag');if(o){useSkill(a,o,0);return;}}
    basicAttack(a,foes[0]);return;}
  const b=a.b||[];
  if(b.includes('surrender')&&a.hp<a.mhp*0.22&&!a.boss&&U.chance(0.35)){a.fled=1;a.surrendered=1;clog(`${a.name} throws down their weapon and begs for mercy. You let them go.`,'buff');return;}
  if(b.includes('coward')&&a.hp<a.mhp*0.2&&!a.boss&&U.chance(0.3)){a.fled=1;clog(`${a.name} flees in terror!`,'miss');return;}
  if(b.includes('healer')&&U.chance(0.5)){const f=friends.filter(f=>f.hp<f.mhp*0.5).sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0];if(f){const h=Math.round(a.matk*1.3);f.hp=Math.min(f.mhp,f.hp+h);clog(`${a.name} heals ${f.name} for ${h}.`,'heal');return;}}
  const t=pickTarget(a,foes);
  if(a.boss){
    a.bt=(a.bt||0)+1;
    if(a.bt%3===0){const p=a.phase>=2&&!a.finalBoss?1.0:0.8;clog(`${a.name} unleashes a devastating ${a.e?a.e+' ':''}${b.includes('dragon')?'breath':'wave'}!`,'boss');
      for(const f of foes){if(!hitRoll(a,f,'mag'))continue;const r=damage(Object.assign({},a,{matk:Math.max(a.atk,a.matk)}),f,{kind:'mag',power:p});applyHit(a,f,r,'scorches');if(a.st&&f.hp>0&&U.chance(a.st[1]))addFx(f,a.st[0],a.st[2]);}return;}
    if(b.includes('dragon')&&a.bt%4===1&&a.phase>=2){a.fx.dodge={d:1};clog(`${a.name} takes to the air!`,'boss');}
  }
  if((b.includes('caster')||(a.e&&U.chance(0.3)))&&U.chance(0.6)){if(!hitRoll(a,t,'mag')){clog(`${a.name}'s spell misses ${t.name}.`,'miss');floatFx(t,'miss','miss');return;}const r=damage(a,t,{kind:'mag',power:1.15});applyHit(a,t,r,'casts at');if(a.st&&t.hp>0&&U.chance(a.st[1])){addFx(t,a.st[0],a.st[2]);clog(`${t.name} is ${STATUS[a.st[0]].n.toLowerCase()}.`,'dot');}return;}
  monsterAttack(a,t);
}
function monsterAttack(a,t){
  const b=a.b||[];let power=1,label='attacks';
  if(b.includes('brute')&&U.chance(0.3)){power=1.6;label='smashes';}
  if(b.includes('pack')){const n=alive(a.side==='e'?C.enemies:C.allies).filter(x=>x.id===a.id).length;power*=1+(n-1)*0.1;}
  if(hasFx(a,'ambusher'))label='ambushes';
  if(!hitRoll(a,t,'phys',power>1?-12:0)){clog(`${a.name} ${label} ${t.name} but misses.`,'miss');floatFx(t,'miss','miss');return;}
  if(hasFx(t,'parry')&&U.chance(0.45+mLv(t.char||{},'sword')*0.004)){const c=damage(t,a,{power:0.9});a.hp-=c.d;clog(`${t.name} parries and counters ${a.name} for ${c.d}!`,'crit');if(a.hp<=0)die(a,t);return;}
  const r=damage(Object.assign({},a,{patk:a.atk||a.patk}),t,{kind:'phys',power,ranged:b.includes('ranged')});applyHit(a,t,r,label);
  if(a.st&&t.hp>0&&U.chance(a.st[1])){addFx(t,a.st[0],a.st[2]);clog(`${t.name} is ${STATUS[a.st[0]].n.toLowerCase()}.`,'dot');}
}

/* ---------------- end of combat ---------------- */
// a battle must ALWAYS reach its result screen: even if bookkeeping below fails, the summary exists and Continue appears
function finishCombat(result){
  if(C.ended)return;C.ended=true;C.result=result;C.summary=[];
  try{finishCombatInner(result);}catch(e){console.error('finishCombat',e);if(!C.summary.length)C.summary.push(result==='win'?'Victory!':result==='lose'?'You were defeated.':'You got away.');if(typeof UI!=='undefined')UI.combatEnded();}}
function finishCombatInner(result){
  const P=S.P,o=C.opts;const pa=C.allies.find(x=>x.isPlayer)||{hp:P.hp,mp:P.mp,sp:P.sp};
  P.hp=Math.max(result==='lose'?0:1,Math.round(pa.hp));P.mp=Math.max(0,Math.round(pa.mp));P.sp=Math.max(0,Math.round(pa.sp));
  // party members' hp
  for(const al of C.allies)if(al.char&&!al.isPlayer){al.char.hpPct=U.clamp(al.hp/al.mhp,0.05,1);if(al.hp<=0)al.char.hpPct=0.2;}
  const party=partyMembers();const size=1+party.length;
  if(o.type==='pvp'||o.type==='duel'||o.type==='arena'||o.type==='tourney'||o.type==='wpvp'||o.type==='rpvp'){pvpEnd(result);if(result==='lose')P.hp=Math.max(1,Math.round(stats(P).mhp*0.3));if(typeof UI!=='undefined')UI.combatEnded();return;}
  if(result==='win'){
    let xp=0,gold=0,items=[];const dm=DIFFS[P.diff];
    for(const e of C.enemies){if(!e.mon||e.summoned||e.tamed)continue;const M=MONSTERS[e.id];const share=e.bribed?0:e.surrendered||e.fled?0.5:1;
      xp+=monXp(e.level,M)*share*(e.elite?3:1);if(e.fled&&!e.surrendered)continue;
      const lt=rollLoot(e.id,e.level,stats(P).attr.luck,dm.loot*(e.elite?3:1)*(1+stats(P).goldFind));gold+=Math.round(lt.gold*share);if(!e.bribed&&!e.surrendered)items.push(...lt.items);
      if(!e.fled){P.stats.kills++;P.kills[e.id]=(P.kills[e.id]||0)+1;questKill(e.id,o.loc||P.loc,e.elite);if(e.boss&&!o.worldBoss){P.stats.bosses++;storyCheck('boss',e.id);checkFactionChain('boss',e.id);}}
      if(e.surrendered){const f=S.control[P.loc];if(f==='horde')addRep('horde',1);}}
    const lv=C.enemies.reduce((m,e)=>Math.max(m,e.level),1);const gap=lv-P.level;xp*=gap<-8?0.25:gap<-4?0.6:gap>4?1.25:1;
    const myXp=Math.round(xp*(size>1?1.25/size:1));gold=Math.round(gold);const myGold=Math.round(gold/size);
    gainXp(myXp);P.gold+=myGold;C.summary.push(`+${U.fmt(myXp)} XP`,`+${U.fmt(myGold)} gold`);
    if(o.coop){coopReward(myXp,myGold);C.summary.push(`${o.coop.user} earns their share too`);}
    for(const n of party){npcGainXp(n,xp*1.25/size);n.gold+=myGold;n.kills+=C.enemies.length;remember(n,null,1);}
    // loot distribution
    let rr=Math.floor(U.r()*size);
    for(const it of items){const idx=(rr++)%size;const who=idx===0?'P':party[idx-1].id;
      if(who==='P'){if(P.inv.length<60){invAdd(P,isGear(it)?it:it.k,it.q||1);C.summary.push({html:`🎁 ${rarityName(it)}${it.q>1?' ×'+it.q:''}`,r:isGear(it)?it.r:0});if(isGear(it)&&it.r>=3)BUS.emit('player_loot',{it});}}
      else{const n=npc(who);if(isGear(it)){if(!npcConsiderEquip(n,it))n.inv.push(it);C.summary.push({html:`${E(n.user)} received ${rarityName(it)}`,r:it.r});}else{const e=n.inv.find(x=>x.k===it.k);if(e)e.q+=it.q;else n.inv.push({k:it.k,q:it.q});}}}
    // companions xp
    for(const al of C.allies)if(al.isComp){const c=P.comps.find(c=>c.id===al.ref);if(c)compGainXp(c,Math.round(xp*0.5));}
    if(P.party.length&&U.chance(0.25))BUS.emit('party_banter',{win:true});
    if(o.onWin)o.onWin();
    if(o.final)BUS.emit('final_win',{});
  } else if(result==='lose'){
    if(o.onLose)o.onLose();
    if(o.type==='trial'){P.hp=Math.max(1,Math.round(stats(P).mhp*0.25));C.summary.push('The champion lowers their blade. "Train harder, and return."');}
    else{const r=playerDeath();C.summary.push(r==='perma'?'Your hero has died.':'You were defeated.');C.perma=r==='perma';}
  } else C.summary.push('You got away.');
  if(o.worldBoss)worldBossEnd(result);
  if(o.dungeon&&result==='win')dungeonProgress();
  if(o.dungeon&&result!=='win')P.dungeon=null;
  checkAch();
  if(typeof UI!=='undefined')UI.combatEnded();
}
function pvpEnd(result){const P=S.P,o=C.opts,n=o.opp;C.summary=[];
  const real=o.type==='rpvp';const ref=real?{pvp:o.rpvp}:n;
  if(result==='win'){P.pvp.w++;if(!real){eloUpdate(P,n);n.pvp.l++;remember(n,`Lost a ${o.type==='tourney'?'tournament match':'duel'} to me`,n.tr.arrog>0.5?-6:2);if(n.tr.arrog>0.6&&!n.rivals.includes('P'))n.rivals.push('P');hist(n,`Lost a duel to ${P.user}`);}
    else{P.pvp.r+=Math.round(32*(1-1/(1+Math.pow(10,(o.rpvp.r-P.pvp.r)/400))));}
    P.fame+=10;C.summary.push('Victory!',`Rating: ${P.pvp.r}`);gainXp(Math.round(monXp(n?n.level:P.level)*0.5));
    if(o.type==='wpvp'){const g=Math.round(n.gold*0.05);n.gold-=g;P.gold+=g;C.summary.push(`Bounty: ${g}g`);}
    if(o.type==='tourney')tourneyPlayerResult(true);
  } else {P.pvp.l++;if(!real){eloUpdate(n,P);n.pvp.w++;remember(n,`Beat me in a ${o.type==='tourney'?'tournament match':'duel'}`,1);hist(n,`Defeated ${P.user} in a duel`);}
    else{P.pvp.r-=Math.round(32*(1/(1+Math.pow(10,(o.rpvp.r-P.pvp.r)/400))));}
    C.summary.push('Defeat.',`Rating: ${P.pvp.r}`);if(o.type==='tourney')tourneyPlayerResult(false);
    if(o.type==='wpvp'){const g=Math.round(P.gold*0.05);P.gold-=g;if(n)n.gold+=g;C.summary.push(`Lost ${g}g to ${n.user}`);}}
  if(!real&&n)BUS.emit('pvp_result',{n,won:result==='win',type:o.type});
  checkAch();
}
/* dungeons */
function enterDungeon(){const P=S.P,L=LOCS[P.loc];P.dungeon={loc:P.loc,floor:1,floors:L.floors||3};log(`You descend into ${L.n}. (${P.dungeon.floors} floors and a boss)`,'head');dungeonFloor();}
function dungeonFloor(){const P=S.P,D=P.dungeon;if(!D)return;const L=LOCS[D.loc];const dm=DIFFS[P.diff].m;
  if(D.floor>D.floors){if(L.boss==='b_shattered'){startFinalBattle(true);return;}const b=makeMonster(L.boss,L.lv[1]+2,{diff:dm});startCombat([b],{type:'pve',dungeon:true,boss:true,loc:D.loc,title:`BOSS: ${b.name}`});return;}
  const n=U.ri(2,3);const en=[];for(let i=0;i<n;i++)en.push(makeMonster(U.pick(L.mon),U.ri(L.lv[0],L.lv[1])+D.floor-1,{diff:dm}));
  startCombat(en,{type:'pve',dungeon:true,loc:D.loc,title:`${L.n} — Floor ${D.floor}/${D.floors}`});}
function dungeonProgress(){const P=S.P,D=P.dungeon;if(!D)return;
  if(D.floor>D.floors){const L=LOCS[D.loc];P.stats.dungeons++;P.fame+=L.lv[1]*2;log(`🏰 You cleared ${L.n}!`,'epic');for(const q of P.quests)if(q.type==='dungeon'&&q.loc===D.loc&&!q.done){q.done=true;q.prog=1;log(`Quest ready: ${q.n}`,'good');}
    for(const n of partyMembers()){n.dung++;n.boss++;hist(n,`Cleared ${L.n} with ${P.user}`);remember(n,`Cleared ${L.n} together`,6);}
    if(L.lv[0]>=20)news(`${[P.user,...partyMembers().map(n=>n.user)].join(', ')} cleared ${L.n}.`,'dungeon');BUS.emit('player_dungeon',{loc:D.loc});P.dungeon=null;checkAch();return;}
  D.floor++;D.ready=true;}
/* world boss */
function joinWorldBoss(){const P=S.P,B=S.boss;if(!B||B.loc!==P.loc)return;const m=makeMonster(B.id,B.lvl,{diff:DIFFS[P.diff].m});m.hp=Math.max(1,Math.round(B.hp/B.mhp*m.mhp));m.mhp=m.mhp;
  // raid allies: online NPCs present join the fight as allies
  const raiders=(S.byLoc[P.loc]||[]).filter(n=>online(n)&&!n.inParty&&n.level>=B.lvl-25).slice(0,3);
  startCombat([m],{type:'pve',worldBoss:true,loc:P.loc,title:`WORLD BOSS: ${m.name}`,raiders});
  for(const n of raiders){const a=actorFromChar(n,'a',{ai:1});a.raider=1;C.allies.push(a);}
  if(raiders.length)clog(`${raiders.map(r=>r.user).join(', ')} fight alongside you!`,'buff');
  C.bossStartHp=m.hp;C.bossScale=B.mhp/m.mhp;}
function worldBossEnd(result){const P=S.P,B=S.boss;if(!B)return;const m=C.enemies[0];const dealt=Math.max(0,(C.bossStartHp-Math.max(0,m.hp)))*C.bossScale;B.hp-=dealt;B.contrib.P=(B.contrib.P||0)+dealt;
  P.stats.worldBossDmg=(P.stats.worldBossDmg||0)+dealt;
  if(m.hp<=0||B.hp<=0){killBoss('P');}else log(`You dealt ${U.fmt(dealt)} damage to ${MONSTERS[B.id].n}. (${Math.round(B.hp/B.mhp*100)}% HP remains)`,'boss');}
BUS.on((type,d)=>{if(type!=='player_boss_reward')return;const P=S.P;const {rank,M,B,lastHit}=d;P.stats.worldBoss++;P.stats.bosses++;P.fame+=Math.round(B.lvl*(rank<=3?8:3));
  gainXp(Math.round(monXp(B.lvl,M)/Math.max(3,rank)));const lt=rollLoot(B.id,B.lvl,stats(P).attr.luck,rank<=3?2:1);P.gold+=lt.gold;for(const it of lt.items)invAdd(P,isGear(it)?it:it.k,it.q||1);
  if(M.cat==='dragon')P.flags.slew_dragon=1;
  log(`World boss defeated! You ranked #${rank} in damage${lastHit==='P'?' and landed the final blow':''}. Loot: ${lt.items.map(itemName).join(', ')||'gold'} (+${lt.gold}g)`,'epic');checkAch();});

/* ---------- the final battle ---------- */
var FINAL_HP=1.9,FINAL_DMG=0.5;
function startFinalBattle(inDungeon){const P=S.P;const b=makeMonster('b_shattered',Math.max(P.level+2,95),{diff:DIFFS[P.diff].m});b.finalBoss=1;b.name='The Shattered One';b.mhp=b.hp=Math.round(b.mhp*FINAL_HP);
  startCombat([b],{type:'pve',dungeon:!!inDungeon,boss:true,final:true,noEscape:true,loc:'spire',title:'FINAL BATTLE: The Shattered One'});
  clog('The sky tears open. The broken sun turns its gaze on you.','boss');}
function finalRebirth(){if(!C)return;C.cinema=false;C.finalPhase=2;
  for(const a of C.allies){if(a.summoned&&a.hp<=0)continue;a.hp=a.mhp;a.mp=a.mmp;a.sp=a.msp;a.cd={};a.fx={};a._started=false;vfx('heal',a);}
  // no gifts: the hero simply stands back up. The one mercy is that the boss keeps the wounds you gave it.
  const b=C.enemies.find(e=>e.finalBoss);if(b){b.phase=3;b.fx={};b.enraged=1;}
  clog('Not while I still draw breath.','crit');clog(`You stand back up at full strength. ${b?b.name+' still bears every wound you gave it ('+Math.round(b.hp/b.mhp*100)+'% left), but it is furious.':''}`,'buff');
  newRound();}
