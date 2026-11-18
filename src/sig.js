/* ETERNAL REALMS — signature skill effects.
   Every skill is sorted (by its name) into one of ~25 signature looks — meteor, arrow rain, chain lightning, ground
   spikes, vines, void rift, judgement blade, barrier, war cry … — drawn as an extra layer over the normal weapon /
   element impact from cfx.js. Plain attacks get a random swing variant so repeated hits don't look identical.
   Each look is one or two canvas drawers (k:'fn'), so phones stay inside the particle budget. */
'use strict';
const SIG_HIT=[
  ['chain',/chain/],
  ['meteor',/meteor|cataclysm|skyfall|starfall|dragon dive|dragoon|heaven splitter|sovereign/],
  ['rain',/rain|blizzard|volley|javelin storm|needles|weapon storm|golden shower|storm call|thunderstorm|arsenal/],
  ['nova',/nova|burst|shockwave|earthquake|earthshaker|thunderclap|explosi|grenade|consecration|crescendo|thunder chord|buy victory/],
  ['rift',/rift|void|gate|doom|soul harvest|requiem|shadowflame|corpse|cataclysm/],
  ['drain',/drain|siphon|death grip|leech|soul link/],
  ['spike',/spike|spear|impale|fang|thrust|piercing|heartseeker|bone|lance|aimed shot|bolt shot|siege|pin down/],
  ['vines',/vine|thorn|entangle|wild|force of nature|nature|snare|trap/],
  ['judge',/smite|judgement|avenging|verdict|crusader|holy strike|templar|chi burst/],
  ['inferno',/inferno|fireball|flame|wyrmfire|breath|soul fire|firebolt/],
  ['ice',/glacial|frost|ice/],
  ['fork',/spark|lightning|thunder|storm/],
  ['execute',/execut|assassinate|eviscerate|death mark|throat|backstab|saint|cheap shot|apex|reckless/],
  ['flurry',/flurry|hundred|thousand cuts|blade dance|phantom|ravage|twin|tiger|barrage|echo|multishot|rampage/],
  ['whirl',/whirlwind|cleave|sweep|moonlight|crosscut|rending|weapon storm/],
  ['smash',/bash|crush|skullcrack|kick|palm|power strike|charge|pressure|shield|staff sweep|chop|lunge|iaido|riposte|unholy|spell strike|holy/],
  ['arcane',/missile|mana bolt|arcane|spirit|eldritch|moonfire|discord|chord|archon|convergence|rune|coin|bribe|price/],
  ['tendril',/shadow|lash|curse|hex|fear|plague|whip/]];
const SIG_AID=[
  ['barrier',/shield|ward|aegis|bulwark|armor|fortify|wall|iron body|guardian|phalanx|mana shield|parry|counter|duel stance/],
  ['time',/time/],
  ['vanish',/vanish|camouflage|shadowstep|smoke|stealth/],
  ['bloom',/bloom|rejuvenate|growth|renew|mending|totem|bond|wolfpack|hunter/],
  ['radiance',/lay on hands|divine|miracle|resurrection|mass heal|sanctuary|heal|purify|light|ancestral|second wind|inner focus|bless|repair|encore|song of ages|rally/],
  ['transform',/form|avatar|mech|lich|runeblade|focus|empower|eye of|pact|undying|blood frenzy|frenzy|bloodlust|overcharge/],
  ['roar',/cry|roar|song|ballad|command|symphony|challenge|taunt|rage|last stand|war|pack|eagle|lullaby|flashbang/]];
const SIG={cache:{}};
function sigOf(id,name,aid){if(!id&&!name)return null;const key=(aid?'a:':'h:')+(id||name);if(key in SIG.cache)return SIG.cache[key];
  const s=SKILLS[id];const txt=((s&&s.n)||name||'')+' '+String(id||'').replace(/_/g,' ');const t=txt.toLowerCase();let r=null;
  for(const [k,re] of (aid?SIG_AID:SIG_HIT))if(re.test(t)){r=k;break;}return SIG.cache[key]=r;}
function sigCol(e,def){return (ELEM_COL[e]||def||ELEM_COL.phys||['#ffe0c8','#ffffff']);}
function sigShake(root,d,m){if(fxReduced())return;cfxLater(d,()=>{const w=root.querySelector('.cwrap');cfxAnim(w,[{transform:'none'},{transform:`translate(${6*m}px,${-4*m}px)`,offset:0.15},{transform:`translate(${-6*m}px,${4*m}px)`,offset:0.35},{transform:`translate(${4*m}px,${2*m}px)`,offset:0.6},{transform:'none'}],{duration:420,easing:'linear'});});}
const sigEase=t=>t<0?0:t>1?1:t;
const sigFade=(t,a,b)=>t<a?t/a:t>b?Math.max(0,1-(t-b)/(1-b)):1;

