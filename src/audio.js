/* ETERNAL REALMS — generative music & sound effects (Web Audio, no files).
   Moods: title, town, wild, night, dungeon, combat, boss. Starts only after a tap (browser rule). */
'use strict';
const AUD={ctx:null,on:false,music:0.55,sfx:0.7,mood:null,want:'title',bar:0,step:0,next:0,timer:null,lastSfx:{},rng:U.seeded(9)};
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const SCALES={dorian:[0,2,3,5,7,9,10],minor:[0,2,3,5,7,8,10],major:[0,2,4,5,7,9,11],mixo:[0,2,4,5,7,9,10],phryg:[0,1,3,5,7,8,10],harm:[0,2,3,5,7,8,11]};
const MOODS={
  title:{bpm:70,root:50,sc:'dorian',prog:[0,5,3,4],lead:'flute',arp:'harp',pad:1,bass:1,drums:0,dens:0.45},
  town:{bpm:94,root:55,sc:'major',prog:[0,3,4,0,5,3,4,4],lead:'recorder',arp:'lute',pad:0,bass:1,drums:0.3,dens:0.5},
  wild:{bpm:76,root:52,sc:'dorian',prog:[0,6,3,4],lead:'flute',arp:'harp',pad:1,bass:1,drums:0,dens:0.35},
  night:{bpm:62,root:50,sc:'minor',prog:[0,5,3,6],lead:'flute',arp:'bell',pad:1,bass:0,drums:0,dens:0.25},
  dungeon:{bpm:58,root:45,sc:'phryg',prog:[0,1,0,6],lead:'bell',arp:'bell',pad:1,bass:1,drums:0,dens:0.2,drone:1},
  combat:{bpm:134,root:52,sc:'harm',prog:[0,5,3,4],lead:'brass',arp:'pluck',pad:0,bass:2,drums:1,dens:0.6},
  // original compositions for the final battle (fixed, hand-written note sequences; 0 = rest)
  final1:{name:'The Sun Will Not Rise',bpm:162,seq:1,lead:'chip',roots:[38,46,48,45],drums:2,
    mel:[69,0,74,0,77,76,74,0,72,0,74,0,69,0,0,0, 77,0,74,0,70,0,72,74,0,77,0,79,0,77,0,0, 76,0,79,0,84,0,82,81,0,79,0,76,0,72,0,0, 73,76,81,0,79,77,76,0,73,0,76,0,69,0,0,0,
         81,0,86,0,89,88,86,0,84,0,86,0,81,0,84,86, 89,0,86,0,82,0,84,86,0,89,0,91,0,89,86,0, 88,0,91,0,96,0,94,93,0,91,0,88,0,84,0,0, 85,88,93,0,91,89,88,0,85,88,91,93,94,0,93,0]},
  final2:{name:'Unbroken',bpm:150,seq:1,lead:'brass',roots:[38,45,47,43],drums:2,choir:1,major:1,
    mel:[74,0,0,78,81,0,0,0,78,0,76,0,74,0,76,0, 76,0,0,81,85,0,0,0,83,0,81,0,76,0,78,0, 78,0,0,83,86,0,0,0,85,0,83,0,81,0,78,0, 79,0,0,83,86,0,85,83,81,0,79,0,78,0,76,0,
         86,0,85,0,83,0,81,0,83,0,85,0,86,0,0,0, 88,0,86,0,85,0,83,0,85,0,86,0,88,0,0,0, 90,0,88,0,86,0,85,0,86,0,88,0,90,0,93,0, 91,0,0,0,90,0,0,0,88,0,86,0,85,0,86,0]},
  silence:{bpm:60,silent:1},
  boss:{bpm:148,root:50,sc:'harm',prog:[0,1,5,4],lead:'brass',arp:'pluck',pad:1,bass:2,drums:2,dens:0.75,choir:1}
};
function audInit(){if(AUD.ctx)return true;try{const AC=window.AudioContext||window.webkitAudioContext;let C_;
  // 'playback' asks for a bigger audio buffer: a hair more latency, far fewer crackles/dropouts on phones
  try{C_=new AC({latencyHint:'playback'});}catch(e){C_=new AC();}AUD.ctx=C_;AUD.lite=matchMedia('(pointer:coarse)').matches||(navigator.hardwareConcurrency||8)<=4;
  AUD.master=C_.createGain();AUD.master.gain.value=0.8;AUD.master.connect(C_.destination);
  // gentle generated reverb
  const len=Math.round(C_.sampleRate*(AUD.lite?1.1:1.8)),buf=C_.createBuffer(2,len,C_.sampleRate);for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
  AUD.verb=C_.createConvolver();AUD.verb.buffer=buf;AUD.verbGain=C_.createGain();AUD.verbGain.gain.value=0.32;AUD.verb.connect(AUD.verbGain);AUD.verbGain.connect(AUD.master);
  AUD.mus=C_.createGain();AUD.mus.gain.value=AUD.music*0.5;AUD.musF=C_.createBiquadFilter();AUD.musF.type='lowpass';AUD.musF.frequency.value=5200;AUD.mus.connect(AUD.musF);AUD.musF.connect(AUD.master);AUD.musF.connect(AUD.verb);
  AUD.fx=C_.createGain();AUD.fx.gain.value=AUD.sfx*0.6;AUD.fx.connect(AUD.master);AUD.fx.connect(AUD.verb);
  AUD.noise=C_.createBuffer(1,C_.sampleRate,C_.sampleRate);const nd=AUD.noise.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;return true;}catch(e){return false;}}
