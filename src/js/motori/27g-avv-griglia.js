/* ---- Griglia della battaglia (Cantari di Ventura): geometria a esagoni, vista, coperture, aree e percorsi. Regole pure, niente dadi. ----
   Coordinate assiali (q, r), esagoni con la punta in alto, le stesse della campagna (CAMP): E, NE, NO, O, SO, SE = DIREZIONI[0..5].
   L'arena è un rettangolo di `w` colonne per `h` righe a righe sfalsate: colonna = q + ⌊r/2⌋, riga = r. Si scrive come testo:
     terreno  . pavimento  , difficile (costo 2)  ^ rialzo (altezza +1, salirci costa +1)  # muro  T ostacolo alto  o ostacolo basso
     superfici (facoltative, stessa forma)  . niente  f fuoco  v veleno  g ghiaccio  w acqua (terreno difficile)
   Vista: la linea fra i centri di due celle; muri e ostacoli alti la bloccano, ogni ostacolo basso in mezzo dà copertura
   (1 = mezza, +2 alla CA; 2 o più = tre quarti, +5). Se la linea passa su uno spigolo si provano due tracciati appena spostati e vale
   quello più favorevole a chi guarda, quindi la vista è simmetrica. Fuori dall'arena si comporta come un muro. */
const AGRI=(()=>{
 const DIREZIONI=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
 const K=(q,r)=>q+','+r;
 const dist=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.q+a.r-b.q-b.r)+Math.abs(a.r-b.r))/2;
 const vicini=c=>DIREZIONI.map(([dq,dr])=>({q:c.q+dq,r:c.r+dr}));
 const aOffset=(q,r)=>({col:q+Math.floor(r/2),riga:r}),daOffset=(col,riga)=>({q:col-Math.floor(riga/2),r:riga});
 const TIPI={'.':{id:'pavimento',nome:'Pavimento',c:1,pass:1,vista:1,alt:0},',':{id:'difficile',nome:'Terreno difficile',c:2,pass:1,vista:1,alt:0},
  '^':{id:'rialzo',nome:'Rialzo',c:1,pass:1,vista:1,alt:1},'#':{id:'muro',nome:'Muro',c:null,pass:0,vista:0,alt:0},
  'T':{id:'alto',nome:'Ostacolo alto',c:null,pass:0,vista:0,alt:0},'o':{id:'basso',nome:'Ostacolo basso',c:null,pass:0,vista:1,alt:0,cop:1}};
 const SUP={'.':null,f:'fuoco',v:'veleno',g:'ghiaccio',w:'acqua'},NOME_SUP={fuoco:'Fuoco',veleno:'Veleno',ghiaccio:'Ghiaccio',acqua:'Acqua'};
 // ---- l'arena ----
 function arena(righe,sup){if(!Array.isArray(righe)||!righe.length)throw new Error('arena vuota');const w=righe[0].length,h=righe.length;
  for(const r of righe){if(r.length!==w)throw new Error('righe di lunghezza diversa');for(const ch of r)if(!TIPI[ch])throw new Error('cella sconosciuta: '+ch)}
  if(sup){if(sup.length!==h)throw new Error('superfici: righe diverse');for(const r of sup){if(r.length!==w)throw new Error('superfici: colonne diverse');for(const ch of r)if(!(ch in SUP))throw new Error('superficie sconosciuta: '+ch)}}
  return{w,h,righe:righe.slice(),sup:sup?sup.slice():null}}
 const vuota=(w,h)=>arena(Array.from({length:h},()=>'.'.repeat(w)));
 const dentro=(A,c)=>c.r>=0&&c.r<A.h&&c.q+Math.floor(c.r/2)>=0&&c.q+Math.floor(c.r/2)<A.w;
 const tipo=(A,c)=>dentro(A,c)?TIPI[A.righe[c.r][c.q+Math.floor(c.r/2)]]:null;
 const sup=(A,c)=>A.sup&&dentro(A,c)?SUP[A.sup[c.r][c.q+Math.floor(c.r/2)]]:null;
 const alt=(A,c)=>{const t=tipo(A,c);return t?t.alt:0};
 const passabile=(A,c)=>{const t=tipo(A,c);return !!t&&!!t.pass};
 const celle=A=>{const o=[];for(let r=0;r<A.h;r++)for(let col=0;col<A.w;col++)o.push(daOffset(col,r));return o};
 // celle a distanza ≤ n da c (senza guardare l'arena) e a distanza esatta n
 function entro(c,n){const o=[];for(let dq=-n;dq<=n;dq++)for(let dr=Math.max(-n,-dq-n);dr<=Math.min(n,-dq+n);dr++)o.push({q:c.q+dq,r:c.r+dr});return o}
 function anello(c,n){if(n<1)return[{q:c.q,r:c.r}];const o=[];let x={q:c.q+DIREZIONI[4][0]*n,r:c.r+DIREZIONI[4][1]*n};
  for(let i=0;i<6;i++)for(let j=0;j<n;j++){o.push(x);x={q:x.q+DIREZIONI[i][0],r:x.r+DIREZIONI[i][1]}}return o}
 // ---- linee e vista ----
 const cubo=c=>({x:c.q,y:-c.q-c.r,z:c.r});
 function tondo(x,y,z){let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z);
  if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;return{q:rx|0,r:rz|0}}
 // celle attraversate dalla linea fra i centri (estremi compresi); `seg` = ±1 sposta appena il tracciato per decidere gli spigoli
 function tracciato(a,b,seg){const n=dist(a,b),e=1e-6*(seg||1),A=cubo(a),B=cubo(b),o=[];
  for(let i=0;i<=n;i++){const t=n?i/n:0;o.push(tondo(A.x+(B.x-A.x)*t+e,A.y+(B.y-A.y)*t+2*e,A.z+(B.z-A.z)*t-3*e))}return o}
 // { visibile, cop:'nessuna'|'mezza'|'tre-quarti'|'totale', ca:0|2|5|null, dislivello } — dislivello > 0: chi guarda sta più in alto
 function vista(A,a,b){const dis=alt(A,a)-alt(A,b);if(a.q===b.q&&a.r===b.r)return{visibile:false,cop:'totale',ca:null,dislivello:0};
  let best=null;
  for(const seg of[1,-1]){const L=tracciato(a,b,seg).slice(1,-1);let bassi=0,blocca=false;
   for(const c of L){const t=tipo(A,c);if(!t||!t.vista){blocca=true;break}if(t.cop)bassi++}
   if(!blocca&&(best===null||bassi<best))best=bassi}
  if(best===null)return{visibile:false,cop:'totale',ca:null,dislivello:dis};
  return{visibile:true,cop:best===0?'nessuna':best===1?'mezza':'tre-quarti',ca:best===0?0:best===1?2:5,dislivello:dis}}
 // ---- aree (solo celle dove può stare qualcuno e che chi origina l'area può vedere) ----
 const libera=(A,c0,x)=>passabile(A,x)&&(x.q===c0.q&&x.r===c0.r||vista(A,c0,x).visibile);
 // cerchio di raggio r intorno a c (c compresa); l'aura è lo stesso senza la cella centrale
 const cerchio=(A,c,r,o)=>entro(c,r).filter(x=>(!(o&&o.senzaCentro)||x.q!==c.q||x.r!==c.r)&&libera(A,c,x));
 const aura=(A,c,r)=>cerchio(A,c,r,{senzaCentro:true});
 // cono: spicchio di 60° fra DIREZIONI[dir] e DIREZIONI[dir+1], k+1 celle a distanza k
 function cono(A,c,dir,r){const d1=DIREZIONI[((dir%6)+6)%6],d2=DIREZIONI[(((dir+1)%6)+6)%6],o=[];
  for(let k=1;k<=r;k++)for(let a=0;a<=k;a++){const x={q:c.q+a*d1[0]+(k-a)*d2[0],r:c.r+a*d1[1]+(k-a)*d2[1]};if(libera(A,c,x))o.push(x)}return o}
 // linea lungo uno dei sei assi: si ferma davanti a muri e ostacoli alti, passa sopra quelli bassi
 function lineaDa(A,c,dir,r){const d=DIREZIONI[((dir%6)+6)%6],o=[];
  for(let k=1;k<=r;k++){const x={q:c.q+d[0]*k,r:c.r+d[1]*k},t=tipo(A,x);if(!t||!t.vista)break;if(t.pass)o.push(x)}return o}
 // a quale spicchio appartiene la cella t guardando da c (l'asse i sta nello spicchio i; ogni cella sta in uno solo)
 function direzioneVerso(c,t){const q=t.q-c.q,r=t.r-c.r;if(!q&&!r)return 0;
  for(let i=0;i<6;i++){const[aq,ar]=DIREZIONI[i],[bq,br]=DIREZIONI[(i+1)%6],det=aq*br-ar*bq,a=(q*br-r*bq)/det,b=(aq*r-ar*q)/det;if(a>0&&b>=0)return i}
  return 0}
 // l'asse più vicino alla direzione di t (per le linee); a parità il primo
 function asseVerso(c,t){const vx=(t.q-c.q)+(t.r-c.r)/2,vy=(t.r-c.r)*.8660254;let b=0,bs=-Infinity;
  DIREZIONI.forEach(([dq,dr],i)=>{const s=(dq+dr/2)*vx+dr*.8660254*vy;if(s>bs+1e-9){bs=s;b=i}});return b}
 // la cella dove finisce chi viene spinto da `da` lontano da lui: il vicino di x più in linea con la direzione della spinta
 function indietro(A,da,x){const i=asseVerso(da,x);return{q:x.q+DIREZIONI[i][0],r:x.r+DIREZIONI[i][1]}}
 // ---- percorsi ----
 // costo di entrare in `a` venendo da `da`: terreno (difficile e acqua 2) + 1 per ogni livello di salita
 function costoEntrata(A,da,a,o){const t=tipo(A,a);if(!t||!t.pass)return Infinity;
  let c=Math.max(t.c,sup(A,a)==='acqua'?2:1);if(o&&o.ignoraDifficile)c=1;return c+Math.max(0,alt(A,a)-alt(A,da))}
 // celle raggiungibili con `pm` punti: { 'q,r': { q, r, costo, da } }. o.blocca = celle che non si attraversano (nemici),
 // o.passa = celle che si attraversano ma dove non ci si ferma (alleati; vedi `fermabili`), o.ignoraDifficile
 function raggiungibili(A,da,pm,o){o=o||{};const B=new Set((o.blocca||[]).map(c=>K(c.q,c.r))),k0=K(da.q,da.r),ris={[k0]:{q:da.q,r:da.r,costo:0,da:null}},sec=[[k0]];
  for(let c=0;c<=pm;c++)for(const k of sec[c]||[]){const x=ris[k];if(x.costo!==c)continue;
   for(const n of vicini(x)){const kn=K(n.q,n.r);if(B.has(kn))continue;const cs=costoEntrata(A,x,n,o);if(cs===Infinity)continue;const t=c+cs;if(t>pm)continue;
    if(!ris[kn]||t<ris[kn].costo){ris[kn]={q:n.q,r:n.r,costo:t,da:k};(sec[t]=sec[t]||[]).push(kn)}}}
  return ris}
 // dove ci si può fermare: raggiungibili meno la cella di partenza e quelle occupate
 function fermabili(ris,occupate){const O=new Set((occupate||[]).map(c=>K(c.q,c.r)));
  return Object.keys(ris).filter(k=>ris[k].da!==null&&!O.has(k)).map(k=>({q:ris[k].q,r:ris[k].r,costo:ris[k].costo}))}
 // le celle da attraversare per arrivare in `a` (partenza esclusa), oppure null
 function percorso(ris,a){let k=K(a.q,a.r);if(!ris[k])return null;const o=[];while(ris[k]&&ris[k].da!==null){o.push({q:ris[k].q,r:ris[k].r});k=ris[k].da}return o.reverse()}
 return{DIREZIONI,TIPI,SUP,NOME_SUP,K,dist,vicini,aOffset,daOffset,arena,vuota,dentro,tipo,sup,alt,passabile,celle,entro,anello,tracciato,vista,cerchio,aura,cono,lineaDa,direzioneVerso,asseVerso,indietro,costoEntrata,raggiungibili,fermabili,percorso}})();
if(typeof module!=='undefined')module.exports=AGRI;
