/* ---- Compagnia di ventura, anteprima della battaglia (passo 04: lo scheletro; passo 09: faccia a faccia, 32: stima e scelte). ----
   `VEN.anteprima(s)` restituisce ciò che si mostra prima di scegliere se combattere:
   {noi:{nome,col,col2,f,t,c,capo}, loro:{nome,col,col2,f,t,c,capo,indole,rango?,dott?,stima?}, scena, ora, avvisi:[tx], scelte:[{k,tx,info,ok,perche,oro?}]}.
   `k` è il valore che la vista manda come `scegli:K` (attacca, auto, fuggi, paga, togli). È pura e non salva nessun campo.
   Poi passa dal gancio `anteprima(s,a)`: chi vuole aggiungere rango, stima, avvisi o scelte si attacca con
   `VEN.aggancia('anteprima',(s,a)=>{a.loro.rango={r:3,nome:'…'}})` (il rango è `{r,nome}`, come lo scrive il passo 12; `dott` è la cultura del nemico e `VEN.dottrina(dott)` ne dà la frase). Dopo 28ke, prima di 28l. */
Object.assign(VEN,(()=>{const{D,TU}=VEN._;
 const conta=(ps,luogo)=>{const c={f:0,t:0,c:0};for(const p of ps)for(const e of p.tr)c[D.TR[e.t].c]+=e.n-(e.f||0);if(luogo)for(const e of luogo.g)c[D.TR[e.t].c]+=e.n-(e.f||0);return c};
 const lato=(s,ps,luogo)=>{const c=conta(ps,luogo),p=ps[0],r=VEN.rg(s,luogo?luogo.faz:p?p.faz:'neu'),sg=p&&p.k==='sig'?s.sig[p.sig]:null;
  return{nome:luogo?luogo.nome:ps.map(x=>x.nome).join(', ')||'Nemici',col:r.col,col2:r.col2,f:c.f,t:c.t,c:c.c,capo:sg?sg.nome:'',indole:sg&&D.TRATTI[sg.tratto]?D.TRATTI[sg.tratto].nome:undefined}};
 // una frase per cultura: come combatte chi vi sta davanti (solo se l'anteprima porta `dott`)
 const DOTT={val:'tiene la linea e carica quando vede il varco',sel:'si nasconde tra gli alberi e colpisce dai lati',fer:'si chiude in blocchi di picche',mar:'paga buone lance e tira da lontano',alt:'tira a cavallo e non accetta la mischia',pre:'assale in disordine, senza un piano',mer:'combatte per paga, e solo finché conviene'};
 const dottrina=d=>DOTT[d]||'';
 function anteprima(s){const inc=s.incontro;if(!inc){const v={};VEN.ganci('anteprima',s,v);return v}   // senza incontro non c'è nulla da mostrare: solo ciò che aggiungono i ganci
  const a={noi:null,loro:null,scena:{},ora:0,avvisi:[],scelte:[]};
  const{nem,all,luogo}=VEN.schieramenti(s),tu=TU(s),sc=VEN.campo(s),sito=luogo&&VEN.SITO[luogo.tipo],mia=VEN.rg(s,'tu');
  a.noi=lato(s,[tu].concat(all));a.noi.nome=tu.nome||'La Compagnia';a.noi.capo=(VEN.capi(s)[0]||{}).nome||'';a.noi.col=mia.col;a.noi.col2=mia.col2;
  a.loro=lato(s,nem,luogo);
  if(sc){a.scena=Object.assign({terreno:sc.terreno},sc.scena);a.ora=sc.ora||0}
  a.scelte.push({k:'attacca',tx:'Combatti',info:'Ordini la battaglia sul campo.',ok:true},{k:'auto',tx:'Risolvi',info:'Lasci decidere ai dadi: più rapido, meno controllo.',ok:true});
  if(luogo)a.scelte.push({k:'togli',tx:sito?'Meglio di no':'Togli l\'assedio',info:sito?'Ve ne andate senza combattere.':'Si leva il campo.',ok:true});
  else{a.scelte.push({k:'fuggi',tx:'Ritirata',info:'Provate a sganciarvi: può costare uomini.',ok:true});if(nem[0]&&nem[0].k==='pre'){const q=Math.max(30,Math.floor(tu.oro*.25)),ok=tu.oro>=q;a.scelte.push({k:'paga',tx:'Paga il pedaggio',info:'Pagate '+q+' monete e passate senza combattere.',ok,perche:ok?undefined:'Servono '+q+' monete',oro:q})}}
  VEN.ganci('anteprima',s,a);return a}
 return{anteprima,dottrina}})());
