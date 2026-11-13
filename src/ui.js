/* ETERNAL REALMS — UI core, world view, map */
'use strict';
const $=s=>document.querySelector(s);
const E=U.esc;
const UI={tab:'world',sub:null,chatCh:'all',pmWith:null,dirty:false,started:false,modalStack:[],logBuf:[],
  inCombat(){return !!(C&&!C.closed);},
  // at most 3 messages on screen; repeats merge into one ("x3"), consecutive level-ups collapse, oldest drop off first
  toast(t,cls=''){const box=$('#toasts');if(!box)return;const live=[...box.children].filter(x=>!x.classList.contains('out'));
    const lvl=/^Level \d+!$/.test(t);let el=live.find(x=>x.dataset.t===t||(lvl&&/^Level \d+!$/.test(x.dataset.t)));
    if(el){const n=lvl?1:(+el.dataset.n||1)+1;el.dataset.n=n;el.dataset.t=t;el.textContent=n>1?`${t} ×${n}`:t;clearTimeout(el._t1);clearTimeout(el._t2);box.appendChild(el);}
    else{el=document.createElement('div');el.className='toast '+cls;el.dataset.t=t;el.textContent=t;box.appendChild(el);}
    el._t1=setTimeout(()=>el.classList.add('out'),3200);el._t2=setTimeout(()=>el.remove(),3800);
    const now=[...box.children].filter(x=>!x.classList.contains('out'));while(now.length>3){const o=now.shift();o.classList.add('out');setTimeout(()=>o.remove(),500);}},
  onLog(t,cls){UI.dirty=true;},
  refresh(){UI.dirty=true;},
  onChat(m){UI.chatDirty=true;if(m.from!=='P'&&m.ch!=='system'&&m.text&&S&&S.P&&m.text.toLowerCase().includes('@'+S.P.user.toLowerCase())){S.P.mentions++;}},
};
function bar(cur,max,cls,label){const p=max>0?U.clamp(cur/max*100,0,100):0;return `<div class="bar ${cls}" role="meter" aria-valuenow="${Math.round(cur)}" aria-valuemax="${Math.round(max)}" aria-label="${label}"><i style="width:${p}%"></i><span>${label} ${U.fmt(cur)}/${U.fmt(max)}</span></div>`;}
function btn(label,act,v='',cls='',extra=''){return `<button class="b ${cls}" data-a="${act}" data-v="${E(v)}" ${extra}>${label}</button>`;}
function rarityName(it){return isGear(it)?`<span class="${RARITY[it.r].c}">${E(itemName(it))}</span>`:E(itemName(it));}
function userLink(id){if(id==='P')return `<b class="me">${E(S.P.user)}</b>`;if(String(id).startsWith('R:')){const p=NET.players[id.slice(2)];return `<a class="ulink real" data-a="rprofile" data-v="${E(id.slice(2))}" title="Real player">${E(p?p.user:'Player')}<sup>●</sup></a>`;}
  const n=npc(id);return n?`<a class="ulink" data-a="profile" data-v="${n.id}">${E(n.user)}</a>`:'?';}
const CLS_HUE={bard:'#e07ab0',shaman:'#4ab0d8',warlock:'#7a4ab8',artificer:'#c09a5a',ranger:'#5a9a4a',warrior:'#d0704a',knight:'#9aa6b8',swordsman:'#c9b07a',archer:'#7fb35a',rogue:'#8a7ac0',mage:'#5b8be0',cleric:'#e6d08a',summoner:'#5cc0b0',paladin:'#e8b84a',berserker:'#d8463a',monk:'#e09a4a',necromancer:'#8f6bd0',druid:'#6bb06a',spearman:'#b88a5a',merchant:'#d8ad55'};
const CLS_ICON={bard:'lute',shaman:'quick',warlock:'flame',artificer:'gear',ranger:'hunt',warrior:'attack',knight:'defend',swordsman:'parry',archer:'hunt',rogue:'quick',mage:'magic',cleric:'heart',summoner:'summon',paladin:'temple',berserker:'heavy',monk:'trainer',necromancer:'skull',druid:'gather',spearman:'travel',merchant:'coin'};
function avatar(name,cls,real){const c=CLS_HUE[cls]||'#888';return `<span class="av ${real?'real':''}" style="--ac:${c}" aria-hidden="true">${E(String(name||'?').replace(/^[^A-Za-z0-9]*/,'').slice(0,1).toUpperCase()||'?')}</span>`;}
function className(a){return a.adv?ADV_CLASSES[a.adv].name:tierName(a);}
function lvlColor(l){const d=l-S.P.level;return d>=6?'lv-red':d>=3?'lv-orange':d>=-3?'lv-yellow':d>=-8?'lv-green':'lv-grey';}

/* ---------------- header ---------------- */
// Only touch the page when the new HTML differs: rebuilding identical parts forced the phone to lay out the whole page on every tap.
function setHTML(el,html){if(!el)return false;if(el.__h===html)return false;el.innerHTML=html;el.__h=html;return true;}
function renderHeader(){const P=S.P,st=stats(P);
  const xpN=xpNext(P.level);
  const __hdr=`<div class="hname"><button class="portrait" data-a="tab" data-v="char" aria-label="Your hero" style="--ac:${CLS_HUE[P.cls]}">${icon(CLS_ICON[P.cls])}<b>${P.level}</b></button><div><button class="pname" data-a="tab" data-v="char">${E(P.name)}</button><small>${E(P.user)} · ${E(className(P))}</small></div></div>
  <div class="hbars">${abar(P.hp,st.mhp,'hp','HP','hdr')}${abar(P.mp,st.mmp,'mp','MP','hdr')}${abar(P.sp,st.msp,'sp','SP','hdr')}${abar(P.xp,xpN,'xp','XP','hdr')}</div>
  <div class="hmeta"><button class="snd ${AUD.on?'on':''}" data-a="sound" aria-label="${AUD.on?'Mute music':'Play music'}" title="Music & sound">${AUD.on?'♪':'♪̸'}</button><span class="gold">${icon('coin')}${U.fmt(P.gold)}</span><span class="clock">${icon('clock')}${T.str(S.time).replace('Day ','D')}</span><span class="loc">${icon('pin')}${E(LOCS[P.loc].n)}</span>
  <button class="net ${NET.mode}" data-a="tab" data-v="social" title="${E(NET.status)}">${icon('online')}${NET.mode==='online'?`${NET.peers} online`:'solo'}</button>
  ${P.pts>0?`<button class="b tiny gilt" data-a="tab" data-v="char">+${P.pts} pts</button>`:''}</div>`;
  if(setHTML($('#hdr'),__hdr))requestAnimationFrame(()=>document.documentElement.style.setProperty('--hdr-h',$('#hdr').offsetHeight+'px'));animBars($('#hdr'));
  if(UI.prevGold!=null&&P.gold>UI.prevGold&&!S.catchup){sfx('coin');const gEl=$('#hdr .gold');if(gEl){gEl.classList.add('bump');goldBurst(gEl);}}
  if(UI.prevHp!=null&&P.hp<UI.prevHp-1&&!UI.inCombat()){const h=$('#hdr .bar.hp');if(h)h.classList.add('dmg');}UI.prevGold=P.gold;UI.prevHp=P.hp;}
UI.refreshHeader=()=>{if(S&&S.P)renderHeader();};

/* ---------------- nav ---------------- */
const TABS=[['world','World','world'],['map','Map','map'],['char','Hero','hero'],['bag','Bag','bag'],['quests','Quests','quests'],['chat','Chat','chat'],['social','Party & Guild','social'],['ranks','Ranks','ranks'],['market','Market','market'],['codex','Codex','codex'],['menu','Menu','menu']];
const BOTTOM=['world','map','char','bag','quests','chat'];
function badge(k){const unread=Object.values(S.pmUnread||{}).reduce((a,b)=>a+b,0);if(k==='chat'&&(unread||S.P.mentions))return `<em>${unread+S.P.mentions}</em>`;if(k==='quests'&&S.P.quests.some(q=>q.done))return '<em>!</em>';if(k==='char'&&S.P.pts>0)return '<em>+</em>';return '';}
function renderNav(){
  setHTML($('#nav'),TABS.map(([k,n,ic])=>`<button class="tab ${UI.tab===k?'on':''}" data-a="tab" data-v="${k}">${icon(ic)}<span>${n}</span>${badge(k)}</button>`).join(''));
  const moreOn=!BOTTOM.includes(UI.tab);const moreBadge=TABS.filter(t=>!BOTTOM.includes(t[0])).map(t=>badge(t[0])).join('')?'<em>!</em>':'';
  setHTML($('#bnav'),TABS.filter(t=>BOTTOM.includes(t[0])).map(([k,n,ic])=>`<button class="bt ${UI.tab===k?'on':''}" data-a="tab" data-v="${k}">${icon(ic)}<span>${n}</span>${badge(k)}</button>`).join('')+(()=>{const cur=moreOn&&TABS.find(t=>t[0]===UI.tab);return `<button class="bt ${moreOn?'on':''}" data-a="more">${icon(cur?cur[2]:'more')}<span>${cur?E(cur[1].split(' ')[0]):'More'}</span>${moreBadge}</button>`;})());
  const last=chatMessages().filter(m=>m.ch!=='system').slice(-1)[0];
  setHTML($('#ticker'),last&&UI.tab!=='chat'?`<button data-a="tab" data-v="chat">${avatar(m_name(last),m_cls(last),last.real)}<span><b>${E(m_name(last))}</b> ${E(last.text)}</span></button>`:'');$('#ticker').hidden=!last||UI.tab==='chat';}
