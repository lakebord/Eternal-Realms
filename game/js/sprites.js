// Procedural chibi sprites. Every hero is drawn from layers (body → outfit → hair → face → headgear → weapon/shield)
// into a sprite sheet: rows = 4 directions (front, left, back, right), columns = animation frames.
// Monsters are drawn the same way. All art is original and generated in code.
import * as THREE from 'three';
export const FW=96,FH=128;
export const ANIMS={idle:[0,2],walk:[2,4],attack:[6,3],cast:[9,2],hit:[11,1],sit:[12,1],dead:[13,1]};   // [first column, frames]
const NCOL=14;
const shade=(hex,k)=>{const c=new THREE.Color(hex);c.multiplyScalar(k);return '#'+c.getHexString();};
const OL='#2a1c18';
function poly(g,pts,fill,stroke=OL,lw=2){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.lineWidth=lw;g.strokeStyle=stroke;g.stroke();}}
function ell(g,x,y,rx,ry,fill,stroke=OL,lw=2,rot=0){g.beginPath();g.ellipse(x,y,rx,ry,rot,0,Math.PI*2);g.fillStyle=fill;g.fill();if(stroke){g.lineWidth=lw;g.strokeStyle=stroke;g.stroke();}}
function rrect(g,x,y,w,h,r,fill,stroke=OL,lw=2){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();if(stroke){g.lineWidth=lw;g.strokeStyle=stroke;g.stroke();}}

/* ---------- outfits (per job) ---------- */
export const OUTFITS={
  novice:{top:'#f2e6cc',bot:'#7a5a3a',acc:'#c8a070',boot:'#6a4a2a'},
  warrior:{top:'#5a7ab0',bot:'#3a4a6a',acc:'#c8ccd8',boot:'#4a3a2a',plate:1},
  mage:{top:'#6a3a9a',bot:'#6a3a9a',acc:'#e8c060',boot:'#3a2a4a',robe:1},
  ranger:{top:'#4a7a3a',bot:'#6a5a3a',acc:'#a07a4a',boot:'#4a3a22',hood:1},
  rogue:{top:'#3a3a44',bot:'#2a2a30',acc:'#c83a3a',boot:'#222228',scarf:1},
  cleric:{top:'#f4f0e6',bot:'#f4f0e6',acc:'#e0b44e',boot:'#8a7a5a',robe:1},
  trader:{top:'#e0a050',bot:'#6a4a2a',acc:'#f4e0b0',boot:'#5a3a20',apron:1},
};
export const HAIRS=['#3a2418','#e8c878','#c84a3a','#2a2a3a','#d8d8e8','#6a3aa8','#3a7ac8','#e88ab0'];
export const SKINS=['#f8dcc4','#f0c8a0','#d8a07a','#a87050'];

