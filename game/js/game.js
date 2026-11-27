// Eternal Realms Online — 2.5D prototype. Click/tap to move and attack, base & job levels, jobs, stats, skills,
// items, cards, refining, NPC shops/storage/warps, a timed field boss, emotes and local saves.
import * as THREE from 'three';
import {createRenderer,loadWorldParts,buildMap,collide,sceneLights,MAPS,MOBILE} from './world.js';
import {heroSheet,monsterSheet,SpriteActor,ANIMS,MON_ANIMS,HAIRS,heroPortrait,HATS} from './sprites.js';
import * as D from './data.js';
const {STATS,JOBS,SKILLS,ITEMS,MONSTERS}=D;
const $=s=>document.querySelector(s);const rand=(a,b)=>a+Math.random()*(b-a);const ri=(a,b)=>Math.floor(rand(a,b+1));const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n).toLocaleString('en-US');const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(MOBILE)document.body.classList.add('touch');
const {renderer,camera}=createRenderer($('#view'));const scene=new THREE.Scene();const SHADOWS=renderer.shadowMap.enabled;const sun=sceneLights(scene,SHADOWS);
const G={state:'loading',map:null,world:null,mobs:[],npcs:[],drops:[],fx:[],cam:{yaw:-.6,dist:MOBILE?30:26,pitch:.95},t:0,target:null,move:null,act:null,cast:null,buffs:{},atkT:0,regenT:0,spT:0,
  boss:{alive:false,next:0},hot:[],autoLoot:true,windows:new Set()};
window.__G=G;let P=null;   // the player's saved character
let me=null;                 // the player's sprite actor

/* ---------------- music ---------------- */
const MUS={winter:'assets/music/mus_winter.mp3',town:'assets/music/mus_town.mp3',wild:'assets/music/mus_wild.mp3',boss:'assets/music/mus_boss.mp3',title:'assets/music/mus_title.mp3'};const tracks={};let curTrack=null,musicOn=true,sfxOn=true;
function music(k){curTrack=k;if(!musicOn)return;for(const n in tracks)if(n!==k)tracks[n].pause();let a=tracks[k];if(!a){a=tracks[k]=new Audio(MUS[k]);a.loop=true;a.volume=.45;}a.play().catch(()=>{});}
let AC=null;function unlock(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state!=='running')AC.resume();}catch(e){}if(musicOn&&curTrack&&tracks[curTrack]&&tracks[curTrack].paused)tracks[curTrack].play().catch(()=>{});}
for(const ev of ['pointerup','touchend','keydown'])addEventListener(ev,unlock,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const n in tracks)tracks[n].pause();else unlock();});
function sfx(k){if(!sfxOn||!AC||AC.state!=='running')return;const t=AC.currentTime,o=AC.destination;
  const tone=(type,f0,f1,dur,v=.15,d=0)=>{const os=AC.createOscillator(),g=AC.createGain();os.type=type;os.frequency.setValueAtTime(f0,t+d);os.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+d+dur);g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(v,t+d+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d+dur);os.connect(g).connect(o);os.start(t+d);os.stop(t+d+dur+.05);};
  const noise=(f,dur,v=.2,d=0)=>{const b=AC.createBuffer(1,AC.sampleRate*dur|0,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const s=AC.createBufferSource();s.buffer=b;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;const g=AC.createGain();g.gain.setValueAtTime(v,t+d);g.gain.exponentialRampToValueAtTime(.0001,t+d+dur);s.connect(bp).connect(g).connect(o);s.start(t+d);};
  ({hit:()=>{noise(400,.12,.3);tone('sine',160,60,.12,.25);},crit:()=>{noise(500,.18,.35);tone('square',300,80,.2,.12);},miss:()=>noise(1800,.12,.12),swing:()=>noise(900,.15,.15),
    fire:()=>{noise(500,.4,.25);tone('sawtooth',140,70,.35,.06);},frost:()=>{noise(2600,.3,.15);tone('sine',1800,2400,.2,.05);},thunder:()=>{noise(300,.5,.4);tone('square',80,40,.3,.1);},
    heal:()=>[523,659,784,1046].forEach((f,i)=>tone('sine',f,f,.4,.07,i*.06)),level:()=>[392,523,659,784,1046,1318].forEach((f,i)=>tone('triangle',f,f,.6,.1,i*.08)),
    loot:()=>[880,1320].forEach((f,i)=>tone('sine',f,f,.15,.06,i*.05)),coin:()=>[1320,1760].forEach((f,i)=>tone('triangle',f,f,.12,.07,i*.05)),buy:()=>tone('sine',660,990,.15,.08),
    squish:()=>{tone('sine',300,120,.18,.15);},die:()=>{tone('sine',500,90,.5,.12);},click:()=>tone('sine',800,600,.05,.05),bad:()=>tone('square',200,140,.2,.06),
    refineOk:()=>[660,880,1320].forEach((f,i)=>tone('triangle',f,f,.3,.1,i*.08)),refineFail:()=>{noise(300,.6,.35);tone('sawtooth',220,55,.6,.12);},boss:()=>{noise(150,1,.4);tone('sawtooth',90,45,1,.15);}})[k]?.();}

/* ---------------- character data ---------------- */
function newChar(name,look){return {name,look,job:'novice',baseLv:1,baseExp:0,jobLv:1,jobExp:0,stats:{str:5,agi:5,vit:5,int:5,dex:5,luk:5},statPts:24,skillPts:0,skills:{},zeny:500,
  inv:[mkItem('knife'),mkItem('cotton_shirt'),mkItem('red_tonic',8),mkItem('waywing',2),mkItem('homing_feather',1)],equip:{},storage:[],save:'town',map:'town',x:0,z:6,hp:1,sp:1,
  hot:[{t:'item',id:'red_tonic'},null,null,null,null,null,null,null],kills:{},created:Date.now()};}
let uidN=Date.now()%100000;function mkItem(id,n=1){const d=ITEMS[id];if(d.t==='equip')return {id,uid:++uidN,refine:0,cards:[]};return {id,n};}
function save(){if(!P)return;try{P.map=G.map;P.x=me.pos.x;P.z=me.pos.z;localStorage.setItem('ero_save',JSON.stringify(P));}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem('ero_save')||'null');return s&&s.name?s:null;}catch(e){return null;}}
setInterval(()=>{if(G.state==='play')save();},15000);

/* ---------------- derived stats ---------------- */
const WPN_DELAY={dagger:.85,sword:1.0,axe:1.25,mace:1.1,rod:1.15,bow:1.1,fist:.8};
function equipBonus(){const b={str:0,agi:0,vit:0,int:0,dex:0,luk:0,atk:0,matk:0,def:0,mdef:0,hp:0,hpPct:0,crit:0,flee:0,aspd:0};
  for(const sl in P.equip){const it=P.equip[sl];if(!it)continue;const d=ITEMS[it.id];for(const k of ['str','agi','vit','int','dex','luk','def','mdef'])b[k]+=d[k]||0;if(d.allStats)for(const s of STATS)b[s]+=d.allStats;
    if(d.slot!=='weapon')b.def+=(it.refine||0)*(d.slot==='armor'?1.5:1);
    for(const c of it.cards||[]){const cd=ITEMS[c];for(const k of ['str','agi','vit','int','dex','luk','atk','hp','hpPct','crit','flee','aspd','def','mdef'])b[k]+=cd[k]||0;if(cd.allStats)for(const s of STATS)b[s]+=cd.allStats;}}
  const bl=G.buffs.blessing,sw=G.buffs.swift;if(bl){b.str+=bl.lv;b.int+=bl.lv;b.dex+=bl.lv;}if(sw)b.agi+=sw.lv;b.dex+=sk('hawk_eye');return b;}
function sk(id){return (P&&P.skills[id])||0;}
function derive(){const b=equipBonus(),J=JOBS[P.job],s={};for(const k of STATS)s[k]=P.stats[k]+b[k];const lv=P.baseLv;const w=P.equip.weapon?ITEMS[P.equip.weapon.id]:null;const wt=w?w.wt:'fist';
  const dex=wt==='bow';const main=dex?s.dex:s.str;const statAtk=main+Math.floor(main/10)**2+Math.floor((dex?s.str:s.dex)/5)+Math.floor(s.luk/5);
  const wAtk=w?w.atk+(P.equip.weapon.refine||0)*(w.atk>40?5:3):0;let mastery=(wt==='sword'||wt==='dagger')?sk('sword_mastery')*4:0;
  const matkMin=s.int+Math.floor(s.int/7)**2,matkMax=s.int+Math.floor(s.int/5)**2;const mBoost=w&&w.matk?1+w.matk/100:1;
  const mhp=Math.round((40+lv*lv*.5*J.hp+lv*11*J.hp+sk('toughness')*20+b.hp)*(1+s.vit/100)*(1+b.hpPct/100));const msp=Math.round((12+lv*2.2*J.sp)*(1+s.int/100));
  const delay=Math.max(.32,(WPN_DELAY[wt]||1)*(1-Math.min(.6,(s.agi*4+s.dex)/650))*(1-b.aspd/100));
  const weight=2000+s.str*30+sk('pack_mule')*300;
  return {s,wt,atk:statAtk+wAtk+b.atk+mastery,statAtk,wAtk:wAtk+b.atk+mastery,matkMin:Math.round(matkMin*mBoost),matkMax:Math.round(matkMax*mBoost),def:b.def+sk('iron_skin')*3,softDef:Math.floor(s.vit/2),mdef:b.mdef+Math.floor(s.int/2),
    hit:lv+s.dex,flee:lv+s.agi+b.flee+sk('evasion')*3+(G.buffs.quick?10+G.buffs.quick.lv*2:0),crit:1+s.luk*.3+b.crit,pdodge:s.luk/10,delay,aspd:Math.round(200-delay*50),mhp,msp,maxW:weight,
    range:wt==='bow'?7+sk('hawk_eye')*.5:1.7,speed:(G.buffs.swift?1.25:1)*(G.buffs.quick?1.2:1)*4.2,castMul:Math.max(.2,1-s.dex/150)};}
let ST=null;const refresh=()=>{ST=derive();P.hp=Math.min(P.hp,ST.mhp);P.sp=Math.min(P.sp,ST.msp);renderHud();if(me)updateLook();};
function weight(){let w=0;for(const it of P.inv)w+=(ITEMS[it.id].w||0)*(it.n||1);for(const sl in P.equip)if(P.equip[sl])w+=ITEMS[P.equip[sl].id].w||0;return w;}
function lookCfg(){const w=P.equip.weapon?ITEMS[P.equip.weapon.id].wt:null;const head=P.equip.head?ITEMS[P.equip.head.id].hat:null;
  return {job:P.job,style:P.look.style,hair:P.look.hair,eye:P.look.eye,hat:head,weapon:w,shield:!!P.equip.shield};}
function updateLook(){const key=JSON.stringify(lookCfg());if(me._look===key)return;me._look=key;me.actor.setSheet(heroSheet(lookCfg()));$('#bport').src=heroPortrait(lookCfg());}

/* ---------------- actors on the map ---------------- */
class Unit{constructor(sheet,scale,anims){this.actor=new SpriteActor(sheet,scale);this.pos=new THREE.Vector3();this.actor.sprite.position.copy(this.pos);scene.add(this.actor.sprite);this.face=0;this.anim='idle';this.animT=0;this.lock=0;this.anims=anims;this.dead=false;}
  setAnim(a,lock=0){if(this.anim!==a||lock){this.anim=a;this.animT=0;}if(lock)this.lock=lock;}
  update(dt){this.animT+=dt;if(this.lock>0){this.lock-=dt;if(this.lock<=0&&!this.dead){this.lock=0;this.anim='idle';}}
    const [col,n]=this.anims[this.anim]||this.anims.idle;const speed=this.anim==='walk'?8:this.anim==='idle'?2:this.anim==='attack'?(3/Math.max(.25,this.atkDur||.5)):5;
    let f=Math.floor(this.animT*speed);f=this.anim==='attack'||this.anim==='hit'||this.anim==='dead'||this.anim==='sit'||this.anim==='cast'?Math.min(n-1,f):f%n;
    // pick the facing row relative to the camera: 0 front, 1 left, 2 back, 3 right
    const rel=Math.atan2(Math.sin(this.face-G.cam.yaw),Math.cos(this.face-G.cam.yaw));const a=Math.abs(rel);const row=a<Math.PI/4?0:a>Math.PI*3/4?2:rel>0?3:1;
    this.actor.frame(col+f,row);this.actor.sprite.position.copy(this.pos);if(this.fly)this.actor.sprite.position.y+=.6+Math.sin(G.t*4)*.15;}
  dispose(){scene.remove(this.actor.sprite);if(this.label)this.label.remove();if(this.bubble)this.bubble.remove();}}
