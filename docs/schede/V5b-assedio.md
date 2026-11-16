# V5b — Assedio a fasi: scale, breccia, porta

**Scopo.** Oggi le mura hanno sempre due varchi aperti. Ora si entra in tre modi: con le scale (subito, lenti e sotto tiro), dalla breccia (dopo giorni di preparativi), dalla porta (se si è costruito l'ariete). Chi difende tira dall'alto.

**Area:** `docs/moduli/ventura.md`. **Modello:** Sonnet. **Prima:** `V5-tattica` unita (usa `quota` e le formazioni).

## Leggi prima (solo questi pezzi, con `grep -n`)
- `motori/28l-ven-campo.js`: `nuovo` (`muro`, `varchi`), `versoVarco`, `muovi`, `comanda` (ramo `s.muro`), `istante` (bersaglio, blocco «muro», rotta e fine), `quota`.
- `motori/28k-ven-mondo.js`: `P` (riga 12), `passo` riga 364 (assedio pronto), `campo`, `scegli` (`togli`), `fai` `assedia` (riga 666), riga 274 (muoversi toglie l'assedio).
- `app/24hw-ventura.js`: pannello dell'incontro (riga 260), riga dell'assedio in `luogoH` (riga 119). `app/24hv-ven-campo.js`: righe 41–46 (mura e varchi).
- `tests/test_ven_campo.js`: il blocco «assedio».

## Decisioni già prese
- Scale: lente, si sale sotto tiro. Breccia: dopo i giorni di preparativi. Porta: con l'ariete, se costruito. Il difensore tira dall'alto.
- Macchine d'assedio manovrabili fuori scopo: l'ariete non è un'unità.

## Stato e contratti (decisi dall'architetto)
- **Mondo.** `P` + `BRECCIA_ORE:72, ARIETE_ORE:6, ARIETE_ORO:150`. `s.assedio={lid,pronto,da,ariete}` (`da` = inizio; un salvataggio vecchio senza `da` vale `da=pronto-ASSEDIO_ORE*60`). A `pronto` scatta l'incontro `assalto` come oggi (le scale sono pronte).
- `campo(s)` aggiunge alla scheda `assedio:{breccia:s.t-da>=BRECCIA_ORE*60, ariete:!!ariete}`. `auto` passa dallo stesso `campo`: la risoluzione automatica vede le stesse fasi.
- `scegli` nell'incontro `assalto` di un luogo murato: `attendi` (errore «La breccia è già aperta»): `incontro=null`, `pronto=da+BRECCIA_ORE*60`, `tu.ord={t:'aspetta',fino:pronto+60}`, log «Aspettate che le mura cedano.»; `ariete` (errori «L'ariete è già pronto», «Servono 150 monete»): paga, `ariete=true`, `incontro=null`, `pronto=s.t+ARIETE_ORE*60`, stessa attesa. `togli`, `attacca` e `auto` come oggi. Paghe, viveri e soccorsi dei signori continuano a correre durante l'attesa: è il prezzo della breccia.
- Nuova `assedioStato(s)→{scale:true,breccia,ariete,oreBreccia}|null` per il pannello. Gli assedi dei signori (`l.ass`) non cambiano.
- **Campo.** `scheda.assedio` assente (test vecchi) = `{breccia:true,ariete:false}`. In `nuovo`: `s.scale=[9,21,39,51]` (x), `s.scalaT=[0,0,0,0]`, `s.porta={x0:28,x1:32,pf:C.AS.PORTA,ariete}`, `s.varchi=breccia?[[41,46]]:[]`. Stato vecchio in corso: `s.scale||[]`, `s.porta||null`, i suoi `varchi` restano.
- `C.AS={SCALA:40,PORTA:60,SPINTA:1,SPINGONO:6,SALE_P:.1,MURO_Q:1}`.
- Scala: un'unità `a` non a cavallo (né `c==='c'` né `cav`; il capitano a cavallo sale ma dentro non carica: `u.ca=0` finché `u.y<s.muro`), a meno di .8 da una scala e a `y` tra `m+.4` e `m+1`, con la scala libera (`s.scalaT[i]<=s.t`): `u.sal=s.t+SCALA`, `s.scalaT[i]=u.sal`, evento `{t:'scala',id,i}`. Finché `u.sal>s.t` non si muove e non colpisce; i tiri contro di lei `p+SALE_P`. Allo scadere `u.y=m-.6`, `u.sal=0`. Se cade prima, la scala si libera.
- `versoVarco`: chi può salire sceglie tra varchi e scale il passaggio più vicino (stesso conto di oggi, le scale con +4 di costo); i cavalieri solo i varchi, e se non ce n'è tengono la posizione a `m+12`.
- Porta: se `s.porta.ariete` e la porta è chiusa, fino a `SPINGONO` fanti `a` con `|u.x-30|<2.4` e `y` tra `m+.4` e `m+2.4`, senza nemico in mischia, tolgono `SPINTA` a `porta.pf` a ogni loro ritmo (`u.cd`). A zero: `s.varchi.push([28,32])`, `porta.pf=0`, evento `{t:'porta'}`. Senza ariete la porta non si apre mai. L'IA di `a` (`autoA`) manda i fanti alla porta se c'è l'ariete e non c'è breccia, altrimenti al passaggio più vicino.
- Dall'alto: `quota(s,x,y)` in assedio vale `MURO_Q` per `y` tra `m-4` e `m` (il camminamento) e 0 altrove; i tiratori di `b` ci stanno già (`m-2.5`). Resta il −.2 di oggi a chi tira da sotto.
- Rotta e fine come oggi (chi difende le mura non va in rotta).

## Passi
1. `28l`: `C.AS`, `nuovo`, scale, porta, `versoVarco`, `comanda`, `quota`. Test `tests/test_ven_assedio.js` (rapido); il blocco «assedio» di `test_ven_campo.js` si aggiorna (`varchi.length` non è più 2).
2. `28k`: `P`, `da`, `campo`, `scegli` (`attendi`, `ariete`), `assedioStato`; stessi test.
3. `24hw`: nel pannello dell'incontro `assalto` tre righe (Scale: pronte · Breccia: «tra N ore» o «aperta» · Ariete: «pronto» o bottone «Costruisci, 150 monete»), bottoni `scegli:attendi` e `scegli:ariete`; «Combatti» e «Risolvi» restano. In stanza passano da `VST.act` come le altre scelte.
4. `24hv`: scale appoggiate alle mura in `s.scale`; portone di legno tra 28 e 32 che cade all'evento `porta`; breccia = tratto di muro mancante con macerie; l'ariete (tronco su ruote, `Solidi`) davanti alla porta se `s.porta.ariete`; chi sale interpola la quota tra terra e camminamento. Niente materiali nuovi.
5. `RULES.ventura` e `docs/rules/ventura.md`: «L'assedio» (tre modi di entrare, costi e tempi).
6. Scenario `tools/test-browser/ventura_assedio`. 7. Riga del modulo, stato in `docs/schede/README.md`, `npm run mappa`.

## Prove
- Nessuna unità viva sta nella fascia del muro (`|y-m|<.45`) fuori da un varco aperto, a meno che `u.sal>s.t`; nessun cavaliere ha mai `sal`; su una scala al più uno alla volta.
- 30 semi, attaccanti `val_f2` 24 + `val_t2` 10 contro `fer_f2` 10 + `fer_t2` 8: vittorie con sole scale < scale e ariete ≤ scale, ariete e breccia; con le sole scale tra 3 e 18 su 30; dietro le mura si resiste sempre meglio che in campo aperto (prova di oggi).
- Senza ariete `porta.pf` non cala mai; con l'ariete e nessun difensore la porta cade tra 100 e 400 istanti.
- Mondo: `assedia` → a `pronto` incontro `assalto` con `breccia:false`; `attendi` → nuovo incontro dopo 72 ore dall'inizio con `breccia:true`; `ariete` toglie 150 monete una volta sola; i tre errori; salvataggio vecchio senza `da` si apre e assalta. `auto` con e senza breccia dà esiti diversi sullo stesso seme in almeno 5 semi su 20.
- Restano verdi `npm test -- ven` (lenti compresi) e la risoluzione sotto 1500 ms.
- Scenario 390 px: assedio forzato con ariete → pannello con le tre righe, «Combatti», la porta cade. Screenshot: scale, portone e camminamento leggibili.

**Fuori scopo:** torri d'assedio, olio e sassi dalle mura, sortite dei difensori, assedi dei signori giocati sul campo.

## Fatto quando
- [ ] `npm run verifica` verde; `npm test -- ven` verde (lenti compresi).
- [ ] Prove sopra coperte da test con i numeri indicati; scenario `ventura_assedio` verde; uno screenshot a 390 px.
- [ ] Regole in-game, riga del modulo, stato della scheda, mappa aggiornati.
