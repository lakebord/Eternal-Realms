/* ETERNAL REALMS — persistence & real multiplayer (claude.ai artifact runtime when available; local otherwise) */
'use strict';
const LS_KEY='eternal_realms_save_v4';
// Server launch control. Everything saved before RESET_EPOCH (local or online) belongs to the pre-release test and is ignored.
const LAUNCH={open:true,resetEpoch:Date.UTC(2026,10,4,22,0,0)};
try{for(const k of ['eternal_realms_save_v3','eternal_realms_save_v3_t','eternal_realms_save_v2','eternal_realms_save_v2_t','er_inplay'])localStorage.removeItem(k);}catch(e){}
const NET={db:null,user:null,uid:null,room:null,sample:null,downloads:null,canWrite:false,ready:false,mode:'local',peers:0,peerList:[],realChat:{},players:{},myChat:[],mail:{},lastSend:0,muted:[],
  status:'Offline (local saves only)',cloudT:0,lastProfile:0,unsub:[]};

/* ---------- serialization ---------- */
function serialize(){return JSON.stringify(S,(k,v)=>{if(k==='byId'||k==='byLoc'||k==='stock'||(k&&k[0]==='_'))return undefined;return v;});}
async function compress(str){try{if(typeof CompressionStream==='undefined')throw 0;const cs=new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));const buf=await new Response(cs).arrayBuffer();
  let bin='';const b=new Uint8Array(buf);for(let i=0;i<b.length;i+=0x8000)bin+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return 'gz:'+btoa(bin);}catch(e){return 'js:'+str;}}
async function decompress(s){if(s.startsWith('js:'))return s.slice(3);if(s.startsWith('{'))return s;const bin=atob(s.slice(3));const b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);
  const ds=new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'));return await new Response(ds).text();}
function hydrate(obj){S=obj;if(S.P&&S.P.diff!=='normal')S.P.diff='normal';if(S.P&&!S.P.tiers)S.P.tiers={};for(const n of S.npcs){n.inParty=S.P&&S.P.party.includes(n.id);}reindex();if(!S.pmUnread)S.pmUnread={};if(!S.chat.pm)S.chat.pm={};if(!S.hall)S.hall=[];return S;}
async function saveLocal(pre){if(!S||!S.P)return false;try{const str=pre||await compress(serialize());localStorage.setItem(LS_KEY,str);localStorage.setItem(LS_KEY+'_t',String(Date.now()));return true;}catch(e){console.warn('local save failed',e);return false;}}
async function loadLocal(){try{const s=localStorage.getItem(LS_KEY);if(!s)return null;const t=+localStorage.getItem(LS_KEY+'_t')||0;return {t,obj:JSON.parse(await decompress(s))};}catch(e){console.warn('local load failed',e);return null;}}
function hasLocal(){try{return !!localStorage.getItem(LS_KEY);}catch(e){return false;}}
function wipeLocal(){try{localStorage.removeItem(LS_KEY);localStorage.removeItem(LS_KEY+'_t');}catch(e){}}

/* ---------- cloud (db) ---------- */
const CHUNK=180000;
async function saveCloud(pre){if(!NET.db||!NET.uid||!NET.canWrite||!S||!S.P)return false;
  try{const str=pre||await compress(serialize());const parts=[];for(let i=0;i<str.length;i+=CHUNK)parts.push(str.slice(i,i+CHUNK));const base='data/users/'+NET.uid;
    for(let i=0;i<parts.length;i++)await NET.db.doc(`${base}/save${i}`).set({d:parts[i]});
    const t=Date.now();await NET.db.doc(`${base}/meta`).set({chunks:parts.length,t,user:S.P.user,level:S.P.level,v:S.v});NET.cloudT=t;return true;}
  catch(e){console.warn('cloud save failed',e);if(e&&e.code==='invalid_argument'){NET.canWrite=false;NET.status='Read-only access: progress saves in this browser only';}return false;}}
async function loadCloud(){if(!NET.db||!NET.uid)return null;try{const base='data/users/'+NET.uid;const m=await NET.db.doc(`${base}/meta`).get();if(!m.exists)return null;const meta=m.data();if(!meta||!(meta.t>=LAUNCH.resetEpoch))return null;
  let str='';for(let i=0;i<meta.chunks;i++){const c=await NET.db.doc(`${base}/save${i}`).get();if(!c.exists)return null;str+=c.data().d;}
  return {t:meta.t,obj:JSON.parse(await decompress(str)),meta};}catch(e){console.warn('cloud load failed',e);return null;}}
