/* ETERNAL REALMS — procedural art: line icons, location vistas, monster sigils, title backdrop */
'use strict';
/* 24×24 stroke icons (drawn with currentColor) */
const ICONS={
  world:'M12 3l8 5v8l-8 5-8-5V8z M12 3v18 M4 8l16 8 M20 8L4 16',
  map:'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14',
  hero:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1-4 4-6 8-6s7 2 8 6',
  bag:'M6 8h12l1 12H5z M9 8V6a3 3 0 0 1 6 0v2 M9 12h6',
  quests:'M7 3h9l3 3v15H7z M16 3v3h3 M10 10h6 M10 14h6 M10 18h4 M4 6v12',
  chat:'M4 5h16v11H9l-5 4z M8 9h8 M8 12h5',
  social:'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M17 11a2.5 2.5 0 1 0 0-5 M3 20c.7-3.5 3-5 6-5s5.3 1.5 6 5 M16 15c2.5 0 4.3 1.3 5 4',
  ranks:'M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0z M7 6H4v1a3 3 0 0 0 3 3 M17 6h3v1a3 3 0 0 1-3 3',
  market:'M3 9l2-5h14l2 5 M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z M5 13v7h14v-7 M10 20v-4h4v4',
  codex:'M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z',
  menu:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1',
  more:'M5 12h.01 M12 12h.01 M19 12h.01',
  download:'M12 3v12 M7 10l5 5 5-5 M4 20h16',
  festival:'M12 3l1.8 3.7 4 .6-2.9 2.8.7 4L12 12.2 8.4 14.1l.7-4-2.9-2.8 4-.6z M5 21h14 M7 21v-4h10v4 M12 14v3',
  explore:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M15.5 8.5l-2 5-5 2 2-5z',
  hunt:'M5 19L17 7 M14 4l6 0 0 6 M4 15l5 5 M7 13l4 4',
  search:'M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M20 20l-4.5-4.5',
  gather:'M12 21V11 M12 11C12 6 8 4 4 4c0 4 3 7 8 7z M12 13c0-4 3-6 8-6 0 4-3 6-8 6z',
  mine:'M4 20L14 10 M9 5c4-2 8-1 11 2-4-1-7 0-9 2z M11 9l4 4',
  fish:'M3 12c3-4 8-5 12-3l4-3v12l-4-3c-4 2-9 1-12-3z M14 11h.01',
  camp:'M3 20h18 M12 4L4 20 M12 4l8 16 M12 13l-3 7 M12 13l3 7',
  dungeon:'M5 21V10a7 7 0 0 1 14 0v11 M3 21h18 M9 21v-6a3 3 0 0 1 6 0v6',
  inn:'M3 18V8 M3 14h18v4 M21 14v-3a3 3 0 0 0-3-3h-7v6 M7 11a1.5 1.5 0 1 0 0-.01',
  shop:'M5 8h14l-1 12H6z M9 8a3 3 0 0 1 6 0',
  smith:'M3 10h11l3-3h4v4l-3 1H3z M7 12v3 M5 15h6 M8 15v5 M5 20h6',
  guild:'M6 3v18 M6 4h12l-3 4 3 4H6',
  temple:'M3 21h18 M5 21V10 M19 21V10 M9 21V10 M15 21V10 M3 10l9-6 9 6z',
  library:'M5 4h3v16H5z M10 4h3v16h-3z M15 5l3-1 3 15-3 1z',
  arena:'M5 19L19 5 M15 5h4v4 M19 19L5 5 M9 5H5v4 M3 21l3-3 M21 21l-3-3',
  trainer:'M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z',
  board:'M4 5h16v12H4z M8 21l4-4 4 4 M8 9h8 M8 12h5',
  forge:'M4 20h16 M6 20l2-8h8l2 8 M12 12V8 M10 5c0 2 4 1 4 3',
  alchemy:'M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7 15h10',
  stable:'M5 21v-8l3-5 3-1 2-3 1 4 4 3-2 2-3-1-1 3v6 M9 13l-1 8',
  port:'M12 3v15 M5 12H3c1 5 5 8 9 8s8-3 9-8h-2 M8 7h8 M12 3l-3 4',
  talk:'M4 5h16v11h-6l-4 4v-4H4z',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  travel:'M4 20c4-1 5-6 8-8s6-1 8-6 M17 4l3 2-2 3',
  attack:'M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2',
  heavy:'M3 21l7-7 M14 4l6 6-5 5-6-6z M12 2l10 10',
  quick:'M13 2L4 14h7l-1 8 9-12h-7z',
  defend:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  dodge:'M4 12h10 M10 6l6 6-6 6 M18 5v14',
  parry:'M4 4l16 16 M20 4L4 20 M9 4H4v5 M15 20h5v-5',
  counter:'M20 7H8a4 4 0 0 0 0 8h9 M16 11l4 4-4 4',
  skills:'M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z',
  magic:'M5 19L15 9 M15 9l2-5 2 5-5 2z M5 7v4 M3 9h4 M17 15v4 M15 17h4',
  items:'M8 3h8v4l3 3v11H5V10l3-3z M8 7h8',
  summon:'M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-4 3-6 6-10z M12 21v-6 M9 15h6',
  bond:'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  party:'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M2 20c.5-3 3-5 6-5s5.5 2 6 5 M10 20c.5-3 3-5 6-5s5.5 2 6 5',
  row:'M7 4v16 M3 8l4-4 4 4 M17 20V4 M13 16l4 4 4-4',
  escape:'M14 4h5v16h-5 M3 12h11 M10 8l4 4-4 4',
  heart:'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  coin:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v10 M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  pin:'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  online:'M2 12a10 10 0 0 1 20 0 M6 12a6 6 0 0 1 12 0 M10 12a2 2 0 0 1 4 0',
  swords:'M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M9.5 17.5L21 6V3h-3L6.5 14.5 M11 19l-6-6',
  skull:'M12 3a8 8 0 0 0-5 14v4h10v-4a8 8 0 0 0-5-14z M9 12h.01 M15 12h.01 M10 21v-3 M14 21v-3',
  flame:'M12 21c-4 0-7-3-7-7 0-4 4-6 4-10 3 2 4 5 4 7 1-1 2-2 2-4 2 2 4 4 4 7 0 4-3 7-7 7z',
  claw:'M6 4c2 4 2 10-1 16 M11 3c2 5 2 11 0 17 M16 4c1 5 1 10-2 16',
  gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 1v4 M12 19v4 M1 12h4 M19 12h4 M4.2 4.2l2.8 2.8 M17 17l2.8 2.8 M4.2 19.8L7 17 M17 7l2.8-2.8',
  wing:'M2 18c4-2 6-6 6-12 2 4 5 6 9 6-2 1-3 3-3 5 2 0 5 0 8-1-4 4-11 6-20 2z',
  wisp:'M12 21c-3 0-5-2-5-5s3-4 3-7c2 1 2 3 2 4 1-2 3-3 5-3-1 2-1 3 0 5s0 6-5 6z',
  helm:'M5 14a7 7 0 0 1 14 0v6H5z M5 14h14 M12 7v13 M9 17h.01 M15 17h.01',
  special:'M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8z M5 21h14',
  lute:'M14 4l6 6 M17 7l-6.5 6.5 M10.5 13.5a4 4 0 1 1-5.66 5.66 4 4 0 0 1 5.66-5.66z M7.7 16.3h.01',
  event:'M12 2v4 M12 18v4 M4.9 4.9l2.8 2.8 M16.3 16.3l2.8 2.8 M2 12h4 M18 12h4 M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  castle:'M3 21V9l3 2V7l3 2V5l3 3 3-3v4l3-2v4l3-2v12z M10 21v-4a2 2 0 0 1 4 0v4'
};
function icon(name,cls=''){const d=ICONS[name];if(!d)return '';return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;}

