/* ================= HUD COMUNE (scheletro unico delle partite) =================
   Ogni partita ha le stesse fasce, sempre nello stesso posto e senza scorrimento: titolo e icone, una riga di fatti, i posti,
   il tavolo (prende lo spazio che resta), una riga di stato, i comandi, la mano e la barra dei fogli (Giocatori, Registro, Regole).
   Regole: un solo pulsante in ottone per schermata, legno per i secondari, testo per il resto; cornice solo a chi è di turno.
   I giochi passano qui uno alla volta: basta metterli in HUD2 e disegnare la vista con HUD.html (guida in docs/STYLE.md). */
const HUD2=new Set(['briscola','island']);
const HUD={
 /* posti: f(i) → {sotto: testo sotto il nome, t: squadra 0/1} */
 posti(s,f){return`<div class="h2-posti" id="players">${s.names.map((n,i)=>{const o=f(i)||{};
  return`<button class="h2-p${i===s.cur&&!s.over?' act':''}${o.t!=null?' t'+o.t:''}" data-a="fxsheet" data-v="players" aria-label="${esc(n)}${i===s.cur&&!s.over?', di turno':''}">`
   +`<span class="h2-av" id="av${i}">${esc((n[0]||'?').toUpperCase())}</span><span class="h2-n"><b>${esc(n)}</b><small>${o.sotto||''}</small></span></button>`}).join('')}</div>`},
 /* riga di stato: una frase forte e, sotto, una riga piccola (di solito l'ultima riga del registro) */
 riga(forte,sotto,mio){return`<div class="h2-st${mio?' me':''}" aria-live="polite"><b>${forte}</b><span class="h2-nar">${sotto||'&nbsp;'}</span></div>`},
 stato(s,aiuto){const ult=esc(s.log[s.log.length-1]||'');if(s.over||ui.anim)return HUD.riga('&nbsp;',ult);
  return myTurn()?HUD.riga('Tocca a te'+infoH(aiuto),ult,1):HUD.riga(`Tocca a ${esc(s.names[s.cur])}<span class="dots"></span>`,ui.busy?'invio mossa…':ult)},
 foglio(o){if(!ui.sheet)return'';const log=(G.log||[]).slice().reverse().map(l=>`<div>${esc(l)}</div>`).join('')||'<small>Ancora niente.</small>';
  const corpo=ui.sheet==='players'?`<h3>Giocatori</h3><div class="h2-el">${o.giocatori||''}</div>`:`<h3>Registro</h3><div class="h2-log">${log}</div>`;
  return`<div class="h2-fg" data-a="fxsheet" data-v=""><div class="h2-fc" onclick="event.stopPropagation()"><button class="h2-x" data-a="fxsheet" data-v="" aria-label="Chiudi">${ic('x',20)}</button>${corpo}</div></div>`},
 /* o: {titolo, fatti:[…], posti, tavolo, scheda, stato, azioni, mano, schede:[[a,v,icona,testo]…], giocatori, fine} */
 html(o){const tab=([a,v,i,t])=>`<button class="${a==='fxsheet'&&ui.sheet===v?'on':''}" data-a="${a}" data-v="${v}">${ic(i,20)}<span>${t}</span></button>`;
  const schede=o.schede||[...(G.n>1?[['fxsheet','players','amici','Giocatori']]:[]),['fxsheet','log','diario','Registro'],['rules',G.g,'libro','Regole']];
  return`<div class="h2"><div class="h2-top">${hudH(o.titolo)}${o.fatti&&o.fatti.length?`<div class="h2-fatti">${o.fatti.map(x=>`<span>${x}</span>`).join('')}</div>`:''}</div>${o.posti||''}`
   +`<div class="h2-tav">${o.tavolo||''}</div>${o.scheda||''}${o.stato||''}<div class="err" role="alert">${esc(ui.err)}</div>`
   +`<div class="h2-az">${o.azioni||''}</div>${o.mano?`<div class="handbox h2-mano">${o.mano}</div>`:''}<nav class="h2-tab">${schede.map(tab).join('')}</nav></div>`
   +`${HUD.foglio(o)}${o.fine||''}${rulesH()}${cfgH()}`}
};
