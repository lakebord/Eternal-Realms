// Eternal Realms 3D — Whisperwood prototype. Third-person action-MMO controls with tab-target combat.
import * as THREE from 'three';
import {createEngine,buildWorld,height,collide,MAP,MOBILE,pathDist} from './engine.js';
import {loadAssets,Actor,ASSETS} from './actors.js';
import * as FX from './fx.js';
import {AUD,music,sfx,unlock} from './audio.js';
import {CLASSES,SKILLS,MONSTERS,XP_NEXT,LEVEL_CAP} from './data.js';

const $=s=>document.querySelector(s);const rand=(a,b)=>a+Math.random()*(b-a);const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const HI=!MOBILE||localStorage.getItem('er3d_hi')==='1';
if(MOBILE)document.body.classList.add('touch');
const E=createEngine($('#view'),HI&&localStorage.getItem('er3d_hi')!=='0');const {scene,camera,renderer,sun}=E;FX.fxInit(scene,camera);
const G={state:'loading',cls:'knight',name:'Wanderer',t:0,enemies:[],labels:new Map(),target:null,cam:{yaw:2.4,pitch:.38,dist:MOBILE?10.5:9},
  keys:{},joy:{x:0,y:0,id:null},cds:{},gcd:0,cast:null,buffs:{},potions:SKILLS.potion.charges,auto:0,combatT:99,quest:{step:0,kills:0,need:8},gold:0,hero:null,npc:null,boss:null,lineup:[]};
window.__G=G;

/* ---------------- loading ---------------- */
(async()=>{try{
  await loadAssets(['Knight','Barbarian','Mage','Rogue_Hooded'],(p,k)=>{$('#ldbar').style.width=Math.round(p*100)+'%';$('#ldtxt').textContent=p<1?'Summoning the world… '+Math.round(p*100)+'%':'Raising the dead…';});
  G.world=buildWorld(scene,ASSETS.parts,renderer.shadowMap.enabled);G.colliders=G.world.colliders;buildMinimapBase();
  setupTitle();$('#loading').hidden=true;$('#title').hidden=false;G.state='title';music('title');
}catch(e){console.error(e);$('#ldtxt').textContent='Could not load: '+e.message;}})();

/* ---------------- title: heroes line up by the campfire ---------------- */
function setupTitle(){const C=MAP.camp;const order=['knight','barbarian','mage','rogue'];
  order.forEach((k,i)=>{const cl=CLASSES[k];const a=new Actor(scene,cl.model,{show:cl.show,shadows:renderer.shadowMap.enabled});const sp=innerWidth<innerHeight?1.9:2.8;a.pos.set(C.x+sp*1.5-i*sp,0,C.y-3.5-Math.abs(i-1.5)*.6);a.pos.y=height(a.pos.x,a.pos.z);a.face=Math.PI+(i-1.5)*.12;a.root.rotation.y=a.face;
    a.loop(k==='barbarian'?'2H_Melee_Idle':'Idle');G.lineup.push({k,a});});
  const box=$('#classes');box.innerHTML=order.map(k=>{const c=CLASSES[k];return `<button class="cls ${k===G.cls?'on':''}" data-c="${k}"><span class="ic">${c.ic}</span><b>${c.n}</b><small>${c.d}</small></button>`;}).join('');
  box.onclick=e=>{const b=e.target.closest('.cls');if(!b)return;G.cls=b.dataset.c;box.querySelectorAll('.cls').forEach(x=>x.classList.toggle('on',x===b));const l=G.lineup.find(x=>x.k===G.cls);if(l)l.a.once('Cheer',{cb:()=>l.a.loop(G.cls==='barbarian'?'2H_Melee_Idle':'Idle')});sfx('click');};
  try{const n=localStorage.getItem('er3d_name');if(n)$('#hname').value=n;const c=localStorage.getItem('er3d_cls');if(c&&CLASSES[c]){G.cls=c;box.querySelectorAll('.cls').forEach(x=>x.classList.toggle('on',x.dataset.c===c));}}catch(e){}
  $('#start').onclick=startGame;}
function startGame(){unlock();G.name=($('#hname').value||'Wanderer').trim().slice(0,16)||'Wanderer';try{localStorage.setItem('er3d_name',G.name);localStorage.setItem('er3d_cls',G.cls);}catch(e){}
  for(const l of G.lineup)l.a.dispose(scene);G.lineup=[];$('#title').hidden=true;$('#hud').hidden=false;
  const cl=CLASSES[G.cls];const P=G.hero=new Actor(scene,cl.model,{show:cl.show,shadows:renderer.shadowMap.enabled});P.isHero=true;P.cls=cl;P.lv=1;P.xp=0;stats(P);P.hp=P.mhp;P.res=P.mres;
  respawnAt(P);spawnNPC();for(const s of MAP.spawns)for(let i=0;i<s.k.length;i++)spawnEnemy(s.k[i],s.x+Math.cos(i*2.1)*2.5,s.z+Math.sin(i*2.1)*2.5);
  buildSkillBar();$('#pport').textContent=cl.ic;$('#pname').textContent=G.name;G.state='play';music('wild');updateQuest();
  toast('Whisperwood','');setTimeout(()=>toast('Talk to Captain Aldric at the camp','small'),1600);}

/* ---------------- stats ---------------- */
function stats(P){const c=P.cls,l=P.lv;P.mhp=Math.round(c.base.hp+c.grow.hp*(l-1));P.mres=c.base.res+(c.res==='mp'?(l-1)*12:0);P.atk=c.base.atk+c.grow.atk*(l-1);P.def=c.base.def+c.grow.def*(l-1);P.crit=c.base.crit;P.speed=c.base.speed;}
function mstats(m,lv){const d=m.def_;m.lv=lv;m.mhp=Math.round(d.hp*(1+.2*(lv-d.lv[0])));m.hp=m.mhp;m.atk=d.atk*(1+.12*(lv-d.lv[0]));m.def=d.def*(1+.1*(lv-d.lv[0]));}

/* ---------------- spawning ---------------- */
function spawnNPC(){const C=MAP.camp;const n=new Actor(scene,'Knight',{show:['1H_Sword','Badge_Shield','Knight_Cape'],tint:0xd8c8a8,shadows:renderer.shadowMap.enabled});n.pos.set(C.x+3,0,C.y-2.5);n.pos.y=height(n.pos.x,n.pos.z);n.face=-2.2;n.root.rotation.y=n.face;n.loop('Idle');
  n.npc=true;n.name='Captain Aldric';G.npc=n;G.colliders.push({x:n.pos.x,z:n.pos.z,r:.8});}
