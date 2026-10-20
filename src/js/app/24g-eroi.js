/* ---- Eroi: creazione guidata del personaggio e scheda (regole: motori/27-eroi.js; dati: players/{uid}/eroi, vedi FB.eroi) ---- */
const Eroi={
 lista:null,bozza:null,pas:0,sel:null,msg:'',busy:false,
 PASSI:['Aspetto','Razza','Classe','Punteggi','Riepilogo'],
 PELLE:['#f1c9a5','#e0ac82','#c68863','#8d5a3b','#6b4226','#fbe0c8'],PELLE_ORCO:['#9bbf6a','#86ab5c','#6f9a4c','#5c8a40','#4a7a36','#b3d17f'],
 CAPELLI:['#2b1b10','#5a3a1e','#c9892f','#e8d27a','#b8452c','#d8d8d8','#1c1c28'],MANTELLO:['#b23a2e','#2f6fb5','#3c8f4e','#7a4aa8','#d08a1f','#40464f'],
 VISI:[0,1,2,3].map(i=>ic('viso'+i,24)),
 EMBLEMA:{guerriero:ic('spada',16),ladro:ic('pugnale',16),mago:ic('scintilla',16),chierico:ic('croce',16),esploratore:ic('freccia',16),bardo:ic('nota',16)},
 // ritratto disegnato in SVG, tutto originale: testa, capelli, mantello, tratti di razza e un emblema di classe
 ritratto(a,razza,classe,px){a=a||{pelle:0,capelli:0,mantello:0,viso:0};const pe=(razza==='orco'?Eroi.PELLE_ORCO:Eroi.PELLE)[a.pelle]||Eroi.PELLE[0],ca=Eroi.CAPELLI[a.capelli]||Eroi.CAPELLI[0],ma=Eroi.MANTELLO[a.mantello]||Eroi.MANTELLO[0];
  const orecchie=razza==='elfo'?`<path d="M27 47 L12 40 L28 56Z M73 47 L88 40 L72 56Z" fill="${pe}"/>`:`<circle cx="26" cy="50" r="5" fill="${pe}"/><circle cx="74" cy="50" r="5" fill="${pe}"/>`;
  const barba=razza==='nano'?`<path d="M30 56 Q50 98 70 56 Q50 70 30 56Z" fill="${ca}"/>`:'';
  const zanne=razza==='orco'?'<path d="M42 64 l3 -7 l3 7z M52 64 l3 -7 l3 7z" fill="#f4efe0"/>':'';
  const capelli=[`<path d="M26 46 Q26 18 50 18 Q74 18 74 46 Q62 30 50 32 Q38 30 26 46Z" fill="${ca}"/>`,`<path d="M24 52 Q20 16 50 16 Q80 16 76 52 Q70 32 50 32 Q30 32 24 52Z M24 52 L22 78 L32 60Z M76 52 L78 78 L68 60Z" fill="${ca}"/>`,
   `<path d="M27 44 Q30 14 50 14 Q70 14 73 44 Q60 24 50 26 Q40 24 27 44Z" fill="${ca}"/><circle cx="50" cy="12" r="7" fill="${ca}"/>`,`<path d="M28 44 Q50 6 72 44 Q62 34 50 34 Q38 34 28 44Z" fill="${ca}"/>`,
   `<path d="M25 50 Q22 20 50 17 Q78 20 75 50 L68 36 Q50 26 32 36Z" fill="${ca}"/>`,`<path d="M30 42 Q50 20 70 42 Q50 34 30 42Z" fill="${ca}"/>`,`<path d="M24 50 Q24 14 50 14 Q76 14 76 50 Q66 28 50 28 Q34 28 24 50Z" fill="${ca}"/>`][a.capelli]||'';
  const occhi=`<circle cx="42" cy="50" r="${a.viso===3?3.4:2.6}" fill="#241a12"/><circle cx="58" cy="50" r="${a.viso===3?3.4:2.6}" fill="#241a12"/>`;
  const bocca=[`<path d="M44 62 H56" stroke="#5a2f22" stroke-width="2.4" stroke-linecap="round"/>`,`<path d="M43 60 Q50 68 57 60" stroke="#5a2f22" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,`<path d="M44 63 Q50 59 56 63" stroke="#5a2f22" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M37 44 L47 46 M63 44 L53 46" stroke="#241a12" stroke-width="2.2" stroke-linecap="round"/>`,`<ellipse cx="50" cy="63" rx="3.5" ry="4" fill="#5a2f22"/>`][a.viso]||'';
  return`<svg class="rit" viewBox="0 0 100 100" width="${px||72}" height="${px||72}" role="img" aria-label="Ritratto"><circle cx="50" cy="50" r="48" fill="#3a2d22"/><clipPath id="rc${px||72}"><circle cx="50" cy="50" r="47"/></clipPath><g clip-path="url(#rc${px||72})"><path d="M8 100 Q12 72 50 70 Q88 72 92 100Z" fill="${ma}"/><path d="M40 70 L50 82 L60 70Z" fill="rgba(0,0,0,.25)"/>${orecchie}<rect x="43" y="60" width="14" height="14" rx="4" fill="${pe}"/><ellipse cx="50" cy="48" rx="23" ry="26" fill="${pe}"/>${barba}${capelli}${occhi}${bocca}${zanne}</g><circle cx="50" cy="50" r="47" fill="none" stroke="#d6aa3c" stroke-width="3"/><text x="82" y="92" font-size="20" text-anchor="middle" fill="#f3e6c4" stroke="#1a1208" stroke-width=".6">${Eroi.EMBLEMA[classe]||''}</text></svg>`},
 cfgH(){return FB.st==='ok'&&FB.p?'<button class="b sm tile" data-a="eroi"><span class="ti">'+ic('spada')+'</span>Eroi</button>':''},
 nuovaBozza(){return{nome:'',razza:'umano',classe:'guerriero',base:EROI.baseIniziale(),aspetto:{pelle:0,capelli:0,mantello:0,viso:1}}},
 puntiLiberi(){return EROI.BUDGET-EROI.costoBase(Eroi.bozza.base)},
 bonusTesto(r){return Object.entries(r.bonus).map(([k,v])=>'+'+v+' '+EROI.NOME_STAT[k].slice(0,3)).join(' ')},
 html(){return Eroi.pas?Eroi.creaH():Eroi.sel?Eroi.schedaH():Eroi.listaH()},
 listaH(){const L=Eroi.lista,ids=EROI.SLOT_ID,pieni=ids.filter(id=>L&&L[id]),liberi=ids.filter(id=>!(L&&L[id]));
  const carta=id=>{const h=L[id],nx=EROI.SOGLIE_XP[h.liv];return`<button class="ecard" data-a="eroischeda" data-v="${id}">${Eroi.ritratto(h.aspetto,h.razza,h.classe,64)}<span class="etx"><b>${esc(h.nome)}</b><small>${esc(EROI.RAZZE[h.razza].nome)} · ${esc(EROI.CLASSI[h.classe].nome)}</small><span class="ebar" title="Esperienza"><i style="width:${nx?Math.min(100,Math.round(h.xp/nx*100)):100}%"></i></span></span><span class="elv">Liv.<b>${h.liv}</b></span></button>`};
  return`<div class="modal"><div class="box col eroi"><h2>I tuoi eroi</h2>
${L==null?'<p class="muted">Carico…</p>':`${pieni.length?`<button class="b gold ecta" data-a="campstart">${ic('spada',18)} Parti in campagna</button><small class="muted" style="text-align:center">${pieni.length>3?'Il gruppo è formato dai tuoi primi 3 eroi.':pieni.length===1?'Parti con il tuo eroe.':'Il gruppo è formato dai tuoi '+pieni.length+' eroi.'}</small>`:'<p class="muted" style="margin:0">Non hai ancora nessun eroe. Creane uno: lo ritrovi da qualsiasi telefono e parteciperà alle campagne.</p>'}
${pieni.map(carta).join('')}${liberi.length?`<button class="ecard nuovo" data-a="eroinuovo" data-v="${liberi[0]}"><span class="eplus">＋</span><span class="etx"><b>Nuovo eroe</b><small>${liberi.length} ${liberi.length===1?'posto libero':'posti liberi'} su ${EROI.MAX_EROI}</small></span></button>`:'<small class="muted">Hai raggiunto il massimo di eroi.</small>'}`}
<p class="acc-msg" role="status">${esc(Eroi.msg)}</p><button class="b sm" data-a="eroix">Chiudi</button></div></div>`},
 creaH(){const b=Eroi.bozza,p=Eroi.pas,ultimo=p===Eroi.PASSI.length;let corpo='';
  if(p===1){const sw=(k,nome,lista)=>`<div class="esw" role="group" aria-label="${nome}"><span>${nome}</span><div>${lista.map((c,i)=>`<button class="dot ${b.aspetto[k]===i?'on':''}" style="background:${c}" data-a="eroicol" data-v="${k}:${i}" aria-label="${nome} ${i+1}" aria-pressed="${b.aspetto[k]===i}"></button>`).join('')}</div></div>`;
   const pe=b.razza==='orco'?Eroi.PELLE_ORCO:Eroi.PELLE;
   corpo=`<div class="eritr big">${Eroi.ritratto(b.aspetto,b.razza,b.classe,132)}</div><input class="acc-in" id="eroe-nome" type="text" maxlength="16" placeholder="Come si chiama?" autocomplete="off" value="${esc(b.nome)}">
${sw('pelle','Pelle',pe)}${sw('capelli','Capelli',Eroi.CAPELLI)}${sw('mantello','Mantello',Eroi.MANTELLO)}
<div class="esw"><span>Espressione</span><div>${Eroi.VISI.map((g,i)=>`<button class="dot vis ${b.aspetto.viso===i?'on':''}" data-a="eroicol" data-v="viso:${i}" aria-label="Espressione ${i+1}" aria-pressed="${b.aspetto.viso===i}">${g}</button>`).join('')}</div></div>`}
  else if(p===2)corpo=Object.entries(EROI.RAZZE).map(([id,r])=>`<button class="esc ${b.razza===id?'on':''}" data-a="eroirazza" data-v="${id}"><b>${esc(r.nome)}</b><small>${esc(r.desc)}</small><em>${esc(Eroi.bonusTesto(r))} · ${r.tratto} · mov. ${r.mov}</em></button>`).join('');
  else if(p===3)corpo=Object.entries(EROI.CLASSI).map(([id,c])=>`<button class="esc ${b.classe===id?'on':''}" data-a="eroiclasse" data-v="${id}"><b>${Eroi.EMBLEMA[id]} ${esc(c.nome)}</b><small>${esc(c.desc)}</small><em>d${c.dado} · principale ${EROI.NOME_STAT[c.primaria]}</em></button>`).join('');
  else if(p===4){const st=EROI.punteggi(b.base,b.razza),lib=Eroi.puntiLiberi();
   corpo=`<div class="epunti ${lib===0?'zero':''}"><b id="punti">${lib}</b><span>punti da spendere su ${EROI.BUDGET}</span><i style="width:${Math.round(lib/EROI.BUDGET*100)}%"></i></div><small class="muted">Ogni punteggio va da ${EROI.BASE_MIN} a ${EROI.BASE_MAX}; più è alto, più costa. La razza aggiunge un bonus.</small>
<div class="estats">${EROI.STAT.map(k=>{const m=EROI.mod(st[k]);return`<div class="est"><span class="en">${EROI.NOME_STAT[k]}</span><div class="ev"><button class="b sm" data-a="eroipt" data-v="${k}:-1" ${b.base[k]<=EROI.BASE_MIN?'disabled':''} aria-label="Meno ${EROI.NOME_STAT[k]}">−</button><b>${st[k]}</b><button class="b sm" data-a="eroipt" data-v="${k}:1" ${b.base[k]>=EROI.BASE_MAX||EROI.COSTO[b.base[k]+1]-EROI.COSTO[b.base[k]]>lib?'disabled':''} aria-label="Più ${EROI.NOME_STAT[k]}">+</button></div><small>${st[k]!==b.base[k]?'base '+b.base[k]+' · ':''}mod ${m>=0?'+':''}${m}</small></div>`}).join('')}</div>`}
  else{const e=EROI.valida(b);let h=null;if(!e)h=EROI.nuovo(b,0);
   corpo=e?`<p class="acc-msg">${esc(e)}</p>`:Eroi.schedaCorpo(h)}
  return`<div class="modal"><div class="box col eroi"><h2>Nuovo eroe</h2><div class="epassi" aria-label="Passo ${p} di ${Eroi.PASSI.length}">${Eroi.PASSI.map((n,i)=>`<span class="${i+1<p?'fatto':i+1===p?'ora':''}"><i>${i+1<p?ic('spunta',12):i+1}</i><em>${esc(n)}</em></span>`).join('')}</div>${corpo}<p class="acc-msg" role="status">${esc(Eroi.msg)}</p>
<div class="row"><button class="b sm" data-a="eroiindietro">${p===1?'Annulla':'Indietro'}</button>${ultimo?`<button class="b sm gold" data-a="eroicrea" ${Eroi.busy||EROI.valida(b)?'disabled':''}>Crea eroe</button>`:'<button class="b sm gold" data-a="eroiavanti">Avanti</button>'}</div></div></div>`},
 schedaCorpo(h){const d=EROI.derivati(h),c=EROI.CLASSI[h.classe],r=EROI.RAZZE[h.razza],eq=h.equip||{},nx=EROI.SOGLIE_XP[h.liv]||null;
  return`<div class="escheda"><div class="eritr">${Eroi.ritratto(h.aspetto,h.razza,h.classe,96)}</div><h3 style="margin:0;text-align:center">${esc(h.nome)}</h3><p class="muted" style="margin:0;text-align:center">${esc(r.nome)} · ${esc(c.nome)} · livello ${h.liv}</p>
<div class="estat">${EROI.STAT.map(k=>`<div><small>${EROI.NOME_STAT[k].slice(0,3)}</small><b>${d.stat[k]}</b><small>${EROI.mod(d.stat[k])>=0?'+':''}${EROI.mod(d.stat[k])}</small></div>`).join('')}</div>
<div class="ehp"><i style="width:${Math.round(h.hp/h.hpMax*100)}%"></i><span>${ic('cuore',14)} ${h.hp}/${h.hpMax}</span></div><div class="eder"><span>${ic('scudo',14)} CA ${d.ca}</span><span>${ic('spada',14)} +${d.attacco} · d${d.danno?d.danno.dado:0}${d.danno&&d.danno.bonus?(d.danno.bonus>=0?'+':'')+d.danno.bonus:''}</span><span>${ic('passi',14)} ${d.mov}</span><span>${ic('moneta',14)} ${h.oro}</span></div>
<p class="muted" style="margin:0"><b>Equipaggiamento:</b> ${['arma','armatura','scudo'].map(s=>eq[s]?esc(EROI.OGGETTI[eq[s]].nome):null).filter(Boolean).join(', ')||'—'}</p>
<p class="muted" style="margin:0"><b>Competenze:</b> ${d.abilita.join(', ')} · tratto «${esc(r.tratto)}»</p>
${nx?`<div class="exp"><span>Esperienza ${h.xp}/${nx}</span><span class="ebar"><i style="width:${Math.min(100,Math.round(h.xp/nx*100))}%"></i></span></div>`:'<p class="muted" style="margin:0">Livello massimo</p>'}</div>`},
 schedaH(){const h=Eroi.lista&&Eroi.lista[Eroi.sel];if(!h){Eroi.sel=null;return Eroi.listaH()}
  return`<div class="modal"><div class="box col eroi"><h2>Scheda</h2>${Eroi.schedaCorpo(h)}<p class="acc-msg" role="status">${esc(Eroi.msg)}</p>
<div class="row"><button class="b sm" data-a="eroiindietro">Indietro</button><button class="b sm" data-a="eroielimina" data-v="${esc(Eroi.sel)}">Elimina</button></div></div></div>`},
 async carica(){try{const m=await FB.eroi();for(const k of Object.keys(m))if(!EROI.coerente(m[k])){console.warn('Eroe non coerente',k);delete m[k]}Eroi.lista=m}catch(e){console.warn('Eroi',e);Eroi.lista=Eroi.lista||{};Eroi.msg='Non riesco a leggere gli eroi'}render()},
 async act(a,v){
  if(a==='eroi'){ui.eroi=true;ui.cfg=false;Eroi.msg='';Eroi.pas=0;Eroi.sel=null;render();return Eroi.carica()}
  if(a==='eroix'){ui.eroi=false;ui.cfg=true;return render()}
  if(a==='eroinuovo'){Eroi.slot=v;Eroi.bozza=Eroi.nuovaBozza();Eroi.pas=1;Eroi.msg='';return render()}
  if(a==='eroischeda'){Eroi.sel=v;Eroi.msg='';return render()}
  if(a==='eroiindietro'){Eroi.msg='';if(Eroi.pas>1)Eroi.pas--;else{Eroi.pas=0;Eroi.sel=null}return render()}
  if(a==='eroiavanti'){if(Eroi.pas===1&&!Eroi.bozza.nome.trim()){Eroi.msg='Scegli un nome.';return render()}Eroi.msg='';Eroi.pas++;return render()}
  if(a==='eroicol'){const[k,i]=v.split(':'),n=Number(i);if(!(k in EROI.ASPETTO)||!(n>=0&&n<EROI.ASPETTO[k]))return;Eroi.bozza.aspetto[k]=n;return render()}
  if(a==='eroirazza'){Eroi.bozza.razza=v;return render()}
  if(a==='eroiclasse'){Eroi.bozza.classe=v;return render()}
  if(a==='eroipt'){const[k,d]=v.split(':'),b=Eroi.bozza.base,n=b[k]+Number(d);if(n<EROI.BASE_MIN||n>EROI.BASE_MAX)return;
   if(EROI.costoBase({...b,[k]:n})>EROI.BUDGET)return;b[k]=n;return render()}
  if(a==='eroicrea'){if(Eroi.busy)return;Eroi.busy=true;Eroi.msg='';render();
   try{const h=EROI.nuovo(Eroi.bozza);await FB.salvaEroe(Eroi.slot,h);Eroi.lista={...(Eroi.lista||{}),[Eroi.slot]:h};Eroi.pas=0;Eroi.sel=Eroi.slot;say('Eroe creato: '+h.nome,2200)}
   catch(e){Eroi.msg=e&&e.code==='eroe'?e.message:e&&e.code==='permission-denied'?'Non permesso: il posto potrebbe essere occupato.':'Non riuscito, riprova tra poco.';console.warn('Eroi',e)}
   finally{Eroi.busy=false;render()}return}
  if(a==='eroielimina'){if(!confirm('Eliminare questo eroe? Non si può annullare.'))return;
   try{await FB.eliminaEroe(v);const n={...Eroi.lista};delete n[v];Eroi.lista=n;Eroi.sel=null}catch(e){Eroi.msg='Non riuscito, riprova tra poco.'}return render()}}};
document.addEventListener('input',e=>{if(e.target.id==='eroe-nome'&&Eroi.bozza)Eroi.bozza.nome=e.target.value});
