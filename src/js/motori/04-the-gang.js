const GANG=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));const RK=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const P=c=>({r:c.slice(0,-1),s:c.slice(-1)==='X'?'':c.slice(-1),v:RK.indexOf(c.slice(0,-1))+2});
const SYM={H:'♥',D:'♦',C:'♣',S:'♠',X:''};const fmt=c=>{const p=P(c);return p.r+(SYM[c.slice(-1)]||'')};
const COL=['bianco','giallo','arancio','rosso'],RND_N=['Pre-Flop','Flop','Turn','River'];
const CAT=['Carta alta','Coppia','Doppia coppia','Tris','Scala','Colore','Full','Poker','Scala colore','Scala reale'];
const CHAL=[null,{n:'Accesso rapido',d:'Niente gettoni bianchi: si parte dal Flop.'},{n:'Sensori di rumore',d:'I gettoni da 1 stella (rounds 1-3) sono bloccati: una volta presi non cambiano più proprietario.'},
 {n:'Rilevatore di movimento',d:'Se al Flop esce una figura (J, Q, K), chi ha il gettone bianco da 1 stella cambia le sue carte.'},
 {n:'Scansione retina',d:'Prima dello showdown, la squadra indica un valore che chi ha il rosso più alto possiede: se sbagliate, il colpo fallisce.'},
 {n:'Fuga precipitosa',d:'Niente gettoni arancio: dopo il Flop escono Turn e River insieme.'},{n:'Condotto di ventilazione',d:'I gettoni con più stelle (rounds 1-3) sono bloccati una volta presi.'},
 {n:'Laser',d:'Se al Flop non esce nessuna figura, chi ha il gettone bianco più alto cambia le sue carte.'},{n:'Blackout',d:'A ogni nuovo round i gettoni del round precedente spariscono.'},
 {n:'Impronte digitali',d:'Prima dello showdown, la squadra indica la combinazione di chi ha il rosso più alto: se sbagliate, il colpo fallisce.'},{n:'Telecamere',d:'Ognuno riceve 3 carte coperte.'}];
const SPEC=[null,{n:'Informatore',d:'Un giocatore mostra in segreto una sua carta a un altro.',use:1},{n:'Autista',d:'Un giocatore annuncia la combinazione che ha ora.',use:1},
 {n:'Investitore',d:'Tutti annunciano quante figure (J, Q, K) hanno in mano.'},{n:'Mente',d:'Un giocatore dice quante carte di un valore scelto possiede.',use:1},
 {n:'Hacker',d:'Un giocatore pesca una carta e poi ne scarta una.',use:1},{n:'Coordinatore',d:'Ognuno sceglie una carta e la passa a sinistra.',use:1},
 {n:'Jack',d:'Un giocatore sostituisce una carta con il Fante speciale (vale J, senza seme).',use:1},{n:'Matematico',d:'Tutti annunciano la somma delle proprie carte (figure 10, Asso 11).'},
 {n:'Truffatore',d:'Le carte coperte di tutti vengono raccolte, mescolate e ridistribuite.',use:1},{n:'Muscoli',d:'Un giocatore riceve i Muscoli: allo showdown batte chi ha la sua stessa combinazione.',use:1}];
