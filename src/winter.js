/* ETERNAL REALMS — "The Long Night", the winter festival (1 December – 6 January).
   Switches itself on by the real calendar date. Adds the Hollyhearth region (village, Glimmerfrost Woods,
   Coalheart's Vault), festive monsters everywhere, Starlight Ornaments, gift boxes, a daily gift, a festival
   shop and limited "Long Night 2026" equipment. When the festival ends the region closes again; everything
   players earned stays theirs.
   This file is loaded before engine.js (so the new places join the travel graph); runtime functions use U lazily. */
'use strict';
const WINTER={id:'longnight',n:'The Long Night',tag:'The Long Night 2026',start:[2026,11,1],end:[2027,0,6],home:'hollyhearth',
  locs:[]};
function winterNow(){return (typeof window!=='undefined'&&window.__WINTER_NOW)||Date.now();}
// test switch for previews: ?winter in the address, or localStorage er_winter=1
function winterForced(){try{return typeof location!=='undefined'&&(/[?&]winter\b/.test(location.search)||localStorage.getItem('er_winter')==='1');}catch(e){return false;}}
function winterOn(){if(winterForced())return true;const n=new Date(winterNow());const s=new Date(...WINTER.start,0,0,0),e=new Date(...WINTER.end,23,59,59);return n>=s&&n<=e;}
function winterDaysLeft(){const e=new Date(...WINTER.end,23,59,59);return Math.max(0,Math.ceil((e-new Date(winterNow()))/86400000));}
function winterDayKey(){const n=new Date(winterNow());return `${n.getFullYear()}-${n.getMonth()+1}-${n.getDate()}`;}
function locOpen(l){const L=LOCS[l];return !L||!L.ev||winterOn();}

/* ---------- the Frostbound Vale: a separate region with its own map (x,y are positions on the painted region map) ---------- */
Object.assign(LOCS,{
  hollyhearth:{n:'Hollyhearth',ty:'village',ev:'winter',rg:'winter',x:685,y:440,f:null,lv:[1,100],sv:['inn','shop','temple','festival','market'],mon:[],res:[['w_holly','herbalism']],vis:'winter',
    d:'The heart of the Frostbound Vale: a lantern-lit village around a great decorated tree. The Frostmother hands out gifts here, and every road in the Vale starts at her door.',
    feat:['The great lantern tree','The Frostmother\'s sleigh','A frozen wishing well']},
  snowdrift:{n:'Snowdrift Fields',ty:'wild',ev:'winter',rg:'winter',x:650,y:655,f:null,lv:[1,95],mon:['w_snowman','w_wolf','w_deer','w_imp','w_gumdrop','w_owl'],res:[['w_holly','herbalism'],['w_ginger','herbalism']],
    d:'Gentle white fields south of the village, where snowmen grin a little too widely. A good first hunt in the Vale.',feat:['A ring of melted snowmen','A sledding hill','Footprints that stop in the middle of the field']},
  glimmerfrost:{n:'Glimmerfrost Woods',ty:'wild',ev:'winter',rg:'winter',x:255,y:200,f:null,lv:[1,95],mon:['w_ginger','w_wolf','w_deer','w_icewolf','w_treant','w_bats','w_imp','w_elf'],
    res:[['w_holly','herbalism'],['w_yulelog','woodcutting'],['w_tinsel','herbalism']],
    d:'Pines heavy with snow and stolen tinsel. Something has woken the old trees and the hungry things of winter.',
    feat:['Gingerbread crumbs leading off the path','A sleigh overturned in the drifts','A pine hung with broken baubles that whisper']},
  silverglass:{n:'Silverglass Lake',ty:'wild',ev:'winter',rg:'winter',x:365,y:360,f:null,lv:[1,95],mon:['w_fish','w_bear','w_revenant','w_serpent','w_icespider','w_owl'],res:[['fish_trout','fishing'],['crystal_frost','mining']],
    d:'A frozen lake as smooth as a mirror. Things swim under the ice, and drowned knights stand frozen in it.',feat:['Fishing holes cut into the ice','A frozen knight beneath your feet','An ice-fishing shack, abandoned mid-meal']},
  candlewick:{n:'Candlewick Hollow',ty:'wild',ev:'winter',rg:'winter',x:190,y:585,f:null,lv:[2,95],mon:['w_lantern','w_wax','w_witch','w_wraith','w_owl','w_star'],res:[['w_tinsel','herbalism']],
    d:'A misty hollow lit by hundreds of candles that nobody lit. Follow the lights and they follow you back.',feat:['A thousand candles in the snow','A witch\'s wax-sealed door','Lantern-wisps dancing in a circle']},
  toyworks:{n:'Tinker\'s Toyworks',ty:'dungeon',ev:'winter',rg:'winter',x:710,y:120,f:null,lv:[5,95],mon:['w_tin','w_jack','w_mouseking','w_doll','w_horse','w_puppet','w_windup','w_teddy','w_ratknight'],res:[['ore_iron','mining']],
    boss:'b_toymaster',floors:3,scale:1,d:'The great clockwork workshop where the Vale\'s toys were made. The Toymaster has wound them all up again, and they are not playing.',
    feat:['Conveyor belts of half-built soldiers','A room of staring dolls','The Toymaster\'s winding key, big as a door']},
  ruins:{n:'Gingerbread Ruins',ty:'ruin',ev:'winter',rg:'winter',x:870,y:265,f:null,lv:[5,95],mon:['w_ginger','w_gumdrop','w_sugarplum','w_mummy','w_elf','w_mimic','w_gremlin'],res:[['w_ginger','herbalism'],['w_tinsel','herbalism']],
    d:'A sugar town that crumbled long ago. The candy canes still stand like gravestones.',feat:['Toppled candy canes','A gingerbread chapel','Gift boxes that breathe']},
  peaks:{n:'Peppermint Peaks',ty:'lair',ev:'winter',rg:'winter',x:1065,y:125,f:null,lv:[8,95],mon:['w_drake','w_giant','w_mammoth','w_icewolf','w_sugarplum'],res:[['crystal_frost','mining'],['w_antler','herbalism']],
    d:'Striped mountains where peppermint drakes nest and frost giants herd mammoths. The Yule Wyrm sleeps somewhere above.',feat:['A drake nest of candy shells','Giant footprints full of snow','A mammoth graveyard']},
  aurora:{n:'Aurora Spire',ty:'dungeon',ev:'winter',rg:'winter',x:1295,y:215,f:null,lv:[12,95],mon:['w_sprite','w_starfall','w_star','w_revenant','w_knight','w_icespider'],res:[['w_spirit','mining']],
    boss:'b_aurora',floors:4,scale:1,d:'A spire of living crystal that pulls the northern lights out of the sky. Its queen has stolen the Frostmother\'s star.',
    feat:['Staircases of frozen light','Starlight trapped in crystal','The Queen\'s empty throne, still humming']},
  coalvault:{n:'Coalheart\'s Vault',ty:'dungeon',ev:'winter',rg:'winter',x:1220,y:400,f:null,lv:[8,95],mon:['w_gremlin','w_nut','w_mimic','w_knight','w_elf','w_serpent'],res:[['w_coal','mining']],
    boss:'b_coalheart',floors:3,scale:1,d:'A black stone vault on a cliff where Old Coalheart hoards every gift he has ever stolen.',
    feat:['Mountains of unopened gifts','A furnace that burns stolen wishes','Cages of tin soldiers']},
  grimhollow:{n:'Grimwinter\'s Hollow',ty:'lair',ev:'winter',rg:'winter',x:1180,y:650,f:null,lv:[10,95],mon:['w_revenant','w_wraith','w_knight','w_bats','w_icewolf','w_treant'],res:[['w_coal','mining']],
    d:'Thorns, horns and chains. The Horned Collector keeps the naughty here, and comes out when the snow is deepest.',feat:['Iron cages hung from thorn trees','Horned statues with burning eyes','A sack big enough for a village']}
});
WINTER.locs=Object.keys(LOCS).filter(l=>LOCS[l].ev==='winter');
// closed outside the festival: every system that skips hidden places (quests, invasions, treasure, travel) skips these too
for(const l of WINTER.locs)Object.defineProperty(LOCS[l],'hid',{get(){return !winterOn();},enumerable:true});
// roads inside the Vale only: the Vale is reached by the festival sleigh, not on foot
ROUTES.push(['hollyhearth','snowdrift',1],['hollyhearth','silverglass',1],['hollyhearth','glimmerfrost',2],['glimmerfrost','silverglass',1],['silverglass','candlewick',1],['hollyhearth','candlewick',2],
  ['snowdrift','candlewick',2],['hollyhearth','toyworks',2],['glimmerfrost','toyworks',2],['hollyhearth','ruins',1],['toyworks','ruins',1],['ruins','peaks',1],['peaks','aurora',2],['ruins','coalvault',2],
  ['aurora','coalvault',1],['coalvault','grimhollow',1],['snowdrift','grimhollow',2]);
