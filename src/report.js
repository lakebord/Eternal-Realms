/* ETERNAL REALMS — player reports.
   "Report a bug / Suggest" form (Menu tab) plus automatic error reports. Both go to the Supabase `feedback` table
   (see supabase/migrations/20261119000000_feedback.sql), which players can only add to — never read.
   Reports made offline are queued and sent the next time the game starts with a connection.
   The daily maintenance routine (docs/OPS.md) reads and triages them. */
'use strict';
const REPORT={sent:{},crashes:0,errs:[],queueKey:'er_fbq',kinds:[['bug','Bug'],['idea','Idea'],['balance','Balance'],['other','Other']]};
function reportCid(){try{let c=localStorage.getItem('er_cid');if(!c){c=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)).slice(0,36);localStorage.setItem('er_cid',c);}return c;}catch(e){return null;}}
function reportMeta(extra){const P=typeof S!=='undefined'&&S&&S.P;let host='';try{host=location.host||location.protocol;}catch(e){}
  return Object.assign({build:typeof BUILD_ID!=='undefined'?BUILD_ID:'dev',host,ua:(navigator.userAgent||'').slice(0,160),scr:`${innerWidth}x${innerHeight}@${devicePixelRatio||1}`,
    lvl:P?P.level:null,cls:P?P.cls:null,loc:P?P.loc:null,tab:typeof UI!=='undefined'?UI.tab:null,combat:typeof C!=='undefined'&&!!C,online:!!(typeof SUPA!=='undefined'&&SUPA.session),
    sound:typeof AUD!=='undefined'?!!AUD.on:null,errs:REPORT.errs.slice(-3)},extra||{});}
// automated browsers (our own tests) never send reports
function reportOff(){return !SUPA_CFG||!SUPA_CFG.url||(typeof navigator!=='undefined'&&navigator.webdriver);}
async function reportPost(row){const h={'apikey':SUPA_CFG.key,'Content-Type':'application/json','Prefer':'return=minimal'};
  try{if(typeof SUPA!=='undefined'&&SUPA.session&&SUPA.session.access_token)h.Authorization='Bearer '+SUPA.session.access_token;}catch(e){}
  const r=await fetch(SUPA_CFG.url+'/rest/v1/feedback',{method:'POST',headers:h,body:JSON.stringify(row)});
  if(!r.ok){let m='';try{m=(await r.json()).message||'';}catch(e){}const err=new Error(m||('HTTP '+r.status));err.status=r.status;throw err;}}
function reportQueue(row){try{const q=JSON.parse(localStorage.getItem(REPORT.queueKey)||'[]');q.push(row);localStorage.setItem(REPORT.queueKey,JSON.stringify(q.slice(-20)));}catch(e){}}
async function reportFlush(){if(reportOff())return;let q=[];try{q=JSON.parse(localStorage.getItem(REPORT.queueKey)||'[]');}catch(e){}if(!q.length)return;
  const left=[];for(const row of q){try{await reportPost(row);}catch(e){if(!e.status||e.status>=500)left.push(row);}}
  try{localStorage.setItem(REPORT.queueKey,JSON.stringify(left));}catch(e){}}
async function reportSend(kind,msg,meta){const row={kind,msg:String(msg).slice(0,2000),meta:reportMeta(meta),cid:reportCid()};if(reportOff())return 'off';
  try{await reportPost(row);return 'sent';}catch(e){if(e.status&&e.status<500)throw e;reportQueue(row);return 'queued';}}

/* ---------- automatic error reports (deduplicated, at most 5 per session) ---------- */
function reportCrash(message,src,line,col,stack){const msg=String(message||'error').slice(0,300);REPORT.errs.push(msg.slice(0,120));if(REPORT.errs.length>6)REPORT.errs.shift();
  if(reportOff()||REPORT.crashes>=5)return;if(src&&/^(chrome|moz|safari)-extension:|^webkit-masked-url:/.test(String(src)))return;   // ignore browser-extension noise
  if(/ResizeObserver loop|Script error\.?$/.test(msg))return;const key=msg+'|'+line;if(REPORT.sent[key])return;REPORT.sent[key]=1;REPORT.crashes++;
  const text=`${msg}${line?` @${line}:${col||0}`:''}${stack?'\n'+String(stack).split('\n').slice(0,8).join('\n'):''}`;
  setTimeout(()=>{reportSend('crash',text).catch(()=>{});},200);}
window.addEventListener('error',e=>{if(e&&e.message)reportCrash(e.message,e.filename,e.lineno,e.colno,e.error&&e.error.stack);});
window.addEventListener('unhandledrejection',e=>{const r=e&&e.reason;const m=r&&(r.message||String(r));if(!m||/Failed to fetch|NetworkError|Load failed|AbortError|play\(\) request|NotAllowedError/i.test(m))return;reportCrash('Unhandled: '+m,'',0,0,r&&r.stack);});
setTimeout(()=>{reportFlush().catch(()=>{});},8000);

/* ---------- the form ---------- */
function reportForm(kind,note){const k=kind||'bug';
  return `<h2>Report a bug / Suggest</h2><p class="hint">Tell us what went wrong or what would make the game better. Reports are read every day; fixes and good ideas go into the next update.</p>
  <form data-form="report" class="report"><div class="chtabs">${REPORT.kinds.map(([id,n])=>`<label class="ct ${id===k?'on':''}"><input type="radio" name="kind" value="${id}" ${id===k?'checked':''}>${n}</label>`).join('')}</div>
  <textarea name="msg" rows="6" maxlength="2000" required minlength="3" placeholder="${k==='bug'?'What happened? What were you doing just before? (e.g. “Fighting in Whisperwood, pressed Magic and the buttons froze”)':'Your idea or suggestion…'}"></textarea>
  <label class="row"><input type="checkbox" name="diag" checked> Include game info (level, class, location, device) to help fix it</label>
  ${note?`<p class="bad">${E(note)}</p>`:''}<div class="row">${btn('Cancel','close','','ghost')}<button class="b gilt" type="submit">Send report</button></div></form>`;}
Object.assign(ACT,{report(k){openModal(reportForm(k),'report');},
  async form_report(fd,f){const msg=(fd.msg||'').trim();if(msg.length<3)return;const b=f&&f.querySelector('[type=submit]');if(b){b.disabled=true;b.textContent='Sending…';}
    try{const r=await reportSend(fd.kind||'other',msg,fd.diag?null:{lvl:null,cls:null,loc:null,ua:null,scr:null,errs:[]});closeModal();
      UI.toast(r==='queued'?'Saved. Your report will be sent when you are back online.':r==='off'?'Reports are not available in this version.':'Thanks! Your report was sent.');}
    catch(e){openModal(reportForm(fd.kind,e.message||'Could not send. Please try again.'),'report');}}});
document.addEventListener('change',e=>{const t=e.target;if(t&&t.name==='kind'&&t.closest('form.report')){t.closest('.chtabs').querySelectorAll('.ct').forEach(l=>l.classList.toggle('on',l.contains(t)));}});
