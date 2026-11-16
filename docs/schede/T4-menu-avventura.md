# T4 — Nuovo menù dell'Avventura

**Scopo.** Una pagina Avventura che si capisce in tre secondi: «Continua» in cima, poi le due avventure come due grandi insegne, il resto dietro una riga di schede.

**Leggi prima.** `app/24ha-avventura.js` (`Avv.html`, `cartaCont`, `eroiElenco`, `act`), `app/24hj-sessione.js` (elenco dei posti), `app/24hx-ven-stanza.js` (`ripH`), `app/24hl-tutorial.js` (`pagH`), `docs/STYLE.md`.

**Oggi.** Una colonna lunga: Campagna libera, I tuoi eroi, Compagni, Come si gioca, più battaglia di prova e racconto, tutti allo stesso livello. Due giochi dal nome quasi uguale. Con la stanza aperta non si capisce se si gioca da soli o insieme.

**Decisioni già prese.**
1. Struttura fissa, dall'alto:
   - **Fascia «Riprendi»** (solo se c'è qualcosa in corso): una carta larga con capitolo o giorno, eroi, ultimo salvataggio, pulsante primario «Continua». Al massimo una; le altre partite stanno nella scheda Partite.
   - **Due insegne** affiancate (a 390 px impilate, 120 px l'una), con illustrazione dipinta e una riga: «La campagna a capitoli» (storia, eroi, scelte a voto) e «La compagnia di ventura» (mondo libero, truppe, battaglie). Tocco = foglio del gioco.
   - **Schede**: `Partite` · `Eroi` · `Guida`. Un solo contenuto visibile per volta (`Avv.tab`).
2. Foglio del gioco (dal basso, come gli altri fogli): «Nuova partita», «Carica», e l'interruttore **Da solo / Con la stanza** (il secondo attivo solo se `R.on`; mostra i nomi di chi è in stanza). «Con la stanza» passa da `startGame` come oggi.
3. `Partite`: elenco unico dei salvataggi dei due giochi (locali, online, co-op, «precedente»), ognuno con Continua ed Elimina (con conferma).
4. `Eroi`: l'elenco di `eroiElenco` e «Nuovo eroe». `Guida`: `AvvTut.pagH()`, regole, e in fondo «Prove» (battaglia di prova, racconto di prova) chiuse in un `<details>`.
5. Un solo pulsante primario dorato per schermata; gli altri di secondo livello (regola dei tre livelli di `docs/STYLE.md`).
6. Altezze riservate mentre i dati arrivano (scheletro di T1): la pagina non salta.

**Stato e contratti.** `Avv.tab` ∈ `partite|eroi|guida` (predefinita: `partite` se ci sono salvataggi, altrimenti `guida`), `Avv.foglio` ∈ `null|campagna|ventura`, `Avv.modo` ∈ `solo|stanza`. Azioni nuove nello `switch` di `07c-comandi.js`: `avvtab`, `avvfoglio`, `avvmodo`. `Avv.partite()` (nuova) → `[{gioco,posto,titolo,quando,coop}]`, unisce `Ses.elenco` e i salvataggi di `Ven`/`VenStanza`.

**Passi.** 1) `24ha-avventura.js`: `html` a pezzi (`riprendiH`, `insegneH`, `schedeH`, `foglioH`, nuove). 2) `css/39a-avventura.css`: prefisso `av2-`. 3) `07c-comandi.js`. 4) due illustrazioni delle insegne (`artist`, stile dipinto delle copertine in `24t-copertine.js`).

**Prove.** Scenario browser `menu_avventura`: senza salvataggi → niente fascia Riprendi, scheda Guida aperta; con un salvataggio → «Continua» in cima apre la partita; con stanza a 2 → nel foglio «Con la stanza» è attivo e mostra 2 nomi. Screenshot a 390 px della pagina, una volta.

**Fuori scopo.** Cambiare le regole o i salvataggi. Dipende da T1 (scheletro) e T5 (nome nuovo).

**Fatto quando.** Lo scenario passa; da pagina aperta a partita ripresa: un tocco.
