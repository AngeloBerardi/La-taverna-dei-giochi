/* ---- Regicide Legacy sullo schermo comune (?tv=CODICE): plancia low-poly ----
   Stesso palcoscenico degli altri tavoli 3D (LP + TVM di 24s): tappeto centrale verde, nemico nella custodia viola al centro
   con i segnalini d'oro di vita e forza, mazzo dei nemici, riserva, scarti, banditi, zona missione e dispersi; davanti, i tappetini
   dei giocatori con le carte giocate scoperte e la mano coperta (solo il numero). Le carte sono le stesse SVG del telefono (RLA)
   dipinte su canvas. Nessuna informazione nascosta: niente mani, niente cima della riserva. Senza WebGL resta la plancia 2D. */
const RLTEX={};
function rlTex(key,markup){if(RLTEX[key])return RLTEX[key];const K=LP.K,c=K.canv(200,280),g=c.getContext('2d'),t=K.ctex(c);t.anisotropy=8;
 g.fillStyle='#1f3a26';g.fillRect(0,0,200,280);const im=RLA.img(key,markup),draw=()=>{g.clearRect(0,0,200,280);g.drawImage(im,0,0,200,280);t.needsUpdate=true};
 if(im.complete&&im.naturalWidth)draw();else im.addEventListener('load',draw,{once:true});RLTEX[key]=t;return t}
function rlCard3(key,markup,w){const T=LP.T,h=w*1.4,g=new T.PlaneGeometry(w,h);g.rotateX(-Math.PI/2);
 const m=new T.Mesh(g,new T.MeshStandardMaterial({map:rlTex(key,markup),roughness:.6}));m.castShadow=true;m.receiveShadow=true;return m}
