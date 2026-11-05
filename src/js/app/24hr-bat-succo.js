/* ---- Il succo della battaglia in tempo reale (Cantari di Ventura, piano B, step B6): numeri, colpi, sbriciolamento, bottino, «Livello su!». ----
   Le regole di cosa mostrare sono di ASUC (motori/28i: dagli eventi di un istante ai riscontri, con la tabella della sezione 9 del piano); qui si disegna.
   Tutto vive in uno strato fisso nel `body` (`#su-ov`, sopra la battaglia): così numeri, pezzi e monete non spariscono quando la mappa si ridisegna
   (succede a ogni caduta). Le posizioni si prendono dalle creature (`BatT.dis` → schermo con la matrice dell'SVG), quindi valgono con la mappa SVG e con il 3D.
   · numeri: bianco che salta in arco (danno), oro e più grande (critico), verde che sale (cura); al massimo 8 in volo, gli altri si sommano (ASUC.limita);
   · colpito: lampo bianco e spinta di 1–2 px sul segnalino (nel 3D: `Scena3D.passo` caso `colpito`), il critico scuote e ferma l'immagine per 60 ms (`BatT.fermoA`);
   · sbriciola e bottino: il nemico si disfa in quadratini del colore della sua famiglia; monete e sfere rimbalzano, poi volano al contatore (le monete verso l'oro, le sfere
     verso l'esperienza, che sale davvero sfera per sfera con l'esperienza del nemico);
   · livello: colonna di luce sull'eroe e «Livello su!» al centro alla vittoria; area del capo che scoppia (`esplode`) sull'SVG della mappa.
   Con «riduci animazioni» niente voli né pezzi: i numeri si dissolvono sul posto e il contatore sale subito. Stile: css/39i-succo.css (prefisso su-). Piano: docs/AVVENTURA-B.md, scheda B6. */
