/* ETERNAL REALMS — visual effects: particle layer, combat VFX, animated HP bars, ambient weather, animated title scene */
'use strict';
const FX={on:true,parts:[],raf:0,cv:null,g:null,dpr:1};
const ELEM_COL={fire:['#ff8a3a','#ffd36a'],frost:['#9fe2ff','#ffffff'],lightning:['#fff27a','#8fd0ff'],holy:['#fff4b0','#ffffff'],shadow:['#a070ff','#3a1a6a'],nature:['#8fe06a','#d8ff9a'],
  poison:['#b8e84a','#5a8a1a'],arcane:['#d79cff','#7a8cff'],phys:['#ffffff','#ff5a4a'],heal:['#9fe07a','#e8ffd0'],buff:['#ffd36a','#fff4c0'],debuff:['#b06aff','#ff6a8a'],gold:['#ffd36a','#e0a030']};
function fxReduced(){return !FX.on||matchMedia('(prefers-reduced-motion: reduce)').matches;}
function fxCanvas(){if(FX.cv)return;const c=document.createElement('canvas');c.id='vfx';c.setAttribute('aria-hidden','true');document.body.appendChild(c);FX.cv=c;FX.g=c.getContext('2d');fxResize();addEventListener('resize',fxResize);}
function fxResize(){if(!FX.cv)return;FX.dpr=Math.min(2,devicePixelRatio||1);FX.cv.width=innerWidth*FX.dpr;FX.cv.height=innerHeight*FX.dpr;}
function fxLoop(){const g=FX.g;g.setTransform(FX.dpr,0,0,FX.dpr,0,0);g.clearRect(0,0,innerWidth,innerHeight);const now=performance.now();
  FX.parts=FX.parts.filter(p=>{const t=(now-p.t0)/p.life;if(t>=1)return false;if(t<0)return true;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=p.drag;p.vy*=p.drag;const a=p.fade?1-t:1;g.globalAlpha=Math.max(0,a);
    if(p.k==='spark'){g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,Math.max(0.1,p.s*(1-t*0.6)),0,7);g.fill();}
    else if(p.k==='streak'){g.strokeStyle=p.c;g.lineWidth=p.s;g.lineCap='round';g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*3,p.y-p.vy*3);g.stroke();}
    else if(p.k==='ring'){g.strokeStyle=p.c;g.lineWidth=p.s*(1-t);g.beginPath();g.arc(p.x,p.y,Math.max(0.1,p.r0+p.r1*t),0,7);g.stroke();}
    else if(p.k==='slash'){const L=p.r1*Math.min(1,t*3);g.strokeStyle=p.c;g.lineWidth=p.s*(1-t);g.lineCap='round';g.shadowColor=p.c;g.shadowBlur=12;g.beginPath();g.moveTo(p.x-Math.cos(p.ang)*L,p.y-Math.sin(p.ang)*L);g.lineTo(p.x+Math.cos(p.ang)*L,p.y+Math.sin(p.ang)*L);g.stroke();g.shadowBlur=0;}
    else if(p.k==='bolt'){g.strokeStyle=p.c;g.lineWidth=2.5;g.shadowColor=p.c;g.shadowBlur=14;g.beginPath();let x=p.x,y=p.y-120;g.moveTo(x,y);for(let k=0;k<7;k++){x+=(Math.random()-0.5)*26;y+=120/7;g.lineTo(x,y);}g.stroke();g.shadowBlur=0;}
    else if(p.k==='glow'){const R=Math.max(0.1,p.r0+p.r1*t);const rg=g.createRadialGradient(p.x,p.y,0,p.x,p.y,R);rg.addColorStop(0,p.c);rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.beginPath();g.arc(p.x,p.y,R,0,7);g.fill();}
    else if(p.k==='rect'){g.fillStyle=p.c;g.save();g.translate(p.x,p.y);g.rotate(p.rot+=p.vr);g.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6);g.restore();}
    return true;});
  g.globalAlpha=1;FX.raf=FX.parts.length?requestAnimationFrame(fxLoop):0;}