Object.assign(TOWNSFOLK,{hollyhearth:[['The Frostmother','frostmother'],['Bram Tallow','candlemaker'],['Little Wren','singer']]});

/* ---------- monsters (art: cell in the xmon sheet) ---------- */
Object.assign(MONSTERS,{
  w_ginger:{n:'Gingerbread Brute',cat:'construct',hp:1.7,at:1.2,df:1.4,sp:0.8,b:['brute'],w:['fire'],r:['frost'],loot:[['w_ginger',0.7,2],['w_ornament',0.5,1]],g:0.8,art:0},
  w_imp:{n:'Frostbitten Imp',cat:'spirit',hp:0.75,at:1.0,md:1.25,ev:1.5,e:'frost',b:['caster','pack'],w:['fire'],r:['frost'],st:['slow',0.25,2],loot:[['w_ornament',0.6,1],['w_tinsel',0.3,1]],g:1.0,art:1},
  w_wolf:{n:'Wreathwolf',cat:'beast',hp:1.1,at:1.25,sp:1.35,b:['pack','aggressive'],w:['fire'],r:['frost'],loot:[['pelt_wolf',0.5,1],['w_holly',0.5,1],['w_ornament',0.4,1]],g:0.5,tame:'wolf',art:2},
  w_wraith:{n:'Tinsel Wraith',cat:'undead',hp:1.0,at:1.0,md:1.45,ev:1.3,e:'frost',b:['undead','caster'],w:['holy','fire'],r:['frost','shadow','poison'],loot:[['w_tinsel',0.6,1],['ectoplasm',0.3,1],['w_ornament',0.5,1]],g:1.0,art:3},
  w_nut:{n:'Nutcracker Sentinel',cat:'construct',hp:1.6,at:1.3,df:1.6,sp:0.9,b:['brute'],w:['fire','lightning'],r:['poison'],loot:[['wood_oak',0.5,2],['w_ornament',0.6,1]],g:1.4,gear:0.08,art:4},
  w_deer:{n:'Gloomhorn Reindeer',cat:'beast',hp:1.3,at:1.3,sp:1.45,e:'frost',b:['aggressive'],r:['frost'],loot:[['w_antler',0.6,1],['meat',0.6,2],['w_ornament',0.4,1]],g:0.4,art:5},
  w_gremlin:{n:'Coal Gremlin',cat:'humanoid',hp:0.8,at:1.0,ev:1.6,sp:1.4,e:'fire',b:['ambush','pack'],w:['frost'],loot:[['w_coal',0.8,2],['w_ornament',0.5,1]],g:2.6,art:6},
  w_snowman:{n:'Grinning Snowman',cat:'construct',hp:1.4,at:1.1,df:1.2,e:'frost',w:['fire'],r:['frost','poison'],st:['freeze',0.15,1],loot:[['w_snowball',0.5,2],['w_coal',0.4,1],['w_ornament',0.4,1]],g:0.6,art:7},
  w_serpent:{n:'Candyscale Serpent',cat:'beast',hp:1.3,at:1.3,ev:1.2,e:'poison',st:['poison',0.3,3],w:['fire'],loot:[['w_candycane',0.6,2],['w_ornament',0.5,1]],g:0.8,art:12},
  w_mimic:{n:'Gift Mimic',cat:'construct',hp:1.3,at:1.5,df:1.3,b:['ambush'],w:['fire'],loot:[['w_gift',0.6,1],['w_ornament',0.8,2]],g:4.5,gear:0.15,art:13},
  w_star:{n:'Fallen Starling',cat:'elemental',hp:1.0,at:1.0,md:1.5,ev:1.3,e:'holy',b:['caster'],r:['holy','frost'],w:['shadow'],loot:[['w_spirit',0.25,1],['w_ornament',0.6,1]],g:1.0,art:14},
  w_knight:{n:'Wreathbound Knight',cat:'undead',hp:1.5,at:1.3,df:1.5,b:['undead'],w:['holy','fire'],r:['frost','poison'],loot:[['bone',0.5,2],['w_ornament',0.6,1]],g:1.4,gear:0.12,art:15},
  b_coalheart:{n:'Old Coalheart',cat:'humanoid',boss:1,hp:6,at:1.6,df:1.4,md:1.4,e:'fire',b:['boss','caster'],w:['frost','holy'],r:['fire'],st:['burn',0.3,2],
    loot:[['w_coal',1,6],['w_ornament',1,12],['w_gift',1,2]],g:30,gear:1,uniq:'w_nutmaul',uq:0.12,set:'yulewarden',lim:1,art:8},
  b_grimwinter:{n:'Grimwinter, the Horned Collector',cat:'spirit',boss:1,world:1,hp:42,at:2.0,df:1.9,md:1.8,e:'frost',w:['fire','holy'],r:['frost'],st:['freeze',0.2,1],b:['boss'],
    loot:[['w_ornament',1,30],['w_spirit',1,3],['w_gift',1,3]],g:220,gear:2,uniq:'w_birch',uq:0.3,set:'yulewarden',lim:1,art:9}
});
// the Vale's wider bestiary (art: [sheet, cell])
Object.assign(MONSTERS,{
  // haunted toys (Tinker's Toyworks)
  w_tin:{n:'Tin Soldier',cat:'construct',hp:1.1,at:1.2,df:1.4,b:['pack'],w:['lightning'],r:['poison'],loot:[['ore_iron',0.4,1],['w_ornament',0.5,1]],g:0.8,art:['xmon2',0]},
  w_jack:{n:'Jack-in-the-Box Horror',cat:'construct',hp:0.9,at:1.4,ev:1.3,b:['ambush'],w:['fire'],loot:[['w_ornament',0.6,1]],g:1.2,art:['xmon2',1]},
  w_mouseking:{n:'Clockwork Mouse King',cat:'construct',hp:1.8,at:1.3,df:1.3,b:['brute'],w:['lightning'],loot:[['w_ornament',0.8,2],['ore_silver',0.3,1]],g:2,gear:0.12,art:['xmon2',2]},
  w_doll:{n:'Porcelain Haunt',cat:'undead',hp:0.9,at:1.0,md:1.5,ev:1.3,e:'shadow',b:['caster'],w:['holy'],r:['shadow','poison'],st:['weaken',0.3,2],loot:[['ectoplasm',0.4,1],['w_ornament',0.5,1]],g:1.2,art:['xmon2',3]},
  w_horse:{n:'Nightmare Rocking Horse',cat:'construct',hp:1.3,at:1.4,sp:1.4,e:'fire',b:['aggressive'],w:['frost'],r:['fire'],st:['burn',0.25,2],loot:[['wood_oak',0.5,2],['w_ornament',0.5,1]],g:0.9,art:['xmon2',4]},
  w_puppet:{n:'Marionette Assassin',cat:'construct',hp:0.9,at:1.5,ev:1.6,sp:1.4,b:['ambush'],w:['fire'],st:['bleed',0.3,2],loot:[['silk',0.5,1],['w_ornament',0.5,1]],g:1.5,art:['xmon2',5]},
  w_windup:{n:'Wind-up Knight',cat:'construct',hp:1.7,at:1.3,df:1.7,sp:0.8,b:['brute'],w:['lightning'],r:['poison'],loot:[['ingot_iron',0.3,1],['w_ornament',0.6,1]],g:1.4,gear:0.1,art:['xmon2',6]},
  w_teddy:{n:'Stitched Bear Brute',cat:'construct',hp:2.0,at:1.3,df:1.0,b:['brute'],w:['fire'],loot:[['silk',0.4,2],['w_ornament',0.6,1]],g:1.0,art:['xmon2',7]},
  w_ratknight:{n:'Mouse King\'s Champion',cat:'beast',hp:1.1,at:1.3,ev:1.4,b:['pack','aggressive'],loot:[['w_ornament',0.5,1]],g:1.2,art:['xmon3',14]},
  // lake & hollow
  w_fish:{n:'Glassfang Pike',cat:'beast',hp:0.8,at:1.2,ev:1.3,e:'frost',b:['pack'],w:['lightning'],r:['frost'],loot:[['fish_trout',0.6,1],['w_ornament',0.4,1]],g:0.4,art:['xmon2',9]},
  w_bear:{n:'Polar Bear Warlord',cat:'beast',hp:1.9,at:1.5,df:1.3,b:['brute','aggressive'],w:['fire'],r:['frost'],loot:[['hide',0.8,2],['meat',0.7,2],['w_ornament',0.5,1]],g:0.8,art:['xmon2',10]},
  w_revenant:{n:'Frost Revenant',cat:'undead',hp:1.5,at:1.4,df:1.4,e:'frost',b:['undead'],w:['holy','fire'],r:['frost','shadow','poison'],st:['freeze',0.15,1],loot:[['crystal_frost',0.4,1],['w_ornament',0.6,1]],g:1.3,gear:0.1,art:['xmon2',11]},
  w_owl:{n:'Snow Owl Harpy',cat:'beast',hp:0.9,at:1.2,ev:1.5,sp:1.5,b:['ranged'],w:['lightning'],loot:[['roc_feather',0.15,1],['w_ornament',0.4,1]],g:0.6,art:['xmon2',12]},
  w_lantern:{n:'Lantern Wisp',cat:'spirit',hp:0.6,at:0.9,md:1.4,ev:1.8,e:'fire',b:['caster','pack'],w:['frost'],r:['fire'],loot:[['w_tinsel',0.3,1],['w_ornament',0.5,1]],g:0.6,art:['xmon2',13]},
  w_wax:{n:'Wax Golem',cat:'construct',hp:1.9,at:1.2,df:1.2,sp:0.7,e:'fire',b:['brute'],w:['frost'],r:['fire'],loot:[['w_yulelog',0.3,1],['w_ornament',0.6,1]],g:0.9,art:['xmon2',14]},
  w_witch:{n:'Candle Witch',cat:'humanoid',hp:1.0,at:0.9,md:1.6,e:'fire',b:['caster','healer'],w:['frost'],st:['burn',0.35,2],loot:[['crystal_fire',0.3,1],['w_ornament',0.7,1]],g:2.5,gear:0.15,art:['xmon2',15]},
  // aurora, peaks & ruins
  w_sprite:{n:'Aurora Sprite',cat:'spirit',hp:0.7,at:0.9,md:1.6,ev:1.7,e:'arcane',b:['caster','pack'],r:['arcane'],w:['shadow'],loot:[['crystal_mana',0.3,1],['w_ornament',0.5,1]],g:0.8,art:['xmon3',0]},
  w_starfall:{n:'Starfall Golem',cat:'construct',hp:2.2,at:1.4,df:1.8,md:1.4,e:'holy',b:['brute'],r:['holy','frost'],w:['shadow'],loot:[['w_spirit',0.15,1],['w_ornament',0.7,1]],g:1.0,art:['xmon3',1]},
  w_giant:{n:'Frost Giant',cat:'humanoid',hp:2.4,at:1.6,df:1.4,sp:0.8,e:'frost',b:['brute'],w:['fire'],r:['frost'],st:['stun',0.15,1],loot:[['crystal_frost',0.5,2],['w_ornament',0.7,2]],g:2,gear:0.15,art:['xmon3',2]},
  w_mammoth:{n:'Bellwool Mammoth',cat:'beast',hp:2.6,at:1.4,df:1.5,sp:0.7,b:['brute'],w:['fire'],r:['frost'],loot:[['hide',0.8,3],['w_bell',0.06,1],['w_ornament',0.6,1]],g:0.8,art:['xmon3',3]},
  w_drake:{n:'Peppermint Drake',cat:'dragon',hp:1.6,at:1.5,sp:1.3,e:'frost',b:['dragon'],w:['fire'],r:['frost'],loot:[['scale_drake',0.4,1],['w_candycane',0.5,2],['w_ornament',0.6,1]],g:1.4,art:['xmon3',4]},
  w_sugarplum:{n:'Sugarplum Fiend',cat:'spirit',hp:0.9,at:1.1,md:1.4,ev:1.6,e:'poison',b:['caster'],w:['holy'],st:['poison',0.35,3],loot:[['w_candycane',0.4,1],['w_ornament',0.5,1]],g:1.2,art:['xmon3',5]},
  w_gumdrop:{n:'Gumdrop Ooze',cat:'elemental',hp:1.1,at:0.9,df:0.8,b:['pack'],w:['fire'],r:['poison'],loot:[['w_candycane',0.3,1],['w_ornament',0.4,1]],g:0.4,art:['xmon3',6]},
  w_elf:{n:'Hollow Elf Saboteur',cat:'humanoid',hp:1.0,at:1.3,ev:1.5,sp:1.3,b:['ambush','surrender'],st:['bleed',0.3,2],loot:[['w_gift',0.12,1],['w_ornament',0.6,1]],g:2.4,gear:0.12,art:['xmon3',7]},
  w_mummy:{n:'Giftwrapped Mummy',cat:'undead',hp:1.4,at:1.2,df:1.2,b:['undead'],w:['fire','holy'],r:['poison','shadow'],st:['weaken',0.25,2],loot:[['w_gift',0.1,1],['w_ornament',0.6,1]],g:1.0,art:['xmon3',8]},
  w_icewolf:{n:'Crystalmane Alpha',cat:'beast',hp:1.4,at:1.4,sp:1.4,e:'frost',b:['pack','aggressive'],w:['fire'],r:['frost'],loot:[['pelt_wolf',0.7,1],['w_ornament',0.5,1]],g:0.6,tame:'wolf',art:['xmon3',9]},
  w_bats:{n:'Snowbat Swarm',cat:'beast',hp:0.8,at:1.1,ev:1.8,sp:1.6,b:['pack'],w:['fire','lightning'],st:['bleed',0.2,2],loot:[['w_ornament',0.4,1]],g:0.3,art:['xmon3',10]},
  w_treant:{n:'Evergloom Treant',cat:'spirit',hp:2.3,at:1.3,df:1.6,sp:0.6,e:'nature',b:['brute','regen'],w:['fire'],r:['nature','frost'],loot:[['w_yulelog',0.5,1],['wood_elder',0.3,1],['w_ornament',0.6,1]],g:0.8,art:['xmon3',11]},
  w_icespider:{n:'Rimefang Spider',cat:'beast',hp:1.2,at:1.3,ev:1.3,e:'frost',b:['ambush'],w:['fire'],r:['frost'],st:['slow',0.3,2],loot:[['silk',0.6,1],['w_ornament',0.5,1]],g:0.6,tame:'spider',art:['xmon3',15]},
  // bosses
  b_toymaster:{n:'The Toymaster',cat:'humanoid',boss:1,hp:6,at:1.5,df:1.4,md:1.6,e:'arcane',b:['boss','caster'],w:['fire','lightning'],loot:[['w_ornament',1,12],['w_gift',1,2],['ingot_steel',1,3]],g:30,gear:1,uniq:'w_bellbow',uq:0.12,set:'yulewarden',lim:1,art:['xmon2',8]},
  b_aurora:{n:'The Aurora Queen',cat:'spirit',boss:1,hp:7,at:1.6,df:1.5,md:2.0,e:'arcane',b:['boss','caster'],w:['shadow','fire'],r:['arcane','frost','holy'],st:['stun',0.2,1],loot:[['w_ornament',1,16],['w_spirit',1,2],['w_gift',1,2]],g:40,gear:1,uniq:'w_frostorb',uq:0.12,set:'yulewarden',lim:1,art:['xmon3',12]},
  b_yulewyrm:{n:'The Yule Wyrm',cat:'dragon',boss:1,world:1,hp:46,at:2.1,df:2.0,md:1.8,e:'frost',w:['fire'],r:['frost'],b:['boss','dragon'],loot:[['w_ornament',1,30],['scale_drake',1,4],['w_gift',1,3]],g:240,gear:2,uniq:'w_pepperblade',uq:0.3,set:'yulewarden',lim:1,art:['xmon3',13]}
});
const WINTER_FOLK_ART={'The Frostmother':10,'Bram Tallow':11};

