# The Mind / The Mind Extreme
**Giocatori** 2–4 · **Durata** ~20 min · **Tipo** cooperativo in tempo reale · **Licenza/marchio**: meccanica libera; nome del gioco di terzi (Wolfgang Warsch / Pandasaurus, NSV)
## Preparazione
Livello N: ognuno riceve N carte. Base: carte 1–100. Extreme: 50 bianche (1–50, crescenti) e 50 rosse (1–50, decrescenti). Vite iniziali 2/3/4 (2/3/4 giocatori), 1 shuriken; livelli 12/10/8.
## Turno
Non esistono turni: tutti toccano «pronto», poi chiunque gioca la propria carta più bassa (bianca) o più alta (rossa) quando "sente" che è il momento. Niente comunicazione. Stop ✋ ferma e ricalibra; shuriken ★ (voto unanime) scarta la carta più bassa di ognuno.
## Fine partita e punteggio
Errore = carta giocata mentre un altro ne ha una che andava prima: −1 vita, carte saltate scartate e rivelate. Premi: shuriken dopo i livelli 2,5,8; vita dopo 3,6,9 (max 5 vite, 3 shuriken). Vittoria completando l'ultimo livello; sconfitta a 0 vite.
## Varianti
Extreme: carte coperte nei livelli indicati in `BLIND` (3 bianche, 5 rosse, 6 entrambe, …); gli errori si contano a fine livello (una vita per carta giocata troppo presto).
## Casi limite
Giocate quasi simultanee online: vince l'ultima scrittura (nessun turno). Esempi del regolamento verificati: 7-14-28-20-25-23-37-48 → 1 vita; 2-13-11-28-44-42-37 → 2 vite.
**Da verificare sulla scatola**: la mappa esatta dei livelli a carte coperte (`BLIND` in `motori/11-the-mind.js`) è ricostruita.
## Test del motore (3)
`tests/test_mind.js`: bot perfetto vince 2–4 giocatori (base ed Extreme); bot con errori perde spesso; esempi del regolamento.
## Fonti
Regolamento ufficiale (consultazione dell'utente); riassunti pubblici.
