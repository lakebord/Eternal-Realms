/* ETERNAL REALMS — static world data */
'use strict';
const ATTRS = ['str','dex','vit','int','wis','agi','end','luck'];
const ATTR_NAMES = {str:'Strength',dex:'Dexterity',vit:'Vitality',int:'Intelligence',wis:'Wisdom',agi:'Agility',end:'Endurance',luck:'Luck'};
const ELEMENTS = ['fire','frost','lightning','holy','shadow','nature','poison','arcane'];

/* ---------------- RACES ---------------- */
const RACES = {
  human:{name:'Human',mods:{str:1,dex:1,vit:1,int:1,wis:1,agi:1,end:1,luck:1},res:{},home:'brookhollow',faction:'aldmere',
    perk:'Adaptable: +10% experience from all sources.',flaw:'No natural resistances.',xp:1.10,
    lore:'The most numerous people of the Realms. Humans rebuilt Aldmere from the ash of the Sundering and rule it under the Lion Crown.'},
  highelf:{name:'High Elf',mods:{int:4,wis:3,dex:1,vit:-2,str:-1},res:{arcane:15},home:'lothirien',faction:'sylvan',
    perk:'Starborn: +15% magic attack, arcane resistance.',flaw:'Frail: -10% max HP.',matk:1.15,hp:0.9,
    lore:'Keepers of the Starspire archives. They remember the Aethermoor Empire because some of their elders lived through its fall.'},
  woodelf:{name:'Wood Elf',mods:{dex:4,agi:3,wis:1,str:-1,vit:-1},res:{nature:20},home:'thornvale',faction:'sylvan',
    perk:'Forest Sight: +8 accuracy, +5% evasion, better herb gathering.',flaw:'Distrusted in dwarven holds (-10 reputation).',acc:8,eva:5,
    lore:'The wood elves left the marble halls of Lothirien long ago to live among the old trees, and they keep the Greenpact with the forest.'},
  darkelf:{name:'Dark Elf',mods:{int:3,agi:3,dex:2,vit:-1,wis:-1},res:{shadow:25},home:'duskhaven',faction:'dusk',
    perk:'Umbral Blood: shadow resistance, +10% critical chance at night.',flaw:'Sunburned: -5% accuracy during the day; many towns are wary.',
    lore:'They descended into the Underdark during the Sundering. Duskhaven is ruled by the Matriarch Council and the Spider Oracle.'},
  dwarf:{name:'Dwarf',mods:{vit:4,end:3,str:2,agi:-2,dex:-1},res:{fire:15,poison:15},home:'khazgard',faction:'khaz',
    perk:'Stoneblood: +10% physical defense, +20% mining yield, fire and poison resistance.',flaw:'Short stride: -10% speed.',pdef:1.1,spd:0.9,
    lore:'The children of the mountain. Their ledgers go back four thousand years and they still settle old feuds with them.'},
  orc:{name:'Orc',mods:{str:5,vit:3,end:2,int:-2,wis:-2},res:{},home:'bloodrock',faction:'horde',
    perk:'Bloodrage: +12% physical attack; below 30% HP gain another 15%.',flaw:'Brutish: worse shop prices outside the Horde (+10%).',patk:1.12,
    lore:'The clans of Gor\'Thak are united under the Warchief by the Rite of Ash. Their honor-code forbids striking a foe who yields.'},
  beastkin:{name:'Beastkin',mods:{agi:4,str:2,dex:2,int:-2,wis:-1},res:{nature:10,frost:10},home:'pawhaven',faction:'feral',
    perk:'Wild Instinct: +10% evasion, +10% speed, track monsters better.',flaw:'Distrusted by nobles; library access costs more.',eva:10,spd:1.1,
    lore:'Wolf-folk, cat-folk and boar-folk of the Feral Coast. They were the Empire\'s slave-soldiers until the Unchaining.'},
  halfelf:{name:'Half-Elf',mods:{wis:2,int:2,dex:1,agi:1,luck:1},res:{arcane:5,nature:5},home:'crossroads',faction:'free',
    perk:'Two Worlds: +10% reputation gains, learn spell tomes cheaper.',flaw:'Belongs nowhere: no homeland reputation bonus.',rep:1.1,
    lore:'Born between two peoples. Many settle in Crossroads, where nobody asks about bloodlines.'},
  draconian:{name:'Draconian',mods:{str:3,int:2,vit:2,end:1,agi:-1,luck:-2},res:{fire:30},home:'ironford',faction:'free',
    perk:'Dragonblood: fire resistance, fire damage +15%, innate Breath skill.',flaw:'Feared: dragons\' foes attack draconians on sight; -2 Luck.',
    lore:'Scaled descendants of the dragon-pacts of Aethermoor. There are few of them and they are watched.'},
  halfling:{name:'Halfling',mods:{luck:5,dex:3,agi:2,str:-2,vit:-1},res:{poison:10},home:'brookhollow',faction:'aldmere',
    perk:'Lucky Feet: +5% critical chance, better loot and treasure finds, cheaper food.',flaw:'Small: -10% physical attack with heavy weapons.',
    lore:'Halflings farm the Greenmarch and grow the best pipe-weed anywhere. They say most heroes started on a halfling farm.'}
};

/* ---------------- BACKGROUNDS ---------------- */
const BACKGROUNDS = {
  commoner:{name:'Commoner',gold:40,items:['bread','bread','hpot1'],mastery:{},rep:{aldmere:5},desc:'An ordinary life. Nobody expects much from you, which leaves room to surprise them.'},
  orphan:{name:'Orphan',gold:10,items:['dagger_rusty','bread'],mastery:{dagger:5},attr:{agi:1,luck:1},desc:'Raised in the streets. Quick hands and few friends.'},
  noble:{name:'Noble',gold:300,items:['hpot1','hpot1','ring_signet'],mastery:{trading:5},rep:{aldmere:15},desc:'A minor house\'s third child. You have coin and a name, and the name may cause trouble.'},
  farmer:{name:'Farmer',gold:30,items:['bread','bread','bread','hpot1'],mastery:{herbalism:8,cooking:5},attr:{vit:1,end:1},desc:'Hard work in the Greenmarch fields made you tough.'},
  hunter:{name:'Hunter',gold:50,items:['jerky','jerky','hpot1'],mastery:{bow:8,cooking:3},attr:{dex:1},desc:'You know tracks, snares and how to skin a deer.'},
  soldier:{name:'Former Soldier',gold:60,items:['hpot1','hpot1','shield_wood'],mastery:{sword:6,spear:6,shield:5},attr:{str:1,end:1},desc:'You served in a border legion until the legion was disbanded.'},
  merchant:{name:'Merchant',gold:220,items:['hpot1','ore_copper','ore_copper'],mastery:{trading:15},desc:'You were raised behind a stall in Port Saltmere and you can read a price.'},
  scholar:{name:'Scholar',gold:80,items:['mpot1','mpot1'],mastery:{arcane:5},attr:{int:1,wis:1},codex:['lore_sundering'],desc:'You studied at the Starspire annex. You know some history and a little magic theory.'},
  criminal:{name:'Criminal',gold:90,items:['dagger_rusty','smoke'],mastery:{dagger:6},attr:{dex:1,agi:1},rep:{aldmere:-10},desc:'There\'s a bounty notice with a face like yours on it in Valeria.'},
  wanderer:{name:'Wanderer',gold:45,items:['jerky','hpot1','scroll_return'],mastery:{},attr:{end:1,luck:1},explored:['crossroads'],desc:'You have been on the road for years and know the trails.'},
  apprentice:{name:'Apprentice Mage',gold:50,items:['mpot1','mpot1','tome_fire'],mastery:{fire:5,arcane:3},attr:{int:2},desc:'You were expelled from an apprenticeship before your final exam.'},
  smithapp:{name:'Blacksmith\'s Apprentice',gold:60,items:['ore_iron','ore_iron','hammer_smith'],mastery:{smithing:12,mining:6},attr:{str:1},desc:'You spent years at the forge in Ironford. You know good steel.'}
};

/* ---------------- CLASSES ---------------- */
// growth: auto-points per level, weapon: allowed weapon types, start: starting equipment bases
const CLASSES = {
  warrior:{name:'Warrior',role:'dps',growth:{str:1,vit:1},weapons:['sword','axe','mace','spear','greatsword','greataxe'],armor:'plate',start:['sword_iron','chest_plate','legs_plate'],mastery:{sword:3,axe:3},skills:['power_strike','war_cry','cleave','second_wind'],desc:'Physical combat specialist. Uses any melee weapon.'},
  knight:{name:'Knight',role:'tank',growth:{vit:1,end:1},weapons:['sword','mace','spear'],armor:'plate',start:['sword_iron','shield_iron','chest_plate'],mastery:{sword:2,shield:5},skills:['shield_bash','taunt','fortify','guardian'],desc:'Heavy armor and defense. Protects the party.'},
  swordsman:{name:'Swordsman',role:'dps',growth:{dex:1,agi:1},weapons:['sword','greatsword'],armor:'leather',start:['sword_iron','chest_leather','legs_leather'],mastery:{sword:8},skills:['riposte','iaido','blade_dance','counter_stance'],desc:'Sword techniques, parrying and counters.'},
  archer:{name:'Archer',role:'dps',growth:{dex:2},weapons:['bow','dagger'],armor:'leather',start:['bow_short','chest_leather'],mastery:{bow:8},skills:['aimed_shot','pin_down','multishot','hunters_mark'],desc:'Ranged attacks, tracking and precision. Strong from the back row.'},
  rogue:{name:'Rogue',role:'dps',growth:{dex:1,agi:1},weapons:['dagger','sword','bow'],armor:'leather',start:['dagger_iron','chest_leather'],mastery:{dagger:8},skills:['backstab','poison_blade','vanish','eviscerate'],desc:'Stealth, critical hits and infiltration.'},
  mage:{name:'Mage',role:'dps',growth:{int:2},weapons:['staff','orb'],armor:'cloth',start:['staff_oak','chest_cloth'],mastery:{fire:5,frost:5,arcane:3},skills:['arcane_missile','mana_shield','spell_focus','arcane_surge'],desc:'Offensive and utility magic. Starts with fire and frost.'},
  cleric:{name:'Cleric',role:'healer',growth:{wis:1,vit:1},weapons:['mace','staff'],armor:'cloth',start:['mace_iron','chest_cloth'],mastery:{holy:8,mace:2},skills:['heal','bless','purify','sanctuary'],desc:'Healing and divine support.'},
  summoner:{name:'Summoner',role:'summoner',growth:{int:1,wis:1},weapons:['staff','orb'],armor:'cloth',start:['staff_oak','chest_cloth'],mastery:{summoning:8,arcane:2},skills:['empower_summon','spirit_bolt','bond','twin_call'],comp:'wisp',desc:'Summons and raises creatures. Can tame weakened beasts and elementals.'},
  paladin:{name:'Paladin',role:'tank',growth:{str:1,wis:1},weapons:['sword','mace','greatsword'],armor:'plate',start:['mace_iron','shield_wood','chest_plate'],mastery:{holy:4,mace:3},skills:['holy_strike','lay_hands','divine_shield','judgement'],desc:'Holy magic and armored combat.'},
  berserker:{name:'Berserker',role:'dps',growth:{str:2},weapons:['axe','greataxe','greatsword','fist'],armor:'leather',start:['axe_iron','chest_leather'],mastery:{axe:8},skills:['frenzy','reckless_swing','bloodlust','rampage'],desc:'Aggressive melee damage. Gets stronger when hurt.'},
  monk:{name:'Monk',role:'dps',growth:{agi:1,wis:1},weapons:['fist','staff'],armor:'cloth',start:['fist_wraps','chest_cloth'],mastery:{fist:8},skills:['palm_strike','inner_focus','flurry','chi_burst'],desc:'Martial arts and inner energy. High evasion.'},
  necromancer:{name:'Necromancer',role:'summoner',growth:{int:2},weapons:['staff','dagger','orb'],armor:'cloth',start:['staff_bone','chest_cloth'],mastery:{shadow:8,summoning:3},skills:['shadow_bolt','life_drain','raise_dead','curse'],comp:'skeleton',desc:'Undead summoning and forbidden magic. Frowned upon in holy cities.'},
  druid:{name:'Druid',role:'healer',growth:{wis:1,int:1},weapons:['staff','spear'],armor:'leather',start:['staff_oak','chest_leather'],mastery:{nature:8},skills:['thorns','rejuvenate','bear_form','entangle'],desc:'Nature magic, healing and transformation.'},
  spearman:{name:'Spearman',role:'tank',growth:{str:1,end:1},weapons:['spear','halberd'],armor:'plate',start:['spear_iron','chest_leather'],mastery:{spear:8},skills:['lunge','phalanx','sweep','impale'],desc:'Reach combat: full damage from the back row, formations.'},
  merchant:{name:'Merchant',role:'support',growth:{luck:1,int:1},weapons:['dagger','sword','bow'],armor:'leather',start:['dagger_iron','chest_leather'],mastery:{trading:12},gold:150,skills:['coin_toss','bribe','appraise','hired_help'],desc:'Trading and economic progression. Better prices, more gold.'}
};

const ADV_CLASSES = {
  swordmaster:{name:'Swordmaster',from:['swordsman','warrior','knight'],lvl:30,req:{sword:40},trial:'trial_bren',mentor:'khazgard',growth:{dex:1,str:1,agi:1},skills:['thousand_cuts','perfect_parry'],desc:'Master of the blade.'},
  archmage:{name:'Archmage',from:['mage'],lvl:50,reqAny:{schools:60},trial:'trial_starspire',mentor:'lothirien',growth:{int:2,wis:1},skills:['meteor_storm','time_warp'],desc:'Pinnacle of arcane study.'},
  spellblade:{name:'Spellblade',from:null,lvl:35,reqAnyWeapon:30,reqAnySchool:30,trial:'trial_veyra',mentor:'crossroads',growth:{str:1,int:1,dex:1},skills:['runeblade','spell_strike'],desc:'Steel and sorcery woven together. Open to any class that masters both.'},
  dragonknight:{name:'Dragon Knight',from:['knight','spearman','paladin','warrior'],lvl:50,req:{spear:40},flag:'slew_dragon',trial:'trial_ashen',mentor:'bloodrock',growth:{str:1,vit:1,end:1},skills:['dragon_dive','wyrmfire'],desc:'Requires slaying a dragon-kind world boss.'},
  deathknight:{name:'Death Knight',from:['knight','necromancer','warrior','paladin'],lvl:45,req:{shadow:35},trial:'trial_vel',mentor:'duskhaven',growth:{str:1,vit:1,int:1},skills:['death_grip','unholy_blade'],desc:'A fallen warrior bound to shadow.'},
  grandsummoner:{name:'Grand Summoner',from:['summoner'],lvl:45,req:{summoning:50},comps:3,trial:'trial_wisp',mentor:'thornvale',growth:{int:1,wis:2},skills:['legion_call','soul_link'],desc:'Commands many bonded creatures.'},
  beastmaster:{name:'Beastmaster',from:['summoner','druid','archer','berserker'],lvl:35,tamed:2,trial:'trial_pawhaven',mentor:'pawhaven',growth:{agi:1,str:1,wis:1},skills:['pack_tactics','primal_roar'],desc:'Fights together with tamed beasts.'},
  shadowassassin:{name:'Shadow Assassin',from:['rogue'],lvl:35,req:{dagger:45},trial:'trial_cove',mentor:'cove',growth:{dex:2,agi:1},skills:['death_mark','shadowstep'],desc:'Kills from the dark.'},
  arcanearcher:{name:'Arcane Archer',from:['archer','mage','druid'],lvl:35,req:{bow:35},reqAnySchool:25,trial:'trial_moonfall',mentor:'lothirien',growth:{dex:1,int:1,agi:1},skills:['arcane_arrow','starfall_volley'],desc:'Shoots enchanted arrows.'},
  highpriest:{name:'High Priest',from:['cleric','paladin','druid'],lvl:40,req:{holy:45},trial:'trial_valeria',mentor:'valeria',growth:{wis:2,vit:1},skills:['mass_heal','resurrection'],desc:'Speaks with the voice of the Dawnmother.'},
  grandpaladin:{name:'Grand Paladin',from:['paladin'],lvl:50,req:{holy:35},reqAnyWeapon:35,trial:'trial_valeria2',mentor:'valeria',growth:{str:1,wis:1,vit:1},skills:['avenging_light','aegis'],desc:'A living fortress of faith.'},
  runicknight:{name:'Runic Knight',from:['knight','warrior','spearman','paladin'],lvl:40,req:{enchanting:20},reqAnyWeapon:30,trial:'trial_deepforge',mentor:'deepforge',growth:{vit:1,int:1,str:1},skills:['rune_ward','rune_burst'],desc:'Carves dwarven runes into armor and blade.'},
  battlemage:{name:'Battlemage',from:['mage','warrior','monk','spearman','berserker'],lvl:35,reqAnySchool:30,reqAnyWeapon:25,trial:'trial_ironford',mentor:'ironford',growth:{int:1,vit:1,str:1},skills:['arcane_armor','shockwave'],desc:'Casts in plate armor and wins fights up close.'},
  elementalmaster:{name:'Elemental Master',from:['mage','druid'],lvl:50,req:{fire:30,frost:30,lightning:30},trial:'trial_spire',mentor:'skyreach',growth:{int:2,wis:1},skills:['elemental_convergence','avatar'],desc:'Commands fire, frost and storm.'},
  grandnecromancer:{name:'Grand Necromancer',from:['necromancer'],lvl:50,req:{shadow:50},trial:'trial_vel2',mentor:'duskhaven',growth:{int:2,wis:1},skills:['army_of_dead','soul_harvest'],desc:'Raises undead armies.'},
  weaponmaster:{name:'Weaponmaster',from:null,lvl:45,weaponCount:3,trial:'trial_arena',mentor:'valeria',growth:{str:1,dex:1,end:1},skills:['arsenal','weapon_storm'],desc:'Has mastered three or more weapon types to 30.'}
};

