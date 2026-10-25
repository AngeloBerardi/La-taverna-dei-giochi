// Regicide Legacy: regole puntuali, conservazione delle carte, ogni missione col bot che valuta le mosse e col bot casuale,
// campagna completa 1→12 (con mercenari dopo le sconfitte) e spedizione libera.
const carica=require('./carica.js'),RL=carica('36-regicide-legacy.js','RLEG');
const R=carica.rng(11);RL.setRnd(R);
let ok=true;const chk=(c,t)=>{if(!c){ok=false;console.log('✘',t)}};
const A=(s,a)=>{const r=RL.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
/* ---------- bot ---------- */
function subsets(h){const out=[];for(let m=1;m<1<<h.length;m++){const k=h.filter((_,i)=>m>>i&1);if(k.length<=4)out.push(k)}return out}
function plays(s){const r=[];const seen=new Set();for(const k of subsets(s.hands[s.cur])){if(RL.checkPlay(s,k))continue;const key=k.map(c=>RL.nm(s,c)).sort().join('|');if(seen.has(key))continue;seen.add(key);
  const pv=RL.preview(s,k);r.push({t:'play',cards:k,dev:pv&&pv.devour?2:0})}
 if(!(s.n>1&&s.yr>=s.n-1)&&!(s.n===1&&s.yr>=1))r.push({t:'yield'});if(s.n===1&&s.jl>0)for(const k of 'GPCB')r.push({t:'solo',k});return r}
const killed=s=>s.kills;
function val(s){if(s.over)return s.over.win?1e7:-1e7+killed(s)*1000;const en=s.en,str=RL.effStr(s);let v=killed(s)*1000;
 if(en)v+=en.dmg/en.hp*500-str*12;
 s.hands.forEach((h,i)=>{const hs=h.reduce((t,c)=>t+RL.val(s,c),0);v+=Math.min(hs,40)*5+h.length*10;
  // chi dovrà parare il prossimo colpo senza abbastanza carte è in pericolo
  if(hs<str)v-=i===s.cur?250:150});
 return v+s.res.length*3+s.disc.length-s.ban.length*2+s.jl*120}
function settle(s){let g=0;while(!s.over&&g++<6){
  if(s.phase==='discard'){const d=RL.bestDiscard(s);const r=d.length?RL.act(s,{t:'discard',cards:d}):RL.act(s,{t:'feign'});if(r.err)break;s=r.s}
  else if(s.phase==='magic')s=RL.act(s,mageBest(s)).s;
  else if(s.phase==='pick')s=RL.act(s,{t:'pick',to:bestPick(s)}).s;else break}return s}
function mageBest(s){let b=null;for(const c of s.rev){const d=RL.def(s,c),v=d.v+(d.c&&!s.en.c.includes(d.c[0])?4:0);if(d.k!=='x'&&(!b||v>b.v))b={v,c}}return{t:'mago',c:b?b.c:null}}
function bestPick(s){let b=0;for(let p=0;p<s.n;p++)if(s.hands[p].reduce((t,c)=>t+RL.val(s,c),0)>s.hands[b].reduce((t,c)=>t+RL.val(s,c),0))b=p;return b}
function smart(s){
 if(s.phase==='prep'){if(s.coins){for(const id of ['mc1','mvG','mvP','mc2','mvC','ml1','mvB','mg1','mg2','ml2','mg3','mg4']){if(s.prep.merc.includes(id))continue;const r=RL.act(s,{t:'merc',id});if(!r.err)return{t:'merc',id}}}return{t:'start',first:0}}
 if(s.phase==='discard'){const d=RL.bestDiscard(s);return d.length?{t:'discard',cards:d}:{t:'feign'}}
 if(s.phase==='magic')return mageBest(s);if(s.phase==='pick')return{t:'pick',to:bestPick(s)};
 if(s.stacks&&!s.sac){const h=s.hands[s.cur].slice().sort((a,b)=>RL.val(s,a)-RL.val(s,b));const st=s.stacks.findIndex(x=>x.length);
  if(st>=0&&h.length&&RL.val(s,h[0])<=4&&RL.def(s,h[0]).k!=='x')return{t:'sacr',c:h[0],k:st}}
 let best=null;for(const a of plays(s)){const r=RL.act(s,a);if(r.err)continue;const v=val(settle(r.s))-(a.t==='yield'?40:0)-(a.t==='solo'?150:0);if(!best||v>best.v)best={v,a}}
 return best.a}
function rnd(s){if(s.phase==='prep')return{t:'start',first:0};
 if(s.phase==='discard'){const h=s.hands[s.cur].slice().sort(()=>R()-.5),k=[];for(const c of h){if(k.reduce((t,x)=>t+RL.val(s,x),0)>=s.owed)break;k.push(c)}
  return k.reduce((t,x)=>t+RL.val(s,x),0)>=s.owed?{t:'discard',cards:k}:{t:'feign'}}
 if(s.phase==='magic')return{t:'mago',c:s.rev.length?s.rev[0]:null};if(s.phase==='pick')return{t:'pick',to:Math.floor(R()*s.n)};
 const p=plays(s);return p[Math.floor(R()*p.length)]}
function partita(n,bot,camp,modo){let s=RL.newGame(n,[],{camp,modo}),k=0,tot=null;
 while(!s.over&&k++<3000){const a=bot(s);const r=RL.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' fase '+s.phase);s=r.s;
  if(s.phase!=='prep'){const t=RL.count(s)-s.ne;if(tot===null)tot=t;else if(t!==tot&&!s.over)throw new Error('carte perse: '+t+' invece di '+tot+' (missione '+s.mis+')')}}
 if(!s.over){console.log(s.log.slice(-12).join('\n'),s.phase,s.hands);throw new Error('missione senza fine '+s.mis)}if(process.env.DBG&&bot===smart&&!s.over.win)console.log('  persa m'+s.mis,'n'+n,'uccisi',s.kills,s.over.reason);return s}
