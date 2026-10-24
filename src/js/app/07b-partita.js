/* ---- avvio, rivincita, ritorno alla stanza ---- */
function defOpts(id){const g=GAMES.find(x=>x.id===id);const o={};if(g&&g.opts)o[g.opts.k]=ui.opts[id]||g.opts.vals[0][0];return o}
async function startGame(id,seats,opts){const S=seats||lobbySeats(),g=GAMES.find(x=>x.id===id);
 if(!g||!g.ok(S.length)){ui.err=g?g.name+' si gioca con '+g.range+' giocatori':'Gioco sconosciuto';return render()}
 if(R.on&&R.doc&&R.doc.phase==='play'&&!seats){ui.err='C’è già una partita in corso in questa stanza';return render()}
 if(g.check){const m=g.check(S,opts||defOpts(id));if(m){ui.err=m;return render()}}
 const o=opts||defOpts(id);if(id==='mindx')o.x=1;const s=ENG[id].newGame(S.length,S.map(x=>x.name),o);s.g=id;s.gid=rid();ui.err='';
 if(id==='regicide'&&ST('rg-intro')!=='1')ui.story=true;
 if(R.on){try{const e=await SYNC.esegui(R.ref,cur=>SYNC.partita(cur,{dopo:seats&&G?G.gid:null,patch:{phase:'play',game:id,opts:o,seats:S,s}}));
   if(e.err){ui.err=e.err;if(e.code==='conflitto')await risincronizza()}}catch(e){ui.err=netErr(e)}
  render();return}
 R.offSeats=S;R.offGame={id,opts:o};ui.screen='game';G=null;fxDone=null;ui.shown=-1;pushState(s,false);saveOff(s)}
function rematch(){const id=G.g,S=seatsNow().slice(),o=R.on?R.doc.opts:(R.offGame||{}).opts;return startGame(id,S,o||{})}
async function toLobby(){ui.confirm=false;ui.cfg=false;ui.story=false;if(R.on){try{const e=await SYNC.esegui(R.ref,cur=>SYNC.lobby(cur,{gid:G&&G.gid}));if(e.err){ui.err=e.err;await risincronizza()}}catch(e){ui.err=netErr(e)}return render()}
 G=null;ui.screen='room';saveOff(null);render()}
/* ---- coda degli stati e animazioni ---- */
let Q=Promise.resolve();
/* rev = versione della stanza a cui appartiene lo stato (R.grev: quella dello stato che vedo, base della prossima mossa) */
function pushState(ns,own,rev){Q=Q.then(()=>{const fin=!!(G&&G.gid===ns.gid&&!G.over&&ns.over);return applyState(ns,own,rev).then(()=>{if(fin)FB.matchEnd(ns)})}).catch(e=>{console.warn(e);ui.anim=false;ui.viewEn=null;ui.view=null;G=ns;if(rev!=null)R.grev=rev;fxDone=ns.evn;render()})}
/* dopo un rifiuto (conflitto, mossa non valida sullo stato nuovo) si riprende lo stato vero dalla stanza e si annulla ciò che avevo mostrato in anticipo */
async function risincronizza(){try{const sn=await R.ref.get();if(!sn.exists)return;const d=sn.data();R.doc=d;R.rev=Math.max(R.rev,d.rev||0);
 if(d.phase==='play'&&d.s){fxDone=null;pushState(d.s,false,d.rev||0)}}catch(e){console.warn('risincronizza',e)}}
function coverCheck(prev,ns){if(multiLocal()&&prev&&prev.cur!==ns.cur)ui.shown=-1}
async function applyState(ns,own,rev){
 const ev=ns.ev||[],prev=G,isNew=!G||G.gid!==ns.gid,fresh=isNew||fxDone===null||ns.evn===fxDone||!ev.length||ui.screen!=='game';
 if(fresh){G=ns;if(rev!=null)R.grev=rev;fxDone=ns.evn;if(isNew){ui.ih=[];seen.h=null;seen.p=new Set();seen.e=null;prevRank=null;ui.shown=-1;ui.sel=[];ui.tsel=[]}else coverCheck(prev,ns);render();if(isNew&&ns.evn===0&&ui.screen==='game')intro(ns);cap=null;return}
 ui.anim=true;render();const F=FX[ns.g];let cx={};
 try{if(F.pre)cx=await F.pre(prev,ns,own)||{};cap=null;G=ns;if(rev!=null)R.grev=rev;fxDone=ns.evn;coverCheck(prev,ns);render();await F.run(prev,ns,own,cx)}
 finally{cap=null;ui.viewEn=null;ui.view=null;ui.anim=false;render();turnNote(prev,ns)}}
function turnNote(prev,ns){if(ns.sim||ns.over||!prev||prev.cur===ns.cur||ns.g==='regicide'||ns.phase==='summary')return;
 if(isMine(ns.cur)){if(!multiLocal()&&R.on){say('Tocca a te!',1400);Snd.play('turn')}}else say('Tocca a '+ns.names[ns.cur],1400)}
function intro(ns){if(ns.g==='regicide'){if(!ui.story&&ns.en)splash(ns.en.c,true);return}
 const g=GAMES.find(x=>x.id===ns.g);banner(g.name.toUpperCase(),g.mode(ns.n));Snd.play('turn');setTimeout(()=>Snd.play('deal'),300)}
async function dispatch(a){if(!myTurn())return;if(G.sim&&a.seat==null)a.seat=viewer();const r=ENG[G.g].act(G,a);if(r.err){ui.err=r.err;Snd.play('err');return render()}
 if(G.g==='island'){(ui.ih=ui.ih||[]).push(JSON.stringify(G));if(ui.ih.length>200)ui.ih.shift()}
 ui.err='';if(['play','discard','meld','add'].includes(a.t))captureSel();ui.sel=[];ui.tsel=[];
 if(!R.on){pushState(r.s,true);saveOff(r.s);return}
 /* la mossa vale solo sullo stato da cui è partita (base): se un altro telefono ha scritto prima, non cancella niente e ci si riallinea.
    Nei giochi simultanei (G.sim) si rigioca sullo stato nuovo. Regole in motori/35-sync.js. */
 const base=R.grev!=null?R.grev:R.rev,gid=G.gid;R.rev=Math.max(R.rev,base+1);
 ui.busy=true;pushState(r.s,true,base+1);
 try{const e=await SYNC.esegui(R.ref,cur=>SYNC.mossa(cur,{base,gid,a,s:r.s},ENG));
  if(e.err){ui.err=e.code==='conflitto'?'Un altro telefono ha mosso un attimo prima: riprova.':e.err;await risincronizza()}}
 catch(e){ui.err='Mossa non inviata: '+netErr(e);await risincronizza()}
 ui.busy=false;render()}