async function peekCloud(){if(!NET.db||!NET.uid)return null;try{const m=await NET.db.doc('data/users/'+NET.uid+'/meta').get();const d=m.exists?m.data():null;return d&&d.t>=LAUNCH.resetEpoch?d:null;}catch(e){return null;}}
async function wipeCloud(){if(!NET.db||!NET.uid||!NET.canWrite)return;try{await NET.db.doc('data/users/'+NET.uid+'/meta').delete();await NET.db.doc('players/'+NET.uid).delete();}catch(e){}}
async function saveAll(manual){if(!S||!S.P)return false;const pre=await compress(serialize());   // build the save once, store it twice
  const a=await saveLocal(pre);const b=await saveCloud(pre);if(NET.uid&&NET.canWrite)publishProfile(true);if(manual&&typeof UI!=='undefined')UI.toast(b?'Saved to your account and this browser':a?'Saved in this browser':'Save failed',b||a?'':'bad');return a||b;}

/* ---------- public profile & real leaderboard ---------- */
function snapshotChar(P){const m={};for(const k in P.mastery)m[k]=P.mastery[k].lv;return {race:P.race,cls:P.cls,adv:P.adv,level:P.level,attr:P.attr,equip:P.equip,mastery:m,user:P.user};}
async function publishProfile(force){if(!NET.db||!NET.uid||!NET.canWrite||!S||!S.P)return;if(!force&&Date.now()-NET.lastProfile<60000)return;NET.lastProfile=Date.now();const P=S.P;
  const g=guild(P.guild);const craft=Math.max(...['smithing','alchemy','cooking','enchanting'].map(k=>mLv(P,k)));
  try{await NET.db.doc('players/'+NET.uid).set({user:P.user,name:P.name,race:P.race,cls:P.cls,adv:P.adv,level:P.level,fame:P.fame,gold:Math.round(P.gold),pvp:P.pvp,guild:g?g.name:null,loc:P.loc,
    kills:P.stats.kills,dungeons:P.stats.dungeons,bosses:P.stats.bosses,ach:P.ach.length,explored:P.explored.length,craft,power:stats(P).power,diff:P.diff,snap:snapshotChar(P),t:Date.now()});}
  catch(e){if(e&&e.code==='invalid_argument')NET.canWrite=false;}}

/* ---------- real chat ---------- */
const BAD=/\b(fuck|shit|cunt|nigg\w*|fag\w*|retard\w*|whore|slut)\b/gi;
function cleanText(t){return String(t).slice(0,220).replace(BAD,m=>m[0]+'*'.repeat(m.length-1));}
async function netSendChat(ch,text,to){if(!NET.room&&!(NET.db&&NET.canWrite))return false;const now=Date.now();if(now-NET.lastSend<2500){if(typeof UI!=='undefined')UI.toast('Slow down — one message every few seconds in shared chat.','bad');return false;}
  NET.lastSend=now;const msg={id:U.uid(),t:now,ch,text:cleanText(text).slice(0,200)};if(to)msg.to=to;NET.realChat[msg.id]=1;
  if(NET.room){NET.live.msgs.push(msg);NET.live.msgs=NET.live.msgs.slice(-5);netPresence(true);}
  if(!NET.db||!NET.uid||!NET.canWrite)return true;NET.myChat.push(msg);NET.myChat=NET.myChat.filter(m=>now-m.t<6*3600000).slice(-25);
  try{await NET.db.doc('chat/'+NET.uid).set({user:S.P.user,lvl:S.P.level,cls:S.P.cls,msgs:NET.myChat});return true;}catch(e){if(e&&e.code==='invalid_argument'){NET.canWrite=false;}return false;}}
function onChatSnapshot(snap){const now=Date.now();
  for(const d of snap.docs){if(d.id===NET.uid)continue;const v=d.data()||{};const msgs=Array.isArray(v.msgs)?v.msgs:[];
    for(const m of msgs){if(!m||!m.id||NET.realChat[m.id]||now-m.t>3*3600000||m.t<LAUNCH.resetEpoch)continue;NET.realChat[m.id]=1;if(NET.muted.includes(d.id))continue;
      const name=String(v.user||'Adventurer').slice(0,24);const text=cleanText(m.text||'');
      if(m.ch==='pm'){if(m.to!==NET.uid)continue;chatPush('pm','R:'+d.id,text,{with:'R:'+d.id,real:1,name,t:m.t});}
      else if(['global','trade','recruit'].includes(m.ch))chatPush(m.ch,'R:'+d.id,text,{real:1,name,t:m.t,lvl:v.lvl,cls:v.cls});
      else if(m.ch==='duel'&&m.to===NET.uid)chatPush('system','SYS',`⚔ ${name} ${text}`);}}}