function m_name(m){return m.from==='P'?S.P.user:m.real?m.name:m.from==='SYS'?'System':(npc(m.from)||{}).user||'?';}
function m_cls(m){return m.from==='P'?S.P.cls:m.real?(m.cls||'warrior'):(npc(m.from)||{}).cls;}

/* ---------------- world view ---------------- */
function abtn(ic,label,sub,act,v='',cls=''){return `<button class="ab ${cls}" data-a="${act}" data-v="${E(v)}">${icon(ic)}<span><b>${label}</b>${sub?`<small>${sub}</small>`:''}</span></button>`;}
const SVC_SUB={special:'Rare & unique wares',inn:'Rest · rumors · cook',shop:'Potions & supplies',smith:'Arms & armor',market:'Buy & sell',guild:'Found or join',temple:'Healing & blessing',library:'Lore & tomes',arena:'Duels & tournament',trainer:'Masters & training',board:'Quests',forge:'Smithing',alchemy:'Potions & enchanting',stable:'Fast travel',port:'Ships'};
function weatherLine(loc){const L=LOCS[loc];const n=T.isNight(S.time);const b=BIOME[loc];const seed=(T.day(S.time)*7+[...loc].length)%5;
  const W={snow:['Snow drifts across the trail.','The wind bites through your cloak.','Clear and freezing.','Ice crystals glitter in the air.','A blizzard gathers on the peaks.'],desert:['Heat shimmers over the sand.','A dry wind hisses.','Dust devils spin in the distance.','The sun is merciless.','Cool stillness.'],
    swamp:['Mist clings to the water.','Insects drone endlessly.','Something splashes nearby.','Warm rain patters on the leaves.','The air smells of rot.'],lava:['Ash falls like grey snow.','The ground is warm under your boots.','Embers drift past.','A distant rumble shakes the rocks.','Smoke stings your eyes.']}[b]||
    ['A light breeze stirs.','Soft rain falls.','The air is crisp and clear.','Clouds roll overhead.','Birdsong drifts on the wind.'];
  return (n?'Night. ':'')+W[seed];}
