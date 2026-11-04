// Gera as camadas 64x64 da coleção "Draconiana" — as recompensas dos 6
// desafios do Portal 3 (Arena do Dragão) — a partir das artes em
// arte-original/itens-arena-dragao/, e grava em
// src/assets/personagem/unicos/{slot}/ (camada + ícone). No fim roda o
// gerarItensPersonagem.mjs pra atualizar camadas/ e icones/.
// Uso: npm run itens:arena-dragao (dentro de frontend/)
//
// Mesmo método do importarItensCristal.mjs (todas as camadas na grade da
// base.png, então servem em qualquer aparência do herói):
//   - elmo, espada, escudo: a arte reduzida e posicionada no slot (cabeça,
//     mão direita, mão esquerda). A espada da arte está na diagonal: na
//     camada ela é girada pra ficar em pé na mão (o ícone usa a arte original);
//   - armadura, botas: o desenho de uma camada que já existe (armadura--ferro
//     / botas--ferro) pintado com as cores da arte;
//   - manoplas (slot "luvas"): os antebraços e as mãos da própria base.png,
//     pintados com as cores da arte — assim calçam certinho no herói.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const PASTA_SCRIPT = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(PASTA_SCRIPT, "..");
const ARTES = path.join(RAIZ, "arte-original/itens-arena-dragao");
const PERSONAGEM = path.join(RAIZ, "src/assets/personagem");
const TAMANHO = 64;
const LADO_ICONE = 128;

async function lerRgba(entrada) {
  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, largura: info.width, altura: info.height };
}

function camadaVazia() {
  return Buffer.alloc(TAMANHO * TAMANHO * 4);
}

function luminancia(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Reduz a arte pra `largura` px de largura (mesma escala na altura) e
// desenha na camada com o canto superior esquerdo em (x0, y0) — ou com a
// última linha em `fundo`. Cada pixel é a média das cores opacas do bloco;
// bloco com menos de 45% de pixels opacos fica transparente.
function reduzirNaCamada(camada, arte, { largura, x0, y0, fundo }) {
  const escala = arte.largura / largura;
  const altura = Math.max(1, Math.round(arte.altura / escala));
  const topo = fundo !== undefined ? fundo - altura + 1 : y0;
  for (let gy = 0; gy < altura; gy++) {
    for (let gx = 0; gx < largura; gx++) {
      let r = 0, g = 0, b = 0, opacos = 0, total = 0;
      for (let y = Math.floor(gy * escala); y < Math.min(arte.altura, (gy + 1) * escala); y++) {
        for (let x = Math.floor(gx * escala); x < Math.min(arte.largura, (gx + 1) * escala); x++) {
          total++;
          const i = (y * arte.largura + x) * 4;
          if (arte.data[i + 3] < 128) continue;
          opacos++;
          r += arte.data[i]; g += arte.data[i + 1]; b += arte.data[i + 2];
        }
      }
      const x = x0 + gx, y = topo + gy;
      if (!total || opacos / total < 0.45 || x < 0 || y < 0 || x >= TAMANHO || y >= TAMANHO) continue;
      const o = (y * TAMANHO + x) * 4;
      camada[o] = Math.round(r / opacos);
      camada[o + 1] = Math.round(g / opacos);
      camada[o + 2] = Math.round(b / opacos);
      camada[o + 3] = 255;
    }
  }
}

// Paleta da arte ordenada por brilho (só os pixels que passam no filtro),
// com `n` cores — a mediana de cada faixa de brilho. Os contornos quase
// pretos ficam de fora; no lugar deles entra `contorno` como a cor mais escura.
function paletaPorBrilho(arte, filtro, n, contorno) {
  const cores = [];
  for (let i = 0; i < arte.data.length; i += 4) {
    const [r, g, b, a] = [arte.data[i], arte.data[i + 1], arte.data[i + 2], arte.data[i + 3]];
    if (a >= 200 && luminancia(r, g, b) >= 45 && filtro(r, g, b)) cores.push([r, g, b, luminancia(r, g, b)]);
  }
  cores.sort((p, q) => p[3] - q[3]);
  const tons = Array.from({ length: n }, (_, k) => {
    const faixa = cores.slice(Math.floor((k * cores.length) / n), Math.floor(((k + 1) * cores.length) / n));
    return faixa[Math.floor(faixa.length / 2)].slice(0, 3);
  });
  return [contorno, ...tons];
}

// Pinta uma camada com a paleta: o pixel mais escuro vira a 1ª cor, o mais
// claro a última (pelo brilho relativo). `especial(r, g, b)` pode manter ou
// trocar pixels específicos (ex: os detalhes dourados ficam dourados).
function repintar(camada, paleta, especial = () => null) {
  let min = 255, max = 0;
  for (let o = 0; o < camada.length; o += 4) {
    if (!camada[o + 3]) continue;
    const l = luminancia(camada[o], camada[o + 1], camada[o + 2]);
    min = Math.min(min, l); max = Math.max(max, l);
  }
  const saida = Buffer.from(camada);
  for (let o = 0; o < saida.length; o += 4) {
    if (!saida[o + 3]) continue;
    const [r, g, b] = [saida[o], saida[o + 1], saida[o + 2]];
    const cor = especial(r, g, b) ?? paleta[Math.min(paleta.length - 1, Math.floor(((luminancia(r, g, b) - min) / (max - min || 1)) * paleta.length))];
    [saida[o], saida[o + 1], saida[o + 2]] = cor;
  }
  return saida;
}

async function lerCamada(chave) {
  return (await lerRgba(path.join(PERSONAGEM, "camadas", `${chave}.png`))).data;
}

async function salvarItem(slot, nome, camada, arte) {
  const pasta = path.join(PERSONAGEM, "unicos", slot);
  fs.mkdirSync(pasta, { recursive: true });
  await sharp(camada, { raw: { width: TAMANHO, height: TAMANHO, channels: 4 } })
    .png()
    .toFile(path.join(pasta, `${nome}.png`));
  // ícone do inventário: a arte original, reduzida pra no máximo 128px
  await sharp(arte)
    .resize(LADO_ICONE, LADO_ICONE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, quality: 90, effort: 10 })
    .toFile(path.join(pasta, `${nome}.icone.png`));
  console.log(`unicos/${slot}/${nome}.png`);
}