function fxAdd(p){if(fxReduced())return;fxCanvas();FX.parts.push(Object.assign({t0:performance.now(),life:700,vx:0,vy:0,g:0,drag:0.96,s:3,fade:1,k:'spark',rot:0,vr:0},p));if(!FX.raf)FX.raf=requestAnimationFrame(fxLoop);}
function burst(x,y,cols,n=14,sp=4,opt={}){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=sp*(0.4+Math.random());fxAdd(Object.assign({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(opt.up||0),c:cols[i%cols.length],s:1.5+Math.random()*2.5,life:450+Math.random()*450,g:opt.g||0.05,k:opt.k||'spark'},opt.p||{}));}}
function centerOf(el){const r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height*0.45,r];}
function fxHit(el,e,crit){const [x,y]=centerOf(el);const C2=ELEM_COL[e]||ELEM_COL.phys;
  if(!e||e==='phys'){fxAdd({k:'slash',x,y,ang:-0.7+Math.random()*0.4,r1:46,s:crit?6:4,c:'#ffffff',life:320});fxAdd({k:'slash',x,y,ang:0.75,r1:38,s:3,c:'#ff6a5a',life:300,t0:performance.now()+60});burst(x,y,['#ffffff','#ff6a5a','#ffd0a0'],crit?22:12,crit?6:4,{k:'streak',g:0.08});}
  else{if(e==='lightning'){fxAdd({k:'bolt',x,y,c:C2[0],life:260});fxAdd({k:'bolt',x:x+10,y,c:C2[1],life:200});}
    fxAdd({k:'glow',x,y,r0:6,r1:crit?80:55,c:C2[0]+'aa',life:420});fxAdd({k:'ring',x,y,r0:8,r1:crit?70:48,s:3,c:C2[0],life:450});
    burst(x,y,C2,crit?28:16,e==='frost'?3:4.5,{g:e==='fire'?-0.04:0.03,up:e==='fire'||e==='holy'?1.2:0});}
  if(crit){fxAdd({k:'ring',x,y,r0:10,r1:110,s:5,c:'#ffd36a',life:500});flashScreen('#ffd36a22');}}
function fxHeal(el){const [x,y,r]=centerOf(el);for(let i=0;i<18;i++)fxAdd({x:r.left+Math.random()*r.width,y:r.bottom-10,vx:(Math.random()-0.5)*0.4,vy:-1.2-Math.random()*1.6,c:i%2?'#9fe07a':'#e8ffd0',s:2+Math.random()*2,life:900,g:-0.01,drag:0.99});fxAdd({k:'glow',x,y,r0:10,r1:60,c:'#9fe07a66',life:600});}
function fxBuff(el,bad){const [x,y]=centerOf(el);const c=bad?ELEM_COL.debuff:ELEM_COL.buff;fxAdd({k:'ring',x,y,r0:60,r1:-50,s:3,c:c[0],life:550});burst(x,y,c,10,2,{g:bad?0.04:-0.03});}
function fxMiss(el){const [x,y]=centerOf(el);for(let i=0;i<5;i++)fxAdd({k:'streak',x:x-40+i*4,y:y-10+i*5,vx:9,vy:0,c:'#c8c4b8',s:1.5,life:260,g:0,drag:1});}
function fxDeath(el){const [x,y,r]=centerOf(el);for(let i=0;i<34;i++)fxAdd({k:'rect',x:r.left+Math.random()*r.width,y:r.top+Math.random()*r.height,vx:(Math.random()-0.5)*5,vy:-Math.random()*4,g:0.18,c:['#3a3448','#6a5a7a','#df5d47','#1a1f2b'][i%4],s:4+Math.random()*6,vr:(Math.random()-0.5)*0.3,life:1100,drag:0.99});fxAdd({k:'glow',x,y,r0:10,r1:90,c:'#df5d4766',life:500});}
function fxSummon(el){const [x,y]=centerOf(el);for(let k=0;k<3;k++)fxAdd({k:'ring',x,y,r0:4,r1:70,s:3,c:['#5cb8a8','#c58cf0','#e0b45e'][k],life:700,t0:performance.now()+k*120});burst(x,y,['#5cb8a8','#e8ffff','#c58cf0'],20,3,{g:-0.02});}
function flashScreen(c){const d=document.createElement('div');d.className='flash';d.style.background=c;document.body.appendChild(d);setTimeout(()=>d.remove(),400);}
function confetti(){const cols=['#e0b45e','#5cb8a8','#df5d47','#c58cf0','#ffffff','#82b95a'];for(let i=0;i<80;i++)fxAdd({k:'rect',x:innerWidth/2+(Math.random()-0.5)*innerWidth*0.6,y:innerHeight*0.25,vx:(Math.random()-0.5)*9,vy:-4-Math.random()*7,g:0.2,c:cols[i%cols.length],s:5+Math.random()*5,vr:(Math.random()-0.5)*0.4,life:1800,drag:0.985,fade:1});}
function goldBurst(el){const [x,y]=el?centerOf(el):[innerWidth/2,80];burst(x,y,ELEM_COL.gold,16,3.5,{g:0.12,up:2});}
function levelBurst(){const x=innerWidth/2,y=innerHeight*0.45;for(let k=0;k<3;k++)fxAdd({k:'ring',x,y,r0:10,r1:220,s:4,c:'#ffd36a',life:900,t0:performance.now()+k*150});burst(x,y,['#ffd36a','#fff4c0','#e0b45e'],60,7,{g:0.06,up:1});}

