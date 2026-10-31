# A11 — Avventura in compagnia: stanza live, TV e telefoni

Piano e contratti di `AST` (`motori/28e-avv-stanza.js`, motore puro) e della sua vista (`app/24hm-avv-stanza.js`, `AvvStanza`). Stato: **in lavorazione** (ramo `feat/avventura-a11`, sopra A10).

Regola di fondo come per tutta l'Avventura: ciò che si decide senza browser è puro e provato in node (chi può fare cosa, il voto, la battaglia condivisa, la presenza, il rientro); le viste sono un tramite. Niente `Math.random` nei motori (il dado è in `s.rng`).

## 1. Che cosa si vuole
Una partita di Cantari di Ventura in una **stanza live** (`R.mode='rt'`, nessun host: lo stato sta nel database): ognuno col suo telefono e il suo eroe; una TV (`?tv=CODICE`, sola visione) mostra la mappa, la battaglia e i dialoghi a tutto schermo. Il telefono comanda solo il proprio eroe. Chi ospita (il primo posto) guida i compagni della storia e ciò che riguarda tutto il gruppo.

## 2. Il modello: una partita di stanza come le altre
`ENG.avventura = { newGame, act }` (contratto dei motori, `docs/ARCHITECTURE.md`): lo stato `s` va nel documento della stanza come per ogni gioco, le mosse passano da `dispatch` → `SYNC.mossa`, quindi **atomiche** (`rev`). Lo stato è `sim:true` (qualunque posto può provare ad agire: il motore decide) perché sulla mappa i giocatori muovono in contemporanea; ciò che non commuta (una battuta del dialogo, un voto) porta `base` (= `s.av.evn` che il telefono stava mostrando) e se lo stato è già andato avanti viene rifiutato («Un altro telefono ha mosso un attimo prima») invece di essere rigiocato.

```
s = { g:'avventura', gid, v:1, sim:true, n, names, cur:0, ev:[], evn, over:null,
      posti:[{ nome, uid, eroe, qui, ospite }],   // un posto per giocatore; `eroe` = indice in av.camp.eroi
      av:    <stato di AVV>,                       // la sessione condivisa (camp + racc + vite…)
      lotta: <stato di ASCO> | null,               // la battaglia in corso
      film:  [azioni] | null,                      // le azioni dell'ultima mossa in battaglia (per animare anche gli altri telefoni)
      voto:  { chiave, scelte:{ posto: i } } | null,
      conti: { posto: { xp, oro, fatto } } }       // quanto è già tornato sull'account di ciascuno
```
Peso: circa 30 KB (il mondo è ~22 KB di celle) + ~7 KB di battaglia: una scrittura per mossa è accettabile per un gioco a turni.

## 3. Chi guida chi
- Un posto = un eroe (`posti[i].eroe`). I **compagni** della storia (`ACMP`) e gli eroi dei posti **assenti** li guida chi ospita (posto 0, o il primo presente se lui è fuori).
- `AST.guida(s, i)` dice il posto che guida l'eroe `i` di `av.camp.eroi`.
- Posti ospiti (sullo stesso telefono, senza profilo) ricevono un eroe di prova per classe.

### Permessi (`AST.act`)
| Azione | Chi |
|---|---|
| `av` con `camp` e `eroe` (tira, muovi, cura, equipaggia, usa, compra, vendi…) | chi guida quell'eroe |
| `av` con `camp` senza `eroe` (fine giro, riposo, entra, esci, avanza, scelte d'evento, «tira per tutti») | chi ospita |
| `av` `scena`, `parla`, `compagnia`, `bacheca`, `chiudi` | chi ospita |
| `racconto` `continua` | qualunque posto presente (con `base`) |
| `racconto` `scegli` | **voto** (vedi sotto) |
| `combatti`, `lotta` | chi guida l'eroe di turno; il resto lo gioca l'IA |

## 4. Le scelte del dialogo: voto
Con un solo posto presente la scelta vale subito. Con più posti, `{t:'voto', i, base}` registra il voto del posto; quando **tutti i presenti hanno votato** si applica la scelta più votata (a pari voti vale quella di chi ospita; se non ha votato, la prima). Una prova resta di chi la «tira»: nel racconto il dado è nello stato, non c'è un tiratore. Chi ospita può chiudere il voto prima con `{t:'voto', ora:true}`. Il voto è azzerato a ogni passo del racconto.

## 5. La battaglia condivisa
Oggi la battaglia vive nella vista (`Bat.s`); in stanza vive in `s.lotta` e ogni azione è una mossa:
1. `{t:'combatti'}` (chi ospita) crea `lotta` da `AVV.battaglia(av)` con le **reazioni automatiche** (non si può chiedere una reazione a un altro telefono).
2. `{t:'lotta', a}` è un'azione di `ASCO.act` del combattente di turno; `AST` controlla che chi la manda guidi quell'eroe.
3. Dopo ogni azione `AST` fa giocare **da solo** nemici, eroi a terra ed eroi di posti assenti (`AIA`) finché tocca a un eroe guidato da una persona o la battaglia finisce. Le azioni giocate (la prima e quelle dell'IA) vanno in `s.film`: gli altri telefoni **rigiocano il film** sul proprio stato precedente con le animazioni (`BatAnima`), perciò ci vogliono solo poche decine di byte per mossa e tutti vedono lo stesso, passo per passo.
4. A battaglia finita `AST` dà il risultato ad `AVV` (`esito` con `SC.riepilogo`) e azzera `lotta`: la fase torna alla mappa o al dialogo.

## 6. Presenza, uscita e rientro
`{t:'presenza', posto, qui}`: chi esce (o sparisce dalla stanza) resta nei `posti` con `qui:false`; il suo eroe lo guida chi ospita e in battaglia lo gioca l'IA. Chi rientra (stesso `uid`/dispositivo) riprende il suo eroe com'è. Il voto non aspetta gli assenti.

## 7. Rientro sull'account
A fine sessione ciascun telefono riscuote **solo il proprio eroe** (`AST.rientro(s, posto)` dà XP e oro da accreditare con le stesse tappe e limiti di `ARIE`); `s.conti` ricorda cosa è già stato accreditato per non farlo due volte. Il salvataggio della campagna condivisa va sul profilo di chi ospita (`FB.salvaAvventura`, come A9).

## 8. Viste
- **Telefono**: le stesse schermate di A5–A9 (mappa, dialogo, battaglia, zaino) con `Ses.a` e `Bat.s` specchio dello stato della stanza; i comandi passano da `AvvStanza` (un solo punto: `Ses.fai` e `Bat.gioca`), che li manda come mosse. Il pulsante dell'eroe altrui è spento con il perché.
- **TV** (`ui.tv`, sola visione): mappa e battaglia grandi, ordine di iniziativa, dialoghi a tutto schermo con i voti.

## 9. Fuori da A11
Nessun suono nuovo. 3D (A12). Bilanciamento per più giocatori, prezzi, difficoltà (A13).

## 10. Test
- `tests/test_avv_stanza.js`: posti ↔ eroi, permessi per ogni azione, voto (maggioranza, parità, uscita), battaglia condivisa (film = stesso stato finale), assenza e rientro, rientro sull'account senza doppioni, determinismo, peso dello stato, nessun `Math.random`.
- Scenario `avv_tv` (browser): 1 TV e 2 telefoni simulati.
