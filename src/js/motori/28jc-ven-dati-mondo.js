/* ---- Compagnia di ventura, dati del mondo nuovo: interruttori, opzioni di partita e difficoltà (passo 04). ----
   Tutto ciò che cambia il gioco nasce spento: `VDAT.ACCESO` si accende solo nei passi di rilascio (20, 29, 34, 38, 46)
   o, per provare, in memoria con `?ven=grandi,consiglio,mondo2,eserciti` (24hw, `entra`). Dopo 28ja e prima del mondo (28k). */
Object.assign(VDAT,(()=>{
 // interruttori: a tutti spenti il gioco è identico a `main` (lo prova `node tools/avventura/impronta.js --controlla`)
 const ACCESO={grandi:false,consiglio:true,mondo2:false,eserciti:false};
 // opzioni di una partita nuova (`s.opz`, unite a queste da `VEN.opz`) e quelle che si cambiano anche in partita
 const OPZ0={diff:'condottiero',eco:'giusta',cons:'normali',nem:0,unif:'normale',stag:'normali',fer:'normali',mondo:'ampio',taglia:'media',nebbia:false};
 const OPZ_PARTITA=['taglia'];
 // difficoltà: per ogni leva i valori ammessi, con i numeri che i passi successivi leggono (moltiplicatori di `VEN.molt` e simili)
 const DIFF={
  eco:{generosa:{prezzo:.85,paga:.85,rendita:1.2},giusta:{prezzo:1,paga:1,rendita:1},avara:{prezzo:1.2,paga:1.15,rendita:.85}},
  cons:{leggeri:{viveri:.8},normali:{viveri:1},duri:{viveri:1.25}},
  nem:{'-1':{rango:-1,predoni:.7},'0':{rango:0,predoni:1},'1':{rango:1,predoni:1.4}},
  unif:{lenta:{accorpa:.6},normale:{accorpa:1},rapida:{accorpa:1.6}},
  stag:{miti:{scarto:.5},normali:{scarto:1},rigide:{scarto:1.5}},
  fer:{indulgenti:{capitanoMuore:false},normali:{capitanoMuore:true},ferro:{capitanoMuore:true,sconfitteGravi:3,salvataggi:1}},
  mondo:{ampio:{lato:192},vasto:{lato:240}},
  taglia:{piccola:{uomini:40},media:{uomini:70},grande:{uomini:110}}};
 // preset: cambiano tutte le leve tranne `mondo` e `taglia`
 const PRESET={
  recluta:{eco:'generosa',cons:'leggeri',nem:-1,unif:'lenta',stag:'miti',fer:'indulgenti'},
  condottiero:{eco:'giusta',cons:'normali',nem:0,unif:'normale',stag:'normali',fer:'normali'},
  leggenda:{eco:'avara',cons:'duri',nem:1,unif:'rapida',stag:'rigide',fer:'ferro'}};
 return{ACCESO,OPZ0,OPZ_PARTITA,DIFF,PRESET}})());
