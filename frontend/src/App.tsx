import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { BoardsPage } from "@/pages/BoardsPage";
import { BoardDetailPage } from "@/pages/BoardDetailPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LoginPage } from "@/pages/LoginPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import type { ReactNode } from "react";

// Geschützte Route: Leitet zum Login weiter, wenn nicht eingeloggt
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Laden...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Öffentliche Route: Leitet zu /boards weiter, wenn schon eingeloggt
function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Laden...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/boards" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Login-Seite (ohne Layout) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Passwort-Reset (erreichbar über E-Mail-Link) */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Geschützte Seiten (mit Layout) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/boards" replace />} />
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/boards/:id" element={<BoardDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