function audStart(){if(!audInit())return;AUD.ctx.resume();AUD.on=true;if(!AUD.timer){AUD.next=AUD.ctx.currentTime+0.1;AUD.timer=setInterval(audTick,50);}try{localStorage.setItem('er_sound','1');}catch(e){}}
function audStop(){AUD.on=false;if(AUD.ctx)AUD.ctx.suspend();try{localStorage.setItem('er_sound','0');}catch(e){}}
function audSetVol(m,s){if(m!=null)AUD.music=m;if(s!=null)AUD.sfx=s;if(AUD.mus)AUD.mus.gain.setTargetAtTime(AUD.music*0.5,AUD.ctx.currentTime,0.2);if(AUD.fx)AUD.fx.gain.setTargetAtTime(AUD.sfx*0.6,AUD.ctx.currentTime,0.1);try{localStorage.setItem('er_vol',JSON.stringify([AUD.music,AUD.sfx]));}catch(e){}}
function audMood(m){AUD.want=m;}
// each stretch of music plays into its own channel; switching moods drops whatever was queued ahead for the old one
function audBus(){if(!AUD.bus&&AUD.ctx&&AUD.mus){AUD.bus=AUD.ctx.createGain();AUD.bus.connect(AUD.mus);}return AUD.bus||AUD.mus;}
function audNewBus(fade){const C_=AUD.ctx;if(!C_)return;const old=AUD.bus;if(old){const t=C_.currentTime;old.gain.cancelScheduledValues(t);old.gain.setValueAtTime(old.gain.value,t);old.gain.linearRampToValueAtTime(0,t+(fade||0.03));setTimeout(()=>{try{old.disconnect();}catch(e){}},((fade||0.03)+0.2)*1000);}AUD.bus=null;audBus();}
/* ---------- instruments ---------- */
function env(g,t,a,d,s,r,peak){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(Math.max(0.0001,peak*s),t+a+d);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d+r);}
function tone(type,freq,t,dur,vol,out,opt={}){const C_=AUD.ctx;const o=C_.createOscillator(),g=C_.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(opt.det)o.detune.value=opt.det;
  if(opt.vib){const l=C_.createOscillator(),lg=C_.createGain();l.frequency.value=5;lg.gain.value=freq*0.006;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+0.6);}
  if(opt.slide)o.frequency.exponentialRampToValueAtTime(opt.slide,t+dur);
  let node=o;if(opt.lp){const f=C_.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(opt.lp,t);if(opt.lpEnd)f.frequency.exponentialRampToValueAtTime(opt.lpEnd,t+dur);f.Q.value=opt.q||0.7;o.connect(f);node=f;}
  node.connect(g);g.connect(out);env(g,t,opt.a||0.005,opt.d||dur*0.3,opt.s!=null?opt.s:0.4,opt.r||dur*0.7,vol);o.start(t);o.stop(t+(opt.a||0.005)+(opt.d||dur*0.3)+(opt.r||dur*0.7)+0.05);}
