---
passo: 29
titolo: Rilascio 2: grandi battaglie
fase: 8
area: rilascio
dopo: [06, 11, 16, 19, 22, 26, 28, 47]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte+visivo
file:
  - src/js/motori/28jc-ven-dati-mondo.js
  - src/js/motori/28kr-ven-accensioni.js
  - docs/rules/ventura.md
  - src/js/app/07d-regole.js
  - docs/moduli/ventura.md
  - docs/rilasci.md
  - docs/passi/impronte/grandi.txt
---

# Passo 29 — Rilascio 2: grandi battaglie

**In breve.** Si accendono le battaglie grandi: reparti, settori, ondate, morale per reparto, fatica, frecce, stendardo nemico e doti dei compagni.

## Scopo

Girare l'interruttore e provare l'insieme come lo vedrà il giocatore. È un passo piccolo ma decisivo: dopo l'unione la novità è online per tutti.

## Leggi prima

`docs/passi/LEGGIMI.md` (sezione «Rilasci»); i «Fatto quando» e le «Regole per il giocatore» dei passi 06, 11, 16, 19, 22, 26, 28, 47.

## Decisioni

1. `VDAT.ACCESO.grandi=true` in `28jc-ven-dati-mondo.js`.
2. In `28kr-ven-accensioni.js`, un ascoltatore di `scheda` che agisce solo se `ACCESO.grandi`:
   - nelle battaglie del giocatore mette `max`, `W` e `H` da `VCAM.taglia(VEN.opz(s).taglia)` (quelle tra IA restano su `media`);
   - aggiunge `reparti:true` e `ondate:true`;
   - mette `capoB` se il primo nemico è un signore o la Volpe, con i numeri del passo 16.
   In compagnia la taglia è quella del mondo, cioè dell'oste.
3. **Regole**: copia in `docs/rules/ventura.md`, una sezione per passo e senza riscrivere le altre, e in `RULES.ventura` (`07d-regole.js`, voci brevi) le «Regole per il giocatore» dei passi 06, 11, 16, 19, 22, 26, 28, 47.
4. `docs/moduli/ventura.md`: aggiorna lo stato. `docs/rilasci.md`: una sezione «Rilascio 2: grandi battaglie» con cosa cambia per chi gioca (5–8 righe), da usare come nota del rilascio.
5. **Impronta accesa**: `node tools/avventura/impronta.js --acceso grandi > docs/passi/impronte/grandi.txt`. Da qui in poi `--controlla` verifica anche questa.

## Prove

- `npm test` intero, lenti compresi.
- Bot a 60 e a 120 giorni: nessun seme in rovina; perdite medie per battaglia non oltre 1,5 volte quelle di prima (tabella nella PR).
- Scenari esistenti e `scenari/p19.py`, `p22.py`, `p26.py` verdi.
- Scenario `scenari/p29.py`, una partita guidata: incontro con un signore da 150 → schieramento con una divisione e un'ondata di fianco → battaglia → esito. Tre screenshot a 390 px.
- Compagnia a due telefoni con la taglia dell'oste.
- Salvataggi di `tests/fixture/ven/`: si aprono e combattono.

## Se qualcosa non va

Si spegne di nuovo l'interruttore nella stessa PR e si apre una issue GitHub che indica il passo da correggere. Qui non si corregge.

## Fatto quando

Le prove d'insieme sono verdi e la nota del rilascio è scritta.
