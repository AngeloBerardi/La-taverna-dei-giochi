/* ================= CATAN · CITTÀ E CAVALIERI: parte della vista (telefono e plancia 2D) =================
   Migliorie, cavalieri, mura, carte progresso, nave dei barbari. Registrata in CXUI.cek (vedi 22f2-catan-mano.js). */
const CTK={tr:'#e9c13a',po:'#3a7bd5',sc:'#3fa860'};
const cekE=()=>CATAN.EXTS.cek,cekH=()=>CATAN.EXTS.cek.helpers;
const cekKn=(s,p)=>Object.keys(s.kn).filter(v=>s.kn[v].p===p).map(Number);
const cekAct=(s,p)=>{const per=Array(s.n).fill(0);for(const v in s.kn)if(s.kn[v].a)per[s.kn[v].p]+=s.kn[v].l;return per};
function cekTrack(s,big){const E=cekE().barb(null,s),pos=s.bar||0;
 return`<div class="cxb ${big?'big':''}" title="La nave dei barbari: a 7 passi attacca"><span class="cxb-s">${resI('ship',big?30:18)}</span><div class="cxb-t">${Array.from({length:8},(_,i)=>`<i class="${i<pos?'p':''} ${i===pos?'at':''} ${i===7?'end':''}">${i===pos?resI('ship',big?20:13):''}</i>`).join('')}</div><span class="cxb-n"><b title="Forza dei barbari: le città">${E.str}</b> contro <b title="Difesa: cavalieri attivi">${E.def}</b></span></div>`}
const cekDie=s=>s.ed?`<span class="ced ${s.ed}" title="Dado evento">${resI(s.ed==='b'?'ship':'gate',16)}</span>`:'';
CXB.push((s,C)=>{if(!s.kn)return'';let g='';
 for(const t of cekE().TR){const m=s.metro[t];if(m==null||!s.bld[m])continue;const[x,y]=cV(m);g+=`<g class="cmet" transform="translate(${x+4},${y-14})"><path d="M0,0V-10L9,-7L0,-4" fill="${CTK[t]}" stroke="#1a120a" stroke-width="1.1"/><line x1="0" y1="0" x2="0" y2="3" stroke="#1a120a" stroke-width="1.6"/></g>`}
 for(const v in s.kn){const k=s.kn[v],[x,y]=cV(v);g+=`<g class="ckn ${k.a?'on':'off'}" transform="translate(${x},${y})"><path d="M-7.5,-9 L7.5,-9 L7.5,1 Q7.5,8.5 0,12 Q-7.5,8.5 -7.5,1Z" fill="${CPC[k.p]}"/><text y="4.6" text-anchor="middle">${k.l}</text></g>`}
 return g});
function cekCanKnNew(s,v){const C=CATAN,H=cekH();return C.has(s,v,{wool:1,ore:1})&&H.knOf(s,v,1)<2&&H.knSpots(s,v).length>0}
const CEK_PGT={ // carte progresso che si giocano toccando la plancia: tipo di bersaglio, elenco, quanti
 merchant:{k:'h',n:1,l:(s,v)=>CATAN.geo(s).HX.map((h,i)=>i).filter(i=>CATAN.RES.includes(s.hexes[i].t)&&!s.hexes[i].fog&&CATAN.geo(s).HX[i].v.some(x=>s.bld[x]&&s.bld[x].p===v)),f:x=>({h:x[0]}),hint:'Tocca l’esagono dove posare il Mercante.'},
 bishop:{k:'h',n:1,l:(s,v)=>CATAN.geo(s).HX.map((h,i)=>i).filter(i=>CATAN.landH(s,i)&&i!==s.robber),f:x=>({h:x[0]}),hint:'Tocca l’esagono dove spostare il ladro.'},
 intrigue:{k:'v',n:1,l:(s,v)=>{const G=CATAN.geo(s);return Object.keys(s.kn).map(Number).filter(x=>s.kn[x].p!==v&&G.V[x].e.some(e=>s.roads[e]===v))},f:x=>({v:x[0]}),hint:'Tocca il cavaliere avversario da scacciare.'},
 medicine:{k:'v',n:1,l:(s,v)=>Object.keys(s.bld).map(Number).filter(x=>s.bld[x].p===v&&s.bld[x].k===1),f:x=>({v:x[0]}),hint:'Tocca la colonia da trasformare in città.'},
 smith:{k:'v',n:2,l:(s,v)=>cekKn(s,v).filter(x=>!cekE().helpers.promoteOk(s,v,x)),f:x=>({v1:x[0],v2:x[1]}),hint:'Tocca fino a due cavalieri da promuovere.',any:true},
 inventor:{k:'h',n:2,l:(s,v)=>CATAN.geo(s).HX.map((h,i)=>i).filter(i=>CATAN.landH(s,i)&&s.hexes[i].num&&![2,6,8,12].includes(s.hexes[i].num)),f:x=>({h1:x[0],h2:x[1]}),hint:'Tocca due esagoni di cui scambiare i numeri.'}};
