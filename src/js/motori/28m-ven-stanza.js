/* ---- Compagnia di ventura in compagnia (piano C2): la stanza. Motore puro, senza DOM né rete. ----
   Più capitani, una sola compagnia: lo stato della stanza `G` porta il mondo (`w`, di VEN) e, quando si combatte, la battaglia
   (`b.c`, di VCAM). È un gioco «simultaneo» (`sim`): ogni mossa porta il posto (`seat`) e si rigioca sullo stato nuovo.
   Il tempo non viaggia in rete: mondo e battaglia sono ripetibili, quindi ogni telefono li fa scorrere da sé a partire
   dall'ultimo stato della stanza. Ogni mossa dice «fin dove ero arrivato» (`fino`: minuto del mondo o istante della battaglia):
   prima si porta lo stato fin lì, poi si applica. Così chi ordina non torna mai indietro e gli altri si riallineano di pochi istanti.
   `act` non tocca lo stato che riceve (lo copia): la transazione della stanza può rieseguirla. Mai `Math.random`, `Date.now`.
   Tramite e vista: app/24hx-ven-stanza.js. Piano: docs/VENTURA.md. */
const VST=(()=>{
 const MAX=4,AVANTI=2880,B_AVANTI=1500;
 const copia=x=>JSON.parse(JSON.stringify(x));
 function nuova(n,names,o){o=o||{};n=Math.max(1,Math.min(MAX,n|0));const nomi=(names||[]).slice(0,n).map((x,i)=>String(x||('Capitano '+(i+1))));
  const w=VEN.nuovo(o.seme||1,{nome:nomi[0],compagnia:o.compagnia||('Compagnia di '+nomi[0]),regno:o.regno,soci:nomi.slice(1).map(nome=>({nome}))});
  return{n,names:nomi,hands:[],cur:0,log:[],ev:[],evn:0,over:null,sim:true,w,b:null,vel:1,nb:0}}
 // il tempo del mondo scorre solo se la compagnia ha una meta, aspetta o è in catene, e nessuno deve decidere qualcosa
 const scorre=s=>{const w=s.w;if(s.b||w.incontro||w.over)return false;const tu=VEN.TU(w);if(w.prigioniero)return true;if(!tu.ord)return false;return!((w.dentro>=0||w.davanti>=0)&&tu.ord.t!=='aspetta')};
 // quante volte più svelto del passo normale: in attesa e in prigionia il tempo corre (uguale per tutti: dipende solo dallo stato)
 const ritmo=s=>{const w=s.w,tu=VEN.TU(w);return w.prigioniero||(tu.ord&&tu.ord.t==='aspetta')?Math.max(6,s.vel*3):s.vel};
 // porta il mondo al minuto `fino` (sul posto), fermandosi dove il tempo smette di scorrere
 function avanza(s,fino){const w=s.w;let n=Math.min(AVANTI,Math.floor(fino)-w.t);const ev=[];while(n-->0&&scorre(s)){for(const e of VEN.passo(w,1))ev.push(e)}return ev}
 const corre=s=>!!(s.b&&s.b.via&&!s.b.pausa&&!s.b.c.fine);
 function avanzaB(s,fino){if(!corre(s))return[];const n=Math.min(B_AVANTI,Math.floor(fino)-s.b.c.t);return n>0?VCAM.passo(s.b.c,n):[]}
 const tempo=s=>s.b?s.b.c.t:s.w.t;
 function act(G0,a){if(!G0||!G0.w)return{err:'Nessuna partita'};if(!a||!(a.seat>=0&&a.seat<G0.n))return{err:'Non sei seduto a questo tavolo'};
  const s=copia(G0),w=s.w,fino=a.fino==null?tempo(s):a.fino;let r=null;
  if(a.t==='vel'){s.vel=a.v===2?2:a.v===4?4:1}
  else if(a.t==='tempo'){if(s.b)avanzaB(s,fino);else avanza(s,fino)}
  else if(a.t==='ordina'||a.t==='fai'||a.t==='scegli'){if(s.b)return{err:'Si sta combattendo'};avanza(s,fino);
   if(a.t==='ordina')r=VEN.ordina(w,a.o||{});
   else if(a.t==='fai')r=VEN.fai(w,Object.assign({},a.z,{seat:a.seat}));
   else{r=VEN.scegli(w,a.v);if(!r.err&&a.v==='attacca')s.b={c:VCAM.nuovo(r.campo),via:false,pausa:false};else if(!r.err&&a.v==='auto')r=VEN.auto(w)}
   if(r.err)return{err:r.err}}
  else if(a.t&&a.t.slice(0,2)==='b-'){if(!s.b)return{err:'Nessuna battaglia in corso'};avanzaB(s,fino);const c=s.b.c;
   if(a.t==='b-via')s.b.via=true;
   else if(a.t==='b-pausa')s.b.pausa=!!a.v;
   else if(a.t==='b-ord')r=VCAM.ordina(c,Object.assign({},a.o,{seat:a.seat,l:'a'}));
   else if(a.t==='b-cap')r=VCAM.capitano(c,Object.assign({},a.o,{seat:a.seat}));
   else if(a.t==='b-fine'){if(!c.fine)return{err:'La battaglia non è finita'};r=VEN.esito(w,VCAM.riepilogo(c));if(!r.err){s.b=null;s.nb++}}
   else return{err:'Mossa sconosciuta'};
   if(r&&r.err)return{err:r.err}}
  else return{err:'Mossa sconosciuta'};
  w.ev=[];if(s.b)s.b.c.ev=[];s.evn++;return{s}}
 return{MAX,nuova,act,avanza,avanzaB,scorre,corre,ritmo,tempo,copia,newGame:nuova}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VST;
