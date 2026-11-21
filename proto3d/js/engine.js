// Renderer, sky, light and the Whisperwood map (terrain, forest, camp, ruins), plus simple circle collision.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const MOBILE=matchMedia('(pointer:coarse)').matches||/Android|iPhone|iPad/i.test(navigator.userAgent);
export function createEngine(el,hi){
  const renderer=new THREE.WebGLRenderer({antialias:!MOBILE,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,MOBILE?1.5:2));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=hi;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();const FOG=new THREE.Color(0x3a3448);scene.fog=new THREE.FogExp2(FOG,0.0125);scene.background=FOG.clone();
  const fovFor=()=>innerWidth/innerHeight<1?68:55;const camera=new THREE.PerspectiveCamera(fovFor(),innerWidth/innerHeight,0.1,600);
  // sky dome: dusk gradient with a low, ember-coloured sun
  const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sun:{value:new THREE.Vector3(-0.7,0.18,-0.4).normalize()}},
    vertexShader:'varying vec3 vd;void main(){vd=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vd;uniform vec3 sun;void main(){float h=vd.y;vec3 top=vec3(.07,.07,.16),mid=vec3(.32,.22,.34),hor=vec3(.85,.42,.22);
      vec3 c=mix(hor,mid,smoothstep(-.02,.22,h));c=mix(c,top,smoothstep(.2,.75,h));float s=max(dot(vd,sun),0.);c+=vec3(1.,.55,.25)*pow(s,40.)*1.4+vec3(.9,.4,.2)*pow(s,6.)*.35;
      c=mix(c,vec3(.23,.2,.28),smoothstep(.0,-.25,h));gl_FragColor=vec4(c,1.);}`}));
  sky.renderOrder=-1;scene.add(sky);
  const hemi=new THREE.HemisphereLight(0x8a98d0,0x2e2818,1.35);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffb27a,2.4);sun.position.set(-60,40,-35);sun.castShadow=hi;
  if(hi){sun.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);const c=sun.shadow.camera;c.left=c.bottom=-32;c.right=c.top=32;c.near=1;c.far=160;sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.03;}
  scene.add(sun);scene.add(sun.target);
  const rim=new THREE.DirectionalLight(0x6a7ad8,0.55);rim.position.set(40,30,50);scene.add(rim);
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=fovFor();camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  return {renderer,scene,camera,sun,sky,hemi};
}

/* ---------- terrain ---------- */
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;const u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  const a=hash(xi,zi),b=hash(xi+1,zi),c=hash(xi,zi+1),d=hash(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,z){return vnoise(x,z)*.55+vnoise(x*2.1,z*2.1)*.28+vnoise(x*4.3,z*4.3)*.17;}
export const MAP={size:240,camp:new THREE.Vector2(-52,44),arena:new THREE.Vector2(56,-52),arenaR:17,
  path:[[-52,44],[-38,34],[-24,30],[-12,18],[-2,6],[6,-6],[18,-16],[30,-28],[42,-40],[56,-52]],
  spawns:[{x:-24,z:22,k:['minion','minion']},{x:-6,z:30,k:['minion','minion','minion']},{x:-30,z:4,k:['minion','warrior']},{x:6,z:10,k:['warrior','rogue']},
    {x:18,z:-2,k:['minion','minion','rogue']},{x:-6,z:-16,k:['warrior','mage']},{x:24,z:-30,k:['warrior','rogue','mage']},{x:38,z:-18,k:['mage','minion','minion']},{x:8,z:-34,k:['warrior','warrior']}]};
function distToPath(x,z){let best=1e9;const P=MAP.path;for(let i=0;i<P.length-1;i++){const [ax,az]=P[i],[bx,bz]=P[i+1];const dx=bx-ax,dz=bz-az;const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));const ex=ax+dx*t-x,ez=az+dz*t-z;best=Math.min(best,Math.hypot(ex,ez));}return best;}
export function height(x,z){const r=Math.hypot(x,z);let h=(fbm(x*.035,z*.035)-.5)*5.2+(fbm(x*.11+40,z*.11)-.5)*1.1;
  h+=Math.max(0,r-82)*0.32+Math.max(0,r-100)*0.6;   // the valley rises into hills at the edge
  const flat=(cx,cz,R,fall)=>{const d=Math.hypot(x-cx,z-cz);return d<R?1:d<R+fall?1-(d-R)/fall:0;};
  const fc=flat(MAP.camp.x,MAP.camp.y,10,10),fa=flat(MAP.arena.x,MAP.arena.y,MAP.arenaR+2,10),fp=Math.max(0,1-distToPath(x,z)/7)*0.6;
  const f=Math.max(fc,fa,fp);return h*(1-f)+(fa>fc?-0.4:0.2)*f;}
function groundColor(x,z,h){const dp=distToPath(x,z),da=Math.hypot(x-MAP.arena.x,z-MAP.arena.y),dc=Math.hypot(x-MAP.camp.x,z-MAP.camp.y);
  const n=fbm(x*.08,z*.08),n2=vnoise(x*.6,z*.6);
  let c=new THREE.Color().setRGB(.16+n*.07,.24+n*.1,.11+n*.04);              // moss / grass
  if(n2>.72)c.lerp(new THREE.Color(.26,.24,.12),.4);                          // dry patches
  const dirt=new THREE.Color(.30,.23,.15);const pw=Math.max(0,1-dp/3.6);c.lerp(dirt,Math.min(1,pw*1.3));
  if(dc<13)c.lerp(dirt,Math.max(0,1-dc/13)*.75);
  if(da<MAP.arenaR+1){const stone=new THREE.Color(.27,.26,.27).multiplyScalar(.8+n2*.4);c.lerp(stone,Math.min(1,(MAP.arenaR+1-da)/3));}
  if(h>3)c.lerp(new THREE.Color(.24,.24,.2),Math.min(1,(h-3)/8));
  return c;}

function detailTexture(){const s=256,cv=document.createElement('canvas');cv.width=cv.height=s;const g=cv.getContext('2d');const im=g.createImageData(s,s);
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){const v=200+ (vnoise(x*.09,y*.09)-.5)*70+(hash(x,y)-.5)*55;const i=(y*s+x)*4;im.data[i]=im.data[i+1]=im.data[i+2]=Math.max(0,Math.min(255,v));im.data[i+3]=255;}
  g.putImageData(im,0,0);const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(70,70);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}

/* ---------- world ---------- */
export function buildWorld(scene,parts,hi){
  const S=MAP.size,seg=MOBILE?150:200;const geo=new THREE.PlaneGeometry(S,S,seg,seg);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,col=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),h=height(x,z);pos.setY(i,h);const c=groundColor(x,z,h);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,map:detailTexture(),roughness:1,metalness:0}));ground.receiveShadow=hi;scene.add(ground);
  const colliders=[];const statics=[];let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const place=(name,x,z,s,ry,{col=0,shadow=true,sink=0}={})=>{const src=parts[name];if(!src)return null;const o=src.clone(true);o.position.set(x,height(x,z)-sink,z);o.scale.setScalar(s);o.rotation.y=ry||0;o.updateMatrixWorld(true);
    o.traverse(m=>{if(m.isMesh){statics.push({m,shadow});}});if(col)colliders.push({x,z,r:col});return o;};
  const clear=(x,z)=>{const dc=Math.hypot(x-MAP.camp.x,z-MAP.camp.y),da=Math.hypot(x-MAP.arena.x,z-MAP.arena.y);
    if(dc<17||da<MAP.arenaR+5||distToPath(x,z)<5.5)return false;for(const s of MAP.spawns)if(Math.hypot(x-s.x,z-s.z)<6)return false;return true;};
  // forest: denser towards the edge of the valley
  const treeKinds=['tree_single_A','tree_single_B','tree_single_A','tree_single_B','trees_A_medium','trees_B_medium','trees_A_small','trees_B_small','trees_B_large'];
  for(let i=0;i<(MOBILE?420:620);i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*104;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(!clear(x,z))continue;
    const edge=r>78;if(!edge&&rnd()<.45)continue;const k=treeKinds[Math.floor(rnd()*treeKinds.length)];const single=k.startsWith('tree_single');
    const s=single?(4.2+rnd()*2.4):(3.4+rnd()*1.6);place(k,x,z,s,rnd()*6.28,{col:single?0.55*s*0.5:1.6*s*.5,sink:.1});}
  for(let i=0;i<70;i++){const a=rnd()*Math.PI*2,r=8+rnd()*92;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(!clear(x,z))continue;const s=4+rnd()*6;place('rock_single_'+'ABCDE'[Math.floor(rnd()*5)],x,z,s,rnd()*6.28,{col:.14*s,sink:.2});}
  // mountains closing the valley
  for(let i=0;i<34;i++){const a=i/34*Math.PI*2+rnd()*.08,r=112+rnd()*14;const k=['mountain_A_grass_trees','mountain_B_grass_trees','mountain_C_grass_trees','mountain_A','mountain_B','hills_A_trees','hills_B_trees'][Math.floor(rnd()*7)];
    place(k,Math.cos(a)*r,Math.sin(a)*r,20+rnd()*12,rnd()*6.28,{shadow:false,sink:2});}
  // camp
  const C=MAP.camp;place('tent',C.x-7,C.y+7,5.6,0.6,{col:1.9});place('tent',C.x+6,C.y+8,5.2,-0.5,{col:1.8});
  for(const [dx,dz,k,s] of [[-7,-2,'barrel',5],[-7.8,-0.6,'barrel',5],[6.5,-3,'crate_A_big',5],[7.4,-2,'crate_A_big',4.4],[2,8.5,'resource_lumber',5],[-2,-7,'wheelbarrow',5],[-9,5,'flag_red',9]])place(k,C.x+dx,C.y+dz,s,dx,{col:k==='flag_red'?.3:1});
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;if(i===7||i===8)continue;place('fence_wood_straight',C.x+Math.cos(a)*14,C.y+Math.sin(a)*14,3.6,-a,{col:1});}
  // ruined arena
  const A=MAP.arena;for(let i=0;i<14;i++){const a=i/14*Math.PI*2;if(i===10||i===11)continue;const r=MAP.arenaR+1.6;place(i%4===1?'building_destroyed':'wall_straight',A.x+Math.cos(a)*r,A.y+Math.sin(a)*r,i%4===1?4:4.2,-a+Math.PI/2,{col:3.4,sink:.3});}
  place('building_tower_A_red',A.x+MAP.arenaR+8,A.y-6,6,1,{col:3.2});place('building_church_red',A.x+6,A.y-MAP.arenaR-9,5.5,0.4,{col:4.4});
  // merge statics per material: a few draw calls instead of thousands
  const byMat=new Map();for(const {m,shadow} of statics){const key=m.material.uuid+(shadow?'s':'');if(!byMat.has(key))byMat.set(key,{mat:m.material,shadow,geos:[]});
    const g=m.geometry.clone();g.applyMatrix4(m.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));byMat.get(key).geos.push(g.index?g.toNonIndexed():g);}
  for(const {mat,shadow,geos} of byMat.values()){const merged=mergeGeometries(geos,false);if(!merged)continue;const mesh=new THREE.Mesh(merged,mat);mesh.castShadow=hi&&shadow;mesh.receiveShadow=hi;scene.add(mesh);}
  // grass tufts
  const tuft=new THREE.BufferGeometry();{const p=[],c=[];for(let k=0;k<3;k++){const a=k*2.1,dx=Math.cos(a)*.35,dz=Math.sin(a)*.35,lx=Math.cos(a+1.57)*.06,lz=Math.sin(a+1.57)*.06;
      p.push(-lx,0,-lz,lx,0,lz,dx,.75+k*.12,dz);c.push(.08,.14,.05,.08,.14,.05,.26,.4,.14);}tuft.setAttribute('position',new THREE.Float32BufferAttribute(p,3));tuft.setAttribute('color',new THREE.Float32BufferAttribute(c,3));tuft.computeVertexNormals();}
  const nG=MOBILE?2600:6000;const grass=new THREE.InstancedMesh(tuft,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),nG);const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3();let gi=0;
  for(let i=0;i<nG*3&&gi<nG;i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*85;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(distToPath(x,z)<2.6||Math.hypot(x-MAP.arena.x,z-MAP.arena.y)<MAP.arenaR)continue;
    Q.setFromAxisAngle(V.set(0,1,0),rnd()*6.28);const s=.45+rnd()*.55;M.compose(V.set(x,height(x,z)-.05,z),Q,new THREE.Vector3(s,s*(0.8+rnd()*.6),s));grass.setMatrixAt(gi++,M);}
  grass.count=gi;scene.add(grass);
  // campfire + arena braziers
  const fires=[];const addFire=(x,z,scale,light)=>{const y=height(x,z);const g=new THREE.Group();g.position.set(x,y,z);
    const logs=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1.3,6),new THREE.MeshStandardMaterial({color:0x3a2414,roughness:1}));for(let i=0;i<3;i++){const l=logs.clone();l.rotation.z=Math.PI/2;l.rotation.y=i*1.05;l.position.y=.1;g.add(l);}
    const flame=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:0xff8a3a,blending:THREE.AdditiveBlending,depthWrite:false}));flame.scale.set(2.2*scale,2.8*scale,1);flame.position.y=.9*scale;g.add(flame);
    let L=null;if(light){L=new THREE.PointLight(0xff8a3a,30,22,1.6);L.position.y=1.6;g.add(L);}scene.add(g);fires.push({flame,L,base:30,scale});return g;};
  addFire(C.x,C.y,1,true);
  for(const a of [0.5,2.6,4.4]){const r=MAP.arenaR-2;const x=A.x+Math.cos(a)*r,z=A.y+Math.sin(a)*r;const b=new THREE.Mesh(new THREE.CylinderGeometry(.5,.35,1.4,8),new THREE.MeshStandardMaterial({color:0x2a2a30,roughness:.8}));b.position.set(x,height(x,z)+.7,z);b.castShadow=hi;scene.add(b);
    const f=addFire(x,z,1.2,a===2.6);f.position.y+=1.4;f.children.forEach(c=>{if(c.isSprite)c.material.color.set(0x8a6aff);});if(f.children.find(c=>c.isPointLight))f.children.find(c=>c.isPointLight).color.set(0x8a6aff);}
  // drifting embers / fireflies
  const nP=MOBILE?220:420;const pg=new THREE.BufferGeometry();const pp=new Float32Array(nP*3);for(let i=0;i<nP;i++){const a=rnd()*6.28,r=Math.sqrt(rnd())*90;pp[i*3]=Math.cos(a)*r;pp[i*3+2]=Math.sin(a)*r;pp[i*3+1]=height(pp[i*3],pp[i*3+2])+1+rnd()*6;}
  pg.setAttribute('position',new THREE.BufferAttribute(pp,3));const motes=new THREE.Points(pg,new THREE.PointsMaterial({map:glowTex(),size:.5,color:0xffc070,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(motes);
  return {colliders,fires,motes,ground};
}
let _glow=null;export function glowTex(){if(_glow)return _glow;const s=64,cv=document.createElement('canvas');cv.width=cv.height=s;const g=cv.getContext('2d');const gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,240,200,.8)');gr.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=gr;g.fillRect(0,0,s,s);_glow=new THREE.CanvasTexture(cv);_glow.colorSpace=THREE.SRGBColorSpace;return _glow;}
export function collide(p,r,colliders){for(const c of colliders){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),m=r+c.r;if(d<m&&d>1e-4){p.x=c.x+dx/d*m;p.z=c.z+dz/d*m;}}
  const R=Math.hypot(p.x,p.z);if(R>98){p.x*=98/R;p.z*=98/R;}}
export function pathDist(x,z){return distToPath(x,z);}
