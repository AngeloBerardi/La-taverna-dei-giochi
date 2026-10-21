/* ================= VALLE SELVAGGIA ================= */
const VHC={M:'#8f9aa8',F:'#2f7d4a',P:'#c9b44a',W:'#5aa3a0',R:'#3d74c9'},VHD={M:'#5f6874',F:'#1d5532',P:'#93822e',W:'#3a7471',R:'#28508f'};
const VHI={M:'🏔️',F:'🌲',P:'🌾',W:'🪷',R:'🌊'};
const VAI={o:'🐻',a:'🦌',s:'🐟',f:'🦅',v:'🦊'},VPC=['#e8574a','#3a8fe6','#f2c230','#b06be0'];
const VGOAL={o:'Coppie: 4 / 11 / 19 / 27 per 1-4 coppie isolate',a:'File dritte: 2 / 5 / 9 / 13 per lunghezza 1-4',s:'Corsi senza bivi: 2 / 4 / 7 / 11 / 15 / 20 / 26',f:'Falchi isolati: 2 / 5 / 8 / 11 / 14 / 18 / 22 / 26',v:'Volpe: 1 punto per ogni specie diversa accanto'};
function vPix(q,r,z){return[z*Math.sqrt(3)*(q+r/2),z*1.5*r]}
function vCorner(cx,cy,z,i){const a=Math.PI/180*(60*i-30);return[cx+z*Math.cos(a),cy+z*Math.sin(a)]}
/* lato i (0=E,1=NE,2=NO,...) sta tra gli angoli i e i-1 con angoli SVG crescenti in senso orario: E tra -30° e +30° */
function vEdgeTri(cx,cy,z,i){const a1=-i*60-30,a2=-i*60+30;const p=a=>[cx+z*Math.cos(a*Math.PI/180),cy+z*Math.sin(a*Math.PI/180)];const A=p(a1),B=p(a2);return`${cx.toFixed(1)},${cy.toFixed(1)} ${A[0].toFixed(1)},${A[1].toFixed(1)} ${B[0].toFixed(1)},${B[1].toFixed(1)}`}
function vHexPts(cx,cy,z){let s='';for(let i=0;i<6;i++){const[x,y]=vCorner(cx,cy,z,i);s+=x.toFixed(1)+','+y.toFixed(1)+' '}return s}
function vTileSVG(c,cx,cy,z,o={}){let g='';for(let i=0;i<6;i++){const h=VALLE.edgeH(c,i);g+=`<polygon points="${vEdgeTri(cx,cy,z,i)}" fill="${VHC[h]}" stroke="${VHC[h]}" stroke-width=".6"/>`}
 g+=`<polygon points="${vHexPts(cx,cy,z)}" fill="none" stroke="#1b1410" stroke-width="${o.sel?3:1.4}" ${o.sel?'stroke-dasharray="0"':''}/>`;
 if(c.t.k)g+=`<circle cx="${cx}" cy="${cy}" r="${z*.62}" fill="none" stroke="#f7e3a1" stroke-width="1.5" stroke-dasharray="3 2"/>`;
 if(c.tok)g+=`<circle cx="${cx}" cy="${cy}" r="${z*.5}" fill="#f6efe0" stroke="#3b2a1a" stroke-width="1.5"/><text x="${cx}" y="${cy+z*.2}" font-size="${z*.6}" text-anchor="middle">${VAI[c.tok]}</text>`;
 else{const as=c.t.a.split('');const fs=z*(as.length>2?.34:.42);as.forEach((a,j)=>{const dx=(j-(as.length-1)/2)*fs*1.05;g+=`<text x="${(cx+dx).toFixed(1)}" y="${(cy+fs*.35).toFixed(1)}" font-size="${fs.toFixed(1)}" text-anchor="middle" opacity=".92">${VAI[a]}</text>`})}
 if(o.glow)g+=`<polygon points="${vHexPts(cx,cy,z-2)}" fill="#ffffff22" stroke="#f7c948" stroke-width="3" class="vglow"/>`;
 return g}
