---
passo: 21
titolo: Il consiglio di guerra: ranghi 0–2 e dottrine
fase: 6
area: battaglia
dopo: [16]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28la-ven-consiglio.js
  - src/js/motori/28l-ven-campo.js
---

# Passo 21 — Il consiglio di guerra: ranghi 0–2 e dottrine

**In breve.** Il nemico guarda il campo e sceglie tra le manovre che conosce; il rango decide quante ne conosce, ogni quanto ci ripensa e quanto sbaglia; dottrina del regno e indole del signore pesano le scelte.

**Acceso da.** `VDAT.ACCESO.consiglio` (rilascio 3, passo 34). Senza `rango` nella scheda resta il `comanda` di oggi.

## Scopo

Il nemico non segue più un copione unico: guarda il campo, valuta un elenco di **manovre** e le assegna ai suoi reparti. Il **rango** del comandante (0–5) decide quante manovre conosce, ogni quanto ci ripensa e quanto sbaglia. La **dottrina** del regno e l'**indole** del signore pesano le manovre: così i regni si riconoscono da come combattono.

## Leggi prima

`motori/28l-ven-campo.js`: `comanda` (tutta), il punto in `istante` che la chiama, la scelta del bersaglio; le funzioni del passo 11 (`reparti`, `settori`, `ondata`) e il passo 16 (`morali`). `motori/28j-ven-dati.js`: `FAZ`, `TRATTI`.

## Decisioni

1. **File** `motori/28la-ven-consiglio.js`, già creato vuoto dal passo 04: diventa `const VCONS=(()=>{…})()`. Contiene `quadro`, `MANOVRE`, `decidi`, `schiera`. `VCAM` lo chiama solo se `s.rango` è definito.
2. **Il quadro** `VCONS.quadro(s,l)` è puro e si calcola una volta per decisione.
   - Per reparto: centro, uomini, forza (somma di `att×pf/30`), morale, fatica, frecce, minaccia (forza nemica entro 15 pesata dai contrari: picche contro cavalli ×1,5, cavalli contro tiratori ×1,5, tiratori contro fanti in campo aperto ×1,2), terreno sotto i piedi.
   - Per lato: rapporto di forze con le riserve, altura tenuta, ondate rimaste, capitano nemico esposto (nessun suo reparto entro 8).
