import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { NotificationToast } from "./NotificationToast";
import { useNotifications } from "@/hooks/useNotifications";

// Haupt-Layout: Header oben, Inhalt darunter, Benachrichtigungen als Toast
export function Layout() {
  const { notifications, dismiss } = useNotifications();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl p-4">
        <Outlet />
      </main>
      <NotificationToast notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
