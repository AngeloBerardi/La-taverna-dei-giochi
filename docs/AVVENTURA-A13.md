# A13 — Bilanciamento e rifinitura di Cantari di Ventura

Stato: **fatta** (1 novembre 2026). Piano generale in `docs/AVVENTURA.md` (sezione A13); qui numeri, metodo e limiti.

## 1. Cosa cambia per chi gioca
- **Tre difficoltà**, da scegliere quando si inizia la campagna (carta «Nuova campagna»: tre pulsanti a scelta unica con la descrizione di quella scelta; la scelta si ricorda sul telefono). Non si cambia a campagna avviata. Il posto occupato mostra «Eroica» o «Racconto» (Normale non si scrive). Anche la stanza in compagnia (A11) usa la scelta di chi la crea.
- **Normale** è la sfida pensata per il capitolo: ora **4 vite** (erano 3) e gruppi di nemici a misura di compagnia. I salvataggi di prima di A13 non hanno difficoltà: giocano a Normale e **tengono le vite che hanno** (3 su 3).
- Bersagli da toccare di **almeno 44 px** nella mappa, nella battaglia e nei suggerimenti; nessuno scorrimento orizzontale e nessun contrasto sotto AA nelle schermate controllate.

## 2. Le quattro leve (tabella `ADIF`, `motori/27ha-avv-difficolta.js`)
| | Racconto | Normale | Eroica |
|---|---|---|---|
| Budget dei gruppi nemici (mondo, sotterranei, scontri del racconto) | ×0,6 | ×0,75 | ×0,85 |
| Vite della compagnia | 6 | 4 | 3 |
| Perdizione per alba | 2 | 3 | 4 |
| Esperienza degli scontri | ×1,25 | ×1 | ×1 |
| Sconfitta: PF al risveglio · oro perso · perdizione | 75% · ¼ · +5 | 50% · ½ · +10 | 50% · ½ · +10 |

