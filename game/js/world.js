// Renderer, camera rig and the two maps (Valeria town, Greenmarch Meadows). Maps are flat (y=0) like classic 2.5D MMOs.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const MOBILE=matchMedia('(pointer:coarse)').matches||/Android|iPhone|iPad/i.test(navigator.userAgent);
export function createRenderer(el){const r=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio||1,MOBILE?1.6:2));r.setSize(innerWidth,innerHeight);
  r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.08;r.shadowMap.enabled=!MOBILE||localStorage.getItem('ero_shadow')==='1';r.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(r.domElement);
  const camera=new THREE.PerspectiveCamera(innerWidth<innerHeight?48:38,innerWidth/innerHeight,.5,400);
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?48:38;camera.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);});return {renderer:r,camera};}
let PARTS=null;export const DECO_NAMES=['oak','pine','snowpine','bush','flowers','grass','mushrooms','sign','lamp','stall','hay','crates','snowbush','festtree'];
export async function loadWorldParts(){if(PARTS)return PARTS;const L=new GLTFLoader(),TL=new THREE.TextureLoader();const g=await L.loadAsync('assets/world.glb');PARTS={};for(const c of g.scene.children)PARTS[c.name]=c;
  PARTS.__tex={};PARTS.__deco={};PARTS.__models={};const jobs=[];
  for(const k of ['grass','cobble','dirt','snow'])jobs.push(TL.loadAsync(`assets/tex/${k}.webp`).then(t=>{t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;PARTS.__tex[k]=t;}).catch(()=>{}));
  for(const k of DECO_NAMES)jobs.push(TL.loadAsync(`assets/deco/${k}.webp`).then(t=>{t.colorSpace=THREE.SRGBColorSpace;PARTS.__deco[k]={tex:t,mat:new THREE.SpriteMaterial({map:t,alphaTest:.35,depthWrite:true}),aspect:t.image.width/t.image.height};}).catch(()=>{}));
  for(const k of ['fountain','waystone'])jobs.push(L.loadAsync(`assets/models/${k}.glb`).then(gl=>{const o=gl.scene;const b=new THREE.Box3().setFromObject(o);const sz=b.getSize(new THREE.Vector3());o.userData.size=sz;o.userData.minY=b.min.y;o.userData.center=b.getCenter(new THREE.Vector3());PARTS.__models[k]=o;}).catch(()=>{}));
  await Promise.all(jobs);return PARTS;}

