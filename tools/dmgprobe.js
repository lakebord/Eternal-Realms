// Damage probe: for each level, how many basic hits a hero needs to kill a zone mob / dungeon boss,
// and how many of their hits the hero survives. "built" = points spent + level gear, "casual" = points unspent, gear 60% of level.
const fs=require('fs'),vm=require('vm'),path=require('path');
const files=['data','expansion','classes2','engine','sim','player','combat','chat','chat2','events','net'];
const src=files.map(f=>fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8')).join('\n;\n');
const ctx={performance,console,Math,Date,JSON,Object,Array,String,Number,Set,Map,Promise,setTimeout};vm.createContext(ctx);
vm.runInContext(src+`\n;if(typeof rarityName==='undefined')var rarityName=()=>'';if(typeof E==='undefined')var E=s=>String(s);\n;this.G={newWorld,createPlayer,setP:p=>S.P=p,stats,makeMonster,makeGear,CLASSES,CLASS_PRIO,ITEM_BASES,LOCS,MONSTERS,dirty:p=>p._st=null,actorFromChar,actorFromMon,damage,kConst};`,ctx);
const G=ctx.G;G.newWorld(7);
function hero(cls,L,casual){const P=G.createPlayer({user:'B',name:'B',race:'human',cls,bg:'commoner',diff:'normal',start:'brookhollow'});G.setP(P);P.level=L;const C=G.CLASSES[cls];const g=C.growth,pr=G.CLASS_PRIO[cls];
  for(let i=1;i<L;i++){for(const k in g)P.attr[k]+=g[k];if(!casual){P.attr[pr[0]]++;P.attr[pr[1]]++;}}
  const gl=Math.max(1,Math.round(casual?L*0.6:L-1)),r=casual?0:(L<30?1:2);P.equip={weapon:G.makeGear(C.weapons.find(w=>G.ITEM_BASES[w]),gl,r)};for(const sl of ['head','chest','legs','hands','feet'])P.equip[sl]=G.makeGear(`${sl}_${C.armor}`,gl,r);
  for(const k in C.mastery){P.mastery[k]=P.mastery[k]||{lv:0,xp:0};P.mastery[k].lv=Math.min(100,C.mastery[k]+Math.round(L*(casual?0.4:0.7)));}
  if(L>=20&&!casual)P.tiers[cls]=L>=50?2:1;G.dirty(P);const st=G.stats(P);P.hp=st.mhp;P.mp=st.mmp;P.sp=st.msp;return P;}
const avg=(a,d,o)=>{a=Object.assign({},a,{row:'front',ranged:true});d=Object.assign({},d,{row:'front'});o=Object.assign({ranged:true},o);let s=0;for(let i=0;i<60;i++)s+=G.damage(a,d,o).d;return s/60;};
const ZONE={1:'greenmarch',5:'whisperwood',10:'watchtower',20:'frostpeak',30:'mire',45:'citadel',60:'necropolis',80:'spire'};
for(const casual of [0,1]){console.log(`\n=== ${casual?'CASUAL':'BUILT'} hero ===  [hits to kill mob / mob hits to kill hero]   boss: [hits to kill / boss hits to kill hero]  (hero dmg, mob dmg, hero hp, mob hp)`);
  for(const cls of ['warrior','mage','rogue','cleric']){let row=cls.padEnd(9);for(const L of [1,5,10,20,30,45,60,80]){const P=hero(cls,L,casual);const a=G.actorFromChar(P,'a');const z=G.LOCS[ZONE[L]];const lv=Math.min(Math.max(L,z.lv[0]),z.lv[1]);
      const m=G.actorFromMon(G.makeMonster(z.mon[0],lv));const mag=a.matk>a.patk;const hd=avg(a,m,{kind:mag?'mag':'phys'});const md=avg(Object.assign({},m,{patk:m.atk}),a,{kind:'phys'});
      row+=` L${L}:${(m.mhp/hd).toFixed(1)}/${(a.mhp/md).toFixed(1)}(${Math.round(hd)},${Math.round(md)},${a.mhp},${m.mhp})`;}console.log(row);}
  console.log('bosses:');for(const loc of ['mine','warrens','grimward','undervault','citadel','tomb','necropolis','spire']){const D=G.LOCS[loc];const L=D.lv[1];let row=(loc+' L'+L).padEnd(16);for(const cls of ['warrior','mage']){const P=hero(cls,L,casual);const a=G.actorFromChar(P,'a');const b=G.actorFromMon(G.makeMonster(D.boss,L+1));const mag=a.matk>a.patk;const hd=avg(a,b,{kind:mag?'mag':'phys'});const bd=avg(Object.assign({},b,{patk:b.atk}),a,{kind:'phys'});
      row+=` ${cls}:${(b.mhp/hd).toFixed(0)}/${(a.mhp/bd).toFixed(1)}(${Math.round(hd)},${Math.round(bd)},${a.mhp},${b.mhp})`;}console.log(row);}}