/* ---------- hero drawing ---------- */
function drawHero(g,c,dir,p){const s=dir===3?-1:1;g.save();if(dir===3){g.translate(FW,0);g.scale(-1,1);dir=1;}
  const O=OUTFITS[c.job]||OUTFITS.novice,skin=c.skin||SKINS[0],hair=c.hair||HAIRS[0];
  if(p.dead){g.translate(50,110);g.rotate(-Math.PI/2);g.scale(.82,.82);g.translate(-48,-72);}
  const by=(p.bob||0)+(p.sit?10:0);const hx=48+(p.lean||0),hy=44+by;
  // shadow
  if(!p.dead){g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(48,121,20,5,0,0,7);g.fill();}
  const longHair=c.style===2||c.style===3;
  // back hair (behind body)
  if(dir!==2&&longHair){if(c.style===2){ell(g,hx-24,hy+18,8,20,hair);ell(g,hx+24,hy+18,8,20,hair);}else ell(g,hx+(dir===1?14:0),hy+16,10,22,hair);}
  // legs
  const legY=92+by;if(p.sit){rrect(g,34,legY+4,28,10,5,O.bot);rrect(g,30,legY+10,14,8,4,O.boot);rrect(g,52,legY+10,14,8,4,O.boot);}
  else{const L=p.legL||0,R=p.legR||0;if(dir===1){rrect(g,40+R*.6,legY,10,20,4,shade(O.bot,.8));rrect(g,38+R*.6,legY+16,14,8,4,shade(O.boot,.8));rrect(g,46+L*.6,legY,10,20,4,O.bot);rrect(g,44+L*.6,legY+16,14,8,4,O.boot);}
    else{rrect(g,37,legY-L*.3,10,20+L*.2,4,O.bot);rrect(g,49,legY-R*.3,10,20+R*.2,4,O.bot);rrect(g,35,legY+15-L*.3,13,8,4,O.boot);rrect(g,48,legY+15-R*.3,13,8,4,O.boot);}}
  // far arm (side view)
  const armY=70+by;if(dir===1){g.save();g.translate(hx+6,armY);g.rotate(p.armB||0);rrect(g,-4,0,8,18,4,shade(O.top,.75));ell(g,0,19,4.5,4.5,shade(skin,.85));g.restore();}
  // torso / outfit
  const ty=64+by;if(O.robe){poly(g,[[hx-13,ty],[hx+13,ty],[hx+18,ty+46],[hx-18,ty+46]],O.top);g.strokeStyle=O.acc;g.lineWidth=3;g.beginPath();g.moveTo(hx-17,ty+42);g.lineTo(hx+17,ty+42);g.stroke();if(dir===0){g.beginPath();g.moveTo(hx,ty+4);g.lineTo(hx,ty+40);g.stroke();}}
  else{rrect(g,hx-14,ty,28,30,8,O.top);if(O.plate&&dir!==2){rrect(g,hx-10,ty+4,20,16,5,O.acc);}if(O.apron&&dir===0){rrect(g,hx-10,ty+10,20,22,4,O.acc);}
    rrect(g,hx-14,ty+22,28,7,3,shade(O.bot,.9));ell(g,hx+(dir===1?-6:0),ty+25,3,3,'#e0b44e',OL,1.5);}
  if(O.scarf){poly(g,[[hx-13,ty-2],[hx+13,ty-2],[hx+12,ty+7],[hx-12,ty+7]],O.acc);if(dir!==0)poly(g,[[hx+(dir===1?8:-4),ty+2],[hx+(dir===1?18:4),ty+2],[hx+(dir===1?22:6),ty+20],[hx+(dir===1?14:-2),ty+18]],O.acc);}
  if(O.hood&&dir!==0)ell(g,hx+(dir===1?8:0),ty+2,12,7,shade(O.top,.85));
  // shield (on the left arm; drawn behind the near arm in side view)
  const shield=c.shield;
  const drawShield=()=>{if(!shield)return;const sx=dir===0?hx+19:dir===2?hx-19:hx-10,sy=ty+12;ell(g,sx,sy,dir===1?7:10,13,'#8a6a4a');ell(g,sx,sy,dir===1?4:6,8,'#c8ccd8',OL,1.5);};
  if(dir===2)drawShield();
  // arms (front/back view) + weapon
  const wpn=c.weapon;const drawWeapon=(ax,ay,ang)=>{if(!wpn)return;g.save();g.translate(ax,ay);g.rotate(ang);
      if(wpn==='dagger'){poly(g,[[-2,0],[2,0],[1.5,-16],[0,-20],[-1.5,-16]],'#d8dce6');rrect(g,-5,-1,10,3,1,'#8a6a2a',OL,1);}
      else if(wpn==='sword'){poly(g,[[-2.5,0],[2.5,0],[2,-30],[0,-35],[-2,-30]],'#e0e4ee');rrect(g,-7,-2,14,4,1.5,'#c8a040',OL,1.2);rrect(g,-1.5,0,3,7,1,'#6a3a1a',OL,1);}
      else if(wpn==='axe'){rrect(g,-1.5,-30,3,36,1,'#7a5030',OL,1.2);poly(g,[[1,-30],[13,-34],[15,-22],[1,-20]],'#c8ccd8');}
      else if(wpn==='mace'){rrect(g,-1.5,-22,3,28,1,'#7a5030',OL,1.2);ell(g,0,-26,6,6,'#a8acb8');}
      else if(wpn==='rod'){rrect(g,-1.5,-34,3,42,1,'#8a5a30',OL,1.2);ell(g,0,-37,5,5,c.wglow||'#9ad8ff',OL,1.5);g.fillStyle='rgba(180,230,255,.35)';g.beginPath();g.arc(0,-37,9,0,7);g.fill();}
      else if(wpn==='bow'){g.lineWidth=3;g.strokeStyle='#7a4a24';g.beginPath();g.arc(-6,-8,18,-1.2,1.2);g.stroke();g.lineWidth=1;g.strokeStyle='#eee';g.beginPath();g.moveTo(-6+18*Math.cos(-1.2),-8+18*Math.sin(-1.2));g.lineTo(-6+18*Math.cos(1.2),-8+18*Math.sin(1.2));g.stroke();}
      g.restore();};
  if(dir===0||dir===2){const flip=dir===2?-1:1;
    // arm on viewer-left holds the weapon (front view)
    g.save();g.translate(hx-15*flip,armY);g.rotate((p.armW||0)*flip);rrect(g,-4,0,8,18,4,shade(O.top,.9));ell(g,0,19,4.5,4.5,skin);drawWeapon(0,19,(p.wAng||0)*flip-0.2*flip);g.restore();
    g.save();g.translate(hx+15*flip,armY);g.rotate(-(p.armB||0)*flip);rrect(g,-4,0,8,18,4,shade(O.top,.9));ell(g,0,19,4.5,4.5,skin);g.restore();}
  if(dir===0)drawShield();
  // head
  ell(g,hx,hy,22,20,skin);
  if(dir===0){// face
    const blink=p.blink;const ey=hy+3;for(const ex of [hx-8,hx+8]){if(blink||p.hurt){g.strokeStyle=OL;g.lineWidth=2;g.beginPath();g.moveTo(ex-4,ey+(p.hurt?-2:1));g.lineTo(ex+4,ey+(p.hurt?2:1));g.stroke();if(p.hurt){g.beginPath();g.moveTo(ex-4,ey+2);g.lineTo(ex+4,ey-2);g.stroke();}}
      else{ell(g,ex,ey,4.2,6,c.eye||'#3a5a9a',OL,1.6);ell(g,ex,ey+1.5,2.4,3.4,'#1a1a2a',null);ell(g,ex-1.4,ey-2,1.5,1.8,'#fff',null);}}
    g.fillStyle='rgba(240,120,120,.35)';g.beginPath();g.ellipse(hx-13,hy+10,4,2.4,0,0,7);g.ellipse(hx+13,hy+10,4,2.4,0,0,7);g.fill();
    g.strokeStyle=OL;g.lineWidth=1.6;g.beginPath();if(p.atk)g.arc(hx,hy+12,3,0,Math.PI);else g.arc(hx,hy+11,2.2,.2,Math.PI-.2);g.stroke();}
  else if(dir===1){ell(g,hx-12,hy+3,3.4,5.4,c.eye||'#3a5a9a',OL,1.5);ell(g,hx-13,hy+1,1.2,1.5,'#fff',null);g.strokeStyle=OL;g.lineWidth=1.5;g.beginPath();g.arc(hx-15,hy+11,1.8,.3,Math.PI-.3);g.stroke();ell(g,hx+4,hy+4,4,5,shade(skin,.9),OL,1.5);}
  // hair (front layer)
  g.save();if(dir===0){const pts=c.style===0?[[hx-23,hy-2],[hx-20,hy-18],[hx-10,hy-24],[hx,hy-22],[hx+12,hy-25],[hx+21,hy-16],[hx+23,hy-2],[hx+16,hy-10],[hx+8,hy-6],[hx,hy-12],[hx-8,hy-6],[hx-16,hy-11]]:
      [[hx-24,hy+8],[hx-22,hy-14],[hx-10,hy-23],[hx+10,hy-23],[hx+22,hy-14],[hx+24,hy+8],[hx+18,hy-2],[hx+14,hy-8],[hx+4,hy-6],[hx-4,hy-9],[hx-12,hy-5],[hx-18,hy-2]];poly(g,pts,hair);
    if(c.style===1){ell(g,hx-21,hy+6,5,11,hair);ell(g,hx+21,hy+6,5,11,hair);}if(c.style===2){ell(g,hx-26,hy+2,6,8,hair);ell(g,hx+26,hy+2,6,8,hair);}}
  else if(dir===2){ell(g,hx,hy-2,23,21,hair);if(c.style===2){ell(g,hx-24,hy+18,8,20,hair);ell(g,hx+24,hy+18,8,20,hair);}if(c.style===3)ell(g,hx,hy+20,8,18,hair);if(c.style===1)ell(g,hx,hy+10,22,12,hair);}
  else{poly(g,[[hx-22,hy],[hx-18,hy-18],[hx-4,hy-24],[hx+12,hy-20],[hx+22,hy-6],[hx+22,hy+14],[hx+14,hy+8],[hx+8,hy+2],[hx-4,hy-6],[hx-16,hy-2]],hair);if(c.style===3)ell(g,hx+22,hy+10,7,16,hair);if(c.style===2)ell(g,hx+18,hy+16,7,18,hair);}
  g.restore();
  // headgear
  drawHat(g,c.hat,hx,hy,dir);
  // near arm (side view) with weapon, shield behind it
  if(dir===1){drawShield();g.save();g.translate(hx-4,armY);g.rotate(p.armW||0);rrect(g,-4,0,8,18,4,O.top);ell(g,0,19,4.5,4.5,skin);drawWeapon(0,19,(p.wAng||0)-.3);g.restore();}
  // cast sparkle
  if(p.cast){g.fillStyle='rgba(255,240,160,.9)';for(let i=0;i<5;i++){const a=i*1.26+p.cast,r=26;g.beginPath();g.arc(hx+Math.cos(a)*r,hy+30+Math.sin(a)*10,2.2,0,7);g.fill();}}
  g.restore();}
