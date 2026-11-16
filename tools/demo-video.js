// Records a short battle demo WITH sound: page video (Playwright) + the game's own sound effects (captured from
// its Web Audio graph) + the soundtrack files, mixed with ffmpeg.   node tools/demo-video.js <out.mp4>
const {chromium,devices}=require('playwright');const path=require('path');const fs=require('fs');const {execFileSync}=require('child_process');
const out=path.resolve(process.argv[2]||'demo.mp4');const tmp=fs.mkdtempSync(path.join(require('os').tmpdir(),'erdemo-'));const root=path.join(__dirname,'..');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['Pixel 7'],colorScheme:'dark',viewport:{width:412,height:840},recordVideo:{dir:tmp,size:{width:412,height:840}}});const p=await ctx.newPage();const T0=Date.now();const at=()=>(Date.now()-T0)/1000;
await p.goto('file://'+path.join(root,'index.html'));await p.waitForTimeout(800);
await p.click('[data-a=newchar]');await p.fill('#cc_user','Aldric');await p.fill('#cc_name','Aldric Vane');await p.click('.ccside .b.gilt');await p.waitForFunction(()=>S&&S.P,null,{timeout:20000});
await p.evaluate(()=>{for(let i=0;i<22;i++)gainXp(4000);S.P._st=null;S.P.hp=stats(S.P).mhp;S.P.mp=stats(S.P).mmp;});await p.waitForTimeout(4300);
// sound on (effects only: the soundtrack is mixed in from the files afterwards) and start capturing
await p.evaluate(()=>{document.querySelectorAll('.toast').forEach(t=>t.remove());audStart();AUD.music=0;window.__d=AUD.ctx.createMediaStreamDestination();AUD.master.connect(__d);window.__ch=[];window.__r=new MediaRecorder(__d.stream);__r.ondataavailable=e=>__ch.push(e.data);__r.start(200);});
const recAt=at();const marks=[];
const fight=async(kind,turns)=>{marks.push([kind,at()]);
  await p.evaluate(kind=>{const P=S.P;P.hp=stats(P).mhp;P.mp=stats(P).mmp;if(kind==='boss'){const m=makeMonster('b_lich',P.level+1);m.mhp=Math.round(m.mhp*0.45);m.hp=m.mhp;startCombat([m],{title:'The Necropolis of Vel',noEscape:1});const me=C.allies[0];me.mhp*=8;me.hp=me.mhp;}else{P.loc='mine';ACT.hunt();}render();},kind);
  const ready=async()=>{for(let i=0;i<120;i++){if(await p.$('#combat [data-a=ca][data-v=attack]')||await p.$('#combat [data-a=cclose]'))return;await p.waitForTimeout(100);}};
  for(let t=0;t<turns;t++){await ready();if(await p.$('#combat [data-a=cclose]'))break;await p.waitForTimeout(450);if(t===turns-1)await p.evaluate(()=>{for(const e of C.enemies)if(e.hp>0)e.hp=1;});
    if(t%3===1&&t<turns-1){await (await p.$('#combat [data-a=cmenu][data-v=skills]')).click();await p.waitForTimeout(500);const sk=await p.$('#combat [data-a=cskill]:not([disabled])');if(sk)await sk.click();else{await (await p.$('#combat [data-a=cmenu][data-v=main]')).click();await p.waitForTimeout(200);await (await p.$('#combat [data-a=ca][data-v=attack]')).click();}}
    else await (await p.$(`#combat [data-a=ca][data-v=${t%3===2&&t<turns-1?'heavy':'attack'}]`)).click();
    await p.waitForTimeout(700);}
  await ready();await p.waitForTimeout(1500);await p.evaluate(()=>{clearTimeout(UI.ct);const c=document.querySelector('#combat [data-a=cclose]');if(c)c.click();else{C.ended=true;C=null;document.getElementById('combat').hidden=true;}});await p.waitForTimeout(400);};
await fight('combat',+process.env.MOB_TURNS||4);await fight('boss',+process.env.BOSS_TURNS||8);const endAt=at();
const b64=await p.evaluate(()=>new Promise(res=>{__r.onstop=async()=>{const bl=new Blob(__ch,{type:'audio/webm'});const fr=new FileReader();fr.onload=()=>res(fr.result.split(',')[1]);fr.readAsDataURL(bl);};__r.stop();}));
fs.writeFileSync(path.join(tmp,'sfx.webm'),Buffer.from(b64,'base64'));await ctx.close();await b.close();
const vid=path.join(tmp,fs.readdirSync(tmp).find(f=>f.startsWith('page')));const start=marks[0][1]-0.4,bossAt=marks[1][1],dur=endAt-start;
// audio: sfx (offset to where recording began) + combat track for the first fight + boss track for the second
const f=[`[1:a]adelay=${Math.round(Math.max(0,recAt-start)*1000)}:all=1,volume=2.2[sfx]`,
  `[2:a]atrim=0:${(bossAt-start).toFixed(2)},afade=t=in:d=0.4,afade=t=out:st=${(bossAt-start-0.8).toFixed(2)}:d=0.8,volume=0.55[m1]`,
  `[3:a]atrim=0:${(endAt-bossAt).toFixed(2)},afade=t=in:d=0.3,afade=t=out:st=${(endAt-bossAt-1).toFixed(2)}:d=1,adelay=${Math.round((bossAt-start)*1000)}:all=1,volume=0.55[m2]`,
  `[sfx][m1][m2]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.95[a]`].join(';');
execFileSync('ffmpeg',['-loglevel','error','-y','-ss',start.toFixed(2),'-i',vid,'-i',path.join(tmp,'sfx.webm'),'-i',path.join(root,'assets/mus_combat.mp3'),'-i',path.join(root,'assets/mus_boss.mp3'),'-filter_complex',f,'-map','0:v','-map','[a]','-t',dur.toFixed(2),'-c:v','libx264','-pix_fmt','yuv420p','-crf','24','-c:a','aac','-b:a','128k','-movflags','+faststart',out]);
console.log('wrote',out,dur.toFixed(1)+'s','boss at',(bossAt-start).toFixed(1)+'s');})();
