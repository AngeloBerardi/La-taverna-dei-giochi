# L'ultima cena alla Taverna · direzione artistica

**Tono**: leggero, fiaba scura da locanda. Una notte di tempesta, fuoco nel camino, odore di castagne e idromele. Deve sembrare un quadro di genere da taverna di altri tempi illuminato a candela: caldo, intimo, un po' comico, con un solo filo di inquietudine.

## Identità (già nel JSON, `scena`)
- **Colori**: fondo `#140c08` (legno affumicato), carta `#f1e2c0` (pergamena), inchiostro `#2b1a0e`, accento `#e8a33a` (luce di brace), sangue `#8e2a22`.
- **Titoli**: IM Fell English SC (`assets/kit/ultima-cena/titoli.woff2`, OFL), caratteri da stampa antica.
- **Atmosfera**: fuoco, braci, pioggia sui vetri, lampi lontani, vignetta, grana. In cantina (atto 2): polvere nella luce, niente fuoco.
- **Suono**: pioggia, crepitio del camino, brusio della sala; in cantina solo la pioggia attutita. Tema per flauto e tamburo a cornice, re dorico, 96 bpm con un po' di swing.
- **Voce**: calda e lenta (velocità 0,92, tono 0,85), da cantastorie.
- **Effetti**: lampo (atto 1), biglietto (atto 1), buio (atto 2), pendola (atto 3), campana (atto 3).

## Blocco di stile (da incollare in ogni prompt)
> Oil painting in the manner of a 17th-century tavern genre scene, painted on a dark wood panel, warm candlelight and firelight chiaroscuro, rich umber, amber and deep red palette, visible brushstrokes and soft varnish glow, slightly whimsical storybook characters with expressive faces, no text, no letters, no frame, no watermark.

**Ritratti** (aggiungere): `head-and-shoulders portrait, three-quarter view, eyes in the upper third, plain very dark brown background, lit from one side by a candle, vertical 4:5 composition.`
Genera prima **Tobia** e **Bettina**: scegli quella che ti convince e usala come riferimento di stile (o stesso seed) per tutte le altre. I ritratti devono avere la stessa inquadratura e la stessa luce, altrimenti il cast sulla TV sembra un collage.

## Ritratti (`ritratti/<id>.webp`)
Ogni prompt = blocco di stile + riga dei ritratti + descrizione. L'espressione accenna al segreto senza svelarlo.
- **vittima** · Mastro Ugolino Brace: stout bald innkeeper in his sixties with a thick grey beard and bushy eyebrows, stained leather apron over a rust-red shirt, gruff but kind eyes, holding an ornate silver chalice close to his chest.
- **bettina** · Bettina Mestolo, la cuoca: plump middle-aged cook with rosy cheeks and flour on her face, rust-red headscarf over brown hair, flour-dusted apron, a wooden ladle raised like a sceptre, indignant pursed lips.
- **orlando** · Ser Orlando di Ferrobianco, il cavaliere decaduto: lanky ageing knight with a grey moustache and beard, dented steel helmet with an open visor, patched cloak over armour that no longer closes, chin lifted with wounded pride.
- **mirella** · Mirella Corvina, l'erborista: sharp-featured woman with black hair under a moss-green hood, dark shawl, bundles of dried herbs and small glass vials at her belt, watchful narrowed eyes.
- **tobia** · Tobia Lesto, il nipote dell'oste: young man with tousled chestnut hair, good but rumpled ochre shirt, barman's apron, quick charming smile that does not reach his eyes.
- **gisella** · Madama Gisella Dadi, la biscazziera: flamboyant woman in a crimson gown, wide hat with a long black feather, rings on every finger, rolling two dice between her fingers, knowing half-smile.
- **anselmo** · Frate Anselmo, il monaco viandante: round-faced friar with a brown beard, brown hooded habit, a rosary that is suspiciously shiny, pious upward glance and one hand hidden inside the habit.
- **lia** · Lia Liuto, la menestrella: young bard with long golden hair, blue doublet, feathered cap, lute strap across the chest, mouth open mid-song, curious sideways glance.
- **bruno** · Bruno Carro, il mercante di vino: jovial heavy-set merchant with a ruddy face and short beard, wine-red cap, leather waistcoat, wine stains on his sleeves, raising a cup.
- **nora** · Nora del Bosco, la cacciatrice: lean huntress with auburn hair tied back, leaves caught in it, green leather jerkin, bow over her shoulder, alert nostrils as if catching a scent.
- **gualtiero** · Capitan Gualtiero, il capitano della guardia: stern captain with a thick black moustache, polished steel helmet, red sash across his chest, small ledger and quill in hand.

## Luoghi (`luoghi/<id>.webp`, 16:9)
Blocco di stile + `wide interior/exterior scene, no people, cinematic 16:9, darker lower third.`
- **esterno** · La Taverna del Crocevia: a timber-framed roadside inn at a crossroads at night in a violent storm, warm light glowing from small windows, rain slanting, a swinging wooden sign with no lettering, muddy road, lightning far away. (Anche per la copertina.)
- **sala** · Sala grande: crowded-looking but empty tavern hall after a harvest feast, long wooden tables with tankards and roasted chestnuts, garlands of wheat and apples, big stone fireplace blazing, a small stage with a stool, dice on a table.
- **cucina** · Cucina: rustic kitchen with a brick oven, hanging copper pots, flour on the table, trays of chestnut cake, a dark woven herb satchel hanging on a hook by the hearth.
- **cantina** · Cantina: low vaulted stone cellar with rows of oak barrels, a steep wooden staircase coming down from a door of light, a single lantern on the floor, deep shadows.
- **camere** · Camere al piano di sopra: narrow upstairs corridor with low beams and wooden doors, one door ajar on a modest bedroom with a cold fireplace and a writing desk.
- **stalla** · Stalla: wooden stable at night, horses in their stalls, hay, a lantern hanging from a beam, rain dripping through a gap in the roof.

## Oggetti degli indizi (`oggetti/<id>.webp`, 1:1)
Blocco di stile + `still life of a single object on a dark wooden table, close-up, centered, square 1:1, any writing illegible.` Non servono per tutti gli indizi: questi sono quelli che si possono vedere.
- **corpo**: an ornate silver chalice lying overturned on a stone cellar floor beside oak barrels, a small pool of golden mead, a fallen lantern; no person visible.
- **fiala**: an open dark herbalist's satchel with dried herbs and small corked vials, one empty slot, a dusting of chestnut flour on the brass clasp.
- **chiave**: a heavy old iron key with an ornate bow on a worn leather cord.
- **debito**: an open ledger with columns of illegible handwriting and coins stacked beside it, a candle stub.
- **mestolo**: a wooden ladle stained with thick red tomato sauce, lying on a cellar step.
- **calice**: close-up inside an ornate silver chalice, a dark bitter residue at the bottom, a single bitter almond beside it.
- **bruciato**: a half-burnt sheet of paper with illegible handwriting, edges charred, on cold ashes.
- **medaglione**: a silver medallion with an engraved tree, on a fine chain, half hidden in the folds of a brown wool habit.
- **lettera**: a folded letter with a red wax seal of a notary, opened, illegible lines inside.
- **radice**: a black twisted root next to a tiny empty glass vial, a few bitter almonds, on a cloth.
- **cenere**: a small torn corner of stamped paper with part of a red wax seal, half buried in grey fireplace ashes.

## Copertina (`copertina.webp`, 16:9)
Blocco di stile + `the inn at the crossroads at night in a storm seen from the road, warm windows, a single silver chalice glinting on a windowsill in the foreground, empty space on the left third for a title, cinematic 16:9.`
