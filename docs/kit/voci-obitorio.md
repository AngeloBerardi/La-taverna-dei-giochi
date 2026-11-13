# Le voci di via dell'Obitorio: direzione artistica e prompt

Fascicolo `voci-obitorio` (kit cifrato in `src/kit-cifrati/`). Qui niente soluzione: solo aspetto e prompt. Formati e regole comuni: `docs/GIALLI-SCENA.md`; preparazione: `python3 tools/kit/prepara-immagini.py <cartella> voci-obitorio <kit-in-chiaro.json>`.

Palette (già nel kit): fondo `#121619`, carta `#ece4d2`, inchiostro `#20262b`, accento `#7fa7b8`, sangue `#8e2f2a`

## Blocco di stile (in testa a ogni prompt)
> Late 19th-century Trieste, gas-lit, cool blue-grey tones with warm lamp accents, Austro-Hungarian port city, documentary photograph look with painterly finish, realistic proportions, no text, no letters, no watermark, no modern objects.

## Copertina (`copertina`, 16:9, spazio vuoto a sinistra per il titolo)
> [stile] Establishing view of the setting of «Le voci di via dell'Obitorio» (Trieste, 3 marzo 1888), at night or dusk, the left half of the frame dark and empty.

## Ritratti (`ritratti/<id>`, 4:5, mezzo busto, sfondo scuro uniforme)
Stessa luce e stessa inquadratura per tutti: nessuno deve sembrare più colpevole degli altri.

| id | Chi | Prompt (dopo lo stile) |
|---|---|---|
| `gemma` | Gemma Furlan, portinaia | Half-length portrait, portinaia in 3 marzo 1888, period clothing, composed neutral expression, dark plain background |
| `teodoro` | Teodoro Lunardi, venditore di macchine parlanti | Half-length portrait, venditore di macchine parlanti in 3 marzo 1888, period clothing, composed neutral expression, dark plain background |
| `weber` | Franz Weber, orologiaio del terzo piano | Half-length portrait, orologiaio del terzo piano in 3 marzo 1888, period clothing, composed neutral expression, dark plain background |
| `kos` | Milena Kos, lavandaia del cortile | Half-length portrait, lavandaia del cortile in 3 marzo 1888, period clothing, composed neutral expression, dark plain background |
| `andreadis` | Stavros Andreadis, mercante di uva passa, secondo piano | Half-length portrait, mercante di uva passa, secondo piano in 3 marzo 1888, period clothing, composed neutral expression, dark plain background |
| `bressan` | Commissario Bressan, della polizia di Trieste | Half-length portrait, della polizia di Trieste in 3 marzo 1888, period clothing, composed neutral expression, dark plain background |

## Luoghi (`luoghi/<id>`, 16:9, senza persone, terzo inferiore più scuro)
Le zone toccabili hanno coordinate fisse nel kit (0 = sinistra/alto): la composizione deve metterle in quei punti.

| id | Luogo | Dove stanno le zone |
|---|---|---|
| `stanza` | La stanza di Elvira | La porta: x 0.4–0.58, y 0.08–0.68; La finestra: x 0.76–0.96, y 0.1–0.5; La cassapanca dei pegni: x 0.05–0.35, y 0.55–0.9; La scrivania: x 0.4–0.7, y 0.72–0.96 |
| `cortile` | Il cortile | La grondaia: x 0.4–0.6, y 0.05–0.9 |
| `bottega` | La bottega di Lunardi | Il banco: x 0.1–0.55, y 0.45–0.85; La vetrina: x 0.62–0.95, y 0.1–0.6 |
| `caffe` | Il Caffè San Marco | Il tavolo d'angolo: x 0.3–0.7, y 0.4–0.8 |

Gli oggetti (`oggetti/<id reperto>`) si aggiungono dopo, guardando i testi dei reperti nel kit in chiaro: mai un'immagine che dica più del testo.
