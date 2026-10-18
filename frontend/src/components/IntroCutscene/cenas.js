// Cenas da cutscene: uma função de desenho por cena + o cenário fixo (mesa,
// vela, livro). Tudo é desenhado por código com as primitivas de pixel.js —
// nenhuma imagem externa.
//
// As 4 ilustrações das páginas (cenaReino, cenaInvasao, cenaDragao,
// cenaAnciao) desenham em coordenadas LOCAIS da área ilustrada do livro
// (ILU: 224x108); quem posiciona, recorta e vira as páginas é a timeline.
// Todas recebem `t` = milissegundos desde o começo da cena (sempre >= 0).
import { P } from "./paleta";
import {
  brilho, degraus, dither, elipse, linha, poligono, poligonoContorno, px, quadro, ret, ruido,
  sprite, vaiVolta,
} from "./pixel";
import {
  ANCIAO, BUG, CAMPONES, CAMPONES_FUGINDO, CHAMA, CHAMA_VELA, GOBLIN, HEROI, PASSARO, textoMini,
} from "./sprites";

export const LARGURA = 320;
export const ALTURA = 180;

// Livro aberto: páginas de x 40 a 280, lombada em x 160.
export const LIVRO = { x: 40, y: 12, w: 240, h: 120, lombada: 160 };
// Área ilustrada (dentro das duas páginas, atravessando a lombada).
export const ILU = { x: 48, y: 18, w: 224, h: 108 };

// ===========================================================================
// CENÁRIO FIXO: mesa de madeira, vela, tinteiro e poeira mágica
// ===========================================================================

export function mesa(ctx) {
  ret(ctx, 0, 0, LARGURA, ALTURA, "9");
  // tábuas horizontais com emendas desencontradas
  for (let linhaT = 0, y = 0; y < ALTURA; linhaT++, y += 15) {
    ret(ctx, 0, y, LARGURA, 1, "8");
    ret(ctx, 0, y + 1, LARGURA, 1, "a");
    const emenda = (linhaT * 97 + 40) % LARGURA;
    ret(ctx, emenda, y, 1, 15, "8");
  }
  // veios da madeira (sempre nos mesmos lugares)
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(ruido(i) * LARGURA);
    const y = Math.floor(ruido(i + 500) * ALTURA);
    ret(ctx, x, y, 2 + Math.floor(ruido(i + 900) * 6), 1, "8");
  }
  // vinheta: bordas escurecidas em pontilhado (luz só da vela)
  dither(ctx, 0, 0, LARGURA, 10, "0", 6);
  dither(ctx, 0, 0, LARGURA, 4, "0", 10);
  dither(ctx, 0, ALTURA - 10, LARGURA, 10, "0", 6);
  dither(ctx, 0, 0, 12, ALTURA, "0", 6);
  dither(ctx, LARGURA - 12, 0, 12, ALTURA, "0", 6);
  dither(ctx, LARGURA - 5, 0, 5, ALTURA, "0", 10);
}

// Vela acesa no canto esquerdo da mesa, com o brilho tremulando.
export function vela(ctx, t) {
  const tremor = quadro(t, 90, 3);
  brilho(ctx, 16, 104, 40 + tremor * 2, "i", 4, 4);
  brilho(ctx, 16, 100, 18 + tremor, "j", 4, 3);
  // pratinho
  elipse(ctx, 16, 129, 9, 3, "0");
  elipse(ctx, 16, 128, 8, 2, "e");
  ret(ctx, 9, 127, 14, 1, "f");
  // corpo da vela, com cera escorrida
  ret(ctx, 12, 100, 8, 28, "5");
  ret(ctx, 18, 100, 2, 28, "6");
  ret(ctx, 12, 100, 8, 1, "n");
  ret(ctx, 13, 101, 1, 5, "n");
  ret(ctx, 17, 101, 1, 3, "n");
  // pavio e chama
  px(ctx, 16, 98, "0");
  px(ctx, 16, 99, "0");
  sprite(ctx, CHAMA_VELA[tremor], 15, 94);
}

// Tinteiro e pena no canto direito, pra equilibrar a composição.
export function tinteiro(ctx) {
  ret(ctx, 291, 114, 14, 11, "0");
  ret(ctx, 292, 115, 12, 9, "o");
  ret(ctx, 293, 116, 2, 5, "l");
  ret(ctx, 294, 111, 8, 4, "e");
  ret(ctx, 295, 110, 6, 1, "f");
  linha(ctx, 298, 111, 311, 86, "g");
  poligono(ctx, [[305, 97], [313, 82], [316, 84], [308, 99]], "n");
  linha(ctx, 306, 97, 314, 83, "g");
}

