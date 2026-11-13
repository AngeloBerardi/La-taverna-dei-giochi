# La pietra di luna: direzione artistica e prompt

Fascicolo `pietra-di-luna` (kit cifrato in `src/kit-cifrati/`). Qui niente soluzione: solo aspetto e prompt. Formati e regole comuni: `docs/GIALLI-SCENA.md`; preparazione: `python3 tools/kit/prepara-immagini.py <cartella> pietra-di-luna <kit-in-chiaro.json>`.

Palette (già nel kit): fondo `#141a22`, carta `#eef0ea`, inchiostro `#1f2633`, accento `#c9d4e8`, sangue `#8a3b46`

## Blocco di stile (in testa a ogni prompt)
> Lake Como villa, summer 1898, soft moonlit blues and pearl whites, elegant Victorian-Italian interiors, gentle and family-friendly, realistic proportions, no text, no letters, no watermark, no modern objects.

## Copertina (`copertina`, 16:9, spazio vuoto a sinistra per il titolo)
> [stile] Establishing view of the setting of «La pietra di luna» (Villa Valsecchi, Lago di Como, 22 giugno 1898), at night or dusk, the left half of the frame dark and empty.

## Ritratti (`ritratti/<id>`, 4:5, mezzo busto, sfondo scuro uniforme)
Stessa luce e stessa inquadratura per tutti: nessuno deve sembrare più colpevole degli altri.

| id | Chi | Prompt (dopo lo stile) |
|---|---|---|
| `rachele` | Rachele Valsecchi, la festeggiata, diciott'anni | Half-length portrait, la festeggiata, diciott'anni in 22 giugno 1898, period clothing, composed neutral expression, dark plain background |
| `francesco` | Francesco Arnaldi, cugino e fidanzato di Rachele | Half-length portrait, cugino e fidanzato di Rachele in 22 giugno 1898, period clothing, composed neutral expression, dark plain background |
| `clelia` | Clelia Bassi, istitutrice e dama di compagnia | Half-length portrait, istitutrice e dama di compagnia in 22 giugno 1898, period clothing, composed neutral expression, dark plain background |
| `rizzi` | Dottor Candido Rizzi, medico di famiglia | Half-length portrait, medico di famiglia in 22 giugno 1898, period clothing, composed neutral expression, dark plain background |
| `gabriele` | Gabriele Bettega, maggiordomo | Half-length portrait, maggiordomo in 22 giugno 1898, period clothing, composed neutral expression, dark plain background |
| `corradi` | Sergente Corradi, dei carabinieri di Bellagio | Half-length portrait, dei carabinieri di Bellagio in 22 giugno 1898, period clothing, composed neutral expression, dark plain background |

## Luoghi (`luoghi/<id>`, 16:9, senza persone, terzo inferiore più scuro)
Le zone toccabili hanno coordinate fisse nel kit (0 = sinistra/alto): la composizione deve metterle in quei punti.

| id | Luogo | Dove stanno le zone |
|---|---|---|
| `salottino` | Il salottino di Rachele | Lo stipo: x 0.08–0.38, y 0.2–0.75; La porta: x 0.6–0.8, y 0.05–0.8 |
| `camera-francesco` | La camera di Francesco | Il cappotto: x 0.08–0.33, y 0.1–0.7; La camicia da notte: x 0.55–0.9, y 0.5–0.85 |
| `giardino` | Il giardino | Il cancello: x 0.35–0.65, y 0.2–0.8 |
| `camera-clelia` | La camera dell'istitutrice | Lo scrittoio: x 0.1–0.45, y 0.35–0.75; L'armadio: x 0.62–0.92, y 0.08–0.83 |

Gli oggetti (`oggetti/<id reperto>`) si aggiungono dopo, guardando i testi dei reperti nel kit in chiaro: mai un'immagine che dica più del testo.
