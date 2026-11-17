// Records the advert: vertical 1080x1920, ~30 s, real gameplay with captions, sound effects and the boss theme.
//   node tools/ad-video.js <out.mp4>
// No simulated players, chat or "online" counts appear anywhere in it.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const {execFileSync}=require('child_process');
const out=path.resolve(process.argv[2]||'ad.mp4');const tmp=fs.mkdtempSync(path.join(require('os').tmpdir(),'erad-'));const root=path.join(__dirname,'..');
const SITE=process.env.SITE||'eternal-realms-26r.pages.dev';
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:412,height:732},deviceScaleFactor:2.6214,isMobile:true,hasTouch:true,colorScheme:'dark',recordVideo:{dir:tmp,size:{width:1080,height:1920}},
  userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'});
const p=await ctx.newPage();const T0=Date.now();const at=()=>(Date.now()-T0)/1000;
await p.goto('file://'+path.join(root,'index.html'));
// ad dressing: captions, scene fades, and nothing that shows simulated players
await p.addStyleTag({content:`
 #ticker,#toasts,.tbody,.tfoot,.title .tag,#view .panel:has(.people),#side,.maphint{display:none!important}
 #adfade{position:fixed;inset:0;background:#000;z-index:9998;opacity:1;transition:opacity .35s;pointer-events:none}
 #adcap{position:fixed;left:0;right:0;bottom:0;z-index:9997;text-align:center;pointer-events:none;opacity:0;transform:translateY(16px);transition:opacity .4s,transform .4s}
 #adcap.on{opacity:1;transform:none}
 #adcap b{display:inline-block;font-family:"IM Fell English SC",serif;font-weight:400;font-size:27px;letter-spacing:.06em;color:#ffe9a8;padding:0 .4em;text-shadow:0 0 18px #e0b45e99,0 2px 4px #000}
 #adcap{padding:22px 10px 12px;background:linear-gradient(180deg,#0000,#000c 38%,#000e)}
 #adcap div{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:7px}
 #adcap span{font-family:"Alegreya Sans",sans-serif;font-weight:700;font-size:14.5px;color:#16110a;background:linear-gradient(180deg,#ffe9a8,#e0b45e);padding:.22em .7em;border-radius:20px;box-shadow:0 2px 8px #000a;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s}
 #adcap.on span{opacity:1;transform:none}#adcap.on span:nth-child(2){transition-delay:.18s}#adcap.on span:nth-child(3){transition-delay:.36s}
 #adend{position:fixed;inset:0;z-index:9996;display:none;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:18%;text-align:center;gap:14px;background:linear-gradient(180deg,#0000 30%,#000c 70%,#000e)}
 #adend.on{display:flex}
 #adend h2{font-family:"IM Fell English SC",serif;font-weight:400;font-size:38px;margin:0;color:#ffe9a8;letter-spacing:.08em;text-shadow:0 0 24px #e0b45e,0 2px 4px #000;animation:adpop .7s cubic-bezier(.2,1.3,.4,1) both}
 #adend .url{font-family:"JetBrains Mono",monospace;font-size:16.5px;color:#fff;padding:.55em 1em;border:1px solid #a9823a;border-radius:12px;background:#16110acc;animation:adpop .7s .25s cubic-bezier(.2,1.3,.4,1) both}
 #adend p{font-family:"Alegreya Sans",sans-serif;font-size:17px;color:#e6dfcc;margin:0;animation:adpop .7s .45s both}
 @keyframes adpop{from{opacity:0;transform:translateY(20px) scale(.9)}}
 .title.t2{justify-content:center!important}.title.t2 .logo{font-size:4.6rem!important}
`});
await p.evaluate(()=>{for(const [id,html] of [['adfade',''],['adcap',''],['adend','']]){const d=document.createElement('div');d.id=id;d.innerHTML=html;document.body.appendChild(d);}});
const fade=async(on)=>{await p.evaluate(on=>{document.getElementById('adfade').style.opacity=on?1:0;},on);await p.waitForTimeout(on?380:60);};
const cap=async(t,s)=>p.evaluate(([t,s])=>{const c=document.getElementById('adcap');c.classList.remove('on');if(!t)return;setTimeout(()=>{c.innerHTML=`<b>${t}</b><div>${(s||[]).map(x=>`<span>${x}</span>`).join('')}</div>`;c.classList.add('on');},180);},[t,s]);
await p.waitForTimeout(1500);const marks={};
// ---- preparation (not in the advert): make the hero, level and equip him, start capturing sound
await p.click('[data-a=newchar]',{force:true}).catch(()=>p.evaluate(()=>ACT.newchar()));await p.waitForTimeout(250);
await p.fill('#cc_user','Aldric');await p.fill('#cc_name','Aldric Vane');await p.evaluate(()=>{CC.gender='male';CC.cls='warrior';});await p.click('.ccside .b.gilt');await p.waitForFunction(()=>S&&S.P&&UI.started,null,{timeout:20000});
await p.evaluate(()=>{const P=S.P;for(let i=0;i<24;i++)gainXp(4000);ACT.autoalloc();const mk=(b,r)=>makeGear(b,P.level,r);P.equip.weapon=mk('greatsword',3);for(const sl of ['head','chest','legs','hands','feet'])P.equip[sl]=mk(sl+'_plate',2);dirty(P);P.hp=stats(P).mhp;P.mp=stats(P).mmp;P.sp=stats(P).msp;P.loc='necropolis';if(!P.explored.includes('necropolis'))P.explored.push('necropolis');});
await p.waitForTimeout(4800);
await p.evaluate(()=>{document.querySelectorAll('.flash,.cbanner,.toast').forEach(e=>e.remove());ACT.title();});await p.waitForTimeout(1600);
await p.evaluate(()=>{audStart();AUD.music=0;window.__d=AUD.ctx.createMediaStreamDestination();AUD.master.connect(__d);window.__ch=[];window.__r=new MediaRecorder(__d.stream);__r.ondataavailable=e=>__ch.push(e.data);__r.start(200);});marks.rec=at();
// ---- 1. title
marks.start=at();await fade(false);await p.waitForTimeout(700);await cap('A dark-fantasy RPG',['Free to play','Browser + Android']);await p.waitForTimeout(2500);await cap();
// ---- 2. choose a class
await fade(true);await p.evaluate(()=>{CC.step=2;CC.cls='warrior';renderCreate();scrollTo(0,0);});await p.waitForTimeout(150);
await fade(false);await cap('Build your hero',['20 classes','10 races','234 skills']);
for(const c of ['knight','rogue','necromancer','paladin','mage']){await p.waitForTimeout(470);await p.evaluate(c=>{ACT.cc('cls|'+c);const el=document.querySelector('.pk.on');if(el)el.scrollIntoView({block:'center',behavior:'smooth'});},c);}
await p.waitForTimeout(650);await cap();
// ---- 3. the world
await fade(true);await p.evaluate(()=>{CC.cls='warrior';startGame();});await p.waitForFunction(()=>UI.started,null,{timeout:20000});await p.evaluate(()=>{UI.tab='world';UI.dirty=true;render();scrollTo(0,0);});await p.waitForTimeout(300);
await fade(false);await cap('Explore the Realms',['38 locations','11 dungeons','Towns, shops & quests']);await p.waitForTimeout(1500);
await p.evaluate(()=>scrollTo({top:150,behavior:'smooth'}));await p.waitForTimeout(1200);
await p.evaluate(()=>{UI.tab='map';UI.dirty=true;render();scrollTo(0,0);});await p.waitForTimeout(1900);await cap();
// ---- 4. battle
await fade(true);await p.evaluate(()=>{const P=S.P;const en=[makeMonster('death_knight_m',P.level),makeMonster('wraith',P.level-1)];for(const e of en){e.mhp=Math.round(e.mhp*1.6);e.hp=e.mhp;}startCombat(en,{title:'Necropolis of Vel'});const me=C.allies[0];me.mhp*=4;me.hp=me.mhp;render();});
await fade(false);await p.waitForTimeout(1000);await cap('Turn-based battles',['18 weapon types','8 magic elements','89 monsters']);
const ready=async()=>{for(let i=0;i<120;i++){if(await p.$('#combat [data-a=ca][data-v=attack]')||await p.$('#combat [data-a=cclose]'))return;await p.waitForTimeout(80);}};
const spell=async(e,n)=>p.evaluate(([e,n])=>{const me=C.allies[0],t=alive(C.enemies)[C.target]||alive(C.enemies)[0];if(!t)return;clog(`${me.name} uses ${n}!`,'skill');vfx('cast',me,{n,k:'mag',e});const r=damage(me,t,{kind:'mag',power:1.5,ranged:true});r.e=e;me._mode='spell';applyHit(me,t,r,'hits');C.waiting=false;endTurn(me);C.oi++;UI.runCombat(true);},[e,n]);
await ready();await p.waitForTimeout(250);await (await p.$('#combat [data-a=ca][data-v=attack]')).click();await p.waitForTimeout(500);
await ready();await p.waitForTimeout(250);await spell('fire','Flame Strike');await p.waitForTimeout(500);
await ready();await p.waitForTimeout(250);await cap();await spell('lightning','Thunder Cleave');await p.waitForTimeout(900);
// ---- 4b. loot & gear
await fade(true);await p.evaluate(()=>{clearTimeout(UI.ct);C=null;document.getElementById('combat').hidden=true;const P=S.P;P.inv=P.inv.filter(x=>!x.b).slice(0,2);for(const [b,r] of [['greataxe',4],['chest_plate',3],['amulet',4],['bow',2],['head_plate',3],['ring',2],['staff',3],['shield',1]])P.inv.push(makeGear(b,P.level,r));UI.tab='bag';UI.dirty=true;render();const el=[...document.querySelectorAll('#view h3')].find(h=>/^Bag/.test(h.textContent));if(el)scrollTo(0,el.getBoundingClientRect().top+scrollY-110);});await p.waitForTimeout(200);
await fade(false);await cap('Loot and gear up',['5 rarities','7 armor sets','47 crafting recipes']);await p.waitForTimeout(1400);await p.evaluate(()=>scrollBy({top:170,behavior:'smooth'}));await p.waitForTimeout(1300);await cap();
// ---- 5. boss
await fade(true);await p.evaluate(()=>{const P=S.P;P.hp=stats(P).mhp;const m=makeMonster('b_dragon',P.level+2);startCombat([m],{title:'Lair of Pyrrhax',noEscape:1});const me=C.allies[0];me.mhp*=5;me.hp=me.mhp;render();});
marks.boss=at();await fade(false);await p.waitForTimeout(1900);await cap('Hunt legendary bosses',['25 bosses','Solo or co-op','Rare loot']);
await ready();await p.waitForTimeout(300);await spell('frost','Glacial Edge');await p.waitForTimeout(600);
await ready();await cap();await p.waitForTimeout(250);await p.evaluate(()=>{for(const e of C.enemies)if(e.hp>0)e.hp=1;});await (await p.$('#combat [data-a=ca][data-v=heavy]')).click();
await p.waitForTimeout(3000);
// ---- 6. end card
await fade(true);await p.evaluate(()=>{clearTimeout(UI.ct);ACT.title();});await p.waitForTimeout(700);
await p.evaluate(site=>{const e=document.getElementById('adend');e.innerHTML=`<h2>Play free now</h2><div class="url">${site}</div><p>In your browser · Android app</p>`;},SITE);
await fade(false);await p.waitForTimeout(500);await p.evaluate(()=>document.getElementById('adend').classList.add('on'));await p.waitForTimeout(3300);marks.end=at();
const b64=await p.evaluate(()=>new Promise(res=>{__r.onstop=()=>{const fr=new FileReader();fr.onload=()=>res(fr.result.split(',')[1]);fr.readAsDataURL(new Blob(__ch,{type:'audio/webm'}));};__r.stop();}));
fs.writeFileSync(path.join(tmp,'sfx.webm'),Buffer.from(b64,'base64'));await ctx.close();await b.close();
const vid=path.join(tmp,fs.readdirSync(tmp).find(f=>f.startsWith('page')));const start=marks.start,dur=marks.end-start;
const f=[`[1:a]adelay=${Math.round(Math.max(0,marks.rec-start)*1000)}:all=1,volume=2.0[sfx]`,
  `[2:a]atrim=0:${dur.toFixed(2)},afade=t=in:d=0.6,afade=t=out:st=${(dur-1.6).toFixed(2)}:d=1.6,volume=0.6[m]`,
  `[sfx][m]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[a]`,`[0:v]fade=t=in:d=0.5,fade=t=out:st=${(dur-0.6).toFixed(2)}:d=0.6[v]`].join(';');
execFileSync('ffmpeg',['-loglevel','error','-y','-ss',start.toFixed(2),'-i',vid,'-i',path.join(tmp,'sfx.webm'),'-i',path.join(root,'assets/mus_boss.mp3'),'-filter_complex',f,'-map','[v]','-map','[a]','-t',dur.toFixed(2),'-r','30','-c:v','libx264','-preset','slow','-pix_fmt','yuv420p','-crf','21','-c:a','aac','-b:a','160k','-movflags','+faststart',out]);
console.log('wrote',out,dur.toFixed(1)+'s',JSON.stringify(marks));})();
