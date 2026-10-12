// Discesa Tascabile: geometria (distanze, linea di vista), IA dei mostri, fuzz di classi/oggetti/forzieri/boss/Pietra
// in tutte le avventure, e un bot che pianifica arriva molto più in fondo di uno casuale.
const D=require('../src/js/motori/15-discesa-tascabile.js'),B=require('./bot_discesa.js'),carica=require('./carica.js'),assert=require('assert');
// --- geometria ---
assert.strictEqual(D.dist({x:0,y:0},{x:1,y:0}),2,'ortogonale = 2');assert.strictEqual(D.dist({x:0,y:0},{x:1,y:1}),3,'diagonale = 3');assert.strictEqual(D.dist({x:0,y:0},{x:2,y:1}),5);
const fake=(rows,mon)=>({map:[...rows,...Array(6-rows.length).fill('.....')],mon:mon.map(([x,y])=>({x,y,hp:1}))});
assert(D.los(fake(['.....','.....'],[]),{x:0,y:0},{x:4,y:0}),'vista libera');
assert(!D.los(fake(['..#..','..#..','..#..'],[]),{x:0,y:1},{x:4,y:1}),'muro pieno blocca');
assert(!D.los(fake(['.....','.....','.....'],[[1,1],[2,1],[3,1],[2,0],[2,2]]),{x:0,y:1},{x:4,y:1}),'mostri bloccano la vista');
console.log('geometria: ok');
// --- IA: un mostro a distanza si porta alla massima gittata con linea di vista e attacca ---
{D.setRnd(carica.rng(3));let s=D.act(D.newGame(1,['io'],{adv:'base'}),{t:'setup',cls:'nessuna'}).s;
 s.mon=[{n:'Prova',hp:2,max:2,rng:4,def:2,atk:12,spd:6,x:2,y:0,bon:null}];s.map=['.....','.....','.....','.....','.....','.....'];s.hero.x=2;s.hero.y=5;
 let r=D.act(s,{t:'assign',order:[0,1,2]});const def=D.hStat(r.s,'D');r=D.act(r.s,{t:'end'});const m=D.alive(r.s)[0];
 assert(D.dist(m,{x:2,y:5})<=4,'il mostro entra in gittata');assert.strictEqual(D.dist(m,{x:2,y:5}),4,'e resta alla gittata massima');
 assert.strictEqual(6-r.s.hero.hp,Math.floor(12/def),'danno = attacco / difesa per difetto')}
console.log('IA dei mostri: ok');
// --- fuzz ---
function rnd(s,R){const pick=a=>a[Math.floor(R()*a.length)];
 if(s.phase==='levelup')return{t:'up',stat:pick(['S','A','D','R','heal'])};
 if(s.phase==='energy'){const r=R();if(r<.1)return{t:'reroll'};if(r<.15)return{t:'paladin',stat:pick(['S','A','D'])};if(r<.2&&s.items.length)return{t:'item',id:pick(s.items),i:0};
  return{t:'assign',order:pick([[0,1,2],[2,1,0],[1,2,0]]),ranger:R()<.1}}
 const r=R(),ms=D.alive(s);if(r<.3)return{t:'end'};if(r<.55&&ms.length)return{t:'attack',m:Math.floor(R()*ms.length),ignoreLos:R()<.1};
 if(r<.65&&s.items.length)return{t:'item',id:pick(s.items),m:0};if(r<.7)return{t:'power',m:0};
 return{t:R()<.05?'warp':'move',x:Math.floor(R()*5),y:Math.floor(R()*6),sherpa:R()<.1}}
const R=carica.rng(41);let n=0;
for(const adv of ['base','porto','vetta','soglia'])for(const cls of Object.keys(D.CLS))for(let g=0;g<2;g++){D.setRnd(R);
 const mods={chest:R()<.6,items:R()<.6,boss:R()<.5,stone:R()<.3};let s=D.act(D.newGame(1,['io'],{adv}),{t:'setup',cls,...mods}).s,k=0;
 while(!s.over&&k++<3000){const r=D.act(s,rnd(s,R));if(!r.err)s=r.s;assert(s.hero.hp<=6&&s.hero.hp>=0,'salute fuori scala');
  assert(D.alive(s).every(m=>!D.wall(s,m.x,m.y)),'mostro dentro un muro');assert(!D.monAt(s,s.hero.x,s.hero.y),'eroe e mostro nella stessa casella')}n++}
console.log('fuzz:',n,'partite con tutte le classi e le espansioni: ok');
// --- bot che pianifica contro casuale ---
let ok=true;for(const adv of ['base','soglia']){let sb=0,sr=0,w=0;const N=4;
 for(let g=0;g<N;g++){D.setRnd(R);let s=D.act(D.newGame(1,['io'],{adv}),{t:'setup',cls:'nessuna'}).s,k=0;while(!s.over&&k++<800)s=B.turn(s);assert(s.over,'il bot finisce la partita');sb+=s.over.lv;if(s.over.win)w++;
  D.setRnd(R);s=D.act(D.newGame(1,['io'],{adv}),{t:'setup',cls:'nessuna'}).s;k=0;while(!s.over&&k++<3000){const r=D.act(s,rnd(s,R));if(!r.err)s=r.s}sr+=s.over?s.over.lv:s.level}
 console.log('Discesa',adv+': il bot arriva in media al livello',(sb/N).toFixed(1),'('+w+' vittorie), il casuale al',(sr/N).toFixed(1));if(sb<=sr+3)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
