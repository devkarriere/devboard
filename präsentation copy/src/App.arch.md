---
node: app
---

## Routen-Definition

Die App benutzt `createBrowserRouter` von `react-router-dom`. Alle Routen sind als verschachtelter Baum unter der Wurzel-Route definiert. Die Wurzel rendert `<Layout/>` und stellt damit Header und `<Outlet/>` bereit; die untergeordneten Routen tauschen nur den Outlet-Inhalt aus.

## Routen-Baum
```ts
[
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/profile", element: <Profile /> },
      {
        path: "/boards",
        children: [
          { index: true, element: <BoardOverview /> },
          { path: ":id", element: <BoardDetail /> },
        ],
      },
    ],
  },
]
```

## Merke
> :::callout
> Der Pfad `/boards` ist eine **Index-Route** mit Kindern - `index: true` macht `BoardOverview` zur Default-View, `:id` ist ein **Parameter**, den `BoardDetail` mit `useParams()` ausliest.
> :::
