---
passo: 28
titolo: Le doti dei compagni in campo (motore)
fase: 7
area: battaglia
dopo: [16]
agente: programmer
modello: sonnet
impegno: medio
controllo: leggero
file:
  - src/js/motori/28l-ven-campo.js
  - src/js/motori/28j-ven-dati.js
---

# Passo 28 — Le doti dei compagni in campo (motore)

**In breve.** Ognuno dei dieci compagni cambia qualcosa attorno a sé in battaglia; il motore segnala i momenti in cui grida.

**Acceso da.** solo nelle battaglie con i reparti (passo 29, oppure `?ven=grandi`).

## Scopo

I compagni non sono più soldati qualunque. Le frasi le ha scritte il passo 10; la vista le mostrerà nel passo 39.

## Leggi prima

`VDAT.COMPAGNI` e le voci `TR` dei compagni (`compagno:true`) in `28j-ven-dati.js`; in `28l`: `mischia`, `tiro`, `muovi` ed eventi.

## Decisioni

1. Ogni compagno ha `campo:{k,r}` in `COMPAGNI` (**numeri qui**), con effetto entro `r` passi sulle unità dello stesso lato:
   | Compagno | Dote | Effetto |
   |---|---|---|
   | Berta | `furia` | +15% attacco ai fanti |
   | Lapo | `cerusico` | +1 pf ogni 30 istanti, senza superare il massimo |
   | Ghino | `guado` | il suo reparto non rallenta nell'acqua |
   | Isabetta | `occhio` | +10% danno ai tiratori |
   | Ulfredo | `macchine` | spinta dell'ariete ×2, salita delle scale −25% |
   | Diamante | `alfiere` | perdite di morale del reparto ×0,7 |
   | Temu | `steppa` | +10% velocità ai cavalieri |
   | Suor Nera | `benedizione` | +10 al morale del suo reparto all'inizio |
   | Brando | `seicolpi` | il suo tiro scocca due quadrelli |
   | Fosca | `notte` | nessuna penalità di notte ai tiratori |
2. **Solo con `s.reparti`**: senza reparti nessuna dote, così l'impronta resta identica.
3. Un solo punto di calcolo: `aura(s,u,k)` restituisce vero se un compagno vivo con quella dote è entro il raggio. Si chiama solo nei punti indicati, con una cache per istante (`s._aura`, non salvata).
4. **Grida**: il motore emette `{t:'grida',chi,k}` con `k` tra `carica`, `rotta`, `cede`, `ferito` e `vince`, al massimo una volta ogni 40 istanti per tutta la battaglia (`s.ultGrida`). Il capitano del giocatore non grida.

## Prove

- `tests/test_ven_p28.js`: per ogni dote una scheda minima che ne mostra l'effetto (per Brando: in 200 istanti i suoi `tiro` sono circa il doppio di quelli di un balestriere uguale).
- Una battaglia di 600 istanti emette al massimo 15 `grida`.
- Senza reparti: impronta identica.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fatto quando

Prove verdi.
