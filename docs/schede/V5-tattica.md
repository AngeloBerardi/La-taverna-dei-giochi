# V5 — Battaglie più tattiche: terreno e formazioni

**Scopo.** Il campo cambia già aspetto con il luogo; ora cambia anche il combattimento (altura, bosco, case, acqua bassa) e ogni gruppo può cambiare formazione con un tocco. L'assedio a fasi è la scheda `V5b-assedio`, da eseguire dopo questa.

**Area:** `docs/moduli/ventura.md`. **Modello:** Sonnet. **Prima:** PR 123 (V4) unita, per non scontrarsi su `28k` e `24hw`.

## Leggi prima (solo questi pezzi, con `grep -n`)
- `motori/28l-ven-campo.js` tutto (154 righe): `C`, `posto`, `nuovo`, `ordina`, `muovi`, `mischia`, `tiro`, `comanda`, `istante`.
- `motori/28j-ven-dati.js`: `ASP` e `aspetto(tid)` (dà `arma` e `scudo`). `motori/28k-ven-mondo.js`: solo `campo` (riga 488 circa: `terreno`, `scena`).
- `app/24hv-ven-campo.js`: `scena()` (righe 17–40: `alto`, alberi, case di `vic`), riga 119 (`K.alto` per i soldati). `app/24hw-ventura.js`: righe 240–241 (bottoni dei gruppi), comandi `cgr` e `cord` (riga 290).
- `tests/test_ven_campo.js` (forma dei test), `tests/test_ven_stanza.js` (un blocco con `b-ord`).

## Decisioni già prese
- Altura: chi sta più in alto tira più lontano (+15%) e in mischia colpisce meglio (+10%); salire rallenta.
- Bosco e case: metà dei tiri a segno contro chi sta dentro; i cavalieri dentro non caricano. Acqua bassa (costa, guado): movimento dimezzato, niente carica.
- Tre formazioni per gruppo, un tocco sul gruppo già scelto le fa girare: **serrata** (difesa su, lenta, ottima contro i tiri con gli scudi), **larga** (metà danni dai tiri, debole alla carica), **cuneo** (solo cavalieri e fanti: sfonda, fianchi scoperti).
- L'IA usa le stesse regole: arcieri in altura, fanti serrati davanti, cavalli sul fianco. Il terreno del motore è lo stesso che si vede: una sola funzione, nel motore, letta anche dalla vista.

