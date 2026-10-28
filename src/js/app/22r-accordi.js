/* ================= ARMONIE (telefono) =================
   Plancia in prospettiva: ogni casella è un esagono di cartone, i dischi sono cilindri di legno impilati con il motivo in cima.
   Schermata a fasi: in alto punti per voce e mini-plance, poi la plancia grande e le tue carte; in basso un vassoio fisso che segue
   il turno (centro → dischi presi con anteprima e conferma → Fine turno). I cubetti si mettono toccando il segnalino ambra sulla casella;
   ogni carta si apre ingrandita con lo schema spiegato a parole. Usa il layout fisso dell'hub (22g-fisso.js): niente scorrimento né zoom,
   la plancia prende lo spazio che resta.
   Grafica tutta in SVG, niente immagini. La TV usa accordiTVH (24z-accordi-tv.js). */
const ACOL={b:['#3b8fd4','#1f5d93','#9fd0f5'],g:['#9aa1aa','#5f666f','#d6dbe0'],m:['#8b5a33','#5a3519','#c08a5c'],v:['#5fae3d','#3a7424','#b7e08e'],y:['#eab73b','#a77812','#fbe39a'],r:['#cf4a3d','#8a2219','#f2a197']};
const APC=['#e8574a','#3a8fe6','#f2c230','#b06be0'];
const ANEED={b:'acqua',y:'campo',g:'monte alto 1',gg:'monte alto 2',ggg:'monte alto 3',v:'albero alto 1',mv:'albero alto 2',mmv:'albero alto 3',H:'casa'};
/* motivo sul disco in cima (coordinate relative al centro, rx = raggio orizzontale) */
function acMotif(c,x,y,rx,ry){const L=ACOL[c][2],f=n=>n.toFixed(1),w=Math.max(1,rx*.09);
 if(c==='b')return`<path d="M${f(x-rx*.55)} ${f(y-ry*.15)}q${f(rx*.18)} ${f(-ry*.35)} ${f(rx*.36)} 0t${f(rx*.36)} 0t${f(rx*.36)} 0M${f(x-rx*.45)} ${f(y+ry*.35)}q${f(rx*.18)} ${f(-ry*.35)} ${f(rx*.36)} 0t${f(rx*.36)} 0" fill="none" stroke="${L}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
 if(c==='y')return[[0,-.3],[-.38,.15],[.38,.15],[0,.45]].map(([a,b])=>`<ellipse cx="${f(x+a*rx)}" cy="${f(y+b*ry)}" rx="${f(rx*.13)}" ry="${f(ry*.16)}" fill="${L}"/>`).join('');
 if(c==='v')return`<path d="M${f(x-rx*.5)} ${f(y+ry*.2)}Q${f(x)} ${f(y-ry*.9)} ${f(x+rx*.5)} ${f(y-ry*.1)}Q${f(x)} ${f(y+ry*.7)} ${f(x-rx*.5)} ${f(y+ry*.2)}Z" fill="${L}" opacity=".85"/><path d="M${f(x-rx*.45)} ${f(y+ry*.2)}L${f(x+rx*.45)} ${f(y-ry*.08)}" stroke="${ACOL.v[1]}" stroke-width="${f(w*.7)}"/>`;
 if(c==='g')return`<path d="M${f(x-rx*.5)} ${f(y+ry*.3)}L${f(x-rx*.1)} ${f(y-ry*.45)}L${f(x+rx*.15)} ${f(y)}L${f(x+rx*.3)} ${f(y-ry*.25)}L${f(x+rx*.55)} ${f(y+ry*.3)}" fill="none" stroke="${L}" stroke-width="${f(w)}" stroke-linejoin="round"/>`;
 if(c==='m')return`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx*.55)}" ry="${f(ry*.55)}" fill="none" stroke="${L}" stroke-width="${f(w*.8)}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx*.25)}" ry="${f(ry*.25)}" fill="none" stroke="${L}" stroke-width="${f(w*.8)}"/>`;
 return`<path d="M${f(x-rx*.55)} ${f(y+ry*.25)}L${f(x)} ${f(y-ry*.45)}L${f(x+rx*.55)} ${f(y+ry*.25)}" fill="none" stroke="${L}" stroke-width="${f(w*1.2)}" stroke-linejoin="round"/><rect x="${f(x-rx*.12)}" y="${f(y)}" width="${f(rx*.24)}" height="${f(ry*.4)}" fill="${L}"/>`}
/* un disco: fianco scuro + faccia in alto; motivo solo sul disco più alto */
const acMix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
function acDisc(c,x,y,rx,ry,h,top){const[f0,d]=ACOL[c],f=n=>n.toFixed(1),sd=acMix(f0,d,.45);
 return`<path d="M${f(x-rx)} ${f(y)}V${f(y+h)}A${f(rx)} ${f(ry)} 0 0 0 ${f(x+rx)} ${f(y+h)}V${f(y)}Z" fill="${sd}"/><path d="M${f(x-rx)} ${f(y+h)}A${f(rx)} ${f(ry)} 0 0 0 ${f(x+rx)} ${f(y+h)}" fill="none" stroke="#1a0f06" stroke-opacity=".55" stroke-width="1.3"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${f0}" stroke="${d}" stroke-width=".9"/>${top?acMotif(c,x,y,rx,ry):''}`}
