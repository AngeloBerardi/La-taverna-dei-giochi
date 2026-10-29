/* ---- Campagna (anteprima): mappa a esagoni, giorno e notte, perdizione, prove di abilità. Regole: motori/28-campagna.js ---- */
const Camp={
 s:null,msg:'',seed:0,
 COL:{pianura:'#86a554',strada:'#c2a672',bosco:'#3f7a43',collina:'#a8955a',palude:'#5d7a62',montagna:'#7d7d8c',acqua:'#3a6ea5'},
 GLI:{bosco:'g_bosco',collina:'g_collina',palude:'g_palude',montagna:'g_montagna',acqua:'g_acqua'},
 ICO:{citta:'p_citta',antro:'p_antro',torre:'p_torre',tesoro:'p_tesoro',campo:'p_campo'},
 SZ:27,VISTA:3,
 xy(q,r){return[Camp.SZ*Math.sqrt(3)*(q+r/2),Camp.SZ*1.5*r]},
 hex(cx,cy,z){const p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);p.push((cx+z*Math.cos(a)).toFixed(1)+','+(cy+z*Math.sin(a)).toFixed(1))}return p.join(' ')},
 mappaH(s){const[px,py]=Camp.xy(s.party.q,s.party.r),W=Camp.SZ*Math.sqrt(3)*(Camp.VISTA*2+1.2),H=Camp.SZ*1.5*(Camp.VISTA*2+1)+Camp.SZ*.6,vic=new Set(CAMP.vicini(s.party.q,s.party.r).map(c=>c.q+','+c.r));
  let g='',top='';for(const c of CAMP.celleRaggio(Camp.VISTA)){const q=s.party.q+c.q,r=s.party.r+c.r,x=s.celle[q+','+r];if(!x)continue;const[cx,cy]=Camp.xy(q,r),Z=Camp.SZ-1.5;
   if(!x.visto){g+=`<polygon points="${Camp.hex(cx,cy,Z)}" fill="#1c1814" stroke="#2c261f" stroke-width="1.5"/>`;continue}
   const costo=CAMP.TERRENI[x.t].c,adj=vic.has(q+','+r)&&costo!=null,puoi=adj&&costo<=s.pm&&!s.incontro&&!s.over,aqui=q===s.party.q&&r===s.party.r;
   g+=`<polygon points="${Camp.hex(cx,cy,Z)}" fill="${Camp.COL[x.t]}" stroke="${puoi?'#f3d37a':'rgba(0,0,0,.4)'}" stroke-width="${puoi?3:1.5}" class="hx${puoi?' adj':''}" ${puoi?`data-a="campmuovi" data-v="${q},${r}"`:''}><title>${esc(CAMP.TERRENI[x.t].n)}</title></polygon>`;
   if(Camp.GLI[x.t]&&!x.poi)g+=glifo(Camp.GLI[x.t],cx,cy,16,'#000',.35);
   if(x.poi)g+=glifo(Camp.ICO[x.poi],cx,cy,24,'#fff',1);
   if(adj&&!aqui)top+=`<text x="${cx+Z*.5}" y="${cy-Z*.45}" text-anchor="middle" font-size="11" font-weight="800" fill="${puoi?'#fff':'#ff9a8a'}" stroke="#000" stroke-width="2.4" paint-order="stroke" pointer-events="none">${costo}</text>`;
   if(aqui)top+=`<circle cx="${cx}" cy="${cy}" r="11" fill="#f3d37a" stroke="#2a1a08" stroke-width="3" class="grp" pointer-events="none"/><text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="13" font-weight="900" fill="#2a1a08" pointer-events="none">${CAMP.vivi(s).length}</text>`}
  return`<svg class="cmap" viewBox="${(px-W/2).toFixed(1)} ${(py-H/2).toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}" role="img" aria-label="Mappa della campagna">${g}${top}</svg>`},
 eroiH(s){return`<div class="cero">${s.eroi.map(e=>`<div class="ce${e.hp<=0?' ko':''}">${Eroi.ritratto(e.aspetto,e.razza,e.classe,34)}<span><b>${esc(e.nome)}</b><span class="ehp sm"><i style="width:${Math.round(e.hp/e.hpMax*100)}%"></i><span>${e.hp}/${e.hpMax}</span></span></span></div>`).join('')}</div>`},
 ultimaH(s){const u=s.ultima;if(!u||s.incontro&&!s.incontro.multi)return'';const e=s.eroi[u.eroe];return`<div class="cdado ${u.ok?'ok':'ko'}"><span class="d20">${u.tiro}</span><span>${esc(e?e.nome:'')}: ${u.tiro}${u.tot-u.tiro>=0?' + ':' − '}${Math.abs(u.tot-u.tiro)} = <b>${u.tot}</b> contro ${u.cd} — <b>${u.ok?'riesce':'fallisce'}</b></span></div>`},
 incontroH(s){const i=s.incontro,m=i.multi;
  const righe=s.eroi.map((e,n)=>e.hp<=0?'':`<div class="cprove"><span class="cn">${Eroi.ritratto(e.aspetto,e.razza,e.classe,28)}<b>${esc(e.nome)}</b></span><div>${i.ab.map(a=>{const p=Math.round(EROI.probabilita(e,a,i.cd)*100);return`<button class="b sm pr p${p>=65?'a':p>=35?'m':'b'}" data-a="campris" data-v="${n}:${a}"><span>${EROI.NOME_AB[a]||esc(a)}</span><small>${p}%</small></button>`}).join('')}</div></div>`).join('');
  return`<div class="cinc"><b>${esc(i.testo)}</b><small>Difficoltà ${i.cd} · scegli chi prova e con quale abilità${m?` · ${m.fatte}/${m.prove} prove, ne servono ${m.serve} riuscite (${m.riuscite} fin qui)`:''}</small>${righe}${m?'':'<button class="b sm" data-a="campfuggi">Fuggi (−PF)</button>'}</div>`},
 qui(s){const c=s.celle[s.party.q+','+s.party.r],t=CAMP.TERRENI[c.t];return(c.poi?CAMP.NOME_POI[c.poi]+' · ':'')+t.n},
 html(){const s=Camp.s;
  if(!s)return`<div class="modal"><div class="box col camp"><h2>Campagna</h2><p class="muted">Dalla pagina Avventura scegli i tuoi eroi e parti.</p><button class="b sm" data-a="campx">Chiudi</button></div></div>`;
  const cella=s.celle[s.party.q+','+s.party.r],puo=cella.poi==='citta'||cella.poi==='antro'||cella.poi==='torre',pa=s.missione.passi[Math.min(s.missione.passo,2)];
  const fine=s.over?`<div class="cfine ${s.over.win?'win':'lose'}"><b>${s.over.win?'Vittoria!':'Sconfitta'}</b><span>${esc(s.over.reason)}</span><button class="b sm gold" data-a="campnuova">Nuova campagna</button></div>`:'';
  const dir=pa==='citta'?'Parla con il sindaco in città':pa==='antro'?'Ripulisci l\'antro':'Abbatti la torre oscura';
  return`<div class="modal"><div class="box col camp"><div class="chead"><h2>${esc(s.missione.titolo)}</h2><button class="b sm" data-a="campx" aria-label="Chiudi">${ic('x',18)}</button></div>
<div class="chud"><span>${ic(s.fase==='giorno'?'sole':'luna',16)} Giorno ${s.giorno}</span><span title="Movimento">${ic('passi',16)} ${s.pm}</span><span title="Monete">${ic('moneta',16)} ${s.oro}</span><span class="cdoom" title="Perdizione: a 100 la campagna è persa">${ic('teschio',16)} ${s.perdizione}/100</span></div>
<div class="cbar"><i style="width:${s.perdizione}%"></i></div>
<div class="cmis">${ic('bersaglio',16)} ${dir}</div>
${Camp.mappaH(s)}<div class="cqui">${ic('pin',16)} ${esc(Camp.qui(s))}</div>${Camp.eroiH(s)}${fine}${!s.over&&s.incontro?Camp.incontroH(s):''}${Camp.ultimaH(s)}
<div class="clog" role="log">${s.log.slice(-3).map(t=>`<p>${esc(t)}</p>`).join('')}</div><p class="acc-msg" role="status">${esc(Camp.msg)}</p>
${!s.over&&!s.incontro?`<div class="cbarra"><button class="b" data-a="campentra" ${puo?'':'disabled'}>Entra</button><button class="b" data-a="campriposa">${s.fase==='giorno'?'Riposa '+ic('luna',16):'Alba '+ic('sole',16)}</button></div>`:''}</div></div>`},
 salva(){try{localStorage.setItem('camp',JSON.stringify({s:Camp.s}))}catch(e){ERR.n(e)}},
 riprendi(){try{const j=JSON.parse(localStorage.getItem('camp')||'null');if(j&&j.s&&j.s.g==='campagna')Camp.s=CAMP.migra(j.s)}catch(e){ERR.n(e)}},
 cfgH(){return Eroi.lista&&Object.keys(Eroi.lista).length?'<button class="b sm gold" data-a="campstart">Campagna '+ic('spada',16)+'</button>':''},
 // gli eroi vengono sempre riletti dal profilo: la scheda in memoria potrebbe non essere ancora stata caricata
 async parti(){let L=Eroi.lista;try{L=await FB.eroi();Eroi.lista=L}catch(e){console.warn('Camp',e)}
  const eroi=EROI.SLOT_ID.map(id=>L&&L[id]&&EROI.coerente(L[id])?{...L[id],slot:id}:null).filter(Boolean).slice(0,CAMP.MAX_EROI);
  if(!eroi.length){Camp.msg='Crea prima un eroe.';return}Camp.seed=(Date.now()^(Math.random()*4294967296))>>>0;Camp.s=CAMP.nuova(eroi,Camp.seed);Camp.msg='';Camp.salva()},
 act(a,v){
  if(a==='campstart'){return(async()=>{if(!Camp.s||Camp.s.over)await Camp.parti();if(!Camp.s||Camp.s.over){render();return}ui.eroi=false;ui.camp=true;render()})()}
  if(a==='campx'){ui.camp=false;ui.avv=true;return render()}
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
