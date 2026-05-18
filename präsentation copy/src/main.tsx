import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

/**
 * @arch-badge Entry
 * @arch-subtitle Einstiegspunkt: mountet App in #root
 * @arch-summary Haengt die App-Komponente in `<StrictMode>` und `<ThemeProvider>` eingebettet an das DOM-Element mit der id `root`.
 * @arch-step 1
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
