---
node: boarddetailreducer
---

## Reducer-Pattern

`(prevState, action) => newState` — eine pure Funktion ohne Seiteneffekte. Bis auf **einen**: nach jeder Mutation wird `saveBoard(newState)` aufgerufen, das den Stand in localStorage schreibt. So bleibt die Persistenz an einer einzigen Stelle gebündelt.

## Action-Typen
```ts
type BoardDetailAction =
  | { type: "UPDATE_BOARD_NAME"; data: string }
  | { type: "ADD_TASK" | "DELETE_TASK" | "UPDATE_TASK"; data: Task }
  | { type: "UPDATE_TASK_STATUS"; data: { id: string; newColumn: "ToDo" | "Progress" | "Done" } }
```

## Discriminated Union

Die `type`-Eigenschaft trennt die Action-Varianten — TypeScript verengt im `switch`-Block automatisch den Typ von `action.data`. So passt `UPDATE_BOARD_NAME` mit `string` als Daten und `ADD_TASK` mit einem `Task`-Objekt in einen einzigen Reducer.

## Merke
> :::callout
> Persistenz steht im **Reducer**, nicht in den Views. Eine zentrale Stelle, die nach jeder Mutation schreibt — keine Sync-Probleme zwischen Views.
> :::
