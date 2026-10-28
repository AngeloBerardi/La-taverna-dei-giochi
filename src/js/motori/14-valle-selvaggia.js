/* VALLE SELVAGGIA (1-4) – costruzione di un ecosistema con tessere esagonali (meccaniche ispirate a Cascadia, nomi e testi originali).
   Habitat: M montagna, F foresta, P prateria, W palude, R fiume. Animali: o orso, a alce, s salmone, f falco, v volpe.
   Coordinate assiali 'q,r'. Lati 0..5: E, NE, NO, O, SO, SE (opposto = +3). Tessera doppia: lati r..r+2 habitat h[0], gli altri h[1]. */
const VALLE=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));
const HAB='MFPWR',ANI='oasfv',DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const HN={M:'Montagna',F:'Foresta',P:'Prateria',W:'Palude',R:'Fiume'},AN={o:'Orso',a:'Alce',s:'Salmone',f:'Falco',v:'Volpe'},ANP={o:'orsi',a:'alci',s:'salmoni',f:'falchi',v:'volpi'};
const K=(q,r)=>q+','+r,QR=k=>k.split(',').map(Number);
const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};const E=(s,o)=>s.ev.push(o);
/* --- tessere: 25 chiave di volta (1 habitat, 1 animale, danno una pigna) + 80 doppie (2 habitat, 2-3 animali) --- */
function allTiles(){const t=[];let id=0;
 for(let i=0;i<5;i++)for(let j=0;j<5;j++)t.push({id:id++,h:[HAB[i]],a:ANI[(i+j)%5],k:1});
 const two=[],three=[];for(let a=0;a<5;a++)for(let b=a+1;b<5;b++){two.push(ANI[a]+ANI[b]);for(let c=b+1;c<5;c++)three.push(ANI[a]+ANI[b]+ANI[c])}
 let pi=0;for(let a=0;a<5;a++)for(let b=a+1;b<5;b++){for(let k=0;k<8;k++){const x=pi*8+k;t.push({id:id++,h:[HAB[a],HAB[b]],a:k<5?two[(x*3)%10]:three[(x*7)%10],k:0})}pi++}
 return t}
const edgeH=(c,i)=>c.t.h.length===1?c.t.h[0]:(((i-c.rot)%6+6)%6<3?c.t.h[0]:c.t.h[1]);
const nb=(q,r,i)=>K(q+DIRS[i][0],r+DIRS[i][1]);
/* --- punteggi (carte originali) --- */
const T_BEAR=[0,4,11,19,27],T_ELK=[0,2,5,9,13],T_SALM=[0,2,4,7,11,15,20,26],T_HAWK=[0,2,5,8,11,14,18,22,26];
const tab=(t,n)=>t[Math.min(n,t.length-1)];
function groups(B,an){const seen=new Set(),out=[];for(const k in B){if(B[k].tok!==an||seen.has(k))continue;const g=[],st=[k];seen.add(k);
 while(st.length){const x=st.pop();g.push(x);const[q,r]=QR(x);for(let i=0;i<6;i++){const y=nb(q,r,i);if(B[y]&&B[y].tok===an&&!seen.has(y)){seen.add(y);st.push(y)}}}out.push(g)}return out}
function nCount(B,k,an){const[q,r]=QR(k);let n=0;for(let i=0;i<6;i++){const c=B[nb(q,r,i)];if(c&&c.tok===an)n++}return n}
function scoreBear(B){const pairs=groups(B,'o').filter(g=>g.length===2).length;return tab(T_BEAR,pairs)}
function scoreElk(B){const used=new Set();let tot=0;
 for(;;){let best=null;for(const k in B){if(B[k].tok!=='a'||used.has(k))continue;const[q,r]=QR(k);
   for(const d of[0,1,5]){const line=[k];let x=q,y=r;for(;;){x+=DIRS[d][0];y+=DIRS[d][1];const kk=K(x,y);if(B[kk]&&B[kk].tok==='a'&&!used.has(kk))line.push(kk);else break}
    if(!best||line.length>best.length)best=line}}
  if(!best)break;best.slice(0,4).forEach(k=>used.add(k));tot+=tab(T_ELK,Math.min(4,best.length))}return tot}
function scoreSalmon(B){let t=0;for(const g of groups(B,'s')){if(g.some(k=>nCount(B,k,'s')>2))continue;t+=tab(T_SALM,g.length)}return t}
function scoreHawk(B){let n=0;for(const k in B)if(B[k].tok==='f'&&!nCount(B,k,'f'))n++;return tab(T_HAWK,n)}
function scoreFox(B){let t=0;for(const k in B){if(B[k].tok!=='v')continue;const[q,r]=QR(k),seen=new Set();for(let i=0;i<6;i++){const c=B[nb(q,r,i)];if(c&&c.tok)seen.add(c.tok)}t+=seen.size}return t}
function corridor(B,h){const seen=new Set();let best=0;
 for(const k in B){if(seen.has(k)||!B[k].t.h.includes(h))continue;let n=0;const st=[k];seen.add(k);
  while(st.length){const x=st.pop();n++;const[q,r]=QR(x);for(let i=0;i<6;i++){const y=nb(q,r,i),c=B[y];if(!c||seen.has(y))continue;if(edgeH(B[x],i)===h&&edgeH(c,(i+3)%6)===h){seen.add(y);st.push(y)}}}
  best=Math.max(best,n)}return best}