function spawnMob(k,x,z,home){const d=MONSTERS[k];const u=new Unit(monsterSheet(d.draw,d.v),d.scale,MON_ANIMS);u.kind=k;u.d=d;u.hp=d.hp;u.mhp=d.hp;u.pos.set(x,0,z);u.home=new THREE.Vector3(...(home||[x,0,z]));u.ai='idle';u.aiT=rand(1,4);u.atkT=0;u.fly=!!d.fly;u.face=rand(0,6.28);
  u.hostile=!!d.aggro;u.looted=[];u.boss=!!d.boss;G.mobs.push(u);return u;}

/* ---------------- maps ---------------- */
async function enterMap(id,x,z){G.state='loading';closeAllWindows();for(const m of G.mobs)m.dispose();for(const n of G.npcs)n.dispose();for(const d of G.drops)scene.remove(d.obj);G.mobs=[];G.npcs=[];G.drops=[];setTarget(null);G.move=null;G.act=null;G.cast=null;
  if(G.world){scene.remove(G.world.root);for(const p of G.world.portals)if(p.el)p.el.remove();}const parts=await loadWorldParts();G.world=buildMap(scene,id,parts,SHADOWS);G.map=id;P.map=id;const M=MAPS[id];
  const festive=D.winterOn();const npcs=[...(M.npcs||[])];if(id==='town'&&festive)npcs.push({id:'holly',n:'Holly the Merrymaker',x:6,z:4,look:{job:'cleric',style:2,hair:'#e8c878',hat:'holly'}});
  if(festive&&(id==='town'||M.winter))addSnow();else removeSnow();if(id==='town'&&festive)festivalTree(G.world.root,-7,-5,parts);
  for(const n of npcs){const u=new Unit(heroSheet(n.look),1,ANIMS);u.pos.set(n.x,0,n.z);u.face=Math.atan2(-n.x,-n.z);u.npc=n;G.npcs.push(u);G.world.colliders.push({x:n.x,z:n.z,r:.7});}
  for(const g of M.mobs||[])for(let i=0;i<g.n;i++){const a=rand(0,6.28),r=Math.sqrt(Math.random())*g.r;spawnMob(g.k,g.x+Math.cos(a)*r,g.z+Math.sin(a)*r,[g.x,0,g.z]).range=g.r;}
  if(M.boss){G.boss.alive=false;G.boss.next=G.t+M.boss.first;}
  me.pos.set(x??M.spawn[0],0,z??M.spawn[1]);me.dead=false;$('#mapname').textContent=M.n;music(festive&&id==='town'?'winter':M.music);chat(`You arrive at ${M.n}.`,'sys');G.state='play';save();}

/* ---------------- targeting / input ---------------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitP=new THREE.Vector3(),pv=new THREE.Vector3();
function groundAt(sx,sy){ndc.set(sx/innerWidth*2-1,-(sy/innerHeight)*2+1);ray.setFromCamera(ndc,camera);return ray.ray.intersectPlane(groundPlane,hitP)?hitP.clone():null;}
function screenOf(u,yOff=1.2){pv.set(u.pos.x,u.pos.y+yOff*(u.actor?u.actor.scale:1),u.pos.z).project(camera);return [(pv.x+1)/2*innerWidth,(1-pv.y)/2*innerHeight,pv.z];}
function pickUnit(sx,sy){let best=null,bd=MOBILE?52:40;const test=(u,kind)=>{if(u.dead)return;for(const yo of [.4,1.2,2]){const [x,y,z]=screenOf(u,yo);if(z>1)continue;const d=Math.hypot(x-sx,y-sy);if(d<bd){bd=d;best={u,kind};}}};
  for(const m of G.mobs)test(m,'mob');for(const n of G.npcs)test(n,'npc');for(const d of G.drops){const [x,y,z]=screenOf({pos:d.pos},.3);const dd=Math.hypot(x-sx,y-sy);if(z<1&&dd<bd){bd=dd;best={u:d,kind:'drop'};}}
  for(const p of G.world.portals){const [x,y,z]=screenOf({pos:p.obj.position},.5);const dd=Math.hypot(x-sx,y-sy);if(z<1&&dd<bd*1.4){bd=dd;best={u:p,kind:'portal'};}}return best;}
function setTarget(m){G.target=m;$('#tframe').hidden=!m;if(!G.tring){G.tring=new THREE.Mesh(new THREE.RingGeometry(.7,.9,32),new THREE.MeshBasicMaterial({color:0xff5a4a,transparent:true,opacity:.9,depthWrite:false}));G.tring.rotation.x=-Math.PI/2;scene.add(G.tring);}G.tring.visible=!!m;}
function onTap(sx,sy){if(G.state!=='play'||me.dead)return;unlock();if(G.sitting)toggleSit(false);
  if(G.pendingSkill){const pk=pickUnit(sx,sy);const id=G.pendingSkill;G.pendingSkill=null;$('#hint').hidden=true;if(pk&&pk.kind==='mob'){setTarget(pk.u);useSkill(id,pk.u);}return;}
  if(G.cast){cancelCast('Casting interrupted');}
  const pk=pickUnit(sx,sy);
  if(pk&&pk.kind==='mob'){setTarget(pk.u);G.act={t:'attack',u:pk.u};G.move=null;return;}
  if(pk&&pk.kind==='npc'){G.act={t:'talk',u:pk.u};G.move=null;return;}
  if(pk&&pk.kind==='drop'){G.act={t:'pick',d:pk.u};G.move=null;return;}
  if(pk&&pk.kind==='portal'){G.act={t:'portal',p:pk.u};return;}
  const g=groundAt(sx,sy);if(g){G.move=g;G.act=null;markClick(g);}}
let clickMark=null;function markClick(p){if(!clickMark){clickMark=new THREE.Mesh(new THREE.RingGeometry(.25,.4,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false}));clickMark.rotation.x=-Math.PI/2;scene.add(clickMark);}clickMark.position.set(p.x,.05,p.z);clickMark.userData.t=.6;clickMark.visible=true;}
const view=$('#view');const ptrs=new Map();let pinch=0;
view.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:0,btn:e.button,t:performance.now()});view.setPointerCapture(e.pointerId);if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}});
view.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;p.moved+=Math.abs(dx)+Math.abs(dy);
  if(ptrs.size>=2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)G.cam.dist=clamp(G.cam.dist*pinch/d,14,46);pinch=d;G.cam.yaw-=dx*.004;return;}
  if(p.btn===2||(e.pointerType==='mouse'&&e.shiftKey)){G.cam.yaw-=dx*.008;}
  else if(p.moved>14&&e.pointerType!=='mouse'){/* one-finger drag on touch: hold to keep walking toward the finger */const g=groundAt(e.clientX,e.clientY);if(g&&G.state==='play'&&!G.cast){G.move=g;G.act=null;}}});
const endP=e=>{const p=ptrs.get(e.pointerId);if(!p)return;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=0;if(e.type==='pointerup'&&p.btn!==2&&p.moved<14)onTap(e.clientX,e.clientY);};
view.addEventListener('pointerup',endP);view.addEventListener('pointercancel',endP);view.addEventListener('contextmenu',e=>e.preventDefault());
view.addEventListener('wheel',e=>{G.cam.dist=clamp(G.cam.dist*(1+Math.sign(e.deltaY)*.08),14,46);e.preventDefault();},{passive:false});
addEventListener('keydown',e=>{if(G.state!=='play')return;if(e.target.tagName==='INPUT'){if(e.key==='Enter'){sendChat();}return;}
  const k=e.key.toLowerCase();if(k==='enter'){$('#chatin').focus();e.preventDefault();return;}
  if(/^[1-8]$/.test(k)){useHot(+k-1);return;}if(/^f[1-8]$/.test(k)){e.preventDefault();useHot(+k.slice(1)-1);return;}
  const wk={s:'stat',i:'inv',e:'equip',k:'skill',o:'opt'}[k];if(e.altKey&&wk){e.preventDefault();toggleWindow(wk);return;}
  if(k==='q')G.cam.yaw+=.3;if(k==='w'&&!e.ctrlKey)G.cam.yaw-=.3;if(k==='insert'||k==='x')toggleSit();if(k==='escape'){if(G.windows.size)closeAllWindows();else if(G.pendingSkill){G.pendingSkill=null;$('#hint').hidden=true;}else setTarget(null);}});

/* ---------------- combat ---------------- */
function dist(a,b){return Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z);}
function physDamage(m,mult=1,{el='neutral',critOk=true}={}){const st=ST,d=m.d;if(Math.random()*100>clamp(80+st.hit-d.flee,5,95))return {miss:1};
  const crit=critOk&&Math.random()*100<st.crit;let atk=st.statAtk+st.wAtk*rand(.85,1.05);atk*=mult;atk*=D.elemMod(el,d.el);
  if(!crit)atk=atk*100/(100+d.def*4)-d.lv*.3;else atk*=1.4;return {dmg:Math.max(1,Math.round(atk)),crit};}
function magicDamage(m,mult,el){const d=m.d;let v=rand(ST.matkMin,ST.matkMax)*mult*D.elemMod(el,d.el);v=v*100/(100+d.lv*2);return Math.max(1,Math.round(v));}
function hurtMob(m,dmg,{crit=false,miss=false,el}={}){if(m.dead)return;const [x,y]=screenOf(m,1.6);if(miss){floatTxt(m,'Miss','miss');sfx('miss');return;}
  m.hp-=dmg;floatTxt(m,fmt(dmg),crit?'crit':'');sfx(crit?'crit':'hit');spark(m.pos,crit?0xffd36a:0xffffff);if(!m.boss)m.setAnim('hit',.25);
  if(m.ai!=='chase'){m.ai='chase';}m.hostile=true;if(m.hp<=0)killMob(m);}
function killMob(m){m.dead=true;m.hp=0;m.setAnim('dead',99);sfx(m.d.draw==='jellop'||m.d.draw==='king'?'squish':'die');if(G.target===m)setTarget(null);if(G.act&&G.act.u===m)G.act=null;
  const d=m.d;gainExp(d.exp[0],d.exp[1]);P.kills[m.kind]=(P.kills[m.kind]||0)+1;
  const luck=1+sk('lucky_find')*.06;for(const [id,ch] of d.drops)if(Math.random()<ch*luck)dropItem(id,m.pos);for(const it of m.looted)dropItem(it,m.pos);
  if(m.boss){G.boss.alive=false;G.boss.next=G.t+MAPS[G.map].boss.every;banner('MVP!',`${P.name} defeated ${m.d.n}!`);chat(`[MVP] ${P.name} defeated ${m.d.n}! It will return in ${MAPS[G.map].boss.every/60|0} minutes.`,'mvp');music(MAPS[G.map].music);
    const bonus=mkItem(['orange_tonic','blue_draught','brightstone'][ri(0,2)],3);addItem(bonus);chat(`MVP reward: ${ITEMS[bonus.id].n} ×3`,'loot');}
  setTimeout(()=>{const i=G.mobs.indexOf(m);if(i<0)return;m.dispose();G.mobs.splice(i,1);if(!m.boss){const g=m.home;setTimeout(()=>{if(G.map==='field'&&G.state!=='loading'){const a=rand(0,6.28),r=Math.random()*(m.range||10);spawnMob(m.kind,g.x+Math.cos(a)*r,g.z+Math.sin(a)*r,[g.x,0,g.z]).range=m.range;}},rand(8000,16000));}},1600);}
