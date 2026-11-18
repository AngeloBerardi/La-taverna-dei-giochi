/* ---- Grandi battaglie, schieramento (passo 11): reparti, settori, ondate. Estende `VCAM` (28l) con le sue parti interne in `VCAM.int`. ----
   Sta qui perché 28l ha già il tetto dei 35 KB. Motore puro: nessun Math.random, nessun Date.now. */
(()=>{
 const {GR,D,C,ZONE,posto,passoFm,unita,vivi,capU,rad,stretto,chiave,keyR,repC,chiavi,rimetti,inOnda}=VCAM.int;
 // ---------- reparti, settori, ondate (grandi battaglie; tutto facoltativo) ----------
 // i settori di un lato, dal terreno e dalla scheda (mai salvati): [{id,x0,x1,y0,y1,k}], k = base | avan | alt | imb | mura | cortile | ingresso
 function settori(s,l){if(s.tipo==='arena')return[];const W=s.W,H=s.H,a=l==='a',es=s.esp||{a:0,b:0},mio=es[l]||0,altro=es[a?'b':'a']||0,pr=mio>=3?C.REP.SETT_E:C.REP.SETT,out=[],y0=a?H-pr:0,y1=a?H:pr,B=C.REP.BORDO;
  if(s.muro){if(l==='b')out.push({id:'mura',x0:0,x1:W,y0:s.muro-4,y1:s.muro,k:'mura'},{id:'cortile',x0:0,x1:W,y0:0,y1:s.muro-4,k:'cortile'});else out.push({id:'cx',x0:W/3,x1:2*W/3,y0,y1,k:'base'})}
  else GR.forEach((_,i)=>out.push({id:['sx','cx','dx'][i],x0:i*W/3,x1:(i+1)*W/3,y0,y1,k:'base'}));
  if(mio>altro&&!s.muro)out.push({id:'avan',x0:0,x1:W,y0:a?y0-C.REP.AVAN:y1,y1:a?y0:y1+C.REP.AVAN,k:'avan'});
  const scatola=(z,id,k,meta)=>out.push({id,x0:Math.max(0,z.x-z.rx),x1:Math.min(W,z.x+z.rx),y0:meta?(a?Math.max(H/2,z.y-z.ry):Math.max(0,z.y-z.ry)):Math.max(0,z.y-z.ry),y1:meta?(a?Math.min(H,z.y+z.ry):Math.min(H/2,z.y+z.ry)):Math.min(H,z.y+z.ry),k});
  // altura nella propria metà (la scatola si taglia alla metà); bosco nel terzo centrale in profondità (y tra H/3 e 2H/3, come fsx/fdx), solo con l'imboscata e mai per chi attacca un muro
  let na=0,ni=0;if(!(s.muro&&a))for(const z of ZONE(s)){if(z.k==='altura'&&(a?z.y>=H/2:z.y<=H/2))scatola(z,na++?'alt'+na:'alt','alt',1);else if(z.k==='bosco'&&s.imb===l&&z.y>=H/3&&z.y<=2*H/3)scatola(z,ni++?'imb'+(ni):'imb','imb')}
  if(!s.muro)out.push({id:'fsx',x0:0,x1:B,y0:H/3,y1:2*H/3,k:'ingresso'},{id:'fdx',x0:W-B,x1:W,y0:H/3,y1:2*H/3,k:'ingresso'});
  out.push({id:'retro',x0:0,x1:W,y0:a?H-B:0,y1:a?H:B,k:'ingresso'});return out}
 const attivi=(s,l,k)=>s.u.filter(u=>u.l===l&&!u.cap&&u.st==='vivo'&&(k==null||chiave(u)===k));
 const nReparti=(s,l)=>{const K={};for(const u of attivi(s,l))K[chiave(u)]=1;return Object.keys(K).length};
 const prima=(s,l)=>s.fine?'La battaglia è finita':s.t>0?'La battaglia è già cominciata':l&&s.pronto&&s.pronto[l]?'Hai già premuto Pronto':null;
 // il primo numero di reparto libero tra 3 e 7 (-1 se non c'è)
 function liberoR(s,l){for(let r=3;r<8;r++)if(!s.ord[l][r])return r;return-1}
 // toglie gli ordini dei reparti nuovi rimasti senza uomini (solo a battaglia non cominciata)
 function pulisci(s,l){for(const k of chiavi(s.ord[l]))if(k>2&&!attivi(s,l,k).length)delete s.ord[l][k]}
 // reparti per la vista: [{r,c,n,fm,mor}] (mor = il morale del lato, finché non c'è quello del reparto)
 function reparti(s,l){l=l||'a';return chiavi(s.ord[l]).map(k=>{const q=s.ord[l][k];return{r:k>2?k:GR.indexOf(k),c:repC(q,k),n:attivi(s,l,k).length,fm:q.fm||'larga',mor:s.mor[l]}}).filter(x=>x.n>0||x.r<3)}
 // schiera un reparto: solo prima del «Via» e dentro un settore valido
 function schiera(s,o){const l=o.l||'a',e=prima(s,l);if(e)return{err:e};const k=keyR(o.r),q=s.ord[l]&&s.ord[l][k];if(!q)return{err:'Reparto sconosciuto'};
  if(!settori(s,l).some(z=>z.k!=='ingresso'&&o.x>=z.x0&&o.x<=z.x1&&o.y>=z.y0&&o.y<=z.y1))return{err:'Lì non puoi schierarti'};
  q.x=o.x;q.y=o.y;rimetti(s,l,k);s.ev.push({t:'schiera',l,r:o.r,x:o.x,y:o.y});return{s}}
 // divide un reparto a metà (uno sì e uno no, così restano pari); il nuovo si mette accanto
 function dividi(s,o){const l=o.l||'a',e=prima(s,l);if(e)return{err:e};if(!s.rep)return{err:'I reparti non sono permessi'};const k=keyR(o.r),q=s.ord[l]&&s.ord[l][k];if(!q)return{err:'Reparto sconosciuto'};
  const L=attivi(s,l,k);if(L.length<2*C.REP.MIN)return{err:'Reparto troppo piccolo'};
  const nr=liberoR(s,l);if(nReparti(s,l)>=C.REP.MAX||nr<0)return{err:'Troppi reparti'};
  const g=repC(q,k),N=Object.assign({},q,{c:g,fmT:0}),w=Math.max(3,Math.ceil(rad(L.length*2.6))*passoFm(q.fm,g)/4),x=q.x;
  q.x=stretto(x-w,2,s.W-2);N.x=stretto(x+w,2,s.W-2);s.ord[l][nr]=N;L.forEach((u,i)=>{if(i%2)u.r=nr});rimetti(s,l,k);rimetti(s,l,nr);
  s.ev.push({t:'dividi',l,r:o.r,r2:nr});return{s}}
 // unisce due reparti dello stesso tipo: il secondo entra nel primo
 function unisci(s,o){const l=o.l||'a',e=prima(s,l);if(e)return{err:e};if(!s.rep)return{err:'I reparti non sono permessi'};const k=keyR(o.r),k2=keyR(o.r2),q=s.ord[l]&&s.ord[l][k],q2=s.ord[l]&&s.ord[l][k2];
  if(!q||!q2||k===k2)return{err:'Reparto sconosciuto'};if(repC(q,k)!==repC(q2,k2))return{err:'Reparti di tipo diverso'};
  for(const u of attivi(s,l,k2))u.r=o.r;if(k2>2)delete s.ord[l][k2];rimetti(s,l,k);s.ev.push({t:'unisci',l,r:o.r,r2:o.r2});return{s}}
 // gli uomini sono ancora in fila e a posto: dopo aver tolto qualcuno dal campo gli id si rinumerano (restano in U[id-1])
 function rinumera(s){const m={};s.u.forEach((u,i)=>{m[u.id]=i+1;u.id=i+1});s.uid=s.u.length+1;s.capi=s.capi.map(id=>m[id]);if(s.cap>0)s.cap=m[s.cap]}
 // preleva le truppe per un'ondata: prima dalla riserva, poi dal campo (gli ultimi arrivati, mai chi ha doti sue); {err} o la lista delle righe
 // una riga di truppe con le sue doti (`st`), se ne ha
 function riga(x,n){const r={p:x.p,t:x.t,n};if(x.st)r.st=x.st;return r}
 function preleva(s,l,tr){const need={},out=[];for(const x of tr){if(!x||!D.TR[x.t]||!(x.n>0))return{err:'Truppa sconosciuta'};need[x.t]=(need[x.t]||0)+Math.floor(x.n)}
  const campo=t=>s.u.filter(u=>u.l===l&&u.t===t&&!u.cap&&u.st==='vivo'&&!u.sp);
  for(const q of Object.keys(need))if(s.ris[l].reduce((a,x)=>a+(x.t===q?x.n:0),0)+campo(q).length<need[q])return{err:'Non ci sono più truppe da assegnare'};
  let tolti=false;
  for(const q of Object.keys(need)){let k=need[q];for(const x of s.ris[l])if(x.t===q&&k>0){const m=Math.min(k,x.n);x.n-=m;k-=m;out.push(riga(x,m))}
   s.ris[l]=s.ris[l].filter(x=>x.n>0);
   if(k>0){const C2=campo(q).slice(-k);for(const u of C2){out.push({p:u.p,t:q,n:1});s.u.splice(s.u.indexOf(u),1);tolti=true}}}
  if(tolti){rinumera(s);pulisci(s,l)}return{righe:out}}
 // prepara (o rifà) un'ondata: solo prima del «Via», al massimo due per lato
 function preparaOndata(s,o){const l=o.l||'a',e=prima(s,l);if(e)return{err:e};if(!s.ondOk)return{err:'Le ondate non sono permesse'};const W=s.ond[l];
  if(['retro','fsx','fdx'].indexOf(o.ing)<0||(o.ing!=='retro'&&s.muro))return{err:'Da lì non si entra'};
  const qd=o.quando||{k:'comando'};if(['comando','linea','tempo'].indexOf(qd.k)<0)return{err:'Momento sconosciuto'};
  const od=o.ord==='tieni'||(o.ord==='segui'&&l==='a')?o.ord:'carica',vecchia=W.findIndex(w=>w.id===o.id);
  if(vecchia<0&&W.length>=C.REP.ONDE)return{err:'Troppe ondate'};if(vecchia>=0&&W[vecchia].fatta)return{err:'Ondata già partita'};
  if(vecchia>=0){for(const x of W[vecchia].tr)s.ris[l].push(riga(x,x.n));W.splice(vecchia,1)}
  const r=preleva(s,l,o.tr||[]);if(r.err)return r;
  const w={id:o.id,tr:r.righe,ing:o.ing,quando:{k:qd.k,v:qd.v==null?0:qd.v},ord:od,fatta:false};
  W.push(w);s.ev.push({t:'prepara',l,id:o.id});return{s}}
 // lascia partire un'ondata al comando
 function ondata(s,o){if(s.fine)return{err:'La battaglia è finita'};const l=o.l||'a',w=s.ond&&s.ond[l]&&s.ond[l].find(x=>x.id===o.id);if(!w)return{err:'Ondata sconosciuta'};if(w.fatta)return{err:'Ondata già partita'};
  w.fatta=true;s.ev.push({t:'ondata',l,id:w.id,ing:w.ing});return{s}}
 // «Pronto»: chi si schiera per ultimo (l'altro lato, a parità il lato a è primo) vede lo schieramento del primo; l'IA del lato b lo rifà dal passo 21 in poi
 // Passo 47: con `grandi` e più capitani il lato a è pronto solo quando lo sono tutti i posti (`s.pronti`, facoltativo); altrimenti il flag unico di sempre
 const perPosto=(s,l)=>!!(typeof VDAT!=='undefined'&&VDAT.ACCESO&&VDAT.ACCESO.grandi&&s.capi&&s.capi.length>1&&(l||'a')==='a');
 function pronti(s){const m=Math.max(1,(s.capi||[]).length);let n=0;if(s.pronto&&s.pronto.a)n=m;else if(s.pronti)for(let i=0;i<m;i++)if(s.pronti[i])n++;return{n,m,tutti:n>=m}}
 function attesa(s){if(!perPosto(s,'a')||!s.pronto||s.t!==0||s.pronto.a)return null;const p=pronti(s);return'Aspettate gli altri: Pronto '+p.n+'/'+p.m}
 function pronto(s,l,seat,forza){const e=prima(s);if(e)return{err:e};l=l||'a';
  if(perPosto(s,l)){seat=seat|0;const m=s.capi.length;if(seat<0||seat>=m)return{err:'Non hai un capitano in campo'};if(forza&&seat!==0)return{err:'Solo il capo della compagnia può partire senza gli altri'};
   if(s.pronto&&s.pronto.a)return{err:'Hai già premuto Pronto'};if(!forza&&s.pronti&&s.pronti[seat])return{err:'Hai già premuto Pronto'};
   if(!s.pronto)s.pronto={a:false,b:false};if(!s.pronti){s.pronti=[];for(let i=0;i<m;i++)s.pronti.push(false)}
   if(forza)for(let i=0;i<m;i++)s.pronti[i]=true;else s.pronti[seat]=true;
   const p=pronti(s);if(p.tutti)s.pronto.a=true;s.ev.push({t:'pronto',l,seat,n:p.n,m:p.m});
   if(p.tutti&&s.esp&&s.primo==='a'&&typeof VCONS!=='undefined'&&VCONS&&VCONS.schiera)VCONS.schiera(s,'b');return{s}}
  if(!s.pronto)s.pronto={a:false,b:false};s.pronto[l]=true;s.ev.push({t:'pronto',l});
  if(l==='a'&&s.esp&&s.primo==='a'&&typeof VCONS!=='undefined'&&VCONS&&VCONS.schiera)VCONS.schiera(s,'b');return{s}}
 // dove entra l'unità numero j di un'ondata, e l'ancora del suo reparto
 function ingresso(s,w,l,j){const W=s.W,H=s.H,a=l==='a',f=((j*61)%100)/100;
  if(w.ing==='fsx')return{x:2,y:H/3+f*H/3,ax:12,ay:H/2};if(w.ing==='fdx')return{x:W-2,y:H/3+f*H/3,ax:W-12,ay:H/2};
  return{x:8+f*(W-16),y:a?H-2:2,ax:W/2,ay:a?H-10:10}}
 function ondate(s){if(!s.ond)return;if(!s.in0)s.in0={a:attivi(s,'a').length,b:attivi(s,'b').length};
  for(const l of['a','b']){for(const w of s.ond[l]){
   if(!w.fatta){const q=w.quando,ora=q.k==='tempo'?s.t>=q.v:q.k==='linea'?attivi(s,l).length*100<q.v*s.in0[l]:false;if(!ora)continue;w.fatta=true;s.ev.push({t:'ondata',l,id:w.id,ing:w.ing})}
   const resto=w.tr.reduce((a,x)=>a+x.n,0);if(!resto)continue;const mx=s.max||C.MAX;let k=Math.min(C.ONDATA,resto,mx-vivi(s,l).length);if(k<=0)continue;
   if(!w.rp){w.rp={};w.dent=0}
   while(k>0&&w.tr.length){const x=w.tr[0],g=D.TR[x.t].c,p=ingresso(s,w,l,w.dent++);
    if(w.rp[g]==null){const r=liberoR(s,l);if(r<0||nReparti(s,l)>=C.REP.MAX)w.rp[g]=GR.indexOf(g);else{const q={c:g,t:w.ord,x:p.ax,y:p.ay,fm:g==='f'?'serrata':'larga',fmT:0};if(w.ord==='segui'){const cp=capU(s);q.seg=cp?cp.seat:null}s.ord[l][r]=q;w.rp[g]=r}}
    const u=unita(s,l,{p:x.p,t:x.t,st:x.st},p.x,p.y);u.r=w.rp[g];if(w.ing!=='retro'){u.fx=w.ing==='fsx'?1:-1;u.fy=0}
    x.n--;if(x.n<=0)w.tr.shift();k--}}}}
 Object.assign(VCAM,{settori,schiera,dividi,unisci,preparaOndata,ondata,pronto,pronti,attesa,reparti,ondate});
})();
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
 function nuova(n,names,o){o=o||{};if(o.rip){const r=apri(o.rip,n,names);return r.s||r}n=Math.max(1,Math.min(MAX,n|0));const nomi=(names||[]).slice(0,n).map((x,i)=>String(x||('Capitano '+(i+1))));
  const w=VEN.nuovo(o.seme||1,{nome:nomi[0],compagnia:o.compagnia||('Compagnia di '+nomi[0]),regno:o.regno,soci:nomi.slice(1).map(nome=>({nome}))});
  return{n,names:nomi,hands:[],cur:0,log:[],ev:[],evn:0,over:null,sim:true,w,b:null,vel:1,nb:0}}
 // riprende un salvataggio → {s} oppure {err} (`salvabile`, o un mondo del solitario): con più giocatori dei capitani nascono capitani nuovi in coda
 // a `soci` (al più MAX in tutto); con meno, i capitani senza giocatore restano in `soci` ma non scendono in campo (`w.attivi`)
 function apri(rip,n,names){const w=rip&&VEN.apri(copia(rip.w||rip));if(!w)return{err:'Salvataggio non leggibile'};
  n=Math.max(1,Math.min(MAX,n|0));w.soci=w.soci||[];const nomi=[];for(let i=0;i<n;i++)nomi.push(String(names&&names[i]||('Capitano '+(i+1))));
  while(1+w.soci.length<n)w.soci.push(VEN.nuovoCap(nomi[1+w.soci.length]));
  const tot=1+w.soci.length;if(n<tot)w.attivi=n;else delete w.attivi;w.ev=[];
  return{s:{n,names:nomi,hands:[],cur:0,log:[],ev:[],evn:0,over:null,sim:true,w,b:null,vel:1,nb:0}}}
 // cosa scrivere sul telefono: solo il mondo, mai una battaglia in corso (`null`: il salvataggio resta quello di prima)
 const salvabile=G=>{if(!G||!G.w||G.b)return null;const w=copia(G.w);w.ev=[];return{v:1,w,nomi:[w.cap].concat(w.soci||[]).map(c=>c.nome),n:G.n,giorno:VEN.giorno(G.w)}};
 // il tempo del mondo scorre solo se la compagnia ha una meta, aspetta o è in catene, e nessuno deve decidere qualcosa (neppure rispondere a una scena: `parla`, in compagnia risponde chiunque)
 const scorre=s=>{const w=s.w;if(s.b||w.incontro||w.over||(w.rac&&w.rac.scena))return false;const tu=VEN.TU(w);if(w.voci&&w.voci.length&&w.dentro<0&&w.davanti<0)return true;if(w.prigioniero)return true;if(!tu.ord)return false;return!((w.dentro>=0||w.davanti>=0)&&tu.ord.t!=='aspetta')};
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
  else if(a.t==='tv'){if(a.v)s.tv=true;else delete s.tv}   // V7: la mappa sul televisore (mai salvata: `salvabile` copia solo `w`); il tempo resta fermo
  else if(a.t==='tempo'){if(s.b)avanzaB(s,fino);else avanza(s,fino)}
  else if(a.t==='parla'){if(s.b)return{err:'Si sta combattendo'};avanza(s,fino);r=VEN.parla(w,a.a);if(r.err)return{err:r.err}}
  else if(a.t==='ordina'||a.t==='fai'||a.t==='scegli'){if(s.b)return{err:'Si sta combattendo'};avanza(s,fino);
   if(a.t==='ordina')r=VEN.ordina(w,a.o||{});
   else if(a.t==='fai')r=VEN.fai(w,Object.assign({},a.z,{seat:a.seat}));
   else{r=VEN.scegli(w,a.v);if(!r.err&&a.v==='attacca')s.b={c:VCAM.nuovo(r.campo),via:false,pausa:false};else if(!r.err&&a.v==='auto')r=VEN.auto(w)}
   if(r.err)return{err:r.err}}
  else if(a.t&&a.t.slice(0,2)==='b-'){if(!s.b)return{err:'Nessuna battaglia in corso'};avanzaB(s,fino);const c=s.b.c;
   if(a.t==='b-via'){const at=VCAM.attesa(c);if(at)return{err:at};s.b.via=true}
   else if(a.t==='b-pausa')s.b.pausa=!!a.v;
   else if(a.t==='b-ord')r=VCAM.ordina(c,Object.assign({},a.o,{seat:a.seat,l:'a'}));
   else if(a.t==='b-cap')r=VCAM.capitano(c,Object.assign({},a.o,{seat:a.seat}));
   else if(a.t==='b-schiera'||a.t==='b-dividi'||a.t==='b-unisci'||a.t==='b-prepara'||a.t==='b-ondata'||a.t==='b-pronto'){// grandi battaglie: schieramento prima del «Via», come gli altri ordini (chiunque schiera qualunque reparto)
    const o=Object.assign({},a.o,{l:'a',seat:a.seat});
    r=a.t==='b-schiera'?VCAM.schiera(c,o):a.t==='b-dividi'?VCAM.dividi(c,o):a.t==='b-unisci'?VCAM.unisci(c,o):a.t==='b-prepara'?VCAM.preparaOndata(c,o):a.t==='b-ondata'?VCAM.ondata(c,o):VCAM.pronto(c,'a',a.seat,o.forza);if(a.t==='b-pronto'&&r&&!r.err&&c.pronti&&c.pronto&&c.pronto.a)s.b.via=true}
   else if(a.t==='b-fine'){if(!c.fine)return{err:'La battaglia non è finita'};r=VEN.esito(w,VCAM.riepilogo(c));if(!r.err){s.b=null;s.nb++}}
   else return{err:'Mossa sconosciuta'};
   if(r&&r.err)return{err:r.err}}
  else return{err:'Mossa sconosciuta'};
  w.ev=[];if(s.b)s.b.c.ev=[];s.evn++;return{s}}
 return{MAX,nuova,apri,salvabile,act,avanza,avanzaB,scorre,corre,ritmo,tempo,copia,newGame:nuova}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VST;
