# W4 — La sorte ti getta nel mondo

**Binario** H. **Dopo** W1 e W3b. Solo mondi nuovi (`geo===2`). Modello: Sonnet.

**Scopo.** Non si sceglie il regno. Il gioco getta la compagnia in un punto a caso, ma giocabile, e lo racconta in tre righe. Ogni partita comincia diversa.

**Leggi prima.** `motori/28k-ven-mondo.js` (`nuovo`: dove nasce la compagnia `tu`, `regno:sel`), `VVOC` (formato delle scene), W1, W3b.

**Decisioni già prese.**
1. **Luogo d'inizio**: estratto dal seme tra villaggi e locande che stanno ad almeno 8 celle da un covo, non in un regno in guerra al giorno 0, e con una città entro 20 celle. Peso maggiore per i regni piccoli: si parte dal basso.
2. **Origine del capitano**: la cultura del luogo dà un bonus leggero (una truppa della sua cultura recluta a −10%) e la prima frase.
3. **Dotazione** da `opz.diff`: monete, uomini (reclute della cultura del luogo), viveri.
4. **Apertura**: scena di tre righe («La sorte ti getta a …, ai margini della Marca di …. Hai 7 uomini, 120 monete e una voce: …») con un **aggancio** nel raggio di 10 celle, estratto da 6 tipi (un covo da ripulire con taglia, una carovana che cerca scorta, un signore che recluta, un torneo tra 3 giorni, un villaggio minacciato, un mercante con un affare). È un incarico già scritto nella lista degli incarichi. Testi nel binario F (forte), 6 aperture × 2 varianti.
5. In compagnia gli altri capitani nascono vicino (entro 3 celle), con la stessa apertura.

**Stato e contratti.** `s.inizio={lid,cult,aggancio}`. `VEN.nuovo` senza `faz` di partenza. La vista mostra la scena d'apertura al primo ingresso (riusa la scena delle voci).

**Prove.**
- 50 semi: il luogo d'inizio rispetta i vincoli; mai lo stesso regno per più di 15 semi su 50; l'aggancio è raggiungibile.
- Il bot accorto sopravvive 60 giorni in tutti i semi con la difficoltà Condottiero.
- Scenario `menu_avventura`: «Getta i dadi» → la scena d'apertura compare, una volta sola.

**Fatto quando.** Prove verdi.
