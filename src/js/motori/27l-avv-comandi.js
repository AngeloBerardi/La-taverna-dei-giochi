/* ---- Comandi della battaglia (Cantari di Ventura, A5.2): dai tocchi del giocatore alle azioni di ASCO.act. Puro: niente DOM, niente dadi. ----
   La vista disegna e inoltra i tocchi; qui si tiene la selezione e si decide che cosa significa ogni tocco. Nessuna regola di gioco: tutto ciò che è ammesso
   viene da ASCO.mosseValide / anteprima / anteprimaMuovi, quindi un'azione prodotta da qui è sempre accettata da `act`.
   Ogni mossa si fa in due tempi (scegli, poi conferma: stesso tocco, o il pulsante). Il controllore `c` è JSON puro e si ricalcola da solo se lo stato è cambiato.
     ACOM.nuovo(s) → c
     ACOM.tocca(c, s, {q, r})  → { c, azione? }     tocco su un esagono
     ACOM.scegli(c, s, uso)    → { c, azione? }     uso = { k:'attacca' } | { k:'potere', id } | { k:'oggetto', id } | { k:'speciale', t }
     ACOM.conferma(c, s)       → { c, azione? }     conferma ciò che è pronto
     ACOM.annulla(c, s) → c · ACOM.concentrazione(c, s) → c (vantaggio con la Concentrazione sul prossimo tiro per colpire)
     ACOM.evidenzia(c, s) → { celle, creature, percorso, linea, anteprima, testo, pronto }   cosa disegnare sulla mappa
     ACOM.pannello(c, s)  → { attacca, poteri, oggetti, speciali, conc, ... }                  cosa mettere nella barra delle azioni
     ACOM.pausa(p, s) → { titolo, testo, opzioni, rifiuta } · ACOM.rispondi(azione, scelta) → azione con la risposta in `dec`
   Modi di `c.modo`: riposo (nessuna selezione) · percorso (esagono scelto) · scelta (uso in preparazione, aspetta bersaglio/centro/direzione) · pronto (si può confermare). */
