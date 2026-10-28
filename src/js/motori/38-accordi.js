/* ACCORDI DELLA NATURA (1-4) – paesaggi a pile di dischi e animali che li abitano.
   Meccaniche ispirate a un gioco commerciale del 2024 e alle sue due espansioni; nomi, animali, schemi, punteggi e testi sono nostri.
   Dischi: b acqua, g roccia, m tronco, v chioma, y campo, r tetto. Una casella tiene una pila (stringa dal basso all'alto, es. 'mmv').
   Coordinate assiali 'q,r' (esagoni a punta in su). Moduli (opzione x): Custodi, Tre Toni (animali a tre paesaggi), Fortissimo
   (Rifugi, Folletti, lati C e D della plancia). */
const ACC=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));
const COL='bgmvyr',CN={b:'acqua',g:'roccia',m:'tronco',v:'chioma',y:'campo',r:'tetto'};
const NTOK={g:23,b:23,m:21,v:19,y:19,r:15};
const DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const K=(q,r)=>q+','+r,QR=k=>k.split(',').map(Number);
const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};const E=(s,o)=>s.ev.push(o);
/* ---------- plance: righe 5/4/5/4/5, quelle dispari spostate di mezzo esagono ---------- */
const ROWS=[5,4,5,4,5];
function shape(side){const out=[];ROWS.forEach((n,r)=>{for(let c=0;c<n;c++){if(side==='C'&&r===2&&c===2)continue;out.push(K(c-(r-(r&1))/2,r))}});return out}
const ARID_RC=[[0,0],[4,0],[0,2],[2,2],[4,2],[0,4],[4,4]];
const ARID=ARID_RC.map(([c,r])=>K(c-(r-(r&1))/2,r));
const SIDES={A:'Fiume',B:'Isole',C:'Cratere',D:'Terre aride'};
/* ---------- carte: schema = celle [dq,dr,bisogno], la prima è dove va il cubetto ----------
   bisogni: b acqua, y campo, g/gg/ggg monte alto 1-3, v/mv/mmv albero alto 1-3, H casa (tetto su un disco) */
const P=s=>s.split(';').map(x=>{const[n,q,r]=x.split(/[@,]/);return[+(q||0),+(r||0),n]});
const A_BASE=[
 ['lontra','Lontra','b;b@1,0;v@0,1',[3,7,12,18]],['airone','Airone','b;y@1,0',[2,5,9,14,20]],['rana','Rana','b;v@1,0',[2,5,8,12,17]],
 ['martin','Martin pescatore','mv;b@1,0;b@-1,0',[5,11,18]],['castoro','Castoro','b;mv@1,0;mv@-1,0',[6,13,21]],['trota','Trota','b;b@1,0;g@-1,0',[3,7,12,18]],
 ['fenicottero','Fenicottero','b;b@1,0;y@0,1',[4,9,15]],['cervo','Cervo','mmv;y@1,0',[5,11,18]],['capriolo','Capriolo','y;mv@1,0',[3,7,12,18]],
 ['lepre','Lepre','y;y@1,0;v@1,-1',[3,7,12,18]],['volpe','Volpe','H;y@1,0',[4,9,15]],['riccio','Riccio','v;v@1,0;y@0,1',[3,7,12]],
 ['tasso','Tasso','mv;g@1,0',[4,9,15]],['cinghiale','Cinghiale','mmv;mmv@1,0',[7,15]],['scoiattolo','Scoiattolo','mmv;v@1,0',[5,11,18]],
 ['picchio','Picchio','mmv;mv@1,0;v@-1,0',[6,13,21]],['gufo','Gufo','mmv;H@1,0',[6,13,21]],['lupo','Lupo','mmv;gg@1,0',[7,15,24]],
 ['orso','Orso','ggg;mmv@1,0',[9,19]],['camoscio','Camoscio','gg;gg@1,0',[4,9,15]],['stambecco','Stambecco','ggg;g@1,0',[6,13,21]],
 ['aquila','Aquila','ggg;gg@1,0;g@-1,0',[10,21]],['marmotta','Marmotta','g;y@1,0',[2,5,9,14]],['falco','Falco','gg;b@1,0',[4,9,15,22]],
 ['rondine','Rondine','H;H@1,0',[5,11,18]],['pipistrello','Pipistrello','H;mmv@1,0',[6,13]],['gatto','Gatto selvatico','H;v@1,0',[3,7,12,18]],
 ['cicogna','Cicogna','H;b@1,0',[4,9,15]],['ape','Ape','y;y@1,0;y@0,1',[3,7,12,18]],['farfalla','Farfalla','y;v@1,0;v@-1,0',[3,7,12]],
 ['salamandra','Salamandra','g;b@1,0;b@0,1',[3,7,12,18]],['gabbiano','Gabbiano','b;H@1,0',[4,9,15]]];
