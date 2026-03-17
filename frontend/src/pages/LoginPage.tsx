import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

// Login- und Registrierungsseite
export function LoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setResetSent(true);
      }
      return;
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() || "Neuer User" } },
      });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }

    setLoading(false);
  }

  function switchMode(newMode: "login" | "register" | "forgot") {
    setMode(newMode);
    setError("");
    setResetSent(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">
            {mode === "register"
              ? "Konto erstellen"
              : mode === "forgot"
                ? "Passwort zurücksetzen"
                : "Anmelden"}
          </CardTitle>
          <CardDescription>
            {mode === "register"
              ? "Erstelle ein neues Konto für das Kanban-Board."
              : mode === "forgot"
                ? "Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten."
                : "Melde dich mit deinem Konto an."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetSent ? (
            <div className="space-y-4">
              <p className="text-sm text-green-600">
                Eine E-Mail mit einem Link zum Zurücksetzen wurde gesendet. Prüfe dein Postfach.
              </p>
              <Button variant="outline" className="w-full" onClick={() => switchMode("login")}>
                Zurück zum Login
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name-Feld nur bei Registrierung */}
                {mode === "register" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      placeholder="Dein Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">E-Mail</label>
                  <Input
                    type="email"
                    placeholder="email@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Passwort-Feld nicht bei "Passwort vergessen" */}
                {mode !== "forgot" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Passwort</label>
                    <Input
                      type="password"
                      placeholder="Mindestens 6 Zeichen"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? "Laden..."
                    : mode === "register"
                      ? "Registrieren"
                      : mode === "forgot"
                        ? "Reset-Link senden"
                        : "Anmelden"}
                </Button>
              </form>

              {/* Passwort vergessen (nur im Login-Modus) */}
              {mode === "login" && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline cursor-pointer"
                    onClick={() => switchMode("forgot")}
                  >
                    Passwort vergessen?
                  </button>
                </div>
              )}

              {/* Umschalten zwischen Login und Registrierung */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "register" ? "Schon ein Konto?" : "Noch kein Konto?"}{" "}
                <button
                  type="button"
                  className="text-primary underline cursor-pointer"
                  onClick={() => switchMode(mode === "register" ? "login" : "register")}
                >
                  {mode === "register" ? "Anmelden" : "Registrieren"}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