const MASKS={};function softMask(kind){if(MASKS[kind])return MASKS[kind];const S=128,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
  if(kind==='radial'){const gr=g.createRadialGradient(S/2,S/2,S*.36,S/2,S/2,S*.5);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,S,S);}
  else{const gr=g.createLinearGradient(0,0,0,S);gr.addColorStop(0,'#000');gr.addColorStop(.3,'#fff');gr.addColorStop(.7,'#fff');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,S,S);}
  const t=new THREE.CanvasTexture(cv);MASKS[kind]=t;return t;}
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function tileTexture(kind){if(PARTS&&PARTS.__tex&&PARTS.__tex[kind]){const t=PARTS.__tex[kind].clone();t.needsUpdate=true;return t;}const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
  if(kind==='snow'){g.fillStyle='#eef4fa';g.fillRect(0,0,S,S);for(let i=0;i<2200;i++){const l=hash(i,4);g.fillStyle=l<.5?`rgba(180,200,225,${.25*l})`:`rgba(255,255,255,${.6*(l-.5)})`;g.fillRect(hash(i,1)*S,hash(i,2)*S,2+l*3,2+l*2);}}
  else if(kind==='grass'){g.fillStyle='#6fa64a';g.fillRect(0,0,S,S);for(let i=0;i<2600;i++){const x=hash(i,1)*S,y=hash(i,2)*S,l=hash(i,3);g.fillStyle=l<.5?`rgba(60,110,40,${.25+l*.4})`:`rgba(150,200,90,${(l-.5)*.6})`;g.fillRect(x,y,2+l*3,2+l*2);}
    for(let i=0;i<40;i++){const x=hash(i,5)*S,y=hash(i,6)*S;g.fillStyle=['#fff6f0','#f8e070','#f8a0c0','#b8d8ff'][i%4];for(let k=0;k<5;k++){g.beginPath();g.arc(x+Math.cos(k*1.26)*2.4,y+Math.sin(k*1.26)*2.4,1.6,0,7);g.fill();}g.fillStyle='#f8d050';g.beginPath();g.arc(x,y,1.2,0,7);g.fill();}}
  else if(kind==='stone'){g.fillStyle='#a8a090';g.fillRect(0,0,S,S);const n=8,w=S/n;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const ox=(y%2)*w/2;const l=.85+hash(x,y)*.25;g.fillStyle=`rgb(${168*l|0},${160*l|0},${146*l|0})`;g.beginPath();g.roundRect(x*w+ox+2,y*w+2,w-4,w-4,6);g.fill();g.strokeStyle='rgba(70,60,50,.35)';g.lineWidth=2;g.stroke();}}
  else if(kind==='dirt'){g.fillStyle='#b89468';g.fillRect(0,0,S,S);for(let i=0;i<1800;i++){const l=hash(i,9);g.fillStyle=l<.5?`rgba(120,90,60,${.3*l})`:`rgba(220,190,140,${.3*(l-.5)})`;g.fillRect(hash(i,7)*S,hash(i,8)*S,3,3);}}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}

export const MAPS={
  town:{n:'Valeria',size:72,music:'town',spawn:[0,6],portals:[{x:31,z:0,to:'field',tx:-49,tz:0,label:'Greenmarch Meadows'}],
    npcs:[{id:'tools',n:'Mira the Grocer',x:10,z:-8,look:{job:'trader',style:1,hair:'#c84a3a',hat:'ribbon'}},{id:'arms',n:'Gunther, Arms Dealer',x:-10,z:-9,look:{job:'warrior',style:0,hair:'#3a2418',hat:'bandana',weapon:'sword'}},
      {id:'refine',n:'Old Brann the Refiner',x:-16,z:4,look:{job:'trader',style:0,hair:'#d8d8e8',weapon:'mace'}},{id:'storage',n:'Lenna of the Vaults',x:8,z:10,look:{job:'novice',style:3,hair:'#e8c878',hat:'beret'}},
      {id:'warp',n:'Sela the Waykeeper',x:26,z:-4,look:{job:'cleric',style:2,hair:'#6a3aa8',hat:'halo',weapon:'rod'}},{id:'job',n:'Master Corwin',x:0,z:-16,look:{job:'mage',style:0,hair:'#d8d8e8',hat:'wizard',weapon:'rod'}},
      {id:'healer',n:'Sister Ines',x:-4,z:8,look:{job:'cleric',style:1,hair:'#e8c878',weapon:'mace'}}]},
  field:{n:'Greenmarch Meadows',size:112,music:'wild',spawn:[-46,0],portals:[{x:-52,z:0,to:'town',tx:28,tz:0,label:'Valeria'}],
    mobs:[{k:'jellop',n:14,x:-28,z:0,r:20},{k:'lopkin',n:10,x:0,z:18,r:18},{k:'jellop',n:6,x:6,z:-8,r:12},{k:'shroom',n:9,x:-6,z:-32,r:16},{k:'bee',n:8,x:30,z:-18,r:16},{k:'lopkin',n:5,x:28,z:26,r:12}],
    boss:{k:'king',x:38,z:10,first:90,every:240}},
};

MAPS.snow={n:'Frostfall Hollow',size:104,music:'winter',spawn:[-44,0],winter:1,portals:[{x:-50,z:0,to:'town',tx:4,tz:8,label:'Valeria'}],
  mobs:[{k:'frostlop',n:12,x:-24,z:4,r:18},{k:'snowbunny',n:10,x:2,z:24,r:16},{k:'ginger',n:9,x:4,z:-24,r:16},{k:'frostlop',n:6,x:18,z:6,r:10}],boss:{k:'frostmaw',x:32,z:-2,first:60,every:300}};