/* ---------- items (art: cell in the xitems sheet). lim: part of the limited Long Night collection ---------- */
Object.assign(ITEMS,{
  w_ornament:{n:'Starlight Ornament',t:'misc',v:3,lim:1,art:0,d:'Festival currency. Trade them with the Frostmother in Hollyhearth.'},
  w_candycane:{n:'Candy Cane',t:'food',heal:140,stam:60,v:12,wellfed:1,lim:1,art:1},
  w_cookie:{n:'Gingerbread Knight',t:'food',heal:220,mana:60,v:20,wellfed:1,lim:1,art:2},
  w_cider:{n:'Mulled Cider',t:'con',mana:160,stam:120,v:28,lim:1,art:3},
  w_elixir:{n:'Peppermint Elixir',t:'con',buff:'haste',v:90,lim:1,art:4},
  w_snowball:{n:'Enchanted Snowball',t:'con',bomb:1,e:'frost',dmg:80,v:30,lim:1,art:5},
  w_gift:{n:'Festival Gift',t:'con',gift:1,v:60,lim:1,art:6,d:'Open it to see what the Long Night brought you.'},
  w_holly:{n:'Frozen Holly',t:'mat',v:8,lim:1,art:7},
  w_coal:{n:'Lump of Coal',t:'mat',v:1,lim:1,art:8},
  w_yulelog:{n:'Yule Log',t:'mat',v:14,lim:1,art:9},
  w_tinsel:{n:'Starlight Tinsel',t:'mat',v:12,lim:1,art:10},
  w_antler:{n:'Frosted Antler',t:'mat',v:16,lim:1,art:11},
  w_ginger:{n:'Gingerbread Chunk',t:'mat',v:6,lim:1,art:12},
  w_spirit:{n:'Spirit of Winter',t:'mat',v:220,lim:1,art:13},
  w_mistletoe:{n:'Mistletoe Charm',t:'con',heal:400,hpc:0.5,mana:120,v:110,lim:1,art:14},
  w_bell:{n:'Golden Sleigh Bell',t:'misc',v:400,lim:1,art:15,d:'A keepsake of the Long Night. Collectors pay well for it.'}
});

