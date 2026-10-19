# Test di rete (manuali)

Verificano la rete della stanza con un broker MQTT locale e due browser headless. Non fanno parte di `npm test`
perché servono dipendenze extra:

    npm i --no-save aedes ws        # broker locale
    pip install playwright          # browser headless (python)
    npm run build                   # genera dist/
    node tools/test-rete/broker.js &   # broker su ws://127.0.0.1:18840
    python3 tools/test-rete/invite.py     # invito alla stanza: l'ospite entra e l'host lo vede
    python3 tools/test-rete/takeover.py   # l'host esce: un ospite subentra e un terzo entra
    python3 tools/test-rete/valid.py      # l'host rifiuta le scritture non valide degli ospiti

Ogni script stampa PASS/FAIL o lo stato osservato.
