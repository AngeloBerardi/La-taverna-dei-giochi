/* ---- Compagnia di ventura, vista: barre, tasti, menu e carta del mondo. ----
   Parte di `Ven` (24hw-ventura.js): legge stato e aiutanti da `Ven._`. Nomi e HTML come prima. CSS: css/39j*-ven-*.css. */
const VenBarre=(()=>{
 const {D,V,bt,faz,inS,mio,pannello,riga,tu}=Ven._;
 // ---------- HUD del mondo ----------
 function altoH(){return`<div class="vn-alto"><button class="vn-ib" data-a="ven" data-v="pan:menu" aria-label="Menu">${ic('menu',20)}</button>
<div class="vn-tempo"><span id="vn-luna"></span><b id="vn-ora"></b><small id="vn-meteo"></small></div><button class="vn-ib" data-a="ven" data-v="centra" aria-label="Torna sulla compagnia">${ic('mirino',20)}</button>
<div class="vn-ris"><span title="Monete">${ic('moneta',15)}<b id="vn-oro"></b></span><span title="Uomini">${ic('amici',15)}<b id="vn-uom"></b></span><span title="Giorni di viveri">${ic('boccale',15)}<b id="vn-cibo"></b></span><span title="Morale">${ic('cuore',15)}<b id="vn-mor"></b></span><span title="Fama">${ic('star',15)}<b id="vn-fama"></b></span></div></div>`}
 function tastiH(){const s=V.s,t=tu(),att=t.ord&&t.ord.t==='aspetta',pt=mio().punti>0,prom=t.tr.some(e=>D.TR[e.t].su.length&&(e.xp||0)>=D.XP_SU[D.TR[e.t].t]);
  return`<button class="vn-bt" data-a="ven" data-v="pan:compagnia">${ic('amici',20)}<small>Compagnia</small>${prom?'<i class="vn-punto"></i>':''}</button>
<button class="vn-bt" data-a="ven" data-v="pan:capitano">${ic('utente',20)}<small>Capitano</small>${pt?'<i class="vn-punto"></i>':''}</button>
<button class="vn-bt" data-a="ven" data-v="pan:diario">${ic('diario',20)}<small>Diario</small></button>
<button class="vn-bt" data-a="ven" data-v="${att?'ferma':'campo'}">${ic(att?'play':'letto',20)}<small>${att?'Riparti':'Accampati'}</small></button>
<button class="vn-bt" data-a="ven" data-v="vel">${ic('passi',20)}<small>×${V.vel}</small></button>
<button class="vn-bt" data-a="ven" data-v="pan:carta">${ic('mappa',20)}<small>Carta</small></button>`}
 const bassoH=()=>`<div class="vn-basso">${tastiH()}</div>`;
 // V7, telefono con la TV accesa: gli stessi tasti, grandi, in due colonne, più «Luogo» quando si è in un luogo o davanti
 function ctlH(){const s=V.s,lu=s.dentro>=0||s.davanti>=0;return`<div class="vn-ctlg">${tastiH()}${lu?`<button class="vn-bt" data-a="ven" data-v="pan:luogo">${ic('p_citta',20)}<small>Luogo</small></button>`:''}</div>`}
 function cartaH(){const s=V.s,p=VEN.part(s,V.carta);if(!p||p.dentro>=0)return'';const ost=VEN.ostile(s,p,tu()),f=VEN.forza(p),mia=VEN.forza(tu()),giud=f<mia*.6?'Più debole di voi':f<mia*1.1?'Alla vostra portata':f<mia*1.7?'Più forte di voi':'Molto più forte di voi';
  const comp={f:0,t:0,c:0};for(const e of p.tr)comp[D.TR[e.t].c]+=e.n;
  return`<div class="vn-carta"><div class="vn-ct"><b>${esc(p.nome)}</b>${faz(p.faz)}<button class="vn-ib" data-a="ven" data-v="carta" aria-label="Chiudi">${ic('x',16)}</button></div>
<small>${p.k==='car'?'Carovana di mercanti':p.k==='pre'?'Predoni':'Signore in armi'} · ${VEN.uomini(p)} uomini (${comp.f} fanti, ${comp.t} tiratori, ${comp.c} cavalieri)</small><small class="${ost?'vn-male':''}">${ost?'Nemici. ':''}${giud}.</small>
<button class="b sm ${ost?'gold':''}" data-a="ven" data-v="segui:${p.id}">${ic(ost?'spada':'passi',16)} ${ost?'Dagli addosso':'Raggiungi'}</button></div>`}
 function cartaMondoH(){return pannello('Carta del mondo','<p class="vn-p">Tocca un punto per portarci lo sguardo. I luoghi nascosti compaiono quando li scopri o quando qualcuno te ne parla.</p><p class="vn-p"><b>Tornei</b>: '+VEN.tornei(V.s).slice(0,3).map(t=>esc(V.s.l[t.lid].nome)+' '+VEN.quando(t.giorni)).join(' · ')+'.</p><canvas class="vn-carta-cv" width="512" height="512" data-a="ven" data-v="cartatocco"></canvas><div class="vn-leg"><span><i style="background:#f4e9c8"></i>locande e monasteri</span><span><i style="background:#9fe0c8"></i>rovine</span><span><i style="background:#c0392b"></i>covi</span><span><i style="background:#d98a1f"></i>voi</span></div>',{cls:'vn-pcarta'})}
 function menuH(){return pannello('Compagnia di ventura',`${riga('<b>Grafica</b><small>Pixel d\'arte più grossi alleggeriscono i telefoni lenti.</small>',['alta','media','bassa'].map(q=>`<button class="vn-ch${VenArte.qual()===q?' on':''}" data-a="ven" data-v="qual:${q}">${q}</button>`).join(''))}
${inS()&&!ui.tv?riga('<b>Mappa sulla TV</b><small>La mappa va sul televisore, i telefoni diventano comandi.</small>',`<button class="vn-ch${G.tv?' on':''}" data-a="ven" data-v="tv">${G.tv?'accesa':'spenta'}</button>`):''}
${riga('<b>Regole</b><small>Come si gioca, in breve.</small>',bt('Leggi','regole'))}${inS()?riga('<b>Torna al tavolo</b><small>Chiude la partita per tutta la compagnia.</small>',bt('Chiudi','esci')):riga('<b>Salva ed esci</b><small>La partita resta su questo telefono.</small>',bt('Esci','esci',{cls:'gold'}))}`)}
 return{altoH,tastiH,bassoH,ctlH,cartaH,cartaMondoH,menuH}})();