/* ---------- limited equipment (art: cell in the xgear sheet) ---------- */
Object.assign(UNIQUES,{
  w_candystaff:{n:'Candlewick Crook',b:'staff',aff:['arcane','arcane','owl','dawn'],lore:'A staff of striped sugar-glass that never melts. Limited: The Long Night.',lim:1,art:0},
  w_nutmaul:{n:'Nutcracker\'s Maul',b:'mace',aff:['mighty','mighty','bear','frost'],lore:'Old Coalheart\'s favourite toy. It still clacks. Limited: The Long Night.',lim:1,art:1},
  w_pepperblade:{n:'Peppermint Edge',b:'sword',aff:['mighty','keen','frost','swift'],lore:'Smells of mint, cuts like winter. Limited: The Long Night.',lim:1,art:2},
  w_bellbow:{n:'Sleighbell Longbow',b:'bow',aff:['precise','precise','keen','frost'],lore:'Every arrow rings. Limited: The Long Night.',lim:1,art:3},
  w_icicle:{n:'Icicle Shiv',b:'dagger',aff:['keen','keen','fox','frost'],lore:'Snapped from the eaves of Hollyhearth. Limited: The Long Night.',lim:1,art:4},
  w_frostorb:{n:'Snowglobe of Hollyhearth',b:'orb',aff:['arcane','owl','frost','blessed'],lore:'A whole village sleeps inside it. Limited: The Long Night.',lim:1,art:5},
  w_birch:{n:'Birch Reaper',b:'scythe',aff:['night','night','mighty','vampiric'],lore:'Grimwinter\'s switch, bound in chains. Limited: The Long Night.',lim:1,art:6},
  w_wreathshield:{n:'Wreath Aegis',b:'shield',aff:['sturdy','sturdy','warding','blessed'],lore:'Holly on cold iron. Limited: The Long Night.',lim:1,art:7},
  w_ring:{n:'Snowflake Signet',b:'ring',aff:['lucky','keen','fortune','swift'],lore:'No two are alike. Limited: The Long Night.',lim:1,art:13},
  w_amulet:{n:'Frostmother\'s Star',b:'amulet',aff:['blessed','owl','warding','fortune'],lore:'A gift for the faithful. Limited: The Long Night.',lim:1,art:14},
  w_cloak:{n:'Mantle of the Long Night',b:'cloak',aff:['swift','fox','warding','sturdy'],lore:'Warm as a hearth, dark as the solstice. Limited: The Long Night.',lim:1,art:15}
});
SETS.yulewarden={n:'Yulewarden',ac:'leather',two:{spd:3,res_frost:15},four:{mhp:0.1,patk:0.07,matk:0.07},src:'The Long Night (limited)',lim:1};
const WINTER_SET_ART={head:8,chest:9,legs:10,hands:11,feet:12};
const WINTER_SET_NAMES={head:'Yulewarden Hood',chest:'Yulewarden Coat',legs:'Yulewarden Leggings',hands:'Yulewarden Mittens',feet:'Yulewarden Boots'};

