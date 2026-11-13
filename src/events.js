/* ETERNAL REALMS — living-world systems: realm events, invasions, specialty shops, faction chains,
   adventurer requests, offline fast-forward, shared world snapshots */
'use strict';
/* ---------------- realm events ---------------- */
function evActive(){return (S&&S.events)||[];}
function evMod(k){let m=1;for(const e of evActive()){const v=(EVENT_TYPES[e.kind].mod||{})[k];if(v!=null&&(!e.loc||!S.P||k==='price'||e.kind!=='treasure'))m*=v;}return m;}
function startEvent(kind,opts={}){
  const T_=EVENT_TYPES[kind];S.events=S.events||[];if(S.events.some(e=>e.kind===kind))return null;
  const ev={id:U.uid(),kind,start:S.time,end:S.time+U.ri(T_.dur[0],T_.dur[1])*60};
  if(kind==='treasure'){ev.loc=U.pick(Object.keys(LOCS).filter(l=>!isTown(l)&&!LOCS[l].hid));}
  if(kind==='invasion'){ev.loc=opts.loc||U.pick(Object.keys(LOCS).filter(l=>isTown(l)&&!LOCS[l].hid&&l!=='skyreach'));const h=U.pick([['goblin','Goblin Horde',['goblin','goblin_archer','hobgoblin','goblin_rider']],['orc','Renegade Warband',['orc_raider','orc_berserker','bandit']],['undead','Army of Vel',['skeleton','zombie','ghoul','cultist']],['pirate','Blackwater Raiders',['pirate','bandit','bandit_mage']]]);
    ev.horde=h[1];ev.mons=h[2];ev.lvl=U.clamp(Math.round((LOCS[ev.loc].lv[0]>1?LOCS[ev.loc].lv[0]:avgNearbyLevel(ev.loc))),5,90);ev.str=100;ev.def=0;ev.waves={};}
  S.events.push(ev);
  news(`${T_.n}${ev.loc?` — ${LOCS[ev.loc].n}`:''}: ${kind==='invasion'?`The ${ev.horde} is attacking ${LOCS[ev.loc].n}! Defenders are needed.`:kind==='treasure'?`A pirate map points to treasure buried somewhere in ${LOCS[ev.loc].n}.`:T_.d}`,kind==='invasion'?'war':'event');
  BUS.emit('event_start',{ev});return ev;}
function avgNearbyLevel(town){const ns=neighbors(town).filter(l=>!isTown(l));if(!ns.length)return 15;return Math.round(ns.reduce((s,l)=>s+(LOCS[l].lv[0]+LOCS[l].lv[1])/2,0)/ns.length);}
function eventsTick(){S.events=S.events||[];
  for(const ev of S.events.slice()){if(ev.kind==='invasion')invasionHour(ev);if(S.time>=ev.end){S.events=S.events.filter(x=>x!==ev);if(ev.kind==='invasion')resolveInvasion(ev);else news(`${EVENT_TYPES[ev.kind].n} has ended.`,'event');BUS.emit('event_end',{ev});}}
  if(S.events.length<3&&U.chance(0.035)){const kind=U.wpick(Object.keys(EVENT_TYPES).filter(k=>!S.events.some(e=>e.kind===k)),k=>EVENT_TYPES[k].w);if(kind)startEvent(kind);}
  // blood moon only at night
  const bm=S.events.find(e=>e.kind==='bloodmoon');if(!bm&&T.hour(S.time)===21&&U.chance(0.08))startEvent('bloodmoon');}
function invasionHour(ev){const def=(S.byLoc[ev.loc]||[]).filter(n=>online(n)&&n.level>=ev.lvl-10);let p=0;for(const n of def.slice(0,20))p+=n.level*U.rf(0.5,1.2);ev.def+=p/40;ev.str=Math.max(0,ev.str-p/60);
  if(ev.str<=0){ev.end=S.time;}}
