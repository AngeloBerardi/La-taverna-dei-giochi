# V6b — Dialoghi della Ventura: motore, incarichi personali, la rivale a tappe

**Scopo.** Compagni, signori e la rivale parlano: scene a scelte che cambiano gradimento, oro, incarichi. Questa scheda mette il motore e le regole; i testi veri arrivano con V6c.

**Prima:** V6a in `main`. **Area:** `docs/moduli/ventura.md`. **Leggi prima:** intestazione di `motori/27q-avv-racconto.js` (formato di scene, nodi, scelte, condizioni, effetti) e le sue `act`, `vista`, `valida`, `nuovo`;
in `motori/28k-ven-mondo.js` `passo`, `giornoNuovo`, `esito` (riga `p.k==='riv'`), `sconfitta` (ramo `riv`), `reagisci`/`parte` di V6a; in `app/24hw-ventura.js` `incontroH`, `html`, `act`; in `motori/28m-ven-stanza.js` il ramo `a.t==='scegli'`.

## Decisioni già prese
- Si riusa `ARAC` così com'è, senza prove di abilità (`prova`) e senza `compagni` del capitolo: il gradimento resta della Ventura (`s.grad`). I testi sono dati, in un file della Ventura: nessun testo nei motori.
- Non in `src/avventura/`: quei file finiscono nell'elenco dei capitoli dell'Avventura.
- Una scena aperta ferma il tempo; in compagnia risponde chiunque (come la pausa).
- Se la scena di un momento non è ancora scritta, il gioco va avanti con la riga di cronaca di V6a: così i testi si aggiungono a blocchi.

## Stato e contratti
- `27q`: `'ven'` in `FUORI`; in `valEff` `case'ven'`: `k` stringa non vuota, altrimenti errore «"ven" vuole k». Nient'altro cambia per l'Avventura.
- File nuovo `motori/28ja-ven-voci.js` (dopo `28j` nel manifest): `const VVOC` = capitolo `{id:'ventura', titolo, personaggi, bandiere, ingressi, scene}` + `module.exports`.
  `personaggi`: un id per compagno (`co_*`), `rv_volpe`, `signore` (nome messo dalla vista), più `_` narratore. `bandiere` e `ingressi` sono calcolati in fondo al file dai nomi delle scene e dai fatti qui sotto.
