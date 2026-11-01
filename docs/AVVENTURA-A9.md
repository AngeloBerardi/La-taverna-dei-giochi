# A9 — Orchestratore, vite, salvataggi, rientro sull'account

Piano e contratti di `AVV` (`motori/28a-avv-orchestratore.js`), `ARIE` (`motori/28b-avv-rientro.js`) e del ponte in `CAMP` (`28-campagna.js`). Stato: **fatta** (31 ottobre 2026, ramo `feat/avventura-a9`, sopra A8-III).

I numeri dei file seguono la serie 28 (ordine di caricamento) e non il `45-avventura.js` del piano originale. Tutto è motore puro: JSON in ingresso e in uscita, dadi solo dallo stato (`s.rng`), niente `Math.random`.

## 1. Chi fa che cosa

| Pezzo | Compito |
|---|---|
| `CAMP` (28) | il mondo, gli eroi, i giri, i servizi. Nuovo **ponte**: `eroeNuovo`, `ponte(s, effetto)` (oro, oggetti, PF, perdizione, XP, razioni, sposta), `livelli` (salita di livello in sessione), `risveglio` (dopo una sconfitta) |
| `ARAC` (27q) | il racconto: scene, scelte, prove. Non conosce `CAMP`: gli effetti sul mondo escono come `fuori` |
| `ASCO` (27i) | la battaglia; `daCampagna`/`aggiorna` la legano agli eroi |
| **`AVV`** | **stato unico** della sessione: tiene `camp`, `racc` e la battaglia in corso, applica i `fuori`, decide la **fase**, conta le **vite**, chiude la sessione |
| **`ARIE`** | il **rientro sull'account**: quanto è maturato, a tappe che le regole accettano |

## 2. Stato di `AVV` (v1)

```
{ v:1, g:'avventura', cap:'corona', seme, evn,
  camp:  <stato CAMP v3>,           // il mondo e gli eroi (compagni compresi)
  racc:  <stato ARAC>,              // bandiere, approvazioni, scena in corso, missioni
  bat:   null | { nemici:[id], ambiente, seme, sorpresa, quali:[indici], dist:{}, scena:true },   // battaglia chiesta dal racconto (quelle del mondo stanno in camp.sfida)
  vite, viteMax, ultimaCitta,       // id del luogo dove ci si risveglia
  fase,                             // 'mappa' | 'citta' | 'dialogo' | 'battaglia' | 'sotterraneo' | 'fine' (si ricalcola dopo ogni azione)
  strada: { usati:[id eventi] },    // eventi di strada già visti
  conto:  { iniziale:{slot:{xp,liv}}, oroIniziale, accreditato:{slot:{xp,oro}} },   // per il rientro
  sessione: { xp, oro, battaglie, sconfitte },   // contatori della sessione in corso (per il riepilogo)
  fine:   null | { esito, vinta, titolo, righe },
  log:[] }
```

La **fase** è derivata, non scelta: `fine` se c'è `fine`; `battaglia` se c'è `bat` o `camp.sfida`; `dialogo` se `racc.scena`; `sotterraneo` se `camp.dentro`; `citta` se il gruppo è unito in una città o in un villaggio; altrimenti `mappa`. `act` restituisce `cambio: {da, a}` quando la fase cambia: è il momento del **salvataggio automatico**.

## 3. Azioni (`AVV.act(s, a, cap)` → `{ s, cambio?, righe? } | { err }`)

| Azione | Effetto |
|---|---|
| `{t:'camp', a}` | un'azione di `CAMP.act` (tira, muovi, riposi, servizi, zaino…). `entra` è rifiutata dove la storia ha scene (cripta, torre): lì si apre la scena. Dopo un movimento in terra aperta può uscire un **evento di strada** |
| `{t:'scena', id}` | avvia una scena offerta nel luogo (`ARAC.disponibili`); il gruppo deve essere unito sul posto |
| `{t:'parla', id}` | parla con un compagno nel gruppo (`ACMP.parla`: la sua missione personale se è disponibile) |
| `{t:'racconto', a}` | `a` = `{t:'scegli', i}` o `{t:'continua'}` di `ARAC.act`; applica i `fuori` |
| `{t:'esito', riep}` | il risultato di una battaglia (del mondo o del racconto) |
| `{t:'compagnia', id, azione}` | in una città: `entra` (se c'è un posto) o `attende` per un compagno già reclutato |
| `{t:'chiudi'}` | fine sessione (solo da `mappa` o `citta`): il racconto passa al cantare successivo, i contatori si azzerano |

Lo scioglimento dei `fuori` sta in `AVV` (un `switch` solo): `oro`, `oggetto`, `pf`, `perdizione`, `xp`, `razioni`, `sposta`, `apri`, `compagno` passano per il ponte di `CAMP`; `battaglia` apre `bat` e **sospende il racconto sul nodo successivo**: finita la battaglia la scena riprende da lì.

### Battaglia del racconto
- `f.fam` o `f.capo` (un id del bestiario → famiglia del capo) con `diff`; livello = media del gruppo, numero = eroi in piedi (max 4); `arena` e `sorpresa` come scritto nel nodo. Il seme viene dal dado di `camp`.
- **Vittoria**: la scena riprende. **Sconfitta**: una vita in meno e risveglio (§4); la scena è interrotta (le bandiere già messe restano, si può rifare dal luogo). **Fuga o stallo**: scena interrotta, nessuna vita persa, perdizione +1.

## 4. Vite di gruppo
- `PARAM.vite = 3` (da confermare in A13).
- **Sconfitta** = esito `sconfitta` in battaglia, oppure caduta di tutti gli eroi per altra causa (trappola, ritirata coperta…). Perdizione 100 **non** è una sconfitta recuperabile: chiude la campagna.
- Si perde una vita; la compagnia **si risveglia nell'ultima città** visitata (`ultimaCitta`, all'inizio la partenza), tutti a metà PF (almeno 1, anche i caduti), **metà dell'oro comune perso**, **perdizione +10**, sfida/incontro/evento/sotterraneo azzerati.
- A **zero vite** la campagna è persa (`fine.vinta=false`): gli eroi dell'account restano come sono, e l'esperienza maturata fin lì **torna comunque** (ma niente monete in premio né compagni sbloccati).

