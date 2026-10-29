/* ---- Stati alterati e danni dell'avventura (Cantari di Ventura). Regole pure sui «combattenti»; poteri in 27e-avv-poteri.js. ----
   Un combattente è un oggetto JSON (eroe, compagno o mostro) con almeno:
   { id, nome, lato:'eroi'|'nemici', liv, hp, hpMax, temp, ca, att, magia, dan:{n,dado,bonus,tipo}, salv:{for,des,cos,int,sag,car}, cd,
     iniz, mov, gitt, crit, res:[], vuln:[], imm:[], immStati:[], stati:[{id,t,fino,da?,ca?,res?}], conc, concMax, usi:{}, poteri:[], hook:{} }
   Gli stati hanno una durata in turni di chi li porta: `fino:'fine'` (predefinito) scala alla fine del suo turno, `fino:'inizio'` all'inizio
   del suo turno successivo (per gli effetti che uno si dà da solo nel proprio turno). Stati «perm» non hanno durata.
   Danni: nove tipi con resistenze (metà, minimo 1), vulnerabilità (doppio) e immunità (zero); resistenza + vulnerabilità si annullano.
   Niente fuoco amico: i poteri ad area colpiscono solo chi è dall'altra parte (27e-avv-poteri.js). Mai Math.random. */
