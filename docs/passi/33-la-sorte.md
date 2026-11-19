---
passo: 33
titolo: La sorte ti getta nel mondo
fase: 8
area: mondo
dopo: [23, 18, 15]
agente: programmer
modello: sonnet
impegno: medio
controllo: leggero
file:
  - src/js/motori/28km-ven-sorte.js
---

# Passo 33 — La sorte ti getta nel mondo

**In breve.** Non si sceglie il regno: il gioco getta la compagnia in un punto a caso ma giocabile, e lo racconta.

**Acceso da.** mondi nuovi (`s.geo===2`).

## Scopo

Non si sceglie il regno. Il gioco getta la compagnia in un punto a caso, ma giocabile, e lo racconta in tre righe. Ogni partita comincia diversa.

## Leggi prima

`docs/passi/04-ganci.md` (gancio `nuovo`); `VEN.nuovo` (dove nasce la compagnia `tu`); gli incarichi (`grep -n "incar" src/js/motori/28k[be]*.js`); `VVOC.APERTURE` (passo 15); `VEN.accoda`.

## Decisioni

1. **Luogo d'inizio**: estratto dal seme tra villaggi e locande che stanno ad almeno 8 celle da un covo, non in un regno in guerra al giorno 0, e con una città entro 20 celle. Peso maggiore per i regni piccoli: si parte dal basso.
2. **Origine del capitano**: la cultura del luogo dà un bonus leggero (una truppa della sua cultura recluta a −10%) e la prima frase.
3. **Dotazione** da `opz.diff`: monete, uomini (reclute della cultura del luogo), viveri.
4. **Apertura**: scena di tre righe («La sorte ti getta a …, ai margini della Marca di …. Hai 7 uomini, 120 monete e una voce: …») con un **aggancio** nel raggio di 10 celle, estratto da 6 tipi (un covo da ripulire con taglia, una carovana che cerca scorta, un signore che recluta, un torneo tra 3 giorni, un villaggio minacciato, un mercante con un affare). È un incarico vero, creato con la funzione degli incarichi esistente; se non ce n'è una riusabile, crealo in `28km` con lo stesso formato. I testi esistono già (`VVOC.APERTURE`, passo 15).
5. In compagnia gli altri capitani nascono vicino (entro 3 celle), con la stessa apertura.

## Stato e contratti

`s.inizio={lid,cult,aggancio}`. Tutto in `28km-ven-sorte.js`, con un ascoltatore di `nuovo` che agisce solo se `s.geo===2`. La scena d'apertura passa da `VEN.accoda`, quindi la vista la mostra da sola; la scelta del regno la salta già la vista (passo 18).

## Prove

- 50 semi: il luogo d'inizio rispetta i vincoli; nessun regno è il punto di partenza per più di 15 semi; lo spunto è raggiungibile (`tests/test_ven_p33.js`).
- Il bot accorto sopravvive 60 giorni in tutti i semi con la difficoltà Condottiero.
- Scenario `scenari/p33.py` con `?ven=mondo2`: «Getta i dadi» → la scena d'apertura compare, una volta sola.

## Regole per il giocatore

Nei mondi nuovi non scegli il regno: la sorte ti getta in un villaggio o in una locanda lontani dai covi, in un regno ancora in pace, con una città non troppo lontana. Il diario ti racconta dove sei e ti indica subito una cosa da fare vicino: una taglia, una carovana da scortare, un signore che arruola, un torneo, un villaggio minacciato o un mercante con un affare. Gli uomini che hai sono della gente del posto, e chi arruoli della stessa gente costa un po' meno. Più la difficoltà è dura, meno monete hai in tasca.

## Fatto quando

Prove verdi.
