import { useEffect, useState } from "react"
import { UserNameContext } from "./UserNameContext"
import { getProfileById } from "../lib/api"

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
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("467ea8de-9293-4beb-9ba2-4d5f5a6162d9")

  useEffect(() => {
    async function loadUserName() {
      const userProfile = await getProfileById(userId)
      if (userProfile) {
        setUserName(userProfile.username)
      } else {
        setUserName("empty")
      }
    }

    loadUserName()
  }, [userId])

  return (
    <UserNameContext.Provider
      value={{
        userName: userName,
        setUserName: setUserName,
        userId: userId,
        setUserId: setUserId,
      }}
    >
      {children}
    </UserNameContext.Provider>
  )
}
