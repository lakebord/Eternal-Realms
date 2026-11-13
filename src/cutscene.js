/* ETERNAL REALMS — the final battle cutscene, rendered on its own full-screen canvas stage.
   Camera, letterbox, a drawn scene (the Shattered One, your hero on the cliff), canvas glitch, canvas shatter & reform, title cards, timed audio. */
'use strict';
const CS={tweens:[],raf:0};
const ez={io:t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,in:t=>t*t*t,out:t=>1-Math.pow(1-t,3),lin:t=>t};
function tw(key,to,ms,ease='io'){const from=CS.s[key];CS.tweens=CS.tweens.filter(x=>x.key!==key);CS.tweens.push({key,from,to,t0:performance.now(),ms:Math.max(1,ms),ease:ez[ease]});}
function rnd(a,b){return a+Math.random()*(b-a);}

/* ---------- scene drawing ---------- */
function csBuildWorld(W,H){let s=11;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  return {stars:Array.from({length:180},()=>({x:r()*W,y:r()*H*0.65,s:r()*1.6+0.3,p:r()*6})),
    rocks:Array.from({length:7},(_,i)=>{const x=(i<3?r()*0.25:i<6?0.75+r()*0.25:0.5+(r()-0.5)*0.6)*W,y=(0.15+r()*0.4)*H,w=(0.03+r()*0.07)*W;return {x,y,w,h:w*(0.6+r()*0.8),bob:r()*6};}),
    cliff:(()=>{const pts=[];for(let x=-40;x<=W+40;x+=W/30){const d=Math.abs(x-W/2)/(W/2);pts.push([x,H*(0.84-0.05*Math.max(0,1-d*2.2))+ (r()-0.5)*H*0.02+d*H*0.05]);}return pts;})()};}
