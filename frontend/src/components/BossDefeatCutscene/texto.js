// Texto pixelado da cutscene final, com acento em MAIÚSCULAS.
//
// A fonte "Press Start 2P" desenha o acento das maiúsculas acima da altura
// da letra, e a binarização de IntroCutscene/texto.js corta essa parte: o til
// de "DRAGÃO" sumia e "VITÓRIA" virava "VITóRIA". Aqui a maiúscula acentuada
// é escrita sem o acento e o acento é pintado em pixels por cima, na escala
// da fonte (minúsculas acentuadas já saem certas e passam direto).
import { linhaPixelada } from "../IntroCutscene/texto";

// Acentos numa grade 8x2 (unidade = 1/8 do tamanho da fonte), acima da letra.
const ACENTOS = {
  "́": [[4, 1], [5, 0]], // agudo
  "̀": [[2, 0], [3, 1]], // grave
  "̃": [[1, 1], [2, 0], [3, 0], [4, 1], [5, 1], [6, 0]], // til
  "̂": [[2, 1], [3, 0], [4, 0], [5, 1]], // circunflexo
};

// Separa o texto em: versão sem acento nas maiúsculas + lista de acentos.
function separar(texto) {
  const acentos = [];
  const base = [...texto]
    .map((ch, i) => {
      const [letra, marca] = ch.normalize("NFD");
      if (marca && ACENTOS[marca] && letra === letra.toUpperCase() && letra !== letra.toLowerCase()) {
        acentos.push({ i, marca });
        return letra;
      }
      return ch;
    })
    .join("");
  return { base, acentos };
}

function pintarAcentos(ctx, acentos, x, y, tamanho, cor, letras) {
  const u = Math.max(1, Math.round(tamanho / 8));
  ctx.fillStyle = cor;
  for (const { i, marca } of acentos) {
    if (i >= letras) continue;
    for (const [ax, ay] of ACENTOS[marca]) ctx.fillRect(x + i * tamanho + ax * u, y - 2 * u + ay * u, u, u);
  }
}

// Texto com sombra de 1px (como o escrever() da intro), com acentos e com
// `letras` = quantas letras já apareceram (máquina de escrever).
export function escreverTexto(ctx, texto, x, y, cor, sombra = "#140c1c", tamanho = 8, letras = Infinity) {
  if (!texto) return;
  const { base, acentos } = separar(texto);
  const linha = linhaPixelada(base, cor, tamanho);
  const largura = Math.min(linha.width, Math.round(letras * tamanho));
  if (largura <= 0) return;
  if (sombra) {
    const s = linhaPixelada(base, sombra, tamanho);
    ctx.drawImage(s, 0, 0, largura, s.height, x + 1, y + 1, largura, s.height);
    pintarAcentos(ctx, acentos, x + 1, y + 1, tamanho, sombra, letras);
  }
  ctx.drawImage(linha, 0, 0, largura, linha.height, x, y, largura, linha.height);
  pintarAcentos(ctx, acentos, x, y, tamanho, cor, letras);
}

// Texto com contorno de 1px em volta (títulos sobre a luz dourada).
export function textoContornado(ctx, texto, x, y, cor, contorno, tamanho) {
  const { base, acentos } = separar(texto);
  const sombra = linhaPixelada(base, contorno, tamanho);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) {
    ctx.drawImage(sombra, x + dx, y + dy);
    pintarAcentos(ctx, acentos, x + dx, y + dy, tamanho, contorno, Infinity);
  }
  ctx.drawImage(linhaPixelada(base, cor, tamanho), x, y);
  pintarAcentos(ctx, acentos, x, y, tamanho, cor, Infinity);
}