export function buildMap(scene,id,parts,shadows){const M=MAPS[id];const root=new THREE.Group();scene.add(root);const S=M.size;const colliders=[];const statics=[];
  let seed=id==='town'?11:23;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const snowy=!!M.winter;const tex=tileTexture(snowy?'snow':'grass');tex.repeat.set(S/7,S/7);const gg=new THREE.PlaneGeometry(S*2.2,S*2.2,64,64);{const pos=gg.attributes.position,col=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);
    const n=(Math.sin(x*.07)+Math.sin(y*.083+1.3)+Math.sin((x+y)*.041+2.1))/3;const k=1+n*.09+(hash(Math.floor(x/9),Math.floor(y/9))-.5)*.06;col[i*3]=k*(snowy?1:1.02);col[i*3+1]=k;col[i*3+2]=k*(snowy?1.02:.96);}gg.setAttribute('color',new THREE.BufferAttribute(col,3));}
  const ground=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({map:tex,vertexColors:true}));tex.repeat.set(S*2.2/9,S*2.2/9);ground.rotation.x=-Math.PI/2;ground.receiveShadow=shadows;root.add(ground);
  const flat=(geo,kind,rep,soft)=>{const t=tileTexture(kind);if(Array.isArray(rep))t.repeat.set(rep[0],rep[1]);else t.repeat.set(rep,rep);const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:t,polygonOffset:true,polygonOffsetFactor:-1,alphaMap:soft?softMask(soft):null,transparent:!!soft,depthWrite:!soft}));m.rotation.x=-Math.PI/2;m.position.y=.02;m.receiveShadow=shadows;root.add(m);return m;};
  const shadowMat=new THREE.MeshBasicMaterial({map:softMask('radial'),color:0x000000,transparent:true,opacity:.28,depthWrite:false});const shadowGeo=new THREE.CircleGeometry(1,20);
  const deco=(name,x,z,h,col=0,shadow=true)=>{const D=parts.__deco&&parts.__deco[name];if(!D)return false;const sp=new THREE.Sprite(D.mat);sp.center.set(.5,.02);sp.scale.set(h*D.aspect,h,1);sp.position.set(x,0,z);root.add(sp);
    if(shadow){const sh=new THREE.Mesh(shadowGeo,shadowMat);sh.rotation.x=-Math.PI/2;sh.position.set(x,.03,z);sh.scale.set(h*D.aspect*.42,h*D.aspect*.26,1);root.add(sh);}if(col)colliders.push({x,z,r:col});return true;};
  const TREE={tree_single_A:'oak',tree_single_B:'pine',trees_A_small:'oak',trees_B_small:'pine',trees_A_medium:'oak',trees_B_medium:'pine',trees_A_large:'oak',trees_B_large:'pine'};
  const place=(name,x,z,s,ry=0,col=0)=>{if(TREE[name]&&parts.__deco&&parts.__deco.oak){const kind=snowy?'snowpine':TREE[name];if(name.startsWith('tree_single')){deco(kind,x,z,s*1.75,col?1:0);}
      else{const n=3;for(let i=0;i<n;i++){const a=i*2.1+ry,r=s*.35;deco(i===1&&!snowy?(kind==='oak'?'pine':'oak'):kind,x+Math.cos(a)*r,z+Math.sin(a)*r,s*(1.45+i*.12),0);}if(col)colliders.push({x,z,r:col});}return;}
    const src=parts[name];if(!src)return;const o=src.clone(true);o.position.set(x,0,z);o.scale.setScalar(s);o.rotation.y=ry;o.updateMatrixWorld(true);o.traverse(m=>{if(m.isMesh)statics.push(m);});if(col)colliders.push({x,z,r:col});};
  if(id==='snow'){const lake=new THREE.Mesh(new THREE.CircleGeometry(9,40),new THREE.MeshLambertMaterial({color:0xb8e0f4}));lake.rotation.x=-Math.PI/2;lake.position.set(10,.03,-6);root.add(lake);colliders.push({x:10,z:-6,r:8});
    const clear=(x,z)=>Math.hypot(x+44,z)>9&&Math.hypot(x-32,z+2)>11&&Math.hypot(x-10,z+6)>11;
    for(let i=0;i<220;i++){const x=(rnd()-.5)*S*1.15,z=(rnd()-.5)*S*1.15;if(!clear(x,z))continue;const edge=Math.max(Math.abs(x),Math.abs(z))>40;if(!edge&&rnd()<.62)continue;const k=['tree_single_A','tree_single_B','trees_A_small','trees_B_medium'][Math.floor(rnd()*4)];const s=k.startsWith('tree_single')?3.8+rnd()*2:3.2+rnd();place(k,x,z,s,rnd()*6,k.startsWith('tree_single')?1:2.4);}
    for(let i=0;i<30;i++){const x=(rnd()-.5)*S,z=(rnd()-.5)*S;if(!clear(x,z))continue;const s=3+rnd()*4;place('rock_single_'+'ABCDE'[Math.floor(rnd()*5)],x,z,s,rnd()*6,s*.12);}
    place('tent',-38,-9,4.5,.4,1.6);place('flag_red',-42,6,5,0,.3);deco('sign',-43,5,3,.4);deco('crates',-35,-11,2.3,1);
    for(let i=0;i<(MOBILE?60:100);i++){const x=(rnd()-.5)*S*.95,z=(rnd()-.5)*S*.95;if(!clear(x,z))continue;deco('snowbush',x,z,1.5+rnd()*.8,.5);}}
  else if(id==='town'){flat(new THREE.CircleGeometry(16.5,48),'cobble',7,'radial');flat(new THREE.PlaneGeometry(44,6.5),'cobble',[44/5,6.5/5],'strip').position.set(14,.022,0);{const r=flat(new THREE.PlaneGeometry(30,5.5),'cobble',[30/5,5.5/5],'strip');r.position.set(0,.023,-14);r.rotation.z=Math.PI/2;}
    if(parts.__models&&parts.__models.fountain){const f=parts.__models.fountain.clone(true);const sz=f.userData.size;const k=7.5/Math.max(sz.x,sz.z);f.scale.setScalar(k);f.position.set(-f.userData.center.x*k,-f.userData.minY*k,-f.userData.center.z*k);
      f.traverse(o=>{if(o.isMesh){o.castShadow=shadows;o.receiveShadow=shadows;}});root.add(f);colliders.push({x:0,z:0,r:3.6});}else place('building_well_blue',0,0,3.2,0,1.6);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.39;deco('lamp',Math.cos(a)*15.5,Math.sin(a)*15.5,4.6,.35);}
    deco('stall',13.5,-11,3.6,1.6);deco('stall',7,-12.5,3.4,1.5);deco('crates',-13,-13,2.4,1.1);deco('crates',15,8,2.2,1);deco('sign',29,-5,3,.4);deco('hay',-30,22,2.8,1.4);
    for(const [x,z] of [[-10,13],[-17,11],[10,19],[19,17],[-9,-18],[16,-18],[-26,8],[22,-8],[-4,-21],[5,-21]]){deco(rnd()<.5?'flowers':'bush',x,z,rnd()<.5?1.4:1.9,0);}
    for(const [k,x,z,s,r] of [['building_church_blue',0,-26,5,0],['building_tavern_blue',16,14,4.4,Math.PI],['building_market_blue',18,-14,4.2,-1.2],['building_blacksmith_blue',-20,-2,4.2,1.57],['building_home_A_blue',-14,16,4,2.6],['building_home_B_blue',-22,14,4,2.2],
      ['building_home_A_blue',-22,-18,4,.7],['building_home_B_blue',-12,-22,4,.3],['building_windmill_blue',-26,26,4.5,.5],['building_tower_A_blue',24,-26,4.5,0],['building_castle_blue',0,-44,7,0],['building_home_B_blue',14,24,4,3]])place(k,x,z,s,r,s*.95);
    for(const [k,x,z,s] of [['barrel',12,-5,3.2],['barrel',12.8,-4,3],['crate_A_big',-13,-6,3.2],['crate_open',-14,-4.4,3],['weaponrack',-8,-11.5,3.4],['sack',11,-10,3],['flag_blue',-6,-17,5],['flag_blue',6,-17,5],['bucket_water',1.6,1.6,3],['wheelbarrow',-17,8,3.4]])place(k,x,z,s,hash(x,z)*6,k.startsWith('flag')?.3:.7);
    // town wall with the east gate
    for(let i=0;i<28;i++){const a=i/28*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.2)continue;const r=34;place('wall_straight',Math.cos(a)*r,Math.sin(a)*r,4.2,-a+Math.PI/2,0);colliders.push({x:Math.cos(a)*r,z:Math.sin(a)*r,r:4.2});}
    place('wall_straight_gate',34,0,4.2,-Math.PI/2+Math.PI/2*2,0);
    for(let i=0;i<60;i++){const a=rnd()*Math.PI*2,r=38+rnd()*24;place(rnd()<.5?'tree_single_A':'tree_single_B',Math.cos(a)*r,Math.sin(a)*r,4+rnd()*2,rnd()*6,0);}}
  else{// meadows: a winding dirt road, a stream with a bridge, copses of trees
    const road=[[-52,0],[-36,2],[-20,-2],[-4,2],[12,0],[26,6],[38,10]];for(let i=0;i<road.length-1;i++){const [ax,az]=road[i],[bx,bz]=road[i+1];const L=Math.hypot(bx-ax,bz-az);const m=flat(new THREE.PlaneGeometry(L+4,5),'dirt',[(L+4)/6,5/6],'strip');m.position.set((ax+bx)/2,.021+i*.001,(az+bz)/2);m.rotation.z=-Math.atan2(bz-az,bx-ax);}
    const water=new THREE.Mesh(new THREE.PlaneGeometry(6,S*1.6),new THREE.MeshLambertMaterial({color:0x4a90c8,transparent:true,opacity:.85}));water.rotation.x=-Math.PI/2;water.rotation.z=.25;water.position.set(18,.03,0);root.add(water);
    place('building_bridge_A',18.4,1.5,3.4,Math.PI/2-.25,0);for(let z=-60;z<60;z+=2.5){if(Math.abs(z-1.5)<4)continue;colliders.push({x:18+z*Math.tan(.25),z,r:2.6});}
    const clear=(x,z)=>{for(const [rx,rz] of road)if(Math.hypot(x-rx,z-rz)<7)return false;if(Math.abs(x-(18+z*Math.tan(.25)))<5)return false;if(Math.hypot(x-38,z-10)<10)return false;if(Math.hypot(x+50,z)<8)return false;return true;};
    for(let i=0;i<240;i++){const x=(rnd()-.5)*S*1.15,z=(rnd()-.5)*S*1.15;if(!clear(x,z))continue;const edge=Math.max(Math.abs(x),Math.abs(z))>44;if(!edge&&rnd()<.6)continue;const k=['tree_single_A','tree_single_B','trees_A_small','trees_B_small','trees_A_medium'][Math.floor(rnd()*5)];const s=k.startsWith('tree_single')?3.8+rnd()*2:3.2+rnd();place(k,x,z,s,rnd()*6,k.startsWith('tree_single')?1:2.4);}
    for(let i=0;i<40;i++){const x=(rnd()-.5)*S,z=(rnd()-.5)*S;if(!clear(x,z))continue;const s=3+rnd()*4;place('rock_single_'+'ABCDE'[Math.floor(rnd()*5)],x,z,s,rnd()*6,s*.12);}
    place('tent',-40,-10,4.5,.4,1.6);place('barrel',-38,-7,3,0,.6);place('flag_yellow',-44,6,5,0,.3);place('target',-36,12,3.2,1,.6);
    deco('hay',-43,-14,2.8,1.3);deco('crates',-35,-12,2.3,1);deco('sign',-44,5,3,.4);
    for(let i=0;i<(MOBILE?150:230);i++){const x=(rnd()-.5)*S*.95,z=(rnd()-.5)*S*.95;if(!clear(x,z))continue;const r=rnd();
      if(r<.55)deco('grass',x,z,.9+rnd()*.5,0,false);else if(r<.78)deco('flowers',x,z,1.2+rnd()*.5,0,false);else if(r<.92)deco('bush',x,z,1.6+rnd()*.7,.5);else deco('mushrooms',x,z,1+rnd()*.4,0,false);}}
  // merge static meshes per material (few draw calls)
  const byMat=new Map();for(const m of statics){const key=m.material.uuid;if(!byMat.has(key))byMat.set(key,{mat:m.material,geos:[]});const g=m.geometry.clone();g.applyMatrix4(m.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);byMat.get(key).geos.push(g.index?g.toNonIndexed():g);}
  for(const {mat,geos} of byMat.values()){const merged=mergeGeometries(geos,false);if(!merged)continue;let mt=mat;if(snowy){mt=mat.clone();if(mt.color)mt.color.lerp(new THREE.Color(0xeaf2ff),.45);}const mesh=new THREE.Mesh(merged,mt);mesh.castShadow=shadows;mesh.receiveShadow=shadows;root.add(mesh);}
  // portals: swirling rings
  const portals=M.portals.map(p=>{const g=new THREE.Group();g.position.set(p.x,0,p.z);
    const W=parts.__models&&parts.__models.waystone;if(W){const w=W.clone(true);const sz=w.userData.size;const k=5.4/sz.y;w.scale.setScalar(k);w.position.set(-w.userData.center.x*k,-w.userData.minY*k,-w.userData.center.z*k);
      const piv=new THREE.Group();piv.add(w);piv.rotation.y=Math.atan2(-p.x,-p.z);g.add(piv);w.traverse(o=>{if(o.isMesh){o.castShadow=shadows;}});}const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.16,8,40),new THREE.MeshBasicMaterial({color:0x8ad8ff,transparent:true,opacity:.85}));ring.rotation.x=-Math.PI/2;ring.position.y=.2;g.add(ring);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(1.5,32),new THREE.MeshBasicMaterial({color:0x6ac0ff,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.12;g.add(disc);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.6,3.5,24,1,true),new THREE.MeshBasicMaterial({color:0x8ad8ff,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));col.position.y=1.75;g.add(col);root.add(g);return {...p,obj:g,ring};});
  return {root,colliders,portals,size:S};}
export function collide(p,r,colliders,size){for(const c of colliders){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),m=r+c.r;if(d<m&&d>1e-4){p.x=c.x+dx/d*m;p.z=c.z+dz/d*m;}}const h=size/2-2;p.x=Math.max(-h,Math.min(h,p.x));p.z=Math.max(-h,Math.min(h,p.z));}
export function sceneLights(scene,shadows){scene.background=new THREE.Color(0x9ac8e8);scene.fog=new THREE.Fog(0xb8d8ee,60,150);
  scene.add(new THREE.HemisphereLight(0xdfefff,0x6a7a4a,1.6));const sun=new THREE.DirectionalLight(0xfff0d8,2.2);sun.position.set(30,60,20);sun.castShadow=shadows;
  if(shadows){sun.shadow.mapSize.set(2048,2048);const c=sun.shadow.camera;c.left=c.bottom=-40;c.right=c.top=40;c.near=1;c.far=160;sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;}scene.add(sun);scene.add(sun.target);return sun;}
