---
passo: 45
titolo: Feudi e affari nella vista
fase: 11
area: viste
dopo: [41, 40, 14, 13, 08]
agente: artist
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24hu-ven-mappa.js
  - src/js/app/24ht-ven-arte.js
  - src/js/app/24hwb-ven-luoghi.js
  - src/js/app/24hwa-ven-barre.js
---

# Passo 45 — Feudi e affari nella vista

**In breve.** Gli edifici costruiti nei feudi si vedono sul modellino del luogo; nel luogo compaiono le tessere «Cantiere» e «Affari»; un esercito è un solo segnalino grande.

## Scopo

Un pezzo 3D per ogni edificio di `VDAT.EDIFICI` (passo 41), aggiunto al modellino del luogo (un livello più alto si vede più ricco); nel pannello del luogo la tessera «Cantiere» nei luoghi tuoi o in feudo e la tessera «Affari» in città; gli eserciti del passo 40 sulla mappa.

## Leggi prima

`docs/passi/41-feudi.md` (`VEN.edifici`, `VEN.cantiere`, `VEN.mioLuogo`, azioni), `docs/passi/43-affari.md` (`VEN.affari`, `VEN.tipiBottega`, azioni), `docs/passi/40-eserciti.md` (`VEN.eserciti`, `p.es`). Nella vista: `costruisci`, `colora` e `passo` in `24hu`; `pezzo` in `24ht`; `luogoH` e i sotto-pannelli `sub:*` in `24hwb`; `infoH` in `24hwa`. `docs/STYLE.md`.

## Decisioni

1. **Edifici 3D** (`24ht`): `VenArte.edificio(id,n)` (nuova) → un gruppo low-poly a colori per vertice, nello stile dei modellini di oggi, alto al più quanto il luogo: mulino (pale che girano, come `K.pale`), palizzata (anello di pali), campo d'addestramento (recinto e fantocci), mura (anello merlato attorno al modellino), caserma (lungo edificio), mercato coperto (tettoia a colonne), torre (torretta snella), cappella (campanile). Livello 2: più grande del 15% e un dettaglio in più (bandiera, secondo piano); livello 3: tetti nel colore di `VEN.colFaz(s,'tu')` e un lume la sera.
2. **Sul modellino** (`24hu`): per ogni luogo con `l.edif`, i pezzi stanno in posti fissi attorno al centro (8 angoli, nell'ordine di `VDAT.EDIFICI`), ricostruiti solo quando cambia la chiave `JSON.stringify(l.edif)`; un cantiere aperto mostra impalcature al posto del pezzo. Nessun lavoro per fotogramma oltre alle pale.
3. **Eserciti** (`24hu`, solo se esiste `VEN.eserciti`): un segnalino grande (stendardo con i colori di `VEN.colFaz(s,faz)`, 1,6 volte una compagnia) sulla posizione del maresciallo, con etichetta del numero di uomini; i membri con `p.es` e diversi dal maresciallo non si disegnano; `stato==='sciolto'`: lo stendardo si abbassa e sparisce in 1 secondo.
4. **Tessera «Cantiere»** (`24hwb`, in `luogoH`, solo se `VEN.mioLuogo(s,l)`): apre `sub:cantiere`, una riga da 56 px per edificio di `VEN.edifici(s,l)` (icona, nome, livello in tre tacche, costo e giorni, tasto di legno «Costruisci» che chiama `VEN.fai(s,{a:'costruisci',id})`; se c'è `err`, tasto spento e il motivo nell'`aria-label`); in testa il cantiere aperto da `VEN.cantiere` («Mulino: pronto tra 3 giorni»). Il pallino d'ottone sulla tessera quando un cantiere è appena finito.
5. **Tessera «Affari»** (`24hwb`, nelle città, solo se esiste `VEN.affari`): `sub:affari` con le botteghe da `VEN.tipiBottega(s,l)` (nome, costo, resa stimata, «Apri»), la tua bottega qui («Vendi»), e «Carovana» (scelta della meta tra le città e del capocarovana tra i compagni presenti o «un mercenario»); le carovane in corso con «Richiama» quando sei in una delle due città.
6. **Barra** (`24hwa`): nell'`infoH` delle monete una riga «Affari: +N a settimana» da `VEN.affari(s).sett`, solo se esiste e non è zero.
7. Testi italiani, niente numeri interni oltre a monete e giorni; bersagli ≥ 44 px; un solo ottone per foglio (come il passo 13).

## Prove

- Scenario `tools/test-browser/scenari/p45.py` (mondo con `s.geo=2`), screenshot a 390 px:
  - un villaggio tuo con mulino 3, palizzata 1, campo 2 e un cantiere aperto, visto da vicino;
  - il pannello del luogo con la tessera «Cantiere» aperta;
  - una città con la tessera «Affari» aperta, se `VEN.affari` c'è già;
  - un esercito di 5 signori: un solo segnalino con il numero.
- Nessun errore in console; scenari `ventura` e `ventura_regno` verdi.

## Regole per il giocatore

Nei feudi tuoi ogni edificio costruito si vede sul modellino del luogo: più alto il livello, più ricco il pezzo. Un cantiere aperto mostra le impalcature.
Dal luogo, la tessera «Cantiere» elenca cosa puoi costruire, quanto costa e in quanti giorni; la tessera «Affari», nelle città, serve per botteghe e carovane.
Un esercito è un solo stendardo grande sulla mappa, col numero degli uomini; sciolto, lo stendardo si abbassa e sparisce.
Nel riquadro delle monete trovi quanto rendono gli affari ogni settimana.

## Fatto quando

Scenario verde e screenshot guardati; tessere e pezzi solo nei mondi nuovi (nei vecchi `l.edif` non c'è).
