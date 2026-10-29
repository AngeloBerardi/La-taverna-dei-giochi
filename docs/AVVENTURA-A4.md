# A4 — Battaglia tattica (motore): piano dettagliato

Scopo: il cuore del gioco. Motori puri, stato JSON, deterministici (dadi dal generatore nello stato, mai `Math.random`), senza DOM. La vista è A5; l'orchestratore (vite, bottino, rientro sull'account) è A9. Qui si costruisce tutto ciò che serve per **giocare una battaglia intera in node**, con bot bravo e bot casuale che ne provano il bilanciamento.

## 0. Cosa c'è già (A0–A3) e cosa manca

| Già pronto | Dove |
|---|---|
| Dadi nello stato, d20 con vantaggio, probabilità esatte | `ADADI` (`27a`) |
| Stati, tipi di danno, resistenze, salvezze, danno e cura | `ASTA` (`27d`) |
| Poteri, cariche, Concentrazione, `applica` (un potere su dei bersagli già scelti), `stima`, `subisci` (reazione «tenace») | `APOT` (`27e`) |
| 23 mostri e 3 capi con `ia:{dist,mira,fuga,arrende,apre}` | `BEST` (`27f`) |
| Eroe → combattente (`APOT.combattente`), mostro → combattente (`BEST.combattente`) | idem |
| Distanza e vicini sugli esagoni (coordinate assiali, punta in alto) | `CAMP.dist/vicini` (`28`) |

**Manca** (e A4 costruisce): la geometria (distanze, linea di vista, coperture, aree, percorsi), le arene, il turno con le sue risorse, le reazioni, la fine della battaglia, l'IA e i bot.

