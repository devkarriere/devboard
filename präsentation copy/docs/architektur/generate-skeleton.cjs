#!/usr/bin/env node
/* =============================================================================
 * Stufe 1 - Skelett-Extraktion (siehe 01-skelett-extraktion.md)
 *
 * Liest alle *.ts / *.tsx unter --src und schreibt eine `architektur.json`
 * mit Knoten + Kanten gemaess schema/architektur.schema.json.
 *
 * Felder `summary`, `sections`, `steps`, `tours`, `glossary` werden bewusst
 * leer gelassen - die fuellt Stufe 2 / 3.
 *
 * Verwendung
 *   node generate-skeleton.cjs                                  # Defaults
 *   node generate-skeleton.cjs --src src --out docs/architektur/architektur.json
 *   node generate-skeleton.cjs --name "MeinProjekt" --root .
 *
 * Voraussetzung
 *   Im Ziel-Projekt muss `typescript` als (Dev-)Dependency installiert sein.
 *   In jedem React+TS-Projekt mit Vite/CRA/Next ist das bereits der Fall.
 *
 * Portierung in andere Projekte
 *   Diese Datei ist self-contained: einfach in das Ziel-Projekt kopieren
 *   (z. B. nach docs/architektur/) und mit `node` aufrufen.
 * =========================================================================== */

const fs = require("fs");
const path = require("path");

// --- TypeScript-Compiler-API laden ----------------------------------------
let ts;
try {
  ts = require("typescript");
} catch (e) {
  console.error(
    "[FEHLER] Modul `typescript` nicht gefunden.\n" +
      "         Im Ziel-Projekt einmalig installieren:\n" +
      "             npm install -D typescript\n",
  );
  process.exit(1);
}

// --- CLI-Argumente --------------------------------------------------------
function parseArgs(argv) {
  const args = {
    src: "src",
    out: "docs/architektur/architektur.json",
    name: null,
    root: process.cwd(),
    lernreise: null, // Pfad zum Lernreise-Manifest (Stufe 3)
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--src") args.src = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--name") args.name = argv[++i];
    else if (a === "--root") args.root = path.resolve(argv[++i]);
    else if (a === "--lernreise") args.lernreise = argv[++i];
    else if (a === "-h" || a === "--help") {
      console.log(
        "Verwendung: node generate-skeleton.cjs " +
          "[--src src] [--out docs/architektur/architektur.json] " +
          "[--name Projekt] [--root .] [--lernreise lernreise.json]",
      );
      process.exit(0);
    } else {
      console.error("[WARN] unbekanntes Argument: " + a);
    }
  }
  return args;
}

const ARGS = parseArgs(process.argv);
const PROJECT_ROOT = ARGS.root;
const SRC_DIR = path.resolve(PROJECT_ROOT, ARGS.src);
const OUT_PATH = path.resolve(PROJECT_ROOT, ARGS.out);

if (!fs.existsSync(SRC_DIR)) {
  console.error("[FEHLER] Quell-Ordner nicht gefunden: " + SRC_DIR);
  process.exit(1);
}

// --- Datei-Discovery ------------------------------------------------------
function listSourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (
      /\.(tsx?|jsx?)$/.test(entry.name) &&
      !/\.d\.ts$/.test(entry.name) &&
      !/\.test\.(tsx?|jsx?)$/.test(entry.name) &&
      !/\.spec\.(tsx?|jsx?)$/.test(entry.name)
    ) {
      out.push(full);
    }
  }
  return out;
}

const FILES = listSourceFiles(SRC_DIR).sort();

// --- ID-Helfer ------------------------------------------------------------
function relPath(absPath) {
  return path.relative(PROJECT_ROOT, absPath).split(path.sep).join("/");
}

function basenameNoExt(absPath) {
  return path.basename(absPath).replace(/\.(tsx?|jsx?)$/, "");
}

// stabiler Knoten-Identifier - Default: lowercase basename
function idForFile(absPath) {
  const base = basenameNoExt(absPath).toLowerCase();
  // Kollisionen mit reservierten IDs vermeiden:
  if (base === "main" || base === "app") return base;
  return base;
}

// Lookup: absoluter Datei-Pfad -> Knoten-ID (nach Klassifizierung gefuellt)
const fileToId = new Map();

// --- TS Path-Aliase (tsconfig.json `paths`) ------------------------------
// Liest tsconfig.json + via `extends`/`references` verkettete Configs ein
// und sammelt alle `compilerOptions.paths`-Mappings. Wird in resolveImport
// zusaetzlich zur Standard-Aufloesung relativer Pfade verwendet.
function loadTsconfigPaths(rootDir) {
  const out = []; // [{ baseUrl, paths }]
  const visited = new Set();

  function load(absPath) {
    if (visited.has(absPath)) return;
    visited.add(absPath);
    if (!fs.existsSync(absPath)) return;
    const text = fs.readFileSync(absPath, "utf-8");
    const parsed = ts.parseConfigFileTextToJson(absPath, text);
    if (!parsed.config) return;
    const cfg = parsed.config;
    const co = cfg.compilerOptions || {};
    if (co.paths && typeof co.paths === "object") {
      const baseUrl = co.baseUrl
        ? path.resolve(path.dirname(absPath), co.baseUrl)
        : path.dirname(absPath);
      out.push({ baseUrl, paths: co.paths });
    }
    if (typeof cfg.extends === "string") {
      let extPath = cfg.extends;
      if (!extPath.endsWith(".json")) extPath += ".json";
      load(path.resolve(path.dirname(absPath), extPath));
    }
    if (Array.isArray(cfg.references)) {
      for (const ref of cfg.references) {
        if (!ref || !ref.path) continue;
        let refPath = path.resolve(path.dirname(absPath), ref.path);
        if (fs.existsSync(refPath) && fs.statSync(refPath).isDirectory()) {
          refPath = path.join(refPath, "tsconfig.json");
        } else if (!refPath.endsWith(".json")) {
          refPath += ".json";
        }
        load(refPath);
      }
    }
  }

  load(path.join(rootDir, "tsconfig.json"));
  return out;
}

const TSCONFIG_PATHS = loadTsconfigPaths(PROJECT_ROOT);

// Wendet die geladenen `paths`-Mappings auf einen Import-Spec an. Liefert
// eine Liste absoluter Pfade (ohne Endung), die durchprobiert werden.
// Leeres Array = kein Alias trifft (Spec ist also ein npm-Paket).
function applyPathAlias(spec) {
  const out = [];
  for (const { baseUrl, paths } of TSCONFIG_PATHS) {
    for (const pattern of Object.keys(paths)) {
      const targets = paths[pattern];
      if (!Array.isArray(targets)) continue;
      const star = pattern.indexOf("*");
      if (star === -1) {
        if (spec !== pattern) continue;
        for (const t of targets) out.push(path.resolve(baseUrl, t));
      } else {
        const prefix = pattern.slice(0, star);
        const suffix = pattern.slice(star + 1);
        if (
          !spec.startsWith(prefix) ||
          !spec.endsWith(suffix) ||
          spec.length < prefix.length + suffix.length
        )
          continue;
        const middle = spec.slice(prefix.length, spec.length - suffix.length);
        for (const t of targets) {
          const ts2 = t.indexOf("*");
          const expanded =
            ts2 === -1 ? t : t.slice(0, ts2) + middle + t.slice(ts2 + 1);
          out.push(path.resolve(baseUrl, expanded));
        }
      }
    }
  }
  return out;
}

// Lookup: Import-Spec (z. B. "../hooks/useFormInput" oder "@/lib/storage")
// -> absoluter Pfad zum Ziel-File. Beruecksichtigt .ts/.tsx/Endung-weglassen,
// index-Dateien und TS-Path-Aliase aus tsconfig.json.
function resolveImport(fromFile, spec) {
  let bases;
  if (spec.startsWith(".") || spec.startsWith("/")) {
    bases = [path.resolve(path.dirname(fromFile), spec)];
  } else {
    bases = applyPathAlias(spec);
    if (bases.length === 0) return null; // externes npm-Paket
  }
  const exts = ["", ".ts", ".tsx", ".js", ".jsx"];
  const indexFiles = [
    path.sep + "index.ts",
    path.sep + "index.tsx",
    path.sep + "index.js",
    path.sep + "index.jsx",
  ];
  for (const base of bases) {
    for (const ext of exts) {
      const abs = base + ext;
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
    }
    for (const idx of indexFiles) {
      const abs = base + idx;
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
    }
  }
  return null;
}

// --- AST cache ------------------------------------------------------------
const sourceFileCache = new Map();
function parseFile(absPath) {
  if (sourceFileCache.has(absPath)) return sourceFileCache.get(absPath);
  const text = fs.readFileSync(absPath, "utf-8");
  const sf = ts.createSourceFile(
    absPath,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    absPath.endsWith(".tsx") || absPath.endsWith(".jsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS,
  );
  sourceFileCache.set(absPath, sf);
  return sf;
}

function walk(node, fn) {
  fn(node);
  node.forEachChild((c) => walk(c, fn));
}

// --- Klassifizierungs-Pipeline -------------------------------------------
// Reihenfolge entspricht 01-skelett-extraktion.md (erste passende Regel gewinnt).

function hasCallExpression(sf, predicate) {
  let found = false;
  walk(sf, (n) => {
    if (found) return;
    if (ts.isCallExpression(n) && predicate(n)) found = true;
  });
  return found;
}

function callExpressionName(call) {
  const expr = call.expression;
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return null;
}

function rendersOutlet(sf) {
  let found = false;
  walk(sf, (n) => {
    if (found) return;
    if (
      (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) &&
      ts.isIdentifier(n.tagName) &&
      n.tagName.text === "Outlet"
    )
      found = true;
  });
  return found;
}

function hasDefaultExportComponent(sf) {
  let found = false;
  walk(sf, (n) => {
    if (found) return;
    // export default <Identifier|FunctionDeclaration>
    if (ts.isExportAssignment(n) && !n.isExportEquals) found = true;
    // export default function Foo()
    if (
      ts.isFunctionDeclaration(n) &&
      n.modifiers &&
      n.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      n.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    )
      found = true;
  });
  return found;
}

// Wie hasDefaultExportComponent, aber akzeptiert zusaetzlich named exports
// einer PascalCase-Funktion / -Const-Arrow (React-Component-Konvention).
// Wird fuer view/component/Fallback-Klassifikation verwendet, damit auch
// `export function BoardsPage() {}` erkannt wird, nicht nur `export default`.
function hasComponentExport(sf) {
  if (hasDefaultExportComponent(sf)) return true;
  let found = false;
  walk(sf, (n) => {
    if (found) return;
    const isExported =
      n.modifiers &&
      n.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) return;
    // export function BoardsPage() {}
    if (
      ts.isFunctionDeclaration(n) &&
      n.name &&
      /^[A-Z]/.test(n.name.text)
    ) {
      found = true;
      return;
    }
    // export const BoardsPage = () => ... / function() ...
    if (ts.isVariableStatement(n)) {
      for (const decl of n.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        if (!/^[A-Z]/.test(decl.name.text)) continue;
        const init = decl.initializer;
        if (
          init &&
          (ts.isArrowFunction(init) || ts.isFunctionExpression(init))
        ) {
          found = true;
          return;
        }
      }
    }
  });
  return found;
}