/* ---------- offensive signatures (drawn on the target; `at` = the ms the blow lands) ---------- */
function sigHit(root,src,el,v,at,sp){const sig=sigOf(v.sk);if(!sig||!el.isConnected||fxReduced())return;const [x,y,r]=cfxPt(el);const c=sigCol(v.e,v.sk&&/holy|smite|judge|light|crusader|templar/.test(v.sk)?ELEM_COL.holy:null);const big=v.crit?1.3:1;
  const sxy=src?cfxPt(src):[x,y+200];
  switch(sig){
    case 'meteor':{const d=Math.max(0,at-420*sp),L=420*sp;const ox=x+140,oy=Math.max(-40,y-innerHeight*0.75);
      fxAdd({k:'fn',life:L+40,t0:T0(d),fade:0,draw(g,t){const p=sigEase(t*1.08),mx=ox+(x-ox)*p*p,my=oy+(y-oy)*p*p;
        for(let i=8;i>=0;i--){const q=Math.max(0,p-i*0.035),tx=ox+(x-ox)*q*q,ty=oy+(y-oy)*q*q;g.globalAlpha=0.08+0.09*(8-i)/8;g.fillStyle=i<3?'#fff2c0':c[0];g.beginPath();g.arc(tx,ty,(16-i)*big,0,7);g.fill();}
        g.globalAlpha=1;g.shadowColor=c[0];g.shadowBlur=30;g.fillStyle='#3a2418';g.beginPath();g.arc(mx,my,13*big,0,7);g.fill();g.strokeStyle=c[1];g.lineWidth=3;g.stroke();}});
      fxAdd({k:'glow',x,y,r0:20,r1:150*big,c:c[0]+'cc',life:520,t0:T0(at)});fxAdd({k:'ring',x,y,r0:10,r1:170*big,s:7,c:c[1],life:560,t0:T0(at)});
      fxAdd({k:'fn',life:700,t0:T0(at),fade:0,draw(g,t){g.globalAlpha=(1-t)*0.8;g.strokeStyle='#2a1a10';g.lineWidth=3;for(let i=0;i<9;i++){const a=i/9*6.283+0.3;g.beginPath();g.moveTo(x,y+r.height*0.3);let px=x,py=y+r.height*0.3;for(let k=1;k<4;k++){px+=Math.cos(a)*16*k*Math.min(1,t*4);py+=Math.sin(a)*6*k*Math.min(1,t*4);g.lineTo(px+(k%2?5:-5),py);}g.stroke();}}});
      for(let i=0;i<14;i++)fxAdd({k:'rect',x,y,vx:(Math.random()-0.5)*10,vy:-3-Math.random()*6,g:0.34,c:['#5a4030','#ff8a3a','#2a1a10'][i%3],s:6,life:700,vr:(Math.random()-0.5)*0.5,t0:T0(at)});
      sigShake(root,at,1.4);cfxLater(at,()=>flashScreen(c[0]+'40'));break;}
    case 'rain':{const d=Math.max(0,at-260*sp);const n=v.e==='frost'?26:20;const drops=[...Array(n)].map(()=>({ox:(Math.random()-0.5)*r.width*1.3,oy:(Math.random()-0.5)*r.height*0.8,dl:Math.random()*0.5}));
      fxAdd({k:'fn',life:760*sp+120,t0:T0(d),fade:0,draw(g,t){g.lineCap='round';g.shadowColor=c[0];g.shadowBlur=8;for(const q of drops){const tt=(t-q.dl)/0.45;if(tt<0||tt>1.25)continue;const tx=x+q.ox,ty=y+q.oy;
          if(tt<=1){const hx=tx-60*(1-tt),hy=ty-200*(1-tt);g.globalAlpha=0.9;g.strokeStyle=c[1];g.lineWidth=v.e==='frost'?2:2.6;g.beginPath();g.moveTo(hx-14,hy-46);g.lineTo(hx,hy);g.stroke();}
          else{g.globalAlpha=1-(tt-1)*4;g.strokeStyle=c[0];g.lineWidth=1.5;g.beginPath();g.ellipse(tx,ty,4+(tt-1)*40,2+(tt-1)*14,0,0,7);g.stroke();}}}});break;}
    case 'chain':{const side=el.closest('.side')||el.parentElement;const others=[...(side?side.querySelectorAll('[data-k]'):[])].filter(e=>e!==el).slice(0,3);const pts=[[sxy[0],sxy[1]],[x,y],...others.map(e=>cfxPt(e))];
      fxAdd({k:'fn',life:520,t0:T0(Math.max(0,at-60)),fade:0,draw(g,t){const seg=Math.min(pts.length-1,Math.floor(t*pts.length*1.6)+1);g.lineCap='round';g.shadowColor=c[1];g.shadowBlur=18;g.globalAlpha=1-Math.max(0,(t-0.55)/0.45);
        for(let s=0;s<seg;s++){const [ax,ay]=pts[s],[bx,by]=pts[s+1];for(let w of [5,2]){g.strokeStyle=w>3?c[1]:'#ffffff';g.lineWidth=w;g.beginPath();g.moveTo(ax,ay);for(let k=1;k<8;k++){const f=k/8;g.lineTo(ax+(bx-ax)*f+(Math.random()-0.5)*26,ay+(by-ay)*f+(Math.random()-0.5)*26);}g.lineTo(bx,by);g.stroke();}
          g.fillStyle='#ffffff';g.beginPath();g.arc(bx,by,7,0,7);g.fill();}}});break;}
    case 'nova':{const d=Math.max(0,at-40);for(let k=0;k<3;k++)fxAdd({k:'fn',life:620,t0:T0(d+k*90),fade:0,draw(g,t){g.globalAlpha=(1-t)*0.9;g.strokeStyle=k===1?'#ffffff':c[k%2];g.shadowColor=c[0];g.shadowBlur=18;g.lineWidth=(10-k*3)*(1-t)+1;g.save();g.translate(x,y+r.height*0.25);g.scale(1,0.42);g.beginPath();g.arc(0,0,20+170*big*sigEase(t*1.2),0,7);g.stroke();g.restore();}});
      fxAdd({k:'glow',x,y,r0:10,r1:110*big,c:c[0]+'aa',life:360,t0:T0(d)});for(let i=0;i<12;i++)fxAdd({k:'rect',x:x+(Math.random()-0.5)*r.width,y:y+r.height*0.3,vx:(Math.random()-0.5)*5,vy:-2-Math.random()*3,g:0.2,c:['#6a5a48','#9a8a70',c[0]][i%3],s:4,life:600,t0:T0(d)});sigShake(root,d,0.9);break;}
    case 'rift':{const d=Math.max(0,at-300*sp);fxAdd({k:'fn',life:900*sp+100,t0:T0(d),fade:0,draw(g,t){const a=sigFade(t,0.2,0.7);g.globalAlpha=a;g.save();g.translate(x,y);g.rotate(t*7);
        const R=(30+50*Math.min(1,t*3))*big*(t>0.7?1-(t-0.7)/0.3*0.8:1);const rg=g.createRadialGradient(0,0,2,0,0,R);rg.addColorStop(0,'#000000');rg.addColorStop(0.55,'#14051f');rg.addColorStop(0.8,c[0]);rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.beginPath();g.arc(0,0,R,0,7);g.fill();
        g.strokeStyle=c[0];g.lineWidth=2.5;g.shadowColor=c[0];g.shadowBlur=14;for(let k=0;k<5;k++){g.beginPath();for(let s=0;s<30;s++){const f=s/30,ang=k*1.2566+f*4.2,rr=R*1.5*(1-f);s?g.lineTo(Math.cos(ang)*rr,Math.sin(ang)*rr):g.moveTo(Math.cos(ang)*rr,Math.sin(ang)*rr);}g.stroke();}g.restore();}});
      cfxImplode(x,y,[c[0],'#ffffff'],d+100);break;}
    case 'drain':{const n=14;const ps=[...Array(n)].map((_,i)=>({o:(Math.random()-0.5)*90,dl:i/n*0.5}));const [sx,sy]=sxy;
      fxAdd({k:'fn',life:900,t0:T0(at),fade:0,draw(g,t){g.shadowColor=c[0];g.shadowBlur=12;for(const q of ps){const tt=(t-q.dl)/0.5;if(tt<0||tt>1)continue;const e=tt*tt*(3-2*tt);const mx=(x+sx)/2+q.o,my=(y+sy)/2-40;const px=(1-e)*(1-e)*x+2*(1-e)*e*mx+e*e*sx,py=(1-e)*(1-e)*y+2*(1-e)*e*my+e*e*sy;
          g.globalAlpha=Math.sin(tt*3.14);g.fillStyle=q.o>0?c[0]:'#ff4a6a';g.beginPath();g.arc(px,py,3.5,0,7);g.fill();}}});
      if(src)cfxLater(at+500,()=>{if(src.isConnected)cfxAnim(src,[{filter:'brightness(1)'},{filter:'brightness(1.6) saturate(1.4)',offset:0.4},{filter:'brightness(1)'}],{duration:500});});break;}
    case 'spike':{const d=Math.max(0,at-30);const n=5;const sp_=[...Array(n)].map((_,i)=>({ox:(i-(n-1)/2)*r.width*0.2+(Math.random()-0.5)*8,h:(50+Math.random()*50)*big,w:9+Math.random()*6,dl:Math.abs(i-(n-1)/2)*0.06}));const base=r.bottom-6;
      const col=v.e==='shadow'?['#e8e0ff','#5a3a8a']:v.e==='frost'?['#e8fbff','#7fc8ef']:v.e&&v.e!=='phys'?[c[1],c[0]]:['#d8ccb8','#6a5a48'];
      fxAdd({k:'fn',life:700,t0:T0(d),fade:0,draw(g,t){for(const q of sp_){const tt=sigEase((t-q.dl)*5);const h=q.h*tt*(t>0.7?1-(t-0.7)/0.3:1);if(h<=0)continue;const bx=x+q.ox;
          const lg=g.createLinearGradient(bx,base,bx,base-h);lg.addColorStop(0,col[1]);lg.addColorStop(1,col[0]);g.globalAlpha=1;g.fillStyle=lg;g.shadowColor=col[1];g.shadowBlur=10;g.beginPath();g.moveTo(bx-q.w,base);g.lineTo(bx,base-h);g.lineTo(bx+q.w,base);g.closePath();g.fill();}}});
      cfxSparks(x,base-20,['#ffffff',col[0]],10,5,d+40);break;}
    case 'vines':{const d=Math.max(0,at-80);const vs=[...Array(4)].map((_,i)=>({ph:i*1.57+Math.random(),side:i%2?1:-1}));
      fxAdd({k:'fn',life:1100,t0:T0(d),fade:0,draw(g,t){const grow=sigEase(t*2.2),a=t>0.75?1-(t-0.75)/0.25:1;g.globalAlpha=a;g.lineCap='round';
        for(const q of vs){g.strokeStyle='#3f7a2a';g.lineWidth=5;g.beginPath();const H=r.height*1.05;let lx=0,ly=0;for(let s=0;s<=24*grow;s++){const f=s/24;lx=x+Math.sin(f*9+q.ph)*r.width*0.42*q.side;ly=r.bottom-f*H;s?g.lineTo(lx,ly):g.moveTo(lx,ly);}g.stroke();
          g.strokeStyle='#8fe06a';g.lineWidth=1.6;g.stroke();g.fillStyle='#6ac04a';for(let s=3;s<24*grow;s+=4){const f=s/24;const px=x+Math.sin(f*9+q.ph)*r.width*0.42*q.side,py=r.bottom-f*H;g.beginPath();g.ellipse(px+6*q.side,py,6,3,q.side*0.6,0,7);g.fill();}}}});break;}
    case 'judge':{const d=Math.max(0,at-340*sp),L=340*sp;const top=Math.max(-60,r.top-innerHeight*0.45);
      fxAdd({k:'fn',life:L+520,t0:T0(d),fade:0,draw(g,t){const fall=sigEase(t*(L+520)/L),py=top+(y+10-top)*fall*fall;const a=t>0.75?1-(t-0.75)/0.25:1;g.globalAlpha=a;g.shadowColor='#fff4b0';g.shadowBlur=26;
        g.fillStyle='#fffbe8';g.beginPath();g.moveTo(x,py+30);g.lineTo(x-11,py-10);g.lineTo(x-8,py-120);g.lineTo(x+8,py-120);g.lineTo(x+11,py-10);g.closePath();g.fill();
        g.fillStyle='#ffd36a';g.fillRect(x-30,py-128,60,9);g.fillRect(x-5,py-160,10,32);g.beginPath();g.arc(x,py-164,8,0,7);g.fill();
        if(fall>=1){g.globalAlpha=a*0.5;g.fillStyle='#fff4b0';g.fillRect(x-4,0,8,py);}}});
      fxAdd({k:'ring',x,y,r0:8,r1:110*big,s:5,c:'#fff4b0',life:520,t0:T0(at)});fxAdd({k:'glow',x,y,r0:10,r1:120,c:'#fff8d0cc',life:380,t0:T0(at)});cfxLater(at,()=>flashScreen('#fff4b033'));sigShake(root,at,0.8);break;}
    case 'inferno':{const d=Math.max(0,at-40);const fl=[...Array(9)].map((_,i)=>({ox:(i-4)*r.width*0.1,h:(70+Math.random()*70)*big,ph:Math.random()*6}));
      fxAdd({k:'fn',life:900,t0:T0(d),fade:0,draw(g,t){const a=sigFade(t,0.12,0.6);g.globalCompositeOperation='lighter';for(const q of fl){const h=q.h*Math.min(1,t*4)*(0.8+0.2*Math.sin(t*30+q.ph));const bx=x+q.ox,by=r.bottom-4;
          for(const [w,col,al] of [[16,c[0],0.55],[8,c[1],0.8]]){g.globalAlpha=a*al;g.fillStyle=col;g.beginPath();g.moveTo(bx-w,by);g.quadraticCurveTo(bx-w*0.8+Math.sin(t*20+q.ph)*8,by-h*0.6,bx+Math.sin(t*14+q.ph)*10,by-h);g.quadraticCurveTo(bx+w*0.8+Math.sin(t*22+q.ph)*8,by-h*0.6,bx+w,by);g.closePath();g.fill();}}}});
      for(let i=0;i<16;i++)fxAdd({x:x+(Math.random()-0.5)*r.width,y:r.bottom-10,vx:(Math.random()-0.5)*1.2,vy:-2-Math.random()*3,g:-0.03,c:['#ffd36a','#ff6a2a'][i%2],s:2,life:800,t0:T0(d+Math.random()*300)});break;}
    case 'ice':{const d=Math.max(0,at-20);const W=r.width*0.62*big,H=r.height*0.72*big;
      fxAdd({k:'fn',life:760,t0:T0(d),fade:0,draw(g,t){const gr=sigEase(t*3.5);if(t>0.72)return;g.globalAlpha=0.75;g.shadowColor='#bfeaff';g.shadowBlur=16;const lg=g.createLinearGradient(x-W,y-H,x+W,y+H);lg.addColorStop(0,'#e8fbffcc');lg.addColorStop(0.5,'#7fc8ef66');lg.addColorStop(1,'#dff6ffcc');g.fillStyle=lg;g.strokeStyle='#ffffff';g.lineWidth=2;
        g.beginPath();g.moveTo(x,y-H*gr);g.lineTo(x+W*0.7*gr,y-H*0.35*gr);g.lineTo(x+W*gr*0.62,y+H*0.5*gr);g.lineTo(x,y+H*0.8*gr);g.lineTo(x-W*0.62*gr,y+H*0.5*gr);g.lineTo(x-W*0.7*gr,y-H*0.35*gr);g.closePath();g.fill();g.stroke();
        g.globalAlpha=0.6;g.beginPath();g.moveTo(x,y-H*gr);g.lineTo(x,y+H*0.8*gr);g.moveTo(x-W*0.7*gr,y-H*0.35*gr);g.lineTo(x+W*0.62*gr,y+H*0.5*gr);g.stroke();}});
      cfxShards(x,y,['#ffffff','#9fe2ff'],d+540,14);cfxLater(d+540,()=>sfx('crit',{e:'frost'}));break;}
    case 'fork':{const d=Math.max(0,at-30);fxAdd({k:'fn',life:420,t0:T0(d),fade:0,draw(g,t){if(t>0.75&&Math.random()<0.5)return;g.globalAlpha=1-t*0.8;g.lineCap='round';g.shadowColor=c[1];g.shadowBlur=22;
        const br=(x0,y0,ang,len,w,depth)=>{let px=x0,py=y0;g.lineWidth=w;g.strokeStyle=depth?c[0]:'#ffffff';g.beginPath();g.moveTo(px,py);const n=6;for(let k=0;k<n;k++){px+=Math.cos(ang)*len/n+(Math.random()-0.5)*18;py+=Math.sin(ang)*len/n;g.lineTo(px,py);if(depth<2&&Math.random()<0.3){g.stroke();br(px,py,ang+(Math.random()<0.5?-0.7:0.7),len*0.45,w*0.6,depth+1);g.lineWidth=w;g.strokeStyle=depth?c[0]:'#ffffff';g.beginPath();g.moveTo(px,py);}}g.stroke();};
        br(x+(Math.random()-0.5)*30,Math.max(0,y-innerHeight*0.5),1.5708,y-Math.max(0,y-innerHeight*0.5),4,0);}});cfxLater(d,()=>flashScreen('#e8f4ff38'));break;}
    case 'execute':{const d=Math.max(0,at-180*sp);
      fxAdd({k:'fn',life:700,t0:T0(d),fade:0,draw(g,t){g.globalAlpha=0.5*sigFade(t,0.15,0.5);g.fillStyle='#000000';g.fillRect(0,0,innerWidth,innerHeight);}});
      fxAdd({k:'fn',life:520,t0:T0(at-40),fade:0,draw(g,t){const p=sigEase(t*4),a=1-Math.max(0,(t-0.35)/0.65);g.globalAlpha=a;g.lineCap='round';g.shadowColor='#ff2a3a';g.shadowBlur=24;const L=Math.max(r.width,r.height)*1.1;
        for(const [w,col] of [[14,'#ff2a3a'],[4,'#ffffff']]){g.strokeStyle=col;g.lineWidth=w*(1-t*0.6);g.beginPath();g.moveTo(x-L*0.6,y-L*0.6);g.lineTo(x-L*0.6+L*1.2*p,y-L*0.6+L*1.2*p);g.stroke();}}});
      for(let i=0;i<16;i++)fxAdd({x,y,vx:(Math.random()-0.2)*6,vy:-1-Math.random()*4,g:0.25,c:['#c0102a','#ff3a4a','#7a0a18'][i%3],s:2.6+Math.random()*2,life:800,t0:T0(at)});cfxLater(at,()=>flashScreen('#ff1a2a2a'));sigShake(root,at,1);break;}
    case 'flurry':{const d=Math.max(0,at-60);for(let i=0;i<6;i++){const a=Math.random()*3.14,L=36+Math.random()*30;const ox=(Math.random()-0.5)*r.width*0.4,oy=(Math.random()-0.5)*r.height*0.4;
        cfxLine(x+ox-Math.cos(a)*L,y+oy-Math.sin(a)*L,x+ox+Math.cos(a)*L,y+oy+Math.sin(a)*L,i%2?'#ffffff':c[0],i%2?2.5:4,d+i*45,170);}
      fxAdd({k:'fn',life:420,t0:T0(d),fade:0,draw(g,t){g.globalAlpha=(1-t)*0.6;g.strokeStyle='#ffffff';g.lineWidth=1.5;for(let k=0;k<10;k++){const a=k*0.628+t*2;g.beginPath();g.moveTo(x+Math.cos(a)*30,y+Math.sin(a)*30);g.lineTo(x+Math.cos(a)*(40+60*t),y+Math.sin(a)*(40+60*t));g.stroke();}}});break;}
    case 'whirl':{const d=Math.max(0,at-120);const R=Math.max(r.width,r.height)*0.62*big;
      fxAdd({k:'fn',life:520,t0:T0(d),fade:0,draw(g,t){const a0=t*9,span=2.6;g.globalAlpha=1-Math.max(0,(t-0.5)/0.5);g.lineCap='round';g.shadowColor=c[0];g.shadowBlur=16;
        for(let k=0;k<3;k++){g.strokeStyle=k?c[0]:'#ffffff';g.lineWidth=(12-k*4);g.beginPath();g.ellipse(x,y,R+k*6,R*0.55+k*4,0,a0-span+k*0.2,a0+k*0.2);g.stroke();}}});
      for(let i=0;i<10;i++)fxAdd({k:'streak',x,y,vx:(Math.random()-0.5)*12,vy:(Math.random()-0.5)*5,c:'#ffffff',s:1.6,life:300,t0:T0(d+200),drag:0.9});break;}
    case 'smash':{const d=at;fxAdd({k:'fn',life:900,t0:T0(d),fade:0,draw(g,t){const a=1-Math.max(0,(t-0.5)/0.5);g.globalAlpha=a;g.strokeStyle='#1a120c';g.lineWidth=2.5;
        for(let i=0;i<6;i++){const ang=i/6*6.283+0.4;g.beginPath();let px=x,py=y;g.moveTo(px,py);for(let k=1;k<=3;k++){px+=Math.cos(ang+(k%2?0.3:-0.3))*14*Math.min(1,t*6);py+=Math.sin(ang+(k%2?0.3:-0.3))*14*Math.min(1,t*6);g.lineTo(px,py);}g.stroke();}
        g.fillStyle='#ffe27a';g.shadowColor='#ffe27a';g.shadowBlur=10;for(let k=0;k<4;k++){const ang=t*8+k*1.57,sx=x+Math.cos(ang)*r.width*0.36,sy=r.top+16+Math.sin(ang)*8;g.beginPath();for(let s=0;s<10;s++){const rr=s%2?3:7,aa=s*0.628;g.lineTo(sx+Math.cos(aa)*rr,sy+Math.sin(aa)*rr);}g.closePath();g.fill();}}});
      fxAdd({k:'glow',x,y,r0:6,r1:60*big,c:'#ffffffcc',life:200,t0:T0(d)});break;}
    case 'arcane':{const d=Math.max(0,at-200*sp);const R=Math.min(r.width,r.height)*0.55;
      fxAdd({k:'fn',life:900,t0:T0(d),fade:0,draw(g,t){const a=sigFade(t,0.2,0.65);g.globalAlpha=a;g.save();g.translate(x,r.bottom-10);g.scale(1,0.38);g.rotate(t*3);g.strokeStyle=c[0];g.shadowColor=c[0];g.shadowBlur=14;g.lineWidth=2.5;
        g.beginPath();g.arc(0,0,R,0,7);g.stroke();g.beginPath();g.arc(0,0,R*0.8,0,7);g.stroke();g.beginPath();for(let k=0;k<6;k++){const aa=k/6*6.283;g.lineTo(Math.cos(aa)*R*0.8,Math.sin(aa)*R*0.8);}g.closePath();g.stroke();
        g.beginPath();for(let k=0;k<7;k++){const aa=k*2*6.283/7;g.lineTo(Math.cos(aa)*R*0.8,Math.sin(aa)*R*0.8);}g.stroke();g.restore();
        g.fillStyle=c[1];for(let k=0;k<5;k++){const aa=t*6+k*1.2566;g.beginPath();g.arc(x+Math.cos(aa)*R*0.9,y+Math.sin(aa)*R*0.45,3.5,0,7);g.fill();}}});break;}
    case 'tendril':{const d=Math.max(0,at-100);const ts=[...Array(5)].map((_,i)=>({ox:(i-2)*r.width*0.18,ph:Math.random()*6,h:r.height*(0.7+Math.random()*0.5)}));
      fxAdd({k:'fn',life:900,t0:T0(d),fade:0,draw(g,t){const gr=sigEase(t*3),a=t>0.6?1-(t-0.6)/0.4:1;g.globalAlpha=a;g.lineCap='round';g.shadowColor=c[0];g.shadowBlur=12;
        for(const q of ts){for(const [w,col] of [[7,'#14051f'],[2.5,c[0]]]){g.strokeStyle=col;g.lineWidth=w;g.beginPath();for(let s=0;s<=18*gr;s++){const f=s/18;const px=x+q.ox+Math.sin(f*7+q.ph+t*8)*14*f,py=r.bottom-f*q.h;s?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();}}}});break;}
  }}

/* ---------- supportive signatures (heals / buffs on the target, or a shout from the caster) ---------- */
function sigAid(root,el,sig,d,v){if(!sig||!el.isConnected||fxReduced())return;const [x,y,r]=cfxPt(el);
  switch(sig){
    case 'barrier':{const R=Math.max(r.width,r.height)*0.62;fxAdd({k:'fn',life:1100,t0:T0(d),fade:0,draw(g,t){const a=sigFade(t,0.18,0.6),s=0.6+0.4*sigEase(t*5);g.globalAlpha=a*0.9;g.strokeStyle='#9fd8ff';g.shadowColor='#9fd8ff';g.shadowBlur=14;g.lineWidth=1.6;
        const hx=15;for(let i=-4;i<=4;i++)for(let j=-5;j<=5;j++){const cx=x+i*hx*1.5,cy=y+j*hx*1.73+(i%2?hx*0.866:0);const dd=Math.hypot((cx-x)/(R*s),(cy-y)/(R*1.15*s));if(dd>1)continue;g.globalAlpha=a*(0.25+0.6*dd*dd);g.beginPath();for(let k=0;k<6;k++){const aa=k*1.047;g.lineTo(cx+Math.cos(aa)*hx*0.92,cy+Math.sin(aa)*hx*0.92);}g.closePath();g.stroke();}
        g.globalAlpha=a;g.lineWidth=3;g.beginPath();g.ellipse(x,y,R*s,R*1.15*s,0,0,7);g.stroke();}});break;}
    case 'roar':{for(let k=0;k<4;k++)fxAdd({k:'fn',life:560,t0:T0(d+k*90),fade:0,draw(g,t){g.globalAlpha=(1-t)*0.85;g.strokeStyle=k%2?'#ffd36a':'#ff8a5a';g.lineWidth=4*(1-t)+1;g.shadowColor='#ff8a5a';g.shadowBlur=12;const R=20+150*t;
        for(const s of [-1,1]){g.beginPath();g.arc(x,y,R,s>0?-0.8:2.34,s>0?0.8:3.94);g.stroke();}}});sigShake(root,d+60,0.6);break;}
    case 'vanish':{for(let i=0;i<12;i++){const a=Math.random()*6.283,vv=0.5+Math.random()*1.4;fxAdd({k:'fn',life:900,t0:T0(d+Math.random()*120),fade:0,draw(g,t){const R=10+38*t;g.globalAlpha=(1-t)*0.5;g.fillStyle=i%2?'#8a8a9a':'#4a4a5a';g.beginPath();g.arc(x+Math.cos(a)*vv*60*t,y+Math.sin(a)*vv*30*t-20*t,R,0,7);g.fill();}});}
      cfxAnim(el,[{opacity:1,filter:'blur(0)'},{opacity:0.15,filter:'blur(3px)',offset:0.35},{opacity:0.35,offset:0.7},{opacity:1,filter:'blur(0)'}],{duration:900,delay:d});break;}
    case 'bloom':{const ps=[...Array(14)].map((_,i)=>({a:i/14*6.283,dl:Math.random()*0.25,c:['#ffb0d0','#8fe06a','#ffe0f0','#c8ff9a'][i%4]}));
      fxAdd({k:'fn',life:1100,t0:T0(d),fade:0,draw(g,t){for(const q of ps){const tt=(t-q.dl)/0.75;if(tt<0||tt>1)continue;const ang=q.a+tt*5,R=r.width*0.5*(1-tt*0.5);g.globalAlpha=Math.sin(tt*3.14);g.fillStyle=q.c;g.save();g.translate(x+Math.cos(ang)*R,r.bottom-tt*r.height*1.1);g.rotate(ang);g.beginPath();g.ellipse(0,0,6,3,0,0,7);g.fill();g.restore();}}});break;}
    case 'radiance':{const top=Math.max(0,r.top-innerHeight*0.4);fxAdd({k:'fn',life:1000,t0:T0(d),fade:0,draw(g,t){const a=sigFade(t,0.2,0.55);const w=r.width*0.55*(0.6+0.4*Math.sin(t*3.14));const lg=g.createLinearGradient(x-w,0,x+w,0);lg.addColorStop(0,'rgba(255,244,176,0)');lg.addColorStop(0.5,'#fff4b0');lg.addColorStop(1,'rgba(255,244,176,0)');
        g.globalAlpha=a*0.55;g.fillStyle=lg;g.fillRect(x-w,top,w*2,r.bottom-top);g.globalAlpha=a;g.fillStyle='#ffffff';for(let k=0;k<6;k++){const fx_=x+Math.sin(k*2.1+t*4)*w*0.8,fy=top+((t*1.4+k/6)%1)*(r.bottom-top);g.save();g.translate(fx_,fy);g.rotate(Math.sin(t*5+k));g.beginPath();g.ellipse(0,0,7,2.5,0,0,7);g.fill();g.restore();}}});break;}
    case 'transform':{fxAdd({k:'fn',life:1000,t0:T0(d),fade:0,draw(g,t){const a=sigFade(t,0.15,0.6);g.globalCompositeOperation='lighter';const col=(v&&v.e&&ELEM_COL[v.e])?ELEM_COL[v.e][0]:'#ff7a3a';
        for(let k=0;k<12;k++){const bx=x+(k-5.5)*r.width*0.085,h=r.height*(0.5+0.4*Math.sin(t*18+k*1.7))*sigEase(t*4);g.globalAlpha=a*0.45;g.fillStyle=col;g.beginPath();g.moveTo(bx-9,r.bottom);g.quadraticCurveTo(bx+Math.sin(t*20+k)*8,r.bottom-h*0.6,bx,r.bottom-h);g.quadraticCurveTo(bx+9,r.bottom-h*0.5,bx+9,r.bottom);g.fill();}}});
      cfxLater(d+120,()=>{if(el.isConnected)cfxAnim(el,[{transform:'none',filter:'brightness(1)'},{transform:'scale(1.08)',filter:'brightness(1.9) saturate(1.4)',offset:0.3},{transform:'scale(1.03)',filter:'brightness(1.3)',offset:0.6},{transform:'none',filter:'brightness(1)'}],{duration:700});});break;}
    case 'time':{const R=Math.max(r.width,r.height)*0.55;fxAdd({k:'fn',life:1100,t0:T0(d),fade:0,draw(g,t){const a=sigFade(t,0.15,0.7);g.globalAlpha=a;g.strokeStyle='#cfe8ff';g.shadowColor='#8fd0ff';g.shadowBlur=14;g.lineWidth=2.5;g.beginPath();g.arc(x,y,R,0,7);g.stroke();
        for(let k=0;k<12;k++){const aa=k*0.5236;g.beginPath();g.moveTo(x+Math.cos(aa)*R*0.85,y+Math.sin(aa)*R*0.85);g.lineTo(x+Math.cos(aa)*R,y+Math.sin(aa)*R);g.stroke();}
        g.lineWidth=4;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(-t*12-1.57)*R*0.8,y+Math.sin(-t*12-1.57)*R*0.8);g.stroke();g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(-t*2-1.57)*R*0.5,y+Math.sin(-t*2-1.57)*R*0.5);g.stroke();}});break;}
  }}

