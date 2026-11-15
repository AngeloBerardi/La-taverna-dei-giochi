/* ---- Compagnia di ventura in compagnia (piano C2): il tramite tra la stanza live e la partita. ----
   Motore: motori/28m-ven-stanza.js (VST). La stanza è una partita come le altre (`ENG.ventura`, `VIEW.ventura`): lo stato `G`
   porta il mondo e la battaglia. Ogni telefono tiene una copia (`X.L`) e la fa scorrere da sé (mondo e battaglia sono
   ripetibili): in rete viaggiano solo le mosse, più un punto fermo ogni tanto per chi entra dopo. Una mossa si applica
   subito qui (`manda`), poi parte come ogni mossa di stanza (`SYNC.mossa`, atomica); quando arriva lo stato di un altro
   telefono lo si adotta e si riparte da lì (`adotta`). Schermate, pannelli e disegno restano quelli di `Ven` (24hw):
   `specchia` decide quale pannello mostrare dai cambi di stato, senza strappare di mano i pannelli aperti apposta.
   La TV (`ui.tv`) guarda soltanto. Piano: docs/VENTURA.md. */
const VenStanza=(()=>{
 const X={L:null,visto:null,acc:0,era:false,fermo:0,capT:0,pre:{inc:false,luogo:-1,prig:false,att:false,b:false},seme0:null};
 const on=()=>!!(G&&G.g==='ventura');
 const seat=()=>on()&&!ui.tv?viewer():-1;
 const ora=()=>performance.now();
 // ---- partire ----
 function nuova(n,names,o){const seme=X.seme0!=null?X.seme0:(Date.now()^Math.floor(Math.random()*4294967296))>>>0;   // seme0: solo per le prove del browser
  return VST.nuova(n,names,Object.assign({seme,regno:Ven.V.regno},o||{}))}
 // ---- dallo stato della stanza alla vista ----
 function adotta(){X.visto=G;X.L=VST.copia(G);X.acc=0;X.fermo=ora();specchia()}
 function specchia(){const L=X.L,V=Ven.V,w=L.w,tu=VEN.TU(w),p=X.pre,k=VenCampo.K;V.s=w;V.vel=L.vel;
  if(L.b){k.seat=Math.max(0,seat());if(V.modo!=='campo'||k.batt!==L.nb||!k.esterno){V.modo='campo';V.pan=null;V.fine=null;V.carta=null;if(VenArte.A.pronta)VenCampo.usa(L.b.c,L.nb);else{k.s=L.b.c;k.batt=null}}else k.s=L.b.c;
   k.pausa=!VST.corre(L)&&!L.b.c.fine;if(L.b.c.fine)k.finita=true;p.b=true;return}
  if(p.b){p.b=false;V.modo='mondo';V.fine=null;V.pan=w.ult?'esito':null;VenMappa.centra();p.inc=!!w.incontro;p.luogo=w.dentro>=0?w.dentro:w.davanti;return}
  if(V.modo==='campo'){V.modo='mondo';V.fine=null}
  const inc=!!w.incontro,luogo=w.dentro>=0?w.dentro:w.davanti,prig=!!w.prigioniero,att=!!(tu.ord&&tu.ord.t==='aspetta');
  if(inc&&!p.inc){V.pan='incontro';V.msg=''}else if(!inc&&V.pan==='incontro')V.pan=null;
  if(luogo>=0&&luogo!==p.luogo&&!inc){V.pan='luogo';V.sub='home';V.msg=''}else if(luogo<0&&V.pan==='luogo')V.pan=null;
  if((prig&&!p.prig)||(att&&!p.att&&!inc))V.pan='attesa';else if(V.pan==='attesa'&&!prig&&!att)V.pan=inc?'incontro':luogo>=0?'luogo':null;
  p.inc=inc;p.luogo=luogo;p.prig=prig;p.att=att}
 // chiamata da Ven.html a ogni disegno: stato nuovo dalla stanza, o stanza finita
 function sync(){if(on()){if(!X.era){X.era=true;X.pre={inc:false,luogo:-1,prig:false,att:false,b:false};Ven.V.pan=null;Ven.V.modo='mondo';Ven.V.carta=null;Ven.V.avvisi=[]}if(G!==X.visto)adotta();return}
  if(X.era){X.era=false;X.L=null;X.visto=null;Ven.V.s=null;Ven.V.pan=null;Ven.V.modo='mondo';ui.ven=false;Ven.ferma();VenArte.smonta();document.documentElement.classList.remove('vn-on')}}
 // ---- mosse ----
 function invia(a,ns){X.fermo=ora();X.visto=ns;const base=R.grev!=null?R.grev:R.rev,gid=G.gid;
  if(!R.on){pushState(ns,true);saveOff(ns);return}
  R.rev=Math.max(R.rev,base+1);pushState(ns,true,base+1);
  SYNC.esegui(R.ref,cur=>SYNC.mossa(cur,{base,gid,a,s:ns},ENG)).then(e=>{if(e.err&&e.code!=='regola')return risincronizza()}).catch(e=>{ERR.n(e,'ventura-stanza');return risincronizza()})}
 function manda(a){if(!on()||!X.L)return{err:'Nessuna partita'};if(ui.tv)return{err:'La TV guarda soltanto'};const st=seat();if(st<0)return{err:'Non sei seduto a questo tavolo'};
  a.seat=st;a.fino=VST.tempo(X.L);let r;try{r=VST.act(X.L,a)}catch(e){ERR.n(e,'ventura-stanza');return{err:'Mossa non riuscita'}}
  if(r.err)return r;X.L=r.s;X.acc=0;specchia();invia(a,VST.copia(r.s));return r}
 // il capitano in battaglia: al più un ordine ogni 180 ms (ogni mossa riscrive lo stato della stanza)
 function bCap(o){if(ora()-X.capT<180)return{};X.capT=ora();return manda({t:'b-cap',o})}
 function pausa(){const b=X.L&&X.L.b;if(!b)return{err:'Nessuna battaglia'};return b.via?manda({t:'b-pausa',v:!b.pausa}):manda({t:'b-via'})}
 // punto fermo: porta la stanza dove sono arrivato io (non fa nulla se un altro l'ha già fatto)
 function ferma(){if(ui.tv||seat()<0||!X.L||VST.tempo(X.L)<=VST.tempo(G)&&!!X.L.b===!!G.b)return;const a={t:'tempo',seat:seat(),fino:VST.tempo(X.L)};invia(a,VST.copia(X.L))}
 // ---- il tempo, su questo telefono ----
 function giro(dt){const L=X.L;if(!L||!on())return;const k=VenCampo.K;
  if(L.b){if(VST.corre(L)){X.acc+=dt*10;const n=Math.min(6,Math.floor(X.acc));if(n>0){X.acc-=n;if(X.acc>1)X.acc=0;VenCampo.eventi(VST.avanzaB(L,L.b.c.t+n));if(L.b.c.fine){k.finita=true;ferma()}}k.acc=X.acc}}
  else if(VST.scorre(L)){X.acc+=dt*8*VST.ritmo(L);const n=Math.floor(X.acc);if(n>0){X.acc-=n;const g0=VEN.giorno(L.w),ev=VST.avanza(L,L.w.t+n);
    for(const e of ev)if(e.t==='log'&&e.tipo)Ven.avviso(e.tx,e.tipo);
    if(!VST.scorre(L)||VEN.giorno(L.w)!==g0||L.w.incontro){specchia();ferma();render()}}}
  if(ora()-X.fermo>9000+Math.max(0,seat())*2500)ferma()}
 function esci(){ui.confirm=true;render()}
 return{X,on,seat,nuova,sync,manda,bCap,pausa,giro,esci}})();