function csDraw(g,W,H,t){const st=CS.s,w=CS.world;const gold=st.gold;
  // camera
  g.save();const sh=st.shake*(Math.random()-0.5)*2,sv=st.shake*(Math.random()-0.5)*2;g.translate(W/2+sh,H/2+sv);g.scale(st.zoom,st.zoom);g.translate(-st.cx*W,-st.cy*H);
  // sky: blood storm → golden dawn
  const sky=g.createLinearGradient(0,0,0,H);const mix=(a,b)=>{const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);const c=k=>Math.round(((pa>>k)&255)*(1-gold)+((pb>>k)&255)*gold);return `rgb(${c(16)},${c(8)},${c(0)})`;};
  sky.addColorStop(0,mix('#08020a','#1a1030'));sky.addColorStop(0.45,mix('#3a0a10','#6a3a2a'));sky.addColorStop(1,mix('#120408','#e0903a'));g.fillStyle=sky;g.fillRect(-W,-H,W*3,H*3);
  for(const s of w.stars){g.globalAlpha=(0.3+0.7*Math.abs(Math.sin(t/900+s.p)))*(1-gold*0.6);g.fillStyle='#fff';g.fillRect(s.x,s.y,s.s,s.s);}g.globalAlpha=1;
  // storm bands
  for(let k=0;k<4;k++){g.beginPath();const y0=H*(0.12+k*0.09);g.moveTo(-W,y0);for(let x=-W;x<=W*2;x+=30)g.lineTo(x,y0+Math.sin(x/200+t/1400+k)*16);g.lineTo(W*2,y0+60);g.lineTo(-W,y0+60);g.closePath();g.fillStyle=gold?`rgba(255,200,120,${0.05*gold})`:`rgba(255,60,40,0.05)`;g.fill();}
  // the floating spire rocks
  for(const r of w.rocks){const y=r.y+Math.sin(t/1200+r.bob)*6;g.fillStyle=mix('#1a0a10','#3a2418');g.beginPath();g.moveTo(r.x-r.w/2,y);g.lineTo(r.x+r.w/2,y);g.lineTo(r.x+r.w*0.15,y+r.h);g.lineTo(r.x-r.w*0.2,y+r.h*0.7);g.closePath();g.fill();
    g.strokeStyle=gold?'rgba(255,210,140,.35)':'rgba(255,90,60,.25)';g.lineWidth=1.5;g.beginPath();g.moveTo(r.x-r.w/2,y);g.lineTo(r.x+r.w/2,y);g.stroke();}
  // the Shattered One — a broken sun with orbiting fragments
  if(st.boss>0){const bx=W/2,by=st.sunY*H,R=st.sunR*Math.min(W,H)/720;g.globalAlpha=st.boss;
    const halo=g.createRadialGradient(bx,by,R*0.2,bx,by,R*4);halo.addColorStop(0,'rgba(255,180,90,.55)');halo.addColorStop(0.4,'rgba(255,80,40,.18)');halo.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=halo;g.fillRect(bx-R*4,by-R*4,R*8,R*8);
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2+t/1000*st.spin*(i%2?1:-1),rr=R*(1.55+0.25*Math.sin(i*1.7+t/700));const x=bx+Math.cos(a)*rr,y=by+Math.sin(a)*rr*0.55,s=R*0.22*(0.6+(i%3)*0.25);
      g.fillStyle=i%3?'#2a1018':'#3a1a20';g.strokeStyle='rgba(255,160,90,.7)';g.lineWidth=1.2;g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s*0.8,y+s*0.5);g.lineTo(x-s*0.7,y+s*0.6);g.closePath();g.fill();g.stroke();}
    const core=g.createRadialGradient(bx,by,0,bx,by,R);core.addColorStop(0,'#fffbe8');core.addColorStop(0.35,'#ffd27a');core.addColorStop(0.75,'#ff6a2a');core.addColorStop(1,'rgba(255,60,30,0)');g.fillStyle=core;g.beginPath();g.arc(bx,by,R,0,7);g.fill();
    g.strokeStyle='rgba(40,8,10,.85)';g.lineWidth=R*0.05;g.beginPath();g.moveTo(bx-R*0.6,by-R*0.2);g.lineTo(bx-R*0.1,by+R*0.05);g.lineTo(bx+R*0.2,by-R*0.4);g.moveTo(bx-R*0.1,by+R*0.05);g.lineTo(bx+R*0.05,by+R*0.6);g.stroke();g.globalAlpha=1;}
  // light pillar
  if(st.beam>0){const bw=W*0.09*st.beam;const bg=g.createLinearGradient(W/2-bw,0,W/2+bw,0);bg.addColorStop(0,'rgba(255,230,160,0)');bg.addColorStop(0.5,`rgba(255,248,220,${0.85*st.beam})`);bg.addColorStop(1,'rgba(255,230,160,0)');g.fillStyle=bg;g.fillRect(W/2-bw,-H,bw*2,H*1.85);}
  // the cliff
  g.fillStyle=mix('#07020a','#2a160c');g.beginPath();g.moveTo(-W,H*2);for(const [x,y] of w.cliff)g.lineTo(x,y);g.lineTo(W*2,H*2);g.closePath();g.fill();
  g.strokeStyle=gold?`rgba(255,200,120,${0.5*gold})`:'rgba(255,80,50,.35)';g.lineWidth=2;g.beginPath();w.cliff.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
  // the hero
  csHero(g,W/2,H*0.80,H*0.13,st.pose,st.aura,t);
  if(st.ember>0){const ex=W/2,ey=H*0.80-H*0.13*0.55*(1-st.pose*0.4);const pr=1+0.35*Math.abs(Math.sin(t/260));const eg=g.createRadialGradient(ex,ey,0,ex,ey,26*pr*st.ember);eg.addColorStop(0,'#fffbe0');eg.addColorStop(0.4,'#ffd36a');eg.addColorStop(1,'rgba(255,180,90,0)');g.fillStyle=eg;g.beginPath();g.arc(ex,ey,30*pr*st.ember,0,7);g.fill();}
  // particles (world space)
  CS.parts=CS.parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l--;g.globalAlpha=Math.min(1,p.l/40);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.s,0,7);g.fill();return p.l>0;});g.globalAlpha=1;
  if(st.embers>0&&Math.random()<st.embers)CS.parts.push(gold>0.5?{x:rnd(0,W),y:H*1.02,vx:rnd(-0.3,0.3),vy:rnd(-1.6,-0.6),g:-0.002,s:rnd(1,2.6),c:Math.random()<0.5?'#ffd36a':'#ffb35a',l:260}:{x:rnd(0,W),y:-10,vx:rnd(-0.2,0.6),vy:rnd(0.4,1.2),g:0,s:rnd(0.8,2),c:'#8a6a60',l:400});
  g.restore();
  // vignette
  const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.25,W/2,H/2,Math.max(W,H)*0.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.65)');g.fillStyle=vg;g.fillRect(0,0,W,H);}
