/* ---- Carte figura dipinte (originali): 12 nemici + Jolly ---- */
const FACE=(()=>{
const PAL={H:{m:'#b8323a',d:'#7a1c28',l:'#e9898a',w:'#f3c1b6'},D:{m:'#d39b2b',d:'#94600f',l:'#f4d06c',w:'#f7e2a6'},C:{m:'#3f7d4c',d:'#244f30',l:'#93c48e',w:'#cfe5c2'},S:{m:'#3b4b8e',d:'#1e2552',l:'#8d9de0',w:'#c9d0f0'}};
const GOLD='#e3b341',GOLDD='#a9761c',INK='#2a1a14',CREAM='#f3e6c8',STEEL='#9aa3b2',STEELD='#5d6578';
const o=v=>v==null?'':` opacity="${v}"`;
const p=(d,f,op)=>`<path d="${d}" fill="${f}"${o(op)}/>`;
const c=(x,y,r,f,op)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${o(op)}/>`;
const e=(x,y,rx,ry,f,op)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"${o(op)}/>`;
const ln=(d,s,w,op)=>`<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o(op)}/>`;
const wash=(P,v)=>p(v?'M22 30C8 58 12 104 30 124C52 142 82 132 88 108C96 78 94 40 74 24C56 10 32 12 22 30Z':'M20 36C10 66 16 112 34 126C56 140 84 128 88 102C94 70 90 34 70 22C52 12 28 18 20 36Z',P.w,.75)+c(84,26,5,P.w,.6)+c(15,118,4,P.w,.55)+c(88,40,2.2,P.w,.6);
/* testa */
function head(k){const x=k.hx||50,y=k.hy||36,sk=k.skin||'#f0c7a0',sd=k.skind||'#d39a76';let s='';
 s+=p(`M${x-3.5} ${y+8}h7v8h-7z`,sd);
 if(k.hairBack)s+=k.hairBack;
 s+=e(x,y,9.5,11,sk)+p(`M${x+3} ${y-10}C${x+12} ${y-6} ${x+11} ${y+8} ${x+2} ${y+11}C${x+7} ${y+4} ${x+8} ${y-4} ${x+3} ${y-10}Z`,sd,.55);
 const ey=k.eyes||'#2a1a14';
 if(k.eyeGlow){s+=e(x-3.6,y+.5,2.2,1.3,k.eyeGlow)+e(x+3.6,y+.5,2.2,1.3,k.eyeGlow)+c(x-3.6,y+.5,4,k.eyeGlow,.25)+c(x+3.6,y+.5,4,k.eyeGlow,.25)}
 else if(k.lids){s+=ln(`M${x-5.4} ${y+.6}q1.8 1.4 3.6 0`,ey,1.3)+ln(`M${x+1.8} ${y+.6}q1.8 1.4 3.6 0`,ey,1.3)}
 else{s+=c(x-3.6,y+.4,1.55,ey)+c(x+3.6,y+.4,1.55,ey)+c(x-3.1,y-.1,.5,'#fff')+c(x+4.1,y-.1,.5,'#fff')}
 const b=k.brow||'calm',bc=k.browc||'#3a2418';
 if(b==='angry')s+=ln(`M${x-6.2} ${y-4.2}L${x-1.6} ${y-2.4}M${x+6.2} ${y-4.2}L${x+1.6} ${y-2.4}`,bc,1.5);
 else if(b==='sad')s+=ln(`M${x-6} ${y-2.6}L${x-1.8} ${y-4.4}M${x+6} ${y-2.6}L${x+1.8} ${y-4.4}`,bc,1.3);
 else if(b==='sly')s+=ln(`M${x-6} ${y-4.4}Q${x-3.8} ${y-5.6} ${x-1.6} ${y-4}M${x+6} ${y-2.8}L${x+1.6} ${y-3.4}`,bc,1.3);
 else s+=ln(`M${x-6} ${y-3.6}Q${x-3.8} ${y-5} ${x-1.6} ${y-3.6}M${x+6} ${y-3.6}Q${x+3.8} ${y-5} ${x+1.6} ${y-3.6}`,bc,1.2);
 s+=p(`M${x} ${y+1}l-1.6 4.4h2.6z`,sd);
 if(!k.noblush)s+=e(x-5.6,y+4.6,2,1.2,'#e98c7c',.55)+e(x+5.6,y+4.6,2,1.2,'#e98c7c',.55);
 const m=k.mouth||'flat',mc=k.lip||'#8a3a2a';
 if(m==='smirk')s+=ln(`M${x-2.6} ${y+7.4}Q${x+.6} ${y+8.6} ${x+3.4} ${y+6.2}`,mc,1.2);
 else if(m==='grin')s+=p(`M${x-4} ${y+6.6}Q${x} ${y+11} ${x+4} ${y+6.6}Z`,'#5a1a14')+p(`M${x-3.2} ${y+6.9}h6.4l-.5 1.2h-5.4z`,'#fff');
 else if(m==='frown')s+=ln(`M${x-3} ${y+8.4}Q${x} ${y+6.6} ${x+3} ${y+8.4}`,mc,1.2);
 else if(m==='lips')s+=p(`M${x-2.8} ${y+7.2}Q${x} ${y+5.8} ${x+2.8} ${y+7.2}Q${x} ${y+9.4} ${x-2.8} ${y+7.2}Z`,mc);
 else if(m==='open')s+=e(x,y+7.6,2.2,1.8,'#5a1a14');
 else s+=ln(`M${x-2.4} ${y+7.4}H${x+2.4}`,mc,1.1);
 if(k.tear)s+=p(`M${x-4.4} ${y+3}q-1.4 2.6 0 3.4q1.4-.8 0-3.4z`,'#9fd3ff');
 if(k.scar)s+=ln(`M${x+2.6} ${y-6}L${x+6.4} ${y+4}`,'#a5584a',1);
 if(k.hairFront)s+=k.hairFront;
 if(k.beard)s+=k.beard;
 return s}
/* braccio: spalla -> gomito -> mano */
const arm=(a,col,w=8,sk='#f0c7a0',hand=true)=>ln(`M${a[0]} ${a[1]}Q${a[2]} ${a[3]} ${a[4]} ${a[5]}`,col,w)+(hand?c(a[4],a[5],3.6,sk):'');
const legs=(col,boot)=>p('M41 98h7.5v26h-7.5zM51.5 98H59v26h-7.5z',col)+p('M51.5 98H59v26h-3z',INK,.18)+p('M39 122h10.5v10H37q-1-6 2-10zM50.5 122H61q3 4 2 10H50.5z',boot);
const tunic=(P,col=P.m,dk=P.d)=>p('M34 52Q50 46 66 52L71 100Q50 107 29 100Z',col)+p('M57 50L66 52L71 100Q64 103 58 104Z',dk,.45);
const gown=(P,col=P.m,dk=P.d,hem)=>p(hem||'M36 52Q50 46 64 52L66 78Q82 108 88 134H12Q18 108 34 78Z',col)+p('M56 50L64 52L66 78Q82 108 88 134H62Q66 104 58 78Z',dk,.42);
const robe=(P,col=P.m,dk=P.d,w=0)=>p(`M${33-w} 52Q50 46 ${67+w} 52L${75+w} 133H${25-w}Z`,col)+p(`M57 50L${67+w} 52L${75+w} 133H60Z`,dk,.42);
const cape=(col,rag)=>p(rag?'M30 50Q14 90 10 133l8-5 6 6 7-6 6 6H63l7-6 6 6 7-6 7 5Q86 90 70 50Z':'M30 50Q14 90 10 133H90Q86 90 70 50Z',col);
const fur=(y1=50)=>p(`M30 ${y1+2}Q50 ${y1-6} 70 ${y1+2}Q66 ${y1+10} 50 ${y1+9}Q34 ${y1+10} 30 ${y1+2}Z`,CREAM)+[34,40,46,52,58,64].map(x=>c(x,y1+3+(x%12?1:0),.9,INK,.6)).join('');
const crownK=(x=50,y=26,col=GOLD,dk=GOLDD,gem='#c8262f')=>p(`M${x-10.5} ${y}L${x-12} ${y-13}L${x-5.5} ${y-6}L${x} ${y-16}L${x+5.5} ${y-6}L${x+12} ${y-13}L${x+10.5} ${y}Z`,col)+p(`M${x} ${y-16}L${x+5.5} ${y-6}L${x+12} ${y-13}L${x+10.5} ${y}H${x}Z`,dk,.35)+p(`M${x-11} ${y-3}h22v4h-22z`,dk)+c(x,y-1,1.8,gem)+c(x-6,y-1,1.2,'#3f8fe0')+c(x+6,y-1,1.2,'#3f8fe0')+c(x,y-16,1.6,col)+c(x-12,y-13,1.3,col)+c(x+12,y-13,1.3,col);
const tiara=(x=50,y=26,col=GOLD,gem='#c8262f')=>p(`M${x-9} ${y}Q${x-6} ${y-6} ${x-4} ${y-5}L${x} ${y-11}L${x+4} ${y-5}Q${x+6} ${y-6} ${x+9} ${y}Q${x} ${y-3} ${x-9} ${y}Z`,col)+c(x,y-5,1.7,gem);
/* oggetti */
const sword=(x,y1,y2,bl=STEEL,hilt=GOLD)=>p(`M${x-2} ${y1+9}L${x} ${y1}L${x+2} ${y1+9}V${y2}H${x-2}Z`,bl)+p(`M${x} ${y1}L${x+2} ${y1+9}V${y2}H${x}Z`,STEELD,.35)+p(`M${x-7} ${y2}h14v3h-14z`,hilt)+p(`M${x-1.6} ${y2+3}h3.2v9h-3.2z`,'#5a3414')+c(x,y2+13.5,2.4,hilt);
const coin=(x,y,r=3)=>c(x,y,r,GOLD)+c(x,y,r*.62,'none')+`<circle cx="${x}" cy="${y}" r="${(r*.62).toFixed(2)}" fill="none" stroke="${GOLDD}" stroke-width=".8"/>`;
const rose=(x,y)=>ln(`M${x} ${y}q-2 6 1 12`,'#3f7d4c',1.4)+e(x+2,y+6,2.4,1.2,'#3f7d4c')+c(x,y,3.4,'#c8262f')+ln(`M${x-1.6} ${y-.4}q1.6-2 3.2 0q-1.6 2-3.2 0`,'#7a1c28',.9);
const heart=(x,y,s,f)=>p(`M${x} ${y+s*.9}C${x-s*1.6} ${y-s*.1} ${x-s} ${y-s*1.2} ${x} ${y-s*.45}C${x+s} ${y-s*1.2} ${x+s*1.6} ${y-s*.1} ${x} ${y+s*.9}Z`,f);
/* ---- personaggi ---- */
const F={};
F.JH=()=>{const P=PAL.H;return wash(P)+
 p('M58 70l14 18-2 2-14-16z',STEEL)+p('M55 67l5-2 3 4-5 2z',GOLD)+ /* pugnale dietro la schiena */
 p('M31 51Q20 70 22 92L44 88 50 54Z',P.l)+ /* mantellina */
 legs('#5a2a3a','#3a2418')+tunic(P)+p('M47 52h6v50h-6z',CREAM,.9)+[60,70,80,90].map(y=>c(50,y,1.1,GOLD)).join('')+p('M30 88h41v5H30z','#5a2a1a')+coin(50,90.5,2.2)+
 arm([65,56,70,76,63,84],P.m,8)+
 arm([35,56,24,46,38,40],P.m,8)+rose(40,30)+
 head({brow:'sly',mouth:'smirk',hairBack:e(50,30,11,8,'#5a3018'),hairFront:p('M40 32Q41 22 50 22Q60 21 61 31Q56 26 50 28Q44 26 40 32Z','#5a3018')+c(40.5,35,2.6,'#5a3018')})+
 p('M36 25Q48 14 66 21L68 26Q52 22 36 28Z',P.d)+p('M38 24Q50 18 64 22L60 17Q46 12 38 24Z',P.m)+p('M62 18Q76 4 84 8Q74 12 66 22Z',CREAM)+ln('M64 20Q74 10 82 8',P.l,1)};
F.JD=()=>{const P=PAL.D;return wash(P,1)+
 legs('#4a3418','#2a1a10')+tunic(P,'#7a5a2a','#3a2410')+p('M34 52Q50 46 66 52L62 64Q50 60 38 64Z',P.m)+p('M44 60h12v40H44z',P.m,.85)+[64,72,80,88].map(y=>c(50,y,1,GOLDD)).join('')+
 /* libro mastro */
 p('M20 64l20-4 3 22-20 4z','#6a2a1a')+p('M22 65l17-3.4 2.6 19-17 3.4z',CREAM)+[68,72,76].map(y=>ln(`M25 ${y}l12-2.4`,'#8a6a4a',.7)).join('')+
 arm([35,56,26,72,32,74],'#7a5a2a',8)+
 arm([65,56,78,62,82,52],'#7a5a2a',8)+p('M76 54q6-10 12 0q2 10-6 10t-6-10z','#8a5a2a')+ln('M78 52q4-3 8 0',GOLD,1.2)+coin(84,66,2.4)+coin(88,76,2.4)+coin(82,84,2)+
 head({brow:'sly',mouth:'smirk',skin:'#f3d4b4',hairFront:'',beard:ln('M45 42Q50 40 55 42',INK,1.3)})+
 `<circle cx="53.6" cy="36.4" r="3" fill="none" stroke="${GOLD}" stroke-width="1"/>`+ln('M56.6 37L60 46',GOLD,.6)+
 p('M40 28L42 8Q50 4 58 8L60 28Q50 25 40 28Z','#3a2410')+p('M39 26h22v4H39z',P.m)+coin(50,28,1.6)};
F.JC=()=>{const P=PAL.C;return wash(P)+
 /* mura dietro */
 [[12,96],[24,96],[76,96],[88,96],[6,106],[18,106],[82,106],[94,106],[12,116],[88,116]].map(([x,y])=>p(`M${x-5.6} ${y}h11.2v9h-11.2z`,'#b9ad96',.8)).join('')+
 p('M44 100h6v26h-6zM54 100h6v26h-6z','#4a5a3a')+p('M41 122h11v10H38q-1-6 3-10zM52 122h11q3 4 2 10H52z','#2a1a10')+
 p('M28 52Q50 42 72 52L76 104Q50 112 24 104Z','#7d8494')+p('M28 52Q50 42 72 52L72 62Q50 56 28 62Z',P.m)+p('M36 62h28v40H36z',P.m)+p('M58 62h6v40h-6z',P.d,.5)+p('M24 96h52v6H24z','#4a2a12')+
 /* clava */
 p('M70 22l6-2 8 50-4 1z','#6a4020')+e(74,24,8,11,'#7a4a24')+[[69,18],[78,15],[81,26],[68,30],[75,34]].map(([x,y])=>p(`M${x} ${y}l2-4 2 4z`,STEELD)).join('')+
 arm([70,56,82,64,78,74],'#7d8494',10,'#d9a07a')+
 arm([30,56,18,72,26,86],'#7d8494',10,'#d9a07a')+
 head({brow:'angry',mouth:'frown',skin:'#d9a07a',skind:'#b07850',beard:p('M41 40Q42 50 50 51Q58 50 59 40Q54 46 50 45Q46 46 41 40Z','#5a3a24',.85)})+
 p('M39 34Q38 20 50 19Q62 20 61 34L58 30H42Z',STEEL)+p('M50 19Q62 20 61 34L58 30H50Z',STEELD,.5)+p('M48.6 26h2.8v12h-2.8z',STEELD)+p('M38 31h24v3H38z',STEELD)};
F.JS=()=>{const P=PAL.S;return wash(P,1)+
 /* ascia */
 p('M67 18h3.4v100H67z','#5a3414')+p('M70 22Q90 22 92 42Q82 38 70 42Z','#b8bfcc')+p('M70 22Q90 22 92 42Q86 30 70 30Z','#e8ecf2',.6)+p('M67 24Q58 28 58 36Q62 32 67 34Z',STEELD)+
 legs('#2a2440','#141018')+p('M33 52Q50 44 67 52L70 100Q50 106 30 100Z','#4a3a2a')+p('M38 54h24v46H38z',P.m)+p('M54 54h8v46h-8z',P.d,.5)+p('M30 92h40v6H30z','#2a1a10')+
 arm([65,56,72,60,68,62],'#b88a68',9,'#c7977a')+
 /* cappio */
 arm([35,56,24,70,24,82],'#b88a68',9,'#c7977a')+`<circle cx="22" cy="96" r="6" fill="none" stroke="#c9a36a" stroke-width="2"/>`+ln('M24 84V90',`#c9a36a`,2)+
 p('M37 52L39 24Q50 4 61 24L63 52Q50 48 37 52Z',P.d)+p('M50 6Q60 14 61 24L63 52Q56 50 50 50Z','#141830',.4)+
 e(45.4,33,2.6,1.6,'#0a0a10')+e(54.6,33,2.6,1.6,'#0a0a10')+c(45.4,33,.8,'#ffcf5a')+c(54.6,33,.8,'#ffcf5a')+
 p('M44 44Q50 47 56 44',P.d)};
F.QH=()=>{const P=PAL.H;return wash(P)+
 p('M36 30Q30 60 34 78Q44 70 50 70Q56 70 66 78Q70 60 64 30Z','#6a1a22')+ /* capelli lunghi */
 p('M30 28Q14 70 16 118Q30 100 40 70Z','#f6e6e6',.55)+ /* velo */
 gown(P)+p('M36 52Q50 62 64 52L64 56Q50 66 36 56Z',CREAM)+ln('M22 120Q40 112 50 120Q60 112 78 120',P.d,1.5,.6)+
 arm([36,56,34,72,46,70],P.m,7.5)+arm([64,56,66,72,54,70],P.m,7.5)+
 heart(50,66,6,'#e9898a')+ln('M48 61l3 4-2 3 2 4',INK,1)+ln('M50 52l-3 6m6-6l-3 6','#d4af6a',.8)+
 head({brow:'sad',mouth:'frown',tear:1,lip:'#9a2a3a',skin:'#f3d0b8',hairFront:p('M40 33Q40 22 50 22Q60 22 60 33Q56 26 50 27Q44 26 40 33Z','#6a1a22')})+tiara(50,25,GOLD,'#e9898a')};
F.QD=()=>{const P=PAL.D;return wash(P,1)+
 [[30,128],[38,130],[22,130],[70,128],[78,130],[62,131],[26,123],[74,123],[34,125]].map(([x,y])=>coin(x,y,3.4)).join('')+
 gown(P)+p('M28 110Q50 102 72 110L76 120Q50 112 24 120Z',GOLDD,.5)+fur(50)+p('M44 60h12l-6 30z',P.l)+
 /* bilancia */
 arm([64,56,74,48,74,36],P.m,7.5)+p('M73 18h2v18h-2z',GOLDD)+p('M64 20h20v1.8H64z',GOLDD)+ln('M65 21l-4 9m4-9l4 9M83 21l-4 9m4-9l4 9',GOLDD,.6)+p('M60 30h10q-5 5-10 0z',GOLD)+p('M78 30h10q-5 5-10 0z',GOLD)+coin(65,28.5,1.6)+coin(83,28.5,1.6)+coin(83,26,1.6)+
 arm([36,56,26,68,34,76],P.m,7.5)+coin(34,76,2.6)+
 head({brow:'sly',mouth:'smirk',lip:'#a0402a',hairBack:p('M38 32Q36 52 42 54H58Q64 52 62 32Z','#c8642a'),hairFront:p('M40 33Q40 22 50 22Q60 22 60 33Q55 25 50 27Q45 25 40 33Z','#c8642a')})+
 p('M41 26L40 10L45 16L50 6L55 16L60 10L59 26Z',GOLD)+p('M40 23h20v3.6H40z',GOLDD)+c(50,24.8,1.6,'#3f8fe0')};
F.QC=()=>{const P=PAL.C;return wash(P)+
 /* bastone di rovi */
 p('M22 20l3-1 6 112-3 .4z','#4a3020')+ln('M24 30q-8 6 0 12q8 6 0 12q-8 6 0 12q8 6 0 12',P.d,1.6)+[[19,34],[29,46],[20,58],[29,70],[22,82]].map(([x,y])=>p(`M${x} ${y}l-2-2 3 0z`,INK)).join('')+c(24,18,4.5,'#7a3c9a')+c(22,16,1.6,'#c9a3ea')+
 p('M36 30Q24 50 30 66L40 54Z','#8a9a7a')+p('M64 30Q76 50 70 66L60 54Z','#8a9a7a')+
 gown(P,P.m,P.d,'M36 52Q50 46 64 52L66 78Q82 108 88 134L82 129 76 135 70 129 64 135 58 129 52 135 46 129 40 135 34 129 28 135 22 129 12 134Q18 108 34 78Z')+
 ln('M36 80q14 10 28 0M30 100q20 12 40 0',P.d,1.4,.7)+[[38,86],[62,86],[34,104],[66,104]].map(([x,y])=>c(x,y,1.8,'#7a3c9a')).join('')+
 arm([36,56,26,58,25,48],P.m,7)+arm([64,56,76,66,72,76],P.m,7,'#d8dcc0')+
 [[70,82],[76,86],[73,90]].map(([x,y])=>c(x,y,1.4,'#7a3c9a')).join('')+
 head({brow:'angry',mouth:'smirk',skin:'#d8dcc0',skind:'#aab09a',lip:'#5a2a5a',noblush:1,hairFront:p('M38 34Q34 18 50 20Q66 18 62 34Q58 26 50 26Q42 26 38 34Z','#8a9a7a')})+
 ln('M38 24Q44 14 50 20Q56 12 62 24',P.d,2)+[[40,19],[46,14],[52,15],[58,17],[62,22],[44,21]].map(([x,y])=>p(`M${x} ${y}l1-4 1 4z`,INK)).join('')+c(50,15,1.6,'#7a3c9a')};
F.QS=()=>{const P=PAL.S;return wash(P,1)+
 p('M34 26Q20 70 18 134H82Q80 70 66 26Q50 16 34 26Z','#161828')+ /* velo nero */
 gown(P,'#2a2e52','#0e1028')+ln('M30 104q20 8 40 0M24 120q26 10 52 0',P.l,.8,.5)+
 /* spilla ragno */
 e(50,62,3,3.6,INK)+c(50,57.6,2,INK)+ln('M47 60l-5-3M47 63l-5 0M47 66l-5 3M53 60l5-3M53 63l5 0M53 66l5 3',INK,.8)+c(50,62,1,'#c8262f')+
 arm([36,56,30,72,40,76],'#2a2e52',7,'#e8e0ea')+
 /* ventaglio */
 arm([64,56,72,50,64,44],'#2a2e52',7,'#e8e0ea')+p('M64 44L52 26Q64 18 78 26Z',INK)+[56,60,64,68,72].map(x=>ln(`M64 44L${x} 24`,P.l,.6,.7)).join('')+
 head({brow:'calm',lids:1,mouth:'lips',lip:'#4a1a3a',skin:'#ece2ec',skind:'#c0b0c8',noblush:1,hairFront:p('M40 34Q40 22 50 22Q60 22 60 34Q55 27 50 28Q45 27 40 34Z',INK)})+
 p('M38 26Q50 12 62 26Q50 22 38 26Z','#0a0a14')+p('M41 25L50 17L59 25',INK)+c(50,18,1.4,'#8d9de0')};
F.KH=()=>{const P=PAL.H;return wash(P)+cape(P.d,1)+[[24,70,-30],[78,84,30],[30,104,-20]].map(([x,y,a])=>`<g transform="rotate(${a} ${x} ${y})">${p(`M${x-.8} ${y-14}h1.6v18h-1.6z`,'#6a4020')+p(`M${x-2.4} ${y-18}l2.4 6 2.4-6z`,'#e8ecf2')+p(`M${x-2} ${y+2}l2 4 2-4z`,CREAM)}</g>`).join('')+
 robe(P)+fur()+p('M46 58h8v74h-8z',CREAM,.8)+heart(50,68,6.5,'#ff8a7a')+c(50,67,10,'#ff8a7a',.25)+ln('M50 74v10',P.d,1.6)+
 `<g transform="rotate(180 50 108)">${sword(50,84,118)}</g>`+
 arm([34,56,26,80,46,94],P.m,8)+arm([66,56,74,80,54,94],P.m,8)+
 head({brow:'sad',mouth:'frown',skin:'#e6c0a4',hairBack:e(50,32,11.5,9,'#b8b0a8'),beard:p('M40.5 38Q40 54 50 58Q60 54 59.5 38Q55 46 50 45Q45 46 40.5 38Z','#d8d0c4')+ln('M45 43Q50 40 55 43',`#b8b0a8`,1.6)})+
 `<g transform="rotate(-8 50 26)">${crownK(50,27,GOLD,GOLDD,'#c8262f')}</g>`+p('M53 13l2 6-3 2z',CREAM)};
F.KD=()=>{const P=PAL.D;return wash(P,1)+
 cape('#7a1c28')+robe(P,P.m,P.d,6)+fur()+e(50,90,20,22,P.l,.55)+p('M28 96h44v6H28z',GOLDD)+c(50,99,3.4,'#3f8fe0')+[[32,128],[42,131],[60,130],[70,128]].map(([x,y])=>coin(x,y,3.4)).join('')+
 /* scettro */
 p('M77 30h3v68h-3z',GOLDD)+p('M78.5 18l6 7-6 7-6-7z','#7ad0f0')+p('M78.5 18l6 7-6 7z','#3f8fe0',.6)+c(78.5,32,2.6,GOLD)+
 arm([67,56,82,66,78.5,74],P.m,9)+
 /* calice */
 arm([33,56,20,64,24,52],P.m,9)+p('M18 36h12q0 9-6 10-6-1-6-10z',GOLD)+p('M23 46h2v6h-2zM20 52h8v2h-8z',GOLDD)+p('M19 37h10q-1 3-5 3t-5-3z','#7a1c28')+
 head({brow:'sly',mouth:'smirk',skin:'#f0c7a0',hy:37,beard:p('M40 40Q39 56 50 57Q61 56 60 40Q55 47 50 46Q45 47 40 40Z','#c8642a')+p('M42 44Q46 40 50 43Q54 40 58 44Q54 46 50 45Q46 46 42 44Z','#a8501c')})+
 crownK(50,27,GOLD,GOLDD,'#3f8fe0')+c(44,20,1.2,'#c8262f')+c(56,20,1.2,'#c8262f')};
F.KC=()=>{const P=PAL.C;return wash(P)+
 /* scudo sulla schiena */
 p('M18 52h20v22q0 12-10 18-10-6-10-18z',P.d)+p('M22 56h12v16q0 8-6 12-6-4-6-12z',P.l,.6)+
 cape(P.m)+p('M32 52Q50 44 68 52L72 132H28Z',STEEL)+p('M56 50L68 52L72 132H58Z',STEELD,.5)+p('M38 58h24v20H38z','#b8bfcc')+ln('M38 84h24M36 96h28M34 108h32M32 120h36',STEELD,1.4)+p('M44 78h12v54H44z',P.m,.85)+
 /* spadone piantato */
  p('M48 76h4v52h-4z','#c8ced8')+p('M50 76h2v52h-2z',STEELD,.4)+p('M48 128l2 6 2-6z','#c8ced8')+p('M38 72h24v4H38z','#7a5a3a')+p('M48 60h4v12h-4z','#4a2a12')+c(50,58,3,'#7a5a3a')+
 arm([34,56,30,70,46,66],STEEL,9,'#c9926a')+arm([66,56,70,70,54,66],STEEL,9,'#c9926a')+
 head({brow:'angry',mouth:'flat',skin:'#c9926a',skind:'#a06a48',scar:1,beard:p('M40 38Q38 56 50 58Q62 56 60 38Q55 46 50 45Q45 46 40 38Z',INK)+ln('M44 43Q50 40 56 43',INK,1.6)})+
 p('M39 30Q38 20 50 19Q62 20 61 30Z',STEEL)+p('M39 27h22v4H39z',GOLD)+[42,46,50,54,58].map(x=>p(`M${x-1.6} 27l1.6-5 1.6 5z`,GOLD)).join('')+
 p('M39 24Q28 22 26 10Q32 18 40 20Z',CREAM)+p('M61 24Q72 22 74 10Q68 18 60 20Z',CREAM)};
F.KS=()=>{const P=PAL.S;return wash(P,1)+
 /* ombre */
 ln('M18 60q-6 10 2 18M82 70q6 10-2 18M14 96q-6 8 2 14',P.l,2,.5)+
 p('M50 30Q16 40 8 134l9-6 7 8 8-8 8 8 10-8 10 8 8-8 8 8 7-8 9 6Q84 40 50 30Z','#10132a')+
 robe(P,'#232a5a','#0c0e22')+p('M44 54h12v78H44z','#0c0e22',.7)+ln('M40 70h20M38 84h24M36 98h28',P.l,.6,.5)+
 /* scettro col teschio */
 p('M76 36h3v72h-3z',INK)+e(77.5,30,6,6.4,'#e8e4dc')+e(75.4,30.4,1.6,1.8,'#7a5af0')+e(79.6,30.4,1.6,1.8,'#7a5af0')+p('M75 35h5v2.4h-5z','#e8e4dc')+c(77.5,30,10,'#7a5af0',.18)+
 arm([67,56,82,62,77.5,66],'#232a5a',8,'#a8a0b8')+
 arm([33,56,24,72,30,88],'#232a5a',8,'#a8a0b8')+c(30,88,5,'#7a5af0',.3)+
 head({brow:'angry',mouth:'frown',skin:'#a8a0b8',skind:'#7a7090',eyeGlow:'#b89aff',noblush:1,lip:'#3a2a4a',hairBack:p('M38 30Q34 52 40 58H60Q66 52 62 30Z',INK),beard:p('M42 42Q42 56 50 60Q58 56 58 42Q54 47 50 46Q46 47 42 42Z',INK)})+
 p('M38 28L36 6L42 18L46 2L50 16L54 2L58 18L64 6L62 28Z',INK)+p('M37 25h26v4H37z','#2a2e52')+c(50,26.8,1.6,'#7a5af0')};
F.X=()=>{const R='#c8262f',Y='#e8b83a';return p('M20 36C10 66 16 112 34 126C56 140 84 128 88 102C94 70 90 34 70 22C52 12 28 18 20 36Z','#f6d9a8',.75)+
 [[18,30,'#3f8fe0'],[82,24,'#3f7d4c'],[86,52,R]].map(([x,y,f])=>c(x,y,4.4,f)+c(x-1.4,y-1.4,1.2,'#fff',.6)).join('')+ln('M24 40Q50 6 78 28',INK,.5,.3)+
 p('M41 98h7.5v26h-7.5z',R)+p('M51.5 98H59v26h-7.5z',Y)+p('M36 122h12v8H34zM52 122h12l2 8H52z',INK)+c(34,126,2,Y)+c(66,126,2,R)+
 p('M34 52Q50 46 50 48V102Q40 104 29 100Z',Y)+p('M50 48Q50 46 66 52L71 100Q60 104 50 102Z',R)+
 p('M30 100l5 6 5-6 5 6 5-6 5 6 5-6 5 6 5-6 5 6 1-6Z',INK,.85)+p('M36 52l6 8 8-8 8 8 6-8Q50 62 36 52Z',CREAM)+
 arm([35,56,22,56,20,38],R,7.5)+arm([65,56,80,60,82,44],Y,7.5)+
 head({brow:'sly',mouth:'grin',skin:'#f3d4b4'})+
 p('M40 30Q38 18 50 16Q62 18 60 30Z',R)+p('M50 16Q62 18 60 30H50Z',Y)+p('M42 22Q30 14 24 24Q32 20 40 28Z',R)+p('M58 22Q70 14 76 24Q68 20 60 28Z',Y)+p('M48 17Q50 4 54 2Q52 10 52 17Z',R)+
 c(24,25,2.6,Y)+c(76,25,2.6,R)+c(54,3,2.4,Y)+p('M39 28h22v4H39z',INK)};
/* filtro "pittura": bordi irregolari + grana di carta (definito una volta nella pagina) */
const DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="fzpaint" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.3" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="8" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 .2  0 0 0 0 .12  0 0 0 0 .05  0 0 0 -.7 .42" result="ga"/><feComposite in="ga" in2="d" operator="in" result="gm"/><feMerge><feMergeNode in="d"/><feMergeNode in="gm"/></feMerge></filter></defs></svg>';
const TILT={JH:-5,JD:4,JC:-2,JS:-3,QH:3,QD:-4,QC:5,QS:-2,KH:2,KD:-3,KC:1,KS:3,X:-6};const cache={};
function svg(id){if(!cache[id]){const k=id==='X'?'X':id.slice(-2);cache[id]=F[k]?`<svg class="fzsvg" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g filter="url(#fzpaint)"><g transform="translate(6 9) scale(.88)"><g transform="rotate(${TILT[k]||0} 50 80)">${F[k]()}</g></g></g></svg>`:''}return cache[id]}
let dd=0;function ensureDefs(){if(dd)return;dd=1;if(typeof document!=='undefined'&&!document.getElementById('fzdefs')){const d=document.createElement('div');d.id='fzdefs';d.innerHTML=DEFS;document.body.appendChild(d)}}
return{svg,ensureDefs,F}})();