/* ---------- combat VFX: consume the queue after each render ---------- */
function combatVfx(root){if(!C||!C.vfx||!C.vfx.length)return;const q=C.vfx.splice(0);
  for(const v of q){const el=v.a&&v.a._k&&root.querySelector(`[data-k="${v.a._k}"]`);const src=v.s&&v.s._k&&root.querySelector(`[data-k="${v.s._k}"]`);
    if(src&&v.t==='hit'){src.classList.remove('lunge-up','lunge-down');void src.offsetWidth;src.classList.add(v.s.side==='a'?'lunge-up':'lunge-down');}
    if(!el)continue;
    switch(v.t){case 'hit':fxHit(el,v.e,v.crit);sfx(v.crit?'crit':v.e&&v.e!=='phys'?'magic':(v.melee?'slash':'hit'),{e:v.e});if(v.a.isPlayer)hurtPulse();break;
      case 'heal':fxHeal(el);sfx('heal');break;case 'buff':fxBuff(el,false);sfx('buff');break;case 'debuff':fxBuff(el,true);sfx('debuff');break;
      case 'miss':fxMiss(el);sfx('miss');break;case 'death':fxDeath(el);sfx('death');if(v.final){const [x,y]=centerOf(el);for(let k=0;k<6;k++)fxAdd({k:'ring',x,y,r0:10,r1:innerWidth*0.8,s:7,c:['#ffffff','#ffd36a','#fff4c0'][k%3],life:1400,t0:performance.now()+k*140});burst(x,y,['#ffffff','#ffd36a','#fff4c0'],160,14,{g:0.03});flashScreen('#ffffff');sfx('victory');}break;case 'summon':fxSummon(el);sfx('summon');break;
      case 'phase':flashScreen('#df5d4733');sfx('boss');el.classList.add('enrage');break;}}}
