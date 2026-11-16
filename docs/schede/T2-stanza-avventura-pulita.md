# T2 — Avventura in stanza: niente viste sovrapposte, zoom che non si blocca

**Scopo.** Se durante l'Avventura si vota un altro gioco, l'Avventura si chiude pulita e parte il gioco nuovo. Lo zoom della mappa non resta bloccato sugli altri telefoni.

**Leggi prima.** `app/24q-voto.js` (`proponi`, `tick`), `app/07b-partita.js` (`startGame`, `toLobby`), `app/24i-plancia.js` (`Plancia.chiudi`, `vis`), `app/24hw-ventura.js` (`gesti`, `dopo`, `esci`), `app/24hm-avv-stanza.js` (`alza`, specchio), `app/24he-battaglia.js` (`chiudiAvv`).

**Causa (verificata nel codice).**
- Sovrapposizione: le schermate dell'Avventura sono interruttori sparsi (`ui.avv/ven/camp/bat/dia/ses/inv/eroi`) più classi su `<html>` (`vn-on`, `bat-on`) e tele fuori da `#app` (`VenArte`, `Scena3D`). `startGame` cambia `G` ma non li spegne: Briscola si disegna sotto la mappa. In più `proponi('play')` è permesso anche a partita in corso.
- Zoom: in `gesti()` i diti vivono in `V.pt`, tolti solo da `pointerup/cancel`. Quando arriva una mossa di un altro telefono la vista si ridisegna e, se la tela viene rimontata o perde la cattura, il «su» non arriva: resta un dito fantasma, ogni tocco successivo è letto come pizzico a due dita e la visuale non risponde più.

**Decisioni già prese.**
1. Una sola porta d'uscita: `Avv.spegni()` (nuova, in `24ha-avventura.js`) = `Plancia.chiudi()` + `Ven` ferma e `VenArte.smonta()` + `Scena3D` parcheggiata + via `vn-on`/`bat-on` + `AvvStanza.sh=null`, `Ses.vista=null`, `Bat.foglio=null`. Non cancella i salvataggi.
2. `startGame` e `toLobby` chiamano `Avv.spegni()` quando il gioco che parte o finisce non è `avventura`/`ventura`; lo stesso fa `afterRender` come rete di sicurezza: se `ui.screen==='game'` e `G.g` non è dell'Avventura ma un interruttore è acceso, lo spegne.
3. A partita in corso (`R.doc.phase==='play'`) `proponi('play',…)` non parte: errore «C'è una partita in corso: prima proponete di interromperla.» Il passaggio resta: voto `stop` → Taverna → voto del gioco nuovo. (Scelta: niente cambio diretto, così nessuno perde un'Avventura per un «sì» distratto.)
4. Prima di lasciare un'Avventura in stanza si salva (`VenStanza.salva` / salvataggio di `AvvStanza`) dentro `Avv.spegni(true)`.
5. Zoom: `gesti()` aggiunge `lostpointercapture` come `pointercancel`; `V.pt` si svuota (`V.pt={};V.pin=0`) a ogni `VenArte.monta` su un host nuovo, a `visibilitychange` e quando passano 400 ms senza `pointermove` con due diti registrati; un `pointerdown` con più di 2 voci in `V.pt` azzera prima di registrare. Stessa pulizia in `BatMappa` (`_d0`, `_k0`).
6. La visuale (`K.alt`, `K.fuoco`) resta locale a ogni telefono: non entra mai nello stato di stanza (aggiungere il controllo al test).

**Passi.** 1) `24ha`: `Avv.spegni`. 2) `07b`: chiamate in `startGame`/`toLobby`. 3) `07f`: rete di sicurezza in `afterRender`. 4) `24q`: blocco della proposta. 5) `24hw`, `24hc`: pulizia dei diti.

**Prove.** Scenario browser nuovo `avventura_cambio_gioco` (due telefoni simulati): in stanza Avventura, B propone Briscola → messaggio d'errore; voto stop → Taverna; voto Briscola → in pagina non esistono `.vn-scena`, `.mo-svg`, `.bt-svg` e `<html>` non ha `vn-on`/`bat-on`. Zoom: `pointerdown`×2 senza `pointerup`, poi rimonta la tela → un trascinamento a un dito sposta `VenMappa.K.fuoco`. `npm test -- ven_ avv` verde.

**Fuori scopo.** Unificare gli interruttori `ui.*` in un'unica macchina a stati (scheda futura, dopo T4).

**Fatto quando.** Lo scenario passa; rifatto a mano il caso segnalato (entra un amico, propone Briscola, sì) non si sovrappone nulla.
