# B3 — Morale dei gruppi, raduno e il comandante nemico in campo

**Scopo.** Le battaglie si rompono a pezzi come quelle vere: un gruppo preso sul fianco cede e scappa mentre gli altri tengono; il Grido del capitano lo raduna; abbattere lo stendardo del signore nemico fa tremare tutta la sua schiera.

**Leggi prima.** `motori/28l-ven-campo.js`: `ferisci`, `mischia` (fianco: oggi solo per il cuneo), `capitano` (Grido), fine di `istante` (rotta del lato), `riepilogo`; `motori/28kc-ven-scontro.js`: `campo`, `esito` (cattura del signore con `r()<.5`). Dipende da B2.

**Decisioni già prese.**
1. `s.mg={a:{f,t,c},b:{f,t,c}}`, partono da `s.mor[l]`. Numeri in `VCAM.C.MG` (**qui**): `KO` (60/max(6,uomini iniziali del gruppo)), `FIANCO` (0,4 per colpo preso di fianco o alle spalle: prodotto delle direzioni > −0,3, per tutte le formazioni), `CARICA` (2 per carica subita), `VICINO` (8, una volta, quando un gruppo amico entro 15 va in rotta), `CAPO` (25 a tutti i gruppi quando cade il comandante), `ROTTA` (15), `RADUNO` (30), `UCCIDE` (+0,5 per nemico abbattuto, tetto 100).
2. Sotto `ROTTA` un gruppo va in fuga (le sue unità `st='fuga'`, come la rotta di oggi) ed emette `{t:'rotta-g',l,g}`. In difesa di mura (`l==='b'&&s.muro`) non si rompe, come oggi.
3. Il Grido (già rimette in piedi chi scappa entro 16) ora riporta il gruppo a `RADUNO` se almeno metà dei suoi fuggitivi torna: evento `{t:'raduno',g}`.
4. La rotta del lato (soglia di oggi su valore e morale) resta e ha la precedenza.
5. **Comandante nemico** (`capoB` nella scheda, se il primo nemico è un signore o la Volpe): un'unità del lato `b` con `capo:true`, numeri da `VDAT.SIG.CAMPO` (nuovo: `{pf:70,att:14,dif:12,dan:11,vel:14,cav:true}`; la Volpe usa i suoi). Sta 4 passi dietro l'ancora dei fanti (o con i cavalieri nella `finta`); porta lo stendardo (la vista lo disegna). Quando cade: `{t:'stendardo',l:'b'}`, `MG.CAPO` a tutti i gruppi `b`, `s.mor.b-=18`. `riepilogo` → `capoKo:true`.
6. In `esito`: con `capoKo` il signore è preso con probabilità 0,8 (oggi 0,5); senza, 0,3.
7. Equilibrio del capitano: oggi a truppe pari chi ha il capitano vince 38 su 40. Con `capoB` contro un signore l'obiettivo è **60–80%**. Si tocca solo `VDAT.SIG.CAMPO` per arrivarci.

**Stato e contratti.** `s.mg`, `s.capoB` (id dell'unità o -1). `VCAM.morali(s,l)` → `{f,t,c}` interi 0..100 (per U4 e la TV). Eventi `rotta-g`, `raduno`, `stendardo`. Scheda: `capoB:{nome,pf,att,dif,dan,vel,cav}`.

**Prove (`tests/test_ven_campo.js` e `test_ven_dottrine.js`).**
- Un gruppo di 6 tiratori assalito alle spalle da 10 cavalieri va in rotta prima dei fanti dello stesso lato (scheda fissa, 10 semi su 10).
- Grido entro 16 da un gruppo in fuga: torna `vivo` e `mg` = 30.
- Caduta del comandante: tutti i `mg.b` scendono di 25 nello stesso istante; `riepilogo.capoKo`.
- 40 semi, truppe pari, capitano contro signore con `capoB`: vittorie del lato `a` tra 24 e 32.
- Risolvi senza `capoB` e senza dottrine: vittorie entro ±3 su 40 rispetto a prima (la rotta per gruppi cambia un po' i numeri: annotarli nella PR).
- `npm test -- ven_` lenti compresi; tabella del bot.

**Fuori scopo.** HUD dei morali (U4), voci (B4).

**Fatto quando.** Prove verdi; regole aggiornate («Il morale dei gruppi», «Lo stendardo»).