function spawnEnemy(kind,x,z,{boss=false,awaken=false}={}){const d=MONSTERS[kind];const m=new Actor(scene,d.model,{weapon:d.wpn,offhand:d.off,scale:d.scale||1,shadows:renderer.shadowMap.enabled&&!MOBILE||boss});
  m.def_=d;m.kind=kind;m.enemy=true;m.name=d.n;m.home=new THREE.Vector3(x,0,z);m.pos.set(x,height(x,z),z);m.face=rand(0,6.28);m.root.rotation.y=m.face;mstats(m,Math.round(rand(d.lv[0],d.lv[1])));
  m.ai='idle';m.aiT=rand(1,4);m.atkT=rand(.5,1.5);m.stun=0;m.slow=0;m.dots=[];m.boss=!!d.boss;m.speed=d.speed;
  if(boss){m.eyes=new THREE.PointLight(0xff2a2a,6,6,2);m.eyes.position.y=4.2;m.root.add(m.eyes);m.bt={quake:8,summon:[.5]};}
  if(awaken){m.ai='awaken';m.once('Skeletons_Awaken_Standing',{cb:()=>{m.ai='chase';}});}else m.loop(kind==='boss'?'Idle_Combat':'Idle',.2,rand(.85,1.1));
  G.enemies.push(m);return m;}
function respawnAt(P){const C=MAP.camp;P.pos.set(C.x-1,0,C.y-6);P.pos.y=height(P.pos.x,P.pos.z);P.face=Math.PI*.75;P.root.rotation.y=P.face;P.dead=false;P.release();P.loop(idleAnim());G.cam.yaw=P.face+Math.PI;}
const idleAnim=()=>G.cls==='barbarian'?'2H_Melee_Idle':'Idle';

/* ---------------- combat core ---------------- */
function dmgCalc(src,tgt,mult,el,{critBonus=0}={}){let d=src.atk*mult*rand(.9,1.1);if(G.buffs.frenzy&&src===G.hero)d*=1.35;d*=40/(40+tgt.def);
  let crit=Math.random()<(src.crit||.05)+critBonus;if(crit)d*=1.75;const weak=tgt.def_&&tgt.def_.weak&&tgt.def_.weak.includes(el);if(weak)d*=1.5;
  return {d:Math.max(1,Math.round(d)),crit,weak};}
function applyDamage(src,tgt,mult,el,opts={}){if(!tgt||tgt.dead)return;const r=dmgCalc(src,tgt,mult,el,opts);
  if(tgt.def_&&tgt.def_.block&&Math.random()<tgt.def_.block&&!opts.unblockable){r.d=Math.round(r.d*.3);FX.floatText(tgt.headPos(),'Blocked','miss');sfx('block');}
  tgt.hp-=r.d;tgt.lastHit=G.t;const hp=tgt.headPos().clone();FX.floatText(hp,r.d+(r.crit?'!':''),(tgt.isHero?'me ':'')+(r.crit?'crit':r.weak?'weak':''));if(r.weak&&!tgt.isHero&&Math.random()<.35)FX.floatText(hp.clone().add(new THREE.Vector3(0,.6,0)),'Weak!','weak');
  sfx(r.crit?'crit':'hit');if(!tgt.isHero)sfx('bone');FX.sparks(tgt.pos,{col:FX.EL_COL[el]||0xffffff,n:r.crit?20:10,y:1.3*tgt.scale});
  if(tgt.isHero){G.combatT=0;(G.dlog=G.dlog||[]).push(src.name+':'+r.d);if(G.dlog.length>60)G.dlog.shift();if(tgt.hp<=0)heroDie();else if(!tgt.lock&&!G.cast&&Math.random()<.3)tgt.once('Hit_A',{speed:1.4,cb:()=>tgt.loop(idleAnim())});return r;}
  aggro(tgt);if(tgt.hp<=0)enemyDie(tgt,src);else if(!tgt.lock&&!tgt.boss&&Math.random()<.4){tgt.once(Math.random()<.5?'Hit_A':'Hit_B',{speed:1.3,cb:()=>{}});}
  if(opts.stun&&!tgt.boss){tgt.stun=opts.stun;FX.floatText(tgt.headPos().clone().add(new THREE.Vector3(0,.5,0)),'Stunned','miss');}
  if(opts.slow){tgt.slow=opts.slow;}if(opts.dot)tgt.dots.push({t:opts.dot.dur,tick:1,mult:opts.dot.mult,el,src});return r;}
function aggro(m){if(m.dead||m.ai==='awaken')return;if(m.ai!=='chase'&&m.ai!=='attack'){m.ai='chase';for(const o of G.enemies)if(o!==m&&!o.dead&&!o.boss&&o.ai==='idle'&&o.pos.distanceTo(m.pos)<8)o.ai='chase';}}
function enemyDie(m,src){m.dead=true;m.hp=0;m.release();m.once(m.boss?'Death_A':(Math.random()<.5?'Death_C_Skeletons':'Death_A'),{hold:true,fade:.08});sfx('death');m.deadT=0;
  if(G.target===m)setTarget(null);const xp=Math.round(m.def_.xp*(1+.15*(m.lv-1)));gainXp(xp);FX.floatText(G.hero.headPos().clone().add(new THREE.Vector3(0,.4,0)),'+'+xp+' XP','heal');
  const gold=Math.round(rand(3,8)*m.lv*(m.boss?20:1));G.gold+=gold;setTimeout(()=>{FX.floatText(m.pos.clone().add(new THREE.Vector3(0,1,0)),'+'+gold+'g','crit');sfx('loot');},400);
  if(Math.random()<.18&&G.potions<9){G.potions++;setTimeout(()=>toast('Found a Healing Draught','small'),500);}
  if(m.boss){G.boss=null;music('wild');bossBar(null);questEvent('boss');}else if(G.quest.step===1)questEvent('kill');}
function heroDie(){const P=G.hero;P.dead=true;P.hp=0;P.release();P.once('Death_A',{hold:true});cancelCast();sfx('death');G.state='dead';setTimeout(()=>{$('#dead').hidden=false;},1400);}
$('#respawn').onclick=()=>{const P=G.hero;$('#dead').hidden=true;P.hp=P.mhp;P.res=P.mres;respawnAt(P);setTarget(null);G.state='play';
  for(const m of G.enemies)if(!m.dead&&(m.ai==='chase'||m.ai==='attack')){m.ai='return';}if(G.boss&&!G.boss.dead){G.boss.hp=G.boss.mhp;G.boss.ai='idle';G.boss.pos.copy(G.boss.home);bossBar(null);music('wild');}};
function gainXp(x){const P=G.hero;if(P.lv>=LEVEL_CAP)return;P.xp+=x;while(P.lv<LEVEL_CAP&&P.xp>=XP_NEXT(P.lv)){P.xp-=XP_NEXT(P.lv);P.lv++;stats(P);P.hp=P.mhp;P.res=P.mres;
  toast('Level '+P.lv+'!','');sfx('level');FX.pillar(P.pos,{col:0xffd36a,r:1.3,h:7,dur:1.2});FX.ring(P.pos,{col:0xffd36a,r1:5,dur:.8});}}

