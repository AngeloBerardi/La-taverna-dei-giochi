/* ---- Figura e creazione del personaggio (T3) ----
   `Figura`: il personaggio 3D di chi gioca (stessa fonte per creazione, crocevia e Taverna): window.__FIGURA (vendor «figura», generato da
   tools/taverna3d) costruisce il pupazzo; qui si legge e si salva l'aspetto (rg-av3 / rg-av, R.mine.av3 / av, profilo online p.av3).
   `Creo`: la schermata del primo ingresso, in tre passi (Nome, Aspetto, Abiti) con il personaggio che gira sotto il dito. ui.creo = passo (0 = chiusa). */
const Figura={
 F:()=>window.__FIGURA||null,
 ha(){try{return!!(R.mine&&R.mine.av3)||!!JSON.parse(ST('rg-av3')||'null')}catch(e){return false}},
 // l'aspetto di chi gioca (normalizzato) o quello di base; null se la libreria non è ancora arrivata
 mio(){const F=Figura.F();if(!F)return null;let o=R.mine&&R.mine.av3;if(!o){try{o=JSON.parse(ST('rg-av3')||'null')}catch(e){o=null}}return F.normFig(o||F.FIGBASE)},
 caso(){const F=Figura.F();return F?F.figCaso():null},
 crea(look){const F=Figura.F();return F?F.crea(look||Figura.mio()):null},
 async salva(o){const F=Figura.F();if(!F)return;o=Object.assign({},o);delete o.hat;
  R.mine.av3=o;R.mine.av=F.figPix(o,AVC,AVS);ST('rg-av3',JSON.stringify(o));ST('rg-av',JSON.stringify(R.mine.av));
  if(FB.st==='ok'&&FB.p){try{await FB.salvaAspetto(o)}catch(e){ERR.n(e,'aspetto')}}}};

