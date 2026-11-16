---
passo: 23
titolo: Molti regni alla nascita
fase: 6
area: mondo
dopo: [07, 04]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28ki-ven-regni.js
---

# Passo 23 — Molti regni alla nascita

**In breve.** Il mondo nuovo nasce frammentato: 9–12 signorie, comuni e marche, ognuna di una delle cinque culture.

**Acceso da.** mondi nuovi (`s.geo===2`); per tutti al passo 38.

## Scopo

Partire da un mosaico di piccoli stati, che poi si accorperanno (passo 27). La mappa politica diventa una storia.

## Leggi prima

`docs/passi/04-ganci.md` (`regni/rg/cult`, gancio `nuovo`); `motori/28kg-ven-geografia.js` (luoghi e strade del mondo nuovo); `VDAT.FAZ` (le cinque culture); la creazione dei signori in `VEN.nuovo` (`grep -n "s.sig.push" src/js/motori/28k*.js`).

## Decisioni

1. **Solo nei mondi `s.geo===2`.** Tutto in `28ki-ven-regni.js`. `s.rg={id:{id,nome,breve,cult,col,col2,re,vivo:true,nato:0}}`. Il file sostituisce `VEN.regni`, `VEN.rg` e `VEN.cult` componendo: senza `s.rg` restituiscono i cinque regni di oggi.
2. **Alla nascita** (gancio `nuovo`): un regno per città, cioè 9–10 in un mondo ampio e 11–12 in uno vasto. La cultura dipende dalla zona (`VDAT.CULT_CLIMA` in testa al file): nord → Altavento o Ferropietra, coste → Maralta, boschi → Selvamara, pianure centrali → Valdoro. Il nome è una forma («Signoria di», «Marca di», «Comune di», «Principato di», «Libera città di») più il nome del capoluogo. I colori vengono dalla tavolozza della cultura, variati in 5 toni, e due regni confinanti non hanno mai lo stesso.
3. **Territori**: si assegnano per costo di cammino partendo da tutti i capoluoghi insieme (spareggi per indice). Castelli e villaggi vanno al regno del loro territorio; `l.faz` è l'id del regno.
4. **Signori**: 2–4 per regno, con lo stesso totale di oggi; ogni regno ha un re, il suo primo signore. Gli id dei regni sono `r0…rN` (stringhe); gli id `val`, `sel`… restano solo nei mondi vecchi.
5. Se un punto del codice usa ancora l'id del regno come chiave di `D.FAZ` (sfuggito al passo 04), **non correggerlo qui**: elencalo nella PR e fermati.

## Prove

- `tests/test_ven_p23.js`:
  - al giorno 0 ci sono 9–12 regni (11–12 in un mondo vasto);
  - ogni città è capoluogo di un solo regno;
  - ogni luogo di un regno è raggiungibile dentro il suo territorio;
  - due regni confinanti hanno colori diversi.
- Mondi vecchi: impronta identica.
- Il tempo di `VEN.nuovo` cresce al massimo del 30%.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

L'unificazione (passo 27).

## Fatto quando

Prove verdi.