const A_TRE=[ /* Tre Toni: tre paesaggi diversi, schemi asimmetrici (lo specchio conta) */
 ['lince','Lince','mmv;gg@1,0;y@0,1',[8,17,27]],['tritone','Tritone','b;v@1,0;g@0,1',[6,13,21]],['upupa','Upupa','y;H@1,0;mv@1,-1',[7,15,24]],
 ['cervovolante','Cervo volante','mv;y@1,0;b@-1,0',[5,11,18]],['gru','Gru','b;y@1,0;H@1,-1',[6,13,21]],['allocco','Allocco','mmv;H@1,0;b@0,1',[9,19]],
 ['ermellino','Ermellino','gg;v@1,0;y@2,0',[7,15]],['martora','Martora','mv;gg@1,0;b@1,-1',[8,17]],['tartaruga','Tartaruga','b;b@1,0;y@0,1;v@-1,1',[6,13,21]],
 ['ghiro','Ghiro','mmv;y@0,1;g@-1,1',[7,15,24]]];
const A_FOL=[ /* Folletti: due cubetti, possono stare insieme a un cubetto animale */
 ['lucciola','Lucciola','v'],['fungo','Fungo','mmv'],['muschio','Muschio','g;v@1,0'],['quarzo','Quarzo','ggg'],['corallo','Corallo','b;b@1,0'],
 ['ninfea','Ninfea','b;y@1,0'],['lichene','Lichene','gg;g@1,0'],['papavero','Papavero','y;y@1,0'],['edera','Edera','H;v@1,0'],['felce','Felce','mv;mv@1,0']];
const SPIRITI=[ /* Custodi: un cubetto e un punteggio di fine partita */
 ['campi','Custode dei campi','y;y@1,0','Ogni campo di 3 o più dischi gialli: 8 punti; i campi più piccoli: 2'],
 ['monti','Custode delle vette','ggg','4 punti per ogni monte alto 3'],
 ['bosco','Custode del bosco','mmv','2 punti per ogni albero'],
 ['acque','Custode delle acque','b;b@1,0','1 punto per ogni disco d’acqua'],
 ['borghi','Custode dei borghi','H','4 punti per ogni casa'],
 ['radure','Custode delle radure','y;v@1,0','3 punti per ogni campo che tocca un albero'],
 ['rocce','Custode delle rocce','gg','2 punti per ogni disco di roccia'],
 ['rive','Custode delle rive','b;y@1,0','2 punti per ogni casella di terra che tocca l’acqua'],
 ['nidi','Custode dei nidi','H;v@1,0','3 punti per ogni carta animale completata'],
 ['torri','Custode delle torri','mv;gg@1,0','3 punti per ogni pila alta 3']];
const RIFUGI=[ /* Rifugi: una pila di 4 che di solito non si può fare; completa = 2 colori */
 ['sorgente','Sorgente','ggbb'],['granaio','Granaio','mmyy'],['abetaia','Bosco pensile','ggvv'],['mulino','Mulino','yyrr'],['isolotto','Isolotto','bbvv'],
 ['capanno','Capanno','mmrr'],['terrazze','Terrazze','ggyy'],['palafitta','Palafitta','bbrr'],['giardino','Giardino','vvyy'],['eremo','Eremo','ggrr']];