function resolveInvasion(ev){const L=LOCS[ev.loc];const f=S.control[ev.loc];const won=ev.str<=35||ev.def>ev.str;
  if(won){news(`${L.n} held against the ${ev.horde}! The defenders are celebrated.`,'war');const heroes=(S.byLoc[ev.loc]||[]).filter(n=>online(n)).slice(0,6);for(const n of heroes){n.fame+=ev.lvl;hist(n,`Defended ${L.n} from the ${ev.horde}`);}supply(ev.loc,'weapon',10);}
  else{news(`${L.n} was sacked by the ${ev.horde}. Shops are scrambling to restock.`,'war');if(S.econ[ev.loc])for(const c in S.econ[ev.loc])S.econ[ev.loc][c].d+=25;if(f&&S.kd[f])S.kd[f].army-=5;}
  ev.won=won;BUS.emit('invasion_end',{ev,won});if(S.P&&ev.waves.P){const P=S.P;if(won){invAdd(P,'invasion_badge',1);P.gold+=ev.lvl*60;if(f)addRep(f,8);log(`${L.n} is safe! You receive a Defender's Badge and ${ev.lvl*60}g from the grateful town.`,'epic');checkFactionChain('gather');}else log(`${L.n} fell despite your efforts.`,'bad');}}
function npcEventAct(n){ // NPC reactions to events. Returns true if it consumed the NPC's turn
  if(n.busy>S.time||!online(n))return false;
  const inv=evActive().find(e=>e.kind==='invasion');
  if(inv&&n.level>=inv.lvl-8&&n.tr.brave+n.tr.kind>1.0&&U.chance(0.25)){if(n.loc!==inv.loc){startTravel(n,inv.loc,'defend');return true;}n.act='defending';n.busy=S.time+60;return true;}
  const tr=evActive().find(e=>e.kind==='treasure');if(tr&&n.tr.greed>0.7&&U.chance(0.04)&&n.level>=LOCS[tr.loc].lv[0]-3){if(n.loc!==tr.loc)startTravel(n,tr.loc,'treasure');else if(U.chance(0.15)){const g=U.ri(20,60)*LOCS[tr.loc].lv[1];n.gold+=g;hist(n,`Found the pirate treasure in ${LOCS[tr.loc].n}`);news(`${n.user} found the pirate treasure in ${LOCS[tr.loc].n}!`,'event');S.events=S.events.filter(e=>e!==tr);BUS.emit('treasure_found',{n,loc:tr.loc});}return true;}
  return false;}
function defendWave(){const P=S.P;const ev=evActive().find(e=>e.kind==='invasion'&&e.loc===P.loc);if(!ev)return;ev.waves.P=(ev.waves.P||0);const wave=ev.waves.P+1;const dm=DIFFS[P.diff].m;
  const en=[];const n=wave>=3?1:U.ri(2,3);for(let i=0;i<n;i++)en.push(makeMonster(U.pick(ev.mons),ev.lvl+U.ri(-1,2),{diff:dm}));
  if(wave>=3){const w=makeMonster('warlord_inv',ev.lvl+3,{diff:dm});w.name=`${ev.horde} Warlord`;en.push(w);}
  startCombat(en,{type:'pve',loc:P.loc,title:`Defend ${LOCS[P.loc].n} — Wave ${wave}${wave>=3?' (Warlord)':''}`,onWin:()=>{ev.waves.P=wave;ev.str=Math.max(0,ev.str-(wave>=3?40:15));gainXp(monXp(ev.lvl)*2);
    if(wave>=3){ev.end=S.time;S.P.stats.defended=(S.P.stats.defended||0)+1;log(`You broke the ${ev.horde}! The town will reward you when the fighting ends.`,'epic');}else log(`Wave ${wave} repelled. The horde's strength wavers (${Math.round(ev.str)}%).`,'good');}});}
