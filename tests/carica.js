// Carica un motore (anche senza module.exports) in un contesto isolato e restituisce la costante globale.
const fs=require('fs'),vm=require('vm'),path=require('path');
module.exports=function carica(file,nome){const code=fs.readFileSync(path.join(__dirname,'../src/js/motori',file),'utf8');
 const ctx={console,Math,JSON,module:undefined};vm.createContext(ctx);vm.runInContext(code+'\n;this.__X='+nome+';',ctx);return ctx.__X};
// Generatore pseudocasuale ripetibile.
module.exports.rng=seed=>()=>((seed=seed*16807%2147483647)/2147483647);
// Carica più file nello stesso contesto (motore base + espansioni) e restituisce la costante globale.
module.exports.multi=function(files,nome){const ctx={console,Math,JSON,module:undefined};vm.createContext(ctx);
 files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/js/motori',f),'utf8'),ctx));vm.runInContext('this.__X='+nome+';',ctx);return ctx.__X};
// File della Compagnia di ventura (dadi, dati, mondo e sue estensioni, campo, stanza, audio), nell'ordine del manifest:
// un file nuovo di quella famiglia entra nei test da solo.
module.exports.VEN_FILES=require('../src/manifest.json').filter(f=>f.startsWith('src/js/motori/')).map(f=>f.slice('src/js/motori/'.length)).filter(f=>/^(27a-avv-dadi|28[j-n])/.test(f));