function hasReducerSignature(sf) {
  // Funktion mit zwei Parametern (state, action) und Switch ueber action.type
  let found = false;
  walk(sf, (n) => {
    if (found) return;
    const isFn =
      ts.isFunctionDeclaration(n) ||
      ts.isFunctionExpression(n) ||
      ts.isArrowFunction(n);
    if (!isFn) return;
    if (!n.parameters || n.parameters.length !== 2) return;
    const secondParam = n.parameters[1];
    const paramName =
      secondParam.name && ts.isIdentifier(secondParam.name)
        ? secondParam.name.text
        : "";
    if (!/action/i.test(paramName)) return;
    // Switch ueber <param>.type?
    let hasSwitch = false;
    walk(n, (m) => {
      if (hasSwitch) return;
      if (
        ts.isSwitchStatement(m) &&
        ts.isPropertyAccessExpression(m.expression) &&
        m.expression.name.text === "type"
      )
        hasSwitch = true;
    });
    if (hasSwitch) found = true;
  });
  return found;
}

function hasTypeOnlyExports(sf) {
  let found = false;
  walk(sf, (n) => {
    if (found) return;
    const mods = n.modifiers || [];
    const isExported = mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) return;
    if (
      ts.isTypeAliasDeclaration(n) ||
      ts.isInterfaceDeclaration(n) ||
      ts.isEnumDeclaration(n)
    )
      found = true;
  });
  return found;
}

// Pre-Scan: sammelt absolute Pfade aller Dateien, die im Browser-/Hash-/Memory-
// Router als `element: <X/>` einer Route auftauchen (Top-Level UND verschachtelt).
// Damit klassifizieren wir Layouts/Views unabhaengig vom Ordner-Namen
// (`routes/`, `pages/`, `views/`, ...) - der Router selbst ist die Source of
// Truth dafuer, was eine "Ansicht" ist.
function findRouterReferencedFiles() {
  const refs = new Set();

  function jsxElementIdentifier(initializer) {
    if (!initializer) return null;
    let inner = initializer;
    if (ts.isParenthesizedExpression(inner)) inner = inner.expression;
    if (ts.isJsxSelfClosingElement(inner) && ts.isIdentifier(inner.tagName))
      return inner.tagName.text;
    if (ts.isJsxElement(inner) && ts.isIdentifier(inner.openingElement.tagName))
      return inner.openingElement.tagName.text;
    return null;
  }

  // JSX-Identifier in einem Source-File auf seine Import-Quelle aufloesen
  // (default- oder named-Import). Liefert absoluten Datei-Pfad oder null.
  function resolveImportedIdentifier(sf, sourceFile, name) {
    for (const stmt of sf.statements) {
      if (!ts.isImportDeclaration(stmt)) continue;
      const spec = stmt.moduleSpecifier;
      if (!spec || !ts.isStringLiteral(spec)) continue;
      const clause = stmt.importClause;
      if (!clause) continue;
      let matches = clause.name && clause.name.text === name;
      if (
        !matches &&
        clause.namedBindings &&
        ts.isNamedImports(clause.namedBindings)
      ) {
        matches = clause.namedBindings.elements.some(
          (el) => el.name.text === name,
        );
      }
      if (matches) return resolveImport(sourceFile, spec.text);
    }
    return null;
  }

  function walkRouteArray(arr, sf, sourceFile) {
    for (const obj of arr.elements) {
      if (!ts.isObjectLiteralExpression(obj)) continue;
      let elementName = null;
      let childrenArray = null;
      for (const prop of obj.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const key = prop.name && (prop.name.text || prop.name.escapedText);
        if (key === "element") {
          elementName = jsxElementIdentifier(prop.initializer);
        } else if (
          key === "children" &&
          ts.isArrayLiteralExpression(prop.initializer)
        ) {
          childrenArray = prop.initializer;
        }
      }
      if (elementName) {
        const target = resolveImportedIdentifier(sf, sourceFile, elementName);
        if (target) refs.add(target);
      }
      if (childrenArray) walkRouteArray(childrenArray, sf, sourceFile);
    }
  }

  for (const file of FILES) {
    const sf = parseFile(file);
    walk(sf, (n) => {
      if (!ts.isCallExpression(n)) return;
      const name = callExpressionName(n);
      if (
        name !== "createBrowserRouter" &&
        name !== "createHashRouter" &&
        name !== "createMemoryRouter"
      )
        return;
      const arg = n.arguments[0];
      if (!arg || !ts.isArrayLiteralExpression(arg)) return;
      walkRouteArray(arg, sf, file);
    });
  }
  return refs;
}

const ROUTER_REFERENCED = findRouterReferencedFiles();

function classify(absPath, sf) {
  const rel = relPath(absPath);
  const base = path.basename(absPath);

  // 1. entry: main.tsx mit createRoot ODER Datei mit createRoot-Aufruf
  if (
    base === "main.tsx" ||
    base === "main.ts" ||
    base === "index.tsx" ||
    hasCallExpression(sf, (call) => callExpressionName(call) === "createRoot")
  ) {
    return "entry";
  }

  // 2. entry: App.tsx (default export, vom Entry importiert)
  // Heuristik: Datei direkt unter src/ namens App.*
  if (/^App\.(tsx?|jsx?)$/.test(base)) {
    return "entry";
  }

  // 3. router: createBrowserRouter / createHashRouter
  if (
    hasCallExpression(sf, (call) => {
      const n = callExpressionName(call);
      return (
        n === "createBrowserRouter" ||
        n === "createHashRouter" ||
        n === "createMemoryRouter"
      );
    })
  ) {
    return "router";
  }

  // Datei ist eine "Ansicht", wenn sie entweder vom Browser-Router als
  // Route-`element` referenziert wird (Source of Truth) ODER in einem
  // Konventions-Ordner liegt (`routes/`, `pages/`, `views/`). Letzteres
  // greift als Fallback, wenn der Pre-Scan ein Element nicht aufloesen
  // konnte (z. B. wegen Re-Exports oder dynamischer Imports).
  const isAnsicht =
    ROUTER_REFERENCED.has(absPath) ||
    rel.includes("/routes/") ||
    rel.includes("/pages/") ||
    rel.includes("/views/");

  // 4. router: Layout (rendert <Outlet />)
  if (isAnsicht && rendersOutlet(sf)) {
    return "router";
  }

  // 5. state (Context): createContext-Aufruf
  if (
    hasCallExpression(
      sf,
      (call) => callExpressionName(call) === "createContext",
    )
  ) {
    return "state";
  }

  // 6. state (Reducer): (state, action) => state mit switch(action.type)
  if (hasReducerSignature(sf)) {
    return "state";
  }

  // 7. hook: in hooks/, beginnt mit "use", default oder named export
  if (rel.includes("/hooks/") && /^use[A-Z]/.test(basenameNoExt(absPath))) {
    return "hook";
  }

  // 8. type: in types/ mit export type/interface/enum
  if (rel.includes("/types/") && hasTypeOnlyExports(sf)) {
    return "type";
  }

  // 9. view: vom Router referenzierte Datei (oder in routes/ / pages/ / views/),
  //    die selbst kein Outlet rendert
  if (isAnsicht && !rendersOutlet(sf) && hasComponentExport(sf)) {
    return "view";
  }

  // 10. component: exportierte Komponente in components/
  if (rel.includes("/components/") && hasComponentExport(sf)) {
    return "component";
  }

  // Fallback: alles andere mit exportierter Komponente -> component
  if (hasComponentExport(sf)) {
    return "component";
  }

  // Sonst: Skelett ohne Knoten
  return null;
}

// --- Knoten erzeugen ------------------------------------------------------
const nodes = [];
const edges = [];
const groupSet = new Map(); // groupId -> label

// Gruppen-Zuweisung folgt dem Knoten-Typ (der wiederum aus Ordner +
// Code-Pattern abgeleitet wird). Vorteil ggue. reiner Ordner-Logik:
// Reducer (in hooks/) wird mit Context (in context/) zusammen als `state`
// gruppiert - das ist visuell und semantisch konsistent.
function deriveGroup(absPath, type) {
  switch (type) {
    case "entry":
      return "entry";
    case "router":
      return "routing";
    case "view":
      return "views";
    case "component":
      return "components";
    case "hook":
      return "hooks";
    case "state":
      return "state";
    case "type":
      return "types";
    case "external":
      return "external";
    default:
      return "other";
  }
}

const GROUP_LABELS = {
  entry: "Entry",
  routing: "Routing & Layout",
  views: "Views / Routen",
  components: "Komponenten",
  hooks: "Hooks",
  state: "State & Persistenz",
  types: "Typen",
  external: "Browser-API",
};

// Subtile, distinkte Hintergrund-Tints pro Gruppen-Typ. Alpha bewusst
// niedrig (~0.07), damit die Boxen die Knoten nicht "uebermalen".
const GROUP_TINTS = {
  entry: "rgba(0, 220, 255, 0.07)", // Cyan
  routing: "rgba(15, 191, 160, 0.07)", // Teal
  views: "rgba(243, 156, 18, 0.07)", // Orange
  components: "rgba(232, 90, 138, 0.06)", // Pink
  hooks: "rgba(63, 191, 95, 0.07)", // Gruen
  state: "rgba(123, 91, 255, 0.07)", // Lila
  types: "rgba(138, 148, 163, 0.07)", // Grau
  external: "rgba(200, 200, 200, 0.06)", // Hellgrau (Browser-API)
};

function deriveTitle(absPath, sf) {
  // 1. Wenn default export = function Identifier(...), nimm den Namen
  let title = null;
  walk(sf, (n) => {
    if (title) return;
    if (
      ts.isFunctionDeclaration(n) &&
      n.name &&
      n.modifiers &&
      n.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      n.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      title = n.name.text;
    }
    if (ts.isExportAssignment(n) && ts.isIdentifier(n.expression)) {
      title = n.expression.text;
    }
  });
  if (title) return title;
  // 2. Erste exportierte Funktion (z. B. useFormInput, userManagementReducer)
  walk(sf, (n) => {
    if (title) return;
    if (
      (ts.isFunctionDeclaration(n) || ts.isVariableStatement(n)) &&
      n.modifiers &&
      n.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (ts.isFunctionDeclaration(n) && n.name) title = n.name.text;
      if (ts.isVariableStatement(n)) {
        const decl = n.declarationList.declarations[0];
        if (decl && ts.isIdentifier(decl.name)) title = decl.name.text;
      }
    }
  });
  if (title) return title;
  // 3. Fallback: Datei-Name
  return basenameNoExt(absPath);
}

function deriveBadge(type) {
  switch (type) {
    case "entry":
      return "Entry";
    case "router":
      return "Router";
    case "view":
      return "Route";
    case "component":
      return "Komponente";
    case "hook":
      return "Custom Hook";
    case "state":
      return "State";
    case "type":
      return "Typ";
    case "external":
      return "Browser-API";
    default:
      return "";
  }
}

