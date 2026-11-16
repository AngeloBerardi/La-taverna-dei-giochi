---
passo: 38
titolo: Rilascio 4: nuova campagna
fase: 10
area: rilascio
dopo: [07, 14, 17, 18, 23, 24, 27, 33, 35, 36]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte+visivo
file:
  - src/js/motori/28jc-ven-dati-mondo.js
  - src/js/app/24ha-avventura.js
  - docs/rules/ventura.md
  - src/js/app/07d-regole.js
  - docs/moduli/ventura.md
  - docs/rilasci.md
  - docs/passi/impronte/mondo2.txt
---

# Passo 38 — Rilascio 4: nuova campagna

**In breve.** Le partite nuove nascono nel mondo nuovo: geografia, molti regni che si accorpano, partenza a caso, stagioni ed economia, con la difficoltà scelta. Le partite vecchie continuano come sono.

## Scopo

Girare l'interruttore e provare l'insieme come lo vedrà il giocatore. È un passo piccolo ma decisivo: dopo l'unione la novità è online per tutti.

## Leggi prima

`docs/passi/LEGGIMI.md` (sezione «Rilasci»); i «Fatto quando» e le «Regole per il giocatore» dei passi 07, 14, 17, 23, 27, 33, 35, 36.

## Decisioni

1. `VDAT.ACCESO.mondo2=true` in `28jc-ven-dati-mondo.js`.
2. Con l'interruttore acceso `VEN.nuovo` mette `s.geo=2` (lo fa già, dal passo 04), e la vista salta la scelta del regno (passo 18). Nella carta «Riprendi» (`24ha`), per i mondi vecchi, una nota piccola: «Mondo della prima edizione».
3. **Regole**: copia in `docs/rules/ventura.md`, una sezione per passo e senza riscrivere le altre, e in `RULES.ventura` (`07d-regole.js`, voci brevi) le «Regole per il giocatore» dei passi 07, 14, 17, 23, 27, 33, 35, 36.
4. `docs/moduli/ventura.md`: aggiorna lo stato. `docs/rilasci.md`: una sezione «Rilascio 4: nuova campagna» con cosa cambia per chi gioca (5–8 righe), da usare come nota del rilascio.
5. **Impronta accesa**: `node tools/avventura/impronta.js --acceso mondo2 > docs/passi/impronte/mondo2.txt`. Da qui in poi `--controlla` verifica anche questa.

## Prove

- `npm test` intero.
- Bot a 1 anno su 6 semi per ognuno dei tre preset: nessun seme in rovina con Recluta e Condottiero; regni vivi al giorno 120 tra 4 e 7.
- Salvataggi di `tests/fixture/ven/`: si aprono, giocano 10 giorni e si risalvano; mappa e regni restano quelli vecchi.
- Scenario `scenari/p38.py`, partita guidata: menu → Nuova campagna (Leggenda) → apertura → 5 giorni di marcia → inverno forzato → battaglia. Quattro screenshot a 390 px.
- Compagnia a due telefoni: stesso mondo, partenze vicine.

## Se qualcosa non va

Si spegne di nuovo l'interruttore nella stessa PR e si apre una issue GitHub che indica il passo da correggere. Qui non si corregge.

## Fatto quando

Le prove d'insieme sono verdi e la nota del rilascio è scritta.