// Poeira mágica subindo devagar e piscando. Depois que o livro abre, só as
// partículas fora das páginas aparecem (pra não "sujar" as ilustrações).
export function poeira(ctx, t, soForaDoLivro) {
  for (let i = 0; i < 40; i++) {
    const vel = 0.004 + ruido(i + 7) * 0.008;
    const x = Math.floor(ruido(i) * LARGURA + Math.sin(t / 900 + i) * 4);
    const y = Math.floor((((ruido(i + 99) * ALTURA - t * vel) % ALTURA) + ALTURA) % ALTURA);
    if (soForaDoLivro && x > 34 && x < 286 && y > 6 && y < 138) continue;
    if ((Math.floor(t / 220) + i) % 4 === 0) continue; // pisca
    const cor = ["j", "4", "n", "j"][i % 4];
    px(ctx, x, y, cor);
    if (i % 5 === 0) {
      // algumas viram "estrelinha" em cruz
      px(ctx, x - 1, y, cor);
      px(ctx, x + 1, y, cor);
      px(ctx, x, y - 1, cor);
      px(ctx, x, y + 1, cor);
    }
  }
}

// ===========================================================================
// LIVRO: fechado, abrindo, aberto e página virando
// ===========================================================================

// Livro fechado, centralizado, com capa de couro e gema mágica pulsando.
export function livroFechado(ctx, t) {
  const x = 100;
  const y = LIVRO.y;
  brilho(ctx, 160, 72, 76, "4", 2 + quadro(t, 300, 2), 3);
  // folhas aparecendo na lateral e embaixo (espessura do livro)
  ret(ctx, x + 2, y + 2, 122, 122, "0");
  ret(ctx, x + 3, y + 3, 120, 120, "6");
  for (let i = 0; i < 4; i++) ret(ctx, x + 120, y + 6 + i * 30, 3, 1, "7");
  ret(ctx, x + 3, y + 121, 120, 1, "7");
  capa(ctx, x, y, 120, t);
}

function capa(ctx, x, y, largura, t) {
  ret(ctx, x - 1, y - 1, largura + 2, 122, "0");
  ret(ctx, x, y, largura, 120, "8");
  if (largura < 12) return;
  // moldura gravada e cantoneiras de ouro
  ret(ctx, x + 5, y + 5, largura - 10, 1, "a");
  ret(ctx, x + 5, y + 114, largura - 10, 1, "a");
  ret(ctx, x + 5, y + 5, 1, 110, "a");
  ret(ctx, x + largura - 6, y + 5, 1, 110, "a");
  for (const [cx, cy] of [[x + 1, y + 1], [x + largura - 7, y + 1], [x + 1, y + 113], [x + largura - 7, y + 113]]) {
    ret(ctx, cx, cy, 6, 6, "j");
    ret(ctx, cx + 2, cy + 2, 2, 2, "i");
  }
  if (largura < 60) return;
  // gema roxa no centro, com brilho que pisca
  const gx = x + Math.floor(largura / 2);
  const gy = y + 46;
  poligonoContorno(ctx, [[gx, gy - 12], [gx + 10, gy], [gx, gy + 12], [gx - 10, gy]], "3", "j");
  poligono(ctx, [[gx, gy - 8], [gx + 5, gy], [gx, gy + 2], [gx - 5, gy]], "4");
  if (quadro(t, 260, 3) === 0) {
    px(ctx, gx - 3, gy - 4, "n");
    px(ctx, gx - 2, gy - 5, "n");
  }
  // "JS" gravado em ouro
  textoMini(ctx, "JS", gx - 10, y + 70, "j", P, 3);
}

// Livro abrindo: a lombada desliza do centro do livro fechado (x 100) até o
// centro da mesa (x 160) enquanto a capa gira. `p` vem em degraus (0..1).
export function livroAbrindo(ctx, p, t) {
  const lombada = Math.round(100 + 60 * p);
  // páginas da direita (ainda em branco)
  couro(ctx, lombada - 3, lombada + 123);
  paginaEmBranco(ctx, lombada, 120);
  if (p < 0.5) {
    // capa levantando por cima da página direita (fica mais estreita)
    const largura = Math.round(120 * (1 - 2 * p));
    const ergue = Math.round(6 * Math.sin(Math.PI * p));
    if (largura > 0) {
      ret(ctx, lombada, LIVRO.y - ergue, largura, 120 + ergue, "0");
      capa(ctx, lombada, LIVRO.y - ergue, Math.max(1, largura - 1), t);
    }
  } else {
    // a capa já passou: aparece o verso dela, que vira a página esquerda
    const largura = Math.round(120 * (2 * p - 1));
    couro(ctx, lombada - largura - 3, lombada + 3);
    paginaEmBranco(ctx, lombada - largura, largura);
  }
}

function couro(ctx, xIni, xFim) {
  ret(ctx, xIni - 1, LIVRO.y - 4, xFim - xIni + 2, LIVRO.h + 9, "0");
  ret(ctx, xIni, LIVRO.y - 3, xFim - xIni, LIVRO.h + 7, "8");
}

