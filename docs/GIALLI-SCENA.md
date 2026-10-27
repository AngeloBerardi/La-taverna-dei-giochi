# Cene con delitto: la messa in scena

Ogni kit ha il suo aspetto (colori, carattere dei titoli, musica, atmosfera, immagini), ma **tutti i kit usano gli stessi momenti di coinvolgimento**. Un kit non scrive codice: sceglie dal repertorio comune e fornisce i propri dati (sezione `scena` del JSON, campi `luogo`/`fx`/`aspetto`, immagini in `assets/kit/<id>/`). Direzione artistica e prompt di ogni kit: `docs/kit/<id>.md`.

## I momenti condivisi (uguali in ogni kit)
| Momento | TV | Telefono | Cosa usa del kit |
|---|---|---|---|
| Sigla | Copertina con titolo nel carattere del kit, musica del kit, atmosfera animata | Tema del kit (colori e titoli) | `copertina.webp`, `titoli.woff2`, `scena.palette`, `scena.musica` |
| Il cast | Uno alla volta: ritratto, «Ada è Bettina Mestolo, la cuoca», costume; la voce lo annuncia | Il proprio ritratto in cima alla scheda | `ritratti/*.webp` (o ritratto disegnato da `aspetto`), `ruolo`, `costume` |
| Prologo | Narrazione sul luogo d'apertura (primo dei `luoghi`), voce | «Ascoltate la TV» | `prologo`, `luoghi/<primo>.webp`, `scena.voce` |
| Cambio d'atto | Cartello «Atto II · La cantina», stacco, nuovo luogo con zoom lento | Busta: «Nuovi indizi e obiettivi», vibrazione | `atti[].titolo`, `atti[].luogo`, `strati`/`ambiente` dell'atto |
| Indizio pubblico | La carta entra al centro, poi va nella bacheca | Compare in «Sulla TV» | `oggetti/<indizio>.webp` |
| Evento | Effetto (lampo, buio, tremito, campana, biglietto, sparo, pendola) e testo; voce | Avviso «Guarda la TV» | `atti[].eventi[].fx` |
| Messaggio privato | «Dino, guarda il telefono» (senza dire cosa) | Busta personale, vibrazione lunga | `eventi[].a` + `privato` |
| Ultimo minuto | Battito, timer rosso, bordo che pulsa | Timer rosso | — |
| Accusa | Una busta sul tavolo per ogni voto (con il nome di chi ha votato, non il voto) | Modulo segreto | `domande` |
| Rivelazione | Buio, rullo di tamburi, riflettore sul ritratto dell'assassino, ricostruzione passo per passo con la voce | Verità e punti | `soluzione`, ritratto dell'assassino |
| Premiazione | Classifica, miglior attore, «l'ha fatta franca» | Il proprio risultato | — |

## Repertorio (scelto dal kit)
- **Strati dell'atmosfera** (`scena.atmosfera.strati`, ogni atto può cambiarli con `atti[].strati`): `pioggia`, `neve`, `nebbia`, `fuoco` (luce calda che tremola), `braci`, `polvere`, `lampi`, `neon`, `riflettori`, `vignetta`, `grana`.
- **Ambiente sonoro** (`scena.ambiente`, per atto `atti[].ambiente`): `pioggia`, `vento`, `fuoco`, `folla`, `orologio`, `mare`. Sintetizzato nel browser, nessun file.
- **Effetti degli eventi** (`eventi[].fx`): `lampo`, `buio`, `tremito`, `campana`, `telegramma` (un foglio entra in scena), `sparo`, `orologio` (rintocchi).
- **Ritratto disegnato** (`personaggi[].aspetto`, anche `vittima.aspetto`), usato finché manca l'immagine: `testa` tra `corti`, `lunghi`, `raccolti`, `calvo`, `cappello`, `cilindro`, `cappuccio`, `fazzoletto`, `elmo`, `velo`, `piuma`; `barba` (`true` o `"baffi"`); colori `colore` (abito), `capelli`, `pelle`.
- **Musica** (`scena.musica`): un tema proprio come le tracce di `app/03-audio.js`: `bpm`, `swing` (0–0,4), `strumento` (`flute`, `bell`, `pluck`, `brass`), `ritmo` (`tav`, `jazz`, `march`), `prog` (accordi: `[nota MIDI, 1 maggiore | 0 minore]`), `mel` (8 battute da 8 note MIDI, 0 = pausa).
- **Voce** (`scena.voce`): `velocita` 0,5–1,5, `tono` 0–2. È la voce del browser in italiano; in futuro `voce/<chiave>.mp3` per una narrazione registrata.
- **Colori** (`scena.palette`, obbligatori se c'è la scena): `fondo`, `carta` (schede e indizi), `inchiostro` (testo sulla carta), `accento` (titoli, timer), `sangue` (dettagli, pericolo).

Il validatore (`GIALLO.valida`) rifiuta nomi fuori repertorio: il build si ferma con il messaggio giusto.

## Immagini del kit (`assets/kit/<id>/`)
| Cartella / file | Nome | Formato | Note |
|---|---|---|---|
| `ritratti/` | id del personaggio, `vittima` | WebP 800×1000 (4:5), < 160 KB | mezzo busto, sfondo scuro uniforme, niente testo |
| `luoghi/` | id del luogo | WebP 1920×1080, < 400 KB | senza persone; terzo inferiore più scuro (ci va il testo) |
| `oggetti/` | id dell'indizio | WebP 800×800, < 120 KB | oggetto al centro su fondo scuro; scritte illeggibili |
| `copertina.webp` | — | WebP 1920×1080, < 400 KB | spazio libero a sinistra per il titolo, niente testo |
| `titoli.woff2` | — | font dei titoli (OFL o Apache), sottoinsieme latino | da `@fontsource/<nome>` su npm |

Un file con un nome che non corrisponde a niente nel kit ferma il build. Le immagini mancanti vengono sostituite: ritratti disegnati da `aspetto`, luoghi con l'atmosfera e i colori del kit, indizi come carte di testo. Si può quindi aggiungere un'immagine alla volta.

**Preparare le immagini** (ritaglio al centro, misura giusta, WebP): `python3 tools/kit/prepara-immagini.py <cartella con le immagini generate> <id-kit>`. Le immagini vanno nominate come la destinazione (`ritratti/tobia.png`, `luoghi/cantina.jpg`, `copertina.png`…).

## Regole per tutti i kit
- Immagini generate con AI dai prompt del kit: un **blocco di stile** uguale per tutte, prima un ritratto di prova, poi lo stesso stile (o lo stesso seed) per gli altri.
- Niente volti di persone reali, niente personaggi o opere esistenti nei prompt, niente artisti nominati: si descrive lo stile.
- Nessuna immagine deve svelare la soluzione: l'assassino ha un ritratto come gli altri, gli oggetti mostrano solo ciò che dice il testo dell'indizio.
- Peso totale di un kit sotto i 5 MB: l'hosting gratuito regge circa 360 MB al giorno, la TV scarica tutto una volta e i telefoni solo i ritratti.
