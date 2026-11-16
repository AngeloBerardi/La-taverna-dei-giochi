# U2 — Il luogo come una piazza, il mercato come un banco

**Binario** E. **Dopo** U1. Visibile appena unita. `segnali` e `prezzoMedio` vanno nel file nuovo `28kf-ven-anteprima.js` (un file nuovo non dà conflitti con il binario C).

**Scopo.** Entrando in una città si vedono a colpo d'occhio i servizi e cosa c'è di nuovo; il mercato si usa con il pollice senza leggere frasi.

**Leggi prima.** `app/24hwb-ven-luoghi.js` (`luogoH`, sotto-pannelli `sub:*`), `css/39jb-ven-pannelli.css`, `app/01b-icone.js` (icone disponibili per `ic()`), `docs/STYLE.md`. Dipende da U1 (fogli).

**Oggi.** Il luogo è un elenco di righe titolo + frase + bottone d'ottone (Mercato, Taverna, Armaiolo, Torneo, Sala, Incarico, Riposo, Riparti): otto ottoni. Il mercato ripete «Hai 6 · scorta 34 · compri a 16 · vendi a 13» per dieci merci.

**Decisioni già prese.**
1. **Testa del luogo**: nome, regno (striscia del colore del regno), prosperità come barra corta, e una riga di **segnali** (al più tre, con icona): «Torneo oggi», «Incarico», «Compagno in taverna», «Pezzo unico dall'armaiolo», «Assedio in vista».
2. **Servizi a griglia** 3 colonne × righe da 88 px: tessera di legno con icona grande e nome (Mercato, Taverna, Armaiolo, Torneo, Sala, Riposo, Reclute, Monastero, Porto…, solo quelli del tipo di luogo). Una tessera con un segnale porta il pallino d'ottone nell'angolo. La frase di spiegazione va nell'`aria-label` e nell'infobox, non sullo schermo.
3. **Un solo ottone**: «Riparti» (o «Assalta» davanti a un luogo nemico), fisso in fondo al foglio.
4. **Mercato a banco**: una riga per merce alta 56 px: icona merce · nome · tuo carico (numero) · prezzo d'acquisto a sinistra del tasto `+` e di vendita a destra del tasto `−` (tasti di legno quadrati da 48 px). Colore del prezzo: verde se sotto la media del mondo, rosso se sopra (la media viene da una funzione pura nuova). La quantità (×1/×5/×20) resta in testa. Sopra l'elenco: «Carico 8/56» e «Monete 320» sempre visibili.
5. Armaiolo, Taverna, Sala: stessa grammatica (righe compatte, tasti di legno, un ottone solo se c'è un'azione principale).

**Stato e contratti.** In `28kb`: `VEN.prezzoMedio(s,m)` → media dei prezzi d'acquisto di `m` nei luoghi noti (pura, arrotondata). `VEN.segnali(s,lid)` → `[{k:'torneo'|'incarico'|'compagno'|'unico'|'assedio', tx}]`, al più tre, nell'ordine dato. Nessun campo salvato.

**Passi.** 1) `segnali` e `prezzoMedio` + test in `test_ven_mondo.js` (un luogo con torneo oggi dà `torneo` per primo; `prezzoMedio` di una merce presente in un solo luogo = quel prezzo). 2) `luogoH` a griglia. 3) mercato a banco. 4) Armaiolo/Taverna/Sala.

**Prove.** Scenario `ventura` aggiornato (i selettori `[data-v="sub:mercato"]`, `[data-v="fai:compra:grano"]`, `[data-v="fai:esci"]` restano gli stessi: la scheda **non** cambia i `data-v`). Nuovo controllo: in città ≤ 1 ottone visibile; tutte le tessere ≥ 44 px. Screenshot di città e mercato a 390 px.

**Fuori scopo.** Nuovi servizi (ondata 3), regole del commercio.

**Fatto quando.** Lo scenario passa, gli screenshot mostrano griglia e banco, nessun testo di spiegazione fisso sullo schermo.
