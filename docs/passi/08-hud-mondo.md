---
passo: 08
titolo: HUD del mondo: numeri con un nome, mappa sempre in vista
fase: 3
area: viste
dopo: [04]
agente: programmer
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24hwa-ven-barre.js
  - src/css/39ja-ven-barre.css
  - src/css/39jb-ven-pannelli.css
  - src/js/app/24hw-ventura.js
  - src/js/app/24hu-ven-mappa.js
  - src/js/motori/28kb-ven-economia.js
---

# Passo 08 — HUD del mondo: numeri con un nome, mappa sempre in vista

**In breve.** Sulla mappa si capisce in un colpo d'occhio quanto hai e cosa puoi fare; qualunque pannello aperto lascia vedere la mappa.

## Scopo

Sulla mappa si capisce in un colpo d'occhio quanto hai e cosa puoi fare; qualunque pannello aperto lascia vedere la mappa.

## Oggi

In alto cinque chip con un'icona e un numero (monete, uomini, viveri, morale, fama), nessuno sa cosa sia «4» o «60». In basso sei tasti piccoli con la velocità (×1) in mezzo. I pannelli `.vn-pan` coprono circa il 66% dell'altezza. Le etichette dei luoghi escono dal bordo.

## Leggi prima

`app/24hwa-ven-barre.js` (`altoH`, `tastiH`, `bassoH`), `app/24hw-ventura.js` (`hudVivo`, `html`), `css/39ja-ven-barre.css`, `css/39jb-ven-pannelli.css` (`.vn-pan`), `docs/STYLE.md`. Riferimento dell'errore: `docs/VENTURA-2.md`, «Dove siamo».

## Decisioni

1. **Barra alta (2 righe, 96 px in tutto)**. Riga 1: menu · `Giorno 3 · 14:20` con il sole/luna · gruppo tempo a destra: pausa/avanti e velocità (×1/×2/×4) come **un solo** controllo a due tocchi (tocco = pausa/avanti; tocco lungo o seconda icona = velocità). Riga 2: cinque riquadri uguali, ognuno icona + numero grande + etichetta piccola sotto (`monete`, `uomini`, `viveri`, `morale`, `fama`). I viveri si mostrano in **giorni** («4 g»). Colore di allarme (rosso scuro, già in palette) quando: viveri ≤ 2 g, morale < 30, paga dovuta entro 1 giorno con monete insufficienti (piccolo segno sul riquadro monete).
2. Tocco su un riquadro = infobox (`infoH`) con il dettaglio (es. monete: «paga 22 ogni 7 giorni, prossima tra 3»). Niente testo fisso in più.
3. **Barra bassa**: cinque tasti da 64 px, icona sopra e nome sotto: Compagnia · Capitano · Carta · Diario · Accampa. Il pallino d'ottone (già usato per «punti da spendere») resta per Capitano e compare su Compagnia quando ci sono promozioni.
4. **Pannelli = fogli dal basso**, altezza massima **58%** (`max-height:58dvh`), con la maniglia in alto e la X; lo scorrimento è dentro il foglio. La telecamera della mappa, quando un foglio è aperto, sposta il fuoco perché la compagnia resti al centro della parte visibile (`VenMappa` — un solo valore di spostamento verticale passato da `html()` tramite `V.foglio=true`).
5. **Etichette dei luoghi**: mai fuori schermo; se il punto è entro 40 px dal bordo, l'etichetta si appoggia al bordo (calcolo nella funzione che oggi posiziona `.vn-etc`).
6. Un solo ottone per schermata: nella barra bassa nessun tasto è d'ottone; d'ottone solo l'azione principale del foglio aperto.
7. **Opzioni di partita**: nel menu (`menuH`) la voce «Grandezza delle battaglie» (Piccola, Media, Grande) chiama `VEN.opzione(s,{k:'taglia',v})` del passo 04. Si vede solo se `VDAT.ACCESO.grandi`.
8. In `24hu` togli il ripiego `VDAT.FAZ` lasciato dal passo 05: ora `VEN.rg` esiste sempre.

## Stato e contratti

Nessun campo nuovo nel motore. Nella vista: `V.foglio` (boolean, non salvato). Funzione pura nuova in `28kb`: `VEN.giorniViveri(s)` → intero (oggi il conto è nella vista: spostarlo).

## Ordine di lavoro

1. `altoH` e CSS.
2. `tastiH` e CSS.
3. fogli `.vn-pan` (CSS + spostamento del fuoco).
4. etichette.
5. `VEN.giorniViveri` + test in `tests/test_ven_p08.js`.

## Prove

Scenario `scenari/p08.py`: a 390×844 e 360×640 (a) i cinque riquadri hanno un'etichetta testuale visibile; (b) aperto «Compagnia», l'altezza del foglio è ≤ 0,58 dell'altezza della finestra e il punto della compagnia proiettato sta nella parte visibile; (c) nessun `.vn-etc` con `left<0` o `right>innerWidth`; (d) contare i bottoni con classe d'ottone visibili: ≤ 1; (e) bersagli ≥ 44 px. Screenshot `ventura-hud.png` a 390 px, una volta.

## Fuori scopo

Pannello del luogo e mercato (passo 13), incontro (passo 09), battaglia (passo 22).

## Fatto quando

Lo scenario passa e lo screenshot mostra mappa + foglio con la compagnia visibile.

## Regole per il giocatore

- In alto leggi cinque numeri col loro nome: monete, uomini, viveri (in giorni), morale, fama. Toccane uno per il dettaglio.
- Un riquadro diventa rosso quando i viveri bastano per due giorni o meno, il morale è sotto 30, o la paga è dovuta domani e le monete non bastano.
- In alto a destra: pausa e velocità (x1, x2, x4). Il tempo scorre solo mentre la compagnia cammina o aspetta.
- Ogni pannello si apre dal basso e copre meno di sei decimi dello schermo: la compagnia resta in vista sulla mappa.