// --- Stufe 2: JSDoc-Annotationen + Markdown-Sidecars --------------------
//
// JSDoc / Kommentar-Annotationen aus dem Datei-Text. Akzeptierte Tags:
//   @arch-id <text>           -> Override Knoten-ID
//   @arch-type <text>         -> Override Klassifikation
//   @arch-title <text>        -> Override Anzeige-Titel
//   @arch-badge <text>        -> Badge oben rechts
//   @arch-subtitle <text>     -> Subtitle (kurze Zusatzzeile)
//   @arch-summary <text>      -> 1-Zeilen-Einleitung im Detail-Panel
//   @arch-group <text>        -> Override Gruppen-ID
//   @arch-position x y [w h]  -> Layout-Override (Spec-Format)
//   @arch position(x,y[,w,h]) -> Backward-Compat zu frueher Variante
//   @arch-skip                -> Datei komplett ueberspringen (kein Knoten,
//                                keine Edges). Praktisch fuer von Library-Code
//                                erzeugte Dateien (ShadCN, Generatoren etc.).
//
// Das Skript akzeptiert jeden Kommentar-Stil (//, /* */, /** */) - wir
// suchen nur nach dem Tag im Datei-Text. Pro Datei wird der erste Treffer
// pro Tag verwendet.
function parseArchAnnotations(text) {
  const out = {};
  const tagNames = [
    "id",
    "type",
    "title",
    "badge",
    "subtitle",
    "summary",
    "group",
  ];
  for (const tag of tagNames) {
    // Match "@arch-<tag> <wert bis Zeilenende>", evtl. mit JSDoc */-Suffix
    const re = new RegExp("@arch-" + tag + "\\s+([^\\n]+)");
    const m = re.exec(text);
    if (!m) continue;
    let v = m[1].trim();
    // Trailing "*/" oder "*" entfernen (wenn Tag am Ende eines /** */ liegt)
    v = v.replace(/\s*\*+\/?\s*$/, "").trim();
    if (v.length > 0) out[tag] = v;
  }

  // Position - bevorzugt Spec-Format @arch-position
  const newPosRe =
    /@arch-position\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?))?/;
  let pm = newPosRe.exec(text);
  if (!pm) {
    // Backward-Compat: @arch position(x, y[, w, h])
    const oldPosRe =
      /@arch\s+position\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/;
    pm = oldPosRe.exec(text);
  }
  if (pm) {
    out.position = {
      x: parseFloat(pm[1]),
      y: parseFloat(pm[2]),
      w: pm[3] != null ? parseFloat(pm[3]) : null,
      h: pm[4] != null ? parseFloat(pm[4]) : null,
    };
  }

  // @arch-skip - Datei komplett ueberspringen (kein Knoten, keine Edges)
  if (/@arch-skip\b/.test(text)) out.skip = true;

  // @arch-step <n> oder <n,m,...> - Schritte, in denen der Knoten erscheint
  // (erste Zahl = Einfuegung, weitere = Tour-Highlights). Toleriert
  // Leerzeichen + Kommas, ignoriert ungueltige Werte.
  const stepRe = /@arch-step\s+([0-9,\s]+)/;
  const sm = stepRe.exec(text);
  if (sm) {
    const nums = sm[1]
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => Number.isInteger(n));
    if (nums.length > 0) out.steps = nums;
  }
  return out;
}

// HTML-Escape fuer Text, der in <p>/<li>/<code> landet
function escapeHtml(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Inline-Markdown -> HTML: **bold**, *italic*, `code`. Escape-first, dann
// Inline-Tags rein (sonst zerschiesst Escape die Tags).
function mdInline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

// Block-Markdown -> HTML: paragraphs, fenced code blocks, bullet/numbered
// lists, blockquotes. Bewusst minimal - bei Bedarf kann der Nutzer richtigen
// HTML im body-Feld direkt schreiben.
function mdToHtml(text) {
  const blocks = text.split(/\n\s*\n/);
  const out = [];
  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;
    // Fenced code block (```lang\n...\n```)
    const code = block.match(/^```([a-z]*)\s*\n([\s\S]*?)\n```$/);
    if (code) {
      out.push("<pre><code>" + escapeHtml(code[2]) + "</code></pre>");
      continue;
    }
    const lines = block.split("\n");
    // Bullet-Liste (jede Zeile beginnt mit - oder *)
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      const items = lines.map(
        (l) => "<li>" + mdInline(l.replace(/^\s*[-*]\s+/, "")) + "</li>",
      );
      out.push("<ul>" + items.join("") + "</ul>");
      continue;
    }
    // Numbered list
    if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      const items = lines.map(
        (l) => "<li>" + mdInline(l.replace(/^\s*\d+\.\s+/, "")) + "</li>",
      );
      out.push("<ol>" + items.join("") + "</ol>");
      continue;
    }
    // Blockquote (jede Zeile beginnt mit >)
    if (lines.every((l) => /^\s*>\s?/.test(l))) {
      const inner = lines.map((l) => l.replace(/^\s*>\s?/, "")).join(" ");
      out.push("<blockquote>" + mdInline(inner) + "</blockquote>");
      continue;
    }
    // Default: Paragraph (Zeilen mit Space verbinden)
    out.push("<p>" + mdInline(lines.map((l) => l.trim()).join(" ")) + "</p>");
  }
  return out.join("");
}

// Klassifiziert eine Sidecar-Section nach Inhalt:
//   - reine fenced-code-block  -> { code }
//   - blockquote mit :::callout -> { callout }
//   - sonst                     -> { body } (HTML)
function classifySection(title, content) {
  const trimmed = content.trim();
  // Callout-Pattern: > :::callout ... > :::
  const calloutMatch = trimmed.match(
    /^>\s*:::callout\s*\n([\s\S]*?)\n>\s*:::\s*$/,
  );
  if (calloutMatch) {
    const lines = calloutMatch[1]
      .split("\n")
      .map((l) => l.replace(/^>\s?/, ""))
      .join("\n")
      .trim();
    return { title, callout: mdInline(lines) };
  }
  // Pure code block (nichts anderes drumherum)
  const codeOnly = trimmed.match(/^```[a-z]*\s*\n([\s\S]*?)\n```\s*$/);
  if (codeOnly) {
    return { title, code: codeOnly[1] };
  }
  return { title, body: mdToHtml(trimmed) };
}

// Sucht eine Sidecar-Datei <Quelldatei>.arch.md zur Source-Datei. Wenn
// vorhanden, parst YAML-Front-Matter (nur "node: <id>" wird ausgewertet)
// und teilt den Body an "## "-Headings in Sections.
function loadSidecar(absSrcPath) {
  const sidecarPath = absSrcPath.replace(/\.(tsx?|jsx?)$/, ".arch.md");
  if (!fs.existsSync(sidecarPath)) return null;
  const text = fs.readFileSync(sidecarPath, "utf-8");
  let nodeId = null;
  let body = text;
  const fm = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (fm) {
    const nodeMatch = fm[1].match(/^node:\s*([\S]+)\s*$/m);
    if (nodeMatch) nodeId = nodeMatch[1];
    body = text.slice(fm[0].length);
  }
  // Section-Split: jeder "## " Beginn ist eine neue Section.
  const sections = [];
  const parts = body.split(/^##\s+/m);
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];
    const nl = block.indexOf("\n");
    const title = (nl >= 0 ? block.slice(0, nl) : block).trim();
    const content = nl >= 0 ? block.slice(nl + 1) : "";
    sections.push(classifySection(title, content));
  }
  return { nodeId, sections, sidecarPath: relPath(sidecarPath) };
}

// Sammelt nur Comments, die SCOPE-MAESSIG zum Knoten-Symbol gehoeren:
//   - File-Top-Comments (vor allen Statements, oft `// @arch position(...)`)
//   - JSDoc vor dem ersten non-Import-Statement (i. d. R. der Default-Export)
// Wichtig: ohne diese Eingrenzung wuerden Edge-spezifische `@arch-step`-Tags
// an Imports versehentlich auf den Knoten gemuenzt.
function getNodeAnnotationText(sf) {
  if (!sf.statements || sf.statements.length === 0) return "";
  const text = sf.getFullText();
  const parts = [];
  const firstStmt = sf.statements[0];
  const fileTopRanges = ts.getLeadingCommentRanges(text, firstStmt.pos) || [];
  for (const r of fileTopRanges) parts.push(text.slice(r.pos, r.end));
  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt)) continue;
    if (stmt === firstStmt) break; // schon behandelt
    const ranges = ts.getLeadingCommentRanges(text, stmt.pos) || [];
    for (const r of ranges) parts.push(text.slice(r.pos, r.end));
    break;
  }
  return parts.join("\n");
}

// 1. Pass: Klassifizieren, Knoten anlegen + Annotationen/Sidecars einbinden
let stufe2Counts = { withTags: 0, withSidecar: 0, sectionsTotal: 0 };
for (const file of FILES) {
  const sf = parseFile(file);
  const annotations = parseArchAnnotations(getNodeAnnotationText(sf));
  // @arch-skip: Datei komplett aus der Karte raushalten. Edges aus anderen
  // Dateien zur ueberhuepften Datei verschwinden automatisch, weil
  // `fileToId` keinen Eintrag bekommt.
  if (annotations.skip) continue;
  // Type-Override durch @arch-type respektieren
  let type = annotations.type || classify(file, sf);
  if (!type) continue;
  // ID: Annotation > Sidecar-Front-Matter > Datei-Name
  let id = annotations.id || idForFile(file);
  if (!annotations.id && type === "type") id = "type-" + id;
  // Sidecar laden (kann nodeId-Override enthalten)
  const sidecar = loadSidecar(file);
  if (sidecar && sidecar.nodeId && !annotations.id) id = sidecar.nodeId;
  // Eindeutigkeit absichern
  if (nodes.some((n) => n.id === id)) {
    let suffix = 2;
    while (nodes.some((n) => n.id === id + "-" + suffix)) suffix++;
    id = id + "-" + suffix;
  }
  fileToId.set(file, id);
  const group = annotations.group || deriveGroup(file, type);
  groupSet.set(group, group);
  const node = {
    id,
    type,
    title: annotations.title || deriveTitle(file, sf),
    badge: annotations.badge || deriveBadge(type),
    path: relPath(file),
    group,
    summary: annotations.summary || "",
    sections: sidecar ? sidecar.sections : [],
  };
  if (annotations.subtitle) node.subtitle = annotations.subtitle;
  if (annotations.position) node._lockedPos = annotations.position;
  if (annotations.steps) node._steps = annotations.steps;
  // Statistik fuer Report
  const hasTags = Object.keys(annotations).some(
    (k) => k !== "position" && annotations[k],
  );
  if (hasTags) stufe2Counts.withTags++;
  if (sidecar) {
    stufe2Counts.withSidecar++;
    stufe2Counts.sectionsTotal += sidecar.sections.length;
  }
  nodes.push(node);
}

// --- Kanten-Extraktion ----------------------------------------------------

// Liefert true, wenn das JSX-Element direkt als Route-Element verwendet wird,
// also: Eltern ist ein PropertyAssignment mit Name "element" innerhalb einer
// Route-Definition. Solche Elemente sollen NICHT als JSX-Render-Kante zaehlen
// (sie werden bereits als Routen-Kante erfasst).
function isInsideRouteElement(jsxNode) {
  let p = jsxNode.parent;
  // ueberspringe ParenthesizedExpression, falls vorhanden
  if (p && ts.isParenthesizedExpression(p)) p = p.parent;
  if (
    p &&
    ts.isPropertyAssignment(p) &&
    p.name &&
    (p.name.text === "element" || p.name.escapedText === "element")
  ) {
    return true;
  }
  return false;
}

function getJsxTagName(jsxOpen) {
  // <Foo />, <Foo.Bar />
  const tag = jsxOpen.tagName;
  if (ts.isIdentifier(tag)) return tag.text;
  if (ts.isPropertyAccessExpression(tag)) {
    let head = tag;
    while (ts.isPropertyAccessExpression(head.expression))
      head = head.expression;
    if (ts.isIdentifier(head.expression)) return head.expression.text;
  }
  return null;
}

function isJsxProviderUsage(jsxOpen, importedName) {
  const tag = jsxOpen.tagName;
  return (
    ts.isPropertyAccessExpression(tag) &&
    ts.isIdentifier(tag.expression) &&
    tag.expression.text === importedName &&
    tag.name.text === "Provider"
  );
}

function collectImportNames(importDecl) {
  // Liefert { default: string|null, named: string[], typeOnly: boolean }
  const result = { default: null, named: [], typeOnly: false };
  if (!importDecl.importClause) return result;
  if (importDecl.importClause.isTypeOnly) result.typeOnly = true;
  if (importDecl.importClause.name) {
    result.default = importDecl.importClause.name.text;
  }
  const bindings = importDecl.importClause.namedBindings;
  if (bindings) {
    if (ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        result.named.push(el.name.text);
        // import { type Foo } from "..."
        if (el.isTypeOnly) {
          // markiere einzeln - vereinfacht: wenn alle benannten Imports
          // typeOnly sind, behandeln wir den ganzen Import als typeOnly
        }
      }
    }
    // namespace import (import * as X) wird ignoriert
  }
  return result;
}

