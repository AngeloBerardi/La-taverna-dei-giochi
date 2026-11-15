# V4 — Fondare un regno, vassalli, feudi, vittoria

**Scopo.** La partita ha un traguardo: una corona. Chi tiene una fortezza può fondare un regno, attirare signori, dare feudi, e vincere unificando le terre (le cinque città capitali). La partita continua dopo la vittoria.

**Area:** `docs/moduli/ventura.md`. **Modello:** Sonnet.

## Leggi prima (solo questi pezzi, con `grep -n`)
- `motori/28k-ven-mondo.js`: `nemiche`, `proposta`/`guerreDi`/`dominante`, `nuovo`, `pensa` (blocco «signori»), `conquista`, `sconfitta`, `giornoNuovo` (signori, diplomazia), `rendite`, `schieramenti`, `scegli` (`parla`), `esito` (presa di un luogo), `fai` (`giura`, `lascia`, `proponi`, `pace`, `guarnigione`), `traguardi`, `apri`.
- `motori/28j-ven-dati.js`: `FAZ`, `TRATTI`, `DIPL`. `motori/28m-ven-stanza.js`: `act` (già passa `fai`/`scegli`; `scorre` guarda `w.over`).
- `app/24hw-ventura.js`: `luogoH` (`sub==='sala'`), pannello compagnia (riga 180 circa), incontro `parla`, comando `fai` (riga 274). `app/24hu-ven-mappa.js`: colori di `'tu'`. `tests/bot_ven.js`.

## Decisioni già prese
- Si fonda con: una città o un castello propri (`l.faz==='tu'`), fama 150, 5000 monete, nessun servizio in corso. Nome (max 24 lettere) e uno stendardo tra 8.
- I regni confinanti reagiscono: chi ti era amico propone pace, gli altri ti dichiarano guerra entro 10 giorni.
- Signori: quelli di un regno caduto (esuli) o scontenti possono passare a te se glielo proponi quando li incontri; vogliono un feudo.
- Feudi: un luogo tuo si tiene (rendita piena, ma oltre 3 luoghi tenuti sale il malcontento) o si dà a un signore o a un compagno (rendita a lui, porta la sua compagnia in guerra). I compagni investiti diventano signori.
- Vittoria: tutte le capitali tue, oppure, da vassallo, del tuo re. Schermata finale con il riassunto (`traguardi`). In compagnia il regno è uno, di tutti.