function acStack(st,x,y,rx,ry,h){let g='';for(let i=0;i<st.length;i++)g+=acDisc(st[i],x,y-i*h,rx,ry,h,i===st.length-1);return g}
/* cubetto isometrico (animale ambra, folletto lilla, custode bianco) */
function acCube(x,y,s,kind){const C=kind==='w'?['#c7a6f0','#8d63c9','#a982de']:kind==='s'?['#fbf6e8','#c9bfa6','#e4dcc6']:['#ffc35a','#c27a12','#e89a2a'],f=n=>n.toFixed(1);
 return`<g class="ac-cube"><path d="M${f(x)} ${f(y-s)}L${f(x+s)} ${f(y-s/2)}L${f(x)} ${f(y)}L${f(x-s)} ${f(y-s/2)}Z" fill="${C[0]}"/><path d="M${f(x-s)} ${f(y-s/2)}L${f(x)} ${f(y)}V${f(y+s)}L${f(x-s)} ${f(y+s/2)}Z" fill="${C[2]}"/><path d="M${f(x+s)} ${f(y-s/2)}L${f(x)} ${f(y)}V${f(y+s)}L${f(x+s)} ${f(y+s/2)}Z" fill="${C[1]}"/></g>`}
const AC_SQ=.82,AC_DS=.58; /* AC_SQ schiaccia la griglia, AC_DS i dischi */
function acPix(k,z){const[q,r]=ACC.QR(k);return[z*Math.sqrt(3)*(q+r/2),z*1.5*r*AC_SQ]}
function acHex(x,y,z){let s='';for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);s+=(x+z*Math.cos(a)).toFixed(1)+','+(y+z*Math.sin(a)*AC_SQ).toFixed(1)+' '}return s}
/* plancia intera: o.tgt = Set di caselle toccabili, o.act = azione dei bersagli, o.W larghezza */
/* plancia intera. o.tgt: caselle toccabili (o.act), o.cub: Map casella→carte che ci possono mettere un cubetto, o.prev: {k,c,d} anteprima */
function acBoardSVG(s,p,o){o=o||{};const b=s.pl[p],ks=Object.keys(b.cells),W=o.W||Math.max(300,Math.min(520,(typeof innerWidth!=='undefined'?innerWidth:390)-12));
 const all=ACC.shape(s.side==='C'?'A':s.side),pts=all.map(k=>acPix(k,1)),x0=Math.min(...pts.map(q=>q[0])),x1=Math.max(...pts.map(q=>q[0])),y0=Math.min(...pts.map(q=>q[1])),y1=Math.max(...pts.map(q=>q[1]));
 const z=Math.min(o.zmax||60,(W-10)/(x1-x0+Math.sqrt(3))),top=z*1.15,H=Math.round((y1-y0)*z+z*AC_SQ*2+top+8),ox=W/2-(x0+x1)/2*z,oy=top+z*AC_SQ-y0*z;
 const rx=z*.6,ry=rx*AC_DS,h=z*.3,tgt=o.tgt||new Set(),cub=o.cub||new Map(),rifK=new Map();b.rif.forEach(f=>{if(f.site)rifK.set(f.site,0)});b.rifOk.forEach(f=>rifK.set(f.k,1));
 const arid=s.side==='D'?new Set(ACC.ARID):null,wet=k=>ACC.nbs(k).some(y=>b.cells[y]&&b.cells[y].s==='b'),f1=n=>n.toFixed(1);
 let base=`<path d="${(()=>{let d='';all.forEach(k=>{const[x,y]=acPix(k,z);d+='M'+acHex(ox+x,oy+y,z*1.06).trim().split(' ').join('L')+'Z'});return d})()}" fill="#c9ad7c" stroke="#8c6a3c" stroke-width="5" stroke-linejoin="round"/>`;
 if(s.side==='C'){const[x,y]=acPix(ACC.K(1,2),z);base+=`<polygon points="${acHex(ox+x,oy+y,z*.98)}" fill="#3a2a1c" stroke="#6b4a26" stroke-width="2"/><ellipse cx="${ox+x}" cy="${oy+y}" rx="${z*.5}" ry="${z*.3}" fill="#22180f"/>`}
 let cellsG='',piles='',taps='',marks='';
 const order=ks.slice().sort((a,c)=>acPix(a,1)[1]-acPix(c,1)[1]||acPix(a,1)[0]-acPix(c,1)[0]);
 for(const k of order){const[x,y]=acPix(k,z),X=ox+x,Y=oy+y,cell=b.cells[k],ar=arid&&arid.has(k),dry=ar&&!wet(k),pv=o.prev&&o.prev.k===k;
  cellsG+=`<polygon points="${acHex(X,Y,z*.93)}" fill="${dry?'#d8b874':ar?'#b9c98a':'#e8d6ac'}" stroke="#a88758" stroke-width="1.2"/>`;
  if(dry)cellsG+=`<path d="M${f1(X-z*.4)} ${f1(Y-z*.05)}l${f1(z*.2)} ${f1(z*.12)}l${f1(z*.15)} ${f1(-z*.14)}l${f1(z*.2)} ${f1(z*.1)}" fill="none" stroke="#9b7a3c" stroke-width="1.4"/>`;
  if(rifK.has(k))cellsG+=`<polygon points="${acHex(X,Y,z*.8)}" fill="none" stroke="${rifK.get(k)?'#f7c948':'#f7c94888'}" stroke-width="2.4" stroke-dasharray="${rifK.get(k)?'0':'5 3'}"/>`;
  if(tgt.has(k))cellsG+=`<polygon points="${acHex(X,Y,z*.86)}" fill="${pv?'#ffd36b88':'#ffd36b44'}" stroke="#e8860f" stroke-width="${pv?4:2.6}" class="${pv?'':'ac-glow'}"/>`;
  const st=cell.s+(pv?o.prev.c:''),sh=st.length*h;
  if(st)piles+=`<ellipse cx="${f1(X+z*.05)}" cy="${f1(Y+h+ry*.15)}" rx="${f1(rx*1.08)}" ry="${f1(ry*1.05)}" fill="#00000040"/>`+acStack(cell.s,X,Y,rx,ry,h)+(pv?`<g class="ac-ghost">${acDisc(o.prev.c,X,Y-cell.s.length*h,rx,ry,h,1)}</g>`:'');
  if(st.length>=2)piles+=`<g class="ac-hgt"><circle cx="${f1(X+rx*.98)}" cy="${f1(Y-sh+h*.5)}" r="${f1(z*.19)}" fill="#2a1b0f" stroke="#f6ecd2" stroke-width="1.4"/><text x="${f1(X+rx*.98)}" y="${f1(Y-sh+h*.5+z*.085)}" font-size="${f1(z*.25)}" font-weight="800" text-anchor="middle" fill="#f6ecd2">${st.length}</text></g>`;
  if(cell.a)piles+=acCube(X-(cell.w?z*.2:0),Y-sh+z*.02,z*.2,cell.a==='s'?'s':'a');
  if(cell.w)piles+=acCube(X+(cell.a?z*.2:0),Y-sh+z*.02,z*.18,'w');
  if(tgt.has(k))taps+=`<polygon data-a="${o.act}" data-v="${k}" role="button" aria-label="Casella" class="ac-tap" points="${acHex(X,Y-sh*.5,z*.95)}" fill="transparent"/>`;
  if(cub.has(k)){const mx=X-rx*.85,my=Y-sh-ry*.2;marks+=`<g data-a="accubek" data-v="${k}" role="button" aria-label="Metti un cubetto" class="ac-mark"><circle cx="${f1(mx)}" cy="${f1(my)}" r="${f1(z*.3)}" fill="#2a1b0fcc" stroke="#ffc35a" stroke-width="2"/>${acCube(mx,my+z*.02,z*.15,cub.get(k).some(x=>x.k==='w')&&!cub.get(k).some(x=>x.k!=='w')?'w':'a')}</g>`}
  if(pv&&o.prev.d)marks+=`<g class="ac-delta"><rect x="${f1(X-z*.62)}" y="${f1(Y-sh-h-z*.62)}" width="${f1(z*1.24)}" height="${f1(z*.42)}" rx="${f1(z*.2)}" fill="${o.prev.d>0?'#2f7d3a':'#5a3a20'}" stroke="#f6ecd2" stroke-width="1.2"/><text x="${f1(X)}" y="${f1(Y-sh-h-z*.31)}" font-size="${f1(z*.3)}" font-weight="800" text-anchor="middle" fill="#fff">${o.prev.d>0?'+':''}${o.prev.d}</text></g>`}
 return`<svg class="ac-board" viewBox="0 0 ${W} ${H}" ${o.fill?'':`width="${W}" height="${H}"`} role="img" aria-label="Paesaggio di ${esc(s.names[p])}">${base}${cellsG}${piles}${taps}${marks}</svg>`}
