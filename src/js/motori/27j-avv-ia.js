/* ---- Intelligenza dei combattenti (Cantari di Ventura): sceglie le mosse di mostri ed eroi. Regole pure, deterministica. ----
   Una sola testa per tutti: `prossima(s, opz)` guarda il combattente di turno e restituisce UNA azione valida per `ASCO.act` (muovi, attacca, potere,
   oggetto, scatto, fuggi, arrendi, fine…); `turno` ne gioca un turno intero, `partita` un'intera battaglia. Niente `Math.random`: il rumore dei livelli
   facili viene dal seme dello stato (stessa situazione, stessa scelta).
   Come ragiona (tutto in «punti ferita equivalenti», uguale per i due schieramenti):
   - valore di un'azione = danno atteso (`APOT.stima`, pesato sul bersaglio) + probabilità di abbattere × quanto vale toglierlo + cure (molto di più
     se rialzano qualcuno) + stati (stordito, accecato… × quanto danno fa il bersaglio) + difese e vantaggi per gli alleati;
   - valore di una cella = ciò che si può fare da lì + distanza preferita (`ia.dist`: contatto / media / lontana) + altezza e vista, − superfici
     pericolose, − il rischio in più rispetto alle altre celle (chi ci arriva, con quale copertura), − gli attacchi di opportunità che costa uscire da dov'è;
   - mostri: `ia.mira` (vicino, debole, curatore, incantatore), `ia.fuga` (frazione di PF sotto cui scappano verso l'uscita), `ia.arrende` (si arrendono
     sotto il 25% dei PF), `ia.apre` (il potere con cui aprono).
   Livelli: `racconto` (rumoroso, i mostri non infieriscono su un eroe quasi a terra, poco prudenti), `normale`, `eroica` (la mossa migliore, concentra i colpi sul più
   debole, sfrutta coperture e distanza). `casuale` è il bot che sceglie a caso fra le mosse valide. */