function heroHurt(m){if(me.dead)return;const d=m.d;if(Math.random()*100<ST.pdodge){floatTxt(me,'Lucky!','miss');return;}if(Math.random()*100>clamp(80+d.hit-ST.flee,5,95)){floatTxt(me,'Miss','miss');sfx('miss');return;}
  let dmg=rand(d.atk[0],d.atk[1]);dmg=Math.max(1,Math.round(dmg*100/(100+ST.def*4)-ST.softDef));P.hp-=dmg;floatTxt(me,fmt(dmg),'me');sfx('hit');if(!me.lock&&!G.cast)me.setAnim('hit',.22);if(G.sitting)toggleSit(false);
  if(G.cast&&Math.random()<.5&&!G.cast.uninterruptible){}if(P.hp<=0)heroDie();renderHud();}
function heroDie(){P.hp=0;me.dead=true;me.setAnim('dead',999);G.act=null;G.move=null;G.cast=null;$('#castbar').hidden=true;sfx('die');
  if(P.job!=='novice'){const loss=Math.floor(D.BASE_NEXT(P.baseLv)*.01);P.baseExp=Math.max(0,P.baseExp-loss);chat(`You have fallen. Lost ${fmt(loss)} base EXP.`,'bad');}else chat('You have fallen. (Novices lose no EXP.)','bad');
  for(const m of G.mobs)if(m.ai==='chase'){m.ai='return';}setTimeout(()=>{$('#dead').hidden=false;},1200);}
$('#respawn').onclick=()=>{$('#dead').hidden=true;P.hp=Math.round(ST.mhp*.5);P.sp=Math.round(ST.msp*.5);me.dead=false;me.lock=0;me.setAnim('idle');enterMap(P.save,...(P.save==='town'?[0,6]:[]));};
function gainExp(b,j){P.baseExp+=b;P.jobExp+=j;floatTxt(me,`+${b} / +${j} exp`,'exp');let up=false;
  while(P.baseLv<D.BASE_CAP&&P.baseExp>=D.BASE_NEXT(P.baseLv)){P.baseExp-=D.BASE_NEXT(P.baseLv);P.baseLv++;P.statPts+=D.statPointsForLevel(P.baseLv);up=true;levelFx('BASE LEVEL UP!');chat(`Base level up! You are now level ${P.baseLv}. (+${D.statPointsForLevel(P.baseLv)} stat points)`,'lvl');}
  const T=JOBS[P.job].tier;while(P.jobLv<D.JOB_CAP(T)&&P.jobExp>=D.JOB_NEXT(P.jobLv,T)){P.jobExp-=D.JOB_NEXT(P.jobLv,T);P.jobLv++;P.skillPts++;up=true;levelFx('JOB LEVEL UP!');chat(`Job level up! Job level ${P.jobLv}. (+1 skill point)`,'lvl');
    if(P.job==='novice'&&P.jobLv===10)chat('You can now change job! Visit Master Corwin in Valeria.','sys');}
  if(P.jobLv>=D.JOB_CAP(T))P.jobExp=Math.min(P.jobExp,D.JOB_NEXT(P.jobLv,T)-1);
  if(up){refresh();P.hp=ST.mhp;P.sp=ST.msp;}renderHud();}
function autoAttack(dt){G.atkT-=dt;const a=G.act;if(!a||a.t!=='attack')return;const m=a.u;if(!m||m.dead){G.act=null;return;}
  const d=dist(me,m);if(d>ST.range+.3*m.actor.scale){walkTo(m.pos,dt);return;}if(G.cast)return;me.face=Math.atan2(m.pos.x-me.pos.x,m.pos.z-me.pos.z);
  if(G.atkT<=0&&weight()<ST.maxW*.9){G.atkT=ST.delay;me.atkDur=Math.min(.5,ST.delay*.8);me.setAnim('attack',me.atkDur);sfx('swing');
    setTimeout(()=>{if(m.dead||me.dead)return;if(ST.wt==='bow')arrow(me.pos,m.pos);const r=physDamage(m);hurtMob(m,r.dmg,r);
      if(!r.miss&&ST.wt==='dagger'&&Math.random()<sk('twin_blade')*.05){setTimeout(()=>{if(!m.dead){const r2=physDamage(m,1,{critOk:false});hurtMob(m,r2.dmg,r2);}},120);}},ST.delay*300);}
  else if(weight()>=ST.maxW*.9&&!G.warnedW){G.warnedW=true;chat('You are carrying too much to attack! (90% weight)','bad');}}
function walkTo(p,dt){const dx=p.x-me.pos.x,dz=p.z-me.pos.z,d=Math.hypot(dx,dz);if(d<.05)return true;const step=Math.min(d,ST.speed*dt);me.pos.x+=dx/d*step;me.pos.z+=dz/d*step;me.face=Math.atan2(dx,dz);if(!me.lock)me.setAnim('walk');collide(me.pos,.45,G.world.colliders,G.world.size);return d<.15;}

/* ---------------- skills ---------------- */
function useHot(i){const h=P.hot[i];if(!h)return;if(h.t==='item'){const idx=P.inv.findIndex(x=>x.id===h.id);if(idx<0){chat(`No ${ITEMS[h.id].n} left.`,'bad');return;}useItem(idx);}else useSkill(h.id);}
function useSkill(id,tgt){const S=SKILLS[id],lv=sk(id);if(!lv||S.t==='passive'||me.dead||G.state!=='play')return;if(G.cast){return;}
  if(S.needs&&ST.wt!==S.needs){chat(`${S.n} needs a ${S.needs}.`,'bad');sfx('bad');return;}const cost=S.sp(lv);if(P.sp<cost){chat('Not enough SP.','bad');sfx('bad');return;}
  if(S.zeny&&P.zeny<S.zeny(lv)){chat('Not enough gold for Coin Strike.','bad');return;}if((G.skillCd||0)>G.t)return;
  if(S.t==='target'||S.t==='aoe'){tgt=tgt||(G.target&&!G.target.dead?G.target:null);if(!tgt){const near=G.mobs.filter(m=>!m.dead&&dist(me,m)<(S.range||2)+6).sort((a,b)=>dist(me,a)-dist(me,b))[0];
      if(!near){G.pendingSkill=id;$('#hint').hidden=false;$('#hint').textContent=`${S.n}: tap a monster`;return;}tgt=near;}setTarget(tgt);
    if(dist(me,tgt)>(S.range||2)+.4*tgt.actor.scale){G.act={t:'skill',id,u:tgt};return;}}
  const castT=S.cast?S.cast(lv)*ST.castMul:0;me.face=tgt?Math.atan2(tgt.pos.x-me.pos.x,tgt.pos.z-me.pos.z):me.face;G.move=null;
  if(castT>.05){G.cast={id,lv,tgt,t:0,dur:castT};me.setAnim('cast',castT+.2);$('#castbar').hidden=false;castCircle(me.pos,S.el);return;}
  fireSkill(id,lv,tgt);}
function cancelCast(msg){if(!G.cast)return;G.cast=null;$('#castbar').hidden=true;me.lock=0;me.setAnim('idle');if(msg)chat(msg,'sys');}
function fireSkill(id,lv,tgt){const S=SKILLS[id];P.sp-=S.sp(lv);if(S.zeny){P.zeny-=S.zeny(lv);sfx('coin');}G.skillCd=G.t+(S.cd||.6);skillShout(S.n);
  if(S.anim==='attack'){me.atkDur=.45;me.setAnim('attack',.45);}else me.setAnim('cast',.5);
  if(S.t==='self'){if(id==='first_aid'){healMe(S.heal(lv));}if(id==='heal'){healMe(Math.floor((P.baseLv+ST.s.int)/8)*(4+lv*8)+20);}
    if(S.buff){G.buffs[S.buff.k]={lv,until:G.t+S.buff.dur(lv)};refresh();chat(`${S.n} (${S.buff.dur(lv)}s)`,'sys');ringFx(me.pos,0xffe08a);sfx('heal');}renderHud();return;}
  if(!tgt||tgt.dead)return;
  const at=S.magic?250:220;setTimeout(()=>{if(tgt.dead||me.dead)return;
    if(S.magic){const n=S.bolts?S.bolts(lv):1;for(let i=0;i<n;i++)setTimeout(()=>{if(tgt.dead)return;boltFx(S.fx,tgt.pos);setTimeout(()=>{if(tgt.dead)return;hurtMob(tgt,magicDamage(tgt,S.mult(lv),S.el),{el:S.el});
      if(S.freeze&&Math.random()<S.freeze(lv)&&!tgt.boss){tgt.frozen=G.t+3;floatTxt(tgt,'Frozen!','miss');}},120);},i*220);sfx(S.el==='fire'?'fire':S.el==='water'?'frost':S.el==='holy'?'heal':'thunder');return;}
    if(S.t==='aoe'){const c=tgt.pos.clone();if(S.fx==='shower')showerFx(c,S.radius);else flameFx(c,S.radius);sfx(S.el==='fire'?'fire':'swing');for(const m of G.mobs)if(!m.dead&&Math.hypot(m.pos.x-c.x,m.pos.z-c.z)<S.radius){const r=physDamage(m,S.mult(lv),{el:S.el||'neutral'});hurtMob(m,r.dmg,r);}return;}
    if(id==='snatch'){const ok=Math.random()<S.steal(lv)&&!tgt.stolen;if(ok){tgt.stolen=1;const pool=tgt.d.drops.filter(([i,ch])=>ch>=.05);const it=pool[ri(0,pool.length-1)][0];addItem(mkItem(it));chat(`You snatched ${ITEMS[it].n}!`,'loot');sfx('loot');}else{floatTxt(tgt,'Nothing','miss');}tgt.hostile=true;tgt.ai='chase';return;}
    const hits=S.hits||1;for(let h=0;h<hits;h++)setTimeout(()=>{if(tgt.dead)return;if(S.fx==='arrows')arrow(me.pos,tgt.pos);const r=physDamage(tgt,S.mult(lv),{el:S.el||'neutral'});if(S.hitBonus&&r.miss&&Math.random()<S.hitBonus(lv)/100){Object.assign(r,physDamage(tgt,S.mult(lv)));}
      hurtMob(tgt,r.dmg,r);if(!r.miss&&S.poison&&Math.random()<S.poison(lv)){tgt.poison=G.t+8;floatTxt(tgt,'Poisoned','miss');}if(S.fx==='bash')ringFx(tgt.pos,0xffd36a);if(S.fx==='coins')coinFx(tgt.pos);},h*150);},at);}
function healMe(v){v=Math.round(v);P.hp=Math.min(ST.mhp,P.hp+v);floatTxt(me,'+'+v,'heal');healFx(me.pos);sfx('heal');renderHud();}
function toggleSit(force){if(me.dead)return;G.sitting=force??!G.sitting;if(G.sitting){G.move=null;G.act=null;me.setAnim('sit',9999);}else{me.lock=0;me.setAnim('idle');}$('#sitbtn').classList.toggle('on',G.sitting);}