function noiseHit(t,dur,vol,out,f1,f2,type='bandpass',q=1){const C_=AUD.ctx;const s=C_.createBufferSource();s.buffer=AUD.noise;const f=C_.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(f1,t);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+dur);f.Q.value=q;
  const g=C_.createGain();s.connect(f);f.connect(g);g.connect(out);env(g,t,0.002,dur*0.4,0.3,dur*0.6,vol);s.start(t,Math.random()*0.5);s.stop(t+dur+0.05);}
const INST={
  chip:(f,t,d,v,o)=>{tone('square',f,t,d,v*0.2,o,{d:0.04,s:0.55,r:Math.min(0.12,d),lp:5200});tone('square',f*2,t,d,v*0.05,o,{d:0.03,s:0.3,r:0.08,lp:6000,det:6});},
  harp:(f,t,d,v,o)=>{tone('triangle',f,t,d,v*0.55,o,{d:0.05,s:0.35,r:d*1.6,lp:3200});tone('sine',f*2,t,d,v*0.12,o,{d:0.03,s:0.2,r:d});},
  lute:(f,t,d,v,o)=>{tone('sawtooth',f,t,d,v*0.28,o,{d:0.04,s:0.2,r:d*0.9,lp:2400,lpEnd:600,q:2});tone('triangle',f,t,d,v*0.3,o,{d:0.05,s:0.25,r:d*0.8});},
  pluck:(f,t,d,v,o)=>tone('square',f,t,d,v*0.18,o,{d:0.03,s:0.15,r:d*0.5,lp:2200,lpEnd:500,q:3}),
  bell:(f,t,d,v,o)=>{tone('sine',f,t,d,v*0.4,o,{d:0.02,s:0.3,r:d*2.5});tone('sine',f*2.76,t,d,v*0.12,o,{d:0.01,s:0.1,r:d*1.2});},
  flute:(f,t,d,v,o)=>{tone('sine',f,t,d,v*0.42,o,{a:0.06,d:0.1,s:0.75,r:0.25,vib:1});noiseHit(t,0.08,v*0.03,o,f*2,null,'bandpass',4);},
  recorder:(f,t,d,v,o)=>tone('triangle',f,t,d,v*0.4,o,{a:0.03,d:0.08,s:0.7,r:0.18,vib:1}),
  brass:(f,t,d,v,o)=>{tone('sawtooth',f,t,d,v*0.22,o,{a:0.03,d:0.15,s:0.6,r:0.2,lp:1500,lpEnd:900});tone('sawtooth',f,t,d,v*0.18,o,{a:0.03,d:0.15,s:0.6,r:0.2,lp:1400,det:9});},
  pad:(f,t,d,v,o)=>{for(const det of (AUD.lite?[-6,6]:[-8,0,8]))tone('sawtooth',f,t,d,v*(AUD.lite?0.095:0.07),o,{a:d*0.35,d:d*0.2,s:0.8,r:d*0.6,lp:900,det});},
  choir:(f,t,d,v,o)=>{for(const det of (AUD.lite?[0]:[-6,6]))tone('triangle',f,t,d,v*(AUD.lite?0.2:0.12),o,{a:d*0.3,d:0.2,s:0.85,r:d*0.5,vib:!AUD.lite,det});},
  bass:(f,t,d,v,o)=>tone('triangle',f,t,d,v*0.55,o,{d:0.08,s:0.6,r:0.2,lp:700}),
  kick:(t,v,o)=>tone('sine',110,t,0.18,v*0.9,o,{slide:40,d:0.05,s:0.3,r:0.15}),
  snare:(t,v,o)=>{noiseHit(t,0.14,v*0.35,o,1800,900,'bandpass',0.8);tone('triangle',190,t,0.08,v*0.2,o,{d:0.03,s:0.2,r:0.05});},
  tom:(t,v,o)=>tone('sine',160,t,0.22,v*0.5,o,{slide:80,d:0.06,s:0.3,r:0.15}),
  hat:(t,v,o)=>noiseHit(t,0.04,v*0.12,o,8000,null,'highpass',1)
};
/* ---------- sequencer ---------- */
function audTick(){const C_=AUD.ctx;if(!C_||!AUD.on)return;
  if(AUD.want!==AUD.mood){if(!AUD.fadeT){AUD.fadeT=C_.currentTime||0.001;AUD.mus.gain.setTargetAtTime(0.0001,C_.currentTime,0.35);}else if(C_.currentTime-AUD.fadeT>1.1){audNewBus(0.05);AUD.mood=AUD.want;AUD.fadeT=0;AUD.bar=0;AUD.step=0;AUD.next=C_.currentTime+0.05;AUD.mus.gain.setTargetAtTime(AUD.music*0.5,C_.currentTime,0.6);}}
  if(AUD.fadeT&&AUD.want===AUD.mood){AUD.fadeT=0;AUD.mus.gain.setTargetAtTime(AUD.music*0.5,C_.currentTime,0.4);}
  const M=MOODS[AUD.mood];if(!M||AUD.fadeT)return;const s16=60/M.bpm/4;
  // fell behind (the page was busy)? skip the missed steps silently instead of firing broken notes in the past
  while(AUD.next<C_.currentTime-0.01){AUD.next+=s16;AUD.step++;if(AUD.step%16===0)AUD.bar++;}
  // schedule well ahead so short main-thread stalls on phones never leave gaps
  while(AUD.next<C_.currentTime+0.6){playStep(M,AUD.step,AUD.next,s16);AUD.next+=s16;AUD.step++;if(AUD.step%16===0)AUD.bar++;}}