function csHero(g,x,y,h,pose,aura,t){const P=S.P;const wt=stats(P).wt;g.save();g.translate(x,y);
  if(aura>0){const ag=g.createRadialGradient(0,-h*0.5,0,0,-h*0.5,h*1.4);ag.addColorStop(0,`rgba(255,220,130,${0.55*aura})`);ag.addColorStop(1,'rgba(255,200,100,0)');g.fillStyle=ag;g.beginPath();g.arc(0,-h*0.5,h*1.4,0,7);g.fill();}
  const kneel=pose;const top=-h*(1-0.38*kneel);g.fillStyle='#050208';g.strokeStyle=aura>0?`rgba(255,220,140,${0.6+0.4*aura})`:'rgba(255,110,70,.55)';g.lineWidth=1.6;
  // cloak
  g.beginPath();g.moveTo(-h*0.16,top+h*0.22);g.lineTo(h*0.16,top+h*0.22);g.lineTo(h*0.28,0);g.quadraticCurveTo(0,h*0.05,-h*0.3+Math.sin(t/300)*h*0.03,0);g.closePath();g.fill();g.stroke();
  // head
  g.beginPath();g.arc(kneel*h*0.04,top+h*0.12,h*0.1,0,7);g.fill();g.stroke();
  // weapon: raised when standing, planted when fallen
  g.lineWidth=h*0.035;g.strokeStyle=aura>0?'#fff0c0':'#c8a080';g.beginPath();
  if(['staff','orb','lute','totem'].includes(wt)){const tx=h*0.3,ty=top-(1-kneel)*h*0.25+kneel*h*0.6;g.moveTo(h*0.18,top+h*0.3);g.lineTo(tx,ty);g.stroke();g.fillStyle=aura>0?'#fff4c0':'#ff9a6a';g.beginPath();g.arc(tx,ty,h*0.06,0,7);g.fill();}
  else if(['bow','crossbow'].includes(wt)){g.arc(h*0.25,top+h*0.4,h*0.3,-1.2,1.2);g.stroke();}
  else{const a=-1.1+kneel*2.2;g.moveTo(h*0.18,top+h*0.32);g.lineTo(h*0.18+Math.cos(a)*h*0.7,top+h*0.32+Math.sin(a)*h*0.7);g.stroke();}
  g.restore();}

/* ---------- glitch & shatter (canvas) ---------- */
function csGlitch(g,W,H,amt){const off=CS.off,o=off.getContext('2d');o.drawImage(g.canvas,0,0,W,H);
  for(let k=0;k<Math.round(10*amt);k++){const y=Math.random()*H,h=rnd(4,H*0.09),dx=(Math.random()-0.5)*W*0.14*amt;g.drawImage(off,0,y,W,h,dx,y,W,h);}
  for(const [col,dx] of [['#ff0040',9*amt],['#00f0ff',-9*amt]]){const t2=CS.tint,c2=t2.getContext('2d');c2.globalCompositeOperation='copy';c2.drawImage(off,0,0,W,H);c2.globalCompositeOperation='multiply';c2.fillStyle=col;c2.fillRect(0,0,W,H);
    g.globalCompositeOperation='lighter';g.globalAlpha=0.45;g.drawImage(t2,dx,0,W,H);g.globalAlpha=1;g.globalCompositeOperation='source-over';}
  for(let k=0;k<Math.round(6*amt);k++){const bw=rnd(30,180),bh=rnd(10,60),x=rnd(0,W),y=rnd(0,H);g.drawImage(off,x+rnd(-60,60),y+rnd(-30,30),bw,bh,x,y,bw,bh);}
  const n=CS.noise,nc=n.getContext('2d'),im=nc.createImageData(n.width,n.height);for(let k=0;k<im.data.length;k+=4){const v=Math.random()*255;im.data[k]=im.data[k+1]=im.data[k+2]=v;im.data[k+3]=Math.random()<0.3?50*amt:0;}nc.putImageData(im,0,0);g.imageSmoothingEnabled=false;g.drawImage(n,0,0,W,H);g.imageSmoothingEnabled=true;
  if(Math.random()<0.12*amt){g.globalCompositeOperation='difference';g.fillStyle='#fff';g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';}
  const FR=['SOUL NOT FOUND','ERR://BREATH','0x00DEAD','HP 0/0','continue? Y/N','SIGNAL LOST','NOT YET'];g.font=`${Math.round(H*0.03)}px "JetBrains Mono",monospace`;
  for(let k=0;k<2;k++)if(Math.random()<0.5*amt){g.fillStyle='#ff2a4a';g.fillText(FR[Math.floor(Math.random()*FR.length)],rnd(0,W*0.7),rnd(H*0.1,H*0.9));}}
function csMakeShards(img,W,H,cols,rows){const pts=[];for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)pts.push([x/cols*W+(x%cols&&x?rnd(-0.4,0.4)*W/cols:0),y/rows*H+(y%rows&&y?rnd(-0.4,0.4)*H/rows:0)]);
  const P_=(x,y)=>pts[y*(cols+1)+x];const out=[];const ix=W/2,iy=H*0.8;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)for(const tri of [[P_(x,y),P_(x+1,y),P_(x,y+1)],[P_(x+1,y),P_(x+1,y+1),P_(x,y+1)]]){const c=[(tri[0][0]+tri[1][0]+tri[2][0])/3,(tri[0][1]+tri[1][1]+tri[2][1])/3];
    const dx=c[0]-ix,dy=c[1]-iy,d=Math.hypot(dx,dy)+1;out.push({tri,c,vx:dx/d*rnd(2,7),vy:dy/d*rnd(2,6)-rnd(2,5),rot:rnd(-0.06,0.06),flip:rnd(0.02,0.08),delay:d/Math.hypot(W,H)*0.5});}
  return {img,out};}
