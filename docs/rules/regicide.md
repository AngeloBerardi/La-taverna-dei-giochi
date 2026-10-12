# Regicide
**Giocatori** 1-4 · **Durata** ~20-30 min · **Tipo** coop di carte · **Licenza/marchio**: regole pubblicate gratis da Badgers From Mars; il nome è loro, qui resta perché il gioco è distribuito liberamente. Arte originale (figure dipinte).
## Preparazione
Taverna: carte 2-10 e Assi dei 4 semi, più 0/1/2 Jolly con 2/3/4 giocatori. Castello: 4 Fanti in cima, poi 4 Regine, poi 4 Re, ognuno mescolato. Mano massima: 8/7/6/5 con 1/2/3/4 giocatori. In solitario niente Jolly nel mazzo ma 2 "Jolly" da usare per rifare la mano.
## Turno
1. Gioca una carta, una combo (carte uguali con somma ≤ 10, massimo 4) o un Asso + una carta; oppure cedi (non se tutti gli altri hanno già ceduto).
2. Poteri dei semi non immuni: ♥ rimette in fondo alla Taverna carte dagli scarti; ♦ fa pescare a turno partendo da chi gioca; ♣ raddoppia il danno; ♠ riduce l'attacco del nemico in modo permanente.
3. Danno. Se il nemico muore: esatto → va in cima alla Taverna, altrimenti agli scarti; chi lo ha battuto gioca ancora.
4. Se sopravvive: scarta carte con valore totale ≥ attacco meno scudo, o si perde.
Jolly (3-4 giocatori): annulla l'immunità del nemico e chi lo gioca sceglie il prossimo giocatore.
## Fine partita e punteggio
Vittoria battendo i 12 nemici. In solitario medaglia: oro 0 Jolly usati, argento 1, bronzo 2.
## Varianti
Nessuna.
## Casi limite
Le picche giocate prima del Jolly contro un nemico di picche contano dopo che il Jolly ne ha annullato l'immunità. In solitario, con mano vuota, nessun Jolly e un nemico che non fa danno, la partita è persa (senza questa regola si potrebbe cedere all'infinito).
## Test del motore (3)
`tests/test_regicide.js`: carte sempre 52 + Jolly; partite da 1 a 4 sempre concluse; bot che valuta le giocate batte il casuale (che non vince mai).
## Fonti
https://www.badgersfrommars.com/regicide (regolamento ufficiale)
