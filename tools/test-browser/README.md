# Prove nel browser (Chromium headless, 390×844)

`npm run test:browser` costruisce `dist/` e lancia `run.py`; `python3 tools/test-browser/run.py nome` esegue solo gli scenari con quel nome.
Servono `python3`, `pip install playwright` e un browser per playwright. Nessuna rete: l'SDK Firebase è simulato da `stub.py` (in memoria, persiste tra i ricarichi).
Il simulatore **non** applica le regole di `firestore.rules` (solo l'intervallo minimo di 50 s tra due premi): le regole si provano nel Simulatore della console Firebase.

Per un nuovo scenario aggiungi una funzione `async def sc_nome(b, srv)` in `run.py`: usa `new_context(...)`, `page(...)` e `check(condizione, messaggio)`.
