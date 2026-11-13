/* ETERNAL REALMS — Expansion I "Storms & Shadows": classes, enemies, bosses, dungeons, sets, shops, quests, events.
   Loaded right after data.js (before engine.js builds the travel graph). */
'use strict';
/* ---------- new weapon types ---------- */
Object.assign(MASTERY,{lute:{n:'Instruments',t:'weapon'},totem:{n:'Staff',t:'alias',of:'staff'},scythe:{n:'Axe',t:'alias',of:'axe'},crossbow:{n:'Bow',t:'alias',of:'bow'},warhammer:{n:'Mace',t:'alias',of:'mace'}});
MASTERY_KEYS.splice(0,MASTERY_KEYS.length,...Object.keys(MASTERY).filter(k=>MASTERY[k].t!=='alias'));
WEAPON_M.push('lute');
Object.assign(ITEM_BASES,{
  lute:{n:'Lute',t:'weapon',wt:'lute',a:0.45,m:1.1,sl:'weapon',two:1,ranged:1},
  totem:{n:'Totem',t:'weapon',wt:'totem',a:0.6,m:0.95,sl:'weapon'},
  scythe:{n:'Scythe',t:'weapon',wt:'scythe',a:1.05,m:0.7,sl:'weapon',two:1,reach:1,crit:3},
  crossbow:{n:'Crossbow',t:'weapon',wt:'crossbow',a:1.2,sl:'weapon',two:1,ranged:1,spd:-2,crit:4},
  rapier:{n:'Rapier',t:'weapon',wt:'sword',a:0.9,sl:'weapon',crit:5,spd:2},
  warhammer:{n:'Warhammer',t:'weapon',wt:'warhammer',a:1.38,m:0.2,sl:'weapon',two:1,spd:-3},
  cloak:{n:'Cloak',t:'acc',sl:'amulet',acc:1}
});
const MAGIC_WT=['staff','orb','lute','totem'];
Object.assign(STARTER,{lute_wood:['lute',1],totem_wood:['totem',1],scythe_iron:['scythe',1],crossbow_light:['crossbow',1]});