/* ---------- achievements ---------- */
Object.assign(ACHIEVEMENTS,{
  w_spirit:{n:'Spirit of the Long Night',d:'Collect 100 Starlight Ornaments during the festival.',f:p=>((p.winter||{}).earned||0)>=100},
  w_coalheart:{n:'Coal for Coalheart',d:'Defeat Old Coalheart in his vault.',f:p=>!!(p.kills&&p.kills.b_coalheart)},
  w_collector:{n:'Out-Collected the Collector',d:'Help defeat Grimwinter, the Horned Collector.',f:p=>!!(p.kills&&p.kills.b_grimwinter)||!!((p.winter||{}).grim)}
});

/* =====================================================================================================
   runtime
   ===================================================================================================== */
function wState(){const P=S.P;P.winter=P.winter||{earned:0,days:{},streak:0,shop:{}};return P.winter;}
function winterLimTag(it){if(!it)return null;if(it.lim)return WINTER.tag;if(!isGear(it)){const d=ITEMS[it.k];return d&&d.lim?WINTER.tag:null;}
  if(it.u&&UNIQUES[it.u]&&UNIQUES[it.u].lim)return WINTER.tag;if(it.set&&SETS[it.set]&&SETS[it.set].lim)return WINTER.tag;return null;}
function wGear(kind,l,slot){const P=S.P;l=U.clamp(Math.round(l||P.level),1,100);let it;
  if(kind==='set'){const sl=slot||U.pick(['head','chest','legs','hands','feet']);it=makeGear(`${sl}_leather`,l,U.chance(0.25)?4:3);it.set='yulewarden';}
  else it=makeUnique(kind,l);
  it.lim=WINTER.tag;return it;}
function wGive(k,q){const P=S.P;invAdd(P,k,q);if(k==='w_ornament'){wState().earned+=q;}}

// every monster anywhere has a small chance to carry festival loot while the Long Night lasts
function winterLoot(id,l,out){if(!winterOn()||!S||!S.P)return;const M=MONSTERS[id];const fest=id.startsWith('w_')||M.lim;
  if(!fest){if(U.chance(0.07))out.items.push({k:'w_ornament',q:U.ri(1,2)});if(U.chance(0.015))out.items.push({k:'w_gift',q:1});return;}
  if(U.chance(0.03))out.items.push(wGear('set',l));if(U.chance(0.006))out.items.push(wGear(U.pick(['w_pepperblade','w_bellbow','w_icicle','w_frostorb','w_candystaff']),l));}