const SVC_NAMES={special:'Specialty Shop',inn:'Inn',shop:'General Store',smith:'Blacksmith',market:'Auction House',guild:'Guild Hall',temple:'Temple',library:'Library',arena:'Arena',trainer:'Trainers',board:'Quest Board',forge:'Forge',alchemy:'Alchemy Lab',stable:'Stables',port:'Harbor'};
function renderWorld(){
  const P=S.P,L=LOCS[P.loc];const f=S.control[P.loc];const war=S.wars.find(w=>w.front===P.loc);
  const here=(S.byLoc[P.loc]||[]).filter(n=>online(n)&&!n.inParty);const realHere=Object.values(NET.peerMap).filter(p=>p.loc===P.loc).map(p=>[p.key,{user:p.user,level:p.lvl,cls:p.cls}]);
  let h=`<section class="locard"><div class="vista" style="background-image:url(${drawVista(P.loc,S.time)})"></div><div class="lochead"><h2>${E(L.n)}</h2><div class="chips"><span class="chip">${U.cap(L.ty)}</span>${L.lv&&!isTown(P.loc)?`<span class="chip ${lvlColor(L.lv[0])}">Lv ${L.lv[0]}–${L.lv[1]}</span>`:''}
    ${f?`<span class="chip">${E(FACTIONS[f].n)}</span>`:''}${L.pvp?'<span class="chip danger">PvP zone</span>':''}${war?'<span class="chip danger">War front</span>':''}<span class="chip">${T.part(S.time)}</span></div></div>
    <p class="desc">${E(L.d)}</p>${S.P.dungeon?'':`<p class="weather">${E(weatherLine(P.loc))}</p>`}</section>`;
  if(P.dungeon){const D=P.dungeon;h+=`<section class="panel dungeon"><h3>Inside ${E(LOCS[D.loc].n)}</h3><p>Floor ${Math.min(D.floor,D.floors)}/${D.floors}${D.floor>D.floors?' — the boss chamber lies ahead.':''}</p>
    <div class="row">${btn(D.floor>D.floors?`Face ${E(MONSTERS[L.boss].n)}`:`Explore floor ${D.floor}`,'dfloor','','gilt')}${btn('Leave dungeon','dleave')}</div></section>`;}
  if(S.boss&&S.boss.loc===P.loc){const B=S.boss;h+=`<section class="panel boss"><h3>⚠ World Boss: ${E(MONSTERS[B.id].n)} (Lv.${B.lvl})</h3>${bar(B.hp,B.mhp,'hp','HP')}<p>${Object.keys(B.contrib).length} raiders have fought it. ${B.deaths} have fallen.</p>${btn('Join the raid','wboss','','danger')}</section>`;}
  else if(S.boss){h+=`<p class="notice">World Boss ${E(MONSTERS[S.boss.id].n)} is active in <a data-a="mapfocus" data-v="${S.boss.loc}">${E(LOCS[S.boss.loc].n)}</a>.</p>`;}
  if(S.tourney.pending&&P.loc==='valeria')h+=`<section class="panel boss"><h3>Grand Tournament — Round ${S.tourney.pending.round}</h3><p>Your opponent ${userLink(S.tourney.pending.opp)} is waiting in the arena.</p>${btn('Enter the arena','tfight','','danger')}</section>`;
  // what just happened (results of your last action, right where you're looking)
  if(UI.lastResult&&Date.now()-UI.lastResult.t<90000)h+=`<section class="panel result"><div class="log">${UI.lastResult.lines.map(([t,x,c])=>`<p class="${c}">${E(x)}</p>`).join('')}</div>${btn('Dismiss','dismissres','','ghost tiny')}</section>`;
  // first steps for new adventurers
  if(P.level<6&&!P.flags.hideTips){const done={quest:P.quests.length>0||(P.stats.quests||0)>0,fight:P.stats.kills>0,chat:(S.chat.global||[]).some(m=>m.from==='P'),pts:P.pts===0,lvl:P.level>=3};
    h+=`<section class="panel tips"><h3>${icon('trainer')} First steps <small>${Object.values(done).filter(Boolean).length}/5</small></h3><ul class="steps">
      <li class="${done.quest?'ok':''}">Take a contract from the <a data-a="svc" data-v="board">Quest Board</a>${isTown(P.loc)&&hasSvc(P.loc,'board')?'':' (in town)'}</li>
      <li class="${done.fight?'ok':''}">Win a fight: <b>Hunt monsters</b> in ${E(LOCS[neighbors(P.loc).find(l=>!isTown(l)&&LOCS[l].mon.length&&LOCS[l].lv[0]<=3)||'greenmarch'].n)}</li>
      <li class="${done.pts?'ok':''}">Spend your attribute points on the <a data-a="tab" data-v="char">Hero</a> tab</li>
      <li class="${done.chat?'ok':''}">Say hello in <a data-a="tab" data-v="chat">Chat</a>, or ask “anyone want to help me?”</li>
      <li class="${done.lvl?'ok':''}">Reach level 3. Rest at the Inn when you're hurt.</li></ul>${btn('Hide tips','hidetips','','ghost tiny')}</section>`;}
  // realm events
  const evs=evActive();if(evs.length){h+=`<section class="panel events"><h3>${icon('event')} Realm events</h3><div class="list">${evs.map(ev=>{const ET=EVENT_TYPES[ev.kind];const left=Math.max(0,Math.round((ev.end-S.time)/60));
    return `<div class="li ev ev-${ev.kind}"><span><b>${ET.n}</b>${ev.loc?` · <a data-a="mapfocus" data-v="${ev.loc}">${E(LOCS[ev.loc].n)}</a>`:''} <small>${E(ev.kind==='invasion'?`The ${ev.horde} attacks ${LOCS[ev.loc].n}. Horde strength ${Math.round(ev.str)}%.`:ET.d)} · ${left}h left</small></span></div>`;}).join('')}</div></section>`;}
  const inv=evs.find(e=>e.kind==='invasion'&&e.loc===P.loc);
  if(inv&&!P.dungeon){const w=(inv.waves.P||0);h+=`<section class="panel boss"><h3>${icon('castle')} ${E(LOCS[P.loc].n)} is under attack!</h3><p>The ${E(inv.horde)} (Lv ~${inv.lvl}) is at the gates. Horde strength ${Math.round(inv.str)}%. ${(S.byLoc[P.loc]||[]).filter(n=>n.act==='defending').length} adventurers are defending.</p>${bar(inv.str,100,'hp','Horde')}
    <p class="hint">Fight three waves; the third brings their warlord. Win and the town rewards every defender with a Defender's Badge.</p>${w>=3?'<p class="good">You broke the horde. Rewards come when the fighting ends.</p>':btn(`Defend the walls (wave ${w+1}/3)`,'defend','','danger')}</section>`;}
  const tr=evs.find(e=>e.kind==='treasure'&&e.loc===P.loc);if(tr)h+=`<p class="notice">${icon('pin')} The pirate map's X is somewhere here. Use “Search for treasure”.</p>`;
  // actions
  const acts=[];
  if(!P.dungeon){
    acts.push(abtn('explore','Explore','1 hour','explore'));
    if(L.mon.length)acts.push(abtn('hunt','Hunt monsters',`Lv ${L.lv[0]}–${L.lv[1]}`,'hunt','','danger'));
    if(!isTown(P.loc))acts.push(abtn('search','Search for treasure','1.5h · luck','search'));
    for(const [k,m] of L.res||[])acts.push(abtn({mining:'mine',fishing:'fish'}[m]||'gather',`Gather ${E(ITEMS[k].n)}`,`${MASTERY[mKey(m)]?MASTERY[mKey(m)].n:''} ${mLv(P,m)}`,'gather',`${k}|${m}`));
    if(L.boss)acts.push(abtn('dungeon',`Enter ${L.ty==='dungeon'?'the dungeon':'the depths'}`,`${L.floors||3} floors + boss`,'dungeon','','gilt'));
    if(!isTown(P.loc))acts.push(abtn('camp','Make camp','6h · risky','camp'));
  }
  h+=`<section class="panel"><h3>Actions</h3><div class="grid-act">${acts.join('')}</div>
    <form class="freeform" data-form="freeform"><label for="ff">What do you do?</label><div class="row"><input id="ff" name="ff" maxlength="140" placeholder="e.g. climb the old tower, pray at the shrine, sing to the crowd" autocomplete="off"><button class="b">Act</button></div></form></section>`;
  if((L.sv||[]).length&&!P.dungeon)h+=`<section class="panel"><h3>Places in town</h3><div class="grid-act svc">${L.sv.map(s=>abtn(s,SVC_NAMES[s],SVC_SUB[s]||'','svc',s)).join('')}</div></section>`;
  const tf=TOWNSFOLK[P.loc]||[];if(tf.length)h+=`<section class="panel"><h3>Locals</h3><div class="people">${tf.map(([n,r])=>`<button class="person" data-a="talk" data-v="${E(n)}|${r}">${avatar(n,{innkeeper:'merchant',librarian:'mage',guard:'knight',merchant:'merchant',priest:'cleric',arena:'berserker',smith:'warrior',mentor:'swordsman',barkeep:'rogue',courier:'archer',smuggler:'rogue',elder:'druid',farmer:'druid',mystic:'summoner'}[r])}<span><b>${E(n)}</b><small>${U.cap(r)}</small></span></button>`).join('')}</div></section>`;
  if((L.feat||[]).length)h+=`<section class="panel"><h3>Points of interest</h3><div class="grid-btn">${L.feat.map((f,i)=>btn(`Examine: ${E(f)}${P.examined[P.loc+':'+i]?' ✓':''}`,'examine',i,'ghost')).join('')}</div></section>`;
  if(!P.dungeon){const nb=neighbors(P.loc).filter(l=>!LOCS[l].hid||P.explored.includes(l)||P.flags['found_'+l]);
    h+=`<section class="panel"><h3>Travel</h3><div class="travel">${nb.map(l=>{const X=LOCS[l];return `<button class="tr" data-a="travel" data-v="${l}"><i class="compass d-${dirWord(P.loc,l).replace('-','')}">${icon('travel')}</i><b>${E(X.n)}</b><small>${GRAPH[P.loc][l]}h · ${dirWord(P.loc,l)} · ${isTown(l)?U.cap(X.ty):`<span class="${lvlColor(X.lv[0])}">Lv ${X.lv[0]}–${X.lv[1]}</span>`}${P.explored.includes(l)?'':' · unexplored'}${S.boss&&S.boss.loc===l?' · ⚠ boss':''}</small></button>`;}).join('')}</div>
    ${hasSvc(P.loc,'stable')?'<p class="hint">Stables here offer faster travel (half time) between cities. Open “Stables” above.</p>':''}</section>`;}
  h+=`<section class="panel"><h3>Adventurers here <small>${here.length} online${realHere.length?` · ${realHere.length} real`:''}</small></h3><div class="people">${realHere.map(([id,p])=>`<button class="person real" data-a="rprofile" data-v="${id}">${avatar(p.user,p.cls,1)}<span><b>${E(p.user)}<sup>●</sup></b><small>Lv.${p.level} ${E(CLASSES[p.cls]?CLASSES[p.cls].name:'')} · real player</small></span></button>`).join('')}
    ${here.slice(0,24).map(n=>`<button class="person" data-a="profile" data-v="${n.id}">${avatar(n.user,n.cls)}<span><b>${E(n.user)}</b><small><span class="${lvlColor(n.level)}">Lv.${n.level}</span> ${E(className(n))} · ${E(n.act)}</small></span></button>`).join('')||(realHere.length?'':'<p class="hint">Nobody else is here right now.</p>')}</div></section>`;
  h+=`<section class="panel"><h3>Journal</h3><div class="log">${P.log.slice(-40).reverse().map(([t,x,c])=>`<p class="${c}"><time>${T.str(t).replace('Day ','D')}</time> ${E(x)}</p>`).join('')}</div></section>`;
  return h;
}

/* ---------------- services ---------------- */
function svcPanel(s){const P=S.P,loc=P.loc;let h=`<h2>${SVC_NAMES[s]} — ${E(LOCS[loc].n)}</h2>`;
  const f=S.control[loc];if(f&&(P.rep[f]||0)<=-35&&s!=='inn')return h+`<p class="bad">The keeper refuses to serve someone ${repTitle(P.rep[f])} to ${E(FACTIONS[f].n)}.</p>`;
  switch(s){
  case 'special':h=specialView(loc);break;
  case 'inn':h+=`<p>A warm hearth, a noisy common room, and rooms upstairs.</p><div class="grid-btn">${btn(`Rent a room & rest (${10+P.level*2}g, 8h)`,'inn_rest')}${btn('Buy a round & hear rumors (5g)','rumors')}${btn('Use the kitchen','craftlist','cooking')}</div>`;break;
  case 'shop':h+=`<p class="hint">Prices change with local supply and demand${S.wars.some(w=>w.a===f||w.b===f)?' — and the war is driving them up':''}.</p><div class="list">${shopStock(loc).map(k=>{const it={k};const p=priceFor(it,loc);return `<div class="li"><span>${E(ITEMS[k].n)} <small>${itemDesc(it)}</small></span><span class="gold">${p}g</span>${btn('Buy','buy',k,'tiny')}</div>`;}).join('')}</div>${sellSection()}`;break;
  case 'smith':h+=`<p class="hint">Stock changes daily. Items up to 5 levels above you can be equipped.</p><div class="list">${smithStock(loc).map((it,i)=>{const p=priceFor(it,loc);return `<div class="li"><span>${rarityName(it)} <small>Lv.${it.l} · ${itemDesc(it)}</small></span><span class="gold">${U.fmt(p)}g</span>${btn('Buy','smithbuy',i,'tiny')}${btn('Inspect','iteminfo','s:'+i,'tiny ghost')}</div>`;}).join('')}</div>${sellSection()}${hasSvc(loc,'forge')||true?`<div class="row">${btn('Use the anvil (Smithing)','craftlist','smithing')}</div>`:''}`;break;
  case 'forge':h+=craftList('smithing');break;case 'alchemy':h+=craftList('alchemy')+craftList('enchanting');break;
  case 'market':return h+marketView(true);
  case 'guild':h+=guildHallView();break;
  case 'temple':{const cost=5+P.level*3;h+=`<p>Incense and quiet chanting.</p><div class="grid-btn">${btn(`Receive healing (${cost}g)`,'temple_heal')}${btn(`Blessing of the Light (${cost*3}g, +15% for 3h)`,'temple_bless')}${btn('Pray (free)','pray')}</div>`;break;}
  case 'library':{const books=LIBRARY_BOOKS[loc]||[];h+=`<p>Shelves of history and myth. Reading takes time and teaches you about the world.</p><div class="list">${books.map(b=>`<div class="li"><span>${E(LORE[b].t)} <small>${LORE[b].cat}${P.codex.includes(b)?' · read':''}</small></span>${btn('Read','read',b,'tiny')}</div>`).join('')||'<p class="hint">The archives are closed to visitors.</p>'}</div>
    <h3>Spell tomes</h3><p class="hint">A tome teaches the basics of a magic school, so any class can cast its spells. Mastery unlocks stronger ones.</p><div class="list">${Object.keys(ITEMS).filter(k=>ITEMS[k].t==='tome').map(k=>{const p=Math.round(priceFor({k},loc)*(P.race==='halfelf'?0.75:1)*(P.race==='beastkin'?1.2:1));return `<div class="li"><span>${E(ITEMS[k].n)} <small>${mLv(P,ITEMS[k].school)?'known':''}</small></span><span class="gold">${p}g</span>${btn('Buy','buytome',k,'tiny')}</div>`;}).join('')}</div>${btn('Enchanting desk','craftlist','enchanting')}`;
    if(loc==='valeria')storyCheck('visit');if(loc==='lothirien')storyCheck('visit');break;}
  case 'arena':h+=arenaView();break;
  case 'trainer':h+=trainerView();break;
  case 'board':h+=boardView();break;
  case 'stable':{const cities=Object.keys(LOCS).filter(l=>hasSvc(l,'stable')&&l!==loc);h+=`<p>Swift horses between the great cities.</p><div class="list">${cities.map(l=>{const p=path(loc,l);const cost=20+Math.round(p.hours*6);return `<div class="li"><span>${E(LOCS[l].n)} <small>${(p.hours*0.5).toFixed(1)}h ride</small></span><span class="gold">${cost}g</span>${btn('Ride','ride',l,'tiny')}</div>`;}).join('')}</div>`;break;}
  case 'port':{const dests=[['isles',60,4],['citadel',90,5],['cove',40,3],['pawhaven',50,4]].filter(([l])=>l!=='cove'||P.explored.includes('cove')||P.flags.found_cove||P.flags.rumor_cove);
    h+=`<p>Ships of the Silver Fleet and less reputable captains.</p><div class="list">${dests.map(([l,c,hh])=>`<div class="li"><span>${E(LOCS[l].n)} <small>${hh}h voyage</small></span><span class="gold">${c}g</span>${btn('Sail','sail',`${l}|${c}|${hh}`,'tiny')}</div>`).join('')}</div>`;break;}
  }
  return h;}