function deg(M,d,oct=0){const sc=SCALES[M.sc];const n=sc.length;const o=Math.floor(d/n);return M.root+sc[((d%n)+n)%n]+12*(o+oct);}
function playStep(M,st,t,s16){if(AUD.fadeT||M.silent)return;if(M.song)return playSong(M,st,t,s16);if(M.seq)return playSeq(M,st,t,s16);const o=audBus(),r=AUD.rng,i=st%16,bar=AUD.bar,ch=M.prog[bar%M.prog.length];const v=0.5;
  const chord=[ch,ch+2,ch+4];
  if(i===0){if(M.pad)for(const d of chord)INST.pad(NOTE(deg(M,d,0)),t,s16*16,v*0.9,o);if(M.choir)for(const d of [ch,ch+4])INST.choir(NOTE(deg(M,d,1)),t,s16*16,v,o);
    if(M.drone)INST.pad(NOTE(M.root-12),t,s16*16,v*1.2,o);}
  if(M.bass){const pat=M.bass===2?[0,3,6,8,10,12,14]:[0,8];if(pat.includes(i))INST.bass(NOTE(deg(M,ch,-1)+(M.bass===2&&i%4===2?12:0)),t,s16*(M.bass===2?2:6),v,o);}
  if(M.drums>=1){if(i%8===0)INST.kick(t,v,o);if(M.drums===2&&i%8===6)INST.kick(t,v*0.7,o);if(i%8===4)INST.snare(t,v,o);if(i%2===0)INST.hat(t,v*(i%4?0.6:1),o);if(M.drums===2&&i===14)INST.tom(t,v,o);if(M.drums===1&&i>=12&&bar%4===3&&i%2===0)INST.tom(t,v*0.8,o);}
  else if(M.drums>0){if(i===0||i===8)INST.kick(t,v*0.35,o);if(i===4||i===12)INST.hat(t,v*0.5,o);}
  // arpeggio
  const arpRate=M.bpm>120?2:M.bpm>85?2:4;if(i%arpRate===0&&r()<0.85){const k=Math.floor(i/arpRate)%4;const d=[chord[0],chord[1],chord[2],chord[1]+7][k];INST[M.arp](NOTE(deg(M,d,1)),t,s16*arpRate*1.5,v*0.55,o);}
  // melody: phrase-shaped random walk on the scale
  if(i%4===0&&r()<M.dens){AUD.mel=AUD.mel==null?ch+7:AUD.mel+[-2,-1,-1,0,1,1,2][Math.floor(r()*7)];if(AUD.mel<ch+2)AUD.mel+=3;if(AUD.mel>ch+11)AUD.mel-=3;if(i===0)AUD.mel=chord[Math.floor(r()*3)]+7;
    const len=r()<0.3?8:r()<0.6?4:2;INST[M.lead](NOTE(deg(M,AUD.mel,1)),t,s16*len,v*0.55,o);}}