## Stato e contratti (decisi dall'architetto)
- **Zone**: `s.zone=[{k:'altura'|'bosco'|'case'|'acqua',x,y,rx,ry,h}]`, ellissi (`h` solo per l'altura, 0.6–1). Le crea `nuovo` con `s.r()` **prima** delle unità; se `scheda.zone` è un array lo usa così com'è (test, riproducibilità). Arena e assedio: `[]`. Stato vecchio senza `zone` (battaglia in corso in una stanza): ovunque `s.zone||[]`, `q.fm||'larga'`.
- Generazione (centro sempre a 6 passi dai bordi): `terreno===3` o `scena.pend` → 2 alture; `terreno===1` → 1 altura 6 volte su 10; `terreno===2` → 2–3 boschi (`rx` 7–12, `ry` 6–10) e 1 altura 3 volte su 10; `terreno===1` → 1 boschetto (`rx` 5–7) 4 volte su 10. Alture: `x` 12–48, `y` 36–64 (terra di nessuno: va conquistata), `rx` 9–14, `ry` 7–10. `scena.vicino` di tipo villaggio, porto, locanda o monastero → una zona `case` (`rx` 7, `ry` 5) a `y` 16–22, `x` 12 o 48. `scena.costa` → `acqua` sul bordo di quel lato (`x` = 0 o `W`, `rx` 7, `ry` 70). Guado: su `terreno===1` senza neve (`bioma!==1`) e senza alture, 1 volta su 6: `acqua` a `x` 30, `y` 50, `rx` 45, `ry` 3. Mai due zone con i centri a meno di 10 passi (la seconda si scarta).
- Funzioni pure esportate (niente trigonometria; `e=((x-z.x)/z.rx)²+((y-z.y)/z.ry)²`): `quota(s,x,y)` = massimo di `h·(1-e)²` sulle alture con `e<1`, altrimenti 0, e −0.12 in acqua; `copre(s,x,y)` → `'bosco'|'case'|null`; `acqua(s,x,y)` → vero/falso. Dentro = `e<1`.
- Numeri in `C.TER={GIT:.15,MISCHIA:.10,DISL:.25,SALITA:.75,COPRE:.5,ACQUA:.5,BOSCO_CAV:.78,ALTO:3.2}` (`ALTO` = unità di scena per quota 1, lo legge solo la vista).
- Effetti. «Più in alto» = `quota(u)-quota(b)>DISL`. Tiro: gittata `u.git·(1+GIT)` nei tre confronti `db<=u.git` di `istante` e nel conto di `tiro`. Mischia: `att·(1+MISCHIA)`. `muovi`: se la quota del punto d'arrivo supera quella di partenza `v*=SALITA`; in acqua `v*=ACQUA`; cavalieri in bosco o case `v*=BOSCO_CAV`. `tiro`: se `copre(b)` la probabilità finale (dopo `stretto`) `*=COPRE`. Carica: in testa a `mischia`, `u.ca=0` se chi colpisce è in bosco, case o acqua, o se il bersaglio è in bosco o case.
- **Si tolgono** i due modificatori globali del bosco (`s.terreno===2` in `muovi` e in `tiro`): ora valgono solo dentro le zone. La neve (`bioma===1`) resta.
- **Formazioni**: `s.ord[l][g].fm` (`'serrata'|'larga'|'cuneo'`) e `.fmT` (istante da cui si può cambiare di nuovo). Partenza: fanti `serrata`, tiratori e cavalieri `larga`. `C.FM={serrata:{p:1.2,vel:.8,dif:1.2,scudo:.5,nudo:1.15,carica:.5},larga:{p:2.6,danT:.5,carica:1.5},cuneo:{p:1.7,att:1.15,carica:1.25,fianco:.75},CAV:.7,ATTESA:30,RIMBALZO:.8}`.
  - `p` = passo tra i posti (cavalieri `+CAV`); `posto(k,n,passo,larg,fm)`: con `cuneo` la riga `r` ha `1+2r` posti, punta verso il nemico. La forma si tiene con `tieni` e `segui`; gli effetti valgono sempre, capitani esclusi.
  - Serrata: `vel·.8`; in mischia la difesa di chi è colpito `·1.2`; tiri contro di lei `p·.5` se il bersaglio ha lo scudo (`aspetto(t).scudo`), `p·1.15` se non l'ha; la carica contro di lei vale metà (`u.ca·.5`). Se il bersaglio è un fante con asta (`arma` picca, alabarda o lancia) la carica è annullata e chi carica (`u.ca>.6`) subisce `ferisci(u, round(armatura(b.dan·RIMBALZO,u.dif)·C.DANNO))` prima del suo colpo.
  - Larga: danno dei tiri `·.5`; la carica contro di lei `·1.5`.
  - Cuneo: `att·1.15`; moltiplicatore di carica `·1.25`; colpito sul fianco (`u.fx·b.fx+u.fy·b.fy>-.3`, mischia e tiri) la sua difesa `·.75`.
- `ordina(s,{g,t:'forma',f})`: senza `f` gira (larga → serrata → cuneo → larga; i tiratori saltano il cuneo). Errori: «I tiratori non fanno il cuneo» (solo con `g:'t'` e `f:'cuneo'`; con `tutti` si saltano), «Il gruppo si sta ancora schierando» (`s.t<q.fmT`), «Formazione sconosciuta». Poi `q.fmT=s.t+ATTESA`, evento `{t:'ordine',l,g,o:'forma',f}`. In lizza resta l'errore di oggi. In stanza passa già da `b-ord` (`a.o` arriva intero a `ordina`): `28m` non si tocca.
- `gruppi(s,l)` resta com'è; nuova `forme(s,l)→{f,t,c}` per i bottoni. Export in più: `quota,copre,acqua,forme`.
- **IA** (`comanda`, lato `b` e `autoA`): in avvicinamento `f.fm='serrata'`, `t.fm='larga'`, `c.fm='larga'`; se c'è un'altura col centro a meno di 24 passi dall'ancora dei fanti e non oltre la metà campo nemica, i tiratori vanno sul centro e i fanti 5 passi davanti a loro; i cavalieri restano a 14 passi di lato, dalla parte senza acqua. Un'ancora in acqua arretra di 6. Al contatto (`ia.f=1`): `c.fm='cuneo'`; i fanti passano a `larga` solo se il nemico ha più tiratori che cavalieri e nessun cavaliere vivo. L'IA cambia `fm` senza `fmT`, una volta per fase.

## Passi
1. `28l`: `C.TER`, `C.FM`, zone in `nuovo`, `quota`/`copre`/`acqua`, effetti in `muovi`, `mischia`, `tiro`, `istante`; `posto` e `ordina` con `forma`; `comanda`. Test nuovo `tests/test_ven_tattica.js` (rapido); ritocchi a `tests/test_ven_campo.js` solo dove i numeri si spostano.
2. Taratura: se le prove di durata o del comandante accorto non passano si toccano solo `C.TER` e `C.FM`, mai i numeri delle truppe. `node tools/avventura/ventura.js` prima e dopo: il giudizio prima dello scontro (forze, riga 515 di `28k`) deve continuare a dare il vincitore nella stessa quota di casi (±5 punti).
3. `tests/test_ven_stanza.js`: stessi ordini (`forma` compresa) e stesso seme su due copie della stanza → `JSON` uguale.
4. Vista `24hv`: dentro il campo `alto(x,z)=VCAM.quota(K.s,x,z)*C.TER.ALTO` (fuori dal campo i dossi di oggi, raccordati sul bordo; il rumore di `monte` dentro il campo si toglie); alberi dentro il campo solo dove `copre==='bosco'` (fitti: 1 ogni 9 passi quadrati); 3–5 case di `vic` dentro ogni zona `case`; acqua: un piano azzurro semitrasparente a `y=-.1` sulle zone `acqua`. Nessuna nuova luce né materiale.
5. `24hw`: `cgr:g` sul gruppo già scelto (non `tutti`) manda `forma` (in stanza con `VenStanza.manda({t:'b-ord',…})`); sotto il nome del gruppo una riga piccola `vn-fm` con «serrata», «larga» o «cuneo» da `VCAM.forme`; avviso «Fanti: serrate le file», «…: allargatevi», «…: a cuneo». Niente emoji. CSS in `css/39j-ventura.css`.
6. `RULES.ventura` e `docs/rules/ventura.md`: «Il terreno» e «Le formazioni» (una tabella corta ciascuna, parole nostre).
7. Scenario `tools/test-browser/ventura_tattica`. 8. Riga in `docs/moduli/ventura.md`, stato in `docs/schede/README.md`, `npm run mappa`.

## Prove (schiere senza capitano: `val_f2` 12, `val_t2` 6, `val_c3` 4 per lato, semi 1–50, `zone` date a mano)
- Oggi, senza zone: vince `a` 18 volte su 50, durata media 493 istanti (con il capitano: 450). Dopo, con `zone:[]`: durata media tra 395 e 590 (con il capitano tra 360 e 540).
- Altura (`{k:'altura',x:30,y:26,rx:14,ry:9,h:1}` dalla parte di `b`, poi specchiata a `y:74` per `a`): sulle 100 battaglie chi ha l'altura vince più di 60; in ognuno dei due versi vince più che senza zone.
- Copertura: 300 tiri contro un bersaglio fermo nel bosco e 300 allo scoperto, stessa distanza: i colpi a segno nel bosco sono tra il 40% e il 60% degli altri.
- Acqua: lo stesso fante fa 20 passi in acqua in almeno 1,8 volte il tempo che all'asciutto; nessun evento `colpo` con `carica:true` da chi è in acqua, bosco o case. Salita: un fante sale un'altura più lentamente di quanto la scende.
- Formazioni: `forma` gira nell'ordine detto; i tre errori; distanza media dal vicino più prossimo serrata < cuneo < larga dopo 150 istanti di `tieni`. Carica: 12 `val_c3` contro fanti `fer_f2` (picca) di pari `valore` (±10%), 20 semi: contro la serrata i cavalieri vincono al più 4 volte; contro gli stessi fanti in larga vincono almeno 5 volte in più.
- Restano verdi: comandante accorto ≥ 60% e meglio del caso, forte batte debole, conservazione, risoluzione sotto 1500 ms, arena e tornei, `npm test -- ven_` (lenti compresi). Uno stato salvato senza `zone` né `fm` fa 200 istanti senza errori.
- Scenario 390 px: battaglia con altura e bosco forzati; due tocchi su «Fanti» → la riga passa a «larga»; terzo tocco subito → avviso «Il gruppo si sta ancora schierando». Screenshot: l'altura si vede, alberi solo nel bosco, i soldati stanno sul terreno (né sospesi né sepolti).

**Fuori scopo:** assedio a fasi (`V5b-assedio`), morale per formazione, formazioni dei capitani, fiumi sulla mappa del mondo, battaglie navali.

## Fatto quando
- [ ] `npm run verifica` verde; `npm test -- ven` verde (lenti compresi).
- [ ] Prove sopra coperte da test con i numeri indicati; scenario `ventura_tattica` verde; uno screenshot a 390 px.
- [ ] Nessun `Math.random`, `Date.now` o trigonometria nei motori; la vista non calcola più quote per conto suo dentro il campo.
- [ ] Regole in-game, riga del modulo, stato della scheda, mappa aggiornati.
