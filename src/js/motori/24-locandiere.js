/* ---- Il locandiere: personaggio della taverna che saluta, consiglia giochi e risponde alle domande (dati puri). ----
   Cervello "a copioni": riconosce l'argomento dalle parole e risponde in modo ripetibile (stessa domanda, stessa
   risposta nello stesso giorno). Il contesto `c` lo prepara la vista: { nome, n (giocatori al tavolo), ora (0-23), giorno,
   monete, partite, vittorie, mail (bool), giochi:[{id,name,desc,range,ok (vale per n),coop}] }. */
const LOC=(()=>{
 const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
 const hash=s=>{let h=7;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return h};
 const scegli=(a,seed)=>a[hash(seed)%a.length];
 const elenco=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' e '+a[a.length-1];
 const salutoOra=h=>h>=5&&h<12?'Buongiorno':h>=12&&h<18?'Buon pomeriggio':h>=18&&h<23?'Buonasera':'Ancora in piedi';
 function saluto(c){
  const ln=[salutoOra(c.ora)+(c.nome?', '+c.nome:'')+'! Sono il locandiere.'];
  if(c.partite>0)ln.push(`Hai già giocato ${c.partite} partite${c.vittorie?' e ne hai vinte '+c.vittorie:''}: la casa ti conosce.`);
  else ln.push('Prima volta in taverna? Siediti pure, il fuoco è acceso.');
  if(c.n>1)ln.push(`Siete in ${c.n} al tavolo: chiedimi un gioco adatto.`);else ln.push('Chiedimi un gioco, le regole o come guadagnare monete.');
  return ln.join(' ')}
 // giochi adatti al numero di giocatori, ruotando col giorno per non proporre sempre gli stessi
 function consiglia(c,filtro){
  let L=c.giochi.filter(g=>g.ok);if(filtro==='coop')L=L.filter(g=>g.coop);if(filtro==='gara')L=L.filter(g=>!g.coop);
  if(!L.length)return`Per ${c.n} ${c.n===1?'giocatore':'giocatori'} non ho giochi ${filtro==='coop'?'cooperativi':filtro==='gara'?'di sfida':''}: aggiungete o togliete un posto al tavolo.`.replace(/ +:/,':');
  const o=(hash('g'+c.giorno)%L.length);const s=[0,1,2].map(i=>L[(o+i)%L.length]).filter((g,i,a)=>a.indexOf(g)===i);
  return`${c.n>1?'In '+c.n+' ':'Da solo '}${filtro==='coop'?'in squadra ':filtro==='gara'?'in sfida ':''}io proverei ${elenco(s.map(g=>g.name))}. ${s[0].name}: ${s[0].desc}`}
 const ARG=[
  ['cantare',/\b(cantare|cantari|puntata|riassunt|ultima volta|sessione precedente|dove eravamo|a che punto|cosa e successo|che e successo)/],
  ['consigli',/\b(consigli|consiglia|suggerisc|suggerimento|che gioco|quale gioco|a cosa gioc|cosa giochiamo|cosa gioco|propon|un gioco|qualcosa in|in squadra|da solo|sfidar)/],
  ['monete',/\b(monete|moneta|soldi|guadagn|bottega|dorso|dorsi|negozio|compr)/],
  ['classifica',/\b(classifica|elo|punteggio|ranking|graduatoria|punti|migliori)/],
  ['account',/\b(account|email|mail|password|profilo|accesso|accedi|registr|cambio telefono|altro telefono)/],
  ['ospiti',/\b(ospite|ospiti|stesso telefono|un solo telefono|passa telefono|passa e gioca)/],
  ['grazie',/\b(grazie|gentile|ottimo|perfetto|bravo)/],
  ['ciao',/\b(ciao|salve|buongiorno|buonasera|ehi|hey|ola)\b/],
  ['aiuto',/\b(aiuto|help|come funziona|cosa posso|che sai fare|cosa sai)/]];
 function trovaGioco(t,giochi){const T=' '+t+' ';let best=null;for(const g of giochi){const n=norm(g.name);if(n&&T.includes(' '+n+' ')&&(!best||n.length>norm(best.name).length))best=g}return best}
 function risposta(domanda,c){
  const t=norm(domanda),seed=t+'|'+c.giorno;
  if(!t)return saluto(c);
  const g=trovaGioco(t,c.giochi);
  if(g&&/\b(regol|come si gioca|come funziona|spiega|cos e|cosa e|come gioc)/.test(t))
   return`${g.name} (${g.range} giocatori${g.coop?', tutti insieme contro il gioco':''}): ${g.desc} Le regole complete le trovi nel tavolo, alla voce «Regole»${g.ok?'. Va bene anche per il vostro numero':'. Attenzione: non vale per '+c.n+' al tavolo'}.`;
  for(const[k,re]of ARG){if(!re.test(t))continue;
   if(k==='cantare')return apertura(c);
   if(k==='consigli')return consiglia(c,/\b(coop|insieme|squadra|collaborativ)/.test(t)?'coop':/\b(sfid|contro|compet|gara|vincere)/.test(t)?'gara':null);
   if(k==='monete')return`Ogni partita finita ti dà 10 monete, 15 in più se vinci${c.monete!=null?' (ora ne hai '+c.monete+')':''}. Si spendono nella Bottega, dalle impostazioni: dorsi per le carte, uno per volta.`;
   if(k==='classifica')return'Nei giochi di sfida tra giocatori con profilo online ogni partita sposta il tuo ELO (si parte da 1000, al massimo ±32 a partita). La Classifica è nelle impostazioni. Gli ospiti e i giochi in squadra contro il gioco non contano.';
   if(k==='account')return c.mail?'Il tuo profilo è già legato a un\'email: lo ritrovi da qualsiasi telefono con «Accedi».':'Per ora il tuo profilo vive solo su questo telefono. Dalle impostazioni, «Account», puoi legarlo a un\'email: così monete, dorsi ed ELO ti seguono.';
   if(k==='ospiti')return'Se avete un solo telefono, aggiungi gli ospiti dal tavolo e passatevelo di mano in mano. Gli ospiti giocano ma non ricevono monete né ELO.';
   if(k==='grazie')return scegli(['Figurati, offre la casa.','Per così poco! Buon divertimento.','Un boccale alla tua salute.'],seed);
   if(k==='ciao')return saluto(c);
   if(k==='aiuto')return'Posso consigliarti un gioco per il vostro tavolo, spiegarti le regole di un gioco (scrivi «regole di» e il nome), dirti come guadagnare monete, come funziona la classifica e come legare il profilo a un\'email.'}
  if(g)return`${g.name}: ${g.desc} Chiedimi «regole di ${g.name}» se vuoi sapere di più.`;
  return scegli(['Non ho capito bene, ma qui si gioca: chiedimi un gioco da fare.','Questa non la so. Posso consigliarti un gioco o spiegarti le regole di uno.','Il fumo mi ha dato alla testa… prova a chiedermi di un gioco, delle monete o della classifica.'],seed)}
 // il cantare dell'avventura: `c.cantare` = { titolo, capitolo, sessioni, apertura:[righe dalle bandiere], chiusura } (lo prepara il racconto, ARAC.cantare)
 const FRASE=r=>String(r||'').trim().replace(/\s+/g,' ');
 function apertura(c){const k=c&&c.cantare;if(!k)return'Nessuna storia in corso: apri la pagina Avventura e comincia un cantare.';
  if(!(k.sessioni>0)&&!k.apertura.length)return`${k.titolo}${k.capitolo?': «'+k.capitolo+'»':''}. La storia comincia adesso: sedetevi e ascoltate.`;
  const fatti=k.apertura.map(FRASE).filter(Boolean);
  return`${k.titolo}${k.capitolo?', «'+k.capitolo+'»':''}. Nella sessione precedente… ${fatti.length?fatti.join(' '):'non è successo nulla che meriti una canzone.'}${k.chiusura?' '+FRASE(k.chiusura):''}`}
 function chiusura(c){const k=c&&c.cantare;if(!k)return'Alla prossima, e che la strada vi sia lieve.';
  return`Per oggi basta così. ${k.chiusura?FRASE(k.chiusura)+' ':''}Il cantare è salvato: ci vediamo alla prossima sessione.`}
 // chip di domande pronte per la vista
 const rapide=c=>c&&c.cantare?['A che punto siamo?','Che gioco ci consigli?',c.n>1?'Qualcosa in squadra':'Un gioco da solo','Come guadagno monete?']:['Che gioco ci consigli?',c.n>1?'Qualcosa in squadra':'Un gioco da solo','Come guadagno monete?','Come funziona la classifica?'];
 return{norm,saluto,consiglia,risposta,rapide,apertura,chiusura}})();
if(typeof module!=='undefined')module.exports=LOC;
