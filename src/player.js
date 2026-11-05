/* ETERNAL REALMS — player character systems */
'use strict';
const DIFFS = {casual:{n:'Casual',m:0.8,loot:1,xpLoss:0,goldLoss:0,d:'Weaker monsters, no death penalty.'},normal:{n:'Normal',m:1,loot:1,xpLoss:0.1,goldLoss:0.1,d:'Balanced. Death costs 10% gold and some experience.'},
  veteran:{n:'Veteran',m:1.25,loot:1.25,xpLoss:0.2,goldLoss:0.15,d:'Stronger monsters, better loot, harsher deaths.'},ironman:{n:'Ironman',m:1.25,loot:1.3,xpLoss:0,goldLoss:0,perma:1,d:'Veteran rules. Death is permanent: your hero goes to the Hall of the Fallen.'}};
const REP_TITLES=[[90,'Exalted'],[60,'Revered'],[35,'Honored'],[12,'Friendly'],[-11,'Neutral'],[-35,'Unfriendly'],[-60,'Hostile'],[-101,'Hated']];
function repTitle(v){for(const [m,n] of REP_TITLES)if(v>=m)return n;return 'Hated';}
function log(txt,cls=''){if(!S||!S.P)return;S.P.log.push([S.time,txt,cls]);if(S.P.log.length>160)S.P.log.splice(0,S.P.log.length-160);if(typeof UI!=='undefined'&&UI.onLog)UI.onLog(txt,cls);}
function toast(txt,cls){if(typeof UI!=='undefined'&&UI.toast)UI.toast(txt,cls);}

