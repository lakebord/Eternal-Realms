/* ETERNAL REALMS — UI: hero, bag, quests, chat, social, ranks, market, codex, menu, creation, combat, boot */
'use strict';
function renderChar(){const P=S.P,st=stats(P),a=st.attr;const R=RACES[P.race];
  const look=P.look||{};const desc=`${P.age?P.age+'-year-old ':''}${P.gender&&P.gender!=='unspecified'?P.gender+' ':''}${R.name.toLowerCase()} with ${look.hair||'unkempt'} hair, ${look.eyes||'watchful'} eyes and a ${look.build||'wiry'} build${look.skin?`, ${look.skin} ${P.race==='beastkin'?'fur':P.race==='draconian'?'scales':'skin'}`:''}${look.mark?`. ${U.cap(look.mark)}`:''}.`;
  let h=`<section class="panel hero"><div class="vista sm" style="background-image:url(${drawVista(P.loc,S.time)})"></div><div class="phead"><span class="portrait lg" style="--ac:${CLS_HUE[P.cls]}">${icon(CLS_ICON[P.cls])}<b>${P.level}</b></span><div><h2>${E(P.name)} <small>“${E(P.user)}”</small></h2></div></div><p class="desc">A ${E(desc)}</p>
    <p><b>Lv.${P.level} ${E(className(P))}</b> · ${R.name} · ${BACKGROUNDS[P.bg].name}${P.guild?` · ${E(guild(P.guild).name)}`:''} · Fame ${U.fmt(P.fame)}</p>
    <p class="hint">${E(R.perk)} <span class="bad">${E(R.flaw)}</span></p></section>`;
  h+=`<section class="panel"><h3>Attributes ${P.pts?`<span class="gilt-t">${P.pts} unspent points</span>`:''}</h3><div class="attrs">${ATTRS.map(k=>`<div class="attr"><span title="${ATTR_NAMES[k]}">${k.toUpperCase()}</span><b>${a[k]}</b>${P.pts?btn('+','alloc',k,'tiny'):''}</div>`).join('')}</div>
    <div class="derived">${[['Max HP',st.mhp],['Max MP',st.mmp],['Max SP',st.msp],['Phys. Attack',st.patk],['Magic Attack',st.matk],['Phys. Defense',st.pdef],['Magic Defense',st.mdef],['Accuracy',st.acc],['Evasion',st.eva.toFixed(1)+'%'],['Critical',st.crit.toFixed(1)+'%'],['Crit Damage',Math.round(st.critDmg)+'%'],['Speed',st.spd],['Gear Score',st.gs],['Combat Power',st.power]].map(([k,v])=>`<div><span>${k}</span><b>${typeof v==='number'?U.fmt(v):v}</b></div>`).join('')}</div>
    ${Object.keys(st.sets||{}).length?`<p class="good">Sets: ${Object.entries(st.sets).map(([k,n])=>`${SETS[k].n} ${n}/4`).join(' · ')}</p>`:''}
    ${Object.keys(st.res).length?`<p class="hint">Resistances: ${Object.entries(st.res).map(([e,v])=>`${U.cap(e)} ${v}%`).join(', ')}</p>`:''}
    <p class="hint">STR/DEX power physical attacks (DEX for bows & daggers), INT magic, WIS magic defense and healing, VIT health, AGI speed & evasion, END stamina, LUCK crits and loot.</p></section>`;
  const ms=MASTERY_KEYS.map(k=>[k,P.mastery[k]]).filter(([k,m])=>m&&(m.lv>0||m.xp>0));
  h+=`<section class="panel"><h3>Skill mastery</h3><p class="hint">Masteries grow with use. Weapons: +0.6% damage per level, +5% crit at 25, armor piercing at 75, techniques at 15/40/75. Schools unlock spells at 1/20/55/85.</p><div class="masteries">${ms.map(([k,m])=>`<div class="mastery"><span>${MASTERY[k].n}</span><b>${m.lv}</b><small>${masteryTier(m.lv)}</small>${m.lv<100?`<div class="bar xp thin"><i style="width:${m.xp/masteryNeed(m.lv)*100}%"></i></div>`:''}</div>`).join('')||'<p class="hint">No masteries yet.</p>'}</div></section>`;
  const sk=skillList(P);h+=`<section class="panel"><h3>Skills & spells</h3><div class="skills">${sk.map(id=>{const s=SKILLS[id];return `<div class="skill"><b>${E(s.n)}</b><small>${s.c[0]?s.c[0]+' MP ':''}${s.c[1]?s.c[1]+' SP ':''}${s.cd?'· CD '+s.cd:''}</small><p>${E(s.d||'')}</p></div>`;}).join('')}</div>
    <p class="hint">Upcoming: ${CLASSES[P.cls].skills.filter(s=>(SKILLS[s].lv||1)>P.level).map(s=>`${SKILLS[s].n} (Lv ${SKILLS[s].lv})`).join(', ')||'all class skills learned'}</p></section>`;
  {const ct=classTier(P),CT=CLASS_TIERS[P.cls],TS=TIER_SKILLS[P.cls];const steps=[[CLASSES[P.cls].name,'Base class',null,0],[CT.t[0],`Lv ${TIER_REQ[1].lvl} · trial`,TS[1],1],[CT.t[1],`Lv ${TIER_REQ[2].lvl} · trial`,TS[2],2]];
  h+=`<section class="panel"><h3>Class path</h3><div class="cpath">${steps.map(([n,req,sk,t])=>`<div class="cstep ${ct>=t?'got':''} ${ct===t?'cur':''}"><b>${E(n)}</b><small>${t?req:'Base class'}</small>${sk?`<small class="sk">${E(SKILLS[sk].n)}: ${E(SKILLS[sk].d)}</small>`:`<small class="sk">Lv 35 skill: ${E(SKILLS[TS[0]].n)}</small>`}</div>`).join('<span class="arrow">→</span>')}</div>
    <p class="hint">Upgrade trials are offered by trainers in any town. Retraining keeps the upgrades you earned for each class.</p></section>`;}
  h+=`<section class="panel"><h3>Prestige classes</h3><p class="hint">Hybrid paths that cross class lines.</p><div class="list">${Object.entries(ADV_CLASSES).map(([id,A])=>{const el=advEligible(P,A);return `<div class="li ${el.ok?'':'dim'}"><span><b>${A.name}</b>${P.adv===id?' ✓':''} <small>${E(A.desc)} Mentor in ${LOCS[A.mentor].n}. ${el.ok?'<span class="good">Eligible: visit the mentor\'s trainers.</span>':E(el.why.join(' · '))}</small></span></div>`;}).join('')}</div></section>`;
  if(P.comps.length||canTame())h+=`<section class="panel"><h3>Companions <small>${P.comps.length}/8</small></h3>${canTame()?'<p class="hint">In combat, use Bond on a beast, spirit or elemental below 30% HP.</p>':''}<div class="list">${P.comps.map(c=>{const sp=SPECIES[c.sp];return `<div class="li"><span><b>${E(c.name)}</b> <small>Lv.${c.level} ${E(sp.n)}${sp.evo?` · evolves at ${sp.evo[0]} → ${SPECIES[sp.evo[1]].n}`:' · final form'}</small></span>${P.activeComp===c.id?'<small>Active</small>':btn('Set active','compact',c.id,'tiny')}${btn('Release','comprel',c.id,'tiny ghost')}</div>`;}).join('')}</div></section>`;
  h+=`<section class="panel"><h3>Reputation</h3><div class="list">${KINGDOMS.map(f=>{const v=P.rep[f]||0;return `<div class="li"><span>${E(FACTIONS[f].n)}</span><span class="${v>=12?'good':v<=-12?'bad':''}">${repTitle(v)} (${v})</span></div>`;}).join('')}</div></section>`;
  h+=`<section class="panel"><h3>Achievements <small>${P.ach.length}/${Object.keys(ACHIEVEMENTS).length}</small></h3><div class="achs">${Object.entries(ACHIEVEMENTS).map(([id,A])=>`<div class="ach ${P.ach.includes(id)?'got':''}" title="${E(A.d)}"><b>${E(A.n)}</b><small>${E(A.d)}</small></div>`).join('')}</div></section>`;
  h+=`<section class="panel"><h3>Record</h3><div class="derived">${[['Monsters slain',P.stats.kills],['Dungeons cleared',P.stats.dungeons],['Bosses',P.stats.bosses],['World bosses',P.stats.worldBoss],['PvP',`${P.pvp.w}W/${P.pvp.l}L (${P.pvp.r})`],['Quests',P.stats.quests||0],['Crafted',P.stats.crafted],['Explored',`${P.explored.length}/${Object.keys(LOCS).length}`],['Deaths',P.stats.deaths]].map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div></section>`;
  return h;}
Object.assign(ACT,{alloc(k){allocate(k);},compact(id){S.P.activeComp=id;},comprel(id){S.P.comps=S.P.comps.filter(c=>c.id!==id);if(S.P.activeComp===id)S.P.activeComp=S.P.comps[0]?S.P.comps[0].id:null;}});

function renderBag(){const P=S.P;let h=`<section class="panel"><h3>Equipped</h3><div class="slots">${EQUIP_SLOTS.map(sl=>{const it=P.equip[sl];return `<div class="slot"><span>${U.cap(sl)}</span>${it?`<button class="itm" data-a="iteminfo" data-v="e:${sl}">${rarityName(it)}<small>Lv.${it.l}</small></button>`:'<em>empty</em>'}</div>`;}).join('')}</div></section>`;
  const sort=UI.bagSort||'type';const items=P.inv.map((it,i)=>[it,i]);
  h+=`<section class="panel"><h3>Bag <small>${P.inv.length}/60 · ${U.fmt(P.gold)} gold</small></h3><div class="list">${items.map(([it,i])=>{const g=isGear(it);const d=itemDef(it);const usable=!g&&d&&(d.t==='con'||d.t==='food'||d.t==='tome');
    return `<div class="li"><span>${g?`<button class="itm" data-a="iteminfo" data-v="i:${i}">${rarityName(it)}<small> Lv.${it.l} · ${E(itemDesc(it))}</small></button>`:`${E(d?d.n:it.k)}${it.q>1?' ×'+it.q:''} <small>${E(itemDesc(it))}</small>`}</span>
      ${g?btn('Equip','equip',i,'tiny'):''}${usable?btn('Use','use',i,'tiny'):''}${hasSvc(P.loc,'market')?btn('Auction','listask',i,'tiny ghost'):''}${btn('Drop','drop',i,'tiny ghost')}</div>`;}).join('')||'<p class="hint">Your bag is empty.</p>'}</div></section>`;
  return h;}
function itemInfo(v){const P=S.P;const [k,x]=v.split(':');const it=k==='e'?P.equip[x]:k==='s'?smithStock(P.loc)[+x]:P.inv[+x];if(!it)return '';return itemInfoFor(it,k,x);}
function itemInfoFor(it,k,x){const P=S.P;const b=ITEM_BASES[it.b];const cur=P.equip[b.sl];
  const s=itemStats(it),c=cur&&cur!==it?itemStats(cur):null;const cmp=(n,a,bv)=>c?`<span class="${a>bv?'good':a<bv?'bad':''}">${n} ${Math.round(a)} (${a>=bv?'+':''}${Math.round(a-bv)})</span>`:`${n} ${Math.round(a)}`;
  return `<h2>${rarityName(it)}</h2><p>${RARITY[it.r].n} · item level ${it.l} · ${U.cap(b.sl)}${b.two?' · two-handed':''}${it.crafter?` · crafted by ${E(it.crafter)}`:''}</p>
  <p>${[s.atk>0.5&&cmp('Attack',s.atk,c?c.atk:0),s.matk>0.5&&cmp('Magic',s.matk,c?c.matk:0),s.def>0.5&&cmp('Defense',s.def,c?c.def:0),s.mdef>0.5&&cmp('M.Def',s.mdef,c?c.mdef:0)].filter(Boolean).join(' · ')}</p>
  <p>${E(itemDesc(it))}</p>${it.u?`<p class="lore">${E(UNIQUES[it.u].lore)}</p>`:''}${it.set?setInfo(it.set):''}${it.ench?`<p class="good">Enchanted: ${AFFIXES[it.ench].n}</p>`:''}
  <p class="hint">Value ≈ ${U.fmt(itemValue(it))}g · Proficiency ${Math.round(proficiency(P,it)*100)}%</p>
  <div class="row">${k==='i'?btn('Equip','equip',x,'gilt'):''}${k==='e'?btn('Unequip','unequip',x):''}</div>`;}
