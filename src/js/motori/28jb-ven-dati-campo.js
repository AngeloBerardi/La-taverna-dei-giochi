/* ---- Compagnia di ventura, dati del campo di battaglia (file vuoto, preparato dal passo 04). ----
   Passo 06: `VDAT.TAGLIA` (uomini in campo e misure del campo per taglia della battaglia) e gli altri numeri delle grandi battaglie.
   Va dopo 28ja e prima del mondo (28k): sta nel manifest già al suo posto, così nessun altro passo lo tocca. */
// Uomini in campo per lato e misure del campo (passi) per taglia della battaglia. Senza `max` nella scheda il campo resta quello di sempre (34 uomini, 60×100).
VDAT.TAGLIA={piccola:{max:40,W:60,H:100},media:{max:70,W:80,H:120},grande:{max:110,W:100,H:140}};