// festive wanderers show up outside Hollyhearth too
function winterSwap(loc,id){if(!winterOn()||isTown(loc)||LOCS[loc].ev||!U.chance(0.08))return id;return U.pick(['w_imp','w_gremlin','w_snowman','w_mimic','w_wolf','w_elf','w_gumdrop','w_bats','w_lantern']);}
// the Vale is crowded: bigger packs than anywhere else (each extra monster is softened a little by startCombat)
// swarms: the more monsters in a Vale pack, the weaker each one, so a pack of four is about as hard as a normal pair
function winterSoften(loc,en){if(!LOCS[loc]||!LOCS[loc].ev||en.length<2)return;const k=({2:0.82,3:0.64,4:0.53})[Math.min(4,en.length)];for(const e of en){if(e.boss)continue;e.mhp=Math.max(1,Math.round(e.mhp*k));e.hp=e.mhp;e.atk*=k;e.matk*=k;}}
function winterPack(loc,n){if(!LOCS[loc]||!LOCS[loc].ev)return n;return Math.max(n,U.wpick([1,2,3,4],k=>({1:2,2:5,3:3,4:1})[k]));}

function openGift(){const P=S.P;const got=[];const add=(k,q)=>{wGive(k,q);got.push(`${ITEMS[k].n}${q>1?' ×'+q:''}`);};
  add('w_ornament',U.ri(3,8));
  const r=U.r();if(r<0.45)add(U.pick(['w_candycane','w_cookie','w_cider']),U.ri(1,3));else if(r<0.7)add(U.pick(['w_elixir','w_snowball','w_mistletoe']),1);else if(r<0.9)add(U.pick(['w_holly','w_tinsel','w_yulelog','w_antler']),U.ri(2,4));else add('w_bell',1);
  if(U.chance(0.07)){const g=wGear('set',P.level);P.inv.push(g);got.push(itemName(g));}
  if(U.chance(0.02)){const g=wGear(U.pick(['w_pepperblade','w_bellbow','w_icicle','w_frostorb','w_candystaff','w_wreathshield']),P.level);P.inv.push(g);got.push(itemName(g));}
  log(`You unwrap the Festival Gift: ${got.join(', ')}.`,'epic');if(typeof UI!=='undefined'){UI.toast('🎁 '+got[0]+(got.length>1?` +${got.length-1} more`:''),'epic');if(typeof sfx==='function')sfx('loot');if(typeof confetti==='function')confetti();}
  checkAch();return true;}

/* ---------- daily gift (one per real day) ---------- */
function winterGiftReady(){if(!winterOn()||!S||!S.P)return false;return !wState().days[winterDayKey()];}
function claimDailyGift(){if(!winterGiftReady())return;const W=wState();W.days[winterDayKey()]=1;W.streak=(W.streak||0)+1;const n=W.streak;const P=S.P;const got=[];
  const orn=6+Math.min(14,n);wGive('w_ornament',orn);got.push(`${orn} Starlight Ornaments`);
  wGive('w_gift',n%5===0?3:1);got.push(n%5===0?'3 Festival Gifts':'a Festival Gift');
  const d=new Date(winterNow());const xmas=d.getMonth()===11&&(d.getDate()===24||d.getDate()===25);
  if(xmas&&!W.star){W.star=1;const g=wGear('w_amulet',P.level);P.inv.push(g);got.push(itemName(g));}
  else if(n%7===0){const g=wGear('set',P.level);P.inv.push(g);got.push(itemName(g));}
  log(`The Frostmother's gift (day ${n} of your Long Night): ${got.join(', ')}.`,'epic');UI.toast(`🎁 Daily gift: ${got.join(', ')}`,'epic');if(typeof confetti==='function')confetti();checkAch();}

/* ---------- festival shop ---------- */
const WINTER_SHOP=[
  ['w_candycane',3,3],['w_cookie',3,4],['w_cider',3,5],['w_elixir',1,6],['w_snowball',3,6],['w_mistletoe',1,9],['w_gift',1,12],
  ['set:head',1,45],['set:chest',1,60],['set:legs',1,50],['set:hands',1,40],['set:feet',1,40],
  ['w_ring',1,90],['w_cloak',1,110],['w_wreathshield',1,120],['w_pepperblade',1,140],['w_bellbow',1,140],['w_icicle',1,140],['w_frostorb',1,140],['w_candystaff',1,140]];
function winterShopView(){const P=S.P;const have=invCount(P,'w_ornament');
  const row=([k,q,c],i)=>{const set=k.startsWith('set:');const isU=!set&&UNIQUES[k];const name=set?WINTER_SET_NAMES[k.slice(4)]:isU?UNIQUES[k].n:ITEMS[k].n;
    const pic=set?artCell('xgear',WINTER_SET_ART[k.slice(4)],'shopic'):isU?artCell('xgear',UNIQUES[k].art,'shopic'):artCell('xitems',ITEMS[k].art,'shopic');
    const sub=set?`Yulewarden set piece · Lv.${P.level} · epic or better`:isU?`Legendary · Lv.${P.level}`:E(itemDesc({k}));
    return `<div class="li wshop">${ART.ok?pic:''}<span><b class="${set?'r3':isU?'r4':''}">${E(name)}${q>1?' ×'+q:''}</b><small>${sub}</small></span><span class="orn">${c} ✦</span>${btn('Trade','wbuy',i,have>=c?'tiny gilt':'tiny ghost')}</div>`;};
  return `<div class="wshophead">${ART.ok?artCell('xmon',10,'wkeeper'):''}<div><h3>The Frostmother's Gift Exchange</h3><p class="hint">“Every ornament is a little piece of starlight. Bring them to me and I will find you something warm.”</p>
    <p>You have <b class="orn">${U.fmt(have)} ✦</b> Starlight Ornaments.</p></div></div>
    <h4>Treats & supplies</h4><div class="list">${WINTER_SHOP.slice(0,7).map(row).join('')}</div>
    <h4>Yulewarden set <small>(2 pieces: +speed, frost resistance · 4 pieces: +10% HP, +7% attack & magic)</small></h4><div class="list">${WINTER_SHOP.slice(7,12).map((r,i)=>row(r,i+7)).join('')}</div>
    <h4>Limited legendaries</h4><div class="list">${WINTER_SHOP.slice(12).map((r,i)=>row(r,i+12)).join('')}</div>
    <p class="hint">Everything here is part of the limited Long Night 2026 collection and stays yours after the festival.</p>`;}
function winterBuy(i){const P=S.P;const e=WINTER_SHOP[+i];if(!e)return;const [k,q,c]=e;if(invCount(P,'w_ornament')<c){UI.toast(`You need ${c} Starlight Ornaments.`,'bad');return;}
  if(P.inv.length>=60&&(k.startsWith('set:')||UNIQUES[k])){UI.toast('Your bag is full.','bad');return;}
  invRemove(P,'w_ornament',c);let name;
  if(k.startsWith('set:')){const g=wGear('set',P.level,k.slice(4));P.inv.push(g);name=itemName(g);}else if(UNIQUES[k]){const g=wGear(k,P.level);P.inv.push(g);name=itemName(g);}else{invAdd(P,k,q);name=ITEMS[k].n+(q>1?' ×'+q:'');}
  log(`The Frostmother wraps up ${name} for you.`,'good');UI.toast(`Traded for ${name}`,'epic');if(typeof sfx==='function')sfx('buy');}

