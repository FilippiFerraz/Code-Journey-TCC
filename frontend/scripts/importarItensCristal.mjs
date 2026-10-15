// Gera as camadas 64x64 dos itens da coleção "Guardião de Cristal" (Baú de
// Cristal) a partir das artes em arte-original/itens-cristal/, e grava em
// src/assets/personagem/unicos/{slot}/ (camada + ícone). No fim roda o
// gerarItensPersonagem.mjs pra atualizar camadas/ e icones/.
// Uso: npm run itens:cristal (dentro de frontend/)
//
// Como cada um vira camada (todas na grade da base.png, então servem em
// qualquer aparência do herói):
//   - elmo, capuz, machado, escudo: a arte reduzida e posicionada no slot
//     (cabeça, mão direita, mão esquerda). No capuz, o "vazio" escuro da
//     abertura fica transparente pro rosto do herói aparecer;
//   - armadura, botas: precisam do formato do corpo, então usam o desenho
//     de uma camada que já existe (armadura--ferro / botas--ferro) pintado
//     com as cores da arte (cada pixel pega a cor da arte de mesmo brilho).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const PASTA_SCRIPT = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(PASTA_SCRIPT, "..");
const ARTES = path.join(RAIZ, "arte-original/itens-cristal");
const PERSONAGEM = path.join(RAIZ, "src/assets/personagem");
const TAMANHO = 64;
const LADO_ICONE = 128;

async function lerRgba(arquivo) {
  const { data, info } = await sharp(arquivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, largura: info.width, altura: info.height };
}

function camadaVazia() {
  return Buffer.alloc(TAMANHO * TAMANHO * 4);
}

function luminancia(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Reduz a arte pra `largura` px de largura (mesma escala na altura) e
// desenha na camada com o canto superior esquerdo em (x0, y0). Cada pixel
// é a média das cores opacas do bloco; bloco com menos de 45% de pixels
// opacos fica transparente.
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
  return { topo, altura };
}

// Paleta da arte ordenada por brilho (só os pixels que passam no filtro),
// com `n` cores — a mediana de cada faixa de brilho. Os contornos quase
// pretos da arte ficam de fora (puxariam tudo pro escuro); no lugar deles
// entra `contorno` como a cor mais escura.
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

// Pinta uma camada existente com a paleta: o pixel mais escuro da camada
// vira a 1ª cor, o mais claro a última (pelo brilho relativo). `especial`
// pode trocar pixels específicos (ex: o emblema dourado vira gema).
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

// Pixels quase pretos ligados ao ponto (x, y) ficam transparentes (abertura
// do capuz, pro rosto aparecer).
function abrirVazio(camada, x, y, limite = 45) {
  const pilha = [[x, y]];
  const visto = new Set();
  while (pilha.length) {
    const [px, py] = pilha.pop();
    const chave = py * TAMANHO + px;
    if (px < 0 || py < 0 || px >= TAMANHO || py >= TAMANHO || visto.has(chave)) continue;
    visto.add(chave);
    const o = chave * 4;
    if (!camada[o + 3] || luminancia(camada[o], camada[o + 1], camada[o + 2]) > limite) continue;
    camada[o + 3] = 0;
    pilha.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }
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

// ---------- Elmo: cabeça (a pluma sobe acima da cabeça) ----------
{
  const camada = camadaVazia();
  reduzirNaCamada(camada, await lerRgba(arte("elmo")), { largura: 13, x0: 24, fundo: 17 });
  await salvarItem("capacete", "elmo-do-guardiao", camada, arte("elmo"));
}

// ---------- Capuz: cabeça e ombros, com a abertura vazada ----------
{
  const camada = camadaVazia();
  reduzirNaCamada(camada, await lerRgba(arte("capuz")), { largura: 21, x0: 20, fundo: 20 });
  abrirVazio(camada, 31, 11);
  await salvarItem("capacete", "capuz-do-crepusculo", camada, arte("capuz"));
}

// ---------- Machado: mão direita (punho em x 38-42, linhas 29-33) ----------
{
  const camada = camadaVazia();
  reduzirNaCamada(camada, await lerRgba(arte("machado")), { largura: 20, x0: 34, fundo: 38 });
  await salvarItem("arma", "machado-glacial", camada, arte("machado"));
}

// ---------- Escudo: mão esquerda, na frente do corpo ----------
{
  const camada = camadaVazia();
  reduzirNaCamada(camada, await lerRgba(arte("escudo")), { largura: 14, x0: 13, y0: 25 });
  await salvarItem("escudo", "escudo-estelar", camada, arte("escudo"));
}

// ---------- Armadura: formato da armadura, com o aço azulado da arte ----------
{
  const aco = paletaPorBrilho(
    await lerRgba(arte("armadura")),
    (r, g, b) => b >= r + 8 && !(g > 170 && b > 200),
    5,
    [20, 26, 44]
  );
  const ouroParaGema = (r, g, b) => (r > 150 && g > 120 && b < 120 ? (g > 185 ? [190, 245, 255] : [70, 200, 240]) : null);
  const camada = repintar(await lerCamada("peitoral/armadura--ferro"), aco, ouroParaGema);
  await salvarItem("peitoral", "armadura-do-guardiao", camada, arte("armadura"));
}

// ---------- Botas: formato das botas, com o azul-noite e o roxo da arte ----------
{
  const couro = paletaPorBrilho(await lerRgba(arte("botas")), (r, g, b) => b >= r, 4, [14, 14, 30]);
  const camada = repintar(await lerCamada("botas/botas--ferro"), couro);
  await salvarItem("botas", "botas-do-crepusculo", camada, arte("botas"));
}

execFileSync(process.execPath, [path.join(PASTA_SCRIPT, "gerarItensPersonagem.mjs")], { stdio: "inherit" });
