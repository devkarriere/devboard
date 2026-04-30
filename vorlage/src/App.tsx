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
  { basename: "/devboard" }
);

function App() {
  return (
    <UserNameProvider>
      <RouterProvider router={router} />
    </UserNameProvider>
  );
}

export default App;
