---
node: taskdialog
---

## Form mit lokalem State

Der Dialog hält **vier eigene useState-Felder** (Titel, Beschreibung, Zuweisung, Datum), initialisiert aus der `task`-Prop. Erst beim Klick auf "Speichern" wird die zusammengesetzte Task per `onSubmitUpdate(updatedTask)` nach oben gereicht — der Parent (BoardDetail / BoardColumn) entscheidet, ob das ein `ADD_TASK`- oder `UPDATE_TASK`-Dispatch wird.

## Wiederverwendung für "Anlegen" und "Bearbeiten"

```tsx
<TaskDialog
  title="Task bearbeiten"
  description="Bearbeite die ausgewählte Aufgabe."
  task={editTask ?? { id: "", title: "abc", description: "", column: "ToDo" }}
  onSubmitUpdate={handleUpdateTask}
  ...
/>
```

Derselbe Dialog wird zweimal verwendet — einmal von der Spalte (`Neue Task erstellen` mit leerer Task) und einmal von BoardDetail (`Task bearbeiten` mit `editTask`). Titel, Beschreibung und Callback machen den Unterschied.

## Merke
> :::callout
> Die Personen-Zuweisung kommt aus dem `UserNameContext` — der Dialog "weiss" damit ohne Prop-Drilling, welchen Benutzernamen er als Option anbieten muss.
> :::
