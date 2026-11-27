// Eternal Realms Online (2.5D prototype) — game data. All names, numbers and content are original to Eternal Realms.
export const STATS=['str','agi','vit','int','dex','luk'];
export const STAT_NAMES={str:'STR',agi:'AGI',vit:'VIT',int:'INT',dex:'DEX',luk:'LUK'};
export const STAT_HELP={str:'Melee attack power and carry weight',agi:'Attack speed and dodging (FLEE)',vit:'Max HP, defence and HP recovery',int:'Magic attack, max SP and SP recovery',dex:'Accuracy (HIT), bow damage and casting speed',luk:'Critical hits and lucky dodges'};
export const statCost=v=>Math.floor((v-1)/10)+2;
export const statPointsForLevel=lv=>Math.floor(lv/5)+3;
export const BASE_NEXT=lv=>Math.floor(7*Math.pow(lv,1.9)+12);
export const JOB_NEXT=(lv,tier)=>tier===0?Math.floor(6*Math.pow(lv,1.6)+8):Math.floor(10*Math.pow(lv,1.7)+20);
export const JOB_CAP=t=>t===0?10:40;
export const BASE_CAP=60;

export const JOBS={
  novice:{n:'Novice',tier:0,hp:.9,sp:1,wpn:['dagger','sword','fist'],skills:['first_aid','toughness'],d:'Everyone starts here.'},
  warrior:{n:'Warrior',tier:1,hp:1.55,sp:.8,wpn:['sword','dagger','axe','mace','fist'],skills:['bash','flame_sweep','sword_mastery','iron_skin'],d:'Front-line fighter. Big HP, swords and shields.',icon:'⚔️',stats:'STR · VIT'},
  mage:{n:'Mage',tier:1,hp:.8,sp:3,wpn:['rod','dagger','fist'],skills:['fire_bolt','frost_bolt','thunder_bolt','mana_flow'],d:'Bolts of fire, frost and lightning. Fragile but deadly.',icon:'🔮',stats:'INT · DEX'},
  ranger:{n:'Ranger',tier:1,hp:1.05,sp:1.4,wpn:['bow','dagger','fist'],skills:['twin_shot','arrow_shower','hawk_eye','quick_step'],d:'Bow master. Strikes from far away.',icon:'🏹',stats:'DEX · AGI'},
  rogue:{n:'Rogue',tier:1,hp:1.15,sp:1,wpn:['dagger','sword','fist'],skills:['twin_blade','snatch','venom_strike','evasion'],d:'Fast blades, poison and stealing loot.',icon:'🗡️',stats:'AGI · LUK'},
  cleric:{n:'Cleric',tier:1,hp:1.1,sp:2.6,wpn:['mace','rod','fist'],skills:['heal','blessing','swift_prayer','smite'],d:'Heals and blesses. Holy power hurts the wicked.',icon:'✚',stats:'INT · VIT'},
  trader:{n:'Trader',tier:1,hp:1.25,sp:1.2,wpn:['axe','mace','sword','dagger','fist'],skills:['coin_strike','haggle','pack_mule','lucky_find'],d:'Money talks. Better prices, more carrying, coin attacks.',icon:'💰',stats:'STR · LUK'},
};
export const FIRST_JOBS=['warrior','mage','ranger','rogue','cleric','trader'];