/* ---------- monster sigils ---------- */
const CAT_GLYPH={beast:'claw',humanoid:'helm',undead:'skull',elemental:'flame',spirit:'wisp',construct:'gear',dragon:'wing'};
const ELEM_HUE={fire:'#e0663a',frost:'#7cc4e8',lightning:'#e8d24a',holy:'#f0dc8c',shadow:'#9a6be0',nature:'#6fbf5a',poison:'#9ccf3c',arcane:'#c58cf0'};
function sigil(a){if(!a.mon&&!a.isComp){const role=a.role||'dps';const g={tank:'defend',healer:'heart',summoner:'summon',support:'coin',dps:'attack'}[role]||'attack';return `<span class="sigil ally">${icon(g)}</span>`;}
  const col=ELEM_HUE[a.e]||'var(--ink2)';return `<span class="sigil ${a.boss?'boss':''}" style="--sc:${col}">${icon(CAT_GLYPH[a.cat]||'claw')}</span>`;}

/* ---------- location vistas (canvas, cached per location + time of day) ---------- */
const BIOME={hollyhearth:'snow',glimmerfrost:'snow',coalvault:'cave',brookhollow:'village',greenmarch:'fields',whisperwood:'forest',mine:'cave',ember:'lava',valeria:'city',watchtower:'ruin',ironford:'town',mirren:'lake',grimward:'fort',crossroads:'town',
  thornvale:'forest',moonfall:'glade',lothirien:'elfcity',crystallake:'lake',hollow:'glade',frostpeak:'snow',summit:'snow',khazgard:'mountaincity',deepforge:'lava',undervault:'cave',skyreach:'snow',
  duskhaven:'undercity',aethermoor:'ruin',saltmere:'port',cove:'coast',mire:'swamp',pawhaven:'coast',isles:'coast',citadel:'coast',bloodrock:'mesa',dunes:'desert',oasis:'desert',tomb:'desert',ashen:'lava',necropolis:'necro',spire:'spire'};
