// ===================== Robô de Blocos =====================
// Mapa gerado automaticamente + blocos de andar/virar.

const COLS = 13, ROWS = 9, CELL = 38;
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]; // 0=direita 1=baixo 2=esquerda 3=cima
const MOVE = "#4C97FF", CTL = "#FFAB19", EV = "#FFBF00";

// ---------- Blocos ----------
Blockly.defineBlocksWithJsonArray([
  { type: "evt_flag", message0: "quando 🚩 for clicado", nextStatement: null, colour: EV, hat: "cap" },
  { type: "rb_forward", message0: "andar %1 passo(s) ⬆",
    args0: [{ type: "field_number", name: "N", value: 1, min: 1, max: 20, precision: 1 }],
    previousStatement: null, nextStatement: null, colour: MOVE, tooltip: "Anda para frente" },
  { type: "rb_right", message0: "virar à direita ↻",
    previousStatement: null, nextStatement: null, colour: MOVE, tooltip: "Gira para a direita sem sair do lugar" },
  { type: "rb_left", message0: "virar à esquerda ↺",
    previousStatement: null, nextStatement: null, colour: MOVE, tooltip: "Gira para a esquerda sem sair do lugar" },
  { type: "ctl_repeat", message0: "repetir %1 vezes %2 %3",
    args0: [{ type: "field_number", name: "TIMES", value: 2, min: 1, max: 50, precision: 1 },
            { type: "input_dummy" }, { type: "input_statement", name: "DO" }],
    previousStatement: null, nextStatement: null, colour: CTL },
  { type: "ctl_wait", message0: "esperar %1 segundo(s)",
    args0: [{ type: "field_number", name: "SECS", value: 1, min: 0, max: 10 }],
    previousStatement: null, nextStatement: null, colour: CTL },
]);

const ws = Blockly.inject("blocklyDiv", {
  toolbox: { kind: "categoryToolbox", contents: [
    { kind: "category", name: "🟡 Eventos", colour: EV, contents: [{ kind: "block", type: "evt_flag" }] },
    { kind: "category", name: "🔵 Movimento", colour: MOVE, contents: [
      { kind: "block", type: "rb_forward" }, { kind: "block", type: "rb_right" }, { kind: "block", type: "rb_left" }] },
    { kind: "category", name: "🟠 Controle", colour: CTL, contents: [
      { kind: "block", type: "ctl_repeat" }, { kind: "block", type: "ctl_wait" }] },
  ]},
  trashcan: true, sounds: false, media: "https://unpkg.com/blockly@11/media/",
  renderer: "zelos",
  zoom: { controls: true, wheel: true, startScale: 0.9 },
  grid: { spacing: 25, length: 3, colour: "#ddd", snap: true },
});
styleToolbox(ws, [EV, MOVE, CTL]);
setupFullscreenButtons();

// ---------- Gerador de mapa ----------
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const key = (x, y) => x + "," + y;
const inside = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

// célula livre e sem encostar em outras partes do caminho (exceto a anterior)
function okCell(x, y, set, prevKey) {
  if (!inside(x, y) || set.has(key(x, y))) return false;
  for (let d = 0; d < 4; d++) {
    const k = key(x + DX[d], y + DY[d]);
    if (set.has(k) && k !== prevKey) return false;
  }
  return true;
}

const LEVELS = { 1: { len: 10, branches: 0, stars: 1 }, 2: { len: 18, branches: 1, stars: 2 }, 3: { len: 28, branches: 2, stars: 3 } };

