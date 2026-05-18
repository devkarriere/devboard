---
node: theme-provider
---

## Drei Quellen, ein Theme

Das Theme kann aus drei Quellen kommen: **localStorage** (zuletzt gewählt), die **System-Präferenz** (`prefers-color-scheme`) oder dem **Default** der Prop. Der Provider entscheidet beim Mount via `useState(() => ...)`-Lazy-Init, welcher Wert gilt, und reagiert anschliessend über `useEffect` auf System-Wechsel sowie localStorage-Änderungen aus anderen Tabs.

## Tastatur-Shortcut

```ts
if (event.key.toLowerCase() !== "d") return
setThemeState((currentTheme) => {
  const nextTheme = currentTheme === "dark" ? "light" : "dark"
  localStorage.setItem(storageKey, nextTheme)
  return nextTheme
})
```

Mit `D` (ausserhalb von Eingabefeldern) schaltet der Provider zwischen den Modi um. `isEditableTarget` verhindert, dass der Shortcut im Input/Textarea feuert.

## Merke
> :::callout
> Bei jedem Theme-Wechsel werden Transitions kurzzeitig per injiziertem `<style>`-Tag deaktiviert. Sonst animiert der Browser jede Farbe — was bei dunkel/hell unschön flackert.
> :::
