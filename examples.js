// ===== Exemplos prontos (usados pela aba Exemplos, Piano e Robô) =====

// Monta uma pilha de blocos: [["tipo", {campos}, [filhos do "DO"]], ...]
function chain(list) {
  let first = null, cur = null;
  for (const [type, fields, inner] of list) {
    const b = { type };
    if (fields) b.fields = fields;
    if (inner && inner.length) b.inputs = { DO: { block: chain(inner) } };
    if (!first) first = b; else cur.next = { block: b };
    cur = b;
  }
  return first;
}
// stacks: [[x, y, lista], ...]
function project(stacks) {
  return { blocks: { languageVersion: 0, blocks: stacks.map(([x, y, list]) => Object.assign(chain(list), { x, y })) } };
}
// "60 62:2 -:1" -> notas (nota:tempos), "-" = pausa
function melody(str) {
  return str.trim().split(/\s+/).map(t => {
    const [n, b = "1"] = t.split(":");
    return n === "-" ? ["snd_rest", { BEATS: +b }] : ["snd_note", { NOTE: n, BEATS: +b }];
  });
}
const flag = list => [["evt_flag"], ...list];

// ---------------- PIANO ----------------
const KEYMAP = [["a", 60], ["w", 61], ["s", 62], ["e", 63], ["d", 64], ["f", 65], ["t", 66],
                ["g", 67], ["y", 68], ["h", 69], ["u", 70], ["j", 71], ["k", 72]];
const BRILHA = "60 60 67 67 69 69 67:2 65 65 64 64 62 62 60:2";

const PIANO_EXAMPLES = {
  teclado: {
    emoji: "🎹", title: "Piano completo no teclado",
    desc: "A resposta do desafio! Teclas A S D F G H J K tocam as notas brancas e W E T Y U as pretas.",
    project: project(KEYMAP.map(([k, n], i) => [20 + (i % 2) * 380, 20 + Math.floor(i / 2) * 120,
      [["evt_key", { KEY: k }], ["snd_note", { NOTE: String(n), BEATS: 1 }]]])),
  },
  brilha: {
    emoji: "⭐", title: "Brilha, brilha estrelinha",
    desc: "Uma música inteira tocando quando clica na 🚩.",
    project: project([[30, 30, flag(melody(BRILHA))]]),
  },
  parabens: {
    emoji: "🎂", title: "Parabéns pra você",
    desc: "Notas curtas e longas usando o número de tempos.",
    project: project([[30, 30, flag(melody(
      "67:0.75 67:0.25 69 67 72 71:2 67:0.75 67:0.25 69 67 74 72:2 " +
      "67:0.75 67:0.25 79 76 72 71 69:2 77:0.75 77:0.25 76 72 74 72:2"))]]),
  },
  ode: {
    emoji: "🪈", title: "Ode à alegria (flauta)",
    desc: "Troca o instrumento para flauta antes de tocar.",
    project: project([[30, 30, flag([["snd_instrument", { INST: "flauta" }], ...melody(
      "64 64 65 67 67 65 64 62 60 60 62 64 64:1.5 62:0.5 62:2 " +
      "64 64 65 67 67 65 64 62 60 60 62 64 62:1.5 60:0.5 60:2")])]]),
  },
  bateria: {
    emoji: "🥁", title: "Batida de bateria",
    desc: "O bloco \"sempre\" repete a batida até apertar ⏹ Parar.",
    project: project([[30, 30, flag([["ctl_forever", null, [
      ["snd_drum", { DRUM: "bumbo" }], ["snd_rest", { BEATS: 0.5 }],
      ["snd_drum", { DRUM: "chimbal" }], ["snd_rest", { BEATS: 0.5 }],
      ["snd_drum", { DRUM: "caixa" }], ["snd_rest", { BEATS: 0.5 }],
      ["snd_drum", { DRUM: "chimbal" }], ["snd_rest", { BEATS: 0.5 }]]]])]]),
  },
  banda: {
    emoji: "🎸", title: "Banda: melodia + bateria",
    desc: "Duas pilhas com 🚩 tocam ao mesmo tempo!",
    project: project([
      [30, 30, flag([["snd_instrument", { INST: "guitarra" }], ...melody(BRILHA)])],
      [420, 30, flag([["ctl_repeat", { TIMES: 8 }, [
        ["snd_drum", { DRUM: "bumbo" }], ["snd_rest", { BEATS: 1 }],
        ["snd_drum", { DRUM: "caixa" }], ["snd_rest", { BEATS: 1 }]]]])],
    ]),
  },
  instrumentos: {
    emoji: "🎻", title: "Passeio pelos instrumentos",
    desc: "A mesma música curtinha em 4 instrumentos diferentes.",
    project: project([[30, 30, flag(["piano", "xilofone", "trompete", "videogame"].flatMap(inst => [
      ["snd_instrument", { INST: inst }], ...melody("60:0.5 64:0.5 67:0.5 72:1 -:1")]))]]),
  },
};