const VISTA_CACHE={};
function skyFor(t,biome){const h=T.hour(t);const under=['cave','undercity'].includes(biome);
  if(under)return {top:'#0b0a12',bot:'#1d1630',night:true,glow:'#7a4fd0'};
  if(h<5||h>=21)return {top:'#070a14',bot:'#182038',night:true};
  if(h<8)return {top:'#2a3150',bot:'#e7a26a',sun:[0.2,0.75]};
  if(h<17)return {top:'#4a7ab0',bot:'#bcd3df',sun:[0.5+(h-12)*0.04,0.25]};
  return {top:'#2b2747',bot:'#e0805a',sun:[0.8,0.72]};}
function drawVista(loc,t){
  if(LOCS[loc]&&LOCS[loc].ev&&ART.ok)return ART.base+'winter.webp';   // the festival region uses its painted scene
  const biome=BIOME[loc]||'fields';const sky=skyFor(t,biome);const key=loc+'|'+(sky.night?'n':T.hour(t)<8?'d':T.hour(t)<17?'m':'e');if(VISTA_CACHE[key])return VISTA_CACHE[key];
  const W=1200,H=320;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
  let seed=[...loc].reduce((s,c)=>s*31+c.charCodeAt(0)|0,7);const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
  const lg=g.createLinearGradient(0,0,0,H);lg.addColorStop(0,sky.top);lg.addColorStop(1,sky.bot);g.fillStyle=lg;g.fillRect(0,0,W,H);
  if(sky.night){for(let i=0;i<160;i++){g.globalAlpha=0.3+rnd()*0.7;g.fillStyle='#fff';const s=rnd()<0.1?2:1;g.fillRect(rnd()*W,rnd()*H*0.6,s,s);}g.globalAlpha=1;
    if(!sky.glow){g.fillStyle='#f3ecd4';g.beginPath();g.arc(W*0.78,H*0.2,18,0,7);g.fill();g.fillStyle=sky.top;g.beginPath();g.arc(W*0.78+8,H*0.2-4,16,0,7);g.fill();}}
  if(sky.sun){const [sx,sy]=sky.sun;const rg=g.createRadialGradient(W*sx,H*sy,4,W*sx,H*sy,140);rg.addColorStop(0,'rgba(255,240,200,.95)');rg.addColorStop(0.15,'rgba(255,220,160,.5)');rg.addColorStop(1,'rgba(255,200,140,0)');g.fillStyle=rg;g.fillRect(0,0,W,H);}
  if(biome==='spire'){g.strokeStyle='rgba(200,140,255,.7)';g.lineWidth=3;g.beginPath();g.moveTo(W*0.45,0);for(let y=0;y<H*0.5;y+=12)g.lineTo(W*0.45+(rnd()-0.5)*50,y);g.stroke();}
  const shade=(base,k)=>{const n=parseInt(base.slice(1),16);let r=n>>16,gg=n>>8&255,b=n&255;const f=sky.night?0.45:1;return `rgb(${Math.round(r*k*f)},${Math.round(gg*k*f)},${Math.round(b*k*f)})`;};
  const ridge=(y0,amp,col,rough=1,snow)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,H);let y=y0;const pts=[];for(let x=0;x<=W;x+=20){y+=(rnd()-0.5)*amp*rough;y=Math.max(y0-amp,Math.min(y0+amp*0.6,y));pts.push([x,y]);g.lineTo(x,y);}g.lineTo(W,H);g.fill();
    if(snow){g.fillStyle=sky.night?'#9aa4b8':'#eef2f6';for(const [x,yy] of pts)if(yy<y0-amp*0.35){g.beginPath();g.moveTo(x-14,yy+16);g.lineTo(x,yy);g.lineTo(x+14,yy+16);g.fill();}}};
  const pal={fields:['#5d7a4a','#3f5a35','#2c4026'],forest:['#3d5a44','#2a4232','#1a2b20'],glade:['#3c4f6a','#2c3e56','#1b2638'],village:['#56704a','#3c5236','#283a26'],city:['#6a6f7c','#4c5260','#323744'],
    town:['#6d6658','#4e4a40','#34312b'],elfcity:['#7a8aa6','#5a6a86','#3b4660'],mountaincity:['#6c6a72','#4a4850','#2f2e34'],lake:['#567a7c','#3b5a5e','#26393c'],snow:['#8892a4','#6a7488','#4a5466'],
    cave:['#2a2433','#1e1a26','#120f18'],undercity:['#2c2240','#211a32','#151022'],lava:['#4a2a24','#33201c','#1e1210'],ruin:['#6a6458','#4b463d','#312e28'],fort:['#5a5650','#403d38','#2a2825'],
    port:['#58708a','#3e546c','#2a3a4c'],coast:['#4c7088','#38566c','#25394a'],swamp:['#3c4a34','#2b3626','#1b2318'],mesa:['#8a4a32','#6a3624','#462418'],desert:['#c09a62','#9a7a4a','#6e5634'],
    necro:['#3a4038','#2a3029','#1a1e1a'],spire:['#3a3450','#2a2540','#1a1628']}[biome]||['#5d7a4a','#3f5a35','#2c4026'];
  const snowy=['snow','mountaincity'].includes(biome);
  ridge(H*0.42,60,shade(pal[0],1),1.2,snowy||biome==='glade'&&false);
  if(['desert','mesa'].includes(biome)){for(let i=0;i<3;i++){g.fillStyle=shade(pal[1],1-i*0.08);g.beginPath();g.moveTo(0,H);for(let x=0;x<=W;x+=10)g.lineTo(x,H*(0.6+i*0.1)+Math.sin(x/(120+i*40)+i)*18);g.lineTo(W,H);g.fill();}}
  else ridge(H*0.58,34,shade(pal[1],1),1);
  const fg=shade(pal[2],1);g.fillStyle=fg;
  const tree=(x,b,h,w)=>{g.beginPath();g.moveTo(x,b-h);g.lineTo(x-w,b);g.lineTo(x+w,b);g.fill();g.fillRect(x-2,b,4,8);};
  const tower=(x,b,w,h,roof)=>{g.fillRect(x,b-h,w,h);if(roof){g.beginPath();g.moveTo(x-3,b-h);g.lineTo(x+w/2,b-h-w*1.2);g.lineTo(x+w+3,b-h);g.fill();}else{for(let i=0;i<w;i+=8)g.fillRect(x+i,b-h-6,5,6);}
    if(sky.night){g.fillStyle='rgba(255,196,110,.85)';for(let y=b-h+10;y<b-8;y+=16)if(rnd()<0.5)g.fillRect(x+w/2-2,y,4,6);g.fillStyle=fg;}};
  const base=H*0.82;
  if(['forest','glade','village','fields','swamp'].includes(biome)){for(let i=0;i<(biome==='fields'?14:60);i++){const x=rnd()*W,h=30+rnd()*(biome==='forest'?90:50);tree(x,base+rnd()*30,h,h*0.28);}}
  if(biome==='swamp'){g.fillStyle=shade('#2e3e3a',1);g.fillRect(0,base+10,W,H);g.strokeStyle=fg;g.lineWidth=4;for(let i=0;i<10;i++){const x=rnd()*W;g.beginPath();g.moveTo(x,base+20);g.quadraticCurveTo(x+20,base-40,x-10,base-90);g.stroke();}}
  if(['village'].includes(biome)){for(let i=0;i<7;i++){const x=180+i*130+rnd()*40,w=50;g.fillStyle=fg;g.fillRect(x,base-30,w,34);g.beginPath();g.moveTo(x-6,base-30);g.lineTo(x+w/2,base-58);g.lineTo(x+w+6,base-30);g.fill();if(sky.night){g.fillStyle='rgba(255,196,110,.9)';g.fillRect(x+18,base-18,10,9);}}}
  if(['city','town','elfcity','port','mountaincity','undercity','mesa'].includes(biome)){const n=biome==='town'?9:16;g.fillRect(0,base-30,W,H);
    for(let i=0;i<n;i++){const x=rnd()*W,w=24+rnd()*36,h=60+rnd()*(biome==='elfcity'?200:biome==='city'?140:80);g.fillStyle=fg;tower(x,base-20,w,h,biome==='elfcity'||rnd()<0.4);}}
  if(['ruin','fort','necro','tomb'].includes(biome)||loc==='tomb'){g.fillStyle=fg;g.fillRect(0,base,W,H);for(let i=0;i<9;i++){const x=80+i*130+rnd()*30,h=40+rnd()*110;g.fillRect(x,base-h,22,h);if(rnd()<0.5){g.fillRect(x,base-h-8,60,10);}}
    if(loc==='tomb'){g.beginPath();g.moveTo(W*0.5-160,base);g.lineTo(W*0.5,base-170);g.lineTo(W*0.5+160,base);g.fill();}
    if(biome==='necro'){g.fillStyle='rgba(120,230,140,.18)';g.fillRect(0,base-20,W,40);}}
  if(['cave','undercity'].includes(biome)){g.fillStyle=fg;g.beginPath();g.moveTo(0,0);for(let x=0;x<=W;x+=30)g.lineTo(x,30+rnd()*70);g.lineTo(W,0);g.fill();g.fillRect(0,base,W,H);
    for(let i=0;i<14;i++){g.fillStyle=`rgba(${biome==='undercity'?'170,120,255':'120,220,200'},${0.4+rnd()*0.5})`;g.beginPath();g.arc(rnd()*W,base-rnd()*120,2+rnd()*3,0,7);g.fill();}}
  if(biome==='lava'){g.fillStyle=fg;g.fillRect(0,base,W,H);const lv=g.createLinearGradient(0,base-10,0,H);lv.addColorStop(0,'rgba(255,120,40,.0)');lv.addColorStop(0.3,'rgba(255,110,40,.7)');lv.addColorStop(1,'rgba(160,30,10,.9)');g.fillStyle=lv;g.fillRect(0,base+12,W,H);
    for(let i=0;i<40;i++){g.fillStyle=`rgba(255,${120+rnd()*100|0},60,${rnd()})`;g.fillRect(rnd()*W,rnd()*base,2,2);}}
  if(['lake','coast','port'].includes(biome)){const wy=base-4;const wg=g.createLinearGradient(0,wy,0,H);wg.addColorStop(0,shade('#3e6a86',1.1));wg.addColorStop(1,shade('#1e3446',1));g.fillStyle=wg;g.fillRect(0,wy,W,H);
    g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1;for(let i=0;i<40;i++){const x=rnd()*W,y=wy+8+rnd()*(H-wy);g.beginPath();g.moveTo(x,y);g.lineTo(x+20+rnd()*40,y);g.stroke();}
    if(biome==='port'){g.fillStyle=fg;for(let i=0;i<3;i++){const x=200+i*300;g.beginPath();g.moveTo(x,wy+20);g.lineTo(x+90,wy+20);g.lineTo(x+75,wy+36);g.lineTo(x+12,wy+36);g.fill();g.fillRect(x+44,wy-50,3,70);g.beginPath();g.moveTo(x+47,wy-48);g.lineTo(x+80,wy+6);g.lineTo(x+47,wy+6);g.fill();}}}
  if(biome==='snow'){g.fillStyle=sky.night?'#7a8494':'#e8edf2';g.fillRect(0,base,W,H);for(let i=0;i<20;i++){g.fillStyle=fg;tree(rnd()*W,base+rnd()*20,30+rnd()*40,12);}}
  if(biome==='spire'){g.fillStyle=fg;g.fillRect(0,base,W,H);for(let i=0;i<8;i++){const x=rnd()*W,y=40+rnd()*160,s=12+rnd()*40;g.beginPath();g.moveTo(x,y);g.lineTo(x+s,y+s*0.4);g.lineTo(x+s*0.4,y+s*1.6);g.lineTo(x-s*0.4,y+s*0.5);g.fill();}
    g.beginPath();g.moveTo(W*0.5-40,base);g.lineTo(W*0.5-10,60);g.lineTo(W*0.5+10,60);g.lineTo(W*0.5+40,base);g.fill();}
  if(biome==='fields'){g.fillStyle=fg;g.fillRect(0,base+10,W,H);}
  // vignette & fog
  const fogc=sky.night?'rgba(10,12,22,':'rgba(240,235,225,';const fog=g.createLinearGradient(0,H*0.6,0,H);fog.addColorStop(0,fogc+'0)');fog.addColorStop(1,fogc+'.25)');g.fillStyle=fog;g.fillRect(0,H*0.6,W,H);
  const url=cv.toDataURL('image/jpeg',0.82);VISTA_CACHE[key]=url;return url;}