function treasureDig(){const P=S.P;const tr=evActive().find(e=>e.kind==='treasure'&&e.loc===P.loc);if(!tr)return false;if(!U.chance(0.45+stats(P).attr.luck*0.005))return false;
  const L=LOCS[P.loc];const g=U.ri(30,80)*L.lv[1];P.gold+=g;const it=U.chance(0.5)?makeSetItem(U.pick(Object.keys(SETS)),Math.max(P.level,L.lv[1]),3):randomGear(Math.max(P.level,L.lv[1]),P.cls,U.chance(0.2)?4:3);P.inv.push(it);
  P.stats.treasure=(P.stats.treasure||0)+1;checkAch();log(`X marks the spot! You dig up the pirate treasure: ${g} gold and ${itemName(it)}!`,'epic');S.events=S.events.filter(e=>e!==tr);news(`${P.user} found the pirate treasure in ${L.n}!`,'event');BUS.emit('treasure_found',{n:P,loc:P.loc});return true;}

/* ---------------- specialty shops ---------------- */
function specialStock(loc){const SH=SPECIAL_SHOPS[loc];S.sstock=S.sstock||{};const day=T.day(S.time);const s=S.sstock[loc];if(s&&s.day===day)return s;
  const P=S.P;const lv=Math.max(5,P.level);const items=[];
  for(let i=0;i<8;i++){const base=SH.bases?U.pick(SH.bases):randomGearBase(U.pick(['weapon','armor','armor','acc','offhand']),U.chance(0.5)?P.cls:null);
    const r=Math.max(SH.minR,U.chance(0.12)?3:U.chance(0.4)?2:1);const it=makeGear(base,U.clamp(lv+U.ri(-2,3),1,100),Math.min(4,r),SH.ench?{ench:SH.ench}:SH.enchant&&U.chance(0.4)?{ench:U.pick(['mighty','keen','frost','embers','storms'])}:undefined);items.push(it);}
  if(SH.set&&U.chance(0.7))items.push(makeSetItem(SH.set,U.clamp(lv+U.ri(0,2),1,100)));
  const featured=SH.uniq&&U.chance(0.25)?makeUnique(SH.uniq,U.clamp(lv,10,100)):null;
  S.sstock[loc]={day,items,featured,cons:SH.cons.slice()};return S.sstock[loc];}
function specialPrice(loc,it){const SH=SPECIAL_SHOPS[loc];let p=priceFor(it,loc)*(SH.markup||1.15);if(it.u)p*=1.5;return Math.round(p);}
function keeperGreeting(loc){const SH=SPECIAL_SHOPS[loc];const P=S.P;const f=S.control[loc];const rep=f?(P.rep[f]||0):0;const v=(P.shopVisits||{})[loc]||0;
  const tone={stern:['State your business.','Mind the edges.'],aloof:['Hm. A visitor.','Do try not to breathe on the crystals.'],gruff:['Aye?','Buying or gawking?'],sly:['Welcome, darling.','Looking for something… discreet?'],cheerful:['Ahoy! Come in, come in!','Fresh off the boat today!'],
    loud:['WELCOME, WARRIOR!','STRONG ARMS NEED STRONG AXES!'],kind:['Come in out of the wind, friend.','Take your time.'],shifty:['Close the door behind you.','You weren\'t followed?'],chatty:['Oh! A customer! Have I told you about the time—','Everything\'s half-true and fully priced!'],proud:['Behold, dragonfire steel.','Only the finest.']}[SH.mood];
  return `${v>5?'Back again, '+P.user+'! ':''}${U.pick(tone)} ${rep>=35?'(A discount for a friend of the realm.)':''}`;}

