/* ---- Eroi delle campagne: creazione del personaggio (dati e regole pure). ----
   Meccaniche da gioco di ruolo da tavolo (punteggi da 8 a 15 con 27 punti, modificatori, bonus competenza, dadi a venti
   facce): sono regole, non testo protetto. Nomi, razze, classi e oggetti sono originali della Taverna.
   Un eroe vive nel profilo online (`players/{uid}/eroi/e1..e5`): razza, classe e punteggi base non cambiano più.
   Tenere allineato firestore.rules (npm run regole). */
const EROI=(()=>{
 const STAT=['for','des','cos','int','sag','car'];
 const NOME_STAT={for:'Forza',des:'Destrezza',cos:'Costituzione',int:'Intelletto',sag:'Saggezza',car:'Carisma'};
 const BUDGET=27,BASE_MIN=8,BASE_MAX=15,COSTO={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9},SLOT_ID=['e1','e2','e3','e4','e5'],MAX_EROI=SLOT_ID.length;
 const RAZZE={
  umano:{nome:'Umano',bonus:{for:1,des:1,cos:1,int:1,sag:1,car:1},mov:6,tratto:'Versatile',desc:'Adattabili e ostinati, si trovano ovunque ci sia una strada.'},
  elfo:{nome:'Elfo dei boschi',bonus:{des:2,sag:1},mov:6,tratto:'Vista acuta',desc:'Silenziosi abitanti dei boschi: nulla sfugge ai loro occhi.'},
  nano:{nome:'Nano delle rocce',bonus:{cos:2,for:1},mov:5,tratto:'Pelle di pietra',desc:'Cresciuti sotto le montagne, resistono a tutto.'},
  piccolo:{nome:'Piccolo dei campi',bonus:{des:2,car:1},mov:5,tratto:'Fortunato',desc:'Allegri e fortunati, tirano sempre fuori un asso dalla manica.'},
  orco:{nome:'Orco delle steppe',bonus:{for:2,cos:1},mov:6,tratto:'Furia tenace',desc:'Forti come tori, testardi più dei nani.'}};
 // dado vita, caratteristica principale, abilità in cui è competente, equipaggiamento iniziale
 const CLASSI={
  guerriero:{nome:'Guerriero',dado:10,primaria:'for',salvezze:['for','cos'],abilita:['atletica','intimidire'],equip:{arma:'spada-lunga',armatura:'cotta-maglia',scudo:'scudo-legno'},desc:'Al fronte della mischia, regge i colpi e li restituisce.'},
  ladro:{nome:'Ladro',dado:8,primaria:'des',salvezze:['des','int'],abilita:['furtivita','acrobazia'],equip:{arma:'pugnali',armatura:'cuoio',scudo:null},desc:'Colpisce dall\'ombra e sparisce prima che tu veda la lama.'},
  mago:{nome:'Mago',dado:6,primaria:'int',salvezze:['int','sag'],abilita:['arcano','storia'],equip:{arma:'bastone',armatura:'stracci',scudo:null},desc:'Fragile, ma le sue parole piegano il fuoco e il ghiaccio.'},
  chierico:{nome:'Chierico',dado:8,primaria:'sag',salvezze:['sag','car'],abilita:['medicina','percezione'],equip:{arma:'mazza',armatura:'cotta-maglia',scudo:'scudo-legno'},desc:'Cura i compagni e punisce chi li minaccia.'},
  esploratore:{nome:'Esploratore',dado:8,primaria:'des',salvezze:['for','des'],abilita:['percezione','sopravvivenza'],equip:{arma:'arco',armatura:'cuoio',scudo:null},desc:'Conosce ogni sentiero e colpisce da lontano.'},
  bardo:{nome:'Bardo',dado:8,primaria:'car',salvezze:['des','car'],abilita:['persuasione','storia'],equip:{arma:'stocco',armatura:'cuoio',scudo:null},desc:'Una canzone per ogni battaglia, una battuta per ogni guaio.'}};
 const ABILITA={atletica:'for',intimidire:'car',furtivita:'des',acrobazia:'des',arcano:'int',storia:'int',medicina:'sag',percezione:'sag',sopravvivenza:'sag',persuasione:'car'};
 const NOME_AB={atletica:'Atletica',intimidire:'Intimidire',furtivita:'Furtività',acrobazia:'Acrobazia',arcano:'Arcano',storia:'Storia',medicina:'Medicina',percezione:'Percezione',sopravvivenza:'Sopravvivenza',persuasione:'Persuasione'};
 // oggetti: catalogo in motori/27b-avv-oggetti.js (AOGG, unica fonte); lo si legge a runtime perché viene caricato dopo questo file
 const AO=()=>typeof AOGG!=='undefined'?AOGG:require('./27b-avv-oggetti.js');
 // limiti di crescita per ogni scrittura sull'account (stessi numeri di firestore.rules, controllati da tests/test_eroi.js)
 const LIMITI={xp:800,oro:1000,attesaS:60};
 const SOGLIE_XP=[0,100,300,700,1300,2100,3200,4600,6400,8600],LIV_MAX=SOGLIE_XP.length;
 const ASPETTO={pelle:6,capelli:7,mantello:6,viso:4}; // quante scelte per ogni parte del ritratto
 const mod=v=>Math.floor((v-10)/2);
 const comp=liv=>liv>=9?4:liv>=5?3:2;
 const livelloPerXp=xp=>{let l=1;for(let i=1;i<LIV_MAX;i++)if(xp>=SOGLIE_XP[i])l=i+1;return l};
 const costoBase=base=>STAT.reduce((s,k)=>s+(COSTO[base[k]]==null?NaN:COSTO[base[k]]),0);
 const baseIniziale=()=>Object.fromEntries(STAT.map(k=>[k,BASE_MIN]));
 // punteggi finali = base + bonus di razza
 const punteggi=(base,razza)=>Object.fromEntries(STAT.map(k=>[k,base[k]+((RAZZE[razza]||{bonus:{}}).bonus[k]||0)]));
 // valori derivati dal solo contenuto dell'eroe: si ricalcolano sempre, non ci si fida di quelli salvati
 function derivati(h){
  const c=CLASSI[h.classe],st=punteggi(h.base,h.razza),mc=mod(st.cos),liv=h.liv||1,perLiv=Math.floor(c.dado/2)+1+mc;
  const hpMax=Math.max(1,c.dado+mc+(liv-1)*Math.max(1,perLiv));
  const AG=AO(),OG=AG.OGG,fx=AG.bonus(h),q=h.equip||{},arm=OG[q.armatura],scu=OG[q.scudo],arma=OG[q.arma],dm=mod(st.des);
  let ca=arm?arm.ca+(arm.desMax===0?0:arm.desMax==null?dm:Math.min(dm,arm.desMax)):10+dm;if(scu)ca+=scu.ca;ca+=fx.ca;if(h.razza==='nano')ca+=1;
  const ms=arma?(arma.acc?Math.max(mod(st.for),mod(st.des)):mod(st[arma.stat])):0;
  return{stat:st,hpMax:hpMax+fx.hp,ca,comp:comp(liv),iniziativa:mod(st.des)+fx.iniz,mov:Math.max(1,RAZZE[h.razza].mov+fx.mov),
   attacco:arma?ms+comp(liv)+fx.att:0,danno:arma?{n:arma.n||1,dado:arma.dado,bonus:ms+fx.dan,tipo:arma.tipo}:null,
   abilita:[...c.abilita],salvezze:[...c.salvezze],salvBonus:fx.salv,abBonus:fx.ab,res:fx.res}}
 // eroe completo, pronto da salvare. `in`: { nome, razza, classe, base:{...}, aspetto:{...} }. Lancia un errore (code 'eroe') con il motivo.
 function nuovo(inp,ora){
  const e=valida(inp);if(e)throw Object.assign(new Error(e),{code:'eroe'});
  const h={v:1,nome:inp.nome.trim(),razza:inp.razza,classe:inp.classe,aspetto:{...inp.aspetto},base:{...inp.base},liv:1,xp:0,oro:20,equip:{...CLASSI[inp.classe].equip},zaino:['pozione-cura'],cintura:[],creato:ora==null?Date.now():ora};
  const d=derivati(h);h.hpMax=d.hpMax;h.hp=d.hpMax;return h}
 // motivo per cui la scheda non va bene, oppure null
 function valida(i){
  if(!i||typeof i!=='object')return'scheda mancante';
  if(typeof i.nome!=='string'||i.nome.trim().length<1||i.nome.trim().length>16)return'il nome deve avere da 1 a 16 lettere';
  if(/[<>]/.test(i.nome))return'nome non valido';
  if(!RAZZE[i.razza])return'razza sconosciuta';if(!CLASSI[i.classe])return'classe sconosciuta';
  if(!i.base||STAT.some(k=>!Number.isInteger(i.base[k])||i.base[k]<BASE_MIN||i.base[k]>BASE_MAX))return'punteggi da '+BASE_MIN+' a '+BASE_MAX;
  if(Object.keys(i.base).some(k=>!STAT.includes(k)))return'punteggio sconosciuto';
  const c=costoBase(i.base);if(c>BUDGET)return'servono '+c+' punti, ne hai '+BUDGET;
  const a=i.aspetto||{};for(const p of Object.keys(ASPETTO))if(!Number.isInteger(a[p])||a[p]<0||a[p]>=ASPETTO[p])return'aspetto non valido';
  if(Object.keys(a).some(p=>!(p in ASPETTO)))return'aspetto non valido';
  return null}
 // un eroe salvato: i valori derivati sono quelli giusti? (difesa contro schede manomesse)
 function coerente(h){const e=valida({nome:h.nome,razza:h.razza,classe:h.classe,base:h.base,aspetto:h.aspetto});if(e)return false;
  if(!Number.isInteger(h.liv)||h.liv<1||h.liv>LIV_MAX||h.liv!==livelloPerXp(h.xp))return false;
  if(AO().invValido(h))return false;
  const d=derivati(h);return h.hpMax===d.hpMax&&h.hp>=0&&h.hp<=h.hpMax}
 // aggiunge esperienza e sale di livello quando serve (restituisce una copia)
 function guadagna(h,xp){const n={...h,xp:Math.max(0,h.xp+xp)};n.liv=livelloPerXp(n.xp);const d=derivati(n);const cura=d.hpMax-h.hpMax;n.hpMax=d.hpMax;n.hp=Math.min(d.hpMax,h.hp+Math.max(0,cura));return n}
 // prova di abilità: d20 + modificatore (+ competenza) contro una difficoltà. `rnd` = generatore 0..1.
 function prova(h,abilita,cd,rnd,vantaggio){
  const st=punteggi(h.base,h.razza),k=ABILITA[abilita];if(!k)throw new Error('abilità sconosciuta: '+abilita);
  const d=()=>1+Math.floor((rnd||Math.random)()*20);let t=d();if(vantaggio)t=Math.max(t,d());
  if(h.razza==='piccolo'&&t===1)t=d();
  const c=CLASSI[h.classe].abilita.includes(abilita)?comp(h.liv):0,tot=t+mod(st[k])+c+(h.razza==='elfo'&&abilita==='percezione'?1:0)+(AO().bonus(h).ab[abilita]||0);
  return{tiro:t,mod:mod(st[k]),comp:c,tot,cd,ok:t===20||(t!==1&&tot>=cd),critico:t===20,fallimento:t===1}}
 // bonus totale di un'abilità e probabilità di superare una difficoltà (1 e 20 naturali compresi, senza il ritiro del piccolo)
 function bonus(h,abilita){const st=punteggi(h.base,h.razza);return mod(st[ABILITA[abilita]])+(CLASSI[h.classe].abilita.includes(abilita)?comp(h.liv):0)+(h.razza==='elfo'&&abilita==='percezione'?1:0)+(AO().bonus(h).ab[abilita]||0)}
 function probabilita(h,abilita,cd){const b=bonus(h,abilita);let n=0;for(let t=1;t<=20;t++)if(t===20||(t!==1&&t+b>=cd))n++;return n/20}
 const BASE_ID=k=>NOME_STAT[k];
 return{STAT,NOME_STAT,BUDGET,BASE_MIN,BASE_MAX,COSTO,SLOT_ID,MAX_EROI,RAZZE,CLASSI,ABILITA,NOME_AB,LIMITI,SOGLIE_XP,LIV_MAX,ASPETTO,mod,comp,livelloPerXp,costoBase,baseIniziale,punteggi,derivati,nuovo,valida,coerente,guadagna,prova,bonus,probabilita,BASE_ID}})();
if(typeof module!=='undefined')module.exports=EROI;
