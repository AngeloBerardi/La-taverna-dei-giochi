# W2v — Disegnare il mondo grande

**Binario** H (vista della mappa). **Dopo** W2 e W0. Si vede solo nei mondi `s.geo===2` (con `?ven=mondo2`, poi con X4).

**Scopo.** Il mondo da 240×240 resta fluido sul telefono, e fiumi, laghi, ponti e passi si vedono e si capiscono.

**Leggi prima.** `app/24hu-ven-mappa.js` (costruzione del terreno, `K.lu`, `colora`, particelle, la vista `vx/vz`), `app/24ht-ven-arte.js` (materiali), regole di r128 e del contesto perso in `docs/moduli/ventura.md`.

**Decisioni già prese.**
1. **Terreno a tasselli** di 32×32 celle: si costruiscono solo i tasselli vicini alla vista (più un anello di margine) e si liberano quelli lontani, con al massimo 2 costruzioni per fotogramma (niente scatti).
2. **Acqua**: laghi e mare con lo stesso materiale d'acqua; fiumi come nastri larghi in proporzione alla portata, con riflesso leggero. Ponti di legno o pietra (modellini) e guadi con sassi.
3. **Vista lontana**: oltre una certa altezza i tasselli lontani passano a una texture unica a bassa risoluzione dell'intera mappa (generata una volta in un canvas da `M`), con i confini dei regni a tratteggio.
4. **Nebbia dell'ignoto** (facoltativa per difficoltà, `opz.nebbia`): le celle mai viste sono velate. Le scopri muovendoti, e l'esplorazione (abilità) allarga il raggio.
5. **Bussola e mini-mappa** nell'angolo (riusa il canvas del punto 3), con tocco = vai lì.

**Prove.** Scenario `ventura_mondo2` con `?ven=mondo2` (mondo vasto):
- 30 s di marcia a ×4: nessun errore; tasselli vivi ≤ 25;
- fps ≥ 0,9 × quelli del mondo di oggi sullo stesso browser;
- il pizzico al massimo mostra la texture unica;
- contesto perso e ripreso.

Tre screenshot a 390 px (vicino a un fiume con ponte, porto su un lago, vista lontana).

**Fatto quando.** Lo scenario passa e gli screenshot sono guardati.
