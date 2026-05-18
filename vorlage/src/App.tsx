import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { UserNameProvider } from "@/context/UserNameContext";
import { Layout } from "@/components/layout/Layout";
import { BoardsPage } from "@/pages/BoardsPage";
import { BoardDetailPage } from "@/pages/BoardDetailPage";
import { ProfilePage } from "@/pages/ProfilePage";

/**
 * Router-Definition. Vier Routen (Root-Redirect, Boards-Übersicht, Board-Detail, Profil)
 * werden in den gemeinsamen Layout-Rahmen eingehängt.
 *
 * @arch-id router
 * @arch-type router
 * @arch-title createBrowserRouter
 * @arch-badge Router
 * @arch-subtitle 4 Routen (/, /boards, /boards/:id, /profile)
 * @arch-summary Erstellt den React-Router. Layout ist der gemeinsame Rahmen für alle Routen, "/" leitet auf /boards um. Basename "/devboard" für Subpath-Hosting.
 * @arch-group routing
 * @arch-step 2
 */
const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: "/", element: <Navigate to="/boards" replace /> },
        { path: "/boards", element: <BoardsPage /> },
        { path: "/boards/:id", element: <BoardDetailPage /> },
        { path: "/profile", element: <ProfilePage /> },
      ],
    },
  ],
  { basename: "/devboard" },
);

function App() {
  return (
    <UserNameProvider>
      <RouterProvider router={router} />
    </UserNameProvider>
  );
}

export default App;
