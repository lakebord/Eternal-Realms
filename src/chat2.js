/* ETERNAL REALMS — living chat II: multi-person conversation threads, guild & party chatter, conversational memory */
'use strict';
function seq(lines){let t=0;for(const [n,ch,txt,gap] of lines){if(!n||!txt)continue;t+=gap||U.ri(2500,7000);say(n,ch,txt,t);}}
function others(ex,f){return onlineNpcs(n=>!ex.includes(n)&&(!f||f(n)));}
function lvlRangeLoc(n){const c=Object.keys(LOCS).filter(l=>!isTown(l)&&!LOCS[l].hid&&LOCS[l].lv[0]<=n.level+2&&LOCS[l].lv[1]>=n.level-4);return U.pick(c.length?c:['greenmarch']);}
const THREADS=[
  // farming question answered from real knowledge
  ()=>{const a=talker();if(!a)return;const k=U.pick(['crystal_fire','herb_frost','ore_mithril','silk','pearl','storm_crystal','gem_shard','werewolf_fang','herb_moon','scale_drake']);const b=U.pick(others([a],n=>itemSources(k).some(l=>n.knows.includes(l))));
    const ans=b&&answerWhere(b,ITEMS[k].n);seq([[a,'global',`where do people farm ${ITEMS[k].n.toLowerCase()}?`,500],[b,'global',ans?`@${a.user} ${ans}`:null],[a,'global',ans?U.pick(['ty!','perfect, thanks','omw']):null]]);},
  // rivals argue
  ()=>{const a=U.pick(onlineNpcs(n=>n.rivals.some(r=>r!=='P'&&npc(r)&&online(npc(r)))));if(!a)return;const b=npc(a.rivals.find(r=>r!=='P'&&npc(r)&&online(npc(r))));
    seq([[a,'global',U.pick([`@${b.user} still waiting for that rematch`,`${b.user} got carried to level ${b.level}`,`@${b.user} nice gear, did you buy it?`]),500],[b,'global',U.pick([`@${a.user} I beat you twice already`,`@${a.user} jealous much?`,'lol ok','not this again'])],
      [U.pick(others([a,b])),'global',U.pick(['here we go again 🍿','just duel already','get a room you two','I bet on '+U.pick([a.user,b.user])])],[a,'global',U.pick(['arena. tonight.','whatever','😤'])]]);},
  // haggling over a real listing
  ()=>{const L=U.pick(S.market.filter(x=>x.seller&&npc(x.seller)&&online(npc(x.seller))));if(!L)return;const s=npc(L.seller),b=U.pick(others([s],n=>n.gold>L.price*0.5));if(!b)return;const off=Math.round(L.price*U.rf(0.6,0.85));
    seq([[s,'trade',`WTS ${itemName(L.item)} — ${U.fmt(L.price)}g`,500],[b,'trade',`@${s.user} ${U.fmt(off)}?`],[s,'trade',s.tr.greed>0.6?U.pick(['lol no','firm price','not a chance']):`${U.fmt(Math.round((off+L.price)/2))} and it's yours`],[b,'trade',U.pick(['deal','pass','I\'ll think about it','sending trade'])]]);},
  // guild recruitment Q&A
  ()=>{const g=U.pick(S.guilds.filter(g=>!g.isPlayer));if(!g)return;const L=npc(g.leader);if(!L||!online(L))return;const b=U.pick(others([L],n=>!n.guild));
    seq([[L,'recruit',`${g.name} [${g.tag}] recruiting! ${g.motto}`,500],[b,'recruit',b?`@${L.user} what's the level req?`:null],[L,'recruit',b?`@${b.user} ${g.req}+, we're ${g.members.length} strong, mostly ${g.goal==='raid'?'raiding':g.goal==='pvp'?'pvp':g.goal==='wealth'?'trading':'chilling'}`:null],[b,'recruit',b?(b.level>=g.req?'sending app':'aw, too low'):null]]);},
  // newbie question answered by veterans
  ()=>{const a=U.pick(onlineNpcs(n=>n.level<10));const v=U.pick(onlineNpcs(n=>n.level>40&&n.tr.kind>0.5));if(!a||!v)return;const q=U.pick([['what\'s the best class for solo?',['Ranger. The wolf tanks for you','Paladin, heals and hits','honestly any class with self heals']],['how do I get an advanced class?',['level up and train mastery, then find the mentor','check your Hero tab, it lists requirements']],['is the goblin warrens hard?',['bring a healer for the King','not if you\'re 8+, watch the shamans']],['where do I make money early?',['gather herbs and sell them','do the town quest boards, best gold early']]]);
    seq([[a,'global',q[0],500],[v,'global',`@${a.user} ${U.pick(q[1])}`],[a,'global',U.pick(['thanks!!','ty','got it'])],[U.pick(others([a,v])),'global',U.chance(0.5)?'welcome to the realms 👋':null]]);},
  // dungeon tips with real boss data
  ()=>{const d=U.pick(Object.keys(LOCS).filter(l=>LOCS[l].boss));const B=MONSTERS[LOCS[d].boss];const a=U.pick(onlineNpcs(n=>Math.abs(n.level-LOCS[d].lv[0])<6));const v=U.pick(onlineNpcs(n=>n.level>LOCS[d].lv[1]+5));if(!a||!v)return;
    seq([[a,'global',`first time doing ${LOCS[d].n}, any tips?`,500],[v,'global',`@${a.user} ${B.n} ${B.w&&B.w.length?`is weak to ${B.w[0]}`:'hits hard'}${B.st?`, bring antidotes for the ${STATUS[B.st[0]].n.toLowerCase()}`:''}. ${B.b.includes('caster')?'Spread out.':'Tank in front.'}`],[a,'global',U.pick(['noted, ty','wish me luck','that sounds terrifying'])]]);},
  // lore / mystery debate
  ()=>{const a=talker(),b=U.pick(others([a])),c=U.pick(others([a,b],n=>n.knows.includes('hollow')||n.level>60));if(!a||!b)return;const t=U.pick([['anyone actually found the Hollow of Whispers?','pretty sure it\'s a myth',c?'it\'s real. follow the whispers west of Moonfall':null],['do you think the Sun-Engine is waking up?','the scholars in Lothirien think so','the Spire pulses every hundred years, it\'s due'],['is Dawnbreaker really under the cathedral?','people have been looking for 900 years','maybe the Lion Guard has it']]);
    seq([[a,'global',t[0],500],[b,'global',t[1]],[c||U.pick(others([a,b])),'global',t[2]]]);},
  // jokes
  ()=>{const a=talker(),b=U.pick(others([a],n=>n.tr.humor>0.5));const j=U.pick([['why did the skeleton skip the raid?','no body to go with'],['how many dwarves does it take to light a forge?','one, but he\'ll complain about it for a week'],['my wolf companion is better at pvp than me','same and mine is a slime'],['tried to bribe a dragon','how\'d that go','I\'m typing from the inn 💀']]);
    seq([[a,'global',j[0],500],[b,'global',j[1]],[U.pick(others([a,b])),'global',j[2]||U.pick(['😂','lmao','boo 🍅','that\'s terrible','I hate that I laughed'])]]);},
  // boss / event chatter
  ()=>{const ev=U.pick(evActive());const a=talker(),b=U.pick(others([a]));if(!a||!b)return;
    if(S.boss){const B=S.boss;seq([[a,'global',`${MONSTERS[B.id].n} at ${Math.round(B.hp/B.mhp*100)}%, who's still fighting?`,500],[b,'global',U.pick(['me, need healers','died twice, going back','omw with my guild'])]]);return;}
    if(ev){seq([[a,'global',`anyone doing anything for the ${EVENT_TYPES[ev.kind].n.toLowerCase()}?`,500],[b,'global',U.pick(['farming obviously','yeah, with my guild','nah too risky','it\'s the best time to level'])]]);return;}
    seq([[a,'global','dead quiet tonight',500],[b,'global',U.pick(['calm before the storm','good, I can grind in peace','everyone\'s in dungeons'])]]);},
  // celebrating a real high-level player
  ()=>{const t=S.npcs.filter(n=>!n.retired&&online(n)).sort((a,b)=>b.level-a.level)[U.ri(0,4)];const a=U.pick(others([t]));if(!t||!a)return;
    seq([[a,'global',`@${t.user} how did you get so strong??`,500],[t,'global',t.tr.arrog>0.6?'talent':U.pick(['lots of dungeons and lots of dying','grind and good friends',`${t.level} levels of pain`])],[a,'global',U.pick(['respect','goals','teach me'])]]);}
];
function thread(){if(!S||!S.P||S.catchup)return;try{U.pick(THREADS)();}catch(e){console.warn('thread',e);}}