/* ---------- new classes ---------- */
Object.assign(CLASSES,{
  bard:{name:'Bard',role:'support',growth:{dex:1,wis:1},weapons:['lute','dagger','sword','rapier'],armor:'leather',start:['lute_wood','chest_leather'],mastery:{lute:8,arcane:3},skills:['ballad_valor','discord','lullaby','encore'],desc:'Songs that strengthen allies and unravel enemies. Great in a party.'},
  shaman:{name:'Shaman',role:'healer',growth:{wis:1,str:1},weapons:['totem','mace','axe'],armor:'leather',start:['totem_wood','chest_leather'],mastery:{nature:4,lightning:5},skills:['lightning_lash','healing_totem','spirit_link','earthquake'],desc:'Speaks with storm and earth spirits. Heals and calls lightning.'},
  warlock:{name:'Warlock',role:'dps',growth:{int:2},weapons:['scythe','orb','dagger'],armor:'cloth',start:['scythe_iron','chest_cloth'],mastery:{shadow:6,fire:3},skills:['eldritch_blast','hex','soul_fire','dark_pact'],desc:'Power bought from things beyond the sky. Curses and dark fire.'},
  artificer:{name:'Artificer',role:'support',growth:{int:1,dex:1},weapons:['crossbow','mace','warhammer'],armor:'leather',start:['crossbow_light','chest_leather'],mastery:{bow:4,enchanting:6,smithing:6},skills:['bolt_shot','repair_kit','flashbang','deploy_turret'],desc:'Dwarf-taught tinkerer. Crossbows, gadgets and clockwork turrets.'},
  ranger:{name:'Ranger',role:'dps',growth:{dex:1,agi:1},weapons:['bow','crossbow','spear','dagger'],armor:'leather',start:['bow_short','chest_leather'],mastery:{bow:5,nature:3},skills:['twin_arrows','snare','camouflage','volley'],comp:'wolf',desc:'Wilderness scout who fights beside a wolf companion.'}
});
Object.assign(CLASS_PRIO_EXT={},{bard:['dex','wis','luck'],shaman:['wis','str','vit'],warlock:['int','vit','wis'],artificer:['int','dex','vit'],ranger:['dex','agi','vit']});
var CLASS_PRIO_EXT;
Object.assign(ADV_CLASSES,{
  skald:{name:'Skald',from:['bard'],lvl:35,req:{lute:35},trial:'trial_skald',mentor:'saltmere',growth:{dex:1,wis:1,str:1},skills:['war_song','thunder_chord'],desc:'Battle-poet of the northern halls.'},
  stormcaller:{name:'Stormcaller',from:['shaman','druid'],lvl:40,req:{lightning:40},trial:'trial_storm',mentor:'pawhaven',growth:{wis:1,int:2},skills:['storm_call','eye_of_storm'],desc:'Calls down the storm itself.'},
  hexlord:{name:'Hexlord',from:['warlock','necromancer'],lvl:40,req:{shadow:40},trial:'trial_hex',mentor:'duskhaven',growth:{int:2,wis:1},skills:['doom','plague_hex'],desc:'Master of curses that never lift.'},
  machinist:{name:'Machinist',from:['artificer'],lvl:40,req:{enchanting:30,bow:30},trial:'trial_machine',mentor:'deepforge',growth:{int:1,dex:1,end:1},skills:['siege_bolt','clockwork_army'],desc:'Builds an army of brass and steam.'},
  warden:{name:'Warden',from:['ranger','druid','archer'],lvl:35,req:{bow:30,nature:25},trial:'trial_warden',mentor:'thornvale',growth:{dex:1,wis:1,agi:1},skills:['natures_wrath','hunters_bond'],desc:'Sworn protector of the Old Green.'}
});
Object.assign(SKILLS,{
  ballad_valor:{n:'Ballad of Valor',k:'buff',c:[12,0],cd:4,tg:'allies',st:['might',1,3],m:'lute',d:'Party +25% attack for 3 turns.'},
  discord:{n:'Discord',k:'mag',c:[8,0],cd:0,p:1.2,tg:'enemy',e:'arcane',st:['weaken',0.3,2],m:'lute',d:'Jarring chord that may weaken.'},
  lullaby:{n:'Lullaby',k:'debuff',c:[18,0],cd:4,tg:'all',st:['stun',0.4,1],m:'lute',d:'May put every enemy to sleep.',lv:5},
  encore:{n:'Encore',k:'heal',c:[25,0],cd:3,p:0.9,tg:'allies',m:'lute',d:'Uplifting song heals the party.',lv:12},
  lightning_lash:{n:'Lightning Lash',k:'mag',c:[8,0],cd:0,p:1.3,tg:'enemy',e:'lightning',m:'lightning',d:'A crackling whip of lightning.'},
  healing_totem:{n:'Healing Totem',k:'buff',c:[16,0],cd:4,tg:'allies',st:['regen',1,4],m:'nature',d:'Party regenerates for 4 turns.',lv:5},
  spirit_link:{n:'Spirit Link',k:'heal',c:[14,0],cd:1,p:1.5,tg:'ally',m:'nature',d:'Mend an ally through the spirits.',lv:1},
  earthquake:{n:'Earthquake',k:'mag',c:[35,0],cd:4,p:1.6,tg:'all',e:'nature',st:['slow',0.6,2],m:'nature',d:'Shake the ground under every foe.',lv:20},
  eldritch_blast:{n:'Eldritch Blast',k:'mag',c:[8,0],cd:0,p:1.4,tg:'enemy',e:'shadow',m:'shadow',d:'Beam of otherworldly force.'},
  hex:{n:'Hex',k:'debuff',c:[12,0],cd:3,tg:'enemy',st:['marked',1,4],m:'shadow',d:'Target takes +30% damage.',lv:5},
  soul_fire:{n:'Soul Fire',k:'mag',c:[22,0],cd:2,p:1.9,tg:'enemy',e:'fire',st:['burn',0.7,3],m:'fire',d:'Green flame that burns the soul.',lv:12},
  dark_pact:{n:'Dark Pact',k:'buff',c:[0,0],cd:5,tg:'self',st:['focus',1,4],self:0.12,d:'Pay 12% HP for +40% magic attack.',lv:20},
  bolt_shot:{n:'Bolt Shot',k:'phys',c:[0,10],cd:1,p:1.6,tg:'enemy',acc:15,d:'Heavy crossbow bolt.'},
  repair_kit:{n:'Field Repair',k:'heal',c:[10,8],cd:2,p:1.3,tg:'ally',d:'Patch up an ally.',lv:5},
  flashbang:{n:'Flashbang',k:'debuff',c:[0,16],cd:4,tg:'all',st:['blind',0.75,2],d:'Blinds every enemy.',lv:12},
  deploy_turret:{n:'Deploy Turret',k:'summon',c:[25,10],cd:7,tg:'self',turret:1,d:'Clockwork turret fights for you.',lv:20},
  twin_arrows:{n:'Twin Arrows',k:'phys',c:[0,12],cd:1,p:0.85,hits:2,tg:'enemy',d:'Two arrows at once.'},
  snare:{n:'Snare',k:'debuff',c:[0,10],cd:3,tg:'enemy',st:['root',0.9,3],d:'Root the target in place.',lv:5},
  camouflage:{n:'Camouflage',k:'buff',c:[0,14],cd:5,tg:'self',st:['stealth',1,2],d:'Next shot crits; enemies miss more.',lv:12},
  volley:{n:'Volley',k:'phys',c:[0,24],cd:3,p:1.1,tg:'all',d:'Rain arrows on all enemies.',lv:20},
  war_song:{n:'War Song',k:'buff',c:[40,0],cd:6,tg:'allies',st:['haste',1,3],d:'Party acts with haste.'},
  thunder_chord:{n:'Thunder Chord',k:'mag',c:[45,0],cd:4,p:2.3,tg:'all',e:'lightning',st:['stun',0.3,1],d:'A chord that splits the sky.'},
  storm_call:{n:'Storm Call',k:'mag',c:[60,0],cd:4,p:2.8,tg:'all',e:'lightning',m:'lightning',d:'Lightning strikes every foe.'},
  eye_of_storm:{n:'Eye of the Storm',k:'buff',c:[35,0],cd:6,tg:'allies',st:['ward',1,3],d:'Party immune to harmful effects.'},
  doom:{n:'Doom',k:'mag',c:[55,0],cd:4,p:3.6,tg:'enemy',e:'shadow',m:'shadow',d:'Inevitable death.'},
  plague_hex:{n:'Plague Hex',k:'mag',c:[45,0],cd:4,p:1.5,tg:'all',e:'poison',st:['poison',0.9,4],d:'Rotting curse on all foes.'},
  siege_bolt:{n:'Siege Bolt',k:'phys',c:[0,40],cd:4,p:3.4,tg:'enemy',acc:30,d:'Ballista-grade bolt.'},
  clockwork_army:{n:'Clockwork Army',k:'summon',c:[60,20],cd:8,tg:'self',turret:3,d:'Deploy three turrets.'},
  natures_wrath:{n:'Nature\'s Wrath',k:'mag',c:[45,0],cd:4,p:2.2,tg:'all',e:'nature',st:['root',0.5,2],m:'nature',d:'Roots and thorns erupt.'},
  hunters_bond:{n:'Hunter\'s Bond',k:'buff',c:[0,30],cd:5,tg:'allies',st:['might',1,4],d:'Party and beasts +25% attack.'},
  t_lute1:{n:'Dissonant Chord',k:'mag',c:[12,0],cd:1,p:1.5,tg:'enemy',e:'arcane',m:'lute',lv:15,tech:1},
  t_lute2:{n:'Requiem',k:'mag',c:[30,0],cd:3,p:1.3,tg:'all',e:'shadow',m:'lute',lv:40,tech:1},
  t_lute3:{n:'Song of Ages',k:'heal',c:[50,0],cd:5,p:2.2,tg:'allies',m:'lute',lv:75,tech:1}
});
STATUS.blind=STATUS.blind||{n:'Blinded',bad:1};

