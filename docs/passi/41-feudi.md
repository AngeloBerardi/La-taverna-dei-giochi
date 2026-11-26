---
passo: 41
titolo: Feudi vivi: costruire (motore)
fase: 10
area: mondo
dopo: [03]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28ko-ven-feudi.js
  - src/js/motori/28n-ven-audio.js
---

# Passo 41 — Feudi vivi: costruire (motore)

**In breve.** Nei tuoi luoghi costruisci (mulino, mura, caserma, mercato, torre, cappella) e le scelte cambiano rendite e difese.

**Acceso da.** I mondi nuovi (`s.geo===2`, rilascio 4): nei mondi vecchi l'azione risponde «Qui non si costruisce» e nessun ascoltatore fa nulla.

## Scopo

Un feudo non è solo una rendita: ci costruisci, e lo vedi crescere sulla mappa. Le scelte cambiano cosa rende e come si difende.

## Leggi prima

`docs/passi/04-ganci.md` (ganci `azione`, `fatto`, `giorno`, `ora`, `luogo`; `VEN.molt` con `rendita` e `vista`, `VEN.decidi`, `VEN.mappaDi`, `VEN.cult`); `rendite` e `renditaL` in `28kb`; `assedioStato` in `28kc`; le azioni `recluta`, `razzia` e `riposa` in `fai`.

## Decisioni

1. **Tutto in `28ko-ven-feudi.js`**, numeri in testa al file in `VDAT.EDIFICI={id:{nome,dove:[tipi],costo:[l1,l2,l3],giorni:[l1,l2,l3]}}`:
   | id | dove | costo | giorni | effetto per livello `n` |
   |---|---|---|---|---|
   | `mulino` | villaggio | 100/160/240 | 4/6/8 | rendita ×(1+0,15·n); +n grano al giorno nelle scorte |
   | `palizzata` | villaggio | 80/140/220 | 3/5/7 | guarnigione minima 3·n reclute della cultura del luogo, cioè `VEN.cult(s,f)` del regno di nascita `VEN.mappaDi(s).luoghi[l.id].faz` (+1 al giorno finché manca); la razzia dell'IA dura 2·n ore in più, la tua n ore in più |
   | `addestra` | villaggio | 120/200/300 | 5/7/9 | campo d'addestramento: dopo `recluta`, floor(reclute·n/3) passano da `_f1` a `_f2` |
   | `mura` | città, castello | 300/450/650 | 8/10/12 | l'assalto dell'IA arriva 12·n ore più tardi; la tua breccia 24·n ore più tardi |
   | `caserma` | città, castello | 250/380/560 | 6/8/10 | volontari `l.cas` +n a settimana (al più 4·n); azione `arruola` dà `<cult>_f<n+1>` al prezzo di `D.INGAGGIO` |
   | `mercato` | città, porto | 200/320/480 | 6/8/10 | mercato coperto: rendita ×(1+0,1·n); +n al giorno a ogni merce che il luogo produce |
   | `torre` | città, castello, porto | 150/240/360 | 5/7/9 | vista ×(1+0,15·n) entro 8 caselle dal luogo |
   | `cappella` | città, castello, villaggio | 90/150/230 | 4/6/8 | `riposa` nel luogo: morale +3·n (al più 100) e n feriti guariti |
2. **Stato** (facoltativo, assente = nessun edificio): `l.edif={id:livello}`, `l.cant={id,fino}` (un cantiere alla volta per luogo), `l.cas` (volontari della caserma).
3. **Dove**: un luogo è tuo se `(l.faz==='tu'&&l.sig<0)` oppure `l.sig===-2` (feudo da vassallo): gli stessi che ti danno la rendita in `rendite`. `VEN.mioLuogo(s,l)` (nuova) → booleano.
4. **Azioni** (gancio `azione`, dentro il luogo):
   - `{a:'costruisci',id}`: errori, in quest'ordine, «Qui non si costruisce» (mondo vecchio o tipo fuori da `dove`), «Non è un tuo luogo», «C'è già un cantiere», «Già al massimo», «Servono N monete». Paga `costo[n]` e mette `l.cant={id,fino:giorno+giorni[n]}`.
   - `{a:'arruola',n}`: solo con la caserma; errori «Non ci sono abbastanza volontari», «La compagnia è al completo», «Servono N monete».
