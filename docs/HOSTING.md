# Hosting: Firebase Hosting (piano Spark, gratuito)

Il sito è statico (`dist/`). Indirizzi: `https://la-taverna-dei-giochi.web.app` e `.firebaseapp.com` (già autorizzati per l'accesso Firebase).
Limiti Spark: 10 GB di file, ~360 MB/giorno di traffico. Il service worker tiene le librerie in cache, quindi dopo la prima visita il traffico è minimo.

## Una volta sola
1. Console Firebase → Hosting → «Inizia» (crea il sito).
2. Segreto per la pubblicazione automatica: Impostazioni progetto → Account di servizio → «Genera nuova chiave privata»; su GitHub, Settings → Secrets → Actions → `FIREBASE_SERVICE_ACCOUNT` = contenuto del file JSON.
   (In alternativa, da un computer: `npx firebase-tools init hosting:github` fa tutto da solo.)
3. Unisci questo ramo in main: da quel momento ogni unione pubblica il sito.

## A mano (senza GitHub Actions)
`node scripts/check.js && npx firebase-tools deploy --only hosting`

## Cosa non c'è
`netlify/functions/locandiere.js` (risposte libere del locandiere con Claude) non gira su Hosting: servirebbero Cloud Functions (piano Blaze). Il locandiere usa i copioni scritti.
`netlify.toml` resta nel repo ma non serve più.

## Accesso con Google
Nel gioco: Impostazioni › Account › «Continua con Google» (`FB.google()` in `app/24a-firebase.js`: `linkWithPopup`, o `signInWithCredential` se quel Google ha già un profilo).
Da attivare una volta nella console Firebase: **Authentication › Metodo di accesso › Google › Abilita** (email di assistenza del progetto) e controllare che il dominio `la-taverna-dei-giochi.web.app` sia in **Impostazioni › Domini autorizzati**.
Nessun dato di Google (nome, email, foto) viene scritto in Firestore né nel profilo del gioco: l'account resta in Firebase Authentication, che serve a riconoscere la persona.
