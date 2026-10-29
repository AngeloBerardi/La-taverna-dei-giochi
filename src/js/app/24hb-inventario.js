/* ---- Zaino e bottega (Cantari di Ventura): equipaggiamento, zaino a griglia, confronto con ciò che indossi, negozi della città. ----
   Si apre dalla campagna (24h-campagna.js) e lavora sullo stato `Camp.s` con le azioni di CAMP.act (equipa, togli, cintura, zaino,
   usa, passa, compra, vendi). Cataloghi e regole: motori/27b-avv-oggetti.js (AOGG), 27c-avv-bottino.js (ABOT). Stile: css/39b-inventario.css. */
const Inv={
 tab:'zaino',eroe:0,sel:null,filtro:'tutti',msg:'',
 COL:{comune:'#b9ad92',rara:'#5aa0e0',epica:'#b070e0',leggendaria:'#f0b232'},
 ICO:{arma:'spada',scudo:'scudo',armatura:'armatura',acc:'anello',cons:'pozione',miss:'chiave'},
 POSTI:[['arma','Mano','arma'],['scudo','Seconda mano','scudo'],['armatura','Armatura','armatura'],['acc1','Accessorio','acc'],['acc2','Accessorio','acc']],
 FILTRI:{fabbro:[['arma','Armi'],['armatura','Armature'],['scudo','Scudi']],emporio:[['acc','Accessori'],['cons','Consumabili']]},
 inCitta:s=>s.celle[s.party.q+','+s.party.r].poi==='citta',
 dmed:d=>d?d.n*(d.dado+1)/2+d.bonus:0,
 sg:n=>(n>0?'+':'')+n,
 // l'oggetto scelto: { t:'z'|'c'|'e'|'n', k } = zaino (posizione), cintura (posizione), equipaggiato (posto), bottega (id)
 idSel(h){const q=Inv.sel;if(!q)return null;return q.t==='z'?h.zaino[+q.k]:q.t==='c'?h.cintura[+q.k]:q.t==='e'?(h.equip||{})[q.k]:q.k},
 cella(id,t,k,extra){const q=Inv.sel,on=q&&q.t===t&&String(q.k)===String(k);
  if(!id)return`<button class="iv-c vuoto${on?' sel':''}" ${extra&&extra.vuoto?`data-a="ivsel" data-v="${t}:${k}"`:'disabled'} aria-label="${esc(extra&&extra.nome||'Vuoto')}">${extra&&extra.ico?ic(extra.ico,22):''}<span>${esc(extra&&extra.nome||'')}</span></button>`;
  const it=AOGG.OGG[id];return`<button class="iv-c${on?' sel':''}" style="--rc:${Inv.COL[it.ra]}" data-a="ivsel" data-v="${t}:${k}" aria-label="${esc(it.nome)}">${ic(Inv.ICO[it.slot],26)}<span>${esc(it.nome)}</span>${extra&&extra.pr!=null?`<em>${ic('moneta',12)} ${extra.pr}</em>`:''}${extra&&extra.liv?`<u>Liv. ${it.liv}</u>`:''}</button>`},
 // numeri dell'eroe con l'equipaggiamento di adesso
 statiH(h){const d=EROI.derivati(h),dn=d.danno;
  return`<div class="eder iv-st"><span>${ic('scudo',14)} CA ${d.ca}</span><span>${ic('spada',14)} ${d.attacco>=0?'+':''}${d.attacco} · ${dn?(dn.n>1?dn.n:'')+'d'+dn.dado+(dn.bonus?Inv.sg(dn.bonus).replace('-','−'):''):'—'}</span><span>${ic('cuore',14)} ${h.hp}/${d.hpMax}</span><span>${ic('passi',14)} ${d.mov}</span></div>`},
 eroiTab(s){return`<div class="iv-er">${s.eroi.map((e,i)=>`<button class="${i===Inv.eroe?'on':''}${e.hp<=0?' ko':''}" data-a="ivero" data-v="${i}" aria-label="${esc(e.nome)}">${Eroi.ritratto(e.aspetto,e.razza,e.classe,30)}<span>${esc(e.nome)}</span></button>`).join('')}</div>`},
 zainoH(s,h){const z=h.zaino||[],c=h.cintura||[],q=h.equip||{};
  const posti=Inv.POSTI.map(([k,nome,sl])=>Inv.cella(q[k],'e',k,{vuoto:false,nome,ico:Inv.ICO[sl]})).join('');
  const cint=[0,1,2].map(i=>Inv.cella(c[i],'c',i,{nome:'Cintura',ico:'pozione'})).join('');
  const grid=Array.from({length:AOGG.MAX_ZAINO},(_,i)=>Inv.cella(z[i],'z',i,{nome:''})).join('');
  return`<div class="sh2">Indossato</div><div class="iv-eq">${posti}</div>${Inv.statiH(h)}
<div class="sh2">Cintura ${infoH('Tre consumabili a portata di mano: in battaglia si usano da qui senza frugare nello zaino.')}</div><div class="iv-cin">${cint}</div>
<div class="sh2">Zaino ${z.length}/${AOGG.MAX_ZAINO}</div><div class="iv-gr">${grid}</div>`},
 // confronto: cosa cambia indossando l'oggetto al posto di ciò che c'è
 confrontoH(h,id){const it=AOGG.OGG[id],slot=AOGG.slotPer(h,id);if(!slot)return'';
  const err=AOGG.verifica(h,id,slot);if(err)return`<p class="iv-no">${esc(err)}</p>`;
  const a=EROI.derivati(h),b=EROI.derivati(AOGG.anteprima(h,id,slot)),att=(h.equip||{})[slot];
  const righe=[['CA',a.ca,b.ca],['Attacco',a.attacco,b.attacco],['Danno medio',Inv.dmed(a.danno),Inv.dmed(b.danno)],['PF massimi',a.hpMax,b.hpMax],['Movimento',a.mov,b.mov],['Iniziativa',a.iniziativa,b.iniziativa]].filter(r=>r[1]!==r[2]);
  return`<div class="iv-cf"><small>${att?'Al posto di '+esc(AOGG.OGG[att].nome):'Posto libero'}</small>${righe.length?righe.map(([n,x,y])=>`<div><span>${n}</span><b>${x}</b><i>→</i><b class="${y>x?'su':'giu'}">${y}</b></div>`).join(''):'<div><span>Nessuna differenza nei numeri</span></div>'}</div>`},
 dettaglioH(s,h){const id=Inv.idSel(h);if(!id){Inv.sel=null;return''}
  const it=AOGG.OGG[id],q=Inv.sel,citta=Inv.inCitta(s),altri=s.eroi.map((e,i)=>[e,i]).filter(([,i])=>i!==Inv.eroe);
  const btn=(a,v,t,cls)=>`<button class="b sm ${cls||''}" data-a="${a}" ${v!=null?`data-v="${v}"`:''}>${t}</button>`;let az='';
  if(q.t==='z'){
   if(['arma','scudo','armatura','acc'].includes(it.slot)&&!AOGG.verifica(h,id,AOGG.slotPer(h,id)))az+=btn('ivequipa',null,'Equipaggia','gold');
   if(it.slot==='cons'){if((h.cintura||[]).length<AOGG.MAX_CINTURA)az+=btn('ivcintura',null,'Alla cintura');if(it.eff.cura&&h.hp>0&&h.hp<EROI.derivati(h).hpMax)az+=btn('ivusa',null,'Usa','gold')}
   az+=altri.map(([e,i])=>btn('ivpassa',i,'Passa a '+esc(e.nome))).join('');
   if(it.vend!==false)az+=citta?btn('ivvendi',null,'Vendi · '+ABOT.prezzoVendita(id)+' '+ic('moneta',12)):'';
  }else if(q.t==='c'){az+=btn('ivzaino',null,'Nello zaino');if(it.eff.cura&&h.hp>0&&h.hp<EROI.derivati(h).hpMax)az+=btn('ivusa',null,'Usa','gold')}
  else if(q.t==='e')az+=btn('ivtogli',null,'Togli');
  else{const n=ABOT.negozio(s.seed,s.giorno,Inv.tab),v=n&&n.roba.find(x=>x.id===id),res=v?ABOT.restano(s,n,v):0;
   const motivo=!v?'Non è più in vendita':res===0?'Esaurito':s.oro<it.pr?'Servono '+it.pr+' monete':(h.zaino||[]).length>=AOGG.MAX_ZAINO?'Zaino pieno':'';
   az+=motivo?`<span class="iv-no">${esc(motivo)}</span>`:btn('ivcompra',null,'Compra per '+esc(h.nome)+' · '+it.pr+' '+ic('moneta',12),'gold')}
  return`<div class="iv-dt" style="--rc:${Inv.COL[it.ra]}"><div class="iv-dh">${ic(Inv.ICO[it.slot],28)}<span><b>${esc(it.nome)}</b><small>${AOGG.RARITA[it.ra].nome}${it.liv>1?' · livello '+it.liv:''}${it.pr&&q.t!=='n'?' · vale '+ABOT.prezzoVendita(id)+' dal mercante':''}</small></span></div>
<p>${AOGG.descrivi(id).map(esc).join(' · ')}</p>${q.t!=='e'&&q.t!=='c'?Inv.confrontoH(h,id):''}<div class="iv-az">${az}</div></div>`},
 bottegaH(s,h){const tipo=Inv.tab,n=ABOT.negozio(s.seed,s.giorno,tipo),fl=Inv.FILTRI[tipo],f=Inv.filtro;
  const chips=`<div class="iv-fl"><button class="${f==='tutti'?'on':''}" data-a="ivfiltro" data-v="tutti">Tutto</button>${fl.map(([k,nm])=>`<button class="${f===k?'on':''}" data-a="ivfiltro" data-v="${k}">${nm}</button>`).join('')}</div>`;
  const voci=n.roba.filter(v=>f==='tutti'||AOGG.OGG[v.id].slot===f),fissi=voci.filter(v=>v.qta===null),spe=voci.filter(v=>v.qta!==null);
  const cel=v=>Inv.cella(v.id,'n',v.id,{pr:v.pr,liv:AOGG.OGG[v.id].liv>(h.liv||1)});
  const giorni=ABOT.GIORNI_RINNOVO-((s.giorno-1)%ABOT.GIORNI_RINNOVO);
  return`${chips}${spe.length?`<div class="sh2">Pezzi speciali ${infoH('Uno per tipo. La merce cambia ogni '+ABOT.GIORNI_RINNOVO+' giorni.')} <small class="muted">cambia tra ${giorni} giorn${giorni===1?'o':'i'}</small></div><div class="iv-gr">${spe.map(v=>ABOT.restano(s,n,v)===0?Inv.cella(null,'n',v.id,{nome:'Esaurito'}):cel(v)).join('')}</div>`:''}
<div class="sh2">Sempre in vendita</div><div class="iv-gr">${fissi.map(cel).join('')}</div>`},
 html(){const s=Camp.s;if(!s)return`<div class="modal"><div class="box col iv"><h2>Zaino</h2><p class="muted">Nessuna campagna in corso.</p><button class="b sm" data-a="ivx">Chiudi</button></div></div>`;
  if(Inv.eroe>=s.eroi.length)Inv.eroe=0;const h=s.eroi[Inv.eroe],citta=Inv.inCitta(s);if(!citta&&Inv.tab!=='zaino')Inv.tab='zaino';
  const tab=(k,t)=>`<button class="${Inv.tab===k?'on':''}" data-a="ivtab" data-v="${k}">${t}</button>`;
  return`<div class="modal"><div class="box col iv"><div class="chead"><h2>Zaino e bottega</h2><button class="b sm" data-a="ivx" aria-label="Chiudi">${ic('x',18)}</button></div>
<div class="chud"><span title="Monete comuni della compagnia">${ic('moneta',16)} ${s.oro}</span><span>${ic('sole',16)} Giorno ${s.giorno}</span></div>
${Inv.eroiTab(s)}<div class="iv-tb">${tab('zaino','Zaino')}${citta?tab('fabbro','Fabbro')+tab('emporio','Emporio'):''}</div>
${citta?'':'<small class="muted">Le botteghe si aprono in città.</small>'}
${Inv.tab==='zaino'?Inv.zainoH(s,h):Inv.bottegaH(s,h)}${Inv.dettaglioH(s,h)}<p class="acc-msg" role="status">${esc(Inv.msg)}</p></div></div>`},
 act(a,v){const s=Camp.s;
  if(a==='ivapri'){if(!s)return;ui.inv=true;Inv.sel=null;Inv.msg='';Inv.tab='zaino';if(Inv.eroe>=s.eroi.length)Inv.eroe=0;return render()}
  if(a==='ivx'){ui.camp=true;return render()}
  if(!s)return;
  if(a==='ivero'){Inv.eroe=+v;Inv.sel=null;return render()}
  if(a==='ivtab'){Inv.tab=v;Inv.sel=null;Inv.filtro='tutti';Inv.msg='';return render()}
  if(a==='ivfiltro'){Inv.filtro=v;Inv.sel=null;return render()}
  if(a==='ivsel'){const[t,k]=v.split(':'),q=Inv.sel;Inv.sel=q&&q.t===t&&String(q.k)===k?null:{t,k};Inv.msg='';return render()}
  const h=s.eroi[Inv.eroe],q=Inv.sel,id=Inv.idSel(h),e=Inv.eroe;if(!h||!q||!id)return;let r;
  if(a==='ivequipa')r=CAMP.act(s,{t:'equipa',eroe:e,id});
  else if(a==='ivtogli')r=CAMP.act(s,{t:'togli',eroe:e,slot:q.k});
  else if(a==='ivcintura')r=CAMP.act(s,{t:'cintura',eroe:e,id});
  else if(a==='ivzaino')r=CAMP.act(s,{t:'zaino',eroe:e,id});
  else if(a==='ivusa')r=CAMP.act(s,{t:'usa',eroe:e,id});
  else if(a==='ivpassa')r=CAMP.act(s,{t:'passa',eroe:e,a:+v,id});
  else if(a==='ivvendi')r=CAMP.act(s,{t:'vendi',eroe:e,id});
  else if(a==='ivcompra')r=CAMP.act(s,{t:'compra',eroe:e,tipo:Inv.tab,id});
  if(!r)return;if(r.err){Inv.msg=r.err;return render()}
  Camp.s=r.s;Camp.salva();Inv.msg=r.s.log[r.s.log.length-1]||'';if(a!=='ivcompra')Inv.sel=null;render()}
};
