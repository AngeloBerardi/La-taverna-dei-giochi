/* ---- Compagnia di ventura, stagioni (passo 17). ----
   L'anno gira (4 stagioni da 28 giorni, si parte a inizio primavera) e cambia il modo di giocare: d'inverno si mangia di più, si marcia piano, i passi del nord si
   chiudono, i laghi del nord gelano e si sverna nelle città; in primavera si recluta e partono le guerre; in autunno il grano costa poco.
   Acceso solo dove c'è `s.anno` (lo mette il gancio `nuovo` ai mondi `s.geo===2`): senza, nulla cambia. `VEN.stagione(s)`, `VEN.innevata(s,i)`, `VEN.passoChiuso(s,i)`,
   `VEN.lagoGelato(s,i)`, `VEN.portoChiuso(s,l)`. `VEN.molt` si estende componendo; d'inverno `VEN.mappaDi` dà la stessa mappa con `ok` ritoccato (passi chiusi, ghiaccio
   attraversabile), così le vie evitano i passi chiusi. Ripetibile: niente Math.random né trigonometria. Dopo 28ke, prima di 28l. */
VDAT.STAG={GIORNI:28,ORDINE:['prim','est','aut','inv'],NOMI:{prim:'primavera',est:'estate',aut:'autunno',inv:'inverno'},
 // moltiplicatori di ogni stagione (valore pieno, poi attenuato o aumentato dallo scarto di VEN.opz(s).stag)
 EFF:{prim:{viveri:1,foraggio:.8,marcia:1,grano:1.1,reclute:1.4,guerra:1.5},est:{viveri:1,foraggio:.8,marcia:1.05,grano:1,reclute:1,guerra:1.2},
  aut:{viveri:.9,foraggio:1,marcia:.95,grano:.7,reclute:1,guerra:.8},inv:{viveri:1.5,foraggio:1.6,marcia:.75,grano:1.4,reclute:.6,guerra:.3}},
 NEVE_MARCIA:.5,    // marcia sulla neve (al posto di quella dell'inverno)
 QUOTA_NEVE:.66,    // quota (VEN.alt) sopra cui d'inverno c'è neve...
 LAT_NEVE:.3,       // ...o latitudine (0 = nord, 1 = sud) sotto cui c'è neve
 QUOTA_PASSI:.7,    // un passo più alto di così, in ogni parte del mondo, d'inverno si chiude...
 LAT_PASSI:.45,     // ...e così i passi del nord
 LAT_GELO:.6,       // un lago il cui centro sta più a nord di così gela d'inverno
 GHIACCIO:9,        // sul ghiaccio si cammina come sulla pianura: il nucleo divide la marcia per il costo della cella (acqua 9, pianura 1), qui si rimette il rapporto (la prova lo verifica)
 FORAGGIO_QUOTA:.5, // quanto della razione di un cavaliere è del cavallo: si consuma a parte, col suo moltiplicatore di stagione (foraggio)
 CLASSI:['f','t','c','k'], // le classi della battaglia (fanti, tiratori, cavalli, capitani) a cui tocca la fatica estiva
 AVVISO:3,          // giorni di preavviso dell'inverno
 MORALE_FORAGGIO:2, // morale perso ogni giorno senza foraggio per i cavalli
 MORALE_APERTO:2,   // morale perso ogni giorno d'inverno dormendo all'aperto
 SCHED:{CAVALLI_NEVE:.85,FATICA_ESTATE:1.2,MEZZOGIORNO:[11,15]}};
