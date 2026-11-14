
/* ================= catalogo: i giochi veri dell'app ================= */
// nella locanda gli scaffali sono tre (il quarto posto è del bersaglio): cooperativi e giochi da festa stanno insieme in «Compagnia»
var CATN={classici:'Classici',strategia:'Strategia',squadra:'Compagnia'},C3D={festa:'squadra'};
var ICON={regicide:0,rlegacy:0,regix:0,briscola:1,burraco:2,gang:3,saboteur:4,azul:5,island:6,machiavelli:7,scopa:9,mind:10,mindx:11,harvest:12,valle:13,accordi:13,discesa:14,scoundrel:15,uno:16,pets:17,catan:18,kittens:19,perudo:20};
function lum(h){var n=parseInt(h.slice(1),16);return(.3*(n>>16&255)+.59*(n>>8&255)+.11*(n&255))/255}
var GAMES=A.games().map(function(g){var I=A.info(g),b=A.box(g.id);var c=b?b.c[0]:'#5a3a24';if(lum(c)>.62)c=b?b.c[1]:'#5a3a24';if(lum(c)>.62)c='#5a3a24';
  return{id:g.id,g:g,t:g.name,l:I[1].length>13?I[1].slice(0,13):I[1],s:g.desc,r:g.range,k:CATN[C3D[I[0]]||I[0]]||I[0],ck:C3D[I[0]]||I[0],c:c,v:0,m:ICON[g.id]!=null?ICON[g.id]:(g.id.length%16)}});
var CATS=[];['classici','strategia','squadra'].concat(GAMES.map(function(G){return G.ck}).filter(function(k,i,a){return!CATN[k]&&a.indexOf(k)===i})).forEach(function(k){
  if(GAMES.some(function(G){return G.ck===k}))CATS.push({k:CATN[k]||k,c:(A.cat(k)||{f:'#e8b83a'}).f})});
function boxTex0(i){
  var c=mk(256,256),g=c.getContext('2d'),G=GAMES[i];i=G.m;
  g.fillStyle=G.c;g.fillRect(0,0,256,256);
  var gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=gr;g.fillRect(0,0,256,256);
  grain(g,256,256,22);
  g.strokeStyle='#d8b062';g.lineWidth=8;g.strokeRect(12,12,232,232);g.lineWidth=2;g.strokeRect(24,24,208,208);
  g.fillStyle='#d8b062';g.strokeStyle='#d8b062';g.lineWidth=7;
  var cx=128,cy=110,k,a,b;
  if(i===0){g.beginPath();g.moveTo(80,150);g.lineTo(80,80);g.lineTo(104,110);g.lineTo(128,66);g.lineTo(152,110);g.lineTo(176,80);g.lineTo(176,150);g.closePath();g.fill()}
  else if(i===1){g.beginPath();g.arc(cx,cy,42,0,7);g.stroke();g.beginPath();g.arc(cx,cy,24,0,7);g.fill()}
  else if(i===2){g.save();g.translate(cx,cy);g.rotate(-.25);g.strokeRect(-48,-30,50,70);g.rotate(.5);g.strokeRect(-2,-34,50,70);g.restore()}
  else if(i===3){for(k=0;k<5;k++){g.beginPath();g.arc(70+k*29,cy,13,0,7);g.fill()}}
  else if(i===4){g.beginPath();g.moveTo(88,150);g.lineTo(168,70);g.stroke();g.beginPath();g.moveTo(140,62);g.quadraticCurveTo(190,70,184,118);g.stroke()}
  else if(i===5){for(a=0;a<3;a++)for(b=0;b<3;b++){g.fillStyle=(a+b)%2?'#d8b062':'rgba(216,176,98,.35)';g.fillRect(84+a*32,64+b*32,28,28)}}
  else if(i===6){g.beginPath();g.ellipse(cx,cy+10,54,30,0,0,7);g.fill();g.beginPath();g.moveTo(60,150);g.quadraticCurveTo(90,136,128,150);g.quadraticCurveTo(166,164,196,150);g.stroke()}
  else if(i===7){for(var q=0;q<4;q++){g.strokeRect(58+q*36,86,30,46)}}
  else if(i===9){for(var q2=0;q2<3;q2++){g.save();g.translate(cx-40+q2*40,cy);g.rotate((q2-1)*.3);g.strokeRect(-18,-30,36,60);g.restore()}}
  else if(i===10||i===11){g.font='700 46px "Alegreya SC",Georgia,serif';g.textAlign='center';g.fillStyle=i===11?'#ff8a7a':'#d8b062';g.fillText('1 · 2 · 3',cx,cy+14)}
  else if(i===12){g.beginPath();g.arc(cx,cy-10,26,0,7);g.fill();for(var w=0;w<5;w++){g.beginPath();g.moveTo(70+w*30,160);g.lineTo(76+w*30,112);g.stroke()}}
  else if(i===13||i===18){g.beginPath();for(var h=0;h<6;h++){var an=h*Math.PI/3+(i===18?Math.PI/6:0);g.lineTo(cx+44*Math.cos(an),cy+44*Math.sin(an))}g.closePath();g.stroke();g.beginPath();g.arc(cx,cy,12,0,7);g.fill()}
  else if(i===14||i===20){g.strokeRect(cx-38,cy-38,76,76);[[-18,-18],[18,18],[0,0],[18,-18],[-18,18]].forEach(function(p){g.beginPath();g.arc(cx+p[0],cy+p[1],7,0,7);g.fill()})}
  else if(i===15){g.beginPath();g.moveTo(cx,cy-52);g.lineTo(cx+9,cy+18);g.lineTo(cx-9,cy+18);g.closePath();g.fill();g.fillRect(cx-28,cy+18,56,9);g.fillRect(cx-5,cy+27,10,24)}
  else if(i===16){g.save();g.translate(cx,cy);g.rotate(-.5);g.beginPath();g.ellipse(0,0,52,30,0,0,7);g.stroke();g.font='700 34px "Alegreya SC",Georgia,serif';g.textAlign='center';g.fillText('1',0,12);g.restore()}
  else if(i===17||i===19){g.beginPath();g.arc(cx,cy+8,34,0,7);g.fill();g.beginPath();g.moveTo(cx-30,cy-10);g.lineTo(cx-22,cy-48);g.lineTo(cx-6,cy-24);g.moveTo(cx+30,cy-10);g.lineTo(cx+22,cy-48);g.lineTo(cx+6,cy-24);g.fill()}
  else{g.beginPath();g.arc(cx,cy,40,0,7);g.stroke()}
  g.fillStyle='#f6e8c4';g.textAlign='center';g.font='700 38px "Alegreya SC",Georgia,serif';g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=5;g.fillText((G.l||G.t).toUpperCase(),128,206,200);
  return tex(c,1,1);
}