Piccoli ritocchi a moduli già esistenti (fanno parte dei sotto-step, con i loro test):
- `APOT.applica` riceve per bersaglio `ctx.per[id] = {vant, svant, ca}` (altezza, distanza lunga, copertura: finora c'era solo un `vant/svant` unico) e due punti di ingresso per le reazioni: `ctx.rea('colpo', …)` dopo il tiro e `ctx.rea('danno', …)` prima di applicare il danno.
- `APOT.combattente` e `BEST.combattente` portano le abilità che servono in battaglia: `abil: {perc, fur, med}` (Percezione passiva, Furtività, Medicina).

## 1. Regole che fisso io (e che puoi cambiare)

Tutto il resto segue la scheda regole di A0 (`docs/rules/avventura.md`). Dove la scheda lascia un buco, scelgo così:

| # | Decisione | Perché |
|---|---|---|
| D1 | Arena **9 × 11** esagoni, punta in alto, coordinate assiali come la campagna (`q = colonna − ⌊riga/2⌋`). | Sta a 390 px senza zoom obbligato. |
| D2 | Celle: pavimento, **difficile** (costo 2), **rialzo** (altezza +1, entrarci costa +1), **muro** e **alto** (bloccano passaggio e vista), **basso** (blocca il passaggio, non la vista: dà copertura), più una **superficie** facoltativa (fuoco, veleno, ghiaccio, acqua). | Le celle della scheda, più le superfici di A4 punto 1 del piano. |
| D3 | **Copertura** dalla linea fra i centri: un ostacolo basso in mezzo = mezza (+2 CA), due o più = tre quarti (+5 CA), muro o alto = totale (non si può mirare). Se la linea passa su uno spigolo, vale la più favorevole a chi guarda; la vista è **simmetrica**. | Leggibile e uguale per eroi e mostri. |
| D4 | **Altezza**: vantaggio a chi attacca da un rialzo un bersaglio più in basso. | Dalla scheda. |
| D5 | **Gittata**: normale fino a `gitt`, **lunga** (svantaggio) fino a `gittaLunga`, oltre non si può. In più: **tirare con un nemico adiacente = svantaggio** (armi da tiro e poteri a distanza). | Regola mia, tiene viva la mischia. |
| D6 | **Iniziativa**: d20 + `iniz` (vantaggio col gancio `inizVant`), ordine fisso per tutta la battaglia, pareggio: `iniz` più alto, poi gli eroi. Chi arriva in ritardo tira quando entra. | Dalla scheda. |
| D7 | **Movimento** tirato a inizio turno: `max(1, mov effettivo − 2 + 1d4)` esagoni, ritirabile con 1 Concentrazione (una volta). **Scatto** = si raddoppia il movimento tirato. Si attraversano gli alleati, mai i nemici; non si finisce su un'altra creatura; chi è **a terra** non blocca il passaggio. | Dalla scheda + regola sul passaggio. |
| D8 | Un turno = movimento (spezzabile prima e dopo l'azione) + **1 azione** + **1 azione bonus**; la **reazione** si ricarica a inizio del proprio turno. | Dalla scheda. |
| D9 | **Reazioni**: l'**attacco di opportunità** parte da solo (per tutti, interruttore `opz.reazioni`). Le reazioni **difensive** (scudo, parata, schivata, ritiro) si **chiedono** agli eroi quando servono davvero e partono da sole per i mostri. «Tenace» resta automatica. | Un telefono che chiede «attacco di opportunità?» a ogni passo stanca; la parata no. |
| D10 | **Concentrazione**: 1 punto = vantaggio al prossimo tiro (`conc:'vant'` nell'azione) oppure **ritira** l'ultimo dado (solo azioni con un tiro solo: attacco singolo, tiro di movimento). Il dado nuovo vale sempre. | Semplice da mostrare e da rigiocare. |
| D11 | **Chi è a terra non si attacca** (niente colpo di grazia) e conta come fuori dalla battaglia. Tutti gli eroi a terra o fuggiti, nessuno in piedi ⇒ sconfitta. | Dalla scheda. |
| D12 | **Fuga**: un eroe può uscire da una cella-uscita (bordo) spendendo il movimento; oppure l'azione di **fuga di gruppo** (prova di gruppo: basta che riesca metà). Battaglia «fuga» quando non resta nessun eroe in piedi in campo e almeno uno è fuggito. | Dalla scheda. |
| D13 | **Arrendersi**: un mostro con `ia.arrende` a ≤ 25% dei PF lascia le armi (esce dal campo, conta come sconfitto per i PE, nessun bottino da lui). | Dalla scheda (banditi). |
| D14 | **Limite di 40 giri**: oltre, la battaglia finisce «stallo» e conta come fuga forzata. | Dalla scheda (test 3). |
| D15 | **Superfici**: fuoco (1d6 di fuoco e «in fiamme» a chi vi entra o vi inizia il turno), veleno (salvezza COS o «avvelenato»), ghiaccio (salvezza DES o «a terra» al primo ingresso nel turno), acqua (terreno difficile; spegne «in fiamme»). Nascono dall'arena, nessun potere le crea in A4. | Poche e leggibili; i poteri che le creano si valutano in A13. |

## 2. Architettura e file

Cinque moduli nuovi, nell'ordine di caricamento (prima di `28-campagna.js`), ognuno con il suo test:

| File | Costante | Ruolo | Test |
|---|---|---|---|
| `27g-avv-griglia.js` | `AGRI` | geometria: distanza, linea, vista, coperture, aree, percorsi | `test_avv_griglia.js` |
| `27h-avv-arene.js` | `AARE` | arene dall'ambiente della casella + 3 arene dei capi | `test_avv_arene.js` |
| `27i-avv-scontro.js` | `ASCO` | stato della battaglia, turni, azioni, reazioni, fine | `test_avv_scontro.js` |
| `27j-avv-ia.js` | `AIA` | punteggio delle azioni, IA dei nemici, bot bravo e casuale | `test_avv_ia.js` |
| (in `ASCO`) | `ASCO.incontro` | budget di PE → squadra di nemici per livello e difficoltà | `test_avv_bilanciamento.js` (lento) |

`AGRI.dist` ripete la formula di `CAMP.dist` (una riga: i moduli devono poter caricarsi senza la campagna); il test controlla che le due coincidano su mille coppie.

### Contratto di `ASCO`
```
ASCO.nuovo(compagnia, nemici, arena, opz) → stato           // JSON puro
  compagnia: [{ eroe: scheda, dist: 0|1|2+ }]  (dist = esagoni dallo scontro: ≥2 arriva dopo `dist` giri)
  nemici:    [def | { def, q, r }]            (id del bestiario)
  opz: { seme, sorpresa:'eroi'|'nemici'|null, difficolta:'racconto'|'normale'|'eroica',
         reazioni:{ eroi:'chiedi'|'auto', nemici:'auto' }, giriMax:40 }
ASCO.act(s, a) → { s, ev } | { err } | { pausa }            // a = { t, …, dec?:[risposte alle pause] }
   t: 'muovi' {a:{q,r}} · 'attacca' {bers} · 'potere' {id, bers|cella|dir} · 'oggetto' {id, bers|cella}
      'scatto' · 'disimpegno' · 'nasconditi' · 'aiuta' {bers} · 'spingi' {bers} · 'rialza' {bers}
      'fuggi' (uscita) · 'fuga-gruppo' · 'ritira' · 'fine'
ASCO.mosseValide(s) → { muovi:[{q,r,costo}], attacchi:[{bers,pc,dannoColpo,copertura,vant,svant}], poteri:[…], oggetti:[…], speciali:[…] }
ASCO.anteprima(s, a) → { pc, ps, pcrit, dannoColpo, atteso, copertura, vista, vant, svant }   // per la vista e per l'IA
ASCO.riepilogo(s) → { esito:'vittoria'|'sconfitta'|'fuga'|'stallo', giri, xp, eroi:[{id,hp,conc,usi,stato}], nemici:[{def,esito}] }
```
**Pause a decisione** (reazioni difensive, D9): `act` non sospende nulla nello stato. Se serve una scelta e `a.dec` non la contiene, torna `{pausa:{chi, tipo, opzioni, info}}` e lo stato resta intatto; la vista chiede, poi richiama `act` con `dec` aggiornato. Il calcolo si **rifà identico** (i dadi vengono dallo stato) fino alla stessa pausa e prosegue. Salvare e riprendere a metà pausa non richiede niente di speciale.

Stato (schema): `{ v:1, rng, giro, arena, cb:[combattenti con q,r,alt,stato campo], ordine:[id], i, turno:{id, pm, azione, bonus, rea:{id:bool}, scattato, ritirabile}, riserva:[{id,giro}], ev, evn, over, opz }`.

## 3. Sotto-step

Ogni sotto-step: codice, test, `npm run verifica` verde, un commit. Un solo push alla fine (PR di A4).

### A4.1 — Griglia (`AGRI`)
1. Coordinate e arena rettangolare: `AGRI.arena(w,h)`, `cella(arena,q,r)`, `dentro`, conversione colonna/riga ↔ assiali.
2. `dist`, `vicini`, `anello(c, n)`, `entro(c, n)`.
3. `linea(a,b)`: celle attraversate (interpolazione sui cubi, due tracciati leggermente spostati per gli spigoli).
4. `vista(arena, a, b)` → `{visibile, copertura:'nessuna'|'mezza'|'tre-quarti'|'totale', ca:0|2|5, alto:'su'|'giu'|'pari'}`; simmetrica.
5. `aree`: `cerchio(c, r)`, `aura(c, r)`, `cono(c, dir, r)` (spicchio di 60°: k+1 celle a distanza k), `linea(c, dir, r)`; tutte tagliate da muri e alti.
6. `raggiungibili(arena, da, pm, opz)` (Dijkstra con costi: difficile 2, rialzo +1, superfici; `opz.libere` = celle occupate non attraversabili, `opz.alleate` = attraversabili ma non fermabili, `opz.ignoraDifficile`) → mappa `cella → {costo, da}`; `percorso(…)`.
- **Test**: casi fissi di vista (muro in mezzo, basso in mezzo, spigolo, simmetria su 2000 coppie casuali), `dist` uguale a `CAMP.dist`, conteggio celle di cono/cerchio/linea, costi di percorso con difficile e rialzo, percorso che aggira i muri, celle chiuse non raggiungibili.

### A4.2 — Arene (`AARE`)
1. `genera(seme, ambiente, opz)` → `{id, nome, w, h, celle, ingressi:{eroi:[…], nemici:[…]}, uscite:[…]}` per bosco, palude, pianura/strada, collina, città, antro, torre: ostacoli e coperture piazzati con regole per ambiente (bosco: alberi alti e radici difficili; palude: fango difficile e pozze; città: casse basse e muretti; antro: colonne alte; torre: pavimento e statue), nessun blocco che chiuda il passaggio.
2. Tre **arene dei capi** scritte a mano come stringhe (accampamento del Capobanda, cripta del Re senza Corona, sala del Maestro) con superfici e rialzi pensati per il capo.
3. Distanza minima fra gli ingressi dei due schieramenti ≥ 4, copertura disponibile da entrambe le parti, ostacoli ≤ 25% delle celle.
- **Test** su 200 semi per ambiente: determinismo, connessione (ogni ingresso raggiunge ogni cella libera), ingressi liberi e sufficienti (≥ 4 eroi, ≥ 8 nemici), uscite sul bordo, le arene dei capi si leggono e hanno il loro nome.

### A4.3 — Nucleo dello scontro (`ASCO`, parte 1: turni e movimento)
1. `nuovo`: combattenti (eroi con `APOT.combattente`, mostri con `BEST.combattente`, id `lupo-grigio#1`…), posizioni dagli ingressi, `APOT.iniziaScontro`, schieramento ritardato (`riserva`), sorpresa (chi è sorpreso salta il primo turno), iniziativa.
2. Ciclo dei turni: `inizioTurno` (stati a tempo, danni nel tempo, superfici, ricarica della reazione, tiro del movimento), `fine` (`ASTA.fineTurno`), passaggio al prossimo in piedi, nuovo giro, arrivi dalla riserva, limite dei giri.
3. `muovi` passo per passo con costo, ostacoli, superfici e **attacco di opportunità** (parte con `APOT.applica('attacco')`, una reazione per giro, mai su chi ha fatto Disimpegno o è «nascosto»/stordito); `scatto`, `disimpegno`, `nasconditi` (Furtività contro la Percezione passiva dei nemici che vedono, serve copertura o vista libera), `aiuta` (dà «mirato» a un alleato), `rialza` (azione + Medicina CD 10 o pozione), `fuggi`.
4. `attacca` con l'arma (gittata, vista, copertura, altezza, svantaggio da tiro ravvicinato, `ctx.per` per `APOT.applica`).
5. Fine della battaglia: vittoria, sconfitta, fuga, stallo; arresa (D13); `riepilogo`.
- **Test**: un'azione per tipo per turno; il movimento non supera il tirato; nessun passaggio attraverso nemici o muri; opportunità solo se dovuta; stati che scadono al momento giusto; a terra / morto / arreso tolti dall'ordine; determinismo e **ripresa** (salva e ricarica a ogni mossa: stesso finale); invarianti su 300 battaglie con mosse casuali valide (PF in [0,max], nessuno su una cella occupata, ordine coerente).

### A4.4 — Poteri, aree, reazioni e oggetti (`ASCO`, parte 2)
1. `potere`: gittata e vista, bersagli dall'area (`aura`, `cerchio`, `cono`, `linea` con `AGRI`), nessun fuoco amico, `spingi` (spinge di n esagoni lontano dall'attore, si ferma contro muri e creature), `disimpegna`, costo in azione / azione bonus / reazione, cariche (`APOT.applica`).
2. **Reazioni difensive** (D9, D10): scudo magico (+CA dopo il tiro), parata / schivata / pelle di pietra (riduzione del danno), ritiro (Fortunato, Colpo di scena), con la pausa a decisione; policy automatica per i mostri.
3. **Concentrazione**: `conc:'vant'` e `ritira` (lo stato precedente all'azione è conservato in `s.prima` finché non si cambia azione).
4. **Oggetti**: consumabili della cintura con gli effetti di `AOGG` (cura, bomba, pergamena, tonico, stato): azione bonus per le pozioni, azione per bombe e pergamene; consumo dallo stato dell'eroe.
5. `mosseValide` e `anteprima`.
- **Test**: ogni potere del catalogo usato almeno una volta in battaglia (bersagli e costi coerenti); aree su casi fissi (quali nemici colpisce un cono a una certa distanza); spingi contro muro e contro creatura; pausa e ripresa con `dec`; `ritira` costa 1 punto e cambia l'esito solo se il nuovo dado è diverso; una pozione cura e sparisce dalla cintura; le cariche tornano a inizio battaglia.

### A4.5 — IA e bot (`AIA`)
1. Punteggio simmetrico di un'azione (si usa per nemici ed eroi): danno atteso (`APOT.stima`), probabilità di abbattere, valore di una cura o di uno stato, rischio nel prossimo turno (danno atteso dei nemici sulla cella di arrivo), copertura e altezza, distanza preferita (`ia.dist`: contatto / media / lontana), bersaglio (`ia.mira`: vicino, debole, curatore, incantatore), fuga (`ia.fuga`) e resa (`ia.arrende`), apertura (`ia.apre`).
2. `AIA.turno(s, livello)`: gioca un turno completo (muovi, azione, bonus, fine) con le sole mosse di `mosseValide`; **tre livelli**: *racconto* (sceglie fra le migliori tre, non infierisce su chi è quasi a terra, rimane vicino), *normale* (la migliore con poco rumore), *eroica* (la migliore, focus sul più debole, tiene la distanza, usa le coperture).
3. `AIA.botBravo` (livello eroica sugli eroi, con cure e rialzi) e `AIA.botCasuale` (mossa casuale valida).
- **Test**: ogni mossa dell'IA è valida (`act` non dà mai `{err}`), il turno si chiude sempre, nessun ciclo infinito, determinismo; il livello *eroica* batte *racconto* a parità di squadre.

### A4.6 — Incontri e bilanciamento
1. `ASCO.incontro(fam, livello, difficolta, rnd)` → elenco di id del bestiario: **budget di PE** per livello e numero di eroi (facile / medio / difficile / capo), mescolando i ruoli (bruti davanti, tiratori e supporti dietro).
2. 1000 battaglie simulate (squadre da 1 a 4 eroi, livelli 1–8, quattro famiglie, tutti i livelli di difficoltà).
3. Ritocchi ai numeri dove serve (PF e danni dei mostri, budget): le correzioni vanno in `BEST`, mai nell'IA.
- **Criteri** (dalla scheda A0, test 3): il bot bravo vince **≥ 85%** degli scontri *medi* del proprio livello, il bot casuale **≤ 30%**; i *difficili* fra 50% e 80%, i capi fra 35% e 70% con squadra al livello giusto; **nessuna** battaglia oltre 40 giri; PF persi in media dalla squadra negli scontri medi fra 25% e 60%.
- Tabella dei risultati in `docs/AVVENTURA.md` per A13.

### A4.7 — Aggancio alla campagna (minimo)
1. `ASCO.daCampagna(statoCampagna, incontro)` costruisce `nuovo(...)` dagli eroi della campagna (scelte, `usi`, `conc`, equipaggiamento, `dist` dalla loro posizione) e `ASCO.aggiorna(statoCampagna, riepilogo)` riporta PF, `usi`, `conc` e XP (conteggi puri; vite, bottino e rientro sull'account sono di A9).
- **Test**: round-trip su una campagna di prova, XP divisi fra gli eroi presenti, nessun eroe «a terra» perde equipaggiamento, `CAMP` non cambia stato da solo.

### A4.8 — Documenti, verifica, PR
`docs/AVVENTURA.md` (stato di A4, tabella di bilanciamento), `CLAUDE.md` (riga della tabella + comandi), `docs/ARCHITECTURE.md` (`npm run mappa`), `docs/rules/avventura.md` solo dopo l'unione di #69, `npm run verifica`, un commit per sotto-step, PR con base `feat/avventura-a3`.

## 4. Rischi e come li tengo a bada

| Rischio | Risposta |
|---|---|
| La battaglia diventa un motore enorme e illeggibile. | Cinque file con un compito ciascuno, ognuno con il suo test; `ASCO` si legge a blocchi (turno, movimento, attacco, poteri, reazioni, fine). |
| Le reazioni con scelta rompono il determinismo o lo stato. | Nessuna sospensione: la pausa è un valore di ritorno e l'azione si rifà identica con `dec` (test: stessa partita con e senza pause). |
| Bilanciamento di gruppo mai verificato (A3 lo ha rimandato). | A4.6 lo misura con 1000 battaglie e corregge i numeri nel bestiario; i criteri sono scritti prima. |
| L'IA fa mosse non valide o cicla. | L'IA sceglie solo da `mosseValide`, ogni turno ha un tetto di azioni, il test chiude 1000 turni senza `{err}`. |
| Prestazioni sui telefoni economici. | Percorsi e viste con cache nello stato della battaglia (non salvata); l'IA valuta al massimo poche decine di celle raggiungibili per mossa. |
| Un numero «magico» sfugge alla tabella di A0. | Le formule di danno e PF restano in `APOT`/`BEST`; `ASCO` non introduce statistiche nuove. |

## 5. Cosa resta fuori da A4
Vista e animazioni (A5), mappa v2 (A6), racconto e Capitolo 1 (A7–A8), vite di gruppo, salvataggio, bottino e rientro sull'account (A9), audio e schede regole in gioco (A10), TV + telefoni (A11), difficoltà e ritocchi finali (A13).

## 6. Le sei scelte che potresti voler cambiare
D5 (svantaggio a bruciapelo), D9 (attacchi di opportunità automatici), D10 (la Concentrazione ritira sempre il dado nuovo), D11 (niente colpo di grazia), D12 (fuga di gruppo con metà successi), D14 (limite di 40 giri). Sono tutte isolate in poche righe: cambiarle dopo costa poco.
