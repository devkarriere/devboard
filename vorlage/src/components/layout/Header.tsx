import { Link } from "react-router-dom";
import { LayoutDashboard, UserCircle } from "lucide-react";
import { useUserName } from "@/context/UserNameContext";

/**
 * Header-Leiste mit Logo-Link zur Boards-Übersicht und Benutzeranzeige.
 *
 * @arch-id header
 * @arch-type component
 * @arch-title Header
 * @arch-badge Komponente
 * @arch-subtitle Logo-Link + Profil-Link · liest userName aus Context
 * @arch-summary Persistente Top-Bar. Links: Logo verlinkt auf /boards. Rechts: aktueller Benutzername (aus UserNameContext) als Link auf /profile.
 * @arch-group routing
 * @arch-step 2
 */
export function Header() {
  const { userName } = useUserName();

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
          <span className="font-medium text-gray-200">{userName}</span>
        </Link>
      </div>
    </header>
  );
}
