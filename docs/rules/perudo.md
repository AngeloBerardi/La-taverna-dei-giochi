# Perudo
**2–6 giocatori** · **15–30 min** · **Tipo**: dadi e bluff · **Licenza**: libero (gioco di tradizione peruviana; meccaniche non protette, nomi e testi sono nostri). Motore: `src/js/motori/16-perudo.js`, test `tests/test_perudo.js`.

## Preparazione
Ognuno ha un bicchiere con 5 dadi che solo lui vede. Si tirano i dadi in segreto; apre un giocatore a caso (poi chi ha perso un dado).

## Turno
A turno si **dichiara** quanti dadi di un valore ci sono in tutto il tavolo (dadi di tutti), oppure si **sfida**.
- **Rilancio**: più dadi dello stesso valore, oppure lo stesso numero con un valore più alto. Non si possono dichiarare più dadi di quelli in tavola.
- **Assi jolly**: valgono per qualsiasi valore. Per dichiarare assi basta la metà (per eccesso) della dichiarazione precedente; per tornare da assi a un altro valore serve il doppio più uno. Assi su assi: serve una quantità maggiore. Si può aprire dichiarando assi.
- **Dudo**: si sfida la dichiarazione precedente, tutti scoprono. Se i dadi trovati sono almeno quelli dichiarati perde un dado lo sfidante, altrimenti lo perde chi ha dichiarato.
- **Calza**: si dice che la dichiarazione è esatta. Se è esatta chi calza guadagna un dado (mai oltre 5), altrimenti ne perde uno. Si può calzare solo se in tavola resta almeno la metà dei dadi iniziali.
- **Palifico**: la prima volta che un giocatore resta con un dado, nel round dopo apre lui e sceglie il valore; gli assi non sono jolly, il valore non si cambia (si alza solo la quantità) e non si calza.

## Fine partita e punteggio
Chi perde l'ultimo dado è eliminato. Vince l'ultimo giocatore con dadi. Nessun punteggio.

## Varianti
Nessuna nel gioco; palifico e calza sono già incluse come regole di casa comuni.

## Casi limite
- Nel palifico il conteggio non usa gli assi come jolly.
- Calza giusta con già 5 dadi in mano: non se ne guadagna un sesto (tetto a 5).

## Test del motore
1. Validità dei rilanci (valori, assi, metà e doppio più uno). 2. Conteggio con assi jolly e nel palifico. 3. Dudo/calza, conservazione dei dadi e partite complete: un giocatore che stima le probabilità batte quelli casuali.

## Fonti
Regole di tradizione (varie edizioni); le regole di casa (calza, palifico) variano tra le edizioni: abbiamo adottato la forma descritta sopra.
