---
passo: 34
titolo: Rilascio 3: comandanti
fase: 9
area: rilascio
dopo: [29, 12, 21, 25, 30, 32]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte+visivo
file:
  - src/js/motori/28jc-ven-dati-mondo.js
  - tools/avventura/torneo-comandanti.js
  - docs/rules/ventura.md
  - src/js/app/07d-regole.js
  - docs/moduli/ventura.md
  - docs/rilasci.md
  - docs/passi/impronte/consiglio.txt
---

# Passo 34 — Rilascio 3: comandanti

**In breve.** Si accendono il consiglio di guerra, il rango dei comandanti e la strategia prima della battaglia.

## Scopo

Girare l'interruttore e provare l'insieme come lo vedrà il giocatore. È un passo piccolo ma decisivo: dopo l'unione la novità è online per tutti.

## Leggi prima

`docs/passi/LEGGIMI.md` (sezione «Rilasci»); i «Fatto quando» e le «Regole per il giocatore» dei passi 12, 21, 25, 30, 32.

## Decisioni

1. `VDAT.ACCESO.consiglio=true` in `28jc-ven-dati-mondo.js`.
2. Gli ascoltatori dei passi 12 e 32 controllano già l'interruttore: non c'è altro codice da accendere. Scrivi `tools/avventura/torneo-comandanti.js` (40 righe): i ranghi da 0 a 5 giocano tra loro a truppe pari su 6 terreni, e la tabella va nella PR.
3. **Regole**: copia in `docs/rules/ventura.md`, una sezione per passo e senza riscrivere le altre, e in `RULES.ventura` (`07d-regole.js`, voci brevi) le «Regole per il giocatore» dei passi 12, 21, 25, 30, 32.
4. `docs/moduli/ventura.md`: aggiorna lo stato. `docs/rilasci.md`: una sezione «Rilascio 3: comandanti» con cosa cambia per chi gioca (5–8 righe), da usare come nota del rilascio.
5. **Impronta accesa**: `node tools/avventura/impronta.js --acceso consiglio > docs/passi/impronte/consiglio.txt`. Da qui in poi `--controlla` verifica anche questa.

## Prove

- `npm test` intero.
- Torneo dei comandanti: sulla diagonale (rango contro se stesso) tra il 40 e il 60%; ogni rango batte il precedente tra il 58 e il 75%.
- Bot del mondo a 120 giorni: nessun seme in rovina; il bot accorto vince ancora più della metà delle battaglie che sceglie di combattere.
- Scenario `scenari/p34.py`, partita guidata contro un signore di rango ≥ 3 su un campo con un'altura: dopo 20 s i suoi tiratori sono saliti (screenshot); l'incontro mostra il rango e le scelte di strategia.
- Salvataggi vecchi: si aprono.

## Se qualcosa non va

Si spegne di nuovo l'interruttore nella stessa PR e si apre una issue GitHub che indica il passo da correggere. Qui non si corregge.

## Fatto quando

Le prove d'insieme sono verdi e la nota del rilascio è scritta.
