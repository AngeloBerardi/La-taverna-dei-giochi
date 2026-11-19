/* ---- Compagnia di ventura, strategia prima della battaglia (passo 32). Dopo 28ke, prima di 28l. ----
   Si attacca ai ganci `anteprima`, `scelta`, `scheda`, `incontro` e `ora`; agisce solo con `VDAT.ACCESO.consiglio` (rilascio 3).
   Esplorazione E (capacità `esplora` della compagnia) contro rango N del nemico: E>N chi hai davanti si vede per intero (numeri esatti, dottrina, ondate),
   E=N a spanne (numeri a 10), E<N «circa N uomini» e basta. Le scelte (`strat:campo`, `strat:alba`, `strat:notte`, `strat:imboscata`, `strat:fortifica`,
   `strat:retro:TIPO`) stanno nell'anteprima, grigie col perché se non si possono; la scelta fatta vive in `s.incontro.strat` (facoltativo):
   {camp: terreno scelto, notte:1, imb:1, fort:1, alba:1, ia:'imb'|'notte'} e la scheda della battaglia la legge. `tu.marcia` = {o:[0/1 per ogni ora, al massimo 24], x, y}.
   Motore puro: niente Math.random, Date.now, pow/exp/log né trigonometria. */
Object.assign(VDAT,{STRAT:{
 MARCIA_ORE:14,MARCIA_FINESTRA:24,FATICA_MARCIA:25,       // più di 14 ore su 24 in marcia: si arriva stanchi (fatica iniziale 25)
 GIT_NOTTE:.6,RANGO_NOTTE:2,FATICA_NOTTE:30,              // di notte la gittata dei tiratori scende al 60%; un nemico di rango ≤ 2 parte in disordine (fatica 30, tutto al centro)
 ALBA:6,PARTE:.5,PARTE_RANGO:1,RINF_D:3.5,RINF_MAX:2,TREGUA_ALBA:240,   // l'alba è alle 6; chi ha rango ≤ 1 se ne va una volta su due; rinforzi entro 3,5 caselle, al massimo due compagnie
 FORT_ORE:1,FORT_VIVERI:10,PALI_RY:12,PALI_Q:.5,          // fortificarsi costa un'ora e 10 razioni; i pali coprono la larghezza del campo e 12 passi a cavallo della linea dei fanti (la linea sta 20 passi dal bordo)
 IMB_MOR:-10,NOTTE_MOR:-10,IMB_MOD:.85,                   // morale iniziale di chi cade nell'imboscata o nel disordine; la colonna colta di sorpresa combatte all'85% (attacco e difesa)
 RETRO_QUOTA:3,RETRO_MOR:-3,RETRO_FERMO:150,RETRO_TREGUA:300,RETRO_MAX:3,   // la retroguardia affronta un terzo del nemico; chi scappa perde 3 di morale
 IA_RANGO:3}});                                           // da questo rango il nemico sceglie il momento e il luogo quando attacca lui