function createPlayer(o){
  const R=RACES[o.race],C=CLASSES[o.cls],B=BACKGROUNDS[o.bg];
  const P={id:'P',user:o.user,name:o.name,race:o.race,gender:o.gender,age:o.age,look:o.look||{},bg:o.bg,cls:o.cls,adv:null,level:1,xp:0,pts:3,attr:baseAttrs(o.race,o.bg),
    hp:1,mp:1,sp:1,gold:(B.gold||0)+(C.gold||0),inv:[],equip:{},mastery:{},loc:o.start||R.home,home:null,diff:o.diff||'normal',quests:[],story:0,flags:{},rep:{},fame:0,
    pvp:{r:1000,w:0,l:0},stats:{kills:0,dungeons:0,bosses:0,worldBoss:0,crafted:0,hidden:0,tourneyWins:0,deaths:0,gathered:0,explores:0},ach:[],codex:[],explored:[],comps:[],activeComp:null,
    friends:[],blocked:[],party:[],tiers:{},guild:null,grank:null,fx:{},created:S.time,log:[],examined:{},tactic:'free',row:'front',lootMode:'round',titles:[],kills:{},seenTut:0,mentions:0};
  for(const k in C.mastery)P.mastery[mKey(k)]={lv:C.mastery[k],xp:0};
  for(const k in B.mastery||{}){const kk=mKey(k);P.mastery[kk]=P.mastery[kk]||{lv:0,xp:0};P.mastery[kk].lv+=B.mastery[k];}
  for(const k in B.rep||{})P.rep[k]=(P.rep[k]||0)+B.rep[k];
  const homeF=R.faction;if(homeF&&homeF!=='free')P.rep[homeF]=(P.rep[homeF]||0)+10;
  if(o.race==='woodelf')P.rep.khaz=(P.rep.khaz||0)-10;
  for(const s of C.start){const [b,l]=STARTER[s];const it=makeGear(b,l,0);const sl=ITEM_BASES[b].sl;if(!P.equip[sl])P.equip[sl]=it;else P.inv.push(it);}
  for(const k of B.items||[]){if(STARTER[k]){const [b,l]=STARTER[k];P.inv.push(makeGear(b,l,0));}else invAdd(P,k,1);}
  invAdd(P,'hpot1',2);invAdd(P,'bread',2);
  if(C.comp){const sp=C.comp;P.comps.push({id:U.uid(),sp,name:SPECIES[sp].n,level:1,xp:0});P.activeComp=P.comps[0].id;}
  for(const c of B.codex||[])P.codex.push(c);
  P.explored=[P.loc,...(B.explored||[])];P.home=isTown(P.loc)?P.loc:'brookhollow';
  dirty(P);const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;
  return P;
}
function pMastery(k){k=mKey(k);return S.P.mastery[k]||(S.P.mastery[k]={lv:0,xp:0});}
function gainMastery(k,amt){
  k=mKey(k);if(!MASTERY[k])return;const m=pMastery(k);if(m.lv>=100)return;m.xp+=amt;
  while(m.lv<100&&m.xp>=masteryNeed(m.lv)){m.xp-=masteryNeed(m.lv);m.lv++;dirty(S.P);
    const tier=MASTERY_TIERS.find(t=>t[0]===m.lv);if(tier&&m.lv>1){log(`${MASTERY[k].n} mastery rank: ${tier[1]} (${m.lv})!`,'good');toast(`${MASTERY[k].n}: ${tier[1]}`);}
    else if(m.lv%5===0)log(`${MASTERY[k].n} mastery reached ${m.lv}.`,'good');
    for(const id in SKILLS){const s=SKILLS[id];if((s.tech||s.spell)&&s.m===k&&Math.max(1,s.lv)===m.lv){log(`New ${s.spell?'spell':'technique'} unlocked: ${s.n}!`,'epic');toast(`Unlocked: ${s.n}`,'epic');}}
    if(m.lv===25&&MASTERY[k].t==='weapon')log(`${MASTERY[k].n} 25: +5% critical chance with this weapon.`,'good');
    if(m.lv===75&&MASTERY[k].t==='weapon')log(`${MASTERY[k].n} 75: your strikes now pierce 15% of armor.`,'good');
  }
}
function gainXp(x,src){
  const P=S.P;if(P.level>=LEVEL_CAP)return;x=Math.round(x*(RACES[P.race].xp||1)*(P.fx.wellfed>S.time?1.05:1)*evMod('xp'));P.xp+=x;
  while(P.level<LEVEL_CAP&&P.xp>=xpNext(P.level)){P.xp-=xpNext(P.level);P.level++;P.pts+=2;const g=classGrowth(P);for(const k in g)P.attr[k]+=Math.round(g[k]);
    dirty(P);const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;P.fame+=P.level*2;
    log(`LEVEL UP! You are now level ${P.level}. +2 attribute points.`,'epic');toast(`Level ${P.level}!`,'epic');
    const C=CLASSES[P.cls];for(const s of C.skills)if(SKILLS[s].lv===P.level){log(`New class skill: ${SKILLS[s].n}`,'epic');}
    BUS.emit('player_level',{level:P.level});}
  checkAch();
}
function addRep(f,v){if(!f||!FACTIONS[f]||f==='free')return;const P=S.P;v=Math.round(v*(RACES[P.race].rep||1));const old=repTitle(P.rep[f]||0);P.rep[f]=U.clamp((P.rep[f]||0)+v,-100,100);const nw=repTitle(P.rep[f]);if(nw!==old)log(`${FACTIONS[f].n} now regards you as ${nw}.`,v>0?'good':'bad');}
function checkAch(){const P=S.P;for(const id in ACHIEVEMENTS){if(P.ach.includes(id))continue;try{if(ACHIEVEMENTS[id].f(P)){P.ach.push(id);P.fame+=50;log(`Achievement unlocked: ${ACHIEVEMENTS[id].n} — ${ACHIEVEMENTS[id].d}`,'epic');toast(`🏆 ${ACHIEVEMENTS[id].n}`,'epic');BUS.emit('player_ach',{id});}}catch(e){}}}
function unlockLore(id){const P=S.P;if(!LORE[id]||P.codex.includes(id))return false;P.codex.push(id);log(`Codex discovered: "${LORE[id].t}"`,'lore');gainXp(40+P.level*5);checkAch();return true;}
function pStats(){return stats(S.P);}
function clampVitals(){const P=S.P,st=stats(P);P.hp=U.clamp(P.hp,0,st.mhp);P.mp=U.clamp(P.mp,0,st.mmp);P.sp=U.clamp(P.sp,0,st.msp);}
function regen(min){const P=S.P,st=stats(P);const f=min/60;P.hp=Math.min(st.mhp,P.hp+st.mhp*0.04*f);P.mp=Math.min(st.mmp,P.mp+st.mmp*0.08*f);P.sp=Math.min(st.msp,P.sp+st.msp*0.15*f);}
/* time passing for the player: advances world */
function spend(min){regen(min);advance(min);partyFollow();}
function priceFor(item,city,buy=true){
  const P=S.P;const d=itemDef(item);let cat=isGear(item)?(ITEM_BASES[item.b].t==='weapon'?'weapon':'armor'):(d.t==='food'?'food':d.t==='mat'?'mat':'con');
  let v=itemValue(item)*priceMult(city,cat);const tr=mLv(P,'trading');const f=S.control[city]||LOCS[city].f;const rep=f?(P.rep[f]||0):0;
  if(buy){v*=(1.25-tr*0.002-rep*0.0015)*evMod('price');if(P.race==='orc'&&f!=='horde')v*=1.1;if(P.race==='halfling'&&cat==='food')v*=0.8;if(P.cls==='merchant')v*=0.9;}
  else{v*=0.35+tr*0.002+rep*0.0008;if(P.cls==='merchant')v*=1.15;}
  return Math.max(1,Math.round(v));
}
/* ---------------- equipment ---------------- */
function equip(idx){const P=S.P,it=P.inv[idx];if(!isGear(it))return;const [ok,why]=canEquip(P,it);if(!ok){log(why,'bad');return;}
  const b=ITEM_BASES[it.b];const sl=b.sl;P.inv.splice(idx,1);if(P.equip[sl])P.inv.push(P.equip[sl]);P.equip[sl]=it;
  if(b.two&&P.equip.offhand){P.inv.push(P.equip.offhand);P.equip.offhand=null;}
  if(sl==='offhand'&&P.equip.weapon&&ITEM_BASES[P.equip.weapon.b].two){P.inv.push(P.equip.weapon);P.equip.weapon=null;}
  dirty(P);clampVitals();const pf=proficiency(P,it);log(`Equipped ${itemName(it)}.${pf<1?` (Unfamiliar: ${Math.round(pf*100)}% effectiveness until you train it.)`:''}`);}
function unequip(sl){const P=S.P;if(!P.equip[sl])return;P.inv.push(P.equip[sl]);P.equip[sl]=null;dirty(P);clampVitals();}
function useItem(idx,inCombat){const P=S.P,it=P.inv[idx];if(!it||isGear(it))return false;const d=ITEMS[it.k];const st=stats(P);
  if(d.t==='tome'){const m=pMastery(d.school);if(m.lv>0){log(`You already know the basics of ${MASTERY[d.school].n}.`);return false;}m.lv=1;m.xp=0;dirty(P);invRemove(P,it.k);log(`You study the ${d.n}. You can now cast ${MASTERY[d.school].n} spells!`,'epic');return true;}
  if(d.t!=='con'&&d.t!=='food')return false;
  if(d.t==='food'&&inCombat){log('No time to eat now!','bad');return false;}
  if(d.ret){if(inCombat){log('You cannot read it mid-fight.','bad');return false;}invRemove(P,it.k);P.loc=P.home;P.dungeon=null;log(`The scroll flares, and you are back in ${LOCS[P.home].n}.`,'good');spend(10);return true;}
  if(d.heal)P.hp=Math.min(st.mhp,P.hp+d.heal);if(d.mana)P.mp=Math.min(st.mmp,P.mp+d.mana);if(d.stam)P.sp=Math.min(st.msp,P.sp+d.stam);
  if(d.wellfed){P.fx.wellfed=S.time+180;}if(d.cure&&P.cfx){for(const k of ['poison','burn','bleed'])delete P.cfx[k];}
  invRemove(P,it.k);if(!inCombat)log(`You use ${d.n}.`);return true;}
