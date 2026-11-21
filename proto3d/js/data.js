// Classes, skills and monsters for the Whisperwood prototype. Numbers follow the spirit of the 2D game's formulas,
// tuned for real-time play: a level-appropriate fight lasts ~8–15 s, a boss ~60–90 s.
export const CLASSES={
  knight:{n:'Knight',ic:'🛡️',model:'Knight',show:['1H_Sword','Round_Shield','Knight_Helmet','Knight_Cape'],d:'Sword and shield. Tough, steady, protects allies.',res:'sp',
    base:{hp:190,res:100,atk:18,def:10,crit:.08,speed:6.2},grow:{hp:26,atk:2.4,def:1.6},auto:{anim:['1H_Melee_Attack_Chop','1H_Melee_Attack_Slice_Diagonal'],range:2.6,cd:2.0,mult:1,el:'phys'},
    skills:['k_strike','k_bash','k_cleave','k_second']},
  barbarian:{n:'Barbarian',ic:'🪓',model:'Barbarian',show:['2H_Axe','Barbarian_Hat','Barbarian_Cape'],d:'Huge two-handed axe. Big hits, spins through crowds.',res:'sp',
    base:{hp:200,res:100,atk:19,def:7,crit:.1,speed:6.2},grow:{hp:27,atk:2.9,def:1.1},auto:{anim:['2H_Melee_Attack_Chop','2H_Melee_Attack_Slice'],range:2.9,cd:2.4,mult:1.15,el:'phys'},
    skills:['b_chop','b_whirl','b_reckless','b_frenzy']},
  mage:{n:'Mage',ic:'🔮',model:'Mage',show:['2H_Staff','Mage_Hat','Mage_Cape'],d:'Fire and frost from range. Fragile but devastating.',res:'mp',
    base:{hp:140,res:130,atk:20,def:5,crit:.08,speed:6.0},grow:{hp:18,atk:3.1,def:.8},auto:{anim:['Spellcast_Shoot'],range:16,cd:2.2,mult:.8,el:'arcane',proj:1},
    skills:['m_firebolt','m_nova','m_meteor','m_heal']},
  rogue:{n:'Rogue',ic:'🗡️',model:'Rogue_Hooded',show:['Knife','Knife_Offhand','Rogue_Cape'],d:'Twin blades and poison. Fast, deadly, slippery.',res:'sp',
    base:{hp:160,res:100,atk:17,def:6,crit:.18,speed:6.8},grow:{hp:21,atk:2.6,def:1},auto:{anim:['Dualwield_Melee_Attack_Stab','Dualwield_Melee_Attack_Chop'],range:2.4,cd:1.6,mult:.85,el:'phys'},
    skills:['r_stab','r_fan','r_poison','r_step']},
};
// t: 'melee' (needs target in range) | 'proj' (needs target, projectile) | 'aoe_self' | 'aoe_target' | 'self'
export const SKILLS={
  k_strike:{n:'Crushing Strike',ic:'⚔️',t:'melee',range:2.8,cd:4,cost:15,mult:1.9,anim:'1H_Melee_Attack_Slice_Horizontal',fx:'slash',el:'phys'},
  k_bash:{n:'Shield Bash',ic:'🛡️',t:'melee',range:2.6,cd:9,cost:20,mult:1.1,anim:'Block_Attack',fx:'bash',el:'phys',stun:2.2},
  k_cleave:{n:'Cleave',ic:'🌙',t:'aoe_self',radius:4.2,arc:2.4,cd:7,cost:25,mult:1.6,anim:'1H_Melee_Attack_Slice_Diagonal',fx:'cleave',el:'phys'},
  k_second:{n:'Second Wind',ic:'✚',t:'self',cd:25,cost:30,heal:.35,anim:'Cheer',fx:'heal'},
  b_chop:{n:'Skull Splitter',ic:'🪓',t:'melee',range:3,cd:4,cost:15,mult:2.1,anim:'2H_Melee_Attack_Chop',fx:'slam',el:'phys'},
  b_whirl:{n:'Whirlwind',ic:'🌀',t:'aoe_self',radius:4.6,cd:8,cost:30,mult:1.6,anim:'2H_Melee_Attack_Spinning',fx:'whirl',el:'phys',hits:2},
  b_reckless:{n:'Reckless Swing',ic:'💢',t:'melee',range:3,cd:11,cost:25,mult:3.2,anim:'2H_Melee_Attack_Slice',fx:'execute',el:'phys',critBonus:.25},
  b_frenzy:{n:'Frenzy',ic:'🔥',t:'self',cd:22,cost:20,buff:{k:'frenzy',dur:8,atk:.35,haste:.25},anim:'Cheer',fx:'roar'},
  m_firebolt:{n:'Firebolt',ic:'🔥',t:'proj',range:18,cd:0,cast:1.1,cost:12,mult:1.75,anim:'Spellcast_Shoot',castAnim:'Spellcasting',fx:'fire',el:'fire'},
  m_nova:{n:'Frost Nova',ic:'❄️',t:'aoe_self',radius:6.5,cd:10,cost:25,mult:1.0,anim:'Spellcast_Raise',fx:'nova',el:'frost',slow:3.5},
  m_meteor:{n:'Meteor',ic:'☄️',t:'aoe_target',range:18,radius:4.5,cd:12,cast:1.8,cost:40,mult:3.0,anim:'Spellcast_Long',castAnim:'Spellcasting',fx:'meteor',el:'fire'},
  m_heal:{n:'Mend',ic:'✚',t:'self',cd:14,cast:1.2,cost:30,heal:.4,anim:'Spellcast_Raise',castAnim:'Spellcasting',fx:'heal'},
  r_stab:{n:'Twin Fangs',ic:'🗡️',t:'melee',range:2.6,cd:3,cost:12,mult:1.7,anim:'Dualwield_Melee_Attack_Slice',fx:'flurry',el:'phys',hits:2},
  r_fan:{n:'Fan of Knives',ic:'✴️',t:'aoe_self',radius:5,cd:7,cost:25,mult:1.2,anim:'Throw',fx:'knives',el:'phys'},
  r_poison:{n:'Envenom',ic:'☠️',t:'melee',range:2.6,cd:8,cost:18,mult:.8,anim:'Dualwield_Melee_Attack_Stab',fx:'poison',el:'poison',dot:{dur:6,mult:.45}},
  r_step:{n:'Shadowstep',ic:'🌑',t:'melee',range:16,cd:14,cost:20,mult:2.6,anim:'Dualwield_Melee_Attack_Chop',fx:'shadowstep',el:'shadow',blink:1,critBonus:1},
  potion:{n:'Healing Draught',ic:'🧪',t:'self',cd:20,cost:0,heal:.45,anim:'Use_Item',fx:'heal',charges:5},
};
// Monsters. weak: elements that deal +50% ("Weak!") — undead hate fire and holy, as in the 2D game.
export const MONSTERS={
  minion:{n:'Skeleton Minion',model:'Skeleton_Minion',wpn:'Skeleton_Blade',lv:[1,2],hp:70,atk:9,def:3,speed:3.6,range:2.2,cd:2.2,anim:['1H_Melee_Attack_Chop','1H_Melee_Attack_Stab'],xp:22,weak:['fire','holy']},
  warrior:{n:'Skeleton Warrior',model:'Skeleton_Warrior',wpn:'Skeleton_Axe',off:'Skeleton_Shield_Small_A',lv:[3,4],hp:130,atk:13,def:7,speed:3.4,range:2.4,cd:2.5,anim:['1H_Melee_Attack_Chop','1H_Melee_Attack_Slice_Diagonal'],xp:40,weak:['fire','holy'],block:.15},
  rogue:{n:'Skeleton Marksman',model:'Skeleton_Rogue',wpn:'Skeleton_Crossbow',lv:[3,4],hp:95,atk:12,def:4,speed:3.8,range:15,cd:2.8,anim:['2H_Ranged_Shoot'],xp:36,weak:['fire','holy'],proj:'bolt'},
  mage:{n:'Skeleton Necromancer',model:'Skeleton_Mage',wpn:'Skeleton_Staff',lv:[4,5],hp:105,atk:15,def:4,speed:3.2,range:14,cd:3.2,anim:['Spellcast_Shoot'],xp:46,weak:['fire','holy'],proj:'shadow',cast:1.2},
  boss:{n:'Bone Warlord Kazrath',model:'Skeleton_Warrior',wpn:'Skeleton_Axe',off:'Skeleton_Shield_Large_A',lv:[5,5],hp:1500,atk:19,def:10,speed:3.9,range:3.4,cd:2.6,anim:['2H_Melee_Attack_Chop','1H_Melee_Attack_Jump_Chop'],xp:600,weak:['fire','holy'],boss:1,scale:1.75},
};
export const XP_NEXT=l=>Math.round(60*Math.pow(l,1.3));
export const LEVEL_CAP=10;
