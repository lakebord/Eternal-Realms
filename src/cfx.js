/* ETERNAL REALMS — battle choreography.
   Each queued combat event (C.vfx) becomes a small staged sequence: wind-up → lunge / projectile → impact → reaction.
   Cards are re-rendered on every combat step, so everything here finishes inside one turn beat (UI.turnGap). */
'use strict';
const CFX={imp:{},last:{},wasWaiting:false};
function cfxSp(){return UI.fast?0.4:1;}
function cfxCard(root,a){return a&&a._k?root.querySelector(`[data-k="${a._k}"]`):null;}
function cfxPt(card){const p=card.querySelector('.pt');const r=(p||card).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r];}
function cfxLater(ms,fn){if(ms<=4)fn();else setTimeout(()=>{try{fn();}catch(e){console.warn(e);}},ms);}
function cfxAnim(el,frames,opt){if(!el||!el.animate||fxReduced())return;try{el.animate(frames,Object.assign({easing:'cubic-bezier(.25,.9,.35,1)'},opt));}catch(e){}}
function cfxDom(cls,html,x,y,life){const fl=document.getElementById('floats');if(!fl)return null;const d=document.createElement('div');d.className=cls;d.innerHTML=html;if(x!=null){d.style.left=x+'px';d.style.top=y+'px';}fl.appendChild(d);setTimeout(()=>d.remove(),life||1200);return d;}
const T0=ms=>performance.now()+ms;

/* ---------- canvas pieces ---------- */
// crescent weapon arc
function cfxSlash(x,y,ang,R,col,delay,w){fxAdd({k:'fn',x,y,life:300,t0:T0(delay),fade:0,draw(g,t){const p=Math.min(1,t*2.4),f=1-Math.max(0,(t-0.4)/0.6);g.globalAlpha=f;g.lineCap='round';g.shadowColor=col;g.shadowBlur=16;
  for(let k=0;k<3;k++){g.strokeStyle=k?col:'#ffffff';g.lineWidth=(w||7)*(1-k*0.3)*f+0.5;g.beginPath();g.arc(x-Math.cos(ang)*R*0.55,y-Math.sin(ang)*R*0.55,R*(1-k*0.05),ang-1.05,ang-1.05+2.1*p);g.stroke();}}});}
// travelling projectile with a trail
function cfxProjectile(x0,y0,x1,y1,cols,delay,dur,kind){const arcH=kind==='arrow'?-26:-14;
  fxAdd({k:'fn',life:dur,t0:T0(delay),fade:0,draw(g,t){const n=kind==='arrow'?1:9;for(let i=n-1;i>=0;i--){const tt=Math.max(0,t-i*0.035);const x=x0+(x1-x0)*tt,y=y0+(y1-y0)*tt+Math.sin(tt*Math.PI)*arcH;
      if(kind==='arrow'){const t2=Math.max(0,tt-0.08);const xb=x0+(x1-x0)*t2,yb=y0+(y1-y0)*t2+Math.sin(t2*Math.PI)*arcH;g.strokeStyle='#e8dcc0';g.lineWidth=2.5;g.lineCap='round';g.shadowColor='#fff';g.shadowBlur=6;g.beginPath();g.moveTo(xb,yb);g.lineTo(x,y);g.stroke();g.fillStyle='#fff';g.beginPath();g.arc(x,y,2.2,0,7);g.fill();}
      else{const r=(kind==='big'?13:9)*(1-i/n);g.globalAlpha=(1-i/n)*0.9;const rg=g.createRadialGradient(x,y,0,x,y,r*2.2);rg.addColorStop(0,'#ffffff');rg.addColorStop(0.3,cols[0]);rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.beginPath();g.arc(x,y,r*2.2,0,7);g.fill();}}}});
  if(kind!=='arrow')for(let i=0;i<8;i++){const tt=i/8;fxAdd({x:x0+(x1-x0)*tt,y:y0+(y1-y0)*tt+Math.sin(tt*Math.PI)*arcH,vx:(Math.random()-0.5)*1.2,vy:(Math.random()-0.5)*1.2,c:cols[i%2],s:2.2,life:380,t0:T0(delay+dur*tt)});}}
