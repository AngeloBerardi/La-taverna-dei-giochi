# Piano Firebase (partite asincrone, monete e arredi)

Scelte dell'utente: **Firebase**, identità **anonima poi email**. Idee collegate: 3 (partite asincrone + notifiche), 4 (taverna personalizzabile), poi 2 (account, ELO).

## Stato
- Progetto Firebase creato dall'utente (`la-taverna-dei-giochi`); config nel codice (`FB.CFG` in `app/24a-firebase.js`: sono identificativi pubblici).
- **Fase B avviata:** accesso anonimo, profilo `players/{uid}`, monete a fine partita (10 per giocare, +15 per vincere), riga profilo nelle impostazioni, coda dei premi sul telefono se si è offline o il server rifiuta. Manca la **bottega** (catalogo e acquisti).
- Provato in Chromium con un SDK simulato (profilo, premio, coda, errore di accesso). **Non provato** con il vero Firebase né con l'emulatore delle regole (non scaricabile da qui): il primo giro vero è l'anteprima Netlify.

## Pubblicare le regole (una volta, e a ogni modifica di `firestore.rules`)
1. Console Firebase → **Build → Firestore Database → scheda Regole**.
2. Cancella tutto, incolla il contenuto di `firestore.rules` e tocca **Pubblica**: la console segnala eventuali errori di sintassi.
3. Facoltativo: nel **Simulatore regole** prova una lettura di `players/qualsiasi` con un utente autenticato (deve passare) e una scrittura non autenticata (deve fallire).

## Fasi
| Fase | Cosa | Serve |
|---|---|---|
| A | PWA installabile, offline, aggiornamento (**fatta**, ramo `feat/pwa`) | niente |
| B | Profilo anonimo, monete, arredi/cosmetici (idea 4) | Auth anonima + Firestore |
| C | «Le mie partite» a turni, in giorni diversi (idea 3) | Firestore |
| D | Notifiche «tocca a te» | FCM + un server che le invia (vedi sotto) |
| E | Email per non perdere il profilo (collegamento dell'account anonimo) | Auth email |

L'SDK Firebase (modulare, dal CDN gstatic) si carica **solo quando serve** (`import()` dinamico dopo il nome): la pagina resta leggera per chi gioca solo in locale. Un solo file `app/26-firebase.js` incapsula tutto (`FB.init()`, `FB.user`, `FB.profile`, `FB.match…`) così il resto dell'app non dipende da Firebase.

## Dati (Firestore)
- `players/{uid}`: `name, av (avatar), coins, owned {furniture[], cloaks[], backs[], tracks[]}, equipped {…}, fcm[], createdAt, lastAward`
- `matches/{id}`: `game, opts, players[{uid,name,seat}], cur (uid di chi gioca), state (JSON del motore), rev, status ('active'|'done'), updatedAt, lastActor`
- `catalogo/{id}` (sola lettura, lo scrivo io): arredi e cosmetici con prezzo. Il catalogo vive anche nel codice, ma l'originale è qui.

## Regole di sicurezza (bozza)
- `players/{uid}`: lettura per tutti (nome e avatar servono agli altri); scrittura solo se `request.auth.uid == uid`; `coins` può salire al massimo di 30 per scrittura e non più spesso di una volta ogni 60 s (protezione leggera, **non** anti-truffa); gli acquisti sottraggono monete e aggiungono a `owned` nella stessa scrittura.
- `matches/{id}`: lettura solo se l'uid è in `players`; aggiornamento solo se `auth.uid == resource.data.cur`, `rev` aumenta di 1 e `players` non cambia; creazione solo con se stessi tra i giocatori.
- Il motore di regole gira sul telefono di chi gioca, come ora. Nessuno controlla che la mossa sia legale: va bene tra amici.

## Limiti da sapere
1. **Informazioni nascoste.** Con il motore sul telefono, lo stato salvato contiene anche le mani degli altri: chi sa leggere il database potrebbe sbirciare. Fase C parte con l'onestà tra amici. Per giochi con carte segrete serve far girare i motori (sono funzioni pure in node) su un server e tenere le mani in sottodocumenti leggibili solo dal proprietario.
2. **Notifiche.** Il browser riceve push solo se un server le invia a ogni cambio turno. Due strade: *Cloud Functions* (richiedono il piano a consumo **Blaze**, con carta di credito; con pochi utenti restano nel gratuito) oppure una *Netlify Function* con `firebase-admin` (nessun piano a pagamento, ma l'invio parte dal telefono di chi ha giocato: ok tra amici). Da decidere alla fase D.
3. **iPhone.** Le notifiche push web funzionano solo se l'app è installata sulla schermata Home (iOS 16.4 o successivo).
4. **Piano gratuito (Spark).** Ordine di grandezza: 50 000 letture, 20 000 scritture e 1 GB al giorno: più che sufficiente per un gruppo di amici.

## Cosa deve fare l'utente (console Firebase, ~10 minuti)
1. Su console.firebase.google.com: **Aggiungi progetto** → nome «la-taverna-dei-giochi» (Analytics: disattivalo).
2. **Build → Authentication → Inizia → Accesso anonimo → Abilita.**
3. **Build → Firestore Database → Crea database** → modalità **produzione** → località **europe-west8 (Milano)** (o europe-west1).
4. **Impostazioni progetto (ingranaggio) → Le tue app → Web (`</>`)** → nome «Taverna» (senza Hosting) → copia l'oggetto `firebaseConfig` e incollalo in chat. Non è un segreto: la sicurezza sta nelle regole.
5. **Authentication → Impostazioni → Domini autorizzati** → aggiungi `latavernadeigiochi.netlify.app` (e i domini delle anteprime Netlify che userai).
6. Solo per le notifiche, più avanti: **Impostazioni progetto → Cloud Messaging → Certificati push web → Genera coppia di chiavi** e incolla la chiave pubblica.
