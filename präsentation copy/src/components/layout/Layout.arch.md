---
node: layout
---

## Persistente App-Shell

`Layout` ist die *einzige* Komponente, die ueber alle Routen hinweg gerendert bleibt. Header oben, ein `<main>` mit `<Outlet/>` darunter - der `Outlet` ist der Platzhalter, in den React-Router je nach aktiver Route den passenden Page-Inhalt einsetzt.

## Outlet-Pattern
```tsx
<div>
  <Header />
  <main className="container mx-auto py-4">
    <Outlet />
  </main>
</div>
```

## Merke
> :::callout
> Alles, was **ueberall sichtbar** sein soll (Header, Sidebar, Toast-Container), gehoert hier rein. Alles, was **routenabhaengig** ist, kommt durch den `<Outlet/>`.
> :::