function cfxPillar(x,y,col,delay,w,h){fxAdd({k:'fn',life:520,t0:T0(delay),fade:0,draw(g,t){const a=t<0.2?t/0.2:1-(t-0.2)/0.8;const ww=(w||64)*(0.5+0.5*Math.min(1,t*4));const lg=g.createLinearGradient(x-ww/2,0,x+ww/2,0);lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(0.5,col);lg.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=Math.max(0,a)*0.85;g.fillStyle=lg;g.fillRect(x-ww/2,y-(h||260),ww,(h||260)+30);}});}
function cfxBolt(x,y,cols,delay){const top=Math.max(0,y-innerHeight*0.6);for(let k=0;k<3;k++)fxAdd({k:'fn',life:150,t0:T0(delay+k*70),fade:0,draw(g,t){g.globalAlpha=1-t;g.lineCap='round';g.lineJoin='round';g.shadowColor=cols[1];g.shadowBlur=22;
    for(let pass=0;pass<2;pass++){g.strokeStyle=pass?'#ffffff':cols[0];g.lineWidth=pass?2:6;g.beginPath();let px=x+(Math.random()-0.5)*90,py=top;g.moveTo(px,py);const seg=9;for(let i=1;i<=seg;i++){const tx=x+(Math.random()-0.5)*(seg-i)*16,ty=top+(y-top)*i/seg;g.lineTo(tx,ty);if(!pass&&i>3&&Math.random()<0.3){g.moveTo(tx,ty);g.lineTo(tx+(Math.random()-0.5)*70,ty+30);g.moveTo(tx,ty);}}g.stroke();}}});}
function cfxRunes(x,y,col,delay,R){fxAdd({k:'fn',life:620,t0:T0(delay),fade:0,draw(g,t){const a=t<0.25?t/0.25:1-(t-0.25)/0.75;g.globalAlpha=Math.max(0,a);g.strokeStyle=col;g.shadowColor=col;g.shadowBlur=12;g.translate(x,y);
    for(let k=0;k<2;k++){g.save();g.rotate(t*(k?-3:3));g.lineWidth=2;g.setLineDash(k?[4,7]:[14,6]);g.beginPath();g.arc(0,0,(R||44)*(k?0.65:1)*(0.6+0.4*Math.min(1,t*3)),0,7);g.stroke();if(!k){g.setLineDash([]);g.beginPath();for(let i=0;i<=3;i++){const an=i*2.094;g[i?'lineTo':'moveTo'](Math.cos(an)*(R||44)*0.6,Math.sin(an)*(R||44)*0.6);}g.stroke();}g.restore();}}});}
function cfxGlyphs(x,y,r,col,delay,up,shape){for(let i=0;i<7;i++){const ox=(Math.random()-0.5)*r.width*0.8,d=delay+i*55,s=6+Math.random()*5;fxAdd({k:'fn',life:700,t0:T0(d),fade:0,draw(g,t){const yy=(up?r.bottom-10-t*70:r.top+10+t*60);g.globalAlpha=t<0.2?t/0.2:1-(t-0.2)/0.8;g.strokeStyle=col;g.lineWidth=2.4;g.lineCap='round';g.shadowColor=col;g.shadowBlur=8;g.beginPath();const cx=x+ox;
      if(shape==='plus'){g.moveTo(cx-s,yy);g.lineTo(cx+s,yy);g.moveTo(cx,yy-s);g.lineTo(cx,yy+s);}else{const dir=up?-1:1;g.moveTo(cx-s,yy);g.lineTo(cx,yy+dir*s);g.lineTo(cx+s,yy);}g.stroke();}});}}
