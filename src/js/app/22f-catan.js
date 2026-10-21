/* ================= CATAN · glifi, colori e plancia 2D (SVG) ================= */
/* La plancia 2D serve al telefono (per toccare dove costruire) e alla TV quando manca WebGL. Le espansioni aggiungono i loro pezzi con CXB.push((s,C,cv)=>svg). */
const CPC=['#e8574a','#3a8fe6','#35b866','#f2c230','#b06be0','#e8742c','#2fc5c0','#e86bb0'];
const CTC={wood:'#2f7a3c',brick:'#bf5a30',wool:'#93cf5e',grain:'#e7c445',ore:'#8d92a3',desert:'#e3cf94',gold:'#e9b92e'};
const CKC={wood:'#2f7a3c',brick:'#bf5a30',wool:'#6fae3e',grain:'#c9a21f',ore:'#6c7184',cloth:'#a65bb8',coin:'#c9892a',paper:'#9b8d6c'};
const CRN={wood:'Legno',brick:'Argilla',wool:'Lana',grain:'Grano',ore:'Roccia',cloth:'Stoffa',coin:'Moneta',paper:'Carta'};
const CRG={wood:'<path d="M12 3l5 7h-3l4 6H6l4-6H7zM12 16v5"/>',brick:'<rect x="3" y="7" width="18" height="10"/><path d="M3 12h18M9 7v5M15 12v5"/>',
 wool:'<circle cx="8" cy="11" r="4"/><circle cx="14" cy="9" r="4"/><circle cx="16" cy="14" r="3"/><path d="M8 16v4M15 17v3"/>',
 grain:'<path d="M12 21V8M12 8C9 7 8 5 8 3c3 0 4 2 4 5zM12 8c3-1 4-3 4-5-3 0-4 2-4 5zM12 14c-3-1-4-3-4-5M12 14c3-1 4-3 4-5"/>',ore:'<path d="M2 19l7-12 4 7 3-4 6 9z"/>',road:'<path d="M7 21L10 3M17 21L14 3M12 5v3M12 11v3M12 17v3"/>',
 cloth:'<path d="M4 6c3-2 5 2 8 0s5-2 8 0v12c-3-2-5 2-8 0s-5-2-8 0zM4 12c3-2 5 2 8 0s5-2 8 0"/>',coin:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
 paper:'<path d="M6 4h10a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2zM9 8h6M9 12h6M9 16h4"/>',
 knight:'<path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6zM12 8v8M9 11h6"/>',wall:'<path d="M3 20V9h3V6h3v3h3V6h3v3h3V6h3v14zM9 20v-5h6v5"/>',
 ship:'<path d="M3 15h18l-3 5H6zM12 3v12M12 4l6 8h-6"/>',gate:'<path d="M4 21V9l3 2V6l5-3 5 3v5l3-2v12zM10 21v-5h4v5"/>',fish:'<path d="M3 12c4-6 10-6 14 0-4 6-10 6-14 0zM17 12l4-4v8zM8 11h.01"/>',
 boot:'<path d="M9 3h5v8l6 3v4H7V9z"/>',anchor:'<path d="M12 3v15M7 8h10M4 14c0 4 4 7 8 7s8-3 8-7"/>',nugget:'<path d="M5 17l3-7 4 3 3-6 5 10z"/>',
 scroll:'<path d="M6 4h11a2 2 0 0 1 2 2v2h-3M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M9 10h6M9 14h6"/>',
 sword:'<path d="M5 19L17 7M14 4h6v6M7 17l-3 3M9 15l-2-2"/>',skull:'<path d="M12 3a8 8 0 0 0-8 8c0 3 1.6 5 4 6v3h8v-3c2.4-1 4-3 4-6a8 8 0 0 0-8-8zM9 12h.01M15 12h.01"/>',
 tower:'<path d="M7 21V8l-2-1V3h4v2h2V3h4v2h2V3h2v4l-2 1v13zM10 21v-5h4v5"/>',barrel:'<path d="M7 4h10c2 3 2 13 0 16H7c-2-3-2-13 0-16zM6 9h12M6 15h12"/>',
 camel:'<path d="M4 20V10c2-1 3 1 3 3 1-4 3-4 4-1 1-3 3-3 4 0l2-5h3v5l-2 2v6M8 20v-3M16 20v-3"/>',bridge:'<path d="M3 17c4-8 14-8 18 0M3 17v3M21 17v3M7 12v8M17 12v8M12 10v10"/>',
 harbor:'<path d="M12 3v13M8 7h8M5 13c0 4 3 7 7 7s7-3 7-7M3 21h18"/>',flag:'<path d="M6 21V4M6 5h11l-3 4 3 4H6"/>'};
