/* ---- Musica e suoni dell'Avventura (A10): il tramite tra `AAUD` (motori/28c-avv-audio.js, tutto ciò che si decide senza browser) e `Snd` (03-audio.js). ----
   Al caricamento registra le otto tracce (`Snd.def`) e i suoni a partitura (`Snd.fx`). Poi:
   · `traccia()`  → la musica di adesso, o null fuori dall'Avventura (allora vale il tema del menu): la chiede `traccia()` in 07f a ogni `render()`, il cambio avviene a fine battuta;
   · `passo(x,f)` → i suoni di un passo di battaglia, con i ritardi scalati come l'animazione (`BatAnima.passo`: saltare le animazioni salta anche i suoni);
   · `dopo(az,prima,dopo)` → i suoni di un'azione di sessione (`Ses.fai`).
   I suoni rispettano gli interruttori «Musica» e «Effetti» perché passano tutti da `Snd`. Piano: docs/AVVENTURA-A10.md. */
const AvvAudio=(()=>{
 for(const k of Object.keys(AAUD.TRACCE))Snd.def(k,AAUD.TRACCE[k]);
 for(const k of Object.keys(AAUD.SUONI))Snd.fx(k,AAUD.SUONI[k]);
 const suona=(l,f)=>{for(const s of l){const ms=s.r*(f==null?1:f);if(ms>8)setTimeout(()=>Snd.play(s.n),ms);else Snd.play(s.n)}};
 const AvvAudio={
  // la musica dell'Avventura vale per mappa, dialoghi, battaglia, zaino e fogli della sessione; la pagina Avventura e il resto dell'app restano sul tema del menu
  attiva(){return ui.screen!=='game'&&!!(ui.camp||ui.dia||ui.bat||ui.inv||ui.ses)},
  contesto(){const b=ui.bat&&Bat.s?Bat.s:null;
   if(Ses.a)return AAUD.contesto(Ses.a,b);
   if(Camp.s&&(ui.camp||ui.inv||ui.dia))return AAUD.contesto({camp:Camp.s,racc:{scena:null},bat:null,fine:null},b);   // campagna senza sessione (mappa del mondo)
   return AAUD.contesto(null,b)},
  traccia(){if(!AvvAudio.attiva())return null;try{return AAUD.traccia(AvvAudio.contesto())}catch(e){ERR.n(e);return null}},
  suona,
  passo(x,f){try{suona(AAUD.passo(x),f)}catch(e){ERR.n(e)}},
  dopo(az,prima,dopo){try{suona(AAUD.azione(az,prima,dopo))}catch(e){ERR.n(e)}}};
 return AvvAudio})();
