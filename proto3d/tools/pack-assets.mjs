// Packs the KayKit CC0 source models into a few small files for the 3D prototype.
//   chars/<Name>.glb   – character meshes + rig, no animations (every KayKit character shares one rig)
//   anims.glb          – just the rig + the animation clips the game uses (shared by all characters)
//   weapons.glb        – one root node per weapon, named after its file
//   world.glb          – one root node per nature/prop/building model, named after its file
// Usage: node pack-assets.mjs <kaykit-checkout-dir> <out-dir>   (needs @gltf-transform/core, /functions)
import {NodeIO} from '@gltf-transform/core';
import {prune,dedup,mergeDocuments,unpartition} from '@gltf-transform/functions';
import fs from 'node:fs';import path from 'node:path';
const [SRC,OUT]=process.argv.slice(2);const io=new NodeIO();
const ADV=`${SRC}/KayKit-Character-Pack-Adventures-1.0/addons/kaykit_character_pack_adventures`;
const SKL=`${SRC}/KayKit-Character-Pack-Skeletons-1.0/addons/kaykit_character_pack_skeletons`;
const HEX=`${SRC}/KayKit-Medieval-Hexagon-Pack-1.0/addons/kaykit_medieval_hexagon_pack/Assets/gltf`;
fs.mkdirSync(`${OUT}/chars`,{recursive:true});
const KEEP=['Idle','Idle_Combat','2H_Melee_Idle','Walking_A','Walking_Backwards','Running_A','Running_B','Running_Strafe_Left','Running_Strafe_Right',
  '1H_Melee_Attack_Chop','1H_Melee_Attack_Slice_Diagonal','1H_Melee_Attack_Slice_Horizontal','1H_Melee_Attack_Stab','1H_Melee_Attack_Jump_Chop',
  '2H_Melee_Attack_Chop','2H_Melee_Attack_Slice','2H_Melee_Attack_Spin','2H_Melee_Attack_Spinning','2H_Melee_Attack_Stab',
  'Dualwield_Melee_Attack_Chop','Dualwield_Melee_Attack_Slice','Dualwield_Melee_Attack_Stab','1H_Ranged_Shoot','2H_Ranged_Shoot',
  'Spellcast_Shoot','Spellcast_Long','Spellcast_Raise','Spellcasting','Spellcast_Summon','Block','Blocking','Block_Hit','Hit_A','Hit_B',
  'Death_A','Death_B','Death_C_Skeletons','Dodge_Forward','Dodge_Backward','Dodge_Left','Dodge_Right','Jump_Full_Short','Cheer','Use_Item',
  'Spawn_Ground_Skeletons','Skeletons_Awaken_Standing','Unarmed_Melee_Attack_Punch_A','Unarmed_Melee_Attack_Kick','Interact','Sit_Floor_Idle','PickUp','Throw'];
function killAnim(a){for(const c of a.listChannels())c.dispose();for(const sm of a.listSamplers()){const i=sm.getInput(),o=sm.getOutput();sm.dispose();if(i&&!i.listParents().some(x=>x.propertyType!=='Root'))i.dispose();if(o&&!o.listParents().some(x=>x.propertyType!=='Root'))o.dispose();}a.dispose();}
async function stripAnims(src,dst){const doc=await io.read(src);for(const a of doc.getRoot().listAnimations())killAnim(a);await doc.transform(prune(),dedup());await io.write(dst,doc);return fs.statSync(dst).size;}
for(const n of ['Knight','Barbarian','Mage','Rogue','Rogue_Hooded'])console.log(n,await stripAnims(`${ADV}/Characters/gltf/${n}.glb`,`${OUT}/chars/${n}.glb`));
for(const n of ['Skeleton_Minion','Skeleton_Warrior','Skeleton_Rogue','Skeleton_Mage'])console.log(n,await stripAnims(`${SKL}/Characters/gltf/${n}.glb`,`${OUT}/chars/${n}.glb`));
{const doc=await io.read(`${SKL}/Characters/gltf/Skeleton_Warrior.glb`);const root=doc.getRoot();
  for(const a of root.listAnimations())if(!KEEP.includes(a.getName()))killAnim(a);
  for(const nd of root.listNodes()){if(nd.getMesh()){nd.setMesh(null);nd.setSkin(null);}}
  await doc.transform(prune({keepLeaves:true}),dedup());await io.write(`${OUT}/anims.glb`,doc);console.log('anims',fs.statSync(`${OUT}/anims.glb`).size,root.listAnimations().map(a=>a.getName()).length);}
async function bundle(files,dst){const out=await io.read(files[0]);rename(out,files[0]);
  for(const f of files.slice(1)){const d=await io.read(f);rename(d,f);mergeDocuments(out,d);}
  const scene=out.getRoot().listScenes()[0];for(const s of out.getRoot().listScenes().slice(1)){for(const c of s.listChildren())scene.addChild(c);s.dispose();}
  await out.transform(unpartition(),dedup(),prune());await io.write(dst,out);console.log(path.basename(dst),fs.statSync(dst).size,files.length);}
function rename(doc,f){const nm=path.basename(f).replace(/\.gltf$/,'');const sc=doc.getRoot().listScenes()[0];const kids=sc.listChildren();
  if(kids.length===1){kids[0].setName(nm);}else{const g=doc.createNode(nm);for(const k of kids){sc.removeChild(k);g.addChild(k);}sc.addChild(g);}}
const W=`${ADV}/Assets/gltf`;await bundle(['sword_1handed','sword_2handed','axe_1handed','axe_2handed','dagger','staff','wand','crossbow_1handed','crossbow_2handed','shield_round','shield_badge','shield_spikes','spellbook_open','arrow','quiver'].map(n=>`${W}/${n}.gltf`),`${OUT}/weapons.glb`);
const SW=`${SKL}/Assets/gltf`;await bundle(['Skeleton_Blade','Skeleton_Axe','Skeleton_Staff','Skeleton_Crossbow','Skeleton_Shield_Small_A','Skeleton_Shield_Large_A'].map(n=>`${SW}/${n}.gltf`),`${OUT}/skel_weapons.glb`);
const NAT=`${HEX}/decoration/nature`,PR=`${HEX}/decoration/props`,BN=`${HEX}/buildings/neutral`,BR=`${HEX}/buildings/red`;
const pick=(dir,re)=>fs.readdirSync(dir).filter(f=>f.endsWith('.gltf')&&re.test(f)).map(f=>`${dir}/${f}`);
await bundle([...pick(NAT,/^(trees?_|rock_single|mountain_[ABC](_grass_trees)?\.|hills_[AB]_trees|cloud_)/),...pick(PR,/^(barrel|crate_A_big|crate_open|tent|flag_red|wheelbarrow|resource_lumber|haybale|sack|bucket)/),
  ...pick(BN,/^(fence_wood_straight|fence_stone_straight|wall_straight|wall_straight_gate|building_destroyed|building_bridge_A)\./),...pick(BR,/^building_(tower_A|tavern|home_A|well|church)_red\./)],`${OUT}/world.glb`);
