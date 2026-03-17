import { Outlet } from "react-router-dom";
import { Header } from "./Header";

// Haupt-Layout: Header oben, Inhalt darunter
export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
