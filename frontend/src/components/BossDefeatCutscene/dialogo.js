// Textos da cutscene final: a caixa de diálogo de RPG (com o nome de quem
// fala e a fala em máquina de escrever) e o título grande de vitória.
//
// Usa a mesma fonte pixelada binarizada da cutscene de introdução
// (IntroCutscene/texto.js): "Press Start 2P", sem borrado.
import { retPx } from "../../pages/BatalhaDragao/cenaDragao";
import { degraus } from "../IntroCutscene/pixel";
import { larguraTexto, quebrarLinhas } from "../IntroCutscene/texto";
import { escreverTexto as escrever, textoContornado } from "./texto";
import { LARGURA } from "./cenario";
import { FASES, NOME_FALANTE, falaEm } from "./marcos";

// Caixa no ALTO da tela: embaixo ela cobriria o herói e as patas do dragão.
const CAIXA = { x: 8, y: 12, w: LARGURA - 16, h: 36 };
const LETRAS_POR_LINHA = 43;

export function caixaDialogo(ctx, t) {
  const [inicio, fim] = FASES.falas;
  if (t < inicio || t >= fim) return;
  // abre em 4 degraus (0,1s) e fecha nos últimos 0,1s
  const abrir = degraus(Math.min((t - inicio) / 100, (fim - t) / 100, 1), 4);
  if (abrir <= 0) return;
  const { x, w } = CAIXA;
  const h = Math.max(4, Math.round(CAIXA.h * abrir));
  const y = CAIXA.y + Math.round((CAIXA.h - h) / 2);

  // moldura: preto, branco, dourado, fundo roxo-noite (mesmo estilo da intro)
  retPx(ctx, x, y, w, h, "#140c1c");
  retPx(ctx, x + 1, y + 1, w - 2, h - 2, "#fff8f0");
  retPx(ctx, x + 2, y + 2, w - 4, h - 4, "#b8955a");
  retPx(ctx, x + 3, y + 3, w - 6, h - 6, "#2a1238");
  for (const [cx, cy] of [[x + 3, y + 3], [x + w - 5, y + 3], [x + 3, y + h - 5], [x + w - 5, y + h - 5]]) {
    retPx(ctx, cx, cy, 2, 2, "#ffd23c");
  }
  if (abrir < 1) return;

  // etiqueta com o nome de quem fala, "pendurada" na borda de cima
  const nomeW = larguraTexto(NOME_FALANTE) + 12;
  retPx(ctx, x + 10, y - 9, nomeW, 15, "#140c1c");
  retPx(ctx, x + 11, y - 8, nomeW - 2, 13, "#5b2a86");
  escrever(ctx, NOME_FALANTE, x + 16, y - 4, "#ffd23c", "#140c1c");

  const fala = falaEm(t);
  if (!fala) return;
  let restantes = fala.letras;
  quebrarLinhas(fala.texto, LETRAS_POR_LINHA).forEach((linha, i) => {
    if (restantes <= 0) return;
    escrever(ctx, linha, x + 9, y + 10 + i * 12, "#fff8f0", "#140c1c", 8, restantes);
    restantes -= linha.length + 1;
  });

  // setinha piscando quando a fala terminou de aparecer
  if (fala.letras >= fala.texto.length && Math.floor(t / 250) % 2 === 0) {
    const ax = x + w - 14;
    const ay = y + h - 9;
    retPx(ctx, ax, ay, 5, 1, "#ffd23c");
    retPx(ctx, ax + 1, ay + 1, 3, 1, "#ffd23c");
    retPx(ctx, ax + 2, ay + 2, 1, 1, "#ffd23c");
  }
}

// "VITÓRIA!" / "O REINO ESTÁ SALVO!": cada linha cai de cima em degraus e
// quica 1x; a primeira pisca entre dourado e branco.
export function tituloVitoria(ctx, t, [inicio1, inicio2]) {
  const linhas = [
    { texto: "VITÓRIA!", tamanho: 24, y: 50, inicio: inicio1 },
    { texto: "O REINO ESTÁ SALVO!", tamanho: 16, y: 84, inicio: inicio2 },
  ];
  for (const l of linhas) {
    if (t < l.inicio) continue;
    const p = degraus((t - l.inicio) / 220, 6);
    const queda = p < 1 ? Math.round((1 - p) * -24) : t - l.inicio < 320 ? 3 : 0;
    const x = Math.round((LARGURA - larguraTexto(l.texto, l.tamanho)) / 2);
    const cor = l.tamanho === 24 && Math.floor(t / 160) % 4 === 0 ? "#ffffff" : "#ffd23c";
    textoContornado(ctx, l.texto, x, l.y + queda, cor, "#2a1238", l.tamanho);
  }
}
