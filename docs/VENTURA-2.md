# Cronache del Crocevia 2 — «Il Condottiero»

Progetto della prossima major release della pagina Avventura, soprattutto della **Compagnia di ventura**. L'ha scritto l'architetto il 16 novembre 2026, dopo le PR 123–138 e una partita a 390×844.

Il lavoro è diviso in **46 passi in 12 fasi**: come si eseguono, con quali modelli e controlli, sta in `docs/passi/LEGGIMI.md`; i prompt in `docs/passi/PROMPT.md`. Questo file dice **perché**.

## Dove siamo
**1. Le battaglie sono piccole e senza testa.**
- In campo stanno al massimo 34 uomini per lato (`VCAM.C.MAX`), ma i signori girano con 95–190 uomini: il resto entra a gocce di 10 dal bordo.
- Ci sono tre gruppi fissi. Non si divide, non si sceglie dove schierarsi, non si decide quando mandare le riserve.
- Il nemico ha un solo copione (`VCAM.comanda`: avvicinarsi, poi tutti alla carica): un signore veterano combatte come un predone.
- A truppe pari, chi ha il capitano vince 38 volte su 40.
- La telecamera segue il capitano e le schiere escono dallo schermo.

**2. L'interfaccia parla troppo e mostra poco.** Ci sono numeri senza nome, pannelli che coprono due terzi della mappa, otto ottoni per schermata, riquadri vuoti nell'incontro e comandi che occupano un quarto del campo. La mappa si trascina nel vuoto.

**3. Il mondo è largo ma poco profondo.**
- La mappa (128×128) è rumore senza logica: porti appena vicino al mare, niente fiumi né laghi.
- Ci sono cinque regni fissi e il regno si sceglie all'inizio.
- Non ci sono stagioni, l'economia è statica e non ci sono eserciti.
- Non c'è niente di tuo che renda, e la strada è vuota.

**Misure.** Il motore di battaglia regge eserciti grandi: in node un passo costa 0,3–0,6 ms da 70 a 300 uomini, anche senza una griglia spaziale. I limiti veri sono altri due:
- la resa sul telefono;
- la sincronia della compagnia: ogni telefono simula da sé, quindi tetto e calcoli devono essere identici ovunque.

**Debito.** `28k-ven-mondo.js` pesa 110 KB e `24hw-ventura.js` 69 KB: è la prima voce di costo in token di ogni passo.

## La visione
Restare noi stessi (Italia di ventura, condotte, cronache, telefoni e TV insieme) e prendere dai giochi di condottieri ciò che li rende grandi.

**La battaglia come prova di strategia e di tattica.**
- **Prima della battaglia** (passi 11, 19 e 32):
  - si esplora, si sceglie il campo, l'ora, l'imboscata, i pali o la retroguardia;
  - si divide la compagnia in reparti e li si schiera nei settori che il terreno e l'esplorazione concedono;
  - si preparano fino a due ondate, con il punto d'ingresso (anche di fianco) e il momento.
- **Durante** (passi 06 e 16): fino a 110 uomini in campo per lato e centinaia in tutto; morale per reparto, fatica, frecce che finiscono. Le ondate fresche contano.
- **Il nemico pensa, e pensa meglio quanto più è di rango alto** (passi 12, 21, 25 e 30):
  - il rango 0 carica;
  - il rango 3 prende l'altura, tiene le riserve per il tuo fianco debole e aggira;
  - il rango 4 usa esche e caccia il tuo capitano;
  - il rango 5 ricorda come l'hai battuto e prepara la contromossa.
  Ogni regno ha la sua dottrina e ogni signore il suo carattere.

**Una campagna che vive** (passi 07, 17, 18, 23, 27, 33 e 36):
- un mondo più vasto con una geografia sensata: catene con i passi, fiumi, laghi, porti solo su acque navigabili, ponti presidiati;
- 9–12 signorie all'inizio, che si accorpano fino a 2–4;
- la sorte ti getta in un punto a caso;
- stagioni che cambiano consumi, marce e guerre, e un'economia di produzione, scorte e razzie;
- difficoltà su misura;
- la Compagnia in primo piano nell'Avventura.

**Le cose solo nostre**: la sfida al capo prima della battaglia (35), la regia pensata anche per la TV (31), le voci dei compagni in campo (10, 28, 39), gli incontri del crocevia (42, 44).

## Decisioni d'architettura (valgono per tutti i passi)
1. **Fondamenta prima di tutto** (passi 01, 02, 04). Si spezzano i file grandi; poi un passo prepara:
   - i **ganci** (`VEN.aggancia`: `nuovo`, `ora`, `giorno`, `scheda`, `esito`, `premio`, `battaglia`, `anteprima`, `scelta`) e i **punti d'estensione** (`mappaDi`, `regni/rg/cult`, `molt`, `probCattura`, `decidi`, `opz`);
   - gli **interruttori** spenti e i **file vuoti** già nel manifest.

   Così ogni novità vive in un file suo e i passi di una fase non si toccano.
2. **Tutto nasce spento**: interruttori (`VDAT.ACCESO`), campi nuovi nella scheda della battaglia, mondi nuovi (`s.geo===2`). L'impronta prova a ogni commit che a interruttori spenti il gioco è identico a `main`, che va online a ogni unione.
3. **Motori puri e ripetibili su ogni telefono**: niente `Math.random`, `Date.now`, `Math.pow/exp/log` né trigonometria nei motori (per le curve si usano tabelle). Lo controlla `npm run struttura`.
4. **Il tetto della battaglia sta nello stato del mondo** (`s.opz.taglia`), non nel telefono: in compagnia vale quello dell'oste.
5. **Reparti al posto dei tre gruppi fissi**: senza reparti nella scheda nascono i tre gruppi di oggi, e i `data-v` restano validi.
6. **Le partite vecchie continuano**: stato nuovo solo come campi facoltativi. Mappa, regni ed economia nuovi valgono per le partite nuove; i salvataggi della prima edizione stanno in `tests/fixture/ven/`.
7. **La vista non rifà i conti** (`VCAM.settori`, `VCAM.morali`, `VEN.anteprima`…) e l'incontro è generico: rango, sfida e strategia arrivano come dati, senza toccare la vista.
8. **Interfaccia**: un ottone per schermata, fogli dal basso al massimo al 58%, bersagli di almeno 44 px, niente emoji.

## Fatto quando (release intera)
- Contro un signore da 150 uomini si schierano fino a 110 per lato a taglia grande, con due ondate decise da te. A taglia media la battaglia regge 30 fps su un telefono di fascia media.
- Scala dei ranghi: a truppe pari il rango *r* batte *r−1* tra il 58 e il 75%; il rango 5 batte il rango 1 anche con il 25% di truppe in meno.
- I cinque regni si riconoscono da come combattono. I comandanti di rango ≥ 3 prendono le alture, tengono le riserve e aggirano; quelli di rango ≥ 4 usano esche e cacciano il capitano esposto.
- Senza capitano le battaglie pari stanno tra il 40 e il 60%; con il capitano contro un signore di pari rango, tra il 60 e l'80%.
- Ogni schermata del mondo ha un solo ottone e la mappa resta visibile per almeno il 40% dell'altezza, senza mai uscire dalla terra.
- Una partita nuova parte da 9–12 regni e arriva a 4–7 verso il giorno 120; i porti stanno solo su acque navigabili; l'inverno pesa.
- Con il bot accorto, a Condottiero, nessun seme va in rovina in un anno.

Fuori dalla release: mondo persistente a distanza (C3), banda contro banda (C4), ripiego senza WebGL. Restano in `VENTURA.md`.
