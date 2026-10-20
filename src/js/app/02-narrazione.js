/* ---- narrazione ---- */
const TITLES={JH:'Il Seduttore Caduto',JD:"L'Esattore",JC:'Il Bruto delle Mura',JS:'Il Boia',QH:'La Dama Spezzata',QD:'La Tesoriera Avida',QC:'La Strega dei Rovi',QS:'La Vedova Nera',KH:'Il Martire Corrotto',KD:"Il Tiranno d'Oro",KC:'Il Signore della Guerra',KS:'Il Re Oscuro'};
const QUOTES={JH:'Un sorriso, e poi la lama.',JD:'Ogni moneta che avete... è mia.',JC:'Nessuno supera le mura!',JS:'La forca vi attende.',QH:'Anch’io amavo questo regno...',QD:'Il vostro oro non basterà.',QC:'Le spine vi stringeranno.',QS:'Il lutto vi dona.',KH:'Ho sanguinato per voi. Ora tocca a voi.',KD:'Tutto ha un prezzo. Anche la vostra vita.',KC:'La guerra è la mia corona.',KS:'Inginocchiatevi davanti all’oscurità.'};
const TAUNT=['Assaggia questo!','Tremate!','Inutili vermi!','Cadrete tutti!','Per il trono!','Patetici!'],HURT=['Argh!','Maledetti!','Non è finita!','Ngh...!','Impossibile!'];
const IMMTXT={H:'niente cure ♥',D:'niente pescate ♦',C:'niente danno doppio ♣',S:'niente scudo ♠'};
const ACTS={J:['Atto I','Le Mura'],Q:['Atto II','Le Sale della Corte'],K:['Atto III','La Sala del Trono']};
const STORY=['Una magia oscura ha corrotto i sovrani del regno.','Fanti, Regine e Re ora governano col terrore dalle loro torri.','Dalla Taverna partono gli ultimi eroi, con i loro fidi Animali.','Espugnate il castello. Sconfiggeteli... o redimeteli.'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
net={db:undefined,uid:null,code:'',ref:null,host:'',seats:[],phase:'',players:[],rev:0,un:[],names:[],doc:null};
let theme='tavolo'; // tema unico: legno, ottone e tavolo verde
let fc=ST('rg-fc')==='1';
let dorsoSel=ST('rg-dorso')||'';
function applyTheme(){document.documentElement.dataset.gt=theme;document.documentElement.dataset.dorso=dorsoSel.replace(/^dorso-/,'');document.documentElement.classList.toggle('fc',fc);document.documentElement.style.colorScheme=theme==='carta'?'light':'dark'}