function csDrawShards(g,W,H,sh,p,goldTint){// p: 0 = assembled, 1 = fully fallen
  for(const s of sh.out){const q=Math.max(0,Math.min(1,(p-s.delay*(goldTint?0:1))/(1-s.delay*(goldTint?0:1)||1)));const T=q*90;
    const x=s.c[0]+s.vx*T,y=s.c[1]+s.vy*T+0.5*0.35*T*T,rot=s.rot*T,fl=Math.cos(s.flip*T);
    g.save();g.translate(x,y);g.rotate(rot);g.scale(1,Math.abs(fl)<0.08?0.08:fl);g.translate(-s.c[0],-s.c[1]);g.beginPath();g.moveTo(...s.tri[0]);g.lineTo(...s.tri[1]);g.lineTo(...s.tri[2]);g.closePath();g.save();g.clip();g.drawImage(sh.img,0,0,W,H);
    if(goldTint&&q>0){g.fillStyle=`rgba(255,200,90,${0.6*q})`;g.fillRect(0,0,W,H);}g.restore();
    g.strokeStyle=goldTint?`rgba(255,230,160,${0.4+0.6*q})`:`rgba(255,220,210,${0.25+0.6*q})`;g.lineWidth=goldTint?2:1.2;g.stroke();g.restore();}}

/* ---------- text ---------- */
function csLetters(g,W,H,txt,y,size,col,prog,glow,spacing=0.12){g.save();g.font=`${size}px "IM Fell English SC",Georgia,serif`;g.textBaseline='middle';
  {const w0=[...txt].reduce((a,c)=>a+g.measureText(c).width+size*spacing,0);if(w0>W*0.86){size*=W*0.86/w0;g.font=`${size}px "IM Fell English SC",Georgia,serif`;}}
  const ws=[...txt].map(c=>g.measureText(c).width+size*spacing);const total=ws.reduce((a,b)=>a+b,0);let x=W/2-total/2;const n=txt.length;
  [...txt].forEach((c,i)=>{const a=Math.max(0,Math.min(1,prog*n*1.15-i));if(a>0){g.globalAlpha=a;g.shadowColor=glow;g.shadowBlur=size*0.5;g.fillStyle=col;g.fillText(c,x,y+(1-a)*size*0.25);}x+=ws[i];});g.restore();}