/* ---------- new items ---------- */
Object.assign(ITEMS,{
  venom_flask:{n:'Venom Flask',t:'con',bomb:1,e:'poison',dmg:55,v:40},frost_bomb:{n:'Frost Bomb',t:'con',bomb:1,e:'frost',dmg:70,v:45},thunder_bomb:{n:'Thunder Jar',t:'con',bomb:1,e:'lightning',dmg:85,v:60},
  elixir_haste:{n:'Quicksilver Elixir',t:'con',buff:'haste',v:90},elixir_focus:{n:'Sage\'s Draught',t:'con',buff:'focus',v:80},scroll_ward:{n:'Scroll of Warding',t:'con',buff:'ward',v:70},
  fish_feast:{n:'Fisherman\'s Feast',t:'food',heal:260,stam:80,v:40,wellfed:1},honey_cake:{n:'Halfling Honey Cake',t:'food',heal:90,mana:40,v:14,wellfed:1},
  storm_crystal:{n:'Storm Crystal',t:'mat',v:60},roc_feather:{n:'Roc Feather',t:'mat',v:70},kraken_ink:{n:'Kraken Ink',t:'mat',v:600},worm_scale:{n:'Sandworm Plate',t:'mat',v:550},
  heartwood:{n:'Heartwood Core',t:'mat',v:400},void_essence:{n:'Void Essence',t:'mat',v:1200},gem_shard:{n:'Prismatic Shard',t:'mat',v:55},goblin_crown:{n:'Snagtooth\'s Crown',t:'mat',v:160},
  demon_horn:{n:'Imp Horn',t:'mat',v:30},pirate_coin:{n:'Doubloon',t:'mat',v:25},werewolf_fang:{n:'Moonfang Tooth',t:'mat',v:45},
  tome_lute:{n:'Songbook: Instruments',t:'tome',school:'lute',v:120},
  invasion_badge:{n:'Defender\'s Badge',t:'misc',v:150}
});
RECIPES.push(
  {id:'r_venom_flask',n:'Mix Venom Flask',m:'alchemy',lv:20,in:{venom:2,herb_bog:1},out:'venom_flask'},
  {id:'r_frost_bomb',n:'Mix Frost Bomb',m:'alchemy',lv:22,in:{crystal_frost:1,herb_frost:1},out:'frost_bomb'},
  {id:'r_thunder_bomb',n:'Mix Thunder Jar',m:'alchemy',lv:35,in:{storm_crystal:1,ore_copper:2},out:'thunder_bomb'},
  {id:'r_elixir_haste',n:'Brew Quicksilver Elixir',m:'alchemy',lv:40,in:{roc_feather:1,herb_moon:2},out:'elixir_haste'},
  {id:'r_elixir_focus',n:'Brew Sage\'s Draught',m:'alchemy',lv:30,in:{crystal_mana:2,herb_moon:1},out:'elixir_focus'},
  {id:'r_fish_feast',n:'Cook Fisherman\'s Feast',m:'cooking',lv:30,in:{fish_eel:2,fish_trout:2,herb_sun:1},out:'fish_feast'},
  {id:'r_honey_cake',n:'Bake Honey Cake',m:'cooking',lv:12,in:{herb_sun:2,meat:1},out:'honey_cake'},
  {id:'r_ench_storms',n:'Enchant: Storms',m:'enchanting',lv:25,in:{storm_crystal:2},ench:'storms'},
  {id:'r_ench_dawn',n:'Enchant: Dawn',m:'enchanting',lv:35,in:{crystal_mana:2,heartwood:1},ench:'dawn'}
);
Object.assign(UNIQUES,{
  snagtooth:{n:'Snagtooth\'s Shiv',b:'dagger',aff:['keen','precise','fox'],lore:'The Goblin King\'s favorite stabbing stick.'},
  prism_staff:{n:'Prism of Seraxis',b:'staff',aff:['arcane','owl','warding','storms'],lore:'Refracts spells into rainbows of pain.'},
  vyrax_fang:{n:'Fang of Vyrax',b:'scythe',aff:['vampiric','night','keen','precise'],lore:'Harvested from the Broodmother herself.'},
  roc_bow:{n:'Stormwing Longbow',b:'crossbow',aff:['storms','storms','precise','keen'],lore:'Strung with a roc\'s tendon.'},
  kraken_trident:{n:'Abyssal Trident',b:'spear',aff:['frost','mighty','titan','vampiric'],lore:'Pulled from the Kraken\'s beak.'},
  worm_hammer:{n:'Dunebreaker',b:'warhammer',aff:['mighty','mighty','bear','titan'],lore:'Carved from a sandworm\'s jaw.'},
  heartwood_lute:{n:'Heartwood Lute',b:'lute',aff:['blessed','owl','dawn','lucky'],lore:'The Elder Treant still hums in it.'},
  void_scythe:{n:'Herald\'s Edge',b:'scythe',aff:['night','night','arcane','keen'],lore:'It cuts holes in the sky.'},
  lionheart_blade:{n:'Dawnbreaker',b:'greatsword',aff:['dawn','dawn','mighty','sturdy'],lore:'Aldric Lionheart\'s lost sword.'},
  wanderer_cloak:{n:'Cloak of the Wanderer',b:'cloak',aff:['swift','fox','lucky','fortune'],lore:'Every road feels shorter.'}
});

