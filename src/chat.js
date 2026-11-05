/* ETERNAL REALMS — MMO chat: autonomous conversation, player intent parsing, conversations, optional Claude AI */
'use strict';
const CHANNELS = {global:'Global',local:'Local',trade:'Trade',recruit:'Recruit',guild:'Guild',party:'Party',system:'System'};
const CQ = []; // queued (delayed) messages: {at,ch,from,text,to}
const AI = {enabled:false,busy:false,last:0,fn:null}; // fn set by net.js when `sample` is available

function chatPush(ch,from,text,extra={}){
  const m=Object.assign({t:Date.now(),gt:S.time,ch,from,text},extra);
  if(ch==='pm'){const k=extra.with;S.chat.pm[k]=S.chat.pm[k]||[];S.chat.pm[k].push(m);if(S.chat.pm[k].length>60)S.chat.pm[k].shift();if(from!=='P'){S.pmUnread[k]=(S.pmUnread[k]||0)+1;}}
  else{const a=S.chat[ch]=S.chat[ch]||[];a.push(m);if(a.length>150)a.shift();}
  if(typeof UI!=='undefined'&&UI.onChat)UI.onChat(m);return m;}
function say(n,ch,text,delay=0,extra){if(!n||!text)return;CQ.push(Object.assign({at:Date.now()+delay,ch,from:n.id,text:voice(n,text)},extra||{}));
  if(S&&S.P&&(ch==='pm'||text.includes('@'+S.P.user)))S.engaged={id:n.id,ch,t:Date.now()+delay};}
function sys(text,delay=0){CQ.push({at:Date.now()+delay,ch:'system',from:'SYS',text});}
function pm(n,text,delay=1500){say(n,'pm',text,delay,{with:n.id});}
function flushChat(){const now=Date.now();for(let i=CQ.length-1;i>=0;i--){const q=CQ[i];if(q.at<=now){CQ.splice(i,1);const n=npc(q.from);if(q.from!=='SYS'&&n&&!online(n)&&q.ch!=='pm')continue;
  if(q.ch==='guild'&&(!S.P.guild||(n&&n.guild!==S.P.guild)))continue;if(q.ch==='party'&&n&&!S.P.party.includes(n.id))continue;
  if(q.ch==='local'&&n&&n.loc!==S.P.loc)continue;if(n&&S.P.blocked.includes(n.id))continue;
  chatPush(q.ch,q.from,q.text,q.with?{with:q.with}:{});}}}

/* ---- personality voice ---- */
function styleOf(n){if(n._style)return n._style;const h=[...n.id].reduce((s,c)=>s+c.charCodeAt(0),0)%10;const t=n.tr;
  n._style=t.arrog>0.75?'arrogant':t.social<0.25?'shy':t.humor>0.75?'funny':h<3?'casual':h<5?'proper':h<7?'lower':h<8?'caps':'casual';return n._style;}
function voice(n,txt){const s=styleOf(n);let t=txt;
  const keepAt=f=>t.replace(/@[\w\-]+|[^@]+/g,w=>w[0]==='@'?w:f(w));
  if(s==='lower'||s==='shy')t=keepAt(w=>w.toLowerCase()).replace(/[.!]+$/,'');
  if(s==='shy'&&U.chance(0.3)&&!/\)$/.test(t))t+=' :)';
  if(s==='funny'&&U.chance(0.45))t+=' '+U.pick(['😂','lol','xD','lmao','🤣','(╯°□°)╯︵ ┻━┻']);
  if(s==='arrogant'&&U.chance(0.25))t+=U.pick([' ez',' obviously',' 😎','.']);
  if(s==='caps'&&U.chance(0.3))t=keepAt(w=>w.toUpperCase());
  if(s==='casual')t=t.replace(/\byou\b/g,U.chance(0.5)?'u':'you').replace(/\bare\b/g,U.chance(0.4)?'r':'are').replace(/\bplease\b/g,'pls');
  if(n.tr.talk>0.8&&U.chance(0.2))t+=U.pick([' anyway',' btw',' haha',' honestly']);
  return t;}
function onlineNpcs(f){return S.npcs.filter(n=>online(n)&&!n.retired&&(!f||f(n)));}
function talker(f){return U.wpick(onlineNpcs(f),n=>0.1+n.tr.talk*1.5+n.tr.social*0.5);}

/* ---- knowledge: what an NPC can reasonably say about places ---- */
function dirWord(from,to){const a=LOCS[from],b=LOCS[to];const dx=b.x-a.x,dy=b.y-a.y;const ang=Math.atan2(-dy,dx)*180/Math.PI;
  const d=['east','north-east','north','north-west','west','south-west','south','south-east'];return d[Math.round(((ang+360)%360)/45)%8];}
function nearCity(loc){let best=null,bd=1e9;for(const l in LOCS){if(LOCS[l].ty!=='city'&&LOCS[l].ty!=='town')continue;if(l===loc)continue;const L=LOCS[l],M=LOCS[loc];const d=Math.hypot(L.x-M.x,L.y-M.y);if(d<bd){bd=d;best=l;}}return best;}
function describePlace(n,loc){const c=nearCity(loc);const L=LOCS[loc];const mon=L.mon.length?` Watch out for the ${MONSTERS[U.pick(L.mon)].n.toLowerCase()}s.`:'';
  return `${L.ty==='dungeon'?'There\'s a dungeon':L.ty==='ruin'?'There are ruins':'Try'} ${c?`${dirWord(c,loc)} of ${LOCS[c].n}`:''}, ${L.n}.${mon}`;}
