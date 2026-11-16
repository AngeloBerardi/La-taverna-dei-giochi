---
passo: 18
titolo: Il menu dell'Avventura e la nuova campagna
fase: 5
area: viste
dopo: [04]
agente: programmer
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24ha-avventura.js
  - src/css/39a-avventura.css
  - src/js/app/07c-comandi.js
  - src/js/app/24hw-ventura.js
  - src/js/app/24hx-ven-stanza.js
---

# Passo 18 — Il menu dell'Avventura e la nuova campagna

**In breve.** La Compagnia di ventura diventa il gioco principale dell'Avventura; «Nuova campagna» porta alla scelta della difficoltà. Sostituisce la vecchia scheda T4.

## Scopo

La Compagnia di ventura è **il** gioco dell'Avventura: occupa la scena, e la campagna a capitoli diventa la seconda insegna. «Nuova campagna» porta a un foglio in cui si sceglie la difficoltà (preset o su misura) e il nome del capitano. Nei mondi nuovi il regno non si sceglie: la sorte ti getta in un punto del mondo (passo 33).

## Leggi prima

`docs/schede/T4-menu-avventura.md` (struttura che resta valida), `app/24ha-avventura.js`, `app/24hw-ventura.js` (`entra`, `regno:sel`, `nuova`), `app/24hx-ven-stanza.js` (`ripH`), `docs/STYLE.md`.

## Decisioni

1. **La pagina, dall'alto**:
   - **Riprendi**: la carta della partita in corso; se è della Compagnia mostra giorno, stagione, regni rimasti, fama.
   - **Insegna grande della Compagnia di ventura** (altezza 220 px, illustrazione dipinta di un accampamento di ventura al tramonto, titolo, una riga «Un mondo libero: truppe, regni, battaglie») con due bottoni: **Nuova campagna** (ottone) e Carica.
   - **Insegna piccola** «La Corona Spezzata — campagna a capitoli» (88 px).
   - Schede `Partite` · `Eroi` · `Guida`, come nella vecchia scheda passo 18.
2. **Foglio «Nuova campagna»** (al massimo 58%, con scorrimento):
   - **Difficoltà**: quattro carte. **Recluta**, **Condottiero** (predefinita), **Leggenda**, **Su misura** (apre le leve).
   - **Leve** (già in `VDAT.DIFF` dal passo 04: qui c'è solo l'interfaccia):
     | Leva | Valori |
     |---|---|
     | Economia | generosa / giusta / avara: prezzi, paghe, rendite |
     | Consumi | leggeri / normali / duri: viveri e foraggio per uomo e stagione |
     | Nemici | rango medio dei signori −1/0/+1; frequenza e forza dei predoni |
     | Unificazione dei regni | lenta / normale / rapida |
     | Stagioni | miti / normali / rigide |
     | Ferite del capitano | indulgenti (mai morte) / normali / ferro: alla terza sconfitta grave la campagna finisce, con un solo salvataggio |
     | Grandezza del mondo | ampio / vasto (passo 07) |
     | Grandezza delle battaglie | come dal passo 06 |
   - **Capitano**: nome (precompilato dal profilo), stemma (due colori e una figura da un elenco di 12, nessun marchio).
   - **Seme** in un `<details>` per chi vuole ripetere un mondo.
   - Ottone: **Getta i dadi** → nuova partita con `s.opz`.
3. Con `VDAT.ACCESO.mondo2` (o `?ven=mondo2`) la scelta del regno (`regno:sel`) si salta e decide la sorte. A interruttore spento resta com'è, perché il generatore vecchio la vuole.
4. Compagnia (stanza): la difficoltà la sceglie l'oste; gli altri vedono il riepilogo.
5. **Insegna**: se tra le copertine c'è quella dipinta della Compagnia, usala; altrimenti una scena SVG fatta a mano (accampamento al tramonto, tende e stendardi in sagoma), sostituibile più avanti con un dipinto.

## Stato e contratti

`s.opz` (passo 04: `VEN.nuovo(seme,{opz})` lo salva già, e `VEN.opz(s)` dà i valori di base). Qui solo la vista.

## Ordine di lavoro

1. Pagina Avventura.
2. Foglio «Nuova campagna».
3. Insegna.
4. Salto di `regno:sel` con l'interruttore.

## Prove

Scenario `scenari/p18.py`:
- senza salvataggi, l'insegna della Compagnia è il primo elemento sotto la testata;
- «Leggenda» → `s.opz.diff==='leggenda'`; «Su misura» apre le leve;
- con `?ven=mondo2`, «Getta i dadi» entra nel mondo senza chiedere il regno;
- la stanza a 2 mostra il riepilogo all'ospite.

`tests/test_ven_p18.js`: `opz` salvato e riaperto. Screenshot a 390 px (pagina e foglio).

## Fatto quando

Prove verdi e screenshot guardati.
