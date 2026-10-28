// Accordi della Natura: impilamento, schemi con rotazioni e specchio, punteggi a mano (lati A-D, Rifugi, Folletti, Custodi),
// conservazione dei 120 dischi, partite da 1 a 4 in tutte le preparazioni, errori, bot goloso che batte il casuale.
const A=require('../src/js/motori/38-accordi.js'),carica=require('./carica.js'),assert=require('assert');
const K=A.K;
/* plancia vuota del lato scelto con alcune pile */
function st(side,piles,extra){const s=A.newGame(1,['x'],{x:{A:'A',B:'B',C:'F3',D:'F2'}[side]});const b=s.pl[0];
 for(const k in piles)b.cells[k].s=piles[k];Object.assign(b,extra||{});return s}
const P=(c,r)=>K(c-(r-(r&1))/2,r); // colonna/riga sulla plancia
// --- impilamento ---
assert(A.legal('','b')&&A.legal('','r'),'tutto va su una casella vuota');
assert(A.legal('g','g')&&A.legal('gg','g')&&!A.legal('ggg','g'),'monti fino a 3');
assert(A.legal('m','m')&&!A.legal('mm','m'),'tronchi fino a 2');
assert(A.legal('m','v')&&A.legal('mm','v')&&!A.legal('g','v')&&!A.legal('v','v'),'chioma su 0-2 tronchi');
assert(A.legal('g','r')&&A.legal('m','r')&&A.legal('r','r')&&!A.legal('gg','r')&&!A.legal('b','r'),'tetto su un solo disco');
assert(!A.legal('b','b')&&!A.legal('y','y')&&!A.legal('y','g'),'acqua e campi non si impilano');
// --- schemi: rotazioni e specchio ---
{const s=st('A',{[P(1,1)]:'mmv',[P(2,1)]:'gg',[P(2,2)]:'y'});
 // lince: mmv; gg a est; y a sud-est (dal punto di vista dell'albero). Qui: albero (1,1), gg (2,1) est, y (1,2) riga sotto
 const ok=A.matchAt(s.pl[0].cells,'lince',P(1,1));const okM=(()=>{const t=st('A',{[P(1,1)]:'mmv',[P(0,1)]:'gg',[P(1,2)]:'y'});return A.matchAt(t.pl[0].cells,'lince',P(1,1))})();
 assert(ok&&okM,'la lince si riconosce, anche allo specchio');
 // lo specchio: tutte le 12 simmetrie di uno schema asimmetrico devono essere trovate
 const c=A.CARDS.ghiro;let found=0;const rot=([q,r])=>[-r,q+r],mir=([q,r])=>[r,q];
 for(let m=0;m<2;m++)for(let k=0;k<6;k++){const t=st('A',{});const cells=t.pl[0].cells,ctr=P(2,2).split(',').map(Number);
  const f=v=>{let x=m?mir(v):v;for(let i=0;i<k;i++)x=rot(x);return x};let fit=true;
  for(const[dq,dr,need]of c.pat){const[x,y]=f([dq,dr]),kk=K(ctr[0]+x,ctr[1]+y);if(!cells[kk]){fit=false;break}cells[kk].s=need==='H'?'gr':need}
  if(fit&&A.matchAt(cells,'ghiro',P(2,2)))found++}
 assert.strictEqual(found,12,'12 orientamenti riconosciuti (rotazioni e specchio)');}
// --- punteggi a mano, lato A ---
{const d=A.scoreP(st('A',{[P(0,0)]:'v',[P(1,0)]:'mv',[P(2,0)]:'mmv'}),0);assert.strictEqual(d.tree,11,'alberi 1+3+7');}
{const d=A.scoreP(st('A',{[P(0,0)]:'ggg',[P(1,0)]:'g',[P(3,0)]:'gg'}),0);assert.strictEqual(d.mount,8,'monti solo se toccano un monte: 7+1');}
{const d=A.scoreP(st('A',{[P(0,0)]:'y',[P(1,0)]:'y',[P(3,0)]:'y',[P(4,0)]:'y',[P(4,2)]:'y'}),0);assert.strictEqual(d.field,10,'due campi da 2, il campo da 1 non conta');}
{const d=A.scoreP(st('A',{[P(1,1)]:'gr',[P(1,0)]:'b',[P(2,0)]:'y',[P(0,1)]:'v'}),0);assert.strictEqual(d.house,5,'casa con 3 colori attorno');}
{const d=A.scoreP(st('A',{[P(1,1)]:'gr',[P(1,0)]:'b',[P(2,0)]:'b'}),0);assert.strictEqual(d.house,0,'casa con un solo colore');}
{const d=A.scoreP(st('A',{[P(0,0)]:'b',[P(1,0)]:'b',[P(2,0)]:'b',[P(3,0)]:'b'}),0);assert.strictEqual(d.water,8,'fiume da 4');}
assert.strictEqual(A.river(8),23,'fiume da 8: 15 + 4 + 4');
// --- lato B: isole ---
{const d=A.scoreP(st('B',{[P(0,0)]:'y',[P(1,0)]:'b',[P(2,0)]:'g',[P(0,2)]:'v'}),0);assert.strictEqual(d.water,15,'tre isole');}
// --- lato C: niente centro, case a 4 colori valgono 8 ---
{const s=st('C',{});assert(!s.pl[0].cells[P(2,2)],'centro mancante');assert.strictEqual(Object.keys(s.pl[0].cells).length,22);
 const t=st('C',{[P(1,1)]:'gr',[P(1,0)]:'b',[P(2,0)]:'y',[P(0,1)]:'v',[P(2,1)]:'g'});assert.strictEqual(A.scoreP(t,0).house,8,'casa a 4 colori');}