/* ---------------- MASTERIES ---------------- */
const MASTERY = {
  sword:{n:'Sword',t:'weapon'},greatsword:{n:'Sword',t:'alias',of:'sword'},axe:{n:'Axe',t:'weapon'},greataxe:{n:'Axe',t:'alias',of:'axe'},mace:{n:'Mace',t:'weapon'},
  spear:{n:'Spear',t:'weapon'},halberd:{n:'Spear',t:'alias',of:'spear'},dagger:{n:'Dagger',t:'weapon'},bow:{n:'Bow',t:'weapon'},staff:{n:'Staff',t:'weapon'},orb:{n:'Staff',t:'alias',of:'staff'},fist:{n:'Unarmed',t:'weapon'},
  shield:{n:'Shield',t:'weapon'},
  fire:{n:'Fire Magic',t:'school'},frost:{n:'Frost Magic',t:'school'},lightning:{n:'Lightning Magic',t:'school'},holy:{n:'Holy Magic',t:'school'},
  shadow:{n:'Shadow Magic',t:'school'},nature:{n:'Nature Magic',t:'school'},arcane:{n:'Arcane Magic',t:'school'},summoning:{n:'Summoning',t:'school'},
  mining:{n:'Mining',t:'prof'},herbalism:{n:'Herbalism',t:'prof'},woodcutting:{n:'Woodcutting',t:'prof'},fishing:{n:'Fishing',t:'prof'},
  smithing:{n:'Smithing',t:'prof'},alchemy:{n:'Alchemy',t:'prof'},cooking:{n:'Cooking',t:'prof'},enchanting:{n:'Enchanting',t:'prof'},trading:{n:'Trading',t:'prof'}
};
const MASTERY_KEYS = Object.keys(MASTERY).filter(k=>MASTERY[k].t!=='alias');
const WEAPON_M = MASTERY_KEYS.filter(k=>MASTERY[k].t==='weapon'&&k!=='shield');
const SCHOOL_M = MASTERY_KEYS.filter(k=>MASTERY[k].t==='school');
const PROF_M = MASTERY_KEYS.filter(k=>MASTERY[k].t==='prof');
const MASTERY_TIERS = [[100,'Master'],[75,'Expert'],[50,'Veteran'],[25,'Trained Fighter'],[10,'Novice'],[1,'Beginner'],[0,'Untrained']];

/* ---------------- SKILLS ----------------
 k: phys|mag|heal|buff|debuff|summon|util ; c: [mp,sp] cost ; cd: cooldown turns ; p: power multiplier
 tg: enemy|all|self|ally|allies ; e: element ; st: [status,chance,dur] ; m: mastery used ; lv: class level needed / mastery level for techniques */