function sellSection(){const P=S.P;const items=P.inv.map((it,i)=>[it,i]).filter(([it])=>isGear(it)||ITEMS[it.k].t==='mat'||ITEMS[it.k].t==='food'||ITEMS[it.k].t==='con');
  return `<details class="sell"><summary>Sell items</summary><div class="list">${items.map(([it,i])=>`<div class="li"><span>${rarityName(it)}${it.q>1?' ×'+it.q:''}</span><span class="gold">${priceFor(isGear(it)?it:{k:it.k},P.loc,false)}g</span>${btn('Sell','sell',i,'tiny')}</div>`).join('')||'<p class="hint">Nothing to sell.</p>'}</div></details>`;}
function itemDesc(it){if(!isGear(it)){const d=ITEMS[it.k];if(!d)return '';const p=[];if(d.heal)p.push(`+${d.heal} HP`);if(d.mana)p.push(`+${d.mana} MP`);if(d.stam)p.push(`+${d.stam} SP`);if(d.cure)p.push('cures poison');if(d.buff)p.push(STATUS[d.buff].n);if(d.escape)p.push('escape');if(d.bomb)p.push('fire damage');if(d.ret)p.push('teleport home');if(d.revive)p.push('revive ally');if(d.school)p.push('learn '+MASTERY[d.school].n);if(d.t==='mat')p.push('material');if(d.wellfed)p.push('well-fed');return p.join(', ');}
  const s=itemStats(it),b=ITEM_BASES[it.b];const p=[];if(s.atk>0.5)p.push(`ATK ${Math.round(s.atk)}`);if(s.matk>0.5)p.push(`MATK ${Math.round(s.matk)}`);if(s.def>0.5)p.push(`DEF ${Math.round(s.def)}`);if(s.mdef>0.5)p.push(`MDEF ${Math.round(s.mdef)}`);
  for(const k of ATTRS)if(s[k])p.push(`${k.toUpperCase()} +${s[k]}`);if(s.crit)p.push(`Crit +${s.crit.toFixed(1)}%`);if(s.spd)p.push(`Spd ${s.spd>0?'+':''}${s.spd}`);for(const e in s.el)p.push(`${U.cap(e)} dmg`);for(const e in s.res)p.push(`${U.cap(e)} res ${s.res[e]}%`);if(s.steal)p.push('Lifesteal');
  return `${b.t==='weapon'?U.cap(b.wt):b.ac?U.cap(b.ac):b.n} · ${p.join(' · ')}${b.two?' · two-handed':''}${b.reach?' · reach':''}${b.ranged?' · ranged':''}`;}
function craftList(m){const P=S.P;const R=RECIPES.filter(r=>r.m===m);const st=craftStation({m});const ok=st.some(s=>hasSvc(P.loc,s));
  return `<h3>${MASTERY[m].n} <small>Lv ${mLv(P,m)} · ${masteryTier(mLv(P,m))}</small></h3>${ok?'':`<p class="hint">You need a ${st.map(s=>SVC_NAMES[s]).join(' or ')} to craft this.</p>`}<div class="list">${R.map(r=>{const can=canCraft(r);
    return `<div class="li ${can?'':'dim'}"><span>${E(r.n)} <small>${Object.entries(r.in).map(([k,q])=>`${ITEMS[k].n} ${invCount(P,k)}/${q}`).join(', ')} · needs ${r.lv}</small></span>${ok&&can?btn('Craft','craft',r.id,'tiny'):''}</div>`;}).join('')}</div>`;}
function boardView(){const P=S.P,qs=S.quests[P.loc]||[];
  let h=factionBoard(P.loc)+`<h3>Contracts</h3><p class="hint">Posted by locals and by other adventurers. Turn completed quests in here.</p><div class="list">`;
  for(const q of qs){const has=P.quests.some(x=>x.id===q.id);const rq=q.type==='request'&&npc(q.npc);h+=`<div class="li q ${rq?'req':''}"><span>${rq?avatar(rq.user,rq.cls)+' ':''}<b>${E(q.n)}</b> <small class="${lvlColor(q.lvl)}">Lv ${q.lvl}</small><br><small>${E(q.d)} Reward: ${U.fmt(q.xp)} XP, ${U.fmt(q.gold)}g${q.reward?', '+itemName(q.reward):''}</small></span>${has?'<small>Accepted</small>':btn('Accept','qaccept',q.id,'tiny')}</div>`;}
  h+='</div>';const ready=P.quests.map((q,i)=>[q,i]).filter(([q])=>q.done&&q.giver===P.loc);
  if(ready.length)h+=`<h3>Ready to turn in</h3><div class="list">${ready.map(([q,i])=>`<div class="li"><span>${E(q.n)}</span>${btn('Turn in','qturn',i,'tiny gilt')}</div>`).join('')}</div>`;
  return h;}
function trainerView(){const P=S.P,loc=P.loc;let h='';
  const mentorHere=Object.entries(ADV_CLASSES).filter(([id,A])=>A.mentor===loc);
  if(mentorHere.length){h+=`<h3>Masters of the higher paths</h3><div class="list">${mentorHere.map(([id,A])=>{const el=advEligible(P,A);return `<div class="li q"><span><b>${A.name}</b> <small>${A.desc}</small><br><small>${el.ok?'You are eligible to attempt the trial.':'Requires: '+E(el.why.join(', '))}</small></span>${P.adv===id?'<small>Your path</small>':el.ok?btn('Begin trial','trial',id,'tiny danger'):''}</div>`;}).join('')}</div>`;}
  {const P2=S.P;const ct=classTier(P2);const CT=CLASS_TIERS[P2.cls];h+=`<h3>Class upgrade: ${E(CLASSES[P2.cls].name)}</h3>${ct>=2?`<p class="good">You have reached ${E(CT.t[1])}, the peak of your class.</p>`:(()=>{const t=ct+1;const el=tierEligible(P2,t);const sk=SKILLS[TIER_SKILLS[P2.cls][t]];
    return `<div class="li q"><span><b>${E(CT.t[t-1])}</b> <small>${E(CT.d[t-1])} Unlocks ${E(sk.n)}: ${E(sk.d)} · +${t===1?5:10}% power</small><br><small>${el.ok?'<span class="good">Ready for the upgrade trial.</span>':'Requires: '+E(el.why.join(', '))}</small></span>${el.ok?btn('Begin trial','tiertrial',t,'tiny danger'):''}</div>`;})()}`;}
  h+=`<h3>Mastery training</h3><p class="hint">Pay a trainer to drill a skill (up to 40). Past that, you only improve by using it.</p><div class="list">${MASTERY_KEYS.filter(k=>MASTERY[k].t!=='prof'||['smithing','alchemy','cooking','enchanting','trading'].includes(k)).map(k=>{const m=mLv(P,k);return m>=40?'':`<div class="li"><span>${MASTERY[k].n} <small>Lv ${m}</small></span><span class="gold">${Math.round(30+m*m*1.5)}g</span>${btn('Train','trainm',k,'tiny')}</div>`;}).join('')}</div>`;
  h+=`<h3>Retrain class</h3><p class="hint">Change your base class for ${U.fmt(retrainCost())}g. Your masteries stay with you, so you can build unusual combinations.</p><div class="grid-btn">${Object.keys(CLASSES).filter(c=>c!==P.cls).map(c=>btn(CLASSES[c].name,'retrain',c,'ghost')).join('')}</div>`;
  return h;}