function onPlayersSnapshot(snap){NET.players={};for(const d of snap.docs){const v=d.data();if(v&&v.user&&v.t>=LAUNCH.resetEpoch)NET.players[d.id]=v;}if(typeof UI!=='undefined')UI.refresh();}

/* ---------- courier mail (gold / items between real players) ---------- */
async function sendMail(toUid,gold,invIdx,note){const P=S.P;if(!NET.canWrite){UI.toast('You need write access to send parcels.','bad');return false;}
  gold=Math.max(0,Math.floor(gold||0));if(gold>P.gold){UI.toast('Not enough gold.','bad');return false;}let item=null;
  if(invIdx!=null&&invIdx>=0){const it=P.inv[invIdx];if(!it)return false;item=isGear(it)?it:{k:it.k,q:1};}
  if(!gold&&!item)return false;
  const cur=(NET.mail[NET.uid]||{out:[]}).out.filter(x=>Date.now()-x.t<7*86400000).slice(-20);const parcel={id:U.uid(),to:toUid,gold,item,note:cleanText(note||''),from:P.user,t:Date.now()};
  try{await NET.db.doc('mail/'+NET.uid).set({out:[...cur,parcel]});P.gold-=gold;if(item){if(isGear(P.inv[invIdx]))P.inv.splice(invIdx,1);else invRemove(P,item.k,1);}log(`Courier Tamsin takes your parcel for ${NET.players[toUid]?NET.players[toUid].user:'them'}.`,'good');saveAll();return true;}
  catch(e){UI.toast('The courier could not deliver right now.','bad');return false;}}
function onMailSnapshot(snap){if(!S||!S.P)return;const P=S.P;P.claimed=P.claimed||[];NET.mail={};
  for(const d of snap.docs){const v=d.data()||{};NET.mail[d.id]=v;if(d.id===NET.uid)continue;for(const p of (v.out||[])){if(p.to!==NET.uid||P.claimed.includes(p.id))continue;P.claimed.push(p.id);
    if(p.gold)P.gold+=Math.max(0,Math.min(1e7,p.gold|0));if(p.item&&typeof p.item==='object'){if(p.item.b&&ITEM_BASES[p.item.b])P.inv.push({b:p.item.b,l:U.clamp(p.item.l|0,1,100),r:U.clamp(p.item.r|0,0,4),a:(p.item.a||[]).filter(a=>AFFIXES[a]).slice(0,4),uid:U.uid(),u:UNIQUES[p.item.u]?p.item.u:undefined});else if(ITEMS[p.item.k])invAdd(P,p.item.k,1);}
    log(`📦 Parcel from ${String(p.from).slice(0,24)}: ${p.gold?p.gold+'g ':''}${p.item?itemName(p.item):''}${p.note?` — “${p.note}”`:''}`,'epic');if(typeof UI!=='undefined')UI.toast('A parcel arrived!','epic');}}}

