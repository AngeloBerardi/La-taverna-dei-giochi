/* ---- Scena 3D di Cantari di Ventura (A12): la descrizione logica di arena e mondo, la luce e la telecamera. Motore puro, niente DOM, niente three.js. ----
   Il 3D sta sotto l'SVG e deve cadere al pixel dove l'SVG disegna: per questo la geometria (raggi, schiacciamento SQ) è la stessa di BatMappa e MoMappa
   e la telecamera è una proiezione obliqua: x' = X, y' = Z·SQ − Y·L (L pixel per unità di altezza), profondità = −Y.
   Posizioni 3D: X = x_svg, Z = y_svg / SQ, Y = altezza in pixel. I colori del terreno restano nelle viste (BatMappa.PAL, MoMappa.COL): qui solo forme e quote.
   Un «pezzo» è [forma, colore, x, y, z, a, b, c, ry, rz, flag]: c cilindro (a raggio alto, b raggio basso, c altezza), k cono (a raggio, c altezza), s ellissoide (a, b, c = semiassi),
   b scatola (a larghezza, b altezza, c profondità); y = centro; ry/rz = rotazioni; flag 'e' = luminoso (finestre, fuoco, gemme). Piani, piccoli, fusi dal rendering.
   Nessun dado: la varietà viene da hash(), deterministico. Test: tests/test_avv_scena.js · piano: docs/AVVENTURA-A12.md. */
