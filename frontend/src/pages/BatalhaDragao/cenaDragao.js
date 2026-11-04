// Cena da Batalha do Dragão em Canvas 2D, toda em pixel art: tudo é
// desenhado num buffer de baixa resolução (LARGURA x ALTURA) com
// coordenadas inteiras e ampliado sem suavização. Nada de degradê suave nem
// transparência borrada — brilho, sombra e escurecimento são feitos com
// dithering (padrão de Bayer 4x4, o "xadrez" dos jogos de 8/16 bits), e
// partícula some piscando, não esmaecendo.
//
// O dragão é o sprite dragao-sprite.png (gerado de arte-original/dragao.png
// por scripts/gerarDragao.mjs), cortado em partes pra animar: as asas batem
// (achatando a partir da raiz), o tronco respira (sobe/desce 1 px), e boca e
// olho brilham por cima. A arena de fundo é desenhada uma vez só (estática);
// a cada quadro entram só as partes vivas (chamas, runas, partículas).
//
// Não conhece regras: recebe o estado da batalha (ver estadoBatalha.js) e
// anima cada estado — idle, charging, attacking, hit, furia, victory, defeat.
import spriteDragao from "../../assets/images/dragao-sprite.png";
import { DANO_POR_ACERTO } from "./estadoBatalha.js";

export const LARGURA = 320;
export const ALTURA = 200;
// Telas mais largas que 16:10 ganham arena extra dos lados, até esta largura.
const LARGURA_MAXIMA = 480;

// Duração das animações de cada estado (a tela usa pra saber quando
// despachar FIM_ANIMACAO).
export const DURACOES = { hit: 1400, attacking: 1600, furia: 2300 };
const DURACAO_VITORIA = 2600;

// Exportados (paleta, posições, primitivas e a arena) pra cutscene final de
// vitória (components/BossDefeatCutscene) desenhar o MESMO cenário da batalha.
export const P = {
  noite: "#07030f",
  argamassa: "#120a1e",
  tijolo: ["#2a1d40", "#31234a", "#251a39"],
  tijoloLuz: "#3e2f5c",
  tijoloSombra: "#170f26",
  pedra: "#1d1530",
  pedraLuz: "#3a2c55",
  pedraClara: "#4d3c6e",
  piso: ["#251c38", "#2b2142", "#211931"],
  pisoLuz: "#3b2e55",
  pisoSombra: "#140e21",
  vitral: ["#4a1a7a", "#7a2fb8", "#c04dff", "#ff8af5"],
  luz: "#b98cff",
  ouro: "#e8b64c",
  ouroEscuro: "#9a6a1e",
  estandarte: "#4a1a7a",
  estandarteLuz: "#6a2aa8",
  estandarteSombra: "#2e0f4e",
  chama: ["#ffffff", "#ffd1fb", "#ff7bf0", "#c04dff", "#6a1fb0"],
  runa: ["#3a1a66", "#6a2fb8", "#a85cff", "#e6c4ff"],
  sopro: ["#4a0a6e", "#9b1fe0", "#ff5ef0", "#ffffff"],
  escudo: ["#0d5b70", "#2fd4ee", "#bffbff"],
  flashVermelho: "#ff2a5a",
  aura: ["#ff3fd0", "#9b1fe0"],
  olho: "#ffe14a",
  olhoFuria: "#ff2a5a",
  fumaca: ["#8a7aa8", "#5e5078"],
};

export const HEROI = { x: 76, y: 178 }; // pés do herói
export const DRAGAO = { x: 142, y: 64 }; // canto do sprite (os pés ficam em y 178)
// Partes do sprite (coordenadas dentro de dragao-sprite.png, 168x117).
export const SPRITE = {
  boca: { x: 15, y: 63 },
  olho: { x: 25, y: 44 },
  narina: { x: 3, y: 50 },
  peito: { x: 60, y: 62 },
  asaPerto: { x: 78, y: 0, w: 90, h: 48 },
  asaLonge: { x: 14, y: 0, w: 62, h: 13 },
  linhaRespira: 60, // o que está acima sobe/desce 1 px
};

export const limitar = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const suave = (t) => t * t * (3 - 2 * t);
const r = Math.round;
export const hash = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
};

// ---------- Primitivas em pixel ----------

export function novoCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return [c, g];
}

// Dithering ordenado: `nivel` de 0 (nada) a 16 (cor sólida) — quantos dos 16
// pixels de cada bloco 4x4 recebem a cor. O padrão fica preso à grade do
// canvas, então não "anda" quando a forma se move.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const cachePadroes = new WeakMap();

export function padrao(g, cor, nivel) {
  const n = Math.max(0, Math.min(16, r(nivel)));
  if (n >= 16) return cor;
  if (g instanceof TelaPixels) return { cor, n }; // pontilhado calculado pixel a pixel
  let mapa = cachePadroes.get(g);
  if (!mapa) cachePadroes.set(g, (mapa = new Map()));
  const chave = `${cor}|${n}`;
  let p = mapa.get(chave);
  if (!p) {
    const [c, cg] = novoCanvas(4, 4);
    cg.fillStyle = cor;
    for (let i = 0; i < 16; i++) if (BAYER[i] < n) cg.fillRect(i % 4, (i / 4) | 0, 1, 1);
    p = g.createPattern(c, "repeat");
    mapa.set(chave, p);
  }
  return p;
}

