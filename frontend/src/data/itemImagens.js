// src/data/itemImagens.js
//
// Mapeia o Item.imagemUrl salvo no backend (hoje só um nome de arquivo,
// não uma URL de verdade) pra imagem estática já empacotada pelo Vite.
// Itens sem entrada aqui (ou sem imagemUrl) caem no emoji de Item.icone.
import itemPeitoral from "../assets/images/Item_Peitoral.png";

const IMAGENS_POR_ARQUIVO = {
  "Item_Peitoral.png": itemPeitoral,
};

export function resolverImagemItem(imagemUrl) {
  return imagemUrl ? IMAGENS_POR_ARQUIVO[imagemUrl] : undefined;
}
