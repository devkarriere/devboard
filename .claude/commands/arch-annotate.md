---
description: Annotiert alle React-Quellcode-Dateien unter dem uebergebenen Pfad mit JSDoc @arch-* Tags und schreibt Markdown-Sidecars fuer komplexe Knoten. Fuer die Architektur-Karte (architektur2 / Stufe 2 - Inhalt-Anreicherung).
argument-hint: <pfad-zum-src-ordner>
---

# Architektur-Annotation: Inhalte (Stufe 2)

Du sollst den React-Quellcode unter **`$ARGUMENTS`** mit Annotationen versehen, sodass der Architektur-Generator (`generate-skeleton.cjs`) reichhaltige Beschreibungen fuer das Detail-Panel der Architektur-Karte erzeugt.

**Konzentriere dich AUSSCHLIESSLICH auf die Erklaerung der Knoten — nicht auf die Lernreise.** Lernreise (`@arch-step` Tags) ist Aufgabe eines separaten Commands.

---

## Workflow

1. **Liste** alle `.ts` / `.tsx` Dateien rekursiv unter `$ARGUMENTS`.
2. **Skippe** Dateien, die keinen Architektur-Knoten ergeben:
   - `*.d.ts` (Type-Definitionen)
   - `*.test.*`, `*.spec.*` (Tests)
   - `vite-env.d.ts`, `setupTests.ts`, `reportWebVitals.ts`
   - leere oder fast-leere Dateien
3. **Pro verbleibender Datei**:
   - Lies die Datei und verstehe ihre Rolle (Komponente / Hook / Reducer / Context / Type / Entry / Router-Layout / View)
   - **Fuege JSDoc** mit `@arch-*` Tags direkt vor dem Hauptexport hinzu (`export default function`, `export function`, `export const`)
   - **Entscheide**: braucht es ein Sidecar? (Kriterien siehe unten)
   - Wenn ja: schreibe `<basename>.arch.md` neben die Datei
4. **Berichte am Ende**: Liste der annotierten Dateien (mit gesetzten Tags) + erstellte Sidecars + uebersprungene Dateien (mit Begruendung).

---

## JSDoc-Format

Direkt vor dem Hauptexport, NIEMALS innerhalb der Funktion oder am Datei-Anfang:

```ts
/**
 * @arch-badge <Kurz-Label>
 * @arch-subtitle <Eine Zeile>
 * @arch-summary <Ein Satz>
 */
export function MeinHook(...) { ... }
```

### Tag-Tabelle (alle optional)

| Tag | Wann setzen? | Beispiel |
|---|---|---|
| `@arch-badge` | **fast immer** — Kurz-Label oben rechts am Knoten | `Custom Hook`, `Komponente`, `Reducer`, `Context`, `Layout`, `Browser-API`, `Typ`, `Route /overview` |
| `@arch-subtitle` | wenn der Zweck mit einer Zeile praegnanter wird als der Funktionsname allein | `Isolierter State pro Eingabefeld · 7× aufgerufen` |
| `@arch-summary` | **fast immer** — was tut der Knoten und WARUM (1 Satz) | `Kapselt useState + Validierung in einem wiederverwendbaren Hook.` |
| `@arch-id` | NUR wenn die Default-ID (lowercase basename) eine schlechte Lesbarkeit hat | `@arch-id deletebutton` (Datei heisst `DelelteButton.tsx` mit Tippfehler) |
| `@arch-type` | NUR wenn die Auto-Klassifikation falsch ist | sehr selten |
| `@arch-group` | NUR wenn die Auto-Gruppe nicht passt | sehr selten |

### Wichtige Regel

**Schreibe keine Tags, die nur die Auto-Erkennung wiederholen.** Wenn `useFormInput.ts` automatisch Title `useFormInput` und Badge `Custom Hook` bekommt, brauchst du nur `@arch-summary` und ggf. `@arch-subtitle`. Vermeide Redundanz.

### Sprache

Schreibe **in der Sprache des Projekts** (i. d. R. Deutsch, an Kommentaren / vorhandenen Annotationen erkennbar). Halte dich an den Tonfall des restlichen Quellcodes.

---

## Sidecar — wann wichtig, wann nicht?

### Sidecar JA bei

Knoten, die einen **lehrreichen Mehrwert** bieten — d. h. ein Lernender soll dort verweilen und etwas verstehen:

- **Custom Hooks** mit nicht-trivialer Logik (`useFormInput`, `useDebounce`, `useFetch`)
- **Reducer / Context** — Schluesselkonzepte fuer State-Management
- **Container-Komponenten** mit komplexer Datenfluss-Logik (`UserForm`, `EditView`)
- **Layouts mit Outlet-Routing** — wenn das Routing-Konzept erklaert werden muss
- **Knoten mit Code-Highlights**, die im Detail-Panel gezeigt werden sollen
- **Stolperfallen / Merksaetze** (z. B. "Hook-Reihenfolge ist State-Identitaet")