function generateMap(level) {
  const L = LEVELS[level];
  for (let attempt = 0; attempt < 2000; attempt++) {
    const sx = rnd(0, 1), sy = rnd(0, ROWS - 1);
    const path = [[sx, sy]], set = new Set([key(sx, sy)]);
    let dir = -1, fails = 0;
    while (path.length < L.len && fails < 60) {
      const options = dir < 0 ? [0, 1, 3] : [(dir + 1) % 4, (dir + 3) % 4]; // sempre vira entre trechos
      const nd = options[rnd(0, options.length - 1)];
      const n = rnd(2, level === 1 ? 4 : 3);
      let [x, y] = path[path.length - 1], cells = [], tmp = new Set(set), ok = true;
      for (let i = 0; i < n; i++) {
        const prev = key(x, y); x += DX[nd]; y += DY[nd];
        if (!okCell(x, y, tmp, prev)) { ok = false; break; }
        tmp.add(key(x, y)); cells.push([x, y]);
      }
      if (!ok) { fails++; continue; }
      cells.forEach(c => { path.push(c); set.add(key(...c)); });
      dir = nd;
    }
    if (path.length < L.len) continue;

    // caminhos sem saída (para confundir 😄)
    const all = new Set(set), dead = [];
    for (let b = 0, tries = 0; b < L.branches && tries < 200; tries++) {
      const i = rnd(2, path.length - 3), [rx, ry] = path[i];
      const d = rnd(0, 3), n = rnd(2, 3);
      let x = rx, y = ry, cells = [], tmp = new Set(all), ok = true;
      for (let s = 0; s < n; s++) {
        const prev = key(x, y); x += DX[d]; y += DY[d];
        if (!okCell(x, y, tmp, prev)) { ok = false; break; }
        tmp.add(key(x, y)); cells.push([x, y]);
      }
      if (!ok) continue;
      cells.forEach(c => { all.add(key(...c)); dead.push(c); });
      b++;
    }

    // estrelas nas curvas
    const corners = [];
    for (let i = 1; i < path.length - 1; i++) {
      const [a, b, c] = [path[i - 1], path[i], path[i + 1]];
      if ((a[0] - b[0]) !== (b[0] - c[0]) || (a[1] - b[1]) !== (b[1] - c[1])) corners.push(b);
    }
    corners.sort(() => Math.random() - 0.5);
    const stars = corners.slice(0, L.stars).map(c => key(...c));

    const startDir = [0, 1, 2, 3].find(d => path[1][0] === sx + DX[d] && path[1][1] === sy + DY[d]);
    return { cells: [...all], path, start: [sx, sy], startDir, goal: path[path.length - 1], stars, level };
  }
  return ROBO_EXAMPLES.curva.map;
}

// ---------- Estado ----------
let map = null, road = new Set();
const robot = { x: 0, y: 0, dir: 0, px: 0, py: 0, angle: 0, crashed: false, won: false, trail: [], got: new Set() };

function setMap(m) {
  map = m; road = new Set(m.cells);
  document.getElementById("level").value = m.level;
  resetRobot();
}
function resetRobot() {
  Object.assign(robot, { x: map.start[0], y: map.start[1], dir: map.startDir, crashed: false, won: false });
  robot.px = robot.x; robot.py = robot.y; robot.angle = robot.dir * 90;
  robot.trail = [[robot.x, robot.y]]; robot.got = new Set();
  draw();
}

// ---------- Desenho ----------
const cv = document.getElementById("stage"), g = cv.getContext("2d");
const OX = (cv.width - COLS * CELL) / 2, OY = (cv.height - ROWS * CELL) / 2;
const cx = x => OX + x * CELL + CELL / 2, cy = y => OY + y * CELL + CELL / 2;

