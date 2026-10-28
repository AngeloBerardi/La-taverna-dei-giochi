# App Android

L'app è una **Trusted Web Activity**: un guscio Android che apre il sito in Chrome a tutto schermo, senza barra dell'indirizzo. Gioco, accesso con Google, rete, schermo comune e aggiornamenti restano quelli del sito: ogni unione in main aggiorna anche l'app, senza reinstallarla. Serve Android 7 o successivo con Chrome installato (senza Chrome si apre in una scheda personalizzata del browser predefinito).

## Dove sta
- `android/`: progetto Gradle senza codice nostro (`app/build.gradle`, `AndroidManifest.xml`, icone generate da `src/pwa/icon-512.png`). Pacchetto `app.web.latavernadeigiochi`. Indirizzo d'avvio `https://la-taverna-dei-giochi.web.app/?app=android`.
- I link d'invito (`https://la-taverna-dei-giochi.web.app/?room=…`) si aprono direttamente nell'app.
- `src/pwa/assetlinks.json` (servito come `/.well-known/assetlinks.json` grazie alla riscrittura in `firebase.json`): dice a Chrome che l'app e il sito sono dello stesso proprietario. Finché il sito non lo pubblica, l'app mostra una sottile barra con l'indirizzo in alto.
- `.github/workflows/android.yml`: compila l'APK sui runner di GitHub (hanno l'SDK Android) a ogni modifica di `android/`, o a mano da Actions → «App Android» → Run workflow.

## Chiave di firma (una volta sola)
Ogni versione dell'app va firmata con **la stessa chiave**, altrimenti Android rifiuta l'aggiornamento; l'impronta SHA-256 della chiave è in `assetlinks.json`.
- File `taverna-android.jks` (PKCS12, alias `taverna`), una sola password per archivio e chiave. Tienilo in un posto sicuro (gestore di password, chiavetta): **non** va nel repo, che è pubblico.
- Su GitHub: Settings → Secrets and variables → Actions → New repository secret
  - `ANDROID_KEYSTORE` = il file in base64 (`base64 -w0 taverna-android.jks`, o il file `.base64.txt` già pronto)
  - `ANDROID_KEYSTORE_PASSWORD` = la password
- Con i segreti l'APK esce firmato e, a ogni unione in main, va nella release **android** con un link fisso da mandare agli amici:
  `https://github.com/AngeloBerardi/La-taverna-dei-giochi/releases/download/android/taverna.apk`
- Senza i segreti l'APK esce non firmato nella pre-release `android-non-firmato`; si firma con `KS_PASS=… python3 tools/android/firma-apk.py taverna.apk firmato.apk taverna-android.jks` (firma v2, serve `pip install cryptography`).

## Installare
Link per gli amici: **https://la-taverna-dei-giochi.web.app/taverna.apk** (il file è `src/pwa/taverna.apk` nel repo, pubblicato con il sito) oppure la release `android` su GitHub.
Quando cambia `android/` (nome, icona, colori), copia in `src/pwa/taverna.apk` l'APK firmato della release `android`. Le modifiche al gioco non richiedono un APK nuovo: l'app apre sempre il sito aggiornato.

Sul telefono apri il link dell'APK, consenti a Chrome di «installare app sconosciute» quando lo chiede, poi Installa. Play Protect può avvisare che l'app non viene dal Play Store: «Installa comunque».

## Chromecast
Nell'app il pulsante «Trasmetti» funziona come in Chrome: compare quando l'app Google Cast è registrata e `CAST_APP_ID` è impostato (`docs/CAST.md`). Un invio nativo (SDK Cast di Android) richiederebbe un'app vera in Kotlin, non un guscio.

## Play Store (se un giorno)
Stesso progetto: `gradle -p android bundleRelease` dà l'AAB; account sviluppatore Google (25 USD una tantum). Con la firma gestita da Google va aggiunta in `assetlinks.json` anche l'impronta della chiave di Play.
