import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { LayoutDashboard, UserCircle } from "lucide-react";

// Header-Leiste mit Navigation und Benutzeranzeige
export function Header() {
  const { user } = useAuth();

  return (
    <header className="border-b border-[#00c4e0] bg-[#0a0a0a]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo / Link zur Startseite */}
        <Link to="/boards" className="flex items-center gap-2 font-bold text-lg text-primary">
          <LayoutDashboard className="h-5 w-5" />
          Devboard
        </Link>

        {/* Benutzer-Info mit Link zur Profilseite */}
        <Link
          to="/profile"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors"
        >
          <UserCircle className="h-5 w-5" />
          <span className="font-medium text-gray-200">{user.name}</span>
        </Link>
      </div>
    </header>
  );
}