/* guild chatter: guildmates talk among themselves and to you */
function guildChatter(){const P=S.P;if(!P||!P.guild||S.catchup)return;const g=guild(P.guild);if(!g)return;const ms=g.members.filter(x=>x!=='P').map(npc).filter(n=>n&&online(n));if(!ms.length)return;
  const a=U.pick(ms),b=U.pick(ms.filter(x=>x!==a));const d=lvlRangeLoc(a);const r=U.r();
  if(r<0.18){say(a,'guild',U.pick([`@${P.user} how's it going?`,`@${P.user} want to run ${LOCS[d].n} with me?`,`@${P.user} you on for the guild event later?`,`hey @${P.user}, what are you working on?`]),U.ri(800,3000));a.agreedP=S.time;return;}
  if(r<0.35&&b){seq([[a,'guild',U.pick([`anyone up for ${LOCS[d].n}?`,`need 2 for ${LOCS[d].n}`,'world boss as a guild later?']),500],[b,'guild',U.pick(['I\'m in','give me 10 min','can\'t, at work','sure, inv me'])]]);return;}
  if(r<0.5&&b){const top=ms.slice().sort((x,y)=>y.level-x.level)[0];seq([[a,'guild',`gz @${top.user} on lvl ${top.level} btw`,500],[top,'guild',U.pick(['ty!!','thanks guys','❤️'])]]);return;}
  if(r<0.62){say(a,'guild',U.pick([`treasury is at ${U.fmt(g.treasury)}g`,`morale feels ${g.morale>0.6?'great':g.morale>0.4?'ok':'low'} lately`,`we're rank #${S.guilds.slice().sort((x,y)=>guildPower(y)-guildPower(x)).indexOf(g)+1} now`,`${g.rivals.length?guild(g.rivals[0])?guild(g.rivals[0]).name+' talking trash again':'quiet day':'quiet day'}`]),U.ri(500,3000));return;}
  if(r<0.75&&b){const k=U.pick(['ore_iron','herb_moon','leather','silk','crystal_mana']);seq([[a,'guild',`anyone have spare ${ITEMS[k].n.toLowerCase()}?`,500],[b,'guild',U.pick(['I have some, sending','nope sorry','check the AH'])]]);return;}
  if(r<0.87){say(a,'guild',U.pick(['brb','back','lol','gn guild','morning all','who\'s on?','that last raid was wild','anyone else lagging?']),U.ri(500,3000));if(b&&U.chance(0.5))say(b,'guild',U.pick(['o/','gn','hey','lol same']),U.ri(3500,7000));return;}
  if(b)seq([[a,'guild',`what does everyone think of ${S.wars.length?'the war':'the new events'}?`,500],[b,'guild',U.pick(['good for business','scary','I just want to level in peace','free xp'])]]);}
