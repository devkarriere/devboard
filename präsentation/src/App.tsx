import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Profile from "./pages/Profile/Profile"
import BoardOverview from "./pages/BoardOverview/BoardOverview"
import BoardDetail from "./pages/BoardDetail/BoardDetail"
import Layout from "./components/layout/Layout"
import UserNameProvider from "./context/UserNameProvider"

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

  return (
    <UserNameProvider>
      <RouterProvider router={router}></RouterProvider>
    </UserNameProvider>
  )
}

export default App