const CARDS={};
A_BASE.forEach(([id,nm,p,pts])=>CARDS[id]={id,nm,k:'a',pat:P(p),pts,set:'base'});
A_TRE.forEach(([id,nm,p,pts])=>CARDS[id]={id,nm,k:'a',pat:P(p),pts,set:'tre'});
A_FOL.forEach(([id,nm,p])=>CARDS[id]={id,nm,k:'w',pat:P(p),pts:[2,4],set:'fol'});
SPIRITI.forEach(([id,nm,p,txt])=>CARDS[id]={id,nm,k:'s',pat:P(p),pts:[0],txt,set:'spi'});
RIFUGI.forEach(([id,nm,st])=>CARDS[id]={id,nm,k:'f',st,cols:[...new Set(st)],set:'rif'});
const topC=need=>need==='H'?'r':need[need.length-1];
/* ---------- preparazioni (opzione x) ---------- */
const PRESETS=[['A','Base · lato A (fiume)',{side:'A'}],['B','Base · lato B (isole)',{side:'B'}],['AS','Base con i Custodi · lato A',{side:'A',spi:1}],
 ['T','Tre Toni · lato A',{side:'A',tre:1}],['F1','Fortissimo: Rifugi · lato A',{side:'A',rif:1}],['F2','Fortissimo: Folletti · lato D (aride)',{side:'D',fol:1}],
 ['F3','Fortissimo: Rifugi e Folletti · lato C (cratere)',{side:'C',rif:1,fol:1}],['F4','Tutto insieme: Tre Toni, Fortissimo e Custodi · lato B',{side:'B',rif:1,fol:1,spi:1,tre:1}]];
const presets=()=>PRESETS.map(p=>[p[0],p[1]]);
const cfgOf=x=>(PRESETS.find(p=>p[0]===x)||PRESETS[0])[2];
/* ---------- impilamento ---------- */
function legal(st,c){if(!st)return true;
 if(c==='g')return/^g{1,2}$/.test(st);if(c==='m')return st==='m';if(c==='v')return st==='m'||st==='mm';if(c==='r')return st==='g'||st==='m'||st==='r';return false}
/* la casella k accetta il colore c? (anche grazie a un Rifugio in costruzione); restituisce null o {rif:indice} */
function canPut(s,p,k,c){const b=s.pl[p],cell=b.cells[k];if(!cell||cell.a||cell.w)return null;const st=cell.s;
 if(b.rifOk.some(f=>f.k===k))return null;
 const own=b.rif.findIndex(f=>f.site===k);if(own>=0)return CARDS[b.rif[own].id].st.startsWith(st+c)?{rif:own}:null;
 if(legal(st,c))return{};
 const i=b.rif.findIndex(f=>f.site==null&&CARDS[f.id].st.startsWith(st+c));return i>=0?{rif:i}:null}
const isSite=(b,k)=>b.rif.some(f=>f.site===k)||b.rifOk.some(f=>f.k===k);
/* ---------- schemi e simmetrie (6 rotazioni x specchio) ---------- */
const rot=([q,r])=>[-r,q+r],mir=([q,r])=>[r,q];
const SYM=(()=>{const out=[];for(let m=0;m<2;m++)for(let k=0;k<6;k++)out.push(v=>{let x=m?mir(v):v;for(let i=0;i<k;i++)x=rot(x);return x});return out})();
const fits=(st,need)=>need==='H'?st.length===2&&st[1]==='r':st===need;
/* lo schema della carta id è completo con il cubetto in k? restituisce le caselle dello schema o null */
function matchAt(cells,id,k){const c=CARDS[id],[q0,r0]=QR(k);
 for(const f of SYM){const ks=[];let ok=true;for(const[dq,dr,need]of c.pat){const[x,y]=f([dq,dr]),kk=K(q0+x,r0+y),cell=cells[kk];if(!cell||!fits(cell.s,need)){ok=false;break}ks.push(kk)}if(ok)return ks}
 return null}