const SKILLS = {
  // warrior
  power_strike:{n:'Power Strike',k:'phys',c:[0,12],cd:1,p:1.7,tg:'enemy',d:'A heavy, committed blow.'},
  war_cry:{n:'War Cry',k:'buff',c:[0,15],cd:5,tg:'allies',st:['might',1,3],d:'Party +25% physical attack for 3 turns.',lv:5},
  cleave:{n:'Cleave',k:'phys',c:[0,20],cd:2,p:1.0,tg:'all',d:'Hit every enemy.',lv:12},
  second_wind:{n:'Second Wind',k:'heal',c:[0,25],cd:6,p:0.35,tg:'self',d:'Recover 35% max HP.',lv:20},
  // knight
  shield_bash:{n:'Shield Bash',k:'phys',c:[0,12],cd:2,p:1.1,tg:'enemy',st:['stun',0.4,1],d:'May stun.'},
  taunt:{n:'Taunt',k:'buff',c:[0,8],cd:3,tg:'self',st:['taunt',1,3],d:'Enemies target you for 3 turns.',lv:5},
  fortify:{n:'Fortify',k:'buff',c:[0,15],cd:4,tg:'self',st:['fortify',1,3],d:'+60% defense for 3 turns.',lv:12},
  guardian:{n:'Guardian',k:'buff',c:[0,25],cd:6,tg:'allies',st:['shield',1,3],d:'Shields every ally.',lv:20},
  // swordsman
  riposte:{n:'Riposte',k:'phys',c:[0,10],cd:1,p:1.4,tg:'enemy',crit:15,d:'A precise thrust with +15% crit.'},
  iaido:{n:'Iaido',k:'phys',c:[0,18],cd:3,p:2.2,tg:'enemy',d:'Lightning-fast draw cut.',lv:5},
  blade_dance:{n:'Blade Dance',k:'phys',c:[0,24],cd:3,p:0.7,hits:3,tg:'enemy',d:'Three quick cuts.',lv:12},
  counter_stance:{n:'Counter Stance',k:'buff',c:[0,14],cd:4,tg:'self',st:['counter',1,2],d:'Counter every melee attack for 2 turns.',lv:20},
  // archer
  aimed_shot:{n:'Aimed Shot',k:'phys',c:[0,10],cd:1,p:1.6,tg:'enemy',acc:25,d:'+25 accuracy.'},
  pin_down:{n:'Pin Down',k:'phys',c:[0,14],cd:3,p:1.0,tg:'enemy',st:['slow',0.8,3],d:'Slows the target.',lv:5},
  multishot:{n:'Multishot',k:'phys',c:[0,22],cd:2,p:0.85,tg:'all',d:'Arrows at every enemy.',lv:12},
  hunters_mark:{n:'Hunter\'s Mark',k:'debuff',c:[0,12],cd:5,tg:'enemy',st:['marked',1,4],d:'Target takes +30% damage.',lv:20},
  // rogue
  backstab:{n:'Backstab',k:'phys',c:[0,12],cd:1,p:1.5,tg:'enemy',crit:25,d:'+25% crit chance.'},
  poison_blade:{n:'Poison Blade',k:'phys',c:[0,14],cd:3,p:0.9,tg:'enemy',e:'poison',st:['poison',0.9,4],d:'Poisons the target.',lv:5},
  vanish:{n:'Vanish',k:'buff',c:[0,18],cd:5,tg:'self',st:['stealth',1,2],d:'Next attack crits; enemies miss more.',lv:12},
  eviscerate:{n:'Eviscerate',k:'phys',c:[0,28],cd:4,p:2.8,tg:'enemy',d:'Brutal finishing strike.',lv:20},
  // mage
  arcane_missile:{n:'Arcane Missile',k:'mag',c:[8,0],cd:0,p:1.2,tg:'enemy',e:'arcane',m:'arcane',d:'Reliable arcane bolt.'},
  mana_shield:{n:'Mana Shield',k:'buff',c:[15,0],cd:5,tg:'self',st:['shield',1,3],d:'Absorbs damage.',lv:5},
  spell_focus:{n:'Spell Focus',k:'buff',c:[10,0],cd:5,tg:'self',st:['focus',1,3],d:'+40% magic attack.',lv:12},
  arcane_surge:{n:'Arcane Surge',k:'mag',c:[40,0],cd:4,p:2.6,tg:'all',e:'arcane',m:'arcane',d:'Explosion of raw mana.',lv:20},
  // cleric
  heal:{n:'Heal',k:'heal',c:[12,0],cd:0,p:1.6,tg:'ally',m:'holy',d:'Restore an ally\'s HP.'},
  bless:{n:'Bless',k:'buff',c:[14,0],cd:5,tg:'allies',st:['blessed',1,3],d:'+15% attack & defense to party.',lv:5},
  purify:{n:'Purify',k:'heal',c:[10,0],cd:2,p:0.6,tg:'ally',cleanse:1,m:'holy',d:'Heal and remove harmful effects.',lv:12},
  sanctuary:{n:'Sanctuary',k:'heal',c:[35,0],cd:5,p:1.2,tg:'allies',m:'holy',d:'Heal the whole party.',lv:20},
  // summoner
  empower_summon:{n:'Empower Summon',k:'buff',c:[12,0],cd:4,tg:'pet',st:['might',1,3],d:'Your summon hits harder.',lv:1},
  spirit_bolt:{n:'Spirit Bolt',k:'mag',c:[8,0],cd:0,p:1.1,tg:'enemy',e:'arcane',m:'summoning',d:'Bolt of spirit energy.',lv:1},
  bond:{n:'Bond',k:'heal',c:[15,0],cd:3,p:2.0,tg:'pet',m:'summoning',d:'Heal your summon strongly.',lv:5},
  twin_call:{n:'Twin Call',k:'summon',c:[30,0],cd:8,tg:'self',d:'Call a second bonded creature at once.',lv:20},
  // paladin
  holy_strike:{n:'Holy Strike',k:'phys',c:[6,6],cd:1,p:1.4,tg:'enemy',e:'holy',m:'holy',d:'Weapon blow imbued with light.'},
  lay_hands:{n:'Lay on Hands',k:'heal',c:[20,0],cd:5,p:2.5,tg:'ally',m:'holy',d:'Large heal.',lv:5},
  divine_shield:{n:'Divine Shield',k:'buff',c:[20,0],cd:6,tg:'self',st:['shield',1,3],d:'Holy barrier.',lv:12},
  judgement:{n:'Judgement',k:'mag',c:[30,0],cd:4,p:2.4,tg:'enemy',e:'holy',m:'holy',d:'Smite. Devastating to undead.',lv:20},
  // berserker
  frenzy:{n:'Frenzy',k:'buff',c:[0,10],cd:4,tg:'self',st:['frenzy',1,3],d:'+40% attack, -20% defense.'},
  reckless_swing:{n:'Reckless Swing',k:'phys',c:[0,16],cd:1,p:2.0,tg:'enemy',self:0.05,d:'Costs 5% of your HP.',lv:5},
  bloodlust:{n:'Bloodlust',k:'buff',c:[0,18],cd:5,tg:'self',st:['lifesteal',1,3],d:'Heal from damage dealt.',lv:12},
  rampage:{n:'Rampage',k:'phys',c:[0,30],cd:4,p:1.3,tg:'all',d:'Hit all enemies, stronger at low HP.',lv:20},
  // monk
  palm_strike:{n:'Palm Strike',k:'phys',c:[0,8],cd:0,p:1.3,tg:'enemy',d:'Cheap and quick.'},
  inner_focus:{n:'Inner Focus',k:'heal',c:[0,15],cd:4,p:0.25,tg:'self',mpRegen:20,d:'Heal and restore MP.',lv:5},
  flurry:{n:'Flurry',k:'phys',c:[0,22],cd:2,p:0.55,hits:4,tg:'enemy',d:'Four rapid strikes.',lv:12},
  chi_burst:{n:'Chi Burst',k:'mag',c:[25,10],cd:4,p:2.2,tg:'all',e:'holy',d:'Wave of inner energy.',lv:20},
  // necromancer
  shadow_bolt:{n:'Shadow Bolt',k:'mag',c:[8,0],cd:0,p:1.3,tg:'enemy',e:'shadow',m:'shadow',d:'Bolt of darkness.'},
  life_drain:{n:'Life Drain',k:'mag',c:[14,0],cd:2,p:1.1,tg:'enemy',e:'shadow',drain:0.5,m:'shadow',d:'Heal for half the damage.',lv:5},
  raise_dead:{n:'Raise Dead',k:'summon',c:[25,0],cd:6,tg:'self',undead:1,d:'Raise a skeletal warrior to fight.',lv:1},
  curse:{n:'Curse of Frailty',k:'debuff',c:[16,0],cd:4,tg:'enemy',st:['weaken',1,4],d:'Target deals and resists less.',lv:12},
  // druid
  thorns:{n:'Thornlash',k:'mag',c:[8,0],cd:0,p:1.2,tg:'enemy',e:'nature',m:'nature',d:'Lash of thorny vines.'},
  rejuvenate:{n:'Rejuvenate',k:'buff',c:[12,0],cd:2,tg:'ally',st:['regen',1,4],d:'Heals every turn.',lv:1},
  bear_form:{n:'Bear Form',k:'buff',c:[20,0],cd:6,tg:'self',st:['bear',1,4],d:'+50% defense and attack, physical only.',lv:12},
  entangle:{n:'Entangle',k:'debuff',c:[18,0],cd:4,tg:'all',st:['root',0.6,2],d:'Roots enemies.',lv:5},
  // spearman
  lunge:{n:'Lunge',k:'phys',c:[0,10],cd:1,p:1.5,tg:'enemy',reach:1,d:'Reach attack.'},
  phalanx:{n:'Phalanx',k:'buff',c:[0,15],cd:5,tg:'allies',st:['fortify',1,2],d:'Party +60% defense.',lv:5},
  sweep:{n:'Sweep',k:'phys',c:[0,18],cd:2,p:0.95,tg:'all',st:['slow',0.3,2],d:'Sweep all enemies.',lv:12},
  impale:{n:'Impale',k:'phys',c:[0,26],cd:3,p:2.4,tg:'enemy',st:['bleed',0.7,3],d:'Skewer with bleeding.',lv:20},
  // merchant
  coin_toss:{n:'Coin Toss',k:'phys',c:[0,6],cd:0,p:1.0,tg:'enemy',gold:5,d:'Throw coins. Costs 5 gold, hits hard with Luck.'},
  bribe:{n:'Bribe',k:'util',c:[0,10],cd:5,tg:'enemy',d:'Pay gold to make a humanoid foe leave.',lv:5},
  appraise:{n:'Appraise',k:'debuff',c:[0,8],cd:4,tg:'enemy',st:['marked',1,3],d:'Find weak points; +30% dmg taken.',lv:1},
  hired_help:{n:'Hired Help',k:'summon',c:[0,20],cd:8,tg:'self',merc:1,d:'Pay 50 gold for a mercenary for this fight.',lv:12},
  // advanced
  thousand_cuts:{n:'Thousand Cuts',k:'phys',c:[0,40],cd:4,p:0.5,hits:7,tg:'enemy',d:'Seven blinding slashes.'},
  perfect_parry:{n:'Perfect Parry',k:'buff',c:[0,20],cd:5,tg:'self',st:['counter',1,3],d:'Parry and counter for 3 turns.'},
  meteor_storm:{n:'Meteor Storm',k:'mag',c:[90,0],cd:5,p:3.6,tg:'all',e:'fire',m:'fire',d:'Rain of meteors.'},
  time_warp:{n:'Time Warp',k:'buff',c:[60,0],cd:8,tg:'allies',st:['haste',1,3],d:'Party acts with haste.'},
  runeblade:{n:'Runeblade',k:'buff',c:[20,0],cd:5,tg:'self',st:['runeblade',1,4],d:'Attacks add arcane damage.'},
  spell_strike:{n:'Spell Strike',k:'phys',c:[25,10],cd:2,p:2.2,tg:'enemy',e:'arcane',hybrid:1,d:'Uses both attack powers.'},
  dragon_dive:{n:'Dragon Dive',k:'phys',c:[0,40],cd:4,p:3.2,tg:'enemy',e:'fire',reach:1,d:'Leap from the sky.'},
  wyrmfire:{n:'Wyrmfire',k:'mag',c:[45,0],cd:4,p:2.4,tg:'all',e:'fire',st:['burn',0.7,3],d:'Dragon flame.'},
  death_grip:{n:'Death Grip',k:'mag',c:[25,0],cd:3,p:1.8,tg:'enemy',e:'shadow',st:['stun',0.4,1],d:'Seize with shadow.'},
  unholy_blade:{n:'Unholy Blade',k:'phys',c:[20,20],cd:3,p:2.6,tg:'enemy',e:'shadow',drain:0.3,d:'Draining strike.'},
  legion_call:{n:'Legion Call',k:'summon',c:[60,0],cd:8,tg:'self',legion:1,d:'All bonded creatures join.'},
  soul_link:{n:'Soul Link',k:'buff',c:[30,0],cd:5,tg:'allies',st:['regen',1,4],d:'Share life with summons.'},
  pack_tactics:{n:'Pack Tactics',k:'buff',c:[0,25],cd:5,tg:'allies',st:['might',1,4],d:'Party and beasts +25% attack.'},
  primal_roar:{n:'Primal Roar',k:'debuff',c:[0,30],cd:5,tg:'all',st:['weaken',0.8,3],d:'Weakens all enemies.'},
  death_mark:{n:'Death Mark',k:'phys',c:[0,40],cd:5,p:4.0,tg:'enemy',crit:40,d:'Assassinate.'},
  shadowstep:{n:'Shadowstep',k:'buff',c:[0,20],cd:4,tg:'self',st:['stealth',1,2],d:'Vanish into shadows.'},
  arcane_arrow:{n:'Arcane Arrow',k:'phys',c:[15,10],cd:1,p:2.0,tg:'enemy',e:'arcane',hybrid:1,d:'Enchanted arrow.'},
  starfall_volley:{n:'Starfall Volley',k:'phys',c:[40,20],cd:4,p:1.6,tg:'all',e:'arcane',hybrid:1,d:'Volley of starlight.'},
  mass_heal:{n:'Mass Heal',k:'heal',c:[50,0],cd:3,p:2.0,tg:'allies',m:'holy',d:'Powerful party heal.'},
  resurrection:{n:'Resurrection',k:'heal',c:[80,0],cd:10,p:0.5,tg:'dead',m:'holy',d:'Revive a fallen ally.'},
  avenging_light:{n:'Avenging Light',k:'mag',c:[50,0],cd:4,p:3.0,tg:'all',e:'holy',m:'holy',d:'Searing radiance.'},
  aegis:{n:'Aegis',k:'buff',c:[40,0],cd:7,tg:'allies',st:['shield',1,4],d:'Party-wide holy barrier.'},
  rune_ward:{n:'Rune Ward',k:'buff',c:[20,10],cd:5,tg:'self',st:['fortify',1,4],d:'Runes harden you.'},
  rune_burst:{n:'Rune Burst',k:'mag',c:[35,10],cd:3,p:2.4,tg:'all',e:'arcane',d:'Detonate runes.'},
  arcane_armor:{n:'Arcane Armor',k:'buff',c:[25,0],cd:5,tg:'self',st:['fortify',1,3],d:'Mana-woven plate.'},
  shockwave:{n:'Shockwave',k:'mag',c:[30,15],cd:3,p:2.0,tg:'all',e:'lightning',hybrid:1,st:['stun',0.25,1],d:'Ground slam of lightning.'},
  elemental_convergence:{n:'Elemental Convergence',k:'mag',c:[80,0],cd:4,p:3.8,tg:'enemy',e:'arcane',d:'Fire, frost and storm in one point.'},
  avatar:{n:'Elemental Avatar',k:'buff',c:[60,0],cd:8,tg:'self',st:['focus',1,5],d:'Become an elemental.'},
  army_of_dead:{n:'Army of the Dead',k:'summon',c:[70,0],cd:8,tg:'self',undead:3,d:'Raise three undead.'},
  soul_harvest:{n:'Soul Harvest',k:'mag',c:[50,0],cd:4,p:2.6,tg:'all',e:'shadow',drain:0.3,d:'Reap souls of all foes.'},
  arsenal:{n:'Arsenal',k:'phys',c:[0,35],cd:3,p:0.8,hits:5,tg:'enemy',d:'Five strikes with five weapons.'},
  weapon_storm:{n:'Weapon Storm',k:'phys',c:[0,45],cd:4,p:1.8,tg:'all',d:'Whirlwind of steel.'},
  // racial
  dragon_breath:{n:'Dragon Breath',k:'mag',c:[20,0],cd:4,p:1.6,tg:'all',e:'fire',racial:'draconian',d:'Draconian racial fire breath.'},
  // weapon techniques (unlocked by mastery, any class)
  t_sword1:{n:'Crosscut',k:'phys',c:[0,12],cd:1,p:1.6,tg:'enemy',m:'sword',lv:15,tech:1},
  t_sword2:{n:'Moonlight Arc',k:'phys',c:[0,25],cd:3,p:1.2,tg:'all',m:'sword',lv:40,tech:1},
  t_sword3:{n:'Heaven Splitter',k:'phys',c:[0,45],cd:5,p:4.2,tg:'enemy',m:'sword',lv:75,tech:1},
  t_axe1:{n:'Rending Chop',k:'phys',c:[0,14],cd:2,p:1.5,tg:'enemy',st:['bleed',0.6,3],m:'axe',lv:15,tech:1},
  t_axe2:{n:'Whirlwind',k:'phys',c:[0,28],cd:3,p:1.3,tg:'all',m:'axe',lv:40,tech:1},
  t_axe3:{n:'Executioner',k:'phys',c:[0,45],cd:5,p:4.5,tg:'enemy',m:'axe',lv:75,tech:1},
  t_mace1:{n:'Skullcrack',k:'phys',c:[0,14],cd:2,p:1.4,tg:'enemy',st:['stun',0.35,1],m:'mace',lv:15,tech:1},
  t_mace2:{n:'Armor Breaker',k:'debuff',c:[0,20],cd:3,tg:'enemy',st:['sunder',1,4],m:'mace',lv:40,tech:1},
  t_mace3:{n:'Earthshaker',k:'phys',c:[0,45],cd:5,p:2.4,tg:'all',st:['stun',0.4,1],m:'mace',lv:75,tech:1},
  t_spear1:{n:'Piercing Thrust',k:'phys',c:[0,12],cd:1,p:1.6,tg:'enemy',reach:1,m:'spear',lv:15,tech:1},
  t_spear2:{n:'Dragon Fang',k:'phys',c:[0,26],cd:3,p:2.6,tg:'enemy',reach:1,m:'spear',lv:40,tech:1},
  t_spear3:{n:'Skyfall Lance',k:'phys',c:[0,45],cd:5,p:2.6,tg:'all',reach:1,m:'spear',lv:75,tech:1},
  t_dagger1:{n:'Twin Fangs',k:'phys',c:[0,10],cd:1,p:0.85,hits:2,tg:'enemy',m:'dagger',lv:15,tech:1},
  t_dagger2:{n:'Throat Slit',k:'phys',c:[0,24],cd:3,p:2.4,tg:'enemy',crit:30,m:'dagger',lv:40,tech:1},
  t_dagger3:{n:'Thousand Needles',k:'phys',c:[0,40],cd:5,p:0.7,hits:6,tg:'enemy',m:'dagger',lv:75,tech:1},
  t_bow1:{n:'Piercing Arrow',k:'phys',c:[0,12],cd:1,p:1.6,tg:'enemy',m:'bow',lv:15,tech:1},
  t_bow2:{n:'Arrow Rain',k:'phys',c:[0,26],cd:3,p:1.2,tg:'all',m:'bow',lv:40,tech:1},
  t_bow3:{n:'Heartseeker',k:'phys',c:[0,40],cd:5,p:4.4,tg:'enemy',acc:50,m:'bow',lv:75,tech:1},
  t_staff1:{n:'Staff Sweep',k:'phys',c:[0,10],cd:1,p:1.3,tg:'enemy',st:['slow',0.3,2],m:'staff',lv:15,tech:1},
  t_staff2:{n:'Mana Channel',k:'heal',c:[0,20],cd:4,p:0,mpRegen:40,tg:'self',m:'staff',lv:40,tech:1},
  t_staff3:{n:'Archon Strike',k:'mag',c:[40,0],cd:4,p:3.4,tg:'enemy',e:'arcane',m:'staff',lv:75,tech:1},
  t_fist1:{n:'Tiger Claw',k:'phys',c:[0,10],cd:1,p:0.8,hits:2,tg:'enemy',m:'fist',lv:15,tech:1},
  t_fist2:{n:'Pressure Point',k:'phys',c:[0,22],cd:3,p:1.8,tg:'enemy',st:['stun',0.5,1],m:'fist',lv:40,tech:1},
  t_fist3:{n:'Hundred Fists',k:'phys',c:[0,40],cd:5,p:0.6,hits:8,tg:'enemy',m:'fist',lv:75,tech:1},
  t_shield1:{n:'Shield Wall',k:'buff',c:[0,15],cd:4,tg:'self',st:['fortify',1,3],m:'shield',lv:20,tech:1},
  // spells (unlocked by school mastery, any class)
  s_fire1:{n:'Firebolt',k:'mag',c:[8,0],cd:0,p:1.3,tg:'enemy',e:'fire',st:['burn',0.2,2],m:'fire',lv:1,spell:1},
  s_fire2:{n:'Fireball',k:'mag',c:[22,0],cd:2,p:1.5,tg:'all',e:'fire',st:['burn',0.3,2],m:'fire',lv:20,spell:1},
  s_fire3:{n:'Inferno',k:'mag',c:[45,0],cd:4,p:3.2,tg:'enemy',e:'fire',st:['burn',0.8,3],m:'fire',lv:55,spell:1},
  s_fire4:{n:'Meteor',k:'mag',c:[80,0],cd:6,p:3.4,tg:'all',e:'fire',m:'fire',lv:85,spell:1},
  s_frost1:{n:'Frost Shard',k:'mag',c:[8,0],cd:0,p:1.2,tg:'enemy',e:'frost',st:['slow',0.3,2],m:'frost',lv:1,spell:1},
  s_frost2:{n:'Ice Nova',k:'mag',c:[22,0],cd:3,p:1.2,tg:'all',e:'frost',st:['freeze',0.25,1],m:'frost',lv:20,spell:1},
  s_frost3:{n:'Glacial Spike',k:'mag',c:[45,0],cd:4,p:3.0,tg:'enemy',e:'frost',st:['freeze',0.5,1],m:'frost',lv:55,spell:1},
  s_frost4:{n:'Blizzard',k:'mag',c:[80,0],cd:6,p:3.0,tg:'all',e:'frost',st:['freeze',0.4,1],m:'frost',lv:85,spell:1},
  s_light1:{n:'Spark',k:'mag',c:[7,0],cd:0,p:1.25,tg:'enemy',e:'lightning',m:'lightning',lv:1,spell:1},
  s_light2:{n:'Chain Lightning',k:'mag',c:[24,0],cd:2,p:1.3,tg:'all',e:'lightning',st:['stun',0.15,1],m:'lightning',lv:20,spell:1},
  s_light3:{n:'Thunderclap',k:'mag',c:[45,0],cd:4,p:3.1,tg:'enemy',e:'lightning',st:['stun',0.4,1],m:'lightning',lv:55,spell:1},
  s_holy1:{n:'Smite',k:'mag',c:[8,0],cd:0,p:1.2,tg:'enemy',e:'holy',m:'holy',lv:1,spell:1},
  s_holy2:{n:'Renew',k:'buff',c:[15,0],cd:2,tg:'ally',st:['regen',1,4],m:'holy',lv:15,spell:1},
  s_holy3:{n:'Holy Nova',k:'mag',c:[40,0],cd:4,p:2.0,tg:'all',e:'holy',m:'holy',lv:45,spell:1},
  s_shadow1:{n:'Shadow Lash',k:'mag',c:[8,0],cd:0,p:1.25,tg:'enemy',e:'shadow',m:'shadow',lv:1,spell:1},
  s_shadow2:{n:'Fear',k:'debuff',c:[18,0],cd:4,tg:'enemy',st:['stun',0.6,1],m:'shadow',lv:20,spell:1},
  s_shadow3:{n:'Void Rift',k:'mag',c:[45,0],cd:4,p:2.6,tg:'all',e:'shadow',m:'shadow',lv:55,spell:1},
  s_nature1:{n:'Vine Whip',k:'mag',c:[7,0],cd:0,p:1.2,tg:'enemy',e:'nature',m:'nature',lv:1,spell:1},
  s_nature2:{n:'Healing Bloom',k:'heal',c:[18,0],cd:1,p:1.5,tg:'ally',m:'nature',lv:15,spell:1},
  s_nature3:{n:'Wrath of the Wild',k:'mag',c:[45,0],cd:4,p:2.6,tg:'all',e:'nature',st:['poison',0.5,3],m:'nature',lv:55,spell:1},
  s_arcane1:{n:'Mana Bolt',k:'mag',c:[7,0],cd:0,p:1.15,tg:'enemy',e:'arcane',m:'arcane',lv:1,spell:1},
  s_arcane2:{n:'Dispel Ward',k:'buff',c:[20,0],cd:4,tg:'allies',st:['ward',1,3],m:'arcane',lv:25,spell:1},
  s_arcane3:{n:'Arcane Barrage',k:'mag',c:[45,0],cd:4,p:0.9,hits:4,tg:'enemy',e:'arcane',m:'arcane',lv:55,spell:1},
};

const STATUS = {
  poison:{n:'Poisoned',bad:1,dot:0.05},burn:{n:'Burning',bad:1,dot:0.06},bleed:{n:'Bleeding',bad:1,dot:0.05},
  stun:{n:'Stunned',bad:1},freeze:{n:'Frozen',bad:1},root:{n:'Rooted',bad:1},slow:{n:'Slowed',bad:1},weaken:{n:'Weakened',bad:1},
  marked:{n:'Marked',bad:1},sunder:{n:'Sundered',bad:1},blind:{n:'Blinded',bad:1},
  might:{n:'Mighty'},fortify:{n:'Fortified'},shield:{n:'Shielded'},blessed:{n:'Blessed'},regen:{n:'Regenerating'},focus:{n:'Focused'},
  frenzy:{n:'Frenzied'},lifesteal:{n:'Bloodlust'},counter:{n:'Countering'},stealth:{n:'Hidden'},taunt:{n:'Taunting'},bear:{n:'Bear Form'},
  haste:{n:'Hasted'},resolve:{n:'Unbroken'},runeblade:{n:'Runeblade'},ward:{n:'Warded'},defend:{n:'Defending'},dodge:{n:'Dodging'},parry:{n:'Parrying'}
};