function arenaView(){const P=S.P,loc=P.loc;const here=(S.byLoc[loc]||[]).filter(n=>online(n)&&!n.inParty).sort((a,b)=>Math.abs(a.pvp.r-P.pvp.r)-Math.abs(b.pvp.r-P.pvp.r)).slice(0,10);
  let h=`<p>Your rating: <b>${P.pvp.r}</b> (${P.pvp.w}W / ${P.pvp.l}L)</p><div class="grid-btn">${btn('Ranked match (find opponent)','ranked','','danger')}</div>`;
  const T_=S.tourney;h+=`<h3>Grand Tournament</h3><p>${T_.state==='reg'?`Registration open. Starts ${T.str(T_.next)}.`:T_.state==='running'?`In progress, round ${T_.round}.`:`Next tournament: ${T.str(T_.next)} (registration opens 12h before).`}${T_.champion?` Last champion: ${userLink(T_.champion)}.`:''}</p>
    ${T_.state==='reg'&&loc==='valeria'&&!T_.reg?btn('Register (free, lvl 15+)','treg','','gilt'):''}${T_.reg?'<p class="good">You are registered.</p>':''}${T_.log.length?`<details><summary>Bracket results</summary><div class="log">${T_.log.slice(-15).map(l=>`<p>${E(l)}</p>`).join('')}</div></details>`:''}`;
  h+=`<h3>Challenge someone here</h3><div class="people">${here.map(n=>`<button class="person" data-a="duelask" data-v="${n.id}"><b>${E(n.user)}</b><small>Lv.${n.level} ${E(className(n))} · ${n.pvp.r}</small></button>`).join('')||'<p class="hint">No challengers around.</p>'}</div>`;
  const reals=Object.entries(NET.players).filter(([id])=>id!==NET.uid).sort((a,b)=>Math.abs(a[1].pvp.r-P.pvp.r)-Math.abs(b[1].pvp.r-P.pvp.r)).slice(0,8);
  if(NET.mode==='online')h+=`<h3>Real adventurers' champions</h3><p class="hint">Fight a real player's champion. They are controlled by the game's AI, using that player's actual stats and gear.</p><div class="people">${reals.map(([id,p])=>`<button class="person real" data-a="rduel" data-v="${id}"><b>${E(p.user)}<sup>●</sup></b><small>Lv.${p.level} ${E(CLASSES[p.cls]?CLASSES[p.cls].name:'')} · ${p.pvp?p.pvp.r:1000}</small></button>`).join('')||'<p class="hint">No other real players yet.</p>'}</div>`;
  return h;}
function guildHallView(){const P=S.P;let h='';const g=guild(P.guild);
  if(!g)h+=`<h3>Found a guild</h3><p class="hint">Costs 1,000 gold. You become the leader and can recruit adventurers.</p><form data-form="found" class="row wrap"><label class="sr" for="gname">Guild name</label><input id="gname" name="gname" maxlength="24" placeholder="Guild name" required><label class="sr" for="gtag">Tag</label><input id="gtag" name="gtag" maxlength="4" placeholder="TAG" required style="width:6em"><button class="b gilt">Found guild</button></form>`;
  else h+=`<p>You are a member of <b>${E(g.name)}</b>. Manage it in Party & Guild.</p>`;
  h+=`<h3>Guild directory</h3><div class="list">${S.guilds.slice().sort((a,b)=>guildPower(b)-guildPower(a)).map(x=>`<div class="li"><span><b>${E(x.name)}</b> [${E(x.tag)}] <small>Lv ${x.lvl} · ${x.members.length} members · req Lv ${x.req} · ${E(x.motto)}</small></span>${btn('View','guildview',x.id,'tiny ghost')}${!P.guild&&!x.isPlayer?btn('Apply','gapply',x.id,'tiny'):''}</div>`).join('')}</div>`;
  h+=`<div class="row">${btn('Quest board','svc','board')}</div>`;return h;}

