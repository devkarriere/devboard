import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// Context-Typ: Enthält den aktuellen Benutzer, Lade-Status und Auth-Funktionen
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUser: (updated: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Profil aus der profiles-Tabelle laden
async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    email: "", // Wird unten aus der Session ergänzt
    role: data.role,
  };
}

// Provider-Komponente – verwaltet den Auth-State über Supabase
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Session und Profil laden. Falls kein Profil existiert (neuer User), wird es angelegt.
  async function loadUser(session: Session | null) {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    let profile = await fetchProfile(session.user.id);

    // Neuer User: Profil existiert noch nicht → jetzt anlegen
    if (!profile) {
      const name = session.user.user_metadata?.name ?? "Neuer User";
      await supabase
        .from("profiles")
        .insert({ id: session.user.id, name });
      profile = await fetchProfile(session.user.id);
    }

    if (profile) {
      profile.email = session.user.email ?? "";
      setUser(profile);
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    // Aktuelle Session beim Start prüfen
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session);
    });

    // Auf Auth-Änderungen reagieren (Login, Logout, Token-Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ausloggen
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  // Profil aktualisieren (z.B. Name ändern)
  async function updateUser(updated: Partial<User>) {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name: updated.name })
      .eq("id", user.id);

    if (!error) {
      setUser((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateUser }}>
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