/* ---------- plain attacks: a random swing variant so ten hits in a row don't look identical ---------- */
function sigBasic(root,el,v,at){if(v.sk||fxReduced()||!el.isConnected)return;const [x,y,r]=cfxPt(el);const n=Math.floor(Math.random()*4);const c=sigCol(v.e);
  if(!v.melee||v.thrown){if(n===0)fxAdd({k:'ring',x,y,r0:2,r1:44,s:2,c:'#ffffff',life:240,t0:T0(at+20)});return;}
  if(n===0){const ang=(Math.random()<0.5?-1:1)*(0.3+Math.random()*0.5);cfxLine(x-Math.cos(ang)*58,y-Math.sin(ang)*58,x+Math.cos(ang)*58,y+Math.sin(ang)*58,'#ffffff',2.5,at+30,200);}
  else if(n===1){fxAdd({k:'fn',life:260,t0:T0(at),fade:0,draw(g,t){g.globalAlpha=1-t;g.strokeStyle=c[0];g.lineWidth=3;for(let k=0;k<8;k++){const a=k*0.785;g.beginPath();g.moveTo(x+Math.cos(a)*(14+30*t),y+Math.sin(a)*(14+30*t));g.lineTo(x+Math.cos(a)*(24+44*t),y+Math.sin(a)*(24+44*t));g.stroke();}}});}
  else if(n===2){for(let i=0;i<6;i++)fxAdd({x,y,vx:(Math.random()-0.5)*5,vy:-1-Math.random()*3,g:0.22,c:['#c0102a','#ff3a4a'][i%2],s:2.2,life:520,t0:T0(at)});}}