/* ---------------- map ---------------- */
function renderMap(){const P=S.P;const vis=l=>!LOCS[l].hid||P.explored.includes(l)||P.flags['found_'+l];
  const lines=ROUTES.filter(([a,b])=>vis(a)&&vis(b)).map(([a,b,h])=>`<line x1="${LOCS[a].x}" y1="${LOCS[a].y}" x2="${LOCS[b].x}" y2="${LOCS[b].y}" class="route ${a===P.loc||b===P.loc?'near':''}"/>`).join('');
  const regions=[['ALDMERE',230,470],['SYLVANETH',180,60],['KHAZ DURRIM',640,95],['GOR\'THAK WASTES',830,560],['FERAL COAST',650,690],['THE FREE LANDS',470,420],['THE TORN SKY',920,120]];
  const nodes=Object.keys(LOCS).filter(vis).map(l=>{const L=LOCS[l],ex=P.explored.includes(l);const t=isTown(l);const r=L.ty==='city'?9:t?7:6;
    return `<g class="node ${l===P.loc?'cur':''} ${ex?'ex':'unex'} ty-${L.ty} ${UI.mapSel===l?'sel':''}" data-a="mapsel" data-v="${l}" tabindex="0" role="button" aria-label="${E(L.n)}">${l===P.loc?`<circle cx="${L.x}" cy="${L.y}" r="${r+7}" class="here"/>`:''}${Object.values(NET.peerMap).some(p=>p.loc===l)?`<circle cx="${L.x+r+3}" cy="${L.y-r-3}" r="4" class="friend"/>`:''}<circle cx="${L.x}" cy="${L.y}" r="${r}"/>${S.boss&&S.boss.loc===l?`<circle cx="${L.x}" cy="${L.y}" r="${r+6}" class="bossring"/>`:''}
    ${S.wars.some(w=>w.front===l)?`<text x="${L.x+10}" y="${L.y-8}" class="war">⚔</text>`:''}<text x="${L.x}" y="${L.y+r+12}" class="lbl">${E(L.n)}</text></g>`;}).join('');
  const sel=UI.mapSel||P.loc;const L=LOCS[sel];const p=sel!==P.loc?path(P.loc,sel):null;
  const pathLine=p?`<polyline class="jpath" points="${p.path.map(x=>LOCS[x].x+','+LOCS[x].y).join(' ')}"/>`:'';
  return `<section class="panel"><h2>The Eternal Realms</h2><p class="hint maphint">Swipe the map sideways to see the whole realm · tap a place for details.</p><div class="mapwrap"><svg viewBox="0 0 1000 720" class="map" role="img" aria-label="World map"><defs><filter id="rough"><feTurbulence baseFrequency="0.018" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="38"/></filter></defs><rect x="0" y="0" width="1000" height="720" class="sea"/>
    <g filter="url(#rough)">${[[260,330,250,190,'land'],[230,130,170,100,'forest'],[620,170,170,120,'mount'],[820,420,190,200,'waste'],[620,600,170,90,'land'],[480,400,110,170,'land'],[340,520,90,70,'land'],[560,670,80,30,'land'],[950,190,60,60,'waste']].map(([x,y,rx,ry,c])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="terr ${c}"/>`).join('')}</g>
    ${regions.map(([n,x,y])=>`<text x="${x}" y="${y}" class="region">${n}</text>`).join('')}${lines}${pathLine}${nodes}</svg></div><p class="legend"><span class="lg city"></span>City <span class="lg dng"></span>Dungeon / lair <span class="lg ruin"></span>Ruin <span class="lg fr"></span>Real player</p>
    <div class="mapinfo"><div class="vista sm" style="background-image:url(${drawVista(sel,S.time)})"></div><h3>${E(L.n)}</h3><p>${E(L.d)}</p>${P.explored.includes(sel)?'':'<p class="hint">You have not been here yet.</p>'}
    <p><small>${U.cap(L.ty)}${!isTown(sel)?` · Lv ${L.lv[0]}–${L.lv[1]}`:''}${S.control[sel]?` · ${E(FACTIONS[S.control[sel]].n)}`:''}${L.pvp?' · PvP zone':''}</small></p>
    ${sel===P.loc?'<p class="good">You are here.</p>':GRAPH[P.loc][sel]!=null?btn(`Travel (${GRAPH[P.loc][sel]}h)`,'travel',sel,'gilt'):p?`<p>Route: ${p.path.map(x=>E(LOCS[x].n)).join(' → ')} (${p.hours}h)</p>${btn('Journey there','journey',sel,'gilt')}`:'<p class="hint">No known route.</p>'}</div></section>`;}

/* ---------------- dispatcher ---------------- */
const ACT={};
function act(name,v,el){const f=ACT[name];if(!f)return;const P=S&&S.P,n0=P?P.log.length:0;try{f(v,el);}catch(e){console.error(e);UI.toast('Something went wrong: '+e.message,'bad');}
  if(P&&P.log.length>n0&&!UI.inCombat()){UI.lastResult={lines:P.log.slice(n0).slice(-6),t:Date.now()};if(!$('#modal').hidden||UI.tab!=='world'){const L=P.log[P.log.length-1];UI.toast(L[1].length>110?L[1].slice(0,108)+'…':L[1],L[2]==='bad'?'bad':L[2]==='epic'?'epic':'');}}
  UI.dirty=true;render();if(UI.inCombat()&&!$('#combat').hidden)renderCombat();}
document.addEventListener('click',e=>{UI.lastTap=Date.now();const el=e.target.closest('[data-a]');if(!el)return;if(el.tagName==='A')e.preventDefault();act(el.dataset.a,el.dataset.v,el);});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('g[data-a]')){e.preventDefault();act(e.target.dataset.a,e.target.dataset.v,e.target);}if(e.key==='Escape'&&UI.modalStack.length)closeModal();});
document.addEventListener('submit',e=>{const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();const fd=Object.fromEntries(new FormData(f).entries());act('form_'+f.dataset.form,fd,f);});
function needIdle(){if(UI.inCombat()){UI.toast('You are in combat!','bad');return false;}return true;}
Object.assign(ACT,{
  sound(){if(AUD.on){audStop();AUD.declined=true;}else{AUD.declined=false;audStart();}UI.dirty=true;const b=document.getElementById('tsound');if(b)b.textContent=AUD.on?'♪ Music on':'♪ Play music';},
  dismissres(){UI.lastResult=null;},
  hidetips(){S.P.flags.hideTips=1;},
  tiertrial(t){closeModal();startTierTrial(+t);},
  defend(){if(needIdle())defendWave();},
  more(){openModal(`<h2>More</h2><div class="grid-act">${TABS.filter(t=>!BOTTOM.includes(t[0])).map(([k,n,ic])=>abtn(ic,n+badge(k),'','gotab',k)).join('')}</div>`,'more');},
  gotab(v){closeModal();UI.tab=v;window.scrollTo(0,0);},
  tab(v){UI.tab=v;if(v==='chat'){S.P.mentions=0;}window.scrollTo(0,0);},
  travel(v){if(!needIdle())return;closeModal();travelTo(v);UI.tab='world';},
  journey(v){if(!needIdle())return;const p=path(S.P.loc,v);if(!p)return;const next=p.path[1];travelTo(next);UI.mapSel=v;if(!UI.inCombat()&&S.P.loc!==v)UI.toast(`Next stop: ${LOCS[p.path[2]||v].n}`);},
  mapsel(v){UI.mapSel=v;},mapfocus(v){UI.tab='map';UI.mapSel=v;},
  explore(){if(needIdle())exploreHere();},search(){if(needIdle())searchTreasure();},hunt(){if(needIdle())startEncounter(S.P.loc);},
  gather(v){if(!needIdle())return;const [k,m]=v.split('|');gather(k,m);},camp(){if(needIdle())camp();},
  dungeon(){if(needIdle())enterDungeon();},dfloor(){if(needIdle())dungeonFloor();},dleave(){S.P.dungeon=null;log('You leave the dungeon.');},
  wboss(){if(needIdle())joinWorldBoss();},
  svc(v){openModal(svcPanel(v),'svc:'+v);},
  talk(v){const [n,r]=v.split('|');talkTownsfolk(n,r);},examine(i){examine(+i);},
  inn_rest(){restInn();refreshModal();},rumors(){hearRumors();refreshModal();},
  buy(k){buyItem({k},priceFor({k},S.P.loc));refreshModal();},
  buytome(k){const p=Math.round(priceFor({k},S.P.loc)*(S.P.race==='halfelf'?0.75:1)*(S.P.race==='beastkin'?1.2:1));buyItem({k},p);refreshModal();},
  smithbuy(i){const st=smithStock(S.P.loc);const it=st[+i];if(!it)return;if(buyItem(it,priceFor(it,S.P.loc)))st.splice(+i,1);refreshModal();},
  sell(i){sellItem(+i);refreshModal();},craftlist(m){openModal(craftList(m),'craft:'+m);},
  craft(id){const r=RECIPES.find(x=>x.id===id);if(r.ench){openModal(enchantPick(r),'ench');return;}craft(r);refreshModal();},
  enchant(v){const [id,i]=v.split('|');craft(RECIPES.find(x=>x.id===id),+i);closeModal();},
  temple_heal(){const P=S.P,c=5+P.level*3;if(P.gold<c)return UI.toast('Not enough gold','bad');P.gold-=c;const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;log('The priests heal your wounds.','good');spend(20);refreshModal();},
  temple_bless(){const P=S.P,c=(5+P.level*3)*3;if(P.gold<c)return UI.toast('Not enough gold','bad');P.gold-=c;P.fx.blessed=S.time+180;log('You are blessed by the Light.','good');refreshModal();},
  pray(){spend(30);log(U.pick(['You kneel and feel calmer.','A warm light seems to answer.','Nothing happens, but you feel better.']),'lore');const f=S.control[S.P.loc];if(f&&U.chance(0.2))addRep(f,1);refreshModal();},
  read(b){readBook(b);refreshModal();},
  qaccept(id){const q=(S.quests[S.P.loc]||[]).find(x=>x.id===id);if(q)acceptQuest(q);refreshModal();},
  qturn(i){turnInQuest(+i);refreshModal();},qabandon(i){const q=S.P.quests[+i];if(q){S.P.quests.splice(+i,1);log(`Abandoned: ${q.n}`);}},
  trial(id){closeModal();startTrial(id);},trainm(k){trainMastery(k);refreshModal();},retrain(c){retrain(c);refreshModal();},
  ride(l){const P=S.P,p=path(P.loc,l);const cost=20+Math.round(p.hours*6);if(P.gold<cost)return UI.toast('Not enough gold','bad');P.gold-=cost;closeModal();log(`You ride to ${LOCS[l].n}.`);spend(Math.round(p.hours*30));P.loc=l;for(const x of p.path)if(!P.explored.includes(x)&&isTown(x))P.explored.push(x);arriveAt(l);},
  sail(v){const [l,c,h]=v.split('|');const P=S.P;if(P.gold<+c)return UI.toast('Not enough gold','bad');P.gold-=+c;closeModal();log(`You board a ship bound for ${LOCS[l].n}.`);spend(+h*60);
    if(U.chance(0.15)){P.loc=l;arriveAt(l,true);log('Sea serpents attack the ship!','bad');startCombat([makeMonster('sea_serpent',Math.max(P.level,20),{diff:DIFFS[P.diff].m})],{type:'pve',loc:'isles'});return;}P.loc=l;arriveAt(l);},
  treg(){if(S.P.level<15)return UI.toast('You must be level 15 to enter.','bad');S.tourney.reg=true;log('You registered for the Grand Tournament.','good');refreshModal();},
  tfight(){const T_=S.tourney;if(!T_.pending)return;const n=npc(T_.pending.opp);const P=S.P;const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;startPvP(n,{type:'tourney',title:`Grand Tournament R${T_.pending.round}: vs ${n.user}`,noEscape:true});},
  ranked(){const P=S.P;if(!needIdle())return;const pool=S.npcs.filter(n=>online(n)&&!n.inParty&&!n.retired&&Math.abs(n.pvp.r-P.pvp.r)<200&&Math.abs(n.level-P.level)<=12);const n=U.pick(pool);if(!n)return UI.toast('No opponent found. Try later.','bad');
    closeModal();const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;log(`Matched against ${n.user} (${n.pvp.r}).`);startPvP(n,{type:'arena',title:`Ranked: vs ${n.user} (${n.pvp.r})`});},
  duelask(id){const n=npc(id);const r=n.wantsDuel&&S.time-n.wantsDuel<240?'yes':considerDuel(n);if(r==='yes'){closeModal();const P=S.P,st=stats(P);P.hp=Math.max(P.hp,st.mhp*0.8);startPvP(n,{type:'duel',title:`Duel vs ${n.user}`});n.wantsDuel=0;}
    else{UI.toast(`${n.user} declined${r==='offline'?' (offline)':r==='busy'?' (busy)':''}.`,'bad');if(r==='no')BUS.emit('npc_pm',{n,text:U.pick(['not now','nah','maybe later'])});}},
  rduel(id){const l=NET.peerMap[id];closeModal();if(l&&l.cs){const P=S.P,st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;const a=actorFromSnap(l.cs,l.user+' ●','e');startCombat([a],{type:'rpvp',title:`vs ${l.user}'s champion`,rpvp:l.pvp,noParty:true,opp:{level:l.lvl}});return;}
    const p=NET.players[id];if(!p||!p.snap)return UI.toast('Their champion is not available right now.','bad');startRealDuel(id,p);},
  freeform(){},
});
function enchantPick(r){const P=S.P;const items=[...EQUIP_SLOTS.map(s=>P.equip[s]).filter(Boolean)];return `<h2>${E(r.n)}</h2><p>Choose an item in your bag to enchant. Equipped items must be unequipped first.</p><div class="list">${P.inv.map((it,i)=>isGear(it)?`<div class="li"><span>${rarityName(it)}${it.ench?' <small>(will replace '+AFFIXES[it.ench].n+')</small>':''}</span>${btn('Enchant','enchant',`${r.id}|${i}`,'tiny')}</div>`:'').join('')||'<p class="hint">No gear in your bag.</p>'}</div>`;}
function startRealDuel(id,p){const snap=JSON.parse(JSON.stringify(p.snap));snap.id='R:'+id;snap.mastery=snap.mastery||{};snap.equip=snap.equip||{};snap.attr=snap.attr||baseAttrs(snap.race,'commoner');snap.hpPct=1;
  if(!RACES[snap.race]||!CLASSES[snap.cls])return;const P=S.P,st=stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;startPvP(snap,{type:'rpvp',title:`vs ${p.user}'s champion (real player)`,rpvp:p.pvp||{r:1000}});
  C.rid=id;}