function cubeSpots(s,p,id){const b=s.pl[p],c=CARDS[id],out=[];for(const k in b.cells){const cell=b.cells[k];if(c.k==='w'?cell.w:cell.a)continue;if(isSite(b,k))continue;if(matchAt(b.cells,id,k))out.push(k)}return out}
/* ---------- punteggio ---------- */
const nbs=k=>{const[q,r]=QR(k);return DIRS.map(([a,b])=>K(q+a,r+b))};
function groups(cells,pred){const seen=new Set(),out=[];for(const k in cells){if(seen.has(k)||!pred(cells[k].s))continue;const g=[],stk=[k];seen.add(k);
 while(stk.length){const x=stk.pop();g.push(x);for(const y of nbs(x))if(cells[y]&&!seen.has(y)&&pred(cells[y].s)){seen.add(y);stk.push(y)}}out.push(g)}return out}
function diam(g){const set=new Set(g);let best=0;for(const a of g){const d={[a]:1},q=[a];while(q.length){const x=q.shift();for(const y of nbs(x))if(set.has(y)&&!d[y]){d[y]=d[x]+1;q.push(y)}}for(const k in d)best=Math.max(best,d[k])}return best}
const RIVER=[0,0,2,5,8,11,15],river=n=>n<=6?RIVER[n]:15+4*(n-6);
const TREE=[0,1,3,7],MOUNT=[0,1,3,7];
const isTree=st=>st==='v'||st==='mv'||st==='mmv',isMount=st=>/^g{1,3}$/.test(st),isHouse=st=>st.length===2&&st[1]==='r';
function wet(cells,k,side){if(side!=='D'||!ARID.includes(k))return true;return nbs(k).some(y=>cells[y]&&cells[y].s==='b')}
function scoreP(s,p){const b=s.pl[p],C=b.cells,side=s.side,d={tree:0,mount:0,field:0,house:0,water:0,anim:0,fol:0,spi:0,rif:0};
 for(const k in C){const st=C[k].s;if(!st)continue;
  if(isTree(st)&&wet(C,k,side))d.tree+=TREE[st.length];
  if(isMount(st)&&nbs(k).some(y=>C[y]&&isMount(C[y].s)))d.mount+=MOUNT[st.length];
  if(isHouse(st)){const cols=new Set(nbs(k).filter(y=>C[y]&&C[y].s).map(y=>C[y].s[C[y].s.length-1]));d.house+=side==='C'?(cols.size>=4?8:0):(cols.size>=3?5:0)}}
 for(const g of groups(C,st=>st==='y'))if(g.length>=2&&(side!=='D'||g.some(k=>wet(C,k,side))))d.field+=side==='D'?6:5;
 if(side==='B')d.water=5*groups(C,st=>st&&st!=='b').length;
 else{let m=0;for(const g of groups(C,st=>st==='b'))m=Math.max(m,diam(g));d.water=river(m)}
 for(const h of b.hand.concat(b.done)){const c=CARDS[h.id];if(c.k==='a'&&h.n>0)d.anim+=c.pts[h.n-1]}
 for(const k in C)if(C[k].w)d.fol+=C[k].a?5:2;
 for(const f of b.rifOk){const cols=CARDS[f.id].cols;d.rif+=3*nbs(f.k).filter(y=>C[y]&&C[y].s&&cols.includes(C[y].s[C[y].s.length-1])).length}
 if(b.spirit&&b.spirit.n)d.spi=spiritScore(s,p,b.spirit.id);
 d.tot=d.tree+d.mount+d.field+d.house+d.water+d.anim+d.fol+d.spi+d.rif;d.cubes=cubes(b);return d}
