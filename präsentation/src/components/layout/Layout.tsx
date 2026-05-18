import { Outlet } from "react-router-dom"
import Header from "./Header"

/**
 * @arch-badge Layout
 * @arch-subtitle Persistente App-Shell mit Outlet
 * @arch-summary Header oben, Outlet wechselt je nach aktiver Route den Seiten-Inhalt.
 * @arch-step 5
 */
export default function Layout() {
  return (
    <div>
      <Header />
      <main className="container mx-auto py-4">
        <Outlet />
      </main>
    </div>
  )
}
