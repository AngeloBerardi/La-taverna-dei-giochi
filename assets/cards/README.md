# Illustrazioni delle carte figura

Metti qui un file per carta, **WebP, 1000×1400 px (5:7), meno di 150 KB**: `JH.webp` … `KS.webp`, più `X.webp` per il Jolly.
Nome = rango + seme (J/Q/K + H cuori, D quadri, C fiori, S picche). Alla build, ogni file presente sostituisce il disegno vettoriale di quella carta; le carte senza file restano com'erano. Cornice, indici, valore e pergamena li mette il gioco: l'immagine deve essere **solo la scena**, senza bordo né testo.
Convertire: `cwebp -q 80 -resize 1000 1400 in.png -o JH.webp`.
