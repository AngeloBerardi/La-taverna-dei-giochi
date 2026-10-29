# Piano Firebase (partite asincrone, monete e arredi)

Scelte dell'utente: **Firebase**, identità **anonima poi email**. Idee collegate: 3 (partite asincrone + notifiche), 4 (taverna personalizzabile), poi 2 (account, ELO).

## Stato
- Progetto Firebase creato dall'utente (`la-taverna-dei-giochi`); config nel codice (`FB.CFG` in `app/24a-firebase.js`: sono identificativi pubblici).
- **Fase B avviata:** accesso anonimo, profilo `players/{uid}`, monete a fine partita (10 per giocare, +15 per vincere), riga profilo nelle impostazioni, coda dei premi sul telefono se si è offline o il server rifiuta. Manca la **bottega** (catalogo e acquisti).
- **Coda dei premi:** un premio rifiutato non blocca più gli altri. Il limite di un premio ogni 50 s si riprova da solo dopo un minuto (e al ritorno sull'app); un premio rifiutato 4 volte senza un premio recente perde prima l'ELO e poi viene scartato, e il motivo finisce in `errori/` e accanto a «premi in attesa» nelle impostazioni (`FB.flush` in `app/24a-firebase.js`, scenario `firebase_coda_premi`).
- **Bottega fatta** (6 dorsi delle carte, prezzi verificati dalle regole). **Dopo ogni modifica ai prezzi:** `npm run regole` e ripubblica `firestore.rules` nella console.
- **Account, classifica ed ELO fatti** (fase E). Per l'accesso con email va attivato **Authentication → Metodo di accesso → Email/password** nella console; il dominio `la-taverna-dei-giochi.web.app` è già tra i **Domini autorizzati**. Ripubblica `firestore.rules` (ora limitano anche `elo` e non lasciano più cambiare `owned` con un premio).
- **Partite a distanza fatte** (fase D, senza notifiche push a app chiusa): collezione `partite` con regole proprie. Ripubblica `firestore.rules`. Per le notifiche a app chiusa serve un server: *Cloud Functions* (piano Blaze con carta) che reagisce al cambio di `turno` in `partite/{codice}` e invia FCM. I dati ci sono già (`turno`, `uids`); manca solo l'invio e la registrazione dei token FCM.
- Provato in Chromium con un SDK simulato (profilo, premio, coda, errore di accesso). **Non provato** con il vero Firebase né con l'emulatore delle regole (non scaricabile da qui): il primo giro vero è il sito su Firebase Hosting.

## Stanze live sul Realtime Database (ramo `feat/stanze-rtdb`)
Perché: le stanze p2p dipendono dal telefono che le ospita e da broker MQTT pubblici (vedi `docs/ARCHITECTURE.md`, «Rete»). Con il database non c'è un host: chi esce o va in background non ferma gli altri, la riconnessione la fa l'SDK.
- **Cosa deve fare l'utente (una volta):** console Firebase → **Build → Realtime Database → Crea database** → località **europe-west1 (Belgio)** → modalità **bloccata**. Poi scheda **Regole**: incolla `database.rules.json` e **Pubblica**. Se la località è diversa, copia l'indirizzo che compare in cima ai dati e mettilo in `RT.URL` (`app/24m-rete-rtdb.js`).
- **Provarlo:** apri il sito con `?net=rt` su due telefoni (i link «Copia invito» e dello schermo comune lo portano da soli). In Impostazioni deve comparire la stanza generale; se il database non risponde il gioco ripiega sul p2p come prima.
- **Predefinito dal 21/10/2026** (provato dal vivo dall'utente). `?net=p2p` torna ai vecchi trasporti, `?net=rt` lo forza.
- **Limiti del piano Spark:** 100 connessioni simultanee (per un gruppo di amici bastano), 1 GB di dati, traffico in uscita mensile limitato (circa 10 GB: controlla in console). Lo stato di una partita è un unico testo: ogni mossa lo rimanda a chi guarda la stanza. Se il traffico diventa un problema si può dividere lo stato in parti.
- **Pulizia:** le stanze non si cancellano da sole (`d/t` = ultimo salvataggio). Ci pensa `scripts/pulizia-stanze.js`, ogni lunedì in automatico (`.github/workflows/pulizia.yml`): vedi `docs/HOSTING.md`, «Pulizia delle stanze».
- **Provato dal vivo** dall'utente sul database vero (ottobre 2026): stanze, presenza e rientro funzionano. Lo stub (`npm run test:browser`, scenario `stanze_database`) resta per le prove automatiche.
- Informazioni nascoste: come nel p2p, lo stato contiene anche le mani degli altri (va bene tra amici).

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
- `players/{uid}/eroi/{e1..e5}`: eroi dell'account (razza, classe, punteggi, livello, xp, oro, equip, zaino, cintura). Regole: max 5, punteggi entro 27 punti, crescita limitata (+800 xp e +1000 oro a scrittura, 60 s tra due guadagni, campo `agg`), razza/classe immutabili, livello e XP solo in crescita, `equip`/`zaino`/`cintura` con id del catalogo (`AOGG`, generati da `npm run regole`), posti giusti, zaino da 16 e cintura da 3. `scelte` (poteri e talenti scelti salendo di livello, chiave = livello 2–10) accetta solo id di poteri/talenti dell'elenco generato e solo per livelli già raggiunti; **non può sapere quale delle due proposte** sia stata scelta (dipende dal seme di creazione): quel controllo è del client (`EROI.coerente`). Le regole non possono sapere da dove arriva un oggetto: la rarità non è protetta, come l'XP è solo limitato nel ritmo. **Ripubblica `firestore.rules`** dopo ogni modifica.
- `matches/{id}`: `game, opts, players[{uid,name,seat}], cur (uid di chi gioca), state (JSON del motore), rev, status ('active'|'done'), updatedAt, lastActor`
- `catalogo/{id}` (sola lettura, lo scrivo io): arredi e cosmetici con prezzo. Il catalogo vive anche nel codice, ma l'originale è qui.

## Regole di sicurezza (bozza)
- `players/{uid}`: lettura per tutti (nome e avatar servono agli altri); scrittura solo se `request.auth.uid == uid`; `coins` può salire al massimo di 30 per scrittura e non più spesso di una volta ogni 60 s (protezione leggera, **non** anti-truffa); gli acquisti sottraggono monete e aggiungono a `owned` nella stessa scrittura.
- `matches/{id}`: lettura solo se l'uid è in `players`; aggiornamento solo se `auth.uid == resource.data.cur`, `rev` aumenta di 1 e `players` non cambia; creazione solo con se stessi tra i giocatori.
- Il motore di regole gira sul telefono di chi gioca, come ora. Nessuno controlla che la mossa sia legale: va bene tra amici.

## Limiti da sapere
1. **Informazioni nascoste.** Con il motore sul telefono, lo stato salvato contiene anche le mani degli altri: chi sa leggere il database potrebbe sbirciare. Fase C parte con l'onestà tra amici. Per giochi con carte segrete serve far girare i motori (sono funzioni pure in node) su un server e tenere le mani in sottodocumenti leggibili solo dal proprietario.
2. **Notifiche.** Il browser riceve push solo se un server le invia a ogni cambio turno. Due strade: *Cloud Functions* (richiedono il piano a consumo **Blaze**, con carta di credito; con pochi utenti restano nel gratuito). Da decidere alla fase D.
3. **iPhone.** Le notifiche push web funzionano solo se l'app è installata sulla schermata Home (iOS 16.4 o successivo).
4. **Piano gratuito (Spark).** Ordine di grandezza: 50 000 letture, 20 000 scritture e 1 GB al giorno: più che sufficiente per un gruppo di amici.

## Cosa deve fare l'utente (console Firebase, ~10 minuti)
1. Su console.firebase.google.com: **Aggiungi progetto** → nome «la-taverna-dei-giochi» (Analytics: disattivalo).
2. **Build → Authentication → Inizia → Accesso anonimo → Abilita.**
3. **Build → Firestore Database → Crea database** → modalità **produzione** → località **europe-west8 (Milano)** (o europe-west1).
4. **Impostazioni progetto (ingranaggio) → Le tue app → Web (`</>`)** → nome «Taverna» (senza Hosting) → copia l'oggetto `firebaseConfig` e incollalo in chat. Non è un segreto: la sicurezza sta nelle regole.
5. **Authentication → Impostazioni → Domini autorizzati** → controlla che ci sia `la-taverna-dei-giochi.web.app`.
6. Solo per le notifiche, più avanti: **Impostazioni progetto → Cloud Messaging → Certificati push web → Genera coppia di chiavi** e incolla la chiave pubblica.
