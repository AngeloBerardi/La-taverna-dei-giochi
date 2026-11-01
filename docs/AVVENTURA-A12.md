# A12 — Grafica 3D di Cantari di Ventura (piano e contratti)

Stato: **fatta** (1 novembre 2026). Piano generale in `docs/AVVENTURA.md` (sezione A12); qui il progetto tecnico.

## 1. Idea in una frase
Un **canvas three.js sotto l'SVG**, con una telecamera obliqua che coincide *al pixel* col `viewBox` dell'SVG: il 3D disegna terreno, rilievi, alberi, edifici, miniature, fuoco e incantesimi; l'SVG resta sopra con tutto ciò che serve a giocare (evidenziazioni, barre dei PF, stati, etichette, numeri, dado) e continua a ricevere **tocchi, trascinamento, pizzico e rotella** come oggi. Niente raggi di picking, niente doppioni dei gesti, nessuna riscrittura delle viste A5/A6.

Perché obliqua e non prospettica: le due mappe SVG sono già proiezioni oblique (battaglia: righe schiacciate di `SQ = .84`, altezze come sollevamento in pixel; mondo: dall'alto, `SQ = 1`). Con la matrice
`x' = X`, `y' = Z·SQ − Y·L` (L = pixel per unità di altezza = 1), `profondità = −Y`
un punto a terra cade esattamente dove l'SVG disegna il centro della sua cella e un'altezza `h` lo alza di `h` pixel, come i `prisma()` di `BatMappa`. La profondità resta corretta (più in alto = più vicino lungo il raggio di vista), quindi muri e alberi nascondono ciò che sta dietro senza trucchi. Le luci e le ombre usano le normali vere: l'aspetto è 3D pieno, solo la telecamera è «da tavolo».

## 2. Cosa cambia per chi gioca
- Battaglia: pavimento a scacchi con spigoli, rialzi, muri, colonne/alberi/rocce, **miniature** di eroi (da razza, classe e aspetto del ritratto) e di mostri (una per ognuno dei 23 del bestiario, più grandi per i capi), pozze di fuoco/veleno/ghiaccio/acqua vive, **fiamme sui personaggi «in fiamme»**, dardi e scoppi colorati per tipo di danno, cadute e scossoni.
- Mappa del mondo: esagoni con rilievo (colline, montagne, boschi con alberi, paludi con canne, acque più basse e lucide), strade, luoghi come piccoli edifici (città con mura e torri, villaggio, santuario, rovina, torre, antro, campo), **nebbia di guerra** (celle non viste scure e basse, viste-ma-lontane smorzate), **giorno/notte** (sole caldo ↔ luna blu con finestre accese), **perdizione** (tinta e foschia alle soglie 25/50/75).
- Tutto è facoltativo: senza WebGL, con telefono lento (sotto ~18 fps nei primi secondi) o con «Grafica 3D: no» nella pagina Avventura resta la vista SVG di sempre, identica. Il passaggio non perde lo stato (si ridisegna la stessa schermata).

## 3. Moduli
| File | Costante | Ruolo |
|---|---|---|
| `motori/28f-avv-scena.js` | `ASCE` | **puro** (+ `tests/test_avv_scena.js`): geometria condivisa con l'SVG, descrizione logica di arena e mondo (celle, altezze, oggetti, superfici, nebbia, luoghi), luce per fase/ambiente/perdizione, matrice di proiezione e rettangolo visibile dal `viewBox`, `hash` deterministico per variare gli oggetti (mai `Math.random`) |
| `motori/28g-avv-mini.js` | `AMIN` | **puro** (+ `tests/test_avv_mini.js`): le miniature come elenco di pezzi (`forma, colore, posizione, misure`): eroi da razza/classe/aspetto, 23 mostri + 3 capi per archetipo, base colorata per fazione; limiti di numero pezzi e di ingombro |
| `app/24hn-scena3d.js` | `Scena3D` | carica three.js su richiesta, canvas persistente, telecamera sincronizzata, costruzione delle scene (geometrie fuse per colore-vertice: 1–3 chiamate di disegno per il terreno), sonda dei fps e ripiego, impostazione utente |
| `app/24ho-scena-fx.js` | `Scena3D.fx` | miniature animate (passo, rotazione, scossa, caduta), fuoco e veleno a particelle, dardi e scoppi per tipo di danno, pozze animate |
| `css/39h-scena3d.css` | prefisso `s3-` | canvas sotto l'SVG, SVG trasparente in modalità 3D, ritocchi dei segnalini |

Agganci nelle viste esistenti (poche righe, tutte protette da `Scena3D.on()`): `BatMappa.svg`/`MoMappa.svg` saltano il terreno quando il 3D è attivo; `BatMappa.applica`/`MoMappa.applica` avvisano la telecamera; `BatAnima.metti/cls/passo` avvisano le miniature; `afterRender()` chiama `Scena3D.dopo()`.

## 4. Contratti
- `ASCE.proiez({vb:[x,y,w,h], px:[W,H], SQ, L})` → `{vis:{cx,cy,w,h}, m:[16 numeri, colonna per colonna], schermo(X,Y,Z)}`; `schermo` dà il punto SVG di un punto 3D (usato nei test e per allineare).
- `ASCE.arena(A)` → `{modo:'bat', SQ, tiles:[{q,r,x,z,h,tipo,scac,oggetto,sup}], uscite, riquadro}`; `ASCE.mondo(s)` → `{modo:'mon', SQ:1, tiles:[{q,r,x,z,t,visto,vicino,h,oggetto,luogo}]}`. I colori non stanno qui: li prende il rendering da `BatMappa.PAL` e `MoMappa.COL` (una sola fonte).
- `AMIN.eroe(c,{pelle,capelli,mantello})` e `AMIN.mostro(def)` → `{alt, parti:[…], base:{r,col}}`. Ogni parte: `['c'|'s'|'b'|'k', '#colore', x, y, z, a, b, c, rot?]` (cilindro/sfera/scatola/cono; y = centro).
- `Scena3D.on(modo)` → vero solo se la scena 3D è pronta **e** non è stata disattivata; le viste lo chiedono a ogni disegno.
- Posizioni 3D: `X = x_svg`, `Z = y_svg / SQ`, `Y` = altezza in pixel (rialzo 6, muro 18, albero ~30, montagna ~26).

## 5. Prestazioni (telefoni economici)
Un'arena di 120 celle = 1 mesh di terreno + 1 di oggetti fissi; ogni miniatura = 1 mesh (pezzi fusi con colori per vertice); materiali `MeshStandardMaterial` `flatShading` condivisi; una sola luce con ombra (1024); pixel ratio ≤ 2 e ≤ 1600 px di lato; si disegna **a richiesta** (cambio stato, gesto, animazione in corso) e a ~12 fps solo se ci sono fiamme/acqua visibili; scheda nascosta = nessun disegno. Sonda: se nei primi 24 fotogrammi la media supera 55 ms si torna all'SVG e si ricorda la scelta (`localStorage avv-3d = lento`; «Riprova» nella pagina Avventura).

## 5b. Dettaglio e qualità (modello: l'esempio «animation keyframes» di three.js)
Richiesta dell'utente (1 novembre 2026): ispirarsi a quell'esempio per dettaglio e qualità. Ciò che l'esempio fa, e che qui si riprende senza caricare modelli esterni (tutto procedurale, costo zero):
- **Luce da ambiente cotto da un cielo procedurale** (`PMREMGenerator.fromScene` su una cupola a gradiente con sole/luna) come `scene.environment`: ombre morbide, riflessi su ottone, acciaio, acqua e vetro; una sola luce direzionale in più per le ombre. Cielo diverso per giorno, notte, antro/torre e perdizione.
- **Tone mapping ACES e colore sRGB** corretti, antialias, colori dei vertici convertiti in lineare.
- **Piccoli modelli ricchi e animati**, non solide forme: finestre e camini sulle case, fumo che sale, bandiere e stendardi che sventolano, alberi che ondeggiano (spostamento nel vertex shader, nessun costo per oggetto), canne e erba, acqua con onde e riflessi, fiaccole e fuochi che tremano, corvi che girano sulle rovine, fiamme sui personaggi.
- **Occlusione cotta nei vertici** (scurimento verso il basso e negli incavi): dà profondità ai poligoni piatti senza texture.
- Respiro dell'insieme: un dettaglio che si muove sempre da qualche parte, ma disegnando a ~12 fps e solo se la scena è visibile.

## 6. Compiti
1. A12.1 `ASCE` + test. 2. A12.2 `AMIN` + test. 3. A12.3 `Scena3D` (canvas, telecamera, arena, miniature) + agganci battaglia. 4. A12.4 mondo (rilievi, luoghi, nebbia, giorno/notte, perdizione) + agganci mappa. 5. A12.5 effetti e animazioni. 6. A12.6 impostazione utente, regole in-game, scenario `avv_3d` (allineamento al pixel, ripiego, 390 px e TV), screenshot, documenti, PR.

## 6b. Com'è andata (scelte da ricordare)
- Le superfici (fuoco, veleno, ghiaccio, acqua) sono pozze a due strati: bordo scuro opaco nella mesh del terreno + strato lucido sopra; il fuoco è emissivo e tremola (`uLum`), le altre usano `envMapIntensity` basso (sotto 1 il riflesso del cielo le lava a bianco).
- Il pavimento di sfondo è `toneMapped:false` e usa il `bg` dell'ambiente di `BatMappa.PAL`: stesso colore dell'SVG.
- I sistemi di particelle vivono nel gruppo `fx`, che **`svuota()` non tocca**: lo svuotamento li staccava e le fiamme sparivano (trovato misurando i pixel con/senza `K.g.fx`).
- «Riduci animazioni» (`RM`): niente ambiente, ondeggiare, tremolio né onde; la scena si ridisegna solo a richiesta.
- Prove: `tests/test_avv_scena.js`, `tests/test_avv_mini.js` (puri) e scenario `avv_3d` (browser, WebGL software): telecamera = viewBox (scarto < 0,6 px), per ogni segnalino SVG la differenza fra «con» e «senza» miniature nel canvas, ripiego «No»/«lento», zoom, notte più scura, particelle visibili; in `avv_tv` la TV a 1280×720.

## 7. Fuori da A12
Miniature sulla mappa del mondo (restano i segnalini piatti col ritratto: leggibili e già toccabili), rotazione libera della telecamera, vista TV dedicata (A11 la lascia ai fogli ingranditi), musica/suoni nuovi.
