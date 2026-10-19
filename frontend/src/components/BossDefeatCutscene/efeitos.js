// Efeitos da cutscene final, todos em pixel e todos DETERMINÍSTICOS: cada
// função recebe o instante t e desenha o efeito daquele instante — sem
// Math.random e sem guardar estado entre quadros. (Os "sorteios" vêm de
// ruido(n), que sempre dá o mesmo resultado pro mesmo n.)
import { anelPx, brilhoPx, discoPx, estrelaPx, padrao, retPx } from "../../pages/BatalhaDragao/cenaDragao";
import { degraus, ruido } from "../IntroCutscene/pixel";
import { EXPLOSAO_MS, EXPLOSOES, GLITCH, RACHADURAS, RUGIDO, VIDA_PARTICULA } from "./marcos";
import { ALTURA, LARGURA, POS } from "./cenario";

// ---------------------------------------------------------------------------
// Tremor de tela em pixels inteiros: forte no golpe, no rugido e em cada
// explosão.
export function tremor(t, reduzirMovimento) {
  if (reduzirMovimento) return [0, 0];
  let amplitude = 0;
  if (t < 700) amplitude = Math.ceil(4 * (1 - degraus(t / 700, 7)));
  if (t >= RUGIDO && t < RUGIDO + 750) amplitude = Math.max(amplitude, 3);
  for (const ex of EXPLOSOES) if (t >= ex.inicio && t < ex.inicio + 130) amplitude = Math.max(amplitude, 4);
  if (t >= GLITCH[0] && t < GLITCH[1]) amplitude = Math.max(amplitude, 1);
  if (!amplitude) return [0, 0];
  const k = Math.floor(t / 40);
  return [Math.round((ruido(k) * 2 - 1) * amplitude), Math.round((ruido(k + 77) * 2 - 1) * amplitude)];
}

// Desenha `origem` por cima de ctx só nos pixels de um padrão de Bayer de
// `nivel` (0 a 16): é o "fade" pontilhado dos consoles, sem transparência.
export function comPontilhado(ctx, origem, nivel, [rascunho, g], dx = 0, dy = 0) {
  if (nivel <= 0) return;
  if (nivel >= 16) {
    ctx.drawImage(origem, dx, dy);
    return;
  }
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, rascunho.width, rascunho.height);
  g.drawImage(origem, 0, 0);
  g.globalCompositeOperation = "destination-in";
  g.fillStyle = padrao(g, "#000000", nivel);
  g.fillRect(0, 0, rascunho.width, rascunho.height);
  g.globalCompositeOperation = "source-over";
  ctx.drawImage(rascunho, 0, 0, origem.width, origem.height, dx, dy, origem.width, origem.height);
}

// ---------------------------------------------------------------------------
// Golpe final: estrela de cristal e faíscas saindo do peito do dragão.
export function golpe(ctx, t, x, y) {
  if (t < 320) estrelaPx(ctx, x, y, Math.round(4 + degraus(t / 320, 6) * 16), "#bffbff");
  if (t < 220) discoPx(ctx, x, y, Math.round(3 + degraus(t / 220, 4) * 6), "#ffffff");
  for (let i = 0; i < 22; i++) {
    const vida = 500 + ruido(i) * 400;
    if (t >= vida) continue;
    const a = ruido(i + 3) * Math.PI * 2;
    const v = 0.05 + ruido(i + 7) * 0.09;
    const px = x + Math.cos(a) * v * t;
    const py = y + Math.sin(a) * v * t + 0.00012 * t * t;
    if (t > vida * 0.6 && (Math.floor(t / 50) + i) % 2) continue;
    retPx(ctx, px, py, i % 4 ? 1 : 2, i % 4 ? 1 : 2, i % 3 ? "#2fd4ee" : "#ffffff");
  }
}

// ---------------------------------------------------------------------------
// Rachaduras de luz dourada: caminhos fixos (sorteados uma vez a partir dos
// pixels do corpo) que vão crescendo de segmento em segmento.
export function prepararRachaduras(dragao) {
  if (dragao.rachaduras) return dragao.rachaduras;
  const { pixels } = dragao;
  const lista = [];
  for (let k = 0; k < 9; k++) {
    // ponto de partida: um pixel do tronco (longe das bordas do sprite)
    let i = Math.floor(ruido(k * 5.3 + 1) * pixels.n);
    for (let tentativa = 0; tentativa < 40; tentativa++) {
      const x = pixels.x[i], y = pixels.y[i];
      if (x > 30 && x < 140 && y > 38 && y < 96) break;
      i = Math.floor(ruido(k * 5.3 + tentativa + 2) * pixels.n);
    }
    const pontos = [[pixels.x[i], pixels.y[i]]];
    let ang = ruido(k + 40) * Math.PI * 2;
    for (let s = 0; s < 9; s++) {
      ang += (ruido(k * 13 + s) - 0.5) * 1.6;
      const passo = 3 + Math.floor(ruido(k * 17 + s) * 4);
      const [x0, y0] = pontos[pontos.length - 1];
      pontos.push([Math.round(x0 + Math.cos(ang) * passo), Math.round(y0 + Math.sin(ang) * passo)]);
    }
    lista.push({ inicio: RACHADURAS[0] + k * 140, pontos });
  }
  dragao.rachaduras = lista;
  return lista;
}