function paginaEmBranco(ctx, x, largura) {
  if (largura <= 0) return;
  ret(ctx, x, LIVRO.y, largura, LIVRO.h, "5");
  // espessura das folhas embaixo
  ret(ctx, x, LIVRO.y + LIVRO.h, largura, 1, "7");
  ret(ctx, x, LIVRO.y + LIVRO.h + 1, largura, 1, "6");
  ret(ctx, x, LIVRO.y + LIVRO.h + 2, largura, 1, "7");
}

// Livro aberto. `esquerda`/`direita` = funções que desenham a ilustração de
// cada metade (normalmente a mesma cena; diferentes durante a virada).
export function livroAberto(ctx, esquerda, direita) {
  couro(ctx, LIVRO.x - 3, LIVRO.x + LIVRO.w + 3);
  paginaEmBranco(ctx, LIVRO.x, LIVRO.w);
  // sombra das páginas perto da lombada e nas bordas externas
  dither(ctx, LIVRO.lombada - 12, LIVRO.y, 24, LIVRO.h, "6", 6);
  dither(ctx, LIVRO.x, LIVRO.y, 4, LIVRO.h, "6", 8);
  dither(ctx, LIVRO.x + LIVRO.w - 4, LIVRO.y, 4, LIVRO.h, "6", 8);
  // moldura da ilustração
  ret(ctx, ILU.x - 2, ILU.y - 2, ILU.w + 4, ILU.h + 4, "7");
  ret(ctx, ILU.x - 1, ILU.y - 1, ILU.w + 2, ILU.h + 2, "6");

  ilustracao(ctx, esquerda, ILU.x, LIVRO.lombada - ILU.x);
  ilustracao(ctx, direita, LIVRO.lombada, ILU.x + ILU.w - LIVRO.lombada);

  // dobra da lombada por cima da ilustração (parece impressa no livro)
  dither(ctx, LIVRO.lombada - 5, LIVRO.y, 4, LIVRO.h, "7", 5);
  dither(ctx, LIVRO.lombada + 1, LIVRO.y, 4, LIVRO.h, "7", 5);
  ret(ctx, LIVRO.lombada - 1, LIVRO.y, 2, LIVRO.h, "7");
}

// Desenha uma cena só dentro da faixa [x, x+largura) da área ilustrada.
function ilustracao(ctx, desenhar, x, largura) {
  if (!desenhar) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, ILU.y, largura, ILU.h);
  ctx.clip();
  ctx.translate(ILU.x, ILU.y);
  desenhar(ctx);
  ctx.restore();
}

// Folha virando da direita pra esquerda. p (0..1, em degraus): na primeira
// metade a folha se ergue sobre a página direita (revelando a cena nova por
// baixo); na segunda, o verso dela desce sobre a página esquerda.
export function folhaVirando(ctx, p) {
  const { y, h, lombada } = LIVRO;
  const ergue = Math.round(7 * Math.sin(Math.PI * p));
  if (p < 0.5) {
    const borda = Math.round(lombada + 120 * (1 - 2 * p));
    dither(ctx, borda, y, 6, h, "0", 5); // sombra projetada na página nova
    poligonoContorno(ctx, [[lombada, y], [borda, y - ergue], [borda, y + h - ergue], [lombada, y + h]], "5", "7");
    poligono(ctx, [[borda - 4, y - ergue], [borda, y - ergue], [borda, y + h - ergue], [borda - 4, y + h - ergue]], "6");
  } else {
    const borda = Math.round(lombada - 120 * (2 * p - 1));
    dither(ctx, borda - 6, y, 6, h, "0", 5);
    poligonoContorno(ctx, [[borda, y - ergue], [lombada, y], [lombada, y + h], [borda, y + h - ergue]], "6", "7");
    poligono(ctx, [[borda, y - ergue], [borda + 4, y - ergue], [borda + 4, y + h - ergue], [borda, y + h - ergue]], "7");
  }
}

// "Tinta aparecendo": cobre a área ilustrada com pergaminho pontilhado, do
// cheio (nivel 16) ao nada (0).
export function cobrirComPergaminho(ctx, nivel) {
  dither(ctx, ILU.x, ILU.y, ILU.w, ILU.h, "5", nivel);
}

// ===========================================================================
// PEÇAS DE CENÁRIO das ilustrações
// ===========================================================================

function faixas(ctx, lista) {
  // lista: [[cor, yInicio], ...] — com transição pontilhada entre faixas
  lista.forEach(([cor, y0], i) => {
    const y1 = lista[i + 1]?.[1] ?? ILU.h;
    ret(ctx, 0, y0, ILU.w, y1 - y0, cor);
    if (i > 0) {
      dither(ctx, 0, y0, ILU.w, 2, lista[i - 1][0], 8);
      dither(ctx, 0, y0 + 2, ILU.w, 2, lista[i - 1][0], 3);
    }
  });
}