export const HATS={ribbon:'Big Ribbon',bunny:'Lop-Ear Band',flower:'Meadow Crown',bandana:'Rover Bandana',wizard:'Starry Hat',helm:'Iron Sallet',jelly:'Jellop Cap',halo:'Gilded Halo',kingcrown:'Jellop King Crown',beret:'Painter Beret'};
function drawHat(g,h,hx,hy,dir){if(!h)return;const side=dir===1;
  switch(h){
    case 'ribbon':poly(g,[[hx,hy-20],[hx-16,hy-30],[hx-14,hy-14]],'#e84a5a');poly(g,[[hx,hy-20],[hx+16,hy-30],[hx+14,hy-14]],'#e84a5a');ell(g,hx,hy-20,4,4,'#c83a4a');break;
    case 'bunny':for(const k of side?[4]:[-8,8]){ell(g,hx+k,hy-34,5,15,'#f4f0f0');ell(g,hx+k,hy-33,2.4,10,'#f0b0c0',null);}rrect(g,hx-18,hy-21,36,4,2,'#e84a5a',OL,1.4);break;
    case 'flower':for(let i=0;i<7;i++){const x=hx-18+i*6;ell(g,x,hy-18+Math.abs(i-3),3.5,3.5,['#f86a8a','#f8e06a','#fff','#8ad8f8'][i%4],OL,1.2);}break;
    case 'bandana':poly(g,[[hx-23,hy-6],[hx-18,hy-20],[hx+18,hy-20],[hx+23,hy-6]],'#c83a3a');if(!side&&dir!==2){ell(g,hx-5,hy-14,1.6,1.6,'#fff',null);ell(g,hx+7,hy-12,1.6,1.6,'#fff',null);}else poly(g,[[hx+20,hy-10],[hx+30,hy-4],[hx+26,hy+2]],'#c83a3a');break;
    case 'wizard':poly(g,[[hx-28,hy-12],[hx+28,hy-12],[hx+20,hy-18],[hx-20,hy-18]],'#4a2a7a');poly(g,[[hx-17,hy-17],[hx+17,hy-17],[hx+8,hy-46],[hx-2,hy-56],[hx-6,hy-44]],'#5a3a9a');ell(g,hx+2,hy-30,2.5,2.5,'#f8e06a',null);break;
    case 'helm':g.beginPath();g.arc(hx,hy-2,24,Math.PI,0);g.closePath();g.fillStyle='#a8b0c0';g.fill();g.strokeStyle=OL;g.lineWidth=2;g.stroke();rrect(g,hx-25,hy-4,50,6,2,'#8a92a2');rrect(g,hx-2,hy-26,4,22,1,'#c8d0e0',OL,1.2);break;
    case 'jelly':g.beginPath();g.moveTo(hx-18,hy-14);g.quadraticCurveTo(hx-16,hy-40,hx,hy-42);g.quadraticCurveTo(hx+16,hy-40,hx+18,hy-14);g.closePath();g.fillStyle='#f88ab0';g.fill();g.strokeStyle=OL;g.lineWidth=2;g.stroke();
      if(dir!==2){ell(g,hx-6,hy-26,2,3,'#2a1a2a',null);ell(g,hx+6,hy-26,2,3,'#2a1a2a',null);}ell(g,hx-9,hy-34,3,2,'rgba(255,255,255,.7)',null);break;
    case 'halo':g.strokeStyle='#f8d86a';g.lineWidth=3.5;g.shadowColor='#fff4b0';g.shadowBlur=8;g.beginPath();g.ellipse(hx,hy-30,14,4,0,0,7);g.stroke();g.shadowBlur=0;break;
    case 'kingcrown':poly(g,[[hx-16,hy-16],[hx-18,hy-34],[hx-9,hy-24],[hx,hy-38],[hx+9,hy-24],[hx+18,hy-34],[hx+16,hy-16]],'#f8c84a');ell(g,hx,hy-21,3,3,'#e84a5a',OL,1.2);break;
    case 'beret':ell(g,hx+4,hy-18,22,8,'#c84a3a',OL,2,-.15);ell(g,hx+4,hy-26,2,3,'#c84a3a');break;
  }}

