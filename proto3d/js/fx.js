// Visual effects (slashes, projectiles, novas, meteors, heals, telegraphs) and floating combat text.
import * as THREE from 'three';
import {glowTex} from './engine.js';
export const EL_COL={phys:0xfff0d8,fire:0xff7a2a,frost:0x9fe2ff,arcane:0xb98aff,holy:0xfff2a0,shadow:0x9a5aff,poison:0x8fe05a,bolt:0xd8c8a0};
const live=[];let SCENE=null,CAM=null;
export function fxInit(scene,camera){SCENE=scene;CAM=camera;}
function add(obj,life,tick,done){SCENE.add(obj);live.push({obj,life,t:0,tick,done});}
export function fxUpdate(dt){for(let i=live.length-1;i>=0;i--){const f=live[i];f.t+=dt;const k=Math.min(1,f.t/f.life);try{f.tick&&f.tick(k,dt);}catch(e){}if(k>=1){SCENE.remove(f.obj);f.done&&f.done();disposeObj(f.obj);live.splice(i,1);}}}
function disposeObj(o){o.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material&&!c.material._keep)c.material.dispose();});}
const addMat=(c,o=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
const spriteMat=(c)=>new THREE.SpriteMaterial({map:glowTex(),color:c,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
// crescent slash arc in front of an actor
export function slash(pos,face,{col=0xffffff,r=2.2,y=1.3,tilt=0,width=.9,dur=.28,dir=1}={}){
  const g=new THREE.RingGeometry(r-width,r,32,1,-1.2,2.4);const m=new THREE.Mesh(g,addMat(col,.95));const grp=new THREE.Group();grp.add(m);
  grp.position.set(pos.x,pos.y+y,pos.z);grp.rotation.set(0,face,0);m.rotation.set(-Math.PI/2+tilt,0,dir>0?0:Math.PI);
  add(grp,dur,k=>{m.material.opacity=(1-k)*.95;m.rotation.z=(dir>0?-0.9:Math.PI+0.9)+k*1.8*dir;m.scale.setScalar(.85+k*.3);});}
export function ring(pos,{col=0xffffff,r0=.3,r1=4,y=.15,dur=.5,w=.35,op=.9}={}){const g=new THREE.RingGeometry(1-w/ Math.max(1,r1),1,48);const m=new THREE.Mesh(g,addMat(col,op));m.rotation.x=-Math.PI/2;m.position.set(pos.x,pos.y+y,pos.z);
  add(m,dur,k=>{const r=r0+(r1-r0)*(1-Math.pow(1-k,3));m.scale.setScalar(r);m.material.opacity=op*(1-k);});}
export function glow(pos,{col=0xffffff,s=2,y=1.2,dur=.35}={}){const sp=new THREE.Sprite(spriteMat(col));sp.position.set(pos.x,pos.y+y,pos.z);sp.scale.setScalar(s);
  add(sp,dur,k=>{sp.material.opacity=1-k;sp.scale.setScalar(s*(1+k*.6));});}
export function sparks(pos,{col=0xffe0a0,n=14,y=1.2,speed=6,dur=.55,size=.25,grav=9}={}){const g=new THREE.BufferGeometry();const p=new Float32Array(n*3),v=[];
  for(let i=0;i<n;i++){p[i*3]=pos.x;p[i*3+1]=pos.y+y;p[i*3+2]=pos.z;const a=Math.random()*6.28,e=Math.random()*1.2-.2;v[i]=[Math.cos(a)*Math.cos(e)*speed*(.4+Math.random()*.6),Math.sin(e)*speed*.8+2,Math.sin(a)*Math.cos(e)*speed*(.4+Math.random()*.6)];}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({map:glowTex(),color:col,size,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  add(pts,dur,(k,dt)=>{const a=g.attributes.position;for(let i=0;i<n;i++){v[i][1]-=grav*dt;a.array[i*3]+=v[i][0]*dt;a.array[i*3+1]+=v[i][1]*dt;a.array[i*3+2]+=v[i][2]*dt;}a.needsUpdate=true;pts.material.opacity=1-k;});}
export function pillar(pos,{col=0xb8f09a,r=1.1,h=6,dur=.9}={}){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24,1,true),addMat(col,.5));m.position.set(pos.x,pos.y+h/2,pos.z);
  add(m,dur,k=>{m.material.opacity=.55*Math.sin(k*Math.PI);m.scale.set(1-k*.4,1,1-k*.4);});
  sparks(pos,{col,n:18,y:.3,speed:2,grav:-3,dur:1,size:.3});}
// projectile flying from a to a moving target; calls hit() on arrival
export function projectile(from,getTo,{col=0xff7a2a,speed=22,size=1.1,trail=true,arc=0,onHit}={}){
  const g=new THREE.Group();const core=new THREE.Sprite(spriteMat(col));core.scale.setScalar(size);g.add(core);const inner=new THREE.Sprite(spriteMat(0xffffff));inner.scale.setScalar(size*.45);g.add(inner);
  let L=null;if(live.filter(f=>f.light).length<3){L=new THREE.PointLight(col,8,8,2);g.add(L);}
  g.position.copy(from);const start=from.clone();let travelled=0;const total=Math.max(.5,start.distanceTo(getTo()));
  const f={obj:g,life:5,t:0,light:!!L,tick:(k,dt)=>{const to=getTo();const d=to.clone().sub(g.position);const dist=d.length();const step=speed*dt;travelled+=step;
      if(dist<=step+.2){f.t=f.life;onHit&&onHit(g.position.clone());glow(to,{col,s:size*3,y:0,dur:.3});sparks(to,{col,n:12,y:0,speed:5});return;}
      g.position.add(d.multiplyScalar(step/dist));if(arc){g.position.y+=Math.sin(Math.min(1,travelled/total)*Math.PI)*arc*dt*3;}
      if(trail&&Math.random()<.8){const t=new THREE.Sprite(spriteMat(col));t.scale.setScalar(size*.6);t.position.copy(g.position);add(t,.3,kk=>{t.material.opacity=(1-kk)*.6;t.scale.setScalar(size*.6*(1-kk));});}}};
  SCENE.add(g);live.push(f);}
export function meteor(pos,{col=0xff6a2a,dur=.55,onHit}={}){const g=new THREE.Group();const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.9,0),new THREE.MeshStandardMaterial({color:0x3a2418,emissive:0xff4a10,emissiveIntensity:1.4,roughness:1}));g.add(rock);
  const fire=new THREE.Sprite(spriteMat(col));fire.scale.setScalar(4);g.add(fire);const from=new THREE.Vector3(pos.x+10,pos.y+26,pos.z-6);g.position.copy(from);
  add(g,dur,k=>{g.position.lerpVectors(from,pos,k*k);rock.rotation.x+=.2;rock.rotation.y+=.13;},()=>{onHit&&onHit();ring(pos,{col,r0:.5,r1:6,w:.6,dur:.6});ring(pos,{col:0xffd36a,r0:.5,r1:4.5,w:.3,dur:.45});glow(pos,{col,s:9,y:1,dur:.5});
    sparks(pos,{col:0xff9a4a,n:40,y:.5,speed:10,dur:.9,size:.35});sparks(pos,{col:0x5a4030,n:16,y:.3,speed:7,dur:.9,size:.4,grav:14});});}
export function nova(pos,{col=0x9fe2ff,r=6.5}={}){ring(pos,{col,r0:.5,r1:r,w:.5,dur:.6});ring(pos,{col:0xffffff,r0:.4,r1:r*.8,w:.2,dur:.45,y:.3});
  for(let i=0;i<10;i++){const a=i/10*6.28;const s=new THREE.Mesh(new THREE.ConeGeometry(.25,1.4,5),new THREE.MeshStandardMaterial({color:0xd8f4ff,emissive:0x6ac0ff,emissiveIntensity:.8,transparent:true}));
    const rr=r*.7;s.position.set(pos.x+Math.cos(a)*rr,pos.y+.3,pos.z+Math.sin(a)*rr);s.rotation.z=(Math.random()-.5)*.6;add(s,.9,k=>{s.scale.y=k<.2?k/.2:1;s.material.opacity=k>.7?(1-k)/.3:1;});}}
export function whirl(actor,{col=0xffffff,r=4.2,dur=.7}={}){const g=new THREE.RingGeometry(r-1,r,48,1,0,4);const m=new THREE.Mesh(g,addMat(col,.8));m.rotation.x=-Math.PI/2;const grp=new THREE.Group();grp.add(m);SCENE.add(grp);
  add(grp,dur,k=>{grp.position.set(actor.pos.x,actor.pos.y+1.1,actor.pos.z);m.rotation.z=k*14;m.material.opacity=.8*Math.sin(k*Math.PI);});}
export function telegraph(pos,r,dur,col=0xff2a2a){const m=new THREE.Mesh(new THREE.CircleGeometry(r,48),addMat(col,.25));m.rotation.x=-Math.PI/2;m.position.set(pos.x,pos.y+.12,pos.z);
  const edge=new THREE.Mesh(new THREE.RingGeometry(r-.25,r,48),addMat(col,.8));edge.rotation.x=-Math.PI/2;edge.position.set(pos.x,pos.y+.14,pos.z);SCENE.add(edge);
  const fill=new THREE.Mesh(new THREE.CircleGeometry(r,48),addMat(col,.35));fill.rotation.x=-Math.PI/2;fill.position.set(pos.x,pos.y+.13,pos.z);SCENE.add(fill);
  add(m,dur,k=>{fill.scale.setScalar(Math.max(.01,k));m.material.opacity=.15+.15*Math.sin(k*30);},()=>{SCENE.remove(edge);SCENE.remove(fill);disposeObj(edge);disposeObj(fill);});}
export function aura(actor,col,dur){const sp=new THREE.Sprite(spriteMat(col));sp.scale.set(3.2,4,1);SCENE.add(sp);add(sp,dur,k=>{sp.position.set(actor.pos.x,actor.pos.y+1.3,actor.pos.z);sp.material.opacity=.35+.15*Math.sin(k*40);});}
export function blink(from,to,col=0x9a5aff){for(const p of [from,to]){glow(p,{col,s:4,y:1.2,dur:.4});sparks(p,{col,n:16,y:1.2,speed:4,grav:0,dur:.5});}}
// floating numbers projected from 3D
const floats=[];const FL=()=>document.getElementById('floats');
export function floatText(pos3,txt,cls){const el=document.createElement('div');el.className='dmg '+(cls||'');el.textContent=txt;FL().appendChild(el);
  floats.push({el,p:pos3.clone().add(new THREE.Vector3((Math.random()-.5)*.8,0,(Math.random()-.5)*.8)),t:0});setTimeout(()=>{el.remove();const i=floats.findIndex(f=>f.el===el);if(i>=0)floats.splice(i,1);},1000);}
const pv=new THREE.Vector3();export function floatsUpdate(){for(const f of floats){pv.copy(f.p).project(CAM);if(pv.z>1){f.el.style.display='none';continue;}f.el.style.display='';f.el.style.left=((pv.x+1)/2*innerWidth)+'px';f.el.style.top=((1-pv.y)/2*innerHeight)+'px';}}
