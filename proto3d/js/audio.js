// Music (the 2D game's orchestral tracks) and small synthesized sound effects.
export const AUD={ctx:null,music:true,sfx:true,tracks:{},cur:null,vol:.5};
const TR={title:'assets/music/mus_title.mp3',wild:'assets/music/mus_wild.mp3',combat:'assets/music/mus_combat.mp3',boss:'assets/music/mus_boss.mp3'};
function el(k){if(!AUD.tracks[k]){const a=new Audio(TR[k]);a.loop=true;a.volume=0;a.preload='auto';AUD.tracks[k]=a;}return AUD.tracks[k];}
export function unlock(){try{if(!AUD.ctx)AUD.ctx=new (window.AudioContext||window.webkitAudioContext)();if(AUD.ctx.state!=='running')AUD.ctx.resume();}catch(e){}
  if(AUD.music&&AUD.cur){const a=el(AUD.cur);if(a.paused)a.play().catch(()=>{});}}
for(const ev of ['pointerup','touchend','keydown','click'])addEventListener(ev,unlock,{passive:true,capture:true});
export function music(k){AUD.cur=k;if(!AUD.music)return;const a=el(k);if(a.paused)a.play().catch(()=>{});}
setInterval(()=>{for(const k in AUD.tracks){const a=AUD.tracks[k];const target=AUD.music&&k===AUD.cur&&!document.hidden?AUD.vol:0;a.volume=Math.max(0,Math.min(1,a.volume+(target-a.volume)*.12));if(target===0&&a.volume<.01&&!a.paused)a.pause();
  if(target>0&&a.paused&&AUD.ctx&&AUD.ctx.state==='running')a.play().catch(()=>{});}},100);
document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const k in AUD.tracks)AUD.tracks[k].pause();});
function noise(dur){const c=AUD.ctx,b=c.createBuffer(1,Math.max(1,c.sampleRate*dur|0),c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;return s;}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec);}
export function sfx(kind){if(!AUD.sfx||!AUD.ctx||AUD.ctx.state!=='running')return;const c=AUD.ctx,t=c.currentTime,out=c.destination;
  const tone=(type,f0,f1,dur,vol=.2,delay=0)=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t+delay);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+delay+dur);env(g,t+delay,.005,vol,dur);o.connect(g).connect(out);o.start(t+delay);o.stop(t+delay+dur+.05);};
  const whoosh=(f,dur,vol=.25,q=1.2,delay=0)=>{const n=noise(dur),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.Q.value=q;bp.frequency.setValueAtTime(f,t+delay);bp.frequency.exponentialRampToValueAtTime(f*2.2,t+delay+dur);env(g,t+delay,.02,vol,dur);n.connect(bp).connect(g).connect(out);n.start(t+delay);};
  switch(kind){
    case 'swing':whoosh(700,.22,.22);break;
    case 'hit':whoosh(300,.12,.35,.8);tone('sine',140,50,.15,.35);break;
    case 'crit':whoosh(400,.18,.4,.8);tone('square',220,60,.2,.18);tone('sine',90,40,.3,.4);break;
    case 'block':tone('triangle',900,600,.12,.2);tone('triangle',1400,900,.1,.12);break;
    case 'fire':whoosh(500,.5,.3,.6);tone('sawtooth',120,60,.4,.06);break;
    case 'boom':whoosh(150,.9,.6,.5);tone('sine',70,28,.8,.6);break;
    case 'frost':whoosh(2500,.5,.2,3);tone('sine',1800,2400,.3,.06);tone('sine',2600,3200,.3,.05,.08);break;
    case 'cast':tone('sine',440,880,.35,.08);tone('sine',660,1320,.35,.05,.05);break;
    case 'heal':[523,659,784,1046].forEach((f,i)=>tone('sine',f,f,.5,.09,i*.07));break;
    case 'level':[392,523,659,784,1046].forEach((f,i)=>tone('triangle',f,f,.6,.12,i*.09));break;
    case 'death':tone('sawtooth',220,55,.9,.12);whoosh(200,.7,.2,.5);break;
    case 'bone':[0,.05,.11].forEach(d=>tone('square',300+Math.random()*300,120,.06,.08,d));break;
    case 'roar':whoosh(200,.6,.4,.7);tone('sawtooth',110,70,.6,.12);break;
    case 'shadow':whoosh(300,.4,.25,1.5);tone('sine',180,90,.4,.12);break;
    case 'loot':[880,1175,1568].forEach((f,i)=>tone('sine',f,f,.25,.07,i*.06));break;
    case 'click':tone('sine',800,600,.05,.06);break;
  }}