function pushEdge(edge) {
  // Doppelte Kanten dedupen (gleiche from/to/style/label)
  const key = [edge.from, edge.to, edge.style || "", edge.label || ""].join(
    "|",
  );
  if (
    !edges.some(
      (e) => [e.from, e.to, e.style || "", e.label || ""].join("|") === key,
    )
  ) {
    edges.push(edge);
  }
}

// Bequemer Helper: belegt _step / _stepOnly aus dem Import-Info-Eintrag.
// Wird in den meisten Edge-Faellen aufgerufen, damit die Lernreise-Stufe
// die Edges spaeter dem richtigen Schritt zuordnen kann.
function tagWithStep(edge, info) {
  if (info && info.step != null) edge._step = info.step;
  if (info && info.stepOnly) edge._stepOnly = true;
  return edge;
}

// Set virtueller Knoten - werden am Ende addiert, falls referenziert
const virtualNodesNeeded = new Set();
function ensureStorageNode() {
  if (virtualNodesNeeded.has("storage")) return;
  virtualNodesNeeded.add("storage");
  nodes.push({
    id: "storage",
    type: "external",
    title: "localStorage",
    badge: "Browser-API",
    path: "Web API",
    group: "external",
    summary: "",
    sections: [],
  });
  groupSet.set("external", "external");
}

// Map: Routen-Pfad -> View-Knoten-ID (fuer <Link to="...">-Aufloesung)
const routePathToViewId = new Map();

// Virtueller Router-Knoten - wird erzeugt, sobald createBrowserRouter
// gefunden wird. Routen-Kanten gehen vom Router-Knoten aus, nicht von der
// Datei mit dem createBrowserRouter-Aufruf (entspricht heutigem Datensatz).
function ensureRouterNode() {
  if (nodes.some((n) => n.id === "router")) return "router";
  nodes.push({
    id: "router",
    type: "router",
    title: "createBrowserRouter",
    badge: "Router",
    path: null,
    group: "routing",
    summary: "",
    sections: [],
  });
  groupSet.set("routing", "routing");
  return "router";
}

// Liefert Lernreise-Metadaten aus den Comments DIREKT vor einem AST-Knoten
// (Import-Statement). Erkennt:
//   @arch-step 3            -> step = 3
//   @arch-step 3 stepOnly   -> step = 3, stepOnly = true (Edge wird in
//                              spaeterem Schritt entfernt - manifest sagt wann)
function parseImportStepInfo(sf, stmt) {
  const text = sf.getFullText();
  const ranges = ts.getLeadingCommentRanges(text, stmt.pos) || [];
  if (ranges.length === 0) return {};
  const commentText = ranges.map((r) => text.slice(r.pos, r.end)).join("\n");
  const m = commentText.match(/@arch-step\s+(\d+)([^\n]*)/);
  if (!m) return {};
  const step = parseInt(m[1], 10);
  const flags = m[2] || "";
  const stepOnly = /\bstepOnly\b/i.test(flags);
  return { step: Number.isInteger(step) ? step : null, stepOnly };
}

// Hilfs-Map: ImportName -> targetId + Lernreise-Metadaten, pro Source-File
function buildImportNameMap(sf, sourceFile) {
  const map = new Map();
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const spec = stmt.moduleSpecifier;
    if (!spec || !ts.isStringLiteral(spec)) continue;
    const targetFile = resolveImport(sourceFile, spec.text);
    if (!targetFile) continue;
    const targetId = fileToId.get(targetFile);
    if (!targetId) continue;
    const { default: def, named, typeOnly } = collectImportNames(stmt);
    const stepInfo = parseImportStepInfo(sf, stmt);
    const entry = { targetId, typeOnly, ...stepInfo };
    if (def) map.set(def, entry);
    for (const n of named) map.set(n, entry);
  }
  return map;
}

// 2. Pass: Pro Datei Kanten extrahieren
for (const file of FILES) {
  const fromId = fileToId.get(file);
  if (!fromId) continue;
  const sf = parseFile(file);
  const importMap = buildImportNameMap(sf, file);

  // Counter pro Ziel-Symbol fuer Hook-Aufrufe ("7x aufrufen"-Heuristik)
  const hookCallCounts = new Map(); // importedName -> count
  // Kanten-Akkumulator pro (importedName, kind) - wir entscheiden am Ende,
  // ob Hook-Counter > 1 ist und schreiben dann ein Label.
  const renderedAsJsx = new Set(); // importedName, die als <Name/> verwendet werden
  const usedAsContextRead = new Map(); // importedName -> label
  const providerUsage = new Set();
  const reducerUsage = new Map(); // importedName -> label
  const typeOnlyUsed = new Set();

  // Symbole, die im File "verwendet" werden (JSX, calls, hooks). Was nicht
  // hier landet und auf einen `type`-Knoten zeigt, behandeln wir als
  // Type-Referenz (fine-dotted).
  const usedSymbols = new Set();

  walk(sf, (n) => {
    // JSX-Render: <Name ...> oder <Name.Provider ...>
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tagName = getJsxTagName(n);
      if (tagName && importMap.has(tagName)) {
        usedSymbols.add(tagName);
        const tag = n.tagName;
        if (
          ts.isPropertyAccessExpression(tag) &&
          tag.name &&
          tag.name.text === "Provider"
        ) {
          providerUsage.add(tagName);
        } else if (ts.isIdentifier(tag) && !isInsideRouteElement(n)) {
          renderedAsJsx.add(tagName);
        }
      }
    }

    // Aufrufe: useContext(X), useReducer(X, ...), createContext(...),
    // Hook-Aufrufe useXxx(...), localStorage.getItem/setItem, navigate("...")
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      const calleeName = callExpressionName(n);

      // useContext(X)
      if (calleeName === "useContext" && n.arguments.length >= 1) {
        const arg = n.arguments[0];
        if (ts.isIdentifier(arg) && importMap.has(arg.text)) {
          usedSymbols.add(arg.text);
          usedAsContextRead.set(arg.text, "useContext");
        }
      }
      // useReducer(X, ...)
      if (calleeName === "useReducer" && n.arguments.length >= 1) {
        const arg = n.arguments[0];
        if (ts.isIdentifier(arg) && importMap.has(arg.text)) {
          usedSymbols.add(arg.text);
          reducerUsage.set(arg.text, "useReducer(...)");
        }
      }
      // Custom Hook-Aufruf: useXxx(...) als Identifier (und importiert)
      if (
        ts.isIdentifier(callee) &&
        /^use[A-Z]/.test(callee.text) &&
        importMap.has(callee.text) &&
        callee.text !== "useContext" &&
        callee.text !== "useReducer"
      ) {
        usedSymbols.add(callee.text);
        hookCallCounts.set(
          callee.text,
          (hookCallCounts.get(callee.text) || 0) + 1,
        );
      }

      // localStorage.getItem(...) / setItem(...)
      if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === "localStorage"
      ) {
        ensureStorageNode();
        pushEdge({
          from: fromId,
          to: "storage",
          label: "persistiert",
          style: "solid",
        });
      }
    }

    // Type-Position: import { type Foo } from "..." - vereinfacht ueber
    // typeOnly-Flag des Imports (gesamte Import-Anweisung). Detail-Erkennung
    // pro Bezeichner waere moeglich, ist aber nicht noetig fuer das Skelett.
  });

  // Type-Referenz-Heuristik:
  //  a) `import type { ... }` -> immer Type-Referenz
  //  b) Import aus einer Datei, die als `type`-Knoten klassifiziert ist UND
  //     der Bezeichner wird nirgends als Wert verwendet (kein JSX, kein Call,
  //     kein useContext/useReducer-Argument) -> Type-Referenz.
  for (const [name, info] of importMap.entries()) {
    if (info.typeOnly) {
      typeOnlyUsed.add(name);
      continue;
    }
    const targetNode = nodes.find((nd) => nd.id === info.targetId);
    if (targetNode && targetNode.type === "type" && !usedSymbols.has(name)) {
      typeOnlyUsed.add(name);
    }
  }

  // Kanten emittieren - Step-Info aus dem Import an die Edge weiterreichen
  for (const name of renderedAsJsx) {
    const info = importMap.get(name);
    if (info)
      pushEdge(
        tagWithStep(
          { from: fromId, to: info.targetId, label: "rendert", style: "solid" },
          info,
        ),
      );
  }
  for (const [name, count] of hookCallCounts.entries()) {
    const info = importMap.get(name);
    if (!info) continue;
    const label = count > 1 ? count + "x aufrufen" : name + "(...)";
    pushEdge(
      tagWithStep(
        { from: fromId, to: info.targetId, label, style: "solid" },
        info,
      ),
    );
  }
  for (const [name, label] of usedAsContextRead.entries()) {
    const info = importMap.get(name);
    if (info)
      pushEdge(
        tagWithStep(
          { from: fromId, to: info.targetId, label, style: "dashed" },
          info,
        ),
      );
  }
  for (const name of providerUsage) {
    const info = importMap.get(name);
    if (info)
      pushEdge(
        tagWithStep(
          {
            from: fromId,
            to: info.targetId,
            label: "Provider value",
            style: "solid",
          },
          info,
        ),
      );
  }
  for (const [name, label] of reducerUsage.entries()) {
    const info = importMap.get(name);
    if (info)
      pushEdge(
        tagWithStep(
          { from: fromId, to: info.targetId, label, style: "solid" },
          info,
        ),
      );
  }
  for (const name of typeOnlyUsed) {
    const info = importMap.get(name);
    if (info)
      pushEdge(
        tagWithStep(
          {
            from: fromId,
            to: info.targetId,
            label: "type",
            style: "fine-dotted",
          },
          info,
        ),
      );
  }
}

// --- createBrowserRouter parsen -> Routen-Kanten -------------------------

function parseRouteObject(obj, parentLayoutId) {
  // { path: "...", element: <View/>, children: [...] }
  let routePath = null;
  let elementId = null;
  let children = [];
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = prop.name && (prop.name.text || prop.name.escapedText);
    if (key === "path" && ts.isStringLiteral(prop.initializer)) {
      routePath = prop.initializer.text;
    } else if (key === "element") {
      const init = prop.initializer;
      if (
        (ts.isJsxSelfClosingElement(init) || ts.isJsxElement(init)) &&
        // <Foo />
        true
      ) {
        const open = ts.isJsxElement(init) ? init.openingElement : init;
        const tag = open.tagName;
        if (ts.isIdentifier(tag)) {
          elementId = tag.text;
        }
      } else if (ts.isParenthesizedExpression(init)) {
        // (<Foo />)
        const inner = init.expression;
        if (
          ts.isJsxSelfClosingElement(inner) &&
          ts.isIdentifier(inner.tagName)
        ) {
          elementId = inner.tagName.text;
        }
      }
    } else if (
      key === "children" &&
      ts.isArrayLiteralExpression(prop.initializer)
    ) {
      children = prop.initializer.elements.filter(ts.isObjectLiteralExpression);
    }
  }
  return { routePath, elementId, children };
}

