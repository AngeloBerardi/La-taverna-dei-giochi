/* ---- Bottino e botteghe dell'avventura (Cantari di Ventura). Regole pure; il catalogo è AOGG (27b-avv-oggetti.js). ----
   Bottino: oro + oggetti, dipendono dal livello di pericolo (1..5), dalla fonte (scrigno, nemico, ricompensa) e dall'ambiente.
   Botteghe: la scorta nasce dal seme della campagna e dal «periodo» (ogni 3 giorni cambia), quindi telefono, TV e test vedono la stessa merce.
   Compra a prezzo di listino, vendi a metà prezzo: le monete non si creano mai. L'oro è comune a tutta la compagnia (`s.oro`);
   gli oggetti stanno nello zaino di ogni eroe. Le funzioni che cambiano lo stato lo modificano sul posto e restituiscono {ok:true,…} o {err}
   (chi le chiama, CAMP.act, lavora già su una copia). */
const ABOT=(()=>{
 const O=typeof AOGG!=='undefined'?AOGG:require('./27b-avv-oggetti.js');
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const OG=O.OGG,GIORNI_RINNOVO=3,PERICOLO_MAX=5,RARE=['comune','rara','epica','leggendaria'];
 // peso di ogni rarità per livello di pericolo; gli oggetti hanno un livello minimo non oltre il doppio del pericolo
 const PESI_RA=[null,{comune:85,rara:15},{comune:70,rara:28,epica:2},{comune:50,rara:42,epica:8},{comune:30,rara:50,epica:18,leggendaria:2},{comune:15,rara:45,epica:32,leggendaria:8}];
 const PESI_CAT={scrigno:{arma:3,armatura:2,scudo:1,acc:3,cons:4},nemico:{arma:1,armatura:1,scudo:1,acc:1,cons:6},ricompensa:{arma:3,armatura:3,scudo:2,acc:4,cons:2}};
 const AMBIENTI={strada:{},bosco:{cons:2},antro:{arma:2,armatura:1.5},torre:{acc:2,cons:1.5},citta:{}};
 const ORO_FONTE={scrigno:2,nemico:1,ricompensa:3};
 const NEGOZI={fabbro:{nome:'Fabbro',cat:['arma','armatura','scudo'],n:4},emporio:{nome:'Emporio',cat:['acc','cons'],n:4}};
 const ER=err=>({err});
 // sceglie tra [[valore,peso]]
 function scegli(rnd,voci){const v=voci.filter(x=>x[1]>0),tot=v.reduce((a,x)=>a+x[1],0);let x=rnd()*tot;for(const e of v){if(x<e[1])return e[0];x-=e[1]}return v[v.length-1][0]}
 const adatti=(p,ra)=>O.ID.filter(i=>OG[i].slot!=='miss'&&OG[i].ra===ra&&OG[i].liv<=2*p);
 // un oggetto: rarità a sorte; se in quella rarità non c'è nulla di adatto si scende alla precedente
 function uno(rnd,p,fonte,amb){
  const cats=Object.entries(PESI_CAT[fonte]).map(([c,w])=>[c,w*(amb[c]||1)]);
  for(let k=RARE.indexOf(scegli(rnd,Object.entries(PESI_RA[p])));k>=0;k--){
   const per={};for(const i of adatti(p,RARE[k]))(per[OG[i].slot]=per[OG[i].slot]||[]).push(i);
   const voci=cats.filter(([c])=>per[c]&&per[c].length);if(!voci.length)continue;
   const lista=per[scegli(rnd,voci)];return lista[Math.floor(rnd()*lista.length)]}
  return null}
 // bottino: { oro, oggetti:[id] }. o = { pericolo:1..5, fonte:'scrigno'|'nemico'|'ricompensa', ambiente }
 function bottino(rnd,o){o=o||{};const p=Math.max(1,Math.min(PERICOLO_MAX,Math.floor(o.pericolo)||1)),fonte=PESI_CAT[o.fonte]?o.fonte:'scrigno',amb=AMBIENTI[o.ambiente]||{};
  const oro=Math.round((5+DAD.d(rnd,10))*p*ORO_FONTE[fonte]);
  const n=fonte==='scrigno'?1+(rnd()<.4?1:0):fonte==='nemico'?(rnd()<.35?1:0):1+(rnd()<.25?1:0);
  const oggetti=[];for(let i=0;i<n;i++){const id=uno(rnd,p,fonte,amb);if(id)oggetti.push(id)}
  return{oro,oggetti}}
 // mette il bottino nella campagna: oro comune, oggetti nello zaino dell'eroe in piedi con più posto; se non c'è posto l'oggetto si converte nel suo valore di vendita
 function assegna(s,b){s.oro+=b.oro;const presi=[],convertiti=[];
  for(const id of b.oggetti){let m=-1,best=0;s.eroi.forEach((h,i)=>{if(h.hp<=0)return;const l=O.MAX_ZAINO-(h.zaino||[]).length;if(l>best){best=l;m=i}});
   if(m<0){const v=prezzoVendita(id);s.oro+=v;convertiti.push(id);continue}
   (s.eroi[m].zaino||(s.eroi[m].zaino=[])).push(id);presi.push({id,eroe:m})}
  return{oro:b.oro,presi,convertiti}}
 const prezzoVendita=id=>OG[id]&&OG[id].vend!==false?Math.floor(OG[id].pr/2):0;
 const hashTesto=t=>[...t].reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,7);
 const periodoDi=giorno=>Math.floor((Math.max(1,giorno|0)-1)/GIORNI_RINNOVO);
 // scorta: la merce comune c'è sempre (qta null), 4 pezzi rari o epici ruotano ogni periodo (qta 1)
 function negozio(seed,giorno,tipo){const N=NEGOZI[tipo];if(!N)return null;const periodo=periodoDi(giorno);
  const h={rng:DAD.semina((seed>>>0)+Math.imul(periodo+1,7919)+hashTesto(tipo))},g=DAD.gen(h);
  const fissi=O.ID.filter(i=>OG[i].ra==='comune'&&N.cat.includes(OG[i].slot));
  let pool=O.ID.filter(i=>(OG[i].ra==='rara'||OG[i].ra==='epica')&&N.cat.includes(OG[i].slot));const ruotano=[];
  for(let k=0;k<N.n&&pool.length;k++){const id=scegli(g,pool.map(i=>[i,OG[i].ra==='rara'?3:1]));ruotano.push(id);pool=pool.filter(x=>x!==id)}
  const voce=(id,qta)=>({id,qta,pr:OG[id].pr});
  return{tipo,nome:N.nome,periodo,roba:fissi.map(id=>voce(id,null)).concat(ruotano.map(id=>voce(id,1)))}}
 // registro delle vendite del periodo corrente (si azzera quando la scorta cambia)
 function registro(s,tipo,periodo){s.negozi=s.negozi||{};let g=s.negozi[tipo];if(!g||g.p!==periodo)g=s.negozi[tipo]={p:periodo,v:{}};return g}
 // quanti pezzi restano (null = senza limite)
 function restano(s,n,voce){if(voce.qta==null)return null;const g=s.negozi&&s.negozi[n.tipo];return voce.qta-(g&&g.p===n.periodo?(g.v[voce.id]||0):0)}
 function compra(s,ie,tipo,id){const h=Number.isInteger(ie)&&s.eroi[ie];if(!h)return ER('Scegli un eroe');
  const n=negozio(s.seed,s.giorno,tipo);if(!n)return ER('Bottega sconosciuta');const v=n.roba.find(x=>x.id===id);if(!v)return ER('Non è in vendita');
  if(restano(s,n,v)===0)return ER('Esaurito');if(s.oro<v.pr)return ER('Servono '+v.pr+' monete');
  const z=h.zaino||(h.zaino=[]);if(z.length>=O.MAX_ZAINO)return ER('Lo zaino di '+h.nome+' è pieno');
  s.oro-=v.pr;z.push(id);const g=registro(s,tipo,n.periodo);g.v[id]=(g.v[id]||0)+1;return{ok:true,pr:v.pr}}
 function vendi(s,ie,id){const h=Number.isInteger(ie)&&s.eroi[ie];if(!h)return ER('Scegli un eroe');if(!OG[id])return ER('Oggetto sconosciuto');
  const z=h.zaino||[],i=z.indexOf(id);if(i<0)return ER('Non è nello zaino');if(OG[id].vend===false)return ER('Nessuno lo compra');
  const v=prezzoVendita(id);z.splice(i,1);s.oro+=v;return{ok:true,v}}
 return{GIORNI_RINNOVO,PERICOLO_MAX,NEGOZI,AMBIENTI,PESI_RA,PESI_CAT,bottino,assegna,prezzoVendita,periodoDi,negozio,restano,compra,vendi}})();
if(typeof module!=='undefined')module.exports=ABOT;