/* ---------- sound effects ---------- */
const SFX_HUE={fire:[300,2400],frost:[2400,900],lightning:[3000,600],holy:[900,2200],shadow:[400,120],nature:[700,1400],poison:[500,300],arcane:[1200,2600]};
function sfx(name,opt={}){if(!AUD.on||!AUD.ctx)return;const C_=AUD.ctx,t=C_.currentTime+0.01,o=AUD.fx;const now=performance.now();if(AUD.lastSfx[name]&&now-AUD.lastSfx[name]<45)return;AUD.lastSfx[name]=now;
  switch(name){
    case 'click':tone('sine',1400,t,0.03,0.08,o,{d:0.01,s:0.1,r:0.03});break;
    case 'hit':noiseHit(t,0.12,0.5,o,1400,300,'bandpass',0.9);tone('sine',140,t,0.12,0.5,o,{slide:60,d:0.04,s:0.2,r:0.08});break;
    case 'slash':noiseHit(t,0.16,0.35,o,600,4200,'bandpass',2);noiseHit(t+0.04,0.1,0.3,o,1500,500,'bandpass',1);break;
    case 'crit':noiseHit(t,0.16,0.6,o,2000,300,'bandpass',0.8);tone('sine',90,t,0.25,0.7,o,{slide:40,d:0.05,s:0.3,r:0.2});tone('triangle',1760,t+0.02,0.2,0.18,o,{d:0.02,s:0.3,r:0.2});break;
    case 'magic':{const [a,b]=SFX_HUE[opt.e]||[800,1600];noiseHit(t,0.3,0.25,o,a,b,'bandpass',3);tone(opt.e==='shadow'?'sawtooth':'sine',a/2,t,0.3,0.15,o,{slide:b/2,d:0.1,s:0.4,r:0.2,lp:3000});
      if(opt.e==='lightning')for(let k=0;k<3;k++)noiseHit(t+k*0.04,0.05,0.3,o,4000,null,'highpass',1);if(opt.e==='frost'||opt.e==='holy')INST.bell(NOTE(84),t,0.3,0.4,o);break;}
    case 'heal':[72,76,79,84].forEach((n,k)=>tone('sine',NOTE(n),t+k*0.06,0.25,0.18,o,{d:0.05,s:0.4,r:0.3}));break;
    case 'buff':[67,74,79].forEach((n,k)=>tone('triangle',NOTE(n),t+k*0.04,0.3,0.12,o,{a:0.02,d:0.1,s:0.5,r:0.3}));noiseHit(t,0.4,0.05,o,6000,9000,'highpass',1);break;
    case 'debuff':tone('sawtooth',300,t,0.35,0.12,o,{slide:120,lp:900,d:0.1,s:0.4,r:0.2});break;
    case 'miss':noiseHit(t,0.18,0.18,o,500,2500,'bandpass',1.5);break;
    case 'death':tone('sine',120,t,0.5,0.5,o,{slide:35,d:0.1,s:0.4,r:0.4});noiseHit(t,0.4,0.2,o,600,100,'lowpass',1);break;
    case 'summon':[60,67,72,79].forEach((n,k)=>INST.bell(NOTE(n),t+k*0.07,0.4,0.3,o));break;
    case 'coin':tone('square',NOTE(88),t,0.06,0.08,o,{d:0.02,s:0.3,r:0.06,lp:5000});tone('square',NOTE(93),t+0.07,0.12,0.08,o,{d:0.02,s:0.3,r:0.1,lp:5000});break;
    case 'levelup':[60,64,67,72,76,79,84].forEach((n,k)=>INST.harp(NOTE(n),t+k*0.07,0.5,0.5,o));INST.choir(NOTE(72),t+0.4,1.2,0.6,o);break;
    case 'victory':[[67,0],[67,0.12],[67,0.24],[72,0.4]].forEach(([n,d])=>INST.brass(NOTE(n),t+d,d>0.3?0.6:0.1,0.6,o));[60,64,67].forEach(n=>INST.pad(NOTE(n),t+0.4,1.2,0.8,o));break;
    case 'defeat':[67,63,60,55].forEach((n,k)=>INST.flute(NOTE(n),t+k*0.25,0.4,0.5,o));break;
    case 'open':noiseHit(t,0.12,0.06,o,3000,6000,'bandpass',2);break;
    case 'boss':tone('sawtooth',55,t,1.2,0.35,o,{a:0.1,lp:400,d:0.3,s:0.6,r:0.6});INST.tom(t,0.8,o);INST.tom(t+0.25,0.8,o);break;
  }}