for (const file of FILES) {
  const sf = parseFile(file);
  const fromId = fileToId.get(file);
  const importMap = buildImportNameMap(sf, file);

  walk(sf, (n) => {
    if (
      !ts.isCallExpression(n) ||
      callExpressionName(n) !== "createBrowserRouter"
    )
      return;
    const arg = n.arguments[0];
    if (!arg || !ts.isArrayLiteralExpression(arg)) return;

    // Virtuellen Router-Knoten anlegen + Kante <file> -> router
    const routerId = ensureRouterNode();
    pushEdge({
      from: fromId,
      to: routerId,
      label: "RouterProvider",
      style: "solid",
    });

    // Top-Level: Router -> Layout (oder direkt View)
    for (const top of arg.elements) {
      if (!ts.isObjectLiteralExpression(top)) continue;
      const route = parseRouteObject(top, null);
      const layoutImport = route.elementId && importMap.get(route.elementId);
      if (!layoutImport) continue;
      const layoutId = layoutImport.targetId;
      pushEdge({
        from: routerId,
        to: layoutId,
        label: 'Route "' + (route.routePath || "/") + '"',
        style: "dotted",
      });
      // Kinder: layout -> view via Outlet, dotted, label "Outlet <path>"
      for (const childObj of route.children) {
        const child = parseRouteObject(childObj, layoutId);
        const childImport = child.elementId && importMap.get(child.elementId);
        if (!childImport) continue;
        const childId = childImport.targetId;
        pushEdge({
          from: layoutId,
          to: childId,
          label: "Outlet " + (child.routePath || ""),
          style: "dotted",
        });
        if (child.routePath) routePathToViewId.set(child.routePath, childId);
      }
      if (route.routePath) routePathToViewId.set(route.routePath, layoutId);
    }
  });
}

// --- <Link to="..."> / useNavigate(...) -> Navigation-Kanten -------------
function literalLinkTarget(expr) {
  if (!expr) return null;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr))
    return expr.text;
  if (ts.isTemplateExpression(expr)) {
    // Statischer Prefix: head.text
    return expr.head.text;
  }
  return null;
}

function resolveRouteTarget(linkSpec) {
  if (!linkSpec) return null;
  // Relativen Pfad in absoluten umwandeln (Sidebar nutzt z. B. "overview")
  const candidates = [linkSpec];
  if (!linkSpec.startsWith("/")) candidates.push("/" + linkSpec);
  for (const candidate of candidates) {
    if (routePathToViewId.has(candidate))
      return routePathToViewId.get(candidate);
  }
  // Praefix-Match auf bekannten Routen-Praefixen
  let bestId = null;
  let bestLen = -1;
  for (const [route, id] of routePathToViewId.entries()) {
    const colonIdx = route.indexOf(":");
    const prefix = colonIdx >= 0 ? route.substring(0, colonIdx) : route;
    for (const candidate of candidates) {
      if (candidate.startsWith(prefix) && prefix.length > bestLen) {
        bestId = id;
        bestLen = prefix.length;
      }
    }
  }
  return bestId;
}

for (const file of FILES) {
  const fromId = fileToId.get(file);
  if (!fromId) continue;
  const sf = parseFile(file);

  walk(sf, (n) => {
    // <Link to="...">
    if (
      (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) &&
      ts.isIdentifier(n.tagName) &&
      n.tagName.text === "Link"
    ) {
      const toAttr = n.attributes.properties.find(
        (p) => ts.isJsxAttribute(p) && p.name && p.name.text === "to",
      );
      if (!toAttr || !toAttr.initializer) return;
      let value = null;
      if (ts.isStringLiteral(toAttr.initializer)) {
        value = toAttr.initializer.text;
      } else if (
        ts.isJsxExpression(toAttr.initializer) &&
        toAttr.initializer.expression
      ) {
        value = literalLinkTarget(toAttr.initializer.expression);
      }
      const targetId = resolveRouteTarget(value);
      if (targetId) {
        pushEdge({
          from: fromId,
          to: targetId,
          label: "<Link>",
          style: "dotted",
        });
      }
    }
    // useNavigate()(literal) - vereinfachte Erkennung: navigate("...") als
    // CallExpression mit Argument-String, der auf Route matched.
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === "navigate" &&
      n.arguments.length >= 1
    ) {
      const value = literalLinkTarget(n.arguments[0]);
      const targetId = resolveRouteTarget(value);
      if (targetId) {
        pushEdge({
          from: fromId,
          to: targetId,
          label: "navigate()",
          style: "dotted",
        });
      }
    }
  });
}