/* ---------- init ---------- */
async function netInit(){
  const onClaude=typeof window!=='undefined'&&window.claude&&window.claude.use;
  if(!onClaude&&!(typeof supaWanted==='function'&&supaWanted())){NET.ready=true;return;}
  try{let db,user,room,sample=null,dl;
    if(onClaude)[db,user,room,sample,dl]=await Promise.all(['db','user','room','sample','downloads'].map(n=>window.claude.use(n).catch(()=>null)));
    else{NET.backend='supabase';const sv=await supaServices();if(!sv){NET.needAuth=true;NET.status='Sign in to play online';NET.ready=true;if(typeof UI!=='undefined')UI.refresh();return;}
      NET.needAuth=false;({db,user,room,downloads:dl}=sv);NET.guest=user.guest;NET.email=user.email;}
    NET.db=db;NET.user=user;NET.room=room;NET.sample=sample;NET.downloads=dl;
    if(user){NET.uid=await user.id();try{NET.isHost=!!(await user.canEdit());}catch(e){NET.isHost=false;}try{const c=await user.can('data.write');NET.canWrite=c!==false&&!!NET.uid;}catch(e){NET.canWrite=!!NET.uid;}}
    if(db&&NET.uid){NET.mode='online';NET.status=NET.canWrite?'Connected: saves sync to your account, shared chat live':'Connected read-only: you can read shared chat, saves stay in this browser';
      const t=setTimeout(()=>{if(!NET.chatOk)NET.status+=' (shared data not reachable yet)';},10000);
      NET.unsub.push(db.collection('chat').onSnapshot(s=>{NET.chatOk=1;clearTimeout(t);onChatSnapshot(s);},e=>console.warn('chat',e)));
      NET.unsub.push(db.collection('players').onSnapshot(onPlayersSnapshot,e=>console.warn('players',e)));
      NET.unsub.push(db.collection('mail').onSnapshot(onMailSnapshot,e=>console.warn('mail',e)));}
    NET.myKey=NET.uid||('anon-'+U.uid());
    if(room){try{room.onPeers(onPeers);if(NET.mode!=='online'){NET.mode='online';NET.status='Live room connected: chat and co-op with friends who are online now. Saves stay in this browser.';}}catch(e){console.warn('room',e);}}
    if(sample){AI.fn=async(prompt)=>{const r=await sample(prompt,{modelTier:'quick',cache:false});return r.text;};}
  }catch(e){console.warn('net init',e);}
  NET.ready=true;if(typeof UI!=='undefined')UI.refresh();
}
/* ---------- live room: presence carries roster, recent chat, combat snapshot, co-op state ---------- */
NET.live={msgs:[],rw:[],coop:{inv:null,with:null}};NET.peerMap={};NET.claimedRw={};
function combatSnap(P){const st=stats(P);const r=x=>Math.round(x);return {mhp:r(st.mhp),mmp:r(st.mmp),msp:r(st.msp),patk:r(st.patk),matk:r(st.matk),pdef:r(st.pdef),mdef:r(st.mdef),acc:r(st.acc),eva:+st.eva.toFixed(1),crit:+st.crit.toFixed(1),
  critDmg:r(st.critDmg),spd:r(st.spd),wt:st.wt,reach:st.reach?1:0,ranged:st.ranged?1:0,role:CLASSES[P.cls].role,skills:skillList(P).slice(0,12),race:P.race,cls:P.cls,adv:P.adv,lvl:P.level,power:st.power};}
let presT=0,presPending=false;
function netPresence(force){if(!NET.room||!S||!S.P)return;const now=Date.now();if(!force&&now-presT<1200){if(!presPending){presPending=true;setTimeout(()=>{presPending=false;netPresence(true);},1300);}return;}presT=now;
  const P=S.P;const g=guild(P.guild);
  try{NET.room.presence({uid:NET.myKey,user:P.user,lvl:P.level,cls:P.cls,race:P.race,adv:P.adv||null,loc:P.loc,hp:Math.round(P.hp/stats(P).mhp*100),fame:P.fame,pvp:P.pvp.r,guild:g?g.name:null,
    cs:combatSnap(P),msgs:NET.live.msgs.slice(-5),rw:NET.live.rw.slice(-5),coop:NET.live.coop,t:now});}catch(e){}}
function onPeers(ch){const map={};
  for(const p of ch.peers){if(p.isMe||!p.presence||!p.presence.user)continue;const v=p.presence;const key=String(v.uid||p.by||p.peer).slice(0,64);
    map[key]={key,guest:p.guest,user:String(v.user).slice(0,24),lvl:v.lvl|0,cls:CLASSES[v.cls]?v.cls:'warrior',race:RACES[v.race]?v.race:'human',adv:ADV_CLASSES[v.adv]?v.adv:null,loc:LOCS[v.loc]?v.loc:'crossroads',
      hp:v.hp|0,fame:v.fame|0,pvp:{r:v.pvp|0||1000},guild:v.guild?String(v.guild).slice(0,30):null,cs:v.cs,coop:v.coop||{},live:1,t:Date.now()};
    for(const m of (Array.isArray(v.msgs)?v.msgs:[])){if(!m||!m.id||NET.realChat[m.id])continue;NET.realChat[m.id]=1;if(NET.muted.includes(key))continue;const text=cleanText(m.text||'');
      if(m.ch==='pm'){if(m.to===NET.myKey)chatPush('pm','R:'+key,text,{with:'R:'+key,real:1,name:map[key].user});}
      else if(['global','trade','recruit','local'].includes(m.ch)){if(m.ch==='local'&&S&&S.P&&map[key].loc!==S.P.loc)continue;chatPush(m.ch,'R:'+key,text,{real:1,name:map[key].user});}}
    for(const r of (Array.isArray(v.rw)?v.rw:[])){if(!r||r.to!==NET.myKey||NET.claimedRw[r.id]||!S||!S.P)continue;NET.claimedRw[r.id]=1;S.P.claimedRw=S.P.claimedRw||[];if(S.P.claimedRw.includes(r.id))continue;S.P.claimedRw.push(r.id);if(S.P.claimedRw.length>200)S.P.claimedRw.shift();
      const xp=Math.max(0,Math.min(5e6,r.xp|0)),gold=Math.max(0,Math.min(1e6,r.gold|0));gainXp(xp);S.P.gold+=gold;log(`⚔ Fought alongside ${map[key].user}: +${U.fmt(xp)} XP, +${U.fmt(gold)}g.`,'good');}
    const old=NET.peerMap[key];if(map[key].coop.inv===NET.myKey&&(!old||old.coop.inv!==NET.myKey)&&NET.live.coop.with!==key){chatPush('system','SYS',`${map[key].user} invites you to adventure together. Open their profile to accept.`);if(typeof UI!=='undefined')UI.toast(`${map[key].user} invites you to co-op`,'epic');}
    if(old&&old.coop.with===NET.myKey&&map[key].coop.with!==NET.myKey&&NET.live.coop.with===key){NET.live.coop.with=null;chatPush('system','SYS',`${map[key].user} ended your co-op.`);netPresence();}}
  for(const k in NET.peerMap)if(!map[k]&&NET.live.coop.with===k)chatPush('system','SYS',`${NET.peerMap[k].user} left the realm. Your co-op pauses until they return.`);
  NET.peerMap=map;NET.peers=Object.keys(map).length;if(typeof UI!=='undefined'){UI.dirty=true;}}
