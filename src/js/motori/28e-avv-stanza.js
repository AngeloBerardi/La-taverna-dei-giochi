/* ---- Avventura in compagnia (A11): la sessione di AVV in una stanza con più telefoni e una TV (motore puro). ----
   `AST` non rifà nulla: tiene lo stato di AVV (`av`) e, durante uno scontro, quello di ASCO (`lotta`), e decide CHI può fare COSA: un posto = un eroe, i compagni e gli eroi dei posti assenti li guida chi ospita,
   le scelte del dialogo si votano, in battaglia muove solo chi guida l'eroe di turno e il resto lo gioca l'IA (`AIA`). Ogni mossa è una funzione pura sullo stato (`act`), quindi passa da SYNC.mossa
   come in tutti i giochi di stanza. La battaglia viaggia come `film`: le azioni giocate (la mossa e le risposte dell'IA) da rigiocare sullo stato di prima, così ogni telefono la anima passo per passo.
   Stato: { g:'avventura', v, sim:true, n, names, cur, ev, evn, over, posti:[{nome,uid,slot,eroe,qui,ospite}], av, lotta, film:{da,azioni}|null, voto:{chiave,v:{posto:i}}|null, riep:{…,n}|null }.
   Azioni (sempre con `seat`, il posto di chi le manda; `base` facoltativo: la versione che il telefono mostrava, se è già cambiata la mossa è rifiutata):
   {t:'av',az:<azione di AVV>} · {t:'voto',i}|{t:'voto',ora:true} · {t:'combatti'} · {t:'lotta',a:<azione di ASCO>} · {t:'chiudiLotta'} · {t:'presenza',posto,qui} · {t:'siede',posto,nome,uid}.
   Niente Math.random: il dado è in `av.rng`/`lotta.rng`. Piano: docs/AVVENTURA-A11.md. */
