/* ---- Miniature di Cantari di Ventura (A12): eroi da razza, classe e aspetto; i 23 mostri del bestiario e i tre capi. Motore puro: elenchi di pezzi, nessun three.js. ----
   Stile «pupazzi di legno» della Taverna: forme semplici e morbide, pochi pezzi (≤ 36), colori pieni. Alti 27–60 pixel come un segnalino, rivolti verso +z (il giocatore).
   Pezzo = [forma, colore, x, y, z, a, b, c, ry, rz, flag] come in ASCE (c cilindro: raggio alto, raggio basso, altezza · k cono: raggio, 0, altezza ·
   s ellissoide: semiassi · b scatola: larghezza, altezza, profondità · y = centro · flag 'e' = luminoso). Il rendering li fonde in una sola mesh.
   Un mostro nuovo nel bestiario ⇒ una riga in MOSTRI (il test lo pretende). Test: tests/test_avv_mini.js · piano: docs/AVVENTURA-A12.md. */
const AMIN=(()=>{
 const P=(f,col,x,y,z,a,b,c,ry,rz,fl)=>[f,col,x,y,z,a,b,c,ry||0,rz||0,fl||''];
 const PI=Math.PI;
 // scurisce un colore (#rrggbb) di una frazione
 const scuro=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=1-k,r=Math.round((n>>16&255)*f),g=Math.round((n>>8&255)*f),b=Math.round((n&255)*f);return'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)};
 const scala=(parti,k)=>k===1?parti:parti.map(p=>{const q=p.slice();for(const i of[2,3,4,5,6,7])q[i]=+(q[i]*k).toFixed(3);return q});
 // quota più alta e distanza massima dal centro
 function ingombro(parti){let alt=0,rag=0;for(const p of parti){const f=p[0],y=p[3],a=p[5],b=p[6],c=p[7];
   const top=f==='s'?y+b:f==='b'?y+b/2:y+c/2;alt=Math.max(alt,top);rag=Math.max(rag,Math.hypot(p[2],p[4])+(f==='s'||f==='b'?Math.max(a,c)/2:Math.max(a,b)))}
  return{alt:+alt.toFixed(1),rag:+rag.toFixed(1)}}
 // ---- eroi ----
 const RAZZA={umano:1,elfo:1.06,nano:.86,piccolo:.78,orco:1.14};
 const LUNGA={mago:1,chierico:1,bardo:1};
 // cols = { pelle, capelli, mantello } in esadecimale, stile = indice dei capelli (0..6) come nel ritratto
 function eroe(razza,classe,cols,stile){const k=RAZZA[razza]||1,pe=cols.pelle,ca=cols.capelli,ma=cols.mantello,md=scuro(ma,.28),pt=[];
  const lunga=!!LUNGA[classe];
  if(lunga)pt.push(P('c',ma,0,9.5,0,4.4,8,17),P('c',md,0,1.2,0,8.6,8.8,2));else pt.push(P('c','#3a2c20',-2.6,3.5,0,1.9,2.2,7),P('c','#3a2c20',2.6,3.5,0,1.9,2.2,7),P('c',ma,0,12.5,0,4.6,6.4,11),P('c','#4a3320',0,9.6,0,5.5,5.9,1.6));
  pt.push(P('c',md,-6,12.8,0,1.5,1.7,8,0,.18),P('c',md,6,12.8,0,1.5,1.7,8,0,-.18),P('s',pe,-6.6,8.6,0,1.7,1.7,1.7),P('s',pe,6.6,8.6,0,1.7,1.7,1.7));
  pt.push(P('c',pe,0,18.4,0,1.9,2.1,2.2),P('s',pe,0,21.8,0,5.3,5.6,5.2),P('s','#1c140e',-1.9,22.2,4.6,.78,.9,.5),P('s','#1c140e',1.9,22.2,4.6,.78,.9,.5));
  // capelli (non con elmo o cappuccio)
  const nudo=!['guerriero','ladro','esploratore'].includes(classe);
  if(nudo&&classe!=='mago'){const s=stile|0;pt.push(P('s',ca,0,24.2,-.4,5.6,3.7,5.6));
   if(s===1)pt.push(P('b',ca,0,19.5,-4.2,10,9,2.4));else if(s===2)pt.push(P('s',ca,0,28,-1,2.6,2.6,2.6));else if(s===4)pt.push(P('s',ca,-4.4,22.6,0,1.6,3,3.6),P('s',ca,4.4,22.6,0,1.6,3,3.6));else if(s===6)pt.push(P('s',ca,0,23.6,-1.4,5.9,4.6,5.9))}
  else if(classe==='mago')pt.push(P('s',ca,0,22.3,-3.2,5.4,5,2.4));
  // razza
  if(razza==='elfo')pt.push(P('k',pe,-5.7,22.8,0,1.3,0,4.6,0,PI/2-.4),P('k',pe,5.7,22.8,0,1.3,0,4.6,0,-PI/2+.4));
  else if(razza==='nano')pt.push(P('k',ca,0,17.6,3.2,4.4,0,7.4,0,PI),P('s',ca,0,20.2,3.8,3.6,1.3,1.5));
  else if(razza==='orco')pt.push(P('k','#f4efe0',-2.1,19.1,4.5,.75,0,2.4),P('k','#f4efe0',2.1,19.1,4.5,.75,0,2.4),P('s',pe,0,21.2,5.3,1.6,1.1,1.1));
  // classe
  switch(classe){
   case'guerriero':pt.push(P('s','#9aa3ae',0,24,0,5.9,4.6,5.8),P('b','#7c858f',0,22.4,5.2,1,5,.9),P('k','#b23a2e',0,28.4,-.6,1.2,0,5),
     P('b','#cfd6dc',7.8,16,3.4,1.3,14,.5),P('b','#d6aa3c',7.8,9.2,3.4,4.2,.9,1.1),P('s','#7a4a2a',-8.2,13.5,3.2,4.9,4.9,1.1),P('s','#d6aa3c',-8.2,13.5,4.2,1.5,1.5,1));break;
   case'ladro':pt.push(P('s','#3a4a3a',0,23.2,-.3,6,5.6,5.9),P('k','#3a4a3a',0,28.6,-2.4,4.4,0,6,0,0),P('b','#2a2a30',0,13.2,-4.6,9.4,13.5,1.5),P('b','#cfd6dc',7.8,9.8,3.4,.9,6.4,.4),P('b','#6a4a2a',7.8,6,3.4,1.1,2.2,1.1));break;
   case'mago':pt.push(P('c',scuro(ma,.12),0,25.3,0,7.8,7.8,.8),P('k',ma,0,32.4,-.8,4.8,0,12,0,.08),P('c','#6a4a2a',-8,14,2.4,.7,.8,28),P('s','#9fd8ff',-8,28.8,2.4,2.2,2.2,2.2,0,0,'e'));break;
   case'chierico':pt.push(P('s','#d6aa3c',0,22,-4.3,6.6,6.6,.5,0,0,'e'),P('b','#d6aa3c',0,14.4,4.2,2.4,2.4,.6),P('c','#6a4a2a',7.8,10,3,.8,.9,15),P('s','#8a8f96',7.8,18.3,3,2.7,2.7,2.7));break;
   case'esploratore':pt.push(P('s','#4f6f3f',0,23.4,-.3,6,5.4,5.9),P('c','#6a4a2a',3.4,15.2,-5.2,1.6,1.7,11,0,.18),P('k','#e8e0d0',3.6,22.6,-5.2,.8,0,3),
     P('b','#6a4a2a',-8.2,14,3,.9,8,.9),P('b','#6a4a2a',-7,19.2,3,.9,5,.9,0,-.5),P('b','#6a4a2a',-7,8.8,3,.9,5,.9,0,.5),P('b','#e8e0d0',-6.1,14,3,.2,17,.2));break;
   case'bardo':pt.push(P('s','#8a2a4a',.6,25.2,0,6.3,2.4,6,0,.12),P('k','#f3d37a',4,28,-1,.9,0,6,0,-.6),P('s','#a8683a',6.6,11,4.4,4,5,2.4,0,-.5),P('b','#6a4a2a',8.6,17,4,.9,9,.8,0,-.5));break;
  }
  const pp=scala(pt,k);return Object.assign({parti:pp,base:{r:10.5*Math.max(.9,k),col:'#d4a63a'}},ingombro(pp))}
 // ---- archetipi dei mostri ----
 function bipede(o){const s=o.s||1,pe=o.pelle||'#c9a07a',ro=o.robe||'#6a5a4a',pt=[];
  if(!o.lunga)pt.push(P('c',o.gambe||'#3a2c20',-2.6,3.5,0,1.9,2.2,7),P('c',o.gambe||'#3a2c20',2.6,3.5,0,1.9,2.2,7),P('c',ro,0,12.5,0,4.6,6.4,11));else pt.push(P('c',ro,0,10.5,0,4.4,8,19),P('c',scuro(ro,.3),0,1.2,0,8.6,8.8,2));
  pt.push(P('c',scuro(ro,.25),-6,12.8,0,1.5,1.7,8,0,.18),P('c',scuro(ro,.25),6,12.8,0,1.5,1.7,8,0,-.18),P('s',pe,-6.6,8.6,0,1.7,1.7,1.7),P('s',pe,6.6,8.6,0,1.7,1.7,1.7),P('s',pe,0,21.8,0,5.2,5.5,5.1),P('s','#1c140e',-1.9,22.2,4.5,.75,.85,.5),P('s','#1c140e',1.9,22.2,4.5,.75,.85,.5));
  return pt.concat(o.extra||[])}
 function quadrupede(o){const c=o.col,d=o.scuro||scuro(c,.3),pt=[P('s',c,0,9.5,0,6.4,6,10.5),P('s',c,0,11.4,10,4.3,4.2,4.8),P('s',d,0,9.8,14,2.2,2,2.4),P('s','#1c140e',-1.9,12.4,13.6,.7,.8,.5),P('s','#1c140e',1.9,12.4,13.6,.7,.8,.5),
   P('k',d,-2.6,15.4,9,1.3,0,3.6),P('k',d,2.6,15.4,9,1.3,0,3.6),P('s',c,0,10.4,-12.4,1.5,1.5,4.6)];
  for(const sx of[-1,1])for(const z of[-6,6])pt.push(P('c',d,sx*3.8,3.2,z,1.4,1.8,6.4));
  if(o.zanne)pt.push(P('k','#f4efe0',-1.8,8.6,14.8,.6,0,2.6,0,0),P('k','#f4efe0',1.8,8.6,14.8,.6,0,2.6,0,0));
  if(o.gobba)pt.push(P('s',c,0,14,-3,5.6,4.4,6));
  if(o.setole)for(let i=0;i<5;i++)pt.push(P('k',d,0,15.6-Math.abs(i-2)*.5,6-i*3.4,.9,0,3));
  return pt}
 function scheletro(o){const os=o.osso||'#e8e0c8',om='#2a241c',pt=[P('s',os,0,22.4,0,4.8,5.2,4.6),P('s',om,-1.8,22.8,3.9,1.1,1.3,.6),P('s',om,1.8,22.8,3.9,1.1,1.3,.6),P('b',os,0,19.4,3.2,2.6,1.4,1.2),P('c',os,0,12.5,-.4,.9,.9,11)];
  for(let i=0;i<3;i++)pt.push(P('s',os,0,15.8-i*2.6,.4,5-i*.5,.9,3.2));
  pt.push(P('s',os,0,8.6,0,4.2,1.8,3),P('c',os,-2.4,4,0,.8,.9,8),P('c',os,2.4,4,0,.8,.9,8),P('c',os,-5.6,13,0,.7,.8,9,0,.2),P('c',os,5.6,13,0,.7,.8,9,0,-.2));
  if(o.straccio)pt.push(P('c',o.straccio,0,10,0,5,6.8,9));
  return pt.concat(o.extra||[])}
 function spettro(o){const c=o.col,pt=[P('c',c,0,11,0,3.6,8.2,22),P('k',c,-6,2.6,2,2.4,0,5,0,.3),P('k',c,0,2.4,5,2.4,0,5),P('k',c,6,2.6,2,2.4,0,5,0,-.3),P('s',scuro(c,.45),0,23,0,5.2,5.4,5),P('s','#e8fbff',-1.8,23.4,4.2,1,1.4,.6,0,0,'e'),P('s','#e8fbff',1.8,23.4,4.2,1,1.4,.6,0,0,'e')];
  return pt.concat(o.extra||[])}
 // ---- i mostri ----
 const COL_FAM={bestie:'#6f8f3c',banditi:'#9a6a34',nonmorti:'#76638f',torre:'#3f7096'};
 const ARMA=(x,l,col)=>P('b',col||'#cfd6dc',x,10+l/2-1,3.4,1.3,l,.5);
 const MOSTRI={
  'lupo-grigio':{fam:'bestie',r:12,f:()=>quadrupede({col:'#8a8d92',zanne:true})},
  'sciame-di-corvi':{fam:'bestie',r:11,lum:0,f:()=>{const o=[];for(let i=0;i<5;i++){const a=i*PI*2/5,x=Math.cos(a)*8,z=Math.sin(a)*7,y=11+((i*7)%5)*3.2;o.push(P('s','#25252d',x,y,z,1.8,1.5,3),P('b','#2a2a34',x,y+.6,z,8,.4,2.4,a,0.2),P('s','#d6aa3c',x,y,z+2.8,.5,.5,1.3))}return o}},
  'cinghiale-irsuto':{fam:'bestie',r:12,f:()=>quadrupede({col:'#6a4a38',zanne:true,setole:true})},
  'ragno-tessitore':{fam:'bestie',r:15,f:()=>{const o=[P('s','#2f2a3a',0,8,-3,6.6,5.4,7.6),P('s','#3b3447',0,8.6,6.2,3.8,3.3,3.8),P('s','#c8a02a',0,12.4,-3,2.6,.6,3.4,0,0,'e'),P('s','#e04a3a',-1.2,9.6,9,.7,.7,.5,0,0,'e'),P('s','#e04a3a',1.2,9.6,9,.7,.7,.5,0,0,'e')];
    for(const sx of[-1,1])for(let i=0;i<4;i++)o.push(P('c','#2f2a3a',sx*9,6.4,-6+i*4.6,.6,.9,10,0,sx*(-.95)));return o}},
  'orso-bruno':{fam:'bestie',r:15,s:1.3,f:()=>quadrupede({col:'#6b4a2f',gobba:true})},
  'brigante':{fam:'banditi',r:11,f:()=>bipede({robe:'#6a4a34',extra:[P('s','#4a3a2c',0,24.4,0,5.6,3.6,5.5),ARMA(7.6,12),P('b','#d6aa3c',7.6,9.6,3.4,4,.9,1)]})},
  'arciere-bandito':{fam:'banditi',r:11,f:()=>bipede({robe:'#4f5a3a',extra:[P('s','#3a4a2a',0,23.4,-.3,6,5.4,5.9),P('b','#6a4a2a',-8.2,14,3,.9,8,.9),P('b','#6a4a2a',-7,19.2,3,.9,5,.9,0,-.5),P('b','#6a4a2a',-7,8.8,3,.9,5,.9,0,.5),P('b','#e8e0d0',-6.1,14,3,.2,17,.2)]})},
  'cerusico-di-strada':{fam:'banditi',r:11,f:()=>bipede({robe:'#7a8a5a',lunga:true,extra:[P('s','#6a5a3a',0,24.4,0,5.7,3.4,5.6),P('b','#f4efe0',0,14,4.6,5,4.6,.8),P('b','#c03a2e',0,14,5.1,3.2,.9,.6),P('b','#c03a2e',0,14,5.1,.9,3.2,.6),P('s','#8a5a2a',-7,8,-1,3.4,4,3)]})},
  'tagliagole':{fam:'banditi',r:11,f:()=>bipede({robe:'#2a2a34',extra:[P('s','#1c1c26',0,23.2,-.3,6,5.6,5.9),P('k','#1c1c26',0,28.6,-2.4,4.4,0,6),P('b','#2a2a34',0,13.2,-4.6,9.4,13.5,1.5),ARMA(7.8,8),ARMA(-7.8,8)]})},
  'stregone-rinnegato':{fam:'banditi',r:11,f:()=>bipede({robe:'#6a2a3a',lunga:true,extra:[P('c','#4a1a28',0,25.3,0,7.8,7.8,.8),P('k','#6a2a3a',0,32.4,-.8,4.8,0,12),P('c','#3a2a1a',-8,14,2.4,.7,.8,28),P('s','#ff7a4a',-8,28.8,2.4,2.3,2.3,2.3,0,0,'e')]})},
  'capobanda-corvino':{fam:'banditi',r:15,s:1.3,f:()=>{const o=bipede({robe:'#2a2a34',extra:[P('s','#1c1c26',0,24.4,0,5.6,3.6,5.5),P('s','#d6aa3c',0,21,6.6,1.1,1.1,2.8),P('b','#cfd6dc',8,17,3.4,1.5,17,.6),P('b','#d6aa3c',8,9.4,3.4,4.6,1,1.2)]});
    for(let i=0;i<6;i++){const a=PI*(.2+i*.12);o.push(P('s','#16161e',Math.cos(a)*-7,15.8-i*1.1,-3.6-i*.3,2.6,4.2,1.1,0,(.5-i*.2)))}return o}},
  'scheletro-armato':{fam:'nonmorti',r:11,f:()=>scheletro({extra:[ARMA(7.6,12,'#aab2ba'),P('s','#6a5a4a',-8,12,3,4.6,4.6,1.1),P('s','#9aa3ae',0,25.4,0,5.4,3,5.2)]})},
  'arciere-scheletro':{fam:'nonmorti',r:11,f:()=>scheletro({extra:[P('b','#6a4a2a',-8.2,14,3,.9,8,.9),P('b','#6a4a2a',-7,19.2,3,.9,5,.9,0,-.5),P('b','#6a4a2a',-7,8.8,3,.9,5,.9,0,.5),P('b','#e8e0d0',-6.1,14,3,.2,17,.2)]})},
  'ghoul-di-tomba':{fam:'nonmorti',r:12,f:()=>{const o=bipede({pelle:'#8a9a7a',robe:'#5a5a48',gambe:'#4a4a3a',extra:[P('c','#8a9a7a',-7,11,2,1.4,1.1,13,0,.35),P('c','#8a9a7a',7,11,2,1.4,1.1,13,0,-.35),P('k','#d8d0b0',-8.6,3.6,3.6,.8,0,3,0,PI),P('k','#d8d0b0',8.6,3.6,3.6,.8,0,3,0,PI)]});
    return o}},
  'anima-in-pena':{fam:'nonmorti',r:12,lum:1,f:()=>spettro({col:'#b9c8e0'})},
  'officiante-spolpato':{fam:'nonmorti',r:12,f:()=>scheletro({straccio:'#4a2a5a',extra:[P('k','#d6aa3c',0,29.6,0,4.6,0,9),P('s','#d6aa3c',-8,12,3,1.8,1.8,1.8,0,0,'e'),P('c','#d6aa3c',-8,16,3,.3,.3,8)]})},
  're-senza-corona':{fam:'nonmorti',r:17,s:1.45,f:()=>{const o=scheletro({straccio:'#3a2a4a',extra:[ARMA(7.8,15,'#aab2ba'),P('b','#d6aa3c',7.8,9.2,3.4,5,1,1.2)]});
    for(let i=0;i<5;i++){const a=PI*(.15+i*.18);o.push(P('k','#f3c64a',Math.cos(a+PI)*3.6,26.2+(i%2)*.8,Math.sin(a)*3.6+.2,.9,0,3.6,0,0,'e'))}return o}},
  'famiglio-arcano':{fam:'torre',r:11,lum:1,f:()=>[P('s','#6a5a9a',0,15,0,4.2,3.8,6.4),P('s','#6a5a9a',0,17.5,6.6,3.3,3.2,3.2),P('k','#6a5a9a',-2,21,6,1.1,0,3.2),P('k','#6a5a9a',2,21,6,1.1,0,3.2),P('b','#8a7ac0',-8,17.5,0,9,.5,5,0,.5),P('b','#8a7ac0',8,17.5,0,9,.5,5,0,-.5),
    P('s','#9fe0ff',-1.5,17.8,9.4,.8,.8,.5,0,0,'e'),P('s','#9fe0ff',1.5,17.8,9.4,.8,.8,.5,0,0,'e'),P('s','#f3c64a',0,13.4,3,1.5,1.5,1.5,0,0,'e'),P('s','#6a5a9a',0,14.4,-9.4,1.3,1.3,4.6)]},
  'statua-vivente':{fam:'torre',r:14,f:()=>[P('b','#9a9a98',-3.4,5,0,4.6,10,5),P('b','#9a9a98',3.4,5,0,4.6,10,5),P('b','#a8a8a4',0,15.5,0,13,11,7.6),P('b','#8a8a88',-8.8,15,0,4,10,4.6),P('b','#8a8a88',8.8,15,0,4,10,4.6),P('b','#a8a8a4',0,24,0,6.8,6.4,6.4),
    P('b','#7fd8ff',0,15.5,3.9,3,3,.6,0,0,'e'),P('b','#7fd8ff',-1.6,24.4,3.3,1.2,.9,.6,0,0,'e'),P('b','#7fd8ff',1.6,24.4,3.3,1.2,.9,.6,0,0,'e')]},
  'sciame-di-scintille':{fam:'torre',r:11,lum:1,f:()=>{const o=[];for(let i=0;i<7;i++){const a=i*PI*2/7+.4,r=4+(i%3)*3.2;o.push(P('s',i%2?'#7fd8ff':'#ffe27a',Math.cos(a)*r,10+((i*5)%6)*3,Math.sin(a)*r,1.8,1.8,1.8,0,0,'e'))}
    o.push(P('b','#fff6c0',-3,16,1,1,7,.5,0,.5,'e'),P('b','#fff6c0',2,19,0,1,6,.5,0,-.6,'e'));return o}},
  'ombra-del-corvo':{fam:'torre',r:13,lum:1,f:()=>spettro({col:'#3a3a52',extra:[P('b','#22222e',-9,18,-1,10,.5,5,0,.6),P('b','#22222e',9,18,-1,10,.5,5,0,-.6),P('s','#d6aa3c',0,22.6,5.8,1,1,2.6)]})},
  'custode-fiammeggiante':{fam:'torre',r:14,s:1.15,f:()=>[P('c','#5a5f68',-3,4,0,2.4,2.8,8),P('c','#5a5f68',3,4,0,2.4,2.8,8),P('c','#6a707a',0,13.5,0,6.6,7.6,13),P('s','#6a707a',-8,17,0,3.4,3,3.4),P('s','#6a707a',8,17,0,3.4,3,3.4),P('s','#7a808a',0,23.6,0,5.2,5.2,5),
    P('k','#ff8a2a',0,32,0,3.6,0,10,0,0,'e'),P('k','#ffe27a',0,30.4,0,2,0,6,0,0,'e'),P('b','#1c1c24',0,23.8,4.5,5.4,1.2,.6),P('b','#cfd6dc',9.4,16,3,1.6,18,.6),P('b','#ff8a2a',9.4,16,3.3,.8,15,.5,0,0,'e'),P('s','#8a4a2a',-9.4,13,3,4.8,5.6,1.1)]},
  'maestro-della-torre':{fam:'torre',r:17,s:1.3,f:()=>bipede({pelle:'#d6b894',robe:'#4a2a6a',lunga:true,extra:[P('c','#2f1a48',0,25.3,0,8.2,8.2,.8),P('k','#4a2a6a',0,34.4,-.8,5,0,15),P('s','#e8e0e8',0,18.8,3.8,3.6,3.8,1.6),P('c','#6a4a2a',-8.6,14,2.4,.7,.8,30),P('s','#c8a2ff',-8.6,30.4,2.4,2.6,2.6,2.6,0,0,'e'),
     P('s','#9fe0ff',-12.4,26.4,-2,1.2,1.2,1.2,0,0,'e'),P('s','#f3c64a',-4.6,33.6,-2,1.2,1.2,1.2,0,0,'e'),P('b','#d6aa3c',0,11,4.6,5,.9,.7)]})}
 };
 // un mostro del bestiario → { parti, base, alt, rag, lum }; sconosciuto → un'ombra generica
 function mostro(def,capo){const m=MOSTRI[def]||{fam:'torre',r:12,lum:1,f:()=>spettro({col:'#555566'})},k=m.s||1,pp=scala(m.f(),k);
  return Object.assign({def,parti:pp,lum:m.lum?1:0,base:{r:m.r,col:COL_FAM[m.fam]||'#8a6a34',capo:!!capo,fam:m.fam}},ingombro(pp))}
 return{MOSTRI,COL_FAM,RAZZA,eroe,mostro,ingombro,scuro,scala}
})();
if(typeof module!=='undefined')module.exports=AMIN;
