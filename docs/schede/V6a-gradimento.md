# V6a — Gradimento dei compagni, memoria dei signori, talenti

**Scopo.** I compagni approvano o detestano quello che fai e, maltrattati, se ne vanno con qualche uomo. I signori ricordano e, conosciuti, danno notizie, favori, sostegno.

**Area:** `docs/moduli/ventura.md`. **Leggi prima** (solo questi pezzi, con `grep -n`): in `motori/28j-ven-dati.js` `ABIL`, `COMPAGNI`, `TRATTI`, `DIPL`;
in `motori/28k-ven-mondo.js` `nuovoCap`, `abil`, `nuovo` (ultima riga: `s.compagni`), `apri`, `giornoNuovo` (viveri e paga), `fai` (`razzia`, `libera`, `riscatta`, `compagno`, `cura`, `torneo`, `lascia`, `consegna`),
`scegli` (`parla`, `paga`, `fuggi`), `esito`, `proposta`, `statArena`; in `app/24hw-ventura.js` `compagniaH`, `capitanoH`, `incontroH`, `truppaH`.

## Decisioni già prese
- Niente dadi: il gradimento è un conto. Niente testi di dialogo qui (arrivano con V6b/V6c): solo righe di cronaca con `L(s,tx,tipo)`.
- Ciò che un compagno ama o detesta si scopre giocando: l'infobox lo mostra solo dopo che è successo una volta.
- Il sostegno dei signori pesa sulle proposte al re (V3). Il voto dei vassalli (V4) è fuori da questa scheda.

## Stato e contratti (i numeri stanno in `VDAT`, si ritoccano lì)
- `VDAT.GRAD` (nuovo) `{INIZIO:50, PARLA:25, VIA:10, FIDO:75, GIORNI:7, AMA:6, ODIA:-8, SERVE:3, NONSERVE:-4, PAGA:2, VINTA:1, INTESA:1, ANTIPATIA:-1, LUTTO:-8, QUOTA:.12, SEGUONO:6}`.
- Eventi (stringhe): `razzia libera riscatta pagatardi fame perdite vittoria fuga tributo sito torneo cura` e `servi_<regno>` (val sel fer mar alt).
- `COMPAGNI[i]` guadagna `ama:[2]`, `odia:[2]`, `lega:{id,n}` (n 1 intesa, -1 antipatia):
  berta ama vittoria, torneo · odia fuga, tributo · antipatia ulf — lapo ama libera, cura · odia razzia, perdite · intesa nera —
  ghino ama sito, tributo · odia perdite, servi_mar · intesa fosca — isa ama riscatta, servi_mar · odia pagatardi, fame · antipatia brando —
  ulf ama vittoria, servi_fer · odia fuga, pagatardi · antipatia berta — dia ama libera, vittoria · odia razzia, tributo · intesa ulf —
  temu ama razzia, sito · odia servi_alt, fame · intesa ghino — nera ama libera, cura · odia razzia, riscatta · intesa lapo —
  brando ama riscatta, fuga · odia perdite, torneo · antipatia isa — fosca ama sito, riscatta · odia perdite, fame · intesa temu.
- `s.grad[id]={g,avv,visto:[]}` per chi è in compagnia (creato da `fai compagno`; `apri` lo crea a `INIZIO` per i compagni già in `tr`, e mette `ab.carisma/diplomazia/cavaliere=0` a `s.cap` e `s.soci` se mancano).
- `VEN.reagisci(s,evento)` (nuova, esportata): per ogni compagno in compagnia somma `AMA`/`ODIA` se l'evento è suo (e lo aggiunge a `visto`); positivo ×(1+0,1·Carisma), negativo ×(1−0,05·Carisma), arrotondato;
  limita 0..100; una riga di cronaca per compagno che cambia («Berta la Rossa approva.» `bene` / «… non gradisce.» `male`). `VEN.umore(g)` (nuova) → `fedele` ≥75, `contento` ≥55, `tranquillo` ≥35, `scontento` ≥25, `in bilico`.
