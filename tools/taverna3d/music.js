
/* ================= JUKEBOX: musica procedurale con WebAudio ================= */
var TRACKS=[
  {n:'Ballata della locanda',k:'pluck',sp:.29,bar:6,arp:1,drum:'frame3',
   mel:[69,0,67,69,71,72, 74,0,72,71,69,0, 67,0,65,67,69,67, 65,64,62,0,0,0, 69,0,67,69,71,72, 74,0,76,74,72,71, 69,0,71,69,67,65, 62,0,0,0,0,0],
   bass:[50,50,48,50,50,45,43,50],bassAt:[0,3],ch:[[62,65,69],[62,65,69],[60,64,67],[62,65,69],[62,65,69],[57,60,64],[55,59,62],[62,65,69]]},
  {n:'Il boccale vuoto',k:'fiddle',sp:.19,bar:6,arp:1,drum:'jig',
   mel:[69,71,72,74,72,71, 69,0,76,74,72,71, 72,74,76,79,76,74, 76,0,74,72,71,0, 69,71,72,74,72,71, 69,0,76,78,79,76, 74,72,71,72,71,69, 69,0,0,69,0,0],
   bass:[45,45,48,52,45,50,43,45],bassAt:[0,3],ch:[[57,60,64],[57,60,64],[60,64,67],[52,55,59],[57,60,64],[50,54,57],[55,59,62],[57,60,64]]},
  {n:'La canzone del viandante',k:'flute',sp:.36,bar:6,arp:1,
   mel:[71,0,0,69,71,72, 71,0,69,67,0,0, 67,0,69,71,0,74, 76,0,0,0,0,0, 76,0,74,72,0,71, 69,0,71,72,71,69, 67,0,66,64,0,66, 64,0,0,0,0,0],
   bass:[40,38,43,48,45,45,47,40],bassAt:[0],ch:[[52,55,59],[50,54,57],[55,59,62],[48,52,55],[57,60,64],[57,60,64],[59,62,66],[52,55,59]]},
  {n:'Danza del fuoco',k:'fiddle',sp:.16,bar:8,arp:1,drum:'reel',
   mel:[74,72,69,72,74,76,74,72, 69,67,66,67,69,72,69,67, 66,69,74,69,72,69,67,64, 62,64,66,67,69,0,69,0, 74,72,69,72,74,76,78,76, 74,72,69,72,71,69,67,66, 67,69,71,72,74,72,69,67, 66,64,62,0,62,0,0,0],
   bass:[50,48,50,57,50,48,43,50],bassAt:[0,4],ch:[[62,66,69],[60,64,67],[62,66,69],[57,61,64],[62,66,69],[60,64,67],[55,59,62],[62,66,69]]},
  {n:'Brindisi all’oste',k:'pluck',sp:.24,bar:6,arp:1,drum:'frame3',lead2:'flute',
   mel:[67,0,71,74,0,71, 72,0,76,74,0,72, 71,0,67,69,71,72, 74,0,0,0,0,0, 76,0,74,72,0,71, 72,0,71,69,0,67, 69,0,71,69,66,69, 67,0,0,0,0,0],
   bass:[43,48,43,50,48,45,50,43],bassAt:[0,3],ch:[[55,59,62],[60,64,67],[55,59,62],[57,62,66],[60,64,67],[57,60,64],[57,62,66],[55,59,62]]},
  {n:'Notturno al camino',k:'bell',sp:.82,bar:4,
   mel:[76,0,74,72, 71,0,0,0, 72,0,71,69, 68,0,0,0, 69,0,72,76, 74,0,72,71, 72,71,69,68, 69,0,0,0],
   bass:[45,40,45,40,41,38,40,45],bassAt:[0],ch:[[57,60,64],[56,59,64],[57,60,64],[56,59,64],[53,57,60],[50,53,57],[52,56,59],[57,60,64]]},
  {n:'Il lamento del menestrello',k:'flute',sp:.42,bar:6,arp:1,
   mel:[64,0,67,69,0,71, 72,0,71,69,0,67, 69,0,0,0,67,64, 62,0,0,0,0,0, 64,0,67,69,0,71, 72,0,74,76,0,74, 72,71,69,67,0,62, 64,0,0,0,0,0],
   bass:[45,48,43,50,45,41,43,45],bassAt:[0],ch:[[57,60,64],[60,64,67],[55,59,62],[50,53,57],[57,60,64],[53,57,60],[55,59,62],[57,60,64]]},
  {n:'Giga del boccale',k:'reed',sp:.2,bar:6,drum:'jig',
   mel:[74,71,74,79,74,71, 72,69,72,76,72,69, 71,67,71,74,71,67, 69,71,72,74,72,69, 74,71,74,79,78,79, 76,74,72,71,69,67, 69,72,71,69,67,66, 67,0,74,67,0,0],
   bass:[43,48,43,50,43,48,50,43],bassAt:[0,3],ch:[[55,59,62],[60,64,67],[55,59,62],[57,62,66],[55,59,62],[60,64,67],[57,62,66],[55,59,62]]}
];
var MUS={ctx:null,cur:-1,vol:.55,step:0,next:0,timer:null};
function mtof(m){return 440*Math.pow(2,(m-69)/12)}
function musInit(){
  if(MUS.ctx)return true;var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  var c=MUS.ctx=new AC();MUS.master=c.createGain();MUS.master.gain.value=MUS.mute?0:MUS.vol*.5;
  var dl=c.createDelay(1),fb=c.createGain(),wet=c.createGain();dl.delayTime.value=.27;fb.gain.value=.28;wet.gain.value=.22;
  MUS.bus=c.createGain();MUS.bus.connect(MUS.master);MUS.bus.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(MUS.master);
  MUS.master.connect(c.destination);
  var nb=c.createBuffer(1,c.sampleRate*.5,c.sampleRate),d=nb.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;MUS.noise=nb;
  return true;
}
function voice(type,f,t,dur,gain){
  var c=MUS.ctx,g=c.createGain(),o=c.createOscillator(),lp=c.createBiquadFilter();lp.type='lowpass';
  if(type==='pluck'){o.type='triangle';lp.frequency.setValueAtTime(f*6,t);lp.frequency.exponentialRampToValueAtTime(f*1.5,t+.4);var o2=c.createOscillator();o2.type='sawtooth';o2.frequency.value=f*1.003;var g2=c.createGain();g2.gain.value=.25;o2.connect(g2);g2.connect(lp);o2.start(t);o2.stop(t+dur+.1)}
  else if(type==='reed'){o.type='square';lp.frequency.value=f*3.2}
  else if(type==='fiddle'||type==='flute'){o.type=type==='fiddle'?'sawtooth':'triangle';lp.frequency.value=type==='fiddle'?f*3.5:f*5;lp.Q.value=type==='fiddle'?2:.7;
    var lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=type==='fiddle'?5.6:4.8;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*(type==='fiddle'?.007:.004),t+.18);lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(t+dur+.1);
    if(type==='flute'){var o4=c.createOscillator();o4.type='sine';o4.frequency.value=f;var g4=c.createGain();g4.gain.value=.8;o4.connect(g4);g4.connect(lp);o4.start(t);o4.stop(t+dur+.1)}}
  else if(type==='bell'){o.type='sine';lp.frequency.value=8000;var o3=c.createOscillator();o3.type='sine';o3.frequency.value=f*2.01;var g3=c.createGain();g3.gain.setValueAtTime(.3,t);g3.gain.exponentialRampToValueAtTime(.001,t+dur*.6);o3.connect(g3);g3.connect(g);o3.start(t);o3.stop(t+dur+.1)}
  else if(type==='pad'){o.type='sine';lp.frequency.value=1800}
  else{o.type='triangle';lp.frequency.value=700}
  o.frequency.value=f;o.connect(lp);lp.connect(g);g.connect(MUS.bus);
  var a=type==='pad'?.35:type==='fiddle'?.035:type==='flute'?.06:.008;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+a);
  if(type==='pad'||type==='fiddle'||type==='flute'){g.gain.setValueAtTime(gain,t+Math.max(a+.01,dur-.12));g.gain.exponentialRampToValueAtTime(.0001,t+dur)}
  else g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.start(t);o.stop(t+dur+.05);
}
function drum(kind,t){
  var c=MUS.ctx,g=c.createGain();g.connect(MUS.bus);
  if(kind==='frame'||kind==='frameL'){var fo=c.createOscillator();fo.type='sine';fo.frequency.setValueAtTime(kind==='frame'?95:150,t);fo.frequency.exponentialRampToValueAtTime(kind==='frame'?52:90,t+.16);g.gain.setValueAtTime(kind==='frame'?.45:.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);fo.connect(g);fo.start(t);fo.stop(t+.24);
    var ns=c.createBufferSource(),bp=c.createBiquadFilter(),ng=c.createGain();ns.buffer=MUS.noise;bp.type='bandpass';bp.frequency.value=900;ng.gain.setValueAtTime(.06,t);ng.gain.exponentialRampToValueAtTime(.001,t+.05);ns.connect(bp);bp.connect(ng);ng.connect(MUS.bus);ns.start(t);ns.stop(t+.06);return}
  if(kind==='kick'){var o=c.createOscillator();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);o.start(t);o.stop(t+.22);return}
  var s=c.createBufferSource(),hp=c.createBiquadFilter();s.buffer=MUS.noise;hp.type='highpass';hp.frequency.value=kind==='hat'?7000:1500;s.connect(hp);hp.connect(g);
  var L=kind==='hat'?.03:.12;g.gain.setValueAtTime(kind==='hat'?.08:.22,t);g.gain.exponentialRampToValueAtTime(.001,t+L);s.start(t);s.stop(t+L+.02);
}
function musTick(){
  var c=MUS.ctx,Tk=TRACKS[MUS.cur];if(!Tk)return;
  if(MUS.next<c.currentTime-.4)MUS.next=c.currentTime+.05;
  while(MUS.next<c.currentTime+.15){
    var s=MUS.step%Tk.mel.length,t=MUS.next,bar=Math.floor(s/Tk.bar),inb=s%Tk.bar,nb=Tk.ch.length,bi=bar%nb;
    var m=Tk.mel[s];if(m){var hold=1;while(hold<4&&Tk.mel[(s+hold)%Tk.mel.length]===0)hold++;
      var dur=Tk.k==='bell'?Tk.sp*2.2:Tk.k==='reed'?Tk.sp*.9:(Tk.k==='fiddle'||Tk.k==='flute')?Tk.sp*hold*.95:Tk.sp*2.4;
      voice(Tk.k,mtof(m),t,dur,Tk.k==='reed'?.07:Tk.k==='fiddle'?.06:Tk.k==='flute'?.12:.16);
      if(Tk.lead2&&bar%4>=2)voice(Tk.lead2,mtof(m+12),t,Tk.sp*hold*.9,.05)}
    if(Tk.arp){var cd=Tk.ch[bi];voice('pluck',mtof(cd[inb%3]-12+(inb%Tk.bar===Tk.bar-1?12:0)),t,Tk.sp*2,.06)}
    if(Tk.bassAt.indexOf(inb)>=0)voice('bass',mtof(Tk.bass[bi%Tk.bass.length]),t,Tk.sp*(Tk.bar/Tk.bassAt.length)*.9,.22);
    if(inb===0)Tk.ch[bi].forEach(function(n){voice('pad',mtof(n),t,Tk.sp*Tk.bar,.035)});
    if(Tk.drum==='march'){if(inb%4===0)drum('kick',t);if(inb%4===2)drum('snare',t);drum('hat',t)}
    if(Tk.drum==='jig'){if(inb===0||inb===3)drum('frame',t);else if(inb===2||inb===5)drum('frameL',t)}
    if(Tk.drum==='reel'){if(inb%4===0)drum('frame',t);else if(inb%2===0)drum('frameL',t)}
    if(Tk.drum==='frame3'){if(inb===0)drum('frame',t);else if(inb===2||inb===4)drum('frameL',t)}
    if(Tk.drum==='giga'){if(inb===0||inb===3)drum('kick',t);if(inb===2||inb===5)drum('hat',t)}
    MUS.step++;MUS.next+=Tk.sp*((Tk.drum==='jig'||Tk.drum==='giga')&&inb%3===0?1.08:(Tk.drum==='jig'||Tk.drum==='giga')&&inb%3===1?.94:1);
  }
}
function musPlay(i){
  if(!musInit())return false;if(MUS.ctx.state==='suspended')MUS.ctx.resume();
  MUS.cur=i;MUS.step=0;MUS.next=MUS.ctx.currentTime+.08;clearInterval(MUS.timer);
  if(i>=0)MUS.timer=setInterval(musTick,30);return true;
}
function musVol(v){MUS.vol=v;if(MUS.master)MUS.master.gain.setTargetAtTime(MUS.mute?0:v*.5,MUS.ctx.currentTime,.05)}
function openJuke(){
  var el=$('juke');
  el.innerHTML='<h3>Il jukebox</h3><div class="jl">'+TRACKS.map(function(t,i){return '<button type="button" class="jt'+(MUS.cur===i?' on':'')+'" data-i="'+i+'"><span>'+(MUS.cur===i?'♫':'♪')+'</span>'+esc(t.n)+'</button>'}).join('')+
    '<button type="button" class="jt'+(MUS.cur<0?' on':'')+'" data-i="-1"><span>■</span>Silenzio</button></div>'+
    '<label class="jv">Volume <input type="range" min="0" max="100" value="'+Math.round(MUS.vol*100)+'" id="jvol"></label><button type="button" class="btn" id="jx">Chiudi</button>';
  [].forEach.call(el.querySelectorAll('.jt'),function(b){b.onclick=function(){E.setJuke(+b.dataset.i);openJuke()}});
  $('jvol').oninput=function(){musVol(this.value/100)};
  $('jx').onclick=function(){el.classList.remove('show');$('sbar').classList.add('show');$('chat').classList.add('show')};
  el.classList.add('show');$('sbar').classList.remove('show');$('chat').classList.remove('show');
}
