/* ETERNAL REALMS — Class upgrades: every class gets a Lv35 class skill and a two-tier upgrade path (Lv20 / Lv50),
   each tier with a signature skill and a stat boost. Loaded after expansion.js. */
'use strict';
// [tier1 name, tier1 skill, tier2 name, tier2 skill, Lv35 skill]
const CLASS_TIERS={
  warrior:{t:['Veteran','Warlord'],d:['Battle-hardened soldier.','Commands the field.']},
  knight:{t:['Knight-Captain','Lord Protector'],d:['Leads the shield wall.','An unbreakable bulwark.']},
  swordsman:{t:['Duelist','Sword Saint'],d:['Lives for the one-on-one.','The blade and the man are one.']},
  archer:{t:['Sharpshooter','Hawkeye'],d:['Never wastes an arrow.','Sees and hits anything.']},
  rogue:{t:['Cutthroat','Nightblade'],d:['Dirty fighter.','A rumor that kills.']},
  mage:{t:['Magus','Sorcerer Supreme'],d:['A true caster.','Reality bends to the will.']},
  cleric:{t:['Priest','Saint'],d:['Ordained in the Light.','Miracles follow in their wake.']},
  summoner:{t:['Conjurer','Spirit Sovereign'],d:['Binds stronger spirits.','Spirits kneel to them.']},
  paladin:{t:['Crusader','Templar Lord'],d:['Holy warrior on campaign.','Leads the faithful to war.']},
  berserker:{t:['Ravager','Bloodreaver'],d:['Rage given shape.','Fights harder the closer to death.']},
  monk:{t:['Disciple','Ascendant'],d:['Body and spirit trained.','Has touched the Open Sky.']},
  necromancer:{t:['Bonecaller','Lord of Bones'],d:['The dead answer.','The dead obey.']},
  druid:{t:['Wildshaper','Archdruid'],d:['The wild listens.','The wild fights beside them.']},
  spearman:{t:['Lancer','Dragoon'],d:['Master of the charge.','Strikes from the sky.']},
  merchant:{t:['Trader','Trade Prince'],d:['Money talks.','Money fights.']},
  bard:{t:['Minstrel','Virtuoso'],d:['Songs with an edge.','Songs that win wars.']},
  shaman:{t:['Spirit Talker','Thunder Elder'],d:['Speaks with ancestors.','The storm obeys them.']},
  warlock:{t:['Pactbound','Voidcaller'],d:['The pact deepens.','Calls what lives beyond the sky.']},
  artificer:{t:['Engineer','Grand Tinker'],d:['Better gadgets.','Clockwork wonders.']},
  ranger:{t:['Pathfinder','Wildstalker'],d:['Never lost.','The hunter of hunters.']}
};
const CLASS_MOD={knight:{atk:1.86,def:1.2,hp:1.24},spearman:{atk:1.26,hp:1.12},merchant:{atk:1.52,hp:1.16},bard:{atk:1.58,hp:1.18},artificer:{atk:1.46,hp:1.12},berserker:{atk:1.14,hp:1.14},
  monk:{atk:1.18,hp:1.12},ranger:{hp:1.04},mage:{hp:1.12,def:1.06},rogue:{atk:1.06,hp:1.08},swordsman:{atk:1.1,hp:1.08},archer:{atk:1.08,hp:1.06},warlock:{atk:1.14,hp:1.22},necromancer:{hp:1.06},summoner:{atk:1.5,hp:1.26},paladin:{atk:1.12,hp:1.06},cleric:{atk:0.95},druid:{atk:0.95},shaman:{atk:0.95}};
