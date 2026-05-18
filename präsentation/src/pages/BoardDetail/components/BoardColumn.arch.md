---
node: boardcolumn
---

## Drag-and-Drop über Daten-Typen

Statt `dataTransfer.setData("column", value)` (ein einzelner Schlüssel) werden hier **mehrere Einträge als Typ-Strings** abgelegt: `column-ToDo`, `id-abc123`. Beim Drop iteriert die Spalte über `event.dataTransfer.types` und liest die Werte aus den Präfixen.

```ts
function getColumnFromDraggedItem(dataTransfer: DataTransfer): string | null {
  let column: string | null = null
  dataTransfer.types.forEach((type) => {
    if (type.startsWith("column-")) {
      column = type.replace("column-", "")
    }
  })
  return column
}
```

## Drop-Akzeptanz

Eine Spalte akzeptiert nur Tasks aus **anderen** Spalten — `isTaskInTasks(column)` vergleicht die Quell-Spalte mit dem eigenen Titel. So zeigt die "Hier ablegen"-Markierung nicht auf, wenn man eine Task auf ihre eigene Spalte zieht.

## Merke
> :::callout
> `event.preventDefault()` im `onDragOver` ist Pflicht — ohne diesen Aufruf feuert `onDrop` schlicht nicht. Eine der häufigsten Stolperfallen bei HTML5-DnD.
> :::