/* ---------------- items ---------------- */
function addItem(it){const d=ITEMS[it.id];if(d.t!=='equip'){const ex=P.inv.find(x=>x.id===it.id);if(ex){ex.n+=it.n;}else P.inv.push(it);}else P.inv.push(it);if(G.windows.has('inv'))renderInv();renderHud();}
function removeItem(idx,n=1){const it=P.inv[idx];if(it.n&&it.n>n){it.n-=n;}else P.inv.splice(idx,1);}
function itemName(it){const d=ITEMS[it.id];return `${it.refine?'+'+it.refine+' ':''}${d.n}${d.cards?` [${d.cards}]`:''}`;}
function useItem(idx){const it=P.inv[idx];if(!it)return;const d=ITEMS[it.id];if(me.dead)return;
  if(d.t==='use'){if(d.heal)healMe(d.heal*rand(.9,1.1)*(1+ST.s.vit/100));if(d.sp){P.sp=Math.min(ST.msp,P.sp+d.sp);floatTxt(me,'+'+d.sp+' SP','sp');}
    if(d.warp==='random'){removeItem(idx);const h=G.world.size/2-6;let x,z,k=0;do{x=rand(-h,h);z=rand(-h,h);k++;}while(k<20&&G.world.colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+1));me.pos.set(x,0,z);G.move=null;G.act=null;ringFx(me.pos,0x8ad8ff);renderHud();return;}
    if(d.gift){removeItem(idx);const [gid,gn]=D.GIFTS[ri(0,D.GIFTS.length-1)];addItem(mkItem(gid,ITEMS[gid].t==='equip'?1:gn));if(Math.random()<.04){const h=['holly_cap','antler_band','snow_tiara'][ri(0,2)];addItem(mkItem(h));banner('LUCKY GIFT!',ITEMS[h].n);}chat(`The gift contained ${ITEMS[gid].n}${gn>1?' ×'+gn:''}!`,'loot');sfx('loot');renderHud();if(G.windows.has('inv'))renderInv();return;}
    if(d.warp==='save'){removeItem(idx);enterMap(P.save,...(P.save==='town'?[0,6]:[]));return;}removeItem(idx);renderHud();if(G.windows.has('inv'))renderInv();return;}
  if(d.t==='equip')equipItem(idx);if(d.t==='card')openCardSocket(idx);}
function canEquip(d){if(d.jobs==='all'||!d.jobs){if(d.slot==='weapon'){return JOBS[P.job].wpn.includes(d.wt);}return true;}return d.jobs.includes(P.job);}
function equipItem(idx){const it=P.inv[idx],d=ITEMS[it.id];if(!canEquip(d)){chat(`${JOBS[P.job].n}s can't use ${d.n}.`,'bad');sfx('bad');return;}
  let sl=d.slot;if(sl==='acc')sl=!P.equip.acc1?'acc1':!P.equip.acc2?'acc2':'acc1';P.inv.splice(idx,1);if(P.equip[sl])P.inv.push(P.equip[sl]);P.equip[sl]=it;sfx('click');chat(`Equipped ${itemName(it)}.`,'sys');refresh();renderInv();renderEquip();}
function unequip(sl){const it=P.equip[sl];if(!it)return;delete P.equip[sl];P.inv.push(it);sfx('click');refresh();renderInv();renderEquip();}
function dropItem(id,pos){const d=ITEMS[id];const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d');g.font='44px serif';g.textAlign='center';g.textBaseline='middle';
  if(d.t==='card'){g.fillStyle='#f8f0d8';g.strokeStyle='#8a6a2a';g.lineWidth=3;g.beginPath();g.roundRect(14,6,36,52,5);g.fill();g.stroke();g.fillStyle='#c84a3a';g.font='26px serif';g.fillText('✦',32,32);}else g.fillText(d.ic||'📦',32,34);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(.9,.9,1);s.center.set(.5,0);
  const p=pos.clone().add(new THREE.Vector3(rand(-1.1,1.1),0,rand(-1.1,1.1)));s.position.copy(p);scene.add(s);const drop={id,pos:p,obj:s,t:G.t,rare:d.t==='card'||(d.price||0)>=3000};G.drops.push(drop);
  if(drop.rare){chat(`★ ${d.n} dropped!`,'loot');}setTimeout(()=>{const i=G.drops.indexOf(drop);if(i>=0){scene.remove(s);G.drops.splice(i,1);}},90000);}
function pickUp(drop){const i=G.drops.indexOf(drop);if(i<0)return;const d=ITEMS[drop.id];if(weight()+(d.w||0)>ST.maxW){chat('You cannot carry any more.','bad');return;}
  G.drops.splice(i,1);scene.remove(drop.obj);addItem(mkItem(drop.id));chat(`You got ${d.n}.`,'loot');sfx('loot');}
function openCardSocket(idx){const card=P.inv[idx],cd=ITEMS[card.id];const want=cd.cardSlot;const cands=[];
  P.inv.forEach((it,i)=>{const d=ITEMS[it.id];if(d.t==='equip'&&d.slot===want&&(it.cards||[]).length<(d.cards||0))cands.push({it,where:'inv',i});});
  for(const sl in P.equip){const it=P.equip[sl];const d=ITEMS[it.id];if(d.slot===want&&(it.cards||[]).length<(d.cards||0))cands.push({it,where:'eq',sl});}
  win('socket',`Socket ${cd.n}`,cands.length?`<p class="hint">${E(cd.d)} Cards are permanent once socketed.</p><div class="list">${cands.map((c,k)=>`<button class="row item" data-k="${k}">${ic(c.it.id)}<span>${E(itemName(c.it))}${c.where==='eq'?' <small>(equipped)</small>':''}</span><small>${(c.it.cards||[]).length}/${ITEMS[c.it.id].cards} slots</small></button>`).join('')}</div>`:
    `<p>You have no ${want==='head'?'headgear':want} with a free card slot.</p><p class="hint">Look for gear with [1] or more in its name.</p>`,el=>{el.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const c=cands[+b.dataset.k];c.it.cards.push(card.id);const ci=P.inv.indexOf(card);removeItem(ci);sfx('refineOk');chat(`${cd.n} socketed into ${itemName(c.it)}!`,'loot');closeWindow('socket');refresh();renderInv();renderEquip();});});}

/* ---------------- monster AI ---------------- */
function mobAI(m,dt){if(m.dead)return;if(m.frozen&&m.frozen>G.t){m.actor.mat.color.setHex(0x9fe2ff);return;}m.actor.mat.color.setHex(m.poison&&m.poison>G.t?0xb8f08a:0xffffff);
  if(m.poison&&m.poison>G.t){m.pt=(m.pt||0)-dt;if(m.pt<=0){m.pt=1;const v=Math.max(1,Math.round(m.mhp*.03));m.hp-=v;floatTxt(m,fmt(v),'poison');if(m.hp<=0){killMob(m);return;}}}
  const d=dist(m,me);const spd=m.d.speed;
  if(m.ai==='idle'){m.aiT-=dt;if(m.d.aggro&&!me.dead&&d<7)m.ai='chase';
    if(m.d.looter&&!m.lootT){const drop=G.drops.find(x=>Math.hypot(x.pos.x-m.pos.x,x.pos.z-m.pos.z)<6&&G.t-x.t>3);if(drop){m.lootT=drop;}}
    if(m.lootT){const dr=m.lootT;if(!G.drops.includes(dr)){m.lootT=null;}else{const dx=dr.pos.x-m.pos.x,dz=dr.pos.z-m.pos.z,dd=Math.hypot(dx,dz);if(dd<.5){m.looted.push(dr.id);G.drops.splice(G.drops.indexOf(dr),1);scene.remove(dr.obj);m.lootT=null;}else{m.pos.x+=dx/dd*dt*spd;m.pos.z+=dz/dd*dt*spd;m.face=Math.atan2(dx,dz);m.setAnim('walk');}}return;}
    if(m.aiT<=0){m.aiT=rand(2,6);m.wander=new THREE.Vector3(m.home.x+rand(-1,1)*(m.range||8),0,m.home.z+rand(-1,1)*(m.range||8));}
    if(m.wander){const dx=m.wander.x-m.pos.x,dz=m.wander.z-m.pos.z,dd=Math.hypot(dx,dz);if(dd>.3){m.pos.x+=dx/dd*dt*spd*.6;m.pos.z+=dz/dd*dt*spd*.6;m.face=Math.atan2(dx,dz);if(!m.lock)m.setAnim('walk');}else{m.wander=null;if(!m.lock)m.setAnim('idle');}}}
  else if(m.ai==='return'){const dx=m.home.x-m.pos.x,dz=m.home.z-m.pos.z,dd=Math.hypot(dx,dz);if(dd<1){m.ai='idle';m.hostile=!!m.d.aggro;}else{m.pos.x+=dx/dd*dt*spd*1.3;m.pos.z+=dz/dd*dt*spd*1.3;m.face=Math.atan2(dx,dz);m.setAnim('walk');}m.hp=Math.min(m.mhp,m.hp+m.mhp*dt*.1);}
  else{if(me.dead||Math.hypot(m.pos.x-m.home.x,m.pos.z-m.home.z)>(m.boss?40:26)){m.ai='return';return;}const reach=m.boss?2.4:1.5;
    if(d>reach){const dx=me.pos.x-m.pos.x,dz=me.pos.z-m.pos.z;m.pos.x+=dx/d*dt*spd;m.pos.z+=dz/d*dt*spd;m.face=Math.atan2(dx,dz);if(!m.lock)m.setAnim('walk');}
    else{m.face=Math.atan2(me.pos.x-m.pos.x,me.pos.z-m.pos.z);m.atkT-=dt;if(m.atkT<=0){m.atkT=m.d.aspd;m.setAnim('attack',.45);setTimeout(()=>{if(!m.dead&&dist(m,me)<reach+1)heroHurt(m);},220);}else if(!m.lock)m.setAnim('idle');}
    if(m.boss){m.sumT=(m.sumT||12)-dt;if(m.sumT<=0){m.sumT=14;for(let i=0;i<3;i++){const a=rand(0,6.28);const s=spawnMob(m.d.summon||'jellop',m.pos.x+Math.cos(a)*3,m.pos.z+Math.sin(a)*3,[m.home.x,0,m.home.z]);s.ai='chase';s.hostile=true;s.summon=1;}chat(`${m.d.n} calls for help!`,'mvp');sfx('boss');}}}
  for(const o of G.mobs)if(o!==m&&!o.dead){const dx=m.pos.x-o.pos.x,dz=m.pos.z-o.pos.z,dd=Math.hypot(dx,dz),r=.55*(m.actor.scale+o.actor.scale);if(dd<r&&dd>1e-3){m.pos.x+=dx/dd*(r-dd)*.5;m.pos.z+=dz/dd*(r-dd)*.5;}}
  collide(m.pos,.4,G.world.colliders,G.world.size);}

/* ---------------- effects ---------------- */
let GLOW=null;function glowTex(){if(GLOW)return GLOW;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);GLOW=new THREE.CanvasTexture(c);return GLOW;}
function fx(obj,life,tick){scene.add(obj);G.fx.push({obj,life,t:0,tick});}
const gsprite=(col,s)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.setScalar(s);return sp;};
function spark(p,col){for(let i=0;i<6;i++){const s=gsprite(col,.5);const v=new THREE.Vector3(rand(-3,3),rand(2,5),rand(-3,3));s.position.set(p.x,1.2,p.z);fx(s,.35,(k,dt)=>{s.position.addScaledVector(v,dt);v.y-=12*dt;s.material.opacity=1-k;});}}
function ringFx(p,col){const m=new THREE.Mesh(new THREE.RingGeometry(.8,1,40),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(p.x,.1,p.z);fx(m,.5,k=>{m.scale.setScalar(1+k*2.5);m.material.opacity=1-k;});}
function healFx(p){for(let i=0;i<14;i++){const s=gsprite(i%2?0x9af07a:0xffffff,.45);const a=rand(0,6.28),r=rand(.2,.9);s.position.set(p.x+Math.cos(a)*r,rand(0,.6),p.z+Math.sin(a)*r);fx(s,.9,(k,dt)=>{s.position.y+=dt*2.6;s.material.opacity=1-k;});}ringFx(p,0x9af07a);}
function castCircle(p,el){const col={fire:0xff8a3a,water:0x8ad8ff,wind:0xfff27a,holy:0xfff2a0}[el]||0xd8b0ff;const m=new THREE.Mesh(new THREE.RingGeometry(1.1,1.35,6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(p.x,.06,p.z);
  fx(m,30,k=>{m.rotation.z+=.03;if(!G.cast){m.material.opacity*=.8;if(m.material.opacity<.02)m.userData.kill=1;}else m.position.set(me.pos.x,.06,me.pos.z);});}
function boltFx(kind,p){const col={firebolt:0xff7a2a,frostbolt:0x9fe2ff,thunder:0xfff27a,smite:0xfff4c0}[kind]||0xffffff;const x=p.x+rand(-.4,.4),z=p.z+rand(-.4,.4);
  if(kind==='thunder'||kind==='smite'){const h=12;const m=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,h,6),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending}));m.position.set(x,h/2,z);fx(m,.25,k=>{m.material.opacity=1-k;m.scale.x=m.scale.z=1+Math.sin(k*40)*.5;});const g=gsprite(col,3);g.position.set(x,.8,z);fx(g,.3,k=>{g.material.opacity=1-k;});return;}
  const s=gsprite(col,kind==='frostbolt'?.9:1.3);s.position.set(x+2,9,z-1);const t0={x:x+2,y:9,z:z-1};fx(s,.22,k=>{s.position.set(t0.x+(x-t0.x)*k,t0.y*(1-k)+.6,t0.z+(z-t0.z)*k);});
  setTimeout(()=>{const g=gsprite(col,2.4);g.position.set(x,.6,z);fx(g,.3,k=>{g.material.opacity=1-k;g.scale.setScalar(2.4*(1+k));});spark({x,z},col);},220);}