/* ---- copertine illustrate (assets/copertine/<id>.webp): texture della scatola con cornice, targa in ottone e riflesso; senza immagine resta il disegno a codice ---- */
var COPS=typeof COPIMG!=='undefined'?COPIMG:[],BX=[],BXW=384,BXH=512;
function copUrl(i){return COPS.indexOf(GAMES[i].id)>=0?'/assets/copertine/'+GAMES[i].id+'.webp':''}
function paintBox(i,g,img){
  var G=GAMES[i],W=BXW,H=BXH,gr;
  g.save();g.fillStyle=G.c;g.fillRect(0,0,W,H);
  if(img.width===img.height){g.drawImage(img,0,(H-W)/2,W,W)}else g.drawImage(img,0,0,W,H);
  if(copUrl(i)){
    gr=g.createRadialGradient(W/2,H*.42,H*.25,W/2,H*.5,H*.72);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(10,5,0,.5)');g.fillStyle=gr;g.fillRect(0,0,W,H);
    gr=g.createLinearGradient(0,H*.62,0,H);gr.addColorStop(0,'rgba(10,5,0,0)');gr.addColorStop(1,'rgba(10,5,0,.78)');g.fillStyle=gr;g.fillRect(0,H*.62,W,H*.38);
    // targa col titolo: legno scuro, filo d'ottone
    var px=26,py=H-112,pw=W-52,ph=82;
    g.shadowColor='rgba(0,0,0,.65)';g.shadowBlur=14;g.shadowOffsetY=4;g.fillStyle='#2a1a0f';g.fillRect(px,py,pw,ph);g.shadowColor='transparent';
    var wg=g.createLinearGradient(0,py,0,py+ph);wg.addColorStop(0,'#4a2f1a');wg.addColorStop(1,'#25160c');g.fillStyle=wg;g.fillRect(px,py,pw,ph);
    g.strokeStyle='#d8b062';g.lineWidth=3;g.strokeRect(px+1.5,py+1.5,pw-3,ph-3);g.lineWidth=1;g.strokeRect(px+7,py+7,pw-14,ph-14);
    [[px+7,py+7],[px+pw-7,py+7],[px+7,py+ph-7],[px+pw-7,py+ph-7]].forEach(function(q){g.fillStyle='#e9c878';g.beginPath();g.arc(q[0],q[1],3.2,0,7);g.fill()});
    g.fillStyle='#f6e8c4';g.textAlign='center';g.textBaseline='middle';g.shadowColor='rgba(0,0,0,.8)';g.shadowBlur=4;
    var t=G.t.toUpperCase(),fs=40;g.font='700 '+fs+'px "Alegreya SC",Georgia,serif';while(g.measureText(t).width>pw-44&&fs>18){fs-=2;g.font='700 '+fs+'px "Alegreya SC",Georgia,serif'}
    g.fillText(t,W/2,py+ph/2-6);g.shadowBlur=0;g.font='700 15px "Alegreya SC",Georgia,serif';g.fillStyle='#d8b062';g.fillText(G.r+(G.r==='1'?' giocatore':' giocatori'),W/2,py+ph-18);
  }
  // bordo del coperchio e riflesso sul cartone
  g.strokeStyle='rgba(255,236,190,.55)';g.lineWidth=5;g.strokeRect(2.5,2.5,W-5,H-5);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;g.strokeRect(8,8,W-16,H-16);
  gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'rgba(255,255,255,.2)');gr.addColorStop(.38,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.12)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.restore();
}
function boxTex(i){
  if(BX[i])return BX[i];
  var t0=boxTex0(i),c=mk(BXW,BXH),g=c.getContext('2d'),t=tex(c,1,1);BX[i]=t;
  paintBox(i,g,t0.image);
  var u=copUrl(i);
  if(u){var im=new Image();im.onload=function(){paintBox(i,g,im);t.needsUpdate=true;GREYUP(i)};im.src=u}
  return t;
}
function boxSide(i){var G=GAMES[i];if(G._sd)return G._sd;
  var c=mk(96,512),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,96,0);gr.addColorStop(0,G.c);gr.addColorStop(1,G.c);g.fillStyle=G.c;g.fillRect(0,0,96,512);
  gr=g.createLinearGradient(0,0,96,0);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(.5,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=gr;g.fillRect(0,0,96,512);
  grain(g,96,512,26);
  g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,0,96,70);g.fillStyle='rgba(255,236,190,.55)';g.fillRect(0,70,96,3);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,73,96,3);
  g.fillStyle='#d8b062';g.fillRect(0,498,96,3);
  G._sd=tex(c,1,1);return G._sd}
