// ===================== Piano de Blocos =====================
// Blocos (Blockly) + interpretador próprio + sintetizador Web Audio.

// ---------- Notas ----------
const NAMES = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];
const FIRST = 60, LAST = 84; // C4 .. C6
function noteName(m) {
  const o = Math.floor(m / 12) - 5; // 0 = oitava base
  return NAMES[m % 12] + (o === 0 ? "" : " " + "↑".repeat(o));
}
const NOTE_OPTIONS = [];
for (let m = FIRST; m <= LAST; m++) NOTE_OPTIONS.push([noteName(m), String(m)]);

const KEY_OPTIONS = [];
"ASDFGHJKLQWERTYUIOPZXCVBNM".split("").forEach(k => KEY_OPTIONS.push([k, k.toLowerCase()]));
"1234567890".split("").forEach(k => KEY_OPTIONS.push([k, k]));
KEY_OPTIONS.push(["espaço", " "], ["seta ←", "ArrowLeft"], ["seta →", "ArrowRight"], ["seta ↑", "ArrowUp"], ["seta ↓", "ArrowDown"]);

const INSTRUMENTS = [
  ["🎹 Piano", "piano"], ["🎸 Guitarra", "guitarra"], ["🎻 Violino", "violino"],
  ["🪈 Flauta", "flauta"], ["🎺 Trompete", "trompete"], ["⛪ Órgão", "orgao"],
  ["🪇 Xilofone", "xilofone"], ["🎁 Caixinha de música", "caixinha"], ["👾 Videogame", "videogame"],
];
const DRUMS = [
  ["🥁 Bumbo", "bumbo"], ["🪘 Caixa", "caixa"], ["🔔 Chimbal", "chimbal"],
  ["💥 Prato", "prato"], ["👏 Palmas", "palmas"],
];

// ---------- Definição dos blocos ----------
const EV = "#FFBF00", SND = "#CF63CF", CTL = "#FFAB19";
Blockly.defineBlocksWithJsonArray([
  { type: "evt_flag", message0: "quando 🚩 for clicado", nextStatement: null, colour: EV,
    hat: "cap", tooltip: "Começa quando você clica na bandeira verde" },
  { type: "evt_key", message0: "quando a tecla %1 for pressionada",
    args0: [{ type: "field_dropdown", name: "KEY", options: KEY_OPTIONS }],
    nextStatement: null, colour: EV, hat: "cap", tooltip: "Começa quando você aperta esta tecla do teclado" },
  { type: "evt_piano", message0: "quando clicar na tecla %1 do piano",
    args0: [{ type: "field_dropdown", name: "NOTE", options: NOTE_OPTIONS }],
    nextStatement: null, colour: EV, hat: "cap", tooltip: "Começa quando você clica nesta tecla do piano na tela" },

  { type: "snd_note", message0: "tocar nota %1 por %2 tempo(s)",
    args0: [{ type: "field_dropdown", name: "NOTE", options: NOTE_OPTIONS },
            { type: "field_number", name: "BEATS", value: 1, min: 0.1, max: 16 }],
    previousStatement: null, nextStatement: null, colour: SND },
  { type: "snd_rest", message0: "pausa por %1 tempo(s)",
    args0: [{ type: "field_number", name: "BEATS", value: 1, min: 0.1, max: 16 }],
    previousStatement: null, nextStatement: null, colour: SND },
  { type: "snd_drum", message0: "tocar bateria %1",
    args0: [{ type: "field_dropdown", name: "DRUM", options: DRUMS }],
    previousStatement: null, nextStatement: null, colour: SND },
  { type: "snd_instrument", message0: "mudar instrumento para %1",
    args0: [{ type: "field_dropdown", name: "INST", options: INSTRUMENTS }],
    previousStatement: null, nextStatement: null, colour: SND },
  { type: "snd_volume", message0: "volume %1 %%",
    args0: [{ type: "field_number", name: "VOL", value: 100, min: 0, max: 100 }],
    previousStatement: null, nextStatement: null, colour: SND },
  { type: "snd_tempo", message0: "velocidade %1 batidas por minuto",
    args0: [{ type: "field_number", name: "BPM", value: 120, min: 20, max: 400 }],
    previousStatement: null, nextStatement: null, colour: SND },
  { type: "snd_stop", message0: "parar todos os sons",
    previousStatement: null, nextStatement: null, colour: SND },

  { type: "ctl_repeat", message0: "repetir %1 vezes %2 %3",
    args0: [{ type: "field_number", name: "TIMES", value: 4, min: 1, max: 100, precision: 1 },
            { type: "input_dummy" }, { type: "input_statement", name: "DO" }],
    previousStatement: null, nextStatement: null, colour: CTL },
  { type: "ctl_forever", message0: "sempre %1 %2",
    args0: [{ type: "input_dummy" }, { type: "input_statement", name: "DO" }],
    previousStatement: null, colour: CTL },
  { type: "ctl_wait", message0: "esperar %1 segundo(s)",
    args0: [{ type: "field_number", name: "SECS", value: 1, min: 0, max: 60 }],
    previousStatement: null, nextStatement: null, colour: CTL },
]);