/* ---------------- targeting ---------------- */
function setTarget(m){if(G.target===m)return;G.target=m;G.approach=null;if(m&&!m.dead)sfx('click');if(!G.tring){G.tring=new THREE.Mesh(new THREE.RingGeometry(.9,1.15,40),new THREE.MeshBasicMaterial({color:0xff4a3a,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));G.tring.rotation.x=-Math.PI/2;scene.add(G.tring);}
  G.tring.visible=!!m;}
function nearestEnemy(range=20,front=false){const P=G.hero;let best=null,bd=1e9;const fx=Math.sin(P.face),fz=Math.cos(P.face);
  for(const m of G.enemies){if(m.dead||m.ai==='awaken')continue;const dx=m.pos.x-P.pos.x,dz=m.pos.z-P.pos.z,d=Math.hypot(dx,dz);if(d>range)continue;let score=d;if(front&&(dx*fx+dz*fz)/d<0)score+=12;if(m===G.target)score+=6;if(score<bd){bd=score;best=m;}}return best;}
function cycleTarget(){const P=G.hero;const list=G.enemies.filter(m=>!m.dead&&m.ai!=='awaken'&&m.pos.distanceTo(P.pos)<25).sort((a,b)=>a.pos.distanceTo(P.pos)-b.pos.distanceTo(P.pos));
  if(!list.length){setTarget(null);return;}const i=list.indexOf(G.target);setTarget(list[(i+1)%list.length]);}
const pv=new THREE.Vector3();
function pickAt(sx,sy){let best=null,bd=MOBILE?70:55;const pick=a=>{for(const yo of [.6,1.4,2.1]){pv.set(a.pos.x,a.pos.y+yo*a.scale,a.pos.z).project(camera);if(pv.z>1)continue;const x=(pv.x+1)/2*innerWidth,y=(1-pv.y)/2*innerHeight;const d=Math.hypot(x-sx,y-sy);if(d<bd){bd=d;best=a;}}};
  for(const m of G.enemies)if(!m.dead&&m.pos.distanceTo(G.hero.pos)<45)pick(m);if(G.npc)pick(G.npc);
  if(best===G.npc){if(G.npc.pos.distanceTo(G.hero.pos)<6)talk();else toast('Walk closer to talk','small');return;}if(best)setTarget(best);}

/* ---------------- skills ---------------- */
function buildSkillBar(){const cl=CLASSES[G.cls];const ids=[...cl.skills];const box=$('#skills');
  // ring layout around the main button (bottom-right)
  const pos=[[76,92],[94,22],[150,-10],[18,138]];const keys=['1','2','3','4'];
  box.innerHTML=`<button class="sk main" data-s="auto" aria-label="Attack">${cl.ic}<span class="key">F</span><span class="cd"></span></button>`+ids.map((id,i)=>`<button class="sk" data-s="${id}" style="right:${pos[i][0]}px;bottom:${pos[i][1]}px" aria-label="${SKILLS[id].n}" title="${SKILLS[id].n}">${SKILLS[id].ic}<span class="cd"></span><span class="cdt"></span><span class="key">${keys[i]}</span></button>`).join('')+
    `<button class="sk" data-s="potion" style="right:150px;bottom:66px;width:50px;height:50px;font-size:1.3rem" aria-label="Potion">${SKILLS.potion.ic}<span class="cd"></span><span class="cdt"></span><span class="ch" id="potc"></span><span class="key">Q</span></button>`+
    `<button class="sk" data-s="tab" style="right:4px;bottom:${MOBILE?96:98}px;width:42px;height:42px;font-size:1rem" aria-label="Next target">🎯<span class="key">Tab</span></button>`;
  box.querySelectorAll('.sk').forEach(b=>{b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();b.classList.add('press');const s=b.dataset.s;if(s==='tab')cycleTarget();else if(s==='auto')engage();else useSkill(s);});
    b.addEventListener('pointerup',()=>b.classList.remove('press'));b.addEventListener('pointerleave',()=>b.classList.remove('press'));});}
function engage(){if(G.state!=='play')return;if(!G.target||G.target.dead){const t=nearestEnemy(20,true);if(!t){toast('No enemies nearby','small');return;}setTarget(t);}G.autoOn=true;
  const P=G.hero,d=G.target.pos.distanceTo(P.pos),r=CLASSES[G.cls].auto.range;if(d>r+.3){if(d<40)G.approach={id:null,range:r};else toast('Too far away','small');}}
function canUse(id,quiet){const s=SKILLS[id],P=G.hero;if(G.state!=='play'||P.dead)return false;if(G.cast)return false;
  if((G.cds[id]||0)>0)return false;if(id!=='potion'&&G.gcd>0)return false;if(id==='potion'&&G.potions<=0){if(!quiet)toast('No potions left','small');return false;}
  if(P.res<s.cost){if(!quiet)toast('Not enough '+(CLASSES[G.cls].res==='mp'?'mana':'stamina'),'small');return false;}return true;}
function useSkill(id){const s=SKILLS[id],P=G.hero;if(!canUse(id))return;
  if(['melee','proj','aoe_target'].includes(s.t)){if(!G.target||G.target.dead){const t=nearestEnemy(s.range+2,true);if(!t){toast('No target','small');return;}setTarget(t);}
    const d=G.target.pos.distanceTo(P.pos);if(d>s.range+.6){if(d<40){G.approach={id,range:s.range};G.autoOn=true;}else toast('Too far away','small');return;}G.autoOn=true;}
  if(s.cast){G.cast={id,t:0,dur:s.cast,start:P.pos.clone()};P.release();P.loop(s.castAnim||'Spellcasting');sfx('cast');if(G.target)P.lookAt(G.target.pos.x,G.target.pos.z);$('#castbar').hidden=false;$('#pcastt').textContent=s.n;return;}
  execSkill(id);}
