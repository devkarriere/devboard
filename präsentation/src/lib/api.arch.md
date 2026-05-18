---
node: api
---

## Persistenz-Schicht

Diese Datei kapselt **alle** Zugriffe auf `localStorage`. Komponenten und Reducer kennen nur die vier Funktionen `getBoards` / `getBoardById` / `saveBoards` / `saveBoard`. Würden wir später auf eine REST-API umstellen, müsste nur diese Datei ändern — alle Aufrufer bleiben gleich.

## Lese- und Schreibpfad

```ts
const LOCAL_STORAGE_BOARDS_KEY = "boards"

export function getBoards(): Board[] {
  const boardsStringified = localStorage.getItem(LOCAL_STORAGE_BOARDS_KEY) ?? ""
  if (boardsStringified) {
    const boards: Board[] = JSON.parse(boardsStringified) ?? []
    return boards
  }
  return []
}
```

## Merke
> :::callout
> `localStorage` speichert **nur Strings**. Objekte müssen via `JSON.stringify` / `JSON.parse` umgewandelt werden — und beim Parsen immer einen Fallback für leere oder kaputte Werte vorsehen.
> :::