/* ---------------- faction chains & requests ---------------- */
function factionAccept(f){const P=S.P;P.fchains=P.fchains||{};if(P.fchains[f]!=null)return;P.fchains[f]=0;P.fprog=P.fprog||{};P.fprog[f]=0;const C_=FACTION_CHAINS[f];log(`Faction quest begun: ${C_.n} — ${C_.steps[0].n}`,'epic');}
function factionStep(f){const P=S.P;const i=(P.fchains||{})[f];if(i==null||i>=FACTION_CHAINS[f].steps.length)return null;return FACTION_CHAINS[f].steps[i];}
function checkFactionChain(kind,data){const P=S.P;if(!P||!P.fchains)return;for(const f in P.fchains){const st=factionStep(f);if(!st||st.type!==kind)continue;
  if(kind==='kill'&&!(data.mon===st.mon&&data.loc===st.loc))continue;if(kind==='boss'&&data!==st.boss)continue;if(kind==='visit'&&P.loc!==st.loc)continue;
  if(kind==='kill'){P.fprog[f]=(P.fprog[f]||0)+1;if(P.fprog[f]<st.qty)continue;}
  if(kind==='gather'&&invCount(P,st.item)<st.qty)continue;
  advanceFaction(f);}}
function advanceFaction(f){const P=S.P;const C_=FACTION_CHAINS[f];const st=factionStep(f);if(st.type==='gather')invRemove(P,st.item,st.qty);
  P.fchains[f]++;P.fprog[f]=0;addRep(f,8);gainXp(monXp(Math.max(P.level,10))*4);log(`Faction quest step complete: ${st.n}.`,'epic');
  if(P.fchains[f]>=C_.steps.length){const R=C_.reward;P.gold+=R.gold;addRep(f,R.rep);let it=null;if(R.uniq)it=makeUnique(R.uniq,Math.max(P.level,20));if(R.set)it=makeSetItem(R.set,Math.max(P.level,15),3);if(it)P.inv.push(it);
    log(`★ ${C_.n} complete! ${FACTION_CHAINS[f]&&FACTIONS[f].n} rewards you with ${U.fmt(R.gold)}g${it?' and '+itemName(it):''}.`,'epic');news(`${P.user} completed "${C_.n}" for ${FACTIONS[f].n}.`,'fame');P.fame+=300;checkAch();}
  else log(`Next: ${C_.steps[P.fchains[f]].n} — ${C_.steps[P.fchains[f]].d}`,'lore');}
BUS.on((t,d)=>{if(!S||!S.P)return;if(t==='player_arrive'){checkFactionChain('visit');checkFactionChain('gather');}});
function npcRequest(town){ // a simulated adventurer posts a request on the board — a real person in the world asking for help
  const pool=(S.byLoc[town]||[]).filter(n=>!n.retired);const n=U.pick(pool.length?pool:S.npcs.filter(x=>!x.retired&&x.knows.includes(town)));if(!n)return null;
  const mats=['pelt_wolf','herb_moon','ore_iron','ore_silver','silk','venom','crystal_fire','herb_frost','pearl','scale_drake','gem_shard','storm_crystal','werewolf_fang'].filter(k=>itemSources(k).some(l=>Math.abs(LOCS[l].lv[0]-n.level)<20));
  const k=U.pick(mats.length?mats:['herb_sun']);const qty=U.ri(3,6);const src=itemSources(k)[0];const lvl=Math.max(1,LOCS[src].lv[0]);
  return {id:U.uid(),type:'request',npc:n.id,item:k,qty,loc:src,lvl,giver:town,prog:0,n:`${n.user} needs ${ITEMS[k].n}`,d:`${n.user} (Lv.${n.level} ${CLASSES[n.cls].name}) wants ${qty} ${ITEMS[k].n} for ${U.pick(['their crafting','a guild contract','a new set of gear','a bet they made'])}. Found around ${LOCS[src].n}.`,
    xp:Math.round(monXp(lvl)*qty*0.5+monXp(lvl)*2),gold:Math.round(ITEMS[k].v*qty*U.rf(1.6,2.4)),rep:{}};}
function npcRequestDone(q){S.P.stats.requests=(S.P.stats.requests||0)+1;const n=npc(q.npc);if(!n)return;remember(n,`Brought me ${q.qty} ${ITEMS[q.item].n} when I needed them`,15);n.gold=Math.max(0,n.gold-q.gold);BUS.emit('npc_pm',{n,text:U.pick([`thank you so much for the ${ITEMS[q.item].n}!! I owe you one`,'you\'re a lifesaver, seriously',`got them, ty ${S.P.user}!`])});}

