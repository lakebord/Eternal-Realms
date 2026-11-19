// Maintenance helper for the daily routine (docs/OPS.md). Reads and labels player reports in Supabase.
// Auth: the environment's network proxy adds the real `x-ops-token` header for this host; the value below is a
// placeholder that the proxy replaces. Without a saved token every call fails with "not allowed".
//   node tools/ops-feedback.js list [status=new|all|triaged|...] [days=30]
//   node tools/ops-feedback.js stats [days=7]
//   node tools/ops-feedback.js set <id> <status> "<notes>"     status: triaged|fixed|planned|wontfix|duplicate|new
const URL_='https://pwkgtcwwincfcrtxgmag.supabase.co/rest/v1/rpc/',KEY='sb_publishable_jkR7unxyo2jD__zpArlaCg_-wmVDcV6';
async function rpc(fn,args){const r=await fetch(URL_+fn,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json','x-ops-token':'placeholder-replaced-by-proxy-0000000000'},body:JSON.stringify(args)});
  const t=await r.text();if(!r.ok)throw new Error(`${fn}: HTTP ${r.status} ${t.slice(0,300)}`);return t?JSON.parse(t):null;}
(async()=>{const [cmd,a,b,c]=process.argv.slice(2);
  if(cmd==='list'){const rows=await rpc('ops_feedback',{p_status:a||'new',p_days:+(b||30),p_limit:300});
    for(const x of rows){const m=x.meta||{};console.log(`#${x.id} [${x.kind}] ${x.status} ${x.created_at.slice(0,16)} build=${m.build||'?'} lvl=${m.lvl??'-'} ${m.cls||''} @${m.loc||''} tab=${m.tab||''}${m.combat?' (combat)':''} ${(m.ua||'').replace(/.*\((.*?)\).*/,'$1').slice(0,40)}\n   ${String(x.msg).replace(/\n/g,'\n   ')}${x.notes?`\n   notes: ${x.notes}`:''}`);}
    console.log(`-- ${rows.length} report(s)`);}
  else if(cmd==='stats')console.log(JSON.stringify(await rpc('ops_feedback_stats',{p_days:+(a||7)}),null,1));
  else if(cmd==='set'){await rpc('ops_feedback_set',{p_id:+a,p_status:b,p_notes:c||null});console.log(`#${a} -> ${b}`);}
  else{console.log('usage: list [status] [days] | stats [days] | set <id> <status> "<notes>"');process.exit(1);}
})().catch(e=>{console.error(e.message);process.exit(1);});
