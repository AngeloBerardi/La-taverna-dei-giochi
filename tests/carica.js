// Carica un motore (anche senza module.exports) in un contesto isolato e restituisce la costante globale.
const fs=require('fs'),vm=require('vm'),path=require('path');
module.exports=function carica(file,nome){const code=fs.readFileSync(path.join(__dirname,'../src/js/motori',file),'utf8');
 const ctx={console,Math,JSON,module:undefined};vm.createContext(ctx);vm.runInContext(code+'\n;this.__X='+nome+';',ctx);return ctx.__X};
// Generatore pseudocasuale ripetibile.
module.exports.rng=seed=>()=>((seed=seed*16807%2147483647)/2147483647);