function setInfo(id){const SD=SETS[id];const have=(stats(S.P).sets||{})[id]||0;const fmtB=B=>Object.entries(B).map(([k,v])=>k.startsWith('res_')?`${U.cap(k.slice(4))} resistance +${v}%`:['crit','eva','spd'].includes(k)?`${({crit:'Critical',eva:'Evasion',spd:'Speed'})[k]} +${v}`:k==='critDmg'?`Crit damage +${v}%`:`${({pdef:'Phys. defense',mdef:'Magic defense',patk:'Phys. attack',matk:'Magic attack',mhp:'Max HP',mmp:'Max MP'})[k]||k} +${Math.round(v*100)}%`).join(', ');
  return `<div class="setbox"><b>${E(SD.n)} set</b> <small>(${have}/4 equipped · ${SD.ac})</small><p class="${have>=2?'good':'hint'}">(2) ${E(fmtB(SD.two))}</p><p class="${have>=4?'good':'hint'}">(4) ${E(fmtB(SD.four))}</p><p class="hint">Found in: ${E(SD.src)}</p></div>`;}
Object.assign(ACT,{iteminfo(v){openModal(itemInfo(v),'item');},equip(i){equip(+i);closeModal();},unequip(sl){unequip(sl);closeModal();},use(i){useItem(+i);},
  drop(i){const it=S.P.inv[+i];if(UI.confirmDrop!==i){UI.confirmDrop=i;UI.toast('Tap Drop again to destroy '+itemName(it));return;}S.P.inv.splice(+i,1);UI.confirmDrop=null;log(`Dropped ${itemName(it)}.`);},
  listask(i){const it=S.P.inv[+i];const v=isGear(it)?itemValue(it):ITEMS[it.k].v*(it.q||1);openModal(`<h2>List on the Auction House</h2><p>${rarityName(it)}${it.q>1?' ×'+it.q:''}. Estimated value ≈ ${U.fmt(v)}g. Fee: 2% now, 5% on sale.</p>
    <form data-form="list" class="row wrap"><input type="hidden" name="i" value="${i}"><label for="lprice">Price (gold)</label><input id="lprice" name="price" type="number" min="1" value="${Math.round(v*1.2)}" required><button class="b gilt">List item</button></form>`,'list');},
  form_list(fd){const P=S.P,i=+fd.i,price=Math.max(1,Math.floor(+fd.price));const it=P.inv[i];if(!it)return;const fee=Math.max(1,Math.round(price*0.02));if(P.gold<fee)return UI.toast('Not enough gold for the fee','bad');P.gold-=fee;P.inv.splice(i,1);
    S.market.push({id:U.uid(),item:it,price,seller:'P',t:S.time});log(`Listed ${itemName(it)} for ${U.fmt(price)}g.`);closeModal();}});

function renderQuests(){const P=S.P;const st=STORY[P.story];const fc=Object.keys(P.fchains||{}).filter(f=>P.fchains[f]<FACTION_CHAINS[f].steps.length);
  let h=`<section class="panel story"><h3>Main story</h3>${st?`<p><b>${E(st.n)}</b></p><p>${E(st.step)}</p><p class="hint">Location: ${E(LOCS[st.loc].n)}${st.need?` · Requires ${ITEMS[st.need].n}`:''}</p>`:'<p class="good">You silenced the Shattered One. The Realms go on, and so does your story.</p>'}</section>`;
  if(fc.length)h+=`<section class="panel"><h3>${icon('castle')} Faction quests</h3><div class="list">${fc.map(f=>{const s=factionStep(f);return `<div class="li q"><span><b>${E(FACTION_CHAINS[f].n)}</b> <small>step ${P.fchains[f]+1}/${FACTION_CHAINS[f].steps.length}</small><br><small>${E(s.n)}: ${E(s.d)} · ${E(LOCS[s.loc].n)}${s.type==='kill'?` (${P.fprog[f]||0}/${s.qty})`:s.type==='gather'?` (${invCount(P,s.item)}/${s.qty})`:''}</small></span></div>`;}).join('')}</div></section>`;
  h+=`<section class="panel"><h3>Quest log <small>${P.quests.length}/10</small></h3><div class="list">${P.quests.map((q,i)=>`<div class="li q"><span><b>${E(q.n)}</b> ${q.done?'<span class="good">Ready</span>':`<small>${q.prog}/${q.qty}</small>`}<br><small>${E(q.d)} · Turn in: ${E(LOCS[q.giver].n)} · ${U.fmt(q.xp)} XP, ${U.fmt(q.gold)}g</small></span>${q.done&&q.giver===P.loc?btn('Turn in','qturn',i,'tiny gilt'):''}${btn('Abandon','qabandon',i,'tiny ghost')}</div>`).join('')||'<p class="hint">No active quests. Visit a town\'s Quest Board.</p>'}</div></section>`;
  return h;}

/* ---------------- chat panel ---------------- */
function chatLine(m){const from=m.from==='SYS'?'':m.real?`<a class="ulink real" data-a="rprofile" data-v="${E(m.from.slice(2))}" title="Real player">${E(m.name)}<sup>●</sup></a>`:userLink(m.from);
  const tag=m.ch==='pm'?(m.from==='P'?`<span class="cht pm">To ${m.with.startsWith('R:')?E((NET.players[m.with.slice(2)]||{}).user||'player'):E((npc(m.with)||{}).user||'?')}</span>`:'<span class="cht pm">PM</span>'):`<span class="cht ${m.ch}">${CHANNELS[m.ch]||m.ch}</span>`;
  const txt=E(m.text).replace(/@([\w\-]+)/g,(x,u)=>`<b class="${S.P&&u.toLowerCase()===S.P.user.toLowerCase()?'mention':''}">@${u}</b>`);
  if(m.from==='SYS')return `<p class="cl system">${tag}${txt}</p>`;
  return `<div class="cl ${m.ch} ${m.from==='P'?'mine':''}">${avatar(m_name(m),m_cls(m),m.real)}<p><span class="who">${from}${tag}</span>${txt}</p></div>`;}
function chatMessages(){const ch=UI.chatCh;let ms=[];
  if(ch==='pm'&&UI.pmWith)ms=S.chat.pm[UI.pmWith]||[];
  else if(ch==='all'){for(const k of ['global','local','trade','recruit','guild','party','system'])ms=ms.concat(S.chat[k]||[]);ms.sort((a,b)=>a.t-b.t);ms=ms.slice(-120);}
  else ms=(S.chat[ch]||[]).slice(-120);return ms;}
function renderChat(full){const ch=UI.chatCh;const pmKeys=Object.keys(S.chat.pm).sort((a,b)=>{const la=S.chat.pm[a],lb=S.chat.pm[b];return (lb[lb.length-1]||{t:0}).t-(la[la.length-1]||{t:0}).t;});
  const tabs=['all','global','local','trade','recruit','guild','party','system','pm'];
  let h=`<div class="chat ${full?'full':''}"><div class="chtabs">${tabs.map(t=>`<button class="ct ${ch===t?'on':''}" data-a="chch" data-v="${t}">${t==='all'?'All':t==='pm'?'Whispers':CHANNELS[t]}${t==='pm'&&Object.values(S.pmUnread).reduce((a,b)=>a+b,0)?`<em>${Object.values(S.pmUnread).reduce((a,b)=>a+b,0)}</em>`:''}</button>`).join('')}</div>`;
  if(ch==='pm')h+=`<div class="pmlist">${pmKeys.map(k=>{const nm=k.startsWith('R:')?((NET.players[k.slice(2)]||{}).user||'player')+'●':(npc(k)||{}).user;return `<button class="ct ${UI.pmWith===k?'on':''}" data-a="pmwith" data-v="${k}">${E(nm)}${S.pmUnread[k]?`<em>${S.pmUnread[k]}</em>`:''}</button>`;}).join('')||'<small class="hint">No whispers yet. Open someone\'s profile and press Whisper.</small>'}</div>`;
  h+=`<div class="chatlog" id="chatlog" aria-live="polite">${chatMessages().map(chatLine).join('')}</div>`;
  const sendCh=ch==='all'||ch==='system'?'global':ch;
  h+=`<form class="chatin" data-form="chat"><label class="sr" for="chatmsg">Message</label><select name="ch" aria-label="Channel" id="chatsel">${['global','local','trade','recruit','guild','party'].map(c=>`<option value="${c}" ${c===(ch==='pm'?'':sendCh)?'selected':''}>${CHANNELS[c]}</option>`).join('')}${ch==='pm'&&UI.pmWith?'<option value="pm" selected>Whisper</option>':''}</select>
    <input id="chatmsg" name="msg" maxlength="220" placeholder="${ch==='pm'&&UI.pmWith?'Whisper…':'Say something… (@name to mention, /help)'}" autocomplete="off"><button class="b">Send</button></form>
    <p class="hint tiny">${onlineNpcs().length} simulated adventurers online${NET.mode==='online'?` · ${NET.peers} real player${NET.peers===1?'':'s'} online, marked <sup class="realdot">●</sup>`:' · solo mode: chat is with simulated adventurers'}</p></div>`;
  return h;}
Object.assign(ACT,{chch(v){UI.chatCh=v;if(v==='pm'&&!UI.pmWith){UI.pmWith=Object.keys(S.chat.pm)[0]||null;}if(UI.pmWith)delete S.pmUnread[UI.pmWith];},pmwith(k){UI.pmWith=k;delete S.pmUnread[k];},
  form_chat(fd,f){const text=(fd.msg||'').trim();if(!text)return;const ch=fd.ch;
    if(ch==='pm'&&UI.pmWith){if(UI.pmWith.startsWith('R:')){chatPush('pm','P',text,{with:UI.pmWith});netSendChat('pm',text,UI.pmWith.slice(2));}else playerChat('pm',text,UI.pmWith);}
    else{playerChat(ch,text);if(['global','trade','recruit','local'].includes(ch)&&!text.startsWith('/'))netSendChat(ch,text);}
    f.reset();setTimeout(()=>{const i=document.getElementById('chatmsg');if(i)i.focus();},0);UI.chatDirty=true;}});
UI.openPM=(id)=>{UI.chatCh='pm';UI.pmWith=id;delete S.pmUnread[id];if(window.innerWidth<1000)UI.tab='chat';};

/* ---------------- profile ---------------- */
function profileView(id){const n=npc(id);if(!n)return '';const P=S.P;const st=stats(n);const g=guild(n.guild);const m=n.mem.P;const on=online(n);
  return `<div class="phead">${avatar(n.user,n.cls)}<div><h2>${E(n.user)} <small>${on?'<span class="good">● online</span>':'<span class="hint">offline</span>'}</small></h2><p class="hint">Simulated adventurer · ${E(n.name)}</p></div></div>
  <p><b>Lv.${n.level} ${E(className(n))}</b> · ${RACES[n.race].name}${g?` · ${E(g.name)} [${E(g.tag)}] ${n.grank}`:''}</p>
  <p>Personality: ${traitsLabel(n).join(', ')} · Currently ${on?E(n.act):'offline'} in ${E(LOCS[n.loc].n)}</p>
  <div class="derived">${[['Fame',U.fmt(n.fame)],['Power',U.fmt(st.power)],['Gear',st.gs],['PvP',`${n.pvp.r} (${n.pvp.w}W/${n.pvp.l}L)`],['Kills',U.fmt(n.kills)],['Dungeons',n.dung],['Bosses',n.boss],['Profession',`${MASTERY[n.prof].n} ${n.mastery[n.prof]||0}`]].map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
  <details><summary>Equipment</summary><div class="list">${EQUIP_SLOTS.filter(s=>n.equip[s]).map(s=>`<div class="li"><span>${U.cap(s)}: ${rarityName(n.equip[s])} <small>Lv.${n.equip[s].l}</small></span></div>`).join('')}</div></details>
  <details><summary>History</summary><div class="log">${n.hist.map(([t,x])=>`<p><time>${T.str(t).replace('Day ','D')}</time> ${E(x)}</p>`).join('')}</div></details>
  ${m?`<details open><summary>Your history together (affinity ${Math.round(m.aff)})</summary><div class="log">${m.notes.map(([t,x])=>`<p><time>${T.str(t).replace('Day ','D')}</time> ${E(x)}</p>`).join('')||'<p>You have met before.</p>'}</div></details>`:''}
  <p class="hint">Goal: ${E(goalText(n.goal||{type:'level'}))} · Friends: ${n.friends.length} · Rivals: ${n.rivals.map(r=>r==='P'?'you':(npc(r)||{}).user).filter(Boolean).slice(0,3).join(', ')||'none'}</p>
  <div class="grid-btn">${btn('Whisper','pmopen',n.id)}${P.party.includes(n.id)?btn('Remove from party','kick',n.id):btn('Invite to party','invite',n.id,'gilt')}${btn('Duel','duelask',n.id,'danger')}
   ${P.friends.includes(n.id)?btn('Unfriend','unfriend',n.id,'ghost'):btn('Add friend','friend',n.id)}${btn('Trade','trade',n.id)}
   ${g&&!P.guild&&!g.isPlayer?btn(`Apply to ${E(g.tag)}`,'gapply',g.id):''}${P.guild&&guild(P.guild).isPlayer&&n.guild!==P.guild?btn('Recruit to guild','grecruit',n.id):''}
   ${P.blocked.includes(n.id)?btn('Unblock','unblock',n.id,'ghost'):btn('Block','block',n.id,'ghost')}</div>`;}
