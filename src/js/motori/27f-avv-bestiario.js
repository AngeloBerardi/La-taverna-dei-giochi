/* ---- Bestiario dell'avventura (Cantari di Ventura): 4 famiglie × 5 mostri + 3 capi. Dati e regole pure (27d stati, 27e poteri). ----
   Ogni mostro è definito da famiglia, livello, ruolo e poche eccezioni: PF, CA, attacco, danno e CD vengono dalla formula del ruolo
   (`stat`), così i numeri crescono tutti allo stesso modo e si bilanciano in un punto solo (A13). Nomi, poteri e creature sono originali.
   Ruoli: bruto (regge e picchia da vicino), tiratore (da lontano), incantatore (aree e stati), supporto (cura e rafforza), sciame (molti colpi leggeri, resiste ai colpi fisici).
   `ia` dice alla battaglia (A4/A5, modulo AIA) come si comporta: distanza preferita, chi sceglie come bersaglio, se fugge o si arrende.
   `combattente(id, {id})` crea la stessa forma dei combattenti degli eroi (vedi 27d-avv-stati.js). */
const BEST=(()=>{
 const AP=typeof APOT!=='undefined'?APOT:require('./27e-avv-poteri.js');
 const ST=typeof ASTA!=='undefined'?ASTA:require('./27d-avv-stati.js');
 const {W,D,C,S,SE,AU,CE,LI}=AP.eff,pot=AP.registra;
 const FAMIGLIE={bestie:'Bestie',banditi:'Banditi',nonmorti:'Non morti',torre:'Creature della torre'};
 const RUOLI={
  bruto:{nome:'Bruto',pf:1.25,ca:1,att:0,dado:8,dan:1,gitt:1,ia:{dist:'contatto',mira:'vicino'}},
  tiratore:{nome:'Tiratore',pf:.7,ca:0,att:1,dado:6,dan:.9,gitt:6,ia:{dist:'lontana',mira:'debole'}},
  incantatore:{nome:'Incantatore',pf:.65,ca:-1,att:0,dado:6,dan:.8,gitt:6,ia:{dist:'media',mira:'curatore'}},
  supporto:{nome:'Supporto',pf:.85,ca:0,att:0,dado:6,dan:.7,gitt:1,ia:{dist:'media',mira:'alleato-ferito'}},
  sciame:{nome:'Sciame',pf:1.1,ca:-1,att:-1,dado:4,dan:.6,gitt:1,ia:{dist:'contatto',mira:'vicino'}}};
 // formula dei numeri (livello 1..10). Eroi: PF 9+6(L−1), CA 14..18, attacco +5..+7 (tabella di docs/rules/avventura.md).
 function stat(liv,ruolo,capo){const R=RUOLI[ruolo],n=1+Math.floor((liv-1)/3);
  const dan={n:Math.max(1,Math.round(n*R.dan)),dado:R.dado,bonus:Math.max(0,Math.round((1+Math.floor(liv/2))*R.dan))};
  return{pf:Math.round((10+7*liv)*R.pf*(capo?3.2:1)),ca:11+Math.floor(liv/2)+R.ca+(capo?2:0),att:3+Math.floor(liv/3)+R.att+(capo?1:0),dan,cd:10+Math.ceil(liv/2)+(capo?1:0),
   salv:1+Math.floor(liv/3)+(capo?2:0),iniz:1+Math.floor(liv/3),mov:6,gitt:R.gitt}}
 // ---- poteri dei mostri (stessi effetti di quelli degli eroi) ----
 pot('m-carica','Carica','mostri',2,'azione','scontro',{att:'arma',gitt:1,eff:[W({bonus:2}),{k:'spingi',n:1}],desc:'Si getta a testa bassa.'});
 pot('m-sciame','Nugolo','mostri',2,'azione','turno',Object.assign({salv:'des',eff:[D('1d6','perforante')],desc:'Un nugolo che morde da ogni parte.'},AU(1,'nemici')));
 pot('m-ragnatela','Ragnatela','mostri',4,'azione','scontro',{usi:2,salv:'des',gitt:5,eff:[S('impigliato',2)],desc:'Un getto di filo appiccicoso.'});
 pot('m-morso-velenoso','Morso velenoso','mostri',4,'azione','turno',{att:'arma',gitt:1,eff:[W(),D('1d6','veleno'),S('avvelenato',2,{salv:'cos'})],desc:'Zanne che iniettano un veleno.'});
 pot('m-artigli','Artigli','mostri',5,'azione','turno',{multi:2,att:'arma',gitt:1,eff:[W()],desc:'Due zampate, una dopo l\'altra.'});
 pot('m-sabbia','Sabbia negli occhi','mostri',1,'azione','scontro',{salv:'des',gitt:1,eff:[S('accecato',1)],desc:'Una manciata di polvere in faccia.'});
 pot('m-freccia-avvelenata','Freccia avvelenata','mostri',2,'azione','scontro',{usi:2,att:'arma',gitt:'arma',eff:[W(),S('avvelenato',3,{salv:'cos'})],desc:'Una punta intinta in qualcosa di sgradevole.'});
 pot('m-colpo-a-tradimento','Colpo a tradimento','mostri',4,'azione','scontro',{att:'arma',gitt:1,eff:[W(),D('2d6','taglio')],desc:'Alle spalle, dove fa più male.'});
 pot('m-impacco','Impacco','mostri',3,'azione','scontro',{usi:3,gitt:4,bers:'alleato',eff:[C('2d6',{bonus:2})],desc:'Fascia una ferita in fretta.'});
 pot('m-benedizione-sporca','Benedizione sporca','mostri',3,'bonus','scontro',Object.assign({eff:[S('benedetto',3)],desc:'Una preghiera storta per i suoi compari.'},AU(3,'alleati')));
 pot('m-dardo-ardente','Dardo ardente','mostri',5,'azione','turno',{att:'magia',gitt:6,eff:[D('2d6','fuoco')],desc:'Una scintilla che brucia davvero.'});
 pot('m-nube-nera','Nube nera','mostri',5,'azione','scontro',Object.assign({salv:'cos',eff:[S('accecato',2)],desc:'Fumo denso e puzzolente.'},CE(6,2)));
 pot('m-grido-di-raduno','Grido di raduno','mostri',5,'bonus','scontro',Object.assign({eff:[S('benedetto',3),{k:'temp',n:8}],desc:'Il capo urla e i suoi si fanno coraggio.'},AU(4,'alleati')));
 pot('m-doppio-fendente','Doppio fendente','mostri',5,'azione','turno',{multi:2,att:'arma',gitt:1,eff:[W()],desc:'Due colpi di fila.'});
 pot('m-ultima-carta','Ultima carta','mostri',5,'reazione','scontro',Object.assign({eff:[{k:'tenace'}],desc:'Non finisce così.'},SE));
 pot('m-artigli-gelidi','Artigli gelidi','mostri',4,'azione','scontro',{usi:2,att:'arma',gitt:1,eff:[W(),S('stordito',1,{salv:'cos'})],desc:'Un tocco che paralizza.'});
 pot('m-tocco-gelido','Tocco gelido','mostri',5,'azione','turno',{att:'magia',gitt:1,eff:[D('3d6','necrotico')],desc:'Il freddo della tomba.'});
 pot('m-lamento','Lamento','mostri',5,'azione','scontro',Object.assign({salv:'sag',eff:[S('maledetto',3)],desc:'Un gemito che toglie ogni speranza.'},AU(3,'nemici')));
 pot('m-richiamo-delle-ossa','Richiamo delle ossa','mostri',6,'azione','scontro',{usi:3,gitt:4,bers:'alleato',eff:[C('3d6')],desc:'Le ossa si ricompongono.'});
 pot('m-maledizione','Maledizione','mostri',6,'azione','scontro',{usi:2,salv:'sag',gitt:5,eff:[S('maledetto',3)],desc:'Parole antiche e cattive.'});
 pot('m-corona-spezzata','Corona spezzata','mostri',7,'azione','scontro',{usi:2,salv:'cos',meta:true,gitt:0,area:'cono',raggio:4,bers:'nemici',eff:[D('5d8','necrotico')],desc:'Un\'onda di gelo esce dalla corona incrinata.'});
 pot('m-comando-mortale','Comando mortale','mostri',7,'azione','scontro',{usi:2,salv:'sag',gitt:6,eff:[S('stordito',1)],desc:'Una parola di comando a cui è difficile non obbedire.'});
 pot('m-schianto','Schianto','mostri',4,'azione','scontro',{usi:2,att:'arma',gitt:1,eff:[W({mult:2}),{k:'spingi',n:2}],desc:'Un pugno di pietra.'});
 pot('m-getto-di-fuoco','Getto di fuoco','mostri',7,'azione','scontro',{usi:2,salv:'des',meta:true,gitt:0,area:'cono',raggio:3,bers:'nemici',eff:[D('3d6','fuoco'),S('in-fiamme',2)],desc:'Una lingua di fuoco dal petto.'});
 pot('m-assalto-d-ombra','Assalto d\'ombra','mostri',6,'bonus','scontro',Object.assign({usi:2,eff:[S('nascosto'),{k:'disimpegna'}],desc:'Si dissolve e riappare altrove.'},SE));
 pot('m-scudo-arcano','Scudo arcano','mostri',3,'reazione','scontro',{usi:2,gitt:4,bers:'alleato',eff:[S('protetto',1,{ca:3,fino:'inizio'})],desc:'Un guizzo di luce devia il colpo.'});
 pot('m-scarica','Scarica','mostri',5,'azione','turno',Object.assign({salv:'des',eff:[D('1d8','fulmine')],desc:'Scintille che saltano da un bersaglio all\'altro.'},AU(1,'nemici')));
 pot('m-fulmine-a-catena','Fulmine a catena','mostri',8,'azione','scontro',Object.assign({usi:3,salv:'des',meta:true,eff:[D('9d6','fulmine')],desc:'Una saetta lungo il corridoio.'},LI(6)));
 pot('m-gelo-del-corvo','Gelo del corvo','mostri',8,'azione','scontro',Object.assign({usi:3,salv:'cos',meta:true,eff:[D('6d6','gelo'),S('congelato',2)],desc:'Ali nere e un vento che morde.'},CE(6,1)));
 pot('m-occhi-di-corvo','Occhi di corvo','mostri',8,'bonus','scontro',Object.assign({salv:'sag',eff:[S('maledetto',3)],desc:'Cento occhi neri ti guardano.'},AU(4,'nemici')));
 // ---- i mostri ----
 const M={},ORDINE=[];
 const ia0=(ruolo,o)=>Object.assign({},RUOLI[ruolo].ia,{fuga:0,arrende:false,apre:null},o||{});
 // mostro(id, nome, famiglia, livello, ruolo, {tipo (danno), capo, poteri, hook, res, vuln, imm, immStati, ia, st:{correzioni ai numeri}, desc})
 function mostro(id,nome,fam,liv,ruolo,o){o=o||{};const s=stat(liv,ruolo,o.capo),c=o.st||{};
  const m={id,nome,fam,liv,ruolo,capo:!!o.capo,pf:s.pf+(c.pf||0),ca:s.ca+(c.ca||0),att:s.att+(c.att||0),dan:Object.assign({},s.dan,{tipo:o.tipo||'taglio'},c.dan||{}),cd:s.cd,
   salv:Object.fromEntries(['for','des','cos','int','sag','car'].map(k=>[k,s.salv+((c.salv||{})[k]||0)])),iniz:s.iniz+(c.iniz||0),mov:s.mov+(c.mov||0),gitt:s.gitt,
   xp:(15+10*liv)*(o.capo?5:1),poteri:o.poteri||[],hook:o.hook||{},res:o.res||[],vuln:o.vuln||[],imm:o.imm||[],immStati:o.immStati||(o.capo?['stordito']:[]),ia:ia0(ruolo,o.ia),desc:o.desc||''};
  M[id]=m;ORDINE.push(id)}
 // bestie
 mostro('lupo-grigio','Lupo grigio','bestie',1,'bruto',{tipo:'perforante',hook:{branco:true},st:{mov:2,pf:-2},ia:{mira:'debole',fuga:.25},desc:'Cacciano in branco: due lupi vicini al bersaglio si coprono a vicenda.'});
 mostro('sciame-di-corvi','Sciame di corvi','bestie',2,'sciame',{tipo:'perforante',poteri:['m-sciame'],res:ST.FISICI,st:{mov:2},desc:'Una nuvola nera di becchi. I colpi singoli lo scalfiscono appena.'});
 mostro('cinghiale-irsuto','Cinghiale irsuto','bestie',3,'bruto',{tipo:'perforante',poteri:['m-carica'],desc:'Testardo, cattivo e veloce quando carica.'});
 mostro('ragno-tessitore','Ragno tessitore','bestie',4,'tiratore',{tipo:'perforante',poteri:['m-ragnatela','m-morso-velenoso'],immStati:['impigliato'],ia:{apre:'m-ragnatela',dist:'media'},desc:'Imprigiona la preda nella tela, poi la morde.'});
 mostro('orso-bruno','Orso bruno','bestie',5,'bruto',{tipo:'taglio',poteri:['m-artigli'],st:{dan:{n:1}},ia:{mira:'vicino'},desc:'Enorme e solitario: due zampate che fanno tremare le ossa.'});
 // banditi
 mostro('brigante','Brigante','banditi',1,'bruto',{tipo:'taglio',poteri:['m-sabbia'],ia:{arrende:true,fuga:.3,apre:'m-sabbia'},desc:'Un malvivente con una spada arrugginita e poca voglia di morire.'});
 mostro('arciere-bandito','Arciere bandito','banditi',2,'tiratore',{tipo:'perforante',poteri:['m-freccia-avvelenata'],ia:{arrende:true,fuga:.3,mira:'incantatore'},desc:'Tiene la distanza e colpisce chi ha l\'aria più fragile.'});
 mostro('cerusico-di-strada','Cerusico di strada','banditi',3,'supporto',{tipo:'contundente',poteri:['m-impacco','m-benedizione-sporca'],ia:{arrende:true,fuga:.4},desc:'Rattoppa i compari e li incita; se resta solo, si arrende.'});
 mostro('tagliagole','Tagliagole','banditi',4,'bruto',{tipo:'perforante',poteri:['m-colpo-a-tradimento'],st:{iniz:2},ia:{mira:'debole',arrende:true,fuga:.25},desc:'Colpisce chi è già ferito.'});
 mostro('stregone-rinnegato','Stregone rinnegato','banditi',5,'incantatore',{tipo:'fuoco',poteri:['m-dardo-ardente','m-nube-nera'],ia:{arrende:true,fuga:.35,apre:'m-nube-nera'},desc:'Un mago cacciato dall\'accademia che vende le sue fiamme al miglior offerente.'});
 mostro('capobanda-corvino','Corvino, il capobanda','banditi',5,'bruto',{capo:true,tipo:'taglio',st:{pf:-18,dan:{n:3,bonus:5}},poteri:['m-doppio-fendente','m-grido-di-raduno','m-ultima-carta'],ia:{apre:'m-grido-di-raduno',mira:'debole'},desc:'Il capo dei Corvi di strada: due lame, nessuno scrupolo. Quando cade, i suoi si arrendono.'});
 // non morti
 mostro('scheletro-armato','Scheletro armato','nonmorti',2,'bruto',{tipo:'taglio',vuln:['contundente'],imm:['veleno'],immStati:['avvelenato'],desc:'Ossa tenute insieme da una volontà non sua. I colpi pesanti lo spaccano.'});
 mostro('arciere-scheletro','Arciere scheletro','nonmorti',3,'tiratore',{tipo:'perforante',vuln:['contundente'],imm:['veleno'],immStati:['avvelenato'],desc:'Non si stanca mai di tendere l\'arco.'});
 mostro('ghoul-di-tomba','Ghoul di tomba','nonmorti',4,'bruto',{tipo:'taglio',poteri:['m-artigli-gelidi'],res:['necrotico'],imm:['veleno'],immStati:['avvelenato'],desc:'Gli artigli paralizzano chi non è abbastanza forte.'});
 mostro('anima-in-pena','Anima in pena','nonmorti',5,'incantatore',{tipo:'necrotico',poteri:['m-tocco-gelido','m-lamento'],res:ST.FISICI,imm:['veleno','necrotico'],vuln:['radioso'],immStati:['avvelenato'],ia:{apre:'m-lamento'},desc:'Un fantasma che gli attacchi comuni attraversano. La luce lo ferisce.'});
 mostro('officiante-spolpato','Officiante spolpato','nonmorti',6,'supporto',{tipo:'necrotico',poteri:['m-richiamo-delle-ossa','m-maledizione'],res:['necrotico'],imm:['veleno'],vuln:['radioso'],immStati:['avvelenato'],ia:{mira:'alleato-ferito'},desc:'Un sacerdote senza carne che prega ancora per i morti.'});
 mostro('re-senza-corona','Il Re senza corona','nonmorti',7,'bruto',{capo:true,tipo:'necrotico',st:{pf:24,dan:{n:4,bonus:6}},poteri:['m-corona-spezzata','m-comando-mortale','m-doppio-fendente'],res:['necrotico'],imm:['veleno'],vuln:['radioso'],immStati:['stordito','avvelenato'],ia:{apre:'m-corona-spezzata',mira:'vicino'},desc:'Il sovrano caduto che porta la corona spezzata del regno.'});
 // creature della torre
 mostro('famiglio-arcano','Famiglio arcano','torre',3,'supporto',{tipo:'fulmine',poteri:['m-scudo-arcano'],ia:{mira:'alleato-ferito',dist:'lontana'},desc:'Un piccolo corvo di luce che protegge gli altri guardiani.'});
 mostro('statua-vivente','Statua vivente','torre',4,'bruto',{tipo:'contundente',poteri:['m-schianto'],res:['taglio','perforante'],imm:['veleno'],immStati:['avvelenato'],st:{mov:-1,pf:-10,dan:{n:1}},desc:'Pietra scolpita a forma di guardia. Lenta, ma colpisce come una frana.'});
 mostro('sciame-di-scintille','Sciame di scintille','torre',5,'sciame',{tipo:'fulmine',poteri:['m-scarica'],res:ST.FISICI,imm:['fulmine'],st:{mov:2},desc:'Luci elettriche che saltano da una cosa all\'altra.'});
 mostro('ombra-del-corvo','Ombra del corvo','torre',6,'tiratore',{tipo:'necrotico',poteri:['m-assalto-d-ombra'],res:['necrotico'],ia:{apre:'m-assalto-d-ombra',mira:'incantatore'},desc:'Una sagoma senza volto che tira lame d\'ombra.'});
 mostro('custode-fiammeggiante','Custode fiammeggiante','torre',7,'incantatore',{tipo:'fuoco',poteri:['m-getto-di-fuoco','m-dardo-ardente'],imm:['fuoco'],vuln:['gelo'],immStati:['in-fiamme'],ia:{apre:'m-getto-di-fuoco'},desc:'Armatura vuota, fuoco dentro. Il gelo lo spegne.'});
 mostro('maestro-della-torre','Il Maestro della Torre','torre',8,'incantatore',{capo:true,tipo:'fulmine',poteri:['m-fulmine-a-catena','m-gelo-del-corvo','m-occhi-di-corvo','m-ultima-carta'],imm:['fulmine'],ia:{apre:'m-occhi-di-corvo',dist:'media',mira:'curatore'},st:{ca:1,att:2,pf:160,dan:{n:4,bonus:8}},desc:'Il mago che comanda i corvi: lampi, gelo e uno sguardo che toglie la forza.'});
 const ID=ORDINE.slice();
 const per=(fam,capo)=>ID.filter(i=>M[i].fam===fam&&M[i].capo===!!capo);
 // un mostro pronto per la battaglia; `id` è l'identificatore nello scontro (due lupi: 'lupo-grigio#1', 'lupo-grigio#2')
 function combattente(def,o){o=o||{};const m=M[def];if(!m)throw new Error('mostro sconosciuto: '+def);
  return{id:o.id||def,def,nome:m.nome,lato:'nemici',tipo:'mostro',fam:m.fam,ruolo:m.ruolo,capo:m.capo,liv:m.liv,hp:m.pf,hpMax:m.pf,temp:0,ca:m.ca,att:m.att,magia:m.att,dan:Object.assign({},m.dan),
   salv:Object.assign({},m.salv),cd:m.cd,iniz:m.iniz,mov:m.mov,gitt:m.gitt,gittaLunga:null,crit:20,res:m.res.slice(),vuln:m.vuln.slice(),imm:m.imm.slice(),immStati:m.immStati.slice(),stati:[],modPrim:0,
   conc:0,concMax:0,usi:{},poteri:['attacco'].concat(m.poteri),hook:Object.assign({},m.hook),ia:Object.assign({},m.ia),xp:m.xp,abil:{perc:10+Math.floor(m.liv/2),fur:2+Math.floor(m.liv/2),med:0}}}
 // esperienza di una battaglia vinta, da dividere fra gli eroi
 const xpTotale=defs=>defs.reduce((a,d)=>a+M[d].xp,0);
 return{FAMIGLIE,RUOLI,M,ID,stat,per,mostro,combattente,xpTotale}})();
if(typeof module!=='undefined')module.exports=BEST;
