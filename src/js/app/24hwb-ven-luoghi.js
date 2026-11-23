/* ---- Compagnia di ventura, vista: luoghi, mercato, trattative, regno e corona. ----
   Parte di `Ven` (24hw-ventura.js): legge stato e aiutanti da `Ven._`. Nomi e HTML come prima. CSS: css/39j*-ven-*.css. */
const VenLuoghi=(()=>{
 const {CLS,D,TIPO,V,bt,faz,mio,mio2,n0,oggH,pannello,pips,riga,tu}=Ven._;
  const {num,contoH,diploH,fondaH,sovranoH,passaH,coronaH,vittoriaH}=VenRegno;   // 24hwaa-ven-regno.js

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
    const rif=VEN.prezzoMedio(s,m)||base,td=VEN.tendenza(s,l.id,m),pct=Math.round((pc/rif-1)*100),giu=pct<=-12?'bene':pct>=12?'male':'',vm=mig&&mig.v>pv+Math.max(2,pv*.1);
    const nc=Math.min(q,sc),nv=Math.min(q,ho),cc=nc?somma(m,1,nc):0,cv=nv?somma(m,-1,nv):0;
    const verd=giu==='bene'?'Conviene':giu==='male'?'Caro':'Nella media';
    return`<div class="vn-bn"><span class="vn-bi">${icMerce(m)}</span><div class="vn-bx"><b class="vn-bm">${esc(nm)}</b><small class="vn-bs">Media ${rif}${td?` <span class="vn-td ${td>0?'male':'bene'}" role="img" aria-label="${td>0?'in salita':'in discesa'} negli ultimi sette giorni">${ic(td>0?'tsu':'tgiu',12)}</span>`:''} · <span class="vn-bg ${giu}">${verd}${pct?' '+(pct>0?'+':'')+pct+'%':''}</span>${vm?' · <span class="vn-bene">altrove vendi a '+mig.v+' ('+esc(mig.n)+')</span>':''}</small></div><span class="vn-bh" aria-label="Ne hai ${ho}">${ho}</span>
     <button class="vn-wd vn-wv" data-a="ven" data-v="fai:vendi:${m}" ${ho?'':'disabled'} aria-label="Vendi ${esc(nm)}, ${nv} a ${cv} monete">${ic('meno',20)}<small>${ho?pv:'-'}</small></button><button class="vn-wd vn-wc ${giu}" data-a="ven" data-v="fai:compra:${m}" ${sc&&t.oro>=pc?'':'disabled'} aria-label="Compra ${esc(nm)}, ${nc} a ${cc} monete">${ic('plus',20)}<small>${sc?pc:'-'}</small></button></div>`}).join('');
   return pannello('Mercato di '+esc(l.nome),`<div class="vn-bq"><span>Carico <b>${VEN.carico(t)}/${VEN.caricoMax(s)}</b></span><span>Monete <b>${n0(t.oro)}</b></span></div><div class="vn-qta"><small>Quantità</small>${[1,5,20].map(x=>`<button class="vn-ch${q===x?' on':''}" data-a="ven" data-v="qta:${x}">×${x}</button>`).join('')}</div><p class="vn-leg">Il numero sotto − è quanto incassi per pezzo, quello sotto + quanto spendi. Verde: sotto la media dei mercati che conosci, conviene comprare. La freccia dice come è andato il prezzo negli ultimi sette giorni.</p><div class="vn-bc">${righe}</div>`,{chiudi:'sub:home'})}
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
  const TK=V.sub&&V.sub.slice(0,5)==='term:'?V.sub.slice(5):null;if(TK){const x=VenGente.termH(s,l,TK);if(x)return x;V.sub='home'}   // la scheda dei termini si chiude da sola quando l'offerta non c'è più
  // casa del luogo: testa con segnali, servizi a griglia, un solo ottone fisso in fondo
  const q=l.inc,cons=s.incarichi.find(x=>!x.fatto&&!x.fallito&&(x.tipo==='consegna'&&x.a===l.id||x.tipo==='reclute'&&x.da===l.id)),fer=t.tr.reduce((a,e)=>a+(e.f||0),0),ospiti=D.COMPAGNI.some(c=>s.compagni[c.id]===l.id);
  const sg=VEN.segnali(s,l.id),ha=k=>sg.some(x=>x.k===k),SGI={torneo:'coppa',incarico:'diario',compagno:'utente',unico:'star',assedio:'spada'};
  const tes=(ico,nome,v,o)=>{o=o||{};return`<button class="vn-sv" data-a="ven" data-v="${v}" ${o.no?'disabled':''} aria-label="${esc(nome+(o.s?', '+o.s:'')+(o.d?': '+o.d:''))}">${o.dot?'<i class="vn-dot"></i>':''}${ic(ico,34)}<b>${esc(nome)}</b>${o.s?`<span class="vn-ss">${esc(o.s)}</span>`:''}${o.n!=null?`<small>${o.n}</small>`:''}</button>`};
  const h=`<div class="vn-lt" style="--fz:${VEN.colFaz(s,l.faz).col}"><small>${TIPO[l.tipo]}${mio?' · tuo':''}</small>${l.faz==='neu'?'':faz(l.faz)}<span class="vn-pr" role="img" aria-label="Prosperità ${l.prosp}"><i style="width:${Math.min(100,l.prosp)}%"></i></span></div>`+
   (sg.length?`<div class="vn-sgn">${sg.map(x=>`<span>${ic(SGI[x.k],16)}${esc(x.tx)}</span>`).join('')}</div>`:'')+(l.sacc>g||l.ass?`<small class="vn-male">${l.sacc>g?'Saccheggiato':''}${l.sacc>g&&l.ass?' · ':''}${l.ass?'Sotto assedio':''}</small>`:'');
  const T=[];
  if(l.tipo==='villaggio'){T.push(tes('utente','Reclute','sub:term:recluta1',{no:!l.rec,s:l.rec?l.rec+' × '+D.INGAGGIO[1]+' m':'Nessun volontario',d:l.rec+' pronti a seguirvi, '+D.INGAGGIO[1]+' monete a testa'}));T.push(tes('amici','Tutti','sub:term:tutti',{no:!l.rec,s:l.rec?l.rec*D.INGAGGIO[1]+' m':'Nessun volontario',d:'Arruola tutti i volontari'}))}
  if(VEN.MERCATO[l.tipo])T.push(tes('borsa','Mercato','sub:mercato',{d:'Viveri e merci: compra dove abbonda, vendi dove manca'}));
  if(VEN.OSTERIA[l.tipo]||(l.tipo==='monastero'&&ospiti))T.push(tes('boccale',l.tipo==='monastero'?'Foresteria':'Taverna','sub:taverna',{dot:ha('compagno'),d:ospiti?'C\'è qualcuno che vale la pena conoscere':'Mercenari in cerca di soldo'}));
  if(l.bott&&(l.bott.length||l.unica||l.tipo==='citta'))T.push(tes(l.tipo==='citta'?'incudine':'armatura',l.tipo==='citta'?'Armaiolo':l.tipo==='porto'?'Merci':l.tipo==='monastero'?'Reliquie':'Baule','sub:armi',{dot:ha('unico'),d:l.unica?'In vetrina un pezzo unico: '+D.OGG[l.unica].nome:'Armi, armature, cavalli, cimeli; qui si vende anche il bottino'}));
  const tn=s.torneo,tnQui=l.tipo==='citta'&&tn&&tn.lid===l.id;
  if(l.tipo==='citta'){if(tnQui)T.push(tes('coppa','Torneo','fai:lizza',{dot:1,no:tn.giorno!==g,s:'Duello '+(tn.turno+1)+' di 3',d:'Scendi in lizza'}));else if(VEN.torneoOggi(s,l)){const posta=VEN.capi(s).reduce((a,c)=>a+D.TORNEO.posta*c.liv,0),usato=!!s.torneoUsato&&s.torneoUsato[l.id]===g;T.push(tes('coppa','Torneo','sub:term:torneo',{dot:1,no:usato||VEN.TU(s).oro<posta,s:usato?'Già fatto oggi':VEN.TU(s).oro<posta?'Servono '+posta+' m':posta+' m',d:'Tre duelli, iscrizione '+posta+' monete'+(usato?'; hai già partecipato oggi':'')}))}else{const nn=(7-(g+l.id)%7)%7;T.push(tes('coppa','Torneo','sub:term:torneo',{no:1,s:'Torneo '+VEN.quando(nn),d:'Il prossimo si tiene qui '+VEN.quando(nn)}))}}
  if(mura)T.push(tes('corona','Sala','sub:sala',{d:'Contratti, giuramenti, riscatti'}));
  if(mio&&mura)T.push(tes('scudo','Guarnigione','sub:guarn',{d:uom+' uomini a guardia'}));
  if(l.tipo==='porto')T.push(tes('globo','Rotte','sub:navi',{d:'Un passaggio per mare verso un altro porto'}));
  if(l.tipo==='monastero'){T.push(tes('cuore','Infermeria','sub:term:cura',{no:!fer,s:fer?fer*4+' m':'Nessun ferito',d:fer?fer+' feriti: '+fer*4+' monete di offerta':'Nessun ferito da curare'}));T.push(tes('sole','Benedizione','sub:term:benedizione',{no:l.bened>g,s:l.bened>g?'Tra '+(l.bened-g)+' giorni':'80 m',d:l.bened>g?'Già ricevuta: tornate tra qualche giorno':'Ottanta monete di offerta'}))}
  if(l.tipo==='locanda'){const nasc=s.l.some(q=>q.noto===false&&q.g.length);T.push(tes('chat','Voci','sub:term:voci',{no:!nasc,s:nasc?'25 m':'Niente di nuovo',d:nasc?'Un giro di vino (25 monete) e l\'oste racconta dove andare':'L\'oste non ha più storie da raccontare'}))}
  if(cons)T.push(tes('pin','Consegna','sub:term:consegna',{dot:1,s:cons.premio+' m',d:VEN.titoloInc(s,cons)+', '+cons.premio+' monete'}));
  if(q&&!q.preso)T.push(tes('diario','Incarico','sub:term:incarico',{dot:ha('incarico'),s:q.premio+' m · '+q.giorni+' g',d:VenGente.descInc(s,q)+'. '+q.premio+' monete, '+q.giorni+' giorni'}));
  if(!(l.tipo==='villaggio'&&!mio))T.push(tes('letto','Riposo','sub:term:riposa',{s:mio?'Gratis':VEN.costoRiposo(s,l)+' m',d:'Otto ore: metà dei feriti torna in piedi.'+(mio?'':' '+VEN.costoRiposo(s,l)+' monete.')}));
  return pannello(esc(l.nome),h+`<div class="vn-sr">${T.join('')}</div>`+(tnQui?torneoH(l):'')+`<div class="vn-fine">${bt('Riparti','fai:esci',{cls:'gold'})}</div>`,{chiudi:'fai:esci'})}
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
