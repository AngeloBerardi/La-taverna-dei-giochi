/* ---- coda degli stati e animazioni ---- */
let Q=Promise.resolve();
function pushState(ns,own){Q=Q.then(()=>applyState(ns,own)).catch(e=>{console.warn(e);ui.anim=false;ui.viewEn=null;ui.view=null;G=ns;fxDone=ns.evn;render()})}
function coverCheck(prev,ns){if(multiLocal()&&prev&&prev.cur!==ns.cur)ui.shown=-1}
async function applyState(ns,own){
 const ev=ns.ev||[],prev=G,isNew=!G||G.gid!==ns.gid,fresh=isNew||fxDone===null||ns.evn===fxDone||!ev.length||ui.screen!=='game';
 if(fresh){G=ns;fxDone=ns.evn;if(isNew){seen.h=null;seen.p=new Set();seen.e=null;prevRank=null;ui.shown=-1;ui.sel=[];ui.tsel=[]}else coverCheck(prev,ns);render();if(isNew&&ns.evn===0&&ui.screen==='game')intro(ns);cap=null;return}
 ui.anim=true;render();const F=FX[ns.g];let cx={};
 try{if(F.pre)cx=await F.pre(prev,ns,own)||{};cap=null;G=ns;fxDone=ns.evn;coverCheck(prev,ns);render();await F.run(prev,ns,own,cx)}
 finally{cap=null;ui.viewEn=null;ui.view=null;ui.anim=false;render();turnNote(prev,ns)}}
function turnNote(prev,ns){if(ns.over||!prev||prev.cur===ns.cur||ns.g==='regicide'||ns.phase==='summary')return;
 if(isMine(ns.cur)){if(!multiLocal()&&R.on){say('Tocca a te!',1400);Snd.play('turn')}}else say('Tocca a '+ns.names[ns.cur],1400)}
function intro(ns){if(ns.g==='regicide'){if(!ui.story&&ns.en)splash(ns.en.c,true);return}
 const g=GAMES.find(x=>x.id===ns.g);banner(g.name.toUpperCase(),g.mode(ns.n));Snd.play('turn');setTimeout(()=>Snd.play('deal'),300)}
async function dispatch(a){if(!myTurn())return;const r=ENG[G.g].act(G,a);if(r.err){ui.err=r.err;Snd.play('err');return render()}
 ui.err='';if(['play','discard','meld','add'].includes(a.t))captureSel();ui.sel=[];ui.tsel=[];
 if(!R.on){pushState(r.s,true);saveOff(r.s);return}
 ui.busy=true;pushState(r.s,true);try{await writeRoom({s:r.s,rev:R.rev+1})}catch(e){ui.err='Mossa non inviata: '+netErr(e)}ui.busy=false;render()}
