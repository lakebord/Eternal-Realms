/* ETERNAL REALMS — real-player friends (saved to your account) and parties (live, up to 4 real players).
   Friends: each player keeps one row friends/<uid> = {user, list:[uids], no:[uids]}.
            Both players listing each other = friends. Only one side = a pending request.
   Parties: carried in live presence. The leader broadcasts {lead:self, members, inv}; a member broadcasts {lead:leader}.
            You are in a party only while both sides agree, so nobody can force their way in. */
'use strict';
const PARTY_MAX=4;
NET.friendDocs={};NET.live.party={lead:null,members:[],inv:[]};

/* ---------- friends ---------- */
function friendsOnline(){return NET.mode==='online'&&!!NET.uid&&!NET.friendsOff;}
function myFriendDoc(){return NET.friendDocs[NET.uid]||{list:[],no:[]};}
function friendState(uid){if(!uid||uid===NET.uid)return 'self';const mine=(myFriendDoc().list||[]).includes(uid);const theirs=((NET.friendDocs[uid]||{}).list||[]).includes(NET.uid);
  return mine&&theirs?'friends':mine?'sent':theirs?'incoming':'none';}
function realFriendIds(){return (myFriendDoc().list||[]).filter(u=>friendState(u)==='friends');}
function friendRequests(){const no=myFriendDoc().no||[];return Object.keys(NET.friendDocs).filter(u=>friendState(u)==='incoming'&&!no.includes(u));}
function realName(uid){const p=NET.players[uid],l=NET.peerMap[uid],f=NET.friendDocs[uid];return String((l&&l.user)||(p&&p.user)||(f&&f.user)||'Adventurer').slice(0,24);}
async function saveFriendDoc(list,no){if(!friendsOnline()){UI.toast('Friends need an online connection.','bad');return false;}
  const doc={user:S.P.user,list:[...new Set(list)].slice(0,200),no:[...new Set(no)].slice(0,200)};
  try{await NET.db.doc('friends/'+NET.uid).set(doc);NET.friendDocs[NET.uid]=doc;UI.dirty=true;return true;}
  catch(e){console.warn('friends',e);UI.toast('Could not update your friends list right now.','bad');return false;}}
async function friendAdd(uid){const d=myFriendDoc();if(uid===NET.uid)return;const wasIncoming=friendState(uid)==='incoming';
  if(await saveFriendDoc([...(d.list||[]),uid],(d.no||[]).filter(x=>x!==uid))){UI.toast(wasIncoming?`You and ${realName(uid)} are now friends!`:`Friend request sent to ${realName(uid)}.`,wasIncoming?'epic':'');
    if(wasIncoming)chatPush('system','SYS',`You and ${realName(uid)} are now friends.`);}}
async function friendRemove(uid){const d=myFriendDoc();if(await saveFriendDoc((d.list||[]).filter(x=>x!==uid),d.no||[]))UI.toast(`Removed ${realName(uid)}.`);}
async function friendDecline(uid){const d=myFriendDoc();await saveFriendDoc(d.list||[],[...(d.no||[]),uid]);}
function onFriendsSnapshot(s){const before=friendRequests();NET.friendDocs={};for(const d of s.docs)NET.friendDocs[d.id]=d.data()||{};
  for(const u of friendRequests())if(!before.includes(u)&&NET.friendsSeen){chatPush('system','SYS',`${realName(u)} sent you a friend request. Open Social to accept.`);UI.toast(`Friend request from ${realName(u)}`,'epic');}
  NET.friendsSeen=1;UI.dirty=true;}
function findPlayerByName(name){const n=String(name||'').trim().toLowerCase();if(!n)return null;
  for(const [uid,p] of Object.entries(NET.players))if(String(p.user||'').toLowerCase()===n)return uid;
  for(const [uid,p] of Object.entries(NET.peerMap))if(String(p.user||'').toLowerCase()===n)return uid;return null;}

/* ---------- parties ---------- */
function myParty(){return NET.live.party;}
function isLeader(){return myParty().lead===NET.myKey;}
function partyMates(){const me=NET.myKey,pt=myParty();if(!pt.lead)return [];
  if(pt.lead===me)return (pt.members||[]).map(k=>NET.peerMap[k]).filter(Boolean);
  const L=NET.peerMap[pt.lead];if(!L||!L.party||L.party.lead!==L.key||(!(L.party.members||[]).includes(me)&&!pt.ok))return [];
  return [L,...(L.party.members||[]).filter(k=>k!==me).map(k=>NET.peerMap[k]).filter(p=>p&&p.party&&p.party.lead===L.key)];}