function cancelCast(msg){if(!G.cast)return;G.cast=null;$('#castbar').hidden=true;if(msg)toast(msg,'small');G.hero.loop(idleAnim());}
function execSkill(id){const s=SKILLS[id],P=G.hero,T=G.target;P.res-=s.cost;G.cds[id]=s.cd;if(id!=='potion')G.gcd=1;G.combatT=Math.min(G.combatT,1);
  if(T&&s.t!=='self'&&s.t!=='aoe_self')P.lookAt(T.pos.x,T.pos.z);P.release();const dur=P.once(s.anim,{speed:s.t==='self'?1.2:1.15,cb:()=>P.loop(idleAnim())});const at=Math.min(.32,dur*.45)*1000;
  const col=FX.EL_COL[s.el]||0xffffff;
  if(s.blink&&T){const from=P.pos.clone();const back=new THREE.Vector3(Math.sin(T.face),0,Math.cos(T.face)).multiplyScalar(-1.6);P.pos.copy(T.pos).add(back);P.pos.y=height(P.pos.x,P.pos.z);P.lookAt(T.pos.x,T.pos.z);P.root.rotation.y=P.face;FX.blink(from,P.pos.clone());sfx('shadow');}
  setTimeout(()=>{if(P.dead)return;switch(s.t){
    case 'melee':if(!T||T.dead)break;sfx('swing');FX.slash(P.pos,P.face,{col,r:2.3,tilt:s.fx==='slam'?1.2:0,dir:Math.random()<.5?1:-1});
      if(s.fx==='bash'){FX.ring(T.pos,{col:0xffe27a,r1:2.5,dur:.4,y:1.2});}if(s.fx==='execute'){FX.slash(P.pos,P.face,{col:0xff3a3a,r:2.8,width:1.3,tilt:.9});}if(s.fx==='slam'){FX.ring(T.pos,{col:0xd8c8a0,r1:3,dur:.5});}
      if(s.fx==='poison'){FX.sparks(T.pos,{col:0x8fe05a,n:18,y:1.2,speed:3});}
      for(let h=0;h<(s.hits||1);h++)setTimeout(()=>{if(!T.dead)applyDamage(P,T,s.mult/(s.hits||1),s.el,{critBonus:s.critBonus||0,stun:s.stun,dot:s.dot});if(h>0)FX.slash(P.pos,P.face,{col,r:2.1,dir:-1});},h*140);break;
    case 'proj':if(!T||T.dead)break;sfx('fire');FX.projectile(P.handR?P.handR.getWorldPosition(new THREE.Vector3()):P.headPos().clone(),()=>T.headPos().clone().add(new THREE.Vector3(0,-.9*T.scale,0)),{col,speed:24,size:1.3,onHit:()=>{applyDamage(P,T,s.mult,s.el);}});break;
    case 'aoe_target':if(!T)break;{const p=T.pos.clone();FX.telegraph(p,s.radius,.55,0xff8a3a);FX.meteor(p,{onHit:()=>{sfx('boom');for(const m of G.enemies)if(!m.dead&&m.pos.distanceTo(p)<s.radius+.5*m.scale)applyDamage(P,m,s.mult,s.el);}});}break;
    case 'aoe_self':{sfx(s.el==='frost'?'frost':'swing');if(s.fx==='nova')FX.nova(P.pos,{r:s.radius});else if(s.fx==='whirl')FX.whirl(P,{r:s.radius*.85});else if(s.fx==='knives'){for(let i=0;i<12;i++)FX.slash(P.pos,i/12*6.28,{col:0xd8e0f0,r:s.radius*.6,width:.25,dur:.3,y:1.1});FX.ring(P.pos,{col:0xd8e0f0,r1:s.radius,dur:.4,y:1});}
      else FX.slash(P.pos,P.face,{col,r:s.radius*.8,width:1.4,dur:.3});
      for(let h=0;h<(s.hits||1);h++)setTimeout(()=>{for(const m of G.enemies){if(m.dead)continue;const dx=m.pos.x-P.pos.x,dz=m.pos.z-P.pos.z,d=Math.hypot(dx,dz);if(d>s.radius+.6*m.scale)continue;
        if(s.arc){const a=Math.atan2(dx,dz)-P.face;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))>s.arc/2)continue;}applyDamage(P,m,s.mult/(s.hits||1),s.el,{slow:s.slow});if(s.slow)m.slow=s.slow;}},h*260);break;}
    case 'self':if(s.heal){const h=Math.round(P.mhp*s.heal);P.hp=Math.min(P.mhp,P.hp+h);FX.floatText(P.headPos(),'+'+h,'heal');FX.pillar(P.pos,{col:0x9af07a});sfx('heal');if(id==='potion')G.potions--;}
      if(s.buff){G.buffs[s.buff.k]=s.buff.dur;FX.aura(P,0xff5a2a,s.buff.dur);FX.ring(P.pos,{col:0xff7a3a,r1:5,dur:.6});sfx('roar');toast(s.n+'!','');}break;}},at);}
function autoAttack(dt){const P=G.hero,T=G.target,a=CLASSES[G.cls].auto;G.auto-=dt*(G.buffs.frenzy?1.25:1);if(!G.autoOn||!T||T.dead||P.dead||G.cast||P.lock)return;
  const d=T.pos.distanceTo(P.pos);if(d>a.range+.4*T.scale||G.auto>0||G.moving&&a.proj)return;G.auto=a.cd;P.lookAt(T.pos.x,T.pos.z);P.once(a.anim[Math.floor(Math.random()*a.anim.length)],{speed:1.2,cb:()=>P.loop(idleAnim())});G.combatT=0;
  setTimeout(()=>{if(T.dead||P.dead)return;if(a.proj){FX.projectile(P.handR?P.handR.getWorldPosition(new THREE.Vector3()):P.headPos().clone(),()=>T.headPos().clone().add(new THREE.Vector3(0,-.9*T.scale,0)),{col:FX.EL_COL[a.el],speed:22,size:.8,onHit:()=>applyDamage(P,T,a.mult,a.el)});sfx('cast');}
    else if(T.pos.distanceTo(P.pos)<a.range+1){sfx('swing');FX.slash(P.pos,P.face,{col:0xfff0d8,r:2,dir:Math.random()<.5?1:-1,width:.6});applyDamage(P,T,a.mult,a.el);}},280);}

