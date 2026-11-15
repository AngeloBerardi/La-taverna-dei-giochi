# V2 — Tornei nelle città

**Scopo.** In città, ogni tanto, c'è un torneo: il capitano combatte **da solo** tre duelli. Premi: monete, fama e, in finale, un oggetto pregiato.
È il posto dove la scelta dell'arma conta davvero.

**Area:** `docs/moduli/ventura.md`. **Leggi prima:** in `28k` `fai` (come sono fatte le azioni di luogo), `campo`, `esito`, `auto`, `rinnova`; in `28l` `nuovo` (campo `tipo`), `capitano`, `capU`, `risolvi`;
in `28j` `OGG`, `PREGIO`, `UNICA`; in `24hw` `luogoH`; in `24hv` `scena()`; in `28m` le azioni `fai`, `b-via`, `b-fine`.

## Decisioni già prese
- Torneo in una città quando `(giorno + l.id) % 7 === 0`: nessuno stato in più, dura tutto il giorno. La carta e le «voci» delle locande dicono dove sarà il prossimo.
- Iscrizione: 40 monete × livello del capitano. Tre turni: sfidante, campione, gran campione. Si può lasciare dopo ogni vittoria tenendo il premio maturato.
- Avversari: un solo uomo per lato, generato da seme e turno: arma a caso tra spada e scudo, a due mani, asta, mazza; vita e danno crescono col turno
  (i numeri in una tabella `TORNEO` in `VDAT`, tarati col bot: capitano di livello 5 ben equipaggiato vince il torneo circa 1 volta su 2).
- Il capitano combatte **con il suo equipaggiamento**, senza cavallo e senza arco (in lizza a piedi, corpo a corpo). Nessun ordine ai gruppi, niente Grido.
- Sconfitta: fuori dal torneo, niente prigionia, niente uomini persi, vita del capitano al 50% per il resto del giorno.
- Premi: turno 1 = iscrizione × 2; turno 2 = × 4 e +5 fama; finale = × 8, +15 fama e un oggetto di pregio 3 scelto dal dado (mai uno già posseduto).
- In compagnia: **ogni capitano seduto** entra in lizza insieme, contro altrettanti avversari; si vince o si perde come squadra; l'iscrizione si paga una volta per capitano.
- `auto` (risolvi senza giocare) è permesso anche qui.

## Stato e contratti
- `w.torneo = {lid, turno:0..2, posta, giorno}` oppure assente. Azioni di `VEN.fai`: `{a:'torneo'}` (iscrive; errori: «Oggi non c'è torneo», «Non hai abbastanza monete», «Sei già iscritto»),
  `{a:'lizza'}` (prepara il duello: da qui `VEN.campo` rende una scheda `tipo:'arena'`), `{a:'ritira'}` (incassa e chiude).
- `VEN.campo(s)`: con `s.torneo` in lizza → `{tipo:'arena', a:[solo capitani], b:[avversari], scena:{vicino:'citta'}, seme}`.
- `VCAM.nuovo`: `tipo:'arena'` = campo stretto (i lati partono a 12 passi), nessuna rotta, finisce quando un lato è a terra.
- `VEN.esito`: con `tipo:'arena'` avanza `turno` o chiude; rende `out.torneo = {vinto, turno, premio, oggetto}`.

## Passi
1. `28j`: tabella `TORNEO`. `28k`: azioni, `campo`, `esito`, `auto`. `28l`: `tipo:'arena'`. Test in `test_ven_mondo.js` e `test_ven_campo.js`; `tests/bot_ven.js` si iscrive quando conviene.
2. `28m`: nessuna azione nuova (passa da `fai`); test in `test_ven_stanza.js` con due capitani.
3. `24hw`: voce «Torneo» in `luogoH` delle città (iscrizione, turno, premio maturato, «Entra in lizza», «Ritirati»), esito con il premio.
4. `24hv`: scena `arena` (steccato tondo, pubblico a istanze sugli spalti, stendardi della città); usa i pezzi di `Solidi` che ci sono già.
5. Regole in-game, `docs/rules/ventura.md`, riga dell'area, scenario `ventura_torneo`.

## Prove
- Motore: stesso seme → stessi avversari; premio del turno 3 solo vincendo tre volte; perdere non tocca truppe né `prigioniero`; l'oggetto non è un doppione;
  fuori dal giorno giusto `torneo` rende l'errore. Bot accorto su 20 semi: vince almeno un torneo in 60 giorni in più di metà dei semi; bot a caso: quasi mai.
- Browser: iscrizione, lizza, `auto`, pannello dell'esito. Screenshot: l'arena a 390 px.

**Fuori scopo:** scommesse, tornei a squadre con le truppe, classifiche.

**Fatto quando:** test verdi, `npm run verifica` verde, scenari `ventura` verdi, una riga di taratura in `docs/VENTURA.md`.