/* ---------- regole puntuali ---------- */
{let s=RL.newGame(2,['A','B'],{});chk(s.phase==='prep'&&s.mis===1,'nuova campagna parte dalla missione 1');
 chk(RL.act(s,{t:'play',cards:['G3']}).err,'in preparazione non si attacca');
 s=A(s,{t:'start',first:1});chk(s.cur===1&&s.hands[0].length===7&&s.hands[1].length===7,'mano da 7 in due e inizia chi si sceglie');
 chk(s.castle.length===11&&s.en.v===10&&s.en.hp===20,'12 nemici, primo forza 10 vita 20');
 // mano truccata
 s.hands[1]=['G5','P5','C3','B1','G2','X1','P10'];s.en.c='C';
 chk(!RL.checkPlay(s,['G5','P5']),'combo 5+5 valida');chk(RL.checkPlay(s,['G5','P5','C3']),'combo di valori diversi rifiutata');
 chk(!RL.checkPlay(s,['B1','P10']),'animale + carta valido');chk(RL.checkPlay(s,['B1','P10','G2']),'animale con due carte senza Fischietto rifiutato');
 chk(RL.checkPlay(s,['X1','G2']),'giullare in combo rifiutato');
 const pv=RL.preview(s,['G5','P5']);chk(pv.dmg===20&&pv.shield===10,'5+5 ascia e scudo: danno 20, scudo 10');
 const s2=A(s,{t:'play',cards:['G5','P5']});chk(s2.kills===1&&s2.over===null,'nemico 20 di vita colpito per 20: sconfitto');
 chk(s2.res[s2.res.length-1].startsWith('E')||s2.disc.some(c=>c.startsWith('E')),'nemico sconfitto diventa carta');
 const s3=A(s,{t:'play',cards:['C3']});chk(s3.phase==='discard'&&s3.owed===10,'pozione contro nemico immune: niente cura, colpo 10');
 // fingersi morti
 s3.hands[1]=['B1','B1x'].slice(0,0).concat(['C2','G2','P1','B2','X1','C3','G4']).slice(0,7);s3.owed=40;
 chk(RL.canFeign(s3),'mano piena: fingersi morti possibile');const s4=A(s3,{t:'feign'});chk(s4.hands[1].length===0&&s4.cur===0,'fingersi morti scarta tutto e passa il turno');
 // giullare
 const s5=A(s,{t:'play',cards:['X1']});chk(s5.phase==='pick','giullare: si sceglie chi reclama');const s6=A(s5,{t:'pick',to:1});chk(s6.jx&&s6.cur===1,'chi reclama attacca senza immunità');
 const s7=A(s6,{t:'play',cards:['C3']});chk(s7.log.some(t=>t.startsWith('Cura')),'dopo il giullare la pozione cura anche contro un nemico immune')}
{// solitario: giullari speciali
 let s=A(RL.newGame(1,['Solo'],{}),{t:'start',first:0});chk(s.hl===8&&s.jl===2&&!s.res.includes('X1'),'solitario: mano 8, due giullari fuori mazzo');
 s.en.c='G';const s2=A(s,{t:'solo',k:'G'});chk(s2.jl===1&&(s2.over||s2.kills===1||s2.en.dmg===16),'giullare solitario: forza 8 come guerriero ignorando l’immunità (16 danni)')}
{// classi avanzate e missioni speciali
 const c=RL.newCamp();c.m=8;c.merc=true;c.fails[8]=2;
 let s=RL.newGame(3,['A','B','C'],{camp:c});chk(s.coins===3,'oro dei mercenari 1+2');s=A(s,{t:'merc',id:'mvG'});chk(RL.act(s,{t:'merc',id:'mc1'}).err,'oro insufficiente');
 s=A(s,{t:'start',first:0});chk(s.res.concat(...s.hands).includes('mvG'),'mercenario nel mazzo');chk(s.camp.party.includes('T9')&&s.camp.party.includes('p7d'),'missione 8: cantori e pellegrini nel party');
 s.hands[0]=['M5','T3','S7','D9','R10','G2'];s.en.c='P';s.en.dmg=0;
 let m=A(s,{t:'play',cards:['M5']});chk(m.phase==='magic'&&m.rev.length===5,'mago 5 scopre 5 carte');
 const pickc=m.rev.find(x=>RL.def(m,x).k!=='x');m=A(m,{t:'mago',c:pickc});chk(m.phase!=='magic'||m.rev.length>0,'scelta del mago risolta');
 const g=A(s,{t:'play',cards:['S7']});chk(g.cur===1&&g.phase==='play','guardiano: il nemico non colpisce');
 s.disc=['p2a','G3','C4'];const d=A(s,{t:'play',cards:['D9']});chk(d.ban.includes('p2a')&&d.res.includes('G3'),'druido: pellegrini banditi, il resto torna');
 s.en.c='C';const r=A(s,{t:'play',cards:['R10'],dev:2});chk(r.ban.length>=2,'razziatore divora 2 carte');
 const t=A(s,{t:'play',cards:['T3']});chk(t.hands.every(h=>h.length<=t.hl),'cantore: nessuno oltre il limite')}
{// zona missione
 const c=RL.newCamp();c.m=7;let s=A(RL.newGame(2,['A','B'],{camp:c}),{t:'start',first:0});s.phase='discard';s.owed=1;s.hands[0]=['G1','G5'];
 const z=A(s,{t:'discard',cards:['G1']});chk(z.mz.length===1&&z.mz[0]==='G1','l’asso va nella zona missione');
 z.en.dmg=0;chk(RL.effStr(z)===z.en.v+1-z.en.red,'la zona alza la forza del nemico')}
{// corruzione e madre
 const c=RL.newCamp();c.m=9;let s=A(RL.newGame(2,['A','B'],{camp:c}),{t:'start',first:0});chk(s.stacks&&s.stacks.every(x=>x.length===10),'missione 9: tre pile da 10');
 s.corr=['G4'];s.hands[0]=['G4','P2','C9'];s.en.c='G';const b0=s.ban.length;const x=A(s,{t:'play',cards:['G4']});
 chk(x.ban.length===b0+1&&!x.hands[0].includes('P2'),'Madre Sempreverde: la corruzione brucia la carta più debole della mano');
 chk(x.log.some(t=>t.includes('Danno 8')),'eroe corrotto ignora l’immunità (ascia ×2)');
 const sc=A(s,{t:'sacr',c:'P2',k:0});chk(sc.stacks[0].length===9&&sc.ban.includes('P2'),'sacrificio recupera un disperso');chk(RL.act(sc,{t:'sacr',c:'C9',k:1}).err,'un sacrificio per turno')}
