/* ---- opzioni del pupazzo e conversioni: usate dalla Taverna 3D, dalla creazione del personaggio e dal crocevia ---- */
var OPT={
  skin:[0xf6d7bd,0xf0c4a0,0xe0aa80,0xc48a5e,0x9a6440,0x6a4028,0x9ad0a0,0xa8b8e8],
  body:[['snello','Snello'],['normale','Normale'],['robusto','Robusto']],
  height:[['basso','Basso'],['medio','Medio'],['alto','Alto']],
  eyes:[['tondi','Tondi'],['grandi','Grandi'],['felici','Felici'],['assonnati','Assonnati'],['stelle','Stellati']],
  brows:[['nessuna','Nessuna'],['sottili','Sottili'],['folte','Folte'],['arrabbiate','Arrabbiate']],
  mouth:[['sorriso','Sorriso'],['neutra','Seria'],['stupita','Stupita'],['ghigno','Ghigno'],['lingua','Linguaccia']],
  nose:[['piccolo','Piccolo'],['tondo','Tondo'],['lungo','Lungo']],
  ears:[['normali','Normali'],['grandi','Grandi'],['elfo','Da elfo']],
  blush:[[false,'No'],[true,'Guance rosse']],freckles:[[false,'No'],[true,'Lentiggini']],
  glasses:[['none','Niente'],['tondi','Occhiali'],['monocolo','Monocolo'],['benda','Benda da pirata']],
  hair:[['short','Corti'],['long','Lunghi'],['bun','Chignon'],['coda','Coda'],['ricci','Ricci'],['cresta','Cresta'],['bald','Calvo']],
  hairc:[0x1a1210,0x3a2414,0x6a3a1c,0xc8902a,0xe8c87a,0xb04a1a,0x9a9a9a,0xf2f2ee,0x3a6ac8,0xc84a8a],
  beard:[['none','Nessuna'],['baffi','Baffi'],['pizzetto','Pizzetto'],['corta','Corta'],['lunga','Lunga']],
  outfit:[['veste','Veste'],['tunica','Tunica'],['abito','Abito lungo'],['grembiule','Grembiule'],['armatura','Armatura']],
  robe:[0x9a3a1c,0x1c2f4d,0x23402e,0x3a2a48,0x5a2a1a,0x2a2a2a,0x8a6a2a,0x6a1a3a,0x2a6a6a,0xd8c8a8],
  collar:[['gorgiera','Gorgiera'],['sciarpa','Sciarpa'],['none','Nessuno']],
  collarc:[0xcfc2a2,0xf2ede0,0xb03a2a,0x2a4a8a,0x3a6a2a,0x111111],
  beltc:[0x1a0f09,0x6a3a1c,0x8a2424,0x2a2a2a],
  cape:[['none','Niente'],['mantello','Mantello']],capec:[0x6a1a2a,0x1c2f4d,0x23402e,0x2a2a2a,0x8a6a2a],
  head:[['none','Niente'],['brim','Cappello'],['hood','Cappuccio'],['beret','Basco'],['top','Cilindro'],['bandana','Bandana'],['elmo','Elmo'],['fiori','Fiori'],['crown','Corona']],
  hatc:[0x4a2410,0x121c30,0x2a1a10,0x6b5a3a,0x8a2424,0x111111,0x2a5a3a,0xd8c8a8],
  prop:[['none','Niente'],['boccale','Boccale'],['libro','Libro'],['spada','Spada'],['lanterna','Lanterna'],['liuto','Liuto'],['pipa','Pipa'],['fiore','Fiore']],
  jewel:[['none','Niente'],['orecchini','Orecchini'],['collana','Collana']]
};
var TABS=[['corpo','Corpo','',[['Corporatura','body'],['Altezza','height'],['Carnagione','skin']]],
  ['viso','Viso','',[['Occhi','eyes'],['Sopracciglia','brows'],['Bocca','mouth'],['Naso','nose'],['Orecchie','ears'],['Guance','blush'],['Lentiggini','freckles'],['Occhiali','glasses']]],
  ['capelli','Capelli','',[['Taglio','hair'],['Colore','hairc'],['Barba','beard']]],
  ['abiti','Abiti','',[['Vestito','outfit'],['Colore','robe'],['Colletto','collar'],['Colore colletto','collarc'],['Cintura','beltc'],['Mantello','cape'],['Colore mantello','capec']]],
  ['extra','Accessori','',[['In testa','head'],['Colore','hatc'],['In mano','prop'],['Gioielli','jewel']]]];
function hex(c){return '#'+('00000'+c.toString(16)).slice(-6)}

var FIGBASE={robe:0x9a3a1c,head:'brim',hatc:0x4a2410,skin:0xf0c4a0,hair:'short',hairc:0x3a2414,beard:'none',glasses:'none',blush:false,freckles:false,collar:'gorgiera',collarc:0xcfc2a2,beltc:0x1a0f09,prop:'none',body:'normale',height:'medio',eyes:'tondi',brows:'sottili',mouth:'sorriso',nose:'tondo',ears:'normali',jewel:'none',outfit:'veste',cape:'none',capec:0x6a1a2a};
/* un aspetto a caso fra tutte le opzioni (stesse regole del pulsante «Casuale» del guardaroba) */
function figCaso(){var o=Object.assign({},FIGBASE);TABS.forEach(function(t){t[3].forEach(function(r){var L=OPT[r[1]],v=L[Math.floor(Math.random()*L.length)];o[r[1]]=typeof v==='number'?v:v[0]})});return normFig(o)}
/* pupazzo 3D <-> pupazzetto a pixel delle altre lobby (palette dell'app passate da fuori) */
function hx(c){return parseInt(String(c).slice(1),16)}
function figNear(list,c){var best=0,bd=1e9;list.forEach(function(x,k){var v=hx(Array.isArray(x)?x[0]:x),d=Math.abs((v>>16)-(c>>16))+Math.abs((v>>8&255)-(c>>8&255))+Math.abs((v&255)-(c&255));if(d<bd){bd=d;best=k}});return best}
function figPix(o,C,S){var t={beret:0,crown:1,hood:2,elmo:3,none:4,top:5,brim:5,bandana:0,fiori:4}[o.head];return{t:t==null?4:t,h:figNear(C,o.head==='none'?o.hairc:o.hatc),c:figNear(C,o.robe),s:figNear(S,o.skin)}}
