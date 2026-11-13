# Il cane della brughiera: direzione artistica e prompt

Fascicolo `cane-brughiera` (kit cifrato in `src/kit-cifrati/`). Qui niente soluzione: solo aspetto e prompt. Formati e regole comuni: `docs/GIALLI-SCENA.md`; preparazione: `python3 tools/kit/prepara-immagini.py <cartella> cane-brughiera <kit-in-chiaro.json>`.

Palette (già nel kit): fondo `#10140f`, carta `#e8e6d8`, inchiostro `#1d2219`, accento `#9fb86a`, sangue `#7d2d22`

## Blocco di stile (in testa a ogni prompt)
> Misty Lombard heathland, November 1903, muted greens and peat browns, low fog, gothic but not horror, realistic proportions, no text, no letters, no watermark, no modern objects.

## Copertina (`copertina`, 16:9, spazio vuoto a sinistra per il titolo)
> [stile] Establishing view of the setting of «Il cane della brughiera» (Somma Lombardo, 15 novembre 1903), at night or dusk, the left half of the frame dark and empty.

## Ritratti (`ritratti/<id>`, 4:5, mezzo busto, sfondo scuro uniforme)
Stessa luce e stessa inquadratura per tutti: nessuno deve sembrare più colpevole degli altri.

| id | Chi | Prompt (dopo lo stile) |
|---|---|---|
| `lucia` | Lucia Somma, nipote del conte | Half-length portrait, nipote del conte in 15 novembre 1903, period clothing, composed neutral expression, dark plain background |
| `ernesto` | Ernesto Gallo, fattore della tenuta | Half-length portrait, fattore della tenuta in 15 novembre 1903, period clothing, composed neutral expression, dark plain background |
| `steni` | Tobia Steni, naturalista, vicino di casa | Half-length portrait, naturalista, vicino di casa in 15 novembre 1903, period clothing, composed neutral expression, dark plain background |
| `bortolo` | Bortolo, pastore della brughiera | Half-length portrait, pastore della brughiera in 15 novembre 1903, period clothing, composed neutral expression, dark plain background |
| `moretti` | Dottor Moretti, medico condotto | Half-length portrait, medico condotto in 15 novembre 1903, period clothing, composed neutral expression, dark plain background |
| `tenente` | Tenente Guidi, dei carabinieri | Half-length portrait, dei carabinieri in 15 novembre 1903, period clothing, composed neutral expression, dark plain background |

## Luoghi (`luoghi/<id>`, 16:9, senza persone, terzo inferiore più scuro)
Le zone toccabili hanno coordinate fisse nel kit (0 = sinistra/alto): la composizione deve metterle in quei punti.

| id | Luogo | Dove stanno le zone |
|---|---|---|
| `brughiera` | La brughiera | Il cippo: x 0.42–0.6, y 0.25–0.7; Le impronte: x 0.65–0.9, y 0.6–0.9; La torbiera: x 0.05–0.35, y 0.5–0.9; L'erica: x 0.3–0.42, y 0.75–0.95 |
| `villa` | La villa | Il comodino del conte: x 0.08–0.38, y 0.4–0.8; Il camino della biblioteca: x 0.6–0.92, y 0.3–0.8 |
| `fattoria` | La fattoria | La scrivania del fattore: x 0.3–0.7, y 0.4–0.8 |

Gli oggetti (`oggetti/<id reperto>`) si aggiungono dopo, guardando i testi dei reperti nel kit in chiaro: mai un'immagine che dica più del testo.
