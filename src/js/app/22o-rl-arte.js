/* ---- Regicide Legacy: arte delle carte (originale) ----
   Stile: figure a inchiostro nero su fondo verde sfumato, come le carte dell'edizione Legacy, ma disegni nostri.
   Nemici e carte corrotte nella «custodia» viola con le spine. Tutto SVG: la vista del telefono lo inserisce nel DOM,
   il tavolo 3D della TV lo dipinge su canvas (RLA.img). Nessuna immagine esterna. */
const RLA=(()=>{
/* icone di classe in un quadrato 24×24: f = riempimento, l = tratto */
const ICO={
 G:{f:'M13.5 3.2Q21.5 2.6 21.4 11Q17.6 9.4 14.6 12.6L12.4 9.8Q14.6 7 13.5 3.2Z',l:'M4 21L15.5 6.5',col:'#1c1c1c'},
 P:{f:'M12 2.5L20 5.5V11.5Q20 18 12 21.5Q4 18 4 11.5V5.5Z',l:'M12 6V18M7.5 10.5H16.5',lc:'#e8e2cf',col:'#6f7378'},
 C:{f:'M9.8 2.8H14.2V7.6Q19.2 9.6 19.2 14.6A7.2 7.2 0 0 1 4.8 14.6Q4.8 9.6 9.8 7.6Z',l:'M7.5 14.5Q12 12 16.5 14.5',lc:'#f6d7c9',col:'#b8352d'},
 B:{f:'M9.5 10.5A6 5.2 -40 1 0 13.6 18.2A6 5.2 -40 0 0 9.5 10.5ZM18.2 3.2L21 5.6L19.6 7.4L16.8 5Z',l:'M12.5 12L19 5.2',col:'#d8a51c'},
 M:{f:'M12 2.5L14.6 9H21.4L15.9 13.1L18 20L12 15.8L6 20L8.1 13.1L2.6 9H9.4Z',col:'#2e5fb3'},
 R:{f:'M2.8 12.4Q12 0 21.2 12.4Q12 10.6 2.8 12.4ZM9.4 12.2H14.6L13.8 21H10.2Z',l:'M7.5 7.5h.1M12.5 5h.1M16 8h.1',lc:'#e8e2cf',col:'#1c1c1c'},
 S:{f:'M5.2 18.4L3.8 11.2L8.8 4.8L15.8 5.6L20.4 11.8L18.4 19L10.2 21.2Z',l:'M8.8 4.8L11 12L18.4 19M11 12L3.8 11.2',lc:'#cfd1d3',col:'#6f7378'},
 D:{f:'M19.6 2.8Q7.6 5.4 5.8 18.2L4.8 21.2L7 20.2Q18.4 16.8 19.6 2.8Z',l:'M6.4 19.6L16.2 7.4',lc:'#f6d7c9',col:'#b8352d'},
 T:{f:'M4 8.4V15.6Q12 20.6 20 15.6V8.4Q12 12.6 4 8.4ZM4 8.4A8 3.2 0 1 0 20 8.4A8 3.2 0 1 0 4 8.4Z',l:'M15 3.4L19.8 7M9 3.4L4.2 7',col:'#d8a51c'},
 W:{f:'M10.4 21V14.6H13.6V21ZM12 2.6A5 5 0 0 1 16.8 7.4A4.4 4.4 0 0 1 18 15A5 5 0 0 1 6 15A4.4 4.4 0 0 1 7.2 7.4A5 5 0 0 1 12 2.6Z',col:'#3f7a3a'}};
const icon=(k,px,o={})=>{const d=ICO[k];if(!d)return'';const c=o.col||d.col;
 return`<svg class="rli" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true">${o.disc?`<circle cx="12" cy="12" r="11.5" fill="${o.disc}"/>`:''}<path d="${d.f}" fill="${c}"/>${d.l?`<path d="${d.l}" fill="none" stroke="${d.lc||c}" stroke-width="1.8" stroke-linecap="round"/>`:''}${o.x?'<path d="M3 3L21 21" stroke="#c22" stroke-width="2.6"/>':''}</svg>`};
const iconIn=(k,x,y,s,col)=>{const d=ICO[k];if(!d)return'';const c=col||d.col;return`<g transform="translate(${x} ${y}) scale(${s/24})"><path d="${d.f}" fill="${c}"/>${d.l?`<path d="${d.l}" fill="none" stroke="${d.lc||c}" stroke-width="1.8" stroke-linecap="round"/>`:''}</g>`};
/* ---------- figure a inchiostro (riquadro 100×100, base a y=96) ---------- */
const P=(d,f)=>`<path d="${d}" fill="${f||'var(--ink)'}"/>`,S=(d,w)=>`<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="${w||3}" stroke-linecap="round" stroke-linejoin="round"/>`;
const C=(x,y,r,f)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f||'var(--ink)'}"/>`,EL=(x,y,rx,ry,f,rot)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f||'var(--ink)'}"${rot?` transform="rotate(${rot} ${x} ${y})"`:''}/>`;
const EYE=(x,y)=>C(x,y,1.6,'var(--bg)');
// corpo umano di base: testa, mantello, gambe. w = larghezza spalle, h = cappuccio/cappello
function body(o){o=o||{};const w=o.w||17,cx=50;let g='';
 g+=P(`M${cx-w} 42Q${cx-w-3} 70 ${cx-w-8} 92H${cx+w+8}Q${cx+w+3} 70 ${cx+w} 42Q${cx} 36 ${cx-w} 42Z`);// mantello
 g+=P(`M${cx-9} 88L${cx-11} 97H${cx-3}L${cx-2} 88ZM${cx+9} 88L${cx+11} 97H${cx+3}L${cx+2} 88Z`);// piedi
 g+=C(cx,30,o.r||10);// testa
 if(o.hood)g+=P(`M${cx-13} 34Q${cx-12} 14 ${cx} 15Q${cx+12} 14 ${cx+13} 34Q${cx} 27 ${cx-13} 34Z`);
 if(o.hat==='mago')g+=P(`M${cx-17} 24Q${cx} 18 ${cx+17} 24L${cx+12} 21L${cx+6} 2L${cx-8} 20Z`);
 if(o.hat==='elmo')g+=P(`M${cx-12} 30Q${cx-12} 15 ${cx} 15Q${cx+12} 15 ${cx+12} 30H${cx+3}V24H${cx-3}V30Z`)+P(`M${cx-1.5} 6H${cx+1.5}V16H${cx-1.5}Z`);
 if(o.hat==='corna')g+=S(`M${cx-6} 22Q${cx-14} 12 ${cx-22} 10M${cx-15} 14L${cx-18} 6M${cx+6} 22Q${cx+14} 12 ${cx+22} 10M${cx+15} 14L${cx+18} 6`,3);
 if(o.hat==='giullare')g+=P(`M${cx-11} 24Q${cx-24} 18 ${cx-26} 6Q${cx-16} 12 ${cx-6} 20L${cx} 6L${cx+6} 20Q${cx+16} 12 ${cx+26} 6Q${cx+24} 18 ${cx+11} 24Z`)+C(cx-26,6,3)+C(cx,5,3)+C(cx+26,6,3);
 if(o.hat==='corona')g+=P(`M${cx-10} 22L${cx-11} 12L${cx-5} 17L${cx} 9L${cx+5} 17L${cx+11} 12L${cx+10} 22Z`);
 if(o.hat==='cappello')g+=P(`M${cx-20} 24Q${cx} 16 ${cx+20} 24Q${cx} 21 ${cx-20} 24ZM${cx-10} 22Q${cx-9} 12 ${cx} 12Q${cx+9} 12 ${cx+10} 22Z`)+S(`M${cx+6} 14Q${cx+14} 4 ${cx+22} 8`,2);
 if(o.eyes)g+=EYE(cx-4,30)+EYE(cx+4,30);
 return g}
const ARM={// braccio con oggetto, coordinate della mano
 ascia:(x,y)=>S(`M${x} ${y}L${x+14} ${y-34}`,3.4)+P(`M${x+9} ${y-30}Q${x+24} ${y-44} ${x+28} ${y-26}Q${x+20} ${y-28} ${x+14} ${y-20}Z`),
 spada:(x,y)=>S(`M${x} ${y}L${x+4} ${y-38}`,3)+S(`M${x-5} ${y-6}L${x+7} ${y-8}`,3),
 scudo:(x,y)=>P(`M${x-12} ${y-14}L${x+12} ${y-14}V${y+2}Q${x+12} ${y+16} ${x} ${y+22}Q${x-12} ${y+16} ${x-12} ${y+2}Z`)+P(`M${x-1.5} ${y-10}H${x+1.5}V${y+16}H${x-1.5}ZM${x-8} ${y-1}H${x+8}V${y+2}H${x-8}Z`,'var(--bg)'),
 pozione:(x,y)=>P(`M${x-3} ${y-16}H${x+3}V${y-10}Q${x+9} ${y-7} ${x+9} ${y}A9 9 0 0 1 ${x-9} ${y}Q${x-9} ${y-7} ${x-3} ${y-10}Z`)+C(x-2,y-2,2.4,'var(--bg)'),
 liuto:(x,y)=>EL(x,y,10,8,null,-35)+C(x,y,2.6,'var(--bg)')+S(`M${x+5} ${y-5}L${x+22} ${y-24}`,3.4)+P(`M${x+20} ${y-27}l5 -3l3 4l-5 3z`),
 bastone:(x,y,top)=>S(`M${x} ${y+30}L${x+3} ${y-30}`,3)+(top==='stella'?P(`M${x+3} ${y-44}l3 7h7l-6 4l3 7l-7-4l-7 4l3-7l-6-4h7z`):top==='piuma'?P(`M${x+3} ${y-30}Q${x+16} ${y-46} ${x+14} ${y-58}Q${x+2} ${y-46} ${x+3} ${y-30}Z`):C(x+3,y-32,4)),
 tamburo:(x,y)=>P(`M${x-12} ${y-4}V${y+8}Q${x} ${y+15} ${x+12} ${y+8}V${y-4}Z`)+EL(x,y-4,12,4,'var(--bg)')+S(`M${x-14} ${y-20}L${x-4} ${y-8}M${x+14} ${y-20}L${x+4} ${y-8}`,2.4),
 libro:(x,y)=>P(`M${x-11} ${y-6}L${x} ${y-3}L${x+11} ${y-6}V${y+8}L${x} ${y+11}L${x-11} ${y+8}Z`)+S(`M${x} ${y-3}V${y+11}`,1.4).replace('var(--ink)','var(--bg)'),
 martello:(x,y)=>S(`M${x} ${y}L${x+10} ${y-26}`,3)+P(`M${x+2} ${y-34}l14 5l-4 9l-14-5z`),
 bilancia:(x,y)=>S(`M${x} ${y}V${y-30}M${x-14} ${y-26}H${x+14}M${x-14} ${y-26}l-5 12h10zM${x+14} ${y-26}l-5 12h10z`,2.2)+P(`M${x-19} ${y-14}h10q-5 5-10 0zM${x+9} ${y-14}h10q-5 5-10 0z`),
 sacco:(x,y)=>S(`M${x} ${y+28}L${x+4} ${y-26}`,2.6)+C(x+4,y-28,7)};
const HUM={
 G:v=>body({w:17+v%3,hat:v>=8?'elmo':null,eyes:v<8})+ARM.ascia(66,64),
 P:v=>body({w:18,hat:'elmo'})+ARM.spada(70,60)+ARM.scudo(34,62),
 C:v=>body({w:16,hood:1})+ARM.pozione(68,52)+ARM.libro(36,66),
 B:v=>body({w:15,hat:'cappello',eyes:1})+ARM.liuto(42,64),
 M:v=>body({w:16,hat:'mago',eyes:1})+ARM.bastone(72,60,'stella'),
 R:v=>P('M18 48Q50 6 82 48Q50 40 18 48Z')+C(32,36,3.5,'var(--bg)')+C(52,26,4,'var(--bg)')+C(68,38,3,'var(--bg)')+P('M36 48H64Q66 72 72 92H28Q34 72 36 48Z')+EYE(44,58)+EYE(56,58)+S('M30 66L14 58M70 66L86 58M14 58l-4-6M14 58l-6 2M86 58l4-6M86 58l6 2',3)+P('M36 90L32 97H44L43 90ZM64 90L68 97H56L57 90Z'),
 S:v=>P('M26 92L20 60L30 34L48 26L68 32L80 58L74 92Z')+P('M38 30L42 10L60 8L64 28Z')+C(46,18,2.2,'var(--bg)')+C(56,18,2.2,'var(--bg)')+S('M30 56L46 62L54 50L72 58M40 78L58 74',1.6).replace(/var\(--ink\)/g,'var(--bg)')+P('M18 62L6 74L14 80L24 70ZM82 62L94 74L86 80L76 70Z'),
 D:v=>body({w:16,hood:1,hat:'corna'})+ARM.bastone(70,60,'piuma'),
 T:v=>body({w:16,eyes:1,hat:v>6?'cappello':null})+ARM.tamburo(50,66),
 W:v=>P('M40 97L42 60Q30 56 20 44Q30 46 40 52L38 40Q24 30 22 14Q34 26 44 34Q46 18 54 8Q56 24 54 36Q66 26 80 22Q72 36 58 44L60 60Q70 54 82 54Q72 64 60 68L60 97Z')+EYE(46,72)+EYE(54,72)+C(28,14,7)+C(56,6,6)+C(82,20,7),
 p:v=>body({w:14,hood:1})+ARM.sacco(70,60),
 x:v=>body({w:15,hat:'giullare',eyes:1})+S('M36 64L26 50M64 64L76 52',3)+C(24,48,4)+C(78,50,4),
 tronco:v=>HUM.W(v),lira:v=>body({w:15,hat:'corona',eyes:1})+ARM.liuto(42,64),edera:v=>body({w:15,hood:1})+ARM.bastone(70,60,'piuma')+S('M30 50Q22 60 30 70Q22 78 30 88',2.4)};
const ANI={// animali (assi) per classe e belve
 G:()=>P('M18 70Q20 52 38 50L58 48Q64 34 76 34L86 40L84 50L74 54Q76 70 70 82L72 96H64L62 84Q48 86 36 82L34 96H26L28 80Q16 80 18 70Z')+P('M76 34L74 24L82 30Z')+EYE(78,42),// mastino
 P:()=>P('M16 82Q16 52 50 50Q84 52 84 82Z')+S('M22 60l-6-6M32 54l-4-8M44 50l-1-9M56 50l2-9M68 54l5-8M78 60l7-5',3)+P('M80 74Q92 70 94 80Q88 84 80 82Z')+EYE(88,77)+P('M28 82v12h6v-12zM66 82v12h6v-12z'),// riccio
 C:()=>P('M24 92Q20 60 38 54Q34 40 40 30L46 40H58L64 30Q70 40 66 54Q82 60 78 92Z')+EYE(46,46)+EYE(58,46)+S('M78 86Q96 80 90 60',4),// gatta
 B:()=>P('M22 60Q34 40 58 46Q72 34 84 42L94 44L84 50Q82 64 66 70L56 72L60 92H54L50 74L40 92H34L42 72Q26 72 22 60Z')+EYE(82,44)+P('M30 56L6 50L28 66Z'),// merlo
 M:()=>P('M30 92Q22 60 34 40Q30 30 32 22L42 32H58L68 22Q70 30 66 40Q78 60 70 92Z')+C(42,44,6,'var(--bg)')+C(58,44,6,'var(--bg)')+C(42,44,3)+C(58,44,3)+P('M47 52L50 58L53 52Z','var(--bg)'),// civetta
 '':()=>P('M28 74Q28 56 44 52Q42 38 54 36Q66 36 66 50Q74 56 72 74L74 92H66L64 80H40L38 92H30Z')+EYE(56,46)+P('M54 36L46 26L52 40Z'),// cucciolo
 W:()=>P('M18 70Q18 50 44 46Q48 30 62 30Q76 32 78 46Q90 50 90 66L84 72Q86 82 80 92H72L70 80H40L36 92H28L30 78Q18 78 18 70Z')+P('M44 46L30 36L46 40Z')+EYE(66,40)+P('M60 30l-6-10l10 6zM70 30l4-10l2 12z'),// lupo selvatico
 bG:()=>P('M14 84Q12 56 34 48Q38 32 54 32Q72 32 74 46Q90 52 88 84L80 96H70L68 86H34L30 96H20Z')+C(44,32,5)+C(66,32,5)+EYE(52,44)+EYE(64,44)+P('M56 52Q60 56 64 52Z','var(--bg)'),// orso
 bP:()=>P('M12 80Q14 48 48 46Q82 48 84 80Z')+S('M30 52L40 66L58 66L66 52M40 66L34 80M58 66L64 80',2).replace(/var\(--ink\)/g,'var(--bg)')+P('M82 70Q94 62 96 74Q92 82 82 80Z')+EYE(90,72)+P('M20 80v10h8v-10zM62 80v10h8v-10z'),// testuggine
 bC:()=>P('M22 70Q24 52 44 50L62 48Q64 36 72 34L82 38L80 48L72 52L74 66Q72 76 66 80L68 96H62L58 82H38L34 96H28L30 80Q22 80 22 70Z')+S('M70 34Q64 18 56 14M64 22L58 22M74 34Q80 16 90 12M80 22L88 24',3)+EYE(76,42),// cervo
 bB:()=>P('M16 66Q30 42 56 48Q68 36 82 42L94 40L84 50Q84 62 70 68L62 70L66 92H60L56 72L44 92H38L48 70Q24 74 16 66Z')+P('M26 60L4 40L12 62Z')+P('M80 42L84 30L78 40Z')+EYE(84,46)};
const FOE={// figure dei nemici (inchiostro chiaro sulla custodia viola)
 giudice:v=>body({w:20,hat:'corona',eyes:1})+ARM.martello(70,64)+ARM.bilancia(30,70),
 idra:v=>S('M20 96Q24 70 40 66Q56 62 52 44Q48 28 62 22',9)+P('M58 14Q74 6 86 16L92 22L82 26Q72 32 60 28Z')+EYE(76,16)+P('M84 24L90 30L82 28Z','var(--bg)')+S('M30 96Q26 80 14 74',6),
 fusione:v=>P('M20 90Q10 60 30 46Q28 24 50 22Q74 20 72 44Q92 56 82 90Z')+EYE(40,40)+EYE(56,36)+EYE(64,52)+EYE(34,60)+P('M42 70Q52 78 62 70Q52 74 42 70Z','var(--bg)'),
 esperimento:v=>P('M30 96L34 62Q22 50 26 36Q36 24 52 26Q72 28 72 46Q72 58 62 64L66 96Z')+EYE(44,40)+EYE(58,42)+S('M64 50Q80 46 84 30M30 56Q16 54 12 40',3)+P('M80 22h8v12h-8zM8 32h8v10h-8z'),
 spora:v=>P('M12 52Q50 0 88 52Q50 44 12 52Z')+C(30,38,4,'var(--bg)')+C(52,24,5,'var(--bg)')+C(70,40,4,'var(--bg)')+P('M38 52H62Q68 78 74 96H26Q32 78 38 52Z')+EYE(44,64)+EYE(56,64),
 statua:v=>P('M24 96V86H76V96Z')+P('M30 86V80H70V86Z')+body({w:15,eyes:0}).replace(/97/g,'80')+ARM.spada(68,54),
 stagno:v=>P('M14 88Q12 58 34 52Q32 38 42 36Q48 36 50 44Q52 36 58 36Q68 38 66 52Q88 58 86 88Z')+C(42,42,4,'var(--bg)')+C(58,42,4,'var(--bg)')+C(42,42,2)+C(58,42,2)+P('M36 66Q50 74 64 66Q50 70 36 66Z','var(--bg)'),
 troll:v=>P('M18 96L22 64Q8 56 12 40Q24 44 28 52Q30 28 50 26Q72 26 74 50Q80 42 90 40Q92 56 78 64L82 96Z')+EYE(44,42)+EYE(58,42)+P('M42 54L46 60L50 54L54 60L58 54Z','var(--bg)'),
 viverna:v=>P('M30 70Q44 60 56 62Q66 50 80 50L94 52L82 58Q74 70 60 74L52 92H44L46 76Q36 80 30 70Z')+P('M44 62Q22 20 6 18Q24 34 26 50Q14 44 8 46Q22 56 44 62Z')+P('M56 62Q60 20 82 10Q70 30 72 46Z')+EYE(84,54),
 custode:v=>body({w:20,hood:1})+ARM.libro(50,66)+P('M36 26h28v4h-28z'),
 traditore:v=>body({w:17,eyes:1,hat:'elmo'})+ARM.spada(70,60),
 tronco:v=>HUM.W(v),lira:v=>HUM.lira(v),
 giustiziere:v=>body({w:20,hat:'elmo'})+S('M70 92L76 14',4)+S('M64 30H88',4),
 mutato:v=>P('M24 96Q18 70 30 56Q20 46 24 30L34 40Q40 26 52 26Q66 28 66 42L78 32Q82 50 70 60Q82 76 78 96Z')+EYE(46,40)+EYE(58,38)+EYE(52,50)+S('M28 60Q12 62 8 80M72 62Q90 62 92 82',4)};
const art=(d)=>{if(d.k==='e')return(FOE[d.f]||FOE.mutato)(d.v);if(d.f&&HUM[d.f])return HUM[d.f](d.v);
 if(d.k==='b')return ANI[d.id]?ANI[d.id]():ANI.bG();
 if(d.k==='a')return(d.c==='GPCB'?ANI.W:ANI[d.c]||ANI[''])();
 if(d.k==='x')return HUM.x();if(d.k==='p')return HUM.p(d.v);if(d.k==='m')return(HUM[d.c]||HUM.G)(d.v);
 return(HUM[d.c[0]]||HUM.G)(d.v)};
/* ---------- carta intera (viewBox 100×140) ---------- */
const esc2=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let uid=0;
function svg(d,o={}){const id='rl'+(++uid),foe=d.k==='e'||o.foe,cor=o.corr&&!foe,cls=d.c==='W'?['W']:(d.c||'').split('');
 const bg=foe?['#5b3a73','#22142e']:d.k==='p'?['#d4d8bf','#8f9a72']:d.k==='m'?['#e7d9a6','#b08a3a']:['#dcebc0','#6f9a52'];
 const ink=foe?'#efe3ff':'#16180f',inkBg=foe?'#3a2450':bg[0];
 const num=d.k==='x'&&!d.solo?'★':d.k==='b'?'×2':d.v;
 let frame=`<rect x="1.5" y="1.5" width="97" height="137" rx="7" fill="url(#${id}g)" stroke="${foe||cor?'#2a1638':'#33402a'}" stroke-width="3"/>`;
 if(foe||cor){let sp='';for(let i=0;i<9;i++){const x=10+i*10;sp+=`M${x} 2l5 7l5-7M${x} 138l5-7l5 7`}for(let i=0;i<12;i++){const y=12+i*10;sp+=`M2 ${y}l7 5l-7 5M98 ${y}l-7 5l7 5`}
  frame+=`<path d="${sp}" fill="#2a1638"/><rect x="7" y="7" width="86" height="126" rx="4" fill="none" stroke="#a77bd0" stroke-width="1.2"/>`}
 else frame+=`<rect x="5.5" y="5.5" width="89" height="129" rx="4.5" fill="none" stroke="${d.k==='m'?'#7a5a1a':'#4d6a3a'}" stroke-width="1"/>`;
 const fig=`<g style="--ink:${ink};--bg:${inkBg}" transform="translate(14 26) scale(.72)">${art(Object.assign({id:o.id},d))}</g>`;
 const icons=cls.map((k,i)=>iconIn(k,8,35+i*13,12,foe?'#e9dcff':null)).join('');
 const big=`<text x="15" y="25" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="${String(num).length>1?17:21}" fill="${foe?'#f4e9ff':'#16180f'}">${num}</text>`;
 const hp=foe&&o.hp?`<g><circle cx="85" cy="16" r="10" fill="#7a1f2a" stroke="#f4e9ff" stroke-width="1.2"/><text x="85" y="20.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${o.hp>99?9:12}" fill="#fff">${o.hp}</text></g>`:'';
 const cost=d.cost&&o.cost!==false?`<g><circle cx="86" cy="16" r="8.5" fill="#e3b53a" stroke="#7a5a1a" stroke-width="1.2"/><text x="86" y="20" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="11" fill="#3a2a08">${d.cost}</text></g>`:'';
 const v2=d.v2?`<text x="15" y="36" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="#16180f">/${d.v2}</text>`:'';
 const name=esc2(o.name||d.nm||'');const fs=name.length>16?6.2:name.length>11?7.4:8.6;
 const plate=`<path d="M10 118H90L94 124L90 130H10L6 124Z" fill="${foe?'#2a1638':'#f2ead2'}" stroke="${foe?'#a77bd0':'#4d6a3a'}" stroke-width="1"/><text x="50" y="126.8" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="${fs}" fill="${foe?'#f4e9ff':'#23281a'}">${name}</text>`;
 return`<svg class="rlsvg" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs>${frame}${fig}${big}${v2}${icons}${hp}${cost}${plate}</svg>`}
function back(){return`<svg class="rlsvg" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="1.5" y="1.5" width="97" height="137" rx="7" fill="#1f3a26" stroke="#0f1f14" stroke-width="3"/><rect x="7" y="7" width="86" height="126" rx="4" fill="none" stroke="#c9a54a" stroke-width="1.4"/><path d="M50 22L56 64L50 118L44 64Z" fill="#c9a54a"/><path d="M32 58H68V64H32Z" fill="#c9a54a"/><circle cx="50" cy="50" r="22" fill="none" stroke="#c9a54a" stroke-width="1.2"/><path d="M50 20l2 6h-4z" fill="#e9d48a"/></svg>`}
/* immagine per le texture (TV): SVG → Image, con cache */
const IMG={};
function img(key,markup){if(IMG[key])return IMG[key];const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(markup);IMG[key]=im;return im}
return{icon,svg,back,img,ICO,art}})();
