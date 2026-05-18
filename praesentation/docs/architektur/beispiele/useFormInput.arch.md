<!--
  BEISPIEL — Markdown-Sidecar für lange Erklär-Texte (Variante B aus ../02-inhalt-anreicherung.md).

  Diese Datei würde in echt unter
    src/hooks/useFormInput.arch.md
  liegen. Der Generator findet sie über das `node:`-Front-Matter
  und mappt jede Überschrift auf eine Section.
-->
---
node: useforminput
---

## Wozu dient dieser Hook?

Der Hook bündelt drei Aufgaben für ein Eingabefeld:

1. **State**: `useState` für den aktuellen Wert
2. **Change-Handler**: `handleInputChangeEvent` für `<input onChange={...}>`
3. **Validierung**: optional `required`, schreibt Fehler in einen zweiten State

Das Ergebnis ist ein Objekt, das die Komponente direkt in ihre Inputs spreaden kann.

## Code-Highlight

```ts
const { value, handleInputChangeEvent, error } = useFormInput("", true);
```

Im Formular ruft die `UserForm` den Hook **siebenmal** auf — einmal pro Eingabefeld. Jeder Aufruf bekommt einen **eigenen** State-Slot, weil React Hooks intern an der Aufruf-Reihenfolge erkennt.

## Merke

> :::callout
> Die Aufruf-Reihenfolge der Hooks **darf sich zwischen Renderings nicht ändern** — kein `if (...) { useState(...) }`. Sonst passt React die State-Slots falsch zu.
> :::
