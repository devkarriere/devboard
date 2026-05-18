/* =============================================================
   Architektur-Karte — Nutzerverwaltung
   ----------------------------------------------------------------
   Ab dieser Version werden Daten NICHT mehr inline gepflegt.
   Quelle ist ./architektur.json (siehe ../architektur2/README.md).
   Das macht das Display generisch wiederverwendbar — für jedes
   React-Projekt, das eine architektur.json mitbringt.
   ============================================================= */

// Modul-weite Daten-Variablen. Werden vom Promise unten gefüllt,
// bevor der Renderer (am Ende der Datei) tatsächlich startet.
let NODES, GROUPS, EDGES, DETAILS, TOURS, GLOSSARY;

// =================================================================
// SHARED EDGE ROUTING
// Wird sowohl von der Architektur-Karte (unten) als auch von der
// Lernreise (lernreise.js) verwendet, damit beide Ansichten exakt
// dieselben Pfadverlaeufe rendern. Vorher gab es zwei Kopien, die
// auseinander gelaufen sind — nicht mehr duplizieren.
// =================================================================
function getEdgePath(edge, nodeMap) {
  const a = nodeMap.get(edge.from);
  const b = nodeMap.get(edge.to);
  if (!a || !b) return null;

  const ah = a.measuredH || a.h || 90;
  const bh = b.measuredH || b.h || 90;

  const aBoxes = {
    top:    { x: a.x + a.w/2, y: a.y },
    bottom: { x: a.x + a.w/2, y: a.y + ah },
    left:   { x: a.x,         y: a.y + ah/2 },
    right:  { x: a.x + a.w,   y: a.y + ah/2 },
  };
  const bBoxes = {
    top:    { x: b.x + b.w/2, y: b.y },
    bottom: { x: b.x + b.w/2, y: b.y + bh },
    left:   { x: b.x,         y: b.y + bh/2 },
    right:  { x: b.x + b.w,   y: b.y + bh/2 },
  };

  const dx = (b.x + b.w/2) - (a.x + a.w/2);
  const dy = (b.y + bh/2) - (a.y + ah/2);

  let aAnchor, bAnchor;
  if (Math.abs(dy) > Math.abs(dx) * 0.6) {
    if (dy > 0) { aAnchor = "bottom"; bAnchor = "top"; }
    else        { aAnchor = "top";    bAnchor = "bottom"; }
  } else {
    if (dx > 0) { aAnchor = "right";  bAnchor = "left"; }
    else        { aAnchor = "left";   bAnchor = "right"; }
  }

  // exitSide / enterSide haben hoechste Prioritaet - der Generator setzt
  // diese Felder bewusst, damit Pfeile an der richtigen Knoten-Seite ankommen.
  if (edge.exitSide)  aAnchor = edge.exitSide;
  if (edge.enterSide) bAnchor = edge.enterSide;

  let p1 = { ...aBoxes[aAnchor] };
  let p2 = { ...bBoxes[bAnchor] };

  if (edge.exitAt != null) {
    if (aAnchor === "top" || aAnchor === "bottom") p1.x = a.x + edge.exitAt * a.w;
    else                                           p1.y = a.y + edge.exitAt * ah;
  }
  if (edge.enterAt != null) {
    if (bAnchor === "top" || bAnchor === "bottom") p2.x = b.x + edge.enterAt * b.w;
    else                                           p2.y = b.y + edge.enterAt * bh;
  }

  function ctrlOffset(anchor, p, mag) {
    switch (anchor) {
      case "top":    return { x: p.x,         y: p.y - mag };
      case "bottom": return { x: p.x,         y: p.y + mag };
      case "left":   return { x: p.x - mag,   y: p.y };
      case "right":  return { x: p.x + mag,   y: p.y };
      default:       return { x: p.x,         y: p.y };
    }
  }
  const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const baseCtrl = Math.max(80, distance * 0.4);
  let c1 = ctrlOffset(aAnchor, p1, baseCtrl);
  let c2 = ctrlOffset(bAnchor, p2, baseCtrl);

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

  const d = `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  return { d, midX, midY, p1, p2 };
}

function edgeStyleClass(style) {
  switch (style) {
    case "dashed": return "dashed";
    case "dotted": return "dotted";
    case "fine-dotted": return "fine-dotted";
    default: return "";
  }
}

// Promise wird auch von lernreise.js abgewartet, damit beide Seiten
// dieselbe einzige fetch-Quelle teilen.
window.architekturReady = fetch("./architektur.json")
  .then((r) => {
    if (!r.ok) throw new Error("architektur.json HTTP " + r.status);
    return r.json();
  })
  .then((data) => {
    // Renderer erwartet x/y/w/h direkt am Knoten (nicht position.{...}).
    // Im JSON steht position.{x,y,w,h} — hier flachklopfen.
    NODES = data.nodes.map((n) => {
      const pos = n.position || {};
      return {
        ...n,
        x: pos.x, y: pos.y, w: pos.w, h: pos.h,
      };
    });
    GROUPS   = data.groups   || [];
    EDGES    = data.edges    || [];
    TOURS    = data.tours    || {};
    GLOSSARY = data.glossary || [];

    // Renderer erwartet DETAILS als id-indexierte Map.
    DETAILS = {};
    data.nodes.forEach((n) => {
      DETAILS[n.id] = {
        summary:  n.summary  || "",
        sections: n.sections || [],
      };
    });

    // Lernreise-Schritte für lernreise.js bereitstellen.
    window.STEPS = data.steps || [];

    return data;
  })
  .catch((err) => {
    console.error("Architektur-Daten konnten nicht geladen werden:", err);
    const el = document.getElementById("canvas-stage") || document.body;
    el.insertAdjacentHTML(
      "afterbegin",
      `<div style="padding:20px;color:#c33;font-family:system-ui">
         <strong>Fehler beim Laden von architektur.json</strong><br>
         ${err.message}<br>
         <em>Tipp: Diese Seite muss über einen lokalen Webserver geöffnet werden (z.B. <code>python3 -m http.server</code>). Direktes Öffnen via <code>file://</code> blockiert <code>fetch()</code>.</em>
       </div>`
    );
    throw err;
  });

// =================================================================
// RENDERING
// Läuft NUR auf der Architektur-Karte (canvas-stage existiert).
// Auf lernreise.html bleibt das hier ungenutzt — lernreise.js wartet
// stattdessen direkt auf window.architekturReady.
// =================================================================
if (document.getElementById("canvas-stage")) {
  window.architekturReady.then(() => (() => {

const SVG_NS = "http://www.w3.org/2000/svg";
const stage = document.getElementById("canvas-stage");
const viewport = document.getElementById("canvas-viewport");
const canvasWrap = document.getElementById("canvas-wrapper");
const nodeLayer = document.getElementById("canvas-nodes");
const edgeLayer = document.getElementById("edge-layer");
const edgeLabelLayer = document.getElementById("edge-label-layer");
const particleLayer = document.getElementById("particle-layer");
const svgCanvas = document.getElementById("canvas-edges");
const minimapSvg = document.getElementById("minimap-svg");
const minimapViewport = document.getElementById("minimap-viewport");

const STAGE_W = 2400;
const STAGE_H = 1620;
stage.style.width = STAGE_W + "px";
stage.style.height = STAGE_H + "px";
svgCanvas.setAttribute("viewBox", `0 0 ${STAGE_W} ${STAGE_H}`);
svgCanvas.setAttribute("width", STAGE_W);
svgCanvas.setAttribute("height", STAGE_H);

const nodeById = new Map();
NODES.forEach(n => nodeById.set(n.id, n));

// ---- Group boxes (gestrichelte Pakete um die Cluster) ----
const GROUP_PAD = 22;
const GROUP_TOP_PAD = 32; // extra room for the label
function renderGroupBoxes() {
  GROUPS.forEach(group => {
    const groupNodes = NODES.filter(n => n.group === group.id);
    if (!groupNodes.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    groupNodes.forEach(n => {
      const h = n.measuredH || n.h || 90;
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + n.w > maxX) maxX = n.x + n.w;
      if (n.y + h > maxY) maxY = n.y + h;
    });
    const box = document.createElement("div");
    box.className = "group-box";
    box.dataset.groupId = group.id;
    box.style.left = (minX - GROUP_PAD) + "px";
    box.style.top = (minY - GROUP_TOP_PAD) + "px";
    box.style.width = (maxX - minX + GROUP_PAD * 2) + "px";
    box.style.height = (maxY - minY + GROUP_TOP_PAD + GROUP_PAD) + "px";
    box.style.background = group.tint;

    const label = document.createElement("span");
    label.className = "group-box-label";
    label.textContent = group.label;
    box.appendChild(label);

    nodeLayer.appendChild(box);
  });
}

// ---- Render Nodes ----
NODES.forEach(n => {
  const el = document.createElement("div");
  el.className = `node type-${n.type}`;
  el.id = `node-${n.id}`;
  el.style.left = n.x + "px";
  el.style.top = n.y + "px";
  el.style.width = n.w + "px";
  el.dataset.nodeId = n.id;

  el.innerHTML = `
    <div class="node-header">
      <span class="node-badge">${n.badge}</span>
    </div>
    <div class="node-title">${n.title}</div>
    <div class="node-subtitle">${n.subtitle}</div>
  `;

  nodeLayer.appendChild(el);

  // Measure actual height after render (for edge endpoint calculation)
  requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const scale = currentScale || 1;
    n.measuredH = rect.height / scale;
  });
});

function renderEdges() {
  edgeLayer.innerHTML = "";
  edgeLabelLayer.innerHTML = "";

  EDGES.forEach((edge, i) => {
    const info = getEdgePath(edge, nodeById);
    if (!info) return;

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", info.d);
    path.setAttribute("class", `edge-path ${edgeStyleClass(edge.style)}`);
    path.setAttribute("marker-end", "url(#arrow-solid)");
    path.setAttribute("id", `edge-${i}`);
    path.dataset.edgeIndex = i;
    path.dataset.from = edge.from;
    path.dataset.to = edge.to;
    edgeLayer.appendChild(path);

    // Label with background
    if (edge.label) {
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", "edge-label-group");
      group.dataset.edgeIndex = i;

      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("class", "edge-label");
      text.setAttribute("x", info.midX);
      text.setAttribute("y", info.midY);
      text.setAttribute("dy", "-4");
      text.textContent = edge.label;

      // Background rect (sized after render)
      const bg = document.createElementNS(SVG_NS, "rect");
      bg.setAttribute("class", "edge-label-bg");
      bg.setAttribute("rx", "3");
      group.appendChild(bg);
      group.appendChild(text);
      edgeLabelLayer.appendChild(group);

      requestAnimationFrame(() => {
        try {
          const bbox = text.getBBox();
          bg.setAttribute("x", bbox.x - 3);
          bg.setAttribute("y", bbox.y - 1);
          bg.setAttribute("width", bbox.width + 6);
          bg.setAttribute("height", bbox.height + 2);
        } catch(e) {}
      });
    }
  });
}

// =================================================================
// PAN & ZOOM
// =================================================================
let currentScale = 1;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let dragStart = { x: 0, y: 0, origX: 0, origY: 0 };

function applyTransform() {
  stage.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
  updateMinimapViewport();
}

function setView(x, y, scale) {
  currentX = x;
  currentY = y;
  currentScale = scale;
  applyTransform();
}

function fitToView(padding = 40) {
  // Compute bounding box of all nodes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  NODES.forEach(n => {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x + n.w > maxX) maxX = n.x + n.w;
    const h = n.measuredH || n.h || 90;
    if (n.y + h > maxY) maxY = n.y + h;
  });
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const wrapRect = canvasWrap.getBoundingClientRect();
  const scaleX = (wrapRect.width - padding * 2) / contentW;
  const scaleY = (wrapRect.height - padding * 2) / contentH;
  const scale = Math.min(scaleX, scaleY, 1);
  const x = (wrapRect.width - contentW * scale) / 2 - minX * scale;
  const y = (wrapRect.height - contentH * scale) / 2 - minY * scale;
  setView(x, y, scale);
}

function centerOnNode(id, scale = 0.85) {
  const n = nodeById.get(id);
  if (!n) return;
  const h = n.measuredH || n.h || 90;
  const wrapRect = canvasWrap.getBoundingClientRect();
  const cx = n.x + n.w / 2;
  const cy = n.y + h / 2;
  const x = wrapRect.width / 2 - cx * scale;
  const y = wrapRect.height / 2 - cy * scale;
  setView(x, y, scale);
}

// Mouse pan
let dragMoved = false;
viewport.addEventListener("mousedown", (e) => {
  if (e.target.closest(".node")) return;
  isDragging = true;
  dragMoved = false;
  viewport.classList.add("grabbing");
  dragStart = { x: e.clientX, y: e.clientY, origX: currentX, origY: currentY };
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  if (Math.abs(e.clientX - dragStart.x) > 3 || Math.abs(e.clientY - dragStart.y) > 3) dragMoved = true;
  currentX = dragStart.origX + (e.clientX - dragStart.x);
  currentY = dragStart.origY + (e.clientY - dragStart.y);
  applyTransform();
});
window.addEventListener("mouseup", () => {
  isDragging = false;
  viewport.classList.remove("grabbing");
});

// Click on empty canvas → deselect
viewport.addEventListener("click", (e) => {
  if (e.target.closest(".node")) return;
  if (dragMoved) return;          // don't deselect on drag-release
  if (tourState.active) return;   // tours steuern Highlights selbst
  deselectNode();
});

// Wheel zoom (cursor-focused)
viewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const wrapRect = canvasWrap.getBoundingClientRect();
  const mouseX = e.clientX - wrapRect.left;
  const mouseY = e.clientY - wrapRect.top;
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  const newScale = Math.max(0.2, Math.min(2.5, currentScale * factor));
  // Keep point under cursor stable
  currentX = mouseX - (mouseX - currentX) * (newScale / currentScale);
  currentY = mouseY - (mouseY - currentY) * (newScale / currentScale);
  currentScale = newScale;
  applyTransform();
}, { passive: false });

// Control buttons
document.getElementById("ctrl-zoom-in").addEventListener("click", () => {
  const factor = 1.2;
  const wrapRect = canvasWrap.getBoundingClientRect();
  const cx = wrapRect.width / 2;
  const cy = wrapRect.height / 2;
  const newScale = Math.min(2.5, currentScale * factor);
  currentX = cx - (cx - currentX) * (newScale / currentScale);
  currentY = cy - (cy - currentY) * (newScale / currentScale);
  currentScale = newScale;
  applyTransform();
});
document.getElementById("ctrl-zoom-out").addEventListener("click", () => {
  const factor = 1/1.2;
  const wrapRect = canvasWrap.getBoundingClientRect();
  const cx = wrapRect.width / 2;
  const cy = wrapRect.height / 2;
  const newScale = Math.max(0.2, currentScale * factor);
  currentX = cx - (cx - currentX) * (newScale / currentScale);
  currentY = cy - (cy - currentY) * (newScale / currentScale);
  currentScale = newScale;
  applyTransform();
});
document.getElementById("ctrl-fit").addEventListener("click", () => fitToView());
document.getElementById("btn-reset-view").addEventListener("click", () => fitToView());

// =================================================================
// HOVER / SELECT
// =================================================================
let selectedId = null;

function neighborsOf(id) {
  const nodes = new Set([id]);
  const edges = new Set();
  EDGES.forEach((e, i) => {
    if (e.from === id || e.to === id) {
      nodes.add(e.from);
      nodes.add(e.to);
      edges.add(i);
    }
  });
  return { nodes, edges };
}

function clearHighlight() {
  document.querySelectorAll(".node").forEach(n => {
    n.classList.remove("highlight", "dimmed");
  });
  document.querySelectorAll(".edge-path").forEach(p => {
    p.classList.remove("highlight", "dimmed");
  });
  document.querySelectorAll(".edge-label").forEach(l => {
    l.classList.remove("highlight", "dimmed");
  });
}

function applyHighlight(nodeId) {
  const { nodes, edges } = neighborsOf(nodeId);
  document.querySelectorAll(".node").forEach(n => {
    const id = n.dataset.nodeId;
    if (nodes.has(id)) {
      n.classList.add("highlight");
      n.classList.remove("dimmed");
    } else {
      n.classList.add("dimmed");
      n.classList.remove("highlight");
    }
  });
  document.querySelectorAll(".edge-path").forEach(p => {
    const i = parseInt(p.dataset.edgeIndex);
    if (edges.has(i)) {
      p.classList.add("highlight");
      p.classList.remove("dimmed");
    } else {
      p.classList.add("dimmed");
      p.classList.remove("highlight");
    }
  });
  document.querySelectorAll(".edge-label-group").forEach(g => {
    const i = parseInt(g.dataset.edgeIndex);
    const label = g.querySelector(".edge-label");
    if (edges.has(i)) {
      label.classList.add("highlight");
      label.classList.remove("dimmed");
    } else {
      label.classList.add("dimmed");
      label.classList.remove("highlight");
    }
  });
}

// Hover behaviour
nodeLayer.addEventListener("mouseover", (e) => {
  if (tourState.active) return;
  const nodeEl = e.target.closest(".node");
  if (!nodeEl) return;
  applyHighlight(nodeEl.dataset.nodeId);
});
nodeLayer.addEventListener("mouseout", (e) => {
  if (tourState.active) return;
  const related = e.relatedTarget;
  if (related && related.closest && related.closest(".node")) return;
  clearHighlight();
  if (selectedId) applyHighlight(selectedId);
});

// Click -> details
nodeLayer.addEventListener("click", (e) => {
  const nodeEl = e.target.closest(".node");
  if (!nodeEl) return;
  selectNode(nodeEl.dataset.nodeId);
});

function selectNode(id) {
  selectedId = id;
  document.querySelectorAll(".node.selected").forEach(n => n.classList.remove("selected"));
  document.getElementById(`node-${id}`).classList.add("selected");
  renderDetail(id);
  applyHighlight(id);
}

function deselectNode() {
  selectedId = null;
  document.querySelectorAll(".node.selected").forEach(n => n.classList.remove("selected"));
  clearHighlight();
  detailPlaceholder.hidden = false;
  detailContent.hidden = true;
  detailContent.innerHTML = "";
}

// =================================================================
// DETAIL PANEL
// =================================================================
const detailPlaceholder = document.getElementById("detail-placeholder");
const detailContent = document.getElementById("detail-content");

function renderDetail(id) {
  const node = nodeById.get(id);
  const detail = DETAILS[id];
  if (!node || !detail) return;

  const neighbors = [];
  EDGES.forEach(e => {
    if (e.from === id) {
      neighbors.push({ id: e.to, direction: "→ nutzt", label: e.label });
    } else if (e.to === id) {
      neighbors.push({ id: e.from, direction: "← genutzt von", label: e.label });
    }
  });

  let html = `
    <div class="detail-head">
      <div>
        <span class="detail-type-pill" style="background:${typeColor(node.type)}">${node.badge}</span>
        <h2>${node.title}</h2>
        <div class="detail-path">📁 ${node.path}</div>
      </div>
    </div>
    <p>${detail.summary}</p>
  `;

  detail.sections.forEach(sec => {
    html += `<div class="detail-section"><h3>${sec.title}</h3>`;
    if (sec.body) html += `<p>${sec.body}</p>`;
    if (sec.callout) html += `<div class="callout callout-key">${sec.callout}</div>`;
    if (sec.code) html += `<div class="code-block">${highlightCode(sec.code)}</div>`;
    html += `</div>`;
  });

  if (neighbors.length) {
    html += `<div class="detail-section"><h3>Verbindungen</h3><ul class="detail-list">`;
    neighbors.forEach(nb => {
      const target = nodeById.get(nb.id);
      if (!target) return;
      html += `<li data-goto="${nb.id}">
        <span class="rel-label">${nb.direction} · ${nb.label}</span>
        <strong>${target.title}</strong>
      </li>`;
    });
    html += `</ul></div>`;
  }

  detailContent.innerHTML = html;
  detailPlaceholder.hidden = true;
  detailContent.hidden = false;

  detailContent.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.goto;
      selectNode(id);
      centerOnNode(id, Math.max(currentScale, 0.75));
    });
  });
}

function typeColor(t) {
  return {
    entry: "#00dcff", state: "#7b5bff", router: "#0fbfa0",
    view: "#f39c12", component: "#e85a8a", hook: "#3fbf5f",
    type: "#8a94a3", external: "#4a5666"
  }[t] || "#333";
}

// Very light syntax highlighting for code blocks
function highlightCode(code) {
  const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/(\/\/[^\n]*)/g, '<span class="tk-cm">$1</span>')
    .replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="tk-str">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|switch|case|break|default|import|export|type|enum|new|from|useState|useReducer|useContext|useEffect|useParams|useNavigate)\b/g, '<span class="tk-kw">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="tk-num">$1</span>');
}

// =================================================================
// TOURS
// =================================================================
const tourState = {
  active: false,
  tour: null,
  step: 0,
  interval: null,
};
const tourBanner = document.getElementById("tour-banner");
const tourStepBadge = document.getElementById("tour-step-badge");
const tourStepTitle = document.getElementById("tour-step-title");
const tourStepDescription = document.getElementById("tour-step-description");
const tourPrev = document.getElementById("tour-prev");
const tourNext = document.getElementById("tour-next");
const btnStopTour = document.getElementById("btn-stop-tour");

function startTour(tourId) {
  stopTour();
  tourState.active = true;
  tourState.tour = TOURS[tourId];
  tourState.step = 0;
  tourBanner.hidden = false;
  btnStopTour.hidden = false;
  document.querySelectorAll(".tour-card").forEach(c => {
    c.classList.toggle("active", c.dataset.tour === tourId);
  });
  showTourStep();
}

function stopTour() {
  tourState.active = false;
  tourState.tour = null;
  tourState.step = 0;
  clearInterval(tourState.interval);
  tourState.interval = null;
  tourBanner.hidden = true;
  btnStopTour.hidden = true;
  document.querySelectorAll(".tour-card").forEach(c => c.classList.remove("active"));
  clearTourHighlight();
  clearHighlight();
  clearParticles();
  if (selectedId) applyHighlight(selectedId);
}

function clearTourHighlight() {
  document.querySelectorAll(".node").forEach(n => n.classList.remove("tour-active"));
  document.querySelectorAll(".edge-path").forEach(p => p.classList.remove("tour-active"));
}

function showTourStep() {
  const step = tourState.tour.steps[tourState.step];
  const total = tourState.tour.steps.length;
  if (!step) return;

  tourStepBadge.textContent = `${tourState.step + 1} / ${total}`;
  tourStepTitle.textContent = step.title;
  tourStepDescription.innerHTML = step.description;
  tourPrev.disabled = tourState.step === 0;
  tourNext.textContent = tourState.step === total - 1 ? "Fertig" : "Weiter →";

  // Dim everything
  clearTourHighlight();
  document.querySelectorAll(".node").forEach(n => n.classList.add("dimmed"));
  document.querySelectorAll(".edge-path").forEach(p => p.classList.add("dimmed"));
  document.querySelectorAll(".edge-label").forEach(l => l.classList.add("dimmed"));

  // Highlight step nodes
  (step.nodes || []).forEach(id => {
    const el = document.getElementById(`node-${id}`);
    if (el) {
      el.classList.remove("dimmed");
      el.classList.add("tour-active");
    }
  });

  // Highlight step edges + fire particles
  clearParticles();
  (step.edges || []).forEach(pair => {
    const [from, to] = pair;
    const edgeIndex = EDGES.findIndex(e => e.from === from && e.to === to);
    if (edgeIndex >= 0) {
      const pathEl = document.getElementById(`edge-${edgeIndex}`);
      if (pathEl) {
        pathEl.classList.remove("dimmed");
        pathEl.classList.add("tour-active");
        fireParticle(pathEl);
      }
      const labelGroup = document.querySelector(`.edge-label-group[data-edge-index='${edgeIndex}']`);
      if (labelGroup) {
        labelGroup.querySelector(".edge-label").classList.remove("dimmed");
        labelGroup.querySelector(".edge-label").classList.add("highlight");
      }
    }
  });

  // Pan to show relevant nodes
  if (step.nodes && step.nodes.length) {
    panToNodes(step.nodes);
  }
}

function panToNodes(ids) {
  const nodes = ids.map(id => nodeById.get(id)).filter(Boolean);
  if (!nodes.length) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    const h = n.measuredH || n.h || 90;
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x + n.w > maxX) maxX = n.x + n.w;
    if (n.y + h > maxY) maxY = n.y + h;
  });
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const wrapRect = canvasWrap.getBoundingClientRect();
  const span = Math.max(maxX - minX, maxY - minY);
  const desiredScale = Math.min(1, (Math.min(wrapRect.width, wrapRect.height) * 0.55) / span);
  const newScale = Math.max(0.5, Math.min(1.1, desiredScale));
  const tx = wrapRect.width / 2 - cx * newScale;
  const ty = wrapRect.height / 2 - cy * newScale;
  animateView(tx, ty, newScale, 500);
}

function animateView(tx, ty, tscale, duration) {
  const startX = currentX, startY = currentY, startScale = currentScale;
  const t0 = performance.now();
  function step(now) {
    const p = Math.min(1, (now - t0) / duration);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    currentX = startX + (tx - startX) * e;
    currentY = startY + (ty - startY) * e;
    currentScale = startScale + (tscale - startScale) * e;
    applyTransform();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Particles
const particleRafIds = [];
function clearParticles() {
  while (particleRafIds.length) cancelAnimationFrame(particleRafIds.pop());
  particleLayer.innerHTML = "";
}

function fireParticle(pathEl) {
  try {
    const length = pathEl.getTotalLength();
    if (!length) return;
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", "5");
    circle.setAttribute("class", "particle");
    particleLayer.appendChild(circle);

    let start = null;
    const duration = 1500;
    let raf;
    function animate(now) {
      if (!start) start = now;
      const elapsed = (now - start) % duration;
      const p = elapsed / duration;
      const pt = pathEl.getPointAtLength(length * p);
      circle.setAttribute("cx", pt.x);
      circle.setAttribute("cy", pt.y);
      raf = requestAnimationFrame(animate);
      // keep pointer to current raf for cancellation; replace previous
      const idx = particleRafIds.indexOf(raf);
      if (idx === -1) particleRafIds.push(raf);
    }
    raf = requestAnimationFrame(animate);
    particleRafIds.push(raf);
  } catch(e) {}
}

// Tour event handlers
document.querySelectorAll(".tour-card").forEach(c => {
  c.addEventListener("click", () => startTour(c.dataset.tour));
});
btnStopTour.addEventListener("click", stopTour);
tourNext.addEventListener("click", () => {
  if (!tourState.tour) return;
  if (tourState.step === tourState.tour.steps.length - 1) {
    stopTour();
    return;
  }
  tourState.step++;
  showTourStep();
});
tourPrev.addEventListener("click", () => {
  if (!tourState.tour || tourState.step === 0) return;
  tourState.step--;
  showTourStep();
});

// =================================================================
// GLOSSAR MODAL
// =================================================================
const glossarModal = document.getElementById("glossar-modal");
const glossarBody = document.getElementById("glossar-body");

function renderGlossar() {
  glossarBody.innerHTML = GLOSSARY.map(g => `
    <div class="glossar-item">
      <h3>${g.term}</h3>
      <p>${g.body}</p>
    </div>
  `).join("");
}

document.getElementById("btn-glossar").addEventListener("click", () => {
  renderGlossar();
  glossarModal.hidden = false;
});
glossarModal.addEventListener("click", (e) => {
  if (e.target.matches("[data-close-modal]")) glossarModal.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!glossarModal.hidden) glossarModal.hidden = true;
    else if (tourState.active) stopTour();
    else if (selectedId) deselectNode();
  }
});

// =================================================================
// MINIMAP
// =================================================================
function renderMinimap() {
  minimapSvg.innerHTML = "";
  const scaleX = 200 / STAGE_W;
  const scaleY = 150 / STAGE_H;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (200 - STAGE_W * scale) / 2;
  const offsetY = (150 - STAGE_H * scale) / 2;

  minimapSvg.setAttribute("data-scale", scale);
  minimapSvg.setAttribute("data-offset-x", offsetX);
  minimapSvg.setAttribute("data-offset-y", offsetY);

  NODES.forEach(n => {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", offsetX + n.x * scale);
    rect.setAttribute("y", offsetY + n.y * scale);
    rect.setAttribute("width", n.w * scale);
    rect.setAttribute("height", (n.measuredH || n.h || 90) * scale);
    rect.setAttribute("fill", typeColor(n.type));
    rect.setAttribute("opacity", "0.75");
    rect.setAttribute("rx", "1");
    minimapSvg.appendChild(rect);
  });
}

function updateMinimapViewport() {
  const scale = parseFloat(minimapSvg.getAttribute("data-scale") || 1);
  const offsetX = parseFloat(minimapSvg.getAttribute("data-offset-x") || 0);
  const offsetY = parseFloat(minimapSvg.getAttribute("data-offset-y") || 0);
  const wrapRect = canvasWrap.getBoundingClientRect();
  // Visible area in stage coords:
  const visX = -currentX / currentScale;
  const visY = -currentY / currentScale;
  const visW = wrapRect.width / currentScale;
  const visH = wrapRect.height / currentScale;

  minimapViewport.style.left = (offsetX + visX * scale) + "px";
  minimapViewport.style.top = (offsetY + visY * scale) + "px";
  minimapViewport.style.width = Math.max(10, visW * scale) + "px";
  minimapViewport.style.height = Math.max(10, visH * scale) + "px";
}

// =================================================================
// BOOT
// =================================================================
function boot() {
  // Wait for nodes to be measured
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Force re-measure once layout has settled
      NODES.forEach(n => {
        const el = document.getElementById(`node-${n.id}`);
        if (el) n.measuredH = el.offsetHeight;
      });
      renderGroupBoxes();
      renderEdges();
      renderMinimap();
      fitToView(60);
    });
  });
}

window.addEventListener("resize", () => {
  updateMinimapViewport();
});

boot();

})());
}
