---
node: boardoverview
---

## Container-Komponente

`BoardOverview` ist eine **Container-Komponente**: sie hält den State (Boards-Liste, neuer Board-Name) und delegiert die reine Darstellung an `BoardCard`. Die Mutationen laufen über `useReducer` mit dem `useBoardOverviewReducer` — die Komponente weiss nichts über localStorage.

## Lazy Init aus localStorage

```ts
const [boards, boardsDispatch] = useReducer(
  useBoardOverviewReducer,
  [],
  getBoards
)
```

Das dritte Argument von `useReducer` ist eine **Init-Funktion** — sie wird nur beim ersten Render aufgerufen. So lesen wir genau einmal aus localStorage und sparen uns einen `useEffect`.

## Merke
> :::callout
> `useReducer(reducer, initialArg, init)`: wenn `init` eine teure Berechnung ist (hier: localStorage-Zugriff), nutze die Drei-Argument-Form — sie läuft **nicht** bei jedem Render.
> :::