function flameFx(c,r){for(let i=0;i<16;i++){const a=i/16*6.28;const s=gsprite(i%2?0xff7a2a:0xffd36a,1.2);s.position.set(c.x+Math.cos(a)*r*.7,.5,c.z+Math.sin(a)*r*.7);fx(s,.6,(k,dt)=>{s.position.y+=dt*2;s.material.opacity=1-k;s.scale.setScalar(1.2*(1-k*.5));});}ringFx(c,0xff7a2a);}
function showerFx(c,r){for(let i=0;i<14;i++)setTimeout(()=>{const x=c.x+rand(-r,r)*.7,z=c.z+rand(-r,r)*.7;const m=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.2,4),new THREE.MeshBasicMaterial({color:0xf0e0c0}));m.position.set(x+1.5,8,z);m.rotation.z=.2;fx(m,.25,k=>{m.position.set(x+1.5*(1-k),8*(1-k)+.6,z);});},i*40);}
function arrow(a,b){const m=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1,4),new THREE.MeshBasicMaterial({color:0xf8f0d8}));m.rotation.order='YXZ';const from=new THREE.Vector3(a.x,1.1,a.z),to=new THREE.Vector3(b.x,1,b.z);
  m.rotation.y=Math.atan2(to.x-from.x,to.z-from.z);m.rotation.x=Math.PI/2;fx(m,.18,k=>{m.position.lerpVectors(from,to,k);});}
function coinFx(p){for(let i=0;i<10;i++){const s=gsprite(0xffd36a,.4);const v=new THREE.Vector3(rand(-3,3),rand(3,6),rand(-3,3));s.position.set(p.x,1,p.z);fx(s,.6,(k,dt)=>{s.position.addScaledVector(v,dt);v.y-=14*dt;});}}
function levelFx(txt){const p=me.pos;const m=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,10,24,1,true),new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(p.x,5,p.z);fx(m,1.4,k=>{m.position.set(me.pos.x,5,me.pos.z);m.material.opacity=.5*Math.sin(k*Math.PI);});floatTxt(me,txt,'lvl');sfx('level');}
function fxUpdate(dt){for(let i=G.fx.length-1;i>=0;i--){const f=G.fx[i];f.t+=dt;const k=Math.min(1,f.t/f.life);f.tick&&f.tick(k,dt);if(k>=1||f.obj.userData.kill){scene.remove(f.obj);f.obj.geometry&&f.obj.geometry.dispose();G.fx.splice(i,1);}}}

/* ---------------- floating text, labels, chat ---------------- */
const floats=[];function floatTxt(u,txt,cls){const el=document.createElement('div');el.className='ft '+(cls||'');el.textContent=txt;$('#floats').appendChild(el);floats.push({el,u,t:0,dx:rand(-12,12)});setTimeout(()=>{el.remove();const i=floats.findIndex(f=>f.el===el);if(i>=0)floats.splice(i,1);},1200);}
function skillShout(n){bubble(me,n+'!!',1400,'shout');}
function bubble(u,txt,ms=3500,cls=''){if(u.bubble)u.bubble.remove();const el=document.createElement('div');el.className='bubble '+cls;el.textContent=txt;$('#labels').appendChild(el);u.bubble=el;clearTimeout(u.bt);u.bt=setTimeout(()=>{el.remove();if(u.bubble===el)u.bubble=null;},ms);}
function labels(){const place=(el,u,yo)=>{const [x,y,z]=screenOf(u,yo);if(z>1){el.style.display='none';return;}el.style.display='';el.style.left=x+'px';el.style.top=y+'px';};
  for(const f of floats){const [x,y,z]=screenOf(f.u,2.4);f.el.style.left=(x+f.dx)+'px';f.el.style.top=y+'px';f.el.style.display=z>1?'none':'';}
  for(const u of [me,...G.npcs,...G.mobs]){if(!u)continue;if(u.bubble)place(u.bubble,u,u===me||u.npc?3.1:2.2*u.actor.scale+.6);
    if(u.npc){if(!u.label){u.label=document.createElement('div');u.label.className='nlabel npc';u.label.textContent=u.npc.n;$('#labels').appendChild(u.label);}place(u.label,u,-.15);}
    else if(u===me){if(!u.label){u.label=document.createElement('div');u.label.className='nlabel me';$('#labels').appendChild(u.label);}u.label.innerHTML=`${E(P.name)}<div class="mini"><i style="width:${P.hp/ST.mhp*100}%"></i></div><div class="mini sp"><i style="width:${P.sp/ST.msp*100}%"></i></div>`;place(u.label,u,-.15);}
    else{const show=u===G.target||u.hp<u.mhp||u.boss;if(show&&!u.dead){if(!u.label){u.label=document.createElement('div');u.label.className='nlabel mob'+(u.boss?' boss':'');$('#labels').appendChild(u.label);}
        u.label.innerHTML=`${E(u.d.n)}${u.boss?' <b>MVP</b>':''}<div class="mini"><i style="width:${u.hp/u.mhp*100}%"></i></div>`;place(u.label,u,-.15);}else if(u.label){u.label.remove();u.label=null;}}}
  for(const p of G.world?G.world.portals:[]){if(!p.el){p.el=document.createElement('div');p.el.className='nlabel portal';p.el.textContent='⇢ '+p.label;$('#labels').appendChild(p.el);}place(p.el,{pos:p.obj.position},3.6);}}
const EMOTES={heart:'❤️',lol:'😆',ok:'👌','?':'❓','!':'❗',sweat:'💦',angry:'💢',zzz:'💤',music:'🎵',gg:'👍',sob:'😭',wow:'😮',hmm:'🤔',thx:'🙏',bye:'👋',sit:null};
function sendChat(){const inp=$('#chatin');const v=inp.value.trim();inp.value='';inp.blur();if(!v)return;
  if(v[0]==='/'){const c=v.slice(1).toLowerCase();if(c==='sit'){toggleSit();return;}if(EMOTES[c]){bubble(me,EMOTES[c],2500,'emote');return;}if(c==='where'){chat(`${MAPS[G.map].n} (${Math.round(me.pos.x)}, ${Math.round(me.pos.z)})`,'sys');return;}
    chat('Commands: /sit /where  Emotes: '+Object.keys(EMOTES).filter(k=>EMOTES[k]).map(k=>'/'+k).join(' '),'sys');return;}
  bubble(me,v);chat(`${P.name} : ${v}`,'me');}
function chat(txt,cls=''){const box=$('#chatlog');const d=document.createElement('div');d.className=cls;d.textContent=txt;box.appendChild(d);while(box.children.length>60)box.firstChild.remove();box.scrollTop=box.scrollHeight;}
function banner(big,small){const b=$('#banner');b.innerHTML=`<b>${E(big)}</b><span>${E(small)}</span>`;b.hidden=false;b.classList.remove('go');void b.offsetWidth;b.classList.add('go');setTimeout(()=>b.hidden=true,3800);}

/* ---------------- HUD & windows ---------------- */
function renderHud(){if(!P||!ST)return;const T=JOBS[P.job].tier;$('#bname').textContent=P.name;$('#bjob').textContent=JOBS[P.job].n;
  const bar=(id,v,m,txt)=>{$(id+' i').style.width=clamp(v/m*100,0,100)+'%';$(id+' span').textContent=txt;};
  bar('#bhp',P.hp,ST.mhp,`${fmt(Math.max(0,P.hp))} / ${fmt(ST.mhp)}`);bar('#bsp',P.sp,ST.msp,`${fmt(P.sp)} / ${fmt(ST.msp)}`);
  const bn=D.BASE_NEXT(P.baseLv),jn=D.JOB_NEXT(P.jobLv,T);bar('#bbase',P.baseExp,bn,`Base Lv ${P.baseLv}  ${(P.baseExp/bn*100).toFixed(1)}%`);bar('#bjobx',P.jobExp,jn,`Job Lv ${P.jobLv}  ${P.jobLv>=D.JOB_CAP(T)?'MAX':(P.jobExp/jn*100).toFixed(1)+'%'}`);
  const w=weight();$('#bweight').textContent=`Weight ${fmt(w/10)}/${fmt(ST.maxW/10)}`;$('#bweight').classList.toggle('bad',w>=ST.maxW*.5);$('#bzeny').textContent=`${fmt(P.zeny)} g`;
  $('#btn-stat').classList.toggle('dot',P.statPts>0);$('#btn-skill').classList.toggle('dot',P.skillPts>0);renderHot();
  if(G.target&&!G.target.dead){$('#tname').textContent=`${G.target.d.n}  Lv ${G.target.d.lv}`;$('#thp i').style.width=G.target.hp/G.target.mhp*100+'%';}else $('#tframe').hidden=true;}
function ic(id){const d=ITEMS[id];return `<span class="ic ${d.t==='card'?'card':''}">${d.t==='card'?'✦':d.ic||'📦'}</span>`;}
function renderHot(){const box=$('#hotbar');const n=MOBILE?6:8;box.innerHTML=P.hot.slice(0,n).map((h,i)=>{let inner='',cnt='';if(h&&h.t==='skill'){inner=SKILLS[h.id].ic;}else if(h&&h.t==='item'){const it=P.inv.find(x=>x.id===h.id);inner=ITEMS[h.id].ic;cnt=it?it.n:0;}
    return `<button class="hk ${h?'':'empty'}" data-i="${i}">${inner}${cnt!==''?`<small>${cnt}</small>`:''}<em>${MOBILE?'':'F'+(i+1)}</em></button>`;}).join('');
  box.querySelectorAll('.hk').forEach(b=>{b.onclick=()=>{const i=+b.dataset.i;if(P.hot[i])useHot(i);else assignHot(i);};b.oncontextmenu=e=>{e.preventDefault();assignHot(+b.dataset.i);};
    let lp;b.addEventListener('touchstart',()=>{lp=setTimeout(()=>{assignHot(+b.dataset.i);lp=null;},550);},{passive:true});b.addEventListener('touchend',()=>clearTimeout(lp));});}
