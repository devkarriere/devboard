# Verwendung — Architektur-Karte für ein neues React-Projekt aufsetzen

> Stand: **Stufen 1, 2 und 3 sind gebaut.** Der Generator [generate-skeleton.cjs](./generate-skeleton.cjs) erzeugt aus dem React-Quellcode automatisch Knoten, Kanten, Layout, Edge-Bending und Gruppen-Tints (Stufe 1). Inhaltsfelder (`summary`, `sections`) kommen aus JSDoc-Annotationen + optionalen Markdown-Sidecars (Stufe 2). Die Lernreise (`steps[]`) wird aus einem Manifest + `@arch-step`-Tags gebaut (Stufe 3, optional via `--lernreise`).

---

## Schnellstart (TL;DR)

In drei Schritten von „leerem Projekt" zur laufenden Karte:

**1. Dateien kopieren** — aus diesem Ordner nach `deinprojekt/docs/architektur/`:

```
generate-skeleton.cjs   ← Generator
index.html              ← Architektur-Karte
lernreise.html          ← optional (Lernreise)
styles.css
app.js                  ← Renderer + shared getEdgePath
lernreise.js            ← nur wenn lernreise.html mit
schema/architektur.schema.json
```

`architektur.json` **nicht** mitkopieren — wird in Schritt 2 erzeugt. Logo/Favicon (`DevKarriere_Logo_…png`) entweder mitkopieren oder die Pfade in den HTML-Dateien austauschen.

**2. Generator laufen lassen** — vom Projekt-Root des anderen Projekts:

```bash
node docs/architektur/generate-skeleton.cjs \
    --src src \
    --out docs/architektur/architektur.json \
    --name "MeinProjekt"
```

**3. Lokal anschauen** — `fetch('./architektur.json')` braucht HTTP, also nicht per Doppelklick:

```bash
cd docs/architektur
python3 -m http.server 8765
```

- http://localhost:8765/ — Architektur-Karte
- http://localhost:8765/lernreise.html — Lernreise (falls vorhanden)