const toolbox = {
  kind: "categoryToolbox",
  contents: [
    { kind: "category", name: "🟡 Eventos", colour: EV, contents: [
      { kind: "block", type: "evt_flag" },
      { kind: "block", type: "evt_key" },
      { kind: "block", type: "evt_piano" },
    ]},
    { kind: "category", name: "🟣 Som", colour: SND, contents: [
      { kind: "block", type: "snd_note" },
      { kind: "block", type: "snd_rest" },
      { kind: "block", type: "snd_drum" },
      { kind: "block", type: "snd_instrument" },
      { kind: "block", type: "snd_volume" },
      { kind: "block", type: "snd_tempo" },
      { kind: "block", type: "snd_stop" },
    ]},
    { kind: "category", name: "🟠 Controle", colour: CTL, contents: [
      { kind: "block", type: "ctl_repeat" },
      { kind: "block", type: "ctl_forever" },
      { kind: "block", type: "ctl_wait" },
    ]},
  ],
};

const ws = Blockly.inject("blocklyDiv", {
  toolbox, trashcan: true, sounds: false, media: "https://unpkg.com/blockly@11/media/",
  renderer: "zelos",
  zoom: { controls: true, wheel: true, startScale: 0.9 },
  grid: { spacing: 25, length: 3, colour: "#ddd", snap: true },
});
styleToolbox(ws, [EV, SND, CTL]);
setupFullscreenButtons();

// ---------- Áudio ----------
let ctx = null, master = null;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  if (!master) { master = ctx.createGain(); master.connect(ctx.destination); }
  return ctx;
}
const freq = m => 440 * Math.pow(2, (m - 69) / 12);

const state = { inst: "piano", vol: 1, bpm: 120 };

function envGain(t0, attack, peak, decayTo, decayTime, end) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  if (decayTime) g.gain.setTargetAtTime(Math.max(decayTo, 0.0001), t0 + attack, decayTime / 3);
  g.gain.setTargetAtTime(0.0001, Math.max(end, t0 + attack), 0.05); // solta no fim da nota
  g.connect(master);
  return g;
}
function osc(type, f, t0, stop, dest, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type; o.frequency.value = f; o.detune.value = detune;
  o.connect(dest); o.start(t0); o.stop(stop);
  return o;
}
function vibrato(o, t0, stop, rate = 5.5, depth = 6) {
  const l = ctx.createOscillator(), lg = ctx.createGain();
  l.frequency.value = rate; lg.gain.value = depth;
  l.connect(lg); lg.connect(o.detune); l.start(t0); l.stop(stop);
}