// "Canvas" em memória pra desenhos ESTÁTICOS feitos de muitos retângulos
// (a arena): implementa só o que as primitivas daqui usam — fillStyle (cor
// "#rrggbb" ou o pontilhado de padrao()), fillRect com coordenadas inteiras
// e translate — escrevendo direto num buffer de pixels.
//
// Por quê: num canvas de verdade, construirArena registra milhares de
// fillRect (muitos com pontilhado) e o navegador só os executa quando o
// canvas é usado pela primeira vez — e aí trava a página: medido ~1,3 a
// 2,6 s POR ARENA mesmo sem limitar a CPU, e a cutscene final monta duas no
// começo da luta (a tela ficava congelada vários segundos). Escrevendo os
// pixels direto, a mesma arena sai em poucos milissegundos, idêntica pixel
// a pixel (só cores opacas, sem suavização).
class TelaPixels {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Uint32Array(w * h); // RGBA little-endian; 0 = transparente
    this.tx = 0;
    this.ty = 0;
    this.fillStyle = "#000000";
    this.cores = new Map(); // "#rrggbb" -> pixel empacotado
  }

  translate(x, y) {
    this.tx += x;
    this.ty += y;
  }

  cor(hex) {
    let v = this.cores.get(hex);
    if (v === undefined) {
      const n = parseInt(hex.slice(1, 7), 16);
      v = (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0;
      this.cores.set(hex, v);
    }
    return v;
  }

  fillRect(x, y, w, h) {
    // largura/altura negativas: o canvas desenha pro outro lado
    if (w < 0) { x += w; w = -w; }
    if (h < 0) { y += h; h = -h; }
    const x0 = Math.max(0, x + this.tx), y0 = Math.max(0, y + this.ty);
    const x1 = Math.min(this.w, x + this.tx + w), y1 = Math.min(this.h, y + this.ty + h);
    if (x0 >= x1 || y0 >= y1) return;
    const estilo = this.fillStyle;
    const px = this.px;
    if (typeof estilo === "string") {
      const v = this.cor(estilo);
      for (let yy = y0; yy < y1; yy++) px.fill(v, yy * this.w + x0, yy * this.w + x1);
      return;
    }
    // pontilhado (Bayer 4x4), preso à grade do sistema de coordenadas atual
    // — igual a um createPattern do canvas desenhado com o mesmo translate
    const v = this.cor(estilo.cor);
    for (let yy = y0; yy < y1; yy++) {
      const by = ((((yy - this.ty) % 4) + 4) % 4) * 4;
      for (let xx = x0; xx < x1; xx++) {
        if (BAYER[by + ((((xx - this.tx) % 4) + 4) % 4)] < estilo.n) px[yy * this.w + xx] = v;
      }
    }
  }

  // Passa pra um canvas de verdade (uma única operação de desenho).
  paraCanvas() {
    const [c, g] = novoCanvas(this.w, this.h);
    g.putImageData(new ImageData(new Uint8ClampedArray(this.px.buffer), this.w, this.h), 0, 0);
    return c;
  }
}

export function retPx(g, x, y, w, h, estilo) {
  g.fillStyle = estilo;
  g.fillRect(r(x), r(y), r(w), r(h));
}

export function discoPx(g, cx, cy, raio, estilo) {
  const x0 = r(cx), y0 = r(cy), rr = r(raio);
  if (rr < 0) return;
  g.fillStyle = estilo;
  for (let dy = -rr; dy <= rr; dy++) {
    const w = Math.floor(Math.sqrt((rr + 0.5) ** 2 - dy * dy));
    g.fillRect(x0 - w, y0 + dy, w * 2 + 1, 1);
  }
}

export function elipsePx(g, cx, cy, rx, ry, estilo) {
  const x0 = r(cx), y0 = r(cy), ryy = Math.max(1, r(ry));
  g.fillStyle = estilo;
  for (let dy = -ryy; dy <= ryy; dy++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy / (ryy + 0.5)) ** 2)));
    g.fillRect(x0 - w, y0 + dy, w * 2 + 1, 1);
  }
}

export function anelPx(g, cx, cy, rx, ry, estilo, espessura = 1) {
  g.fillStyle = estilo;
  const n = Math.ceil(Math.PI * 2 * Math.max(rx, ry) * 1.4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.fillRect(r(cx + Math.cos(a) * rx), r(cy + Math.sin(a) * ry), espessura, espessura);
  }
}

// Brilho em camadas de dithering: borda rala, miolo cheio.
export function brilhoPx(g, cx, cy, raio, cor, forca = 1) {
  if (forca <= 0 || raio < 1) return;
  discoPx(g, cx, cy, raio, padrao(g, cor, 4 * forca));
  discoPx(g, cx, cy, raio * 0.62, padrao(g, cor, 9 * forca));
  discoPx(g, cx, cy, raio * 0.3, forca > 0.45 ? cor : padrao(g, cor, 12 * forca));
}

// Estrela de impacto em pixel (cruz + diagonais).
export function estrelaPx(g, cx, cy, tam, cor, nucleo = "#ffffff") {
  const x = r(cx), y = r(cy);
  g.fillStyle = cor;
  g.fillRect(x - tam, y, tam * 2 + 1, 1);
  g.fillRect(x, y - tam, 1, tam * 2 + 1);
  const d = Math.floor(tam * 0.6);
  for (let i = 1; i <= d; i++) {
    g.fillRect(x - i, y - i, 1, 1);
    g.fillRect(x + i, y - i, 1, 1);
    g.fillRect(x - i, y + i, 1, 1);
    g.fillRect(x + i, y + i, 1, 1);
  }
  g.fillStyle = nucleo;
  g.fillRect(x - 1, y - 1, 3, 3);
}

// Fonte de 3x5 pixels (dano e os símbolos de código dentro do sopro).
const FONTE = {
  0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111",
  4: "101101111001001", 5: "111100111001111", 6: "111100111101111", 7: "111001001001001",
  8: "111101111101111", 9: "111101111001111", "-": "000000111000000", "{": "011010110010011",
  "}": "110010011010110", ";": "000010000010100", "(": "001010010010001", ")": "100010010010100",
  "=": "000111000111000",
};

export function textoPx(g, texto, x, y, cor, contorno, escala = 1) {
  const e = escala;
  const desenhar = (dx, dy, estilo) => {
    g.fillStyle = estilo;
    [...texto].forEach((ch, i) => {
      const bits = FONTE[ch];
      if (!bits) return;
      for (let k = 0; k < 15; k++) if (bits[k] === "1") g.fillRect(r(x) + (i * 4 + (k % 3)) * e + dx, r(y) + ((k / 3) | 0) * e + dy, e, e);
    });
  };
  if (contorno) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) desenhar(dx, dy, contorno);
  desenhar(0, 0, cor);
}

// ---------- Arena (fundo estático, desenhado uma vez) ----------

export const HORIZONTE = 120; // onde a parede encontra o chão

// Cores do vitral e da luz que entra por ele: a arena corrompida (roxa) da
// batalha e a purificada (dourada) do fim da cutscene de vitória.
export const TEMAS_ARENA = {
  corrompida: { vitral: P.vitral, luz: P.luz },
  purificada: { vitral: ["#8a5a12", "#d99a1e", "#ffd23c", "#fff3c4"], luz: "#ffe9a8" },
};