const resI=(k,sz)=>`<svg class="rgl ${k}" viewBox="0 0 24 24" width="${sz||20}" height="${sz||20}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${CRG[k]||''}</svg>`;
const CDV={knight:['Cavaliere'],rb:['Costruzione strade'],yop:['Invenzione'],mono:['Monopolio'],vp:['Punto vittoria']};
const CS=38;let cGeo=null;const cV=v=>[cGeo.V[v].x*CS,cGeo.V[v].y*CS];
const cRes=(o,cls)=>Object.keys(o).filter(k=>o[k]>0).map(k=>`<span class="cri ${cls||''}">${o[k]}${resI(k,16)}</span>`).join('')||'—';
const CXB=[];
const cHexPts=(H)=>H.v.map(v=>cV(v).join(',')).join(' ');
function cBox(C){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;C.V.forEach(v=>{x0=Math.min(x0,v.x);x1=Math.max(x1,v.x);y0=Math.min(y0,v.y);y1=Math.max(y1,v.y)});const m=1.15;return[(x0-m)*CS,(y0-m)*CS,(x1-x0+2*m)*CS,(y1-y0+2*m)*CS]}
/* tg = bersagli toccabili {k:'v'|'e'|'h', l:[ids], on?:[ids già scelti]}; o.mini = versione ridotta */
function boardH(s,tg,o){o=o||{};const C=Object.assign({},CATAN,CATAN.geo(s));cGeo=C;let g='';const L=CATAN.landH;
 s.hexes.forEach((x,i)=>{const H=C.HX[i],cx=H.x*CS,cy=H.y*CS,pts=cHexPts(H);
  if(x.fog){g+=`<polygon class="chx fog" points="${pts}"/><text class="cfq" x="${cx}" y="${cy+9}" text-anchor="middle">?</text>`;return}
  if(x.t==='sea'){g+=`<polygon class="chx sea" points="${pts}"/>`;return}
  const hot=s.dice&&x.num&&s.dice[0]+s.dice[1]===x.num,gl=x.t==='gold'?'nugget':x.t;
  g+=`<polygon class="chx" points="${pts}" fill="${CTC[x.t]||'#999'}"/><g class="cgl" transform="translate(${cx-9},${cy-(x.num?27:11)}) scale(.75)" fill="none" stroke="#10130c" stroke-opacity=".55" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${CRG[gl]||''}</g>`;
  if(x.num){const pp=C.pips(x.num);g+=`<g class="ctok ${hot?'hot':''}"><circle cx="${cx}" cy="${cy+7}" r="13"/><text x="${cx}" y="${cy+11}" text-anchor="middle" class="${x.num===6||x.num===8?'red':''}">${x.num}</text>${Array.from({length:pp},(_,k)=>`<circle class="pp" cx="${cx-(pp-1)*1.7+k*3.4}" cy="${cy+16.5}" r=".9"/>`).join('')}</g>`}});
 s.ports.forEach(pt=>{const E=C.E[pt.e],[a,b]=[E.a,E.b].map(cV),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;let ox,oy;
  if(E.h.length===1){const H=C.HX[E.h[0]];ox=mx-H.x*CS;oy=my-H.y*CS}else{const sh=E.h.find(i=>!L(s,i)),lh=E.h.find(i=>i!==sh);const A=C.HX[sh!=null?sh:E.h[0]],B=C.HX[lh!=null?lh:E.h[1]];ox=(A.x-B.x)*CS;oy=(A.y-B.y)*CS}
  const d=Math.hypot(ox,oy)||1,px=mx+ox/d*22,py=my+oy/d*22;
  g+=`<g class="cport"><line x1="${a[0]}" y1="${a[1]}" x2="${px}" y2="${py}"/><line x1="${b[0]}" y1="${b[1]}" x2="${px}" y2="${py}"/><circle cx="${px}" cy="${py}" r="12"/>${pt.k==='any'?`<g transform="translate(${px-6},${py-11}) scale(.5)" fill="none" stroke="#1d160a" stroke-width="2.4">${CRG.anchor}</g>`:`<g transform="translate(${px-6},${py-11}) scale(.5)" fill="none" stroke="${CKC[pt.k]}" stroke-width="2.6">${CRG[pt.k]}</g>`}<text x="${px}" y="${py+8.5}" text-anchor="middle">${pt.k==='any'?'3:1':'2:1'}</text></g>`});
 for(const e in s.roads){const[a,b]=[C.E[e].a,C.E[e].b].map(cV);g+=`<line class="crd0" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><line class="crd" stroke="${CPC[s.roads[e]]}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`}
 for(const e in (s.ships||{})){const[a,b]=[C.E[e].a,C.E[e].b].map(cV),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,an=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
  g+=`<line class="csl" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><g transform="translate(${mx},${my}) rotate(${an})"><path class="csh" fill="${CPC[s.ships[e]]}" d="M-10,-2 L10,-2 L7,4 L-7,4Z"/><path class="csh" fill="${CPC[s.ships[e]]}" d="M-1,-3 L-1,-11 L7,-3Z"/></g>`}
 if(tg&&tg.k==='e')tg.l.forEach(e=>{const[a,b]=[C.E[e].a,C.E[e].b].map(cV);g+=`<line class="cte${tg.on&&tg.on.includes(e)?' on':''}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><line class="cth" data-a="ctg" data-v="e:${e}" role="button" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`});
 for(const v in s.bld){const b=s.bld[v],[x,y]=cV(v),r=7.5,f=CPC[b.p];
  if(s.wall&&s.wall[v])g+=`<circle class="cwall" cx="${x}" cy="${y-2}" r="12.5"/>`;
  g+=b.k===1?`<path class="cbd" fill="${f}" d="M${x-r},${y+r*.8} L${x-r},${y-r*.2} L${x},${y-r*1.3} L${x+r},${y-r*.2} L${x+r},${y+r*.8}Z"/>`
   :`<path class="cbd" fill="${f}" d="M${x-r*1.5},${y+r*.9} L${x-r*1.5},${y-r*.3} L${x-r*.3},${y-r*.3} L${x-r*.3},${y-r*1.3} L${x+r*.3},${y-r*1.9} L${x+r*.9},${y-r*1.3} L${x+r*.9},${y-r*.3} L${x+r*1.5},${y-r*.3} L${x+r*1.5},${y+r*.9}Z"/>`}
 CXB.forEach(f=>{g+=f(s,C,o)||''});
 if(s.robber!=null&&!s.robOff){const H=C.HX[s.robber],x=H.x*CS-15,y=H.y*CS+9;g+=`<g class="crob"><path d="M${x-7},${y+9} Q${x-7},${y-1} ${x},${y-3} Q${x+7},${y-1} ${x+7},${y+9}Z"/><circle cx="${x}" cy="${y-8}" r="5"/></g>`}
 if(s.pirate!=null){const H=C.HX[s.pirate],x=H.x*CS,y=H.y*CS;g+=`<g class="cpir" transform="translate(${x},${y})"><path d="M-12,2 L12,2 L8,9 L-8,9Z"/><path d="M0,2 L0,-12 L10,-2Z"/><circle cx="0" cy="-13" r="2.2"/></g>`}
 if(tg&&tg.k==='v')tg.l.forEach(v=>{const[x,y]=cV(v);g+=`<circle class="ctv${tg.on&&tg.on.includes(v)?' on':''}" data-a="ctg" data-v="v:${v}" role="button" cx="${x}" cy="${y}" r="11"/>`});
 if(tg&&tg.k==='h')tg.l.forEach(i=>{g+=`<polygon class="cth2${tg.on&&tg.on.includes(i)?' on':''}" data-a="ctg" data-v="h:${i}" role="button" points="${cHexPts(C.HX[i])}"/>`});
 return`<svg class="cboard ${o.mini?'mini':''}" viewBox="${cBox(C).join(' ')}" role="img" aria-label="Plancia">${g}</svg>`}