const ASTA=(()=>{
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const TIPI=['taglio','perforante','contundente','fuoco','gelo','fulmine','necrotico','radioso','veleno'];
 const FISICI=['taglio','perforante','contundente'];
 const NOME_TIPO={taglio:'taglio',perforante:'perforante',contundente:'contundente',fuoco:'fuoco',gelo:'gelo',fulmine:'fulmine',necrotico:'necrotico',radioso:'radioso',veleno:'veleno'};
 // proprietà: mal/ben = negativo/positivo; perm = senza durata; noAgire; vsVant/vsSvant = chi lo attacca ha vantaggio/svantaggio; svant/vant = chi lo porta
 // attacca con svantaggio/vantaggio; att/salv/ca = bonus; movMolt/mov0; dot = [dadi, tipo] a inizio turno; perAtt = finisce quando attacca; salvAuto = salvezze sempre fallite
 const STATI={
  terra:{nome:'A terra',mal:1,perm:1,noAgire:1,mov0:1,vsVant:1,desc:'A 0 PF: fuori dalla battaglia ma non morto. Un compagno può rialzarlo.'},
  stordito:{nome:'Stordito',mal:1,noAgire:1,vsVant:1,salvAuto:['for','des'],desc:'Non può agire. Chi lo attacca ha vantaggio; fallisce le salvezze di Forza e Destrezza.'},
  accecato:{nome:'Accecato',mal:1,svant:1,vsVant:1,desc:'Attacca con svantaggio; chi lo attacca ha vantaggio.'},
  avvelenato:{nome:'Avvelenato',mal:1,svant:1,desc:'Attacca con svantaggio.'},
  'in-fiamme':{nome:'In fiamme',mal:1,dot:['1d6','fuoco'],desc:'Subisce 1d6 di fuoco all\'inizio del suo turno.'},
  congelato:{nome:'Congelato',mal:1,movMolt:.5,ca:-2,desc:'Movimento dimezzato e −2 alla CA.'},
  rallentato:{nome:'Rallentato',mal:1,movMolt:.5,desc:'Movimento dimezzato.'},
  impigliato:{nome:'Impigliato',mal:1,mov0:1,ca:-1,desc:'Non può muoversi e ha −1 alla CA.'},
  benedetto:{nome:'Benedetto',ben:1,att:2,salv:2,desc:'+2 ai tiri per colpire e alle salvezze.'},
  maledetto:{nome:'Maledetto',mal:1,att:-2,salv:-2,desc:'−2 ai tiri per colpire e alle salvezze.'},
  nascosto:{nome:'Nascosto',ben:1,perm:1,vant:1,vsSvant:1,perAtt:1,desc:'Chi lo attacca ha svantaggio; il suo primo attacco ha vantaggio e lo rivela.'},
  provocato:{nome:'Provocato',mal:1,provoca:1,desc:'Attacca con svantaggio chiunque non sia chi lo ha provocato.'},
  protetto:{nome:'Protetto',ben:1,ca:2,desc:'+2 alla CA (o quanto indicato dal potere).'},
  mirato:{nome:'Mirato',ben:1,vant:1,perAtt:1,desc:'Il prossimo attacco ha vantaggio.'}};
 const ID=Object.keys(STATI);
 const trova=(c,id)=>c.stati.find(x=>x.id===id);
 const ha=(c,id)=>!!trova(c,id);
 const D=x=>STATI[x.id];
 // mette lo stato (t = turni); se c'è già si rinnova con la durata maggiore. Restituisce false se il combattente ne è immune.
 function aggiungi(c,id,t,extra){const S=STATI[id];if(!S)throw new Error('stato sconosciuto: '+id);if((c.immStati||[]).includes(id))return false;
  if(c.morto)return false;
  const x=Object.assign({id,t:S.perm?null:Math.max(1,Math.floor(t)||1),fino:'fine'},extra||{});const e=trova(c,id);
  if(e){if(S.perm||x.t>=e.t)Object.assign(e,x);return true}
  c.stati.push(x);return true}
 const togli=(c,id)=>{const n=c.stati.length;c.stati=c.stati.filter(x=>x.id!==id);return c.stati.length<n};
 // rimuove una lista di stati (mai «a terra»: lo toglie solo la cura); restituisce quelli tolti
 function rimuovi(c,ids){const tolti=[];for(const id of ids)if(id!=='terra'&&togli(c,id))tolti.push(id);return tolti}
 // somma degli effetti degli stati sui numeri di un combattente
 function mod(c){const m={ca:0,att:0,salv:0,movMolt:1,mov0:false,noAgire:false,res:[]};
  for(const x of c.stati){const S=D(x);m.ca+=x.ca!=null?x.ca:(S.ca||0);m.att+=S.att||0;m.salv+=S.salv||0;if(S.movMolt)m.movMolt=Math.min(m.movMolt,S.movMolt);
   if(S.mov0)m.mov0=true;if(S.noAgire)m.noAgire=true;if(x.res)m.res.push(...x.res)}
  return m}
 const caEff=c=>c.ca+mod(c).ca;
 const resEff=c=>(c.res||[]).concat(mod(c).res);
 const movEff=c=>{const m=mod(c);return m.mov0?0:Math.floor(c.mov*m.movMolt)};
 const puoAgire=c=>!c.morto&&c.hp>0&&!mod(c).noAgire;
 // vantaggio/svantaggio e bonus di un attacco di `a` contro `d`; `o` porta quello che sa il campo di battaglia (altezza, distanza, aiuto)
 function attacco(a,d,o){o=o||{};let vant=!!o.vant,svant=!!o.svant;
  if(a.stati.some(x=>D(x).svant))svant=true;if(a.stati.some(x=>D(x).vant))vant=true;
  if(d.stati.some(x=>D(x).vsVant))vant=true;if(d.stati.some(x=>D(x).vsSvant))svant=true;
  const pr=trova(a,'provocato');if(pr&&pr.da&&pr.da!==d.id)svant=true;
  return{vant:vant&&!svant,svant:svant&&!vant,bonus:mod(a).att}}
 // dopo un attacco finiscono «mirato» e «nascosto»
 function dopoAttacco(a){const f=a.stati.filter(x=>D(x).perAtt).map(x=>x.id);a.stati=a.stati.filter(x=>!D(x).perAtt);return f}
 // tiro salvezza: 1 naturale fallisce, 20 riesce; chi è stordito fallisce Forza e Destrezza qualunque sia il dado
 function salvezza(c,ab,cd,rnd,o){const auto=c.stati.some(x=>(D(x).salvAuto||[]).includes(ab)),r=DAD.d20(rnd,o||{}),tot=r.tiro+((c.salv||{})[ab]||0)+mod(c).salv;
  const ok=!auto&&(r.tiro===20||(r.tiro!==1&&tot>=cd));return{tiro:r.tiro,tot,cd,ok,ab}}
 // danno finale su un bersaglio (senza applicarlo): resistenza, vulnerabilità, immunità
 function effettivo(c,n,tipo){n=Math.max(0,Math.floor(n));const R=resEff(c).includes(tipo),V=(c.vuln||[]).includes(tipo),I=(c.imm||[]).includes(tipo);
  if(I)return{n:0,esito:'imm'};if(R&&V)return{n,esito:null};if(R)return{n:Math.max(n>0?1:0,Math.floor(n/2)),esito:'res'};if(V)return{n:n*2,esito:'vuln'};return{n,esito:null}}
 // a 0 PF un eroe va «a terra» (perde gli altri stati), un mostro muore
 function cade(c){if(c.lato==='eroi'){c.stati=c.stati.filter(x=>D(x).perm&&x.id!=='nascosto');aggiungi(c,'terra')}else{c.morto=true;c.stati=[]}}
 // applica un danno: prima i PF temporanei. `o.salva1`: se serve a restare in piedi a 1 PF (reazione «tenace»)
 function danno(c,n,tipo,o){o=o||{};const e=effettivo(c,n,tipo);let ass=0;
  if(c.temp>0&&e.n>0){ass=Math.min(c.temp,e.n);c.temp-=ass}
  const prima=c.hp;c.hp=Math.max(0,c.hp-(e.n-ass));let tenace=false;
  if(c.hp===0&&prima>0&&o.salva1){c.hp=1;tenace=true}
  const a0=prima>0&&c.hp===0;if(a0)cade(c);
  return{n:e.n,assorbito:ass,perso:prima-c.hp,esito:e.esito,a0,tenace}}
 // cura: chi era a terra si rialza (e il talento «rialzo rapido» aggiunge PF); i mostri morti non si curano
 function cura(c,n){if(c.morto)return{n:0,rialzato:false};n=Math.max(0,Math.floor(n));if(!n)return{n:0,rialzato:false};
  const era0=c.hp<=0,prima=c.hp;if(era0){togli(c,'terra');n+=((c.hook||{}).rialzo||0)}
  c.hp=Math.min(c.hpMax,c.hp+n);return{n:c.hp-prima,rialzato:era0}}
 const temp=(c,n)=>{n=Math.max(0,Math.floor(n));const v=Math.max(c.temp||0,n);const d=v-(c.temp||0);c.temp=v;return d};
 // inizio del turno: danni nel tempo (in fiamme) e fine degli effetti «fino all'inizio»
 function inizioTurno(c,rnd){const ev=[];
  for(const x of c.stati.slice()){const S=D(x);if(S.dot&&!c.morto&&c.hp>0){const r=DAD.danno(rnd,S.dot[0]);const d=danno(c,r.tot,S.dot[1]);ev.push({t:'dot',chi:c.id,stato:x.id,n:d.n,perso:d.perso,tipo:S.dot[1],a0:d.a0})}}
  for(const x of c.stati.slice()){if(x.fino==='inizio'&&x.t!=null){x.t--;if(x.t<=0){togli(c,x.id);ev.push({t:'fine',chi:c.id,stato:x.id})}}}
  return ev}
 // fine del turno: scalano le durate; «Spirito indomito» toglie un turno in più agli stati negativi
 function fineTurno(c){const ev=[],extra=((c.hook||{}).breve||0);
  for(const x of c.stati.slice()){if(x.fino==='inizio'||x.t==null)continue;x.t-=1+(D(x).mal?extra:0);if(x.t<=0){togli(c,x.id);ev.push({t:'fine',chi:c.id,stato:x.id})}}
  return ev}
 return{TIPI,FISICI,NOME_TIPO,STATI,ID,aggiungi,togli,rimuovi,ha,trova,mod,caEff,resEff,movEff,puoAgire,attacco,dopoAttacco,salvezza,effettivo,danno,cura,temp,inizioTurno,fineTurno,cade}})();
if(typeof module!=='undefined')module.exports=ASTA;