/* mini-plancia vista dall'alto (striscia dei giocatori) */
function acMiniSVG(s,p){const b=s.pl[p],z=4.2,ks=ACC.shape(s.side==='C'?'A':s.side);let g='';
 ks.forEach(k=>{const[q,r]=ACC.QR(k),x=z*Math.sqrt(3)*(q+r/2)+z+1,y=z*1.5*r+z+1,c=b.cells[k],st=c?c.s:'',col=!c?'#22180f':st?ACOL[st[st.length-1]][0]:'#e8d6ac';
  let pt='';for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);pt+=(x+z*.95*Math.cos(a)).toFixed(1)+','+(y+z*.95*Math.sin(a)).toFixed(1)+' '}g+=`<polygon points="${pt}" fill="${col}"${c&&c.a?' stroke="#ffc35a" stroke-width="1"':''}/>`});
 return`<svg class="ac-mini" viewBox="0 0 ${(z*Math.sqrt(3)*5+2*z+2).toFixed(0)} ${(z*1.5*4+2*z+2).toFixed(0)}" aria-hidden="true">${g}</svg>`}
/* schema di una carta in miniatura (vista dall'alto): esagoni col colore in cima e l'altezza, il cubetto sulla prima casella */
function acPatSVG(id,px){const c=ACC.CARDS[id],z=9,cs=c.pat.map(([q,r,n])=>[z*Math.sqrt(3)*(q+r/2),z*1.5*r,n]);
 const xs=cs.map(v=>v[0]),ys=cs.map(v=>v[1]),x0=Math.min(...xs)-z,x1=Math.max(...xs)+z,y0=Math.min(...ys)-z,y1=Math.max(...ys)+z;
 const hx=(x,y)=>{let s='';for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);s+=(x+z*.95*Math.cos(a)).toFixed(1)+','+(y+z*.95*Math.sin(a)).toFixed(1)+' '}return s};
 let g='';cs.forEach(([x,y,n],i)=>{const t=ACC.topC(n),H=n==='H'?2:n.length,C=ACOL[t];g+=`<polygon points="${hx(x,y)}" fill="${C[0]}" stroke="${C[1]}" stroke-width="1.4"/>`;
  if(n==='H')g+=`<path d="M${x-4} ${y+1}L${x} ${y-3}L${x+4} ${y+1}" fill="none" stroke="#fff" stroke-width="1.6"/>`;
  else if(H>1||'gv'.includes(t))g+=`<text x="${x}" y="${y+3.3}" font-size="9" font-weight="700" text-anchor="middle" fill="#fff">${H}</text>`;
  if(i===0)g+=`<rect x="${x-3}" y="${y-z*.95-1}" width="6" height="6" rx="1" fill="${c.k==='w'?'#c7a6f0':c.k==='s'?'#fbf6e8':'#ffc35a'}" stroke="#3a2510" stroke-width=".8"/>`});
 const w=x1-x0,h=y1-y0,k=(px||54)/Math.max(w,h);
 return`<svg class="ac-pat" viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" width="${(w*k).toFixed(0)}" height="${(h*k).toFixed(0)}" aria-hidden="true">${g}</svg>`}