Object.assign(VEN,(()=>{const{D,TU,abil,cella,dist,L,ostile,part,rnd,togliUomini}=VEN._,S=VDAT.STRAT;
 const attivo=()=>!!VDAT.ACCESO.consiglio;
 const TERR={1:'pianura',2:'bosco',3:'colline',4:'monti'},NUM={2:'due',3:'tre',4:'quattro',5:'cinque',6:'sei',7:'sette',8:'otto',9:'nove',10:'dieci'};
 const f10=n=>n>0?Math.max(10,Math.round(n/10)*10):0;
 // ---------- la marcia delle ultime 24 ore ----------
 const oreMarcia=s=>{const m=TU(s).marcia;return m?m.o.reduce((a,x)=>a+x,0):0};
 const fermo=s=>{const m=TU(s).marcia;return !m||!m.o.length||m.o[m.o.length-1]===0};
 VEN.aggancia('ora',s=>{if(!attivo())return;const tu=TU(s),m=tu.marcia||(tu.marcia={o:[],x:tu.x,y:tu.y});
  m.o.push(Math.abs(tu.x-m.x)+Math.abs(tu.y-m.y)>.05?1:0);if(m.o.length>S.MARCIA_FINESTRA)m.o.shift();m.x=tu.x;m.y=tu.y});
 // ---------- il contesto di un incontro con compagnie in campo aperto ----------
 const rangoMax=(s,nem)=>nem.reduce((m,p)=>Math.max(m,VEN.rango(s,p).r),0);
 function ctx(s){const inc=s.incontro;if(!inc||inc.tipo!=='nemico')return null;const v=VEN.schieramenti(s);if(!v.nem.length||v.luogo)return null;
  return{inc,v,tu:TU(s),E:abil(s,'esplora'),N:rangoMax(s,v.nem),st:inc.strat||{}}}
 const terrBase=s=>{const M=VEN.mappaDi(s),tu=TU(s);return M.T[cella(M,tu.x,tu.y)]};
 const terrEff=(s,st)=>st.camp||terrBase(s);
 // il terreno alternativo: estratto tra quelli delle caselle vicine (stesso incontro → stessa scelta)
 function altTerreno(s,inc){const M=VEN.mappaDi(s),tu=TU(s),base=terrBase(s),v=[];
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const t=M.T[cella(M,tu.x+dx,tu.y+dy)];if(t>=1&&t<=3&&t!==base&&!v.includes(t))v.push(t)}
  if(!v.length)return 0;v.sort((a,b)=>a-b);const r=ADADI.gen({rng:ADADI.semina((s.seme^Math.imul(s.t+1,2654435761)^Math.imul((inc.pid[0]|0)+1,40503))>>>0)});return v[Math.floor(r()*v.length)]}
 const razioni=s=>VEN.razioni(TU(s));
 // ---------- cosa si può fare ----------
 // restituisce {ok,perche}; `perche` è il testo grigio sotto il bottone
 function puo(s,c,k,x){const{inc,st,E,N}=c,loro=inc.da==='loro';
  if(k==='campo'){if(st.ia)return{ok:false,perche:'Vi hanno colti di sorpresa'};if(!(E>=N||(loro&&fermo(s))))return{ok:false,perche:loro?'Eravate in marcia: niente scelta del campo':'Non conoscete abbastanza il luogo'};
   if(!(st.camp||altTerreno(s,inc)))return{ok:false,perche:'Il terreno attorno è tutto uguale'};return{ok:true}}
  if(k==='alba'){if(st.alba)return{ok:false,perche:'Avete già aspettato fino all\'alba'};return{ok:true}}
  if(k==='notte'){if(!VEN.notte(s))return{ok:false,perche:'Non è notte'};return{ok:true}}
  if(k==='imboscata'){const t=terrEff(s,st);if(st.ia)return{ok:false,perche:'Vi hanno colti di sorpresa'};if(t!==2&&t!==3)return{ok:false,perche:'Serve un bosco o una collina'};
   if(!loro)return{ok:false,perche:'Il nemico non viene verso di voi'};if(E<N+1)return{ok:false,perche:'Non conoscete abbastanza i loro movimenti'};return{ok:true}}
  if(k==='fortifica'){if(st.fort)return{ok:false,perche:'I pali sono già piantati'};if(!loro)return{ok:false,perche:'Servono nemici che vengano da voi'};
   if(razioni(s)<S.FORT_VIVERI)return{ok:false,perche:'Servono '+S.FORT_VIVERI+' razioni di viveri'};return{ok:true}}
  if(k==='retro'){const e=x&&c.tu.tr.find(e=>e.t===x&&!D.TR[e.t].compagno);if(!e||e.n-(e.f||0)<=0)return{ok:false,perche:'Nessuno di loro è in grado di restare'};return{ok:true}}
  return{ok:false,perche:'Scelta non valida'}}
 // ---------- l'anteprima: quanto si vede, le perdite attese, le scelte ----------
 const frase=fr=>{if(fr<.04)return'perdite lievi';const k=Math.round(1/fr);return'perderete circa un uomo su '+(NUM[k]||k)};
 VEN.aggancia('anteprima',(s,a)=>{if(!attivo()||!a.loro||!s.incontro)return;const inc=s.incontro;if(inc.tipo!=='nemico'&&inc.tipo!=='assalto')return;
  const c=ctx(s),v=VEN.schieramenti(s),tu=TU(s);
  if(oreMarcia(s)>S.MARCIA_ORE)a.avvisi.push('La compagnia ha marciato a lungo: arriva stanca alla battaglia.');
  if(c&&c.st.ia)a.avvisi.push(c.st.ia==='imb'?'Ti hanno colto di sorpresa: erano appostati nel bosco.':'Ti hanno colto di sorpresa: attaccano di notte, mentre la compagnia è stanca.');
  // quanto si vede del nemico (solo tra compagnie in campo aperto)
  let vista=1;if(c){const{E,N}=c,tot=a.loro.f+a.loro.t+a.loro.c;
   if(E>N){a.loro.vista='esatta';a.loro.ondate=N>=3?2:0}
   else if(E===N){a.loro.vista='a spanne';a.loro.f=f10(a.loro.f);a.loro.t=f10(a.loro.t);a.loro.c=f10(a.loro.c);delete a.loro.ondate;vista=tot?(a.loro.f+a.loro.t+a.loro.c)/tot:1}
   else{a.loro.vista='vaga';a.loro.stima='circa '+f10(tot)+' uomini';vista=tot?f10(tot)/tot:1;a.loro.f=a.loro.t=a.loro.c=0;delete a.loro.ondate}}   // la dottrina resta (ma la vista legge `vista`): test_ven_p47 la pretende anche con E<N}
  // «Risolvi» dice cosa costa, con la stessa vista del nemico
  const fn=v.nem.reduce((x,p)=>x+VEN.forza(p),0)+(v.luogo?VEN.forzaTr(v.luogo.g)*(VEN.MURA[v.luogo.tipo]?VEN.P.MURA:1):0),fa=VEN.forza(tu)+v.all.reduce((x,p)=>x+VEN.forza(p),0),fs=fn*vista;
  for(const x of a.scelte)if(x.k==='auto')x.info='Più rapido, meno controllo: '+frase(.5*fs/Math.max(1,fa+fs))+'.';
  if(!c)return;
  // le scelte strategiche
  const{st,inc:ic}=c,add=(k,tx,info,x)=>{const p=puo(s,c,k,x);a.scelte.push({k:'strat:'+(x?k+':'+x:k),tx,info,ok:p.ok,perche:p.ok?undefined:p.perche})};
  const alt=st.camp?terrBase(s):altTerreno(s,ic);
  add('campo',st.camp?'Torna a '+TERR[alt]:'Scegli il campo: '+(TERR[alt]||'altro'),st.camp?'Si combatte dove vi trovate.':'Sposti lo scontro: ci si batte su '+(TERR[alt]||'altro terreno')+'.');
  add('alba','Aspetta l\'alba','Passano le ore: il nemico può andarsene o ricevere rinforzi.');
  add('notte',st.notte?'Rinuncia all\'attacco notturno':'Attacca nel buio',st.notte?'Si combatte come sempre.':'Gittata dei tiratori ridotta per tutti; i nemici meno accorti sono in disordine.');
  add('imboscata',st.imb?'Rinuncia all\'imboscata':'Tendi un\'imboscata',st.imb?'Si combatte come sempre.':'Vi appostate: il nemico arriva in colonna e non si aspetta nulla.');
  add('fortifica',st.fort?'Pali piantati':'Pianta i pali','Costa un\'ora e '+S.FORT_VIVERI+' razioni: davanti alla linea i cavalli rallentano e la carica non riesce.');
  const tipi=tu.tr.filter(e=>!D.TR[e.t].compagno&&e.n-(e.f||0)>0).sort((p,q)=>(q.n-(q.f||0))-(p.n-(p.f||0))||(p.t<q.t?-1:1)).slice(0,S.RETRO_MAX);
  for(const e of tipi)add('retro','Retroguardia: '+(D.TR[e.t].nome||e.t),(e.n-(e.f||0))+' restano a coprire la fuga contro un terzo dei nemici; non tornano se perdono.',e.t)});
 // ---------- il tempo che passa con il nemico fermo ----------
 // fa passare `min` minuti senza che l'incontro si riapra da solo; restituisce true se l'incontro è ancora lo stesso
 function passa(s,min){const inc=s.incontro,tu=TU(s),tregua=s.tregua,fino=s.t+min,nem=VEN.schieramenti(s).nem;
  s.incontro=null;s.tregua=Math.max(tregua|0,fino+1);tu.ord={t:'aspetta',fino};tu.via=[];for(const p of nem){p.fermo=fino;p.via=[]}
  VEN.passo(s,min);
  s.tregua=tregua;if(tu.ord&&tu.ord.t==='aspetta'&&s.t>=tu.ord.fino)tu.ord=null;for(const p of nem)if(p.fermo&&s.t>=p.fermo)p.fermo=0;
  if(s.incontro)return false;s.incontro=inc;return true}
 // ---------- le scelte ----------
 function alba(s,c){const t=s.t%VEN.P.GIORNO,a=S.ALBA*60,min=(t<a?a-t:VEN.P.GIORNO-t+a),fino=s.t+min,inc=c.inc,nem=c.v.nem,r=rnd(s);
  if(!passa(s,min))return{s};
  if(s.t<fino){L(s,'Qualcosa interrompe l\'attesa: l\'alba è ancora lontana.');return{s}}   // una scena del racconto ha fermato il tempo: si riprova dopo
  c.inc.strat=Object.assign(inc.strat||{},{alba:1});delete inc.strat.notte;
  if(c.N<=S.PARTE_RANGO&&r()<S.PARTE){for(const p of nem){p.fermo=s.t+120;p.ia.st='giro';p.via=[]}s.tregua=s.t+S.TREGUA_ALBA;s.incontro=null;L(s,'All\'alba il nemico ha levato il campo.');return{s}}
  const vicini=s.p.filter(q=>q.id&&!nem.includes(q)&&!inc.pid.includes(q.id)&&!(inc.all||[]).includes(q.id)&&q.dentro<0&&!q.sc&&ostile(s,q,c.tu)&&dist(q,nem[0])<S.RINF_D).slice(0,S.RINF_MAX);
  for(const q of vicini){inc.pid.push(q.id);q.via=[]}
  L(s,vicini.length?'All\'alba altra gente si è unita al nemico.':'Alba: il nemico è ancora là.',vicini.length?'male':'');return{s}}
 function fortifica(s,c){const tu=c.tu;let serve=S.FORT_VIVERI;for(const m of Object.keys(tu.merci))if(D.MERCI[m].cibo)while(serve>0&&tu.merci[m]>0){tu.merci[m]--;serve--}
  c.inc.strat=Object.assign(c.inc.strat||{},{fort:1});L(s,'Piantate i pali davanti alla linea: un\'ora di lavoro.');passa(s,S.FORT_ORE*60);return{s}}
 function retro(s,c,tipo){const{inc,v,tu}=c,e=tu.tr.find(e=>e.t===tipo),n=e.n-(e.f||0),b=[];
  for(const p of v.nem)for(const x of p.tr){const q=x.n-(x.f||0),k=q<2?0:Math.max(1,Math.round(q/S.RETRO_QUOTA));if(k>0)b.push({p:p.id,t:x.t,n:k})}
  const sc=VEN.campo(s),riep=VCAM.risolvi({seme:sc.seme,terreno:sc.terreno,bioma:sc.bioma,notte:sc.notte,ora:sc.ora,scena:sc.scena,a:[{p:0,t:tipo,n}],b,faza:'tu',fazb:v.nem[0].faz,morale:tu.mor});
  let morti=0;for(const x of riep.cad||[]){if(x.p===0){morti+=togliUomini(tu.tr,x.t,x.n)}else{const q=part(s,x.p);if(q)togliUomini(q.tr,x.t,x.n)}}
  const persi=riep.vince==='a'?0:togliUomini(tu.tr,tipo,n-morti),nome=(D.TR[tipo].nome||tipo).toLowerCase();
  for(const p of v.nem){p.fermo=s.t+S.RETRO_FERMO;p.ia.st='giro';p.via=[]}s.tregua=s.t+S.RETRO_TREGUA;tu.mor=Math.max(0,tu.mor+S.RETRO_MOR);s.incontro=null;
  L(s,riep.vince==='a'?'La retroguardia ('+nome+') tiene il passo e vi raggiunge: '+morti+' caduti.':'La retroguardia ('+nome+') è travolta: '+(morti+persi)+' uomini non torneranno.',riep.vince==='a'?'':'male');
  VEN.reagisci(s,'fuga');return{s}}
 VEN.aggancia('scelta',(s,v)=>{if(typeof v!=='string'||v.slice(0,6)!=='strat:'||!attivo())return;if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};
  const c=ctx(s);if(!c)return{err:'Qui non c\'è nulla da preparare'};const[k,x]=v.slice(6).split(':'),p=puo(s,c,k,x);if(!p.ok)return{err:p.perche+'.'};
  const st=c.inc.strat=c.inc.strat||{};
  if(k==='campo'){if(st.camp)delete st.camp;else st.camp=altTerreno(s,c.inc);const t=terrEff(s,st);if(t!==2&&t!==3)delete st.imb;return{s}}
  if(k==='notte'){if(st.notte)delete st.notte;else st.notte=1;return{s}}
  if(k==='imboscata'){if(st.imb)delete st.imb;else st.imb=1;return{s}}
  if(k==='alba')return alba(s,c);if(k==='fortifica')return fortifica(s,c);if(k==='retro')return retro(s,c,x);
  return{err:'Scelta non valida'}});
 // ---------- il nemico accorto sceglie quando attacca lui ----------
 VEN.aggancia('incontro',(s,inc)=>{if(!attivo()||inc.tipo!=='nemico'||inc.da!=='loro')return;const c=ctx(s);if(!c||c.N<S.IA_RANGO)return;
  if(terrBase(s)===2&&c.E<c.N)inc.strat=Object.assign(inc.strat||{},{ia:'imb'});
  else if(VEN.notte(s)&&oreMarcia(s)>S.MARCIA_ORE)inc.strat=Object.assign(inc.strat||{},{ia:'notte'})});
 // ---------- la scheda della battaglia ----------
 // le zone del campo senza truppe (la scheda, se ne porta, le sostituisce del tutto): servono per aggiungere i pali
 function zoneCon(sc){const mini={seme:sc.seme,terreno:sc.terreno,bioma:sc.bioma,scena:sc.scena,W:sc.W,H:sc.H,tipo:sc.tipo,a:[],b:[],esplora:sc.esplora},m=VCAM.nuovo(mini);
  const cx=VCAM.settori(m,'a').find(z=>z.id==='cx'),zone=Array.isArray(sc.zone)?sc.zone.map(z=>Object.assign({},z)):m.zone.map(z=>Object.assign({},z));
  if(cx)zone.push({k:'pali',x:Math.round((cx.x0+cx.x1)/2*10)/10,y:Math.round((m.H-22)*10)/10,rx:Math.round(m.W*S.PALI_Q*10)/10,ry:S.PALI_RY});return zone}
 VEN.aggancia('scheda',(s,sc)=>{if(!attivo()||!s.incontro)return;const inc=s.incontro;if(inc.tipo!=='nemico'&&inc.tipo!=='assalto'&&inc.tipo!=='mischia')return;
  const mod=JSON.parse(JSON.stringify(sc.mod||{a:{},b:{}})),fa=Object.assign({a:0,b:0},sc.fatica0),mi=Object.assign({a:0,b:0},sc.morIni);let toccato=false;
  // marciare troppo stanca
  if(oreMarcia(s)>S.MARCIA_ORE){fa.a=Math.max(fa.a,S.FATICA_MARCIA);toccato=true}
  const colti=l=>{mod[l]=mod[l]||{};for(const g of['f','t','c']){const m=mod[l][g]=mod[l][g]||{};m.att=(m.att==null?1:m.att)*S.IMB_MOD;m.dif=(m.dif==null?1:m.dif)*S.IMB_MOD}};
  const c=ctx(s);
  if(c){const st=c.st,t=terrEff(s,st),buio=VEN.notte(s);
   if(st.camp){sc.terreno=st.camp;sc.scena=Object.assign({},sc.scena,{pend:st.camp===3?1:0,strada:false})}
   if((st.notte&&buio)||st.ia==='notte'){for(const l of['a','b']){mod[l]=mod[l]||{};for(const g of['f','t','c']){const m=mod[l][g]=mod[l][g]||{};m.git=(m.git==null?1:m.git)*S.GIT_NOTTE}}toccato=true;
    if(st.notte&&c.N<=S.RANGO_NOTTE){fa.b=Math.max(fa.b,S.FATICA_NOTTE);mi.b+=S.NOTTE_MOR;if(sc.rango)sc.rango=Object.assign({},sc.rango,{b:0})}}
   if(st.imb&&(t===2||t===3)){sc.imboscata='a';sc.colonna='b';mi.b+=S.IMB_MOR;colti('b');toccato=true}
   if(st.ia==='imb'){sc.imboscata='b';sc.colonna='a';mi.a+=S.IMB_MOR;colti('a');toccato=true}
   if(st.fort)sc.zone=zoneCon(sc);
   if(!sc.esplora)sc.esplora={a:c.E,b:c.N}}
  if(toccato){sc.mod=mod;sc.fatica0=fa;sc.morIni=mi}});
 return{oreMarcia}})());
