# V7 — Vista TV della stanza, musica e suoni propri

**Scopo.** Con la TV accesa la mappa sta sul televisore (larga, senza comandi) e i telefoni diventano tastiere di comando. La Ventura suona musica e suoni suoi: oggi prende in prestito quelli dell'Avventura (`avv-…`).

**Area:** `docs/moduli/ventura.md`. **Modello:** Sonnet. **Prima:** nessuna (se `V5b` è già unita, gli eventi `scala` e `porta` entrano nella tabella `CAMPO`: il test li pretende da solo).

## Leggi prima (solo questi pezzi, con `grep -n`)
- `motori/28c-avv-audio.js`: intestazione (formato di tracce e partiture), `TRACCE`, due voci di `SUONI`, `ESISTENTI`. `app/24hk-audio-avv.js` intero (22 righe: il tramite da imitare; riga `traccia()` chiama `Ven.traccia()`). `tests/test_avv_audio.js` blocchi 1 e partiture.
- `app/03-audio.js` righe 159–166: `Snd.def`, `Snd.fx`, `Snd.play`, `Snd.duck`, `Snd.quale`.
- `motori/28m-ven-stanza.js`: `act` (riga 33), `salvabile`. `app/24hx-ven-stanza.js`: `seat`, `specchia`, `manda`, `giro`, `sync`.
- `app/24hw-ventura.js`: `mondo` (righe 61–64), tocco sulla mappa (riga 89), `altoH`, `bassoH`, `campoH`, `html`, `dopo`, `fineBattaglia`, `act` righe 324–328, `traccia` (riga 343), `menuH`. `app/24hv-ven-campo.js`: `eventi` e `suono` (112–123), `K.segue`, `K.fuoco`, `K.alt`. `app/24hu-ven-mappa.js`: `K.alt`, `VenMappa.centra`. `app/24ht-ven-arte.js`: `RIGHE`, `qual`, `misura`.
- `css/37-schermo.css` (cosa fa `html[data-tv]`), `css/39g-stanza.css` righe 34–43 (modello `html[data-tv].avt-on`), `css/43-tv-lowpoly.css` riga 4. `tools/test-browser/run.py`: `sc_avv_tv` (righe 2203–2230, come si apre la TV: `'?tv='+code+'&net=rt'`, 1280×720) e `sc_ventura_stanza`.

## Decisioni già prese
- TV in sola visione; mostra mappa larga con la compagnia al centro, cronaca, capitani; in battaglia tutto il campo. Sui telefoni la mappa resta ma contano pannelli e ordini.
- Musica a partitura, quattro temi (viaggio, notte e accampamento, città, battaglia) e due motivi brevi (vittoria, sconfitta). Suoni propri scelti da tabelle pure con test, come `AAUD`.
- I telefoni non scoprono la TV da soli: la accende un capitano con un interruttore («Mappa sulla TV»).
- Con la TV accesa la musica e i suoni del mondo e della battaglia escono solo dalla TV; ogni telefono suona soltanto ciò che fa lui. Senza TV ogni telefono suona tutto, come oggi.

