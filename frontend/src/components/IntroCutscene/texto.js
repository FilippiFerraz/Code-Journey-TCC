// Texto da cutscene: fonte pixelada "Press Start 2P" (servida junto do site
// via @fontsource — sem Google Fonts, como o resto do app) numa caixa de
// diálogo estilo RPG, com efeito de máquina de escrever.
//
// O fillText do canvas sempre suaviza as bordas das letras, o que borraria o
// texto ao ampliar a tela. Por isso cada linha é desenhada UMA vez num canvas
// à parte e "binarizada" (cada pixel vira 100% cor ou 100% transparente) —
// fica nítida como uma fonte bitmap de console.
import { P } from "./paleta";
import { ret } from "./pixel";

export const FONTE = '"Press Start 2P"';
export const CARACTERES_POR_LINHA = 36; // 36 x 8px = 288px de largura

// Espera a fonte carregar (no máximo `limiteMs`) antes de começar a
// cutscene; se demorar, segue com a fonte reserva (monospace).
export function carregarFonte(limiteMs = 1500) {
  if (!document.fonts?.load) return Promise.resolve();
  return Promise.race([
    document.fonts.load(`8px ${FONTE}`, "Há Ancião começa").catch(() => {}),
    new Promise((resolver) => setTimeout(resolver, limiteMs)),
  ]);
}

const cacheLinhas = new Map(); // "tamanho|cor|texto" -> canvas

// Canvas com a linha de texto já binarizada na cor pedida.
export function linhaPixelada(texto, cor, tamanho = 8) {
  const chave = `${tamanho}|${cor}|${texto}`;
  let c = cacheLinhas.get(chave);
  if (c) return c;

  // Desenha 4x maior e lê só o CENTRO de cada bloco 4x4: no tamanho real o
  // antialiasing "colava" as colunas de letras finas (o "m" virava um
  // borrão); ampliado, cada pixel da fonte vira um bloco inteiro e o centro
  // dele diz com certeza se está aceso ou apagado.
  const AMPLIA = 4;
  const grande = document.createElement("canvas");
  const g = grande.getContext("2d");
  const fonte = `${tamanho * AMPLIA}px ${FONTE}, monospace`;
  g.font = fonte;
  const largura = Math.max(1, Math.ceil(g.measureText(texto).width / AMPLIA) + 1);
  const altura = tamanho + 3; // folga pros acentos (Á, ã)
  grande.width = largura * AMPLIA;
  grande.height = altura * AMPLIA;
  g.font = fonte; // mudar o tamanho do canvas apaga a fonte configurada
  g.textBaseline = "top";
  g.fillStyle = "#fff";
  g.fillText(texto, 0, AMPLIA);
  const origem = g.getImageData(0, 0, grande.width, grande.height).data;

  c = document.createElement("canvas");
  c.width = largura;
  c.height = altura;
  const saida = c.getContext("2d");
  const [r, gg, b] = hexParaRgb(P[cor] ?? cor);
  const img = saida.createImageData(largura, altura);
  const d = img.data;
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const meio = ((y * AMPLIA + AMPLIA / 2) * grande.width + x * AMPLIA + AMPLIA / 2) * 4;
      const i = (y * largura + x) * 4;
      d[i] = r;
      d[i + 1] = gg;
      d[i + 2] = b;
      d[i + 3] = origem[meio + 3] >= 128 ? 255 : 0;
    }
  }
  saida.putImageData(img, 0, 0);

  if (cacheLinhas.size > 200) cacheLinhas.clear();
  cacheLinhas.set(chave, c);
  return c;
}

function hexParaRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Quebra a fala em linhas de até CARACTERES_POR_LINHA, sem cortar palavras.
export function quebrarLinhas(texto, limite = CARACTERES_POR_LINHA) {
  const linhas = [];
  let atual = "";
  for (const palavra of texto.split(" ")) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (tentativa.length > limite && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// Texto com sombra de 1px (fica legível sobre qualquer fundo).
export function escrever(ctx, texto, x, y, cor = "n", sombra = "0", tamanho = 8, letras = Infinity) {
  if (!texto) return;
  const linhaC = linhaPixelada(texto, cor, tamanho);
  const largura = Math.min(linhaC.width, Math.round(letras * tamanho));
  if (largura <= 0) return;
  if (sombra) {
    const s = linhaPixelada(texto, sombra, tamanho);
    ctx.drawImage(s, 0, 0, largura, s.height, x + 1, y + 1, largura, s.height);
  }
  ctx.drawImage(linhaC, 0, 0, largura, linhaC.height, x, y, largura, linhaC.height);
}

// Largura em pixels de um texto (a fonte é monoespaçada: 1 letra = tamanho px).
export function larguraTexto(texto, tamanho = 8) {
  return texto.length * tamanho;
}

// ---------------------------------------------------------------------------
// Caixa de diálogo (rodapé da tela): moldura dupla, fundo roxo-noite, e a
// fala aparecendo letra por letra. `letrasVisiveis` vem da timeline.
export const CAIXA = { x: 8, y: 139, w: 304, h: 37 };

export function caixaDialogo(ctx, texto, letrasVisiveis, t) {
  const { x, y, w, h } = CAIXA;
  // moldura: preto, branco, pergaminho sombra, fundo
  ret(ctx, x, y, w, h, "0");
  ret(ctx, x + 1, y + 1, w - 2, h - 2, "n");
  ret(ctx, x + 2, y + 2, w - 4, h - 4, "7");
  ret(ctx, x + 3, y + 3, w - 6, h - 6, "1");
  // cantinhos "rebitados" dourados
  for (const [cx, cy] of [[x + 3, y + 3], [x + w - 5, y + 3], [x + 3, y + h - 5], [x + w - 5, y + h - 5]]) {
    ret(ctx, cx, cy, 2, 2, "j");
  }

  if (!texto) return;
  const linhas = quebrarLinhas(texto);
  let restantes = letrasVisiveis;
  linhas.forEach((linhaTxt, i) => {
    if (restantes <= 0) return;
    escrever(ctx, linhaTxt, x + 9, y + 8 + i * 12, "n", "0", 8, restantes);
    restantes -= linhaTxt.length + 1; // +1 = o espaço que a quebra "comeu"
  });

  // setinha piscando quando a fala terminou de aparecer
  if (letrasVisiveis >= texto.length && Math.floor(t / 300) % 2 === 0) {
    const ax = x + w - 14;
    const ay = y + h - 10;
    ret(ctx, ax, ay, 5, 1, "j");
    ret(ctx, ax + 1, ay + 1, 3, 1, "j");
    ret(ctx, ax + 2, ay + 2, 1, 1, "j");
  }
}