/* ---------------- modal ---------------- */
function openModal(html,key){UI.modalKey=key;$('#modal-body').innerHTML=html;$('#modal').hidden=false;UI.modalStack=[key];$('#modal-body').scrollTop=0;}
function refreshModal(){const k=UI.modalKey;if(!k||$('#modal').hidden)return;if(k.startsWith('svc:'))$('#modal-body').innerHTML=svcPanel(k.slice(4));else if(k.startsWith('craft:'))$('#modal-body').innerHTML=craftList(k.slice(6));else if(k.startsWith('prof:'))$('#modal-body').innerHTML=profileView(k.slice(5));}
function closeModal(){$('#modal').hidden=true;UI.modalKey=null;UI.modalStack=[];}
ACT.close=closeModal;

/* ---------------- specialty shops & faction board (expansion) ---------------- */
function specialView(loc){const SH=SPECIAL_SHOPS[loc];const P=S.P;const st=specialStock(loc);P.shopVisits=P.shopVisits||{};
  let h=`<div class="phead">${avatar(SH.keeper,{stern:'knight',aloof:'mage',gruff:'warrior',sly:'rogue',cheerful:'bard',loud:'berserker',kind:'druid',shifty:'rogue',chatty:'merchant',proud:'paladin'}[SH.mood])}<div><h2>${E(SH.n)}</h2><p class="hint">${E(SH.keeper)} · ${E(LOCS[loc].n)}</p></div></div>
   <p class="lore">“${E(keeperGreeting(loc))} ${E(SH.line)}”</p>${SH.set?`<p class="hint">Sometimes stocks pieces of the <b>${E(SETS[SH.set].n)}</b> set.</p>`:''}`;
  if(st.featured)h+=`<h3>${icon('special')} Today's treasure</h3><div class="list"><div class="li feat"><span>${rarityName(st.featured)} <small>Lv.${st.featured.l} · ${E(itemDesc(st.featured))}</small><br><small class="lore">${E(UNIQUES[st.featured.u].lore)}</small></span><span class="gold">${U.fmt(specialPrice(loc,st.featured))}g</span>${btn('Buy','sbuy','f','tiny gilt')}</div></div>`;
  h+=`<h3>Wares <small>restocked daily</small></h3><div class="list">${st.items.map((it,i)=>`<div class="li"><span><button class="itm" data-a="sinfo" data-v="${i}">${rarityName(it)}</button> <small>Lv.${it.l} · ${E(itemDesc(it))}${it.set?` · <b>${E(SETS[it.set].n)} set</b>`:''}</small></span><span class="gold">${U.fmt(specialPrice(loc,it))}g</span>${btn('Buy','sbuy',i,'tiny')}</div>`).join('')||'<p class="hint">Sold out today.</p>'}</div>
   <h3>Supplies</h3><div class="list">${st.cons.map(k=>`<div class="li"><span>${E(ITEMS[k].n)} <small>${E(itemDesc({k}))}</small></span><span class="gold">${priceFor({k},loc)}g</span>${btn('Buy','buy',k,'tiny')}</div>`).join('')}</div>${sellSection()}`;
  return h;}
function factionBoard(loc){const P=S.P;const fs=Object.entries(FACTION_CHAINS).filter(([f,C_])=>C_.giver===loc);if(!fs.length)return '';
  return fs.map(([f,C_])=>{const i=(P.fchains||{})[f];const done=i!=null&&i>=C_.steps.length;const st=i!=null&&!done?C_.steps[i]:null;const rep=P.rep[f]||0;
    return `<section class="fchain"><h3>${icon('castle')} ${E(C_.n)} <small>${E(FACTIONS[f].n)}</small></h3>${done?'<p class="good">Completed. The realm remembers.</p>':i==null?`<p>${E(C_.steps[0].d)}</p><p class="hint">${C_.steps.length} steps · Reward ${U.fmt(C_.reward.gold)}g, reputation${C_.reward.uniq?', '+UNIQUES[C_.reward.uniq].n:''}${C_.reward.set?', a '+SETS[C_.reward.set].n+' set piece':''}${rep<-11?' · They don\'t trust you yet.':''}</p>${rep>=-11?btn('Take the oath','faccept',f,'gilt tiny'):''}`
      :`<p><b>Step ${i+1}/${C_.steps.length}: ${E(st.n)}</b> — ${E(st.d)} ${st.type==='kill'?`(${P.fprog[f]||0}/${st.qty})`:st.type==='gather'?`(${invCount(P,st.item)}/${st.qty})`:''}</p><p class="hint">Where: ${E(LOCS[st.loc].n)}</p>`}</section>`;}).join('');}
Object.assign(ACT,{
  faccept(f){factionAccept(f);refreshModal();},
  sinfo(i){const it=specialStock(S.P.loc).items[+i];if(it)openModal(itemInfoFor(it),'item');},
  sbuy(v){const loc=S.P.loc;const st=specialStock(loc);const it=v==='f'?st.featured:st.items[+v];if(!it)return;const SH=SPECIAL_SHOPS[loc];const f=S.control[loc];
    if(!SH.noRep&&f&&(S.P.rep[f]||0)<=-35)return UI.toast(`${SH.keeper} won't sell to you.`,'bad');
    if(buyItem(it,specialPrice(loc,it))){if(v==='f')st.featured=null;else st.items.splice(+v,1);S.P.shopVisits=S.P.shopVisits||{};S.P.shopVisits[loc]=(S.P.shopVisits[loc]||0)+1;}refreshModal();}
});

/* ---------------- townsfolk conversations ---------------- */
const ROLE_OPTS={innkeeper:[['room','I\'d like a room for the night'],['meal','Something hot to eat'],['rumor','Heard any rumors?']],merchant:[['shop','Show me your wares'],['prices','How are prices lately?']],
  smith:[['smith','I need arms and armor'],['craft','Can I use your forge?']],librarian:[['library','I\'d like to read'],['lore','Tell me some history']],guard:[['board','Any bounties posted?'],['danger','Is it safe out there?']],
  priest:[['heal','Please heal my wounds'],['bless','A blessing, if you would'],['lore','Tell me of your faith']],arena:[['arena','I want to fight'],['tourney','When is the next tournament?']],
  mentor:[['train','Train me'],['paths','Tell me about the higher paths']],barkeep:[['rumor','What\'s the gossip?'],['drink','One ale, please']],courier:[['courier','Can you carry a parcel?']],
  smuggler:[['blackmarket','What are you selling?'],['rumor','Any secrets for sale?']],elder:[['lore','Tell me the old stories'],['danger','What troubles the village?']],farmer:[['danger','Any trouble around here?'],['work','Need a hand?']],
  mystic:[['lore','What do you see?'],['paths','Tell me of dragonblood']]};
