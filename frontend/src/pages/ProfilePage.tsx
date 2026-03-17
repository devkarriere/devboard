import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";

// Profilseite: Hier kann der Benutzername geändert und man sich ausloggen
export function ProfilePage() {
  const { user, updateUser, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await updateUser({ name: name.trim() });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      {/* Name ändern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Benutzername ändern</CardTitle>
          <CardDescription>
            Ändere deinen Anzeigenamen für das Kanban-Board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">E-Mail</label>
              <Input value={user.email} disabled />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!name.trim() || name.trim() === user.name || loading}>
                {loading ? "Speichern..." : "Speichern"}
              </Button>
              {saved && (
                <span className="text-sm text-green-600">Gespeichert!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Passwort ändern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Passwort ändern</CardTitle>
          <CardDescription>
            Gib ein neues Passwort ein (mindestens 6 Zeichen).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Neues Passwort</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Neues Passwort"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Passwort bestätigen</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!newPassword || !confirmPassword || passwordLoading}>
                {passwordLoading ? "Speichern..." : "Passwort ändern"}
              </Button>
              {passwordSaved && (
                <span className="text-sm text-green-600">Passwort geändert!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Abmelden */}
      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" className="w-full" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
