// Primitivas de desenho "pixel perfeito" pro canvas 320x180.
//
// Por que não usar arc()/fill() do canvas direto: eles suavizam as bordas
// (antialiasing) e criam cores intermediárias, que fogem da paleta e ficam
// borradas quando a tela é ampliada. Aqui tudo vira fillRect com coordenadas
// inteiras — cada pixel tem exatamente uma cor da paleta.
import { P } from "./paleta";

// Retângulo cheio. `cor` pode ser a chave da paleta ("3") ou um hex.
export function ret(ctx, x, y, w, h, cor) {
  ctx.fillStyle = P[cor] ?? cor;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function px(ctx, x, y, cor) {
  ret(ctx, x, y, 1, 1, cor);
}

// Polígono preenchido por varredura de linhas: em cada linha y acha onde as
// arestas cruzam e pinta os trechos de dentro com um fillRect inteiro.
export function poligono(ctx, pontos, cor) {
  ctx.fillStyle = P[cor] ?? cor;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of pontos) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const yc = y + 0.5;
    const cruzamentos = [];
    for (let i = 0; i < pontos.length; i++) {
      const [x1, y1] = pontos[i];
      const [x2, y2] = pontos[(i + 1) % pontos.length];
      if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) {
        cruzamentos.push(x1 + ((yc - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    cruzamentos.sort((a, b) => a - b);
    for (let k = 0; k + 1 < cruzamentos.length; k += 2) {
      const xa = Math.round(cruzamentos[k]);
      const xb = Math.round(cruzamentos[k + 1]);
      if (xb > xa) ctx.fillRect(xa, y, xb - xa, 1);
    }
  }
}

// Polígono com contorno de 1px: pinta a forma deslocada nas 4 direções na
// cor do contorno e depois a forma em cima.
export function poligonoContorno(ctx, pontos, cor, contorno = "0") {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    poligono(ctx, pontos.map(([x, y]) => [x + dx, y + dy]), contorno);
  }
  poligono(ctx, pontos, cor);
}

// Elipse cheia, linha a linha.
export function elipse(ctx, cx, cy, rx, ry, cor) {
  ctx.fillStyle = P[cor] ?? cor;
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let dy = -ry; dy <= ry; dy++) {
    const meio = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5)))));
    ctx.fillRect(cx - meio, cy + dy, meio * 2 + 1, 1);
  }
}

// Linha de Bresenham. `traco` = [ligado, desligado] faz linha pontilhada;
// `fase` desloca o pontilhado (anima o "fluxo" da aura do dragão).
export function linha(ctx, x0, y0, x1, y1, cor, traco = null, fase = 0) {
  ctx.fillStyle = P[cor] ?? cor;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let erro = dx + dy;
  let passo = 0;
  for (;;) {
    if (!traco || (passo + fase) % (traco[0] + traco[1]) < traco[0]) ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * erro;
    if (e2 >= dy) { erro += dy; x0 += sx; }
    if (e2 <= dx) { erro += dx; y0 += sy; }
    passo++;
  }
}

// ---------------------------------------------------------------------------
// Pontilhado (dithering) com matriz de Bayer 4x4 — o jeito dos consoles
// antigos de fazer sombra, brilho e fade sem ter cores intermediárias.
// nivel: 0 (nada) a 16 (cheio).
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const padroes = new Map(); // "cor|nivel" -> canvas 4x4

function padrao(cor, nivel) {
  const chave = `${cor}|${nivel}`;
  let c = padroes.get(chave);
  if (!c) {
    c = document.createElement("canvas");
    c.width = 4;
    c.height = 4;
    const g = c.getContext("2d");
    g.fillStyle = P[cor] ?? cor;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) if (BAYER[y][x] < nivel) g.fillRect(x, y, 1, 1);
    }
    padroes.set(chave, c);
  }
  return c;
}

const padroesPorCtx = new WeakMap();