/* carta animale come quella vera: illustrazione a campiture piatte in alto, schema in basso, traccia verticale a destra con i cubetti
   che coprono i numeri (ogni cubetto messo sulla plancia scopre il valore sotto). Il paesaggio dipinto nasce dai bisogni della carta. */
function acScene(id){const c=ACC.CARDS[id],ns=(c.pat||[]).map(x=>x[2]),has=t=>ns.some(n=>t(n)),h=[...id].reduce((a,ch)=>a*31+ch.charCodeAt(0)>>>0,7),r=k=>((h>>k)%100)/100;
 const sky=c.k==='w'?['#e9dcf7','#c9b2ec']:c.k==='s'?['#fff6d8','#f0d48a']:['#cfe6f2','#f4e6c4'];let g=`<defs><linearGradient id="acs${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="60" height="56" fill="url(#acs${id})"/>`;
 g+=`<circle cx="${12+r(3)*36}" cy="${9+r(5)*6}" r="5" fill="#fff6c8" opacity=".9"/>`;
 if(has(n=>n[0]==='g'))g+=`<path d="M-2 40L${14+r(2)*6} ${12+r(4)*6}L26 30L${36+r(6)*6} ${10+r(7)*6}L62 38V56H-2Z" fill="#8d939b"/><path d="M${14+r(2)*6} ${12+r(4)*6}l-4 7h8ZM${36+r(6)*6} ${10+r(7)*6}l-4 7h8Z" fill="#eef2f6"/>`;
 g+=`<path d="M-2 42Q15 ${30+r(8)*6} 30 38T62 36V56H-2Z" fill="${has(n=>n==='y')?'#d9b34a':'#7fae55'}"/>`;
 if(has(n=>n==='b'))g+=`<path d="M-2 48Q20 42 34 47T62 45V56H-2Z" fill="#3b8fd4"/><path d="M8 50h10M30 51h12" stroke="#9fd0f5" stroke-width="1.2" stroke-linecap="round"/>`;
 else g+=`<path d="M-2 49Q25 44 62 48V56H-2Z" fill="#5f8f3a"/>`;
 if(has(n=>/v$/.test(n)))[[8+r(9)*8,1],[46+r(11)*8,.85]].forEach(([x,k])=>{g+=`<path d="M${x} ${44-22*k}l${7*k} ${14*k}h${-3*k}l${5*k} ${9*k}h${-18*k}l${5*k} ${-9*k}h${-3*k}Z" fill="#2f6b34"/><rect x="${x-1}" y="${45-(.5-k)*2}" width="2" height="4" fill="#5a3519"/>`});
 if(has(n=>n==='H'))g+=`<path d="M${30+r(12)*8} 38l8-7 8 7v8h-16Z" fill="#efe2c4"/><path d="M${28+r(12)*8} 39l10-9 10 9" fill="none" stroke="#cf4a3d" stroke-width="3" stroke-linejoin="round"/>`;
 return`<svg class="ac-scn" viewBox="0 0 60 56" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${g}</svg>`}
function acTrack(c,n){const tot=c.k==='w'?2:c.pts.length,vals=c.k==='w'?['2·5','2·5']:c.pts;
 return`<div class="ac-trk">${vals.map((v,i)=>`<span class="${i<n?'on':'cv'} ${c.k==='w'?'w':''}">${v}</span>`).join('')}</div>`}
const AC_SET={base:'',tre:'Battito',fol:'Folletto',spi:'Custode',rif:'Rifugio'};
function acCardH(id,n,o){o=o||{};const c=ACC.CARDS[id],at=o.a?`data-a="${o.a}" data-v="${o.v}"`:'disabled';
 if(c.k==='f')return`<button class="ac-card ac-rif ${o.sel?'sel':''}" ${at} aria-label="Rifugio ${esc(c.nm)}"><b>${esc(c.nm)}</b><span class="ac-rst">${c.st.split('').map(x=>`<i style="background:${ACOL[x][0]}"></i>`).join('')}</span><small>${o.done?'completo: 3 a vicino':'pila di 4'}</small></button>`;
 const side=c.k==='s'?`<div class="ac-txt">${esc(c.txt)}</div>`:acTrack(c,n||0);
 return`<button class="ac-card k${c.k} s-${c.set} ${o.sel?'sel':''} ${o.ok?'ok':''}" ${at} aria-label="${esc(c.nm)}${c.k==='a'?', valori '+c.pts.join(' '):''}">${acScene(id)}${AC_SET[c.set]?`<em>${AC_SET[c.set]}</em>`:''}${c.k==='s'?'':side}<b>${esc(c.nm)}</b><span class="ac-foot">${acPatSVG(id,40)}</span>${c.k==='s'?side:''}</button>`}