function sol(ctx, cx, cy, t) {
  if (quadro(t, 260, 2) === 0) {
    for (const [dx, dy] of [[0, -11], [0, 9], [-11, 0], [9, 0]]) ret(ctx, cx + dx, cy + dy, 2, 2, "j");
  } else {
    for (const [dx, dy] of [[-8, -8], [7, -8], [-8, 7], [7, 7]]) ret(ctx, cx + dx, cy + dy, 2, 2, "j");
  }
  elipse(ctx, cx, cy, 6, 6, "j");
  elipse(ctx, cx - 1, cy - 1, 3, 3, "n");
}

function nuvem(ctx, x, y, cor = "n", sombra = "l") {
  elipse(ctx, x, y, 7, 3, cor);
  elipse(ctx, x + 6, y - 2, 5, 3, cor);
  elipse(ctx, x + 12, y, 6, 3, cor);
  ret(ctx, x - 5, y + 3, 22, 1, sombra);
}

function arvore(ctx, x, y) {
  ret(ctx, x + 3, y + 8, 2, 6, "8");
  elipse(ctx, x + 4, y + 5, 5, 5, "b");
  elipse(ctx, x + 3, y + 3, 4, 3, "c");
  px(ctx, x + 2, y + 2, "d");
  px(ctx, x + 4, y + 1, "d");
}

function ameias(ctx, x, y, largura, cor) {
  for (let i = 0; i < largura; i += 5) ret(ctx, x + i, y, 3, 2, cor);
}

function bandeira(ctx, x, y, t, cor) {
  ret(ctx, x, y - 7, 1, 8, "e");
  if (quadro(t, 220, 2) === 0) {
    ret(ctx, x + 1, y - 7, 5, 3, cor);
  } else {
    ret(ctx, x + 1, y - 7, 2, 3, cor);
    ret(ctx, x + 3, y - 6, 3, 3, cor);
  }
}

// Castelo (56x51, do topo das bandeiras até a base em y+44).
function castelo(ctx, x, y, t, c = {}) {
  const pedra = c.pedra ?? "f";
  const escura = c.escura ?? "e";
  const clara = c.clara ?? "g";
  const janela = c.janela ?? "0";
  const telhado = c.telhado ?? "o";
  const corBandeira = c.bandeira ?? "h";

  // muralha
  ret(ctx, x + 8, y + 22, 40, 22, pedra);
  ret(ctx, x + 8, y + 22, 40, 1, clara);
  ameias(ctx, x + 8, y + 20, 40, pedra);
  // torre central
  ret(ctx, x + 18, y + 6, 20, 38, pedra);
  ret(ctx, x + 36, y + 6, 2, 38, escura);
  ret(ctx, x + 18, y + 6, 1, 38, clara);
  ameias(ctx, x + 18, y + 4, 20, pedra);
  ret(ctx, x + 22, y + 14, 3, 4, janela);
  ret(ctx, x + 31, y + 14, 3, 4, janela);
  bandeira(ctx, x + 28, y + 4, t + 150, corBandeira);
  // torres laterais com telhado cônico
  for (const tx of [x, x + 44]) {
    ret(ctx, tx, y + 14, 12, 30, pedra);
    ret(ctx, tx + 10, y + 14, 2, 30, escura);
    ret(ctx, tx, y + 14, 1, 30, clara);
    ret(ctx, tx + 5, y + 22, 2, 4, janela);
    poligonoContorno(ctx, [[tx - 1, y + 14], [tx + 6, y + 2], [tx + 13, y + 14]], telhado, "0");
    bandeira(ctx, tx + 6, y + 2, t + tx * 7, corBandeira);
  }
  // portão com grade
  ret(ctx, x + 24, y + 32, 8, 12, "8");
  ret(ctx, x + 25, y + 31, 6, 1, "8");
  for (let g = 0; g < 4; g++) ret(ctx, x + 25 + g * 2, y + 32, 1, 12, "0");
  // tijolos
  for (let i = 0; i < 18; i++) {
    px(ctx, x + 8 + Math.floor(ruido(i + x) * 40), y + 24 + Math.floor(ruido(i + 50 + x) * 18), escura);
  }
}

