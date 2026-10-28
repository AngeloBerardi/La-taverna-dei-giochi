/* ---- Regicidio X: carte degli eroi, sigilli dei tratti, poteri ----
   La vista è quella di Regicidio (13-regicide.js e, sullo schermo comune, 24j-regicide-tv.js): qui ci sono solo i pezzi in più,
   chiamati da lì quando G.g==='regix'. Motore: motori/37-regicide-x.js (RGX). */
const RX={
 /* nomi e motti dei mostri di Regicidio X (Regicidio usa TITLES e QUOTES di 02-narrazione.js) */
 TITLES:{JH:'Il Famiglio della Notte',QH:'La Contessa Cremisi',KH:'Il Signore dei Pipistrelli',JD:'Il Guardiano di Quarzo',QD:'La Matriarca delle Gemme',KD:'Il Colosso d’Ambra',
  JC:'Il Fauno dei Rovi',QC:'La Driade Antica',KC:'Il Re del Bosco',JS:'Lo Scheletro d’Arme',QS:'La Dama Spettrale',KS:'Il Re Lich'},
 QUOTES:{JH:'Il padrone ha sete, e voi siete in ritardo.',QH:'Restate per cena. Anzi, siate la cena.',KH:'La notte è mia, e ogni goccia con lei.',
  JD:'Nessuno passa la miniera.',QD:'Ogni gemma ha un prezzo. Anche voi.',KD:'Il mio cuore brucia da mille anni.',
  JC:'Danzate, o vi faranno danzare i rovi.',QC:'Il bosco ricorda chi lo ferisce.',KC:'Le mie radici arrivano fino al trono.',
  JS:'Ho servito un re. Ora servo la morte.',QS:'Il mio lamento è il vostro addio.',KS:'La corona non cade con chi la porta.'},
 /* atti dell'assedio: nomi propri di Regicidio X (Regicidio usa ACTS) */
 ACTS:{J:['Assedio I','La Breccia'],Q:['Assedio II','Corte Ribelle'],K:['Assedio III','Trono Infranto']},
 /* carta dell'eroe: stessa carta crema di Regicidio, ritratto dipinto (FACE.eroe), nastro col nome della classe */
 carta(k,o={}){if(!k||!RGX.CLS[k])return'';const c=RGX.CLS[k];
  return`<div class="card fz eroe ${k} ${o.cls||''}" ${o.attrs||''} ${o.style?`style="${o.style}"`:''}><div class="ix">${ic(c.ic,16)}</div>${FACE.eroe(k)}<div class="enm">${c.n}</div></div>`},
 /* sigillo di ceralacca col tratto del nemico, appeso alla cornice del boss */
 sigillo(en,cls=''){if(!en||!en.tr)return'';const t=RGX.TR[en.tr];
  return`<button class="sigillo ${cls}" data-a="rxtr" aria-label="Tratto del nemico: ${t.n}">${ic(t.ic,22)}<span>${t.n}</span></button>`},
 imm(en){if(en.can)return'immunità annullata';const su=P(en.c).s;return IMMTXT[su]+(en.im2?' e '+IMMTXT[en.im2]:'')},
 simboli(en){return SYM[P(en.c).s]+(en.im2?' '+SYM[en.im2]:'')},
 /* chi può ancora usare il potere: per i gettoni dei giocatori */
 mini(s,i){const k=s.cls[i];if(!k)return'';return`<i class="rxc ${s.pw[i]?'usato':''}" title="${RGX.CLS[k].n}: ${RGX.CLS[k].p}${s.pw[i]?' (usato)':''}">${ic(RGX.CLS[k].ic,14)}</i>`},
 /* Bastione: il Guardiano lo alza anche quando non è il suo turno (motore: azione ward con by) */
 puoBastione(s,i){return s.cls[i]==='gua'&&!s.pw[i]&&s.phase==='discard'&&s.owed>0&&!s.over&&isMine(i)&&!ui.busy&&!ui.anim&&!ui.story},
 /* barra dell'eroe sul telefono: carta dipinta, potere e il suo bottone */
 barra(s,owner){if(owner<0||!s.cls[owner])return'';const k=s.cls[owner],c=RGX.CLS[k],usato=s.pw[owner],turno=owner===s.cur&&myTurn();
  let btn='',stato='pronto';
  if(usato)stato='usato';
  else if(c.use==='play'&&turno&&s.phase==='play')btn=`<button class="b ${ui.pw?'gold':'grn'} sm" data-a="rxpw" aria-pressed="${!!ui.pw}">${ui.pw?'Pronto con l’attacco':'Prepara '+c.p}</button>`;
  else if(c.use==='vision'&&turno&&s.phase==='play')btn=`<button class="b grn sm" data-a="rxvis">${c.p}: pesca 2</button>`;
  else if(c.use==='ward'&&RX.puoBastione(s,owner))btn=`<button class="b disc sm" data-a="rxward" data-v="${owner}">${c.p}: −5 danni</button>`;
  return`<div class="rxbar ${stato} ${ui.pw&&!usato?'armato':''}">${RX.carta(k,{cls:'sm2',attrs:`data-a="rxinfo" data-v="eroe:${owner}" tabindex="0" role="button" aria-label="Carta di ${esc(c.n)}"`})}
   <div class="rxp"><b>${c.p}${usato?' <small>usato</small>':''}</b><span>${usato?'Torna disponibile col prossimo nemico.':esc(c.d)}</span>${s.camp&&s.art.length?`<div class="rxarts">${s.art.map(k=>RX.medaglia(k,'art')).join('')}</div>`:''}</div>${btn}</div>`},
 /* finestra di dettaglio: carta grande dell'eroe o sigillo del tratto */
 info(s){const i=ui.rxinfo;if(!i)return'';let h='';
  if(i.startsWith('eroe:')){const p=+i.slice(5),k=s.cls[p],c=RGX.CLS[k];if(!c)return'';
   h=`<div class="rxzoom">${RX.carta(k,{style:'--cw:min(56vw,230px)'})}</div><h2>${c.n} · ${esc(s.names[p])}</h2><p><b>${c.p}.</b> ${esc(c.d)}</p><p class="muted">Una volta per nemico: si ricarica quando ne arriva uno nuovo.</p>`}
  else if(i.startsWith('art:')||i.startsWith('sig:')){const t=i.slice(0,3),k=i.slice(4),d=t==='art'?RGX.ART[k]:RGX.SIG[k];if(!d)return'';
   h=`<div class="rxzoom">${RX.medaglia(k,t,'big')}</div><h2>${d.n}</h2><p>${esc(d.d)}</p><p class="muted">${t==='art'?'Artefatto: vale per tutta la scalata.':'Sigillo: vale per la carta su cui è impresso.'}</p>`}
  else{const en=s.en;if(!en||!en.tr)return'';const t=RGX.TR[en.tr];
   h=`<div class="rxzoom">${RX.sigillo(en,'big')}</div><h2>${t.n}</h2><p>${esc(t.d)}</p><p class="muted">${RN[P(en.c).r]} di ${SN[P(en.c).s]}: ${RX.imm(en)}.</p>`}
  return`<div class="modal" data-a="rxinfox"><div class="box col rxinfo">${h}<button class="b gold" data-a="rxinfox">Chiudi</button></div></div>`},
 /* ---- campagna (solitario): scalata della torre in 8 piani, stessa estetica delle carte dipinte ---- */
 tappa(s){const r=s.camp,n=r.map[r.at]&&r.map[r.at].find(x=>x.id===r.node);return`Torre · piano ${r.at+1} di ${RGX.LAYERS}${n?' · '+RGX.NODE[n.type].n:''}`},
 sig(s,c){const k=((s.camp&&s.fase!=='fight'?s.camp.sig:s.sig)||{})[c];return k?`<i class="rxsig" title="${RGX.SIG[k].n}: ${esc(RGX.SIG[k].d)}">${ic(RGX.SIG[k].ic,12)}</i>`:''},
 medaglia(k,tipo,cls=''){const d=tipo==='art'?RGX.ART[k]:RGX.SIG[k];return`<button class="rxmed ${tipo} ${cls}" data-a="rxinfo" data-v="${tipo}:${k}" aria-label="${d.n}">${ic(d.ic,cls==='big'?30:18)}</button>`},
 testa(s){const r=s.camp;
  return`<div class="rxtop">${RX.carta(r.cls,{cls:'sm3',attrs:`data-a="rxinfo" data-v="eroe:0" tabindex="0" role="button" aria-label="La tua classe"`})}
   <div class="rxtop-i"><b>Piano ${Math.max(0,r.at+1)} di ${RGX.LAYERS}</b><span>${ic('star',14)} ${r.jl} Jolly · ${r.deck.length} carte</span>
   <div class="rxarts">${r.art.map(k=>RX.medaglia(k,'art')).join('')}${Array.from({length:RGX.MAXART-r.art.length},()=>'<i class="rxmed vuoto"></i>').join('')}</div></div>
   <button class="b sm" data-a="rxdeck">Mazzo</button></div>`},
 mappa(s){const r=s.camp,H=RGX.LAYERS,reach=RGX.reachable(r),W=340,ST=62,top=26,pos=(l,i,w)=>({x:Math.round(W/2+(i-(w-1)/2)*(w>2?104:120)),y:top+(H-1-l)*ST});
  let lines='',nodes='';
  r.map.forEach((ly,l)=>ly.forEach((n,i)=>{const a=pos(l,i,ly.length);
   if(l<H-1)n.next.forEach(j=>{const b=pos(l+1,j,r.map[l+1].length),on=r.node===n.id&&r.at===l;lines+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${on?'on':''}"/>`});
   const fatto=l<=r.at,cur=r.node===n.id,go=reach.includes(n.id)&&r.phase==='map',N=RGX.NODE[n.type];
   nodes+=`<button class="rxnd ${n.type} ${cur?'cur':''} ${go?'go':''} ${fatto&&!cur?'fatto':''}" style="left:${a.x}px;top:${a.y}px" ${go?`data-a="rxgo" data-v="${n.id}"`:'disabled'} aria-label="${N.n}, piano ${l+1}">${ic(N.ic,n.type==='boss'?26:20)}</button>`}));
  return`<div class="rxmap" style="height:${top*2+(H-1)*ST}px"><svg width="${W}" height="${top*2+(H-1)*ST}" aria-hidden="true">${lines}</svg>${nodes}</div>
   <div class="rxleg">${Object.entries(RGX.NODE).map(([k,v])=>`<span class="${k}">${ic(v.ic,14)} ${v.n}</span>`).join('')}</div>`},
 opzione(o,i){if(o.t==='card')return`<button class="rxopt" data-a="rxtake" data-v="${i}">${cardH(o.c,{style:'--cw:76px'})}<b>${RGX.fmt(o.c)}</b><small>Nuova carta nel mazzo</small></button>`;
  const d=o.t==='art'?RGX.ART[o.k]:RGX.SIG[o.k];
  return`<button class="rxopt ${o.t}" data-a="rxtake" data-v="${i}"><span class="rxmed ${o.t} big">${ic(d.ic,30)}</span><b>${d.n}</b><small>${o.t==='sig'?'Sigillo · ':'Artefatto · '}${esc(d.d)}</small></button>`},
 griglia(s,act,sel){const r=s.camp;return`<div class="rxdeck">${r.deck.slice().sort((a,b)=>'HDCS'.indexOf(RGX.P(a).s)-'HDCS'.indexOf(RGX.P(b).s)||RGX.cv(a)-RGX.cv(b)).map(c=>`<button class="rxdc ${c===sel?'sel':''}" ${act?`data-a="${act}" data-v="${c}"`:''} aria-label="${RGX.fmt(c)}">${cardH(c,{style:'--cw:52px'})}${RX.sig(s,c)}</button>`).join('')}</div>`},
 tile(a,v,icn,t,d){return`<button class="rxopt" data-a="${a}" data-v="${v}"><span class="rxmed big">${ic(icn,30)}</span><b>${t}</b><small>${d}</small></button>`},
 sceltaH(s){const r=s.camp,ch=r.choice;if(!ch)return'';const salta='<button class="b sm" data-a="rxskip">Salta</button>';
  if(ch.type==='reward')return`<h3 class="rxh">Bottino</h3><div class="rxopts">${ch.opts.map(RX.opzione).join('')}</div>${salta}`;
  if(ch.type==='chest')return`<h3 class="rxh">Tesoro: scegli un artefatto</h3><div class="rxopts">${ch.opts.map(RX.opzione).join('')}</div>${salta}`;
  if(ch.type==='fadd')return`<h3 class="rxh">Fucina: forgia una carta</h3><div class="rxopts">${ch.opts.map(RX.opzione).join('')}</div>${salta}`;
  if(ch.type==='fsig')return`<h3 class="rxh">Fucina: scegli un sigillo</h3><div class="rxopts">${ch.opts.map(RX.opzione).join('')}</div>${salta}`;
  if(ch.type==='apply')return`<h3 class="rxh">Imprimi ${RGX.SIG[ch.k].n} su una carta</h3><p class="muted rxp2">${esc(RGX.SIG[ch.k].d)}</p>${RX.griglia(s,'rxapply')}`;
  if(ch.type==='forge')return`<h3 class="rxh">Fucina</h3><div class="rxopts">${RX.tile('rxforge','add','plus','Forgia','Una carta nuova, di valore 4 o più')+RX.tile('rxforge','sig','scintilla','Sigillo','Imprimi un sigillo su una carta')+RX.tile('rxforge','fuse','scambio','Fondi','Due carte dello stesso seme diventano una')+RX.tile('rxforge','purge','x','Rimuovi','Togli una carta debole')}</div>${salta}`;
  if(ch.type==='rest')return`<h3 class="rxh">Falò</h3><div class="rxopts">${RX.tile('rxrest','jl','star','Riposa','+1 Jolly (massimo 4)')+RX.tile('rxrest','purge','x','Medita','Togli una carta dal mazzo')}</div>${salta}`;
  if(ch.type==='fuse')return`<h3 class="rxh">Fondi due carte dello stesso seme</h3><p class="muted rxp2">${ch.first?'Prima carta: '+RGX.fmt(ch.first)+'. Scegli la seconda (somma massimo 10).':'Scegli la prima carta.'}</p>${RX.griglia(s,'rxfuse',ch.first)}${salta}`;
  if(ch.type==='purge')return`<h3 class="rxh">Togli una carta dal mazzo</h3>${RX.griglia(s,'rxpurge')}${salta}`;return''},
 campH(s){const r=s.camp,body=r.phase==='map'?`<h3 class="rxh">Scegli la prossima tappa</h3>${RX.mappa(s)}`:RX.sceltaH(s);
  return`${hudH(GN(s.g))}<div class="acttag">Scalata della torre · ${r.cleared} nemici sconfitti</div><div class="rxcamp">${RX.testa(s)}${body}<div class="err" role="alert">${esc(ui.err)}</div></div>
   ${ui.rxdeck?`<div class="modal" data-a="rxdeck"><div class="box col"><h2>Il tuo mazzo (${r.deck.length})</h2>${RX.griglia(s,'')}<button class="b gold" data-a="rxdeck">Chiudi</button></div></div>`:''}${RX.info(s)}${endH()}${rulesH()}${cfgH()}`},
 click(a,v){const s=G;
  if(a==='rxpw'){ui.pw=!ui.pw;Snd.play(ui.pw?'sel':'unsel');return render(),true}
  if(a==='rxvis'){ui.pw=false;return dispatch({t:'vision'}),true}
  if(a==='rxward')return dispatch({t:'ward',by:+v}),true;
  if(a==='rxtr'){ui.rxinfo='tr';return render(),true}
  if(a==='rxinfo'){ui.rxinfo=v;return render(),true}
  if(a==='rxinfox'){ui.rxinfo=null;return render(),true}
  if(a==='rxdeck'){ui.rxdeck=!ui.rxdeck;return render(),true}
  if(a==='rxgo')return dispatch({t:'go',id:v}),true;
  if(a==='rxtake')return dispatch({t:'take',i:+v}),true;
  if(a==='rxskip')return dispatch({t:'skip'}),true;
  if(a==='rxapply')return dispatch({t:'apply',c:v}),true;
  if(a==='rxforge')return dispatch({t:'forge',k:v}),true;
  if(a==='rxrest')return dispatch({t:'rest',k:v}),true;
  if(a==='rxfuse')return dispatch({t:'fuse',c:v}),true;
  if(a==='rxpurge')return dispatch({t:'purge',c:v}),true;
  return false}
};
const titolo=c=>(G&&G.g==='regix'?RX.TITLES:TITLES)[c]||'';
const motto=c=>(G&&G.g==='regix'?RX.QUOTES:QUOTES)[c]||'';