/* valutazione */
function score5(cs){const ps=cs.map(P),vs=ps.map(p=>p.v).sort((a,b)=>b-a),cnt={};vs.forEach(v=>cnt[v]=(cnt[v]||0)+1);
 const groups=Object.entries(cnt).map(([v,c])=>[c,+v]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
 const flush=ps.every(p=>p.s&&p.s===ps[0].s);const uniq=[...new Set(vs)];let st=0;
 if(uniq.length===5){if(uniq[0]-uniq[4]===4)st=uniq[0];else if(uniq.join()==='14,5,4,3,2')st=5}
 if(st&&flush)return[st===14?9:8,st];if(groups[0][0]===4)return[7,groups[0][1],groups[1][1]];if(groups[0][0]===3&&groups[1][0]===2)return[6,groups[0][1],groups[1][1]];
 if(flush)return[5,...vs];if(st)return[4,st];if(groups[0][0]===3)return[3,groups[0][1],...groups.slice(1).map(g=>g[1])];
 if(groups[0][0]===2&&groups[1][0]===2)return[2,groups[0][1],groups[1][1],groups[2][1]];if(groups[0][0]===2)return[1,groups[0][1],...groups.slice(1).map(g=>g[1])];return[0,...vs]}
const cmpA=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0};
function best(cards){if(cards.length<5){const v=cards.map(c=>P(c).v).sort((a,b)=>b-a);const cnt={};v.forEach(x=>cnt[x]=(cnt[x]||0)+1);const g=Object.entries(cnt).map(([x,c])=>[c,+x]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
  if(g[0]&&g[0][0]===4)return[7,g[0][1]];if(g[0]&&g[0][0]===3)return[3,g[0][1],...g.slice(1).map(x=>x[1])];if(g[0]&&g[0][0]===2&&g[1]&&g[1][0]===2)return[2,g[0][1],g[1][1]];if(g[0]&&g[0][0]===2)return[1,g[0][1],...g.slice(1).map(x=>x[1])];return[0,...v]}
 let b=null;const n=cards.length;for(let a=0;a<n;a++)for(let c=a+1;c<n;c++)for(let d=c+1;d<n;d++)for(let e=d+1;e<n;e++)for(let f=e+1;f<n;f++){const s=score5([cards[a],cards[c],cards[d],cards[e],cards[f]]);if(!b||cmpA(s,b)>0)b=s}return b}
const handOf=(s,p)=>best([...s.hands[p],...s.board]);
const E=(s,o)=>s.ev.push(o);const L=(s,t)=>{s.log.push(t);if(s.log.length>80)s.log.shift()};
const nm=(s,p)=>s.names[p];
const chal=(s,id)=>s.chal.includes(id);
function deck(){const d=[];for(const s of 'HDCS')for(const r of RK)d.push(r+s);return d}
function newHeist(s){s.heist++;s.dealer=(s.dealer+1)%s.n;s.deck=shuffle(deck());s.board=[];const k=chal(s,10)?3:2;
 s.hands=Array.from({length:s.n},()=>[]);for(let i=0;i<k;i++)for(let p=0;p<s.n;p++)s.hands[p].push(s.deck.pop());
 s.chips=[0,1,2,3].map(()=>Array(s.n).fill(-1));s.hidden=[false,false,false,false];s.info=[];s.priv=Array.from({length:s.n},()=>[]);s.used=false;s.muscle=-1;s.res=null;s.guess=null;s.hack=null;s.coord=null;
 s.round=0;s.passes=0;s.cur=(s.dealer+1)%s.n;s.phase='chips';
 L(s,'Colpo '+s.heist+': carte distribuite');E(s,{t:'deal'});
 if(s.spec===3)s.info.push('Investitore: '+s.names.map((x,p)=>x+' '+s.hands[p].filter(c=>'JQK'.includes(P(c).r)).length).join(', ')+' figure');
 if(s.spec===8)s.info.push('Matematico: '+s.names.map((x,p)=>x+' '+s.hands[p].reduce((t,c)=>{const v=P(c).v;return t+(v===14?11:v>10?10:v)},0)).join(', '));
 if(chal(s,1)){s.round=1;reveal(s,3);flopChecks(s)}else s.round=0}
function reveal(s,k){for(let i=0;i<k;i++)s.board.push(s.deck.pop());E(s,{t:'reveal',k});L(s,'Sul tavolo: '+s.board.map(fmt).join(' '))}
function redraw(s,p,why){const k=s.hands[p].length;s.hands[p]=[];for(let i=0;i<k;i++)s.hands[p].push(s.deck.pop());E(s,{t:'redraw',p});s.info.push(why+': '+nm(s,p)+' ha cambiato le carte');L(s,why+': '+nm(s,p)+' cambia le carte')}
function flopChecks(s){const face=s.board.slice(0,3).some(c=>'JQK'.includes(P(c).r));const w=s.chips[0];
 if(chal(s,3)&&face&&w[0]>=0)redraw(s,w[0],'Rilevatore di movimento');
 if(chal(s,7)&&!face){const top=w[s.n-1];if(top>=0)redraw(s,top,'Laser')}}
const locked=(s,r,star)=>r<3&&((chal(s,2)&&star===1)||(chal(s,6)&&star===s.n));
function endRound(s){s.passes=0;const r=s.round;E(s,{t:'roundEnd',r});
 if(r===3){if(chal(s,4)||chal(s,9)){s.phase='guess';const top=s.chips[3][s.n-1];s.guess={top,kind:chal(s,4)?'retina':'finger',done:{}};s.cur=(top+1)%s.n;if(chal(s,4)&&chal(s,9))s.guess.kind='both';return}return showdown(s)}
 if(chal(s,8))s.hidden[r]=true;
 if(r===0){s.round=1;reveal(s,3);flopChecks(s)}
 else if(r===1){if(chal(s,5)){reveal(s,2);s.round=3}else{reveal(s,1);s.round=2}}
 else if(r===2){reveal(s,1);s.round=3}
 s.cur=(s.dealer+1)%s.n;L(s,'Round '+RND_N[s.round]+': gettoni '+COL[s.round])}
function showdown(s){const order=[...Array(s.n).keys()].sort((a,b)=>s.chips[3].indexOf(a)-s.chips[3].indexOf(b));
 const sc=order.map(p=>handOf(s,p));let ok=true,bad=-1;
 const cmp=(i,j)=>{const a=sc[i],b=sc[j];if(a[0]===b[0]&&(order[i]===s.muscle||order[j]===s.muscle)&&order[i]!==order[j])return order[i]===s.muscle?1:-1;return cmpA(a,b)};
 for(let i=1;i<order.length;i++)if(cmp(i,i-1)<0){ok=false;bad=i;break}
 let why=ok?'':'La mano di '+nm(s,order[bad])+' è più debole di una mostrata prima';
 if(ok&&s.guess&&s.guess.fail){ok=false;why=s.guess.fail}
 s.res={order,hands:order.map(p=>s.hands[p].slice()),cats:sc.map(x=>x[0]),ok,why,bad};
 if(ok){s.vaults++;L(s,'Colpo riuscito! Caveau aperto ('+s.vaults+'/3)')}else{s.alarms++;L(s,'Allarme! '+why+' ('+s.alarms+'/'+s.maxAlarm+')')}
 E(s,{t:'showdown',ok});
 if(s.vaults>=3){s.over={win:true,scores:[s.vaults],vaults:s.vaults,alarms:s.alarms};E(s,{t:'win'});s.phase='summary';return}
 if(s.alarms>=s.maxAlarm){s.over={win:false,scores:[s.vaults],vaults:s.vaults,alarms:s.alarms};E(s,{t:'lose'});s.phase='summary';return}
 /* carte per il prossimo colpo */
 s.next={chal:null,spec:null};
 if(s.mode==='avanzata'||s.mode==='pro'){if(ok)s.next.chal=drawC(s,'c');else s.next.spec=drawC(s,'s')}
 if(s.mode==='maestro'){s.next.chal=drawC(s,'c')}
 s.phase='summary';s.cur=(s.dealer+1)%s.n}
function drawC(s,k){const d=k==='c'?s.cdeck:s.sdeck;let c=d.shift();d.push(c);for(let g=0;g<d.length&&k==='c'&&s.chal.includes(c);g++){c=d.shift();d.push(c)}if(k==='c'){s.cdrawn++;if(s.cdrawn===d.length)shuffle(d)}else{s.sdrawn++;if(s.sdrawn===d.length)shuffle(d)}return c}
function startNext(s){s.chal=s.perm.slice();s.spec=null;const nx=s.next||{};
 if(s.mode==='maestro'){s.mchal=s.mchal.slice().sort((a,b)=>a-b);s.mchal.shift();if(nx.chal)s.mchal.push(nx.chal);s.chal=s.mchal.slice()}
 else{if(nx.chal&&!s.chal.includes(nx.chal))s.chal.push(nx.chal);if(nx.spec)s.spec=nx.spec}
 s.next=null;newHeist(s)}
const GANG={id:'gang',name:'La Banda',ok:n=>n>=3&&n<=6,P,fmt,best,handOf,CAT,CHAL,SPEC,COL,RND_N,locked,
 newGame(n,names,opts={}){const mode=opts.mode||'base';const s={g:'gang',n,names:names.slice(0,n),mode,heist:0,dealer:n-1,vaults:0,alarms:0,maxAlarm:mode==='maestro'?2:3,
  cdeck:[1,2,3,4,5,6,7,8,9,10],sdeck:[1,2,3,4,5,6,7,8,9,10],cdrawn:0,sdrawn:0,perm:[],chal:[],spec:null,mchal:[],log:[],ev:[],evn:0,over:null,teams:1};
  if(mode==='pro'||mode==='maestro'){s.cdeck=s.cdeck.filter(x=>x!==1)}
  if(mode==='pro'){const c=s.cdeck.splice(Math.floor(RND()*s.cdeck.length),1)[0];s.perm=[c]}
  if(mode==='maestro'){shuffle(s.cdeck);s.mchal=[s.cdeck.shift(),s.cdeck.shift()];s.cdeck.push(...s.mchal);s.chal=s.mchal.slice()}
  s.chal=mode==='maestro'?s.mchal.slice():s.perm.slice();newHeist(s);return s},
 act(st,a){if(st.over&&a.t!=='noop')return{err:'Partita finita'};const s=clone(st);s.ev=[];const p=s.cur,r=s.round;
  const done=()=>{s.evn=(s.evn||0)+1;return{s}},nextP=()=>{s.cur=(s.cur+1)%s.n};
  if(a.t==='next'){if(s.phase!=='summary'||s.over)return{err:'Non ora'};startNext(s);return done()}
  if(s.phase==='hack'){if(a.t!=='hackdisc')return{err:'Scegli la carta da scartare'};const h=s.hands[p];if(!h.includes(a.c))return{err:'Carta non valida'};h.splice(h.indexOf(a.c),1);s.phase='chips';E(s,{t:'spec',id:5,p});L(s,nm(s,p)+' (Hacker) scarta una carta');return done()}
  if(s.phase==='coord'){if(a.t!=='coordpick')return{err:'Scegli la carta da passare'};if(!s.hands[p].includes(a.c))return{err:'Carta non valida'};s.coord.pick[p]=a.c;
   const left=[...Array(s.n).keys()].filter(i=>s.coord.pick[i]==null);if(left.length){s.cur=left.find(i=>i>p)??left[0];return done()}
   s.coord.pick.forEach((c,i)=>{const h=s.hands[i];h.splice(h.indexOf(c),1)});s.coord.pick.forEach((c,i)=>s.hands[(i+1)%s.n].push(c));s.cur=s.coord.back;s.phase='chips';s.coord=null;E(s,{t:'spec',id:6});L(s,'Coordinatore: ognuno passa una carta a sinistra');return done()}
  if(s.phase==='guess'){if(a.t!=='guess')return{err:'Indicate la risposta'};const top=s.guess.top,h=s.hands[top];let wrong=null;
   if(a.kind==='retina'){const has=h.some(c=>P(c).r===a.v)||(a.v==='J'&&h.includes('JX'));if(!has)wrong='Scansione retina sbagliata: '+nm(s,top)+' non ha '+a.v;s.guess.done.retina=a.v}
   else if(a.kind==='finger'){const cat=handOf(s,top)[0];if(+a.v!==cat&&!(cat===9&&+a.v===8))wrong='Impronte sbagliate: '+nm(s,top)+' ha '+CAT[cat];s.guess.done.finger=a.v}
   else return{err:'Risposta non valida'};
   if(wrong&&!s.guess.fail)s.guess.fail=wrong;
   const need=s.guess.kind==='both'?['retina','finger']:[s.guess.kind];if(need.every(k=>s.guess.done[k]!=null))showdown(s);return done()}
  if(s.phase!=='chips')return{err:'Non ora'};
  if(a.t==='take'){const star=a.star|0;if(star<1||star>s.n)return{err:'Gettone non valido'};const row=s.chips[r],own=row[star-1];
   if(own===p)return{err:'Quel gettone è già tuo'};if(own>=0&&locked(s,r,star))return{err:'Quel gettone è bloccato: non cambia più proprietario'};
   const mine=row.indexOf(p);if(mine>=0&&locked(s,r,mine+1))return{err:'Il tuo gettone è bloccato: non puoi cambiarlo'};
   if(mine>=0)row[mine]=-1;row[star-1]=p;s.passes=0;E(s,{t:'take',p,star,from:own,r});L(s,nm(s,p)+(own>=0?' ruba a '+nm(s,own):' prende')+' il gettone '+COL[r]+' da '+star+'★');nextP();return done()}
  if(a.t==='pass'){if(s.chips[r].indexOf(p)<0)return{err:'Prima prendi un gettone'};s.passes++;E(s,{t:'pass',p});nextP();
   if(s.passes>=s.n&&s.chips[r].every(x=>x>=0))endRound(s);return done()}
  if(a.t==='spec'){const id=s.spec;if(!id||s.used||!SPEC[id].use)return{err:'Nessuno specialista da usare'};
   if(id===1){if(!(a.to>=0&&a.to<s.n&&a.to!==p)||!s.hands[p].includes(a.c))return{err:'Scegli carta e destinatario'};s.priv[a.to].push(nm(s,p)+' ti mostra: '+fmt(a.c));s.info.push('Informatore: '+nm(s,p)+' ha mostrato una carta a '+nm(s,a.to))}
   else if(id===2){s.info.push('Autista: '+nm(s,p)+' ha '+CAT[handOf(s,p)[0]])}
   else if(id===4){if(!RK.includes(a.v))return{err:'Scegli un valore'};const k=s.hands[p].filter(c=>P(c).r===a.v).length+(a.v==='J'?s.hands[p].filter(c=>c==='JX').length:0);s.info.push('Mente: '+nm(s,p)+' ha '+k+' carte di valore '+a.v)}
   else if(id===5){s.hands[p].push(s.deck.pop());s.phase='hack';s.info.push('Hacker: '+nm(s,p)+' pesca e scarta una carta')}
   else if(id===6){s.phase='coord';s.coord={pick:Array(s.n).fill(null),back:p};s.cur=p}
   else if(id===7){const h=s.hands[p];if(!h.includes(a.c))return{err:'Scegli la carta da sostituire'};h[h.indexOf(a.c)]='JX';s.info.push('Jack: '+nm(s,p)+' ha preso il Fante speciale')}
   else if(id===9){const all=shuffle(s.hands.flat());const k=s.hands[0].length;s.hands=s.hands.map(()=>all.splice(0,k));s.info.push('Truffatore: le carte coperte sono state rimescolate e ridistribuite')}
   else if(id===10){if(!(a.to>=0&&a.to<s.n))return{err:'Scegli chi riceve i Muscoli'};s.muscle=a.to;s.info.push('Muscoli: li ha '+nm(s,a.to))}
   s.used=true;E(s,{t:'spec',id,p});L(s,'Specialista '+SPEC[id].n+' usato');return done()}
  return{err:'Azione sconosciuta'}},
 setRnd:f=>{RND=f}};
return GANG})();


/* SABOTEUR (+ Saboteur 2). Lati: N=1 E=2 S=4 W=8. Una carta percorso = gruppi di lati collegati (segs).
   Vicoli ciechi = ogni lato è un gruppo a sé. Rotazione ammessa solo di 180°. */
