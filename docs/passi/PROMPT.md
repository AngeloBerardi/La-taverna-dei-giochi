# Prompt per partire

Generato da `npm run passi -- --scrivi`: non modificarlo a mano.

Per ogni fase c'è **un solo prompt**: lo scrivi in una chat nuova di Claude Code e l'orchestratore apre da sé una sessione per ogni passo (in parallelo, ognuna col suo modello), fa i controlli e ti restituisce le PR da unire.
Se preferisci fare a mano, ogni passo ha la sua riga: una chat nuova per riga, col modello indicato.

## Fase 1

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 1
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 01 Spezzare il motore del mondo | Sonnet 5.5 · alto | `/passo 01` | Opus 5.5 · alto: `/controllo 01` |
| 02 Spezzare la vista | Sonnet 5.5 · medio | `/passo 02` | Opus 5.5 · alto: `/controllo 02` |
| 03 Completare le tracce del mondo vivo | Opus 5.5 · alto | `/passo 03` | Haiku 5.5 · basso: `/controllo 03` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 2.

## Fase 2

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 2
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 04 Ganci, interruttori e file vuoti | Sonnet 5.5 · alto | `/passo 04` | Opus 5.5 · alto: `/controllo 04` |
| 05 La mappa non va più nel vuoto | Sonnet 5.5 · basso | `/passo 05` | Opus 5.5 · basso: `/controllo 05` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 3.

## Fase 3

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 3
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 06 Il motore delle battaglie grandi | Sonnet 5.5 · medio | `/passo 06` | Opus 5.5 · alto: `/controllo 06` |
| 07 Un mondo più vasto con una geografia sensata | Sonnet 5.5 · alto | `/passo 07` | Opus 5.5 · alto: `/controllo 07` |
| 08 HUD del mondo: numeri con un nome, mappa sempre in vista | Sonnet 5.5 · medio | `/passo 08` | Opus 5.5 · basso: `/controllo 08` |
| 09 L'incontro: due stendardi faccia a faccia | Sonnet 5.5 · medio | `/passo 09` | Opus 5.5 · basso: `/controllo 09` |
| 10 Le voci dei compagni in battaglia (testi) | Opus 5.5 · medio | `/passo 10` | Haiku 5.5 · basso: `/controllo 10` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 4.

## Fase 4

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 4
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 11 Reparti, settori e ondate (motore) | Sonnet 5.5 · alto | `/passo 11` | Opus 5.5 · alto: `/controllo 11` |
| 12 Il rango dei comandanti nel mondo | Sonnet 5.5 · medio | `/passo 12` | Opus 5.5 · alto: `/controllo 12` |
| 13 Il luogo come una piazza, il mercato come un banco | Sonnet 5.5 · medio | `/passo 13` | Opus 5.5 · basso: `/controllo 13` |
| 14 Disegnare il mondo grande | Sonnet 5.5 · medio | `/passo 14` | Opus 5.5 · basso: `/controllo 14` |
| 15 Le aperture della sorte (testi) | Opus 5.5 · medio | `/passo 15` | Haiku 5.5 · basso: `/controllo 15` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 5.

## Fase 5

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 5
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 16 Morale dei reparti, fatica, frecce e lo stendardo nemico | Sonnet 5.5 · alto | `/passo 16` | Opus 5.5 · alto: `/controllo 16` |
| 17 Le stagioni (motore) | Sonnet 5.5 · alto | `/passo 17` | Opus 5.5 · alto: `/controllo 17` |
| 18 Il menu dell'Avventura e la nuova campagna | Sonnet 5.5 · medio | `/passo 18` | Opus 5.5 · basso: `/controllo 18` |
| 19 Il tavolo dello schieramento (vista) | Sonnet 5.5 · medio | `/passo 19` | Opus 5.5 · basso: `/controllo 19` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 6.

