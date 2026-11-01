# A6 — Mappa del mondo (evoluta): piano dettagliato

Piano breve in `docs/AVVENTURA.md` (A6, 9 punti). Qui lo porto a sotto-step eseguibili, con le scelte che prendo io (e che puoi cambiare), i file, i test e i criteri di fine. **A6 non tocca le regole della battaglia** (`ASCO`, `AIA`, `Bat`): la mappa le chiama quando un gruppo di nemici raggiunge gli eroi o quando si apre una stanza di battaglia in un sotterraneo.

## 0. Cosa c'è già e cosa manca
- **C'è** (A1–A5): `CAMP` (stato v2) con una mappa di raggio 6 e *un solo segnalino* per tutta la compagnia, un movimento comune, cinque incontri risolti con un d20, la missione città → antro → torre fatta di prove di abilità, la perdizione (+3 all'alba), il riposo come unico modo di far passare il tempo; botteghe in città (A2); poteri e Concentrazione per eroe (A3); battaglia a esagoni completa con aggancio minimo `ASCO.daCampagna/aggiorna` (A4) e vista a telefono (A5).
- **Manca**: eroi con posizione e movimento propri, mappa grande con regioni e luoghi diversi, nemici visibili che si muovono, sotterranei a stanze, servizi nelle città, perdizione a soglie, riposo breve e lungo, e una vista a scorrimento che mostri tutto questo.

