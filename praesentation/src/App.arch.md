---
node: app
---

## Was passiert hier?

`App` ist die **Wurzel der Route-Konfiguration**. Sie definiert mit `createBrowserRouter` einen Routen-Baum: das `Layout` als persistente App-Shell und darunter verschachtelte Kinder für `/profile` und `/boards`. Der `:id`-Parameter unter `/boards/:id` adressiert ein konkretes Board und wird in `BoardDetail` via `useParams()` ausgelesen.

## Routen-Baum

```ts
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
}
```

## Warum der UserNameProvider aussen?

> :::callout
> Der `UserNameProvider` umhüllt den `RouterProvider`, **nicht** umgekehrt. So bleibt der Benutzername bei Routen-Wechseln erhalten — der Provider montiert sich nicht ab, der Outlet-Inhalt schon.
> :::