/* ---------- equipment sets ---------- */
const SETS={
  lionguard:{n:'Lionguard',ac:'plate',two:{pdef:0.08},four:{mhp:0.12,patk:0.06},src:'Fort Grimward, Lionheart Armory'},
  starweave:{n:'Starweave',ac:'cloth',two:{matk:0.08},four:{mmp:0.2,matk:0.1},src:'Crystal Caverns, Starlit Arcanum'},
  shadowstalker:{n:'Shadowstalker',ac:'leather',two:{crit:5},four:{critDmg:25,eva:4},src:'Web Depths, Silk & Venom'},
  runebound:{n:'Runebound',ac:'plate',two:{mdef:0.12},four:{pdef:0.1,mhp:0.08},src:'Undervault, Ironbeard Runeworks'},
  tidecaller:{n:'Tidecaller',ac:'leather',two:{spd:4},four:{mhp:0.08,eva:3,matk:0.06},src:'Sunken Citadel, the Kraken'},
  stormborn:{n:'Stormborn',ac:'cloth',two:{mdef:0.08},four:{matk:0.12,spd:3},src:'Thunderhead Crags, Storm Roc'},
  dragonscale:{n:'Dragonscale',ac:'plate',two:{res_fire:20},four:{patk:0.1,mhp:0.1},src:'Ancient Red Dragon, Ashen Valley'}
};

