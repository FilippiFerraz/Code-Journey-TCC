// Gera as versões leves (WebP) das artes pesadas do jogo.
// Uso (dentro de frontend/): npm run imagens:otimizar
//
// Fluxo:
//   arte-original/<arquivo>.png|jpg|gif   -> a arte de verdade (alta resolução), que NÃO entra no site
//   src/assets/images/<arquivo>.webp      -> versão leve gerada aqui, que o site realmente carrega
//
// Sem isso o site baixava ~25 MB de PNG só pra mostrar as telas (um único
// fundo tinha 6,6 MB). O WebP em qualidade 80-88 fica visualmente idêntico e
// pesa cerca de 90% menos. "max" limita o lado maior em pixels: não adianta
// carregar 2816 px pra uma imagem que aparece com no máximo 720 px de largura
// (1440 já cobre telas de alta densidade).
//
// Arte nova pesada? Coloque o original em arte-original/, adicione uma linha
// em CONFIG abaixo, rode o comando e importe o .webp gerado no código.
//
// Só algumas imagens? Passe um trecho do nome: `npm run imagens:otimizar -- _p2`
// processa só os arquivos com "_p2" no nome (o resto fica como está).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINAIS = path.join(RAIZ, "arte-original");
const DESTINO = path.join(RAIZ, "src/assets/images");

// q = qualidade WebP (0-100), max = lado maior em px, animado = GIF -> WebP animado,
// origem = gerar a partir de outro original (ex: a prévia pequena do mapa),
// aparar = corta a margem transparente em volta do sprite,
// espelhar = vira a arte na horizontal (sprite que olha pro lado errado),
// recortarFundo = apaga o fundo claro (branco ou "xadrez" de transparência
// falsa) que veio pintado na arte — ver recortarFundoClaro() abaixo
const CONFIG = {
  // fundos de cena (aparecem com no máximo 720 px de largura)
  "Fundo_personagem.png": { max: 1440, q: 80 },
  // fundos das batalhas: aparecem com ~480 px (até 1,4x no zoom da cena)
  "Fundo_desafio_3_P1.png": { max: 1024, q: 82 },
  "Fundo_desafio_4_P1.png": { max: 1024, q: 82 },
  "Fundo_desafio_6_P1.png": { max: 1024, q: 82 },
  "Fundo_batalha2.png": { q: 85 },
  "Fundo_Personagem_Perfil.png": { q: 85 },
  "fundo_batalha_1_portal_3.jpg": { q: 82 },
  "fundo_batalha_2_portal_3.jpg": { q: 82 },
  // fundo do desafio 2 do portal 3 (original 2752x1536, 2,5 MB)
  "Fundo_desafio2_p3.jpg": { max: 1440, q: 82 },
  "fundo_desafio3_p3.jpg": { max: 1440, q: 82 },
  "fundo_desafio4_p3.jpg": { max: 1440, q: 82 },
  "fundo_desafio5_p3.jpg": { max: 1440, q: 82 },
  "fundo_desafio6_p3.png": { max: 1440, q: 82 },
  "fundo_ranking.jpg": { q: 80 },
  // fundo das telas de Login/Cadastro: ocupa a janela inteira (cover), então
  // fica na largura original (1824 px)
  "Fundo_Login.png": { q: 82 },
  "fundo_tela_selcionardesafio.png": { q: 80 },
  // mapa da Home: é a maior imagem do site e o que define o tempo da Home.
  // Em 74 fica visualmente igual ao 84 (testado com zoom de 2x) e ~25% menor.
  "mapa.png": { q: 74 },
  // prévia minúscula do mapa: aparece na hora, ampliada em pixel art, até o
  // mapa de verdade chegar (ver .home-mapa em Home.css)
  "mapa-previa.png": { origem: "mapa.png", max: 240, q: 50 },
  // inimigos (aparecem com no máximo ~330 px de largura)
  "bruxa_inimigo.png": { max: 800, q: 85 },
  "rei_goblin_inimigo.png": { max: 800, q: 85 },
  "mercador_inimigo.png": { max: 800, q: 85 },
  "esqueleto_inimigo.png": { max: 800, q: 85 },
  "inimigo_1_portal3.png": { q: 88 },
  "inimigo_desafio2_p3.png": { q: 88 },
  "inimigo_desafio3_p3.png": { q: 88 },
  "inimigo_desafio4_p3.png": { q: 88 },
  "inimigo_desafio5_p3.png": { q: 88 },
  // Rei Tiribyte (Desafio do Rei) — aparece com no máximo ~330 px de largura
  "rei_tiribyte.png": { max: 800, q: 85 },
  // interface
  "caldeirao.png": { max: 512, q: 85 },
  "logo.png": { max: 320, q: 85 },
  "Mago.png": { max: 420, q: 85 },
  "Detalhe_desafios.png": { q: 85 },
  // GIF do portal aparece com 85 px (3 vezes na Home): 180 px cobre telas 2x
  "Portal_Desafios.gif": { max: 180, q: 80, animado: true },
  // cadeado dos portais trancados: aparece com 40 px
  "Cadeado_portal.png": { max: 120, q: 85 },
  // Lojinha do Mago: a casinha do mapa (aparece com ~16% da largura do
  // mapa) e o fundo da tela da loja (o mago pintado nele foi apagado — o
  // vendedor é o Mago.webp, desenhado por cima em Loja.jsx)
  "lojinha.png": { max: 420, q: 88 },
  "fundo_loja.png": { max: 1440, q: 82 },
  // mochila dos itens de ajuda nas telas de desafio: aparece com ~44 px
  "mochila.png": { max: 128, q: 90 },
  // Portal 2 (Acampamento Goblin) — fundos das batalhas e inimigos (ver
  // CENAS_PORTAL_2 em src/data/cenasPortal3.js)
  "fundo_desafio1_p2.jpg": { max: 1440, q: 82 },
  "fundo_desafio2_p2.jpg": { max: 1440, q: 82 },
  "fundo_desafio3_p2.jpg": { max: 1440, q: 82 },
  "fundo_desafio4_p2.jpg": { max: 1440, q: 82 },
  "fundo_desafio5_p2.jpg": { max: 1440, q: 82 },
  "fundo_desafio6_p2.jpg": { max: 1440, q: 82 },
  "inimigo1_desafio1_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo2_desafio2_p2.png": { aparar: true, espelhar: true, q: 90 },
  // estes dois vieram em JPG, com o fundo branco/xadrez pintado na arte
  "inimigo3_desafio2_p2.jpg": { recortarFundo: true, aparar: true, max: 512, q: 90 },
  "inimigo4_desafio3_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo5_desafio3_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo6_desafio3_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo7_desafio4_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo8_desafio4_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo9_desafio4_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo10_desafio5_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo11_desafio6_p2.png": { aparar: true, espelhar: true, q: 90 },
  "inimigo12_desafio6_p2.jpg": { recortarFundo: true, aparar: true, max: 512, q: 90 },
};