function linhaPx(g, x0, y0, x1, y1, cor) {
  const passos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= passos; i++) {
    retPx(g, x0 + ((x1 - x0) * i) / passos, y0 + ((y1 - y0) * i) / passos, 1, 1, cor);
  }
}

// Desenha as rachaduras na camada do dragão (com source-atop, só aparecem
// em cima do corpo). (x, y) = canto do sprite na camada.
export function rachaduras(g, t, dragao, x, y) {
  if (t < RACHADURAS[0]) return;
  const brilhante = t > RACHADURAS[0] + 900;
  for (const r of prepararRachaduras(dragao)) {
    if (t < r.inicio) continue;
    const segmentos = Math.min(r.pontos.length - 1, Math.floor((t - r.inicio) / 55) + 1);
    for (let s = 0; s < segmentos; s++) {
      const [ax, ay] = r.pontos[s];
      const [bx, by] = r.pontos[s + 1];
      const cor = brilhante && (Math.floor(t / 70) + s) % 3 === 0 ? "#ffffff" : "#ffd23c";
      linhaPx(g, x + ax, y + ay, x + bx, y + by, cor);
    }
    // luz vazando em volta do ponto de partida
    const [ox, oy] = r.pontos[0];
    brilhoPx(g, x + ox, y + oy, brilhante ? 6 : 3, "#fff3c4", 0.6);
  }
}

// ---------------------------------------------------------------------------
// Glitch: o dragão "bugado" — fatias horizontais deslocadas, algumas com as
// cores invertidas, e blocos piscando (buracos e cores puras).
export function glitchFatias(g, dragao, x, y, glitch) {
  const { bloco, intensidade } = glitch;
  let fy = 0;
  while (fy < dragao.h) {
    const altura = 2 + Math.floor(ruido(bloco + fy * 0.7) * 7);
    const desloc = Math.round((ruido(bloco * 7 + fy) - 0.5) * 2 * (3 + intensidade * 14));
    const invertida = ruido(bloco * 11 + fy) < 0.18 + intensidade * 0.2;
    const fonte = invertida ? dragao.invertido : dragao.normal;
    const h = Math.min(altura, dragao.h - fy);
    g.drawImage(fonte, 0, fy, dragao.w, h, x + desloc, y + fy, dragao.w, h);
    fy += altura;
  }
  const blocos = 2 + Math.floor(intensidade * 7);
  for (let k = 0; k < blocos; k++) {
    const bx = x + Math.floor(ruido(bloco * 5 + k) * (dragao.w - 12));
    const by = y + Math.floor(ruido(bloco * 9 + k) * (dragao.h - 6));
    const bw = 4 + Math.floor(ruido(bloco * 3 + k) * 12);
    const bh = 2 + Math.floor(ruido(bloco * 13 + k) * 5);
    if (k % 2) {
      g.globalCompositeOperation = "destination-out";
      g.fillRect(bx, by, bw, bh);
    } else {
      g.globalCompositeOperation = "source-atop";
      retPx(g, bx, by, bw, bh, ["#ffffff", "#00e5ff", "#ff2bd6", "#140c1c"][Math.floor(ruido(bloco + k * 2) * 4)]);
    }
  }
  g.globalCompositeOperation = "source-over";
}

// ---------------------------------------------------------------------------
// Explosão pixelada (380ms): clarão branco -> bola amarela com estrela ->
// fogo laranja pontilhado -> fumaça roxa.
export function explosoes(ctx, t, dragao, x, y) {
  for (const ex of EXPLOSOES) {
    const a = t - ex.inicio;
    if (a < 0 || a >= EXPLOSAO_MS) continue;
    const i = Math.floor(ruido(ex.semente) * dragao.pixels.n);
    const cx = x + dragao.pixels.x[i];
    const cy = y + dragao.pixels.y[i];
    if (a < 60) {
      discoPx(ctx, cx, cy, 4, "#ffffff");
      anelPx(ctx, cx, cy, 7, 7, "#fff3c4");
    } else if (a < 140) {
      discoPx(ctx, cx, cy, 7, "#ffd23c");
      discoPx(ctx, cx, cy, 3, "#ffffff");
      estrelaPx(ctx, cx, cy, 11, "#fff3c4");
    } else if (a < 250) {
      discoPx(ctx, cx, cy, 10, padrao(ctx, "#f07820", 10));
      discoPx(ctx, cx, cy, 6, "#ffd23c");
      discoPx(ctx, cx, cy, 2, "#ffffff");
    } else {
      discoPx(ctx, cx, cy - Math.round((a - 250) / 30), 11, padrao(ctx, "#5b2a86", 6));
      discoPx(ctx, cx, cy - Math.round((a - 250) / 30), 5, padrao(ctx, "#2a1238", 9));
    }
    // estilhaços
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2 + ruido(ex.semente + k);
      const d = a * 0.08;
      if (a > 280 && k % 2) continue;
      retPx(ctx, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 1, 1, k % 2 ? "#ffd23c" : "#ffffff");
    }
  }
}