const ASCE=(()=>{
 const S3=Math.sqrt(3);
 const GEO={bat:{Z:26,SQ:.84,R:25},mon:{Z:26,SQ:1,R:24.8}};
 const QUOTA={rialzo:6,muro:18,base:-10};                                   // quote in pixel (come i prisma di BatMappa)
 const ALT_MON={pianura:0,strada:0,bosco:0,collina:5,palude:-1,montagna:8,acqua:-3};
 // centro di una cella nel piano (x, z); nell'SVG è (x, z·SQ)
 const pos=(modo,q,r)=>{const g=GEO[modo];return{x:g.Z*S3*(q+r/2),z:g.Z*1.5*r}};
 const aOffset=(q,r)=>q+Math.floor(r/2);
 // numero stabile in [0,1) da tre interi
 function hash(a,b,c){let h=Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul((c|0)+17,1274126177)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296}
 const cos=Math.cos,sin=Math.sin,PI=Math.PI;
 // ---- telecamera ----
 // vb = viewBox dell'SVG [x,y,w,h], px = [W,H] dimensioni del canvas. Con preserveAspectRatio «meet» il mondo visibile è centrato sul centro del viewBox.
 function proiez(o){const[vx,vy,vw,vh]=o.vb,W=o.px[0],H=o.px[1],SQ=o.SQ,L=o.L==null?1:o.L,YM=o.YM||400;
  const k=Math.min(W/vw,H/vh),w=W/k,h=H/k,cx=vx+vw/2,cy=vy+vh/2;
  const m=[2/w,0,0,0, 0,2*L/h,-1/YM,0, 0,-2*SQ/h,0,0, -2*cx/w,2*cy/h,0,1];
  return{vis:{cx,cy,w,h,k},m,schermo:(X,Y,Z)=>[X,Z*SQ-Y*L],
   // un punto 3D in coordinate normalizzate del dispositivo (per i test)
   ndc:(X,Y,Z)=>{const p=[X,Y,Z];return[m[0]*p[0]+m[12],m[5]*p[1]+m[9]*p[2]+m[13],m[6]*p[1]]}}}
 // ---- pezzi degli oggetti ----
 const P=(f,col,x,y,z,a,b,c,ry,rz,fl)=>[f,col,x,y,z,a,b,c,ry||0,rz||0,fl||''];
 function albero(s,r,x,z,tipo){const h=(tipo==='abete'?24:18)+Math.floor(s*8),col=['#2f6b34','#3f8a45','#276028'];
  if(tipo==='abete')return[P('c','#5a3a1c',x,3,z,1.6,2.2,6),P('k',col[2],x,h*.36+3,z,9,0,h*.5),P('k',col[0],x,h*.62+3,z,7,0,h*.45),P('k',col[1],x,h*.86+3,z,4.6,0,h*.36)];
  return[P('c','#5a3a1c',x,h*.3,z,1.9,2.6,h*.6),P('s',col[0],x,h*.78,z,9,8,9),P('s',col[1],x+3.5,h*.95,z-2,6,5.5,6),P('s',col[2],x-4,h*.7,z+1.5,5,4.5,5)]}
 function seccoAlb(s,x,z){const h=20+Math.floor(s*6);return[P('c','#4a3a2c',x,h/2,z,1.6,3.2,h),P('c','#4a3a2c',x+4,h*.78,z,.9,1.5,11,0,-.9),P('c','#4a3a2c',x-4,h*.64,z,.8,1.4,10,0,.9)]}
 function roccia(s,x,z,g){const c=['#8a8070','#9a9080','#756c5c'];return[P('s',c[0],x,6*g,z,12*g,8*g,10*g),P('s',c[1],x+4*g,12*g,z-2*g,8*g,8*g,7*g),P('s',c[2],x-5*g,5*g,z+3*g,6*g,5*g,6*g)]}
 function colonna(x,z,h,col){col=col||'#a89e8a';return[P('b','#8f8573',x,1.5,z,16,3,16),P('c',col,x,h/2+1.5,z,6.2,7.2,h),P('b','#8f8573',x,h+3,z,15,3,15)]}
 function massoP(s,x,z){return[P('s','#8c8478',x,5,z,11,8,10),P('s','#a09888',x+3,8,z-2,6,5,5)]}
 function cassa(x,z){return[P('b','#8a6a3c',x,5,z,15,10,15),P('b','#5a4024',x,5,z,16,2.4,16),P('b','#5a4024',x,5,z,2.4,10.4,16)]}
 function casa(x,z,ry,w,col,tetto,fin){w=w||9;const p=[P('b',col||'#c8b48a',x,w*.42,z,w,w*.84,w*.9,ry),P('k',tetto||'#8a3a2a',x,w*.84+w*.32,z,w*.78,0,w*.64,ry+PI/4)];
  if(fin)p.push(P('b','#ffcf6a',x+sin(ry)*w*.46,w*.4,z+cos(ry)*w*.46,w*.22,w*.26,.6,ry,0,'e'));return p}
 function torre(x,z,r,h,tetto,fin){const p=[P('c','#9a8f80',x,h/2,z,r*.92,r,h),P('k',tetto||'#7a3a4a',x,h+r*.8,z,r*1.25,0,r*1.7)];
  if(fin)for(let i=0;i<2;i++)p.push(P('b','#ffcf6a',x,h*(.5+i*.25),z+r*.9,r*.28,r*.4,.8,0,0,'e'));return p}
 function ogg3(k,s,ctx){ctx=ctx||{};const fin=!!ctx.notte;
  switch(k){
   case'albero':return albero(s,0,0,0,'tondo');
   case'albero-secco':return seccoAlb(s,0,0);
   case'roccia':return roccia(s,0,0,ctx.g||1);
   case'colonna':return colonna(0,0,22);
   case'masso':return massoP(s,0,0);
   case'cassa':return cassa(0,0);
   case'bosco':{const n=3+Math.floor(s*3),o=[];for(let i=0;i<n;i++){const a=PI*2*(i/n+s),d=8+hash(i,7,Math.floor(s*1000))*11;o.push(...albero(hash(i,3,Math.floor(s*997)),0,cos(a)*d,sin(a)*d*.9,hash(i,5,Math.floor(s*991))<.55?'abete':'tondo'))}return o}
   case'albero-solo':return albero(s,0,0,0,s<.5?'abete':'tondo');
   case'ciuffi':{const o=[];for(let i=0;i<3;i++){const a=PI*2*(i/3+s);o.push(P('k','#6f9a45',cos(a)*11,2.4,sin(a)*10,2.4,0,5))}return o}
   case'picco':return[P('k','#7d7d8c',0,13+0,0,18,0,26+Math.floor(s*8)),P('k','#f1f1f4',0,26+Math.floor(s*8)-3.5,0,6.6,0,9),P('k','#6c6c7a',-13,6,5,10,0,13),P('k','#8a8a98',12,5,-4,9,0,10)];
   case'canne':{const o=[];for(let i=0;i<4;i++){const a=PI*2*(i/4+s),d=8+hash(i,2,Math.floor(s*977))*8;o.push(P('c','#7a6a3a',cos(a)*d,6,sin(a)*d*.9,.7,.9,12+i*2))}return o}
   case'citta':{const o=[];
    for(let i=0;i<6;i++){const a=PI/3*i+PI/6,b=a+PI/3;if(i===3)continue;const mx=(cos(a)+cos(b))/2*19,mz=(sin(a)+sin(b))/2*19;o.push(P('b','#8a8478',mx,4,mz,19,8,3,-(a+b)/2+PI/2))}
    for(const a of[PI/6,PI/2+PI/3,PI*1.5+PI/6])o.push(...torre(cos(a)*21,sin(a)*21,3.8,15,'#7a3a2a',fin));
    o.push(...torre(0,-2,6,24,'#8a2a22',fin),...casa(-10,8,.2,9,'#cdb98f','#8a3a2a',fin),...casa(10,9,-.2,9,'#d6c49c','#7a4a2a',fin),...casa(-9,-9,-.1,8,'#c8b48a','#7a3a2a',false));return o}
   case'villaggio':return[...casa(-9,6,.3,9,'#cdb98f','#7a4a2a',fin),...casa(9,3,-.3,9,'#c4ae84','#8a3a2a',fin),...casa(0,-10,0,8,'#d6c49c','#6a4a2a',false),P('c','#7a7060',2,2,10,3,3.4,4)];
   case'santuario':{const o=[];for(let i=0;i<5;i++){const a=PI*2*i/5;o.push(P('b','#a8a8b4',cos(a)*15,7,sin(a)*14,5,14,3.4,-a));}o.push(P('s','#9fe0ff',0,10,0,4.5,4.5,4.5,0,0,'e'),P('c','#8f8f9c',0,2,0,7,8,4));return o}
   case'campo':return[P('k','#b5483a',-9,6,3,9,0,12),P('k','#d6b45a',9,5,5,8,0,10),P('c','#4a3018',0,1.2,-4,4,4,2.4),P('k','#ff9a3a',0,5,-4,2.6,0,7,0,0,'e'),P('k','#fff0a0',0,4,-4,1.2,0,4,0,0,'e')];
   case'antro':return[P('s','#6a6054',0,8,0,21,13,17),P('s','#4a4238',-12,6,6,8,7,7),P('s','#5a5044',13,4,5,7,5,6),P('b','#0c0a08',0,5,12,12,10,2),P('s','#0c0a08',0,10,11.4,6,6,1.2)];
   case'rovina':return[...colonna(-9,3,18),...colonna(7,-6,10),P('b','#8f8573',2,3,10,16,6,8,.5),P('b','#a89e8a',-4,2,-9,7,4,9,-.4),P('c','#a89e8a',12,3,8,5.4,6,6,0,1.4)];
   case'torre':return[...torre(0,0,9,42,'#4a3a7a',fin),P('b','#3a2c58',0,3,0,24,6,24)];
   case'sassi':return[P('s','#8a8478',-6,1.6,3,3.2,1.8,2.6),P('s','#9a9488',5,1.2,-4,2.4,1.4,2),P('s','#7a7468',1,1,7,1.8,1.2,1.6)];
   case'stalagmite':return[P('k','#7a7268',0,5,0,3.6,0,10),P('k','#8a8278',6,3,3,2.2,0,6)];
   case'fiori':return[P('c','#4f8a45',-5,2.4,3,.4,.4,5),P('s','#f4e27a',-5,5.4,3,1.5,1.5,1.5),P('c','#4f8a45',6,2,-3,.4,.4,4),P('s','#f08aa0',6,4.6,-3,1.4,1.4,1.4),P('c','#4f8a45',1,2,8,.4,.4,4),P('s','#fff6e8',1,4.6,8,1.3,1.3,1.3)];
   case'tesoro':return[P('b','#6a4a24',0,4,0,13,8,9),P('c','#7a5a2c',0,9,0,4.5,4.5,13,0,PI/2),P('b','#f3c64a',0,6,4.6,3,3.4,.8,0,0,'e'),P('s','#f3c64a',0,13,0,3,3,3,0,0,'e')];
   // ---- oggetti di scena dei temi della resa pixel (B2) ----
   case'abete':return albero(s,0,0,0,'abete');
   case'ceppo':return[P('c','#6a4a2a',0,4,0,6,6.8,8),P('c','#c8a070',0,8.1,0,5.6,5.6,.3),P('s','#4f8a45',4.5,2.4,3,3,2,2.6),P('c','#5a3a1c',-6,1.2,-2,1,1.6,2.4,0,1.2)];
   case'tronco':return[P('c','#6a4a2a',0,5,0,5,5.4,28,s*.6-.3,PI/2),P('s','#4f8a45',3,9.4,1,4,1.6,3),P('c','#5a3a1c',-4,10,-1,1,1.2,6,0,-.4)];
   case'cespuglio':return[P('s','#3f8a45',0,6,0,10,7,9),P('s','#2f6b34',-6,4,3,6,5,6),P('s','#4f9a50',5,8,-2,6,5,6),P('s','#c03a2e',3,10,6,1.3,1.3,1.3),P('s','#c03a2e',-4,8,6.5,1.2,1.2,1.2)];
   case'funghi':{const o=[];for(let i=0;i<3;i++){const a=PI*2*(i/3+s),d=5+i*2.5,x=cos(a)*d,z=sin(a)*d*.9,h=2+i;
     o.push(P('c','#e8e0c8',x,h/2,z,.8,1,h),P('s',i===1?'#d6aa3c':'#c03a2e',x,h+.6,z,2.6-i*.3,1.5,2.6-i*.3))}return o}
   case'colonna-rotta':return[P('b','#8f8573',0,1.5,0,16,3,16),P('c','#a89e8a',0,7.5,0,6.2,7.2,12),P('k','#a89e8a',1,14.5,0,5.6,0,4,0,.3),P('c','#9a907c',11,3.4,5,5.4,5.8,13,.5,PI/2)];
   case'statua':return[P('b','#8f8573',0,4,0,16,8,16),P('c','#a8a8a4',0,17,0,4.4,6.4,18),P('s','#a8a8a4',0,29.6,0,4.4,4.8,4.4),P('b','#9a9a98',5.6,21,1,2.6,10,2.6,0,-.5),P('b','#9a9a98',-5.4,19,1,2.6,9,2.6,0,.2),P('s','#4f8a45',-4,8.4,6,3.4,1.4,2)];
   case'sarcofago':return[P('b','#6e685c',0,5,0,15,10,26),P('b','#8a8478',0,10.6,0,16,2,27),P('s','#9a9488',0,12.4,-8,4,2.2,4),P('b','#9a9488',0,12,2,5,1.4,12)];
   case'barile':return[P('c','#8a5a30',0,6,0,6,5.2,12),P('c','#45454c',0,2.6,0,5.4,5.5,.9),P('c','#45454c',0,9.4,0,5.9,5.8,.9),P('c','#5f3f22',0,12.1,0,5.6,5.6,.4)];
   case'lapide':return[P('b','#8a8478',0,6,0,10,12,3),P('s','#8a8478',0,12,0,5,3,1.5),P('b','#6e685c',0,7,1.7,5,1,.4),P('s','#5a4a30',0,.8,6,6,1.6,4.4)];
   case'ossa':return[P('c','#e8e0c8',0,1,0,.8,.8,9,.6,PI/2),P('c','#e8e0c8',3,1,-3,.7,.7,6,-.8,PI/2),P('s','#e8e0c8',-5,2.4,3,2.4,2.2,2.4),P('s','#2a241c',-5,2.6,5.2,.8,.8,.4)];
   case'scaffale':return[P('b','#5a3a1c',0,17,0,22,34,6),P('b','#3a2614',0,17,2.6,19,30,1),P('b','#8a2a2a',-5.5,9.5,2,4,6,3),P('b','#2a4a8a',-1,9,2,4,5,3),P('b','#3a6a3a',4,9.5,2,4,6,3),
     P('b','#d6aa3c',-4,20.5,2,5,5,3),P('b','#6a2a5a',2,21,2,6,6,3),P('b','#8a2a2a',-2,31,2,9,5,3),P('b','#5a3a1c',0,13,2.8,20,1.2,1),P('b','#5a3a1c',0,24.6,2.8,20,1.2,1)];
   case'libri':return[P('b','#8a2a2a',0,1,0,7,2,5),P('b','#2a4a8a',.5,3,0,6.4,2,4.4,.3),P('b','#d6aa3c',0,5,0,5.6,2,4,-.2),P('b','#f4efe0',6,.6,3,4,1.2,3,.8)];
   case'candele':{const o=[];for(let i=0;i<3;i++){const x=(i-1)*3.4,z=(i%2)*2.6,h=4+i*1.5;o.push(P('c','#f0e8d0',x,h/2,z,.9,1,h),P('k','#ffcf6a',x,h+1.4,z,.7,0,2.6,0,0,'e'))}return o}
   case'braciere':return[P('c','#3a3a40',-3,4,0,.6,.8,9,0,.3),P('c','#3a3a40',3,4,0,.6,.8,9,0,-.3),P('c','#4a4a52',0,10,0,7,4,3.4),P('s','#c44404',0,11.6,0,5.4,1.4,5.4,0,0,'e'),
     P('k','#ff9a3a',0,15.6,0,4,0,8,0,0,'e'),P('k','#fff0a0',0,14.4,0,2,0,5,0,0,'e')];
   case'stendardo':return[P('b','#8f8573',0,1.5,0,9,3,9),P('c','#5a3a1c',0,19,0,.9,1,36),P('b','#8a1a2a',4.4,27,0,8,15,.6),P('b','#d6aa3c',4.4,19.2,0,8,1.2,.7),P('s','#d6aa3c',0,37.4,0,1.4,1.4,1.4)];
  }return[]}
 // le parti di un oggetto, ruotate di `ry` e spostate in (x, y, z) (per il rendering: un oggetto per cella)
 function parti(k,s,ctx){return ogg3(k,s,ctx)}
 // ---- arena ----
 const OGG_ALTO={citta:'colonna',antro:'colonna',torre:'colonna',collina:'roccia',palude:'albero-secco'},OGG_BASSO={citta:'cassa',antro:'cassa',torre:'cassa'};
 // dettagli minuti sul pavimento (soglia cumulativa, oggetto): non sono ostacoli, solo decorazione
 const DECO={pianura:[[.2,'ciuffi'],[.27,'fiori']],strada:[[.1,'sassi']],bosco:[[.24,'ciuffi'],[.3,'fiori']],collina:[[.14,'sassi'],[.26,'ciuffi']],palude:[[.2,'canne']],citta:[[.09,'sassi']],antro:[[.1,'sassi'],[.17,'stalagmite']],torre:[[.06,'sassi']]};
 const SUP={f:'fuoco',v:'veleno',g:'ghiaccio',w:'acqua'};
 // ---- temi della resa pixel (B2): pavimento a tessere, 6–10 oggetti di scena, momento della luce ----
 // pav: materiale [nome, spostamento di tono] per tipo di casella; alti/bassi: gli ostacoli «T» e «o»; deco: [soglia cumulativa, oggetto] sul pavimento libero
 const TEMI={
  foresta:{nome:'Foresta',pav:{piano:['erba',0],difficile:['terra',0],rialzo:['erba',1],muro:['pietra',0]},alti:['albero','abete','abete','albero'],bassi:['masso','ceppo','cespuglio','tronco'],
   deco:[[.08,'ciuffi'],[.11,'fiori'],[.14,'funghi'],[.17,'sassi']],interno:false},
  rovine:{nome:'Rovine',pav:{piano:['terra',0],difficile:['erba',-1],rialzo:['pietra',1],muro:['pietra',0]},alti:['colonna','colonna-rotta','albero-secco'],bassi:['masso','statua','cassa'],
   deco:[[.12,'sassi'],[.2,'ciuffi'],[.24,'fiori']],interno:false},
  palude:{nome:'Palude',pav:{piano:['terra',-1],difficile:['erba',-1],rialzo:['terra',0],muro:['pietra',-1]},alti:['albero-secco','albero-secco','abete'],bassi:['ceppo','tronco','masso'],
   deco:[[.18,'canne'],[.24,'funghi'],[.3,'ciuffi']],interno:false},
  sotterraneo:{nome:'Sotterraneo',pav:{piano:['pietra',0],difficile:['terra',-1],rialzo:['pietra',1],muro:['pietra',-1]},alti:['colonna','colonna','colonna-rotta'],bassi:['cassa','barile','sarcofago','lapide'],
   deco:[[.07,'sassi'],[.12,'ossa'],[.16,'stalagmite']],interno:true},
  torre:{nome:'Torre',pav:{piano:['assi',0],difficile:['pietra',0],rialzo:['assi',1],muro:['pietra',0]},alti:['colonna','scaffale'],bassi:['cassa','barile','braciere'],
   deco:[[.05,'sassi'],[.09,'libri'],[.12,'candele']],interno:true},
  fortezza:{nome:'Fortezza della corona',pav:{piano:['pietra',1],difficile:['terra',0],rialzo:['assi',0],muro:['pietra',0]},alti:['colonna','stendardo'],bassi:['cassa','barile','braciere'],
   deco:[[.08,'sassi'],[.12,'ciuffi']],interno:false}};
 const TEMA_DI={bosco:'foresta',pianura:'foresta',strada:'rovine',collina:'rovine',palude:'palude',antro:'sotterraneo',torre:'torre',citta:'fortezza'};
 const tema=amb=>TEMA_DI[amb]||'foresta';
 // oggetti che fanno luce (torce, bracieri, fuochi): colore e quota della fiamma sopra la casella
 const LUCI_OGG={braciere:{y:15,col:'#ffa040'},candele:{y:7,col:'#ffcf6a',forza:.6},campo:{y:6,col:'#ff9a3a'},santuario:{y:10,col:'#9fe0ff',forza:.8}};
 const QUOTA_PX={muro:40};   // nella resa pixel i muri sono alti quasi come un eroe (le quote della battaglia non cambiano)
 // o = { temi: true } per la resa pixel: oggetti e pavimento dal tema del bioma, muri più alti
 function arena(A,o){o=o||{};const g=GEO.bat,amb=A.ambiente||'pianura',tiles=[],uscite=(A.uscite||[]).map(c=>Object.assign({q:c.q,r:c.r},pos('bat',c.q,c.r)));
  const tm=o.temi?TEMI[tema(amb)]:null,scegli=(l,v)=>l[Math.floor(v*l.length)%l.length];
  for(let r=0;r<A.h;r++)for(let col=0;col<A.w;col++){const q=col-Math.floor(r/2),ch=A.righe[r][col],p=pos('bat',q,r),sp=A.sup?SUP[A.sup[r][col]]||null:null;
   const tipo=ch==='#'?'muro':ch==='^'?'rialzo':ch===','?'difficile':'piano',hm=tm?QUOTA_PX.muro:QUOTA.muro;
   const t={q,r,col,x:p.x,z:p.z,scac:(col+r)&1,tipo,h:ch==='#'?hm:ch==='^'?QUOTA.rialzo:0,oggetto:null,sup:sp,s:hash(q,r,1)};
   if(tm)t.pav=tm.pav[tipo];
   if(ch==='T')t.oggetto={k:tm?scegli(tm.alti,hash(q,r,5)):OGG_ALTO[amb]||'albero',s:t.s};else if(ch==='o')t.oggetto={k:tm?scegli(tm.bassi,hash(q,r,6)):OGG_BASSO[amb]||'masso',s:t.s};
   else if((ch==='.'||ch===',')&&!sp){const d=hash(q,r,3),k=tm?tm.deco:DECO[amb];if(k)for(const [lim,nome] of k)if(d<lim){t.deco={k:nome,s:hash(q,r,4)};break}}
   tiles.push(t)}
  return{modo:'bat',SQ:g.SQ,R:g.R,amb,tema:tm?tema(amb):null,w:A.w,h:A.h,tiles,uscite,quota:tm?Object.assign({},QUOTA,QUOTA_PX):QUOTA}}
 // torce sui muri (dove c'è buio): una ogni ~5 caselle di muro, sempre le stesse; px = resa pixel (muri alti, torcia sulla faccia davanti)
 function torce(D,px){const o=[];for(const t of D.tiles)if(t.tipo==='muro'&&hash(t.q,t.r,9)<.22)o.push(px?{x:t.x,y:t.h*.62,z:t.z+GEO.bat.Z+3,k:'torcia'}:{x:t.x,y:t.h+11,z:t.z+13,k:'torcia'});return o}
 // le sorgenti di luce di un'arena: fuochi sul pavimento, torce, oggetti accesi; { x, y, z, k, col, forza }
 function fonti(D,o){o=o||{};const f=[];
  for(const t of D.tiles){if(t.sup==='fuoco')f.push({x:t.x,y:t.h+16,z:t.z,k:'fuoco',col:'#ff8a3a',forza:1});
   for(const g of[t.oggetto,t.deco]){const l=g&&LUCI_OGG[g.k];if(l)f.push({x:t.x,y:t.h+l.y,z:t.z,k:g.k,col:l.col,forza:l.forza||1})}}
  if(o.torce)for(const t of torce(D,o.px))f.push(Object.assign(t,{col:'#ffb347',forza:1}));
  return f}
 // ---- tessere 16×16 del pavimento (B2): colori della palette come numero rampa·5 + tono, righe dall'alto; seme fisso, sempre uguali ----
 const RAMPE=['pietra','erba','legno','pelle','metallo','fuoco','magia','notte'];   // stesso ordine di APAL.NOMI (il test lo controlla)
 const MATERIALI=['pietra','erba','terra','assi'],VARIANTI=6,LATO=16;
 const I=(r,t)=>RAMPE.indexOf(r)*5+Math.max(0,Math.min(4,t));
 function tessera16(mat,v){const n=LATO,g=new Uint8Array(n*n),m=MATERIALI.indexOf(mat),h=(a,b,c)=>hash(a+v*97,b+m*31,c||0),set=(x,y,c)=>{if(x>=0&&y>=0&&x<n&&y<n)g[y*n+x]=c};
  if(m===0){// lastre di pietra: fughe scure, bordo chiaro in alto a sinistra, puntini; fuga sempre sull'ultima riga e colonna (le tessere combaciano)
   const bande=[[0,6,11],[0,5,10],[0,7,12],[0,4,9,13],[0,6,12],[0,5,11]][v%6].concat(n);
   for(let b=0;b+1<bande.length;b++){const y0=bande[b],y1=bande[b+1],x0=Math.floor(h(b,1)*5);let xs=[];for(let x=x0;x<x0+n;x+=5+Math.floor(h(b,x,2)*4))xs.push(x%n);xs=[...new Set(xs.concat(0))].sort((a,c)=>a-c);const ok=[0];for(const x of xs)if(x-ok[ok.length-1]>=3&&n-x>=3)ok.push(x);ok.push(n);xs=ok;
    for(let s=0;s+1<xs.length;s++){const a=xs[s],c=xs[s+1],tono=h(b,s,3)<.18?3:2;
     for(let y=y0;y<y1;y++)for(let x=a;x<c;x++){const fuga=y===y1-1||x===c-1,bordo=y===y0&&x<c-2;set(x,y,I('pietra',fuga?1:bordo?tono+1:h(x,y,5)<.06?tono-1:tono))}}}}
  else if(m===1){// erba: chiazze scure e chiare, pochi ciuffi chiari con l'ombra sotto, un fiore ogni sei tessere (B6.5: più calma, le figure si leggono meglio)
   for(let y=0;y<n;y++)for(let x=0;x<n;x++)set(x,y,I('erba',2));
   for(let i=0;i<5;i++){const x=Math.floor(h(i,1)*n),y=Math.floor(h(i,2)*n),c=h(i,3)<.6?1:3;set(x,y,I('erba',c));set(x+1,y,I('erba',c));if(h(i,4)<.5)set(x,y+1,I('erba',c))}
   for(let i=0;i<[1,2,0,1,1,0][v%6];i++){const x=1+Math.floor(h(i,7)*13),y=1+Math.floor(h(i,8)*12);set(x,y,I('erba',v===0?4:3));set(x-1,y+1,I('erba',3));set(x+1,y+1,I('erba',3));set(x,y+1,I('erba',3));set(x,y+2,I('erba',1));set(x-1,y+2,I('erba',1))}
   if(v===1){const x=2+Math.floor(h(9,1)*12),y=2+Math.floor(h(9,2)*12);set(x,y,I('fuoco',4));set(x,y+1,I('erba',1))}}
  else if(m===2){// terra battuta: grana, sassolini con l'ombra, una crepa
   for(let y=0;y<n;y++)for(let x=0;x<n;x++){const r=h(x,y,1);set(x,y,I('legno',r<.13?1:r<.18?3:2))}
   for(let i=0;i<3;i++){const x=Math.floor(h(i,11)*15),y=Math.floor(h(i,12)*15);set(x,y,I('metallo',3));set(x+1,y,I('metallo',2));set(x,y+1,I('legno',0))}
   if(v%2===0){let x=Math.floor(h(5,13)*10)+2,y=Math.floor(h(5,14)*10)+2;for(let i=0;i<4;i++){set(x,y,I('legno',0));x+=h(i,15)<.5?1:0;y++}}}
  else{// assi di legno: quattro tavole alte 4, fessura scura sotto, filo chiaro sopra, venature, giunta con due chiodi
   for(let y=0;y<n;y++){const tv=y>>2,ry=y&3,e=2+Math.floor(h(tv,21)*12);
    for(let x=0;x<n;x++){let c=ry===3?I('legno',0):ry===0?I('legno',3):h(x>>1,y,22)<.16?I('legno',1):I('legno',2);if(x===e&&ry!==3)c=I('legno',0);if((x===e-1||x===e+1)&&ry===1)c=I('metallo',3);set(x,y,c)}}}
  return g}
 // tutte le tessere in un atlante: VARIANTI colonne × 4 materiali (righe), numeri dei colori; per lo shader e per i test
 function atlante(){const n=LATO,w=n*VARIANTI,hh=n*MATERIALI.length,d=new Uint8Array(w*hh);
  MATERIALI.forEach((mat,m)=>{for(let v=0;v<VARIANTI;v++){const t=tessera16(mat,v);for(let y=0;y<n;y++)for(let x=0;x<n;x++)d[(m*n+y)*w+v*n+x]=t[y*n+x]}});return{w,h:hh,lato:n,varianti:VARIANTI,materiali:MATERIALI,dati:d}}
 // ---- luce della resa pixel (B2): a ogni momento la sua tabella; la perdizione aggiunge viola-rosso a 25/50/75 ----
 // sole: colore, intensità (1 = luce piena), direzione; amb/rifl: [tinta, forza] (luce ambiente blu-viola e riflesso freddo dal basso);
 // cielo: 3 toni della palette dall'alto (lontano) al basso, a retino; nebbia: [tono, forza] a retino ai bordi dell'arena, mai sulle figure
 const MOMENTI={
  giorno:{sole:{col:'#fff2da',int:.95,pos:[-150,175,-105]},amb:['#a0a8ff',.4],rifl:['#7aa8ff',.24],cielo:['pietra:2','pietra:1','notte:3'],nebbia:null,torce:false,finestre:false,fiamme:0},
  tramonto:{sole:{col:'#ffb47a',int:.9,pos:[-220,95,-30]},amb:['#b09cff',.36],rifl:['#7a8cff',.22],cielo:['fuoco:1','magia:1','notte:2'],nebbia:['magia:0',.22],torce:false,finestre:true,fiamme:.6},
  // notte (B6.5): la luna non arriva alla mezzaluce sul pavimento (0,3 × 0,79 < S2), quindi erba e pietra stanno nell'ombra blu e le pozze calde di torce e fuochi risaltano
  notte:{sole:{col:'#9fb4ff',int:.3,pos:[110,210,-120]},amb:['#6070ff',.36],rifl:['#5a8cff',.24],cielo:['notte:3','notte:2','notte:1'],nebbia:['notte:1',.2],torce:true,finestre:true,fiamme:1},
  sotterraneo:{sole:{col:'#ffcf9a',int:.42,pos:[-90,200,-70]},amb:['#a89cff',.32],rifl:['#6a7aff',.16],cielo:['notte:1','notte:0','notte:0'],nebbia:['notte:0',.36],torce:true,finestre:true,fiamme:1}};
 // fiamme: quanto contano le luci puntiformi (di giorno il sole le copre); la perdizione tinge poco la luce (il colore delle cose resta) e molto cielo e nebbia
 // (B6.5: retino della perdizione più leggero, 22/25/28%, e solo ai margini dell'arena: vedi la rifinitura in 24hp-pixel.js)
 const PERD=[null,{amb:'#c070ff',mix:.1,nebbia:['magia:0',.22]},{amb:'#d060c0',mix:.16,nebbia:['magia:0',.25],cielo:['magia:0','notte:1','notte:0']},{amb:'#ff5080',mix:.22,nebbia:['fuoco:0',.28],cielo:['magia:0','notte:1','notte:0']}];
 const RIM={eroi:'#ffc878',nemici:'#7ab4ff',forza:.5};
 const mixHex=(a,b,k)=>{const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16),f=s=>Math.round(((x>>s)&255)*(1-k)+((y>>s)&255)*k);return'#'+((1<<24)|(f(16)<<16)|(f(8)<<8)|f(0)).toString(16).slice(1)};
 // la tabella per un tema (o un ambiente della battaglia), una fase ('giorno'|'tramonto'|'notte') e un livello di perdizione 0–3
 function lucePx(t,fase,liv){const tm=TEMI[t]||TEMI[tema(t)],mo=tm&&tm.interno?'sotterraneo':MOMENTI[fase]?fase:'giorno',B=MOMENTI[mo],p=PERD[Math.max(0,Math.min(3,liv|0))];
  const L={momento:mo,sole:Object.assign({},B.sole),amb:B.amb.slice(),rifl:B.rifl.slice(),rim:Object.assign({},RIM),cielo:B.cielo.slice(),nebbia:B.nebbia&&B.nebbia.slice(),torce:B.torce,finestre:B.finestre,fiamme:B.fiamme,liv:liv|0};
  if(p){L.amb[0]=mixHex(L.amb[0],p.amb,p.mix);L.sole.col=mixHex(L.sole.col,p.amb,p.mix*.4);if(!L.nebbia||p.nebbia[1]>L.nebbia[1])L.nebbia=p.nebbia.slice();if(p.cielo)L.cielo=p.cielo.slice()}
  return L}
 // ---- mondo ----
 const dist=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.q+a.r-b.q-b.r)+Math.abs(a.r-b.r))/2;
 function mondo(s,o){o=o||{};const g=GEO.mon,vista=o.vista==null?2:o.vista,vivi=(s.eroi||[]).filter(e=>e.hp>0),seme=(s.seme!=null?s.seme:s.seed)|0,tiles=[];
  for(const c of Object.values(s.celle)){const p=pos('mon',c.q,c.r),visto=!!c.visto,vicino=visto&&vivi.some(e=>dist(e,c)<=vista),sv=hash(c.q,c.r,seme);
   const t={q:c.q,r:c.r,x:p.x,z:p.z,t:c.t,visto,vicino,h:visto?(ALT_MON[c.t]||0):0,oggetto:null,luogo:null,s:sv};
   const l=c.luogo&&s.luoghi&&s.luoghi[c.luogo];
   if(visto&&l)t.luogo={id:l.id,tipo:l.tipo,ripulito:!!l.ripulito,assedio:!!l.assedio},t.oggetto={k:l.tipo,s:sv};
   else if(visto){if(c.t==='bosco')t.oggetto={k:'bosco',s:sv};else if(c.t==='montagna')t.oggetto={k:'picco',s:sv};else if(c.t==='palude')t.oggetto={k:sv<.3?'albero-secco':'canne',s:sv};
    else if(c.t==='pianura')t.oggetto=sv<.18?{k:'albero-solo',s:sv}:sv<.5?{k:'ciuffi',s:sv}:null;else if(c.t==='collina'&&sv<.35)t.oggetto={k:'roccia',s:sv,g:.7}}
   tiles.push(t)}
  return{modo:'mon',SQ:g.SQ,R:g.R,raggio:s.raggio,tiles,notte:s.fase==='notte',perdizione:s.perdizione|0,liv:o.livello!=null?o.livello:livello(s.perdizione|0)}}
 const livello=p=>p>=75?3:p>=50?2:p>=25?1:0;
 // ---- luce ----
 // fase: 'giorno'|'notte'; ambiente dell'arena (solo battaglia); liv = livello di perdizione (solo mondo)
 function luce(modo,o){o=o||{};const notte=o.fase==='notte',amb=o.ambiente||'pianura',liv=o.liv|0,buio=amb==='antro'||amb==='torre';
  let L;
  if(buio)L={sole:{col:'#ffcf9a',int:.55,pos:[-90,200,-70]},emi:{cielo:'#6a5a78',suolo:'#1c1812',int:.68},esp:1.15,fondo:'#0e0c0a',torce:true};
  else if(notte)L={sole:{col:'#a6b8ff',int:.62,pos:[110,210,-120]},emi:{cielo:'#3b4a86',suolo:'#14141e',int:.72},esp:1.1,fondo:'#0a0e22',torce:true};
  else if(amb==='palude')L={sole:{col:'#f4efc8',int:.88,pos:[-150,175,-105]},emi:{cielo:'#cfe4d4',suolo:'#4a5a3e',int:.62},esp:.8,fondo:'#10201a',torce:false};
  else if(amb==='bosco')L={sole:{col:'#f6efcf',int:.85,pos:[-150,175,-105]},emi:{cielo:'#d4ecd8',suolo:'#44563a',int:.6},esp:.78,fondo:'#12231a',torce:false};
  else L={sole:{col:'#fff0d0',int:.95,pos:[-150,175,-105]},emi:{cielo:'#dbe8ff',suolo:'#5a4a30',int:.62},esp:.8,fondo:'#1a140c',torce:false};
  L.notte=notte;L.finestre=notte||buio;
  L.tinta=[null,{col:'#7a5a9a',mix:.08},{col:'#7a4a8a',mix:.17},{col:'#8a2a3a',mix:.27}][Math.max(0,Math.min(3,liv))];
  return L}
 // ---- nebbia di guerra: quanto smorzare una cella del mondo (1 = piena) ----
 const nebbia=t=>!t.visto?0:t.vicino?1:.62;
 return{GEO,QUOTA,QUOTA_PX,ALT_MON,pos,aOffset,hash,proiez,parti,arena,mondo,luce,livello,nebbia,dist,SUP,
  TEMI,TEMA_DI,tema,LUCI_OGG,torce,fonti,RAMPE,MATERIALI,VARIANTI,LATO,tessera16,atlante,MOMENTI,RIM,lucePx}
})();
if(typeof module!=='undefined')module.exports=ASCE;
