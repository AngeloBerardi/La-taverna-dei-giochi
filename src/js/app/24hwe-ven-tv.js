/* ---- Compagnia di ventura, vista: la TV in compagnia. ----
   Parte di `Ven` (24hw-ventura.js): legge stato e aiutanti da `Ven._`. Nomi e HTML come prima. CSS: css/39j*-ven-*.css. */
const VenTv=(()=>{
 const {V}=Ven._;
 const cronTv=s=>{const col={bene:'vn-bene',male:'vn-male',guerra:'vn-gu'};return s.log.slice(-6).reverse().map(x=>`<p class="${col[x.tipo]||''}">${esc(x.tx)}</p>`).join('')};
 function tvH(){const s=V.s;   // i numeri li scrive hudVivo (stessi id della fascia alta del telefono)
  return`<div class="vn-tvh"><b>${esc(s.nome||'Compagnia')}</b><span id="vn-ora"></span>
<span>${ic('moneta',18)} <b id="vn-oro"></b></span><span>${ic('amici',18)} <b id="vn-uom"></b></span><span>${ic('boccale',18)} <b id="vn-cibo"></b></span>${R.code?`<span class="vn-tvc">Stanza <b>${esc(R.code)}</b></span>`:''}</div>
<div class="vn-tvl"><h3>Cronaca</h3><div id="vn-tvl">${cronTv(s)}</div></div>
<div class="vn-tvk">${VEN.capi(s).map(c=>`<span>${ic('utente',18)} <b>${esc(c.nome)}</b> <small>liv. ${c.liv}</small></span>`).join('')}</div>`}
 function campoTvH(){const k=VenCampo.K,b=k.s;if(!b)return'';
  return`<div class="vn-alto vn-ca vn-tvb"><div class="vn-barra"><b id="vn-na"></b><div class="vn-forze"><i id="vn-ba"></i></div><b id="vn-nb"></b></div><span class="vn-tvt" id="vn-tvt"></span></div>`}
 // la carta dell'incontro in grande sulla TV (la fascia delle scelte resta sui telefoni)
 function incontroTvH(){return VenScontro.incontroH()}   // sulla TV la carta intera; i telefoni con la TV mostrano solo le scelte: incontroH(true)
 return{cronTv,tvH,campoTvH,incontroTvH}})();
