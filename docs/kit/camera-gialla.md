# La camera gialla: direzione artistica e prompt

Fascicolo `camera-gialla` (kit cifrato in `src/kit-cifrati/`). Qui niente soluzione: solo aspetto, immagini e prompt.
Formati, pesi e regole comuni: `docs/GIALLI-SCENA.md`. Preparazione:
`python3 tools/kit/prepara-immagini.py <cartella-generate> camera-gialla <kit-in-chiaro.json>` (scrive in `assets/kit/camera-gialla/`).
Le immagini mancanti hanno un ripiego (pianta a griglia, iniziale del nome): si possono aggiungere una alla volta.

## Atmosfera
Torino, autunno 1907. Una villa sulla collina, un padiglione-laboratorio nel parco, carta da parati gialla, lastre fotografiche,
lampade a petrolio, pioggia sulla ghiaia. Giallo classico, serio, elegante: niente horror, niente sangue esibito.
Palette del kit (già nel JSON): fondo `#17150d`, carta `#f1e8cf`, inchiostro `#2a2414`, accento giallo cromo `#d9b23c`, rosso `#9b2f22`.

## Blocco di stile (uguale in tutti i prompt, in testa)
> Hand-tinted early 1900s photograph look, Italian Belle Époque, warm sepia base with selective chrome-yellow and ochre accents,
> soft film grain, gentle vignette, natural window or oil-lamp light, realistic proportions, painterly but not cartoonish,
> no text, no letters, no watermark, no frame, no modern objects.

Prima un ritratto di prova (Livia), poi stesso modello e stesso seme per tutti gli altri.

## Copertina (`copertina`, 16:9, spazio libero a sinistra per il titolo)
> [stile] Night exterior of a small single-storey garden pavilion in a dark park, rain falling, one barred window glowing warm yellow
> on the right side of the frame, gravel path in the foreground, bare autumn trees, the left half of the image is dark and empty sky.

## Ritratti (`ritratti/<id>`, 4:5, mezzo busto, sfondo scuro uniforme)
Nessun ritratto deve sembrare più colpevole degli altri: stessa luce, stessa inquadratura, espressioni composte.
| id | Prompt (dopo il blocco di stile) |
|---|---|
| `livia` | Young woman, about 25, dark brown hair pinned up, a thin white bandage on her left temple, high-collared cream blouse, calm and determined gaze, dark plain background |
| `varenna` | Man in his sixties, grey beard, round steel spectacles, black frock coat with a chemist's stains on the cuffs, tired eyes, dark plain background |
| `ugo` | Man about 30, clean-shaven, neatly combed hair, grey work jacket over a white shirt, polite reserved expression, dark plain background |
| `teresa` | Woman in her fifties, grey hair in a bun, dark wool dress with a white apron, shawl on her shoulders, attentive look, dark plain background |
| `bernardo` | Man in his sixties, weathered face, white moustache, heavy corduroy jacket and cap held in his hands, dark plain background |
| `riccardo` | Man about 30, light moustache, elegant dark suit, stiff collar, worried expression, dark plain background |
| `morra` | Police commissioner in his fifties, bowler hat, thick dark moustache, overcoat with a fur collar, confident stare, dark plain background |

## Luoghi (`luoghi/<id>`, 16:9, senza persone, terzo inferiore più scuro)
Le zone toccabili stanno in punti precisi dell'immagine (coordinate nel kit, 0 = sinistra/alto): la composizione deve rispettarle.
| id | Prompt (dopo il blocco di stile) | Dove devono stare le zone |
|---|---|---|
| `camera` | Small bedroom with yellow wallpaper, seen from the far wall: a recessed wall wardrobe with a half-open door, a walnut writing desk with an open drawer, a heavy wooden door broken from its bolt in the centre, a narrow window with iron bars, an unmade bed, oil lamp | armadio in alto a sinistra, scrivania in basso a sinistra, porta al centro, finestra a destra in alto |
| `parco` | Wet gravel path through a dark autumn park leading to the barred window of a pavilion, footprints in the mud, a small keeper's lodge with a lit lamp in the far upper right | viale al centro in basso, guardiola in alto a destra |
| `laboratorio` | Chemistry and photography laboratory, 1907: long workbench with glass plates, flasks and a brass camera in the centre, a heavy black curtain closing a darkroom corner on the right, door to a yellow room in the background | banco al centro in basso, tenda nera a destra |
| `soffitta` | Attic under a sloping roof: a narrow iron cot neatly made on the left, an unlit candle on a stool, a travel trunk, a steep wooden staircase going down on the right | branda a sinistra, scala a destra |
| `guardiola` | Interior of a park keeper's lodge at night, oil lamp on the table, small window looking out on a dark pavilion with one tiny attic window | nessuna zona |

## Oggetti (`oggetti/<id reperto>`, 1:1, oggetto al centro su fondo scuro, scritte illeggibili)
Mostrano solo ciò che dice il testo del reperto.
| id | Prompt (dopo il blocco di stile) |
|---|---|
| `r-cassetto` | A bronze lion paperweight on the open drawer of a walnut writing desk, a dark stain at its base |
| `r-rivoltella` | A small nickel-plated ladies' pocket revolver lying on a wooden floor |
| `r-giornale` | A folded Italian newspaper page from 1907, illegible columns of text, a small engraving of a laboratory |
| `r-tenda` | A grey work jacket hanging on a hook behind a black curtain, a streak of yellow paint on the right shoulder, embroidered initials too small to read |
| `r-quaderno` | A green clothbound notebook under glass reagent bottles inside an iron box |
| `r-biglietto-treno` | A first-class railway ticket and a new suit with a tailor's tag inside an open travel trunk |
| `r-telegramma` | A telegraph office copy form, 1907, handwriting illegible, rubber stamp |

## Musica e suoni
Usa il tema «giallo» della Taverna e gli stacchi comuni (campana, rullo, battito). Nessun file audio da preparare.
