/* ---- Musica e suoni dell'Avventura (A10): che cosa suonare e quando (motore puro, senza AudioContext). ----
   Qui stanno i DATI: otto tracce nel formato di `Snd` (app/03-audio.js: `Snd.def`), suoni a «partitura» (liste di note primitive, `Snd.fx`) e le regole che dicono quale traccia e quali
   suoni servono: `traccia(contesto)`, `passo(passo di ACRO.effetti)`, `azione(azione di AVV, stato prima, stato dopo)`. La vista (`app/24hk-audio-avv.js`, `AvvAudio`) si limita a suonare.
   Niente Math.random: il rumore dei suoni nasce dentro `Snd`, come per tutti i giochi. Piano e tabelle: docs/AVVENTURA-A10.md.
   Tracce: {sd, bar, prog:[[radice MIDI, 1=maggiore|0=minore]], arp:[indice 0–4 per passo], lead:'bell'|'pluck'|'flute'|'brass', drum:'tav'|'march'|'anvil'|'epic', mel:[8 battute × bar note, 0 = pausa]}.
   Il flauto e il liuto suonano la melodia un'ottava sopra la tabella; campane e ottoni come scritta.
   Partiture (le legge `suonaFx` in 03-audio.js): {k:'osc',w,f,t,d,v, sl?,slt?,lp?,lpE?,det?,at?} · {k:'noise',t,d,v,f,ty,sw?} · {k:'bell'|'pluck',m,t,v} · {k:'flute'|'brass',m,t,v,d} · {k:'timp',f,t,v} · {k:'pad',m:[…],t,d,v}
   (t = ritardo in s, m = nota MIDI, f = Hz; sl = Hz a cui scivola, lp = taglio passa-basso, sw = Hz a cui scivola il filtro del rumore). */
