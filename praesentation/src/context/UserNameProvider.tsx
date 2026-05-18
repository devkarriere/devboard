import { useState } from "react"
import { UserNameContext } from "./UserNameContext"

/**
 * @arch-badge Provider
 * @arch-subtitle UserName-State mit Initial-Load aus localStorage
 * @arch-summary Hält den Benutzernamen, initialisiert ihn beim Mount aus localStorage und stellt ihn via Context bereit.
 * @arch-step 10
 */
export default function UserNameProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [userName, setUserName] = useState(getUserNameFromLocalStorage)

  function getUserNameFromLocalStorage() {
    const storedName = localStorage.getItem("kanban-user-name")
    return storedName ?? ""
  }

  return (
    <UserNameContext.Provider
      value={{ userName: userName, setUserName: setUserName }}
    >
      {children}
    </UserNameContext.Provider>
  )
}
