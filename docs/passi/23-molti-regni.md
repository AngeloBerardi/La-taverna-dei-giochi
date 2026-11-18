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
  - src/js/motori/28kg-ven-geografia.js
  - tests/test_ven_p07.js
  - src/js/motori/28k-ven-mondo.js
  - src/js/motori/28ka-ven-ia.js
  - src/js/motori/28kb-ven-economia.js
  - src/js/motori/28kc-ven-scontro.js
---

# Passo 23 — Molti regni alla nascita

**In breve.** Il mondo nuovo nasce frammentato: 9–12 signorie, comuni e marche, ognuna di una delle cinque culture.

**Acceso da.** mondi nuovi (`s.geo===2`); per tutti al passo 38.

## Scopo

Partire da un mosaico di piccoli stati, che poi si accorperanno (passo 27). La mappa politica diventa una storia.

## Leggi prima

`docs/passi/04-ganci.md` (`regni/rg/cult`, gancio `nuovo`); `motori/28kg-ven-geografia.js` (luoghi e strade del mondo nuovo, città alle righe di `REG.forEach`); la creazione dei signori, delle guerre e di `s.rel` in `VEN.nuovo` (`grep -n "s.sig.push\|s.guerra\|s.rel\[f\]" src/js/motori/28k-ven-mondo.js`).

## Decisioni

*Correzione del giudice (PR #169): la geografia del passo 07 fa 5 città, una per zona. Il capoluogo di un regno resta una città (il passo 27 conta le città), quindi questo passo aggiunge le città che mancano in `28kg` e sistema i punti che usavano l'id del regno come cultura.*

1. **Solo nei mondi `s.geo===2`.** I regni vivono in `28ki-ven-regni.js`: `s.rg={id:{id,nome,breve,cult,col,col2,re,vivo:true,nato:0}}`. Il file sostituisce `VEN.regni`, `VEN.rg` e `VEN.cult` componendo: senza `s.rg` (o per un id che non è in `s.rg`) restituiscono quello di prima. `VEN.cult(s,'rK')===s.rg.rK.cult`.
2. **Città in più** (`28kg`): `VDAT.GEO.CITTA_PIU={ampio:[4,5],vasto:[6,7]}`; il numero lo estrae il seme, quindi 9–10 città nel mondo ampio e 11–12 nel vasto. Le 5 città di oggi e la regione provvisoria `M.R` (la zona di cultura, indice di `D.REGNI`) **non cambiano**. Le città in più si mettono dopo il calcolo di `M.R`, prima di castelli e villaggi: le zone si scorrono a turno da `seme%5`; in ogni zona si sceglie la cella migliore con lo stesso punteggio di oggi (foce, confluenza, riva di lago grande, baia), a ≥ G/8 celle da ogni città; se la zona non ne ha, la migliore di tutto il continente. `l.faz` della città nuova è la sua zona. Castelli, villaggi, porti e strade restano le regole di oggi (le città nuove entrano nei `capi` dei villaggi e nel grafo delle strade).
3. **Alla nascita** (gancio `nuovo`): un regno per città, id `r0…rN` nell'ordine delle città in `s.l`. La cultura è la zona della città (il suo `l.faz` prima del gancio): così ogni cultura ha almeno un regno. Il nome è una forma («Signoria di», «Marca di», «Comune di», «Principato di», «Libera città di», estratta dal seme) più il nome del capoluogo; `breve` è il nome del capoluogo. I colori partono da `col/col2` del `rg` precedente della cultura, variati in 5 toni (solo somme e prodotti); i toni si danno per indice di regno scegliendo il primo non usato da un confinante della stessa cultura.
4. **Territori**: ricerca di costo minimo da tutti i capoluoghi insieme (spareggi per indice di cella), costo di una cella = 1/velocità di `VEN.molt` di oggi, mare e monte costano 6. Castelli, villaggi e ogni altro luogo con `l.faz` di un regno passano al regno della loro cella; `l.faz` è l'id del regno. Se `l.capo` punta a un luogo di un altro regno, diventa il capoluogo del suo regno. Covi, rovine e `tu` non cambiano.
5. **Signori**: si tengono i 25 creati da `VEN.nuovo` (stesso totale). Quelli di una cultura si dividono a turno tra i regni di quella cultura in ordine di id (1–5 per regno); `sg.cult` = cultura, `sg.faz`, la casa (un luogo murato del regno, il capoluogo per il primo), la loro schiera (`p.faz`, `dentro`, posizione). Il primo di ogni regno ha `re:true`, gli altri `false`; `rg.re` è il suo nome. Le truppe non si rifanno (gli id delle truppe sono già della cultura). Le carovane già nate prendono il regno della loro `casa`.
6. **Diplomazia di partenza**: `s.rel` e `s.guerra` si rifanno sugli id nuovi: `s.rel[rK]=0` per ogni regno, due guerre estratte dal seme tra coppie di regni **confinanti** (territori che si toccano).
7. **La cultura non è il regno.** Dove oggi l'id del regno fa da chiave di cultura si passa da `VEN.cult(s,f)`; nei mondi vecchi `VEN.cult(s,f)===f`, quindi nulla cambia. Sono questi e solo questi:
   - `28k`: `cultura` (ripiego `p.faz` → `VEN.cult(s,p.faz)`); `M0` legge `regni(s)` (la funzione di base del file, cioè la zona di cultura) invece di `VEN.regni(s)`;
   - `28ka`: `nasceCarovana` (`leva(VEN.cult(s,l.faz),…)`), `giornoNuovo` (`D.PRODUCE[…]` delle scorte e `l.faz+'_'` delle guarnigioni);
   - `28kb`: `rinnova` (`D.BOTTEGA[…]`, `D.PRODUCE[…]`), `faiNucleo` (l'ingaggio `f+'_'`);
   - `28kc`: `esitoBase` (`D.BOTTEGA[p.faz]`).
   Se ne trovi un altro, **non correggerlo**: elencalo nella PR e fermati.

## Prove

- `tests/test_ven_p07.js`: `tipi.citta` tra 9 e 10 nel mondo ampio e tra 11 e 12 nel vasto (al posto di `=== 5`), e ogni zona di `D.REGNI` ha almeno una città; le altre prove del passo 07 restano verdi, e `test_ven_p07_lento.js` con la mediana ≤ 500 ms per G = 240.
- `tests/test_ven_p23.js`, 6 semi ampi e 4 vasti:
  - al giorno 0 ci sono 9–10 regni nel mondo ampio, 11–12 nel vasto; ogni città è capoluogo di un solo regno e ogni regno ha esattamente una città;
  - ogni cultura ha almeno un regno; ogni regno ha un solo re; i signori sono 25;
  - ogni luogo di un regno è raggiungibile dentro il suo territorio;
  - due regni confinanti hanno colori diversi;
  - le due guerre di partenza sono tra confinanti;
  - 30 giorni di gioco senza errori e senza truppe con id fuori da `D.TR` (nessun `rK_…`).
- Mondi vecchi: impronta identica (`node tools/avventura/impronta.js --controlla`); `test_ven_p04`, `test_ven_p17` e i loro lenti verdi.
- Il gancio `nuovo` di `28ki` costa al massimo il 30% di `VEN.nuovo` a mappa già in cache (mediana di 5 semi).
- Nella PR: le mappe di un seme ampio e uno vasto da `node tools/avventura/mappa-png.js`.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

L'unificazione (passo 27); disegno dei confini sulla mappa.

## Fatto quando

Prove verdi.
