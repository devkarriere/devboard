---
description: Iterativ einen Lernreise-Schritt nach dem anderen aufnehmen und die noetigen Annotationen + Manifest-Eintraege erstellen. Fuer die Architektur-Karte (architektur2 / Stufe 3 - Lernreise).
argument-hint: <pfad-zum-src-ordner>
---

# Architektur-Lernreise: Schritt-fuer-Schritt-Aufbau (Stufe 3)

Du baust mit dem Nutzer iterativ die Lernreise auf. **Pro Iteration**: einen Schritt erfragen, dann alle noetigen Annotationen im Quellcode + Manifest-Eintraege schreiben. Fertig erst, wenn der Nutzer "kein weiterer Schritt" sagt.

**Wichtig**: Dieser Command kuemmert sich AUSSCHLIESSLICH um die Lernreise (`@arch-step`-Tags + `lernreise.json`-Manifest). Inhalts-Annotationen (`@arch-summary`, Sidecars) sind Aufgabe von `/arch-annotate`.

---

## Setup (vor der ersten Iteration)

1. **Finde das Lernreise-Manifest**. Uebliche Pfade (in dieser Reihenfolge probieren):
   - `$ARGUMENTS/../docs/architektur/lernreise.json`
   - `$ARGUMENTS/../docs/architektur2/lernreise.json`
   - `$ARGUMENTS/../docs/lernreise.json`

   Wenn nicht gefunden: lege eine neue Datei an mit Skelett:
   ```jsonc
   {
     "$schema": "./schema/architektur.schema.json",
     "_comment": "Lernreise-Manifest. Lehrtexte + nodeSteps-Fallbacks + historyEdges.",
     "steps": [],
     "nodeSteps": {},
     "historyEdges": []
   }
   ```

2. **Liste die Architektur** kurz auf:
   - Welche Knoten werden vom Generator erkannt? (kurzer Blick in `architektur.json` oder `generate-skeleton.cjs --src` Lauf)
   - Welche Schritte sind schon im Manifest? (zur Orientierung fuer den Nutzer)

3. **Faustregel zum Verhaeltnis Schritte ↔ Knoten**:
   - Schritt 0 ist immer "Vorstellung" — keine Knoten, kein Code, nur Lehr-Einstieg
   - Schritte 1..N fuegen jeweils 1-7 neue Knoten hinzu
   - Schritte koennen auch nur Edges hinzufuegen (z. B. wenn ein leerer Knoten in einem spaeteren Schritt mit Inhalt befuellt wird)

---

## Iterations-Loop

Frage den Nutzer:

> **„Gibt es einen weiteren Lernschritt? Wenn ja: was wird in diesem Schritt gelernt und was wird gebaut?"**

**Falls "nein"**: gehe zu "Abschluss" weiter unten.

**Falls "ja"**: nimm die freie Antwort des Nutzers und destilliere sie zu einem strukturierten Schritt:

| Feld | Bedeutung | Format-Regel |
|---|---|---|
| `number` | fortlaufende Nummer | naechste freie Zahl nach existierenden Schritten |
| `title` | knapper Titel | max. 60 Zeichen, beschreibt das WAS |
| `short` | Tab-Reiter / Mini-Nav | max. 22 Zeichen, eine bis zwei Wortgruppen |
| `summary` | 1-2 Saetze, was passiert | beschreibt das ZIEL des Schritts |
| `learn[]` | 3-6 Lerninhalte | „Was wird hier verstanden?" — Konzepte, nicht Aufgaben |
| `tasks[]` | 3-7 Aufgaben | „Was wird hier konkret gebaut?" — Aktionen |