const rlFace=(s,id)=>rlCard3('c'+id+(s.corr.includes(id)?'x':''),RLA.svg(RLEG.def(s,id),{id,corr:s.corr.includes(id)}),1)
const RLC={mat:'#1f4a2c',edge:'#c9a54a',foe:'#3a2450',res:'#1f3a26',ban:'#555a60'};
const RLTV=TVM('rltv3d','rlegacy',{fw:15.6,fd:10.4,cx:0,cz:.2},(R_,s)=>{LP.table(R_,{w:15,d:10,felt:'#16261a',frame:'#4a2f18'});
 const T=LP.T,b=LP.builder(),Y=LP.TOP;
 // tappeto centrale con bordo dorato e i posti delle pile
 b.prism(LP.cutRect(0,-1.2,11.6,5.6,.5),Y,Y+.03,'#7a5a1a');b.prism(LP.cutRect(0,-1.2,11.3,5.3,.45),Y+.03,Y+.05,RLC.mat);
 [[-4.6,-2.4],[3.6,-2.4],[5.0,-2.4],[5.0,.2]].forEach(([x,z])=>b.prism(LP.cutRect(x,z,1.25,1.65,.12),Y+.05,Y+.06,'#2c5e38'));
 const n=s.n;for(let p=0;p<n;p++){const x=(p-(n-1)/2)*(14/Math.max(n,2)),w=Math.min(4.6,13.6/n-.3);b.prism(LP.cutRect(x,3.35,w,2.6,.3),Y,Y+.04,'#3b2616');b.prism(LP.cutRect(x,3.35,w-.2,2.4,.26),Y+.04,Y+.06,'#24402c')}
 const g=new T.Group();g.add(b.mesh());R_.stat.add(g);
 const pl=LP.plate('REGICIDE LEGACY',4.4,.5,{bg:'#1a1208',edge:'#c9a54a',fg:'#e9d48a'});pl.position.set(0,Y+.06,-4.3);R_.stat.add(pl)},(R_,s,anim)=>{
 const T=LP.T,Y=LP.TOP+.06,b=LP.builder(),ev=anim?(s.ev||[]):[],put=(o,x,y,z,rot)=>{o.position.set(x,y,z);if(rot)o.rotation.y=rot;R_.dyn.add(o);return o};
 const stack=(x,z,n,col,max)=>{const h=Math.min(max||.9,n*.012+.02);if(n)b.prism(LP.cutRect(x,z,1.05,1.45,.1),Y,Y+h,col,{side:LP.mix(col,'#000000',.35)});return Y+h};
 // nemico: carta grande nella custodia viola, segnalini di vita e forza
 const en=ui.viewEn||s.en;
 if(en){const k='e'+en.nm+en.c+en.dmg+'|'+RLEG.effStr(s),card=rlCard3(k,RLA.svg({k:'e',f:en.f,v:RLEG.effStr(s),c:en.c,nm:en.nm},{hp:Math.max(0,en.hp-en.dmg)}),2.4);
  put(card,0,Y+.135,-1.4);if(ev.some(e=>e.t==='next'))R_.drop(card);
  b.prism(LP.cutRect(0,-1.35,2.7,3.6,.2),Y,Y+.12,'#2a1638',{side:'#1a0e24'});
  const left=Math.max(0,en.hp-en.dmg);
  [[-2.2,'#c23a4a',left,'vita'],[2.2,'#e3b53a',RLEG.effStr(s),'forza']].forEach(([x,col,v,lab])=>{b.cone(x,-1.9,.42,.18,10,Y,col,{r2:.42});const t=LP.plate(String(v),.8,.42,{bg:LP.mix(col,'#000000',.4),edge:col});put(t,x,Y+.19,-1.9);const l=LP.plate(lab,.9,.28,{bg:'#1a1208'});put(l,x,Y+.02,-1.35)});
  // barra della vita sul bordo del tappeto
  const W=5.6,f=left/en.hp;b.prism(LP.cutRect(0,.75,W+.1,.3,.08),Y,Y+.05,'#1a0e10');if(f>0)b.prism(LP.cutRect(-W/2+W*f/2,.75,W*f,.22,.06),Y+.05,Y+.09,'#c23a4a');
  const glow=LP.glow(LP.cutRect(0,-1.4,2.9,3.9,.3),'#a77bd0',.45);glow.position.y=Y+.02;R_.dyn.add(glow);R_.pulses.push(glow)}
 // mazzo dei nemici (custodie viola) a sinistra
 const ty=stack(-4.6,-2.4,s.castle.length*6,RLC.foe,.6);const pc=LP.plate('Nemici '+s.castle.length,1.3,.32,{bg:'#2a1638',edge:'#a77bd0'});put(pc,-4.6,Y+.01,-1.35);
 if(s.castle.length){const bk=rlCard3('back',RLA.back(),1.05);put(bk,-4.6,ty+.005,-2.4)}
 // riserva, scarti, banditi
 const ry=stack(3.6,-2.4,s.res.length,RLC.res);if(s.res.length)put(rlCard3('back',RLA.back(),1.05),3.6,ry+.005,-2.4);put(LP.plate('Riserva '+s.res.length,1.3,.3),3.6,Y+.01,-1.4);
 const dy=stack(5.0,-2.4,s.disc.length,'#7a8a5a');if(s.disc.length){const c=rlFace(s,s.disc[s.disc.length-1]);c.scale.setScalar(1.05);put(c,5.0,dy+.005,-2.4,.06)}put(LP.plate('Scarti '+s.disc.length,1.3,.3),5.0,Y+.01,-1.4);
 const by=stack(5.0,.2,s.ban.length,RLC.ban);if(s.ban.length){const c=rlFace(s,s.ban[s.ban.length-1]);c.material=c.material.clone();c.material.color=new T.Color(LP.lin('#8a8a8a'));put(c,5.0,by+.005,.2,-.08)}put(LP.plate('Banditi '+s.ban.length,1.3,.3,{bg:'#2b2b30'}),5.0,Y+.01,1.15);
 // dispersi (missione 9) o reliquie
 if(s.stacks)s.stacks.forEach((x,k)=>{stack(-5.9+k*1.25,.2,x.length*4,'#2c5e38',.5);put(LP.plate(String(x.length),.5,.3),-5.9+k*1.25,Y+.01,1.1)});
 // zona missione: dieci caselle dall'asso al 10
 if(s.fx.zona)for(let i=0;i<10;i++){const x=-2.7+i*.6,z=1.35,on=!!s.mz[i];b.prism(LP.cutRect(x,z,.52,.52,.06),Y,Y+(on?.12:.03),on?'#6fb35a':'#2c4a30');const t=LP.plate(i?String(i+1):'A',.36,.28,{bg:on?'#2f5a26':'#1a2a1c',edge:on?'#bfe8a0':'#456a48'});put(t,x,Y+(on?.13:.04),z)}
 // tappetini dei giocatori: carte giocate scoperte, mano coperta
 const n=s.n;for(let p=0;p<n;p++){const x=(p-(n-1)/2)*(14/Math.max(n,2)),w=Math.min(4.6,13.6/n-.3),m=s.mats[p],act=p===s.cur&&!s.over;
  const nm=LP.plate(s.names[p],Math.min(2.6,w-.4),.4,{bg:act?'#7a5a1a':'#2a1b0f',edge:act?'#ffe08a':'#c9973b'});put(nm,x,Y+.01,4.4);
  const hy=stack(x-w/2+.75,3.1,s.hands[p].length*4,RLC.res,.4);if(s.hands[p].length){put(rlCard3('back',RLA.back(),.9),x-w/2+.75,hy+.005,3.1);put(LP.plate(s.hands[p].length+' in mano',1.2,.3),x-w/2+.75,Y+.01,4.0)}
  const sp=Math.min(.8,(w-1.9)/Math.max(1,m.length));m.forEach((c,i)=>{const o=rlFace(s,c);o.scale.setScalar(1.05);put(o,x-w/2+2.05+i*sp,Y+.02+i*.004,3.0,(i%2?.05:-.05));if(ev.some(e=>e.t==='play'&&e.p===p&&e.c.includes(c)))R_.drop(o,i*.08)});
  if(act){const gl=LP.glow(LP.cutRect(x,3.35,w+.2,2.7,.3),'#ffd36b',.5);gl.position.y=LP.TOP+.01;R_.dyn.add(gl);R_.pulses.push(gl)}}
 // carte scoperte dal Mago in fila sopra il nemico
 if(s.phase==='magic')s.rev.forEach((c,i)=>{const o=rlFace(s,c);o.scale.setScalar(.8);put(o,-((s.rev.length-1)/2)*.9+i*.9,Y+.5,.3)});
 const mm=b.mesh();if(mm)R_.dyn.add(mm)});
