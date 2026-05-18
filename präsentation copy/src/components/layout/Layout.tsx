import { Outlet } from "react-router-dom"
import Header from "./Header"

/**
 * @arch-badge Layout
 * @arch-subtitle Persistente Shell: Header oben, Outlet darunter
 * @arch-summary Rendert den Header und einen `<Outlet/>`, in den der React-Router je nach Route den Page-Inhalt einsetzt.
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