function playNote(m, dur) {
  audio();
  const f = freq(m), t = ctx.currentTime, v = 0.35 * state.vol;
  const end = t + dur, stop = end + 0.6;
  switch (state.inst) {
    case "piano": {
      const g = envGain(t, 0.005, v, v * 0.02, 1.8, end);
      osc("triangle", f, t, stop, g); osc("sine", f * 2, t, stop, g);
      break; }
    case "guitarra": {
      const g = envGain(t, 0.003, v, v * 0.01, 1.2, end);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(4000, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.6);
      lp.connect(g); osc("sawtooth", f, t, stop, lp);
      break; }
    case "violino": {
      const g = envGain(t, 0.12, v * 0.7, v * 0.6, 0.2, end);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3000; lp.connect(g);
      vibrato(osc("sawtooth", f, t, stop, lp), t, stop);
      break; }
    case "flauta": {
      const g = envGain(t, 0.06, v, v * 0.8, 0.2, end);
      vibrato(osc("sine", f, t, stop, g), t, stop, 5, 4);

      break; }
    case "trompete": {
      const g = envGain(t, 0.03, v * 0.6, v * 0.5, 0.1, end);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200; lp.connect(g);
      osc("sawtooth", f, t, stop, lp); osc("square", f, t, stop, lp, 4);
      break; }
    case "orgao": {
      const g = envGain(t, 0.01, v * 0.5, v * 0.5, 0, end);
      osc("sine", f, t, stop, g); osc("sine", f * 2, t, stop, g); osc("sine", f * 3, t, stop, g); osc("sine", f / 2, t, stop, g);
      break; }
    case "xilofone": {
      const g = envGain(t, 0.002, v, 0.0001, 0.5, Math.max(end, t + 0.5));
      osc("sine", f * 2, t, stop, g); osc("sine", f * 8, t, t + 0.05, g);
      break; }
    case "caixinha": {
      const g = envGain(t, 0.002, v * 0.7, 0.0001, 1.2, Math.max(end, t + 1.2));
      osc("sine", f * 4, t, stop + 0.8, g); osc("triangle", f * 2, t, stop + 0.8, g);
      break; }
    case "videogame": {
      const g = envGain(t, 0.005, v * 0.35, v * 0.3, 0.05, end);
      osc("square", f, t, stop, g);
      break; }
  }
}

function noiseBuffer() {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
let NOISE = null;
function noise(t, len, filterType, ff, v) {
  NOISE = NOISE || noiseBuffer();
  const s = ctx.createBufferSource(); s.buffer = NOISE;
  const fl = ctx.createBiquadFilter(); fl.type = filterType; fl.frequency.value = ff;
  const g = ctx.createGain();
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + len + 0.05);
}
function playDrum(d) {
  audio();
  const t = ctx.currentTime, v = 0.8 * state.vol;
  if (d === "bumbo") {
    const g = ctx.createGain(); g.connect(master);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    const o = osc("sine", 150, t, t + 0.45, g); o.frequency.exponentialRampToValueAtTime(45, t + 0.3);
  } else if (d === "caixa") {
    noise(t, 0.2, "highpass", 1500, v * 0.7);
    const g = ctx.createGain(); g.connect(master);
    g.gain.setValueAtTime(v * 0.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc("triangle", 200, t, t + 0.12, g);
  } else if (d === "chimbal") noise(t, 0.06, "highpass", 7000, v * 0.5);
  else if (d === "prato") noise(t, 1.5, "highpass", 5000, v * 0.5);
  else if (d === "palmas") { for (let i = 0; i < 3; i++) noise(t + i * 0.012, 0.12, "bandpass", 1200, v); }
}

function stopAllSounds() {
  if (master) { master.disconnect(); master = null; }
  document.querySelectorAll(".key.on").forEach(k => k.classList.remove("on"));
}

// ---------- Piano na tela ----------
const pianoDiv = document.getElementById("piano");
const keyEls = {};
(function buildPiano() {
  const isBlack = m => [1, 3, 6, 8, 10].includes(m % 12);
  const whites = []; for (let m = FIRST; m <= LAST; m++) if (!isBlack(m)) whites.push(m);
  const W = 100 / whites.length, BW = W * 0.62;
  let wi = 0;
  for (let m = FIRST; m <= LAST; m++) {
    const el = document.createElement("div");
    el.className = "key " + (isBlack(m) ? "black" : "white");
    el.textContent = noteName(m);
    if (isBlack(m)) { el.style.left = (wi * W - BW / 2) + "%"; el.style.width = BW + "%"; }
    else { el.style.left = (wi * W) + "%"; el.style.width = W + "%"; wi++; }
    el.addEventListener("mousedown", () => { audio(); trigger("evt_piano", b => b.getFieldValue("NOTE") === String(m)); });
    pianoDiv.appendChild(el); keyEls[m] = el;
  }
})();
function lightKey(m, ms) {
  const el = keyEls[m]; if (!el) return;
  el.classList.add("on");
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("on"), ms);
}