function sellItem(idx){const P=S.P,it=P.inv[idx];if(!it)return;const q=isGear(it)?1:it.q;const v=priceFor(isGear(it)?it:{k:it.k},P.loc,false)*(isGear(it)?1:1);
  if(isGear(it)){P.inv.splice(idx,1);P.gold+=v;supply(P.loc,ITEM_BASES[it.b].t==='weapon'?'weapon':'armor',1);log(`Sold ${itemName(it)} for ${v}g.`);}
  else{invRemove(P,it.k,1);P.gold+=v;supply(P.loc,'mat',0.3);log(`Sold ${ITEMS[it.k].n} for ${v}g.`);}
  gainMastery('trading',2);}
function buyItem(item,price,fromStock){const P=S.P;if(P.gold<price){log('Not enough gold.','bad');return false;}if(P.inv.length>=60){log('Your bags are full.','bad');return false;}
  P.gold-=price;if(isGear(item))P.inv.push(item);else invAdd(P,item.k,1);demand(P.loc,isGear(item)?(ITEM_BASES[item.b].t==='weapon'?'weapon':'armor'):'con',0.5);gainMastery('trading',1);log(`Bought ${itemName(item)} for ${price}g.`);return true;}
/* smith stock per town, refreshed daily */
function smithStock(loc){S.stock=S.stock||{};const day=T.day(S.time);const s=S.stock[loc];if(s&&s.day===day)return s.items;
  const P=S.P;const items=[];const C=CLASSES[P.cls];const tl=LOCS[loc].ty==='city'?P.level:Math.min(P.level,40);
  for(let i=0;i<10;i++){const kind=i<4?'weapon':i<8?'armor':i<9?'offhand':'acc';const base=kind==='weapon'&&i<2?U.pick(C.weapons.filter(w=>ITEM_BASES[w])):randomGearBase(kind,i<6?P.cls:null);
    items.push(makeGear(base,U.clamp(tl+U.ri(-3,3),1,100),U.chance(0.06)?2:U.chance(0.35)?1:0));}
  S.stock[loc]={day,items};return items;}
function shopStock(loc){const L=LOCS[loc];const base=['hpot1','mpot1','stonic','antidote','bread','jerky','scroll_return','smoke'];const lv=S.P.level;
  if(lv>=10||L.ty==='city')base.push('hpot2','mpot2','firebomb','stew');if(lv>=30)base.push('hpot3','mpot3','elixir_str','elixir_def','roast');if(lv>=55)base.push('hpot4','revive');
  if(loc==='lothirien'||loc==='thornvale')base.push('waybread');if(loc==='khazgard'||loc==='deepforge')base.push('stout');return base;}

