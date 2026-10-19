# Test (`tests/`)

Simulazioni dei motori in node, nessuna dipendenza. Un file `test_<gioco>.js` per motore (o variante).
- `npm test -- uno` → solo i file con "uno" nel nome. `npm run test:rapido` salta i lenti (valle, saboteur, discesa, isola, machiavelli, the_gang, regicide, scoundrel_greedy). `npm test` li esegue tutti in parallelo.
- Si carica un motore con `carica('NN-nome.js','COSTANTE')` (`carica.js`); `carica.rng(seed)` dà il generatore ripetibile. `bot_*.js` sono bot riusati da più test.
- Ogni gioco: un bot intelligente che vince e uno casuale che perde, conservazione delle carte, fine partita, azioni non valide che restituiscono `{err}`.
- Un test lento (> 10 s) va aggiunto alla lista `LENTI` in `tutti.js`.
- Test di rete a due browser: `tools/test-rete/` (manuali, fuori da `npm test`).