const AIA=(()=>{
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const ST=typeof ASTA!=='undefined'?ASTA:require('./27d-avv-stati.js');
 const AP=typeof APOT!=='undefined'?APOT:require('./27e-avv-poteri.js');
 const G=typeof AGRI!=='undefined'?AGRI:require('./27g-avv-griglia.js');
 const AS=typeof ASCO!=='undefined'?ASCO:require('./27i-avv-scontro.js');
 const inPiedi=AS.inPiedi,trova=AS.trova,pos=c=>({q:c.q,r:c.r});
 const LIVELLI={
  racconto:{rumore:.35,rischio:.3,focus:0,pieta:true,resa:1},
  normale:{rumore:.08,rischio:.7,focus:.5,pieta:false,resa:.5},
  eroica:{rumore:0,rischio:1,focus:1,pieta:false,resa:0}};
 // quanto vale togliere uno stato a chi lo subisce (× danno per turno del bersaglio) e quanto vale darlo a un alleato
 const SV={stordito:1,congelato:.9,accecato:.55,impigliato:.55,rallentato:.35,maledetto:.35,avvelenato:.25,'in-fiamme':.3,provocato:.3};
 const BUFF={benedetto:.3,mirato:.45,protetto:.4,nascosto:.35};
 // ---- contesto di una decisione ----
 const curatore=x=>x.poteri.some(i=>{const p=AP.P[i];return p&&p.eff.some(e=>e.k==='cura')});
 function contesto(s,c,L){return{s,c,L,dpt:new Map(),enem:s.cb.filter(x=>inPiedi(x)&&x.lato!==c.lato),ali:s.cb.filter(x=>inPiedi(x)&&x.lato===c.lato)}}
 // danno atteso per turno di un combattente contro i suoi avversari (il suo potere migliore)
 function dpt(K,x){if(K.dpt.has(x.id))return K.dpt.get(x.id);const opp=K.s.cb.filter(y=>inPiedi(y)&&y.lato!==x.lato).slice(0,4);let best=0;
  if(opp.length)for(const id of x.poteri){const p=AP.P[id];if(!p||p.costo==='reazione'||!p.eff.some(e=>e.k==='danno'))continue;
   let t=0;for(const y of opp)t+=AP.stima(x,p,y,{}).atteso;t/=opp.length;if(t>best)best=t}
  K.dpt.set(x.id,best);return best}
 function peso(K,c,b){const f=1-b.hp/b.hpMax,m=c.ia&&c.ia.mira;let w=1+K.L.focus*f;
  if(m==='debole')w*=1+.8*f;else if(m==='curatore'&&curatore(b))w*=1.5;else if(m==='incantatore'&&(b.classe==='mago'||b.classe==='bardo'))w*=1.4;
  return w}
 // ---- valore di un'azione (da un'anteprima di ASCO) ----
 function valoreStati(K,c,p,x,b){let v=0;
  for(const e of p.eff){
   if(e.k==='stato'){const dur=Math.pow(Math.min(e.t||1,3),.6);if(ST.ha(b,e.id))continue;
    if(b.lato!==c.lato){if((b.immStati||[]).includes(e.id))continue;let pr=p.salv?1-x.ps:p.att?x.pc:1;if(e.salv)pr*=1-DAD.prob((b.salv||{})[e.salv]||0,c.cd);v+=pr*(SV[e.id]||.2)*dur*dpt(K,b)}
    else v+=(BUFF[e.id]||0)*dur*Math.max(dpt(K,b),1)}
   else if(e.k==='temp'&&b.lato===c.lato)v+=e.n*.35;
   else if(e.k==='rimuovi'&&b.lato===c.lato){for(const id of e.stati)if(ST.ha(b,id))v+=2.5}
   else if(e.k==='conc'&&b.lato===c.lato)v+=.6}
  return v}
 function valore(K,c,p,an){let v=0;
  for(const x of an.bersagli){const b=trova(K.s,x.bers);if(!b)continue;let vb=0;
   if(b.lato!==c.lato){const hpE=b.hp+(b.temp||0),quanto=x.dannoColpo*(p.multi||1);let pk=0;
    if(quanto>=hpE)pk=p.salv?(1-x.ps)+(p.meta&&quanto/2>=hpE?x.ps:0):1-Math.pow(1-x.pc,p.multi||1);
    vb=x.atteso*peso(K,c,b)+pk*(5+2.5*dpt(K,b))}
   else if(x.cura>0){const manca=Math.max(0,b.hpMax-b.hp);vb=Math.min(x.cura,manca)*(.5+.8*(1-b.hp/b.hpMax));if(b.hp<=0)vb+=10+2.5*dpt(K,b)}
   vb+=valoreStati(K,c,p,x,b);
   if(K.L.pieta&&c.lato==='nemici'&&b.lato!==c.lato&&b.hp<=b.hpMax*.25)vb*=.1;      // livello racconto: i mostri non infieriscono su un eroe quasi a terra
   v+=vb}
  return v}
 // tutte le azioni possibili adesso (nello stato `s`, anche ipotetico) con il loro valore
 function opzioni(K,c,s,m){const out=[],P=AP.P,add=(a,p,an,f)=>{if(!an||an.err||!an.bersagli||!an.bersagli.length)return;out.push({a,v:valore(K,c,p,an)*(f||1)})};
  K.s=s;
  for(const x of m.attacchi)add({t:'attacca',bers:x.bers},P.attacco,{bersagli:[{bers:x.bers,ps:null,pc:x.pc,dannoColpo:x.dannoColpo,atteso:x.atteso,cura:0}]});
  for(const o of m.poteri){const p=P[o.id],f=c.ia&&c.ia.apre===o.id?1.6:1;
   if(o.centri)for(const ce of o.centri.slice().sort((a,b)=>b.colpiti.length-a.colpiti.length).slice(0,5)){const a={t:'potere',id:o.id,cella:{q:ce.q,r:ce.r}};add(a,p,AS.anteprima(s,a),f)}
   else if(o.direzioni)for(const d of o.direzioni){const a={t:'potere',id:o.id,dir:d.dir};add(a,p,AS.anteprima(s,a),f)}
   else if(p.area==='singolo')for(const id of o.bersagli.slice(0,6)){const a={t:'potere',id:o.id,bers:id};add(a,p,AS.anteprima(s,a),f)}
   else{const a={t:'potere',id:o.id};add(a,p,AS.anteprima(s,a),f)}}
  for(const o of m.oggetti){const p=AP.oggetto(o.id);
   if(o.centri)for(const ce of o.centri.slice().sort((a,b)=>b.colpiti.length-a.colpiti.length).slice(0,3)){const a={t:'oggetto',id:o.id,cella:{q:ce.q,r:ce.r}};add(a,p,AS.anteprima(s,a),.8)}
   else if(p.area==='singolo')for(const id of o.bersagli.slice(0,6)){const a={t:'oggetto',id:o.id,bers:id};add(a,p,AS.anteprima(s,a),.8)}
   else{const a={t:'oggetto',id:o.id};add(a,p,AS.anteprima(s,a),.8)}}
  if(m.bersagli.rialza)for(const id of m.bersagli.rialza){const b=trova(s,id);out.push({a:{t:'rialza',bers:id},v:.6*(8+2.5*dpt(K,b))})}
  if(m.bersagli.aiuta&&K.enem.length)for(const id of m.bersagli.aiuta){const b=trova(s,id);out.push({a:{t:'aiuta',bers:id},v:.3*dpt(K,b)})}
  return out}
 // ---- valore di una cella ----
 const PREF=c=>c.ia&&c.ia.dist||({mago:'lontana',esploratore:'lontana',chierico:'media',bardo:'media'})[c.classe]||'contatto';
 function posizione(K,c,d){const s=K.s;let dmin=99;for(const e of K.enem){const x=G.dist(d,e);if(x<dmin)dmin=x}if(dmin===99)return 0;
  const pr=PREF(c);let h=0;
  if(pr==='contatto')h+=dmin===1?2.5:-.35*(dmin-1);else if(pr==='media')h+=dmin===1?-2:(dmin>=3&&dmin<=5?1.5:-.25*Math.abs(dmin-4));else h+=dmin===1?-3:(dmin>=4?1.5-.1*Math.max(0,dmin-7):-.4*(4-dmin));
  const alt=G.alt(s.arena,d);if(K.enem.some(e=>G.alt(s.arena,e)<alt))h+=1.2;
  const sp=G.sup(s.arena,d);if(sp)h-=({fuoco:5,veleno:3,ghiaccio:1.5,acqua:.5})[sp]||0;
  if(pr!=='contatto'){let v=0;for(const e of K.enem.slice(0,3))if(G.dist(d,e)<=(c.gittaLunga||Math.max(c.gitt,6))&&G.vista(s.arena,d,e).visibile)v++;h+=Math.min(v,2)*.8}
  return h}
 // danno che si aspetta di subire stando in `d` (chi ci arriva, con la copertura che ha chi tira)
 function rischio(K,c,d){let r=0;
  for(const e of K.enem){const reach=ST.movEff(e)+Math.max(e.gitt,1)+1;if(G.dist(e,d)>reach)continue;const v=G.vista(K.s.arena,e,d);if(e.gitt>2&&!v.visibile)continue;
   const share=Math.max(1,K.ali.filter(y=>G.dist(e,y)<=reach).length);r+=AP.stima(e,'attacco',c,{ca:v.ca||0}).atteso*1.2/share}
  return r}
 // attacchi di opportunità che costa lasciare la cella dove si è per andare in `d`
 function opportunita(K,c,d){if(K.s.turno.disimpegno)return 0;let r=0;
  for(const e of K.enem)if(e.rea&&e.gitt<=2&&ST.puoAgire(e)&&G.dist(e,c)<=e.gitt&&G.dist(e,d)>e.gitt)r+=AP.stima(e,'attacco',c,{}).atteso;return r}
 // lo stesso stato con il combattente spostato in `d` (per guardare che cosa potrebbe fare da lì): niente copia profonda
 function se(s,c,d){const f=Object.assign({},c,{q:d.q,r:d.r});return Object.assign({},s,{cb:s.cb.map(x=>x===c?f:x),turno:Object.assign({},s.turno,{pm:0,mosso:true})})}
 const migliore=ops=>ops.reduce((b,o)=>!b||o.v>b.v?o:b,null);
 // ---- fuga e resa dei mostri ----
 function fugaResa(s,c,m,L,rnd){if(c.lato!=='nemici')return null;
  if(m.azioni.includes('arrendi')&&rnd()<L.resa)return{t:'arrendi'};
  if(c.ia&&c.ia.fuga>0&&c.hp<=c.hpMax*c.ia.fuga){if(m.azioni.includes('fuggi'))return{t:'fuggi'};
   const us=AS.uscite(s,'nemici'),dU=x=>Math.min(...us.map(u=>G.dist(x,u))),mio=dU(c);let best=null;
   for(const x of m.muovi){const d=dU(x);if(d<mio&&(!best||d<best.d||(d===best.d&&x.costo<best.costo)))best={d,costo:x.costo,q:x.q,r:x.r}}
   if(best)return{t:'muovi',a:{q:best.q,r:best.r}}}
  return null}
 // ---- la prossima azione ----
 function prossima(s,opz){opz=opz||{};const c=AS.attore(s);if(!c)return null;const m=AS.mosseValide(s);if(!m)return{t:'fine'};
  if(!opz.livello||opz.livello==='casuale')return casuale(s,opz.rnd||rngDi(s));
  const L=LIVELLI[opz.livello]||LIVELLI.normale,rnd=rngDi(s);
  if(!(m.attacchi.length||m.poteri.length||m.oggetti.length||m.muovi.length||m.azioni.length>1||m.bersagli.rialza))return{t:'fine'};
  const fr=fugaResa(s,c,m,L,rnd);if(fr)return fr;
  const K=contesto(s,c,L);if(!K.enem.length)return{t:'fine'};
  const rumore=o=>o.v*(1+L.rumore*(rnd()*2-1));
  const subito=opzioni(K,c,s,m).map(o=>({a:o.a,v:rumore(o)}));
  // chi è già a contatto di un nemico e combatte da vicino resta dov'è
  const impegnato=PREF(c)==='contatto'&&m.attacchi.some(x=>x.dist<=1);
  let cella=null;
  if(!impegnato&&m.muovi.length){const u=1+(1-c.hp/c.hpMax)*1.5;
   const grezzi=m.muovi.map(x=>{let dmin=99;for(const e of K.enem){const d=G.dist(x,e);if(d<dmin)dmin=d}return{x,dmin}}).sort((a,b)=>PREF(c)==='contatto'?a.dmin-b.dmin:Math.abs(a.dmin-4)-Math.abs(b.dmin-4)).slice(0,8);
   const qui0=Object.assign(pos(c),{costo:0}),cand=[qui0].concat(grezzi.map(g=>g.x));
   const rs=cand.map(x=>rischio(K,c,x)),minR=Math.min(...rs);
   const val=cand.map((x,i)=>({x,q:posizione(K,c,x)-L.rischio*u*(rs[i]-minR)-(i?opportunita(K,c,x):0)-.04*(x.costo||0)}));
   const top=val.slice().sort((a,b)=>b.q-a.q).slice(0,3);if(!top.some(t=>t.x===qui0))top.push(val[0]);
   let bt=null,qui=null;
   for(const t of top){let bs;if(t.x===qui0)bs=migliore(subito);else{const sx=se(s,c,t.x);bs=migliore(opzioni(K,c,sx,AS.mosseValide(sx)).map(o=>({a:o.a,v:rumore(o)})))}
    t.tot=(bs?bs.v:0)+t.q;if(t.x===qui0)qui=t;if(!bt||t.tot>bt.tot)bt=t}
   if(bt!==qui&&bt.tot>qui.tot+.5)cella=bt.x}
  K.s=s;
  if(cella)return{t:'muovi',a:{q:cella.q,r:cella.r}};
  const b=migliore(subito);
  if(b&&b.v>.3)return b.a;
  // niente di utile da fare: si avvicina di corsa, altrimenti si chiude il turno
  const vicino=Math.min(...K.enem.map(e=>G.dist(e,c)));
  if(m.azioni.includes('scatto')&&vicino>(PREF(c)==='contatto'?1:Math.max(c.gitt,6))+1)return{t:'scatto'};
  return{t:'fine'}}
 // generatore dallo stato senza consumarlo: stessa situazione, stesso rumore
 const rngDi=s=>{const h={rng:DAD.semina((s.rng^Math.imul((s.evn||1)+1,0x9E3779B1))>>>0)};return DAD.gen(h)};
 // bot casuale: una mossa valida a caso (smette di agire con una certa probabilità, così il turno finisce)
 function casuale(s,rnd){const m=AS.mosseValide(s);if(!m)return{t:'fine'};const k=rnd(),pick=l=>l[Math.floor(rnd()*l.length)];
  if(m.poteri.length&&k<.2){const o=pick(m.poteri),a={t:'potere',id:o.id};if(o.centri){const c=pick(o.centri);a.cella={q:c.q,r:c.r}}else if(o.direzioni)a.dir=pick(o.direzioni).dir;else if(AP.P[o.id].area==='singolo')a.bers=pick(o.bersagli);return a}
  if(m.oggetti.length&&k<.28){const o=pick(m.oggetti),a={t:'oggetto',id:o.id};if(o.centri){const c=pick(o.centri);a.cella={q:c.q,r:c.r}}else if(AP.oggetto(o.id).area==='singolo')a.bers=pick(o.bersagli);return a}
  if(m.attacchi.length&&k<.55)return{t:'attacca',bers:pick(m.attacchi).bers};
  if(m.muovi.length&&k<.8){const x=pick(m.muovi);return{t:'muovi',a:{q:x.q,r:x.r}}}
  return{t:'fine'}}
 // ---- turno e battaglia interi ----
 const livelloDi=(opz,c)=>(opz&&(opz[c.lato]||opz.livello))||'normale';
 // gioca il turno di chi è di turno; se un eroe deve scegliere una reazione e `opz.pause` è 'ritorna' si ferma con { pausa, azione }, altrimenti risponde da solo
 function turno(s,opz){opz=opz||{};const c0=AS.attore(s);if(!c0)return{s,ev:[],azioni:[]};const id=c0.id,ev=[],azioni=[];let x=s;
  for(let n=0;n<16&&!x.over;n++){const a0=AS.attore(x);if(!a0||a0.id!==id)break;
   const a=prossima(x,{livello:livelloDi(opz,a0)});let dec=[],r=AS.act(x,a);
   for(let g=0;r.pausa&&g<6;g++){if(opz.pause==='ritorna')return{s:x,ev,azioni,pausa:r.pausa,azione:Object.assign({},a,{dec})};dec=dec.concat([r.pausa.opzioni[0].id]);r=AS.act(x,Object.assign({},a,{dec}))}
   if(r.err||r.pausa)r=AS.act(x,{t:'fine'});          // rete di sicurezza: non succede, ma il turno si chiude comunque
   ev.push(...r.ev);azioni.push(a);x=r.s;if(a.t==='fine')break}
  const dopo=AS.attore(x);if(!x.over&&dopo&&dopo.id===id){const r=AS.act(x,{t:'fine'});ev.push(...r.ev);azioni.push({t:'fine'});x=r.s}
  return{s:x,ev,azioni}}
 // gioca tutta la battaglia: opz = { eroi:'eroica'|…, nemici:'normale'|… } (o `livello` per tutti)
 function partita(s,opz){let x=s;for(let n=0;n<2000&&!x.over;n++)x=turno(x,opz).s;return x}
 // scorciatoie: il bot che gioca la compagnia al meglio e quello che sceglie a caso
 const botBravo=(s,opz)=>turno(s,Object.assign({eroi:'eroica',nemici:'normale'},opz||{}));
 const botCasuale=(s,opz)=>turno(s,Object.assign({eroi:'casuale',nemici:'normale'},opz||{}));
 return{LIVELLI,prossima,casuale,turno,partita,botBravo,botCasuale}})();
if(typeof module!=='undefined')module.exports=AIA;
