/* ---- Mappa del mondo (Cantari di Ventura, A6.5): la mappa grande della campagna, scorrevole e ingrandibile, con nebbia, segnalini degli eroi, mostri visibili e mercanti. ----
   Si disegna da `Camp.s` (stato v3, motori/28-campagna.js) e da `Camp.u` (eroe scelto, destinazione) e `Camp.v` (zoom e centro). I gesti (trascina, pizzica, rotella, tocco)
   seguono quelli della battaglia (24hc-bat-mappa.js): un solo gruppo di ascoltatori sul documento, la mappa si ridisegna a ogni stato, mentre scorrere cambia solo il viewBox.
   Prefisso css: mo- (css/39-campagna.css). I tocchi arrivano a `Camp.tocca(cella)`; qui non si decide nulla. */
const MoMappa={
 SZ:26,KMIN:1,KMAX:4,KNOMI:1.8,
 COL:{pianura:'#86a554',strada:'#c2a672',bosco:'#3f7a43',collina:'#a8955a',palude:'#5d7a62',montagna:'#7d7d8c',acqua:'#3a6ea5'},
 GLI:{bosco:'g_bosco',collina:'g_collina',palude:'g_palude',montagna:'g_montagna',acqua:'g_acqua'},
 ICO:{citta:'p_citta',villaggio:'p_villaggio',santuario:'p_santuario',campo:'p_campo',antro:'p_antro',rovina:'p_rovina',torre:'p_torre',tesoro:'p_tesoro'},
 FAM:{banditi:['pugnale','#c26a3c'],bestie:['m_bestia','#8aa63a'],nonmorti:['teschio','#9a86d0'],torre:['corona','#d05a8a']},
 xy(q,r){return[MoMappa.SZ*Math.sqrt(3)*(q+r/2),MoMappa.SZ*1.5*r]},
 hex(cx,cy,z){const p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);p.push((cx+z*Math.cos(a)).toFixed(1)+','+(cy+z*Math.sin(a)).toFixed(1))}return p.join(' ')},
 // dal punto del mondo all'esagono (coordinate assiali arrotondate)
 cellaDa(x,y){const S=MoMappa.SZ,fq=(Math.sqrt(3)/3*x-y/3)/S,fr=(2/3*y)/S;let q=Math.round(fq),r=Math.round(fr);const fs=-fq-fr,s=Math.round(fs),dq=Math.abs(q-fq),dr=Math.abs(r-fr),ds=Math.abs(s+fq+fr);
  if(dq>dr&&dq>ds)q=-r-s;else if(dr>ds)r=-q-s;return{q,r}},
 // il rettangolo che contiene tutta la mappa (calcolato una volta per raggio)
 riquadro(s){if(MoMappa._R&&MoMappa._Rk===s.raggio)return MoMappa._R;let a=1e9,b=1e9,c=-1e9,d=-1e9;
  for(const x of Object.values(s.celle)){const[px,py]=MoMappa.xy(x.q,x.r);a=Math.min(a,px);c=Math.max(c,px);b=Math.min(b,py);d=Math.max(d,py)}
  const m=MoMappa.SZ*1.2;MoMappa._Rk=s.raggio;return(MoMappa._R={x:a-m,y:b-m,w:c-a+2*m,h:d-b+2*m})},
 // ---- vista: Camp.v = { k, cx, cy } (cx, cy nulli = segui l'eroe scelto) ----
 centro(s){const v=Camp.v;if(v.cx!=null)return{x:v.cx,y:v.cy};const e=s.eroi[Camp.eroeSel(s)]||s.eroi[0],[x,y]=MoMappa.xy(e.q,e.r);return{x,y}},
 limita(s){const R=MoMappa.riquadro(s),v=Camp.v;v.k=Math.max(MoMappa.KMIN,Math.min(MoMappa.KMAX,v.k||2.2));if(v.cx==null)return;v.cx=Math.max(R.x,Math.min(R.x+R.w,v.cx));v.cy=Math.max(R.y,Math.min(R.y+R.h,v.cy))},
 viewBox(s,svg){const R=MoMappa.riquadro(s),k=Camp.v.k,W=R.w/k,w=svg&&svg.clientWidth||390,h=svg&&svg.clientHeight||560,H=W*h/w,c=MoMappa.centro(s);return[c.x-W/2,c.y-H/2,W,H].map(n=>n.toFixed(1)).join(' ')},
 applica(svg){const s=Camp.s;if(!svg||!s)return;svg.setAttribute('viewBox',MoMappa.viewBox(s,svg));svg.classList.toggle('zn',Camp.v.k>=MoMappa.KNOMI)},
 zoom(svg,f,px,py){const s=Camp.s,v=Camp.v,c0=MoMappa.centro(s),k0=v.k,k1=Math.max(MoMappa.KMIN,Math.min(MoMappa.KMAX,k0*f));if(k1===k0)return;
  const p=px!=null?{x:px,y:py}:c0;v.k=k1;v.cx=p.x+(c0.x-p.x)*k0/k1;v.cy=p.y+(c0.y-p.y)*k0/k1;MoMappa.limita(s);MoMappa.applica(svg)},
 // ---- disegno ----
 token(e,i,n,k,sel){const[R,off]=n===1?[10,[[0,0]]]:n===2?[8.5,[[-7,0],[7,0]]]:n===3?[7.5,[[-7,-5],[7,-5],[0,6]]]:[7.5,[[-7,-7],[7,-7],[-7,7],[7,7]]],o=off[k]||[0,0],px=R*2,ko=e.hp<=0;
  const rit=Eroi.ritratto(e.aspetto,e.razza,e.classe,px).replace('<svg class="rit" viewBox="0 0 100 100"',`<svg class="rit" x="${-R}" y="${-R}" viewBox="0 0 100 100"`),pc=Math.max(0,e.hp)/e.hpMax,col=pc>.5?'#7ac26a':pc>.25?'#e8b84a':'#e0705e';
  return`<g class="mo-tok${ko?' ko':''}${sel?' sel':''}" transform="translate(${o[0]} ${o[1]})"><g clip-path="url(#mo-cl${R===10?'a':R===8.5?'b':'c'})">${rit}</g><circle r="${R}" fill="none" stroke="${sel?'#f3d37a':'#1a120a'}" stroke-width="${sel?2.4:1.6}"/>`
   +(ko?glifo('teschio',0,0,R*1.1,'#fff',.9):`<rect x="${-R}" y="${R+1}" width="${R*2}" height="3" fill="#000" opacity=".65"/><rect x="${-R}" y="${R+1}" width="${(R*2*pc).toFixed(1)}" height="3" fill="${col}"/>`)+'</g>'},
 svg(s){const u=Camp.u,Z=MoMappa.SZ-1.2,R=MoMappa.riquadro(s),vivi=CAMP.vivi(s),isel=Camp.eroeSel(s),esel=s.eroi[isel],obj=s.luoghi[CAMP.passoCorrente(s)],ant=Camp.anteprima(s);
  const vicino=c=>vivi.some(e=>CAMP.dist(e,c)<=AMOS.VISTA),ragg=esel&&esel.hp>0&&esel.pm>0&&!s.sfida?CAMP.raggiungibili(s,isel):{};let g='',ov='',lu='',reg='';
  for(const c of Object.values(s.celle)){const[cx,cy]=MoMappa.xy(c.q,c.r);
   if(!c.visto){g+=`<polygon points="${MoMappa.hex(cx,cy,Z)}" fill="#15110d" stroke="#231c15" stroke-width="1"/>`;continue}
   const mem=vicino(c)?1:.66;g+=`<polygon points="${MoMappa.hex(cx,cy,Z)}" fill="${MoMappa.COL[c.t]}" stroke="rgba(0,0,0,.35)" stroke-width="1" opacity="${mem}"/>`;
   if(MoMappa.GLI[c.t]&&!c.luogo)g+=glifo(MoMappa.GLI[c.t],cx,cy,15,'#000',.28*mem);
   const k=c.q+','+c.r;if(ragg[k]!=null&&!(esel.q===c.q&&esel.r===c.r))ov+=`<polygon points="${MoMappa.hex(cx,cy,Z)}" fill="rgba(243,211,122,.3)" stroke="rgba(243,211,122,.75)" stroke-width="1.2" pointer-events="none"/>`;
   const l=c.luogo&&s.luoghi[c.luogo];if(l){const fatto=l.ripulito,ass=l.assedio,ob=obj&&obj.id===l.id;
    lu+=`<g transform="translate(${cx} ${cy})"${fatto?' opacity=".55"':''}>${ob?'<circle r="15" class="mo-ob" fill="none" stroke="#f3d37a" stroke-width="2.4"/>':''}<circle r="11" fill="${ass?'#4a1a14':'#2a1c0e'}" stroke="${ass?'#e0705e':'#e8c98a'}" stroke-width="1.6"/>${glifo(MoMappa.ICO[l.tipo]||'p_tesoro',0,0,16,'#f3e6c8',1)}`
     +(l.tipo==='citta'||l.tipo==='torre'||l.tipo==='villaggio'||l.tipo==='santuario'||l.tipo==='rovina'||l.tipo==='antro'?`<text class="nm" y="${Z+3}" text-anchor="middle">${esc(l.nome)}</text>`:'')+'</g>'}}
  for(const r of s.regioni||[]){const c=s.celle[r.centro.q+','+r.centro.r];if(c&&c.visto){const[x,y]=MoMappa.xy(r.centro.q,r.centro.r);reg+=`<text class="rg" x="${x}" y="${y}" text-anchor="middle">${esc(r.nome.toUpperCase())}</text>`}}
  // tragitto scelto
  let via='';if(ant&&ant.passi&&ant.passi.length){const pts=[[esel.q,esel.r]].concat(ant.passi.map(c=>[c.q,c.r])).map(([q,r])=>MoMappa.xy(q,r).map(n=>n.toFixed(1)).join(',')).join(' '),[dx,dy]=MoMappa.xy(u.dest.q,u.dest.r),fi=ant.fine,[fx,fy]=fi?MoMappa.xy(fi.q,fi.r):[0,0];
   via=`<polyline points="${pts}" class="mo-via" fill="none"/><polygon points="${MoMappa.hex(dx,dy,Z)}" fill="none" class="mo-dest"/>`+(fi&&(fi.q!==u.dest.q||fi.r!==u.dest.r)?`<circle cx="${fx}" cy="${fy}" r="5" class="mo-fine"/>`:'')}
  else if(u.dest){const[dx,dy]=MoMappa.xy(u.dest.q,u.dest.r);via=`<polygon points="${MoMappa.hex(dx,dy,Z)}" fill="none" class="mo-dest"/>`}
  // mercanti e mostri: si vedono solo vicino a un eroe in piedi
  let mo='';for(const x of s.mercanti||[])if(vicino(x)){const[cx,cy]=MoMappa.xy(x.q,x.r);mo+=`<g transform="translate(${cx} ${cy})"><circle r="10" fill="#6a4a14" stroke="#f3d37a" stroke-width="1.6"/>${glifo('p_mercante',0,0,15,'#fff',1)}</g>`}
  for(const m of AMOS.visibili(s)){const[cx,cy]=MoMappa.xy(m.q,m.r),f=MoMappa.FAM[m.fam]||['spada','#c26a3c'],sel=u.mostro===m.id;
   mo+=`<g class="mo-mn ${m.stato}${sel?' sel':''}" transform="translate(${cx} ${cy})"><circle r="11.5" fill="${f[1]}" stroke="${sel?'#fff':'#1a0c06'}" stroke-width="${sel?2.4:1.8}"/>${glifo(f[0],0,0,15,'#1a0c06',1)}<circle cx="9" cy="-9" r="6" fill="#1a0c06" stroke="#f3e6c8" stroke-width="1"/><text x="9" y="-5.8" text-anchor="middle" class="lv">${m.liv}</text></g>`}
  // eroi: raggruppati per esagono
  const per={};s.eroi.forEach((e,i)=>{(per[e.q+','+e.r]=per[e.q+','+e.r]||[]).push(i)});let eroi='';
  for(const [k,L] of Object.entries(per)){const[q,r]=k.split(',').map(Number),[cx,cy]=MoMappa.xy(q,r);eroi+=`<g transform="translate(${cx} ${cy})">${L.map((i,j)=>MoMappa.token(s.eroi[i],i,L.length,j,i===isel)).join('')}</g>`}
  const notte=s.fase==='notte'?`<rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" fill="#0b1236" opacity=".3" pointer-events="none"/>`:'';
  return`<svg class="mo-svg${Camp.v.k>=MoMappa.KNOMI?' zn':''}" viewBox="${MoMappa.viewBox(s)}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Mappa del mondo"><defs>${[['a',10],['b',8.5],['c',7.5]].map(([n,r])=>`<clipPath id="mo-cl${n}"><circle r="${r}"/></clipPath>`).join('')}</defs>
${g}${reg}${ov}${lu}${notte}${via}${mo}${eroi}</svg>`},
 // ---- gesti ----
 _g:new Map(),_pan:false,_ultimo:{t:0,q:null,r:null},
 pt(svg,x,y){const m=svg.getScreenCTM();if(!m)return null;const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(m.inverse())},
 avvia(){if(MoMappa._on)return;MoMappa._on=true;
  const trova=e=>e.target&&e.target.closest?e.target.closest('.mo-svg'):null;
  document.addEventListener('pointerdown',e=>{const svg=trova(e);if(!svg||!Camp.s)return;MoMappa._g.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t0:performance.now(),svg});
   if(MoMappa._g.size===1)MoMappa._pan=false;if(MoMappa._g.size===2){MoMappa._pan=true;const[a,b]=[...MoMappa._g.values()];MoMappa._d0=Math.hypot(a.x-b.x,a.y-b.y)||1;MoMappa._k0=Camp.v.k}},{passive:true});
  document.addEventListener('pointermove',e=>{const g=MoMappa._g.get(e.pointerId);if(!g||!Camp.s)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;g.x=e.clientX;g.y=e.clientY;
   if(MoMappa._g.size>=2){const[a,b]=[...MoMappa._g.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,p=MoMappa.pt(g.svg,(a.x+b.x)/2,(a.y+b.y)/2);if(p)MoMappa.zoom(g.svg,(MoMappa._k0*d/MoMappa._d0)/Camp.v.k,p.x,p.y);return}
   if(!MoMappa._pan&&Math.hypot(e.clientX-g.x0,e.clientY-g.y0)<8)return;MoMappa._pan=true;
   const m=g.svg.getScreenCTM();if(!m)return;const c=MoMappa.centro(Camp.s);Camp.v.cx=c.x-dx/m.a;Camp.v.cy=c.y-dy/m.d;MoMappa.limita(Camp.s);MoMappa.applica(g.svg)},{passive:true});
  const fine=e=>{const g=MoMappa._g.get(e.pointerId);if(!g)return;MoMappa._g.delete(e.pointerId);
   if(e.type==='pointerup'&&!MoMappa._pan&&MoMappa._g.size===0&&performance.now()-g.t0<700&&Camp.s){const p=MoMappa.pt(g.svg,e.clientX,e.clientY);if(p)MoMappa.tocco(MoMappa.cellaDa(p.x,p.y))}
   if(MoMappa._g.size===0)setTimeout(()=>{MoMappa._pan=false},0)};
  document.addEventListener('pointerup',fine,{passive:true});document.addEventListener('pointercancel',fine,{passive:true});
  document.addEventListener('wheel',e=>{const svg=trova(e);if(!svg||!Camp.s)return;e.preventDefault();const p=MoMappa.pt(svg,e.clientX,e.clientY);MoMappa.zoom(svg,e.deltaY<0?1.2:1/1.2,p&&p.x,p&&p.y)},{passive:false})},
 // il secondo di due tocchi molto ravvicinati sulla stessa cella è un rimbalzo e non conferma nulla
 tocco(c){const t=performance.now(),u=MoMappa._ultimo;if(u.q===c.q&&u.r===c.r&&t-u.t<320)return;MoMappa._ultimo={t,q:c.q,r:c.r};Camp.tocca(c)}
};
MoMappa.avvia();
