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
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINAIS = path.join(RAIZ, "arte-original");
const DESTINO = path.join(RAIZ, "src/assets/images");

// q = qualidade WebP (0-100), max = lado maior em px, animado = GIF -> WebP animado,
// origem = gerar a partir de outro original (ex: a prévia pequena do mapa)
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
  "fundo_ranking.jpg": { q: 80 },
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
};

fs.mkdirSync(ORIGINAIS, { recursive: true });
let totalAntes = 0;
let totalDepois = 0;

for (const [arquivo, opcoes] of Object.entries(CONFIG)) {
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

  let imagem = sharp(origem, { animated: Boolean(opcoes.animado) });
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
