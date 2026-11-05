/* ETERNAL REALMS — Supabase backend. Used when the game runs outside claude.ai (own website / Android app).
   Exposes the same small db / user / room surface the game already uses, so the rest of the code does not care
   which backend is underneath. Security lives in the database (see supabase/migrations). */
'use strict';
// The live site uses the real database. The test site (next.<project>.pages.dev) must NEVER touch it:
// it uses SUPA_TEST, and while that is empty the test site simply runs offline with local saves.
const SUPA_LIVE={url:'https://pwkgtcwwincfcrtxgmag.supabase.co',key:'sb_publishable_jkR7unxyo2jD__zpArlaCg_-wmVDcV6'};
const SUPA_TEST={url:'',key:''};
const IS_TEST_SITE=typeof location!=='undefined'&&/^next\./.test(location.hostname);
const SUPA_CFG=Object.assign({lib:'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'},IS_TEST_SITE?SUPA_TEST:SUPA_LIVE);
const SUPA={client:null,session:null,channels:[]};
function supaWanted(){if(typeof window==='undefined'||(window.claude&&window.claude.use)||!SUPA_CFG.url)return false;return location.protocol!=='file:'||/[?&]online\b/.test(location.search);}
function supaLoadLib(){if(window.supabase&&window.supabase.createClient)return Promise.resolve();
  return new Promise((res,rej)=>{const s=document.createElement('script');s.src=SUPA_CFG.lib;s.onload=res;s.onerror=()=>rej(new Error('Could not load the online service'));document.head.appendChild(s);});}
async function supaClient(){if(SUPA.client)return SUPA.client;await supaLoadLib();
  SUPA.client=window.supabase.createClient(SUPA_CFG.url,SUPA_CFG.key,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'er_auth'}});return SUPA.client;}
async function supaSession(){const c=await supaClient();const {data}=await c.auth.getSession();SUPA.session=data.session||null;return SUPA.session;}

/* ---------- sign in / sign up / guest / sign out / delete ---------- */
function supaErr(e){const m=(e&&e.message)||String(e);return /Invalid login/i.test(m)?'Wrong email or password.':/already registered/i.test(m)?'That email already has an account. Sign in instead.':/Email not confirmed/i.test(m)?'Check your inbox and tap the confirmation link first.':/Anonymous sign-ins are disabled/i.test(m)?'Guest play is not switched on yet.':m;}
async function supaSignIn(email,pw){const c=await supaClient();const {data,error}=await c.auth.signInWithPassword({email,password:pw});if(error)throw new Error(supaErr(error));SUPA.session=data.session;return data.session;}
async function supaSignUp(email,pw){const c=await supaClient();const {data,error}=await c.auth.signUp({email,password:pw,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw new Error(supaErr(error));SUPA.session=data.session||null;return data.session;}
async function supaGuest(){const c=await supaClient();const {data,error}=await c.auth.signInAnonymously();if(error)throw new Error(supaErr(error));SUPA.session=data.session;return data.session;}
async function supaSignOut(){const c=await supaClient();for(const ch of SUPA.channels)try{c.removeChannel(ch);}catch(e){}SUPA.channels=[];await c.auth.signOut();SUPA.session=null;}
async function supaDeleteAccount(){const c=await supaClient();const {error}=await c.rpc('delete_my_account');if(error)throw new Error(supaErr(error));await supaSignOut();}

/* ---------- db: doc(path).get/set/delete and collection(name).onSnapshot ---------- */
function supaRef(path){const p=String(path).split('/');
  if(p[0]==='data'&&p[1]==='users')return {tbl:'user_docs',id:p.slice(3).join('/'),priv:true};
  return {tbl:'docs',col:p[0],id:p.slice(1).join('/')};}
function supaWrap(err){const e=new Error(err.message||'database error');e.code=err.code==='42501'?'permission_denied':err.code==='P0001'?'rate_limited':'unavailable';return e;}
function supaDoc(c,path){const r=supaRef(path);const uid=SUPA.session&&SUPA.session.user.id;
  const q=()=>r.priv?c.from('user_docs').select('data').eq('owner',uid).eq('id',r.id):c.from('docs').select('data').eq('col',r.col).eq('id',r.id);
  return {
    async get(){const {data,error}=await q().maybeSingle();if(error)throw supaWrap(error);return {exists:!!data,data:()=>data?data.data:undefined,id:r.id};},
    async set(obj){const row=r.priv?{owner:uid,id:r.id,data:obj}:{col:r.col,id:r.id,owner:uid,data:obj};
      const {error}=await c.from(r.tbl).upsert(row,{onConflict:r.priv?'owner,id':'col,id'});if(error)throw supaWrap(error);},
    async delete(){const {error}=r.priv?await c.from('user_docs').delete().eq('owner',uid).eq('id',r.id):await c.from('docs').delete().eq('col',r.col).eq('id',r.id);if(error)throw supaWrap(error);}};}
function supaCollection(c,col){return {onSnapshot(cb,onErr){const rows=new Map();let alive=true;
  const emit=()=>{if(!alive)return;const docs=[...rows.entries()].map(([id,data])=>({id,exists:true,data:()=>data}));try{cb({docs});}catch(e){console.warn(e);}};
  c.from('docs').select('id,data').eq('col',col).limit(500).then(({data,error})=>{if(error){if(onErr)onErr(supaWrap(error));return;}for(const d of data||[])rows.set(d.id,d.data);emit();});
  const ch=c.channel('docs-'+col).on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'col=eq.'+col},p=>{
    if(p.eventType==='DELETE'){if(p.old&&p.old.id)rows.delete(p.old.id);}else if(p.new){rows.set(p.new.id,p.new.data);}emit();}).subscribe();
  SUPA.channels.push(ch);return ()=>{alive=false;try{c.removeChannel(ch);}catch(e){}};}};}

