---
passo: 14
titolo: Disegnare il mondo grande
fase: 4
area: viste
dopo: [05, 07]
agente: programmer
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24hu-ven-mappa.js
---

# Passo 14 — Disegnare il mondo grande

**In breve.** Il mondo da 240×240 resta fluido sul telefono; fiumi, laghi, ponti, passi e confini si vedono e si capiscono.

**Acceso da.** mondi nuovi (`?ven=mondo2`; per tutti al passo 38).

## Scopo

Il mondo da 240×240 resta fluido sul telefono, e fiumi, laghi, ponti e passi si vedono e si capiscono.

## Leggi prima

`app/24hu-ven-mappa.js` (costruzione del terreno, `K.lu`, `colora`, particelle, la vista `vx/vz`), `app/24ht-ven-arte.js` (materiali), regole di r128 e del contesto perso in `docs/moduli/ventura.md`.

## Decisioni

1. **Terreno a tasselli** di 32×32 celle: si costruiscono solo i tasselli vicini alla vista (più un anello di margine) e si liberano quelli lontani, con al massimo 2 costruzioni per fotogramma (niente scatti).
2. **Acqua**: laghi e mare con lo stesso materiale d'acqua; fiumi come nastri larghi in proporzione alla portata, con riflesso leggero. Ponti di legno o pietra (modellini) e guadi con sassi.
3. **Vista lontana**: oltre una certa altezza i tasselli lontani passano a una texture unica a bassa risoluzione dell'intera mappa (generata una volta in un canvas da `M`), con i confini dei regni a tratteggio (vedi il punto 6).
4. **Nebbia dell'ignoto** (facoltativa, `VEN.opz(s).nebbia`): le celle mai viste sono velate. Le scopri muovendoti, e l'esplorazione (abilità) allarga il raggio.
5. **Bussola e mini-mappa** nell'angolo (riusa il canvas del punto 3), con tocco = vai lì.
7. La nebbia si ricorda per telefono: celle viste in `localStorage` (`ven-visto-<seme>`, un bit per cella, letture e scritture dentro `try/catch`); in compagnia ognuno ha la sua.
6. **Confini dal possesso dei luoghi**: ogni cella va al regno del luogo più vicino, ricalcolato una volta al giorno di gioco; non si usa `M.R`. Con l'unificazione (passi 23 e 27) i confini si muovono. Colori da `VEN.rg`.

## Prove

Scenario `scenari/p14.py` con `?ven=mondo2` (mondo vasto):
- 30 s di marcia a ×4: nessun errore; tasselli vivi ≤ 25;
- fps ≥ 0,9 × quelli del mondo di oggi sullo stesso browser;
- il pizzico al massimo mostra la texture unica;
- contesto perso e ripreso.

Tre screenshot a 390 px (vicino a un fiume con ponte, porto su un lago, vista lontana).

## Fatto quando

Lo scenario passa e gli screenshot sono guardati.
