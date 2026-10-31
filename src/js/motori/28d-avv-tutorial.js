/* ---- Suggerimenti al tocco dell'Avventura (A10): il tutorial della prima sessione, a piccoli box e non a testi lunghi (motore puro). ----
   `ATUT` sa QUALE suggerimento mostrare: dato il contesto (la schermata e che cosa sta succedendo) e l'elenco di quelli già visti, `prossimo(c, memoria)` dà il primo ancora da vedere, oppure null.
   Mai più di uno alla volta. La vista (`app/24hl-tutorial.js`, `AvvTut`) lo disegna come una schedina con «Capito» e «Basta suggerimenti», e ricorda i visti sul telefono.
   Contesto: `contesto(sch, a, x)` lo legge dallo stato di `AVV` (o dalla sola campagna / battaglia di prova, `a` = null) e da ciò che la vista sa: x = { bat (stato di ASCO), pronto (anteprima in attesa di conferma), dia (RA.vista del dialogo) }.
   Memoria: { spento, sempre, visti:[id] } — `spento` = «Basta suggerimenti»; `sempre` = «Rivedi i suggerimenti» (compaiono anche dopo la prima sessione). Piano: docs/AVVENTURA-A10.md. */
const ATUT=(()=>{
 const CP=typeof CAMP!=='undefined'?CAMP:require('./28-campagna.js');
 const LU=typeof ALUO!=='undefined'?ALUO:require('./27n-avv-luoghi.js');
 const SC=typeof ASCO!=='undefined'?ASCO:require('./27i-avv-scontro.js');
 // schermate: mappa (campagna, anche dentro un sotterraneo) · battaglia · dialogo
 const SCHERMATE=['mappa','battaglia','dialogo'];
 // le condizioni, per nome (così l'elenco dei suggerimenti resta un dato)
 const COND={
  daTirare:c=>!c.dentro&&!c.fermo&&!c.tirato,
  daMuovere:c=>!c.dentro&&!c.fermo&&c.pmResto,
  perdizione:c=>!c.fermo&&(c.giorno>=2||c.perdizione>0),
  inLuogo:c=>!c.fermo&&c.inLuogo,
  notte:c=>!c.fermo&&c.notte,
  turnoEroe:c=>c.turnoEroe&&!c.pronto,
  anteprima:c=>c.turnoEroe&&c.pronto,
  provaVisibile:c=>c.provaVisibile,
  reazioni:c=>c.reazioni};
 // in ordine di priorità: il primo che vale e non è già stato visto
 const SUGGERIMENTI=[
  {id:'mappa-tira',sch:'mappa',cond:'daTirare',titolo:'Il movimento si tira',testo:'Ogni eroe tira il suo movimento a ogni giro: tocca «Tira d4». Con la Concentrazione tiri due dadi e tieni il migliore.'},
  {id:'mappa-muovi',sch:'mappa',cond:'daMuovere',titolo:'Dove andare',testo:'Tocca un esagono: vedi il cammino e quanto costa. Tocca «Vai» per partire. Strada e pianura costano poco, boschi e paludi di più.'},
  {id:'mappa-perdizione',sch:'mappa',cond:'perdizione',titolo:'La perdizione avanza',testo:'Sale di 3 a ogni alba e a 100 la campagna è persa. Santuari, taglie e covi ripuliti la fanno calare.'},
  {id:'mappa-luogo',sch:'mappa',cond:'inLuogo',titolo:'Un luogo con servizi',testo:'Qui puoi riposare, curarti, comprare e ascoltare la gente. Tocca «Luogo»: le scene della storia e la bacheca sono lì.'},
  {id:'mappa-notte',sch:'mappa',cond:'notte',titolo:'È scesa la notte',testo:'Di notte i nemici sono più forti. Cerca riparo: dormire in locanda o all\'accampamento fa passare al giorno dopo.'},
  {id:'bat-turno',sch:'battaglia',cond:'turnoEroe',titolo:'Il tuo turno',testo:'Hai un movimento, un\'azione e un\'azione bonus. Tocca «Attacca» o un esagono per muoverti; «Fine» chiude il turno.'},
  {id:'bat-tocco',sch:'battaglia',cond:'anteprima',titolo:'Prima guarda, poi conferma',testo:'Vedi cosa succederà (costo, probabilità di colpire). Il pulsante in basso conferma, «Annulla» ti fa cambiare idea.'},
  {id:'dia-prova',sch:'dialogo',cond:'provaVisibile',titolo:'Una prova',testo:'Le scelte con [Abilità %] sono prove: d20 più l\'abilità contro una CD. La percentuale è la probabilità di riuscire.'},
  {id:'dia-compagno',sch:'dialogo',cond:'reazioni',titolo:'I compagni ascoltano',testo:'Reagiscono a ciò che scegli. La loro approvazione cambia cosa ti dicono e se restano con te.'}];
 const ID=SUGGERIMENTI.map(s=>s.id);
 const vuota=()=>({spento:false,sempre:false,visti:[]});
 // ---- il contesto ----
 function contesto(sch,a,x){x=x||{};const c={sch,prima:!a||(a.racc&&(a.racc.sessioni|0)===0)};
  if(sch==='mappa'){const g=a?a.camp:x.camp;if(!g)return Object.assign(c,{fermo:true});const v=CP.vivi(g),e=v[0],l=e?CP.luogoDi(g,e):null;
   Object.assign(c,{dentro:!!g.dentro,fermo:!!(g.over||g.sfida||g.incontro||g.evento||(a&&(a.racc.scena||a.bat||a.fine))),tirato:v.some(h=>h.pm!=null),pmResto:v.some(h=>h.pm>0),
    giorno:g.giorno|0,perdizione:g.perdizione|0,notte:g.fase==='notte',inLuogo:!!l&&LU.servizi(l,g.giorno).length>0})}
  else if(sch==='battaglia'){const s=x.bat,att=s&&!s.over?SC.attore(s):null;
   Object.assign(c,{prima:!a||(a.racc&&(a.racc.sessioni|0)===0&&((a.sessione&&a.sessione.battaglie)|0)===0),turnoEroe:!!att&&att.lato==='eroi',pronto:!!x.pronto,giro:s?s.giro|0:0})}
  else if(sch==='dialogo'){const d=x.dia,sc=(d&&d.scelte)||[];Object.assign(c,{provaVisibile:sc.some(k=>k.prova&&k.ok),reazioni:!!(d&&d.reazioni&&d.reazioni.length)})}
  return c}
 // ---- quale ----
 function prossimo(c,mem){mem=Object.assign(vuota(),mem||{});if(!c||mem.spento||!SCHERMATE.includes(c.sch))return null;if(!c.prima&&!mem.sempre)return null;
  const s=SUGGERIMENTI.find(k=>k.sch===c.sch&&!mem.visti.includes(k.id)&&COND[k.cond](c));return s?s.id:null}
 const trova=id=>SUGGERIMENTI.find(k=>k.id===id)||null;
 // ---- la memoria (si salva sul telefono: stringa JSON) ----
 const visto=(mem,id)=>{const m=Object.assign(vuota(),mem||{});m.visti=m.visti.filter(x=>ID.includes(x));if(ID.includes(id)&&!m.visti.includes(id))m.visti=m.visti.concat(id);return m};
 const spegni=mem=>Object.assign(vuota(),mem||{},{spento:true});
 // «Rivedi»: si riparte da capo, anche dopo la prima sessione; si riaccendono
 const rivedi=()=>({spento:false,sempre:true,visti:[]});
 function leggi(testo){let m;try{m=JSON.parse(testo||'null')}catch(e){m=null}if(!m||typeof m!=='object')return vuota();
  return{spento:m.spento===true,sempre:m.sempre===true,visti:Array.isArray(m.visti)?m.visti.filter(x=>ID.includes(x)):[]}}
 const scrivi=mem=>JSON.stringify({spento:!!mem.spento,sempre:!!mem.sempre,visti:(mem.visti||[]).filter(x=>ID.includes(x))});
 // quanti ne restano da vedere (per «Rivedi» / il conto sulla pagina Avventura)
 const restano=mem=>{const m=Object.assign(vuota(),mem||{});return ID.filter(x=>!m.visti.includes(x)).length};
 return{SUGGERIMENTI,SCHERMATE,COND,ID,vuota,contesto,prossimo,trova,visto,spegni,rivedi,leggi,scrivi,restano}})();
if(typeof module!=='undefined')module.exports=ATUT;