/* moods follow what you're doing */
function audPickMood(){if(typeof FIN!=='undefined'&&FIN.ending)return 'title';if(!S||!S.P||!UI.started)return 'title';if(C&&C.opts&&C.opts.final&&!C.closed){return C.cinema?(C.cineMusic?'final2':'silence'):C.finalPhase===2?'final2':'final1';}if(UI.inCombat()&&C&&!C.ended){return C.enemies.some(e=>e.boss)||['tourney','trial'].includes(C.opts.type)?'boss':'combat';}
  const L=LOCS[S.P.loc];if(S.P.dungeon||L.ty==='dungeon'||L.ty==='lair')return 'dungeon';if(isTown(S.P.loc))return T.isNight(S.time)?'night':'town';return T.isNight(S.time)?'night':'wild';}
setInterval(()=>{if(AUD.on)audMood(audPickMood());},800);

function playSeq(M,st,t,s16){const o=audBus(),i=st%16,bar=Math.floor(st/16);const v=0.5;const root=M.roots[bar%4];
  const n=M.mel[(st)%M.mel.length];if(n){let len=1;while(len<4&&!M.mel[(st+len)%M.mel.length])len++;INST[M.lead](NOTE(n),t,s16*len*0.95,v*0.75,o);}
  // driving eighth-note bass with octave jumps
  if(i%2===0){const k=(i/2)%8;const off=[0,0,12,0,7,0,12,7][k];INST.bass(NOTE(root+off),t,s16*1.8,v*1.1,o);}
  if(i===0){if(M.choir)for(const d of (M.major?[0,4,7]:[0,3,7]))INST.choir(NOTE(root+24+d),t,s16*16,v*0.8,o);else INST.pad(NOTE(root+12),t,s16*16,v*0.7,o);}
  // arpeggiated harmony under the lead
  if(i%2===1){const tri=M.major?[0,4,7,12]:[0,3,7,12];INST.pluck(NOTE(root+24+tri[(i>>1)%4]),t,s16*1.2,v*0.35,o);}
  if(i%8===0)INST.kick(t,v,o);if(i%8===6)INST.kick(t,v*0.7,o);if(i%8===4)INST.snare(t,v,o);INST.hat(t,v*(i%2?0.45:0.85),o);if(bar%4===3&&i>=12)INST.tom(t,v*0.9,o);}
