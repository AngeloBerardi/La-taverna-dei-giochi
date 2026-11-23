/* ---- Musica e suoni della Compagnia di ventura (V7): che cosa suonare e quando (motore puro, senza AudioContext). ----
   Formato di tracce e partiture: quello di `AAUD` (motori/28c-avv-audio.js, intestazione); le opzioni dell'oscillatore (sl, lp…) stanno sulla nota stessa, come le legge `suonaFx` in 03-audio.js.
   Quattro temi (viaggio, notte, città, battaglia), due motivi brevi (vittoria, sconfitta) e i suoni del mondo e del campo, scelti da tabelle:
   `contesto(s,inCampo,notte)` → `traccia(ctx)`; `mondo(ev)` (eventi di VEN.passo), `campo(ev,capId)` (eventi di un istante di VCAM), `fai(verbo)` (azioni di VEN.fai), `ordine(o,cavallo)` (VEN.ordina).
   Ogni funzione rende `[{n,r}]` (n = nome del suono, r = ritardo in ms), senza doppioni. Una voce di tabella è un nome, `null` (silenzio voluto) o una funzione dell'evento.
   La vista (`app/24hy-ven-audio.js`, `VenAudio`) suona e applica `PAUSA` (ms minimi tra due suoni uguali). Niente Math.random: il rumore nasce dentro `Snd`. */