LP.reg.rlegacy=RLTV;
function rlegacyTVH(){const s=G,ok=s.phase!=='prep'&&RLTV.sync(s),o=s.over,nm=i=>esc(s.names[i]),mi=RLV.info(s);document.documentElement.dataset.tv3=ok?'1':'';
 if(s.phase==='prep'){RLTV.hide();return LP.shell({cls:'rltv',logo:'Regicide Legacy',sub:esc(RLV.name(s)),state:`<b>${nm(s.cur)}</b> prepara la missione`,
  mid:`<div class="rltv-prep"><h2>${esc(mi.n)}</h2><em>${esc(mi.luogo)}</em><p>${esc(mi.intro)}</p><div class="rl-rules">${RLV.rules(s).map(([a,b])=>`<span class="rl-rule"><b>${esc(a)}</b> · ${esc(b)}</span>`).join('')}</div></div>`,right:'',foot:''})}
 const en=s.en,state=o?(o.win?'<b>Missione compiuta!</b>':'<b>Missione fallita</b>'):s.phase==='discard'?`<b>${nm(s.cur)}</b> deve parare <b>${s.owed}</b>`:s.phase==='pick'?`<b>${nm(s.cur)}</b> ha giocato il giullare: chi lo reclama?`:s.phase==='magic'?`<b>${nm(s.cur)}</b> sceglie una carta del Mago`:`Tocca a <b>${nm(s.cur)}</b>`;
 const enH=en?`<div class="rltv-en"><b>${esc(en.nm)}</b><span>Vita ${Math.max(0,en.hp-en.dmg)} / ${en.hp}</span><span>Forza ${RLEG.effStr(s)}</span><span>Immune ${RLV.icons(en.c,22)}</span></div>`:'';
 const pls=s.names.map((n,i)=>`<li class="${i===s.cur&&!o?'act':''}"><i class="tv3-dot"></i><span class="tv3-n">${esc(n)}</span><b class="tv3-vp">${s.hands[i].length}<small> carte</small></b></li>`).join('');
 const flat=ok?'':`<div class="rltv-flat">${en?RLV.foeCard(s,en,'xl'):''}<div class="rl-field">${s.mats.map(m=>m.map(c=>RLV.card(c,{s,cls:'sm'})).join('')).join('')}</div></div>`;
 const end=o?LP.endH(o.win,o.win?'Missione compiuta!':'Missione fallita',esc(o.win?mi.win:mi.lose),`<p>Nemici sconfitti: ${s.kills}</p>`):'';
 return LP.shell({cls:'rltv n'+s.n,logo:'Regicide Legacy',sub:esc(RLV.name(s)),state,mid:flat,
  right:`${enH}<div class="rl-rules">${RLV.chips(s)}</div><ul class="tv3-pl">${pls}</ul>${(s.rel||[]).length?`<div class="rltv-rel">${s.rel.map(r=>`<span class="rl-relic">${esc(RLEG.REL[r].n)}</span>`).join('')}</div>`:''}${LP.feedH(s)}`,foot:'',end})}