/* ---------------- travel & exploration ---------------- */
function canEnter(loc){const P=S.P;const f=S.control[loc];if(f&&(P.rep[f]||0)<=-60&&isTown(loc))return [false,`The guards of ${FACTIONS[f].n} will not let you in. (Reputation: ${repTitle(P.rep[f])})`];return [true,''];}
function travelTo(dest,viaService){
  const P=S.P;if(UI.inCombat())return;const hrs=GRAPH[P.loc][dest];if(hrs==null)return;
  const [ok,why]=canEnter(dest);if(!ok){log(why,'bad');return;}
  let h=hrs*evMod('travel');if(P.race==='beastkin'||P.race==='woodelf')h*=0.9;if(viaService==='stable')h*=0.5;
  log(`You set out for ${LOCS[dest].n} (${h.toFixed(1)}h).`);
  const danger=LOCS[dest].mon.length||LOCS[P.loc].mon.length;
  spend(Math.round(h*60));
  const esc=P.quests.find(q=>q.escort&&!q.done);
  if((danger||esc)&&U.chance(viaService?0.05:esc?0.45:0.22)){const pool=LOCS[dest].mon.length?dest:P.loc;log('Ambush on the road!','bad');P.loc=dest;arriveAt(dest,true);startEncounter(pool,{ambush:true});return;}
  P.loc=dest;arriveAt(dest);
}
function arriveAt(loc,quiet){const P=S.P;P.dungeon=null;
  if(!P.explored.includes(loc)){P.explored.push(loc);gainXp(25+LOCS[loc].lv[0]*8);log(`Discovered ${LOCS[loc].n}!`,'good');if(LOCS[loc].hid){P.stats.hidden++;log('This place is not on any map.','epic');}checkAch();}
  if(!quiet)log(`You arrive at ${LOCS[loc].n}. ${T.part(S.time)==='night'?'Night has fallen.':''}`);
  for(const q of P.quests.slice())if((q.type==='deliver'||q.type==='escort')&&q.loc===loc&&!q.done){q.done=true;q.prog=1;completeQuest(q);}
  storyCheck('visit');if(LOCS[loc].hid)storyCheck('discover');
  if(LOCS[loc].pvp&&!quiet)log('⚔ This is an open-world PvP zone. Other adventurers may attack you.','bad');
  BUS.emit('player_arrive',{loc});
}
function exploreHere(){
  const P=S.P,L=LOCS[P.loc];P.stats.explores++;spend(60);
  P.examined[P.loc]=(P.examined[P.loc]||0)+1;
  for(const q of P.quests)if(q.type==='explore'&&q.loc===P.loc&&!q.done){q.prog=1;q.done=true;log(`Quest progress: ${q.n} (complete, return to ${LOCS[q.giver].n})`,'good');}
  if(storyCheck('explore'))return;
  // hidden neighbors
  const hidden=neighbors(P.loc).filter(l=>LOCS[l].hid&&!P.explored.includes(l));
  if(hidden.length&&U.chance(0.18+stats(P).attr.luck*0.004+(P.flags['rumor_'+hidden[0]]?0.3:0))){const h=hidden[0];log(`Following faint signs off the trail, you find a hidden way to ${LOCS[h].n}!`,'epic');P.flags['found_'+h]=1;return;}
  const r=U.r();
  if(L.mon.length&&r<0.42){log('Something stirs nearby...','bad');startEncounter(P.loc);return;}
  if(r<0.55){const g=U.ri(3,10)+L.lv[0]*U.ri(1,4);P.gold+=g;log(`You find a forgotten pouch with ${g} gold.`,'good');return;}
  if(r<0.65&&L.res.length){const [k]=U.pick(L.res);invAdd(P,k,U.ri(1,2));log(`You find some ${ITEMS[k].n}.`,'good');return;}
  if(r<0.78){const here=(S.byLoc[P.loc]||[]).filter(n=>online(n)&&!n.inParty);if(here.length){const n=U.pick(here);log(`You meet ${n.user} (Lv.${n.level} ${CLASSES[n.cls].name}), who is ${n.act}.`,'social');remember(n,`Met in ${L.n}`,1);BUS.emit('player_meet',{n});return;}}
  if(r<0.86&&L.feat){const f=U.pick(L.feat);log(`You come across ${f.toLowerCase().startsWith('a')||f.toLowerCase().startsWith('the')?f.toLowerCase():'a '+f.toLowerCase()}. You can Examine it.`,'lore');return;}
  if(r<0.9&&U.chance(0.4)){const it=randomGear(L.lv[1],null);P.inv.push(it);log(`Half-buried in the ground: ${itemName(it)}!`,'good');return;}
  gainXp(5+L.lv[0]*2);log(U.pick(['You map the area carefully.','You find old campfire ashes and tracks leading nowhere.','The wind carries distant howls.','You sit on a rock and enjoy the view for a moment.','You find a weathered signpost with half the names scratched out.']));
}
function examine(i){const P=S.P,L=LOCS[P.loc];const f=(L.feat||[])[i];if(!f)return;spend(15);const key=P.loc+':'+i;const first=!P.examined[key];P.examined[key]=1;
  const texts={0:'Look closely and you can see it has been here for centuries.',1:'Scratched into the surface are names, dates, and a crude map.',2:'You run your hand over it and feel a faint warmth.',3:'Something about it feels important.'};
  log(`${f}: ${texts[i%4]}`,'lore');
  if(first){gainXp(10+L.lv[0]*3);const lorePool={watchtower:'lore_aethermoor',aethermoor:'lore_sundering',hollow:'lore_hollow',spire:'lore_spire',summit:'lore_wyrm',mire:'lore_hydra',necropolis:'lore_vel',undervault:'lore_undervault',valeria:'lore_lionheart',pawhaven:'lore_unchaining',duskhaven:'lore_spideroracle',bloodrock:'lore_ashspirits',whisperwood:'lore_grubnak',ashen:'lore_dragonpacts',lothirien:'lore_concord',saltmere:'lore_saltmere',skyreach:'lore_monastery'};
    if(lorePool[P.loc]&&U.chance(0.6))unlockLore(lorePool[P.loc]);else if(U.chance(0.3)){const g=U.ri(5,20)*Math.max(1,L.lv[0]);P.gold+=g;log(`Tucked away inside, you find ${g} gold.`,'good');}}}
function searchTreasure(){const P=S.P,L=LOCS[P.loc];spend(90);if(treasureDig())return;const luck=stats(P).attr.luck;
  if(U.chance(0.12)){const dmg=Math.round(stats(P).mhp*0.12);P.hp=Math.max(1,P.hp-dmg);log(`A hidden trap springs! You take ${dmg} damage.`,'bad');return;}
  if(U.chance(0.25+luck*0.006+(P.race==='halfling'?0.1:0))){const lv=L.lv[1];const g=U.ri(10,30)*lv;P.gold+=g;log(`You uncover a buried chest with ${g} gold!`,'good');
    if(U.chance(0.4)){const it=randomGear(lv,P.cls,U.chance(0.15)?3:U.chance(0.5)?2:1);P.inv.push(it);log(`Inside: ${itemName(it)} (${RARITY[it.r].n})!`,'epic');}
    if(P.loc==='dunes'&&S.flags.meteor&&S.time-S.flags.meteor<2880){invAdd(P,'aether_shard',1);log('You find an Aether Shard from the fallen meteor!','epic');}return;}
  if(L.mon.length&&U.chance(0.3)){log('Your digging attracts attention...','bad');startEncounter(P.loc);return;}
  log('You search for a long time but find nothing.');}
function gather(k,m){const P=S.P;spend(45);const lv=mLv(P,m);const yieldBonus=(P.race==='dwarf'&&m==='mining'?0.2:0)+(P.race==='woodelf'&&m==='herbalism'?0.2:0);
  let q=1+Math.floor(lv/20)+(U.chance(0.3+yieldBonus)?1:0);invAdd(P,k,q);P.stats.gathered+=q;gainMastery(m,6+q);log(`You gather ${q} ${ITEMS[k].n}.`,'good');
  checkFactionChain('gather');
  for(const qu of P.quests)if((qu.type==='gather'||qu.type==='request')&&qu.item===k&&!qu.done){qu.prog=Math.min(qu.qty,invCount(P,k));if(qu.prog>=qu.qty){qu.done=true;log(`Quest ready: ${qu.n} (return to ${LOCS[qu.giver].n})`,'good');}}
  if(LOCS[P.loc].mon.length&&U.chance(0.12)){log('A creature interrupts your work!','bad');startEncounter(P.loc);}}
function restInn(){const P=S.P;const cost=10+P.level*2;if(P.gold<cost){log(`A room costs ${cost}g. You can't afford it.`,'bad');return;}P.gold-=cost;spend(8*60);const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;P.home=P.loc;P.fx.wellfed=0;
  log(`You sleep soundly at the inn (${cost}g). Fully restored. ${LOCS[P.loc].n} is now your home point.`,'good');}
