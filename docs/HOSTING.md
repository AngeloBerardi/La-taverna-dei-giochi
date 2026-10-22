# Hosting: Firebase Hosting (piano Spark, gratuito)

Il sito è statico (`dist/`). Indirizzi: `https://la-taverna-dei-giochi.web.app` e `.firebaseapp.com` (già autorizzati per l'accesso Firebase).
Limiti Spark: 10 GB di file, ~360 MB/giorno di traffico. Il service worker tiene le librerie in cache, quindi dopo la prima visita il traffico è minimo.

## Una volta sola
1. Console Firebase → Hosting → «Inizia» (crea il sito).
2. Segreto per la pubblicazione automatica: Impostazioni progetto → Account di servizio → «Genera nuova chiave privata»; su GitHub, Settings → Secrets → Actions → `FIREBASE_SERVICE_ACCOUNT` = contenuto del file JSON.
   (In alternativa, da un computer: `npx firebase-tools init hosting:github` fa tutto da solo.)
3. Unisci questo ramo in main: da quel momento ogni unione pubblica il sito.

## A mano (senza GitHub Actions)
`node scripts/check.js && npx firebase-tools deploy --only hosting,firestore:rules,database`

A ogni unione in main la pubblicazione automatica (`.github/workflows/pubblica.yml`) esegue prima `npm run verifica`, poi pubblica le regole (database e Firestore), poi il sito. Se l account di servizio non ha il permesso «Firebase Rules Admin» il passo delle regole dà solo un avviso: pubblicale a mano. Ogni ramo e ogni richiesta di unione sono controllati da `verifica.yml`.

## Cosa non c'è
Il locandiere risponde con i copioni scritti: risposte libere con Claude richiederebbero Cloud Functions (piano Blaze).

## Accesso con Google
Nel gioco: Impostazioni › Account › «Continua con Google» (`FB.google()` in `app/24a-firebase.js`: `linkWithPopup`, o `signInWithCredential` se quel Google ha già un profilo).
Da attivare una volta nella console Firebase: **Authentication › Metodo di accesso › Google › Abilita** (email di assistenza del progetto) e controllare che il dominio `la-taverna-dei-giochi.web.app` sia in **Impostazioni › Domini autorizzati**.
Nessun dato di Google (nome, email, foto) viene scritto in Firestore né nel profilo del gioco: l'account resta in Firebase Authentication, che serve a riconoscere la persona.

## App Check e controllo errori
- **Errori:** `ERR` (app/01-base.js) annota gli errori in locale e, con la rete pronta, nel nodo `errori/` del Realtime Database (al massimo 10 per sessione, uno ogni 5 s). Si leggono dalla console Firebase.
- **App Check (da fare nella console):** App Check › registra l'app web con reCAPTCHA v3, copia la chiave pubblica in `FB.AC_KEY` (app/24a-firebase.js), controlla per qualche giorno che le richieste risultino verificate e solo poi attiva «Imponi» per Realtime Database e Firestore. Con `AC_KEY` vuota App Check resta spento.
- **Regole sull'emulatore vero:** `npm run test:emulatore` (serve rete e Java; in CI è il job `emulatore`, non bloccante).
