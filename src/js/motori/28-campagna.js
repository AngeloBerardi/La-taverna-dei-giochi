/* ---- Campagna (stato v3): il mondo, gli eroi separati, i giri, i mostri visibili, i sotterranei, i servizi, la perdizione a soglie (motore puro). ----
   Fondamenta delle campagne: da 1 a 4 eroi (motori/27-eroi.js) camminano ciascuno per conto proprio su una mappa grande a esagoni (27m, `AMON`) con tre regioni,
   città, villaggi, santuari, rovine, antri, una torre. Ogni eroe tira il suo movimento (`tira`, con Concentrazione = vantaggio) e si muove da solo o insieme agli altri
   (`muovi` senza eroe = tutti quelli nella stessa cella). Un giorno è di 8 giri; finito il giro si muovono i mostri visibili (27o, `AMOS`); se uno raggiunge gli eroi
   parte una battaglia (27i): `CAMP.battaglia(s)` la prepara, `act(s,{t:'esito',riep})` ne applica il risultato. I sotterranei (27n, `ALUO`) sono sequenze di stanze.
   La perdizione ha soglie a 25/50/75 che cambiano la mappa; a 100 la campagna è persa.
   I dadi vengono dal generatore nello stato (`s.rng`, 27a): senza un `rnd` esterno la partita è ripetibile. Gli stati v1 e v2 si aggiornano da soli con `migra`.
   Contratto come gli altri motori: nuova(...) -> stato, act(stato, azione, rnd) -> {s} | {err}. Lo stato è JSON puro. Piano: docs/AVVENTURA-A6.md. */