// t: 'target' (attack/heal a target) | 'aoe' (around target) | 'self' | 'passive'. el = element.
export const SKILLS={
  first_aid:{n:'First Aid',ic:'🩹',t:'self',max:3,sp:l=>3,heal:l=>5+l*6,d:'Patch yourself up. Heals a little HP.'},
  toughness:{n:'Toughness',ic:'💪',t:'passive',max:3,d:'+20 Max HP per level.'},
  bash:{n:'Bash',ic:'💥',t:'target',max:5,range:2,sp:l=>6+l,mult:l=>1.3+l*.3,hitBonus:l=>l*5,anim:'attack',fx:'bash',d:'A heavy blow. +30% damage per level.'},
  flame_sweep:{n:'Flame Sweep',ic:'🔥',t:'aoe',max:5,range:2,radius:3.2,sp:l=>15,mult:l=>1.2+l*.2,el:'fire',anim:'attack',fx:'flame',cd:1.5,d:'Swing a ring of fire around your target.'},
  sword_mastery:{n:'Sword Mastery',ic:'🗡️',t:'passive',max:5,d:'+4 ATK per level with swords and daggers.'},
  iron_skin:{n:'Iron Skin',ic:'🛡️',t:'passive',max:5,d:'+3 DEF and faster HP recovery per level.'},
  fire_bolt:{n:'Fire Bolt',ic:'🔥',t:'target',max:5,range:9,sp:l=>10+l*2,cast:l=>.45+l*.3,bolts:l=>l,mult:l=>1,el:'fire',magic:1,anim:'cast',fx:'firebolt',d:'Call down one fire bolt per level.'},
  frost_bolt:{n:'Frost Bolt',ic:'❄️',t:'target',max:5,range:9,sp:l=>10+l*2,cast:l=>.45+l*.3,bolts:l=>l,mult:l=>1,el:'water',magic:1,freeze:l=>.06*l,anim:'cast',fx:'frostbolt',d:'Ice spears, one per level. May freeze the target.'},
  thunder_bolt:{n:'Thunder Bolt',ic:'⚡',t:'target',max:5,range:9,sp:l=>10+l*2,cast:l=>.45+l*.3,bolts:l=>l,mult:l=>1,el:'wind',magic:1,anim:'cast',fx:'thunder',d:'Lightning strikes, one per level.'},
  mana_flow:{n:'Mana Flow',ic:'🌀',t:'passive',max:5,d:'Recover SP faster. +3 SP per tick per level.'},
  twin_shot:{n:'Twin Shot',ic:'🏹',t:'target',max:5,range:9,sp:l=>12,mult:l=>.9+l*.1,hits:2,anim:'attack',fx:'arrows',needs:'bow',d:'Fire two arrows at once.'},
  arrow_shower:{n:'Arrow Shower',ic:'🌧️',t:'aoe',max:5,range:9,radius:3,sp:l=>15,mult:l=>.8+l*.05,anim:'attack',fx:'shower',needs:'bow',cd:1,d:'A rain of arrows hits everything near the target.'},
  hawk_eye:{n:'Hawk Eye',ic:'🦅',t:'passive',max:5,d:'+1 DEX and +0.5 bow range per level.'},
  quick_step:{n:'Quick Step',ic:'💨',t:'self',max:5,sp:l=>20,buff:{k:'quick',dur:l=>30+l*10},d:'Move faster and dodge more for a while.'},
  twin_blade:{n:'Twin Blade',ic:'⚔️',t:'passive',max:5,d:'5% chance per level to strike twice with daggers.'},
  snatch:{n:'Snatch',ic:'🫳',t:'target',max:5,range:2,sp:l=>10,steal:l=>.08+l*.06,anim:'attack',fx:'snatch',d:'Try to steal an item from a monster.'},
  venom_strike:{n:'Venom Strike',ic:'☠️',t:'target',max:5,range:2,sp:l=>12,mult:l=>1+l*.1,el:'poison',poison:l=>.25+l*.1,anim:'attack',fx:'venom',d:'A poisoned stab that may keep hurting.'},
  evasion:{n:'Evasion',ic:'🌫️',t:'passive',max:5,d:'+3 FLEE per level.'},
  heal:{n:'Heal',ic:'✚',t:'self',max:5,sp:l=>10+l*3,heal:l=>0,magicHeal:1,anim:'cast',fx:'heal',d:'Restore HP based on level and INT.'},
  blessing:{n:'Blessing',ic:'✨',t:'self',max:5,sp:l=>24+l*4,buff:{k:'blessing',dur:l=>60+l*20},anim:'cast',fx:'bless',d:'+STR, INT and DEX equal to the skill level.'},
  swift_prayer:{n:'Swift Prayer',ic:'🕊️',t:'self',max:5,sp:l=>18+l*3,buff:{k:'swift',dur:l=>60+l*20},anim:'cast',fx:'bless',d:'+AGI equal to the skill level and faster movement.'},
  smite:{n:'Smite',ic:'☀️',t:'target',max:5,range:9,sp:l=>15,cast:l=>.6,mult:l=>1.4+l*.2,el:'holy',magic:1,anim:'cast',fx:'smite',d:'A beam of holy light.'},
  coin_strike:{n:'Coin Strike',ic:'🪙',t:'target',max:5,range:2,sp:l=>5,zeny:l=>l*60,mult:l=>1.5+l*.5,anim:'attack',fx:'coins',d:'Hit with the power of gold. Costs gold each use.'},
  haggle:{n:'Haggle',ic:'🤝',t:'passive',max:5,d:'Buy 3% cheaper and sell 3% dearer per level.'},
  pack_mule:{n:'Pack Mule',ic:'🎒',t:'passive',max:5,d:'+300 carry weight per level.'},
  lucky_find:{n:'Lucky Find',ic:'🍀',t:'passive',max:5,d:'+6% item drop chance per level.'},
};
export const ELEMENTS={neutral:{},fire:{earth:1.5,water:.5,fire:.25},water:{fire:1.5,wind:.5,water:.25},wind:{water:1.5,earth:.5,wind:.25},earth:{wind:1.5,fire:.5,earth:.25},holy:{shadow:1.75,undead:1.75,holy:0},poison:{earth:1.25,undead:.5},shadow:{holy:1.5}};
export const elemMod=(atk,def)=>(ELEMENTS[atk]&&ELEMENTS[atk][def])??1;

