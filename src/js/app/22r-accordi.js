/* ================= ARMONIE (telefono) =================
   Plancia in prospettiva: ogni casella è un esagono di cartone, i dischi sono cilindri di legno impilati con il motivo in cima.
   Sotto: i dischi presi, il centro, le tue carte e la fila. Tocca un disco preso e poi una casella; tocca una tua carta e poi una casella per il cubetto.
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
function acDisc(c,x,y,rx,ry,h,top){const[f0,d]=ACOL[c],f=n=>n.toFixed(1);
 return`<path d="M${f(x-rx)} ${f(y)}V${f(y+h)}A${f(rx)} ${f(ry)} 0 0 0 ${f(x+rx)} ${f(y+h)}V${f(y)}Z" fill="${d}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${f0}" stroke="${d}" stroke-width=".8"/>${top?acMotif(c,x,y,rx,ry):''}`}
function acStack(st,x,y,rx,ry,h){let g='';for(let i=0;i<st.length;i++)g+=acDisc(st[i],x,y-i*h,rx,ry,h,i===st.length-1);return g}
/* cubetto isometrico (animale ambra, folletto lilla, custode bianco) */
function acCube(x,y,s,kind){const C=kind==='w'?['#c7a6f0','#8d63c9','#a982de']:kind==='s'?['#fbf6e8','#c9bfa6','#e4dcc6']:['#ffc35a','#c27a12','#e89a2a'],f=n=>n.toFixed(1);
 return`<g class="ac-cube"><path d="M${f(x)} ${f(y-s)}L${f(x+s)} ${f(y-s/2)}L${f(x)} ${f(y)}L${f(x-s)} ${f(y-s/2)}Z" fill="${C[0]}"/><path d="M${f(x-s)} ${f(y-s/2)}L${f(x)} ${f(y)}V${f(y+s)}L${f(x-s)} ${f(y+s/2)}Z" fill="${C[2]}"/><path d="M${f(x+s)} ${f(y-s/2)}L${f(x)} ${f(y)}V${f(y+s)}L${f(x+s)} ${f(y+s/2)}Z" fill="${C[1]}"/></g>`}