/* ---------------- monsters ---------------- */
function updateEnemy(m,dt){const P=G.hero;if(m.dead){m.deadT+=dt;if(m.deadT>5&&!m.sunk){m.root.position.y-=dt*.6;if(m.deadT>8){m.sunk=true;m.root.visible=false;}}
    if(!m.boss&&m.deadT>30){const i=G.enemies.indexOf(m);m.dispose(scene);G.enemies.splice(i,1);spawnEnemy(m.kind,m.home.x,m.home.z,{awaken:true});}return;}
  for(let i=m.dots.length-1;i>=0;i--){const d=m.dots[i];d.t-=dt;d.tick-=dt;if(d.tick<=0){d.tick=1;applyDamage(d.src,m,d.mult,d.el);if(m.dead)return;}if(d.t<=0)m.dots.splice(i,1);}
  if(m.stun>0){m.stun-=dt;m.loop('Idle',.2,.3);return;}if(m.slow>0)m.slow-=dt;if(m.ai==='awaken')return;
  const dist=m.pos.distanceTo(P.pos),D=m.def_;const spd=m.speed*(m.slow>0?.5:1)*(m.enraged?1.3:1);
  if(m.ai==='idle'){m.aiT-=dt;if(!P.dead&&dist<(m.boss?MAP.arenaR:11)&&(!m.boss||G.quest.step>=3)){m.ai='chase';if(m.boss)bossEngage(m);}
    else if(m.aiT<=0){m.aiT=rand(3,7);m.wander=new THREE.Vector3(m.home.x+rand(-5,5),0,m.home.z+rand(-5,5));}
    if(m.wander&&!m.lock){const dx=m.wander.x-m.pos.x,dz=m.wander.z-m.pos.z,d=Math.hypot(dx,dz);if(d>.4){m.pos.x+=dx/d*dt*1.4;m.pos.z+=dz/d*dt*1.4;m.lookAt(m.wander.x,m.wander.z);m.loop('Walking_A');}else{m.wander=null;m.loop('Idle');}}}
  else if(m.ai==='return'){const dx=m.home.x-m.pos.x,dz=m.home.z-m.pos.z,d=Math.hypot(dx,dz);if(d<1){m.ai='idle';m.hp=m.mhp;m.loop('Idle');}else{m.pos.x+=dx/d*dt*spd*1.3;m.pos.z+=dz/d*dt*spd*1.3;m.lookAt(m.home.x,m.home.z);m.loop('Running_A');m.hp=Math.min(m.mhp,m.hp+m.mhp*dt*.2);}}
  else{if(P.dead||m.home.distanceTo(new THREE.Vector3(m.pos.x,0,m.pos.z))>(m.boss?60:26)){m.ai='return';if(G.target===m)setTarget(null);return;}
    if(m.boss)bossLogic(m,dt,dist);if(m.casting){m.casting.t+=dt;if(m.casting.t>=m.casting.dur){const c=m.casting;m.casting=null;c.done();}return;}
    const want=D.range*(D.proj?.8:.85)+(m.boss?.6:0);m.atkT-=dt;
    if(dist>want&&!m.lock){const dx=P.pos.x-m.pos.x,dz=P.pos.z-m.pos.z;m.pos.x+=dx/dist*dt*spd;m.pos.z+=dz/dist*dt*spd;m.lookAt(P.pos.x,P.pos.z);m.loop('Running_A',.15,m.boss?.9:1);}
    else if(!m.lock){m.lookAt(P.pos.x,P.pos.z);m.loop(m.boss?'Idle_Combat':'Idle_Combat');if(m.atkT<=0&&dist<=D.range+.6)enemyAttack(m);}}
  // keep monsters apart and on the ground
  for(const o of G.enemies)if(o!==m&&!o.dead){const dx=m.pos.x-o.pos.x,dz=m.pos.z-o.pos.z,d=Math.hypot(dx,dz),r=.9*(m.scale+o.scale);if(d<r&&d>1e-3){m.pos.x+=dx/d*(r-d)*.5;m.pos.z+=dz/d*(r-d)*.5;}}
  collide(m.pos,.5*m.scale,G.colliders);m.pos.y=height(m.pos.x,m.pos.z);}
function enemyAttack(m){const P=G.hero,D=m.def_;m.atkT=D.cd*rand(.9,1.2);
  const fire=()=>{const anim=D.anim[Math.floor(Math.random()*D.anim.length)];const dur=m.once(anim,{speed:m.boss?1:1.15,cb:()=>{}});
    setTimeout(()=>{if(m.dead||P.dead)return;if(D.proj){FX.projectile(m.headPos().clone().add(new THREE.Vector3(0,-1,0)),()=>P.headPos().clone().add(new THREE.Vector3(0,-1,0)),{col:FX.EL_COL[D.proj]||0xd8c8a0,speed:D.proj==='bolt'?30:16,size:D.proj==='bolt'?.5:1.1,trail:D.proj!=='bolt',onHit:()=>{if(!P.dead&&P.pos.distanceTo(m.pos)<D.range+8)applyDamage(m,P,1,D.proj==='shadow'?'shadow':'phys');}});sfx(D.proj==='shadow'?'shadow':'swing');}
      else if(m.pos.distanceTo(P.pos)<D.range+1.2){sfx('swing');applyDamage(m,P,m.boss?1:1,'phys');if(m.boss)FX.ring(P.pos,{col:0xff4a3a,r1:2.5,dur:.35,y:.5});}},Math.min(450,dur*480));};
  if(D.cast){m.casting={t:0,dur:D.cast,done:fire,n:'Shadow Bolt'};m.loop('Spellcasting');}else fire();}
function bossEngage(m){G.boss=m;music('boss');toast('Kazrath, the Bone Warlord!','bad');bossBar(m);}
function bossLogic(m,dt,dist){const b=m.bt;b.quake-=dt;if(m.hp<m.mhp*.25&&!m.enraged){m.enraged=true;toast('Kazrath is enraged!','bad');FX.aura(m,0xff2a2a,60);sfx('roar');}
  for(let i=0;i<b.summon.length;i++){if(m.hp<m.mhp*b.summon[i]){b.summon.splice(i,1);sfx('roar');m.once('Spellcast_Summon',{cb:()=>{}});toast('The dead rise to defend him!','bad');
      for(let k=0;k<2;k++){const a=rand(0,6.28);const e=spawnEnemy('minion',m.pos.x+Math.cos(a)*5,m.pos.z+Math.sin(a)*5,{awaken:true});e.home.copy(m.home);e.def_={...e.def_};e.minion=true;}break;}}
  if(b.quake<=0&&!m.lock&&!m.casting){b.quake=m.enraged?7:10;const p=m.pos.clone();FX.telegraph(p,7.5,2.0);toast('Get out of the red circle!','bad');
    m.casting={t:0,dur:2.0,n:'Bone Quake',done:()=>{m.once('2H_Melee_Attack_Spin',{cb:()=>{}});FX.whirl(m,{col:0xff6a4a,r:7});setTimeout(()=>{sfx('boom');FX.ring(p,{col:0xff4a2a,r1:8,w:.7,dur:.6});FX.sparks(p,{col:0xc8b898,n:30,y:.4,speed:9});
      const w=$('#view');w.animate([{transform:'translate(6px,-4px)'},{transform:'translate(-6px,4px)'},{transform:'none'}],{duration:300});if(!G.hero.dead&&G.hero.pos.distanceTo(p)<7.6)applyDamage(m,G.hero,2.0,'phys',{unblockable:true});},300);}};m.loop('2H_Melee_Idle');}}

/* ---------------- NPC + quest ---------------- */
const QUEST_TXT=[
  ['Find Captain Aldric','Talk to the captain at the camp.'],
  ['The Restless Dead','Destroy skeletons in Whisperwood'],
  ['Report to Aldric','Return to the camp.'],
  ['The Bone Warlord','Defeat Kazrath in the ruins to the south-east.'],
  ['Return in triumph','Tell Captain Aldric the news.'],
  ['Whisperwood is safe… for now','Prototype complete. Keep hunting if you like!']];