/* ---------------- ITEMS ---------------- */
// t: weapon|armor|acc|offhand|con|mat|tome|tool ; wt: weapon type ; sl: slot ; a: base attack ; m: magic attack ; d: defense ; md: magic def
const ITEM_BASES = {
  sword:{n:'Longsword',t:'weapon',wt:'sword',a:1.0,m:0,sl:'weapon'},greatsword:{n:'Greatsword',t:'weapon',wt:'greatsword',a:1.35,m:0,sl:'weapon',two:1,spd:-3},
  axe:{n:'Battleaxe',t:'weapon',wt:'axe',a:1.1,m:0,sl:'weapon'},greataxe:{n:'Greataxe',t:'weapon',wt:'greataxe',a:1.45,sl:'weapon',two:1,spd:-4},
  mace:{n:'Mace',t:'weapon',wt:'mace',a:0.95,m:0.3,sl:'weapon'},spear:{n:'Spear',t:'weapon',wt:'spear',a:1.05,sl:'weapon',two:1,reach:1},
  halberd:{n:'Halberd',t:'weapon',wt:'halberd',a:1.3,sl:'weapon',two:1,reach:1,spd:-3},dagger:{n:'Dagger',t:'weapon',wt:'dagger',a:0.75,sl:'weapon',crit:6,spd:3},
  bow:{n:'Bow',t:'weapon',wt:'bow',a:1.0,sl:'weapon',two:1,ranged:1},staff:{n:'Staff',t:'weapon',wt:'staff',a:0.5,m:1.3,sl:'weapon',two:1},
  orb:{n:'Orb',t:'weapon',wt:'orb',a:0.2,m:1.05,sl:'weapon'},fist:{n:'Knuckles',t:'weapon',wt:'fist',a:0.85,sl:'weapon',spd:4,crit:3},
  shield:{n:'Shield',t:'offhand',wt:'shield',d:0.9,md:0.4,sl:'offhand'},tome:{n:'Grimoire',t:'offhand',m:0.35,md:0.4,sl:'offhand'},
  head_cloth:{n:'Hood',t:'armor',ac:'cloth',d:0.15,md:0.4,sl:'head'},head_leather:{n:'Cap',t:'armor',ac:'leather',d:0.3,md:0.2,sl:'head'},head_plate:{n:'Helm',t:'armor',ac:'plate',d:0.5,md:0.1,sl:'head'},
  chest_cloth:{n:'Robe',t:'armor',ac:'cloth',d:0.35,md:0.9,sl:'chest',m:0.1},chest_leather:{n:'Jerkin',t:'armor',ac:'leather',d:0.7,md:0.4,sl:'chest'},chest_plate:{n:'Cuirass',t:'armor',ac:'plate',d:1.1,md:0.2,sl:'chest',spd:-1},
  legs_cloth:{n:'Trousers',t:'armor',ac:'cloth',d:0.2,md:0.5,sl:'legs'},legs_leather:{n:'Leggings',t:'armor',ac:'leather',d:0.45,md:0.25,sl:'legs'},legs_plate:{n:'Greaves',t:'armor',ac:'plate',d:0.75,md:0.15,sl:'legs'},
  hands_cloth:{n:'Gloves',t:'armor',ac:'cloth',d:0.1,md:0.3,sl:'hands'},hands_leather:{n:'Bracers',t:'armor',ac:'leather',d:0.25,md:0.1,sl:'hands'},hands_plate:{n:'Gauntlets',t:'armor',ac:'plate',d:0.4,md:0.1,sl:'hands'},
  feet_cloth:{n:'Sandals',t:'armor',ac:'cloth',d:0.1,md:0.3,sl:'feet',spd:1},feet_leather:{n:'Boots',t:'armor',ac:'leather',d:0.25,md:0.1,sl:'feet',spd:1},feet_plate:{n:'Sabatons',t:'armor',ac:'plate',d:0.4,md:0.1,sl:'feet'},
  ring:{n:'Ring',t:'acc',sl:'ring',acc:1},amulet:{n:'Amulet',t:'acc',sl:'amulet',acc:1}
};
const EQUIP_SLOTS = ['weapon','offhand','head','chest','legs','hands','feet','ring','amulet'];
const TIERS = [ // [minLevel, weapon material, cloth, leather, plate, jewel]
  [1,'Iron','Linen','Hide','Iron','Copper'],[10,'Steel','Wool','Leather','Steel','Silver'],[20,'Silversteel','Silk','Drakehide','Silversteel','Gold'],
  [32,'Mithril','Moonweave','Wyvern','Mithril','Sapphire'],[45,'Adamantite','Spellsilk','Basilisk','Adamantite','Ruby'],[60,'Dragonbone','Starweave','Dragonscale','Dragonbone','Diamond'],
  [78,'Aetherium','Voidsilk','Shadowhide','Aetherium','Starstone'],[92,'Eternal','Eternal','Eternal','Eternal','Eternal']];
const RARITY = [
  {n:'Common',c:'r0',m:1.0,aff:0,v:1},{n:'Uncommon',c:'r1',m:1.12,aff:1,v:2.2},{n:'Rare',c:'r2',m:1.28,aff:2,v:5},
  {n:'Epic',c:'r3',m:1.5,aff:3,v:12},{n:'Legendary',c:'r4',m:1.8,aff:4,v:35}];
const AFFIXES = {
  mighty:{n:'Mighty',pre:1,s:{str:1}},keen:{n:'Keen',pre:1,s:{crit:0.4}},swift:{n:'Swift',pre:1,s:{agi:1}},sturdy:{n:'Sturdy',pre:1,s:{vit:1}},
  arcane:{n:'Arcane',pre:1,s:{int:1}},blessed:{n:'Blessed',pre:1,s:{wis:1}},vampiric:{n:'Vampiric',pre:1,s:{steal:0.15},wOnly:1},
  precise:{n:'Precise',pre:1,s:{dex:1}},lucky:{n:'Lucky',pre:1,s:{luck:1}},warding:{n:'Warding',pre:1,s:{mdef:1.5}},
  bear:{n:'of the Bear',s:{vit:1,str:0.5}},owl:{n:'of the Owl',s:{wis:1,int:0.5}},fox:{n:'of the Fox',s:{agi:1,dex:0.5}},
  embers:{n:'of Embers',s:{el_fire:1},wOnly:1},frost:{n:'of Frost',s:{el_frost:1},wOnly:1},storms:{n:'of Storms',s:{el_lightning:1},wOnly:1},
  dawn:{n:'of Dawn',s:{el_holy:1},wOnly:1},night:{n:'of Night',s:{el_shadow:1},wOnly:1},fortune:{n:'of Fortune',s:{luck:1,gold:0.5}},
  titan:{n:'of the Titan',s:{end:1,vit:0.5}},flame_ward:{n:'of Fireward',s:{res_fire:2},aOnly:1},frost_ward:{n:'of Frostward',s:{res_frost:2},aOnly:1},shadow_ward:{n:'of Lightward',s:{res_shadow:2},aOnly:1}
};
// named legendary uniques (base, fixed affixes, flavour)
const UNIQUES = {
  fireblade:{n:'Fireblade',b:'sword',aff:['mighty','embers','keen','embers'],lore:'Forged in the breath of Pyrrhax the Red.'},
  frostmourn:{n:'Winter\'s Edge',b:'greatsword',aff:['frost','frost','sturdy','titan'],lore:'Taken from the hoard of the Frost Wyrm.'},
  hydrafang:{n:'Hydra\'s Fang',b:'spear',aff:['vampiric','swift','precise','fox'],lore:'Still drips venom.'},
  lichcrown:{n:'Crown of Vel',b:'head_cloth',aff:['arcane','owl','warding','night'],lore:'The Lich King\'s phylactery-crown.'},
  starbow:{n:'Starfall Longbow',b:'bow',aff:['precise','keen','storms','fox'],lore:'Elven make from the Aethermoor age.'},
  grubnak_axe:{n:'Grubnak\'s Cleaver',b:'axe',aff:['mighty','bear'],lore:'Crude, heavy, surprisingly sharp.'},
  eternal_orb:{n:'Heart of the Spire',b:'orb',aff:['arcane','arcane','owl','dawn'],lore:'A shard of the Aethermoor sun-engine.'}
};
// fixed consumables / materials / misc. v = base value in gold
const ITEMS = {
  hpot1:{n:'Minor Health Potion',t:'con',heal:70,v:15},hpot2:{n:'Health Potion',t:'con',heal:220,v:45},hpot3:{n:'Greater Health Potion',t:'con',heal:600,v:130},hpot4:{n:'Supreme Health Potion',t:'con',heal:1600,v:380},
  mpot1:{n:'Minor Mana Potion',t:'con',mana:40,v:18},mpot2:{n:'Mana Potion',t:'con',mana:120,v:55},mpot3:{n:'Greater Mana Potion',t:'con',mana:320,v:150},
  stonic:{n:'Stamina Tonic',t:'con',stam:80,v:20},antidote:{n:'Antidote',t:'con',cure:1,v:12},elixir_str:{n:'Elixir of Might',t:'con',buff:'might',v:60},
  elixir_def:{n:'Ironskin Draught',t:'con',buff:'fortify',v:60},smoke:{n:'Smoke Bomb',t:'con',escape:1,v:30},firebomb:{n:'Fire Flask',t:'con',bomb:1,e:'fire',dmg:60,v:35},
  scroll_return:{n:'Scroll of Return',t:'con',ret:1,v:40},revive:{n:'Phoenix Down',t:'con',revive:1,v:250},
  bread:{n:'Bread Loaf',t:'food',heal:30,v:3},jerky:{n:'Venison Jerky',t:'food',heal:45,stam:20,v:6},stew:{n:'Spiced Stew',t:'food',heal:120,stam:60,v:18,wellfed:1},
  roast:{n:'Roast Boar',t:'food',heal:200,v:30,wellfed:1},waybread:{n:'Elven Waybread',t:'food',heal:150,mana:60,v:35,wellfed:1},stout:{n:'Dwarven Stout',t:'food',stam:150,v:15,wellfed:1},
  fish_grill:{n:'Grilled Trout',t:'food',heal:90,v:10},
  // materials
  ore_copper:{n:'Copper Ore',t:'mat',v:4},ore_iron:{n:'Iron Ore',t:'mat',v:8},ore_silver:{n:'Silver Ore',t:'mat',v:20},ore_mithril:{n:'Mithril Ore',t:'mat',v:55},ore_adamant:{n:'Adamantite Ore',t:'mat',v:120},
  ingot_iron:{n:'Iron Ingot',t:'mat',v:22},ingot_steel:{n:'Steel Ingot',t:'mat',v:50},ingot_mithril:{n:'Mithril Ingot',t:'mat',v:150},ingot_adamant:{n:'Adamantite Ingot',t:'mat',v:320},
  wood_oak:{n:'Oak Log',t:'mat',v:3},wood_elder:{n:'Elderwood Log',t:'mat',v:25},hide:{n:'Animal Hide',t:'mat',v:5},pelt_wolf:{n:'Wolf Pelt',t:'mat',v:9},
  leather:{n:'Cured Leather',t:'mat',v:18},silk:{n:'Spider Silk',t:'mat',v:20},
  herb_sun:{n:'Sunleaf',t:'mat',v:4},herb_moon:{n:'Moonpetal',t:'mat',v:12},herb_frost:{n:'Frostbloom',t:'mat',v:18},herb_bog:{n:'Bogmoss',t:'mat',v:10},herb_rose:{n:'Desert Rose',t:'mat',v:22},
  crystal_fire:{n:'Fire Crystal',t:'mat',v:30},crystal_frost:{n:'Frost Crystal',t:'mat',v:30},crystal_mana:{n:'Mana Crystal',t:'mat',v:40},crystal_void:{n:'Void Shard',t:'mat',v:150},
  fish_trout:{n:'River Trout',t:'mat',v:4},fish_eel:{n:'Saltmere Eel',t:'mat',v:12},meat:{n:'Raw Meat',t:'mat',v:3},
  goblin_ear:{n:'Goblin Ear',t:'mat',v:2},bone:{n:'Old Bones',t:'mat',v:3},venom:{n:'Venom Sac',t:'mat',v:14},ectoplasm:{n:'Ectoplasm',t:'mat',v:25},
  scale_drake:{n:'Drake Scale',t:'mat',v:60},dragon_heart:{n:'Dragon Heart',t:'mat',v:900},wyrm_ice:{n:'Wyrm Ice',t:'mat',v:500},hydra_blood:{n:'Hydra Blood',t:'mat',v:350},
  lich_dust:{n:'Lich Dust',t:'mat',v:700},sand_amber:{n:'Sun Amber',t:'mat',v:45},pearl:{n:'Sea Pearl',t:'mat',v:40},aether_shard:{n:'Aether Shard',t:'mat',v:300},
  // tomes (teach school mastery lv 1)
  tome_fire:{n:'Tome: Fire',t:'tome',school:'fire',v:120},tome_frost:{n:'Tome: Frost',t:'tome',school:'frost',v:120},tome_lightning:{n:'Tome: Lightning',t:'tome',school:'lightning',v:150},
  tome_holy:{n:'Tome: Holy Light',t:'tome',school:'holy',v:150},tome_shadow:{n:'Tome: Shadow',t:'tome',school:'shadow',v:180},tome_nature:{n:'Tome: Nature',t:'tome',school:'nature',v:130},
  tome_arcane:{n:'Tome: Arcane',t:'tome',school:'arcane',v:100},tome_summon:{n:'Tome: Summoning',t:'tome',school:'summoning',v:200},
  // tools/misc
  hammer_smith:{n:'Smith\'s Hammer',t:'tool',v:15},ring_signet:{n:'Family Signet',t:'misc',v:80},guild_charter:{n:'Guild Charter',t:'misc',v:1000},
  aether_fragment:{n:'Aethermoor Fragment',t:'quest',v:0},spire_key:{n:'Spire Key',t:'quest',v:0},trial_token:{n:'Trial Token',t:'quest',v:0},
  // starter fixed equipment ids map to generated gear
};
// starter equipment shortcuts -> [base, level]
const STARTER = {
  sword_iron:['sword',1],shield_iron:['shield',1],shield_wood:['shield',1],chest_plate:['chest_plate',1],legs_plate:['legs_plate',1],chest_leather:['chest_leather',1],legs_leather:['legs_leather',1],
  bow_short:['bow',1],dagger_iron:['dagger',1],dagger_rusty:['dagger',1],staff_oak:['staff',1],chest_cloth:['chest_cloth',1],mace_iron:['mace',1],axe_iron:['axe',1],
  fist_wraps:['fist',1],staff_bone:['staff',1],spear_iron:['spear',1]
};

