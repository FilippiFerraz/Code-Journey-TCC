// Recursos da cutscene final, carregados e pré-calculados UMA vez antes de
// ela começar (nada disso é refeito a cada quadro):
//
// - o dragão: dragao-sprite.png, o MESMO sprite da batalha, gerado do
//   dragao.png original (arte-original/) por scripts/gerarDragao.mjs — sem
//   redesenho. Dele saem as versões que os efeitos usam: silhueta branca e
//   vermelha (flash/dano), cores invertidas (glitch) e a lista de pixels
//   (dissolução);
// - o herói: as mesmas camadas da batalha (aparência + itens equipados),
//   juntas num canvas 64x64;
// - as duas arenas (corrompida e purificada).
import spriteDragao from "../../assets/images/dragao-sprite.png";
import { novoCanvas } from "../../pages/BatalhaDragao/cenaDragao";
import { ruido } from "../IntroCutscene/pixel";
import { ALTURA, LARGURA, montarArena } from "./cenario";
import { carregarFonte } from "../IntroCutscene/texto";
import { DISSOLVER_FIM, DISSOLVER_INICIO } from "./marcos";

function carregarImagem(src) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

// Espera uma <img> já criada (as camadas do herói vêm da batalha, talvez
// ainda baixando).
function esperarImagem(img) {
  if (!img) return Promise.resolve(null);
  if (img.complete && img.naturalWidth > 0) return Promise.resolve(img);
  return new Promise((ok) => {
    img.addEventListener("load", () => ok(img), { once: true });
    img.addEventListener("error", () => ok(null), { once: true });
  });
}

// Copia do sprite com cada pixel opaco transformado por `fn(r, g, b)`.
function variacao(img, fn) {
  const [c, g] = novoCanvas(img.width, img.height);
  g.drawImage(img, 0, 0);
  const dados = g.getImageData(0, 0, img.width, img.height);
  const px = dados.data;
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    const [r, gg, b] = fn(px[i], px[i + 1], px[i + 2]);
    px[i] = r;
    px[i + 1] = gg;
    px[i + 2] = b;
  }
  g.putImageData(dados, 0, 0);
  return c;
}

// Parte pesada (dragão + arenas + fonte): preparada uma vez e guardada. A
// batalha chama preCarregar() quando a luta começa, então na vitória a
// cutscene já começa na hora (sem tela preta esperando).
let fixos = null;
export function preCarregar() {
  if (!fixos) fixos = Promise.all([carregarImagem(spriteDragao), carregarFonte()]).then(([img]) => prepararFixos(img));
  return fixos;
}

export async function carregarRecursos({ camadas = [] } = {}) {
  // o herói é montado na hora (é rápido), com o equipamento atual
  const [base, imgsHeroi] = await Promise.all([preCarregar(), Promise.all(camadas.map(esperarImagem))]);
  const [heroi, gh] = novoCanvas(64, 64);
  for (const img of imgsHeroi) if (img) gh.drawImage(img, 0, 0, 64, 64);
  return { ...base, heroi };
}

function prepararFixos(imgDragao) {
  // ---- dragão ----
  let dragao = null;
  if (imgDragao) {
    const w = imgDragao.width;
    const h = imgDragao.height;
    const [normal, gn] = novoCanvas(w, h);
    gn.drawImage(imgDragao, 0, 0);

    // pixels pra dissolução: cada um se solta num instante, de baixo pra
    // cima (a linha de baixo primeiro), com um pouco de sorteio fixo
    const dados = gn.getImageData(0, 0, w, h).data;
    const lista = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (dados[i + 3]) lista.push([x, y, dados[i], dados[i + 1], dados[i + 2]]);
      }
    }
    const n = lista.length;
    const pixels = {
      n,
      x: new Int16Array(n),
      y: new Int16Array(n),
      solta: new Float32Array(n), // instante (ms) em que o pixel se solta
      cor: new Array(n),
      particula: new Uint8Array(n), // só uma parte vira partícula (desempenho)
    };
    const duracao = DISSOLVER_FIM - DISSOLVER_INICIO - 160;
    lista.forEach(([x, y, r, g, b], i) => {
      pixels.x[i] = x;
      pixels.y[i] = y;
      pixels.solta[i] = DISSOLVER_INICIO + ((h - 1 - y) / (h - 1)) * duracao + ruido(i * 0.37) * 160;
      pixels.cor[i] = `rgb(${r},${g},${b})`;
      pixels.particula[i] = ruido(i * 1.31) < 0.5 ? 1 : 0;
    });

    dragao = {
      w,
      h,
      normal,
      branco: variacao(imgDragao, () => [255, 255, 255]),
      vermelho: variacao(imgDragao, () => [255, 42, 90]),
      dourado: variacao(imgDragao, () => [255, 210, 60]),
      invertido: variacao(imgDragao, (r, g, b) => [255 - r, 255 - g, 255 - b]),
      pixels,
    };
  }

  return {
    dragao,
    arenas: { corrompida: montarArena("corrompida"), purificada: montarArena("purificada") },
    // telas de rascunho reaproveitadas a cada quadro
    camadaDragao: novoCanvas(LARGURA, ALTURA),
    camadaHud: novoCanvas(LARGURA, 32),
    rascunho: novoCanvas(LARGURA, ALTURA),
  };
}
