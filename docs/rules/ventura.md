# Compagnia di ventura (regole in-game)

Fonte del testo di `RULES.ventura` in `src/js/app/07d-regole.js`. Regole nostre: il genere è quello dei giochi di comando di
truppe in un mondo libero (mappa strategica + battaglie campali in tempo reale); nessun nome, testo o grafica di giochi commerciali.

## In breve
- Capitano di una compagnia in un mondo libero: tre regni (Valdoro, Selvamara, Ferropietra), 27 luoghi, predoni, carovane. Nessuna trama.
- Mappa: tocco per muoversi; il tempo scorre solo camminando o accampandosi (un giorno ≈ 3 minuti a ×1).
- Compagnia: reclute nei villaggi, mercenari e compagni in taverna; esperienza → promozioni lungo tre linee (fanti, tiratori, cavalieri);
  viveri ogni giorno, paga ogni sette giorni, morale.
- Monete: commercio a prezzi mobili, incarichi, bottino, riscatti, soldo da mercenario, rendite dei feudi.
- Battaglia: tempo reale con pausa; capitano guidato a tocchi, ordini ai tre gruppi (Carica, Tieni, Seguimi, Avanti, Indietro), Grido;
  rinforzi a ondate oltre 34 uomini per lato; rotta; risoluzione automatica con lo stesso motore.
- Regni: contratto (fama 25), giuramento con feudo (fama 100), assedi con assalto dai varchi, fortezze proprie con guarnigione.

## Riferimento visivo
Stile nostro: diorama a facce piatte reso a pixel d'arte (telecamera ortografica a tre quarti, contorni, luce a bande, retino),
palette calda di giorno e blu di luna la notte; fasce e pannelli nello stile unico legno e ottone. Niente figure o icone copiate.

## Numeri
Truppe, merci, equipaggiamento e compagni: `VDAT` (`motori/28j-ven-dati.js`). Mondo: `VEN.P` (`28k`). Campo: `VCAM.C` (`28l`).