/* ---------------- RECIPES ---------------- */
// m: mastery, lv: min mastery, in: {item:qty}, out: item id or gear:[base, levelOffset]
const RECIPES = [
  {id:'r_ingot_iron',n:'Smelt Iron Ingot',m:'smithing',lv:0,in:{ore_iron:2},out:'ingot_iron'},
  {id:'r_ingot_steel',n:'Smelt Steel Ingot',m:'smithing',lv:12,in:{ore_iron:2,ore_copper:1},out:'ingot_steel'},
  {id:'r_ingot_mithril',n:'Smelt Mithril Ingot',m:'smithing',lv:35,in:{ore_mithril:2,ore_silver:1},out:'ingot_mithril'},
  {id:'r_ingot_adamant',n:'Smelt Adamantite Ingot',m:'smithing',lv:55,in:{ore_adamant:2,ingot_mithril:1},out:'ingot_adamant'},
  {id:'r_leather',n:'Cure Leather',m:'smithing',lv:0,in:{hide:2},out:'leather'},
  {id:'r_w_iron',n:'Forge Iron Weapon',m:'smithing',lv:1,in:{ingot_iron:3,wood_oak:1},gear:'weapon',ilvl:6},
  {id:'r_a_iron',n:'Forge Iron Armor',m:'smithing',lv:1,in:{ingot_iron:3,leather:1},gear:'armor',ilvl:6},
  {id:'r_w_steel',n:'Forge Steel Weapon',m:'smithing',lv:15,in:{ingot_steel:3,wood_oak:2},gear:'weapon',ilvl:16},
  {id:'r_a_steel',n:'Forge Steel Armor',m:'smithing',lv:15,in:{ingot_steel:3,leather:2},gear:'armor',ilvl:16},
  {id:'r_w_mithril',n:'Forge Mithril Weapon',m:'smithing',lv:40,in:{ingot_mithril:3,wood_elder:1},gear:'weapon',ilvl:38},
  {id:'r_a_mithril',n:'Forge Mithril Armor',m:'smithing',lv:40,in:{ingot_mithril:3,silk:2},gear:'armor',ilvl:38},
  {id:'r_w_adamant',n:'Forge Adamantite Weapon',m:'smithing',lv:60,in:{ingot_adamant:3,wood_elder:2},gear:'weapon',ilvl:55},
  {id:'r_w_dragon',n:'Forge Dragonbone Weapon',m:'smithing',lv:75,in:{ingot_adamant:2,scale_drake:4,dragon_heart:1},gear:'weapon',ilvl:72,minR:3},
  {id:'r_hpot1',n:'Brew Minor Health Potion',m:'alchemy',lv:0,in:{herb_sun:2},out:'hpot1'},
  {id:'r_mpot1',n:'Brew Minor Mana Potion',m:'alchemy',lv:3,in:{herb_moon:1,herb_sun:1},out:'mpot1'},
  {id:'r_antidote',n:'Brew Antidote',m:'alchemy',lv:5,in:{herb_bog:1,herb_sun:1},out:'antidote'},
  {id:'r_hpot2',n:'Brew Health Potion',m:'alchemy',lv:15,in:{herb_sun:2,herb_moon:1},out:'hpot2'},
  {id:'r_mpot2',n:'Brew Mana Potion',m:'alchemy',lv:18,in:{herb_moon:2,crystal_mana:1},out:'mpot2'},
  {id:'r_stonic',n:'Brew Stamina Tonic',m:'alchemy',lv:8,in:{herb_sun:1,meat:1},out:'stonic'},
  {id:'r_elixir_str',n:'Brew Elixir of Might',m:'alchemy',lv:25,in:{herb_rose:1,venom:1},out:'elixir_str'},
  {id:'r_elixir_def',n:'Brew Ironskin Draught',m:'alchemy',lv:25,in:{herb_frost:1,ore_iron:2},out:'elixir_def'},
  {id:'r_hpot3',n:'Brew Greater Health Potion',m:'alchemy',lv:40,in:{herb_frost:2,herb_rose:1},out:'hpot3'},
  {id:'r_mpot3',n:'Brew Greater Mana Potion',m:'alchemy',lv:45,in:{herb_moon:3,crystal_mana:2},out:'mpot3'},
  {id:'r_hpot4',n:'Brew Supreme Health Potion',m:'alchemy',lv:70,in:{hpot3:2,hydra_blood:1},out:'hpot4'},
  {id:'r_firebomb',n:'Mix Fire Flask',m:'alchemy',lv:12,in:{crystal_fire:1,herb_sun:1},out:'firebomb'},
  {id:'r_smoke',n:'Mix Smoke Bomb',m:'alchemy',lv:10,in:{herb_bog:2,bone:1},out:'smoke'},
  {id:'r_jerky',n:'Cure Jerky',m:'cooking',lv:0,in:{meat:2},out:'jerky'},
  {id:'r_fish',n:'Grill Trout',m:'cooking',lv:0,in:{fish_trout:1},out:'fish_grill'},
  {id:'r_stew',n:'Cook Spiced Stew',m:'cooking',lv:10,in:{meat:2,herb_sun:1},out:'stew'},
  {id:'r_roast',n:'Roast Boar',m:'cooking',lv:25,in:{meat:4,herb_rose:1},out:'roast'},
  {id:'r_waybread',n:'Bake Elven Waybread',m:'cooking',lv:35,in:{herb_moon:2,herb_sun:2},out:'waybread'},
  {id:'r_ench_fire',n:'Enchant: Embers',m:'enchanting',lv:5,in:{crystal_fire:2},ench:'embers'},
  {id:'r_ench_frost',n:'Enchant: Frost',m:'enchanting',lv:5,in:{crystal_frost:2},ench:'frost'},
  {id:'r_ench_mighty',n:'Enchant: Mighty',m:'enchanting',lv:15,in:{crystal_mana:2,ore_silver:1},ench:'mighty'},
  {id:'r_ench_arcane',n:'Enchant: Arcane',m:'enchanting',lv:15,in:{crystal_mana:3},ench:'arcane'},
  {id:'r_ench_keen',n:'Enchant: Keen',m:'enchanting',lv:30,in:{crystal_mana:2,pearl:1},ench:'keen'},
  {id:'r_ench_night',n:'Enchant: Night',m:'enchanting',lv:40,in:{crystal_void:1,ectoplasm:2},ench:'night'},
  {id:'r_ench_vamp',n:'Enchant: Vampiric',m:'enchanting',lv:55,in:{crystal_void:2,venom:3},ench:'vampiric'},
];

/* ---------------- MONSTERS ----------------
 lv: [min,max], hp/at/df/md/ev/sp multipliers, b: behaviors, w: weak elements, r: resist elements, loot: [[item,chance,qty]], g: gold mult
 tame: species id for taming, cat: beast|humanoid|undead|elemental|dragon|construct|spirit */
const MONSTERS = {
  rat:{n:'Giant Rat',cat:'beast',hp:0.6,at:0.7,df:0.6,ev:1.2,b:['pack'],loot:[['meat',0.4,1],['hide',0.3,1]],g:0.3,tame:'rat'},
  slime:{n:'Green Slime',cat:'elemental',hp:0.9,at:0.6,df:0.5,md:0.4,w:['fire'],r:['poison'],loot:[['herb_bog',0.3,1]],g:0.4,tame:'slime'},
  wolf:{n:'Grey Wolf',cat:'beast',hp:0.8,at:1.0,df:0.7,ev:1.2,sp:1.3,b:['pack'],loot:[['pelt_wolf',0.5,1],['meat',0.5,1]],g:0.2,tame:'wolf'},
  boar:{n:'Tusked Boar',cat:'beast',hp:1.2,at:1.0,df:1.0,b:['brute'],loot:[['meat',0.8,2],['hide',0.5,1]],g:0.2,tame:'boar'},
  goblin:{n:'Goblin Warrior',cat:'humanoid',hp:0.9,at:1.0,df:0.8,b:['ambush','coward'],loot:[['goblin_ear',0.6,1],['ore_copper',0.2,1]],g:1.0,gear:0.08},
  goblin_archer:{n:'Goblin Archer',cat:'humanoid',hp:0.7,at:1.05,df:0.6,b:['ranged','ambush'],loot:[['goblin_ear',0.6,1]],g:1.0,gear:0.08},
  goblin_shaman:{n:'Goblin Shaman',cat:'humanoid',hp:0.7,at:0.8,df:0.6,md:1.2,b:['caster','healer'],e:'nature',loot:[['herb_sun',0.4,2],['crystal_mana',0.08,1]],g:1.2,gear:0.08},
  bandit:{n:'Bandit Cutthroat',cat:'humanoid',hp:1.0,at:1.1,df:0.9,b:['coward','surrender'],loot:[['jerky',0.3,1]],g:1.8,gear:0.12},
  bandit_archer:{n:'Bandit Archer',cat:'humanoid',hp:0.85,at:1.1,df:0.7,b:['ranged','surrender'],loot:[],g:1.6,gear:0.12},
  bandit_captain:{n:'Bandit Captain',cat:'humanoid',hp:2.2,at:1.3,df:1.2,b:['elite','surrender'],loot:[['hpot2',0.5,1]],g:4,gear:0.4},
  kobold:{n:'Kobold Miner',cat:'humanoid',hp:0.8,at:0.9,df:0.9,b:['pack','ambush'],loot:[['ore_iron',0.5,2],['ore_copper',0.5,2]],g:0.8,gear:0.05},
  spider:{n:'Cave Spider',cat:'beast',hp:0.9,at:1.0,df:0.8,ev:1.2,b:['ambush'],e:'poison',st:['poison',0.3,3],loot:[['silk',0.5,1],['venom',0.3,1]],g:0.2,tame:'spider'},
  skeleton:{n:'Skeleton',cat:'undead',hp:1.0,at:1.0,df:1.1,w:['holy','fire'],r:['shadow','poison'],b:['undead'],loot:[['bone',0.7,2]],g:0.6,gear:0.1},
  zombie:{n:'Rotting Zombie',cat:'undead',hp:1.5,at:0.9,df:0.7,sp:0.6,w:['holy','fire'],r:['shadow','poison'],b:['undead'],st:['poison',0.2,3],loot:[['bone',0.5,1]],g:0.4},
  salamander:{n:'Ember Salamander',cat:'elemental',hp:1.0,at:1.1,df:0.9,e:'fire',w:['frost'],r:['fire'],st:['burn',0.3,2],loot:[['crystal_fire',0.55,1]],g:0.4,tame:'salamander'},
  wisp:{n:'Will-o\'-Wisp',cat:'spirit',hp:0.6,at:0.9,df:0.4,md:1.6,ev:1.6,e:'arcane',b:['caster'],w:['shadow'],loot:[['crystal_mana',0.4,1],['herb_moon',0.3,1]],g:0.3,tame:'wisp'},
  treant:{n:'Corrupted Treant',cat:'spirit',hp:2.0,at:1.1,df:1.4,sp:0.6,w:['fire'],r:['nature','frost'],b:['brute'],loot:[['wood_elder',0.6,1]],g:0.5},
  dryad:{n:'Wild Dryad',cat:'spirit',hp:0.9,at:0.9,md:1.4,e:'nature',b:['caster','healer'],loot:[['herb_moon',0.6,2]],g:0.6},
  moonstag:{n:'Moonfall Stag',cat:'beast',hp:1.3,at:1.1,df:1.0,sp:1.3,e:'arcane',loot:[['hide',0.6,2],['herb_moon',0.4,1]],g:0.3,tame:'stag'},
  frost_wolf:{n:'Frost Wolf',cat:'beast',hp:1.0,at:1.1,df:0.9,sp:1.3,e:'frost',r:['frost'],w:['fire'],b:['pack'],loot:[['pelt_wolf',0.6,1],['crystal_frost',0.2,1]],g:0.3,tame:'wolf'},
  ice_troll:{n:'Ice Troll',cat:'humanoid',hp:1.8,at:1.2,df:1.2,sp:0.7,r:['frost'],w:['fire'],b:['brute','regen'],loot:[['herb_frost',0.4,1]],g:1.5,gear:0.15},
  yeti:{n:'Yeti',cat:'beast',hp:1.9,at:1.25,df:1.1,r:['frost'],w:['fire'],b:['brute'],loot:[['hide',0.8,3],['meat',0.8,3]],g:0.5,tame:'yeti'},
  harpy:{n:'Harpy',cat:'beast',hp:0.8,at:1.1,ev:1.4,sp:1.4,b:['ranged','pack'],loot:[['hide',0.3,1]],g:0.6},
  golem:{n:'Stone Golem',cat:'construct',hp:2.1,at:1.15,df:1.8,md:0.6,sp:0.5,r:['poison','nature'],w:['lightning'],b:['brute'],loot:[['ore_silver',0.5,2],['ore_mithril',0.15,1]],g:0.6},
  dark_scout:{n:'Duskblade Scout',cat:'humanoid',hp:1.0,at:1.2,df:0.9,ev:1.3,r:['shadow'],b:['ambush','ranged'],loot:[['venom',0.3,1]],g:2,gear:0.15},
  drider:{n:'Drider',cat:'beast',hp:1.8,at:1.3,df:1.2,e:'poison',st:['poison',0.4,3],b:['caster'],loot:[['silk',0.8,2],['venom',0.6,1]],g:1.2},
  orc_raider:{n:'Orc Raider',cat:'humanoid',hp:1.3,at:1.3,df:1.0,b:['aggressive'],loot:[['meat',0.3,1]],g:1.5,gear:0.15},
  orc_berserker:{n:'Orc Berserker',cat:'humanoid',hp:1.5,at:1.6,df:0.8,b:['aggressive','brute'],loot:[],g:1.8,gear:0.18},
  scorpion:{n:'Sand Scorpion',cat:'beast',hp:1.3,at:1.2,df:1.4,e:'poison',st:['poison',0.4,3],loot:[['venom',0.6,1]],g:0.3,tame:'scorpion'},
  mummy:{n:'Ancient Mummy',cat:'undead',hp:1.8,at:1.2,df:1.1,w:['fire','holy'],r:['shadow','poison'],b:['undead'],st:['weaken',0.2,3],loot:[['sand_amber',0.4,1]],g:2,gear:0.15},
  sand_wraith:{n:'Sand Wraith',cat:'undead',hp:1.1,at:1.3,md:1.5,ev:1.4,e:'shadow',w:['holy'],r:['shadow','poison'],b:['undead','caster'],loot:[['ectoplasm',0.4,1]],g:1.0},
  bog_lurker:{n:'Bog Lurker',cat:'beast',hp:1.5,at:1.2,df:1.2,b:['ambush'],loot:[['hide',0.6,2],['herb_bog',0.5,2]],g:0.3,tame:'croc'},
  naga:{n:'Naga Siren',cat:'humanoid',hp:1.2,at:1.1,md:1.4,e:'frost',b:['caster'],loot:[['pearl',0.4,1]],g:2,gear:0.15},
  swamp_troll:{n:'Swamp Troll',cat:'humanoid',hp:1.9,at:1.25,df:1.1,b:['brute','regen'],w:['fire'],loot:[['herb_bog',0.6,2]],g:1.4,gear:0.12},
  sea_serpent:{n:'Sea Serpent',cat:'beast',hp:2.0,at:1.4,df:1.2,e:'frost',w:['lightning'],loot:[['pearl',0.5,1],['fish_eel',0.6,2]],g:0.8,tame:'serpent'},
  drowned:{n:'Drowned Knight',cat:'undead',hp:1.6,at:1.3,df:1.5,w:['lightning','holy'],r:['frost','shadow'],b:['undead'],loot:[['pearl',0.3,1]],g:2,gear:0.25},
  gargoyle:{n:'Gargoyle',cat:'construct',hp:1.6,at:1.3,df:1.7,r:['poison'],w:['lightning'],loot:[['ore_silver',0.4,1]],g:0.8},
  wraith:{n:'Wraith',cat:'undead',hp:1.2,at:1.4,md:1.6,ev:1.5,e:'shadow',w:['holy'],r:['shadow','frost','poison'],b:['undead','caster'],st:['weaken',0.3,2],loot:[['ectoplasm',0.6,1]],g:1.0},
  death_knight_m:{n:'Fallen Death Knight',cat:'undead',hp:2.2,at:1.6,df:1.6,e:'shadow',w:['holy'],r:['shadow','frost'],b:['undead','elite'],loot:[['ectoplasm',0.6,1],['crystal_void',0.15,1]],g:3,gear:0.4},
  fire_elemental:{n:'Fire Elemental',cat:'elemental',hp:1.4,at:1.5,md:1.2,e:'fire',w:['frost'],r:['fire','poison'],st:['burn',0.4,2],loot:[['crystal_fire',0.8,2]],g:0.5,tame:'salamander'},
  drake:{n:'Ash Drake',cat:'dragon',hp:2.0,at:1.5,df:1.4,e:'fire',r:['fire'],w:['frost'],b:['brute'],loot:[['scale_drake',0.6,1]],g:2,gear:0.2,tame:'drake'},
  voidspawn:{n:'Voidspawn',cat:'spirit',hp:1.5,at:1.6,md:1.6,e:'shadow',w:['holy','arcane'],r:['shadow'],loot:[['crystal_void',0.35,1]],g:1.5},
  construct:{n:'Aethermoor Construct',cat:'construct',hp:2.0,at:1.4,df:1.6,md:1.4,e:'arcane',w:['lightning'],r:['poison','arcane'],b:['brute'],loot:[['aether_shard',0.15,1],['crystal_mana',0.5,1]],g:1.0,gear:0.15},
  sentinel:{n:'Spire Sentinel',cat:'construct',hp:2.4,at:1.7,df:1.8,md:1.6,e:'arcane',w:['lightning'],r:['poison'],b:['elite'],loot:[['aether_shard',0.4,1]],g:3,gear:0.3},
  soldier:{n:'Enemy Soldier',cat:'humanoid',hp:1.4,at:1.2,df:1.3,b:['surrender'],loot:[],g:2,gear:0.1},
  // bosses
  b_foreman:{n:'Kobold King Skrix',cat:'humanoid',boss:1,hp:5,at:1.4,df:1.3,b:['boss','pack'],loot:[['ore_silver',1,3]],g:10,gear:1,uniq:null},
  b_grubnak:{n:'Goblin Warlord Grubnak',cat:'humanoid',boss:1,hp:14,at:1.6,df:1.4,b:['boss'],loot:[['hpot2',1,3]],g:30,gear:1,uniq:'grubnak_axe'},
  b_banditlord:{n:'Rask the Red-Handed',cat:'humanoid',boss:1,hp:6,at:1.6,df:1.4,b:['boss','surrender'],loot:[],g:25,gear:1},
  b_colossus:{n:'Undervault Colossus',cat:'construct',boss:1,hp:7,at:1.6,df:2.2,w:['lightning'],b:['boss','brute'],loot:[['ore_mithril',1,3]],g:15,gear:1},
  b_matron:{n:'Spider Matron Ixx',cat:'beast',boss:1,hp:6,at:1.6,df:1.3,e:'poison',st:['poison',0.6,3],b:['boss'],loot:[['silk',1,5],['venom',1,3]],g:15,gear:1},
  b_tidelord:{n:'Tidelord Maeros',cat:'undead',boss:1,hp:7,at:1.7,df:1.6,e:'frost',w:['lightning','holy'],b:['boss','undead','caster'],loot:[['pearl',1,4]],g:30,gear:1},
  b_pharaoh:{n:'Pharaoh Sekhmar',cat:'undead',boss:1,hp:7.5,at:1.8,df:1.6,e:'shadow',w:['holy','fire'],b:['boss','undead','caster'],loot:[['sand_amber',1,5]],g:40,gear:1},
  b_bonecolossus:{n:'Bone Colossus',cat:'undead',boss:1,hp:8,at:2.0,df:1.8,w:['holy'],b:['boss','undead','brute'],loot:[['crystal_void',1,2]],g:45,gear:1},
  b_aetherwarden:{n:'Aether Warden',cat:'construct',boss:1,hp:6.5,at:1.7,df:1.8,e:'arcane',b:['boss'],loot:[['aether_shard',1,2]],g:30,gear:1},
  b_frostwyrm:{n:'Frost Wyrm Hjalvar',cat:'dragon',boss:1,world:1,hp:40,at:2.0,df:1.8,e:'frost',w:['fire'],r:['frost'],b:['boss','dragon'],loot:[['wyrm_ice',1,1],['crystal_frost',1,5]],g:120,gear:2,uniq:'frostmourn'},
  b_hydra:{n:'Swamp Hydra',cat:'beast',boss:1,world:1,hp:35,at:1.9,df:1.6,e:'poison',st:['poison',0.5,3],w:['fire'],b:['boss','regen'],loot:[['hydra_blood',1,1]],g:90,gear:2,uniq:'hydrafang'},
  b_dragon:{n:'Ancient Red Dragon Pyrrhax',cat:'dragon',boss:1,world:1,hp:60,at:2.4,df:2.2,md:2,e:'fire',w:['frost'],r:['fire'],st:['burn',0.5,3],b:['boss','dragon'],loot:[['dragon_heart',1,1],['scale_drake',1,6]],g:300,gear:3,uniq:'fireblade'},
  b_lich:{n:'Lich King Vel',cat:'undead',boss:1,world:1,hp:55,at:2.3,df:2.0,md:2.4,e:'shadow',w:['holy'],r:['shadow','frost','poison'],b:['boss','undead','caster'],loot:[['lich_dust',1,1],['crystal_void',1,4]],g:280,gear:3,uniq:'lichcrown'},
  b_shattered:{n:'The Shattered One',cat:'spirit',boss:1,hp:12,at:2.6,df:2.4,md:2.4,e:'arcane',w:['holy'],b:['boss','caster'],loot:[['aether_shard',1,5]],g:500,gear:3,uniq:'eternal_orb'},
  // trial enemies
  trial_foe:{n:'Trial Champion',cat:'humanoid',boss:1,hp:4,at:1.5,df:1.5,b:['boss'],loot:[],g:0,gear:0}
};

