# A11 — Avventura in compagnia: stanza live, TV e telefoni

Contratti di `AST` (`motori/28e-avv-stanza.js`, motore puro) e del suo tramite con le viste (`app/24hm-avv-stanza.js`, `AvvStanza`). Stato: **fatta** (ramo `feat/avventura-a11`, sopra A10).

Regola di fondo come per tutta l'Avventura: ciò che si decide senza browser è puro e provato in node (chi può fare cosa, il voto, la battaglia condivisa, la presenza, il rientro); le viste sono un tramite. Niente `Math.random` nei motori (il dado è in `av.rng`/`lotta.rng`); il seme nasce nella vista (`AvvStanza.prepara`).

## 1. Che cosa si vuole
Una partita di Cantari di Ventura in una **stanza live** (`R.mode='rt'`, nessun host: lo stato sta nel database): ognuno col suo telefono e il suo eroe; una TV (`?tv=CODICE`, sola visione) mostra mappa, battaglia e dialoghi a tutto schermo. Il telefono comanda solo il proprio eroe. Chi ospita (il primo posto presente) guida i compagni della storia e ciò che riguarda tutto il gruppo.

## 2. Il modello: una partita di stanza come le altre
`ENG.avventura = { newGame, act }` (contratto dei motori, `docs/ARCHITECTURE.md`): lo stato `s` va nel documento della stanza come per ogni gioco e le mosse passano da `SYNC.mossa`, quindi **atomiche** (`rev`). Lo stato è `sim:true` (qualunque posto può provare ad agire: il motore decide); ciò che non commuta (una battuta del dialogo, un voto, una mossa di battaglia) porta `base` (= la versione che il telefono mostrava) e, se lo stato è già andato avanti, viene rifiutato («Un altro telefono ha mosso un attimo prima») invece di essere rigiocato.

```
s = { g:'avventura', v:1, sim:true, n, names, cur:0, ev:[], evn, over:null,
      posti:[{ nome, uid, slot, eroe, qui, ospite }],   // un posto per giocatore; `eroe` = indice in av.camp.eroi; `slot` = posto sull'account (solo un indizio per il rientro)
      av:    <stato di AVV>,                             // la sessione condivisa (camp + racc + vite…)
      lotta: <stato di ASCO> | null,                     // la battaglia in corso
      film:  { da, azioni:[azioni di ASCO] } | null,     // le azioni dell'ultima mossa (la mossa e le risposte dell'IA); `da` = lotta.evn di prima
      voto:  { chiave, v:{ posto: i } } | null,
      riep:  { …riepilogo di sessione, n } | null,       // la chiusura della sessione la vedono tutti
      righe: [testi],                                    // il racconto dell'ultima mossa
      pre:   { seme, eroi } | null }                     // finché nessuno ha mosso: schede e seme per ricostruire la sessione quando qualcuno porta il suo eroe
```
`s.over` resta **sempre null** (`FB.matchEnd` non deve pagare un premio generico). Peso: circa 40 KB (il mondo è ~22 KB di celle) + ~7 KB di battaglia; il documento di stanza accetta 900 000 caratteri (`database.rules.json`, nessuna regola nuova).

`s.ev` è `[{t:'film'}]` solo nelle mosse che producono un film: è il segnale con cui `applyState` (07b) sceglie la via animata (`FX.avventura`) invece di quella diretta.

## 3. Chi guida chi
- Un posto = un eroe (`posti[i].eroe`). I **compagni** della storia (`ACMP`) e gli eroi dei posti **assenti** li guida chi ospita (il primo posto con `qui:true`).
- `AST.guida(s, i)` = il posto che guida l'eroe `i` di `av.camp.eroi`; `AST.automatico(s, c)` = nemici, eroi a terra e eroi senza nessuno che li guidi (li gioca `AIA`).
- Posti ospiti (stesso telefono, senza profilo) e giocatori senza eroe sul profilo ricevono un eroe di prova per classe (`eroeProva`, data di creazione fissa: stessa chiamata, stesso stato).