// slot: weapon|shield|armor|garment|shoes|acc|head. cardSlot: what a card can be socketed into.
export const ITEMS={
  red_tonic:{n:'Red Tonic',t:'use',heal:45,price:50,w:7,ic:'🧪',d:'Restores 45 HP.'},
  orange_tonic:{n:'Amber Tonic',t:'use',heal:105,price:200,w:10,ic:'🧉',d:'Restores 105 HP.'},
  blue_draught:{n:'Blue Draught',t:'use',sp:60,price:500,w:10,ic:'💧',d:'Restores 60 SP.'},
  apple:{n:'Apple',t:'use',heal:16,price:15,w:2,ic:'🍎',d:'Restores 16 HP.'},
  carrot:{n:'Carrot',t:'use',heal:18,price:15,w:2,ic:'🥕',d:'Restores 18 HP.'},
  honey:{n:'Wild Honey',t:'use',heal:70,sp:20,price:200,w:5,ic:'🍯',d:'Restores 70 HP and 20 SP.'},
  waywing:{n:'Waywing',t:'use',warp:'random',price:60,w:5,ic:'🪶',d:'Teleports you to a random spot on this map.'},
  homing_feather:{n:'Homing Feather',t:'use',warp:'save',price:300,w:1,ic:'🕊️',d:'Returns you to your save point.'},
  jelly_goo:{n:'Jelly Goo',t:'etc',price:6,w:1,ic:'🫧',d:'Squishy. Merchants buy it.'},
  fluffy_tail:{n:'Fluffy Tail',t:'etc',price:16,w:1,ic:'🐇',d:'A soft little tail.'},
  spore_cap:{n:'Spore Cap',t:'etc',price:24,w:1,ic:'🍄',d:'Smells earthy.'},
  stinger:{n:'Buzzling Stinger',t:'etc',price:40,w:1,ic:'📍',d:'Sharp!'},
  golden_jelly:{n:'Golden Jelly',t:'etc',price:1000,w:2,ic:'🟡',d:'A treasure from the Jellop King.'},
  brightstone:{n:'Brightstone',t:'etc',price:200,w:2,ic:'💎',d:'Used to refine weapons.'},
  duskstone:{n:'Duskstone',t:'etc',price:800,w:2,ic:'🔷',d:'Used to refine armour.'},
  // weapons
  knife:{n:'Knife',t:'equip',slot:'weapon',wt:'dagger',atk:17,cards:3,price:50,w:40,ic:'🔪',jobs:'all',d:'A simple knife. Anyone can use it.'},
  cutter:{n:'Cutter',t:'equip',slot:'weapon',wt:'dagger',atk:30,cards:3,price:1250,w:40,ic:'🗡️',d:'A sharp dagger.'},
  short_sword:{n:'Short Sword',t:'equip',slot:'weapon',wt:'sword',atk:39,cards:3,price:500,w:50,ic:'🗡️',d:'Light one-handed sword.'},
  broadsword:{n:'Broadsword',t:'equip',slot:'weapon',wt:'sword',atk:65,cards:2,price:2900,w:80,ic:'⚔️',d:'Heavy and reliable.'},
  hand_axe:{n:'Hand Axe',t:'equip',slot:'weapon',wt:'axe',atk:45,cards:3,price:600,w:80,ic:'🪓',d:'Chops monsters and firewood alike.'},
  mace:{n:'Mace',t:'equip',slot:'weapon',wt:'mace',atk:37,cards:3,price:620,w:70,ic:'🔨',d:'Blessed by the temple.'},
  rod:{n:'Willow Rod',t:'equip',slot:'weapon',wt:'rod',atk:15,matk:15,cards:3,price:420,w:40,ic:'🪄',d:'+15% magic attack.'},
  short_bow:{n:'Short Bow',t:'equip',slot:'weapon',wt:'bow',atk:30,cards:3,price:500,w:50,ic:'🏹',d:'A light bow.'},
  // armour & gear
  cotton_shirt:{n:'Cotton Shirt',t:'equip',slot:'armor',def:1,cards:1,price:10,w:10,ic:'👕',jobs:'all',d:'Better than nothing.'},
  adventurer_suit:{n:'Adventurer Suit',t:'equip',slot:'armor',def:3,cards:1,price:400,w:20,ic:'🧥',jobs:'all',d:'Sturdy travelling clothes.'},
  chain_vest:{n:'Chain Vest',t:'equip',slot:'armor',def:6,cards:1,price:2200,w:120,ic:'🦺',jobs:['warrior','trader'],d:'Heavy chain links.'},
  apprentice_robe:{n:'Apprentice Robe',t:'equip',slot:'armor',def:2,mdef:6,cards:1,price:900,w:30,ic:'🥻',jobs:['mage','cleric'],d:'Woven with simple wards.'},
  guard:{n:'Round Guard',t:'equip',slot:'shield',def:3,cards:1,price:500,w:30,ic:'🛡️',jobs:'all',d:'A small round shield.'},
  hood:{n:'Traveller Hood',t:'equip',slot:'garment',def:1,cards:1,price:120,w:20,ic:'🧣',jobs:'all',d:'Keeps the rain off.'},
  sandals:{n:'Sandals',t:'equip',slot:'shoes',def:1,cards:1,price:400,w:20,ic:'🩴',jobs:'all',d:'Breezy.'},
  boots:{n:'Ranger Boots',t:'equip',slot:'shoes',def:2,cards:1,price:1200,w:30,ic:'🥾',jobs:'all',d:'Good for long walks.'},
  clip:{n:'Silver Clip',t:'equip',slot:'acc',def:0,cards:1,price:1500,w:10,ic:'📎',jobs:'all',d:'A slotted accessory. Great for cards.'},
  // headgear (shown on your character)
  ribbon:{n:'Big Ribbon',t:'equip',slot:'head',hat:'ribbon',def:1,mdef:2,cards:0,price:800,w:10,ic:'🎀',jobs:'all',d:'Cute and slightly magical.'},
  bandana:{n:'Rover Bandana',t:'equip',slot:'head',hat:'bandana',def:1,cards:0,price:400,w:10,ic:'🧢',jobs:'all',d:'For the adventurous.'},
  flower_crown:{n:'Meadow Crown',t:'equip',slot:'head',hat:'flower',def:0,luk:1,cards:0,price:500,w:5,ic:'🌼',jobs:'all',d:'+1 LUK. Smells of spring.'},
  beret:{n:'Painter Beret',t:'equip',slot:'head',hat:'beret',def:1,dex:1,cards:0,price:900,w:10,ic:'🎨',jobs:'all',d:'+1 DEX.'},
  wizard_hat:{n:'Starry Hat',t:'equip',slot:'head',hat:'wizard',def:1,mdef:5,int:1,cards:1,price:3200,w:30,ic:'🎩',jobs:['mage','cleric'],d:'+1 INT. Has a card slot.'},
  iron_sallet:{n:'Iron Sallet',t:'equip',slot:'head',hat:'helm',def:3,cards:1,price:3000,w:60,ic:'⛑️',jobs:['warrior','trader'],d:'Solid steel. Has a card slot.'},
  lop_band:{n:'Lop-Ear Band',t:'equip',slot:'head',hat:'bunny',def:1,agi:1,cards:0,price:4000,w:10,ic:'🐰',jobs:'all',d:'+1 AGI. A rare Lopkin drop.'},
  jellop_cap:{n:'Jellop Cap',t:'equip',slot:'head',hat:'jelly',def:1,luk:2,cards:0,price:3000,w:10,ic:'🍮',jobs:'all',d:'+2 LUK. It wobbles.'},
  king_crown:{n:'Jellop King Crown',t:'equip',slot:'head',hat:'kingcrown',def:3,allStats:1,cards:1,price:30000,w:20,ic:'👑',jobs:'all',d:'+1 to all stats. Proof you beat the Jellop King.'},
  halo:{n:'Gilded Halo',t:'equip',slot:'head',hat:'halo',def:0,mdef:5,int:2,cards:0,price:8000,w:5,ic:'😇',jobs:'all',d:'+2 INT.'},
  // cards
  card_jellop:{n:'Jellop Card',t:'card',cardSlot:'armor',hp:80,ic:'🃏',price:20,w:1,d:'Armour card: +80 Max HP.'},
  card_lopkin:{n:'Lopkin Card',t:'card',cardSlot:'shoes',agi:2,flee:10,ic:'🃏',price:20,w:1,d:'Shoes card: +2 AGI, +10 FLEE.'},
  card_shroom:{n:'Shroomlet Card',t:'card',cardSlot:'weapon',atk:12,ic:'🃏',price:20,w:1,d:'Weapon card: +12 ATK.'},
  card_bee:{n:'Buzzling Card',t:'card',cardSlot:'weapon',crit:6,aspd:5,ic:'🃏',price:20,w:1,d:'Weapon card: +6 CRIT, 5% faster attacks.'},
  card_king:{n:'Jellop King Card',t:'card',cardSlot:'head',allStats:2,hpPct:10,ic:'🎴',price:20,w:1,d:'Headgear card: +2 all stats, +10% Max HP.'},
};
export const MONSTERS={
  jellop:{n:'Jellop',draw:'jellop',v:{col:'#f88ab0'},lv:1,hp:55,atk:[6,10],def:0,flee:2,hit:4,aspd:1.7,speed:1.6,exp:[12,9],el:'water',scale:.95,passive:1,looter:1,
    drops:[['jelly_goo',.7],['apple',.35],['red_tonic',.06],['jellop_cap',.006],['card_jellop',.02]]},
  lopkin:{n:'Lopkin',draw:'lopkin',v:{col:'#f4ece0'},lv:3,hp:90,atk:[9,14],def:1,flee:14,hit:10,aspd:1.4,speed:2.8,exp:[20,15],el:'neutral',scale:.8,passive:1,
    drops:[['fluffy_tail',.6],['carrot',.35],['red_tonic',.08],['lop_band',.008],['card_lopkin',.02]]},
  shroom:{n:'Shroomlet',draw:'shroom',v:{col:'#d84a3a'},lv:5,hp:150,atk:[12,18],def:4,flee:6,hit:14,aspd:1.8,speed:1.4,exp:[34,24],el:'earth',scale:.9,passive:1,
    drops:[['spore_cap',.6],['red_tonic',.1],['brightstone',.04],['duskstone',.02],['flower_crown',.01],['card_shroom',.02]]},
  bee:{n:'Buzzling',draw:'bee',v:{},lv:8,hp:210,atk:[18,26],def:2,flee:28,hit:24,aspd:1.3,speed:2.4,exp:[58,42],el:'wind',scale:.8,aggro:1,fly:1,
    drops:[['stinger',.55],['honey',.2],['duskstone',.04],['brightstone',.05],['card_bee',.02]]},
  king:{n:'Jellop King',draw:'king',v:{col:'#f8d050'},lv:14,hp:3600,atk:[38,58],def:10,flee:10,hit:40,aspd:1.5,speed:1.8,exp:[1600,1100],el:'water',scale:1.6,boss:1,
    drops:[['golden_jelly',1],['king_crown',.35],['card_king',.25],['brightstone',.8],['duskstone',.6],['orange_tonic',1]]},
};
export const SHOPS={
  tools:['red_tonic','orange_tonic','blue_draught','apple','waywing','homing_feather'],
  arms:['knife','short_sword','hand_axe','mace','rod','short_bow','cotton_shirt','adventurer_suit','apprentice_robe','chain_vest','guard','hood','sandals','boots','bandana','flower_crown','beret','ribbon','wizard_hat','iron_sallet','clip'],
  refine:['brightstone','duskstone'],
};
export const REFINE_RATE=[1,1,1,1,.6,.5,.4,.3,.2,.1];   // chance to go from +n to +n+1