const CEK_PGP={rmono:'res',cmono:'com',fleet:'key',master:'pl',deserter:'pl'};
function cekPgModal(s,v){const E=cekE(),cards=s.pg[v],me=v===s.cur&&myTurn();
 const ok=c=>me&&(s.phase==='main'||(c==='alchemist'&&s.phase==='roll'));
 return`<div class="modal"><div class="box col"><h2>Carte progresso</h2>${s.pgvp[v]?`<small class="muted">Punti da carte già rivelate: ${s.pgvp[v]}</small>`:''}${cards.length?`<div class="cxpg">${cards.map((c,i)=>`<div class="cxcard"><div><b>${E.PC[c][0]}</b><small>${E.PC[c][3]}</small></div><button class="b sm gold" data-a="cx_pgplay" data-v="${c}" ${ok(c)?'':'disabled'}>Gioca</button></div>`).join('')}</div>`:'<p class="muted">Non hai carte progresso. Si pescano col dado evento (porta) se il dado rosso è basso rispetto alle tue migliorie.</p>'}<button class="b disc" data-a="cx_x">Chiudi</button></div></div>`}
function cekPgParam(s,v){const d=ui.cpg,E=cekE(),t=CEK_PGP[d.card],C=CATAN;let body='';
 if(t==='res')body=`<div class="kchips">${C.RES.map(k=>`<button class="kch" data-a="cx_pgv" data-v="${k}">${resI(k,16)} ${CRN[k]}</button>`).join('')}</div>`;
 else if(t==='com')body=`<div class="kchips">${s.xk.map(k=>`<button class="kch" data-a="cx_pgv" data-v="${k}">${resI(k,16)} ${CRN[k]}</button>`).join('')}</div>`;
 else if(t==='key')body=`<div class="kchips">${CKEYS(s).map(k=>`<button class="kch" data-a="cx_pgv" data-v="${k}">${resI(k,16)} ${CRN[k]}</button>`).join('')}</div>`;
 else if(t==='pl'){const mine=C.points(s,v,false),pl=Array.from({length:s.n},(_,q)=>q).filter(q=>q!==v&&(d.card==='deserter'?cekKn(s,q).length>0:C.points(s,q,false)>mine));
  body=pl.length?`<div class="kchips">${pl.map(q=>`<button class="kch" data-a="cx_pgv" data-v="${q}">${esc(s.names[q])} · ${C.points(s,q,false)}★</button>`).join('')}</div>`:'<p class="muted">Nessun giocatore adatto.</p>'}
 return`<div class="modal"><div class="box col"><h2>${E.PC[d.card][0]}</h2><p>${E.PC[d.card][3]}</p>${body}<button class="b disc" data-a="cx_pgx">Annulla</button></div></div>`}
function cekAlchemy(s,v){const d=ui.calch=ui.calch||[3,4];
 return`<div class="modal"><div class="box col"><h2>Alchimista</h2><p>Scegli i due dadi, poi si tira.</p>${[0,1].map(i=>`<div class="kchips">${[1,2,3,4,5,6].map(n=>`<button class="kch ${d[i]===n?'sel':''}" data-a="cx_dice" data-v="${i}:${n}">${n}</button>`).join('')}</div>`).join('')}<button class="b play" data-a="cx_alch">Tira ${d[0]} + ${d[1]}</button><button class="b disc" data-a="cx_x">Annulla</button></div></div>`}
