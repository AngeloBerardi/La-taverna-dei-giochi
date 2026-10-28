# Regicidio X
**Giocatori** 1–4 · **Durata** 30–45 min · **Tipo** carte, cooperativo · **Licenza/marchio**: variante nostra di Regicidio (nome visibile «Regicidio X», classi e tratti inventati da noi)

## Preparazione
Come Regicidio (`regicide.md`): Taverna da 40 carte più i Jolly, Castello con Fanti, Regine e Re mescolati per grado.
Ogni giocatore riceve a caso una **classe**, tutte diverse. Con l'opzione «Tratti dei nemici» ogni Regina e ogni Re riceve un **tratto**; i Fanti no (primo atto per prendere la mano).

## Turno
Come Regicidio: gioca carte (o cedi), poteri dei semi, danno, poi il nemico colpisce e si scartano carte per almeno il suo attacco.
Ogni classe ha un potere da usare **una volta per nemico**; si ricarica quando arriva il nemico successivo.
- **Guerriero · Furia**: con l'attacco, +5 danni.
- **Chierico · Preghiera**: con l'attacco, 3 carte dagli Scarti tornano nella Taverna (anche contro l'immunità ai Cuori).
- **Ranger · Colpo mirato**: con l'attacco, le immunità del nemico non contano.
- **Guardiano · Bastione**: quando chiunque subisce un attacco, il danno cala di 5. Si usa anche fuori dal proprio turno.
- **Mago · Visione**: pesca 2 carte dalla Taverna, anche oltre il limite. Non consuma il turno.

Tratti dei nemici:
- **Corazzato**: ogni attacco che subisce fa 2 danni in meno (minimo 1).
- **Rigenerante**: quando attacca recupera 5 danni.
- **Feroce**: attacco +5.
- **Spinoso**: chi cede subisce 5 danni in più.
- **Doppia immunità**: immune anche a un secondo seme (mostrato sulla carta).
- **Maledizione**: quando attacca, 2 carte della Taverna vanno negli Scarti.
- **Anti-scudo**: le Picche riducono l'attacco solo della metà (per difetto).
- **Silenzio**: le Quadri fanno pescare al massimo 3 carte.
- **Brutale**: niente combo; si gioca una carta sola, o un Asso con un'altra carta.

## Fine partita e punteggio
Come Regicidio: si vince sconfiggendo tutti e 12 i nemici; si perde se qualcuno non riesce a parare un colpo o non può né giocare né cedere. Nel solitario contano i Jolly usati (oro, argento, bronzo).

## Varianti
«Nessun tratto»: solo le classi (più facile).

## Casi limite
- Il Jolly annulla le immunità ma non si combina con un potere.
- Se c'è un Guardiano con il Bastione ancora carico, nessuno perde finché il Bastione può ancora coprire il colpo.
- La Furia vale anche sul danno doppio dei Fiori (si somma dopo il raddoppio); la Corazza toglie 2 prima della Furia.

## Test del motore (3)
`tests/test_regicide_x.js`: carte mai perse; ogni potere e ogni tratto provato a parte; bot che valuta mosse e poteri contro bot casuale (il primo vince, il secondo mai), per 1–4 giocatori.

## Fonti
Regole di base: `regicide.md`. Classi e tratti: nostri.
