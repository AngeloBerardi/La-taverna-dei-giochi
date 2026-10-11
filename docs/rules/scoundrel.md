# Scoundrel
**Giocatori** 1 · **Durata** ~10 min · **Tipo** solitario di carte · **Licenza/marchio**: regole libere (Zach Gage, Kurt Bieg); nome da non usare come marchio
## Preparazione
Mazzo francese da 44 carte (senza jolly, figure rosse e assi rossi). 20 vite.
## Turno
Stanza di 4 carte: se ne giocano 3, la quarta resta. Fiori/picche = mostri (J11 Q12 K13 A14), quadri = armi, cuori = pozioni (una per stanza). Si può scappare (4 carte in fondo al mazzo) ma non due stanze di fila né a stanza iniziata. Con l'arma: danno = mostro − arma; poi l'arma colpisce solo mostri ≤ ultimo abbattuto.
## Fine partita e punteggio
Vite a 0: punteggio = vite − mostri rimasti. Dungeon svuotato: punteggio = vite (+ ultima pozione se a 20 vite).
## Varianti
Nessuna.
## Casi limite
Ultima stanza con meno di 4 carte: si giocano tutte.
## Test del motore (3)
`tests/test_scoundrel.js` (3000 partite casuali terminano) e `test_scoundrel_greedy.js` (bot avido). Nota: nessuna vittoria osservata con bot semplici, difficoltà da verificare.
## Fonti
https://donarumo.itch.io/scoundrel (descrizione delle regole)
