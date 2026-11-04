// Gera as bases 64x64 das aparências do herói a partir das artes em alta
// resolução (500x500, desenhadas por cima do guerreiro original, com espada).
// Uso: npm run aparencias:gerar (dentro de frontend/)
//
// Entrada: arte-original/{arquivo}.png (ou ainda em src/assets/images/)
// Saída (commitada — quem clona o repositório não precisa rodar o script):
//   src/assets/personagem/aparencias/{id}.png            (base, sem arma)
//   src/assets/personagem/aparencias/{id}--capacete.png  (cabelo aparado no
//       contorno do capuz da base.png, usada quando há capacete equipado —
//       senão o cabelo volumoso aparece em volta do elmo)
//
// Pra todas as camadas de item (desenhadas sobre base.png) encaixarem em
// qualquer aparência, a arte é reduzida exatamente na grade da base.png: o
// script procura a escala e o deslocamento em que o corpo da arte mais
// coincide com o corpo da base e amostra o centro de cada "pixel" da arte.
// A mão direita e a espada são trocadas pela mão vazia da base.png, já que a
// arma é uma camada (slot "arma") e não faz parte do corpo.
//
// O guerreiro original (id "guerreiro") é a própria base.png e não passa por
// aqui.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = path.join(RAIZ, "src/assets/personagem/base.png");
const DESTINO = path.join(RAIZ, "src/assets/personagem/aparencias");
const ORIGENS = [path.join(RAIZ, "arte-original"), path.join(RAIZ, "src/assets/images")];
const TAMANHO = 64;

// id da aparência (é o que fica salvo em Personagem.aparencia) -> arte
const APARENCIAS = {
  guerreira: "Guerreira_simples.png",
  "guerreira-afro": "Guerreira_simples_afro.png",
  "guerreiro-afro": "Guerreiro_simples_afro.png",
};

// Região da mão direita + espada (em pixels da grade 64x64), copiada da base.
const MAO = { x: 37, y: 26 };
// Linhas da cabeça aparadas no contorno da base na versão com capacete.
const ALTURA_CABECA = 22;

async function lerRgba(arquivo) {
  const { data, info } = await sharp(arquivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, largura: info.width, altura: info.height };
}

function salvar(dados, arquivo) {
  return sharp(dados, { raw: { width: TAMANHO, height: TAMANHO, channels: 4 } }).png().toFile(arquivo);
}

function opacoNaArte(arte, x, y) {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= arte.largura || y >= arte.altura) return false;
  return arte.data[(y * arte.largura + x) * 4 + 3] > 127;
}

// Escala/deslocamento em que a silhueta do corpo (ombros pra baixo, sem a
// mão da espada) bate com a da base.png.
function alinhar(arte, base) {
  const opacoNaBase = (x, y) => base.data[(y * TAMANHO + x) * 4 + 3] > 0;
  const escalaAproximada = arte.largura / TAMANHO;
  let melhor = null;
  for (let escala = escalaAproximada * 0.94; escala <= escalaAproximada * 1.06; escala += 0.01) {
    for (let dx = -12; dx <= 12; dx += 0.5) {
      for (let dy = -12; dy <= 12; dy += 0.5) {
        let acertos = 0;
        for (let y = 14; y < TAMANHO; y++) {
          for (let x = 0; x < TAMANHO; x++) {
            if (x >= MAO.x && y >= MAO.y) continue;
            const naArte = opacoNaArte(arte, dx + (x + 0.5) * escala, dy + (y + 0.5) * escala);
            if (naArte === opacoNaBase(x, y)) acertos++;
          }
        }
        if (!melhor || acertos > melhor.acertos) melhor = { escala, dx, dy, acertos };
      }
    }
  }
  return melhor;
}

// Cor de cada pixel da grade: a mais frequente no miolo da célula (as bordas
// têm o antisserrilhado da arte ampliada); transparente se o miolo for.
function reduzir(arte, { escala, dx, dy }) {
  const saida = Buffer.alloc(TAMANHO * TAMANHO * 4);
  for (let y = 0; y < TAMANHO; y++) {
    for (let x = 0; x < TAMANHO; x++) {
      const cores = new Map();
      let amostras = 0;
      let opacas = 0;
      for (let j = 0.25; j <= 0.75; j += 0.125) {
        for (let i = 0.25; i <= 0.75; i += 0.125) {
          amostras++;
          const ax = Math.floor(dx + (x + i) * escala);
          const ay = Math.floor(dy + (y + j) * escala);
          if (ax < 0 || ay < 0 || ax >= arte.largura || ay >= arte.altura) continue;
          const k = (ay * arte.largura + ax) * 4;
          if (arte.data[k + 3] < 128) continue;
          opacas++;
          const chave = `${arte.data[k] >> 3},${arte.data[k + 1] >> 3},${arte.data[k + 2] >> 3}`;
          const cor = cores.get(chave) ?? { n: 0, r: 0, g: 0, b: 0 };
          cor.n++;
          cor.r += arte.data[k];
          cor.g += arte.data[k + 1];
          cor.b += arte.data[k + 2];
          cores.set(chave, cor);
        }
      }
      if (opacas * 2 <= amostras) continue;
      let maisComum = null;
      for (const cor of cores.values()) if (!maisComum || cor.n > maisComum.n) maisComum = cor;
      const o = (y * TAMANHO + x) * 4;
      saida[o] = Math.round(maisComum.r / maisComum.n);
      saida[o + 1] = Math.round(maisComum.g / maisComum.n);
      saida[o + 2] = Math.round(maisComum.b / maisComum.n);
      saida[o + 3] = 255;
    }
  }
  return saida;
}

const base = await lerRgba(BASE);
fs.mkdirSync(DESTINO, { recursive: true });

for (const [id, arquivo] of Object.entries(APARENCIAS)) {
  const origem = ORIGENS.map((pasta) => path.join(pasta, arquivo)).find((f) => fs.existsSync(f));
  if (!origem) throw new Error(`Arte não encontrada: ${arquivo} (procurado em arte-original/ e src/assets/images/)`);

  const arte = await lerRgba(origem);
  const alinhamento = alinhar(arte, base);
  const corpo = reduzir(arte, alinhamento);

  // mão vazia da base no lugar da mão com espada
  for (let y = MAO.y; y < TAMANHO; y++) {
    for (let x = MAO.x; x < TAMANHO; x++) {
      const o = (y * TAMANHO + x) * 4;
      base.data.copy(corpo, o, o, o + 4);
    }
  }
  await salvar(corpo, path.join(DESTINO, `${id}.png`));

  const comCapacete = Buffer.from(corpo);
  for (let y = 0; y < ALTURA_CABECA; y++) {
    for (let x = 0; x < TAMANHO; x++) {
      const o = (y * TAMANHO + x) * 4;
      if (base.data[o + 3] === 0) comCapacete[o + 3] = 0;
    }
  }
  await salvar(comCapacete, path.join(DESTINO, `${id}--capacete.png`));

  console.log(
    `${id}: escala ${alinhamento.escala.toFixed(2)}, deslocamento (${alinhamento.dx}, ${alinhamento.dy}) — ` +
      `${alinhamento.acertos} pixels do corpo coincidem com a base`
  );
}