function updateQuest(){const q=G.quest;const [t,d]=QUEST_TXT[q.step];$('#quest').innerHTML=`<b>${t}</b>${d}${q.step===1?` <span class="${q.kills>=q.need?'done':''}">(${Math.min(q.kills,q.need)}/${q.need})</span>`:''}`;}
function questEvent(e){const q=G.quest;if(e==='kill'&&q.step===1){q.kills++;if(q.kills>=q.need){q.step=2;toast('Objective complete — return to Aldric','');}}if(e==='boss'&&q.step===3){q.step=4;toast('Kazrath falls!','');setTimeout(()=>toast('Return to Captain Aldric','small'),1800);}updateQuest();}
function talk(){const q=G.quest;const lines={0:['Captain Aldric','“Stranger! The dead walk in Whisperwood. Old Kazrath’s warband has crawled out of the ruins and my scouts won’t come back. Thin their numbers — eight of the bone-things — and I’ll know you’re worth trusting.”','Accept'],
    1:['Captain Aldric',`“Still ${q.need-q.kills} more out there. Mind the necromancers — fire and holy light break their bones fastest.”`,'Leave'],
    2:['Captain Aldric','“Well fought. But they’ll keep rising as long as Kazrath stands. He waits in the ruins to the south-east, where the purple flames burn. End him.”','I will'],
    3:['Captain Aldric','“The ruins lie south-east along the old road. Watch for his quake — when the ground glows red, move!”','Leave'],
    4:['Captain Aldric',`“Kazrath… destroyed? Then Whisperwood breathes again. Take this, ${G.name}. The Realms will hear your name.”`,'Claim reward'],
    5:['Captain Aldric','“Rest by the fire, hero. More of the Realms await.”','Leave']}[q.step];
  const el=$('#talk');el.innerHTML=`<div class="panel"><h3>${lines[0]}</h3><p>${lines[1]}</p><div class="row gap"><button class="b gilt" id="talkok">${lines[2]}</button></div></div>`;el.hidden=false;sfx('click');
  $('#talkok').onclick=()=>{el.hidden=true;if(q.step===0){q.step=1;toast('Quest accepted: The Restless Dead','');}else if(q.step===2){q.step=3;gainXp(150);toast('Quest: The Bone Warlord  (+150 XP)','');}
    else if(q.step===4){q.step=5;G.gold+=250;gainXp(XP_NEXT(G.hero.lv));G.potions=Math.max(G.potions,5);toast('Reward: 250 gold, a level and potions','');setTimeout(()=>toast('Prototype complete — thanks for playing!','small'),2200);}updateQuest();};}

/* ---------------- input ---------------- */
const keymap={KeyW:'f',ArrowUp:'f',KeyS:'b',ArrowDown:'b',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r'};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(keymap[e.code]){G.keys[keymap[e.code]]=1;e.preventDefault();}
  if(G.state!=='play')return;const cl=CLASSES[G.cls];
  if(e.code==='Tab'){e.preventDefault();cycleTarget();}else if(e.code==='KeyF')engage();else if(e.code==='KeyQ')useSkill('potion');else if(e.code==='KeyE'){if(G.npc&&G.npc.pos.distanceTo(G.hero.pos)<6)talk();}
  else if(e.code==='Escape'){if(!$('#talk').hidden)$('#talk').hidden=true;else openMenu();}else{const n=+e.key;if(n>=1&&n<=4)useSkill(cl.skills[n-1]);}});
addEventListener('keyup',e=>{if(keymap[e.code])G.keys[keymap[e.code]]=0;});
const view=$('#view');const ptrs=new Map();let pinch=0;
view.addEventListener('pointerdown',e=>{unlock();if(G.state==='title'){return;}const joyZone=MOBILE&&e.clientX<innerWidth*.45&&e.clientY>innerHeight*.4;
  if(joyZone&&G.joy.id===null){G.joy.id=e.pointerId;G.joy.ox=e.clientX;G.joy.oy=e.clientY;const j=$('#joy');j.style.left=(e.clientX-65)+'px';j.style.top=(e.clientY-65)+'px';j.style.bottom='auto';view.setPointerCapture(e.pointerId);return;}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:0});view.setPointerCapture(e.pointerId);if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}});
view.addEventListener('pointermove',e=>{if(e.pointerId===G.joy.id){const dx=e.clientX-G.joy.ox,dy=e.clientY-G.joy.oy,L=Math.hypot(dx,dy),m=48;const k=L>m?m/L:1;G.joy.x=dx*k/m;G.joy.y=dy*k/m;$('#joyknob').style.transform=`translate(${dx*k}px,${dy*k}px)`;return;}
  const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;p.moved+=Math.abs(dx)+Math.abs(dy);
  if(ptrs.size>=2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)G.cam.dist=clamp(G.cam.dist*pinch/d,4,18);pinch=d;return;}
  if(e.pointerType==='mouse'&&!(e.buttons&1)&&!(e.buttons&2))return;G.cam.yaw-=dx*.006;G.cam.pitch=clamp(G.cam.pitch+dy*.004,-.15,1.2);});
const endPtr=e=>{if(e.pointerId===G.joy.id){G.joy.id=null;G.joy.x=G.joy.y=0;$('#joyknob').style.transform='';const j=$('#joy');j.style.left='';j.style.top='';j.style.bottom='';return;}
  const p=ptrs.get(e.pointerId);if(!p)return;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=0;if(p.moved<10&&G.state==='play'&&e.type==='pointerup')pickAt(e.clientX,e.clientY);};
view.addEventListener('pointerup',endPtr);view.addEventListener('pointercancel',endPtr);view.addEventListener('contextmenu',e=>e.preventDefault());
view.addEventListener('wheel',e=>{G.cam.dist=clamp(G.cam.dist*(1+Math.sign(e.deltaY)*.1),4,18);e.preventDefault();},{passive:false});
function openMenu(){$('#menu').hidden=false;}$('#menubtn').onclick=openMenu;$('#closemenu').onclick=()=>{$('#menu').hidden=true;};
$('#optmusic').onchange=e=>{AUD.music=e.target.checked;if(AUD.music)unlock();};$('#optsfx').onchange=e=>{AUD.sfx=e.target.checked;};
$('#optshadow').checked=renderer.shadowMap.enabled;$('#optshadow').onchange=e=>{try{localStorage.setItem('er3d_hi',e.target.checked?'1':'0');}catch(x){}toast('Takes effect after reloading the page','small');};

/* ---------------- HUD ---------------- */
function toast(t,cls){const d=document.createElement('div');d.className=cls||'';d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),3000);}
function bossBar(m){const f=$('#tframe');f.classList.toggle('boss',!!m);}
function setBar(i,s,v,max,txt){$(i).style.width=clamp(v/max*100,0,100)+'%';if(s)$(s).textContent=txt??`${Math.max(0,Math.ceil(v))} / ${Math.round(max)}`;}
function hud(){const P=G.hero;if(!P)return;setBar('#php','#phpt',P.hp,P.mhp);$('#pres').parentElement.classList.toggle('sp',CLASSES[G.cls].res==='sp');setBar('#pres','#prest',P.res,P.mres);$('#plvl').textContent='Lv '+P.lv;
  $('#pxp').style.width=(P.lv>=LEVEL_CAP?100:P.xp/XP_NEXT(P.lv)*100)+'%';
  const T=G.target&&!G.target.dead?G.target:(G.boss&&!G.boss.dead?G.boss:null);$('#tframe').hidden=!T;
  if(T){$('#tname').textContent=T.name;$('#tlvl').textContent='Lv '+T.lv+(T.boss?' · Boss':'');setBar('#thp','#thpt',T.hp,T.mhp);$('#tcastw').hidden=!T.casting;if(T.casting){setBar('#tcast','#tcastt',T.casting.t,T.casting.dur,T.casting.n);}$('#tframe').classList.toggle('boss',!!T.boss);}
  if(G.cast)setBar('#pcast',null,G.cast.t,G.cast.dur);
  document.querySelectorAll('#skills .sk').forEach(b=>{const id=b.dataset.s;if(id==='tab'||id==='auto')return;const s=SKILLS[id];const cd=G.cds[id]||0;const g=id!=='potion'?G.gcd:0;const rem=Math.max(cd,g);const tot=cd>=g?(s.cd||1):1;
    b.querySelector('.cd').style.setProperty('--p',(rem>0?rem/tot:0)+'turn');b.querySelector('.cdt').textContent=cd>1?Math.ceil(cd):'';b.classList.toggle('na',P.res<s.cost||(id==='potion'&&G.potions<=0));});
  const pc=$('#potc');if(pc)pc.textContent=G.potions;}