## Stato e contratti (decisi dall'architetto)
- **Stanza.** `G.tv` (assente = spenta, mai salvata: `salvabile` copia solo `w`). Mossa nuova in `VST.act`: `{t:'tv',v,seat}` → `v?s.tv=true:delete s.tv`; non chiama `avanza`, il tempo non si muove, `evn++`. Vale anche in battaglia. Errori: quelli già presenti per chi non è seduto.
- **Motore audio (nuovo)** `motori/28n-ven-audio.js`, costante `VAUD`, in manifest dopo `28m`; puro, niente `require` di altri motori, niente `Math.random`. Esporta `{TRACCE,SUONI,ESISTENTI,PAUSA,MAX_CAMPO,LOG,MONDO,CAMPO,FAI,ORDINE,contesto,traccia,mondo,campo,fai,ordine}`.
  - `contesto(s,inCampo,notte)` → `'battaglia'` se `inCampo`; `'citta'` se `s.dentro>=0`; `'notte'` se `notte` o l'ordine della compagnia è `aspetta`; altrimenti `'viaggio'`. `traccia(ctx)` → `'ven-'+ctx`.
  - `mondo(ev)`, `campo(ev,capId)`, `fai(verbo)`, `ordine(o,cavallo)` → lista `[{n,r}]` (`n` nome del suono, `r` ritardo in ms), senza doppioni nella stessa chiamata. Una voce di tabella è un nome, `null` (silenzio voluto) o una funzione dell'evento.
  - `TRACCE`: `ven-viaggio`, `ven-notte`, `ven-citta`, `ven-battaglia`. `SUONI` (partiture, 13): `ven-passi`, `ven-zoccoli`, `ven-mercato`, `ven-moneta`, `ven-porta`, `ven-alba`, `ven-corno`, `ven-cozzo`, `ven-freccia`, `ven-grido`, `ven-rotta`, `ven-vittoria`, `ven-sconfitta`. `ESISTENTI=['err','sel','ok']`.
  - `MONDO`: `incontro`→corno · `dentro`,`davanti`→porta · `giorno`→alba · `log`→`LOG[e.tipo]` · `conquista`→`e.faz==='tu'?'ven-vittoria':null` · `esito`→vittoria se `e.out.vince==='a'`, altrimenti sconfitta · `vittoria`,`regno`→vittoria · `scoperta`,`passa`→`'ok'` · `libero`,`fine-attesa`→`null`. `LOG={'':null,bene:null,male:null,guerra:'ven-corno'}`.
  - `CAMPO`: `colpo`→cozzo solo se `dan>0`, non `freccia`, e (`crit` o `carica` o tocca `capId`) · `tiro`→freccia · `ko`→grido se `e.cap` · `cap-ko`→grido · `grido`,`rinforzi`→corno · `ordine`→corno se `e.l==='a'&&e.o==='carica'` · `rotta`→rotta · `fine`→vittoria/sconfitta. `MAX_CAMPO=3` suoni per chiamata; `PAUSA` (ms tra due uguali, la applica la vista): cozzo 120, freccia 180, corno 900, passi e zoccoli 400.
  - `FAI`: `compra`,`vendi`→mercato · `compraogg`,`vendiogg`,`riscatta`,`consegna`,`torneo`,`ritira`,`pace`,`cura`,`benedizione`,`voci`,`riposa`,`imbarca`→moneta · `recluta`,`assolda`,`compagno`,`guarnigione`→passi · `assedia`,`assalta`,`lizza`,`razzia`,`dichiara`→corno · `fonda`→vittoria · `promuovi`,`abilita`,`investi`,`feudo`,`giura`,`contratto`,`incarico`,`proponi`→`'ok'` · `equipa`,`togli`→`'sel'` · `esci`→porta · `aduna`,`rompi`,`lascia`,`libera`,`congeda`→`null`.
  - `ORDINE`: `vai`,`entra`,`segui`→`cavallo?'ven-zoccoli':'ven-passi'` · `aspetta`,`ferma`→`null`.
- **Primo tema (già scritto, non ritoccare):** `'ven-viaggio':{sd:.15,bar:8,prog:[[50,0],[48,1],[45,0],[50,0],[53,1],[48,1],[45,0],[50,0]],arp:[0,2,1,2,3,2,1,2],lead:'flute',drum:'march',mel:[[62,0,65,69,0,67,65,0],[64,0,67,72,0,71,67,0],[69,0,72,71,69,0,64,0],[65,64,62,0,0,0,57,0],[65,0,69,72,0,74,72,0],[72,0,71,67,0,64,67,0],[69,0,67,64,0,60,64,0],[62,0,0,0,0,0,0,0]]}`.
  Gli altri tre sullo stesso stampo (8 battute, re dorico o la minore, la melodia chiude sulla radice): `ven-notte` `sd:.22,bar:6,lead:'bell',drum:'tav'`, al più 2 note per battuta; `ven-citta` `sd:.14,bar:6,lead:'pluck',drum:'tav'`, maggiore, almeno 4 note per battuta; `ven-battaglia` `sd:.12,bar:8,lead:'brass',drum:'epic'`, minore. `ven-vittoria`: quattro note di ottoni che salgono e un timpano, sotto 1,5 s; `ven-sconfitta`: tre note di flauto che scendono su un `pad`, sotto 2 s. Ogni altra partitura sotto 0,8 s e con al più 6 primitive.
- **Tramite (nuovo)** `app/24hy-ven-audio.js`, `VenAudio`, in manifest dopo `24hx`: registra tracce e suoni come `24hk`; `suona(lista)` applica `PAUSA`; `traccia()`, `mondo(ev)`, `campo(ev)`, `fai(verbo)`, `ordine(o)` (cavallo da `VEN.statCap(s.cap).cavallo`); ogni errore finisce in `ERR.n(e,'ventura-audio')`, mai fuori. `Ven.traccia` diventa `()=>VenAudio.traccia()`.
  Chi suona: `ascolta=ui.tv||!(VenStanza.on()&&G.tv)`. `mondo` e `campo` suonano solo se `ascolta`; `fai` e `ordine` sempre (la TV non ne manda). Sul telefono con `G.tv` accesa `Snd.duck(true)`, al rientro `Snd.duck(false)` (in `VenStanza.sync`).
