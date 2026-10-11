/* ---- comandi ---- */
document.addEventListener('click',async e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;const a=t.dataset.a,v=t.dataset.v;
 if(a!=='sel'&&a!=='tsel')Snd.play('ok');
 switch(a){
 case'setname':{const n=($('#myname')?.value||'').trim().slice(0,14);if(!n){ui.err='Scrivi il tuo nome';return render()}ME.name=n;ST('rg-name',n);R.mine.name=n;if(R.on&&R.code){await saveMine();ui.screen=G?'game':'room';return render()}return enterHub()}
 case'rename':ui.cfg=false;ui.screen='name';return render();
 case'addguest':{const n=($('#gname')?.value||'').trim().slice(0,14);if(!n){ui.err='Scrivi il nome dell’ospite';return render()}if(lobbySeats().length>=10){ui.err='Massimo 10 giocatori per tavolo';return render()}R.mine.guests=[...(R.mine.guests||[]),{k:'g'+rid(),name:n}];ui.err='';return saveMine()}
 case'rmguest':R.mine.guests=(R.mine.guests||[]).filter(g=>g.k!==v);delete R.mine.votes[v];return saveMine();
 case'rmmember':if(R.on){try{await R.db.doc('rooms/'+R.code+'/members/'+v).delete()}catch(x){ui.err=netErr(x)}}return render();
 case'vote':{const[g,k]=v.split('|');const vs=R.mine.votes[k]||[];if(vs.includes(g))R.mine.votes[k]=vs.filter(x=>x!==g);else{if(vs.length>=3){ui.err='Ogni giocatore può votare al massimo 3 giochi';Snd.play('err');return render()}R.mine.votes[k]=[...vs,g]}ui.err='';return saveMine()}
 case'start':return startGame(v);
 case'join':{const c=($('#jc')?.value||'').trim().toUpperCase();if(c.length<3){ui.err='Inserisci il codice della stanza';return render()}if(!R.on){ui.err='Le stanze online non sono disponibili in questa visualizzazione';return render()}
  if(R.mode==='p2p'){try{ui.err='';R.db=await p2pJoin(c);ST('rg-role','guest')}catch(x){ui.err=netErr(x);return render()}}
  try{const sn=await R.db.doc('rooms/'+c).get();if(!sn.exists){ui.err='Stanza '+c+' non trovata';return render()}const d=sn.data();if(d.phase==='play'&&!(d.seats||[]).some(x=>x.dev===ME.dev)){ui.err='In quella stanza c’è una partita in corso: riprova quando tornano alla stanza'}
   await joinRoom(c);say('Sei nella stanza '+c)}catch(x){ui.err=netErr(x);render()}return}
 case'retrynet':R.tried=false;R.on=false;R.mode=null;ui.err='';return enterHub();
 case'emo':{const[e,k]=v.split('|');const m=R.mine.emo=R.mine.emo||{};m[k||'m']={e,t:Date.now()};await saveMine();tvLater();return}
 case'ek':ui.ek=v;return render();
 case'chatsend':return chatSend();
 case'tvcat':ui.cat=v;return render();
 case'tvpick':ui.pick=v;return render();
 case'newroom':if(!R.on)return;try{const c=R.mode==='p2p'?await p2pCreate():await createRoom();await joinRoom(c);say('Nuova stanza '+c)}catch(x){ui.err=netErr(x);render()}return;
 case'copy':{const msg='Vieni a giocare alla Taverna! Apri '+location.origin+location.pathname+' , scrivi il tuo nome e inserisci il codice stanza: '+R.code;try{await navigator.clipboard.writeText(msg);say('Invito copiato: incollalo ai tuoi amici')}catch(x){say('Codice: '+R.code)}return}
 case'resume':try{const o=JSON.parse(ST('rg-off'));R.offSeats=o.game.seats;ui.screen='game';G=null;fxDone=null;pushState(o.game.G,false)}catch(x){}return;
 case'rematch':return rematch();
 case'tolobby':return toLobby();
 case'askstop':ui.confirm=true;return render();case'nostop':ui.confirm=false;return render();
 case'reveal':ui.shown=G.cur;Snd.play('deal');return render();
 case'story':ui.story=false;ST('rg-intro','1');render();if(G&&G.en&&ui.screen==='game')splash(G.en.c,true);return;
 case'm-story':ui.story=true;return render();
 case'rules':ui.rules=ui.rules?null:(v||(G&&G.g)||'regicide');return render();
 case'cfg':ui.cfg=!ui.cfg;return render();
 case'mus':Snd.setMus(!Snd.mus);return render();case'sfx':Snd.setSfx(!Snd.sfx);return render();
 case'next':return dispatch({t:'next'});
 }
 if(G&&ui.screen==='game')gameClick(a,v);
});
document.addEventListener('change',e=>{const id=e.target.id;if(id==='cs'){pstyle=e.target.value!=='nap';ST('rg-cards',pstyle?'pia':'nap');render();return}if(id==='th'){theme=e.target.value;ST('rg-theme',theme);applyTheme()}
 if(id==='fc'){fc=e.target.checked;ST('rg-fc',fc?'1':'0');applyTheme()}
 if(id&&id.startsWith('opt-')){ui.opts[id.slice(4)]=e.target.value}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'){const id=e.target.id;if(id==='myname')$('[data-a=setname]')?.click();if(id==='gname')$('[data-a=addguest]')?.click();if(id==='jc')$('[data-a=join]')?.click();if(id==='cmsg')chatSend()}
 if((e.key==='Enter'||e.key===' ')&&['sel','tsel','meld'].includes(e.target.dataset?.a)){e.preventDefault();e.target.click()}});