let mapBase=null;function buildMinimapBase(){const S=384,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');const im=g.createImageData(S,S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const wx=(x/S-.5)*MAP.size,wz=(y/S-.5)*MAP.size,h=height(wx,wz),pd=pathDist(wx,wz);let r=34+h*5,gg=52+h*4,b=30;if(pd<3){r=96;gg=76;b=50;}
    const da=Math.hypot(wx-MAP.arena.x,wz-MAP.arena.y);if(da<MAP.arenaR){r=80;gg=78;b=84;}const i=(y*S+x)*4;im.data[i]=r;im.data[i+1]=gg;im.data[i+2]=b;im.data[i+3]=255;}
  g.putImageData(im,0,0);mapBase=cv;}
function minimap(){const cv=$('#minimap'),g=cv.getContext('2d'),W=cv.width,P=G.hero;if(!P||!mapBase)return;const scale=mapBase.width/MAP.size,zoom=2.2;
  g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,W);g.translate(W/2,W/2);g.rotate(G.cam.yaw-Math.PI);const k=W/60;  // 60 world units across
  g.scale(k/scale,k/scale);g.translate(-(P.pos.x+MAP.size/2)*scale,-(P.pos.z+MAP.size/2)*scale);g.drawImage(mapBase,0,0);g.restore();
  const toMap=(x,z)=>{const dx=(x-P.pos.x)*k,dz=(z-P.pos.z)*k;const a=G.cam.yaw-Math.PI;return [W/2+dx*Math.cos(a)-dz*Math.sin(a),W/2+dx*Math.sin(a)+dz*Math.cos(a)];};
  for(const m of G.enemies){if(m.dead)continue;const [x,y]=toMap(m.pos.x,m.pos.z);if(Math.hypot(x-W/2,y-W/2)>W/2)continue;g.fillStyle=m.boss?'#ff3a3a':m===G.target?'#ffe08a':'#e05a4a';g.beginPath();g.arc(x,y,m.boss?4.5:2.6,0,7);g.fill();}
  const goal=G.quest.step===3?[MAP.arena.x,MAP.arena.y]:[0,2,4].includes(G.quest.step)&&G.npc?[G.npc.pos.x,G.npc.pos.z]:null;
  if(goal){let [x,y]=toMap(goal[0],goal[1]);const dx=x-W/2,dy=y-W/2,d=Math.hypot(dx,dy);if(d>W/2-8){x=W/2+dx/d*(W/2-8);y=W/2+dy/d*(W/2-8);}g.fillStyle='#e0b45e';g.font='bold 14px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(G.quest.step===3?'☠':'!',x,y);}
  g.save();g.translate(W/2,W/2);g.rotate(G.cam.yaw-Math.PI-P.root.rotation.y+Math.PI);g.fillStyle='#ffe9b8';g.beginPath();g.moveTo(0,-7);g.lineTo(5,6);g.lineTo(0,3);g.lineTo(-5,6);g.closePath();g.fill();g.restore();}
function labels(){const box=$('#labels');const seen=new Set();const P=G.hero;const list=[...G.enemies];if(G.npc)list.push(G.npc);
  for(const a of list){if(a.dead&&!(a===G.target))continue;const d=P?a.pos.distanceTo(P.pos):0;if(d>(a.boss?60:32)||!a.root.visible){continue;}
    pv.copy(a.headPos()).project(camera);if(pv.z>1)continue;seen.add(a);let el=G.labels.get(a);if(!el){el=document.createElement('div');el.className='plate'+(a.npc?' npc':'')+(a.boss?' boss':'');box.appendChild(el);G.labels.set(a,el);}
    const showBar=!a.npc&&(a.hp<a.mhp||a===G.target);const mark=a.npc&&[0,2,4].includes(G.quest.step)?`<div class="mark">${G.quest.step===0?'!':'?'}</div>`:'';
    const html=`${mark}<b>${a.name}</b>${a.npc?'':` <small>${a.lv}</small>`}${showBar?`<div class="mini"><i style="width:${clamp(a.hp/a.mhp*100,0,100)}%"></i></div>`:''}`;if(el._h!==html){el.innerHTML=html;el._h=html;}
    el.classList.toggle('tgt',a===G.target);el.style.left=((pv.x+1)/2*innerWidth)+'px';el.style.top=((1-pv.y)/2*innerHeight)+'px';el.style.opacity=d>24?.6:1;}
  for(const [a,el] of G.labels)if(!seen.has(a)){el.remove();G.labels.delete(a);}}

