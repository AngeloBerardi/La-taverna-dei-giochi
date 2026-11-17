/* ---- Compagnia di ventura, rango dei comandanti (passo 12; il maestro di guerra arriva col passo 30). ----
   Ogni comandante ha un rango 0-5: base per tipo + esperienza (`sg.esp`, facoltativa) + opzione `nem`. `VEN.rango(s,parte)` → {r,nome} (parte: una compagnia, un signore o un luogo),
   `VEN.rangoCap(s)` → il rango del tuo capitano (dall'abilità comando). L'esperienza si accumula sempre; premi, cattura, forza dei signori e scheda
   cambiano solo con `VDAT.ACCESO.consiglio`. Dopo 28ke, prima di 28l. */
Object.assign(VDAT,{RANGO:{BASE:{pre:0,capo:1,car:1,guar:1,mer:2,sig:2,mar:3,re:4},VOLPE:2,PASSO_ESP:6,MAX:5,PREMIO:.2,FORZA:.05,CATTURA:{capo:.8,senza:.3},
 NOMI:['sprovveduto','accorto','esperto','astuto','maestro di guerra','leggendario'],COMANDO:[1,1,2,2,3,3,4],PRIGIONIA_GIORNI:10}});
Object.assign(VEN,(()=>{const{D,abil,giorno}=VEN._,R=VDAT.RANGO,lim=r=>Math.max(0,Math.min(R.MAX,r));
 const attivo=()=>!!VDAT.ACCESO.consiglio;
 const sigDi=(s,p)=>p&&p.k==='sig'&&s.sig?s.sig[p.sig]:null;
 // base ed esperienza di una parte
 function baseDi(s,p){if(p.g&&p.tipo)return{b:R.BASE.guar,e:0};   // un luogo con la sua guarnigione
  if(p.k==='riv')return{b:Math.min(R.MAX,R.VOLPE+((s.volpe||{}).tappa|0)),e:0};
  const sg=sigDi(s,p);if(sg)return{b:sg.mar?R.BASE.mar:sg.re?R.BASE.re:R.BASE.sig,e:sg.esp|0};
  if(p.k==='mer')return{b:R.BASE.mer,e:0};if(p.k==='car')return{b:R.BASE.car,e:0};
  if(p.k==='pre'&&(p.tr||[]).some(e=>D.TR[e.t]&&D.TR[e.t].capo))return{b:R.BASE.capo,e:0};
  return{b:R.BASE.pre,e:0}}
 function rango(s,p){const x=baseDi(s,p),r=lim(Math.min(R.MAX,x.b+Math.floor(x.e/R.PASSO_ESP))+(VEN.opz(s).nem|0));return{r,nome:R.NOMI[r]}}
 function rangoCap(s){const c=abil(s,'comando');return R.COMANDO[Math.min(R.COMANDO.length-1,c)]}
 const nemici=s=>s.incontro&&s.incontro.tipo!=='arena'?VEN.schieramenti(s):{nem:[],all:[],luogo:null};
 const rangoNem=(s,v)=>{let m=null;for(const p of v.nem.length?v.nem:v.luogo?[v.luogo]:[]){const x=VEN.rango(s,p);if(!m||x.r>m.r)m=x}return m||{r:0,nome:R.NOMI[0]}};
 const fazDi=v=>v.nem[0]?v.nem[0].faz:v.luogo?v.luogo.faz:'neu';
 // esperienza: la decisione 3 del passo la vuole sempre attiva, ma sg.esp entra nel salvataggio e cambierebbe l'impronta: finché la domanda è aperta (vedi la PR) segue l'interruttore
 const ESP_SEMPRE=false;
 VEN.aggancia('battaglia',(s,riep)=>{if(!ESP_SEMPRE&&!attivo())return;const v=nemici(s);
  if(riep.vince==='a'){for(const p of v.all){const sg=sigDi(s,p);if(sg)sg.esp=(sg.esp|0)+1}}
  else for(const p of v.nem){const sg=sigDi(s,p);if(sg)sg.esp=(sg.esp|0)+2}});
 VEN.aggancia('giorno',s=>{if(!ESP_SEMPRE&&!attivo())return;if(giorno(s)%R.PRIGIONIA_GIORNI)return;for(const sg of s.sig)if(sg.prig!=null&&(sg.esp|0)>0)sg.esp--});
 // solo con l'interruttore
 VEN.aggancia('premio',(s,riep,out)=>{if(!attivo()||riep.vince!=='a')return;const m=1+R.PREMIO*rangoNem(s,nemici(s)).r;if(m===1)return;
  const f=Math.round(out.fama*m);s.fama+=f-out.fama;out.fama=f;out.xp=Math.round(out.xp*m);out.oro=Math.round(out.oro*m)});
 const cattura=VEN.probCattura;VEN.probCattura=(s,riep)=>attivo()?(riep&&riep.capoKo?R.CATTURA.capo:R.CATTURA.senza):cattura(s,riep);
 const molt=VEN.molt;VEN.molt=(s,k,c)=>{const x=molt(s,k,c);return attivo()&&k==='forza'&&c&&c.p?x*(1+R.FORZA*VEN.rango(s,c.p).r):x};
 VEN.aggancia('scheda',(s,sc)=>{if(!attivo())return;const v=nemici(s),n=rangoNem(s,v),sg=sigDi(s,v.nem[0]);
  sc.rango={a:VEN.rangoCap(s),b:n.r};sc.dott={a:'tu',b:VEN.cult(s,fazDi(v))};if(sg)sc.indole={b:(D.TRATTI[sg.tratto]||{}).nome};
  sc.esplora={a:abil(s,'esplora'),b:n.r};if(sg&&sg.mem)sc.memo=sg.mem});
 VEN.aggancia('anteprima',(s,a)=>{if(!attivo()||!a.loro)return;const v=nemici(s);a.loro.rango=rangoNem(s,v);a.loro.dott=VEN.cult(s,fazDi(v))});
 return{rango,rangoCap}})());