// ---------------------------------------------------------------------------
// Dissolução de baixo pra cima: apaga da camada do dragão os pixels que já
// se soltaram (pela posição no sprite, sem o deslocamento do glitch)...
export function apagarSoltos(g, t, dragao, x, y) {
  const { pixels } = dragao;
  const dados = g.getImageData(x, y, dragao.w, dragao.h);
  const d = dados.data;
  let algum = false;
  for (let i = 0; i < pixels.n; i++) {
    if (pixels.solta[i] > t) continue;
    d[(pixels.y[i] * dragao.w + pixels.x[i]) * 4 + 3] = 0;
    algum = true;
  }
  if (algum) g.putImageData(dados, x, y);
}

// ...e desenha esses pixels subindo como partículas roxas que somem piscando.
export function particulasDissolucao(ctx, t, dragao, x, y) {
  const { pixels } = dragao;
  const grupos = { "#ffffff": [], "#d27cff": [], "#9b3bd9": [] };
  for (let i = 0; i < pixels.n; i++) {
    if (!pixels.particula[i]) continue;
    const idade = t - pixels.solta[i];
    if (idade < 0 || idade >= VIDA_PARTICULA) continue;
    if (idade > VIDA_PARTICULA * 0.6 && (Math.floor(t / 50) + i) % 2) continue;
    const px = x + pixels.x[i] + (ruido(i) - 0.5) * idade * 0.04 + Math.sin(idade / 110 + i) * 1.2;
    const py = y + pixels.y[i] - idade * 0.03 - idade * idade * 0.00005;
    const cor = idade < 70 ? "#ffffff" : ruido(i * 7) < 0.5 ? "#d27cff" : "#9b3bd9";
    grupos[cor].push(Math.round(px), Math.round(py));
  }
  for (const [cor, pts] of Object.entries(grupos)) {
    ctx.fillStyle = cor;
    for (let k = 0; k < pts.length; k += 2) ctx.fillRect(pts[k], pts[k + 1], 1, 1);
  }
}

// ---------------------------------------------------------------------------
// Purificação: raios de luz dourada entrando pelo vitral até o chão.
export function raiosDeLuz(ctx, t, forca) {
  if (forca <= 0) return;
  const { x: vx, y: vy } = POS.vitral;
  brilhoPx(ctx, vx, vy, Math.round(24 + forca * 16), "#fff3c4", forca);
  const raios = [-0.55, -0.27, 0, 0.27, 0.55];
  raios.forEach((inclinacao, k) => {
    const pisca = Math.floor(t / 120 + k) % 3 === 0 ? 1 : 0;
    const nivel = Math.round((2 + pisca + (k === 2 ? 1 : 0)) * forca);
    for (let y = vy + 10; y < ALTURA - 10; y += 1) {
      const d = y - vy;
      const cx = vx + inclinacao * d;
      const largura = 3 + d * 0.12;
      retPx(ctx, cx - largura / 2, y, largura, 1, padrao(ctx, "#ffe9a8", nivel));
    }
  });
}

// Brilhinhos dourados subindo do chão purificado.
export function brilhosDourados(ctx, t, forca) {
  if (forca <= 0) return;
  for (let k = 0; k < 26; k++) {
    const ciclo = 900 + ruido(k + 3) * 900;
    const p = ((t + ruido(k) * ciclo) % ciclo) / ciclo;
    const x = 20 + ruido(k + 8) * (LARGURA - 40);
    const y = 200 - p * 90;
    if (ruido(k + 21) > forca) continue;
    if (p > 0.7 && (Math.floor(t / 60) + k) % 2) continue;
    const cor = k % 3 ? "#ffd23c" : "#ffffff";
    retPx(ctx, x, y, 1, 1, cor);
    if (k % 5 === 0) {
      retPx(ctx, x - 1, y, 3, 1, cor);
      retPx(ctx, x, y - 1, 1, 3, cor);
    }
  }
}

// Fade final pra branco-dourado em pontilhado.
export function fadeFinal(ctx, t, inicio, fim) {
  if (t < inicio) return;
  const p = degraus((t - inicio) / (fim - inicio - 80), 8);
  retPx(ctx, 0, 0, LARGURA, ALTURA, padrao(ctx, "#ffe9a8", Math.round(p * 16)));
  if (p >= 0.5) retPx(ctx, 0, 0, LARGURA, ALTURA, padrao(ctx, "#ffffff", Math.round((p - 0.5) * 32)));
}
