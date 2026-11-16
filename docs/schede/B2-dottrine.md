# B2 — Dottrine dei regni e indole del comandante

**Scopo.** Ogni regno combatte a modo suo e ogni signore col suo carattere: i cavalieri di Valdoro aspettano e colpiscono di fianco, gli arcieri di Selvamara cercano il bosco, le picche di Ferropietra avanzano a riccio, le balestre di Maralta tirano dietro i fanti, i cavalieri di Altavento girano attorno e fingono la fuga. Si riconoscono senza leggere il nome.

**Leggi prima.** `motori/28l-ven-campo.js`: `comanda` (tutta), `istante` (scelta del bersaglio, ogni 20 istanti chiama `comanda`), soglia di rotta in fondo a `istante`; `motori/28j-ven-dati.js`: `FAZ` (`forte`), `TRATTI`; `motori/28kc-ven-scontro.js`: `campo`. Dipende da B1.

**Decisioni già prese.**
1. Dati in `VDAT.DOTTRINE` (nuovo, **numeri qui**): `{val:'martello',sel:'bosco',fer:'riccio',mar:'pavesi',alt:'finta',pre:'orda',mer:'equilibrio',neu:'equilibrio',tu:'equilibrio'}` e per ogni dottrina i suoi numeri (tempi in istanti, distanze in passi). `VDAT.INDOLE` per i quattro tratti.
2. `comanda(s,l)` diventa un **dispatcher**: `PIANI[s.dott[l]](s,l,ctx)` dove `ctx={o,ia,me,ne,my,ny,dist,ver,mt,nt,X}` con `X` = numeri della dottrina già corretti dall'indole. `equilibrio` = il codice di oggi spostato tale e quale (stessi esiti per chi non ha dottrina). Assedio e arena restano come oggi, prima del dispatcher.
3. Se il gruppo chiave della dottrina è vuoto (es. `martello` senza cavalieri) si usa `equilibrio`.
4. I piani (fase in `ia.f`, istante d'inizio in `ia.t0`):
   - **martello** (Valdoro): fanti serrata avanzano al contatto; cavalieri larga a 16 passi di lato, fermi finché i fanti non sono in mischia (un fante nemico entro 3 dal centro dei fanti) o `t>X.ATTESA`; poi cuneo, **ancora sul centro dei tiratori nemici** (o, se non ci sono, sul fianco dei fanti nemici) e carica. Tiratori tengono 6 dietro i fanti.
   - **bosco** (Selvamara): tiratori all'altura/bosco più vicino nella propria metà (come l'IA di V5, ma anche bosco); fanti tengono 5 davanti a loro e non avanzano finché il nemico non è a `X.ARRIVO` (12); cavalieri larga, caricano solo tiratori nemici isolati (nessun fante nemico entro 8 da loro). Se i tiratori nemici superano i propri di 4, tutti avanzano.
   - **riccio** (Ferropietra): fanti serrata, avanzano di 1,6 a comando (lenti), mai `carica` finché il nemico non è entro `X.URTO` (6); cavalieri dietro i fanti come riserva, caricano solo chi arriva sul fianco dei fanti (|dx| > 6 dal centro, entro 10).
   - **pavesi** (Maralta): fanti tengono, larghi davanti; tiratori 4 dietro; se un nemico arriva a 9 dai tiratori, i tiratori ripiegano di 10 dietro i fanti (una volta ogni `X.RIPIEGO` istanti); tutti caricano quando il morale nemico scende sotto `X.CROLLO` (40).
   - **finta** (Altavento): cavalieri (anche arcieri a cavallo) larga, si tengono a `0,8×gittata` dal gruppo nemico più vicino; se un nemico arriva a 10 ripiegano di 12 verso il proprio bordo; carica in cuneo quando `t>X.ATTESA` o forze nemiche < 0,7 delle iniziali. Fanti tengono indietro.
   - **orda** (predoni): tutti alla carica subito (come oggi con `fazb==='pre'`).
5. **Indole** (solo se il comandante è un signore): prode = tempi ×0,6, mai ripiego; prudente = tempi ×1,4, cavalieri in riserva finché le forze nemiche non sono < 0,8, soglia di rotta +0,05; crudele = i suoi uomini scelgono il bersaglio più ferito entro 3 passi dal più vicino (nella scelta del bersaglio di `istante`); avido = soglia di rotta +0,04.
6. **Schieramento del nemico** (B1): `nuovo` mette le ancore iniziali del lato `b` secondo il piano (cavalieri di lato per martello e finta, tiratori sull'altura per bosco…), con le stesse funzioni.
7. Il lato `a` in risoluzione automatica usa `dott.a` = `'equilibrio'` (oggi), così l'equilibrio del mondo non si sposta per il giocatore.

**Stato e contratti.** Scheda: `dott:{a,b}` (assente → `equilibrio`), `indole:{b}` (assente → nessuna). Stato: `s.dott`, `s.indole` copiati in `nuovo`. In `VEN.campo`: `dott.b` = `VDAT.DOTTRINE[fazb]`, `indole.b` = tratto del signore se il primo nemico è `k:'sig'`. Evento nuovo `{t:'piano',l,k}` quando un piano cambia fase (per le voci e la regia).

**Prove (nuovo `tests/test_ven_dottrine.js`, rapido, 40 semi per caso, niente capitani).**
- Ogni dottrina contro `equilibrio`, stesse truppe tipiche del regno (2/3 del gruppo `forte`): vince tra il **45% e il 75%**; contro la stessa dottrina tra 35% e 65%.
- martello: in ≥ 80% dei semi il primo colpo di mischia dei cavalieri arriva dopo il primo dei fanti.
- finta: prima dell'istante 600 meno del 15% dei colpi dei cavalieri di Altavento è in mischia.
- riccio: i fanti restano in serrata finché non c'è contatto (ogni comando).
- bosco: con un bosco forzato nella metà `b`, all'istante 300 l'ancora dei tiratori è dentro il bosco.
- pavesi: con cavalieri nemici alla carica, l'ancora dei tiratori arretra almeno una volta.
- `risolvi` delle schede di `test_ven_campo.js` senza `dott`: esito identico a prima.
- Bot del mondo (`node tools/avventura/ventura.js`): nessun seme in rovina; tabella nella PR.

**Fuori scopo.** Dottrina scelta dal giocatore per sé (in futuro con il regno), morale dei gruppi (B3).

**Fatto quando.** Prove verdi, numeri nella PR, `docs/rules/ventura.md` con una tabella «Come combattono i regni» (una riga per regno, parole nostre).