function cfxShards(x,y,cols,delay,n){for(let i=0;i<(n||9);i++){const a=i/(n||9)*6.283+Math.random()*0.4,L=26+Math.random()*30;fxAdd({k:'fn',life:520,t0:T0(delay),fade:0,draw(g,t){const p=Math.min(1,t*4),f=1-Math.max(0,(t-0.5)/0.5);g.globalAlpha=f;g.fillStyle=cols[i%2];g.shadowColor=cols[0];g.shadowBlur=10;const x1=x+Math.cos(a)*L*p,y1=y+Math.sin(a)*L*p;g.beginPath();g.moveTo(x+Math.cos(a)*6,y+Math.sin(a)*6);g.lineTo(x1+Math.cos(a+1.57)*4,y1+Math.sin(a+1.57)*4);g.lineTo(x+Math.cos(a)*(L+12)*p,y+Math.sin(a)*(L+12)*p);g.lineTo(x1-Math.cos(a+1.57)*4,y1-Math.sin(a+1.57)*4);g.fill();}});}}
function cfxImplode(x,y,cols,delay){for(let i=0;i<16;i++){const a=Math.random()*6.283,R=70+Math.random()*40;fxAdd({k:'fn',life:300,t0:T0(delay+Math.random()*80),fade:0,draw(g,t){const r0=R*(1-t),r1=R*(1-Math.min(1,t+0.18));g.globalAlpha=t;g.strokeStyle=cols[i%2];g.lineWidth=2.2;g.lineCap='round';g.beginPath();g.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);g.lineTo(x+Math.cos(a+0.3)*r1,y+Math.sin(a+0.3)*r1);g.stroke();}});}
  fxAdd({k:'ring',x,y,r0:80,r1:-74,s:4,c:cols[0],life:300,t0:T0(delay)});}

/* ---------- impact: what the target looks like when the blow lands ---------- */
function cfxElemImpact(x,y,r,e,crit,d){const c=ELEM_COL[e]||ELEM_COL.phys;const big=crit?1.4:1;
  switch(e){
    case 'fire':fxAdd({k:'glow',x,y,r0:10,r1:90*big,c:'#ffb040cc',life:420,t0:T0(d)});fxAdd({k:'glow',x,y,r0:30,r1:70*big,c:'#40201088',life:700,t0:T0(d+120)});fxAdd({k:'ring',x,y,r0:8,r1:74*big,s:5,c:'#ffd36a',life:380,t0:T0(d)});
      for(let i=0;i<26*big;i++){const a=Math.random()*6.283,v=1+Math.random()*5;fxAdd({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,g:-0.06,c:c[i%2],s:2+Math.random()*3,life:650+Math.random()*300,t0:T0(d)});}break;
    case 'frost':cfxShards(x,y,['#dff6ff','#8fd8ff'],d,crit?13:9);fxAdd({k:'ring',x,y,r0:6,r1:64*big,s:3,c:'#bfeaff',life:480,t0:T0(d)});fxAdd({k:'glow',x,y,r0:10,r1:60,c:'#9fe2ff88',life:420,t0:T0(d)});
      for(let i=0;i<14;i++)fxAdd({x:x+(Math.random()-0.5)*r.width*0.7,y:y+(Math.random()-0.5)*40,vx:(Math.random()-0.5)*0.6,vy:0.6+Math.random(),g:0.02,c:'#ffffff',s:1.6,life:800,t0:T0(d+80)});break;
    case 'lightning':cfxBolt(x,y,c,d);fxAdd({k:'glow',x,y,r0:14,r1:80*big,c:'#fff8a0cc',life:260,t0:T0(d)});for(let i=0;i<18;i++){const a=Math.random()*6.283,v=4+Math.random()*7;fxAdd({k:'streak',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,c:c[i%2],s:1.6,life:260,t0:T0(d+30),drag:0.9});}
      cfxLater(d,()=>flashScreen('#cfe8ff2e'));break;
    case 'holy':cfxPillar(x,y+r.height*0.4,'#fff6c8',d,crit?96:70,innerHeight*0.5);fxAdd({k:'ring',x,y,r0:6,r1:70*big,s:4,c:'#fff4b0',life:520,t0:T0(d+60)});
      for(let i=0;i<20;i++)fxAdd({x:x+(Math.random()-0.5)*r.width*0.6,y:y+20,vx:(Math.random()-0.5)*0.8,vy:-1.5-Math.random()*2.5,g:-0.02,c:c[i%2],s:1.8,life:800,t0:T0(d+Math.random()*200)});break;
    case 'shadow':cfxImplode(x,y,['#b890ff','#5a2a9a'],d);fxAdd({k:'glow',x,y,r0:60,r1:-50,c:'#1a0830dd',life:300,t0:T0(d)});
      for(let i=0;i<20;i++){const a=Math.random()*6.283,v=2+Math.random()*4;fxAdd({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,c:c[i%2],s:2.4,life:520,t0:T0(d+260)});}fxAdd({k:'ring',x,y,r0:4,r1:66*big,s:4,c:'#a070ff',life:420,t0:T0(d+260)});break;
    case 'nature':for(let i=0;i<20;i++){const a=Math.random()*6.283,v=2+Math.random()*4;fxAdd({k:'rect',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,g:0.07,c:['#8fe06a','#4f9a3a','#d8ff9a'][i%3],s:7,life:800,vr:(Math.random()-0.5)*0.4,t0:T0(d)});}
      cfxShards(x,y,['#b8e86a','#5a8a2a'],d,6);fxAdd({k:'ring',x,y,r0:6,r1:58*big,s:3,c:'#8fe06a',life:460,t0:T0(d)});break;
    case 'poison':for(let i=0;i<18;i++)fxAdd({k:'ring',x:x+(Math.random()-0.5)*r.width*0.6,y:y+(Math.random()-0.2)*40,vx:0,vy:-0.6-Math.random()*1.2,r0:2,r1:6+Math.random()*7,s:2,c:c[i%2],life:600+Math.random()*300,t0:T0(d+Math.random()*260),drag:1});
      fxAdd({k:'glow',x,y,r0:10,r1:66,c:'#9fd83a88',life:520,t0:T0(d)});break;
    case 'arcane':cfxRunes(x,y,'#d79cff',d,crit?60:46);for(let i=0;i<8;i++){const a=i/8*6.283;fxAdd({k:'streak',x,y,vx:Math.cos(a)*7,vy:Math.sin(a)*7,c:c[i%2],s:2.4,life:320,t0:T0(d+120),drag:0.92});}fxAdd({k:'glow',x,y,r0:8,r1:70*big,c:'#c08cffaa',life:420,t0:T0(d+100)});break;
    default:{const ang=-0.8+Math.random()*0.5;cfxSlash(x,y,ang,44*big,'#ffe0c8',d,crit?9:7);cfxSlash(x,y,ang+2.1,36*big,'#ff7a5a',d+70,5);
      for(let i=0;i<(crit?24:13);i++){const a=Math.random()*6.283,v=3+Math.random()*(crit?8:5);fxAdd({k:'streak',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:0.1,c:['#ffffff','#ffb090','#ffd36a'][i%3],s:1.8,life:300,t0:T0(d+20),drag:0.93});}}
  }
  if(crit){fxAdd({k:'ring',x,y,r0:10,r1:130,s:6,c:'#ffd36a',life:520,t0:T0(d)});fxAdd({k:'ring',x,y,r0:10,r1:90,s:3,c:'#ffffff',life:420,t0:T0(d+60)});}}