function spiritScore(s,p,id){const b=s.pl[p],C=b.cells,ks=Object.keys(C),cnt=f=>ks.filter(k=>C[k].s&&f(C[k].s,k)).length;
 switch(id){
  case'campi':return groups(C,st=>st==='y').reduce((a,g)=>a+(g.length>=3?8:2),0);
  case'monti':return 4*cnt(st=>st==='ggg');
  case'bosco':return 2*cnt(isTree);
  case'acque':return cnt(st=>st==='b');
  case'borghi':return 4*cnt(isHouse);
  case'radure':return 3*cnt((st,k)=>st==='y'&&nbs(k).some(y=>C[y]&&isTree(C[y].s)));
  case'rocce':return 2*ks.reduce((a,k)=>a+(C[k].s.match(/g/g)||[]).length,0);
  case'rive':return 2*cnt((st,k)=>st!=='b'&&nbs(k).some(y=>C[y]&&C[y].s==='b'));
  case'nidi':return 3*b.done.filter(h=>CARDS[h.id].k==='a').length;
  case'torri':return 3*cnt(st=>st.length===3)}
 return 0}
function cubes(b){let n=0;for(const k in b.cells){if(b.cells[k].a)n++}b.rifOk.forEach(f=>n+=f.cubes);return n}
const score=s=>s.pl.map((_,p)=>scoreP(s,p));
const SUNS=[40,60,80,100,120,140];
const suns=v=>SUNS.filter(t=>v>=t).length;
/* ---------- centro, sacchetto ---------- */
const empty=(s,p)=>Object.values(s.pl[p].cells).filter(c=>!c.s).length;
function draw(s){return s.bag.length?s.bag.splice(Math.floor(RND()*s.bag.length),1)[0]:null}
function refillSlot(s,i){if(s.bag.length<3){s.endTrig=true;return false}s.slots[i]=[draw(s),draw(s),draw(s)];return true}
function refillDisp(s){const N=s.n===1?3:5;while(s.disp.length<N&&s.deck.length)s.disp.push(s.deck.pop());
 const R=s.cfg.rif;if(R)while(s.rdisp.length<3&&s.rpile.length)s.rdisp.push(s.rpile.pop())}
const held=b=>b.hand.length+b.rif.length+(b.spirit&&!b.spirit.n?1:0)+(b.offer?1:0);
/* ---------- fine turno ---------- */
function endTurn(s){const p=s.cur,nm=s.names[p];
 if(s.n===1){s.slots.forEach(sl=>{if(sl)s.box.push(...sl)});s.slots=[null,null,null];for(let i=0;i<3;i++)refillSlot(s,i);
}else if(s.took!=null)refillSlot(s,s.took);
 refillDisp(s);
 if(empty(s,p)<=2){if(!s.endTrig)L(s,nm+' ha quasi riempito la plancia: si finisce il giro');s.endTrig=true}
 s.took=null;s.hold=[];s.tookCard=false;s.tookRif=false;s.swapped=false;
 const nx=(p+1)%s.n;
 if(s.endTrig&&nx===0){const det=score(s),sc=det.map(d=>d.tot),mx=Math.max(...sc);let ws=sc.map((v,i)=>v===mx?i:-1).filter(i=>i>=0);
  if(ws.length>1){const mc=Math.max(...ws.map(i=>det[i].cubes));ws=ws.filter(i=>det[i].cubes===mc)}
  s.over={scores:sc,det,win:ws.length===1?ws[0]:null,winners:ws,suns:s.n===1?suns(sc[0]):null};s.phase='summary';E(s,{t:'end'});L(s,'Il paesaggio è completo!');return}
 s.cur=nx;s.turn++;E(s,{t:'turn',p:nx})}
