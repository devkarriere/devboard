---
node: taskdialog
---

## Form-State im Dialog

Der Dialog haelt vier eigenstaendige State-Slots fuer die Eingabefelder (Titel, Beschreibung, Zugewiesene-Person, Deadline). Beim Speichern baut er aus diesen Slots + der unveraenderten `task.id` + `task.column` ein neues Task-Objekt und ruft `onSubmitUpdate` damit auf. So bleibt der Reducer ahnungslos, *wie* das Formular intern aussieht.

## Initial-Werte aus dem Prop
```ts
const [taskTitle, setTaskTitle] = useState<string>(task.title)
const [taskDescription, setTaskDescription] = useState<string>(
  task.description ?? ""
)
const [date, setDate] = useState<Date | undefined>(
  task.deadline ? new Date(task.deadline) : undefined
)
```

## Merke
> :::callout
> Damit der Dialog beim Bearbeiten einer *anderen* Task wirklich neue Werte zeigt, gibt `BoardDetail` ihm einen `key={editTask?.id}` mit. Der Key-Wechsel zwingt React zum Remount - und damit zum neuen `useState`-Init.
> :::