function assignHot(i){const skills=Object.keys(P.skills).filter(id=>SKILLS[id].t!=='passive'&&P.skills[id]>0);const items=[...new Set(P.inv.filter(it=>ITEMS[it.id].t==='use').map(it=>it.id))];
  win('hot','Set hotkey '+(i+1),`<p class="hint">Pick a skill or item for this slot.</p><div class="grid">${skills.map(id=>`<button class="pick" data-t="skill" data-id="${id}">${SKILLS[id].ic}<small>${SKILLS[id].n}</small></button>`).join('')}${items.map(id=>`<button class="pick" data-t="item" data-id="${id}">${ITEMS[id].ic}<small>${ITEMS[id].n}</small></button>`).join('')}<button class="pick" data-t="clear">✖<small>Clear</small></button></div>`,
    el=>el.querySelectorAll('.pick').forEach(b=>b.onclick=()=>{P.hot[i]=b.dataset.t==='clear'?null:{t:b.dataset.t,id:b.dataset.id};closeWindow('hot');renderHot();}));}
function win(id,title,html,bind){let el=document.getElementById('w-'+id);if(!el){el=document.createElement('div');el.id='w-'+id;el.className='win';$('#windows').appendChild(el);}
  el.innerHTML=`<header><b>${E(title)}</b><button class="x" aria-label="Close">✕</button></header><div class="wb">${html}</div>`;el.querySelector('.x').onclick=()=>closeWindow(id);G.windows.add(id);bind&&bind(el);return el;}
function closeWindow(id){const el=document.getElementById('w-'+id);if(el)el.remove();G.windows.delete(id);}
function closeAllWindows(){for(const id of [...G.windows])closeWindow(id);}
function toggleWindow(id){if(G.windows.has(id)){closeWindow(id);return;}({stat:renderStat,inv:renderInv,equip:renderEquip,skill:renderSkills,opt:renderOpt})[id]();}
function renderStat(){if(!G.windows.has('stat')&&arguments[0]===false)return;const s=ST.s,b=equipBonus();
  win('stat','Status',`<div class="stats">${STATS.map(k=>`<div class="srow"><span title="${D.STAT_HELP[k]}">${D.STAT_NAMES[k]}</span><b>${P.stats[k]}${b[k]?`<em>+${b[k]}</em>`:''}</b><button class="plus" data-s="${k}" ${P.statPts>=D.statCost(P.stats[k])&&P.stats[k]<99?'':'disabled'}>+</button><small>${D.statCost(P.stats[k])}</small></div>`).join('')}</div>
    <p class="pts">Status points: <b>${P.statPts}</b></p>
    <div class="derived">${[['ATK',`${ST.statAtk} + ${ST.wAtk}`],['MATK',`${ST.matkMin} ~ ${ST.matkMax}`],['HIT',ST.hit],['FLEE',`${ST.flee} + ${ST.pdodge.toFixed(0)}`],['DEF',`${ST.def} + ${ST.softDef}`],['MDEF',ST.mdef],['CRIT',ST.crit.toFixed(0)],['ASPD',ST.aspd]].map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
    <p class="hint">Hover or long-press a stat name to see what it does. Raising a stat costs more points as it grows.</p>`,
    el=>el.querySelectorAll('.plus').forEach(bt=>bt.onclick=()=>{const k=bt.dataset.s,c=D.statCost(P.stats[k]);if(P.statPts<c)return;P.statPts-=c;P.stats[k]++;sfx('click');refresh();renderStat();}));}
function renderInv(){const tabs=['use','equip','etc'];const tab=G.invTab||'use';const list=P.inv.map((it,i)=>({it,i})).filter(({it})=>{const t=ITEMS[it.id].t;return tab==='etc'?(t==='etc'||t==='card'):t===tab;});
  win('inv','Inventory',`<div class="tabs">${tabs.map(t=>`<button class="tab ${t===tab?'on':''}" data-t="${t}">${{use:'Items',equip:'Equipment',etc:'Etc & Cards'}[t]}</button>`).join('')}</div>
    <div class="list">${list.map(({it,i})=>{const d=ITEMS[it.id];return `<div class="row item"><button class="iuse" data-i="${i}">${ic(it.id)}<span>${E(itemName(it))}${it.cards&&it.cards.length?` <small class="cards">${it.cards.map(c=>ITEMS[c].n.replace(' Card','')).join(', ')}</small>`:''}<small>${E(d.d)}</small></span></button><b>${it.n?'×'+it.n:''}</b><button class="tiny" data-sell="${i}" title="Drop">⤓</button></div>`;}).join('')||'<p class="hint">Nothing here yet.</p>'}</div>
    <p class="hint">Tap to ${tab==='equip'?'equip':tab==='use'?'use':'inspect / socket a card'}. Weight ${fmt(weight()/10)}/${fmt(ST.maxW/10)} · ${fmt(P.zeny)} g</p>`,
    el=>{el.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{G.invTab=b.dataset.t;renderInv();});el.querySelectorAll('.iuse').forEach(b=>b.onclick=()=>{const it=P.inv[+b.dataset.i];if(ITEMS[it.id].t==='etc'){chat(ITEMS[it.id].d,'sys');return;}useItem(+b.dataset.i);if(G.windows.has('inv'))renderInv();});
      el.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.sell,it=P.inv[i];if(!confirm(`Drop ${itemName(it)} on the ground?`))return;removeItem(i,it.n||1);dropItem(it.id,me.pos);renderInv();renderHud();});});}
const SLOT_NAMES={head:'Headgear',armor:'Armour',weapon:'Weapon',shield:'Shield',garment:'Garment',shoes:'Shoes',acc1:'Accessory',acc2:'Accessory'};
function renderEquip(){if(!G.windows.has('equip')&&arguments[0]!==true&&!document.getElementById('w-equip'))return;
  win('equip','Equipment',`<div class="eqwrap"><img class="eqport" src="${heroPortrait(lookCfg())}" alt=""><div class="eq">${Object.keys(SLOT_NAMES).map(sl=>{const it=P.equip[sl];return `<button class="row slot" data-sl="${sl}"><small>${SLOT_NAMES[sl]}</small>${it?`${ic(it.id)}<span>${E(itemName(it))}${(it.cards||[]).length?`<small class="cards">${it.cards.map(c=>ITEMS[c].n).join(', ')}</small>`:''}</span>`:'<span class="empty">—</span>'}</button>`;}).join('')}</div></div><p class="hint">Tap a slot to take the item off. Headgear, weapons and shields show on your character.</p>`,
    el=>el.querySelectorAll('.slot').forEach(b=>b.onclick=()=>unequip(b.dataset.sl)));}
function renderSkills(){const J=JOBS[P.job];const ids=J.skills;
  win('skill',`${J.n} skills`,`<div class="list">${ids.map(id=>{const S=SKILLS[id],lv=sk(id);return `<div class="row skill"><span class="ic">${S.ic}</span><span><b>${S.n}</b> <small>Lv ${lv}/${S.max}${S.t==='passive'?' · passive':` · ${S.sp(Math.max(1,lv))} SP`}</small><small>${E(S.d)}</small></span><button class="plus" data-k="${id}" ${P.skillPts>0&&lv<S.max?'':'disabled'}>+</button>${lv&&S.t!=='passive'?`<button class="tiny" data-use="${id}">Use</button>`:''}</div>`;}).join('')}</div>
    <p class="pts">Skill points: <b>${P.skillPts}</b></p><p class="hint">${P.job==='novice'?'Reach job level 10, then talk to Master Corwin in Valeria to choose your job.':'Earn a skill point every job level. Put skills on your hotbar: tap an empty hotkey slot (or long-press a slot to change it).'}</p>`,
    el=>{el.querySelectorAll('.plus').forEach(b=>b.onclick=()=>{const id=b.dataset.k;if(P.skillPts<=0)return;P.skillPts--;P.skills[id]=sk(id)+1;sfx('click');
      if(SKILLS[id].t!=='passive'&&P.skills[id]===1){const free=P.hot.findIndex(h=>!h);if(free>=0)P.hot[free]={t:'skill',id};}refresh();renderSkills();});el.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{closeWindow('skill');useSkill(b.dataset.use);});});}
function renderOpt(){win('opt','Options',`<label class="row"><input type="checkbox" id="o-mus" ${musicOn?'checked':''}> Music</label><label class="row"><input type="checkbox" id="o-sfx" ${sfxOn?'checked':''}> Sound effects</label>
  <label class="row"><input type="checkbox" id="o-loot" ${G.autoLoot?'checked':''}> Auto-loot items you walk over</label><label class="row"><input type="checkbox" id="o-sh" ${SHADOWS?'checked':''}> Shadows (reload to apply)</label>
  <p class="hint">Controls — tap/click the ground to walk, tap a monster to attack, tap an NPC to talk. Two fingers (or right-drag) turn the camera, pinch/scroll to zoom. /sit or the Sit button recovers HP and SP faster. Type /heart, /lol, /gg… in chat for emotes.</p>
  <div class="row gap"><button class="b" id="o-new">New character</button><a class="b" href="eternal-realms.apk" download>Android app</a></div>`,el=>{
    el.querySelector('#o-mus').onchange=e=>{musicOn=e.target.checked;if(musicOn)music(curTrack);else for(const n in tracks)tracks[n].pause();};el.querySelector('#o-sfx').onchange=e=>{sfxOn=e.target.checked;};el.querySelector('#o-loot').onchange=e=>{G.autoLoot=e.target.checked;};
    el.querySelector('#o-sh').onchange=e=>{try{localStorage.setItem('ero_shadow',e.target.checked?'1':'0');}catch(x){}};el.querySelector('#o-new').onclick=()=>{if(confirm('Start a new character? This one will be deleted.')){localStorage.removeItem('ero_save');location.reload();}};});}
for(const [b,w] of [['#btn-stat','stat'],['#btn-inv','inv'],['#btn-equip','equip'],['#btn-skill','skill'],['#btn-opt','opt']])$(b).onclick=()=>{sfx('click');toggleWindow(w);};
$('#sitbtn').onclick=()=>toggleSit();$('#chatin').addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});$('#chatsend').onclick=sendChat;
$('#chatbtn').onclick=()=>{document.body.classList.toggle('chatopen');if(document.body.classList.contains('chatopen'))$('#chatin').focus();};

/* ---------------- NPCs ---------------- */
function talk(n){const id=n.npc.id;me.face=Math.atan2(n.pos.x-me.pos.x,n.pos.z-me.pos.z);n.face=Math.atan2(me.pos.x-n.pos.x,me.pos.z-n.pos.z);sfx('click');
  const name=n.npc.n;const say=(txt,opts)=>win('npc',name,`<p class="say">${txt}</p><div class="opts">${(opts||[['Goodbye',()=>closeWindow('npc')]]).map((o,i)=>`<button class="b" data-o="${i}">${o[0]}</button>`).join('')}</div>`,el=>el.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>(opts||[[0,()=>closeWindow('npc')]])[+b.dataset.o][1]()));
  if(id==='tools')return shop('tools',name,'“Tonics, wings and apples! Everything an adventurer needs.”');
  if(id==='arms')return shop('arms',name,'“Steel, leather and hats. Fine quality, honest prices… mostly.”');
  if(id==='healer'){P.hp=ST.mhp;P.sp=ST.msp;healFx(me.pos);renderHud();bubble(n,'May the light keep you!');return say('“Rest a moment… there. You are healed, child. Come back whenever you are hurt.”');}
  if(id==='warp')return say(`“The waystones hum today. Where shall I send you?” <br><small>Your save point: ${MAPS[P.save].n}</small>`,[['Greenmarch Meadows (free)',()=>{closeWindow('npc');enterMap('field');}],...(D.winterOn()?[['❄ Frostfall Hollow (festival)',()=>{closeWindow('npc');enterMap('snow');}]]:[]),['Save my position here',()=>{P.save='town';save();say('“Your soul is bound to Valeria. You will return here if you fall.”');}],['Goodbye',()=>closeWindow('npc')]]);
  if(id==='holly')return holly(name,n);
  if(id==='storage')return storage(name);
  if(id==='refine')return refiner(name);
  if(id==='job'){if(P.job!=='novice')return say(`“Ah, a ${JOBS[P.job].n}! Train hard. Second jobs will open to those who reach job level 40… in a future update.”`);
    if(P.jobLv<10)return say(`“Every hero starts as a Novice. Reach <b>job level 10</b> and I will open the paths of the six jobs to you. You are job level ${P.jobLv}. Hunt Jellops and Lopkins in Greenmarch Meadows, east of town.”`);
    return win('npc',name,`<p class="say">“You have trained well. Choose your path — this choice is permanent.”</p><div class="jobs">${D.FIRST_JOBS.map(j=>`<button class="job" data-j="${j}"><span class="jic">${JOBS[j].icon}</span><b>${JOBS[j].n}</b><small>${JOBS[j].d}</small><em>${JOBS[j].stats}</em></button>`).join('')}</div>`,
      el=>el.querySelectorAll('.job').forEach(b=>b.onclick=()=>{const j=b.dataset.j;if(!confirm(`Become a ${JOBS[j].n}?`))return;P.job=j;P.jobLv=1;P.jobExp=0;P.skillPts+=0;closeWindow('npc');refresh();P.hp=ST.mhp;P.sp=ST.msp;
        banner('JOB CHANGE!',`${P.name} is now a ${JOBS[j].n}!`);levelFx('JOB CHANGE!');chat(`You are now a ${JOBS[j].n}! New skills are in the Skills window.`,'lvl');
        const gift={warrior:'short_sword',mage:'rod',ranger:'short_bow',rogue:'cutter',cleric:'mace',trader:'hand_axe'}[j];addItem(mkItem(gift));chat(`Master Corwin gives you a ${ITEMS[gift].n}.`,'loot');save();}));}}