/* Creature species for summoning & evolution chains: evolve at [lv, nextSpecies] */
const SPECIES = {
  wisp:{n:'Spirit Wisp',mon:'wisp',evo:[15,'lumen']},lumen:{n:'Lumen Spirit',mon:'wisp',mult:1.3,evo:[35,'astral']},astral:{n:'Astral Guardian',mon:'wisp',mult:1.7,evo:[65,'seraph']},seraph:{n:'Aether Seraph',mon:'wisp',mult:2.2},
  skeleton:{n:'Skeletal Thrall',mon:'skeleton',evo:[20,'boneguard']},boneguard:{n:'Bone Guard',mon:'skeleton',mult:1.35,evo:[45,'deathlord']},deathlord:{n:'Death Lord',mon:'death_knight_m',mult:1.8},
  wolf:{n:'Wolf Pup',mon:'wolf',evo:[15,'direwolf']},direwolf:{n:'Dire Wolf',mon:'wolf',mult:1.35,evo:[35,'fenrir']},fenrir:{n:'Fenrir Whelp',mon:'frost_wolf',mult:1.7,evo:[60,'moonfang']},moonfang:{n:'Moonfang',mon:'frost_wolf',mult:2.2},
  rat:{n:'Sewer Rat',mon:'rat',evo:[12,'plaguerat']},plaguerat:{n:'Plague Rat',mon:'rat',mult:1.4},
  slime:{n:'Slimeling',mon:'slime',evo:[18,'gelcube']},gelcube:{n:'Gelatinous Cube',mon:'slime',mult:1.5,evo:[40,'oozeking']},oozeking:{n:'Ooze King',mon:'slime',mult:2.0},
  boar:{n:'Boarlet',mon:'boar',evo:[20,'warboar']},warboar:{n:'War Boar',mon:'boar',mult:1.5},
  spider:{n:'Cave Spiderling',mon:'spider',evo:[25,'driderling']},driderling:{n:'Broodmother',mon:'drider',mult:1.5},
  salamander:{n:'Salamander',mon:'salamander',evo:[30,'flamekin']},flamekin:{n:'Flamekin',mon:'fire_elemental',mult:1.6},
  stag:{n:'Moon Fawn',mon:'moonstag',evo:[30,'moonstag']},moonstag:{n:'Moonfall Stag',mon:'moonstag',mult:1.5},
  yeti:{n:'Yeti Cub',mon:'yeti',evo:[40,'yetiking']},yetiking:{n:'Yeti Patriarch',mon:'yeti',mult:1.6},
  scorpion:{n:'Scorpling',mon:'scorpion',evo:[40,'emperorscorp']},emperorscorp:{n:'Emperor Scorpion',mon:'scorpion',mult:1.6},
  croc:{n:'Bog Hatchling',mon:'bog_lurker',evo:[40,'mirelord']},mirelord:{n:'Mire Lord',mon:'bog_lurker',mult:1.6},
  serpent:{n:'Sea Snake',mon:'sea_serpent',evo:[45,'leviathan']},leviathan:{n:'Young Leviathan',mon:'sea_serpent',mult:1.7},
  drake:{n:'Drakeling',mon:'drake',evo:[55,'wyvern']},wyvern:{n:'War Wyvern',mon:'drake',mult:1.8}
};

/* ---------------- FACTIONS / KINGDOMS ---------------- */
const FACTIONS = {
  aldmere:{n:'Kingdom of Aldmere',ruler:'Queen Isolde III',capital:'valeria',race:'Human',gov:'Feudal monarchy, the Lion Crown and the Council of Barons',
    religion:'The Dawnmother (Church of the First Light)',military:'Lion Guard knights, levy pikemen, Greenmarch longbowmen',economy:'Grain, wool, horses, Ironford steel',
    culture:'Tourneys, saints\' days and harvest fairs. Oaths are sworn on swords and bread.',ambition:'Retake the Crossroads toll roads and hold the Ironford mines against the dwarves.',
    history:'Founded by Aldric Lionheart 900 years ago on the ashes of the Sundering. The Crown has outlived three civil wars and the Plague of Grey Years.'},
  sylvan:{n:'Sylvan Concord',ruler:'High Speaker Elarion & the Thornmother',capital:'lothirien',race:'High Elves & Wood Elves',gov:'Twin council: the Starspire Conclave and the Greenpact Circle',
    religion:'Astraea the Star-Weaver and the Old Green',military:'Starspire battlemages, Thornvale wardens, moonblade dancers',economy:'Enchantments, elderwood, moonpetal, books',
    culture:'Centuries-long memory. Very formal. Songs of the Aethermoor are still sung in the old tongue.',ambition:'Keep Aethermoor\'s sun-engine from ever being rekindled. Purge the corruption in Moonfall Glade.',
    history:'Survivors of the Aethermoor collapse. They sealed the Shattered Spire and swore the Concord so that no single power would rule magic again.'},
  khaz:{n:'Khaz Durrim',ruler:'High King Thrain Emberbeard',capital:'khazgard',race:'Dwarves',gov:'Elective monarchy among the Seven Clans, bound by the Stone Ledger',
    religion:'Ancestor veneration and Morrak the Forgefather',military:'Ironwall shieldbearers, runepriests, cannoneers',economy:'Mithril, steel, gems, engineering',
    culture:'Grudges, debts and gifts are all recorded and all repaid. Ale is sacred.',ambition:'Reclaim the lost deep-hold of Undervault and claim the Ironford ore veins.',
    history:'The dwarves sheltered thousands during the Sundering and paid for it with Undervault, which was lost to the things that came up from the deep.'},
  horde:{n:'Gor\'Thak Horde',ruler:'Warchief Durza Ashborn',capital:'bloodrock',race:'Orcs',gov:'Warchief chosen by the Rite of Ash, advised by clan shamans',
    religion:'The Ash Spirits and the Ancestors of the Burned Plain',military:'Wolf riders, berserker warbands, shaman drummers',economy:'Livestock, salt, mercenary contracts, dragon-bone trade',
    culture:'Strength and honor. A yielded foe is spared, a broken oath is never forgiven.',ambition:'Claim the Ashen Valley from the dragon and win respect from the southern kingdoms.',
    history:'Driven east into the wastes by the Aldmere crusades. Durza united the clans twenty years ago after killing a drake bare-handed.'},
  feral:{n:'Beastkin Confederacy',ruler:'Elder Moot of Pawhaven',capital:'pawhaven',race:'Beastkin',gov:'Council of pack-elders, decisions by howl-vote',
    religion:'The Moon Mother and totem spirits',military:'Skirmisher packs, tide-riders, swamp stalkers',economy:'Fishing, pearls, herbs, hunting guides',
    culture:'Freedom over everything. Debts to a pack are paid in blood or song.',ambition:'Never be chained again, and push the Saltmere slavers\' heirs out of the coast.',
    history:'Freed in the Unchaining, when the slave-legions turned on the dying Aethermoor Empire.'},
  saltmere:{n:'Saltmere Merchant Republic',ruler:'The Doge and the Guild of Seven Purses',capital:'saltmere',race:'Mixed',gov:'Plutocratic republic; the votes are bought with shares',
    religion:'Officially the Dawnmother, in practice the Tide and coin',military:'Mercenary companies, the Silver Fleet',economy:'Banking, shipping, auction houses, insurance',
    culture:'Everything has a price. Contracts are sacred, and sometimes they are the only thing that is.',ambition:'Monopolize trade between the continents and lend money to every crown.',
    history:'Founded by Aethermoor tax-collectors who kept the treasury when the empire fell.'},
  dusk:{n:'Duskhaven Matriarchy',ruler:'Matriarch Velyss Nightweaver',capital:'duskhaven',race:'Dark Elves',gov:'Matriarchal council of Nine Houses',
    religion:'The Spider Oracle, Weaver of Fates',military:'Duskblades, shadow-mages, spider cavalry',economy:'Poisons, silk, secrets, slaves (outlawed elsewhere)',
    culture:'Intrigue is an art and politeness is a weapon.',ambition:'Reclaim the surface lands lost in the Sundering, and steal the Starspire\'s archives.',
    history:'Elves who sided with the last Aethermoor Emperor and fled underground when he fell.'},
  free:{n:'Free Cities',ruler:'Town councils',capital:'crossroads',race:'Mixed',gov:'Independent charters',religion:'Every faith',military:'Militias, hired adventurers',economy:'Trade and adventuring contracts',
    culture:'Nobody asks where you came from.',ambition:'Stay free of every crown.',history:'Frontier towns that grew up around adventurer guildhalls after the Sundering.'}
};
const KINGDOMS = ['aldmere','sylvan','khaz','horde','feral','saltmere','dusk'];
const INIT_RELATIONS = { // symmetric
  'aldmere-sylvan':35,'aldmere-khaz':-20,'aldmere-horde':-55,'aldmere-feral':5,'aldmere-saltmere':40,'aldmere-dusk':-40,
  'sylvan-khaz':10,'sylvan-horde':-15,'sylvan-feral':30,'sylvan-saltmere':0,'sylvan-dusk':-70,
  'khaz-horde':-30,'khaz-feral':10,'khaz-saltmere':25,'khaz-dusk':-35,
  'horde-feral':15,'horde-saltmere':-10,'horde-dusk':0,'feral-saltmere':-35,'feral-dusk':-20,'saltmere-dusk':10};

/* ---------------- LOCATIONS ----------------
 x,y on 1000x700 map. ty: city|town|village|wild|dungeon|ruin|lair ; lv:[min,max] ; f: faction controlling ; sv: services
 mon: monster pool ; res: gather [item, mastery] ; con: {id: hours} ; hid: hidden until discovered ; pvp: open pvp ; boss: dungeon boss */