// `total`: largura real do buffer (>= LARGURA). A cena de LARGURA px fica no
// meio; parede, chão e pilares se estendem até as bordas em telas largas.
export function construirArena(total, tema = TEMAS_ARENA.corrompida) {
  const m = (total - LARGURA) / 2;
  const x0 = -m, x1 = LARGURA + m; // bordas de verdade
  // desenhada em memória e passada pro canvas de uma vez (ver TelaPixels)
  const f = new TelaPixels(total, ALTURA);
  f.translate(m, 0);

  // parede de tijolos, cada um com luz em cima/esquerda e sombra embaixo/direita
  retPx(f, x0, 0, total, HORIZONTE, P.argamassa);
  for (let linha = 0, y = 0; y < HORIZONTE; linha++, y += 9) {
    for (let x = (linha % 2 ? -9 : 0) - Math.ceil(m / 18) * 18; x < x1; x += 18) {
      const h = hash(x + 40, linha);
      retPx(f, x + 1, y + 1, 16, 7, P.tijolo[h % 3]);
      retPx(f, x + 1, y + 1, 16, 1, P.tijoloLuz);
      retPx(f, x + 1, y + 1, 1, 7, P.tijoloLuz);
      retPx(f, x + 1, y + 7, 16, 1, P.tijoloSombra);
      retPx(f, x + 16, y + 1, 1, 7, P.tijoloSombra);
      if (h % 9 === 0) {
        // rachadura
        const cx = x + 4 + (h % 8);
        for (let k = 0; k < 4; k++) retPx(f, cx + (k % 2), y + 2 + k, 1, 1, P.tijoloSombra);
      }
    }
  }

  // vitral redondo no alto, com o halo de luz da lua em dithering
  const vx = 160, vy = 32;
  discoPx(f, vx, vy, 34, padrao(f, tema.luz, 2));
  discoPx(f, vx, vy, 27, padrao(f, tema.luz, 4));
  discoPx(f, vx, vy, 22, P.pedra);
  discoPx(f, vx, vy, 21, P.pedraLuz);
  discoPx(f, vx, vy, 19, tema.vitral[0]);
  for (let i = 0; i < 8; i++) {
    // gomos alternados do vitral
    const a0 = (i / 8) * Math.PI * 2;
    for (let raio = 6; raio <= 18; raio++) {
      for (let k = 0; k < 6; k++) {
        const a = a0 + ((k + 1) / 7) * ((Math.PI * 2) / 8);
        retPx(f, vx + Math.cos(a) * raio, vy + Math.sin(a) * raio, 1, 1, raio > 13 ? tema.vitral[i % 2 ? 1 : 2] : tema.vitral[i % 2 ? 2 : 3]);
      }
    }
  }
  for (let i = 0; i < 8; i++) {
    // raios de pedra do vitral
    const a = (i / 8) * Math.PI * 2;
    for (let raio = 4; raio <= 19; raio++) retPx(f, vx + Math.cos(a) * raio, vy + Math.sin(a) * raio, 1, 1, P.pedra);
  }
  anelPx(f, vx, vy, 12, 12, P.pedra);
  discoPx(f, vx, vy, 4, P.ouro);
  discoPx(f, vx, vy, 2, "#fff3c4");

  // pilares nas bordas
  for (const px of [x0, x1 - 20]) {
    retPx(f, px, 0, 20, HORIZONTE + 4, P.pedra);
    retPx(f, px + 3, 0, 3, HORIZONTE + 4, P.pedraLuz);
    retPx(f, px + 4, 0, 1, HORIZONTE + 4, P.pedraClara);
    retPx(f, px + 15, 0, 5, HORIZONTE + 4, P.tijoloSombra);
    for (let y = 18; y < HORIZONTE; y += 28) {
      retPx(f, px, y, 20, 2, P.pedraLuz);
      retPx(f, px, y + 2, 20, 1, P.tijoloSombra);
    }
    retPx(f, px - 2, 0, 24, 6, P.pedraLuz); // capitel
    retPx(f, px - 2, 6, 24, 1, P.tijoloSombra);
    retPx(f, px - 3, HORIZONTE - 6, 26, 8, P.pedraLuz); // base
    retPx(f, px - 3, HORIZONTE - 6, 26, 1, P.pedraClara);
  }

  // estandartes com o olho do dragão bordado em ouro
  for (const ex of [36, LARGURA - 58]) {
    retPx(f, ex - 2, 8, 26, 2, P.ouro);
    retPx(f, ex - 2, 10, 26, 1, P.ouroEscuro);
    retPx(f, ex, 11, 22, 52, P.estandarte);
    retPx(f, ex + 4, 11, 2, 52, P.estandarteSombra);
    retPx(f, ex + 10, 11, 2, 52, P.estandarteLuz);
    retPx(f, ex + 16, 11, 2, 52, P.estandarteSombra);
    retPx(f, ex, 11, 1, 52, P.ouro);
    retPx(f, ex + 21, 11, 1, 52, P.ouro);
    for (let k = 0; k < 9; k++) {
      // ponta em V
      retPx(f, ex + k, 63 + k, 11 - k, 1, P.estandarte);
      retPx(f, ex + 11, 63 + k, 11 - k, 1, P.estandarte);
      retPx(f, ex + k, 63 + k, 1, 1, P.ouro);
      retPx(f, ex + 21 - k, 63 + k, 1, 1, P.ouro);
    }
    // olho: losango dourado com a pupila em fenda
    for (let k = 0; k <= 5; k++) {
      retPx(f, ex + 11 - k, 31 - 5 + k, k * 2 + 1, 1, P.ouro);
      retPx(f, ex + 11 - k, 31 + 5 - k, k * 2 + 1, 1, P.ouro);
    }
    for (let k = 0; k <= 3; k++) {
      retPx(f, ex + 11 - k, 31 - 3 + k, k * 2 + 1, 1, tema.vitral[2]);
      retPx(f, ex + 11 - k, 31 + 3 - k, k * 2 + 1, 1, tema.vitral[2]);
    }
    retPx(f, ex + 11, 27, 1, 9, P.noite);
  }

  // o alto da parede fica no escuro (a luz vem dos braseiros e do vitral)
  for (let y = 0; y < HORIZONTE; y++) {
    const nivel = r((1 - y / HORIZONTE) ** 1.6 * 9);
    if (nivel > 0) retPx(f, x0, y, total, 1, padrao(f, P.noite, nivel));
  }

  // rodapé de pedra entre a parede e o chão
  retPx(f, x0, HORIZONTE, total, 3, P.pedraLuz);
  retPx(f, x0, HORIZONTE, total, 1, P.pedraClara);
  retPx(f, x0, HORIZONTE + 3, total, 1, P.pisoSombra);

  // chão de lajotas em perspectiva: as fileiras crescem pra perto da tela
  let y = HORIZONTE + 4;
  for (let fileira = 0; y < ALTURA; fileira++) {
    const altura = 4 + fileira;
    const largura = 16 + fileira * 6;
    for (let x = -(fileira % 2) * (largura / 2) - Math.ceil(m / largura) * largura; x < x1; x += largura) {
      const h = hash(r(x) + 900, fileira);
      retPx(f, x, y, largura, altura, P.piso[h % 3]);
      retPx(f, x, y, largura, 1, P.pisoLuz);
      retPx(f, x, y, 1, altura, P.pisoSombra);
      retPx(f, x, y + altura - 1, largura, 1, P.pisoSombra);
      if (h % 5 === 0) retPx(f, x + (h % (largura - 4)) + 2, y + 2, 2, 1, P.pisoSombra);
    }
    y += altura;
  }
  // fundo do chão mais escuro (longe da tela)
  for (let yy = HORIZONTE + 4; yy < 150; yy++) {
    retPx(f, x0, yy, total, 1, padrao(f, P.noite, r((1 - (yy - HORIZONTE) / 30) * 7)));
  }

  // anel de pedra da arena (as runas acesas entram por quadro)
  anelPx(f, 160, 170, 152, 25, P.pedraClara, 2);
  anelPx(f, 160, 171, 152, 25, P.pisoSombra);
  anelPx(f, 160, 170, 136, 21, P.pisoSombra);

  // feixes de luz do vitral até o chão
  for (let yy = 52; yy < 182; yy++) {
    const meio = (yy - 52) * 0.35;
    retPx(f, 150 - meio, yy, 20 + meio * 2, 1, padrao(f, tema.luz, yy < 120 ? 2 : 1));
  }

  // braseiros (a chama é animada por quadro)
  for (const bx of [44, LARGURA - 44]) {
    retPx(f, bx - 2, 134, 5, 20, P.pedra);
    retPx(f, bx - 1, 134, 1, 20, P.pedraLuz);
    retPx(f, bx - 6, 153, 13, 3, P.pedraLuz);
    retPx(f, bx - 9, 128, 19, 3, P.pedraLuz);
    retPx(f, bx - 8, 131, 17, 3, P.pedra);
    retPx(f, bx - 6, 134, 13, 1, P.tijoloSombra);
    retPx(f, bx - 9, 128, 19, 1, P.pedraClara);
  }

  // vinheta: cantos escurecidos em dithering
  for (let yy = 0; yy < ALTURA; yy++) {
    for (const lado of [0, 1]) {
      for (let k = 0; k < 4; k++) {
        const w = 6 + k * 5;
        retPx(f, lado ? x1 - w : x0, yy, w, 1, padrao(f, P.noite, 3));
      }
    }
  }
  return f.paraCanvas();
}