const arte = (nome) => path.join(ARTES, `${nome}.png`);
// cores da coleção: escamas roxas (o azul mais forte que o verde) e o
// dourado das garras e bordas, que fica igual em toda peça
const ehRoxo = (r, g, b) => b > g + 20 && r > g;
const manterDourado = (r, g, b) => (r > 150 && g > 110 && b < 110 ? [r, g, b] : null);
const CONTORNO = [22, 10, 34];

// ---------- Elmo: cabeça (os chifres sobem acima da cabeça) ----------
{
  const camada = camadaVazia();
  reduzirNaCamada(camada, await lerRgba(arte("elmo")), { largura: 14, x0: 24, fundo: 17 });
  await salvarItem("capacete", "elmo-draconiano", camada, arte("elmo"));
}

// ---------- Espada: girada pra ficar em pé, punho na mão direita ----------
// (o punho da base fica em x 38-42, linhas 29-33)
{
  const emPe = await sharp(arte("espada"))
    .rotate(-45, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
  const espada = await lerRgba(emPe);
  const largura = Math.max(5, Math.round((30 * espada.largura) / espada.altura)); // ~30 px de altura
  const camada = camadaVazia();
  reduzirNaCamada(camada, espada, { largura, x0: Math.round(40.5 - largura / 2), fundo: 36 });
  await salvarItem("arma", "espada-draconiana", camada, arte("espada"));
}

// ---------- Escudo: mão esquerda, na frente do corpo ----------
{
  const camada = camadaVazia();
  reduzirNaCamada(camada, await lerRgba(arte("escudo")), { largura: 14, x0: 13, y0: 25 });
  await salvarItem("escudo", "escudo-draconiano", camada, arte("escudo"));
}

// ---------- Armadura: formato da armadura, com as escamas roxas da arte ----------
{
  // 4 tons: com 5 a armadura ficava "manchada" na grade de 64x64
  const escamas = paletaPorBrilho(await lerRgba(arte("armadura")), ehRoxo, 4, CONTORNO);
  const camada = repintar(await lerCamada("peitoral/armadura--ferro"), escamas, manterDourado);
  await salvarItem("peitoral", "couraca-draconiana", camada, arte("armadura"));
}

// ---------- Botas: formato das botas, com as escamas roxas da arte ----------
{
  const escamas = paletaPorBrilho(await lerRgba(arte("botas")), ehRoxo, 4, CONTORNO);
  const camada = repintar(await lerCamada("botas/botas--ferro"), escamas);
  await salvarItem("botas", "botas-draconianas", camada, arte("botas"));
}

// ---------- Manoplas: antebraços e mãos da base.png ----------
// Os braços da base ficam fora do contorno da armadura: à esquerda em
// x 18-26 e à direita em x 35-44, das linhas 28 (cotovelo) pra baixo.
// Entram só os pixels da base que a armadura de ferro não cobre — a manopla
// fica por cima da armadura, como as luvas de verdade.
{
  const base = await lerRgba(path.join(PERSONAGEM, "base.png"));
  const armadura = await lerCamada("peitoral/armadura--ferro");
  const molde = camadaVazia();
  const regioes = [
    { x0: 18, x1: 26, y0: 28, y1: 37 }, // braço esquerdo (do jogador, à esquerda na tela)
    { x0: 35, x1: 44, y0: 28, y1: 34 }, // braço direito (o que segura a arma)
  ];
  for (const { x0, x1, y0, y1 } of regioes) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const o = (y * TAMANHO + x) * 4;
        if (base.data[o + 3] < 128 || armadura[o + 3]) continue;
        base.data.copy(molde, o, o, o + 4);
      }
    }
  }
  // as escamas roxas da couraça (não o metal da arte das manoplas): o metal
  // é escuro e, sobre os braços já escuros da base, a manopla sumia
  const escamas = paletaPorBrilho(await lerRgba(arte("armadura")), ehRoxo, 4, CONTORNO);
  await salvarItem("luvas", "manoplas-draconianas", repintar(molde, escamas), arte("manoplas"));
}

execFileSync(process.execPath, [path.join(PASTA_SCRIPT, "gerarItensPersonagem.mjs")], { stdio: "inherit" });