### Sidecar NEIN bei

- **Reine Praesentations-Komponenten** ohne eigene Logik (`TextInput`, `DateInput`, `SelectInput`, `SubmitButton`, `DeleteButton`)
- **Type-Definitionen** (`User.ts`, `Validation.ts`)
- **Trivialer Entry-Code** (`main.tsx` ist meist nur `createRoot().render(<App/>)`)
- **Knoten, deren Verstaendnis schon aus `@arch-summary` klar ist**

**Faustregel**: Wenn du fuer den Sidecar weniger als 3 nicht-redundante Saetze schreiben kannst, lass ihn weg.

---

## Sidecar-Format

```markdown
---
node: <knoten-id>
---

## <Section-Titel 1>

Markdown-Body. Unterstuetzt **bold**, *italic*, `inline code`, Listen,
Blockquotes. Mehrzeilige Absaetze sind Paragraphs (durch Leerzeile trennen).

## <Section-Titel 2>
\`\`\`ts
const beispiel = "code";
\`\`\`

## <Section-Titel 3>
> :::callout
> Merksatz oder Stolperfalle. Unterstuetzt **bold** im Inline.
> :::
```

### Section-Klassifikation (passiert automatisch im Generator)

| Inhalt unter `## ` | wird zu |
|---|---|
| Reiner fenced code block (nichts drumherum) | `code`-Section (Monospace) |
| Blockquote mit `> :::callout` ... `> :::` | `callout`-Section (hervorgehobener Merksatz) |
| Sonst (Text, Listen, gemischt) | `body`-Section (HTML-Markdown) |

### Section-Anzahl

Halte dich an **2-4 Sections** pro Sidecar. Mehr verwaessert. Typische Struktur:

1. **"Wozu dient X?"** — body, erklaerendes WAS+WARUM
2. **"Code-Highlight"** oder **"Beispiel"** — code, das zentrale Pattern
3. **"Merke"** oder **"Stolperfalle"** — callout, ein praegnanter Merksatz

---

## Beispiele

### Beispiel A: Custom Hook (Sidecar wichtig)

`src/hooks/useFormInput.ts`:

```ts
import { ChangeEvent, useState } from "react";
import { ValidationError } from "../types/Validation";

/**
 * @arch-badge Custom Hook
 * @arch-subtitle Isolierter State pro Eingabefeld · 7× aufgerufen
 * @arch-summary Kapselt useState + Validierung in einem wiederverwendbaren Hook.
 */
export function useFormInput(value: string, required = false) { ... }
```

`src/hooks/useFormInput.arch.md`:

```markdown
---
node: useforminput
---

## Wozu dient dieser Hook?

Der Hook buendelt drei Aufgaben fuer ein Eingabefeld: lokalen **State** halten, eine **Validierungs-Funktion** anbieten und einen **onChange-Handler** zurueckgeben. Statt diese Stuecke in jedem Form-Feld zu wiederholen, ruft `UserForm` den Hook 7× auf — je einen Aufruf pro Feld.

## Code-Highlight
\`\`\`ts
const { value, handleInputChangeEvent, error } = useFormInput("", true);
\`\`\`

## Merke
> :::callout
> Jeder Hook-Aufruf erzeugt einen **eigenen** State-Slot — Reacts Hook-Identitaet ist die Aufruf-Reihenfolge, nicht der Argument-Wert.
> :::
```

### Beispiel B: Praesentations-Komponente (KEIN Sidecar)

`src/components/SubmitButton/SubmitButton.tsx`:

```ts
/**
 * @arch-badge Komponente
 * @arch-subtitle Submit-Button fuer Formulare
 * @arch-summary Triggert die Form-Submission via onClick-Prop.
 */
function SubmitButton({ onClick }: SubmitButtonProps) { ... }
```

→ Kein Sidecar, weil die Komponente trivial ist und der Summary alles sagt.

### Beispiel C: Reducer (Sidecar wichtig)

`src/hooks/userManagementReducer.ts`:

```ts
/**
 * @arch-badge Reducer
 * @arch-subtitle Pure (state, action) → state fuer User-CRUD
 * @arch-summary Verwaltet ADD_USER / REMOVE_USER / UPDATE_USER und persistiert nach localStorage.
 */
export default function userManagementReducer(...) { ... }
```

`src/hooks/userManagementReducer.arch.md`:

