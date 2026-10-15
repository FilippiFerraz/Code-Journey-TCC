import { camadasDoPersonagem } from "../data/spritesPersonagem";
import { useAparenciaPropria } from "../hooks/usePersonagemAvatar";
import "./AvatarPersonagem.css";

// Guerreiro montado em camadas: a base (da aparência escolhida) e, por
// cima, a camada de cada item equipado, na ordem de ORDEM_CAMADAS (ver
// data/spritesPersonagem.js).
//
// `itensEquipados`: lista de itens no formato { tipo, imagemUrl } (o Item do
// backend). Item sem camada desenhada é ignorado no visual.
//
// `aparencia`: id da aparência (Personagem.aparencia). Sem a prop, usa a do
// jogador logado — passe-a ao desenhar o herói de OUTRA pessoa.
//
// `className` controla posição e tamanho — a tela precisa definir largura E
// altura (o sprite é quadrado), já que as camadas preenchem a caixa inteira.
export default function AvatarPersonagem({
  itensEquipados = [],
  aparencia,
  className = "",
  alt = "Seu personagem",
  style,
}) {
  const aparenciaPropria = useAparenciaPropria();
  const camadas = camadasDoPersonagem(itensEquipados, aparencia === undefined ? aparenciaPropria : aparencia);

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