// Casa da vila. Queimando: telhado carbonizado, chamas animadas e fumaça.
function casa(ctx, x, y, w, h, { telhado = "h", queimando = false, t = 0, semente = 0 } = {}) {
  const topo = y - Math.round(h * 0.7);
  const meio = x + Math.floor(w / 2);
  if (queimando) {
    for (let k = 0; k < 4; k++) {
      const fase = (t * 0.012 + k * 10 + semente * 13) % 40;
      const r = 1 + Math.floor(fase / 14);
      elipse(ctx, meio + Math.sin((fase + semente) / 5) * 3, topo - fase, r, r, k % 2 ? "e" : "f");
    }
  }
  ret(ctx, x, y, w, h, "5");
  ret(ctx, x, y, 1, h, "9");
  ret(ctx, x + w - 1, y, 1, h, "9");
  ret(ctx, x, y + Math.floor(h / 2), w, 1, "9");
  ret(ctx, x, y + h - 1, w, 1, "8");
  ret(ctx, meio - 2, y + h - 7, 4, 7, "8");
  ret(ctx, x + 3, y + 3, 3, 3, queimando ? "i" : "0");
  poligonoContorno(ctx, [[x - 2, y], [x + w / 2, topo], [x + w + 2, y]], queimando ? "8" : telhado, "0");
  if (queimando) {
    px(ctx, meio - 3, y - 3, "0");
    px(ctx, meio + 2, y - 5, "h");
    sprite(ctx, CHAMA[quadro(t + semente * 70, 110, 3)], x + 1, y - 7);
    sprite(ctx, CHAMA[quadro(t + semente * 70 + 55, 110, 3)], x + w - 6, y - 8);
    sprite(ctx, CHAMA[quadro(t + semente * 40 + 30, 110, 3)], meio - 2, topo - 3);
  }
}

// Vila (as mesmas casas aparecem em paz e em chamas).
const CASAS = [
  { x: 12, y: 60, w: 20, h: 14, telhado: "h" },
  { x: 40, y: 62, w: 18, h: 12, telhado: "a" },
  { x: 68, y: 59, w: 22, h: 15, telhado: "h" },
  { x: 100, y: 62, w: 16, h: 12, telhado: "9" },
];

function vila(ctx, t, queimando) {
  CASAS.forEach((c, i) => casa(ctx, c.x, c.y, c.w, c.h, { telhado: c.telhado, queimando, t, semente: i + 1 }));
}

function chao(ctx, cor, borda, caminho, bordaCaminho) {
  ret(ctx, 0, 74, ILU.w, 34, cor);
  ret(ctx, 0, 74, ILU.w, 1, borda);
  dither(ctx, 0, 75, ILU.w, 3, borda, 6);
  ret(ctx, 0, 86, ILU.w, 7, caminho);
  ret(ctx, 0, 86, ILU.w, 1, bordaCaminho);
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(ruido(i + 300) * ILU.w);
    const y = 95 + Math.floor(ruido(i + 340) * 12);
    px(ctx, x, y, borda);
    px(ctx, x + 1, y - 1, borda);
  }
}

// Criatura de bug com efeito GLITCH: linhas do sprite deslocadas, cores
// trocadas e blocos piscando em volta. Tudo sorteado a partir do tempo
// (sempre igual pra um mesmo t).
function bugGlitch(ctx, x, y, t, semente) {
  const g = Math.floor(t / 70);
  const mapa = BUG[quadro(t + semente * 40, 140, 2)];
  const trocada = ruido(g * 3 + semente) < 0.3 ? { 3: "d", 4: "k", 0: "n" } : null;
  mapa.forEach((linhaSprite, r) => {
    const sorte = ruido(g * 7 + r + semente * 13);
    const dx = sorte < 0.12 ? -2 : sorte < 0.25 ? 2 : 0;
    sprite(ctx, [linhaSprite], x + dx, y + r, { troca: trocada });
  });
  const cores = ["3", "d", "k", "n"];
  for (let b = 0; b < 4; b++) {
    if (ruido(g * 11 + b + semente * 5) < 0.45) {
      const bx = x - 4 + Math.floor(ruido(g * 13 + b + semente) * 16);
      const by = y - 4 + Math.floor(ruido(g * 17 + b + semente) * 12);
      ret(ctx, bx, by, 2, 2, cores[b]);
    }
  }
}

// Fatia horizontal da ilustração "pulando" pro lado — o glitch que afeta a
// página inteira. Copia pixels do próprio canvas (respeitando o recorte).
function fatiaGlitch(ctx, t, semente) {
  const g = Math.floor(t / 90);
  if (ruido(g + semente) > 0.3) return;
  const m = ctx.getTransform();
  const y = Math.floor(ruido(g * 5 + semente) * (ILU.h - 8));
  const altura = 2 + Math.floor(ruido(g * 9 + semente) * 6);
  const dx = ruido(g * 3 + semente) < 0.5 ? -3 : 3;
  const sx = Math.round(m.e);
  const sy = Math.round(m.f + y);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(ctx.canvas, sx, sy, ILU.w, altura, sx + dx, sy, ILU.w, altura);
  ctx.restore();
}

