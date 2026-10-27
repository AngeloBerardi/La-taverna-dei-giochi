/* ================= CATAN · vista del telefono: mano, azioni e tocchi sulla plancia =================
   Due assetti: «plancia» (la plancia 2D occupa il centro) e «controller» (il telefono è solo la mano: la plancia sta sullo schermo comune e compare qui
   soltanto quando bisogna toccare un punto: costruire, spostare il ladro, preparazione). La scelta si ricorda sul dispositivo (rg-cscr).
   Le espansioni si registrano in CXUI[nome] = {modes, bar(s,v,b), hand(s,v), modal(s,v), click(a,v), pl(s,i), mid(s), chips(s)}. */
const CXUI={};
const cxs=s=>(s.xt||[]).map(k=>CXUI[k]).filter(Boolean);
const cScr=()=>ST('rg-cscr')==='ctl'?'ctl':'full';
const CKEYS=s=>CATAN.KEYS(s);
const cName=(s,k)=>CRN[k]||k;
const costH=c=>Object.keys(c).filter(k=>c[k]>0).map(k=>`<span class="ccs" style="--kc:${CKC[k]}">${c[k]>1?c[k]:''}${resI(k,13)}</span>`).join('');
/* modalità di costruzione: dove si può toccare e quale azione parte */
const CMODE={
 road:{k:'e',l:(s,v)=>CATAN.roadSpots(s,v),a:e=>({t:'road',e}),hint:'Tocca dove posare la strada.'},
 ship:{k:'e',l:(s,v)=>CATAN.shipSpots(s,v),a:e=>({t:'ship',e}),hint:'Tocca dove varare la nave.'},
 settle:{k:'v',l:(s,v)=>CATAN.settleSpots(s,v,false),a:v=>({t:'settle',v}),hint:'Tocca un incrocio per la colonia.'},
 city:{k:'v',l:(s,v)=>CATAN.citySpots(s,v),a:v=>({t:'city',v}),hint:'Tocca la colonia da trasformare in città.'}};
const cModeOf=(s,m)=>CMODE[m]||cxs(s).map(x=>x.modes&&x.modes[m]).find(Boolean);
/* bersagli della fase obbligata (preparazione, ladro, strade gratuite) o della modalità scelta */
function cTargets(s,v,me){const C=CATAN,ph=s.phase;C.geo(s);if(!me)return{tg:null,hint:''};
 if(ph==='setup'){const S=s.setup;if(S.step==='v')return{tg:{k:'v',l:C.settleSpots(s,v,true)},hint:'Tocca un incrocio per posare una colonia'+(s.xt.includes('cek')&&S.i>=s.n?' (la seconda è una città).':'.')};
  return{tg:{k:'e',l:[...C.roadSpots(s,v,S.v),...C.shipSpots(s,v,{from:S.v})]},hint:'Ora una strada (o una nave) accanto alla colonia.'}}
 if(ph==='robber'){const hs=C.geo(s).HX.map((h,i)=>i).filter(i=>(C.landH(s,i)&&i!==s.robber)||(s.pirate!=null&&i!==s.pirate&&s.hexes[i].t==='sea'&&!s.hexes[i].fog));return{tg:{k:'h',l:hs},hint:'Tocca l’esagono dove spostare il ladro'+(s.pirate!=null?' (o il pirata sul mare)':'')+'.'}}
 if(ph==='rb')return{tg:{k:'e',l:[...C.roadSpots(s,v),...C.shipSpots(s,v)]},hint:'Strada gratuita: ne restano '+s.rbLeft+'.'};
 if((ph==='main'||ph==='sbp')&&ui.cmode){const M=cModeOf(s,ui.cmode);if(M)return{tg:{k:M.k,l:M.l(s,v),on:M.on&&M.on(s,v)},hint:M.hint}}
 return{tg:null,hint:ph==='roll'?'Tira i dadi.':ph==='sbp'?'Costruzione speciale: costruisci o compra una carta, poi passa.':ph==='main'?'Costruisci, scambia o gioca una carta; poi fine turno.':''}}