/* ---------- title backdrop ---------- */
function drawTitleBg(cv){const W=cv.width=cv.clientWidth*(window.devicePixelRatio||1),H=cv.height=cv.clientHeight*(window.devicePixelRatio||1);const g=cv.getContext('2d');if(!W||!H)return;
  const lg=g.createLinearGradient(0,0,0,H);lg.addColorStop(0,'#05070d');lg.addColorStop(0.6,'#141a2c');lg.addColorStop(1,'#2a2236');g.fillStyle=lg;g.fillRect(0,0,W,H);
  let s=42;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};for(let i=0;i<260;i++){g.globalAlpha=r();g.fillStyle='#fff';g.fillRect(r()*W,r()*H*0.7,1.2,1.2);}g.globalAlpha=1;
  const ridge=(y0,amp,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,H);let y=y0;for(let x=0;x<=W;x+=W/60){y+=(r()-0.5)*amp;y=Math.max(y0-amp*1.5,Math.min(y0+amp,y));g.lineTo(x,y);}g.lineTo(W,H);g.fill();};
  ridge(H*0.62,H*0.06,'#1b2133');ridge(H*0.72,H*0.05,'#131828');ridge(H*0.84,H*0.03,'#0b0e18');
  g.fillStyle='#0b0e18';g.beginPath();g.moveTo(W*0.66,H*0.84);g.lineTo(W*0.675,H*0.5);g.lineTo(W*0.69,H*0.84);g.fill();g.fillStyle='rgba(255,196,110,.9)';g.fillRect(W*0.674,H*0.6,3,5);}