// Dragão Roxo voando (virado pra esquerda), ~66x50 px. `asa` = 0 (cima),
// 1 (meio), 2 (baixo).
export function dragao(ctx, x, y, asa, t, bocaAberta = false) {
  const ASAS = [
    [[-4, -4], [-10, -28], [0, -22], [10, -30], [16, -14], [8, -3]],
    [[-4, -4], [-8, -18], [6, -15], [20, -19], [24, -7], [8, -2]],
    [[-4, -3], [-6, 10], [6, 6], [18, 13], [20, 1], [8, -2]],
  ];
  const pontas = ASAS[asa].map(([dx, dy]) => [x + dx, y + dy]);

  poligonoContorno(ctx, pontas.map(([a, b]) => [a + 5, b - 2]), "1", "0"); // asa de trás
  poligonoContorno(ctx, [[x + 10, y - 2], [x + 26, y + 1], [x + 34, y - 5], [x + 30, y + 5], [x + 11, y + 5]], "2", "0");
  poligonoContorno(ctx, [[x + 33, y - 5], [x + 39, y - 9], [x + 38, y - 2]], "3", "0");
  ret(ctx, x - 7, y + 4, 3, 5, "1");
  ret(ctx, x + 5, y + 4, 3, 5, "1");
  for (const cx of [x - 8, x - 6, x + 4, x + 6]) px(ctx, cx, y + 9, "g");
  elipse(ctx, x, y, 14, 7, "0");
  elipse(ctx, x, y, 13, 6, "2");
  elipse(ctx, x - 1, y + 2, 9, 3, "3");
  for (let i = 0; i < 5; i++) ret(ctx, x - 8 + i * 4, y - 8, 2, 2, "4");
  poligonoContorno(ctx, [[x - 9, y - 3], [x - 17, y - 11], [x - 13, y - 14], [x - 5, y - 6]], "2", "0");
  poligonoContorno(ctx, [[x - 14, y - 15], [x - 25, y - 13], [x - 27, y - 10], [x - 18, y - 8], [x - 13, y - 11]], "2", "0");
  if (bocaAberta) {
    poligonoContorno(ctx, [[x - 26, y - 8], [x - 17, y - 8], [x - 24, y - 4]], "2", "0");
    poligono(ctx, [[x - 26, y - 10], [x - 18, y - 9], [x - 25, y - 7]], "h");
  }
  poligonoContorno(ctx, [[x - 15, y - 15], [x - 11, y - 21], [x - 13, y - 14]], "g", "0");
  poligonoContorno(ctx, [[x - 18, y - 15], [x - 16, y - 20], [x - 16, y - 15]], "g", "0");
  ret(ctx, x - 21, y - 13, 2, 2, quadro(t, 150, 2) ? "n" : "j"); // olho brilhando
  px(ctx, x - 26, y - 11, "0");
  poligonoContorno(ctx, pontas, "2", "0"); // asa da frente
  linha(ctx, x - 2, y - 4, pontas[1][0], pontas[1][1], "4");
  linha(ctx, x - 2, y - 4, pontas[3][0], pontas[3][1], "4");
}

// Pergaminho com código JavaScript, centralizado em (cx, cy).
function pergaminho(ctx, cx, cy, t) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  ret(ctx, cx - 45, cy - 9, 90, 18, "0");
  ret(ctx, cx - 44, cy - 8, 88, 16, "5");
  ret(ctx, cx - 44, cy + 6, 88, 2, "6");
  for (const rx of [cx - 48, cx + 45]) {
    ret(ctx, rx, cy - 11, 3, 22, "9");
    ret(ctx, rx, cy - 11, 1, 22, "a");
    ret(ctx, rx - 1, cy - 12, 5, 2, "j");
    ret(ctx, rx - 1, cy + 10, 5, 2, "j");
  }
  // "function atacar() {}" com realce de sintaxe e um brilho percorrendo
  const codigo = "function atacar() {}";
  const brilhoLetra = Math.floor(t / 70) % (codigo.length + 8);
  textoMini(ctx, codigo, cx - 40, cy - 3, (i) => {
    if (i === brilhoLetra || i === brilhoLetra - 1) return "j";
    if (i < 8) return "3"; // palavra-chave
    if (i < 15) return "h"; // nome da função
    return i >= 18 ? "o" : "0";
  }, P);
}

function faisca(ctx, x, y, t, i) {
  const f = quadro(t + i * 90, 160, 3);
  const cor = i % 2 ? "j" : "n";
  px(ctx, x, y, cor);
  if (f > 0) {
    px(ctx, x - 1, y, cor);
    px(ctx, x + 1, y, cor);
    px(ctx, x, y - 1, cor);
    px(ctx, x, y + 1, cor);
  }
  if (f === 2) {
    px(ctx, x - 2, y, "4");
    px(ctx, x + 2, y, "4");
  }
}

// ===========================================================================
// AS 4 PÁGINAS ILUSTRADAS
// ===========================================================================

