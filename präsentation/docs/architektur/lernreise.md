# Lernreise: Kanban-Projekt nachbauen

Dokumentiert die Schritte, in denen das Projekt schrittweise gemeinsam mit den Lernenden aufgebaut wird. Pro Schritt gibt es eine kurze Zusammenfassung, die Lerninhalte und die konkreten Aufgaben.

---

## Schritt 0 — Vorstellung des Projekts und dessen Funktionalität

**Kurz:** Vorstellung

Das Kanban-Projekt wird vorgestellt: Boards mit Spalten und Tasks, ein Profil-Bereich und die Persistenz im Browser. Demo der fertigen App, bevor wir Schritt für Schritt nachbauen.

**Lerninhalte**
- Was ist ein Kanban-Board (Spalten, Karten, Workflow)?
- Welche Seiten hat die App: Profil, Board-Übersicht, Board-Detail?
- Welche Daten sind im Spiel: Boards, Columns, Tasks?
- Welcher Stack kommt zum Einsatz: React + React Router + TypeScript + Tailwind/shadcn?

**Aufgaben**
- Fertige App im Browser öffnen und durchklicken
- Board anlegen, Spalten ansehen, Tasks per Drag-and-Drop verschieben
- Profil setzen und Reload machen, um die Persistenz zu sehen

---

## Schritt 1 — Drei Seiten + Router (URL-basierte Navigation)

**Kurz:** Seiten + Router

Die drei Seiten Profil, Board-Übersicht und Board-Detail entstehen als Dummys mit einem einzigen `<p>`. Im `App.tsx` wird der `createBrowserRouter` aufgesetzt - noch ohne Layout. Navigation erfolgt durch direktes Ändern der URL.

**Lerninhalte**
- Komponenten als Dateien anlegen, default-exportieren und in Routen einhängen
- `createBrowserRouter` + `RouterProvider` aus `react-router-dom`
- Mapping URL-Pfad -> Komponente (`path` + `element`)
- Pfad-Parameter (`:id`) und Index-Routen (`index: true`)

**Aufgaben**
- `main.tsx` als Einstiegspunkt anlegen, der die App in `#root` mountet
- `App.tsx` mit `createBrowserRouter` und drei Routen aufsetzen (`/profile`, `/boards`, `/boards/:id`)
- `Profile.tsx`, `BoardOverview.tsx` und `BoardDetail.tsx` jeweils als Dummy mit einem `<p>` anlegen
- Im Browser durch direktes Ändern der URL zwischen den drei Seiten wechseln

---

## Schritt 2 — Board-Übersicht: Titel, Button, Grid mit BoardCards

**Kurz:** Board-Übersicht

Die Board-Übersichtsseite wird ausgebaut: Seitentitel, `Neues Board`-Button und ein Grid mit Sample-BoardCards. Die `BoardCard`-Komponente entsteht und wird in die Übersicht eingebunden. Header und Layout kommen noch nicht.

**Lerninhalte**
- Aufbau einer Seite: Heading + Aktionsbereich + Inhaltsbereich
- Tailwind-Grid-Layout (`grid`, `grid-cols-3`, `gap-4`)
- Komponenten-Aufteilung: Page-Komponente vs. Präsentations-Komponente
- Props weiterreichen (Board-Daten und Callback)
- `.map()` über statische Sample-Daten als Vorbereitung auf echten State

**Aufgaben**
- In `BoardOverview` den Titel und einen `Neues Board`-Button rendern
- Grid-Layout mit Tailwind aufbauen
- `BoardCard`-Komponente anlegen, die ein Board als Prop annimmt
- Sample-Boards anlegen und per `.map()` als `BoardCard`s rendern

---

## Schritt 3 — Board-Detail: Spalten und Tasks aufbauen

**Kurz:** Board-Detail

Die Board-Detail-Seite bekommt Zurück-Button, Titel mit Inline-Edit-Feld und drei `BoardColumn`-Spalten. In jeder Spalte werden `TaskCard`-Karten gerendert. Beide Seiten bekommen einen ersten `useState`-Slot mit einem festen Board-Objekt, das dynamisch gerendert wird.

**Lerninhalte**
- Inline-Edit-UI: Ansicht- und Bearbeitungsmodus mit einem `useState`-Boolean umschalten
- Container - Spalte - Karte als typische Listen-Hierarchie
- `useState` als erster Schritt vor Reducer und Persistenz: Daten als JS-Objekt im State
- Props-Drilling: Daten und Callbacks von Page nach Column nach Card
- Statische Struktur (drei Spalten) vs. dynamische Liste (Tasks per `.map()`)