/* ---------- painted portraits & icons (sprite atlases in assets/, 4×4 cells each) ----------
   Missing files (e.g. the single-file artifact build) simply fall back to the line-icon sigils. */
const ART={ok:false,actions:true,quests:true,base:'assets/',gear:['sword','greatsword','axe','greataxe','mace','spear','halberd','dagger','bow','staff','orb','fist','shield','tome','head_cloth','head_leather','head_plate','chest_cloth','chest_leather','chest_plate','legs_cloth','legs_leather','legs_plate','hands_cloth','hands_leather','hands_plate','feet_cloth','feet_leather','feet_plate','ring','amulet','_chest'],
  npc:{stranger:89,merchant:90,innkeeper:91,smith:92,guard:93,priestess:94,sage:95}};
(function(){try{const im=new Image();im.onload=()=>{ART.ok=true;document.documentElement.classList.add('art');if(typeof UI!=='undefined'){UI.dirty=true;if(typeof render==='function')try{render();}catch(e){}}};im.src=ART.base+'mon01.webp';
  for(const n of ['class01','class02','class03','mon02'])setTimeout(()=>{new Image().src=ART.base+n+'.webp';},1500);}catch(e){}})();
function artCell(sheet,i,cls,extra){const c=i%4,r=Math.floor(i/4)%4;return `<span class="pt ${cls||''}" ${extra||''} style="background-image:url(${ART.base}${sheet}.webp);background-position:${(c*100/3).toFixed(2)}% ${(r*100/3).toFixed(2)}%" aria-hidden="true"></span>`;}
function artIdx(prefix,i,cls,extra){return artCell(prefix+String(Math.floor(i/16)+1).padStart(2,'0'),i%16,cls,extra);}
function nameHash(s){let h=0;s=String(s||'');for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
function ptMon(id,cls){if(!ART.ok)return '';if(MONSTERS[id]&&MONSTERS[id].art!=null){const a=MONSTERS[id].art;return Array.isArray(a)?artCell(a[0],a[1],cls):artCell('xmon',a,cls);}ART.mk=ART.mk||Object.keys(MONSTERS);const i=ART.mk.indexOf(id);return i<0?'':artIdx('mon',i,cls);}
function ptNpc(kind,cls){if(!ART.ok||ART.npc[kind]==null)return '';return artIdx('mon',ART.npc[kind],cls);}
function ptClass(cl,gender,name,cls){if(!ART.ok)return '';ART.ck=ART.ck||Object.keys(CLASSES);let i=ART.ck.indexOf(cl);if(i<0)return '';
  const f=gender==='female'?1:gender==='male'?0:nameHash(name)%2;if(i<16)return artCell(f?'class02':'class01',i,cls);if(i<20)return artCell('class03',(i-16)+(f?4:0),cls);return '';}
function ptItem(it,cls){if(!ART.ok||!it)return '';if(it.b&&it.u&&UNIQUES[it.u]&&UNIQUES[it.u].art!=null)return artCell('xgear',UNIQUES[it.u].art,(cls||'')+' r'+(it.r||0));
  if(it.b&&it.set==='yulewarden'&&typeof WINTER_SET_ART!=='undefined'){const sl=ITEM_BASES[it.b].sl;if(WINTER_SET_ART[sl]!=null)return artCell('xgear',WINTER_SET_ART[sl],(cls||'')+' r'+(it.r||0));}
  if(!it.b&&ITEMS[it.k||it]&&ITEMS[it.k||it].art!=null)return artCell('xitems',ITEMS[it.k||it].art,cls);
  if(it.b){const i=ART.gear.indexOf(it.b);return i<0?'':artIdx('gear',i,(cls||'')+' r'+(it.r||0));}ART.ik=ART.ik||Object.keys(ITEMS);const i=ART.ik.indexOf(it.k||it);return i<0?'':artIdx('items',i,cls);}
function ptActor(a,cls){if(!a)return '';if(a.id&&MONSTERS[a.id])return ptMon(a.id,cls);if(a.cls)return ptClass(a.cls,a.char&&a.char.gender,a.name,cls);return '';}

/* the Android app download is offered on the website only: not inside the app itself, not on iPhones, and only if the file is really there */
function apkCheck(){const el=document.getElementById('apkbtn');if(!el)return;try{const ua=navigator.userAgent||'';if(window.Capacitor||/; wv\)/.test(ua)||/iPhone|iPad|iPod/.test(ua)||location.protocol==='file:')return;
  if(ART.apk===true){el.hidden=false;return;}if(ART.apk===false)return;fetch('eternal-realms.apk',{method:'HEAD'}).then(r=>{const t=r.headers.get('content-type')||'';ART.apk=r.ok&&!/text\/html/.test(t);const e2=document.getElementById('apkbtn');if(ART.apk&&e2){e2.hidden=false;const kb=+r.headers.get('content-length');if(kb>0){const sm=e2.querySelector('small');if(sm)sm.textContent=`Download the game for your phone (APK, ${(kb/1048576).toFixed(1)} MB)`;}}}).catch(()=>{ART.apk=false;});}catch(e){}}
