/* I COLONI: IL DUELLO – gioco di carte per 2 (principato di regioni, colonie, strade, espansioni, dadi evento).
   Stato: p[i]={rt:[{t,n,r}],rb:[…],cols:[{c:1|2,top:[id|null…],bot:[…]}],rl,rr}: la colonia i tocca rt[i],rt[i+1],rb[i],rb[i+1];
   rl/rr = strada libera a sinistra/destra (serve per costruire una colonia). hands[i] = carte (id) nascoste agli altri dalla vista.
   cur = chi deve agire (anche l'avversario, per una scelta), turn = di chi è il turno. phase: roll · choose · main · draw · exch · pick.
   Azioni: roll · {t:'play',i,n|col,side|…} · build · trade · gnave · end · sel · draw · discard · exch · exchlook · pick · skip. */
const CDUEL=(()=>{
let RND=Math.random;
const die=()=>1+Math.floor(RND()*6);
const clone=s=>JSON.parse(JSON.stringify(s));
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const TY=['L','A','G','N','R','O'];
const TN={L:'legno',A:'argilla',G:'grano',N:'lana',R:'roccia',O:'oro'};
const RN={L:'Bosco',A:'Colline',G:'Campi',N:'Pascolo',R:'Montagna',O:'Miniera d’oro'};
const EVN=['Banditi','Commercio','Festa','Raccolto','Evento','Evento'];
const mk=(k,n,cost,o)=>Object.assign({k,n,cost,cnt:1},o);
const CARDS={
 abbazia:mk('ed','Abbazia',{A:1,R:1,O:1},{pr:1,cnt:2,d:'+1 punto progresso: tieni una carta in più in mano.'}),
 mercato:mk('ed','Mercato',{L:1,A:1,G:1},{co:1,uniq:1,cnt:2,d:'1 punto commercio. Se esce un numero che hai su meno regioni dell’avversario, prendi 1 risorsa.'}),
 sala:mk('ed','Sala del Concilio',{L:1,R:1},{ab:1,cnt:2,d:'1 punto abilità (conta per la Festa).'}),
 magazzino:mk('ed','Magazzino',{L:1,A:1},{cnt:2,d:'Le risorse sulle due regioni accanto non contano per i banditi e restano al sicuro.'}),
 dazio:mk('ed','Ponte a pedaggio',{L:1,R:1},{d:'Nel Raccolto abbondante prendi 2 oro in più.'}),
 segheria:mk('ed','Segheria',{A:1,R:1},{bo:'L',d:'Le regioni di legno accanto producono il doppio.'}),
 fornace:mk('ed','Fornace',{L:1,R:1},{bo:'A',d:'Le colline accanto producono il doppio.'}),
 mulino:mk('ed','Mulino',{L:1,A:1},{bo:'G',d:'I campi accanto producono il doppio.'}),
 filanda:mk('ed','Filanda',{L:1,G:1},{bo:'N',d:'I pascoli accanto producono il doppio.'}),
 fonderia:mk('ed','Fonderia',{A:2,L:1},{bo:'R',d:'Le montagne accanto producono il doppio.'}),
 gnave:mk('nave','Gran veliero',{L:1,A:1,N:1},{co:2,uniq:1,big:1,d:'2 punti commercio. Spendi 2 risorse da una regione accanto e prendi 1 risorsa a scelta.'}),
 arciere:mk('eroe','Arciere',{L:1,N:1},{fr:1,d:'1 punto forza.'}),
 cavaliere:mk('eroe','Cavaliere',{G:1,R:1,N:1},{fr:2,d:'2 punti forza.'}),
 mercenario:mk('eroe','Mercenario',{R:2,G:1,O:1},{fr:3,d:'3 punti forza.'}),
 condottiera:mk('eroe','Condottiera',{R:2,G:1},{fr:2,ab:1,d:'2 punti forza e 1 punto abilità.'}),
 menestrello:mk('eroe','Menestrello',{L:1,N:1,O:1},{ab:2,d:'2 punti abilità.'}),
 viandante:mk('eroe','Viandante',{L:1,A:1},{fr:1,co:1,d:'1 punto forza e 1 punto commercio.'}),
 veggente:mk('az','Veggente',{},{cnt:2,d:'Prima del tiro scegli il numero del dado di produzione; poi tira l’evento.'}),
 orafo:mk('az','Orafo',{O:3},{cnt:2,d:'Spendi 3 oro e prendi 2 risorse a scelta.'}),
 carovana:mk('az','Carovana',{},{cnt:2,d:'Spendi esattamente 2 risorse e prendine 2 a scelta.'}),
 trasloco:mk('az','Trasloco',{},{d:'Scambia di posto due tue regioni.'}),
 cartografo:mk('az','Cartografo',{},{cnt:2,d:'Mentre costruisci una colonia scegli tu le 2 regioni nuove.'})};
for(const t of TY)CARDS['nave_'+t]=mk('nave','Nave del '+TN[t],t==='L'?{A:1,N:1}:{L:1,N:1},{t,co:1,d:'1 punto commercio. Scambi 2 '+TN[t]+' con 1 risorsa a scelta.'});
const IDS=Object.keys(CARDS);
const COST={strada:{L:1,A:2},colonia:{L:1,A:1,G:1,N:1},citta:{R:3,G:2}};
const EVLIST=['solstizio','faida','discordia','ingegno','regata','mercante','mercante','annata','annata'];
const EVNAME={solstizio:'Solstizio',faida:'Faida',discordia:'Discordia',ingegno:'Ingegno',regata:'Regata',mercante:'Mercante errante',annata:'Annata d’oro'};
const EVDESC={solstizio:'Si rimescola il mazzo degli eventi e se ne pesca un altro.',faida:'Chi ha più forza ruba 1 risorsa all’avversario.',discordia:'Chi ha più forza prende una carta a caso dalla mano dell’avversario.',ingegno:'Ognuno prende 1 risorsa per punto progresso (al massimo 2).',regata:'Chi ha più punti commercio prende 1 risorsa.',mercante:'Chi ha almeno 1 punto commercio prende 1 risorsa.',annata:'Si tira di nuovo il dado di produzione: tutte le regioni con quel numero producono.'};
/* ---------- piccole utilità ---------- */
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const regs=p=>[...p.rt.map((r,i)=>['t'+i,r]),...p.rb.map((r,i)=>['b'+i,r])];
const R=(p,ref)=>{const m=/^([tb])(\d+)$/.exec(typeof ref==='string'?ref:'');return m?((m[1]==='t'?p.rt:p.rb)[+m[2]]||null):null};
const sideK=side=>side==='top'?'t':'b';
const nb=(i,side)=>[sideK(side)+i,sideK(side)+(i+1)];
const has=(p,id)=>p.cols.some(c=>c.top.includes(id)||c.bot.includes(id));
function pts(s,i,k){let n=0;for(const c of s.p[i].cols)for(const sd of['top','bot'])for(const id of c[sd])if(id&&CARDS[id][k])n+=CARDS[id][k];return n}
const vp=(s,i)=>s.p[i].cols.reduce((a,c)=>a+c.c,0)+(s.tok.eroe===i?1:0)+(s.tok.comm===i?1:0);
const limit=(s,i)=>3+pts(s,i,'pr');
const nres=p=>regs(p).reduce((a,x)=>a+x[1].r,0);
function safe(p){const set=new Set();p.cols.forEach((c,i)=>{for(const sd of['top','bot'])if(c[sd].includes('magazzino'))nb(i,sd).forEach(r=>set.add(r))});return set}
const freeSlot=(c,side)=>c[side].indexOf(null);
/* pagamento automatico: per ogni tipo si prende dalle regioni più cariche */
function plan(p,cost){const out=[];for(const t of Object.keys(cost)){let need=cost[t];const rs=regs(p).filter(x=>x[1].t===t&&x[1].r>0).sort((a,b)=>b[1].r-a[1].r);
 for(const[ref,r]of rs){const k=Math.min(need,r.r);out.push([ref,k]);need-=k;if(!need)break}if(need)return null}return out}
const canPay=(p,c)=>!!plan(p,c);
function spend(p,pl){for(const[ref,k]of pl)R(p,ref).r-=k}
function planAny(p,n){const rs=regs(p).filter(x=>x[1].r>0).sort((a,b)=>b[1].r-a[1].r),out=[];let need=n;for(const[ref,r]of rs){const k=Math.min(need,r.r);out.push([ref,k]);need-=k;if(!need)break}return need?null:out}
function add(r,n){const b=r.r;r.r=Math.min(3,r.r+n);return r.r-b}
const cardName=id=>CARDS[id].n;
const nm=(s,i)=>s.names[i];
/* ---------- preparazione ---------- */
function buildEvents(){const r=shuffle(EVLIST.filter(x=>x!=='solstizio'));return[...r.slice(3),'solstizio',...r.slice(0,3)]}
function freshRegs(){const a=[];for(const t of TY)for(let n=1;n<=6;n++)a.push({t,n});return shuffle(a)}
function startP(){const ty=shuffle(TY),nu=shuffle([1,2,3,4,5,6]),r=ty.map((t,i)=>({t,n:nu[i],r:t==='O'?0:1}));
 return{rt:r.slice(0,3),rb:r.slice(3),cols:[{c:1,top:[null],bot:[null]},{c:1,top:[null],bot:[null]}],rl:false,rr:false}}
function newGame(n,names,o={}){const goal=o.k==='7'||o.k==='breve'?7:12;
 const deck=[];for(const id of IDS)for(let k=0;k<CARDS[id].cnt;k++)deck.push(id);
 const all=shuffle(deck),stacks=[0,1,2,3].map(i=>all.slice(i*9,i*9+9));
 const first=Math.floor(RND()*2),a=Math.floor(RND()*4),b=(a+1+Math.floor(RND()*3))%4,hands=[[],[]];
 hands[first]=stacks[a].splice(0,3);hands[1-first]=stacks[b].splice(0,3);
 const s={n:2,names:names.slice(0,2),cur:first,turn:first,hands,log:[],ev:[],evn:0,over:null,phase:'roll',goal,p:[startP(),startP()],stacks,disc:[],regs:freshRegs(),evs:buildEvents(),
  tok:{eroe:null,comm:null},pend:[],look:null,dice:null,na:0,tn:1,nev:null};
 L(s,'Si gioca fino a '+goal+' punti · comincia '+names[first]);return s}
/* ---------- segni (forza e commercio) ---------- */
function upd(s){for(const[k,key]of[['eroe','fr'],['comm','co']]){const P=[pts(s,0,key),pts(s,1,key)];let h=s.tok[k];const old=h;
 if(h!=null&&(P[h]<3||P[1-h]>P[h]))h=null;
 if(h==null){if(P[0]>=3&&P[0]>P[1])h=0;else if(P[1]>=3&&P[1]>P[0])h=1}
 if(h!==old){s.tok[k]=h;L(s,h==null?(k==='eroe'?'Il segno del comando torna in mezzo':'Il segno del commercio torna in mezzo'):nm(s,h)+' prende il segno '+(k==='eroe'?'del comando':'del commercio'));s.ev.push({t:'tok',k,p:h})}}}
/* ---------- scelte in sospeso (raccolti, furti) ---------- */
function opts(s,q){const P=s.p[q.p];
 if(q.k==='gain')return regs(P).filter(x=>x[1].r<3).map(x=>x[0]);
 const O=s.p[1-q.p];return regs(O).filter(x=>x[1].r>0&&regs(P).some(y=>y[1].t===x[1].t)).map(x=>x[0])}
function settle(s){while(s.pend.length&&!opts(s,s.pend[0]).length)s.pend.shift();
 if(s.pend.length){s.phase='choose';s.cur=s.pend[0].p}else{if(s.phase==='choose')s.phase='main';s.cur=s.turn}}
const gain=(s,p,why,n=1)=>{s.pend.push({p,k:'gain',n,w:why})};
const steal=(s,p,why)=>{s.pend.push({p,k:'steal',n:1,w:why})};
/* ---------- tiro, produzione, eventi ---------- */
function produce(s,n){for(let i=0;i<2;i++){const p=s.p[i];for(const[ref,r]of regs(p)){if(r.n!==n)continue;const j=+ref.slice(1),sd=ref[0]==='t'?'top':'bot';
  let k=1;for(const c of[p.cols[j-1],p.cols[j]])if(c&&c[sd].some(id=>id&&CARDS[id].bo===r.t))k=2;
  if(add(r,k))s.ev.push({t:'prod',p:i,ref})}}
 for(let i=0;i<2;i++)if(has(s.p[i],'mercato')){const c=x=>regs(s.p[x]).filter(y=>y[1].n===n).length;if(c(1-i)>c(i)){gain(s,i,'Mercato');L(s,nm(s,i)+' beneficia del Mercato')}}}
function banditi(s){for(let i=0;i<2;i++){const p=s.p[i],sf=safe(p),tot=regs(p).reduce((a,x)=>a+(sf.has(x[0])?0:x[1].r),0);
 if(tot>7){let lost=0;for(const[ref,r]of regs(p))if((r.t==='N'||r.t==='O')&&!sf.has(ref)&&r.r){lost+=r.r;r.r=0}
  L(s,'I banditi colpiscono '+nm(s,i)+(lost?': perde '+lost+' risorse di lana e oro':' ma non trovano nulla'));s.ev.push({t:'raid',p:i})}}}
function evCard(s){const c=s.evs.shift();
 if(c==='solstizio'){L(s,'Solstizio: il mazzo degli eventi viene rimescolato');s.evs=buildEvents();s.ev.push({t:'event',c});return evCard(s)}
 s.evs.push(c);s.nev=c;L(s,'Evento: '+EVNAME[c]);s.ev.push({t:'event',c});
 const f=[pts(s,0,'fr'),pts(s,1,'fr')],co=[pts(s,0,'co'),pts(s,1,'co')];
 if(c==='faida'){if(f[0]!==f[1]){const w=f[0]>f[1]?0:1;steal(s,w,'Faida')}}
 else if(c==='discordia'){if(f[0]!==f[1]){const w=f[0]>f[1]?0:1,h=s.hands[1-w];if(h.length){const k=Math.floor(RND()*h.length);s.hands[w].push(h.splice(k,1)[0]);L(s,nm(s,w)+' prende una carta a '+nm(s,1-w))}}}
 else if(c==='ingegno'){for(let i=0;i<2;i++)gain(s,i,'Ingegno',Math.min(2,pts(s,i,'pr')))}
 else if(c==='regata'){if(co[0]!==co[1])gain(s,co[0]>co[1]?0:1,'Regata')}
 else if(c==='mercante'){for(let i=0;i<2;i++)if(co[i]>=1)gain(s,i,'Mercante errante')}
 else if(c==='annata'){const n=die();L(s,'Annata d’oro: si tira '+n);produce(s,n)}}
function roll(s,n,e){s.dice={n,e};s.ev.push({t:'roll',n,e});L(s,nm(s,s.turn)+' tira '+n+' · '+EVN[e]);
 if(e===0)banditi(s);
 produce(s,n);
 if(e===1){if(s.tok.comm!=null)steal(s,s.tok.comm,'Commercio')}
 else if(e===2){const a=pts(s,0,'ab'),b=pts(s,1,'ab');if(a===b){gain(s,0,'Festa');gain(s,1,'Festa')}else gain(s,a>b?0:1,'Festa')}
 else if(e===3){for(let i=0;i<2;i++){gain(s,i,'Raccolto');if(has(s.p[i],'dazio')){const g=regs(s.p[i]).filter(x=>x[1].t==='O');let k=2;for(const[,r]of g)k-=add(r,k)}}}
 else if(e>=4)evCard(s);
 s.phase='main';s.na=0;settle(s)}
/* ---------- fine turno, mano ---------- */
function endTurn(s){const t=s.turn;upd(s);
 s.turn=1-t;s.cur=s.turn;s.phase='roll';s.tn++;s.na=0;s.look=null;s.dice=null;L(s,'Tocca a '+nm(s,s.turn));s.ev.push({t:'turn',p:s.turn})}
function handStep(s){const p=s.turn,h=s.hands[p],lim=limit(s,p);
 if(h.length>lim){s.phase='draw';return}
 if(h.length<lim&&s.stacks.some(x=>x.length)){s.phase='draw';return}
 s.phase='exch'}
function chk(s){if(s.over)return;const t=s.turn;if(s.phase!=='roll'&&s.phase!=='choose'&&vp(s,t)>=s.goal){s.over={win:t,scores:[vp(s,0),vp(s,1)],reason:vp(s,t)+' punti'};L(s,nm(s,t)+' vince con '+vp(s,t)+' punti!');s.ev.push({t:'end',win:t})}}
/* ---------- azioni ---------- */
const E=m=>({err:m});
function newRegs(s,k,pick){const out=[];
 if(pick){const idx=[...pick].map(Number);if(idx.length!==k||new Set(idx).size!==k||idx.some(j=>!Number.isInteger(j)||j<0||j>=s.regs.length))return null;
  const cs=idx.map(j=>s.regs[j]);s.regs=s.regs.filter((_,j)=>!idx.includes(j));return cs.map(c=>({t:c.t,n:c.n,r:0}))}
 for(let i=0;i<k;i++){if(!s.regs.length)s.regs=freshRegs();const c=s.regs.shift();out.push({t:c.t,n:c.n,r:0})}return out}
function doBuild(s,a){const P=s.p[s.cur],w=a.w;
 if(w==='strada'){const sd=a.side==='L'?'rl':a.side==='R'?'rr':null;if(!sd)return E('Scegli il lato');if(P[sd])return E('C’è già una strada libera da quel lato');
  const pl=plan(P,COST.strada);if(!pl)return E('Servono 1 legno e 2 argilla');spend(P,pl);P[sd]=true;L(s,nm(s,s.cur)+' costruisce una strada');s.ev.push({t:'build',p:s.cur,w});return null}
 if(w==='colonia'){const sd=a.side==='L'?'rl':a.side==='R'?'rr':null;if(!sd)return E('Scegli il lato');if(!P[sd])return E('Serve prima una strada da quel lato');
  const pl=plan(P,COST.colonia);if(!pl)return E('Servono legno, argilla, grano e lana');
  let k=-1;if(a.scout!=null){k=s.hands[s.cur].indexOf('cartografo');if(k<0)return E('Non hai il Cartografo')}
  const rg=newRegs(s,2,a.scout);if(!rg)return E('Regioni non valide');
  spend(P,pl);if(k>=0){s.disc.push(...s.hands[s.cur].splice(k,1))}
  const c={c:1,top:[null],bot:[null]};
  if(a.side==='L'){P.cols.unshift(c);P.rt.unshift(rg[0]);P.rb.unshift(rg[1]);P.rl=false}else{P.cols.push(c);P.rt.push(rg[0]);P.rb.push(rg[1]);P.rr=false}
  L(s,nm(s,s.cur)+' fonda una colonia');s.ev.push({t:'build',p:s.cur,w});return null}
 if(w==='citta'){const c=P.cols[a.col];if(!c)return E('Colonia non valida');if(c.c!==1)return E('È già una città');const pl=plan(P,COST.citta);if(!pl)return E('Servono 3 roccia e 2 grano');
  spend(P,pl);c.c=2;c.top.push(null);c.bot.push(null);L(s,nm(s,s.cur)+' ingrandisce una colonia in città');s.ev.push({t:'build',p:s.cur,w});return null}
 return E('Costruzione sconosciuta')}
function doPlay(s,a){const me=s.cur,P=s.p[me],h=s.hands[me],id=h[a.i];if(id==null)return E('Carta non valida');const cd=CARDS[id];
 if(cd.k==='az'){
  if(id==='veggente')return E('Il Veggente si gioca prima del tiro');
  if(id==='cartografo')return E('Il Cartografo si gioca mentre costruisci una colonia');
  if(id==='orafo'){const pl=plan(P,cd.cost);if(!pl)return E('Servono 3 oro');const to=a.to;if(!Array.isArray(to)||to.length!==2)return E('Scegli 2 regioni');
   const rr=to.map(x=>R(P,x));if(rr.some(x=>!x))return E('Regione non valida');spend(P,pl);rr.forEach(r=>add(r,1));}
  else if(id==='carovana'){const f=a.from,to=a.to;if(!Array.isArray(f)||!Array.isArray(to)||f.length!==2||to.length!==2)return E('Scegli 2 risorse da dare e 2 da prendere');
   const need={};for(const x of f)need[x]=(need[x]||0)+1;for(const x of Object.keys(need)){const r=R(P,x);if(!r||r.r<need[x])return E('Non hai quelle risorse')}
   const rr=to.map(x=>R(P,x));if(rr.some(x=>!x))return E('Regione non valida');for(const x of f)R(P,x).r--;rr.forEach(r=>add(r,1))}
  else if(id==='trasloco'){const A=a.a,B=a.b;if(A===B||!R(P,A)||!R(P,B))return E('Scegli due regioni diverse');
   const get=ref=>(ref[0]==='t'?P.rt:P.rb),ia=+A.slice(1),ib=+B.slice(1),ga=get(A),gb=get(B),t=ga[ia];ga[ia]=gb[ib];gb[ib]=t}
  else return E('Carta non giocabile');
  s.disc.push(...h.splice(a.i,1));L(s,nm(s,me)+' gioca '+cardName(id));s.ev.push({t:'card',p:me,id});return null}
 const c=P.cols[a.col];if(!c||(a.side!=='top'&&a.side!=='bot'))return E('Scegli un posto');
 if(cd.big&&!c)return E('Posto non valido');
 if(cd.uniq&&has(P,id))return E('Ne hai già una');
 const k=freeSlot(c,a.side);if(k<0)return E('Quel lato è pieno');
 const pl=plan(P,cd.cost);if(!pl)return E('Non hai le risorse per '+cd.n);
 spend(P,pl);c[a.side][k]=id;h.splice(a.i,1);L(s,nm(s,me)+' mette in gioco '+cd.n);s.ev.push({t:'card',p:me,id,col:a.col,side:a.side});return null}
function rate(P,t){return has(P,'nave_'+t)?2:3}
function doTrade(s,a){const P=s.p[s.cur],t=a.give;if(!TN[t])return E('Scegli cosa dare');const to=R(P,a.to);if(!to)return E('Scegli dove mettere la risorsa');
 if(to.t===t)return E('Scambia con una risorsa diversa');const k=rate(P,t),pl=plan(P,{[t]:k});if(!pl)return E('Servono '+k+' '+TN[t]);
 spend(P,pl);to.r=Math.min(3,to.r+1);L(s,nm(s,s.cur)+' scambia '+k+' '+TN[t]+' con 1 '+TN[to.t]);s.ev.push({t:'trade',p:s.cur});return null}
function doGnave(s,a){const P=s.p[s.cur];let ok=false;P.cols.forEach((c,i)=>{for(const sd of['top','bot'])if(c[sd].includes('gnave')&&nb(i,sd).includes(a.from))ok=true});
 const f=R(P,a.from),to=R(P,a.to);if(!ok||!f||!to)return E('Servono il Gran veliero e una sua regione vicina');if(f.r<2)return E('Servono 2 risorse su quella regione');
 f.r-=2;add(to,1);L(s,nm(s,s.cur)+' commercia col Gran veliero');s.ev.push({t:'trade',p:s.cur});return null}
function doSel(s,a){const q=s.pend[0];if(!q)return E('Niente da scegliere');if(!opts(s,q).includes(a.ref))return E('Scelta non valida');
 const P=s.p[q.p],O=s.p[1-q.p];
 if(q.k==='gain'){add(R(P,a.ref),1);s.ev.push({t:'prod',p:q.p,ref:a.ref});L(s,nm(s,q.p)+' prende 1 '+TN[R(P,a.ref).t]+' ('+q.w+')')}
 else{const r=R(O,a.ref);r.r--;const mine=regs(P).filter(x=>x[1].t===r.t).sort((x,y)=>x[1].r-y[1].r)[0][1];add(mine,1);L(s,nm(s,q.p)+' prende 1 '+TN[r.t]+' a '+nm(s,1-q.p)+' ('+q.w+')');s.ev.push({t:'steal',p:q.p})}
 if(--q.n<=0)s.pend.shift();settle(s);return null}
function act(st,a){if(st.over)return E('Partita finita');if(!a||!a.t)return E('Azione sconosciuta');
 const s=clone(st);s.ev=[];const ph=s.phase,me=s.cur;let r=null;
 if(ph==='choose'){if(a.t!=='sel')return E('Scegli una regione');r=doSel(s,a)}
 else if(ph==='roll'){
  if(a.t==='roll')roll(s,die(),die()-1);
  else if(a.t==='play'){const i=s.hands[me].indexOf('veggente');if(a.i!==i&&s.hands[me][a.i]!=='veggente')return E('Prima del tiro si gioca solo il Veggente');
   const n=+a.n;if(!Number.isInteger(n)||n<1||n>6)return E('Scegli un numero da 1 a 6');
   const k=s.hands[me][a.i]==='veggente'?a.i:i;s.disc.push(...s.hands[me].splice(k,1));L(s,nm(s,me)+' gioca il Veggente');roll(s,n,die()-1)}
  else return E('Tira i dadi')}
 else if(ph==='main'){
  if(a.t==='build')r=doBuild(s,a);
  else if(a.t==='play')r=doPlay(s,a);
  else if(a.t==='trade')r=doTrade(s,a);
  else if(a.t==='gnave')r=doGnave(s,a);
  else if(a.t==='end'){handStep(s);if(s.phase==='exch'&&!s.hands[me].length)endTurn(s)}
  else return E('Azione non valida ora')}
 else if(ph==='draw'){const h=s.hands[me],lim=limit(s,me);
  if(a.t==='draw'){if(h.length>=lim)return E('Hai già abbastanza carte');const st2=s.stacks[a.stack];if(!st2||!st2.length)return E('Mazzo vuoto');h.push(st2.shift());s.ev.push({t:'draw',p:me})}
  else if(a.t==='discard'){if(h.length<=lim)return E('Non devi scartare');if(h[a.i]==null||!s.stacks[a.stack])return E('Scarto non valido');s.stacks[a.stack].push(h.splice(a.i,1)[0])}
  else return E('Pesca o scarta fino al limite');
  handStep(s);if(s.phase==='exch'&&!s.hands[me].length)endTurn(s)}
 else if(ph==='exch'){
  if(a.t==='skip')endTurn(s);
  else if(a.t==='exch'||a.t==='exchlook'){const h=s.hands[me];if(h[a.i]==null||!s.stacks[a.to])return E('Scambio non valido');
   if(a.t==='exch'){const tk=s.stacks[a.take];if(!tk)return E('Scegli un mazzo');s.stacks[a.to].push(h.splice(a.i,1)[0]);if(!tk.length){h.push(s.stacks[a.to].pop());return E('Quel mazzo è vuoto')}h.push(tk.shift());L(s,nm(s,me)+' scambia una carta');endTurn(s)}
   else{const lk=s.stacks[a.look];if(!lk)return E('Scegli un mazzo');const pl=planAny(s.p[me],2);if(!pl)return E('Servono 2 risorse');spend(s.p[me],pl);s.stacks[a.to].push(h.splice(a.i,1)[0]);
    if(!lk.length)return E('Quel mazzo è vuoto');s.look={p:me,stack:a.look};s.phase='pick';L(s,nm(s,me)+' paga 2 risorse per guardare un mazzo')}}
  else return E('Scambia una carta o salta')}
 else if(ph==='pick'){if(a.t!=='pick')return E('Scegli una carta');const lk=s.stacks[s.look.stack];if(!Number.isInteger(a.j)||a.j<0||a.j>=lk.length)return E('Carta non valida');
  s.hands[me].push(lk.splice(a.j,1)[0]);s.look=null;endTurn(s)}
 if(r&&r.err)return r;
 s.na++;upd(s);chk(s);s.evn++;return{s}}
/* ---------- azioni possibili (per bot e interfaccia) ---------- */
function legal(s){const me=s.cur,P=s.p[me],h=s.hands[me],out=[];if(s.over)return out;
 if(s.phase==='choose')return opts(s,s.pend[0]).map(ref=>({t:'sel',ref}));
 if(s.phase==='roll'){out.push({t:'roll'});const i=h.indexOf('veggente');if(i>=0)for(let n=1;n<=6;n++)out.push({t:'play',i,n});return out}
 if(s.phase==='main'){out.push({t:'end'});
  for(const sd of['L','R']){if(!P[sd==='L'?'rl':'rr']){if(canPay(P,COST.strada))out.push({t:'build',w:'strada',side:sd})}else if(canPay(P,COST.colonia))out.push({t:'build',w:'colonia',side:sd})}
  if(canPay(P,COST.citta))P.cols.forEach((c,col)=>{if(c.c===1)out.push({t:'build',w:'citta',col})});
  const seen=new Set();h.forEach((id,i)=>{if(seen.has(id))return;seen.add(id);const cd=CARDS[id];
   if(cd.k==='az'){if(id==='orafo'&&canPay(P,cd.cost)){const rf=regs(P).filter(x=>x[1].r<3).map(x=>x[0]);for(let x=0;x<rf.length;x++)for(let y=x;y<rf.length;y++)out.push({t:'play',i,to:[rf[x],rf[y]]})}return}
   if(cd.uniq&&has(P,id)||!canPay(P,cd.cost))return;
   P.cols.forEach((c,col)=>{for(const sd of['top','bot'])if(freeSlot(c,sd)>=0)out.push({t:'play',i,col,side:sd})})});
  for(const t of TY){const k=rate(P,t);if(regs(P).filter(x=>x[1].t===t).reduce((a,x)=>a+x[1].r,0)>=k)for(const[ref,r]of regs(P))if(r.t!==t&&r.r<3)out.push({t:'trade',give:t,to:ref})}
  return out}
 if(s.phase==='draw'){const lim=limit(s,me);if(h.length>lim)h.forEach((_,i)=>s.stacks.forEach((_2,k)=>out.push({t:'discard',i,stack:k})));
  else s.stacks.forEach((x,k)=>{if(x.length)out.push({t:'draw',stack:k})});return out}
 if(s.phase==='exch'){out.push({t:'skip'});h.forEach((_,i)=>s.stacks.forEach((_2,to)=>s.stacks.forEach((x,tk)=>{if(x.length>(tk===to?0:0))out.push({t:'exch',i,to,take:tk})})));return out}
 if(s.phase==='pick')return s.stacks[s.look.stack].map((_,j)=>({t:'pick',j}));
 return out}
/* ---------- bot ---------- */
const VAL={R:5,G:5,O:3,A:3,L:3,N:2};
function need(P,cost){const m={};for(const t of Object.keys(cost)){const have=regs(P).filter(x=>x[1].t===t).reduce((a,x)=>a+x[1].r,0);if(have<cost[t])m[t]=cost[t]-have}return m}
function bot(s,rnd){const R2=rnd||RND,me=s.cur,P=s.p[me],h=s.hands[me],ls=legal(s);if(!ls.length)return null;
 const pick=a=>a[Math.floor(R2()*a.length)];
 if(s.phase==='choose'){const sc=a=>{const r=s.pend[0].k==='gain'?R(P,a.ref):R(s.p[1-me],a.ref);return VAL[r.t]*2+(s.pend[0].k==='gain'?3-r.r:0)};const best=Math.max(...ls.map(sc));return pick(ls.filter(a=>sc(a)===best))}
 if(s.phase==='roll')return ls.find(a=>a.t==='roll');
 if(s.phase==='draw'){if(ls[0].t==='discard'){const sc=i=>{const c=CARDS[h[i]];return c.k==='eroe'?5:c.k==='az'?(h[i]==='orafo'?4:1):3};let b=0;h.forEach((_,i)=>{if(sc(i)<sc(b))b=i});return ls.find(a=>a.i===b)}
  return pick(ls.filter(a=>s.stacks[a.stack].length===Math.max(...s.stacks.map(x=>x.length))))}
 if(s.phase==='exch')return{t:'skip'};
 if(s.phase==='pick')return ls[0];
 if(s.na>30)return{t:'end'};
 let best=null,bs=0.5;const sc=a=>{
  if(a.t==='build'){if(a.w==='citta')return 100;if(a.w==='colonia')return 90;if(a.w==='strada')return P.rl||P.rr?0:(nres(P)>=6?50:8)}
  if(a.t==='play'){const id=h[a.i],cd=CARDS[id];if(id==='orafo')return 60;
   if(cd.k==='eroe')return 55+6*(cd.fr||0)+4*(cd.ab||0);if(cd.k==='nave')return cd.big?50:38;if(cd.pr)return 52;if(cd.co)return 48;if(cd.bo)return 42;return 30+(cd.ab?4:0)}
  if(a.t==='trade'){const tgt=R(P,a.to),m=need(P,COST.citta),m2=need(P,COST.colonia);const want=m[tgt.t]||(P.rl||P.rr?m2[tgt.t]:0);if(!want)return 0;
   const have=regs(P).filter(x=>x[1].t===a.give).reduce((x,y)=>x+y[1].r,0),k=rate(P,a.give),needed=Math.max(COST.citta[a.give]||0,(P.rl||P.rr)?COST.colonia[a.give]||0:0);if(have-k<needed)return 0;return 20+want}
  return 0};
 for(const a of ls){const v=sc(a)+R2()*.1;if(v>bs){bs=v;best=a}}
 return best||{t:'end'}}
return{newGame,act,legal,bot,setRnd:f=>{RND=f},CARDS,IDS,TY,TN,RN,EVN,EVNAME,EVDESC,COST,regs,R,vp,pts,limit,rate,plan,canPay,nb,has,safe,opts,freeSlot,nres}})();
if(typeof module!=='undefined')module.exports=CDUEL;
