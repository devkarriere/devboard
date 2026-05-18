// =============================================================
// BEISPIEL — wie eine annotierte Quell-Datei aussieht
// (siehe ../02-inhalt-anreicherung.md)
//
// Vergleich mit dem realen ../../src/hooks/useFormInput.ts:
// nur die JSDoc-Blöcke sind neu. Logik und Types bleiben unverändert.
// =============================================================
import { ChangeEvent, useState } from "react";
import { ValidationError } from "../types/Validation";

/**
 * Custom Hook, der pro Eingabefeld einen eigenen State + Validierung kapselt.
 *
 * @arch-id useforminput
 * @arch-type hook
 * @arch-title useFormInput
 * @arch-badge Custom Hook
 * @arch-subtitle Isolierter State pro Eingabefeld · 7× aufgerufen
 * @arch-summary Kapselt useState + Validierung in einem wiederverwendbaren Hook.
 * @arch-group leaves
 * @arch-step 3
 *
 * Hinweis: Die längeren Erklärungen (Sections "Wozu dient dieser Hook?",
 * "Code-Highlight", "Merke") liegen in der Sidecar-Datei
 *   src/hooks/useFormInput.arch.md
 * Damit bleibt der Code lesbar.
 */
export function useFormInput(value: string, required = false) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<ValidationError>({
    isError: false,
    errorMessage: "",
  });

  function handleInputChangeEvent(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const inputValue = event.target.value;
    setInputValue(inputValue);
    validateInput(inputValue);
  }

  function validateInput(inputValue: string): boolean {
    if (required) {
      if (inputValue === "") {
        setError({ isError: true, errorMessage: "Bitte geben Sie einen Wert ein" });
        return false;
      }
      setError({ isError: false, errorMessage: "" });
      return true;
    }
    return true;
  }

  return {
    value: inputValue,
    handleInputChangeEvent,
    error,
    validateInput,
  };
}