const ROLE_LORE={valeria:'lore_lionheart',lothirien:'lore_concord',khazgard:'lore_undervault',duskhaven:'lore_spideroracle',bloodrock:'lore_ashspirits',pawhaven:'lore_unchaining',saltmere:'lore_saltmere',ironford:'lore_dragonpacts',crossroads:'lore_guilds',skyreach:'lore_monastery',thornvale:'lore_concord',brookhollow:'lore_grubnak',cove:'lore_cove',deepforge:'lore_artifice'};
function folkHtml(){const D=UI.folk;const P=S.P;const opts=(ROLE_OPTS[D.role]||[]).concat([['news','What\'s the news?'],['place','Tell me about this place'],['work','Any work for me?'],['bye','Farewell']]);
  const seen=new Set();const uniq=opts.filter(o=>!seen.has(o[0])&&seen.add(o[0]));
  return `<div class="phead">${avatar(D.name,{innkeeper:'merchant',librarian:'mage',guard:'knight',merchant:'merchant',priest:'cleric',arena:'berserker',smith:'warrior',mentor:'swordsman',barkeep:'rogue',courier:'archer',smuggler:'rogue',elder:'druid',farmer:'druid',mystic:'summoner'}[D.role])}<div><h2>${E(D.name)}</h2><p class="hint">${U.cap(D.role)} · ${E(LOCS[P.loc].n)}</p></div></div>
  <div class="dialog">${D.lines.slice(-8).map(([who,t])=>`<p class="${who==='you'?'you':'them'}"><b>${who==='you'?E(P.name):E(D.name)}</b> ${E(t)}</p>`).join('')}</div>
  <div class="grid-btn">${uniq.map(([k,t])=>btn(E(t),'folksay',k,k==='bye'?'ghost':'')).join('')}</div>`;}
function folkSay(k){const D=UI.folk;const P=S.P,loc=P.loc;const say=t=>D.lines.push(['them',t]);const optText=(ROLE_OPTS[D.role]||[]).concat([['news',"What's the news?"],['place','Tell me about this place'],['work','Any work for me?'],['bye','Farewell']]).find(o=>o[0]===k);
  D.lines.push(['you',optText?optText[1]:k]);spend(5);
  const go=(svc)=>{if(hasSvc(loc,svc)){openModal(svcPanel(svc),'svc:'+svc);return true;}say('That isn\'t something we have here, I\'m afraid.');return false;};
  switch(k){
    case 'news':case 'rumor':{const R=rumors(loc);say(R[0]||'Quiet times.');if(R[1])say(R[1]);for(const h of ['hollow','cove','skyreach'])if(R.some(r=>r.includes(h==='hollow'?'west of Moonfall':h==='cove'?'Silk-Eye':'monastery')))P.flags['rumor_'+h]=1;break;}
    case 'place':{const L=LOCS[loc];say(L.d);if(L.feat&&L.feat.length)say(`If you have time, see ${L.feat[0].toLowerCase()}.`);const lr=ROLE_LORE[loc];if(lr&&!P.codex.includes(lr)&&U.chance(0.5)){say('There\'s an old story about that, actually…');unlockLore(lr);}break;}
    case 'lore':{const lr=ROLE_LORE[loc]||U.pick(Object.keys(LORE));say(LORE[lr].x);unlockLore(lr);break;}
    case 'work':{const qs=(S.quests[loc]||[]).filter(q=>!q.taken);if(qs.length){say(`${qs[0].n}. ${qs[0].d} Check the board for more.`);if(hasSvc(loc,'board'))D.lines.push(['them','(The quest board is right over there.)']);}else say('Nothing today. Try the next town over.');break;}
    case 'danger':{const ns=neighbors(loc).filter(l=>LOCS[l].mon.length);const l=U.pick(ns);if(l)say(`${LOCS[l].n} is ${LOCS[l].lv[0]>P.level+3?'too dangerous for you yet':'manageable'}. ${pl(MONSTERS[U.pick(LOCS[l].mon)].n)} roam there (level ${LOCS[l].lv[0]} to ${LOCS[l].lv[1]}).`);else say('Safe enough within these walls.');const inv=evActive().find(e=>e.kind==='invasion');if(inv)say(`And the ${inv.horde} is attacking ${LOCS[inv.loc].n}!`);break;}
    case 'prices':{const m=priceMult(loc,'weapon'),c=priceMult(loc,'con');say(`Weapons are ${m>1.15?'expensive':m<0.85?'cheap':'fair'} right now, potions ${c>1.15?'dear':c<0.85?'cheap':'normal'}.${evActive().some(e=>e.kind==='fair')?' And the Merchant Fair has everything 20% off!':''}`);break;}
    case 'room':{if(!hasSvc(loc,'inn')){say('No rooms here.');break;}const c=10+P.level*2;if(P.gold<c){say(`A room is ${c} gold.`);break;}restInn();say(`Here's your key. Sleep well. (Fully rested, ${c}g)`);break;}
    case 'meal':{const cost=8;if(P.gold<cost){say(`That's ${cost} gold, love.`);break;}P.gold-=cost;const st=stats(P);P.hp=Math.min(st.mhp,P.hp+st.mhp*0.3);P.fx.wellfed=S.time+180;say('Here, a bowl of stew. On the house, almost. (+30% HP, well-fed)');break;}
    case 'drink':{if(P.gold<2){say('Two coppers.');break;}P.gold-=2;say(U.pick(['Here you go.','Cheers!','Careful, it\'s strong.']));if(U.chance(0.4))say(rumors(loc)[0]||'');break;}
    case 'shop':return void(SPECIAL_SHOPS[loc]?go('special'):go('shop'));
    case 'smith':return void go('smith');case 'craft':return void(hasSvc(loc,'forge')?go('forge'):go('smith'));case 'library':return void go('library');case 'board':return void go('board');
    case 'arena':return void go('arena');case 'train':return void go('trainer');case 'blackmarket':return void go('special');
    case 'heal':{const c=5+P.level*3;if(P.gold<c){say(`An offering of ${c} gold is customary.`);break;}P.gold-=c;const st=stats(P);P.hp=st.mhp;P.mp=st.mmp;say('Be whole again.');break;}
    case 'bless':{const c=(5+P.level*3)*3;if(P.gold<c){say(`A blessing asks ${c} gold.`);break;}P.gold-=c;P.fx.blessed=S.time+180;say('The Light walks with you.');break;}
    case 'tourney':{const T_=S.tourney;say(T_.state==='reg'?`Registration is open now! It starts ${T.str(T_.next)}. Sign up at the Valeria Arena.`:T_.state==='running'?'It\'s happening right now!':`The next one is ${T.str(T_.next)}.`);break;}
    case 'paths':{const ok=Object.values(ADV_CLASSES).filter(A=>advEligible(P,A).ok);const ct=classTier(P);say(ok.length?`You could walk the path of the ${ok[0].name}.`:'The higher paths need more mastery than you have yet.');say(ct<2?`For your own class, the next step is ${CLASS_TIERS[P.cls].t[ct]}, at level ${TIER_REQ[ct+1].lvl}.`:'You have mastered your class.');break;}
    case 'courier':say(NET.mode==='online'?'For real adventurers, yes. Open their profile under Party & Guild and choose "Send a parcel".':'Only between real adventurers who share this realm.');break;
    case 'bye':closeModal();UI.folk=null;return;
  }
  openModal(folkHtml(),'folk');}
ACT.talk=(v)=>{const i=v.lastIndexOf('|');const name=v.slice(0,i),role=v.slice(i+1);const P=S.P;P.folkMet=P.folkMet||{};const met=P.folkMet[name]=(P.folkMet[name]||0)+1;
  const greet={innkeeper:'Welcome, traveler! Warm fire, cold ale.',merchant:'Ah, a customer!',smith:'Mind the sparks.',librarian:'Quietly, please. How can I help?',guard:'Move along. Unless you need something?',priest:'Peace be with you.',arena:'Looking for a fight?',mentor:'Show me what you\'ve learned.',barkeep:'What\'ll it be?',courier:'Parcels, letters, secrets. I carry them all.',smuggler:'You didn\'t see me.',elder:'Sit, young one.',farmer:'Morning!',mystic:'I wondered when you\'d come.'}[role]||'Hello.';
  UI.folk={name,role,lines:[['them',met>3?`${S.P.name}! Good to see you again.`:greet]]};openModal(folkHtml(),'folk');};
ACT.folksay=(k)=>folkSay(k);
