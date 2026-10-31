/* ---- Pannelli della campagna (Cantari di Ventura, A6.5): barra in alto, eroi, tiro del movimento, fogli (luogo, riposo, diario, mostro), sotterraneo, prove, eventi, battaglia, fine. ----
   Solo HTML da `Camp.s` / `Camp.u` (24h-campagna.js): le azioni sono `data-a="mo" data-v="verbo:argomento"`. Per sapere se un pulsante si può premere si prova l'azione su una copia
   (`Camp.prova`) e si mostra il motivo del motore: nessuna regola è ripetuta qui. Stile: css/39-campagna.css (prefisso mo-). */
const MoPan={
 KIC:{battaglia:'spada',trappola:'scintilla',evento:'diario',forziere:'borsa',riposo:'luna',boss:'teschio'},
 PASSO:{citta:'Ascolta chi comanda in città',antro:'Ripulisci l\'antro',rovina:'Esplora le rovine',torre:'Abbatti la torre'},
 STATO:{vaga:'Si aggira senza meta',caccia:'Vi sta dando la caccia',guardia:'Veglia su un villaggio assediato'},
 // ---- pezzi comuni ----
 bt(v,t,err,gold){return`<button class="b${gold?' gold':''}" data-a="mo" data-v="${v}"${err?' disabled':''}>${t}</button>`},
 riga(t,d,b,err){return`<div class="mo-sv"><span><b>${t}</b>${d?`<small>${d}</small>`:''}${err?`<small class="no">${esc(err)}</small>`:''}</span><div class="mo-sb">${b||''}</div></div>`},
 errH(){return Camp.u.msg?`<p class="mo-msg" role="status">${esc(Camp.u.msg)}</p>`:''},
 foglio(titolo,corpo,fisso,cls){const t=esc(titolo);return`<div class="mo-vela${fisso?' fisso':''}"${fisso?'':' data-a="mo" data-v="foglio:"'}></div><div class="mo-fg${cls?' '+cls:''}" role="dialog" aria-label="${t}"><div class="mo-fh"><b>${t}</b>${fisso?'':`<button class="ib" data-a="mo" data-v="foglio:" aria-label="Chiudi">${ic('x',16)}</button>`}</div><div class="mo-fl">${corpo}</div></div>`},
 // dove si trova `a` rispetto a `da`, a parole
 rosa(da,a){const d=CAMP.dist(da,a);if(!d)return'Sei qui';const[x0,y0]=MoMappa.xy(da.q,da.r),[x1,y1]=MoMappa.xy(a.q,a.r),ang=Math.atan2(x1-x0,-(y1-y0))*180/Math.PI,N=['nord','nord-est','est','sud-est','sud','sud-ovest','ovest','nord-ovest'];
  return'A '+N[Math.round(((ang%360)+360)%360/45)%8]+', a '+d+(d===1?' esagono':' esagoni')},
 effetti(f){return[f.oro?(f.oro>0?'+':'−')+Math.abs(f.oro)+' monete':'',f.pfPct?'+'+Math.round(f.pfPct*100)+'% PF':'',f.xp?'+'+f.xp+' PE':'',f.razioni?'+'+f.razioni+' razione':'',f.perdizione?'perdizione '+(f.perdizione>0?'+':'−')+Math.abs(f.perdizione):''].filter(Boolean).join(' · ')||'Nessun effetto'},
 // ---- barra in alto: giorno, monete, diario, zaino; poi la perdizione con le sue soglie ----
 topH(s){const p=s.perdizione,lv=ALUO.livelloPerdizione(p),notte=s.fase==='notte';
  return`<div class="mo-top"><button class="ib" data-a="campx" aria-label="Torna all'Avventura">${ic('x',18)}</button>
<div class="mo-tm">${ic(notte?'luna':'sole',20)}<span><b>Giorno ${s.giorno}</b><small>Giro ${s.round}/${CAMP.PARAM.giriGiorno} · ${notte?'notte':'giorno'}</small></span></div>
<span class="mo-oro" title="Monete della compagnia">${ic('moneta',16)} ${s.oro}</span>
<button class="ib" data-a="mo" data-v="foglio:diario" aria-label="Diario della missione">${ic('diario',18)}</button><button class="ib" data-a="ivapri" aria-label="Zaino e bottega">${ic('borsa',18)}</button></div>
<div class="mo-perd l${lv}" role="img" aria-label="Perdizione ${p} su 100"><i style="width:${p}%"></i>${ALUO.SOGLIE.map(x=>`<u style="left:${x}%"></u>`).join('')}<span>${ic('teschio',12)} Perdizione ${p}/100</span></div>`},
 // ---- gli eroi: tocca per scegliere chi muovere ----
 eroiH(s){const sel=Camp.eroeSel(s);
  return`<div class="mo-eroi">${s.eroi.map((e,i)=>{const ko=e.hp<=0,pc=Math.round(Math.max(0,e.hp)/e.hpMax*100),pm=ko?ic('teschio',13):e.pm==null?ic('dado',13):e.pm;
   return`<button class="mo-er${i===sel?' on':''}${ko?' ko':''}"${ko?' disabled':` data-a="mo" data-v="sel:${i}"`} aria-pressed="${i===sel}" aria-label="${esc(e.nome)}, ${Math.max(0,e.hp)} punti ferita su ${e.hpMax}${ko?', a terra':e.pm==null?', movimento da tirare':', movimento '+e.pm}">${Eroi.ritratto(e.aspetto,e.razza,e.classe,34)}<span class="mo-en"><b>${esc(e.nome)}</b><span class="mo-hp"><i style="width:${pc}%"></i></span><small>${Math.max(0,e.hp)}/${e.hpMax}</small></span><em class="mo-pm" title="Movimento">${pm}</em></button>`}).join('')}</div>`},
 // ---- il tiro del movimento e la destinazione scelta ----
 ctxH(s){const u=Camp.u;if(s.over||s.sfida||s.dentro||s.incontro||s.evento)return'';
  const i=Camp.eroeSel(s),e=s.eroi[i];if(!e||e.hp<=0)return'<div class="mo-ctx"><b>Nessuno può camminare</b></div>';
  const gr=Camp.gruppo(s),senza=gr.filter(x=>x.pm==null),qui=s.eroi.filter(x=>x.hp>0&&x.q===e.q&&x.r===e.r).length,
   ins=qui>1?`<button class="mo-chip${u.insieme?' on':''}" data-a="mo" data-v="insieme" aria-pressed="${u.insieme}">${ic('amici',14)} Insieme</button>`:'';
  if(senza.length){const t=e.pm==null;
   return`<div class="mo-ctx"><div class="mo-cr"><span><b>${t?esc(e.nome)+' non ha ancora tirato':'Manca il tiro di '+esc(senza[0].nome)}</b><small>Movimento = velocità − 2 + d4, almeno ${CAMP.PARAM.pmMin}.${e.pm==null&&e.conc>=1?' Il Vantaggio (1 Concentrazione) tira due dadi e tiene il migliore.':''}</small></span>${ins}</div>
<div class="mo-bt">${t?`<button class="b gold" data-a="mo" data-v="tira:">${ic('dado',18)} Tira d4</button>${e.conc>=1?`<button class="b" data-a="mo" data-v="tira:c" title="Tira due dadi e tieni il migliore">${ic('scintilla',16)} Vantaggio (${e.conc})</button>`:''}`:''}${senza.length>1||!t?`<button class="b${t?'':' gold'}" data-a="mo" data-v="tira:t">${ic('dado',18)} Tira per tutti</button>`:''}</div>${MoPan.errH()}</div>`}
  const pm=Math.min(...gr.map(x=>x.pm)),a=u.dest?Camp.anteprima(s):null;
  if(!a)return`<div class="mo-ctx"><div class="mo-cr"><span><b>Movimento ${pm}</b><small>Tocca la mappa per scegliere dove andare (celle dorate = a portata). Un secondo tocco conferma.</small></span>${ins}</div>${MoPan.errH()}</div>`;
  const n=Camp.num;let det,vai;
  if(a.err){det=a.err;vai=''}
  else if(a.completo){det='Costo '+n(a.costo)+' su '+n(pm)+(a.contatto?' · nemici lungo la strada!':'');vai=MoPan.bt('vai',ic('passi',18)+' Vai',false,true)}
  else if(a.n>0){det='Servono '+n(a.costo)+', hai '+n(pm)+': arrivi a '+n(a.costoFino)+' e il resto al prossimo giro.';vai=MoPan.bt('vai',ic('passi',18)+' Avanza di '+a.n,false,true)}
  else{det='Troppo lontano: il primo passo costa '+n(a.costi[0])+' e hai '+n(pm)+'.';vai=''}
  return`<div class="mo-ctx dest"><div class="mo-cr"><span><b>${esc(a.nome)}</b><small>${esc(det)}</small></span>${ins}</div><div class="mo-bt">${vai}<button class="b" data-a="mo" data-v="annulla">Annulla</button></div>${MoPan.errH()}</div>`},
 // ---- barra delle azioni ----
 barraH(s){if(s.over||s.sfida||s.incontro||s.evento)return'';
  if(s.dentro)return`<div class="mo-barra"><button class="b gold" data-a="mo" data-v="avanza">${ic('porta',18)} Avanza</button><button class="b" data-a="mo" data-v="esci">Esci</button></div>`;
  const e=s.eroi[Camp.eroeSel(s)],l=e&&CAMP.luogoDi(s,e),mer=e&&CAMP.mercanteQui(s,e);
  return`<div class="mo-barra"><button class="b" data-a="mo" data-v="foglio:luogo"${l||mer?'':' disabled'}>${ic(l?MoMappa.ICO[l.tipo]:mer?'p_mercante':'pin',18)} ${mer&&!l?'Mercante':'Luogo'}</button><button class="b" data-a="mo" data-v="foglio:riposo">${ic('letto',18)} Riposa</button><button class="b gold" data-a="mo" data-v="giro">${ic('freccia',18)} Fine giro</button></div>`},
 // ---- sopra la mappa: zoom, ultima notizia, ultimo tiro, sotterraneo ----
 sopraH(s){const u=Camp.u,ul=s.log[s.log.length-1];let h='';
  if(!s.dentro)h+=`<div class="mo-zoom"><button class="ib" data-a="mo" data-v="zoom:+" aria-label="Avvicina">${ic('plus',18)}</button><button class="ib" data-a="mo" data-v="zoom:-" aria-label="Allontana">${ic('meno',18)}</button><button class="ib" data-a="mo" data-v="centra" aria-label="Centra sugli eroi">${ic('mirino',18)}</button></div>${ul?`<button class="mo-cron" data-a="mo" data-v="foglio:diario" aria-label="Apri il diario"><span>${esc(ul)}</span></button>`:''}`;
  if(u.dado){const d=u.dado,e=s.eroi[d.eroe],df=d.tot-d.tiro;h+=`<div class="mo-dado ${d.ok?'ok':'ko'}" role="status"><span class="d20">${d.tiro}</span><span>${esc(e?e.nome:'')}: ${d.tiro}${df>=0?' + ':' − '}${Math.abs(df)} = <b>${d.tot}</b> contro ${d.cd} — <b>${d.ok?'riesce':'fallisce'}</b></span></div>`}
  return h+(s.dentro?MoPan.sottH(s):'')},
 sottH(s){const l=s.luoghi[s.dentro],sott=CAMP.sottQui(s);if(!l||!sott)return'';const n=sott.stanze.length;
  const st=sott.stanze.map((x,k)=>{const fatta=k<sott.stanza,ora=k===sott.stanza;return`<span class="${fatta?'fatta':ora?'ora':''}" title="Stanza ${k+1}">${fatta?ic(MoPan.KIC[x.k]||'spunta',18):k===n-1?ic('teschio',18):'?'}</span>`}).join('');
  return`<div class="mo-sott"><div class="mo-sh">${ic(MoMappa.ICO[l.tipo]||'p_antro',24)}<span><b>${esc(l.nome)}</b><small>Stanza ${Math.min(sott.stanza+1,n)} di ${n} · ogni stanza costa un giro</small></span></div><div class="mo-stanze" role="img" aria-label="Stanze: ${sott.stanza} superate su ${n}">${st}</div><p class="mo-sq">${esc(s.log[s.log.length-1]||'')}</p></div>`},
 // ---- il foglio da mostrare ----
 fogliH(s){if(s.over)return MoPan.fineH(s);if(s.sfida)return MoPan.sfidaH(s);if(s.incontro)return MoPan.incontroH(s);if(s.evento)return MoPan.eventoH(s);
  const f=Camp.u.foglio;return f==='luogo'?MoPan.luogoH(s):f==='riposo'?MoPan.riposoH(s):f==='diario'?MoPan.diarioH(s):f==='mostro'?MoPan.mostroH(s):''},
 fineH(s){const o=s.over,w=o.win;return MoPan.foglio(w?'Vittoria!':'Sconfitta',`<p><b>${esc(o.reason)}</b></p><small class="muted">${w?'In '+(o.giorni||s.giorno)+' giorni.':'Giorno '+s.giorno+', perdizione '+s.perdizione+'/100.'}</small><button class="b gold" data-a="campnuova">Nuova campagna</button><button class="b" data-a="campx">Torna all'Avventura</button>`,true,w?'mo-verde':'mo-rosso')},
 sfidaH(s){const f=s.sfida,cont={};for(const id of f.nemici){const d=BEST.M[id],n=d?d.nome:'Nemico';cont[n]=(cont[n]||0)+1}
  const eroi=f.quali.map(i=>s.eroi[i]),lontani=eroi.filter(e=>(f.dist[e.slot]||0)>=2);
  return MoPan.foglio(f.sorpresa==='eroi'?'Imboscata!':'Battaglia!',`<p><b>${Object.entries(cont).map(([n,c])=>c+'× '+esc(n)).join(', ')}</b></p><small class="muted">Partecipano: ${eroi.map(e=>esc(e.nome)).join(', ')}.${lontani.length?' '+lontani.map(e=>esc(e.nome)).join(', ')+' arriv'+(lontani.length>1?'ano':'a')+' di rinforzo dopo qualche giro.':''}${f.sorpresa==='eroi'?' I nemici vi colgono di sorpresa.':''}</small><button class="b gold ecta" data-a="mo" data-v="combatti">${ic('spada',18)} Combatti</button>${MoPan.errH()}`,true,'mo-rosso')},
 incontroH(s){const i=s.incontro,L=s.eroi.map((e,n)=>[e,n]).filter(([e])=>e.hp>0&&(i.stanza||(e.q===i.q&&e.r===i.r)));
  const righe=L.map(([e,n])=>`<div class="mo-pr"><span class="mo-pn">${Eroi.ritratto(e.aspetto,e.razza,e.classe,26)}<b>${esc(e.nome)}</b></span><div>${i.ab.map(a=>{const p=Math.round(EROI.probabilita(e,a,i.cd)*100);return`<button class="b sm pr p${p>=65?'a':p>=35?'m':'b'}" data-a="mo" data-v="ris:${n}:${a}"><span>${esc(EROI.NOME_AB[a]||a)}</span><small>${p}%</small></button>`}).join('')}</div></div>`).join('');
  return MoPan.foglio(i.stanza?'Una prova':'Un imprevisto',`<p><b>${esc(i.testo)}</b></p><small class="muted">Difficoltà ${i.cd}. Scegli chi prova e con quale abilità: la percentuale è la probabilità di riuscire.</small>${righe}${i.stanza?'':`<button class="b" data-a="mo" data-v="fuggi">Fuggi (perdi PF, la perdizione cresce)</button>`}${MoPan.errH()}`,true,'mo-rosso')},
 eventoH(s){const ev=s.evento,def=ALUO.evento(ev.id);if(!def)return'';
  return MoPan.foglio('Un incontro',`<p>${esc(ev.testo)}</p>${def.scelte.map((c,k)=>{const err=Camp.prova({t:'scegli',i:k});return`<button class="mo-sc" data-a="mo" data-v="scegli:${k}"${err?' disabled':''}><b>${esc(c.t)}</b><small>${esc(MoPan.effetti(c.eff))}</small>${err?`<small class="no">${esc(err)}</small>`:''}</button>`}).join('')}${MoPan.errH()}`,true)},
 // ---- luogo: i servizi aperti qui ----
 luogoH(s){const i=Camp.eroeSel(s),e=s.eroi[i],l=CAMP.luogoDi(s,e),mer=CAMP.mercanteQui(s,e),ser=l?ALUO.servizi(l,s.giorno):[],vivi=CAMP.vivi(s),pr=ALUO.PREZZI,P=Camp.prova,qui=vivi.filter(x=>x.q===e.q&&x.r===e.r);let r='';
  if(l&&l.assedio)r+=`<p class="mo-av">${ic('spada',14)} ${esc(l.nome)} è sotto assedio: i servizi riaprono quando i nemici che lo circondano saranno sconfitti.</p>`;
  if(l&&CAMP.passoCorrente(s)===l.id&&!AMON.TIPI[l.tipo].sotterraneo)r+=MoPan.riga('Parla con chi comanda',MoPan.PASSO[l.tipo]||'',MoPan.bt('entra','Parla',P({t:'entra',eroe:i}),true),P({t:'entra',eroe:i}));
  for(const sv of ser){
   if(sv==='locanda'){const c=pr.locanda*vivi.length,err=P({t:'lungo'});r+=MoPan.riga('Locanda','Una notte intera: cura tutti e ricarica i poteri. '+c+' monete ('+pr.locanda+' a testa). Il nuovo giorno porta +'+CAMP.PARAM.alba+' perdizione.',MoPan.bt('lungo','Dormi · '+c,err),err)}
   else if(sv==='guaritore'){const c=qui.reduce((t,x)=>t+pr.guaritore(x.hp,x.hpMax),0),err=P({t:'cura',eroe:i});r+=MoPan.riga('Guaritore','Cura tutti gli eroi qui: '+c+' monete.',MoPan.bt('cura','Cura · '+c,err),err)}
   else if(sv==='tempio'){const ko=s.eroi.map((x,k)=>[x,k]).filter(([x])=>x.hp<=0);
    r+=ko.length?ko.map(([x,k])=>{const err=P({t:'rialza',eroe:k});return MoPan.riga('Tempio · '+esc(x.nome),'Rialza chi è a terra: '+pr.tempio(x.liv)+' monete.',MoPan.bt('rialza:'+k,'Rialza · '+pr.tempio(x.liv),err),err)}).join(''):MoPan.riga('Tempio','Rialza gli eroi a terra. Per ora nessuno ne ha bisogno.','')}
   else if(sv==='bottega')r+=MoPan.riga('Bottega',l.tipo==='villaggio'?'Merce comune a prezzi onesti.':'Fabbro ed emporio: armi, armature, accessori e pozioni.',`<button class="b" data-a="ivapri" data-v="fabbro">${ic('borsa',16)} Entra</button>`);
   else if(sv==='bacheca'){const tg=(l.taglie||[]).filter(t=>!t.riscossa);
    r+=MoPan.riga('Bacheca delle taglie',tg.length?'Chi sconfigge questi gruppi riscuote una ricompensa e calma un po\' il regno (−3 perdizione).':'Oggi non ci sono taglie.','')+tg.map(t=>{const m=s.mostri.find(x=>x.id===t.mostro),fatto=s.sconfitti.includes(t.mostro),err=fatto?P({t:'taglia',eroe:i,id:t.id}):'';
     return MoPan.riga(esc(m?CAMP.famiglia(m.fam)+' (liv. '+m.liv+')':'Un gruppo sconfitto'),t.ricompensa+' monete · '+(fatto?'sconfitto: riscuoti!':'ancora in giro'),fatto?MoPan.bt('taglia:'+t.id,'Riscuoti',err,true):'',err)}).join('')}
   else if(sv==='preghiera'){const e0=P({t:'prega',eroe:i,offerta:false}),e1=P({t:'prega',eroe:i,offerta:true});
    r+=MoPan.riga('Preghiera','Un momento di quiete: −'+ALUO.PREGHIERA.libera+' perdizione. Con '+pr.offerta+' monete di offerta: −'+ALUO.PREGHIERA.offerta+'. Poi il santuario tace per '+ALUO.PREGHIERA.chiusoPerGiorni+' giorni.',MoPan.bt('prega:0','Prega',e0)+MoPan.bt('prega:1','Offerta · '+pr.offerta,e1,true),e0&&e1?e0:'')}
   else if(sv==='accampamento'){const rz=vivi.reduce((t,x)=>t+x.zaino.filter(y=>y==='razione').length,0),err=P({t:'lungo'});
    r+=MoPan.riga('Accampamento','Si dorme con una razione a testa (ne servono '+vivi.length+', ne avete '+rz+'). Cura metà dei PF; di notte può arrivare un\'imboscata.',MoPan.bt('lungo','Accampati',err),err)}
   else if(sv==='sotterraneo'){const sott=s.sotterranei[l.id],err=l.ripulito?'Già ripulito':P({t:'entra',eroe:i});
    r+=MoPan.riga(l.ripulito?'Ripulito':'Sotterraneo',sott&&sott.stanza>0&&!sott.finito?'Si riprende dalla stanza '+(sott.stanza+1)+'.':'Ogni stanza costa un giro. L\'ultima è la più dura.',MoPan.bt('entra',ic('porta',16)+' Entra',err,true),l.ripulito?'':err)}}
  if(mer)r+=MoPan.riga('Mercante vagante','Merce comune: pozioni, razioni e accessori semplici.',`<button class="b" data-a="ivapri" data-v="emporio">${ic('borsa',16)} Guarda</button>`);
  if(!r)r='<p class="muted">Qui non c\'è nulla da fare.</p>';
  const reg=s.regioni&&s.regioni[s.celle[e.q+','+e.r].reg];
  return MoPan.foglio(l?l.nome:'Mercante vagante',`<small class="muted">${l?esc(CAMP.NOME_POI[l.tipo])+(reg?' · '+esc(reg.nome):''):'Si sposta lungo le strade'}</small>${r}${MoPan.errH()}`)},
 // ---- riposo: breve per ognuno, lungo per tutti ----
 riposoH(s){const pr=ALUO.PREZZI,vivi=CAMP.vivi(s),err=Camp.prova({t:'lungo'}),e=s.eroi[Camp.eroeSel(s)],l=CAMP.luogoDi(s,e);
  const b=s.eroi.map((x,k)=>{if(x.hp<=0)return'';const er=Camp.prova({t:'breve',eroe:k}),c=Math.max(1,Math.ceil(x.hpMax*ALUO.BREVE.pct));
   return MoPan.riga(esc(x.nome),'+'+c+' PF · oggi '+x.brevi+'/'+ALUO.BREVE.max+' · ricarica i poteri brevi',MoPan.bt('breve:'+k,'Riposa',er),er)}).join('');
  const lun=l&&l.tipo==='campo'?'Si dorme con una razione a testa: cura metà dei PF.':l&&(l.tipo==='citta'||l.tipo==='villaggio')?'Locanda: '+pr.locanda*vivi.length+' monete. Cura tutti.':'';
  return MoPan.foglio('Riposo',`<div class="sh2">Riposo breve</div><small class="muted">Un respiro: non si fa vicino ai nemici (${ALUO.BREVE.distanza} esagoni). Costa il resto del movimento.</small>${b}
<div class="sh2">Riposo lungo</div>${MoPan.riga('Fino all\'alba',(lun||'Serve una locanda (città, villaggio) o un accampamento.')+' Il nuovo giorno porta +'+CAMP.PARAM.alba+' perdizione.',MoPan.bt('lungo','Dormi',err,true),err)}${MoPan.errH()}`)},
 // ---- diario: missione, perdizione, cronaca ----
 diarioH(s){const m=s.missione,e=s.eroi[Camp.eroeSel(s)],lv=ALUO.livelloPerdizione(s.perdizione),nx=ALUO.SOGLIE[lv];
  const passi=m.passi.map((id,k)=>{const l=s.luoghi[id],fatto=k<m.passo,ora=k===m.passo;return`<li class="${fatto?'fatto':ora?'ora':''}">${ic(fatto?'spunta':MoMappa.ICO[l?l.tipo:'tesoro']||'bersaglio',16)}<span><b>${esc(l?l.nome:id)}</b><small>${esc(MoPan.PASSO[l?l.tipo:'']||'')}${ora&&l?' · '+MoPan.rosa(e,l):''}</small></span></li>`}).join('');
  return MoPan.foglio('Diario',`<div class="sh2">${esc(m.titolo)}</div><ul class="mo-passi">${passi}</ul><button class="b" data-a="mo" data-v="obiettivo">${ic('bersaglio',16)} Mostra sulla mappa</button>
<div class="sh2">Perdizione ${s.perdizione}/100</div><small class="muted">${esc(lv?ALUO.NOTE_SOGLIA[lv]:'Il regno è ancora tranquillo.')}${nx?' Prossima soglia: '+nx+'.':''} Sale di ${CAMP.PARAM.alba} a ogni alba; calano con santuari, taglie e covi ripuliti.</small>
<div class="sh2">Cronaca</div><div class="mo-log" role="log">${s.log.slice(-12).reverse().map(t=>`<p>${esc(t)}</p>`).join('')}</div>`)},
 // ---- un gruppo di nemici visto sulla mappa ----
 mostroH(s){const m=s.mostri.find(x=>x.id===Camp.u.mostro);if(!m)return'';const e=s.eroi[Camp.eroeSel(s)],d=CAMP.dist(e,m),n=AMOS.composizione(s,m,CAMP.vivi(s).length).nemici.length;
  return MoPan.foglio(CAMP.famiglia(m.fam),`<p><b>Livello ${Math.min(8,m.liv+ALUO.EFFETTI[ALUO.livelloPerdizione(s.perdizione)].mostri+(s.fase==='notte'?1:0))} · ${n} ${n===1?'nemico':'nemici'}</b></p><small class="muted">${MoPan.STATO[m.stato]||''}. ${d} ${d===1?'esagono':'esagoni'} da ${esc(e.nome)}. ${m.pausa>0?'Si sta riprendendo dallo scontro.':'Di notte e con più perdizione sono più forti.'}</small>`)}
};