/* ---------- new enemies & bosses ---------- */
Object.assign(MONSTERS,{
  hobgoblin:{n:'Hobgoblin Brute',cat:'humanoid',hp:1.4,at:1.2,df:1.1,b:['brute'],loot:[['goblin_ear',0.6,1]],g:1.4,gear:0.12},
  goblin_rider:{n:'Goblin Wolfrider',cat:'humanoid',hp:1.1,at:1.15,sp:1.4,b:['aggressive'],loot:[['pelt_wolf',0.4,1]],g:1.2,gear:0.1},
  bandit_mage:{n:'Renegade Hedge-Mage',cat:'humanoid',hp:0.8,at:0.9,md:1.3,e:'fire',b:['caster','surrender'],loot:[['crystal_mana',0.15,1]],g:2,gear:0.12},
  werewolf:{n:'Werewolf',cat:'beast',hp:1.5,at:1.4,df:1.0,sp:1.4,b:['aggressive','regen'],w:['holy'],loot:[['werewolf_fang',0.5,1],['pelt_wolf',0.6,1]],g:0.8,tame:'wolf'},
  ghoul:{n:'Ghoul',cat:'undead',hp:1.2,at:1.2,sp:1.2,b:['undead','pack'],w:['holy','fire'],r:['shadow','poison'],st:['weaken',0.25,2],loot:[['bone',0.6,1]],g:0.5},
  banshee:{n:'Banshee',cat:'undead',hp:1.0,at:1.2,md:1.6,ev:1.5,e:'shadow',b:['undead','caster'],w:['holy'],r:['shadow','frost','poison'],st:['stun',0.15,1],loot:[['ectoplasm',0.6,1]],g:1.2},
  imp:{n:'Imp',cat:'spirit',hp:0.7,at:1.0,md:1.2,ev:1.6,e:'fire',b:['caster','pack'],w:['frost','holy'],r:['fire'],loot:[['demon_horn',0.5,1]],g:0.8,tame:'imp'},
  hellhound:{n:'Hellhound',cat:'beast',hp:1.4,at:1.5,sp:1.3,e:'fire',b:['pack','aggressive'],w:['frost'],r:['fire'],st:['burn',0.3,2],loot:[['demon_horn',0.3,1]],g:0.6,tame:'hellhound'},
  lava_golem:{n:'Magma Golem',cat:'construct',hp:2.6,at:1.4,df:1.9,sp:0.5,e:'fire',b:['brute'],w:['frost'],r:['fire','poison'],loot:[['crystal_fire',0.8,2]],g:0.8},
  cultist:{n:'Cult of Vel Acolyte',cat:'humanoid',hp:0.9,at:0.9,md:1.4,e:'shadow',b:['caster','healer'],loot:[['ectoplasm',0.3,1]],g:2,gear:0.15},
  minotaur:{n:'Minotaur',cat:'beast',hp:1.9,at:1.4,df:1.3,b:['brute','aggressive'],loot:[['hide',0.8,2],['meat',0.8,3]],g:1.0},
  pirate:{n:'Blackwater Pirate',cat:'humanoid',hp:1.1,at:1.2,df:0.9,b:['surrender','ambush'],loot:[['pirate_coin',0.7,3],['jerky',0.2,1]],g:2.5,gear:0.15},
  merfolk:{n:'Merfolk Spearman',cat:'humanoid',hp:1.1,at:1.2,df:1.1,e:'frost',w:['lightning'],loot:[['pearl',0.3,1],['fish_eel',0.5,1]],g:1.2,gear:0.1},
  storm_elemental:{n:'Storm Elemental',cat:'elemental',hp:1.3,at:1.4,md:1.4,ev:1.3,e:'lightning',b:['caster'],r:['lightning'],w:['nature'],st:['stun',0.2,1],loot:[['storm_crystal',0.6,1]],g:0.5,tame:'stormling'},
  roc:{n:'Thunder Roc',cat:'beast',hp:1.6,at:1.5,sp:1.5,ev:1.3,e:'lightning',b:['aggressive'],loot:[['roc_feather',0.5,1]],g:0.6,tame:'roc'},
  crystal_golem:{n:'Crystal Golem',cat:'construct',hp:2.2,at:1.3,df:1.6,md:1.6,e:'arcane',w:['lightning'],r:['arcane','poison'],b:['brute'],loot:[['gem_shard',0.6,1],['crystal_mana',0.4,1]],g:0.8},
  crystal_spider:{n:'Prism Spider',cat:'beast',hp:1.0,at:1.2,ev:1.3,e:'arcane',st:['blind',0.3,2],b:['ambush'],loot:[['silk',0.6,1],['gem_shard',0.3,1]],g:0.4,tame:'spider'},
  web_stalker:{n:'Web Stalker',cat:'beast',hp:1.3,at:1.4,ev:1.4,e:'poison',st:['poison',0.4,3],b:['ambush'],loot:[['silk',0.8,2],['venom',0.5,1]],g:0.6,tame:'spider'},
  venom_priestess:{n:'Venom Priestess',cat:'humanoid',hp:1.1,at:1.0,md:1.5,e:'poison',r:['shadow','poison'],b:['caster','healer'],st:['poison',0.5,3],loot:[['venom',0.6,2]],g:3,gear:0.2},
  // dungeon bosses
  b_goblinking:{n:'Goblin King Snagtooth',cat:'humanoid',boss:1,hp:5,at:1.5,df:1.3,b:['boss','pack'],loot:[['goblin_crown',1,1]],g:15,gear:1,uniq:'snagtooth',set:'lionguard'},
  b_crystalqueen:{n:'Crystal Queen Seraxis',cat:'construct',boss:1,hp:6,at:1.5,df:1.6,md:1.8,e:'arcane',w:['lightning'],b:['boss','caster'],loot:[['gem_shard',1,4]],g:20,gear:1,uniq:'prism_staff',set:'starweave'},
  b_broodmother:{n:'Broodmother Vyrax',cat:'beast',boss:1,hp:7,at:1.7,df:1.4,e:'poison',st:['poison',0.6,3],b:['boss'],loot:[['silk',1,6],['venom',1,4]],g:30,gear:1,uniq:'vyrax_fang',set:'shadowstalker'},
  b_bandit_queen:{n:'Rask the Red-Handed',cat:'humanoid',boss:1,hp:6,at:1.6,df:1.4,b:['boss','surrender'],loot:[],g:25,gear:1,set:'lionguard'},
  // world bosses
  b_elder_treant:{n:'Elder Treant Oakenheart',cat:'spirit',boss:1,world:1,hp:30,at:1.8,df:2.0,e:'nature',w:['fire'],r:['nature','frost'],b:['boss','regen'],loot:[['heartwood',1,1],['wood_elder',1,6]],g:80,gear:2,uniq:'heartwood_lute'},
  b_storm_roc:{n:'Storm Roc Kaelthar',cat:'beast',boss:1,world:1,hp:38,at:2.0,df:1.7,e:'lightning',st:['stun',0.25,1],r:['lightning'],b:['boss'],loot:[['roc_feather',1,4],['storm_crystal',1,4]],g:130,gear:2,uniq:'roc_bow',set:'stormborn'},
  b_sandworm:{n:'Sandworm Colossus',cat:'beast',boss:1,world:1,hp:55,at:2.2,df:2.4,r:['poison'],w:['frost'],b:['boss','brute'],loot:[['worm_scale',1,1],['sand_amber',1,6]],g:220,gear:3,uniq:'worm_hammer'},
  b_kraken:{n:'The Kraken of Tidecall',cat:'beast',boss:1,world:1,hp:58,at:2.3,df:2.0,e:'frost',w:['lightning'],r:['frost'],b:['boss'],loot:[['kraken_ink',1,1],['pearl',1,6]],g:250,gear:3,uniq:'kraken_trident',set:'tidecaller'},
  b_voidherald:{n:'Void Herald Ysz\'Thul',cat:'spirit',boss:1,world:1,hp:65,at:2.6,df:2.3,md:2.6,e:'shadow',w:['holy','arcane'],r:['shadow'],b:['boss','caster'],loot:[['void_essence',1,1],['crystal_void',1,6]],g:400,gear:3,uniq:'void_scythe'},
  // invasion
  warlord_inv:{n:'Invasion Warlord',cat:'humanoid',boss:1,hp:5,at:1.6,df:1.4,b:['boss','aggressive'],loot:[['invasion_badge',1,1]],g:30,gear:1}
});
MONSTERS.b_dragon.set='dragonscale';MONSTERS.b_colossus.set='runebound';MONSTERS.b_tidelord.set='tidecaller';MONSTERS.b_banditlord.set='lionguard';
Object.assign(SPECIES,{
  imp:{n:'Impling',mon:'imp',evo:[25,'fiend']},fiend:{n:'Pit Fiend',mon:'imp',mult:1.5,evo:[55,'archfiend']},archfiend:{n:'Archfiend',mon:'hellhound',mult:2.0},
  hellhound:{n:'Hellpup',mon:'hellhound',evo:[40,'cerberus']},cerberus:{n:'Cerberus',mon:'hellhound',mult:1.8},
  stormling:{n:'Stormling',mon:'storm_elemental',evo:[45,'tempest']},tempest:{n:'Living Tempest',mon:'storm_elemental',mult:1.7},
  roc:{n:'Roc Chick',mon:'roc',evo:[40,'stormroc']},stormroc:{n:'Storm Roc',mon:'roc',mult:1.8}
});

