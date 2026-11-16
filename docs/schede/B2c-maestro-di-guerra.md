# B2c — Il maestro di guerra: rango 5, memoria e inganno

**Binario** B (motore) con un tocco nel binario C (memoria nel signore, al massimo 20 righe in `esito`). **Dopo** B2b e B9. **Modello: forte.**

**Scopo.** I grandi comandanti (re, marescialli leggendari, la Volpe alla fine) ti conoscono. Ricordano come li hai battuti e preparano la contromossa. Fingono. Scelgono il momento. Batterli è un'impresa da raccontare.

**Leggi prima.** `motori/28la-ven-consiglio.js`, `tools/avventura/giocatore-prova.js`, `VEN.esito` e `s.sig[i].mem` (binario C dopo R1), B9.

**Decisioni già prese.**
1. **Memoria delle tue tattiche**. `riepilogo.tat` (motore) conta cosa hai fatto in battaglia:
   - `cavPrima`: la tua cavalleria ha colpito per prima;
   - `alt`: i tuoi tiratori sull'altura;
   - `fianco`: una tua ondata è entrata di fianco;
   - `capAvanti`: il tuo capitano in prima linea;
   - `serrata`: i fanti sempre in serrata;
   - `ondataPresto`: un'ondata prima dell'istante 300.
   In `esito` (binario C) i contatori si sommano in `sg.mem.tat` del signore che ha combattuto, e in `s.volpe.tat` per la Volpe.
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
4. Le contromosse si **annunciano** nella cronaca dopo la battaglia («Il re aveva imparato le tue cariche»). Nel binario F, una frase per contromossa.

**Prove** (`tests/test_ven_tattica.js`, lente):
- Il giocatore di prova con `cavPrima` contro rango 5 **senza** memoria vince X; **con** memoria vince almeno 15 punti percentuali in meno (40 semi).
- Rango 5 contro 4 a truppe pari: 58–75%.
- `finta-rotta`: con i tuoi tiratori sull'altura, almeno un tuo reparto la lascia per inseguire in ≥ 50% dei semi; il reparto finto poi combatte.
- La memoria cresce solo per il signore che ha combattuto; i salvataggi senza `tat` si aprono.

**Fuori scopo.** Altre forme di memoria (diplomazia).

**Fatto quando.** Prove verdi, tabella nella PR.
