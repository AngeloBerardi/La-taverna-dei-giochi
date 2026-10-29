/* ---- Arene della battaglia (Cantari di Ventura): il campo dove si combatte. Regole pure, dal seme. ----
   Un'arena è una griglia di AGRI (9 colonne × 11 righe, vedi 27g) più: id, nome, ambiente, ingressi { eroi, nemici } (celle di partenza, dalla
   più avanzata al centro verso l'esterno), uscite (le celle del bordo da cui si fugge; da lì arrivano anche gli eroi in ritardo).
   Gli eroi partono in basso (righe 8–9), i nemici in alto (righe 1–2): almeno 6 esagoni li separano. L'ambiente della casella decide i
   pezzi che si spargono nel mezzo (alberi, radici, casse, colonne, rialzi, pozze…); i tre capi hanno un'arena scritta a mano.
   Ogni arena generata è valida (`valida`): un solo pezzo di terreno calpestabile, partenze libere, copertura da entrambe le parti. */
const AARE=(()=>{
 const G=typeof AGRI!=='undefined'?AGRI:require('./27g-avv-griglia.js');
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const W=9,H=11;
 const NOMI={pianura:'Piana aperta',strada:'Strada sterrata',bosco:'Radura nel bosco',collina:'Pendio roccioso',palude:'Acquitrino',citta:'Vicolo di città',antro:'Caverna',torre:'Sala della torre'};
 // quanti pezzi di ogni tipo (da–a); T alto, o basso, # muro, , difficile, ^ rialzo; `sup`: superfici (f fuoco, v veleno, g ghiaccio, w acqua); `grappoli`: quanto si attaccano fra loro (0–1)
 const RICETTE={
  pianura:{T:[0,2],o:[4,6],',':[3,5],'^':[2,4],grappoli:.4},
  strada:{T:[0,1],o:[3,5],',':[0,2],'^':[0,2],grappoli:.3},
  bosco:{T:[7,10],o:[3,4],',':[8,12],'^':[0,2],grappoli:.5},
  collina:{T:[0,2],o:[4,6],',':[2,4],'^':[10,14],grappoli:.7},
  palude:{T:[3,5],o:[3,5],',':[6,9],sup:{w:[10,14],v:[2,4]},grappoli:.65},
  citta:{T:[0,2],o:[9,12],'#':[4,6],sup:{f:[0,1]},grappoli:.45},
  antro:{T:[6,9],o:[2,4],'#':[5,8],',':[6,9],sup:{v:[0,3]},grappoli:.5},
  torre:{T:[3,5],o:[4,6],'^':[0,2],sup:{f:[1,2]},grappoli:.2}};
 const AMBIENTI=Object.keys(RICETTE);
 // ambiente dalla casella della mappa del mondo (terreno e luogo speciale)
 const ambienteDa=(terreno,poi)=>poi==='citta'||poi==='antro'||poi==='torre'?poi:poi==='campo'?'pianura':RICETTE[terreno]?terreno:'strada';
 // ---- partenze e uscite (uguali per tutte le arene) ----
 function ingressi(){const e=[],n=[],u=[];
  for(const riga of[H-3,H-2])for(const col of[4,3,5,2,6])e.push(G.daOffset(col,riga));            // eroi: la riga più avanti per prima
  for(const riga of[2,1])for(const col of[4,3,5,2,6,1,7])n.push(G.daOffset(col,riga));            // nemici: idem
  for(let col=0;col<W;col++)u.push(G.daOffset(col,H-1));
  return{eroi:e,nemici:n,uscite:u}}
 const RIS=new Set([...ingressi().eroi,...ingressi().nemici].map(c=>G.K(c.q,c.r)));
 const riservata=(q,r)=>RIS.has(G.K(q,r))||r===H-1;
 // ---- controllo di un'arena: restituisce null se va bene, altrimenti il motivo ----
 function valida(A){
  if(!A||A.w!==W||A.h!==H)return'dimensioni';
  const I=A.ingressi;if(!I||!I.eroi||!I.nemici||!A.uscite)return'ingressi mancanti';
  if(I.eroi.length<8||I.nemici.length<12)return'ingressi pochi';
  const tutte=[...I.eroi,...I.nemici,...A.uscite];
  if(new Set(tutte.map(c=>G.K(c.q,c.r))).size!==tutte.length)return'ingressi sovrapposti';
  for(const c of tutte)if(!G.passabile(A,c))return'ingresso su una cella bloccata';
  for(const c of A.uscite)if(c.r!==H-1)return'uscita non sul bordo';
  for(const a of I.eroi)for(const b of I.nemici)if(G.dist(a,b)<4)return'schieramenti troppo vicini';
  const liberi=G.celle(A).filter(c=>G.passabile(A,c)),ris=G.raggiungibili(A,I.eroi[0],99);
  if(liberi.some(c=>!ris[G.K(c.q,c.r)]))return'celle isolate';
  const bloc=G.celle(A).filter(c=>!G.passabile(A,c)).length;if(bloc>Math.floor(W*H*.25))return'troppi ostacoli';
  if(A.sup)for(const c of G.celle(A))if(G.sup(A,c)&&!G.passabile(A,c))return'superficie su un ostacolo';
  // copertura da entrambe le parti: ostacoli nella metà alta e in quella bassa del campo
  const cop=(r0,r1)=>G.celle(A).filter(c=>c.r>=r0&&c.r<=r1&&['alto','basso','muro'].includes(G.tipo(A,c).id)).length;
  if(cop(2,5)<2||cop(5,8)<2)return'copertura';
  return null}
 // ---- generatore ----
 const tra=(rnd,[a,b])=>a+Math.floor(rnd()*(b-a+1));
 function vicinoLibero(g,rnd,col,riga,libero){const q=G.daOffset(col,riga),v=G.vicini(q).map(c=>G.aOffset(c.q,c.r)).filter(o=>o.riga>=2&&o.riga<=H-3&&o.col>=0&&o.col<W&&libero(o.col,o.riga));
  return v.length?v[Math.floor(rnd()*v.length)]:null}
 // sparge n celle `ch` nella fascia centrale, a gruppetti: g è la griglia di caratteri su cui si scrive, `vuoto` il carattere da sostituire
 function sparpaglia(g,rnd,ch,n,vuoto,gr,ok){let messi=0,prove=0;const libero=(col,riga)=>g[riga][col]===vuoto&&!riservata(G.daOffset(col,riga).q,riga)&&(!ok||ok(col,riga));
  while(messi<n&&prove++<400){let col=Math.floor(rnd()*W),riga=2+Math.floor(rnd()*(H-4));if(!libero(col,riga))continue;g[riga][col]=ch;messi++;
   while(messi<n&&rnd()<gr){const v=vicinoLibero(g,rnd,col,riga,libero);if(!v)break;g[v.riga][v.col]=ch;messi++;col=v.col;riga=v.riga}}}
 function arenaDa(righe,sup,id,ambiente,nome){const A=G.arena(righe,sup),I=ingressi();return Object.assign(A,{id,nome,ambiente,ingressi:{eroi:I.eroi,nemici:I.nemici},uscite:I.uscite.filter(c=>G.passabile(A,c))})}
 // costruisce l'arena dalle griglie di caratteri (le superfici stanno solo dove si cammina)
 function costruisci(g,s,R,id,amb){return arenaDa(g.map(r=>r.join('')),R.sup?s.map((r,i)=>r.map((x,j)=>'.,^'.includes(g[i][j])?x:'.').join('')):null,id,amb,NOMI[amb])}
 // arena sicura: un campo aperto con quattro ripari simmetrici
 function ripiego(ambiente){const g=Array.from({length:H},()=>Array(W).fill('.'));
  for(const[col,riga]of[[2,4],[6,4],[2,6],[6,6]])g[riga][col]='o';
  return arenaDa(g.map(r=>r.join('')),null,ambiente+'-base',ambiente,NOMI[ambiente]||'Campo aperto')}
 function genera(seme,ambiente){const amb=RICETTE[ambiente]?ambiente:'strada',R=RICETTE[amb],h={rng:DAD.semina((seme|0)+AMBIENTI.indexOf(amb)*7919)},rnd=DAD.gen(h),id=amb+'-'+(seme>>>0);
  for(let prova=0;prova<30;prova++){
   const g=Array.from({length:H},()=>Array(W).fill('.')),s=Array.from({length:H},()=>Array(W).fill('.'));
   for(const ch of['#','T','o',',','^'])if(R[ch])sparpaglia(g,rnd,ch,tra(rnd,R[ch]),'.',R.grappoli);
   for(const[ch,r]of Object.entries(R.sup||{}))sparpaglia(s,rnd,ch,tra(rnd,r),'.',R.grappoli,(col,riga)=>'.,^'.includes(g[riga][col]));
   let A=costruisci(g,s,R,id,amb);
   // le celle chiuse fra gli ostacoli diventano roccia
   const ris=G.raggiungibili(A,A.ingressi.eroi[0],99),chiuse=G.celle(A).filter(c=>G.passabile(A,c)&&!ris[G.K(c.q,c.r)]);
   if(chiuse.length){for(const c of chiuse){const o=G.aOffset(c.q,c.r);g[o.riga][o.col]='#'}A=costruisci(g,s,R,id,amb)}
   if(!valida(A))return A}
  return ripiego(amb)}
 // ---- le arene dei capi, scritte a mano ----
 const CAPI={
  'capobanda-corvino':{id:'accampamento',nome:'Accampamento dei Corvi',ambiente:'pianura',desc:'Tende ai lati, un fuoco al centro, un carro rialzato: Corvino non si fa sorprendere in campo aperto.',
   righe:['TT.....TT','T.......T','o.......o','..,.^.,..','.oT...To.','...,.,...','.oT...To.','..,...,..','o.......o','.........','.........'],
   sup:['.........','.........','.........','.........','.........','....f....','.........','.........','.........','.........','.........']},
  're-senza-corona':{id:'cripta',nome:'Cripta del Re senza corona',ambiente:'antro',desc:'Sarcofagi, colonne e un rialzo al centro: il trono di pietra. Dai lati sale un miasma.',
   righe:['##.....##','#.......#','.........','.o..T..o.','..o...o..','.T..^..T.','..o...o..','.o..T..o.','.........','#.......#','##.....##'],
   sup:['.........','.........','.........','.........','....v....','.........','....v....','.........','.........','.........','.........']},
  'maestro-della-torre':{id:'sala-del-maestro',nome:'Sala del Maestro',ambiente:'torre',desc:'Una sala tonda con un piedistallo al centro e due bracieri: il Maestro comanda dall\'alto.',
   righe:['##.....##','#.......#','#.......#','..T...T..','.o.^^^.o.','....^....','.o.^^^.o.','..T...T..','#.......#','#.......#','##.....##'],
   sup:['.........','.........','.........','...f.f...','.........','.........','.........','.........','.........','.........','.........']}};
 const capo=def=>{const c=CAPI[def];return c?arenaDa(c.righe,c.sup,c.id,c.ambiente,c.nome):null};
 // l'arena per un incontro: quella del capo se c'è, altrimenti una generata dall'ambiente
 const perIncontro=(seme,ambiente,defs)=>{for(const d of defs||[]){const a=capo(d);if(a)return a}return genera(seme,ambiente)};
 return{W,H,NOMI,RICETTE,AMBIENTI,CAPI,ambienteDa,ingressi,valida,genera,ripiego,capo,perIncontro}})();
if(typeof module!=='undefined')module.exports=AARE;
