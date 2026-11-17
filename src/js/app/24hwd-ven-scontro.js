/* ---- Compagnia di ventura, vista: incontro, esito, attesa e HUD della battaglia. ----
   Parte di `Ven` (24hw-ventura.js): legge stato e aiutanti da `Ven._`. Nomi e HTML come prima. CSS: css/39j*-ven-*.css. */
const VenScontro=(()=>{
 const {D,V,bt,faz,inS,n0,oggH,pannello,riga,tu}=Ven._;
 function incontroH(fascia){const s=V.s,inc=s.incontro;if(!inc)return'';const t=tu();
  if(inc.tipo==='parla'){const p=VEN.part(s,inc.pid[0]);if(!p)return pannello('Incontro',bt('Prosegui','scegli:lascia'),{fisso:1});
   const sg=p.k==='sig'?s.sig[p.sig]:null,tr=sg&&D.TRATTI[sg.tratto],riv=p.k==='riv';
   return pannello(esc(riv?D.RIVALE.nome.charAt(0).toUpperCase()+D.RIVALE.nome.slice(1):p.nome),`<p class="vn-p">${p.k==='car'?'I mercanti vi salutano guardinghi, la mano sulle borse.':riv?'«Guarda guarda, un collega.» '+esc(D.RIVALE.d)+' «Il mondo è grande abbastanza per due compagnie. Forse.»':tr?'Signore '+esc(tr.nome)+'. '+esc(tr.saluto):'Vi squadrano in silenzio.'} ${faz(p.faz)}</p><p class="vn-p">${VenGente.schieraH([p])}</p>${inc.voce?`<p class="vn-p vn-bene">${esc(inc.voce)}</p>`:''}
${VenLuoghi.passaH(sg)}${sg?VenGente.confH(s,sg):''}${riga('',bt('Buona strada','scegli:lascia',{cls:'gold'})+(inc.detto?'':bt('Che si dice in giro?','scegli:notizie',{no:!!sg&&VEN.confidenza(s,sg)<1}))+bt(riv?'Sfidala':'Aggredisci','scegli:aggredisci'))}`,{fisso:1})}
  if(inc.tipo==='mischia'&&!inc.pronto){const sc=s.scontri.find(x=>x.id===inc.sc);if(!sc)return pannello('Battaglia',bt('Prosegui','scegli:lascia'),{fisso:1});const A=sc.a.map(id=>VEN.part(s,id)).filter(Boolean),B=sc.b.map(id=>VEN.part(s,id)).filter(Boolean);
   return pannello('Una battaglia in corso',`<p class="vn-p">Due schiere si affrontano. Con chi state?</p>${riga(`<b>${A.map(p=>esc(p.nome)).join(', ')}</b><small>${VenGente.schieraH(A)}</small>`,bt('Con loro','scegli:a',{cls:'gold'}))}${riga(`<b>${B.map(p=>esc(p.nome)).join(', ')}</b><small>${VenGente.schieraH(B)}</small>`,bt('Con loro','scegli:b',{cls:'gold'}))}${riga('',bt('Non è affar nostro','scegli:lascia'))}`,{fisso:1})}
  if(inc.tipo==='arena'){const T=D.TORNEO,tn=s.torneo;if(!tn)return pannello('Torneo',bt('Prosegui','chiudi'),{fisso:1});const capi=VEN.capi(s),av=VEN.avversariTorneo(s,tn.lid,tn.giorno,tn.turno,capi.length),mat=VEN.premioTorneo(tn),st=capi.map(c=>VEN.statArena(c));
   return pannello(esc(T.turni[tn.turno])+' · '+esc(s.l[tn.lid].nome),`<p class="vn-p">Lo steccato è pieno di gente. Si combatte a piedi, uno contro uno${capi.length>1?' (ognuno col suo avversario: si vince o si perde insieme)':''}.</p>
${av.map((x,k)=>riga(`<b>${esc(x.nome)}</b><small>${esc(x.corredo)} · vita ${x.st.pf} · danno ${x.st.dan} · difesa ${x.st.dif}</small>`,'')).join('')}
<p class="vn-p"><small>Tu: ${capi.map((c,k)=>esc(c.nome)+' — '+esc((D.OGG[c.eq.arma]||{}).nome||'a mani nude')+', vita '+st[k].pf+', difesa '+st[k].dif).join(' · ')}.${s.ferito===VEN.giorno(s)?' <span class="vn-male">Ancora ammaccato: vita a metà fino a sera.</span>':''}</small></p>
${riga('',bt(ic('spada',16)+' Combatti','scegli:attacca',{cls:'gold'})+bt('Risolvi','scegli:auto'))}${riga('<small>Cambia arma dal capitano prima di entrare.</small>',bt(mat?'Ritirati · '+mat:'Ritirati','fai:ritira'))}`,{fisso:1,cls:'vn-inc'})}
  const{nem,all,luogo}=VEN.schieramenti(s),sito=luogo&&VEN.SITO[luogo.tipo],fn=nem.reduce((a,p)=>a+VEN.forza(p),0)+(luogo?VEN.forzaTr(luogo.g)*(VEN.MURA[luogo.tipo]?VEN.P.MURA:1):0),fa=VEN.forza(t)+all.reduce((a,p)=>a+VEN.forza(p),0),q=fa/Math.max(1,fa+fn)*100;
  const A=VEN.anteprima(s),titolo=sito?esc(luogo.nome):luogo?'Assalto a '+esc(luogo.nome):nem.map(p=>esc(p.nome)).join(', ')||'Nemici';
  const sc=A.scelte,strat=sc.filter(x=>/^strat:/.test(x.k)),norm=sc.filter(x=>!/^strat:/.test(x.k));
  const bot=x=>`<span class="vn-sc">${bt(esc(x.tx),'scegli:'+x.k,{cls:x.k==='attacca'?'gold':'',no:x.ok===false})}${x.ok===false&&x.perche?`<small class="vn-fl2">${esc(x.perche)}</small>`:infoH(esc(x.info||''))}</span>`;
  if(fascia)return pannello(titolo,`${strat.length?`<p class="vn-p"><small>Consiglio</small></p><div class="vn-sg">${strat.map(bot).join('')}</div>`:''}<div class="vn-sg">${norm.map(bot).join('')}</div>`,{fisso:1,cls:'vn-inc'});
  return pannello(titolo,`${A.avvisi.length?`<p class="vn-p vn-male vn-all">${A.avvisi.map(esc).join(' · ')}</p>`:''}<div class="vn-ff">${lato(A.noi,'Voi')}${lato(A.loro,'Loro')}</div>
${campoRiga(A)}<div class="vn-forze"><i style="width:${q.toFixed(0)}%"></i></div><small class="vn-fl"><span>Voi ${VEN.sani(t)}</span><span>${q>62?'In vantaggio':q>42?'Alla pari':q>28?'In svantaggio':'Disperata'}</span><span>Loro</span></small>
${luogo&&!sito?VenLuoghi.fasiH():''}${strat.length?`<p class="vn-p"><small>Consiglio</small></p><div class="vn-sg">${strat.map(bot).join('')}</div>`:''}<div class="vn-sg">${norm.map(bot).join('')}</div>`,{fisso:1,cls:'vn-inc'+(ui.tv?' vn-tvi':'')})}
 function lato(x,et){const n=x.stima?esc(x.stima):null,r=x.rango,rn=r&&typeof r==='object'?r.n:r,rt=r&&typeof r==='object'?r.nome:'',num=(i,v,l)=>`<span title="${l}">${ic(i,16)}<b>${n?'?':v}</b><small>${l}</small></span>`;
  return`<div class="vn-fc"><div class="vn-stend" style="--a:${x.col};--b:${x.col2}"><b>${esc((x.nome||'?').charAt(0).toUpperCase())}</b></div><small>${et}</small><h4>${esc(x.nome)}</h4>
${x.capo?`<p class="vn-cp">${esc(x.capo)}${x.indole?' · '+esc(x.indole):''}</p>`:''}${rn!=null?`<p class="vn-rg">${[0,1,2,3,4].map(i=>`<i class="${i<rn?'on':''}"></i>`).join('')} ${esc(rt||'')}</p>`:''}
${n?`<p class="vn-cp">${n}</p>`:''}<div class="vn-nn">${num('scudo',x.f,'fanti')}${num('freccia',x.t,'tiratori')}${num('passi',x.c,'cavalieri')}</div></div>`}
 function campoRiga(A){const sn=A.scena||{},T={1:'pianura',2:'bosco',3:'colline',4:'monti'},h=Math.floor(A.ora)%24,o=h<6?'notte':h<12?'mattina':h<18?'pomeriggio':'sera',M={sereno:'sereno',pioggia:'pioggia',nebbia:'nebbia',neve:'neve'};
  const v=[[null,T[sn.terreno]||'pianura'],sn.strada?['passi','strada']:null,sn.costa?['freccia','costa']:null,[null,M[sn.meteo]||sn.meteo||'sereno'],[h>=6&&h<19?'sole':'luna',o]].filter(Boolean);
  return`<p class="vn-cmp">${v.map(([i,tx])=>`<span>${i?ic(i,14):''}${esc(tx)}</span>`).join('')}</p>`}
 function esitoH(){const o=V.s.ult;if(!o)return'';const v=o.vince==='a';
  if(o.torneo){const x=o.torneo,T=D.TORNEO,s=V.s;
   return pannello(x.vinto?(x.chiuso?'Campione del torneo':'Duello vinto'):'Sconfitta in lizza',`<div class="vn-es ${v?'v':'s'}">${ic(v?'coppa':'teschio',44)}</div>
<div class="vn-griglia"><span><b>${x.premio}</b>${x.chiuso&&x.vinto?'incassate':x.vinto?'in palio':'premio'}</span><span><b>+${o.fama}</b>fama</span><span><b>+${o.xp}</b>esperienza</span></div>
<p class="vn-p ${x.vinto?'vn-bene':'vn-male'}">${x.vinto?(x.chiuso?'Il pubblico è in piedi. Il premio è tuo.':'Superato: '+esc(T.turni[x.turno+1])+' ti aspetta. Puoi ritirarti col premio maturato o rischiarlo.'):'Sei fuori dal torneo e il premio maturato è perso. Nessun uomo è caduto; fino a sera combatti a metà delle forze.'}</p>
${(o.oggetti||[]).map(id=>D.OGG[id]?oggH(D.OGG[id],'',' · nello zaino'):'').join('')}${o.livello?'<p class="vn-p vn-bene">Il capitano sale di livello: un punto abilità da spendere.</p>':''}
${riga('',bt('Avanti','chiudi',{cls:'gold'}))}`,{fisso:1,cls:'vn-inc'})}
  return pannello(v?'Vittoria':'Sconfitta',`<div class="vn-es ${v?'v':'s'}">${ic(v?'coppa':'teschio',44)}</div>
<div class="vn-griglia"><span><b>${o.morti}</b>caduti</span><span><b>${o.feriti}</b>feriti</span><span><b>${o.oro>0?'+':''}${n0(o.oro)}</b>monete</span><span><b>+${o.fama}</b>fama</span><span><b>+${o.xp}</b>esperienza</span><span><b>${o.prig}</b>prigionieri</span></div>
${o.presa!=null?`<p class="vn-p vn-bene">${esc(V.s.l[o.presa].nome)} è caduta.</p>`:''}${(o.oggetti||[]).map(id=>D.OGG[id]?oggH(D.OGG[id],'',' · nello zaino'):'').join('')}${o.livello?'<p class="vn-p vn-bene">Il capitano sale di livello: un punto abilità da spendere.</p>':''}${o.promo?'<p class="vn-p vn-bene">Alcuni uomini sono pronti a salire di rango.</p>':''}
${riga('',bt('Avanti','chiudi',{cls:'gold'}))}`,{fisso:1,cls:'vn-inc'})}
 function attesaH(){const s=V.s;if(s.prigioniero)return`<div class="vn-vela"><div><h3>In catene</h3><p>Prigioniero di ${esc(s.prigioniero.da)}. Le ore passano, in attesa di un'occasione per fuggire.</p></div></div>`;
  return`<div class="vn-vela chiaro"><div><h3>${s.assedio?'Assedio':'La compagnia riposa'}</h3><p>${s.assedio?'Si montano scale e arieti.':'Il tempo scorre.'}</p>${bt('Basta così','ferma',{cls:'gold'})}</div></div>`}
 // ---------- HUD della battaglia ----------
 function campoH(){const k=VenCampo.K,b=k.s;if(!b)return'';const O=[['carica','Carica','spada'],['tieni','Tieni','scudo'],['segui','Seguimi','passi'],['avanza','Avanti','freccia'],['arretra','Indietro','indietro']];
  const fine=V.pan==='fine'?`<div class="vn-vela"><div><h3>${b.fine&&b.fine.vince==='a'?'Il campo è vostro':'La giornata è persa'}</h3><p>${b.fine&&b.fine.vince==='a'?'Il nemico volta le spalle.':'Chi può si mette in salvo.'}</p>${bt('Avanti','fine',{cls:'gold'})}</div></div>`:'';
  return`<div class="vn-alto vn-ca"><div class="vn-barra"><b id="vn-na"></b><div class="vn-forze"><i id="vn-ba"></i></div><b id="vn-nb"></b></div>
<div class="vn-capo"><span>${ic('cuore',14)}</span><div class="vn-pfb"><i id="vn-pf"></i></div><button class="vn-ib" data-a="ven" data-v="cvel">×${k.vel}</button><button class="vn-ib ${k.pausa?'on':''}" data-a="ven" data-v="cpausa" aria-label="Pausa">${ic(k.pausa?'play':'pausa',18)}</button></div></div>
${k.pausa&&!b.fine&&b.t===0&&!(inS()&&ui.tv)?`<div class="vn-via"><p>${b.tipo==='arena'?'Tocca lo steccato per muovere il capitano, l\'avversario per attaccarlo. Qui conta solo la tua arma.':'Tocca il campo per muovere il capitano, un nemico per attaccarlo. Scegli un gruppo e dagli un ordine.'}</p>${bt(ic('spada',18)+' Via','cpausa',{cls:'gold'})}</div>`:''}
<div class="vn-basso vn-cb${b.tipo==='arena'?' vn-arena':''}"><div class="vn-gr">${[['tutti','Tutti'],['f','Fanti'],['t','Tiratori'],['c','Cavalieri']].map(([g,n])=>`<button class="vn-ch${k.gruppo===g?' on':''}" data-a="ven" data-v="cgr:${g}">${n}${g!=='tutti'?` <b id="vn-g${g}"></b><small class="vn-fm" id="vn-fm${g}">${VCAM.forme(b,'a')[g]}</small>`:''}</button>`).join('')}</div>
<div class="vn-or">${O.map(([o,n,i])=>`<button class="vn-bt" data-a="ven" data-v="cord:${o}">${ic(i,20)}<small>${n}</small></button>`).join('')}<button class="vn-bt vn-grido" id="vn-grido" data-a="ven" data-v="cgrido">${ic('megafono',20)}<small>Grido</small></button></div></div>${fine}`}
 return{incontroH,esitoH,attesaH,campoH}})();