function cfxImpact(root,el,v,dir,sp){if(!el.isConnected)return;const [x,y,r]=cfxPt(el);cfxElemImpact(x,y,r,v.e,v.crit,0);
  sfx(v.crit?'crit':v.e&&v.e!=='phys'?'magic':(v.melee?'slash':'hit'),{e:v.e});
  const k=v.crit?1.8:1;const pt=el.querySelector('.pt');
  cfxAnim(el,[{transform:'none',filter:'brightness(1)'},{transform:`translate(${dir[0]*11*k}px,${dir[1]*11*k}px) rotate(${dir[0]>=0?1.6:-1.6}deg)`,filter:'brightness(2.3) saturate(.4)',offset:0.16},{transform:`translate(${-dir[0]*5}px,${-dir[1]*5}px)`,filter:'brightness(1.15)',offset:0.5},{transform:`translate(${dir[0]*2}px,${dir[1]*2}px)`,offset:0.75},{transform:'none',filter:'brightness(1)'}],{duration:430*Math.max(0.6,sp)});
  if(pt){pt.classList.remove('struck');void pt.offsetWidth;pt.classList.add('struck');}
  if(v.a.isPlayer)hurtPulse();
  if(v.crit&&!fxReduced()){const w=root.querySelector('.cwrap');cfxAnim(w,[{transform:'none'},{transform:'translate(5px,-3px) scale(1.012)',offset:0.15},{transform:'translate(-5px,3px) scale(1.012)',offset:0.35},{transform:'translate(3px,2px)',offset:0.6},{transform:'none'}],{duration:340,easing:'linear'});flashScreen('#ffd36a26');}}

