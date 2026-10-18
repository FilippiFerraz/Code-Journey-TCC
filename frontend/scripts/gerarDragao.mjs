// Gera o sprite em pixel art do Dragão do Código Fonte (Batalha do Dragão)
// a partir da arte em alta resolução arte-original/dragao.png.
// Uso: npm run dragao:gerar (dentro de frontend/)
//
// - fica só o corpo (o maior pedaço da arte): a fumaça e as faíscas soltas
//   perto da boca saem, porque na cena elas são animadas por código;
// - espelha (na arte ele olha pra direita; na arena encara o herói, à esquerda);
// - reduz pra LARGURA px, com borda dura (pixel é opaco ou transparente) e
//   paleta de CORES cores sem dithering — cada pixel fica com uma cor sólida.
//
// Saída (commitada): src/assets/images/dragao-sprite.png
// As coordenadas das partes (boca, olho, asas) em BatalhaDragao/cenaDragao.js
// valem pra esse tamanho — mudou LARGURA, confira as de lá.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEM = path.join(RAIZ, "arte-original/dragao.png");
const DESTINO = path.join(RAIZ, "src/assets/images/dragao-sprite.png");
const LARGURA = 168;
const CORES = 32;

const { data, info } = await sharp(ORIGEM).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const opaco = (k) => data[k * 4 + 3] > 100;

// maior pedaço opaco (o corpo), achado por preenchimento a partir de cada pixel
const rotulo = new Int32Array(W * H).fill(-1);
let maior = { id: -1, n: 0 };
for (let inicio = 0, id = 0; inicio < W * H; inicio++) {
  if (rotulo[inicio] >= 0 || !opaco(inicio)) continue;
  let n = 0;
  const pilha = [inicio];
  rotulo[inicio] = id;
  while (pilha.length) {
    const k = pilha.pop();
    n++;
    const x = k % W, y = (k / W) | 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const nk = ny * W + nx;
      if (rotulo[nk] < 0 && opaco(nk)) {
        rotulo[nk] = id;
        pilha.push(nk);
      }
    }
  }
  if (n > maior.n) maior = { id, n };
  id++;
}

// pixels do corpo + a borda semitransparente colada nele
const doCorpo = (x, y) => x >= 0 && y >= 0 && x < W && y < H && rotulo[y * W + x] === maior.id;
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (!doCorpo(x, y)) continue;
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const largura = maxX - minX + 1, altura = maxY - minY + 1;
const corpo = Buffer.alloc(largura * altura * 4);
for (let y = 0; y < altura; y++) for (let x = 0; x < largura; x++) {
  const sx = minX + x, sy = minY + y;
  const perto = doCorpo(sx, sy) || doCorpo(sx + 1, sy) || doCorpo(sx - 1, sy) || doCorpo(sx, sy + 1) || doCorpo(sx, sy - 1);
  if (!perto) continue;
  const de = (sy * W + sx) * 4;
  const para = (y * largura + (largura - 1 - x)) * 4; // espelhado
  data.copy(corpo, para, de, de + 4);
}

const alturaFinal = Math.round((altura * LARGURA) / largura);
const reduzido = await sharp(corpo, { raw: { width: largura, height: altura, channels: 4 } })
  .resize(LARGURA, alturaFinal, { kernel: "mitchell" })
  .raw()
  .toBuffer();
for (let i = 3; i < reduzido.length; i += 4) reduzido[i] = reduzido[i] >= 110 ? 255 : 0;

await sharp(reduzido, { raw: { width: LARGURA, height: alturaFinal, channels: 4 } })
  .png({ palette: true, colours: CORES, dither: 0 })
  .toFile(DESTINO);
console.log(`${path.basename(DESTINO)}: ${LARGURA}x${alturaFinal}, ${fs.statSync(DESTINO).size} bytes`);
