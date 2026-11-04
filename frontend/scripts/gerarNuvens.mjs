// Recorta as nuvens do céu do mapa (topo de arte-original/mapa.png) com o
// fundo azul transparente, pra reaproveitar o mesmo desenho nas nuvens do
// fim do mapa da Home ("termine o Mundo 1 para continuar" — ver Home.jsx).
// Uso: npm run nuvens:gerar (dentro de frontend/)
//
// Saída (commitada): src/assets/images/nuvens/nuvem-{1..3}.webp
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEM = [path.join(RAIZ, "arte-original/mapa.png"), path.join(RAIZ, "src/assets/images/mapa.webp")].find(
  (f) => fs.existsSync(f)
);
const DESTINO = path.join(RAIZ, "src/assets/images/nuvens");

// Retângulos (x, y, largura, altura) de cada nuvem no topo do mapa 941x1672.
// Só 3 das 5 do céu: o fim do mapa repete e espelha essas (menos download).
const NUVENS = [
  [12, 21, 107, 46],
  [358, 21, 101, 41],
  [608, 27, 124, 40],
];

// Céu = azul saturado; nuvem = branco/lilás (vermelho e verde altos).
function ehNuvem(r, g, b) {
  return r > 110 && g > 110 && b - r < 70;
}

const { data, info } = await sharp(ORIGEM).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
fs.mkdirSync(DESTINO, { recursive: true });

for (const [i, [x0, y0, largura, altura]] of NUVENS.entries()) {
  const saida = Buffer.alloc(largura * altura * 4);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const de = ((y0 + y) * info.width + (x0 + x)) * 4;
      const para = (y * largura + x) * 4;
      const [r, g, b] = [data[de], data[de + 1], data[de + 2]];
      if (!ehNuvem(r, g, b)) continue;
      saida[para] = r;
      saida[para + 1] = g;
      saida[para + 2] = b;
      saida[para + 3] = 255;
    }
  }
  const arquivo = path.join(DESTINO, `nuvem-${i + 1}.webp`);
  await sharp(saida, { raw: { width: largura, height: altura, channels: 4 } }).webp({ lossless: true }).toFile(arquivo);
  console.log(`${path.basename(arquivo)}: ${largura}x${altura}, ${fs.statSync(arquivo).size} bytes`);
}
