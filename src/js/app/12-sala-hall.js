/* ---- La sala della taverna: scena isometrica dark fantasy, tavoli e personaggi a blocchi ---- */
const HALL=(()=>{
 const TW=54,TH=27,NN=7,OX=195,OY=128,WH=118,SL=14,VW=390,VH=346,K=1.55;
 const P=(i,j,z=0)=>[OX+(i-j)*TW/2,OY+(i+j)*TH/2-z];
 const f1=v=>(Math.round(v*10)/10);
 const pt=a=>a.map(p=>f1(p[0])+','+f1(p[1])).join(' ');
 const mix=(c,k)=>{const n=parseInt(c.slice(1),16);const g=s=>Math.max(0,Math.min(255,Math.round(((n>>s)&255)*k)));return'#'+((1<<24)+(g(16)<<16)+(g(8)<<8)+g(0)).toString(16).slice(1)};
 const poly=(a,f,x='')=>`<polygon points="${pt(a)}" fill="${f}" ${x}/>`;
 const EDGE='stroke="#0a0604" stroke-width=".7" stroke-linejoin="round"';
 /* parallelepipedo a tre facce visibili: alto, fronte-sinistra (+j), fronte-destra (+i) */
 function box(i,j,w,d,h,c,z=0,o={}){const cc=typeof c==='string'?{t:mix(c,1.14),l:mix(c,.8),r:mix(c,.55)}:c;
  const t=[P(i,j,z+h),P(i+w,j,z+h),P(i+w,j+d,z+h),P(i,j+d,z+h)];
  return poly([P(i,j+d,z+h),P(i+w,j+d,z+h),P(i+w,j+d,z),P(i,j+d,z)],cc.l,EDGE)+poly([P(i+w,j,z+h),P(i+w,j+d,z+h),P(i+w,j+d,z),P(i+w,j,z)],cc.r,EDGE)+poly(t,cc.t,EDGE)+(o.after||'')}
 const quad=(i,j,w,d,z,f,x='')=>poly([P(i,j,z),P(i+w,j,z),P(i+w,j+d,z),P(i,j+d,z)],f,x);
 /* punto su una faccia verticale (u lungo, v in altezza) */
 const faceL=(i,j,w,d,z,h,u,v)=>P(i+w*u,j+d,z+h*v),faceR=(i,j,w,d,z,h,u,v)=>P(i+w,j+d*u,z+h*v);
 const shadow=(i,j,w,d,o=.4)=>{const c=P(i+w/2+.12,j+d/2+.12);return`<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1((w+d)*TW*.26)}" ry="${f1((w+d)*TH*.26)}" fill="#000" opacity="${o}"/>`};
 let sd=11;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
 const WL=(u,z)=>P(0,u,z),WR=(u,z)=>P(u,0,z);
 /* ---------- stanza (parti fisse, calcolate una volta) ---------- */
 const defs=`<defs>
 <radialGradient id="hf" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb347" stop-opacity=".9"/><stop offset=".4" stop-color="#ff7a1a" stop-opacity=".42"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
 <radialGradient id="ht" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffc060" stop-opacity=".85"/><stop offset="1" stop-color="#ff8a20" stop-opacity="0"/></radialGradient>
 <radialGradient id="hm" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9ab8ff" stop-opacity=".7"/><stop offset="1" stop-color="#3a5aa0" stop-opacity="0"/></radialGradient>
 <radialGradient id="hv" cx="50%" cy="46%" r="68%"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
 <linearGradient id="hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060a"/><stop offset="1" stop-color="#150d08"/></linearGradient></defs>`;
 let room='';
 // pavimento
 for(let i=0;i<NN;i++)for(let j=0;j<NN;j++){const k=.8+rnd()*.32+((i+j)%2?0:.06);room+=poly([P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)],mix('#5a3d24',k),'stroke="#1a0f08" stroke-width=".7"');
  for(let p=1;p<3;p++){const a=P(i,j+p/3),b=P(i+1,j+p/3);room+=`<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#1a0f08" stroke-opacity=".3" stroke-width=".6"/>`}}
 const slab=poly([P(0,NN),P(NN,NN),P(NN,NN,-SL),P(0,NN,-SL)],'#2a1a0e',EDGE)+poly([P(NN,0),P(NN,NN),P(NN,NN,-SL),P(NN,0,-SL)],'#180d06',EDGE);
 const wallF=(W,base,tone)=>{let s=poly([W(0,0),W(NN,0),W(NN,WH),W(0,WH)],tone,'stroke="#0a0604" stroke-width="1.4"');
  for(let z=0;z<WH;z+=14){const a=W(0,z),b=W(NN,z);s+=`<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#0a0a10" stroke-opacity=".55" stroke-width=".9"/>`;
   for(let u=((z/14)%2?.3:0);u<NN;u+=.6){const a=W(u,z),b=W(u,z+14);s+=`<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#0a0a10" stroke-opacity=".45" stroke-width=".9"/>`}}
  s+=poly([W(0,0),W(NN,0),W(NN,7),W(0,7)],'#4a3220',EDGE)+poly([W(0,WH-9),W(NN,WH-9),W(NN,WH),W(0,WH)],'#3d2916',EDGE);
  for(let u=1;u<NN;u+=2)s+=poly([W(u-.1,0),W(u+.1,0),W(u+.1,WH),W(u-.1,WH)],'#3d2916',EDGE);return s};
 const win=(W,u,z,w,h)=>{const q=[W(u,z),W(u+w,z),W(u+w,z+h),W(u,z+h)],c=W(u+w/2,z+h/2),a=W(u+w/2,z),b=W(u+w/2,z+h);
  return poly(q,'#0d1a33','stroke="#4a3220" stroke-width="3"')+`<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="22" ry="26" fill="url(#hm)"/><line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#4a3220" stroke-width="2"/>`};
 const torch=(W,u,z)=>{const b=W(u,z);return`<ellipse class="hh-tg" cx="${f1(b[0])}" cy="${f1(b[1]-6)}" rx="32" ry="32" fill="url(#ht)"/><rect x="${f1(b[0]-1.5)}" y="${f1(b[1]-2)}" width="3" height="13" fill="#3a2a1a"/><g class="hh-fl"><path d="M${f1(b[0]-5)} ${f1(b[1])}Q${f1(b[0])} ${f1(b[1]-17)} ${f1(b[0]+5)} ${f1(b[1])}Z" fill="#ff8a20"/><path d="M${f1(b[0]-2.5)} ${f1(b[1])}Q${f1(b[0])} ${f1(b[1]-9)} ${f1(b[0]+2.5)} ${f1(b[1])}Z" fill="#ffe27a"/></g>`};
 const shelf=()=>{let s=poly([WL(1.4,40),WL(3.4,40),WL(3.4,36),WL(1.4,36)],'#4a3018',EDGE);
  [1.7,2.15,2.6,3.05].forEach((u,k)=>{const c=WL(u,40),col=['#2a63b8','#c8281e','#2f7a3a','#7a2a8a'][k];s+=`<rect x="${f1(c[0]-3)}" y="${f1(c[1]-12)}" width="6" height="12" rx="2" fill="${col}" stroke="#0a0604" stroke-width=".8"/><rect x="${f1(c[0]-1.5)}" y="${f1(c[1]-16)}" width="3" height="4" fill="#d8c08a"/>`});return s};
 const door=()=>poly([WL(5.2,0),WL(6.3,0),WL(6.3,66),WL(5.2,66)],'#2a1a0c','stroke="#0a0604" stroke-width="3"')+`<circle cx="${f1(WL(6.1,32)[0])}" cy="${f1(WL(6.1,32)[1])}" r="2" fill="#e3ac1f"/>`;
 // camino sulla parete destra (u 3..5)
 const hi=2.4,hw=2.2,hd=.6,hh=104;
 const hearth=()=>{let s=shadow(hi,0,hw,hd+.3,.45)+box(hi,0,hw,hd,hh,'#5a5a66');
  const q=[faceL(hi,0,hw,hd,0,hh,.12,.04),faceL(hi,0,hw,hd,0,hh,.88,.04),faceL(hi,0,hw,hd,0,hh,.88,.66),faceL(hi,0,hw,hd,0,hh,.12,.66)];
  s+=poly(q,'#120804','stroke="#0a0604" stroke-width="2"');
  const c=faceL(hi,0,hw,hd,0,hh,.5,.06);
  s+=`<ellipse cx="${f1(c[0])}" cy="${f1(c[1]-12)}" rx="30" ry="22" fill="url(#hf)"/><g class="hh-fire"><path d="M${f1(c[0]-14)} ${f1(c[1])}Q${f1(c[0]-13)} ${f1(c[1]-22)} ${f1(c[0]-4)} ${f1(c[1]-32)}Q${f1(c[0]-3)} ${f1(c[1]-15)} ${f1(c[0]+3)} ${f1(c[1]-22)}Q${f1(c[0]+14)} ${f1(c[1]-22)} ${f1(c[0]+14)} ${f1(c[1])}Z" fill="#ff7a1a"/><path d="M${f1(c[0]-9)} ${f1(c[1])}Q${f1(c[0]-8)} ${f1(c[1]-15)} ${f1(c[0]-1)} ${f1(c[1]-23)}Q${f1(c[0]+1)} ${f1(c[1]-11)} ${f1(c[0]+4)} ${f1(c[1]-15)}Q${f1(c[0]+10)} ${f1(c[1]-12)} ${f1(c[0]+9)} ${f1(c[1])}Z" fill="#ffc447"/><path d="M${f1(c[0]-4)} ${f1(c[1])}Q${f1(c[0]-3)} ${f1(c[1]-9)} ${f1(c[0])} ${f1(c[1]-13)}Q${f1(c[0]+4)} ${f1(c[1]-6)} ${f1(c[0]+4)} ${f1(c[1])}Z" fill="#fff2b0"/></g><rect x="${f1(c[0]-17)}" y="${f1(c[1]-2)}" width="34" height="4" fill="#4a2e16" stroke="#0a0604" stroke-width=".8"/>`;
  // cappa del camino e mensola
  s+=box(hi+.15,0,hw-.3,hd*.6,22,'#4a4a56',hh);return s};
 const barrel=(i,j)=>{const c=P(i,j);return`<ellipse cx="${f1(c[0])}" cy="${f1(c[1]+2)}" rx="13" ry="6" fill="#000" opacity=".4"/><path d="M${f1(c[0]-11)} ${f1(c[1]-22)}L${f1(c[0]-13)} ${f1(c[1]-10)}L${f1(c[0]-11)} ${f1(c[1])}L${f1(c[0]+11)} ${f1(c[1])}L${f1(c[0]+13)} ${f1(c[1]-10)}L${f1(c[0]+11)} ${f1(c[1]-22)}Z" fill="#6a4624" stroke="#0a0604" stroke-width="1"/><ellipse cx="${f1(c[0])}" cy="${f1(c[1]-22)}" rx="11" ry="5" fill="#8a6234" stroke="#0a0604" stroke-width="1"/><rect x="${f1(c[0]-12)}" y="${f1(c[1]-16)}" width="24" height="2" fill="#2a2a30"/><rect x="${f1(c[0]-12)}" y="${f1(c[1]-7)}" width="24" height="2" fill="#2a2a30"/>`};
 const rug=(()=>{const a=1.2,b=2.0,w=4.6,d=3.6;return quad(a,b,w,d,0,'#5a1a1e','stroke="#0a0604" stroke-width="1"')+quad(a+.2,b+.2,w-.4,d-.4,0,'#7a2a2a','stroke="#c8a24a" stroke-width="1.2"')+quad(a+.5,b+.5,w-1,d-1,0,'none','stroke="#c8a24a" stroke-opacity=".6" stroke-width="1" stroke-dasharray="3 3"')})();
 const fixed=`<rect width="${VW}" height="${VH}" fill="url(#hb)"/><g>${wallF(WL,0,'#34343e')}${wallF(WR,0,'#27272f')}</g>${win(WL,.9,48,.8,44)}${win(WL,3.7,48,.8,44)}${win(WR,5.3,48,.8,44)}${shelf()}${door()}${hearth()}${torch(WL,.35,62)}${torch(WL,6.65,62)}${torch(WR,.35,62)}${torch(WR,6.65,62)}${slab}<g>${room}</g>${rug}${barrel(.5,3.5)}${barrel(6.5,3.6)}`;

 /* ---------- tavoli di categoria ---------- */
 const WOOD={t:'#8a6234',l:'#6a4a2a',r:'#4a3018'};
 const cardq=(i,j,z,col,r=0)=>{const w=.2,d=.28,s=Math.sin(r),c=Math.cos(r),pp=[[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,y])=>P(i+x*c-y*s,j+x*s+y*c,z));return poly(pp,col,'stroke="#1a0f08" stroke-width=".6"')};
 const mug=(i,j,z)=>{const c=P(i,j,z);return`<rect x="${f1(c[0]-3)}" y="${f1(c[1]-6)}" width="6" height="6" fill="#c8a24a" stroke="#1a0f08" stroke-width=".7"/><ellipse cx="${f1(c[0])}" cy="${f1(c[1]-6)}" rx="3" ry="1.5" fill="#f0e0a0" stroke="#1a0f08" stroke-width=".6"/><path d="M${f1(c[0]+3)} ${f1(c[1]-5)}q4 1 0 4" fill="none" stroke="#c8a24a" stroke-width="1.3"/>`};
 const candle=(i,j,z)=>{const c=P(i,j,z);return`<ellipse cx="${f1(c[0])}" cy="${f1(c[1]-8)}" rx="13" ry="10" fill="url(#ht)" opacity=".9"/><rect x="${f1(c[0]-1.5)}" y="${f1(c[1]-8)}" width="3" height="8" fill="#efe3c8" stroke="#1a0f08" stroke-width=".6"/><g class="hh-fl"><path d="M${f1(c[0]-2)} ${f1(c[1]-8)}q2 -8 4 0z" fill="#ffd36a"/></g>`};
 const dice=(i,j,z)=>box(i,j,.17,.17,6,{t:'#f3ead2',l:'#d8ccae',r:'#b8aa88'},z);
 const tableBox=(i,j,w,d,top,items,hgt=24)=>{let s=shadow(i,j,w,d);const L=hgt-6;
  [[i+.08,j+.08],[i+w-.2,j+.08],[i+.08,j+d-.2],[i+w-.2,j+d-.2]].forEach(([a,b])=>s+=box(a,b,.12,.12,L,'#3a2616'));
  s+=box(i,j,w,d,6,top,L)+items;return s};
 const CATS={
  carte:{i:.35,j:4.9,w:1.7,d:1.5,k:'CARTE',items:()=>cardq(.85,5.4,24,'#efe3c8',.3)+cardq(1.2,5.7,24,'#efe3c8',-.2)+cardq(1.5,5.45,24,'#d8c08a',.6)+cardq(1.05,6.0,24,'#efe3c8',.1)},
  tavolo:{i:5.0,j:.4,w:1.7,d:1.5,k:'DA TAVOLO',items:()=>{let s='';const cs=['#2a63b8','#e3ac1f','#c8281e','#2f7a3a','#efe3c8'];for(let a=0;a<4;a++)for(let b=0;b<3;b++){const c=P(5.3+a*.32,.85+b*.3,24);s+=`<polygon points="${f1(c[0])},${f1(c[1]-3)} ${f1(c[0]+5)},${f1(c[1])} ${f1(c[0])},${f1(c[1]+3)} ${f1(c[0]-5)},${f1(c[1])}" fill="${cs[(a*3+b)%5]}" stroke="#1a0f08" stroke-width=".6"/>`}return s}},
  coop:{i:.35,j:.4,w:1.7,d:1.5,k:'COOPERATIVI',items:()=>cardq(.85,.9,24,'#c8281e',.2)+cardq(1.25,1.2,24,'#1a1a1a',-.3)+cardq(1.55,.85,24,'#e3ac1f',.5)+dice(1.1,1.4,24)},
  solo:{i:5.0,j:4.9,w:1.7,d:1.5,k:'SOLITARI',items:()=>cardq(5.5,5.4,24,'#7a2a8a',.2)+cardq(5.9,5.7,24,'#2a63b8',-.2)+mug(6.3,5.5,24)+dice(5.6,6.0,24)}};
 const catSvg=(id,n,sel)=>{const c=CATS[id],cx=id==='solo'?(q=>[q[0],q[1]+16])(P(c.i+c.w/2,c.j+c.d,0)):P(c.i+c.w/2,c.j+c.d/2,66),lbl=c.k+' · '+n,ww=lbl.length*5.5+12;
  return`<g class="hh-tb${sel?' on':''}" data-a="hallgo" data-v="${id}" role="button" tabindex="0" aria-label="${c.k}, ${n} giochi disponibili" style="cursor:pointer">${tableBox(c.i,c.j,c.w,c.d,WOOD,c.items())}
  <g class="hh-plq"><rect x="${f1(cx[0]-ww/2)}" y="${f1(cx[1]-7)}" width="${f1(ww)}" height="14" fill="#2a1a0c" stroke="${sel?'#ffd34d':'#8a6a3a'}" stroke-width="2"/><text x="${f1(cx[0])}" y="${f1(cx[1]+3)}" text-anchor="middle" font-size="8" font-weight="700" fill="#efe3c8" style="font-family:'Silkscreen',monospace">${lbl}</text></g></g>`};

 /* ---------- personaggi a blocchi isometrici ---------- */
 const HAIR='#3a2616';
 function person(i,j,face,av,sit){ // face: 'jm' guarda +j, 'im' guarda +i, 'jp' guarda -j, 'ip' guarda -i
  const Hc=AVC[av.h%AVC.length],Cc=AVC[av.c%AVC.length],sk=AVS[av.s%AVS.length];
  const front=face==='jm'||face==='im'; // il fronte è visibile
  const z0=sit?11*K:0,bw=.34*K,tz=z0+4,th=14*K,hz=tz+th,hs=.3*K,hh=10*K;
  const bi=i-bw/2,bj=j-bw/2,hi2=i-hs/2,hj=j-hs/2;
  const bc={t:mix(Cc[0],1.18),l:Cc[0],r:Cc[1]},sc={t:mix(sk,1.1),l:sk,r:mix(sk,.72)};
  let s=`<ellipse cx="${f1(P(i,j)[0])}" cy="${f1(P(i,j)[1])}" rx="15" ry="7" fill="#000" opacity=".4"/>`;
  // sgabello
  s+=box(i-.2*K,j-.2*K,.4*K,.4*K,11*K,{t:'#8a6234',l:'#6a4a2a',r:'#4a3018'},0);
  // gambe/busto
  s+=box(bi,bj,bw,bw,th,bc,tz);
  s+=box(bi,bj,bw,bw,3*K,{t:'#e9c46a',l:'#e9c46a',r:'#b8943a'},tz+4*K); // cintura
  // braccia verso il tavolo
  const dv={jm:[0,1],im:[1,0],jp:[0,-1],ip:[-1,0]}[face];
  const ar=(sx)=>{const ox=dv[1]?sx*(bw/2+.04):0,oy=dv[0]?sx*(bw/2+.04):0;const ai=i+ox+(dv[0]>0?.1:dv[0]<0?-.34:-.06),aj=j+oy+(dv[1]>0?.1:dv[1]<0?-.34:-.06);
   return box(ai,aj,dv[0]?.3*K:.12*K,dv[1]?.3*K:.12*K,6*K,bc,tz+th-8*K)};
  // le braccia si disegnano dopo il busto se davanti, prima se dietro
  const arms=ar(-1)+ar(1);
  s+=arms;
  // testa
  s+=box(hi2,hj,hs,hs,hh,sc,hz);
  // volto o nuca
  if(front){const A=face==='jm'?(u,v)=>faceL(hi2,hj,hs,hs,hz,hh,u,v):(u,v)=>faceR(hi2,hj,hs,hs,hz,hh,u,v);
   const eye=(u)=>{const a=A(u,.62),b=A(u+.14,.62),c=A(u+.14,.4),d=A(u,.4);return poly([a,b,c,d],'#1a0f08')};
   s+=eye(.22)+eye(.64);const m1=A(.38,.2),m2=A(.62,.2),m3=A(.62,.12),m4=A(.38,.12);s+=poly([m1,m2,m3,m4],'#a8503c');
   // barba/capelli sul bordo del volto
   const h1=A(0,1),h2=A(1,1),h3=A(1,.86),h4=A(0,.86);s+=poly([h1,h2,h3,h4],HAIR)}
  else{const A=face==='jp'?(u,v)=>faceL(hi2,hj,hs,hs,hz,hh,u,v):(u,v)=>faceR(hi2,hj,hs,hs,hz,hh,u,v);
   s+=poly([A(0,1),A(1,1),A(1,.35),A(0,.35)],HAIR)}
  // copricapo
  const T=av.t,zt=hz+hh;
  if(T===0){s+=box(hi2-.03,hj-.03,hs+.06,hs+.06,4*K,{t:mix(Hc[0],1.15),l:Hc[0],r:Hc[1]},zt)+box(hi2+.06,hj+.06,hs-.12,hs-.12,3*K,{t:mix(Hc[0],1.3),l:Hc[0],r:Hc[1]},zt+4*K)}
  else if(T===1){s+=box(hi2-.02,hj-.02,hs+.04,hs+.04,5*K,{t:'#ffe27a',l:'#e9b23a',r:'#a67d12'},zt);[[0,0],[.22,0],[0,.22],[.22,.22]].forEach(([a,b])=>s+=box(hi2+.0+a,hj+b,.1,.1,4*K,{t:'#fff0a0',l:'#e9b23a',r:'#a67d12'},zt+5*K))}
  else if(T===2){s+=box(hi2-.05,hj-.05,hs+.1,hs+.1,8*K,{t:mix(Hc[0],1.12),l:Hc[0],r:Hc[1]},zt-3*K)+box(hi2-.05,hj-.05,hs+.1,hs+.1,hh-3*K,{t:mix(Hc[1],1.2),l:Hc[1],r:mix(Hc[1],.6)},hz-1)}
  else if(T===3){s+=box(hi2-.04,hj-.04,hs+.08,hs+.08,8*K,{t:'#d8dfec',l:'#a9b2c4',r:'#6d7488'},zt-3*K)+box(hi2+.1,hj+.1,hs-.2,hs-.2,5*K,{t:Hc[0],l:Hc[0],r:Hc[1]},zt+5)}
  else if(T===4){s+=box(hi2-.02,hj-.02,hs+.04,hs+.04,4*K,{t:mix(HAIR,1.4),l:HAIR,r:mix(HAIR,.6)},zt)}
  else{s+=box(hi2-.12,hj-.12,hs+.24,hs+.24,2,{t:mix(Hc[1],1.2),l:Hc[1],r:mix(Hc[1],.6)},zt)+[[.06,5],[.1,5],[.14,5],[.17,4]].reduce((a,[ins,h],k)=>a+box(hi2+ins*0+.04*k+.02,hj+.04*k+.02,hs-.08*k-.04,hs-.08*k-.04,h,{t:mix(Hc[0],1.2),l:Hc[0],r:Hc[1]},zt+2+k*5),'')}
  return s}
 const seatPos=(slot,tI,tJ,tW,tD)=>{ // slot -> [i,j,face]
  const o=.62*K/1.3+.1,jm=[0,1,2].map(k=>[tI+tW*(k+.5)/3,tJ-o,'jm']),im=[0,1].map(k=>[tI-o,tJ+tD*(k+.5)/2,'im']),jp=[0,1,2].map(k=>[tI+tW*(k+.5)/3,tJ+tD+o,'jp']),ip=[0,1].map(k=>[tI+tW+o,tJ+tD*(k+.5)/2,'ip']);
  const order=[jm[1],im[0],jm[0],jm[2],im[1],jp[1],jp[0],jp[2],ip[0],ip[1]];return order[slot]};

 /* ---------- scena ---------- */
 function scene(S,selCat,avail){
  const N=S.length,TI=2.0,TJ=2.9,TWd=2.6,TDd=1.7;
  // tavolo centrale
  const cx=P(TI+TWd/2,TJ+TDd/2,0);
  const center=tableBox(TI,TJ,TWd,TDd,{t:'#9a7040',l:'#6a4a2a',r:'#4a3018'},
    (()=>{let it='';
     // assi del piano
     for(let k=1;k<4;k++){const a=P(TI+TWd*k/4,TJ,24),b=P(TI+TWd*k/4,TJ+TDd,24);it+=`<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#2a1a0c" stroke-opacity=".5" stroke-width=".8"/>`}
     it+=candle(TI+1.3,TJ+.85,24)+mug(TI+.4,TJ+.35,24)+mug(TI+2.1,TJ+1.3,24)+mug(TI+.8,TJ+1.35,24)+cardq(TI+1.9,TJ+.4,24,'#efe3c8',.4)+cardq(TI+2.15,TJ+.6,24,'#efe3c8',-.2)+dice(TI+.5,TJ+.9,24)+dice(TI+.72,TJ+1.05,24);return it})(),24);
  const items=[{k:TI+TWd/2+TJ+TDd/2,s:center}];
  const ord=S.map((x,idx)=>({x,idx}));
  const pl=[];
  ord.forEach(({x,idx})=>{const sp=seatPos(idx,TI,TJ,TWd,TDd);if(!sp)return;const av=avOf(x,idx);
   items.push({k:sp[0]+sp[1],s:person(sp[0],sp[1],sp[2],av,true)});
   const top=P(sp[0],sp[1],K*35+8+(av.t===5?24:av.t===3||av.t===1?8:5));
   pl.push({x,idx,px:top[0]/VW*100,py:top[1]/VH*100,me:x.dev===ME.dev})});
  Object.keys(CATS).forEach(id=>{const c=CATS[id];items.push({k:c.i+c.w/2+c.j+c.d/2,s:catSvg(id,avail[id]||0,selCat===id)})});
  items.sort((a,b)=>a.k-b.k);
  const glow=`<ellipse cx="${f1(P(4,2.2)[0])}" cy="${f1(P(4,2.2)[1])}" rx="200" ry="105" fill="url(#hf)" style="mix-blend-mode:screen" opacity=".55"/>`;
  let emb='';for(let k=0;k<20;k++){const c=P(4,.4,60);emb+=`<rect class="hh-em" x="${f1(c[0]+(rnd()-.5)*70)}" y="${f1(c[1]-rnd()*60)}" width="2" height="2" fill="${rnd()>.5?'#ffb347':'#ffe27a'}" style="animation-delay:-${(rnd()*4).toFixed(2)}s"/>`}
  const svg=`<svg class="hh-svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" role="img" aria-label="Sala della taverna con ${N} giocator${N===1?'e':'i'} seduti al tavolo grande, il camino acceso e quattro tavoli dei giochi: carte, da tavolo, cooperativi e solitari">${defs}${fixed}${items.map(x=>x.s).join('')}<g pointer-events="none">${glow}${emb}<rect width="${VW}" height="${VH}" fill="url(#hv)"/></g></svg>`;
  const tags=pl.map(p=>`<div class="hlp${p.me?' me':''}" style="left:${p.px.toFixed(2)}%;top:${p.py.toFixed(2)}%" ${p.me?`data-a="avedit" data-v="${p.x.k}" role="button" tabindex="0" aria-label="Personalizza ${esc(p.x.name)}"`:''}>${tvBub(p.x)}<div class="tvtag${p.me&&p.x.k==='m'?' me':''}${p.x.k!=='m'?' g':''}${N>=6?' sm':''}">${esc(p.x.name)}</div></div>`).join('');
  return{svg,tags}}
 return{scene}})();
function hallScene(S){
 const N=S.length,avail={};GAMES.forEach(g=>{if(g.ok(N)){const k=tvInfo(g)[0];avail[k]=(avail[k]||0)+1}});
 const sel=ui.cat&&ui.cat!=='tutti'?ui.cat:null;
 const{svg,tags}=HALL.scene(S,sel,avail);
 return`<div class="hall"><div class="tvplq" ${N===0?'hidden':''}>${R.on?`<span>STANZA</span><b>${esc(R.code||'…')}</b><button class="tvcp" data-a="copy">COPIA</button>`:`<span>SU QUESTO TELEFONO</span>`}</div>${svg}<div class="hlq">${tags}</div></div>`}
