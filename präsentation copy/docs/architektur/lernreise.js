/* =============================================================
   Lernreise — Geführter Weg durch alle Aufgaben
   ----------------------------------------------------------------
   Daten kommen aus ./architektur.json (geladen von app.js, das
   `window.architekturReady` und `window.STEPS` bereitstellt sowie
   die globalen NODES/GROUPS füllt).
   ============================================================= */

const LERN_SVG_NS = "http://www.w3.org/2000/svg";
const STORAGE_KEY = "lernreise_progress_v1";

// DOM-Refs
const stepListEl = document.getElementById("step-list");
const stageEl = document.getElementById("lernreise-stage");
const edgesSvg = document.getElementById("lernreise-edges");
const edgeLayer = document.getElementById("l-edge-layer");
const labelLayer = document.getElementById("l-label-layer");
const nodesEl = document.getElementById("lernreise-nodes");
const canvasEmpty = document.getElementById("canvas-empty");
const canvasEl = document.getElementById("lernreise-canvas");
const detailEl = document.getElementById("lernreise-detail");

// State — werden nach window.architekturReady aufgesetzt.
let currentStep = 0;
let STEPS;
let nodeById;

// Progress (visited steps) aus localStorage laden
function loadVisited() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(arr);
  } catch (e) { return new Set(); }
}
function saveVisited(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch (e) {}
}
let visited = loadVisited();

// =============================================================
// STEP-BERECHNUNG
// =============================================================
// Baut den aktiven Zustand (Knoten + Kanten) fuer einen Schritt auf,
// indem alle `added` bis einschliesslich dieses Schritts akkumuliert werden.
function computeState(stepNumber) {
  const activeNodeIds = new Set();
  const activeEdges = [];
  const removedEdges = new Set();  // keyed by "from→to"

  for (let i = 0; i <= stepNumber; i++) {
    const step = STEPS[i];
    if (!step || !step.added) continue;

    (step.added.nodes || []).forEach(id => activeNodeIds.add(id));

    (step.added.removedEdges || []).forEach(e => {
      removedEdges.add(`${e.from}→${e.to}`);
    });

    (step.added.edges || []).forEach(e => {
      const key = `${e.from}→${e.to}`;
      // skip if already marked removed by this or an earlier step
      if (removedEdges.has(key)) return;
      activeEdges.push(e);
    });
  }

  // Final filter: falls ein edge in der aktiven Liste ist, aber inzwischen removed wurde
  const filteredEdges = activeEdges.filter(e => !removedEdges.has(`${e.from}→${e.to}`));

  const activeNodes = [...activeNodeIds]
    .map(id => nodeById.get(id))
    .filter(Boolean);

  return { activeNodes, activeEdges: filteredEdges };
}

// EDGE-ROUTING — getEdgePath() und edgeStyleClass() kommen aus app.js,
// damit Architektur-Karte und Lernreise garantiert identische Pfade
// rendern. Frueher gab es hier eine eigenstaendige Kopie, die mit der
// Zeit von der Karte abgewichen ist.

// =============================================================
// RENDER — STEP LIST
// =============================================================
function renderStepList() {
  stepListEl.innerHTML = "";
  STEPS.forEach(step => {
    const li = document.createElement("li");
    li.className = "step-list-item";
    if (step.number === currentStep) li.classList.add("active");
    if (visited.has(step.number) && step.number !== currentStep) li.classList.add("visited");

    li.innerHTML = `
      <button class="step-list-button" data-step="${step.number}" type="button">
        <span class="step-list-num">${step.number === 0 ? "★" : step.number}</span>
        <span class="step-list-body">
          <span class="step-list-title">${step.short || step.title}</span>
          <span class="step-list-hint">${step.number === 0 ? "Projekt-Ueberblick" : "Aufgabe " + step.number}</span>
        </span>
      </button>
    `;
    stepListEl.appendChild(li);
  });

  stepListEl.querySelectorAll(".step-list-button").forEach(btn => {
    btn.addEventListener("click", () => goToStep(parseInt(btn.dataset.step, 10)));
  });
}

