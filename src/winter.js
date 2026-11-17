/* ETERNAL REALMS — "The Long Night", the winter festival (1 December – 6 January).
   Switches itself on by the real calendar date. Adds the Hollyhearth region (village, Glimmerfrost Woods,
   Coalheart's Vault), festive monsters everywhere, Starlight Ornaments, gift boxes, a daily gift, a festival
   shop and limited "Long Night 2026" equipment. When the festival ends the region closes again; everything
   players earned stays theirs.
   This file is loaded before engine.js (so the new places join the travel graph); runtime functions use U lazily. */
'use strict';
const WINTER={id:'longnight',n:'The Long Night',tag:'The Long Night 2026',start:[2026,11,1],end:[2027,0,6],home:'hollyhearth',
  locs:['hollyhearth','glimmerfrost','coalvault']};
function winterNow(){return (typeof window!=='undefined'&&window.__WINTER_NOW)||Date.now();}
// test switch for previews: ?winter in the address, or localStorage er_winter=1
function winterForced(){try{return typeof location!=='undefined'&&(/[?&]winter\b/.test(location.search)||localStorage.getItem('er_winter')==='1');}catch(e){return false;}}
function winterOn(){if(winterForced())return true;const n=new Date(winterNow());const s=new Date(...WINTER.start,0,0,0),e=new Date(...WINTER.end,23,59,59);return n>=s&&n<=e;}
function winterDaysLeft(){const e=new Date(...WINTER.end,23,59,59);return Math.max(0,Math.ceil((e-new Date(winterNow()))/86400000));}
function winterDayKey(){const n=new Date(winterNow());return `${n.getFullYear()}-${n.getMonth()+1}-${n.getDate()}`;}
function locOpen(l){const L=LOCS[l];return !L||!L.ev||winterOn();}

/* ---------- places ---------- */
Object.assign(LOCS,{
  hollyhearth:{n:'Hollyhearth',ty:'village',ev:'winter',x:785,y:170,f:null,lv:[1,100],sv:['inn','shop','temple','festival','market'],mon:[],res:[['w_holly','herbalism']],
    d:'A snowbound village that only appears on the maps during the Long Night. Lanterns hang from every eave, and the Frostmother hands out gifts beneath the great tree.',
    feat:['The great lantern tree','The Frostmother\'s sleigh','A frozen wishing well']},
  glimmerfrost:{n:'Glimmerfrost Woods',ty:'wild',ev:'winter',x:872,y:112,f:null,lv:[3,95],mon:['w_ginger','w_imp','w_wolf','w_wraith','w_nut','w_deer','w_snowman','w_gremlin'],
    res:[['w_holly','herbalism'],['w_yulelog','woodcutting'],['w_tinsel','herbalism']],
    d:'Pines heavy with snow and stolen tinsel. Something has woken the old toys and the hungry things of winter. Its creatures match the strength of whoever walks in.',
    feat:['A ring of melted snowmen','Gingerbread crumbs leading off the path','A sleigh overturned in the drifts']},
  coalvault:{n:'Coalheart\'s Vault',ty:'dungeon',ev:'winter',x:885,y:228,f:null,lv:[10,95],mon:['w_gremlin','w_nut','w_mimic','w_knight','w_serpent','w_star'],res:[['w_coal','mining']],
    boss:'b_coalheart',floors:3,scale:1,
    d:'A black stone vault where Old Coalheart hoards every gift he has ever stolen. Its guardians grow as strong as the thieves who come for them.',
    feat:['Mountains of unopened gifts','A furnace that burns stolen wishes','Cages of tin soldiers']}
});
// closed outside the festival: every system that skips hidden places (quests, invasions, treasure, travel) skips these too
for(const l of WINTER.locs)Object.defineProperty(LOCS[l],'hid',{get(){return !winterOn();},enumerable:true});
ROUTES.push(['hollyhearth','khazgard',3],['hollyhearth','deepforge',2],['hollyhearth','glimmerfrost',1],['glimmerfrost','coalvault',1],['hollyhearth','coalvault',2]);
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
function winterSwap(loc,id){if(!winterOn()||isTown(loc)||LOCS[loc].ev||!U.chance(0.08))return id;return U.pick(['w_imp','w_gremlin','w_snowman','w_mimic','w_wolf']);}

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
    <p>Snow has fallen on the Realms. In <b>Hollyhearth</b> the Frostmother trades Starlight Ornaments for limited gear, festive creatures roam Glimmerfrost Woods, and Old Coalheart guards his vault of stolen gifts.</p>
    <p class="wstat"><span class="orn">${U.fmt(orn)} ✦</span> ornaments${invCount(P,'w_gift')?` · <b>${invCount(P,'w_gift')}</b> gift${invCount(P,'w_gift')>1?'s':''} to open`:''}</p>
    <div class="row wrap">${winterGiftReady()?btn('🎁 Claim today\'s gift','wgift','','gilt'):'<span class="hint">Today\'s gift claimed. Come back tomorrow.</span>'}
    ${canSleigh?btn('🛷 Festival sleigh to Hollyhearth','wsleigh','',''):''}${P.loc==='hollyhearth'&&P.wPrev&&LOCS[P.wPrev]?btn(`🛷 Sleigh back to ${LOCS[P.wPrev].n}`,'wsleighback',''):''}
    ${invCount(P,'w_gift')?btn('Open a gift','wopen','',''):''}</div></div></section>`;}
function winterSleigh(back){const P=S.P;if(UI.inCombat()||P.dungeon)return;const to=back?P.wPrev:'hollyhearth';if(!to||!LOCS[to])return;if(!back)P.wPrev=P.loc;
  spend(60);P.loc=to;if(!P.explored.includes(to))P.explored.push(to);log(back?`The festival sleigh drops you back in ${LOCS[to].n}.`:'Bells jingle through the snow as the festival sleigh carries you to Hollyhearth.','good');UI.tab='world';window.scrollTo(0,0);}
// after the festival: nobody is left stranded in a region that has closed
function winterCleanup(){if(!S||!S.P||winterOn())return;const P=S.P;if(LOCS[P.loc]&&LOCS[P.loc].ev){P.loc=P.wPrev&&LOCS[P.wPrev]&&!LOCS[P.wPrev].ev?P.wPrev:'khazgard';P.dungeon=null;}}

/* ---------- actions ---------- */
function winterActs(){Object.assign(ACT,{
  wgift(){claimDailyGift();},
  wopen(){const P=S.P;const i=P.inv.findIndex(x=>x.k==='w_gift');if(i>=0)useItem(i);},
  wsleigh(){winterSleigh(false);},wsleighback(){winterSleigh(true);},
  wbuy(i){winterBuy(i);if(typeof refreshModal==='function')refreshModal();}});}