const AC_SQ=.62;
function acPix(k,z){const[q,r]=ACC.QR(k);return[z*Math.sqrt(3)*(q+r/2),z*1.5*r*AC_SQ]}
function acHex(x,y,z){let s='';for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);s+=(x+z*Math.cos(a)).toFixed(1)+','+(y+z*Math.sin(a)*AC_SQ).toFixed(1)+' '}return s}
/* plancia intera: o.tgt = Set di caselle toccabili, o.act = azione dei bersagli, o.W larghezza */
function acBoardSVG(s,p,o){o=o||{};const b=s.pl[p],ks=Object.keys(b.cells),W=o.W||356,z0=40;
 const all=ACC.shape(s.side==='C'?'A':s.side),pts=all.map(k=>acPix(k,1)),x0=Math.min(...pts.map(q=>q[0])),x1=Math.max(...pts.map(q=>q[0])),y0=Math.min(...pts.map(q=>q[1])),y1=Math.max(...pts.map(q=>q[1]));
 const z=Math.min(z0,(W-8)/(x1-x0+Math.sqrt(3))),top=z*1.25,H=Math.round((y1-y0)*z+z*AC_SQ*2+top+6),ox=W/2-(x0+x1)/2*z,oy=top+z*AC_SQ-y0*z;
 const rx=z*.74,ry=rx*AC_SQ,h=z*.24,tgt=o.tgt||new Set(),rifK=new Map();b.rif.forEach(f=>{if(f.site)rifK.set(f.site,0)});b.rifOk.forEach(f=>rifK.set(f.k,1));
 const arid=s.side==='D'?new Set(ACC.ARID):null,wet=k=>ACC.nbs(k).some(y=>b.cells[y]&&b.cells[y].s==='b');
 let base=`<path d="${(()=>{let d='';all.forEach(k=>{const[x,y]=acPix(k,z);d+='M'+acHex(ox+x,oy+y,z*1.06).trim().split(' ').join('L')+'Z'});return d})()}" fill="#c9ad7c" stroke="#8c6a3c" stroke-width="5" stroke-linejoin="round"/>`;
 if(s.side==='C'){const[x,y]=acPix(ACC.K(1,2),z);base+=`<polygon points="${acHex(ox+x,oy+y,z*.98)}" fill="#3a2a1c" stroke="#6b4a26" stroke-width="2"/><ellipse cx="${ox+x}" cy="${oy+y}" rx="${z*.5}" ry="${z*.3}" fill="#22180f"/>`}
 let cellsG='',piles='',taps='';
 const order=ks.slice().sort((a,c)=>acPix(a,1)[1]-acPix(c,1)[1]||acPix(a,1)[0]-acPix(c,1)[0]);
 for(const k of order){const[x,y]=acPix(k,z),X=ox+x,Y=oy+y,cell=b.cells[k],ar=arid&&arid.has(k),dry=ar&&!wet(k);
  cellsG+=`<polygon points="${acHex(X,Y,z*.93)}" fill="${dry?'#d8b874':ar?'#b9c98a':'#e8d6ac'}" stroke="#a88758" stroke-width="1.2"/>`;
  if(dry)cellsG+=`<path d="M${(X-z*.4).toFixed(1)} ${(Y-z*.05).toFixed(1)}l${z*.2} ${z*.12}l${z*.15} ${-z*.14}l${z*.2} ${z*.1}" fill="none" stroke="#9b7a3c" stroke-width="1.2"/>`;
  if(rifK.has(k))cellsG+=`<polygon points="${acHex(X,Y,z*.8)}" fill="none" stroke="${rifK.get(k)?'#f7c948':'#f7c94888'}" stroke-width="2" stroke-dasharray="${rifK.get(k)?'0':'4 3'}"/>`;
  const sh=cell.s.length*h;
  if(cell.s)piles+=`<ellipse cx="${X.toFixed(1)}" cy="${(Y+h*.9).toFixed(1)}" rx="${(rx*1.02).toFixed(1)}" ry="${(ry*1.02).toFixed(1)}" fill="#0000002e"/>`+acStack(cell.s,X,Y,rx,ry,h);
  if(cell.a)piles+=acCube(X-(cell.w?z*.2:0),Y-sh-z*.06,z*.17,cell.a==='s'?'s':'a');
  if(cell.w)piles+=acCube(X+(cell.a?z*.2:0),Y-sh-z*.06,z*.15,'w');
  if(o.ghost&&o.ghost.k===k)piles+=`<g class="ac-ghost">${acDisc(o.ghost.c,X,Y-sh,rx,ry,h,1)}</g>`;
  if(tgt.has(k))taps+=`<g data-a="${o.act}" data-v="${k}" role="button" class="ac-tap"><polygon points="${acHex(X,Y-sh*.6,z*.9)}" fill="#ffd36b55" stroke="#e8860f" stroke-width="3" class="ac-glow"/></g>`;
  else if(o.info)taps+=`<g data-a="acinfo" data-v="${k}"><polygon points="${acHex(X,Y,z*.9)}" fill="transparent"/></g>`}
 return`<svg class="ac-board" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Paesaggio di ${esc(s.names[p])}">${base}${cellsG}${piles}${taps}</svg>`}
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
function acTrack(c,n){if(c.k==='w')return`<div class="ac-trk"><span class="${n>0?'on':''}">2-5</span><span class="${n>1?'on':''}">2-5</span></div>`;
 if(c.k==='s')return`<div class="ac-txt">${esc(c.txt)}</div>`;return`<div class="ac-trk">${c.pts.map((v,i)=>`<span class="${i<n?'on':''}">${v}</span>`).join('')}</div>`}
const AC_SET={base:'',tre:'Battito',fol:'Folletto',spi:'Custode',rif:'Rifugio'};
function acCardH(id,n,o){o=o||{};const c=ACC.CARDS[id];
 if(c.k==='f')return`<button class="ac-card ac-rif ${o.sel?'sel':''} ${o.ok?'ok':''}" ${o.a?`data-a="${o.a}" data-v="${o.v}"`:'disabled'} aria-label="Rifugio ${esc(c.nm)}"><b>${esc(c.nm)}</b><span class="ac-rst">${c.st.split('').map(x=>`<i style="background:${ACOL[x][0]}"></i>`).join('')}</span><small>${o.done?'completo: 3 a vicino':'pila di 4'}</small></button>`;
 return`<button class="ac-card k${c.k} s-${c.set} ${o.sel?'sel':''} ${o.ok?'ok':''}" ${o.a?`data-a="${o.a}" data-v="${o.v}"`:'disabled'} aria-label="${esc(c.nm)}">${AC_SET[c.set]?`<em>${AC_SET[c.set]}</em>`:''}<b>${esc(c.nm)}</b>${acPatSVG(id,46)}${acTrack(c,n||0)}</button>`}