/* ---------- an attack, start to finish. Returns the time (ms) at which the blow lands. ---------- */
function cfxAttack(root,src,el,v,delay,sp){const [tx,ty]=cfxPt(el);let dir=[0,v.a.side==='a'?1:-1];let impact=delay+60*sp;
  if(src&&src!==el){const [sx,sy]=cfxPt(src);const dx=tx-sx,dy=ty-sy,L=Math.hypot(dx,dy)||1;dir=[dx/L,dy/L];const elem=v.e&&v.e!=='phys';const ranged=!v.melee||elem;
    src.style.zIndex=6;
    if(!ranged){const reach=Math.min(54,L*0.32);impact=delay+250*sp;
      cfxAnim(src,[{transform:'none'},{transform:`translate(${-dir[0]*12}px,${-dir[1]*12}px) scale(.97)`,offset:0.26},{transform:`translate(${dir[0]*reach}px,${dir[1]*reach}px) scale(1.05)`,offset:0.56,easing:'cubic-bezier(.5,0,.9,.4)'},{transform:`translate(${dir[0]*reach*0.8}px,${dir[1]*reach*0.8}px) scale(1.03)`,offset:0.7},{transform:'none'}],{duration:470*sp,delay});
    }else{const sky=v.e==='lightning'||v.e==='holy';const fly=sky?0:(v.e==='phys'||!v.e?170:250)*sp;const launch=delay+150*sp;impact=launch+fly+(sky?90*sp:0);
      cfxAnim(src,[{transform:'none',filter:'brightness(1)'},{transform:`translate(${-dir[0]*5}px,${-dir[1]*5}px) scale(1.04)`,filter:'brightness(1.5)',offset:0.4},{transform:`translate(${dir[0]*9}px,${dir[1]*9}px) scale(1.02)`,filter:'brightness(1.2)',offset:0.6},{transform:'none',filter:'brightness(1)'}],{duration:400*sp,delay});
      const col=ELEM_COL[v.e]||ELEM_COL.phys;
      if(elem){fxAdd({k:'ring',x:sx,y:sy,r0:34,r1:-28,s:3,c:col[0],life:160*sp+40,t0:T0(delay)});fxAdd({k:'glow',x:sx,y:sy,r0:6,r1:36,c:col[0]+'99',life:260,t0:T0(delay+40)});}
      if(!sky)cfxProjectile(sx+dir[0]*18,sy+dir[1]*18,tx,ty,col,launch,Math.max(60,fly),elem?(v.crit?'big':'orb'):'arrow');}
  }
  cfxLater(impact,()=>cfxImpact(root,el,v,dir,sp));return impact;}

function cfxDeathSeq(root,el,v,at){el.classList.add('dying');cfxLater(at,()=>{if(!el.isConnected)return;const [x,y,r]=cfxPt(el);fxDeath(el);sfx('death');const boss=v.a.boss;
    cfxAnim(el,[{transform:'none',filter:'brightness(2.4) saturate(0)',opacity:1},{transform:'translateY(4px) scale(.99)',filter:'brightness(1.2) saturate(.2)',opacity:.9,offset:0.35},{transform:`translateY(16px) rotate(${Math.random()<0.5?-3:3}deg) scale(.95)`,filter:'brightness(.6) saturate(0)',opacity:.32}],{duration:620,fill:'forwards',easing:'ease-in'});
    // the spirit leaves
    fxAdd({k:'fn',life:900,fade:0,draw(g,t){const yy=y-t*110,a=t<0.15?t/0.15:1-(t-0.15)/0.85;g.globalAlpha=Math.max(0,a)*0.8;const rg=g.createRadialGradient(x+Math.sin(t*9)*8,yy,0,x,yy,22);rg.addColorStop(0,'#ffffff');rg.addColorStop(0.4,'#bfe8ffaa');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.beginPath();g.arc(x+Math.sin(t*9)*8,yy,22,0,7);g.fill();}});
    if(boss){for(let k=0;k<5;k++){const ox=(Math.random()-0.5)*r.width,oy=(Math.random()-0.5)*r.height;fxAdd({k:'glow',x:x+ox,y:y+oy,r0:8,r1:90,c:'#ffd36acc',life:420,t0:T0(k*130)});fxAdd({k:'ring',x:x+ox,y:y+oy,r0:6,r1:120,s:5,c:k%2?'#ffffff':'#ffb040',life:520,t0:T0(k*130)});}
      burst(x,y,['#ffffff','#ffd36a','#ff8a3a'],70,9,{g:0.05});flashScreen('#ffffff66');const w=root.querySelector('.cwrap');cfxAnim(w,[{transform:'none'},{transform:'translate(7px,-5px)'},{transform:'translate(-7px,4px)'},{transform:'translate(5px,4px)'},{transform:'translate(-4px,-3px)'},{transform:'none'}],{duration:620,easing:'linear'});}
    if(v.final){for(let k=0;k<6;k++)fxAdd({k:'ring',x,y,r0:10,r1:innerWidth*0.8,s:7,c:['#ffffff','#ffd36a','#fff4c0'][k%3],life:1400,t0:T0(k*140)});burst(x,y,['#ffffff','#ffd36a','#fff4c0'],160,14,{g:0.03});flashScreen('#ffffff');sfx('victory');}
    setTimeout(()=>el.classList.remove('dying'),640);});}