function score(s){const n=s.n,det=s.boards.map(b=>{const B=b.cells;const an={o:scoreBear(B),a:scoreElk(B),s:scoreSalmon(B),f:scoreHawk(B),v:scoreFox(B)};const cor={};for(const h of HAB)cor[h]=corridor(B,h);return{an,cor,bon:{},nat:b.nature}});
 for(const h of HAB){const v=det.map(d=>d.cor[h]);
  if(n===1){if(v[0]>=7)det[0].bon[h]=2;continue}
  const mx=Math.max(...v),top=v.map((x,i)=>x===mx?i:-1).filter(i=>i>=0);if(!mx)continue;
  if(n===2){top.forEach(i=>det[i].bon[h]=top.length>1?1:2);continue}
  if(top.length>1){top.forEach(i=>det[i].bon[h]=2);continue}det[top[0]].bon[h]=3;
  const rest=v.map((x,i)=>i===top[0]?-1:x),m2=Math.max(...rest);if(m2>0)rest.forEach((x,i)=>{if(x===m2)det[i].bon[h]=1})}
 det.forEach(d=>{d.anTot=Object.values(d.an).reduce((a,b)=>a+b,0);d.corTot=Object.values(d.cor).reduce((a,b)=>a+b,0)+Object.values(d.bon).reduce((a,b)=>a+b,0);d.tot=d.anTot+d.corTot+d.nat});return det}
/* --- espositore: 4 coppie tessera + animale --- */
function drawTok(s){if(!s.bag.length)return null;return s.bag.splice(Math.floor(RND()*s.bag.length),1)[0]}
function refill(s){for(let i=0;i<4;i++){if(!s.disp[i].t&&s.pile.length)s.disp[i].t=s.pile.pop();if(!s.disp[i].k)s.disp[i].k=drawTok(s)}}
function overpop(s){for(let g=0;g<20;g++){const ks=s.disp.map(d=>d.k);const c=ks.find(x=>x&&ks.filter(y=>y===x).length===4);if(!c)return;s.disp.forEach(d=>{s.bag.push(d.k);d.k=null});refill(s);E(s,{t:'wipe',auto:1});L(s,'Sovrappopolazione: 4 '+ANP[c]+' uguali, gli animali vengono rimescolati')}}
const three=s=>{const ks=s.disp.map(d=>d.k);return ks.find(x=>x&&ks.filter(y=>y===x).length===3)||null};
/* --- posizionamento --- */
function spots(s,p){const B=s.boards[p].cells,out=new Set();for(const k in B){const[q,r]=QR(k);for(let i=0;i<6;i++){const y=nb(q,r,i);if(!B[y])out.add(y)}}return[...out].map(QR)}
function tokSpots(s,p,an){const B=s.boards[p].cells,out=[];for(const k in B)if(!B[k].tok&&B[k].t.a.includes(an))out.push(QR(k));return out}
function endTurn(s){const p=s.cur;s.left[p]--;s.phase='pick';s.held=null;s.used3=false;refill(s);
 if(s.left.every(x=>x<=0)){const det=score(s);const sc=det.map(d=>d.tot),mx=Math.max(...sc);let ws=sc.map((v,i)=>v===mx?i:-1).filter(i=>i>=0);
  if(ws.length>1){const mn=Math.max(...ws.map(i=>det[i].nat));ws=ws.filter(i=>det[i].nat===mn)}
  s.over={scores:sc,det,win:ws.length===1?ws[0]:null,winners:ws};s.phase='summary';E(s,{t:'end'});L(s,'La valle è completa!');return}
 s.cur=(p+1)%s.n;s.turn++;overpop(s);E(s,{t:'turn',p:s.cur})}