/* ---------------- main loop ---------------- */
function updateWorld(dt){G.t+=dt;
  const P=G.hero;
  if(G.state==='play'&&!P.dead){
    // movement relative to the camera
    let mx=(G.keys.r?1:0)-(G.keys.l?1:0)+G.joy.x,mz=(G.keys.b?1:0)-(G.keys.f?1:0)+G.joy.y;const ml=Math.hypot(mx,mz);G.moving=ml>.15;
    if(G.moving){G.approach=null;if(G.cast){const s=SKILLS[G.cast.id];cancelCast(s.n+' interrupted');}if(P.lock&&P.cur&&!/Hit|Death/.test(P.cur.getClip().name))P.release();
      const k=Math.min(1,ml);const sy=Math.sin(G.cam.yaw),cy=Math.cos(G.cam.yaw);const wx=(mx*cy+mz*sy)/ml,wz=(-mx*sy+mz*cy)/ml;const spd=P.speed*k*(G.buffs.frenzy?1.15:1);
      P.pos.x+=wx*spd*dt;P.pos.z+=wz*spd*dt;P.face=Math.atan2(wx,wz);P.loop(k>.55?'Running_A':'Walking_A',.15,k>.55?1:1.2);}
    else if(G.approach&&G.target&&!G.target.dead&&!G.cast){const T=G.target,dx=T.pos.x-P.pos.x,dz=T.pos.z-P.pos.z,d=Math.hypot(dx,dz);
      if(d<=G.approach.range+.3*T.scale){const id=G.approach.id;G.approach=null;if(id)useSkill(id);}
      else{if(P.lock)P.release();const spd=P.speed*(G.buffs.frenzy?1.15:1);P.pos.x+=dx/d*spd*dt;P.pos.z+=dz/d*spd*dt;P.face=Math.atan2(dx,dz);P.loop('Running_A',.15);}}
    else if(!P.lock&&!G.cast)P.loop(idleAnim());
    collide(P.pos,.55,G.colliders);P.pos.y=height(P.pos.x,P.pos.z);
    if(G.cast){G.cast.t+=dt;if(G.target&&!G.target.dead)P.lookAt(G.target.pos.x,G.target.pos.z);if(G.cast.t>=G.cast.dur){const id=G.cast.id;G.cast=null;$('#castbar').hidden=true;const s=SKILLS[id];
        if(['proj','aoe_target'].includes(s.t)&&(!G.target||G.target.dead||G.target.pos.distanceTo(P.pos)>s.range+1)){toast('Target lost','small');P.loop(idleAnim());}else execSkill(id);}}
    autoAttack(dt);
    // resources / timers
    G.gcd=Math.max(0,G.gcd-dt);for(const k in G.cds)G.cds[k]=Math.max(0,G.cds[k]-dt);for(const k in G.buffs){G.buffs[k]-=dt;if(G.buffs[k]<=0)delete G.buffs[k];}
    G.combatT+=dt;const inCombat=G.combatT<5;P.res=Math.min(P.mres,P.res+dt*(CLASSES[G.cls].res==='mp'?(inCombat?3:10):(inCombat?7:14)));if(!inCombat)P.hp=Math.min(P.mhp,P.hp+P.mhp*.03*dt);
    if(G.target&&G.target.dead)setTarget(null);if(G.target&&G.target.pos.distanceTo(P.pos)>45)setTarget(null);
    if(G.npc&&G.npc.pos.distanceTo(P.pos)<4.5&&!G.npcNear){G.npcNear=true;if([0,2,4].includes(G.quest.step))toast(MOBILE?'Tap the captain to talk':'Press E or click the captain to talk','small');}else if(G.npc&&G.npc.pos.distanceTo(P.pos)>6){G.npcNear=false;$('#talk').hidden=true;}
    // boss awakens when the hero reaches the ruins on the right step
    if(G.quest.step===3&&!G.bossSpawned&&P.pos.distanceTo(new THREE.Vector3(MAP.arena.x,P.pos.y,MAP.arena.y))<MAP.arenaR+4){G.bossSpawned=true;const b=spawnEnemy('boss',MAP.arena.x,MAP.arena.y,{boss:true,awaken:true});b.lookAt(P.pos.x,P.pos.z);setTimeout(()=>{b.ai='chase';bossEngage(b);},2600);}
  }
  P.update(dt);if(G.npc){G.npc.update(dt);if(G.npc.pos.distanceTo(P.pos)<7)G.npc.lookAt(P.pos.x,P.pos.z);}
  for(const m of [...G.enemies]){const d=m.pos.distanceTo(P.pos);if(G.state==='play')updateEnemy(m,dt);m.root.visible=!m.sunk&&d<70;if(d<45||m.boss)m.update(dt);else if(Math.random()<.2)m.update(dt*5);}
  if(G.tring&&G.target){G.tring.position.set(G.target.pos.x,G.target.pos.y+.08,G.target.pos.z);G.tring.scale.setScalar(G.target.scale);G.tring.material.opacity=.6+.25*Math.sin(G.t*6);}
}
const clock=new THREE.Clock();let titleT=0,hudT=0,frames=0,fpsT=0;
function tick(){requestAnimationFrame(tick);const dt=Math.min(.1,clock.getDelta());if(G.state!=='play')G.t+=dt;frames++;fpsT+=dt;if(fpsT>1){G.fps=frames/fpsT;frames=0;fpsT=0;}
  if(G.state==='loading'){return;}
  // fire flicker, drifting motes
  if(G.world){for(const f of G.world.fires){const fl=.85+Math.sin(G.t*13+f.scale)*.08+Math.random()*.1;f.flame.scale.set(2.2*f.scale*fl,2.8*f.scale*(.9+Math.random()*.2),1);if(f.L)f.L.intensity=f.base*fl;}
    G.world.motes.position.y=Math.sin(G.t*.4)*.6;G.world.motes.rotation.y=G.t*.01;}
  if(G.state==='title'){titleT+=dt;const C=MAP.camp;const a=Math.sin(titleT*.12)*.22;const hy=height(C.x,C.y-5);const port=innerWidth<innerHeight,dd=port?10.5:8;camera.position.set(C.x+Math.sin(a)*dd,hy+(port?4.6:3.4),C.y-4-Math.cos(a)*dd);camera.lookAt(C.x,hy+(port?-2.2:-.6),C.y-3);
    for(const l of G.lineup)l.a.update(dt);sun.position.set(C.x-60,40,C.y-35);sun.target.position.set(C.x,0,C.y);FX.fxUpdate(dt);renderer.render(scene,camera);return;}
  updateWorld(dt);const P=G.hero;
  // camera
  const tgt=new THREE.Vector3(P.pos.x,P.pos.y+1.9,P.pos.z);const c=G.cam;const off=new THREE.Vector3(Math.sin(c.yaw)*Math.cos(c.pitch),Math.sin(c.pitch),Math.cos(c.yaw)*Math.cos(c.pitch)).multiplyScalar(c.dist);
  // pull the camera in front of walls / big trees between it and the hero
  let dist=c.dist;{const ox=off.x/c.dist,oz=off.z/c.dist,hl=Math.hypot(ox,oz)||1;for(const cl of G.colliders){if(cl.r<.9)continue;const px=cl.x-tgt.x,pz=cl.z-tgt.z;const along=(px*ox+pz*oz)/(hl*hl);if(along<=0||along>dist)continue;
    const cx=ox*along-px,cz=oz*along-pz;if(Math.hypot(cx,cz)<cl.r*.9){const d0=Math.max(2.2,along*Math.hypot(ox,oz)-cl.r*.6);if(d0<dist)dist=d0;}}}
  off.multiplyScalar(dist/c.dist);
  const want=tgt.clone().add(off);const gh=height(want.x,want.z)+.6;if(want.y<gh)want.y=gh;camera.position.lerp(want,1-Math.pow(.0001,dt));camera.lookAt(tgt);
  sun.position.set(P.pos.x-60,P.pos.y+40,P.pos.z-35);sun.target.position.copy(P.pos);
  FX.fxUpdate(dt);renderer.render(scene,camera);FX.floatsUpdate();labels();hudT+=dt;if(hudT>.08){hudT=0;hud();minimap();}}
tick();
window.__api={useSkill,canUse,engage,cycleTarget,setTarget,talk,sim:(sec)=>{for(let t=0;t<sec;t+=.05){updateWorld(.05);FX.fxUpdate(.05);}}};
