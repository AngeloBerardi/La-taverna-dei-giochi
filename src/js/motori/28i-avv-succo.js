/* ---- Il succo della battaglia (Cantari di Ventura, piano B, step B6): ogni colpo, cura, stato, caduta e bottino diventa un «riscontro» da mostrare. ----
   Puro: niente DOM, niente dadi, niente orologio (`Math.random`, `Date.now` vietati). Dagli eventi di un istante di ATEM (27s) a una lista di riscontri
   che la vista (app/24hr-bat-succo.js, `Succo`) disegna e che AAUD (28c) fa suonare. La tabella delle durate è la sezione 9 di docs/AVVENTURA-B.md.
     ASUC.da(ev, s, mem)       → [riscontro]   mem = oggetto che chi chiama tiene fra un istante e l'altro (critici in attesa, aree annunciate)
     ASUC.livelli(s, camp)     → [riscontro]   «Livello su!» alla vittoria, guardando l'esperienza totale degli eroi nella campagna (ATEM non la porta)
     ASUC.bottinoDi(xp)        → { monete, sfere }   quanti pezzi cadono (solo grafica: l'esperienza vera è quella del contatore)
     ASUC.sparpaglia(chi, n)   → [{ dx, dy, rit }]   dove cadono, senza dadi: nasce da un'impronta del nome
     ASUC.limita(attivi, n, ora, max) / ASUC.somma(a, n)   → al massimo 8 numeri in volo: i successivi si sommano
     ASUC.statiVisibili(c) / ASUC.tintaDi(c) / ASUC.riempimento(s, c)   → icone e tinta degli stati, quanto è carica un'area rossa (0..1)
   Riscontri (`t`, come i passi di ACRO.effetti, così AAUD.passo li legge): numero {chi, v, tipo, crit} · colpito {chi, da, px, scossa, lampo} · fermo {} · mancato {chi}
   · scintille {chi} · stato {chi, stato, tinta} · sbriciola {chi, def} · bottino {chi, xp, monete, sfere} · area {chi, id, zona, durata} · esplode {chi, id, zona}
   · livello {chi, nome, liv}. Ognuno ha `ms` (quanto resta vivo, a velocità 1×). Piano e scelte: docs/AVVENTURA-B.md, scheda B6. */
