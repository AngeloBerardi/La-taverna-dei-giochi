/* ---- Campagna: mappa a esagoni, giorno e notte, perdizione, incontri con prove di abilità (motore puro). ----
   Fondamenta delle campagne: un gruppo di 1–3 eroi (motori/27-eroi.js) cammina su una mappa generata dal seme, scopre
   luoghi, affronta incontri risolti con il d20 e porta a termine una missione in tre passi (città → antro → torre) prima
   che la perdizione arrivi a 100. Il combattimento a turni arriverà sopra questo scheletro.
   Contratto come gli altri motori: nuova(...) -> stato, act(stato, azione, rnd) -> {s} | {err}. Lo stato è JSON puro. */
const CAMP=(()=>{
 const TERRENI={pianura:{c:1,n:'Pianura'},strada:{c:.5,n:'Strada'},bosco:{c:2,n:'Bosco'},collina:{c:2,n:'Colle'},palude:{c:3,n:'Palude'},montagna:{c:null,n:'Montagna'},acqua:{c:null,n:'Acqua'}};
 const PASSI=['citta','antro','torre'],NOME_POI={citta:'Città',antro:'Antro',torre:'Torre oscura',tesoro:'Tesoro',campo:'Accampamento'};
 const DIREZIONI=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
 const K=(q,r)=>q+','+r,dist=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.q+a.r-b.q-b.r)+Math.abs(a.r-b.r))/2;
 const vicini=(q,r)=>DIREZIONI.map(([dq,dr])=>({q:q+dq,r:r+dr}));
 const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const hash=(x,y,s)=>{let h=Math.imul(x*374761393+y*668265263+s*2147483647|0,1274126177);h=Math.imul(h^h>>>13,1103515245);return((h^h>>>16)>>>0)/4294967296};
 const rumore=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
 function celleRaggio(R){const out=[];for(let q=-R;q<=R;q++)for(let r=Math.max(-R,-q-R);r<=Math.min(R,-q+R);r++)out.push({q,r});return out}
 const passabile=t=>TERRENI[t].c!=null;
 // percorso di costo minimo (Dijkstra su pochi esagoni); i terreni bloccati costano molto: servono a scavare un passaggio
 function percorso(celle,da,a,blocco){const D={[K(da.q,da.r)]:0},P={},aperti=[da];
  while(aperti.length){aperti.sort((x,y)=>D[K(x.q,x.r)]-D[K(y.q,y.r)]);const c=aperti.shift();if(c.q===a.q&&c.r===a.r)break;
   for(const n of vicini(c.q,c.r)){const cella=celle[K(n.q,n.r)];if(!cella)continue;const cost=TERRENI[cella.t].c==null?(blocco||99):TERRENI[cella.t].c,nd=D[K(c.q,c.r)]+cost;
    if(D[K(n.q,n.r)]==null||nd<D[K(n.q,n.r)]){D[K(n.q,n.r)]=nd;P[K(n.q,n.r)]=c;aperti.push(n)}}}
  const out=[];let c=a;while(c&&!(c.q===da.q&&c.r===da.r)){out.unshift(c);c=P[K(c.q,c.r)]}return D[K(a.q,a.r)]==null?null:out}
 function genera(seed,R){
  const rnd=mulberry(seed),celle={},lista=celleRaggio(R),off=rnd()*1000;
  for(const{q,r}of lista){const d=dist({q,r},{q:0,r:0}),x=q+r/2,y=r*.866;
   const h=rumore(x*.45+off,y*.45,seed),w=rumore(x*.6,y*.6+off,seed+7);let t='pianura';
   if(d>=R)t=rnd()<.8?'acqua':'montagna';else if(h>.74)t='montagna';else if(h>.62)t='collina';else if(w>.66)t='bosco';else if(w<.2)t='palude';else if(h<.2&&d>R-3)t='acqua';
   celle[K(q,r)]={q,r,t,poi:null,visto:false}}
  // luoghi: partenza vicino al centro; città vicina; antro e torre lontani
  const per=lista.filter(c=>c.q!==undefined&&dist(c,{q:0,r:0})<R-1);
  const scegli=(min,max,da,escl)=>{const c=per.filter(p=>{const d=dist(p,da);return d>=min&&d<=max&&!escl.some(e=>dist(e,p)<3)});return c.length?c[Math.floor(rnd()*c.length)]:per.filter(p=>!escl.some(e=>dist(e,p)<2))[0]};
  const start={q:0,r:0},citta=scegli(2,3,start,[start]),antro=scegli(R-3,R-1,start,[start,citta]),torre=scegli(R-2,R-1,antro,[start,citta,antro]);
  celle[K(0,0)].t='pianura';
  for(const[p,id]of[[citta,'citta'],[antro,'antro'],[torre,'torre']]){if(!passabile(celle[K(p.q,p.r)].t))celle[K(p.q,p.r)].t='pianura';celle[K(p.q,p.r)].poi=id}
  // collegamenti garantiti: strada tra i luoghi, aprendo un passo dove serve
  const catena=[start,citta,antro,torre];
  for(let i=0;i<catena.length-1;i++)for(const c of percorso(celle,catena[i],catena[i+1],6)||[]){const x=celle[K(c.q,c.r)];if(!passabile(x.t))x.t='pianura';if(i===0&&!x.poi)x.t='strada'}
  // qualche tesoro e accampamento sparsi
  const liberi=per.filter(c=>{const x=celle[K(c.q,c.r)];return passabile(x.t)&&!x.poi&&dist(c,start)>1});
  for(const id of['tesoro','tesoro','tesoro','campo','campo']){if(!liberi.length)break;const c=liberi.splice(Math.floor(rnd()*liberi.length),1)[0];celle[K(c.q,c.r)].poi=id}
  return celle}
 function rivela(s,q,r,raggio){for(const c of celleRaggio(raggio||2)){const x=s.celle[K(q+c.q,r+c.r)];if(x)x.visto=true}}
 const vivi=s=>s.eroi.filter(e=>e.hp>0);
 const movimento=s=>{const v=vivi(s);return v.length?Math.min(...v.map(e=>e.mov)):0};
 // crea la campagna da eroi già pronti (schede di EROI.nuovo/derivati)
 function nuova(eroi,seed,opts){
  opts=opts||{};if(!eroi||eroi.length<1||eroi.length>3)throw new Error('servono da 1 a 3 eroi');
  const R=opts.raggio||6,s={v:1,g:'campagna',seed:seed>>>0,n:eroi.length,raggio:R,celle:genera(seed>>>0,R),giorno:1,fase:'giorno',turno:0,
   eroi:eroi.map((h,i)=>{const d=EROI.derivati(h);return{slot:h.slot||'e'+(i+1),nome:h.nome,razza:h.razza,classe:h.classe,aspetto:h.aspetto,liv:h.liv,xp:h.xp,hp:h.hp,hpMax:h.hpMax,ca:d.ca,mov:d.mov,base:h.base,oro:h.oro||0}}),
   party:{q:0,r:0},pm:0,perdizione:0,oro:eroi.reduce((a,h)=>a+(h.oro||0),0),missione:{titolo:'La Torre oscura',passo:0,passi:PASSI.slice()},incontro:null,log:[],over:null,evn:0};
  s.pm=movimento(s);rivela(s,0,0,2);L(s,'La compagnia lascia il villaggio. Giorno 1.');return s}
 function L(s,t){s.log.push(t);if(s.log.length>40)s.log.shift()}
 const copia=s=>JSON.parse(JSON.stringify(s));
 const eroeDi=e=>({base:e.base,razza:e.razza,classe:e.classe,liv:e.liv});
 // incontri: nascono dopo un movimento con probabilità legata a terreno, notte e perdizione
 const TIPI={
  bestie:{testo:'Un branco di bestie vi circonda.',ab:['atletica','intimidire','furtivita'],ric:{xp:30,oro:5},dan:6},
  trappola:{testo:'Una trappola nascosta scatta sotto i vostri piedi.',ab:['acrobazia','percezione'],ric:{xp:20,oro:0},dan:5},
  viandante:{testo:'Un viandante sospettoso vi sbarra la strada.',ab:['persuasione','intimidire','storia'],ric:{xp:20,oro:12},dan:3},
  tempesta:{testo:'Una tempesta improvvisa vi sorprende.',ab:['sopravvivenza','atletica'],ric:{xp:15,oro:0},dan:4},
  rovina:{testo:'Tra le rovine c\'è un enigma scolpito nella pietra.',ab:['arcano','storia','percezione'],ric:{xp:25,oro:15},dan:4}};
 const PER_TERRENO={bosco:['bestie','viandante','trappola'],palude:['tempesta','bestie','trappola'],collina:['bestie','rovina','tempesta'],pianura:['viandante','bestie','tempesta'],strada:['viandante','bestie','trappola'],montagna:['tempesta'],acqua:[]};
 function incontroDopoMossa(s,rnd){const t=s.celle[K(s.party.q,s.party.r)];const p=.22+(s.fase==='notte'?.14:0)+s.perdizione/400;
  if(t.poi||rnd()>p)return null;const lista=PER_TERRENO[t.t]||PER_TERRENO.pianura,tipo=lista[Math.floor(rnd()*lista.length)];
  return{kind:tipo,cd:10+Math.floor(s.perdizione/12)+(s.fase==='notte'?2:0),testo:TIPI[tipo].testo,ab:TIPI[tipo].ab}}
 function danno(s,i,n){const e=s.eroi[i];e.hp=Math.max(0,e.hp-n);if(e.hp===0)L(s,e.nome+' cade a terra!');
  if(!vivi(s).length){s.over={win:false,reason:'Tutti gli eroi sono caduti'};s.evn++}}
 function finisciFase(s){ // da giorno a notte, da notte a nuovo giorno (+perdizione, riposo)
  if(s.fase==='giorno'){s.fase='notte';L(s,'Scende la notte.')}
  else{s.fase='giorno';s.giorno++;s.perdizione=Math.min(100,s.perdizione+3);
   const c=s.celle[K(s.party.q,s.party.r)];for(const e of s.eroi)if(e.hp>0)e.hp=Math.min(e.hpMax,e.hp+Math.max(1,Math.floor(e.hpMax*(c.poi==='campo'||c.poi==='citta'?.5:.25))));
   L(s,'Giorno '+s.giorno+'. La perdizione sale a '+s.perdizione+'.');if(s.perdizione>=100){s.over={win:false,reason:'La perdizione ha inghiottito il regno'};s.evn++}}
  s.pm=movimento(s);s.evn++}
 function act(st,a,rnd){const s=copia(st);rnd=rnd||Math.random;if(s.over)return{err:'Campagna finita'};s.evn++;
  if(s.incontro&&a.t!=='risolvi'&&a.t!=='fuggi')return{err:'Prima affronta l\'incontro'};
  if(a.t==='muovi'){const da=s.party,a2={q:a.q,r:a.r};if(dist(da,a2)!==1)return{err:'Puoi muoverti solo su un esagono adiacente'};
   const x=s.celle[K(a2.q,a2.r)];if(!x)return{err:'Fuori dalla mappa'};const c=TERRENI[x.t].c;if(c==null)return{err:TERRENI[x.t].n+': non si passa'};
   if(c>s.pm)return{err:'Movimento insufficiente'};s.pm-=c;s.party=a2;s.turno++;rivela(s,a2.q,a2.r,2);
   if(x.poi==='tesoro'){const o=8+Math.floor(rnd()*13);s.oro+=o;x.poi=null;L(s,'Trovate '+o+' monete in un forziere.')}
   else if(x.poi==='campo')L(s,'Un accampamento abbandonato: qui si riposa meglio.');
   s.incontro=incontroDopoMossa(s,rnd);if(s.incontro)L(s,s.incontro.testo);return{s}}
  if(a.t==='riposa'){finisciFase(s);return{s}}
  if(a.t==='entra'){const x=s.celle[K(s.party.q,s.party.r)],ric=s.missione.passi[s.missione.passo];
   if(x.poi==='citta'){const costo=vivi(s).length?s.eroi.reduce((n,e)=>n+(e.hp>0?Math.ceil((e.hpMax-e.hp)/2):0),0):0;
    if(costo>s.oro)return{err:'Servono '+costo+' monete per le cure'};s.oro-=costo;for(const e of s.eroi)if(e.hp>0)e.hp=e.hpMax;
    if(ric==='citta'){s.missione.passo++;L(s,'Il sindaco indica un antro a nord da cui esce l\'oscurità.')}else L(s,'Curati dal guaritore'+(costo?' per '+costo+' monete':'')+'.');return{s}}
   if(x.poi==='antro'||x.poi==='torre'){if(ric!==x.poi)return{err:x.poi==='antro'?'Prima va ascoltato il sindaco della città':'Prima va ripulito l\'antro'};
    const dif=x.poi==='antro'?{prove:3,serve:2,cd:12}:{prove:4,serve:3,cd:14};s.incontro={kind:x.poi,cd:dif.cd+Math.floor(s.perdizione/15),testo:x.poi==='antro'?'Nell\'antro l\'aria è gelida.':'La torre oscura vi attende.',ab:['atletica','arcano','percezione','furtivita','intimidire','persuasione','sopravvivenza','acrobazia','storia','medicina'],multi:{prove:dif.prove,serve:dif.serve,fatte:0,riuscite:0}};L(s,s.incontro.testo);return{s}}
   return{err:'Qui non c\'è nulla da fare'}}
  if(a.t==='fuggi'){if(!s.incontro)return{err:'Nessun incontro'};if(s.incontro.multi)return{err:'Non si fugge da qui'};const i=a.eroe==null?0:a.eroe;
   L(s,'La compagnia batte in ritirata.');danno(s,vivi(s).length?s.eroi.indexOf(vivi(s)[0]):0,1+Math.floor(s.perdizione/25));s.incontro=null;s.perdizione=Math.min(100,s.perdizione+1);return{s}}
  if(a.t==='risolvi'){const inc=s.incontro;if(!inc)return{err:'Nessun incontro'};const e=s.eroi[a.eroe];if(!e||e.hp<=0)return{err:'Scegli un eroe in piedi'};
   if(!EROI.ABILITA[a.abilita])return{err:'Abilità sconosciuta'};if(!inc.ab.includes(a.abilita))return{err:'Qui quell\'abilità non serve'};
   const r=EROI.prova(eroeDi(e),a.abilita,inc.cd,rnd);s.ultima={eroe:a.eroe,abilita:a.abilita,tiro:r.tiro,tot:r.tot,cd:r.cd,ok:r.ok};
   L(s,e.nome+' prova '+a.abilita+': '+r.tot+' contro '+r.cd+(r.ok?' — riesce':' — fallisce'));
   if(inc.multi){inc.multi.fatte++;if(r.ok)inc.multi.riuscite++;if(!r.ok)danno(s,a.eroe,2+Math.floor(rnd()*5));
    if(!s.over&&inc.multi.fatte>=inc.multi.prove){const ok=inc.multi.riuscite>=inc.multi.serve;
     if(ok){s.missione.passo++;L(s,inc.kind==='antro'?'L\'antro è ripulito! Resta la torre oscura.':'La torre cade: il regno è salvo!');for(const x of s.eroi)if(x.hp>0)x.xp+=inc.kind==='antro'?60:100;
      s.celle[K(s.party.q,s.party.r)].poi=inc.kind==='antro'?null:s.celle[K(s.party.q,s.party.r)].poi;if(inc.kind==='torre'){s.over={win:true,reason:'La torre oscura è caduta',giorni:s.giorno};}s.incontro=null}
     else{L(s,'La prova fallisce: la compagnia deve ritirarsi e riprovare.');s.perdizione=Math.min(100,s.perdizione+4);for(const x of s.eroi)if(x.hp>0)x.hp=Math.max(1,x.hp-2);s.incontro=null}}
    return{s}}
   const t=TIPI[inc.kind];if(r.ok){const g=t.ric;e.xp+=g.xp;s.oro+=g.oro;L(s,'Incontro superato (+'+g.xp+' esperienza'+(g.oro?', +'+g.oro+' monete':'')+').')}
   else{danno(s,a.eroe,1+Math.floor(rnd()*t.dan)+Math.floor(s.perdizione/25));s.perdizione=Math.min(100,s.perdizione+1)}
   s.incontro=null;return{s}}
  return{err:'Azione sconosciuta'}}
 // livelli: a fine campagna (o in città) le schede salgono secondo EROI.guadagna
 const celleVisibili=s=>Object.values(s.celle).filter(c=>c.visto);
 return{TERRENI,PASSI,NOME_POI,DIREZIONI,K,dist,vicini,mulberry,genera,percorso,rivela,vivi,movimento,nuova,act,celleVisibili,celleRaggio,passabile,TIPI}})();
if(typeof module!=='undefined')module.exports=CAMP;
