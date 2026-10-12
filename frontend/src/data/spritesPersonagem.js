// src/data/spritesPersonagem.js
//
// Personagem em camadas ("paper doll"): o guerreiro é a base.png e cada item
// equipado é uma camada transparente de 64x64, na mesma grade, empilhada por
// cima (ver components/AvatarPersonagem.jsx). Assim cada item novo é UM
// desenho, e não um sprite inteiro pra cada combinação de equipamentos.
//
// As camadas e os ícones são gerados por `npm run itens:gerar` (ver
// scripts/gerarItensPersonagem.mjs) e registrados aqui sozinhos via
// import.meta.glob — arte nova não exige editar este arquivo.
//
// A chave de um item é o caminho dentro de camadas/ sem extensão, ex:
// "peitoral/armadura--ferro". É o que fica salvo em Item.imagemUrl no banco.
import base from "../assets/personagem/base.png";

export const BASE_PERSONAGEM = base;

function porChave(arquivos) {
  return Object.fromEntries(
    Object.entries(arquivos).map(([caminho, url]) => [
      caminho.replace(/^.*\/(camadas|icones)\//, "").replace(/\.png$/, ""),
      url,
    ])
  );
}

const CAMADAS = porChave(
  import.meta.glob("../assets/personagem/camadas/**/*.png", { eager: true, import: "default" })
);
const ICONES = porChave(
  import.meta.glob("../assets/personagem/icones/**/*.png", { eager: true, import: "default" })
);

// Itens criados antes das camadas guardavam o NOME DO ARQUIVO do sprite
// antigo em imagemUrl. Continuam funcionando até o seed atualizar o banco.
const CHAVES_ANTIGAS = {
  "Item_Peitoral.png": "peitoral/armadura--ferro",
  "chapeu_goblin.png": "capacete/chapeu-goblin",
};

function normalizarChave(imagemUrl) {
  return CHAVES_ANTIGAS[imagemUrl] ?? imagemUrl;
}

export function camadaDoItem(imagemUrl) {
  return imagemUrl ? CAMADAS[normalizarChave(imagemUrl)] : undefined;
}

export function iconeDoItem(imagemUrl) {
  return imagemUrl ? ICONES[normalizarChave(imagemUrl)] : undefined;
}

// Ordem de empilhamento, de trás pra frente: a capa fica atrás do corpo e a
// arma na frente de tudo. "base" é o próprio guerreiro.
export const ORDEM_CAMADAS = ["costas", "base", "botas", "peitoral", "capacete", "arma"];
