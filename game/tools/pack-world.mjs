// Packs KayKit Medieval Hexagon (CC0) town + nature models into proto25d/assets/world.glb (one root node per model).
// Usage: node pack-world.mjs <kaykit-checkout-dir> <out-file>
import {NodeIO} from '@gltf-transform/core';import {prune,dedup,mergeDocuments,unpartition} from '@gltf-transform/functions';import fs from 'node:fs';import path from 'node:path';
const [SRC,OUT]=process.argv.slice(2);const io=new NodeIO();const HEX=`${SRC}/KayKit-Medieval-Hexagon-Pack-1.0/addons/kaykit_medieval_hexagon_pack/Assets/gltf`;
const pick=(dir,re)=>fs.readdirSync(dir).filter(f=>f.endsWith('.gltf')&&re.test(f)).map(f=>`${dir}/${f}`);
function rename(doc,f){const nm=path.basename(f).replace(/\.gltf$/,'');const sc=doc.getRoot().listScenes()[0];const kids=sc.listChildren();if(kids.length===1){kids[0].setName(nm);}else{const g=doc.createNode(nm);for(const k of kids){sc.removeChild(k);g.addChild(k);}sc.addChild(g);}}
const files=[...pick(`${HEX}/decoration/nature`,/^(tree_single_[AB]\.|trees_[AB]_(small|medium)|rock_single_|cloud_)/),...pick(`${HEX}/decoration/props`,/^(barrel|crate_A_big|crate_open|tent|flag_(red|blue|yellow)|wheelbarrow|resource_lumber|sack|weaponrack|target|bucket_water|pallet)/),
  ...pick(`${HEX}/buildings/neutral`,/^(fence_wood_straight|fence_stone_straight|wall_straight|wall_straight_gate|wall_corner_A_outside|building_bridge_A)\./),
  ...pick(`${HEX}/buildings/blue`,/^building_(tavern|home_A|home_B|well|church|market|blacksmith|windmill|tower_A|castle|watermill)_blue\./)];
const out=await io.read(files[0]);rename(out,files[0]);for(const f of files.slice(1)){const d=await io.read(f);rename(d,f);mergeDocuments(out,d);}
const scene=out.getRoot().listScenes()[0];for(const s of out.getRoot().listScenes().slice(1)){for(const c of s.listChildren())scene.addChild(c);s.dispose();}
await out.transform(unpartition(),dedup(),prune());await io.write(OUT,out);console.log(path.basename(OUT),fs.statSync(OUT).size,files.length);