function hurtPulse(){const v=document.getElementById('combat');if(!v)return;v.classList.remove('hurt');void v.offsetWidth;v.classList.add('hurt');}
/* animated bars: render at previous value, then slide to the new one (with a trailing "ghost" chunk) */
/* ---------- living bars: damage drains away, heals pour in. State survives re-renders. ---------- */
FX.bars={};
function abar(cur,max,cls,label,key){const p=max>0?U.clamp(cur/max*100,0,100):0;const k=(key||'')+cls;let st=FX.bars[k];const now=performance.now();
  cur=Math.max(0,cur);
  if(!st)st=FX.bars[k]={fill:p,ghost:p,to:p,num:cur,max,hold:0,hit:0,gain:0,lbl:label};
  else if(Math.abs(p-st.to)>0.01){
    if(p<st.to){st.ghost=Math.max(st.ghost,st.fill);st.hold=now+380;st.hit=now;st.dmg=(st.to-p);st.dripped=0;}
    else{st.gain=now;st.ghost=p;}
    st.to=p;}
  st.max=max;st.numTo=cur;st.lbl=label;FX.barsAlive=now;startBarTicker();
  return `<div class="bar ${cls} abar ${p<25&&cls==='hp'?'low':''}" data-k="${E(k)}" role="meter" aria-valuenow="${Math.round(cur)}" aria-valuemax="${Math.round(max)}" aria-label="${label}"><i class="ghost" style="width:${st.ghost}%"></i><i class="fill" style="width:${st.fill}%"></i><b class="drainedge" style="left:${st.fill}%"></b><span>${label} ${U.fmt(Math.round(st.num))}/${U.fmt(max)}</span></div>`;}
function animBars(){startBarTicker();}
function startBarTicker(){if(FX.barT)return;let last=performance.now();
  const tick=()=>{const now=performance.now(),dt=Math.min(50,now-last)/1000;last=now;let busy=false;
    document.querySelectorAll('.abar[data-k]').forEach(el=>{const st=FX.bars[el.dataset.k];if(!st)return;
      const fill=el.querySelector('.fill'),gh=el.querySelector('.ghost'),edge=el.querySelector('.drainedge'),sp=el.querySelector('span');
      // the fill snaps down on damage, rises smoothly on heals
      if(st.fill>st.to)st.fill=Math.max(st.to,st.fill-(st.fill-st.to)*Math.min(1,dt*22)-dt*30);
      else if(st.fill<st.to)st.fill=Math.min(st.to,st.fill+Math.max(dt*25,(st.to-st.fill)*dt*3.2));
      // the lost chunk lingers, then drains away
      if(st.ghost>st.fill&&now>st.hold){const sp_=Math.max(18,(st.ghost-st.fill)*2.2);st.ghost=Math.max(st.fill,st.ghost-sp_*dt);}
      if(st.ghost<st.fill)st.ghost=st.fill;
      // the number rolls toward the real value
      if(Math.abs(st.num-st.numTo)>0.5)st.num+=(st.numTo-st.num)*Math.min(1,dt*7);else st.num=st.numTo;
      fill.style.width=st.fill+'%';if(gh)gh.style.width=st.ghost+'%';
      const draining=st.ghost>st.fill+0.3;el.classList.toggle('draining',draining);el.classList.toggle('pouring',now-st.gain<700);
      if(edge){edge.style.left=st.fill+'%';edge.style.opacity=draining?1:0;}
      const ht=now-st.hit;if(ht<420){const a=(1-ht/420);el.style.transform=`translate(${(Math.random()-0.5)*6*a}px,${(Math.random()-0.5)*3*a}px)`;el.style.filter=`brightness(${1+0.9*a})`;}else if(el.style.transform){el.style.transform='';el.style.filter='';}
      // blood-light drips off the drain front
      if(draining&&!fxReduced()&&st.dmg>2&&(st.dripped||0)<14&&Math.random()<0.5&&el.offsetParent){const r=el.getBoundingClientRect();const x=r.left+r.width*st.ghost/100;st.dripped=(st.dripped||0)+1;
        fxAdd({x:x-Math.random()*r.width*(st.ghost-st.fill)/100,y:r.top+r.height*0.5,vx:(Math.random()-0.5)*0.8,vy:0.4+Math.random()*1.2,g:0.06,c:el.classList.contains('hp')?(Math.random()<0.5?'#ff5a3a':'#ffb08a'):'#9ec4ff',s:1.4+Math.random()*1.6,life:600});}
      if(sp){const txt=`${st.lbl} ${U.fmt(Math.round(st.num))}/${U.fmt(st.max)}`;if(sp.textContent!==txt)sp.textContent=txt;}
      if(draining||st.fill!==st.to||st.num!==st.numTo||ht<420)busy=true;});
    if(busy||performance.now()-FX.barsAlive<1500)FX.barT=requestAnimationFrame(tick);else FX.barT=0;};
  FX.barT=requestAnimationFrame(tick);}