function cHandH(s,v){const C=CATAN,K=CKEYS(s),mine=s.res[v];
 const card=k=>`<div class="crc ${k}" style="--kc:${CKC[k]}"><i>${resI(k,26)}</i><b>${mine[k]||0}</b><small>${cName(s,k)}</small></div>`;
 let h=`<div class="chand k${K.length}">${K.map(card).join('')}</div>`;
 if(!s.noDev&&s.dev[v].length){const dc={},nw={};s.dev[v].forEach(c=>dc[c]=(dc[c]||0)+1);s.newDev[v].forEach(c=>nw[c]=(nw[c]||0)+1);
  const me=v===s.cur&&myTurn()&&!s.over;
  h+=`<div class="cdev">${Object.keys(dc).map(c=>{const pl=dc[c]-(nw[c]||0),can=me&&(s.phase==='main'||(s.phase==='roll'&&c==='knight'))&&!s.devPlayed&&pl>0&&c!=='vp';
   return`<div class="cdc"><span>${CDV[c][0]} ×${dc[c]}${nw[c]?` <small>(${nw[c]} nuov${nw[c]>1?'e':'a'})</small>`:''}</span>${c==='vp'?'<small>1 punto, segreto</small>':`<button class="b sm gold" data-a="cplay" data-v="${c}" ${can?'':'disabled'}>Gioca</button>`}</div>`}).join('')}</div>`}
 cxs(s).forEach(x=>{if(x.hand)h+=x.hand(s,v)||''});return h}
function cStepper(s,d,mine,max,act,keys){return`<div class="cstp">${keys.map(k=>`<div class="cs"><span>${resI(k,18)} ${cName(s,k)}</span><button class="b sm disc" data-a="${act}" data-v="${k}:-1" ${(d[k]||0)<=0?'disabled':''}>−</button><b>${d[k]||0}/${mine[k]}</b><button class="b sm disc" data-a="${act}" data-v="${k}:1" ${(d[k]||0)>=mine[k]||Object.values(d).reduce((a,b)=>a+b,0)>=max?'disabled':''}>＋</button></div>`).join('')}</div>`}
function cTradeModal(s,v,me){const K=CKEYS(s),mine=s.res[v],tab=ui.ctab||'bank',of=ui.cof=ui.cof||{give:{},want:{}},C=CATAN;
 const tabs=`<div class="kchips"><button class="kch ${tab==='bank'?'sel':''}" data-a="ctab" data-v="bank">Banca e porti</button><button class="kch ${tab==='pl'?'sel':''}" data-a="ctab" data-v="pl">Giocatori</button></div>`;
 const chip=(act,k,sel,dis,lab)=>`<button class="kch ${sel?'sel':''}" data-a="${act}" data-v="${k}" ${dis?'disabled':''}>${resI(k,16)} ${lab}</button>`;
 const stp=(w)=>`<div class="cstp">${K.map(k=>`<div class="cs"><span>${resI(k,18)} ${cName(s,k)}</span><button class="b sm disc" data-a="cstep" data-v="${w}:${k}:-1" ${!(of[w][k]>0)?'disabled':''}>−</button><b>${of[w][k]||0}</b><button class="b sm disc" data-a="cstep" data-v="${w}:${k}:1" ${(w==='give'&&(of.give[k]||0)>=mine[k])||(of[w==='give'?'want':'give'][k]>0)||(of[w][k]||0)>=9?'disabled':''}>＋</button></div>`).join('')}</div>`;
 let body;
 if(tab==='bank')body=`<div class="hlabel">Dai (rapporto col tuo miglior porto)</div><div class="kchips">${K.map(k=>{const q=C.ratio(s,v,k);return chip('cbg',k,ui.cbg===k,mine[k]<q,q+':1')}).join('')}</div><div class="hlabel">Prendi</div><div class="kchips">${K.map(k=>chip('cbt',k,ui.cbt===k,ui.cbg===k||s.bank[k]<1,cName(s,k))).join('')}</div><button class="b gold" data-a="cbank" ${ui.cbg&&ui.cbt&&ui.cbg!==ui.cbt?'':'disabled'}>Scambia in banca</button>`;
 else body=`<div class="hlabel">Offri</div>${stp('give')}<div class="hlabel">Chiedi</div>${stp('want')}<div class="hlabel">A chi</div><div class="kchips"><button class="kch ${ui.cto==null?'sel':''}" data-a="cto" data-v="a">Tutti</button>${s.names.map((n,i)=>i===v?'':`<button class="kch ${ui.cto===i?'sel':''}" data-a="cto" data-v="${i}">${esc(n)}</button>`).join('')}</div><button class="b gold" data-a="coffer" ${K.some(k=>of.give[k]>0)&&K.some(k=>of.want[k]>0)?'':'disabled'}>Proponi lo scambio</button>`;
 return`<div class="modal"><div class="box col"><h2>Scambia</h2>${tabs}${body}<button class="b disc" data-a="ctrx">Chiudi</button></div></div>`}
