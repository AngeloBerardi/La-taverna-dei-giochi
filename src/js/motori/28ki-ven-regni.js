/* ---- Compagnia di ventura, molti regni (passo 23). ----
   Nei mondi `s.geo===2` il mondo nasce frammentato: un regno per città (`s.rg={id:{id,nome,breve,cult,col,col2,re,vivo,nato,capo}}`, id `r0…rN`, `capo` = id del luogo capoluogo),
   ognuno di una delle cinque culture (la zona della sua città). Sostituisce `VEN.regni`, `VEN.rg` e `VEN.cult` componendo la versione precedente:
   senza `s.rg`, o per un id che non vi compare, rispondono come prima. Territori: costo minimo da tutti i capoluoghi insieme (spareggi per cella).
   Passo 27: l'unificazione. Ogni 7 giorni (gancio `giorno`) i regni si accorpano per vassallaggio o matrimonio dinastico, i signori dei regni caduti passano al vincitore o
   cercano un nuovo signore, e chi supera il 40% delle città ha contro una coalizione. Stato facoltativo `s.unif={ult,v,mat}`. Ripetibile: niente Math.random né trigonometria. Dopo 28ke, prima di 28l. */
// soglie dell'unificazione (scalate da VDAT.DIFF.unif[opz.unif].accorpa): VASSALLO forza sotto la frazione FORZA del vicino più forte con cui è in guerra da GUERRA giorni (la frazione sale fino al doppio in STANCHEZZA giorni, mai oltre MAX);
// MATRIMONIO regni della stessa cultura in pace da PACE giorni, al massimo uno ogni OGNI giorni; ATTACCO dopo il giorno DA un regno molto più forte del vicino in pace gli muove guerra (al massimo MAX a settimana); DOMINIO quota di città oltre cui scatta la coalizione; UNIONE quota che nessuna unione volontaria supera (sale di TETTO_GG al giorno dopo il giorno TETTO_DA, perché i piccoli rimasti soli in guerra col più grande possano cedere);
// PASSA quota dei signori del regno caduto che passa al vincitore; RECLUTA: un esule è reclutabile dopo DA giorni, con certezza dopo FORZA; NOME: oltre tante città si diventa «Regno di …»
VDAT.UNIF={OGNI:7,VASSALLO:{FORZA:.5,GUERRA:20,STANCHEZZA:90,MAX:.95,PROB:.7},MATRIMONIO:{PACE:40,OGNI:40,PROB:.4},ATTACCO:{DA:100,MAX:1,PROB:.3},DOMINIO:.4,UNIONE:.5,TETTO_DA:100,TETTO_GG:.0015,COALIZIONE:.5,PASSA:.6,RECLUTA:{DA:7,FORZA:14,PROB:.5},NOME:3};
(()=>{
 const{MURA,D,L,alleate,chiave,dist,fazioni,giorno,inGuerra,part,rnd}=VEN._,U=VDAT.UNIF;
 const FORME=['Signoria di','Marca di','Comune di','Principato di','Libera città di'];
 // i cinque toni di un colore: 0 è quello della cultura, poi più scuro, più chiaro, ancora più scuro, ancora più chiaro (solo somme e prodotti)
 const TONI=[[1,0],[.72,0],[.7,.3],[.52,0],[.45,.55]];
 const hex=v=>{const x=Math.max(0,Math.min(255,Math.round(v)));return(x<16?'0':'')+x.toString(16)};
 const tono=(c,t)=>{const k=TONI[t],n=parseInt(c.slice(1),16),o=[n>>16&255,n>>8&255,n&255].map(v=>v*k[0]+255*k[1]);return'#'+o.map(hex).join('')};
 // ---------- regni, schede e culture ----------
 const regni0=VEN.regni,rg0=VEN.rg,cult0=VEN.cult;
 VEN.regni=s=>s&&s.rg?Object.keys(s.rg):regni0(s);
 VEN.cult=(s,f)=>s&&s.rg&&s.rg[f]?s.rg[f].cult:cult0(s,f);
 VEN.rg=(s,f)=>{const x=s&&s.rg&&s.rg[f];if(!x)return rg0(s,f);
  return{id:x.id,nome:x.nome,breve:x.breve,col:x.col,col2:x.col2,re:x.re,motto:rg0(s,x.cult).motto,cult:x.cult}};
 // ---------- territori: ricerca di costo minimo da tutti i capoluoghi ----------
 // I capoluoghi sono le città della mappa, in ordine: il territorio dipende solo da seme e opzioni (`VEN.molt` di un mondo senza stagione),
 // quindi si calcola una volta per mappa e si tiene accanto a lei (`CACHE`, chiave la mappa). `chi`: per cella l'indice del regno; `conf`: coppie confinanti.
 const MARE_MONTE=6,CACHE=new WeakMap();
 function nascita(s){const M=VEN.mappaDi(s);if(CACHE.has(M))return CACHE.get(M);const capi=M.luoghi.filter(l=>l.tipo==='citta').map(l=>cellaDi(M,l)),chi=territori(s,M,capi),x={chi,conf:confini(M,chi)};CACHE.set(M,x);return x}
 function territori(s,M,capi){const G=M.G,N=G*G,neutro={seme:s.seme,geo:2,opz:s.opz},cs=new Float64Array(N);
  for(let i=0;i<N;i++){const t=M.T[i];if(t===0||t===4){cs[i]=MARE_MONTE;continue}
   const m=VEN.molt(neutro,'marcia',{p:null,i}),c=(M.S[i]?.72:t===2?1.45:t===3?1.35:1);cs[i]=m>0?c/m:MARE_MONTE}
  const g=new Float64Array(N).fill(1e18),chi=new Int16Array(N).fill(-1),fatto=new Uint8Array(N);
  // coda di priorità: chiave più indice di cella (1e-9 per cella) così gli spareggi sono sempre uguali
  const hk=new Float64Array(N*8+16),hv=new Int32Array(N*8+16);let m=0;
  const metti=(k,v)=>{const key=k+v*1e-9;let i=++m;while(i>1){const p=i>>1;if(hk[p]<=key)break;hk[i]=hk[p];hv[i]=hv[p];i=p}hk[i]=key;hv[i]=v};
  const togli=()=>{const v=hv[1],key=hk[m],vv=hv[m];m--;let i=1;for(;;){let c=2*i;if(c>m)break;if(c<m&&hk[c+1]<hk[c])c++;if(hk[c]>=key)break;hk[i]=hk[c];hv[i]=hv[c];i=c}hk[i]=key;hv[i]=vv;return v};
  capi.forEach((c,k)=>{if(chi[c]<0){g[c]=0;chi[c]=k;metti(0,c)}});
  while(m){const c=togli();if(fatto[c])continue;fatto[c]=1;const cx=c%G,cy=(c-cx)/G;
   for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(fatto[j])continue;
    const ng=g[c]+cs[j]*(ox&&oy?1.4142:1);if(ng<g[j]||(ng===g[j]&&chi[c]<chi[j])){g[j]=ng;chi[j]=chi[c];metti(ng,j)}}}
  return chi}
 const cellaDi=(M,l)=>Math.floor(l.y)*M.G+Math.floor(l.x);
 // coppie di regni confinanti (indici a<b): due celle di terra vicine di regni diversi
 function confini(M,chi){const G=M.G,c=new Set();
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){const i=y*G+x;if(M.T[i]===0)continue;const a=chi[i];
   for(const j of[x+1<G?i+1:-1,y+1<G?i+G:-1]){if(j<0||M.T[j]===0)continue;const b=chi[j];if(a!==b&&a>=0&&b>=0)c.add(a<b?a*64+b:b*64+a)}}
  return Array.from(c).sort((p,q)=>p-q).map(v=>[v>>6,v&63])}
 // per i test e per il passo 27: i territori alla nascita (per cella l'indice in `ids`) e le coppie di regni confinanti
 function mappaRegni(s){if(!s||!s.rg)return null;const x=nascita(s),ids=VEN.regni(s);return{chi:x.chi,ids,confini:x.conf.map(([a,b])=>[ids[a],ids[b]])}}
 // ---------- alla nascita ----------
 function nasce(s){if(s.geo!==2||s.rg)return;
  const M=VEN.mappaDi(s),r=ADADI.gen({rng:ADADI.semina((s.seme^0x5bd1e995)>>>0)}),chiave=(a,b)=>a<b?a+'|'+b:b+'|'+a;
  const CU=regni0(s),citta=s.l.filter(l=>l.tipo==='citta'),n=citta.length,ids=citta.map((c,k)=>'r'+k),cult=citta.map(c=>c.faz);
  const{chi,conf}=nascita(s);
  // luoghi: passano al regno della loro cella; il capo di un altro regno diventa il capoluogo
  const vecchio={};for(const l of s.l)vecchio[l.id]=l.faz;
  citta.forEach((c,k)=>{c.faz=ids[k]});
  for(const l of s.l){if(l.tipo==='citta'||!CU.includes(vecchio[l.id]))continue;const k=chi[cellaDi(M,l)];l.faz=ids[k>=0?k:0]}
  for(const l of s.l){if(l.capo>=0&&s.l[l.capo]&&ids.includes(l.faz)&&s.l[l.capo].faz!==l.faz)l.capo=citta[ids.indexOf(l.faz)].id}
  // nomi e colori: il tono è il primo non usato da un confinante della stessa cultura
  const toni=new Array(n).fill(-1),vicini=ids.map(()=>[]);for(const[a,b]of conf){vicini[a].push(b);vicini[b].push(a)}
  const rgs={};
  citta.forEach((c,k)=>{const usati=vicini[k].filter(j=>cult[j]===cult[k]&&toni[j]>=0).map(j=>toni[j]);let t=0;while(t<TONI.length&&usati.includes(t))t++;if(t>=TONI.length)t=k%TONI.length;toni[k]=t;
   const b=rg0(s,cult[k]),forma=FORME[Math.floor(r()*FORME.length)];
   rgs[ids[k]]={id:ids[k],nome:forma+' '+c.nome,breve:c.nome,cult:cult[k],col:tono(b.col,t),col2:tono(b.col2,t),re:'',vivo:true,nato:0,capo:c.id}});
  // signori: quelli di una cultura si dividono a turno tra i suoi regni, in ordine di id; il primo di ogni regno è il re
  for(const l of s.l)if(ids.includes(l.faz)&&MURA[l.tipo])l.sig=-1;
  const conta={};
  for(const sg of s.sig){const cu=sg.faz,miei=ids.filter((id,k)=>cult[k]===cu);if(!miei.length)continue;const q=conta[cu]=(conta[cu]||0),f=miei[q%miei.length];conta[cu]++;
   const nrg=Math.floor(q/miei.length),R=rgs[f],mura=s.l.filter(l=>l.faz===f&&MURA[l.tipo]&&l.tipo!=='citta'),capo=s.l[R.capo];
   const casa=nrg===0?capo:mura.length?mura[(nrg-1)%mura.length]:capo;
   sg.cult=cu;sg.faz=f;sg.casa=casa.id;sg.re=nrg===0;if(sg.re)R.re=sg.nome;if(casa.sig<0)casa.sig=sg.id;
   const p=s.p.find(x=>x.id===sg.pid);if(p){p.faz=f;p.dentro=casa.id;p.x=casa.x;p.y=casa.y;p.via=[]}}
  for(const l of s.l)if(ids.includes(l.faz)&&!MURA[l.tipo]&&l.capo>=0)l.sig=s.l[l.capo].sig;
  // le carovane già nate prendono il regno della loro casa
  for(const p of s.p)if(p.k==='car'&&s.l[p.casa])p.faz=s.l[p.casa].faz;
  s.rg=rgs;
  // diplomazia: nessuna opinione, due guerre tra regni confinanti
  s.rel={};for(const id of ids)s.rel[id]=0;
  s.guerra={};const cop=conf.slice();for(let k=0;k<2&&cop.length;k++){const[a,b]=cop.splice(Math.floor(r()*cop.length),1)[0];s.guerra[chiave(ids[a],ids[b])]=true}}
 // ---------- passo 27: unificazione ----------
 const vivo=(s,f)=>f==='tu'?!!s.corona:!!(s.rg[f]&&!s.cadute[f]);
 const fattore=s=>{const d=VDAT.DIFF.unif[VEN.opz(s).unif];return d?d.accorpa:1};
 const quota=(s,f)=>{const c=s.l.filter(l=>l.tipo==='citta');return c.length?c.filter(l=>l.faz===f).length/c.length:0};
 // regni vivi confinanti: due territori di nascita vicini oggi in mano a regni diversi (il capoluogo originale dice chi li tiene); per il tuo regno, le fortezze entro CONFINE
 function vicini(s){const x=nascita(s),ids=Object.keys(s.rg),v={},agg=(a,b)=>{(v[a]=v[a]||new Set()).add(b);(v[b]=v[b]||new Set()).add(a)};
  for(const[a,b]of x.conf){const fa=s.l[s.rg[ids[a]].capo].faz,fb=s.l[s.rg[ids[b]].capo].faz;if(fa!==fb&&vivo(s,fa)&&vivo(s,fb))agg(fa,fb)}
  if(s.corona)for(const f of VEN.confinanti(s))if(vivo(s,f))agg('tu',f);
  return v}
 const sede=(s,f,da)=>{let m=null,md=1e9;for(const l of s.l)if(MURA[l.tipo]&&l.faz===f){const d=dist(l,da);if(d<md){md=d;m=l}}return m};
 const passaA=(s,sg,p,f)=>{const c=sede(s,f,p);if(!c)return false;sg.faz=p.faz=f;sg.esule=null;sg.esilio=0;sg.re=false;sg.casa=c.id;p.dentro=-1;p.via=[];p.ia={st:'giro',t:0};return true};
 // il regno `da` entra in `a`: luoghi, signori e compagnie cambiano bandiera, guerre e alleanze di `da` finiscono, mischie e assedi si sciolgono
 function assorbi(s,da,a,come){const g=giorno(s),R=s.rg[da],nome=R.nome;
  for(const sc of s.scontri.slice()){const ps=sc.a.concat(sc.b).map(id=>part(s,id)).filter(Boolean);if(ps.some(p=>p.faz===da)){for(const p of ps)if(p.sc===sc.id){p.sc=0;p.via=[]}s.scontri.splice(s.scontri.indexOf(sc),1)}}
  for(const l of s.l)if(l.ass&&(l.ass.faz===da||l.faz===da))l.ass=null;
  for(const k of Object.keys(s.guerra))if(k.split('|').includes(da))delete s.guerra[k];
  for(const k of Object.keys(s.alleanza||{}))if(k.split('|').includes(da))delete s.alleanza[k];
  for(const l of s.l)if(l.faz===da)l.faz=a;
  for(const sg of s.sig)if(sg.faz===da){sg.faz=a;sg.re=false}
  for(const p of s.p)if(p.faz===da)p.faz=a;
  if(s.servizio&&s.servizio.faz===da)s.servizio.faz=a;
  if(s.corona&&s.corona.minacce)delete s.corona.minacce[da];
  s.cadute[da]=g;R.vivo=false;R.fuso={a,g,come};
  const X=s.rg[a];if(X&&s.l.filter(l=>l.tipo==='citta'&&l.faz===a).length>U.NOME&&!/^Regno di /.test(X.nome))X.nome='Regno di '+X.breve;
  const nA=VEN.rg(s,a).nome;
  L(s,come==='vassallo'?'«'+nome+'» giura fedeltà a «'+nA+'».':come==='matrimonio'?'«'+nome+'» e «'+nA+'» si uniscono per matrimonio dinastico.':'«'+nome+'» è assorbito da «'+nA+'».','guerra');
  s.ev.push({t:'unione',da,a,come});VEN.accoda(s,'unione-'+come)}
 // un regno cade per conquista: segna la fine e una parte dei suoi signori passa al vincitore
 VEN.aggancia('regno-cade',(s,prima,faz,suoi)=>{const R=s.rg&&s.rg[prima];if(!R)return;R.vivo=false;R.fuso={a:faz,g:giorno(s),come:'conquista'};
  for(const p of s.p)if(p.faz===prima)p.faz=s.l[p.casa]?s.l[p.casa].faz:faz;   // le carovane del regno caduto seguono la loro casa
  for(const k of Object.keys(s.guerra))if(k.split('|').includes(prima))delete s.guerra[k];
  for(const k of Object.keys(s.alleanza||{}))if(k.split('|').includes(prima))delete s.alleanza[k];
  if(!vivo(s,faz)||faz==='tu')return;const r=rnd(s);
  for(const sg of suoi){const p=part(s,sg.pid);if(!p||sg.faz!=='neu'||sg.comp)continue;if(r()<U.PASSA&&passaA(s,sg,p,faz))L(s,sg.nome+' passa al servizio di '+VEN.rg(s,faz).breve+'.','guerra')}});
 // gli esuli cercano un nuovo signore: il regno vivo più vicino li accoglie (dopo DA giorni con probabilità, dopo FORZA con certezza)
 function recluta(s,g,r){const vivi=Object.keys(s.rg).filter(f=>vivo(s,f));if(!vivi.length)return;
  for(const sg of s.sig){if(sg.faz!=='neu'||!sg.esule||sg.comp)continue;const p=part(s,sg.pid);if(!p||p.k!=='sig')continue;const eta=g-(sg.esilio-D.REGNO.ESILIO);
   if(eta<U.RECLUTA.DA||(eta<U.RECLUTA.FORZA&&r()>=U.RECLUTA.PROB))continue;
   let f=null,md=1e9;for(const l of s.l)if(MURA[l.tipo]&&vivi.includes(l.faz)){const d=dist(l,p);if(d<md){md=d;f=l.faz}}
   if(f&&passaA(s,sg,p,f))L(s,sg.nome+' trova un nuovo signore: '+VEN.rg(s,f).breve+'.','guerra')}}
 function unifica(s){if(s.geo!==2||!s.rg)return;const g=giorno(s),u=s.unif||(s.unif={ult:0,v:{},mat:null});if(g-u.ult<U.OGNI)return;u.ult=g;const r=rnd(s),k=fattore(s);
  for(const id of Object.keys(s.rg))if(s.cadute[id]&&s.rg[id].vivo)s.rg[id].vivo=false;
  recluta(s,g,r);
  // un regno senza più fortezze è conquistato da chi tiene il suo capoluogo
  for(const id of Object.keys(s.rg))if(vivo(s,id)&&!s.l.some(l=>MURA[l.tipo]&&l.faz===id)){const o=s.l[s.rg[id].capo].faz;if(o!==id&&(o==='tu'||vivo(s,o)))assorbi(s,id,o,'conquista')}
  // quanto dura la guerra o la pace tra due vicini
  let vic=vicini(s);const vedi={};
  for(const a of Object.keys(vic))for(const b of vic[a]){const c=chiave(a,b);if(vedi[c])continue;vedi[c]=1;const st=inGuerra(s,a,b)?'g':'p';if(!u.v[c]||u.v[c].t!==st)u.v[c]={t:st,da:g}}
  for(const c of Object.keys(u.v))if(!vedi[c])delete u.v[c];
  const ids=Object.keys(s.rg),forza=f=>VEN.forzaRegno(s,f),NC=s.l.filter(l=>l.tipo==='citta').length,citta=f=>s.l.filter(l=>l.tipo==='citta'&&l.faz===f).length,
   tetto=(U.UNIONE+U.TETTO_GG*Math.max(0,g-U.TETTO_DA))*NC+1e-9,
   cresce=(b,a)=>citta(b)+citta(a)<=tetto;   // un'unione volontaria non porta nessuno oltre metà delle città (il tetto sale piano piano con i mesi)
  // dopo i primi mesi chi è molto più forte del vicino in pace (e non suo alleato) gli muove guerra: così la mappa non si ferma
  if(g>=U.ATTACCO.DA){let n=0;
   for(const a of ids){if(n>=U.ATTACCO.MAX)break;if(!vivo(s,a)||!vic[a])continue;
    for(const b of Array.from(vic[a]).sort()){if(n>=U.ATTACCO.MAX)break;if(b==='tu'||a==='tu'||!vivo(s,a)||!vivo(s,b)||inGuerra(s,a,b)||alleate(s,a,b))continue;
     const fa=forza(a),fb=forza(b),forte=fa>=fb?a:b,debole=forte===a?b:a,ff=Math.max(fa,fb),fd=Math.min(fa,fb);
     if(fd<U.VASSALLO.FORZA*k*ff&&cresce(forte,debole)&&r()<U.ATTACCO.PROB*k){s.guerra[chiave(a,b)]=true;u.v[chiave(a,b)]={t:'g',da:g};n++;L(s,VEN.rg(s,forte).breve+' muove guerra a '+VEN.rg(s,debole).breve+'.','guerra')}}}}
  // vassallaggio: il debole in guerra da tempo col più forte dei vicini gli giura fedeltà
  for(const A of ids){if(!vivo(s,A)||!vic[A])continue;
   // il più forte dei vicini con cui è in guerra da abbastanza giorni
   // la soglia sale con la stanchezza: più la guerra dura, meno serve essere deboli per cedere
   let B=null,fb=-1;for(const x of Array.from(vic[A]).filter(x=>vivo(s,x)&&inGuerra(s,A,x)).sort()){const st=u.v[chiave(A,x)];if(!st||st.t!=='g'||g-st.da<U.VASSALLO.GUERRA||(x==='tu'&&(!s.corona||s.servizio)))continue;
    if(!cresce(x,A))continue;const f=forza(x),soglia=Math.min(U.VASSALLO.MAX,U.VASSALLO.FORZA*k*(1+Math.min(1,(g-st.da-U.VASSALLO.GUERRA)/U.VASSALLO.STANCHEZZA)));if(f>fb&&forza(A)<soglia*f){fb=f;B=x}}
   if(!B)continue;
   if(r()<U.VASSALLO.PROB*k){assorbi(s,A,B,'vassallo');vic=vicini(s)}}
  // matrimonio dinastico: raro, due vicini della stessa cultura in pace da molto, alleati o con un nemico in comune
  if(u.mat==null||g-u.mat>=U.MATRIMONIO.OGNI){
   fuori:for(const a of ids){if(!vivo(s,a)||!vic[a])continue;for(const b of Array.from(vic[a]).sort()){if(b<=a||b==='tu'||!vivo(s,b)||!vivo(s,a)||VEN.cult(s,a)!==VEN.cult(s,b))continue;
    const st=u.v[chiave(a,b)];if(!(st&&st.t==='p'&&g-st.da>=U.MATRIMONIO.PACE))continue;
    if(!alleate(s,a,b)&&!ids.some(x=>x!==a&&x!==b&&vivo(s,x)&&inGuerra(s,a,x)&&inGuerra(s,b,x)))continue;
    const forte=forza(a)>=forza(b)?a:b,debole=forte===a?b:a;
    if(cresce(forte,debole)&&r()<U.MATRIMONIO.PROB*k){assorbi(s,debole,forte,'matrimonio');u.mat=g;break fuori}}}}
  // freno alla valanga: chi ha più del 40% delle città si trova contro gli altri (fino a due dichiarazioni a settimana)
  for(const f of fazioni(s)){if(!vivo(s,f)||quota(s,f)<=U.DOMINIO)continue;let n=0;
   for(const x of fazioni(s)){if(n>=2)break;if(x===f||x==='tu'||!vivo(s,x)||inGuerra(s,x,f)||alleate(s,x,f))continue;
    if(r()<U.COALIZIONE){s.guerra[chiave(x,f)]=true;n++;L(s,VEN.rg(s,x).breve+' si schiera contro '+VEN.rg(s,f).breve+', che ha preso troppe città.','guerra')}}}
  VEN.vittoria(s)}
 VEN.aggancia('nuovo',s=>nasce(s));
 VEN.aggancia('giorno',s=>unifica(s));
 Object.assign(VEN,{mappaRegni,unifica});
})();