/* ---------- ambient weather on location scenery ---------- */
const WX={raf:0,parts:[],kind:null,cv:null};
function weatherKind(loc){const b=BIOME[loc]||'fields';const n=T.isNight(S.time);const line=weatherLine(loc);
  if(['snow','mountaincity'].includes(b))return 'snow';if(b==='lava')return 'embers';if(b==='desert'||b==='mesa')return 'sand';if(b==='swamp'||/rain/i.test(line))return 'rain';
  if(['cave','undercity','necro'].includes(b))return 'spores';if(b==='spire'||b==='glade'||b==='elfcity')return 'motes';if(n&&['forest','fields','village','coast','lake'].includes(b))return 'fireflies';
  if(['forest','fields','village'].includes(b))return 'leaves';if(['coast','port','lake'].includes(b))return 'mist';return null;}
function startWeather(){const v=document.querySelector('#view .locard .vista');cancelAnimationFrame(WX.raf);if(!v||fxReduced()){WX.cv=null;return;}
  let cv=v.querySelector('canvas');if(!cv){cv=document.createElement('canvas');cv.className='wx';v.appendChild(cv);}const r=v.getBoundingClientRect();cv.width=r.width;cv.height=r.height;WX.cv=cv;
  const kind=weatherKind(S.P.loc);if(kind!==WX.kind){WX.parts=[];WX.kind=kind;}if(!kind)return;const g=cv.getContext('2d');const W=cv.width,H=cv.height;
  const spawn=()=>{const k=WX.kind;const p={x:Math.random()*W,y:k==='embers'||k==='spores'||k==='motes'||k==='fireflies'?H*(0.3+Math.random()*0.7):-10,life:0,ph:Math.random()*6};
    if(k==='snow')Object.assign(p,{vx:(Math.random()-0.3)*0.4,vy:0.4+Math.random()*0.8,s:1+Math.random()*2.2,c:'#ffffff'});
    if(k==='rain')Object.assign(p,{vx:-1.2,vy:7+Math.random()*4,s:1,c:'rgba(200,220,255,.55)'});
    if(k==='embers')Object.assign(p,{vx:(Math.random()-0.5)*0.5,vy:-0.4-Math.random()*0.9,s:1+Math.random()*2,c:Math.random()<0.5?'#ff8a3a':'#ffd36a'});
    if(k==='sand')Object.assign(p,{x:-10,y:Math.random()*H,vx:2+Math.random()*3,vy:(Math.random()-0.5)*0.4,s:1+Math.random(),c:'rgba(230,200,140,.6)'});
    if(k==='spores'||k==='motes')Object.assign(p,{vx:(Math.random()-0.5)*0.3,vy:-0.1-Math.random()*0.3,s:1+Math.random()*1.6,c:k==='spores'?'#8fe0d0':'#d8b8ff'});
    if(k==='fireflies')Object.assign(p,{vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.3,s:1.6,c:'#e8ff9a'});
    if(k==='leaves')Object.assign(p,{vx:0.6+Math.random()*0.8,vy:0.5+Math.random()*0.5,s:2.5,c:Math.random()<0.5?'#a8b84a':'#d08a3a'});
    if(k==='mist')Object.assign(p,{x:-60,y:H*(0.55+Math.random()*0.4),vx:0.25+Math.random()*0.3,vy:0,s:40+Math.random()*40,c:'rgba(230,236,240,.07)'});
    WX.parts.push(p);};
  const max={snow:90,rain:110,embers:50,sand:70,spores:30,motes:35,fireflies:24,leaves:14,mist:8}[kind];
  const tick=()=>{if(!document.body.contains(cv))return;g.clearRect(0,0,W,H);while(WX.parts.length<max&&Math.random()<0.6)spawn();
    WX.parts=WX.parts.filter(p=>{p.life++;p.x+=p.vx+(WX.kind==='snow'||WX.kind==='leaves'?Math.sin((p.life+p.ph*40)/30)*0.4:0);p.y+=p.vy;
      if(WX.kind==='rain'){g.strokeStyle=p.c;g.lineWidth=1;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x+p.vx*2,p.y+p.vy*2);g.stroke();}
      else{const tw=WX.kind==='fireflies'?0.4+0.6*Math.abs(Math.sin((p.life+p.ph*30)/25)):1;g.globalAlpha=tw;g.fillStyle=p.c;if(WX.kind==='fireflies'||WX.kind==='embers'||WX.kind==='motes'||WX.kind==='spores'){g.shadowColor=p.c;g.shadowBlur=8;}
        g.beginPath();if(WX.kind==='leaves')g.ellipse(p.x,p.y,p.s,p.s*0.5,p.life/20,0,7);else g.arc(p.x,p.y,p.s,0,7);g.fill();g.shadowBlur=0;g.globalAlpha=1;}
      return p.x>-80&&p.x<W+80&&p.y>-20&&p.y<H+20&&p.life<1200;});
    WX.raf=requestAnimationFrame(tick);};
  tick();}

