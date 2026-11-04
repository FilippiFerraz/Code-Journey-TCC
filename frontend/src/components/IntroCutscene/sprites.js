// Sprites da cutscene, desenhados à mão como texto: cada caractere é um pixel
// com a cor da chave correspondente em paleta.js ("." = transparente).
// Cada animação tem 2 a 4 quadros, como nos jogos de 8/16 bits.
//
// Personagens grandes (dragão, castelo, casas) são desenhados por código em
// cenas.js — com formas simples ficam mais fáceis de animar (asas batendo,
// chamas, telhados queimando).

// Camponês (5x8) andando — 2 quadros. A roupa ("o") muda de cor por
// camponês com a opção `troca` de sprite().
export const CAMPONES = [
  [
    ".888.",
    ".mmm.",
    "..m..",
    "ooooo",
    "mooom",
    ".ooo.",
    ".9.9.",
    "9...9",
  ],
  [
    ".888.",
    ".mmm.",
    "..m..",
    "ooooo",
    "mooom",
    ".ooo.",
    ".9.9.",
    ".9.9.",
  ],
];

// Camponês fugindo (braços pra cima) — 2 quadros.
export const CAMPONES_FUGINDO = [
  [
    "m888m",
    "mmmmm",
    ".om..",
    ".ooo.",
    ".ooo.",
    ".ooo.",
    "9..9.",
    "9...9",
  ],
  [
    "m888m",
    "mmmmm",
    "..mo.",
    ".ooo.",
    ".ooo.",
    ".ooo.",
    ".99..",
    ".9.9.",
  ],
];

// Goblin (7x8) — 2 quadros. Olhos "j" (amarelos) viram roxos sob o
// controle do dragão (troca { j: "4" }).
export const GOBLIN = [
  [
    "d.....d",
    "dcccccd",
    ".cjcjc.",
    ".ccccc.",
    "..888..",
    "c88888c",
    "..8.8..",
    ".c...c.",
  ],
  [
    "d.....d",
    "dcccccd",
    ".cjcjc.",
    ".c000c.",
    "c.888.c",
    ".88888.",
    "..8.8..",
    "..c.c..",
  ],
];

// Criatura de BUG (8x6): um besouro roxo com olhos verdes de "código
// corrompido" — 2 quadros. O efeito glitch (linhas deslocadas, cores
// trocadas, blocos piscando) é aplicado em cenas.js.
export const BUG = [
  [
    "4......4",
    ".4.33.4.",
    ".333333.",
    "30d33d03",
    ".333333.",
    "3.3..3.3",
  ],
  [
    ".4....4.",
    "..4334..",
    ".333333.",
    "30d33d03",
    ".333333.",
    ".3.33.3.",
  ],
];

// Pássaro (3x2) — 2 quadros (asas pra cima / pra baixo).
export const PASSARO = [
  ["0.0", ".0."],
  [".0.", "0.0"],
];

// Chama (5x6) — 3 quadros, usada nos telhados em chamas.
export const CHAMA = [
  ["..i..", ".iji.", ".ijj.", "hijih", "hiiih", ".hhh."],
  [".i...", ".ij..", "iijii", "hijjh", "hiiih", ".hhh."],
  ["...i.", "..ji.", "iijii", "hjjih", "hiiih", ".hhh."],
];

// Chama da vela (3x4) — 3 quadros tremulando.
export const CHAMA_VELA = [
  [".j.", "jnj", "jij", ".i."],
  ["..j", ".nj", "jij", ".i."],
  ["j..", "jn.", "jij", ".i."],
];

// Ancião (11x18): manto azul, cabelo e barba brancos, cajado com orbe
// mágico. O orbe pisca trocando "4" por "n" (opção troca).
export const ANCIAO = [
  "..oooo...4.",
  ".oooooo.4n4",
  ".oggggo..4.",
  ".ommmmo..a.",
  ".om0m0o..a.",
  ".ommmmo..a.",
  ".nnnnnn..a.",
  "onnnnnno.a.",
  "ooonnooomm.",
  "oooonooo.a.",
  "oojjjjoo.a.",
  "oooooooo.a.",
  "oooooooo.a.",
  ".oooooo..a.",
  ".oooooo..a.",
  "oooooooo.a.",
  "oooooooo.a.",
  ".99..99..a.",
];

// Herói (o jogador) (8x14), túnica verde de aventureiro — 2 quadros:
// parado e com os braços erguidos pra receber o pergaminho.
export const HEROI = [
  [
    "..aaaa..",
    ".aaaaaa.",
    ".ammmma.",
    ".m0mm0m.",
    "..mmmm..",
    "..cccc..",
    ".cccccc.",
    "mccjjccm",
    "m.cccc.m",
    "..cccc..",
    "..9999..",
    "..9..9..",
    "..9..9..",
    ".88..88.",
  ],
  [
    "m.aaaa.m",
    "maaaaaam",
    "mammmmam",
    "cm0mm0mc",
    "c.mmmm.c",
    "c.cccc.c",
    ".cccccc.",
    "..cjjc..",
    "..cccc..",
    "..cccc..",
    "..9999..",
    "..9..9..",
    "..9..9..",
    ".88..88.",
  ],
];

// ---------------------------------------------------------------------------
// Fonte miúda 3x5 (só as letras usadas no pergaminho e na capa do livro):
// "function atacar() {}" e "JS". 4px por letra (3 + 1 de espaço).
export const FONTE_MINI = {
  f: [".##", "#..", "##.", "#..", "#.."],
  u: ["...", "#.#", "#.#", "#.#", "###"],
  n: ["...", "##.", "#.#", "#.#", "#.#"],
  c: ["...", ".##", "#..", "#..", ".##"],
  t: [".#.", "###", ".#.", ".#.", ".##"],
  i: [".#.", "...", ".#.", ".#.", ".#."],
  o: ["...", ".#.", "#.#", "#.#", ".#."],
  a: ["...", ".##", "#.#", "#.#", ".##"],
  r: ["...", "#.#", "##.", "#..", "#.."],
  "(": [".#.", "#..", "#..", "#..", ".#."],
  ")": [".#.", "..#", "..#", "..#", ".#."],
  "{": [".##", ".#.", "#..", ".#.", ".##"],
  "}": ["##.", ".#.", "..#", ".#.", "##."],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  S: [".##", "#..", ".#.", "..#", "##."],
  " ": ["...", "...", "...", "...", "..."],
};

// Escreve com a fonte miúda. `cores` pode ser uma cor só ou uma função
// (índice da letra) => cor — usado pro "realce de sintaxe" do pergaminho.
// `escala` amplia os pixels (o "JS" da capa do livro usa 3).
export function textoMini(ctx, texto, x, y, cores, P, escala = 1) {
  for (let i = 0; i < texto.length; i++) {
    const glifo = FONTE_MINI[texto[i]];
    if (!glifo) continue;
    const cor = typeof cores === "function" ? cores(i) : cores;
    ctx.fillStyle = P[cor] ?? cor;
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        if (glifo[gy][gx] === "#") {
          ctx.fillRect(x + (i * 4 + gx) * escala, y + gy * escala, escala, escala);
        }
      }
    }
  }
}