function acLive(s){try{return ACC.score(s)}catch(e){return s.names.map(()=>({tot:0}))}}
function acReset(){ui.acj=null;ui.acp=null;ui.acs=null;ui.ack=null}
const AC_VOCI=[['tree','Alberi','v'],['mount','Monti','g'],['field','Campi','y'],['house','Case','r'],['water','Acqua','b'],['anim','Animali','a'],['fol','Folletti','w'],['rif','Rifugi','f'],['spi','Custode','s']];
/* schema a parole: "cubetto su albero alto 3, con monte alto 2 e campo accanto" */
function acPatWords(id){const c=ACC.CARDS[id],[t,...o]=c.pat.map(x=>ANEED[x[2]]);return'Cubetto su '+t+(o.length?', con '+o.join(o.length>2?', ':' e ').replace(/, ([^,]*)$/,' e $1')+' come nel disegno':'')}
/* anteprima della posa: punti guadagnati e carte che diventano completabili */
function acPreview(s,me,j,k){const r=ACC.act(s,{t:'put',j,k});if(r.err)return null;const a=ACC.scoreP(s,me),b=ACC.scoreP(r.s,me),d=b.tot-a.tot;
 const why=AC_VOCI.filter(v=>b[v[0]]!==a[v[0]]).map(v=>v[1]+' '+(b[v[0]]-a[v[0]]>0?'+':'')+(b[v[0]]-a[v[0]]));
 const pb=s.pl[me],ready=pb.hand.concat(pb.spirit&&!pb.spirit.n?[pb.spirit]:[]).filter(h=>ACC.cubeSpots(r.s,me,h.id).length>ACC.cubeSpots(s,me,h.id).length).map(h=>ACC.CARDS[h.id].nm);
 return{k,c:s.hold[j],d,why,ready}}
/* caselle dove posso mettere un cubetto, con le carte che ci stanno */
function acCubeMap(s,me){const b=s.pl[me],m=new Map(),add=(k,x)=>{if(!m.has(k))m.set(k,[]);m.get(k).push(x)};
 b.hand.forEach((h,i)=>ACC.cubeSpots(s,me,h.id).forEach(k=>add(k,{c:i,id:h.id,k:ACC.CARDS[h.id].k})));
 if(b.spirit&&!b.spirit.n)ACC.cubeSpots(s,me,b.spirit.id).forEach(k=>add(k,{c:'spirit',id:b.spirit.id,k:'s'}));return m}
/* foglio dal basso: carta ingrandita con spiegazione e comandi */
function acSheetH(s,me,own){const x=ui.acs;if(!x)return'';const b=s.pl[me];let id,n=0,btn='',st='';
 if(x.w==='d'){id=s.disp[x.i];const full=ACC.held(b)>=4;btn=own?`<button class="b gold" data-a="actakec" ${!s.tookCard&&!full?'':'disabled'}>Prendi la carta</button>${s.n===1&&!s.tookCard&&!s.swapped?'<button class="b" data-a="acswap">Scarta dalla fila</button>':''}`:'';
  st=!own?'':s.tookCard?'Hai già preso una carta in questo turno.':full?'Hai già 4 carte da completare.':''}
 else if(x.w==='r'){id=s.rdisp[x.i];const full=ACC.held(b)>=4;btn=own?`<button class="b gold" data-a="actaker" ${!s.tookRif&&!full?'':'disabled'}>Progetta il rifugio</button>`:'';}
 else{const vb=s.pl[x.p],h=x.i==='spirit'?vb.spirit:x.i==='rif'?null:vb.hand[x.i];id=x.id||(h&&h.id);n=h?h.n:0;
  if(own&&x.p===me&&h){const C=ACC.CARDS[id],k=ACC.cubeSpots(s,me,id).length;st=k?`Lo schema è pronto in ${k} ${k>1?'caselle':'casella'}: tocca il segnalino ambra sulla plancia.`:'Lo schema non è ancora sulla plancia.';
   if(C.k==='a'&&C.pts.length-h.n===1)b.rifOk.forEach((f,fi)=>{if(ACC.CARDS[f.id].cols.includes(ACC.topC(C.pat[0][2])))btn+=`<button class="b" data-a="acrifc" data-v="${x.i}:${fi}">Ultimo cubetto su ${esc(ACC.CARDS[f.id].nm)}</button>`})}}
 if(!id)return'';const C=ACC.CARDS[id];
 let txt=C.k==='f'?`Pila di 4: ${C.st.split('').map(c=>ACC.CN[c]).join(', ')} dal basso. Normalmente vietata, con questo rifugio se ne può fare una. Completo: 3 punti per ogni casella vicina con in cima ${ACC.CN[C.cols[0]]} o ${ACC.CN[C.cols[1]]}, e accoglie l’ultimo cubetto di un animale di quel colore.`
  :C.k==='s'?`${esc(C.txt)}. Vale solo se metti il suo cubetto: ${acPatWords(id).toLowerCase()}.`
  :C.k==='w'?`${acPatWords(id)}. Due cubetti; ognuno vale 5 se sta con un cubetto animale o del Custode, 2 da solo.`
  :`${acPatWords(id)}. Girato o specchiato come vuoi, altezze esatte. Vale l’ultimo numero scoperto: ${C.pts.join(' → ')}.`;
 return`<div class="ac-sheet" role="dialog" aria-label="${esc(C.nm)}"><div class="ac-sbox"><div class="ac-big">${acCardH(id,n,{})}</div><div class="ac-sinfo"><h3>${esc(C.nm)}</h3><p>${txt}</p>${st?`<p class="ac-st">${st}</p>`:''}<div class="col">${btn}<button class="b disc" data-a="acsx">Chiudi</button></div></div></div></div>`}