function camp(){const P=S.P;spend(6*60);const st=stats(P);P.hp=Math.min(st.mhp,P.hp+st.mhp*0.6);P.mp=Math.min(st.mmp,P.mp+st.mmp*0.6);P.sp=st.msp;log('You make camp and rest for a few hours.');
  if(LOCS[P.loc].mon.length&&U.chance(0.25)){log('You wake to snarls in the dark!','bad');startEncounter(P.loc,{ambush:true});}}
function hearRumors(){const P=S.P;if(P.gold<5){log('You need 5 gold for a round of drinks.','bad');return;}P.gold-=5;spend(30);const R=rumors(P.loc);log('You buy a round and listen to the regulars:','lore');for(const r of R)log(`“${r}”`,'lore');
  for(const h of ['hollow','cove','skyreach'])if(R.some(r=>r.includes(h==='hollow'?'west of Moonfall':h==='cove'?'Silk-Eye':'monastery')))P.flags['rumor_'+h]=1;}
function talkTownsfolk(name,role){const P=S.P;spend(10);const R=rumors(P.loc);
  const lines={innkeeper:['Rooms are clean and the ale is mostly water. What more do you want?','Adventurers come and go. Most come back.'],farmer:['Wolves got two sheep last night. If you\'re heading into the Greenmarch, keep an eye out.'],
    elder:['When I was young the Abandoned Mine still gave silver. Then the miners dug too deep.'],librarian:['Knowledge is the only treasure that grows when shared. Feel free to read.'],guard:['Keep your weapons sheathed inside the walls.','Bandits on the roads lately. Be careful.'],
    merchant:['Buy low, sell high. Everything else is details.','Prices go up and down with the wars. Pay attention.'],priest:['May the light guide your steps.','The temple heals all who ask.'],arena:['The Grand Tournament comes every seven days. Register at the arena when it opens.'],
    smith:['Bring me ore and I\'ll teach you something about steel.','Off-class gear works, but you\'ll fight clumsily in it until you train.'],mystic:['The dragons remember the pacts. So do their children.'],mentor:['The higher paths are earned, not given. Show me your mastery.'],
    barkeep:['Ale\'s two coppers. Gossip\'s free if you buy the ale.'],courier:['I carry letters for every city. Real adventurers can send each other parcels through me.'],smuggler:['You didn\'t see this place. Understood?'],elder2:[]};
  log(`${name}: “${U.pick(lines[role]||['Good day, traveler.'])}”`,'social');if(U.chance(0.6))log(`${name}: “Also: ${R[0]}”`,'lore');
  if(role==='librarian'&&P.loc==='valeria')storyCheck('visit');}
function readBook(id){spend(45);if(!unlockLore(id))log(`You re-read "${LORE[id].t}".`,'lore');log(LORE[id].x,'lore');}

/* ---------------- quests ---------------- */
function acceptQuest(q){const P=S.P;if(P.quests.length>=10){log('Your quest log is full (10).','bad');return;}if(P.quests.some(x=>x.id===q.id))return;q.taken=true;const c=JSON.parse(JSON.stringify(q));P.quests.push(c);log(`Quest accepted: ${q.n}`,'good');}
function questKill(monId,loc,elite){const P=S.P;checkFactionChain('kill',{mon:monId,loc});for(const q of P.quests)if(!q.done&&(q.type==='kill'||q.type==='bounty')&&q.mon===monId&&q.loc===loc&&(!q.elite||elite)){q.prog++;if(q.prog>=q.qty){q.done=true;log(`Quest ready: ${q.n} (return to ${LOCS[q.giver].n})`,'good');}}}
function turnInQuest(i){const P=S.P,q=P.quests[i];if(!q||!q.done)return;if(q.giver!==P.loc&&q.type!=='deliver'){log(`Turn this in at ${LOCS[q.giver].n}.`,'bad');return;}
  if(q.type==='gather'||q.type==='request'){if(invCount(P,q.item)<q.qty){q.done=false;q.prog=invCount(P,q.item);log('You no longer have enough items.','bad');return;}invRemove(P,q.item,q.qty);}
  completeQuest(q);}
function completeQuest(q){const P=S.P;P.quests=P.quests.filter(x=>x!==q);if(q.type==='request')npcRequestDone(q);gainXp(q.xp,'quest');P.gold+=q.gold;for(const f in q.rep)addRep(f,q.rep[f]);if(q.reward){P.inv.push(q.reward);log(`Reward: ${itemName(q.reward)}`,'good');}
  P.fame+=Math.round(q.lvl/2)+2;P.stats.quests=(P.stats.quests||0)+1;log(`Quest complete: ${q.n}! +${U.fmt(q.xp)} XP, +${U.fmt(q.gold)}g`,'epic');checkAch();}
function storyCheck(kind,data){if(kind==='visit'&&S.P.loc==='spire'&&STORY[S.P.story]&&STORY[S.P.story].id==='st9'&&invCount(S.P,'spire_key')&&!S.P.flags.finalPrompted){S.P.flags.finalPrompted=1;log('The Sun-Engine pulses above you. Enter the Spire and climb to its heart.','epic');}const P=S.P;const st=STORY[P.story];if(!st)return false;if(st.loc!==P.loc)return false;
  if(st.type!==kind)return false;if(kind==='boss'&&data!==st.boss)return false;if(st.need&&invCount(P,st.need)<1){log(`You need the ${ITEMS[st.need].n}.`,'bad');return false;}
  if(st.need&&st.need!=='spire_key')invRemove(P,st.need,1);
  log(`MAIN STORY — ${st.n}: complete!`,'epic');gainXp(st.xp);P.gold+=st.gold;if(st.give){invAdd(P,st.give,1);log(`Obtained: ${ITEMS[st.give].n}`,'epic');}if(st.lore)unlockLore(st.lore);
  P.story++;if(P.story>=STORY.length){P.flags.story_done=1;news(`${P.user} has silenced the Shattered One! The Sun-Engine sleeps again.`,'fame');P.fame+=5000;checkAch();}
  else log(`Next: ${STORY[P.story].n} — ${STORY[P.story].step}`,'lore');
  return true;}

