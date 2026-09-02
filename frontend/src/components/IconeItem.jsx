import { resolverImagemItem } from "../data/itemImagens";

// Ícone de um item de inventário: usa a imagem real do item quando existe
// (Item.imagemUrl resolvido via data/itemImagens.js) e cai pro emoji
// (Item.icone) quando o item ainda não tem arte própria.
export default function IconeItem({ item, classeImagem, classeEmoji }) {
  const imagem = resolverImagemItem(item?.imagemUrl);
  if (imagem) {
    return <img src={imagem} alt="" className={classeImagem} draggable={false} />;
  }
  return <span className={classeEmoji}>{item?.icone ?? "❔"}</span>;
}