/* ---------- animated title scene ---------- */
const TS={raf:0};
function startTitleScene(cv){cancelAnimationFrame(TS.raf);if(!cv)return;const dpr=Math.min(2,devicePixelRatio||1);let W,H;const g=cv.getContext('2d');
  const resize=()=>{W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0);build();};
  let stars=[],ridges=[],embers=[],castle=null,mx=0,my=0;
  const build=()=>{let s=42;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};stars=Array.from({length:Math.round(W*H/5000)},()=>({x:r()*W,y:r()*H*0.7,s:r()*1.4+0.3,p:r()*6}));
    ridges=[[0.6,0.07,'#1c2338',0.15],[0.7,0.06,'#141a2b',0.3],[0.82,0.04,'#0c1019',0.5]].map(([y0,amp,c,par])=>{const pts=[];let y=H*y0;for(let x=-60;x<=W+60;x+=W/50){y+=(r()-0.5)*H*amp;y=Math.max(H*(y0-amp*1.6),Math.min(H*(y0+amp),y));pts.push([x,y]);}return {pts,c,par};});
    castle={x:W*0.68,base:H*0.82,w:Math.max(80,W*0.09)};};
  addEventListener('resize',resize);cv.parentElement&&cv.parentElement.addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-0.5);my=(e.clientY/innerHeight-0.5);});
  resize();const t0=performance.now();
  const draw=()=>{if(!document.body.contains(cv)){removeEventListener('resize',resize);return;}const t=(performance.now()-t0)/1000;
    const lg=g.createLinearGradient(0,0,0,H);lg.addColorStop(0,'#04060c');lg.addColorStop(0.55,'#121a30');lg.addColorStop(1,'#2a2038');g.fillStyle=lg;g.fillRect(0,0,W,H);
    // aurora ribbons
    if(!fxReduced())for(let k=0;k<3;k++){g.beginPath();const y0=H*(0.16+k*0.07);g.moveTo(0,y0);for(let x=0;x<=W;x+=20)g.lineTo(x,y0+Math.sin(x/170+t*0.25+k)*24+Math.sin(x/53+t*0.6)*6);g.lineTo(W,y0+90);g.lineTo(0,y0+90);g.closePath();
      const ag=g.createLinearGradient(0,y0-30,0,y0+90);ag.addColorStop(0,'rgba(0,0,0,0)');ag.addColorStop(0.4,['rgba(92,184,168,.10)','rgba(197,140,240,.08)','rgba(224,180,94,.06)'][k]);ag.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=ag;g.fill();}
    for(const s of stars){g.globalAlpha=0.35+0.65*Math.abs(Math.sin(t*0.8+s.p));g.fillStyle='#fff';g.fillRect(s.x-mx*6,s.y-my*4,s.s,s.s);}g.globalAlpha=1;
    // moon
    const mxp=W*0.18-mx*10,myp=H*0.2-my*6;const mg=g.createRadialGradient(mxp,myp,4,mxp,myp,90);mg.addColorStop(0,'rgba(255,244,210,.35)');mg.addColorStop(1,'rgba(255,244,210,0)');g.fillStyle=mg;g.fillRect(mxp-90,myp-90,180,180);
    g.fillStyle='#f3ecd4';g.beginPath();g.arc(mxp,myp,22,0,7);g.fill();g.fillStyle='rgba(18,26,48,.9)';g.beginPath();g.arc(mxp+9,myp-5,19,0,7);g.fill();
    // shooting star
    const ss=(t%9)/9;if(ss<0.12&&!fxReduced()){const sx=W*(0.3+ss*4),sy=H*(0.08+ss*1.5);g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1.5;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx-50,sy-14);g.stroke();}
    ridges.forEach((rd,i)=>{g.fillStyle=rd.c;g.beginPath();g.moveTo(-60,H);for(const [x,y] of rd.pts)g.lineTo(x-mx*40*rd.par,y-my*14*rd.par);g.lineTo(W+60,H);g.fill();
      if(i===1){// castle on the middle ridge
        const c=castle,ox=-mx*40*rd.par;g.fillStyle='#0f1422';const towers=[[0,0.55,0.16],[0.2,0.8,0.12],[0.42,1,0.16],[0.66,0.72,0.12],[0.86,0.5,0.14]];
        for(const [fx,h,w] of towers){const x=c.x+fx*c.w+ox,tw=c.w*w,th=c.w*1.4*h;g.fillRect(x,c.base-th,tw,th);g.beginPath();g.moveTo(x-3,c.base-th);g.lineTo(x+tw/2,c.base-th-tw*1.4);g.lineTo(x+tw+3,c.base-th);g.fill();
          g.fillStyle=`rgba(255,196,110,${0.55+0.45*Math.abs(Math.sin(t*1.7+fx*9))})`;g.fillRect(x+tw/2-1.5,c.base-th*0.6,3,5);g.fillStyle='#0f1422';}
        g.fillRect(c.x+ox,c.base-c.w*0.45,c.w,c.w*0.45);}});
    // fog
    const fg=g.createLinearGradient(0,H*0.7,0,H);fg.addColorStop(0,'rgba(20,26,44,0)');fg.addColorStop(1,'rgba(20,26,44,.7)');g.fillStyle=fg;g.fillRect(0,H*0.7,W,H*0.3);
    // embers rising
    if(!fxReduced()){if(embers.length<50&&Math.random()<0.3)embers.push({x:Math.random()*W,y:H+5,vx:(Math.random()-0.5)*0.3,vy:-0.4-Math.random()*0.9,s:0.8+Math.random()*1.6,l:0});
      embers=embers.filter(e=>{e.l++;e.x+=e.vx+Math.sin(e.l/40)*0.3;e.y+=e.vy;g.globalAlpha=Math.max(0,1-e.l/500);g.fillStyle=e.l%60<30?'#ffb35a':'#ffd36a';g.shadowColor='#ff9a3a';g.shadowBlur=6;g.beginPath();g.arc(e.x,e.y,e.s,0,7);g.fill();g.shadowBlur=0;return e.y>-10&&e.l<500;});g.globalAlpha=1;}
    TS.raf=requestAnimationFrame(draw);};
  draw();}

/* ---------- button ripple ---------- */
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.b,.ab,.cb,.tab,.bt,.person,.tr,.card');if(!b||fxReduced())return;const r=b.getBoundingClientRect();const s=document.createElement('span');s.className='ripple';
  const d=Math.max(r.width,r.height);s.style.width=s.style.height=d+'px';s.style.left=(e.clientX-r.left-d/2)+'px';s.style.top=(e.clientY-r.top-d/2)+'px';b.appendChild(s);setTimeout(()=>s.remove(),550);sfx('click');},{passive:true});
