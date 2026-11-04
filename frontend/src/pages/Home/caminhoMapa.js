// Trajeto que o personagem percorre no mapa da Home ao ir de um portal pro
// outro (ver PersonagemNoMapa.jsx). Os pontos estão em % do tamanho da
// imagem do mapa — o mesmo sistema de top/left dos PORTAIS em Home.jsx — e
// acompanham a estrada de terra desenhada em mapa.webp. Se o mapa ou a
// posição de um portal mudar, ajuste os pontos aqui também: o ponto com
// "portal" precisa bater com o top/left daquele portal.
export const CAMINHO = [
  { x: 51.3, y: 12 }, // estrada acima da Vila Inicial (ponto de partida da 1ª viagem)
  { x: 50, y: 16, portal: "1" },
  { x: 50.8, y: 17.6 },
  { x: 50.5, y: 19.1 },
  { x: 49.4, y: 21.5 },
  { x: 50.5, y: 23.9 },
  { x: 51.5, y: 25.7 },
  { x: 49.4, y: 27.5 },
  { x: 46.8, y: 29.3 },
  { x: 47.3, y: 31.1 },
  { x: 49.9, y: 32.9 },
  { x: 50.5, y: 34.7 },
  { x: 47.3, y: 36.5 },
  { x: 44.6, y: 38.3 },
  { x: 44.1, y: 40.7 },
  { x: 45.7, y: 43.1 },
  { x: 47.3, y: 45.5 },
  { x: 50, y: 47, portal: "2" },
  { x: 49.4, y: 52.6 },
  { x: 49.4, y: 57.4 },
  { x: 49.4, y: 62.2 },
  { x: 49.1, y: 66.4 },
  { x: 50, y: 71, portal: "3" },
];

const indiceDoPortal = (portalId) => CAMINHO.findIndex((ponto) => ponto.portal === portalId);

// Pontos da caminhada de um portal até outro, na ordem em que são
// percorridos (subindo o mapa, o trecho vem invertido). Sem portal de
// origem (primeira viagem), sai do início da estrada. Mesmo portal de
// origem e destino: um ponto só — o personagem aparece e já entra.
export function trechoEntre(origemId, destinoId) {
  const fim = indiceDoPortal(destinoId);
  const inicio = origemId ? indiceDoPortal(origemId) : 0;
  if (fim < 0) return [];
  if (inicio < 0) return [CAMINHO[fim]];

  return inicio <= fim
    ? CAMINHO.slice(inicio, fim + 1)
    : CAMINHO.slice(fim, inicio + 1).reverse();
}

// Último portal em que o jogador entrou neste navegador — é de lá que o
// personagem sai na próxima viagem. Só conveniência visual: sem storage
// (aba anônima, bloqueado), ele simplesmente sai do início da estrada.
const CHAVE_ULTIMO_PORTAL = "codejourney:ultimoPortal";

export function lerUltimoPortal() {
  try {
    return localStorage.getItem(CHAVE_ULTIMO_PORTAL);
  } catch {
    return null;
  }
}

export function salvarUltimoPortal(portalId) {
  try {
    localStorage.setItem(CHAVE_ULTIMO_PORTAL, portalId);
  } catch {
    // sem storage — a próxima viagem sai do início da estrada
  }
}