const TIER_REQ=[null,{lvl:20,mast:15},{lvl:50,mast:40}];
const TIER_SKILLS={ // [lv35 class skill, tier1 skill, tier2 skill]
  warrior:['shield_crush','rally','warlords_command'],knight:['holy_bulwark','challenge','last_stand'],swordsman:['phantom_slash','duel_stance','sword_saint_art'],
  archer:['explosive_arrow','eagle_eye','skyfall_shot'],rogue:['smoke_screen','cheap_shot','assassinate'],mage:['arcane_echo','chain_spell','cataclysm'],
  cleric:['divine_light','prayer_of_mending','miracle'],summoner:['spirit_storm','greater_bond','sovereign_call'],paladin:['consecration','crusader_strike','templars_verdict'],
  berserker:['blood_frenzy','ravage','undying_rage'],monk:['dragon_kick','iron_body','hundred_palms'],necromancer:['bone_spear','corpse_explosion','lich_form'],
  druid:['moonfire','wild_growth','force_of_nature'],spearman:['javelin_storm','charge','dragoon_leap'],merchant:['golden_shower','price_gouge','buy_victory'],
  bard:['crescendo','ballad_of_heroes','symphony_of_war'],shaman:['chain_heal','ancestral_spirit','thunderstorm'],warlock:['shadowflame','soul_siphon','void_gate'],
  artificer:['grenade','overcharge','mech_suit'],ranger:['trap','wolfpack','apex_predator']
};
Object.assign(SKILLS,{
  // Lv35 class skills
  shield_crush:{n:'Shield Crush',k:'phys',c:[0,24],cd:3,p:2.2,tg:'enemy',st:['sunder',0.8,3],d:'Shatters armor.'},
  holy_bulwark:{n:'Holy Bulwark',k:'buff',c:[20,10],cd:5,tg:'allies',st:['fortify',1,3],d:'The whole party is fortified.'},
  phantom_slash:{n:'Phantom Slash',k:'phys',c:[0,26],cd:3,p:0.9,hits:4,tg:'enemy',crit:10,d:'Four afterimage cuts.'},
  explosive_arrow:{n:'Explosive Arrow',k:'phys',c:[0,26],cd:3,p:1.4,tg:'all',e:'fire',st:['burn',0.5,2],d:'Arrow that bursts in flame.'},
  smoke_screen:{n:'Smoke Screen',k:'debuff',c:[0,18],cd:4,tg:'all',st:['blind',0.85,2],d:'Blind every enemy.'},
  arcane_echo:{n:'Arcane Echo',k:'mag',c:[30,0],cd:2,p:1.2,hits:2,tg:'enemy',e:'arcane',m:'arcane',d:'The spell repeats itself.'},
  divine_light:{n:'Divine Light',k:'heal',c:[30,0],cd:2,p:3.0,tg:'ally',m:'holy',d:'Huge single-target heal.'},
  spirit_storm:{n:'Spirit Storm',k:'mag',c:[32,0],cd:3,p:1.7,tg:'all',e:'arcane',m:'summoning',d:'Spirits tear through enemies.'},
  consecration:{n:'Consecration',k:'mag',c:[30,10],cd:3,p:1.6,tg:'all',e:'holy',m:'holy',d:'Holy ground burns foes.'},
  blood_frenzy:{n:'Blood Frenzy',k:'buff',c:[0,20],cd:5,tg:'self',st:['haste',1,3],self:0.08,d:'Pay 8% HP to act faster.'},
  dragon_kick:{n:'Dragon Kick',k:'phys',c:[0,24],cd:3,p:2.6,tg:'enemy',st:['stun',0.4,1],d:'A kick like a dragon\'s tail.'},
  bone_spear:{n:'Bone Spear',k:'mag',c:[26,0],cd:2,p:2.2,tg:'enemy',e:'shadow',m:'shadow',d:'Spear of sharpened bone.'},
  moonfire:{n:'Moonfire',k:'mag',c:[24,0],cd:2,p:1.9,tg:'enemy',e:'arcane',st:['burn',0.6,3],m:'nature',d:'Moonlight that burns.'},
  javelin_storm:{n:'Javelin Storm',k:'phys',c:[0,28],cd:3,p:1.3,tg:'all',reach:1,d:'Throw a flurry of javelins.'},
  golden_shower:{n:'Golden Shower',k:'phys',c:[0,20],cd:3,p:1.1,tg:'all',gold:40,d:'Hurl 40 gold at everyone. Hurts.'},
  crescendo:{n:'Crescendo',k:'mag',c:[30,0],cd:3,p:1.5,tg:'all',e:'arcane',m:'lute',d:'Music swells into a shockwave.'},
  chain_heal:{n:'Chain Heal',k:'heal',c:[34,0],cd:2,p:1.4,tg:'allies',m:'nature',d:'Healing that jumps between allies.'},
  shadowflame:{n:'Shadowflame',k:'mag',c:[30,0],cd:2,p:1.5,tg:'all',e:'shadow',st:['burn',0.4,2],m:'shadow',d:'Black fire on every foe.'},
  grenade:{n:'Grenade',k:'phys',c:[0,22],cd:3,p:1.5,tg:'all',e:'fire',d:'Clockwork bomb.'},
  trap:{n:'Bear Trap',k:'debuff',c:[0,16],cd:3,tg:'enemy',st:['root',1,3],d:'Pin an enemy in place.'},
  // Tier 1 signature skills
  rally:{n:'Rally',k:'heal',c:[0,30],cd:5,p:0.25,tg:'allies',d:'Party regains health.'},
  challenge:{n:'Challenge',k:'buff',c:[0,18],cd:4,tg:'self',st:['counter',1,3],d:'Taunt and counter for 3 turns.'},
  duel_stance:{n:'Duel Stance',k:'buff',c:[0,18],cd:4,tg:'self',st:['might',1,4],d:'+25% attack for 4 turns.'},
  eagle_eye:{n:'Eagle Eye',k:'buff',c:[0,16],cd:5,tg:'self',st:['focus',1,4],d:'Focus: next shots hit harder.'},
  cheap_shot:{n:'Cheap Shot',k:'phys',c:[0,18],cd:3,p:1.4,tg:'enemy',st:['stun',0.6,1],d:'Low blow that stuns.'},
  chain_spell:{n:'Chain Spell',k:'mag',c:[35,0],cd:3,p:1.4,tg:'all',e:'lightning',m:'arcane',d:'Spell leaps from foe to foe.'},
  prayer_of_mending:{n:'Prayer of Mending',k:'buff',c:[22,0],cd:4,tg:'allies',st:['regen',1,5],d:'Long party regeneration.'},
  greater_bond:{n:'Greater Bond',k:'buff',c:[20,0],cd:5,tg:'allies',st:['might',1,4],d:'Party and summons +25% attack.'},
  crusader_strike:{n:'Crusader Strike',k:'phys',c:[10,14],cd:2,p:2.0,tg:'enemy',e:'holy',m:'holy',d:'Holy-charged blow.'},
  ravage:{n:'Ravage',k:'phys',c:[0,26],cd:3,p:0.7,hits:4,tg:'enemy',d:'Four savage hits.'},
  iron_body:{n:'Iron Body',k:'buff',c:[0,20],cd:5,tg:'self',st:['fortify',1,4],d:'Become as hard as iron.'},
  corpse_explosion:{n:'Corpse Explosion',k:'mag',c:[30,0],cd:3,p:1.8,tg:'all',e:'shadow',m:'shadow',d:'Detonate the fallen.'},
  wild_growth:{n:'Wild Growth',k:'heal',c:[28,0],cd:3,p:1.3,tg:'allies',m:'nature',d:'Party-wide blooming heal.'},
  charge:{n:'Charge',k:'phys',c:[0,20],cd:3,p:2.0,tg:'enemy',reach:1,st:['stun',0.35,1],d:'Lance charge.'},
  price_gouge:{n:'Price Gouge',k:'debuff',c:[0,16],cd:4,tg:'enemy',st:['weaken',1,4],d:'Find their weakness. And their wallet.'},
  ballad_of_heroes:{n:'Ballad of Heroes',k:'buff',c:[30,0],cd:5,tg:'allies',st:['blessed',1,4],d:'Party +15% attack and defense.'},
  ancestral_spirit:{n:'Ancestral Spirit',k:'heal',c:[45,0],cd:8,p:0.5,tg:'dead',d:'Ancestors return a fallen ally.'},
  soul_siphon:{n:'Soul Siphon',k:'mag',c:[26,0],cd:2,p:1.6,tg:'enemy',e:'shadow',drain:0.6,m:'shadow',d:'Steal life.'},
  overcharge:{n:'Overcharge',k:'buff',c:[20,10],cd:5,tg:'allies',st:['haste',1,2],d:'Party acts faster briefly.'},
  wolfpack:{n:'Wolfpack',k:'buff',c:[0,22],cd:5,tg:'allies',st:['might',1,4],d:'Fight like a pack.'},
  // Tier 2 signature skills
  warlords_command:{n:'Warlord\'s Command',k:'buff',c:[0,40],cd:6,tg:'allies',st:['might',1,4],d:'The whole army surges forward.'},
  last_stand:{n:'Last Stand',k:'buff',c:[0,30],cd:7,tg:'allies',st:['shield',1,4],d:'Massive party shield.'},
  sword_saint_art:{n:'Sword Saint\'s Art',k:'phys',c:[0,50],cd:5,p:5.0,tg:'enemy',crit:30,d:'One perfect cut.'},
  skyfall_shot:{n:'Skyfall Shot',k:'phys',c:[0,45],cd:5,p:2.0,tg:'all',acc:40,d:'A hail of arrows from the clouds.'},
  assassinate:{n:'Assassinate',k:'phys',c:[0,45],cd:5,p:5.2,tg:'enemy',crit:50,d:'Ends most fights.'},
  cataclysm:{n:'Cataclysm',k:'mag',c:[90,0],cd:6,p:3.8,tg:'all',e:'fire',m:'fire',d:'The sky falls.'},
  miracle:{n:'Miracle',k:'heal',c:[70,0],cd:6,p:3.0,tg:'allies',cleanse:1,m:'holy',d:'Heal and cleanse everyone.'},
  sovereign_call:{n:'Sovereign\'s Call',k:'summon',c:[60,0],cd:8,tg:'self',legion:1,d:'All your bonded creatures answer.'},
  templars_verdict:{n:'Templar\'s Verdict',k:'phys',c:[30,30],cd:4,p:3.6,tg:'enemy',e:'holy',m:'holy',d:'Final judgement.'},
  undying_rage:{n:'Undying Rage',k:'buff',c:[0,40],cd:7,tg:'self',st:['lifesteal',1,4],d:'Drink blood to stay alive.'},
  hundred_palms:{n:'Hundred Palms',k:'phys',c:[0,45],cd:5,p:0.45,hits:10,tg:'enemy',d:'Ten blinding strikes.'},
  lich_form:{n:'Lich Form',k:'buff',c:[50,0],cd:8,tg:'self',st:['focus',1,5],d:'Become undead-touched. +40% magic.'},
  force_of_nature:{n:'Force of Nature',k:'mag',c:[80,0],cd:6,p:3.2,tg:'all',e:'nature',st:['root',0.6,2],m:'nature',d:'The forest itself attacks.'},
  dragoon_leap:{n:'Dragoon Leap',k:'phys',c:[0,45],cd:5,p:4.0,tg:'enemy',reach:1,d:'Leap above the clouds and fall.'},
  buy_victory:{n:'Buy Victory',k:'phys',c:[0,30],cd:6,p:3.5,tg:'all',gold:300,d:'300 gold of hired arrows.'},
  symphony_of_war:{n:'Symphony of War',k:'buff',c:[60,0],cd:7,tg:'allies',st:['haste',1,4],d:'Long party haste.'},
  thunderstorm:{n:'Thunderstorm',k:'mag',c:[80,0],cd:6,p:3.3,tg:'all',e:'lightning',st:['stun',0.3,1],m:'lightning',d:'Lightning on every foe.'},
  void_gate:{n:'Void Gate',k:'mag',c:[90,0],cd:6,p:3.6,tg:'all',e:'shadow',m:'shadow',d:'Open a door to the void.'},
  mech_suit:{n:'Mech Suit',k:'buff',c:[40,30],cd:8,tg:'self',st:['fortify',1,5],d:'Climb into clockwork armor.'},
  apex_predator:{n:'Apex Predator',k:'phys',c:[0,45],cd:5,p:1.0,hits:5,tg:'enemy',crit:20,d:'Five lethal shots.'}
});
for(const c in TIER_SKILLS){const [s35,t1,t2]=TIER_SKILLS[c];SKILLS[s35].lv=35;CLASSES[c].skills.push(s35);SKILLS[t1].tier=1;SKILLS[t2].tier=2;SKILLS[t1].cls=c;SKILLS[t2].cls=c;}
// tier of an actor in its current class (player stores per class; simulated adventurers earn it by level)
function classTier(a){if(a.tiers)return a.tiers[a.cls]||0;return a.level>=55?2:a.level>=24?1:0;}
function tierName(a){const t=classTier(a);return t?CLASS_TIERS[a.cls].t[t-1]:CLASSES[a.cls].name;}
function tierEligible(P,t){const R=TIER_REQ[t];const why=[];if(classTier(P)!==t-1)why.push(t===2?`Earn the ${CLASS_TIERS[P.cls].t[0]} upgrade first`:'');if(P.level<R.lvl)why.push(`Level ${R.lvl}`);
  const keys=Object.keys(CLASSES[P.cls].mastery).map(mKey);const best=Math.max(...keys.map(k=>mLv(P,k)));if(best<R.mast)why.push(`${keys.map(k=>MASTERY[k].n).join(' or ')} mastery ${R.mast}`);
  return {ok:!why.filter(Boolean).length,why:why.filter(Boolean)};}