// Página 1 — o reino em paz.
export function cenaReino(ctx, t) {
  faixas(ctx, [["k", 0], ["l", 36]]);
  sol(ctx, 26, 18, t);
  for (let i = 0; i < 3; i++) nuvem(ctx, ((i * 90 + t * 0.006) % 270) - 30, 10 + i * 8);
  elipse(ctx, 40, 78, 70, 16, "c");
  elipse(ctx, 180, 80, 80, 18, "c");
  chao(ctx, "c", "d", "6", "7");
  castelo(ctx, 156, 30, t);
  vila(ctx, t, false);
  arvore(ctx, 122, 63);
  arvore(ctx, 2, 66);
  arvore(ctx, 210, 70);
  // camponeses passeando (vão e voltam pelo caminho)
  [
    { base: 10, vel: 0.018, roupa: "o" },
    { base: 90, vel: 0.014, roupa: "h" },
    { base: 160, vel: 0.02, roupa: "9" },
  ].forEach(({ base, vel, roupa }, i) => {
    const pos = vaiVolta(base + t * vel, 200);
    const indo = vaiVolta(base + (t + 16) * vel, 200) > pos;
    sprite(ctx, CAMPONES[quadro(t + i * 70, 200, 2)], 6 + pos, 79 + (i % 2) * 2, { espelhar: !indo, troca: { o: roupa } });
  });
  for (let i = 0; i < 2; i++) {
    const bx = ((t * 0.03 + i * 70) % 260) - 20;
    sprite(ctx, PASSARO[quadro(t + i * 100, 180, 2)], bx, 22 + i * 7 + Math.round(Math.sin(t / 300 + i) * 2));
  }
}

// Página 2 — goblins e criaturas de bug invadem a vila em chamas.
export function cenaInvasao(ctx, t) {
  faixas(ctx, [["1", 0], ["h", 22], ["i", 46]]);
  castelo(ctx, 156, 30, t, { pedra: "e", escura: "1", clara: "f", janela: "i", telhado: "1", bandeira: "8" });
  chao(ctx, "b", "c", "7", "8");
  vila(ctx, t, true);
  // humanos fugindo pra direita
  for (let k = 0; k < 3; k++) {
    sprite(ctx, CAMPONES_FUGINDO[quadro(t + k * 50, 100, 2)], 104 + k * 16 + t * 0.05, 79 + (k % 2) * 3, {
      troca: { o: ["o", "h", "9"][k] },
    });
  }
  // gangue de goblins chegando pela esquerda, com tochas
  for (let k = 0; k < 4; k++) {
    const gx = -16 + t * 0.035 + k * 15;
    const gy = 78 + (k % 2) * 4;
    sprite(ctx, GOBLIN[quadro(t + k * 90, 160, 2)], gx, gy);
    if (k % 2 === 0) {
      ret(ctx, gx + 7, gy - 1, 1, 5, "8");
      px(ctx, gx + 7, gy - 2 - quadro(t + k * 30, 90, 2), quadro(t, 90, 2) ? "j" : "i");
      px(ctx, gx + 7, gy - 1, "h");
    }
  }
  // criaturas de bug (com glitch) pulando pela vila
  [[60, 70], [96, 84], [132, 76]].forEach(([bx, by], k) => {
    const salto = Math.floor(ruido(Math.floor(t / 450) + k * 31) * 10) - 5;
    bugGlitch(ctx, bx + Math.round(Math.sin(t / 200 + k) * 6) + salto, by, t, k + 1);
  });
  fatiaGlitch(ctx, t, 1);
  fatiaGlitch(ctx, t + 45, 2);
}

// Página 3 — o Dragão Roxo sobrevoa o castelo e controla os inimigos.
export const RUGIDO_INICIO = 500; // ms dentro da cena (= 8,5s na timeline)
export const RUGIDO_FIM = 1700;

const LACAIOS = [
  { x: 14, y: 88, tipo: "goblin" },
  { x: 34, y: 92, tipo: "goblin" },
  { x: 58, y: 90, tipo: "bug" },
  { x: 146, y: 92, tipo: "bug" },
  { x: 170, y: 88, tipo: "goblin" },
  { x: 196, y: 92, tipo: "goblin" },
];

