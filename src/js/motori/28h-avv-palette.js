/* ---- Palette e misure della resa pixel di Cantari di Ventura (B1–B2). Motore puro: niente three.js, niente DOM. ----
   Palette fissa da 40 colori nostri: 8 rampe da 5 toni, dal più scuro al più chiaro (scuri freddi, chiari caldi). Ogni pixel della scena si porta
   al colore più vicino con una tabella 32×32×32 (confronto in Oklab, che segue l'occhio). Qui anche le misure della catena: scala intera
   dello schermo, pixel d'arte per unità del mondo, aggancio della telecamera ai pixel, il retino (Bayer 4×4) e i controlli usati dai test
   (blocchi, colori, scorrimento). Palette definitiva (B2), disegnata in OKLCH: ogni rampa scende verso il freddo e sale verso il caldo;
   i colori si ritoccano in RAMPE e basta, il resto segue. Piano: docs/AVVENTURA-B.md (Resa grafica, B1–B2). Test: tests/test_avv_palette.js */
const APAL=(()=>{
 const NOMI=['pietra','erba','legno','pelle','metallo','fuoco','magia','notte'];
 const RAMPE={
  pietra:['#182233','#2f4154','#4e6778','#76919c','#a8c3c8'],
  erba:['#01372c','#095c34','#448335','#7da937','#c5d254'],
  legno:['#361c13','#593523','#805533','#a67d50','#ccac7b'],
  pelle:['#7f463d','#a86751','#c68c6a','#dfb490','#f7d8b8'],
  metallo:['#3c342a','#62594d','#8a8275','#b4ada0','#ebeae1'],
  fuoco:['#90101a','#c44404','#e68101','#f3ba25','#fcf2a2'],
  magia:['#361e57','#5f3389','#944fb0','#c67bcb','#f4b2e5'],
  notte:['#0a0919','#14152f','#1e2346','#28345d','#2e4775']};
 const TONI=5,COLORI=NOMI.flatMap(n=>RAMPE[n]);
 const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]};
 const RGB=COLORI.map(rgb);
 // ---- Oklab (Björn Ottosson): sRGB 0–255 → [L, a, b] ----
 const lin=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)};
 function oklab(r,g,b){if(typeof r==='string')[r,g,b]=rgb(r);const R=lin(r),G=lin(g),B=lin(b);
  const l=Math.cbrt(.4122214708*R+.5363325363*G+.0514459929*B),m=Math.cbrt(.2119034982*R+.6806995451*G+.1073969566*B),s=Math.cbrt(.0883024619*R+.2817188376*G+.6299787005*B);
  return[.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s]}
 const LAB=RGB.map(c=>oklab(...c));
 // distanza in Oklab con la tinta che pesa il doppio della luce: un grigio caldo resta grigio (più chiaro o più scuro), non diventa pelle
 const PESO_TINTA=4,d2=(p,q)=>(p[0]-q[0])**2+PESO_TINTA*((p[1]-q[1])**2+(p[2]-q[2])**2);
 // indice del colore della palette più vicino (a parità vince il primo)
 function vicino(r,g,b){const p=oklab(r,g,b);let k=0,m=Infinity;for(let i=0;i<LAB.length;i++){const d=d2(p,LAB[i]);if(d<m){m=d;k=i}}return k}
 const rampa=i=>Math.floor(i/TONI);
 const scuro=i=>rampa(i)*TONI;
 // tabella per lo shader: larga n·n, alta n; il pixel (b·n + r, g) ha il colore della palette del cubetto (r, g, b) e in alfa il suo numero (0–39):
 // dal numero lo shader ricava rampa e tono (contorno = tono più scuro della rampa, filo di luce = un tono più chiaro)
 function tabella(n){n=n||32;const w=n*n,dati=new Uint8Array(w*n*4),c=x=>Math.round((x+.5)*255/n);
  for(let g=0;g<n;g++)for(let b=0;b<n;b++)for(let r=0;r<n;r++){const k=vicino(c(r),c(g),c(b)),o=(g*w+b*n+r)*4,q=RGB[k];dati[o]=q[0];dati[o+1]=q[1];dati[o+2]=q[2];dati[o+3]=k}
  return{n,w,h:n,dati}}
 // il tono più scuro di ogni rampa (per i contorni), 8 pixel RGBA
 function scuri(){const d=new Uint8Array(NOMI.length*4);NOMI.forEach((_,i)=>{const q=RGB[i*TONI];d.set([q[0],q[1],q[2],255],i*4)});return d}
 // tutta la palette in fila, 40 pixel RGBA (lo shader legge il colore n alla colonna n)
 function paletta(){const d=new Uint8Array(COLORI.length*4);RGB.forEach((q,i)=>d.set([q[0],q[1],q[2],255],i*4));return d}
 // numero di un colore: 'rampa:tono' (es. 'notte:2') o esadecimale della palette; −1 se non c'è
 function indice(c){if(typeof c!=='string')return-1;const m=/^([a-z]+):([0-4])$/.exec(c);if(m){const r=NOMI.indexOf(m[1]);return r<0?-1:r*TONI+(+m[2])}return COLORI.indexOf(c.toLowerCase())}
 const colore=c=>{const i=indice(c);return i<0?null:COLORI[i]};
 // un tono più chiaro nella stessa rampa (il filo di luce); il più chiaro resta sé stesso
 const chiaro=i=>Math.min(i+1,rampa(i)*TONI+TONI-1);
 // retino di Bayer 4×4: soglia in [0, 1) per il pixel (x, y), uguale alla formula dello shader (24hp-pixel.js)
 function bayer(x,y){const b2=(a,c)=>{a=Math.floor(a);c=Math.floor(c);const v=a*.5+c*c*.75;return v-Math.floor(v)};return b2(x/2,y/2)*.25+b2(x,y)}
 // ---- telecamera e misure ----
 const CAMERA={incl:55,cos:.573576,sin:.819152};   // ortografica, inclinata di 55° sul piano, senza rotazione
 const ALTO_EROE=24;                                 // pixel d'arte di un eroe umano in piedi
 const ALT_RIF=43;                                   // l'eroe di riferimento nel mondo: umano guerriero di AMIN × 1,3 più la basetta (24ho)
 const MIN_ART={verticale:192,orizzontale:400,tv:480};
 // scala intera dello schermo e misura del bersaglio in pixel d'arte; o = { w, h (pixel CSS), dpr, tv, zoom: 'lontano'|'vicino' }
 function misure(o){const dpr=o.dpr||1,W=Math.round(o.w*dpr),H=Math.round(o.h*dpr),tipo=o.tv?'tv':W>=H?'orizzontale':'verticale';
  const s0=Math.max(1,Math.floor(W/MIN_ART[tipo])),s=o.zoom==='vicino'?Math.max(s0+1,Math.round(s0*4/3)):s0;
  return{W,H,s,tipo,art:[Math.ceil(W/s),Math.ceil(H/s)]}}
 // pixel d'arte per unità del mondo, dall'altezza dell'eroe di riferimento nel mondo
 const k=alt=>ALTO_EROE/((alt||ALT_RIF)*CAMERA.cos);
 // un punto del mondo sul piano della telecamera (unità del mondo): x a destra, y in alto
 const piano=(x,y,z)=>[x,y*CAMERA.cos-z*CAMERA.sin];
 // aggancio ai pixel: il valore arrotondato al pixel d'arte e il resto (in pixel d'arte, fra −½ e ½) che va applicato nell'ingrandimento
 function aggancia(v,kk){const p=Math.round(v*kk);return{v:p/kk,resto:v*kk-p}}
 // ---- controlli per i test (immagini RGBA, righe di W pixel) ----
 // ogni blocco s×s intero, a partire da (ox, oy), è di un solo colore?
 function blocchi(dati,W,H,s,ox,oy){let diversi=0,n=0;ox=((ox%s)+s)%s;oy=((oy%s)+s)%s;
  for(let y=oy;y+s<=H;y+=s)for(let x=ox;x+s<=W;x+=s){n++;const o0=(y*W+x)*4;let ok=true;
   for(let j=0;j<s&&ok;j++)for(let i=0;i<s;i++){const o=((y+j)*W+x+i)*4;if(dati[o]!==dati[o0]||dati[o+1]!==dati[o0+1]||dati[o+2]!==dati[o0+2]){ok=false;break}}
   if(!ok)diversi++}
  return{ok:n>0&&!diversi,blocchi:n,diversi}}
 const SET=new Set(RGB.map(q=>(q[0]<<16)|(q[1]<<8)|q[2]));
 // pixel con un colore che non è della palette
 function fuori(dati){let n=0;for(let o=0;o<dati.length;o+=4)if(!SET.has((dati[o]<<16)|(dati[o+1]<<8)|dati[o+2]))n++;return n}
 // b è a spostata di (dx, dy)? conta i pixel diversi nella parte comune (b(x, y) = a(x + dx, y + dy)), lasciando fuori un margine m
 function confronta(a,b,W,H,dx,dy,m){m=m||0;let n=0,tot=0;
  for(let y=m;y<H-m;y++){const ya=y+dy;if(ya<m||ya>=H-m)continue;for(let x=m;x<W-m;x++){const xa=x+dx;if(xa<m||xa>=W-m)continue;tot++;
   const o=(y*W+x)*4,p=(ya*W+xa)*4;if(a[p]!==b[o]||a[p+1]!==b[o+1]||a[p+2]!==b[o+2])n++}}
  return{diversi:n,tot}}
 return{NOMI,RAMPE,TONI,COLORI,RGB,CAMERA,ALTO_EROE,ALT_RIF,MIN_ART,oklab,vicino,rampa,scuro,chiaro,tabella,scuri,paletta,indice,colore,bayer,misure,k,piano,aggancia,blocchi,fuori,confronta}})();
if(typeof module!=='undefined')module.exports=APAL;
