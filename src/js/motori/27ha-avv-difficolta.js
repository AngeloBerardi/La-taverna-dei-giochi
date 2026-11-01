/* ---- Difficoltà dell'Avventura (A13): Racconto, Normale, Eroica (motore puro: solo una tabella e poche funzioni). ----
   Si sceglie quando si inizia la campagna e vive nello stato (`camp.diff`): chi ha un salvataggio vecchio gioca a «normale» (i numeri di prima, `migra` lo scrive).
   Le leve sono quattro, tutte lette da qui (mai numeri sparsi nei motori):
   - `gruppi`: moltiplica il budget di PE degli incontri (quanti e quanto forti sono i nemici), per i gruppi sul mondo e per gli scontri del racconto;
   - `vite` e il costo di una sconfitta (`pfRisveglio` = quota di PF con cui ci si risveglia, `oroPersa` = quota di monete perse, `perdizioneSconfitta`);
   - `perdizione`: quanto sale a ogni alba (a 100 la campagna è persa: è il ritmo del tempo);
   - `xp`: moltiplicatore dell'esperienza degli scontri (le ricompense delle missioni non cambiano).
   Misure e scelta dei numeri: `tools/avventura/campagne.js` + `docs/AVVENTURA-A13.md`. Test: `tests/test_avv_difficolta.js`. */
const ADIF=(()=>{
 const ID=['racconto','normale','eroica'];
 // Numeri scelti con 16 campagne intere per livello (`node tools/avventura/campagne.js --diff … --n 16`, compagnia g+m+c+l, bot prudente): Racconto ~90%, Normale ~55–70%, Eroica ~25% di campagne finite.
 // Il budget di PE delle tabelle (27i `D.m`) è tarato sul singolo scontro; su un capitolo di ~60 battaglie 3 vite non bastano a chi perde 1 scontro su 8, perciò il «Normale» scala i gruppi a .75.
 const D={
  racconto:{id:'racconto',nome:'Racconto',breve:'La storia prima di tutto',
   desc:'Nemici molto più deboli, 6 vite, perdizione lenta e un quarto di esperienza in più. Per chi vuole godersi il cantare.',
   gruppi:.6,vite:6,perdizione:2,xp:1.25,pfRisveglio:.75,oroPersa:.25,perdizioneSconfitta:5},
  normale:{id:'normale',nome:'Normale',breve:'La sfida pensata per il capitolo',
   desc:'4 vite, gruppi di nemici a misura di compagnia, perdizione a 3 per alba. Si vince con prudenza, cure e qualche riposo.',
   gruppi:.75,vite:4,perdizione:3,xp:1,pfRisveglio:.5,oroPersa:.5,perdizioneSconfitta:10},
  eroica:{id:'eroica',nome:'Eroica',breve:'Per chi sa giocare',
   desc:'Nemici più numerosi, 3 sole vite e il tempo che stringe (perdizione a 4 per alba). Ogni scontro conta.',
   gruppi:.85,vite:3,perdizione:4,xp:1,pfRisveglio:.5,oroPersa:.5,perdizioneSconfitta:10}};
 const valida=id=>ID.includes(id)?id:'normale';
 const di=id=>D[valida(id)];
 // moltiplicatore del budget degli incontri e dell'esperienza per una campagna/stato qualsiasi (`s.diff` o `s.camp.diff`)
 const gruppi=s=>di(s&&s.diff).gruppi,xp=s=>di(s&&s.diff).xp;
 // l'esperienza di un riepilogo di battaglia (27i `riepilogo`) scalata dalla difficoltà: ogni eroe e la quota per eroe
 function scalaXp(riep,s){const m=xp(s);if(!riep||m===1)return riep;const r=JSON.parse(JSON.stringify(riep));r.xpPerEroe=Math.round((r.xpPerEroe||0)*m);
  for(const e of r.eroi||[])e.xp=Math.round((e.xp||0)*m);return r}
 return{ID,D,valida,di,gruppi,xp,scalaXp}})();
if(typeof module!=='undefined')module.exports=ADIF;
