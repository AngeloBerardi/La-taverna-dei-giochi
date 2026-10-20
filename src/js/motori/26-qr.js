/* ---- Codice QR (dati puri, nessuna libreria): modalità byte, correzione M, versioni 1–15 (fino a 331 byte). ----
   QR.matrice(testo) -> { size, mod[y][x] (true = scuro) }   QR.svg(testo, {px, scuro, chiaro}) -> stringa SVG
   Algoritmo standard (ISO 18004): codewords con Reed-Solomon su GF(256), 8 maschere, scelta di quella con meno penalità.
   Verificato decodificando le immagini con un lettore vero (tools/test-browser, scenario schermo_comune). */
const QR=(()=>{
 const ECC=[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24],BLOCCHI=[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9],MAXV=14;
 const bit=(v,i)=>((v>>>i)&1)!==0;
 const grezzi=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
 const datiCw=v=>Math.floor(grezzi(v)/8)-ECC[v]*BLOCCHI[v];
 const allineamenti=v=>{if(v===1)return[];const n=Math.floor(v/7)+2,size=v*4+17,passo=Math.ceil((v*4+4)/(n*2-2))*2,r=[6];for(let p=size-7;r.length<n;p-=passo)r.splice(1,0,p);return r};
 // Reed-Solomon su GF(256) con polinomio 0x11D
 const moltiplica=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z&255};
 const divisore=g=>{const r=new Array(g).fill(0);r[g-1]=1;let radice=1;for(let i=0;i<g;i++){for(let j=0;j<r.length;j++){r[j]=moltiplica(r[j],radice);if(j+1<r.length)r[j]^=r[j+1]}radice=moltiplica(radice,2)}return r};
 const resto=(dati,div)=>{const r=div.map(()=>0);for(const b of dati){const f=b^r.shift();r.push(0);div.forEach((c,i)=>{r[i]^=moltiplica(c,f)})}return r};
 const utf8=s=>Array.from(new TextEncoder().encode(s));
 function codifica(testo){
  const byte=utf8(testo);let v=1;
  for(;v<=MAXV;v++){const cc=v<10?8:16;if(4+cc+byte.length*8<=datiCw(v)*8)break}
  if(v>MAXV)throw new Error('testo troppo lungo per il QR ('+byte.length+' byte)');
  const bits=[];const metti=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
  metti(4,4);metti(byte.length,v<10?8:16);byte.forEach(b=>metti(b,8));
  const cap=datiCw(v)*8;metti(0,Math.min(4,cap-bits.length));metti(0,(8-bits.length%8)%8);
  for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)metti(p,8);
  const cw=[];for(let i=0;i<bits.length;i+=8){let x=0;for(let j=0;j<8;j++)x=(x<<1)|bits[i+j];cw.push(x)}
  return{v,cw}}
 function intreccia(dati,v){
  const nb=BLOCCHI[v],eb=ECC[v],raw=Math.floor(grezzi(v)/8),corti=nb-raw%nb,lc=Math.floor(raw/nb),div=divisore(eb),blocchi=[];
  for(let i=0,k=0;i<nb;i++){const d=dati.slice(k,k+lc-eb+(i<corti?0:1));k+=d.length;const e=resto(d,div);if(i<corti)d.push(0);blocchi.push(d.concat(e))}
  const out=[];for(let i=0;i<blocchi[0].length;i++)blocchi.forEach((b,j)=>{if(i!==lc-eb||j>=corti)out.push(b[i])});return out}
 function penalita(m,size){
  let p=0;const riga=(get)=>{for(let a=0;a<size;a++){let run=1,ult=get(a,0);const hist=[];
    for(let b=1;b<size;b++){const c=get(a,b);if(c===ult)run++;else{if(run>=5)p+=3+run-5;hist.push(run);run=1;ult=c}}
    if(run>=5)p+=3+run-5;hist.push(run);
    // schema 1:1:3:1:1 con 4 chiari da un lato (approssimato sulla sequenza di run)
    const s=Array.from({length:size},(_,b)=>get(a,b)?1:0).join('');p+=40*((s.match(/(?=0000101110|0111010000)/g)||[]).length)}};
  riga((a,b)=>m[a][b]);riga((a,b)=>m[b][a]);
  for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=m[y][x];if(c===m[y][x+1]&&c===m[y+1][x]&&c===m[y+1][x+1])p+=3}
  let nero=0;for(const r of m)for(const c of r)if(c)nero++;const tot=size*size;p+=(Math.ceil(Math.abs(nero*20-tot*10)/tot)-1)*10;return p}
 function matrice(testo){
  const{v,cw}=codifica(testo),size=v*4+17,dati=intreccia(cw,v);
  const m=Array.from({length:size},()=>new Array(size).fill(false)),fn=Array.from({length:size},()=>new Array(size).fill(false));
  const fm=(x,y,c)=>{m[y][x]=c;fn[y][x]=true};
  for(let i=0;i<size;i++){fm(6,i,i%2===0);fm(i,6,i%2===0)}
  const finder=(x,y)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),xx=x+dx,yy=y+dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)fm(xx,yy,d!==2&&d!==4)}};
  finder(3,3);finder(size-4,3);finder(3,size-4);
  const al=allineamenti(v),n=al.length;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){if((i===0&&j===0)||(i===0&&j===n-1)||(i===n-1&&j===0))continue;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)fm(al[i]+dx,al[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}
  const formato=mask=>{const d=(0<<3)|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const bits=((d<<10)|r)^0x5412;
   for(let i=0;i<=5;i++)fm(8,i,bit(bits,i));fm(8,7,bit(bits,6));fm(8,8,bit(bits,7));fm(7,8,bit(bits,8));for(let i=9;i<15;i++)fm(14-i,8,bit(bits,i));
   for(let i=0;i<8;i++)fm(size-1-i,8,bit(bits,i));for(let i=8;i<15;i++)fm(8,size-15+i,bit(bits,i));fm(8,size-8,true)};
  formato(0);
  if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const bits=(v<<12)|r;for(let i=0;i<18;i++){const c=bit(bits,i),a=size-11+i%3,b=Math.floor(i/3);fm(a,b,c);fm(b,a,c)}}
  let k=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,y=((right+1)&2)===0?size-1-vert:vert;if(!fn[y][x]&&k<dati.length*8){m[y][x]=bit(dati[k>>>3],7-(k&7));k++}}}
  const cond=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  let best=null,bp=1e9;
  for(let mask=0;mask<8;mask++){const t=m.map(r=>r.slice());for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!fn[y][x]&&cond[mask](x,y))t[y][x]=!t[y][x];
   const sv=m.map(r=>r.slice());for(let y=0;y<size;y++)for(let x=0;x<size;x++)m[y][x]=t[y][x];formato(mask);const pen=penalita(m,size);
   if(pen<bp){bp=pen;best=m.map(r=>r.slice())}
   for(let y=0;y<size;y++)for(let x=0;x<size;x++)m[y][x]=sv[y][x]}
  return{size,mod:best,versione:v}}
 function svg(testo,o){o=o||{};const q=matrice(testo),n=q.size+8;let d='';
  for(let y=0;y<q.size;y++){let x=0;while(x<q.size){if(!q.mod[y][x]){x++;continue}let e=x;while(e<q.size&&q.mod[y][e])e++;d+=`M${x+4} ${y+4}h${e-x}v1h${x-e}z`;x=e}}
  return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${o.px||n*4}" height="${o.px||n*4}" shape-rendering="crispEdges" role="img" aria-label="Codice QR"><rect width="${n}" height="${n}" fill="${o.chiaro||'#fff'}"/><path d="${d}" fill="${o.scuro||'#000'}"/></svg>`}
 return{matrice,svg,MAXV,capacita:v=>datiCw(v)}})();
if(typeof module!=='undefined')module.exports=QR;