function draw() {
  g.fillStyle = "#7cc576"; g.fillRect(0, 0, cv.width, cv.height);
  // tufos de grama
  g.fillStyle = "#6ab866";
  for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++)
    if ((x * 7 + y * 13) % 5 === 0) g.fillRect(OX + x * CELL + 8, OY + y * CELL + 10, 4, 8);

  // caminho
  g.fillStyle = "#3b3b3b";
  map.cells.forEach(k => { const [x, y] = k.split(",").map(Number); g.fillRect(OX + x * CELL - 2, OY + y * CELL - 2, CELL + 4, CELL + 4); });
  g.fillStyle = "#f5ecd7";
  map.cells.forEach(k => { const [x, y] = k.split(",").map(Number); g.fillRect(OX + x * CELL + 2, OY + y * CELL + 2, CELL - 4, CELL - 4); });
  // une células vizinhas (deixa o caminho contínuo)
  map.cells.forEach(k => {
    const [x, y] = k.split(",").map(Number);
    if (road.has(key(x + 1, y))) g.fillRect(OX + x * CELL + CELL - 2, OY + y * CELL + 2, 4, CELL - 4);
    if (road.has(key(x, y + 1))) g.fillRect(OX + x * CELL + 2, OY + y * CELL + CELL - 2, CELL - 4, 4);
  });
  // divisões sutis de cada passo para facilitar a contagem
  g.strokeStyle = "rgba(0,0,0,.13)"; g.lineWidth = 1;
  map.cells.forEach(k => {
    const [x, y] = k.split(",").map(Number);
    if (road.has(key(x + 1, y))) { g.beginPath(); g.moveTo(OX + (x + 1) * CELL, OY + y * CELL + 4); g.lineTo(OX + (x + 1) * CELL, OY + (y + 1) * CELL - 4); g.stroke(); }
    if (road.has(key(x, y + 1))) { g.beginPath(); g.moveTo(OX + x * CELL + 4, OY + (y + 1) * CELL); g.lineTo(OX + (x + 1) * CELL - 4, OY + (y + 1) * CELL); g.stroke(); }
  });

  // rastro
  g.fillStyle = "rgba(76,151,255,.35)";
  robot.trail.forEach(([x, y]) => { g.beginPath(); g.arc(cx(x), cy(y), 5, 0, 7); g.fill(); });

  // estrelas, início e chegada
  g.textAlign = "center"; g.textBaseline = "middle"; g.font = "24px 'Segoe UI Emoji', sans-serif";
  map.stars.forEach(k => { if (!robot.got.has(k)) { const [x, y] = k.split(",").map(Number); g.fillText("⭐", cx(x), cy(y)); } });
  g.fillText("🏁", cx(map.goal[0]), cy(map.goal[1]));
  g.font = "bold 10px sans-serif"; g.fillStyle = "#555";
  g.fillText("INÍCIO", cx(map.start[0]), cy(map.start[1]) - CELL / 2 + 6);

  // robô
  g.save();
  g.translate(cx(robot.px), cy(robot.py));
  g.rotate(robot.angle * Math.PI / 180);
  const s = CELL * 0.36;
  g.fillStyle = robot.crashed ? "#e53935" : "#8a0f1f";
  g.beginPath(); g.roundRect(-s, -s, s * 2, s * 2, 6); g.fill();
  g.fillStyle = "#fff"; // olhos na frente (lado direito = frente)
  g.beginPath(); g.arc(s * 0.45, -s * 0.45, s * 0.25, 0, 7); g.arc(s * 0.45, s * 0.45, s * 0.25, 0, 7); g.fill();
  g.fillStyle = "#ffd54f"; // seta da direção
  g.beginPath(); g.moveTo(s + 9, 0); g.lineTo(s + 1, -6); g.lineTo(s + 1, 6); g.closePath(); g.fill();
  g.restore();
  if (robot.crashed) { g.font = "28px 'Segoe UI Emoji'"; g.fillText("💥", cx(robot.px) + 14, cy(robot.py) - 14); }
  if (robot.won) {
    g.fillStyle = "rgba(255,255,255,.8)"; g.fillRect(0, cv.height / 2 - 30, cv.width, 60);
    g.fillStyle = "#2e7d32"; g.font = "bold 28px 'Segoe UI', 'Segoe UI Emoji'"; g.fillText("🏆 Chegou! Parabéns!", cv.width / 2, cv.height / 2);
  }
}

// ---------- Interpretador ----------
let generation = 0;
class Stop extends Error {}
const statusEl = document.getElementById("status");
const speed = () => +document.getElementById("speed").value;

function tween(ms, step, g0) {
  return new Promise((res, rej) => {
    const t0 = performance.now();
    function f(now) {
      if (g0 !== generation) return rej(new Stop());
      const k = Math.min(1, (now - t0) / ms);
      step(k); draw();
      k < 1 ? requestAnimationFrame(f) : res();
    }
    requestAnimationFrame(f);
  });
}
const sleep = (ms, g0) => new Promise((res, rej) => setTimeout(() => g0 === generation ? res() : rej(new Stop()), ms));

async function stepForward(g0) {
  const nx = robot.x + DX[robot.dir], ny = robot.y + DY[robot.dir];
  const onRoad = road.has(key(nx, ny));
  const fx = robot.x, fy = robot.y;
  const tx = onRoad ? nx : robot.x + DX[robot.dir] * 0.45, ty = onRoad ? ny : robot.y + DY[robot.dir] * 0.45;
  await tween(speed(), k => { robot.px = fx + (tx - fx) * k; robot.py = fy + (ty - fy) * k; }, g0);
  if (!onRoad) {
    robot.crashed = true; draw();
    statusEl.textContent = "💥 Ops! O robô saiu do caminho. Clique em ⏹ e tente de novo!";
    throw new Stop();
  }
  robot.x = nx; robot.y = ny; robot.trail.push([nx, ny]);
  const k = key(nx, ny);
  if (map.stars.includes(k) && !robot.got.has(k)) robot.got.add(k);
  if (nx === map.goal[0] && ny === map.goal[1]) {
    robot.won = true; draw();
    const all = robot.got.size === map.stars.length;
    const n = countBlocks();
    statusEl.textContent = `🏆 Chegou! ⭐ ${robot.got.size}/${map.stars.length} estrelas` +
      (all ? " — pegou todas! 🎉" : "") + ` · usou ${n} blocos.`;
    throw new Stop();
  }
  draw();
}
async function turn(delta, g0) {
  const a0 = robot.angle;
  await tween(speed() * 0.7, k => { robot.angle = a0 + delta * k; }, g0);
  robot.dir = (robot.dir + (delta > 0 ? 1 : 3)) % 4;
}