## Fase 6

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 6
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 20 Rilascio 1: interfaccia | Sonnet 5.5 · basso | `/passo 20` | Opus 5.5 · basso: `/controllo 20` |
| 21 Il consiglio di guerra: ranghi 0–2 e dottrine | Sonnet 5.5 · alto | `/passo 21` | Opus 5.5 · alto: `/controllo 21` |
| 22 HUD della battaglia: reparti, ondate, mini-mappa | Sonnet 5.5 · medio | `/passo 22` | Opus 5.5 · basso: `/controllo 22` |
| 23 Molti regni alla nascita | Sonnet 5.5 · alto | `/passo 23` | Opus 5.5 · alto: `/controllo 23` |
| 24 Le stagioni sulla mappa | Sonnet 5.5 · basso | `/passo 24` | Opus 5.5 · basso: `/controllo 24` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 7.

## Fase 7

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 7
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 25 Manovre da comandante: ranghi 3 e 4 | Sonnet 5.5 · alto | `/passo 25` | Opus 5.5 · alto: `/controllo 25` |
| 26 Grandi schiere nella vista | Sonnet 5.5 · medio | `/passo 26` | Opus 5.5 · basso: `/controllo 26` |
| 27 L'unificazione dei regni | Sonnet 5.5 · alto | `/passo 27` | Opus 5.5 · alto: `/controllo 27` |
| 28 Le doti dei compagni in campo (motore) | Sonnet 5.5 · medio | `/passo 28` | Haiku 5.5 · basso: `/controllo 28` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 8.

## Fase 8

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 8
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 29 Rilascio 2: grandi battaglie | Sonnet 5.5 · medio | `/passo 29` | Opus 5.5 · alto: `/controllo 29` |
| 30 Il maestro di guerra: rango 5, memoria e inganno | Opus 5.5 · alto | `/passo 30` | Opus 5.5 · alto: `/controllo 30` |
| 31 La regia della battaglia | Sonnet 5.5 · medio | `/passo 31` | Opus 5.5 · basso: `/controllo 31` |
| 32 Prima della battaglia: la strategia | Sonnet 5.5 · alto | `/passo 32` | Opus 5.5 · alto: `/controllo 32` |
| 33 La sorte ti getta nel mondo | Sonnet 5.5 · medio | `/passo 33` | Haiku 5.5 · basso: `/controllo 33` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 9.

## Fase 9

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 9
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 34 Rilascio 3: comandanti | Sonnet 5.5 · medio | `/passo 34` | Opus 5.5 · alto: `/controllo 34` |
| 35 La sfida al capo | Sonnet 5.5 · alto | `/passo 35` | Opus 5.5 · alto: `/controllo 35` |
| 36 L'economia del mondo | Sonnet 5.5 · alto | `/passo 36` | Opus 5.5 · alto: `/controllo 36` |
| 37 Il peso della mischia | Sonnet 5.5 · medio | `/passo 37` | Opus 5.5 · basso: `/controllo 37` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 10.

## Fase 10

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 10
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 38 Rilascio 4: nuova campagna | Sonnet 5.5 · medio | `/passo 38` | Opus 5.5 · alto: `/controllo 38` |
| 39 Le voci dei compagni sullo schermo | Sonnet 5.5 · basso | `/passo 39` | Opus 5.5 · basso: `/controllo 39` |
| 40 Eserciti dei regni e adunate | Sonnet 5.5 · alto | `/passo 40` | Opus 5.5 · alto: `/controllo 40` |
| 41 Feudi vivi: costruire (motore) | Sonnet 5.5 · alto | `/passo 41` | Opus 5.5 · alto: `/controllo 41` |
| 42 Gli incontri del crocevia (testi) | Opus 5.5 · medio | `/passo 42` | Haiku 5.5 · basso: `/controllo 42` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 11.

## Fase 11

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 11
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 43 Affari della compagnia: botteghe e carovane | Sonnet 5.5 · alto | `/passo 43` | Opus 5.5 · alto: `/controllo 43` |
| 44 Gli incontri del crocevia (motore) | Sonnet 5.5 · medio | `/passo 44` | Opus 5.5 · alto: `/controllo 44` |
| 45 Feudi e affari nella vista | Sonnet 5.5 · medio | `/passo 45` | Opus 5.5 · basso: `/controllo 45` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase 12.

## Fase 12

Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:

```
/fase 12
```

<details><summary>A mano, un passo per chat</summary>

| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |
|---|---|---|---|
| 46 Rilascio 5: eserciti e mondo vivo | Sonnet 5.5 · medio | `/passo 46` | Opus 5.5 · alto: `/controllo 46` |

</details>

**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase — fine del piano.