const AAUD=(()=>{
 const CP=typeof CAMP!=='undefined'?CAMP:require('./28-campagna.js');
 const AV=typeof AVV!=='undefined'?AVV:require('./28a-avv-orchestratore.js');
 const BE=typeof BEST!=='undefined'?BEST:require('./27f-avv-bestiario.js');
 // ---- le tracce ----
 const TRACCE={
  'avv-giorno':{sd:.16,bar:6,prog:[[55,1],[48,1],[50,1],[52,0],[55,1],[48,1],[50,1],[55,1]],arp:[0,1,2,3,2,1],lead:'flute',drum:'tav',
   mel:[[67,0,71,74,0,71],[72,0,76,0,74,72],[74,0,78,76,0,74],[71,0,76,0,74,71],[74,0,76,0,74,71],[72,0,76,0,72,67],[69,0,74,78,0,74],[67,0,0,0,0,0]]},
  'avv-notte':{sd:.21,bar:6,prog:[[45,0],[41,1],[43,1],[45,0],[45,0],[40,0],[41,1],[40,0]],arp:[0,2,1,3,1,2],lead:'bell',drum:'tav',
   mel:[[76,0,0,72,0,0],[72,0,0,77,0,0],[74,0,0,71,0,0],[69,0,72,0,76,0],[76,0,0,81,0,79],[76,0,0,71,0,0],[77,0,0,72,0,69],[71,0,0,0,0,0]]},
  'avv-citta':{sd:.15,bar:6,prog:[[50,1],[55,1],[57,1],[50,1],[47,0],[55,1],[57,1],[50,1]],arp:[0,2,1,3,2,1],lead:'pluck',drum:'tav',
   mel:[[62,66,69,66,74,69],[67,71,74,71,67,0],[69,73,76,73,69,0],[66,69,74,69,66,0],[66,71,74,71,66,62],[67,71,74,0,71,67],[69,73,76,0,73,69],[74,0,69,0,0,0]]},
  'avv-sotterraneo':{sd:.2,bar:6,prog:[[40,0],[36,1],[38,0],[35,0],[40,0],[36,1],[35,0],[40,0]],arp:[0,2,1,3,1,2],lead:'bell',drum:'march',
   mel:[[0,0,0,64,0,0],[0,0,67,0,0,63],[0,0,62,0,65,0],[0,0,0,59,0,0],[64,0,0,0,67,0],[0,0,72,0,0,67],[0,0,0,71,0,0],[64,0,0,0,0,0]]},
  'avv-battaglia':{sd:.12,bar:8,prog:[[45,0],[41,1],[43,1],[45,0],[45,0],[41,1],[40,0],[43,1]],arp:[0,1,2,3,4,3,2,1],lead:'brass',drum:'epic',
   mel:[[69,0,69,72,0,76,0,72],[65,0,65,69,0,72,0,69],[67,0,67,71,0,74,0,71],[69,0,72,0,76,0,81,0],[69,0,69,72,0,76,0,79],[77,0,72,0,69,0,65,0],[76,0,71,0,67,0,64,0],[71,0,74,0,0,0,0,0]]},
  'avv-capo':{sd:.13,bar:8,prog:[[38,0],[39,1],[38,0],[34,1],[38,0],[39,1],[41,1],[37,1]],arp:[0,1,2,3,4,3,2,1],lead:'brass',drum:'anvil',
   mel:[[62,0,62,0,65,0,62,0],[63,0,63,0,67,0,63,0],[62,0,62,65,0,69,0,65],[58,0,58,0,62,0,65,0],[62,0,62,0,65,0,69,0],[63,0,67,0,70,0,67,0],[65,0,69,0,72,0,69,0],[61,0,65,0,0,0,0,0]]},
  'avv-vittoria':{sd:.15,bar:6,prog:[[50,1],[55,1],[57,1],[50,1],[55,1],[50,1],[57,1],[50,1]],arp:[0,1,2,3,2,1],lead:'bell',drum:'march',
   mel:[[74,0,78,81,0,78],[79,0,83,0,86,83],[81,0,85,88,0,85],[78,0,81,0,86,0],[83,0,86,0,83,79],[78,0,81,86,0,81],[85,0,81,0,88,0],[86,0,0,0,0,0]]},
  'avv-sconfitta':{sd:.26,bar:4,prog:[[45,0],[43,1],[41,1],[40,0],[45,0],[41,1],[40,0],[45,0]],arp:[0,2,1,3],lead:'flute',drum:'tav',
   mel:[[64,0,0,60],[62,0,0,59],[60,0,0,57],[59,0,0,55],[64,0,60,0],[60,0,57,0],[59,0,0,0],[57,0,0,0]]}};
 // ---- i suoni ----
 const N=(t,d,v,f,ty,sw)=>Object.assign({k:'noise',t,d,v,f,ty},sw?{sw}:{}),O=(w,f,t,d,v,o)=>Object.assign({k:'osc',w,f,t,d,v},o?{o}:{}),B=(m,t,v)=>({k:'bell',m,t,v}),T=(f,t,v)=>({k:'timp',f,t,v}),
  BR=(m,t,v,d)=>({k:'brass',m,t,v,d}),FL=(m,t,v,d)=>({k:'flute',m,t,v,d}),PD=(m,t,d,v)=>({k:'pad',m,t,d,v});
 const tick=(i,n)=>[N(i,.04,.12,2400+n*500,'bandpass'),O('triangle',520-n*40,i,.05,.05)];
 const SUONI={
  'avv-passo':[N(0,.06,.14,350,'lowpass'),O('sine',95,0,.07,.12,{sl:60})],
  'avv-passo2':[N(0,.06,.13,450,'lowpass'),O('sine',110,0,.07,.1,{sl:70})],
  'avv-d20':[...[0,.05,.1,.17,.26,.38].flatMap((t,n)=>tick(t,n)),O('square',300,.44,.08,.08,{sl:180}),N(.44,.05,.12,1800,'bandpass')],
  'avv-colpo-taglio':[N(0,.22,.28,3000,'bandpass',600),O('sawtooth',600,0,.18,.07,{sl:150}),N(.12,.08,.2,2200,'bandpass'),O('sine',2200,.1,.35,.05)],
  'avv-colpo-perforante':[N(0,.05,.25,4500,'bandpass'),O('triangle',1900,0,.06,.12,{sl:700}),T(120,.03,.35),N(.03,.1,.12,900,'lowpass')],
  'avv-colpo-contundente':[T(65,0,.7),N(0,.18,.3,140,'lowpass'),O('square',130,0,.15,.08,{sl:55}),N(.06,.12,.12,600,'bandpass')],
  'avv-parata':[O('square',440,0,.5,.08,{lp:2200}),O('sine',1180,0,.7,.12),O('sine',1900,0,.4,.06),N(0,.06,.15,4000,'highpass')],
  'avv-mancato':[N(0,.18,.16,1500,'bandpass',500),O('sine',300,0,.12,.04,{sl:180})],
  'avv-critico':[T(55,0,.8),N(0,.2,.32,2500,'highpass'),B(88,.04,.12),B(95,.1,.1),BR(62,.14,.09,.5),BR(69,.14,.07,.5)],
  'avv-incanto-fuoco':[N(0,.5,.22,400,'lowpass',2400),O('sawtooth',110,0,.5,.1,{sl:330,lp:700}),...[.18,.24,.3,.37,.44].map(t=>N(t,.02,.07,3500,'highpass')),T(60,.05,.4)],
  'avv-incanto-gelo':[B(96,0,.1),B(100,.06,.09),B(103,.12,.08),N(0,.35,.1,7000,'highpass'),O('sine',2800,0,.5,.05,{sl:1800})],
  'avv-incanto-fulmine':[N(0,.07,.35,4000,'highpass'),O('square',95,0,.4,.12,{sl:38,lp:600}),N(.05,.5,.18,900,'lowpass'),O('sawtooth',1500,.02,.12,.06,{sl:200}),T(48,.04,.5)],
  'avv-incanto-necrotico':[PD([40,43,46],0,1.2,.03),O('sawtooth',100,0,1,.1,{sl:50,lp:500}),N(0,.9,.1,250,'lowpass'),B(52,.2,.08)],
  'avv-incanto-radioso':[B(79,0,.1),B(83,.07,.1),B(86,.14,.1),B(91,.21,.1),PD([67,71,74],0,1.2,.02),N(0,.25,.05,8000,'highpass')],
  'avv-incanto-veleno':[O('sine',220,0,.14,.1,{sl:420}),O('sine',300,.12,.14,.09,{sl:560}),O('sine',180,.26,.16,.1,{sl:360}),N(0,.5,.08,700,'bandpass',300),O('sawtooth',90,0,.45,.05,{lp:400})],
  'avv-stato':[B(84,0,.07),B(91,.08,.06),N(0,.15,.05,6000,'highpass')],
  'avv-cade':[T(60,0,.55),N(0,.25,.22,200,'lowpass'),O('sine',140,0,.3,.12,{sl:50})],
  'avv-porta':[O('sawtooth',130,0,.45,.07,{sl:190,lp:520}),O('sawtooth',185,.2,.4,.06,{sl:120,lp:520}),T(70,.5,.5),N(.5,.2,.18,300,'lowpass')],
  'avv-scrigno':[N(0,.04,.25,3500,'bandpass'),O('square',900,0,.04,.08),O('sawtooth',160,.1,.35,.06,{sl:250,lp:600}),B(79,.5,.1),B(84,.57,.1),B(88,.64,.1),B(91,.71,.1),N(.5,.3,.08,7000,'highpass')],
  'avv-livello':[...[60,64,67,72,76,79,84].map((m,i)=>B(m,i*.08,i<5?.1:i===5?.12:.14)),BR(62,.5,.08,.7),BR(69,.5,.06,.7),PD([60,64,67],0,1.5,.02)],
  'avv-alba':[FL(74,0,.07,.5),FL(79,.22,.07,.5),FL(83,.44,.07,.5),FL(86,.66,.08,.9),B(98,.7,.05)],
  'avv-compagno':[B(72,0,.1),B(79,.12,.1),B(84,.26,.1),PD([60,67],0,1,.02)],
  'avv-missione':[BR(62,0,.09,.25),BR(69,.18,.09,.25),BR(74,.36,.1,.5),B(86,.4,.08)],
  'avv-vita':[B(48,0,.22),O('sine',131,0,2,.12),PD([45,48,52],0,1.6,.03),B(45,.8,.14)],
  'avv-fanfara':[BR(62,0,.1,.3),BR(66,.14,.1,.3),BR(69,.28,.1,.3),BR(74,.42,.12,.9),T(74,0,.5),T(74,.42,.6),B(86,.5,.08),B(90,.58,.08)],
  'avv-lamento':[PD([50,53,57],0,2.4,.03),BR(57,0,.07,.7),BR(53,.4,.07,.7),BR(50,.8,.07,1),O('sine',55,1.1,2,.25)]};
 // un tipo di danno → il suo suono (`ASTA.TIPI`): fisici = colpo, gli altri = incanto
 const TIPO_SUONO={taglio:'avv-colpo-taglio',perforante:'avv-colpo-perforante',contundente:'avv-colpo-contundente',fuoco:'avv-incanto-fuoco',gelo:'avv-incanto-gelo',fulmine:'avv-incanto-fulmine',
  necrotico:'avv-incanto-necrotico',radioso:'avv-incanto-radioso',veleno:'avv-incanto-veleno'};
 // suoni che l'app ha già in `Snd.play` e che si riusano così come sono (il test controlla che ci siano)
 const ESISTENTI=['heal','coin','sel','ok','err'];
 // ---- quale traccia ----
 // c = { fase (di AVV), notte, luogo (tipo del luogo dove sta il gruppo), dentro (in un sotterraneo), capo (battaglia con un capo), esito ('vittoria'|'sconfitta'|null) }
 function traccia(c){c=c||{};
  if(c.esito==='vittoria')return'avv-vittoria';if(c.esito==='sconfitta')return'avv-sconfitta';
  if(c.fase==='battaglia')return c.capo?'avv-capo':'avv-battaglia';
  if(c.dentro||c.fase==='sotterraneo')return'avv-sotterraneo';
  if(c.fase==='citta'||c.luogo==='citta'||c.luogo==='villaggio')return'avv-citta';
  return c.notte?'avv-notte':'avv-giorno'}
 // il contesto da uno stato di AVV (`a`) e, se c'è, dalla battaglia in corso (`bat` = stato di ASCO). Senza stato (battaglia di prova) basta {fase:'battaglia'} e `bat`.
 function contesto(a,bat){const capo=!!(bat&&bat.cb&&bat.cb.some(x=>x.lato==='nemici'&&BE.M[x.def]&&BE.M[x.def].capo));
  const be=bat&&bat.over?(bat.over.esito==='vittoria'?'vittoria':bat.over.esito==='sconfitta'?'sconfitta':null):null;
  if(!a)return{fase:bat?'battaglia':'mappa',notte:false,luogo:null,dentro:false,capo,esito:be};
  const c=a.camp,e=CP.vivi(c)[0],l=e?CP.luogoDi(c,e):null,fine=a.fine?(a.fine.vinta?'vittoria':'sconfitta'):null;
  return{fase:bat?'battaglia':AV.fase(a),notte:c.fase==='notte',luogo:l?l.tipo:null,dentro:!!c.dentro,capo,esito:fine||be}}
 // ---- suoni di un passo di battaglia (ACRO.effetti) → [{ n: suono, r: ritardo in ms a velocità 1× }] ----
 function passo(x){const o=[];if(!x)return o;
  switch(x.t){
   case'sposta':{const n=Math.min(4,(x.passi||[]).length||1);for(let i=0;i<n;i++)o.push({n:i%2?'avv-passo2':'avv-passo',r:i*150});break}
   case'dado':o.push({n:'avv-d20',r:0});
    if(x.salvezza){if(x.ok)o.push({n:'avv-parata',r:450})}else if(x.crit&&x.ok)o.push({n:'avv-critico',r:450});else if(!x.ok)o.push({n:'avv-mancato',r:450});break;
   case'numero':if(x.v>0)o.push({n:x.tipo==='temp'?'avv-parata':'heal',r:0});else if(x.v<0&&TIPO_SUONO[x.tipo])o.push({n:TIPO_SUONO[x.tipo],r:0});break;
   case'stato':if(x.ok)o.push({n:'avv-stato',r:0});break;
   case'cade':o.push({n:'avv-cade',r:0});break;
   case'esce':if(x.come==='muore')o.push({n:'avv-cade',r:0});break;
   case'fine':if(x.esito==='vittoria')o.push({n:'avv-fanfara',r:0});else if(x.esito==='sconfitta')o.push({n:'avv-lamento',r:0});break}
  return o}
 // ---- suoni di un'azione di AVV, guardando com'è cambiato lo stato ----
 const livelli=s=>s.camp.eroi.reduce((t,e)=>t+(e.liv|0),0),oggetti=s=>s.camp.eroi.reduce((t,e)=>t+(e.zaino||[]).length+(e.cintura||[]).length+Object.keys(e.equip||{}).filter(k=>e.equip[k]).length,0);
 const missioni=s=>Object.keys(s.racc.missioni||{}).map(k=>k+':'+s.racc.missioni[k].stato).sort().join('|');
 const RACCOGLIE=new Set(['avanza','risolvi','scegli','entra','fuggi']);   // azioni della mappa che possono far trovare qualcosa
 function azione(az,p,d){const o=[],add=(n,r)=>o.push({n,r:r|0});if(!az||!p||!d)return o;const t=az.t,a=az.a||{};let monete=false;
  if(t==='camp')switch(a.t){
   case'muovi':add('avv-passo',0);add('avv-passo2',160);add('avv-passo',320);break;
   case'tira':case'risolvi':add('avv-d20',0);break;
   case'entra':case'esci':case'avanza':add('avv-porta',0);break;
   case'lungo':if(d.camp.giorno>p.camp.giorno)add('avv-alba',200);break;
   case'cura':case'rialza':case'prega':case'breve':add('heal',0);break;
   case'compra':case'vendi':case'taglia':add('coin',0);monete=true;break;
   case'equipa':case'togli':case'cintura':case'zaino':case'usa':case'passa':case'scegli':add('sel',0);break}
  // una prova del racconto: dado e poi esito
  const u=d.racc.ultima;if((t==='racconto'||t==='scena'||t==='parla')&&u&&JSON.stringify(u)!==JSON.stringify(p.racc.ultima)){add('avv-d20',0);add(u.critico?'avv-critico':u.ok?'ok':'err',450)}
  if(d.vite<p.vite)add('avv-vita',300);
  if(livelli(d)>livelli(p))add('avv-livello',500);
  if(d.camp.eroi.length>p.camp.eroi.length)add('avv-compagno',400);
  if(missioni(d)!==missioni(p)&&t!=='camp')add('avv-missione',400);
  const raccoglie=t==='camp'?RACCOGLIE.has(a.t):t!=='compagnia'&&t!=='chiudi';
  if(raccoglie&&oggetti(d)>oggetti(p))add('avv-scrigno',600);
  else if(!monete&&d.camp.oro>p.camp.oro&&t!=='compagnia')add('coin',600);
  return o}
 return{TRACCE,SUONI,TIPO_SUONO,ESISTENTI,traccia,contesto,passo,azione}})();
if(typeof module!=='undefined')module.exports=AAUD;
