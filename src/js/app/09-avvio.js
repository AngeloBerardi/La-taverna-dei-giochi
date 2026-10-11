/* ---- avvio, rivincita, ritorno alla stanza ---- */
function defOpts(id){const g=GAMES.find(x=>x.id===id);const o={};if(g&&g.opts)o[g.opts.k]=ui.opts[id]||g.opts.vals[0][0];return o}
async function startGame(id,seats,opts){const S=seats||lobbySeats(),g=GAMES.find(x=>x.id===id);
 if(!g||!g.ok(S.length)){ui.err=g?g.name+' si gioca con '+g.range+' giocatori':'Gioco sconosciuto';return render()}
 if(R.on&&R.doc&&R.doc.phase==='play'&&!seats){ui.err='C’è già una partita in corso in questa stanza';return render()}
 const o=opts||defOpts(id),s=ENG[id].newGame(S.length,S.map(x=>x.name),o);s.g=id;s.gid=rid();ui.err='';
 if(id==='regicide'&&ST('rg-intro')!=='1')ui.story=true;
 if(R.on){try{await writeRoom({phase:'play',game:id,opts:o,seats:S,s,rev:R.rev+1})}catch(e){ui.err=netErr(e);render()}return}
 R.offSeats=S;R.offGame={id,opts:o};ui.screen='game';G=null;fxDone=null;ui.shown=-1;pushState(s,false);saveOff(s)}
function rematch(){const id=G.g,S=seatsNow().slice(),o=R.on?R.doc.opts:(R.offGame||{}).opts;return startGame(id,S,o||{})}
async function toLobby(){ui.confirm=false;ui.cfg=false;ui.story=false;if(R.on){try{await writeRoom({phase:'lobby',s:null,rev:R.rev+1})}catch(e){ui.err=netErr(e)}return render()}
 G=null;ui.screen='room';saveOff(null);render()}
