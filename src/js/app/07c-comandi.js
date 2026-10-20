/* ---- comandi ---- */
document.addEventListener('click',async e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;const a=t.dataset.a,v=t.dataset.v;
 if(a!=='sel'&&a!=='tsel')Snd.play('ok');
 switch(a){
 case'setname':{const n=($('#myname')?.value||'').trim().slice(0,14);if(!n){ui.err='Scrivi il tuo nome';return render()}ME.name=n;ST('rg-name',n);R.mine.name=n;if(R.on&&R.code){await saveMine();ui.screen=G?'game':'room';return render()}return enterHub()}
 case'fbstart':FB.start();return render();
 case'rename':ui.cfg=false;ui.screen='name';return render();
 case'addguest':{const n=($('#gname')?.value||'').trim().slice(0,14);if(!n){ui.err='Scrivi il nome dell’ospite';return render()}if(lobbySeats().length>=10){ui.err='Massimo 10 giocatori per tavolo';return render()}R.mine.guests=[...(R.mine.guests||[]),{k:'g'+rid(),name:n}];ui.err='';return saveMine()}
 case'rmguest':R.mine.guests=(R.mine.guests||[]).filter(g=>g.k!==v);delete R.mine.votes[v];return saveMine();
 case'rmmember':if(R.on){try{await R.db.doc('rooms/'+R.code+'/members/'+v).delete()}catch(x){ui.err=netErr(x)}}return render();
 case'vote':{if(!multiDev())return;const[g,k]=v.split('|');const vs=R.mine.votes[k]||[];if(vs.includes(g))R.mine.votes[k]=vs.filter(x=>x!==g);else{if(vs.length>=3){ui.err='Ogni giocatore può votare al massimo 3 giochi';Snd.play('err');return render()}R.mine.votes[k]=[...vs,g]}ui.err='';return saveMine()}
 case'start':return startGame(v);
 case'join':{R.jt=(R.jt||0)+1;const c=($('#jc')?.value||'').trim().toUpperCase();if(c.length<3){ui.err='Inserisci il codice della stanza';return render()}if(!R.on){ui.err='Le stanze online non sono disponibili in questa visualizzazione';return render()}
  if(R.mode==='p2p'){try{ui.err='';R.db=await p2pJoin(c);ST('rg-role','guest')}catch(x){ui.err=netErr(x);return render()}}
  try{const sn=await R.db.doc('rooms/'+c).get();if(!sn.exists){ui.err='Stanza '+c+' non trovata';return render()}const d=sn.data();if(d.phase==='play'&&!(d.seats||[]).some(x=>x.dev===ME.dev)){ui.err='In quella stanza c’è una partita in corso: riprova quando tornano alla stanza'}
   await joinRoom(c);setRoomUrl(c);say('Sei nella stanza '+c)}catch(x){ui.err=netErr(x);render()}return}
 case'genroom':if(!R.on)return;setRoomUrl(null);ui.err='';try{if(R.mode==='p2p'){await p2pGeneral()}else{await joinRoom(GENROOM)}say('Sei nella stanza generale')}catch(x){ui.err=netErr(x);render()}return;
 case'retrynet':R.tried=false;R.on=false;R.mode=null;ui.err='';return enterHub();
 case'emo':{const[e,k]=v.split('|');const m=R.mine.emo=R.mine.emo||{};m[k||'m']={e,t:Date.now()};await saveMine();tvLater();return}
 case'ek':ui.ek=v;return render();
 case'chatsend':return chatSend();
 case'chatd':ui.cd=!ui.cd;ui.unread=0;render();{const lg=$('#chatlog');if(lg)lg.scrollTop=lg.scrollHeight}return;
 case'chatemo':ui.cm=v;await chatSend();return;
 case'tab':ui.tab=v;ui.err='';render();scrollTo(0,0);return;
 case'avedit':ui.avk=v||null;return render();
 case'avset':case'avrand':{const k=ui.avk;if(k==null)return;const S=lobbySeats(),i=Math.max(0,S.findIndex(x=>x.dev===ME.dev&&x.k===k)),cur=avOf({dev:ME.dev,k},i);let nv;
  if(a==='avrand'){const r=n=>Math.floor(Math.random()*n);nv={t:r(AVT.length),h:r(AVC.length),c:r(AVC.length),s:r(AVS.length)}}else{const[f,n]=v.split('|');nv={...cur,[f]:+n}}
  if(k==='m')R.mine.av=nv;else R.mine.guests=(R.mine.guests||[]).map(g=>g.k===k?{...g,av:nv}:g);ST('rg-av',JSON.stringify(R.mine.av||null));return saveMine()}
 case'tvcat':ui.cat=v;return render();
 case'hallgo':ui.cat=v;ui.tab='games';ui.err='';render();scrollTo(0,0);return;
 case'tvpick':ui.pick=v;return render();
 case'newroom':if(!R.on)return;R.jt=(R.jt||0)+1;try{const c=R.mode==='p2p'?await p2pCreate():await createRoom();await joinRoom(c);setRoomUrl(c);say('Stanza privata '+c+': condividi il codice')}catch(x){ui.err=netErr(x);render()}return;
 case'copy':{const url=location.origin+location.pathname+(isGen()?(R.mode==='p2p'&&P2P.tr==='mq'?'?b='+MQ.bi:''):(R.mode==='fs'?'?dist=':'?room=')+R.code+(R.mode==='p2p'&&P2P.tr==='mq'?'&b='+MQ.bi:'')),txt=isGen()?'Vieni a giocare alla Taverna dei Giochi!':'Siediti al mio tavolo alla Taverna dei Giochi! Codice stanza: '+R.code;if(navigator.share&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({title:'La Taverna dei Giochi',text:txt,url});return}catch(x){if(x&&x.name==='AbortError')return}}try{await navigator.clipboard.writeText(txt+' '+url);say('Invito copiato: incollalo ai tuoi amici')}catch(x){say('Codice: '+R.code)}return}
 case'resume':try{const o=JSON.parse(ST('rg-off'));R.offSeats=o.game.seats;ui.screen='game';G=null;fxDone=null;pushState(o.game.G,false)}catch(x){}return;
 case'rematch':return rematch();
 case'tolobby':return toLobby();
 case'askstop':ui.confirm=true;return render();case'nostop':ui.confirm=false;return render();
 case'reveal':ui.shown=G.cur;Snd.play('deal');return render();
 case'story':ui.story=false;ST('rg-intro','1');render();if(G&&G.en&&ui.screen==='game')splash(G.en.c,true);return;
 case'm-story':ui.story=true;return render();
 case'rules':ui.rules=ui.rules?null:(v||(G&&G.g)||'regicide');return render();
 case'cfg':ui.cfg=!ui.cfg;return render();
 case'pwainstall':PWA.install();return;
 case'shop':case'shopx':case'shopbuy':case'shopuse':return Shop.act(a,v);
 case'acc':case'top':case'accx':case'topk':case'acclink':case'accin':case'accgoogle':case'accreset':case'accout':return Acc.act(a,v);
 case'oste':case'ostex':case'osteq':case'osteok':return Oste.act(a,v);
 case'eroi':case'eroix':case'eroinuovo':case'eroischeda':case'eroiindietro':case'eroiavanti':case'eroicol':case'eroirazza':case'eroiclasse':case'eroipt':case'eroicrea':case'eroielimina':return Eroi.act(a,v);
 case'campstart':case'campx':case'campnuova':case'campmuovi':case'campriposa':case'campentra':case'campfuggi':case'campris':return Camp.act(a,v);
 case'tvfull':case'tvm':case'tvmx':case'tvcopy':return TV.act(a);
 case'dist':case'distx':case'distnew':case'distjoin':case'distgo':case'distdel':case'distcopy':case'distexit':case'distnot':return Dist.act(a,v);
 case'fxsheet':ui.sheet=(!v||ui.sheet===v)?null:v;return render();
 case'mus':Snd.setMus(!Snd.mus);return render();case'sfx':Snd.setSfx(!Snd.sfx);return render();
 case'next':return dispatch({t:'next'});
 }
 if(G&&ui.screen==='game')gameClick(a,v);
});
document.addEventListener('change',e=>{const id=e.target.id;if(id==='cs'){pstyle=e.target.value!=='nap';ST('rg-cards',pstyle?'pia':'nap');render();return}if(id==='th'){theme=e.target.value;ST('rg-theme',theme);applyTheme()}
 if(id==='fc'){fc=e.target.checked;ST('rg-fc',fc?'1':'0');applyTheme()}
 if(id&&id.startsWith('opt-')){ui.opts[id.slice(4)]=e.target.value}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'){const id=e.target.id;if(id==='myname')$('[data-a=setname]')?.click();if(id==='gname')$('[data-a=addguest]')?.click();if(id==='jc')$('[data-a=join]')?.click();if(id==='cmsg')chatSend()}
 if((e.key==='Enter'||e.key===' ')&&['sel','tsel','meld','avedit'].includes(e.target.dataset?.a)){e.preventDefault();e.target.click()}});