/* scelta della carta quando più carte possono mettere il cubetto nella stessa casella */
function acPickH(s,me){if(!ui.ack)return'';const L=acCubeMap(s,me).get(ui.ack)||[];if(!L.length)return'';
 return`<div class="ac-sheet"><div class="ac-sbox ac-pick"><h3>Quale cubetto?</h3><div class="ac-row">${L.map(x=>acCardH(x.id,0,{a:'accube',v:ui.ack+'|'+x.c})).join('')}</div><button class="b disc" data-a="acsx">Annulla</button></div></div>`}
function accordiH(){if(ui.tv)return accordiTVH();const s=G,mine=myTurn(),me=s.cur,L=local(),b=s.pl[me];
 const view=ui.acv!=null&&ui.acv<s.n?ui.acv:(mine?me:(L.length?L[0]:me)),own=mine&&view===me,sc=acLive(s),vb=s.pl[view];
 if(!own)ui.acp=null;
 if(own&&s.hold.length&&(ui.acj==null||ui.acj>=s.hold.length))ui.acj=0;
 /* striscia: giocatori con mini-plancia */
 const pl=`<div class="ac-pls">${s.names.map((n,i)=>`<button class="ac-pl ${i===s.cur&&!s.over?'act':''} ${i===view?'see':''}" style="--pc:${APC[i]}" data-a="acview" data-v="${i}" aria-label="Guarda il paesaggio di ${esc(n)}">${acMiniSVG(s,i)}<span><b>${esc(n)}</b>${seatTag(i)}</span><em>${s.over?s.over.scores[i]:sc[i].tot}</em></button>`).join('')}</div>`;
 /* punti per voce del paesaggio guardato */
 const d=sc[view]||{},voci=AC_VOCI.filter(v=>v[0]==='fol'?s.cfg.fol:v[0]==='rif'?s.cfg.rif:v[0]==='spi'?s.cfg.spi:true);
 const ico=k=>k==='a'||k==='w'||k==='s'?`<svg viewBox="-9 -10 18 20" width="14" height="14" aria-hidden="true">${acCube(0,0,7,k)}</svg>`:k==='f'?'<i class="ac-rico"></i>':`<svg viewBox="0 0 20 16" width="16" height="13" aria-hidden="true">${acDisc(k,10,6,8,5.6,4,0)}</svg>`;
 const strip=`<div class="ac-pts" role="list">${voci.map(v=>`<span role="listitem" class="${d[v[0]]?'':'z'}">${ico(v[2])}${v[1]} <b>${d[v[0]]||0}</b></span>`).join('')}</div>`;
 /* bersagli sulla plancia */
 let tgt=new Set(),act='',cub=new Map();
 if(own&&s.hold[ui.acj]){const c=s.hold[ui.acj];for(const k in b.cells)if(ACC.canPut(s,me,k,c))tgt.add(k);act='acput'}
 if(own)cub=acCubeMap(s,me);
 const prev=own&&ui.acp&&s.hold[ui.acj]?ui.acp:null;
 const board=`<div class="ac-wrap">${acBoardSVG(s,view,{tgt,act,cub,prev,W:420,fill:1})}</div>`;
 /* carte del paesaggio guardato */
 const myC=[...vb.hand.map((h,i)=>({id:h.id,n:h.n,v:i})),...(vb.spirit&&!vb.spirit.n?[{id:vb.spirit.id,n:0,v:'spirit'}]:[])];
 const cards=myC.map(x=>acCardH(x.id,x.n,{a:'acopen',v:view+':'+x.v,ok:own&&ACC.cubeSpots(s,me,x.id).length>0})).join('')+vb.rif.map(f=>acCardH(f.id,0,{a:'acopen',v:view+':rif:'+f.id})).join('');
 const done=vb.done.length+vb.rifOk.length+(vb.spirit&&vb.spirit.n?1:0)?`<div class="ac-done">${vb.done.map(h=>`<span>${esc(ACC.CARDS[h.id].nm)}</span>`).join('')}${vb.rifOk.map(f=>`<span class="r">${esc(ACC.CARDS[f.id].nm)}${f.cubes?' · '+f.cubes:''}</span>`).join('')}${vb.spirit&&vb.spirit.n?`<span class="s">${esc(ACC.CARDS[vb.spirit.id].nm)}</span>`:''}</div>`:'';
 /* fila di carte in basso, a schede: le tue carte, gli animali da prendere, i rifugi */
 const tab=ui.acrow==='disp'||ui.acrow==='rif'&&s.cfg.rif?ui.acrow:'mine';
 const rowCards=tab==='disp'?s.disp.map((id,i)=>acCardH(id,0,{a:'acdsel',v:i})).join(''):tab==='rif'?s.rdisp.map((id,i)=>acCardH(id,0,{a:'acrsel',v:i})).join('')
  :(cards||'<p class="ac-none">Nessuna carta da completare: prendine una dagli Animali.</p>')+(done?`<div class="ac-donec">${done}</div>`:'');
 const tb=(k,l)=>`<button class="ac-tb ${tab===k?'on':''}" data-a="acrow" data-v="${k}">${l}</button>`;
 const rowH=`<div class="ac-tabs">${tb('mine',(view===me?'Le tue carte':'Carte di '+esc(s.names[view]))+' '+ACC.held(vb)+'/4')}${tb('disp','Animali'+(own&&s.tookCard?' (presa)':''))}${s.cfg.rif?tb('rif','Rifugi'):''}</div><div class="ac-row">${rowCards}</div>`;
 /* vassoio fisso: segue il turno */
 let tray='',actsH='';
 if(s.over)tray='';
 else if(!own){tray=`<div class="ac-tray"><div class="ac-step">${mine&&view!==me?'Stai guardando '+esc(s.names[view])+'. <button class="b sm" data-a="acview" data-v="'+me+'">Torna al tuo</button>':'Tocca a <b>'+esc(s.names[s.cur])+'</b>'+(s.took==null?': sceglie i dischi':': fa crescere il paesaggio')}</div></div>`}
 else{const steps=`<div class="ac-steps"><span class="${s.took!=null?'ok':'now'}">1 Dischi</span><span class="${s.took!=null&&!s.hold.length?'ok':s.took!=null?'now':''}">2 Posa ${s.took!=null?3-s.hold.length:0}/3</span><span class="${s.tookCard?'ok':''}">Carta</span><span class="${cub.size?'now':''}">Cubetti${cub.size?' '+cub.size:''}</span></div>`;
  let body='',acts='',msg='';
  if(b.offer){msg='Prima scegli il tuo Custode.'}
  else if(s.took==null){msg='Scegli uno spazio: prendi tutti e tre i dischi.';
   body=`<div class="ac-centre">${s.slots.map((sl,i)=>`<button class="ac-slot ${sl?'':'empty'}" ${sl?`data-a="actake" data-v="${i}"`:'disabled'} aria-label="${sl?'Prendi '+sl.map(c=>ACC.CN[c]).join(', '):'vuoto'}"><svg viewBox="0 0 64 48" width="64" height="48" aria-hidden="true"><ellipse cx="32" cy="30" rx="30" ry="16" fill="#3b2616" stroke="#c9973b" stroke-width="1.5"/>${sl?sl.map((c,j)=>acDisc(c,[18,46,32][j],[25,25,34][j]-6,11.5,11.5*AC_DS,6,1)).join(''):''}</svg></button>`).join('')}</div>`}
  else if(s.hold.length){const pv=prev;
   msg=pv?`<b>${pv.d>0?'+'+pv.d:pv.d} punti</b>${pv.why.length?' · '+pv.why.join(', '):''}${pv.ready.length?' · pronto per '+pv.ready.map(esc).join(', '):''}`:tgt.size?'Tocca una casella illuminata: vedi l’anteprima, poi conferma.':'Questo disco non entra da nessuna parte.';
   body=`<div class="ac-hold">${s.hold.map((c,j)=>`<button class="ac-tok ${ui.acj===j?'on':''}" data-a="achold" data-v="${j}" aria-label="Disco ${ACC.CN[c]}"><svg viewBox="0 0 40 36" width="46" height="42" aria-hidden="true">${acDisc(c,20,14,15,15*AC_DS,8,1)}</svg><small>${ACC.CN[c]}</small></button>`).join('')}</div>`;
   if(pv)acts=`<button class="b gold" data-a="acok">Posa qui</button><button class="b disc" data-a="acno">Annulla</button>`}
  else{msg=cub.size?'Tocca un segnalino ambra per mettere un cubetto, poi Fine turno.':s.tookCard||ACC.held(b)>=4?'Tutto fatto: Fine turno.':'Puoi prendere un animale qui sopra, poi Fine turno.'}
  const stuck=s.hold.length&&s.hold.every(c=>!Object.keys(b.cells).some(k=>ACC.canPut(s,me,k,c)));
  if(s.took!=null&&(!s.hold.length||stuck))acts+=`<button class="b gold" data-a="acend">${stuck?'Fine turno (i dischi non entrano)':'Fine turno'}</button>`;
  tray=`<div class="ac-tray">${steps}<div class="ac-step" aria-live="polite">${msg}</div>${body}</div>`;actsH=acts?`<div class="ac-acts">${acts}</div>`:''}
 const offer=own&&b.offer?`<div class="modal"><div class="box"><h2>Il tuo Custode</h2><p>Tienine uno: il suo schema accoglie un cubetto e a fine partita vale il suo obiettivo.</p><div class="ac-row ac-offer">${b.offer.map((id,i)=>acCardH(id,0,{a:'acspirit',v:i})).join('')}</div></div></div>`:'';
 const goals=ui.acgoal?acGoalsH(s):'';
 const end=s.over&&!ui.anim?acEndH(s):'';
 const chips=`<div class="tinfo"><span class="chip">Lato ${s.side} · ${ACC.SIDES[s.side]}</span><span class="chip">Sacchetto ${s.bag.length}</span>${s.endTrig&&!s.over?'<span class="chip ac-last">Ultimo giro</span>':''}<button class="chip ac-gbtn" data-a="acgoal">${ui.acgoal?'Chiudi':'Come si conta'}</button></div>`;
 const plist=s.names.map((n,i)=>{const d2=sc[i];return`<div class="ac-plrow"><b style="color:${APC[i]}">${esc(n)}</b> ${s.over?s.over.scores[i]:d2.tot} punti<small>${voci.map(v=>v[1]+' '+(d2[v[0]]||0)).join(' · ')}</small></div>`}).join('');
 return fixH({title:GN('accordi'),chips,strip:pl+goals+strip,mid:board,bot:tray,act:actsH,hand:rowH,players:plist,end:offer+acSheetH(s,me,own)+(own?acPickH(s,me):'')+end})}
