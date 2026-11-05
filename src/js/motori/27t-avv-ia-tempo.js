/* ---- Intelligenza del tempo reale di Cantari di Ventura (piano B, step B4): gli atteggiamenti degli eroi e il comportamento dei nemici. ----
   Regole pure, JSON puro, deterministiche (niente Math.random, orologi o trigonometria). Il cervello guarda lo stato della battaglia a istanti (ATEM, 27s)
   ogni mezzo secondo (OGNI = 5 istanti) e restituisce ordini validi per `ATEM.ordina`: il tempo lo porta chi chiama, come sempre.
   Eroi: ognuno ha un ATTEGGIAMENTO scelto dal giocatore (`imposta`): Assalto (va incontro ai nemici e punta i più deboli), Difesa (resta vicino
   all'alleato più fragile e ferma chi lo minaccia), Supporto (cura e rialza gli alleati, poi colpisce da lontano), Tieni la posizione (non si muove, colpisce chi
   arriva a portata). Decide da solo bersaglio, distanza e uso dei poteri «a volontà» (ricarica `turno`); gli altri poteri e la Concentrazione solo se il
   giocatore ha attivato «Uso automatico» su quel tasto (`automatico`). Un ordine dato dal giocatore a mano vale finché non finisce: l'IA non lo tocca.
   Nemici: il comportamento di BEST (`ia.dist`, `mira`, `fuga`, `arrende`, `apre`, branco) tradotto in decisioni ogni 0,5 s; i capi con poteri ad area li
   ANNUNCIANO: l'ordine fissa cella o direzione (l'area rossa a terra, evento `lancia` con `zona`) e chi sta nell'area ha il tempo del lancio per uscirne.
   Gli eroi guidati dall'IA si scansano dalle aree rosse dei nemici; i mostri no.
   Stato: `s.ia = { v, att:{eroe:atteggiamento}, auto:{eroe:{potere:true}}, mio:{id:{k,t}} (da quando dura l'ordine dell'IA), punto:{eroe:{q,r}} (dove tiene la posizione),
   aperto:{id:true} (chi ha già aperto con `ia.apre`) }`, creato quando serve. API: `pensa(s, {lato})` → { ordini } (guarda soltanto), `applica(s, ordini)`,
   `tick` (le due cose, sullo stato), `avanza(s, n)` (n istanti pensando ogni OGNI), `gioca(s)` (fino alla fine). */