/* ---------------- the world keeps moving: fast-forward on return ---------------- */
const FF_CAP_HOURS=14*24;
async function fastForward(fromReal,toReal){
  if(!fromReal)return 0;const realMin=(toReal-fromReal)/60000;const hours=Math.min(FF_CAP_HOURS,Math.floor(realMin*GAME_MIN_PER_SEC*60/60));if(hours<1)return 0;
  const P=S.P;const before={lvls:{},news:S.news.length,time:S.time,gold:P?P.gold:0,day:T.day(S.time)};if(P)for(const id of [...P.friends,...S.npcs.filter(n=>n.rivals.includes('P')).map(n=>n.id)])before.lvls[id]=(npc(id)||{}).level;
  const top0=S.npcs.filter(n=>!n.retired).sort((a,b)=>b.level-a.level)[0];before.top=top0&&top0.user;
  S.catchup=true;const ov=typeof document!=='undefined'?document.getElementById('ffwd'):null;if(ov){ov.hidden=false;}
  const t0=performance.now();
  for(let i=0;i<hours;i++){S.time+=60;try{processHour();}catch(e){console.error(e);}
    if(i%12===0&&ov){ov.innerHTML=`<div><b>The world moved on without you…</b><div class="bar xp"><i style="width:${(i/hours*100).toFixed(1)}%"></i><span>Day ${T.day(S.time)}</span></div><small>${U.fmt(i)} of ${U.fmt(hours)} hours</small></div>`;await new Promise(r=>setTimeout(r,0));}}
  S.catchup=false;CQ.length=0;if(ov)ov.hidden=true;
  S.digest={hours,from:before.day,to:T.day(S.time),news:S.news.slice(0,Math.min(14,S.news.length)).map(n=>n[1]),
    friends:Object.entries(before.lvls).map(([id,l])=>{const n=npc(id);return n&&n.level>l?`${n.user} went from level ${l} to ${n.level}`:null;}).filter(Boolean).slice(0,6),
    gold:P?Math.round(P.gold-before.gold):0,top:(()=>{const t=S.npcs.filter(n=>!n.retired).sort((a,b)=>b.level-a.level)[0];return t&&t.user!==before.top?`${t.user} is now the strongest adventurer in the realm.`:null;})(),ms:Math.round(performance.now()-t0)};
  return hours;}
function digestHtml(d){return `<h2>While you were away</h2><p>${d.hours>=48?`${Math.round(d.hours/24)} days`:`${d.hours} hours`} passed in the Realms (Day ${d.from} → Day ${d.to}).${d.hours>=FF_CAP_HOURS?' (The chronicle only records the last two weeks.)':''}</p>
  ${d.top?`<p class="epic">${E(d.top)}</p>`:''}${d.friends.length?`<h3>People you know</h3><ul>${d.friends.map(f=>`<li>${E(f)}</li>`).join('')}</ul>`:''}
  ${d.gold>0?`<p class="good">Your auction sales earned ${U.fmt(d.gold)}g.</p>`:''}<h3>Realm news</h3><ul class="dig">${d.news.map(n=>`<li>${E(n)}</li>`).join('')||'<li>A quiet stretch of days.</li>'}</ul>${btn('Continue','close','','gilt')}`;}

