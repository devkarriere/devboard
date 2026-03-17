import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { getUserName } from "../lib/storage";

// Profilseite: Hier kann der Benutzername geändert werden
export function ProfilePage() {
  const [name, setName] = useState(getUserName());
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    localStorage.setItem("kanban-user-name", name.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!name.trim()}>
                Speichern
              </Button>
              {saved && (
                <span className="text-sm text-green-600">Gespeichert!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