function vBoardH(s,p,o){const B=s.boards[p].cells,z0=30;const keys=Object.keys(B),sp=o.spots||[],ghost=o.ghost;
 const all=[...keys.map(VALLE.QR),...sp];if(ghost)all.push([ghost.q,ghost.r]);const pts=all.map(([q,r])=>vPix(q,r,1));
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs)+2,h=Math.max(...ys)-Math.min(...ys)+2.2;
 const z=Math.min(z0,354/w,300/h),W=354,H=Math.max(140,Math.min(330,h*z+8));
 const ox=W/2-((Math.max(...xs)+Math.min(...xs))/2)*z,oy=H/2-((Math.max(...ys)+Math.min(...ys))/2)*z;let g='';
 for(const k of keys){const[q,r]=VALLE.QR(k),[x,y]=vPix(q,r,z),c=B[k];const tgt=o.tokT&&o.tokT.has(k);
  g+=`<g ${tgt?`data-a="vtok" data-v="${k}" role="button" class="vtap"`:''}>${vTileSVG(c,ox+x,oy+y,z-1,{glow:tgt})}</g>`}
 for(const[q,r]of sp){const k=q+','+r;if(ghost&&ghost.q===q&&ghost.r===r)continue;const[x,y]=vPix(q,r,z);g+=`<g data-a="vspot" data-v="${k}" role="button" class="vtap"><polygon points="${vHexPts(ox+x,oy+y,z-3)}" fill="#f7c94818" stroke="#f7c948" stroke-width="1.6" stroke-dasharray="4 3"/><text x="${ox+x}" y="${oy+y+5}" font-size="14" text-anchor="middle" fill="#f7c948">＋</text></g>`}
 if(ghost){const[x,y]=vPix(ghost.q,ghost.r,z);g+=`<g class="vghost">${vTileSVG({t:ghost.t,rot:ghost.rot,tok:null},ox+x,oy+y,z-1,{sel:1})}</g>`}
 return`<svg class="vboard" viewBox="0 0 ${W} ${H.toFixed(0)}" width="${W}" height="${H.toFixed(0)}" role="img" aria-label="Valle di ${esc(s.names[p])}">${g}</svg>`}