function acLive(s){try{return ACC.score(s)}catch(e){return s.names.map(()=>({tot:0}))}}
function acReset(){ui.acj=null;ui.acx=null;ui.acd=null;ui.acr=null}
function accordiH(){if(ui.tv)return accordiTVH();const s=G,mine=myTurn(),me=s.cur,L=local(),b=s.pl[me];
 const view=ui.acv!=null&&ui.acv<s.n?ui.acv:(mine?me:(L.length?L[0]:me)),own=mine&&view===me,sc=acLive(s);
 if(own&&s.hold.length&&(ui.acj==null||ui.acj>=s.hold.length)&&ui.acx==null)ui.acj=0;
 const pl=`<div class="players" id="players">${s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''} ${i===view?'ac-see':''}" style="border-color:${APC[i]}" data-a="acview" data-v="${i}" role="button" tabindex="0"><div class="av" style="background:${APC[i]}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${s.over?s.over.scores[i]:sc[i].tot} pt</span></div>`).join('')}</div>`;
 /* bersagli sulla plancia */
 let tgt=new Set(),act='',ghost=null;
 if(own&&ui.acj!=null&&s.hold[ui.acj]){const c=s.hold[ui.acj];for(const k in b.cells)if(ACC.canPut(s,me,k,c))tgt.add(k);act='acput'}
 else if(own&&ui.acx!=null){const h=ui.acx==='spirit'?b.spirit:b.hand[ui.acx];if(h)ACC.cubeSpots(s,me,h.id).forEach(k=>tgt.add(k));act='accube'}
 const board=`<div class="ac-wrap">${acBoardSVG(s,view,{tgt,act,ghost})}</div>`;
 /* dischi in mano */
 const hold=own&&s.took!=null?`<div class="ac-hold">${s.hold.map((c,j)=>`<button class="ac-tok ${ui.acj===j?'on':''}" data-a="achold" data-v="${j}" aria-label="Disco ${ACC.CN[c]}"><svg viewBox="0 0 40 34" width="44" height="38" aria-hidden="true">${acDisc(c,20,14,15,15*AC_SQ,7,1)}</svg></button>`).join('')||'<span class="ac-hint">Dischi posati</span>'}</div>`:'';
 /* centro */
 const can=own&&s.took==null;
 const centre=`<div class="ac-centre">${s.slots.map((sl,i)=>`<button class="ac-slot ${sl?'':'empty'}" ${can&&sl?`data-a="actake" data-v="${i}"`:'disabled'} aria-label="${sl?'Prendi '+sl.map(c=>ACC.CN[c]).join(', '):'vuoto'}"><svg viewBox="0 0 64 44" width="64" height="44" aria-hidden="true"><ellipse cx="32" cy="27" rx="30" ry="15" fill="#3b2616" stroke="#c9973b" stroke-width="1.5"/>${sl?sl.map((c,j)=>acDisc(c,[18,46,32][j],[24,24,32][j]-6,11,11*AC_SQ,5,1)).join(''):''}</svg></button>`).join('')}</div>`;
 /* le mie carte (della plancia guardata) */
 const vb=s.pl[view],mineCards=[...vb.hand.map((h,i)=>({id:h.id,n:h.n,v:i})),...(vb.spirit&&!vb.spirit.n?[{id:vb.spirit.id,n:0,v:'spirit'}]:[])];
 const cards=mineCards.map(x=>acCardH(x.id,x.n,{a:own?'acsel':null,v:x.v,sel:own&&String(ui.acx)===String(x.v),ok:own&&ACC.cubeSpots(s,me,x.id).length>0})).join('')+vb.rif.map((f,i)=>acCardH(f.id,0,{})).join('');
 const done=vb.done.length+vb.rifOk.length?`<div class="ac-done">${vb.done.map(h=>`<span title="${esc(ACC.CARDS[h.id].nm)}">${esc(ACC.CARDS[h.id].nm)}</span>`).join('')}${vb.rifOk.map(f=>`<span class="r">${esc(ACC.CARDS[f.id].nm)}${f.cubes?' · '+f.cubes:''}</span>`).join('')}${vb.spirit&&vb.spirit.n?`<span class="s">${esc(ACC.CARDS[vb.spirit.id].nm)}</span>`:''}</div>`:'';
 /* fila */
 const full=ACC.held(b)>=4,canCard=own&&!s.tookCard&&!full;
 const disp=`<div class="ac-row">${s.disp.map((id,i)=>acCardH(id,0,{a:own?'acdsel':null,v:i,sel:ui.acd===i})).join('')}</div>`;
 const rdisp=s.cfg.rif?`<div class="hlabel">Rifugi</div><div class="ac-row">${s.rdisp.map((id,i)=>acCardH(id,0,{a:own?'acrsel':null,v:i,sel:ui.acr===i})).join('')}</div>`:'';
 /* comandi */
 let ctl='';
 if(own){if(ui.acd!=null&&s.disp[ui.acd]){ctl+=`<button class="b sm gold" data-a="actakec" ${canCard?'':'disabled'}>Prendi ${esc(ACC.CARDS[s.disp[ui.acd]].nm)}</button>`;if(s.n===1&&!s.tookCard&&!s.swapped)ctl+=`<button class="b sm" data-a="acswap">Scarta</button>`}
  if(ui.acr!=null&&s.rdisp[ui.acr])ctl+=`<button class="b sm gold" data-a="actaker" ${!s.tookRif&&!full?'':'disabled'}>Progetta ${esc(ACC.CARDS[s.rdisp[ui.acr]].nm)}</button>`;
  if(ui.acx!=null&&ui.acx!=='spirit'){const h=b.hand[ui.acx],C=h&&ACC.CARDS[h.id];if(C&&C.k==='a'&&C.pts.length-h.n===1)b.rifOk.forEach((f,fi)=>{if(ACC.CARDS[f.id].cols.includes(ACC.topC(C.pat[0][2])))ctl+=`<button class="b sm" data-a="acrifc" data-v="${fi}">Ultimo cubetto su ${esc(ACC.CARDS[f.id].nm)}</button>`})}
  if(ui.acx!=null||ui.acd!=null||ui.acr!=null)ctl+=`<button class="b sm disc" data-a="accancel">Annulla</button>`;
  const stuck=s.hold.length&&s.hold.every(c=>!Object.keys(b.cells).some(k=>ACC.canPut(s,me,k,c)));
  if(s.took!=null&&(!s.hold.length||stuck))ctl+=`<button class="b sm gold" data-a="acend">${stuck?'Fine turno (i dischi non entrano)':'Fine turno'}</button>`}
 let hint='Prendi i tre dischi di uno spazio del centro.';
 if(own&&b.offer)hint='Scegli il tuo Custode.';else if(own&&s.took!=null&&s.hold.length)hint='Tocca una casella illuminata per posare il disco scelto.';
 else if(own&&ui.acx!=null)hint=tgt.size?'Tocca una casella illuminata per il cubetto.':'Lo schema non è ancora completo sulla plancia.';
 else if(own&&s.took!=null)hint='Puoi prendere una carta, mettere cubetti, poi Fine turno.';
 if(mine&&view!==me)hint='Stai guardando il paesaggio di '+s.names[view]+': tocca il tuo nome per tornare.';
 const offer=own&&b.offer?`<div class="modal"><div class="box"><h2>Il tuo Custode</h2><p>Tienine uno: il suo schema accoglie un cubetto e a fine partita vale il suo obiettivo.</p><div class="ac-row ac-offer">${b.offer.map((id,i)=>acCardH(id,0,{a:'acspirit',v:i})).join('')}</div></div></div>`:'';
 const goals=ui.acgoal?acGoalsH(s):'';
 const end=s.over&&!ui.anim?acEndH(s):'';
 const chips=`<div class="tinfo"><span class="chip">Lato ${s.side} · ${ACC.SIDES[s.side]}</span><span class="chip">Sacchetto ${s.bag.length}</span>${s.endTrig&&!s.over?'<span class="chip ac-last">Ultimo giro</span>':''}<button class="chip ac-gbtn" data-a="acgoal">${ui.acgoal?'Chiudi punteggi':'Punteggi'}</button></div>`;
 return`${hudH(GN('accordi'))}${chips}${pl}${goals}${board}${hold}${bubbleH(s,hint,null)}${cards||done?`<div class="hlabel">${view===me&&own?'Le tue carte':'Carte di '+esc(s.names[view])} (${ACC.held(vb)}/4)</div><div class="ac-row ac-mine">${cards}</div>${done}`:''}<div class="hlabel">Il centro</div>${centre}<div class="hlabel">Animali</div>${disp}${rdisp}<div class="ctl ac-ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div>${offer}${end}${rulesH()}${cfgH()}`}