export function cenaDragao(ctx, t) {
  const relampago = (t > 1250 && t < 1310) || (t > 2350 && t < 2400);
  faixas(ctx, relampago ? [["2", 0], ["3", 30]] : [["0", 0], ["1", 14]]);
  if (relampago) {
    linha(ctx, 30, 0, 36, 14, "n");
    linha(ctx, 36, 14, 31, 22, "n");
    linha(ctx, 31, 22, 38, 40, "n");
  }
  for (let i = 0; i < 4; i++) nuvem(ctx, ((i * 70 + t * 0.01) % 290) - 40, 8 + (i % 2) * 10, "2", "1");
  castelo(ctx, 84, 36, t, { pedra: "e", escura: "1", clara: "f", janela: "3", telhado: "2", bandeira: "3" });
  ret(ctx, 0, 80, ILU.w, 28, "b");
  ret(ctx, 0, 80, ILU.w, 1, "c");
  dither(ctx, 0, 81, ILU.w, 27, "0", 8);

  // posição do dragão: atravessa o céu da direita pra esquerda, batendo as asas
  const dx = Math.round(194 - (t / 3000) * 124);
  const dy = 28 + Math.round(Math.sin(t / 260) * 3);
  const asa = [0, 1, 2, 1][quadro(t, 110, 4)];
  const rugindo = t >= RUGIDO_INICIO && t <= RUGIDO_FIM;

  // aura e "fios" de controle ligando o dragão aos lacaios
  brilho(ctx, dx, dy, 44, "2", 4, 2);
  LACAIOS.forEach((l, i) => {
    linha(ctx, dx - 4, dy + 8, l.x + 3, l.y, i % 2 ? "3" : "4", [2, 2], Math.floor(t / 60));
    brilho(ctx, l.x + 3, l.y + 4, 9, "3", 3, 1);
  });
  LACAIOS.forEach((l, i) => {
    if (l.tipo === "goblin") {
      sprite(ctx, GOBLIN[quadro(t + i * 100, 300, 2)], l.x, l.y - 4, { troca: { j: "4" }, espelhar: l.x > 112 });
    } else {
      bugGlitch(ctx, l.x, l.y, t, i + 7);
    }
  });

  dragao(ctx, dx, dy, asa, t, rugindo);
  if (rugindo) {
    // ondas do rugido saindo da boca
    const onda = quadro(t, 120, 3);
    for (let r = 0; r < 3; r++) {
      const raio = 4 + ((onda + r) % 3) * 5;
      linha(ctx, dx - 28 - raio, dy - 12 - raio, dx - 28 - raio, dy - 4 + raio, "4", [1, 1]);
    }
  }
}

// Página 4 — o Ancião entrega ao herói o pergaminho com código JavaScript.
export function cenaAnciao(ctx, t) {
  faixas(ctx, [["1", 0], ["2", 14], ["i", 36], ["j", 54]]);
  for (let i = 0; i < 10; i++) {
    if ((Math.floor(t / 250) + i) % 3 === 0) continue;
    px(ctx, Math.floor(ruido(i + 40) * ILU.w), Math.floor(ruido(i + 80) * 18), "n");
  }
  elipse(ctx, 112, 78, 18, 18, "j");
  elipse(ctx, 112, 78, 12, 12, "n");
  // ao longe, à direita: o castelo dominado, com brilho roxo
  brilho(ctx, 206, 74, 26, "3", 6, 3);
  poligono(ctx, [[192, 76], [196, 64], [200, 64], [200, 58], [204, 52], [208, 58], [208, 64], [214, 64], [218, 76]], "1");
  // colina gramada
  ret(ctx, 0, 84, ILU.w, 24, "c");
  elipse(ctx, 112, 88, 124, 9, "c");
  ret(ctx, 0, 96, ILU.w, 12, "c");
  for (let i = 0; i < 24; i++) px(ctx, Math.floor(ruido(i + 600) * ILU.w), 88 + Math.floor(ruido(i + 650) * 18), "d");
  dither(ctx, 0, 100, ILU.w, 8, "b", 8);

  // ancião à esquerda, herói à direita (sprites ampliados 2x)
  const anciaoX = 30;
  const heroiX = 160;
  brilho(ctx, anciaoX + 19, 62, 12, "4", 6 + quadro(t, 200, 2) * 3, 2);
  sprite(ctx, ANCIAO, anciaoX, 62 - (t > 200 && t < 900 ? 2 : 0), {
    escala: 2,
    troca: quadro(t, 200, 2) ? { 4: "n", n: "n" } : null,
  });
  const recebendo = t > 2100;
  sprite(ctx, HEROI[recebendo ? 1 : 0], heroiX, 68, { escala: 2, espelhar: true });

  // trajetória do pergaminho: sobe do ancião, flutua no centro, desce pro herói
  let sx;
  let sy;
  if (t < 700) {
    const p = degraus(t / 700, 7);
    sx = 52 + (112 - 52) * p;
    sy = 64 + (26 - 64) * p;
  } else if (t < 2100) {
    sx = 112;
    sy = 26 + Math.round(Math.sin(t / 220) * 2);
  } else {
    const p = degraus((t - 2100) / 700, 7);
    sx = 112 + (168 - 112) * p;
    sy = 26 + (52 - 26) * p;
  }
  brilho(ctx, sx, sy, 58, "j", 6, 3);
  pergaminho(ctx, sx, sy, t);
  for (let i = 0; i < 6; i++) {
    const ang = i * 1.05 + t / 300;
    faisca(ctx, Math.round(sx + Math.cos(ang) * 52), Math.round(sy + Math.sin(ang) * 14), t, i);
  }
}