// ---------------- ROBÔ ----------------
// Caminho descrito como comandos: F3 = andar 3, R = direita, L = esquerda
function mapFromMoves(start, dir, moves, level, nStars) {
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  let [x, y] = start, d = dir;
  const path = [[x, y]];
  moves.trim().split(/\s+/).forEach(t => {
    if (t === "R") d = (d + 1) % 4;
    else if (t === "L") d = (d + 3) % 4;
    else for (let i = 0; i < +t.slice(1); i++) { x += DX[d]; y += DY[d]; path.push([x, y]); }
  });
  const corners = path.filter((p, i) => i > 0 && i < path.length - 1 &&
    path[i - 1][0] !== path[i + 1][0] && path[i - 1][1] !== path[i + 1][1]);
  const stars = new Set();
  for (let i = 0; i < nStars && corners.length; i++)
    stars.add(corners[Math.floor((i + 0.5) * corners.length / nStars)].join(","));
  return { cells: [...new Set(path.map(p => p.join(",")))], path, start, startDir: dir,
           goal: path[path.length - 1], stars: [...stars], level };
}
function movesToBlocks(moves) {
  return moves.trim().split(/\s+/).map(t =>
    t === "R" ? ["rb_right"] : t === "L" ? ["rb_left"] : ["rb_forward", { N: +t.slice(1) }]);
}

const ROBO_EXAMPLES = {
  passos: { emoji: "👣", title: "Primeiros passos", desc: "Só andar para frente até a 🏁.",
    start: [2, 4], dir: 0, moves: "F8", level: 1, stars: 0 },
  curva: { emoji: "↪️", title: "Uma curva", desc: "Anda, vira à direita e anda de novo.",
    start: [2, 1], dir: 0, moves: "F6 R F6", level: 1, stars: 1 },
  zigue: { emoji: "⚡", title: "Zigue-zague", desc: "Direita, esquerda, direita… preste atenção nas curvas!",
    start: [1, 1], dir: 0, moves: "F3 R F3 L F3 R F3 L F2", level: 2, stars: 2 },
  escada: { emoji: "🪜", title: "Escada com repetir", desc: "Usa \"repetir\" para subir a escada com poucos blocos.",
    start: [2, 7], dir: 0, moves: "F1 L F1 R F1 L F1 R F1 L F1 R F1 L F1 R F1 L F1", level: 2, stars: 2,
    solution: [["ctl_repeat", { TIMES: 5 }, [["rb_forward", { N: 1 }], ["rb_left"], ["rb_forward", { N: 1 }], ["rb_right"]]]] },
  serpente: { emoji: "🐍", title: "Serpente", desc: "Um caminho longo que se repete. Dá para resolver com \"repetir\"!",
    start: [1, 1], dir: 0, moves: "F10 R F2 R F10 L F2 L F10 R F2 R F10", level: 3, stars: 3,
    solution: [["ctl_repeat", { TIMES: 2 }, [["rb_forward", { N: 10 }], ["rb_right"], ["rb_forward", { N: 2 }],
      ["rb_right"], ["rb_forward", { N: 10 }], ["rb_left"], ["rb_forward", { N: 2 }], ["rb_left"]]]] },
  caracol: { emoji: "🐌", title: "Caracol", desc: "Vai girando para dentro, sempre virando à direita.",
    start: [0, 0], dir: 0, moves: "F12 R F8 R F12 R F6 R F10 R F4 R F8 R F2 R F6", level: 3, stars: 3 },
};
for (const ex of Object.values(ROBO_EXAMPLES)) {
  ex.map = mapFromMoves(ex.start, ex.dir, ex.moves, ex.level, ex.stars);
  ex.project = project([[40, 40, flag(ex.solution || movesToBlocks(ex.moves))]]);
  ex.empty = project([[40, 40, [["evt_flag"]]]]);
}
