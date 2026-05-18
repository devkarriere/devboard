import { Outlet } from "react-router-dom";
import { Header } from "./Header";

/**
 * Haupt-Layout der Anwendung. Enthält den Header und einen Outlet-Container für die Routen.
 *
 * @arch-id layout
 * @arch-type router
 * @arch-title Layout
 * @arch-badge Layout
 * @arch-subtitle Header + <Outlet />
 * @arch-summary Gemeinsamer Rahmen aller Seiten. Rendert oben den Header und darunter den vom Router gelieferten Routen-Inhalt (Outlet).
 * @arch-group routing
 * @arch-step 2
 */
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