const AST=(()=>{
 const AV=typeof AVV!=='undefined'?AVV:require('./28a-avv-orchestratore.js');
 const SC=typeof ASCO!=='undefined'?ASCO:require('./27i-avv-scontro.js');
 const IA=typeof AIA!=='undefined'?AIA:require('./27j-avv-ia.js');
 const CP=typeof CAMP!=='undefined'?CAMP:require('./28-campagna.js');
 const ER=typeof EROI!=='undefined'?EROI:require('./27-eroi.js');
 const AR=typeof ARIE!=='undefined'?ARIE:require('./28b-avv-rientro.js');
 const VERSIONE=1,MAX=CP.MAX_EROI,PROVA=['guerriero','ladro','chierico','mago'],RAZZE=['umano','elfo','nano','piccolo'];
 const copia=x=>JSON.parse(JSON.stringify(x));
 const STANTIO='Un altro telefono ha mosso un attimo prima: riprova';
 // un eroe di prova per chi non ha un profilo (ospiti sullo stesso telefono): classe e razza a rotazione
 const eroeProva=(i,nome)=>ER.nuovo({nome:nome||'Eroe '+(i+1),razza:RAZZE[i%RAZZE.length],classe:PROVA[i%PROVA.length],base:ER.baseIniziale(),aspetto:{pelle:0,capelli:i%4,mantello:(i+1)%4,viso:0}});
 // ---- chi c'è e chi guida chi ----
 const presenti=s=>s.posti.map((p,i)=>p.qui?i:-1).filter(i=>i>=0);
 // chi ospita: il primo posto presente (il posto 0, o chi viene dopo se lui è fuori)
 const host=s=>{const L=presenti(s);return L.length?L[0]:-1};
 // il posto che guida l'eroe `i` di av.camp.eroi: il suo, se c'è; altrimenti (compagni, assenti) chi ospita; -1 se non c'è nessuno
 function guida(s,i){const k=s.posti.findIndex(p=>p.eroe===i);if(k>=0&&s.posti[k].qui)return k;return host(s)}
 const miei=(s,seat)=>s.av.camp.eroi.map((e,i)=>i).filter(i=>guida(s,i)===seat);
 // l'eroe di av.camp.eroi che sta dietro a un combattente della battaglia (id e1, e2…: l'ordine di `quali`)
 const eroeDi=(s,c)=>{const k=Number(String(c.id).slice(1))-1,q=AV.quali(s.av);return c.lato==='eroi'&&k>=0&&k<q.length?q[k]:-1};
 const guidaComb=(s,c)=>{const i=eroeDi(s,c);return i<0?-1:guida(s,i)};
 // chi non è guidato da una persona gioca da solo: nemici, eroi a terra, eroi senza nessuno che li guidi
 const automatico=(s,c)=>c.lato==='nemici'||c.hp<=0||guidaComb(s,c)<0;
 // ---- nuova partita ----
 // posti: [{ nome, uid?, slot?, eroe? (scheda dell'account, già validata), ospite? }]. Gli eroi si chiamano p0, p1… dentro la sessione (le schede di account hanno tutte e1..e5: i conti non devono scontrarsi);
 // `posti[i].slot` ricorda il posto originale sull'account di ciascuno, per il rientro.
 function nuova(cap,posti,seme,opz){opz=opz||{};if(!Array.isArray(posti)||posti.length<1||posti.length>MAX)throw new Error('servono da 1 a '+MAX+' posti');
  const eroi=posti.map((p,i)=>{const h=p.eroe&&ER.coerente(p.eroe)?copia(p.eroe):eroeProva(i,p.nome);return Object.assign(h,{slot:'p'+i})});
  const av=AV.nuova(cap,eroi,seme,{avvio:opz.avvio!==false});
  return{g:'avventura',v:VERSIONE,sim:true,n:posti.length,names:posti.map((p,i)=>p.nome||eroi[i].nome),cur:0,ev:[],evn:0,over:null,
   posti:posti.map((p,i)=>({nome:p.nome||eroi[i].nome,uid:p.uid||null,slot:p.eroe&&p.slot?p.slot:null,eroe:i,qui:true,ospite:!!p.ospite})),av,lotta:null,film:null,voto:null}}
 // ---- permessi ----
 // le azioni della mappa che riguardano UN eroe (con `eroe`): le fa chi lo guida. Le altre (fine giro, riposo lungo, entrare e uscire dai sotterranei, scelte d'evento, fuga, muovere tutti) sono del gruppo: le fa chi ospita
 const PER_EROE=['tira','muovi','breve','cura','rialza','prega','taglia','risolvi','equipa','togli','cintura','zaino','usa','passa','compra','vendi'];
 // chi può mandare una azione di AVV (e perché no)
 function permessoAv(s,az,seat){const g=host(s);
  switch(az.t){
   case'camp':{const b=az.a||{};if(PER_EROE.includes(b.t)&&Number.isInteger(b.eroe)&&!b.tutti){const i=b.eroe;if(i<0||i>=s.av.camp.eroi.length)return'Eroe sconosciuto';return guida(s,i)===seat?'':'Non è il tuo eroe'}return seat===g?'':'Lo decide chi ospita'}
   case'racconto':{const b=az.a||{};if(b.t==='scegli')return'Le scelte si votano';return''}   // «continua»: qualunque posto presente
   case'scena':case'parla':case'compagnia':case'bacheca':case'chiudi':return seat===g?'':'Lo decide chi ospita';
   case'esito':return'La battaglia si chiude da sola';
   default:return'Azione sconosciuta'}}
 // ---- il voto sulle scelte del dialogo ----
 const scelteOk=(s,cap)=>{const v=AV.vista(s.av,cap).racconto;return v&&v.scelte?v.scelte.filter(x=>x.ok).map(x=>x.i):[]};
 function chiudiVoto(s,cap,righe){const v=s.voto,P=presenti(s),g=host(s);if(!v)return{s};
  const sc=scelteOk(s,cap),voti=P.filter(k=>v.v[k]!=null&&sc.includes(v.v[k])).map(k=>({k,i:v.v[k]}));
  const conto={};for(const x of voti)conto[x.i]=(conto[x.i]||0)+1;const max=Math.max(0,...Object.values(conto)),primi=Object.keys(conto).filter(i=>conto[i]===max).map(Number);
  let i=primi.length===1?primi[0]:null;if(i==null){const dg=v.v[g];i=primi.includes(dg)?dg:Math.min(...primi)}
  const r=AV.act(s.av,{t:'racconto',a:{t:'scegli',i}},cap);if(r.err)return r;s.av=r.s;s.voto=null;if(r.righe)righe.push(...r.righe);return{s}}
 const tuttiVotato=s=>{const v=s.voto;return!!v&&presenti(s).every(k=>v.v[k]!=null)};
 // ---- la battaglia condivisa ----
 // le azioni dell'IA finché tocca a una persona (o la battaglia finisce); le azioni giocate vanno in `film`
 function giocaIA(s,film){let x=s.lotta;if(host(s)<0)return;   // se non c'è nessuno al tavolo la battaglia aspetta
  for(let n=0;n<400&&!x.over;n++){const att=SC.attore(x);if(!att||!automatico(s,att))break;
   const t=IA.turno(x,{eroi:'normale',nemici:'normale'});if(!t.azioni.length||t.s===x)break;film.push(...t.azioni);x=t.s}
  s.lotta=x}
 // chi esce o rientra cambia chi guida: se ora tocca a qualcuno che gioca da solo, la battaglia va avanti
 function riprendiLotta(s){const da=s.lotta.evn,film=[];giocaIA(s,film);if(film.length)s.film={da,azioni:film}}
 // rigioca un film sullo stato di prima: [{a,ev,s}] passo per passo (per le animazioni) e lo stato finale
 function rigioca(l0,film){let x=l0;const passi=[];for(const a of film||[]){const r=SC.act(x,a);if(r.err||r.pausa)return{err:r.err||'Il film non si rigioca'};passi.push({a,ev:r.ev,s:r.s});x=r.s}return{s:x,passi}}
 // ---- le mosse ----
 function fine(s,righe){s.evn++;return{s,righe:righe||[]}}
 function act(st,a,cap){
  if(!st||st.g!=='avventura')return{err:'Stato non valido'};if(!a||!a.t)return{err:'Azione mancante'};
  const s=copia(st),seat=a.seat;if(!Number.isInteger(seat)||seat<0||seat>=s.n)return{err:'Posto sconosciuto'};
  const righe=[];
  if(a.t==='presenza'){const k=a.posto;if(!Number.isInteger(k)||k<0||k>=s.n)return{err:'Posto sconosciuto'};if(k!==seat&&!s.posti[seat].qui)return{err:'Solo chi è presente'};
   if(!!a.qui===s.posti[k].qui)return{s,righe};s.posti[k].qui=!!a.qui;
   if(s.lotta&&!s.lotta.over)riprendiLotta(s);
   if(s.voto){if(!presenti(s).length)s.voto=null;else if(tuttiVotato(s)){const r=chiudiVoto(s,cap,righe);if(r.err)return r}}
   return fine(s,righe)}
  if(a.t==='siede'){const k=a.posto;if(!Number.isInteger(k)||k<0||k>=s.n)return{err:'Posto sconosciuto'};const p=s.posti[k];if(p.qui&&k!==seat)return{err:'Il posto è occupato'};
   p.qui=true;if(a.nome)p.nome=String(a.nome).slice(0,24);if(a.uid)p.uid=a.uid;s.names[k]=p.nome;if(s.lotta&&!s.lotta.over)riprendiLotta(s);return fine(s,righe)}
  if(!s.posti[seat].qui)return{err:'Non sei seduto a questo tavolo'};
  if(s.av.fine)return{err:'La campagna è finita'};
  switch(a.t){
   case'av':{const az=a.az||{};if(a.base!=null&&a.base!==s.av.evn)return{err:STANTIO};
    if(s.lotta)return{err:'Prima va combattuta la battaglia'};
    const no=permessoAv(s,az,seat);if(no)return{err:no};
    const r=AV.act(s.av,az,cap);if(r.err)return{err:r.err};s.av=r.s;s.voto=null;
    s.riep=r.riepilogo?Object.assign({},r.riepilogo,{n:s.evn+1}):null;   // la chiusura della sessione la vedono tutti i telefoni (ciascuno poi riscuote il proprio eroe)
    const out=fine(s,r.righe);if(r.cambio)out.cambio=r.cambio;if(r.riepilogo)out.riepilogo=r.riepilogo;return out}
   case'voto':{if(s.lotta)return{err:'Prima va combattuta la battaglia'};if(a.base!=null&&a.base!==s.av.evn)return{err:STANTIO};
    if(!s.av.racc.scena)return{err:'Non c\'è niente da votare'};const sc=scelteOk(s,cap);if(!sc.length)return{err:'In questa scena non ci sono scelte'};
    const P=presenti(s);
    if(a.ora){if(seat!==host(s))return{err:'Lo decide chi ospita'};if(!s.voto)return{err:'Nessun voto in corso'};const r=chiudiVoto(s,cap,righe);if(r.err)return r;return fine(s,righe)}
    if(!sc.includes(a.i))return{err:'Scelta non valida'};
    if(!s.voto)s.voto={chiave:s.av.evn,v:{}};s.voto.v[seat]=a.i;
    if(P.length===1||tuttiVotato(s)){const r=chiudiVoto(s,cap,righe);if(r.err)return r}
    return fine(s,righe)}
   case'combatti':{if(a.base!=null&&a.base!==s.av.evn)return{err:STANTIO};if(AV.fase(s.av)!=='battaglia')return{err:'Non c\'è nessuna battaglia'};if(s.lotta)return{err:'La battaglia è già cominciata'};
    const l=AV.battaglia(s.av);if(!l)return{err:'Battaglia non preparabile'};
    l.opz.reazioni={eroi:'auto',nemici:'auto'};   // a un altro telefono non si può chiedere una reazione a metà mossa
    s.lotta=l;const da=l.evn,film=[];giocaIA(s,film);s.film={da,azioni:film};s.voto=null;return fine(s,righe)}
   case'lotta':{if(!s.lotta)return{err:'Nessuna battaglia in corso'};const l=s.lotta;if(l.over)return{err:'La battaglia è finita'};
    if(a.base!=null&&a.base!==l.evn)return{err:STANTIO};
    const att=SC.attore(l);if(!att)return{err:'Nessuno è di turno'};if(att.lato!=='eroi')return{err:'Tocca ai nemici'};
    if(guidaComb(s,att)!==seat)return{err:'Non è il tuo turno: tocca a '+(att.nome||att.id)};
    const r=SC.act(l,a.a||{});if(r.err)return{err:r.err};if(r.pausa)return{err:'Serve una reazione: in compagnia si risponde da sole'};
    const da=l.evn,film=[a.a];s.lotta=r.s;giocaIA(s,film);s.film={da,azioni:film};return fine(s,righe)}
   case'chiudiLotta':{if(!s.lotta)return{err:'Nessuna battaglia in corso'};if(!s.lotta.over)return{err:'La battaglia non è finita'};
    const r=AV.act(s.av,{t:'esito',riep:SC.riepilogo(s.lotta)},cap);if(r.err)return{err:r.err};s.av=r.s;s.lotta=null;s.film=null;s.voto=null;
    const out=fine(s,r.righe);if(r.cambio)out.cambio=r.cambio;if(r.riepilogo)out.riepilogo=r.riepilogo;return out}
   default:return{err:'Azione sconosciuta: '+a.t}}}
 // ---- ciò che serve alla vista di un posto (senza toccare lo stato) ----
 function vista(s,cap,seat){const g=host(s),P=presenti(s),v=s.voto,att=s.lotta&&!s.lotta.over?SC.attore(s.lotta):null,tocca=att&&att.lato==='eroi'?guidaComb(s,att):-1;
  return{fase:AV.fase(s.av),host:g,presenti:P,sonoHost:seat===g,miei:seat>=0?miei(s,seat):[],mioEroe:seat>=0&&s.posti[seat]?s.posti[seat].eroe:-1,
   guide:s.av.camp.eroi.map((e,i)=>guida(s,i)),
   voto:v?{votanti:P,voti:Object.assign({},v.v),mancano:P.filter(k=>v.v[k]==null),mio:seat>=0&&v.v[seat]!=null?v.v[seat]:null}:null,
   lotta:s.lotta?{over:s.lotta.over,tocca,mioTurno:tocca===seat&&seat>=0,attore:att?att.id:null}:null}}
 // ---- il rientro sull'account: ciascun posto riscuote solo il proprio eroe, con le tappe di ARIE ----
 function rientro(s,posto){const p=s.posti[posto];if(!p)return null;const e=AR.piano(s.av).eroi.find(x=>x.slot==='p'+p.eroe);
  return e?Object.assign({posto,slotAccount:p.slot},e):null}
 const accredita=(s,t)=>{const n=copia(s);n.av=AR.accredita(s.av,t);return n};
 // ---- salvataggio: quello di AVV, con i posti ----
 const salva=s=>({v:VERSIONE,av:AV.salva(s.av),posti:copia(s.posti)});
 return{VERSIONE,MAX,act,nuova,vista,guida,miei,host,presenti,automatico,guidaComb,eroeDi,rigioca,rientro,accredita,salva,eroeProva,permessoAv,PER_EROE}})();
if(typeof module!=='undefined')module.exports=AST;