## 5. Salvataggio
- `AVV.salva(s)` → `{v:1, cap, fase, vite, sessioni, eroi:[nomi, livelli], titolo, dati:"<json>"}` piccolo; `AVV.apri(dati)` rilegge e **migra** (`AVV.migra`, `CAMP.migra` dentro).
- **Locale** (`localStorage`, chiave `avv-a1..a3`) a ogni azione; **Firestore** (`players/{uid}/avventure/a1..a3`) a ogni cambio di fase, a fine sessione e all'uscita, al massimo una volta ogni 12 s (le regole chiedono 10 s tra due aggiornamenti: se si scrive prima, resta in attesa solo l'ultimo stato). Le regole accettano solo il proprietario, id `a1..a3`, campi noti, `cap` invariato e `dati` ≤ 900 000 caratteri. All'apertura vale il salvataggio più recente (per `evn`) tra telefono e profilo.
- Una battaglia **in corso** non si salva dentro `AVV` (l'avversario è deterministico): alla ripresa riparte dall'inizio, con lo stesso seme. Su questo telefono `Bat` conserva comunque la sua copia e la riprende.

## 6. Rientro sull'account (`ARIE`)
Gli eroi dell'account sono **prestati** alla campagna: all'inizio `conto.iniziale` ricorda XP e livello, `conto.oroIniziale` la somma dell'oro; `conto.accreditato[slot]` quanto è già tornato.
- **XP** maturata = XP dell'eroe in campagna − iniziale − accreditata. **Oro** = (oro comune − iniziale), diviso in parti uguali tra gli eroi dell'account (il resto al primo), meno quanto già accreditato; può essere negativo (si è speso).
- **Oggetti**: la scheda dell'account riceve `equip`, `zaino`, `cintura` e `scelte` come sono in campagna; PF = massimi.
- **Tappe**: le regole accettano al massimo `EROI.LIMITI.xp` (800) di esperienza e `EROI.LIMITI.oro` (1000) di oro a scrittura, con 60 s dall'ultimo guadagno. `ARIE.tappa(pendente)` dà la prossima parte; `FB.rientro` scrive eroe e `accreditato` insieme (`writeBatch`), così un'interruzione non accredita due volte. Il resto si riscuote alla scrittura successiva (a fine sessione la vista mostra «Riscossione 1/2»).
- I **compagni** (`compagno:id`) non toccano mai l'account.
- **Fine campagna vinta**: riepilogo, compagni sbloccati (`cap.compagni` incontrati e non andati via), **30 monete** della Taverna (il massimo che le regole concedono per scrittura).

## 7. Viste
- `app/24hj-sessione.js` (`Ses`): tiene `Ses.a` (lo stato di `AVV`), lo salva, legge e scrive Firestore; `Camp.fai`, `Camp.fineBattaglia` e `Dia` passano da lì quando una sessione è attiva.
- Pagina **Avventura**: tre posti `a1..a3` (nuova campagna con scelta degli eroi, continua, elimina con conferma); la vecchia campagna senza storia resta più sotto come «Campagna libera».
- Mappa (`Camp`): **vite** (cuori) nella barra in alto; il foglio del luogo si apre da solo, dopo un arrivo, una scena o una battaglia, se la storia ha scene da giocare (`Ses.luogoH`: scene, compagni che aspettano o che vogliono parlare); il diario mostra missioni e appunti del capitolo, perdizione, vite e «Concludi la sessione».
- Dialogo (`Dia.fonte`): in sessione legge `Ses.a.racc`; se la scena apre una battaglia il bottone è «All'armi!» e poi riprende.
- Fogli sopra la mappa (`.modal.se-modal`, più alti della mappa): **risveglio** dopo una sconfitta, **apertura** del cantare, **fine sessione** (riepilogo del Locandiere e rientro sull'account a tappe con attesa dei 60 s), **fine del capitolo** (compagni sbloccati, premio). Uscire a metà salva e riprende dallo stesso punto.
- Scenario browser `avv_sessione` (45 controlli): tre posti, scelta degli eroi, prologo, foglio del luogo con le scene, Gherardo si unisce, salvataggio e ripresa dopo un ricarico, sconfitta e risveglio, fine sessione, rientro sull'account, elimina. Il simulatore Firestore ha ora `writeBatch`.

## 8. Fuori da A9
- Missioni generate (`AEVE.missione`) e musica/regole del racconto: A10.
- TV e telefoni (la compagnia in due luoghi), 3D: A11, A12.
- Numero di vite, prezzi, bilanciamento a campagna intera: A13.

## 9. Test
- `tests/test_avv_orchestratore.js`: nuova campagna e prologo, fasi, ogni `fuori`, battaglia del racconto (vittoria, sconfitta, fuga), vite e risveglio, zero vite, compagni (entra, attende, esce, cambio in città), evento di strada, salvataggio e migrazione, determinismo (stesso seme e stesse scelte = stessa partita), nessun `Math.random`.
- `tests/test_avv_rientro.js`: delta di XP e oro, divisione dell'oro, tappe sotto i limiti, nessun doppio accredito, compagni esclusi.
- Partita intera con il bot (corona.json, tre finali) in `test_avv_orchestratore` se i tempi lo permettono, altrimenti in A13.
