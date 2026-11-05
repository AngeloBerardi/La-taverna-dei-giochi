# Cantari di Ventura — Piano B: tempo reale, mondo libero, resa pixel

1 novembre 2026

## Decisioni e cosa cambia

Cantari di Ventura passa da gioco da tavolo a turni a gioco di ruolo d'azione leggero: mondo libero sul modello dei giochi di comando di truppe, battaglie in tempo reale con pausa, resa pixel succosa come il riferimento dello screenshot. Le regole di fondo (classi, poteri, stati, bestiario, capitolo scritto) restano.

**Decisioni del 1 novembre 2026**

- **Eroi separati** sulla mappa del mondo, con la possibilità di **unirsi in compagnia** (un solo segnalino, si viaggia insieme) e di **staccarsi** in qualsiasi momento per proseguire da soli.
- **Battaglia in tempo reale con pausa**: gli eroi agiscono da soli secondo un comportamento, il giocatore dà ordini e usa le abilità, la pausa si mette quando si vuole.
- **Dadi meno duri**: il movimento non si tira più, né sulla mappa né in battaglia. Il d20 resta dentro ogni colpo e prova, ma non è più il protagonista della scena.
- **Visuale in terza persona** dall'alto, mai in prima persona; mondo navigabile in continuo, non a caselle.
- **Resa grafica**: pixel, piena di riscontri (numeri, bottino, livello), leggibile su telefono e su TV.

**Cosa succede al lavoro già fatto (A0–A13)**

| Parte | File | Destino |
| --- | --- | --- |
| Dadi nello stato | `27a` ADADI | Resta: serve ancora per il determinismo |
| Eroi, oggetti, bottino | `27`, `27b`, `27c` | Restano; si aggiunge la velocità d'attacco delle armi |
| Poteri e stati | `27e` APOT, `27d` ASTA | Restano le regole; i costi a turno diventano ricariche in secondi |
| Bestiario | `27f` BEST | Resta; ogni mostro riceve velocità, portata e comportamento in tempo reale |
| Battaglia | `27i` ASCO, `27j` AIA | Si riscrive il cuore (turni → istanti); geometria e arene si tengono |
| Mappa del mondo | `28` CAMP, `27m`, `27o` | Si tiene la generazione; il movimento diventa continuo, con compagnie |
| Racconto e capitolo | `27q`, `27r`, `27k` | Restano quasi intatti |
| Bilanciamento A13 | `27ha` ADIF | Da rifare alla fine: le quattro leve restano, i numeri no |
| Scena 3D | `24hn`, `24ho`, `28f`, `28g` | Resta la base; si aggiunge la resa pixel e l'animazione continua |
| Viste SVG | `24hc`, `24he`, `24hg` | Si alleggeriscono: diventano solo HUD sopra il 3D |
| Stanza TV + telefoni | `24hm`, `28e` | Cambia il protocollo: la TV simula, i telefoni mandano ordini |

## Principi tecnici

Il gioco resta un motore puro e deterministico: cambia solo l'unità di tempo, da "turno" a "istante" di 100 ms. Tutto il resto (grafica fluida, pausa, co-op) si costruisce sopra questa scelta.

**1. Logica a 10 istanti al secondo, grafica a 60 fotogrammi**