// ---------- Interpretador ----------
let generation = 0;
class Stop extends Error {}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const statusEl = document.getElementById("status");
const beat = () => 60 / state.bpm;

async function runChain(b, g) {
  while (b) {
    if (g !== generation) throw new Stop();
    if (b.isEnabled()) {
      try { ws.highlightBlock(b.id, true); } catch (e) {}
      try { await exec(b, g); }
      finally { try { ws.highlightBlock(b.id, false); } catch (e) {} }
    }
    b = b.getNextBlock();
  }
}
async function loopBody(b, g) {
  const t0 = performance.now();
  await runChain(b.getInputTargetBlock("DO"), g);
  if (performance.now() - t0 < 5) await sleep(20); // evita travar o navegador
  if (g !== generation) throw new Stop();
}
async function exec(b, g) {
  switch (b.type) {
    case "snd_note": {
      const m = +b.getFieldValue("NOTE"), d = (+b.getFieldValue("BEATS")) * beat();
      playNote(m, d); lightKey(m, d * 1000);
      statusEl.textContent = "🎵 Tocando: " + noteName(m);
      await sleep(d * 1000); break; }
    case "snd_rest": await sleep(+b.getFieldValue("BEATS") * beat() * 1000); break;
    case "snd_drum": playDrum(b.getFieldValue("DRUM")); statusEl.textContent = "🥁 Bateria!"; break;
    case "snd_instrument": state.inst = b.getFieldValue("INST"); break;
    case "snd_volume": state.vol = Math.max(0, Math.min(100, +b.getFieldValue("VOL"))) / 100; break;
    case "snd_tempo": state.bpm = Math.max(20, Math.min(400, +b.getFieldValue("BPM"))); break;
    case "snd_stop": stopAllSounds(); break;
    case "ctl_wait": await sleep(+b.getFieldValue("SECS") * 1000); break;
    case "ctl_repeat": { const n = Math.round(+b.getFieldValue("TIMES"));
      for (let i = 0; i < n; i++) await loopBody(b, g); break; }
    case "ctl_forever": for (;;) await loopBody(b, g);
  }
}
async function runHat(hat) {
  const g = generation;
  try { ws.highlightBlock(hat.id, true); } catch (e) {}
  try { await runChain(hat.getNextBlock(), g); }
  catch (e) { if (!(e instanceof Stop)) console.error(e); }
  finally { try { ws.highlightBlock(hat.id, false); } catch (e) {} }
}
function trigger(type, match = () => true) {
  const hats = ws.getTopBlocks(false).filter(b => b.type === type && b.isEnabled() && match(b));
  hats.forEach(runHat);
  return hats.length;
}
function stopAll() {
  generation++;
  stopAllSounds();
  state.inst = "piano"; state.vol = 1; state.bpm = 120;
  statusEl.textContent = "⏹ Parado.";
}

