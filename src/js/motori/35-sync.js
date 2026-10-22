/* SINCRONIZZAZIONE DELLE MOSSE (regole pure, senza rete). Dati: il documento della stanza {phase,game,opts,seats,s,rev,...}.
   Problema risolto: ogni telefono calcola da solo il nuovo stato e lo scrive. Se due telefoni partono dalla stessa versione (rev),
   il secondo cancellava il primo senza accorgersene. Ora ogni scrittura è una transazione che decide sul documento ATTUALE:
   - gioco a turni: la mossa vale solo se la stanza è ancora alla versione da cui è partita (base), altrimenti è un conflitto
     («un altro telefono ha mosso un attimo prima») e il telefono si riallinea;
   - gioco simultaneo (s.sim, es. The Mind): la mossa porta il proprio posto (seat) e il motore la riconvalida, quindi si rigioca
     sullo stato nuovo e nessuna azione va persa.
   Ogni funzione restituisce {doc} (da scrivere), {nulla:true} (niente da fare) oppure {err,code} (rifiutata). */
const SYNC=(()=>{
 const E={
  assente:'La stanza non esiste più',
  fase:'La partita non è più in corso',
  gid:'È iniziata un’altra partita',
  conflitto:'Un altro telefono ha mosso un attimo prima'};
 const no=code=>({err:E[code],code});
 const rev=d=>d.rev||0;

 /* una mossa: {base: versione da cui è calcolata, gid: partita, a: azione, s: stato già calcolato in locale} */
 function mossa(cur,m,ENG){
  if(!cur)return no('assente');
  if(cur.phase!=='play'||!cur.s)return no('fase');
  if(m.gid&&cur.s.gid!==m.gid)return no('gid');
  if(rev(cur)===m.base&&m.s)return{doc:{...cur,s:m.s,rev:rev(cur)+1}};
  if(cur.s.sim&&m.a&&ENG&&ENG[cur.s.g]){
   const r=ENG[cur.s.g].act(cur.s,m.a);
   if(r.err)return{err:r.err,code:'regola'};
   return{doc:{...cur,s:r.s,rev:rev(cur)+1},rigioca:true}}
  return no('conflitto')}

 /* avvio di una partita. m.patch = campi nuovi (phase,game,opts,seats,s). m.dopo = gid della partita di cui si chiede la rivincita:
    la rivincita vale solo se la stanza ha ancora quella partita (se un altro telefono l'ha già rilanciata non se ne fa una seconda) */
 function partita(cur,m){
  if(!cur)return no('assente');
  if(m.dopo){if(!cur.s||cur.s.gid!==m.dopo)return no('conflitto')}
  else if(cur.phase==='play'&&cur.s)return{err:'C’è già una partita in corso in questa stanza',code:'conflitto'};
  return{doc:{...cur,...m.patch,rev:rev(cur)+1}}}

 /* ritorno alla lobby. m.gid = partita che si sta chiudendo: se nel frattempo ne è iniziata un'altra non la si chiude per sbaglio */
 function lobby(cur,m){
  if(!cur)return no('assente');
  if(cur.phase!=='play'||!cur.s)return{nulla:true};
  if(m.gid&&cur.s.gid!==m.gid)return no('conflitto');
  return{doc:{...cur,phase:'lobby',s:null,rev:rev(cur)+1}}}

 /* Esegue fn(documentoAttuale) sul riferimento alla stanza (R.ref). Dove il trasporto sa fare transazioni (Realtime Database,
    Firestore) è atomico; sugli altri (p2p) è leggi-modifica-scrivi come prima. fn restituisce uno degli esiti qui sopra. */
 async function esegui(ref,fn){
  let esito={nulla:true};
  const calcola=cur=>{try{esito=fn(cur)}catch(e){esito={err:e&&e.message||'Errore',code:'eccezione'}}return esito.doc};
  if(typeof ref.transact==='function'){
   const r=await ref.transact(calcola);
   if(esito.doc&&r&&r.committed===false)return no('conflitto');
   return esito}
  const s=await ref.get();
  calcola(s.exists?s.data():null);
  if(esito.doc)await ref.set(esito.doc);
  return esito}
 return{mossa,partita,lobby,esegui,ERRORI:E}})();
if(typeof module!=='undefined')module.exports=SYNC;
