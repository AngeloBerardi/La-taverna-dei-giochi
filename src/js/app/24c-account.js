/* ---- Account e classifiche: modale con email (collega / accedi / password dimenticata) e classifiche (dati: FB, ELO) ---- */
const Acc={
 rows:{},key:'wins',msg:'',busy:false,f:{mail:'',pw:''}, // f: testo dei campi (render() li ridisegna: si tiene qui)
 ERR:{'auth/email-already-in-use':'Questa email ha già un profilo: usa «Accedi».','auth/weak-password':'Password troppo corta (almeno 6 caratteri).','auth/invalid-email':'Email non valida.',
  'auth/invalid-credential':'Email o password errate.','auth/wrong-password':'Email o password errate.','auth/user-not-found':'Email o password errate.','auth/operation-not-allowed':'Accesso con email non attivo nella console Firebase.',
  'auth/network-request-failed':'Nessuna connessione.','auth/credential-already-in-use':'Questa email ha già un profilo: usa «Accedi».','auth/too-many-requests':'Troppi tentativi, riprova tra poco.'},
 cfgH(){return FB.st==='ok'&&FB.p?'<button class="b sm" data-a="acc">Account 👤</button><button class="b sm" data-a="top">Classifica 🏆</button>':''},
 chiavi(){return[{k:'wins',n:'Vittorie',c:'wins'},{k:'played',n:'Partite',c:'played'},{k:'coins',n:'Monete',c:'coins'},
  ...GAMES.filter(g=>ELO.competitivo(g.id)&&g.id!=='mindx').map(g=>({k:'elo.'+g.id,n:'ELO '+g.name,c:'elo.'+g.id}))]},
 val(r,k){return k.startsWith('elo.')?(r.elo||{})[k.slice(4)]:r[k]},
 html(){return ui.acc==='top'?Acc.topH():Acc.accH()},
 accH(){const m=FB.mail(),ok=FB.st==='ok'&&FB.p;
  return`<div class="modal"><div class="box col"><h2>Account</h2>
<p class="muted" style="margin:0">${!ok?'Profilo online non disponibile.':m?'Collegato a <b>'+esc(m)+'</b>. Puoi ritrovare monete, dorsi e ELO da qualsiasi telefono.':'Ora il tuo profilo vive solo su questo telefono. Collegalo a un\'email per non perderlo.'}</p>
${ok&&!m?`<input class="acc-in" id="acc-mail" type="email" autocomplete="email" placeholder="Email" inputmode="email" value="${esc(Acc.f.mail)}"><input class="acc-in" id="acc-pw" type="password" autocomplete="new-password" placeholder="Password (almeno 6 caratteri)" value="${esc(Acc.f.pw)}">
<div class="row"><button class="b sm gold" data-a="acclink">Collega email</button><button class="b sm" data-a="accin">Accedi</button><button class="b sm" data-a="accreset">Password dimenticata</button></div>
<small class="muted">«Accedi» passa al profilo già legato a quell'email: quello anonimo di questo telefono resta indietro.</small>`:''}
${ok&&m?'<div class="row"><button class="b sm" data-a="accout">Esci da questo telefono</button></div><small class="muted">Dopo l\'uscita questo telefono ripartisce con un nuovo profilo anonimo.</small>':''}
<p class="acc-msg" role="status">${esc(Acc.msg)}</p><button class="b sm" data-a="accx">Chiudi</button></div></div>`},
 topH(){const ch=Acc.chiavi(),cur=ch.find(c=>c.k===Acc.key)||ch[0],rows=Acc.rows[cur.k];
  const riga=(r,i)=>`<li class="${r.uid===FB.uid?'me':''}"><span>${i+1}</span><b>${esc(r.name||'?')}</b><em>${Acc.val(r,cur.k)}</em></li>`;
  return`<div class="modal"><div class="box col"><h2>Classifica</h2>
<div class="chips">${ch.map(c=>`<button class="chip ${c.k===cur.k?'on':''}" data-a="topk" data-v="${c.k}">${esc(c.n)}</button>`).join('')}</div>
${cur.k.startsWith('elo.')?'<small class="muted">ELO: si parte da '+ELO.BASE+'. Contano solo le partite competitive tra giocatori con profilo online (niente ospiti).</small>':''}
${rows==null?'<p class="muted">Carico…</p>':rows.length?`<ol class="top">${rows.map(riga).join('')}</ol>`:'<p class="muted">Ancora nessuno in classifica.</p>'}
<button class="b sm" data-a="accx">Chiudi</button></div></div>`},
 async carica(k){Acc.rows[k]=null;render();try{Acc.rows[k]=await FB.top(k)}catch(e){Acc.rows[k]=[];Acc.msg='Classifica non disponibile';console.warn('Classifica',e)}render()},
 async act(a,v){
  if(a==='acc'){ui.acc='acc';ui.cfg=false;Acc.msg='';return render()}
  if(a==='top'){ui.acc='top';ui.cfg=false;return Acc.carica(Acc.key)}
  if(a==='accx'){ui.acc=false;ui.cfg=true;return render()}
  if(a==='topk'){Acc.key=v;return Acc.carica(v)}
  if(Acc.busy||FB.st!=='ok')return;
  const mail=Acc.f.mail.trim(),pw=Acc.f.pw;
  if(a!=='accout'&&!mail){Acc.msg='Scrivi l\'email.';return render()}
  if((a==='acclink'||a==='accin')&&!pw){Acc.msg='Scrivi la password.';return render()}
  Acc.busy=true;Acc.msg='Un attimo…';render();
  try{
   if(a==='acclink'){await FB.collega(mail,pw);Acc.msg='Fatto: profilo collegato.'}
   else if(a==='accin'){await FB.entra(mail,pw);Acc.msg='Accesso eseguito.'}
   else if(a==='accreset'){await FB.reset(mail);Acc.msg='Se l\'email ha un profilo, ti abbiamo scritto per cambiare la password.'}
   else if(a==='accout'){await FB.esci();Acc.msg='Sei uscito.'}
  }catch(e){Acc.msg=Acc.ERR[e&&e.code]||'Non riuscito, riprova tra poco.';console.warn('Account',e)}
  finally{Acc.busy=false;Acc.f.pw='';render()}}};
document.addEventListener('input',e=>{if(e.target.id==='acc-mail')Acc.f.mail=e.target.value;else if(e.target.id==='acc-pw')Acc.f.pw=e.target.value});
