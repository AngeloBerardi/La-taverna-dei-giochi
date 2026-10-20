/* ---- Campagna (anteprima): mappa a esagoni, giorno e notte, perdizione, prove di abilità. Regole: motori/28-campagna.js ---- */
const Camp={
 s:null,msg:'',seed:0,
 COL:{pianura:'#7a9a4a',strada:'#b79c6a',bosco:'#3e6b3a',collina:'#9a8a52',palude:'#566b52',montagna:'#6c6c78',acqua:'#2f5f8f'},
 ICO:{citta:'🏘',antro:'🕳',torre:'🗼',tesoro:'💰',campo:'⛺'},
 SZ:20,VISTA:4,
 xy(q,r){return[Camp.SZ*Math.sqrt(3)*(q+r/2),Camp.SZ*1.5*r]},
 hex(cx,cy,z){const p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);p.push((cx+z*Math.cos(a)).toFixed(1)+','+(cy+z*Math.sin(a)).toFixed(1))}return p.join(' ')},
 mappaH(s){const[px,py]=Camp.xy(s.party.q,s.party.r),W=Camp.SZ*Math.sqrt(3)*(Camp.VISTA*2+1),H=Camp.SZ*1.5*(Camp.VISTA*2+1)+Camp.SZ,vicini=new Set(CAMP.vicini(s.party.q,s.party.r).map(c=>c.q+','+c.r));
  let g='';for(const c of CAMP.celleRaggio(Camp.VISTA)){const q=s.party.q+c.q,r=s.party.r+c.r,x=s.celle[q+','+r];if(!x)continue;const[cx,cy]=Camp.xy(q,r);
   if(!x.visto){g+=`<polygon points="${Camp.hex(cx,cy,Camp.SZ-1)}" fill="#14110f"/>`;continue}
   const adj=vicini.has(q+','+r)&&CAMP.passabile(x.t),aqui=q===s.party.q&&r===s.party.r;
   g+=`<polygon points="${Camp.hex(cx,cy,Camp.SZ-1)}" fill="${Camp.COL[x.t]}" class="hx${adj?' adj':''}" ${adj?`data-a="campmuovi" data-v="${q},${r}"`:''}><title>${esc(CAMP.TERRENI[x.t].n)}</title></polygon>`;
   if(x.poi)g+=`<text x="${cx}" y="${cy+6}" text-anchor="middle" font-size="16" pointer-events="none">${Camp.ICO[x.poi]}</text>`;
   if(aqui)g+=`<circle cx="${cx}" cy="${cy}" r="9" fill="#f3d37a" stroke="#2a1a08" stroke-width="2" class="grp"/>`}
  return`<svg class="cmap" viewBox="${px-W/2} ${py-H/2} ${W} ${H}" role="img" aria-label="Mappa della campagna">${g}</svg>`},
 eroiH(s){return`<div class="cero">${s.eroi.map(e=>`<div class="ce${e.hp<=0?' ko':''}"><b>${esc(e.nome)}</b><span>${e.hp}/${e.hpMax} PF · CA ${e.ca}</span></div>`).join('')}</div>`},
 incontroH(s){const i=s.incontro,m=i.multi;
  const bottoni=s.eroi.map((e,n)=>e.hp<=0?'':`<div class="cprove"><b>${esc(e.nome)}</b>${i.ab.map(a=>`<button class="b sm" data-a="campris" data-v="${n}:${a}">${esc(a)} (${EROI.mod(EROI.punteggi(e.base,e.razza)[EROI.ABILITA[a]])>=0?'+':''}${EROI.mod(EROI.punteggi(e.base,e.razza)[EROI.ABILITA[a]])})</button>`).join('')}</div>`).join('');
  return`<div class="cinc"><b>${esc(i.testo)}</b><small>Difficoltà ${i.cd}${m?` · prove ${m.fatte}/${m.prove}, ne servono ${m.serve} riuscite (${m.riuscite} fin qui)`:''}</small>${bottoni}${m?'':'<button class="b sm" data-a="campfuggi">Fuggi</button>'}</div>`},
 html(){const s=Camp.s;
  if(!s)return`<div class="modal"><div class="box col camp"><h2>Campagna</h2><p class="muted">Scegli i tuoi eroi dalla scheda «Eroi» e parti.</p><button class="b sm" data-a="campx">Chiudi</button></div></div>`;
  const cella=s.celle[s.party.q+','+s.party.r],puo=cella.poi==='citta'||cella.poi==='antro'||cella.poi==='torre';
  const fine=s.over?`<div class="cfine ${s.over.win?'win':'lose'}"><b>${s.over.win?'Vittoria!':'Sconfitta'}</b><span>${esc(s.over.reason)}</span><button class="b sm gold" data-a="campnuova">Nuova campagna</button></div>`:'';
  return`<div class="modal"><div class="box col camp"><h2>${esc(s.missione.titolo)}</h2>
<div class="chud"><span>${s.fase==='giorno'?'☀':'☾'} Giorno ${s.giorno}</span><span>👣 ${s.pm}</span><span>💰 ${s.oro}</span><span class="cdoom" title="Perdizione">☠ ${s.perdizione}</span></div>
<div class="cbar"><i style="width:${s.perdizione}%"></i></div>
<small class="muted">Missione: ${esc(s.missione.passi[Math.min(s.missione.passo,2)]==='citta'?'parla in città':s.missione.passi[Math.min(s.missione.passo,2)]==='antro'?'ripulisci l\'antro':'abbatti la torre')}</small>
${Camp.mappaH(s)}${Camp.eroiH(s)}${fine}${!s.over&&s.incontro?Camp.incontroH(s):''}
${!s.over&&!s.incontro?`<div class="row"><button class="b sm" data-a="campentra" ${puo?'':'disabled'}>Entra</button><button class="b sm" data-a="campriposa">Riposa</button></div>`:''}
<div class="clog" role="log">${s.log.slice(-4).map(t=>`<p>${esc(t)}</p>`).join('')}</div><p class="acc-msg" role="status">${esc(Camp.msg)}</p><button class="b sm" data-a="campx">Chiudi</button></div></div>`},
 salva(){try{localStorage.setItem('camp',JSON.stringify({s:Camp.s}))}catch(e){}},
 riprendi(){try{const j=JSON.parse(localStorage.getItem('camp')||'null');if(j&&j.s&&j.s.g==='campagna')Camp.s=j.s}catch(e){}},
 cfgH(){return Eroi.lista&&Object.keys(Eroi.lista).length?'<button class="b sm gold" data-a="campstart">Campagna ⚔️</button>':''},
 // gli eroi vengono sempre riletti dal profilo: la scheda in memoria potrebbe non essere ancora stata caricata
 async parti(){let L=Eroi.lista;try{L=await FB.eroi();Eroi.lista=L}catch(e){console.warn('Camp',e)}
  const eroi=EROI.SLOT_ID.map(id=>L&&L[id]&&EROI.coerente(L[id])?{...L[id],slot:id}:null).filter(Boolean).slice(0,3);
  if(!eroi.length){Camp.msg='Crea prima un eroe.';return}Camp.seed=(Date.now()^(Math.random()*4294967296))>>>0;Camp.s=CAMP.nuova(eroi,Camp.seed);Camp.msg='';Camp.salva()},
 act(a,v){
  if(a==='campstart'){return(async()=>{if(!Camp.s||Camp.s.over)await Camp.parti();if(!Camp.s||Camp.s.over){render();return}ui.eroi=false;ui.camp=true;render()})()}
  if(a==='campx'){ui.camp=false;ui.eroi=true;return render()}
  if(a==='campnuova'){return(async()=>{await Camp.parti();render()})()}
  const s=Camp.s;if(!s)return;let r;
  if(a==='campmuovi'){const[q,rr]=v.split(',').map(Number);r=CAMP.act(s,{t:'muovi',q,r:rr})}
  else if(a==='campriposa')r=CAMP.act(s,{t:'riposa'});
  else if(a==='campentra')r=CAMP.act(s,{t:'entra'});
  else if(a==='campfuggi')r=CAMP.act(s,{t:'fuggi'});
  else if(a==='campris'){const[e,ab]=v.split(':');r=CAMP.act(s,{t:'risolvi',eroe:Number(e),abilita:ab})}
  if(!r)return;if(r.err){Camp.msg=r.err;return render()}Camp.msg='';Camp.s=r.s;Camp.salva();
  render()}
};
Camp.riprendi();
