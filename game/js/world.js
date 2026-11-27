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

// Irregular path edges: the same edge functions shape the alpha masks and place the grass tufts that overlap them.
const wob=(t,seed)=>Math.sin(t*3+seed)*.5+Math.sin(t*7.3+seed*2.1)*.3+Math.sin(t*13.1+seed*.7)*.2;   // -1..1, smooth
export const edgeRadial=a=>.88+wob(a,1.7)*.07;              // fraction of the circle radius
export const edgeStrip=(u,side)=>.53+wob(u*9,side?4.1:2.3)*.07;   // fraction of half-width from the centre line kept as path (0..1 → v)
const MASKS={};function softMask(kind){if(MASKS[kind])return MASKS[kind];const W=kind==='strip'?1024:256,H=kind==='strip'?128:256,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');const im=g.createImageData(W,H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let a;
    if(kind==='radial'){const dx=x/W-.5,dy=y/H-.5,d=Math.hypot(dx,dy)*2,ang=Math.atan2(dy,dx);const e=edgeRadial(ang);a=Math.min(1,Math.max(0,(e-d)/.018));if(kind==='radial'&&d>e-.035&&d<=e)a*=.82+.18*((x*7+y*13)%5)/5;}
    else if(kind==='strip'){const u=x/W,v=y/H;const top=.5-edgeStrip(u,0)*.5*1.6,bot=.5+edgeStrip(u,1)*.5*1.6;const dd=Math.min(v-top,bot-v);a=Math.min(1,Math.max(0,dd/.035));}
    else{const dx=x/W-.5,dy=y/H-.5;a=Math.max(0,1-Math.hypot(dx,dy)*2);a=a*a;}
    const k=(y*W+x)*4;im.data[k]=im.data[k+1]=im.data[k+2]=Math.round(a*255);im.data[k+3]=255;}
  g.putImageData(im,0,0);const t=new THREE.CanvasTexture(cv);MASKS[kind]=t;return t;}
// Anti-tiling ground material: blends the texture with a rotated, rescaled copy of itself through soft noise, plus broad light/dark patches.
let NOISE=null;function noiseTex(){if(NOISE)return NOISE;const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');const im=g.createImageData(S,S);
  const v=(x,y)=>{let n=0,a=1,f=1/48,t=0;for(let o=0;o<4;o++){n+=a*(Math.sin(x*f*6.283+o*1.7)*Math.sin(y*f*6.283+o*2.3)*.5+.5);t+=a;a*=.5;f*=2;}return n/t;};
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=(y*S+x)*4,n=Math.round(v(x,y)*255);im.data[k]=im.data[k+1]=im.data[k+2]=n;im.data[k+3]=255;}g.putImageData(im,0,0);
  NOISE=new THREE.CanvasTexture(cv);NOISE.wrapS=NOISE.wrapT=THREE.RepeatWrapping;return NOISE;}
