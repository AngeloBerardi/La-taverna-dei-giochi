---
passo: 27
titolo: L'unificazione dei regni
fase: 7
area: mondo
dopo: [23]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28ki-ven-regni.js
  - src/js/motori/28kd-ven-corte.js
  - src/js/motori/28kj-ven-rango.js
  - src/js/motori/28kh-ven-stagioni.js
  - src/js/motori/28ka-ven-ia.js
---

# Passo 27 — L'unificazione dei regni

**In breve.** Con conquiste, vassallaggi e matrimoni dinastici i regni si accorpano: verso il giorno 120 ne restano 4–7, nella tarda partita 2–4.

**Acceso da.** mondi nuovi (`s.geo===2`).

## Scopo

Una mappa politica che cambia sotto gli occhi del giocatore, e un traguardo nuovo: unificare.

## Leggi prima

`motori/28ki-ven-regni.js` (passo 23); diplomazia e coalizioni in `28kd` (`grep -n "coaliz\|alleat\|vittoria" src/js/motori/28kd-ven-corte.js`); gancio `giorno`.

## Decisioni

1. **Ogni 7 giorni**, con un ascoltatore di `giorno` in `28ki`, per ogni regno vivo:
   - **conquista**: chi perde l'ultimo capoluogo e l'ultimo castello si scioglie. I suoi signori passano al vincitore (probabilità 0,6) o restano senza terra: fuggono e altri regni li possono reclutare;
   - **vassallaggio**: un regno con forza < 0,35 del vicino più forte, in guerra con lui da 20 giorni, può giurargli fedeltà e ne diventa parte. Se il vicino supera le 3 città prende il nome «Regno di …»;
   - **matrimonio dinastico**: due regni della stessa cultura, in pace da 60 giorni e con relazione alta, si uniscono. È raro: al massimo uno ogni 60 giorni in tutto il mondo.
   Probabilità e soglie stanno in `VDAT.UNIF` (in testa a `28ki`), scalate da `VEN.opz(s).unif` con `VDAT.DIFF`.
2. **Freno alla valanga**: un regno con più del 40% delle città subisce una coalizione degli altri, usando la diplomazia che esiste già (`28kd`).
3. **Eventi** nel diario e con `VEN.accoda` («La Marca di Fontesalice giura fedeltà al Regno di Valdoro»). La vista ricolora i confini da sola (passo 14).
4. Il tuo regno (V4) può ricevere vassallaggi allo stesso modo.
5. **Vittoria «Unificatore»**, in `28kd` tramite `VEN.vittoria`: tutte le città sotto un solo regno, il tuo o quello di cui sei maresciallo.

## Prove

- `tests/test_ven_p27_lento.js`, bot a 300 giorni su 8 semi:
  - regni vivi: 9–12 al giorno 0, 4–7 al giorno 120, 2–4 al giorno 300 con unificazione normale; con «lenta» e «rapida» i valori si spostano nella direzione giusta;
  - nessun regno senza città resta «vivo»;
  - nessun signore resta senza regno per più di 30 giorni, se c'è chi recluta.
- Mondi vecchi: impronta identica.
- Un giorno di gioco costa al massimo il 20% in più.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Correzioni dalla revisione delle fasi 1–6

Da `docs/passi/REVISIONE-1-6.md` (P1-4 e i re). Decisioni dell'utente del 18 novembre 2026. Due commit a parte.
1. **Il re vale quanto il suo regno** (`28kj`, solo nei mondi `s.geo===2`). La base del re è 2 con una città, 3 con due o tre città, 4 da quattro in su. Si legge al momento da `s.l` (nessun campo salvato), quindi sale da sola quando il regno si accorpa. Nei mondi vecchi il re resta 4: impronta identica.
2. **Le leve della difficoltà mordono** (`28kh`, che già compone `VEN.molt` per le stagioni). Valgono in **tutti** i mondi, perché il foglio «Nuova campagna» è già online:
   - `cons`: `molt('viveri')` × `VDAT.DIFF.cons[..].viveri`, foraggio compreso;
   - `eco`: `molt('prezzo')`, `molt('paga')` e `molt('rendita')` con i numeri di `VDAT.DIFF.eco`;
   - `nem`: un punto `VEN.molt(s,'predoni',{})` nuovo in `28ka` (riga dove nascono le bande, `punti` e probabilità) × `VDAT.DIFF.nem[..].predoni`.
   Con le opzioni di base i moltiplicatori valgono 1: impronta identica. Il passo 36 compone sopra questi senza raddoppiarli.
3. **Prove in più** in `tests/test_ven_p27.js`: a parità di seme e di bot, Leggenda dà più giorni di fame e meno monete di Condottiero, e Recluta il contrario; con `opz` assente tutto è come oggi; un regno di una città ha il re di rango 2, e dopo due accorpamenti che lo portano a quattro città il re è di rango 4.

## Fatto quando

Prove verdi; nella PR, la tabella dei regni vivi nel tempo.
