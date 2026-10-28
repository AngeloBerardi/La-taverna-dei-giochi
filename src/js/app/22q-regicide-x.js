/* ---- Regicidio X: carte degli eroi, sigilli dei tratti, poteri ----
   La vista è quella di Regicidio (13-regicide.js e, sullo schermo comune, 24j-regicide-tv.js): qui ci sono solo i pezzi in più,
   chiamati da lì quando G.g==='regix'. Motore: motori/37-regicide-x.js (RGX). */
const RX={
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
   <div class="rxp"><b>${c.p}${usato?' <small>usato</small>':''}</b><span>${usato?'Torna disponibile col prossimo nemico.':esc(c.d)}</span></div>${btn}</div>`},
 /* finestra di dettaglio: carta grande dell'eroe o sigillo del tratto */
 info(s){const i=ui.rxinfo;if(!i)return'';let h='';
  if(i.startsWith('eroe:')){const p=+i.slice(5),k=s.cls[p],c=RGX.CLS[k];if(!c)return'';
   h=`<div class="rxzoom">${RX.carta(k,{style:'--cw:min(56vw,230px)'})}</div><h2>${c.n} · ${esc(s.names[p])}</h2><p><b>${c.p}.</b> ${esc(c.d)}</p><p class="muted">Una volta per nemico: si ricarica quando ne arriva uno nuovo.</p>`}
  else{const en=s.en;if(!en||!en.tr)return'';const t=RGX.TR[en.tr];
   h=`<div class="rxzoom">${RX.sigillo(en,'big')}</div><h2>${t.n}</h2><p>${esc(t.d)}</p><p class="muted">${RN[P(en.c).r]} di ${SN[P(en.c).s]}: ${RX.imm(en)}.</p>`}
  return`<div class="modal" data-a="rxinfox"><div class="box col rxinfo">${h}<button class="b gold" data-a="rxinfox">Chiudi</button></div></div>`},
 click(a,v){const s=G;
  if(a==='rxpw'){ui.pw=!ui.pw;Snd.play(ui.pw?'sel':'unsel');return render(),true}
  if(a==='rxvis'){ui.pw=false;return dispatch({t:'vision'}),true}
  if(a==='rxward')return dispatch({t:'ward',by:+v}),true;
  if(a==='rxtr'){ui.rxinfo='tr';return render(),true}
  if(a==='rxinfo'){ui.rxinfo=v;return render(),true}
  if(a==='rxinfox'){ui.rxinfo=null;return render(),true}
  return false}
};