function today(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function holly(name,n){const tokens=(P.inv.find(x=>x.id==='snow_token')||{n:0}).n;const giftReady=P.giftDay!==today();
  win('npc',name,`<p class="say">“Happy Frostlight, ${E(P.name)}! The snow brought monsters to <b>Frostfall Hollow</b> — ask Sela to send you there. Bring me their <b>Snowflake Tokens</b> and I'll trade you festival treasures. Limited time only!”</p>
    <div class="list">${D.WINTER_SHOP.map(([id,c])=>`<div class="row item">${ic(id)}<span>${ITEMS[id].n}<small>${E(ITEMS[id].d)}</small></span><b>${c} ❄</b><button class="tiny" data-x="${id}" ${tokens>=c?'':'disabled'}>Trade</button></div>`).join('')}</div>
    <p class="hint">You have <b>${tokens}</b> Snowflake Tokens.</p><div class="row gap"><button class="b gilt" id="hgift" ${giftReady?'':'disabled'}>${giftReady?'🎁 Daily gift':'Gift claimed today'}</button></div>`,
    el=>{el.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{const [id,c]=D.WINTER_SHOP.find(x=>x[0]===b.dataset.x);const ti=P.inv.findIndex(x=>x.id==='snow_token');if(ti<0||P.inv[ti].n<c)return;removeItem(ti,c);addItem(mkItem(id));sfx('coin');chat(`Traded ${c} tokens for ${ITEMS[id].n}!`,'loot');if(ITEMS[id].limited)banner('LIMITED!',ITEMS[id].n);holly(name,n);save();});
      el.querySelector('#hgift').onclick=()=>{if(P.giftDay===today())return;P.giftDay=today();addItem(mkItem('gift_box'));addItem(mkItem('snow_token',3));sfx('loot');bubble(n,'Merry Frostlight!');chat('Holly gives you a Festival Gift and 3 Snowflake Tokens.','loot');holly(name,n);save();};});}
function shop(kind,name,greet){const haggle=sk('haggle')*.03;const price=id=>Math.round(ITEMS[id].price*(1-haggle));const sell=it=>Math.floor(ITEMS[it.id].price*(ITEMS[it.id].t==='etc'||ITEMS[it.id].t==='card'?1:.5)*(1+haggle)*(ITEMS[it.id].t==='etc'?1:.5));
  const tab=G.shopTab||'buy';
  win('npc',name,`<p class="say">${greet}</p><div class="tabs"><button class="tab ${tab==='buy'?'on':''}" data-t="buy">Buy</button><button class="tab ${tab==='sell'?'on':''}" data-t="sell">Sell</button></div>
    <div class="list">${tab==='buy'?D.SHOPS[kind].map(id=>`<div class="row item">${ic(id)}<span>${ITEMS[id].n}${ITEMS[id].cards?` [${ITEMS[id].cards}]`:''}<small>${E(ITEMS[id].d)}${ITEMS[id].jobs&&ITEMS[id].jobs!=='all'?' · '+ITEMS[id].jobs.map(j=>JOBS[j].n).join('/'):''}</small></span><b>${fmt(price(id))}g</b><button class="tiny" data-buy="${id}">Buy</button>${ITEMS[id].t==='use'?`<button class="tiny" data-buy10="${id}">×10</button>`:''}</div>`).join('')
      :P.inv.map((it,i)=>`<div class="row item">${ic(it.id)}<span>${E(itemName(it))}</span><b>${fmt(sell(it))}g${it.n>1?' ea':''}</b><button class="tiny" data-sell="${i}">Sell</button>${it.n>1?`<button class="tiny" data-sellall="${i}">All</button>`:''}</div>`).join('')||'<p class="hint">Nothing to sell.</p>'}</div><p class="hint">You have <b>${fmt(P.zeny)} g</b>.${haggle?` Haggle: ${Math.round(haggle*100)}% better prices.`:''}</p>`,
    el=>{el.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{G.shopTab=b.dataset.t;shop(kind,name,greet);});
      const buy=(id,n)=>{const c=price(id)*n;if(P.zeny<c){chat('Not enough gold.','bad');sfx('bad');return;}if(weight()+ITEMS[id].w*n>ST.maxW){chat('Too heavy to carry.','bad');return;}P.zeny-=c;if(ITEMS[id].t==='equip')for(let i=0;i<n;i++)addItem(mkItem(id));else addItem(mkItem(id,n));sfx('coin');chat(`Bought ${ITEMS[id].n}${n>1?' ×'+n:''} for ${fmt(c)}g.`,'loot');shop(kind,name,greet);};
      el.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy,1));el.querySelectorAll('[data-buy10]').forEach(b=>b.onclick=()=>buy(b.dataset.buy10,10));
      const doSell=(i,all)=>{const it=P.inv[i];const n=all?(it.n||1):1;P.zeny+=sell(it)*n;removeItem(i,n);sfx('coin');shop(kind,name,greet);renderHud();};
      el.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>doSell(+b.dataset.sell,false));el.querySelectorAll('[data-sellall]').forEach(b=>b.onclick=()=>doSell(+b.dataset.sellall,true));});}
function storage(name){if(!G.storageOpen){if(P.zeny<40){win('npc',name,'<p class="say">“Storage costs 40 gold to open, dear.”</p>');return;}P.zeny-=40;G.storageOpen=true;sfx('coin');}
  win('npc',name+' — Storage',`<div class="cols"><div><h4>Your bag</h4><div class="list">${P.inv.map((it,i)=>`<button class="row item" data-in="${i}">${ic(it.id)}<span>${E(itemName(it))}</span><b>${it.n?'×'+it.n:''}</b></button>`).join('')}</div></div>
    <div><h4>Storage (${P.storage.length}/100)</h4><div class="list">${P.storage.map((it,i)=>`<button class="row item" data-out="${i}">${ic(it.id)}<span>${E(itemName(it))}</span><b>${it.n?'×'+it.n:''}</b></button>`).join('')||'<p class="hint">Empty.</p>'}</div></div></div><p class="hint">Tap an item to move it. Storage is shared by your characters on this device.</p>`,
    el=>{el.querySelectorAll('[data-in]').forEach(b=>b.onclick=()=>{const it=P.inv.splice(+b.dataset.in,1)[0];const ex=it.n&&P.storage.find(x=>x.id===it.id&&x.n);if(ex)ex.n+=it.n;else P.storage.push(it);storage(name);renderHud();});
      el.querySelectorAll('[data-out]').forEach(b=>b.onclick=()=>{const it=P.storage.splice(+b.dataset.out,1)[0];addItem(it);storage(name);});el.querySelector('.x').addEventListener('click',()=>{G.storageOpen=false;});});}
function refiner(name){const cands=[];for(const sl in P.equip)cands.push({it:P.equip[sl],sl});P.inv.forEach(it=>{if(ITEMS[it.id].t==='equip')cands.push({it});});
  win('npc',name,`<p class="say">“Bring me gear and the right stone and I'll make it stronger. Up to +4 is safe. Past that… well. Steel has a temper.”</p>
    <div class="list">${cands.map((c,k)=>{const d=ITEMS[c.it.id];const ore=d.slot==='weapon'?'brightstone':'duskstone';const lv=c.it.refine||0;const rate=lv>=10?0:D.REFINE_RATE[lv];const have=(P.inv.find(x=>x.id===ore)||{n:0}).n;const fee=d.slot==='weapon'?100:200;
      return `<div class="row item">${ic(c.it.id)}<span>${E(itemName(c.it))}${c.sl?' <small>(equipped)</small>':''}<small>${lv>=10?'Already +10!':`Needs 1 ${ITEMS[ore].n} (you have ${have}) + ${fee}g · success ${Math.round(rate*100)}%${rate<1?' · <b class="bad">fail = item breaks</b>':''}`}</small></span><button class="tiny" data-k="${k}" ${lv<10&&have>0&&P.zeny>=fee?'':'disabled'}>Refine</button></div>`;}).join('')||'<p class="hint">You have no equipment.</p>'}</div>
    <p class="hint">Brightstone (weapons) and Duskstone (armour) drop from monsters, or buy them below.</p><div class="row gap"><button class="b" id="buyore">Buy stones</button></div>`,
    el=>{el.querySelector('#buyore').onclick=()=>shop('refine',name,'“Fresh from the mines.”');el.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const c=cands[+b.dataset.k];const d=ITEMS[c.it.id];const ore=d.slot==='weapon'?'brightstone':'duskstone';const lv=c.it.refine||0;
      if(lv>=4&&!confirm(`+${lv+1} has a ${Math.round(D.REFINE_RATE[lv]*100)}% chance. If it fails, ${d.n} breaks forever. Try?`))return;
      const oi=P.inv.findIndex(x=>x.id===ore);removeItem(oi);P.zeny-=d.slot==='weapon'?100:200;bubble(G.npcs.find(x=>x.npc.id==='refine'),'*clang* *clang*',1500);
      setTimeout(()=>{if(Math.random()<D.REFINE_RATE[lv]){c.it.refine=lv+1;sfx('refineOk');banner('SUCCESS!',`${itemName(c.it)}`);chat(`Refine success! ${itemName(c.it)}`,'loot');}
        else{sfx('refineFail');banner('FAILED…',`${d.n} shattered.`);chat(`Refine failed. ${d.n} broke.`,'bad');if(c.sl)delete P.equip[c.sl];else{const i=P.inv.indexOf(c.it);if(i>=0)P.inv.splice(i,1);}}
        refresh();refiner(name);save();},900);});});}

/* ---------------- boss timer ---------------- */
function bossTick(){const B=MAPS[G.map].boss;if(!B||G.boss.alive||G.t<G.boss.next)return;G.boss.alive=true;const k=spawnMob(B.k,B.x,B.z);k.range=8;sfx('boss');const BN=MONSTERS[B.k].n;banner('WARNING',`${BN} has appeared!`);chat(`[Boss] ${BN} has appeared in ${MAPS[G.map].n}!`,'mvp');music('boss');}

/* ---------------- festival visuals ---------------- */
let SNOW=null;function addSnow(){if(SNOW)return;const n=MOBILE?700:1400;const g=new THREE.BufferGeometry();const p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=rand(-30,30);p[i*3+1]=rand(0,24);p[i*3+2]=rand(-30,30);}g.setAttribute('position',new THREE.BufferAttribute(p,3));
  SNOW=new THREE.Points(g,new THREE.PointsMaterial({map:glowTex(),color:0xffffff,size:.35,transparent:true,depthWrite:false,opacity:.9}));SNOW.frustumCulled=false;scene.add(SNOW);}
