---
node: boarddetailreducer
---

## Reducer fuer ein Board

`(prevState, action) => newState` ohne Seiteneffekte - bis auf einen: am Ende ruft der Reducer `saveBoard(newState)` und persistiert in den localStorage. So bleibt die Quelle der Wahrheit zentral: jede Mutation am Board geht durch genau diese Funktion.

Vier Action-Typen sind moeglich:

- `UPDATE_BOARD_NAME` - aendert nur den Titel.
- `ADD_TASK` - haengt eine Task an `tasks` an.
- `DELETE_TASK` - filtert eine Task per `id` raus.
- `UPDATE_TASK` - ersetzt eine Task durch ein neues Objekt.

## Action-Typen
```ts
type BoardDetailAction =
  | { type: "UPDATE_BOARD_NAME"; data: string }
  | { type: "ADD_TASK" | "DELETE_TASK" | "UPDATE_TASK"; data: Task }
```

## Merke
> :::callout
> Der `saveBoard`-Aufruf steht **im Reducer**, nicht in den Views. Eine zentrale Stelle, die nach jeder Mutation schreibt - keine Sync-Probleme zwischen UI-Aktionen und Persistenz.
> :::
