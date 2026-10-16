/* ================= CATAN ================= */
const CPC=['#e8574a','#3a8fe6','#35b866','#f2c230','#b06be0','#e8742c','#2fc5c0','#e86bb0'];
const CTC={wood:['#2f7a3c','🌲'],brick:['#bf5a30','🧱'],wool:['#93cf5e','🐑'],grain:['#e7c445','🌾'],ore:['#8d92a3','⛰️'],desert:['#e3cf94','🏜️']};
const CRI={wood:'🪵',brick:'🧱',wool:'🐑',grain:'🌾',ore:'🪨'};
const CDV={knight:['⚔️','Cavaliere'],rb:['🛣️','Costruzione strade'],yop:['🎁','Invenzione'],mono:['💰','Monopolio'],vp:['🏆','Punto vittoria']};
const CS=38,CBXC={};
const cbx=s=>CBXC[s.prof||'a']||(CBXC[s.prof||'a']=(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;CATAN.geo(s).V.forEach(v=>{x0=Math.min(x0,v.x);x1=Math.max(x1,v.x);y0=Math.min(y0,v.y);y1=Math.max(y1,v.y)});const m=1.15;return[(x0-m)*CS,(y0-m)*CS,(x1-x0+2*m)*CS,(y1-y0+2*m)*CS]})());
let cGeo=null;const cV=v=>[cGeo.V[v].x*CS,cGeo.V[v].y*CS];
const cRes=(o,cls)=>CATAN.RES.filter(k=>o[k]>0).map(k=>`<span class="cri ${cls||''}">${o[k]}${CRI[k]}</span>`).join('')||'—';
function boardH(s,tg){const C=Object.assign({},CATAN,CATAN.geo(s));cGeo=C;let g='';
 s.hexes.forEach((x,i)=>{const H=C.HX[i],[c,ic]=CTC[x.t],cx=H.x*CS,cy=H.y*CS,hot=s.dice&&x.num&&s.dice[0]+s.dice[1]===x.num;
  g+=`<polygon class="chx" points="${H.v.map(v=>cV(v).join(',')).join(' ')}" fill="${c}"/><text class="cic" x="${cx}" y="${x.num?cy-11:cy+7}" text-anchor="middle" font-size="${x.num?15:24}">${ic}</text>`;
  if(x.num){const pp=C.pips(x.num);g+=`<g class="ctok ${hot?'hot':''}"><circle cx="${cx}" cy="${cy+8}" r="13"/><text x="${cx}" y="${cy+12}" text-anchor="middle" class="${x.num===6||x.num===8?'red':''}">${x.num}</text>${Array.from({length:pp},(_,k)=>`<circle class="pp" cx="${cx-(pp-1)*1.7+k*3.4}" cy="${cy+17.5}" r=".9"/>`).join('')}</g>`}});
 s.ports.forEach(pt=>{const[a,b]=[C.E[pt.e].a,C.E[pt.e].b].map(cV),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,d=Math.hypot(mx,my)||1,px=mx+mx/d*24,py=my+my/d*24;
  g+=`<g class="cport"><line x1="${a[0]}" y1="${a[1]}" x2="${px}" y2="${py}"/><line x1="${b[0]}" y1="${b[1]}" x2="${px}" y2="${py}"/><circle cx="${px}" cy="${py}" r="12"/><text x="${px}" y="${py-1}" text-anchor="middle" class="pi">${pt.k==='any'?'⚓':CRI[pt.k]}</text><text x="${px}" y="${py+8.5}" text-anchor="middle">${pt.k==='any'?'3:1':'2:1'}</text></g>`});
 for(const e in s.roads){const[a,b]=[C.E[e].a,C.E[e].b].map(cV);g+=`<line class="crd0" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><line class="crd" stroke="${CPC[s.roads[e]]}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`}
 if(tg&&tg.k==='e')tg.l.forEach(e=>{const[a,b]=[C.E[e].a,C.E[e].b].map(cV);g+=`<line class="cte" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><line class="cth" data-a="cedge" data-v="${e}" role="button" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`});
 for(const v in s.bld){const b=s.bld[v],[x,y]=cV(v),r=7.5,f=CPC[b.p];
  g+=b.k===1?`<path class="cbd" fill="${f}" d="M${x-r},${y+r*.8} L${x-r},${y-r*.2} L${x},${y-r*1.3} L${x+r},${y-r*.2} L${x+r},${y+r*.8}Z"/>`
   :`<path class="cbd" fill="${f}" d="M${x-r*1.5},${y+r*.9} L${x-r*1.5},${y-r*.3} L${x-r*.3},${y-r*.3} L${x-r*.3},${y-r*1.3} L${x+r*.3},${y-r*1.9} L${x+r*.9},${y-r*1.3} L${x+r*.9},${y-r*.3} L${x+r*1.5},${y-r*.3} L${x+r*1.5},${y+r*.9}Z"/>`}
 {const H=C.HX[s.robber],x=H.x*CS-15,y=H.y*CS+9;g+=`<g class="crob"><path d="M${x-7},${y+9} Q${x-7},${y-1} ${x},${y-3} Q${x+7},${y-1} ${x+7},${y+9}Z"/><circle cx="${x}" cy="${y-8}" r="5"/></g>`}
 if(tg&&tg.k==='v')tg.l.forEach(v=>{const[x,y]=cV(v);g+=`<circle class="ctv" data-a="cvert" data-v="${v}" role="button" cx="${x}" cy="${y}" r="11"/>`});
 if(tg&&tg.k==='h')tg.l.forEach(i=>{g+=`<polygon class="cth2" data-a="chex" data-v="${i}" role="button" points="${C.HX[i].v.map(v=>cV(v).join(',')).join(' ')}"/>`});
 return`<svg class="cboard" viewBox="${cbx(s).join(' ')}" role="img" aria-label="Plancia">${g}</svg>`}