const VALLE={id:'valle',name:'Terre di Cascata',ok:n=>n>=1&&n<=4,HAB,ANI,HN,AN,ANP,DIRS,K,QR,edgeH,nb,score,spots,tokSpots,three,corridor,T_BEAR,T_ELK,T_SALM,T_HAWK,
 newGame(n,names){const tiles=shuffle(allTiles());const s={g:'valle',n,names:names.slice(0,n),hands:Array.from({length:n},()=>[]),cur:0,turn:1,phase:'pick',log:[],ev:[],evn:0,over:null,teams:n,
   boards:[],pile:[],bag:[],disp:[],left:Array(n).fill(20),held:null,used3:false};
  for(let p=0;p<n;p++){const B={};[[0,0],[1,0],[0,1]].forEach(([q,r],i)=>{B[K(q,r)]={t:tiles.pop(),rot:(i*2)%6,tok:null}});s.boards.push({cells:B,nature:0})}
  s.pile=tiles.slice(0,n===1?43:n*20+3);for(const a of ANI)for(let i=0;i<20;i++)s.bag.push(a);
  s.disp=[0,1,2,3].map(()=>({t:null,k:null}));refill(s);overpop(s);L(s,'Ognuno ha 20 turni per far crescere la propria valle');return s},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];const p=s.cur,b=s.boards[p],nm=s.names[p];const ok=()=>{s.evn=(s.evn||0)+1;return{s}};
  if(a.t==='wipe3'){if(s.phase!=='pick')return{err:'Non ora'};if(s.used3)return{err:'Puoi farlo una sola volta per turno'};const c=three(s);if(!c)return{err:'Non ci sono 3 animali uguali'};
   s.disp.forEach(d=>{if(d.k===c){s.bag.push(d.k);d.k=null}});refill(s);s.used3=true;overpop(s);E(s,{t:'wipe'});L(s,nm+' rimescola i 3 '+ANP[c]);return ok()}
  if(a.t==='wipe'){if(s.phase!=='pick')return{err:'Non ora'};if(b.nature<1)return{err:'Ti serve una pigna'};const idx=[...new Set(a.idx||[])].filter(i=>i>=0&&i<4&&s.disp[i].k);if(!idx.length)return{err:'Scegli gli animali da cambiare'};
   b.nature--;idx.forEach(i=>{s.bag.push(s.disp[i].k);s.disp[i].k=null});refill(s);overpop(s);E(s,{t:'wipe',p});L(s,nm+' spende una pigna e cambia '+idx.length+(idx.length>1?' animali':' animale'));return ok()}
  if(a.t==='place'){if(s.phase!=='pick')return{err:'Prima metti o scarta l’animale'};const ti=a.tile,ki=a.tok==null?ti:a.tok;
   if(!(ti>=0&&ti<4)||!s.disp[ti].t)return{err:'Scegli una tessera'};if(!(ki>=0&&ki<4)||!s.disp[ki].k)return{err:'Scegli un animale'};
   if(ki!==ti&&b.nature<1)return{err:'Per separare tessera e animale serve una pigna'};
   const k=K(a.q,a.r);if(b.cells[k])return{err:'Casella occupata'};if(!spots(s,p).some(([q,r])=>q===a.q&&r===a.r))return{err:'La tessera deve toccare la tua valle'};
   if(ki!==ti){b.nature--;L(s,nm+' spende una pigna per scegliere liberamente')}
   const tile=s.disp[ti].t;b.cells[k]={t:tile,rot:((a.rot|0)%6+6)%6,tok:null};s.held=s.disp[ki].k;s.disp[ti].t=null;s.disp[ki].k=null;s.phase='token';
   E(s,{t:'place',p,q:a.q,r:a.r});L(s,nm+' aggiunge '+(tile.h.length===1?HN[tile.h[0]]:HN[tile.h[0]]+'/'+HN[tile.h[1]]));
   if(!tokSpots(s,p,s.held).length){s.bag.push(s.held);L(s,'Nessun posto per '+AN[s.held].toLowerCase()+': torna nel sacchetto');E(s,{t:'skip',p});endTurn(s)}return ok()}
  if(a.t==='token'){if(s.phase!=='token')return{err:'Prima scegli una tessera'};const c=b.cells[K(a.q,a.r)];if(!c)return{err:'Scegli una tua tessera'};if(c.tok)return{err:'C’è già un animale'};if(!c.t.a.includes(s.held))return{err:'Questo habitat non ospita '+AN[s.held].toLowerCase()};
   c.tok=s.held;let pine=false;if(c.t.k){b.nature++;pine=true}E(s,{t:'token',p,q:a.q,r:a.r,an:s.held,pine});L(s,nm+' porta '+(s.held==='o'?'un orso':s.held==='a'?'un alce':s.held==='s'?'un salmone':s.held==='f'?'un falco':'una volpe')+(pine?' e guadagna una pigna':''));endTurn(s);return ok()}
  if(a.t==='skip'){if(s.phase!=='token')return{err:'Non ora'};s.bag.push(s.held);E(s,{t:'skip',p});L(s,nm+' lascia andare l’animale');endTurn(s);return ok()}
  return{err:'Azione sconosciuta'}},
 setRnd:f=>{RND=f}};
return VALLE})();
if(typeof module!=='undefined')module.exports=VALLE;
