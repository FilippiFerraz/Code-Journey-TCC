// Transforma a arte pronta de um item (ex: src/assets/images/Item_asas.png,
// em qualquer tamanho) num item ÚNICO do personagem em camadas:
//   - a camada 64x64, reduzida e posicionada no lugar do slot;
//   - o ícone do inventário, que é a própria arte original.
// Depois roda o gerarItensPersonagem.mjs pra atualizar camadas/ e icones/.
//
// Uso (dentro de frontend/):
//   npm run itens:importar -- <arquivo em src/assets/images> <slot> <nome-do-item>
//   ex: npm run itens:importar -- Item_asas.png costas asas-flamejantes
//
// Slots aceitos: arma, costas, capacete. Botas e peitoral precisam acompanhar
// o formato do corpo, então são desenhados como forma (ver o README em
// src/assets/personagem) em vez de importados de uma arte solta.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const PASTA_SCRIPT = path.dirname(fileURLToPath(import.meta.url));
const PASTA_IMAGENS = path.resolve(PASTA_SCRIPT, "../src/assets/images");
const PASTA_UNICOS = path.resolve(PASTA_SCRIPT, "../src/assets/personagem/unicos");

// Onde cada slot fica na grade 64x64 da base.png. A arte é reduzida pra
// caber em `largura` x `altura` (mantendo a proporção) e centralizada em
// `centroX`, com o topo em `topo` ou o fundo em `fundo`.
//   arma: na mão direita (punho em x 38-42, linhas 29-33), lâmina pra cima
//   costas: atrás dos ombros (a camada fica atrás do corpo)
//   capacete: sobre a cabeça (linhas 5-16)
const SLOTS = {
  arma: { largura: 12, altura: 28, centroX: 43.5, fundo: 35 },
  costas: { largura: 42, altura: 32, centroX: 30.5, topo: 8 },
  capacete: { largura: 16, altura: 12, centroX: 30.5, fundo: 11 },
};

const [arquivo, slot, nome] = process.argv.slice(2);
if (!arquivo || !slot || !nome) {
  console.error("Uso: npm run itens:importar -- <arquivo> <slot> <nome-do-item>");
  process.exit(1);
}
const config = SLOTS[slot];
if (!config) {
  console.error(`Slot "${slot}" não suportado. Use: ${Object.keys(SLOTS).join(", ")}.`);
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(nome)) {
  console.error('O nome do item deve ter só letras minúsculas, números e hífen (ex: "asas-flamejantes").');
  process.exit(1);
}

const origem = path.join(PASTA_IMAGENS, arquivo);
const arte = PNG.sync.read(fs.readFileSync(origem));
const ALFA_MINIMO = 128;

// Contorno do desenho (ignora a transparência em volta).
let minX = arte.width, minY = arte.height, maxX = -1, maxY = -1;
for (let y = 0; y < arte.height; y++) for (let x = 0; x < arte.width; x++) {
  if (arte.data[(y * arte.width + x) * 4 + 3] >= ALFA_MINIMO) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
}
if (maxX < 0) throw new Error(`${arquivo}: imagem vazia.`);
const larguraArte = maxX - minX + 1, alturaArte = maxY - minY + 1;

// Mesma escala nos dois eixos, pra não deformar.
const escala = Math.max(larguraArte / config.largura, alturaArte / config.altura);
const largura = Math.max(1, Math.round(larguraArte / escala));
const altura = Math.max(1, Math.round(alturaArte / escala));

// Cada pixel da camada = média das cores opacas do bloco correspondente na
// arte (funciona tanto pra pixel art ampliada quanto pra arte com muitas
// cores). Bloco com menos de 40% de pixels opacos fica transparente.
const camada = new PNG({ width: 64, height: 64 });
const x0 = Math.round(config.centroX - largura / 2);
const y0 = config.topo ?? config.fundo - altura + 1;
for (let gy = 0; gy < altura; gy++) for (let gx = 0; gx < largura; gx++) {
  let r = 0, g = 0, b = 0, opacos = 0, total = 0;
  for (let y = Math.floor(minY + gy * escala); y < Math.min(maxY + 1, minY + (gy + 1) * escala); y++)
    for (let x = Math.floor(minX + gx * escala); x < Math.min(maxX + 1, minX + (gx + 1) * escala); x++) {
      total++;
      const i = (y * arte.width + x) * 4;
      if (arte.data[i + 3] < ALFA_MINIMO) continue;
      opacos++; r += arte.data[i]; g += arte.data[i + 1]; b += arte.data[i + 2];
    }
  const x = x0 + gx, y = y0 + gy;
  if (!total || opacos / total < 0.4 || x < 0 || y < 0 || x > 63 || y > 63) continue;
  const i = (y * 64 + x) * 4;
  camada.data[i] = Math.round(r / opacos);
  camada.data[i + 1] = Math.round(g / opacos);
  camada.data[i + 2] = Math.round(b / opacos);
  camada.data[i + 3] = 255;
}

const destino = path.join(PASTA_UNICOS, slot);
fs.mkdirSync(destino, { recursive: true });
fs.writeFileSync(path.join(destino, `${nome}.png`), PNG.sync.write(camada));
fs.copyFileSync(origem, path.join(destino, `${nome}.icone.png`));
console.log(`${arquivo} -> unicos/${slot}/${nome}.png (${largura}x${altura} px em x ${x0}, y ${y0})`);
console.log(`Chave do item (Item.imagemUrl): ${slot}/${nome}\n`);

execFileSync(process.execPath, [path.join(PASTA_SCRIPT, "gerarItensPersonagem.mjs")], { stdio: "inherit" });
