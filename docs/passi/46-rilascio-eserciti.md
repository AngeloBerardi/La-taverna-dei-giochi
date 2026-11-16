---
passo: 46
titolo: Rilascio 5: eserciti e mondo vivo
fase: 12
area: rilascio
dopo: [40, 41, 43, 44, 45, 34]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte+visivo
file:
  - src/js/motori/28jc-ven-dati-mondo.js
  - docs/rules/ventura.md
  - src/js/app/07d-regole.js
  - docs/moduli/ventura.md
  - docs/rilasci.md
  - docs/passi/impronte/eserciti.txt
---

# Passo 46 — Rilascio 5: eserciti e mondo vivo

**In breve.** Si accendono gli eserciti dei regni; feudi, affari e incontri del crocevia, già visibili, entrano nelle regole.

## Scopo

Girare l'interruttore e provare l'insieme come lo vedrà il giocatore. È un passo piccolo ma decisivo: dopo l'unione la novità è online per tutti.

## Leggi prima

`docs/passi/LEGGIMI.md` (sezione «Rilasci»); i «Fatto quando» e le «Regole per il giocatore» dei passi 40, 41, 43, 44.

## Decisioni

1. `VDAT.ACCESO.eserciti=true` in `28jc-ven-dati-mondo.js`.
2. Con un esercito in battaglia, un ascoltatore di `scheda` (passo 40) somma alleati e nemici dell'esercito nelle ondate e nella riserva, e il maresciallo diventa `capoB`. Qui si accende soltanto.
3. **Regole**: copia in `docs/rules/ventura.md`, una sezione per passo e senza riscrivere le altre, e in `RULES.ventura` (`07d-regole.js`, voci brevi) le «Regole per il giocatore» dei passi 40, 41, 43, 44.
4. `docs/moduli/ventura.md`: aggiorna lo stato. `docs/rilasci.md`: una sezione «Rilascio 5: eserciti e mondo vivo» con cosa cambia per chi gioca (5–8 righe), da usare come nota del rilascio.
5. **Impronta accesa**: `node tools/avventura/impronta.js --acceso eserciti > docs/passi/impronte/eserciti.txt`. Da qui in poi `--controlla` verifica anche questa.

## Prove

- `npm test` intero.
- Bot a 120 giorni: in guerra almeno un esercito per regno in 6 semi su 6; nessuna valanga di conquiste.
- Scenario `scenari/p46.py`: convocazione → adunata → battaglia con alleati, con almeno 300 uomini in tutto. Screenshot.
- Banco della battaglia più grande vista dal bot, nella PR.

## Se qualcosa non va

Si spegne di nuovo l'interruttore nella stessa PR e si apre una issue GitHub che indica il passo da correggere. Qui non si corregge.

## Fatto quando

Le prove d'insieme sono verdi e la nota del rilascio è scritta.
