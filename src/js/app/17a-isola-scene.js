/* ===== L'ISOLA: scene a figura intera (illustrazione piatta, senza contorni) e sfondo dell'isola =====
   Formica (1), Volpe (9), Orso polare (15); le altre scene sono in 17b. azArt (17) resta solo come ripiego per una carta senza scena.
   Ogni scena è una carta verticale 100×138: ambiente, animale intero nella sua posa, ombra a terra. Riferimento: docs/rules/isola-dei-predatori.md. */
const IP=(d,f,x='')=>`<path d="${d}" fill="${f}" ${x}/>`,IE=(cx,cy,rx,ry,f,x='')=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" ${x}/>`;
const IL=(d,c,w)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ISCENA={
 /* Formica: sottobosco visto da vicino, porta via un petalo della Pianta */
 1:()=>`<rect width="100" height="138" fill="#b9dd8c"/>`+IE(18,30,34,26,'#9fcf74')+IE(86,48,30,34,'#8cc264')+IP('M-4 60C20 40 44 44 60 20C64 44 50 70 20 84Z','#6fae4c')+IP('M104 96C84 80 72 60 78 34C92 46 104 60 104 76Z','#5c9c40')+IL('M2 62C24 52 44 44 58 24','#8cc264',1.4)
  +IP('M-2 104C20 94 44 100 62 96C80 92 92 98 102 94V140H-2Z','#8a5a36')+IP('M-2 112C24 104 50 110 70 106C84 103 94 107 102 104V140H-2Z','#74482a')+IE(16,122,5,3,'#a8754a')+IE(84,126,6,3.4,'#a8754a')+IE(60,130,3,2,'#5c3820')
  +IE(52,114,34,4,'#4a2c18','opacity=".45"')
  +IL('M46 92L38 102L40 113M52 94L56 104L58 113M58 90L70 98L74 112','#5e1f0f',2.6)
  +IP('M78 80C88 58 76 34 54 26C52 46 60 68 78 80Z','#ff8fb5')+IL('M76 77C76 60 68 44 56 30','#e9628f',1.4)
  +IE(29,90,17,12.5,'#b3401f','transform="rotate(-12 29 90)"')+IE(25,85,9,5,'#cf5a30','transform="rotate(-12 25 85)"')+IE(42,90,4,3.6,'#7c2a14')+IE(53,87,10.5,8.5,'#a83a1c')+IE(71,79,11.5,10.5,'#b3401f')+IE(68,75,5,3.4,'#cf5a30')
  +IL('M47 92L36 99L30 113M53 95L50 104L48 113M59 92L66 102L64 113','#7c2a14',3)
  +IL('M72 70L80 58L92 60M67 70L70 56L80 52','#7c2a14',2)+IP('M79 84L86 82L82 89Z','#5e1f0f')+`<circle cx="75" cy="78" r="2.8" fill="#1b110c"/><circle cx="74" cy="77" r="1" fill="#fff"/>`,
 /* Volpe: bosco d'autunno al tramonto, in agguato */
 9:()=>`<rect width="100" height="138" fill="#f6c98a"/><rect width="100" height="40" fill="#f9dba4"/><circle cx="74" cy="34" r="13" fill="#fff0c8"/>`
  +IP('M-2 70C20 54 40 62 58 56C78 50 92 58 102 54V140H-2Z','#d98c5a')+IP('M8 74L18 36L28 74ZM24 78L36 30L48 78ZM70 76L80 40L90 76ZM86 78L96 46L106 78Z','#a8523a')+IP('M-2 84L6 52L16 84ZM52 82L62 44L72 82Z','#8c3f30')
  +IP('M-2 86C24 78 50 84 72 80C86 78 96 82 102 80V140H-2Z','#8f9a44')+IP('M-2 112C20 104 44 110 66 106C82 103 94 108 102 105V140H-2Z','#6a7836')
  +IL('M10 108l2-8M14 108l-1-9M84 100l2-8M88 100l-1-8M30 126l2-8M34 126l-1-9','#56642c',1.6)+IP('M16 64l5-2-1 5zM88 66l4 1-3 4zM44 50l4-3 0 5z','#e9822e')
  +IE(52,117,34,4,'#3f4a20','opacity=".5"')
  +IP('M34 92C14 96 2 80 8 60C12 56 16 58 16 64C18 76 28 80 40 84Z','#e0762a')+IP('M8 60C4 68 5 78 10 84C12 76 14 68 16 62C14 58 10 58 8 60Z','#fff6e8')
  +IL('M40 98L37 114M64 98L67 114','#c9661f',5.5)+IL('M38.4 107L37 114M66 107L67 114','#3a2a22',5.5)
  +IP('M30 88C34 74 60 72 72 78C80 84 78 98 68 100L38 100C30 99 28 94 30 88Z','#e9822e')+IP('M64 82C72 86 74 94 68 100L58 100C62 94 63 88 64 82Z','#fff6e8')
  +IL('M46 99L48 115M71 96L76 113','#e9822e',5.5)+IL('M47.2 108L48 115M74 107L76 113','#3a2a22',5.5)
  +IP('M72 68L69 52L81 62Z','#e9822e')+IP('M80 64L84 49L90 66Z','#e9822e')+IP('M70.4 57L69 52L73.4 55.6Z','#3a2a22')+IP('M83 54L84 49L86.6 55Z','#3a2a22')
  +IP('M69 73C72 62 88 62 92 73L99 81C93 87 84 89 76 87C71 85 68 79 69 73Z','#e9822e')+IP('M80 83L99 81C93 87 86 89 79 87Z','#fff6e8')
  +`<circle cx="97.6" cy="80.6" r="2.2" fill="#2a1a14"/>`+IP('M82 72.4L88.6 74.6L83 76.4Z','#2a1a14')+IL('M80.6 70.6L88.6 73.2','#7a3a14',1.2),
 /* Orso polare: banchisa, in piedi a braccia alte */
 15:()=>`<rect width="100" height="138" fill="#bfe3f2"/>`+IP('M-2 26C24 10 56 30 102 12V40C60 50 30 34 -2 48Z','#d6f3e6','opacity=".8"')
  +IP('M-2 84L16 50L30 72L46 42L64 74L80 54L102 84Z','#eaf6fb')+IP('M16 50L30 72L24 84L8 84ZM46 42L64 74L54 84L40 84ZM80 54L102 84L84 84Z','#cfe6f0')
  +`<rect y="84" width="100" height="54" fill="#2f6f9a"/>`+IP('M-2 96C20 92 40 98 60 94C78 90 92 96 102 94V104H-2Z','#3d82ad')
  +IP('M4 112L20 104H82L96 112L88 126H12Z','#b9d9ea')+IP('M4 112L20 104H82L96 112Z','#f7fcff')+IP('M-2 132l10-4 12 4 12-4 12 4 12-4 12 4 12-4 12 4 8-3v10H-2Z','#3d82ad')
  +IE(50,112,30,3.4,'#b9d9ea')
  +IE(37,100,10.5,13,'#f1f6f9')+IE(63,100,10.5,13,'#f1f6f9')+IE(35,111,11.5,4.6,'#fdfdfb')+IE(65,111,11.5,4.6,'#fdfdfb')
  +IL('M33 62L17 40M67 62L83 40','#fdfdfb',14)+IL('M67 62L83 40','#e3ecf2',14)+IL('M68 60L82 41','#fdfdfb',9)
  +IP('M50 42C73 42 79 70 77 90C75 110 25 110 23 90C21 70 27 42 50 42Z','#fdfdfb')+IE(64,80,11,24,'#e3ecf2','opacity=".7"')+IE(50,88,15,17,'#eef4f8')
  +`<circle cx="15.5" cy="38" r="8.4" fill="#fdfdfb"/><circle cx="84.5" cy="38" r="8.4" fill="#fdfdfb"/>`+IL('M10 31.6l-1.6-4M15.4 29.6l0-4.4M20.8 31.4l1.6-4M79.2 31.4l-1.6-4M84.6 29.6l0-4.4M90 31.6l1.6-4','#33424e',1.7)
  +`<circle cx="37.6" cy="22.6" r="5.6" fill="#fdfdfb"/><circle cx="62.4" cy="22.6" r="5.6" fill="#fdfdfb"/><circle cx="37.6" cy="22.8" r="2.6" fill="#c5d6e2"/><circle cx="62.4" cy="22.8" r="2.6" fill="#c5d6e2"/>`
  +IE(50,35,15.5,14.5,'#fdfdfb')+IE(50,41.6,9.6,8,'#eaf1f6')+IP('M43.6 42C46 53 54 53 56.4 42Z','#7a2330')+IP('M45 42.4l1.6 4 1.6-4zM51.8 42.4l1.6 4 1.6-4z','#fff')+IE(50,37.4,3.8,2.7,'#1f2a33')
  +`<circle cx="43" cy="31.4" r="1.9" fill="#1f2a33"/><circle cx="57" cy="31.4" r="1.9" fill="#1f2a33"/>`+IL('M39.4 27.6l6 2.2M60.6 27.6l-6 2.2','#33424e',1.5)
};
/* l'illustrazione di una carta: la scena nuova se c'è, altrimenti il disegno di prima */
const isleArt=id=>ISCENA[id]?`<svg viewBox="0 0 100 138" preserveAspectRatio="xMidYMid slice" class="iart isc">${ISCENA[id]()}</svg>`:`<svg viewBox="0 0 100 100" class="iart">${ISD}${azArt(id)}</svg>`;
/* l'isola vista dall'alto, sotto la griglia (si stira sulla griglia: 6 colonne × 6 righe) */
const ISOLA_D='M14 10C34 2 60 6 84 4C102 3 114 12 116 30C119 52 113 70 116 92C119 116 112 138 94 144C72 150 50 143 30 146C12 148 4 134 5 114C6 92 1 72 4 50C6 30 2 16 14 10Z';
function isleSfondo(){const palma=(x,y,k,r)=>`<g transform="translate(${x} ${y}) scale(${k}) rotate(${r})">${IE(2.4,3,10,9,'#0b3d2a','opacity=".28"')}${[0,51,103,154,206,257,309].map((a,i)=>`<path d="M0 0C3 -5 6 -10 1 -15C-4 -10 -3 -5 0 0Z" fill="${i%2?'#3f9a4a':'#2f8540'}" transform="rotate(${a})"/>`).join('')}<circle r="2.2" fill="#7a5a34"/></g>`;
 const sasso=(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})">${IE(.6,1,5,3.4,'#00000030')}${IP('M-5 1C-5 -3 -1 -4 2 -3.4C5 -3 5.6 0 4 2C1 3.4 -4 3 -5 1Z','#9aa3a8')}${IP('M-3 -1C-2 -3 1 -3.2 3 -2.6C1 -2 -1 -1.6 -3 -1Z','#c3cace')}</g>`;
 const ciuffo=(x,y)=>IL(`M${x} ${y}l-1.6-4M${x+1.2} ${y}l.2-5M${x+2.4} ${y}l1.8-3.6`,'#6aa84a',.9);
 let grana='';for(let i=0;i<46;i++){const x=12+(i*37%97),y=14+(i*53%122);grana+=`<circle cx="${x}" cy="${y}" r="${i%3?.5:.8}" fill="${i%2?'#d9bf85':'#fbeec6'}"/>`}
 return`<svg class="isl-bg" viewBox="0 0 120 150" preserveAspectRatio="none" aria-hidden="true">`
  +`<path d="${ISOLA_D}" fill="#8fe3e0" opacity=".5" transform="translate(60 75) scale(1.075) translate(-60 -75)"/><path class="isl-sch" d="${ISOLA_D}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".9" transform="translate(60 75) scale(1.03) translate(-60 -75)"/>`
  +`<path d="${ISOLA_D}" fill="#d9b877"/><path d="${ISOLA_D}" fill="#f1dba0" transform="translate(60 75) scale(.9) translate(-60 -75)"/>${grana}`
  +ciuffo(22,24)+ciuffo(96,30)+ciuffo(14,96)+ciuffo(100,128)+ciuffo(54,138)+sasso(104,16,1)+sasso(110,22,.6)+sasso(12,132,.8)+`<path d="M98 104l1.4 3 3.2.3-2.4 2.2.8 3.2-3-1.7-3 1.7.8-3.2-2.4-2.2 3.2-.3z" fill="#e9785a"/>`
  +palma(13,15,1,10)+palma(107,134,.85,60)+palma(7,74,.6,30)+`</svg>`}
/* Squalo e Balena nuotano intorno all'isola: si toccano come i pulsanti */
function isleNuota(w,on,ok){const d=w==='shark'
  ?IL('M4 26q8-5 16 0t16 0 16 0','#ffffff90',1.6)+IP('M18 26C22 14 28 6 36 2C35 12 37 20 42 26Z','#4a6478')+IP('M30 8C32 14 34 20 38 26H42C37 20 35 12 36 2Z','#33495a')
  :IL('M2 28q8-5 16 0t16 0 16 0','#ffffff90',1.6)+IP('M6 28C10 16 24 12 36 16C44 19 48 24 50 28Z','#2f4f9a')+IP('M10 26C16 18 26 15 36 17C28 17 18 20 12 27Z','#5a7ad0')+IL('M30 14C28 9 31 5 29 1M34 14C37 9 34 5 36 1','#dff4ff',1.6);
 return`<button class="isw isw-${w}${on?' on':''}" data-a="iwater" data-v="${w}" aria-label="${w==='shark'?'Squalo':'Balena'}" aria-pressed="${!!on}" ${ok?'':'disabled'}><svg viewBox="0 0 54 32">${d}</svg></button>`}