### Azioni (`AST.act(s, a, cap)`; `a.seat` = chi la manda)
| Azione | Chi |
|---|---|
| `{t:'eroe', scheda, slot}` | il proprio posto, **solo prima della prima mossa** (`s.pre`): la scheda dell'account (validata con `EROI.coerente`) prende il posto dell'eroe di prova e la sessione si ricostruisce dallo stesso seme |
| `{t:'av', az}` con `camp` e `eroe` in `PER_EROE` (tira, muovi, breve, cura, rialza, prega, taglia, risolvi, equipa, togli, cintura, zaino, usa, passa, compra, vendi) | chi guida quell'eroe |
| `{t:'av', az}` con `camp` senza `eroe`, o con `tutti` (fine giro, riposo lungo, entra/esci, scelte d'evento, «tira per tutti») | chi ospita |
| `av` `scena`, `parla`, `compagnia`, `bacheca`, `chiudi` | chi ospita |
| `av` `racconto`/`continua` | qualunque posto presente (con `base`) |
| `av` `racconto`/`scegli` | rifiutata: le scelte si votano |
| `{t:'voto', i}` · `{t:'voto', ora:true}` | ogni posto presente · chi ospita chiude il voto |
| `{t:'combatti'}` | qualunque posto presente (la battaglia è già decisa dalla fase) |
| `{t:'lotta', a}` | chi guida l'eroe di turno; il resto lo gioca l'IA |
| `{t:'chiudiLotta'}` | qualunque posto presente, a battaglia finita |
| `{t:'presenza', posto, qui}` · `{t:'siede', posto, nome, uid}` | chi è presente (anche per altri) · chi rientra |
| `{t:'conto', tappa}` | il proprio eroe, dopo una scrittura riuscita sul proprio account (anche a campagna finita) |

La prima mossa vera (`av`, `voto`, `combatti`, `lotta`) azzera `s.pre`.

## 4. Le scelte del dialogo: voto
Con un solo posto presente la scelta vale subito. Con più posti, `{t:'voto', i, base}` registra il voto; quando **tutti i presenti hanno votato** si applica la scelta più votata (a parità vale quella di chi ospita, se ha votato, altrimenti la più bassa). Chi esce non frena il voto (si rivaluta). Il voto si azzera a ogni passo del racconto. Chi ospita può chiuderlo prima (`ora:true`). La prova resta una: il dado è nello stato.

## 5. La battaglia condivisa
1. `{t:'combatti'}` crea `lotta` da `AVV.battaglia(av)` con le **reazioni automatiche** (non si chiede una reazione a un altro telefono) e fa giocare subito l'IA finché tocca a una persona.
2. `{t:'lotta', a}` è un'azione di `ASCO.act` del combattente di turno; `AST` controlla chi la manda e poi rigioca da sola nemici, eroi a terra ed eroi senza guida. Le azioni giocate vanno in `s.film`.
3. **Ogni telefono rigioca il film** sul proprio stato precedente (`AST.rigioca`) con le animazioni di A5 (`Bat.gioca` → `BatAnima`): pochi byte per mossa, lo stesso per tutti, passo per passo; a fine film `Bat.s` è identico a `G.lotta` (se non lo è, o chi entra a battaglia in corso, `allinea` ripone lo stato com'è).
4. A battaglia finita `chiudiLotta` passa il risultato ad `AVV` (`esito` con `ASCO.riepilogo`) e azzera `lotta`: la fase torna a mappa o dialogo.

## 6. Presenza, uscita e rientro
`posti[i].qui`: chi esce resta al suo posto con `qui:false` (il suo eroe lo guida chi ospita, in battaglia gioca l'IA); chi rientra riprende il suo eroe com'è. Dal telefono la presenza viene dal database (`RT.here[codice]`, **non** da `R.members`, che durante la partita tiene i seduti): ogni 1,5 s `AvvStanza.vigila` confronta i posti con chi c'è e, dopo 3 s di certezza, manda `presenza` (chi non è assente a sua volta, più 0,3 s × posto per non scrivere in tanti). Se nessun seduto c'è più per 90 s la stanza torna libera (regola di `RT.pota`, già esistente).

## 7. Rientro sull'account e salvataggio
- Ciascun telefono riscuote **solo il proprio eroe** (`AST.rientro(s, posto)` → piano di `ARIE` per lo slot `p<eroe>`); dopo ogni scrittura riuscita (`FB.rientroEroi`, solo le schede, nessun salvataggio) manda `{t:'conto'}` che registra la tappa nello stato condiviso (`conto.accreditato`): la stanza ricorda cosa è già tornato e nessuno riscuote due volte. Stesse tappe e limiti di A9 (`EROI.LIMITI`, attesa tra due guadagni).
- Come trovare l'eroe sull'account: per **campi che le regole di Firestore non lasciano cambiare** (razza, classe, aspetto, base); `posti[i].slot` è solo il primo tentativo.
- La campagna condivisa si salva sul profilo di chi ospita (`FB.salvaAvventura`, primo posto libero tra a1–a3, e nella memoria del telefono) a ogni fine sessione e a fine capitolo. **Riprendere**: dalla pagina Avventura, «Riprendi in compagnia» (`AST.apri`): i posti prendono gli eroi dei giocatori nell'ordine del salvataggio, gli altri li guida chi ospita.
- Il premio di fine capitolo lo chiede ogni telefono per sé (`FB.premiaAvventura`, una volta per partita).

## 8. Le viste
- **Telefono**: le schermate di A5–A9 (mappa, dialogo, battaglia, zaino, fogli) restano quelle. `AvvStanza.sync` rispecchia `G` in `Ses.a`, `Camp.s`, `Bat.s` e decide la schermata dalla fase (come `Ses.vai`), a ogni render e solo se `G` è cambiato; le azioni passano da `AvvStanza.manda` (calcola subito con `AST.act`, mostra il risultato, poi spedisce con `SYNC.mossa`). Le guardie di una riga `if(inAvv())return AvvStanza.xxx()` stanno in `Ses.fai/dialogo/combatti/fineBattaglia/esci/riscuoti/riH`, `Camp.combatti`, `Bat.umano/avanza/salva/tocca/barraH`, `AvvTut.html`.
- **Striscia dei posti** (in alto, sopra ogni schermata): un tondo per giocatore (ritratto, spento se fuori, anello se è il suo turno, spunta se ha votato); un tocco apre **il tavolo** (posti, scelta del proprio eroe prima di partire, uscita). Il tavolo si apre da solo all'inizio.
- **Voto**: nella barra del dialogo, «Votano: Ada ✓ Bruno …», le iniziali di chi ha votato su ogni scelta, «Decido io ora» per chi ospita.
- **TV** (`ui.tv`, sola visione, `html[data-tv].avt-on`): gli stessi fogli senza comandi (`pointer-events:none`), testo del dialogo più grande, mappa un po' più larga, nessun suggerimento; la TV non ha un posto (`viewer() = -1`) e non riscuote niente.
- **Pagina Avventura → In compagnia**: «Comincia un cantare in compagnia» e «Riprendi in compagnia» per ogni salvataggio.

## 9. Fuori da A11
Nessun suono nuovo. Una vista TV pensata apposta (oggi: gli stessi fogli, ingranditi), scelta del proprio eroe nella ripresa di un salvataggio (oggi per ordine), animazione dei movimenti degli altri sulla mappa (oggi l'eroe salta). 3D: A12. Bilanciamento per più giocatori, prezzi, difficoltà: A13.

## 10. Test
- `tests/test_avv_stanza.js`: posti ↔ eroi, arruolamento, permessi per ogni azione, voto (maggioranza, parità, uscita), battaglia condivisa (film = stesso stato finale, `ev`), assenza e rientro, rientro per eroe con oro in comune e `conto`, ripresa di un salvataggio, peso dello stato, determinismo, nessun `Math.random`.
- Scenario `avv_tv` (browser, `tools/test-browser/run.py`): 1 TV e 2 telefoni sulla stessa stanza: partenza su tutti, tavolo e arruolamento dal profilo, voto con un solo votante e poi con tutti, permessi sulla mappa, battaglia giocata a turno dai due telefoni (stessa battaglia sulla TV), assenza e rientro, rientro dell'esperienza solo sul profilo del proprio eroe, campagna salvata sul profilo di chi ospita. Il seme è fisso (`AvvStanza.seme0`).

## 11. Da ripubblicare
`firestore.rules`: una riga in più (`elo('avventura')`, da `npm run regole`); `database.rules.json` non cambia.
