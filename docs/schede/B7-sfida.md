# B7 — La sfida al capo (singolar tenzone)

**Scopo.** Prima di una battaglia contro un signore, un capobanda o la Volpe, il capitano può sfidarne il capo a duello davanti alle schiere. Vincere mette paura al nemico (o lo fa arrendere, se sono predoni); perdere costa sangue e morale. È nostro: riusa l'arena dei tornei.

**Leggi prima.** `motori/28kc-ven-scontro.js`: `campoArena`, `esitoArena`, `statArena`, `feritoOggi`, `campo`, `esito`; `motori/28j-ven-dati.js`: `TRATTI`, `CAPIBANDA`, `RIVALE`, `SIG`; `app/24hwd-ven-scontro.js` (`incontroH`), `motori/28m-ven-stanza.js` (`scegli` in compagnia). Dipende da B3 (`VDAT.SIG.CAMPO`, `capoB`) e U3.

**Decisioni già prese.**
1. Possibile se il primo nemico è un signore, un capobanda o la Volpe, una volta per incontro, non in assedio.
2. **Accetta?** Conto in chiaro come la diplomazia, senza dadi: prode sì; crudele sì se il suo livello (o 5) ≥ quello del capitano; avido sì se metti in palio 100 monete (pagate solo se perdi); prudente no («Non rischio la testa per il tuo orgoglio»); capibanda e Volpe sì. Il rifiuto davanti ai suoi costa al nemico −10 di morale all'inizio della battaglia.
3. Il duello è una battaglia `tipo:'arena'` con un solo avversario: il capitano che sfida (statistiche di `statArena`) contro il capo (`VDAT.SIG.CAMPO`, capibanda e Volpe dai loro dati), stessa resa dei tornei.
4. **Esiti**: vinto → `s.sfida={v:true}`: fama +5, e alla battaglia morale nemico −20 e il capo parte ferito al 50%; contro **predoni** la banda si arrende: niente battaglia, metà bottino come una vittoria (`esito` con una battaglia vinta senza caduti) e il capobanda prigioniero. Perso → capitano al 50% fino a sera (`s.ferito`, come in lizza) e morale proprio −15; si torna all'incontro (puoi ancora ritirarti o pagare).
5. In compagnia sfida il capitano del telefono che tocca (`seat`); gli altri vedono il duello.

**Stato e contratti.** `s.incontro.sfida` ∈ `undefined|'duello'|'vinta'|'persa'|'rifiutata'`. `VEN.sfidaOk(s)` → `{ok,f:[{n,v}],tx}` (fattori e frase del capo). `VEN.scegli(s,{k:'sfida',seat})` apre il duello (`VEN.campo` restituisce l'arena finché `sfida==='duello'`). La scheda della battaglia vera riceve `sfida:'vinta'|'persa'|'rifiutata'` e `VCAM.nuovo` applica i morali. Errori: `'Qui non c'è nessun capo da sfidare'`, `'Hai già sfidato'`, `'Non durante un assedio'`.

**Passi.** 1) `sfidaOk` + test sui quattro tratti. 2) duello (arena) e ritorno all'incontro. 3) effetti nella battaglia e resa dei predoni. 4) bottone «Sfida il capo» nell'incontro con il conto nell'infobox. 5) regole («La sfida», 4 righe).

**Prove.** Nuovo `tests/test_ven_sfida.js`: prudente rifiuta; avido chiede la posta; capitano livello 8 ben armato contro un capobanda vince ≥ 60% su 30 semi, livello 1 ≤ 40%; dopo una vittoria contro predoni nessuna battaglia e `stat.vinte` +1; dopo una sconfitta `s.ferito` = oggi; morali iniziali −20/−15/−10 nei tre casi. `test_ven_stanza.js`: la sfida dal secondo telefono usa il suo capitano. Scenario `ventura_sfida`: incontro forzato con un capobanda → sfida → duello → vittoria → resa. Screenshot del duello a 390 px.

**Fuori scopo.** Duelli tra signori dell'IA.

**Fatto quando.** Prove verdi; la sfida compare solo quando è possibile.