// --- lato D: aride ---
{const s=st('D',{[P(0,0)]:'mmv'});assert.strictEqual(A.scoreP(s,0).tree,0,'albero su arida: 0');
 s.pl[0].cells[P(1,0)].s='b';assert.strictEqual(A.scoreP(s,0).tree,7,'irrigato dall’acqua accanto');
 const f=st('D',{[P(0,2)]:'y',[P(0,1)]:'y'});assert.strictEqual(A.scoreP(f,0).field,6,'campo da 6 con una casella ordinaria');}
// --- carte animali, folletti, custodi ---
{const s=st('A',{[P(1,1)]:'b',[P(2,1)]:'y'});let r=A.act(s,{t:'take',i:0});s.disp=['airone'];r=A.act(Object.assign(s,{}),{t:'card',i:0});assert(!r.err);
 let t=r.s;r=A.act(t,{t:'cube',c:0,k:P(1,1)});assert(!r.err,'cubetto airone');assert.strictEqual(A.scoreP(r.s,0).anim,2);
 assert(A.act(r.s,{t:'cube',c:0,k:P(1,1)}).err,'non due cubetti nella stessa casella');
 assert(A.act(r.s,{t:'cube',c:0,k:P(2,1)}).err,'schema incompleto');
 assert(A.act(r.s,{t:'put',j:0,k:P(1,1)}).err,'niente dischi sopra un cubetto');}
{const s=st('A',{[P(1,1)]:'v'});s.cfg.fol=1;s.pl[0].hand=[{id:'lucciola',n:0},{id:'gatto',n:0}];
 let r=A.act(s,{t:'cube',c:0,k:P(1,1)});assert(!r.err);assert.strictEqual(A.scoreP(r.s,0).fol,2,'folletto da solo: 2');
 r.s.pl[0].cells[P(2,1)].s='gr';const r2=A.act(r.s,{t:'cube',c:1,k:P(2,1)});assert(!r2.err);
 r2.s.pl[0].cells[P(1,1)].a='a';assert.strictEqual(A.scoreP(r2.s,0).fol,5,'folletto con animale: 5');}
{const s=st('A',{[P(0,0)]:'y',[P(1,0)]:'y',[P(2,0)]:'y',[P(4,4)]:'y'});s.pl[0].spirit={id:'campi',n:1};assert.strictEqual(A.scoreP(s,0).spi,10,'custode dei campi: 8+2');
 s.pl[0].spirit.n=0;assert.strictEqual(A.scoreP(s,0).spi,0,'senza cubetto il custode non vale');}
// --- rifugi ---
{const s=st('A',{});s.cfg.rif=1;s.pl[0].rif=[{id:'sorgente',site:null}];s.hold=['g','g','b','b'];s.took=0;
 let t=s;for(const k of[0,0,0,0]){const r=A.act(t,{t:'put',j:0,k:P(2,2)});assert(!r.err,r.err);t=r.s}
 assert.strictEqual(t.pl[0].rifOk.length,1,'rifugio completato');assert.strictEqual(t.pl[0].cells[P(2,2)].s,'ggbb');
 const u=A.act(st('A',{[P(2,2)]:'gg'}),{t:'take',i:0}).s;u.hold=['b'];assert(A.act(u,{t:'put',j:0,k:P(2,2)}).err,'senza rifugio niente acqua sul monte');
 t.pl[0].cells[P(2,1)].s='b';t.pl[0].cells[P(3,2)].s='g';t.pl[0].cells[P(1,2)].s='y';assert.strictEqual(A.scoreP(t,0).rif,6,'3 punti per vicino di colore giusto');
 t.pl[0].hand=[{id:'falco',n:3}];const r=A.act(t,{t:'cuberif',c:0,f:0});assert(!r.err,r.err);assert.strictEqual(r.s.pl[0].done.length,1,'ultimo cubetto sul rifugio');
 t.pl[0].hand=[{id:'falco',n:2}];assert(A.act(t,{t:'cuberif',c:0,f:0}).err,'solo l’ultimo cubetto');
 t.pl[0].hand=[{id:'cervo',n:2}];assert(A.act(t,{t:'cuberif',c:0,f:0}).err,'colore sbagliato');}
