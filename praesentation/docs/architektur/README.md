# Architektur-Visualisierung 2.0 — Lösungsvorschlag

Dieser Ordner enthält das **Konzept** und einen ersten **lauffähigen Schritt** der Pipeline, mit der der bisher manuell mit Claude Code erstellte Bereich [docs/architektur](../architektur/) auf eine generische, wiederverwendbare Lösung umgestellt wird.

> **Du willst das Tool gleich in einem neuen Projekt benutzen?** → [VERWENDUNG.md](./VERWENDUNG.md) (kompakte Schritt-für-Schritt-Anleitung)

---

## Ausgangslage

In [docs/architektur](../architektur/) liegt aktuell eine vollständig ausgearbeitete, projektspezifische Visualisierung:

| Datei | Inhalt |
|---|---|
| [app.js](../architektur/app.js) | hart codierte `NODES` (21 Bausteine, inkl. Position `x/y/w/h`), `EDGES`, `GROUPS`, `DETAILS` (Langtexte pro Knoten), Renderer + Tour-Engine |
| [data-shared.js](../architektur/data-shared.js) | hart codierte `STEPS` der Lernreise (9 Schritte mit `learn`, `tasks`, `added.nodes`, `added.edges`) |
| [index.html](../architektur/index.html) / [lernreise.html](../architektur/lernreise.html) | Anzeige-Layer |
| [styles.css](../architektur/styles.css) | gemeinsames CSS |

**Problem:** Für jedes neue React-Lernprojekt müsste Claude Code diese ~1000 Zeilen Daten erneut von Hand pflegen. Das skaliert nicht und ist fehleranfällig (Drift zwischen Code und Karte).

## Zielbild

```
┌──────────────────┐    ┌────────────┐    ┌──────────────────┐
│ React-Projekt    │ →  │ GENERATOR  │ →  │ architektur.json │
│ (src/, JSDoc)    │    │ (CLI-Tool) │    │ (Daten-Vertrag)  │
└──────────────────┘    └────────────┘    └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │ DISPLAY (statisch│
                                          │ web-app, einmal  │
                                          │ gebaut, hostbar) │
                                          └──────────────────┘
```

- **Generator** = kleines CLI (Node + TypeScript Compiler API), pro Projekt einmal ausführbar.
- **architektur.json** = einziger **Daten-Vertrag** zwischen Generator und Display. Dokumentiert in [schema/architektur.schema.json](./schema/architektur.schema.json).
- **Display** = generische statische Web-App (HTML/CSS/JS), die `architektur.json` einliest und identisch zum aktuellen [docs/architektur](../architektur/) rendert. Pro Projekt nur ein anderer JSON-Input — keine Code-Änderung am Display.
- Optionaler **Hub**: ein Index, der über mehrere `architektur.json`-Dateien blättert und die jeweilige Visualisierung lädt.

## Aufteilung in drei Stufen

Die drei Fragen aus dem Auftrag entsprechen drei Verarbeitungsstufen, die **getrennt** funktionieren sollen — jede Stufe liefert ein vollständiges Zwischenergebnis, auch wenn die nächste fehlt.

| Stufe | Frage | Quelle | Was wird extrahiert | Detail |
|---|---|---|---|---|
| **1. Skelett** | Welche Bausteine gibt es, wie hängen sie zusammen? | nur AST des React-Codes | `nodes` (Typ, Pfad), `edges` (`from`/`to`/Kategorie) | [01-skelett-extraktion.md](./01-skelett-extraktion.md) |
| **2. Inhalt** | Wie wird jeder Knoten erklärt? | Skelett + JSDoc-Annotationen + optionaler Sidecar | `title`, `subtitle`, `summary`, `sections` | [02-inhalt-anreicherung.md](./02-inhalt-anreicherung.md) |
| **3. Lernreise** | Welcher Knoten gehört zu welchem Lern-Schritt? | Skelett + `@step`-Tags + Manifest `lernreise.json` | `steps[]` mit `added.nodes/edges` | [03-lernreise.md](./03-lernreise.md) |