const POSES={
  idle:[{bob:0},{bob:1,blink:1}],
  walk:[{bob:-1,legL:5,legR:-5,armW:.35,armB:-.35},{bob:0,legL:0,legR:0},{bob:-1,legL:-5,legR:5,armW:-.35,armB:.35},{bob:0,legL:0,legR:0}],
  attack:[{bob:0,armW:-1.6,wAng:-.6,lean:1},{bob:1,armW:.9,wAng:1.2,lean:-2,atk:1},{bob:0,armW:.4,wAng:.6}],
  cast:[{armW:-2.3,armB:2.3,cast:0},{armW:-2.5,armB:2.5,cast:1,bob:-1}],
  hit:[{hurt:1,lean:3,bob:1}],sit:[{sit:1,armW:.3,armB:.3}],dead:[{dead:1,blink:1}]};
const sheetCache=new Map();
export function heroSheet(c){const key=JSON.stringify(c);if(sheetCache.has(key))return sheetCache.get(key);
  const cv=document.createElement('canvas');cv.width=FW*NCOL;cv.height=FH*4;const g=cv.getContext('2d');
  for(let dir=0;dir<4;dir++)for(const [anim,[col,n]] of Object.entries(ANIMS))for(let f=0;f<n;f++){g.save();g.translate((col+f)*FW,dir*FH);g.beginPath();g.rect(0,0,FW,FH);g.clip();drawHero(g,c,dir,POSES[anim][f]||{});g.restore();}
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;tex.generateMipmaps=true;
  const out={tex,cols:NCOL,rows:4};sheetCache.set(key,out);return out;}