async function runChain(b, g0) {
  while (b) {
    if (g0 !== generation) throw new Stop();
    if (b.isEnabled()) {
      ws.highlightBlock(b.id);
      switch (b.type) {
        case "rb_forward": for (let i = 0; i < Math.round(+b.getFieldValue("N")); i++) await stepForward(g0); break;
        case "rb_right": await turn(90, g0); break;
        case "rb_left": await turn(-90, g0); break;
        case "ctl_wait": await sleep(+b.getFieldValue("SECS") * 1000, g0); break;
        case "ctl_repeat":
          for (let i = 0; i < Math.round(+b.getFieldValue("TIMES")); i++) {
            await runChain(b.getInputTargetBlock("DO"), g0);
            await sleep(10, g0);
          }
          break;
      }
    }
    b = b.getNextBlock();
  }
}
function countBlocks() { return ws.getAllBlocks(false).filter(b => b.type !== "evt_flag" && b.isEnabled()).length; }

async function run() {
  generation++; const g0 = generation;
  resetRobot();
  if (autoFullscreen()) FS.enter();
  const hats = ws.getTopBlocks(true).filter(b => b.type === "evt_flag");
  if (!hats.length) { statusEl.textContent = "Coloque um bloco \"quando 🚩 for clicado\" primeiro!"; return; }
  statusEl.textContent = "▶ Andando…";
  try {
    await runChain(hats[0].getNextBlock(), g0);
    if (g0 === generation && !robot.won) statusEl.textContent = "🤔 Os blocos acabaram, mas o robô ainda não chegou na 🏁. Continue!";
  } catch (e) { if (!(e instanceof Stop)) console.error(e); }
  finally { if (g0 === generation) ws.highlightBlock(null); }
}
function stop() {
  generation++; ws.highlightBlock(null); resetRobot();
  statusEl.textContent = "⏹ Robô voltou para o início.";
}

// ---------- Botões ----------
document.getElementById("btnGo").onclick = run;
document.getElementById("btnStop").onclick = stop;
document.getElementById("btnNew").onclick = () => {
  generation++; ws.highlightBlock(null);
  setMap(generateMap(+document.getElementById("level").value)); saveLocal();
  statusEl.textContent = "🗺 Mapa novo! Leve o robô até a 🏁.";
};
document.getElementById("level").onchange = () => document.getElementById("btnNew").click();
document.getElementById("btnHelp").onclick = () => document.getElementById("help").classList.toggle("hidden");
document.getElementById("btnClear").onclick = () => { if (confirm("Apagar todos os blocos?")) ws.clear(); };

// ---------- Salvar / abrir (blocos + mapa) ----------
const STORE = "roboBlocos";
const snapshot = () => ({ blocks: Blockly.serialization.workspaces.save(ws), map });
function saveLocal() { localStorage.setItem(STORE, JSON.stringify(snapshot())); }
ws.addChangeListener(e => { if (!e.isUiEvent) saveLocal(); });

document.getElementById("btnSave").onclick = () => {
  const name = prompt("Nome do seu projeto:", "meu-robo"); if (!name) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(snapshot())], { type: "application/json" }));
  a.download = name.replace(/[^\w\-]+/g, "_") + ".json"; a.click(); URL.revokeObjectURL(a.href);
};
const fileInput = document.getElementById("fileInput");
document.getElementById("btnLoad").onclick = () => fileInput.click();
fileInput.onchange = async () => {
  const f = fileInput.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d.map || !d.blocks) throw 0;
    generation++; setMap(d.map); Blockly.serialization.workspaces.load(d.blocks, ws);
    statusEl.textContent = "📂 Projeto aberto!";
  } catch (e) { alert("Não consegui abrir este arquivo 😕 (é um projeto do Robô?)"); }
  fileInput.value = "";
};

// ---------- Início ----------
const EXAMPLE = { blocks: { languageVersion: 0, blocks: [{
  type: "evt_flag", x: 40, y: 40, next: { block: { type: "rb_forward", fields: { N: 1 } } } }] } };
const ex = takeExampleParam();
if (ex && ROBO_EXAMPLES[ex.id]) {
  const item = ROBO_EXAMPLES[ex.id];
  setMap(item.map);
  Blockly.serialization.workspaces.load(ex.resposta ? item.project : item.empty, ws);
  statusEl.textContent = (ex.resposta ? "👀 Resposta: " : "🎯 Desafio: ") + item.title + " — clique em 🚩 Andar!";
} else {
  try {
    const d = JSON.parse(localStorage.getItem(STORE));
    setMap(d.map); Blockly.serialization.workspaces.load(d.blocks, ws);
  } catch (e) {
    setMap(generateMap(2)); Blockly.serialization.workspaces.load(EXAMPLE, ws);
  }
}