function groundMat(map,opts={}){const m=new THREE.MeshLambertMaterial(Object.assign({map},opts));const nz=noiseTex();
  m.onBeforeCompile=sh=>{sh.uniforms.nz={value:nz};sh.fragmentShader=sh.fragmentShader.replace('#include <map_pars_fragment>','#include <map_pars_fragment>\nuniform sampler2D nz;')
    .replace('#include <map_fragment>',`#ifdef USE_MAP
      vec2 uvA=vMapUv; vec2 uvB=mat2(.8,-.6,.6,.8)*vMapUv*.63+vec2(.37,.71);
      vec4 cA=texture2D(map,uvA), cB=texture2D(map,uvB);
      float n=texture2D(nz,vMapUv*.045).r, n2=texture2D(nz,vMapUv*.013+.5).r;
      vec4 sampledDiffuseColor=mix(cA,cB,smoothstep(.38,.62,n));
      sampledDiffuseColor.rgb*=.9+n2*.22;
      diffuseColor*=sampledDiffuseColor;
    #endif`);};m.customProgramCacheKey=()=>'ground';return m;}
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function tileTexture(kind){if(PARTS&&PARTS.__tex&&PARTS.__tex[kind]){const t=PARTS.__tex[kind].clone();t.needsUpdate=true;return t;}const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
  if(kind==='snow'){g.fillStyle='#eef4fa';g.fillRect(0,0,S,S);for(let i=0;i<2200;i++){const l=hash(i,4);g.fillStyle=l<.5?`rgba(180,200,225,${.25*l})`:`rgba(255,255,255,${.6*(l-.5)})`;g.fillRect(hash(i,1)*S,hash(i,2)*S,2+l*3,2+l*2);}}
  else if(kind==='grass'){g.fillStyle='#6fa64a';g.fillRect(0,0,S,S);for(let i=0;i<2600;i++){const x=hash(i,1)*S,y=hash(i,2)*S,l=hash(i,3);g.fillStyle=l<.5?`rgba(60,110,40,${.25+l*.4})`:`rgba(150,200,90,${(l-.5)*.6})`;g.fillRect(x,y,2+l*3,2+l*2);}
    for(let i=0;i<40;i++){const x=hash(i,5)*S,y=hash(i,6)*S;g.fillStyle=['#fff6f0','#f8e070','#f8a0c0','#b8d8ff'][i%4];for(let k=0;k<5;k++){g.beginPath();g.arc(x+Math.cos(k*1.26)*2.4,y+Math.sin(k*1.26)*2.4,1.6,0,7);g.fill();}g.fillStyle='#f8d050';g.beginPath();g.arc(x,y,1.2,0,7);g.fill();}}
  else if(kind==='stone'){g.fillStyle='#a8a090';g.fillRect(0,0,S,S);const n=8,w=S/n;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const ox=(y%2)*w/2;const l=.85+hash(x,y)*.25;g.fillStyle=`rgb(${168*l|0},${160*l|0},${146*l|0})`;g.beginPath();g.roundRect(x*w+ox+2,y*w+2,w-4,w-4,6);g.fill();g.strokeStyle='rgba(70,60,50,.35)';g.lineWidth=2;g.stroke();}}
  else if(kind==='dirt'){g.fillStyle='#b89468';g.fillRect(0,0,S,S);for(let i=0;i<1800;i++){const l=hash(i,9);g.fillStyle=l<.5?`rgba(120,90,60,${.3*l})`:`rgba(220,190,140,${.3*(l-.5)})`;g.fillRect(hash(i,7)*S,hash(i,8)*S,3,3);}}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}

export const MAPS={
  town:{n:'Valeria',size:80,music:'town',spawn:[4,8],portals:[{x:33,z:0,to:'field',tx:-49,tz:0,label:'Greenmarch Meadows'}],
    npcs:[{id:'tools',n:'Mira the Grocer',x:9,z:-7,look:{job:'trader',style:1,hair:'#c84a3a',hat:'ribbon'}},{id:'arms',n:'Gunther, Arms Dealer',x:17.5,z:-3.2,look:{job:'warrior',style:0,hair:'#3a2418',hat:'bandana',weapon:'sword'}},
      {id:'refine',n:'Old Brann the Refiner',x:23,z:-3,look:{job:'trader',style:0,hair:'#d8d8e8',weapon:'mace'}},{id:'storage',n:'Lenna of the Vaults',x:15.5,z:6.5,look:{job:'novice',style:3,hair:'#e8c878',hat:'beret'}},
      {id:'warp',n:'Sela the Waykeeper',x:28.5,z:-3.4,look:{job:'cleric',style:2,hair:'#6a3aa8',hat:'halo',weapon:'rod'}},{id:'job',n:'Master Corwin',x:0,z:-21.5,look:{job:'mage',style:0,hair:'#d8d8e8',hat:'wizard',weapon:'rod'}},
      {id:'healer',n:'Sister Ines',x:-5,z:8.5,look:{job:'cleric',style:1,hair:'#e8c878',weapon:'mace'}}]},
  field:{n:'Greenmarch Meadows',size:112,music:'wild',spawn:[-46,0],portals:[{x:-52,z:0,to:'town',tx:29,tz:1,label:'Valeria'}],
    mobs:[{k:'jellop',n:14,x:-28,z:0,r:20},{k:'lopkin',n:10,x:0,z:18,r:18},{k:'jellop',n:6,x:6,z:-8,r:12},{k:'shroom',n:9,x:-6,z:-32,r:16},{k:'bee',n:8,x:30,z:-18,r:16},{k:'lopkin',n:5,x:28,z:26,r:12}],
    boss:{k:'king',x:38,z:10,first:90,every:240}},
};

