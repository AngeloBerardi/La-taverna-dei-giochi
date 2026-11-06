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

## Prova con 2-3 telefoni
TV sul PC + un telefono narratore + 1-2 ospiti, kit `nebbia-scoglio` (35 minuti, timer brevi). Senza narratore la TV si guida dalla tastiera: spazio = avanti, P = pausa.