/* ---------- new places ---------- */
Object.assign(LOCS,{
  warrens:{n:'Goblin Warrens',ty:'dungeon',x:150,y:250,f:null,lv:[6,11],mon:['goblin','goblin_archer','goblin_shaman','hobgoblin','goblin_rider'],res:[['ore_copper','mining']],boss:'b_goblinking',floors:3,
    d:'A maze of tunnels under Whisperwood where the goblin tribes crown their kings in stolen tin.',feat:['A throne of shields','Cages of stolen sheep','A crude map of Brookhollow with X marks']},
  crystalcaves:{n:'Crystal Caverns',ty:'dungeon',x:405,y:110,f:null,lv:[16,22],mon:['crystal_golem','crystal_spider','wisp','slime'],res:[['gem_shard','mining'],['crystal_mana','mining']],boss:'b_crystalqueen',floors:3,
    d:'Caves under Crystal Lake where the singing crystals grow into living things.',feat:['A chamber that echoes your voice back wrong','Frozen adventurers inside crystal','A prismatic waterfall']},
  webdepths:{n:'Web Depths',ty:'dungeon',x:610,y:405,f:null,lv:[30,38],mon:['web_stalker','venom_priestess','drider','spider','dark_scout'],res:[['silk','herbalism']],boss:'b_broodmother',floors:4,
    d:'The forbidden spider caverns below Duskhaven, where heretic priestesses breed monsters.',feat:['Cocoons that still move','A heretic shrine','Silk bridges over a void']},
  crags:{n:'Thunderhead Crags',ty:'lair',x:690,y:85,f:null,lv:[40,48],mon:['storm_elemental','roc','harpy','yeti'],res:[['storm_crystal','mining'],['herb_frost','herbalism']],
    d:'Jagged peaks that pierce the storm clouds. Lightning strikes here every minute.',feat:['A lightning-scarred obelisk','A roc nest of bones','Glass formed by lightning strikes']}
});
ROUTES.push(['whisperwood','warrens',1],['crystallake','crystalcaves',2],['duskhaven','webdepths',2],['skyreach','crags',3],['khazgard','crags',4]);
for(const [l,ms] of Object.entries({greenmarch:['bandit'],whisperwood:['werewolf'],watchtower:['bandit_mage'],mine:['ghoul'],ember:['imp'],aethermoor:['cultist','minotaur'],necropolis:['ghoul','banshee'],
  ashen:['hellhound','lava_golem'],cove:['pirate'],isles:['merfolk','pirate'],tomb:['minotaur'],mire:['banshee'],frostpeak:['roc'],spire:['imp'],moonfall:['werewolf'],grimward:['bandit_mage']}))LOCS[l].mon.push(...ms);
LOCS.grimward.boss='b_bandit_queen';
WORLD_BOSSES_EXT=[['b_elder_treant','moonfall',35,2.2],['b_storm_roc','crags',62,1.6],['b_sandworm','dunes',72,1.3],['b_kraken','isles',76,1.2],['b_voidherald','spire',98,0.8]];
var WORLD_BOSSES_EXT;
Object.assign(LORE,{
  lore_storms:{t:'The Storm Spirits',cat:'Religion',x:'Shamans of the Feral Coast say storms are the ancestors arguing. Thunderhead Crags is where the argument never ends.'},
  lore_bards:{t:'The Bardic Colleges',cat:'Culture',x:'Saltmere\'s Collegium of Song keeps every epic about every hero. Your name will be there someday, if you\'re interesting enough.'},
  lore_pacts:{t:'Warlock Pacts',cat:'Mystery',x:'Something answered the Aethermoor archmagi when the sky tore. Warlocks still bargain with it, and nobody knows what it wants in return.'},
  lore_artifice:{t:'Dwarven Artifice',cat:'History',x:'After Undervault fell, the dwarves swore never to trust Aethermoor constructs again. Then they built better ones.'},
  lore_kraken:{t:'The Kraken of Tidecall',cat:'Bestiary',x:'Sailors leave a pearl at every lighthouse for the Kraken. In years when they forget, ships do not come home.'},
  lore_invasions:{t:'The Long Raids',cat:'History',x:'Goblins, orc renegades and the Cult of Vel all raid towns that look weak. Towns that hold out remember their defenders.'}
});
Object.assign(LIBRARY_BOOKS,{saltmere:[...LIBRARY_BOOKS.saltmere,'lore_bards','lore_kraken'],khazgard:[...LIBRARY_BOOKS.khazgard,'lore_artifice'],duskhaven:[...LIBRARY_BOOKS.duskhaven,'lore_pacts'],valeria:[...LIBRARY_BOOKS.valeria,'lore_invasions']});
LIBRARY_BOOKS.lothirien.push('lore_storms');

