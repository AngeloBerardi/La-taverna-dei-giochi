/* ---- Compagnia di ventura, anteprima della battaglia (passo 04: lo scheletro; passo 09: faccia a faccia, 32: stima e scelte). ----
   `VEN.anteprima(s)` restituisce ciò che si mostra prima di scegliere se combattere. Qui nasce vuota e passa dal gancio `anteprima(s,a)`:
   chi vuole aggiungere rango, stima o scelte si attacca con `VEN.aggancia('anteprima',(s,a)=>{a.rango=…})`. Dopo 28ke, prima di 28l. */
Object.assign(VEN,{anteprima(s){const a={};VEN.ganci('anteprima',s,a);return a}});
