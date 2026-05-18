import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Profile from "./pages/Profile/Profile"
import BoardOverview from "./pages/BoardOverview/BoardOverview"
import BoardDetail from "./pages/BoardDetail/BoardDetail"
import Layout from "./components/layout/Layout"

/**
 * @arch-badge Router-Setup
 * @arch-subtitle Definiert alle Routen und hängt sie an das Layout
 * @arch-summary Erzeugt den Browser-Router mit Profil-, Boards-Index- und Boards-Detail-Route und rendert sie ueber den persistenten Layout-Outlet.
 * @arch-step 1
 */
export function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/boards",
          children: [
            { index: true, element: <BoardOverview /> },
            { path: ":id", element: <BoardDetail /> },
          ],
        },
      ],
    },
  ])

  return <RouterProvider router={router}></RouterProvider>
}

export default App
