/* ---- Bottega: catalogo dei cosmetici (dati puri). I prezzi sono ripetuti in firestore.rules (npm run regole). ---- */
const BOTTEGA=(()=>{
 const oggetti=[
  {id:'dorso-notte',slot:'dorso',nome:'Notte stellata',prezzo:40,desc:'Cielo blu e stelle.'},
  {id:'dorso-bosco',slot:'dorso',nome:'Bosco',prezzo:60,desc:'Righe di foglie e muschio.'},
  {id:'dorso-brace',slot:'dorso',nome:'Brace',prezzo:80,desc:'Carboni accesi del falò.'},
  {id:'dorso-corvo',slot:'dorso',nome:'Corvo',prezzo:100,desc:'Scacchi viola e nero.'},
  {id:'dorso-brina',slot:'dorso',nome:'Brina',prezzo:120,desc:'Ghiaccio chiaro d’inverno.'},
  {id:'dorso-oro',slot:'dorso',nome:'Oro antico',prezzo:160,desc:'Oro opaco, niente riflessi.'}];
 const SLOT={dorso:{nome:'Dorsi delle carte',base:'dorso-classico'}};
 const per=id=>oggetti.find(o=>o.id===id)||null;
 // un oggetto si può usare se è gratuito (la scelta di base dello slot) o se è già posseduto
 const usabile=(id,owned)=>Object.values(SLOT).some(s=>s.base===id)||!!(owned&&owned[id]);
 return{oggetti,SLOT,per,usabile,suffisso:id=>id.replace(/^[a-z]+-/,'')}})();
if(typeof module!=='undefined')module.exports=BOTTEGA;