- Dove si chiama: `fai razzia/libera/riscatta/cura/torneo`; `scegli paga` → `tributo`, `fuggi` → `fuga`; `esito` vinto con `fn>=fa` → `vittoria` (e `VINTA` a tutti), sito ripulito → `sito`,
  `out.morti >= 25%` degli uomini di prima → `perdite`; `giornoNuovo`: fame → `fame`; giorno di paga: pagato → `PAGA` a tutti, non pagato → `pagatardi`, servizio in corso → `servi_<faz>` (`SERVE`/`NONSERVE` al posto di `AMA`/`ODIA`), legami (`INTESA`/`ANTIPATIA` se l'altro è in compagnia).
- Addio, in `giornoNuovo`: `g<PARLA` e `avv=0` → `avv=giorno`, cronaca «X vuole parlarti: così non resta.» (`male`); `g<=VIA`, oppure `g<PARLA` da `GIORNI` giorni → `VEN.parte(s,id)` (nuova): toglie il compagno da `tr`,
  `s.compagni[id]=-3` (non torna), porta via `min(SEGUONO, floor(uomini·QUOTA))` uomini dal rango più basso, `LUTTO` a chi aveva intesa con lui, `s.ev.push({t:'compagno',id,via:1})`. Se `g` risale a `PARLA` o più: `avv=0`.
- Talenti in `ABIL`: `carisma` (sopra), `diplomazia` (in `proposta` fattore «Diplomazia del capitano» = 0,4·punti), `cavaliere` «Fama di cavaliere» (in `statArena`: +2 `att` e +4 `pf` per punto). `nuovoCap` li mette a 0.
- Signori: `sg.mem={lib,sconf,trad,fav,g}` (creato in `nuovo`; `apri` lo aggiunge). `VDAT.SIG` (nuovo) `{SOGLIE:[3,7,12], ATTESA:10, PRESTITO:300, RESA:360, SCAD:21, LETTERA:14, SOSTEGNO:1.5, MAX_SOST:2}`.
  `VEN.confidenza(s,sg)` (nuova) → 0..3 da `lib·3 + fav·2 + floor(max(0,s.rel[sg.faz])/15) − sconf·2 − trad·6`.
- Memoria: `esito` vinto contro di lui → `sconf++`; da alleato nella vittoria (`all`) → `fav++`; `consegna` in un luogo con `l.sig>=0` → `fav++`; `scegli aggredisci` su un signore e `fai lascia` da vassallo (tutti i signori del regno) → `trad++`;
  `fai {a:'liberasig',sig}` (nuova: prigioniero tuo liberato senza riscatto, `lib++`, `relaz +6`, errore «Non è tuo prigioniero»).
- `scegli` in `parla` con un signore: `notizie` vuole confidenza ≥1 («Non ti conosce abbastanza»); `lettera` (≥2: `s.lettere[faz]=giorno+LETTERA`, con la lettera `fai contratto` non chiede la fama);
  `prestito` (≥2: +`PRESTITO`, `s.debiti.push({sig,oro:RESA,scad})`, uno per signore, «Gli devi già del denaro»); `rendi` (paga il debito). Un favore ogni `ATTESA` giorni per signore («Torna tra qualche giorno»).
  Debito scaduto in `giornoNuovo`: se hai l'oro lo paga da sé, altrimenti `trad++` e `relaz −10`. Confidenza 3: in `proposta` fattore «Sostegno dei signori» = `SOSTEGNO` per signore del regno `a` (al più `MAX_SOST`).

## Passi
1. `28j`: `GRAD`, `SIG`, campi dei compagni, tre talenti; esporta. 2. `28k`: stato e `apri`, `reagisci`/`umore`/`parte`/`confidenza`, agganci, `liberasig`, favori, debiti, fattori in `proposta`; esporta le nuove.
3. `tests/test_ven_personaggi.js` (rapido). 4. `24hw`: in `compagniaH` sotto ogni compagno umore e barra (`vn-grad`), infobox con ama/odia già visti e legame; in `incontroH` livello di confidenza e bottoni nuovi;
   prigioniero signore: bottone «Libera». `css/39j-ventura.css`. 5. `RULES.ventura` e `docs/rules/ventura.md`: gradimento, addii, confidenza, talenti. 6. Scenario `ventura_personaggi` in `tools/test-browser/`. 7. Riga di `docs/moduli/ventura.md`, `npm run mappa`.

## Prove
- Compagno con `odia razzia`: 5 `reagisci(s,'razzia')` senza paghe → se n'è andato entro 30 giorni di `passo`, con ≤6 uomini in meno; `s.compagni[id]===-3`.
- Bot accorto di `tests/bot_ven.js`, 3 semi, 30 giorni, tre compagni messi in compagnia al giorno 1: nessuno parte (test lento `test_ven_personaggi_bot.js`; se non regge si ritoccano `PAGA`/`VINTA`, non le soglie).
- Stesso seme e stesse mosse su due stati → `salva` identico. Un v2 senza `grad`, `mem`, talenti si apre e `abil` non dà mai `NaN`.
- Confidenza: `lib=1` → 1; `lib=2,fav=1` → 2; un tradimento la riporta a 0. `lettera` a confidenza 1 → errore. Prestito non reso alla scadenza → `trad` 1.
- `proposta`: con due signori a confidenza 3 il totale sale di 3,0 e l'elenco `f` ha la riga «Sostegno dei signori». `npm test -- ven_` verde.
- Screenshot 390 px: pannello Compagnia con un compagno «scontento» e la barra.

**Fuori scopo:** dialoghi e incarichi personali (V6b, V6c), voto dei vassalli (V4), storie d'amore, voci registrate, ritratti dipinti.

## Fatto quando
- [x] `npm run verifica` e `npm test -- ven_` verdi · [x] le sei prove sopra · [x] scenario `ventura_personaggi` · [x] regole in-game aggiornate · [x] co-op: una partita in stanza salvata prima della scheda si riapre.