// --- Auto-Layout (gruppen-zentriert) -------------------------------------
// Strategie - bewusst NICHT hierarchisch (kein top-down Layering):
//  1. Knoten werden nach `group` gebuendelt (Type-getrieben, also Ordner-
//     orientiert mit semantischen Korrekturen wie "Reducer gehoert zu
//     state, nicht zu hooks").
//  2. Pro Gruppe wird ein Bounding-Box berechnet (kompaktes Grid).
//  3. Gruppen werden in einem 2D-Raster platziert; die Reihenfolge der
//     Platzierung folgt einer "greedy barycenter"-Heuristik: stark
//     verbundene Gruppen landen benachbart -> kurze Pfade zwischen ihnen.
//  4. Gruppen-Boxen ueberlappen sich nie (eigene Slots im Raster).
//  5. Innerhalb einer Gruppe: simples Grid, sortiert nach ID.
function autoLayout(nodes, edges) {
  const NODE_W = 220;
  const NODE_H = 78;
  const INNER_GAP_X = 70; // Abstand zwischen Knoten innerhalb einer Gruppe
  const INNER_GAP_Y = 60;
  const GROUP_PAD = 56; // Innen-Padding der Gruppen-Box (Platz fuer Label)
  const GROUP_GAP_X = 110; // Abstand zwischen Gruppen horizontal
  const GROUP_GAP_Y = 120; // Abstand zwischen Gruppen vertikal
  const PAGE_PAD = 60;
  const CROSSING_PENALTY = 280; // px-Aequivalent pro Kantenkreuzung

  // Standard-Segment-Schnitt-Test (2D, exklusive Endpunkt-Beruehrung).
  function segIntersect(p1, p2, p3, p4) {
    function ccw(a, b, c) {
      return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    }
    return (
      ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
    );
  }

  // Anzahl Kanten-Kreuzungen, gegeben eine id->position-Map.
  function countCrossings(positions) {
    let c = 0;
    const segs = [];
    for (const e of edges) {
      const fp = positions.get(e.from);
      const tp = positions.get(e.to);
      if (!fp || !tp) continue;
      if (e.from === e.to) continue;
      segs.push({
        from: e.from,
        to: e.to,
        p1: { x: fp.x + fp.w / 2, y: fp.y + fp.h / 2 },
        p2: { x: tp.x + tp.w / 2, y: tp.y + tp.h / 2 },
      });
    }
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        const a = segs[i],
          b = segs[j];
        // Edges, die sich einen Knoten teilen, koennen nicht kreuzen
        if (
          a.from === b.from ||
          a.from === b.to ||
          a.to === b.from ||
          a.to === b.to
        )
          continue;
        if (segIntersect(a.p1, a.p2, b.p1, b.p2)) c++;
      }
    }
    return c;
  }

  // 1. Knoten nach Gruppe buendeln
  const groupNodes = new Map();
  for (const n of nodes) {
    const g = n.group || "other";
    if (!groupNodes.has(g)) groupNodes.set(g, []);
    groupNodes.get(g).push(n);
  }
  const allGroups = [...groupNodes.keys()];

  // 2. Gruppen-Boxen dimensionieren - kompakt, leicht breiter als hoch
  const groupBox = new Map();
  for (const [gId, gNodes] of groupNodes.entries()) {
    const n = gNodes.length;
    let cols;
    if (n <= 2) cols = n;
    else if (n <= 4) cols = 2;
    else if (n <= 6) cols = 3;
    else if (n <= 9) cols = 3;
    else cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const innerW = cols * NODE_W + (cols - 1) * INNER_GAP_X;
    const innerH = rows * NODE_H + (rows - 1) * INNER_GAP_Y;
    groupBox.set(gId, {
      w: innerW + 2 * GROUP_PAD,
      h: innerH + 2 * GROUP_PAD,
      cols,
      rows,
    });
  }

  // 3. Inter-Gruppen-Kantengewicht
  const groupOf = new Map(nodes.map((n) => [n.id, n.group || "other"]));
  const interEdges = new Map();
  const pairKey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
  for (const e of edges) {
    const ga = groupOf.get(e.from);
    const gb = groupOf.get(e.to);
    if (!ga || !gb || ga === gb) continue;
    const k = pairKey(ga, gb);
    interEdges.set(k, (interEdges.get(k) || 0) + 1);
  }

  // 4. Greedy Reihenfolge: starte mit "entry" (oder erster Gruppe),
  //    fuege jeweils diejenige Gruppe hinzu, die die staerkste
  //    Verbindung zu den bereits platzierten Gruppen hat.
  let placedOrder = [];
  const placedSet = new Set();
  let start = allGroups.includes("entry") ? "entry" : allGroups[0];
  placedOrder.push(start);
  placedSet.add(start);
  while (placedOrder.length < allGroups.length) {
    let best = null;
    let bestScore = -1;
    for (const g of allGroups) {
      if (placedSet.has(g)) continue;
      let score = 0;
      for (const ph of placedOrder) {
        score += interEdges.get(pairKey(g, ph)) || 0;
      }
      // Tie-Breaker: Knotenzahl der Gruppe (groessere zuerst -> schoenere
      // Auslastung des Rasters) und alphabetisch fuer Determinismus
      if (
        score > bestScore ||
        (score === bestScore && best && g.localeCompare(best) < 0)
      ) {
        bestScore = score;
        best = g;
      }
    }
    if (!best) best = allGroups.find((g) => !placedSet.has(g));
    placedOrder.push(best);
    placedSet.add(best);
  }

  // 5. Raster-Anordnung: Spaltenanzahl heuristisch
  const total = placedOrder.length;
  let cols;
  if (total <= 2) cols = total;
  else if (total <= 4) cols = 2;
  else if (total <= 6) cols = 3;
  else if (total <= 9) cols = 3;
  else cols = Math.ceil(Math.sqrt(total));

  // 5b. Sugiyama-Crossing-Reduction (Barycenter) auf Gruppen-Ebene.
  //     Klassischer Sugiyama-Step 3: Top-Down + Bottom-Up Pässe sortieren
  //     pro Reihe nach dem durchschnittlichen Index der verbundenen
  //     Gruppen in der Nachbar-Reihe. Reduziert Kreuzungen DETERMINISTISCH
  //     und liefert eine bessere initiale Anordnung fuer das anschliessende
  //     Hill-Climbing.
  function sugiyamaSort(row, refRow, getNeighbors) {
    const refIdx = new Map(refRow.map((id, i) => [id, i]));
    const bcs = new Map();
    row.forEach((id, i) => {
      const neigh = getNeighbors(id).filter((n) => refIdx.has(n));
      if (neigh.length === 0) {
        bcs.set(id, i); // unveraenderte Position
        return;
      }
      const sum = neigh.reduce((s, n) => s + refIdx.get(n), 0);
      bcs.set(id, sum / neigh.length);
    });
    row.sort((a, b) => bcs.get(a) - bcs.get(b));
  }
  function groupNeighbors(gId) {
    const out = [];
    for (const e of edges) {
      const fg = groupOf.get(e.from);
      const tg = groupOf.get(e.to);
      if (fg === gId && tg !== gId) out.push(tg);
      if (tg === gId && fg !== gId) out.push(fg);
    }
    return out;
  }
  let sgrid = [];
  for (let i = 0; i < total; i += cols)
    sgrid.push(placedOrder.slice(i, i + cols));
  const sugiyamaPasses = 4;
  for (let pass = 0; pass < sugiyamaPasses; pass++) {
    for (let r = 1; r < sgrid.length; r++) {
      sugiyamaSort(sgrid[r], sgrid[r - 1], groupNeighbors);
    }
    for (let r = sgrid.length - 2; r >= 0; r--) {
      sugiyamaSort(sgrid[r], sgrid[r + 1], groupNeighbors);
    }
  }
  placedOrder = [].concat(...sgrid);

  // Hilfs-Funktion: gegebene Reihenfolge -> Origins + simulierte Knoten-
  // Positionen + Gesamtkosten. Kosten setzt sich zusammen aus:
  //   a) Summe(Inter-Group-Edges * Gruppen-Zentrum-Distanz)
  //   b) Crossing-Penalty * Anzahl Kantenkreuzungen
  function layoutFromOrder(order) {
    const g = [];
    for (let i = 0; i < order.length; i += cols)
      g.push(order.slice(i, i + cols));
    const cw = [];
    for (let c = 0; c < cols; c++) {
      let m = 0;
      for (const row of g)
        if (c < row.length) m = Math.max(m, groupBox.get(row[c]).w);
      cw.push(m);
    }
    const rh = g.map((row) => Math.max(...row.map((id) => groupBox.get(id).h)));
    const origins = new Map();
    const positions = new Map();
    let cy = PAGE_PAD;
    for (let r = 0; r < g.length; r++) {
      let cx = PAGE_PAD;
      for (let c = 0; c < g[r].length; c++) {
        const id = g[r][c];
        const box = groupBox.get(id);
        const ox = Math.round(cx + (cw[c] - box.w) / 2);
        const oy = Math.round(cy + (rh[r] - box.h) / 2);
        origins.set(id, { x: ox, y: oy });
        // Simulierte Knoten-Positionen (alphabetisch im Grid) - werden
        // gebraucht, um Kreuzungen zu zaehlen.
        const gNodes = [...groupNodes.get(id)].sort((a, b) =>
          a.id.localeCompare(b.id),
        );
        for (let i = 0; i < gNodes.length; i++) {
          const colI = i % box.cols;
          const rowI = Math.floor(i / box.cols);
          positions.set(gNodes[i].id, {
            x: ox + GROUP_PAD + colI * (NODE_W + INNER_GAP_X),
            y: oy + GROUP_PAD + rowI * (NODE_H + INNER_GAP_Y),
            w: NODE_W,
            h: NODE_H,
          });
        }
        cx += cw[c] + GROUP_GAP_X;
      }
      cy += rh[r] + GROUP_GAP_Y;
    }
    // Locked-Overrides anwenden, damit Cost-Funktion realistische
    // Distanzen + Kreuzungen sieht.
    for (const n of nodes) {
      if (n._lockedPos) {
        positions.set(n.id, {
          x: n._lockedPos.x,
          y: n._lockedPos.y,
          w: n._lockedPos.w || NODE_W,
          h: n._lockedPos.h || NODE_H,
        });
      }
    }
    let cost = 0;
    for (const [k, w] of interEdges.entries()) {
      const [a, b] = k.split("|");
      if (!origins.has(a) || !origins.has(b)) continue;
      const ba = groupBox.get(a),
        bb = groupBox.get(b);
      const ca = origins.get(a),
        cb = origins.get(b);
      const dx = ca.x + ba.w / 2 - (cb.x + bb.w / 2);
      const dy = ca.y + ba.h / 2 - (cb.y + bb.h / 2);
      cost += w * Math.sqrt(dx * dx + dy * dy);
    }
    cost += CROSSING_PENALTY * countCrossings(positions);
    return { grid: g, origins, positions, cost };
  }

  // 6. Hill-Climbing: probiere alle Paar-Tausche, behalte besten,
  //    wiederhole bis keine Verbesserung mehr -> kuerzere Pfade.
  let best = layoutFromOrder(placedOrder);
  const initialCost = best.cost;
  let bestOrder = [...placedOrder];
  let swaps = 0;
  let improved = true;
  let safety = 50;
  while (improved && safety-- > 0) {
    improved = false;
    for (let i = 0; i < bestOrder.length; i++) {
      for (let j = i + 1; j < bestOrder.length; j++) {
        const trial = bestOrder.slice();
        [trial[i], trial[j]] = [trial[j], trial[i]];
        const result = layoutFromOrder(trial);
        if (result.cost < best.cost - 0.5) {
          best = result;
          bestOrder = trial;
          improved = true;
          swaps++;
        }
      }
    }
  }
  // Optimierungs-Bilanz fuer den Report (am Ende geloggt)
  autoLayout._swaps = swaps;
  autoLayout._costBefore = Math.round(initialCost);
  autoLayout._costAfter = Math.round(best.cost);
  const { grid, origins: groupOrigin } = best;

  // 8. Knoten innerhalb jeder Gruppe initial platzieren (alphabetisch).
  for (const [gId, gNodes] of groupNodes.entries()) {
    const origin = groupOrigin.get(gId);
    const box = groupBox.get(gId);
    gNodes.sort((a, b) => a.id.localeCompare(b.id));
    for (let i = 0; i < gNodes.length; i++) {
      const col = i % box.cols;
      const row = Math.floor(i / box.cols);
      const x = origin.x + GROUP_PAD + col * (NODE_W + INNER_GAP_X);
      const y = origin.y + GROUP_PAD + row * (NODE_H + INNER_GAP_Y);
      gNodes[i].position = { x, y, w: NODE_W, h: NODE_H };
    }
  }

  // 8b. Lock-Overrides: per @arch position(...) gesetzte Knoten kommen
  //     auf ihre Wunsch-Position - VOR dem Hill-Climbing, damit die
  //     Cost-Funktion sie bereits korrekt einbezieht.
  let lockedCount = 0;
  for (const n of nodes) {
    if (n._lockedPos) {
      n.position = {
        x: n._lockedPos.x,
        y: n._lockedPos.y,
        w: n._lockedPos.w || NODE_W,
        h: n._lockedPos.h || NODE_H,
      };
      lockedCount++;
    }
  }
  autoLayout._lockedCount = lockedCount;

  // 8c. Sugiyama-Crossing-Reduction (Barycenter) auf Knoten-Ebene innerhalb
  //     jeder Gruppe. Reordert die Reihen-Anordnung der Knoten gegen die
  //     jeweilige Nachbar-Reihe (Top-Down + Bottom-Up).
  function nodeNeighbors(nodeId) {
    const out = [];
    for (const e of edges) {
      if (e.from === nodeId && e.to !== nodeId) out.push(e.to);
      if (e.to === nodeId && e.from !== nodeId) out.push(e.from);
    }
    return out;
  }
  for (const [gId, gNodes] of groupNodes.entries()) {
    if (gNodes.length < 2) continue;
    const box = groupBox.get(gId);
    if (box.rows < 2) continue;
    // Aktuelle Knoten-Reihenfolge in Reihen aufteilen
    const ngrid = [];
    for (let i = 0; i < gNodes.length; i += box.cols) {
      ngrid.push(gNodes.slice(i, i + box.cols).map((n) => n.id));
    }
    for (let pass = 0; pass < 4; pass++) {
      for (let r = 1; r < ngrid.length; r++) {
        sugiyamaSort(ngrid[r], ngrid[r - 1], nodeNeighbors);
      }
      for (let r = ngrid.length - 2; r >= 0; r--) {
        sugiyamaSort(ngrid[r], ngrid[r + 1], nodeNeighbors);
      }
    }
    // Flache Reihenfolge zurueckschreiben + Positionen neu vergeben
    const reorderedIds = [].concat(...ngrid);
    const idMap = new Map(gNodes.map((n) => [n.id, n]));
    const reordered = reorderedIds.map((id) => idMap.get(id)).filter(Boolean);
    // gNodes-Array in-place ersetzen
    gNodes.length = 0;
    for (const n of reordered) gNodes.push(n);
    const origin = groupOrigin.get(gId);
    for (let i = 0; i < gNodes.length; i++) {
      const col = i % box.cols;
      const row = Math.floor(i / box.cols);
      gNodes[i].position = {
        x: origin.x + GROUP_PAD + col * (NODE_W + INNER_GAP_X),
        y: origin.y + GROUP_PAD + row * (NODE_H + INNER_GAP_Y),
        w: NODE_W,
        h: NODE_H,
      };
    }
  }
  // Locks erneut sicherstellen nach Sugiyama-Reorder
  for (const n of nodes) {
    if (n._lockedPos) {
      n.position = {
        x: n._lockedPos.x,
        y: n._lockedPos.y,
        w: n._lockedPos.w || NODE_W,
        h: n._lockedPos.h || NODE_H,
      };
    }
  }

  // 9. Knoten-Hill-Climbing innerhalb jeder Gruppe. Cost-Funktion ist
  //    Edge-Length + Crossing-Penalty. Locked Knoten werden uebersprungen.
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  function nodePosMap() {
    const m = new Map();
    for (const n of nodes) if (n.position) m.set(n.id, n.position);
    return m;
  }
  function totalEdgeLen() {
    let sum = 0;
    for (const e of edges) {
      const f = nodeById.get(e.from);
      const t = nodeById.get(e.to);
      if (!f || !t || !f.position || !t.position) continue;
      const dx =
        f.position.x + f.position.w / 2 - (t.position.x + t.position.w / 2);
      const dy =
        f.position.y + f.position.h / 2 - (t.position.y + t.position.h / 2);
      sum += Math.sqrt(dx * dx + dy * dy);
    }
    return sum;
  }
  function combinedCost() {
    return totalEdgeLen() + CROSSING_PENALTY * countCrossings(nodePosMap());
  }
  const nodeLenBefore = totalEdgeLen();
  const nodeCrossBefore = countCrossings(nodePosMap());
  let nodeSwaps = 0;
  for (let pass = 0; pass < 6; pass++) {
    let anySwap = false;
    for (const [gId, gNodes] of groupNodes.entries()) {
      if (gNodes.length < 2) continue;
      let groupImproved = true;
      let safety = 30;
      while (groupImproved && safety-- > 0) {
        groupImproved = false;
        let oldCost = combinedCost();
        for (let i = 0; i < gNodes.length; i++) {
          if (gNodes[i]._lockedPos) continue; // locked - Position ist Anker
          for (let j = i + 1; j < gNodes.length; j++) {
            if (gNodes[j]._lockedPos) continue;
            const posI = gNodes[i].position;
            const posJ = gNodes[j].position;
            gNodes[i].position = posJ;
            gNodes[j].position = posI;
            const newCost = combinedCost();
            if (newCost < oldCost - 0.5) {
              [gNodes[i], gNodes[j]] = [gNodes[j], gNodes[i]];
              oldCost = newCost;
              groupImproved = true;
              anySwap = true;
              nodeSwaps++;
            } else {
              gNodes[i].position = posI;
              gNodes[j].position = posJ;
            }
          }
        }
      }
    }
    if (!anySwap) break;
  }
  // Locks erneut sicherstellen (kein Algorithmus duerfte sie verschieben)
  for (const n of nodes) {
    if (n._lockedPos) {
      n.position = {
        x: n._lockedPos.x,
        y: n._lockedPos.y,
        w: n._lockedPos.w || NODE_W,
        h: n._lockedPos.h || NODE_H,
      };
    }
  }
  autoLayout._nodeSwaps = nodeSwaps;
  autoLayout._nodeLenBefore = Math.round(nodeLenBefore);
  autoLayout._nodeLenAfter = Math.round(totalEdgeLen());
  autoLayout._crossBefore = nodeCrossBefore;
  autoLayout._crossAfter = countCrossings(nodePosMap());
}

autoLayout(nodes, edges);