function removeSnow(){if(SNOW){scene.remove(SNOW);SNOW=null;}}
function snowTick(dt){if(!SNOW||!me)return;const a=SNOW.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)-dt*(2+(i%5)*.4);let x=a.getX(i)+Math.sin(G.t+i)*dt*.6;if(y<0){y=24;x=rand(-30,30);a.setZ(i,rand(-30,30));}a.setY(i,y);a.setX(i,x);}a.needsUpdate=true;SNOW.position.set(me.pos.x,0,me.pos.z);}
function festivalTree(root,x,z,parts){const src=parts.tree_single_B||parts.tree_single_A;if(!src)return;const t=src.clone(true);t.position.set(x,0,z);t.scale.setScalar(9);root.add(t);G.world.colliders.push({x,z,r:2.6});
  const cols=[0xff5a5a,0xffd36a,0x6ad8ff,0x9af07a,0xff8ad8];for(let i=0;i<34;i++){const h=1.5+i/34*8.5,r=(1-i/34)*3.4+.4,a=i*2.4;const s=gsprite(cols[i%5],.8);s.position.set(x+Math.cos(a)*r,h,z+Math.sin(a)*r);root.add(s);}
  const star=gsprite(0xfff2a0,2.4);star.position.set(x,11,z);root.add(star);}
/* ---------------- loop ---------------- */
const clock=new THREE.Clock();let hudT=0,mmT=0;
function updateWorld(dt){G.t+=dt;if(G.state!=='play')return;
  // player
  if(!me.dead){if(G.cast){G.cast.t+=dt;$('#castbar i').style.width=(G.cast.t/G.cast.dur*100)+'%';if(G.cast.t>=G.cast.dur){const c=G.cast;G.cast=null;$('#castbar').hidden=true;if(c.tgt&&c.tgt.dead){chat('Target lost.','sys');}else fireSkill(c.id,c.lv,c.tgt);}}
    else if(G.act&&G.act.t==='skill'){const a=G.act,S=SKILLS[a.id];if(a.u.dead)G.act=null;else if(dist(me,a.u)>(S.range||2)+.4*a.u.actor.scale)walkTo(a.u.pos,dt);else{G.act={t:'attack',u:a.u};useSkill(a.id,a.u);}}
    else if(G.act&&G.act.t==='talk'){if(dist(me,G.act.u)>2.6)walkTo(G.act.u.pos,dt);else{const n=G.act.u;G.act=null;me.setAnim('idle');talk(n);}}
    else if(G.act&&G.act.t==='pick'){const d=G.act.d;if(!G.drops.includes(d))G.act=null;else if(Math.hypot(d.pos.x-me.pos.x,d.pos.z-me.pos.z)>.9)walkTo(d.pos,dt);else{G.act=null;pickUp(d);me.setAnim('idle');}}
    else if(G.act&&G.act.t==='portal'){if(walkTo(G.act.p.obj.position,dt)||Math.hypot(G.act.p.x-me.pos.x,G.act.p.z-me.pos.z)<1.5){const p=G.act.p;G.act=null;enterMap(p.to,p.tx,p.tz);return;}}
    else if(G.move){if(walkTo(G.move,dt)){G.move=null;if(!me.lock)me.setAnim('idle');}}
    else if(!me.lock&&!G.act&&!G.sitting)me.setAnim('idle');
    autoAttack(dt);
    for(const p of G.world.portals)if(!G.act&&Math.hypot(p.x-me.pos.x,p.z-me.pos.z)<1.3){enterMap(p.to,p.tx,p.tz);return;}
    if(G.autoLoot)for(const d of [...G.drops])if(G.t-d.t>.4&&Math.hypot(d.pos.x-me.pos.x,d.pos.z-me.pos.z)<1.1)pickUp(d);
    // natural regen (faster when sitting, none above 50% weight)
    const heavy=weight()>=ST.maxW*.5;G.regenT+=dt;G.spT+=dt;const sit=G.sitting?2:1;
    if(!heavy&&G.regenT>=6/sit){G.regenT=0;const v=Math.max(1,Math.floor(ST.mhp/200+ST.s.vit/5))*(1+sk('iron_skin')*.2);if(P.hp<ST.mhp){P.hp=Math.min(ST.mhp,P.hp+v);}}
    if(!heavy&&G.spT>=8/sit){G.spT=0;const v=Math.max(1,Math.floor(ST.msp/100+ST.s.int/6))+sk('mana_flow')*3;P.sp=Math.min(ST.msp,P.sp+v);}
    for(const k in G.buffs)if(G.buffs[k].until<G.t){delete G.buffs[k];chat(`${{blessing:'Blessing',swift:'Swift Prayer',quick:'Quick Step'}[k]} wore off.`,'sys');refresh();}}
  me.update(dt);for(const n of G.npcs)n.update(dt);for(const m of G.mobs){mobAI(m,dt);m.update(dt);}
  bossTick();if(G.tring&&G.target){G.tring.position.set(G.target.pos.x,.06,G.target.pos.z);G.tring.scale.setScalar(G.target.actor.scale);}
  for(const p of G.world.portals){p.ring.rotation.z+=dt*1.5;}if(clickMark&&clickMark.visible){clickMark.userData.t-=dt;clickMark.material.opacity=Math.max(0,clickMark.userData.t);if(clickMark.userData.t<=0)clickMark.visible=false;}
  fxUpdate(dt);snowTick(dt);}
function tick(){requestAnimationFrame(tick);const dt=Math.min(.1,clock.getDelta());updateWorld(dt);
  if(me&&G.world){const c=G.cam,t=me.pos;const off=new THREE.Vector3(Math.sin(c.yaw)*Math.cos(c.pitch),Math.sin(c.pitch),Math.cos(c.yaw)*Math.cos(c.pitch)).multiplyScalar(c.dist);
    camera.position.lerp(t.clone().add(off),1-Math.pow(.001,dt));camera.lookAt(t.x,t.y+1,t.z);sun.position.set(t.x+30,60,t.z+20);sun.target.position.copy(t);}
  renderer.render(scene,camera);if(G.state==='play'){labels();hudT+=dt;if(hudT>.15){hudT=0;renderHud();}mmT+=dt;if(mmT>.25){mmT=0;minimap();}}}
function minimap(){const cv=$('#minimap'),g=cv.getContext('2d'),W=cv.width,S=G.world.size;g.fillStyle=G.map==='town'?'#8a9a6a':'#6a9a4a';g.fillRect(0,0,W,W);const k=W/S;const X=x=>(x+S/2)*k;
  g.fillStyle='rgba(60,50,40,.55)';for(const c of G.world.colliders){if(c.r>1.5){g.beginPath();g.arc(X(c.x),X(c.z),Math.max(1.2,c.r*k),0,7);g.fill();}}
  for(const p of G.world.portals){g.fillStyle='#8ad8ff';g.beginPath();g.arc(X(p.x),X(p.z),3.5,0,7);g.fill();}
  for(const n of G.npcs){g.fillStyle='#9af07a';g.fillRect(X(n.pos.x)-1.5,X(n.pos.z)-1.5,3,3);}
  for(const m of G.mobs)if(!m.dead){g.fillStyle=m.boss?'#ff3a3a':m.hostile?'#ff8a4a':'#f8e0a0';g.beginPath();g.arc(X(m.pos.x),X(m.pos.z),m.boss?4:1.6,0,7);g.fill();}
  g.save();g.translate(X(me.pos.x),X(me.pos.z));g.rotate(-me.face+Math.PI);g.fillStyle='#fff';g.beginPath();g.moveTo(0,-5);g.lineTo(3.5,4);g.lineTo(-3.5,4);g.closePath();g.fill();g.restore();
  $('#coords').textContent=`${Math.round(me.pos.x)}, ${Math.round(me.pos.z)}`;}

/* ---------------- character creation & boot ---------------- */
const CC={style:0,hair:HAIRS[0],eye:'#3a5a9a'};
function ccPreview(){const c={job:'novice',style:CC.style,hair:CC.hair,eye:CC.eye,weapon:'dagger'};const sh=heroSheet(c);const cv=$('#ccprev'),g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);
  const dir=Math.floor(G.t*.8)%4;const f=Math.floor(G.t*2)%2;g.imageSmoothingEnabled=true;g.drawImage(sh.tex.image,f*96,dir*128,96,128,0,0,cv.width,cv.height);}
function setupCC(){$('#ccstyles').innerHTML=[0,1,2,3].map(i=>`<button class="sw ${i===CC.style?'on':''}" data-s="${i}">${['Spiky','Bob','Twin tails','Ponytail'][i]}</button>`).join('');
  $('#cchairs').innerHTML=HAIRS.map(h=>`<button class="dot ${h===CC.hair?'on':''}" data-h="${h}" style="background:${h}" aria-label="Hair colour"></button>`).join('');
  $('#cceyes').innerHTML=['#3a5a9a','#3a8a4a','#8a3a3a','#6a4a2a','#7a3aa8','#2a2a2a'].map(h=>`<button class="dot ${h===CC.eye?'on':''}" data-e="${h}" style="background:${h}" aria-label="Eye colour"></button>`).join('');
  $('#ccstyles').onclick=e=>{const b=e.target.closest('[data-s]');if(b){CC.style=+b.dataset.s;setupCC();}};$('#cchairs').onclick=e=>{const b=e.target.closest('[data-h]');if(b){CC.hair=b.dataset.h;setupCC();}};$('#cceyes').onclick=e=>{const b=e.target.closest('[data-e]');if(b){CC.eye=b.dataset.e;setupCC();}};}
async function startPlay(){$('#title').hidden=true;$('#hud').hidden=false;me=new Unit(heroSheet(lookCfg()),1,ANIMS);me._look=JSON.stringify(lookCfg());$('#bport').src=heroPortrait(lookCfg());refresh();if(P.hp<=1){P.hp=ST.mhp;P.sp=ST.msp;}
  await enterMap(P.map||'town',P.x,P.z);chat('Welcome to Eternal Realms Online!','sys');if(P.baseLv===1&&P.baseExp===0){chat('Tip: tap the ground to walk. Go east through the gate to Greenmarch Meadows and tap a Jellop to attack.','sys');chat('Press the Stat button to spend your status points.','sys');}}
(async()=>{try{await loadWorldParts();$('#loading').hidden=true;const saved=load();
    if(saved){P=saved;$('#title').hidden=false;$('#cc').hidden=true;$('#cont').hidden=false;$('#contname').textContent=`${saved.name} · ${JOBS[saved.job].n} · Base Lv ${saved.baseLv} / Job Lv ${saved.jobLv}`;$('#contport').src=heroPortrait({job:saved.job,style:saved.look.style,hair:saved.look.hair,eye:saved.look.eye});}
    else{$('#title').hidden=false;$('#cont').hidden=true;}
    setupCC();G.state='title';music('title');(function pv(){if(G.state==='title'){ccPreview();G.t+=1/60;requestAnimationFrame(pv);}})();
  }catch(e){console.error(e);$('#ldtxt').textContent='Could not load: '+e.message;}})();
$('#contbtn').onclick=()=>{unlock();startPlay();};$('#newbtn').onclick=()=>{$('#cont').hidden=true;$('#cc').hidden=false;};
$('#ccgo').onclick=()=>{unlock();const name=($('#ccname').value||'').trim().slice(0,16);if(name.length<2){$('#ccname').focus();return;}P=newChar(name,{style:CC.style,hair:CC.hair,eye:CC.eye});
  P.equip.weapon=P.inv.shift();P.equip.armor=P.inv.shift();startPlay();};
tick();
window.__api={useSkill,onTap,enterMap,gainExp,addItem,mkItem,refresh,talk:(id)=>talk(G.npcs.find(n=>n.npc.id===id)),get P(){return P;},get ST(){return ST;},me:()=>me,sim:s=>{for(let t=0;t<s;t+=.05)updateWorld(.05);}};
