import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";

// Key für den Nutzernamen im LocalStorage
const USER_NAME_KEY = "kanban-user-name";

// Context-Typ: Enthält den aktuellen Benutzer und eine Funktion zum Aktualisieren
interface AuthContextType {
  user: User;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Nutzername aus dem LocalStorage laden (oder Standardnamen verwenden)
function loadUserName(): string {
  return localStorage.getItem(USER_NAME_KEY) || "Nutzer";
}

// Provider-Komponente – verwaltet den Nutzer im LocalStorage
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>({
    id: "user-1",
    name: loadUserName(),
  });

  // Nutzername aktualisieren und im LocalStorage speichern
  function updateUser(updated: Partial<User>) {
    setUser((prev) => {
      const newUser = { ...prev, ...updated };
      if (updated.name) {
        localStorage.setItem(USER_NAME_KEY, updated.name);
      }
      return newUser;
    });
  }

  return (
    <AuthContext.Provider value={{ user, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook zum Zugriff auf den aktuellen Benutzer
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden");
  }
  return context;
}