**Falls der Nutzer einzelne Felder vergessen hat**, frage gezielt nach (z. B. „Welche Konzepte werden in diesem Schritt zentral?")

---

## Schreibe den Manifest-Eintrag

Fuege unter `steps[]` (sortiert nach `number`) ein:

```jsonc
{
  "number": 3,
  "title": "CreateView mit Inputs und useFormInput",
  "short": "CreateView + Inputs",
  "summary": "Die Erstellen-Seite entsteht: Ein Formular mit mehreren Eingabefeldern, jedes mit eigenem State. Der zentrale Custom Hook useFormInput wird gebaut.",
  "learn": [
    "Custom Hooks bauen (Funktionen mit use-Prefix, die useState kapseln)",
    "Controlled Components: value + onChange",
    "Komponenten-Aufteilung: TextInput, DateInput, SelectInput, SubmitButton"
  ],
  "tasks": [
    "TextInput, DateInput, SelectInput-Komponenten bauen",
    "useFormInput-Hook bauen",
    "SubmitButton-Komponente erstellen"
  ]
}
```

---

## Knoten-Zuordnung

Frage / leite ab: **welche Knoten erscheinen ZUM ERSTEN MAL in diesem Schritt?**

Pro neuem Knoten gibt es zwei Wege, den Schritt anzuzeigen:

### Weg A — JSDoc-Tag im Source-File (REFACTOR-FEST, BEVORZUGT)

Editiere die Quelldatei und fuege `@arch-step <n>` zum bestehenden JSDoc-Block (von `/arch-annotate` erzeugt) hinzu:

```ts
/**
 * @arch-badge Custom Hook
 * @arch-subtitle Isolierter State pro Eingabefeld · 7× aufgerufen
 * @arch-summary Kapselt useState + Validierung in einem wiederverwendbaren Hook.
 * @arch-step 3                                     ← NEU
 */
export function useFormInput(...) { ... }
```

**Vorteile**: Wenn die Datei refaktoriert / umbenannt wird, wandert der Tag mit. Single Source of Truth direkt am Code.

**Wenn noch kein JSDoc-Block existiert**: fuege einen mit dem Step-Tag hinzu (auch ohne andere `@arch-*`-Tags ist das valide).

### Weg B — `nodeSteps` im Manifest (FALLBACK)

Editiere im Manifest `nodeSteps`:

```json
"nodeSteps": {
  "router": 1,
  "storage": 5
}
```

**Verwende `nodeSteps` NUR fuer**:
- **Virtuelle Knoten ohne Quelldatei** (`router` aus `createBrowserRouter`-Aufruf, `storage` fuer `localStorage`-Operationen)
- Wenn du eine Datei aus politischen Gruenden NICHT anfassen darfst (selten)

**Niemals** `nodeSteps` fuer normale Source-Knoten benutzen — nimm Weg A.

---

## Edge-Zuordnung

**Default-Verhalten**: Edge-Step = `max(step(from), step(to))`. In den meisten Faellen passt das automatisch — du musst nichts tun.

**Spezialfall 1**: Edge soll spaeter erscheinen als beide Endknoten

Beispiel: `Overview.tsx` existiert seit Schritt 1 (leer), wird aber erst in Schritt 6 mit Inhalt befuellt. Die Edge `overview → usercard` muss explizit Schritt 6 bekommen.

**Loesung**: Comment direkt vor dem Import in der `from`-Datei:

```ts
// In src/routes/overview/Overview.tsx
// @arch-step 6
import UserCard from "../../components/UserCard/UserCard";
// @arch-step 6
import { UserContext } from "../../context/UserContext";
```

**Wirkung**: Alle Edges, die aus diesem Import resultieren (Render, Hook-Aufruf, useContext, Provider, Type-Ref), bekommen `step = 6`.

**Spezialfall 2**: Edge existiert nur historisch (stepOnly)

Beispiel: Vor dem `UserForm`-Refactor (Schritt 7) hat `CreateView` die Hooks DIREKT verwendet — `createview → useforminput`. Nach Refactor existiert diese Edge im finalen Code nicht mehr.

**Loesung — KEIN Code-Tag**, sondern in `historyEdges` im Manifest:

```jsonc
"historyEdges": [
  {
    "from": "createview",
    "to": "useforminput",
    "label": "7x aufrufen",
    "style": "solid",
    "step": 3,
    "removedIn": 7
  },
  {
    "from": "createview",
    "to": "submitbutton",
    "label": "onClick",
    "style": "solid",
    "step": 3,
    "removedIn": 7
  }
]
```

| Feld | Bedeutung |
|---|---|
| `from`, `to` | Knoten-IDs (lowercase basename) |
| `label` | Edge-Label (wie sonst) |
| `style` | `solid`, `dashed`, `dotted`, `fine-dotted` |
| `step` | wann die Edge zuerst erscheint |
| `removedIn` | wann sie wieder verschwindet (Generator gibt sie als `removedEdges` aus) |

---

## Workflow pro Schritt (Checkliste)

1. [ ] Schritt-Beschreibung vom Nutzer einholen
2. [ ] Manifest-Eintrag in `steps[]` schreiben
3. [ ] Neue Knoten dieses Schritts identifizieren
4. [ ] Pro neuem Knoten:
   - Source-File: `@arch-step <n>` zum JSDoc hinzufuegen (Weg A)
   - Virtueller Knoten: in `nodeSteps` eintragen (Weg B)
5. [ ] Edges mit Spezial-Timing identifizieren:
   - Edge soll spaeter erscheinen als Endknoten → `// @arch-step <n>` vor dem Import
   - Edge existiert nur historisch → `historyEdges` im Manifest
6. [ ] **Generator laufen lassen** zur Validierung:
   ```bash
   node <path-to>/generate-skeleton.cjs \
       --src $ARGUMENTS \
       --out <output-path> \
       --lernreise <manifest-path>
   ```
7. [ ] Generator-Report pruefen:
   - `Schritt N (...) X Knoten, Y Edges` — passt zur Erwartung?
   - `[FEHLER]` oder `[WARNUNGEN]` — adressieren
   - Exit-Code 0 (gut) oder 2 (Manifest-Inkonsistenz, fixen)
8. [ ] Naechste Iteration starten

---

## Beispiel-Iteration

**Nutzer**: „In Schritt 4 wird die UserCard-Komponente gebaut. Lernende verstehen Praesentations-Komponenten und Props-Design."

**Du**:

1. Manifest erweitern:
   ```jsonc
   {
     "number": 4,
     "title": "UserCard erstellen",
     "short": "UserCard",
     "summary": "Die visuelle Karte fuer einen einzelnen User. Nimmt einen User als Prop und zeigt seine Felder an. Noch ohne Delete-Button.",
     "learn": [
       "Praesentations-Komponenten ohne eigene Logik",
       "Props-Design: was kommt rein, was geht raus?",
       "Komponenten mit statischen Test-Daten entwickeln"
     ],
     "tasks": [
       "UserCard-Komponente bauen",
       "User-Prop entgegennehmen und Felder darstellen",
       "Mit statischen Test-Daten testen"
     ]
   }
   ```

2. Knoten `usercard` erkannt — Quelldatei: `src/components/UserCard/UserCard.tsx`. Editiere JSDoc:
   ```ts
   /**
    * @arch-badge Komponente
    * @arch-summary Visuelle Karte fuer einen einzelnen User.
    * @arch-step 4                                  ← NEU
    */
   function UserCard(...) { ... }
   ```

3. Edges: keine Spezial-Behandlung noetig (Default greift).

4. Generator laufen, Report:
   ```
   Schritt 4 (UserCard               ) 1 Knoten, 0 Edges
   ```

5. Frage: "Gibt es einen weiteren Schritt?"

---

## Abschluss

Wenn der Nutzer "kein weiterer Schritt" sagt:

1. Letzter Generator-Lauf zur Validierung
2. Berichte zusammenfassend:
   ```
   ## Lernreise abgeschlossen
   - X Schritte im Manifest
   - Y Knoten ueber JSDoc-Tags zugeordnet
   - Z Knoten ueber nodeSteps-Fallback
   - W historyEdges fuer historische Verbindungen

   ## Generator-Report
   <Output der Tabelle pro Schritt>

   ## Empfehlungen
   - Falls Knoten ohne @arch-step verblieben sind und auf Default 1 gefallen sind:
     diese explizit annotieren oder bewusst akzeptieren.
   - Im Browser oeffnen und durchklicken, ob die Schritt-Animation passt.
   ```

---

## Wichtige Regeln (Checkliste)

- [ ] **Pro Iteration genau EIN Schritt** — nicht den ganzen Lernpfad auf einmal
- [ ] **Nicht raten** — bei Unklarheit den Nutzer fragen
- [ ] **JSDoc-Tag bevorzugt** — `nodeSteps` nur fuer virtuelle Knoten
- [ ] **historyEdges nur fuer Kanten, die im finalen Code wirklich nicht existieren** — nicht fuer "Knoten erst spaeter befuellt" (das ist Spezialfall 1, also Import-Comment)
- [ ] **Generator nach jedem Schritt laufen lassen** — frueh Fehler erkennen
- [ ] **`removedIn` ist OPTIONAL** in historyEdges — wenn du sie nicht setzt, bleibt die Edge dauerhaft (das ist meistens NICHT was du willst)
- [ ] **Niemals Sidecars oder `@arch-summary`-Tags hinzufuegen** — das ist Aufgabe von `/arch-annotate`
- [ ] **Niemals Code-Logik aendern** — nur Comments und Manifest

---

## Wenn etwas schiefgeht

| Symptom | Wahrscheinliche Ursache | Fix |
|---|---|---|
| `[FEHLER] Knoten "X": @arch-step N - Schritt nicht im Manifest` | Tag verweist auf nicht-existenten Schritt | Manifest erweitern oder Tag korrigieren |
| `[WARNUNG] Knoten "X" ohne @arch-step und ohne nodeSteps` | Knoten faellt auf Default Schritt 1 | bewusst lassen oder annotieren |
| `[FEHLER] Edge X->Y in Schritt N, aber Endknoten erst in Schritt M` | Edge in zu fruehem Schritt | Knoten-Step erhoehen oder Edge-Step (Import-Comment) auf >= M |
| `Schritt N: 0 Knoten, 0 Edges` (obwohl Inhalt im summary steht) | alle Knoten schon in fruehen Schritten + Default-Edge-Step zieht Edges weg | per Import-Comment Edges in Schritt N forcieren (Spezialfall 1) |
