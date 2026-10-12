import { iconeDoItem } from "../data/spritesPersonagem";

// Ícone de um item de inventário: o ícone gerado da camada do item
// (Item.imagemUrl é a chave do sprite — ver data/spritesPersonagem.js) e, se
// o item ainda não tem arte, o emoji de Item.icone.
export default function IconeItem({ item, classeImagem, classeEmoji }) {
  const imagem = iconeDoItem(item?.imagemUrl);
  if (imagem) {
    return (
      <img
        src={imagem}
        alt=""
        className={classeImagem}
        style={{ imageRendering: "pixelated" }}
        draggable={false}
      />
    );
  }
  return <span className={classeEmoji}>{item?.icone ?? "❔"}</span>;
}
