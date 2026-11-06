# Cena con delitto in famiglie («serata»)

Serata per 2-40 persone divise in famiglie. La **TV regista** (il PC collegato alla TV, `?tv=CODICE` → «Fai da regista») tiene kit e soluzione; il **narratore** guida da un telefono con la console; ogni **ospite** ha sul telefono il dossier del suo personaggio. Progetto completo, scelte e motivazioni: il documento «Il motore delle cene con delitto» (Claude Docs).

| Parte | File |
|---|---|
| Motore puro | `src/js/motori/36a-serata.js` (`SERATA`) + `tests/test_serata.js` |
| Collaudo di un kit privato | `tests/serata_collaudo.js` (generico): `KIT_PRIVATO=/percorso/kit.json npm test -- serata`; prove proprie del kit con `KIT_PRIVATO_PROVE=/percorso/prove.js` |
| TV, console, telefono | `src/js/app/24va-serata.js` (`SER`, un solo comando `data-a="ser" data-v="verbo:arg"`) + `src/css/45a-serata.css` (prefisso `sr-`) |
| Kit pubblici | `src/kit/<id>.json` con `"formato": "serata"` (validati nel build con `SERATA.valida`). Kit di prova: `nebbia-scoglio` (1-4 ospiti) |
| Prova nel browser | `python3 tools/test-browser/run.py serata` (TV, narratore e tre ospiti; TV riavviata a metà) |

## Canali (gli stessi della regia classica, nessuna regola nuova)
- `regia/CODICE`: stato privato `{gid, s, narr}`, lo legge solo la TV regista.
- `segreti/CODICE/UID/<chiave>`: la mano di ognuno. Chiavi: `dossier`, `stato`, `prove`, `fam`, `msg`, `ric`; al narratore `console`.
- `azioni/CODICE/UID/ID`: richieste dei telefoni. Il narratore manda `{t:'cmd', c, seq, at}`: il motore accetta i comandi solo dal suo uid, ignora un `seq` già visto (doppio tocco) e un «avanti» con `at` diverso dal punto attuale (console rimasta indietro).
- `stanze/CODICE/d`: solo `SERATA.pubblico` (atto, momento, timer, sigilli, prove pubbliche, dichiarazioni, cast pubblico).

## Tempo e regole dei momenti
Ogni atto ha fino a tre momenti, rinominabili nel kit (`momenti.mattina.nome`…):
- **mattina**: copione del narratore (righe di regia, «tocca a…», comandi); prove dell'atto; verso le altre famiglie parla solo il rappresentante (`dichiara`, che la TV mostra);
- **pomeriggio**: tutti con tutti (mostra, chiedi copia), con tempo massimo: allo scadere si passa alla sera da soli;
- **sera**: solo dentro la famiglia (bacheca, collegamenti, modulo della sera).

## Formato del kit (campi principali)
`famiglie`, `personaggi` (dossier: `pubblico`, `passato`, `segreto`, `comodo`, `obiettivi`, `legami`, `atti` anche a intervalli `"I-II"`, `battute`, `motore`, `vincolo`, `tono`, `mosse`, `varianti`, `riserva`, `colpevole`, `confessione`), `prove` (`rilascio {atto, momento, a, versione}`, `annuncia`, `poi`, `dopo`, `regia`, `riserva {a, minuti}`, `estratto`), `collegamenti` (`servono` anche `@deduzione`, `scelte`, `giusta`, `passo`, `spegne`, `aiuto`), `sigilli`, `audio` (`testo`, `file`), `atti` (`mattina.scene[].righe` con `regia` | `chi`+`testo` | `cue {prova|mostra|sigillo|audio|mondo}`, `pomeriggio {minuti, istruzioni}`, `sera {minuti, istruzioni, modulo}`, `sblocchi`), `accusa`, `punteggio` (anche `gruppi` per le prove indipendenti), `soluzione` (`colpevole`, `orari` canonici, `prove` per domanda, `cronologia`, `ricostruzione`, `epilogo`). Destinatari: `"tutti"`, `{fam}`, `{p}`, `{portavoce}` o una lista.

Il validatore controlla anche: orari scritti nei testi fuori dalla cronologia canonica, prove del copione nell'atto sbagliato, dipendenze tra prove, ogni risposta dell'accusa provata da almeno due prove di famiglie diverse. `avvisi(k)` segnala i collegamenti tutti dentro una famiglia.

## Kit privati
Un kit che non deve stare nel repo pubblico si apre dalla TV: scegli «Kit privato dal computer della TV», poi «Apri il kit dal computer». Il file resta nel browser di quel PC (`localStorage`), non passa dal sito né dal database; i telefoni ricevono solo la loro mano.

## Kit cifrati (segreti, ma nel repo)
Il repo e il sito sono pubblici: un kit con colpevole e prove (es. «23:17 – L'ultima luce», `ultima-luce`) ci sta solo **cifrato**, in `src/kit-cifrati/<id>.json`. In chiaro restano id, titolo, sottotitolo, numero di giocatori e durata (servono all'elenco); tutto il resto è il kit compresso e cifrato (AES-256-GCM, chiave da PBKDF2-SHA-256 a 600 000 giri, sale e iv casuali, l'id è un dato autenticato). Codice: `src/js/motori/36b-kit-cifrati.js` (`KITC`).
- **Sulla TV**: nell'elenco delle serate il kit compare come gli altri. Alla prima apertura la TV chiede la frase (maiuscole, spazi e trattini non contano), apre il kit nel browser e ricorda la frase su quel computer (`localStorage`, chiave `serata-frase-<id>`). Frase sbagliata: errore e la richiesta torna. Ai telefoni arriva solo la loro mano, come sempre; il database non vede mai né la frase né il kit.
- **Dopo un errore** la TV non riprova da sola: tocco su «Riprova» (o sul bottone della frase).
- **Cifrare o aggiornare un kit**: `node tools/kit/cifrati.js cifra /percorso/kit.json` (senza frase ne inventa una e la stampa; per aggiornare un kit già cifrato si passa la stessa frase come secondo argomento). Il kit in chiaro NON va committato: tienilo fuori dal repo. `apri <busta> <frase> <uscita.json>` lo riscrive in chiaro, utile per il collaudo completo: `KIT_PRIVATO=uscita.json npm test -- serata`.
- **Test**: `npm test -- kit_cifrati` (giro completo, frase sbagliata, buste alterate o malformate, nessun segreto in chiaro); con `KIT_FRASE=<frase>` apre anche le buste vere del repo e ne valida il contenuto. Il build controlla solo la busta (non ha la frase). Scenario `serata_cifrato` nel browser.
- **Limite onesto**: chi ha la frase legge il kit; la frase protegge dalla lettura casuale del repo pubblico, non da chi la conosce. La frase non sta da nessuna parte nel repo.

## Prova con 2-3 telefoni
TV sul PC + un telefono narratore + 1-2 ospiti, kit `nebbia-scoglio` (35 minuti, timer brevi). Senza narratore la TV si guida dalla tastiera: spazio = avanti, P = pausa.
