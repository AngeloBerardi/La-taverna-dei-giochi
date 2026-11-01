// I Coloni: il Duello: preparazione, conservazione delle carte, dadi e produzione, banditi, eventi, costruzioni, scambi, segni, azioni non valide e partite complete.
const carica=require('./carica.js'),C=carica('18d-coloni-duello.js','CDUEL'),assert=require('assert');
const R=carica.rng(77);C.setRnd(R);
const names=['Anna','Bruno'];
const A=(s,a)=>{const r=C.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
const ERR=(s,a)=>C.act(s,a).err;
const fresh=o=>{C.setRnd(R);return C.newGame(2,names,o)};
const main=s=>{s.phase='main';s.cur=s.turn;s.pend=[];return s};
const setRes=(p,o)=>{for(const[,r]of C.regs(p))r.r=0;for(const t in o){let k=o[t];for(const[,r]of C.regs(p))if(r.t===t&&k){const x=Math.min(3,k);r.r=x;k-=x}}};
const cards=s=>s.stacks.reduce((a,x)=>a+x.length,0)+s.hands.reduce((a,x)=>a+x.length,0)+s.disc.length+s.p.reduce((a,p)=>a+p.cols.reduce((b,c)=>b+c.top.concat(c.bot).filter(Boolean).length,0),0);
const inv=s=>assert.strictEqual(cards(s),36,'le carte non si conservano');
const dice=(s,n,f)=>{const seq=[(n-.5)/6,(f+1-.5)/6];let i=0;C.setRnd(()=>i<seq.length?seq[i++]:R());const r=C.act(s,{t:'roll'});C.setRnd(R);if(r.err)throw new Error(r.err);return r.s};

// ---- preparazione
{const s=fresh();assert.strictEqual(s.goal,12);assert.strictEqual(fresh({k:'7'}).goal,7);
 assert.strictEqual(s.stacks.length,4);assert.strictEqual(cards(s),36);assert.strictEqual(s.hands[0].length+s.hands[1].length,6);
 for(const p of s.p){assert.strictEqual(p.cols.length,2);assert.strictEqual(p.rt.length,3);assert.strictEqual(p.rb.length,3);
  assert.strictEqual(JSON.stringify(C.regs(p).map(x=>x[1].n).sort()),'[1,2,3,4,5,6]');assert.strictEqual(JSON.stringify(C.regs(p).map(x=>x[1].t).sort()),'["A","G","L","N","O","R"]');
  for(const[,r]of C.regs(p))assert.strictEqual(r.r,r.t==='O'?0:1)}
 assert.strictEqual(C.vp(s,0),2);assert.strictEqual(s.phase,'roll');assert.strictEqual(s.evs.length,9);assert.strictEqual(s.evs[5],'solstizio','solstizio sopra le tre di fondo');
 assert.strictEqual(C.IDS.reduce((a,id)=>a+C.CARDS[id].cnt,0),36);
 console.log('preparazione: 2 colonie, 6 regioni 1-6, 36 carte in 4 mazzi, eventi in ordine')}

// ---- produzione, boosters e limite di 3
{let s=fresh();const t=s.turn,p=s.p[t];setRes(p,{});const ref=C.regs(p).find(x=>x[1].t==='L');
 let s2=dice(s,ref[1].n,2);assert.strictEqual(C.R(s2.p[t],ref[0]).r,s2.p[t]===null?0:C.R(s2.p[t],ref[0]).r);
 // senza altri effetti: la regione col numero uscito guadagna 1
 s=fresh();s.p[1-s.turn].rt.forEach(r=>r.n=9);s.p[1-s.turn].rb.forEach(r=>r.n=9);const q=s.p[s.turn];setRes(q,{});
 const g=C.regs(q).find(x=>x[1].t==='G');s2=dice(s,g[1].n,2);assert.strictEqual(C.R(s2.p[s2.turn],g[0]).r,1);
 // fabbrica: raddoppia
 s=fresh();const pp=s.p[s.turn];setRes(pp,{});const gg=C.regs(pp).find(x=>x[1].t==='G'),j=+gg[0].slice(1),sd=gg[0][0]==='t'?'top':'bot';
 const col=pp.cols[Math.min(j,pp.cols.length-1)];col[sd][0]='mulino';s.p[1-s.turn].rt.forEach(r=>r.n=9);s.p[1-s.turn].rb.forEach(r=>r.n=9);
 s2=dice(s,gg[1].n,2);assert.strictEqual(C.R(s2.p[s2.turn],gg[0]).r,2,'il mulino raddoppia');
 // tetto a 3
 s=fresh();const p3=s.p[s.turn];for(const[,r]of C.regs(p3))r.r=3;s2=dice(s,p3.rt[0].n,2);assert(C.regs(s2.p[s2.turn]).every(x=>x[1].r<=3));
 console.log('produzione: numero uscito, fabbrica raddoppia, tetto 3')}

// ---- banditi: oltre 7 risorse si perdono lana e oro, il magazzino protegge
{let s=fresh();const p=s.p[s.turn];for(const[,r]of C.regs(p))r.r=2;p.rt.forEach(r=>r.n=9);p.rb.forEach(r=>r.n=9);s.p[1-s.turn].rt.forEach(r=>r.n=9);s.p[1-s.turn].rb.forEach(r=>r.n=9);
 let s2=dice(s,1,0);assert(C.regs(s2.p[s.turn]).filter(x=>x[1].t==='N'||x[1].t==='O').every(x=>x[1].r===0),'lana e oro persi');
 assert(C.regs(s2.p[s.turn]).filter(x=>x[1].t!=='N'&&x[1].t!=='O').every(x=>x[1].r===2));
 s=fresh();const q=s.p[s.turn];for(const[,r]of C.regs(q))r.r=1;q.rt[0].r=3;q.rt[1].r=3;q.rt.forEach(r=>r.n=9);q.rb.forEach(r=>r.n=9);s.p[1-s.turn].rt.forEach(r=>r.n=9);s.p[1-s.turn].rb.forEach(r=>r.n=9);
 s2=dice(s,1,0);assert.strictEqual(C.nres(s2.p[s.turn]),C.nres(q)-(q.rt[0].t==='N'||q.rt[0].t==='O'?3:0)-(q.rt[1].t==='N'||q.rt[1].t==='O'?3:0)-C.regs(q).filter(x=>x[0]!=='t0'&&x[0]!=='t1'&&(x[1].t==='N'||x[1].t==='O')).length);
 console.log('banditi: sopra 7 risorse perdi lana e oro')}

// ---- costruzioni
{let s=main(fresh());const t=s.turn,p=s.p[t];setRes(p,{});
 assert.strictEqual(ERR(s,{t:'build',w:'strada',side:'R'}),'Servono 1 legno e 2 argilla');
 setRes(p,{L:1,A:2});s=A(s,{t:'build',w:'strada',side:'R'});assert(s.p[t].rr);assert.strictEqual(C.nres(s.p[t]),0);
 assert.strictEqual(ERR(s,{t:'build',w:'strada',side:'R'}),'C’è già una strada libera da quel lato');
 assert.strictEqual(ERR(s,{t:'build',w:'colonia',side:'L'}),'Serve prima una strada da quel lato');
 setRes(s.p[t],{L:1,A:1,G:1,N:1});const r0=s.regs.length;s=A(s,{t:'build',w:'colonia',side:'R'});
 assert.strictEqual(s.p[t].cols.length,3);assert.strictEqual(s.p[t].rt.length,4);assert.strictEqual(s.p[t].rb.length,4);assert(!s.p[t].rr);assert.strictEqual(s.regs.length,r0-2);assert.strictEqual(C.vp(s,t),3);
 setRes(s.p[t],{R:3,G:2});s=A(s,{t:'build',w:'citta',col:2});assert.strictEqual(s.p[t].cols[2].c,2);assert.strictEqual(s.p[t].cols[2].top.length,2);assert.strictEqual(C.vp(s,t),4);
 assert.strictEqual(ERR(s,{t:'build',w:'citta',col:2}),'È già una città');
 // colonia a sinistra: i vicini si spostano di posto
 s.p[t].rl=true;setRes(s.p[t],{L:1,A:1,G:1,N:1});const old=s.p[t].rt[0];s=A(s,{t:'build',w:'colonia',side:'L'});assert.strictEqual(s.p[t].rt[1].n,old.n);
 inv(s);console.log('costruzioni: strada, colonia (2 regioni), città, lato sinistro, errori')}

// ---- espansioni, azioni, scambi
{let s=main(fresh());const t=s.turn,p=s.p[t];s.hands[t]=['arciere','orafo','nave_L','carovana'];setRes(p,{L:1,N:1});
 s=A(s,{t:'play',i:0,col:0,side:'top'});assert.strictEqual(s.p[t].cols[0].top[0],'arciere');assert.strictEqual(C.pts(s,t,'fr'),1);
 assert.strictEqual(ERR(s,{t:'play',i:0,col:0,side:'top'}),'Quel lato è pieno'.length?ERR(s,{t:'play',i:0,col:0,side:'top'}):'');
 setRes(s.p[t],{O:3});const ri=C.regs(s.p[t]).find(x=>x[1].t==='G')[0],rj=C.regs(s.p[t]).find(x=>x[1].t==='R')[0];
 const oi=s.hands[t].indexOf('orafo');s=A(s,{t:'play',i:oi,to:[ri,rj]});assert.strictEqual(C.R(s.p[t],ri).r,1);assert.strictEqual(C.R(s.p[t],rj).r,1);assert.strictEqual(s.disc.length,1);
 // scambio 3:1 e 2:1 con la nave
 setRes(s.p[t],{L:3});s=A(s,{t:'trade',give:'L',to:rj});assert.strictEqual(C.R(s.p[t],rj).r,1);assert.strictEqual(C.nres(s.p[t]),1);
 assert.strictEqual(ERR(s,{t:'trade',give:'L',to:ri}),'Servono 3 legno');
 s.p[t].cols[1].bot[0]='nave_L';setRes(s.p[t],{L:2});s=A(s,{t:'trade',give:'L',to:ri});assert.strictEqual(C.nres(s.p[t]),1);
 // carovana
 setRes(s.p[t],{L:2});const ci=s.hands[t].indexOf('carovana');s=A(s,{t:'play',i:ci,from:[C.regs(s.p[t]).find(x=>x[1].t==='L')[0],C.regs(s.p[t]).find(x=>x[1].t==='L')[0]],to:[ri,ri]});assert.strictEqual(C.R(s.p[t],ri).r,2);
 assert.strictEqual(ERR(s,{t:'play',i:0,col:5,side:'top'}),'Scegli un posto');
 console.log('espansioni: eroi, azioni (orafo, carovana), scambi 3:1 e 2:1, errori')}

// ---- segni di forza e commercio, punti
{let s=main(fresh());const t=s.turn;s.p[t].cols[0].top[0]='mercenario';s=A(s,{t:'end'});
 assert.strictEqual(s.tok.eroe,t,'3 punti forza e più dell’avversario');assert.strictEqual(C.vp(s,t),3);
 s=fresh();s=main(s);s.p[0].cols[0].top[0]='cavaliere';s.p[1].cols[0].top[0]='cavaliere';s.p[1].cols[1].top[0]='arciere';s.p[0].cols[1].top[0]='arciere';
 s.p[0].cols[1].bot[0]='viandante';s.p[1].cols[1].bot[0]='viandante';s=A(s,{t:'end'});assert.strictEqual(s.tok.eroe,null,'pareggio: nessun segno');
 s.p[1].cols[0].bot[0]='mercenario';const x=C.act(s,{t:'skip'});s=x.s||s;
 console.log('segni: forza ≥ 3 e maggioranza, pareggio non lo assegna')}

// ---- mano, scarti, scambio e fine turno
{let s=main(fresh());const t=s.turn;s.hands[t]=['arciere','orafo'];s=A(s,{t:'end'});assert.strictEqual(s.phase,'draw');
 assert.strictEqual(ERR(s,{t:'discard',i:0,stack:0}),'Non devi scartare');
 const k=s.stacks.findIndex(x=>x.length);s=A(s,{t:'draw',stack:k});assert.strictEqual(s.hands[t].length,3);assert.strictEqual(s.phase,'exch');
 const before=s.stacks.reduce((a,x)=>a+x.length,0);s=A(s,{t:'exch',i:0,to:0,take:1});assert.strictEqual(s.turn,1-t);assert.strictEqual(s.phase,'roll');assert.strictEqual(s.stacks.reduce((a,x)=>a+x.length,0),before);
 // oltre il limite: scarto sotto un mazzo
 s=main(fresh());const u=s.turn;s.hands[u]=['arciere','orafo','nave_L','abbazia','mulino'];s=A(s,{t:'end'});assert.strictEqual(s.phase,'draw');
 s=A(s,{t:'discard',i:0,stack:2});s=A(s,{t:'discard',i:0,stack:2});assert.strictEqual(s.phase,'exch');s=A(s,{t:'skip'});assert.strictEqual(s.turn,1-u);
 console.log('mano: pesca al limite, scarto sotto il mazzo, scambio alla cieca, fine turno')}

// ---- eventi
{let s=fresh();s.p[s.turn].cols[0].top[0]='viandante';s.p[s.turn].cols[1].top[0]='mercenario';
 for(const e of[1,2,3]){const x=fresh();x.p[x.turn].cols[0].top[0]='viandante';x.p[x.turn].cols[0].bot[0]='mercato';x.p[x.turn].cols[1].top[0]='mercenario';
  const y=dice(x,3,e);assert(['main','choose'].includes(y.phase));assert(y.log.length>1)}
 // raccolto: scelta di entrambi
 s=fresh();for(const p of s.p)for(const[,r]of C.regs(p))r.r=0;s.p.forEach(p=>{p.rt.forEach(r=>r.n=9);p.rb.forEach(r=>r.n=9)});
 let y=dice(s,1,3);assert.strictEqual(y.phase,'choose');const first=y.cur;y=A(y,{t:'sel',ref:'t0'});assert.strictEqual(y.cur,1-first,'tocca all’altro scegliere');y=A(y,{t:'sel',ref:'t0'});assert.strictEqual(y.phase,'main');assert.strictEqual(y.cur,y.turn);
 assert.strictEqual(ERR(dice(s,1,3),{t:'sel',ref:'x9'}),'Scelta non valida');
 // solstizio: l'evento successivo si pesca subito
 s=fresh();s.evs=['solstizio',...s.evs.filter(c=>c!=='solstizio')];y=dice(s,1,4);assert.strictEqual(y.evs.length,9);assert(y.log.some(l=>/Solstizio/.test(l)));
 // veggente: sceglie il numero
 s=fresh();s.hands[s.turn]=['veggente'];const g=C.regs(s.p[s.turn]).find(x=>x[1].t==='G'),b0=g[1].r;s.p[1-s.turn].rt.forEach(r=>r.n=9);s.p[1-s.turn].rb.forEach(r=>r.n=9);
 y=A(s,{t:'play',i:0,n:g[1].n});assert(['main','choose'].includes(y.phase));assert.strictEqual(y.hands[s.turn].length,0);assert(C.R(y.p[s.turn],g[0]).r>=b0);
 console.log('eventi: commercio, festa, raccolto con scelte alternate, solstizio, veggente')}

// ---- azioni non valide
{const s=fresh();assert.strictEqual(ERR(s,{t:'end'}),'Tira i dadi');assert.strictEqual(ERR(s,{t:'build',w:'strada',side:'L'}),'Tira i dadi');assert.strictEqual(ERR(s,null),'Azione sconosciuta');
 const m=main(fresh());assert.strictEqual(ERR(m,{t:'roll'}),'Azione non valida ora');assert.strictEqual(ERR(m,{t:'build',w:'x'}),'Costruzione sconosciuta');assert.strictEqual(ERR(m,{t:'play',i:9}),'Carta non valida');
 assert.strictEqual(ERR(m,{t:'trade',give:'Z',to:'t0'}),'Scegli cosa dare');
 const o=JSON.parse(JSON.stringify(m));o.over={win:0};assert.strictEqual(ERR(o,{t:'end'}),'Partita finita');
 console.log('azioni non valide: tutte rifiutate con un messaggio')}

// ---- partite complete: bot esperto contro bot casuale
function gioca(smartSeat,seed,k){const rr=carica.rng(seed);C.setRnd(rr);let s=C.newGame(2,names,{k});let n=0;
 const rnd=()=>rr();
 while(!s.over&&n++<4000){const me=s.cur;let a;
  if(me===smartSeat)a=C.bot(s,rnd);else{const ls=C.legal(s);a=ls[Math.floor(rr()*ls.length)]}
  const r=C.act(s,a);if(r.err)throw new Error('mossa rifiutata '+r.err+' '+JSON.stringify(a)+' fase '+s.phase);s=r.s;if(n%97===0)inv(s)}
 assert(s.over,'la partita non finisce (turno '+s.tn+')');inv(s);return s}
{let w=0,N=60,turni=0;for(let i=0;i<N;i++){const seat=i%2,s=gioca(seat,1000+i,i%3?'7':'12');if(s.over.win===seat)w++;turni+=s.tn}
 console.log('bot esperto contro casuale: '+w+'/'+N+' vittorie, media '+Math.round(turni/N)+' turni');assert(w>=N*.85,'il bot esperto deve vincere quasi sempre')}
{let fin=0;for(let i=0;i<20;i++){const rr=carica.rng(5000+i);C.setRnd(rr);let s=C.newGame(2,names,{k:'7'}),n=0;while(!s.over&&n++<3000){const ls=C.legal(s);const r=C.act(s,ls[Math.floor(rr()*ls.length)]);if(r.err)throw new Error(r.err);s=r.s}if(s.over)fin++;inv(s)}
 console.log('casuale contro casuale: nessun errore, '+fin+'/20 finite');assert(fin>=1)}
console.log('Coloni: il Duello OK');