// ---------- Botões e teclado ----------
document.getElementById("btnGo").onclick = () => {
  audio(); stopAll();
  if (autoFullscreen()) FS.enter();
  if (!trigger("evt_flag")) statusEl.textContent = "🎹 Aperte as teclas que você programou!";
  else statusEl.textContent = "▶ Tocando…";
};
document.getElementById("btnStop").onclick = stopAll;

document.addEventListener("keydown", e => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;
  if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === " " || k.startsWith("Arrow")) e.preventDefault();
  audio();
  trigger("evt_key", b => b.getFieldValue("KEY") === k);
});

// ---------- Salvar / abrir + etiquetas no piano ----------
function updatePianoHints() {
  const hints = {};
  ws.getTopBlocks(false).forEach(hat => {
    if (hat.type !== "evt_key" || !hat.isEnabled()) return;
    const k = hat.getFieldValue("KEY"), label = k === " " ? "␣" : k.replace("Arrow", "↕").toUpperCase();
    for (let b = hat.getNextBlock(); b; b = b.getNextBlock()) {
      if (b.type === "snd_note" && b.isEnabled()) {
        const m = b.getFieldValue("NOTE");
        if (!hints[m]) hints[m] = label;
        break;
      }
    }
  });
  for (const [m, el] of Object.entries(keyEls)) {
    el.innerHTML = hints[m] ? `<span><b>${hints[m]}</b><br>${noteName(+m)}</span>` : noteName(+m);
  }
}

const STORE = "pianoBlocos";
function saveLocal() { localStorage.setItem(STORE, JSON.stringify(Blockly.serialization.workspaces.save(ws))); }
ws.addChangeListener(e => { if (!e.isUiEvent) { saveLocal(); updatePianoHints(); } });

document.getElementById("btnSave").onclick = () => {
  let name = prompt("Nome do seu projeto:", "meu-piano");
  if (!name) return;
  const blob = new Blob([JSON.stringify(Blockly.serialization.workspaces.save(ws), null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name.replace(/[^\w\-]+/g, "_") + ".json"; a.click();
  URL.revokeObjectURL(a.href);
};
const fileInput = document.getElementById("fileInput");
document.getElementById("btnLoad").onclick = () => fileInput.click();
fileInput.onchange = async () => {
  const f = fileInput.files[0]; if (!f) return;
  try { Blockly.serialization.workspaces.load(JSON.parse(await f.text()), ws); statusEl.textContent = "📂 Projeto aberto!"; }
  catch (e) { alert("Não consegui abrir este arquivo 😕"); }
  fileInput.value = "";
};
document.getElementById("btnClear").onclick = () => { if (confirm("Apagar todos os blocos?")) ws.clear(); };
document.getElementById("btnHelp").onclick = () => document.getElementById("help").classList.toggle("hidden");

// ---------- Projeto inicial ----------
const EXAMPLE = { blocks: { languageVersion: 0, blocks: [{
  type: "evt_key", x: 40, y: 40, fields: { KEY: "a" },
  next: { block: { type: "snd_note", fields: { NOTE: "60", BEATS: 1 } } },
}]}};
const ex = takeExampleParam();
if (ex && PIANO_EXAMPLES[ex.id]) {
  Blockly.serialization.workspaces.load(PIANO_EXAMPLES[ex.id].project, ws);
  statusEl.textContent = "📚 Exemplo: " + PIANO_EXAMPLES[ex.id].title + " — clique em 🚩 Tocar!";
} else {
  try {
    const saved = localStorage.getItem(STORE);
    Blockly.serialization.workspaces.load(saved ? JSON.parse(saved) : EXAMPLE, ws);
  } catch (e) { Blockly.serialization.workspaces.load(EXAMPLE, ws); }
}
updatePianoHints();