/* ---------- festival panel on the world screen ---------- */
function winterPanel(){if(!winterOn()||!S||!S.P)return '';const P=S.P;const here=LOCS[P.loc].ev;const left=winterDaysLeft();const orn=invCount(P,'w_ornament');
  const canSleigh=!P.dungeon&&!here&&isTown(P.loc);
  return `<section class="panel winter"><div class="wbg" aria-hidden="true"></div><div class="wcontent"><p class="wpre">Festival · ${left} day${left===1?'':'s'} left</p><h3>❄ The Long Night</h3>
    ${here?'':'<p>The <b>Frostbound Vale</b> has opened. Take the festival sleigh to Hollyhearth: haunted toys, frost giants and stolen-gift thieves wait in eleven new places, with three dungeons and two world bosses.</p>'}
    ${winterQuestHtml()}
    <p class="wstat"><span class="orn">${U.fmt(orn)} ✦</span> ornaments${invCount(P,'w_gift')?` · <b>${invCount(P,'w_gift')}</b> gift${invCount(P,'w_gift')>1?'s':''} to open`:''}</p>
    <div class="row wrap">${winterGiftReady()?btn('🎁 Claim today\'s gift','wgift','','gilt'):'<span class="hint">Today\'s gift claimed. Come back tomorrow.</span>'}
    ${canSleigh?btn('🛷 Festival sleigh to the Vale','wsleigh','','gilt'):''}${here?btn('🗺 Map of the Vale','wmap','',''):''}${here&&!P.dungeon?btn(`🛷 Sleigh home to ${LOCS[P.wPrev&&LOCS[P.wPrev]&&!LOCS[P.wPrev].ev?P.wPrev:'valeria'].n}`,'wsleighback',''):''}
    ${invCount(P,'w_gift')?btn('Open a gift','wopen','',''):''}</div></div></section>`;}
function winterSleigh(back){const P=S.P;if(UI.inCombat()||P.dungeon)return;const to=back?(P.wPrev&&LOCS[P.wPrev]&&!LOCS[P.wPrev].ev?P.wPrev:'valeria'):'hollyhearth';if(!to||!LOCS[to])return;if(!back)P.wPrev=P.loc;
  spend(60);P.loc=to;if(!P.explored.includes(to))P.explored.push(to);log(back?`The festival sleigh drops you back in ${LOCS[to].n}.`:'Bells jingle through the snow as the festival sleigh carries you into the Frostbound Vale, to Hollyhearth.','good');UI.tab='world';window.scrollTo(0,0);if(!back)winterVisit(to);}
// after the festival: nobody is left stranded in a region that has closed
function winterCleanup(){if(!S||!S.P||winterOn())return;const P=S.P;if(LOCS[P.loc]&&LOCS[P.loc].ev){P.loc=P.wPrev&&LOCS[P.wPrev]&&!LOCS[P.wPrev].ev?P.wPrev:'khazgard';P.dungeon=null;}}

/* ---------- actions ---------- */
function winterActs(){Object.assign(ACT,{
  wgift(){claimDailyGift();},
  wopen(){const P=S.P;const i=P.inv.findIndex(x=>x.k==='w_gift');if(i>=0)useItem(i);},
  wsleigh(){winterSleigh(false);},wsleighback(){winterSleigh(true);},
  wbuy(i){winterBuy(i);if(typeof refreshModal==='function')refreshModal();},
  wbounty(){claimBounty();},wmap(){UI.tab='map';UI.mapRegion='winter';UI.mapSel=null;window.scrollTo(0,0);},mapregion(v){UI.mapRegion=v;UI.mapSel=null;}});}


/* ---------- the Frostmother's quest chain and daily bounties ---------- */
const WINTER_CHAIN=[
  {n:'The Call of the Long Night',d:'Take the festival sleigh to Hollyhearth and speak with the Frostmother.',t:'visit',loc:'hollyhearth',orn:15},
  {n:'Clear the Roads',d:'Defeat 20 creatures anywhere in the Frostbound Vale.',t:'kills',qty:20,orn:30},
  {n:'Unwound',d:'Stop the Toymaster in Tinker\'s Toyworks.',t:'boss',mon:'b_toymaster',orn:60,gift:2},
  {n:'Coal for Coalheart',d:'Take back the stolen gifts from Old Coalheart\'s Vault.',t:'boss',mon:'b_coalheart',orn:70,gift:2},
  {n:'The Stolen Star',d:'Climb the Aurora Spire and defeat the Aurora Queen.',t:'boss',mon:'b_aurora',orn:90,gift:3},
  {n:'Hero of the Long Night',d:'Fight the Yule Wyrm or Grimwinter when either appears in the Vale.',t:'world',orn:120,gift:3,cloak:1}];
const WINTER_BOUNTY_LOCS=['snowdrift','glimmerfrost','silverglass','candlewick','ruins','peaks','grimhollow'];
function wQuest(){const W=wState();W.q=W.q||0;W.qp=W.qp||0;return W;}
function wBounty(){const W=wState();const day=winterDayKey();if(!W.b||W.b.day!==day){let h=0;for(const c of day)h=(h*31+c.charCodeAt(0))|0;const loc=WINTER_BOUNTY_LOCS[Math.abs(h)%WINTER_BOUNTY_LOCS.length];W.b={day,loc,qty:12,prog:0,done:false,paid:false};}return W.b;}
function wAdvance(){const W=wQuest();const st=WINTER_CHAIN[W.q];if(!st)return;const P=S.P;
  wGive('w_ornament',st.orn);if(st.gift)wGive('w_gift',st.gift);let extra='';if(st.cloak){const g=wGear('w_cloak',P.level);P.inv.push(g);extra=` and ${itemName(g)}`;P.title='Hero of the Long Night';}
  log(`✦ The Frostmother: “${st.n}” complete! +${st.orn} ornaments${st.gift?`, ${st.gift} gift${st.gift>1?'s':''}`:''}${extra}.`,'epic');UI.toast(`Quest complete: ${st.n}`,'epic');if(typeof sfx==='function')sfx('levelup');
  W.q++;W.qp=0;checkAch();if(W.q<WINTER_CHAIN.length&&WINTER_CHAIN[W.q].t==='visit'&&P.loc===WINTER_CHAIN[W.q].loc)wAdvance();}
