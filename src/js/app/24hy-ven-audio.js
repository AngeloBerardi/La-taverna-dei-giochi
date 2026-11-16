/* ---- Musica e suoni della Compagnia di ventura (V7): il tramite tra `VAUD` (motori/28n-ven-audio.js, tutto ciò che si decide senza browser) e `Snd` (03-audio.js). ----
   Al caricamento registra i quattro temi (`Snd.def`) e i suoni a partitura (`Snd.fx`), come `AvvAudio` (24hk). Poi:
   · `traccia()` → il tema di adesso (lo chiede `AvvAudio.traccia` a ogni disegno, via `Ven.traccia`);
   · `mondo(ev)`, `campo(ev)` → i suoni degli eventi del mondo e della battaglia: con la TV accesa nella stanza suonano solo sulla TV (`ascolta`);
   · `fai(verbo)`, `ordine(o)` → i suoni di ciò che fa questo telefono: sempre (la TV non fa nulla).
   `suona` applica `VAUD.PAUSA` (due suoni uguali troppo vicini: il secondo tace). Ogni errore resta qui (`ERR.n(e,'ventura-audio')`). */
const VenAudio=(()=>{
 for(const k of Object.keys(VAUD.TRACCE))Snd.def(k,VAUD.TRACCE[k]);
 for(const k of Object.keys(VAUD.SUONI))Snd.fx(k,VAUD.SUONI[k]);
 const ult={};
 const suona=l=>{const ora=performance.now();for(const x of l){const p=VAUD.PAUSA[x.n]||0;if(p&&ora-(ult[x.n]||-1e9)<p)continue;ult[x.n]=ora;if(x.r>8)setTimeout(()=>Snd.play(x.n),x.r);else Snd.play(x.n)}};
 const prova=f=>{try{f()}catch(e){ERR.n(e,'ventura-audio')}};
 // con la TV accesa nella stanza il mondo e la battaglia suonano solo sul televisore; senza TV, ogni telefono suona tutto
 const ascolta=()=>!!ui.tv||!(VenStanza.on()&&G&&G.tv);
 const VenAudio={ascolta,suona,
  traccia(){try{const V=Ven.V;return VAUD.traccia(VAUD.contesto(V.s,V.modo==='campo',!!(V.s&&VEN.notte(V.s))))}catch(e){ERR.n(e,'ventura-audio');return null}},
  mondo(ev){prova(()=>{if(ascolta())suona(VAUD.mondo(ev))})},
  campo(ev){prova(()=>{if(!ascolta())return;const k=VenCampo.K,c=k.s&&VCAM.capU(k.s,k.seat||0);suona(VAUD.campo(ev,c?c.id:null))})},
  fai(verbo){prova(()=>suona(VAUD.fai(verbo)))},
  ordine(o){prova(()=>{const V=Ven.V,c=V.s&&(VEN.capDi(V.s,VenStanza.on()?Math.max(0,VenStanza.seat()):0)||V.s.cap);suona(VAUD.ordine(o,!!(c&&VEN.statCap(c).cavallo)))})}};
 return VenAudio})();
