---
node: boarddetail
---

## Drei Spalten, ein Reducer

`BoardDetail` rendert drei `BoardColumn`-Instanzen (ToDo / Progress / Done) und filtert die Tasks pro Spalte. Alle Mutationen — Task hinzufügen, löschen, verschieben, umbenennen — gehen über **einen** zentralen Reducer. Die Spalten erhalten Callbacks (`handleAddTask`, `handleDeleteTask`, ...), die intern `dispatchBoard(...)` aufrufen.

## Filterung statt drei separater Listen

```tsx
<BoardColumn
  title="ToDo"
  tasks={board.tasks.filter((task) => task.column === "ToDo")}
  onAddTask={handleAddTask}
  onDeleteTask={handleDeleteTask}
  onUpdateTaskStatus={handleUpdateTaskStatus}
  handleEditTask={handleEditTask}
/>
```

Die Tasks liegen als **eine flache Liste** im Board-State; jede Task trägt ihre `column`-Spalten-Zugehörigkeit. Beim Rendern wird gefiltert. So vereinfacht ein Status-Wechsel sich zu einem einzigen Feld-Update.

## Merke
> :::callout
> Edit-Dialog wird mit einem `key={editTask?.id ?? "empty-0"}` neu instanziiert. Das **resettet** den internen Form-State des Dialogs jedes Mal, wenn eine andere Task bearbeitet wird — keine manuellen `setX` nötig.
> :::