/* ---------------- shared world: the host uploads, everyone else catches up from it ---------------- */
const WCHUNK=180000;
function worldOnly(){const keep={};for(const k in S){if(['P','byId','byLoc','stock','sstock','digest','catchup','chat','pmUnread','hall'].includes(k)||k[0]==='_')continue;keep[k]=S[k];}
  keep.market=(S.market||[]).filter(L=>L.seller!=='P');if(S.boss){keep.boss=Object.assign({},S.boss,{contrib:Object.assign({},S.boss.contrib)});delete keep.boss.contrib.P;}
  if(S.tourney){keep.tourney=Object.assign({},S.tourney,{reg:false,pending:null,entrants:(S.tourney.entrants||[]).filter(x=>x!=='P'),alive:(S.tourney.alive||[]).filter(x=>x!=='P'),cur:(S.tourney.cur||[]).map(m=>m.map(x=>x==='P'?null:x)),winners:(S.tourney.winners||[]).filter(x=>x!=='P')});}
  for(const g of S.guilds)if(g.isPlayer)keep.guilds=(keep.guilds||S.guilds).filter(x=>!x.isPlayer);keep.guilds=(keep.guilds||S.guilds).map(g=>Object.assign({},g,{members:g.members.filter(x=>x!=='P'),officers:g.officers.filter(x=>x!=='P')}));
  return JSON.stringify(keep,(k,v)=>{if(k==='mem'||k==='inParty'||k==='agreedP'||k==='convo'||k==='joined'||(k&&k[0]==='_'))return undefined;return v;});}
async function uploadWorld(){if(!NET.db||!NET.isHost||!S||!S.P||S.catchup)return false;try{const str=await compress(worldOnly());const parts=[];for(let i=0;i<str.length;i+=WCHUNK)parts.push(str.slice(i,i+WCHUNK));
  for(let i=0;i<parts.length;i++)await NET.db.doc(`world/w${i}`).set({d:parts[i]});await NET.db.doc('world/meta').set({chunks:parts.length,real:Date.now(),time:S.time,day:T.day(S.time),host:S.P.user,v:S.v});NET.lastUpload=Date.now();return true;}
  catch(e){console.warn('world upload',e);if(e&&e.code==='invalid_argument')NET.isHost=false;return false;}}
async function fetchWorldMeta(){if(!NET.db)return null;try{const m=await NET.db.doc('world/meta').get();const d=m.exists?m.data():null;return d&&d.real>=LAUNCH.resetEpoch?d:null;}catch(e){return null;}}
async function adoptWorld(meta){ // merge the shared world into the local save, keeping the player's own things
  try{let str='';for(let i=0;i<meta.chunks;i++){const c=await NET.db.doc(`world/w${i}`).get();if(!c.exists)return false;str+=c.data().d;}const W=JSON.parse(await decompress(str));if(!W.npcs||!W.guilds)return false;
    const P=S.P,oldNpcs=S.byId||{};const mem={},party=P?P.party.slice():[];for(const n of S.npcs)if(n.mem&&n.mem.P)mem[n.id]=n.mem.P;
    const myGuilds=S.guilds.filter(g=>g.isPlayer);const myListings=S.market.filter(L=>L.seller==='P');const keepChat=S.chat,keepPm=S.pmUnread,keepHall=S.hall;
    for(const k in W)S[k]=W[k];S.P=P;S.chat=keepChat;S.pmUnread=keepPm;S.hall=keepHall||[];
    for(const n of S.npcs){n.mem=n.mem||{};if(mem[n.id])n.mem.P=mem[n.id];n.inParty=party.includes(n.id);}
    if(P){P.party=party.filter(id=>S.npcs.some(n=>n.id===id));for(const g of myGuilds){if(!S.guilds.some(x=>x.id===g.id))S.guilds.push(g);for(const id of g.members)if(id!=='P'){const n=S.npcs.find(x=>x.id===id);if(n&&!n.guild){n.guild=g.id;n.grank='Member';}}}
      const g=guild(P.guild);if(P.guild&&g&&!g.members.includes('P'))g.members.push('P');if(P.guild&&!g){P.guild=null;P.grank=null;}
      S.market=S.market.filter(L=>L.seller!=='P').concat(myListings);if(S.tourney)S.tourney.reg=false;}
    reindex();S.real=meta.real;S.worldFrom=meta.host;return true;}
  catch(e){console.warn('adopt world',e);return false;}}
