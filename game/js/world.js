// Renderer, camera rig and the two maps (Valeria town, Greenmarch Meadows). Maps are flat (y=0) like classic 2.5D MMOs.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const MOBILE=matchMedia('(pointer:coarse)').matches||/Android|iPhone|iPad/i.test(navigator.userAgent);
export function createRenderer(el){const r=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio||1,MOBILE?1.6:2));r.setSize(innerWidth,innerHeight);
  r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.08;r.shadowMap.enabled=!MOBILE||localStorage.getItem('ero_shadow')==='1';r.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(r.domElement);
  const camera=new THREE.PerspectiveCamera(innerWidth<innerHeight?48:38,innerWidth/innerHeight,.5,400);
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?48:38;camera.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);});return {renderer:r,camera};}
let PARTS=null;export async function loadWorldParts(){if(PARTS)return PARTS;const g=await new GLTFLoader().loadAsync('assets/world.glb');PARTS={};for(const c of g.scene.children)PARTS[c.name]=c;return PARTS;}

function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function tileTexture(kind){const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
  if(kind==='grass'){g.fillStyle='#6fa64a';g.fillRect(0,0,S,S);for(let i=0;i<2600;i++){const x=hash(i,1)*S,y=hash(i,2)*S,l=hash(i,3);g.fillStyle=l<.5?`rgba(60,110,40,${.25+l*.4})`:`rgba(150,200,90,${(l-.5)*.6})`;g.fillRect(x,y,2+l*3,2+l*2);}
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

export function buildMap(scene,id,parts,shadows){const M=MAPS[id];const root=new THREE.Group();scene.add(root);const S=M.size;const colliders=[];const statics=[];
  let seed=id==='town'?11:23;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const tex=tileTexture('grass');tex.repeat.set(S/7,S/7);const ground=new THREE.Mesh(new THREE.PlaneGeometry(S*2.2,S*2.2),new THREE.MeshLambertMaterial({map:tex}));tex.repeat.set(S*2.2/7,S*2.2/7);ground.rotation.x=-Math.PI/2;ground.receiveShadow=shadows;root.add(ground);
  const flat=(geo,kind,rep)=>{const t=tileTexture(kind);t.repeat.set(rep,rep);const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:t,polygonOffset:true,polygonOffsetFactor:-1}));m.rotation.x=-Math.PI/2;m.position.y=.02;m.receiveShadow=shadows;root.add(m);return m;};
  const place=(name,x,z,s,ry=0,col=0)=>{const src=parts[name];if(!src)return;const o=src.clone(true);o.position.set(x,0,z);o.scale.setScalar(s);o.rotation.y=ry;o.updateMatrixWorld(true);o.traverse(m=>{if(m.isMesh)statics.push(m);});if(col)colliders.push({x,z,r:col});};
  if(id==='town'){flat(new THREE.CircleGeometry(15,48),'stone',6);flat(new THREE.PlaneGeometry(44,6),'stone',8).position.set(14,.021,0);flat(new THREE.PlaneGeometry(5,30),'stone',6).position.set(0,.021,-14);
    place('building_well_blue',0,0,3.2,0,1.6);
    for(const [k,x,z,s,r] of [['building_church_blue',0,-26,5,0],['building_tavern_blue',16,14,4.4,Math.PI],['building_market_blue',18,-14,4.2,-1.2],['building_blacksmith_blue',-20,-2,4.2,1.57],['building_home_A_blue',-14,16,4,2.6],['building_home_B_blue',-22,14,4,2.2],
      ['building_home_A_blue',-22,-18,4,.7],['building_home_B_blue',-12,-22,4,.3],['building_windmill_blue',-26,26,4.5,.5],['building_tower_A_blue',24,-26,4.5,0],['building_castle_blue',0,-44,7,0],['building_home_B_blue',14,24,4,3]])place(k,x,z,s,r,s*.95);
    for(const [k,x,z,s] of [['barrel',12,-5,3.2],['barrel',12.8,-4,3],['crate_A_big',-13,-6,3.2],['crate_open',-14,-4.4,3],['weaponrack',-8,-11.5,3.4],['sack',11,-10,3],['flag_blue',-6,-17,5],['flag_blue',6,-17,5],['bucket_water',1.6,1.6,3],['wheelbarrow',-17,8,3.4]])place(k,x,z,s,hash(x,z)*6,k.startsWith('flag')?.3:.7);
    // town wall with the east gate
    for(let i=0;i<28;i++){const a=i/28*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.2)continue;const r=34;place('wall_straight',Math.cos(a)*r,Math.sin(a)*r,4.2,-a+Math.PI/2,0);colliders.push({x:Math.cos(a)*r,z:Math.sin(a)*r,r:4.2});}
    place('wall_straight_gate',34,0,4.2,-Math.PI/2+Math.PI/2*2,0);
    for(let i=0;i<60;i++){const a=rnd()*Math.PI*2,r=38+rnd()*24;place(rnd()<.5?'tree_single_A':'tree_single_B',Math.cos(a)*r,Math.sin(a)*r,4+rnd()*2,rnd()*6,0);}}
  else{// meadows: a winding dirt road, a stream with a bridge, copses of trees
    const road=[[-52,0],[-36,2],[-20,-2],[-4,2],[12,0],[26,6],[38,10]];for(let i=0;i<road.length-1;i++){const [ax,az]=road[i],[bx,bz]=road[i+1];const L=Math.hypot(bx-ax,bz-az);const m=flat(new THREE.PlaneGeometry(L+3,4.4),'dirt',3);m.position.set((ax+bx)/2,.021+i*.001,(az+bz)/2);m.rotation.z=-Math.atan2(bz-az,bx-ax);}
    const water=new THREE.Mesh(new THREE.PlaneGeometry(6,S*1.6),new THREE.MeshLambertMaterial({color:0x4a90c8,transparent:true,opacity:.85}));water.rotation.x=-Math.PI/2;water.rotation.z=.25;water.position.set(18,.03,0);root.add(water);
    place('building_bridge_A',18.4,1.5,3.4,Math.PI/2-.25,0);for(let z=-60;z<60;z+=2.5){if(Math.abs(z-1.5)<4)continue;colliders.push({x:18+z*Math.tan(.25),z,r:2.6});}
    const clear=(x,z)=>{for(const [rx,rz] of road)if(Math.hypot(x-rx,z-rz)<7)return false;if(Math.abs(x-(18+z*Math.tan(.25)))<5)return false;if(Math.hypot(x-38,z-10)<10)return false;if(Math.hypot(x+50,z)<8)return false;return true;};
    for(let i=0;i<240;i++){const x=(rnd()-.5)*S*1.15,z=(rnd()-.5)*S*1.15;if(!clear(x,z))continue;const edge=Math.max(Math.abs(x),Math.abs(z))>44;if(!edge&&rnd()<.6)continue;const k=['tree_single_A','tree_single_B','trees_A_small','trees_B_small','trees_A_medium'][Math.floor(rnd()*5)];const s=k.startsWith('tree_single')?3.8+rnd()*2:3.2+rnd();place(k,x,z,s,rnd()*6,k.startsWith('tree_single')?1:2.4);}
    for(let i=0;i<40;i++){const x=(rnd()-.5)*S,z=(rnd()-.5)*S;if(!clear(x,z))continue;const s=3+rnd()*4;place('rock_single_'+'ABCDE'[Math.floor(rnd()*5)],x,z,s,rnd()*6,s*.12);}
    place('tent',-40,-10,4.5,.4,1.6);place('barrel',-38,-7,3,0,.6);place('flag_yellow',-44,6,5,0,.3);place('target',-36,12,3.2,1,.6);}
  // merge static meshes per material (few draw calls)
  const byMat=new Map();for(const m of statics){const key=m.material.uuid;if(!byMat.has(key))byMat.set(key,{mat:m.material,geos:[]});const g=m.geometry.clone();g.applyMatrix4(m.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);byMat.get(key).geos.push(g.index?g.toNonIndexed():g);}
  for(const {mat,geos} of byMat.values()){const merged=mergeGeometries(geos,false);if(!merged)continue;const mesh=new THREE.Mesh(merged,mat);mesh.castShadow=shadows;mesh.receiveShadow=shadows;root.add(mesh);}
  // portals: swirling rings
  const portals=M.portals.map(p=>{const g=new THREE.Group();g.position.set(p.x,0,p.z);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.16,8,40),new THREE.MeshBasicMaterial({color:0x8ad8ff,transparent:true,opacity:.85}));ring.rotation.x=-Math.PI/2;ring.position.y=.2;g.add(ring);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(1.5,32),new THREE.MeshBasicMaterial({color:0x6ac0ff,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.12;g.add(disc);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.6,3.5,24,1,true),new THREE.MeshBasicMaterial({color:0x8ad8ff,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));col.position.y=1.75;g.add(col);root.add(g);return {...p,obj:g,ring};});
  return {root,colliders,portals,size:S};}
export function collide(p,r,colliders,size){for(const c of colliders){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),m=r+c.r;if(d<m&&d>1e-4){p.x=c.x+dx/d*m;p.z=c.z+dz/d*m;}}const h=size/2-2;p.x=Math.max(-h,Math.min(h,p.x));p.z=Math.max(-h,Math.min(h,p.z));}
export function sceneLights(scene,shadows){scene.background=new THREE.Color(0x9ac8e8);scene.fog=new THREE.Fog(0xb8d8ee,60,150);
  scene.add(new THREE.HemisphereLight(0xdfefff,0x6a7a4a,1.6));const sun=new THREE.DirectionalLight(0xfff0d8,2.2);sun.position.set(30,60,20);sun.castShadow=shadows;
  if(shadows){sun.shadow.mapSize.set(2048,2048);const c=sun.shadow.camera;c.left=c.bottom=-40;c.right=c.top=40;c.near=1;c.far=160;sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;}scene.add(sun);scene.add(sun.target);return sun;}