Wichtig: Stufe 1 ist **vollständig automatisch** — der Generator allein kann ein lauffähiges, leeres Skelett liefern. Stufen 2 und 3 sind der Kompromiss: sie brauchen einmal pro Projekt eine geführte Annotation durch Claude Code, aber nach klarem Schema (siehe [schema/architektur.schema.json](./schema/architektur.schema.json)).

## Daten-Vertrag (kurz)

Eine einzige Datei `architektur.json` enthält am Ende alles, was das Display braucht:

```jsonc
{
  "$schema": "./schema/architektur.schema.json",
  "project": { "name": "Nutzerverwaltung", "root": "src/" },
  "groups":  [ /* visuelle Gruppen, optional */ ],
  "nodes":   [ /* Stufe 1 + 2: Bausteine mit Erklärung */ ],
  "edges":   [ /* Stufe 1: Verbindungen */ ],
  "steps":   [ /* Stufe 3: Lernreise */ ],
  "glossary":[ /* optional, Begriffe */ ]
}
```

Vollständig ausgefülltes Beispiel: [beispiele/architektur.example.json](./beispiele/architektur.example.json).

## Vorgeschlagener Werkzeugkasten

| Aufgabe | Werkzeug |
|---|---|
| AST-Parsing (Stufe 1) | [`ts-morph`](https://ts-morph.com/) — Wrapper um die TypeScript Compiler API; macht Imports, JSX-Usage, Hook-Aufrufe und JSDoc gleichzeitig erreichbar |
| Annotationen lesen (Stufe 2 & 3) | gleicher AST-Pass, JSDoc via `node.getJsDocs()` |
| Layout (Knoten-Position) | wahlweise (a) hart aus `@arch position(x,y)`-Tag, (b) automatisches Auto-Layout mit [`elkjs`](https://github.com/kieler/elkjs) zur Build-Zeit |
| Display | bestehender Renderer aus [docs/architektur/app.js](../architektur/app.js) **leicht refaktoriert** — die hart codierten Konstanten werden zu `fetch('architektur.json')` |

Damit muss am bestehenden Look-and-Feel nichts geändert werden — nur die Datenquelle wechselt.

## Reihenfolge der Umsetzung (vorgeschlagen)

1. **Schema festklopfen** ([schema/architektur.schema.json](./schema/architektur.schema.json)) — Vertrag zuerst, alles andere richtet sich danach.
2. **Display von Daten entkoppeln** — bestehende `app.js` so umbauen, dass `NODES`/`EDGES`/`STEPS` aus `architektur.json` kommen. Kein neuer Look. Mit der bestehenden Nutzerverwaltung als Fixture testbar.
3. **Generator v0 — nur Skelett** (Stufe 1). Reicht schon für eine zoombare Karte ohne Erklärungen.
4. **Generator v1 — Inhalt aus JSDoc** (Stufe 2).
5. **Generator v2 — Lernreise aus `@step`-Tags + `lernreise.json`** (Stufe 3).
6. *(später)* **Hub** — Verzeichnis, das `architektur.json`-Dateien aus mehreren Projekten listet.

Jeder Schritt ist eigenständig nutzbar — bei Zeitdruck kann nach Schritt 3 abgebrochen werden und es gibt trotzdem schon einen Mehrwert (automatische Skelett-Karte für jedes Projekt).

## Was bewusst nicht im Vorschlag steht

- Kein Live-Re-Generation aus dem Browser. Generator läuft als CLI, schreibt JSON, fertig.
- Keine Authoring-UI für die Texte. Texte stehen als JSDoc **im Code** (Single Source of Truth) oder als Sidecar-Datei — die Lernenden sehen den Code, der die Doku auch erklärt.
- Kein neues UI-Framework. Display bleibt Vanilla JS/HTML/CSS, damit es ohne Build-Schritt hostbar ist.
