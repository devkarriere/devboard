---
node: boardsoverviewreducer
---

## Reducer fuer die Boards-Liste

Verwaltet das Array aller Boards (`Board[]`) - im Gegensatz zum [[boarddetailreducer]] geht es hier um die *Liste*, nicht um den Inhalt eines Boards. Zwei Action-Typen sind moeglich:

- `ADD` - haengt ein neues Board an die Liste an.
- `DELETE` - entfernt ein Board per `id`.

Nach jeder Mutation persistiert der Reducer die gesamte Liste via `saveBoards` in den localStorage.

## Initial-State via Lazy-Init
```ts
const [boards, boardsDispatch] = useReducer(
  useBoardOverviewReducer,
  [],
  getBoards,            // Initializer: laedt aus localStorage
)
```

## Merke
> :::callout
> Der dritte Parameter von `useReducer` ist eine **Lazy-Init-Funktion**: sie laeuft genau einmal und liest den initialen State - hier aus dem localStorage. So muss `getBoards()` nicht bei jedem Render aufgerufen werden.
> :::
