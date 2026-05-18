import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

/**
 * Einstiegspunkt der App. Mountet React in das DOM-Element mit ID "root".
 *
 * @arch-id main
 * @arch-type entry
 * @arch-title main.tsx
 * @arch-badge Entry
 * @arch-subtitle createRoot → <App />
 * @arch-summary Allererste Datei beim Start. Sucht <div id="root"> und ruft createRoot().render(<App />) innerhalb von StrictMode.
 * @arch-group entry
 * @arch-step 1
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
