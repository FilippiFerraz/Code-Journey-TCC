import { BASE_PERSONAGEM, ORDEM_CAMADAS, camadaDoItem } from "../data/spritesPersonagem";
import "./AvatarPersonagem.css";

// Guerreiro montado em camadas: a base e, por cima, a camada de cada item
// equipado, na ordem de ORDEM_CAMADAS (ver data/spritesPersonagem.js).
//
// `itensEquipados`: lista de itens no formato { tipo, imagemUrl } (o Item do
// backend). Item sem camada desenhada é ignorado no visual.
//
// `className` controla posição e tamanho — a tela precisa definir largura E
// altura (o sprite é quadrado), já que as camadas preenchem a caixa inteira.
export default function AvatarPersonagem({ itensEquipados = [], className = "", alt = "Seu personagem", style }) {
  const camadas = ORDEM_CAMADAS.map((slot) => {
    if (slot === "base") return { slot, src: BASE_PERSONAGEM };
    const item = itensEquipados.find((it) => it?.tipo === slot);
    return { slot, src: camadaDoItem(item?.imagemUrl) };
  }).filter((camada) => camada.src);

  return (
    <div className={`avatar-personagem ${className}`} style={style} role="img" aria-label={alt}>
      <div className="avatar-personagem-camadas">
        {camadas.map((camada) => (
          <img key={camada.slot} src={camada.src} alt="" draggable={false} />
        ))}
      </div>
    </div>
  );
}
