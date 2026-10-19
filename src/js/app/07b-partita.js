/* ---- avvio, rivincita, ritorno alla stanza ---- */
function defOpts(id){const g=GAMES.find(x=>x.id===id);const o={};if(g&&g.opts)o[g.opts.k]=ui.opts[id]||g.opts.vals[0][0];return o}
async function startGame(id,seats,opts){const S=seats||lobbySeats(),g=GAMES.find(x=>x.id===id);
 if(!g||!g.ok(S.length)){ui.err=g?g.name+' si gioca con '+g.range+' giocatori':'Gioco sconosciuto';return render()}
 if(R.on&&R.doc&&R.doc.phase==='play'&&!seats){ui.err='C’è già una partita in corso in questa stanza';return render()}
 const o=opts||defOpts(id);if(id==='mindx')o.x=1;const s=ENG[id].newGame(S.length,S.map(x=>x.name),o);s.g=id;s.gid=rid();ui.err='';
 if(id==='regicide'&&ST('rg-intro')!=='1')ui.story=true;
 if(R.on){try{await writeRoom({phase:'play',game:id,opts:o,seats:S,s,rev:R.rev+1})}catch(e){ui.err=netErr(e);render()}return}
 R.offSeats=S;R.offGame={id,opts:o};ui.screen='game';G=null;fxDone=null;ui.shown=-1;pushState(s,false);saveOff(s)}
function rematch(){const id=G.g,S=seatsNow().slice(),o=R.on?R.doc.opts:(R.offGame||{}).opts;return startGame(id,S,o||{})}
async function toLobby(){ui.confirm=false;ui.cfg=false;ui.story=false;if(R.on){try{await writeRoom({phase:'lobby',s:null,rev:R.rev+1})}catch(e){ui.err=netErr(e)}return render()}
 G=null;ui.screen='room';saveOff(null);render()}
/* ---- coda degli stati e animazioni ---- */
let Q=Promise.resolve();
function pushState(ns,own){Q=Q.then(()=>{const fin=!!(G&&G.gid===ns.gid&&!G.over&&ns.over);return applyState(ns,own).then(()=>{if(fin)FB.matchEnd(ns)})}).catch(e=>{console.warn(e);ui.anim=false;ui.viewEn=null;ui.view=null;G=ns;fxDone=ns.evn;render()})}
function coverCheck(prev,ns){if(multiLocal()&&prev&&prev.cur!==ns.cur)ui.shown=-1}
async function applyState(ns,own){
 const ev=ns.ev||[],prev=G,isNew=!G||G.gid!==ns.gid,fresh=isNew||fxDone===null||ns.evn===fxDone||!ev.length||ui.screen!=='game';
 if(fresh){G=ns;fxDone=ns.evn;if(isNew){ui.ih=[];seen.h=null;seen.p=new Set();seen.e=null;prevRank=null;ui.shown=-1;ui.sel=[];ui.tsel=[]}else coverCheck(prev,ns);render();if(isNew&&ns.evn===0&&ui.screen==='game')intro(ns);cap=null;return}
 ui.anim=true;render();const F=FX[ns.g];let cx={};
 try{if(F.pre)cx=await F.pre(prev,ns,own)||{};cap=null;G=ns;fxDone=ns.evn;coverCheck(prev,ns);render();await F.run(prev,ns,own,cx)}
 finally{cap=null;ui.viewEn=null;ui.view=null;ui.anim=false;render();turnNote(prev,ns)}}
function turnNote(prev,ns){if(ns.sim||ns.over||!prev||prev.cur===ns.cur||ns.g==='regicide'||ns.phase==='summary')return;
 if(isMine(ns.cur)){if(!multiLocal()&&R.on){say('Tocca a te!',1400);Snd.play('turn')}}else say('Tocca a '+ns.names[ns.cur],1400)}
function intro(ns){if(ns.g==='regicide'){if(!ui.story&&ns.en)splash(ns.en.c,true);return}
 const g=GAMES.find(x=>x.id===ns.g);banner(g.name.toUpperCase(),g.mode(ns.n));Snd.play('turn');setTimeout(()=>Snd.play('deal'),300)}
async function dispatch(a){if(!myTurn())return;if(G.sim&&a.seat==null)a.seat=viewer();const r=ENG[G.g].act(G,a);if(r.err){ui.err=r.err;Snd.play('err');return render()}
 if(G.g==='island'){(ui.ih=ui.ih||[]).push(JSON.stringify(G));if(ui.ih.length>200)ui.ih.shift()}
 ui.err='';if(['play','discard','meld','add'].includes(a.t))captureSel();ui.sel=[];ui.tsel=[];
 if(!R.on){pushState(r.s,true);saveOff(r.s);return}
 ui.busy=true;pushState(r.s,true);try{await writeRoom({s:r.s,rev:R.rev+1})}catch(e){ui.err='Mossa non inviata: '+netErr(e)}ui.busy=false;render()}
