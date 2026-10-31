/* ---- Luoghi (A6.2): servizi delle città, sotterranei a stanze, eventi a scelta, santuari, taglie e soglie della perdizione (dati e regole pure). ----
   Nessuno stato proprio: ogni funzione riceve i dati che le servono e restituisce un risultato; `CAMP` (28) applica gli effetti allo stato.
   Dadi: solo `AMON.mulberry(seme)` per la generazione ripetibile (stanze, taglie), mai Math.random. */
const ALUO=(()=>{
 const MON=typeof AMON!=='undefined'?AMON:require('./27m-avv-mondo.js');
 // ---- perdizione a soglie (W14) ----
 const SOGLIE=[25,50,75],MAX_PERDIZIONE=100;
 const livelloPerdizione=p=>SOGLIE.filter(x=>p>=x).length;
 // effetti del livello: bonus al livello dei mostri, gruppi in più nel mondo, villaggio assediato, strade sbarrate (costo 2 invece di 0,5)
 const EFFETTI=[{mostri:0,gruppi:0,assedio:false,strade:false},{mostri:1,gruppi:1,assedio:false,strade:false},{mostri:2,gruppi:1,assedio:true,strade:false},{mostri:3,gruppi:2,assedio:true,strade:true}];
 const effetti=p=>Object.assign({livello:livelloPerdizione(p)},EFFETTI[livelloPerdizione(p)]);
 const NOTE_SOGLIA=['','L\'ombra si allunga sul regno: i mostri sono più forti e più numerosi.','Un villaggio è sotto assedio e le strade non sono più sicure.','Le strade sono sbarrate e il regno trema: la fine è vicina.'];
 // ---- servizi e prezzi (W12) ----
 const SERVIZI={citta:['locanda','guaritore','tempio','bottega','bacheca'],villaggio:['locanda','guaritore','bottega'],santuario:['preghiera'],campo:['accampamento'],antro:['sotterraneo'],rovina:['sotterraneo'],torre:['sotterraneo'],tesoro:[]};
 const NOME_SERVIZIO={locanda:'Locanda',guaritore:'Guaritore',tempio:'Tempio',bottega:'Bottega',bacheca:'Bacheca delle taglie',preghiera:'Preghiera',accampamento:'Accampamento',sotterraneo:'Entra'};
 const PREZZI={locanda:8,offerta:20,razioneLungo:1,tempio:(liv)=>20+10*(liv||1),guaritore:(hp,hpMax)=>Math.ceil(Math.max(0,hpMax-hp)/2)};
 const PREGHIERA={libera:3,offerta:8,chiusoPerGiorni:3};
 const BREVE={pct:.2,max:2,distanza:2},NATURALE=.1,LUNGO_ACCAMPAMENTO=.5;
 // servizi aperti in un luogo: un luogo assediato o chiuso non ne offre
 function servizi(luogo,giorno){if(!luogo)return[];if(luogo.assedio)return[];let L=(SERVIZI[luogo.tipo]||[]).slice();
  if(luogo.tipo==='santuario'&&luogo.pronto!=null&&giorno<luogo.pronto)L=[];return L}
 // preghiera al santuario: { perdizione (variazione negativa), costo, pronto (primo giorno in cui si può ripregare) } oppure { err }
 function preghiera(luogo,giorno,offerta,oro){if(!luogo||luogo.tipo!=='santuario')return{err:'Qui non c\'è nessun santuario'};
  if(luogo.pronto!=null&&giorno<luogo.pronto)return{err:'Il santuario è silenzioso: tornerà ad ascoltare il giorno '+luogo.pronto};
  if(offerta&&oro<PREZZI.offerta)return{err:'Servono '+PREZZI.offerta+' monete per l\'offerta'};
  return{perdizione:-(offerta?PREGHIERA.offerta:PREGHIERA.libera),costo:offerta?PREZZI.offerta:0,pronto:giorno+PREGHIERA.chiusoPerGiorni}}
 // ---- trappole ed eventi (usati nelle stanze) ----
 const TRAPPOLE=[
  {testo:'Il pavimento è fatto di lastre mobili: una sola è sicura.',ab:['percezione','acrobazia','furtivita']},
  {testo:'Un cunicolo stretto e buio: ogni passo va scelto con cura.',ab:['percezione','furtivita','sopravvivenza']},
  {testo:'Un varco è ostruito da massi e radici intrecciate.',ab:['atletica','arcano','acrobazia']},
  {testo:'Una porta sigillata da un incantesimo antico.',ab:['arcano','storia','percezione']},
  {testo:'Un ponte marcio su un pozzo senza fondo.',ab:['acrobazia','atletica','sopravvivenza']}];
 // effetti di una scelta: oro (alla compagnia), pfPct (±, a ogni eroe in piedi), perdizione, xp (a ogni eroe in piedi), razioni (al primo eroe)
 const EVENTI=[
  {id:'altare',testo:'Su un altare di pietra brillano monete lasciate in offerta.',scelte:[
   {t:'Prendere le monete',eff:{oro:25,perdizione:3},fine:'Le monete sono vostre, ma qualcosa nell\'aria si fa più freddo.'},
   {t:'Lasciare un\'offerta',eff:{oro:-10,perdizione:-2,pfPct:.15},fine:'Una calma improvvisa vi rinfranca.'},
   {t:'Passare oltre',eff:{},fine:'Non toccate nulla e andate avanti.'}]},
  {id:'prigioniero',testo:'Un viandante è incatenato al muro e vi supplica a mezza voce.',scelte:[
   {t:'Liberarlo',eff:{xp:20,oro:10,perdizione:-1},fine:'Vi ringrazia e vi dà tutto ciò che ha.'},
   {t:'Derubarlo',eff:{oro:20,perdizione:2},fine:'Quello che trovate non vale la sua occhiata.'},
   {t:'Lasciarlo lì',eff:{perdizione:1},fine:'Le sue grida vi seguono per un pezzo.'}]},
  {id:'fonte',testo:'Una fonte d\'acqua limpida sgorga dalla roccia.',scelte:[
   {t:'Bere con calma',eff:{pfPct:.25},fine:'L\'acqua è fresca e vi rimette in forze.'},
   {t:'Riempire le borracce',eff:{razioni:1},fine:'Ne ricavate una razione da viaggio.'}]},
  {id:'diario',testo:'Tra le macerie c\'è il diario di un\'esploratrice.',scelte:[
   {t:'Leggerlo con attenzione',eff:{xp:15},fine:'Le sue annotazioni vi insegnano qualcosa.'},
   {t:'Strappare le pagine in vendita',eff:{oro:15},fine:'Qualche collezionista le pagherà bene.'}]},
  {id:'statua',testo:'Una statua di corvo vi fissa con occhi di vetro.',scelte:[
   {t:'Prendere gli occhi di vetro',eff:{oro:30,perdizione:3},fine:'Vi pesano in tasca più del dovuto.'},
   {t:'Pregare davanti alla statua',eff:{perdizione:-2},fine:'Per un attimo la statua pare chiudere gli occhi.'}]}];
 const evento=id=>EVENTI.find(e=>e.id===id)||null;
 // ---- sotterranei (W11): sequenza di 3–6 stanze, l'ultima è sempre il boss ----
 // tipo: antro (4 stanze), rovina (3), torre (6). pericolo 1..5 per cd delle trappole e bottino. Ripetibile dal seme.
 const FAMIGLIA_SOTT={antro:'banditi',rovina:'nonmorti',torre:'torre'},AMBIENTE_SOTT={antro:'antro',rovina:'antro',torre:'torre'},PERICOLO_SOTT={antro:2,rovina:2,torre:4};
 function stanze(seme,tipo,pericolo){if(!FAMIGLIA_SOTT[tipo])throw new Error('non è un sotterraneo: '+tipo);const r=MON.mulberry((seme>>>0)+Math.imul(tipo.length,7919)+(tipo.charCodeAt(0)<<8)),pick=a=>a[Math.floor(r()*a.length)];
  const p=pericolo||PERICOLO_SOTT[tipo],cd=Math.min(18,10+2*p);
  const trap=()=>{const t=pick(TRAPPOLE);return{k:'trappola',testo:t.testo,ab:t.ab.slice(),cd,dan:3+p}},ev=()=>({k:'evento',id:pick(EVENTI).id}),fz=()=>({k:'forziere'}),ba=d=>({k:'battaglia',diff:d||'medio'}),ri=()=>({k:'riposo'}),boss=()=>({k:'boss',diff:'capo'});
  const L=tipo==='antro'?[ba('medio'),trap(),r()<.5?fz():ev(),boss()]:tipo==='rovina'?[r()<.5?trap():ev(),ba('medio'),boss()]:[ba('medio'),trap(),ri(),ev(),ba('difficile'),boss()];
  return L.map((x,i)=>Object.assign({n:i+1},x))}
 const testoStanza=(st,tipo)=>st.k==='battaglia'?'Qualcuno vi ha sentito arrivare.':st.k==='boss'?(tipo==='torre'?'In cima, il padrone della torre vi aspetta.':'In fondo alla sala veglia il capo.'):st.k==='forziere'?'Un forziere dimenticato giace in un angolo.':st.k==='riposo'?'Una stanza riparata: qui si può tirare il fiato.':st.k==='trappola'?st.testo:st.k==='evento'?evento(st.id).testo:'';
 // ---- taglie (W12): per ogni mostro noto, una ricompensa; si riscuote quando il gruppo è stato sconfitto ----
 function taglie(seme,giorno,mostri,n){const r=MON.mulberry((seme>>>0)+Math.imul(giorno|0,104729));const L=(mostri||[]).filter(m=>m.stato!=='guardia').slice().sort((a,b)=>r()-.5);
  return L.slice(0,n||2).map(m=>({id:'t-'+m.id,mostro:m.id,ricompensa:15+8*m.liv+Math.floor(r()*10),riscossa:false}))}
 return{SOGLIE,MAX_PERDIZIONE,EFFETTI,NOTE_SOGLIA,livelloPerdizione,effetti,SERVIZI,NOME_SERVIZIO,PREZZI,PREGHIERA,BREVE,NATURALE,LUNGO_ACCAMPAMENTO,servizi,preghiera,TRAPPOLE,EVENTI,evento,
  FAMIGLIA_SOTT,AMBIENTE_SOTT,PERICOLO_SOTT,stanze,testoStanza,taglie}})();
if(typeof module!=='undefined')module.exports=ALUO;