/* ---------- specialty NPC shops ---------- */
const SPECIAL_SHOPS={
  valeria:{n:'Lionheart Armory',keeper:'Dame Corrin',mood:'stern',bases:['sword','greatsword','mace','shield','head_plate','chest_plate','legs_plate','hands_plate','feet_plate'],minR:1,set:'lionguard',cons:['hpot2','elixir_def'],uniq:'lionheart_blade',line:'Only steel worthy of the Lion Guard leaves this shop.'},
  lothirien:{n:'The Starlit Arcanum',keeper:'Magister Elowen',mood:'aloof',bases:['staff','orb','tome','lute','head_cloth','chest_cloth','legs_cloth'],minR:1,set:'starweave',cons:['mpot2','mpot3','elixir_focus','scroll_ward','tome_arcane','tome_lute'],line:'Touch nothing that hums.'},
  khazgard:{n:'Ironbeard Runeworks',keeper:'Thorgrim Ironbeard',mood:'gruff',bases:['axe','greataxe','warhammer','mace','shield','chest_plate','head_plate','crossbow'],minR:1,enchant:1,set:'runebound',cons:['stout','elixir_def'],line:'Every rune is guaranteed for a hundred years. Or your grandchildren get a refund.'},
  duskhaven:{n:'Silk & Venom',keeper:'Mistress Ysra',mood:'sly',bases:['dagger','scythe','orb','chest_leather','legs_leather','hands_leather','head_cloth'],minR:1,set:'shadowstalker',cons:['venom_flask','antidote','smoke','elixir_haste'],line:'Poisons are for pest control, of course.'},
  saltmere:{n:'Exotics of the Far Isles',keeper:'Captain Mirelle',mood:'cheerful',bases:null,minR:2,markup:1.4,set:'tidecaller',cons:['fish_feast','elixir_haste','scroll_ward','revive'],uniq:'wanderer_cloak',line:'From places your maps haven\'t heard of yet!'},
  bloodrock:{n:'Warband Supply',keeper:'Grukk One-Tusk',mood:'loud',bases:['greataxe','axe','warhammer','spear','chest_leather','legs_leather','fist'],minR:0,cons:['elixir_str','roast','hpot2','hpot3'],line:'You break it, you fought well. No refunds.'},
  pawhaven:{n:'Tidecraft Outfitters',keeper:'Old Sedge',mood:'kind',bases:['spear','bow','crossbow','totem','chest_leather','feet_leather'],minR:0,cons:['fish_feast','honey_cake','frost_bomb'],line:'Good gear for honest hunters.'},
  cove:{n:'The Black Market',keeper:'Fence Nib',mood:'shifty',bases:null,minR:2,markup:1.7,noRep:1,cons:['smoke','venom_flask','thunder_bomb','revive','elixir_haste'],line:'Fell off a cart. Lots of carts. Don\'t ask.'},
  crossroads:{n:'The Wandering Peddler',keeper:'Hobb Greenpocket',mood:'chatty',bases:['ring','amulet','cloak','rapier','lute','dagger'],minR:0,cons:['honey_cake','scroll_return','smoke','thunder_bomb'],line:'Trinkets, curios and things that may or may not be cursed!'},
  ironford:{n:'Draconian Forge',keeper:'Rusk the Draconian',mood:'proud',bases:['sword','greatsword','axe','spear','warhammer'],minR:1,ench:'embers',set:'dragonscale',cons:['firebomb','elixir_str'],line:'Every blade tempered in dragonfire. Mostly.'}
};
if(!LOCS.saltmere.sv.includes('trainer'))LOCS.saltmere.sv.push('trainer');
for(const l in SPECIAL_SHOPS)if(!LOCS[l].sv.includes('special'))LOCS[l].sv.push('special');

