---
passo: 25
titolo: Manovre da comandante: ranghi 3 e 4
fase: 7
area: battaglia
dopo: [21]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28la-ven-consiglio.js
  - tools/avventura/giocatore-prova.js
---

# Passo 25 — Manovre da comandante: ranghi 3 e 4

**In breve.** I comandanti esperti giocano davvero: prendono l'altura, tengono le riserve, aggirano, fanno riposare chi è stanco; i maestri tendono trappole e cacciano il tuo capitano.

**Acceso da.** come il passo 21 (`rango` nella scheda).

## Scopo

I comandanti esperti giocano davvero.
- **Rango 3**: legge il terreno, si schiera guardando te, tiene le ondate per il tuo punto debole, gira sui fianchi, fa riposare chi è stanco.
- **Rango 4**: tende trappole. Un'esca per tirarti fuori, incudine e martello, caccia al capitano esposto, ondate che entrano di fianco, ritirata ordinata per salvare gli uomini.

## Leggi prima

`motori/28la-ven-consiglio.js` (passo 21), `VCAM.settori`, `VCAM.ondata`, `VCAM.morali`.

## Decisioni

1. **Manovre di rango 3** (si aggiungono a `MANOVRE`):
   - `prendi`: i tiratori vanno su un'altura, o in un bosco, della propria metà o del terzo centrale.
   - `aggira`: i cavalieri girano largo (curva a 12 passi dal fianco nemico) e caricano il fianco o il retro del reparto nemico più impegnato.
   - `riserva`: tiene le ondate. Le fa entrare quando la tua ultima ondata è entrata, oppure quando un reparto nemico ha morale < 35, e sceglie l'ingresso più vicino a quel reparto (`fsx`/`fdx`/`retro`).
   - `rotazione`: un reparto con fatica > 65 e un altro fresco dello stesso tipo dietro si scambiano (il primo arretra di 10, il secondo prende la sua ancora).
   - `serra`: non attraversare acqua o boschi sotto il tiro nemico (i percorsi li evitano, o aspettano).
2. **Manovre di rango 4**:
   - `esca`: il reparto più debole avanza da solo verso il nemico. Quando un tuo reparto lo insegue oltre 10 passi dalla sua linea, l'esca ripiega e un reparto nascosto (cavalieri in `attendi`, o un'ondata `fsx`/`fdx`) lo colpisce di fianco.
   - `incudine`: i fanti tengono il tuo reparto più forte mentre i cavalieri lo prendono alle spalle; il colpo parte quando i fanti sono in mischia da 40 istanti.
   - `caccia`: se il tuo capitano è esposto (nessun tuo reparto entro 8), il miglior reparto di cavalieri va su di lui. Mai più di 120 istanti di fila sulla stessa preda.
   - `fianco`: le ondate di rango 4 entrano sempre dal fianco opposto a dove hai la cavalleria.
   - `ritirata`: con forze < 0,5 delle tue (riserve comprese) e nessuna ondata rimasta, tutti ripiegano in ordine verso il proprio bordo, coperti da un reparto in serrata. Esito: rotta del lato, ma con metà delle perdite in fuga (`riepilogo.ordinata`).
3. **Schieramento reattivo** (rango ≥ 3 e secondo a schierarsi):
   - contro la tua cavalleria in un settore, mette le picche o la serrata lì;
   - se sei forte da un lato, rinforza l'altro e ci mette la sua ondata;
   - prende l'altura se ce n'è una nella sua metà.
   Se è primo, si schiera secondo la dottrina e tiene il 30% in ondate.
4. **Ondate dell'IA**: rango 3 → 2 ondate, la seconda con `riserva`; rango 4 → la prima sul tuo fianco debole all'istante ~300.
5. Ogni manovra ha un **segno leggibile**, perché il giocatore impari: evento `piano` con il nome della manovra. Le voci (passi 10, 28 e 39) e la regia (passo 31) lo usano («Si spostano verso l'altura», «La loro cavalleria gira a sinistra»). Al rango ≥ 4 il segno della `esca` **non** si emette: è una trappola.

**Il «giocatore di prova»**: `tools/avventura/giocatore-prova.js`, un comandante scritto a mano con abitudini fisse (carica la cavalleria per prima; tiratori fermi; ondata appena possibile). Lo usano i test del passo 25 e il passo 30.

## Prove

`tests/test_ven_p25_lento.js` (scenari fissi, 30–40 semi ciascuno):
- **Scala**: rango 3 contro 2 e rango 4 contro 3 vincono tra il 58 e il 75% a truppe pari; rango 4 contro rango 1 con il 25% di truppe in meno vince ≥ 55%.
- `prendi`: con un'altura nella metà `b`, entro l'istante 300 i tiratori ci stanno sopra in ≥ 80% dei semi.
- `riserva`: il rango 3 non manda le ondate prima delle tue in ≥ 70% dei semi.
- `rotazione`: con due reparti di fanti, quello stanco arretra almeno una volta.
- `esca`: contro un «giocatore di prova» che carica il primo reparto vicino con la cavalleria, il reparto nascosto colpisce la tua cavalleria di fianco entro 150 istanti in ≥ 60% dei semi.
- `caccia`: capitano isolato a 15 dai suoi → i cavalieri lo raggiungono entro 90 istanti.
- `ritirata`: il lato in ritirata ordinata perde meno uomini di quello in rotta normale, a parità di scenario.
- Costo del consiglio sempre ≤ 15% del passo; impronta identica senza `rango`.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

Memoria e inganni del rango 5 (passo 30).

## Fatto quando

Prove verdi e tabella della scala nella PR.