function cTradeCard(s,v){const T=s.trade,C=CATAN;if(!T||s.phase!=='main')return'';const fr=esc(s.names[T.from]);
 if(v===T.from)return`<div class="ctrade"><b>La tua offerta${T.to!=null?' a '+esc(s.names[T.to]):''}</b><div>Dai ${cRes(T.give)} · chiedi ${cRes(T.want)}</div>${T.acc.length?`<div class="ktg">${T.acc.map(i=>`<button class="b sm gold" data-a="cdeal" data-v="${i}">Scambia con ${esc(s.names[i])}</button>`).join('')}</div>`:'<small class="muted">Nessuno ha ancora accettato…</small>'}${T.rej.length?`<small class="muted">Rifiutato da: ${T.rej.map(i=>esc(s.names[i])).join(', ')}</small>`:''}<button class="b sm disc" data-a="ccancel">Ritira l’offerta</button></div>`;
 if(v>=0&&(T.to==null||T.to===v)){const acc=T.acc.includes(v);return`<div class="ctrade"><b>${fr} propone uno scambio</b><div>Ti dà ${cRes(T.give)} · vuole ${cRes(T.want)}</div>${acc?'<small class="muted">Hai accettato: aspetta che decida '+fr+'.</small>':''}<div class="ktg"><button class="b sm grn" data-a="caccept" ${C.has(s,v,T.want)&&!acc?'':'disabled'}>Accetta</button><button class="b sm disc" data-a="creject">Rifiuta</button></div></div>`}
 return`<div class="ctrade"><small>${fr} ha proposto uno scambio.</small></div>`}
/* scarto (7) e scelta dall'oro / acquedotto */
function cPickModal(s,v,title,text,need,act,ok,keys,mine){const d=ui.cpick=ui.cpick||{},n=Object.values(d).reduce((a,b)=>a+b,0);
 return`<div class="modal"><div class="box col"><h2>${title}</h2><p>${text}</p>${cStepper(s,d,mine,need,act,keys)}<button class="b play" data-a="${ok}" ${n===need?'':'disabled'}>Conferma ${n}/${need}</button></div></div>`}