// ---------- Cena ----------

export function criarCenaDragao(canvas, { camadas = [] } = {}) {
  const ctx = canvas.getContext("2d");
  // buffer e arena são recriados quando a proporção do canvas muda (ajustarTamanho)
  let total = 0; // largura do buffer
  let margem = 0; // (total - LARGURA) / 2
  let buffer, b, arena;
  const [camadaDragao, d] = novoCanvas(LARGURA, ALTURA); // dragão à parte (flash, contorno, dissolver)
  const [silhueta, s] = novoCanvas(LARGURA, ALTURA);
  const [camadaHeroi, h] = novoCanvas(64, 64);

  let partes = null;
  const imagem = new Image();
  imagem.onload = () => {
    partes = cortarSprite(imagem);
  };
  imagem.src = spriteDragao;

  let quadro = 0;
  let estado = { estado: "intro", fase: 1, escudo: false, inicioCarga: null, prazoMs: 1 };
  let inicioEstado = performance.now();
  let tremor = 0;
  let escudoQuebrou = false;
  let impactoFeito = false;
  let poeira = null; // pixels do dragão se desfazendo na vitória
  const rastro = [];
  let ampliado = null; // buffer já ampliado pelo fator inteiro (ver o fim de desenhar)
  let gAmpliado = null;
  let fatorAmpliado = 0;
  const particulas = [];

  function ajustarTamanho() {
    const caixa = canvas.getBoundingClientRect();
    // densidade limitada a 2x: a arena tem 320 px de largura — em telas 3x o
    // canvas pintava até 2,4 milhões de pixels por quadro sem ganho visível
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(caixa.width * dpr));
    canvas.height = Math.max(1, Math.round(caixa.height * dpr));
    // tela mais larga que 16:10: a arena cresce pros lados (até LARGURA_MAXIMA)
    const ideal = Math.round((ALTURA * canvas.width) / canvas.height / 2) * 2;
    const novo = Math.max(LARGURA, Math.min(LARGURA_MAXIMA, ideal));
    if (novo !== total) {
      total = novo;
      margem = (total - LARGURA) / 2;
      [buffer, b] = novoCanvas(total, ALTURA);
      arena = construirArena(total);
      fatorAmpliado = 0;
    }
  }

  function particula(p) {
    particulas.push({ vida: 1, tam: 1, cor: "#ffffff", vx: 0, vy: 0, ax: 0, ay: 0, decai: 0.02, ...p });
  }

  // Versão carmesim do sprite (Modo Fúria): troca de paleta pixel a pixel — os
  // roxos viram vermelho-sangue, mantendo o brilho; chifres, garras e o olho
  // (pouca saturação ou amarelo) ficam iguais.
  function versaoFuria(img) {
    const [c, g] = novoCanvas(img.width, img.height);
    g.drawImage(img, 0, 0);
    const dados = g.getImageData(0, 0, img.width, img.height);
    const px = dados.data;
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      const [cr, cg, cb] = [px[i], px[i + 1], px[i + 2]];
      const max = Math.max(cr, cg, cb), min = Math.min(cr, cg, cb);
      const roxo = cb > cg + 12 && max - min > 18;
      if (!roxo) continue;
      const brilho = (cr + cg + cb) / 3;
      px[i] = Math.min(255, r(brilho * 1.9 + 18));
      px[i + 1] = r(brilho * 0.35);
      px[i + 2] = r(brilho * 0.55);
    }
    g.putImageData(dados, 0, 0);
    return c;
  }

  function cortarSprite(img) {
    return { normal: cortarPartes(img), furia: cortarPartes(versaoFuria(img)) };
  }

  function cortarPartes(img) {
    const { asaPerto: ap, asaLonge: al, linhaRespira: lr } = SPRITE;
    const pedaco = (x, y, w, hh) => {
      const [c, g] = novoCanvas(w, hh);
      g.drawImage(img, x, y, w, hh, 0, 0, w, hh);
      return c;
    };
    const [baixo, gb] = novoCanvas(img.width, img.height);
    gb.drawImage(img, 0, 0);
    gb.clearRect(0, 0, img.width, lr);
    const [cima, gc] = novoCanvas(img.width, lr);
    gc.drawImage(img, 0, 0);
    gc.clearRect(ap.x, ap.y, ap.w, ap.h);
    gc.clearRect(al.x, al.y, al.w, al.h);
    return { baixo, cima, asaPerto: pedaco(ap.x, ap.y, ap.w, ap.h), asaLonge: pedaco(al.x, al.y, al.w, al.h) };
  }

  // posições na tela (buffer) das partes do dragão
  function pontos(info) {
    const ox = DRAGAO.x + r(info.dx ?? 0);
    const oy = DRAGAO.y + r(info.dy ?? 0);
    const em = (p) => ({ x: ox + p.x, y: oy + p.y });
    return { ox, oy, boca: em(SPRITE.boca), olho: em(SPRITE.olho), narina: em(SPRITE.narina), peito: em(SPRITE.peito) };
  }

  // ---------- Dragão ----------

  function desenharDragao(t, info) {
    d.clearRect(0, 0, LARGURA, ALTURA);
    if (!partes) return;
    const pecas = info.carmesim ? partes.furia : partes.normal;
    const { ox, oy } = pontos(info);
    const resp = info.parado ? 0 : Math.floor(t / (info.furia ? 380 : 620)) % 2;
    // batida de asa: achata a asa a partir da raiz (em pixels inteiros)
    const batida = info.asa ?? 0.5 + 0.5 * Math.sin(t / (info.furia ? 150 : 340));
    const { asaPerto: ap, asaLonge: al } = SPRITE;
    const hp = r(ap.h * (0.8 + 0.26 * batida));
    const hl = r(al.h * (0.75 + 0.35 * batida));

    d.drawImage(pecas.asaLonge, ox + al.x, oy + al.y + al.h - hl + resp, al.w, hl);
    d.drawImage(pecas.baixo, ox, oy);
    d.drawImage(pecas.cima, ox, oy + resp);
    d.drawImage(pecas.asaPerto, ox + ap.x, oy + ap.y + ap.h - hp + resp, ap.w, hp);

    d.globalCompositeOperation = "source-atop";
    // dano: o dragão inteiro pisca branco/vermelho (cor cheia, quadro sim quadro não)
    if (info.flash) retPx(d, 0, 0, LARGURA, ALTURA, Math.floor(t / 60) % 2 ? "#ffffff" : P.flashVermelho);
    d.globalCompositeOperation = "source-over";
  }

  // contorno pulsante (Modo Fúria): a silhueta, pintada, 1-2 px pra fora
  function desenharAura(t, forca) {
    if (forca <= 0) return;
    s.clearRect(0, 0, LARGURA, ALTURA);
    s.drawImage(camadaDragao, 0, 0);
    s.globalCompositeOperation = "source-in";
    const fase = Math.floor(t / 110) % 2;
    retPx(s, 0, 0, LARGURA, ALTURA, P.aura[fase]);
    s.globalCompositeOperation = "source-over";
    if (forca < 0.5 && fase) return; // começando: o contorno pisca
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) b.drawImage(silhueta, dx, dy);
  }

  function desenharOlho(t, info, olho) {
    const furia = info.furia > 0.5;
    const pulso = Math.floor(t / 180) % 3;
    brilhoPx(b, olho.x + 1, olho.y + 1, 4 + pulso, furia ? P.olhoFuria : P.olho, 0.55);
    retPx(b, olho.x, olho.y, 2, 2, furia ? P.olhoFuria : P.olho);
    retPx(b, olho.x, olho.y, 1, 1, "#ffffff");
  }

  // vitória: o dragão vira poeira de pixels, de cima pra baixo
  function iniciarPoeira() {
    const dados = d.getImageData(0, 0, LARGURA, ALTURA).data;
    const lista = [];
    for (let y = 0; y < ALTURA; y++) {
      for (let x = 0; x < LARGURA; x++) {
        const i = (y * LARGURA + x) * 4;
        if (dados[i + 3]) lista.push([x, y, dados[i], dados[i + 1], dados[i + 2]]);
      }
    }
    const n = lista.length;
    poeira = {
      n,
      x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n),
      y0: new Int16Array(n), cor: new Uint8Array(n * 3), solta: new Uint8Array(n), vida: new Float32Array(n),
      imagem: d.createImageData(LARGURA, ALTURA),
      topo: lista.length ? lista[0][1] : 0,
      fundo: lista.length ? lista[n - 1][1] : 0,
    };
    lista.forEach(([x, y, cr, cg, cb], i) => {
      poeira.x[i] = x; poeira.y[i] = y; poeira.y0[i] = y;
      poeira.vx[i] = (Math.random() - 0.3) * 0.9;
      poeira.vy[i] = -0.3 - Math.random() * 1.1;
      poeira.cor.set([cr, cg, cb], i * 3);
      poeira.vida[i] = 0.7 + Math.random() * 0.6;
    });
  }

  function desenharPoeira(p) {
    const q = poeira;
    const pixels = q.imagem.data;
    pixels.fill(0);
    const corte = q.topo + (q.fundo - q.topo + 2) * suave(limitar(p / 0.7));
    for (let i = 0; i < q.n; i++) {
      if (!q.solta[i] && q.y0[i] <= corte) q.solta[i] = 1;
      let cr = q.cor[i * 3], cg = q.cor[i * 3 + 1], cb = q.cor[i * 3 + 2];
      if (q.solta[i]) {
        q.vy[i] -= 0.015;
        q.x[i] += q.vx[i];
        q.y[i] += q.vy[i];
        q.vida[i] -= 0.012;
        if (q.vida[i] <= 0) continue;
        // ao se soltar, o pixel acende (magenta, depois branco) e some piscando
        if (q.vida[i] > 0.85) { cr = 255; cg = 255; cb = 255; }
        else { cr = 255; cg = 110; cb = 240; }
        if (q.vida[i] < 0.35 && (i + quadro) % 2) continue;
      }
      const x = r(q.x[i]), y = r(q.y[i]);
      if (x < 0 || y < 0 || x >= LARGURA || y >= ALTURA) continue;
      const k = (y * LARGURA + x) * 4;
      pixels[k] = cr; pixels[k + 1] = cg; pixels[k + 2] = cb; pixels[k + 3] = 255;
    }
    d.putImageData(q.imagem, 0, 0);
  }

  // ---------- Partes vivas da arena ----------

  function desenharChamas(t, forte) {
    for (const bx of [44, LARGURA - 44]) {
      const tremula = Math.floor(t / 90);
      brilhoPx(b, bx, 118, 26 + (tremula % 2) * 2, P.chama[3], 0.35 + forte * 0.2);
      for (let i = -7; i <= 7; i++) {
        const base = 10 * (1 - Math.abs(i) / 8);
        const altura = Math.max(1, r(base + Math.sin(tremula * 0.9 + i * 1.7 + bx) * 2.5 + (hash(tremula, i + bx) % 3) + forte * 4));
        for (let k = 0; k < altura; k++) {
          const f = k / altura;
          const centro = Math.abs(i) <= 2;
          const cor = f < 0.25 && centro ? P.chama[0] : f < 0.5 ? P.chama[centro ? 1 : 2] : f < 0.8 ? P.chama[3] : P.chama[4];
          retPx(b, bx + i, 127 - k, 1, 1, cor);
        }
      }
      if (Math.random() < 0.25 + forte * 0.3) particula({ x: bx + (Math.random() - 0.5) * 10, y: 116, vy: -0.4 - Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.3, cor: P.chama[Math.random() < 0.5 ? 2 : 3], decai: 0.025 });
    }
  }

  function desenharRunas(t, forca) {
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t / 7000;
      const x = r(160 + Math.cos(a) * 144);
      const y = r(170 + Math.sin(a) * 23);
      const nivel = Math.floor((Math.sin(t / 260 + i * 0.9) * 0.5 + 0.5) * 3.99 * forca);
      const cor = P.runa[Math.min(3, nivel)];
      g3x3(x, y, i % 4, cor);
    }
  }

  function g3x3(x, y, tipo, cor) {
    const formas = ["010111010", "101010101", "111101111", "110011110"];
    b.fillStyle = cor;
    const f = formas[tipo];
    for (let k = 0; k < 9; k++) if (f[k] === "1") b.fillRect(x - 1 + (k % 3), y - 1 + ((k / 3) | 0), 1, 1);
  }

  // ---------- Herói ----------

  function desenharHeroi(t, info) {
    const { dx = 0, vermelho = false, apagado = false } = info;
    elipsePx(b, HEROI.x + dx, HEROI.y + 1, 13, 3, padrao(b, P.noite, 10));
    h.clearRect(0, 0, 64, 64);
    for (const img of camadas) if (img.complete && img.naturalWidth > 0) h.drawImage(img, 0, 0, 64, 64);
    h.globalCompositeOperation = "source-atop";
    if (vermelho && Math.floor(t / 70) % 2) retPx(h, 0, 0, 64, 64, P.flashVermelho);
    if (apagado) retPx(h, 0, 0, 64, 64, padrao(h, P.noite, 10));
    h.globalCompositeOperation = "source-over";
    const respira = Math.floor(t / 520) % 2;
    b.drawImage(camadaHeroi, r(HEROI.x - 32 + dx), HEROI.y - 60 + respira);
  }

  function desenharEscudo(t, forca) {
    if (forca <= 0) return;
    const cx = HEROI.x, cy = HEROI.y - 28;
    elipsePx(b, cx, cy, 24, 32, padrao(b, P.escudo[1], 2 * forca));
    anelPx(b, cx, cy, 24, 32, Math.floor(t / 150) % 2 ? P.escudo[1] : P.escudo[2]);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t / 700;
      retPx(b, cx + Math.cos(a) * 24, cy + Math.sin(a) * 32, 1, 1, "#ffffff");
    }
  }

  // ---------- Quadro ----------

  function desenhar(agora) {
    const st = estado.estado;
    const t = agora;
    const decorrido = agora - inicioEstado;
    const fase2 = estado.fase === 2;
    const info = { furia: fase2 ? 1 : 0, carmesim: fase2 };
    const heroi = {};
    let escurecer = 0;
    let forcaEscudo = estado.escudo ? 1 : 0;
    let aura = fase2 ? 0.7 : 0;
    const carga = st === "charging" && estado.inicioCarga ? limitar((agora - estado.inicioCarga) / estado.prazoMs) : 0;

    if (st !== "attacking") escudoQuebrou = false;
    if (st !== "hit") impactoFeito = false;
    if (st !== "victory") poeira = null;

    if (st === "charging") {
      escurecer = 0.1 + carga * 0.25;
      if (carga > 0.8) tremor = Math.max(tremor, 1);
    }

    if (st === "attacking") {
      const p = decorrido / DURACOES.attacking;
      info.dx = p > 0.08 && p < 0.85 ? -6 : 0; // avança pro bote
      escurecer = 0.32 * (1 - p);
      if (p > 0.15 && p < 0.78) tremor = Math.max(tremor, 3);
      heroi.vermelho = p > 0.25 && p < 0.8;
      heroi.dx = p > 0.25 && p < 0.8 ? -2 - (Math.floor(agora / 60) % 2) : 0;
      forcaEscudo = 0;
    }

    if (st === "hit") {
      const p = decorrido / DURACOES.hit;
      forcaEscudo = 1;
      heroi.dx = p < 0.25 ? r(p * 12) : 0; // golpe pra frente
      if (p > 0.5) {
        const impacto = limitar((p - 0.5) / 0.35);
        info.flash = impacto < 0.6;
        info.dx = r(Math.sin(impacto * Math.PI) * 7);
        if (p < 0.62) tremor = Math.max(tremor, 3);
      }
    }

    if (st === "furia") {
      const p = decorrido / DURACOES.furia;
      info.furia = 1;
      // troca de paleta piscando até ficar carmesim de vez
      info.carmesim = p > 0.55 || (p > 0.1 && Math.floor(agora / 90) % 2 === 0);
      info.dy = -r(Math.sin(limitar(p * 1.3) * Math.PI) * 5);
      info.asa = 0.5 + 0.5 * Math.sin(agora / 70);
      aura = limitar(p * 2);
      if (p > 0.12 && p < 0.72) tremor = Math.max(tremor, 3);
      escurecer = 0.28 * Math.sin(p * Math.PI);
    }

    if (st === "victory") {
      info.parado = true;
      info.flash = decorrido < 500;
      aura = 0;
    }

    if (st === "defeat") {
      heroi.apagado = true;
      info.dy = Math.floor(agora / 130) % 2; // risada
    }

    // 1. arena + partes vivas (a cena de LARGURA px fica no meio do buffer)
    b.setTransform(1, 0, 0, 1, margem, 0);
    b.drawImage(arena, -margem, 0);
    desenharRunas(t, st === "charging" ? 0.6 + carga * 0.4 : fase2 ? 1 : 0.7);
    desenharChamas(t, fase2 ? 1 : 0);
    if (escurecer > 0) retPx(b, -margem, 0, total, ALTURA, padrao(b, P.noite, escurecer * 16));

    // 2. dragão (sombra, contorno da fúria, sprite, olho)
    const pt = pontos(info);
    if (st !== "victory") elipsePx(b, DRAGAO.x + 86 + (info.dx ?? 0), 179, 70, 5, padrao(b, P.noite, 10));
    if (st === "victory") {
      if (!poeira && decorrido >= 500 && partes) {
        desenharDragao(t, info);
        iniciarPoeira();
      }
      if (poeira) desenharPoeira(decorrido / DURACAO_VITORIA);
      else desenharDragao(t, info);
    } else {
      desenharDragao(t, info);
    }
    desenharAura(t, aura);
    b.drawImage(camadaDragao, 0, 0);
    if (st !== "victory" && partes) desenharOlho(t, info, pt.olho);

    // fumaça das narinas e brasas
    if (st !== "victory" && Math.random() < 0.1) {
      particula({ x: pt.narina.x, y: pt.narina.y, vx: -0.3 + Math.random() * 0.25, vy: -0.25 - Math.random() * 0.3, cor: P.fumaca[Math.random() < 0.5 ? 0 : 1], tam: Math.random() < 0.5 ? 2 : 1, decai: 0.018 });
    }
    if (st !== "victory" && Math.random() < 0.15 + (fase2 ? 0.35 : 0)) {
      particula({ x: DRAGAO.x + 30 + Math.random() * 110, y: DRAGAO.y + 20 + Math.random() * 60, vy: -0.4 - Math.random() * 0.5, cor: P.aura[Math.random() < 0.5 ? 0 : 1], decai: 0.02 });
    }

    // carga: brilho crescendo na boca + partículas sugadas
    if (st === "charging" || st === "attacking") {
      const forca = st === "charging" ? carga : 1;
      const pisca = Math.floor(agora / 80) % 2;
      brilhoPx(b, pt.boca.x, pt.boca.y, 3 + forca * 9 + pisca, P.sopro[2], 0.4 + forca * 0.6);
      discoPx(b, pt.boca.x, pt.boca.y, 1 + forca * 3, P.sopro[3]);
      if (st === "charging" && Math.random() < 0.35 + carga * 0.65) {
        const a = Math.random() * Math.PI * 2;
        const raio = 22 + Math.random() * 18;
        particula({ x: pt.boca.x + Math.cos(a) * raio, y: pt.boca.y + Math.sin(a) * raio, alvo: pt.boca, cor: P.sopro[Math.random() < 0.5 ? 2 : 1], decai: 0.03 });
      }
    }

    // contra-ataque: cristal de energia voando até o peito do dragão
    if (st === "hit") {
      const p = decorrido / DURACOES.hit;
      const voo = limitar((p - 0.2) / 0.3);
      if (voo > 0 && voo < 1) {
        const ini = { x: HEROI.x + 14, y: HEROI.y - 34 };
        const fim = pt.peito;
        const x = r(ini.x + (fim.x - ini.x) * voo);
        const y = r(ini.y + (fim.y - ini.y) * voo - Math.sin(voo * Math.PI) * 22);
        rastro.push({ x, y });
        if (rastro.length > 10) rastro.shift();
        rastro.forEach((q, i) => retPx(b, q.x, q.y, 2, 2, padrao(b, P.escudo[1], 4 + i * 1.2)));
        // losango de cristal
        for (let k = 0; k <= 3; k++) retPx(b, x - k, y - 3 + k, k * 2 + 1, 1, P.escudo[1]);
        for (let k = 0; k <= 3; k++) retPx(b, x - k, y + 3 - k, k * 2 + 1, 1, P.escudo[1]);
        retPx(b, x - 1, y - 1, 2, 2, "#ffffff");
      } else {
        rastro.length = 0;
      }
      if (p > 0.5 && !impactoFeito) {
        impactoFeito = true;
        for (let i = 0; i < 26; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = 0.8 + Math.random() * 2;
          particula({ x: pt.peito.x, y: pt.peito.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ay: 0.04, cor: i % 3 ? P.escudo[1] : "#ffffff", tam: i % 4 ? 1 : 2, decai: 0.03 });
        }
      }
      if (p > 0.5 && p < 0.62) estrelaPx(b, pt.peito.x, pt.peito.y, r(4 + (p - 0.5) * 60), P.escudo[2]);
      if (p > 0.5) {
        // dano subindo
        const sobe = r((p - 0.5) * 36);
        if (p < 0.92 || Math.floor(agora / 60) % 2) textoPx(b, `-${DANO_POR_ACERTO}`, pt.peito.x - 11, pt.peito.y - 22 - sobe, "#ffffff", P.flashVermelho, 2);
      }
    }

    // SOPRO DE LOOP INFINITO: feixe da boca até o herói
    if (st === "attacking") {
      const p = decorrido / DURACOES.attacking;
      const alvo = { x: HEROI.x + 10, y: HEROI.y - 30 };
      if (p > 0.15 && p < 0.8) {
        const alcance = limitar((p - 0.15) / 0.1);
        const xFim = r(pt.boca.x - (pt.boca.x - alvo.x) * alcance);
        for (let x = pt.boca.x; x >= xFim; x--) {
          const f = (pt.boca.x - x) / (pt.boca.x - alvo.x);
          const yc = r(pt.boca.y + (alvo.y - pt.boca.y) * f + Math.sin(x * 0.35 - agora / 30) * 1.5);
          const esp = 4 + r(Math.sin(x * 0.5 + agora / 25) * 1.2) + (hash(x, Math.floor(agora / 50)) % 2);
          retPx(b, x, yc - esp - 1, 1, esp * 2 + 3, P.sopro[0]);
          retPx(b, x, yc - esp, 1, esp * 2 + 1, P.sopro[1]);
          retPx(b, x, yc - 2, 1, 5, P.sopro[2]);
          if (x % 2 === 0) retPx(b, x, yc, 1, 1, P.sopro[3]);
        }
        // símbolos de código voando dentro do feixe
        const simbolos = ["{", "}", ";", "(", ")", "="];
        for (let i = 0; i < 6; i++) {
          const f = (agora / 450 + i / 6) % 1;
          if (f > alcance) continue;
          const x = pt.boca.x + (alvo.x - pt.boca.x) * f;
          const y = pt.boca.y + (alvo.y - pt.boca.y) * f - 2 + ((i % 2) * 2 - 1) * 2;
          textoPx(b, simbolos[i], x, y - 2, "#ffffff");
        }
        if (alcance >= 1) {
          estrelaPx(b, alvo.x, alvo.y, 5 + (Math.floor(agora / 60) % 3), P.sopro[2]);
          if (Math.random() < 0.8) particula({ x: alvo.x, y: alvo.y, vx: -Math.random() * 2, vy: (Math.random() - 0.5) * 2.5, ay: 0.05, cor: Math.random() < 0.5 ? P.sopro[2] : "#ffffff", decai: 0.04 });
        }
      }
      // escudo estilhaçando no começo do impacto
      if (p > 0.24 && !escudoQuebrou) {
        escudoQuebrou = true;
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          particula({ x: HEROI.x + Math.cos(a) * 24, y: HEROI.y - 28 + Math.sin(a) * 32, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, ay: 0.06, cor: i % 2 ? P.escudo[1] : P.escudo[2], tam: 2, decai: 0.025 });
        }
      }
    }

    // fúria: rugido com anéis de choque saindo da boca
    if (st === "furia") {
      const p = decorrido / DURACOES.furia;
      if (p > 0.12 && p < 0.75) {
        for (let i = 0; i < 3; i++) {
          const raio = ((agora / 5 + i * 26) % 78) + 4;
          const cor = raio < 30 ? "#ffffff" : raio < 55 ? P.aura[0] : P.aura[1];
          anelPx(b, pt.boca.x, pt.boca.y, raio, raio * 0.75, cor);
        }
      }
    }

    // vitória: clarão e faíscas enquanto o dragão se desfaz
    if (st === "victory") {
      if (decorrido < 900) {
        const centro = { x: DRAGAO.x + 80, y: DRAGAO.y + 60 };
        for (let i = 0; i < 2; i++) {
          const raio = decorrido / 7 - i * 30;
          if (raio > 2) anelPx(b, centro.x, centro.y, raio, raio * 0.7, i ? P.aura[0] : "#ffffff", 2);
        }
      }
      if (decorrido < 1800 && Math.random() < 0.8) {
        particula({ x: DRAGAO.x + 20 + Math.random() * 130, y: DRAGAO.y + 10 + Math.random() * 90, vy: -0.6 - Math.random(), vx: (Math.random() - 0.5) * 0.6, cor: Math.random() < 0.5 ? P.aura[0] : P.ouro, decai: 0.015 });
      }
    }

    // 3. herói e escudo
    desenharHeroi(t, heroi);
    desenharEscudo(t, forcaEscudo);

    // 4. vinheta vermelha do sopro e clarão da fúria, em faixas de dithering
    if (st === "attacking") {
      const p = decorrido / DURACOES.attacking;
      const forca = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
      for (let k = 0; k < 4; k++) {
        const w = 4 + k * 7;
        const estilo = padrao(b, P.flashVermelho, (4 - k) * 2 * forca);
        retPx(b, -margem, 0, w, ALTURA, estilo);
        retPx(b, LARGURA + margem - w, 0, w, ALTURA, estilo);
        retPx(b, -margem, 0, total, r(w * 0.7), estilo);
        retPx(b, -margem, ALTURA - r(w * 0.7), total, r(w * 0.7), estilo);
      }
    }
    if (st === "furia") {
      const p = decorrido / DURACOES.furia;
      const marcos = [[0, 0], [0.15, 4], [0.3, 1], [0.45, 3], [1, 0]];
      let nivel = 0;
      for (let i = 1; i < marcos.length; i++) {
        const [p0, n0] = marcos[i - 1], [p1, n1] = marcos[i];
        if (p <= p1) { nivel = n0 + (n1 - n0) * ((p - p0) / (p1 - p0)); break; }
      }
      if (nivel >= 1) retPx(b, -margem, 0, total, ALTURA, padrao(b, P.sopro[1], nivel));
    }

    // 5. partículas (somem piscando)
    for (let i = particulas.length - 1; i >= 0; i--) {
      const q = particulas[i];
      if (q.alvo) {
        q.x += (q.alvo.x - q.x) * 0.14;
        q.y += (q.alvo.y - q.y) * 0.14;
      } else {
        q.vx += q.ax;
        q.vy += q.ay;
        q.x += q.vx;
        q.y += q.vy;
      }
      q.vida -= q.decai;
      if (q.vida <= 0) {
        particulas.splice(i, 1);
        continue;
      }
      if (q.vida < 0.35 && (i + quadro) % 2) continue;
      retPx(b, q.x, q.y, q.tam, q.tam, q.cor);
    }

    // buffer -> tela ("sharp bilinear", como nos emuladores): amplia por um
    // fator INTEIRO sem suavização (pixels perfeitos) e só o resto até o
    // tamanho final é interpolado. Ampliar direto por 3,66x deixaria pixels de
    // 3 e de 4 de largura misturados, e o dithering viraria listras. O tremor
    // anda em pixels inteiros do buffer.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = P.noite;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const exata = Math.min(canvas.width / total, canvas.height / ALTURA);
    const k = Math.max(1, Math.floor(exata));
    const largura = Math.round(total * exata);
    const altura = Math.round(ALTURA * exata);
    const tx = Math.round((canvas.width - largura) / 2 + r((Math.random() - 0.5) * tremor) * exata);
    const ty = Math.round((canvas.height - altura) / 2 + r((Math.random() - 0.5) * tremor) * exata);
    if (exata - k < 0.02) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buffer, tx, ty, total * k, ALTURA * k);
    } else {
      if (k !== fatorAmpliado) {
        [ampliado, gAmpliado] = novoCanvas(total * k, ALTURA * k);
        fatorAmpliado = k;
      }
      gAmpliado.drawImage(buffer, 0, 0, total * k, ALTURA * k);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "low";
      ctx.drawImage(ampliado, tx, ty, largura, altura);
    }
    tremor = tremor > 0.3 ? tremor * 0.86 : 0;
  }

  // No máximo ~60 quadros por segundo: em telas de 90/120 Hz o rAF vem até
  // 2x mais vezes — o dobro de trabalho, e as partículas (que andam um passo
  // por quadro) ficavam com o dobro da velocidade planejada.
  const INTERVALO_MIN_MS = 1000 / 60 - 2;
  let ultimoQuadro = -Infinity;
  function laco(agora) {
    idQuadro = requestAnimationFrame(laco);
    if (agora - ultimoQuadro < INTERVALO_MIN_MS) return;
    ultimoQuadro = agora;
    quadro++;
    desenhar(agora);
  }

  const observador = new ResizeObserver(ajustarTamanho);
  observador.observe(canvas);
  ajustarTamanho();
  let idQuadro = requestAnimationFrame(laco);

  return {
    // novo estado da batalha: { estado, fase, escudo, inicioCarga, prazoMs }
    atualizar(novo) {
      if (novo.estado !== estado.estado) inicioEstado = performance.now();
      estado = { ...estado, ...novo };
    },
    destruir() {
      cancelAnimationFrame(idQuadro);
      observador.disconnect();
    },
  };
}