// --- Edge-Port-Optimierung -----------------------------------------------
// Pro Edge wird gewaehlt:
//   - exitSide / exitAt am Quell-Knoten (wo der Pfeil losgeht)
//   - enterSide / enterAt am Ziel-Knoten (wo er ankommt)
//
// Die Seite (top/right/bottom/left) ergibt sich aus der relativen Lage:
// die Seite des Quell-Knotens, die zum Ziel zeigt - und am Ziel die
// gegenueberliegende Seite.
//
// Wenn an einer Seite eines Knotens MEHRERE Edges andocken (eingehend
// UND ausgehend zaehlen zusammen!), werden ihre Positionen gleichmaessig
// verteilt: 1/(n+1), 2/(n+1), ... Damit ueberlappt nie ein Eingang mit
// einem Ausgang. Sortier-Reihenfolge: nach x bzw. y des jeweils
// gegenueberliegenden Knotens - so kreuzen sich benachbarte Edges nicht.
function computeEdgePorts(nodes, edges) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  function center(n) {
    return {
      x: n.position.x + n.position.w / 2,
      y: n.position.y + n.position.h / 2,
    };
  }

  // Schritt 1: Kardinal-Seite pro Edge bestimmen
  for (const e of edges) {
    const from = nodeById.get(e.from);
    const to = nodeById.get(e.to);
    if (!from || !to || !from.position || !to.position) continue;
    if (e.from === e.to) continue;
    const fc = center(from);
    const tc = center(to);
    const dx = tc.x - fc.x;
    const dy = tc.y - fc.y;
    if (Math.abs(dy) >= Math.abs(dx)) {
      e.exitSide = dy >= 0 ? "bottom" : "top";
      e.enterSide = dy >= 0 ? "top" : "bottom";
    } else {
      e.exitSide = dx >= 0 ? "right" : "left";
      e.enterSide = dx >= 0 ? "left" : "right";
    }
  }

  // Schritt 2: Anlanke pro (Knoten, Seite) sammeln
  const sideMap = new Map();
  function addAttach(key, item) {
    if (!sideMap.has(key)) sideMap.set(key, []);
    sideMap.get(key).push(item);
  }
  for (const e of edges) {
    const from = nodeById.get(e.from);
    const to = nodeById.get(e.to);
    if (!from || !to || !from.position || !to.position) continue;
    if (e.from === e.to) continue;
    const fc = center(from);
    const tc = center(to);
    addAttach(e.from + "|" + e.exitSide, {
      edge: e,
      isOutgoing: true,
      otherX: tc.x,
      otherY: tc.y,
    });
    addAttach(e.to + "|" + e.enterSide, {
      edge: e,
      isOutgoing: false,
      otherX: fc.x,
      otherY: fc.y,
    });
  }

  // Schritt 3: Pro Seite gleichmaessig verteilen.
  // Wichtig: eingehend + ausgehend werden zusammen sortiert -> kein
  // Ueberlapp zwischen Ein- und Ausgang.
  for (const [key, list] of sideMap.entries()) {
    if (list.length < 2) continue; // Default 0.5 reicht
    const side = key.split("|")[1];
    if (side === "top" || side === "bottom") {
      list.sort((a, b) => a.otherX - b.otherX);
    } else {
      list.sort((a, b) => a.otherY - b.otherY);
    }
    const n = list.length;
    for (let i = 0; i < n; i++) {
      const pos = +((i + 1) / (n + 1)).toFixed(3);
      const a = list[i];
      if (a.isOutgoing) a.edge.exitAt = pos;
      else a.edge.enterAt = pos;
    }
  }
}

computeEdgePorts(nodes, edges);

// --- Edge-Bending --------------------------------------------------------
// Loest Restkreuzungen + verhindert Edges, die durch fremde Knoten laufen,
// ueber `curveSide: "left" | "right"`.
//
// Modellierung: repliziert die Bezier-Berechnung des Renderers (in app.js)
// 1:1 - gleiche Anchor-Logik, gleiche Kontrollpunkte, gleicher Bow-Effekt
// fuer curveSide. Daraus wird ein 11-Punkt-Sample der Kurve gewonnen.
// Die Optimierung minimiert dann gemeinsam:
//   - Kanten-Kreuzungen (zwei Kurven schneiden sich)
//   - Knoten-Durchgaenge (eine Kurve laeuft durch eine fremde
//     Knoten-Bounding-Box)  - mit hoeherer Strafe, weil das visuell
//     deutlich schlimmer aussieht.
function optimizeCurveSides(nodes, edges) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const PASSTHROUGH_PENALTY = 4; // pro Knoten-Durchgang (1 Kreuzung = 1)
  const SAMPLES = 11;

  // Erzeugt das Sampling der Bezier-Kurve genau wie der Renderer sie
  // zeichnet. WICHTIG: Aenderungen am Renderer-Pfad muessen hier gespiegelt
  // werden, sonst weichen Schaetzung und Realitaet auseinander.
  function bezierSamples(edge) {
    const f = nodeById.get(edge.from);
    const t = nodeById.get(edge.to);
    if (!f || !t || !f.position || !t.position) return null;
    if (edge.from === edge.to) return null;

    const ah = f.position.h;
    const bh = t.position.h;
    const aBox = {
      top: { x: f.position.x + f.position.w / 2, y: f.position.y },
      bottom: { x: f.position.x + f.position.w / 2, y: f.position.y + ah },
      left: { x: f.position.x, y: f.position.y + ah / 2 },
      right: { x: f.position.x + f.position.w, y: f.position.y + ah / 2 },
    };
    const bBox = {
      top: { x: t.position.x + t.position.w / 2, y: t.position.y },
      bottom: { x: t.position.x + t.position.w / 2, y: t.position.y + bh },
      left: { x: t.position.x, y: t.position.y + bh / 2 },
      right: { x: t.position.x + t.position.w, y: t.position.y + bh / 2 },
    };

    const dx =
      t.position.x + t.position.w / 2 - (f.position.x + f.position.w / 2);
    const dy = t.position.y + bh / 2 - (f.position.y + ah / 2);
    let aAnchor, bAnchor;
    if (Math.abs(dy) > Math.abs(dx) * 0.6) {
      if (dy > 0) {
        aAnchor = "bottom";
        bAnchor = "top";
      } else {
        aAnchor = "top";
        bAnchor = "bottom";
      }
    } else {
      if (dx > 0) {
        aAnchor = "right";
        bAnchor = "left";
      } else {
        aAnchor = "left";
        bAnchor = "right";
      }
    }
    if (edge.exitSide) aAnchor = edge.exitSide;
    if (edge.enterSide) bAnchor = edge.enterSide;

    const p1 = { ...aBox[aAnchor] };
    const p2 = { ...bBox[bAnchor] };
    if (edge.exitAt != null) {
      if (aAnchor === "top" || aAnchor === "bottom")
        p1.x = f.position.x + edge.exitAt * f.position.w;
      else p1.y = f.position.y + edge.exitAt * ah;
    }
    if (edge.enterAt != null) {
      if (bAnchor === "top" || bAnchor === "bottom")
        p2.x = t.position.x + edge.enterAt * t.position.w;
      else p2.y = t.position.y + edge.enterAt * bh;
    }

    function ctrlOff(anchor, p, mag) {
      switch (anchor) {
        case "top":
          return { x: p.x, y: p.y - mag };
        case "bottom":
          return { x: p.x, y: p.y + mag };
        case "left":
          return { x: p.x - mag, y: p.y };
        case "right":
          return { x: p.x + mag, y: p.y };
        default:
          return { x: p.x, y: p.y };
      }
    }
    const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const baseCtrl = Math.max(80, distance * 0.4);
    const c1 = ctrlOff(aAnchor, p1, baseCtrl);
    const c2 = ctrlOff(bAnchor, p2, baseCtrl);
    if (edge.curveSide === "left" || edge.curveSide === "right") {
      const sign = edge.curveSide === "right" ? 1 : -1;
      const isVertical =
        (aAnchor === "top" || aAnchor === "bottom") &&
        (bAnchor === "top" || bAnchor === "bottom");
      const off = 100 * sign;
      if (isVertical) {
        c1.x += off;
        c2.x += off;
      } else {
        c1.y += off;
        c2.y += off;
      }
    }

    // Kubische Bezier B(t) = (1-t)^3 P1 + 3(1-t)^2 t C1 + 3(1-t) t^2 C2 + t^3 P2
    const samples = [];
    for (let i = 0; i < SAMPLES; i++) {
      const tt = i / (SAMPLES - 1);
      const u = 1 - tt;
      const u2 = u * u,
        u3 = u2 * u;
      const t2 = tt * tt,
        t3 = t2 * tt;
      samples.push({
        x: u3 * p1.x + 3 * u2 * tt * c1.x + 3 * u * t2 * c2.x + t3 * p2.x,
        y: u3 * p1.y + 3 * u2 * tt * c1.y + 3 * u * t2 * c2.y + t3 * p2.y,
      });
    }
    return samples;
  }

  function segCross(p1, p2, p3, p4) {
    function ccw(a, b, c) {
      return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    }
    return (
      ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
    );
  }

  function pathsCross(a, b) {
    for (let i = 0; i < a.length - 1; i++) {
      for (let j = 0; j < b.length - 1; j++) {
        if (segCross(a[i], a[i + 1], b[j], b[j + 1])) return true;
      }
    }
    return false;
  }

  function pointInRect(p, r) {
    return p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
  }

  function countPassthroughs(edge, samples) {
    let count = 0;
    for (const n of nodes) {
      if (n.id === edge.from || n.id === edge.to) continue;
      if (!n.position) continue;
      // Erste und letzte Sample-Position liegen auf dem Knoten-Rand der
      // From/To-Knoten; daher beim Test interner Samples (1..N-2) bleiben.
      for (let i = 1; i < samples.length - 1; i++) {
        if (pointInRect(samples[i], n.position)) {
          count++;
          break;
        }
      }
    }
    return count;
  }

  function evaluate() {
    const cache = edges.map((e) => ({ e, s: bezierSamples(e) }));
    let crossings = 0;
    for (let i = 0; i < cache.length; i++) {
      const a = cache[i];
      if (!a.s) continue;
      for (let j = i + 1; j < cache.length; j++) {
        const b = cache[j];
        if (!b.s) continue;
        if (
          a.e.from === b.e.from ||
          a.e.from === b.e.to ||
          a.e.to === b.e.from ||
          a.e.to === b.e.to
        )
          continue;
        if (pathsCross(a.s, b.s)) crossings++;
      }
    }
    let passthroughs = 0;
    for (const c of cache) {
      if (!c.s) continue;
      passthroughs += countPassthroughs(c.e, c.s);
    }
    return {
      crossings,
      passthroughs,
      cost: crossings + PASSTHROUGH_PENALTY * passthroughs,
    };
  }

  function setCurve(e, side) {
    if (side == null) delete e.curveSide;
    else e.curveSide = side;
  }

  const before = evaluate();
  let changes = 0;
  let improved = true;
  let safety = 6;
  while (improved && safety-- > 0) {
    improved = false;
    for (const e of edges) {
      const original = e.curveSide || null;
      let best = original;
      let bestCost = evaluate().cost;
      for (const side of [null, "left", "right"]) {
        if (side === original) continue;
        setCurve(e, side);
        const c = evaluate().cost;
        if (c < bestCost) {
          bestCost = c;
          best = side;
        }
      }
      setCurve(e, best);
      if (best !== original) {
        improved = true;
        changes++;
      }
    }
  }
  const after = evaluate();
  optimizeCurveSides._crossBefore = before.crossings;
  optimizeCurveSides._crossAfter = after.crossings;
  optimizeCurveSides._passBefore = before.passthroughs;
  optimizeCurveSides._passAfter = after.passthroughs;
  optimizeCurveSides._changes = changes;
  optimizeCurveSides._bent = edges.filter((e) => e.curveSide).length;
}

optimizeCurveSides(nodes, edges);

