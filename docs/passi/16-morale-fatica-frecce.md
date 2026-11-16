---
passo: 16
titolo: Morale dei reparti, fatica, frecce e lo stendardo nemico
fase: 5
area: battaglia
dopo: [11]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28l-ven-campo.js
  - src/js/motori/28jb-ven-dati-campo.js
---

# Passo 16 — Morale dei reparti, fatica, frecce e lo stendardo nemico

**In breve.** Le battaglie si rompono a pezzi: un reparto cede sul fianco mentre gli altri tengono, la fatica premia le ondate fresche, le frecce finiscono, abbattere lo stendardo nemico fa tremare la sua schiera.

**Acceso da.** `VDAT.ACCESO.grandi` (passo 29). Senza `reparti` nella scheda nulla cambia.

## Scopo

Le battaglie si rompono a pezzi: un reparto preso sul fianco cede mentre gli altri tengono, il Grido lo raduna. Chi combatte da tanto è stanco e un'ondata fresca lo travolge. I tiratori finiscono le frecce e devono tornare al carro. Abbattere lo stendardo del signore nemico fa tremare tutta la sua schiera.

## Leggi prima

`motori/28l-ven-campo.js`: `ferisci`, `mischia` (oggi il fianco conta solo per il cuneo), `tiro`, `muovi`, `capitano` (Grido), fine di `istante` (rotta del lato), `riepilogo`.

## Decisioni

1. **Morale per reparto** `s.mr[l][r]`, che parte da `s.mor[l]`. Numeri in `VCAM.C.MR`:
   | Voce | Effetto |
   |---|---|
   | `KO` | −60/max(6, uomini iniziali del reparto) per ogni caduto |
   | `FIANCO` | −0,4 per colpo preso di fianco o alle spalle (prodotto delle direzioni > −0,3) |
   | `CARICA` | −2 per carica subita |
   | `VICINO` | −8, una volta, quando va in rotta un reparto amico entro 15 |
   | `CAPO` | −25 a tutti, quando cade il comandante |
   | `UCCIDE` | +0,5 per nemico abbattuto, tetto 100 |
   | `ROTTA` | 15: soglia sotto cui il reparto va in fuga (`st='fuga'`, evento `{t:'rotta-r',l,r}`) |
   | `RADUNO` | 30: il Grido riporta il reparto a questo valore se torna almeno metà dei suoi fuggitivi (`{t:'raduno',r}`) |
   Chi difende le mura non si rompe. La rotta del lato di oggi resta e ha la precedenza.
2. **Fatica** `u.fa` (0–100), numeri in `VCAM.C.FA`:
   - correre +0,25 per istante; carica +3; colpo dato o preso in mischia +0,6; fermo −0,4; serrata ferma −0,6.
   - Sopra 60: attacco e velocità −15%; sopra 85: −30%.
   - Le ondate entrano a 0. `scheda.fatica0[l]` dà la fatica iniziale (la mettono i passi 17 e 32 tramite la scheda); `scheda.mod[l][tipo].fa` la moltiplica (caldo d'estate).
3. **Frecce** `u.fr` per i tiratori: `TR.fr` (archi 20, balestre 14, giavellotti 6; assente → infinito, così si resta come oggi). A 0 il tiratore combatte in mischia se ha un nemico entro 3; altrimenti va al proprio bordo e dopo 40 istanti torna con le frecce piene (evento `{t:'carro',r}`). La vista mostra la faretra sulla carta del reparto.
4. **Comandante nemico** (`scheda.capoB` se il primo nemico è un signore o la Volpe): un'unità `capo:true` del lato `b`, con i numeri di `VDAT.SIG_CAMPO` in `28jb-ven-dati-campo.js` (`{pf:70,att:14,dif:12,dan:11,vel:14,cav:true}`; la Volpe usa i suoi). Sta 4 passi dietro il reparto di fanti più vicino al centro. Quando cade: `{t:'stendardo',l:'b'}`, `MR.CAPO` a tutti i reparti, `s.mor.b-=18`; `riepilogo.capoKo`.
5. **Morale iniziale**: `scheda.morIni={a,b}` è uno scarto sul morale iniziale di tutti i reparti (lo usano la sfida, passo 35, e la strategia, passo 32). La probabilità di catturare il signore la cambia il passo 12 leggendo `riep.capoKo`.
6. **Equilibrio del capitano**: si tocca solo `VDAT.SIG_CAMPO`, per avere 60–80% di vittorie a truppe pari contro un signore con `capoB`.

## Stato e contratti

Stato: `s.mr`, `u.fa`, `u.fr`, `s.capoB`. `VCAM.morali(s,l)` → `[{r,mor,fa,fr}]` (medie per reparto, interi). Eventi `rotta-r`, `raduno`, `stendardo`, `carro`. Scheda: `capoB`, `fatica0`, `morIni`, `mod[l][tipo].fa`.

## Prove

- Impronta identica senza `reparti`.
- 6 tiratori presi alle spalle da 10 cavalieri vanno in rotta prima dei fanti dello stesso lato (10 semi su 10).
- Il Grido riporta un reparto in fuga a 30.
- Un reparto con `fa` 80 perde contro uno uguale con `fa` 0 in ≥ 80% dei semi.
- Un arciere tira al massimo 20 volte prima di andare al carro e poi torna.
- Caduta del comandante: −25 a tutti i reparti nello stesso istante.
- 40 semi, truppe pari, capitano contro signore con `capoB`: il lato `a` vince da 24 a 32 volte.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

HUD dei morali (passo 22), voci (passi 10, 28 e 39), IA che sfrutta la fatica (passo 25).

## Fatto quando

Prove verdi; le «Regole per il giocatore» scritte in questo file («Morale, fatica e frecce»).