function acGoalsH(s){const sd=s.side;return`<div class="ac-goals"><div><b>Alberi</b> alto 1/2/3: 1/3/7${sd==='D'?' (non su caselle aride)':''}</div><div><b>Monti</b> alto 1/2/3: 1/3/7, solo se toccano un monte</div><div><b>Campi</b> gruppo di 2 o più: ${sd==='D'?6:5}</div><div><b>Case</b> ${sd==='C'?'8 con 4 colori diversi attorno':'5 con 3 colori diversi attorno'}</div><div><b>Acqua</b> ${sd==='B'?'5 per isola':'fiume più lungo: 2/5/8/11/15, poi +4'}</div><div><b>Animali</b> l’ultimo valore coperto dai cubetti</div>${s.cfg.fol?'<div><b>Folletti</b> 5 con un cubetto animale, 2 da soli</div>':''}${s.cfg.rif?'<div><b>Rifugi</b> 3 per vicino con uno dei due colori</div>':''}</div>`}
function acEndH(s){const o=s.over,w=o.win,R=[['tree','Alberi'],['mount','Monti'],['field','Campi'],['house','Case'],['water',s.side==='B'?'Isole':'Fiume'],['anim','Animali']];
 if(s.cfg.fol)R.push(['fol','Folletti']);if(s.cfg.rif)R.push(['rif','Rifugi']);if(s.cfg.spi)R.push(['spi','Custode']);
 const row=(k,lab)=>`<tr><th>${lab}</th>${s.names.map((_,i)=>`<td>${o.det[i][k]}</td>`).join('')}</tr>`;
 const sun=o.suns!=null?`<p class="ac-suns">${Array.from({length:6},(_,i)=>`<span class="${i<o.suns?'on':''}">${ic('sole',22)}</span>`).join('')}</p>`:'';
 return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${ic(w==null&&s.n>1?'stretta':'corona',48)}</div><h2>${s.n===1?o.scores[0]+' punti':w==null?'Pareggio!':'Vince '+esc(s.names[w])+'!'}</h2>${sun}
 <table class="vscore"><tr><th></th>${s.names.map(n=>`<th>${esc(n)}</th>`).join('')}</tr>${R.map(r=>row(r[0],r[1])).join('')}<tr class="tot"><th>Totale</th>${o.scores.map((v,i)=>`<td class="${o.winners.includes(i)?'w':''}">${v}</td>`).join('')}</tr></table>
 <div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function accordiClick(a,v){const s=G;
 if(a==='acview'){ui.acv=+v;return render()}
 if(a==='acgoal'){ui.acgoal=!ui.acgoal;return render()}
 if(a==='accancel'){acReset();ui.err='';return render()}
 if(a==='acinfo')return;
 if(!myTurn())return;ui.err='';
 if(a==='acspirit'){acReset();return dispatch({t:'spirit',i:+v})}
 if(a==='actake'){acReset();return dispatch({t:'take',i:+v})}
 if(a==='achold'){ui.acj=+v;ui.acx=null;return render()}
 if(a==='acput'){const j=ui.acj==null?0:ui.acj;Snd.play('deal');return dispatch({t:'put',j,k:v})}
 if(a==='acsel'){const x=v==='spirit'?'spirit':+v;ui.acx=ui.acx===x?null:x;ui.acj=ui.acx==null?0:null;ui.acd=null;ui.acr=null;return render()}
 if(a==='accube'){const c=ui.acx;ui.acx=null;ui.acj=0;return dispatch({t:'cube',c,k:v})}
 if(a==='acrifc'){const c=ui.acx;acReset();return dispatch({t:'cuberif',c,f:+v})}
 if(a==='acdsel'){ui.acd=ui.acd===+v?null:+v;ui.acr=null;return render()}
 if(a==='acrsel'){ui.acr=ui.acr===+v?null:+v;ui.acd=null;return render()}
 if(a==='actakec'){const i=ui.acd;acReset();return dispatch({t:'card',i})}
 if(a==='actaker'){const i=ui.acr;acReset();return dispatch({t:'rif',i})}
 if(a==='acswap'){const i=ui.acd;acReset();return dispatch({t:'swap',i})}
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