/* ---------- monsters ---------- */
function blob(g,cx,base,w,h,col,squash,face=true,dir=0){const W=w*(1+squash*.18),H=h*(1-squash*.18);
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(cx,base,W*.9,5,0,0,7);g.fill();
  g.beginPath();g.moveTo(cx-W,base-2);g.bezierCurveTo(cx-W*1.05,base-H*.75,cx-W*.45,base-H*1.02,cx,base-H);g.bezierCurveTo(cx+W*.45,base-H*1.02,cx+W*1.05,base-H*.75,cx+W,base-2);g.quadraticCurveTo(cx,base+4,cx-W,base-2);g.closePath();
  const gr=g.createRadialGradient(cx-W*.3,base-H*.7,2,cx,base-H*.4,W*1.2);gr.addColorStop(0,shade(col,1.35));gr.addColorStop(1,col);g.fillStyle=gr;g.fill();g.lineWidth=2.4;g.strokeStyle=OL;g.stroke();
  ell(g,cx-W*.42,base-H*.72,W*.18,H*.1,'rgba(255,255,255,.75)',null,0,-.5);
  if(face&&dir!==2){const ex=dir===1?-W*.3:0,ey=base-H*.45;for(const k of dir===1?[-.25]:[-.28,.28]){ell(g,cx+ex+W*k,ey,3.2,4.4,'#1a1018',null);ell(g,cx+ex+W*k-1,ey-1.6,1.2,1.4,'#fff',null);}
    g.strokeStyle=OL;g.lineWidth=1.6;g.beginPath();g.arc(cx+ex,ey+7,3,.2,Math.PI-.2);g.stroke();g.fillStyle='rgba(255,120,150,.45)';g.beginPath();g.ellipse(cx+ex-W*.45,ey+5,3.5,2,0,0,7);g.ellipse(cx+ex+W*.45,ey+5,3.5,2,0,0,7);g.fill();}}
