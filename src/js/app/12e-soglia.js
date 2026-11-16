/* Soglia: un solo caricamento all'ingresso in Taverna. Mentre arrivano la libreria 3D, la locanda e il suo primo fotogramma il ridisegno
   dell'app è sospeso e si vede un velo (legno e ottone) «Si apre la porta…»; alla fine un solo disegno e una dissolvenza di 250 ms.
   Tetto di 6 s: oltre, si entra come oggi (col falò se il 3D non c'è). Chiamata da render (07f) alla prima volta che serve la lobby 3D. */
const Soglia=(()=>{
 const MAX=6000;
 const S={attesa:false,fatto:false,velo:null,
  serve:()=>!ui.creo&&!S.fatto&&!S.attesa&&ui.lobby==='3d'&&VENDOR.gl()&&(ui.screen==='name'||(ui.screen==='room'&&ui.inroom&&!ui.glist)),
  async entra(){
   S.attesa=true;
   const v=document.createElement('div');v.className='sg-velo';v.setAttribute('role','status');
   v.innerHTML='<div class="sg-box"><b>Si apre la porta…</b><div class="sg-barra" aria-hidden="true"><i></i><i></i><i></i></div></div>';
   document.body.appendChild(v);S.velo=v;
   const lavoro=(async()=>{await Promise.all([VENDOR.load('three'),L3D.avvia()]);if(!L3D.ok())return;L3D.show(ui.screen);await L3D.pronta()})().catch(e=>ERR.n(e,'soglia'));
   await Promise.race([lavoro,new Promise(r=>setTimeout(r,MAX))]);
   S.fatto=true;S.attesa=false;S.velo=null;render.ora();
   v.classList.add('via');setTimeout(()=>v.remove(),260)}};
 return S})();