/* painted scenery for each place (assets/v/<place>.webp); the drawn vista remains the fallback */
function vistaStyle(loc,t){const L=LOCS[loc];if(L&&L.rg&&ART.ok&&typeof valeVista==='function')return valeVista(loc);
  if(ART.ok&&L&&!L.rg)return `background-image:url(${ART.base}v/${loc}.webp)`;return `background-image:url(${drawVista(loc,t)})`;}
function vistaCls(t){return ART.ok&&T.isNight(t)?'night':T.hour(t)>=17&&T.hour(t)<20&&ART.ok?'dusk':'';}
/* town services, skills and townsfolk */
const SVC_ART={inn:0,shop:1,smith:2,market:3,guild:4,temple:5,library:6,arena:7,trainer:8,board:9,forge:10,alchemy:11,stable:12,port:13,special:14,festival:15};
function ptSvc(s,cls){return ART.ok&&SVC_ART[s]!=null?artCell('svc',SVC_ART[s],cls||'svic'):'';}
const SKILL_EL={fire:4,frost:5,lightning:6,holy:7,shadow:8,nature:9,poison:10,arcane:11};
function skillArtIdx(id){const s=SKILLS[id];if(!s)return 0;if(s.k==='heal')return 12;if(s.k==='buff')return s.st&&STATUS[s.st[0]]&&STATUS[s.st[0]].bad?14:13;if(s.k==='debuff')return 14;if(s.k==='summon'||s.undead||s.turret)return 15;
  if(s.k==='mag')return SKILL_EL[s.e]!=null?SKILL_EL[s.e]:11;if(s.e&&SKILL_EL[s.e]!=null&&s.k!=='phys')return SKILL_EL[s.e];if((s.hits||1)>1)return 2;if(['bow','crossbow'].includes(s.m)||/shot|arrow|volley/i.test(s.n))return 3;if((s.p||1)>=2)return 1;return 0;}
