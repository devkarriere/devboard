import { useContext, useState } from "react"
import { Button } from "../../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { UserNameContext } from "../../context/UserNameContext"

/**
 * @arch-badge Route /profile
 * @arch-subtitle Benutzername-Formular
 * @arch-summary Erlaubt dem Nutzer, seinen Anzeigenamen zu setzen; schreibt ihn in den UserNameContext und in localStorage.
 * @arch-step 1
 */
export default function Profile() {
  const context = useContext(UserNameContext)
  const [username, setUsername] = useState(context?.userName ?? "")
  function handleSubmit() {
    context?.setUserName(username)
    localStorage.setItem("kanban-user-name", username)
  }

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
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button className="w-fit" onClick={handleSubmit}>
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