/* ---------- room: live presence (who is online, co-op, quick messages) ---------- */
function supaRoom(c,uid){
  // Supabase limits how often one player may update their presence (too often and the server closes the channel).
  // So: every state change is BROADCAST instantly (cheap, meant for frequent messages), while presence itself is
  // re-tracked at most every PRES_GAP ms with the latest state, so late joiners still see everyone.
  const PRES_GAP=8000,BC_GAP=350,GRACE=12000;
  let ch=null,handler=null,ready=false,latest=null,lastTrack=0,trackT=0,lastBc=0,bcT=0,lastSig='',closedT=0;
  const known=new Map();   // key -> {meta, seen}
  const fire=(force)=>{if(!handler)return;const now=Date.now();const st=ch&&ready?ch.presenceState():{};
    for(const [key,metas] of Object.entries(st)){const meta=metas&&metas[metas.length-1];const k=known.get(key);
      if(meta&&(!k||(meta.t||0)>=(k.meta.t||0)))known.set(key,{meta,seen:now});else if(k)k.seen=now;}
    for(const [key,v] of known)if(key!==uid&&now-v.seen>GRACE)known.delete(key);
    const peers=[...known.entries()].map(([key,v])=>({isMe:key===uid,presence:v.meta,by:key,peer:key,guest:false}));
    const sig=JSON.stringify(peers.map(p=>[p.by,p.presence&&p.presence.t]));if(!force&&sig===lastSig)return;lastSig=sig;
    try{handler({peers});}catch(e){console.warn(e);}};
  const doTrack=()=>{trackT=0;if(!ready||!latest)return;lastTrack=Date.now();ch.track(latest).catch(()=>{});};
  const doBroadcast=()=>{bcT=0;if(!ready||!latest)return;lastBc=Date.now();ch.send({type:'broadcast',event:'p',payload:{k:uid,m:latest}}).catch(()=>{});};
  const join=()=>{ready=false;ch=c.channel('realm',{config:{presence:{key:uid},broadcast:{self:false}}});
    ch.on('presence',{event:'sync'},()=>fire(false))
      .on('broadcast',{event:'p'},({payload})=>{if(!payload||!payload.k||!payload.m||payload.k===uid)return;const k=known.get(payload.k);
        if(!k||(payload.m.t||0)>=(k.meta.t||0)){known.set(String(payload.k).slice(0,64),{meta:payload.m,seen:Date.now()});fire(true);}else k.seen=Date.now();})
      .on('system',{},m=>{if(m&&m.status&&m.status!=='ok')console.warn('realm system',JSON.stringify(m).slice(0,200));})
      .subscribe((s,err)=>{if(s==='SUBSCRIBED'){ready=true;closedT=0;doTrack();doBroadcast();}
        else if(s==='CLOSED'||s==='CHANNEL_ERROR'||s==='TIMED_OUT'){ready=false;if(!closedT){closedT=Date.now();   // reconnect on our own
          setTimeout(()=>{try{c.removeChannel(ch);}catch(e){}SUPA.channels=SUPA.channels.filter(x=>x!==ch);closedT=0;join();},5000);}}});
    SUPA.channels.push(ch);};
  join();setInterval(()=>{fire(false);if(ready&&latest&&Date.now()-lastTrack>30000)doTrack();},4000);
  return {onPeers(fn){handler=fn;fire(true);},
    presence(obj){latest=obj;known.set(uid,{meta:obj,seen:Date.now()});const now=Date.now();
      if(!bcT){const wait=Math.max(0,BC_GAP-(now-lastBc));bcT=setTimeout(doBroadcast,wait);}
      if(!trackT){const wait=Math.max(0,PRES_GAP-(now-lastTrack));trackT=setTimeout(doTrack,wait);}}};}

/* ---------- the services netInit() asks for ---------- */
async function supaServices(){const s=await supaSession();if(!s)return null;const c=SUPA.client;const uid=s.user.id;
  const db={doc:p=>supaDoc(c,p),collection:n=>supaCollection(c,n)};
  const user={id:async()=>uid,canEdit:async()=>{const {data}=await c.rpc('is_admin');return !!data;},can:async()=>true,guest:!!s.user.is_anonymous,email:s.user.email||null};
  const downloads={save:async({filename,data})=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'text/plain'}));a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}};
  return {db,user,room:supaRoom(c,uid),downloads};}