const VAUD=(()=>{
 // ---- i temi: otto battute, re dorico o la minore, la melodia chiude sulla radice ----
 const TRACCE={
  'ven-viaggio':{sd:.15,bar:8,prog:[[50,0],[48,1],[45,0],[50,0],[53,1],[48,1],[45,0],[50,0]],arp:[0,2,1,2,3,2,1,2],lead:'flute',drum:'march',
   mel:[[62,0,65,69,0,67,65,0],[64,0,67,72,0,71,67,0],[69,0,72,71,69,0,64,0],[65,64,62,0,0,0,57,0],[65,0,69,72,0,74,72,0],[72,0,71,67,0,64,67,0],[69,0,67,64,0,60,64,0],[62,0,0,0,0,0,0,0]]},
  // notte e accampamento: campane rade sul re dorico, due note al più per battuta
  'ven-notte':{sd:.22,bar:6,prog:[[50,0],[43,1],[48,1],[45,0],[50,0],[41,1],[43,1],[50,0]],arp:[0,1,2,3,2,1],lead:'bell',drum:'tav',
   mel:[[74,0,0,77,0,0],[71,0,0,74,0,0],[72,0,0,0,76,0],[69,0,0,72,0,0],[74,0,0,0,81,0],[77,0,0,72,0,0],[71,0,0,74,0,0],[62,0,0,0,0,0]]},
  // città: liuto in do maggiore, fitto come un mercato
  'ven-citta':{sd:.14,bar:6,prog:[[48,1],[53,1],[55,1],[48,1],[45,0],[53,1],[55,1],[48,1]],arp:[0,2,1,3,2,1],lead:'pluck',drum:'tav',
   mel:[[60,64,67,64,72,0],[65,69,72,69,65,0],[67,71,74,71,67,0],[64,67,72,67,64,0],[69,72,76,72,69,0],[65,0,69,72,69,65],[67,71,74,0,71,67],[72,0,0,0,0,0]]},
  // battaglia: ottoni in la minore, il mi maggiore della minore armonica a metà
  'ven-battaglia':{sd:.12,bar:8,prog:[[45,0],[43,1],[41,1],[40,1],[45,0],[48,1],[43,1],[45,0]],arp:[0,1,2,3,4,3,2,1],lead:'brass',drum:'epic',
   mel:[[69,0,72,0,76,0,72,69],[67,0,71,0,74,0,71,0],[65,0,69,0,72,0,77,0],[68,0,71,0,76,0,71,0],[69,0,0,72,76,0,81,0],[79,0,76,0,72,0,67,0],[71,0,74,0,79,0,74,0],[69,0,0,0,0,0,0,0]]}};
 // ---- i suoni a partitura ----
 const N=(t,d,v,f,ty,sw)=>Object.assign({k:'noise',t,d,v,f,ty},sw?{sw}:{}),O=(w,f,t,d,v,o)=>Object.assign({k:'osc',w,f,t,d,v},o||{}),
  T=(f,t,v)=>({k:'timp',f,t,v}),BR=(m,t,v,d)=>({k:'brass',m,t,v,d}),FL=(m,t,v,d)=>({k:'flute',m,t,v,d}),PD=(m,t,d,v)=>({k:'pad',m,t,d,v});
 const SUONI={
  'ven-passi':[N(0,.05,.14,380,'lowpass'),O('sine',90,0,.06,.1,{sl:60}),N(.18,.05,.12,420,'lowpass'),O('sine',100,.18,.06,.09,{sl:65})],
  'ven-zoccoli':[N(0,.03,.16,1800,'bandpass'),O('triangle',420,0,.04,.08,{sl:300}),N(.11,.03,.14,1500,'bandpass'),O('triangle',360,.11,.04,.07,{sl:260}),N(.3,.03,.12,1700,'bandpass'),N(.41,.03,.11,1400,'bandpass')],
  'ven-mercato':[N(0,.35,.08,900,'bandpass',1400),O('square',1300,.05,.05,.05,{lp:4000}),O('square',1700,.12,.05,.04,{lp:4000}),N(.2,.25,.06,700,'bandpass')],
  'ven-moneta':[O('square',1500,0,.06,.06,{lp:5000}),O('sine',2400,.05,.25,.06),O('sine',3100,.1,.3,.04),N(0,.04,.1,6000,'highpass')],
  'ven-porta':[O('sawtooth',140,0,.35,.07,{sl:200,lp:520}),N(.35,.15,.2,260,'lowpass'),O('sine',70,.35,.25,.15,{sl:45})],
  'ven-alba':[FL(74,0,.06,.25),FL(79,.2,.06,.25),FL(83,.4,.05,.35)],
  'ven-corno':[BR(50,0,.12,.6),BR(57,0,.08,.6),O('sawtooth',147,0,.6,.04,{lp:900})],
  'ven-cozzo':[N(0,.06,.25,3200,'bandpass'),O('square',520,0,.12,.08,{sl:300,lp:2500}),O('sine',1400,0,.3,.06)],
  'ven-freccia':[N(0,.2,.12,2500,'bandpass',700),O('sine',900,0,.15,.04,{sl:400}),N(.2,.04,.15,1800,'bandpass')],
  'ven-grido':[O('sawtooth',260,0,.4,.08,{sl:180,lp:1200}),O('sawtooth',330,0,.4,.06,{sl:220,lp:1200}),N(0,.4,.08,900,'bandpass')],
  'ven-rotta':[BR(55,0,.1,.3),BR(50,.25,.1,.5),N(0,.6,.1,500,'lowpass',200)],
  'ven-vittoria':[BR(62,0,.1,.25),BR(66,.2,.1,.25),BR(69,.4,.1,.25),BR(74,.6,.12,.7),T(73,.3,.6)],
  'ven-sconfitta':[PD([45,48,52],0,1.8,.03),FL(76,0,.06,.5),FL(72,.5,.06,.5),FL(69,1,.06,.8)]};
 // il tappeto della mischia (passo 37), a tre livelli: rumore basso e ferri che crescono con i colpi dell'ultimo secondo. Li registra la vista del campo (`Snd.fx`), dura ognuno meno di un secondo
 const TAPPETO={
  'ven-mischia-1':[N(0,.9,.05,380,'lowpass',200),N(.3,.04,.05,2200,'bandpass')],
  'ven-mischia-2':[N(0,.9,.08,500,'lowpass',300),N(.15,.04,.08,2600,'bandpass'),N(.5,.04,.07,2000,'bandpass'),O('sine',70,0,.5,.08,{sl:50})],
  'ven-mischia-3':[N(0,.9,.11,600,'lowpass',400),N(.1,.04,.1,3000,'bandpass'),N(.35,.04,.1,2400,'bandpass'),N(.6,.04,.09,2800,'bandpass'),O('sine',60,0,.7,.12,{sl:40}),O('square',480,.2,.08,.04,{sl:300,lp:2500})]};
 const ESISTENTI=['err','sel','ok'];
 const PAUSA={'ven-cozzo':120,'ven-freccia':180,'ven-corno':900,'ven-passi':400,'ven-zoccoli':400};
 const MAX_CAMPO=3;
 // ---- le tabelle ----
 const LOG={'':null,bene:null,male:null,guerra:'ven-corno'};
 const MONDO={incontro:'ven-corno',dentro:'ven-porta',davanti:'ven-porta',giorno:'ven-alba',log:e=>LOG[e.tipo||'']||null,
  conquista:e=>e.faz==='tu'?'ven-vittoria':null,esito:e=>e.out&&e.out.vince==='a'?'ven-vittoria':'ven-sconfitta',vittoria:'ven-vittoria',regno:'ven-vittoria',
  scoperta:'ok',passa:'ok',libero:null,'fine-attesa':null,
  compagno:e=>e.via?null:'ok','corona-cade':'ven-sconfitta',voce:null};
 const CAMPO={colpo:(e,cap)=>e.dan>0&&!e.freccia&&(e.crit||e.carica||(cap!=null&&(e.da===cap||e.a===cap)))?'ven-cozzo':null,
  tiro:'ven-freccia',ko:e=>e.cap?'ven-grido':null,'cap-ko':'ven-grido',grido:'ven-corno',rinforzi:'ven-corno',
  ordine:e=>e.l==='a'&&e.o==='carica'?'ven-corno':null,rotta:'ven-rotta',fine:e=>e.vince==='a'?'ven-vittoria':'ven-sconfitta',
  ariete:null,scala:'ven-passi',porta:'ven-porta',mischia:e=>e.liv>0?'ven-mischia-'+Math.min(3,e.liv|0):null};
 const tutti=(l,v)=>Object.fromEntries(l.map(k=>[k,v]));
 const FAI=Object.assign(tutti(['compra','vendi'],'ven-mercato'),
  tutti(['compraogg','vendiogg','riscatta','consegna','torneo','ritira','pace','cura','benedizione','voci','riposa','imbarca'],'ven-moneta'),
  tutti(['recluta','assolda','compagno','guarnigione'],'ven-passi'),tutti(['assedia','assalta','lizza','razzia','dichiara'],'ven-corno'),{fonda:'ven-vittoria'},
  tutti(['promuovi','abilita','investi','feudo','giura','contratto','incarico','proponi','liberasig'],'ok'),tutti(['equipa','togli'],'sel'),{esci:'ven-porta'},
  tutti(['aduna','rompi','lascia','libera','congeda'],null));
 const ORDINE={vai:(o,cav)=>cav?'ven-zoccoli':'ven-passi',entra:(o,cav)=>cav?'ven-zoccoli':'ven-passi',segui:(o,cav)=>cav?'ven-zoccoli':'ven-passi',aspetta:null,ferma:null};
 // in battaglia, se gli eventi chiedono più suoni del massimo, passano prima quelli che contano
 const PESO=['ven-vittoria','ven-sconfitta','ven-rotta','ven-grido','ven-corno','ven-porta','ven-cozzo','ven-freccia','ven-passi','ven-mischia-3','ven-mischia-2','ven-mischia-1'];
 const voce=(v,...a)=>typeof v==='function'?v(...a):v;
 const aggiungi=(o,n,r)=>{if(n&&!o.some(x=>x.n===n))o.push({n,r:r||0})};
 function contesto(s,inCampo,notte){if(inCampo)return'battaglia';if(s&&s.dentro>=0)return'citta';
  const tu=s&&s.p&&s.p[0];if(notte||(tu&&tu.ord&&tu.ord.t==='aspetta'))return'notte';return'viaggio'}
 const traccia=ctx=>'ven-'+(ctx||'viaggio');
 // i colpi dell'ultimo secondo → livello del tappeto: 0 niente, 1 scaramuccia, 2 mischia, 3 mischia piena
 const livelloMischia=n=>n>=14?3:n>=6?2:n>=2?1:0;
 function mondo(ev){const o=[];for(const e of ev||[])if(e&&Object.prototype.hasOwnProperty.call(MONDO,e.t))aggiungi(o,voce(MONDO[e.t],e));return o}
 function campo(ev,capId){const o=[];for(const e of ev||[])if(e&&Object.prototype.hasOwnProperty.call(CAMPO,e.t))aggiungi(o,voce(CAMPO[e.t],e,capId));
  if(o.length>MAX_CAMPO)o.sort((a,b)=>PESO.indexOf(a.n)-PESO.indexOf(b.n));return o.slice(0,MAX_CAMPO)}
 function fai(verbo){const o=[];if(Object.prototype.hasOwnProperty.call(FAI,verbo))aggiungi(o,FAI[verbo]);return o}
 function ordine(o,cavallo){const l=[],t=o&&(o.t||o);if(Object.prototype.hasOwnProperty.call(ORDINE,t))aggiungi(l,voce(ORDINE[t],o,!!cavallo));return l}
 return{TRACCE,SUONI,TAPPETO,ESISTENTI,PAUSA,MAX_CAMPO,LOG,MONDO,CAMPO,FAI,ORDINE,livelloMischia,contesto,traccia,mondo,campo,fai,ordine}})();
if(typeof module!=='undefined')module.exports=VAUD;