// Apaga o fundo claro de uma arte que veio sem transparência:
// 1. a partir das bordas, "pinta" de transparente todo pixel claro e sem cor
//    (branco e os cinzas do xadrez) ligado a elas — o personagem, que tem
//    cor, interrompe o preenchimento e fica intacto;
// 2. ilhas grandes desse mesmo fundo que ficaram cercadas (o vão entre as
//    pernas) também somem — brilhos pequenos DENTRO do personagem (olho,
//    reflexo da lâmina) ficam, por serem pequenos;
// 3. a sombra pintada no chão (mancha neutra grande no rodapé, encostada no
//    fundo) vira uma sombra preta translúcida, que funciona sobre qualquer
//    cenário;
// 4. apaga a franja clara de 1px que o JPEG deixa borrada em volta.
async function recortarFundoClaro(entrada) {
  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const neutro = (i) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) < 28;
  };
  const luz = (i) => Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  const ehFundo = (i) => neutro(i) && luz(i) > 200;
  const vizinhos = (i) => {
    const x = i % w;
    const v = [];
    if (x > 0) v.push(i - 1);
    if (x < w - 1) v.push(i + 1);
    if (i >= w) v.push(i - w);
    if (i < w * (h - 1)) v.push(i + w);
    return v;
  };
  // pixels ligados a `inicio` que passam em `aceita` (preenchimento 4-vizinhos)
  const regiao = (inicio, aceita, visto) => {
    const pixels = [];
    const pilha = [inicio];
    while (pilha.length) {
      const i = pilha.pop();
      if (visto[i] || !aceita(i)) continue;
      visto[i] = 1;
      pixels.push(i);
      pilha.push(...vizinhos(i));
    }
    return pixels;
  };

  const apagado = new Uint8Array(w * h);
  // 1. fundo ligado às bordas
  const bordas = [];
  for (let x = 0; x < w; x++) bordas.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) bordas.push(y * w, y * w + w - 1);
  for (const i of bordas) regiao(i, ehFundo, apagado);

  // 2. ilhas grandes de fundo cercadas pelo personagem
  const vistoIlha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (apagado[i] || vistoIlha[i] || !ehFundo(i)) continue;
    const ilha = regiao(i, (j) => !apagado[j] && ehFundo(j), vistoIlha);
    if (ilha.length >= 600) for (const j of ilha) apagado[j] = 1;
  }

  // 3. sombra do chão: neutra, mais escura que o fundo, no rodapé (último
  //    quarto da imagem) e encostada no fundo apagado
  const sombra = new Uint8Array(w * h);
  const inicioRodape = Math.floor(h * 0.75) * w;
  const ehSombra = (i) => i >= inicioRodape && !apagado[i] && neutro(i) && luz(i) <= 200;
  const vistoSombra = new Uint8Array(w * h);
  for (let i = inicioRodape; i < w * h; i++) {
    if (vistoSombra[i] || !ehSombra(i)) continue;
    const mancha = regiao(i, ehSombra, vistoSombra);
    const encostaNoFundo = mancha.some((j) => vizinhos(j).some((k) => apagado[k]));
    if (mancha.length >= 500 && encostaNoFundo) for (const j of mancha) sombra[j] = 1;
  }

  for (let i = 0; i < w * h; i++) {
    if (sombra[i]) {
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 110;
      continue;
    }
    if (apagado[i]) {
      data[i * 4 + 3] = 0;
      continue;
    }
    const x = i % w;
    const vizinhoApagado =
      (x > 0 && apagado[i - 1]) || (x < w - 1 && apagado[i + 1]) || apagado[i - w] || apagado[i + w];
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    if (vizinhoApagado && Math.min(r, g, b) > 165) data[i * 4 + 3] = 0;
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

const filtro = process.argv[2];

fs.mkdirSync(ORIGINAIS, { recursive: true });
let totalAntes = 0;
let totalDepois = 0;

for (const [arquivo, opcoes] of Object.entries(CONFIG)) {
  if (filtro && !arquivo.includes(filtro)) continue;
  // o original pode estar em arte-original/ (já movido) ou ainda em src/assets/images/
  const nomeOrigem = opcoes.origem ?? arquivo;
  let origem = path.join(ORIGINAIS, nomeOrigem);
  if (!fs.existsSync(origem)) {
    const antigo = path.join(DESTINO, nomeOrigem);
    if (!fs.existsSync(antigo)) {
      console.log("  (pulado — não achei)", arquivo);
      continue;
    }
    fs.renameSync(antigo, origem); // guarda a arte original fora do site
  }

  let imagem = opcoes.recortarFundo
    ? sharp(await recortarFundoClaro(origem))
    : sharp(origem, { animated: Boolean(opcoes.animado) });
  if (opcoes.aparar) {
    // trim() precisa terminar antes do resize — senão os dois rodam juntos
    // e o resize usa o tamanho de antes do corte
    imagem = sharp(await imagem.trim({ threshold: 1 }).png().toBuffer());
  }
  // espelhado na própria arte (não por CSS): as animações de ataque/dano/
  // morte usam transform, e um espelho por CSS inverteria o movimento delas
  if (opcoes.espelhar) imagem = imagem.flop();
  if (opcoes.max) {
    imagem = opcoes.animado
      ? imagem.resize({ width: opcoes.max, withoutEnlargement: true })
      : imagem.resize({ width: opcoes.max, height: opcoes.max, fit: "inside", withoutEnlargement: true });
  }
  const saida = path.join(DESTINO, arquivo.replace(/\.[^.]+$/, ".webp"));
  await imagem.webp({ quality: opcoes.q, alphaQuality: opcoes.q, effort: 5 }).toFile(saida);

  const antes = fs.statSync(origem).size;
  const depois = fs.statSync(saida).size;
  totalAntes += antes;
  totalDepois += depois;
  console.log(
    arquivo.padEnd(34),
    (Math.round(antes / 1024) + " KB").padStart(9),
    "->",
    (Math.round(depois / 1024) + " KB").padStart(7),
    "(-" + Math.round((1 - depois / antes) * 100) + "%)"
  );
}

console.log(
  "\nTotal:",
  Math.round(totalAntes / 1024) + " KB ->",
  Math.round(totalDepois / 1024) + " KB",
  "(-" + Math.round((1 - totalDepois / totalAntes) * 100) + "%)"
);