function vMiniTile(t,sel){const c={t,rot:0,tok:null};return`<svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">${vTileSVG(c,28,28,25,{sel})}</svg>`}
function valleH(){if(ui.tv)return valleTVH();const s=G,mine=myTurn(),me=s.cur,L=local();
 const view=ui.vview!=null&&ui.vview<s.n?ui.vview:(mine?me:(L.length?L[0]:me));const b=s.boards[me];
 const live=(()=>{try{return VALLE.score(s).map(d=>d.tot)}catch(e){return s.names.map(()=>0)}})();
 const pl=`<div class="players" id="players">${s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''} ${i===view?'vsee':''}" style="border-color:${VPC[i]}" data-a="vview" data-v="${i}" role="button" tabindex="0"><div class="av" style="background:${VPC[i]}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">🌰${s.boards[i].nature} ${s.over?s.over.scores[i]:live[i]}★</span></div>`).join('')}</div>`;
 const pick=s.phase==='pick'&&mine&&view===me,tokPh=s.phase==='token'&&mine&&view===me;const free=!!ui.vfree,ti=ui.vtile,ki=free?ui.vtk:ti;
 const spots=pick&&ti!=null&&(!free||ki!=null)?VALLE.spots(s,me):[];const ghost=pick&&ui.vspot&&ti!=null&&s.disp[ti].t?{q:ui.vspot[0],r:ui.vspot[1],t:s.disp[ti].t,rot:ui.vrot||0}:null;
 const tokT=tokPh?new Set(VALLE.tokSpots(s,me,s.held).map(([q,r])=>q+','+r)):null;
 const board=`<div class="vwrap">${vBoardH(s,view,{spots,ghost,tokT})}</div><div class="vleg">${'MFPWR'.split('').map(h=>`<span><i class="vsw" style="background:${VHC[h]}"></i>${VHI[h]} ${VALLE.HN[h]}</span>`).join('')}</div>`;
 const wipe=ui.vwipe||[];
 const disp=`<div class="vdisp">${s.disp.map((d,i)=>{const tsel=ti===i,ksel=free?ui.vtk===i:ti===i,wsel=wipe.includes(i);
  return`<div class="vpair ${tsel||ksel?'sel':''}"><button class="vpt ${tsel?'on':''}" ${pick?`data-a="vtile" data-v="${i}"`:'disabled'} aria-label="Tessera ${i+1}">${d.t?vMiniTile(d.t):''}</button><button class="vpk ${ksel?'on':''} ${wsel?'wipe':''}" ${pick&&(free||ui.vwmode)?`data-a="vtk" data-v="${i}"`:pick?`data-a="vtile" data-v="${i}"`:'disabled'} aria-label="${d.k?VALLE.AN[d.k]:'vuoto'}">${d.k?VAI[d.k]:''}</button></div>`}).join('')}</div>`;
 let ctl='';
 if(pick&&!ui.vwmode){if(ghost)ctl=`<button class="b sm" data-a="vrot" data-v="-1" aria-label="Ruota a sinistra">↺</button><button class="b sm" data-a="vrot" data-v="1" aria-label="Ruota a destra">↻</button><button class="b sm gold" data-a="vgo">Posa</button><button class="b sm disc" data-a="vcancel">Annulla</button>`;
  else{if(b.nature>0)ctl+=`<button class="b sm ${free?'gold':''}" data-a="vfree">🌰 Scelta libera</button><button class="b sm" data-a="vwmode">🌰 Cambia animali</button>`;if(VALLE.three(s)&&!s.used3)ctl+=`<button class="b sm" data-a="vthree">Rimescola i 3 uguali</button>`;if(ti!=null)ctl+=`<button class="b sm disc" data-a="vcancel">Annulla</button>`}}
 if(pick&&ui.vwmode)ctl=`<button class="b sm gold" data-a="vwgo" ${wipe.length?'':'disabled'}>Cambia ${wipe.length||''}</button><button class="b sm disc" data-a="vcancel">Annulla</button>`;
 if(tokPh)ctl=`<span class="vheld">${VAI[s.held]}</span><button class="b sm disc" data-a="vskip">Lascia andare</button>`;
 let hint='Scegli una coppia tessera + animale, poi tocca dove posare la tessera.';
 if(ui.vwmode)hint='Tocca gli animali da rimettere nel sacchetto (costa una pigna).';else if(free&&ti==null)hint='Scelta libera: tocca una tessera…';else if(free&&ki==null)hint='…e poi un animale qualsiasi.';else if(ghost)hint='Ruota la tessera per allineare gli habitat, poi Posa.';else if(ti!=null)hint='Tocca una casella ＋ accanto alla tua valle.';
 if(tokPh)hint=tokT.size?'Tocca una tessera evidenziata per far arrivare '+VALLE.AN[s.held].toLowerCase()+'.':'Nessun posto libero: lascia andare l’animale.';
 if(mine&&view!==me)hint='Stai guardando la valle di '+s.names[view]+': tocca il tuo nome per tornare.';
 const goals=ui.vgoal?`<div class="vgoals">${Object.keys(VGOAL).map(a=>`<div><b>${VAI[a]} ${VALLE.AN[a]}</b> ${VGOAL[a]}</div>`).join('')}<div><b>🏞️ Corridoi</b> 1 punto per tessera del corridoio più grande di ogni habitat, più il bonus a chi ha il più lungo.</div></div>`:'';
 const end=s.over&&!ui.anim?valleEnd(s):'';
 return`${hudH('Valle Selvaggia')}<div class="tinfo"><span class="chip">⏳ ${s.left[s.cur]} turni</span><span class="chip">Tessere ${s.pile.length}</span><button class="chip vgbtn" data-a="vgoal">${ui.vgoal?'Chiudi obiettivi':'Obiettivi'}</button></div>${pl}${goals}${board}${bubbleH(s,hint,null)}<div class="hlabel">Il sentiero</div>${disp}<div class="ctl vctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div>${end}${rulesH()}${cfgH()}`}
