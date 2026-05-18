---
node: boarddetail
---

## Container-View fuer ein Board

Drei Aufgaben gleichzeitig:

1. **Board laden** - `useParams()` liefert die `:id` aus der URL, `getBoardById` holt das Board aus dem localStorage.
2. **State halten** - `useReducer(useBoardDetailReducer, board)` macht das Board mutationsfaehig; alle Aenderungen laufen ueber den Reducer.
3. **Drei Spalten rendern** - `board.tasks` wird per `column`-Filter in ToDo / Progress / Done aufgeteilt und an je eine `BoardColumn` gereicht.

## Verteilung der Tasks auf Spalten
```tsx
<BoardColumn
  title="ToDo"
  tasks={board.tasks.filter((task) => task.column === "ToDo")}
  ...
/>
```

## Merke
> :::callout
> Die Tasks liegen **flach** im Board, jede Task traegt ihre Spalte selbst. Die Spalten-Komponente ist eine reine *View* - das Datenmodell hat keine getrennten Listen pro Spalte.
> :::
