/* ETERNAL REALMS — recorded soundtrack (orchestral dark-fantasy tracks in assets/mus_*.mp3).
   Each mood maps to a track; tracks cross-fade and remember their place. While a recorded track is playing the
   built-in synth sequencer stays quiet (AUD.rec). If a file can't load, the synth music carries on as before. */
'use strict';
const TRK={map:{title:'title',town:'town',wild:'wild',night:'wild',dungeon:'dungeon',combat:'combat',boss:'boss',final1:'boss',final2:'boss'},gain:{title:.9,town:.8,wild:.9,dungeon:.95,combat:.8,boss:.8},el:{},bad:{},cur:null,vol:{}};
function trkEl(k){if(TRK.el[k]||TRK.bad[k])return TRK.el[k];try{const a=new Audio();a.loop=true;a.preload='auto';a.volume=0;a.addEventListener('error',()=>{TRK.bad[k]=1;delete TRK.el[k];if(TRK.cur===k)TRK.cur=null;});a.src=ART.base+'mus_'+k+'.mp3';TRK.el[k]=a;TRK.vol[k]=0;return a;}catch(e){TRK.bad[k]=1;return null;}}
function trkTick(){const want=AUD.on?(TRK.map[AUD.want]||null):null;const k=want&&!TRK.bad[want]?want:null;
  if(k&&k!==TRK.cur){const a=trkEl(k);if(a){TRK.cur=k;const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{});}}else if(!k)TRK.cur=null;
  for(const n in TRK.el){const a=TRK.el[n];const playing=n===TRK.cur&&!a.paused&&a.readyState>=2;const target=playing?AUD.music*(TRK.gain[n]||.85):0;const v=TRK.vol[n]||0;const nv=Math.abs(target-v)<0.02?target:v+(target-v)*0.16;TRK.vol[n]=nv;try{a.volume=Math.max(0,Math.min(1,nv));}catch(e){}
    if(n!==TRK.cur&&nv<=0.01&&!a.paused)a.pause();if(n===TRK.cur&&a.paused&&AUD.on){const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{});}}
  const cur=TRK.cur&&TRK.el[TRK.cur];AUD.rec=!!(cur&&!cur.paused&&cur.readyState>=2);
  if(AUD.mus&&AUD.ctx){const g=AUD.rec?0.0001:AUD.music*0.5;if(TRK.synthG!==g){TRK.synthG=g;try{AUD.mus.gain.setTargetAtTime(g,AUD.ctx.currentTime,0.25);}catch(e){}}}}
setInterval(trkTick,120);
