import { Crown } from "pixelarticons/react/Crown.js";
import { Feather } from "pixelarticons/react/Feather.js";
import { Package } from "pixelarticons/react/Package.js";
import { Shield } from "pixelarticons/react/Shield.js";
import { Sword } from "pixelarticons/react/Sword.js";
import { iconeDoItem } from "../data/spritesPersonagem";
import IconePixel from "./IconePixel";

// Ícone de reserva por slot (Item.tipo), pra item que ainda não tem arte.
const ICONE_POR_SLOT = { arma: Sword, peitoral: Shield, capacete: Crown, costas: Feather };

// Ícone de um item de inventário: o ícone gerado da camada do item
// (Item.imagemUrl é a chave do sprite — ver data/spritesPersonagem.js) e, se
// o item ainda não tem arte, um ícone em pixel art do slot dele
// (pixelarticons). O emoji de Item.icone no banco não é mais usado aqui.
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
  return (
    <span className={classeEmoji}>
      <IconePixel icone={ICONE_POR_SLOT[item?.tipo] ?? Package} />
    </span>
  );
}