- **TV.** `Ven.dopo` mette `html.vn-tv` se `ui.tv`, `html.vn-ctl` se telefono seduto e `G.tv`. Nuove in `24hw`: `tvH()` (fascia alta: nome della compagnia, giorno e ora, monete, uomini, viveri, codice della stanza; a destra «Cronaca» con le ultime 6 righe di `s.log`, colore per `tipo`; in basso i capitani da `VEN.capi(s)` con nome e livello) e `campoTvH()` (solo la barra delle forze di `campoH` e il tempo). In `html()`: se `ui.tv` → `campoTvH()` o `tvH()`, più `incontroH()`/`esitoH()` quando `s.incontro`/`V.pan==='esito'` (i bottoni sono già inerti per `37-schermo.css`); nessun altro pannello, niente `altoH`/`bassoH`.
  CSS in `39j`: `html[data-tv].vn-tv #tvpanel{display:none}`, `html[data-tv].vn-tv #app{margin-left:0}`, testi `clamp(16px,1.6vw,28px)`. Mappa: `VenMappa.K.alt=26` e `VenMappa.centra()` a ogni giro. Battaglia: `K.segue=false`, `K.fuoco={x:30,z:50}`, `K.alt=80`. Qualità: `RIGHE.tv=450` e `qual()` risponde `'tv'` se `ui.tv` (a 1280×720: `A.k===2`).
- **Telefono con la TV accesa** (`vn-ctl`): `.vn-scena` occupa il 38% alto (resta toccabile, `misura` si adegua da sola); sotto, al posto di `bassoH`, `ctlH()` (nuova): griglia a due colonne di tasti alti 64 px con le stesse azioni di `bassoH` più «Luogo» (`pan:luogo`) quando `s.dentro>=0||s.davanti>=0`. In battaglia gruppi e ordini di `campoH` sulla stessa griglia. Interruttore «Mappa sulla TV» in `menuH`, visibile solo in stanza: `data-v="tv"` → `VenStanza.manda({t:'tv',v:!G.tv})`.

## Passi
1. `28n-ven-audio.js` + `tests/test_ven_audio.js` (rapido). 2. `28m`: mossa `tv` + prova in `test_ven_stanza.js`.
3. `24hy-ven-audio.js`; in `24hw` e `24hv` ogni `Snd.play('avv-…')` e la funzione `suono` passano da `VenAudio` (resta `Snd.play('err')`). 4. `24hw`/`24hx`/`24ht`/`39j`: TV e telefono-comando.
5. Scenario `ventura_tv` in `run.py`. 6. `RULES.ventura` e `docs/rules/ventura.md` («Sul televisore»), riga del modulo, stato in `docs/schede/README.md`, `npm run mappa`.

## Prove
- `test_ven_audio.js`: 4 tracce con 8 battute × `bar` note, `prog` di 8, tutte diverse tra loro e dalle 8 di `AAUD`; ogni partitura usa solo le primitive dell'intestazione di `28c`; ogni nome nelle tabelle sta in `SUONI` o in `ESISTENTI`, e gli `ESISTENTI` hanno il loro `case` in `03-audio.js`.
- Copertura letta dal sorgente: ogni `ev.push({t:'x'` di `28k` ha chiave in `MONDO`, ogni evento di `28l` in `CAMPO`, ogni `z.a==='x'` di `28k` in `FAI`, ogni ordine di `VEN.ordina` in `ORDINE` (40 verbi, 5 ordini oggi).
- `contesto`: i quattro casi; battaglia vince su tutto, città sulla notte. Una mischia di 300 istanti (bot di `test_ven_campo.js`): `campo(ev,capId)` mai più di 3 suoni, almeno un `ven-cozzo` e un `ven-freccia` in tutto.
- Nessun `avv-` in `24hw`, `24hv`, `24hx`, `24hy`, `28n` (test che legge i file).
- `test_ven_stanza.js`: `tv` accende e spegne, `w.t` uguale prima e dopo, `evn+1`, non compare in `salvabile`, resta accesa dopo un `ordina`, chi non è seduto riceve l'errore.
- Scenario `ventura_tv` (2 telefoni 390 px + TV 1280×720): la TV ha `viewer()===-1`, nessun `.vn-basso`, `#tvpanel` nascosto, `VenArte.A.k===2`, stesso giorno e stesse monete dei telefoni dopo un `aspetta` di 2 ore; `VenStanza.manda` sulla TV dà «La TV guarda soltanto»; dopo l'interruttore i telefoni hanno `vn-ctl` e la scena alta meno della metà dello schermo; `Snd.quale()` sulla TV è `ven-viaggio` e diventa `ven-battaglia` a battaglia aperta. Uno screenshot della TV sulla mappa e uno in battaglia, guardati una volta: si leggono cronaca e capitani, si vedono entrambe le schiere.

**Fuori scopo:** voce narrante, musica registrata, suoni delle azioni degli altri capitani, TV che si annuncia da sola, comandi dal telecomando.

## Fatto quando
- [ ] `npm run verifica` verde; `npm test -- ven_` verde (lenti compresi); scenari `ventura_tv` e `ventura_stanza` verdi.
- [ ] Prove sopra coperte dai test con i numeri indicati; due screenshot della TV guardati.
- [ ] Regole in-game, riga del modulo, stato della scheda, mappa aggiornati.