// =============================================================
// RENDER — DIAGRAM
// =============================================================
function renderDiagram() {
  const { activeNodes, activeEdges } = computeState(currentStep);

  nodesEl.innerHTML = "";
  edgeLayer.innerHTML = "";
  labelLayer.innerHTML = "";

  if (activeNodes.length === 0) {
    canvasEmpty.hidden = false;
    stageEl.style.opacity = "0";
    return;
  }
  canvasEmpty.hidden = true;
  stageEl.style.opacity = "";

  const addedThisStep = new Set(STEPS[currentStep].added?.nodes || []);

  // Render nodes (ohne Kanten — die kommen nach der Messung)
  activeNodes.forEach(n => {
    const el = document.createElement("div");
    el.className = `node type-${n.type} lern-node`;
    el.dataset.nodeId = n.id;
    el.style.left = n.x + "px";
    el.style.top = n.y + "px";
    el.style.width = n.w + "px";
    if (addedThisStep.has(n.id)) el.classList.add("lern-node-new");

    el.innerHTML = `
      <div class="node-header">
        <span class="node-badge">${n.badge}</span>
      </div>
      <div class="node-title">${n.title}</div>
      <div class="node-subtitle">${n.subtitle}</div>
      ${addedThisStep.has(n.id) ? '<div class="lern-new-tag">Neu</div>' : ''}
    `;
    nodesEl.appendChild(el);
  });

  // NACH dem Render: tatsaechliche Knotenhoehen messen, DANN Kanten zeichnen.
  // So sitzen die Pfeile exakt an der Unterkante/Oberkante der Nodes statt
  // am vermuteten statischen h-Wert.
  requestAnimationFrame(() => {
    activeNodes.forEach(n => {
      const el = nodesEl.querySelector(`[data-node-id="${n.id}"]`);
      if (el) n.measuredH = el.offsetHeight;
    });
    renderEdgesForStep(activeEdges);
    fitDiagram(activeNodes);
  });
}

function renderEdgesForStep(activeEdges) {
  edgeLayer.innerHTML = "";
  labelLayer.innerHTML = "";

  const addedEdgeKeys = new Set(
    (STEPS[currentStep].added?.edges || []).map(e => `${e.from}→${e.to}`)
  );
  activeEdges.forEach(edge => {
    const info = getEdgePath(edge, nodeById);
    if (!info) return;
    const path = document.createElementNS(LERN_SVG_NS, "path");
    path.setAttribute("d", info.d);
    path.setAttribute("class", `edge-path lern-edge ${edgeStyleClass(edge.style)}`);
    path.setAttribute("marker-end", "url(#l-arrow)");
    if (addedEdgeKeys.has(`${edge.from}→${edge.to}`)) {
      path.classList.add("lern-edge-new");
    }
    edgeLayer.appendChild(path);

    if (edge.label) {
      const group = document.createElementNS(LERN_SVG_NS, "g");
      const text = document.createElementNS(LERN_SVG_NS, "text");
      text.setAttribute("class", "edge-label");
      text.setAttribute("x", info.midX);
      text.setAttribute("y", info.midY - 4);
      text.setAttribute("text-anchor", "middle");
      text.textContent = edge.label;
      const bg = document.createElementNS(LERN_SVG_NS, "rect");
      bg.setAttribute("class", "edge-label-bg");
      bg.setAttribute("rx", "3");
      group.appendChild(bg);
      group.appendChild(text);
      labelLayer.appendChild(group);
      requestAnimationFrame(() => {
        try {
          const bbox = text.getBBox();
          bg.setAttribute("x", bbox.x - 3);
          bg.setAttribute("y", bbox.y - 1);
          bg.setAttribute("width", bbox.width + 6);
          bg.setAttribute("height", bbox.height + 2);
        } catch (e) {}
      });
    }
  });
}

function fitDiagram(activeNodes) {
  if (!activeNodes.length) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  activeNodes.forEach(n => {
    const h = n.measuredH || n.h || 90;
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x + n.w > maxX) maxX = n.x + n.w;
    if (n.y + h > maxY) maxY = n.y + h;
  });

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const wrap = canvasEl.getBoundingClientRect();
  const padding = 60;
  const scale = Math.min(
    (wrap.width - padding * 2) / contentW,
    (wrap.height - padding * 2) / contentH,
    1
  );
  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const tx = (wrap.width - scaledW) / 2 - minX * scale;
  const ty = (wrap.height - scaledH) / 2 - minY * scale;

  stageEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  stageEl.style.transformOrigin = "0 0";

  // SVG-Viewbox auf content box setzen, damit Pfade klappen
  edgesSvg.setAttribute("viewBox", `${minX} ${minY} ${contentW} ${contentH}`);
  edgesSvg.style.left = minX + "px";
  edgesSvg.style.top = minY + "px";
  edgesSvg.style.width = contentW + "px";
  edgesSvg.style.height = contentH + "px";
}

