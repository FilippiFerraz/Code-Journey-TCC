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
// ?no-inline: cada aparência vira um arquivo próprio (cacheado pelo
// navegador), baixado só quando aparece, em vez de engordar o JavaScript.
import guerreira from "../assets/personagem/aparencias/guerreira.png?no-inline";
import guerreiraCapacete from "../assets/personagem/aparencias/guerreira--capacete.png?no-inline";
import guerreiraAfro from "../assets/personagem/aparencias/guerreira-afro.png?no-inline";
import guerreiraAfroCapacete from "../assets/personagem/aparencias/guerreira-afro--capacete.png?no-inline";
import guerreiroAfro from "../assets/personagem/aparencias/guerreiro-afro.png?no-inline";
import guerreiroAfroCapacete from "../assets/personagem/aparencias/guerreiro-afro--capacete.png?no-inline";

// Aparências do herói, escolhidas no primeiro acesso (EscolherAparencia.jsx)
// e salvas em Personagem.aparencia. Todas foram reduzidas na grade de
// base.png (ver scripts/gerarAparencias.mjs), então qualquer camada de item
// encaixa em qualquer uma. "capacete" é a mesma base com o cabelo aparado
// no contorno do capuz, usada quando há capacete equipado.
export const APARENCIAS = [
  { id: "guerreiro", nome: "Guerreiro", base, capacete: base },
  { id: "guerreiro-afro", nome: "Guerreiro", base: guerreiroAfro, capacete: guerreiroAfroCapacete },
  { id: "guerreira", nome: "Guerreira", base: guerreira, capacete: guerreiraCapacete },
  { id: "guerreira-afro", nome: "Guerreira", base: guerreiraAfro, capacete: guerreiraAfroCapacete },
];

export const APARENCIA_PADRAO = "guerreiro";

function aparenciaPorId(id) {
  return APARENCIAS.find((a) => a.id === id) ?? APARENCIAS[0];
}

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

// Ordem de empilhamento, de trás pra frente: a capa fica atrás do corpo, as
// luvas por cima das mangas da armadura, o escudo (na mão esquerda) na frente
// das luvas e a arma na frente de tudo. "base" é o próprio guerreiro.
export const ORDEM_CAMADAS = ["costas", "base", "botas", "peitoral", "luvas", "escudo", "capacete", "arma"];

// Imagens do personagem montado, de trás pra frente: a base da aparência e
// a camada de cada item equipado. Item sem camada desenhada é ignorado.
// Usado pelo AvatarPersonagem e pelas cenas em canvas (Rei, Cristais, Dragão).
export function camadasDoPersonagem(itensEquipados = [], aparencia) {
  const camadaDoSlot = (slot) => camadaDoItem(itensEquipados.find((it) => it?.tipo === slot)?.imagemUrl);
  const { base: corpo, capacete } = aparenciaPorId(aparencia);
  return ORDEM_CAMADAS.map((slot) => ({
    slot,
    src: slot === "base" ? (camadaDoSlot("capacete") ? capacete : corpo) : camadaDoSlot(slot),
  })).filter((camada) => camada.src);
}
