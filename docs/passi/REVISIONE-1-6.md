# Revisione delle fasi 1–6 («Il Condottiero», passi 01–24)

Scritta il 18 novembre 2026 su `main` a `022e312` (dopo la PR #169). Fonti: i 24 passi, il codice, `npm run verifica` (88 test verdi), le prove lente dei passi 06, 16, 17, 21 e 23, l'impronta (identica) e due giri nel browser a 390×844, con e senza `?ven=grandi,consiglio,mondo2`.

## In breve
- **Le fondamenta sono buone.** Ganci, interruttori, impronta, motori ripetibili, file spezzati, scala dei ranghi (70% e 63%, dentro 58–75%), consiglio che costa l'1,1% del passo, geografia leggibile. Il lavoro «da ingegnere» regge.
- **Il lavoro «da game designer» è mancato.** I passi sono stati eseguiti alla lettera: le regole misurabili (un ottone, 44 px, niente testo fisso) sono rispettate; la domanda vera, cioè *cosa deve sapere chi gioca per decidere*, non se l'è posta nessuno. Il tuo esempio dell'incarico non è un caso isolato: è lo schema.
- **I passi paralleli non si sono parlati.** Dati prodotti da un passo e letti da un altro con nomi diversi, funzioni nuove che nessuno usa, eventi del motore che la vista non mostra.
- **Il rilascio 1 è uscito con promesse finte.** Il foglio «Nuova campagna» fa scegliere Recluta o Leggenda, ma quasi tutte le leve non sono collegate a niente.

## 1. Perché sembra «poco ragionato»: tre cause
1. **Il passo diceva il *come*, non il *perché*.** Il 13 scrive: «la frase di spiegazione va nell'`aria-label` e nell'infobox, non sullo schermo». L'esecutore ha tolto la frase. L'infobox non l'ha fatto, e nessuno ha notato che un incarico **è** una frase: premio, giorni, destinazione. Nessuna sezione del passo dice quali informazioni servono per decidere.
2. **I controlli misurano l'igiene, non l'esperienza.** Il controllo visivo conta gli ottoni e i pixel. Non si chiede mai «da questa schermata sai cosa stai accettando o pagando?». Gli scenari toccano i `data-v` con `evaluate`, non giocano.
3. **Nessuno cuce le fasi.** Ogni passo è stato approvato da solo; a fine fase nessuno prova che il dato del passo A arrivi davvero alla vista del passo B.

## 2. Difetti trovati, per gravità

### P1: bug e promesse finte (visibili o pronti a esplodere)
| # | Cosa | Dove | Prova |
|---|---|---|---|
| 1 | **Toccare «Incarico» lo accetta subito**, senza mostrare premio, giorni e meta. Nessun messaggio dopo. Prima del passo 13 c'era la riga con i termini e «Accetta». | `app/24hwb-ven-luoghi.js:82` | nel browser gli incarichi passano da 0 a 1 al primo tocco |
| 2 | **«Tutti» arruola tutti i volontari al primo tocco**: 60 monete e i viveri scendono da 4 a 2 giorni, senza avviso prima. | `24hwb-ven-luoghi.js:70` | oro da 320 a 260, viveri in rosso |
| 3 | **Il rango del nemico non compare mai nell'incontro.** Il passo 12 scrive `loro.rango={r,nome}`, la vista del passo 09 legge `r.n`. | `motori/28kj-ven-rango.js:40` contro `app/24hwd-ven-scontro.js:25` | contro il re di rango 4, nessun pallino |
| 4 | **Leve di difficoltà scollegate.** `VDAT.DIFF.eco`, `cons`, `fer` e `nem.predoni` non li legge nessun motore; vanno solo `stag` (passo 17) e il rango di `nem` (spento). Nessun passo del piano collega `cons`, `predoni` e `fer`. Il foglio è online. | `motori/28jc-ven-dati-mondo.js:11-18` | prova lenta 17: senza stagioni, Leggenda e Condottiero danno **numeri identici** seme per seme |
| 5 | **Il piano usa il nome sbagliato per un evento.** Il passo 31 aspetta `rotta-g`, il motore (passo 16) emette `rotta-r`. | `docs/passi/31-regia.md:32` | — |

### P2: la meccanica c'è, ma chi gioca non la vede
| # | Cosa | Dove |
|---|---|---|
| 6 | **Gli eventi nuovi del campo sono muti**: `rotta-r` (un reparto cede), `raduno`, `stendardo` (cade il signore), `carro` (frecce finite), `ondata`, `piano` (il nemico cambia manovra). La vista gestisce solo gli eventi di prima. Il rilascio 2 (passo 29) accenderebbe battaglie i cui momenti decisivi non si vedono. | `app/24hv-ven-campo.js:135-146` |
| 7 | **La dottrina non arriva mai al giocatore.** `loro.dott` è nell'anteprima, ma la vista non lo mostra e il tavolo non dice nulla del nemico. «I regni si riconoscono da come combattono» resta vero solo nei test. | `24hwd-ven-scontro.js`, passo 19 |
| 8 | **Il pedaggio non ha prezzo.** Il motore prende il 25% delle monete (minimo 30), ma la scelta non lo dice, e il campo `oro` del contratto del passo 09 è vuoto. | `motori/28kf-ven-anteprima.js:19`, `28kc-ven-scontro.js:93` |
| 9 | **Lo stemma scelto è un'iniziale.** Le 12 figure diventano la prima lettera (Leone e Lupo danno «L»; Cervo, Corona e Cinghiale danno «C»), e lo stemma si vede solo nella carta «Riprendi»: non sulla mappa, non nell'incontro (dove c'è una «C» arancione), non in battaglia. | `app/24ha-avventura.js:17` |
| 10 | **Il tavolo dello schieramento non dice nulla di strategico.** È funzionale (settori, gettoni, ondate) ma muto: il terreno non è nominato (altura e bosco), i nemici sono tre macchie, la formazione è scritta in parole, i gettoni si sovrappongono, ci sono due ottoni. | passo 19, `foto2/10-tavolo.png` |
| 11 | **Un segnale che c'è sempre non segnala niente.** Ogni luogo genera sempre un incarico, quindi «Incarico» compare in città, villaggio, monastero, castello, porto e locanda, ed è anche una tessera. | `motori/28kb-ven-economia.js:36` |
| 12 | `VEN.prezzoMedio` (contratto del passo 13) **non lo usa nessuno**: il mercato confronta col prezzo base, non con la media del mondo. | `28kb-ven-economia.js:32` |

### P3: rifiniture
- Incontro: «re Aldemaro / re Aldemaro · prode» (nome ripetuto); la barra dice «Loro» senza numero; i pulsanti «i» sono azzurri, fuori dalla tavolozza; «Risolvi» non stima le perdite.
- Luogo: il Torneo è grigio senza dire perché, solo per chi usa un lettore di schermo; l'icona dell'Armaiolo sembra una maglietta; nessuna descrizione dei servizi si vede (l'infobox chiesto dal passo 13 non c'è).
- Menu: l'insegna della Compagnia è una sfumatura con una bandierina, mentre il passo chiedeva un accampamento al tramonto con tende e stendardi. Le difficoltà dicono «Ferro e carestie» senza spiegare cosa cambia.
- Il rilascio 1 è stato approvato con quattro difetti aperti (#170, #171, #175, #176), e `scenari/p20.py` li mette in una lista d'eccezioni (`_ATTESI`): la prova passa e il debito resta.
- Restano aperte le PR #140 (T4, menu Avventura, sostituita dal passo 18), #141 e #137: da chiudere o aggiornare.

### Equilibrio (da tenere d'occhio, non sono bug)
- **I re partono tutti «maestri di guerra».** Nel mondo nuovo nascono 9–12 regni e ogni re ha rango base 4. Al giorno 1 un terzo dei signori è di rango 4, tanto che il primo incontro di prova era un re di rango 4 con 11 uomini. La crescita di rango perde senso, e l'unificazione non crea re «più grandi».
- **Il denaro non manca mai.** Nel bot di due anni la compagnia accumula 75–145 mila monete. A Condottiero le stagioni non mordono: 68 giorni di fame con il calendario, 81 senza sugli stessi semi. L'obiettivo «l'inverno pesa» regge solo a Leggenda rigida. Se ne occupa il passo 36, che però deve saperlo.

## 3. Passo per passo
| Passo | Verdetto | Nota |
|---|---|---|
| 01 Spezzare il mondo | ✅ | `28k` da 110 a 31 KB. Il debito si è spostato: `28ja-ven-voci` 55 KB, `24hu-ven-mappa` 49 KB |
| 02 Spezzare la vista | ✅ | `24hw` da 69 a 25 KB |
| 03 Completare le tracce | ✅ | passi 40–45 completi |
| 04 Ganci e interruttori | ✅ | architettura solida; manca chi possiede le leve `cons`/`fer`/`predoni` (P1-4) |
| 05 Mappa bloccata | ✅ | |
| 06 Battaglie grandi | ✅ | prove lente verdi |
| 07 Geografia | ✅ | fiumi, ponti e strade leggibili anche nel 3D |
| 08 HUD del mondo | ✅ | il passo di vista migliore: i numeri hanno un nome, viveri in giorni, allarmi giusti |
| 09 Incontro | ⚠️ | rango invisibile (P1-3), dottrina, pedaggio, nome doppio |
| 10 Voci in campo (testi) | ⏸ | scritte, le userà il passo 28 |
| 11 Reparti, settori, ondate | ✅ | motore completo e provato |
| 12 Rango | ⚠️ | motore giusto; forma del dato diversa dalla vista; re a 4 nei mondi nuovi |
| 13 Luogo e mercato | ❌ | incarico alla cieca, «Tutti», niente infobox, segnali rumorosi, `prezzoMedio` inutilizzato |
| 14 Mappa grande | ✅ | |
| 15 Aperture (testi) | ⏸ | le userà il passo 33 |
| 16 Morale, fatica, frecce | ⚠️ | motore ottimo (24–32/40 rispettato), ma eventi muti (P2-6) |
| 17 Stagioni | ⚠️ | morde solo a Leggenda; foraggio e svernare ben pensati |
| 18 Menu e nuova campagna | ❌ | leve finte (P1-4), stemma a lettera, insegna povera, sei ottoni (#175) |
| 19 Tavolo | ⚠️ | funziona, ma non aiuta a decidere (P2-10) |
| 20 Rilascio 1 | ⚠️ | approvato con quattro difetti in lista d'eccezioni |
| 21 Consiglio di guerra | ✅ | scala e costo dentro i numeri; manca come si vede (P2-6, P2-7) |
| 22 HUD della battaglia | ✅ | il campo occupa più del 70%; morale per reparto in vista |
| 23 Molti regni | ✅ | 9 regni con nomi propri; vedi i re (equilibrio) |
| 24 Stagioni sulla mappa | ✅ | icona e informazioni giuste; la tinta d'inverno è lieve (da guardare dopo un vero cambio di giorno) |

## 4. Decisioni e dove vanno le correzioni
Decisioni dell'utente (18 novembre 2026):
- **Luogo**: scheda dei termini. La tessera mostra il numero che conta; il tocco apre i termini con un solo ottone.
- **Difficoltà**: collegare subito consumi, economia e predoni; nascondere «Ferite del capitano» finché non è progettata.
- **Re nel mondo nuovo**: rango secondo la grandezza del regno (2, 3 o 4), che cresce con l'unificazione.
- **Metodo**: nessuna fase nuova. Ogni correzione va nel primo passo futuro che tocca già quei file, senza che due passi della stessa fase tocchino lo stesso file (`npm run passi` resta OK).

| Correzione | Passo | Fase | File aggiunti al passo |
|---|---|---|---|
| Il campo parla (P2-6); tavolo leggibile sul campo (P2-10) | 26 | 7 | — |
| Re per grandezza; leve `cons`, `eco`, `predoni` (P1-4) | 27 | 7 | `28kj`, `28kh`, `28ka` |
| Incontro: rango, dottrina, pedaggio, «Loro N» (P1-3, P2-7, P2-8); carte del tavolo; debiti #170, #171, #175, #176; «Ferite» nascosta | 47 | 7 | `28kf`, `24ha`, `39jc`, `scenari/p20.py` (controllo ora forte+visivo) |
| `rotta-g` → `rotta-r` (P1-5) | 31 | 8 | — (corretto nel testo) |
| «Risolvi» con le perdite attese | 32 | 8 | — |
| Luogo: scheda dei termini, segnali, «Tutti», `prezzoMedio`, icona (P1-1, P1-2, P2-11, P2-12) | 36 | 9 | `39jb`, `01b-icone` |
| Stemma con le 12 figure, ovunque (P2-9) | 38 | 10 | `24ht`, `24hwd` |

Ogni passo ospite ha una sezione «Correzioni dalla revisione delle fasi 1–6» con decisioni e prove.

**Da sapere**: con questa scelta l'incarico «alla cieca» (P1-1) e «Tutti» (P1-2) restano online fino al passo 36, cioè per tre fasi. Se pesa, le due sole tessere si possono correggere prima con una PR `fix/…` piccola, che il passo 36 poi assorbe.

## 5. Cambi al metodo (già in `LEGGIMI.md`: regole 9 e 10, cucitura)
1. **Prima chi gioca, poi la regola** (regola 9 di `LEGGIMI.md`): le domande a cui la schermata deve rispondere prima di un tocco che costa o impegna (es. «quanto pago?», «cosa rischio?», «entro quando?»). La regola d'oro diventa: *un tocco che spende o promette mostra prima il prezzo*.
2. **Il controllo visivo risponde a quelle domande**, oltre a contare ottoni e pixel. Il modello forte gioca la schermata con clic veri, non con `evaluate`.
3. **Cucitura a fine fase** (Opus · alto, un'ora; ora scritta in `LEGGIMI.md`): una prova dei contratti tra motore e vista (forma di `anteprima`, eventi del campo, opzioni) più l'elenco di ciò che è stato prodotto senza consumatore: campi, funzioni, eventi e leve. Ognuno trova un passo che lo usa, o si toglie.
4. **Un difetto noto non entra in una lista d'eccezioni senza un passo che lo chiude** prima del rilascio successivo.
5. **Partita vera a fine fase**: 20 minuti a 390 px, giocati, con tre righe di note di design nel file della fase.