function ptSkill(id,cls){return ART.ok?artCell('skills',skillArtIdx(id),cls||'skic'):'';}
const FOLK_ART={'Old Marta':['folk1',0],'Pip Tallowbranch':['folk1',1],'Elder Wynn':['folk1',2],'Brother Aldous':['folk1',3],'Captain Roderic':['folk1',4],'Madame Ysolde':['folk1',5],'Sister Celine':['folk1',6],'Arena-master Kael':['folk1',7],
  'Forgemaster Hilde':['folk1',8],'Rusk the Draconian':['folk1',9],'Veyra Moonsteel':['folk1',10],'One-Eyed Jory':['folk1',11],'Courier Tamsin':['folk1',12],'Warden Faelan':['folk1',13],'Thornmother Ilsa':['folk1',14],'Archivist Seraphine':['folk1',15],
  'Conclave Magister Orrin':['folk2',0],'Master Bren Ironhand':['folk2',1],'Loremaster Durgi':['folk2',2],'Brewer Olga':['folk2',3],'Runesmith Kazra':['folk2',4],'Oracle-Speaker Nyx':['folk2',5],'Silkmonger Vael':['folk2',6],'Factor Bellamy':['folk2',7],
  'Harbormaster Quill':['folk2',8],'Auctioneer Prisca':['folk2',9],'Shaman Grenna':['folk2',10],'Pitmaster Ug':['folk2',11],'Elder Grey-Muzzle':['folk2',12],'Tidecaller Saba':['folk2',13],'Captain Silk-Eye':['folk2',14],'Grandmaster Ten-Winds':['folk2',15],
  'Caravan-master Zeb':['mon06',10],'The Frostmother':['xmon',10],'Bram Tallow':['xmon',11]};