function catanH(){const s=G,C=CATAN,RES=C.RES,key=s.gid+':'+s.evn;
 if(multiLocal()&&ui.cmk!==key){ui.cmk=key;const w=s.phase==='discard'?Number(Object.keys(s.disc||{}).find(k=>isMine(+k))):s.cur;if(w!=null&&!Number.isNaN(w)&&isMine(w))ui.ms=w}
 if(ui.ck!==key){ui.ck=key;ui.cmode=null;ui.cdisc=null}
 const v=viewer(),ph=s.phase,me=v>=0&&v===s.cur&&myTurn()&&!s.over,mine=v>=0?s.res[v]:null;if(!me)ui.ctr=false;
 let tg=null,hint='';
 if(me){
  if(ph==='setup'){tg=s.setup.step==='v'?{k:'v',l:C.settleSpots(s,v,true)}:{k:'e',l:C.roadSpots(s,v,s.setup.v)};hint=s.setup.step==='v'?'Tocca un incrocio per posare una colonia.':'Ora una strada accanto alla colonia.'}
  else if(ph==='robber'){tg={k:'h',l:C.geo(s).HX.map((h,i)=>i).filter(i=>i!==s.robber)};hint='Tocca l’esagono dove spostare il ladro.'}
  else if(ph==='rb'){tg={k:'e',l:C.roadSpots(s,v)};hint='Strada gratuita: ne restano '+s.rbLeft+'.'}
  else if((ph==='main'||ph==='sbp')&&ui.cmode){tg=ui.cmode==='road'?{k:'e',l:C.roadSpots(s,v)}:ui.cmode==='settle'?{k:'v',l:C.settleSpots(s,v,false)}:{k:'v',l:C.citySpots(s,v)};hint='Tocca dove costruire (o riprova il pulsante per annullare).'}
  else if(ph==='sbp')hint='Costruzione speciale: costruisci o compra una carta, poi passa.';
  else if(ph==='roll')hint='Tira i dadi, oppure gioca prima un cavaliere.';
  else if(ph==='main')hint='Costruisci, scambia o gioca una carta; poi fine turno.'}
 const pl=`<div class="cpls ${s.n>=5?'big':''}">${s.names.map((n,i)=>`<div class="cpl ${i===s.cur&&!s.over?'act':''}" style="--pc:${CPC[i]}"><i class="cdot"></i><b>${esc(n)}${seatTag(i)}</b><span class="cvp">${C.points(s,i,false)}★</span><span title="Carte in mano">🂠${C.cardsOf(s,i)}</span><span title="Carte sviluppo">🃏${s.dev[i].length}</span><span title="Cavalieri giocati">⚔${s.knights[i]}</span><span title="Strada più lunga">🛣${C.roadLen(s,i)}</span>${s.longest&&s.longest.p===i?'<em>🛣️+2</em>':''}${s.army&&s.army.p===i?'<em>⚔️+2</em>':''}${s.disc&&s.disc[i]?`<em class="dsc">scarta ${s.disc[i]}</em>`:''}</div>`).join('')}</div>`;
 const seats=multiLocal()?`<div class="kchips cseats">${local().map(i=>`<button class="kch ${i===v?'sel':''}" data-a="cseat" data-v="${i}">${esc(s.names[i])}</button>`).join('')}</div>`:'';
 const dice=s.dice?`<span class="cdice">${dieH(s.dice[0],{cls:'sm'})}${dieH(s.dice[1],{cls:'sm'})}<b>${s.dice[0]+s.dice[1]}</b></span>`:'';
 const info=`<span class="chip">Vince chi arriva a ${s.vp}★</span><span class="chip">Mazzo sviluppo ${s.deck.length}</span>${s.n>=5?'<span class="chip" title="Dopo ogni turno gli altri giocatori possono costruire">🏗 Costruzione speciale</span>':''}${dice}`;
 let hand='';
 if(v>=0){const dc={};s.dev[v].forEach(c=>dc[c]=(dc[c]||0)+1);const nw={};s.newDev[v].forEach(c=>nw[c]=(nw[c]||0)+1);
  hand=`<div class="chand">${RES.map(k=>`<div class="crc ${k}"><i>${CRI[k]}</i><b>${mine[k]}</b><small>${C.RN[k]}</small></div>`).join('')}</div>`
   +(s.dev[v].length?`<div class="cdev">${Object.keys(dc).map(c=>{const pl=dc[c]-(nw[c]||0),can=me&&(ph==='main'||(ph==='roll'&&c==='knight'))&&!s.devPlayed&&pl>0&&c!=='vp';
    return`<div class="cdc"><span>${CDV[c][0]} ${CDV[c][1]} ×${dc[c]}${nw[c]?` <small>(${nw[c]} nuov${nw[c]>1?'e':'a'})</small>`:''}</span>${c==='vp'?'<small>1★ segreto</small>':`<button class="b sm gold" data-a="cplay" data-v="${c}" ${can?'':'disabled'}>Gioca</button>`}</div>`}).join('')}</div>`:'')}
 let ctl='';
 if(me&&!ui.ctr){
  if(ph==='roll')ctl=`<button class="b play" data-a="croll">🎲 Tira i dadi</button>`;
  else if(ph==='steal')ctl=`<div class="hlabel">A chi rubi una carta?</div><div class="ktg">${s.vict.map(i=>`<button class="b sm gold" data-a="csteal" data-v="${i}">${esc(s.names[i])} · ${C.cardsOf(s,i)}🂠</button>`).join('')}</div>`;
  else if(ph==='main'||ph==='sbp'){const sb=ph==='sbp',b=(k,ic,lab,ok,cost)=>`<button class="b sm cbtn ${ui.cmode===k?'sel':''}" data-a="cmode" data-v="${k}" ${ok?'':'disabled'}><i>${ic}</i>${lab}<small>${cost}</small></button>`;
   ctl=`<div class="cbar">${b('road','🛣️','Strada',C.has(s,v,C.COST.road)&&C.roadsOf(s,v)<15&&C.roadSpots(s,v).length,'🪵🧱')}${b('settle','🏠','Colonia',C.has(s,v,C.COST.settle)&&C.settleSpots(s,v,false).length,'🪵🧱🐑🌾')}${b('city','🏰','Città',C.has(s,v,C.COST.city)&&C.citySpots(s,v).length&&C.count(s,v,2)<4,'🌾🌾🪨🪨🪨')}<button class="b sm cbtn" data-a="cbuy" ${C.has(s,v,C.COST.dev)&&s.deck.length?'':'disabled'}><i>🃏</i>Carta<small>🐑🌾🪨</small></button></div>
   <div class="cbar">${sb?'':'<button class="b sm disc" data-a="ctr">🔁 Scambia</button>'}<button class="b sm grn" data-a="cend">${sb?'⏭ Passa':'⏭ Fine turno'}</button></div>`}}
 /* offerta di scambio in corso */
 let tr='';const T=s.trade;
 if(T&&ph==='main'){const fr=esc(s.names[T.from]);
  if(v===T.from)tr=`<div class="ctrade"><b>La tua offerta${T.to!=null?' a '+esc(s.names[T.to]):''}</b><div>Dai ${cRes(T.give)} · chiedi ${cRes(T.want)}</div>${T.acc.length?`<div class="ktg">${T.acc.map(i=>`<button class="b sm gold" data-a="cdeal" data-v="${i}">Scambia con ${esc(s.names[i])}</button>`).join('')}</div>`:'<small class="muted">Nessuno ha ancora accettato…</small>'}${T.rej.length?`<small class="muted">Rifiutato da: ${T.rej.map(i=>esc(s.names[i])).join(', ')}</small>`:''}<button class="b sm disc" data-a="ccancel">Ritira l’offerta</button></div>`;
  else if(v>=0&&(T.to==null||T.to===v)){const acc=T.acc.includes(v);tr=`<div class="ctrade"><b>${fr} propone uno scambio</b><div>Ti dà ${cRes(T.give)} · vuole ${cRes(T.want)}</div>${acc?'<small class="muted">Hai accettato: aspetta che decida '+fr+'.</small>':''}<div class="ktg"><button class="b sm grn" data-a="caccept" ${C.has(s,v,T.want)&&!acc?'':'disabled'}>Accetta</button><button class="b sm disc" data-a="creject">Rifiuta</button></div></div>`}
  else tr=`<div class="ctrade"><small>${fr} ha proposto uno scambio.</small></div>`}
 /* finestre */
 let modal='';
 if(v>=0&&ph==='discard'&&s.disc&&s.disc[v]){const need=s.disc[v],d=ui.cdisc=ui.cdisc||Object.fromEntries(RES.map(k=>[k,0])),n=RES.reduce((a,k)=>a+d[k],0);
  modal=`<div class="modal"><div class="box col"><h2>Esce il 7!</h2><p>Hai troppe carte: scartane ${need}.</p><div class="cstp">${RES.map(k=>`<div class="cs"><span>${CRI[k]} ${C.RN[k]}</span><button class="b sm disc" data-a="cdisc" data-v="${k}:-1" ${d[k]<=0?'disabled':''}>−</button><b>${d[k]}/${mine[k]}</b><button class="b sm disc" data-a="cdisc" data-v="${k}:1" ${d[k]>=mine[k]||n>=need?'disabled':''}>＋</button></div>`).join('')}</div><button class="b play" data-a="cdiscok" ${n===need?'':'disabled'}>Scarta ${n}/${need}</button></div></div>`}
 else if(me&&ui.ctr){const tab=ui.ctab||'bank',of=ui.cof=ui.cof||{give:Object.fromEntries(RES.map(k=>[k,0])),want:Object.fromEntries(RES.map(k=>[k,0]))};
  const tabs=`<div class="kchips"><button class="kch ${tab==='bank'?'sel':''}" data-a="ctab" data-v="bank">🏦 Banca e porti</button><button class="kch ${tab==='pl'?'sel':''}" data-a="ctab" data-v="pl">🤝 Giocatori</button></div>`;
  let body;
  if(tab==='bank')body=`<div class="hlabel">Dai (rapporto col tuo miglior porto)</div><div class="kchips">${RES.map(k=>{const q=C.ratio(s,v,k);return`<button class="kch ${ui.cbg===k?'sel':''}" data-a="cbg" data-v="${k}" ${mine[k]>=q?'':'disabled'}>${CRI[k]} ${q}:1</button>`}).join('')}</div><div class="hlabel">Prendi</div><div class="kchips">${RES.map(k=>`<button class="kch ${ui.cbt===k?'sel':''}" data-a="cbt" data-v="${k}" ${ui.cbg===k||s.bank[k]<1?'disabled':''}>${CRI[k]} ${C.RN[k]}</button>`).join('')}</div><button class="b gold" data-a="cbank" ${ui.cbg&&ui.cbt&&ui.cbg!==ui.cbt?'':'disabled'}>Scambia in banca</button>`;
  else body=`<div class="hlabel">Offri</div><div class="cstp">${RES.map(k=>`<div class="cs"><span>${CRI[k]}</span><button class="b sm disc" data-a="cstep" data-v="give:${k}:-1" ${of.give[k]<=0?'disabled':''}>−</button><b>${of.give[k]}</b><button class="b sm disc" data-a="cstep" data-v="give:${k}:1" ${of.give[k]>=mine[k]||of.want[k]>0?'disabled':''}>＋</button></div>`).join('')}</div><div class="hlabel">Chiedi</div><div class="cstp">${RES.map(k=>`<div class="cs"><span>${CRI[k]}</span><button class="b sm disc" data-a="cstep" data-v="want:${k}:-1" ${of.want[k]<=0?'disabled':''}>−</button><b>${of.want[k]}</b><button class="b sm disc" data-a="cstep" data-v="want:${k}:1" ${of.want[k]>=9||of.give[k]>0?'disabled':''}>＋</button></div>`).join('')}</div><div class="hlabel">A chi</div><div class="kchips"><button class="kch ${ui.cto==null?'sel':''}" data-a="cto" data-v="a">Tutti</button>${s.names.map((n,i)=>i===v?'':`<button class="kch ${ui.cto===i?'sel':''}" data-a="cto" data-v="${i}">${esc(n)}</button>`).join('')}</div><button class="b gold" data-a="coffer" ${RES.some(k=>of.give[k]>0)&&RES.some(k=>of.want[k]>0)?'':'disabled'}>Proponi lo scambio</button>`;
  modal=`<div class="modal"><div class="box col"><h2>Scambia</h2>${tabs}${body}<button class="b disc" data-a="ctrx">Chiudi</button></div></div>`}
 else if(me&&ui.cdev){const d=ui.cdev;
  modal=`<div class="modal"><div class="box col"><h2>${CDV[d.card][1]}</h2><p>${d.card==='yop'?'Scegli due risorse dalla banca ('+[d.a,d.b].filter(Boolean).length+'/2).':'Scegli la risorsa: tutti gli altri ti danno quelle che hanno.'}</p><div class="kchips">${RES.map(k=>`<button class="kch" data-a="cdevpick" data-v="${k}">${CRI[k]} ${C.RN[k]}</button>`).join('')}</div>${d.card==='yop'?`<button class="b gold" data-a="cdevok" ${d.a&&d.b?'':'disabled'}>Prendi ${d.a?CRI[d.a]:'?'} ${d.b?CRI[d.b]:'?'}</button>`:''}<button class="b disc" data-a="cdevx">Annulla</button></div></div>`}
 const prompt=s.over?'':me?`<b>${esc(s.names[s.cur])}</b>, tocca a te!<small>${hint}</small>`:ph==='discard'?`Si scartano le carte: ${Object.keys(s.disc).map(i=>esc(s.names[i])).join(', ')}…`:`${ph==='sbp'?'Costruzione speciale di ':'Tocca a '}<b>${esc(s.names[s.cur])}</b>${ph==='robber'?' (sposta il ladro)':ph==='roll'?' (tira i dadi)':ph==='setup'?' (preparazione)':''}<span class="dots"></span>`;
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">🏆</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${i===s.over.win?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}</b><small>★</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const strip=stripH(s,i=>({c:CPC[i],b:C.points(s,i,false)+'★'}));
 const bub=`<div class="bubble ${me?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${prompt}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 return fixH({title:'Catan',chips:info,strip,mid:`<div class="cwrap">${boardH(s,tg)}</div>`,bot:seats+bub+tr+`<div class="ctl kctl">${ctl}</div>`,hand,players:pl,end:modal+end})}
function catanClick(a,v){const s=G,C=CATAN;
 if(a==='cseat'){ui.ms=+v;ui.cdisc=null;return render()}
 if(!myTurn())return;
 const num=x=>+x;
 switch(a){
 case'croll':return dispatch({t:'roll'});
 case'cmode':ui.cmode=ui.cmode===v?null:v;ui.err='';return render();
 case'cvert':{const ph=s.phase;const m=ui.cmode;ui.cmode=null;return dispatch(ph==='setup'||m==='settle'?{t:'settle',v:num(v)}:{t:'city',v:num(v)})}
 case'cedge':ui.cmode=null;return dispatch({t:'road',e:num(v)});
 case'chex':return dispatch({t:'robber',h:num(v)});
 case'csteal':return dispatch({t:'steal',p:num(v)});
 case'cbuy':return dispatch({t:'buydev'});
 case'cend':return dispatch({t:'end'});
 case'cplay':if(v==='yop'||v==='mono'){ui.cdev={card:v,a:null,b:null};return render()}return dispatch({t:'play',card:v});
 case'cdevpick':{const d=ui.cdev;if(d.card==='mono'){ui.cdev=null;return dispatch({t:'play',card:'mono',r:v})}if(!d.a)d.a=v;else if(!d.b)d.b=v;else{d.a=v;d.b=null}return render()}
 case'cdevok':{const d=ui.cdev;ui.cdev=null;return dispatch({t:'play',card:'yop',a:d.a,b:d.b})}
 case'cdevx':ui.cdev=null;return render();
 case'ctr':ui.ctr=true;ui.cbg=ui.cbt=null;ui.cof=null;ui.cto=null;return render();
 case'ctrx':ui.ctr=false;return render();
 case'ctab':ui.ctab=v;return render();
 case'cbg':ui.cbg=v;if(ui.cbt===v)ui.cbt=null;return render();
 case'cbt':ui.cbt=v;return render();
 case'cbank':{const g=ui.cbg,t=ui.cbt;ui.ctr=false;return dispatch({t:'bank',give:g,get:t})}
 case'cstep':{const[w,k,d]=v.split(':');ui.cof[w][k]=Math.max(0,ui.cof[w][k]+num(d));return render()}
 case'cto':ui.cto=v==='a'?null:num(v);return render();
 case'coffer':{const o=ui.cof,to=ui.cto;ui.ctr=false;ui.cof=null;return dispatch({t:'offer',give:o.give,want:o.want,to})}
 case'caccept':return dispatch({t:'accept'});
 case'creject':return dispatch({t:'reject'});
 case'cdeal':return dispatch({t:'deal',p:num(v)});
 case'ccancel':return dispatch({t:'cancel'});
 case'cdisc':{const[k,d]=v.split(':');ui.cdisc=ui.cdisc||{};ui.cdisc[k]=Math.max(0,(ui.cdisc[k]||0)+num(d));return render()}
 case'cdiscok':{const r=ui.cdisc;ui.cdisc=null;return dispatch({t:'discard',res:r})}}}
const CAFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='roll'){Snd.play('dice');await W(450)}
  else if(e.t==='build'){Snd.play('build');await W(250)}
  else if(e.t==='seven'){Snd.play('atk');await W(350)}
  else if(e.t==='robber'){Snd.play('impact');await W(300)}
  else if(e.t==='steal'||e.t==='mono'){Snd.play('whoosh');await W(250)}
  else if(e.t==='bank'||e.t==='trade'){Snd.play('coin');await W(250)}
  else if(e.t==='buydev'||e.t==='dev'){Snd.play('draw');await W(250)}
  else if(e.t==='gain'){Snd.play('coin');await W(150)}}
  endFx(ns)}};