function partyInvitesToMe(){return Object.values(NET.peerMap).filter(p=>p.party&&p.party.lead===p.key&&(p.party.inv||[]).includes(NET.myKey)&&myParty().lead!==p.key&&!(NET.dismissedInv||[]).includes(p.key));}
function partyInvite(key){const pt=myParty();if(pt.lead&&pt.lead!==NET.myKey){UI.toast('Only the party leader can invite.','bad');return;}
  const size=1+(pt.members||[]).length;if(size>=PARTY_MAX){UI.toast(`Parties hold ${PARTY_MAX} players.`,'bad');return;}
  NET.live.party={lead:NET.myKey,members:pt.members||[],inv:[...new Set([...(pt.inv||[]),key])].slice(-6)};
  chatPush('system','SYS',`Party invite sent to ${realName(key)}.`);netPresence(true);UI.dirty=true;}
function partyAccept(lead){const L=NET.peerMap[lead];NET.dismissedInv=(NET.dismissedInv||[]).filter(k=>k!==lead);if(!L)return;if(myParty().lead&&myParty().lead!==lead)partyLeave(true);
  if(1+((L.party.members||[]).length)>=PARTY_MAX){UI.toast('That party is already full.','bad');return;}
  NET.live.party={lead,members:[],inv:[]};chatPush('system','SYS',`You joined ${L.user}'s party.`);netPresence(true);UI.dirty=true;}
function partyLeave(quiet){const was=myParty().lead;NET.live.party={lead:null,members:[],inv:[]};NET.partyGone={};if(!quiet&&was)chatPush('system','SYS',was===NET.myKey?'You disbanded your party.':'You left the party.');netPresence(true);UI.dirty=true;}
function partyKick(key){if(!isLeader())return;const pt=myParty();NET.live.party={lead:NET.myKey,members:(pt.members||[]).filter(k=>k!==key),inv:(pt.inv||[]).filter(k=>k!==key)};chatPush('system','SYS',`${realName(key)} was removed from the party.`);netPresence(true);UI.dirty=true;}
// runs after every presence update: keeps both sides of the party agreement in sync.
// Presence updates can arrive late or out of order, so nobody is dropped until they've looked "gone" for a few seconds.
const PARTY_GRACE=6000;NET.partyGone={};
function goneFor(k,isGone){const now=Date.now();if(!isGone){delete NET.partyGone[k];return 0;}if(!NET.partyGone[k])NET.partyGone[k]=now;return now-NET.partyGone[k];}
function partyMaintain(){const me=NET.myKey,pt=myParty();if(!pt.lead)return;let changed=false;
  if(pt.lead===me){let members=(pt.members||[]).slice();
    for(const k of (pt.inv||[])){const p=NET.peerMap[k];if(p&&p.party&&p.party.lead===me&&!members.includes(k)&&1+members.length<PARTY_MAX){members.push(k);goneFor('m:'+k,false);chatPush('system','SYS',`${p.user} joined your party.`);}}
    members=members.filter(k=>{const p=NET.peerMap[k];const gone=!(p&&p.party&&p.party.lead===me);if(goneFor('m:'+k,gone)>PARTY_GRACE){chatPush('system','SYS',`${realName(k)} left the party.`);return false;}return true;});
    const inv=(pt.inv||[]).filter(k=>!members.includes(k));
    if(members.join()!==(pt.members||[]).join()||inv.join()!==(pt.inv||[]).join()){NET.live.party={lead:me,members,inv};changed=true;}
    if(!members.length&&!inv.length){NET.live.party={lead:null,members:[],inv:[]};changed=true;}}
  else{const L=NET.peerMap[pt.lead];const leading=!!(L&&L.party&&L.party.lead===L.key);const joined=leading&&(L.party.members||[]).includes(me);
    if(joined)pt.ok=1;
    const gone=goneFor('lead',!L||!leading||(pt.ok&&!joined));
    if(gone>(L?PARTY_GRACE:60000)){NET.live.party={lead:null,members:[],inv:[]};NET.partyGone={};
      chatPush('system','SYS',!L?'Your party leader went offline. The party disbanded.':`You are no longer in ${L.user}'s party.`);changed=true;}
    else if(!pt.ok&&!joined&&L&&!(L.party.inv||[]).includes(me)&&goneFor('inv',true)>PARTY_GRACE*2){NET.live.party={lead:null,members:[],inv:[]};changed=true;}
    else if(joined)goneFor('inv',false);}
  if(changed){netPresence(true);UI.dirty=true;}}
function partyReward(keys,xp,gold){for(const k of keys)NET.live.rw.push({id:U.uid(),to:k,xp:Math.round(xp),gold:Math.round(gold)});NET.live.rw=NET.live.rw.slice(-8);netPresence(true);}

