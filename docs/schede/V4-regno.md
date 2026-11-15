# V4 — Fondare un regno, vassalli, feudi, vittoria

> **Traccia.** Le decisioni di gioco sono prese; firme, campi e numeri li fissa l'`architetto` leggendo il codice, poi la scheda si esegue.

**Scopo.** La partita ha un traguardo: una corona. Chi tiene una fortezza può fondare un regno, attirare signori, dare feudi, e vincere unificando le terre.

**Area:** `docs/moduli/ventura.md`.

## Decisioni già prese
- Si fonda con: una città o un castello propri, fama 150, 5000 monete. Il regno prende nome e colori scelti dal giocatore (uno stendardo tra 8).
- I regni che confinano reagiscono: chi ti era amico propone pace, gli altri ti dichiarano guerra entro 10 giorni.
- Signori: quelli di un regno sconfitto o scontenti (tratto e amicizia) possono passare a te se glielo proponi quando li incontri; vogliono un feudo.
- Feudi: ogni luogo tuo si tiene (rendita piena, ma oltre 3 luoghi tenuti il malcontento sale) o si dà a un signore o a un compagno (rendita a lui, ma porta la sua compagnia in guerra).
- I compagni possono diventare signori: lasciano la compagnia e guidano una compagnia propria.
- Vittoria (la partita continua dopo): tenere tutte le capitali, oppure, da vassallo, che il tuo re le tenga. Schermata finale con il riassunto della carriera (`traguardi`).
- In compagnia il regno è uno, di tutti.

## Da fissare prima di eseguire (architetto)
- Come la fazione `tu` possiede oggi i luoghi (`conquista`, `rendite`, `guarnigione`) e che cosa cambia tra «fortezza di un capitano libero» e «regno».
- Come nascono e pensano i signori (`sig`, `nuovaP`, `pensa`) per aggiungere signori della fazione del giocatore.
- Uso di `s.over` e di `traguardi` per la vittoria.
- Dipende da V3 per pace e alleanze del regno nuovo.

## Prove da chiedere
- Bot accorto: fonda un regno entro il giorno 90 in almeno un terzo dei semi; bot a caso mai.
- Un signore passato a te combatte i tuoi nemici e non i tuoi; un feudo dato non rende più monete al giocatore.
- I salvataggi v2 si aprono; la vittoria scatta una volta sola.

**Fuori scopo:** leggi del regno, tasse regolabili, successione.