const Succo=(()=>{
 let gen=0,cnt=0,num=[],stSig={};
 // pezzi di un nemico che si sbriciola: il colore della sua famiglia (Sagome.FAM) in tre toni
 const mescola=(hex,a,k)=>{const n=parseInt(String(hex).slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v+(a-v)*k))).toString(16).padStart(2,'0')).join('')};
 const toni=def=>{const m=(typeof BEST!=='undefined'&&BEST.M[def])||{},c=(Sagome.FAM&&Sagome.FAM[m.fam])||'#8a6a34';return[mescola(c,0,.45),c,mescola(c,255,.4)]};
 const ARCO=[14,-12,9,-16,11,-8];   // dove arriva il numero che salta: a turno a destra e a sinistra, senza dadi
 const Succo={
  mq(){return BatAnima.mq()},
  strato(){let e=document.getElementById('su-ov');if(!e){e=document.createElement('div');e.id='su-ov';e.setAttribute('aria-hidden','true');document.body.appendChild(e)}return e},
  // un elemento nello strato: sparisce da solo dopo `ms` (più un attimo); `vars` sono variabili CSS (--dx…)
  el(cls,testo,x,y,vars,ms){const e=document.createElement('span');e.className=cls;if(testo!=null)e.textContent=testo;e.style.left=x.toFixed(1)+'px';e.style.top=y.toFixed(1)+'px';
   for(const k in vars||{})e.style.setProperty(k,vars[k]);Succo.strato().appendChild(e);e._t=setTimeout(()=>e.remove(),ms+80);return e},
  // il centro del corpo di una creatura sullo schermo, e quanto è ingrandita la mappa (k)
  punto(id){const svg=document.querySelector('.tr-bat .bt-svg'),d=BatT.dis&&BatT.dis[id];if(!svg||!d||!svg.getScreenCTM||!svg.createSVGPoint)return null;const m=svg.getScreenCTM();if(!m)return null;
   const p=svg.createSVGPoint();p.x=d.x;p.y=d.y-14;const q=p.matrixTransform(m);return{x:q.x,y:q.y,k:m.a||1}},
  // ---- numeri ----
  txt:n=>(n.v>0?'+':'−')+Math.abs(n.v),
  clsNum:n=>'su-num '+(n.v>0?'pos':'neg')+(n.crit?' crit':''),
  numero(r){const P=Succo.punto(r.chi);if(!P)return;const ora=performance.now(),n={chi:r.chi,v:r.v,crit:!!r.crit,fine:ora+r.ms},L=ASUC.limita(num,n,ora);num=L.vivi;
   if(L.op==='somma'){const a=num[L.idx];Object.assign(a,ASUC.somma(a,n),{fine:ora+r.ms});const e=a.el;if(e){e.textContent=Succo.txt(a);e.className=Succo.clsNum(a)+' somma';e.style.animation='none';void e.offsetWidth;e.style.animation='';clearTimeout(e._t);e._t=setTimeout(()=>e.remove(),r.ms+80)}return}
   n.el=Succo.el(Succo.clsNum(n),Succo.txt(n),P.x,P.y-26*P.k,{'--dx':ARCO[cnt++%ARCO.length]+'px'},r.ms);num.push(n)},
  mancato(r){const P=Succo.punto(r.chi);if(P)Succo.el('su-et su-manc','Mancato',P.x,P.y-30*P.k,{},r.ms)},
  // ---- il colpo sul segnalino: lampo e spinta di 1–2 px dalla parte opposta a chi colpisce (il critico scuote) ----
  colpito(r){const el=BatT.els.get(r.chi);if(!el)return;let sx=0,sy=0;
   if(r.px&&r.da!=null){const a=BatT.dis[r.da],b=BatT.dis[r.chi];if(a&&b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;sx=dx/d*r.px;sy=dy/d*r.px*.6}}
   el.style.setProperty('--sx',sx.toFixed(2)+'px');el.style.setProperty('--sy',sy.toFixed(2)+'px');BatT.cls(r.chi,r.scossa?'su-crit':'su-colpito',r.ms)},
  // quadratini che saltano fuori dal corpo: `cls` ne dà il colore e il moto; il caso è quello di ASUC.sparpaglia (uguale per tutti)
  pezzi(P,n,seme,cls,ms,col,spazio){const sp=ASUC.sparpaglia(seme,n),k=P.k;
   sp.forEach((q,i)=>{const e=Succo.el('su-px '+cls,null,P.x+q.dx*(spazio||10)*k,P.y+(q.dy*10-8)*k,{'--vx':(q.dx*24).toFixed(1)+'px','--vy':(-8-q.dy*20).toFixed(1)+'px','--fy':(22+q.dy*8).toFixed(1)+'px'},ms);
    if(col)e.style.background=col[i%col.length];e.style.animationDelay=(q.rit>>2)+'ms'})},
  scintille(r){const P=Succo.punto(r.chi);if(P&&!Succo.mq())Succo.pezzi(P,6,r.chi+'c','su-sc',r.ms,['#c9ffd0','#7fe08a','#e9fff0'],8)},
  sbriciola(r){const P=Succo.punto(r.chi);if(!P||Succo.mq())return;Succo.pezzi(P,16,r.chi+'s','su-cr',r.ms,toni(r.def),12)},
  // ---- bottino: monete e sfere cadono e rimbalzano, poi volano al contatore (le sfere portano l'esperienza vera) ----
  bottino(r){const P=Succo.punto(r.chi),rid=Succo.mq()||!P,g=gen,T=ASUC.TAB.bottino,exp=document.querySelector('.tr-ris .su-cont'),oro=document.querySelector('.tr-ris .su-oro');
   const q=Math.floor(r.xp/r.sfere),extra=r.xp-q*r.sfere,pezzi=[...Array(r.monete).fill('m'),...Array(r.sfere).fill('s')],sp=ASUC.sparpaglia(r.chi+'b',pezzi.length);let sf=0;
   pezzi.forEach((tipo,i)=>{const val=tipo==='s'?q+(sf++<extra?1:0):0,dest=tipo==='s'?exp:oro,o=sp[i];
    if(rid||typeof Element==='undefined'||!Element.prototype.animate){if(val)Succo.arriva(val);return}
    const e=Succo.el('su-pz '+(tipo==='s'?'sfera':'moneta'),null,P.x,P.y,{},1500),x0=o.dx*18*P.k,h=8+o.dy*14;
    const A=e.animate([{transform:'translate(0,-12px)'},{transform:`translate(${(x0*.6).toFixed(1)}px,6px)`,offset:.4},{transform:`translate(${(x0*.85).toFixed(1)}px,${(6-h).toFixed(1)}px)`,offset:.65},{transform:`translate(${x0.toFixed(1)}px,6px)`}],{duration:T.caduta,easing:'ease-in',fill:'forwards'});
    A.onfinish=()=>{if(g!==gen){e.remove();return}const B=dest&&dest.getBoundingClientRect(),bx=B?B.left+B.width/2-P.x-x0:0,by=B?B.top+B.height/2-P.y-6:-300;
     const F=e.animate([{transform:`translate(${x0.toFixed(1)}px,6px)`},{transform:`translate(${(x0+bx).toFixed(1)}px,${(6+by).toFixed(1)}px) scale(.6)`}],{duration:480,delay:90+o.rit,easing:'cubic-bezier(.5,0,.9,.6)',fill:'forwards'});
     F.onfinish=()=>{e.remove();if(g!==gen)return;if(val)Succo.arriva(val);else Succo.pop(dest)}}})},
  pop(el){if(!el)return;el.classList.remove('su-pop');void el.offsetWidth;el.classList.add('su-pop');setTimeout(()=>el.classList.remove('su-pop'),260)},
  // il contatore dell'esperienza: sale quando arriva una sfera (e si ridisegna dal valore tenuto in `BatT.xpShow`)
  arriva(v){BatT.xpShow=(BatT.xpShow|0)+v;const c=document.querySelector('.tr-ris .su-cont');if(c){const b=c.querySelector('b');if(b)b.textContent=BatT.xpShow;Succo.pop(c)}},
  daStato(s){return s&&s.cb?s.cb.filter(c=>c.lato==='nemici'&&c.morto).reduce((a,c)=>a+(c.xp|0),0):0},
  // ---- «Livello su!»: colonna di luce sull'eroe e il titolo al centro (più eroi: a scala) ----
  livello(r){const g=gen,i=Math.round((r.rit||0)/ASUC.TAB.livello.scala);
   setTimeout(()=>{if(g!==gen)return;const P=Succo.punto(r.chi);if(P&&!Succo.mq())Succo.el('su-colonna',null,P.x,P.y+10*P.k,{},r.ms);
    const e=Succo.el('su-livello',null,innerWidth/2,innerHeight*.32+i*58,{},r.ms);e.innerHTML=`<b>Livello su!</b><small>${esc(r.nome)} · livello ${r.liv|0}</small>`},r.rit||0)},
  // ---- l'area rossa del capo scoppia: le sue caselle si accendono un attimo sulla mappa ----
  esplode(r){const g=document.querySelector('.tr-bat .bt-fx');if(!g||!Bat.s)return;
   for(const c of r.zona){const [x,y]=BatMappa.xy(c.q,c.r),h=AGRI.alt(Bat.s.arena,c)?6:0,e=document.createElementNS(BatAnima.NS,'polygon');e.setAttribute('points',BatMappa.punti(x,y-h,BatMappa.Z-2));e.setAttribute('class','su-boom');g.appendChild(e);setTimeout(()=>e.remove(),r.ms+60)}},
  // ---- il dispatcher: ogni riscontro, il suo disegno e il suo suono ----
  gioca(ris,s){const rid=Succo.mq(),d3=Scena3D.on();
   for(const r of ris){try{switch(r.t){
     case'numero':Succo.numero(r);BatT.suono(r);if(r.crit&&!rid)BatT.fermoA=performance.now()+ASUC.TAB.critico.fermo;break;
     case'colpito':Succo.colpito(r);if(d3)Scena3D.passo(r,s,1,rid);break;
     case'mancato':Succo.mancato(r);BatT.suono(r);break;
     case'scintille':Succo.scintille(r);break;
     case'sbriciola':Succo.sbriciola(r);BatT.suono(r);break;
     case'bottino':Succo.bottino(r);BatT.suono(r);break;
     case'esplode':Succo.esplode(r);BatT.suono(r);break;
     case'area':BatT.suono(r);break;
     case'livello':Succo.livello(r);BatT.suono(r);break}}catch(e){ERR.n(e,'succo')}}},
  // ---- ogni istante: la tinta degli stati sui segnalini; true se le icone di stato da disegnare sono cambiate (la mappa le disegna al render) ----
  tinte(s){for(const c of s.cb){const el=BatT.els.get(c.id);if(!el)continue;const t=ASUC.tintaDi(c);for(const k of ASUC.TINTE)el.classList.toggle('su-t-'+k,k===t)}},
  stati(s){let cambiato=false;for(const c of s.cb){const sig=ASUC.statiVisibili(c).map(x=>x.id).filter(id=>id!=='terra'&&Sagome.STATO[id]).join(',');
    if(stSig[c.id]!==undefined&&stSig[c.id]!==sig)cambiato=true;stSig[c.id]=sig}return cambiato},
  // una battaglia nuova o ripresa: via tutto quello che era in volo
  pulisci(){gen++;num=[];stSig={};const e=document.getElementById('su-ov');if(e)e.innerHTML=''}};
 // il gelo (stato «congelato») ha la sua icona sul segnalino come fiamme e veleno
 if(typeof Sagome!=='undefined'&&Sagome.STATO&&!Sagome.STATO.congelato)Sagome.STATO.congelato=['scintilla','#8fd0f0'];
 return Succo})();