const ASUC=(()=>{
 const AT=typeof ATEM!=='undefined'?ATEM:require('./27s-avv-tempo.js');
 const ER=typeof EROI!=='undefined'?EROI:require('./27-eroi.js');
 // ---- la tabella della sezione 9 (ms; px = pixel d'arte di spinta) ----
 const TAB={
  colpo:{ms:600,px:1},                   // numero bianco in arco, lampo bianco, spinta di 1 px
  critico:{ms:800,px:2,fermo:60},        // numero oro più grande, fermo-immagine di 60 ms, scossa di 2 px
  mancato:{ms:500},                      // «Mancato» grigio e piccolo
  cura:{ms:600},                         // numero verde che sale, scintille
  stato:{ms:900},                        // icona che compare sopra la testa (poi resta finché dura lo stato)
  sbriciola:{ms:700},                    // il nemico si disfa in pixel
  bottino:{ms:1000,caduta:380},          // monete e sfere rimbalzano a terra (caduta), poi volano al contatore
  livello:{ms:1500,scala:350},           // colonna di luce e «Livello su!»; con più eroi partono a scala di 350 ms
  esplode:{ms:520},                      // l'area rossa del capo scoppia
  MAX_NUMERI:8};
 // stato → tinta del segnalino e delle miniature (fiamme, veleno verde, gelo azzurro); chi ha più stati mostra il primo di questa lista
 const TINTE=['fuoco','veleno','gelo'],TINTA={'in-fiamme':'fuoco',avvelenato:'veleno',congelato:'gelo'};
 const TIPI=['numero','colpito','fermo','mancato','scintille','stato','sbriciola','bottino','area','esplode','livello'];
 const trova=(s,id)=>s&&s.cb?s.cb.find(c=>c.id===id)||null:null;
 const cl=(x,a,b)=>Math.max(a,Math.min(b,x));
 // ---- bottino: quanti pezzi cadono (grafica) ----
 const bottinoDi=xp=>({monete:cl(1+Math.floor(xp/60),1,6),sfere:cl(Math.ceil(xp/40),1,8)});
 // impronta di un testo (FNV-1a): serve a spargere i pezzi senza dadi, uguale su ogni telefono e nei test
 const imp=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
 // dx in −1..1 (a destra e sinistra del punto di caduta), dy in 0..1 (quanto rimbalza in alto), rit in ms (ritardo prima di cadere)
 function sparpaglia(chi,n){const o=[];for(let i=0;i<n;i++){const r=imp(String(chi)+':'+i);o.push({dx:+(((r&255)/255)*2-1).toFixed(2),dy:+(((r>>>8&255)/255)).toFixed(2),rit:(r>>>16&127)})}return o}
 // ---- dagli eventi ai riscontri ----
 function colpito(o,e,crit){const t=crit?TAB.critico:TAB.colpo;
  o.push({t:'numero',chi:e.bers,v:-e.n,tipo:e.tipo||null,crit,ms:t.ms});
  o.push({t:'colpito',chi:e.bers,da:e.chi!=null?e.chi:null,px:e.chi!=null?t.px:0,scossa:crit,lampo:true,ms:260});
  if(crit)o.push({t:'fermo',ms:TAB.critico.fermo})}
 function da(ev,s,mem){mem=mem||{};const z=mem.zone||(mem.zone={}),att=mem.tiro||(mem.tiro={}),o=[];
  for(const e of ev||[]){
   switch(e.t){
    case'tiro':if(e.ok)att[e.chi+'>'+e.bers]=!!e.crit;else o.push({t:'mancato',chi:e.bers,ms:TAB.mancato.ms});break;
    case'danno':{if(e.esito==='imm'||!(e.n>0))break;const k=e.chi+'>'+e.bers,crit=!!att[k];delete att[k];colpito(o,e,crit);break}
    case'dot':if(e.n>0){const c=trova(s,e.chi);o.push({t:'numero',chi:e.chi,v:-e.n,tipo:e.tipo||null,crit:false,ms:TAB.colpo.ms});if(c)o.push({t:'colpito',chi:e.chi,da:null,px:0,scossa:false,lampo:true,ms:260})}break;
    case'superficie':if(e.n>0)o.push({t:'numero',chi:e.chi,v:-e.n,tipo:'fuoco',crit:false,ms:TAB.colpo.ms});break;
    case'cura':if(e.n>0){o.push({t:'numero',chi:e.bers,v:e.n,tipo:'cura',crit:false,ms:TAB.cura.ms});o.push({t:'scintille',chi:e.bers,ms:TAB.cura.ms})}break;
    case'temp':if(e.n>0)o.push({t:'numero',chi:e.bers,v:e.n,tipo:'temp',crit:false,ms:TAB.cura.ms});break;
    case'stato':if(e.ok)o.push({t:'stato',chi:e.bers,stato:e.stato,tinta:TINTA[e.stato]||null,ms:TAB.stato.ms});break;
    case'muore':{const c=trova(s,e.chi);if(!c||c.lato==='eroi')break;o.push({t:'sbriciola',chi:c.id,def:c.def||null,ms:TAB.sbriciola.ms});
     const xp=c.xp|0;if(xp>0)o.push(Object.assign({t:'bottino',chi:c.id,xp,ms:TAB.bottino.ms},bottinoDi(xp)));break}
    case'lancia':if(e.zona&&e.zona.length){const c=trova(s,e.chi);if(c&&c.lato==='nemici'){z[e.chi]=e.zona.map(x=>({q:x.q,r:x.r}));o.push({t:'area',chi:e.chi,id:e.id,zona:z[e.chi],durata:Math.max(1,(e.fine|0)-(e.i|0)),ms:Math.max(1,((e.fine|0)-(e.i|0))*100)})}}break;
    case'potere':if(z[e.chi]){o.push({t:'esplode',chi:e.chi,id:e.id,zona:z[e.chi],ms:TAB.esplode.ms});delete z[e.chi]}break;
    case'interrotto':case'annullato':delete z[e.chi];break}}
  return o}
 // ---- «Livello su!» alla vittoria: `camp` = la campagna (eroi con xp totale e liv); senza campagna non si sa, quindi niente ----
 function livelli(s,camp){const o=[];if(!s||!s.over||s.over.esito!=='vittoria'||!camp||!Array.isArray(camp.eroi))return o;
  const R=AT.riepilogo(s);let n=0;
  for(const r of R.eroi){if(!(r.xp>0))continue;const h=camp.eroi[r.indice];if(!h||!Number.isInteger(h.xp))continue;
   const prima=ER.livelloPerXp(h.xp),dopo=ER.livelloPerXp(h.xp+r.xp);if(dopo>prima){const c=trova(s,r.id);o.push({t:'livello',chi:r.id,nome:(c&&c.nome)||h.nome||'',liv:dopo,ms:TAB.livello.ms,rit:n*TAB.livello.scala});n++}}
  return o}
 // ---- numeri in volo: al massimo `max`; oltre, il nuovo si somma a uno già in volo ----
 // attivi = [{ chi, v, fine }] (fine = istante in ms in cui sparisce); ora = ms di adesso. { op:'nuovo' } oppure { op:'somma', idx } (indice in `vivi`, che è `attivi` senza i già spariti)
 function limita(attivi,n,ora,max){max=max||TAB.MAX_NUMERI;const vivi=(attivi||[]).filter(a=>a.fine>ora);if(vivi.length<max)return{op:'nuovo',vivi};
  let k=-1;for(let i=vivi.length-1;i>=0;i--)if(vivi[i].chi===n.chi&&Math.sign(vivi[i].v)===Math.sign(n.v)){k=i;break}
  if(k<0)k=0;return{op:'somma',idx:k,vivi}}
 // il numero sommato: stessa persona, stesso segno; resta «critico» se lo era uno dei due
 const somma=(a,n)=>Object.assign({},a,{v:a.v+n.v,crit:!!(a.crit||n.crit)});
 // ---- stati ----
 const statiVisibili=c=>(c&&c.stati?c.stati:[]).map(z=>({id:z.id,tinta:TINTA[z.id]||null}));
 const tintaDi=c=>{const st=statiVisibili(c).map(x=>x.tinta).filter(Boolean);for(const t of TINTE)if(st.includes(t))return t;return null};
 // quanto è carica l'area di chi sta lanciando (0 appena parte, 1 al rilascio)
 const riempimento=(s,c)=>{const L=c&&c.lancio;if(!L||!(L.fine>L.da))return 0;return cl((s.t-L.da)/(L.fine-L.da),0,1)};
 return{TAB,TIPI,TINTE,TINTA,da,livelli,bottinoDi,sparpaglia,limita,somma,statiVisibili,tintaDi,riempimento}})();
if(typeof module!=='undefined')module.exports=ASUC;