function cfxCast(root,el,v,sp){const [x,y,r]=cfxPt(el);const kind=v.k==='heal'?'heal':v.k==='buff'?'buff':(v.e||'arcane');const c=ELEM_COL[kind]||ELEM_COL.arcane;
  for(let i=0;i<16;i++){const a=Math.random()*6.283,R=46+Math.random()*26,life=260*sp+60;fxAdd({k:'fn',life,t0:T0(Math.random()*90),fade:0,draw(g,t){const rr=R*(1-t);g.globalAlpha=t;g.fillStyle=c[i%2];g.beginPath();g.arc(x+Math.cos(a+t*1.6)*rr,y+Math.sin(a+t*1.6)*rr,2.2,0,7);g.fill();}});}
  fxAdd({k:'ring',x,y,r0:44,r1:-36,s:3,c:c[0],life:280*sp+40});cfxAnim(el,[{filter:'brightness(1)',transform:'none'},{filter:'brightness(1.55)',transform:'scale(1.035)',offset:0.6},{filter:'brightness(1)',transform:'none'}],{duration:420*sp});
  if(v.n)cfxDom('callout e-'+kind,`<span>${E(v.n)}</span>`,Math.min(innerWidth-110,Math.max(110,x)),Math.max(30,r.top-6),1150);}

/* ---------- queue consumer (called after every combat render) ---------- */
function combatVfx(root){CFX.imp={};if(!C||!C.vfx||!C.vfx.length)return;const q=C.vfx.splice(0);const sp=cfxSp();let lead=0,n=0;const last={};
  for(const v of q){const el=cfxCard(root,v.a);if(!el)continue;const key=v.a._k;
    switch(v.t){
      case 'cast':cfxCast(root,el,v,sp);lead=250*sp;break;
      case 'hit':{const at=cfxAttack(root,cfxCard(root,v.s),el,v,lead+Math.min(n++,5)*120*sp,sp);(CFX.imp[key]=CFX.imp[key]||[]).push(at);last[key]=Math.max(last[key]||0,at);break;}
      case 'death':cfxDeathSeq(root,el,v,(last[key]||lead)+150*sp);break;
      case 'heal':{const [x,y,r]=cfxPt(el);cfxLater(lead,()=>{fxHeal(el);sfx('heal');});cfxPillar(x,r.bottom,'#b8f09a',lead,r.width*0.5,r.height+40);cfxGlyphs(x,y,r,'#c8ffb0',lead,true,'plus');cfxAnim(el,[{filter:'brightness(1)'},{filter:'brightness(1.5) saturate(1.3)',offset:0.4},{filter:'brightness(1)'}],{duration:600,delay:lead});(CFX.imp[key]=CFX.imp[key]||[]).push(lead+80);break;}
      case 'buff':{const [x,y,r]=cfxPt(el);cfxLater(lead,()=>{fxBuff(el,false);sfx('buff');});cfxGlyphs(x,y,r,'#ffd36a',lead,true,'chev');cfxAnim(el,[{transform:'none'},{transform:'translateY(-4px) scale(1.02)',offset:0.4},{transform:'none'}],{duration:480,delay:lead});break;}
      case 'debuff':{const [x,y,r]=cfxPt(el);const d=(last[key]||lead)+60;cfxLater(d,()=>{if(el.isConnected){fxBuff(el,true);sfx('debuff');}});cfxGlyphs(x,y,r,'#c08cff',d,false,'chev');break;}
      case 'miss':{const d=lead+120*sp;const s=Math.random()<0.5?-1:1;cfxLater(d,()=>{fxMiss(el);sfx('miss');});cfxAnim(el,[{transform:'none',opacity:1},{transform:`translateX(${s*26}px) skewX(${-s*8}deg)`,opacity:.55,offset:0.35},{transform:`translateX(${s*20}px)`,opacity:.8,offset:0.6},{transform:'none',opacity:1}],{duration:460*Math.max(0.6,sp),delay:d-60});(CFX.imp[key]=CFX.imp[key]||[]).push(d);break;}
      case 'summon':fxSummon(el);sfx('summon');el.classList.add('ascend');break;
      case 'phase':{flashScreen('#df5d4744');sfx('boss');el.classList.add('enrage');const [x,y]=cfxPt(el);for(let k=0;k<3;k++)fxAdd({k:'ring',x,y,r0:10,r1:innerWidth*0.6,s:6,c:k%2?'#ff8a3a':'#df5d47',life:900,t0:T0(k*160)});cfxAnim(el,[{transform:'none'},{transform:'scale(1.08)',filter:'brightness(1.8)',offset:0.3},{transform:'none'}],{duration:700});
        const w=root.querySelector('.cwrap');cfxAnim(w,[{transform:'none'},{transform:'translate(6px,-4px)'},{transform:'translate(-6px,4px)'},{transform:'translate(4px,3px)'},{transform:'none'}],{duration:500,easing:'linear'});break;}
    }}}