function partyChatter(){const P=S.P;if(!P||!P.party.length||S.catchup)return;const n=U.pick(partyMembers());if(!n)return;
  say(n,'party',U.pick([`where to next?`,`hp check, I'm at ${Math.round(n.hpPct*100)}%`,'need to restock potions soon',`${LOCS[lvlRangeLoc(n)].n} is good xp for us`,'lead the way','this is fun','brb 2 min','nice teamwork']),U.ri(500,2500));}

/* small talk that actually reacts to what you said */
function smallTalk(n,text){const t=text.toLowerCase();const P=S.P;
  if(/(how are you|how's it going|hows it going|you ok|sup|what's up|whats up)/.test(t))return U.pick([`good! just ${n.act} in ${LOCS[n.loc].n}`,n.hpPct<0.5?'barely alive lol':'not bad, you?','tired but leveling','living the dream']);
  if(/(what are you doing|wyd|what r u doing|where are you)/.test(t))return `${n.act} in ${LOCS[n.loc].n}${n.goal?`, trying to ${goalText(n.goal)}`:''}`;
  if(/(what class|your class)/.test(t))return `${className(n)}. ${n.level>30?'love it':'still learning it'}`;
  for(const c in CLASSES)if(t.includes(CLASSES[c].name.toLowerCase()))return U.pick([`${CLASSES[c].name}s are ${['great in parties','underrated','op right now','fun but squishy'][U.ri(0,3)]}`,`my friend plays ${CLASSES[c].name}, she loves it`,`${CLASSES[c].name}? solid pick`]);
  const loc=findLocByText(text);if(loc)return n.knows.includes(loc)?U.pick([`${LOCS[loc].n} is ${LOCS[loc].lv[0]>n.level?'too hard for me':'decent'}`,`I farmed ${LOCS[loc].n} for days`,`${LOCS[loc].n}? ${LOCS[loc].mon.length?'watch the '+pl(MONSTERS[LOCS[loc].mon[0]].n).toLowerCase():'nice place'}`]):`never been to ${LOCS[loc].n}`;
  if(/(guild)/.test(t))return n.guild?`I'm in ${guild(n.guild).name}, it's ${guild(n.guild).morale>0.5?'great':'ok'}`:'no guild for me, solo life';
  if(/(loot|drop|gear)/.test(t))return n.bestDrop||U.pick(['rng hates me','got a nice drop yesterday',`my gear score is ${gearScore(n.equip)}`]);
  if(/(gold|money|rich|poor)/.test(t))return n.gold>10000?'can\'t complain 💰':'always broke lol';
  if(/(level|lvl)/.test(t))return `I'm ${n.level}, you're ${P.level}`;
  if(/(boss|raid)/.test(t))return S.boss?`${MONSTERS[S.boss.id].n} is up in ${LOCS[S.boss.loc].n}`:'no boss right now';
  if(/(war|kingdom|politic)/.test(t))return S.wars.length?`${FACTIONS[S.wars[0].a].n} vs ${FACTIONS[S.wars[0].b].n}, it's a mess`:'peace for now';
  if(/(love|like|cool|nice|awesome)/.test(t))return U.pick(['same!','right?','facts','glad you think so']);
  if(/\?$/.test(t))return U.pick(['hmm, not sure','good question','idk honestly','maybe ask in a library?','I think so?']);
  return U.pick(['haha','true','for real',`what about you, ${P.user}?`,'nice','lol yeah','agreed','interesting','where are you headed next?','what class are you btw?']);}
