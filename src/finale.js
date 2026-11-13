/* ETERNAL REALMS — the final battle, fully staged: Sunfall, the shatter, death, the glitch, rebirth, and the ending */
'use strict';
const FIN={skip:false,timers:[]};
function fwait(ms){return new Promise(r=>{if(FIN.skip)return r();const id=setTimeout(r,ms);FIN.timers.push(id);FIN.wake=r;});}
function el(tag,cls,html){const d=document.createElement(tag);if(cls)d.className=cls;if(html!=null)d.innerHTML=html;return d;}
function lettersHtml(txt,cls,step=0.07){return [...txt].map((c,i)=>`<span class="${cls}" style="animation-delay:${(i*step).toFixed(2)}s">${c===' '?'&nbsp;':E(c)}</span>`).join('');}

/* ---------- ambient staging during the fight ---------- */
function finaleAmbience(){const cb=$('#combat');if(!cb||!C||!C.opts||!C.opts.final){if(cb)cb.classList.remove('final1','final2');return;}
  cb.classList.toggle('final1',C.finalPhase!==2&&!C.ended);cb.classList.toggle('final2',C.finalPhase===2);
  if(C.finalPhase===2&&!FIN.emb){FIN.emb=setInterval(()=>{if(!C||C.closed||C.finalPhase!==2){clearInterval(FIN.emb);FIN.emb=0;return;}if(fxReduced())return;
    for(let k=0;k<3;k++)fxAdd({x:Math.random()*innerWidth,y:innerHeight+6,vx:(Math.random()-0.5)*0.6,vy:-1.4-Math.random()*1.8,c:Math.random()<0.5?'#ffd36a':'#ffb35a',s:1.4+Math.random()*2,life:2600,g:-0.005,drag:0.995});},120);}
  if(C.finalPhase!==2&&!C.ended&&!FIN.storm){FIN.storm=setInterval(()=>{if(!C||C.closed||C.finalPhase===2||C.ended){clearInterval(FIN.storm);FIN.storm=0;return;}if(Math.random()<0.35&&!fxReduced()){flashScreen('#ff3a2a18');const b=cb.querySelector('.actor.boss');if(b){const [x,y]=centerOf(b);fxAdd({k:'bolt',x:x+(Math.random()-0.5)*300,y:y+60,c:'#ff8a6a',life:220});}}},1600);}}

/* ---------- the ending ---------- */
async function finalEnding(){const P=S.P;const ov=el('div','');ov.id='ending';ov.innerHTML=`<div class="sky"></div><div class="sunrise"></div><div class="etext"><p class="eyebrow">The Sun-Engine sleeps</p><h1 class="logo"><span>Victory</span></h1><div class="epi" id="epi"></div><div id="ebtn"></div></div>`;
  document.body.appendChild(ov);FIN.ending=true;audForce('title');confetti();setTimeout(confetti,700);levelBurst();
  const lines=[`The Shattered One comes apart into light, and the torn sky over the eastern wastes closes like a healing wound.`,
    `In Valeria, in Khazgard, in the web-lit halls of Duskhaven, five hundred adventurers look up at the same quiet sky.`,
    `Nobody chose ${P.name}. ${P.name} chose this.`,`The Realms go on. So does your story.`];
  const ep=document.getElementById('epi');for(const l of lines){const p=el('p','');ep.appendChild(p);await typeLine(p,l,fxReduced()?5:32);await new Promise(r=>setTimeout(r,700));}
  document.getElementById('ebtn').innerHTML=`<p class="thanks">Thank you for playing Eternal Realms.</p><button class="b gilt big" id="eclose">Continue your adventure</button>`;
  document.getElementById('eclose').onclick=()=>{FIN.ending=false;ov.classList.add('out');setTimeout(()=>ov.remove(),900);};}
function typeLine(p,txt,ms){return new Promise(res=>{let i=0;const t=()=>{p.textContent=txt.slice(0,++i);if(i<txt.length)setTimeout(t,ms);else res();};t();});}
BUS.on((t,d)=>{if(t==='final_win')setTimeout(finalEnding,1800);});
