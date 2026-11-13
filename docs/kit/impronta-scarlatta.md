# L'impronta scarlatta: direzione artistica e prompt

Fascicolo `impronta-scarlatta` (kit cifrato in `src/kit-cifrati/`). Qui niente soluzione: solo aspetto e prompt. Formati e regole comuni: `docs/GIALLI-SCENA.md`; preparazione: `python3 tools/kit/prepara-immagini.py <cartella> impronta-scarlatta <kit-in-chiaro.json>`.

Palette (già nel kit): fondo `#161212`, carta `#f0e9df`, inchiostro `#271e1c`, accento `#c8a46a`, sangue `#a3271f`

## Blocco di stile (in testa a ogni prompt)
> Milan 1910, jeweller's office, warm brass and mahogany, sharp scientific clarity, Edwardian detective atmosphere, realistic proportions, no text, no letters, no watermark, no modern objects.

## Copertina (`copertina`, 16:9, spazio vuoto a sinistra per il titolo)
> [stile] Establishing view of the setting of «L'impronta scarlatta» (Milano, via degli Orefici, 9 maggio 1910), at night or dusk, the left half of the frame dark and empty.

## Ritratti (`ritratti/<id>`, 4:5, mezzo busto, sfondo scuro uniforme)
Stessa luce e stessa inquadratura per tutti: nessuno deve sembrare più colpevole degli altri.

| id | Chi | Prompt (dopo lo stile) |
|---|---|---|
| `ruggero` | Ruggero Ornati, nipote del principale, accusato | Half-length portrait, nipote del principale, accusato in 9 maggio 1910, period clothing, composed neutral expression, dark plain background |
| `ornati` | Signor Federico Ornati, commerciante di pietre preziose | Half-length portrait, commerciante di pietre preziose in 9 maggio 1910, period clothing, composed neutral expression, dark plain background |
| `tosi` | Amedeo Tosi, primo commesso | Half-length portrait, primo commesso in 9 maggio 1910, period clothing, composed neutral expression, dark plain background |
| `farmacista` | Dottor Pagani, farmacista di via Orefici | Half-length portrait, farmacista di via Orefici in 9 maggio 1910, period clothing, composed neutral expression, dark plain background |
| `portiere` | Celeste, portiere del palazzo | Half-length portrait, portiere del palazzo in 9 maggio 1910, period clothing, composed neutral expression, dark plain background |
| `ada` | Ada Ferri, donna delle pulizie | Half-length portrait, donna delle pulizie in 9 maggio 1910, period clothing, composed neutral expression, dark plain background |

## Luoghi (`luoghi/<id>`, 16:9, senza persone, terzo inferiore più scuro)
Le zone toccabili hanno coordinate fisse nel kit (0 = sinistra/alto): la composizione deve metterle in quei punti.

| id | Luogo | Dove stanno le zone |
|---|---|---|
| `ufficio` | L'ufficio | La cassaforte: x 0.7–0.95, y 0.15–0.7; Il cestino di Ruggero: x 0.15–0.3, y 0.7–0.95; La scrivania di Ruggero: x 0.1–0.45, y 0.35–0.65 |
| `portineria` | La portineria | Il registro del portiere: x 0.3–0.7, y 0.4–0.8 |
| `casa-tosi` | La casa di Tosi | La stufa: x 0.1–0.4, y 0.4–0.85; L'ombrello: x 0.65–0.85, y 0.1–0.8 |
| `magazzino` | Il magazzino | nessuna zona |

Gli oggetti (`oggetti/<id reperto>`) si aggiungono dopo, guardando i testi dei reperti nel kit in chiaro: mai un'immagine che dica più del testo.
