# CSS (`src/css/`)

L'ordine dei file nel manifest **è** il cascade: un file più in basso vince a parità di specificità. Il numero nel nome segue quell'ordine (`npm run struttura` avvisa se non coincide).
- Un file per gioco o per area (`12-the-gang.css`, `24-gattini.css`…). Le regole di un gioco vivono solo nel suo file.
- `20-lobby-campeggio-e-sala.css` = lobby a schede, falò nordico, campeggio, chat a scomparsa, sala dark fantasy. Non ripete più `07`–`18` (la copia è stata eliminata): se vedi una regola identica in due file, tieni quella nel file del gioco.
- `30-adatta.css` scala carte e pezzi dei giochi a layout fisso con `--k` (calcolato da JS); `31-orizzontale.css` dà a Regicide e Azul due colonne in orizzontale. Valgono per più giochi, quindi stanno dopo quelli che adattano. `90-lobby-3d.css` è **generato** da `tools/taverna3d/` (non modificarlo a mano).
- Mobile-first, 390 px. Niente effetto olografico/foil sulle carte. Dettagli in `docs/STYLE.md`.
- Prima di aggiungere un file CSS nuovo: mettilo nel manifest nella posizione giusta e dagli il numero giusto.
