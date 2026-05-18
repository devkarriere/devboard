---
node: theme-provider
---

## Wozu der ThemeProvider?

Der Provider haelt das aktuelle Theme (`"dark" | "light" | "system"`) im State, persistiert es im `localStorage` und macht es per Context allen Konsumenten via `useTheme()` zugaenglich. Drei Effects synchronisieren ihn mit der Welt drumherum:

- **System-Theme** - bei `theme === "system"` lauscht ein `matchMedia`-Listener auf `prefers-color-scheme` und passt die DOM-Klasse an.
- **Tastatur-Shortcut** - die Taste `d` toggelt zwischen hell und dunkel (sofern kein Modifier gedrueckt und kein Eingabefeld fokussiert ist).
- **Cross-Tab-Sync** - ein `storage`-Listener uebernimmt Theme-Aenderungen aus anderen Tabs.

## Theme auf das DOM anwenden
```ts
const root = document.documentElement
root.classList.remove("light", "dark")
root.classList.add(resolvedTheme)
```

## Merke
> :::callout
> Das eigentliche Styling passiert nicht im Provider, sondern ueber **CSS-Klassen am `<html>`-Element**. Der Provider ist nur der *Schalter* - die Tailwind-Klassen `dark:` reagieren dann automatisch.
> :::
