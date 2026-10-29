/* ---- Sagome dei mostri (Cantari di Ventura, A5.7): un simbolo originale per ogni mostro del bestiario, disegnato a tratto in 24×24 come le altre icone. ----
   Il segnalino è un distintivo a otto lati (gli eroi sono tondi con il ritratto): il colore dice la famiglia, la cornice il ruolo, il simbolo chi è. */
const Sagome={
 // famiglia → colore del distintivo
 FAM:{bestie:'#6f8f3c',banditi:'#9a6a34',nonmorti:'#76638f',torre:'#3f7096'},
 // simbolo di ogni mostro (path in 24×24, tratto 2, nessun riempimento)
 S:{
  'lupo-grigio':'<path d="M4 3l5 5h6l5-5v9l-4 4-2 5h-8l-2-5-4-4z"/><path d="M9 12h.01M15 12h.01M12 16v2"/>',
  'sciame-di-corvi':'<path d="M2 8q2.5-3.5 5 0 2.5-3.5 5 0M12 14q2.5-3.5 5 0 2.5-3.5 5 0M5 19q2.5-3.5 5 0"/>',
  'cinghiale-irsuto':'<path d="M4 11l3-5h10l3 5-2 7H6z"/><path d="M10 14h4v3h-4zM8 15l-3 3M16 15l3 3M9 10h.01M15 10h.01"/>',
  'ragno-tessitore':'<circle cx="12" cy="13" r="3.5"/><path d="M9 11L4 7M9 13H3M9 15l-5 4M15 11l5-4M15 13h6M15 15l5 4M12 9.5V5"/>',
  'orso-bruno':'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M5 10a7 6 0 0 1 14 0v5a7 5 0 0 1-14 0z"/><path d="M9 11h.01M15 11h.01M10.5 15h3"/>',
  'brigante':'<circle cx="11" cy="9" r="5"/><path d="M6 8h10M8 14l-3 7M14 14l4 7M19 4l-6 10"/>',
  'arciere-bandito':'<path d="M6 3q12 9 0 18M6 3v18M3 12h15M14.5 9l3.5 3-3.5 3"/>',
  'cerusico-di-strada':'<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
  'tagliagole':'<path d="M5 20c0-9 6-14 15-16-2 9-8 14-15 16zM5 20l-2 2M9 15l4 4"/>',
  'stregone-rinnegato':'<path d="M12 2L6 17h12zM3 19h18M12 8h.01M12 12h.01"/><path d="M17 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
  'capobanda-corvino':'<path d="M3 14c2-6 7-9 13-8l5-2-2 5c1 6-4 11-10 10l-2 3-1-4z"/><path d="M15 9h.01M21 4l-2 2"/>',
  'scheletro-armato':'<path d="M12 3a8 8 0 0 0-8 8c0 3 1.6 5 4 6v3h8v-3c2.4-1 4-3 4-6a8 8 0 0 0-8-8zM9 12h.01M15 12h.01M5 8h14"/>',
  'arciere-scheletro':'<path d="M5 3q12 9 0 18M5 3v18"/><circle cx="14" cy="11" r="3.5"/><path d="M13 11h.01M15 11h.01M13 14.5v2h2v-2M9 12h3"/>',
  'ghoul-di-tomba':'<path d="M5 21c-1-6 0-11 2-15M10 21c0-6 0-11 1-17M15 21c1-6 2-11 5-15M3 21h18"/>',
  'anima-in-pena':'<path d="M6 21V10a6 6 0 0 1 12 0v11l-2-2-2 2-2-2-2 2-2-2z"/><path d="M9.5 10h.01M14.5 10h.01M11 14q1 1 2 0"/>',
  'officiante-spolpato':'<path d="M8 11L12 2l4 9"/><path d="M7 11h10v4a5 5 0 0 1-10 0zM10 14h.01M14 14h.01M12 19v2"/>',
  're-senza-corona':'<path d="M3 19L5 8l5 5 2-8 2 8 5-5 2 11z"/><path d="M12 5l-2 5 3 3-2 6"/>',
  'famiglio-arcano':'<path d="M3 15c4-7 9-7 13-3l5-3-3 7c-3 4-8 5-12 2z"/><path d="M16 12h.01M20 3l.8 1.7 1.7.8-1.7.8L20 8l-.8-1.7-1.7-.8 1.7-.8z"/>',
  'statua-vivente':'<path d="M9 3h6v5H9zM5 9h14v6H5zM8 15v6M16 15v6M5 9v6M19 9v6"/>',
  'sciame-di-scintille':'<path d="M13 2L5 14h6l-1 8 8-12h-6z"/><path d="M19 4h.01M4 6h.01M20 17h.01"/>',
  'ombra-del-corvo':'<path d="M12 3c-4 0-7 4-7 9v9l3-2 2 2 2-2 2 2 3-2v-7c0-5-3-9-7-9z"/><path d="M9 11q3 3 6 0"/>',
  'custode-fiammeggiante':'<path d="M6 21V11a6 6 0 0 1 12 0v10zM8 13h8M12 13v8"/><path d="M12 1c1 2.5 3 3 1 5.5"/>',
  'maestro-della-torre':'<path d="M7 21V8L5 4h14l-2 4v13zM7 8h10"/><path d="M9 14q3-3.5 6 0-3 3.5-6 0M12 14h.01"/>'},
 // cornice per ruolo (path del distintivo 24×24 attorno al simbolo, disegnato dietro)
 RUOLO:{bruto:'M12 1.5l8 3.5v8l-8 9.5-8-9.5V5z',tiratore:'M12 1.5l8 6v8l-8 7-8-7v-8z',incantatore:'M12 1l9 11-9 11L3 12z',supporto:'M12 2c6 0 10 4 10 10s-4 10-10 10S2 18 2 12 6 2 12 2z',
  sciame:'M7 3h10l5 6-2 9-8 4-8-4-2-9z'},
 // il simbolo di un mostro, in un riquadro 24×24 (sta dentro il distintivo)
 simbolo(def,col,sp){const s=Sagome.S[def]||'<circle cx="12" cy="12" r="6"/>';return`<g fill="none" stroke="${col||'#fff'}" stroke-width="${sp||2}" stroke-linecap="round" stroke-linejoin="round">${s}</g>`},
 // il segnalino di un mostro centrato in (0,0), raggio r: distintivo + simbolo. `capo` = più grande, con doppia cornice
 segnalino(c,r){const m=(typeof BEST!=='undefined'&&BEST.M[c.def])||{},fam=m.fam||'banditi',col=Sagome.FAM[fam]||'#8a6a34',ruolo=m.ruolo||c.ruolo||'bruto',capo=!!m.capo,k=r*2/24;
  const forma=Sagome.RUOLO[ruolo]||Sagome.RUOLO.bruto;
  return`<g transform="scale(${k.toFixed(3)}) translate(-12 -12)"><path d="${forma}" fill="${col}" stroke="#3a1008" stroke-width="2.4" stroke-linejoin="round"/>`
   +(capo?`<path d="${forma}" fill="none" stroke="#f3d37a" stroke-width="1.2" transform="translate(12 12) scale(.86) translate(-12 -12)"/>`:'')
   +`<path d="${forma}" fill="rgba(0,0,0,.28)" transform="translate(12 12) scale(.8) translate(-12 -12)"/><g transform="translate(12 12) scale(.62) translate(-12 -12)">${Sagome.simbolo(c.def,'#fff7e0',2.2)}</g></g>`},
 // lo stesso, come SVG a sé (per l'iniziativa e le schede)
 svg(c,px){return`<svg class="bt-sag" viewBox="-14 -14 28 28" width="${px}" height="${px}" role="img" aria-label="${esc(c.nome)}">${Sagome.segnalino(c,13)}</svg>`},
 // stati: icona e lettera (per i segnalini piccoli)
 STATO:{'in-fiamme':['fuoco','#e8742a'],avvelenato:['teschio','#6fae3a'],stordito:['scintilla','#d9c33a'],accecato:['viso0','#9a9a9a'],terra:['croce','#c0453a'],nascosto:['luna','#8aa0c8'],mirato:['bersaglio','#e9c46a'],
  benedetto:['sole','#f3d37a'],protetto:['scudo','#7fb1d8'],rallentato:['passi','#7aa0c8'],paralizzato:['stretta','#c8a0d8']}
};
