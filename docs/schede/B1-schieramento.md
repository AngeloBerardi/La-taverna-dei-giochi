# B1 — Lo schieramento prima dello scontro

**Scopo.** Prima del «Via» il campo si vede tutto: il giocatore sposta i suoi tre gruppi nella propria fascia e sceglie la formazione, guardando dove il nemico si è messo e dove sono alture e boschi.

**Leggi prima.** `motori/28l-ven-campo.js`: `nuovo` (ancore `s.ord`, `posto`, `passoFm`), `formazione`, `ordina`; `motori/28m-ven-stanza.js` (dove arrivano gli ordini di battaglia in compagnia: `grep -n "VCAM\." 28m`); `app/24hv-ven-campo.js` (`tocco`, `K.pausa`, `K.alt`, `K.fuoco`); `app/24hwd-ven-scontro.js` (`campoH`, riquadro `.vn-via`). Dipende da R1, R2.

**Decisioni già prese.**
1. Lo schieramento è la pausa iniziale che esiste già (`b.t===0`): non c'è una fase nuova nel motore, solo un'azione valida finché `s.t===0`.
2. **Fascia di schieramento** del lato `a`: `y` tra `C.H-34` e `C.H-4`, `x` tra 3 e `C.W-3`; non in acqua (`acqua`). In assedio la fascia parte da `s.muro+10`. In arena niente schieramento.
3. Spostare un gruppo: tutte le sue unità si rimettono in fila attorno alla nuova ancora con `posto` (stessa funzione di `nuovo`), istantaneo. La formazione a `t===0` cambia senza attesa (`fmT` resta 0).
4. Il capitano (o i capitani) si sposta con i fanti (resta 2 passi dietro l'ancora dei fanti), come oggi alla nascita.
5. Il nemico si schiera da sé alla nascita (oggi davanti, al centro); con B2 lo farà secondo la dottrina. La risoluzione automatica non schiera (usa le ancore di nascita): stesso risultato di oggi per `risolvi`.
6. Vista: finché `t===0` il riquadro «Via» diventa una striscia in alto («Schieramento — scegli un gruppo e tocca il campo», «Via» d'ottone a destra). La telecamera mostra il campo intero (alt alta, centro del campo); la fascia valida è velata d'ambra sul terreno; toccando fuori fascia compare l'avviso d'errore del motore. Le zone del terreno (altura, bosco…) sono già disegnate dal campo.
7. In compagnia: chiunque può schierare qualunque gruppo; la mossa passa come gli altri ordini di battaglia con `seat`.

**Stato e contratti.** In `VCAM`: `schiera(s,{g,x,y})` → `{s}` | `{err}`; errori: `'La battaglia è già cominciata'`, `'Gruppo sconosciuto'`, `'Lì non puoi schierarti'`, `'In lizza non ci si schiera'`; evento `{t:'schiera',g}`. `fascia(s,'a')` → `{x0,x1,y0,y1}` per la vista. `ordina` con `t:'forma'` a `s.t===0` non mette attesa. Nessun campo nuovo nello stato.

**Passi.** 1) `fascia`, `schiera` in `28l` + export. 2) `formazione`: niente `fmT` a `t===0`. 3) `28m`: la mossa `{t:'schiera',g,x,y,seat}` (accanto agli ordini di battaglia). 4) Vista: striscia, velo, tocco con gruppo scelto → `schiera`; telecamera larga a `t===0`. 5) Regole in `docs/rules/ventura.md` («Lo schieramento», 3 righe) e `RULES.ventura`.

**Prove.** `tests/test_ven_campo.js`: (a) `schiera` sposta il centro dei fanti entro 0,5 dalla nuova ancora; (b) fuori fascia, in acqua o a `t>0` → errore; (c) dopo lo schieramento due passi di `risolvi`-come sullo stesso seme danno lo stesso esito (ripetibilità); (d) `risolvi` di 5 schede fisse: esito identico a prima della scheda. `test_ven_stanza.js`: la mossa `schiera` di un secondo telefono arriva uguale su entrambi. Scenario `ventura_tattica`: scegli i tiratori, tocca l'altura forzata se nella fascia, verifica `ord.a.t` spostata. Screenshot a 390 px.

**Fuori scopo.** Schieramento del nemico secondo dottrina (B2), nebbia di guerra.

**Fatto quando.** Prove verdi; dallo screenshot si vede tutto il campo con la fascia velata.