console.log('casi a mano: ok');
// --- partite ---
const R=carica.rng(11);
function contaDischi(s){let n=s.bag.length+s.box.length+s.hold.length;s.slots.forEach(x=>{if(x)n+=x.length});s.pl.forEach(b=>{for(const k in b.cells)n+=b.cells[k].s.length});return n}
function cubiOpz(s){const p=s.cur,b=s.pl[p],out=[];b.hand.forEach((h,c)=>A.cubeSpots(s,p,h.id).forEach(k=>out.push({t:'cube',c,k})));
 if(b.spirit&&!b.spirit.n)A.cubeSpots(s,p,b.spirit.id).forEach(k=>out.push({t:'cube',c:'spirit',k}));
 b.hand.forEach((h,c)=>{const C=A.CARDS[h.id];if(C.k==='a'&&C.pts.length-h.n===1)b.rifOk.forEach((f,fi)=>{if(A.CARDS[f.id].cols.includes(A.topC(C.pat[0][2])))out.push({t:'cuberif',c,f:fi})})});return out}
function puts(s,j){const p=s.cur,out=[];for(const k in s.pl[p].cells)if(A.canPut(s,p,k,s.hold[j]))out.push({t:'put',j,k});return out}
const pot=(s,p)=>{const b=s.pl[p];let v=0;b.hand.forEach(h=>{if(A.cubeSpots(s,p,h.id).length)v+=4});return v};
const val=(s,p)=>A.scoreP(s,p).tot+pot(s,p);
function placeCubes(s){for(let g=0;g<30;g++){const o=cubiOpz(s);if(!o.length)return s;s=A.act(s,o[0]).s}return s}
function carta(s){const p=s.cur,b=s.pl[p];if(b.offer)return A.act(s,{t:'spirit',i:0}).s;
 if(s.cfg.rif&&!s.tookRif&&A.held(b)<3&&s.rdisp.length&&b.rif.length===0)s=A.act(s,{t:'rif',i:0}).s;
 if(!s.tookCard&&A.held(s.pl[p])<4&&s.disp.length){let best=-1,bi=0;s.disp.forEach((id,i)=>{const C=A.CARDS[id];const v=A.cubeSpots(s,p,id).length*3+C.pts[C.pts.length-1]/C.pts.length/C.pat.length;if(v>best){best=v;bi=i}});s=A.act(s,{t:'card',i:bi}).s}
 return s}
function gol(s){const p=s.cur;s=carta(s);s=placeCubes(s);let best=null;
 s.slots.forEach((sl,i)=>{if(!sl)return;let t=A.act(s,{t:'take',i}).s;
  while(t.hold.length){let bm=null;for(let j=0;j<t.hold.length;j++)for(const a of puts(t,j)){const n=placeCubes(A.act(t,a).s),v=val(n,p);if(!bm||v>bm.v)bm={v,n}}if(!bm)break;t=bm.n}
  const v=val(t,p);if(!best||v>best.v)best={v,t}});
 s=best.t;s=carta(s);s=placeCubes(s);return A.act(s,{t:'end'}).s}
function rnd(s,Rr){const pick=a=>a[Math.floor(Rr()*a.length)];const b=s.pl[s.cur];if(b.offer)s=A.act(s,{t:'spirit',i:0}).s;
 const sl=s.slots.map((x,i)=>x?i:-1).filter(i=>i>=0);s=A.act(s,{t:'take',i:pick(sl)}).s;
 while(s.hold.length){const o=puts(s,0);if(!o.length)break;s=A.act(s,pick(o)).s}
 if(!s.tookCard&&A.held(s.pl[s.cur])<4&&s.disp.length&&Rr()<.5)s=A.act(s,{t:'card',i:Math.floor(Rr()*s.disp.length)}).s;
 s=placeCubes(s);return A.act(s,{t:'end'}).s}
function partita(n,x,chi){A.setRnd(R);let s=A.newGame(n,['a','b','c','d'].slice(0,n),{x}),k=0;assert.strictEqual(contaDischi(s),120);
 while(!s.over&&k++<400){s=s.cur===chi?gol(s):rnd(s,R);if(!s)throw new Error('mossa rifiutata');assert.strictEqual(contaDischi(s),120,'120 dischi')}
 if(!s.over)throw new Error('senza fine');return s.over}
// errori
{A.setRnd(R);const s=A.newGame(2,['a','b']);assert(A.act(s,{t:'end'}).err,'senza dischi non si finisce');assert(A.act(s,{t:'put',j:0,k:P(0,0)}).err);
 const t=A.act(s,{t:'take',i:0}).s;assert(A.act(t,{t:'take',i:1}).err,'una sola presa');assert(A.act(t,{t:'end'}).err,'tutti e tre i dischi');assert(A.act(s,{t:'zzz'}).err);}
let ok=true;
const piano=[];A.presets().forEach(([x])=>piano.push([x,2]));piano.push(['A',1],['F4',1],['B',3],['F4',4]);
for(const[x,n]of piano){let w=0,sc=0;const N=n===1?2:3;
 for(let g=0;g<N;g++){const o=partita(n,x,g%n);if(o.winners.includes(g%n))w++;sc+=o.scores[g%n]}
 console.log('Accordi',x,n,'giocatori: il bot goloso',n===1?'fa in media '+Math.round(sc/N)+' punti':'vince '+Math.round(w/N*100)+'%');
 if(n>1&&w/N<.66)ok=false;if(n===1&&sc/N<40)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