/* ---------- faction quest chains ---------- */
const FACTION_CHAINS={
  aldmere:{giver:'valeria',n:'Shield of the Lion Crown',steps:[
    {type:'kill',mon:'bandit',loc:'watchtower',qty:8,n:'Clear the Old Watchtower',d:'The Crown wants the bandits at the Old Watchtower gone.'},
    {type:'boss',boss:'b_bandit_queen',loc:'grimward',n:'Break the Red Hand',d:'Defeat Rask the Red-Handed in Fort Grimward.'},
    {type:'gather',item:'invasion_badge',qty:1,loc:'valeria',n:'Defender of the Realm',d:'Earn a Defender\'s Badge by holding a town against an invasion.'}],reward:{rep:30,gold:3000,uniq:'lionheart_blade'}},
  sylvan:{giver:'lothirien',n:'The Withering of Moonfall',steps:[
    {type:'kill',mon:'treant',loc:'moonfall',qty:6,n:'Cull the Corruption',d:'Put down corrupted treants in Moonfall Glade.'},
    {type:'gather',item:'gem_shard',qty:5,loc:'crystalcaves',n:'Prismatic Proof',d:'Bring 5 Prismatic Shards from the Crystal Caverns for the Conclave\'s study.'},
    {type:'boss',boss:'b_crystalqueen',loc:'crystalcaves',n:'Silence the Queen',d:'The Crystal Queen is spreading the corruption. End her.'}],reward:{rep:30,gold:2500,set:'starweave'}},
  khaz:{giver:'khazgard',n:'Debt of the Deep',steps:[
    {type:'gather',item:'ore_mithril',qty:6,loc:'undervault',n:'Mithril for the Ledger',d:'The Stone Ledger records an old debt of mithril. Pay it.'},
    {type:'kill',mon:'golem',loc:'undervault',qty:6,n:'Reclaim the Halls',d:'Smash the golems guarding Undervault\'s upper halls.'},
    {type:'boss',boss:'b_colossus',loc:'undervault',n:'The Debt Repaid',d:'Destroy the Undervault Colossus.'}],reward:{rep:30,gold:4000,set:'runebound'}},
  horde:{giver:'bloodrock',n:'The Rite of Ash',steps:[
    {type:'kill',mon:'scorpion',loc:'dunes',qty:8,n:'Trial of Sand',d:'Prove yourself by slaying 8 Sand Scorpions.'},
    {type:'kill',mon:'hellhound',loc:'ashen',qty:5,n:'Trial of Fire',d:'Slay 5 Hellhounds in the Ashen Valley.'},
    {type:'visit',loc:'ashen',n:'Walk the Burned Plain',d:'Return to Bloodrock, ash-marked.'}],reward:{rep:35,gold:3500,uniq:'worm_hammer'}},
  feral:{giver:'pawhaven',n:'Many-Mouths',steps:[
    {type:'kill',mon:'bog_lurker',loc:'mire',qty:6,n:'Thin the Lurkers',d:'Hunt Bog Lurkers in Mangrove Mire.'},
    {type:'gather',item:'pearl',qty:4,loc:'isles',n:'Offering to the Tide',d:'Gather 4 Sea Pearls for the Tidecallers.'},
    {type:'visit',loc:'isles',n:'The Lighthouse Watch',d:'Light the old lighthouse on the Tidecaller Isles.'}],reward:{rep:30,gold:3000,set:'tidecaller'}},
  saltmere:{giver:'saltmere',n:'Seven Purses, One Thief',steps:[
    {type:'kill',mon:'pirate',loc:'cove',qty:6,n:'Pirate Problem',d:'Sink Silk-Eye\'s crew in Smuggler\'s Cove.'},
    {type:'gather',item:'pirate_coin',qty:10,loc:'cove',n:'Recover the Doubloons',d:'Recover 10 stolen doubloons.'},
    {type:'boss',boss:'b_tidelord',loc:'citadel',n:'The Drowned Ledger',d:'The Tidelord sits on the old imperial treasury. Take it back.'}],reward:{rep:30,gold:6000,uniq:'wanderer_cloak'}},
  dusk:{giver:'duskhaven',n:'Threads of the Oracle',steps:[
    {type:'kill',mon:'venom_priestess',loc:'webdepths',qty:4,n:'Heretics Below',d:'Silence 4 heretic Venom Priestesses.'},
    {type:'boss',boss:'b_broodmother',loc:'webdepths',n:'Cut the Thread',d:'Slay Broodmother Vyrax.'},
    {type:'visit',loc:'duskhaven',n:'The Oracle Speaks',d:'Return to the Web-Temple.'}],reward:{rep:30,gold:4000,set:'shadowstalker'}}
};

/* ---------- realm events ---------- */
Object.assign(ACHIEVEMENTS,{
  defender:{n:'Defender of the Realm',d:'Help hold a town against an invasion.',f:p=>(p.stats.defended||0)>=1},
  setbonus:{n:'Matching Outfit',d:'Wear four pieces of one equipment set.',f:p=>Object.values(stats(p).sets||{}).some(n=>n>=4)},
  faction:{n:'Sworn Ally',d:'Complete a kingdom\'s faction questline.',f:p=>Object.keys(p.fchains||{}).some(f=>p.fchains[f]>=FACTION_CHAINS[f].steps.length)},
  treasure:{n:'X Marks the Spot',d:'Find a pirate treasure during a Treasure Hunt.',f:p=>(p.stats.treasure||0)>=1},
  helper:{n:'Good Neighbor',d:'Fulfil 5 requests from other adventurers.',f:p=>(p.stats.requests||0)>=5}
});
const EVENT_TYPES={
  bloodmoon:{n:'Blood Moon',d:'Monsters everywhere are 3 levels stronger, but give +50% XP and loot.',dur:[8,12],mod:{monLv:3,xp:1.5,loot:1.5},w:1.2},
  blessing:{n:'Blessing of the Dawnmother',d:'+50% experience from all sources.',dur:[6,10],mod:{xp:1.5},w:1.2},
  eclipse:{n:'Eclipse',d:'Shadow magic deals +30% damage. The undead grow bolder.',dur:[4,6],mod:{shadow:1.3,monLv:1},w:0.8},
  fair:{n:'Merchant Fair',d:'Saltmere\'s Grand Fair: every shop is 20% cheaper.',dur:[12,24],mod:{price:0.8},w:1},
  goldrush:{n:'Gold Rush',d:'Monsters drop double gold.',dur:[6,10],mod:{gold:2},w:1},
  treasure:{n:'Treasure Hunt',d:'A pirate map surfaced. Search for treasure in the marked place for a big haul.',dur:[12,20],local:1,mod:{},w:1},
  invasion:{n:'Invasion',d:'A horde is attacking a town! Defend it to earn a Defender\'s Badge.',dur:[10,14],local:1,town:1,mod:{},w:1.4},
  migration:{n:'Drake Migration',d:'Ash Drakes are flying over the lowlands. Dangerous, but their scales are valuable.',dur:[8,14],mod:{drakes:1},w:0.7},
  storm:{n:'Great Storm',d:'Lightning magic +30%. Travel is slower and storm elementals roam.',dur:[6,10],mod:{lightning:1.3,travel:1.3},w:0.7}
};