const AIAT=(()=>{
 const AP=typeof APOT!=='undefined'?APOT:require('./27e-avv-poteri.js');
 const ST=typeof ASTA!=='undefined'?ASTA:require('./27d-avv-stati.js');
 const G=typeof AGRI!=='undefined'?AGRI:require('./27g-avv-griglia.js');
 const T=typeof ATEM!=='undefined'?ATEM:require('./27s-avv-tempo.js');
 const ERR=err=>({err}),cl=x=>JSON.parse(JSON.stringify(x));
 const OGNI=5,SCADE=40,PM_CERCA=14,PM_SCANSA=4;       // pensa ogni mezzo secondo; un ordine di potere non eseguito in 4 s si lascia; punti movimento per cercare una cella
 const ATT={assalto:{nome:'Assalto',desc:'Va incontro ai nemici e punta i più deboli.'},
  difesa:{nome:'Difesa',desc:'Resta vicino all\'alleato più fragile e ferma chi lo minaccia.'},
  supporto:{nome:'Supporto',desc:'Cura e rialza gli alleati, poi colpisce da lontano.'},
  posizione:{nome:'Tieni la posizione',desc:'Non si muove: colpisce solo chi arriva a portata.'}};
 const ATT_ID=Object.keys(ATT),PREDEF={chierico:'supporto',bardo:'supporto'};           // l'atteggiamento di partenza (gli altri: Assalto)
 const PREF_CL={mago:'lontana',esploratore:'lontana',chierico:'media',bardo:'media'};     // la distanza preferita degli eroi (come in AIA)
 // ---- stato e scorciatoie ----
 const ia=s=>s.ia||(s.ia={v:1,att:{},auto:{},mio:{},punto:{},aperto:{}});
 const eroe=c=>c.lato==='eroi',pos=c=>({q:c.q,r:c.r}),P=id=>AP.P[id];
 const arrende=c=>!eroe(c)&&!!(c.ia&&c.ia.arrende)&&c.hp<=c.hpMax*.25;          // se ne va subito (ATEM: ordine «arrendi»): nessuno lo sceglie come bersaglio
 const attDi=(s,c)=>eroe(c)?((s.ia&&s.ia.att[c.id])||PREDEF[c.classe]||'assalto'):null;
 const PREF=c=>eroe(c)?PREF_CL[c.classe]||'contatto':(c.ia&&c.ia.dist)||(c.gitt>2?'lontana':'contatto');
 const vedi=(s,a,b)=>G.dist(a,b)<=1||G.vista(s.arena,a,b).visibile;
 const occ=(s,c)=>s.cb.filter(x=>x!==c&&T.inCampo(x)).map(pos);
 const vicino=(l,c)=>l.slice().sort((a,b)=>G.dist(c,a)-G.dist(c,b))[0];
 const kk=a=>[a.t,a.id||'',a.bers||'',a.dir==null?'':a.dir,a.cella?a.cella.q+','+a.cella.r:'',a.a?a.a.q+','+a.a.r:''].join('|');
 const uguale=(o,a)=>!!o&&kk(o)===kk(a);
 // ---- che cosa sono i poteri ----
 const cura=p=>p.eff.some(e=>e.k==='cura');
 const offende=p=>['nemico','nemici'].includes(p.bers)&&p.eff.some(e=>e.k==='danno'||(e.k==='stato'&&ST.STATI[e.id].mal));
 const rinforza=p=>(p.bers==='se'||p.bers==='alleati')&&!cura(p)&&p.eff.some(e=>e.k==='temp'||(e.k==='stato'&&ST.STATI[e.id].ben)||e.k==='conc');
 const curatore=x=>x.poteri.some(i=>{const p=P(i);return p&&cura(p)&&p.bers!=='se'&&p.area!=='se'}),caster=x=>x.classe==='mago'||x.classe==='bardo'||x.ruolo==='incantatore';
 const pronto=(s,c,p)=>(c.ric[p.id]||0)<=s.t&&AP.usiRimasti(c,p)>0;
 // un eroe usa da solo i poteri a volontà; gli altri (cariche, riposi) e la Concentrazione solo con «Uso automatico»; i mostri usano tutto
 const consentito=(s,c,p)=>!eroe(c)||p.ric==='turno'||!!((s.ia&&s.ia.auto[c.id])||{})[p.id];
 const usabili=(s,c,f)=>c.poteri.map(P).filter(p=>p&&p.id!=='attacco'&&p.costo!=='reazione'&&pronto(s,c,p)&&consentito(s,c,p)&&f(p));
 // dove vuole stare chi combatte: portata dell'arma o del potere a volontà più lungo
 const raggio=c=>{let r=c.gitt;for(const id of c.poteri){const p=P(id);if(!p||p.id==='attacco'||p.costo==='reazione'||!offende(p)||p.area==='aura'||(eroe(c)&&p.ric!=='turno'))continue;
  const g=p.gitt==='arma'?c.gitt:p.gitt;if(g>r)r=g}return r};
 // ---- atteggiamenti e uso automatico ----
 function imposta(s0,chi,att,o){const s=o&&o.qui?s0:cl(s0),c=T.trova(s,chi);
  if(!c||!eroe(c))return ERR('Solo gli eroi hanno un atteggiamento');if(!ATT[att])return ERR('Atteggiamento sconosciuto');
  const I=ia(s);I.att[chi]=att;delete I.punto[chi];return{s}}
 function automatico(s0,chi,id,on,o){const s=o&&o.qui?s0:cl(s0),c=T.trova(s,chi),p=P(id);
  if(!c||!eroe(c))return ERR('Solo gli eroi hanno l\'uso automatico');
  if(id!=='conc'&&!(p&&c.poteri.includes(id)&&id!=='attacco'&&p.ric!=='turno'&&p.costo!=='reazione'))return ERR('Questo tasto non ha l\'uso automatico');
  const I=ia(s),m=I.auto[chi]||(I.auto[chi]={});if(on)m[id]=true;else delete m[id];return{s}}
 // ---- il contesto di un momento di pensiero ----
 function contesto(s){const K={s,eroi:[],nem:[],rosse:[]};for(const c of s.cb)if(T.inPiedi(c)&&!arrende(c))(eroe(c)?K.eroi:K.nem).push(c);
  for(const e of s.cb){const z=e.lancio&&T.inPiedi(e)?T.zonaDi(s,e):null;if(z)K.rosse.push({lato:e.lato,fine:e.lancio.fine,celle:new Set(z.map(x=>G.K(x.q,x.r)))})}
  return K}
 // ---- l'area rossa: gli eroi ne escono se fanno in tempo ----
 function scansa(K,c){const s=K.s,qui=G.K(c.q,c.r),R=K.rosse.filter(r=>r.lato!==c.lato),dentro=R.filter(r=>r.celle.has(qui));if(!dentro.length)return null;
  const resta=Math.min(...dentro.map(r=>r.fine))-s.t-1,mov=ST.movEff(c);if(mov<=0||resta<=0)return null;
  const resto=c.mv?Math.ceil(Math.max(0,c.mv.n-c.mv.k)/mov):0;               // il passo in corso va finito: il nuovo ordine parte dopo
  const ris=G.raggiungibili(s.arena,pos(c),PM_SCANSA,{blocca:occ(s,c),ignoraDifficile:!!(c.hook&&c.hook.ignoraDifficile)}),nem=K.nem;let best=null;
  for(const k in ris){const x=ris[k];if(x.da===null||R.some(r=>r.celle.has(k)))continue;if(resto+T.MOV*Math.max(0,x.costo-1)/mov>resta)continue;   // l'ultimo passo deve partire prima del colpo
   const d=nem.length?G.dist(x,vicino(nem,x)):0;if(!best||x.costo<best.costo||(x.costo===best.costo&&d<best.d))best={q:x.q,r:x.r,costo:x.costo,d}}
  return best?{chi:c.id,t:'vai',a:{q:best.q,r:best.r}}:null}
 // ---- fuga e resa dei mostri (ia.fuga: frazione di PF; ia.arrende: sotto il 25%) ----
 function fugaResa(K,c){const x=c.ia||{},o=K.s.ordini[c.id];
  if(arrende(c))return{chi:c.id,t:'arrendi'};
  if(x.fuga>0&&c.hp<=c.hpMax*x.fuga)return o&&o.t==='fuggi'?{gia:true}:{chi:c.id,t:'fuggi'};
  return null}
 // ---- chi colpire ----
 const puntano=(s,c,x)=>s.cb.filter(y=>y!==c&&y.lato===c.lato&&s.ordini[y.id]&&s.ordini[y.id].t==='attacca'&&s.ordini[y.id].bers===x.id).length;
 const protetto=(K,c,amici)=>amici.filter(x=>x!==c).sort((a,b)=>a.hpMax-b.hpMax||(a.id<b.id?-1:1))[0]||null;        // l'alleato con meno PF massimi
 function scegli(K,c,att,avv,amici){const s=K.s,mira=eroe(c)?null:(c.ia&&c.ia.mira)||'vicino',o=s.ordini[c.id],prec=o&&o.t==='attacca'?o.bers:null;let cand=avv;
  if(att==='posizione'){const R=raggio(c);cand=avv.filter(x=>G.dist(c,x)<=Math.max(R,c.gitt)&&vedi(s,c,x));if(!cand.length)return null}
  const pr=att==='difesa'?protetto(K,c,amici):null;let best=null,bv=0;
  for(const x of cand){const d=G.dist(c,x),f=x.hp/x.hpMax;let v;
   if(pr)v=G.dist(pr,x)+.3*d;else if(att==='assalto')v=.6*d+6*f-(curatore(x)||caster(x)?2:0);
   else if(mira==='debole')v=.5*d+8*f;else if(mira==='curatore')v=d-(curatore(x)?4:0);else if(mira==='incantatore')v=d-(caster(x)?4:0);else v=d+.05*f;
   v-=1.2*puntano(s,c,x)+(x.id===prec?2:0)+(c.hook&&c.hook.branco&&s.cb.some(y=>y!==c&&y.lato===c.lato&&T.inPiedi(y)&&G.dist(y,x)<=1)?2:0);
   if(!best||v<bv){best=x;bv=v}}
  return best}
 // ---- cure e rinforzi ----
 // l'ordine di cura che serve adesso con il potere `p` (o null): prima chi sta a terra, poi il più ferito sotto la soglia
 function cure(K,c,p,amici,soglia){const s=K.s,terra=s.cb.filter(x=>x.lato===c.lato&&T.inCampo(x)&&x.hp<=0);
  const feriti=amici.filter(x=>x.hp<=x.hpMax*soglia).sort((a,b)=>a.hp/a.hpMax-b.hp/b.hpMax);
  if(p.area==='se')return c.hp<=c.hpMax*soglia?{chi:c.id,t:'potere',id:p.id}:null;
  if(p.area==='aura'){const n=amici.filter(x=>G.dist(x,c)<=p.raggio&&x.hp<=x.hpMax*(soglia+.15)).length+(['amici'].includes(p.bers)?terra.filter(x=>G.dist(x,c)<=p.raggio).length:0);
   return n>=2||(n>=1&&c.hp<=c.hpMax*soglia)?{chi:c.id,t:'potere',id:p.id}:null}
  if(p.area!=='singolo')return null;
  if(p.bers==='terra')return terra.length?{chi:c.id,t:'potere',id:p.id,bers:vicino(terra,c).id}:null;
  if(p.bers==='amico'&&terra.length)return{chi:c.id,t:'potere',id:p.id,bers:vicino(terra,c).id};
  return feriti.length?{chi:c.id,t:'potere',id:p.id,bers:feriti[0].id}:null}
 function aiuti(K,c,att,amici,avv){const s=K.s,sup=att==='supporto',vic=avv.some(x=>G.dist(x,c)<=3);
  for(const p of usabili(s,c,p=>cura(p)&&p.costo==='azione')){const a=cure(K,c,p,amici,sup?.6:.4);if(a)return a}
  const terra=s.cb.filter(x=>x.lato===c.lato&&T.inCampo(x)&&x.hp<=0);
  if(sup&&terra.length&&!avv.some(x=>G.dist(x,c)<=1)){const t=vicino(terra,c);if(vicino(amici.filter(x=>attDi(s,x)==='supporto'),t)===c)return{chi:c.id,t:'rialza',bers:t.id}}   // rialza chi ha Supporto ed è il più vicino
  if(vic)for(const p of usabili(s,c,p=>rinforza(p)&&p.costo==='azione'))if(!T.forma(s,c,p,{}).err)return{chi:c.id,t:'potere',id:p.id};
  return null}
 // un solo potere bonus alla volta (non toglie nulla all'ordine principale): cura su di sé, rinforzo con i nemici vicini, Concentrazione se attivata
 function rapidi(K,c,amici,avv){const s=K.s,vic=avv.some(x=>G.dist(x,c)<=3);
  for(const p of usabili(s,c,p=>p.costo==='bonus')){
   if(cura(p)){const a=cure(K,c,p,amici,.5);if(a)return[a];continue}
   if(rinforza(p)&&vic&&!T.forma(s,c,p,{}).err)return[{chi:c.id,t:'potere',id:p.id}]}
  const auto=(s.ia&&s.ia.auto[c.id])||{};
  if(eroe(c)&&auto.conc&&c.conc>0&&c.concT<=s.t&&avv.some(x=>G.dist(x,c)<=Math.max(c.gitt,1)+1))return[{chi:c.id,t:'conc'}];
  return[]}
 // ---- poteri offensivi: dove puntarli ----
 function mire(c,p,b,avv){switch(p.area){
  case'singolo':return[{bers:b.id}];case'aura':return[{}];
  case'cerchio':return[b].concat(avv.filter(x=>x!==b).sort((x,y)=>G.dist(c,x)-G.dist(c,y)).slice(0,4)).map(x=>({cella:pos(x)}));   // la cella resta fissa: è l'area rossa
  case'cono':case'linea':return[0,1,2,3,4,5].map(dir=>({dir}));
  default:return[]}}
 // quanto vale togliere uno stato dannoso a chi lo subisce (× il danno che fa in 6 s): la stessa tabella di AIA
 const SV={stordito:1,congelato:.9,accecato:.55,impigliato:.55,rallentato:.35,maledetto:.35,avvelenato:.25,'in-fiamme':.3,provocato:.3};
 function valoreStati(c,p,b,st){let v=0;
  for(const e of p.eff){if(e.k!=='stato'||!ST.STATI[e.id].mal||ST.ha(b,e.id)||(b.immStati||[]).includes(e.id))continue;
   const pr=p.salv?1-st.ps:p.att?st.pc:1,dur=Math.pow(Math.min(e.t||1,3),.6),fa6=AP.stima(b,'attacco',c).atteso*(b.ritmo?60/b.ritmo:1);v+=pr*(SV[e.id]||.2)*dur*fa6}
  return v}
 function offesa(K,c,b,avv){const s=K.s,I=ia(s),base=AP.stima(c,'attacco',b).atteso;let best=null,bv=0;
  for(const p of usabili(s,c,offende))for(const A of mire(c,p,b,avv)){const f=T.forma(s,c,p,A);if(f.err)continue;let v=0;
   for(const x of f.bs){const st=AP.stima(c,p,x);v+=st.atteso+valoreStati(c,p,x,st)}
   if(f.bs.some(x=>x.id===b.id))v*=1.15;                                 // a parità, l'area copre il bersaglio che la mira indica
   if(c.ia&&c.ia.apre===p.id&&!I.aperto[c.id])v*=1.6;
   if(v>bv&&(f.bs.length>=2||v>base*(p.ric==='turno'?1:1.5))){bv=v;best=Object.assign({chi:c.id,t:'potere',id:p.id},A)}}
  return best}
 // chi tira da lontano si ferma dove ha il bersaglio a portata e in vista; se non c'è una cella buona si avvicina comunque
 function avvicina(K,c,b,R){const s=K.s,ris=G.raggiungibili(s.arena,pos(c),PM_CERCA,{blocca:occ(s,c),ignoraDifficile:!!(c.hook&&c.hook.ignoraDifficile)});let best=null;
  for(const k in ris){const x=ris[k];if(x.da===null)continue;const d=G.dist(x,b);if(d>R||!vedi(s,x,b))continue;if(!best||x.costo<best.costo||(x.costo===best.costo&&d>best.d))best={q:x.q,r:x.r,costo:x.costo,d}}
  return best?{chi:c.id,t:'vai',a:{q:best.q,r:best.r}}:{chi:c.id,t:'attacca',bers:b.id}}
 // ---- l'ordine principale ----
 function principale(K,c,att,amici,avv){const s=K.s,I=ia(s),ai=aiuti(K,c,att,amici,avv);if(ai)return ai;
  const b=scegli(K,c,att,avv,amici),R=raggio(c),tira=PREF(c)!=='contatto'&&R>=3;
  if(att==='posizione'){const p0=I.punto[c.id]||(I.punto[c.id]=pos(c));
   if(b){const po=offesa(K,c,b,avv);if(po)return po;return G.dist(c,b)<=c.gitt?{chi:c.id,t:'attacca',bers:b.id}:null}
   return G.dist(c,p0)>0?{chi:c.id,t:'vai',a:p0}:null}
  if(att==='difesa'){const pr=protetto(K,c,amici);
   if(pr){const min=avv.filter(x=>G.dist(x,pr)<=4);
    if(min.length){const t=min.sort((x,y)=>G.dist(pr,x)-G.dist(pr,y))[0],po=offesa(K,c,t,avv);return po||{chi:c.id,t:'attacca',bers:t.id}}
    if(G.dist(c,pr)>2){const ris=G.raggiungibili(s.arena,pos(c),PM_CERCA,{blocca:occ(s,c)});let best=null;const e=vicino(avv,pr);
     for(const k in ris){const x=ris[k];if(x.da===null||G.dist(x,pr)>1)continue;const d=G.dist(x,e);if(!best||x.costo<best.costo||(x.costo===best.costo&&d<best.d))best={q:x.q,r:x.r,costo:x.costo,d}}
     return best?{chi:c.id,t:'vai',a:{q:best.q,r:best.r}}:null}
    const t=vicino(avv.filter(x=>G.dist(c,x)<=c.gitt),c);return t?{chi:c.id,t:'attacca',bers:t.id}:null}}
  if(!b)return null;
  const po=offesa(K,c,b,avv);if(po)return po;
  if(tira){const ok=G.dist(c,b)<=R&&vedi(s,c,b);if(!ok)return avvicina(K,c,b,R);return G.dist(c,b)<=c.gitt?{chi:c.id,t:'attacca',bers:b.id}:null}
  return{chi:c.id,t:'attacca',bers:b.id}}
 function decidi(K,c){const s=K.s,o=s.ordini[c.id],att=attDi(s,c),avv=eroe(c)?K.nem:K.eroi,amici=eroe(c)?K.eroi:K.nem;
  if(!avv.length||c.lancio||s.rapidi[c.id])return[];                    // sta lanciando, ha già un bonus in corso o non c'è nessuno da combattere
  if(eroe(c)){const v=scansa(K,c);if(v)return[v]}else{const f=fugaResa(K,c);if(f)return f.gia?[]:[f]}
  if(o&&['potere','oggetto','rialza'].includes(o.t))return[];           // un lancio o una cura già decisi: si porta a termine
  const ord=rapidi(K,c,amici,avv),m=principale(K,c,att,amici,avv);
  if(m){if(!uguale(o,m))ord.push(m)}else if(o&&o.ia&&(o.t==='attacca'||o.t==='vai'))ord.push({chi:c.id,t:'ferma'});     // niente da fare: non si resta a inseguire un ordine vecchio
  return ord}
 // ---- API ----
 const POTERI=['potere','oggetto','rialza'];
 // pensa(s, { lato }) → { ordini } | { err }: gli ordini di tutti (o di un lato) a questo istante. Non tocca la battaglia: solo la contabilità di `s.ia`.
 function pensa(s,o){o=o||{};if(!s||!Array.isArray(s.cb))return ERR('Stato non valido');if(s.over)return ERR('Battaglia finita');
  const I=ia(s),K=contesto(s),out=[];
  for(const c of s.cb){if(!T.inPiedi(c)||(o.lato&&c.lato!==o.lato))continue;
   const ord=s.ordini[c.id];let m=I.mio[c.id];
   if(!ord||!ord.ia){delete I.mio[c.id];m=null}else if(!m||m.k!==kk(ord))m=I.mio[c.id]={k:kk(ord),t:s.t};
   if(ord&&!ord.ia&&eroe(c)){delete I.punto[c.id];continue}              // un ordine del giocatore vale finché non finisce
   if(m&&POTERI.includes(ord.t)&&s.t-m.t>=SCADE&&!c.lancio){out.push({chi:c.id,t:'ferma'});continue}
   out.push(...decidi(K,c))}
  return{ordini:out}}
 // applica(s, ordini, { qui }) → { s, ev, scartati }: gli ordini passano da ATEM.ordina; si segna quali sono dell'IA (e chi ha già aperto)
 function applica(s0,ordini,o){const s=o&&o.qui?s0:cl(s0),I=ia(s),ev=[];let scartati=0;
  for(const a of ordini){const r=T.ordina(s,Object.assign({ia:true},a),{qui:true});if(r.err){scartati++;continue}ev.push(...r.ev);
   const c=T.trova(s,a.chi);if(c&&c.ia&&c.ia.apre===a.id)I.aperto[a.chi]=true}
  return{s,ev,scartati}}
 function tick(s,o){const p=pensa(s,o);if(p.err)return p;return applica(s,p.ordini,{qui:true})}
 // avanza(s, n, { qui, lato }) → { s, ev, scartati }: n istanti, pensando a ogni mezzo secondo
 function avanza(s0,n,o){o=o||{};if(!s0||!Array.isArray(s0.cb))return ERR('Stato non valido');const s=o.qui?s0:cl(s0),ev=[];let fatti=0,scartati=0;
  while(fatti<n&&!s.over){if(s.t%OGNI===0){const a=tick(s,o);if(a.err)return a;scartati+=a.scartati;ev.push(...a.ev)}
   const k=Math.min(n-fatti,OGNI-(s.t%OGNI)),r=T.passo(s,k,{qui:true});if(r.err)return r;ev.push(...r.ev);fatti+=k}
  return{s,ev,scartati}}
 function gioca(s0,o){o=o||{};const s=o.qui?s0:cl(s0);let scartati=0;
  while(!s.over){const r=avanza(s,OGNI,Object.assign({},o,{qui:true}));if(r.err)return r;scartati+=r.scartati}
  return{s,scartati}}
 return{OGNI,SCADE,ATT,ATT_ID,PREDEF,imposta,automatico,pensa,applica,tick,avanza,gioca,atteggiamento:(s,c)=>attDi(s,c),raggio,PREF}})();
if(typeof module!=='undefined')module.exports=AIAT;
