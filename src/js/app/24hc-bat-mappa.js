/* ---- Mappa della battaglia (Cantari di Ventura, A5.3): arena a esagoni in SVG, segnalini, evidenziazioni, zoom e scorrimento. ----
   Disegna soltanto: i comandi sono di ACOM (motori/27l), il flusso di Bat (24he). Esagoni a punta in alto come in campagna, schiacciati in verticale (SQ)
   per una vista leggermente inclinata; rialzi, muri e ostacoli hanno uno spessore disegnato. Il tocco si risolve con la matematica dell'esagono. */
const BatMappa={
 Z:26,SQ:.84,
 // colori per ambiente dell'arena: f/g = pavimento a scacchi, r = rialzo, m/ml/md = muro (cima, lato, lato in ombra), o = ostacoli, bg = fuori dall'arena
 PAL:{pianura:{f:'#86a554',g:'#7b9a4b',r:'#a3bb6e',m:'#8c8a86',ml:'#6c6a66',md:'#55534f',o:'#9a8e78',bg:'#1d2614'},
  strada:{f:'#c2a672',g:'#b79b68',r:'#d6bf8a',m:'#8c8a86',ml:'#6c6a66',md:'#55534f',o:'#9a8e78',bg:'#2a2214'},
  bosco:{f:'#4a8a4c',g:'#427d44',r:'#62a064',m:'#6c6a66',ml:'#55534f',md:'#403e3a',o:'#7a7468',bg:'#12231a'},
  collina:{f:'#b09c62',g:'#a49058',r:'#c8b87c',m:'#8c8a86',ml:'#6c6a66',md:'#55534f',o:'#8a8070',bg:'#26200f'},
  palude:{f:'#5f8268',g:'#567860',r:'#7a9c82',m:'#6a6a64',ml:'#52524c',md:'#3c3c38',o:'#6e6a58',bg:'#10201a'},
  citta:{f:'#9a958a',g:'#8d887d',r:'#b3ad9f',m:'#a6603f',ml:'#84492d',md:'#693822',o:'#8a6a44',bg:'#1c1a18'},
  antro:{f:'#5b5249',g:'#524a42',r:'#74685c',m:'#6e665c',ml:'#544e46',md:'#3e3a34',o:'#6e6458',bg:'#0e0c0a'},
  torre:{f:'#585270',g:'#4f4a66',r:'#6f688c',m:'#6e688c',ml:'#544f6e',md:'#3e3a52',o:'#6e688c',bg:'#0d0b16'}},
 SUP:{fuoco:['rgba(232,116,42,.5)','fuoco'],veleno:['rgba(111,174,58,.5)','teschio'],ghiaccio:['rgba(160,215,245,.55)','scintilla'],acqua:['rgba(70,130,200,.5)','g_palude']},
 TINTE:{passo:['rgba(86,190,230,.26)','rgba(130,215,245,.85)'],percorso:['rgba(86,200,240,.5)','rgba(160,225,250,.9)'],meta:['rgba(240,193,102,.5)','#f3d37a'],
  centro:['rgba(240,193,102,.18)','#f3d37a'],'centro-scelto':['rgba(240,193,102,.5)','#fff1b8'],area:['rgba(235,120,40,.42)','rgba(250,160,70,.95)'],direzione:['rgba(240,193,102,.4)','#f3d37a']},
 // ---- geometria ----
 W(){return BatMappa.Z*Math.sqrt(3)},
 xy(q,r){return[BatMappa.W()*(q+r/2),BatMappa.Z*1.5*BatMappa.SQ*r]},
 // arrotondamento cubico: coordinate frazionarie → esagono
 tondo(q,r){const x=q,z=r,y=-x-z;let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z);
  if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;return{q:rx|0,r:rz|0}},
 // punto del mondo → esagono (l'inverso di xy)
 cellaDa(x,y){const Z=BatMappa.Z,yy=y/BatMappa.SQ;return BatMappa.tondo((Math.sqrt(3)/3*x-yy/3)/Z,(2/3*yy)/Z)},
 vert(cx,cy,z){const p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);p.push([cx+z*Math.cos(a),cy+z*Math.sin(a)*BatMappa.SQ])}return p},
 punti(cx,cy,z){return BatMappa.vert(cx,cy,z).map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')},
 // riquadro del mondo che contiene tutta l'arena (con il margine per i segnalini in alto)
 riquadro(A){const w=BatMappa.W(),Z=BatMappa.Z,S=BatMappa.SQ,x0=-w/2-6,x1=w*(A.w-1+.5)+w/2+6,y0=-Z*S-26,y1=Z*1.5*S*(A.h-1)+Z*S+14;return{x:x0,y:y0,w:x1-x0,h:y1-y0}},
 // vista (zoom k, centro) → viewBox
 viewBox(A,v){const R=BatMappa.riquadro(A),k=Math.max(1,Math.min(3,v&&v.k||1)),cx=v&&v.cx!=null?v.cx:R.x+R.w/2,cy=v&&v.cy!=null?v.cy:R.y+R.h/2,w=R.w/k,h=R.h/k;
  return`${(cx-w/2).toFixed(1)} ${(cy-h/2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`},
 // ---- pezzi del disegno ----
 // prisma (rialzo, muro, colonna): la faccia superiore è alzata di H, le due facce davanti scendono fino al suolo
 prisma(cx,cy,z,H,top,lato,ombra){const v=BatMappa.vert(cx,cy,z),f=n=>n.toFixed(1);
  const l1=`M${f(v[1][0])},${f(v[1][1]-H)}L${f(v[1][0])},${f(v[1][1])}L${f(v[2][0])},${f(v[2][1])}L${f(v[2][0])},${f(v[2][1]-H)}Z`,
   l2=`M${f(v[2][0])},${f(v[2][1]-H)}L${f(v[2][0])},${f(v[2][1])}L${f(v[3][0])},${f(v[3][1])}L${f(v[3][0])},${f(v[3][1]-H)}Z`;
  return`<path d="${l1}" fill="${lato}"/><path d="${l2}" fill="${ombra}"/><polygon points="${BatMappa.punti(cx,cy-H,z)}" fill="${top}"/>`},
 alto(P,amb,cx,cy){
  if(['citta','antro','torre'].includes(amb))return BatMappa.prisma(cx,cy,BatMappa.Z*.55,22,P.m,P.ml,P.md);
  if(amb==='collina')return`<path d="M${cx-13},${cy+5}L${cx-8},${cy-17}L${cx+2},${cy-24}L${cx+12},${cy-12}L${cx+14},${cy+5}Z" fill="${P.o}" stroke="rgba(0,0,0,.4)" stroke-width="1"/><path d="M${cx+2},${cy-24}L${cx+12},${cy-12}L${cx+14},${cy+5}L${cx+3},${cy+5}Z" fill="rgba(0,0,0,.22)"/>`;
  if(amb==='palude')return`<path d="M${cx-2},${cy+5}L${cx-2},${cy-18}M${cx-2},${cy-10}L${cx-10},${cy-18}M${cx-2},${cy-14}L${cx+7},${cy-23}" stroke="#4a3a28" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  return`<rect x="${cx-3}" y="${cy-12}" width="6" height="17" rx="1" fill="#5a3a1c"/><circle cx="${cx}" cy="${cy-19}" r="13" fill="#2f6b34"/><circle cx="${cx+5}" cy="${cy-24}" r="8" fill="#3f8a45"/><circle cx="${cx-6}" cy="${cy-16}" r="6" fill="#276028"/>`},
 basso(P,amb,cx,cy){
  if(['citta','antro','torre'].includes(amb))return BatMappa.prisma(cx,cy,BatMappa.Z*.62,9,P.o,'rgba(0,0,0,.35)','rgba(0,0,0,.5)')+`<path d="M${cx-6},${cy-9}L${cx+6},${cy-9}M${cx},${cy-13}L${cx},${cy-5}" stroke="rgba(0,0,0,.3)" stroke-width="1.4"/>`;
  return`<ellipse cx="${cx}" cy="${cy+3}" rx="12" ry="7" fill="rgba(0,0,0,.3)"/><path d="M${cx-11},${cy+3}Q${cx-9},${cy-9} ${cx},${cy-9}Q${cx+10},${cy-8} ${cx+11},${cy+3}Z" fill="${P.o}" stroke="rgba(0,0,0,.4)" stroke-width="1"/><path d="M${cx-5},${cy-6}q4-3 8 0" stroke="rgba(255,255,255,.35)" stroke-width="1.6" fill="none"/>`},
 // ---- l'arena intera ----
 svg(s,o){o=o||{};const A=s.arena,P=BatMappa.PAL[A.ambiente]||BatMappa.PAL.pianura,R=BatMappa.riquadro(A),Z=BatMappa.Z,esci=new Set((A.uscite||[]).map(c=>c.q+','+c.r));
  const cel=new Map(),tag=new Map(),att=ASCO.attore(s);
  for(const x of (o.ev&&o.ev.celle)||[]){const k=x.q+','+x.r;if(!cel.has(k))cel.set(k,[]);cel.get(k).push(x)}
  for(const x of (o.ev&&o.ev.creature)||[]){if(!tag.has(x.id))tag.set(x.id,[]);tag.get(x.id).push(x)}
  const inCampo=s.cb.filter(c=>ASCO.inCampo(c)&&c.q!=null&&c.r!=null).sort((a,b)=>a.r-b.r||a.q-b.q);
  let g='';
  for(let r=0;r<A.h;r++){
   for(let col=0;col<A.w;col++){const q=col-Math.floor(r/2),[cx,cy]=BatMappa.xy(q,r),ch=A.righe[r][col],sp=A.sup?A.sup[r][col]:'.',amb=A.ambiente,k=q+','+r;let h='';
    const tipo=(col+r)&1?P.g:P.f,alz=ch==='^'?6:0;
    if(ch==='#'){h+=`<polygon points="${BatMappa.punti(cx,cy,Z-1)}" fill="${P.md}"/>`+BatMappa.prisma(cx,cy,Z-1,18,P.m,P.ml,P.md)}
    else{h+=`<polygon points="${BatMappa.punti(cx,cy,Z-1)}" fill="${ch==='^'?P.g:tipo}" stroke="rgba(0,0,0,.28)" stroke-width="1"/>`;
     if(ch===',')h+=`<polygon points="${BatMappa.punti(cx,cy,Z-1)}" fill="url(#bt-tratti)"/>`;
     if(ch==='^')h+=BatMappa.prisma(cx,cy,Z-1.5,alz,P.r,'rgba(0,0,0,.28)','rgba(0,0,0,.45)');
     if(sp!=='.'&&A.sup){const S=BatMappa.SUP[({f:'fuoco',v:'veleno',g:'ghiaccio',w:'acqua'})[sp]];if(S)h+=`<polygon points="${BatMappa.punti(cx,cy-alz,Z-2)}" fill="${S[0]}"/>`+glifo(S[1],cx,cy-alz,14,'rgba(255,255,255,.85)',1)}
     if(esci.has(k))h+=`<polygon points="${BatMappa.punti(cx,cy-alz,Z-3)}" fill="none" stroke="#f3d37a" stroke-width="2" stroke-dasharray="4 3"/>`+glifo('freccia',cx,cy-alz,12,'#f3d37a',.9);
     for(const x of cel.get(k)||[])h+=BatMappa.evidenza(x,cx,cy-alz);
     if(ch==='T')h+=BatMappa.alto(P,amb,cx,cy);else if(ch==='o')h+=BatMappa.basso(P,amb,cx,cy)}
    g+=h}
   for(const c of inCampo)if(c.r===r)g+=BatMappa.segnalino(s,c,o,tag.get(c.id)||[],att)}
  let extra='';
  if(o.ev&&o.ev.linea){const L=o.ev.linea,[x0,y0]=BatMappa.xy(L.da.q,L.da.r),[x1,y1]=BatMappa.xy(L.a.q,L.a.r),col=L.visibile?(L.cop==='nessuna'?'#f3d37a':'#e8a23a'):'#e0604a';
   extra+=`<line x1="${x0.toFixed(1)}" y1="${(y0-8).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(y1-8).toFixed(1)}" stroke="${col}" stroke-width="2.4" stroke-dasharray="5 4" pointer-events="none"/>`;
   if(L.cop&&L.cop!=='nessuna'&&L.visibile)extra+=glifo('scudo',(x0+x1)/2,(y0+y1)/2-8,14,'#fff',1)}
  return`<svg class="bt-svg" viewBox="${BatMappa.viewBox(A,o.vista)}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Campo di battaglia"><defs><pattern id="bt-tratti" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="9" stroke="rgba(0,0,0,.3)" stroke-width="2.2"/></pattern></defs>`
   +`<rect x="${R.x-200}" y="${R.y-200}" width="${R.w+400}" height="${R.h+400}" fill="${P.bg}"/><g class="bt-mondo">${g}${extra}</g><g class="bt-fx" pointer-events="none"></g></svg>`},
 // un'evidenziazione su un esagono
 evidenza(x,cx,cy){const T=BatMappa.TINTE[x.tipo];if(!T)return'';const Z=BatMappa.Z,pt=BatMappa.punti(cx,cy,Z-2);
  if(x.tipo==='direzione'){const a=[0,-60,-120,180,120,60][x.dir]||0;return`<g transform="translate(${cx} ${cy}) rotate(${a})"><polygon points="${BatMappa.punti(0,0,Z-4)}" fill="${T[0]}" stroke="${T[1]}" stroke-width="1.6" transform="rotate(${-a})"/><path d="M-7 0H8M2-6l6 6-6 6" fill="none" stroke="#fff1b8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`}
  const tratto=x.tipo==='centro'?' stroke-dasharray="5 3"':'',sp=x.tipo==='meta'||x.tipo==='centro-scelto'?3:1.6;
  let h=`<polygon points="${pt}" fill="${T[0]}" stroke="${T[1]}" stroke-width="${sp}"${tratto} class="bt-ev bt-${x.tipo}"/>`;
  if((x.tipo==='passo'||x.tipo==='meta')&&x.costo>0)h+=`<text class="bt-costo${x.tipo==='meta'?' gr':''}" x="${(cx+Z*.46).toFixed(1)}" y="${(cy+Z*.42).toFixed(1)}" text-anchor="middle">${x.costo}</text>`;
  if(x.tipo==='percorso')h+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="#e8fbff"/>`;
  return h},
 // un segnalino: eroe tondo con il ritratto, mostro a distintivo; barra dei PF, stati, anello dell'evidenziazione
 segnalino(s,c,o,tag,att){const [x,y]=BatMappa.xy(c.q,c.r),alz=AGRI.alt(s.arena,c)?6:0,eroe=c.lato==='eroi',capo=!eroe&&BEST.M[c.def]&&BEST.M[c.def].capo,r=capo?18:15,giu=c.hp<=0,pct=Math.max(0,Math.min(1,c.hp/c.hpMax));
  const nasc=(c.stati||[]).some(z=>z.id==='nascosto'),attivo=att&&att.id===c.id,tipi=tag.map(t=>t.tipo),cl=['bt-tok',eroe?'bt-eroe':'bt-nem'];
  if(giu)cl.push('ko');if(attivo)cl.push('attivo');if(nasc)cl.push('nasc');for(const t of new Set(tipi))cl.push('t-'+t);
  let corpo;
  if(eroe){const asp=(o.aspetti||{})[c.id],px=r*2-4,rit=Eroi.ritratto(asp,c.razza,c.classe,px).replace('<svg class="rit" viewBox="0 0 100 100"',`<svg class="rit" x="${-px/2}" y="${-px/2}" viewBox="0 0 100 100"`);
   corpo=`<circle r="${r}" fill="#2a1d10" stroke="${giu?'#6a5a4a':'#e0b04a'}" stroke-width="2.6"/>${rit}`+(giu?`<path d="M-8-8L8 8M8-8L-8 8" stroke="#e8e0d0" stroke-width="3.4" stroke-linecap="round"/>`:'')}
  else corpo=Sagome.segnalino(c,r);
  const barra=giu?'':`<rect x="-14" y="${r+3}" width="28" height="5" rx="1.5" fill="rgba(0,0,0,.65)"/><rect class="bt-hpf" x="-13" y="${r+4}" width="${(26*pct).toFixed(1)}" height="3" rx="1" fill="${pct>.5?'#5fbf6a':pct>.25?'#e8b43a':'#d9503f'}"/>`;
  const st=(c.stati||[]).map(z=>z.id).filter(id=>id!=='terra'&&BatMappa.statoIco(id)).slice(0,3);
  const ico=st.map((id,i)=>{const [n,col]=Sagome.STATO[id],px=(i-(st.length-1)/2)*13;return`<circle cx="${px}" cy="${-r-5}" r="6" fill="${col}" stroke="#1a1208" stroke-width="1.2"/>`+glifo(n,px,-r-5,8,'#1a1208',1)}).join('');
  const pc=tag.find(t=>t.pc!=null),lab=pc?`<g class="bt-pc"><rect x="-17" y="${-r-22}" width="34" height="15" rx="3" fill="#2a0d08" stroke="#f3d37a" stroke-width="1.2"/><text y="${-r-11}" text-anchor="middle">${Math.round(pc.pc*100)}%</text></g>`:'';
  const nome=ACRO.nome(s,c.id);
  return`<g class="${cl.join(' ')}" data-id="${esc(c.id)}" data-x="${x.toFixed(1)}" data-y="${(y-alz).toFixed(1)}" data-hp="${c.hp}" data-max="${c.hpMax}" transform="translate(${x.toFixed(1)} ${(y-alz).toFixed(1)})" role="img" aria-label="${esc(nome)}, ${c.hp} su ${c.hpMax} PF${giu?', a terra':''}">`
   +`<ellipse cy="${r-2}" rx="${r-1}" ry="5" fill="rgba(0,0,0,.4)"/><circle class="bt-anello" r="${r+5}" fill="none"/><circle class="bt-alone" r="${r+3}" fill="none"/>`
   +`<g class="bt-corpo">${corpo}</g>${barra}${ico}${lab}</g>`},
 statoIco(id){return!!Sagome.STATO[id]},
 // la posizione di un segnalino nel mondo (per le animazioni)
 posiz(s,c){const [x,y]=BatMappa.xy(c.q,c.r);return{x,y:y-(AGRI.alt(s.arena,c)?6:0)}},
 // ---- zoom e scorrimento ----
 // `Bat.v` = { k, cx, cy } (cx, cy = centro nel mondo, null = centro dell'arena). Un solo gruppo di ascoltatori sul documento: la mappa si ridisegna a ogni stato.
 _g:new Map(),_pan:false,_ultimo:{t:0,q:null,r:null},
 pt(svg,x,y){const m=svg.getScreenCTM();if(!m)return null;const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(m.inverse())},
 applica(svg){const A=Bat.s&&Bat.s.arena;if(svg&&A)svg.setAttribute('viewBox',BatMappa.viewBox(A,Bat.v))},
 limita(){const A=Bat.s.arena,R=BatMappa.riquadro(A),v=Bat.v;v.k=Math.max(1,Math.min(3,v.k||1));
  if(v.k<=1.001){v.cx=null;v.cy=null;return}const cx=v.cx!=null?v.cx:R.x+R.w/2,cy=v.cy!=null?v.cy:R.y+R.h/2;v.cx=Math.max(R.x,Math.min(R.x+R.w,cx));v.cy=Math.max(R.y,Math.min(R.y+R.h,cy))},
 centro(){const A=Bat.s.arena,R=BatMappa.riquadro(A),v=Bat.v;return{x:v.cx!=null?v.cx:R.x+R.w/2,y:v.cy!=null?v.cy:R.y+R.h/2}},
 zoom(svg,f,px,py){const v=Bat.v,c0=BatMappa.centro(),k0=v.k||1,k1=Math.max(1,Math.min(3,k0*f));if(k1===k0)return;
  // il punto sotto il dito resta fermo: nuovo centro = punto + (centro − punto) · k0/k1
  const p=px!=null?{x:px,y:py}:c0;v.k=k1;v.cx=p.x+(c0.x-p.x)*k0/k1;v.cy=p.y+(c0.y-p.y)*k0/k1;BatMappa.limita();BatMappa.applica(svg)},
 centra(svg,x,y,k){const v=Bat.v;if(k)v.k=k;v.cx=x;v.cy=y;BatMappa.limita();BatMappa.applica(svg)},
 avvia(){if(BatMappa._on)return;BatMappa._on=true;
  const trova=e=>e.target&&e.target.closest?e.target.closest('.bt-svg'):null;
  document.addEventListener('pointerdown',e=>{const svg=trova(e);if(!svg||!Bat.s)return;BatMappa._g.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t0:performance.now(),svg});
   if(BatMappa._g.size===1)BatMappa._pan=false;if(BatMappa._g.size===2){BatMappa._pan=true;const [a,b]=[...BatMappa._g.values()];BatMappa._d0=Math.hypot(a.x-b.x,a.y-b.y)||1;BatMappa._k0=Bat.v.k||1}},{passive:true});
  document.addEventListener('pointermove',e=>{const g=BatMappa._g.get(e.pointerId);if(!g||!Bat.s)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;g.x=e.clientX;g.y=e.clientY;
   if(BatMappa._g.size>=2){const [a,b]=[...BatMappa._g.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,p=BatMappa.pt(g.svg,mx,my);
    if(p){const f=(BatMappa._k0*d/BatMappa._d0)/(Bat.v.k||1);BatMappa.zoom(g.svg,f,p.x,p.y)}return}
   if(!BatMappa._pan&&Math.hypot(e.clientX-g.x0,e.clientY-g.y0)<8)return;BatMappa._pan=true;
   const m=g.svg.getScreenCTM();if(!m||(Bat.v.k||1)<=1.001)return;const c=BatMappa.centro();Bat.v.cx=c.x-dx/m.a;Bat.v.cy=c.y-dy/m.d;BatMappa.limita();BatMappa.applica(g.svg)},{passive:true});
  const fine=e=>{const g=BatMappa._g.get(e.pointerId);if(!g)return;BatMappa._g.delete(e.pointerId);
   if(e.type==='pointerup'&&!BatMappa._pan&&BatMappa._g.size===0&&performance.now()-g.t0<700&&Bat.s){const p=BatMappa.pt(g.svg,e.clientX,e.clientY);if(p)BatMappa.tocco(BatMappa.cellaDa(p.x,p.y))}
   if(BatMappa._g.size===0)setTimeout(()=>{BatMappa._pan=false},0)};
  document.addEventListener('pointerup',fine,{passive:true});document.addEventListener('pointercancel',fine,{passive:true});
  document.addEventListener('wheel',e=>{const svg=trova(e);if(!svg||!Bat.s)return;e.preventDefault();const p=BatMappa.pt(svg,e.clientX,e.clientY);BatMappa.zoom(svg,e.deltaY<0?1.2:1/1.2,p&&p.x,p&&p.y)},{passive:false})},
 // un tocco su un esagono (il secondo di due tocchi molto ravvicinati è un rimbalzo e non conferma nulla)
 tocco(c){const A=Bat.s.arena,t=performance.now(),u=BatMappa._ultimo;if(!AGRI.dentro(A,c))return Bat.tocca(null);
  if(u.q===c.q&&u.r===c.r&&t-u.t<320)return;BatMappa._ultimo={t,q:c.q,r:c.r};Bat.tocca(c)}
};
BatMappa.avvia();