function cardH(id,o={}){FACE.ensureDefs();
 if(o.back)return`<div class="card back ${o.cls||''}"></div>`;
 const{r,s}=P(id),a=o.attrs||'',face='JQK'.includes(r)&&!o.boss&&!o.nofoil,cls=`card ${s||'X'} ${'JQKX'.includes(r)?'fz':''} ${o.cls||''} ${face||(r==='X'&&!o.nofoil)?'foil':''}`,st=o.style?`style="${o.style}"`:'',dv=o.dv?`<div class="dv">−${o.dv}</div>`:'';let inner;
 if(r==='X')return`<div class="${cls}" ${a} ${st}><div class="ix"><span>J</span></div>${FACE.svg('X')}<div class="val">0</div>${dv}</div>`;
 const ix=`<div class="ix"><span>${r}</span><i>${SYM[s]}</i></div><div class="ix r"><span>${r}</span><i>${SYM[s]}</i></div>`;
 if(PIPS[r])inner=`<div class="pips">${PIPS[r].map(([x,y])=>`<b class="${y>.5?'f':''}" style="left:${x*50}%;top:${y*100}%">${SYM[s]}</b>`).join('')}</div>`;
 else if(r==='A')inner=`<div class="art">${ART.A}<em>${SYM[s]}</em></div><div class="val">1</div>`;
 else inner=`${FACE.svg(r+s)}${o.boss?'':`<div class="val">${RG.cv(id)}</div>`}`;
 return`<div class="${cls}" ${a} ${st}>${ix}${inner}${dv}</div>`}
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return h};