function winterVisit(loc){if(!winterOn()||!S||!S.P)return;const W=wQuest();const st=WINTER_CHAIN[W.q];if(st&&st.t==='visit'&&st.loc===loc)wAdvance();}
// called for every monster the player defeats
function winterKill(id,loc){if(!winterOn()||!S||!S.P||!LOCS[loc]||!LOCS[loc].ev)return;const W=wQuest();const st=WINTER_CHAIN[W.q];
  if(st&&st.t==='kills'){W.qp++;if(W.qp>=st.qty)wAdvance();}
  else if(st&&st.t==='boss'&&st.mon===id)wAdvance();
  const B=wBounty();if(!B.done&&loc===B.loc){B.prog++;if(B.prog>=B.qty){B.done=true;UI.toast(`Daily bounty done in ${LOCS[B.loc].n}! Claim it from the festival panel.`,'epic');}}}
function winterWorldBoss(id){if(!winterOn()||!S||!S.P)return;if(id!=='b_grimwinter'&&id!=='b_yulewyrm')return;const W=wQuest();if(id==='b_grimwinter')W.grim=1;const st=WINTER_CHAIN[W.q];if(st&&st.t==='world')wAdvance();checkAch();}
function claimBounty(){const B=wBounty();if(!B.done||B.paid)return;B.paid=true;wGive('w_ornament',25);wGive('w_gift',1);log(`Daily bounty in ${LOCS[B.loc].n} complete: +25 ornaments and a Festival Gift.`,'epic');UI.toast('Bounty claimed: 25 ✦ and a gift','epic');}
function winterQuestHtml(){const W=wQuest();const st=WINTER_CHAIN[W.q];const B=wBounty();
  const chain=st?`<div class="wq"><small>Quest ${W.q+1} of ${WINTER_CHAIN.length}</small><b>${E(st.n)}</b><span>${E(st.d)}${st.t==='kills'?` <em>(${W.qp}/${st.qty})</em>`:''}</span></div>`:`<div class="wq done"><b>✦ Hero of the Long Night</b><span>You finished the Frostmother's story. Thank you, hero.</span></div>`;
  const bounty=`<div class="wq"><small>Daily bounty</small><b>Hunt in ${E(LOCS[B.loc].n)}</b><span>Defeat ${B.qty} creatures there. <em>(${Math.min(B.prog,B.qty)}/${B.qty})</em></span>${B.done&&!B.paid?btn('Claim 25 ✦ + gift','wbounty','','tiny gilt'):B.paid?'<span class="good">Claimed. A new bounty tomorrow.</span>':''}</div>`;
  return `<div class="wqs">${chain}${bounty}</div>`;}

/* ---------- the Vale's own map ---------- */
function inVale(loc){return !!(LOCS[loc]&&LOCS[loc].rg==='winter');}
function renderValeMap(){const P=S.P;const L=Object.keys(LOCS).filter(l=>inVale(l));const here=inVale(P.loc);
  const lines=ROUTES.filter(([a,b])=>inVale(a)&&inVale(b)).map(([a,b])=>`<line x1="${LOCS[a].x}" y1="${LOCS[a].y}" x2="${LOCS[b].x}" y2="${LOCS[b].y}" class="route ${a===P.loc||b===P.loc?'near':''}"/>`).join('');
  const W=wQuest();const qst=WINTER_CHAIN[W.q];const B=wBounty();
  const nodes=L.map(l=>{const X=LOCS[l],t=isTown(l);const r=t?16:X.boss?14:12;const goal=(qst&&qst.t==='boss'&&LOCS[l].boss===qst.mon)||(!B.done&&B.loc===l);
    return `<g class="node vnode ${l===P.loc?'cur':''} ty-${X.ty} ${UI.mapSel===l?'sel':''}" data-a="mapsel" data-v="${l}" tabindex="0" role="button" aria-label="${E(X.n)}">${l===P.loc?`<circle cx="${X.x}" cy="${X.y}" r="${r+9}" class="here"/>`:''}${goal?`<circle cx="${X.x}" cy="${X.y}" r="${r+15}" class="goal"/>`:''}<circle cx="${X.x}" cy="${X.y}" r="${r}"/>${S.boss&&S.boss.loc===l?`<circle cx="${X.x}" cy="${X.y}" r="${r+8}" class="bossring"/>`:''}<text x="${X.x}" y="${X.y+r+32}" class="lbl">${E(X.n)}</text></g>`;}).join('');
  const sel=inVale(UI.mapSel)?UI.mapSel:here?P.loc:'hollyhearth';const X=LOCS[sel];const p=here&&sel!==P.loc?path(P.loc,sel):null;
  const pathLine=p?`<polyline class="jpath" points="${p.path.map(x=>LOCS[x].x+','+LOCS[x].y).join(' ')}"/>`:'';
  let go;if(sel===P.loc)go='<p class="good">You are here.</p>';else if(!here)go=sel==='hollyhearth'&&!P.dungeon&&isTown(P.loc)?btn('🛷 Take the festival sleigh (1h)','wsleigh','','gilt'):'<p class="hint">The Vale is reached by the festival sleigh from any town. It arrives in Hollyhearth.</p>';
  else go=GRAPH[P.loc][sel]!=null?btn(`Travel (${GRAPH[P.loc][sel]}h)`,'travel',sel,'gilt'):p?`<p>Route: ${p.path.map(x=>E(LOCS[x].n)).join(' → ')} (${p.hours}h)</p>${btn('Journey there','journey',sel,'gilt')}`:'';
  return `<svg viewBox="0 0 1376 768" class="map vale" role="img" aria-label="Map of the Frostbound Vale"><image href="${ART.base}xmap.webp" x="0" y="0" width="1376" height="768" preserveAspectRatio="xMidYMid slice"/>${lines}${pathLine}${nodes}</svg>
    <div class="mapinfo"><div class="vista sm" style="${valeVista(sel)}"></div><h3>${E(X.n)}</h3><p>${E(X.d)}</p><p><small>${U.cap(X.ty)}${!isTown(sel)?' · creatures match your level':''}${X.boss?` · boss: ${E(MONSTERS[X.boss].n)}`:''}</small></p>${go}</div>`;}
function valeVista(l){const X=LOCS[l];if(l==='hollyhearth')return `background-image:url(${ART.base}winter.webp);background-size:cover;background-position:50% 55%`;
  return `background-image:url(${ART.base}xmap.webp);background-size:420%;background-position:${(X.x/1376*100).toFixed(1)}% ${(X.y/768*100).toFixed(1)}%`;}