const CAMP=(()=>{
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const AO=typeof AOGG!=='undefined'?AOGG:require('./27b-avv-oggetti.js');
 const BO=typeof ABOT!=='undefined'?ABOT:require('./27c-avv-bottino.js');
 const AP=typeof APOT!=='undefined'?APOT:require('./27e-avv-poteri.js');
 const BE=typeof BEST!=='undefined'?BEST:require('./27f-avv-bestiario.js');
 const AR=typeof AARE!=='undefined'?AARE:require('./27h-avv-arene.js');
 const SC=typeof ASCO!=='undefined'?ASCO:require('./27i-avv-scontro.js');
 const MON=typeof AMON!=='undefined'?AMON:require('./27m-avv-mondo.js');
 const LU=typeof ALUO!=='undefined'?ALUO:require('./27n-avv-luoghi.js');
 const MOS=typeof AMOS!=='undefined'?AMOS:require('./27o-avv-mostri.js');
 const {TERRENI,K,dist,vicini,DIREZIONI,mulberry,celleRaggio,passabile,percorso}=MON;
 const MAX_EROI=4,PASSI=['citta','antro','torre'],NOME_POI=Object.fromEntries(Object.entries(MON.TIPI).map(([k,v])=>[k,v.n]));
 // numeri della campagna in un solo posto (il bilanciamento fine è di A12)
 const PARAM={giriGiorno:8,giriLuce:5,pmMin:3,alba:3,fuga:1,sconfitta:2,incontro:.12,imboscata:.2,capoMargine:1,vistaEroe:2,xpSott:{antro:60,rovina:40,torre:100}};
 // incontri casuali con prova d20 (residui, sulle celle senza luogo): nascono dopo un movimento con probabilità legata a notte e perdizione
 const TIPI={
  bestie:{testo:'Un branco di bestie vi circonda.',ab:['atletica','intimidire','furtivita'],ric:{xp:30,oro:5},dan:6},
  trappola:{testo:'Una trappola nascosta scatta sotto i vostri piedi.',ab:['acrobazia','percezione'],ric:{xp:20,oro:0},dan:5},
  viandante:{testo:'Un viandante sospettoso vi sbarra la strada.',ab:['persuasione','intimidire','storia'],ric:{xp:20,oro:12},dan:3},
  tempesta:{testo:'Una tempesta improvvisa vi sorprende.',ab:['sopravvivenza','atletica'],ric:{xp:15,oro:0},dan:4},
  rovina:{testo:'Tra le rovine c\'è un enigma scolpito nella pietra.',ab:['arcano','storia','percezione'],ric:{xp:25,oro:15},dan:4}};
 const PER_TERRENO={bosco:['bestie','viandante','trappola'],palude:['tempesta','bestie','trappola'],collina:['bestie','rovina','tempesta'],pianura:['viandante','bestie','tempesta'],strada:['viandante','bestie','trappola'],montagna:['tempesta'],acqua:[]};
 const DROP=['bestie','viandante','rovina']; // incontri che lasciano oggetti
 const TESTO_PASSO={citta:'Il sindaco indica un antro a nord da cui esce l\'oscurità.'};
 const ERRORE_ORDINE={antro:'Prima va ascoltato il sindaco della città',torre:'Prima va ripulito l\'antro'};
 // ---- piccoli aiuti ----
 const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};
 const copia=s=>JSON.parse(JSON.stringify(s));
 const vivi=s=>s.eroi.filter(e=>e.hp>0);
 const stessa=(a,b)=>a.q===b.q&&a.r===b.r;
 const cellaDi=(s,p)=>s.celle[K(p.q,p.r)];
 const luogoDi=(s,p)=>{const c=cellaDi(s,p);return c&&c.luogo?s.luoghi[c.luogo]||null:null};
 const mercanteQui=(s,p)=>(s.mercanti||[]).find(x=>x.q===p.q&&x.r===p.r)||null;
 const eroeDi=e=>({base:e.base,razza:e.razza,classe:e.classe,liv:e.liv,equip:e.equip});
 const nomeFam=f=>(typeof BEST!=='undefined'?BEST.FAMIGLIE:{bestie:'Bestie',banditi:'Banditi',nonmorti:'Non morti',torre:'Creature della torre'})[f]||f;
 const seme32=rnd=>Math.floor(rnd()*4294967296)>>>0;
 const hashStr=t=>{let h=7;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
 // costo di una cella per chi cammina: le strade sbarrate (perdizione 75) costano 2
 const costoCella=s=>x=>{const c=TERRENI[x.t].c;return c!=null&&s.sbarrate&&x.t==='strada'?2:c};
 const celleMostri=s=>new Set(s.mostri.map(m=>K(m.q,m.r)));
 const movBase=e=>{try{return EROI.derivati(eroeDi(e)).mov}catch(x){return e.mov||6}};
 function rivela(s,q,r,raggio){MON.rivela(s.celle,q,r,raggio)}
 // i caduti seguono l'eroe in piedi più vicino; `party` è la posizione di riferimento (il primo eroe in piedi)
 function sincronizza(s){const v=vivi(s);for(const e of s.eroi)if(e.hp<=0&&v.length){let t=v[0];for(const x of v)if(dist(x,e)<dist(t,e))t=x;e.q=t.q;e.r=t.r}
  const r=v[0]||s.eroi[0];s.party={q:r.q,r:r.r}}
 // ---- perdizione a soglie ----
 function perd(s,n,rnd){if(!n)return;const prima=LU.livelloPerdizione(s.perdizione);s.perdizione=Math.max(0,Math.min(100,s.perdizione+n));const dopo=LU.livelloPerdizione(s.perdizione);
  if(dopo!==prima)soglie(s,prima,dopo,rnd);
  if(s.perdizione>=100&&!s.over)s.over={win:false,reason:'La perdizione ha inghiottito il regno'}}
 function soglie(s,prima,dopo,rnd){const E=LU.EFFETTI[dopo];if(dopo>prima&&LU.NOTE_SOGLIA[dopo])L(s,LU.NOTE_SOGLIA[dopo]);
  const assediati=Object.values(s.luoghi).filter(l=>l.assedio);
  if(E.assedio&&!assediati.length){const l=MOS.assedia(s,rnd);if(l)L(s,l.nome+' è sotto assedio!')}
  else if(!E.assedio&&assediati.length){MOS.togliAssedio(s);L(s,'L\'assedio si allenta: la tenebra arretra.')}
  if(!!E.strade!==!!s.sbarrate){s.sbarrate=!!E.strade;L(s,s.sbarrate?'Le strade sono sbarrate: costano il doppio.':'Le strade si riaprono.')}
  MOS.rinasci(s,rnd)}
 // ---- bottino ----
 const pericolo=(s,p)=>Math.min(BO.PERICOLO_MAX,1+Math.floor(dist({q:0,r:0},p)/2));
 const ambiente=(s,p)=>{const x=cellaDi(s,p);return x.poi==='antro'||x.poi==='torre'?x.poi:x.t==='bosco'?'bosco':'strada'};
 const testoBottino=(s,b,r)=>[].concat(b.oro?[b.oro+' monete']:[],r.presi.map(x=>AO.OGG[x.id].nome+' ('+s.eroi[x.eroe].nome+')'),r.convertiti.map(id=>AO.OGG[id].nome+' (venduto: zaini pieni)')).join(', ');
 function bottinoQui(s,rnd,p,o,intro){const b=BO.bottino(rnd,Object.assign({pericolo:pericolo(s,p),ambiente:ambiente(s,p)},o));if(o.soloOggetti)b.oro=0;const r=BO.assegna(s,b),tx=testoBottino(s,b,r);if(tx)L(s,intro+tx+'.')}
 // ---- tempo: giri, alba, riposi ----
 const faseDi=round=>round>PARAM.giriLuce?'notte':'giorno';
 // l'alba: nuovo giorno, perdizione +3, cure; `cura` = frazione dei PF che torna (riposo lungo), altrimenti solo la piccola cura naturale
 function alba(s,rnd,cura){s.giorno++;s.round=1;s.fase='giorno';
  for(const e of s.eroi){e.brevi=0;e.pm=null;
   if(cura!=null){if(e.hp>0)e.hp=cura>=1?e.hpMax:Math.min(e.hpMax,e.hp+Math.max(1,Math.floor(e.hpMax*cura)));AP.riposo(e,'lungo')}
   else{if(e.hp>0)e.hp=Math.min(e.hpMax,e.hp+Math.max(1,Math.floor(e.hpMax*LU.NATURALE)));AP.riposo(e,'breve')}}
  perd(s,PARAM.alba,rnd);L(s,'Giorno '+s.giorno+'. La perdizione sale a '+s.perdizione+'.');
  if(!s.over){MOS.rinasci(s,rnd);rinnovaTaglie(s)}}
 function rinnovaTaglie(s){for(const l of Object.values(s.luoghi)){if(!LU.SERVIZI[l.tipo].includes('bacheca'))continue;
  l.taglie=(l.taglie||[]).filter(t=>t.riscossa?false:s.mostri.some(m=>m.id===t.mostro)||s.sconfitti.includes(t.mostro));
  if(l.taglie.length<2){const ha=new Set(l.taglie.map(t=>t.mostro));for(const t of LU.taglie(s.seed+hashStr(l.id),s.giorno,s.mostri.filter(m=>!ha.has(m.id)),2-l.taglie.length))l.taglie.push(t)}}}
 // un giro che passa: i mostri e i mercanti si muovono, poi (se non sottoterra) si controlla se qualcuno raggiunge gli eroi
 function passaGiro(s,rnd,sotto){for(const e of s.eroi)e.pm=null;
  if(!sotto){MOS.fase(s,rnd);MOS.mercanti(s,rnd)}
  s.turno++;s.round++;
  if(s.round>PARAM.giriGiorno)alba(s,rnd);
  else{const f=faseDi(s.round);if(f==='notte'&&s.fase==='giorno')L(s,'Scende la notte.');s.fase=f}
  if(!sotto&&!s.over)cercaContatto(s,rnd)}
 function cercaContatto(s,rnd){if(s.sfida||s.dentro)return false;for(const e of vivi(s)){const m=MOS.contatto(s,e.q,e.r);if(m){iniziaSfida(s,m,{},rnd);return true}}return false}
 // ---- battaglie ----
 function iniziaSfida(s,m,o,rnd){const q=MOS.quali(s,m),c=cellaDi(s,m),n=MOS.composizione(s,m,q.quali.length).nemici;
  s.sfida={k:'battaglia',mostro:m.id,luogo:null,stanza:null,nemici:n,ambiente:AR.ambienteDa(c.t,c.poi),seme:seme32(rnd),quali:q.quali,dist:q.dist,sorpresa:o.sorpresa||null,q:m.q,r:m.r};
  L(s,(o.sorpresa==='eroi'?'Un\'imboscata! ':'')+'Un gruppo di '+nomeFam(m.fam).toLowerCase()+' ('+n.length+') vi attacca.')}
 // battaglia pronta per la vista (A5): uno stato di ASCO con gli eroi che partecipano, ciascuno a `dist` esagoni
 function battaglia(s){const f=s.sfida;if(!f)return null;
  return SC.daCampagna({eroi:f.quali.map(i=>s.eroi[i]),seed:s.seed,evn:s.evn,giorno:s.giorno},{nemici:f.nemici,ambiente:f.ambiente,seme:f.seme,dist:f.dist,sorpresa:f.sorpresa||undefined})}
 function esito(s,a,rnd){const f=s.sfida;if(!f)return{err:'Nessuna battaglia in corso'};const riep=a.riep;if(!riep||riep.esito==null)return{err:'La battaglia non è finita'};
  const r=SC.aggiorna({eroi:f.quali.map(i=>s.eroi[i])},riep);if(r.err)return{err:r.err};
  f.quali.forEach((i,k)=>{s.eroi[i]=r.s.eroi[k]});const m=s.mostri.find(x=>x.id===f.mostro),sott=f.luogo?s.sotterranei[f.luogo]:null,pos={q:f.q,r:f.r};
  if(!vivi(s).length){s.over={win:false,reason:'Tutti gli eroi sono caduti'};s.sfida=null;return{}}
  if(riep.esito==='vittoria'){
   L(s,'Vittoria! '+(riep.xpPerEroe?riep.xpPerEroe+' esperienza a testa.':''));
   if(m){s.mostri=s.mostri.filter(x=>x.id!==m.id);s.sconfitti.push(m.id);if(m.assedio){const l=s.luoghi[m.assedio];MOS.togliAssedio(s,m.assedio);L(s,'L\'assedio di '+(l?l.nome:'un villaggio')+' è spezzato!');perd(s,-2,rnd)}}
   const boss=sott&&sott.stanze[f.stanza]&&sott.stanze[f.stanza].k==='boss';
   bottinoQui(s,rnd,pos,{fonte:boss?'ricompensa':'nemico',pericolo:boss?undefined:Math.min(5,Math.ceil(((m&&m.liv)||MOS.livelloMedio(s))/2))},'Tra i caduti trovate: ');
   s.sfida=null;if(sott)stanzaFatta(s,s.luoghi[f.luogo],rnd)}
  else{ // sconfitta, fuga o stallo: la compagnia si ritira, il gruppo si ferma un attimo
   const persa=riep.esito==='sconfitta';L(s,persa?'La compagnia è sconfitta e si ritira.':'La compagnia si ritira dalla battaglia.');
   if(m)m.pausa=persa?3:2;perd(s,persa?PARAM.sconfitta:PARAM.fuga,rnd);
   if(!sott){const lontano=ritirata(s,pos,m);for(const i of f.quali){const e=s.eroi[i];if(e.hp>0&&lontano){e.q=lontano.q;e.r=lontano.r}}}
   else s.dentro=null;
   s.sfida=null}
  sincronizza(s);return{}}
 // la cella a due esagoni dal gruppo (libera e calpestabile) più lontana: dove la compagnia ripiega
 function ritirata(s,da,m){const occ=celleMostri(s);let best=null,bd=-1;
  for(const c of celleRaggio(3)){const q=da.q+c.q,r=da.r+c.r,x=s.celle[K(q,r)];if(!x||!passabile(x.t)||occ.has(K(q,r)))continue;const d=dist({q,r},da);if(d>=2&&d<=3&&(d>bd||(d===bd&&!best))){bd=d;best={q,r}}}
  return best}
 // ---- movimento ----
 function tira(s,i,rnd,conc){const e=s.eroi[i];if(!e||e.hp<=0)return{err:'Scegli un eroe in piedi'};if(e.pm!=null)return{err:e.nome+' ha già tirato il movimento'};
  if(conc&&!(e.conc>=1))return{err:'Non hai Concentrazione'};
  const a=DAD.d(rnd,4),tiri=[a];let t=a;if(conc){const b=DAD.d(rnd,4);tiri.push(b);t=Math.max(a,b);e.conc--}
  e.pm=Math.max(PARAM.pmMin,movBase(e)-2+t);s.ultimoTiro={eroe:i,tiri,pm:e.pm,conc:!!conc};return{}}
 // incontro casuale dopo un movimento (residuo): meno frequente ora che i mostri si vedono
 function incontroDopoMossa(s,rnd,p){const x=cellaDi(s,p),pr=PARAM.incontro+(s.fase==='notte'?.1:0)+s.perdizione/500;
  if(x.poi||rnd()>pr)return null;const lista=PER_TERRENO[x.t]||PER_TERRENO.pianura,tipo=lista[Math.floor(rnd()*lista.length)];
  return{kind:tipo,cd:10+Math.floor(s.perdizione/12)+(s.fase==='notte'?2:0),testo:TIPI[tipo].testo,ab:TIPI[tipo].ab.slice(),q:p.q,r:p.r}}
 function muovi(s,a,rnd){
  if(s.dentro)return{err:'Sei dentro un sotterraneo: esci prima'};const v=vivi(s);if(!v.length)return{err:'Nessun eroe in piedi'};
  let gruppo;if(a.eroe==null){if(!v.every(e=>stessa(e,v[0])))return{err:'Gli eroi sono separati: scegli chi muovere'};gruppo=v}
  else{const e=s.eroi[a.eroe];if(!e||e.hp<=0)return{err:'Scegli un eroe in piedi'};gruppo=a.tutti?v.filter(x=>stessa(x,e)):[e]}
  const dest={q:a.q,r:a.r},x=s.celle[K(dest.q,dest.r)];if(!x)return{err:'Fuori dalla mappa'};const cc=costoCella(s);if(cc(x)==null)return{err:TERRENI[x.t].n+': non si passa'};
  const da={q:gruppo[0].q,r:gruppo[0].r};if(stessa(da,dest))return{err:'Sei già lì'};if(celleMostri(s).has(K(dest.q,dest.r)))return{err:'Lì c\'è un nemico'};
  const p=percorso(s.celle,da,dest,null,{vieta:celleMostri(s),costo:cc});if(!p)return{err:'Non c\'è un cammino fin lì'};
  for(const g of gruppo)if(g.pm==null)tira(s,s.eroi.indexOf(g),rnd,false);
  let fine=p.length,sf=null;for(let k=0;k<p.length;k++){const m=MOS.contatto(s,p[k].q,p[k].r);if(m){fine=k+1;sf=m;break}}
  const passi=p.slice(0,fine),costo=passi.reduce((t,c)=>t+cc(s.celle[K(c.q,c.r)]),0);
  if(gruppo.some(g=>g.pm<costo))return{err:'Movimento insufficiente'};
  const fin=passi[passi.length-1];for(const g of gruppo){g.pm-=costo;g.q=fin.q;g.r=fin.r}
  for(const c of passi)rivela(s,c.q,c.r,PARAM.vistaEroe);s.turno++;sincronizza(s);
  if(sf){L(s,(gruppo.length>1?'La compagnia':gruppo[0].nome)+' si imbatte in nemici.');iniziaSfida(s,sf,{},rnd);return{}}
  const cella=cellaDi(s,fin);
  if(cella.poi==='tesoro'){const l=s.luoghi[cella.luogo];cella.poi=null;cella.luogo=null;if(l)delete s.luoghi[l.id];bottinoQui(s,rnd,fin,{fonte:'scrigno'},'In un forziere: ')}
  else if(cella.poi==='campo')L(s,'Un accampamento: qui si può dormire, con le razioni.');
  else if(cella.luogo&&s.luoghi[cella.luogo])L(s,(gruppo.length>1?'La compagnia arriva':gruppo[0].nome+' arriva')+' a '+s.luoghi[cella.luogo].nome+'.');
  s.incontro=incontroDopoMossa(s,rnd,fin);if(s.incontro)L(s,s.incontro.testo);return{}}
 // ---- riposi ----
 function breve(s,a){const e=s.eroi[a.eroe];if(!e||e.hp<=0)return{err:'Scegli un eroe in piedi'};if(s.dentro)return{err:'Sottoterra si riposa nelle stanze di riposo'};
  if(e.brevi>=LU.BREVE.max)return{err:e.nome+' ha già riposato abbastanza oggi'};if(s.mostri.some(m=>dist(m,e)<=LU.BREVE.distanza))return{err:'Troppo vicino ai nemici per riposare'};
  const cura=Math.max(1,Math.ceil(e.hpMax*LU.BREVE.pct));e.hp=Math.min(e.hpMax,e.hp+cura);e.brevi++;e.pm=0;AP.riposo(e,'breve');L(s,e.nome+' riprende fiato (+'+cura+' PF).');return{}}
 function consumaRazioni(s,n){const v=vivi(s),tot=v.reduce((t,e)=>t+e.zaino.filter(x=>x==='razione').length,0);if(tot<n)return false;
  for(const e of v)while(n>0&&e.zaino.includes('razione')){e.zaino.splice(e.zaino.indexOf('razione'),1);n--}return true}
 function lungo(s,rnd){const v=vivi(s);if(!v.length)return{err:'Nessun eroe in piedi'};if(s.dentro)return{err:'Non si dorme sottoterra'};
  if(!v.every(e=>stessa(e,v[0])))return{err:'Riunite la compagnia nello stesso luogo'};const l=luogoDi(s,v[0]);
  if(!l||!['citta','villaggio','campo'].includes(l.tipo))return{err:'Si dorme al sicuro: in una locanda o a un accampamento'};if(l.assedio)return{err:l.nome+' è sotto assedio: la locanda è chiusa'};
  let cura=1;
  if(l.tipo==='campo'){const tot=v.reduce((t,e)=>t+e.zaino.filter(x=>x==='razione').length,0);if(tot<v.length)return{err:'Servono '+v.length+' razioni da viaggio (una a eroe): ne avete '+tot};
   const lv=LU.livelloPerdizione(s.perdizione);
   if(rnd()<PARAM.imboscata+.1*lv){const occ=celleMostri(s),lib=vicini(l.q,l.r).filter(n=>{const x=s.celle[K(n.q,n.r)];return x&&passabile(x.t)&&!x.poi&&!occ.has(K(n.q,n.r))});
    if(lib.length){const n=lib[Math.floor(rnd()*lib.length)],g=MOS.nuovoGruppo(s,rnd,{q:n.q,r:n.r,stato:'caccia',vicino:true,reg:cellaDi(s,l).reg});if(g){sincronizza(s);iniziaSfida(s,g,{sorpresa:'eroi'},rnd);return{}}}}
   consumaRazioni(s,v.length);cura=LU.LUNGO_ACCAMPAMENTO;L(s,'La compagnia dorme all\'accampamento ('+v.length+' razioni).')}
  else{const costo=LU.PREZZI.locanda*v.length;if(costo>s.oro)return{err:'Servono '+costo+' monete per la locanda'};s.oro-=costo;L(s,'Una notte alla locanda di '+l.nome+' ('+costo+' monete).')}
  for(let r=s.round;r<PARAM.giriGiorno;r++){MOS.fase(s,rnd);MOS.mercanti(s,rnd)}
  alba(s,rnd,cura);return{}}
 // ---- sotterranei ----
 const passoCorrente=s=>s.missione.passi[Math.min(s.missione.passo,s.missione.passi.length-1)];
 function entra(s,a,rnd){const v=vivi(s);if(!v.length)return{err:'Nessun eroe in piedi'};if(s.dentro)return{err:'Sei già dentro'};
  const e=a.eroe!=null?s.eroi[a.eroe]:v[0];if(!e||e.hp<=0)return{err:'Scegli un eroe in piedi'};const l=luogoDi(s,e);if(!l)return{err:'Qui non c\'è nulla da fare'};
  const idx=s.missione.passi.indexOf(l.id),T=MON.TIPI[l.tipo];
  if(!T.sotterraneo){ // parlare con chi comanda: serve al passo di missione in questo luogo
   if(idx===s.missione.passo&&idx>=0){s.missione.passo++;L(s,TESTO_PASSO[l.tipo]||('Il passo «'+l.nome+'» è compiuto.'));return{}}
   return{err:'Qui non c\'è nulla da fare'}}
  if(l.assedio)return{err:l.nome+' è sotto assedio'};
  if(idx>s.missione.passo)return{err:ERRORE_ORDINE[l.tipo]||'Prima completa il passo precedente'};
  let sott=s.sotterranei[l.id];if(sott&&sott.finito)return{err:'Qui non c\'è più nulla da fare'};
  if(!v.every(x=>stessa(x,e)))return{err:'Riunite la compagnia davanti all\'ingresso'};
  if(!sott)sott=s.sotterranei[l.id]={stanze:LU.stanze(s.seed+hashStr(l.id),l.tipo,LU.PERICOLO_SOTT[l.tipo]),stanza:0,finito:false};
  s.dentro=l.id;L(s,sott.stanza?'Tornate in '+l.nome+'.':(l.tipo==='antro'?'Nell\'antro l\'aria è gelida.':l.tipo==='torre'?'La Torre dei Corvi vi attende.':'Varcate la soglia di '+l.nome+'.'));return{}}
 const sottQui=s=>s.dentro?s.sotterranei[s.dentro]:null;
 function avanza(s,rnd){const sott=sottQui(s);if(!sott)return{err:'Non sei in un sotterraneo'};const l=s.luoghi[s.dentro],st=sott.stanze[sott.stanza],v=vivi(s);if(!st)return{err:'Il sotterraneo è finito'};
  passaGiro(s,rnd,true);if(s.over)return{};
  const fam=l.fam||LU.FAMIGLIA_SOTT[l.tipo],liv=Math.min(8,MOS.livelloMedio(s)+(st.diff==='difficile'?1:0)+LU.EFFETTI[LU.livelloPerdizione(s.perdizione)].mostri),n=Math.min(4,v.length),pos={q:l.q,r:l.r};
  if(st.k==='battaglia'||st.k==='boss'){const nem=SC.incontro(fam,liv,n,st.k==='boss'?dettaglioBoss(fam,MOS.livelloMedio(s)):st.diff||'medio',seme32(rnd)).nemici;
   s.sfida={k:'battaglia',mostro:null,luogo:l.id,stanza:sott.stanza,nemici:nem,ambiente:LU.AMBIENTE_SOTT[l.tipo],seme:seme32(rnd),quali:s.eroi.map((e,i)=>e.hp>0?i:-1).filter(i=>i>=0),dist:{},sorpresa:null,q:l.q,r:l.r};
   L(s,LU.testoStanza(st,l.tipo));return{}}
  if(st.k==='trappola'){s.incontro={kind:'trappola',cd:st.cd+Math.floor(s.perdizione/15),testo:st.testo,ab:st.ab.slice(),dan:st.dan,stanza:true,q:l.q,r:l.r};L(s,st.testo);return{}}
  if(st.k==='evento'){const ev=LU.evento(st.id);s.evento={id:ev.id,testo:ev.testo,scelte:ev.scelte.map(c=>c.t)};L(s,ev.testo);return{}}
  if(st.k==='forziere'){bottinoQui(s,rnd,pos,{fonte:'scrigno',pericolo:LU.PERICOLO_SOTT[l.tipo]},'Nel forziere: ');stanzaFatta(s,l,rnd);return{}}
  if(st.k==='riposo'){for(const e of v){e.hp=Math.min(e.hpMax,e.hp+Math.max(1,Math.ceil(e.hpMax*LU.BREVE.pct)));AP.riposo(e,'breve')}L(s,LU.testoStanza(st,l.tipo)+' Tutti riprendono fiato.');stanzaFatta(s,l,rnd);return{}}
  return{err:'Stanza sconosciuta'}}
 // capo scalato: il capo vero della famiglia compare solo se la compagnia è almeno di livello capo + 1; sotto, arrivano i suoi in versione «difficile»
 function dettaglioBoss(fam,livMedio){const capo=BE.ID.map(i=>BE.M[i]).find(m=>m.fam===fam&&m.capo);return capo&&livMedio>=capo.liv+PARAM.capoMargine?'capo':'difficile'}
 function stanzaFatta(s,l,rnd){const sott=s.sotterranei[l.id];sott.stanza++;if(sott.stanza>=sott.stanze.length)finisciSott(s,l,rnd)}
 function finisciSott(s,l,rnd){const sott=s.sotterranei[l.id];sott.finito=true;l.ripulito=true;s.dentro=null;
  for(const e of vivi(s))e.xp+=PARAM.xpSott[l.tipo]||40;
  L(s,l.nome+' è ripulito! (+'+(PARAM.xpSott[l.tipo]||40)+' esperienza a testa)');
  bottinoQui(s,rnd,l,{fonte:'ricompensa',pericolo:LU.PERICOLO_SOTT[l.tipo]},'Tra le macerie trovate: ');perd(s,-5,rnd);
  const idx=s.missione.passi.indexOf(l.id);if(idx===s.missione.passo){s.missione.passo++;if(s.missione.passo>=s.missione.passi.length)s.over={win:true,reason:l.tipo==='torre'?'La Torre dei Corvi è caduta':'La missione è compiuta',giorni:s.giorno}}
  else if(l.tipo==='antro')L(s,'Resta la Torre dei Corvi.');
  if(l.tipo==='antro'&&idx<0){}}
 function scegli(s,a,rnd){const ev=s.evento;if(!ev)return{err:'Nessun evento'};const l=s.luoghi[s.dentro],sott=sottQui(s),def=LU.evento(ev.id),sc=def&&def.scelte[a.i];if(!sc)return{err:'Scelta non valida'};
  const f=sc.eff;if(f.oro!=null){if(f.oro<0&&-f.oro>s.oro)return{err:'Servono '+(-f.oro)+' monete'};s.oro+=f.oro}
  for(const e of vivi(s)){if(f.pfPct)e.hp=Math.max(1,Math.min(e.hpMax,e.hp+Math.round(e.hpMax*f.pfPct)));if(f.xp)e.xp+=f.xp}
  if(f.razioni){const e=vivi(s).find(x=>x.zaino.length<AO.MAX_ZAINO);if(e)e.zaino.push('razione')}
  L(s,sc.t+': '+sc.fine);s.evento=null;if(f.perdizione)perd(s,f.perdizione,rnd);if(!s.over)stanzaFatta(s,l,rnd);return{}}
 // ---- servizi dei luoghi ----
 const eroeQui=(s,a)=>{const e=Number.isInteger(a.eroe)&&s.eroi[a.eroe];return e&&e.hp>0?e:null};
 function servizio(s,a,rnd){const e=eroeQui(s,a)||(a.t==='rialza'?s.eroi.find(x=>x.hp<=0&&s.eroi.indexOf(x)===a.eroe):null);if(!e)return{err:'Scegli un eroe'};
  const l=luogoDi(s,e),aperti=l?LU.servizi(l,s.giorno):[];
  if(a.t==='cura'){if(!aperti.includes('guaritore'))return{err:'Qui non c\'è un guaritore'};const qui=vivi(s).filter(x=>stessa(x,e)),costo=qui.reduce((t,x)=>t+LU.PREZZI.guaritore(x.hp,x.hpMax),0);
   if(!costo)return{err:'Nessuno ha bisogno di cure'};if(costo>s.oro)return{err:'Servono '+costo+' monete per le cure'};s.oro-=costo;for(const x of qui)x.hp=x.hpMax;L(s,'Curati dal guaritore per '+costo+' monete.');return{}}
  if(a.t==='rialza'){if(e.hp>0)return{err:'Non è a terra'};if(!aperti.includes('tempio'))return{err:'Qui non c\'è un tempio'};const costo=LU.PREZZI.tempio(e.liv);if(costo>s.oro)return{err:'Servono '+costo+' monete per il tempio'};
   s.oro-=costo;e.hp=Math.max(1,Math.ceil(e.hpMax/2));sincronizza(s);L(s,e.nome+' si rialza grazie al tempio ('+costo+' monete).');return{}}
  if(a.t==='prega'){if(!aperti.includes('preghiera'))return{err:l&&l.tipo==='santuario'?'Il santuario è silenzioso':'Qui non c\'è un santuario'};const r=LU.preghiera(l,s.giorno,!!a.offerta,s.oro);if(r.err)return{err:r.err};
   s.oro-=r.costo;l.pronto=r.pronto;L(s,e.nome+' prega a '+l.nome+(r.costo?' e lascia un\'offerta':'')+'.');perd(s,r.perdizione,rnd);return{}}
  if(a.t==='taglia'){if(!aperti.includes('bacheca'))return{err:'Qui non c\'è una bacheca'};const t=(l.taglie||[]).find(x=>x.id===a.id);if(!t)return{err:'Taglia sconosciuta'};if(t.riscossa)return{err:'Già riscossa'};
   if(!s.sconfitti.includes(t.mostro))return{err:'Quel gruppo è ancora in giro'};t.riscossa=true;s.oro+=t.ricompensa;L(s,'Taglia riscossa: '+t.ricompensa+' monete.');perd(s,-3,rnd);return{}}
  return{err:'Servizio sconosciuto'}}
 // ---- v1/v2 → v3 ----
 const inventario=s=>{if(!s.negozi)s.negozi={};
  for(const e of s.eroi){if(!e.equip||typeof e.equip!=='object')e.equip={...((EROI.CLASSI[e.classe]||{}).equip||{})};if(!Array.isArray(e.zaino))e.zaino=[];if(!Array.isArray(e.cintura))e.cintura=[];if(!e.scelte||e.conc==null||!e.usi)Object.assign(e,poteri(e))}return s};
 const poteri=h=>{const c=AP.completa({...h,scelte:h.scelte||{}});return{scelte:{...c.scelte},usi:{...(h.usi||{})},conc:h.conc==null?AP.combattente(c).concMax:h.conc}};
 function vecchio(s){s.v=2;s.rng=DAD.semina((s.seed>>>0)+Math.imul(s.evn|0,7919)+Math.imul(s.turno|0,104729));if(s.missione&&s.missione.titolo==='La Torre oscura')s.missione.titolo='La Torre dei Corvi'}
 function aV3(s){const luoghi={},cnt={};
  for(const c of Object.values(s.celle)){c.reg=c.reg||0;if(c.poi){const n=(cnt[c.poi]=(cnt[c.poi]||0)+1),id=c.poi+n;luoghi[id]={id,tipo:c.poi,nome:NOME_POI[c.poi]||c.poi,q:c.q,r:c.r,reg:0};c.luogo=id}else c.luogo=null}
  s.luoghi=luoghi;s.regioni=MON.REGIONI.map((g,i)=>Object.assign({},g,{id:i,centro:{q:0,r:0}}));const part=s.party||{q:0,r:0};
  for(const e of s.eroi){e.q=part.q;e.r=part.r;e.pm=null;e.brevi=0;delete e.mov}
  s.round=s.fase==='notte'?PARAM.giriLuce+1:1;delete s.pm;s.mostri=[];s.proxMostro=0;s.mercanti=[];s.sotterranei={};s.dentro=null;s.sfida=null;s.evento=null;s.sconfitti=[];s.sbarrate=false;
  s.missione.passi=s.missione.passi.map(t=>(Object.values(luoghi).find(l=>l.tipo===t)||{id:t}).id);
  if(s.incontro){if(s.incontro.multi)s.incontro=null;else{s.incontro.q=part.q;s.incontro.r=part.r}}
  s.v=3;s.raggio=s.raggio||6;sincronizza(s);MOS.rinasci(s,DAD.gen(s))}
 // porta uno stato salvato alla versione corrente (restituisce una copia; uno stato già v3 resta com'è)
 function migra(st){const s=copia(st);if(!(s.v>=2&&Number.isInteger(s.rng)))vecchio(s);if(s.v<3)aV3(s);return inventario(s)}
 // ---- nuova campagna ----
 // opts: { raggio, regioni, luoghi, conta, mercanti (dal capitolo, A8), titolo, passi (id dei luoghi della missione) }
 function nuova(eroi,seed,opts){
  opts=opts||{};if(!eroi||eroi.length<1||eroi.length>MAX_EROI)throw new Error('servono da 1 a '+MAX_EROI+' eroi');
  const mondo=MON.genera(seed>>>0,{raggio:opts.raggio,regioni:opts.regioni,luoghi:opts.luoghi,conta:opts.conta,mercanti:opts.mercanti});
  const tipo=t=>Object.values(mondo.luoghi).find(l=>l.tipo===t&&!l.partenza),passi=opts.passi||PASSI.map(t=>(tipo(t)||{id:t}).id);
  const s={v:3,g:'campagna',seed:seed>>>0,rng:DAD.semina(seed),n:eroi.length,raggio:mondo.raggio,celle:mondo.celle,regioni:mondo.regioni,luoghi:mondo.luoghi,mercanti:mondo.mercanti,giorno:1,round:1,fase:'giorno',turno:0,
   eroi:eroi.map((h,i)=>{const d=EROI.derivati(h);return{slot:h.slot||'e'+(i+1),nome:h.nome,razza:h.razza,classe:h.classe,aspetto:h.aspetto,liv:h.liv,xp:h.xp,hp:h.hp,hpMax:h.hpMax,ca:d.ca,mov:d.mov,base:h.base,oro:h.oro||0,equip:{...(h.equip||{})},zaino:[...(h.zaino||[])],cintura:[...(h.cintura||[])],q:0,r:0,pm:null,brevi:0,...poteri(h)}}),
   party:{q:0,r:0},perdizione:0,sbarrate:false,oro:eroi.reduce((a,h)=>a+(h.oro||0),0),missione:{titolo:opts.titolo||'La Torre dei Corvi',passo:0,passi},incontro:null,sfida:null,evento:null,dentro:null,sotterranei:{},mostri:[],proxMostro:0,sconfitti:[],log:[],over:null,evn:0,negozi:{}};
  const rnd=DAD.gen(s);MOS.rinasci(s,rnd);rinnovaTaglie(s);L(s,'La compagnia lascia il villaggio. Giorno 1.');return s}
 // ---- azioni ----
 const SOLO_DURANTE_INCONTRO=['risolvi','fuggi'];
 function act(st,a,rnd){const s=migra(st);rnd=rnd||DAD.gen(s);if(s.over)return{err:'Campagna finita'};s.evn++;
  if(s.sfida&&a.t!=='esito')return{err:'Prima va combattuta la battaglia'};
  if(s.evento&&a.t!=='scegli')return{err:'Prima scegli cosa fare'};
  if(s.incontro&&!SOLO_DURANTE_INCONTRO.includes(a.t))return{err:'Prima affronta l\'incontro'};
  let r=null;
  switch(a.t){
   case'tira':{if(s.dentro)return{err:'Sottoterra non si cammina'};if(a.tutti){for(let i=0;i<s.eroi.length;i++)if(s.eroi[i].hp>0&&s.eroi[i].pm==null)tira(s,i,rnd,false);return{s}}r=tira(s,a.eroe,rnd,!!a.conc);break}
   case'muovi':r=muovi(s,a,rnd);break;
   case'fineTurno':{if(s.dentro)return{err:'Sei sottoterra: avanza o esci'};passaGiro(s,rnd,false);r={};break}
   case'breve':r=breve(s,a);break;
   case'lungo':r=lungo(s,rnd);break;
   case'entra':r=entra(s,a,rnd);break;
   case'esci':{if(!s.dentro)return{err:'Non sei in un sotterraneo'};L(s,'La compagnia esce da '+s.luoghi[s.dentro].nome+'.');s.dentro=null;r={};break}
   case'avanza':r=avanza(s,rnd);break;
   case'scegli':r=scegli(s,a,rnd);break;
   case'esito':r=esito(s,a,rnd);break;
   case'cura':case'rialza':case'prega':case'taglia':r=servizio(s,a,rnd);break;
   case'fuggi':r=fuggi(s,a,rnd);break;
   case'risolvi':r=risolvi(s,a,rnd);break;
   case'equipa':case'togli':case'cintura':case'zaino':case'usa':case'passa':case'compra':case'vendi':r=oggetti(s,a,rnd);break;
   default:return{err:'Azione sconosciuta'}}
  if(!r||r.err)return r&&r.err?{err:r.err}:{err:'Azione non riuscita'};
  if(!s.over&&!vivi(s).length)s.over={win:false,reason:'Tutti gli eroi sono caduti'};
  s.evn++;return{s}}
 function danno(s,i,n){const e=s.eroi[i];e.hp=Math.max(0,e.hp-n);if(e.hp===0)L(s,e.nome+' cade a terra!');sincronizza(s)}
 function fuggi(s,a,rnd){const inc=s.incontro;if(!inc)return{err:'Nessun incontro'};if(inc.stanza)return{err:'Non si fugge da qui'};
  const qui=vivi(s).filter(e=>e.q===inc.q&&e.r===inc.r);let i=a.eroe==null?-1:a.eroe;
  if(i>=0&&!(s.eroi[i]&&s.eroi[i].hp>0))return{err:'Scegli un eroe in piedi'};if(i<0){if(!qui.length)return{err:'Nessun eroe sul posto'};i=s.eroi.indexOf(qui.reduce((m,e)=>e.hp>m.hp?e:m,qui[0]))}
  L(s,s.eroi[i].nome+' copre la ritirata della compagnia.');danno(s,i,1+Math.floor(s.perdizione/25));s.incontro=null;perd(s,PARAM.fuga,rnd);return{}}
 function risolvi(s,a,rnd){const inc=s.incontro;if(!inc)return{err:'Nessun incontro'};const e=s.eroi[a.eroe];if(!e||e.hp<=0)return{err:'Scegli un eroe in piedi'};
  if(!EROI.ABILITA[a.abilita])return{err:'Abilità sconosciuta'};if(!inc.ab.includes(a.abilita))return{err:'Qui quell\'abilità non serve'};if(e.q!==inc.q||e.r!==inc.r)return{err:e.nome+' è troppo lontano'};
  const r=EROI.prova(eroeDi(e),a.abilita,inc.cd,rnd);s.ultima={eroe:a.eroe,abilita:a.abilita,tiro:r.tiro,tot:r.tot,cd:r.cd,ok:r.ok};
  L(s,e.nome+' prova '+EROI.NOME_AB[a.abilita].toLowerCase()+': '+r.tot+' contro '+r.cd+(r.ok?' — riesce':' — fallisce'));
  const t=TIPI[inc.kind],pos={q:inc.q,r:inc.r};
  if(r.ok){const g=t.ric;e.xp+=g.xp;s.oro+=g.oro;L(s,'Prova superata (+'+g.xp+' esperienza'+(g.oro?', +'+g.oro+' monete':'')+').');if(!inc.stanza&&DROP.includes(inc.kind)&&rnd()<.5)bottinoQui(s,rnd,pos,{fonte:'nemico',soloOggetti:true},'Lasciano: ')}
  else{danno(s,a.eroe,1+Math.floor(rnd()*(inc.dan||t.dan))+Math.floor(s.perdizione/25));perd(s,1,rnd)}
  s.incontro=null;if(inc.stanza&&!s.over)stanzaFatta(s,s.luoghi[s.dentro],rnd);return{}}
 // equipaggiamento, zaino e botteghe: per eroe; compra/vendi dove c'è una bottega aperta (città, villaggio) o un mercante
 function oggetti(s,a,rnd){const e=Number.isInteger(a.eroe)&&s.eroi[a.eroe];if(!e)return{err:'Scegli un eroe'};const nome=id=>(AO.OGG[id]||{}).nome;let r;
  if(a.t==='equipa'){r=AO.equipaggia(e,a.id,a.slot);if(!r.err)L(s,e.nome+' prende '+nome(a.id)+'.')}
  else if(a.t==='togli'){const id=(e.equip||{})[a.slot];r=AO.togli(e,a.slot);if(!r.err)L(s,e.nome+' mette via '+nome(id)+'.')}
  else if(a.t==='cintura')r=AO.allaCintura(e,a.id);
  else if(a.t==='zaino')r=AO.dallaCintura(e,a.id);
  else if(a.t==='usa'){r=AO.usa(e,a.id,rnd);if(!r.err)L(s,e.nome+' usa '+nome(a.id)+': +'+r.cura+' PF.')}
  else if(a.t==='passa'){const b=Number.isInteger(a.a)&&s.eroi[a.a],i=(e.zaino||[]).indexOf(a.id);
   if(!b||b===e)return{err:'Scegli un altro eroe'};if(i<0)return{err:'L\'oggetto non è nello zaino'};if(!stessa(b,e))return{err:b.nome+' è troppo lontano'};if(b.zaino.length>=AO.MAX_ZAINO)return{err:'Lo zaino di '+b.nome+' è pieno'};
   e.zaino.splice(i,1);b.zaino.push(a.id);r={ok:true};L(s,e.nome+' passa '+nome(a.id)+' a '+b.nome+'.')}
  else{const l=luogoDi(s,e),mer=mercanteQui(s,e),bott=l&&LU.servizi(l,s.giorno).includes('bottega');
   if(!bott&&!mer)return{err:'Serve una bottega: torna in città'};
   const rara=a.t==='compra'&&AO.OGG[a.id]&&AO.OGG[a.id].ra!=='comune'&&(mer||(l&&l.tipo==='villaggio'));if(rara)return{err:'Qui si trova solo merce comune'};
   r=a.t==='compra'?BO.compra(s,a.eroe,a.tipo,a.id):BO.vendi(s,a.eroe,a.id);
   if(!r.err)L(s,e.nome+(a.t==='compra'?' compra ':' vende ')+nome(a.id)+' per '+(a.t==='compra'?r.pr:r.v)+' monete.')}
  return r.err?{err:r.err}:{}}
 const celleVisibili=s=>Object.values(s.celle).filter(c=>c.visto);
 // aiuti per la vista: dove può arrivare un eroe col movimento che ha (o 0 se non ha ancora tirato), mostri che si vedono
 const raggiungibili=(s,i)=>{const e=s.eroi[i];return!e||e.hp<=0||e.pm==null?{}:MON.raggiungibili(s.celle,e,e.pm,{vieta:celleMostri(s),costo:costoCella(s)})};
 return{TERRENI,MAX_EROI,migra,PASSI,NOME_POI,DIREZIONI,K,dist,vicini,mulberry,genera:MON.genera,percorso,rivela:(s,q,r,g)=>MON.rivela(s.celle,q,r,g),vivi,nuova,act,inventario,pericoloQui:s=>pericolo(s,s.party),celleVisibili,celleRaggio,passabile,TIPI,PARAM,
  battaglia,raggiungibili,dettaglioBoss,luogoDi,mercanteQui,passoCorrente,costoCella,faseDi,visibili:s=>MOS.visibili(s),famiglia:nomeFam,sottQui}})();
if(typeof module!=='undefined')module.exports=CAMP;