```markdown
---
node: usermanagementreducer
---

## Reducer-Pattern

`(prevState, action) => newState` ohne Seiteneffekte — bis auf einen: `localStorage.setItem`. Der einzige Ort, an dem das User-Array veraendert wird. So bleibt die Quelle der Wahrheit zentral.

## Action-Typen
\`\`\`ts
type UserManagementAction =
  | { type: "ADD_USER"; user: User }
  | { type: "REMOVE_USER"; user: User }
  | { type: "UPDATE_USER"; user: User };
\`\`\`

## Merke
> :::callout
> Persistenz steht im **Reducer**, nicht in den Views. Eine zentrale Stelle, die nach jeder Mutation schreibt — keine Sync-Probleme zwischen Views.
> :::
```

### Beispiel D: Context (Sidecar wichtig, kurz)

`src/context/UserContext.ts`:

```ts
/**
 * @arch-badge Context
 * @arch-subtitle Globale Bruecke users + dispatch
 * @arch-summary Macht den User-State und die Reducer-dispatch-Funktion ohne Prop-Drilling allen Komponenten zugaenglich.
 */
export const UserContext = createContext<UserContextType>({ ... });
```

`src/context/UserContext.arch.md`:

```markdown
---
node: usercontext
---

## Wozu Context?

Ohne Context muesste jede tief verschachtelte Komponente (`UserCard` → `DeleteButton`) die `dispatch`-Funktion via Props bekommen. Context "teleportiert" den State an die Stelle, wo er gebraucht wird — `useContext(UserContext)` reicht.

## Merke
> :::callout
> Context ist fuer **State, der wirklich global ist**. Nicht jede gemeinsam genutzte Variable gehoert hierher — sonst rerendern alle Konsumenten bei jeder Aenderung.
> :::
```

### Beispiel E: Type (KEIN Sidecar)

`src/types/User.ts`:

```ts
/**
 * @arch-badge Typ
 * @arch-subtitle Datenmodell eines Users
 * @arch-summary Zentrales Type-Alias fuer alle User-Operationen (Create, Read, Update, Delete).
 */
export type User = { ... };
```

→ Kein Sidecar, Types sind selbsterklaerend.

### Beispiel F: Layout-Router (Sidecar optional)

`src/routes/Root.tsx`:

```ts
/**
 * @arch-badge Layout
 * @arch-subtitle Root-Layout: Sidebar + Outlet
 * @arch-summary Persistente App-Shell. Sidebar links, Outlet rechts wechselt je nach Route.
 */
function Root() { ... }
```

→ Sidecar nur, wenn das Layout-Konzept fuer Lernende neu ist. Bei Standard-React-Router-Layout: optional.

---

## Wichtige Regeln (Checkliste)

- [ ] **Aendere keine Logik** — nur Comments und neue `.arch.md`-Dateien
- [ ] **Lies die Datei vor dem Annotieren** — Tags muessen zum Inhalt passen
- [ ] **Schreibe in Projekt-Sprache** (Deutsch bei diesem Projekt)
- [ ] **Bleib konkret und kurz** — `summary` = EIN Satz, `subtitle` = EINE Zeile
- [ ] **Im Zweifel weglassen** — der Generator hat sinnvolle Defaults
- [ ] **Pro Sidecar 2-4 Sections**, nicht mehr
- [ ] **Nutze `<basename>` aus dem Knoten-Datei-Namen fuer Sidecar-Name** (z. B. `useFormInput.ts` → `useFormInput.arch.md`)
- [ ] **YAML-Front-Matter `node: <id>`** im Sidecar — die ID ist lowercase basename (oder `@arch-id`)
- [ ] **NIEMALS `@arch-step` Tags hinzufuegen** — das ist Aufgabe des `/arch-lernreise`-Commands

---

## Output

Berichte am Ende strukturiert:

```
## Annotationen erstellt

src/hooks/useFormInput.ts
  + @arch-badge Custom Hook
  + @arch-subtitle Isolierter State pro Eingabefeld · 7× aufgerufen
  + @arch-summary Kapselt useState + Validierung in einem wiederverwendbaren Hook.
  + Sidecar: useFormInput.arch.md (3 Sections)

src/components/SubmitButton/SubmitButton.tsx
  + @arch-badge Komponente
  + @arch-subtitle Submit-Button fuer Formulare
  + @arch-summary Triggert die Form-Submission via onClick-Prop.
  (kein Sidecar - trivial)

...

## Uebersprungen

src/vite-env.d.ts            (Vite-internes Type-File)
src/main.tsx                 (Trivial Entry, default badge ausreichend)

## Nicht annotiert (Empfehlung)

(falls du dir bei einer Datei unsicher warst, hier auflisten und Begruendung)
```