const ACOM=(()=>{
 const S=typeof ASCO!=='undefined'?ASCO:require('./27i-avv-scontro.js'),G=typeof AGRI!=='undefined'?AGRI:require('./27g-avv-griglia.js'),
  AP=typeof APOT!=='undefined'?APOT:require('./27e-avv-poteri.js'),CR=typeof ACRO!=='undefined'?ACRO:require('./27k-avv-cronaca.js');
 const cl=x=>JSON.parse(JSON.stringify(x)),pos=c=>({q:c.q,r:c.r}),stessa=(a,b)=>!!a&&!!b&&a.q===b.q&&a.r===b.r;
 const SPECIALI={scatto:['Scatto','Raddoppia il movimento di questo turno (costa l\'azione).'],disimpegno:['Disimpegno','Ti muovi senza attacchi di opportunità (costa l\'azione).'],
  nasconditi:['Nasconditi','Prova a sparire alla vista dei nemici (costa l\'azione).'],aiuta:['Aiuta','Dai vantaggio al prossimo attacco di un alleato vicino (costa l\'azione).'],
  rialza:['Rialza','Rimetti in piedi un compagno a terra, a contatto (costa l\'azione).'],spingi:['Spingi','Prova a spostare di un esagono un nemico a contatto (costa l\'azione).'],
  'fuga-gruppo':['Fuga di gruppo','Tutta la compagnia prova a fuggire dalla battaglia (costa l\'azione).'],fuggi:['Esci dall\'arena','Esci dal bordo: l\'eroe lascia la battaglia.'],
  'ritira-mov':['Ritira il movimento','Spendi 1 Concentrazione per tirare di nuovo i punti movimento (prima di muoverti).'],ritira:['Ritira il tiro','Spendi 1 Concentrazione: rigiochi l\'ultimo attacco con un nuovo d20.'],
  fine:['Fine turno','Passa il turno.']};
 const CON_BERSAGLIO=['aiuta','rialza','spingi'];
 const nuovo=s=>({v:1,chi:s&&!s.over&&s.turno?s.turno.id:null,evn:s?s.evn:0,modo:'riposo',uso:null,sel:{},pronto:null,info:null,conc:false,msg:''});
 const fresco=(c,s)=>c&&c.v===1&&c.evn===s.evn&&c.chi===(!s.over&&s.turno?s.turno.id:null)?cl(c):nuovo(s);
 const eroeDiTurno=s=>{const c=S.attore(s);return c&&c.lato==='eroi'?c:null};
 const creaturaA=(s,q,r)=>s.cb.find(x=>S.inCampo(x)&&x.q===q&&x.r===r)||null;
 const cellaOk=c=>!!c&&Number.isInteger(c.q)&&Number.isInteger(c.r);
 const nome=(s,id)=>CR.nome(s,id);
 // ---- che cosa si può toccare per l'uso in preparazione ----
 function bersagli(m,uso){
  if(uso.k==='attacca')return m.attacchi.length?{area:'singolo',ids:m.attacchi.map(x=>x.bers)}:{err:'Nessun nemico a tiro.'};
  if(uso.k==='speciale'){if(!SPECIALI[uso.t]||!m.azioni.includes(uso.t))return{err:'Non puoi farlo adesso.'};
   if(CON_BERSAGLIO.includes(uso.t)){const ids=(m.bersagli||{})[uso.t]||[];return ids.length?{area:'singolo',ids}:{err:'Nessun bersaglio vicino.'}}
   return{area:'se'}}
  const lista=uso.k==='potere'?m.poteri:uso.k==='oggetto'?m.oggetti:null,e=lista&&lista.find(x=>x.id===uso.id);if(!e)return{err:'Non puoi usarlo adesso.'};
  switch(e.area){case'se':case'aura':return{area:e.area,colpiti:e.colpiti||e.bersagli||[]};case'singolo':return{area:'singolo',ids:e.bersagli};case'cerchio':return{area:'cerchio',centri:e.centri};
   case'cono':case'linea':return{area:e.area,dirs:e.direzioni}}
  return{err:'Potere non valido.'}}
 const proprieta=uso=>uso.k==='potere'?AP.P[uso.id]:uso.k==='oggetto'?AP.oggetto(uso.id):uso.k==='attacca'?AP.P['attacco']:null;
 function azioneDi(uso,sel){
  if(uso.k==='attacca')return{t:'attacca',bers:sel.bers};
  if(uso.k==='speciale')return sel.bers?{t:uso.t,bers:sel.bers}:{t:uso.t};
  const a={t:uso.k,id:uso.id};if(sel.bers)a.bers=sel.bers;if(sel.centro)a.cella={q:sel.centro.q,r:sel.centro.r};if(sel.dir!=null)a.dir=sel.dir;return a}
 const conTiro=a=>{const p=a.t==='attacca'?AP.P['attacco']:a.t==='potere'?AP.P[a.id]:a.t==='oggetto'?AP.oggetto(a.id):null;return!!(p&&p.att)};
 function esegui(c,s){const a=Object.assign({},c.pronto);if(c.conc&&conTiro(a))a.conc='vant';const f=nuovo(s);f.info=c.info;return{c:f,azione:a}}
 const reset=(c,s,msg)=>{const f=nuovo(s);f.conc=c.conc;f.info=c.info;f.msg=msg||'';return f};
 function pronta(c,uso,sel){c.uso=uso;c.sel=sel;c.pronto=azioneDi(uso,sel);c.modo='pronto';return c}
 // ---- tocco ----
 function tocca(c,s,cella){c=fresco(c,s);const eroe=eroeDiTurno(s);
  if(!cellaOk(cella)){c.msg='';return{c}}
  const occ=creaturaA(s,cella.q,cella.r);
  if(!eroe){c.info=occ?occ.id:null;c.msg='';return{c}}
  const m=S.mosseValide(s);c.msg='';
  if(c.uso)return provaUso(c,s,m,eroe,cella,occ);
  // senza un uso in preparazione: nemico a tiro → attacco pronto; esagono raggiungibile → percorso; altro → scheda
  const att=occ&&m.attacchi.find(x=>x.bers===occ.id);
  if(att){c.info=occ.id;return{c:pronta(c,{k:'attacca'},{bers:occ.id})}}
  const dest=!occ&&m.muovi.find(x=>x.q===cella.q&&x.r===cella.r);
  if(dest){if(c.modo==='percorso'&&stessa(c.sel.cella,cella)){c.pronto={t:'muovi',a:{q:cella.q,r:cella.r}};return esegui(c,s)}
   c.modo='percorso';c.sel={cella:{q:cella.q,r:cella.r}};c.pronto={t:'muovi',a:{q:cella.q,r:cella.r}};c.info=null;return{c}}
  const f=reset(c,s);f.info=occ&&(!c.info||c.info!==occ.id)?occ.id:null;return{c:f}}
 function provaUso(c,s,m,eroe,cella,occ){
  const b=bersagli(m,c.uso);if(b.err)return{c:reset(c,s,b.err)};
  const ripensa=()=>tocca(reset(c,s),s,cella);   // un tocco altrove annulla la scelta e vale come tocco normale
  const scelta=sel=>{const nuova=azioneDi(c.uso,sel);
   if(c.modo==='pronto'&&JSON.stringify(nuova)===JSON.stringify(c.pronto))return esegui(c,s);
   c.sel=sel;c.pronto=nuova;c.modo='pronto';return{c}};
  switch(b.area){
   case'singolo':return occ&&b.ids.includes(occ.id)?scelta({bers:occ.id}):ripensa();
   case'cerchio':return b.centri.some(x=>x.q===cella.q&&x.r===cella.r)?scelta({centro:{q:cella.q,r:cella.r}}):ripensa();
   case'cono':case'linea':{if(stessa(cella,eroe))return{c:reset(c,s)};
    const dir=(b.area==='cono'?G.direzioneVerso:G.asseVerso)(pos(eroe),cella);return dir!=null&&b.dirs.some(d=>d.dir===dir)?scelta({dir}):ripensa()}
   default:return stessa(cella,eroe)?(c.pronto?esegui(c,s):{c:reset(c,s)}):ripensa()}}
 // ---- scelte dai pannelli ----
 function scegli(c,s,uso){c=fresco(c,s);const eroe=eroeDiTurno(s);if(!eroe){c.msg='Non è il tuo turno.';return{c}}
  const m=S.mosseValide(s),b=bersagli(m,uso||{});if(b.err)return{c:reset(c,s,b.err)};
  const f=reset(c,s);f.uso=uso;f.modo='scelta';
  if(b.area==='se'||b.area==='aura'){f.sel={};f.pronto=azioneDi(uso,f.sel);f.modo='pronto';return{c:f}}
  if(b.area==='singolo'&&b.ids.length===1){f.sel={bers:b.ids[0]};f.pronto=azioneDi(uso,f.sel);f.modo='pronto';return{c:f}}
  if(b.area==='cerchio'&&b.centri.length===1){f.sel={centro:{q:b.centri[0].q,r:b.centri[0].r}};f.pronto=azioneDi(uso,f.sel);f.modo='pronto';return{c:f}}
  if((b.area==='cono'||b.area==='linea')&&b.dirs.length===1){f.sel={dir:b.dirs[0].dir};f.pronto=azioneDi(uso,f.sel);f.modo='pronto';return{c:f}}
  return{c:f}}
 function conferma(c,s){c=fresco(c,s);if(!eroeDiTurno(s)||!c.pronto){c.msg=c.pronto?'':'Scegli prima che cosa fare.';return{c}}return esegui(c,s)}
 const annulla=(c,s)=>{c=fresco(c,s);const f=nuovo(s);f.info=c.info;return f};
 function concentrazione(c,s){c=fresco(c,s);const e=eroeDiTurno(s);if(!e)return c;
  if(c.conc){c.conc=false;return c}
  if(e.conc<1){c.msg='Non hai Concentrazione.';return c}c.conc=true;c.msg='';return c}
 // ---- che cosa disegnare ----
 function evidenzia(c,s){c=fresco(c,s);const o={celle:[],creature:[],percorso:null,linea:null,anteprima:null,testo:'',pronto:!!c.pronto,modo:c.modo,info:c.info},eroe=eroeDiTurno(s),att=S.attore(s);
  if(s.over){o.testo=CR.ESITO[s.over.esito]||'';return o}
  if(!eroe){o.testo=att?`Tocca a ${nome(s,att.id)}…`:'';return o}
  const m=S.mosseValide(s),ar=s.arena;
  const celleArea=(lista,tipo)=>{for(const x of lista)if(G.dentro(ar,x))o.celle.push({q:x.q,r:x.r,tipo})};
  if(!c.uso){
   for(const x of m.muovi)o.celle.push({q:x.q,r:x.r,tipo:'passo',costo:x.costo});
   for(const a of m.attacchi)o.creature.push({id:a.bers,tipo:'attaccabile'});
   if(c.modo==='percorso'&&c.sel.cella){const p=S.anteprimaMuovi(s,c.sel.cella);
    if(!p.err){o.percorso=p;for(const x of p.passi.slice(0,-1))o.celle.push({q:x.q,r:x.r,tipo:'percorso'});const u=p.passi[p.passi.length-1];o.celle.push({q:u.q,r:u.r,tipo:'meta',costo:p.costo});
     for(const id of p.opportunita)o.creature.push({id,tipo:'minaccia'});
     o.testo=`Tocca ancora per muoverti: costo ${p.costo} di ${s.turno.pm}.${p.opportunita.length?' Attacco di opportunità: '+p.opportunita.map(id=>nome(s,id)).join(', ')+'.':''}`}}
   else o.testo=m.muovi.length||m.attacchi.length?'Tocca un esagono per muoverti o un nemico per attaccarlo.':'Non puoi fare altro: concludi il turno.';
   if(c.modo==='riposo'&&c.info)o.creature.push({id:c.info,tipo:'info'});
   return o}
  const b=bersagli(m,c.uso);if(b.err){o.testo=b.err;return o}
  const p=proprieta(c.uso);
  switch(b.area){
   case'singolo':for(const id of b.ids)o.creature.push({id,tipo:c.uso.k==='attacca'||(creaturaPerId(s,id).lato!==eroe.lato)?'attaccabile':'valido'});
    if(c.sel.bers){o.creature.push({id:c.sel.bers,tipo:'scelto'});const bb=creaturaPerId(s,c.sel.bers);if(bb){const v=G.vista(ar,pos(eroe),pos(bb));o.linea={da:pos(eroe),a:pos(bb),visibile:v.visibile,cop:v.cop||'nessuna'}}}break;
   case'cerchio':for(const x of b.centri)o.celle.push({q:x.q,r:x.r,tipo:'centro'});
    if(c.sel.centro){celleArea(G.cerchio(ar,c.sel.centro,p.raggio),'area');o.celle.push({q:c.sel.centro.q,r:c.sel.centro.r,tipo:'centro-scelto'});
     for(const id of (b.centri.find(x=>stessa(x,c.sel.centro))||{colpiti:[]}).colpiti)o.creature.push({id,tipo:'colpito'})}break;
   case'cono':case'linea':
    for(const d of b.dirs){const v=G.vicini(pos(eroe))[d.dir];if(v&&G.dentro(ar,v))o.celle.push({q:v.q,r:v.r,tipo:'direzione',dir:d.dir})}
    if(c.sel.dir!=null){celleArea(b.area==='cono'?G.cono(ar,pos(eroe),c.sel.dir,p.raggio):G.lineaDa(ar,pos(eroe),c.sel.dir,p.raggio),'area');
     for(const id of (b.dirs.find(d=>d.dir===c.sel.dir)||{colpiti:[]}).colpiti)o.creature.push({id,tipo:'colpito'})}break;
   case'aura':celleArea(G.aura(ar,pos(eroe),p.raggio),'area');for(const id of b.colpiti)o.creature.push({id,tipo:'colpito'});break;
   case'se':break}
  if(c.pronto&&['attacca','potere','oggetto'].includes(c.pronto.t)){const a=Object.assign({},c.pronto);if(c.conc&&conTiro(a))a.conc='vant';const an=S.anteprima(s,a);if(!an.err)o.anteprima=an}
  o.testo=c.pronto?(c.pronto.t==='fine'?'Tocca ancora (o Conferma) per finire il turno.':'Tocca ancora, o premi Conferma, per eseguire.'):indizio(c.uso,b);
  return o}
 const creaturaPerId=(s,id)=>S.trova(s,id)||{};
 function indizio(uso,b){switch(b.area){case'singolo':return'Tocca il bersaglio.';case'cerchio':return'Tocca il centro dell\'area.';case'cono':case'linea':return'Tocca la direzione.';default:return'Conferma per usarlo.'}}
 // frase con i numeri dell'anteprima di un attacco o di un potere (la vista la mette sotto la mappa)
 const COPERTURA={mezza:'mezza copertura (+2 CA)','tre-quarti':'tre quarti di copertura (+5 CA)'};
 function testoAnteprima(an,conc){if(!an)return'';const pc=x=>Math.round(x*100)+'%',nu=x=>(Math.round(x*10)/10).toString().replace('.',',');
  if(an.bersagli){const t=[`${an.n} ${an.n===1?'creatura':'creature'}`],uno=an.bersagli[0];
   if(an.atteso>0)t.push('danno atteso '+nu(an.atteso));if(an.cura>0)t.push('cura '+nu(an.cura));
   if(an.n===1&&uno.pc!=null&&uno.pc<1)t.push('colpisci '+pc(uno.pc));if(an.n===1&&uno.ps!=null)t.push('salvezza fallita '+pc(1-uno.ps));
   return t.join(' · ')+'.'}
  const t=[`Colpisci ${pc(an.pc)}`];if(an.pcrit>0.005)t.push('critico '+pc(an.pcrit));t.push(`${nu(an.dannoColpo)} danni a colpo`,`atteso ${nu(an.atteso)}`);
  if(COPERTURA[an.cop])t.push(COPERTURA[an.cop]);
  if(an.vant&&an.svant)t.push('vantaggio e svantaggio si annullano');else if(an.vant)t.push(conc?'vantaggio (Concentrazione)':'vantaggio');else if(an.svant)t.push('svantaggio');
  if(an.lunga)t.push('gittata lunga');return t.join(' · ')+'.'}
 // ---- barra delle azioni ----
 function pannello(c,s){c=fresco(c,s);const eroe=eroeDiTurno(s),att=S.attore(s);
  const out={chi:att?att.id:null,eroe:!!eroe,attacca:{ok:false,perche:''},poteri:[],oggetti:[],speciali:[],conc:{ok:false,n:0,max:0,attiva:!!c.conc},fine:!!eroe,uso:c.uso,pronto:!!c.pronto};
  if(!eroe)return out;
  const m=S.mosseValide(s),t=s.turno,perche=(costo)=>costo==='azione'&&!t.azione?'Hai già usato l\'azione.':costo==='bonus'&&!t.bonus?'Hai già usato l\'azione bonus.':'Nessun bersaglio a tiro.';
  out.attacca=m.attacchi.length?{ok:true,perche:'',n:m.attacchi.length}:{ok:false,perche:t.azione?'Nessun nemico a tiro.':'Hai già usato l\'azione.'};
  out.conc={ok:eroe.conc>=1,n:eroe.conc,max:eroe.concMax,attiva:!!c.conc};
  for(const id of eroe.poteri){const p=AP.P[id];if(!p||id==='attacco'||p.costo==='reazione'||p.costo==='sempre'||p.costo==='passivo')continue;
   const e=m.poteri.find(x=>x.id===id),rimasti=AP.usiMax(eroe,p)!=null?AP.usiRimasti(eroe,p):null;
   out.poteri.push({id,nome:p.nome,costo:p.costo,area:p.area,desc:p.desc||'',ok:!!e,perche:e?'':rimasti===0?'Cariche finite.':perche(p.costo),usi:rimasti,usiMax:AP.usiMax(eroe,p)})}
  const conta={};for(const id of eroe.cintura||[])conta[id]=(conta[id]||0)+1;
  for(const id of Object.keys(conta)){const p=AP.oggetto(id);if(!p)continue;const e=m.oggetti.find(x=>x.id===id);out.oggetti.push({id,nome:p.nome,costo:p.costo,area:p.area,n:conta[id],ok:!!e,perche:e?'':perche(p.costo)})}
  for(const k of Object.keys(SPECIALI)){if(k==='fine')continue;const ok=m.azioni.includes(k);
   if(!ok&&['fuggi','ritira','ritira-mov'].includes(k))continue;   // si mostrano solo quando hanno senso
   out.speciali.push({t:k,nome:SPECIALI[k][0],desc:SPECIALI[k][1],ok,perche:ok?'':k==='fuga-gruppo'||k==='scatto'||k==='disimpegno'||k==='nasconditi'||CON_BERSAGLIO.includes(k)?(!t.azione?'Hai già usato l\'azione.':'Non adesso.'):'Non adesso.'})}
  out.puoRitirare=m.azioni.includes('ritira');out.pm=t.pm;out.azione=!!t.azione;out.bonus=!!t.bonus;out.rea=!!eroe.rea;return out}
 // ---- pause (reazioni) ----
 function pausa(p,s){const i=p.info||{},N=id=>nome(s,id);
  const testo=p.quando==='colpo'?`${N(i.att)} attacca ${N(i.bers)}: ${i.tot} contro CA ${i.ca}.`:p.quando==='danno'?`${N(i.att)} sta per infliggere ${i.n} danni${i.dtipo?' da '+i.dtipo:''} a ${N(i.bers)}.`:'Puoi reagire.';
  return{chi:p.chi,titolo:`Reazione di ${N(p.chi)}`,testo,opzioni:p.opzioni.map(o=>({id:o.id,nome:o.nome,desc:o.desc||''})),rifiuta:'Nessuna reazione'}}
 const rispondi=(azione,scelta)=>Object.assign({},azione,{dec:(azione.dec||[]).concat([scelta==null?null:scelta])});
 return{SPECIALI,nuovo,tocca,scegli,conferma,annulla,concentrazione,evidenzia,pannello,testoAnteprima,pausa,rispondi,fresco}})();
if(typeof module!=='undefined')module.exports=ACOM;
