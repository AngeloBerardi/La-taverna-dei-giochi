---
passo: 44
titolo: Gli incontri del crocevia (motore)
fase: 11
area: mondo
dopo: [42]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte
file:
  - src/js/motori/28kq-ven-crocevia.js
---

# Passo 44 — Gli incontri del crocevia (motore)

**In breve.** Ai crocevia e nei luoghi selvaggi capitano piccoli fatti a scelte: è il nome del gioco che diventa gioco.

**Acceso da.** I mondi nuovi (`s.geo===2`): nei mondi vecchi gli ascoltatori non fanno nulla, quindi l'impronta non cambia.

## Scopo

La strada tra due luoghi non è vuota: ai crocevia e nei luoghi selvaggi capitano piccoli fatti a scelte (un pellegrino ferito, un ponte crollato, un disertore che chiede di unirsi, un mercante che offre un affare sospetto, un villaggio che brucia). È il nome del gioco che diventa gioco.

## Leggi prima

`docs/passi/42-testi-crocevia.md` (formato di `VVOC.CROCEVIA`, condizioni ed effetti); `docs/passi/04-ganci.md` (ganci `vedi` ed `effetto`, `VEN._` con `rnd`, `aggiungi`, `togliUomini`, `inCompagnia`); `VEN.accoda`, `VEN.reagisci`, `VEN.limite`, `VEN.caricoMax`, `VEN.carico`, `VEN.cella`, `VEN.lato`, `VEN.nemiche`, `VEN.inGuerra`.

## Decisioni

1. **Tutto in `28kq-ven-crocevia.js`**, numeri in testa: `VDAT.CROCEVIA={OGNI:2,PROB:.25,MEMORIA:30,LONTANO:6,VICINI:3}`.
2. **Stato** (facoltativo): `s.croc={ult,visti:{id:giorno}}` (`ult` = `s.t` dell'ultima scena).
3. **Quando** (gancio `vedi`, ogni ora): solo se chi gioca cammina (`TU(s).via.length>0`), fuori dai luoghi, senza incontro né scena aperta, non prigioniero, e sono passati almeno `OGNI` giorni da `ult`. La casella `i=VEN.cella(M,x,y)` vale se è un **incrocio** (`M.S[i]` e almeno `VICINI` delle 8 caselle intorno con `M.S`) oppure **selvaggia** (`M.T[i]` 2 o 4, a `LONTANO` caselle o più da ogni luogo). Poi un tiro di `rnd` contro `PROB`. `M` è `VEN.mappaDi(s)`.
4. **Quale**: tra le voci di `VVOC.CROCEVIA` con tutte le condizioni vere e non viste negli ultimi `MEMORIA` giorni, una a caso pesata con `peso` (stesso `rnd`). Condizioni: `bioma` (`strada` se incrocio, altrimenti `bosco`/`monte` dalla casella); il **regno della casella** è la `faz` del luogo murato (`VEN.MURA`) più vicino: `tuo` se è `VEN.lato(s)` o `'tu'`, `nemico` se `VEN.nemiche(s,VEN.lato(s),faz)`, altrimenti `amico`; `guerra` se quel regno è in guerra con qualcuno; `notte` da `VEN.notte`; `fama` su `s.fama`; `con` dagli id di `inCompagnia`. Scelta fatta: `VEN.accoda(s,id)`, `s.croc.ult=s.t`, `visti[id]=giorno`. Nessuna candidata: niente, e si riprova l'ora dopo.
5. **Effetti** (gancio `effetto`; i nomi sono già in `VEN.EFF_VOCI`):
   - `uomini` n>0: n reclute `<cult>_f1` della cultura del regno della casella (`VEN.cult`), solo fino a `VEN.limite(s)`; n<0: si tolgono uomini dal grado più basso, mai compagni;
   - `merce`: `tu.merci[m]` ± n, mai sotto 0, e non oltre `VEN.caricoMax(s)` (il resto si perde);
   - `viveri`: grano ± n, mai sotto 0;
   - `gusto`: `VEN.reagisci(s,ev)`: chi ama o detesta il gesto lo dice con la riga del diario che il nucleo già scrive.
   Ogni effetto con monete, uomini o merci scrive anche una riga breve nel diario («+3 reclute», «−4 grano»).
6. **Compagnia e TV**: niente di nuovo. Le scene passano dalla coda delle voci, a cui risponde chiunque e che la TV mostra già in grande.

## Stato e contratti

`s.croc` facoltativo. `VEN.croceviaQui(s)` (nuova) → `'incrocio'|'selvaggio'|null` per la casella di chi gioca (la usano i test e, se vuole, la vista).

## Prove

- `tests/test_ven_p44.js`:
  - (a) le quattro condizioni di casella: un incrocio vero, una strada senza incrocio (no), un bosco lontano, un bosco a 3 caselle da un villaggio (no);
  - (b) condizioni di scena: con `notte:true` di giorno nessuna; con `con:['co_lapo']` solo se Lapo è in compagnia; `regno:'nemico'` solo in terra nemica;
  - (c) effetti: `uomini` +3 aggiunge 3 reclute, oltre il limite meno; `viveri` −8 con 5 grano lascia 0; `merce` oltre il carico si ferma a `caricoMax`; `gusto` `cura` con Lapo in compagnia: gradimento +6 e una riga «approva»;
  - (d) due scene non arrivano a meno di 2 giorni l'una dall'altra;
  - (e) mondo vecchio: dopo 30 giorni di bot `s.croc` non esiste; i salvataggi di `tests/fixture/ven/` si aprono.
- Impronta identica.
- `tests/test_ven_p44_lento.js`: semi 3, 11, 29 in un mondo nuovo (`VEN.nuovo(seme,{opz:{geo:2}})`), 60 giorni col bot di `bot_ven.js` (risponde da sé alle scene): da 20 a 30 scene viste per seme, nessuna ripetuta entro 30 giorni. Se il numero non torna si ritocca solo `PROB`.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fatto quando

Prove verdi, impronta identica.