**Aufgaben**
- In `BoardDetail` einen Zurück-Button und einen Titel-Bereich mit `useState`-Edit-Modus rendern
- `BoardColumn`-Komponente bauen (Titel, Add-Button, Bereich für Karten) und drei Instanzen in `BoardDetail` einbinden
- `TaskCard`-Komponente bauen und in `BoardColumn` pro Task rendern
- In `BoardOverview` ein Sample-Board per `useState` halten und das Grid daraus rendern
- In `BoardDetail` dasselbe: ein festes Board-Objekt via `useState`, Tasks per Spalte filtern und an `BoardColumn` weitergeben

---

## Schritt 4 — Profilseite mit Inhalt füllen

**Kurz:** Profil-Inhalt

Die Profil-Route bekommt Inhalt: Titel, eine Card mit Beschreibung, ein Eingabefeld für den Benutzernamen und einen Speichern-Button. Der Username wird lokal in `useState` gehalten - noch ohne Persistenz.

**Lerninhalte**
- Card-Layout (Header, Content, Description) als Container für Formulare
- Controlled Input: `value` aus dem State, Änderungen per `onChange`
- `useState` mit Initialwert und Typ-Inferenz
- Tailwind-Hilfsklassen für ein einfaches Formular-Layout (`mx-auto`, `max-w-md`, `flex flex-col`)

**Aufgaben**
- Profilseite mit einem `useState`-Slot für den Benutzernamen versehen
- Card mit Title und Description anlegen
- Label und Input für den Benutzernamen einbinden
- Speichern-Button platzieren (Funktion folgt in einem späteren Schritt)

---

## Schritt 5 — Header und Layout: Navigation und mittige Platzierung

**Kurz:** Header + Layout

Die Header-Komponente entsteht mit zwei `<Link>`-Einträgen zu Profil und Boards. Die Layout-Komponente kommt als persistente Shell dazu: Header oben, darunter ein `<Outlet/>`, der durch ein Container-`<main>` gleichmässig mittig platziert wird. Die Routen in `App.tsx` hängen jetzt unter Layout.

**Lerninhalte**
- `<Link>` aus `react-router-dom` statt `<a>` (kein Full-Reload)
- Layout-Routen mit `<Outlet/>` als Shell-Pattern
- Verschachtelte Routen: Layout als Wurzel, Pages als children
- Mittige Platzierung von Inhalten mit Tailwind (`container mx-auto`)

**Aufgaben**
- `Header`-Komponente anlegen mit zwei `<Link>`-Einträgen zu `/boards` und `/profile`
- `Layout`-Komponente anlegen, die Header plus ein zentriertes `<main>` mit `<Outlet/>` rendert
- In `App.tsx` die drei Routen unter Layout verschachteln (`path: "/"`, `element: <Layout/>`, `children: [...]`)
- Im Browser prüfen, dass der Header oben persistent bleibt und nur der Outlet-Inhalt wechselt

---

## Schritt 6 — Einheitliches Styling: ShadCN-Overrides, Tailwind-Theme, Hover

**Kurz:** Styling + Theme

Die ShadCN-Komponenten Card und Input bekommen einheitliche Custom-Styles. Ein eigenes Tailwind-Theme mit Projektfarben wird generiert. Buttons erhalten einen sichtbaren Hover-Effekt.

**Lerninhalte**
- ShadCN-Komponenten anpassen (`className`-Slot oder Datei direkt editieren)
- Tailwind-Theme erweitern: eigene Farb-Palette in `theme.extend` bzw. CSS-Variablen
- Pseudoklassen in Tailwind: `hover:*` und `focus:*`
- Konsistenz im UI: gleiche Card- und Input-Optik in allen Views

**Aufgaben**
- Card-Komponente in `components/ui/card.tsx` auf einheitliches Aussehen anpassen
- Input-Komponente in `components/ui/input.tsx` mit Custom-Styles versehen
- Tailwind-Theme (in `index.css` oder Config) um eigene Farben ergänzen
- Buttons mit `hover:`-State versehen (Farbe, Schatten o. ä.)

---

## Schritt 7 — Drag-and-Drop Grundgerüst: TaskCards draggable, Spalten droppable

**Kurz:** Drag & Drop

`TaskCard` wird draggable, `BoardColumn` akzeptiert Drops. Die native HTML-Drag-and-Drop-API wird verkabelt - Daten werden in dieser Stufe noch nicht verschoben.