function acGoalsH(s){const sd=s.side;return`<div class="ac-goals"><div><b>Alberi</b> alto 1/2/3: 1/3/7${sd==='D'?' (non su caselle aride)':''}</div><div><b>Monti</b> alto 1/2/3: 1/3/7, solo se toccano un monte</div><div><b>Campi</b> gruppo di 2 o più: ${sd==='D'?6:5}</div><div><b>Case</b> ${sd==='C'?'8 con 4 colori diversi attorno':'5 con 3 colori diversi attorno'}</div><div><b>Acqua</b> ${sd==='B'?'5 per isola':'fiume più lungo: 2/5/8/11/15, poi +4'}</div><div><b>Animali</b> l’ultimo valore coperto dai cubetti</div>${s.cfg.fol?'<div><b>Folletti</b> 5 con un cubetto animale, 2 da soli</div>':''}${s.cfg.rif?'<div><b>Rifugi</b> 3 per vicino con uno dei due colori</div>':''}</div>`}
function acEndH(s){const o=s.over,w=o.win,R=[['tree','Alberi'],['mount','Monti'],['field','Campi'],['house','Case'],['water',s.side==='B'?'Isole':'Fiume'],['anim','Animali']];
 if(s.cfg.fol)R.push(['fol','Folletti']);if(s.cfg.rif)R.push(['rif','Rifugi']);if(s.cfg.spi)R.push(['spi','Custode']);
 const row=(k,lab)=>`<tr><th>${lab}</th>${s.names.map((_,i)=>`<td>${o.det[i][k]}</td>`).join('')}</tr>`;
 const sun=o.suns!=null?`<p class="ac-suns">${Array.from({length:6},(_,i)=>`<span class="${i<o.suns?'on':''}">${ic('sole',22)}</span>`).join('')}</p>`:'';
 return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${ic(w==null&&s.n>1?'stretta':'corona',48)}</div><h2>${s.n===1?o.scores[0]+' punti':w==null?'Pareggio!':'Vince '+esc(s.names[w])+'!'}</h2>${sun}
 <table class="vscore"><tr><th></th>${s.names.map(n=>`<th>${esc(n)}</th>`).join('')}</tr>${R.map(r=>row(r[0],r[1])).join('')}<tr class="tot"><th>Totale</th>${o.scores.map((v,i)=>`<td class="${o.winners.includes(i)?'w':''}">${v}</td>`).join('')}</tr></table>
 <div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function accordiClick(a,v){const s=G;
 if(a==='acview'){ui.acv=+v;ui.acp=null;return render()}
 if(a==='acgoal'){ui.acgoal=!ui.acgoal;return render()}
 if(a==='acrow'){ui.acrow=v;return render()}
 if(a==='acsx'){ui.acs=null;ui.ack=null;return render()}
 if(a==='acopen'){const[p,i,id]=v.split(':');ui.acs={w:'m',p:+p,i:i==='spirit'||i==='rif'?i:+i,id:id||null};return render()}
 if(a==='acdsel'){ui.acs={w:'d',i:+v};return render()}
 if(a==='acrsel'){ui.acs={w:'r',i:+v};return render()}
 if(!myTurn())return;ui.err='';
 if(a==='acspirit'){acReset();return dispatch({t:'spirit',i:+v})}
 if(a==='actake'){acReset();return dispatch({t:'take',i:+v})}
 if(a==='achold'){ui.acj=+v;ui.acp=null;return render()}
 if(a==='acput'){const j=ui.acj==null?0:ui.acj;if(ui.acp&&ui.acp.k===v)return accordiClick('acok');ui.acp=acPreview(s,s.cur,j,v);Snd.play('ok');return render()}
 if(a==='acok'){if(!ui.acp)return;const k=ui.acp.k,j=ui.acj==null?0:ui.acj;ui.acp=null;Snd.play('deal');return dispatch({t:'put',j,k})}
 if(a==='acno'){ui.acp=null;return render()}
 if(a==='accubek'){const L=acCubeMap(s,s.cur).get(v)||[];if(L.length===1)return dispatch({t:'cube',c:L[0].c,k:v});ui.ack=v;return render()}
 if(a==='accube'){const[k,c]=v.split('|');ui.ack=null;return dispatch({t:'cube',c:c==='spirit'?'spirit':+c,k})}
 if(a==='acrifc'){const[c,f]=v.split(':').map(Number);acReset();return dispatch({t:'cuberif',c,f})}
 if(a==='actakec'){const i=ui.acs&&ui.acs.i;acReset();ui.acrow='mine';return dispatch({t:'card',i})}
 if(a==='actaker'){const i=ui.acs&&ui.acs.i;acReset();ui.acrow='mine';return dispatch({t:'rif',i})}
 if(a==='acswap'){const i=ui.acs&&ui.acs.i;acReset();return dispatch({t:'swap',i})}
 if(a==='acend'){acReset();return dispatch({t:'end'})}}
const ACFX={async pre(){return{}},async run(prev,ns){ui.acv=null;for(const e of ns.ev){
  if(e.t==='take'){Snd.play('deal');await W(120)}
  else if(e.t==='put'){Snd.play('ok');await W(60)}
  else if(e.t==='cube'){Snd.play('redeem');await W(150)}
  else if(e.t==='done'){banner(ACC.CARDS[e.id].nm,'Carta completata');await W(420)}
  else if(e.t==='rifok'){Snd.play('win');banner('Rifugio completo','');await W(500)}
  else if(e.t==='card'||e.t==='rifc'||e.t==='spirit'){Snd.play('deal');await W(120)}
  else if(e.t==='end'){banner('IL PAESAGGIO È COMPLETO','Si contano i punti');Snd.play('win');await W(900)}}
  endFx(ns)}};
