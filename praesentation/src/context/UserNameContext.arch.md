---
node: usernamecontext
---

## Wozu Context?

Der Benutzername wird in der **Profil-Seite** gesetzt und in der **Task-Zuweisung** (TaskDialog) gelesen — beide liegen in völlig verschiedenen Teilbäumen der Routen. Statt den Wert via Props durch jede Ebene zu reichen ("Prop-Drilling"), stellt der Context ihn über `useContext(UserNameContext)` direkt am Konsumenten bereit.

## Trennung von Definition und State

```ts
export const UserNameContext = createContext<UserNameContextType | null>(null)
```

Die `.tsx`-Datei exportiert nur den **Context selbst**. Der State (`useState`) liegt im `UserNameProvider`. Diese Aufteilung erlaubt Fast-Refresh und hält die Verantwortung pro Datei klar.

## Merke
> :::callout
> Context hat einen Default-Wert (hier `null`). Konsumenten müssen mit dem Null-Fall umgehen — `context?.userName ?? ""`. Vergisst man das, crashed die Komponente ausserhalb eines Providers.
> :::