Object.assign(VEN,(()=>{const{D,P,TU,L,rnd,giorno,abil,uomini,vicinoOk,cella,MERCATO,MURA}=VEN._,ST=VDAT.STAG,passa=VEN.passa;
 const NINV=new WeakMap(),NGEL=new WeakMap();
 // ---------- calendario ----------
 let mem={s:null,n:-1,a:0,x:null}; // l'ultima risposta: il moltiplicatore si chiede ogni minuto, la stagione cambia una volta al giorno
 function stagione(s){if(s.anno==null)return null;const g=giorno(s);if(mem.s===s&&mem.n===g&&mem.a===s.anno)return mem.x;
  const n=Math.max(0,g-1-s.anno),q=ST.GIORNI*ST.ORDINE.length,r=n%q,x={k:ST.ORDINE[Math.floor(r/ST.GIORNI)],g:r%ST.GIORNI+1,anno:Math.floor(n/q)+1};mem={s,n:g,a:s.anno,x};return x}
 const inverno=s=>{const x=stagione(s);return!!x&&x.k==='inv'};
 const scartoDi=s=>{const d=(VDAT.DIFF.stag||{})[(s.opz&&s.opz.stag)||VDAT.OPZ0.stag];return d?d.scarto:1};
 const attenua=(v,sc,min)=>Math.max(min==null?.05:min,1+(v-1)*sc);
 // ---------- geografia dell'inverno ----------
 const lat=(M,i)=>Math.floor(i/M.G)/M.G;
 const chiusoM=(M,i)=>!!(M.PS&&M.PS[i]&&(M.A[i]>=ST.QUOTA_PASSI||lat(M,i)<ST.LAT_PASSI));
 // per ogni lago: gela se il suo centro sta a nord (il mare non gela mai)
 function gelati(M){let g=NGEL.get(M.laghi);if(g)return g;const n=M.laghi.length,sy=new Float64Array(n),c=new Float64Array(n);
  for(let i=0;i<M.G*M.G;i++){const l=M.LG[i];if(l>0&&M.T[i]===0){sy[l]+=Math.floor(i/M.G);c[l]++}}
  g=new Uint8Array(n);for(let l=1;l<n;l++)g[l]=c[l]>0&&sy[l]/c[l]/M.G<ST.LAT_GELO?1:0;NGEL.set(M.laghi,g);return g}
 const geoM=(s,M)=>s.geo===2&&M.PS&&M.LG&&M.laghi&&M.A;
 const innevataM=(s,M,i)=>inverno(s)&&geoM(s,M)&&M.T[i]!==0&&(M.A[i]>=ST.QUOTA_NEVE||lat(M,i)<ST.LAT_NEVE);
 const innevata=(s,i)=>innevataM(s,VEN.mappaDi(s),i);
 const passoChiuso=(s,i)=>{const M=VEN.mappaDi(s);return inverno(s)&&!!geoM(s,M)&&chiusoM(M,i)};
 const lagoGelato=(s,i)=>{const M=VEN.mappaDi(s);return inverno(s)&&!!geoM(s,M)&&M.T[i]===0&&M.LG[i]>0&&gelati(M)[M.LG[i]]===1};
 // un porto è chiuso dai ghiacci se tutta l'acqua che lo tocca è lago gelato (con un tratto di mare resta aperto)
 function portoChiuso(s,l){const M=VEN.mappaDi(s);if(!inverno(s)||!geoM(s,M)||!l||l.tipo!=='porto')return false;const gel=gelati(M),x=Math.floor(l.x),y=Math.floor(l.y);let gelo=false;
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=M.G||ny>=M.G)continue;const j=ny*M.G+nx;if(M.T[j]!==0)continue;if(M.LG[j]===0)return false;if(gel[M.LG[j]])gelo=true}
  return gelo}
 // la mappa d'inverno: stessi dati, `ok` senza i passi chiusi e con i laghi gelati (si cammina sul ghiaccio)
 function invernale(M){let d=NINV.get(M);if(d)return d;const N=M.G*M.G,ok=Uint8Array.from(M.ok),gel=gelati(M);
  for(let i=0;i<N;i++){if(chiusoM(M,i))ok[i]=0;else if(M.T[i]===0&&M.LG[i]>0&&gel[M.LG[i]])ok[i]=1}
  d=Object.assign({},M,{ok});NINV.set(M,d);return d}
 const mappa0=VEN.mappaDi;
 // la mappa dipende solo da seme e mondo: dentro `passo` si chiede un milione di volte, quindi si ricorda l'ultima (per questa partita)
 let mm={s:null,seme:0,mondo:null,base:null};
 VEN.mappaDi=s=>{if(s.anno==null||s.geo!==2)return mappa0(s);const mondo=s.opz&&s.opz.mondo;
  if(mm.s!==s||mm.seme!==s.seme||mm.mondo!==mondo)mm={s,seme:s.seme,mondo,base:mappa0(s)};
  const M=mm.base;return M.PS&&M.LG&&M.laghi&&M.A&&inverno(s)?invernale(M):M};
 // uomini e cavalieri di una compagnia (i cavalli mangiano a parte)
 const cavalli=p=>{let n=0,cav=0;if(p&&p.tr)for(const x of p.tr){n+=x.n;if(D.TR[x.t]&&D.TR[x.t].c==='c')cav+=x.n}return{n,cav}};
 // ---------- moltiplicatori ----------
 const molt0=VEN.molt;
 VEN.molt=(s,k,c)=>{const m=molt0(s,k,c);if(s.anno==null)return m;const st=stagione(s),e=ST.EFF[st.k],sc=scartoDi(s);
  switch(k){
   // gli uomini: la razione dei cavalieri senza la parte del cavallo, che si consuma a parte nel gancio `giorno` (foraggio)
   case'viveri':{const{n,cav}=cavalli(c&&c.p);return m*attenua(e.viveri,sc)*(n?1-cav/n*ST.FORAGGIO_QUOTA:1)}
   case'marcia':{if(!c||c.i==null||st.k!=='inv'||s.geo!==2)return m*attenua(e.marcia,sc);const M=VEN.mappaDi(s);
    if(geoM(s,M)){if(chiusoM(M,c.i))return 0;if(M.T[c.i]===0&&M.LG[c.i]>0&&gelati(M)[M.LG[c.i]])return m*attenua(e.marcia,sc)*ST.GHIACCIO;if(innevataM(s,M,c.i))return m*attenua(ST.NEVE_MARCIA,sc)}
    return m*attenua(e.marcia,sc)}
   case'prezzo':return c&&c.m==='grano'?m*attenua(e.grano,sc):m;
   case'reclute':return m*attenua(e.reclute,sc);
   case'guerra':return m*attenua(e.guerra,sc,0);
   default:return m}};
 // ---------- leve di difficoltà (passo 27): valgono in tutti i mondi, perché il foglio «Nuova campagna» è già online ----------
 // con `opz` assente, o con i valori di base, ogni moltiplicatore è 1 e non si tocca nulla (impronta identica)
 const dif=(s,leva,campo)=>{const o=s.opz;if(!o)return 1;const d=(VDAT.DIFF[leva]||{})[o[leva]];return d&&d[campo]!=null?d[campo]:1};
 const DIF={viveri:['cons','viveri'],prezzo:['eco','prezzo'],paga:['eco','paga'],rendita:['eco','rendita'],predoni:['nem','predoni']};
 const molt1=VEN.molt;
 VEN.molt=(s,k,c)=>{const m=molt1(s,k,c),d=DIF[k];if(!d||!s.opz)return m;const f=dif(s,d[0],d[1]);return f===1?m:m*f};
 // ---------- ganci ----------
 VEN.aggancia('nuovo',s=>{if(s.geo===2&&s.anno==null)s.anno=0});
 const sverna=s=>{if(s.dentro<0)return false;const l=s.l[s.dentro];return!!l&&(!!MURA[l.tipo]||l.tipo==='porto')};
 VEN.aggancia('giorno',s=>{if(s.anno==null)return;const st=stagione(s),tu=TU(s),r=rnd(s),x=r();
  // il tempo della stagione (la neve sta nella scheda della battaglia e nella vista)
  s.meteo=st.k==='prim'?(x<.5?'pioggia':'sereno'):st.k==='est'?'sereno':st.k==='aut'?(x<.5?'nebbia':x<.8?'sereno':'pioggia'):(x<.55?'sereno':'nebbia');
  if(st.k==='aut'&&st.g===ST.GIORNI-ST.AVVISO){L(s,'L\'inverno è alle porte: fai scorta.','male');VEN.accoda(s,'inverno-alle-porte')}
  // chi si trova su un passo appena chiuso o sul ghiaccio appena sciolto è rimandato sulla terra
  const M=VEN.mappaDi(s);
  for(const p of s.p){if(p.dentro>=0||p.x==null||passa(M,p.x,p.y))continue;const v=vicinoOk(M,p.x,p.y);p.x=v[0];p.y=v[1];p.via=[];
   if(p.id===0&&!s.prigioniero)L(s,st.k==='inv'?'La neve ha chiuso il passo: la compagnia ripiega.':'Il ghiaccio cede: la compagnia torna a riva.','male')}
  // foraggio: i cavalli mangiano a parte (granaglie e viveri della scorta, dopo gli uomini); senza, la truppa si scoraggia
  if(!s.prigioniero){const cav=cavalli(tu).cav,serve=Math.round(cav*ST.FORAGGIO_QUOTA/6*attenua(ST.EFF[st.k].foraggio,scartoDi(s))*dif(s,'cons','viveri'));let da=serve;
   if(da>0){const cibi=Object.keys(tu.merci).filter(m=>D.MERCI[m].cibo);let k=0;while(da>0&&cibi.some(m=>tu.merci[m]>0)){const m=cibi[k++%cibi.length];if(tu.merci[m]>0){tu.merci[m]--;da--}}
    if(da>0){tu.mor=Math.max(0,tu.mor-ST.MORALE_FORAGGIO);L(s,'I cavalli non hanno foraggio: la truppa si scoraggia.','male')}}}
  // all'aperto d'inverno il morale scende; al chiuso (città, castelli, porti) no
  if(st.k==='inv'&&s.dentro<0&&!s.prigioniero)tu.mor=Math.max(0,tu.mor-ST.MORALE_APERTO)});
 // svernare: i feriti guariscono il doppio (un secondo tiro ogni ora, come quello del nucleo)
 VEN.aggancia('ora',s=>{if(s.anno==null||s.prigioniero||!inverno(s)||!sverna(s))return;const r=rnd(s),med=abil(s,'medicina');for(const e of TU(s).tr)if(e.f>0&&r()<.06+med*.02)e.f--});
 // svernare costa le paghe di un giorno
 VEN.aggancia('fatto',(s,z)=>{if(z.a!=='riposa'||s.anno==null||!inverno(s)||!sverna(s))return;const tu=TU(s),dovuto=Math.min(tu.oro,Math.ceil(VEN.paga(s)/P.PAGA_GIORNI));
  if(dovuto>0){tu.oro-=dovuto;L(s,'Svernare costa: '+dovuto+' monete di paghe e legna.')}});
 // il lago gelato ferma le navi
 VEN.aggancia('azione',(s,z)=>{if(z.a!=='imbarca'||s.anno==null||!inverno(s))return;const l=s.dentro>=0?s.l[s.dentro]:null,a=s.l[z.lid];
  if(portoChiuso(s,l)||portoChiuso(s,a))return{err:'Il lago è gelato: le navi sono ferme fino a primavera'}});
 // battaglia: neve (terreno bianco, cavalli più lenti) e caldo estivo di mezzogiorno (più fatica)
 VEN.aggancia('scheda',(s,sc)=>{if(s.anno==null||!sc||sc.tipo==='arena')return;const st=stagione(s),M=VEN.mappaDi(s),tu=TU(s);
  // moltiplica `k` per `f` nei tipi indicati (senza toccare ciò che altri hanno già messo nella scheda)
  const mod=(f,k,tipi)=>{sc.mod=sc.mod||{};for(const l of['a','b']){sc.mod[l]=sc.mod[l]||{};for(const c of tipi){const o=sc.mod[l][c]=sc.mod[l][c]||{};o[k]=(o[k]==null?1:o[k])*f}}};
  if(st.k==='inv'&&innevataM(s,M,cella(M,tu.x,tu.y))){sc.scena=Object.assign({},sc.scena,{meteo:'neve'});mod(ST.SCHED.CAVALLI_NEVE,'vel',['c'])}
  else if(st.k==='est'){const h=(s.t%P.GIORNO)/60;if(h>=ST.SCHED.MEZZOGIORNO[0]&&h<ST.SCHED.MEZZOGIORNO[1])mod(ST.SCHED.FATICA_ESTATE,'fa',ST.CLASSI)}});
 return{stagione,innevata,passoChiuso,lagoGelato,portoChiuso}})());