function catanH(){if(ui.tv)return catanTVH();const s=G,C=CATAN,key=s.gid+':'+s.evn;
 if(multiLocal()&&ui.cmk!==key){ui.cmk=key;const w=s.phase==='discard'?Number(Object.keys(s.disc||{}).find(k=>isMine(+k))):s.phase==='gold'?Number(Object.keys(s.gold||{}).find(k=>isMine(+k))):s.cur;if(w!=null&&!Number.isNaN(w)&&isMine(w))ui.ms=w}
 if(ui.ck!==key){ui.ck=key;ui.cmode=null;ui.cpick=null;if(ui.cmod!=='tr')ui.cmod=null;ui.cpg=null}
 const v=viewer(),ph=s.phase,me=v>=0&&v===s.cur&&myTurn()&&!s.over,ctl=cScr()==='ctl';if(!me){ui.cmode=null;if(ui.cmod==='tr')ui.cmod=null}
 const T=cTargets(s,v,me),tg=T.tg,hint=T.hint,xs=cxs(s);
 const mine=v>=0?s.res[v]:null,K=CKEYS(s);
 const pl=`<div class="cpls ${s.n>=5?'big':''}">${s.names.map((n,i)=>`<div class="cpl ${i===s.cur&&!s.over?'act':''}" style="--pc:${CPC[i]}"><b>${esc(n)}${seatTag(i)}</b><span class="cvp">${C.points(s,i,false)}<small>★</small></span><span title="Carte in mano">${ic('borsa',14)}${C.handOf?C.handOf(s,i):C.cardsOf(s,i)}</span>${s.noDev?'':`<span title="Carte sviluppo">${ic('star',14)}${s.dev[i].length}</span><span title="Cavalieri giocati">${ic('pugnale',14)}${s.knights[i]}</span>`}<span title="Strada più lunga">${resI('road',14)}${C.roadLen(s,i)}</span>${s.longest&&s.longest.p===i?'<em>Strada +2</em>':''}${s.army&&s.army.p===i?'<em>Esercito +2</em>':''}${s.disc&&s.disc[i]?`<em class="dsc">scarta ${s.disc[i]}</em>`:''}${xs.map(x=>x.pl?x.pl(s,i):'').join('')}</div>`).join('')}</div>`;
 const seats=multiLocal()?`<div class="kchips cseats">${local().map(i=>`<button class="kch ${i===v?'sel':''}" data-a="cseat" data-v="${i}">${esc(s.names[i])}</button>`).join('')}</div>`:'';
 const dice=s.dice?`<span class="cdice">${dieH(s.dice[0],{cls:'sm'})}${dieH(s.dice[1],{cls:'sm'})}${xs.map(x=>x.dice?x.dice(s):'').join('')}<b>${s.dice[0]+s.dice[1]}</b></span>`:'';
 const sc=s.scen&&C.EXTS.mar&&C.EXTS.mar.SC[s.scen],xp=cXpName(s);
 const info=`<span class="chip">${xp?esc(xp)+' · ':''}si vince a ${s.vp}★</span>${s.noDev?'':`<span class="chip">Mazzo ${s.deck.length}</span>`}${s.n>=5?'<span class="chip" title="Dopo ogni turno gli altri giocatori possono costruire">Costruzione speciale</span>':''}${dice}<button class="chip cscrb ${ctl?'on':''}" data-a="cscr" title="Telefono come controller: la plancia sta sullo schermo comune">${ic('tv',14)}${ctl?'Controller':'Plancia'}</button>`;
 /* comandi */
 let ctl_='';
 if(me&&!ui.cmod){
  if(ph==='roll')ctl_=`<button class="b play" data-a="croll">${ic('dado',18)} Tira i dadi</button>${xs.map(x=>x.roll?x.roll(s,v):'').join('')}${!s.noDev&&s.dev[v].includes('knight')?'':''}`;
  else if(ph==='steal')ctl_=`<div class="hlabel">A chi rubi una carta?</div><div class="ktg">${s.vict.map(i=>`<button class="b sm gold" data-a="csteal" data-v="${i}">${esc(s.names[i])} · ${C.cardsOf(s,i)} carte</button>`).join('')}</div>`;
  else if(ph==='main'||ph==='sbp'){const sb=ph==='sbp',b=(k,ic_,lab,ok,cost)=>`<button class="b sm cbtn ${ui.cmode===k?'sel':''}" data-a="cmode" data-v="${k}" ${ok?'':'disabled'}><i>${resI(ic_,22)}</i>${lab}<small>${costH(cost)}</small></button>`;
   const sea=s.xt.includes('mar');
   ctl_=`<div class="ckbar">${b('road','road','Strada',C.has(s,v,C.COST.road)&&C.roadsOf(s,v)<15&&C.roadSpots(s,v).length,C.COST.road)}${sea?b('ship','ship','Nave',C.has(s,v,C.COST.ship)&&C.shipsOf(s,v)<15&&C.shipSpots(s,v).length,C.COST.ship):''}${b('settle','nugget','Colonia',C.has(s,v,C.COST.settle)&&C.settleSpots(s,v,false).length,C.COST.settle)}${b('city','tower','Città',C.has(s,v,C.COST.city)&&C.citySpots(s,v).length&&C.count(s,v,2)<4,C.COST.city)}${s.noDev?'':`<button class="b sm cbtn" data-a="cbuy" ${C.has(s,v,C.COST.dev)&&s.deck.length?'':'disabled'}><i>${resI('scroll',22)}</i>Carta<small>${costH(C.COST.dev)}</small></button>`}</div>`
    +xs.map(x=>x.bar?x.bar(s,v,b,sb):'').join('')
    +`<div class="ckbar">${sb?'':`<button class="b sm disc" data-a="ctr">${ic('stretta',16)} Scambia</button>`}<button class="b sm grn" data-a="cend">${sb?'Passa':'Fine turno'}</button></div>`}}
 const trade=cTradeCard(s,v);
 /* finestre */
 let modal='';
 if(v>=0&&ph==='discard'&&s.disc&&s.disc[v])modal=cPickModal(s,v,'Esce il 7!','Hai troppe carte: scartane '+s.disc[v]+'.',s.disc[v],'cpk','cdiscok',K.filter(k=>mine[k]>0),mine);
 else if(v>=0&&ph==='gold'&&s.gold&&s.gold[v])modal=cPickModal(s,v,s.ev&&s.ev.some(e=>e.t==='aq')?'Acquedotto':'Terra d’oro','Scegli '+s.gold[v]+' '+(s.gold[v]>1?'risorse':'risorsa')+' dalla banca.',s.gold[v],'cpk','cgoldok',C.RES.filter(k=>s.bank[k]>0),Object.fromEntries(C.RES.map(k=>[k,s.bank[k]])));
 else if(me&&ui.cmod==='tr')modal=cTradeModal(s,v,me);
 else if(me&&ui.cdev){const d=ui.cdev;modal=`<div class="modal"><div class="box col"><h2>${CDV[d.card][0]}</h2><p>${d.card==='yop'?'Scegli due risorse dalla banca ('+[d.a,d.b].filter(Boolean).length+'/2).':'Scegli la risorsa: tutti gli altri ti danno quelle che hanno.'}</p><div class="kchips">${C.RES.map(k=>`<button class="kch" data-a="cdevpick" data-v="${k}">${resI(k,16)} ${CRN[k]}</button>`).join('')}</div>${d.card==='yop'?`<button class="b gold" data-a="cdevok" ${d.a&&d.b?'':'disabled'}>Prendi ${d.a?CRN[d.a]:'?'} ${d.b?CRN[d.b]:'?'}</button>`:''}<button class="b disc" data-a="cdevx">Annulla</button></div></div>`}
 if(!modal&&v>=0)for(const x of xs){if(x.modal){const m=x.modal(s,v,me);if(m){modal=m;break}}}
 const prompt=s.over?'':me?`<b>${esc(s.names[s.cur])}</b>, tocca a te!<small>${hint}</small>`:ph==='discard'?`Si scartano le carte: ${Object.keys(s.disc).map(i=>esc(s.names[i])).join(', ')}…`:ph==='gold'?`Si sceglie dalla banca: ${Object.keys(s.gold).map(i=>esc(s.names[i])).join(', ')}…`:`${ph==='sbp'?'Costruzione speciale di ':'Tocca a '}<b>${esc(s.names[s.cur])}</b>${ph==='robber'?' (sposta il ladro)':ph==='roll'?' (tira i dadi)':ph==='setup'?' (preparazione)':''}<span class="dots"></span>`;
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${ic('corona',48)}</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${i===s.over.win?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}</b><small>★</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const strip=stripH(s,i=>({c:CPC[i],b:C.points(s,i,false)+'★'}));
 const bub=`<div class="bubble ${me?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${prompt}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 const showBoard=!ctl||tg||ui.cpeek;
 const mid=showBoard?`<div class="cwrap">${boardH(s,tg,{mini:ctl})}${ctl&&!tg?`<button class="b sm disc cpeekx" data-a="cpeek">Nascondi la plancia</button>`:''}</div>`:`<div class="cctl">${xs.map(x=>x.mid?x.mid(s):'').join('')}<div class="cctl-st">${s.over?'':me?'Tocca a te':'Tocca a <b>'+esc(s.names[s.cur])+'</b>'}</div><div class="cctl-pl">${s.names.map((n,i)=>`<div class="${i===s.cur?'act':''}" style="--pc:${CPC[i]}"><i></i><span>${esc(n)}</span><b>${C.points(s,i,false)}★</b></div>`).join('')}</div><button class="b sm disc" data-a="cpeek">Guarda la plancia</button></div>`;
 const hand=v>=0?cHandH(s,v):'';
 return fixH({title:GN('catan'),chips:info,strip,mid:xs.map(x=>x.top?x.top(s):'').join('')+mid,bot:seats+bub+trade,act:ctl_?`<div class="cact">${ctl_}</div>`:'',hand,players:pl,end:modal+end})}
function cXpName(s){const n={mar:'Marinai',cek:'Città e Difensori',meb:'Carovane e Predoni',eep:'Rotte e Corsari'},a=(s.xt||[]).map(k=>n[k]).filter(Boolean);const sc=s.scen&&CATAN.EXTS.mar&&CATAN.EXTS.mar.SC[s.scen];return a.join(' + ')+(sc?' · '+sc.nome:'')}
/* un tocco sulla plancia: l'azione dipende dalla fase e dalla modalità */
function cTap(kind,id){const s=G,C=CATAN,ph=s.phase,v=viewer();id=+id;
 if(ph==='setup'){if(kind==='v')return dispatch({t:'settle',v:id});return dispatch({t:C.roadSpots(s,v,s.setup.v).includes(id)?'road':'ship',e:id})}
 if(ph==='robber')return dispatch({t:'robber',h:id});
 if(ph==='rb')return dispatch({t:C.roadSpots(s,v).includes(id)?'road':'ship',e:id});
 const m=ui.cmode,M=cModeOf(s,m);if(!M)return;
 const a=M.a(id,s,v);if(a&&a.t){if(!M.keep)ui.cmode=null;return dispatch(a)}
 if(a&&a.ui){Object.assign(ui,a.ui);return render()}}
function catanClick(a,v){const s=G,C=CATAN;
 if(a==='cseat'){ui.ms=+v;ui.cpick=null;return render()}
 if(a==='cscr'){ST('rg-cscr',cScr()==='ctl'?'full':'ctl');ui.cpeek=false;ui.cmode=null;return render()}
 if(a==='cpeek'){ui.cpeek=!ui.cpeek;return render()}
 if(!myTurn())return;
 if(a==='ctg'){const[k,id]=v.split(':');return cTap(k,id)}
 const num=x=>+x;
 for(const x of cxs(s))if(x.click){const r=x.click(a,v);if(r!==undefined)return r}
 switch(a){
 case'croll':return dispatch({t:'roll'});
 case'cmode':ui.cmode=ui.cmode===v?null:v;ui.err='';return render();
 case'csteal':return dispatch({t:'steal',p:num(v)});
 case'cbuy':return dispatch({t:'buydev'});
 case'cend':return dispatch({t:'end'});
 case'cplay':if(v==='yop'||v==='mono'){ui.cdev={card:v,a:null,b:null};return render()}return dispatch({t:'play',card:v});
 case'cdevpick':{const d=ui.cdev;if(d.card==='mono'){ui.cdev=null;return dispatch({t:'play',card:'mono',r:v})}if(!d.a)d.a=v;else if(!d.b)d.b=v;else{d.a=v;d.b=null}return render()}
 case'cdevok':{const d=ui.cdev;ui.cdev=null;return dispatch({t:'play',card:'yop',a:d.a,b:d.b})}
 case'cdevx':ui.cdev=null;return render();
 case'ctr':ui.cmod='tr';ui.cbg=ui.cbt=null;ui.cof=null;ui.cto=null;return render();
 case'ctrx':ui.cmod=null;return render();
 case'ctab':ui.ctab=v;return render();
 case'cbg':ui.cbg=v;if(ui.cbt===v)ui.cbt=null;return render();
 case'cbt':ui.cbt=v;return render();
 case'cbank':{const g=ui.cbg,t=ui.cbt;ui.cmod=null;return dispatch({t:'bank',give:g,get:t})}
 case'cstep':{const[w,k,d]=v.split(':');ui.cof[w][k]=Math.max(0,(ui.cof[w][k]||0)+num(d));return render()}
 case'cto':ui.cto=v==='a'?null:num(v);return render();
 case'coffer':{const o=ui.cof,to=ui.cto;ui.cmod=null;ui.cof=null;return dispatch({t:'offer',give:o.give,want:o.want,to})}
 case'caccept':return dispatch({t:'accept'});
 case'creject':return dispatch({t:'reject'});
 case'cdeal':return dispatch({t:'deal',p:num(v)});
 case'ccancel':return dispatch({t:'cancel'});
 case'cpk':{const[k,d]=v.split(':');ui.cpick=ui.cpick||{};ui.cpick[k]=Math.max(0,(ui.cpick[k]||0)+num(d));return render()}
 case'cdiscok':{const r=ui.cpick;ui.cpick=null;return dispatch({t:'discard',res:r})}
 case'cgoldok':{const r=ui.cpick;ui.cpick=null;return dispatch({t:'gold',res:r})}}}
const CAFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='roll'){Snd.play('dice');await W(450)}
  else if(e.t==='build'||e.t==='kn'||e.t==='wall'){Snd.play('build');await W(250)}
  else if(e.t==='seven'||e.t==='attack'||e.t==='pillage'){Snd.play('atk');await W(350)}
  else if(e.t==='robber'||e.t==='pirate'){Snd.play('impact');await W(300)}
  else if(e.t==='steal'||e.t==='mono'||e.t==='mship'){Snd.play('whoosh');await W(250)}
  else if(e.t==='bank'||e.t==='trade'||e.t==='imp'||e.t==='metro'){Snd.play('coin');await W(250)}
  else if(e.t==='buydev'||e.t==='dev'||e.t==='prog'||e.t==='pplay'){Snd.play('draw');await W(250)}
  else if(e.t==='gain'||e.t==='goldpick'||e.t==='island'||e.t==='reveal'){Snd.play('coin');await W(150)}}
  endFx(ns)}};