/* ---------------- crafting ---------------- */
function canCraft(r){const P=S.P;if(mLv(P,r.m)<r.lv)return false;for(const k in r.in)if(invCount(P,k)<r.in[k])return false;return true;}
function craftStation(r){return {smithing:['forge','smith'],alchemy:['alchemy'],cooking:['inn'],enchanting:['alchemy','library','trainer']}[r.m];}
function craft(r,targetIdx){const P=S.P;if(!craftStation(r).some(s=>hasSvc(P.loc,s))){log('You need the right workshop here.','bad');return;}if(!canCraft(r)){log('Missing materials or skill.','bad');return;}
  if(r.ench){const it=P.inv[targetIdx]||null;if(!it||!isGear(it)){log('Choose an item to enchant.','bad');return;}for(const k in r.in)invRemove(P,k,r.in[k]);it.ench=r.ench;dirty(P);gainMastery('enchanting',10+r.lv/2);P.stats.crafted++;spend(30);log(`You enchant ${itemName(it)} with ${AFFIXES[r.ench].n}.`,'epic');checkAch();return;}
  for(const k in r.in)invRemove(P,k,r.in[k]);const lv=mLv(P,r.m);spend(30);
  if(r.gear){const base=randomGearBase(r.gear,P.cls);const q=U.r()*100+lv*0.6;const rar=Math.max(r.minR||0,q>130?3:q>95?2:q>60?1:0);const it=makeGear(base,r.ilvl+Math.floor(lv/10),rar);it.crafter=P.user;P.inv.push(it);log(`You forge ${itemName(it)} (${RARITY[it.r].n}).`,'good');}
  else{const q=1+(U.chance(lv/150)?1:0);invAdd(P,r.out,q);log(`You make ${q}× ${ITEMS[r.out].n}.`,'good');}
  gainMastery(r.m,8+r.lv/3);P.stats.crafted++;checkAch();}

/* ---------------- class change & advanced class ---------------- */
function retrainCost(){return 150*S.P.level;}
function retrain(cls){const P=S.P;const c=retrainCost();if(P.gold<c){log(`Retraining costs ${c}g.`,'bad');return;}P.gold-=c;const old=P.cls;P.cls=cls;
  if(P.adv){const A=ADV_CLASSES[P.adv];if(A.from&&!A.from.includes(cls)){log(`Your ${A.name} discipline does not carry over to ${CLASSES[cls].name}.`,'bad');P.adv=null;}}
  for(const k in CLASSES[cls].mastery){const m=pMastery(k);if(m.lv<1)m.lv=1;}dirty(P);clampVitals();spend(120);log(`You retrain from ${CLASSES[old].name} to ${CLASSES[cls].name}. Your masteries stay with you.`,'epic');}
function startTrial(id){const A=ADV_CLASSES[id];const el=advEligible(S.P,A);if(!el.ok){log('Not yet eligible: '+el.why.join(', '),'bad');return;}
  const m=makeMonster('trial_foe',A.lvl+5,{diff:DIFFS[S.P.diff].m});m.name=`${A.name} Trial Champion`;
  startCombat([m],{type:'trial',title:`Trial of the ${A.name}`,onWin:()=>{S.P.adv=id;dirty(S.P);log(`You are now a ${A.name}!`,'epic');toast(`Advanced Class: ${A.name}`,'epic');S.P.fame+=300;news(`${S.P.user} has become a ${A.name}!`,'fame');checkAch();BUS.emit('player_adv',{A});}});}
function startTierTrial(t){const P=S.P;P.tiers=P.tiers||{};const el=tierEligible(P,t);if(!el.ok){log('Not yet: '+el.why.join(', '),'bad');return;}const nm=CLASS_TIERS[P.cls].t[t-1];
  const m=makeMonster('trial_foe',Math.max(TIER_REQ[t].lvl,P.level-3),{diff:DIFFS[P.diff].m});m.mhp=Math.round(m.mhp*0.7);m.hp=m.mhp;m.atk*=0.85;m.name=`${nm} Examiner`;
  startCombat([m],{type:'trial',title:`Class Upgrade Trial: ${nm}`,onWin:()=>{P.tiers[P.cls]=t;dirty(P);const sk=SKILLS[TIER_SKILLS[P.cls][t]];log(`You are now a ${nm}! New skill: ${sk.n}. Your power grows.`,'epic');P.fame+=t*150;news(`${P.user} has risen to ${nm}.`,'fame');BUS.emit('player_tier',{nm,sk});checkAch();}});}
function allocate(k){const P=S.P;if(P.pts<=0)return;P.attr[k]++;P.pts--;dirty(P);}
function trainMastery(k){const P=S.P;const m=pMastery(k);const cost=Math.round(30+m.lv*m.lv*1.5);if(m.lv>=40){log('Trainers can only take you to 40. Past that you learn by doing.','bad');return;}if(P.gold<cost){log(`Training costs ${cost}g.`,'bad');return;}
  P.gold-=cost;spend(120);gainMastery(k,masteryNeed(m.lv)*0.6);log(`You train ${MASTERY[mKey(k)].n} for two hours.`,'good');}

