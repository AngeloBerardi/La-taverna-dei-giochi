# T5 — Dorso classico che resta classico, nome nuovo della campagna

> **Domanda all'utente (una):** il nome proposto è **«Cronache del Crocevia»**. Alternative pronte: «La Lunga Via», «Storie della Locanda». Se non dici nulla si usa il primo.

**Scopo.** In bottega l'anteprima del dorso classico non cambia più quando ne indossi un altro. La campagna a capitoli ha un nome che non si confonde con «Compagnia di ventura».

**Leggi prima.** `css/33-dorsi.css`, `app/24b-bottega.js` (`Shop.html`, riga della carta d'anteprima), `app/07-nucleo.js` (`GAMES`, voce `avventura`), `app/07e-lobby-falo.js` (`TVG`).

**Causa del dorso (verificata).** Le regole sono `.card.back.d-notte,[data-dorso=notte] .card.back{…}`: la seconda metà colora *ogni* `.card.back` della pagina quando `<html data-dorso>` è impostato. L'anteprima del classico in bottega non ha una classe `d-…`, quindi prende il dorso indossato.

**Decisioni già prese.**
1. L'anteprima del classico riceve la classe `d-classico`; in `33-dorsi.css`, **in fondo al file**, una regola `.card.back.d-classico` che rimette i valori di base (`--cb`, `--cb2`, bordo e fondo copiati da dove è definito `.card.back`, spostandoli in variabili per non duplicare il blocco: `npm run struttura` blocca le copie).
2. Ogni anteprima di bottega ha sempre la sua classe `d-<id>`: nessuna dipende da `<html data-dorso>`.
3. Controllo uguale per gli altri cosmetici con anteprima (tavoli, temi): se usano lo stesso schema, stessa cura.
4. Nome: `GAMES` `avventura` → `name:'Cronache del Crocevia'`; `TVG.avventura` → `'CRONACHE'`. «Compagnia di ventura» resta. Nei testi visibili «cantare/cantari» come nome del gioco diventa «cronaca/cronache» (es. «Non riesco ad aprire il cantare» → «…la cronaca»); il *cantare* inteso come riassunto in versi dentro il racconto resta. I commenti nel codice e gli `id` non si toccano.
5. Il nome si legge con `GN('avventura')`: dove è scritto a mano in una vista, sostituire.

**Passi.** 1) `24b-bottega.js` + `33-dorsi.css`. 2) `07-nucleo.js`, `07e-lobby-falo.js`. 3) `grep -rn "Cantari di Ventura\|cantare" src/js/app src/css src/avventura docs/rules README.md` e sistemare solo i testi visibili; `07d-regole.js` compreso.

**Prove.** Scenario browser nuovo `bottega_dorso` (`sc_bottega_dorso` in `tools/test-browser/run.py`): indossa «notte» → il colore di fondo calcolato dell'anteprima `d-classico` è diverso da quello di `d-notte` e uguale a quello di prima del cambio. `grep -rn "Cantari di Ventura" src/js/app/07*.js src/js/app/24ha*.js` → nessuna riga in stringhe visibili. `npm run verifica`.

**Fuori scopo.** Dorsi nuovi; rinominare file e `id`.

**Fatto quando.** Le due prove passano e il titolo nuovo compare in elenco giochi, pagina Avventura e TV.
