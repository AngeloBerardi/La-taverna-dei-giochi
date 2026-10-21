/* ---- audio: colonna sonora per atto e effetti sintetizzati ---- */
const Snd=(()=>{let ctx=null,mg,sg,comp,mus=ST('rg-mus')!=='0',sfx=ST('rg-sfx')!=='0',tm=null,st=0,nt=0,track='menu',want='menu';const mf=m=>440*Math.pow(2,(m-69)/12);
 const TR={
  valle:{sd:.16,bar:6,prog:[[50,1],[55,1],[48,1],[52,0],[50,1],[57,0],[53,1],[55,1]],arp:[0,1,2,3,2,1],lead:'flute',drum:'tav',
   mel:[[74,0,76,79,0,76],[74,0,71,74,0,0],[72,0,74,76,0,79],[81,0,79,76,0,0],[79,0,81,83,81,79],[76,0,74,76,0,72],[74,0,72,69,0,71],[74,0,0,0,0,0]]},
  disc:{sd:.15,bar:6,prog:[[45,0],[41,1],[43,1],[40,0],[45,0],[38,0],[40,1],[45,0]],arp:[0,2,1,3,2,1],lead:'bell',drum:'march',
   mel:[[69,0,72,0,76,74],[72,0,69,0,65,0],[67,0,71,74,0,72],[71,0,68,0,64,0],[69,72,76,0,81,79],[77,0,74,0,72,0],[71,0,74,0,68,71],[69,0,0,0,0,0]]},
  peru:{sd:.14,bar:6,prog:[[50,1],[46,0],[48,0],[45,0],[50,1],[46,0],[43,1],[45,0]],arp:[0,2,1,3,2,1],lead:'pluck',drum:'tav',
   mel:[[69,0,72,0,74,72],[70,0,74,0,77,74],[72,0,76,0,79,76],[74,0,0,69,0,0],[77,0,76,74,72,0],[74,0,72,70,69,0],[70,72,74,0,72,70],[69,0,0,0,0,0]]},
  kitt:{sd:60/132/2,bar:8,swing:.3,prog:[[43,1],[48,1],[50,0],[45,1]],arp:[0,1,2,3,2,1,2,1],lead:'pluck',drum:'jazz',
   mel:[[67,0,70,0,72,70,67,0],[65,0,68,0,72,68,65,0],[63,0,67,70,0,67,63,0],[62,0,0,0,65,67,0,0],[70,0,72,74,72,0,70,0],[68,0,70,72,70,0,68,0],[67,70,0,67,0,63,0,62],[67,0,0,0,0,0,0,0]]},
  cata:{sd:.17,bar:6,prog:[[48,0],[55,0],[57,1],[53,0],[48,0],[52,1],[55,0],[50,0]],arp:[0,2,1,3,2,1],lead:'flute',drum:'tav',
   mel:[[72,0,76,79,76,0],[74,0,77,81,77,0],[76,0,79,83,79,0],[77,0,76,72,0,0],[79,0,76,74,76,0],[77,0,74,72,74,0],[76,74,72,0,67,0],[72,0,0,0,0,0]]},
  pets:{sd:60/118/2,bar:8,swing:.25,prog:[[45,1],[41,0],[43,0],[40,1]],arp:[0,1,2,1,2,3,2,1],lead:'pluck',drum:'jazz',
   mel:[[69,0,72,0,76,72,69,0],[65,0,69,0,72,69,65,0],[67,0,71,0,74,71,67,0],[64,0,67,71,0,67,64,0],[72,0,76,0,79,76,72,0],[69,0,72,0,76,72,69,0],[67,0,71,74,0,71,67,0],[69,0,0,0,0,0,0,0]]},
  spie:{sd:60/96/2,bar:8,swing:0,prog:[[45,1],[43,0],[41,0],[40,1]],arp:[0,1,2,1,3,2,1,2],lead:'bell',drum:'tav',
   mel:[[69,0,0,72,0,0,76,0],[67,0,0,71,0,0,74,0],[65,0,0,69,0,72,0,0],[64,0,67,0,71,0,0,0],[72,0,0,76,0,0,79,0],[71,0,0,74,0,0,77,0],[69,0,72,0,76,0,72,0],[69,0,0,0,0,0,0,0]]},
  quiz:{sd:60/116/2,bar:8,swing:.15,prog:[[48,0],[55,0],[57,1],[53,0]],arp:[0,1,2,1,3,2,1,2],lead:'flute',drum:'tav',
   mel:[[72,0,76,0,79,76,72,0],[71,0,74,0,79,74,71,0],[69,0,72,0,76,72,69,0],[72,0,77,0,81,77,72,0],[74,0,77,0,81,77,74,0],[72,0,76,79,0,76,72,0],[71,74,0,71,0,67,0,0],[72,0,0,0,0,0,0,0]]},
  uno:{sd:60/132/2,bar:8,swing:.1,prog:[[48,0],[53,0],[55,0],[48,0]],arp:[0,1,2,3,2,1,2,3],lead:'flute',drum:'tav',
   mel:[[72,0,76,0,79,0,76,0],[77,0,76,0,72,0,69,0],[74,0,77,0,81,0,77,0],[79,0,77,76,74,0,72,0],[76,0,79,0,84,0,79,0],[77,0,81,0,84,81,77,0],[79,77,76,74,72,0,67,0],[72,0,0,0,0,0,0,0]]},
  trono:{sd:60/104/2,bar:8,swing:0,prog:[[45,1],[41,0],[43,0],[40,1]],arp:[0,1,2,1,2,1,2,1],lead:'flute',drum:'tav',
   mel:[[69,0,72,0,76,0,72,0],[65,0,69,0,72,69,0,0],[67,0,71,0,74,71,67,0],[64,0,67,71,0,67,0,0],[72,0,76,0,79,76,72,0],[69,0,72,0,76,72,69,0],[67,0,71,74,0,71,67,0],[69,0,0,0,0,0,0,0]]},
  menu:{sd:.19,bar:6,prog:[[53,1],[48,1],[50,0],[46,1]],arp:[0,2,1,3,2,1],lead:'bell',drum:'tav',
   mel:[[72,0,69,72,0,74],[76,0,74,72,0,67],[69,0,72,74,0,72],[70,0,69,67,0,0],[72,0,76,77,0,76],[74,0,72,76,0,74],[72,0,69,70,0,67],[65,0,0,0,0,0]]},
  J:{sd:60/96/2,bar:8,prog:[[50,0],[46,1],[48,1],[45,0]],arp:[0,1,2,3,2,1,2,1],lead:'pluck',drum:'march',
   mel:[[62,0,65,0,69,0,67,65],[65,0,62,0,70,0,69,67],[67,0,64,0,72,0,70,69],[69,0,0,64,67,0,65,64],[74,0,72,0,69,0,65,0],[70,0,69,0,67,0,65,0],[67,69,70,72,0,0,67,0],[69,0,0,0,0,0,0,0]]},
  Q:{sd:60/104/2,bar:8,prog:[[50,0],[43,0],[45,1],[50,0]],arp:[0,2,3,4,3,2,1,2],lead:'flute',drum:'march',
   mel:[[69,0,70,69,67,0,65,0],[67,0,70,0,74,0,72,70],[69,0,73,0,76,0,73,0],[74,0,0,0,69,0,0,0],[77,0,76,74,73,0,74,0],[70,0,69,67,70,0,74,0],[73,0,69,0,64,0,67,0],[62,0,0,0,0,0,0,0]]},
  it:{sd:.135,bar:6,prog:[[57,0],[52,1],[52,1],[57,0],[50,0],[57,0],[52,1],[57,0]],arp:[0,2,1,3,2,1],lead:'pluck',drum:'tav',
   mel:[[76,72,69,72,76,72],[74,71,68,71,74,71],[74,76,74,72,71,68],[69,72,76,0,0,0],[77,74,69,74,77,74],[76,72,69,72,76,72],[71,74,72,71,69,68],[69,0,0,0,0,0]]},
  mach:{sd:.17,bar:6,prog:[[50,0],[45,0],[53,1],[50,0],[46,1],[45,0],[53,1],[45,0]],arp:[0,2,1,3,2,1],lead:'pluck',drum:'tav',
   mel:[[69,0,72,74,72,0],[69,0,67,65,67,0],[72,0,77,76,72,0],[74,0,0,69,0,0],[70,0,74,77,74,0],[69,0,72,76,72,0],[72,0,69,65,69,0],[69,0,0,0,0,0]]},
  island:{sd:.15,bar:6,prog:[[48,1],[55,1],[57,0],[53,1],[48,1],[55,1],[50,0],[55,1]],arp:[0,1,2,1,2,3],lead:'bell',drum:'tav',
   mel:[[72,0,76,79,76,0],[74,0,79,83,79,0],[72,0,76,81,76,0],[77,0,81,84,81,0],[76,0,72,79,76,0],[74,0,71,79,74,0],[69,0,74,77,74,0],[72,0,0,0,0,0]]},
  azul:{sd:.17,bar:6,prog:[[50,0],[55,0],[57,1],[50,0],[53,1],[55,0],[57,1],[50,0]],arp:[0,2,1,3,2,1],lead:'pluck',drum:'tav',
   mel:[[74,0,77,76,74,0],[70,0,74,72,70,0],[69,73,76,0,73,69],[74,0,0,0,0,0],[77,0,81,79,77,0],[74,0,70,72,74,0],[73,0,76,73,69,0],[74,0,0,0,0,0]]},
  gang:{sd:60/120/2,bar:8,swing:.33,walk:1,comp:1,prog:[[50,0],[43,1],[48,1],[45,1]],arp:[0,1,2,3,2,1,2,1],lead:'brass',drum:'jazz',
   mel:[[69,0,72,0,74,72,69,0],[71,0,74,0,77,76,74,0],[72,0,0,76,74,72,71,72],[73,0,0,0,69,0,0,0],[74,0,77,76,74,0,72,0],[71,0,67,0,71,74,77,0],[76,0,74,72,71,0,69,0],[69,0,0,0,0,0,0,0]]},
  mine:{sd:60/100/2,bar:8,prog:[[52,0],[50,1],[48,1],[47,1]],arp:[0,2,1,2,0,2,1,3],lead:'flute',drum:'anvil',
   mel:[[64,0,67,69,71,0,69,67],[66,0,69,0,74,0,72,71],[67,0,64,67,72,0,71,69],[71,0,0,0,66,0,0,0],[76,0,74,0,71,0,69,67],[69,0,66,0,62,0,66,69],[67,69,71,72,71,0,67,0],[64,0,0,0,0,0,0,0]]},
  K:{sd:60/112/2,bar:8,prog:[[50,0],[46,1],[41,1],[45,1]],arp:[0,1,2,3,4,3,2,1],lead:'brass',drum:'epic',
   mel:[[62,0,0,62,65,0,69,0],[70,0,0,69,70,0,72,0],[72,0,0,69,65,0,72,0],[73,0,0,0,76,0,0,0],[74,0,0,72,70,0,69,0],[70,0,69,67,65,0,62,0],[65,0,67,0,69,0,72,0],[73,0,0,0,69,0,0,0]]}};
 function init(){if(ctx)return true;try{const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();
  comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;comp.connect(ctx.destination);
  const len=ctx.sampleRate*2.3|0,ir=ctx.createBuffer(2,len,ctx.sampleRate);for(let c=0;c<2;c++){const a=ir.getChannelData(c);for(let i=0;i<len;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}
  const rv=ctx.createConvolver();rv.buffer=ir;rv.connect(comp);
  mg=ctx.createGain();mg.gain.value=mus?.5:0;mg.connect(comp);const ms=ctx.createGain();ms.gain.value=.38;mg.connect(ms);ms.connect(rv);
  sg=ctx.createGain();sg.gain.value=.8;sg.connect(comp);const ss=ctx.createGain();ss.gain.value=.22;sg.connect(ss);ss.connect(rv);return true}catch(e){ctx=null;return false}}
 function osc(type,f,t,d,v,o,p={}){const at=p.at||.01;if(d<=at+.01)d=at+.05;const x=ctx.createOscillator();x.type=type;x.frequency.setValueAtTime(f,t);if(p.sl)x.frequency.exponentialRampToValueAtTime(Math.max(20,p.sl),t+(p.slt||d));if(p.det)x.detune.value=p.det;
  const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.0001,t+d);let n=x;
  if(p.lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(p.lp,t);if(p.lpE)fl.frequency.exponentialRampToValueAtTime(p.lpE,t+Math.min(d,.4));x.connect(fl);n=fl}
  n.connect(g);g.connect(o);x.start(t);x.stop(t+d+.05)}
 function noise(t,d,v,o,f,type){const n=Math.max(1,ctx.sampleRate*d|0),b=ctx.createBuffer(1,n,ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const fl=ctx.createBiquadFilter();fl.type=type||'highpass';fl.frequency.value=f||1000;const g=ctx.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(o);s.start(t);return fl}
 const I={pluck:(f,t,v,o)=>{osc('triangle',f,t,.7,v,o);osc('sawtooth',f,t,.28,v*.3,o,{lp:3200,lpE:300,det:6})},
  bell:(f,t,v,o)=>{osc('sine',f,t,1.3,v,o);osc('sine',f*2.76,t,.5,v*.25,o);osc('sine',f*5.4,t,.2,v*.1,o)},
  flute:(f,t,v,o,d)=>{osc('sine',f,t,d,v,o,{at:.07});osc('triangle',f*2,t,d,v*.12,o,{at:.07})},
  brass:(f,t,v,o,d)=>{osc('sawtooth',f,t,d,v,o,{at:.05,lp:500,lpE:2400,det:-6});osc('sawtooth',f,t,d,v*.7,o,{at:.05,lp:500,lpE:1900,det:7})},
  pad:(fs,t,d,v,o)=>fs.forEach(f=>{osc('sawtooth',f,t,d,v,o,{at:.7,lp:850,det:-9});osc('sawtooth',f,t,d,v,o,{at:.7,lp:850,det:9})}),
  bass:(f,t,d,v,o)=>{osc('triangle',f,t,d,v,o);osc('sine',f/2,t,d,v*.7,o)},
  timp:(f,t,v,o)=>{osc('sine',f,t,1,v,o,{sl:f*.6,slt:.25});noise(t,.07,v*.35,o,180,'lowpass')}};
 function sched(){if(!ctx)return;if(!mus){nt=ctx.currentTime+.1;return}if(nt<ctx.currentTime-.4)nt=ctx.currentTime+.05;
  while(nt<ctx.currentTime+.3){let T=TR[track],i=st%T.bar;if(i===0&&want!==track){track=want;st=0;T=TR[track];i=0}
   const b=Math.floor(st/T.bar)%8,c=T.prog[b%T.prog.length],iv=c[1]?[0,4,7,12,16]:[0,3,7,12,15],t=nt+(T.swing&&i%2?T.sd*T.swing:0),barLen=T.sd*T.bar;
   if(T.walk){if(i%2===0)I.bass(mf(c[0]-12+[0,iv[1],iv[2],iv[2]+2][i/2]),t,T.sd*1.9,.22,mg);if(i===2||i===6)[iv[1],iv[2],iv[3]].forEach(k=>I.bell(mf(c[0]+12+k),t,.035,mg));const m=T.mel[b][i];if(m)osc('sawtooth',mf(m),t,T.sd*1.7,.05,mg,{at:.03,lp:1100,det:4});if(i%2===0)noise(t,.12,.03,mg,6000);else noise(t,.06,.018,mg,7000);if(i===2||i===6)noise(t,.05,.04,mg,4000);if(i===0)I.timp(mf(c[0]-24),t,.12,mg);nt+=T.sd;st++;continue}
   if(i===0)I.pad([c[0]+12,c[0]+12+iv[1],c[0]+12+iv[2]].map(mf),t,barLen*1.05,.012,mg);
   if(i===0||i===T.bar/2)I.bass(mf(c[0]-12),t,barLen/2,.2,mg);
   if(track!=='K'||i%2===0)I.pluck(mf(c[0]+12+iv[T.arp[i]]),t,track==='menu'?.07:.055,mg);
   const m=T.mel[b][i];if(m){if(T.lead==='bell')I.bell(mf(m),t,.09,mg);else if(T.lead==='pluck')I.pluck(mf(m+12),t,.085,mg);else if(T.lead==='flute')I.flute(mf(m+12),t,.07,mg,T.sd*1.8);else I.brass(mf(m),t,.055,mg,T.sd*2.2)}
   if(T.drum==='tav'){if(i===0)I.timp(mf(c[0]-12),t,.18,mg);if(i===3)noise(t,.06,.05,mg,5000);noise(t,.025,.02,mg,8000)}
   else if(T.drum==='march'){if(i===0)I.timp(mf(c[0]-24),t,.35,mg);if(i===4)noise(t,.12,.08,mg,1500);if(i===6||i===7)noise(t,.07,.04,mg,1800)}
   else if(T.drum==='anvil'){if(i===0||i===4)I.timp(mf(c[0]-24),t,.4,mg);if(i===2||i===6){osc('square',1900,t,.08,.04,mg);osc('sine',2600,t,.25,.05,mg)}noise(t,.03,.015,mg,6000)}
   else{if(i%4===0)I.timp(mf(c[0]-24),t,.45,mg);if(i===2||i===6)noise(t,.16,.1,mg,900);if(b%4===3&&i>=4)I.timp(mf(c[0]-12),t,.2,mg)}
   nt+=T.sd;st++}}
 function start(){if(!init())return;try{ctx.resume()}catch(e){}if(!tm){nt=ctx.currentTime+.1;tm=setInterval(sched,60)}}
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;try{document.hidden?ctx.suspend():ctx.resume()}catch(e){}});
 function play(n){if(!sfx||!init())return;const t=ctx.currentTime+.01,o=sg;try{ctx.resume()}catch(e){}switch(n){
  case'sel':osc('triangle',1250,t,.07,.16,o);noise(t,.02,.08,o,3500);break;case'unsel':osc('triangle',820,t,.07,.13,o);break;
  case'deal':noise(t,.08,.14,o,2500,'bandpass');break;
  case'whoosh':{const f=noise(t,.35,.22,o,500,'bandpass');f.frequency.exponentialRampToValueAtTime(3500,t+.3);break}
  case'impact':I.timp(70,t,.7,o);noise(t,.18,.3,o,120,'lowpass');osc('square',140,t,.15,.08,o,{sl:60});break;
  case'slash':{const f=noise(t,.25,.3,o,3000,'bandpass');f.frequency.exponentialRampToValueAtTime(600,t+.2);osc('sawtooth',600,t,.2,.08,o,{sl:150});break}
  case'heal':[0,4,7,12,16].forEach((k,i)=>I.bell(mf(72+k),t+i*.07,.12,o));break;
  case'draw':[0,1,2,3].forEach(i=>{I.bell(mf(84+i*2),t+i*.06,.06,o);noise(t+i*.06,.04,.05,o,6000)});break;
  case'shield':osc('square',520,t,.5,.08,o,{lp:2400});osc('sine',1340,t,.7,.12,o);osc('sine',2170,t,.4,.06,o);noise(t,.06,.15,o,4000);break;
  case'immune':osc('sine',220,t,.3,.25,o,{sl:110});noise(t,.1,.1,o,300,'lowpass');break;
  case'atk':osc('sawtooth',95,t,.6,.22,o,{lp:600,lpE:200,sl:55});noise(t,.45,.2,o,300,'bandpass');I.timp(55,t+.15,.6,o);break;
  case'kill':noise(t,.4,.3,o,2500);[12,7,4,0,-5].forEach((k,i)=>I.bell(mf(84+k),t+.05+i*.06,.1,o));I.brass(mf(62),t+.35,.08,o,.5);I.brass(mf(69),t+.35,.06,o,.5);break;
  case'redeem':[0,4,7,11,14].forEach((k,i)=>I.bell(mf(67+k),t+i*.09,.12,o));I.pad([mf(67),mf(71),mf(74)],t,1.6,.02,o);break;
  case'enemy':I.brass(mf(38),t,.12,o,1.2);I.brass(mf(45),t,.09,o,1.2);I.brass(mf(50),t,.08,o,1.2);[0,.12,.24,.36].forEach((d,i)=>I.timp(mf(26),t+d,.35+i*.1,o));break;
  case'turn':I.brass(mf(62),t,.09,o,.25);I.brass(mf(69),t+.18,.1,o,.5);break;
  case'win':[62,66,69,74,69,74,78].forEach((m,i)=>I.brass(mf(m),t+i*.14,.1,o,.4));I.timp(mf(38),t,.5,o);I.timp(mf(38),t+.84,.6,o);break;
  case'lose':I.pad([mf(50),mf(53),mf(57)],t,2.5,.03,o);[0,-2,-5,-9].forEach((k,i)=>I.brass(mf(57+k),t+i*.35,.08,o,.6));osc('sine',55,t+1.2,3,.3,o);break;
  case'dice':[0,.05,.1,.17,.25,.34].forEach(d=>{noise(t+d,.05,.14,o,2000+d*6000,'bandpass');osc('triangle',380+d*900,t+d,.06,.06,o)});break;
  case'boom':noise(t,.9,.45,o,260,'lowpass');I.timp(48,t,.8,o);osc('sawtooth',120,t,.5,.2,o,{sl:35,lp:500});break;
  case'meow':osc('sawtooth',520,t,.28,.12,o,{sl:980,lp:2400,at:.06});osc('sawtooth',980,t+.26,.32,.1,o,{sl:420,lp:2000,at:.02});break;
  case'nope':osc('square',330,t,.12,.12,o,{sl:200});osc('square',200,t+.12,.2,.12,o,{sl:110});break;
  case'build':I.timp(90,t,.45,o);noise(t,.12,.18,o,900,'bandpass');osc('triangle',660,t+.08,.2,.08,o);break;
  case'coin':[0,.07].forEach((d,i)=>osc('sine',1320+i*440,t+d,.25,.1,o,{at:.005}));noise(t,.04,.05,o,7000);break;
  case'pick':osc('square',1700,t,.06,.12,o);osc('sine',2400,t,.3,.1,o);noise(t,.05,.2,o,2500,'bandpass');break;
  case'rock':noise(t,.9,.35,o,200,'lowpass');I.timp(48,t,.6,o);noise(t+.2,.5,.2,o,500,'lowpass');break;
  case'gold':[0,4,7,12,16,19].forEach((k,i)=>I.bell(mf(79+k),t+i*.06,.1,o));noise(t,.3,.08,o,7000);break;
  case'coal':I.timp(80,t,.4,o);osc('sine',150,t,.4,.15,o,{sl:90});break;
  case'chip':noise(t,.05,.3,o,3500,'bandpass');osc('triangle',2300,t,.05,.1,o);noise(t+.04,.04,.15,o,4200,'bandpass');break;
  case'alarm':[0,.35,.7].forEach(d=>{osc('sawtooth',600,t+d,.32,.12,o,{sl:950,slt:.3,lp:2500})});break;
  case'vault':I.timp(55,t,.6,o);osc('square',90,t,.4,.1,o,{lp:500});[0,4,7,12].forEach((k,i)=>I.bell(mf(76+k),t+.3+i*.08,.1,o));break;
  case'err':osc('sawtooth',110,t,.18,.15,o,{lp:900});break;case'ok':osc('triangle',900,t,.06,.1,o);noise(t,.015,.06,o,4000);break}}
 return{start,play,init,get mus(){return mus},get sfx(){return sfx},track(k){want=TR[k]?k:'menu'},
  setMus(v){mus=v;ST('rg-mus',v?'1':'0');if(v){start();if(mg)mg.gain.setTargetAtTime(.5,ctx.currentTime,.15)}else if(mg)mg.gain.setTargetAtTime(0,ctx.currentTime,.1)},
  setSfx(v){sfx=v;ST('rg-sfx',v?'1':'0')},
  duck(v){if(ctx&&mg)mg.gain.setTargetAtTime(v||!mus?0:.5,ctx.currentTime,.4)}}})();
document.addEventListener('pointerdown',()=>{if(Snd.mus)Snd.start()},{once:true,capture:true});
