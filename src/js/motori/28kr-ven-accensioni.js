/* ---- Compagnia di ventura, accensioni (passo 04: file vuoto; passo 29: rilascio 2). ----
   Passi di rilascio (20, 29, 34, 38, 46): qui si accendono gli interruttori di `VDAT.ACCESO` che il rilascio pubblica. Ultimo file dopo 28ke, prima di 28l. */
// Rilascio 2, grandi battaglie: la battaglia del giocatore nasce con la taglia scelta (dell'oste in compagnia), reparti, ondate e,
// contro un signore o la Volpe, il suo comandante in campo. Le battaglie tra IA non passano da `scheda` e restano su `media`.
VEN.aggancia('scheda',(s,sc)=>{if(!VDAT.ACCESO.grandi||!sc||sc.tipo==='arena')return;
 const T=VCAM.taglia(VEN.opz(s).taglia);sc.max=T.max;sc.W=T.W;sc.H=T.H;sc.reparti=true;sc.ondate=true;
 const v=s.incontro?VEN.schieramenti(s):null,p=v&&v.nem&&v.nem[0];
 if(p&&p.k==='riv')sc.capoB='volpe';else if(p&&p.k==='sig')sc.capoB=true});