function findItemByText(txt){const t=txt.toLowerCase();let best=null;for(const k in ITEMS){const nm=ITEMS[k].n.toLowerCase();const sing=nm.replace(/s$/,'');if(t.includes(nm)||t.includes(sing)||t.includes(nm.split(' ').slice(-1)[0]+'s')&&nm.split(' ').length>1&&t.includes(nm.split(' ')[0])){if(!best||nm.length>ITEMS[best].n.length)best=k;}}return best;}
function findMonByText(txt){const t=txt.toLowerCase();for(const k in MONSTERS){const w=MONSTERS[k].n.toLowerCase().split(' ').slice(-1)[0].replace(/'s$/,'');if(w.length>3&&(t.includes(w+'s')||t.includes(w)))return k;}return null;}
function findLocByText(txt){const t=txt.toLowerCase();let best=null,bl=0;for(const k in LOCS){const nm=LOCS[k].n.toLowerCase().replace(/^(the|old|ruins of) /,'').replace(/^ruins of old /,'');const parts=nm.split(' ');
  const key=parts.find(p=>p.length>4&&!['fields','grotto','valley','summit','pass','lake','hold','ruins'].includes(p))||parts[0];if(t.includes(nm)&&nm.length>bl){best=k;bl=nm.length;}else if(key&&t.includes(key)&&key.length>bl){best=k;bl=key.length;}}
  if(!best&&/\bmine\b/.test(t))best='mine';return best;}
function itemSources(k){const out=[];for(const l in LOCS){if((LOCS[l].res||[]).some(r=>r[0]===k))out.push(l);else if(LOCS[l].mon.some(m=>(MONSTERS[m].loot||[]).some(x=>x[0]===k)))out.push(l);}return out;}
function answerWhere(n,txt){
  const it=findItemByText(txt);if(it){const src=itemSources(it).filter(l=>n.knows.includes(l));if(!src.length)return U.chance(0.5)?`no idea where to get ${ITEMS[it].n.toLowerCase()} tbh`:null;const l=src.sort((a,b)=>Math.abs(LOCS[a].lv[0]-S.P.level)-Math.abs(LOCS[b].lv[0]-S.P.level))[0];
    const viaMon=LOCS[l].mon.find(m=>(MONSTERS[m].loot||[]).some(x=>x[0]===it));return `${describePlace(n,l)}${viaMon&&!(LOCS[l].res||[]).some(r=>r[0]===it)?` ${pl(MONSTERS[viaMon].n)} drop them.`:''}`;}
  const m=findMonByText(txt);if(m){const ls=Object.keys(LOCS).filter(l=>LOCS[l].mon.includes(m)&&n.knows.includes(l));if(!ls.length)return null;return `${pl(MONSTERS[m].n)}? ${LOCS[ls[0]].n} has plenty (lvl ${LOCS[ls[0]].lv[0]}-${LOCS[ls[0]].lv[1]}).`;}
  const loc=findLocByText(txt);if(loc){if(!n.knows.includes(loc))return LOCS[loc].hid?'never heard of it. sounds like a myth':`never been to ${LOCS[loc].n} myself`;const p=path(S.P.loc,loc,true);
    return p?`${LOCS[loc].n} is ${dirWord(S.P.loc,loc)} of you, about ${p.hours}h: ${p.path.map(x=>LOCS[x].n).join(' → ')}. It's lvl ${LOCS[loc].lv[0]}-${LOCS[loc].lv[1]}.`:null;}
  if(/(level|lvl|grind|farm|xp|exp)/i.test(txt)){const l=bestHuntLoc(Object.assign({},n,{level:S.P.level,knows:n.knows,tr:{brave:0.5}}));return l?`at lvl ${S.P.level} I'd grind ${LOCS[l].n}`:null;}
  return null;}

/* ---- spontaneous chatter ---- */
const TOPICS = {
  advice:['Tip for new players: rest at the inn before dungeons. Potions are not cheap.','Pro tip: Examine things when you explore. You find lore and sometimes gold.','Don\'t skip mastery training, it adds up.',
    'If you\'re a caster, back row. Trust me.','Wolves come in packs. Use AoE.','Parry is OP against brutes ngl','Bonding a summon only works below 30% HP btw','Undead resist shadow but melt to holy and fire.'],
  humor:['Just got one-shot by a rat. A RAT.','Why do goblins always have more gold than me','My summon is smarter than my party','Inventory full of Old Bones. Why do I keep these.','Spent 3 hours fishing. Caught 2 trout and lost my will to live.',
    'Anyone else\'s bard sing out of tune or is it just me','dwarves when they see mithril:','I named my wolf "Snacks"','grinding is my cardio'],
  question:['Is the Sunken Citadel worth running at lvl 40?','What\'s better for a knight, mace or sword?','Does anyone actually use Smoke Bombs?','Are Mithril weapons worth the price right now?','Any healers online?','How long until the next tournament?','Which race is best for mage?'],
  smalltalk:['Good morning Realms!','Back from vacation, what did I miss?','Anyone else just vibing in Valeria plaza','Rainy day in Saltmere again','Whoever is playing the lute in Crossroads, ty','The sunset at Crystal Lake is unreal','Bloodrock pit fights tonight anyone?','gn everyone, logging off','Coffee + dungeon = perfect morning'],
  complaint:['Ironford smith prices are a joke','Lag at the world boss was insane','Who keeps camping the Moonfall Stag spawn','RNG hates me, 40 runs no drop','Why is the Frostpeak Pass so cold, I\'m a dwarf and even I hate it'],
  brag:['Solo\'d Fort Grimward. No potions.','My crit just did 4k lol','Finally got my set bonus... oh wait there are no set bonuses','First try on the Aether Warden 😎']
};
const ANSWERS = {
  'Is the Sunken Citadel worth running at lvl 40?':['only with a good healer','yes, the pearls sell well','nah wait until 42+'],
  'What\'s better for a knight, mace or sword?':['sword for parry','mace, Skullcrack stun is busted','whatever has the higher level'],
  'Does anyone actually use Smoke Bombs?':['saved my life vs the hydra','only cowards. so yes, me','lol no'],
  'Are Mithril weapons worth the price right now?':['craft them yourself, it\'s cheaper','check the auction house, prices dropped','no, wait a few levels for adamantite'],
  'Any healers online?':['me, what do you need','depends what for','LunaPaw is usually around'],
  'How long until the next tournament?':['check the arena in Valeria','few days I think','every 7 days'],
  'Which race is best for mage?':['High Elf obviously','Draconian for fire builds','play what you like tbh']
};
function ambient(){
  if(!S||!S.P||S.catchup)return;
  const n=talker();if(!n)return;
  const r=U.r();
  if(r<0.22){const topic=U.wpick(Object.keys(TOPICS),k=>({advice:n.tr.kind,humor:n.tr.humor,question:0.6,smalltalk:n.tr.social,complaint:n.tr.greed*0.5+0.1,brag:n.tr.arrog})[k]);const line=U.pick(TOPICS[topic]);say(n,'global',line);
    if(ANSWERS[line]){const k=talker(o=>o!==n);if(k)say(k,'global',`@${n.user} ${U.pick(ANSWERS[line])}`,U.ri(3000,9000));}
    else if(topic==='humor'&&U.chance(0.5)){const k=talker(o=>o!==n);if(k)say(k,'global',U.pick(['lmao','same','😂😂','relatable','skill issue','f']),U.ri(2000,6000));}
    else if(topic==='brag'&&U.chance(0.6)){const k=talker(o=>o!==n);if(k)say(k,'global',U.pick(['pics or it didn\'t happen','nice','sure buddy',`gz ${n.user}`,'cap']),U.ri(2000,7000));}
    return;}
  if(r<0.36){ // trade chatter backed by real listings or needs
    const L=S.market.filter(x=>x.seller===n.id)[0];if(L){say(n,'trade',`WTS ${itemName(L.item)} ${U.fmt(L.price)}g, on the AH`);return;}
    const need=U.pick(['ore_mithril','herb_frost','crystal_fire','scale_drake','pearl','leather','ingot_steel','silk']);say(n,'trade',`WTB ${ITEMS[need].n} x${U.ri(5,20)}, paying ${Math.round(ITEMS[need].v*U.rf(1.1,1.6))}g each`);return;}
  if(r<0.46&&n.guild){const g=guild(n.guild);if(g&&!g.isPlayer&&g.leader===n.id||U.chance(0.2)){say(n,'recruit',`${g.name} [${g.tag}] recruiting lvl ${g.req}+ • ${g.motto} • HQ ${LOCS[g.hq].n} • ${g.members.length} members • whisper me`);return;}}
  if(r<0.52){const d=Object.keys(LOCS).filter(l=>LOCS[l].boss&&LOCS[l].lv[0]<=n.level+3&&LOCS[l].lv[1]>=n.level-6);if(d.length){const l=U.pick(d);say(n,U.chance(0.5)?'recruit':'global',`LFG ${LOCS[l].n}, need ${U.pick(['tank','healer','dps','1 more','healer + tank'])}, lvl ${Math.max(1,n.level-4)}+`);n.lfg={loc:l,t:S.time};return;}}
  if(r<0.64&&n.tr.compet>0.6&&S.npcs.length){const o=n.rivals.map(npc).find(x=>x&&online(x));if(o){say(n,'global',U.pick([`@${o.user} rematch at the arena. now.`,`${o.user} still hiding from me?`,`@${o.user} I've been training. you're done.`]));if(U.chance(0.6))say(o,'global',U.pick([`@${n.user} lol ok`,`@${n.user} you lost 3 times already`,'bring it','not this again']),U.ri(3000,8000));return;}}
  if(r<0.72){const lb=S.npcs.filter(x=>!x.retired).sort((a,b)=>b.level-a.level).slice(0,5);const top=U.pick(lb);if(top!==n)say(n,'global',U.pick([`how is ${top.user} already lvl ${top.level}`,`${top.user} carried my raid yesterday ngl`,`anyone seen ${top.user}'s gear? insane`,`${top.user} for Warchief 2026`]));return;}
  // local chatter near player
  const here=(S.byLoc[S.P.loc]||[]).filter(x=>online(x)&&!x.inParty);if(here.length&&U.chance(0.6)){const h=U.pick(here);say(h,'local',U.pick(isTown(S.P.loc)?['anyone selling potions here?','this inn needs better ale','who wants to group for the nearby dungeon?','afk 5 min','nice weather today','selling cheap gear, pm me']:['careful, monsters spawn fast here','anyone else farming here?','need help with these mobs','loot is decent here tbh','this place is creepy at night']));return;}
  const t=U.pick(TOPICS.smalltalk);say(n,'global',t);}

/* ---- event-driven chatter ---- */
BUS.on((type,d)=>{if(!S||!S.P||S.catchup)return;const P=S.P;const cl=(n,ch,txt,dl)=>say(n,ch,txt,dl);
  try{switch(type){
  case 'levelup':{const n=d.n;if(!online(n))break;const big=n.level%10===0;if(U.chance(big?0.7:0.12+n.tr.talk*0.15)){const L=n.level;
    cl(n,'global',styleOf(n)==='arrogant'?`lvl ${L}. Try to keep up.`:styleOf(n)==='shy'?`lvl ${L} :)`:U.pick([`Just reached lvl ${L} LETS GO!`,`DING ${L}!!`,`finally lvl ${L}`,`lvl ${L} after ${U.ri(2,9)} hours of grinding 😭`,`${L}!`]),U.ri(500,3000));
    const fr=n.friends.map(npc).filter(f=>f&&online(f)).slice(0,U.ri(0,3));fr.forEach((f,i)=>cl(f,'global',U.pick([`Congrats ${n.user}!`,'gz!',`grats ${n.user}`,'congrats dude!','gg']),U.ri(3000,9000)+i*1500));
    const rv=n.rivals.map(npc).find(r=>r&&online(r));if(rv&&U.chance(0.4))cl(rv,'global',U.pick(['took you long enough',`I was ${L} last week`,'cute']),U.ri(6000,12000));
    if(n.friends.includes('P')&&U.chance(0.5))pm(n,`hey I just hit ${L}!`,U.ri(4000,9000));}break;}
  case 'cap':{sys(`${d.n.user} has reached Lv.100!`);const k=talker(o=>o!==d.n);if(k)cl(k,'global',`${d.n.user} hit 100?? legend`,4000);break;}
  case 'loot':{const n=d.n;if(!online(n)||!U.chance(d.it.u?0.95:0.4))break;cl(n,'global',d.it.u?`OMG ${itemName(d.it)} DROPPED!!! 🔥`:U.pick([`Just got ${itemName(d.it)} from ${LOCS[d.loc].n}!`,`${itemName(d.it)} drop lets gooo`,`finally ${itemName(d.it)}`]),U.ri(500,2500));
    if(U.chance(0.5)){const k=talker(o=>o!==n);if(k)cl(k,'global',U.pick(['jealous','nice!!','gz','how much?',`what's the rarity on that`,'rngesus blesses you']),U.ri(3000,8000));}break;}
  case 'boss_spawn':{const B=d.boss;sys(`World Boss ${MONSTERS[B.id].n} has appeared in ${LOCS[B.loc].n}!`);
    const ks=onlineNpcs(n=>n.level>=B.lvl-25);for(let i=0;i<Math.min(4,ks.length);i++){const k=U.pick(ks);cl(k,i%2?'recruit':'global',U.pick(['Anyone forming a raid?',`LF raid ${MONSTERS[B.id].n}, need healers!`,`${MONSTERS[B.id].n} again? last time it wiped us`,'omw!!',`Raid forming at ${LOCS[B.loc].n}, all lvl ${B.lvl-20}+ welcome`,'who\'s tanking?']),U.ri(2000,15000)+i*3000);}break;}
  case 'boss_dead':{sys(`${d.M.n} has been slain! Final blow: ${actorName(d.lastHit)}.`);const top=d.ranked.slice(0,3).map(r=>actorName(r[0]));sys(`Top damage: ${top.join(', ')}`,1500);
    if(d.lastHit!=='P'){const n=npc(d.lastHit);if(n)cl(n,'global',U.pick(['LAST HIT LETS GOOOO','gg everyone!!','ez','we did it!!']),3000);}
    const k=talker();if(k)cl(k,'global',U.pick(['gg raid','that was close','loot pls','i got nothing again 😭']),6000);break;}
  case 'boss_flee':sys(`${MONSTERS[d.B.id].n} has retreated from ${LOCS[d.B.loc].n}.`);break;
  case 'lfg':{const n=d.n;if(!online(n)||!U.chance(0.35))break;cl(n,U.chance(0.5)?'recruit':'global',`LF ${d.need.join(' + ')||'1 more'} for ${LOCS[d.loc].n}, lvl ${Math.max(1,n.level-5)}+`,U.ri(500,4000));n.lfg={loc:d.loc,t:S.time};
    if(Math.abs(P.level-n.level)<=6&&U.chance(0.25+n.tr.social*0.3)&&!P.party.includes(n.id))pm(n,`hey, want to join for ${LOCS[d.loc].n}? we need a ${d.need[0]||'dps'}`,U.ri(5000,12000));break;}
  case 'dungeon':{const lead=d.party[0];if(!online(lead)||!U.chance(0.25))break;cl(lead,'global',d.cleared?U.pick([`${LOCS[d.loc].n} cleared! gg ${d.party.slice(1).map(p=>p.user).join(' ')}`,`another ${LOCS[d.loc].n} clear ✅`]):U.pick([`wiped at ${MONSTERS[LOCS[d.loc].boss].n} again...`,'healer left mid-fight 🙃','we were SO close']),U.ri(500,3000));break;}
  case 'wts':{const n=d.n;if(U.chance(0.4))cl(n,'trade',`WTS ${itemName(d.L.item)} ${U.fmt(d.L.price)}g`,U.ri(500,6000));break;}
  case 'buy':break;
  case 'duel':{if(d.upset&&U.chance(0.6)){const k=talker(o=>o!==d.w&&o!==d.l);if(k)cl(k,'global',U.pick([`did ${d.w.user} just beat ${d.l.user}?? 😂`,`${d.l.user} got destroyed at the arena lol`,`upset of the year: ${d.w.user} > ${d.l.user}`]),U.ri(1000,5000));}
    else if(d.w.tr.arrog>0.7&&U.chance(0.3))cl(d.w,'global',U.pick([`Anyone else want to duel? ${d.l.user} wasn't a challenge.`,'undefeated today','next']),U.ri(1000,4000));
    if(U.chance(0.12)&&d.w.tr.compet>0.6){cl(d.w,'global','Anyone want to duel?',U.ri(6000,12000));const k=talker(o=>o!==d.w);if(k)cl(k,'global',`Don't fight ${d.w.user}, they've been destroying everyone today 😂`,U.ri(12000,18000));}break;}
  case 'npc_death':{const n=d.n;if(!online(n)||!U.chance(0.06+n.tr.humor*0.1))break;cl(n,'global',U.pick([`died ${d.cause} lol`,'rip my repair bill','that did NOT go to plan','back to the inn again 💀']),U.ri(500,4000));break;}
  case 'recruit_ad':{const L=d.L;if(!online(L))break;cl(L,'recruit',`${d.g.name} recruiting lvl ${d.g.req}+! ${d.g.motto} PM ${L.user}`,U.ri(500,8000));
    if(!P.guild&&P.level>=d.g.req&&U.chance(0.15))pm(L,`hey ${P.user}, ${d.g.name} is recruiting. interested? (open my profile and hit Apply)`,U.ri(8000,15000));break;}
  case 'guild_join':{const g=d.g;if(g.isPlayer)sys(`${d.n.user} has joined your guild!`),cl(d.n,'guild',U.pick(['hi everyone!','thanks for the invite','hey guildies o/']),2000);
    else if(d.n.famous)news(`${d.n.user} joined ${g.name}.`,'guild');break;}
  case 'guild_quit':break;
  case 'pguild_quit':sys(`${d.n.user} has left your guild.`);break;
  case 'pguild_suggest':{const n=d.n;cl(n,'guild',U.pick(['we should run a dungeon together sometime','anyone want to farm mats for the guild?','can we do a world boss as a guild?','guild hall when?',`we need a healer in ${d.g.tag}`,'I deposited some gold to the treasury']),U.ri(500,6000));break;}
  case 'guild_chatter':{const g=d.g;break;}
  case 'coup':{const k=talker();if(k)cl(k,'global',`${d.o.user} just took over ${d.g.name} from ${d.old.user}?? drama 🍿`,U.ri(2000,8000));break;}
  case 'gvg':{const m=d.w.members.map(npc).find(x=>x&&online(x));if(m&&U.chance(0.5))cl(m,'global',`${d.w.tag} > ${d.l.tag}. gg ${d.l.name}`,U.ri(1000,6000));break;}
  case 'war':sys(`WAR: ${FACTIONS[d.w.a].n} has declared war on ${FACTIONS[d.w.b].n}! Battles rage at ${LOCS[d.w.front].n}.`);{const k=talker();if(k)cl(k,'global',U.pick(['war again? weapon prices are gonna explode','time to sell swords 💰','not again...','free xp at the front lets go']),5000);}break;
  case 'conquest':sys(`${FACTIONS[d.winner].n} has captured ${LOCS[d.loc].n}!`);break;
  case 'peace':sys(`Peace between ${FACTIONS[d.w.a].n} and ${FACTIONS[d.w.b].n}.`);break;
  case 'treaty':sys(`${FACTIONS[d.a].n} and ${FACTIONS[d.b].n} have signed a treaty.`);break;
  case 'tourney_reg':sys('Grand Tournament registration is open at the Valeria Arena!');break;
  case 'tourney_start':sys('The Grand Tournament has begun!');break;
  case 'tourney_end':sys(`${actorName(d.champ)} is the Grand Tournament Champion!`);{const k=talker();if(k)cl(k,'global',d.champ==='P'?`${P.user} won the tournament?? who is that`:U.pick([`${actorName(d.champ)} deserved it`,'rigged 😤','what a final']),4000);}break;
  case 'tourney_player':sys(`Your Grand Tournament round ${d.round} match against ${actorName(d.opp)} is ready! Go to the Valeria Arena (within 4 hours) or forfeit.`);break;
  case 'retire':{const n=d.n;cl(n,'global',`This is my last day in the Realms. Thanks for everything, guys. It was fun.`,500);n.friends.map(npc).filter(f=>f&&online(f)).slice(0,3).forEach((f,i)=>cl(f,'global',U.pick([`noo ${n.user} 😢`,'o7','legends never die','gonna miss you']),4000+i*2000));break;}
  case 'career':cl(d.n,'global',`Taking a break from combat. Opening a ${MASTERY[d.n.prof].n.toLowerCase()} business, PM me for orders!`,1000);break;
  case 'advance':{cl(d.n,'global',`I'm a ${d.A.name} now!!`,1000);break;}
  case 'goal_done':{const n=d.n;if(online(n)&&U.chance(0.2))cl(n,'global',d.goal.type==='gear'?'gear upgraded, ready for harder content':d.goal.type==='wealth'?'finally saved up 💰':d.goal.type==='pvp'?`hit ${n.pvp.r} rating!`:'goal achieved ✅',U.ri(500,3000));break;}
  case 'discover':if(online(d.n)&&U.chance(0.4))cl(d.n,'global',`whoa I found a hidden place... not telling where 🤫`,1000);break;
  case 'world_event':break;
  case 'social':if(U.chance(0.15))ambient();break;
  case 'event_start':{const ev=d.ev,ET=EVENT_TYPES[ev.kind];sys(`${ET.n}${ev.loc?' — '+LOCS[ev.loc].n:''}: ${ev.kind==='invasion'?`The ${ev.horde} attacks ${LOCS[ev.loc].n}! Defenders needed.`:ET.d}`);
    const k=talker();if(k)cl(k,'global',({bloodmoon:['blood moon tonight, farm time 🩸','everything hits so hard during blood moon','double loot lets go'],blessing:['xp blessing!! everyone go grind','dawnmother blessing, time to level'],eclipse:['eclipse... necros are gonna be insane','undead everywhere, careful'],
      fair:['merchant fair! shopping spree','cheap potions everywhere'],goldrush:['gold rush, farming time 💰'],treasure:[`anyone got the map for ${ev.loc?LOCS[ev.loc].n:'the treasure'}?`,'treasure hunt! dibs'],invasion:[`${ev.loc?LOCS[ev.loc].n:'a town'} under attack, who's defending?`,'invasion! everyone to the walls',`omw to defend ${ev.loc?LOCS[ev.loc].n:''}`],
      migration:['drakes in the lowlands?? that\'s new','drake scales sell for a lot rn'],storm:['this storm is wild','lightning builds feeling op today']})[ev.kind].map(x=>x)[U.ri(0,1)]||'whoa',U.ri(2000,6000));break;}
  case 'invasion_end':sys(d.won?`${LOCS[d.ev.loc].n} held against the ${d.ev.horde}!`:`${LOCS[d.ev.loc].n} was sacked by the ${d.ev.horde}.`);break;
  case 'treasure_found':if(d.n!==S.P)cl(d.n,'global',U.pick(['FOUND THE TREASURE 💰💰','sorry everyone, the treasure is mine','x marked the spot']),1000);break;
  case 'newcomer':{const n=d.n;if(U.chance(0.6))cl(n,'global',U.pick(['hi everyone, just started!','new here, any tips?','hello Realms o/','first day, where do I go?']),U.ri(1000,4000));const k=talker(o=>o!==n&&o.tr.kind>0.5);if(k)cl(k,'global',`welcome @${n.user}! ${U.pick(TOPICS.advice)}`,U.ri(6000,12000));break;}
  case 'npc_say':cl(d.n,d.ch,d.text,800);break;
  case 'npc_pm':pm(d.n,d.text,U.ri(1200,4000));break;
  case 'party_join':cl(d.n,'party',U.pick(['hey!','yo','hi o/','ready when you are','let\'s go']),1500);break;
  case 'party_banter':{const n=U.pick(partyMembers());if(n)cl(n,'party',U.pick(['nice','gg','ez','that was close lol','need mana sec','good pull','loot?','I\'m low hp careful']),1000);break;}
  case 'player_level':{if(d.level%5===0||U.chance(0.2)){P.friends.map(npc).filter(f=>f&&online(f)).slice(0,2).forEach((f,i)=>pm(f,U.pick([`gz on ${d.level}!`,'saw you leveled, congrats!','ding! nice']),4000+i*2500));
    if(P.guild){const g=guild(P.guild);const m=g&&g.members.map(npc).find(x=>x&&online(x));if(m)say(m,'guild',`gz ${P.user} on lvl ${d.level}!`,3000);}}break;}
  case 'player_loot':{const n=U.pick(partyMembers());if(n)say(n,'party',U.pick(['nice drop!','gz on the loot','jealous']),2000);break;}
  case 'player_meet':{const n=d.n;if(U.chance(0.5+n.tr.social*0.3))pm(n,U.pick(['hey 👋','oh hi, farming here too?','yo! what level are you?',`hey ${P.user}`]),2000);break;}
  case 'player_adv':{const k=talker();if(k)say(k,'global',`${P.user} just became a ${d.A.name}? nice`,4000);break;}
  case 'player_guild_join':{say(d.L,'guild',`Welcome ${P.user}!`,2000);const m=guild(P.guild).members.map(npc).filter(x=>x&&x!==d.L&&online(x)).slice(0,2);m.forEach((x,i)=>say(x,'guild',U.pick(['welcome!','o/','hi new person','welcome aboard']),4000+i*2000));break;}
  case 'player_sold':{const b=d.buyer;if(b&&b.user&&U.chance(0.5))pm(b,`bought your ${itemName(d.L.item)}, thanks!`,3000);sys(`Your auction sold: ${itemName(d.L.item)} for ${U.fmt(d.L.price)}g (5% fee).`);break;}
  case 'player_dungeon':{for(const n of partyMembers())say(n,'party',U.pick(['gg!!','clean run','ty for the group','that boss was nuts']),U.ri(1000,4000));break;}
  case 'pvp_result':{const n=d.n;if(d.type==='wpvp'||d.type==='tourney'||!online(n))break;if(d.won){pm(n,n.tr.arrog>0.6?U.pick(['lucky.','rematch. now.','whatever, lag']):U.pick(['gg wp!','nice fight','you got me','well played']),2500);}else pm(n,n.tr.arrog>0.6?U.pick(['ez','not even close','stay down']):U.pick(['gg!','good fight','close one']),2500);break;}
  case 'newday':if(T.day(S.time)%3===0)npcInitiatedPM();break;
  case 'hour':if(U.chance(0.18))npcInitiatedPM();break;
  }}catch(e){console.error(e);}
});

/* NPC-initiated private messages: guild invites, party requests, trade offers, rivals */
function npcInitiatedPM(){const P=S.P;
  const r=U.r();
  if(r<0.3&&!P.guild){const gs=S.guilds.filter(g=>!g.isPlayer&&g.req<=P.level&&g.req>=P.level-30);const g=U.pick(gs);if(g){const L=npc(g.leader);if(L&&online(L)&&U.chance(0.3+P.fame/3000)){pm(L,`hi ${P.user}! ${g.name} [${g.tag}] is looking for active members. we do ${({raid:'raids',pvp:'pvp',wealth:'trading',explore:'exploration',social:'casual stuff'})[g.goal]}. want in? (open my profile → Apply)`,U.ri(2000,8000));}}return;}
  if(r<0.5){const c=(S.byLoc[P.loc]||[]).filter(n=>online(n)&&!n.inParty&&Math.abs(n.level-P.level)<=5&&n.tr.social>0.5);const n=U.pick(c);if(n&&P.party.length<3){pm(n,U.pick([`hey, want to group up? I'm lvl ${n.level} ${CLASSES[n.cls].name}`,'need a party member? I could use help here','duo?']),U.ri(2000,6000));n.agreedP=S.time;}return;}
  if(r<0.65){const mine=S.market.filter(L=>L.seller==='P');if(mine.length){const L=U.pick(mine);const b=U.pick(onlineNpcs(n=>n.gold>L.price*0.6));if(b)pm(b,`would you take ${U.fmt(Math.round(L.price*U.rf(0.7,0.9)))}g for your ${itemName(L.item)}?`,3000);}return;}
  if(r<0.8){const rv=S.npcs.find(n=>n.rivals.includes('P')&&online(n));if(rv){pm(rv,U.pick([`${P.user}. Arena. Now. I want my rematch.`,'I haven\'t forgotten that duel.','You got lucky last time.']),3000);return;}}
  const f=P.friends.map(npc).filter(x=>x&&online(x));if(f.length){const n=U.pick(f);pm(n,U.pick([`what are you up to?`,`I'm in ${LOCS[n.loc].n} if you want to hang`,'just found a great grinding spot','how\'s the leveling going?']),3000);}
}

/* ---- player message handling ---- */
function playerChat(ch,text,withId){
  const P=S.P;text=text.trim().slice(0,220);if(!text)return;
  if(text.startsWith('/'))return slashCmd(text);
  const extra=ch==='pm'?{with:withId}:{};chatPush(ch,'P',text,extra);
  if(ch==='guild'&&!P.guild){chatPush('system','SYS','You are not in a guild.');return;}
  if(ch==='party'&&!P.party.length){chatPush('system','SYS','You are not in a party.');return;}
  const mentions=[...text.matchAll(/@([\w\-]+)/g)].map(m=>S.npcs.find(n=>n.user.toLowerCase()===m[1].toLowerCase())).filter(Boolean);
  let targets=mentions;if(ch==='pm'){const n=npc(withId);if(n)targets=[n];}
  if(ch==='party')targets=partyMembers().filter(()=>U.chance(0.7)).slice(0,2);
  if(ch==='guild')targets=[];
  const intent=parseIntent(text);
  // pending conversation answers (e.g. "what level are you?")
  for(const n of S.npcs){if(n.convo&&S.time-n.convo.t<120&&online(n)&&(targets.length===0||targets.includes(n))&&(ch===n.convo.ch||ch==='pm')){if(continueConvo(n,text,intent,ch))return;}}
  // keep talking with whoever just talked to you
  if(!targets.length&&S.engaged&&Date.now()-S.engaged.t<150000&&['chat','question','laugh','thanks','greet','asklevel','where','bye','insult','congrats','friend','price','boss'].includes(intent)&&(S.engaged.ch===ch||(S.engaged.ch!=='pm'&&ch==='global'))){const n=npc(S.engaged.id);if(n&&online(n)&&U.chance(0.85))targets=[n];}
  if(ch==='guild'&&!targets.length){const g=guild(P.guild);const on=g?g.members.map(npc).filter(x=>x&&online(x)):[];if(on.length)targets=U.shuffle(on).slice(0,U.ri(1,Math.min(3,on.length)));}
  if(targets.length){for(const n of targets)respondDirect(n,text,intent,ch);return;}
  if(ch==='global'||ch==='local'||ch==='recruit'||ch==='trade')respondPublic(text,intent,ch);
}
function parseIntent(t){const s=t.toLowerCase();
  if(/^(hi|hello|hey|yo|sup|greetings|hiya|howdy|o\/)\b/.test(s))return 'greet';
  if(/(lfg|lfm|lf\d|looking for (a )?(group|party)|anyone.*(help|join|party|group|clear|run|kill|come)|need (help|a party|a group|someone)|want to (help|join|group|party)|wanna (help|join|group)|carry me)/.test(s))return 'lfg';
  if(/\b(level|lvl)\s*\??\s*$|what('?s| is) your (level|lvl)|what (level|lvl) are/.test(s))return 'asklevel';
  if(/(where|how).*(find|get|farm|buy|go|reach|is)|where('?s| is| are)/.test(s))return 'where';
  if(/\b(wts|selling|sell)\b/.test(s))return 'wts';if(/\b(wtb|buying|anyone sell)/.test(s))return 'wtb';
  if(/(duel|fight me|1v1|pvp|spar)/.test(s))return 'duel';
  if(/(guild|recruit)/.test(s))return 'guild';
  if(/\b(thanks|thx|ty|thank you|tysm)\b/.test(s))return 'thanks';
  if(/\b(gz|grats|congrats|congratulations)\b/.test(s))return 'congrats';
  if(/\b(noob|trash|idiot|stupid|loser|suck|garbage|bad player)\b/.test(s))return 'insult';
  if(/(raid|world boss|dragon|hydra|wyrm|lich|grubnak)/.test(s))return 'boss';
  if(/(price|worth|how much)/.test(s))return 'price';
  if(/(strongest|best player|top player|rank #?1|number one)/.test(s))return 'top';
  if(/(new here|newbie|tips|advice|how do i|beginner|just started)/.test(s))return 'help';
  if(/\b(friend|add me)\b/.test(s))return 'friend';
  if(/\b(bye|gn|good night|cya|logging)\b/.test(s))return 'bye';
  if(/\b(lol|lmao|haha|😂)\b/.test(s))return 'laugh';
  if(/\?\s*$/.test(s))return 'question';
  return 'chat';}
function delayFor(n){return U.ri(1800,5000)+(n.busy>S.time?U.ri(2000,8000):0)+(styleOf(n)==='shy'?3000:0);}
function respondPublic(text,intent,ch){
  const P=S.P;const pool=ch==='local'?(S.byLoc[P.loc]||[]).filter(n=>online(n)&&!n.inParty):onlineNpcs();
  let cands=[],max=2;
  if(intent==='lfg'){const loc=findLocByText(text);const lv=loc?LOCS[loc].lv:[P.level-3,P.level+3];
    cands=pool.filter(n=>!n.inParty&&n.level>=Math.max(1,P.level-6)&&n.level<=P.level+12&&(!loc||n.knows.includes(loc))&&(n.tr.social>0.4||n.tr.kind>0.6)&&n.busy<=S.time+60);
    cands=U.shuffle(cands).sort((a,b)=>(path(b.loc,P.loc,true)||{hours:99}).hours<(path(a.loc,P.loc,true)||{hours:99}).hours?1:-1).slice(0,6);max=U.ri(0,2)+(cands.length>3?1:0);
    cands.slice(0,max).forEach((n,i)=>{const d=delayFor(n)+i*2500;const asks=U.chance(0.55)&&!P.friends.includes(n.id);
      if(asks){say(n,ch,U.pick(['What level are you?','lvl?','what lvl r u?','what\'s your level?']),d);n.convo={type:'askLevel',loc,t:S.time,ch};}
      else{say(n,ch,U.pick([`sure, I'm lvl ${n.level}. inv me`,`I can help, ${n.level} ${CLASSES[n.cls].name}`,'I\'m down, send invite',`omw. lvl ${n.level} ${CLASSES[n.cls].role}`]),d);n.agreedP=S.time;}});
    if(!max&&U.chance(0.4)){const k=talker();if(k)say(k,ch,U.pick(['everyone\'s busy rn, try later','try the recruit channel','most people are in the world boss raid']),4000);}return;}
  if(intent==='where'||intent==='question'){const kn=U.shuffle(pool.filter(n=>n.tr.kind>0.35||n.tr.talk>0.6)).slice(0,10);let answered=0;
    for(const n of kn){const a=answerWhere(n,text);if(a&&answered<2){say(n,ch,`@${P.user} ${a}`,delayFor(n)+answered*3000);answered++;}}
    if(!answered){if(AI.enabled&&kn[0])return aiReply(kn[0],text,ch);const k=U.pick(kn);if(k)say(k,ch,`@${P.user} ${smallTalk(k,text)}`,delayFor(k));}return;}
  if(intent==='greet'){U.shuffle(pool.filter(n=>n.tr.social>0.5)).slice(0,U.ri(0,2)).forEach((n,i)=>say(n,ch,U.pick(['hi!','hey o/','yo','hello!',`hey ${P.user}`,'welcome']),delayFor(n)+i*2000));return;}
  if(intent==='wts'){const it=P.inv.find(x=>isGear(x)&&text.toLowerCase().includes(ITEM_BASES[x.b].n.toLowerCase()));const buyers=pool.filter(n=>n.gold>200&&U.chance(0.15+n.tr.greed*0.2)).slice(0,2);
    buyers.forEach((n,i)=>pm(n,it?`how much for the ${itemName(it)}? open my profile → Trade`:'what are you selling exactly?',delayFor(n)+i*2000));return;}
  if(intent==='wtb'){const it=findItemByText(text);const sellers=pool.filter(n=>n.inv.some(x=>(it&&x.k===it)||isGear(x))).slice(0,2);sellers.forEach((n,i)=>pm(n,`I might have ${it?ITEMS[it].n:'something'}. check my profile → Trade`,delayFor(n)+i*2500));return;}
  if(intent==='duel'){const c=U.shuffle(pool.filter(n=>n.tr.compet>0.6&&Math.abs(n.level-P.level)<=10)).slice(0,1);c.forEach(n=>{say(n,ch,`@${P.user} I'll duel you. Meet me at an arena (or open my profile → Duel)`,delayFor(n));n.wantsDuel=S.time;});
    if(!c.length){const k=talker();if(k)say(k,ch,'nobody wants to fight you lol',5000);}return;}
  if(intent==='guild'){if(P.guild)return;const gs=S.guilds.filter(g=>!g.isPlayer&&g.req<=P.level);const g=U.pick(gs);if(g){const L=npc(g.leader);const off=g.officers.map(npc).find(o=>o&&online(o))||(online(L)?L:null);
    if(off)say(off,ch,`${g.name} [${g.tag}] takes lvl ${g.req}+. Open my profile and hit Apply.`,delayFor(off));}return;}
  if(intent==='boss'){const k=talker(n=>n.level>=30);if(k)say(k,ch,S.boss?`${MONSTERS[S.boss.id].n} is up in ${LOCS[S.boss.loc].n}, ${Math.round(S.boss.hp/S.boss.mhp*100)}% hp left. need lvl ${S.boss.lvl-20}+`:'no world boss up right now. usually every day or two',delayFor(k));return;}
  if(intent==='top'){const t=S.npcs.filter(n=>!n.retired).sort((a,b)=>b.level-a.level)[0];const k=talker();if(k)say(k,ch,`${t.user}, lvl ${t.level} ${t.adv?ADV_CLASSES[t.adv].name:CLASSES[t.cls].name}. Nobody comes close.`,delayFor(k));return;}
  if(intent==='help'){const k=U.pick(pool.filter(n=>n.tr.kind>0.6));if(k){say(k,ch,`@${P.user} welcome! ${U.pick(TOPICS.advice)}`,delayFor(k));if(U.chance(0.5))say(k,ch,`also do quests from the town board, best xp early`,delayFor(k)+4000);}return;}
  if(intent==='insult'){const k=talker();if(k)say(k,ch,U.pick(['chill','who hurt you','report + ignore','ok buddy']),delayFor(k));return;}
  if(intent==='laugh'||intent==='chat'){if(U.chance(0.6)){const k=U.pick(pool.filter(n=>n.tr.social>0.4||n.tr.talk>0.5));if(k){say(k,ch,`@${P.user} ${smallTalk(k,text)}`,delayFor(k));if(U.chance(0.3)){const k2=U.pick(pool.filter(x=>x!==k));if(k2)say(k2,ch,U.pick(['lol','true','fr','same','💯','based','this']),delayFor(k2)+3000);}}}return;}
  if(intent==='bye'){const k=U.pick(pool.filter(n=>P.friends.includes(n.id)))||talker();if(k&&U.chance(0.5))say(k,ch,'cya!',delayFor(k));return;}
}
function respondDirect(n,text,intent,ch){
  const P=S.P;const where=ch==='pm'?'pm':ch;const reply=(t,dl)=>where==='pm'?pm(n,t,dl||delayFor(n)):say(n,where,(where==='party'||where==='guild'?'':'@'+P.user+' ')+t,dl||delayFor(n));
  if(!online(n)){if(where==='pm')chatPush('system','SYS',`${n.user} is offline. They will see your message later.`);n.unreadFromP=(n.unreadFromP||0)+1;return;}
  const aff=affinity(n);
  if(n.busy>S.time&&['dungeon','raiding','dueling'].includes(n.act)&&U.chance(0.6)){if(U.chance(0.5))reply(U.pick(['busy rn, in a fight','sec, mid-dungeon','brb boss fight']),U.ri(6000,15000));return;}
  if(aff<-30&&U.chance(0.6)){if(U.chance(0.4))reply(U.pick(['...','not talking to you','ignored']));return;}
  if(styleOf(n)==='shy'&&U.chance(0.3)&&intent!=='lfg')return; // ignores
  remember(n,null,intent==='insult'?-8:intent==='thanks'||intent==='congrats'?3:0.5);
  switch(intent){
    case 'greet':reply(U.pick(['hey!','hi','yo what\'s up',`hey ${P.user}`,'hello there']));break;
    case 'asklevel':reply(`lvl ${n.level} ${n.adv?ADV_CLASSES[n.adv].name:CLASSES[n.cls].name}${n.guild?`, in ${guild(n.guild).tag}`:''}`);break;
    case 'lfg':{const r=considerInvite(n);if(r.ok||U.chance(0.4+n.tr.kind*0.3-Math.max(0,n.level-P.level-10)*0.05)){if(U.chance(0.5)&&!n.agreedP){reply('What level are you?');n.convo={type:'askLevel',loc:findLocByText(text),t:S.time,ch:where};}else{reply(`sure. I'm level ${n.level}. Send me an invite.`);n.agreedP=S.time;}}else reply(r.msg||'can\'t right now, sorry');break;}
    case 'where':case 'question':{const a=answerWhere(n,text);if(a)reply(a);else if(AI.enabled)aiReply(n,text,where);else reply(smallTalk(n,text));break;}
    case 'duel':{const r=considerDuel(n);if(r==='yes'){reply(U.pick(['you\'re on. open my profile and hit Duel','fine. don\'t cry after',`let's go`]));n.wantsDuel=S.time;}else reply(r==='busy'?'busy now':U.pick(['nah','not in the mood','maybe later']));break;}
    case 'guild':{const g=guild(n.guild);reply(g?`I'm in ${g.name} [${g.tag}]. ${g.leader===n.id?'I lead it. ':''}we take lvl ${g.req}+${g.leader===n.id||g.officers.includes(n.id)?'. hit Apply on my profile':''}`:'no guild, I play solo');break;}
    case 'thanks':reply(U.pick(['np!','anytime','no problem','👍']));break;
    case 'congrats':reply(U.pick(['ty!!','thanks!','❤️','appreciate it']));break;
    case 'insult':{if(n.tr.arrog>0.5||n.tr.compet>0.6){reply(U.pick(['say that in the arena','lmao ok','you\'re lvl '+P.level+' and talking?']));if(!n.rivals.includes('P'))n.rivals.push('P');}else reply(U.pick(['wow ok','rude','why tho']));break;}
    case 'friend':friendRequest(n)?reply('added you!'):reply('eh, I barely know you');break;
    case 'price':{const it=P.inv.find(x=>text.toLowerCase().includes(itemName(x).toLowerCase().split(' ').slice(-1)[0].toLowerCase()));reply(it?`I'd say around ${U.fmt(itemValue(it))}g for ${itemName(it)}`:'depends what it is');break;}
    case 'boss':reply(S.boss?`${MONSTERS[S.boss.id].n} in ${LOCS[S.boss.loc].n}. ${n.level>=S.boss.lvl-22?'I\'m going, join us':'too strong for me'}`:'no boss up right now');break;
    case 'bye':reply(U.pick(['cya!','bye','take care','o/']));break;
    default:{if(AI.enabled)return aiReply(n,text,where);const mem=(n.mem.P||{}).notes||[];
      reply(mem.length&&U.chance(0.25)?`remember when we ${mem[0][1].toLowerCase()}? good times`:smallTalk(n,text));}
  }
}
function continueConvo(n,text,intent,ch){const c=n.convo;const P=S.P;const where=ch;
  if(c.type==='askLevel'){const m=text.match(/(\d{1,3})/);if(!m)return false;n.convo=null;const lv=parseInt(m[1]);
    if(lv!==P.level&&U.chance(0.7)){const lie=Math.abs(lv-P.level)>3;if(lie){say(n,where,where==='pm'?`your profile says ${P.level}, not ${lv}...`:`@${P.user} your profile says ${P.level} lol`,delayFor(n));remember(n,'Lied to me about their level',-6);return true;}}
    const diff=n.level-P.level;if(diff>12&&n.tr.kind<0.6){say(n,where,`${where==='pm'?'':'@'+P.user+' '}bit low for me sorry`,delayFor(n));return true;}
    const loc=c.loc?LOCS[c.loc]:null;if(loc&&P.level<loc.lv[0]-4&&n.tr.caution>0.5){say(n,where,`${where==='pm'?'':'@'+P.user+' '}${loc.n} might be too hard at ${P.level} tbh`,delayFor(n));return true;}
    say(n,where,`${where==='pm'?'':'@'+P.user+' '}Sure. I'm level ${n.level}. Send me an invite.`,delayFor(n));n.agreedP=S.time;remember(n,'Agreed to group up',2);return true;}
  return false;}
function slashCmd(t){const [cmd,...rest]=t.slice(1).split(' ');const arg=rest.join(' ');const P=S.P;
  if(cmd==='w'||cmd==='whisper'||cmd==='pm'){const [name,...msg]=rest;const n=S.npcs.find(x=>x.user.toLowerCase()===String(name||'').toLowerCase());if(!n){chatPush('system','SYS',`No adventurer named ${name}.`);return;}playerChat('pm',msg.join(' '),n.id);if(typeof UI!=='undefined')UI.openPM(n.id);return;}
  if(cmd==='invite'||cmd==='inv'){const n=S.npcs.find(x=>x.user.toLowerCase()===arg.toLowerCase());if(n)invite(n);else chatPush('system','SYS',`No adventurer named ${arg}.`);return;}
  if(cmd==='who'){const n=S.npcs.find(x=>x.user.toLowerCase()===arg.toLowerCase());if(n&&typeof UI!=='undefined')UI.profile(n.id);return;}
  if(cmd==='roll'){chatPush('local','P',`rolls ${U.ri(1,100)} (1-100)`);return;}
  if(cmd==='online'){chatPush('system','SYS',`${onlineNpcs().length} simulated adventurers online${typeof NET!=='undefined'&&NET.peers?`, ${NET.peers} real players here`:''}.`);return;}
  if(cmd==='help'){chatPush('system','SYS','Commands: /w <name> <msg>, /invite <name>, /who <name>, /roll, /online. Use @name to mention someone.');return;}
  chatPush('system','SYS','Unknown command. Try /help.');}

/* ---- optional Claude-powered replies (selective, rate-limited) ---- */
async function aiReply(n,text,where){
  if(!AI.fn||AI.busy||Date.now()-AI.last<4000){const a=answerWhere(n,text);(where==='pm'?pm:(x,t)=>say(n,where,'@'+S.P.user+' '+t,delayFor(n)))(n,a||U.pick(['hmm','not sure','idk']));return;}
  AI.busy=true;AI.last=Date.now();const P=S.P;
  const known=n.knows.slice(0,25).map(l=>`${LOCS[l].n} (lvl ${LOCS[l].lv[0]}-${LOCS[l].lv[1]}${LOCS[l].res.length?', has '+LOCS[l].res.map(r=>ITEMS[r[0]].n).join('/'):''})`).join('; ');
  const mem=((n.mem.P||{}).notes||[]).slice(0,4).map(x=>x[1]).join('; ')||'none';
  const prompt=`You write ONE short MMORPG chat reply (max 25 words, casual gamer chat style, no quotes, no emojis unless funny) as a simulated adventurer in the fantasy game Eternal Realms.
Character: ${n.user}, level ${n.level} ${RACES[n.race].name} ${n.adv?ADV_CLASSES[n.adv].name:CLASSES[n.cls].name}. Personality: ${traitsLabel(n).join(', ')}. Currently ${n.act} in ${LOCS[n.loc].n}. Guild: ${n.guild?guild(n.guild).name:'none'}. Goal: ${goalText(n.goal||{type:'level'})}.
Places this character knows: ${known}. Only mention places from this list. Never invent items, rewards or promises.
Memories of the player ${P.user} (level ${P.level} ${CLASSES[P.cls].name}): ${mem}. Affinity: ${affinity(n)}.
World: ${S.boss?`world boss ${MONSTERS[S.boss.id].n} active in ${LOCS[S.boss.loc].n}`:'no world boss'}; ${S.wars.map(w=>FACTIONS[w.a].n+' at war with '+FACTIONS[w.b].n).join('; ')||'peace'}.
The player wrote${where==='pm'?' to you privately':' in chat'}: "${text.replace(/"/g,"'")}"
Reply only with the chat message text.`;
  try{const r=await AI.fn(prompt);let t=String(r||'').trim().split('\n')[0].replace(/^["']|["']$/g,'').slice(0,200);if(!t)t='hmm';
    if(where==='pm')pm(n,t,800);else say(n,where,'@'+P.user+' '+t,800);}
  catch(e){const a=answerWhere(n,text);if(where==='pm')pm(n,a||'sorry, brain lag');else say(n,where,'@'+P.user+' '+(a||'lag, what?'),1000);}
  finally{AI.busy=false;}}
async function aiNarrate(action,outcome){
  if(!AI.fn||!AI.enabled||AI.busy)return null;AI.busy=true;const P=S.P,L=LOCS[P.loc];
  try{const t=await AI.fn(`Narrate in 2 vivid sentences (second person, present tense, medieval fantasy, no game mechanics or numbers) what happens when a ${RACES[P.race].name} ${CLASSES[P.cls].name} named ${P.name} tries to: "${action.replace(/"/g,"'")}" at ${L.n} (${L.d}) during the ${T.part(S.time)}. The game has already decided the outcome: ${outcome}. Stay consistent with that outcome and do not add rewards.`);return String(t||'').trim();}
  catch(e){return null;}finally{AI.busy=false;}}