function coopPartner(){const k=NET.live.coop.with;if(!k)return null;const p=NET.peerMap[k];if(!p||p.coop.with!==NET.myKey)return null;return p;}
function coopInvite(key){NET.live.coop.inv=key;const p=NET.peerMap[key];if(p&&p.coop.inv===NET.myKey){NET.live.coop.with=key;NET.live.coop.inv=null;chatPush('system','SYS',`You and ${p.user} are now adventuring together.`);}else chatPush('system','SYS',`Co-op invite sent to ${p?p.user:'them'}.`);netPresence(true);}
function coopEnd(){NET.live.coop={inv:null,with:null};netPresence(true);}
function coopReward(xp,gold){const p=coopPartner();if(!p)return;NET.live.rw.push({id:U.uid(),to:p.key,xp:Math.round(xp),gold:Math.round(gold)});NET.live.rw=NET.live.rw.slice(-5);netPresence(true);}
function actorFromSnap(cs,name,side){const a={ref:'live',name,side,level:cs.lvl|0,mhp:cs.mhp|0,hp:cs.mhp|0,mmp:cs.mmp|0,mp:cs.mmp|0,msp:cs.msp|0,sp:cs.msp|0,patk:+cs.patk||1,matk:+cs.matk||1,pdef:+cs.pdef||0,mdef:+cs.mdef||0,acc:+cs.acc||90,eva:+cs.eva||5,
  crit:+cs.crit||5,critDmg:+cs.critDmg||150,spd:+cs.spd||10,pen:0,el:{},res:{},steal:0,wt:cs.wt||'sword',reach:!!cs.reach,ranged:!!cs.ranged,row:['tank','dps'].includes(cs.role)?'front':'back',fx:{},cd:{},
  skills:(cs.skills||[]).filter(s=>SKILLS[s]),role:cs.role||'dps',cls:cs.cls,cat:'humanoid',b:[],w:[],r:[],race:cs.race,live:1};
  for(const k of ['mhp','patk','matk','pdef','mdef'])a[k]=Math.min(a[k],1e6);a.hp=a.mhp;return a;}
function realPlayer(key){const d=NET.players[key],l=NET.peerMap[key];if(!d&&!l)return null;return Object.assign({},d||{},l?{user:l.user,level:l.lvl,cls:l.cls,race:l.race,adv:l.adv,loc:l.loc,fame:l.fame,pvp:d&&d.pvp||l.pvp,guild:l.guild,power:l.cs&&l.cs.power,live:l,t:Date.now()}:{level:d.level});}
function saveLocalSync(){if(!S||!S.P)return;try{localStorage.setItem(LS_KEY,'js:'+serialize());localStorage.setItem(LS_KEY+'_t',String(Date.now()));}catch(e){}}
try{if(typeof window!=='undefined'&&window.claude&&window.claude.hot&&window.claude.hot.snapshot)window.claude.hot.snapshot(()=>{saveLocalSync();return {};});}catch(e){}

BUS.on(t=>{if(t==='player_arrive'||t==='player_level'||t==='player_adv')netPresence();});
