---
passo: 09
titolo: L'incontro: due stendardi faccia a faccia
fase: 3
area: viste
dopo: [04]
agente: programmer
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24hwd-ven-scontro.js
  - src/css/39jc-ven-campo.css
  - src/js/motori/28kf-ven-anteprima.js
  - src/js/app/24hwe-ven-tv.js
---

# Passo 09 — L'incontro: due stendardi faccia a faccia

**In breve.** Prima di combattere si capisce contro chi, dove, con che forze e con che carattere; le scelte sono generiche, così i passi del mondo aggiungono la sfida, la strategia e il rango senza toccare la vista.

## Scopo

Prima di combattere si capisce contro chi, dove, con che forze e che carattere ha il comandante nemico; la scelta è a un tocco.

## Oggi

Titolo col nome del nemico, una riga «26 uomini · 18 fanti, 8 tiratori, 0 cavalieri», la barra delle forze, e due riquadri quasi vuoti con i bottoni a destra (Combatti, Risolvi, Ritirata, Paga il pedaggio).

## Leggi prima

`app/24hwd-ven-scontro.js` (`incontroH`), `motori/28kc-ven-scontro.js` (`schieramenti`, `campo`), `VEN.forza`, `VEN.rg` (passo 04), `VDAT.TRATTI`, stendardi in `app/24ht-ven-arte.js` (`Stendardi`) per i colori. Non dipende dal passo 08 (stessa fase): i fogli dal basso esistono già come `.vn-pan`.

## Decisioni

1. **Faccia a faccia**: due colonne. Ognuna: stendardo disegnato in CSS (due colori del regno da `VEN.rg`, al centro l'iniziale), nome della schiera, comandante con l'indole come parola («prudente», «prode»…; da `VDAT.TRATTI`, solo se è un signore), e tre numeri con icona: fanti, tiratori, cavalieri. Sotto, centrata, la barra delle forze con la parola dell'esito probabile (già c'è: «In vantaggio»).
2. **Il campo**: una riga con icone: terreno (pianura/bosco/colline), strada, costa, meteo, ora («pomeriggio»), letti da `VEN.campo(s).scena` e `ora`. Se c'è un'altura o un bosco nelle zone che il motore estrarrà, non si dice (sorpresa del campo).
3. **Scelte**: Combatti (ottone) e le altre di legno in una griglia a due colonne da 56 px, nell'ordine di `scelte`. Le scelte strategiche del passo 32 (`k` che comincia con `strat:`) stanno in una riga a parte, «Consiglio», sopra la griglia.
4. Con la TV accesa la stessa carta va sulla TV in grande (`incontroTvH()` in `24hwe-ven-tv.js`); i telefoni mostrano solo la fascia delle scelte.

## Stato e contratti

Nel file `motori/28kf-ven-anteprima.js`, creato vuoto dal passo 04 con il gancio `anteprima` già chiamato: `VEN.anteprima(s)` → `{noi:{nome,col,f,t,c,capo}, loro:{nome,col,f,t,c,capo,indole,rango?,dott?,stima?}, scena, ora, avvisi:[tx], scelte:[{k,tx,info,ok,perche,oro?}]}`. È pura e non salva nessun campo. Oggi `scelte` contiene `attacca`, `risolvi`, `ritirata`, `paga`, con gli stessi `data-v` (`scegli:K`).

**La vista è generica, così i passi del mondo non la toccano più**:
- ogni voce di `scelte` diventa un bottone, con `info` nell'infobox; quelle con `ok:false` si vedono grigie con il `perche`;
- `rango` diventa pallini da 0 a 5 con il nome; `stima` (es. «circa 120») sostituisce i numeri esatti quando c'è;
- `avvisi` diventa una riga d'allarme.

I passi 35 (sfida), 32 (strategia) e 12 (rango) aggiungono solo dati all'anteprima.

## Ordine di lavoro

1. `anteprima` + test (contro predoni: `indole` assente; contro un signore: `indole` = il suo tratto; f+t+c = uomini sani).
2. `incontroH`.
3. TV.

## Prove

Gli scenari esistenti restano verdi (i selettori `scegli:attacca` e `scegli:paga` non cambiano). Scenario `scenari/p09.py`: nell'incontro ci sono due `.vn-stend` e un solo ottone. Screenshot dell'incontro a 390 px.

## Fuori scopo

La sfida (passo 35) aggiunge il suo bottone da sé.

## Fatto quando

Scenario verde, screenshot senza riquadri vuoti.
