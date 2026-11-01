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
  }return[]}
 // le parti di un oggetto, ruotate di `ry` e spostate in (x, y, z) (per il rendering: un oggetto per cella)
 function parti(k,s,ctx){return ogg3(k,s,ctx)}
 // ---- arena ----
 const OGG_ALTO={citta:'colonna',antro:'colonna',torre:'colonna',collina:'roccia',palude:'albero-secco'},OGG_BASSO={citta:'cassa',antro:'cassa',torre:'cassa'};
 // dettagli minuti sul pavimento (soglia cumulativa, oggetto): non sono ostacoli, solo decorazione
 const DECO={pianura:[[.2,'ciuffi'],[.27,'fiori']],strada:[[.1,'sassi']],bosco:[[.24,'ciuffi'],[.3,'fiori']],collina:[[.14,'sassi'],[.26,'ciuffi']],palude:[[.2,'canne']],citta:[[.09,'sassi']],antro:[[.1,'sassi'],[.17,'stalagmite']],torre:[[.06,'sassi']]};
 const SUP={f:'fuoco',v:'veleno',g:'ghiaccio',w:'acqua'};
 function arena(A){const g=GEO.bat,amb=A.ambiente||'pianura',tiles=[],uscite=(A.uscite||[]).map(c=>Object.assign({q:c.q,r:c.r},pos('bat',c.q,c.r)));
  for(let r=0;r<A.h;r++)for(let col=0;col<A.w;col++){const q=col-Math.floor(r/2),ch=A.righe[r][col],p=pos('bat',q,r),sp=A.sup?SUP[A.sup[r][col]]||null:null;
   const t={q,r,col,x:p.x,z:p.z,scac:(col+r)&1,tipo:ch==='#'?'muro':ch==='^'?'rialzo':ch===','?'difficile':'piano',h:ch==='#'?QUOTA.muro:ch==='^'?QUOTA.rialzo:0,oggetto:null,sup:sp,s:hash(q,r,1)};
   if(ch==='T')t.oggetto={k:OGG_ALTO[amb]||'albero',s:t.s};else if(ch==='o')t.oggetto={k:OGG_BASSO[amb]||'masso',s:t.s};
   else if((ch==='.'||ch===',')&&!sp){const d=hash(q,r,3),k=DECO[amb];if(k)for(const [lim,nome] of k)if(d<lim){t.deco={k:nome,s:hash(q,r,4)};break}}
   tiles.push(t)}
  return{modo:'bat',SQ:g.SQ,R:g.R,amb,w:A.w,h:A.h,tiles,uscite,quota:QUOTA}}
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
 return{GEO,QUOTA,ALT_MON,pos,aOffset,hash,proiez,parti,arena,mondo,luce,livello,nebbia,dist,SUP}
})();
if(typeof module!=='undefined')module.exports=ASCE;