const MON_DRAW={
  jellop:(g,v,f,dir)=>{const sq=[0,.6,-.4,1,-.6][f%5];blob(g,48,118,26,40,v.col,sq,true,dir);},
  king:(g,v,f,dir)=>{const sq=[0,.5,-.3,.9,-.5][f%5];blob(g,48,120,40,62,v.col,sq,true,dir);poly(g,[[30,62+sq*6],[28,40+sq*6],[38,52+sq*6],[48,34+sq*6],[58,52+sq*6],[68,40+sq*6],[66,62+sq*6]],'#f8c84a');ell(g,48,56+sq*6,3.5,3.5,'#e84a5a',OL,1.2);},
  lopkin:(g,v,f,dir)=>{const hop=[0,-6,-10,-4,0][f%5];g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(48,118,20,5,0,0,7);g.fill();
    ell(g,48,104+hop,20,16,v.col);for(const k of dir===1?[6]:[-8,8]){ell(g,48+k,62+hop,5.5,18,v.col,OL,2,k*.02);ell(g,48+k,63+hop,2.6,12,'#f0b0c0',null);}ell(g,48+(dir===1?-6:0),84+hop,16,14,v.col);
    if(dir!==2){for(const k of dir===1?[-12]:[-7,7]){ell(g,48+k,82+hop,2.6,3.6,'#1a1018',null);ell(g,48+k-.8,81+hop,.9,1.1,'#fff',null);}ell(g,48+(dir===1?-15:0),88+hop,2,1.6,'#e86a8a',null);}else ell(g,48,112+hop,5,5,'#fff');
    ell(g,40,118+hop*.3,6,3.5,shade(v.col,.85));ell(g,56,118+hop*.3,6,3.5,shade(v.col,.85));},
  shroom:(g,v,f,dir)=>{const b=[0,-2,0,-2,0][f%5],sw=[0,.08,0,-.08,0][f%5];g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(48,118,18,5,0,0,7);g.fill();
    rrect(g,36,84+b,24,30,10,'#f4e8d0');if(dir!==2){for(const k of dir===1?[-5]:[-5,5]){ell(g,48+k,98+b,2.2,3,'#1a1018',null);}g.strokeStyle=OL;g.lineWidth=1.4;g.beginPath();g.arc(48+(dir===1?-4:0),104+b,2,.2,Math.PI-.2);g.stroke();}
    g.save();g.translate(48,86+b);g.rotate(sw);g.beginPath();g.moveTo(-30,0);g.quadraticCurveTo(-30,-34,0,-36);g.quadraticCurveTo(30,-34,30,0);g.quadraticCurveTo(0,6,-30,0);g.closePath();g.fillStyle=v.col;g.fill();g.lineWidth=2.4;g.strokeStyle=OL;g.stroke();
    for(const [x,y,r] of [[-14,-18,5],[8,-24,6],[18,-10,4],[-4,-8,3.5]])ell(g,x,y,r,r*.85,'#fff8f0',null);g.restore();
    ell(g,40,116,6,3,'#c8a878');ell(g,56,116,6,3,'#c8a878');},
  bee:(g,v,f,dir)=>{const hv=[0,-3,-5,-3,0][f%5];g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(48,120,14,4,0,0,7);g.fill();const y=74+hv;
    for(const k of [-1,1]){g.save();g.translate(48+k*6,y-14);g.rotate(k*(f%2?.6:.2));ell(g,k*10,-6,12,7,'rgba(220,240,255,.75)',OL,1.5);g.restore();}
    g.save();g.translate(48,y);if(dir===1)g.scale(-1,1);ell(g,0,0,22,16,'#f8c83a');for(const x of [-6,4])rrect(g,x,-15,5,30,2,'#2a1c18',null);ell(g,0,0,22,16,'rgba(0,0,0,0)');poly(g,[[20,2],[30,4],[20,8]],'#2a1c18');
    if(dir!==2){ell(g,-14,-3,3,4,'#1a1018',null);ell(g,-15,-4.5,1,1.2,'#fff',null);if(dir===0)ell(g,-4,-3,3,4,'#1a1018',null);}g.restore();
    g.strokeStyle=OL;g.lineWidth=1.5;g.beginPath();g.moveTo(40,y-14);g.quadraticCurveTo(36,y-26,32,y-26);g.moveTo(52,y-14);g.quadraticCurveTo(56,y-26,60,y-26);g.stroke();},
};
export const MON_ANIMS={idle:[0,2],walk:[0,5],attack:[5,2],hit:[7,1],dead:[8,1]};
export function monsterSheet(kind,variant){const key=kind+JSON.stringify(variant);if(sheetCache.has(key))return sheetCache.get(key);const cols=9;
  const cv=document.createElement('canvas');cv.width=FW*cols;cv.height=FH*4;const g=cv.getContext('2d');const draw=MON_DRAW[kind];
  for(let dir=0;dir<4;dir++)for(let col=0;col<cols;col++){g.save();g.translate(col*FW,dir*FH);g.beginPath();g.rect(0,0,FW,FH);g.clip();let d=dir;if(dir===3){g.translate(FW,0);g.scale(-1,1);d=1;}
    if(col===8){g.translate(48,118);g.scale(1.25,.45);g.translate(-48,-118);g.globalAlpha=.85;draw(g,variant,0,d);}
    else if(col>=5&&col<=6){g.translate(48,118);const k=col===5?1.12:.92;g.scale(k,2-k);g.translate(-48,-118);draw(g,variant,col===5?3:1,d);}
    else if(col===7){g.translate(46,118);g.rotate(-.18);g.translate(-46,-118);g.filter='brightness(1.6)';draw(g,variant,2,d);}
    else draw(g,variant,col,d);g.restore();}
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.generateMipmaps=true;const out={tex,cols,rows:4};sheetCache.set(key,out);return out;}