/* how long the next floating number for this fighter should wait so it pops exactly on impact */
function cfxFloatDelay(a){const q=CFX.imp[a._k];return q&&q.length?q.shift():0;}

/* ---------- banners: battle start, your turn, victory / defeat ---------- */
function cfxBanner(kind,title,sub,life){document.querySelectorAll('.cbanner').forEach(b=>b.remove());const d=document.createElement('div');d.className='cbanner '+kind;d.innerHTML=`<i></i><b>${E(title)}</b>${sub?`<small>${E(sub)}</small>`:''}<i></i>`;document.body.appendChild(d);setTimeout(()=>d.remove(),life||1500);return d;}
function cfxIntro(){if(!C)return;C.introT=performance.now();const boss=C.enemies.find(e=>e.boss);if(fxReduced())return;
  if(boss){cfxBanner('boss','Boss Battle',boss.name,2100);flashScreen('#df5d4730');sfx('boss');}else cfxBanner('start',C.opts.type==='duel'||C.opts.type==='arena'||C.opts.type==='pvp'?'Duel':'Encounter',C.enemies.length>1?`${C.enemies.length} enemies`:C.enemies[0]?C.enemies[0].name:'',1300);}
function cfxEnded(){if(!C||fxReduced())return;const el=document.getElementById('combat');el.classList.add('justended','res-'+C.result);setTimeout(()=>el.classList.remove('justended'),1200);
  if(C.result==='win'){cfxBanner('win','Victory','',1500);const x=innerWidth/2,y=innerHeight*0.36;for(let k=0;k<3;k++)fxAdd({k:'ring',x,y,r0:10,r1:innerWidth*0.55,s:5,c:k%2?'#ffffff':'#ffd36a',life:900,t0:T0(k*140)});burst(x,y,ELEM_COL.gold,44,7,{g:0.1,up:2});}
  else if(C.result==='lose'){cfxBanner('lose','Defeat','',1700);flashScreen('#7a101055');}
  else cfxBanner('start','Escaped','',1100);}
/* per-render hooks: resume intro / idle animations where they left off instead of restarting them */
function cfxFrame(el){if(!C)return;const now=performance.now();el.style.setProperty('--now',`-${Math.round(now%8000)}ms`);const since=now-(C.introT||0);el.classList.toggle('intro',since<900);if(since<900)el.style.setProperty('--iel',`-${Math.round(since)}ms`);
  if(!C.ended)el.classList.remove('res-win','res-lose','res-fled');
  const w=!!(C.waiting&&!C.ended);if(w&&!CFX.wasWaiting){CFX.turnT=now;if(!fxReduced()&&since>1200){const me=el.querySelector('.actor.me');if(me){const [x,y]=cfxPt(me);fxAdd({k:'ring',x,y,r0:10,r1:70,s:3,c:'#ffd36a',life:500});}}}
  CFX.wasWaiting=w;el.classList.toggle('fresh',w&&now-(CFX.turnT||0)<350);}