export function dither(ctx, x, y, w, h, cor, nivel) {
  nivel = Math.max(0, Math.min(16, Math.round(nivel)));
  if (nivel === 0) return;
  if (nivel === 16) return ret(ctx, x, y, w, h, cor);
  let cache = padroesPorCtx.get(ctx);
  if (!cache) padroesPorCtx.set(ctx, (cache = new Map()));
  const chave = `${cor}|${nivel}`;
  let pat = cache.get(chave);
  if (!pat) cache.set(chave, (pat = ctx.createPattern(padrao(cor, nivel), "repeat")));
  ctx.fillStyle = pat;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Elipse pontilhada (brilho da vela, aura do dragão): faixas concêntricas
// com nível decrescente para fora.
export function brilho(ctx, cx, cy, raio, cor, nivelCentro, aneis = 4) {
  for (let a = aneis; a >= 1; a--) {
    const r = Math.round((raio * a) / aneis);
    const nivel = Math.round((nivelCentro * (aneis - a + 1)) / aneis);
    ctx.save();
    ctx.beginPath();
    elipseCaminho(ctx, cx, cy, r, Math.round(r * 0.6));
    ctx.clip();
    dither(ctx, cx - r, cy - r, r * 2 + 1, r * 2 + 1, cor, nivel);
    ctx.restore();
  }
}

// Caminho (para clip) em degraus de 1px — o clip continua "pixelado".
function elipseCaminho(ctx, cx, cy, rx, ry) {
  for (let dy = -ry; dy <= ry; dy++) {
    const meio = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5)))));
    ctx.rect(Math.round(cx) - meio, Math.round(cy) + dy, meio * 2 + 1, 1);
  }
}

// ---------------------------------------------------------------------------
// Sprites: lista de strings, um caractere por pixel (chaves da paleta, "." é
// transparente). Opções: espelhar (vira pro outro lado), escala (pixels
// maiores), troca ({ "j": "4" } troca cores — ex.: olhos dos goblins ficam
// roxos quando o dragão os controla).
export function sprite(ctx, mapa, x, y, { espelhar = false, escala = 1, troca = null } = {}) {
  x = Math.round(x);
  y = Math.round(y);
  const largura = mapa[0].length;
  for (let linhaY = 0; linhaY < mapa.length; linhaY++) {
    const linhaStr = mapa[linhaY];
    // agrupa pixels vizinhos da mesma cor num fillRect só
    let inicio = 0;
    while (inicio < largura) {
      const ch = linhaStr[inicio];
      let fim = inicio + 1;
      while (fim < largura && linhaStr[fim] === ch) fim++;
      if (ch !== ".") {
        const cor = troca?.[ch] ?? ch;
        ctx.fillStyle = P[cor] ?? cor;
        const xi = espelhar ? largura - fim : inicio;
        ctx.fillRect(x + xi * escala, y + linhaY * escala, (fim - inicio) * escala, escala);
      }
      inicio = fim;
    }
  }
}

// ---------------------------------------------------------------------------
// Aleatoriedade DETERMINÍSTICA: o mesmo número sempre dá o mesmo resultado.
// Nada na cutscene usa Math.random — assim cada quadro depende só do tempo,
// e a exportação para vídeo (scripts/exportarIntro.mjs) sai idêntica.
export function ruido(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Quadro de animação: ciclo de `quadros` frames, trocando a cada `msPorQuadro`.
export function quadro(t, msPorQuadro, quadros) {
  return Math.floor(t / msPorQuadro) % quadros;
}

// Vai e volta entre 0 e `tamanho`.
export function vaiVolta(v, tamanho) {
  const m = ((v % (tamanho * 2)) + tamanho * 2) % (tamanho * 2);
  return m < tamanho ? m : tamanho * 2 - m;
}

// Progresso 0..1 "em degraus" — as animações andam em poucos passos, como
// nos jogos antigos, em vez de deslizar suave.
export function degraus(p, n) {
  return Math.min(1, Math.max(0, Math.floor(p * n) / n));
}
