---
passo: 17
titolo: Le stagioni (motore)
fase: 5
area: mondo
dopo: [04]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28kh-ven-stagioni.js
---

# Passo 17 — Le stagioni (motore)

**In breve.** L'anno gira e cambia il modo di giocare: d'inverno si mangia di più e si marcia piano, in primavera si recluta e partono le guerre, in autunno il grano costa poco.

**Acceso da.** mondi nuovi (`s.anno` esiste solo se `s.geo===2`); per tutti al passo 38.

## Scopo

L'anno gira e cambia il modo di giocare. In inverno si mangia di più, si marcia piano, i passi del nord si chiudono e si sverna nelle città. In primavera si recluta e partono le guerre. In estate si combatte. In autunno si raccoglie, i prezzi del grano scendono e si fa scorta.

## Leggi prima

`docs/passi/04-ganci.md` (`VEN.molt` e i suoi punti; ganci `nuovo`, `giorno`, `scheda`); `VEN.accoda` (voci, `28ke`); `scena.meteo` nella scheda della battaglia.

## Decisioni

1. **Calendario**: anno di 4 stagioni da 28 giorni (`VDAT.STAG`, in testa a `28kh`). Si parte all'inizio della primavera. `VEN.stagione(s)` → `{k:'prim'|'est'|'aut'|'inv',g,anno}`.
2. **Effetti** (moltiplicati da `VEN.opz(s).stag`: miti 0,5 / normali 1 / rigide 1,5 sullo scarto dal valore base):
   | | Primavera | Estate | Autunno | Inverno |
   |---|---|---|---|---|
   | consumo di viveri | ×1 | ×1 | ×0,9 | ×1,5 |
   | foraggio dei cavalli | ×0,8 | ×0,8 | ×1 | ×1,6 |
   | marcia | ×1 | ×1,05 | ×0,95 | ×0,75 (neve ×0,5) |
   | prezzo del grano | ×1,1 | ×1 | ×0,7 | ×1,4 |
   | reclute disponibili | ×1,4 | ×1 | ×1 | ×0,6 |
   | guerre nuove dell'IA | ×1,5 | ×1,2 | ×0,8 | ×0,3 |
   | meteo | piogge | sereno e caldo | nebbie | neve al nord e sui monti |
3. **Neve**: in inverno le celle sopra una quota, o oltre una certa latitudine (mondi `geo===2`), sono «innevate»; i passi oltre una quota si chiudono (non percorribili) fino a primavera. I laghi del nord gelano: si attraversano, ma i porti su quei laghi sono chiusi.
4. **Svernare**: riposare in una città in inverno costa le paghe, ma il morale non scende e i feriti guariscono il doppio; accampati all'aperto in inverno il morale scende di 2 al giorno.
5. **Battaglie**: la stagione dà la scena (neve: terreno bianco, cavalli −15% di velocità; estate: fatica +20% a mezzogiorno, con il passo 16).
6. **Ganci**:
   - `nuovo`: mette `s.anno=0` se `s.geo===2`;
   - `giorno`: neve, passi chiusi, laghi gelati, morale d'inverno e l'avviso tre giorni prima dell'inverno («L'inverno è alle porte: fai scorta», con `VEN.accoda`);
   - `scheda`: meteo `neve` e `mod.*.c.vel` 0,85; in estate, a mezzogiorno, `mod.*.*.fa` 1,2.
   La vista la fa il passo 24.

## Stato e contratti

`s.anno` (giorno d'inizio del calendario; se manca, le stagioni sono spente). `VEN.stagione(s)`, `VEN.innevata(s,i)` (la userà la vista, passo 24). Tutto vive in `28kh-ven-stagioni.js`, e `VEN.molt` si estende componendo.

## Ordine di lavoro

1. Calendario e `VEN.stagione`.
2. `molt` composto.
3. Neve, passi e laghi gelati.
4. Svernare.
5. Scheda della battaglia.
6. Prove.

## Prove

`tests/test_ven_p17.js`:
- senza `s.anno` l'impronta è identica;
- con `s.anno`: il consumo di 10 uomini in inverno è 1,5× quello estivo; un passo alto non è percorribile in inverno e lo è in primavera;
- le guerre nuove del bot in un anno sono più in primavera ed estate che in inverno;
- bot di 2 anni (`tests/test_ven_p17_lento.js`) con Condottiero: nessun seme in rovina; con Leggenda + stagioni rigide almeno un seme su 6 soffre la fame (prova che la leva morde);
- tutti i bot di questo passo girano su mondi `opz.geo=2`.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

**Le stagioni.** L'anno ha quattro stagioni uguali e si parte a inizio primavera. In primavera si reclutano più uomini e i regni vanno in guerra più spesso; d'estate si marcia più svelti e si combatte; in autunno il grano costa poco, ed è il momento di fare scorta (un avviso ti dice quando l'inverno è vicino). D'inverno si mangia di più, si cammina piano, soprattutto nella neve, i passi del nord e dei monti si chiudono fino a primavera e i laghi del nord gelano: li attraversi a piedi, ma le navi restano ferme. Per svernare riposa in una città: paghi un giorno di soldo, i feriti guariscono più in fretta e il morale tiene; accampati all'aperto, invece, la truppa si scoraggia ogni giorno. In battaglia la neve rallenta i cavalli e il caldo di mezzogiorno stanca di più. La difficoltà «stagioni» (miti, normali, rigide) decide quanto pesano questi cambiamenti.

## Fatto quando

Prove verdi e le «Regole per il giocatore» scritte in questo file («Le stagioni»).