## Stato e contratti (decisi dall'architetto)
- **Niente `s.over`**: ferma `passo` e `VST.scorre`. La vittoria è `s.vinta={g,come:'re'|'vassallo'}`, scritta una volta sola, con evento `{t:'vittoria'}`.
- **Il regno resta la fazione `'tu'`** (nessun id nuovo). `s.corona={nome,stend,da,sede,malc:0,minacce:{f:giorno}}`; assente = nessun regno (salvataggi v2 senza migrazione). Nell'app `V.regno` esiste già (regno di partenza): non confonderli.
- Con `s.corona`, i rapporti con i regni passano da `s.guerra`/`s.alleanza` con chiave `chiave('tu',f)`, non più da `s.rel`. In `nemiche`: `if(s.corona) return inGuerra(s,'tu',f)`. `s.rel` resta l'opinione (entra nei conti). Helper `fazioni(s)` = `D.REGNI` + `'tu'` se c'è la corona: lo usano `guerreDi`, `dominante` e il giro guerra/pace ogni 4 giorni di `giornoNuovo`; il giro che **crea** alleanze esclude `'tu'` come parte (ma `'tu'` può essere il `contro`).
- Helper `nomeF(s,f,lungo)` e `colFaz(s,f)→{col,col2}`: per `'tu'` con corona danno nome e colori dello stendardo. Sostituiscono `D.FAZ[x].breve/.col` nei log di diplomazia, in `conquista`, in `faz()` dell'app e in `VenMappa`.
- Aggressione con corona (`scegli` `aggredisci`/mischia): `s.guerra[chiave('tu',f)]=true` (e cade l'eventuale alleanza). Tributo `pace` con corona: `faiPace(s,'tu',con)`.
- Signori: campi nuovi `sg.cult` (cultura delle truppe; `pensa` riga 318 e `sconfitta` usano `p.cult||p.faz` per `leva` e reclute: `'tu_f1'` non esiste), `sg.am` (amicizia personale, assente = 0: +4 se vinci con lui alleato in `esito`, −10 se lo catturi), `sg.esule` (cultura d'origine) e `sg.esilio` (giorno di scadenza), `sg.comp` (id del compagno investito).
- Regno caduto (`conquista`): il re sparisce come oggi; gli altri signori diventano esuli (`faz:'neu'` su `sg` e compagnia, `cult` = vecchia fazione, `esilio=g+30`) invece di essere rimossi; a scadenza `rimuovi`. Se cade la corona (nessuna mura `'tu'`): `s.corona=null`, chiavi con `'tu'` tolte da guerra e alleanze, i signori `'tu'` diventano esuli, i compagni investiti tornano nella compagnia.
- Feudo = luogo con `faz==='tu'`: `sig<0` tenuto, `sig>=0` dato. `renditaL(l)` estratta da `rendite`; `rendite` conta solo i tenuti (e i feudi da vassallo come oggi), ridotti di `malc/200`. Il signore incassa `renditaL/7` al giorno.
- Malcontento giornaliero: `malc += (tenuti-3)*MALC_SU` se tenuti>3, altrimenti `-MALC_GIU`; tra 0 e 100. Se ≥ 60: morale `meta` −`malc/10`.
- `VDAT.REGNO={FAMA:150,ORO:5000,CONFINE:20,AMICO:20,GUERRA_ENTRO:10,TENUTI:3,MALC_SU:4,MALC_GIU:3,ESILIO:30,ADUNATA:3,TRUPPE_COMP:70,PASSA:{BASE:-4,ESULE:6,AMICIZIA:10,FAMA:100,FAMA_MAX:300,DEBOLE:2,GUERRA:-2,FEUDO:{villaggio:0,porto:1,castello:2,citta:3}},STENDARDI:[…8 {nome,col,col2}]}` (tinte diverse dai cinque regni: porpora/oro, nero/avorio, argento/rosso, oro/verde, oro/nero, blu notte/argento, avorio/rosso, rosso scuro/oro). `TRATTI[x].passa`: avido 2, crudele 1, prode 0, prudente −1, onorevole −4. `DIPL.PESO.re=1.2`.
- Confinanti = regni vivi con un luogo a distanza ≤ `CONFINE` da un luogo `'tu'`. Alla fondazione: `rel ≥ AMICO` → log «propone pace» e `rel+5`; `rel ≤ -25` → guerra subito; gli altri in `minacce[f]=g+1+⌊r()·GUERRA_ENTRO⌋`, e in `giornoNuovo` scatta la guerra se non c'è pace firmata nel frattempo.
- Nuove azioni di `fai` (errori in italiano): `fonda` `{nome,stend}` nella propria fortezza («Serve fama 150», «Servono 5000 monete», «Prima sciogli il tuo legame», «Hai già un regno», «Dai un nome al regno»); sempre possibili con corona: `feudo` `{lid,sid}` (`sid=-2` = tieni; togliere l'ultimo feudo a un signore lo rende esule), `investi` `{t,lid}` (compagno → signore, truppe `leva(cult,TRUPPE_COMP)`, `s.compagni[id]=-3`), `aduna` (i tuoi signori ti raggiungono per `ADUNATA` giorni: `ia.st='adunata'`), `dichiara` `{f}`, `rompi` `{f}` (preavviso come V3). `giura`/`contratto` con corona: «Un sovrano non serve nessuno».
- `proponi` con corona, nella capitale del re X: `pace`/`alleanza` con `proposta(s,tipo,X,'tu')` (peso `PESO.re`, niente «Opinione di b su di te»); `guerra`/`rompi` non passano dal conto (si usano `dichiara`/`rompi`).
  (Dopo la revisione di V3: `proposta` rifiuta se `s.parola[X]` è oltre oggi, attesa `DIPL.ATTESA` dopo ogni proposta accolta; vale anche per il sovrano.)
- `scegli(s,'passa:'+lid)` nell'incontro `parla` con un signore non re: `lealta(s,sid,lid)→{f:[{n,v}],tot,ok}|{err}` come `proposta` (base, esule, tratto, `sg.am/AMICIZIA`, fama, regno con ≤2 mura `DEBOLE`, in guerra con te `GUERRA`, tipo di feudo). Se ok: `sg.faz=p.faz='tu'`, `cult`, `casa=lid`, `l.sig=sg.id`, i suoi vecchi luoghi a `sig=-1`, `relaz(vecchia,-15)`.
- `schieramenti` `assalto`: `all` = signori `'tu'` a distanza < 2 dal luogo. `traguardi` + «Un regno tuo» e «Tutte le capitali». `vittoria(s)` controllata in `giornoNuovo` e in `conquista`. Export: `fazioni,nomeF,colFaz,renditaL,lealta,confinanti,vittoria`.

## Passi
1. `28j`: `REGNO`, `TRATTI.passa`, `DIPL.PESO.re`. 2. `28k`: helper, `nemiche`, `fonda` e reazione, signori (`cult`, esuli, `lealta`, `passa`), feudi e malcontento, azioni, vittoria. Test `tests/test_ven_regno.js` (rapido) e `tests/test_ven_regno_bot.js` (in `LENTI`). 3. `tests/bot_ven.js`: opzione `{regno:true}` del bot accorto (da fama 120 niente contratti; con fama e monete sceglie il castello più debole entro 40, se non è ostile aggredisce un signore di quel regno, assedia, entra, `fonda`). Gli altri test chiamano il bot come oggi. 4. App: blocco «Fonda un regno» nella sala della propria fortezza (input `vn-regno-nome`, 8 stendardi `stend:i` → `V.stend`), sotto-pannello `corona` (feudi, signori, malcontento, rendite, stato coi regni, minacce), `passa` nel pannello `parla` con i fattori, pannello `vittoria` all'evento, comando `fai` per i campi nuovi, colori via `colFaz`; CSS `vn-`. 5. `RULES.ventura` + `docs/rules/ventura.md` («Il regno»). 6. Scenario `ventura_regno`. 7. Riga in `docs/moduli/ventura.md`, stato in `docs/schede/README.md`, `npm run mappa`.

## Prove
- Bot accorto `{regno:true}`, semi 3,11,29,41,57,73, 90 giorni: fonda in ≥2 semi; bot a caso, semi 3,11,29: mai.
- Signore passato: `nemiche(s,p.faz,'tu')` falso; in 30 giorni mai in uno scontro contro `'tu'`; si schiera con te; dopo `feudo` a lui `rendite` cala esattamente di `renditaL`.
- Confinanti: entro 10 giorni guerra con i non amici, pace con gli amici. Malcontento sale con 5 luoghi tenuti, scende con 3. Esuli dopo la caduta di un regno; spariscono a 30 giorni.
- Salvataggio v2 di prima (senza `corona`, `cult`, `am`) si apre e gioca 5 giorni. Vittoria: capitali tutte `'tu'` → `s.vinta` una volta sola in 10 giorni di `passo`; da vassallo idem. Test V3 e `test_ven_mondo` ancora verdi.
- Scenario 390 px: fortezza tua con fama 200 e 6000 monete → fonda «Regno di Prova», stendardo 3 → pannello corona; capitali forzate a `'tu'` → pannello vittoria una volta, «Continua» torna al mondo. Screenshot: stendardo sulla mappa e pannello vittoria leggibili.

**Fuori scopo:** leggi del regno, tasse regolabili, successione, matrimoni.

## Fatto quando
- [ ] `npm run verifica` verde; `npm test -- ven` verde (lenti compresi).
- [ ] Prove sopra coperte da test con i numeri indicati; scenario `ventura_regno` verde; uno screenshot a 390 px.
- [ ] Regole in-game, riga del modulo, stato della scheda, mappa aggiornati.