/* ---------- Social tab panels ---------- */
function realSocialHtml(){if(NET.mode!=='online')return '';const P=S.P,me=NET.myKey,pt=myParty(),mates=partyMates(),invites=partyInvitesToMe();
  const row=(p,extra)=>`<div class="li"><span>${avatar(p.user,p.cls,1)} <b>${E(p.user)}</b><sup class="realdot">●</sup> <small>Lv.${p.lvl} ${E(CLASSES[p.cls]?CLASSES[p.cls].name:'')} · ${E(LOCS[p.loc]?LOCS[p.loc].n:'?')}${p.loc===P.loc?' · <span class="good">here</span>':''}</small></span>${extra||''}</div>`;
  let h=`<section class="panel realp"><h3>${icon('party')} Party <small>${pt.lead?1+mates.length:1}/${PARTY_MAX} real players</small></h3>`;
  if(invites.length)h+=invites.map(p=>`<div class="li invite"><span><b>${E(p.user)}</b> invites you to their party</span><span class="row">${btn('Join','ptjoin',p.key,'gilt tiny')}${btn('No','ptno',p.key,'ghost tiny')}</span></div>`).join('');
  if(pt.lead){h+=`<div class="list"><div class="li"><span><b>${E(P.user)}</b> (you)${pt.lead===me?' · leader':''}</span></div>${mates.map(p=>row(p,(isLeader()?btn('Kick','ptkick',p.key,'ghost tiny'):'')+(p.key===pt.lead?' <small>leader</small>':''))).join('')}
      ${isLeader()?(pt.inv||[]).map(k=>`<div class="li"><span class="hint">Invited: ${E(realName(k))}…</span></div>`).join(''):''}</div>
      <p class="hint">Party members in the same place as you fight in your battles, and you fight in theirs. Everyone earns XP and gold. Party chat goes only to the party.</p>
      <div class="row">${btn(isLeader()?'Disband party':'Leave party','ptleave','','ghost')}</div>`;}
  else h+=`<p class="hint">You're not in a party. Invite a friend or any online player from their profile.</p>`;
  h+=`</section>`;
  if(friendsOnline()){const fr=realFriendIds(),req=friendRequests(),sent=(myFriendDoc().list||[]).filter(u=>friendState(u)==='sent');
    h+=`<section class="panel realp"><h3>${icon('online')} Friends <small>${fr.filter(u=>NET.peerMap[u]).length}/${fr.length} online</small></h3>
      ${req.map(u=>`<div class="li invite"><span><b>${E(realName(u))}</b> wants to be friends</span><span class="row">${btn('Accept','fracc',u,'gilt tiny')}${btn('Decline','frno',u,'ghost tiny')}</span></div>`).join('')}
      <div class="list">${fr.map(u=>{const l=NET.peerMap[u],p=NET.players[u]||{};return `<div class="li"><button class="linkish" data-a="rprofile" data-v="${E(u)}">${avatar(realName(u),(l||p).cls||'warrior',1)} <b>${E(realName(u))}</b> <small>${l?`<span class="good">● online</span> · ${E(LOCS[l.loc]?LOCS[l.loc].n:'')}`:'○ offline'}${p.level?' · Lv.'+p.level:''}</small></button>${l&&!mates.some(m=>m.key===u)&&(!pt.lead||isLeader())?btn('Invite to party','ptinv',u,'tiny'):''}</div>`;}).join('')||'<p class="hint">No friends yet. Add someone by their username, or from their profile.</p>'}</div>
      ${sent.length?`<p class="hint">Waiting for: ${sent.map(u=>E(realName(u))).join(', ')}</p>`:''}
      <form data-form="fradd" class="row"><input name="name" placeholder="Username" maxlength="24" aria-label="Friend's username" required><button class="b tiny">Add friend</button></form></section>`;}
  return h;}
function realProfileButtons(id){if(id===NET.myKey)return '';const st=friendState(id),pt=myParty(),inParty=partyMates().some(m=>m.key===id),live=!!NET.peerMap[id];
  const fb=!friendsOnline()?'':st==='friends'?btn('Remove friend','frrem',id,'ghost'):st==='sent'?btn('Request sent','',id,'ghost'):st==='incoming'?btn('Accept friend request','fracc',id,'gilt'):btn('Add friend','fradd1',id);
  const pb=!live?'':inParty?btn('In your party','',id,'ghost'):partyInvitesToMe().some(p=>p.key===id)?btn('Join their party','ptjoin',id,'gilt'):(!pt.lead||isLeader())?btn('Invite to party','ptinv',id,'gilt'):'';
  return `<div class="row wrap">${fb}${pb}</div>`;}
Object.assign(ACT,{fradd1(id){friendAdd(id).then(()=>refreshModal());},fracc(id){friendAdd(id).then(()=>{UI.dirty=true;refreshModal();});},frno(id){friendDecline(id);},frrem(id){friendRemove(id).then(()=>refreshModal());},
  form_fradd(fd){const uid=findPlayerByName(fd.name);if(!uid){UI.toast(`No player named "${String(fd.name).slice(0,24)}" found. Check the spelling.`,'bad');return;}if(uid===NET.uid){UI.toast("That's you!");return;}friendAdd(uid);},
  ptinv(k){partyInvite(k);refreshModal();},ptjoin(k){partyAccept(k);refreshModal();},ptno(k){NET.dismissedInv=(NET.dismissedInv||[]).concat(k);UI.dirty=true;},
  ptleave(){partyLeave();},ptkick(k){partyKick(k);}});
