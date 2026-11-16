# U1 — HUD del mondo: numeri con un nome, mappa sempre in vista

**Binario** E (interfaccia del mondo). **Dopo** R2. Visibile appena unita (rilascio 1).

**Scopo.** Sulla mappa si capisce in un colpo d'occhio quanto hai e cosa puoi fare; qualunque pannello aperto lascia vedere la mappa.

**Leggi prima.** Dopo R2: `app/24hwa-ven-barre.js` (`altoH`, `tastiH`, `bassoH`), `app/24hw-ventura.js` (`hudVivo`, `html`), `css/39ja-ven-barre.css`, `css/39jb-ven-pannelli.css` (`.vn-pan`), `docs/STYLE.md`. Riferimento dell'errore: `docs/VENTURA-2.md`, «Dove siamo».

**Oggi.** In alto cinque chip con un'icona e un numero (monete, uomini, viveri, morale, fama), nessuno sa cosa sia «4» o «60». In basso sei tasti piccoli con la velocità (×1) in mezzo. I pannelli `.vn-pan` coprono circa il 66% dell'altezza. Le etichette dei luoghi escono dal bordo.

**Decisioni già prese.**
1. **Barra alta (2 righe, 96 px in tutto)**. Riga 1: menu · `Giorno 3 · 14:20` con il sole/luna · gruppo tempo a destra: pausa/avanti e velocità (×1/×2/×4) come **un solo** controllo a due tocchi (tocco = pausa/avanti; tocco lungo o seconda icona = velocità). Riga 2: cinque riquadri uguali, ognuno icona + numero grande + etichetta piccola sotto (`monete`, `uomini`, `viveri`, `morale`, `fama`). I viveri si mostrano in **giorni** («4 g»). Colore di allarme (rosso scuro, già in palette) quando: viveri ≤ 2 g, morale < 30, paga dovuta entro 1 giorno con monete insufficienti (piccolo segno sul riquadro monete).
2. Tocco su un riquadro = infobox (`infoH`) con il dettaglio (es. monete: «paga 22 ogni 7 giorni, prossima tra 3»). Niente testo fisso in più.
3. **Barra bassa**: cinque tasti da 64 px, icona sopra e nome sotto: Compagnia · Capitano · Carta · Diario · Accampa. Il pallino d'ottone (già usato per «punti da spendere») resta per Capitano e compare su Compagnia quando ci sono promozioni.
4. **Pannelli = fogli dal basso**, altezza massima **58%** (`max-height:58dvh`), con la maniglia in alto e la X; lo scorrimento è dentro il foglio. La telecamera della mappa, quando un foglio è aperto, sposta il fuoco perché la compagnia resti al centro della parte visibile (`VenMappa` — un solo valore di spostamento verticale passato da `html()` tramite `V.foglio=true`).
5. **Etichette dei luoghi**: mai fuori schermo; se il punto è entro 40 px dal bordo, l'etichetta si appoggia al bordo (calcolo nella funzione che oggi posiziona `.vn-etc`).
6. Un solo ottone per schermata: nella barra bassa nessun tasto è d'ottone; d'ottone solo l'azione principale del foglio aperto.

**Stato e contratti.** Nessun campo nuovo nel motore. Nella vista: `V.foglio` (boolean, non salvato). Funzione pura nuova in `28kb` (o `28k` se R1 non è fatta): `VEN.giorniViveri(s)` → intero (oggi il conto è nella vista: spostarlo).

**Passi.** 1) `altoH` e CSS. 2) `tastiH` e CSS. 3) fogli `.vn-pan` (CSS + spostamento del fuoco). 4) etichette. 5) `VEN.giorniViveri` + test di una riga in `test_ven_mondo.js`.

**Prove.** Scenario nuovo `ventura_hud`: a 390×844 e 360×640 (a) i cinque riquadri hanno un'etichetta testuale visibile; (b) aperto «Compagnia», l'altezza del foglio è ≤ 0,58 dell'altezza della finestra e il punto della compagnia proiettato sta nella parte visibile; (c) nessun `.vn-etc` con `left<0` o `right>innerWidth`; (d) contare i bottoni con classe d'ottone visibili: ≤ 1; (e) bersagli ≥ 44 px. Screenshot `ventura-hud.png` a 390 px, una volta.

**Fuori scopo.** Pannello del luogo e mercato (U2), incontro (U3), battaglia (U4).

**Fatto quando.** Lo scenario passa e lo screenshot mostra mappa + foglio con la compagnia visibile.
