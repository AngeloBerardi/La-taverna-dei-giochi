/* ---- Cronaca della battaglia (Cantari di Ventura, A5.1): da ogni evento di ASCO una frase italiana per il registro e i passi da animare. ----
   Puro: niente DOM, niente dadi. La vista legge gli eventi di `act(...).ev`; qui si decide solo che cosa scrivere e che cosa far vedere.
   `s` è lo stato dopo l'azione (i combattenti restano nell'elenco anche se caduti, quindi i nomi si trovano sempre).
     ACRO.riga(ev, s)    → { testo, lato:'eroi'|'nemici'|null, peso:'minore'|'normale'|'grave' }   testo vuoto = niente da scrivere
     ACRO.frase(ev, s)   → testo
     ACRO.effetti(ev, s) → [{ t, ms, … }]  passi per l'animazione (ms = durata a velocità 1×)
     ACRO.nome(s, id)    → nome da mostrare (i mostri uguali sono numerati: «Ragno tessitore 2»)
   Passi (`t`): sposta {chi, passi:[{q,r}], indietro} · compare {chi, q, r} · dado {chi, bers, tiri, tiro, tot, cont, ok, crit, vant, svant, salvezza?, ab?}
   · numero {chi, v, tipo, crit?} · hp {chi, d} · scossa {chi} · etichetta {chi, testo, tono} · stato {chi, stato, ok} · cade {chi} · esce {chi, come}
   · turno {chi, giro} · giro {n} · fine {esito}. `ms` = attesa prima del passo successivo (0 = in parallelo), ACRO.VIVE = quanto restano visibili numeri e scritte. I tipi di evento che il motore può emettere sono in ACRO.TIPI: il test li confronta con il codice. */