3. **Manovra** = `{id,rango,tipo:[tipi di reparto],vale(q,rep,X)→numero,ordina(s,l,rep,q)}`. In questo passo ce ne sono dieci, dei ranghi 0–2:
   | Rango | Manovre |
   |---|---|
   | 0 | `carica` (tutti verso il nemico più vicino) |
   | 1 | `avanza` (in linea, al passo del più lento), `tieni` (fermi in serrata) |
   | 2 | `tiro` (i tiratori a gittata ×0,9, fermi; dal rango 1 spostato qui con la correzione dell'issue #195), `contro` (serrata se arrivano cavalli entro 15, larga sotto le frecce), `ripiega` (tiratori indietro di 10 se un nemico è a 9), `debole` (tutti i reparti su quello nemico con il morale più basso), `copri` (cavalieri tra i tiratori e la minaccia), `insegui` (cavalieri sui fuggitivi), `attendi` (cavalieri di lato, fermi) |
4. **Decidere** (`VCONS.decidi(s,l)`):
   - ogni `RIFL[rango]` istanti (60/40/30/20/15/10, dal rango 0 al 5), calcola il quadro;
   - per ogni coppia (manovra conosciuta, reparto adatto) calcola `vale × peso dottrina × peso indole + rumore`, con rumore = `s.r()` × `ERR[rango]` (0,6/0,35/0,25/0,18/0,12/0,08);
   - **pazienza** (correzione, issue #195): `tieni` vale di più lontano dal nemico fino all'istante `PAZIENZA[rango]` (360/360/440/520/600/650). È la leva principale della scala: chi aspetta di più fa venire l'altro sotto le frecce e contro la serrata;
   - `debole` conta solo se i reparti hanno morale proprio (`s.mr`) o se il nemico cede davvero (morale < 45): con un morale per lato il «più debole» sarebbe solo il gruppo più piccolo, e inseguirlo scompone la linea (in prova toglieva al rango 2 ogni vantaggio sul rango 1);
   - assegna in modo goloso (il valore più alto, poi il successivo tra i reparti liberi). Un reparto cambia manovra solo se la nuova vale almeno `ISTERESI` (0,15) in più: niente ripensamenti nervosi;
   - evento `{t:'piano',l,r,m}` quando un reparto cambia manovra.
5. **Dottrine** = pesi in `VDAT.DOTTRINE`, in testa a `28la`. Esempi:
   - Valdoro: `attendi` 1,4 poi `aggira` 1,5 (dal passo 25);
   - Selvamara: `tiro` 1,5, `prendi` 1,5;
   - Ferropietra: `tieni`/`contro` 1,5, `aggira` 0,6;
   - Maralta: `tiro` e `ripiega` 1,4, `rotazione` 1,4;
   - Altavento: `tiro` (anche a cavallo) 1,6, `esca` 1,6;
   - predoni: `carica` 2, tutto il resto 0,5;
   - mercenari e la tua compagnia: tutto a 1.
   Indole in `VDAT.INDOLE` (stesso file):
   - prode: `carica`/`caccia` ×1,4, `ritirata` ×0,3;
   - prudente: `tieni`/`riserva` ×1,4, `ritirata` ×1,5, soglia di rotta +0,05;
   - crudele: `debole`/`insegui` ×1,5;
   - avido: `insegui` ×1,3, soglia di rotta +0,04.
6. **Schieramento dell'IA** (`VCONS.schiera`): rango 0–1 mettono tutto in `cx`; rango 2 mette i tiratori dietro i fanti e i cavalieri ai lati. Dal passo 25 i ranghi alti leggono il terreno e il tuo schieramento.
7. **Ondate dell'IA**: rango 0–2 le fa entrare tutte con `quando:{k:'linea',v:60}` dal `retro`.
8. **Risoluzione automatica**: se la scheda ha `rango.a` (lo mette il passo 12 dall'abilità `comando` del capitano), anche il lato `a` usa il consiglio con quel rango. La tua abilità di comando conta anche quando non giochi la battaglia.
9. **Costo**: il consiglio non deve pesare più del 15% del costo del passo (misura con `banco-campo.js`).

## Stato e contratti

Scheda: `rango:{a,b}`, `dott:{a,b}`, `indole:{a,b}`. Stato: `s.rango`, `s.dott`, `s.indole`, `s.cons[l]={t,man:{r:id}}`. Funzioni: `VCONS.quadro`, `VCONS.decidi`, `VCONS.schiera`, `VCONS.MANOVRE`. Evento `piano`.

## Prove

`tests/test_ven_p21.js` (casi rapidi; `tests/test_ven_p21_lento.js` per la scala):
- **Scala**: a truppe pari e senza capitani, rango 1 contro 0 e rango 2 contro 1 vincono tra il 58 e il 75% su 40 semi; la stessa scala deve reggere anche nel torneo dei comandanti (`tools/avventura/torneo-comandanti.js`, passo 34: truppe di Valdoro contro Ferropietra, sei terreni, senza reparti).
- `contro`: al rango 2, i fanti passano in serrata entro 30 istanti da quando i cavalli nemici sono a 15; al rango 0 mai.
- `ripiega`: al rango 2 l'ancora dei tiratori arretra quando un nemico arriva a 9.
- Dottrine: Ferropietra contro Altavento, con le loro truppe tipiche e rango 2 entrambi, si distinguono (Altavento: meno del 15% dei colpi dei cavalieri in mischia prima dell'istante 600; Ferropietra: i fanti restano in serrata fino al contatto).
- Impronta identica senza `rango`. Costo dentro il 15%.

## Regole per il giocatore

### Come pensa il nemico

- Ogni comandante nemico ha un **rango**, dal novellino al maestro di guerra. Chi ha poca esperienza lancia tutti all'attacco; col rango impara ad avanzare in linea, a tenere il terreno, ad aspettare che sia il nemico a venire sotto le frecce, a far tirare gli arcieri da fermi e a scegliere la manovra giusta per ogni reparto.
- Più alto è il rango, più spesso il nemico ci ripensa e meno sbaglia: un maestro di guerra cambia piano appena il campo cambia, un novellino resta fermo sul suo errore.
- Ogni regno ha la sua **dottrina**: gli arcieri di Altavento restano a distanza e non si fanno prendere in mischia, la Marca di Ferropietra si chiude in blocchi di picche, i predoni si buttano avanti senza pensarci.
- Il **carattere** del signore pesa sulle scelte: il prode carica, il prudente aspetta e si ritira prima, il crudele si accanisce sui più deboli, l'avido insegue chi fugge.
- Il tuo capitano conta anche quando la battaglia si risolve da sola: la sua abilità di comando decide il rango dei tuoi.

## Fuori scopo

Manovre di rango 3–5 (passi 25 e 30), rango nel mondo (passo 12).

## Fatto quando

Prove verdi; le «Regole per il giocatore» scritte in questo file («Come pensa il nemico»).
