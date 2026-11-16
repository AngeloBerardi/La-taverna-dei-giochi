---
passo: 30
titolo: Il maestro di guerra: rango 5, memoria e inganno
fase: 8
area: battaglia
dopo: [25, 12]
agente: programmer
modello: opus
impegno: alto
controllo: forte
file:
  - src/js/motori/28la-ven-consiglio.js
  - src/js/motori/28kj-ven-rango.js
  - src/js/motori/28ja-ven-voci.js
---

# Passo 30 — Il maestro di guerra: rango 5, memoria e inganno

**In breve.** I grandi comandanti ricordano come li hai battuti e preparano la contromossa; fingono; scelgono il momento.

**Acceso da.** come il passo 21 (`rango` nella scheda, rilascio 3).

## Scopo

I grandi comandanti (re, marescialli leggendari, la Volpe alla fine) ti conoscono. Ricordano come li hai battuti e preparano la contromossa. Fingono. Scelgono il momento. Batterli è un'impresa da raccontare.

## Leggi prima

`motori/28la-ven-consiglio.js`, `tools/avventura/giocatore-prova.js`, il gancio `battaglia` (passo 04) e `28kj-ven-rango.js` (passo 12).

## Decisioni

1. **Memoria delle tue tattiche**. `riepilogo.tat` (motore) conta cosa hai fatto in battaglia:
   - `cavPrima`: la tua cavalleria ha colpito per prima;
   - `alt`: i tuoi tiratori sull'altura;
   - `fianco`: una tua ondata è entrata di fianco;
   - `capAvanti`: il tuo capitano in prima linea;
   - `serrata`: i fanti sempre in serrata;
   - `ondataPresto`: un'ondata prima dell'istante 300.
   Un ascoltatore di `battaglia` in `28kj` somma i contatori in `sg.mem.tat` del signore che ha combattuto (in `s.volpe.tat` per la Volpe); l'ascoltatore di `scheda` del passo 12 li passa già come `memo`.
2. **Contromosse di rango 5** (pesi aggiunti nel consiglio, in base a `scheda.memo` = `tat` del comandante nemico):
   | Tua abitudine | Contromossa |
   |---|---|
   | `cavPrima` | picche nascoste in serrata dietro un'esca |
   | `alt` | si schiera fuori gittata dall'altura e la aggira con i cavalieri |
   | `fianco` | tiene un reparto `copri` su quel fianco |
   | `capAvanti` | `caccia` con peso ×2 e un'ondata sul capitano |
   | `ondataPresto` | `riserva` più lunga, poi controcarica sulla tua ondata stanca |
   Un'abitudine conta solo se è comparsa in almeno metà delle battaglie con lui (minimo 2).
3. **Inganno** (rango 5):
   - `finta-rotta`: un reparto simula la rotta (corre via con `st='vivo'`) per tirare i tuoi giù dall'altura; dopo 60 istanti si gira.
   - `ombre`: nello schieramento mostra solo il 70% dei reparti (gli altri nascosti nelle ondate) quando è primo a schierarsi.
   - `tempo`: la decisione delle ondate guarda la fatica media dei tuoi reparti (> 55).
4. Le contromosse si **annunciano** nella cronaca dopo la battaglia («Il re aveva imparato le tue cariche»). Le frasi, una per contromossa, vanno in `VVOC.CONTRO` (`28ja`) e le scrivi tu in questo passo.

## Prove

`tests/test_ven_p30_lento.js`:
- Il giocatore di prova con `cavPrima` contro rango 5 **senza** memoria vince una quota V (misurala); **con** memoria almeno 15 punti percentuali meno di V (40 semi).
- Rango 5 contro 4 a truppe pari: 58–75%.
- `finta-rotta`: con i tuoi tiratori sull'altura, almeno un tuo reparto la lascia per inseguire in ≥ 50% dei semi; il reparto finto poi combatte.
- La memoria cresce solo per il signore che ha combattuto; i salvataggi senza `tat` si aprono.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

Altre forme di memoria (diplomazia).

## Fatto quando

Prove verdi, tabella nella PR.