function valleEnd(s){const o=s.over,w=o.win;const row=(lab,f)=>`<tr><th>${lab}</th>${s.names.map((_,i)=>`<td>${f(o.det[i])}</td>`).join('')}</tr>`;
 return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${w==null?'🤝':'🏞️'}</div><h2>${w==null?'Pareggio!':'Vince '+esc(s.names[w])+'!'}</h2>
 <table class="vscore"><tr><th></th>${s.names.map(n=>`<th>${esc(n)}</th>`).join('')}</tr>${'oasfv'.split('').map(a=>row(VAI[a],d=>d.an[a])).join('')}${'MFPWR'.split('').map(h=>row(`<i class="vsw" style="background:${VHC[h]}"></i> ${VHI[h]}`,d=>d.cor[h]+(d.bon[h]?'<small>+'+d.bon[h]+'</small>':''))).join('')}${row('🌰',d=>d.nat)}<tr class="tot"><th>Totale</th>${o.scores.map((v,i)=>`<td class="${o.winners.includes(i)?'w':''}">${v}</td>`).join('')}</tr></table>
 <div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function vReset(){ui.vtile=null;ui.vtk=null;ui.vspot=null;ui.vrot=0;ui.vfree=false;ui.vwmode=false;ui.vwipe=[]}
function valClick(a,v){const s=G;
 if(a==='vview'){ui.vview=+v;return render()}
 if(a==='vgoal'){ui.vgoal=!ui.vgoal;return render()}
 if(a==='vcancel'){vReset();ui.err='';return render()}
 if(!myTurn())return;ui.err='';
 if(a==='vtile'){const i=+v;if(ui.vwmode)return valClick('vtk',v);ui.vtile=ui.vtile===i?null:i;ui.vspot=null;ui.vrot=0;return render()}
 if(a==='vtk'){const i=+v;if(ui.vwmode){const w=ui.vwipe||[];ui.vwipe=w.includes(i)?w.filter(x=>x!==i):[...w,i];return render()}ui.vtk=ui.vtk===i?null:i;ui.vspot=null;return render()}
 if(a==='vfree'){const f=!ui.vfree;vReset();ui.vfree=f;return render()}
 if(a==='vwmode'){vReset();ui.vwmode=true;return render()}
 if(a==='vwgo'){const idx=ui.vwipe||[];vReset();return dispatch({t:'wipe',idx})}
 if(a==='vthree'){vReset();return dispatch({t:'wipe3'})}
 if(a==='vspot'){const[q,r]=v.split(',').map(Number);ui.vspot=[q,r];ui.vrot=ui.vrot||0;return render()}
 if(a==='vrot'){ui.vrot=((ui.vrot||0)+(+v)+6)%6;Snd.play('ok');return render()}
 if(a==='vgo'){if(!ui.vspot||ui.vtile==null)return;const act={t:'place',tile:ui.vtile,tok:ui.vfree?ui.vtk:ui.vtile,q:ui.vspot[0],r:ui.vspot[1],rot:ui.vrot||0};vReset();return dispatch(act)}
 if(a==='vtok'){const[q,r]=v.split(',').map(Number);return dispatch({t:'token',q,r})}
 if(a==='vskip')return dispatch({t:'skip'})}
const VLFX={async pre(){return{}},async run(prev,ns){ui.vview=null;for(const e of ns.ev){
  if(e.t==='place'){Snd.play('deal');await W(140)}
  else if(e.t==='token'){Snd.play(e.pine?'redeem':'ok');if(e.pine)banner('Pigna!','Tessera chiave di volta');await W(e.pine?500:160)}
  else if(e.t==='wipe'){Snd.play('impact');await W(220)}
  else if(e.t==='end'){banner('LA VALLE È COMPLETA','Si contano i punti');Snd.play('win');await W(900)}}
  endFx(ns)}};
