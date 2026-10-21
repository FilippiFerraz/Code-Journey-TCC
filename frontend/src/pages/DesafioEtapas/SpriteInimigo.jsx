import AvatarPersonagem from "../../components/AvatarPersonagem";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";

// Sprite do inimigo de um desafio do Portal 3 (ver data/cenasPortal3.js):
// a imagem dele ou — com `inimigo.clone` — uma cópia sombria do herói do
// jogador, com a MESMA aparência e os MESMOS itens equipados, virada pro
// herói, escurecida e com aura roxa (ver .inimigo-clone em
// DesafioEtapas.css). Usado na introdução e na batalha (normal e de chefe).
//
// A raiz recebe a className da tela, então as animações de dano, esquiva e
// derrota continuam funcionando; o espelho e o visual sombrio do clone
// ficam na caixa interna das camadas, sem conflitar com elas.
export default function SpriteInimigo({ inimigo, className = "", style }) {
  const itensEquipados = usePersonagemAvatar();

  if (inimigo.clone) {
    return (
      <AvatarPersonagem
        itensEquipados={itensEquipados}
        alt={inimigo.nome}
        className={`inimigo-clone ${className}`}
        style={style}
      />
    );
  }

  return (
    <img
      src={inimigo.imagem}
      alt={inimigo.nome}
      className={className}
      style={{ imageRendering: "pixelated", ...style }}
      draggable={false}
    />
  );
}
