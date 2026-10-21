# Chromecast (Google Cast)

Perché serve: su PC Chrome ha «Trasmetti scheda» e duplica la scheda sul Chromecast (la pagina gira sul PC). Su Android Chrome questa funzione non esiste: un sito può usare il Chromecast solo come app Google Cast registrata. Con il ricevitore, il Chromecast apre da solo lo schermo comune e i telefoni restano i comandi.

## Come funziona
- `src/pwa/receiver.html` (→ `/receiver.html`): pagina che gira sul Chromecast. Riceve `{code, b}` sul canale `urn:x-cast:app.web.latavernadeigiochi` e apre a tutto schermo `/?tv=CODICE[&b=N]`.
- `TV.cast()` in `src/js/app/24f-schermo.js`: carica l'SDK sender, `requestSession()` (selettore dei dispositivi), manda il codice della stanza. «Interrompi la trasmissione» = `TV.castStop()`.
- Il pulsante compare nel pannello «Schermo comune» solo se: https, Chrome (non Samsung/Opera/Edge/Firefox), ID app impostato.
- Prova da browser senza Cast: `/receiver.html?tv=CODICE`.

## Registrazione (una volta sola)
1. https://cast.google.com/publish → account Google, quota una tantum (~5 USD).
2. «Add new application» → **Custom Receiver**: URL `https://la-taverna-dei-giochi.web.app/receiver.html`.
3. «Add new device»: numero di serie del Chromecast (sul dispositivo o in Google Home); riavvialo. L'attivazione richiede fino a ~15 minuti.
4. Copia l'**Application ID** (6-8 caratteri esadecimali).
5. Impostalo in `CAST_APP_ID` (`24f-schermo.js`), oppure per provare subito apri una volta sul telefono `https://la-taverna-dei-giochi.web.app/?castid=ID` (resta salvato su quel telefono).

Finché l'app non è pubblicata (Publish nella console) funziona solo sui Chromecast registrati come dispositivi di prova.