- Nomi delle scene (solo `a-z0-9-`): `<c>-lamento`, `<c>-addio`, `<c>-inc-1`, `<c>-inc-2`, `<c>-inc-3` con `<c>` = id senza `co_` (`berta`…); `volpe-1`, `volpe-2`, `volpe-3`; `sig-<tratto>-<livello>` (tratti di `TRATTI`, livelli 1..3).
- `s.rac=ARAC.nuovo('ventura',s.seme)`, `s.voci=[]` (scene in coda), `s.volpe={tappa:0}`; `apri` li crea se mancano. `s.grad[id].inc` 0..3 (passo dell'incarico compiuto), `.incA` (passo aperto, 0 = nessuno).
- Fatti copiati in `s.rac.bandiere` da `fatti(s)` (nuova, interna) prima di ogni `ARAC.act`: `grad-<c>`, `inc-<c>`, `con-<c>` (in compagnia), `serve-<regno>`, `fama`, `tappa`, `giorno`. Le scene leggono solo questi e le bandiere che impostano da sé.
- `VEN.voce(s)` (nuova) → `ARAC.vista(s.rac,VVOC,{oro,giorno,eroi:[]})` o `null`. `VEN.parla(s,a)` (nuova) con `a` = `{t:'scegli',i}` | `{t:'continua'}` → `{s}` o `{err}` di `ARAC.act`; applica `fuori` con `applicaVoce` (nuova, interna):
  `oro {n}` · `ven grad {id,n}` · `ven via {id}` (→ `parte`) · `ven passo {id}` (apre il passo dopo) · `ven premio {id}` · `ven scontro` (la rivale: `s.incontro` di tipo `nemico`) · `ven conf {n}` (aggiunge a `mem.fav` del signore con cui si parla)
  · `ven tappa` (`s.volpe.tappa++`). Un `k` sconosciuto → `{err:'Effetto sconosciuto'}`. `VEN.EFF_VOCI` (nuova) è l'elenco dei `k`.
- Avvio: in `passo`, se `!s.incontro && !s.rac.scena && s.voci.length` → avvia la prima che esiste in `VVOC.scene` (le altre si scartano) e `s.ev.push({t:'voce'})`; se `s.rac.scena` c'è, `passo` non fa scorrere i minuti. `fai`/`scegli`/`ordina` con scena aperta → «Prima rispondi».
- Chi mette in coda: V6a quando `avv` scatta → `<c>-lamento`; `parte` → `<c>-addio` (prima di togliere il compagno); gradimento ≥ `FIDO` con `inc=0`, `incA=0` → `<c>-inc-1`; confidenza che sale di livello dopo un `parla` → `sig-<tratto>-<livello>`.
- Incarichi personali: `COMPAGNI[i].inc=[p1,p2,p3]`, ognuno `{tipo, …, d}` (`d` = riga per il diario) con tipi già esistenti nel mondo: `luogo {tipoL|faz}` (entrarci), `vinci {k:'pre'|'sig'|'riv', faz?}`, `sito {tipoL}`, `porta {m,n}` o `{oro}` (consegnati alla scena dopo).
  `avanzaInc(s,evento,dati)` (nuova, interna) chiamata da `arriva` (ingresso in un luogo), `esito`, e a inizio scena: passo compiuto → `inc++`, `incA=0`, coda `<c>-inc-<n+1>`; dopo il terzo, `premio`.
  `COMPAGNI[i].premio`: `{ogg:id}` (oggetto di `OGG` nello zaino) oppure `{abil:1}` (il compagno dà 3 punti e non 2: `s.grad[id].piu=1`, letto da `abil`). Un premio per compagno, dieci diversi: li fissa chi scrive V6c; qui Berta `{abil:1}`, Lapo `{abil:1}`.
- Rivale: tappe ai giorni `VDAT.VOLPE.GIORNI=[12,40,80]` (in `giornoNuovo`, se `tappa` è quella e non sei prigioniero: la sua compagnia compare accanto alla tua con `vicinoOk`, coda `volpe-<n>`).
  Bandiere d'esito scritte dalle scene: `volpe-patto`, `volpe-odio`, `volpe-debito`. `volpe-3` finisce in uno di tre modi: scontro (`ven scontro`), dono (`ven premio {id:'rv_volpe'}` → `RIVALE.premio`, una volta sola: anche `esito` guarda `s.volpe.dono`), tregua.

## Passi
1. `27q` (due ritocchi) e `npm test -- avv_racc`. 2. `28ja-ven-voci.js` con **solo** le scene di prova: `berta-lamento`, `berta-inc-1..3`, `volpe-1..3` in tre righe ciascuna (testi provvisori brevi, marcati `PROVV` in un commento: V6c li riscrive), manifest.
3. `28k`: stato, `fatti`, `voce`, `parla`, `applicaVoce`, coda, `avanzaInc`, tappe della rivale, `abil` con `piu`. 4. `28m`: mossa `{t:'parla',a,seat}` → `VEN.parla`.
5. `24hw`: `voceH` (nuova) come pannello fisso sopra la mappa (chi parla, testo, scelte con etichetta «20 monete»), comando `ven` verbo `parla:<i>`; in `compagniaH` riga «Incarico: …» con `d`. CSS `vn-voce`. 6. Test, scenario `ventura_voci`, regole in-game (un paragrafo), `docs/moduli/ventura.md`, `npm run mappa`.

## Prove
- `ARAC.valida(VVOC)` → `[]` (ogni nodo raggiungibile, niente vicoli ciechi) e ogni effetto `ven` ha `k` in `VEN.EFF_VOCI`: `tests/test_ven_voci.js`.
- Percorso di tutte le scelte di ogni scena con una visita in profondità: nessun `{err}`, ogni scena si chiude.
- Berta portata a gradimento 75: parte `berta-inc-1`; compiuti i tre passi `VEN.abil(s,'prodezza')` sale di 1. Scena assente (`lapo-lamento`) → nessun blocco, resta la riga di cronaca.
- Rivale: bot accorto per 90 giorni, 3 semi → `s.volpe.tappa===3` e un solo `u_tramontana` tra zaino ed equipaggiamento.
- Stesso seme e stesse scelte su due stati → `salva` identico; un salvataggio V6a si apre. Stanza a due telefoni: la scena compare a entrambi e la scelta di uno la chiude all'altro (`ventura_voci`).
- Screenshot 390 px: pannello della scena con due scelte.

**Fuori scopo:** i testi definitivi (V6c), prove di abilità nei dialoghi, ritratti, voci registrate, storie d'amore.

## Fatto quando
- [x] `npm run verifica`, `npm test -- ven_ avv_racc` verdi · [x] le sei prove · [x] l'Avventura a capitoli non cambia (`test_avv_corona` verde) · [x] regole e scheda d'area aggiornate.