**Optional, iterativ:** Inhalte über JSDoc-Tags (`@arch-summary`, `@arch-subtitle`, …) und `*.arch.md`-Sidecars im Quellcode pflegen — siehe [Schritt 2.5](#schritt-25--inhalte-erg%C3%A4nzen-stufe-2). Lernreise über `lernreise.json` Manifest + `@arch-step`-Tags — siehe [Schritt 2.6](#schritt-26--lernreise-stufe-3-optional). **Wichtig:** Bei jedem Generator-Lauf wird `architektur.json` überschrieben — Inhalte gehören in den Quellcode, nicht in die JSON.

---

## Voraussetzungen

| | wofür |
|---|---|
| Ein React+TypeScript-Projekt | das Du dokumentieren willst |
| `typescript` als (Dev-)Dependency | wird vom Generator zur AST-Analyse genutzt — in praktisch jedem React+TS-Projekt schon vorhanden |
| Node.js 18+ | zum Ausführen des Generators |
| Python 3 **oder** Node.js | für den lokalen Webserver beim Testen |

Die Anzeige-Schicht ist **reines HTML/CSS/Vanilla-JS** — kein Build-Schritt, keine Abhängigkeiten. Der Generator ist eine **single-file CommonJS-Datei** ohne weitere npm-Pakete.

---

## Schritt 1 — Display + Generator in dein Projekt kopieren

Lege in deinem Projekt einen Ordner an, z. B. `docs/architektur/`. Kopiere folgende Dateien aus diesem Verzeichnis ([docs/architektur2/](.)) hinein:

```
deinprojekt/
└── docs/
    └── architektur/
        ├── generate-skeleton.cjs   ← Generator (Stufe 1)
        ├── index.html              ← Architektur-Karte
        ├── lernreise.html          ← Lernreise (optional)
        ├── styles.css              ← gemeinsames CSS
        ├── app.js                  ← Renderer + Tour-Engine
        ├── lernreise.js            ← Lernreise-Renderer (nur falls lernreise.html da ist)
        ├── schema/
        │   └── architektur.schema.json
        ├── architektur.json        ← wird in Schritt 2 vom Generator erzeugt
        └── *.png                   ← optional: Logo, Favicon
```

Tipp: Logo und Favicon sind in [index.html](./index.html) und [lernreise.html](./lernreise.html) hart codiert auf `DevKarriere_Logo_…png`. Tausch sie aus oder ändere die Pfade in den HTML-Dateien.

---

## Schritt 2 — Generator laufen lassen

Vom Projekt-Root:

```bash
node docs/architektur/generate-skeleton.cjs \
    --src src \
    --out docs/architektur/architektur.json \
    --name "MeinProjekt"
```

Der Generator scannt `src/**/*.{ts,tsx}`, klassifiziert jede Datei (entry/router/view/component/hook/state/type), extrahiert Imports, JSX-Verwendungen, Hook-Aufrufe, `useContext`/`useReducer`, Routen aus `createBrowserRouter`, `<Link>`/`useNavigate`, `localStorage`-Zugriffe und Type-Referenzen als Kanten. Anschließend berechnet er ein Layout (Sugiyama-Crossing-Reduction + Hill-Climbing), verteilt die Edge-Andockpunkte gleichmäßig auf den Knoten-Seiten und biegt Kanten via `curveSide`, um Restkreuzungen und Knoten-Durchgänge zu reduzieren.

### CLI-Flags

| Flag | Default | Beschreibung |
|---|---|---|
| `--src <dir>` | `src` | Quell-Verzeichnis relativ zum Projekt-Root |
| `--out <file>` | `docs/architektur/architektur.json` | Ausgabedatei |
| `--name <text>` | Ordner-Name | Projekt-Name fürs UI |
| `--root <dir>` | `process.cwd()` | Projekt-Root (selten gebraucht) |
| `--lernreise <file>` | (aus) | Pfad zum Lernreise-Manifest (Stufe 3, siehe Schritt 2.6) |

### Was der Generator schreibt

| Feld | Inhalt |
|---|---|
| `nodes[].id`, `type`, `title`, `badge`, `path`, `group`, `position` | vollautomatisch aus Code abgeleitet (override per `@arch-*` Tags) |
| `nodes[].subtitle`, `summary` | aus `@arch-subtitle` / `@arch-summary` Tags (Stufe 2) |
| `nodes[].sections` | aus Markdown-Sidecar `*.arch.md` (Stufe 2) |
| `edges[]` (mit `style`, `label`, `enterSide`/`enterAt`, `exitSide`/`exitAt`, `curveSide`) | vollautomatisch |
| `groups[]` (mit `label`, `tint`) | aus Knoten-Typen abgeleitet, mit kuratierten Farben |
| `steps[]` | aus Lernreise-Manifest + `@arch-step` Tags (Stufe 3, optional) |
| `tours`, `glossary` | leer — manuell pflegen |

### Position-Override per JSDoc

Wenn du einzelne Knoten an festen Positionen verankern willst, kommentiere in der Quelldatei:

```ts
// @arch position(1100, 80, 280, 90)
import React from "react";
```

Format: `position(x, y[, w, h])`. Der Generator erkennt jeden Kommentar-Stil (`//`, `/* */`, `/** */`). Verankerte Knoten werden vom Auto-Layout übersprungen; Hill-Climbing optimiert dann um sie herum.

---

## Schritt 2.5 — Inhalte ergänzen (Stufe 2)

Stufe 2 befüllt `summary` und `sections` aus zwei Quellen:

### A) JSDoc-Tags (kurze Felder direkt am Code)

In jeder TypeScript/JS-Datei kannst du oberhalb des Hauptexports einen JSDoc-Block setzen:

```ts
/**
 * @arch-id useforminput
 * @arch-badge Custom Hook
 * @arch-subtitle Isolierter State pro Eingabefeld · 7× aufgerufen
 * @arch-summary Kapselt useState + Validierung in einem wiederverwendbaren Hook.
 * @arch-group hooks
 */
export function useFormInput(...) { ... }
```

| Tag | Wirkung |
|---|---|
| `@arch-id <text>` | Knoten-ID fest setzen (Default: lowercase basename) |
| `@arch-type <text>` | Knoten-Typ überschreiben (entry/router/view/component/hook/state/type/external) |
| `@arch-title <text>` | Anzeige-Titel |
| `@arch-badge <text>` | Badge oben rechts am Knoten |
| `@arch-subtitle <text>` | 1-Zeile unter dem Titel |
| `@arch-summary <text>` | erster Absatz im Detail-Panel |
| `@arch-group <text>` | Cluster-Zuordnung |
| `@arch-position x y [w h]` | Layout-Override (auch als `@arch position(x,y[,w,h])`) |

### B) Markdown-Sidecar (lange Erklärungen)

Lege neben `useFormInput.ts` eine Datei `useFormInput.arch.md` an. Pro `## Heading` entsteht eine Section:

```markdown
---
node: useforminput
---

## Wozu dient dieser Hook?

Der Hook bündelt drei Aufgaben für ein Eingabefeld …

## Code-Highlight
\`\`\`ts
const { value, handleInputChangeEvent, error } = useFormInput("", true);
\`\`\`

## Merke
> :::callout
> Jeder Hook-Aufruf erzeugt einen **eigenen** State-Slot.
> :::
```

Klassifizierung pro Section:
- **Reiner fenced code block** → `code`-Section (Monospace-Block)
- **Blockquote mit `:::callout` ... `:::`** → `callout`-Section (Hervorhebung)
- **Sonst** → `body`-Section (Markdown → HTML; unterstützt `**bold**`, `*italic*`, `` `code` ``, fenced code, Listen, Blockquote)

Das YAML-Front-Matter mit `node: <id>` ist optional — fehlt es, wird der Knoten anhand des Datei-Namens (gleicher Basename wie `.ts`/`.tsx`) gematcht.

### Lebendiges Beispiel

Im Demo-Projekt ist [useFormInput.ts](../../src/hooks/useFormInput.ts) bereits annotiert und hat einen Sidecar [useFormInput.arch.md](../../src/hooks/useFormInput.arch.md) — schau dir das als Vorlage an.

### Nachjustieren ohne Annotationen

Brauchst du Spezial-Felder, die das Annotation-Format nicht abdeckt, kannst du die generierte `architektur.json` händisch anpassen. **Achtung**: bei jedem Generator-Lauf wird die Datei überschrieben — annotiere lieber direkt im Code (oder in `*.arch.md`), damit die Inhalte persistent bleiben.

---

## Schritt 2.6 — Lernreise (Stufe 3, optional)

Wenn du einen **geführten Lernpfad** (Schritt 0..N) anbieten willst — typisch für Lehrprojekte —, baue ihn aus zwei Quellen:

### A) `lernreise.json` Manifest

Eine separate Datei mit den **Lehrtexten** pro Schritt + optionalen Knoten-Zuordnungen + history-Edges. Beispiel siehe [lernreise.json](./lernreise.json) im Demo-Projekt.

```jsonc
{
  "$schema": "./schema/architektur.schema.json",
  "steps": [
    {
      "number": 0,
      "title": "Projekt-Vorstellung",
      "short": "Vorstellung",
      "summary": "Einstieg: …",
      "learn": ["Wie sieht die fertige App aus?"],
      "tasks": ["Demo ansehen"]
    },
    { "number": 1, "title": "Vite + Router", … }
    // … weitere Schritte
  ],
  "nodeSteps": {
    "router": 1,            // virtuelle Knoten ohne Quellfile
    "storage": 5
  },
  "historyEdges": [
    {
      "from": "createview", "to": "useforminput",
      "label": "7x aufrufen", "style": "solid",
      "step": 3,             // existiert ab Schritt 3
      "removedIn": 7         // verschwindet in Schritt 7 (UserForm-Refactor)
    }
  ]
}
```

| Feld | Bedeutung |
|---|---|
| `steps[]` | Lehrtexte pro Schritt (`number`, `title`, `short`, `summary`, `learn[]`, `tasks[]`) |
| `nodeSteps{}` | optional: Mapping `nodeId -> firstStep` als Fallback (vor allem für virtuelle Knoten wie `router` / `storage`) |
| `historyEdges[]` | optional: Kanten, die nur in frühen Schritten existierten und im finalen Code nicht mehr vorkommen (mit `step` und optional `removedIn`) |

### B) `@arch-step` Tags im Code (refactor-fest)

Drei Anwendungsorte:

**1. JSDoc-Block des Knoten-Symbols** — Knoten-Erscheinung:
```ts
/**
 * @arch-id useforminput
 * @arch-step 3
 */
export function useFormInput(...) { ... }
```

**2. Comment direkt vor einem Import** — Edge-Erscheinung pro Edge:
```ts
// @arch-step 6
import UserCard from "../../components/UserCard/UserCard";
```
Alle Kanten, die aus diesem Import resultieren (Render, Hook-Aufruf, Context-Lesen, Type-Referenz), bekommen `step = 6`.

**3. Mit `stepOnly`-Flag** — markiert eine Edge als historisch:
```ts
// @arch-step 3 stepOnly
import { useFormInput } from "../../hooks/useFormInput";
```
Die Edge wird in Schritt 3 hinzugefügt und in einem späteren Schritt entfernt. **Wann** sie entfernt wird, gibst du im Manifest unter `historyEdges[].removedIn` an (siehe oben — der Edge im finalen Code würde sonst dauerhaft bleiben).

### Generator-Aufruf mit Lernreise

```bash
node docs/architektur/generate-skeleton.cjs \
    --src src \
    --out docs/architektur/architektur.json \
    --lernreise docs/architektur/lernreise.json
```

Im Report bekommst du eine Tabelle pro Schritt:

```
Lernreise:      9 Schritte
  Schritt 0 (Vorstellung           ) 0 Knoten, 0 Edges
  Schritt 1 (Vite + Router         ) 7 Knoten, 7 Edges
  Schritt 2 (Sidebar               ) 1 Knoten, 3 Edges
  …
  Schritt 7 (EditView + UserForm   ) 1 Knoten, 8 Edges, -2 Edges
```

### Diff-Algorithmus (kurz)

- Jeder Knoten hat einen `firstStep`. Knoten ohne explizite Annotation oder `nodeSteps`-Eintrag fallen mit Warnung auf Schritt 1 zurück.
- Jede Edge bekommt einen `step`. Default: `max(firstStep(from), firstStep(to))`. Override per `@arch-step`-Comment am Import.
- `step.added.nodes` = Knoten, deren `firstStep == step.number`.
- `step.added.edges` = Edges, deren `step == step.number` (inkl. historyEdges aus dem Manifest).
- `step.removedEdges` = Edges aus `historyEdges`, deren `removedIn == step.number`.

### Validierung

Der Generator beendet mit Exit-Code 2, wenn:
- Ein Tag eine Schrittnummer referenziert, die im Manifest nicht existiert
- Eine Edge in einem früheren Schritt liegt als ihre Endknoten

Warnungen (Exit-Code 0):
- Knoten ohne `@arch-step` und ohne `nodeSteps`-Override (default Schritt 1)

---

## Schritt 3 — Lokal testen

Im Architektur-Ordner einen statischen Webserver starten — **nicht** per `file://` öffnen, sonst blockiert der Browser den `fetch()` auf die JSON-Datei.

```bash
cd deinprojekt/docs/architektur
python3 -m http.server 8765
```

Dann im Browser:

- http://localhost:8765/ — Architektur-Karte
- http://localhost:8765/lernreise.html — Lernreise (falls vorhanden)

**Was du sofort siehst, wenn etwas schiefgeht:** Der Loader in [app.js](./app.js) zeigt oben auf der Seite einen roten Hinweis-Block mit dem konkreten Fehler (HTTP-Status, JSON-Parse-Fehler, falscher Pfad). Außerdem lohnt ein Blick in die Browser-DevTools (Console + Network).

Schnelltest-Checkliste:

- [ ] alle Knoten erscheinen mit korrekter Farbe
- [ ] Klick auf einen Knoten → Detail-Panel rechts zeigt `summary` + `sections`
- [ ] Hover → Nachbarn werden hervorgehoben
- [ ] Pfeile haben die richtigen Labels und enden in der richtigen Knoten-Seite
- [ ] (falls `tours` definiert) Tour-Cards links lösen Animation aus
- [ ] (falls `lernreise.html` da ist) 9 Schritt-Items in der Stepper-Liste

---

## Schritt 4 — Deployen

Da alles statisch ist, reicht jeder Static-Host:

| Host | Anleitung in einem Satz |
|---|---|
| GitHub Pages | Ordner pushen, Pages auf `/docs/architektur` zeigen lassen |
| Netlify / Vercel | Drag-and-Drop des Ordners |
| S3 / Cloudflare Pages / Firebase Hosting | Inhalt des Ordners hochladen |
| Lokal im Lehrgang | `python3 -m http.server` reicht |

Wichtig: relative Pfade in den HTML-Dateien (`./styles.css`, `./app.js`, `./architektur.json`) bleiben unverändert. Wenn der Host die Seite unter einem Unterpfad ausliefert (z. B. `username.github.io/projektname/architektur/`), funktioniert das automatisch.

---

## Tours (animierte Szenarien — manuell)

Das `tours{}`-Feld in der `architektur.json` ist **nicht** aus dem Code ableitbar — es beschreibt erzählerische Szenarien („Was passiert, wenn der Nutzer auf Speichern klickt?"). Wenn du Tours haben willst, schreibe sie nach jedem Generator-Lauf von Hand in die JSON oder mische sie über ein separates Skript ein. Beispiel-Format siehe [Schema](./schema/architektur.schema.json) unter `$defs.Tour`.

---

## Häufige Fragen

**Ich habe kein Lernpfad — kann ich `lernreise.html` weglassen?**
Ja. Lass `steps` aus der `architektur.json` leer (oder `[]`), entferne `lernreise.html` + `lernreise.js`, und entferne den Lernreise-Tab in [index.html](./index.html) (Suche nach `topbar-tab`).

**Mein Projekt ist riesig — die Karte wird unübersichtlich.**
Splitte in mehrere `architektur.json`-Dateien (eine pro Domain/Feature) und hoste sie nebeneinander. Ein „Hub" für mehrere Karten ist [in der Roadmap](./README.md) erwähnt.

**Kann ich das auch für Vue / Svelte / Angular nutzen?**
Display ja, ist Framework-unabhängig. Der Generator ist React-spezifisch (createBrowserRouter, useReducer, useContext, JSX-Patterns) — für andere Frameworks bräuchte es eigene AST-Regeln, das Schema bleibt aber identisch.

**Funktioniert das auch als Single-File ohne Server?**
Nein — `fetch('./architektur.json')` braucht ein HTTP-Schema. Wenn das wichtig wäre, müsste man den JSON-Inhalt zur Build-Zeit als `<script>const ARCHITEKTUR = {...}</script>` in die HTML-Datei einbetten. Aktuell nicht implementiert.