MAPS.snow={n:'Frostfall Hollow',size:104,music:'winter',spawn:[-44,0],winter:1,portals:[{x:-50,z:0,to:'town',tx:29,tz:1,label:'Valeria'}],
  mobs:[{k:'frostlop',n:12,x:-24,z:4,r:18},{k:'snowbunny',n:10,x:2,z:24,r:16},{k:'ginger',n:9,x:4,z:-24,r:16},{k:'frostlop',n:6,x:18,z:6,r:10}],boss:{k:'frostmaw',x:32,z:-2,first:60,every:300}};
export function buildMap(scene,id,parts,shadows){const M=MAPS[id];const root=new THREE.Group();scene.add(root);const S=M.size;const colliders=[];const statics=[];
  let seed=id==='town'?11:23;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const snowy=!!M.winter;const tex=tileTexture(snowy?'snow':'grass');tex.repeat.set(S/7,S/7);const gg=new THREE.PlaneGeometry(S*2.2,S*2.2,64,64);{const pos=gg.attributes.position,col=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);
    const n=(Math.sin(x*.07)+Math.sin(y*.083+1.3)+Math.sin((x+y)*.041+2.1))/3;const k=1+n*.09+(hash(Math.floor(x/9),Math.floor(y/9))-.5)*.06;col[i*3]=k*(snowy?1:1.02);col[i*3+1]=k;col[i*3+2]=k*(snowy?1.02:.96);}gg.setAttribute('color',new THREE.BufferAttribute(col,3));}
  const ground=new THREE.Mesh(gg,groundMat(tex,{vertexColors:true}));tex.repeat.set(S*2.2/9,S*2.2/9);ground.rotation.x=-Math.PI/2;ground.receiveShadow=shadows;root.add(ground);
  const flat=(geo,kind,rep,soft)=>{const t=tileTexture(kind);if(Array.isArray(rep))t.repeat.set(rep[0],rep[1]);else t.repeat.set(rep,rep);const m=new THREE.Mesh(geo,groundMat(t,{polygonOffset:true,polygonOffsetFactor:-1,alphaMap:soft?softMask(soft):null,transparent:!!soft,alphaTest:soft?.5:0,depthWrite:true}));m.rotation.x=-Math.PI/2;m.position.y=.02;m.receiveShadow=shadows;root.add(m);return m;};
  const shadowMat=new THREE.MeshBasicMaterial({map:softMask('blob'),color:0x000000,transparent:true,opacity:.28,depthWrite:false});const shadowGeo=new THREE.CircleGeometry(1,20);const shadowMatSoft=new THREE.MeshBasicMaterial({map:softMask('blob'),color:0x000000,transparent:true,opacity:.2,depthWrite:false});
  const deco=(name,x,z,h,col=0,shadow=true)=>{const D=parts.__deco&&parts.__deco[name];if(!D)return false;const sp=new THREE.Sprite(D.mat);sp.center.set(.5,.02);sp.scale.set(h*D.aspect,h,1);sp.position.set(x,0,z);root.add(sp);
    if(shadow){const sh=new THREE.Mesh(shadowGeo,shadowMat);sh.rotation.x=-Math.PI/2;sh.position.set(x,.03,z);sh.scale.set(h*D.aspect*.42,h*D.aspect*.26,1);root.add(sh);}if(col)colliders.push({x,z,r:col});return true;};
  // grass that grows over path edges (positions follow the same wobble as the masks)
  const fringeStrip=(cx,cz,L,Wd,ux,uz,px,pz,skip)=>{if(!(parts.__deco&&parts.__deco.grass))return;for(let t=.6;t<L;t+=1.3){const u=t/L;for(const side of [0,1]){const e=edgeStrip(u,side)*.8*Wd*(side?-1:1);const j=(rnd()-.5)*.35;
      const x=cx+ux*(t-L/2)+px*(e+j),z=cz+uz*(t-L/2)+pz*(e+j);if(skip&&skip(x,z))continue;const r=rnd();deco(snowy?'snowbush':r<.86?'grass':r<.95?'flowers':'mushrooms',x,z,snowy?.8:(r<.86?.6+rnd()*.3:.85),0,false);}}};
  const fringeCircle=(cx,cz,R)=>{if(!(parts.__deco&&parts.__deco.grass))return;const n=Math.round(R*2*Math.PI/1.05);for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rnd()*.05;const r=R*edgeRadial(a)+(rnd()-.5)*.35;const k=rnd();
      deco(k<.84?'grass':k<.95?'flowers':'bush',cx+Math.cos(a)*r,cz+Math.sin(a)*r,k<.84?.75+rnd()*.35:k<.95?1.1:1.4,0,false);}};
  const TREE={tree_single_A:'oak',tree_single_B:'pine',trees_A_small:'oak',trees_B_small:'pine',trees_A_medium:'oak',trees_B_medium:'pine',trees_A_large:'oak',trees_B_large:'pine'};
  const place=(name,x,z,s,ry=0,col=0)=>{if(TREE[name]&&parts.__deco&&parts.__deco.oak){const kind=snowy?'snowpine':TREE[name];if(name.startsWith('tree_single')){deco(kind,x,z,s*1.75,col?1:0);}
      else{const n=3;for(let i=0;i<n;i++){const a=i*2.1+ry,r=s*.35;deco(i===1&&!snowy?(kind==='oak'?'pine':'oak'):kind,x+Math.cos(a)*r,z+Math.sin(a)*r,s*(1.45+i*.12),0);}if(col)colliders.push({x,z,r:col});}return;}
    const src=parts[name];if(!src)return;const o=src.clone(true);o.position.set(x,0,z);o.scale.setScalar(s);o.rotation.y=ry;o.updateMatrixWorld(true);if(col>.5&&!name.startsWith('wall')){const sh=new THREE.Mesh(shadowGeo,col>2?shadowMatSoft:shadowMat);sh.rotation.x=-Math.PI/2;sh.position.set(x,.025,z);const r=col>2?col*1.12:col*1.2;sh.scale.set(r,r,1);root.add(sh);}o.traverse(m=>{if(m.isMesh)statics.push(m);});if(col)colliders.push({x,z,r:col});};
  if(id==='snow'){const lake=new THREE.Mesh(new THREE.CircleGeometry(9,40),new THREE.MeshLambertMaterial({color:0xb8e0f4}));lake.rotation.x=-Math.PI/2;lake.position.set(10,.03,-6);root.add(lake);colliders.push({x:10,z:-6,r:8});
    const clear=(x,z)=>Math.hypot(x+44,z)>9&&Math.hypot(x-32,z+2)>11&&Math.hypot(x-10,z+6)>11;
    for(let i=0;i<220;i++){const x=(rnd()-.5)*S*1.15,z=(rnd()-.5)*S*1.15;if(!clear(x,z))continue;const edge=Math.max(Math.abs(x),Math.abs(z))>40;if(!edge&&rnd()<.62)continue;const k=['tree_single_A','tree_single_B','trees_A_small','trees_B_medium'][Math.floor(rnd()*4)];const s=k.startsWith('tree_single')?3.8+rnd()*2:3.2+rnd();place(k,x,z,s,rnd()*6,k.startsWith('tree_single')?1:2.4);}
    for(let i=0;i<30;i++){const x=(rnd()-.5)*S,z=(rnd()-.5)*S;if(!clear(x,z))continue;const s=3+rnd()*4;place('rock_single_'+'ABCDE'[Math.floor(rnd()*5)],x,z,s,rnd()*6,s*.12);}
    place('tent',-38,-9,4.5,.4,1.6);place('flag_red',-42,6,5,0,.3);deco('sign',-43,5,3,.4);deco('crates',-35,-11,2.3,1);
    for(let i=0;i<(MOBILE?60:100);i++){const x=(rnd()-.5)*S*.95,z=(rnd()-.5)*S*.95;if(!clear(x,z))continue;deco('snowbush',x,z,1.5+rnd()*.8,.5);}}
  else if(id==='town'){
    // Layout follows a classic market-town skeleton: gate → curving main street → fountain square (market & tavern open onto it)
    // → north street to the church forecourt (landmark), a quiet residential lane west with its own well nook, craft corner by the gate.
    const inPlaza=(x,z)=>Math.hypot(x,z)<15.6;
    const street=(pts,w,y0=.022)=>{for(let i=0;i<pts.length-1;i++){const [ax,az]=pts[i],[bx,bz]=pts[i+1];const L=Math.hypot(bx-ax,bz-az)+w*.7,al=Math.atan2(bz-az,bx-ax);
        const m=flat(new THREE.PlaneGeometry(L,w),'cobble',[L/5,w/5],'strip');m.position.set((ax+bx)/2,y0+i*.0015,(az+bz)/2);m.rotation.z=-al;
        fringeStrip((ax+bx)/2,(az+bz)/2,L,w,Math.cos(al),Math.sin(al),Math.sin(al),-Math.cos(al),(x,z)=>inPlaza(x,z)||Math.hypot(x,z+24.5)<6.2||Math.hypot(x+25,z+13)<5.4);}};
    const square=(x,z,R)=>{const m=flat(new THREE.CircleGeometry(R,64),'cobble',R*.42,'radial');m.position.set(x,.021,z);fringeCircle(x,z,R);};
    const facing=(k,x,z,s,tx,tz,col)=>place(k,x,z,s,Math.atan2(tx-x,tz-z),col??s*.95);
    square(0,0,16.5);square(0,-24.5,6.4);square(-25,-13,5.6);
    street([[14.5,0],[20,1.6],[27,1.2],[36,0]],6);street([[0,-14.5],[-1,-19],[0,-21]],5.5,.024);street([[-14.5,1],[-20,3],[-26,4],[-32,3]],4.6,.026);
    street([[-24,3],[-25,-8]],4,.027);street([[1,14.5],[3,20],[2,27]],4.6,.028);
    // fountain at the heart of the square
    if(parts.__models&&parts.__models.fountain){const f=parts.__models.fountain.clone(true);const sz=f.userData.size;const k=7.5/Math.max(sz.x,sz.z);f.scale.setScalar(k);f.position.set(-f.userData.center.x*k,-f.userData.minY*k,-f.userData.center.z*k);
      f.traverse(o=>{if(o.isMesh){o.castShadow=shadows;o.receiveShadow=shadows;}});root.add(f);colliders.push({x:0,z:0,r:3.6});}else place('building_well_blue',0,0,3.2,0,1.6);
    // buildings, each turned to face its street
    // sizes are set so a house is about twice a hero's height
    facing('building_church_blue',0,-32,8.4,0,0,4.6);place('building_castle_blue',0,-54,11,0,0);
    facing('building_market_blue',12.5,-20,7,6,-9,3.6);facing('building_tavern_blue',20.5,11.5,7.2,15,4,3.8);facing('building_blacksmith_blue',22,-9.5,7,22,1.5,3.6);
    facing('building_home_A_blue',-19.5,-6.5,6.4,-19.5,3,3.2);facing('building_home_B_blue',-30.5,-5.5,6.4,-30.5,3.5,3.2);facing('building_home_B_blue',-19.5,12.5,6.4,-19.5,3,3.2);facing('building_home_A_blue',-30,12.5,6.4,-30,3.5,3.2);
    facing('building_home_A_blue',-31.5,-19,6,-25,-13,3);facing('building_home_B_blue',-18.5,-21.5,6,-25,-13,3);facing('building_home_A_blue',-10.5,-27,6,0,-24.5,3);facing('building_home_B_blue',11,-28.5,6,0,-24.5,3);
    facing('building_home_B_blue',10,25,6.4,2.5,22,3.2);facing('building_home_A_blue',-6.5,26,6.4,2,22,3.2);facing('building_home_A_blue',22,22,6,15,12,3);
    facing('building_tower_A_blue',26,-24,7,0,0,3.4);facing('building_tower_A_blue',-26.5,-26,7,0,0,3.4);facing('building_windmill_blue',-22,25,7.4,-10,14,3.6);
    // second, quieter centre: the well nook in the residential quarter
    place('building_well_blue',-25,-13,2.6,0,1.3);place('bucket_water',-23.2,-11.6,2.6,1,0);
    // props that say who works where (kept sparse)
    for(const a of [.785,2.356,3.927,5.498])deco('lamp',Math.cos(a)*14.6,Math.sin(a)*14.6,4.6,.35);
    for(const [x,z] of [[19,-4],[28,-3.6],[19,6],[28,5.6],[-4.6,-21],[4.6,-21],[-20,-1],[-28,7.6],[4.6,18],[-2.4,23]])deco('lamp',x,z,4.4,.35);
    deco('stall',6.5,-11.5,3.4,1.5);deco('stall',11.2,-7.6,3.4,1.5);deco('crates',15.5,-13.5,2.3,1);place('sack',8.8,-14,3,.4,0);place('barrel',14.8,-11,3,0,.6);
    place('weaponrack',15.5,-5.2,3.4,0,.7);deco('crates',26,-6,2.2,1);place('barrel',17.5,-9.5,3,1,.6);place('resource_lumber',25.5,-11.5,3,.5,1);
    place('barrel',23.5,8.5,3,0,.6);place('barrel',24.3,9.6,2.8,0,.5);deco('crates',24.5,13.5,2.2,1);
    place('flag_blue',-5.4,-27.5,5,0,.3);place('flag_blue',5.4,-27.5,5,0,.3);place('flag_blue',31.5,-4.8,5,0,.3);place('flag_blue',31.5,4.8,5,0,.3);deco('sign',29.5,4.4,3,.4);deco('sign',16.4,4.4,2.6,.35);
    deco('hay',-27,27,2.8,1.4);deco('hay',-17.5,28,2.4,1.2);place('wheelbarrow',-19,20.5,3.2,.8,.7);deco('crates',-26.5,19.5,2.2,1);
    // flower beds at the doors, garden trees, nothing in the middle of streets
    for(const [x,z] of [[-21.6,-1.4],[-16.4,-1.4],[-32.4,-.4],[-21.6,7.4],[-16.4,7.4],[-27,7.6],[7,20.6],[12,20.4],[-8.4,21.6],[-3.6,21.4],[-28.6,-14.6],[-21,-17],[3.6,-27],[-3.6,-27]])deco('flowers',x,z,1.25,0,false);
    for(const [x,z] of [[-23.4,-5.6],[-34,-1],[-23,12.6],[-33,13],[14,25.6],[-10.4,27],[9.2,-21],[15.8,-21.6],[24,15.6]])deco('bush',x,z,1.8,.5);
    for(const [x,z,k] of [[-33,-25,'oak'],[-13,-17,'pine'],[29,17,'oak'],[14,31,'oak'],[-14,31,'pine'],[29,-15,'pine'],[-31,22,'oak'],[18,-28,'oak'],[-11,16,'oak'],[11,16,'pine'],[-13,-12,'oak'],[30,-30,'pine'],[-3,31,'oak']])deco(k,x,z,7+rnd()*1.5,1);
    // town wall with the east gate
    for(let i=0;i<28;i++){const a=i/28*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.2)continue;const r=36;place('wall_straight',Math.cos(a)*r,Math.sin(a)*r,4.2,-a+Math.PI/2,0);colliders.push({x:Math.cos(a)*r,z:Math.sin(a)*r,r:4.2});}
    place('wall_straight_gate',36,0,4.2,Math.PI/2,0);
    for(let i=0;i<70;i++){const a=rnd()*Math.PI*2,r=41+rnd()*22;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.25)continue;place(rnd()<.5?'tree_single_A':'tree_single_B',Math.cos(a)*r,Math.sin(a)*r,4+rnd()*2,rnd()*6,0);}}
  else{// meadows: a winding dirt road, a stream with a bridge, copses of trees
    const road=[[-52,0],[-36,2],[-20,-2],[-4,2],[12,0],[26,6],[38,10]];for(let i=0;i<road.length-1;i++){const [ax,az]=road[i],[bx,bz]=road[i+1];const L=Math.hypot(bx-ax,bz-az);const m=flat(new THREE.PlaneGeometry(L+4,5),'dirt',[(L+4)/6,5/6],'strip');{const al=Math.atan2(bz-az,bx-ax);fringeStrip((ax+bx)/2,(az+bz)/2,L+4,5,Math.cos(al),Math.sin(al),Math.sin(al),-Math.cos(al));}m.position.set((ax+bx)/2,.021+i*.001,(az+bz)/2);m.rotation.z=-Math.atan2(bz-az,bx-ax);}
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