const LOCS = {
  brookhollow:{n:'Brookhollow',ty:'village',x:215,y:385,f:'aldmere',lv:[1,3],sv:['inn','shop','board','smith'],mon:['rat','slime'],res:[['herb_sun','herbalism'],['fish_trout','fishing'],['wood_oak','woodcutting']],
    d:'A sleepy halfling-and-human village of thatched roofs by a millstream. Most adventurers start here, and plenty never leave.',
    feat:['The old mill','The Laughing Pig inn','A notice board covered in faded bounties','A moss-covered standing stone']},
  greenmarch:{n:'Greenmarch Fields',ty:'wild',x:265,y:435,f:'aldmere',lv:[1,5],mon:['rat','wolf','boar','slime','goblin'],res:[['herb_sun','herbalism'],['meat','cooking'],['wood_oak','woodcutting']],
    d:'Rolling farmland and wildflower meadows. Wolves come down at dusk and goblins raid the farther farms.',feat:['A burned-out farmhouse','A scarecrow that seems to watch you','An old Aethermoor milestone']},
  whisperwood:{n:'Whisperwood',ty:'wild',x:175,y:300,f:'aldmere',lv:[3,8],mon:['wolf','goblin','goblin_archer','goblin_shaman','spider'],res:[['herb_sun','herbalism'],['wood_oak','woodcutting'],['herb_moon','herbalism']],
    d:'An old forest whose leaves seem to whisper. Goblin tribes have dug warrens under its roots.',feat:['A goblin totem of skulls','A hollow oak with carvings','A hermit\'s abandoned hut']},
  mine:{n:'Abandoned Mine',ty:'dungeon',x:140,y:410,f:null,lv:[5,10],mon:['kobold','spider','rat','skeleton'],res:[['ore_copper','mining'],['ore_iron','mining']],boss:'b_foreman',floors:3,
    d:'The Brookhollow silver mine was abandoned after the miners "dug too deep." Kobolds have moved in since.',feat:['Rusted mine carts','A collapsed shaft','Strange claw marks']},
  ember:{n:'Ember Grotto',ty:'wild',x:290,y:255,f:'aldmere',lv:[10,15],mon:['salamander','fire_elemental','spider'],res:[['crystal_fire','mining'],['ore_iron','mining']],
    d:'A volcanic cave north of Valeria. The walls glow, and salamanders bask in pools of molten rock. Fire crystals grow here.',feat:['A lava pool','Crystal clusters','Old dwarf mining runes']},
  valeria:{n:'Valeria',ty:'city',x:305,y:335,f:'aldmere',lv:[1,100],sv:['inn','shop','smith','market','guild','temple','library','arena','trainer','board','forge','alchemy','stable'],mon:[],res:[],
    d:'Capital of Aldmere. White walls, the Lion Cathedral and the Grand Arena. Most of the big guilds keep their halls here.',feat:['The Lion Cathedral','The Grand Arena','The Royal Library','The Adventurers\' Plaza fountain']},
  watchtower:{n:'Old Watchtower',ty:'ruin',x:345,y:415,f:null,lv:[8,12],mon:['bandit','bandit_archer','skeleton','bandit_captain'],res:[['ore_copper','mining']],
    d:'A broken Aethermoor-era watchtower on a hill. Bandits use it as a lookout, and the cellar is older than the tower.',feat:['A cracked star-mosaic on the floor','Bandit graffiti','A sealed cellar door with imperial glyphs']},
  ironford:{n:'Ironford',ty:'town',x:390,y:290,f:'aldmere',lv:[1,100],sv:['inn','shop','smith','forge','board','trainer','market'],mon:[],res:[],
    d:'A soot-black mining town on a river ford, disputed between Aldmere and the dwarves. Its forges never cool.',feat:['The Great Bellows','The disputed boundary stone','The Draconian quarter']},
  mirren:{n:'Lake Mirren',ty:'wild',x:385,y:225,f:'aldmere',lv:[6,10],mon:['wolf','slime','boar','harpy'],res:[['fish_trout','fishing'],['herb_moon','herbalism']],
    d:'A clear mountain lake. Locals say a drowned Aethermoor chapel lies at the bottom.',feat:['A ruined pier','Bubbles rising from the middle of the lake','A fisherman\'s shrine']},
  grimward:{n:'Fort Grimward',ty:'dungeon',x:445,y:215,f:null,lv:[12,18],mon:['bandit','bandit_archer','bandit_captain','orc_raider'],res:[['ore_iron','mining']],boss:'b_banditlord',floors:3,
    d:'A border fortress abandoned in the last war and taken over by the Red Hand bandits.',feat:['Broken siege engines','A banner of the Red Hand','A prison block']},
  crossroads:{n:'Crossroads',ty:'town',x:470,y:350,f:'free',lv:[1,100],sv:['inn','shop','smith','market','guild','board','trainer','arena','stable'],mon:[],res:[],
    d:'A frontier town where five roads meet. Free of every crown. Adventurers, smugglers and refugees all pass through.',feat:['The Five Roads monument','The Broken Crown tavern','A tunnel entrance sealed with dark-elf runes']},
  thornvale:{n:'Thornvale',ty:'village',x:205,y:190,f:'sylvan',lv:[1,100],sv:['inn','shop','board','trainer','alchemy','temple'],mon:[],res:[['herb_moon','herbalism']],
    d:'A wood-elf village of treehouses joined by rope bridges, around a great heartwood tree.',feat:['The Heartwood Tree','The Warden lodge','Living hedge walls']},
  moonfall:{n:'Moonfall Glade',ty:'wild',x:125,y:140,f:'sylvan',lv:[14,22],mon:['wisp','dryad','treant','moonstag','spider'],res:[['herb_moon','herbalism'],['wood_elder','woodcutting'],['crystal_mana','mining']],
    d:'A magical forest that is always lit by moonlight. Something is corrupting the trees.',feat:['A silver pool reflecting stars at noon','Corrupted black roots','A circle of singing stones']},
  lothirien:{n:'Lothirien',ty:'city',x:270,y:110,f:'sylvan',lv:[1,100],sv:['inn','shop','smith','market','library','temple','trainer','board','alchemy','guild'],mon:[],res:[],
    d:'The High Elf capital of white marble spires around the Starspire, which holds the largest library in the Realms.',feat:['The Starspire','The Hall of Remembrance','The Moonwell']},
  crystallake:{n:'Crystal Lake',ty:'wild',x:345,y:150,f:'sylvan',lv:[10,16],mon:['wisp','harpy','slime','naga'],res:[['crystal_mana','mining'],['fish_trout','fishing']],
    d:'A lake that rings like a bell when the wind blows. Crystal spires grow out of the water.',feat:['Singing crystal spires','An elven observatory','A naga shrine half-sunk']},
  hollow:{n:'Hollow of Whispers',ty:'ruin',x:80,y:215,f:null,hid:1,lv:[25,32],mon:['wraith','wisp','dryad','voidspawn'],res:[['crystal_void','mining'],['herb_moon','herbalism']],
    d:'A hidden vale where the Aethermoor archmages hid their last secrets. It is full of whispering ghosts.',feat:['A ghostly library','A sealed vault of the Archmagi','Whispering mirrors']},
  frostpeak:{n:'Frostpeak Pass',ty:'wild',x:530,y:225,f:'khaz',lv:[18,26],mon:['frost_wolf','ice_troll','yeti','harpy'],res:[['herb_frost','herbalism'],['ore_silver','mining'],['crystal_frost','mining']],
    d:'A freezing mountain pass, the only road to Khazgard. Avalanches and trolls are both common.',feat:['A frozen dwarven caravan','A watch-cairn with a burning brazier','Giant footprints']},
  summit:{n:'Frostpeak Summit',ty:'lair',x:505,y:140,f:null,lv:[30,40],mon:['frost_wolf','ice_troll','yeti'],res:[['crystal_frost','mining'],['herb_frost','herbalism']],
    d:'An ice field at the roof of the world, where the Frost Wyrm Hjalvar sleeps.',feat:['Frozen dragon bones','A wind-scoured shrine','A wyrm\'s hoard glinting under the ice']},
  khazgard:{n:'Khazgard',ty:'city',x:610,y:150,f:'khaz',lv:[1,100],sv:['inn','shop','smith','forge','market','temple','trainer','board','library','guild','arena'],mon:[],res:[],
    d:'The dwarven capital carved into Mount Durrim, with endless halls, forges and the Hall of Kings.',feat:['The Hall of Kings','The Stone Ledger','The Great Forge']},
  deepforge:{n:'Deepforge',ty:'town',x:690,y:210,f:'khaz',lv:[1,100],sv:['inn','shop','smith','forge','board','trainer','alchemy'],mon:[],res:[['ore_mithril','mining']],
    d:'A forge-town built over a magma vent. Runesmiths sell their work here.',feat:['The Magma Vent','The Runesmith\'s school','The memorial of Undervault']},
  undervault:{n:'Undervault',ty:'dungeon',x:640,y:275,f:null,lv:[22,30],mon:['golem','spider','drider','kobold','gargoyle'],res:[['ore_mithril','mining'],['ore_silver','mining']],boss:'b_colossus',floors:4,
    d:'The lost dwarven deep-hold, overrun when the miners breached something that should have stayed sealed.',feat:['Sealed vault doors','Dwarven statues with faces chiseled off','A chasm with no bottom']},
  skyreach:{n:'Skyreach Monastery',ty:'village',x:575,y:75,f:null,hid:1,lv:[1,100],sv:['inn','trainer','temple'],mon:[],res:[['herb_frost','herbalism']],
    d:'A hidden monastery on a cliff, home of the Way of the Open Sky. Elementalists and monks train here.',feat:['The Prayer Wheels','The Endless Stair','The Elemental Mandala']},
  duskhaven:{n:'Duskhaven',ty:'city',x:575,y:340,f:'dusk',lv:[1,100],sv:['inn','shop','smith','market','alchemy','trainer','board','library','arena'],mon:[],res:[],
    d:'An underground dark-elf city lit by glowing fungus and violet lanterns, under the Spider Oracle\'s web-temple.',feat:['The Web-Temple','The Market of Whispers','The Nine Spires']},
  aethermoor:{n:'Ruins of Old Aethermoor',ty:'ruin',x:335,y:525,f:null,lv:[20,28],mon:['construct','skeleton','wraith','gargoyle'],res:[['aether_shard','mining'],['crystal_mana','mining']],boss:'b_aetherwarden',floors:3,
    d:'The broken capital of the empire that ruled the world before the Sundering. Its machines still guard it.',feat:['The cracked sun-engine','Statues of faceless emperors','A library of melted crystal']},
  saltmere:{n:'Port Saltmere',ty:'city',x:485,y:520,f:'saltmere',lv:[1,100],sv:['inn','shop','smith','market','guild','temple','board','alchemy','stable','port','arena','library'],mon:[],res:[['fish_eel','fishing']],
    d:'The richest city in the Realms, built over canals. The Grand Auction House runs day and night.',feat:['The Grand Auction House','The Bank of Seven Purses','The Silver Fleet harbor']},
  cove:{n:'Smuggler\'s Cove',ty:'village',x:400,y:595,f:null,hid:1,lv:[15,20],sv:['inn','shop','market','trainer'],mon:['bandit','naga'],res:[['pearl','fishing']],
    d:'A hidden pirate haven in sea caves. They have the best black-market goods and the worst manners.',feat:['A pirate ship in a sea cave','The Rusty Anchor','Wanted posters of Saltmere nobles']},
  mire:{n:'Mangrove Mire',ty:'wild',x:610,y:560,f:null,lv:[26,34],mon:['bog_lurker','swamp_troll','naga','zombie'],res:[['herb_bog','herbalism'],['wood_elder','woodcutting']],
    d:'A steaming swamp of mangroves. The Hydra\'s roars carry for miles.',feat:['A sunken temple','Hydra-gnawed bones','Glowing marsh lights']},
  pawhaven:{n:'Pawhaven',ty:'village',x:690,y:610,f:'feral',lv:[1,100],sv:['inn','shop','board','trainer','temple','market'],mon:[],res:[['fish_eel','fishing']],
    d:'The beastkin capital on stilts over the tidal flats. Totems carved with every clan\'s spirit.',feat:['The Totem Ring','The Moot Rock','Chain-breaker statue']},
  isles:{n:'Tidecaller Isles',ty:'wild',x:565,y:660,f:'feral',lv:[30,38],mon:['sea_serpent','naga','harpy','drowned'],res:[['pearl','fishing'],['fish_eel','fishing']],
    d:'A chain of storm-lashed islands. Some say they move.',feat:['A lighthouse with no keeper','A shipwreck graveyard','Tide pools of glowing fish']},
  citadel:{n:'Sunken Citadel',ty:'dungeon',x:465,y:655,f:null,lv:[38,46],mon:['drowned','naga','sea_serpent','wraith'],res:[['pearl','fishing']],boss:'b_tidelord',floors:4,
    d:'An Aethermoor sea-fortress dragged under the waves during the Sundering. It surfaces at low tide.',feat:['Flooded throne room','Barnacled war machines','An air-bubble chapel']},
  bloodrock:{n:'Bloodrock Hold',ty:'city',x:770,y:385,f:'horde',lv:[1,100],sv:['inn','shop','smith','forge','market','arena','trainer','board','temple'],mon:[],res:[],
    d:'The orc capital, carved into a red mesa. The Pit Arena roars every night.',feat:['The Pit Arena','The Ash Altar','The Warchief\'s Hall of Skulls']},
  dunes:{n:'Scorch Dunes',ty:'wild',x:790,y:480,f:'horde',lv:[34,42],mon:['scorpion','sand_wraith','mummy','orc_raider'],res:[['herb_rose','herbalism'],['sand_amber','mining']],pvp:1,
    d:'An endless red desert. Open-world PvP: rogue adventurers hunt each other here for bounties.',feat:['A half-buried colossus','Mirages of a lost city','Bleached caravan bones']},
  oasis:{n:'Sunscar Oasis',ty:'village',x:875,y:525,f:'horde',lv:[1,100],sv:['inn','shop','board','alchemy'],mon:[],res:[['herb_rose','herbalism']],
    d:'A palm oasis and caravan stop. Neutral ground by ancient law.',feat:['The Wishing Well','Caravanserai','A shrine to the Sun-King']},
  tomb:{n:'Tomb of Kings',ty:'dungeon',x:905,y:440,f:null,lv:[42,50],mon:['mummy','sand_wraith','scorpion','construct'],res:[['sand_amber','mining']],boss:'b_pharaoh',floors:4,
    d:'A pyramid of the pre-Aethermoor Sun-Kings. Its traps are as deadly as its dead.',feat:['Hieroglyphs of a forgotten war','A sarcophagus hall','The Sun-King\'s mask']},
  ashen:{n:'Ashen Valley',ty:'lair',x:845,y:295,f:null,lv:[50,60],mon:['drake','fire_elemental','orc_berserker'],res:[['crystal_fire','mining'],['scale_drake','mining']],pvp:1,
    d:'A valley of ash and obsidian, the realm of the Ancient Red Dragon Pyrrhax. Open-world PvP.',feat:['Obsidian spires','The dragon\'s scorched nest','Petrified orc warriors']},
  necropolis:{n:'Necropolis of Vel',ty:'dungeon',x:705,y:465,f:null,lv:[55,65],mon:['wraith','death_knight_m','skeleton','zombie'],res:[['ectoplasm','mining']],boss:'b_bonecolossus',floors:5,
    d:'The city of the dead, ruled by the Lich King Vel, once Court Archmage of Aethermoor.',feat:['Bone cathedral','The Lich\'s Phylactery Tower','Rivers of green fire']},
  spire:{n:'The Shattered Spire',ty:'dungeon',x:960,y:190,f:null,lv:[70,100],mon:['sentinel','voidspawn','construct','wraith'],res:[['aether_shard','mining'],['crystal_void','mining']],boss:'b_shattered',floors:6,pvp:1,
    d:'The floating ruin of the Aethermoor sun-engine\'s spire. The Sundering began here and the sky is still torn.',feat:['A tear in the sky','Floating debris islands','The Sun-Engine core']}
};
const ROUTES = [ // [a,b,hours]
  ['brookhollow','greenmarch',1],['brookhollow','whisperwood',2],['brookhollow','mine',2],['brookhollow','valeria',3],['greenmarch','watchtower',2],['greenmarch','aethermoor',4],
  ['valeria','whisperwood',3],['valeria','ember',2],['valeria','ironford',3],['valeria','watchtower',2],['valeria','crossroads',4],['valeria','thornvale',5],
  ['ironford','mirren',2],['ironford','grimward',3],['ironford','crossroads',3],['mirren','crystallake',3],['crystallake','lothirien',2],['thornvale','lothirien',3],
  ['thornvale','moonfall',3],['moonfall','hollow',4],['grimward','frostpeak',3],['frostpeak','summit',4],['frostpeak','khazgard',3],['khazgard','skyreach',5],['khazgard','deepforge',3],
  ['deepforge','undervault',2],['undervault','duskhaven',3],['crossroads','duskhaven',3],['crossroads','saltmere',4],['crossroads','bloodrock',6],['watchtower','saltmere',4],
  ['aethermoor','saltmere',3],['saltmere','cove',3],['saltmere','mire',4],['saltmere','citadel',5],['mire','pawhaven',3],['mire','necropolis',4],['pawhaven','isles',4],['isles','citadel',3],
  ['bloodrock','dunes',3],['bloodrock','ashen',4],['bloodrock','necropolis',4],['dunes','oasis',3],['oasis','tomb',3],['dunes','tomb',4],['ashen','spire',6],['deepforge','ashen',6]
];
const CONTESTED = ['ironford','crossroads','frostpeak','mire','dunes'];

/* ---------------- TOWNSFOLK (non-adventurer NPCs) ---------------- */
const TOWNSFOLK = {
  brookhollow:[['Old Marta','innkeeper'],['Pip Tallowbranch','farmer'],['Elder Wynn','elder']],
  valeria:[['Brother Aldous','librarian'],['Captain Roderic','guard'],['Madame Ysolde','merchant'],['Sister Celine','priest'],['Arena-master Kael','arena']],
  ironford:[['Forgemaster Hilde','smith'],['Rusk the Draconian','mystic']],
  crossroads:[['Veyra Moonsteel','mentor'],['One-Eyed Jory','barkeep'],['Courier Tamsin','courier']],
  thornvale:[['Warden Faelan','guard'],['Thornmother Ilsa','priest']],
  lothirien:[['Archivist Seraphine','librarian'],['Conclave Magister Orrin','mentor']],
  khazgard:[['Master Bren Ironhand','mentor'],['Loremaster Durgi','librarian'],['Brewer Olga','innkeeper']],
  deepforge:[['Runesmith Kazra','mentor']],
  duskhaven:[['Oracle-Speaker Nyx','priest'],['Silkmonger Vael','merchant']],
  saltmere:[['Factor Bellamy','merchant'],['Harbormaster Quill','guard'],['Auctioneer Prisca','merchant']],
  bloodrock:[['Shaman Grenna','priest'],['Pitmaster Ug','arena']],
  pawhaven:[['Elder Grey-Muzzle','elder'],['Tidecaller Saba','mentor']],
  cove:[['Captain Silk-Eye','smuggler']],
  skyreach:[['Grandmaster Ten-Winds','mentor']],
  oasis:[['Caravan-master Zeb','merchant']]
};

