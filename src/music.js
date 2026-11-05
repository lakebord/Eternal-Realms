/* ETERNAL REALMS — battle soundtrack. Four original chiptune-rock themes (hand-written, no samples):
   fast 16th-note lead lines, galloping saw bass, double-kick drums and fills. */
'use strict';
const NOTE_IX={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function nmidi(tok){const m=/^([A-G])([#b]?)(\d)$/.exec(tok);if(!m)return 0;return 12*(+m[3]+1)+NOTE_IX[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);}
// one bar = 16 tokens: note (e.g. D6, F#5, Bb5), '-' hold, '.' rest
function sbars(...rows){return rows.map(r=>{const t=r.trim().split(/\s+/);if(t.length!==16)console.warn('bar length',t.length,r);return t;});}

Object.assign(INST,{
  lead2:(f,t,d,v,o)=>{tone('square',f,t,d,v*0.16,o,{d:0.05,s:0.7,r:0.06,lp:4200,vib:d>0.25?1:0});tone('square',f,t,d,v*0.1,o,{d:0.05,s:0.6,r:0.06,lp:3800,det:12});tone('triangle',f/2,t,d,v*0.14,o,{d:0.05,s:0.6,r:0.06});},
  hero:(f,t,d,v,o)=>{tone('sawtooth',f,t,d,v*0.17,o,{a:0.015,d:0.12,s:0.7,r:0.12,lp:2600,lpEnd:1800,vib:d>0.3?1:0});tone('sawtooth',f,t,d,v*0.13,o,{a:0.015,d:0.12,s:0.7,r:0.12,lp:2400,det:10});tone('square',f*2,t,d,v*0.05,o,{d:0.05,s:0.5,r:0.08,lp:5000});},
  sbass:(f,t,d,v,o)=>{tone('sawtooth',f,t,d,v*0.32,o,{d:0.06,s:0.45,r:0.05,lp:1100,lpEnd:380,q:4});tone('square',f/2,t,d,v*0.18,o,{d:0.05,s:0.5,r:0.05,lp:500});},
  carp:(f,t,d,v,o)=>tone('square',f,t,d,v*0.07,o,{d:0.03,s:0.25,r:0.04,lp:3600}),
  kick2:(t,v,o)=>{tone('sine',150,t,0.16,v*1.0,o,{slide:42,d:0.04,s:0.35,r:0.1});noiseHit(t,0.02,v*0.25,o,3000,null,'highpass',1);},
  snare2:(t,v,o)=>{noiseHit(t,0.16,v*0.45,o,2200,1200,'bandpass',0.7);tone('triangle',210,t,0.09,v*0.28,o,{slide:150,d:0.03,s:0.2,r:0.05});},
  ohat:(t,v,o)=>noiseHit(t,0.16,v*0.1,o,7000,null,'highpass',1),
  crash:(t,v,o)=>noiseHit(t,1.4,v*0.22,o,5500,2500,'highpass',0.7)
});

const SONGS={
  // normal fights: A minor, all forward momentum
  combat:{name:'Steel Rush',bpm:138,lead:'lead2',chords:[[57,0],[53,1],[55,1],[52,1]],bass:'gallop',
    mel:sbars('A5 - C6 - E6 - A5 . . B5 C6 . B5 . G5 .','A5 - . F5 . A5 C6 . F6 - E6 . C6 . A5 .','B5 . D6 . G6 - F6 E6 . D6 . B5 . G5 B5 D6','E6 - - D6 C6 . B5 . G#5 . B5 . E6 - - .',
             'E6 E6 . E6 A6 . G6 . E6 . C6 . D6 E6 . .','F6 - E6 . C6 . A5 . C6 . F6 . A6 - G6 F6','G6 - F6 . D6 . B5 . D6 . G6 . F6 E6 D6 .','E6 . B5 . G#5 . E5 . G#5 B5 E6 . G#6 . B6 .')},
  // dungeon & world bosses: E minor, heavier, faster
  boss:{name:'Crown of Teeth',bpm:150,lead:'lead2',chords:[[52,0],[48,1],[50,1],[47,1]],bass:'drive',choir:1,
    mel:sbars('E5 . E5 G5 . B5 . E6 - D#6 . B5 . G5 A5 B5','C6 - . B5 G5 . E5 . G5 . C6 . E6 - D6 C6','D6 . F#6 . A6 - F#6 D6 . A5 . D6 . F#6 E6 D6','D#6 - - F#6 B6 - A6 . F#6 . D#6 . B5 - - .',
             'G6 - E6 . B5 . E6 G6 . B6 - A6 G6 . F#6 .','E6 - C6 . G5 . C6 E6 . G6 - F#6 E6 . D6 .','F#6 - D6 . A5 . D6 F#6 . A6 - G6 F#6 . E6 .','D#6 E6 F#6 G6 A6 . B6 . A6 G6 F#6 . D#6 . B5 .')},
  // the final battle, phase 1: D minor, relentless
  final1:{name:'The Sun Will Not Rise',bpm:144,lead:'lead2',chords:[[50,0],[46,1],[48,1],[45,1]],bass:'drive',
    mel:sbars('D5 F5 A5 D6 . C6 D6 . A5 - . F5 G5 A5 . .','Bb5 - A5 . F5 . D5 . F5 G5 A5 . Bb5 - C6 .','E6 . E6 E6 . D6 C6 . G5 . C6 . E6 - G6 .','F6 E6 D6 C#6 . A5 . E5 . A5 C#6 E6 . A6 - -',
             'D6 . D6 F6 . A6 - G6 F6 . E6 . D6 - A5 .','Bb5 D6 F6 . E6 . D6 . C6 . Bb5 . A5 - F5 .','G5 C6 E6 G6 . F6 E6 . D6 E6 F6 . E6 - C6 .','C#6 D6 E6 F6 G6 F6 E6 D6 C#6 . A5 . A6 - - -',
             'A5 . A5 . D6 . A5 . C6 . A5 . G5 A5 . .','Bb5 . Bb5 . D6 . Bb5 . F6 - E6 . D6 . . .','C6 . C6 . E6 . C6 . G6 - F6 . E6 . C6 .','E6 . . E6 . . A6 - G6 . F6 . E6 . C#6 .')},
  // the final battle, phase 2: D major, triumphant, double-time drums
  final2:{name:'Unbroken',bpm:146,lead:'hero',chords:[[50,2],[45,2],[47,0],[43,2],[50,2],[45,2],[43,2],[45,2]],bass:'gallop',choir:1,major:1,
    mel:sbars('F#5 - A5 - D6 - - E6 F#6 - E6 D6 . A5 - .','E6 - E6 F#6 E6 . C#6 . A5 - . C#6 E6 - A6 .','F#6 - - E6 D6 . C#6 D6 . B5 - . F#5 . B5 .','D6 - - C#6 B5 . A5 . G5 . B5 . D6 - G6 .',
             'A6 - F#6 . D6 . A5 . D6 F#6 A6 . B6 A6 F#6 .','E6 - C#6 . A5 . C#6 E6 . A6 - G6 F#6 . E6 .','D6 - B5 . G5 . B5 D6 . G6 - F#6 E6 . D6 .','E6 F#6 G6 A6 . . A6 . B6 . C#7 . D7 - - -')}
};
// chord quality: 0 minor, 1 major (in a minor key), 2 major
const SONGQ=q=>q===0?[0,3,7]:[0,4,7];
for(const k in SONGS)MOODS[k]=Object.assign({song:1},SONGS[k]);

function playSong(M,st,t,s16){const o=audBus(),v=0.78,nb=M.mel.length,b=Math.floor(st/16)%nb,i=st%16,bar=M.mel[b];
  const [root,q]=M.chords[b%M.chords.length];const tri=SONGQ(q);const last=b===nb-1,phraseStart=b%4===0;
  // lead
  const tok=bar[i];const n=nmidi(tok);if(n){let hold=1;for(let k=i+1;k<16&&bar[k]==='-';k++)hold++;INST[M.lead](NOTE(n),t,s16*hold*0.92,v*0.95,o);
    if(M.lead==='hero'&&hold>=2)INST.lead2(NOTE(n+12),t,s16*hold*0.9,v*0.25,o);}
  // bass: 'gallop' = da-da-DUM with octave pops, 'drive' = straight 16ths with accents
  const R=root-12;
  if(M.bass==='gallop'){const pat=[1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1],oct=[0,0,0,12,0,0,0,12,0,0,7,12,0,0,0,12];if(pat[i])INST.sbass(NOTE(R+oct[i]),t,s16*0.9,v*(i%4===0?1.1:0.8),o);}
  else{const oct=[0,0,12,0,0,0,12,0,0,0,12,0,7,0,12,0];INST.sbass(NOTE(R+oct[i]),t,s16*0.85,v*(i%4===0?1.15:i%2?0.6:0.85),o);}
  // fast chord arpeggio
  INST.carp(NOTE(root+12+[...tri,12][i%4]),t,s16*0.8,v*(i%4===0?1:0.75),o);
  // pads / choir on the downbeat
  if(i===0){if(M.choir)for(const d of tri)INST.choir(NOTE(root+12+d),t,s16*16,v*0.7,o);else for(const d of tri)INST.pad(NOTE(root+d),t,s16*16,v*0.55,o);
    if(phraseStart)INST.crash(t,v,o);}
  // drums
  const fill=last&&i>=12;
  if(!fill){if([0,6,8,10].includes(i)||(M.name==='Unbroken'&&i%4===2&&i!==6&&i!==10))INST.kick2(t,v,o);if(i===4||i===12)INST.snare2(t,v,o);
    if(i%2===0)INST.hat(t,v*0.9,o);else INST.hat(t,v*0.45,o);if(i===14)INST.ohat(t,v,o);}
  else{INST.snare2(t,v*(0.6+(i-12)*0.13),o);if(i===12||i===14)INST.kick2(t,v,o);INST.tom(t,v*0.6,o);}}