const ACRO=(()=>{
 const ST=typeof ASTA!=='undefined'?ASTA:require('./27d-avv-stati.js'),AP=typeof APOT!=='undefined'?APOT:require('./27e-avv-poteri.js');
 const TIPI=['aiuta','arreso','arriva','cade','conc','conc-spesa','cura','danno','disimpegna','disimpegno','dot','fine','fuga-gruppo','fuggito','furtivo','giro','movimento','muore',
  'muovi','nasconditi','oggetto','opportunita','reazione','resiste','rialza','riduci','rimuovi','ritira','ritira-mov','salvezza','scatto','scivola','spingi','spinto','stato',
  'superficie','temp','tenace','tiro','turno'];
 const ESITO={vittoria:'Vittoria!',sconfitta:'Sconfitta',fuga:'La compagnia è fuggita',stallo:'Stallo: nessuno riesce a vincere'};
 const AB={for:'Forza',des:'Destrezza',cos:'Costituzione',int:'Intelligenza',sag:'Saggezza',car:'Carisma'};
 const trova=(s,id)=>s&&s.cb?s.cb.find(c=>c.id===id)||null:null;
 function nome(s,id){const c=trova(s,id);if(!c)return String(id==null?'?':id).replace(/#\d+$/,'');
  const doppi=c.lato==='nemici'&&s.cb.filter(x=>x.lato==='nemici'&&x.nome===c.nome).length>1,n=/#(\d+)$/.exec(c.id);return doppi&&n?c.nome+' '+n[1]:c.nome}
 const lato=(s,id)=>{const c=trova(s,id);return c?c.lato:null};
 const stato=id=>(ST.STATI[id]&&ST.STATI[id].nome)||String(id),potere=id=>{const p=AP.P[id];return p?p.nome:String(id)};
 const tipoDanno=t=>(ST.NOME_TIPO&&ST.NOME_TIPO[t])||t||'',es=n=>n===1?'1 esagono':n+' esagoni',segno=n=>n>=0?'+'+n:'−'+Math.abs(n);
 // «Mara» per gli eroi, nome del mostro per gli altri: lo stesso testo, ma con la maiuscola iniziale
 const cap=t=>t?t.charAt(0).toUpperCase()+t.slice(1):t;
 // chi compie l'evento (per il colore della riga): il campo `chi`, se manca il bersaglio
 const attore=ev=>ev.chi!=null?ev.chi:ev.bers!=null?ev.bers:null;
 const PESO_MINORE=['movimento','conc','ritira-mov','giro','turno'],PESO_GRAVE=['cade','muore','arreso','fuggito','fuga-gruppo'];
 function peso(ev){if(ev.t==='fine')return ev.esito?'grave':'minore';if(PESO_GRAVE.includes(ev.t))return'grave';if(PESO_MINORE.includes(ev.t))return'minore';return'normale'}
 function frase(ev,s){const N=id=>nome(s,id),c=ev.chi,b=ev.bers;let t;
  switch(ev.t){
   case'aiuta':t=`${N(c)} aiuta ${N(b)}: il suo prossimo attacco sarà più facile.`;break;
   case'arreso':t=`${N(c)} si arrende.`;break;
   case'arriva':t=`${N(c)} entra nella mischia.`;break;
   case'cade':t=`${N(c)} cade a terra.`;break;
   case'conc':t=ev.n>0?`${N(b)} recupera ${ev.n} ${ev.n===1?'punto':'punti'} di Concentrazione.`:`${N(b)} ha già la Concentrazione al massimo.`;break;
   case'conc-spesa':t=`${N(c)} spende Concentrazione ${ev.uso==='ritira'?'per ritirare il dado':'per ottenere vantaggio'}.`;break;
   case'cura':t=c===b||c==null?`${N(b)} recupera ${ev.n} PF${ev.rialzato?' e si rialza':''}.`:`${N(c)} cura ${N(b)}: ${ev.n} PF${ev.rialzato?' e lo rialza':''}.`;break;
   case'danno':{const q=ev.esito==='imm'?`${N(b)} è immune ai danni da ${tipoDanno(ev.tipo)}.`:`${N(c)} infligge ${ev.n} ${ev.n===1?'danno':'danni'} da ${tipoDanno(ev.tipo)} a ${N(b)}`
     +(ev.esito==='res'?' (resistenza)':ev.esito==='vuln'?' (vulnerabilità)':'')+(ev.perso<ev.n?` (${ev.n-ev.perso} assorbit${ev.n-ev.perso===1?'o':'i'})`:'')+'.';
     t=q+(ev.tenace?` ${N(b)} resta in piedi grazie a ${potere(ev.potere)}.`:'');break}
   case'disimpegna':case'disimpegno':t=`${N(c)} si disimpegna: niente attacchi di opportunità fino a fine turno.`;break;
   case'dot':t=`${N(c)} subisce ${ev.n} ${ev.n===1?'danno':'danni'} da ${tipoDanno(ev.tipo)} (${stato(ev.stato).toLowerCase()}).`;break;
   case'fine':t=ev.esito?(ESITO[ev.esito]||String(ev.esito)):`${N(c)}: ${stato(ev.stato).toLowerCase()} finisce.`;break;
   case'fuga-gruppo':t=ev.ok?'La compagnia riesce a fuggire.':'La fuga di gruppo fallisce.';break;
   case'fuggito':t=`${N(c)} fugge dalla battaglia.`;break;
   case'furtivo':t=`${N(c)} colpisce a tradimento: +${ev.n} danni.`;break;
   case'giro':t=`Giro ${ev.n}.`;break;
   case'movimento':t=`${N(c)} ha ${ev.pm} punti movimento.`;break;
   case'muore':t=lato(s,c)==='nemici'?`${N(c)} è sconfitto.`:`${N(c)} muore.`;break;
   case'muovi':{const n=ev.passi.length;t=`${N(c)} ${ev.indietro?'arretra':'si muove'} di ${es(n)}${ev.costo>n?` (costo ${ev.costo})`:''}.`;break}
   case'nasconditi':t=ev.tot==null?`${N(c)} si nasconde.`:ev.ok?`${N(c)} si nasconde (${ev.tot} contro ${ev.cd}).`:`${N(c)} non riesce a nascondersi (${ev.tot} contro ${ev.cd}).`;break;
   case'oggetto':t=`${N(c)} usa ${ev.nome||ev.id}.`;break;
   case'opportunita':t=`${N(c)} attacca ${N(b)} che esce dalla sua portata.`;break;
   case'reazione':t=`${N(c)} reagisce: ${potere(ev.potere)}.`;break;
   case'resiste':t=`${N(b)} resiste: ${stato(ev.stato).toLowerCase()}.`;break;
   case'rialza':t=ev.ok?`${N(c)} rialza ${N(b)} (${ev.hp} PF).`:`${N(c)} non riesce a rialzare ${N(b)} (${ev.tot} contro ${ev.cd}).`;break;
   case'riduci':t=`${N(b)} riduce il danno di ${ev.n}.`;break;
   case'rimuovi':t=ev.stati&&ev.stati.length?`${N(b)} si libera da: ${ev.stati.map(x=>stato(x).toLowerCase()).join(', ')}.`:`${N(b)}: nessuno stato da togliere.`;break;
   case'ritira':t=`${N(b)} ritira il dado.`;break;
   case'ritira-mov':t=`${N(c)} ritira il movimento: ${ev.pm} punti.`;break;
   case'salvezza':t=`${N(b)} tira salvezza su ${AB[ev.ab]||ev.ab}: ${ev.tot} contro ${ev.cont}, ${ev.ok?'superata':'fallita'}.`;break;
   case'scatto':t=`${N(c)} scatta: ${ev.pm} punti movimento in tutto.`;break;
   case'scivola':t=`${N(c)} scivola sul ghiaccio e si ferma.`;break;
   case'spingi':t=c==null?'':ev.ok?`${N(c)} spinge ${N(b)}.`:`${N(b)} resiste alla spinta di ${N(c)} (${ev.tot} contro ${ev.cd}).`;break;
   case'spinto':t=ev.passi>0?`${N(b)} è spinto di ${es(ev.passi)}.`:`${N(b)} non si sposta.`;break;
   case'stato':t=ev.ok?`${N(b)}: ${stato(ev.stato).toLowerCase()}${ev.dur?` per ${ev.dur} ${ev.dur===1?'giro':'giri'}`:''}.`:`${N(b)}: ${stato(ev.stato).toLowerCase()} senza effetto.`;break;
   case'superficie':t=ev.spenta?`${N(c)} spegne le fiamme nell'acqua.`:ev.sup==='fuoco'?`${N(c)} si scotta nel fuoco: ${ev.n} ${ev.n===1?'danno':'danni'}.`
     :ev.sup==='veleno'?(ev.ok?`${N(c)} resiste alle esalazioni velenose.`:`${N(c)} è avvelenato dalle esalazioni.`):ev.sup==='ghiaccio'?(ev.ok?`${N(c)} tiene l'equilibrio sul ghiaccio.`:`${N(c)} non tiene l'equilibrio sul ghiaccio.`):`${N(c)} attraversa ${ev.sup}.`;break;
   case'temp':t=`${N(b)} ottiene ${ev.n} PF temporanei.`;break;
   case'tenace':t=`${N(b)} resta in piedi con 1 PF.`;break;
   case'tiro':{const dadi=ev.tiri&&ev.tiri.length>1?` (due dadi: ${ev.tiri.join(' e ')}${ev.vant?', vantaggio':ev.svant?', svantaggio':''})`:'',bonus=ev.tot-ev.tiro;
     t=`${N(c)} attacca ${N(b)}: ${ev.tiro}${bonus?' '+(bonus<0?'−':'+')+' '+Math.abs(bonus):''} = ${ev.tot} contro CA ${ev.cont}${dadi}. ${ev.crit?'Colpo critico!':ev.ok?'Colpito.':'Mancato.'}`;break}
   case'turno':t=`Tocca a ${N(c)}.`;break;
   default:t=`${ev.t}.`}
  return cap(t)}
 function riga(ev,s){return{testo:frase(ev,s),lato:ev.t==='giro'||ev.t==='fine'&&ev.esito?null:lato(s,attore(ev)),peso:peso(ev)}}
 // ---- passi da animare ----
 // durate (ms) a velocità 1×: il dado è il momento più lungo, un passo di movimento è breve
 // `ms` = quanto aspetta il passo successivo; `VIVE` = quanto resta visibile (numeri e scritte salgono mentre la scena va avanti)
 const MS={dado:700,numero:350,scossa:0,etichetta:250,passo:130,compare:300,cade:400,esce:400,turno:350,giro:250,stato:350,hp:150,fine:600},VIVE={numero:900,etichetta:1000,stato:900,scossa:250,hp:300};
 function effetti(ev,s){const c=ev.chi,b=ev.bers,o=[];
  switch(ev.t){
   case'muovi':o.push({t:'sposta',ms:Math.max(1,ev.passi.length)*MS.passo,chi:c,passi:ev.passi,indietro:!!ev.indietro});break;
   case'spinto':if(ev.passi>0&&ev.a)o.push({t:'sposta',ms:MS.passo*ev.passi*2,chi:b,passi:[ev.a],spinto:true,da:ev.da});else o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:'Fermo',tono:'neutro'});break;
   case'scatto':case'ritira-mov':case'movimento':case'aiuta':case'disimpegno':case'disimpegna':case'conc':case'conc-spesa':case'turno':break;
   case'arriva':o.push({t:'compare',ms:MS.compare,chi:c,q:ev.q,r:ev.r});break;
   case'tiro':o.push({t:'dado',ms:MS.dado,chi:c,bers:b,tiri:ev.tiri||[ev.tiro],tiro:ev.tiro,tot:ev.tot,cont:ev.cont,ok:!!ev.ok,crit:!!ev.crit,vant:!!ev.vant,svant:!!ev.svant});
    o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:ev.crit?'Critico!':ev.ok?'Colpito':'Mancato',tono:ev.ok?'brutto':'neutro'});break;
   case'salvezza':o.push({t:'dado',ms:MS.dado,chi:b,bers:b,tiri:[ev.tiro],tiro:ev.tiro,tot:ev.tot,cont:ev.cont,ok:!!ev.ok,crit:false,vant:false,svant:false,salvezza:true,ab:ev.ab});break;
   case'danno':if(ev.esito==='imm')o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:'Immune',tono:'neutro'});
    else{o.push({t:'numero',ms:MS.numero,chi:b,v:-ev.n,tipo:ev.tipo});o.push({t:'hp',ms:MS.hp,chi:b,d:-ev.perso});o.push({t:'scossa',ms:MS.scossa,chi:b});
     if(ev.esito==='res'||ev.esito==='vuln')o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:ev.esito==='res'?'Resiste':'Vulnerabile',tono:'neutro'})}break;
   case'dot':o.push({t:'numero',ms:MS.numero,chi:c,v:-ev.n,tipo:ev.tipo});o.push({t:'hp',ms:MS.hp,chi:c,d:-(ev.perso!=null?ev.perso:ev.n)});break;
   case'furtivo':o.push({t:'etichetta',ms:MS.etichetta,chi:c,testo:'Colpo a tradimento',tono:'buono'});break;
   case'cura':o.push({t:'numero',ms:MS.numero,chi:b,v:ev.n,tipo:'cura'});o.push({t:'hp',ms:MS.hp,chi:b,d:ev.n});break;
   case'temp':o.push({t:'numero',ms:MS.numero,chi:b,v:ev.n,tipo:'temp'});break;
   case'riduci':o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:'−'+ev.n+' danno',tono:'buono'});break;
   case'stato':o.push({t:'stato',ms:MS.stato,chi:b,stato:ev.stato,ok:!!ev.ok});break;
   case'resiste':o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:'Resiste',tono:'neutro'});break;
   case'rimuovi':o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:'Liberato',tono:'buono'});break;
   case'ritira':o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:'Ritira il dado',tono:'neutro'});break;
   case'reazione':o.push({t:'etichetta',ms:MS.etichetta,chi:c,testo:potere(ev.potere),tono:'buono'});break;
   case'opportunita':o.push({t:'etichetta',ms:MS.etichetta,chi:c,testo:'Attacco di opportunità',tono:'brutto'});break;
   case'oggetto':o.push({t:'etichetta',ms:MS.etichetta,chi:c,testo:ev.nome||String(ev.id),tono:'buono'});break;
   case'nasconditi':o.push({t:'etichetta',ms:MS.etichetta,chi:c,testo:ev.ok?'Nascosto':'Visto',tono:ev.ok?'buono':'neutro'});break;
   case'rialza':o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:ev.ok?'Si rialza':'Resta a terra',tono:ev.ok?'buono':'neutro'});if(ev.ok)o.push({t:'hp',ms:MS.hp,chi:b,d:ev.hp});break;
   case'spingi':if(c!=null&&!ev.ok)o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:'Resiste',tono:'neutro'});break;
   case'scivola':o.push({t:'etichetta',ms:MS.etichetta,chi:c,testo:'Scivola',tono:'neutro'});break;
   case'superficie':if(ev.n>0)o.push({t:'numero',ms:MS.numero,chi:c,v:-ev.n,tipo:'fuoco'});else if(ev.spenta)o.push({t:'etichetta',ms:MS.etichetta,chi:c,testo:'Spento',tono:'buono'});break;
   case'tenace':o.push({t:'etichetta',ms:MS.etichetta,chi:b,testo:'Tenace',tono:'buono'});break;
   case'fuga-gruppo':o.push({t:'etichetta',ms:MS.etichetta,chi:c,testo:ev.ok?'Fuga riuscita':'Fuga fallita',tono:ev.ok?'buono':'brutto'});break;
   case'cade':o.push({t:'cade',ms:MS.cade,chi:c});break;
   case'muore':o.push({t:'esce',ms:MS.esce,chi:c,come:'muore'});break;
   case'fuggito':o.push({t:'esce',ms:MS.esce,chi:c,come:'fugge'});break;
   case'arreso':o.push({t:'esce',ms:MS.esce,chi:c,come:'arreso'});break;
   case'giro':o.push({t:'giro',ms:MS.giro,n:ev.n});break;
   case'fine':if(ev.esito)o.push({t:'fine',ms:MS.fine,esito:ev.esito});break}
  if(ev.t==='turno')o.push({t:'turno',ms:MS.turno,chi:c,giro:ev.giro});
  return o}
 const durata=effetti_=>effetti_.reduce((a,x)=>a+x.ms,0);
 return{TIPI,ESITO,AB,MS,VIVE,nome,frase,riga,peso,effetti,durata,stato,potere}})();
if(typeof module!=='undefined')module.exports=ACRO;
