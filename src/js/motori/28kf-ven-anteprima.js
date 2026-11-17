/* ---- Compagnia di ventura, anteprima della battaglia (passo 04: lo scheletro; passo 09: faccia a faccia, 32: stima e scelte). ----
   `VEN.anteprima(s)` restituisce ciò che si mostra prima di scegliere se combattere:
   {noi:{nome,col,col2,f,t,c,capo}, loro:{nome,col,col2,f,t,c,capo,indole,rango?,dott?,stima?}, scena, ora, avvisi:[tx], scelte:[{k,tx,info,ok,perche,oro?}]}.
   `k` è il valore che la vista manda come `scegli:K` (attacca, auto, fuggi, paga, togli). È pura e non salva nessun campo.
   Poi passa dal gancio `anteprima(s,a)`: chi vuole aggiungere rango, stima, avvisi o scelte si attacca con
   `VEN.aggancia('anteprima',(s,a)=>{a.loro.rango={n:3,nome:'…'}})`. Dopo 28ke, prima di 28l. */
Object.assign(VEN,(()=>{const{D,TU}=VEN._;
 const conta=(ps,luogo)=>{const c={f:0,t:0,c:0};for(const p of ps)for(const e of p.tr)c[D.TR[e.t].c]+=e.n-(e.f||0);if(luogo)for(const e of luogo.g)c[D.TR[e.t].c]+=e.n-(e.f||0);return c};
 const lato=(s,ps,luogo)=>{const c=conta(ps,luogo),p=ps[0],r=VEN.rg(s,luogo?luogo.faz:p?p.faz:'neu'),sg=p&&p.k==='sig'?s.sig[p.sig]:null;
  return{nome:luogo?luogo.nome:ps.map(x=>x.nome).join(', ')||'Nemici',col:r.col,col2:r.col2,f:c.f,t:c.t,c:c.c,capo:sg?sg.nome:'',indole:sg&&D.TRATTI[sg.tratto]?D.TRATTI[sg.tratto].nome:undefined}};
 function anteprima(s){const inc=s.incontro,a={noi:null,loro:null,scena:{},ora:0,avvisi:[],scelte:[]};if(!inc)return a;
  const{nem,all,luogo}=VEN.schieramenti(s),tu=TU(s),sc=VEN.campo(s),sito=luogo&&VEN.SITO[luogo.tipo],mia=VEN.rg(s,'tu');
  a.noi=lato(s,[tu].concat(all));a.noi.nome=tu.nome||'La Compagnia';a.noi.capo=(VEN.capi(s)[0]||{}).nome||'';a.noi.col=mia.col;a.noi.col2=mia.col2;
  a.loro=lato(s,nem,luogo);
  if(sc){a.scena=Object.assign({terreno:sc.terreno},sc.scena);a.ora=sc.ora||0}
  a.scelte.push({k:'attacca',tx:'Combatti',info:'Ordini la battaglia sul campo.',ok:true},{k:'auto',tx:'Risolvi',info:'Lasci decidere ai dadi: più rapido, meno controllo.',ok:true});
  if(luogo)a.scelte.push({k:'togli',tx:sito?'Meglio di no':'Togli l\'assedio',info:sito?'Ve ne andate senza combattere.':'Si leva il campo.',ok:true});
  else{a.scelte.push({k:'fuggi',tx:'Ritirata',info:'Provate a sganciarvi: può costare uomini.',ok:true});if(nem[0]&&nem[0].k==='pre')a.scelte.push({k:'paga',tx:'Paga il pedaggio',info:'Pagate e passate senza combattere.',ok:true})}
  VEN.ganci('anteprima',s,a);return a}
 return{anteprima}})());
