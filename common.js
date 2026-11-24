// ===== Código compartilhado entre as abas =====

// ---------- Tela cheia ----------
const FS = {
  onChange: null,
  get on() { return document.body.classList.contains("fs"); },
  enter() {
    if (this.on) return;
    document.body.classList.add("fs");
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {});
    this.onChange && this.onChange();
  },
  exit() {
    if (!this.on) return;
    document.body.classList.remove("fs");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    this.onChange && this.onChange();
  },
};
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) FS.exit(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") FS.exit(); });

function setupFullscreenButtons() {
  const fsBtn = document.getElementById("btnFs"), back = document.getElementById("btnExitFs");
  if (fsBtn) fsBtn.onclick = () => FS.enter();
  if (back) back.onclick = () => FS.exit();
  const auto = document.getElementById("autoFs");
  if (auto) {
    auto.checked = localStorage.getItem("autoFs") !== "0";
    auto.onchange = () => localStorage.setItem("autoFs", auto.checked ? "1" : "0");
  }
}
const autoFullscreen = () => { const a = document.getElementById("autoFs"); return !a || a.checked; };

// ---------- Categorias coloridas e grandes ----------
function styleToolbox(ws, colours) {
  try {
    ws.getToolbox().getToolboxItems().forEach((it, i) => {
      const div = it.getDiv && it.getDiv();
      if (div && colours[i]) div.style.setProperty("--cat", colours[i]);
    });
  } catch (e) { console.warn(e); }
}

// ---------- Exemplo pedido pela aba Exemplos (?exemplo=...) ----------
function takeExampleParam() {
  const p = new URLSearchParams(location.search);
  const id = p.get("exemplo"), resposta = p.get("resposta") !== "0";
  if (id) history.replaceState(null, "", location.pathname);
  return id ? { id, resposta } : null;
}
