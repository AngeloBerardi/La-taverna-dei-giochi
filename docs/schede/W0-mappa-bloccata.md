# W0 — La mappa non va più nel vuoto

**Binario** H (mondo e campagna, vista della mappa). **Subito**: non dipende da nulla. Visibile appena unita. Modello: Sonnet.

**Scopo.** Trascinando o pizzicando la mappa del mondo non si esce più dalla terra. La telecamera resta dentro i bordi, con un margine di mare.

**Leggi prima.** `app/24hu-ven-mappa.js`: `K.fuoco`, `K.alt`, `K.segue`, i gesti di trascinamento e pizzico (in `24hw`: `gesti`, che chiama la mappa), la riga 188 (inseguimento della compagnia).

**Decisioni già prese.**
1. Funzione pura `limita(f,alt,G,asp)`: il centro della vista sta tra `m` e `G−m` su entrambi gli assi, con `m = mezza larghezza visibile − 6 celle` (si vede al massimo una striscia di 6 celle di mare oltre la terra). Se la vista è più larga della mappa, si centra.
2. Si applica dopo ogni trascinamento, pizzico, inseguimento e `centra`.
3. Zoom: `K.alt` tra un minimo (oggi) e un massimo tale che tutta la mappa stia nello schermo.
4. Arrivati al bordo, una molla morbida (ritorno in 0,25 s) al posto di un blocco secco.

**Prove.** Scenario `ventura`: trascinare 20 volte verso l'alto a sinistra e poi verificare che `K.fuoco` stia nei limiti; pizzico al massimo → tutta la mappa visibile. `limita` in node (in cima al file, esportata come `VenMappa.limita`).

**Fatto quando.** Lo scenario passa.