/* ---------- a Sprite showing one frame of a sheet ---------- */
export class SpriteActor{
  constructor(sheet,scale=1){this.sheet=sheet;this.tex=sheet.tex.clone();this.tex.needsUpdate=true;this.tex.repeat.set(1/sheet.cols,1/sheet.rows);
    this.mat=new THREE.SpriteMaterial({map:this.tex,transparent:true,alphaTest:.15,depthWrite:true});this.sprite=new THREE.Sprite(this.mat);this.sprite.center.set(.5,.06);
    this.scale=scale;this.sprite.scale.set(2.7*scale,3.6*scale,1);}
  setSheet(sheet){this.sheet=sheet;const t=sheet.tex.clone();t.needsUpdate=true;t.repeat.set(1/sheet.cols,1/sheet.rows);this.tex=t;this.mat.map=t;this.mat.needsUpdate=true;}
  frame(col,row){this.tex.offset.set(col/this.sheet.cols,1-(row+1)/this.sheet.rows);}
}
export function iconCanvas(drawFn,size=48){const cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d');drawFn(g,size);return cv.toDataURL();}
export function heroPortrait(c){const sh=heroSheet(c);const cv=document.createElement('canvas');cv.width=64;cv.height=64;const g=cv.getContext('2d');g.drawImage(sh.tex.image,0,0,FW,FH*.62,0,-4,64*FW/(FH*.62)*.62,64*1.05);return cv.toDataURL();}