/* ---------------- companions ---------------- */
function compStats(c){const sp=SPECIES[c.sp];const m=makeMonster(sp.mon,c.level);const own=S&&S.P;const mult=(sp.mult||1)*0.95*(own&&(own.cls==='summoner'||own.adv==='grandsummoner')?1.45:1);m.mhp=Math.round(m.mhp*mult);m.atk*=mult;m.matk*=mult;m.pdef*=mult;m.hp=m.mhp;m.name=c.name;m.comp=c.id;m.ally=1;m.mon=0;m.isComp=1;return m;}
function compGainXp(c,x){c.xp+=x;while(c.level<100&&c.xp>=xpNext(c.level)*0.7){c.xp-=Math.floor(xpNext(c.level)*0.7);c.level++;
  const sp=SPECIES[c.sp];if(sp.evo&&c.level>=sp.evo[0]){const old=sp.n;c.sp=sp.evo[1];if(c.name===old)c.name=SPECIES[c.sp].n;S.P.stats.evolved=(S.P.stats.evolved||0)+1;log(`✨ Your ${old} evolved into a ${SPECIES[c.sp].n}!`,'epic');toast(`Evolution: ${SPECIES[c.sp].n}`,'epic');checkAch();}}}
function canTame(){const P=S.P;return ['summoner','druid','necromancer'].includes(P.cls)||['beastmaster','grandsummoner'].includes(P.adv)||mLv(P,'summoning')>=10;}

/* ---------------- party ---------------- */
function partyMembers(){return S.P.party.map(npc).filter(Boolean);}
function partyFollow(){const P=S.P;for(const n of partyMembers()){n.loc=P.loc;n.busy=S.time+60;n.act='in your party';n.path=[];
  if(!online(n)||(S.time-n.joined>U.ri(6,12)*60&&U.chance(0.1))){leaveParty(n,online(n)?'gotta head out, thanks for the group!':'logging off, gg all');}}}
function leaveParty(n,msg){const P=S.P;P.party=P.party.filter(x=>x!==n.id);n.inParty=false;n.busy=S.time;n.act='idle';log(`${n.user} left the party.`,'social');if(msg)BUS.emit('npc_say',{n,ch:'party',text:msg});
  remember(n,`Partied together in ${LOCS[P.loc].n}`,3);}
function considerInvite(n){
  const P=S.P;if(!online(n))return {ok:false,why:'offline',msg:null};if(P.party.length>=3)return {ok:false,why:'Your party is full (4 max).'};
  if(n.inParty)return {ok:false,why:'already in your party'};
  if(n.busy>S.time&&['dungeon','raiding','dueling'].includes(n.act))return {ok:false,msg:U.pick([`busy in a ${n.act==='dungeon'?'dungeon':'fight'} rn, maybe later`,`can't atm, mid-${n.act}`,'sry busy'])};
  const aff=affinity(n),diff=n.level-P.level,t=n.tr;
  if(n.agreedP&&S.time-n.agreedP<180)return {ok:true};
  let p=0.35+t.social*0.3+t.kind*0.15+aff/150-(Math.abs(diff)>10?0.35:0)-(diff>15&&t.arrog>0.5?0.4:0)+(P.guild&&P.guild===n.guild?0.3:0)+(P.friends.includes(n.id)?0.3:0);
  if(t.lazy>0.7)p-=0.15;if(n.loc!==P.loc&&path(n.loc,P.loc,true)&&path(n.loc,P.loc,true).hours>6)p-=0.25;
  if(U.chance(U.clamp(p,0.03,0.95)))return {ok:true};
  const msg=diff>12?U.pick([`no offense but ur lvl ${P.level}, I'd one-shot everything`,`you're a bit low for me`,`nah, too big a level gap`]):aff<-10?U.pick(['no thanks','pass','lol no']):U.pick(['nah I\'m solo farming','not right now','maybe later','I\'m waiting for my guildies, sorry']);
  return {ok:false,msg};
}
function invite(n){const r=considerInvite(n);if(r.ok){S.P.party.push(n.id);n.inParty=true;n.joined=S.time;n.loc=S.P.loc;n.agreedP=0;log(`${n.user} joined your party!`,'good');remember(n,null,2);BUS.emit('party_join',{n});return true;}
  if(r.why==='offline'){log(`${n.user} is offline.`,'bad');return false;}if(r.why){log(`${n.user}: ${r.why}`,'bad');return false;}
  BUS.emit('npc_pm',{n,text:r.msg});return false;}
function considerDuel(n){const P=S.P,t=n.tr;if(!online(n))return 'offline';if(n.busy>S.time&&n.act!=='idle'&&n.act!=='chatting'&&n.act!=='waiting at arena')return 'busy';
  const p=0.2+t.compet*0.5+t.arrog*0.2+(n.rivals.includes('P')?0.4:0)-(P.level-n.level>15?0.5:0);return U.chance(p)?'yes':'no';}
function friendRequest(n){const P=S.P;if(P.friends.includes(n.id))return;const aff=affinity(n);if(aff>=8||(n.tr.kind>0.6&&n.tr.social>0.5)||U.chance(0.25+aff/50)){P.friends.push(n.id);if(!n.friends.includes('P'))n.friends.push('P');remember(n,'Became friends',8);log(`${n.user} accepted your friend request.`,'good');checkAch();return true;}
  log(`${n.user} declined your friend request.`,'bad');remember(n,null,-1);return false;}
function npcAsk(n,item){const aff=affinity(n);return Math.round(itemValue(item)*(1.15+n.tr.greed*0.6-aff/250));}
function offerBuy(n,idx,offer){const P=S.P,it=n.inv[idx];if(!it)return;const ask=npcAsk(n,it);if(P.gold<offer){log('You don\'t have that much gold.','bad');return false;}
  if(offer>=ask*(0.82+n.tr.greed*0.15)){n.inv.splice(idx,1);P.gold-=offer;n.gold+=offer;invAdd(P,isGear(it)?it:it.k,it.q||1);remember(n,`Sold me ${itemName(it)} for ${offer}g`,offer>=ask?3:1);log(`${n.user} accepts! You bought ${itemName(it)} for ${offer}g.`,'good');gainMastery('trading',4);return true;}
  remember(n,null,-1);BUS.emit('npc_pm',{n,text:U.pick([`${offer}g? lol. ${ask}g`,`I could get ${ask} on the auction house`,`no way, ${ask} firm`,`meet me closer to ${Math.round(ask*0.95)}`])});return false;}
