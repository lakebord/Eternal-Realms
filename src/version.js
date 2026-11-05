/* ETERNAL REALMS — version number and patch notes.
   On every release: bump GAME_VERSION and add an entry at the TOP of PATCH_NOTES (see docs/RELEASING.md).
   Returning players see a "What's new" popup once per new version; brand-new players do not. */
'use strict';
const GAME_VERSION='1.0.0';
const PATCH_NOTES=[
  {v:'1.0.0',date:'2026-11-05',title:'The Realms open',notes:[
    'Eternal Realms is live on its own website, with real accounts: sign in with email or play as a guest.',
    'Cloud saves, live chat, the leaderboard, parcels and co-op now run on our own servers.',
    'Combat is properly turn-based: every attack gets its own moment, and the battle header shows whose turn it is.',
    'Smoother music on phones.',
    'HP bars visibly drain when you take damage.',
    'The final boss is a real fight from start to finish.'
  ]}
];
function verCmp(a,b){const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1;}return 0;}
function patchNotesHtml(list,heading){return `<h2>${E(heading)}</h2>${list.map(p=>`<section class="patch"><h3>v${E(p.v)} <small>${E(p.title||'')}${p.date?' · '+E(p.date):''}</small></h3><ul>${p.notes.map(n=>`<li>${E(n)}</li>`).join('')}</ul></section>`).join('')}${btn('Continue','close','','gilt')}`;}
// called once when the player enters the game
function checkPatchNotes(){let seen=null;try{seen=localStorage.getItem('er_seen_ver');localStorage.setItem('er_seen_ver',GAME_VERSION);}catch(e){return;}
  if(!seen||verCmp(GAME_VERSION,seen)<=0)return;const fresh=PATCH_NOTES.filter(p=>verCmp(p.v,seen)>0);if(!fresh.length)return;
  openModal(patchNotesHtml(fresh,`What's new in v${GAME_VERSION}`),'patch');}
