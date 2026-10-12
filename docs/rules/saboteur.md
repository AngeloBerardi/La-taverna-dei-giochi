# Saboteur
**Giocatori** 3-10 · **Durata** ~30 min · **Tipo** carte, ruoli nascosti · **Licenza/marchio**: gioco di Frederic Moyersoen (AMIGO); nome protetto, da cambiare prima di una pubblicazione pubblica. Arte originale.
## Preparazione
Ruoli segreti (sabotatori / cercatori): 3-4 giocatori 1 sabotatore, 5-6 due, 7-9 tre, 10 quattro, con un ruolo in più messo da parte. Ingresso a sinistra, 3 mete coperte (1 oro, 2 carbone) a 8 colonne di distanza. Mano: 6 carte (3-5 giocatori), 5 (6-7), 4 (8-10).
## Turno
Gioca una carta e pesca, oppure scarta una carta coperta. Gallerie: devono combaciare con tutte le vicine e collegarsi all'ingresso; si ruotano solo di 180°. Azioni: rompi/ripara attrezzi (con un attrezzo rotto non si scava), frana (togli una galleria), mappa (guarda una meta).
## Fine partita e punteggio
Oro raggiunto: chi l'ha raggiunto pesca tante pepite quanti i giocatori (massimo 9), ne tiene una e passa le altre ai cercatori in senso antiorario. Oro non trovato a fine carte: i sabotatori prendono 4 / 3 / 2 pepite (1 / 2-3 / 4 sabotatori). 3 round, vince chi ha più pepite.
## Varianti
Saboteur 2: cercatori blu e verdi con porte colorate, Capo, Profittatore, Geologi (cristalli), scale, ponti, prigione, furto, cambio cappello, ispezione, scambio delle mani.
## Casi limite
Le mete coperte non contano per l'incastro finché non si girano. Una meta raggiunta si gira nel verso che combacia con la galleria. Se la frana stacca un ramo, le carte staccate restano ma non sono più collegate.
## Test del motore (3)
`tests/test_saboteur.js`: fuzz base e Saboteur 2 con 3-10 giocatori; cercatori che scavano verso le mete trovano l'oro in circa l'80% dei round.
## Fonti
https://www.amigo-spiele.de (regolamento di Saboteur e Saboteur 2)