function cekImpModal(s,v){const E=cekE(),me=v===s.cur&&myTurn()&&s.phase==='main',cs=cekH().cities(s,v);
 const rows=E.TR.map(k=>{const lv=s.imp[v][k],c=E.COM[k],cost=lv<5?lv+1-(s.crane[v]>0?1:0):0,ok=me&&lv<5&&cs.length&&s.res[v][c]>=cost,m=s.metro[k],own=m!=null&&s.bld[m]?s.bld[m].p:null;
  return`<div class="cximp" style="--tk:${CTK[k]}"><div class="cximp-h"><b>${E.TN[k]}</b><span>${resI(c,16)} ${s.res[v][c]}</span></div><div class="cximp-p">${[0,1,2,3,4].map(i=>`<i class="${i<lv?'f':''} ${i===3?'m':''}" title="${E.LV[k][i]}"></i>`).join('')}</div>
   <small>${lv<5?'Prossimo: '+E.LV[k][lv]+(lv===2?' (abilità)':lv===3?' (metropoli)':''):'Al massimo'}${own!=null?' · metropoli: '+esc(s.names[own]):''}</small>
   <button class="b sm gold" data-a="cx_up" data-v="${k}" ${ok?'':'disabled'}>${lv<5?'Migliora · '+cost+' '+CRN[c]:'Completa'}</button></div>`}).join('');
 return`<div class="modal"><div class="box col"><h2>Migliorie della città</h2>${cs.length?'':'<p class="muted">Servono una città per migliorarle.</p>'}<small>Livello 3: Commercio scambia le merci 2:1 · Politica sblocca i cavalieri possenti · Scienza dà una risorsa se non incassi nulla. Livello 4: metropoli (+2 punti), livello 5 la ruba.</small>${rows}<button class="b disc" data-a="cx_x">Chiudi</button></div></div>`}
function cekKnModal(s,v){const E=cekE(),H=cekH(),C=CATAN,k=s.kn[ui.ckv];if(!k||k.p!==v){ui.cxm=null;return''}const me=v===s.cur&&myTurn()&&s.phase==='main';
 const up=H.promoteOk(s,v,ui.ckv),canUp=me&&!up&&C.has(s,v,{wool:1,ore:1}),mv=H.reach(s,v,ui.ckv).length,adj=!s.robOff&&C.geo(s).V[ui.ckv].h.includes(s.robber);
 return`<div class="modal"><div class="box col"><h2>${E.KN[k.l]}</h2><p>${k.a?'Attivo: conta nella difesa dai barbari.':'Non attivo: costa 1 grano attivarlo.'}${k.u&&k.a?' Ha già agito in questo turno.':''}</p>
  <div class="cxkn">${!k.a?`<button class="b gold" data-a="cx_kact" ${me&&s.res[v].grain>=1?'':'disabled'}>Attiva · 1 ${resI('grain',14)}</button>`:''}
  <button class="b gold" data-a="cx_kup" ${canUp?'':'disabled'}>Promuovi · ${resI('wool',14)}${resI('ore',14)}</button>${up&&k.l<3?`<small class="muted">${up}</small>`:''}
  <button class="b" data-a="cx_kmv" ${me&&k.a&&!k.u&&mv?'':'disabled'}>Muovi lungo le strade</button>
  <button class="b" data-a="cx_kch" ${me&&k.a&&!k.u&&adj?'':'disabled'}>Scaccia il ladro</button></div><button class="b disc" data-a="cx_x">Chiudi</button></div></div>`}