- `gruppi` moltiplica il budget di PE di `ASCO.incontro` (argomento `scala`): meno nemici e più deboli, mai nemici diversi. I numeri dei mostri non si toccano (restano in `BEST`).
- Le ricompense delle missioni non cambiano con la difficoltà (solo l'esperienza degli scontri).
- `camp.diff` vive nello stato (`CAMP.nuova(…, {difficolta})`, `CAMP.migra` lo riporta a Normale se manca o è sconosciuto); `AVV.nuova` fissa `vite`/`viteMax` dalla tabella.
- Il riepilogo del posto salvato **non** ha una chiave `diff`: le regole di Firestore (`avventuraOk`) ammettono solo le chiavi note e senza una nuova pubblicazione dei regole il salvataggio sarebbe rifiutato. La difficoltà del posto si legge dallo stato salvato (`Ses.diffDi`, in cache per versione). **Nessuna pubblicazione di regole è necessaria** (`viteMax` ≤ 6 ≤ 9 già ammesso).
- Perché Normale scala a ×0,75 e non ×1: i budget di A0/A4 sono tarati sul singolo scontro (bot bravo: 91% sui «medi»). Un capitolo ha ~50–60 battaglie e anche chi ne perde una su otto finisce le vite: a ×1 con 3 vite il bot non finiva mai il capitolo.

## 3. Come si è scelto: campagne intere col bot (`tools/avventura/campagne.js`)
Un bot gioca «La Corona Spezzata» dall'inizio alla fine **attraverso l'orchestratore** (nessuna scorciatoia sul motore): sceglie nei dialoghi (prova più probabile, recluta sempre i compagni), cammina verso le scene della storia, combatte con l'IA `eroica` contro nemici `normale`, si cura, riposa, rialza i caduti, compra armature e armi dal fabbro, dà la caccia ai gruppi che può battere (mai i «difficili»), entra nei sotterranei solo in forma, impara dalle sconfitte (aspetta di crescere prima di ritentare), chiude la sessione in città dopo 8 battaglie o 5 giorni. Niente `Math.random`: tutto dal seme.

```
node tools/avventura/campagne.js --diff normale --squadra g,m,c,l --n 36 --seme 401
   [--stile furbo|caso] [--abilita bravo|medio] [--json] [--dbg]
   [--mod gruppi=.8,vite=4]     prova numeri senza toccare i motori
node tools/avventura/bilancia.js --diff medio --fam banditi,bestie --liv 3-4 --n 4 --k 20 --classi g,m,c,l
```

### Taratura (prima versione del bot, 8–16 campagne per cella, compagnia g+m+c+l)
| Gruppi | Vite | Campagne finite |
|---|---|---|
| ×1 (tabelle intere) | 3 | 0/8 |
| ×1 | 8 | 25% |
| ×0,85 | 5 | 38% |
| ×0,8 | 4 | 19–31% |
| ×0,75 | 3 | 50% |
| ×0,75 | 4 | 50–69% |
| ×0,7 | 4 | 75% |
Le vite contano meno dei gruppi: a ×1 anche 8 vite non bastano. Eroica a ×0,85 con 3 vite dà dall'8% al 25% a seconda del campione (a ×0,9 il 6%).

### Misura finale (bot definitivo, compagnia g+m+c+l, 36 campagne per difficoltà, seme 401)
| | Racconto | Normale | Eroica |
|---|---|---|---|
| Campagne finite | **92%** (33/36; IC 95% 83–100) | **50%** (18/36; 34–66) | **11%** (4/36; 1–21) |
| Perse (vite o perdizione) | 0 | 13 | 32 |
| Ferme (il bot non ha più nulla da fare) | 3 | 5 | 0 |
| Giorni per finire (mediana) | 15 | 15 | 19 |
| Livello medio a fine campagna | 7,8 | 6,5 | 4,3 |
| Battaglie per campagna · sconfitte | 58 · 0,7 | 49 · 2,2 | 25 · 2,7 |
| Vite rimaste a chi vince | 5,3 | 3,1 | 2,5 |
| Sessioni per campagna | 4,3 | 4,0 | 2,0 |
| Per sessione: giorni di viaggio | 3,5 | 2,7 | 2,5 |
| Per sessione: PE della compagnia (somma) | 2 837 | 2 436 | 1 894 |
| Per sessione: oro (saldo, dopo le spese) | +57 | +26 | −17 |

Il bot **non usa** pozioni né la bacheca degli incarichi e non rimedia agli errori di rotta: chi gioca davvero ha più strumenti, quindi queste percentuali sono prudenti (Normale ~50% per un bot, più per una compagnia che si organizza). Eroica è fatta per essere dura: ~1 campagna su 10 per il bot.

### Per composizione della compagnia (12 campagne per cella, seme 501: ±25 punti, valgono per la direzione, non per il decimale)
| Compagnia | Racconto | Normale | Eroica |
|---|---|---|---|
| guerriero | 8% | 0% | 0% |
| guerriero + chierico | 25% | 0% | 8% |
| guerriero + mago + chierico | 50% | 25% | 8% |
| guerriero + mago + chierico + ladro | 75% | 42% | 0% |
| esploratore + bardo + guerriero + chierico | 42% | 0% | 0% |
| esploratore + bardo + mago + ladro | 50% | 0% | 0% |

### Una battaglia «media» per classe (4 eroi livello 3–4, banditi e bestie, 20 incontri, IA bravo)
| Compagnia | Vittorie | PF persi |
|---|---|---|
| g + m + c + l (riferimento) | 89% | 37% |
| e + m + c + l | 83% | 44% |
| g + b + c + l | 80% | 44% |
| g + m + e + l | 88% | 41% |
| g + m + c + e | 81% | 41% |
| g + m + c + b | 74% | 46% |
| g + m + b + e | 86% | 42% |

## 4. Cosa ha trovato la misura
1. **Difetto del motore (A9), corretto**: una sconfitta sulla mappa che porta la perdizione a 100 *con la penalità del risveglio* (+10) lasciava la campagna in uno stato senza fine (`camp.over` impostato, `fine` nullo): ogni azione rispondeva «Campagna finita». Ora `dopo()` ricontrolla dopo il risveglio e chiude come «persa per perdizione». Test: `test_avv_orchestratore.js` («una sconfitta sulla mappa che porta la perdizione a 100…», fallisce senza la correzione).
2. **Bardo** è la classe che costa di più nella battaglia singola (74–80% contro 89% del riferimento, −9/−15 punti a seconda di chi sostituisce); l'esploratore costa 1–8 punti. Con 60 battaglie la differenza si somma: le compagnie senza mago né ladro a Normale non finiscono mai nel campione. **Non è stata toccata nessuna classe** (tabella di A2/A3, `PASS`/poteri in `27e`): serve un giro di bilanciamento dedicato (proposta: più danno o più protezione al bardo, rivedere l'uso dei poteri di sostegno nell'IA). Nel frattempo Racconto per quelle compagnie.
3. **Un solo eroe**: anche a Racconto il bot finisce l'8% delle campagne (da soli, con i compagni che si uniscono). Consigliate 3–4 figure; la pagina non lo impedisce.
4. Le scene della storia che si possono rifare (la cella di Gherardo, il pozzo) non hanno un tetto: un giocatore ostinato può ripeterle all'infinito senza guadagnare nulla (il bot ci è rimasto bloccato finché non gli si è insegnato a lasciarle dopo tre ripetizioni a stato invariato). Il gioco resta com'è.

## 5. Accessibilità (scenario `avv_accessibilita`)
- Bersagli (pulsanti, link, `role=button|radio|tab`, input, `[data-a]`) **≥ 44 px** nelle schermate: pagina Avventura, regole, scelta della campagna, dialogo del prologo, mappa col foglio del luogo, battaglia. Si contano anche i `::before/::after` assoluti che allargano l'area (come `.info`). Ritoccati: `.mo .b.sm`, `.mo-sb .b`, `.mo-chip`, `.mo-fh .ib`, `.mo-cron` (campagna), `.bt .ib`, `.bt-zoom .ib`, `.bt-ch`, `.bt-conc`, `.bt-gr .chip`, `.bt-log` (battaglia), `.tut-bt .b` (suggerimenti), `.av .b.sm` (pagina).
- **Contrasto** del testo AA (4,5:1; 3:1 per testo grande) misurato su ogni elemento visibile e non coperto, con lo sfondo composto dagli antenati; nelle schermate controllate non c'è nulla sotto soglia. Limiti: i testi sopra sfondi con immagine o sfumatura, le etichette dentro gli SVG e il canvas 3D non si possono misurare dalla pagina.
- Il selettore di difficoltà è un `radiogroup` con `role=radio` e `aria-checked`; la descrizione ha `role=status`.
- Soglia variabile: `A11Y_MIN=40 python3 tools/test-browser/run.py avv_accessibilita`.

## 6. Prestazioni su telefoni economici (scenario `avv_prestazioni`)
- Budget del 3D in battaglia (misurati con WebGL software, quindi limiti larghi): **40 chiamate di disegno, ~21 000 triangoli, 39 geometrie, 3 texture, 2 luci (1 con ombre), ~1 Mpx** a 390 px. Soglie del test: 120 chiamate, 80 000 triangoli, 150 geometrie, 12 texture, 6 luci / 1 ombra, 2,4 Mpx.
- Con «Grafica 3D: No» **three.js non si scarica** nemmeno e non c'è nessun canvas.
- Con CPU rallentata ×4 e impostazione «Automatica» la sonda dei fps (mediana > 58 ms) spegne il 3D da sola (`avv-3d = lento`); la mappa piatta resta intera e un tocco risponde in 215 ms.
- Non misurato: la mappa del mondo in 3D (stessa tecnica, geometrie fuse per colore), telefoni veri (qui WebGL è software).

## 7. Moduli e test
| File | Ruolo |
|---|---|
| `motori/27ha-avv-difficolta.js` (`ADIF`) | tabella, `valida`, `di`, `gruppi`, `xp`, `scalaXp` (+ `tests/test_avv_difficolta.js`) |
| `motori/27i-avv-scontro.js` | `incontro(…, scala)` moltiplica il budget |
| `motori/27o-avv-mostri.js`, `28-campagna.js`, `28a-avv-orchestratore.js` | leggono la tabella (gruppi del mondo e dei sotterranei, perdizione per alba, esito, vite, risveglio) |
| `motori/28e-avv-stanza.js`, `app/24hm-avv-stanza.js` | `AST.nuova(…, {difficolta})`, ricordata in `pre` e nel rigioco |
| `app/24hj-sessione.js` (`Ses.diffH`, `diffDi`, comando `diff:<id>`), `css/39e-sessione.css` | selettore e posto occupato |
| `tools/avventura/campagne.js`, `bilancia.js --classi` | misure |
| `tests/test_avv_campagne.js` (lento) | 6 semi × 3 difficoltà: ripetibile dal seme, nessun errore del bot, l'ordine Racconto ≥ Normale ≥ Eroica, un finale che si salva e si riapre |
| `tools/test-browser/run.py` | `avv_accessibilita`, `avv_prestazioni`; `avv_sessione` segue le vite di Normale |
| `07d-regole.js`, `docs/rules/avventura.md` | regole in-game e scheda con le difficoltà |

## 8. Da fare / idee
- Giro di bilanciamento delle classi (bardo, poi esploratore) e rimisura per composizione.
- Bot: pozioni, bacheca degli incarichi, equipaggiamento dai bottini; poi rimisurare (le percentuali salirebbero).
- Prova su telefoni veri (fps, calore) e budget anche per la mappa del mondo in 3D.
- Valutare una vita che si ricarica a ogni capitolo/atto invece di un numero fisso per tutto il capitolo.
