---
passo: 36
titolo: L'economia del mondo
fase: 9
area: mondo
dopo: [17, 13]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28kb-ven-economia.js
  - src/js/app/24hwb-ven-luoghi.js
  - src/js/app/24hwc-ven-gente.js
---

# Passo 36 — L'economia del mondo

**In breve.** I prezzi raccontano il mondo: i villaggi producono, le città consumano, le razzie fanno salire il pane, i grandi eserciti costano più che in proporzione.

**Acceso da.** mondi nuovi (`s.geo===2`); i mondi vecchi restano come oggi.

## Scopo

I prezzi raccontano il mondo.
- I villaggi producono, le città consumano, le carovane portano.
- Una razzia o un assedio fanno salire il pane in tutta la regione; la pace e un buon raccolto lo fanno scendere.
- Mantenere un esercito costa di più man mano che cresce e sale di grado.
- La difficoltà decide quanto è avaro il mondo.

## Leggi prima

`motori/28kb-ven-economia.js` (prezzi, scorte, `rinnova`, paga, rendite), `VDAT.MERCI`, `VDAT.PRODUCE`, `VDAT.TR` (paga per truppa), `VEN.molt` (passo 17), `VDAT.DIFF` (passo 04).

## Decisioni

1. **Produzione e consumo** per luogo e per giorno (`VDAT.ECO`, numeri qui):
   - un villaggio produce le merci della sua cultura e del suo terreno (grano in pianura, legno nel bosco, ferro sui monti, pesce sui laghi e sul mare), × prosperità × stagione;
   - una città consuma cibo in proporzione agli abitanti (prosperità) e produce manufatti con la materia vicina;
   - le scorte si muovono **solo** con le carovane (già esistono) e con un «mercato regionale» lento: ogni settimana il 5% della differenza di scorte tra luoghi collegati da strada entro 15 celle.
2. **Prezzo** = base × `CURVA[q]`, dove q = scorta di riferimento / scorta attuale arrotondata a 0,1 tra 0,3 e 3. `CURVA` è una tabella di 28 valori che approssima q^0,6, calcolata a mano una volta e scritta nel codice: niente `Math.pow`, perché i telefoni devono dare lo stesso risultato (passo 04). Il prezzo resta tra 0,4× e 3× e poi si moltiplica per la stagione (`VEN.molt`) e per `VEN.opz(s).eco`. Si tiene la regola di oggi su acquisto e vendita (margine).
3. **Guerra**: una razzia azzera per 14 giorni la produzione del villaggio; un assedio blocca il consumo e le scorte della città (fame: la guarnigione perde uomini se le scorte vanno a 0, e questo si collega all'assedio V5b).
4. **Costo dell'esercito**:
   - paga per truppa × (1 + 0,02 × uomini oltre i 40) (i grandi eserciti costano più che in proporzione);
   - **foraggio**: ogni cavaliere consuma 2 viveri al giorno invece di 1;
   - le truppe di grado alto chiedono anche una quota di bottino (ridotta per i compagni).
5. **Leve di difficoltà**: generosa/giusta/avara = prezzi ×0,85/1/1,2, paghe ×0,85/1/1,15, rendite ×1,2/1/0,85. Consumi leggeri/normali/duri = ×0,8/1/1,25.
6. **Pannelli** (in questo passo): nel mercato la freccia della tendenza (su/giù negli ultimi 7 giorni); in Compagnia «Costo al giorno: paghe X · viveri Y · foraggio Z».
7. **Solo nei mondi `s.geo===2`.** Produzione e scorte con un ascoltatore di `giorno`; costi con `VEN.molt` composto (`paga`, `rendita`, `viveri` per il foraggio); prezzi nella funzione dei prezzi, dietro `s.geo===2`. I numeri stanno in `VDAT.ECO`, in testa alla parte nuova di `28kb`.

## Stato e contratti

`l.sc` (scorte, già esistono) ora variano col tempo; `l.prod` facoltativo; `VEN.tendenza(s,lid,m)` → −1/0/1; `VEN.costoGiorno(s)` → `{paghe,viveri,foraggio}`.

## Prove

`tests/test_ven_p36_lento.js` (bot a 1 anno su mondi `opz.geo=2`, 6 semi):
- dopo una razzia il prezzo del grano nella città più vicina sale di almeno il 20% entro 7 giorni e torna entro il 10% dopo 30 giorni di pace;
- in autunno il grano costa meno che in inverno in 6 semi su 6;
- un esercito di 150 uomini costa al giorno più di 3× uno da 50;
- il bot accorto non va in rovina con Condottiero; con «avara + duri» guadagna almeno il 30% in meno;
- il bot mercante (comprare basso, vendere alto) non guadagna più del 50% del bot combattente (niente rendita infinita);
- mondi vecchi: impronta identica.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fatto quando

Prove verdi; nella PR la tabella dei prezzi del grano su un anno di un seme; le «Regole per il giocatore» scritte in questo file («L'economia»).
