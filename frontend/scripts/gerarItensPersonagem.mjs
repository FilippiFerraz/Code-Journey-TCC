// Gera as camadas e os ícones dos itens do personagem a partir das formas.
// Uso: npm run itens:gerar (dentro de frontend/)
//
// Entrada (desenhadas à mão, 64x64, na mesma grade de base.png):
//   src/assets/personagem/formas/{slot}/{forma}.png  -> recoloridas por material
//   src/assets/personagem/unicos/{slot}/{nome}.png   -> itens únicos, sem recolor
//   src/assets/personagem/unicos/{slot}/{nome}.icone.png (opcional) -> ícone
//       próprio do item único, em qualquer tamanho (ex: a arte original em
//       alta resolução); sem ele, o ícone é recortado da camada
//
// Saída (commitada — quem clona o repositório não precisa rodar o script):
//   src/assets/personagem/camadas/{slot}/{forma}--{material}.png  (64x64)
//   src/assets/personagem/camadas/{slot}/{nome}.png               (únicos)
//   src/assets/personagem/icones/...  (mesmo nome, recortado no desenho e
//                                      centralizado num quadrado, pro ícone
//                                      não sair minúsculo no inventário)
//
// A chave de cada item é o caminho sem extensão dentro de camadas/, ex:
// "peitoral/armadura--ferro" — é o que vai em Item.imagemUrl no banco.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const PASTA_SCRIPT = path.dirname(fileURLToPath(import.meta.url));
const PASTA_PERSONAGEM = path.resolve(PASTA_SCRIPT, "../src/assets/personagem");
const PASTAS = {
  formas: path.join(PASTA_PERSONAGEM, "formas"),
  unicos: path.join(PASTA_PERSONAGEM, "unicos"),
  camadas: path.join(PASTA_PERSONAGEM, "camadas"),
  icones: path.join(PASTA_PERSONAGEM, "icones"),
};
const TAMANHO = 64;

const config = JSON.parse(fs.readFileSync(path.join(PASTA_SCRIPT, "materiais.json"), "utf8"));

function hexParaRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const chaveRgb = (rgb) => rgb.join(",");

// "#222222" (tom-chave) -> nome do tom ("sombra")
const TOM_POR_COR = new Map(
  Object.entries(config.tonsChave).map(([tom, hex]) => [chaveRgb(hexParaRgb(hex)), tom])
);

function lerPng(arquivo) {
  const png = PNG.sync.read(fs.readFileSync(arquivo));
  if (png.width !== TAMANHO || png.height !== TAMANHO) {
    throw new Error(`${arquivo}: precisa ter ${TAMANHO}x${TAMANHO} (tem ${png.width}x${png.height}).`);
  }
  return png;
}

function salvarPng(png, arquivo) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, PNG.sync.write(png));
}

// Lista {slot, nome, arquivo} de uma pasta organizada em subpastas por slot.
function listarDesenhos(pasta) {
  if (!fs.existsSync(pasta)) return [];
  return fs.readdirSync(pasta, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((slot) =>
      fs.readdirSync(path.join(pasta, slot.name))
        .filter((f) => f.toLowerCase().endsWith(".png") && !f.toLowerCase().endsWith(".icone.png"))
        .map((f) => ({ slot: slot.name, nome: f.replace(/\.png$/i, ""), arquivo: path.join(pasta, slot.name, f) }))
    );
}

function recolorir(forma, material) {
  const saida = new PNG({ width: TAMANHO, height: TAMANHO });
  forma.data.copy(saida.data);
  for (let i = 0; i < saida.data.length; i += 4) {
    if (saida.data[i + 3] === 0) continue;
    const tom = TOM_POR_COR.get(chaveRgb([saida.data[i], saida.data[i + 1], saida.data[i + 2]]));
    if (!tom) continue; // cor fixa do desenho (couro, gema...) — não troca
    const [r, g, b] = hexParaRgb(material[tom]);
    saida.data[i] = r; saida.data[i + 1] = g; saida.data[i + 2] = b;
  }
  return saida;
}

// Recorta o desenho no seu contorno e centraliza num quadrado (com 1px de
// folga), mantendo os pixels inteiros — o CSS amplia com image-rendering:
// pixelated.
function gerarIcone(camada) {
  let minX = TAMANHO, minY = TAMANHO, maxX = -1, maxY = -1;
  for (let y = 0; y < TAMANHO; y++) for (let x = 0; x < TAMANHO; x++) {
    if (camada.data[(y * TAMANHO + x) * 4 + 3] > 0) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) throw new Error("Desenho vazio — nada pra recortar.");
  const largura = maxX - minX + 1, altura = maxY - minY + 1;
  const lado = Math.max(largura, altura) + 2;
  const icone = new PNG({ width: lado, height: lado });
  const dx = Math.floor((lado - largura) / 2), dy = Math.floor((lado - altura) / 2);
  for (let y = 0; y < altura; y++) for (let x = 0; x < largura; x++) {
    const de = ((minY + y) * TAMANHO + (minX + x)) * 4;
    const para = ((dy + y) * lado + (dx + x)) * 4;
    camada.data.copy(icone.data, para, de, de + 4);
  }
  return icone;
}

function gravarItem(camada, slot, nomeArquivo, iconeProprio) {
  salvarPng(camada, path.join(PASTAS.camadas, slot, `${nomeArquivo}.png`));
  const destinoIcone = path.join(PASTAS.icones, slot, `${nomeArquivo}.png`);
  if (iconeProprio) {
    fs.mkdirSync(path.dirname(destinoIcone), { recursive: true });
    fs.copyFileSync(iconeProprio, destinoIcone);
  } else {
    salvarPng(gerarIcone(camada), destinoIcone);
  }
  return `${slot}/${nomeArquivo}`;
}

// Recria camadas/ e icones/ do zero, pra não sobrar arquivo de forma apagada.
for (const pasta of [PASTAS.camadas, PASTAS.icones]) fs.rmSync(pasta, { recursive: true, force: true });

const gerados = [];
for (const forma of listarDesenhos(PASTAS.formas)) {
  const png = lerPng(forma.arquivo);
  for (const [nomeMaterial, material] of Object.entries(config.materiais)) {
    gerados.push(gravarItem(recolorir(png, material), forma.slot, `${forma.nome}--${nomeMaterial}`));
  }
}
for (const unico of listarDesenhos(PASTAS.unicos)) {
  const iconeProprio = unico.arquivo.replace(/\.png$/i, ".icone.png");
  gerados.push(
    gravarItem(lerPng(unico.arquivo), unico.slot, unico.nome, fs.existsSync(iconeProprio) ? iconeProprio : null)
  );
}

console.log(`${gerados.length} itens gerados (camada + ícone):`);
for (const chave of gerados) console.log(`  ${chave}`);