- Il motore espone `passo(s, n)` (avanza n istanti) e `ordina(s, ordine)` (registra un ordine valido dall'istante corrente). Nessun orologio dentro il motore: il tempo lo porta chi chiama.
- La grafica disegna a 60 fps e **interpola** posizioni e barre tra l'istante precedente e quello attuale. Così il movimento è morbido anche se la logica è grossolana.
- Il dado resta nello stato (`s.rng`, ADADI). Stessi ordini negli stessi istanti ⇒ stessa battaglia: per i test, per riprendere un salvataggio e per la TV.
- Vietati nei motori: `Math.random`, `Date.now`, `Math.sin/cos/atan2` (danno risultati diversi tra browser). Distanze e direzioni sugli esagoni si fanno con interi, come già fa AGRI.

**2. La pausa è gratis**

Mettere in pausa vuol dire non chiamare `passo`. Durante la pausa si possono dare tutti gli ordini, che partono alla ripresa. Più la **pausa automatica**, ognuna attivabile dalle impostazioni: inizio battaglia, eroe sotto un quarto dei PF, eroe senza bersaglio, nemico nuovo in campo, potere pronto di un capo.

**3. Dai turni ai secondi (conversioni fisse)**

| Prima (A3–A4) | Dopo | Regola |
| --- | --- | --- |
| 1 giro | 6 secondi | Durate degli stati e Concentrazione: t giri → 6 t s |
| Attacco nel turno | Ritmo dell'arma | Leggera 1,2 s, media 1,6 s, pesante 2,2 s tra un colpo e l'altro |
| Potere "azione" | Lancio + ricarica | Lancio 0,6–1,5 s (interrompibile), ricarica dalla carica |
| Potere "bonus" | Istantaneo | Ricarica breve, non interrompe l'attacco |
| Potere "reazione" | Automatico | Scatta da solo alla sua condizione, poi ricarica |
| Cariche "turno" | Ricarica 6 s | Le cariche scontro/breve/lungo restano identiche |
| Movimento tirato | Velocità fissa | mov/3 caselle al secondo (mov 6 → 2 caselle/s) |
| Iniziativa | Ritardo d'ingresso | All'inizio ognuno parte dopo 0–1 s secondo l'iniziativa |

**4. Gli esagoni restano, ma non si vedono**

In battaglia ogni creatura occupa sempre un esagono e passa al successivo alla sua velocità; la grafica la fa scivolare in continuo. Così restano validi linea di vista, copertura, altezza, attacchi di opportunità e ricerca del percorso di AGRI e AARE, già testati. La griglia si mostra solo in pausa o quando si dà un ordine di movimento.

**5. Il d20 dentro ogni colpo**

Quando un colpo parte si tira d20 + attacco contro CA, con vantaggio e svantaggio dalla griglia come oggi. A schermo non si vede il dado: si vede il colpo, il numero o la scritta "Mancato". Il registro della battaglia tiene i tiri per chi li vuole leggere.

**6. Eroi che agiscono da soli (comportamenti)**

Ogni eroe ha un **atteggiamento** scelto dal giocatore: Assalto, Difesa, Supporto, Tieni la posizione. Decide bersaglio, distanza e uso dei poteri a volontà; gli altri poteri li usa solo se il giocatore attiva "Uso automatico" su quel tasto. Il bot di AIA diventa il cervello di questi atteggiamenti e dei nemici.

**7. Ordini sul telefono**

Tocca un eroe per sceglierlo; tocca un nemico per attaccarlo; tocca una casella per andarci; tieni premuto un eroe e trascina per la formazione. In basso, la barra con 4–6 abilità dell'eroe scelto, ognuna con anello di ricarica. Due tasti fissi: Pausa e velocità ×1/×2.

**8. Il mondo scorre solo quando ci si muove**

Come nei giochi di comando di truppe a mondo libero, l'orologio del mondo avanza solo mentre qualcuno cammina o riposa. Un giorno di gioco ≈ 3 minuti di cammino. Perdizione all'alba, notte e luoghi restano come oggi. La logica del mondo usa lo stesso schema: istanti fissi, rng nello stato, grafica interpolata.

**9. Compagnie: unirsi e staccarsi**

- Sulla mappa si muovono **segnalini**: un eroe da solo o una **compagnia** di 2–4 eroi. La compagnia va alla velocità del più lento e si comanda come un segnalino solo.
- **Unirsi**: due segnalini vicini (entro 1 casella) premono "Unisciti". **Staccarsi**: dalla scheda della compagnia, un eroe prende la sua strada e diventa un segnalino a sé, subito.
- In solitario si comanda un segnalino alla volta; quelli non scelti stanno fermi o seguono l'ultimo ordine.
- **Contatto**: chi tocca un gruppo nemico entra in battaglia. Gli altri segnalini entro 4 caselle arrivano come **rinforzi** dopo un ritardo proporzionale alla distanza, dal bordo del campo. È la versione nostra del "chi è vicino entra".

**10. Co-op: la TV fa da arbitro, i telefoni da controller**

- In solitario il telefono simula e disegna tutto.
- Con la TV, la **TV simula e disegna**; ogni telefono diventa un controller: scheda del proprio eroe, barra abilità, minimappa e Pausa. Il telefono non disegna la battaglia, quindi consuma poco anche se è vecchio.
- Gli ordini viaggiano come oggi con SYNC (sono pochi: tocchi, non 60 al secondo). La TV pubblica su RTDB un'istantanea leggera 4 volte al secondo: PF, ricariche, posizioni compatte (~1 KB). Con 4 telefoni sono circa 60–70 MB l'ora di gioco, dentro il piano gratuito.
- Pausa in co-op: la chiede chiunque, riprende chi l'ha chiesta o la TV dopo 20 s.

**11. Test**

Restano le regole di casa: bot bravo vince, bot casuale perde, sui gruppi "medi". Si aggiungono il test di **riproducibilità** (stessi ordini ⇒ stesso hash dello stato dopo 3000 istanti) e il test di **velocità** (una battaglia intera simulata in meno di 200 ms in node).

## Resa grafica

La scelta è il **pixel 3D**: la scena resta in three.js (miniature, terreno e luci che abbiamo già), ma si disegna a bassa risoluzione e si ingrandisce a pixel netti, con palette limitata e contorni. Si ottiene l'aspetto dello screenshot senza disegnare a mano centinaia di sprite, e ogni mostro nuovo nel bestiario ha subito la sua figura. Vale solo per Cantari di Ventura: la lobby 3D della Taverna resta com'è.

### 1. Cosa rende bello il riferimento

Guardando lo screenshot, l'effetto viene da sei cose; sono queste che copiamo, non la grafica.

1. **Pixel grossi e tutti della stessa misura**: nessun pixel a metà, niente sfumature morbide.
2. **Contrasto freddo/caldo**: pavimento blu pietra, luce arancio di lava e torce. Il caldo guida l'occhio.
3. **Figure piccole ma leggibili**: proporzioni da bambola (testa grande, arma grande), contorno scuro che le stacca dal fondo.
4. **Visuale a tre quarti dall'alto**, fissa, senza rotazione.
5. **Ricompense che si vedono**: numeri che saltano, monete ed EXP che schizzano a terra, "Level up!" grande.
6. **Pannello in basso caldo**, con slot rotondi a cornice metallica: il gioco "si tocca" lì.

### 2. La catena di disegno (un fotogramma)

1. **Scena 3D a bassa risoluzione** su un bersaglio fuori schermo (`WebGLRenderTarget`, filtro `Nearest`), con colore, profondità e normali.
2. **Passata unica di rifinitura** alla stessa bassa risoluzione: contorni da profondità e normali, luce a bande, palette, retino solo sulle sfumature.
3. **Ingrandimento intero** sullo schermo (×3, ×4…) con pixel netti, più uno spostamento di frazioni di pixel per uno scorrimento morbido della telecamera.
4. **HUD sopra**, a risoluzione piena: numeri, barre, testi, slot, con un carattere pixel e scala intera anche lui.

Una sola passata di rifinitura e una bassa risoluzione: il costo per pixel crolla, quindi il pixel 3D dovrebbe andare **più veloce** del 3D di oggi, non più lento.

### 3. Risoluzione e telecamera

| Schermo | Larghezza in pixel d'arte | Scala | Eroe alto |
| --- | --- | --- | --- |
| Telefono in verticale (390 pt) | 192–240 | intera, la più grande che ci sta | 22–26 px |
| Telefono in orizzontale | 400–480 | intera | 22–26 px |
| TV 1080p | 480 (× 270) | ×4 | 24–28 px |
| TV 4K | 480 (× 270) | ×8 | 24–28 px |

- **Telecamera ortografica**, inclinata di **55°** sul piano, senza rotazione: come il riferimento. Due livelli di zoom, entrambi a scala intera (mai zoom continuo: romperebbe i pixel).
- **Telecamera agganciata ai pixel**: la posizione si arrotonda ai pixel d'arte nello spazio della vista, e il resto (meno di un pixel) si applica nell'ingrandimento. Senza questo i bordi "strisciano" quando la telecamera si muove: è l'errore più comune del pixel 3D.
- Il contratto di A12 "telecamera obliqua che coincide con il viewBox SVG" si abbandona: l'SVG non disegna più la mappa. I tocchi si traducono proiettando sullo sfondo (piano a terra → esagono), e per le figure si sceglie la più vicina al dito entro 24 pt. Niente raggi di selezione.

### 4. Luce e colore

- **Luce a bande**: 3 livelli (luce, mezzaluce, ombra) più un riflesso freddo dal basso. Niente sfumature continue sulle figure: è ciò che le fa sembrare disegnate.
- **Palette fissa da 40 colori**, nostra: 8 rampe da 5 toni (pietra fredda, erba, legno, pelle, metallo, fuoco, magia, notte). Ogni pixel si porta al colore più vicino con una tabella 32×32×32 calcolata una volta (confronto in spazio Oklab, che rispetta come l'occhio vede i colori).
- **Retino** (Bayer 4×4) solo su cielo, nebbia di guerra e aloni; mai su figure e testo.
- **Freddo sotto, caldo sopra**: luce ambiente blu-violacea, luci puntiformi calde (torce, fuoco, magie). Al massimo 4 luci dinamiche; le altre si cuociono nei colori dei vertici.
- **Luce di contorno** (rim) sulle figure, calda per gli eroi e fredda per i nemici: si leggono anche su fondo scuro.
- Per ambiente e momento cambia solo la tabella delle luci: giorno, tramonto, notte (luna blu e finestre accese), sotterraneo (torce), perdizione (viola-rossa alle soglie 25/50/75, come già in A12).

### 5. Contorni

- **Contorno esterno** di 1 pixel d'arte, scuro (il tono più scuro della rampa, non nero), dove la profondità salta: stacca figure e oggetti dal pavimento.
- **Filo di luce interno** di 1 pixel, più chiaro, dove la normale cambia molto su spigoli convessi: i bordi di pietre, scudi, tetti "brillano" come nel pixel art fatto a mano.
- Il pavimento non prende contorni (solo i salti di quota), altrimenti la scena diventa rumorosa.

### 6. Figure (eroi e mostri)

- Si parte dalle **miniature di AMIN** (già 23 mostri, 3 capi, eroi da razza e classe), con proporzioni nuove da bambola: testa 35–40% dell'altezza, arma e scudo ×1,4, piedi piccoli. Sono una tabella di misure in `28g`, non un rifacimento.
- **Animazioni procedurali**, senza fotogrammi disegnati: respiro (su e giù di 1 px), passo (molleggio e dondolio), colpo (anticipo indietro, scatto avanti, ritorno), lancio (braccia alte, bagliore), colpito (lampo bianco per 1 fotogramma e spinta indietro), a terra (si corica e sbiadisce). Bastano rotazioni e spostamenti dei pezzi delle miniature.
- **Otto direzioni** di sguardo, scattanti (non rotazione continua): il pixel resta pulito.
- **Base colorata** sotto i piedi: oro per gli eroi, rossa per i nemici, bianca per i compagni guidati dall'IA. Anello che pulsa sotto l'eroe scelto.
- Se un telefono fatica: le stesse miniature si **cuociono in fogli di sprite** (8 direzioni × pose) all'avvio o in fase di build, e si disegnano come quadrati piatti. Stesso aspetto, costo minimo. È il piano B, non il punto di partenza.

### 7. Terreno e ambienti della battaglia

- **Pavimento a tessere** come nel riferimento: lastre di pietra, erba con ciuffi, terra battuta, assi di legno. Le tessere sono **16×16 pixel generate dal codice** all'avvio (canvas, seme fisso), 4–6 varianti per materiale, montate in un atlante.
- **Gli esagoni non si vedono** in gioco: il pavimento è libero. Si accendono come contorno sottile solo in pausa o quando si dà un ordine di movimento.
- **Rialzi** come gradini netti con fianco scuro; muri e colonne alti 2–3 volte un eroe, con la parte che coprirebbe le figure resa trasparente a retino quando ci passa dietro qualcuno.
- **Un tema per bioma** (già in A12): foresta, rovine, palude, sotterraneo, torre, fortezza della corona. Ogni tema = materiali del pavimento + 6–10 oggetti di scena + tabella delle luci.
- **Superfici vive** (fuoco, veleno, ghiaccio, acqua) come macchie pixel animate a 8 fotogrammi al secondo, con la loro luce.

### 8. Mappa del mondo

- Stessa catena, telecamera più alta: un pixel d'arte vale più terreno. Il terreno è **continuo** (altezze ricavate dagli esagoni e smussate), con le tessere a lato delle colline, boschi fatti di alberelli pixel, acqua che luccica a retino.
- **Segnalini da gioco di comando di truppe**: la miniatura dell'eroe (o del capo della compagnia) con uno **stendardo** sopra che porta il numero dei membri. I gruppi nemici hanno il loro stendardo, rosso, con un'icona di famiglia.
- **Luoghi** come piccoli edifici pixel (città murata, villaggio, santuario, torre, antro), con fumo dai camini e luci la sera.
- **Nebbia di guerra** a retino scuro; **ombre delle nuvole** che scorrono; **sentiero** tratteggiato quando si dà un ordine di cammino.
- La telecamera **segue il segnalino scelto**, a tre quarti dall'alto: terza persona, mai prima persona.

### 9. Il "succo": riscontri che fanno sentire ogni colpo

| Evento | Cosa si vede | Durata |
| --- | --- | --- |
| Colpo a segno | Numero bianco che salta in arco, lampo bianco sul colpito, spinta 1–2 px | 0,6 s |
| Critico | Numero oro più grande con contorno, fermo-immagine 60 ms, scossa 2 px | 0,8 s |
| Mancato | Scritta "Mancato" grigia, piccola | 0,5 s |
| Cura | Numero verde che sale, scintille | 0,6 s |
| Stato alterato | Icona pixel sopra la testa + tinta (fiamme, veleno verde, gelo azzurro) | finché dura |
| Nemico sconfitto | Si sbriciola in pixel, cadono monete ed EXP | 0,7 s |
| Bottino | Monete e sfere EXP rimbalzano a terra, poi volano al contatore in alto | 1 s |
| Livello | Colonna di luce sull'eroe, "Livello su!" grande al centro, suono dedicato | 1,5 s |
| Potere di un capo | Area segnata a terra in rosso che si riempie prima di esplodere | il lancio |

I numeri restano leggibili anche a ×2: al massimo 8 numeri in volo insieme, quelli in più si sommano.

### 10. HUD sul telefono (verticale)

- **In alto** (64 pt): ritratti degli eroi in campo con barra dei PF e stati; a destra oro e perdizione.
- **Al centro**: il campo, almeno il 60% dell'altezza.
- **In basso** (180 pt), pannello **legno e ottone** (lo stile già scelto): barra con 4–6 abilità rotonde a cornice metallica e anello di ricarica, poi Pausa, velocità ×1/×2, atteggiamento dell'eroe.
- Tutti i bersagli toccabili almeno **44 pt** (regola di A13). Spiegazioni solo nelle schede che si aprono al tocco, come per il resto della Taverna.
- **Niente emoji**: icone pixel nostre, 16×16, disegnate dal codice o a mano nell'atlante.
- **Carattere pixel** con accenti italiani, con licenza libera (OFL) da registrare in `docs/CREDITS.md`; un solo carattere per tutto l'HUD, usato a scala intera.
- **Sulla TV**: campo a tutto schermo; in alto i ritratti di tutti i giocatori con il nome del telefono; niente barra abilità (sta sui telefoni).

### 11. Prestazioni e ripiego

- Bersagli: 60 fps su telefono medio, mai sotto 30; al massimo 30 chiamate di disegno e 60 mila triangoli per scena; una sola passata di rifinitura.
- Il ripiego di oggi resta: senza WebGL, o sotto 18 fps nei primi secondi, si torna alla vista SVG. In tempo reale l'SVG si anima con interpolazione, con le stesse regole di gioco.
- Prima del ripiego si prova un gradino intermedio: fogli di sprite al posto delle miniature e niente contorni interni.

### 12. Come si controlla che sia fatto bene

Con la skill `verifica-render-3d`, a 390 pt e a 1080p: nessun pixel d'arte di misura diversa (controllo automatico sui blocchi), nessun colore fuori palette, contorni presenti su tutte le figure, telecamera che scorre senza bordi tremolanti, fps registrati. Ogni step grafico consegna 3 schermate: foresta di giorno, sotterraneo con torce, notte con perdizione alta.

## Gli step

Tredici step, ognuno pensato per una o più sessioni dedicate: chi prende uno step legge solo la sua parte, le Decisioni e i Principi. Tre punti di controllo con te: dopo B1 (l'aspetto), dopo B6 (la sensazione della battaglia), dopo B8 (il mondo).

### B0 — Carta di progetto (½ sessione)

- **Scopo**: mettere per iscritto le nuove regole prima del codice, così gli step successivi non si contraddicono.
- **Perché per primo**: le conversioni turni → secondi e le regole delle compagnie toccano 5–6 file; se si decidono a metà lavoro, si rifà due volte.
- **Cosa si fa**: `docs/AVVENTURA-B.md` (questo piano), aggiornamento di `docs/rules/avventura.md` (tempo reale, pausa, atteggiamenti, compagnie, rinforzi), glossario nuovo (ritmo, ricarica, lancio, atteggiamento, compagnia, rinforzo).
- **Fatto quando**: le tabelle di conversione e le regole delle compagnie sono scritte e non ci sono domande aperte sui numeri.

### B1 — Prototipo della catena pixel ★ controllo con te

- **Scopo**: vedere il pixel 3D vero, su un'arena fissa con 3 eroi e 4 scheletri, prima di toccare le regole.
- **Perché ora**: la grafica è il desiderio principale e il rischio principale. È indipendente dal motore, quindi si può provare subito e buttare senza danni.
- **Cosa si fa**: bersaglio a bassa risoluzione, ingrandimento intero, telecamera ortografica a 55° agganciata ai pixel, contorno esterno semplice, palette provvisoria. Pagina di prova `?prova=pixel` con interruttore tra 3D di oggi e pixel, e le miniature che camminano in cerchio per vedere lo scorrimento.
- **File**: nuovo `app/24hp-pixel.js` (catena e ingrandimento), nuovo `motori/28h-avv-palette.js` (palette e tabella dei colori, puro, con test).
- **Fatto quando**: 3 schermate (telefono verticale ai due livelli di zoom, TV 1080p) senza pixel di misura diversa, scorrimento senza tremolio, fps misurati su un telefono vero. Tu approvi dimensione delle figure e colori.
- **Stato** (4 novembre 2026, ramo `feat/avv-b1`, sopra B0): **fatto, in attesa del controllo con te**. Catena in `app/24hp-pixel.js` (`Pixel`, agganciata con `Scena3D.disegna`), palette e misure in `motori/28h-avv-palette.js` (`APAL`, + `tests/test_avv_palette.js`), pagina `?prova=pixel` (`PixelProva`; `&t=2` ferma il cammino), scenario `avv_pixel` in `tools/test-browser/`. Controllati in automatico: ogni pixel d'arte è un blocco s×s di un solo colore (telefono ×4/×5/×6/×8, dpr 2,625, TV ×4, anche sulla schermata composta dal browser), nessun colore fuori palette, telecamera spostata di frazioni ⇒ stessa immagine spostata di pixel interi, contorni solo nei toni più scuri. **Manca**: fps su un telefono vero (il WebGL software del browser di prova dà 5 fps a 1170×2532, non dice nulla; il disegno costa ~2 ms di CPU a fotogramma) e la tua approvazione.
- **Scelte prese** (non scritte nel piano):
  - Lo zoom cambia solo la scala intera dello schermo, non il mondo: l'eroe resta 24 pixel d'arte, i pixel diventano più grossi. Vicino = max(s+1, ⌊s·4/3⌉): a dpr 3 ×6 (195 px d'arte) e ×8 (147).
  - Scala del telefono verticale = ⌊larghezza in pixel veri / 192⌋: la larghezza d'arte sta fra 192 e 256 (a 375 pt e dpr 2 viene 250, poco sopra i 240 del piano). Il canvas lavora sui pixel veri del dispositivo, anche con dpr frazionario.
  - Eroe di 24 pixel d'arte ovunque (anche in TV); pixel per unità del mondo fissi, dall'umano guerriero di riferimento (`APAL.ALT_RIF` = 43 unità).
  - Confronto in Oklab con la tinta che pesa il doppio della luce: senza, i muri grigi illuminati dalle torce diventavano rosa pelle.
  - Palette provvisoria generata in OKLCH (scuri freddi, chiari caldi); «metallo» è un grigio caldo (ossa, pietra alle torce), «pietra» un grigio freddo azzurro.
  - Contorno esterno sul pixel dietro il salto di profondità (fuori dalla figura), soglia 5 unità: le fessure fra le tessere e il pavimento in pendenza non lo prendono, il rialzo sì.
  - Anche le miniature si posano su pixel interi del piano della vista (spostandole in profondità), così non cambiano forma mentre camminano.
  - La prova salta l'ingresso nella Taverna (`25-avvio`) e mette la battaglia di prova in `Bat.s` solo in memoria, senza salvarla.
- **Da sapere per B2**: le fessure fra le tessere esagonali si vedono come una griglia scura (sono vuoti, non contorni); torce sui muri piccole al punto da sembrare figure; luce a bande, filo di luce interno e retino non ci sono ancora; 49 chiamate di disegno per la scena di prova (il piano ne vuole ≤ 30: B11).

### B2 — Luce, contorni, tessere e temi

- **Scopo**: portare il prototipo al livello del riferimento.
- **Cosa si fa**: luce a bande con riflesso freddo, palette definitiva da 40 colori in Oklab, contorni esterni e filo di luce interno, retino su cielo e nebbia, tessere 16×16 generate dal codice per 4 materiali, 6 temi di bioma, luce di contorno sulle figure, proporzioni "da bambola" in `28g`, otto direzioni di sguardo.
- **Perché separato da B1**: B1 decide *se* lo stile ci piace, B2 lo rifinisce. Rifinire prima del sì è lavoro sprecato.
- **File**: `24hp-pixel.js`, `24hn-scena3d.js` (materiali a bande), `28f-avv-scena.js` (tessere e temi), `28g-avv-mini.js` (proporzioni).
- **Fatto quando**: le 3 schermate di controllo (foresta di giorno, sotterraneo con torce, notte con perdizione) passano i controlli della sezione 12.
- **Stato** (4 novembre 2026, ramo `feat/avv-b2`, sopra B1): **fatto**. Le 3 scene di controllo (pagina `?prova=pixel`, bottoni «Scena» o `&scena=foresta|sotterraneo|notte`) passano in automatico, a 390 pt (dpr 2 e 2,625) e a 1080p: ogni pixel d'arte è un blocco intero anche sulla schermata composta, nessun colore fuori palette, contorno su tutte le figure in vista, filo di luce sempre un tono più chiaro della stessa rampa, nebbia a retino tutta del suo colore, scorrimento a pixel interi (retino e tessere compresi), fps registrati (scenario `avv_pixel`, 41 controlli; schermate `pixel-<scena>-telefono|tv.png` in `SCHERMATE_DIR`). Il 3D di oggi non cambia: tutto passa da `Scena3D.pixel(true)` (scenari `avv_3d`, `avv_battaglia`, `avv_prestazioni` verdi). **Manca**: fps su un telefono vero (il WebGL software del browser di prova dà 5 fps; il disegno costa ~2,5 ms di CPU) e la tua approvazione di B1 e di palette e luci.
- **Scelte prese** (non scritte nel piano):
  - Bande nei materiali standard di oggi con una divisa (`uBande`), senza ricompilare: per ogni luce t = N·L × intensità (1 = sole pieno); t > 0,6 luce, t > 0,25 mezzaluce (metà), sotto ombra. Così luna (0,34) e sole del sotterraneo (0,42) non danno mai luce piena e le torce fanno anelli netti. Niente riflessi speculari, mappa d'ambiente e toni ACES nella resa pixel.
  - Ambiente blu-viola e riflesso freddo (facce rivolte in basso) come «tinta + forza» in `ASCE.lucePx`; luce di contorno sulle facce di profilo, mai sotto: calda sugli eroi, fredda sui nemici (`ASCE.RIM`).
  - Filo di luce ricavato dalla profondità (spigolo convesso = pixel più vicino della media dei vicini di oltre 0,42 unità), senza un bersaglio delle normali: niente seconda passata della scena.
  - Maschera delle figure nell'alfa del bersaglio (0,5): nebbia mai sulle figure; le figure trasparenti (spettri, nascosti) restano fuori dalla maschera.
  - Retino, cielo e nebbia ancorati al mondo (pixel del piano della vista), non allo schermo: scorrendo non «nuotano». Cielo = 3 toni dall'alto al basso; nebbia = ellisse ai bordi dell'arena (dal 72% al 115% del raggio).
  - Tessere: 4 materiali (lastre, erba con ciuffi, terra battuta, assi) × 6 varianti, numeri della palette in `ASCE.tessera16`; 1 texel = 1 pixel d'arte (x·k, z·k·sen 55°), variante scelta per cella 16×16 nello shader, tono ±1 per tema; fianchi dei muri a lastre un tono più scuri. Bersaglio di misura pari, perché i centri dei pixel cadano a metà dei texel.
  - Temi: bosco e pianura → foresta, strada e collina → rovine, antro → sotterraneo, città → fortezza della corona (all'aperto); 14 oggetti nuovi in `ASCE.parti` (ceppo, tronco, cespuglio, funghi, colonna rotta, statua, sarcofago, barile, lapide, ossa, scaffale, libri, candele, braciere, stendardo, più l'abete). Sotterraneo e torre usano sempre la luce «sotterraneo».
  - Muri alti 40 (quasi un eroe) solo nella resa pixel, le quote di gioco non cambiano; la parte che copre le figure **non** è ancora trasparente a retino (sezione 7: B5).
  - Fino a 4 luci puntiformi, le più vicine al centro dell'arena; le altre restano solo fiamme (non ancora cotte nei vertici: B11). Il peso delle fiamme dipende dal momento (`fiamme`: 0 di giorno, 0,6 al tramonto, 1 di notte e al chiuso). La luce del fuoco sul pavimento sta a 16 di quota.
  - Perdizione: tinge poco la luce (10/16/22%, sennò l'erba diventa marrone) e molto cielo e nebbia: viola a 25 e 50, rossa a 75.
  - Fuoco sul pavimento nella resa pixel: letto di braci con 7 fiamme a cono, non l'esagono acceso.
  - Proporzioni: le teste di AMIN sono già al 44–60% dell'altezza, quindi la tabella `AMIN.BAMBOLA` ingrandisce solo quelle sotto il 38% (al massimo ×1,2); mani, armi e scudi ×1,4 attorno alla presa, gambe ×0,75 di spessore; solo eroi e mostri a due gambe (`bip:1`).
  - Otto direzioni: lo sguardo scatta a 45° solo al disegno; la logica tiene l'angolo continuo.
  - Palette definitiva disegnata in OKLCH (distanza minima 0,038); i colori si ritoccano ancora solo in `APAL.RAMPE`. La tabella 32³ porta in alfa il numero del colore (0–39), non più della rampa.
  - Pagina di prova: bottoni Scena, Tema, Ora, Perdizione (e `&tema=`, `&fase=`, `&perd=`); nemici della famiglia del tema.
- **Da sapere per i prossimi step**: 50 chiamate di disegno e ~30 mila triangoli in TV (il piano vuole ≤ 30: B11); acqua ancora piatta e superfici non animate (B6); i muri alti possono coprire una figura dietro (B5).

### B3 — Motore della battaglia a istanti

- **Scopo**: il cuore del tempo reale, puro e testato, senza grafica.
- **Perché si può fare in parallelo a B1–B2**: non tocca nulla di visivo.
- **Cosa si fa**: nuovo stato `{ t, rng, cb, ordini, … }` con `passo` e `ordina`; movimento di casella in casella a velocità fissa con percorso di AGRI; ritmo delle armi; poteri con lancio, interruzione e ricarica; reazioni automatiche; durate degli stati in secondi; Concentrazione a tempo; attacchi di opportunità all'uscita dalla portata; ingresso dei rinforzi da un bordo; fine (vittoria, sconfitta, fuga). Il vecchio ASCO resta finché la vista non passa al nuovo.
- **File**: nuovo `motori/27s-avv-tempo.js` (motore a istanti) + `tests/test_avv_tempo.js`; piccoli adattatori in `27d` (durate) e `27e` (costi → tempi), senza cambiare cosa fanno i poteri.
- **Test**: riproducibilità (stessi ordini ⇒ stesso hash), velocità (battaglia intera < 200 ms), ogni potere usato almeno una volta senza errori, nessun `Math.random`.
- **Fatto quando**: due bot si combattono in node dall'inizio alla fine su tutte le arene.
- **Stato** (4 novembre 2026, ramo `feat/avv-b3`, sopra B2): **fatto**. Motore `motori/27s-avv-tempo.js` (`ATEM`: `nuovo`, `passo(s, n)`, `ordina(s, ordine | [ordini])`, `ricarica` per gli anelli della barra; `{ qui: true }` lavora sullo stato passato, per chi simula), adattatori `ASTA.aTempo`/`scorri` (27d) e `APOT.tempi`/`ritmo`/`pesoArma` (27e), bot di prova `tests/bot_avv_tempo.js`, `tests/test_avv_tempo.js` (~4 s). Due bot bravi finiscono la battaglia (vittoria o sconfitta) sulle 8 arene generate e sulle 3 dei capi; stessi ordini ⇒ stesso hash anche dopo 3000 istanti, a passi spezzati e ripresi da un salvataggio; battaglia intera ~30 ms in node (la più lenta ~65); tutti gli 85 poteri non di reazione usati senza errori; bravo vince il 94 % dei gruppi medi, casuale il 22 %; nessun `Math.random`, orologio o trigonometria. Il vecchio ASCO non cambia. **Manca**: niente di B3; le battaglie dei bot durano ~15–30 s (il ritmo si tara in B12).
- **Scelte prese** (non scritte nel piano):
  - Un passo occupa subito la cella nuova (`mv:{ da, k, n }` dice alla grafica da dove scivola): così due creature non entrano mai nella stessa cella e l'attacco di opportunità scatta alla partenza. Nessuno attraversa nessuno (nemici, alleati e chi è a terra): se la strada è chiusa si aspetta mezzo secondo; chi trova la meta occupata si ferma accanto.
  - A ogni istante agiscono tutti, a istanti alterni prima gli eroi e prima i nemici; chi è stordito resta fermo anche a metà passo.
  - Tempi dei poteri «azione»: lancio 0,6 s (a volontà), 0,8 (a scontro), 1,0 (riposo breve), 1,2 (riposo lungo), +0,3 per cerchi, coni e linee; ricarica 6 s per tutti, le cariche contate come prima. Bonus: ricarica 3 s. Consumabili: come i poteri della stessa forma.
  - Ritmo delle armi: leggera = d4 o d6 accurata (pugnali, spada corta, fionda); pesante = a due mani da mischia, due dadi o d10+; media il resto (archi e balestra compresi). Mostri: sciame o danno ≤ 4 leggero, ≥ 10 pesante. Dopo un potere il colpo successivo aspetta un ritmo intero.
  - Il lancio si interrompe (nessuna carica spesa) con un ordine nuovo, se chi lancia non può agire o se viene spinto; un colpo da solo non lo interrompe. Se al rilascio il bersaglio non va più bene, il potere non parte e si riprova.
  - Un bonus già a portata parte subito e lascia stare l'ordine principale (`rapidi`, scade dopo 2 s); fuori portata diventa l'ordine principale (ci si avvicina). Dopo un potere su un nemico l'ordine diventa «attacca» lo stesso nemico.
  - Concentrazione a tempo: l'ordine `conc` spende 1 punto e dà vantaggio a ogni tiro per colpire per 6 s; il ritiro del d20 di A4 sparisce. La reazione (opportunità compresa) torna dopo 6 s; l'attacco furtivo torna ogni 6 s.
  - Durate: un giro = 6 s = 60 istanti per tutti gli stati (anche quelli «fino all'inizio»); danni nel tempo e superfici ogni 6 s; il ghiaccio fa scivolare (fermo 1 s).
  - Iniziativa: d20 + iniz porta a un ritardo d'ingresso da 1 s (tiro 0) a 0 (tiro 25); la parte sorpresa parte 6 s dopo. Rinforzi (eroi e nemici con `dist` ≥ 1) dopo 3 s per esagono, dal bordo della loro parte. Stallo a 6 minuti (`opz.tMax`).
  - Chi non ha ordini colpisce da solo il nemico a portata più vicino; tutto il resto (atteggiamenti, pausa automatica) è di B4. Fuga solo a uno a uno (`fuggi`: va all'uscita più vicina ed esce); niente resa, nascondersi, aiutare e spingere a mano in questo step. La geometria (vista, forme, spinta) è copiata da ASCO, che sparirà con B5.

### B4 — Atteggiamenti e IA in tempo reale

- **Scopo**: dare un cervello a eroi e nemici quando il giocatore non tocca nulla.
- **Cosa si fa**: i 4 atteggiamenti degli eroi (Assalto, Difesa, Supporto, Tieni la posizione); per i nemici, il comportamento di BEST (`ia.mira`, `fuga`, branco…) tradotto in decisioni ogni 0,5 s; i capi con poteri annunciati (area rossa a terra prima del colpo). Bilanciamento grezzo: bot bravo vince, bot casuale perde sui gruppi medi.
- **File**: `motori/27j-avv-ia.js` esteso (o `27t` nuovo se diventa troppo lungo), test.
- **Fatto quando**: una battaglia giocata solo con gli atteggiamenti è vinta dal bot bravo almeno nell'85% dei casi "medi".
- **Stato** (5 novembre 2026, ramo `feat/avv-b4`, sopra B3): **fatto**. Cervello nuovo `motori/27t-avv-ia-tempo.js` (`AIAT`: `pensa(s)` dà gli ordini senza toccare lo stato, `applica`, `tick` = pensa + applica, `avanza(s, n)` fa girare il tempo pensando ogni 0,5 s, `gioca` una battaglia intera; `imposta(s, eroe, atteggiamento)` e `automatico(s, eroe, potere, on)` per la vista; `{ qui: true }` come in ATEM) e `tests/test_avv_ia_tempo.js` (~15 s, rientra nei lenti perché il nome contiene `avv_ia`). Misure sui gruppi «medi» (livelli 2–3, 3–4 eroi, 300 battaglie su arene diverse): **solo con gli atteggiamenti scelti bene** (guerriero Difesa, mago Tieni la posizione, chierico Supporto, ladro Assalto) e **senza** nessun «Uso automatico» il gruppo vince il **91 %**; con gli atteggiamenti di partenza il 92 %; con «Uso automatico» acceso il 97 %; con gli eroi a ordini casuali il 31–38 %. Nessun ordine scartato e nessuno stallo in oltre mille battaglie, una battaglia intera con l'IA da entrambe le parti ~20–35 ms (la più lenta ~100). **Manca**: niente di B4; la vista (pausa automatica, scelta degli atteggiamenti e dei poteri automatici, area rossa disegnata) è B5–B6.
- **Scelte prese** (non scritte nel piano):
  - Modulo nuovo `27t` invece di allungare `27j` (che serve ancora al vecchio ASCO a turni); usa i campi di BEST (`ia.dist`, `mira`, `fuga`, `arrende`, `apre`, `hook.branco`) senza cambiarli.
  - L'IA pensa ogni 5 istanti (0,5 s) e dà solo ordini che il motore accetta; ogni suo ordine porta `ia: true`, e così sa distinguere i propri da quelli del giocatore (anche dopo che ATEM trasforma un potere finito in «attacca»). Un ordine dato a mano non viene toccato finché non finisce; poi l'IA riprende. Un ordine a mano sposta il punto da tenere di «Tieni la posizione».
  - Atteggiamenti: **Assalto** (punta il più debole vicino, i curatori e i maghi contano di più; chierico e bardo non lo hanno di partenza), **Difesa** (resta accanto all'alleato più fragile e ferma chi gli si avvicina a 4 caselle), **Supporto** (cura, rialza chi è a terra, rinforza; poi tira da lontano), **Tieni la posizione** (fissa la casella, colpisce solo ciò che arriva a portata, se lo spostano torna). Di partenza chierico e bardo sono in Supporto, gli altri in Assalto.
  - **Uso automatico** (richiesta del piano per gli eroi): i poteri a volontà e l'attacco base partono sempre da soli; quelli a cariche o a riposo e la Concentrazione solo se il giocatore li ha accesi uno per uno. Le cure sono a cariche, quindi un Supporto che deve curare ha bisogno dell'«Uso automatico» sul suo potere. I mostri usano tutto.
  - I nemici scelgono il bersaglio da `ia.mira` (vicino, debole, curatore, incantatore) con due correttivi: non puntare tutti lo stesso eroe (−1,2 a punteggio per ogni alleato che già lo punta) e il branco (+2 se un alleato è già accanto al bersaglio). Chi sta per arrendersi non si bersaglia. Fuga a `ia.fuga` PF (`fuggi`); resa sotto il 25 % per chi ha `arrende` (nuovo ordine ATEM `arrendi`: l'esito è «arreso», non conta più nella battaglia). Il potere di apertura (`ia.apre`) vale ×1,6 la prima volta; gli stati dei poteri sono valutati come in AIA.
  - **Aree annunciate**: ATEM ha `zonaDi(s, chi)` (le caselle del lancio in corso) e l'evento `lancia` porta `zona`. Chi lancia un potere ad area fissa la cella o la direzione al momento dell'ordine, così l'area non «segue» i bersagli. Gli eroi comandati dall'IA escono dall'area rossa se fanno in tempo (contando anche il passo già in corso); un eroe comandato a mano resta dov'è e la prende. I mostri non si scansano.
  - Gli oggetti (`oggetto`) non li usa l'IA da sola; la pausa automatica e le impostazioni sono della vista (B5). I livelli di difficoltà dell'IA (Racconto, Normale, Eroica) si tarano in B12.
  - Piccoli ritocchi a ATEM, solo in aggiunta: ordine `arrendi`, `zona`/`zonaDi`, marcatura `ia` sugli ordini (mantenuta quando un potere diventa «attacca»); `tests/test_avv_tempo.js` passa invariato.

### B5 — Vista della battaglia in tempo reale

- **Scopo**: giocare davvero una battaglia sul telefono.
- **Cosa si fa**: ciclo di gioco (10 istanti/s di logica, 60 fps di disegno con interpolazione), tocchi tradotti in ordini, selezione e anello sotto l'eroe, griglia visibile solo in pausa, pausa e pausa automatica, velocità ×1/×2, HUD verticale (ritratti in alto, pannello legno e ottone in basso con 4–6 abilità), animazioni procedurali delle miniature, ripiego SVG animato.
- **File**: `app/24he-battaglia.js` e `24hc-bat-mappa.js` ridotti a HUD, `24ho-scena-fx.js` (animazioni continue), CSS `39a-avventura.css`.
- **Fatto quando**: una battaglia del capitolo si gioca dall'inizio alla fine su telefono a 390 pt, con bersagli ≥ 44 pt e nessun blocco.
- **Stato (5 novembre 2026)**: fatto, PR #93 dal ramo `feat/avv-b5` (sopra B4, #92). Lo scenario `avv_tempo` gioca lo scontro del casale dei Salici dal racconto fino a «Continua» a 390 px: pausa iniziale con griglia, HUD (64 + campo ≥ 60% + pannello ≤ 180), ogni bersaglio ≥ 44 px, tocchi → ordini, abilità a bersaglio, ×2, ricarico a metà, nessun errore; poi una battaglia nel 3D con le miniature in moto.
- **Scelte prese** (non scritte sopra: la più semplice):
  1. **Vista nuova** `app/24hq-bat-tempo.js` (`BatT`) invece di ridurre `24he`/`24hc` a HUD, perché la battaglia di prova della pagina Avventura e la co-op (A11) giocano ancora a turni con ASCO fino a B10. `Bat` resta il padrone di `Bat.s`, del salvataggio e della schermata di fine e passa la mano a `BatT` quando lo stato è di ATEM (`Bat.tempo()`); `24hc` ha tre ritocchi (griglia a richiesta, anello ai piedi, tocco con il punto).
  2. **Quali battaglie**: quelle della campagna in solitario (del racconto e del mondo) partono a istanti con `{ tempo: true }` in `CAMP.battaglia`/`AVV.battaglia`; ATEM ha `daCampagna` e `riepilogo` con le stesse forme di ASCO, e l'esito entra con `Bat.riep`. Una battaglia a turni già salvata si riprende a turni.
  3. **Ciclo**: un solo `requestAnimationFrame`; la logica avanza a passi di 100 ms (×2 = due passi), al massimo 6 per fotogramma; il disegno interpola fra la foto dell'istante prima e quella dopo (esagono frazionario e quota). Nel 3D `Scena3D.muovi` sposta le miniature a ogni fotogramma (in pausa ogni 250 ms).
  4. **Tocchi**: eroe in piedi = sceglilo; eroe a terra = rialzalo; nemico = attaccalo; esagono = vai lì. Vale la figura disegnata più vicina al dito (chi cammina sta fra due esagoni). Abilità: «se» e «aura» partono subito; a bersaglio singolo si tocca il bersaglio (quelli validi sono cerchiati); ad area (cerchio, cono, linea) il primo tocco mostra l'area, il secondo nell'area lancia. Un ordine dato in pausa parte alla ripresa.
  5. **Barra**: fino a 5 tasti (poteri non di reazione, poi oggetti della cintura, poi Concentrazione) + «Tutte», che apre il foglio con ogni abilità e l'interruttore «Uso automatico» (solo per i poteri non a volontà). L'anello è un'ombra che si accorcia con la ricarica; il tasto si accende mentre si lancia. Atteggiamento: tasto con il nome, foglio con le quattro scelte.
  6. **Pausa automatica**: nel menu della battaglia (salvata in `bat-pausa`). Accese: inizio, eroe sotto ¼ dei PF, nemico nuovo, capo che prepara un'area; spenta: eroe senza bersaglio (3 s fermo senza ordini). La battaglia si ferma anche con un foglio aperto e riparte sempre in pausa dopo un ricarico; si salva ogni 3 s di gioco e a ogni pausa.
  7. **Aree rosse** dei nemici che lanciano (`ATEM.zonaDi`): esagoni rossi semitrasparenti sopra la mappa; la pausa automatica del capo dice di uscirne.
  8. **Animazioni**: nuove nel 3D il passo (molleggio e dondolio), il lancio (si alza e brilla) e le otto direzioni scattanti (anche per affondi e dardi); restano respiro, affondo, dardo, lampo, scossa e caduta di A12. Nell'SVG: molleggio, bagliore durante il lancio, scatto al colpo.
  9. **Niente dado a schermo**: si vedono i numeri, «Mancato» e «Critico!»; il registro scrive chi manca chi, i poteri preparati e interrotti.
- **Rimandato**: trascinare per la formazione (Principi, punto 7); i suggerimenti del tutorial in battaglia sono spenti nel tempo reale (B9 li adatta); carattere e icone pixel dell'HUD (Resa grafica, punto 10): per ora le icone SVG di sempre.

### B6 — Il succo ★ controllo con te

- **Scopo**: far sentire ogni colpo, come nel riferimento.
- **Cosa si fa**: tutta la tabella della sezione 9 (numeri, critico con fermo-immagine, mancato, cure, stati sopra la testa, sbriciolamento, bottino che vola al contatore, "Livello su!"), suoni dedicati in `28c-avv-audio.js` / `24hk-audio-avv.js`.
- **Perché dopo B5**: il succo si tara guardando il gioco che si muove, non a vuoto.
- **Fatto quando**: tu giochi una battaglia e il ritmo ti convince. Qui si decide se la battaglia è quella giusta prima di passare al mondo.

### B7 — Motore del mondo continuo e compagnie

- **Scopo**: il mondo continuo da gioco di comando di truppe, puro e testato.
- **Cosa si fa**: stato v4 di CAMP con segnalini (eroe o compagnia), movimento continuo lungo i percorsi sugli esagoni nascosti, orologio che avanza solo col movimento o col riposo; **Unisciti / Staccati**; gruppi nemici che inseguono chi è più debole e scappano da chi è più forte, in tempo; contatto e rinforzi entro 4 caselle; perdizione, notte e luoghi come oggi. `CAMP.migra` porta i salvataggi v3 a v4 (ogni eroe diventa un segnalino a sé).
- **Attenzione alle regole di Firestore**: il riepilogo del posto salvato deve tenere le stesse chiavi, altrimenti `avventuraOk` rifiuta il salvataggio e serve ripubblicare le regole.
- **File**: `28-campagna.js`, `27m-avv-mondo.js`, `27o-avv-mostri.js`, `28a-avv-orchestratore.js` (aggancio battaglia e rinforzi) + test.
- **Fatto quando**: in node, una compagnia si forma, si divide, uno dei due incontra un gruppo e l'altro arriva come rinforzo; un salvataggio v3 si apre in v4.

### B8 — Vista della mappa del mondo ★ controllo con te

- **Scopo**: vedere e girare il mondo.
- **Cosa si fa**: terreno continuo pixel con tessere ai fianchi delle colline, boschi, acqua a retino, luoghi come edifici pixel, stendardi su segnalini e gruppi nemici, nebbia a retino, ombre delle nuvole, sentiero tratteggiato, telecamera che segue il segnalino scelto, barra in basso con i segnalini, Unisciti/Staccati, Riposa.
- **File**: `app/24hg-mondo-mappa.js` e `24hh-mondo-pannelli.js` (ridotti a HUD), scena del mondo in `24hn` / `24hp`.
- **Fatto quando**: fai un giro di mondo dalla città alla prima missione, con un incontro, e il viaggio ti piace.

### B9 — Capitolo 1 e tutorial adattati

- **Scopo**: "La Corona Spezzata" giocabile da capo a fondo nella nuova forma.
- **Cosa si fa**: scontri scritti a mano rivisti (arene, ondate di rinforzi, capi con poteri annunciati), eventi e dialoghi agganciati ai luoghi della mappa continua, tutorial nuovo (pausa, atteggiamenti, unirsi/staccarsi), regole in-game aggiornate.
- **File**: `src/avventura/*.json`, `27q-avv-racconto.js`, `27r-avv-eventi.js`, `28d-avv-tutorial.js`, `07d-regole.js`.
- **Fatto quando**: il capitolo si chiude in solitario con il bot bravo e a mano.

### B10 — Co-op con TV e telefoni

- **Scopo**: giocare in compagnia, ognuno col suo eroe.
- **Cosa si fa**: la TV simula e disegna; i telefoni diventano controller (scheda dell'eroe, abilità, minimappa, Pausa); istantanee leggere su RTDB 4 volte al secondo; ordini via SYNC; pausa condivisa; chi entra a metà vede subito lo stato; chi esce lascia l'eroe all'IA con l'ultimo atteggiamento. Sulla mappa ognuno muove il suo segnalino e le compagnie si formano tra telefoni.
- **File**: `motori/28e-avv-stanza.js`, `app/24hm-avv-stanza.js`, `24f-schermo.js` (vista TV orizzontale 480×270).
- **Fatto quando**: TV + 2 telefoni giocano 30 minuti senza desincronia, consumo RTDB misurato e dentro il piano gratuito.

### B11 — Prestazioni e piano B grafico

- **Scopo**: che giri bene anche su telefoni modesti.
- **Cosa si fa**: misura su un telefono lento; se serve, miniature cotte in fogli di sprite all'avvio, contorni interni spenti, meno luci; gradini automatici prima del ripiego SVG.
- **Fatto quando**: 30 fps minimi sul telefono più lento di prova, oppure ripiego pulito e senza perdita di stato.

### B12 — Bilanciamento e rilascio

- **Scopo**: rifare i numeri di A13 per il tempo reale e rilasciare.
- **Cosa si fa**: le 4 leve di ADIF (gruppi, vite, perdizione, esperienza) ritarate con ~2000 battaglie simulate per difficoltà; durata di un cantare ≈ 1 ora; rifinitura grafica finale; regole in-game; PR di rilascio.
- **Fatto quando**: Normale vinta dal bot bravo con 1–2 vite perse a capitolo, Eroica sopra le 2, Racconto senza perdite; test e verifica grafica tutti verdi.

## Ordine, stime, rischi e domande

Il lavoro dura circa **25–30 sessioni**; la prima battaglia giocabile e bella arriva a metà strada, dopo B6. Grafica (B1–B2) e regole (B3–B4) non dipendono l'una dall'altra e si possono alternare.

```text
Grafica e regole in parallelo fino alla prima battaglia
(★ = controllo con te prima di andare avanti)

              ┌─▶ B1★ Prova pixel ─▶ B2 Luce e temi ─┐
B0 Carta ─────┤                                      ├─▶ B5 Battaglia ─▶ B6★ Succo ─┐
              └─▶ B3 Motore tempo ─▶ B4 IA e bot ────┘
                                                                                    │
   ┌────────────────────────────────────────────────────────────────────────────────┘
   ▼
B7 Motore mondo ─▶ B8★ Vista mondo ─▶ B9 Capitolo 1 ─▶ B10 Co-op TV ─▶ B11 Prestazioni ─▶ B12 Rilascio
```

B1, B6 e B8 sono i punti in cui ti mostro il risultato e decidi se andare avanti così.

| Step | Sessioni |
| --- | --- |
| B0 Carta di progetto | ½ |
| B1 Prova pixel | 2 |
| B2 Luce, contorni, temi | 2–3 |
| B3 Motore a istanti | 3 |
| B4 IA e atteggiamenti | 2 |
| B5 Vista battaglia | 3 |
| B6 Succo | 1–2 |
| B7 Motore del mondo | 3 |
| B8 Vista del mondo | 2–3 |
| B9 Capitolo 1 | 2 |
| B10 Co-op TV | 3 |
| B11 Prestazioni | 1–2 |
| B12 Bilanciamento e rilascio | 2 |

**Rischi**

- **Consumo di Claude Pro**: B1, B2, B5 e B8 sono le sessioni grafiche più pesanti. Conviene farle quando hai margine e chiudere ogni sessione con una PR piccola.
- **Determinismo**: un solo `Math.sin` o `Math.random` nel motore rompe TV e salvataggi. Il test di riproducibilità di B3 è il guardiano.
- **Regole di Firestore**: se cambia la forma del riepilogo salvato, `avventuraOk` rifiuta i salvataggi finché non ripubblichi le regole. B7 prova a non toccarle.
- **Banda RTDB in co-op**: stimata dentro il piano gratuito, ma va misurata in B10 prima di invitare gli amici.
- **Telefoni lenti**: il pixel a bassa risoluzione aiuta, ma le luci dinamiche no. B11 esiste per questo.
- **Somiglianza con il vecchio pixel**: per Regicidio X il pixel era stato abbandonato perché sembrava una copia del progetto precedente. Qui la differenza la fanno 3D, luce a bande e contorni; B1 serve anche a verificarlo.

**Decise la sera del 1 novembre 2026**

- Battaglia sul telefono **in verticale**, come il resto della Taverna (la TV resta orizzontale).
- **Pausa in co-op**: la può mettere chiunque.
- **Zoom a due livelli**, entrambi a scala intera.
- **Carattere pixel**: uno libero già pronto, con accenti italiani e licenza OFL.
