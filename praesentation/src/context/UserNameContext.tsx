/** @arch-step 10 */
import { createContext } from "react"

type UserNameContextType = {
  userName: string
  setUserName: (name: string) => void
}

/**
 * @arch-badge Context
 * @arch-subtitle Globaler Benutzername + Setter
 * @arch-summary Macht den eingegebenen Benutzernamen ohne Prop-Drilling allen Komponenten (z. B. TaskDialog) zugänglich.
 */
export const UserNameContext = createContext<UserNameContextType | null>(null)