// --- Stufe 3: Lernreise -------------------------------------------------
// Baut aus dem Manifest (Lehrtexte) + den `@arch-step`-Tags (Knoten / Imports)
// + `historyEdges` (Manifest, fuer Edges, die nur historisch existierten)
// die Steps-Sequenz fuer architektur.json.
//
// Diff-Logik: pro Schritt N enthaelt `added.nodes` alle Knoten mit
// firstStep == N, `added.edges` alle Kanten mit step == N. Edge-Step-Default:
// Maximum der Schritte ihrer Endknoten (frueheste Erscheinung beider).
//
// `historyEdges` aus dem Manifest sind Kanten, die im finalen Code NICHT
// existieren (z. B. `create -> useforminput` vor UserForm-Refactor). Sie
// werden im angegebenen Schritt eingefuegt (mit stepOnly: true) und im
// `removedIn`-Schritt als removedEdges aufgefuehrt.
function buildLernreise(manifest, nodes, edges) {
  const errors = [];
  const warnings = [];
  if (
    !manifest ||
    !Array.isArray(manifest.steps) ||
    manifest.steps.length === 0
  ) {
    return { steps: [], errors: ["Manifest hat keine 'steps'."], warnings: [] };
  }
  const stepNumbers = new Set(manifest.steps.map((s) => s.number));
  const maxStep = Math.max(...stepNumbers);

  // 1. firstStep pro Knoten bestimmen.
  //    Reihenfolge der Quellen (1. gewinnt):
  //    a) JSDoc-Tag @arch-step im Quellfile (am refactor-festesten)
  //    b) manifest.nodeSteps[id] als Fallback (v. a. fuer virtuelle Knoten
  //       wie `router` / `storage`, die kein Quellfile haben)
  //    c) Default Schritt 1 (mit Warnung)
  const nodeStepsOverride = manifest.nodeSteps || {};
  const stepOfNode = new Map();
  for (const n of nodes) {
    let step;
    if (n._steps && n._steps.length > 0) {
      step = n._steps[0];
      if (!stepNumbers.has(step)) {
        errors.push(
          `Knoten "${n.id}": @arch-step ${step} - Schritt nicht im Manifest`,
        );
        step = 1;
      }
    } else if (nodeStepsOverride[n.id] != null) {
      step = nodeStepsOverride[n.id];
      if (!stepNumbers.has(step)) {
        errors.push(
          `nodeSteps["${n.id}"] = ${step} - Schritt nicht im Manifest`,
        );
        step = 1;
      }
    } else {
      step = 1;
      warnings.push(
        `Knoten "${n.id}" ohne @arch-step und ohne nodeSteps-Override - default Schritt 1`,
      );
    }
    stepOfNode.set(n.id, step);
  }

  // 2. step pro Edge bestimmen
  const stepOfEdge = new Map();
  for (const e of edges) {
    let step;
    if (e._step != null) {
      step = e._step;
      if (!stepNumbers.has(step)) {
        errors.push(
          `Edge ${e.from}->${e.to}: @arch-step ${step} - Schritt nicht im Manifest`,
        );
        step = 1;
      }
    } else {
      step = Math.max(stepOfNode.get(e.from) || 0, stepOfNode.get(e.to) || 0);
    }
    stepOfEdge.set(e, step);
    // Sanity: Edges duerfen nicht auf Knoten zeigen, die spaeter erscheinen
    const fromStep = stepOfNode.get(e.from);
    const toStep = stepOfNode.get(e.to);
    if (
      fromStep != null &&
      toStep != null &&
      step < Math.max(fromStep, toStep)
    ) {
      errors.push(
        `Edge ${e.from}->${e.to} in Schritt ${step}, aber Endknoten erst in Schritt ${Math.max(fromStep, toStep)}`,
      );
    }
  }

  // 3. historyEdges aus Manifest mergen
  const historyEdges = Array.isArray(manifest.historyEdges)
    ? manifest.historyEdges
    : [];
  const removedAt = new Map(); // step -> [{from, to}, ...]
  const historyByStep = new Map(); // step -> [edge-objs]
  for (const he of historyEdges) {
    if (!stepNumbers.has(he.step)) {
      errors.push(
        `historyEdge ${he.from}->${he.to}: step ${he.step} nicht im Manifest`,
      );
      continue;
    }
    const cleaned = { ...he, stepOnly: true };
    delete cleaned.step;
    delete cleaned.removedIn;
    if (!historyByStep.has(he.step)) historyByStep.set(he.step, []);
    historyByStep.get(he.step).push(cleaned);
    if (he.removedIn != null) {
      if (!stepNumbers.has(he.removedIn)) {
        errors.push(
          `historyEdge ${he.from}->${he.to}: removedIn ${he.removedIn} nicht im Manifest`,
        );
      } else {
        if (!removedAt.has(he.removedIn)) removedAt.set(he.removedIn, []);
        removedAt.get(he.removedIn).push({ from: he.from, to: he.to });
      }
    }
  }

  // 4. Pro Schritt aggregieren
  const cleanEdge = (e) => {
    const out = { from: e.from, to: e.to };
    for (const k of [
      "label",
      "style",
      "enterSide",
      "enterAt",
      "exitSide",
      "exitAt",
      "curveSide",
      "stepOnly",
    ]) {
      if (e[k] != null) out[k] = e[k];
    }
    return out;
  };

  const steps = manifest.steps.map((s) => {
    const newNodes = nodes
      .filter((n) => stepOfNode.get(n.id) === s.number)
      .map((n) => n.id);
    const newCodeEdges = edges
      .filter((e) => stepOfEdge.get(e) === s.number)
      .map(cleanEdge);
    const newHistEdges = historyByStep.get(s.number) || [];
    const removed = removedAt.get(s.number) || [];
    const result = {
      number: s.number,
      title: s.title,
    };
    if (s.short) result.short = s.short;
    if (s.summary) result.summary = s.summary;
    if (s.learn) result.learn = s.learn;
    if (s.tasks) result.tasks = s.tasks;
    result.added = {
      nodes: newNodes,
      edges: [...newCodeEdges, ...newHistEdges],
    };
    if (removed.length > 0) result.removedEdges = removed;
    return result;
  });

  return { steps, errors, warnings, stepOfNode, stepOfEdge };
}

let lernreise = { steps: [], errors: [], warnings: [] };
if (ARGS.lernreise) {
  const manifestPath = path.resolve(PROJECT_ROOT, ARGS.lernreise);
  if (!fs.existsSync(manifestPath)) {
    console.error(
      "[FEHLER] Lernreise-Manifest nicht gefunden: " + manifestPath,
    );
    process.exit(1);
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch (e) {
    console.error(
      "[FEHLER] Manifest konnte nicht geparst werden: " + e.message,
    );
    process.exit(1);
  }
  lernreise = buildLernreise(manifest, nodes, edges);
}

// --- Privatfelder strippen vor JSON-Output ------------------------------
function stripPrivate(obj) {
  for (const k of Object.keys(obj)) {
    if (k.startsWith("_")) delete obj[k];
  }
}
nodes.forEach(stripPrivate);
edges.forEach(stripPrivate);

// --- Output schreiben -----------------------------------------------------
const groups = [...groupSet.keys()].map((id) => ({
  id,
  label: GROUP_LABELS[id] || id,
  tint: GROUP_TINTS[id] || "rgba(160, 160, 160, 0.05)",
}));

const projectName = ARGS.name || path.basename(PROJECT_ROOT);

const output = {
  $schema: "./schema/architektur.schema.json",
  project: {
    name: projectName,
    root: ARGS.src.endsWith("/") ? ARGS.src : ARGS.src + "/",
    stack: [],
  },
  groups,
  nodes,
  edges,
  steps: lernreise.steps,
  tours: {},
  glossary: [],
};

// Output-Verzeichnis sicherstellen
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf-8");

// --- Report ---------------------------------------------------------------
const typeCounts = nodes.reduce((acc, n) => {
  acc[n.type] = (acc[n.type] || 0) + 1;
  return acc;
}, {});
console.log("[OK] geschrieben: " + relPath(OUT_PATH));
console.log(
  "  " +
    nodes.length +
    " Knoten, " +
    edges.length +
    " Kanten, " +
    groups.length +
    " Gruppen",
);
console.log(
  "  Knoten nach Typ: " +
    Object.entries(typeCounts)
      .map(([t, c]) => t + "=" + c)
      .join(", "),
);
console.log(
  "  Stufe 2:        " +
    stufe2Counts.withTags +
    " Knoten mit @arch-Tags, " +
    stufe2Counts.withSidecar +
    " Sidecar(s) mit " +
    stufe2Counts.sectionsTotal +
    " Section(s)",
);
function pct(before, after) {
  if (before <= 0) return 0;
  return Math.round(((before - after) / before) * 100);
}
console.log(
  "  Gruppen-Layout: " +
    autoLayout._swaps +
    " Tausche, Cost " +
    autoLayout._costBefore +
    " -> " +
    autoLayout._costAfter +
    " (-" +
    pct(autoLayout._costBefore, autoLayout._costAfter) +
    "%)",
);
console.log(
  "  Knoten-Layout:  " +
    autoLayout._nodeSwaps +
    " Tausche, Edge-Length " +
    autoLayout._nodeLenBefore +
    "px -> " +
    autoLayout._nodeLenAfter +
    "px (-" +
    pct(autoLayout._nodeLenBefore, autoLayout._nodeLenAfter) +
    "%)",
);
console.log(
  "  Kreuzungen:     " +
    autoLayout._crossBefore +
    " -> " +
    autoLayout._crossAfter +
    " (-" +
    pct(autoLayout._crossBefore, autoLayout._crossAfter) +
    "%)",
);
if (autoLayout._lockedCount > 0) {
  console.log(
    "  Locked Knoten:  " + autoLayout._lockedCount + " (per @arch position)",
  );
}
const portsSet = edges.filter(
  (e) => e.exitAt != null || e.enterAt != null,
).length;
console.log(
  "  Edge-Ports:     " +
    portsSet +
    " von " +
    edges.length +
    " Edges mit verteiltem Ein-/Ausgang",
);
console.log(
  "  Edge-Bending:   " +
    optimizeCurveSides._changes +
    " Aenderungen, " +
    optimizeCurveSides._bent +
    " Edges gebogen",
);
console.log(
  "    Bezier-Kreuzungen: " +
    optimizeCurveSides._crossBefore +
    " -> " +
    optimizeCurveSides._crossAfter +
    " (-" +
    pct(optimizeCurveSides._crossBefore, optimizeCurveSides._crossAfter) +
    "%)",
);
console.log(
  "    Knoten-Durchgaenge: " +
    optimizeCurveSides._passBefore +
    " -> " +
    optimizeCurveSides._passAfter +
    " (-" +
    pct(optimizeCurveSides._passBefore, optimizeCurveSides._passAfter) +
    "%)",
);

// Lernreise-Bilanz, falls Manifest geladen wurde
if (ARGS.lernreise) {
  console.log("  Lernreise:      " + lernreise.steps.length + " Schritte");
  for (const s of lernreise.steps) {
    const removed = s.removedEdges
      ? ", -" + s.removedEdges.length + " Edges"
      : "";
    console.log(
      "    Schritt " +
        s.number +
        " (" +
        (s.short || s.title).substring(0, 24).padEnd(24) +
        ") " +
        s.added.nodes.length +
        " Knoten, " +
        s.added.edges.length +
        " Edges" +
        removed,
    );
  }
  if (lernreise.warnings && lernreise.warnings.length > 0) {
    console.log("  [WARNUNGEN]");
    for (const w of lernreise.warnings) console.log("    - " + w);
  }
  if (lernreise.errors && lernreise.errors.length > 0) {
    console.log("  [FEHLER]");
    for (const e of lernreise.errors) console.log("    - " + e);
    process.exitCode = 2;
  }
}