/* ---------- motore ---------- */
const ACCE={id:'accordi',name:'Accordi della Natura',ok:n=>n>=1&&n<=4,COL,CN,NTOK,DIRS,K,QR,CARDS,SIDES,ARID,PRESETS,presets,cfgOf,shape,legal,canPut,matchAt,cubeSpots,score,scoreP,suns,SUNS,fits,topC,nbs,isSite,held,empty,river,
 newGame(n,names,opts){const x=(opts&&opts.x)||'A',cfg=Object.assign({},cfgOf(x));
  const s={g:'accordi',n,names:names.slice(0,n),hands:Array.from({length:n},()=>[]),cur:0,turn:1,phase:'play',log:[],ev:[],evn:0,over:null,
   x,cfg,side:cfg.side,bag:[],box:[],gone:[],slots:[],deck:[],disp:[],rpile:[],rdisp:[],pl:[],took:null,hold:[],tookCard:false,tookRif:false,swapped:false,endTrig:false};
  for(const c in NTOK)for(let i=0;i<NTOK[c];i++)s.bag.push(c);
  const ids=Object.keys(CARDS).filter(id=>{const c=CARDS[id];return c.set==='base'||(c.set==='tre'&&cfg.tre)||(c.set==='fol'&&cfg.fol)});
  s.deck=shuffle(ids);if(cfg.rif)s.rpile=shuffle(Object.keys(CARDS).filter(id=>CARDS[id].k==='f'));
  const spi=cfg.spi?shuffle(Object.keys(CARDS).filter(id=>CARDS[id].k==='s')):[];
  for(let p=0;p<n;p++){const cells={};shape(s.side).forEach(k=>cells[k]={s:'',a:0,w:0});s.pl.push({cells,hand:[],done:[],rif:[],rifOk:[],spirit:null,offer:cfg.spi?[spi.pop(),spi.pop()]:null})}
  const S=n===1?3:5;for(let i=0;i<S;i++)refillSlot(s,i);refillDisp(s);
  L(s,'Plancia lato '+s.side+' ('+SIDES[s.side]+'): prendete tre dischi a turno e fate crescere il paesaggio');return s},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];const p=s.cur,b=s.pl[p],nm=s.names[p];const ok=()=>{s.evn=(s.evn||0)+1;return{s}};
  if(a.t==='spirit'){if(!b.offer)return{err:'Hai già il tuo Custode'};const id=b.offer[a.i|0];if(!id)return{err:'Scegli un Custode'};b.spirit={id,n:0};b.offer=null;
   E(s,{t:'spirit',p});L(s,nm+' sceglie '+CARDS[id].nm);return ok()}
  if(a.t==='take'){if(s.took!=null)return{err:'Hai già preso i dischi di questo turno'};const i=a.i|0;if(!s.slots[i])return{err:'Spazio vuoto'};
   s.hold=s.slots[i];s.slots[i]=null;s.took=i;E(s,{t:'take',p,i,c:s.hold.slice()});L(s,nm+' prende '+s.hold.map(c=>CN[c]).join(', '));return ok()}
  if(a.t==='put'){const j=a.j|0,c=s.hold[j];if(!c)return{err:'Prima prendi tre dischi dal centro'};const k=a.k;const r=canPut(s,p,k,c);if(!r)return{err:'Qui quel disco non si può impilare'};
   const cell=b.cells[k];cell.s+=c;s.hold.splice(j,1);E(s,{t:'put',p,k,c});
   if(r.rif!=null){const f=b.rif[r.rif];f.site=k;if(cell.s===CARDS[f.id].st){b.rif.splice(r.rif,1);b.rifOk.push({id:f.id,k,cubes:0});E(s,{t:'rifok',p,k});L(s,nm+' completa il rifugio '+CARDS[f.id].nm)}}
   return ok()}
  if(a.t==='card'){if(s.tookCard)return{err:'Una sola carta per turno'};if(held(b)>=4)return{err:'Hai già 4 carte da completare'};const id=s.disp[a.i|0];if(!id)return{err:'Scegli una carta'};
   s.disp.splice(a.i|0,1);b.hand.push({id,n:0});s.tookCard=true;E(s,{t:'card',p,id});L(s,nm+' prende '+CARDS[id].nm);return ok()}
  if(a.t==='rif'){if(!s.cfg.rif)return{err:'Rifugi non in gioco'};if(s.tookRif)return{err:'Un solo rifugio per turno'};if(held(b)>=4)return{err:'Hai già 4 carte da completare'};
   const id=s.rdisp[a.i|0];if(!id)return{err:'Scegli un rifugio'};s.rdisp.splice(a.i|0,1);b.rif.push({id,site:null});s.tookRif=true;E(s,{t:'rifc',p,id});L(s,nm+' progetta '+CARDS[id].nm);return ok()}
  if(a.t==='cube'){const h=a.c==='spirit'?b.spirit:b.hand[a.c|0];if(!h||(a.c==='spirit'&&h.n))return{err:'Scegli una carta'};const c=CARDS[h.id],tot=c.k==='s'?1:c.k==='w'?2:c.pts.length;
   const k=a.k,cell=b.cells[k];if(!cell)return{err:'Casella fuori plancia'};if(isSite(b,k))return{err:'Sui rifugi vanno solo gli ultimi cubetti delle carte'};
   if(c.k==='w'?cell.w:cell.a)return{err:'C’è già un cubetto'};if(!matchAt(b.cells,h.id,k))return{err:'Lo schema di '+c.nm+' non è completo qui'};
   if(c.k==='w')cell.w=1;else cell.a=c.k;h.n++;E(s,{t:'cube',p,k,id:h.id,w:c.k==='w'});
   if(h.n>=tot&&c.k!=='s'){b.hand.splice(a.c|0,1);b.done.push(h);E(s,{t:'done',p,id:h.id});L(s,nm+' completa '+c.nm)}else L(s,nm+(c.k==='w'?' accoglie un folletto: ':c.k==='s'?' risveglia il ':' porta ')+c.nm.toLowerCase());
   return ok()}
  if(a.t==='cuberif'){const h=b.hand[a.c|0];if(!h)return{err:'Scegli una carta'};const c=CARDS[h.id];if(c.k!=='a')return{err:'Solo i cubetti degli animali'};
   if(c.pts.length-h.n!==1)return{err:'Sul rifugio va solo l’ultimo cubetto di una carta'};const f=b.rifOk[a.f|0];if(!f)return{err:'Scegli un rifugio completo'};
   if(!CARDS[f.id].cols.includes(topC(c.pat[0][2])))return{err:'Il colore non è quello del rifugio'};
   f.cubes++;h.n++;b.hand.splice(a.c|0,1);b.done.push(h);E(s,{t:'cube',p,k:f.k,id:h.id,rif:1});E(s,{t:'done',p,id:h.id});L(s,nm+' porta '+c.nm.toLowerCase()+' al rifugio e completa la carta');return ok()}
  if(a.t==='swap'){if(s.n!==1)return{err:'Solo in solitario'};if(s.tookCard||s.swapped)return{err:'Non ora'};const i=a.i|0;if(!s.disp[i])return{err:'Scegli una carta'};
   s.gone.push(s.disp[i]);s.disp.splice(i,1);s.swapped=true;refillDisp(s);E(s,{t:'swap',p});L(s,nm+' scarta un animale');return ok()}
  if(a.t==='end'){if(s.took==null)return{err:'Prima prendi tre dischi dal centro'};if(b.offer)return{err:'Scegli prima il tuo Custode'};
   const stuck=s.hold.every(c=>!Object.keys(b.cells).some(k=>canPut(s,p,k,c)));if(s.hold.length&&!stuck)return{err:'Metti tutti e tre i dischi'};
   if(s.hold.length){s.box.push(...s.hold);L(s,'Nessun posto per '+s.hold.length+(s.hold.length>1?' dischi':' disco')+': tornano nella scatola');s.hold=[]}
   endTurn(s);return ok()}
  return{err:'Azione sconosciuta'}},
 setRnd:f=>{RND=f}};
return ACCE})();
if(typeof module!=='undefined')module.exports=ACC;