function offerSell(n,idx){const P=S.P,it=P.inv[idx];if(!it||!isGear(it))return;const b=ITEM_BASES[it.b];const sc=x=>x?x.l*RARITY[x.r].m:0;const C=CLASSES[n.cls];
  const useful=(b.t==='weapon'?C.weapons.includes(b.wt):b.t==='armor'?b.ac===C.armor:true)&&sc(it)>sc(n.equip[b.sl])&&it.l<=n.level+5;
  const pay=Math.round(itemValue(it)*(useful?0.9:n.prof==='trading'?0.55:0.3)*(1+affinity(n)/300));
  if(n.gold<pay){BUS.emit('npc_pm',{n,text:'I\'m broke rn sorry'});return;}
  if(!useful&&n.prof!=='trading'&&U.chance(0.6)){BUS.emit('npc_pm',{n,text:U.pick(['not useful for my class','nah I don\'t need that','try the auction house'])});return;}
  P.inv.splice(idx,1);P.gold+=pay;n.gold-=pay;if(!npcConsiderEquip(n,it))n.inv.push(it);remember(n,`Bought ${itemName(it)} from me`,3);log(`${n.user} bought ${itemName(it)} for ${pay}g.`,'good');gainMastery('trading',4);}

/* ---------------- guilds (player side) ---------------- */
function applyGuild(g){const P=S.P;if(P.guild){log('Leave your current guild first.','bad');return;}const L=npc(g.leader);if(!L)return;
  if(P.level<g.req){BUS.emit('npc_pm',{n:L,text:`Sorry, ${g.name} requires level ${g.req}+.`});return;}
  const aff=affinity(L);const p=0.45+aff/100+L.tr.kind*0.2-(g.goal==='pvp'&&P.pvp.r<1100?0.2:0)+P.fame/5000;
  if(U.chance(U.clamp(p,0.05,0.95))){P.guild=g.id;P.grank='Member';g.members.push('P');log(`You joined ${g.name}!`,'epic');remember(L,'Accepted into my guild',5);BUS.emit('player_guild_join',{g,L});}
  else{BUS.emit('npc_pm',{n:L,text:U.pick([`We're not recruiting your profile right now.`,`Come back when you've made a name for yourself.`,`Application declined. Nothing personal.`])});}}
function leavePlayerGuild(){const P=S.P,g=guild(P.guild);if(!g)return;g.members=g.members.filter(x=>x!=='P');g.officers=g.officers.filter(x=>x!=='P');
  if(g.isPlayer&&g.leader==='P'){const next=g.officers.map(npc).find(Boolean)||g.members.map(npc).find(Boolean);if(next){g.leader=next.id;next.grank='Leader';g.isPlayer=false;log(`${next.user} now leads ${g.name}.`);}else S.guilds=S.guilds.filter(x=>x!==g);}
  P.guild=null;P.grank=null;log(`You left ${g.name}.`);}
function foundGuild(name,tag){const P=S.P;const cost=1000;if(P.guild){log('Leave your guild first.','bad');return false;}if(P.gold<cost){log(`Founding a guild costs ${cost}g.`,'bad');return false;}
  if(S.guilds.some(g=>g.name.toLowerCase()===name.toLowerCase())){log('That name is taken.','bad');return false;}
  P.gold-=cost;const g={id:'pg'+U.uid(),name,tag:tag.toUpperCase().slice(0,4),leader:'P',officers:[],members:['P'],lvl:1,xp:0,treasury:0,hq:P.loc,rep:0,allies:[],rivals:[],goal:'social',req:1,morale:0.7,created:S.time,isPlayer:true,motto:'Founded by '+P.user};
  S.guilds.push(g);P.guild=g.id;P.grank='Leader';P.stats.founded=(P.stats.founded||0)+1;log(`You founded ${name} [${g.tag}]!`,'epic');news(`${P.user} founded a new guild: ${name}.`,'guild');checkAch();return true;}
function guildRecruit(n){const P=S.P,g=guild(P.guild);if(!g||!g.isPlayer)return;if(g.leader!=='P'&&!g.officers.includes('P')){log('Only the leader and officers can recruit.','bad');return;}
  if(!online(n)){log(`${n.user} is offline.`,'bad');return;}
  const cur=guild(n.guild);const aff=affinity(n);let p=0.25+aff/80+n.tr.social*0.2+g.lvl*0.02-(cur?0.35+n.tr.loyal*0.4:0)+(P.level>n.level?0.1:0);
  if(U.chance(U.clamp(p,0.03,0.9))){if(cur)leaveGuild(n);joinGuild(n,g);remember(n,`Recruited into ${g.name}`,4);log(`${n.user} joined ${g.name}!`,'good');}
  else BUS.emit('npc_pm',{n,text:cur?U.pick([`I'm loyal to ${cur.name}, sorry`,`nah, happy in ${cur.tag}`]):U.pick(['never heard of that guild','maybe if you grow a bit','not interested, thx'])});}

/* ---------------- death ---------------- */
function playerDeath(){const P=S.P,D=DIFFS[P.diff];P.stats.deaths++;
  if(D.perma){S.hall.unshift({user:P.user,name:P.name,lvl:P.level,cls:CLASSES[P.cls].name,t:S.time,where:LOCS[P.loc].n});log('You have fallen. Your legend ends here.','bad');BUS.emit('perma_death',{});return 'perma';}
  const gl=Math.round(P.gold*D.goldLoss),xl=Math.round(P.xp*D.xpLoss);P.gold-=gl;P.xp-=xl;P.loc=P.home;P.dungeon=null;const st=stats(P);P.hp=Math.round(st.mhp*0.5);P.mp=Math.round(st.mmp*0.5);P.sp=st.msp;
  for(const n of partyMembers())leaveParty(n,'rip, that went bad');
  log(`You wake up in ${LOCS[P.home].n}, battered.${gl?` Lost ${gl}g`:''}${xl?` and ${xl} XP`:''}.`,'bad');spend(120);return 'respawn';}