## 1. Scelte che fisso io
| # | Scelta | Perché |
|---|---|---|
| W1 | **Stato v3 dentro `CAMP`** (non un secondo motore): `CAMP.migra` porta a v3 anche i salvataggi v2 (tutti gli eroi nella cella del vecchio segnalino, incontro a fasi chiuso). `s.party` resta come «posizione di riferimento» (il primo eroe in piedi) per non rompere botteghe, aggancio e test. | Un solo posto per lo stato di campagna; A9 ci costruirà sopra l'orchestratore. |
| W2 | **Tre moduli puri nuovi sotto `CAMP`**: `27m` `AMON` (mondo: generazione, geometria), `27n` `ALUO` (luoghi: servizi, sotterranei, santuari, bacheca, soglie della perdizione), `27o` `AMOS` (mostri visibili: nascita, fase, contatto, chi entra in battaglia). `CAMP` li orchestra e li espone. | Ognuno si prova da solo in node; `28-campagna.js` non diventa un monolite. |
| W3 | **Mappa di raggio 9** (271 esagoni), **3 regioni** per settori angolari attorno a una zona di casa (i diagrammi di Voronoi lasciavano regioni troppo piccole); ogni regione ha nome, terreno dominante e famiglia di mostri. Il capitolo (A8) può dare nomi, terreni e **luoghi scritti a mano** (`opts.luoghi`, con `q,r` oppure solo la regione): il generatore li rispetta e riempie il resto. | Capitolo = tre atti, una regione l'uno (decisione A0). |
| W4 | **Luoghi**: città (1, partenza), villaggi (2–3), santuari (2–3), un antro, rovine (2), torre (1), accampamenti (3–4), forzieri (3–4); **mercanti vaganti** (1–2) sono segnalini che camminano sulle strade. Città/villaggi/santuari/accampamenti sono «sicuri»: i mostri non vi entrano e non attaccano chi vi sta. | Elenco del piano A6; i luoghi sicuri danno senso al riposo lungo. |
| W5 | **Tutti i luoghi sono sempre collegati** da terreno calpestabile (strade tra città → villaggi → luoghi grandi, come in v2 con `percorso` che apre un passo dove serve). Un test su 300 semi lo prova. | Requisito dei test A6. |
| W6 | **Movimento a dado, per eroe**: `PM = mov − 2 + 1d4` (minimo 3), tirato all'inizio del turno dell'eroe (`tira`); con **Concentrazione** (1 punto) si tirano due dadi e si tiene il migliore (vantaggio, come in battaglia). Se si muove senza aver tirato, il dado si tira da solo. Ogni eroe muove da solo o, se sta con gli altri nella stessa cella, **«muovi tutti»** con un tocco: ognuno paga il suo costo. | Decisione utente A0 (tutto a dadi, eroi separati). |
| W7 | **Il tempo passa a giri.** Un giorno = 8 giri (5 di giorno, 3 di notte). Finito il giro (tutti hanno mosso o «Fine turno») i mostri si muovono; all'ottavo giro arriva l'**alba**: perdizione +3, cure naturali piccole (10 % e solo poteri «breve»), i mostri rinascono se mancano. | Il tempo è la risorsa: ogni giorno speso costa 3 di perdizione. |
| W8 | **Riposo breve**: ovunque, per un eroe, una volta o due al giorno, solo se nessun mostro è entro 2 esagoni; cura 20 % dei PF e ricarica i poteri «breve»; finisce il suo turno. **Riposo lungo**: tutta la compagnia nello stesso luogo sicuro — in locanda (città/villaggio) costa 8 monete a eroe, all'accampamento costa 1 razione a eroe; salta al giorno dopo, cura piena (accampamento: metà), ricarica tutto. L'accampamento può subire un'**imboscata** (20 % + 10 % per soglia di perdizione). | Voce «Giorno/notte e riposi» del piano. |
| W9 | **Mostri visibili**: gruppi (da `ASCO.incontro`) con posizione, famiglia, livello. Si vedono se la loro cella è entro 3 esagoni da un eroe in piedi. Ogni fase: se un eroe è entro 3 esagoni il gruppo lo **insegue** (1 passo di giorno, 2 di notte), altrimenti **vaga** (un passo a caso, 50 %); i gruppi di guardia non si muovono. Di notte hanno +1 livello. Restano anche gli **incontri casuali** di v2 (prove d20) sulle celle senza luogo, ma più rari (p = .12 + notte .10 + perdizione/500). | Elenco del piano A6 («nemici visibili … più incontri casuali residui»). |
| W10 | **Contatto → battaglia**: un mostro a 1 esagono (o sulla stessa cella) da un eroe fuori dai luoghi sicuri apre la sfida. Gli altri eroi entrano con `dist` = esagoni dal punto di contatto: **0–1 subito, 2–3 dopo `dist` giri** (è già il comportamento di `ASCO.nuovo`); oltre 3 non partecipano. `CAMP.battaglia(s)` costruisce la battaglia, `CAMP.act(s,{t:'esito',riep})` applica PF, cariche, PE, bottino e toglie il gruppo. Fuga: la compagnia arretra di 2 celle e la perdizione sale di 1. | Voce «un eroe entro 1 esagono entra subito…». |
| W11 | **Sotterranei a stanze**: antro 4, rovina 3, torre 6 stanze tra `battaglia`, `trappola` (prova d20 come v2), `evento` (due scelte, una può essere «cattiva»: +perdizione), `forziere`, `riposo`, `boss` (battaglia con capo). Si entra con tutta la compagnia, si procede una stanza alla volta, si può **uscire e rientrare** (lo stato delle stanze resta). La missione base (città → antro → torre) si chiude col boss della torre. | Voce «Sotterranei» del piano. |
| W12 | **Servizi dei luoghi**: città = locanda (riposo lungo, voci), guaritore (cura a pagamento, come v2), tempio (**rialza un eroe caduto**: 20 + 10 × livello monete, torna con metà dei PF), bottega (A2), bacheca (2–3 taglie sui mostri visibili: ricompensa in monete e −3 di perdizione). Villaggio = locanda, guaritore, bottega ridotta (solo merce comune). Santuario = preghiera (−3 di perdizione, −8 con un'offerta di 20 monete; poi chiuso 3 giorni). **Fabbro che migliora un oggetto: rimandato ad A8** (servono oggetti migliorabili nel catalogo e regole Firestore); per ora il fabbro è la bottega A2. | Voce «Città» del piano; la deviazione è dichiarata. |
| W13 | **Caduti**: un eroe a 0 PF resta «a terra» e **segue** automaticamente l'eroe in piedi più vicino (non muove da solo); il tempio lo rialza. Se cadono tutti, campagna persa (vite e perdita di monete: A9). | Evita di dover «trasportare» a mano; A9 cambierà la morte. |
| W14 | **Perdizione 2.0** a soglie 25 / 50 / 75 (livelli 1–3), calcolate dal valore corrente (se scende, l'effetto cala): L1 +1 al livello dei mostri e +1 gruppo in giro; L2 un villaggio è **assediato** (servizi chiusi, un gruppo di guardia lo cinge; sconfiggerlo lo libera) e +2 ai mostri; L3 le **strade sbarrate** costano 2 invece di 0,5 e +3 ai mostri. Sale: alba +3, fuga +1, prova fallita +1, scelte «cattive» +2…+3. Scende: santuari, taglie (−3), passo di missione (−10), sotterraneo ripulito (−5). **100 = campagna persa.** | Voce «Perdizione 2.0». |
| W15 | **Vista a scorrimento** (`Mondo`, in `24h-campagna.js`): mappa SVG intera, trascina per scorrere, + / − e «Centra»; un **segnalino tondo per eroe** (celle condivise: segnalini affiancati); **tocco in due tempi** (anteprima di percorso e costo, poi «Vai»); tocco su un luogo = **scheda del luogo** con i suoi servizi; **diario** della missione; battaglie con la vista A5. | Stesse regole di tocco di A5 (V2); riuso dei gesti di `BatMappa`. |

## 2. Architettura e file
| File | Costante | Ruolo | Test |
|---|---|---|---|
| `motori/27m-avv-mondo.js` | `AMON` | `genera(seme, opz)` → celle, regioni, luoghi, strade; `percorso`, `raggiungibili`, `visibili`, nomi dei luoghi | `test_avv_mondo.js` |
| `motori/27n-avv-luoghi.js` | `ALUO` | servizi e prezzi, `stanze(seme, tipo, pericolo)`, eventi a scelta, santuari, bacheca, `livelloPerdizione`, effetti | `test_avv_luoghi.js` |
| `motori/27o-avv-mostri.js` | `AMOS` | nascita dei gruppi, fase di movimento, contatto, chi entra in battaglia | `test_avv_mostri.js` |
| `motori/28-campagna.js` | `CAMP` | stato v3, `nuova`, `migra`, `act` (tira, muovi, muoviTutti, fineTurno, breve, lungo, avanza, scegli, esci, entra, prega, rialza, taglia, esito…) | `test_campagna.js` (riscritto dove cambia il senso), `test_avv_aggancio.js` |
| `app/24h-campagna.js` | `Camp` | stato, selezione, tocchi, comandi (`data-a="mo"`), aggancio a `Bat` (`combatti`, `fineBattaglia`) | scenario browser `avv_mondo` (+ `campagna`, `inventario`, `eroi` aggiornati) |
| `app/24hg-mondo-mappa.js` | `MoMappa` | mappa SVG, nebbia, segnalini, gesti (trascina, pizzica, rotella, tocco) | scenario `avv_mondo` |
| `app/24hh-mondo-pannelli.js` | `MoPan` | barra in alto, eroi, tiro del movimento, fogli (luogo, riposo, diario, nemici), sotterraneo, prove, eventi, battaglia, fine | scenario `avv_mondo` |
| `css/39-campagna.css` | prefisso `mo-` | aspetto (legno e ottone) | `npm run struttura` |

Ordine nel manifest: i tre moduli dopo `27l` e prima di `28-campagna.js`; `24hg` e `24hh` dopo `24hf`. Icone nuove (`p_villaggio`, `p_santuario`, `p_rovina`, `p_mercante`) in `01b-icone.js`.

### Stato v3 (aggiunte a v2)
```
v:3, raggio:9, regioni:[{nome, terreno, fam, centro}],
celle['q,r']:{q,r,t,poi (tipo, come in v2), luogo (id), reg, visto, strada?, sbarrata?},
luoghi[id]:{id,tipo,nome,q,r,reg, …stato del luogo (assedio, chiuso fino al giorno N, bacheca, ripulito)},
round (1..8), giorno, fase,
eroi[i]:{… q, r, pm (null = da tirare), brevi (riposi brevi oggi), portato},
party (posizione di riferimento), mostri:[{id,fam,liv,ids,q,r,stato}], mercanti:[{id,q,r}],
sotterranei[luogoId]:{stanza, fatte}, dentro (luogoId|null), evento, sfida, incontro (v2), missione, perdizione, over
```

### Contratto di `CAMP.act` (azioni nuove)
`tira {eroe|tutti, conc}` · `muovi {eroe?, q, r}` (senza `eroe`: tutti quelli nella stessa cella) · `fineTurno` · `breve {eroe}` · `lungo` · `entra` / `esci` · `avanza` (stanza corrente) · `scegli {i}` (evento) · `prega {offerta}` · `rialza {eroe}` · `taglia {id}` · `esito {riep}` · le vecchie `risolvi`, `fuggi`, inventario e botteghe (ora per eroe e cella).

## 3. Sotto-step
- **A6.1 — Mondo (`AMON`).** Celle, 3 regioni, luoghi, collegamenti garantiti, luoghi fissi dal capitolo. *Test:* 300 semi → stesso seme = stessa mappa, ogni luogo raggiungibile da ogni altro, città vicino al centro, distanze minime, nessun luogo su acqua/montagna, luoghi fissi rispettati.
- **A6.2 — Luoghi (`ALUO`).** Tabelle dei servizi con prezzi, sotterranei (stanze), eventi, santuari, bacheca, soglie. *Test:* ogni sotterraneo ha 3–6 stanze, boss per ultimo, stesso seme = stesso sotterraneo; soglie 24/25/49/50/74/75/100; prezzi crescenti.
- **A6.3 — Campagna v3.** Eroi separati, `tira`/`muovi`/`muoviTutti`/`fineTurno`, riposi, giorno a 8 giri, perdizione a soglie, migrazione v2 → v3. *Test:* turni per eroe (due eroi in celle diverse, PM indipendenti), Concentrazione = vantaggio, muovi tutti, riposo breve/lungo con costi, soglie, v2 migrato.
- **A6.4 — Mostri e battaglia.** Nascita, fase, inseguimento, contatto, `battaglia` e `esito`, assedio, rinascita. *Test:* un eroe a 1 esagono entra subito, a 2–3 arriva dopo, a 4 no; un mostro non entra nei luoghi sicuri; la vittoria toglie il gruppo e paga PE e bottino; fuga e sconfitta; bot (con `AIA.partita`) che chiude la missione base in 300 semi con 4 eroi di livello adeguato.
- **A6.5 — Vista.** Mappa scorrevole, segnalini, scheda luogo, HUD, diario, aggancio a `Bat`. Si aggiornano i tre scenari browser che toccavano la vecchia mappa.
- **A6.6 — Scenario `avv_mondo`, documenti, verifica, PR.**

## 4. Rischi e come li tengo a bada
| Rischio | Contromisura |
|---|---|
| I test v2 dipendono da `s.party`/`s.pm` | `s.party` resta; `pm` passa per eroe: i test che spostano la compagnia si riscrivono con `eroi[0].pm` e `muovi` senza `eroe`. La migrazione ha un test suo. |
| La battaglia con un sottoinsieme di eroi rompe gli indici di `aggiorna` | `CAMP.battaglia` passa a `ASCO` una campagna ridotta e `esito` rimappa gli indici (`sfida.quali`). |
| Mappa e nemici troppo duri/facili | Numeri in un solo oggetto `CAMP.PARAM`; bilanciamento fine in A12. Il bot di A6.4 dà solo un controllo grossolano (la missione base è chiudibile). |
| Mappa lenta su telefono (271 esagoni + segnalini) | SVG semplice (un poligono + un glifo per cella), nebbia come unico poligono scuro, nessuna animazione continua; si misura nello scenario. |
| Collisioni CSS | prefisso `mo-` per tutte le classi nuove (lezione di A5). |

## 5. Cosa resta fuori da A6
Fabbro che migliora gli oggetti (A8), racconto e dialoghi dei luoghi (A7), mappa e luoghi del Capitolo 1 scritti a mano (A8), vite e perdita di monete, rientro sull'account (A9), musica e suoni (A10), schermo comune e più telefoni (A11), bilanciamento fine (A12).

## 6. Stato e scarti dal piano (31 ottobre 2026)
**Fatta (A6.1–A6.6).** Motori e test in node, vista, scenari del browser e documenti. Cosa è diverso da quanto scritto sopra:
- **Antri e rovine**: un solo antro (4 stanze) e due rovine (3 stanze) invece di due antri; la missione base passa per l'antro e la torre.
- **Tempio**: 20 + 10 × livello (non 15): con 15 il bot non riusciva a rialzare i caduti prima del capo.
- **Capo scalato** (nuovo, W16): il capo vero compare solo se il livello medio è almeno quello del capo + 1 (`CAMP.dettaglioBoss`, `PARAM.capoMargine`); sotto, arrivano i suoi in versione «difficile». Senza questa regola la missione base era impossibile per eroi di livello basso.
- **Fabbro che migliora gli oggetti**: rimandato ad A8 (resta la bottega di A2).
- **Tocco**: il primo tocco sceglie la destinazione e mostra percorso e costo; il secondo tocco sulla stessa cella (o «Vai») conferma. Senza il tiro del movimento un tocco sulla mappa non fa nulla e lo dice. Se il movimento non basta, «Avanza di N» porta fin dove si arriva.
- **Comandi**: un solo `case'mo'` in `07c`, con `data-v="verbo:argomento"`, invece di una ventina di casi.
- **Nemici nella nebbia**: i gruppi si vedono (e si toccano) a 3 esagoni anche se il terreno sotto è ancora ignoto: la vista degli eroi scopre il terreno a 2.
- **Battaglia della campagna**: non si abbandona dal menu; esce e riprende (`Bat.mondo` = seme della sfida, salvato con la battaglia, anche a fine scontro finché non si preme «Continua»).
- **Numeri misurati**: il bot di `test_campagna` vince 8 campagne su 12 a livello 9 (capo della torre di livello 8); fuori dal bot, nessuna taratura fine: A12–A13.
- **Mappa leggera**: un poligono e al massimo un glifo per cella (le celle ignote sono solo un poligono scuro); scorrere e zoomare cambia solo il `viewBox`, senza ridisegnare.