/* ---------- the loop ---------- */
function csFrame(){const cv=CS.cv;if(!cv||!document.body.contains(cv))return;const g=CS.g,W=cv.width,H=cv.height,t=performance.now();
  for(const x of CS.tweens.slice()){const k=Math.min(1,(t-x.t0)/x.ms);CS.s[x.key]=x.from+(x.to-x.from)*x.ease(k);if(k>=1)CS.tweens.splice(CS.tweens.indexOf(x),1);}
  const st=CS.s;CS.s.shake*=0.92;
  if(st.mode==='scene'||st.mode==='glitch'){csDraw(g,W,H,t);if(st.mode==='glitch')csGlitch(g,W,H,st.glitch);}
  else{g.fillStyle='#000';g.fillRect(0,0,W,H);if(CS.shards&&st.shardP<1.02)csDrawShards(g,W,H,CS.shards,st.shardP,st.mode==='reform');}
  // texts
  if(st.title>0){g.save();g.globalAlpha=Math.min(1,st.title);const sz=Math.min(W*0.16,H*0.26)*(1+0.15*(1-st.titleZ));csLetters(g,W,H,CS.titleText,H*0.5,sz,CS.titleCol,1,CS.titleGlow,0.18);g.restore();}
  if(st.sub>0)csLetters(g,W,H,CS.subText,H*(CS.subY||0.86),Math.max(16,H*0.032),'#e8e2d2',st.sub,'#000',0.08);
  if(st.line>0)csLetters(g,W,H,CS.lineText,H*0.45,Math.min(W*0.06,H*0.075),CS.lineCol,st.line,CS.lineGlow,0.1);
  if(st.lineFade<1){}// handled by alpha in line value
  if(st.flash>0){g.fillStyle=`rgba(255,250,235,${st.flash})`;g.fillRect(0,0,W,H);}
  if(st.black>0){g.fillStyle=`rgba(0,0,0,${st.black})`;g.fillRect(0,0,W,H);}
  // letterbox
  const bh=H*0.12*st.bars;g.fillStyle='#000';g.fillRect(0,0,W,bh);g.fillRect(0,H-bh,W,bh);
  CS.raf=requestAnimationFrame(csFrame);}

