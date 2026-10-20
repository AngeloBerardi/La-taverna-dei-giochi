/* ---- Partite a distanza: dati puri (codici, identità, riepilogo di una stanza salvata su Firestore). ----
   Una partita a distanza è una stanza normale che vive su Firestore (collezione `partite`) e resta lì finché non
   viene eliminata: ci si rientra anche dopo giorni. L'identità di chi gioca è l'uid del profilo, scritto nel campo
   `dev` dei posti come 'u:<uid>' (così il tavolo è lo stesso da qualsiasi telefono). */
const DIST=(()=>{
 const ALFA='ABCDEFGHJKMNPQRSTUVWXYZ23456789',LUN=8,MAX_GIOCATORI=8,MAX_JSON=900000;
 const codice=rnd=>Array.from({length:LUN},()=>ALFA[Math.floor((rnd||Math.random)()*ALFA.length)]).join('');
 const codiceOk=c=>typeof c==='string'&&c.length===LUN&&[...c].every(ch=>ALFA.includes(ch));
 const devDa=uid=>'u:'+uid,uidDa=dev=>typeof dev==='string'&&dev.startsWith('u:')&&dev.length>2?dev.slice(2):null;
 // Firestore non accetta array dentro array (le mani, le plance…): lo stato viaggia come testo JSON
 function ser(d){const j=JSON.stringify(d);if(j.length>MAX_JSON){const e=new Error('partita troppo grande');e.code='troppo-grande';throw e}return j}
 const de=raw=>raw&&typeof raw.j==='string'?JSON.parse(raw.j):undefined;
 // campi leggibili senza aprire lo stato: chi c'è, a chi tocca. `vecchio` = ciò che c'era già salvato (gli uid non si perdono mai)
 function meta(d,vecchio,me){
  const uids=new Set((vecchio&&vecchio.uids)||[]);if(me)uids.add(me);
  const seats=Array.isArray(d.seats)?d.seats:[];for(const x of seats){const u=uidDa(x.dev);if(u)uids.add(u)}
  const h=uidDa(d.host);if(h)uids.add(h);
  const s=d.s,gioco=d.phase==='play'&&s&&!s.over;let turno=[];
  if(gioco){if(s.sim)turno=seats.map(x=>uidDa(x.dev)).filter(Boolean);else{const u=seats[s.cur]&&uidDa(seats[s.cur].dev);if(u)turno=[u]}}
  const nomi={};for(const x of seats){const u=uidDa(x.dev);if(u&&x.k==='m')nomi[u]=String(x.name||'?').slice(0,14)}
  return{uids:[...uids].sort().slice(0,MAX_GIOCATORI),host:(vecchio&&vecchio.host)||h||me||null,phase:d.phase||'lobby',game:d.game||null,turno,nomi,finita:!!(s&&s.over)}}
 // riga per la lista «Le mie partite»
 function riassunto(code,m,uid,nomeGioco){
  const nomi=Object.values(m.nomi||{}),fase=m.finita?'finita':m.phase==='play'?'in corso':'in attesa';
  return{code,fase,gioco:m.game?(nomeGioco?nomeGioco(m.game):m.game):null,tocca:(m.turno||[]).includes(uid),giocatori:nomi.length?nomi:null,n:(m.uids||[]).length,mia:m.host===uid}}
 // prima le partite in cui tocca a me, poi quelle in corso, poi in attesa, per ultime le finite
 const ordina=righe=>righe.slice().sort((a,b)=>(b.tocca-a.tocca)||(rango(a)-rango(b))||(a.code<b.code?-1:1));
 const rango=r=>r.fase==='in corso'?0:r.fase==='in attesa'?1:2;
 return{LUN,MAX_GIOCATORI,MAX_JSON,codice,codiceOk,devDa,uidDa,ser,de,meta,riassunto,ordina}})();
if(typeof module!=='undefined')module.exports=DIST;