5. **Cantiere** (gancio `giorno`): al giorno `fino` l'edificio sale di un livello, `l.cant` sparisce, diario «Il mulino di X è finito (livello 2)».
6. **Effetti**: `VEN.molt` composto per `rendita` (mulino × mercato) e `vista`; `VEN.decidi` composto per la palizzata (alla prima ora di una razzia su quel villaggio `ia.t+=120·n`, una volta); gancio `ora` per le mura (a un assedio nuovo sposta `l.ass.da`, o l'inizio di `s.assedio`, una volta); gancio `fatto` per `recluta`, `razzia` e `riposa`; gancio `giorno` per grano, merci, guarnigione e volontari.
7. **Danni** (gancio `luogo`, `'razzia'` e `'conquista'`): l'edificio di livello più alto scende di 1 (a pari livello il primo nell'ordine di `VDAT.EDIFICI`; a 0 sparisce) e il cantiere aperto si perde, monete comprese. Il luogo conquistato tiene gli edifici rimasti.

## Stato e contratti

`l.edif`, `l.cant`, `l.cas` facoltativi. `VEN.mioLuogo(s,l)` (nuova); `VEN.edifici(s,l)` (nuova) → `[{id,nome,n,puoi,costo,giorni,err}]` per la tessera «Cantiere» del passo 45; `VEN.cantiere(s,l)` (nuova) → `{id,nome,resta}` o `null`. Fuori scopo: la vista (passo 45), gli edifici dei signori dell'IA.

## Prove

`tests/test_ven_p41.js` (con `s.geo=2` impostato a mano):
- (a) villaggio tuo con prosperità 60: il mulino ai tre livelli costa 500 e porta la rendita settimanale da 150 a 1,45 volte (217 o 218, come arrotonda `rendite`): ritorno 500 / (67,5/7) ≈ 52 giorni, tra 40 e 60;
- (b) gli errori di `costruisci` nell'ordine; un secondo cantiere nello stesso luogo è rifiutato; (c) un cantiere di 4 giorni finisce al quarto giorno, non prima;
- (d) una razzia su un villaggio con mulino 2 e palizzata 1 lascia mulino 1 e palizzata 1; la conquista toglie il cantiere;
- (e) mura 2: l'assalto dell'IA arriva 24 ore dopo che senza; (f) cappella 3: un giorno di `riposa` dà 9 di morale in più;
- suoni: `costruisci` suona come le altre spese (`ven-moneta`), `arruola` come `recluta` (`ven-passi`), in `28n-ven-audio.js`;
- (g) mondo vecchio: «Qui non si costruisce»; i salvataggi di `tests/fixture/ven/` si aprono senza `edif`.

Impronta identica. `tests/test_ven_p41_lento.js`, semi 5, 11, 29 (il 3 è stato sostituito col 5: senza costruire, al seme 3 la compagnia si scioglie, 0 uomini, e il confronto delle paghe non ha senso), 120 giorni: al giorno 1 il bot di `bot_ven.js` giura a un regno e riceve un villaggio (`l.sig=-2`); con oro > costo + 400 costruisce mulino e poi palizzata. Attesi: almeno 2 livelli costruiti e giorni di paga mancata non più di quelli del bot che non costruisce, +1.

## Regole per il giocatore

Nei luoghi che sono tuoi (anche un feudo avuto dal sovrano) puoi far costruire, un cantiere alla volta: mulino, palizzata e campo d'addestramento nei villaggi; mura e caserma nelle città e nei castelli, il mercato coperto nelle città e nei porti; una torre di guardia (anche nei porti) dove si vede lontano; una cappella per il riposo. Ogni edificio ha tre livelli e costa di più a ogni livello: il prezzo e i giorni di lavoro si vedono prima di spendere.
Il mulino e il mercato fanno rendere di più il luogo; la palizzata tiene dei difensori e fa perdere tempo a chi razzia; le mura ritardano gli assedi; la caserma raccoglie volontari che si possono arruolare già scelti; il campo d'addestramento promuove una parte delle reclute; la cappella rinfranca la compagnia e cura i feriti quando riposa.
Se il luogo viene razziato o conquistato, l'edificio più alto perde un livello e il cantiere aperto va perduto, con le monete spese. Si costruisce solo nei mondi nuovi.

## Fatto quando

Prove verdi, impronta identica.