/* ---------- the sequence ---------- */
async function finalCinematic(){const cb=$('#combat');FIN.skip=false;FIN.timers=[];FIN.done=false;const reduce=fxReduced();
  const cv=document.createElement('canvas');cv.id='cutscene';const dpr=Math.min(1.5,devicePixelRatio||1);cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);cv.style.opacity='0';cv.style.transition='opacity 1.1s ease';document.body.appendChild(cv);
  CS.cv=cv;CS.g=cv.getContext('2d');const W=cv.width,H=cv.height;CS.world=csBuildWorld(W,H);CS.parts=[];CS.tweens=[];CS.shards=null;
  const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};CS.off=mk(W,H);CS.tint=mk(W,H);CS.noise=mk(Math.ceil(W/4),Math.ceil(H/4));
  CS.s={mode:'scene',zoom:1,cx:0.5,cy:0.5,shake:0,gold:0,boss:1,sunY:0.3,sunR:60,spin:0.6,pose:0,aura:0,ember:0,beam:0,embers:0.4,glitch:0,shardP:0,title:0,titleZ:0,sub:0,line:0,flash:0,black:1,bars:0};
  csFrame();requestAnimationFrame(()=>requestAnimationFrame(()=>{cv.style.opacity='1';}));
  const skipBtn=el('button','fin-skip','Skip ▸');skipBtn.onclick=()=>{FIN.skip=true;FIN.timers.forEach(clearTimeout);if(FIN.wake)FIN.wake();};setTimeout(()=>{if(!FIN.done)document.body.appendChild(skipBtn);},1500);
  const W8=ms=>fwait(reduce?Math.min(ms,150):ms);
  // ACT I — the broken sun rises
  await new Promise(r=>setTimeout(r,1100));tw('black',0,1400,'io');tw('bars',1,1400,'io');CS.subText='The Shattered One raises the broken sun.';tw('sub',1,1600,'lin');cue('riser');
  tw('zoom',1.35,3200,'io');tw('cy',0.36,3200,'io');tw('sunR',120,3000,'in');tw('spin',3,3000,'in');
  await W8(2700);tw('sub',0,300);
  // SUNFALL — the title slams, the sun falls, impact
  CS.titleText='SUNFALL';CS.titleCol='#fff4c0';CS.titleGlow='#ff6a2a';CS.s.title=1;CS.s.titleZ=0;tw('titleZ',1,350,'out');cue('whoosh');CS.s.shake=10;
  await W8(800);tw('title',0,250);tw('sunY',0.78,650,'in');tw('cy',0.62,650,'in');tw('zoom',1.6,650,'in');await W8(620);
  cue('boom');CS.s.flash=1;tw('flash',0,900,'out');CS.s.shake=60;CS.s.pose=1;CS.s.boss=0;CS.s.sunR=60;CS.s.sunY=0.3;CS.s.embers=0.6;musMuffle(true);
  tw('zoom',1.15,2200,'out');tw('cy',0.66,2200,'out');
  await W8(1500);CS.subText='You fall.';tw('sub',1,700,'lin');await W8(1200);tw('sub',0,300);
  // ACT II — the scene glitches…
  CS.s.mode='glitch';tw('glitch',1,500);cue('stutter');const st1=setInterval(()=>{if(!AUD.on)return;musGate(Math.random()<0.5);if(Math.random()<0.4)cue('stutter');},120);FIN.timers.push(st1);
  await W8(2300);clearInterval(st1);musGate(false);audForce('silence');CS.s.mode='scene';await W8(60);
  // …and shatters
  CS.off.getContext('2d').drawImage(cv,0,0);const snap=mk(W,H);snap.getContext('2d').drawImage(cv,0,0);CS.shards=csMakeShards(snap,W,H,9,6);CS.s.mode='shards';CS.s.shardP=0;cue('glass');CS.s.flash=0.6;tw('flash',0,400);
  tw('shardP',1,2600,'lin');await W8(2700);CS.shards=null;
  // ACT III — silence, death
  musMuffle(false);await W8(800);cue('heartbeat');CS.lineText='You have died...';CS.lineCol='#e8e2d2';CS.lineGlow='#ff2a2a';tw('line',1,2200,'lin');
  await W8(1300);cue('heartbeat');await W8(1900);tw('line',0,900);await W8(1500);cue('heartbeat');await W8(900);
  // ACT IV — defiance
  CS.s.mode='scene';CS.s.gold=0;CS.s.black=1;CS.s.boss=0;CS.s.pose=1;CS.s.zoom=1.5;CS.s.cy=0.7;CS.s.ember=0;CS.s.embers=0;
  tw('ember',1,1500,'out');tw('black',0.82,1500);cue('swell');CS.lineText='Not while I still draw breath....';CS.lineCol='#ffd36a';CS.lineGlow='#e0b45e';tw('line',1,2800,'lin');
  await W8(3300);
  // ACT V — the drop: the pieces return, gold
  const p2=mk(W,H);const save={...CS.s};Object.assign(CS.s,{mode:'scene',gold:1,boss:0.55,sunY:0.25,sunR:70,spin:0.3,pose:0,aura:1,ember:0,beam:1,black:0,zoom:1,cx:0.5,cy:0.5,flash:0,title:0,sub:0,line:0,bars:1,embers:0});
  CS.parts=[];csDraw(p2.getContext('2d'),W,H,performance.now());Object.assign(CS.s,save);
  finalRebirth();cb.style.visibility='hidden';C.cineMusic=true;audForce('final2');cue('drop');
  CS.shards=csMakeShards(p2,W,H,9,6);CS.s.mode='reform';CS.s.line=0;CS.s.black=0;CS.s.shardP=1;tw('shardP',0,1700,'out');CS.s.shake=14;
  await W8(1750);
  Object.assign(CS.s,{mode:'scene',gold:1,boss:0.55,sunY:0.25,sunR:70,spin:0.3,pose:0,aura:1,beam:1,zoom:1.35,cx:0.5,cy:0.7,embers:0.9});CS.shards=null;CS.s.flash=1;tw('flash',0,800,'out');CS.s.shake=30;
  if(!reduce)for(let k=0;k<5;k++)setTimeout(()=>fxAdd({k:'ring',x:innerWidth/2,y:innerHeight*0.8,r0:10,r1:Math.max(innerWidth,innerHeight)*0.8,s:7,c:['#ffd36a','#fff','#ffb35a','#fff4c0','#e0b45e'][k],life:1200}),k*120);
  tw('zoom',1,2400,'out');tw('cy',0.5,2400,'out');tw('beam',0.35,2400);
  CS.titleText='UNBROKEN';CS.titleCol='#ffe9a8';CS.titleGlow='#e0b45e';CS.s.titleZ=0;tw('title',1,500);tw('titleZ',1,600,'out');CS.subText='You rise again';CS.subY=0.66;tw('sub',1,1200,'lin');
  await W8(2600);tw('title',0,700,'io');tw('sub',0,700,'io');tw('bars',0,1000,'io');await W8(700);
  // back to the fight: the battlefield is already there underneath, the cutscene dissolves away
  skipBtn.remove();FIN.done=true;
  if(FIN.skip&&C.finalPhase!==2){finalRebirth();C.cineMusic=true;audForce('final2');}
  cb.style.visibility='';finaleAmbience();renderCombat();cv.style.transition='opacity 1.2s ease';cv.style.opacity='0';await new Promise(r=>setTimeout(r,1200));
  cancelAnimationFrame(CS.raf);cv.remove();CS.cv=null;CS.subY=0;
  const pc=cb.querySelector('.actor.me');if(pc)pc.classList.add('ascend');levelBurst();FIN.skip=false;musMuffle(false);UI.runCombat();}
