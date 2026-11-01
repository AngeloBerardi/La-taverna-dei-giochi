/* ---- Rientro sull'account (A9): ciò che la campagna ha dato agli eroi torna alla loro scheda, a tappe che le regole di Firestore accettano (motore puro). ----
   Gli eroi dell'account sono prestati alla campagna: `conto.iniziale` ricorda XP e livello di partenza, `conto.oroIniziale` l'oro in comune di partenza e `conto.accreditato[slot]` quanto è già tornato.
   Quello che resta da riscuotere è la differenza (`pendente`); una scrittura ne porta al massimo `EROI.LIMITI` (800 XP, 1000 oro) e, se guadagna, aspetta `EROI.LIMITI.attesaS` secondi dalla precedente:
   `tappa` dice quanto, `applica` costruisce la scheda aggiornata, `accredita` registra la tappa nello stato (si salva insieme alla scheda, con una sola scrittura). I compagni non toccano mai l'account.
   Zaino, cintura e oggetti indossati tornano come sono in campagna; i PF tornano al massimo; i poteri e i talenti da scegliere restano da scegliere («Gestisci gli eroi»). Piano: docs/AVVENTURA-A9.md. */
const ARIE=(()=>{
 const ER=typeof EROI!=='undefined'?EROI:require('./27-eroi.js');
 const AO=typeof AOGG!=='undefined'?AOGG:require('./27b-avv-oggetti.js');
 const LIM=ER.LIMITI;
 const copia=x=>JSON.parse(JSON.stringify(x));
 const account=s=>s.camp.eroi.filter(e=>!e.compagno&&s.conto.iniziale[e.slot]);
 // quanto resta da riscuotere per ogni eroe dell'account: XP guadagnata e parte dell'oro comune (parti uguali, il resto al primo; negativa se si è speso)
 function pendente(s){const L=account(s),n=L.length;if(!n)return[];
  const netto=(s.camp.oro|0)-(s.conto.oroIniziale|0),quota=Math.trunc(netto/n),resto=netto-quota*n;
  return L.map((e,i)=>{const acc=s.conto.accreditato[e.slot]||{xp:0,oro:0};
   return{slot:e.slot,nome:e.nome,xp:Math.max(0,(e.xp|0)-s.conto.iniziale[e.slot].xp-(acc.xp|0)),oro:quota+(i===0?resto:0)-(acc.oro|0)}})}
 const vuoto=p=>p.xp<=0&&p.oro===0;
 // la parte che entra in una scrittura: l'oro in aumento ha il tetto, quello speso passa sempre
 const tappa=p=>({slot:p.slot,xp:Math.min(Math.max(0,p.xp),LIM.xp),oro:p.oro>0?Math.min(p.oro,LIM.oro):p.oro});
 // il piano intero: per ogni eroe quanto manca, la prossima tappa e quante scritture servono; `finito` = non c'è altro da riscuotere
 function piano(s){const eroi=pendente(s).map(p=>({slot:p.slot,nome:p.nome,pendente:{xp:p.xp,oro:p.oro},tappa:tappa(p),finito:vuoto(p),
   scritture:Math.max(Math.ceil(p.xp/LIM.xp),p.oro>0?Math.ceil(p.oro/LIM.oro):p.oro<0?1:0)}));
  return{eroi,finito:eroi.every(e=>e.finito),scritture:eroi.reduce((m,e)=>Math.max(m,e.scritture),0)}}
 // la scheda dell'account dopo una tappa: XP e oro sommati a quelli di adesso (che potrebbero essere cambiati altrove), livello e PF ricalcolati, oggetti come in campagna
 function applica(h,t,e){const g=ER.guadagna(copia(h),t.xp|0);g.oro=Math.max(0,(h.oro|0)+(t.oro|0));
  if(e){const inv={equip:{...(e.equip||{})},zaino:[...(e.zaino||[])],cintura:[...(e.cintura||[])]};if(AO.invValido(Object.assign({},g,inv))==null){g.equip=inv.equip;g.zaino=inv.zaino;g.cintura=inv.cintura}}   // oggetti che il livello di questa tappa non regge restano per la tappa dopo
  const d=ER.derivati(g);g.hpMax=d.hpMax;g.hp=d.hpMax;return g}
 // registra la tappa nel conto: da fare solo dopo che la scrittura è riuscita
 function accredita(s,t){const n=copia(s),a=n.conto.accreditato[t.slot]||(n.conto.accreditato[t.slot]={xp:0,oro:0});a.xp+=t.xp|0;a.oro+=t.oro|0;return n}
 // secondi da aspettare prima di una scrittura che guadagna; `aggMs` = ora dell'ultimo guadagno scritto dal server (0 se mai)
 const attesa=(aggMs,oraMs)=>aggMs?Math.max(0,Math.ceil((aggMs+LIM.attesaS*1000-oraMs)/1000)):0;
 // chi guadagna deve aspettare; chi solo spende o si cura no
 const guadagna=t=>(t.xp|0)>0||(t.oro|0)>0;
 // il premio della fine: monete della Taverna e compagni sbloccati, una volta sola
 function premio(s){const f=s.fine;if(!f||!f.vinta||f.premiato)return{monete:0,sbloccati:[]};return{monete:f.monete|0,sbloccati:(f.sbloccati||[]).slice()}}
 function premiato(s){const n=copia(s);if(n.fine)n.fine.premiato=true;return n}
 return{LIM,pendente,tappa,piano,applica,accredita,attesa,guadagna,premio,premiato}})();
if(typeof module!=='undefined')module.exports=ARIE;