**Lerninhalte**
- HTML-Drag-and-Drop-API: `draggable`, `onDragStart`, `onDragEnter`, `onDragOver`, `onDrop`
- DataTransfer: Quell-Spalte mit `dataTransfer.setData` weitergeben und im Drop-Handler auslesen
- `preventDefault` in `onDragOver` als Voraussetzung dafür, dass `onDrop` überhaupt feuert
- Visuelles Feedback während des Drag-Hovers per `useState`-Boolean und Tailwind-Klasse

**Aufgaben**
- `TaskCard` mit `draggable` und `onDragStart` versehen, das die Quell-Spalte in `dataTransfer` schreibt
- `BoardColumn` mit `onDragEnter`, `onDragOver` und `onDrop` versehen (Drop-Handler bleibt vorerst ein Stub)
- Drop-Zone visuell hervorheben, solange eine Karte darübergezogen wird
- Im Browser prüfen, dass die Karten verschiebbar wirken, aber noch nicht real die Spalte wechseln

---

## Schritt 8 — Create-Board-Dialog, Reducer anlegen und einbinden

**Kurz:** Dialog + Reducer

Der Dialog zum Erstellen neuer Boards wird in der `BoardOverview` aufgesetzt - zunächst nur JSX und `useState` für den Board-Namen. Danach entsteht der `useBoardOverviewReducer` als eigene Datei. Zum Abschluss wird er in `BoardOverview` über `useReducer` eingebunden und der Sample-State ersetzt.

**Lerninhalte**
- Dialog-Pattern aus ShadCN: Trigger, Content, Footer mit Cancel und Confirm
- Controlled Input in einem Dialog mit `useState`
- Reducer-Muster: Pure `(state, action) => state`, Action als diskriminiertes Objekt
- `useReducer` als Alternative zu mehreren `useState`-Slots für Listen-Operationen
- Dispatch als zentraler Eintrittspunkt für Änderungen (`dispatch({ type, data })`)

**Aufgaben**
- In `BoardOverview` einen Dialog mit Eingabefeld für den Board-Namen aufsetzen, `useState` für den Input
- Reducer-Datei `hooks/boardsOverviewReducer.ts` anlegen mit `ADD`- und `DELETE`-Action
- In `BoardOverview` `useReducer(useBoardOverviewReducer, [])` einbauen und Sample-State durch dispatch ersetzen
- Im Browser: Boards via Dialog anlegen und löschen, dispatch im Devtools nachverfolgen

---

## Schritt 9 — Board-Detail-State: Reducer, ADD/DELETE/UPDATE_TASK, TaskDialog

**Kurz:** BoardDetail-State

Die Board-Detail-Seite bekommt schrittweise echten State und persistente Operationen. Erst der Reducer mit `UPDATE_BOARD_NAME` (Titel-Edit), dann `ADD_TASK` mit einem Inline-Dialog in `BoardColumn`, dann `DELETE_TASK` mit durchgereichten Callbacks, schliesslich die `TaskDialog`-Komponente für das Bearbeiten und `UPDATE_TASK`. Bonus: `TaskDialog` auch für den Create-Flow in `BoardColumn` nutzen.

**Lerninhalte**
- Reducer mit diskriminierter Union über mehrere Action-Typen
- Listen-Operationen auf immutablem State: `map`, `filter`, Spread
- Callbacks von Page nach Column nach Card durchreichen (Props-Drilling)
- Wiederverwendbare Dialog-Komponente: gleiches JSX, einmal für Create, einmal für Edit
- Form-State in einer Dialog-Komponente kapseln (Titel, Beschreibung, Deadline)

**Aufgaben**
- Reducer `useBoardDetailReducer` mit `UPDATE_BOARD_NAME` anlegen und in `BoardDetail` für den Titel-Edit einbinden
- Inline-Dialog für das Anlegen einer Task in `BoardColumn` aufsetzen (ohne Reducer-Änderung)
- Reducer um `ADD_TASK` erweitern und mit dem Inline-Dialog in `BoardColumn` verkabeln
- Reducer um `DELETE_TASK` erweitern; Callbacks von `BoardDetail` nach `BoardColumn` nach `TaskCard` durchreichen
- `TaskDialog`-Komponente anlegen, Reducer um `UPDATE_TASK` erweitern, `TaskDialog` in `BoardDetail` für Edit einbinden
- Bonus: `TaskDialog` auch in `BoardColumn` für den Create-Flow nutzen (ersetzt den Inline-Dialog)