/* ---------------- LORE / CODEX ---------------- */
const LORE = {
  lore_sundering:{t:'The Sundering',cat:'History',x:'Twelve centuries ago the Aethermoor Empire tried to light a second sun, the Sun-Engine at the top of the Spire. It broke. The sky tore open over the eastern wastes, the continents cracked, and the empire fell in one night. Every kingdom alive today was built on what was left.'},
  lore_aethermoor:{t:'The Aethermoor Empire',cat:'History',x:'For a thousand years the Aethermoor Emperors ruled every continent with mage-engines and dragon-pacts. Elves were its scholars, beastkin its slave-legions, and humans its tax-farmers. Its last Emperor, Solenhal, is said to have walked into the Sun-Engine as it broke.'},
  lore_unchaining:{t:'The Unchaining',cat:'History',x:'As the empire fell, the beastkin slave-legions broke their collars and turned on their masters. Their general, Grey-Fang, led them to the Feral Coast. Every beastkin child learns the Chain-Breaker\'s song.'},
  lore_dragonpacts:{t:'The Dragon-Pacts',cat:'Myth',x:'Aethermoor\'s archmagi bound dragons with oaths written in blood. When the empire fell the oaths broke, and the dragons remember. Pyrrhax the Red was a pact-dragon, and draconians are said to descend from those bonds.'},
  lore_vel:{t:'Archmage Vel',cat:'Legend',x:'Court Archmage Vel foresaw the Sundering and saved himself instead of the empire. He bound his soul to a phylactery and now rules the Necropolis. Every few years his armies of dead march again.'},
  lore_lionheart:{t:'Aldric Lionheart',cat:'Legend',x:'A farmer\'s son from the Greenmarch who united the human refugee-bands and drove the goblin hordes out. He founded Valeria. He is buried somewhere under the Lion Cathedral with his sword, Dawnbreaker, which has never been found.'},
  lore_undervault:{t:'The Fall of Undervault',cat:'History',x:'Three hundred years ago the dwarves of Undervault dug for mithril and broke into an Aethermoor vault full of sleeping constructs. The hold fell in a single night. The Stone Ledger still records the debt as "owed by the deep."'},
  lore_concord:{t:'The Sylvan Concord',cat:'Politics',x:'The High Elves and the Wood Elves split over whether magic or nature should come first. The Concord binds them together, but the two councils rarely agree.'},
  lore_spideroracle:{t:'The Spider Oracle',cat:'Religion',x:'The dark elves worship a giant spider that sees the threads of fate. Her priestesses speak in riddles, and the Nine Houses treat her riddles as law.'},
  lore_dawnmother:{t:'The Dawnmother',cat:'Religion',x:'The human goddess of light, healing and the harvest. The Church of the First Light teaches that she kindled the true sun, and that Aethermoor\'s false sun was blasphemy.'},
  lore_ashspirits:{t:'The Ash Spirits',cat:'Religion',x:'Orcs believe their ancestors live in the ash of the Burned Plain. In the Rite of Ash, a would-be Warchief walks into the volcanic plains and comes back changed, or doesn\'t come back.'},
  lore_saltmere:{t:'The Seven Purses',cat:'Politics',x:'Seven merchant houses own Saltmere. Their founders were Aethermoor tax-collectors who sailed away with the imperial treasury. The Doge is elected, though the votes are bought openly.'},
  lore_spire:{t:'The Shattered Spire',cat:'Mystery',x:'The Spire still floats above the eastern wastes. Its sun-engine core pulses once every hundred years. Scholars argue about whether it is dying or waking up.'},
  lore_grubnak:{t:'Goblin Warlords',cat:'Bestiary',x:'Goblins breed fast and fight dirty, but alone they are cowards. A Warlord unites tribes by cunning and terror. When one appears, every village nearby is in danger.'},
  lore_wyrm:{t:'Hjalvar the Frost Wyrm',cat:'Bestiary',x:'An old white dragon who sleeps on Frostpeak Summit. The dwarves pay him a tribute of silver every winter, which some call cowardice and others call good sense.'},
  lore_hydra:{t:'The Mire Hydra',cat:'Bestiary',x:'Cut off one head and two grow back unless the stump is burned. The beastkin call it "Many-Mouths" and offer it no tribute.'},
  lore_hollow:{t:'The Hidden Archives',cat:'Mystery',x:'The Archmagi of Aethermoor hid their last research in a vale that does not appear on any map. People say you find it by following the whispers west of Moonfall Glade.'},
  lore_monastery:{t:'The Way of the Open Sky',cat:'Mystery',x:'Monks who believe the elements can be balanced inside the body. Their monastery is somewhere above Khazgard, past the end of the dwarf roads.'},
  lore_cove:{t:'Silk-Eye\'s Pirates',cat:'Rumor',x:'The Saltmere navy has hunted Captain Silk-Eye for twenty years. Sailors say his cove is three hours south-west of the harbor, behind a waterfall.'},
  lore_fragment:{t:'An Aethermoor Fragment',cat:'Mystery',x:'A shard of glowing crystal with a voice inside it: "...the engine was not broken. It was SILENCED. The key lies in..." The rest is lost.'},
  lore_classes:{t:'On the Higher Paths',cat:'Guide',x:'Masters in the great cities train exceptional adventurers in advanced disciplines. Each one demands experience, skill mastery and a trial. Some paths, like the Spellblade and the Weaponmaster, are open to any class that earns them.'},
  lore_guilds:{t:'Adventurer Guilds',cat:'Guide',x:'Since the Sundering, adventurer guilds have done the work kingdoms can\'t afford: hunting monsters, clearing dungeons, guarding caravans. The strongest guilds are now as powerful as nobles.'}
};
const LIBRARY_BOOKS = {valeria:['lore_lionheart','lore_dawnmother','lore_aethermoor','lore_classes','lore_guilds'],lothirien:['lore_sundering','lore_concord','lore_dragonpacts','lore_hollow','lore_aethermoor'],
  khazgard:['lore_undervault','lore_wyrm','lore_monastery'],duskhaven:['lore_spideroracle','lore_vel'],saltmere:['lore_saltmere','lore_cove','lore_unchaining']};

/* ---------------- STORY QUESTS ---------------- */
const STORY = [
  {id:'st1',n:'Echoes of the Empire',step:'Speak with Brother Aldous at the Royal Library in Valeria.',type:'visit',loc:'valeria',svc:'library',xp:120,gold:40},
  {id:'st2',n:'The Sealed Cellar',step:'Search the cellar under the Old Watchtower.',type:'explore',loc:'watchtower',xp:300,gold:60,give:'aether_fragment',lore:'lore_fragment'},
  {id:'st3',n:'Voice in the Crystal',step:'Bring the fragment to Archivist Seraphine in Lothirien.',type:'visit',loc:'lothirien',svc:'library',need:'aether_fragment',xp:600,gold:120},
  {id:'st4',n:'The Silenced Engine',step:'Defeat the Aether Warden in the Ruins of Old Aethermoor.',type:'boss',loc:'aethermoor',boss:'b_aetherwarden',xp:2500,gold:300},
  {id:'st5',n:'Whispers in the West',step:'Find the Hollow of Whispers, hidden west of Moonfall Glade.',type:'discover',loc:'hollow',xp:4000,gold:400},
  {id:'st6',n:'The Archmagi\'s Vault',step:'Explore the Hollow of Whispers and open the sealed vault.',type:'explore',loc:'hollow',xp:6000,gold:600},
  {id:'st7',n:'Drowned Secrets',step:'Defeat Tidelord Maeros in the Sunken Citadel to recover the second key-shard.',type:'boss',loc:'citadel',boss:'b_tidelord',xp:12000,gold:1200},
  {id:'st8',n:'The King Beneath',step:'Defeat Pharaoh Sekhmar in the Tomb of Kings and take the Sun-King\'s mask.',type:'boss',loc:'tomb',boss:'b_pharaoh',xp:20000,gold:2000,give:'spire_key'},
  {id:'st9',n:'The Shattered One',step:'Climb the Shattered Spire and face what silenced the Sun-Engine.',type:'boss',loc:'spire',boss:'b_shattered',need:'spire_key',xp:100000,gold:10000}
];

/* ---------------- ACHIEVEMENTS ---------------- */
const ACHIEVEMENTS = {
  first_blood:{n:'First Blood',d:'Win your first battle.',f:p=>p.stats.kills>=1},
  hunter100:{n:'Monster Hunter',d:'Defeat 100 monsters.',f:p=>p.stats.kills>=100},
  hunter1000:{n:'Exterminator',d:'Defeat 1,000 monsters.',f:p=>p.stats.kills>=1000},
  lv10:{n:'Seasoned',d:'Reach level 10.',f:p=>p.level>=10},lv25:{n:'Veteran Adventurer',d:'Reach level 25.',f:p=>p.level>=25},
  lv50:{n:'Renowned',d:'Reach level 50.',f:p=>p.level>=50},lv75:{n:'Champion of the Realms',d:'Reach level 75.',f:p=>p.level>=75},lv100:{n:'Eternal',d:'Reach level 100.',f:p=>p.level>=100},
  dungeon1:{n:'Delver',d:'Clear a dungeon.',f:p=>p.stats.dungeons>=1},dungeon10:{n:'Dungeon Crawler',d:'Clear 10 dungeons.',f:p=>p.stats.dungeons>=10},
  boss1:{n:'Giant Slayer',d:'Defeat a boss.',f:p=>p.stats.bosses>=1},worldboss:{n:'Raid Hero',d:'Take part in a world boss kill.',f:p=>p.stats.worldBoss>=1},
  explorer:{n:'Explorer',d:'Visit 15 locations.',f:p=>p.explored.length>=15},cartographer:{n:'Cartographer',d:'Visit every location.',f:p=>p.explored.length>=Object.keys(LOCS).length},
  rich:{n:'Well-Off',d:'Hold 1,000 gold.',f:p=>p.gold>=1000},tycoon:{n:'Tycoon',d:'Hold 50,000 gold.',f:p=>p.gold>=50000},
  crafter:{n:'Artisan',d:'Craft 25 items.',f:p=>p.stats.crafted>=25},duelist:{n:'Duelist',d:'Win 10 PvP matches.',f:p=>p.pvp.w>=10},
  gladiator:{n:'Gladiator',d:'Reach 1600 arena rating.',f:p=>p.pvp.rating>=1600},champion:{n:'Tournament Champion',d:'Win a Grand Tournament.',f:p=>p.stats.tourneyWins>=1},
  tamer:{n:'Beast Friend',d:'Bond with a creature.',f:p=>p.comps.length>=1},evolver:{n:'Evolution',d:'Evolve a companion.',f:p=>p.stats.evolved>=1},
  guildfounder:{n:'Guild Founder',d:'Found a guild.',f:p=>p.stats.founded>=1},social:{n:'Friendly Face',d:'Make 5 friends.',f:p=>p.friends.length>=5},
  scholar:{n:'Scholar',d:'Discover 12 codex entries.',f:p=>p.codex.length>=12},advclass:{n:'Higher Path',d:'Earn an advanced class.',f:p=>!!p.adv},
  legend:{n:'Legend',d:'Reach 5,000 fame.',f:p=>p.fame>=5000},hidden:{n:'Off the Map',d:'Discover a hidden location.',f:p=>p.stats.hidden>=1},
  story:{n:'Sun-Engine Silenced',d:'Complete the main story.',f:p=>p.flags.story_done}
};

/* ---------------- NAMES ---------------- */
const NAME_PARTS = {
  pre:['Iron','Dark','Luna','Shadow','Silver','Void','Night','Crimson','Aether','Storm','Frost','Blood','Star','Ash','Thorn','Raven','Wolf','Dragon','Ember','Mist','Steel','Grim','Sky','Rune','Gold','Bright','Hex','Soul','Blaze','Moon','Sun','Venom','Wild','Rogue','Arcane','Holy','Doom','Swift','Brave','Lucky','Chaos','Nova','Oak','Hollow','Rust','Pale','Feral','Sable','Jade','Obsidian','Tiny','Big','Sir','Lady','Mad','Sneaky','Lord','Cozy','Salty','Spicy'],
  suf:['Fang','Reaper','Mist','Wolf','Fox','Knight','Hunter','Queen','Mage','Blade','Heart','Born','Slayer','Walker','Strike','Shade','Song','Bane','Claw','Fury','Rider','Sage','Smith','Bow','Guard','Lord','Witch','Spark','Thorn','Wing','Howl','Paw','Bear','Crow','Viper','Storm','Fist','Shield','Dancer','Weaver','Seer','Monk','Tide','Ward','Hammer','Potato','Goblin','Noodle','Muffin','Toast'],
  first:{human:['Aldric','Bran','Cedric','Doran','Elena','Fiona','Gareth','Helena','Isolde','Jon','Kara','Lucas','Mira','Nolan','Oswin','Petra','Roland','Sera','Tomas','Wren'],
    elf:['Aelar','Belith','Caelynn','Daeris','Elandor','Faelyn','Galadra','Ilyndra','Lirael','Mythal','Naivara','Quillath','Sariel','Thalion','Vaelis','Yrsa'],
    dwarf:['Bardin','Dagna','Eberk','Gimra','Harbek','Kildrak','Morgran','Orsik','Rurik','Thora','Ulfgar','Vistra','Brottor','Helja'],
    orc:['Durza','Grosh','Hruk','Karg','Mogra','Narg','Oruk','Shagra','Thrak','Ugra','Varg','Zogna','Bolg','Ghazna'],
    beast:['Ash-Paw','Briar','Cinder','Dusk','Ember-Tail','Fang','Grey-Muzzle','Hollow','Ivy','Juniper','Kestrel','Lark','Moss','Nettle','Pounce','Rook','Sable','Thistle'],
    draco:['Arjhan','Balasar','Kava','Medrash','Nadarr','Rhogar','Sora','Torinn','Vyra','Zorvex'],
    halfling:['Andry','Bree','Cade','Dimble','Eldon','Fenna','Garret','Lavinia','Merric','Nedda','Pip','Rosie','Tobble','Wellby']},
  last:['Ashford','Blackwood','Brightwater','Duskmantle','Emberforge','Frostwind','Greycloak','Hawthorne','Ironside','Moonshadow','Oakenshield','Ravencrest','Stormborn','Thornfield','Underhill','Whitmore','Wolfsbane','Goldleaf','Stonefist','Nightbloom']
};
const GUILD_NAMES = [
  ['Crimson Legion','CRIM'],['Silver Dawn','SDWN'],['Order of the Void','VOID'],['Ironclad Brotherhood','IRON'],['Moonlit Court','MOON'],['Ashen Covenant','ASH'],
  ['The Gilded Purse','GOLD'],['Stormbreakers','STRM'],['Wild Hunt','HUNT'],['Emerald Circle','EMRL'],['Dragonsbane','DRGN'],['Night Ravens','RVN'],
  ['Lionheart Company','LION'],['Deep Delvers','DEEP'],['Phoenix Rising','PHNX'],['Shadow Syndicate','SHDW'],['Starfall Vanguard','STAR'],['Eternal Flame','FLME'],
  ['Cozy Tavern Club','COZY'],['Last Light','LAST']];
const PERSONALITY = ['friendly','competitive','arrogant','cautious','helpful','greedy','shy','talkative','strategic','aggressive','adventurous','ambitious','lazy','loyal','independent','funny'];
