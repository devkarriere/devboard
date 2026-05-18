---
node: boardcolumn
---

## Spalte + Drop-Zone

Die Spalte rendert ihre Tasks und doppelt als **Drop-Ziel** fuer drag-and-drop verschiebbare `TaskCard`s. Beim `onDragEnter`/`onDragOver` liest sie die *Quell-Spalte* aus dem `dataTransfer` und zeigt nur dann den blau gestrichelten "Hier ablegen"-Hinweis an, wenn die Karte *nicht* schon in dieser Spalte ist.

## Drop-Zone-Logik
```ts
function handleDragHover(event: React.DragEvent<HTMLDivElement>) {
  const column = event.dataTransfer.getData("column")
  if (isTaskInTasks(column)) {
    setIsDragHover(false)
  } else {
    setIsDragHover(true)
  }
}
```

## Stolperfalle
> :::callout
> Im aktuellen Stand ist der `handleDrop`-Pfad fuer den Spaltenwechsel noch leer (`//CALL FUNCTION TO MOVE TASK TO THIS COLUMN`) - das visuelle Feedback funktioniert, aber die Task wechselt die Spalte noch nicht. Hier muesste ein `dispatchBoard({ type: "UPDATE_TASK", data: { ...task, column: title } })` rein.
> :::