function rprofileView(id){const p=realPlayer(id);if(!p)return '<p>This player is not around right now.</p>';const live=p.live;const me=id===NET.myKey;const cp=NET.live.coop;
  const coopState=cp.with===id?(live&&live.coop.with===NET.myKey?'active':'waiting'):live&&live.coop.inv===NET.myKey?'invited':cp.inv===id?'sent':'none';
  return `<div class="phead">${avatar(p.user,p.cls,1)}<div><h2>${E(p.user)} <sup class="realdot">●</sup></h2><p class="hint">Real player · ${live?'<span class="good">online now</span>':'last seen '+new Date(p.t).toLocaleString()}</p></div></div>
  <p><b>Lv.${p.level} ${E(p.adv&&ADV_CLASSES[p.adv]?ADV_CLASSES[p.adv].name:CLASSES[p.cls]?CLASSES[p.cls].name:'')}</b> · ${RACES[p.race]?RACES[p.race].name:''}${p.guild?' · '+E(p.guild):''} · in ${E(LOCS[p.loc]?LOCS[p.loc].n:'?')}</p>
  <div class="derived">${[['Fame',U.fmt(p.fame||0)],['Power',U.fmt(p.power||0)],['PvP',`${p.pvp?p.pvp.r:1000}`],['Kills',U.fmt(p.kills||0)],['Dungeons',p.dungeons||0],['Achievements',p.ach||0]].map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
  ${me?'<p>This is you.</p>':`${live?`<div class="coop ${coopState}"><h3>${icon('party')} Adventure together</h3><p>${({active:`You're in co-op. When you're both in the same place, ${E(p.user)}'s hero joins your fights (and yours joins theirs). You both earn XP and gold.`,waiting:`Waiting for ${E(p.user)} to accept.`,invited:`${E(p.user)} wants to adventure with you.`,sent:`Invite sent. Waiting for ${E(p.user)}.`,none:`Team up: while you're both online and in the same place, each of your heroes fights in the other's battles.`})[coopState]}</p>
    <div class="row">${coopState==='active'||coopState==='waiting'?btn('End co-op','coopend','','ghost'):btn(coopState==='invited'?'Accept':'Invite to co-op','coopinv',id,'gilt')}${coopState==='active'&&p.loc!==S.P.loc?btn(`Find them in ${E(LOCS[p.loc].n)}`,'mapfocus',p.loc):''}</div></div>`:''}
  <div class="grid-btn">${btn('Whisper','rpm',id)}${btn('Duel their champion','rduel',id,'danger')}${NET.canWrite&&NET.players[id]?btn('Send a parcel','mailask',id):''}${btn(NET.muted.includes(id)?'Unmute':'Mute','rmute',id,'ghost')}</div>
  <p class="hint">Whispers to real players travel through the shared room, so others could technically see them. Don't share anything private.</p>`}`;}
Object.assign(ACT,{profile(id){openModal(profileView(id),'prof:'+id);},rprofile(id){openModal(rprofileView(id),'rprof');},pmopen(id){closeModal();UI.openPM(id);},
  coopinv(id){coopInvite(id);openModal(rprofileView(id),'rprof');},coopend(){coopEnd();closeModal();},
  rpm(id){closeModal();const k='R:'+id;S.chat.pm[k]=S.chat.pm[k]||[];UI.openPM(k);},rmute(id){NET.muted.includes(id)?NET.muted=NET.muted.filter(x=>x!==id):NET.muted.push(id);openModal(rprofileView(id),'rprof');},
  invite(id){invite(npc(id));refreshModal();},kick(id){leaveParty(npc(id),null);refreshModal();},friend(id){friendRequest(npc(id));refreshModal();},unfriend(id){S.P.friends=S.P.friends.filter(x=>x!==id);refreshModal();},
  block(id){S.P.blocked.push(id);refreshModal();},unblock(id){S.P.blocked=S.P.blocked.filter(x=>x!==id);refreshModal();},
  gapply(id){applyGuild(guild(id));closeModal();},grecruit(id){guildRecruit(npc(id));refreshModal();},
  trade(id){openModal(tradeView(id),'trade');},
  tbuy(v){const [id,i]=v.split('|');const n=npc(id);const it=n.inv[+i];if(!it)return;openModal(`<h2>Make an offer</h2><p>${E(n.user)} is asking about <b>${U.fmt(npcAsk(n,it))}g</b> for ${rarityName(it)}.</p><form data-form="offer" class="row wrap"><input type="hidden" name="v" value="${id}|${i}"><label for="offer">Your offer</label><input id="offer" type="number" name="offer" min="1" value="${Math.round(npcAsk(n,it)*0.9)}"><button class="b gilt">Offer</button></form>`,'offer');},
  form_offer(fd){const [id,i]=fd.v.split('|');offerBuy(npc(id),+i,Math.floor(+fd.offer));openModal(tradeView(id),'trade');},
  tsell(v){const [id,i]=v.split('|');offerSell(npc(id),+i);openModal(tradeView(id),'trade');},
  mailask(id){const P=S.P;openModal(`<h2>Courier parcel to ${E(NET.players[id].user)}</h2><p class="hint">Courier Tamsin delivers gold and one item between real adventurers.</p><form data-form="mail" class="col"><input type="hidden" name="to" value="${id}"><label for="mg">Gold</label><input id="mg" name="gold" type="number" min="0" max="${Math.floor(P.gold)}" value="0">
    <label for="mi">Item</label><select id="mi" name="item"><option value="-1">None</option>${P.inv.map((it,i)=>`<option value="${i}">${E(itemName(it))}</option>`).join('')}</select><label for="mn">Note</label><input id="mn" name="note" maxlength="80"><button class="b gilt">Send parcel</button></form>`,'mail');},
  form_mail(fd){sendMail(fd.to,+fd.gold,+fd.item,fd.note).then(()=>UI.refresh());closeModal();}});
function tradeView(id){const n=npc(id),P=S.P;if(!online(n))return `<h2>Trade</h2><p>${E(n.user)} is offline.</p>`;
  return `<h2>Trade with ${E(n.user)}</h2><p class="hint">Simulated adventurers haggle based on personality (${traitsLabel(n).join(', ')}) and how much they like you.</p><h3>Their goods</h3><div class="list">${n.inv.map((it,i)=>`<div class="li"><span>${rarityName(it)}${it.q>1?' ×'+it.q:''}</span><span class="gold">~${U.fmt(npcAsk(n,it))}g</span>${btn('Offer','tbuy',`${id}|${i}`,'tiny')}</div>`).join('')||'<p class="hint">Nothing for sale.</p>'}</div>
  <h3>Sell to them</h3><div class="list">${P.inv.map((it,i)=>isGear(it)?`<div class="li"><span>${rarityName(it)} <small>Lv.${it.l}</small></span>${btn('Offer','tsell',`${id}|${i}`,'tiny')}</div>`:'').join('')||'<p class="hint">You have no gear to sell.</p>'}</div>`;}

/* ---------------- party & guild ---------------- */
function renderSocial(){const P=S.P;const pm=partyMembers();const cp=coopPartner();
  let h=`<section class="panel"><h3>Party <small>${1+pm.length}/4</small></h3><div class="list"><div class="li"><span><b>${E(P.user)}</b> (you) <small>Lv.${P.level} ${E(className(P))} · ${CLASSES[P.cls].role}</small></span></div>
  ${cp&&cp.loc===P.loc?`<div class="li"><span>${avatar(cp.user,cp.cls,1)} <b>${E(cp.user)}</b><sup class="realdot">●</sup> <small>Lv.${cp.lvl} ${E(CLASSES[cp.cls].name)} · co-op partner</small></span></div>`:''}
  ${pm.map(n=>`<div class="li"><span>${avatar(n.user,n.cls)} ${userLink(n.id)} <small>Lv.${n.level} ${E(className(n))} · ${CLASSES[n.cls].role} · ${Math.round(n.hpPct*100)}% HP</small></span>${btn('Remove','kick',n.id,'tiny ghost')}</div>`).join('')}</div>
  <p class="hint">Find groups in Global or Recruit chat (“anyone want to help me clear the abandoned mine?”), or invite people from their profile. Members fight on their own and share XP and loot.</p>
  <div class="row wrap"><span>Tactic:</span>${['free','focus','defensive'].map(t=>btn(U.cap(t),'settactic',t,P.tactic===t?'gilt tiny':'tiny ghost')).join('')}<span>Row:</span>${btn(P.row==='front'?'Front':'Back','setrow','','tiny')}</div></section>`;
  const peers=Object.values(NET.peerMap);
  h+=`<section class="panel realp"><h3>${icon('online')} Real players online <small>${peers.length}</small></h3>${cp?`<p class="good">Co-op with ${E(cp.user)}${cp.loc===P.loc?' — fighting together here.':` — they're in ${E(LOCS[cp.loc].n)}. Meet up to fight together.`}</p>`:''}
    <div class="people">${peers.map(p=>`<button class="person real" data-a="rprofile" data-v="${E(p.key)}">${avatar(p.user,p.cls,1)}<span><b>${E(p.user)}<sup>●</sup></b><small>Lv.${p.lvl} ${E(CLASSES[p.cls].name)} · ${E(LOCS[p.loc].n)}${p.coop.inv===NET.myKey?' · invites you!':''}</small></span></button>`).join('')||`<p class="hint">${NET.mode==='online'?'No other real players have the game open right now. Share the link with friends and play at the same time to chat and team up.':'Open the game from its claude.ai link to see and play with friends.'}</p>`}</div></section>`;
  const fr=P.friends.map(npc).filter(Boolean);h+=`<section class="panel"><h3>Friends <small>${fr.filter(online).length} online</small></h3><div class="people">${fr.map(n=>`<button class="person" data-a="profile" data-v="${n.id}"><b>${E(n.user)}</b><small>${online(n)?'● ':'○ '}Lv.${n.level} · ${E(LOCS[n.loc].n)}</small></button>`).join('')||'<p class="hint">No friends yet.</p>'}</div></section>`;
  const g=guild(P.guild);
  if(g){const lead=g.leader==='P',off=g.officers.includes('P');h+=`<section class="panel"><h3>${E(g.name)} [${E(g.tag)}] <small>Lv ${g.lvl} · ${g.members.length} members</small></h3><p>“${E(g.motto)}” · HQ ${E(LOCS[g.hq].n)} · Treasury ${U.fmt(g.treasury)}g · Morale ${Math.round(g.morale*100)}% · Power ${U.fmt(guildPower(g))}</p>
    <p class="hint">Allies: ${g.allies.map(x=>(guild(x)||{}).name).filter(Boolean).join(', ')||'none'} · Rivals: ${g.rivals.map(x=>(guild(x)||{}).name).filter(Boolean).join(', ')||'none'}</p>
    ${g.isPlayer?`<div class="row wrap">${btn('Deposit 100g','gdep','100','tiny')}${btn('Deposit 1000g','gdep','1000','tiny')}${lead?btn('Withdraw 100g','gwd','100','tiny ghost'):''}${lead||off?btn('Organize guild event','gevent','','tiny gilt'):''}${lead?btn('Pep talk (+morale)','gpep','','tiny'):''}</div>`:''}
    <div class="list">${g.members.map(id=>{const m=id==='P'?P:npc(id);if(!m)return '';const rank=g.leader===id?'Leader':g.officers.includes(id)?'Officer':'Member';
      return `<div class="li"><span>${userLink(id)} <small>${rank} · Lv.${m.level} ${E(className(m))}${id!=='P'?(online(m)?' · ●':' · ○'):''}</small></span>${g.isPlayer&&lead&&id!=='P'?(rank==='Officer'?btn('Demote','gdemote',id,'tiny ghost'):btn('Promote','gpromote',id,'tiny ghost'))+btn('Kick','gkick',id,'tiny ghost'):''}</div>`;}).join('')}</div>
    ${btn('Leave guild','gleave','','ghost')}</section>`;}
  else h+=`<section class="panel"><h3>Guild</h3><p>You are not in a guild. Visit a Guild Hall to browse guilds or found your own (1,000g), or answer recruiters in chat.</p>${btn('Browse guilds','guildlist')}</section>`;
  return h;}
Object.assign(ACT,{settactic(t){S.P.tactic=t;},setrow(){S.P.row=S.P.row==='front'?'back':'front';},
  gdep(v){const g=guild(S.P.guild);const a=Math.min(+v,Math.floor(S.P.gold));if(a<=0)return;S.P.gold-=a;g.treasury+=a;g.morale=Math.min(1,g.morale+a/20000);log(`Deposited ${a}g into the guild treasury.`);},
  gwd(v){const g=guild(S.P.guild);const a=Math.min(+v,g.treasury);g.treasury-=a;S.P.gold+=a;g.morale=Math.max(0.1,g.morale-0.03);},
  gpep(){const g=guild(S.P.guild);g.morale=Math.min(1,g.morale+0.08);const m=g.members.map(npc).find(x=>x&&online(x));if(m)say(m,'guild',U.pick(['let\'s gooo','inspiring 🫡','ok boss','we got this']),1500);log('You rally your guild.');},
  gpromote(id){const g=guild(S.P.guild);if(!g.officers.includes(id))g.officers.push(id);npc(id).grank='Officer';remember(npc(id),'Promoted me to officer',8);say(npc(id),'guild','thanks for the promotion!',1500);},
  gdemote(id){const g=guild(S.P.guild);g.officers=g.officers.filter(x=>x!==id);npc(id).grank='Member';remember(npc(id),'Demoted me',-10);},
  gkick(id){const n=npc(id);leaveGuild(n);remember(n,'Kicked me from the guild',-30);log(`${n.user} was removed from the guild.`);},
  gleave(){leavePlayerGuild();},guildlist(){openModal(guildHallView(),'guilds');},
  guildview(id){const g=guild(id);openModal(`<h2>${E(g.name)} [${E(g.tag)}]</h2><p>“${E(g.motto)}” · Lv ${g.lvl} · HQ ${E(LOCS[g.hq].n)} · Goal: ${g.goal} · Requires Lv ${g.req}</p><p>Leader ${userLink(g.leader)} · Power ${U.fmt(guildPower(g))} · Reputation ${g.rep}</p>
    <p class="hint">Allies: ${g.allies.map(x=>(guild(x)||{}).name).filter(Boolean).join(', ')||'none'} · Rivals: ${g.rivals.map(x=>(guild(x)||{}).name).filter(Boolean).join(', ')||'none'}</p><div class="people">${g.members.slice(0,40).map(id=>id==='P'?'':`<button class="person" data-a="profile" data-v="${id}"><b>${E(npc(id).user)}</b><small>Lv.${npc(id).level} ${E(npc(id).grank||'')}</small></button>`).join('')}</div>${!S.P.guild&&!g.isPlayer?btn('Apply','gapply',id,'gilt'):''}`,'gview');},
  gevent(){const P=S.P,g=guild(P.guild);const on=g.members.filter(x=>x!=='P').map(npc).filter(n=>n&&online(n)&&!n.inParty).sort((a,b)=>affinity(b)-affinity(a));let joined=0;
    for(const n of on){if(P.party.length>=3)break;if(U.chance(0.55+affinity(n)/150+g.morale*0.2)){P.party.push(n.id);n.inParty=true;n.joined=S.time;n.loc=P.loc;joined++;say(n,'guild',U.pick(['omw!','I\'m in','coming','let\'s do it']),1500+joined*1000);}else say(n,'guild',U.pick(['busy sorry','next time','can\'t rn']),2500);}
    log(joined?`${joined} guildmates joined your party for a guild event.`:'Nobody could make it this time.',joined?'good':'bad');g.morale=Math.min(1,g.morale+joined*0.03);},
  form_found(fd){foundGuild(fd.gname.trim(),fd.gtag.trim());closeModal();UI.tab='social';}});

/* ---------------- leaderboards ---------------- */
const BOARDS={level:['Highest Level',a=>a.level*1e9+(a.xp||0)],power:['Combat Power',a=>stats(a).power],wealth:['Wealth',a=>a.gold],pvp:['PvP Rating',a=>a.pvp.r],dungeons:['Dungeon Clears',a=>a===S.P?a.stats.dungeons:a.dung],
  bosses:['Boss Kills',a=>a===S.P?a.stats.bosses:a.boss],crafting:['Crafting',a=>Math.max(...['smithing','alchemy','cooking','enchanting'].map(k=>mLv(a,k)))],explore:['Exploration',a=>a===S.P?a.explored.length:a.knows.length],
  ach:['Achievements',a=>a.ach.length],fame:['Reputation & Fame',a=>a.fame],guilds:['Guild Rankings',null]};
function renderRanks(){const k=UI.board||'level';const [title,f]=BOARDS[k];const real=UI.rankReal;
  let h=`<section class="panel"><h2>Leaderboards</h2><div class="chtabs">${Object.entries(BOARDS).map(([id,[n]])=>`<button class="ct ${k===id?'on':''}" data-a="board" data-v="${id}">${n}</button>`).join('')}</div>
   <div class="row">${btn('Simulated world','rankreal','0',!real?'tiny gilt':'tiny ghost')}${btn('Real players','rankreal','1',real?'tiny gilt':'tiny ghost')}</div>`;
  if(real){const keys=new Set([...Object.keys(NET.players),...Object.keys(NET.peerMap)]);if(NET.myKey&&S.P&&!NET.players[NET.myKey])keys.add('__me');
    const rows=[...keys].map(id=>({id,p:id==='__me'?{user:S.P.user,level:S.P.level,cls:S.P.cls,power:stats(S.P).power,gold:S.P.gold,pvp:S.P.pvp,dungeons:S.P.stats.dungeons,bosses:S.P.stats.bosses,explored:S.P.explored.length,ach:S.P.ach.length,fame:S.P.fame}:realPlayer(id)})).filter(r=>r.p).sort((a,b)=>{const m={level:x=>x.level,power:x=>x.power||0,wealth:x=>x.gold||0,pvp:x=>(x.pvp||{}).r||0,dungeons:x=>x.dungeons||0,bosses:x=>x.bosses||0,crafting:x=>x.craft||0,explore:x=>x.explored||0,ach:x=>x.ach||0,fame:x=>x.fame||0,guilds:x=>x.level}[k];return m(b.p)-m(a.p);});
    h+=NET.mode!=='online'?'<p class="hint">Real-player rankings need the shared world (open this game from its claude.ai link).</p>':`<ol class="board">${rows.map(({id,p},i)=>`<li class="${id===NET.uid||id==='__me'?'me':''}"><span class="rk">#${i+1}</span><a class="ulink real" data-a="rprofile" data-v="${id}">${E(p.user)}<sup>●</sup></a><small>Lv.${p.level} ${E(CLASSES[p.cls]?CLASSES[p.cls].name:'')}</small><b>${U.fmt({level:p.level,power:p.power,wealth:p.gold,pvp:(p.pvp||{}).r,dungeons:p.dungeons,bosses:p.bosses,crafting:p.craft,explore:p.explored,ach:p.ach,fame:p.fame,guilds:p.level}[k]||0)}</b></li>`).join('')||'<li>No real players have published a profile yet.</li>'}</ol>`;
    return h+'</section>';}
  if(k==='guilds'){const gs=S.guilds.map(g=>[g,guildPower(g)]).sort((a,b)=>b[1]-a[1]);h+=`<ol class="board">${gs.map(([g,p],i)=>`<li class="${g.id===S.P.guild?'me':''}"><span class="rk">#${i+1}</span><a data-a="guildview" data-v="${g.id}" class="ulink">${E(g.name)}</a><small>[${E(g.tag)}] Lv ${g.lvl} · ${g.members.length} members</small><b>${U.fmt(p)}</b></li>`).join('')}</ol>`;return h+'</section>';}
  const all=S.npcs.filter(n=>!n.retired).concat([S.P]);const scored=all.map(a=>[a,f(a)]).sort((x,y)=>y[1]-x[1]);const myRank=scored.findIndex(x=>x[0]===S.P)+1;
  const disp=a=>k==='level'?`Lv.${a.level}`:k==='wealth'?U.fmt(a.gold)+'g':k==='power'?U.fmt(stats(a).power):U.fmt(f(a));
  h+=`<ol class="board">${scored.slice(0,50).map(([a,v],i)=>`<li class="${a===S.P?'me':''}"><span class="rk">#${i+1}</span>${userLink(a===S.P?'P':a.id)}<small>Lv.${a.level} ${E(className(a))}${a.guild&&guild(a.guild)?' · '+E(guild(a.guild).tag):''}</small><b>${disp(a)}</b></li>`).join('')}</ol>
   <p class="me-rank">Your rank: <b>#${U.fmt(myRank)}</b> of ${U.fmt(scored.length)}</p></section>`;return h;}
Object.assign(ACT,{board(v){UI.board=v;},rankreal(v){UI.rankReal=v==='1';}});

/* ---------------- market ---------------- */
function marketView(inModal){const P=S.P;const at=hasSvc(P.loc,'market');const q=(UI.mq||'').toLowerCase();const ft=UI.mf||'all';
  let L=S.market.filter(x=>x.seller!=='P');if(q)L=L.filter(x=>itemName(x.item).toLowerCase().includes(q));if(ft!=='all')L=L.filter(x=>isGear(x.item)?(ft==='weapon'?ITEM_BASES[x.item.b].t==='weapon':ft==='armor'?ITEM_BASES[x.item.b].t!=='weapon':false):ft==='other');
  L.sort((a,b)=>UI.msort==='price'?a.price-b.price:(isGear(b.item)?b.item.l:0)-(isGear(a.item)?a.item.l:0));
  const mine=S.market.filter(x=>x.seller==='P');
  return `${at?'':'<p class="notice">You can browse from anywhere, but buying and selling needs an Auction House (Valeria, Saltmere, Crossroads and other markets).</p>'}
  <form data-form="mfilter" class="row wrap"><label class="sr" for="mq">Search</label><input id="mq" name="q" value="${E(UI.mq||'')}" placeholder="Search items"><select name="f" aria-label="Filter">${['all','weapon','armor','other'].map(f=>`<option ${ft===f?'selected':''}>${f}</option>`).join('')}</select><select name="s" aria-label="Sort"><option value="level">Level</option><option value="price" ${UI.msort==='price'?'selected':''}>Price</option></select><button class="b tiny">Filter</button></form>
  <div class="list">${L.slice(0,60).map(x=>`<div class="li"><span>${rarityName(x.item)}${x.item.q>1?' ×'+x.item.q:''} <small>${isGear(x.item)?'Lv.'+x.item.l+' · ':''}${E(itemDesc(x.item))} · seller ${x.seller.startsWith('n')?userLink(x.seller):'traveling merchant'}</small></span><span class="gold">${U.fmt(x.price)}g</span>${at?btn('Buy','mbuy',x.id,'tiny'):''}</div>`).join('')||'<p class="hint">No listings match.</p>'}</div>
  <h3>Your listings</h3><div class="list">${mine.map(x=>`<div class="li"><span>${rarityName(x.item)}</span><span class="gold">${U.fmt(x.price)}g</span>${btn('Cancel','mcancel',x.id,'tiny ghost')}</div>`).join('')||'<p class="hint">List items from your Bag while at an Auction House.</p>'}</div>`;}
function renderMarket(){return `<section class="panel"><h2>Auction House</h2>${marketView()}</section>`;}
Object.assign(ACT,{form_mfilter(fd){UI.mq=fd.q;UI.mf=fd.f;UI.msort=fd.s;if(UI.modalKey==='svc:market')refreshModal();},
  mbuy(id){const L=S.market.find(x=>x.id===id);if(!L)return;if(S.P.gold<L.price)return UI.toast('Not enough gold','bad');buyListing('P',L);log(`Bought ${itemName(L.item)} for ${U.fmt(L.price)}g at auction.`,'good');gainMastery('trading',3);refreshModal();},
  mcancel(id){const i=S.market.findIndex(x=>x.id===id);if(i<0)return;const L=S.market.splice(i,1)[0];invAdd(S.P,isGear(L.item)?L.item:L.item.k,L.item.q||1);refreshModal();}});
// NPC buyers for player listings
BUS.on(t=>{if(t!=='hour'||!S.P)return;for(const L of S.market.filter(x=>x.seller==='P')){if(!isGear(L.item)){if(U.chance(L.price<=ITEMS[L.item.k].v*(L.item.q||1)*1.4?0.15:0.02)){const b=U.pick(onlineNpcs(n=>n.gold>L.price));if(b)buyListing(b,L);}continue;}
  const fair=itemValue(L.item);const p=L.price<=fair*0.9?0.35:L.price<=fair*1.2?0.12:L.price<=fair*1.6?0.03:0.003;if(U.chance(p)){const b=U.pick(onlineNpcs(n=>n.gold>L.price&&Math.abs(n.level-L.item.l)<10));if(b)buyListing(b,L);}}});

/* ---------------- codex ---------------- */
function renderCodex(){const P=S.P;const cats={};for(const id of P.codex){const l=LORE[id];(cats[l.cat]=cats[l.cat]||[]).push([id,l]);}
  let h=`<section class="panel"><h2>Codex <small>${P.codex.length}/${Object.keys(LORE).length} discovered</small></h2>${Object.entries(cats).map(([c,ls])=>`<h3>${c}</h3>${ls.map(([id,l])=>`<details><summary>${E(l.t)}</summary><p class="lore">${E(l.x)}</p></details>`).join('')}`).join('')||'<p class="hint">Read books in libraries, examine ruins and talk to people to uncover the world\'s history.</p>'}</section>`;
  h+=`<section class="panel"><h3>Kingdoms & politics</h3>${S.wars.length?`<p class="bad">At war: ${S.wars.map(w=>`${E(FACTIONS[w.a].n)} vs ${E(FACTIONS[w.b].n)} (front: ${E(LOCS[w.front].n)}, day ${w.days})`).join('; ')}</p>`:'<p>The kingdoms are at peace, for now.</p>'}
   ${KINGDOMS.map(k=>{const F=FACTIONS[k];return `<details><summary>${E(F.n)} <small>${E(F.ruler)}</small></summary><p><b>Capital</b> ${E(LOCS[F.capital].n)} · <b>People</b> ${E(F.race)} · <b>Government</b> ${E(F.gov)}</p><p><b>Faith</b> ${E(F.religion)} · <b>Military</b> ${E(F.military)} · <b>Economy</b> ${E(F.economy)}</p><p><b>Culture</b> ${E(F.culture)}</p><p><b>Ambition</b> ${E(F.ambition)}</p><p class="lore">${E(F.history)}</p>
     <p class="hint">Relations: ${KINGDOMS.filter(o=>o!==k).map(o=>`${FACTIONS[o].n.split(' ').slice(-1)[0]} ${rel(k,o)}`).join(' · ')} · Army ${Math.round(S.kd[k].army)}</p></details>`;}).join('')}</section>`;
  h+=`<section class="panel"><h3>Realm news</h3><div class="log">${S.news.slice(0,40).map(([t,x,k])=>`<p class="n-${k}"><time>${T.str(t).replace('Day ','D')}</time> ${E(x)}</p>`).join('')}</div></section>`;
  if(S.hall.length)h+=`<section class="panel"><h3>Hall of the Fallen</h3><div class="list">${S.hall.map(f=>`<div class="li"><span>${E(f.user)} — Lv.${f.lvl} ${E(f.cls)}, fell at ${E(f.where)}</span></div>`).join('')}</div></section>`;
  return h;}

/* ---------------- menu ---------------- */
function renderMenu(){const st=NET.status;
  return `<section class="panel"><h2>Menu</h2><p>${E(st)}</p><div class="grid-btn">${btn('Save now','save','','gilt')}${btn('Export save','export')}${btn('Import save','importask')}${btn('How to play','help')}</div>
  <h3>Settings</h3><div class="list"><div class="li"><span>AI narration & smarter replies <small>${NET.sample?'Uses Claude for freeform actions and some direct conversations. Everything else is rule-based.':'Needs the claude.ai artifact runtime.'}</small></span>${NET.sample?btn(AI.enabled?'On':'Off','toggleai','',AI.enabled?'gilt tiny':'tiny ghost'):''}</div>
  <div class="li"><span>Chat activity <small>How often simulated adventurers talk</small></span>${['quiet','normal','busy'].map(x=>btn(U.cap(x),'chatrate',x,(UI.rate||'normal')===x?'tiny gilt':'tiny ghost')).join('')}</div>
  <div class="li"><span>Music <small>Generated live: calm in towns, tense in dungeons, drums in battle</small></span>${btn(AUD.on?'On':'Off','sound','',AUD.on?'tiny gilt':'tiny ghost')}<label class="vol">Music<input type="range" min="0" max="100" value="${Math.round(AUD.music*100)}" data-vol="m" aria-label="Music volume"></label><label class="vol">Effects<input type="range" min="0" max="100" value="${Math.round(AUD.sfx*100)}" data-vol="s" aria-label="Sound effects volume"></label></div>
  <div class="li"><span>Visual effects <small>Particles, weather, screen shake</small></span>${btn(FX.on?'Full':'Reduced','fxtoggle','',FX.on?'tiny gilt':'tiny ghost')}</div>
  <div class="li"><span>Theme</span>${['system','dark','light'].map(x=>btn(U.cap(x),'theme',x,(UI.theme||'system')===x?'tiny gilt':'tiny ghost')).join('')}</div></div>
  <h3>About this world</h3><p class="hint">The world keeps moving while nobody is playing: whenever anyone returns, the Realms fast-forward through every hour that passed (up to two weeks), and you get a summary of what happened.${NET.isHost?' Your game is the realm\'s host: it uploads the world every few minutes so friends load the same world.':S.worldFrom?` This world was last synced from ${E(S.worldFrom)}'s realm.`:''} Eternal Realms simulates ${S.npcs.length} autonomous adventurers. They level, trade, form parties and guilds, fight bosses and remember you. ${NET.mode==='online'?'Real players who open this same game link share global, trade and recruit chat, the real-player leaderboards, champion duels and courier parcels. The simulated world is shared too: the owner\'s game uploads it and everyone else picks it up when they open the game.':'Open the game from its claude.ai link to play with real people.'}</p>
  ${NET.backend==='supabase'&&NET.uid?`<h3>Account</h3><p class="hint">${NET.guest?'Playing as a guest. Your progress is tied to this device.':'Signed in as '+E(NET.email||'')}</p><div class="row">${btn('Sign out','signout')}${btn('Delete account','delacct','','danger')}</div>`:''}<h3>Danger zone</h3>${btn('Delete character & start over','wipeask','','danger')}</section>`;}
Object.assign(ACT,{fxtoggle(){FX.on=!FX.on;try{localStorage.setItem('er_fx',FX.on?'1':'0');}catch(e){}},save(){saveAll(true);},toggleai(){AI.enabled=!AI.enabled;try{localStorage.setItem('er_ai',AI.enabled?'1':'0');}catch(e){}},chatrate(v){UI.rate=v;try{localStorage.setItem('er_rate',v);}catch(e){}},
  theme(v){UI.theme=v;applyTheme();try{localStorage.setItem('er_theme',v);}catch(e){}},
  async export(){const s=await compress(serialize());openModal(`<h2>Export save</h2><p class="hint">Copy this code and keep it somewhere safe. Paste it into “Import save” on any device.</p><textarea id="exp" rows="8" readonly>${E(s)}</textarea><div class="row">${btn('Copy','copyexp','','gilt')}${NET.downloads?btn('Save as file','dlexp'):''}</div>`,'export');UI.exp=s;},
  copyexp(){const t=document.getElementById('exp');navigator.clipboard.writeText(UI.exp).then(()=>UI.toast('Copied')).catch(()=>{t.select();UI.toast('Press Ctrl/Cmd+C to copy');});},
  dlexp(){NET.downloads.save({filename:`eternal-realms-${S.P.user}.txt`,data:UI.exp}).catch(()=>{});},
  importask(){openModal(`<h2>Import save</h2><p class="hint">This replaces your current character.</p><form data-form="import" class="col"><label for="imp">Save code</label><textarea id="imp" name="code" rows="6" required></textarea><label for="impf">or choose a file</label><input id="impf" type="file" accept=".txt,.json"><button class="b gilt">Import</button></form>`,'import');
    setTimeout(()=>{const f=document.getElementById('impf');if(f)f.onchange=()=>{const r=new FileReader();r.onload=()=>{document.getElementById('imp').value=r.result;};r.readAsText(f.files[0]);};},0);},
  async form_import(fd){if(!LAUNCH.open)return;try{const obj=JSON.parse(await decompress(fd.code.trim()));if(!obj.P||!obj.npcs)throw new Error('not a save');hydrate(obj);closeModal();UI.toast('Save imported','epic');await saveAll();startGame();}catch(e){UI.toast('That code is not a valid save.','bad');}},
  help(){openModal(HELP_HTML,'help');},
  wipeask(){openModal(`<h2>Delete your character?</h2><p>This permanently erases ${E(S.P.name)} and this world from this browser${NET.canWrite?' and your account':''}.</p>${btn('Yes, delete everything','wipe','','danger')}${btn('Cancel','close')}`,'wipe');},
  async wipe(){wipeLocal();await wipeCloud();location.reload();}});
const HELP_HTML=`<h2>How to play</h2><div class="help">
<p><b>You are one adventurer among hundreds.</b> Everyone in chat, on the leaderboards and in the guilds is either a simulated adventurer with their own goals, or (marked <sup class="realdot">●</sup>) a real player.</p>
<p><b>World:</b> Explore, hunt, gather, search for treasure and examine landmarks. Every action takes in-game time, and the world moves on while it passes. Travel along roads on the Map. Some places are hidden: listen for rumors at inns.</p>
<p><b>Combat:</b> Turn-based. Tap an enemy to target it. Attack, Heavy (strong, slower next turn), Quick (accurate, faster next turn), Defend, Dodge, Parry (counter melee), Counter, Skills, Magic, Items, Summon, Bond (tame), Party tactics, Row (back row takes less melee damage), Inspect (free) and Escape.</p>
<p><b>Growth:</b> Level up for attribute points. Masteries improve with use and unlock techniques and spells for any class. Retrain your class at trainers and keep your masteries. Advanced classes require mastery, levels and a trial with a mentor.</p>
<p><b>Social:</b> Type in chat. Ask for help (“anyone want to help me clear the abandoned mine?”), mention people with @name, whisper with /w name. Invite from profiles. Simulated adventurers decide for themselves and remember what you did.</p>
<p><b>Economy:</b> Prices follow supply and demand, wars and events. Buy and sell at shops, list on the Auction House, haggle in trades, craft at workshops.</p>
<p><b>Difficulty:</b> everyone plays on Normal. Same-level monsters are a fair fight alone; two at once or a dungeon boss are best with a party, skills and potions.</p>
<p><b>Saving:</b> Progress saves automatically to this browser${typeof NET!=='undefined'&&NET.canWrite?' and your claude.ai account':''}. Use Export save for a backup.</p></div>`;

/* ---------------- character creation ---------------- */
const CC={user:'',name:'',race:'human',gender:'unspecified',age:22,hair:'',eyes:'',build:'',skin:'',mark:'',bg:'commoner',cls:'warrior',start:'home',diff:'normal'};
function ccPreview(){const at=baseAttrs(CC.race,CC.bg);const fake={race:CC.race,cls:CC.cls,level:1,attr:at,equip:{},mastery:{}};const st=calcStats(fake);const R=RACES[CC.race],B=BACKGROUNDS[CC.bg],K=CLASSES[CC.cls];
  return `<div class="ccprev"><h3>${E(CC.name||'Your hero')} <small>${E(CC.user||'username')}</small></h3><p>${R.name} ${K.name} · ${B.name}</p><div class="attrs small">${ATTRS.map(k=>`<div class="attr"><span>${k.toUpperCase()}</span><b>${at[k]}</b></div>`).join('')}</div>
   <p class="hint">HP ${st.mhp} · MP ${st.mmp} · SP ${st.msp} · Gold ${(B.gold||0)+(K.gold||0)}</p><p class="good">${E(R.perk)}</p><p class="bad">${E(R.flaw)}</p><p class="hint">${E(K.desc)} Skills: ${K.skills.map(s=>SKILLS[s].n).join(', ')}</p><p class="hint">${E(B.desc)}</p></div>`;}
function renderCreate(){if(!LAUNCH.open){showTitle();return;}const card=(k,o,sel,field)=>`<button type="button" class="card ${sel===k?'on':''}" data-a="cc" data-v="${field}|${k}"><b>${E(o.name)}</b><small>${E(o.perk||o.desc||'')}</small></button>`;
  const starts=[['home',`Homeland (${LOCS[RACES[CC.race].home].n})`],['brookhollow','Brookhollow (classic start)'],['crossroads','Crossroads (frontier)'],['valeria','Valeria (capital)'],['saltmere','Port Saltmere']];
  $('#app').innerHTML=`<div class="create"><header class="cchead"><h1>Create your adventurer</h1><p>Nobody has heard of you yet. The Realms already have their champions.</p></header>
  <form data-form="create" class="ccform"><div class="cccols"><div class="ccmain">
   <fieldset><legend>Identity</legend><div class="fgrid"><label>Username<input name="user" id="cc_user" maxlength="16" required pattern="[A-Za-z0-9_\\-]{3,16}" value="${E(CC.user)}" placeholder="e.g. ${E(genUsername(new Set()))}"></label>
    <label>Character name<input name="name" id="cc_name" maxlength="24" required value="${E(CC.name)}" placeholder="e.g. ${E(genCharName(CC.race))}"></label>
    <label>Gender<select name="gender" id="cc_gender">${['unspecified','female','male','nonbinary'].map(g=>`<option ${CC.gender===g?'selected':''}>${g}</option>`).join('')}</select></label>
    <label>Age<input name="age" id="cc_age" type="number" min="16" max="400" value="${CC.age}"></label></div></fieldset>
   <fieldset><legend>Appearance</legend><div class="fgrid"><label>Hair<input name="hair" id="cc_hair" maxlength="30" value="${E(CC.hair)}" placeholder="braided copper"></label><label>Eyes<input name="eyes" id="cc_eyes" maxlength="30" value="${E(CC.eyes)}" placeholder="storm-grey"></label>
    <label>Build<input name="build" id="cc_build" maxlength="30" value="${E(CC.build)}" placeholder="lean"></label><label>${CC.race==='beastkin'?'Fur':CC.race==='draconian'?'Scales':'Skin'}<input name="skin" id="cc_skin" maxlength="30" value="${E(CC.skin)}" placeholder="sun-browned"></label>
    <label class="wide">Distinguishing mark<input name="mark" id="cc_mark" maxlength="60" value="${E(CC.mark)}" placeholder="a scar across the left brow"></label></div></fieldset>
   <fieldset><legend>Race</legend><div class="cards">${Object.entries(RACES).map(([k,o])=>card(k,o,CC.race,'race')).join('')}</div><p class="hint">${E(RACES[CC.race].lore)}</p></fieldset>
   <fieldset><legend>Background</legend><div class="cards">${Object.entries(BACKGROUNDS).map(([k,o])=>card(k,{name:o.name,desc:o.desc},CC.bg,'bg')).join('')}</div></fieldset>
   <fieldset><legend>Starting class</legend><div class="cards">${Object.entries(CLASSES).map(([k,o])=>card(k,{name:o.name,desc:o.desc},CC.cls,'cls')).join('')}</div></fieldset>
   <fieldset><legend>Starting location</legend><div class="cards">${starts.map(([k,n])=>card(k,{name:n},CC.start,'start')).join('')}</div></fieldset>
   <p class="hint">Everyone plays on the same Normal difficulty so friends can adventure together. Dying costs 10% of your gold and some experience, and you wake up at your last inn.</p>
  </div><aside class="ccside">${ccPreview()}<button class="b gilt big">Enter the Realms</button><p id="ccerr" class="bad" role="alert"></p>${btn('Back','title','','ghost')}</aside></div></form></div>`;}
function ccSync(){const f=document.querySelector('.ccform');if(!f)return;for(const k of ['user','name','gender','age','hair','eyes','build','skin','mark']){const el=f.elements[k];if(el)CC[k]=el.value;}}
Object.assign(ACT,{cc(v){ccSync();const [f,k]=v.split('|');CC[f]=k;const y=window.scrollY;renderCreate();window.scrollTo(0,y);},
  form_create(fd){if(!LAUNCH.open)return;ccSync();const err=$('#ccerr');const user=CC.user.trim(),name=CC.name.trim();
    if(!/^[A-Za-z0-9_\-]{3,16}$/.test(user)){err.textContent='Usernames are 3–16 letters, numbers, _ or -.';return;}if(!name){err.textContent='Give your character a name.';return;}
    if(S.npcs.some(n=>n.user.toLowerCase()===user.toLowerCase())||Object.entries(NET.players).some(([id,p])=>id!==NET.uid&&p.user.toLowerCase()===user.toLowerCase())){err.textContent='That username is already taken by another adventurer.';return;}
    const start=CC.start==='home'?RACES[CC.race].home:CC.start;
    S.P=createPlayer({user,name,race:CC.race,cls:CC.cls,bg:CC.bg,gender:CC.gender,age:+CC.age||22,diff:'normal',start,look:{hair:CC.hair,eyes:CC.eyes,build:CC.build,skin:CC.skin,mark:CC.mark}});
    log(`${name} arrives in ${LOCS[start].n}. ${LOCS[start].d}`,'lore');log(`Main story: ${STORY[0].n} — ${STORY[0].step}`,'lore');log('Tip: open Chat and say hello, or ask for help. Check the Quest Board in town.','hint');
    for(let i=0;i<18;i++)ambient();for(const q of CQ)q.at=Date.now()-1000;flushChat();
    S.real=Date.now();
    sys(`Welcome to Eternal Realms, ${user}! ${onlineNpcs().length} adventurers are online.`);
    const greeter=onlineNpcs(n=>n.tr.kind>0.6&&n.tr.social>0.5);if(greeter.length){say(U.pick(greeter),'global',`welcome ${user}! if you need help just ask`,4000);}
    saveAll();startGame();},
  title(){markPlaying(false);saveAll();showTitle();},newchar(){if(UI.localSave&&UI.localSave.obj&&UI.localSave.obj.P&&!UI.confirmNew){UI.confirmNew=1;UI.toast(`This will replace ${UI.localSave.obj.P.name}. Tap New character again to confirm.`,'bad');return;}if(!S||!S.npcs)newWorld(20261104);S.P=null;renderCreate();},
  async cont(){startGame();},async contcloud(){if(!LAUNCH.open)return;const c=await loadCloud();if(c){hydrate(c.obj);startGame();}else UI.toast('Could not load your cloud save.','bad');}});

/* ---------------- combat UI ---------------- */
UI.banner=(title,sub)=>{const b=$('#banner');b.innerHTML=`<div><small>${E(sub||'')}</small><b>${E(title)}</b></div>`;b.hidden=false;b.classList.remove('go');void b.offsetWidth;b.classList.add('go');clearTimeout(UI.bt);UI.bt=setTimeout(()=>{b.hidden=true;},2600);};
BUS.on((t,d)=>{if(S&&S.catchup)return;if(t==='player_tier'||t==='player_level'||t==='player_adv'){levelBurst();sfx('levelup');}if(t==='player_ach'){sfx('buff');burst(innerWidth/2,innerHeight*0.45,ELEM_COL.gold,24,4);}if(t==='player_tier')UI.banner(d.nm,'Class upgrade');if(t==='player_level')UI.banner(`Level ${d.level}`,'You feel stronger');if(t==='player_adv')UI.banner(d.A.name,'A higher path');if(t==='player_ach')UI.banner(ACHIEVEMENTS[d.id].n,'Achievement');});
UI.openCombat=()=>{C.closed=false;$('#combat').hidden=false;UI.combatMenu='main';renderCombat();};
// strictly one actor at a time: each action gets its own beat so its animation finishes before the next one starts
UI.turnGap=()=>UI.fast?260:fxReduced()?600:950;
UI.runCombat=(afterPlayer)=>{if(!C||C.ended){renderCombat();return;}clearTimeout(UI.ct);
  const step=()=>{if(!C)return;C.acted=false;const r=combatStep();renderCombat();if(C.cinema&&!C.cineStarted){C.cineStarted=1;setTimeout(finalCinematic,1500);return;}
    if(r==='cont')UI.ct=setTimeout(step,C.acted?UI.turnGap():40);};
  if(afterPlayer){renderCombat();UI.ct=setTimeout(step,UI.turnGap());}else step();};
UI.combatEnded=()=>{renderCombat();UI.dirty=true;if(C.result==='win'){sfx('victory');if(C.enemies.some(e=>e.boss)||C.summary.some(x=>typeof x==='object'&&x.r>=3))confetti();}else if(C.result==='lose')sfx('defeat');};
function actorCard(a,i,side){const fx=Object.keys(a.fx).filter(k=>STATUS[k]&&a.fx[k].d>0).map(k=>`<i class="fx ${STATUS[k].bad?'bad':'good'}">${STATUS[k].n}</i>`).join('');const dead=a.hp<=0||a.fled;
  const sel=side==='e'&&C.target===i;const cur=C.order[C.oi]===a&&!C.ended;a._k=a._k||U.uid();return `<button class="actor ${side} ${dead?'dead':''} ${sel?'sel':''} ${a.isPlayer?'me':''} ${cur?'turn':''} ${a.boss?'boss':''} ${a.coop?'coopa':''}" data-k="${a._k}" ${side==='e'&&!dead?`data-a="ctarget" data-v="${i}"`:'disabled'} aria-label="${E(a.name)}">
  <span class="ahead">${sigil(a)}<b>${E(a.name)}</b></span><small>Lv.${a.level} · ${a.row}${a.boss?' · BOSS':''}${a.fled?(a.tamed?' · bonded':a.surrendered?' · yielded':' · fled'):''}</small>${abar(Math.max(0,a.hp),a.mhp,'hp','HP',a._k)}${a.side==='a'&&!a.mon?abar(a.mp,a.mmp,'mp','MP',a._k)+abar(a.sp,a.msp,'sp','SP',a._k):''}<span class="fxs">${fx}</span></button>`;}
function renderCombat(){if(!C)return;const el=$('#combat');const pa=C.allies.find(x=>x.isPlayer);const foes=alive(C.enemies);if(C.target>=foes.length)C.target=0;
  const myTurn=C.waiting&&!C.ended;let actions='';
  if(C.ended){actions=`<div class="cres ${C.result}"><h3>${icon(C.result==='win'?'ranks':C.result==='lose'?'skull':'escape')} ${C.result==='win'?'Victory':C.result==='lose'?'Defeat':'Escaped'}</h3>${C.summary.map(s=>typeof s==='object'?`<p class="loot lr${s.r||0}">${s.html}</p>`:`<p>${E(s)}</p>`).join('')}<div class="row">${S.P.dungeon&&C.result==='win'?btn(S.P.dungeon.floor>S.P.dungeon.floors?'Face the boss':'Next floor','cnext','','gilt')+btn('Leave dungeon','cleave'):''}${btn(C.perma?'Return to title':'Continue','cclose','','gilt')}</div></div>`;}
  else if(myTurn){const m=UI.combatMenu;const sk=pa.skills;
    if(m==='main'){const cb=(ic,n,a,v,cls='')=>`<button class="cb ${cls}" data-a="${a}" data-v="${v}">${icon(ic)}<span>${n}</span></button>`;
      actions=`<div class="cact main"><div class="crow prim">${cb('attack','Attack','ca','attack','big')}${cb('skills','Skills','cmenu','skills','gilt')}${cb('magic','Magic','cmenu','magic','gilt')}${cb('items','Items','cmenu','items')}</div>
      <div class="crow">${cb('heavy','Heavy','ca','heavy')}${cb('quick','Quick','ca','quick')}${cb('defend','Defend','ca','defend')}${cb('dodge','Dodge','ca','dodge')}${cb('parry','Parry','ca','parry')}${cb('counter','Counter','ca','counter')}</div>
      <div class="crow">${S.P.comps.length?cb('summon','Summon','cmenu','summon'):''}${canTame()?cb('bond','Bond','ca','tame'):''}${C.allies.length>1?cb('party','Party','cmenu','party'):''}${cb('row',pa.row==='front'?'To back':'To front','ca','row')}${cb('eye','Inspect','cinspect','')}${C.opts.type==='duel'||C.opts.type==='arena'?cb('escape','Yield','ca','surrender','ghost'):cb('escape','Escape','ca','escape','ghost')}</div></div>`;}
    else{const list=m==='skills'?sk.filter(id=>!(SKILLS[id].c[0]>0&&!SKILLS[id].c[1]&&['mag','heal'].includes(SKILLS[id].k))):m==='magic'?sk.filter(id=>SKILLS[id].c[0]>0):[];
      let inner='';if(m==='skills'||m==='magic')inner=list.map(id=>{const s=SKILLS[id];const ok=costOk(pa,Object.assign({id},s));return `<button class="b ${ok?'':'dim'}" data-a="cskill" data-v="${id}" ${ok?'':'disabled'} title="${E(s.d||'')}">${E(s.n)}<small>${s.c[0]?s.c[0]+'MP ':''}${s.c[1]?s.c[1]+'SP':''}${pa.cd[id]>0?' · '+pa.cd[id]+'t':''}</small></button>`;}).join('')||'<p class="hint">None available.</p>';
      if(m==='items')inner=S.P.inv.map((it,i)=>[it,i]).filter(([it])=>!isGear(it)&&ITEMS[it.k]&&ITEMS[it.k].t==='con').map(([it,i])=>`<button class="b" data-a="citem" data-v="${i}">${E(ITEMS[it.k].n)} ×${it.q}<small>${E(itemDesc(it))}</small></button>`).join('')||'<p class="hint">No usable items.</p>';
      if(m==='summon')inner=S.P.comps.map(c=>`<button class="b" data-a="csummon" data-v="${c.id}">${E(c.name)}<small>Lv.${c.level} · ${15+Math.round(c.level*0.5)} MP</small></button>`).join('');
      if(m==='party')inner=['free','focus','defensive'].map(t=>btn(({free:'Fight freely',focus:'Focus my target',defensive:'Play defensively'})[t],'ctactic',t,C.tactic===t?'gilt':'')).join('');
      actions=`<div class="cact sub">${inner}${btn('◂ Back','cmenu','main','ghost')}</div>`;}}
  else actions='<div class="cact wait"><p>…</p></div>';
  el.innerHTML=`<div class="cwrap"><header><h2>${E(C.opts.title||'Battle')}</h2><small class="turnlbl ${myTurn?'mine':''}">Round ${C.round} · ${C.ended?'Battle over':myTurn?'Your turn':(()=>{const a=C.order.slice(C.oi).find(x=>x&&x.hp>0&&!x.fled);return a?(a.isPlayer?'Your turn':`${E(a.name)}'s turn`):'Next round';})()}</small></header>
   <div class="side enemies">${C.enemies.map((a,i)=>actorCard(a,alive(C.enemies).indexOf(a),'e')).join('')}</div>
   <div class="clog" id="clog">${C.log.slice(-14).map(([t,c])=>`<p class="${c}">${E(t)}</p>`).join('')}</div>
   <div class="side allies">${C.allies.map(a=>actorCard(a,0,'a')).join('')}</div>${actions}
   ${UI.inspect?`<div class="inspect">${UI.inspect}${btn('Close','cinspect','x','ghost tiny')}</div>`:''}</div>`;
  const lg=$('#clog');if(lg)lg.scrollTop=lg.scrollHeight;animBars(el);combatVfx(el);finaleAmbience();
  if(C.floats&&C.floats.length){const fl=$('#floats');for(const f of C.floats.splice(0)){const card=el.querySelector(`[data-k="${f.a._k}"]`);if(!card)continue;const r=card.getBoundingClientRect();
    const d=document.createElement('span');d.className='float '+f.kind;d.textContent=f.txt;d.style.left=(r.left+r.width*(0.35+Math.random()*0.3))+'px';d.style.top=(r.top+r.height*0.35)+'px';fl.appendChild(d);setTimeout(()=>d.remove(),1100);
    if(f.kind==='dmg'||f.kind==='crit'){card.classList.add('hit');if(f.kind==='crit'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)el.querySelector('.cwrap').classList.add('shake');}}}}
Object.assign(ACT,{ctarget(i){C.target=+i;},ca(a){if(a==='tame'||a==='escape'||a==='surrender'||a==='row'){playerAction(a,null,C.target);}else playerAction(a,null,C.target);UI.combatMenu='main';},
  cmenu(m){UI.combatMenu=m;},cskill(id){const s=SKILLS[id];let t=C.target;if(['ally'].includes(s.tg)){const fr=friendsOf(C.allies.find(x=>x.isPlayer));t=fr.indexOf(fr.slice().sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0]);}playerAction('skill',id,t);UI.combatMenu='main';},
  citem(i){playerAction('item',+i);UI.combatMenu='main';},csummon(id){playerAction('summon',id);UI.combatMenu='main';},ctactic(t){playerAction('tactic',t);UI.combatMenu='main';},
  cinspect(v){if(v==='x'){UI.inspect=null;return;}const e=alive(C.enemies)[C.target];if(!e)return;
    UI.inspect=`<h3>${E(e.name)} · Lv.${e.level}</h3><p>${E(e.cat||'humanoid')} · HP ${U.fmt(e.hp)}/${U.fmt(e.mhp)} · ${e.hp>e.mhp*0.75?'Healthy':e.hp>e.mhp*0.4?'Wounded':'Badly hurt'}</p><p>Attack ≈${U.fmt(e.atk||e.patk)} · Defense ≈${U.fmt(e.pdef)} · Magic def ≈${U.fmt(e.mdef)} · Speed ${Math.round(e.spd)}</p>
      ${e.w&&e.w.length?`<p class="good">Weak to: ${e.w.join(', ')}</p>`:''}${e.r&&e.r.length?`<p class="bad">Resists: ${e.r.join(', ')}</p>`:''}${e.b&&e.b.length?`<p>Behavior: ${e.b.join(', ')}</p>`:''}${e.st?`<p>Inflicts: ${STATUS[e.st[0]].n}</p>`:''}${e.mon&&MONSTERS[e.id]&&MONSTERS[e.id].tame?'<p class="hint">Can be bonded below 30% HP.</p>':''}`;},
  cclose(){const perma=C&&C.perma;C.closed=true;$('#combat').hidden=true;UI.inspect=null;if(perma){markPlaying(false);wipeLocal();wipeCloud();S.P=null;showTitle();return;}saveLocal();},
  cnext(){C.closed=true;$('#combat').hidden=true;dungeonFloor();},cleave(){C.closed=true;$('#combat').hidden=true;S.P.dungeon=null;log('You leave the dungeon.');}});

/* ---------------- freeform actions ---------------- */
ACT.form_freeform=async(fd,f)=>{const t=(fd.ff||'').trim();if(!t||!needIdle())return;f.reset();const s=t.toLowerCase();const P=S.P,L=LOCS[P.loc];
  log(`You: “${t}”`,'me');
  const map=[[/(explore|look around|wander|scout)/,()=>exploreHere()],[/(search|dig|treasure|loot)/,()=>!isTown(P.loc)?searchTreasure():exploreHere()],[/(fight|hunt|attack|kill)/,()=>L.mon.length?startEncounter(P.loc):log('There is nothing here to fight.')],
    [/(rest|sleep|nap)/,()=>isTown(P.loc)&&hasSvc(P.loc,'inn')?restInn():camp()],[/(mine|ore)/,()=>{const r=(L.res||[]).find(r=>r[1]==='mining');r?gather(r[0],r[1]):log('There is nothing to mine here.');}],
    [/(fish)/,()=>{const r=(L.res||[]).find(r=>r[1]==='fishing');r?gather(r[0],r[1]):log('No good fishing spot here.');}],[/(herb|pick|forage|gather)/,()=>{const r=(L.res||[])[0];r?gather(r[0],r[1]):log('Nothing to gather here.');}],
    [/(pray|meditate)/,()=>{spend(30);const st=stats(P);P.mp=Math.min(st.mmp,P.mp+st.mmp*0.3);log('You pray quietly. Your mind clears.','lore');}],
    [/(rumou?r|gossip|listen)/,()=>isTown(P.loc)?hearRumors():log('Only the wind here.')],[/(read|study)/,()=>{const b=(LIBRARY_BOOKS[P.loc]||[])[0];b?readBook(b):log('Nothing to read here.');}],
    [/(sing|dance|perform|play)/,()=>{spend(30);if(isTown(P.loc)){const g=U.ri(1,6)+Math.floor(stats(P).attr.luck/4);P.gold+=g;log(`A small crowd gathers. You earn ${g} gold in tips.`,'good');}else log('The trees are not impressed.');}],
    [/(steal|pickpocket|rob)/,()=>{spend(15);if(isTown(P.loc)&&U.chance(0.3+stats(P).attr.dex*0.005)){const g=U.ri(5,25);P.gold+=g;log(`You lift a purse with ${g} gold.`,'good');const f=S.control[P.loc];if(f)addRep(f,-2);}else{log('A guard grabs your wrist! You pay a fine.','bad');P.gold=Math.max(0,P.gold-20);const f=S.control[P.loc];if(f)addRep(f,-5);}}],
    [/(climb|swim|jump)/,()=>{spend(30);if(U.chance(0.25)){const d=Math.round(stats(P).mhp*0.08);P.hp=Math.max(1,P.hp-d);log(`You slip and hurt yourself (${d} damage).`,'bad');}else{gainXp(5+L.lv[0]);log('You get a new vantage point over the area.');if(U.chance(0.15))exploreHere();}}],
    [/(talk|ask|greet)/,()=>{const tf=TOWNSFOLK[P.loc];tf?talkTownsfolk(...U.pick(tf)):exploreHere();}]];
  const hit=map.find(([re])=>re.test(s));const before=P.log.length;
  if(hit)hit[1]();else{spend(20);log(U.pick(['You try it. Nothing much comes of it, but it passes the time.','You give it a go. A passerby gives you an odd look.','It doesn\'t go quite as planned, but you learn something.']));}
  if(AI.enabled&&NET.sample){const outcome=P.log.slice(before).map(x=>x[1]).join(' ')||'nothing notable';const n=await aiNarrate(t,outcome);if(n)log(n,'lore');UI.dirty=true;render();}};

/* ---------------- render & loop ---------------- */
function render(){if(!S||!S.P||!UI.started)return;renderHeader();renderNav();const v=$('#view');const tab=UI.tab;
  const views={world:renderWorld,map:renderMap,char:renderChar,bag:renderBag,quests:renderQuests,chat:()=>renderChat(true),social:renderSocial,ranks:renderRanks,market:renderMarket,codex:renderCodex,menu:renderMenu};
  const focus=document.activeElement&&document.activeElement.id;const val=focus&&document.activeElement.value;
  if(tab==='chat'){if(!v.querySelector('.chat.full')||UI.chatDirty||UI.dirty){const keep=v.querySelector('#chatmsg');const kv=keep?keep.value:'';v.innerHTML=views.chat();const n=v.querySelector('#chatmsg');if(n&&kv)n.value=kv;}}
  else v.innerHTML=(views[tab]||renderWorld)();
  if(tab==='world')requestAnimationFrame(startWeather);
  const side=$('#side');if(tab!=='chat'){const keep=side.querySelector('#chatmsg');const kv=keep?keep.value:'';const sel=side.querySelector('#chatsel');const sv=sel?sel.value:null;side.innerHTML=renderChat(false);const n=side.querySelector('#chatmsg');if(n){n.value=kv;}if(sv&&UI.lastChatCh===UI.chatCh&&side.querySelector('#chatsel'))side.querySelector('#chatsel').value=sv;UI.lastChatCh=UI.chatCh;}else side.innerHTML='';
  if(focus){const el=document.getElementById(focus);if(el&&el!==document.activeElement){el.focus();if(val!=null&&'value' in el&&el.value!==val&&focus!=='chatmsg')el.value=val;}}
  document.querySelectorAll('#chatlog').forEach(l=>l.scrollTop=l.scrollHeight);
  UI.dirty=false;UI.chatDirty=false;if(UI.modalKey&&!UI.modalKey.startsWith('item')&&!['export','import','list','offer','mail','wipe','help','digest','more','rprof','gview','guilds','item','folk','patch'].includes(UI.modalKey)&&!UI.modalKey.startsWith('svc:market'))refreshModal();}
function renderChatOnly(){const keepFocus=document.activeElement&&document.activeElement.id==='chatmsg';document.querySelectorAll('#chatlog').forEach(l=>{const atBottom=l.scrollHeight-l.scrollTop-l.clientHeight<60;l.innerHTML=chatMessages().map(chatLine).join('');if(atBottom)l.scrollTop=l.scrollHeight;});
  renderNav();UI.chatDirty=false;if(keepFocus){const i=document.getElementById('chatmsg');if(i)i.focus();}}
let lastTick=Date.now(),nextAmbient=Date.now()+4000,lastSave=Date.now();
function loop(){if(!S||!S.P||!UI.started)return;const now=Date.now();
  if(!UI.inCombat()){const dt=Math.min(10,Math.floor((now-lastTick)/1000));if(dt>=1){lastTick+=dt*1000;const before=Math.floor(S.time/60);S.time+=dt*GAME_MIN_PER_SEC;regen(dt);const after=Math.floor(S.time/60);for(let i=before;i<after;i++){processHour();partyFollow();}if(after>before)UI.dirty=true;}}else lastTick=now;
  flushChat();
  const rate={quiet:2.2,normal:1,busy:0.45}[UI.rate||'normal'];if(now>=nextAmbient){ambient();nextAmbient=now+U.ri(2500,6500)*rate;}
  if(!UI.nThread||now>=UI.nThread){if(UI.nThread)thread();UI.nThread=now+U.ri(14000,32000)*rate;}
  if(!UI.nGuild||now>=UI.nGuild){if(UI.nGuild)guildChatter();UI.nGuild=now+U.ri(9000,22000)*rate;}
  if(!UI.nParty||now>=UI.nParty){if(UI.nParty)partyChatter();UI.nParty=now+U.ri(25000,50000)*rate;}
  if(now-lastSave>60000){lastSave=now;saveAll();}if(!UI.lastMark||now-UI.lastMark>5000){UI.lastMark=now;markPlaying(true);}if(NET.isHost&&(!NET.lastUpload||now-NET.lastUpload>600000)){NET.lastUpload=now;uploadWorld();}if(!UI.lastPres||now-UI.lastPres>20000){UI.lastPres=now;netPresence(true);}
  if(UI.dirty&&!isTyping())render();else{if(UI.chatDirty)renderChatOnly();if(UI.dirty)renderHeader();}
}
function isTyping(){const a=document.activeElement;return a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')&&a.id!=='chatmsg';}
function applyTheme(){const t=UI.theme||'system';if(t==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t);}

/* ---------------- title & boot ---------------- */
function needSignIn(){return typeof supaWanted==='function'&&supaWanted()&&!NET.uid;}
function authHtml(){if(!LAUNCH.open||!needSignIn())return '';
  if(!NET.ready)return `<div class="tmenu"><div class="soon"><b>Connecting…</b></div></div>`;
  const up=UI.authMode==='signup';
  return `<div class="tmenu auth"><div class="soon"><small>${up?'Create your account':'Welcome back'}</small>
    <form data-form="auth" class="col"><label for="ae">Email</label><input id="ae" name="email" type="email" autocomplete="email" required>
    <label for="ap">Password</label><input id="ap" name="pw" type="password" minlength="6" autocomplete="${up?'new-password':'current-password'}" required>
    <button class="b gilt big" ${UI.authBusy?'disabled':''}>${UI.authBusy?'Please wait…':up?'Create account':'Sign in'}</button></form>
    ${UI.authMsg?`<p class="${UI.authOk?'good':'bad'}">${E(UI.authMsg)}</p>`:''}
    <button class="b ghost" data-a="authmode">${up?'I already have an account':'New here? Create an account'}</button>
    <button class="b ghost" data-a="authguest">Play as guest <small>(progress stays on this device)</small></button></div></div>`;}
async function afterSignIn(){UI.authMsg='';await netInit();await showTitle();}
Object.assign(ACT,{patchnotes(){openModal(patchNotesHtml(PATCH_NOTES,'Patch notes'),'patch');},authmode(){UI.authMode=UI.authMode==='signup'?'signin':'signup';UI.authMsg='';showTitle();},
  async form_auth(fd){if(UI.authBusy)return;UI.authBusy=1;UI.authMsg='';showTitle();
    try{if(UI.authMode==='signup'){const s=await supaSignUp(fd.email.trim(),fd.pw);if(!s){UI.authOk=1;UI.authMsg='Almost there! Check your email and tap the confirmation link, then sign in here.';UI.authMode='signin';}else await afterSignIn();}
      else{await supaSignIn(fd.email.trim(),fd.pw);await afterSignIn();}}
    catch(e){UI.authOk=0;UI.authMsg=e.message;}UI.authBusy=0;showTitle();},
  async authguest(){if(UI.authBusy)return;UI.authBusy=1;UI.authMsg='';try{await supaGuest();await afterSignIn();}catch(e){UI.authOk=0;UI.authMsg=e.message;}UI.authBusy=0;showTitle();},
  async signout(){await saveAll();await supaSignOut();NET.uid=null;NET.db=null;NET.room=null;NET.user=null;for(const u of NET.unsub)try{u&&u();}catch(e){}NET.unsub=[];NET.mode='local';markPlaying(false);location.reload();},
  delacct(){openModal(`<h2>Delete account</h2><p>This permanently deletes your account, your character, your online save, your leaderboard entry and your messages. It cannot be undone.</p><div class="row">${btn('Cancel','close')}${btn('Delete forever','delacctgo','','danger')}</div>`,'delacct');},
  async delacctgo(){try{await supaDeleteAccount();wipeLocal();markPlaying(false);location.reload();}catch(e){UI.toast('Could not delete: '+e.message,'bad');}}});
async function showTitle(){UI.started=false;document.body.classList.remove('ingame');$('#game').hidden=true;$('#combat').hidden=true;
  const local=await loadLocal();const cloud=await peekCloud();UI.localSave=local;const LP=local&&local.obj&&local.obj.P;
  const W=S||{};const day=W.time?T.day(W.time):1;const on=W.npcs?W.npcs.filter(n=>!n.retired&&online(n)).length:0;const head=(W.news||[])[0];const boss=W.boss?MONSTERS[W.boss.id].n:null;
  $('#app').hidden=false;$('#app').innerHTML=`<canvas class="titlebg" id="titlebg" aria-hidden="true"></canvas><div class="vignette" aria-hidden="true"></div>
   <div class="title">
    <div class="crest" aria-hidden="true"><span class="crest-ring"></span>${icon('swords')}</div>
    <p class="pre">A living fantasy MMORPG</p><h1 class="logo"><span>Eternal</span><span>Realms</span></h1>
    <p class="tag">Hundreds of adventurers already roam these lands. None of them are waiting for you.</p>
    <div class="ticker" role="status"><span>${icon('clock')}Day ${day}</span>${LAUNCH.open?`<span>${icon('online')}${on} adventurers online${NET.peers?` · ${NET.peers} real`:''}</span>`:`<span class="bad">${icon('online')}Servers offline</span>`}${boss?`<span class="bad">${icon('skull')}${E(boss)} awakens</span>`:''}${head?`<span class="news">${E(head[1])}</span>`:''}</div>
    ${authHtml()}${!LAUNCH.open?`<div class="tmenu prelaunch"><div class="soon"><small>Servers status</small><b>${icon('clock')} Opening soon</b><p>The Realms are not open yet. No accounts or characters exist until launch day. Check back soon.</p></div>
     <div class="row tsub"><button class="b ghost" data-a="help">How to play</button><button class="b ghost" data-a="sound" id="tsound">${AUD.on?'♪ Music on':'♪ Play music'}</button></div></div>`:''}
    <div class="tmenu" ${!LAUNCH.open||needSignIn()?'hidden':''}>${LP?`<button class="hero-card" data-a="cont"><span class="portrait" style="--ac:${CLS_HUE[LP.cls]}">${icon(CLS_ICON[LP.cls])}<b>${LP.level}</b></span><span><small>Continue your legend</small><b>${E(LP.name)}</b><small>${E(LP.adv?ADV_CLASSES[LP.adv].name:CLASSES[LP.cls].name)} · ${E(LOCS[LP.loc]?LOCS[LP.loc].n:'')}</small></span><i>▶</i></button>`:''}
     ${cloud&&(!LP||cloud.t>local.t+5000)?`<button class="b gilt big" data-a="contcloud">Continue from your account <small>${E(cloud.user)} · Lv.${cloud.level}</small></button>`:''}
     <button class="b ${LP?'':'gilt'} big" data-a="newchar">${LP?'New character':'Begin your adventure'}</button>
     <div class="row tsub"><button class="b ghost" data-a="importask">Import save</button><button class="b ghost" data-a="help">How to play</button><button class="b ghost" data-a="patchnotes">Patch notes</button><button class="b ghost" data-a="sound" id="tsound">${AUD.on?'♪ Music on':'♪ Play music'}</button></div><p class="ver">v${GAME_VERSION}${typeof IS_TEST_SITE!=='undefined'&&IS_TEST_SITE?' · <b class="testbadge">TEST VERSION</b>':''}</p></div>
    ${LAUNCH.open?`<p class="hint">${E(NET.status)}</p>`:''}</div>`;requestAnimationFrame(()=>startTitleScene(document.getElementById('titlebg')));
  if(AUD.on)audMood('title');}
async function startGame(){if(!LAUNCH.open){showTitle();return;}if(!S.P){renderCreate();return;}$('#app').hidden=true;document.body.classList.add('ingame');
  // the world keeps moving: adopt the newest shared world, then fast-forward through the time nobody was watching
  if(!UI.synced){UI.synced=true;let from=S.real;
    if(NET.db){const meta=await fetchWorldMeta();if(meta&&meta.real>(S.real||0)+60000&&(await adoptWorld(meta))){from=meta.real;log(`The realm's chronicle was updated from ${meta.host}'s world.`,'lore');}}
    const hrs=await fastForward(from,Date.now());S.real=Date.now();
    if(hrs>=4&&S.digest){log(`While you were away, ${hrs>=48?Math.round(hrs/24)+' days':hrs+' hours'} passed in the Realms.`,'lore');openModal(digestHtml(S.digest),'digest');}
    if(NET.isHost)uploadWorld();}$('#game').hidden=false;UI.started=true;UI.tab=UI.tab||'world';lastTick=Date.now();
  S.real=Date.now();netPresence();publishProfile(true);UI.dirty=true;render();if($('#modal').hidden)checkPatchNotes();else UI.pendingPatch=1;}
setInterval(()=>{if(S)S.real=Date.now();},30000);
window.addEventListener('beforeunload',()=>{if(S&&S.P&&UI.started){saveLocalSync();markPlaying(true);}});
window.addEventListener('pagehide',()=>{if(S&&S.P&&UI.started){saveLocalSync();markPlaying(true);}});
// "still playing" marker: if the page reloads mid-session (a new version of the game, the browser freeing memory, a dropped connection), drop the player straight back in
function markPlaying(on){try{if(on)localStorage.setItem('er_inplay',String(Date.now()));else localStorage.removeItem('er_inplay');}catch(e){}}
function wasPlaying(){try{const t=+localStorage.getItem('er_inplay')||0;return Date.now()-t<20*60000;}catch(e){return false;}}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S&&S.P){saveAll();if(NET.isHost&&Date.now()-(NET.lastUpload||0)>60000)uploadWorld();}});
document.addEventListener('input',e=>{const v=e.target.dataset&&e.target.dataset.vol;if(!v)return;if(!AUD.on)audStart();audSetVol(v==='m'?e.target.value/100:null,v==='s'?e.target.value/100:null);});
// music starts with the first tap (browsers require a gesture), unless the player turned it off
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('[data-a=sound]'))return;if(!AUD.on&&!AUD.declined){let pref=null;try{pref=localStorage.getItem('er_sound');}catch(e){}if(pref!=='0')audStart();else AUD.declined=true;const b=document.getElementById('tsound');if(b)b.textContent=AUD.on?'♪ Music on':'♪ Play music';}},{once:false,capture:true});
async function boot(){if(typeof IS_TEST_SITE!=='undefined'&&IS_TEST_SITE)document.body.classList.add('testsite');try{FX.on=localStorage.getItem('er_fx')!=='0';const vv=JSON.parse(localStorage.getItem('er_vol')||'null');if(vv){AUD.music=vv[0];AUD.sfx=vv[1];}}catch(e){}try{UI.theme=localStorage.getItem('er_theme')||'system';UI.rate=localStorage.getItem('er_rate')||'normal';AI.enabled=localStorage.getItem('er_ai')==='1';}catch(e){}applyTheme();
  const local=await loadLocal();if(local&&local.obj&&local.obj.npcs)hydrate(local.obj);else newWorld(20261104);
  if(LAUNCH.open&&S&&S.P&&wasPlaying()){try{await startGame();UI.toast('Welcome back. Picked up right where you left off.');}catch(e){console.warn('resume failed',e);await showTitle();}}else await showTitle();setInterval(loop,500);
  netInit().then(async()=>{if(!UI.started)await showTitle();});}
boot();