/* ---------- missioni una per una ---------- */
const rate=[];
const SOLO=process.argv[2]?+process.argv[2]:0;
for(let m=SOLO||1;m<=(SOLO||12);m++){let cc=RL.newCamp();for(let k=1;k<m;k++)cc=finish(cc,k);
 cc.m=m;let ws=0,wr=0;const N=m>=8?6:10;
 for(let i=0;i<N;i++){const n=1+i%4;if(partita(n,smart,cc).over.win)ws++;if(partita(n,rnd,cc).over.win)wr++}
 rate.push(m+':'+ws+'/'+N+(wr?' (casuale '+wr+')':''));chk(wr===0,'missione '+m+': il bot casuale non vince');}
function finish(c,k){// simula la vittoria della missione k applicando setup e premi
 const s=RL.newGame(2,[],{camp:Object.assign(RL.clone(c),{m:k})}),cc=s.camp;cc.done.push(k);cc.m=k+1;
 if(k===1)cc.rel.push('flauto');if(k===4){cc.rel.push('fischietto');cc.beasts=true;cc.party.push('tronco')}if(k===5)cc.mod.tronco='G';if(k===6)cc.rel.push('emblema');
 if(k===11){cc.torn.push('edera');cc.party=cc.party.filter(x=>x!=='edera');cc.mod.tronco='W'}return cc}
console.log('vittorie bot per missione',rate.join(' '));
/* ---------- campagna completa a 2 giocatori ---------- */
if(!SOLO){let camp=null,tent=0,v0=0;const n=2;
 while(tent<600){const s=partita(n,smart,camp);tent++;chk(s.camp.v>v0,'versione della campagna cresce');v0=s.camp.v;camp=s.camp;if(camp.fin)break}
 console.log('campagna completata in',tent,'tentativi · sconfitte per missione',JSON.stringify(camp.fails),' · missione',camp.m,'· reliquie',camp.rel.join(','),'· corrotti',camp.corr.length,'· strappate',camp.torn.join(','));
 chk(camp.fin&&camp.done.length===12,'il bot completa la campagna');chk(camp.torn.includes('edera')&&camp.mod.tronco==='W','Edera strappata, Tronco albero');
 let w=0;for(let i=0;i<6;i++)if(partita(1+i%4,smart,camp,'libera').over.win)w++;console.log('spedizioni libere vinte',w+'/6');
 const l=partita(2,rnd,camp,'libera');chk(!l.over.win,'casuale perde la spedizione libera');chk(l.camp.m===13,'la spedizione libera non cambia la missione')}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