CXUI.cek={
 modes:{
  kn_new:{k:'v',l:(s,v)=>cekH().knSpots(s,v),a:v=>({t:'kn_new',v}),hint:'Tocca dove reclutare il cavaliere (accanto a una tua strada).'},
  wall:{k:'v',l:(s,v)=>cekH().cities(s,v).filter(x=>!s.wall[x]),a:v=>({t:'wall',v}),hint:'Tocca la città da fortificare.'},
  kn_sel:{k:'v',l:(s,v)=>cekKn(s,v),a:id=>({ui:{cxm:'kn',ckv:id,cmode:null}}),hint:'Tocca uno dei tuoi cavalieri.'},
  kn_to:{k:'v',l:(s,v)=>cekH().reach(s,v,ui.ckv),a:to=>({t:'kn_mv',v:ui.ckv,to}),hint:'Tocca dove muovere il cavaliere (o scacciare un avversario più debole).'},
  pgt:{k:'v',l:(s,v)=>CEK_PGT[ui.cpg.card].l(s,v),on:()=>ui.cpg.sel,keep:true,hint:'',
   a:(id,s,v)=>{const d=ui.cpg,T=CEK_PGT[d.card];d.sel=d.sel.includes(id)?d.sel.filter(x=>x!==id):[...d.sel,id];if(d.sel.length>=T.n||(T.any&&T.l(s,v).length<=d.sel.length)){const a={t:'pg',card:d.card,...T.f(d.sel)};ui.cpg=null;ui.cmode=null;return a}return{ui:{}}}}},
 top:s=>cekTrack(s),
 dice:cekDie,
 pl:(s,i)=>{const act=cekAct(s,i),n=cekKn(s,i).length,w=cekH().walls(s,i),im=s.imp[i];
  return`<span class="cxpl" title="Cavalieri (forza attiva / numero)">${resI('knight',14)}${act[i]}/${n}</span>${w?`<span title="Mura">${resI('wall',14)}${w}</span>`:''}<span class="cxim" title="Migliorie: Commercio ${im.tr}, Politica ${im.po}, Scienza ${im.sc}">${['tr','po','sc'].map(k=>`<i style="--tk:${CTK[k]}">${im[k]}</i>`).join('')}</span><span title="Carte progresso">${resI('scroll',14)}${s.pg[i].length}</span>${s.dof[i]?`<em>Difensore +${s.dof[i]}</em>`:''}${s.pgvp[i]?`<em>Progresso +${s.pgvp[i]}</em>`:''}${s.merch&&s.merch.p===i?'<em>Mercante +1</em>':''}`},
 hand:(s,v)=>`<div class="cxhand"><button class="b sm" data-a="cx_pg">${resI('scroll',14)} Carte progresso (${s.pg[v].length})</button></div>`,
 roll:(s,v)=>s.pg[v].includes('alchemist')?`<button class="b sm gold" data-a="cx_alchm">${resI('scroll',14)} Alchimista</button>`:'',
 bar:(s,v,b,sb)=>{if(sb)return'';const H=cekH(),C=CATAN,E=cekE(),cs=H.cities(s,v);
  return`<div class="ckbar">${b('kn_new','knight','Recluta',cekCanKnNew(s,v),{wool:1,ore:1})}${b('kn_sel','sword','Cavalieri',cekKn(s,v).length>0,{grain:1})}${b('wall','wall','Mura',C.has(s,v,{brick:2})&&cs.some(x=>!s.wall[x])&&H.walls(s,v)<3,{brick:2})}<button class="b sm cbtn" data-a="cx_imp"><i>${resI('gate',22)}</i>Migliorie<small>${E.TR.map(k=>s.imp[v][k]).join('·')}</small></button>${ui.cmode==='pgt'&&ui.cpg&&ui.cpg.sel.length&&CEK_PGT[ui.cpg.card].any?`<button class="b sm gold" data-a="cx_pgdone">Fatto</button>`:''}</div>`},
 modal:(s,v,me)=>{if(ui.cxm==='pg')return cekPgModal(s,v);if(ui.cxm==='imp')return cekImpModal(s,v);if(ui.cxm==='kn')return cekKnModal(s,v);if(ui.cxm==='alch')return cekAlchemy(s,v);if(ui.cpg&&ui.cpg.param)return cekPgParam(s,v);return''},
 click:(a,v)=>{const s=G;
  switch(a){
  case'cx_imp':ui.cxm='imp';return render();case'cx_pg':ui.cxm='pg';return render();case'cx_alchm':ui.cxm='alch';ui.calch=[3,4];return render();
  case'cx_x':ui.cxm=null;return render();
  case'cx_dice':{const[i,n]=v.split(':').map(Number);ui.calch=ui.calch||[3,4];ui.calch[i]=n;return render()}
  case'cx_alch':{const d=ui.calch;ui.cxm=null;return dispatch({t:'pg',card:'alchemist',d})}
  case'cx_up':ui.cxm=null;return dispatch({t:'imp',k:v});
  case'cx_kact':ui.cxm=null;return dispatch({t:'kn_act',v:ui.ckv});
  case'cx_kup':ui.cxm=null;return dispatch({t:'kn_up',v:ui.ckv});
  case'cx_kmv':ui.cxm=null;ui.cmode='kn_to';return render();
  case'cx_kch':ui.cxm=null;return dispatch({t:'kn_chase',v:ui.ckv});
  case'cx_pgplay':{ui.cxm=null;const T=CEK_PGT[v];
   if(CEK_PGP[v]){ui.cpg={card:v,param:true};return render()}
   return dispatch({t:'pg',card:v})}
  case'cx_pgv':{const d=ui.cpg,t=CEK_PGP[d.card],x=t==='pl'?+v:v,f=t==='res'||t==='com'?{r:x}:t==='key'?{k:x}:{p:x};ui.cpg=null;return dispatch({t:'pg',card:d.card,...f})}
  case'cx_pgx':ui.cpg=null;return render();
  case'cx_pgdone':{const d=ui.cpg,T=CEK_PGT[d.card],a={t:'pg',card:d.card,...T.f(d.sel)};ui.cpg=null;ui.cmode=null;return dispatch(a)}}}};
