---
node: api
---

## localStorage als Mini-Datenbank

Statt einer echten API liegt der gesamte App-Zustand (alle Boards inkl. ihrer Tasks) als JSON-String im `localStorage` unter dem Schluessel `"boards"`. Vier Funktionen kapseln den Zugriff:

- `getBoards()` - liest und parst alle Boards.
- `getBoardById(id)` - liefert ein einzelnes Board.
- `saveBoards(boards)` - schreibt die komplette Liste zurueck.
- `saveBoard(board)` - aktualisiert ein einzelnes Board in der Liste.

So bleibt die Persistenz an *einer* Stelle - jede andere Datei importiert nur diese vier Helfer.

## Update-Pattern fuer ein einzelnes Board
```ts
const updatedBoards = boards.map((b) => {
  if (b.id === board.id) {
    return board
  } else {
    return b
  }
})
saveBoards(updatedBoards)
```

## Merke
> :::callout
> Die Reducer rufen `saveBoard`/`saveBoards` **nach jedem Update** auf - so ist localStorage immer im Sync mit dem React-State. Beim naechsten Laden initialisiert `useReducer` aus `getBoards()` und der Kreislauf schliesst sich.
> :::