// =============================================================
// RENDER — DETAIL PANEL (right column)
// =============================================================
function renderDetail() {
  const step = STEPS[currentStep];
  const total = STEPS.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;

  let addedNodesHtml = "";
  if (step.added?.nodes?.length) {
    addedNodesHtml = `
      <section class="detail-section">
        <h3>Neu in diesem Schritt</h3>
        <ul class="added-list">
          ${step.added.nodes.map(id => {
            const n = nodeById.get(id);
            if (!n) return "";
            return `<li class="added-pill type-${n.type}">
              <strong>${n.title}</strong>
              <span>${n.badge}</span>
            </li>`;
          }).join("")}
        </ul>
      </section>
    `;
  }

  let edgeAdditionHtml = "";
  const newEdges = (step.added?.edges || []).filter(e => !e.stepOnly);
  if (newEdges.length && !step.added?.nodes?.length) {
    edgeAdditionHtml = `
      <section class="detail-section">
        <h3>Neue Verbindungen</h3>
        <ul class="added-edge-list">
          ${newEdges.map(e => {
            const from = nodeById.get(e.from);
            const to = nodeById.get(e.to);
            return `<li><strong>${from?.title || e.from}</strong> → <strong>${to?.title || e.to}</strong>${e.label ? `<span class="added-edge-label">${e.label}</span>` : ""}</li>`;
          }).join("")}
        </ul>
      </section>
    `;
  }

  let tasksHtml = "";
  if (step.tasks?.length) {
    tasksHtml = `
      <section class="detail-section">
        <h3>Was du machst</h3>
        <ol class="task-list">
          ${step.tasks.map(t => `<li>${t}</li>`).join("")}
        </ol>
      </section>
    `;
  }

  let learnHtml = "";
  if (step.learn?.length) {
    learnHtml = `
      <section class="detail-section">
        <h3>Was du dabei lernst</h3>
        <ul class="learn-list">
          ${step.learn.map(l => `<li>${l}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  detailEl.innerHTML = `
    <header class="detail-step-head">
      <span class="detail-step-num">${step.number === 0 ? "Intro" : "Aufgabe " + step.number}</span>
      <h1>${step.title}</h1>
      <p class="detail-step-summary">${step.summary}</p>
    </header>

    ${tasksHtml}
    ${learnHtml}
    ${addedNodesHtml}
    ${edgeAdditionHtml}

    <nav class="detail-nav">
      <button class="btn btn-secondary" data-nav="prev" ${isFirst ? "disabled" : ""}>
        &larr; Vorher
      </button>
      <span class="detail-counter">${currentStep + 1} / ${total}</span>
      <button class="btn btn-primary" data-nav="next" ${isLast ? "disabled" : ""}>
        Weiter &rarr;
      </button>
    </nav>
  `;

  detailEl.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.nav === "prev") goToStep(currentStep - 1);
      else goToStep(currentStep + 1);
    });
  });
}

// =============================================================
// NAVIGATION
// =============================================================
function goToStep(n) {
  if (n < 0 || n >= STEPS.length) return;
  currentStep = n;
  // Automatisch als besucht markieren
  visited.add(n);
  saveVisited(visited);
  location.hash = "#" + n;
  render();
  // Scroll step list item into view
  requestAnimationFrame(() => {
    const activeItem = stepListEl.querySelector(".step-list-item.active");
    if (activeItem) activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

function readHash() {
  const match = location.hash.match(/^#(\d+)$/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (!isNaN(n) && n >= 0 && n < STEPS.length) {
      currentStep = n;
    }
  }
}

// =============================================================
// RENDER-MASTER
// =============================================================
function render() {
  renderStepList();
  renderDiagram();
  renderDetail();
}

window.addEventListener("hashchange", () => {
  readHash();
  render();
});

window.addEventListener("resize", () => {
  const { activeNodes } = computeState(currentStep);
  fitDiagram(activeNodes);
});

// Boot — wartet auf die JSON-Daten aus app.js (window.architekturReady).
window.architekturReady
  .then(() => {
    STEPS = window.STEPS;
    nodeById = new Map(NODES.map((n) => [n.id, n]));
    readHash();
    // Schritt 0 automatisch besucht markieren (Einstieg)
    visited.add(currentStep);
    saveVisited(visited);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        render();
      });
    });
  })
  .catch(() => {
    // Fehleranzeige übernimmt bereits app.js.
  });
