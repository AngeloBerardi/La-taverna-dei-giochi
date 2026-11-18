/* ---- Compagnia di ventura, vista: luoghi, mercato, trattative, regno e corona. ----
   Parte di `Ven` (24hw-ventura.js): legge stato e aiutanti da `Ven._`. Nomi e HTML come prima. CSS: css/39j*-ven-*.css. */
const VenLuoghi=(()=>{
 const {CLS,D,TIPO,V,bt,faz,mio,mio2,n0,oggH,pannello,pips,riga,tu}=Ven._;

 // Icone delle merci: due toni (ottone e legno), disegnate per questo mercato
 const O='#f0c166',L='#8a5a2b',S='#3c2614',C='#f3e6c8',R='#b0463a',VD='#6f9a3c';
 const IM={
  grano:`<path d="M16 28V9" stroke="${O}" stroke-width="2"/><g fill="${O}" stroke="${S}" stroke-width="1"><path d="M16 4l3 4-3 4-3-4z"/><path d="M16 11l5 2-2 4-4-1z"/><path d="M16 11l-5 2 2 4 4-1z"/><path d="M16 17l5 2-2 4-4-1z"/><path d="M16 17l-5 2 2 4 4-1z"/></g>`,
  carne:`<path d="M5 18c0-6 6-10 13-9 6 1 9 5 8 10-1 4-6 6-12 5-6-1-9-3-9-6z" fill="${R}" stroke="${S}" stroke-width="1.5"/><circle cx="21" cy="14" r="3" fill="${C}" stroke="${S}"/><path d="M9 16c3 1 6 0 8-3" stroke="${C}" stroke-width="1.5" fill="none"/>`,
  pesce:`<path d="M4 16c4-6 11-8 17-3l6-4v14l-6-4c-6 5-13 3-17-3z" fill="#7c95a0" stroke="${S}" stroke-width="1.5"/><circle cx="9" cy="15" r="1.4" fill="${S}"/><path d="M13 12v8M17 12v8" stroke="${C}" stroke-width="1"/>`,
  vino:`<path d="M12 3h8v5l3 5v13a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V13l3-5z" fill="#6d2a3c" stroke="${S}" stroke-width="1.5"/><rect x="12" y="2" width="8" height="3" fill="${O}" stroke="${S}"/><rect x="9" y="16" width="14" height="7" fill="${C}" stroke="${S}"/>`,
  lana:`<g fill="${C}" stroke="${S}" stroke-width="1.5"><circle cx="11" cy="13" r="5"/><circle cx="19" cy="12" r="5"/><circle cx="15" cy="19" r="6"/></g><path d="M9 25c2 2 10 2 12 0" stroke="${L}" stroke-width="2" fill="none"/>`,
  sale:`<path d="M6 12h20l-2 16H8z" fill="${C}" stroke="${S}" stroke-width="1.5"/><path d="M6 12c0-6 20-6 20 0" fill="#fff8e8" stroke="${S}" stroke-width="1.5"/><path d="M12 18l2 2 4-4" stroke="${L}" stroke-width="1.5" fill="none"/>`,
  ferro:`<path d="M3 19l4-7h18l4 7z" fill="#8d97a3" stroke="${S}" stroke-width="1.5"/><path d="M5 19h22v5H5z" fill="#5d6671" stroke="${S}" stroke-width="1.5"/><path d="M8 14h14" stroke="${C}" stroke-width="1.5"/>`,
  attrezzi:`<path d="M6 26L20 12" stroke="${L}" stroke-width="4"/><path d="M15 5l9 3-2 6-8-3z" fill="#8d97a3" stroke="${S}" stroke-width="1.5"/><path d="M5 12l5-5 3 3-5 5z" fill="${O}" stroke="${S}" stroke-width="1.2"/><path d="M12 24l8-8" stroke="${S}" stroke-width="1"/>`,
  velluto:`<path d="M4 8h24v6H4zM6 14h20v13H6z" fill="#5a2a6a" stroke="${S}" stroke-width="1.5"/><path d="M4 11h24" stroke="${O}" stroke-width="1.5"/><path d="M6 24h20" stroke="${O}" stroke-width="2"/>`,
  spezie:`<path d="M7 12h18l-1 15H8z" fill="${L}" stroke="${S}" stroke-width="1.5"/><path d="M6 12c1-5 19-5 20 0z" fill="${R}" stroke="${S}" stroke-width="1.5"/><circle cx="16" cy="19" r="3" fill="${O}" stroke="${S}"/><path d="M13 4c1 3 5 3 6 0" stroke="${VD}" stroke-width="2" fill="none"/>`};
 const icMerce=m=>`<svg class="ico-m" width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">${IM[m]||''}</svg>`;
 function truppaH(e,azioni){const T=D.TR[e.t];return riga(`<b>${esc(T.nome)}</b> ${pips(T.t)}<small>${CLS[T.c]||''} · ${e.n} uomini${e.f?' · '+e.f+' feriti':''}${T.compagno?' · compagno':''}</small>`,azioni||'')}
 function luogoH(){const s=V.s,lid=s.dentro>=0?s.dentro:s.davanti,l=s.l[lid];if(!l)return'';const t=tu(),fuori=s.davanti>=0,mio=l.faz==='tu'||l.sig===-2,g=VEN.giorno(s),sito=VEN.SITO[l.tipo],mura=VEN.MURA[l.tipo];
  const testa=`<div class="vn-lt" style="--fz:${VEN.colFaz(s,l.faz).col}"><small>${TIPO[l.tipo]} ${mio?'· tuo':''}</small>${sito||l.faz==='neu'?'':faz(l.faz)}<small>${sito?'':l.oste?'Vi accoglie '+esc(l.oste):'Prosperità '+l.prosp}${l.sacc>g?' · saccheggiato':''}${l.ass?' · sotto assedio':''}</small></div>`;
  const uom=l.g.reduce((a,e)=>a+e.n,0),giud=VEN.forzaTr(l.g)*(mura?VEN.P.MURA:1)>VEN.forza(t)*1.15?'più forti di voi':VEN.forzaTr(l.g)>VEN.forza(t)*.7?'alla vostra portata':'più deboli di voi';
  if(sito){const cb=l.boss&&D.CAPIBANDA.find(c=>c.id===l.boss),pieno=l.g.length>0;
   return pannello(esc(l.nome),testa+(l.tipo==='covo'?`<p class="vn-p">${pieno?'Una palizzata, fumo di bivacchi, sentinelle tra gli alberi. '+(cb?'Qui comanda <b>'+esc(cb.nome)+'</b>: '+esc(cb.d):''):'Cenere e pali anneriti. Qui non ruba più nessuno.'}</p>`:`<p class="vn-p">${pieno?'Pietre antiche, muschio, e orme fresche: qualcuno si è accampato tra le colonne, a guardia di ciò che resta.':'Le rovine tacciono. Non c\'è più nulla da prendere.'}</p>`)+
    (pieno?riga(`<b>${l.tipo==='covo'?'Assalto al covo':'Esplora le rovine'}</b><small>${uom} uomini, ${giud}. Chi vince si prende quel che c'è.</small>`,bt(ic('spada',16)+' Avanti','fai:assalta',{cls:'gold'})):'')+riga('',bt('Via di qui','fai:esci')),{chiudi:'fai:esci'})}
  if(fuori){const ass=s.assedio&&s.assedio.lid===l.id;return pannello(esc(l.nome),testa+`<p class="vn-p">Le porte sono sbarrate: ${esc(VEN.nomeF(s,l.faz))} vi è nemica.</p>`+
    (l.tipo==='villaggio'?riga('<b>Razzia</b><small>Monete e grano, ma il regno non dimentica.</small>',bt('Saccheggia','fai:razzia',{cls:'gold'})):mura?
     riga(`<b>Assedio</b><small>Dietro le mura ${uom} uomini, ${giud}.${ass&&!VEN.assedioStato(s).breccia?' Breccia tra '+VEN.assedioStato(s).oreBreccia+' ore.':''}</small>`,bt(ass?'In corso':'Assedia','fai:assedia',{cls:'gold',no:ass})):'')+riga('',bt('Via di qui','fai:esci')),{chiudi:'fai:esci'})}
  if(V.sub==='mercato'){const q=V.qta,altri=s.l.filter(x=>x.noto&&x.id!==l.id&&VEN.MERCATO[x.tipo]);
   const somma=(m,verso,n)=>{const c={...l,scorte:{...l.scorte}};let tot=0;for(let k=0;k<n;k++){tot+=VEN.prezzo(s,c,m,verso);c.scorte[m]=(c.scorte[m]||0)+(verso>0?-1:1)}return tot};
   let guad=0,spesa=0;
   const righe=Object.keys(D.MERCI).map(m=>{const sc=l.scorte[m]||0,pc=VEN.prezzo(s,l,m,1),pv=VEN.prezzo(s,l,m,-1),ho=t.merci[m]||0,base=D.MERCI[m].base,nm=D.MERCI[m].nome;
    let mig=null;for(const x of altri){const v=VEN.prezzo(s,x,m,-1);if(!mig||v>mig.v)mig={v,n:x.nome}}
    const pct=Math.round((pc/base-1)*100),giu=pct<=-12?'bene':pct>=12?'male':'',vm=mig&&mig.v>pv+Math.max(2,pv*.1);
    const nc=Math.min(q,sc),nv=Math.min(q,ho),cc=nc?somma(m,1,nc):0,cv=nv?somma(m,-1,nv):0;
    const verd=giu==='bene'?'Conviene':giu==='male'?'Caro':'Nella media';
    return`<div class="vn-bn"><span class="vn-bi">${icMerce(m)}</span><div class="vn-bx"><b class="vn-bm">${esc(nm)}</b><small class="vn-bs">Base ${base} · <span class="vn-bg ${giu}">${verd}${pct?' '+(pct>0?'+':'')+pct+'%':''}</span>${vm?' · <span class="vn-bene">altrove vendi a '+mig.v+' ('+esc(mig.n)+')</span>':''}</small></div><span class="vn-bh" aria-label="Ne hai ${ho}">${ho}</span>
     <button class="vn-wd vn-wv" data-a="ven" data-v="fai:vendi:${m}" ${ho?'':'disabled'} aria-label="Vendi ${esc(nm)}, ${nv} a ${cv} monete">${ic('meno',20)}<small>${ho?pv:'-'}</small></button><button class="vn-wd vn-wc ${giu}" data-a="ven" data-v="fai:compra:${m}" ${sc&&t.oro>=pc?'':'disabled'} aria-label="Compra ${esc(nm)}, ${nc} a ${cc} monete">${ic('plus',20)}<small>${sc?pc:'-'}</small></button></div>`}).join('');
   return pannello('Mercato di '+esc(l.nome),`<div class="vn-bq"><span>Carico <b>${VEN.carico(t)}/${VEN.caricoMax(s)}</b></span><span>Monete <b>${n0(t.oro)}</b></span></div><div class="vn-qta"><small>Quantità</small>${[1,5,20].map(x=>`<button class="vn-ch${q===x?' on':''}" data-a="ven" data-v="qta:${x}">×${x}</button>`).join('')}</div><p class="vn-leg">Il numero sotto − è quanto incassi per pezzo, quello sotto + quanto spendi. Verde: sotto la base, conviene comprare.</p><div class="vn-bc">${righe}</div>`,{chiudi:'sub:home'})}
  if(V.sub==='taverna'){const merc=l.merc.map(e=>truppaH(e,bt(D.INGAGGIO[D.TR[e.t].t]+' m.','fai:assolda:'+e.t,{cls:'vn-wd2'}))).join('')||'<p class="vn-p">Nessun mercenario cerca lavoro, oggi.</p>';
   const comp=D.COMPAGNI.filter(c=>s.compagni[c.id]===l.id).map(c=>riga(`<b>${esc(c.nome)}</b><small>${esc(c.d)}</small><small class="vn-bene">+2 a ${esc(D.ABIL[c.abil].nome)}, e combatte al vostro fianco.</small>`,bt(c.costo+' m.','fai:compagno:'+c.id,{cls:'vn-wd2'}))).join('');
   return pannello(l.tipo==='monastero'?'Foresteria':'Taverna',`${comp?'<div class="sh2">Gente fuori dal comune</div>'+comp:''}${l.tipo==='monastero'?'':'<div class="sh2">Gente di ventura</div>'+merc}`,{chiudi:'sub:home'})}
  if(V.sub==='armi'){const un=l.unica&&D.OGG[l.unica],c=mio2(),ora=o=>{const x=o.slot==='cimelio'?null:D.OGG[c.eq[o.slot]];return x?` · ora porti: ${esc(x.nome)}`:''};
   const vend=l.bott.map(id=>{const o=D.OGG[id];return oggH(o,bt(VEN.prezzoOgg(s,o,1)+' m.','fai:compraogg:'+id,{cls:'vn-wd2'}),ora(o))}).join('')||'<p class="vn-p">Scaffali vuoti: torna tra qualche giorno.</p>';
   const mia=t.zaino.map((id,i)=>{const o=D.OGG[id];return o?oggH(o,bt('Vendi '+VEN.prezzoOgg(s,o,-1),'fai:vendiogg:'+i)):''}).join('');
   return pannello(l.tipo==='monastero'?'Reliquie e rimedi':l.tipo==='locanda'?'Il baule dell\'oste':l.tipo==='porto'?'Merci d\'oltremare':'Armaiolo',`${un?'<div class="sh2">Offerta unica della capitale</div>'+oggH(un,bt(VEN.prezzoOgg(s,un,1)+' m.','fai:compraogg:'+un.id,{cls:'vn-wd2'}),ora(un)):''}<div class="sh2">In vendita</div>${vend}${mia?'<div class="sh2">Dal tuo zaino</div>'+mia:''}`,{chiudi:'sub:home'})}
  if(V.sub==='navi'){const porti=s.l.filter(x=>x.tipo==='porto'&&x.id!==l.id),oro=40+VEN.uomini(t)*3;
   return pannello('Imbarco',`<p class="vn-p">Un passaggio per tutta la compagnia: ${oro} monete. Per mare si arriva prima, e i predoni restano a terra.</p>`+porti.map(x=>riga(`<b>${esc(x.nome)}</b> ${faz(x.faz)}<small>${Math.round(VEN.dist(l,x))} leghe${VEN.nemiche(s,'tu',x.faz)?' · porto nemico':''}</small>`,bt('Salpa','fai:imbarca:'+x.id,{cls:'gold',no:VEN.nemiche(s,'tu',x.faz)}))).join(''),{chiudi:'sub:home'})}
  if(V.sub==='sala'){const f=l.faz,R=VEN.regni(s).includes(f),srv=s.servizio,prig=s.prig.reduce((a,e)=>a+e.n,0),sg=s.sig[l.sig],tr=sg&&D.TRATTI[sg.tratto];let h='';
   if(R){h+=`<p class="vn-p">${esc(VEN.rg(s,f).nome)}, retto da ${esc(VEN.rg(s,f).re)}. Amicizia: ${s.rel[f]}.</p>${sg?`<p class="vn-p">Qui siede <b>${esc(sg.nome)}</b>, signore ${esc(tr.nome)}. ${esc(tr.saluto)}</p>`:''}`;
    if(!srv&&!s.corona)h+=riga(`<b>Contratto di ventura</b><small>Quattro settimane di soldo; i loro nemici diventano i vostri. Fama ${VEN.P.FAMA_CONTRATTO}.</small>`,bt('Firma','fai:contratto',{cls:'vn-wd2'}));
    if((!srv||srv.tipo==='mer')&&!s.corona)h+=riga(`<b>Giuramento</b><small>Vassallo del regno, con un villaggio in feudo. Fama ${VEN.P.FAMA_VASSALLO}, amicizia 10.</small>`,bt('Giura','fai:giura'));
    if(srv&&srv.faz===f)h+=riga(`<b>Sciogli il legame</b><small>Servi ${esc(VEN.rg(s,f).breve)} come ${srv.tipo==='vas'?'vassallo':'mercenario'}.</small>`,bt('Lascia','fai:lascia'))}
   if(R&&l.tipo==='citta'&&srv&&srv.faz===f)h+=diploH(f,srv);
   if(R&&l.tipo==='citta'&&s.corona&&!srv)h+=sovranoH(f);
   if(mio&&mura&&!s.corona&&!srv)h+=fondaH(l);
   if(mio&&mura&&s.corona)h+=riga(`<b>${esc(s.corona.nome)}</b><small>Malcontento ${s.corona.malc}/100 · feudi, signori e rapporti coi regni.</small>`,bt('Il regno','pan:corona',{cls:'gold'}));
   for(const k of VEN.regni(s))if(s.corona?VEN.inGuerra(s,'tu',k):s.rel[k]<=-25)h+=riga(`<b>Pace con ${esc(VEN.rg(s,k).breve)}</b><small>Un tributo mette fine all'inimicizia (${s.rel[k]}).</small>`,bt('Tratta','fai:pace:'+k));
   h+=riga(`<b>Riscatti</b><small>${prig?prig+' prigionieri da cedere':'Nessun prigioniero'}</small>`,bt('Incassa','fai:riscatta',{cls:'vn-wd2',no:!prig}));return pannello('Sala del signore',h,{chiudi:'sub:home'})}
  if(V.sub==='guarn'){return pannello('Guarnigione',`<div class="sh2">Dentro le mura</div>${l.g.map(e=>truppaH(e,bt('Riprendi','fai:guarnigione:'+e.t+':-1'))).join('')||'<p class="vn-p">Nessuno.</p>'}<div class="sh2">Con te</div>${t.tr.filter(e=>!D.TR[e.t].compagno).map(e=>truppaH(e,bt('Lascia','fai:guarnigione:'+e.t+':1'))).join('')}`,{chiudi:'sub:home'})}
  // casa del luogo: testa con segnali, servizi a griglia, un solo ottone fisso in fondo
  const q=l.inc,cons=s.incarichi.find(x=>!x.fatto&&!x.fallito&&(x.tipo==='consegna'&&x.a===l.id||x.tipo==='reclute'&&x.da===l.id)),fer=t.tr.reduce((a,e)=>a+(e.f||0),0),ospiti=D.COMPAGNI.some(c=>s.compagni[c.id]===l.id);
  const sg=VEN.segnali(s,l.id),ha=k=>sg.some(x=>x.k===k),SGI={torneo:'coppa',incarico:'diario',compagno:'utente',unico:'star',assedio:'spada'};
  const tes=(ico,nome,v,o)=>{o=o||{};return`<button class="vn-sv" data-a="ven" data-v="${v}" ${o.no?'disabled':''} aria-label="${esc(nome+(o.d?': '+o.d:''))}">${o.dot?'<i class="vn-dot"></i>':''}${ic(ico,34)}<b>${esc(nome)}</b>${o.n!=null?`<small>${o.n}</small>`:''}</button>`};
  const h=`<div class="vn-lt" style="--fz:${VEN.colFaz(s,l.faz).col}"><small>${TIPO[l.tipo]}${mio?' · tuo':''}</small>${l.faz==='neu'?'':faz(l.faz)}<span class="vn-pr" role="img" aria-label="Prosperità ${l.prosp}"><i style="width:${Math.min(100,l.prosp)}%"></i></span></div>`+
   (sg.length?`<div class="vn-sgn">${sg.map(x=>`<span>${ic(SGI[x.k],16)}${esc(x.tx)}</span>`).join('')}</div>`:'')+(l.sacc>g||l.ass?`<small class="vn-male">${l.sacc>g?'Saccheggiato':''}${l.sacc>g&&l.ass?' · ':''}${l.ass?'Sotto assedio':''}</small>`:'');
  const T=[];
  if(l.tipo==='villaggio'){T.push(tes('utente','Reclute','fai:recluta:1',{no:!l.rec,n:l.rec,d:l.rec+' pronti a seguirvi, '+D.INGAGGIO[1]+' monete a testa'}));T.push(tes('amici','Tutti','fai:recluta:'+l.rec,{no:!l.rec,d:'Arruola tutti i volontari'}))}
  if(VEN.MERCATO[l.tipo])T.push(tes('borsa','Mercato','sub:mercato',{d:'Viveri e merci: compra dove abbonda, vendi dove manca'}));
  if(VEN.OSTERIA[l.tipo]||(l.tipo==='monastero'&&ospiti))T.push(tes('boccale',l.tipo==='monastero'?'Foresteria':'Taverna','sub:taverna',{dot:ha('compagno'),d:ospiti?'C\'è qualcuno che vale la pena conoscere':'Mercenari in cerca di soldo'}));
  if(l.bott&&(l.bott.length||l.unica||l.tipo==='citta'))T.push(tes('armatura',l.tipo==='citta'?'Armaiolo':l.tipo==='porto'?'Merci':l.tipo==='monastero'?'Reliquie':'Baule','sub:armi',{dot:ha('unico'),d:l.unica?'In vetrina un pezzo unico: '+D.OGG[l.unica].nome:'Armi, armature, cavalli, cimeli; qui si vende anche il bottino'}));
  const tn=s.torneo,tnQui=l.tipo==='citta'&&tn&&tn.lid===l.id;
  if(l.tipo==='citta'){if(tnQui)T.push(tes('coppa','Torneo','fai:lizza',{dot:1,no:tn.giorno!==g,d:'Scendi in lizza'}));else if(VEN.torneoOggi(s,l)){const posta=VEN.capi(s).reduce((a,c)=>a+D.TORNEO.posta*c.liv,0),usato=!!s.torneoUsato&&s.torneoUsato[l.id]===g;T.push(tes('coppa','Torneo','fai:torneo',{dot:1,no:usato||VEN.TU(s).oro<posta,n:posta,d:'Tre duelli, iscrizione '+posta+' monete'+(usato?'; hai già partecipato oggi':'')}))}else T.push(tes('coppa','Torneo','fai:torneo',{no:1,d:'Il prossimo si tiene qui '+VEN.quando((7-(g+l.id)%7)%7)}))}
  if(mura)T.push(tes('corona','Sala','sub:sala',{d:'Contratti, giuramenti, riscatti'}));
  if(mio&&mura)T.push(tes('scudo','Guarnigione','sub:guarn',{d:uom+' uomini a guardia'}));
  if(l.tipo==='porto')T.push(tes('globo','Rotte','sub:navi',{d:'Un passaggio per mare verso un altro porto'}));
  if(l.tipo==='monastero'){T.push(tes('cuore','Infermeria','fai:cura',{no:!fer,n:fer||null,d:fer?fer+' feriti: '+fer*4+' monete di offerta':'Nessun ferito da curare'}));T.push(tes('sole','Benedizione','fai:benedizione',{no:l.bened>g,d:l.bened>g?'Già ricevuta: tornate tra qualche giorno':'Ottanta monete di offerta'}))}
  if(l.tipo==='locanda')T.push(tes('chat','Voci','fai:voci',{d:'Un giro di vino (25 monete) e l\'oste racconta dove andare'}));
  if(cons)T.push(tes('pin','Consegna','fai:consegna',{dot:1,d:VEN.titoloInc(s,cons)+', '+cons.premio+' monete'}));
  if(q&&!q.preso)T.push(tes('diario','Incarico','fai:incarico',{dot:ha('incarico'),d:(q.tipo==='predoni'?'Una banda infesta i dintorni':q.tipo==='consegna'?'Portate '+q.n+' di '+D.MERCI[q.bene].nome+' a '+s.l[q.a].nome:q.tipo==='reliquia'?'Liberate le rovine di '+s.l[q.a].nome:q.tipo==='taglia'?'Una taglia su '+s.l[q.a].nome:'Servono '+q.n+' soldati addestrati')+'. '+q.premio+' monete, '+q.giorni+' giorni'}));
  if(!(l.tipo==='villaggio'&&!mio))T.push(tes('letto','Riposo','fai:riposa',{d:'Otto ore: metà dei feriti torna in piedi.'+(mio?'':' '+Math.ceil(VEN.uomini(t)*(l.tipo==='locanda'||l.tipo==='monastero'?1:1.5))+' monete.')}));
  return pannello(esc(l.nome),h+`<div class="vn-sr">${T.join('')}</div>`+(tnQui?torneoH(l):'')+`<div class="vn-fine">${bt('Riparti','fai:esci',{cls:'gold'})}</div>`,{chiudi:'fai:esci'})}
 // la parola presso il re (V3): per ogni regno la proposta possibile, con i fattori a favore e contro e il totale che decide (serve ≥ 0)
 // il conto di una trattativa (re o signore): fattori a favore e contro, totale e verdetto
 const num=v=>(v>0?'+':'−')+Math.abs(v).toFixed(1).replace('.',',');
 function contoH(p,chi){const pro=p.f.filter(x=>x.v>0),con=p.f.filter(x=>x.v<0),el=l=>l.map(x=>esc(x.n)+' '+num(x.v)).join(', ')||'nessuno';
  return`<small class="vn-bene">A favore: ${el(pro)}</small><small class="vn-male">Contro: ${el(con)}</small><small>Totale ${num(p.tot)}: ${chi||'il re'} accetta da 0 in su${p.ok?'. Accetterebbe.':'. Rifiuterebbe.'}</small>`}
 function diploH(f,srv){const s=V.s,g=VEN.giorno(s),vas=srv.tipo==='vas';
  const att=s.parola&&s.parola[f]>g;   // ha appena deciso su tua parola: si vedono le alleanze, ma niente proposte fino al giorno indicato
  const h=[],conto=contoH;
  const riga1=(titolo,nota,tipo,k,lab,cls)=>{const p=VEN.proposta(s,tipo,f,k);return p.err?'':riga(`<b>${titolo}</b><small>${nota}</small>${tipo==='rompi'?'':conto(p)}`,bt(lab,'fai:proponi:'+tipo+':'+k,cls?{cls}:null))};
  for(const k of VEN.regni(s)){if(k===f||s.cadute[k])continue;const nome=esc(VEN.rg(s,k).breve);
   if(VEN.inGuerra(s,f,k))h.push(riga1('Proponi pace con '+nome,'In guerra con '+nome+'. '+(vas?'Parli da vassallo.':'Da mercenario puoi chiedere solo la pace.'),'pace',k,'Proponi','gold'));
   else if(VEN.alleate(s,f,k)){const al=s.alleanza[[f,k].sort().join('|')];h.push(vas?riga(`<b>Alleati di ${nome}</b><small>${al.rompe?'Rottura annunciata: finisce il giorno '+al.rompe+'.':'Dal giorno '+al.da+'; dura almeno '+D.DIPL.MIN+' giorni e si rompe con '+D.DIPL.PREAVVISO+' di preavviso.'}</small>`,al.rompe||att?'':bt('Rompi','fai:proponi:rompi:'+k)):riga(`<b>Alleati di ${nome}</b><small>Dal giorno ${al.da}.</small>`))}
   else if(vas){h.push(riga1('Proponi alleanza con '+nome,'Si combatte insieme e ci si soccorre negli assedi. Un solo alleato per regno.','alleanza',k,'Proponi','gold'));h.push(riga1('Chiedi guerra a '+nome,'Il re muoverà le sue bandiere; '+nome+' non lo dimenticherà.','guerra',k,'Chiedi'))}}
  return`<div class="sh2">Diplomazia</div>`+(att?`<p class="vn-p">${esc(VEN.rg(s,f).re)} ha appena deciso su tua parola: ti riceverà di nuovo il giorno ${s.parola[f]}.</p>`:'')+(h.join('')||(att?'':'<p class="vn-p">Nessuna trattativa possibile, per ora.</p>'))}
 function fondaH(l){const s=V.s,R=D.REGNO,t=tu();if(l.tipo!=='citta'&&l.tipo!=='castello')return'';
  return riga(`<b>Fonda un regno</b><small>Serve fama ${R.FAMA} (hai ${s.fama}) e ${n0(R.ORO)} monete (hai ${n0(t.oro)}). Qui sarà la sede; i regni vicini reagiranno entro ${R.GUERRA_ENTRO} giorni.</small><input id="vn-regno-nome" class="vn-in" maxlength="24" placeholder="Nome del regno" value="${esc(V.nomeRegno||'')}"><div class="vn-stend">${R.STENDARDI.map((x,i)=>`<button class="vn-sd${(V.stend|0)===i?' on':''}" style="--a:${x.col};--b:${x.col2}" data-a="ven" data-v="stend:${i}" aria-label="${esc(x.nome)}"></button>`).join('')}</div>`,bt('Fonda','fai:fonda',{cls:'gold',no:s.fama<R.FAMA||t.oro<R.ORO}))}
 // nella capitale di un re, da sovrano: pace e alleanza passano dal conto, la guerra la dichiari tu
 function sovranoH(f){const s=V.s,g=VEN.giorno(s),att=s.parola&&s.parola[f]>g,nome=esc(VEN.nomeF(s,f)),guerra=VEN.inGuerra(s,'tu',f),al=VEN.alleate(s,'tu',f),h=[];
  const prop=(tit,nota,tipo,lab)=>{const p=VEN.proposta(s,tipo,f,'tu');return p.err?'':riga(`<b>${tit}</b><small>${nota}</small>${contoH(p)}`,bt(lab,'fai:proponi:'+tipo+':tu',{cls:'gold'}))};
  if(guerra)h.push(prop('Proponi pace a '+nome,'Siete in guerra. Parli da sovrano.','pace','Proponi'));
  else if(al){const a=s.alleanza[['tu',f].sort().join('|')];h.push(riga(`<b>Alleati di ${nome}</b><small>${a.rompe?'Rottura annunciata: finisce il giorno '+a.rompe+'.':'Dal giorno '+a.da+'; dura almeno '+D.DIPL.MIN+' giorni e si rompe con '+D.DIPL.PREAVVISO+' di preavviso.'}</small>`,a.rompe?'':bt('Rompi','fai:rompi:'+f)))}
  else{h.push(prop('Proponi alleanza a '+nome,'Si combatte insieme e ci si soccorre negli assedi. Un solo alleato per regno.','alleanza','Proponi'));h.push(riga(`<b>Dichiara guerra a ${nome}</b><small>Le tue bandiere si muoveranno contro di lui.</small>`,bt('Dichiara','fai:dichiara:'+f)))}
  return`<div class="sh2">Diplomazia del regno</div>`+(att?`<p class="vn-p">${esc(VEN.rg(s,f).re)} ha appena deciso su tua parola: ti riceverà di nuovo il giorno ${s.parola[f]}.</p>`:'')+h.join('')}
 // un signore di un altro regno, o senza patria, può giurarti fedeltà in cambio di un feudo: il conto è in chiaro per ogni luogo che puoi offrire
 function passaH(sg){const s=V.s;if(!s.corona||!sg||sg.faz==='tu'||sg.re)return'';
  const ten=s.l.filter(l=>l.faz==='tu'&&l.sig<0&&l.id!==s.corona.sede&&!(l.capo>=0&&!VEN.MURA[l.tipo]&&s.l[l.capo].faz==='tu')).sort((a,b)=>VEN.renditaL(b)-VEN.renditaL(a)).slice(0,4);
  if(!ten.length)return`<div class="sh2">Giuramento</div><p class="vn-p">Non hai un luogo da dargli in feudo.</p>`;
  return`<div class="sh2">Giuramento</div>${sg.faz==='neu'?'<p class="vn-p">Senza terra né bandiera: ascolterebbe.</p>':''}`+ten.map(l=>{const p=VEN.lealta(s,sg.id,l.id);return p.err?'':riga(`<b>${esc(l.nome)} in feudo</b><small>${TIPO[l.tipo]} · rende ${VEN.renditaL(l)}</small>${contoH(p,'Il signore')}`,bt('Offri','scegli:passa:'+l.id,p.ok?{cls:'gold'}:null))}).join('')}
 function coronaH(){const s=V.s,c=s.corona;
  if(!c)return pannello('Il regno',`<p class="vn-p">Non hai un regno. Dalla sala di una tua città o di un tuo castello puoi fonderlo, con fama ${D.REGNO.FAMA} e ${n0(D.REGNO.ORO)} monete.</p>`);
  const R=D.REGNO,t=tu(),col=VEN.colFaz(s,'tu'),ten=s.l.filter(l=>l.faz==='tu'&&l.sig<0),sigs=s.sig.filter(x=>x.faz==='tu'),radice=l=>!(l.capo>=0&&!VEN.MURA[l.tipo]&&s.l[l.capo].faz==='tu'),nf=x=>s.l.filter(m=>m.faz==='tu'&&m.sig===x.id).length;
  if(V.sub.startsWith('feudo:')){const l=s.l[+V.sub.slice(6)];if(!l)return'';
   return pannello('Feudo: '+esc(l.nome),`<p class="vn-p">${TIPO[l.tipo]} · rende ${VEN.renditaL(l)} ogni sette giorni; al signore va un settimo al giorno.</p>`+(l.sig>=0?riga('<b>Tienilo tu</b><small>Torna a te. Un signore senza più feudi va in esilio.</small>',bt('Riprendi','fai:feudo:'+l.id+':-2')):'')+(sigs.filter(x=>x.id!==l.sig).map(x=>riga(`<b>${esc(x.nome)}</b><small>${esc((D.TRATTI[x.tratto]||{}).nome||'')} · ${nf(x)} feudi</small>`,bt('Daglielo','fai:feudo:'+l.id+':'+x.id,{cls:'gold'}))).join('')||'<p class="vn-p">Non hai signori a cui darlo: convincine qualcuno quando li incontri.</p>'),{chiudi:'sub:home'})}
  if(V.sub.startsWith('inv:')){const id=V.sub.slice(4),T=D.TR[id];if(!T)return'';
   return pannello('Investi '+esc(T.nome),`<p class="vn-p">Diventa signore di un tuo luogo con settanta punti di truppe sue. Non sarà più nella compagnia.</p>`+(ten.filter(l=>l.id!==c.sede&&radice(l)).map(l=>riga(`<b>${esc(l.nome)}</b><small>${TIPO[l.tipo]} · rende ${VEN.renditaL(l)}</small>`,bt('Investi','fai:investi:'+id+':'+l.id,{cls:'gold'}))).join('')||'<p class="vn-p">Nessun luogo tenuto da dargli.</p>'),{chiudi:'sub:home'})}
  const rap=VEN.regni(s).filter(f=>!s.cadute[f]).map(f=>{const gu=VEN.inGuerra(s,'tu',f),al=VEN.alleate(s,'tu',f),m=c.minacce[f],a=al&&s.alleanza[['tu',f].sort().join('|')];
   return riga(`${faz(f)}<small class="${gu?'vn-male':al?'vn-bene':''}">${gu?'In guerra':al?(a.rompe?'Alleati · rottura il giorno '+a.rompe:'Alleati dal giorno '+a.da):'In pace'}${m&&!gu&&!al?' · guerra attesa entro il giorno '+m:''} · amicizia ${s.rel[f]}</small>`,gu?'':al?(a.rompe?'':bt('Rompi','fai:rompi:'+f)):bt('Dichiara guerra','fai:dichiara:'+f))}).join('');
  const feudi=s.l.filter(l=>l.faz==='tu'&&l.id!==c.sede&&radice(l)).map(l=>riga(`<b>${esc(l.nome)}</b><small>${TIPO[l.tipo]} · rende ${VEN.renditaL(l)} · ${l.sig>=0?'feudo di '+esc(s.sig[l.sig].nome):'tenuto da te'}</small>`,bt('Assegna','sub:feudo:'+l.id,{no:!sigs.length&&l.sig<0}))).join('');
  const comp=t.tr.filter(e=>D.TR[e.t].compagno&&e.n>0).map(e=>riga(`<b>${esc(D.TR[e.t].nome)}</b><small>Compagno: può governare un tuo luogo.</small>`,bt('Investi','sub:inv:'+e.t,{no:ten.length<2}))).join('');
  return pannello(esc(c.nome),`<div class="vn-stdr" style="--a:${col.col};--b:${col.col2}"></div><p class="vn-p">Sede: ${esc(s.l[c.sede].nome)} · fondato il giorno ${c.da} · ${ten.length} luoghi tenuti (oltre ${R.TENUTI} cresce il malcontento) · rendite ${VEN.rendite(s)} ogni sette giorni.</p>
<p class="vn-p">Malcontento ${c.malc}/100${c.malc>=60?' <span class="vn-male">il morale ne soffre</span>':''}<i class="vn-malc"><b style="width:${c.malc}%"></b></i></p>
<div class="sh2">Rapporti coi regni</div>${rap}<div class="sh2">Signori</div>${sigs.map(x=>{const p=VEN.part(s,x.pid);return riga(`<b>${esc(x.nome)}</b><small>${esc((D.TRATTI[x.tratto]||{}).nome||'')} · ${p?VEN.uomini(p)+' uomini':'senza truppe'} · ${nf(x)} feudi${x.comp?' · compagno':''}</small>`,'')}).join('')||'<p class="vn-p">Nessun signore. Incontrali in campo e offri un feudo a chi non ha più terra o patria.</p>'}${sigs.length?riga('<b>Chiama a raccolta</b><small>I tuoi signori ti raggiungono e restano con te '+R.ADUNATA+' giorni.</small>',bt('Aduna','fai:aduna')):''}
<div class="sh2">Feudi</div>${feudi||'<p class="vn-p">Hai solo la sede.</p>'}${comp?'<div class="sh2">Compagni</div>'+comp:''}`)}
 function vittoriaH(){const s=V.s,v=s.vinta,c=s.corona,mie=s.l.filter(l=>l.faz==='tu'||l.sig===-2).length,tr=VEN.traguardi(s).filter(x=>x[1]).length;
  return pannello(v.come==='re'?'Le terre sono unite':'Il tuo re ha vinto',`<p class="vn-p">${v.come==='re'?'Tutte le capitali sono tue: <b>'+esc(c?c.nome:s.nome)+'</b> regna sull\'intero mondo dal giorno '+v.g+'.':'Il tuo sovrano tiene tutte le capitali dal giorno '+v.g+': le terre sono unite sotto di lui.'}</p>
<p class="vn-p">Giorno ${VEN.giorno(s)} · ${mie} luoghi tuoi · ${VEN.uomini(tu())} uomini · fama ${s.fama} · ${s.stat.vinte} battaglie vinte · ${Object.keys(s.cadute).length} regni caduti · ${tr} traguardi su ${VEN.traguardi(s).length}.</p>
<ul class="vn-tr">${VEN.traguardi(s).map(x=>`<li class="${x[1]?'ok':''}">${ic(x[1]?'spunta':'bersaglio',14)} ${esc(x[0])}</li>`).join('')}</ul>${riga('<small>La partita continua: il mondo non finisce qui.</small>',bt('Continua','chiudi',{cls:'gold'}))}`,{fisso:1,cls:'vn-vit'})}
 // il torneo della città: iscrizione, turno, avversari col loro corredo, premio maturato
 function torneoH(l){const s=V.s,t=s.torneo,T=D.TORNEO,g=VEN.giorno(s),capi=VEN.capi(s),posta=capi.reduce((a,c)=>a+T.posta*c.liv,0);
  if(t&&t.lid===l.id){const av=VEN.avversariTorneo(s,t.lid,t.giorno,t.turno,capi.length),mat=VEN.premioTorneo(t),fin=T.mol[2]*t.posta;
   return riga(`<b>Torneo · ${esc(T.turni[t.turno])}</b><small>Duello ${t.turno+1} di 3, a piedi e senza arco: conta l'arma che porti. ${av.map(x=>esc(x.nome)+' ('+esc(x.corredo)+')').join(' · ')}</small>
<small class="vn-bene">${mat?'Premio maturato '+mat+' monete.':'Nessun premio ancora.'} Vincere tutti e tre: ${fin} monete, ${T.fama[2]} fama e un oggetto di pregio.</small>`,
    bt(ic('spada',16)+' In lizza','fai:lizza',{no:t.giorno!==g})+(mat?bt('Ritirati · '+mat,'fai:ritira'):bt('Ritirati','fai:ritira')))}
  if(VEN.torneoOggi(s,l)){const usato=!!s.torneoUsato&&s.torneoUsato[l.id]===g;
   return riga(`<b>Torneo di oggi</b><small>Tre duelli: sfidante, campione, gran campione. ${capi.length>1?'Scendete in lizza tutti insieme. ':''}Iscrizione ${posta} monete; i premi sono ${T.mol.map(m=>m+'×').join(', ')} l'iscrizione.</small>${usato?'<small class="vn-male">Hai già partecipato oggi.</small>':''}`,
    bt('Iscriviti · '+posta,'fai:torneo',{cls:'gold',no:usato||VEN.TU(s).oro<posta}))}
  const n=(7-(g+l.id)%7)%7;return riga(`<b>Torneo</b><small>Il prossimo si tiene qui ${esc(VEN.quando(n))}.</small>`,'')}

 // fasi dell'assedio (V5b): scale subito, breccia dopo i giorni di preparativi, porta con l'ariete
 function fasiH(){const a=VEN.assedioStato(V.s);if(!a)return'';const P=VEN.P,oro=VEN.TU(V.s).oro;
  return riga('<b>Scale</b><small>Pronte. Si sale uno alla volta, sotto tiro.</small>','')+
   riga(`<b>Breccia</b><small>${a.breccia?'Aperta: un tratto di muro è crollato.':'Tra '+a.oreBreccia+' ore. Paghe e viveri intanto corrono.'}</small>`,a.breccia?'':bt('Aspetta','scegli:attendi'))+
   riga(`<b>Ariete</b><small>${a.ariete?'Pronto davanti alla porta.':'Pronto '+P.ARIETE_ORE+' ore dopo averlo costruito.'}</small>`,a.ariete?'':bt('Costruisci, '+P.ARIETE_ORO+' monete','scegli:ariete',{no:oro<P.ARIETE_ORO}))}
 return{truppaH,luogoH,num,contoH,diploH,fondaH,sovranoH,passaH,coronaH,vittoriaH,torneoH,fasiH}})();
