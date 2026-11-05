/* ---- La battaglia vera nella resa pixel (Cantari di Ventura, B6.5): la telecamera della battaglia in tempo reale e l'aggancio fra catena pixel e SVG. ----
   Con il 3D acceso, la battaglia a istanti (BatT, 24hq) si disegna con la catena pixel di 24hp (Pixel.disegna) invece che con il 3D di A12. Qui:
   · la telecamera: segue l'eroe scelto (morbida), si sposta col dito (e smette di seguire finché non si sceglie un eroe), resta dentro l'arena;
     due zoom a scala intera («lontano» e «vicino», APAL.misure), dal tasto sul campo, dal pizzico o dalla rotella; lo zoom si ricorda (`bat-zoom`);
   · l'aggancio: l'SVG sopra (anelli, barre, aree, tocchi) usa la stessa proiezione della telecamera (BatMappa.proiezione: SQ = sen 55°, L = cos 55°)
     e a ogni fotogramma prende il viewBox che coincide al pixel con l'immagine (APAL.vista), così tocchi e segnalini cadono sulle miniature;
   · `Scena3D.disegna`: la resa pixel per la battaglia in tempo reale, il 3D di A12 per tutto il resto (mappa del mondo, battaglie a turni).
   La pagina di prova (?prova=pixel, PixelProva) mette il suo disegno al posto di questo. Calcoli puri (sguardo, viewBox, limiti): motori/28h (APAL). */
const BatPx={
 LS:'bat-zoom',zoom:'lontano',cam:null,segui:true,sel:null,sDi:null,vb:null,ult:null,t:0,v:null,b:null,
 carica(){try{const z=localStorage.getItem(BatPx.LS);if(z==='vicino'||z==='lontano')BatPx.zoom=z}catch(e){}},
 // la resa pixel disegna la battaglia in tempo reale quando il 3D è acceso (impostazione «Grafica 3D» e telefono che regge)
 vuole(){return typeof Bat!=='undefined'&&!!Bat.s&&!!ui.bat&&Bat.tempo()&&Scena3D.on()&&!(typeof PixelProva!=='undefined'&&PixelProva.P.on)},
 // prima di disegnare l'SVG della battaglia: proiezione di BatMappa e scala dell'HUD (unità dell'SVG per pixel CSS) per lo zoom di adesso
 proietta(){const on=BatPx.vuole();if(!on)BatPx.vb=null;BatMappa.proiezione(on,on?BatPx.scala():1);return on},
 misure(){const w0=document.querySelector('.tr-bat .bt-mappa'),dpr=window.devicePixelRatio||1,w=w0&&w0.clientWidth||innerWidth,h=w0&&w0.clientHeight||Math.round(innerHeight*.7);
  return{w,h,dpr,M:APAL.misure({w,h,dpr,tv:!!ui.tv,zoom:BatPx.zoom})}},
 scala(){const{dpr,M}=BatPx.misure();return dpr/(M.s*APAL.k())},
 // dove vuole guardare la telecamera: l'eroe scelto (posizione interpolata di BatT), altrimenti il centro dell'arena
 mira(K){const id=BatT.sel,p=id&&BatT.pos&&BatT.pos[id];if(p){const w=ASCE.pos('bat',p.q,p.r);return{x:w.x,z:w.z}}const b=K.bbox;return b?{x:b.cx,z:b.cz}:{x:0,z:0}},
 // riquadro in cui può muoversi il centro: l'arena, con spazio in alto per i muri e le teste della prima riga e per il registro (~56 pixel CSS sul campo)
 riquadro(K){const b=K.bbox||{x0:0,x1:0,z0:0,z1:0},Z=ASCE.GEO.bat.Z,u=BatPx.ult,log=u?56*u.dpr/(u.s*u.k)/APAL.CAMERA.sin:30;return{x0:b.x0,x1:b.x1,z0:b.z0-Z*1.2-log,z1:b.z1}},
 // ---- un fotogramma (al posto di K.ren.render) ----
 disegna(K){
  if(K.modo!=='bat'||!BatMappa.px||!BatPx.vuole()){if(K.px)Pixel.lascia(K);BatPx.ult=null;return K.ren.render(K.scn,K.cam)}
  const ora=performance.now(),dt=Math.min(.1,Math.max(0,(ora-(BatPx.t||ora))/1000));BatPx.t=ora;
  if(Bat.s!==BatPx.sDi){BatPx.sDi=Bat.s;BatPx.cam=null;BatPx.segui=true}
  if(BatT.sel!==BatPx.sel){BatPx.sel=BatT.sel;BatPx.segui=true}
  const{M}=BatPx.misure(),k=APAL.k();BatPx.v={w:M.art[0]/k,h:M.art[1]/k};BatPx.b=BatPx.riquadro(K);
  const t=APAL.limita(BatPx.segui||!BatPx.cam?BatPx.mira(K):BatPx.cam,BatPx.b,BatPx.v,ASCE.GEO.bat.Z*.5);
  if(!BatPx.cam){BatPx.cam={x:t.x,z:t.z}}
  else{const a=RM?1:1-Math.exp(-dt*6),c=BatPx.cam;c.x+=(t.x-c.x)*a;c.z+=(t.z-c.z)*a;if(Math.abs(t.x-c.x)+Math.abs(t.z-c.z)>.05)K.sucio=true;else{c.x=t.x;c.z=t.z}}
  const u=Pixel.disegna(K,{x:BatPx.cam.x,y:0,z:BatPx.cam.z,k,zoom:BatPx.zoom});BatPx.ult=u;BatPx.sincVb(u)},
 // il viewBox che coincide con l'immagine appena disegnata (lo legge anche BatMappa.svg al prossimo render)
 sincVb(u){const vb=APAL.vista(u).map(x=>x.toFixed(3)).join(' ');BatPx.vb=vb;const svg=document.querySelector('.tr-bat .bt-svg');if(svg&&svg.getAttribute('viewBox')!==vb)svg.setAttribute('viewBox',vb)},
 // ---- gesti ----
 // il dito sposta la telecamera (dx, dy in pixel CSS): la vista segue il dito, la telecamera smette di seguire l'eroe
 trascina(dx,dy){const u=BatPx.ult;if(!u||!BatPx.cam)return;const f=u.dpr/(u.s*u.k);BatPx.segui=false;
  const c={x:BatPx.cam.x-dx*f,z:BatPx.cam.z-dy*f/APAL.CAMERA.sin};BatPx.cam=BatPx.b&&BatPx.v?APAL.limita(c,BatPx.b,BatPx.v,ASCE.GEO.bat.Z*.5):c;Scena3D.sporca()},
 pizzico(r){if(r>1.25&&BatPx.zoom!=='vicino')BatPx.cambia('vicino');else if(r<.8&&BatPx.zoom!=='lontano')BatPx.cambia('lontano')},
 rotella(dy){BatPx.cambia(dy<0?'vicino':'lontano')},
 cambia(z){if(z!=='vicino'&&z!=='lontano'||z===BatPx.zoom)return;BatPx.zoom=z;try{localStorage.setItem(BatPx.LS,z)}catch(e){}Snd.play('sel');render();Scena3D.sporca()}
};
BatPx.carica();
Scena3D.disegna=BatPx.disegna;