function ptFolk(n,cls){const a=FOLK_ART[n];return ART.ok&&a?artCell(a[0],a[1],cls||'folkic'):'';}
const STATUS_ART={poison:0,burn:1,bleed:2,stun:3,freeze:4,slow:5,root:5,weaken:6,sunder:6,marked:7,blind:8,might:9,frenzy:9,bear:9,runeblade:9,focus:9,fortify:10,taunt:10,shield:11,ward:11,defend:11,blessed:12,resolve:12,regen:13,lifesteal:2,haste:14,dodge:14,stealth:15};
function ptStatus(k){return ART.ok&&STATUS_ART[k]!=null?artCell('status',STATUS_ART[k],'stic'):'';}
function achArtIdx(id,A){const n=(A&&A.n)||'';const t=[[/First Blood/,0],[/Hunter|Exterminator/,1],[/Champion|Renowned|Legend/,2],[/Seasoned|Veteran|Eternal/,3],[/Delver|Dungeon/,4],[/Slayer|Raid/,5],[/Explorer|Cartographer|Off the Map/,6],[/Well-Off|Tycoon/,7],[/Artisan/,8],[/Duelist|Gladiator/,9],[/Beast|Evolution/,10],[/Guild|Friendly|Neighbor|Sworn/,11],[/Scholar|Higher Path/,12],[/Sun-Engine/,13],[/Defender|Marks|Outfit/,14],[/Long Night|Coal|Collector/,15]];for(const [r,i] of t)if(r.test(n))return i;return 2;}
function ptAch(id,A){return ART.ok?artCell('ach',achArtIdx(id,A),'achic'):'';}
const ACTION_ART={explore:0,hunt:1,search:2,gather:3,mine:4,wood:5,fish:6,camp:7,dungeon:8,travel:9,rest:10,talk:11,portal:12,pray:13,duel:14,delve:15};
function ptAction(ic){return ART.ok&&ART.actions&&ACTION_ART[ic]!=null?artCell('actions',ACTION_ART[ic],'svic'):'';}
const QUEST_ART={kill:0,gather:1,bounty:2,explore:3,deliver:4,dungeon:5,escort:6,request:7,story:8,faction:9,trophy:10,wealth:11,pvp:12,craft:13,level:14,guild:15};
function ptQuest(k,cls){return ART.ok&&ART.quests&&QUEST_ART[k]!=null?artCell('quests',QUEST_ART[k],cls||'qic'):'';}