const Creo={
 look:null,nome:'',err:'',tab:'',T3:null,carica:false,senza:false,
 PASSI:{2:['corpo','viso','capelli'],3:['abiti','extra']},
 apri(passo,modifica){Creo.modifica=!!modifica;Creo.nome=ME.name||'';Creo.err='';Creo.tab='';Creo.look=Figura.mio();ui.creo=passo||1;
  if(!Creo.look&&!Creo.carica){Creo.carica=true;Promise.all([VENDOR.load('three'),VENDOR.load('figura')]).then(()=>{Creo.carica=false;if(!Creo.look)Creo.look=Figura.mio();if(ui.creo)render()},()=>{Creo.carica=false;Creo.senza=true;if(ui.creo)render()})}
  render()},
 hex:c=>'#'+('00000'+c.toString(16)).slice(-6),
 riga(label,f){const F=Figura.F(),L=F.OPT[f],col=typeof L[0]==='number',cur=Creo.look[f];
  return`<div class="cr-riga"><span>${esc(label)}</span><div>${L.map((v,k)=>{const val=col?v:v[0],on=val===cur||(!col&&cur==null&&k===0);
   return`<button type="button" class="cr-sw${on?' on':''}${col?'':' tx'}" data-a="crsw" data-v="${f}|${k}"${col?` style="background:${Creo.hex(v)}" aria-label="${esc(label)} ${k+1}"`:''}>${col?'':esc(v[1])}</button>`}).join('')}</div></div>`},
 html(){const p=ui.creo,F=Figura.F(),pronto=!!(F&&Creo.look),solo1=Creo.senza||!pronto&&!Creo.carica;
  let corpo;
  if(p===1)corpo=`<label class="cr-lab" for="crnome">${INV?'Sei invitato alla stanza '+esc(INV)+'. Come ti chiami?':'Come ti chiami?'}</label><input type="text" id="crnome" maxlength="14" placeholder="Il tuo nome" value="${esc(Creo.nome)}" autocomplete="nickname"><p class="cr-err" role="alert">${esc(Creo.err)}</p>`;
  else if(!pronto)corpo='<p class="muted">Un attimo, preparo il guardaroba…</p>';
  else{const tabs=Creo.PASSI[p],t=tabs.includes(Creo.tab)?Creo.tab:tabs[0],T=F.TABS.find(x=>x[0]===t);
   corpo=`<div class="cr-tabs" role="tablist">${tabs.map(k=>{const x=F.TABS.find(y=>y[0]===k);return`<button type="button" role="tab" class="${k===t?'on':''}" data-a="crtab" data-v="${k}">${esc(x[1])}</button>`}).join('')}</div><div class="cr-righe" data-sc>${T[3].map(r=>Creo.riga(r[0],r[1])).join('')}</div>`}
  const avanti=p===3||(solo1&&p===1)?'Entra':'Avanti';
  return`<div class="cr"><div class="cr-top"><h2>${p===1?'Benvenuto, viandante':p===2?'Il tuo aspetto':'I tuoi abiti'}</h2><div class="cr-dots" aria-label="Passo ${p} di 3">${[1,2,3].map(i=>`<i class="${i===p?'on':i<p?'fatto':''}"></i>`).join('')}</div></div>
<div class="cr-stage" id="crstage">${Creo.T3?'':Creo.pixel()}</div>
${Creo.senza||!VENDOR.gl()?'':`<div class="cr-viste" role="group" aria-label="Da che lato guardarlo">${[['Fronte',0],['Lato',1],['Spalle',2]].map(([n,k])=>`<button type="button" data-a="crvista" data-v="${k}">${n}</button>`).join('')}</div>`}
<div class="cr-body">${corpo}</div>
<div class="cr-foot">${(p>(Creo.modifica?2:1))?'<button type="button" class="b sm" data-a="crprev">Indietro</button>':''}${pronto&&p>1?'<button type="button" class="b sm" data-a="crcaso">A caso</button>':''}<button type="button" class="b gold" data-a="crnext">${avanti}</button></div></div>`},
 // anteprima a pixel: finché la scena 3D non c'è, o se il telefono non ha WebGL
 pixel(){const F=Figura.F(),av=F&&Creo.look?F.figPix(Creo.look,AVC,AVS):(R.mine.av||{t:0,h:0,c:0,s:0});return`<div class="cr-pix" aria-hidden="true">${tvSprite(av,120)}</div>`},
 // ---- scena 3D: un solo canvas che passa da un ridisegno all'altro (il contesto WebGL non si ricrea) ----
 dopo(){if(!ui.creo){Creo.ferma();return}const st=document.getElementById('crstage');if(!st)return;
  if(Creo.T3){if(Creo.T3.cv.parentNode!==st){st.textContent='';st.appendChild(Creo.T3.cv)}Creo.misura();Creo.cicla();return}
  if(Creo.senza||!Figura.F()||!Creo.look||!VENDOR.gl())return;
  try{Creo.costruisci();st.textContent='';st.appendChild(Creo.T3.cv);Creo.misura();Creo.cicla()}catch(e){ERR.n(e,'creo3d');Creo.senza=true;Creo.T3=null}},
 costruisci(){const T=window.THREE,cv=document.createElement('canvas');cv.className='cr-cv';
  const ren=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});ren.setPixelRatio(Math.min(2,devicePixelRatio||1));ren.outputEncoding=T.sRGBEncoding;
  const scn=new T.Scene(),cam=new T.PerspectiveCamera(30,1,1,200);cam.position.set(0,5.6,21);cam.lookAt(0,3.2,0);
  scn.add(new T.HemisphereLight(0xffd9a8,0x3a2a1a,.95));const sole=new T.DirectionalLight(0xffc27a,1.2);sole.position.set(-8,9,10);scn.add(sole);
  // ambiente: il Crocevia al tramonto (sentiero a croce, cartello, alberi, nebbia); la figura sta al centro
  scn.fog=new T.Fog(0x6a4a3a,26,60);
  const MT=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r||.9}),ad=(m,x,y,z)=>{m.position.set(x,y,z);scn.add(m);return m};
  ad(new T.Mesh(new T.CylinderGeometry(30,30,.3,40),MT(0x4a6a2e)),0,-.35,0);
  [0,Math.PI/2].forEach(r=>{const via=ad(new T.Mesh(new T.BoxGeometry(60,.06,4.6),MT(0x9a7a4a)),0,-.18,0);via.rotation.y=r});
  const ped=ad(new T.Mesh(new T.CylinderGeometry(2.1,2.3,.35,32),MT(0x5a3b1d,.8)),0,-.05,0);
  const anello=new T.Mesh(new T.TorusGeometry(2.1,.06,8,40),new T.MeshStandardMaterial({color:0xb8943a,metalness:.9,roughness:.35}));anello.rotation.x=Math.PI/2;anello.position.y=.14;scn.add(anello);
  const palo=ad(new T.Mesh(new T.CylinderGeometry(.14,.18,5.2,8),MT(0x5a3b1d)),-6.4,2.4,-4.2);
  [[.5,.35],[-.35,-.5]].forEach(([y,r],k)=>{const as=new T.Mesh(new T.BoxGeometry(2.6,.62,.14),MT(0x8a5a2a));as.position.set(0,1.5-k*1.1,.18);as.rotation.z=r*.25;palo.add(as)});
  [[-9,-8],[8.5,-9],[-13,-2],[12,-4],[5,-14],[-4,-15]].forEach(([x,z],k)=>{const h=4+k%3;ad(new T.Mesh(new T.CylinderGeometry(.35,.5,h*.5,7),MT(0x4a2e18)),x,h*.25-.2,z);ad(new T.Mesh(new T.ConeGeometry(2+k%2*.5,h,9),MT(k%2?0x2e5a2a:0x3a6a30)),x,h*.5+h*.4,z)});
  const S=Creo.T3={T,cv,ren,scn,cam,fig:null,ry:0,vel:0,mira:null,drag:null,raf:0,w:0,h:0};
  Creo.rifai();
  cv.addEventListener('pointerdown',e=>{S.drag={x:e.clientX};S.mira=null;try{cv.setPointerCapture(e.pointerId)}catch(x){}});
  cv.addEventListener('pointermove',e=>{if(!S.drag)return;const dx=e.clientX-S.drag.x;S.drag.x=e.clientX;S.ry+=dx*.012;S.vel=dx*.012});
  const su=()=>{S.drag=null};cv.addEventListener('pointerup',su);cv.addEventListener('pointercancel',su);cv.addEventListener('lostpointercapture',su)},
 // ricostruisce il personaggio dall'aspetto in lavorazione
 rifai(){const S=Creo.T3;if(!S)return;if(S.fig)S.scn.remove(S.fig);S.fig=Figura.crea(Creo.look);S.fig.rotation.y=S.ry;S.scn.add(S.fig)},
 misura(){const S=Creo.T3,st=document.getElementById('crstage');if(!S||!st)return;const w=Math.max(120,st.clientWidth),h=Math.max(120,st.clientHeight);
  if(w!==S.w||h!==S.h){S.w=w;S.h=h;S.ren.setSize(w,h,false);S.cam.aspect=w/h;S.cam.updateProjectionMatrix()}},
 cicla(){const S=Creo.T3;if(!S||S.raf)return;const passo=()=>{S.raf=0;if(!ui.creo||!S.cv.isConnected)return;S.raf=requestAnimationFrame(passo);
   if(S.fig){if(S.mira!=null&&!S.drag){const d=Math.atan2(Math.sin(S.mira-S.ry),Math.cos(S.mira-S.ry));if(Math.abs(d)<.01||RM){S.ry=S.mira;S.mira=null}else S.ry+=d*.18}else if(!S.drag){S.vel*=.92;S.ry+=S.vel+(RM?0:.006)}S.fig.rotation.y=S.ry}S.ren.render(S.scn,S.cam)};S.raf=requestAnimationFrame(passo)},
 ferma(){const S=Creo.T3;if(!S)return;if(S.raf){cancelAnimationFrame(S.raf);S.raf=0}},
 // ---- azioni ----
 async act(a,v){const F=Figura.F();
  if(a==='crtab'){Creo.tab=v;return render()}
  if(a==='crsw'){const[f,k]=v.split('|'),L=F.OPT[f][+k],val=typeof L==='number'?L:L[0];Creo.look[f]=val;
   if(Creo.T3&&Creo.T3.fig){const ok=F.aggiorna?F.aggiorna(Creo.T3.fig,f,val):F.updateFigure(Creo.T3.fig,f,val);if(!ok)Creo.rifai()}
   return render()}
  if(a==='crvista'){const S=Creo.T3,m=[0,Math.PI/2,Math.PI][+v]||0;if(S){S.mira=m;S.vel=0}return}
  if(a==='crcaso'){Creo.look=F.figCaso();Creo.rifai();return render()}
  if(a==='crprev'){ui.creo=Math.max(Creo.modifica?2:1,ui.creo-1);return render()}
  if(a==='crnext'){
   if(ui.creo===1){const n=(document.getElementById('crnome')?.value||Creo.nome||'').trim().slice(0,14);Creo.nome=n;
    if(n.length<2){Creo.err='Scrivi un nome di almeno due lettere';return render()}Creo.err='';
    if(Creo.senza||!Figura.F()||!Creo.look)return Creo.fine();ui.creo=2;return render()}
   if(ui.creo===2){ui.creo=3;return render()}
   return Creo.fine()}},
 // entra: nome e aspetto salvati, poi come «setname»
 async fine(){if(Creo.modifica){if(Creo.look&&Figura.F())await Figura.salva(Creo.look);ui.creo=0;Creo.ferma();Creo.modifica=false;return render()}
  const n=Creo.nome;ME.name=n;ST('rg-name',n);R.mine.name=n;
  if(Creo.look&&Figura.F())await Figura.salva(Creo.look);
  ui.creo=0;Creo.ferma();
  if(R.on&&R.code){await saveMine();ui.screen=G?'game':'room';return render()}
  if(ui.screen==='name')ui.screen='room';
  return enterHub()}};
document.addEventListener('input',e=>{if(e.target.id==='crnome')Creo.nome=e.target.value});
