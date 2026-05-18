import { useState } from "react"
import { Button } from "../../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import { Input } from "../../components/ui/input"

/**
 * @arch-badge Route /profile
 * @arch-subtitle Einfaches Formular fuer den Benutzernamen
 * @arch-summary Haelt den Username im lokalen `useState`-Slot - Persistenz noch nicht angebunden.
 * @arch-step 1
 */
export default function Profile() {
  const [username, setUsername] = useState("Liam")

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Profil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Benutzername ändern</CardTitle>
          <CardDescription>
            Ändere deinen Anzeigenamen für das Kanban-Board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <label>Benutzername</label>
            <Input id="username" value={username} />
            <Button className="w-fit">Speichern</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
