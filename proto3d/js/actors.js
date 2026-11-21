// Model loading and the Actor class (any animated character: hero, NPC, monster).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const ASSETS={chars:{},clips:{},parts:{},skelW:{}};
export async function loadAssets(heroModels,onProgress){const L=new GLTFLoader();const jobs=[];let done=0;
  const files=[['anims','assets/anims.glb'],['world','assets/world.glb'],['skelw','assets/skel_weapons.glb'],
    ...[...new Set([...heroModels,'Skeleton_Minion','Skeleton_Warrior','Skeleton_Rogue','Skeleton_Mage'])].map(n=>['c:'+n,`assets/chars/${n}.glb`])];
  for(const [k,url] of files)jobs.push(L.loadAsync(url).then(g=>{done++;onProgress&&onProgress(done/files.length,k);return [k,g];}));
  for(const [k,g] of await Promise.all(jobs)){
    if(k==='anims')for(const c of g.animations)ASSETS.clips[c.name]=c;
    else if(k==='world')for(const c of g.scene.children)ASSETS.parts[c.name]=c;
    else if(k==='skelw')for(const c of g.scene.children)ASSETS.skelW[c.name]=c;
    else ASSETS.chars[k.slice(2)]=g.scene;}
  return ASSETS;}

const tmpV=new THREE.Vector3();
export class Actor{
  constructor(scene,model,{show=null,weapon=null,offhand=null,scale=1,tint=null,shadows=true}={}){
    this.root=new THREE.Group();this.model=SkeletonUtils.clone(ASSETS.chars[model]);this.model.scale.setScalar(scale);this.root.add(this.model);this.scale=scale;
    this.model.traverse(o=>{if(o.isMesh||o.isSkinnedMesh){o.castShadow=shadows;o.frustumCulled=false;
        if(show&&o.name&&/(Sword|Shield|Axe|Staff|Wand|Spellbook|Crossbow|Knife|Throwable|Mug|Helmet|Hat|Cape|Hooded)/.test(o.name)&&!show.includes(o.name))o.visible=false;
        if(tint){o.material=o.material.clone();o.material.color.multiply(new THREE.Color(tint));}}});
    const hand=n=>{let h=null;this.model.traverse(o=>{if(o.name===n)h=o;});return h;};this.handR=hand('handslot.r');this.handL=hand('handslot.l');
    if(weapon&&ASSETS.skelW[weapon]&&this.handR){const w=ASSETS.skelW[weapon].clone(true);w.traverse(o=>{if(o.isMesh)o.castShadow=shadows;});this.handR.add(w);}
    if(offhand&&ASSETS.skelW[offhand]&&this.handL){const w=ASSETS.skelW[offhand].clone(true);w.traverse(o=>{if(o.isMesh)o.castShadow=shadows;});this.handL.add(w);}
    this.mixer=new THREE.AnimationMixer(this.model);this.actions={};this.cur=null;this.lock=0;this.onceCb=null;
    this.mixer.addEventListener('finished',e=>{if(e.action===this.onceAction){this.lock=0;const cb=this.onceCb;this.onceCb=null;this.onceAction=null;cb&&cb();}});
    scene.add(this.root);this.pos=this.root.position;this.face=0;this.dead=false;}
  act(name){if(!this.actions[name]){const c=ASSETS.clips[name];if(!c)return null;this.actions[name]=this.mixer.clipAction(c);}return this.actions[name];}
  loop(name,fade=.18,speed=1){if(this.lock||this.dead)return;const a=this.act(name);if(!a||this.cur===a){if(a)a.timeScale=speed;return;}a.reset();a.setLoop(THREE.LoopRepeat);a.timeScale=speed;a.enabled=true;a.play();
    if(this.cur)this.cur.crossFadeTo(a,fade,false);else a.fadeIn(fade);this.cur=a;}
  once(name,{speed=1,fade=.1,hold=false,cb=null}={}){const a=this.act(name);if(!a){cb&&cb();return 0;}a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=hold;a.timeScale=speed;a.enabled=true;a.play();
    if(this.cur&&this.cur!==a)this.cur.crossFadeTo(a,fade,false);this.cur=a;this.lock=1;this.onceAction=a;this.onceCb=cb;return a.getClip().duration/speed;}
  release(){this.lock=0;this.onceAction=null;this.onceCb=null;}
  update(dt){this.mixer.update(dt);const r=this.root.rotation;let d=this.face-r.y;d=Math.atan2(Math.sin(d),Math.cos(d));r.y+=d*Math.min(1,dt*12);}
  lookAt(x,z){this.face=Math.atan2(x-this.pos.x,z-this.pos.z);}
  headPos(out=tmpV){return out.set(this.pos.x,this.pos.y+2.55*this.scale,this.pos.z);}
  dispose(scene){scene.remove(this.root);}
}