function sfxGlitch(){if(!AUD.on||!AUD.ctx)return;const t=AUD.ctx.currentTime;for(let k=0;k<6;k++){noiseHit(t+k*0.07+Math.random()*0.05,0.05,0.25,AUD.fx,200+Math.random()*6000,null,'bandpass',8);tone('square',80+Math.random()*900,t+k*0.08,0.04,0.08,AUD.fx,{d:0.01,s:0.5,r:0.03});}}
function sfxShatter(){if(!AUD.on||!AUD.ctx)return;const t=AUD.ctx.currentTime;noiseHit(t,0.9,0.7,AUD.fx,5000,300,'bandpass',0.7);for(let k=0;k<8;k++)INST.bell(NOTE(84+Math.floor(Math.random()*14)),t+k*0.05,0.4,0.3,AUD.fx);tone('sine',60,t,1.2,0.6,AUD.fx,{slide:25,d:0.2,s:0.4,r:0.8});}
function sfxHeartbeat(){if(!AUD.on||!AUD.ctx)return;const t=AUD.ctx.currentTime;for(let k=0;k<3;k++){tone('sine',55,t+k*0.9,0.18,0.6,AUD.fx,{slide:40,d:0.05,s:0.3,r:0.12});tone('sine',50,t+k*0.9+0.22,0.16,0.45,AUD.fx,{slide:38,d:0.05,s:0.3,r:0.1});}}
function audForce(m){AUD.want=m;if(!AUD.on||!AUD.ctx)return;audNewBus(0.03);AUD.mood=m;AUD.fadeT=0;AUD.step=0;AUD.bar=0;AUD.next=AUD.ctx.currentTime+0.05;AUD.mus.gain.cancelScheduledValues(AUD.ctx.currentTime);AUD.mus.gain.setTargetAtTime(AUD.music*0.55,AUD.ctx.currentTime,0.05);}
/* cinematic cues */
function cue(name){if(!AUD.on||!AUD.ctx)return;const C_=AUD.ctx,t=C_.currentTime+0.01,o=AUD.fx;
  switch(name){
    case 'riser':{const s=C_.createBufferSource();s.buffer=AUD.noise;s.loop=true;const f=C_.createBiquadFilter();f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(200,t);f.frequency.exponentialRampToValueAtTime(5000,t+3);
      const g=C_.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.45,t+2.9);g.gain.exponentialRampToValueAtTime(0.0001,t+3.1);s.connect(f);f.connect(g);g.connect(o);s.start(t);s.stop(t+3.2);
      tone('sawtooth',55,t,3,0.3,o,{a:2.6,d:0.2,s:0.9,r:0.2,slide:220,lp:1200});tone('sawtooth',82,t,3,0.2,o,{a:2.6,d:0.2,s:0.9,r:0.2,slide:330,lp:1500,det:8});break;}
    case 'boom':tone('sine',70,t,2.2,1,o,{slide:22,d:0.15,s:0.5,r:1.8});noiseHit(t,1.4,0.9,o,3000,80,'lowpass',0.7);tone('sawtooth',40,t,1.5,0.35,o,{lp:300,d:0.2,s:0.4,r:1.2});break;
    case 'whoosh':noiseHit(t,0.7,0.5,o,300,6000,'bandpass',2);break;
    case 'glass':{noiseHit(t,1.6,0.8,o,6000,800,'bandpass',0.6);for(let k=0;k<16;k++)INST.bell(NOTE(86+Math.floor(Math.random()*16)),t+Math.random()*0.9,0.5,0.35,o);tone('sine',48,t,2,0.6,o,{slide:28,d:0.3,s:0.4,r:1.5});break;}
    case 'heartbeat':tone('sine',52,t,0.2,0.9,o,{slide:38,d:0.05,s:0.3,r:0.15});tone('sine',48,t+0.24,0.18,0.7,o,{slide:35,d:0.05,s:0.3,r:0.12});break;
    case 'swell':for(const n of [50,57,62,66,69])tone('triangle',NOTE(n),t,3.2,0.12,o,{a:2.8,d:0.2,s:0.9,r:0.6,vib:1});noiseHit(t,3,0.12,o,2000,8000,'bandpass',2);break;
    case 'drop':tone('sine',90,t,1.6,1,o,{slide:30,d:0.1,s:0.5,r:1.3});noiseHit(t,0.9,0.8,o,8000,400,'bandpass',0.6);[62,69,74,78,81].forEach((n,k)=>INST.brass(NOTE(n),t+k*0.02,1.4,0.7,o));INST.choir(NOTE(74),t,2.4,1,o);break;
    case 'stutter':for(let k=0;k<10;k++){noiseHit(t+k*0.09,0.05,0.35,o,300+Math.random()*7000,null,'bandpass',6);tone('square',60+Math.random()*1200,t+k*0.09,0.05,0.12,o,{d:0.01,s:0.5,r:0.03});}break;
  }}
function musMuffle(on){if(!AUD.on||!AUD.ctx)return;const t=AUD.ctx.currentTime;AUD.musF.frequency.cancelScheduledValues(t);AUD.musF.frequency.setTargetAtTime(on?280:5200,t,on?0.5:0.1);}
function musGate(open){if(!AUD.on||!AUD.ctx)return;AUD.mus.gain.cancelScheduledValues(AUD.ctx.currentTime);AUD.mus.gain.setValueAtTime(open?AUD.music*0.55:0.0001,AUD.ctx.currentTime);}
