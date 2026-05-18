import { LayoutDashboard, UserCircle } from "lucide-react"
import { Link } from "react-router-dom"

export default function Header() {
  return (
    <header className="bg-black py-5">
      <div className="container mx-auto flex justify-between">
        <Link
          to="/boards"
          className="flex items-center gap-2 text-lg text-primary"
        >
          <LayoutDashboard className="w5 h-5" />
          Devkarriere
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-2 text-lg text-secondary hover:text-primary"
        >
          <UserCircle className="w5 h-5" />
          <span className="text-secondary">Profil</span>
        </Link>
      </div>
    </header>
  )
}
