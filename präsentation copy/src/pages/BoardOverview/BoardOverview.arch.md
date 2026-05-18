---
node: boardoverview
---

## Container-View fuer die Boards-Liste

Verbindet drei Bausteine zu einer Seite:

- **State** via [[boardsoverviewreducer]] - laedt initial alle Boards aus dem localStorage, fuehrt `ADD`/`DELETE` aus.
- **UI** via `Dialog` + `Input` - der Anlegen-Dialog liest den Board-Namen in einen lokalen `useState`-Slot.
- **Liste** via `BoardCard.map(...)` - eine Karte pro Board, mit Klick zum Detail und Loeschen-Button.

## Reducer + Lazy-Init in einem Aufruf
```ts
const [boards, boardsDispatch] = useReducer(
  useBoardOverviewReducer,
  [],
  getBoards,
)
```

## Merke
> :::callout
> Der **Dispatch** kommt aus dem Reducer und wird an `handleAddNewBoard` / `handleDeleteBoard` gereicht. Diese Handler bauen Action-Objekte und uebergeben sie - so bleibt die Komponente *daten-deklarativ*, nicht mutativ.
> :::
