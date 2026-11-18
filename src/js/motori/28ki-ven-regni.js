/* ---- Compagnia di ventura, molti regni (passo 23). ----
   Nei mondi `s.geo===2` il mondo nasce frammentato: un regno per città (`s.rg={id:{id,nome,breve,cult,col,col2,re,vivo,nato,capo}}`, id `r0…rN`, `capo` = id del luogo capoluogo),
   ognuno di una delle cinque culture (la zona della sua città). Sostituisce `VEN.regni`, `VEN.rg` e `VEN.cult` componendo la versione precedente:
   senza `s.rg`, o per un id che non vi compare, rispondono come prima. Territori: costo minimo da tutti i capoluoghi insieme (spareggi per cella).
   Passo 27: l'accorpamento dei regni (unificazione). Ripetibile: niente Math.random né trigonometria. Dopo 28ke, prima di 28l. */
(()=>{
 const{MURA}=VEN._;
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
 VEN.aggancia('nuovo',s=>nasce(s));
 Object.assign(VEN,{mappaRegni});
})();
