import AvatarPersonagem from "../../components/AvatarPersonagem";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import "./GrupoInimigos.css";

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

// Tamanho de um inimigo na cena: `altura` (px) quando o desafio define —
// sprites de proporções diferentes ficam com a mesma presença lado a lado —
// ou, como antes, `largura`. `contexto` = "intro" usa alturaIntro/larguraIntro.
// A altura passa pela --escala-inimigos (GrupoInimigos.css), que encolhe os
// grupos em tela de celular.
function tamanhoDe(inimigo, contexto, larguraPadrao) {
  const altura = contexto === "intro" ? inimigo.alturaIntro : inimigo.altura;
  if (altura) return { height: `calc(${altura}px * var(--escala-inimigos, 1))`, width: "auto" };
  const largura = contexto === "intro" ? inimigo.larguraIntro : inimigo.largura;
  return largura || larguraPadrao ? { width: largura || larguraPadrao } : undefined;
}

// Todos os inimigos de um desafio. Com um só, é o SpriteInimigo de sempre
// (mesmas classes e posição de antes). Com vários, ficam lado a lado num
// grupo que ocupa o lugar do inimigo na cena — e TODOS recebem a mesma
// className de animação, então atacam, sentem o golpe e morrem juntos, no
// mesmo instante: a tela continua controlando um "inimigo" só (uma barra de
// vida, um estado de ataque/dano/morte), que aqui é desenhado como o grupo.
//
// `classeGrupo` posiciona o grupo na tela (ver GrupoInimigos.css).
export function GrupoInimigos({ inimigos, className = "", classeGrupo = "", contexto, larguraPadrao, nome }) {
  if (inimigos.length === 1) {
    return (
      <SpriteInimigo inimigo={inimigos[0]} className={className} style={tamanhoDe(inimigos[0], contexto, larguraPadrao)} />
    );
  }

  return (
    <div className={`grupo-inimigos ${classeGrupo}`} role="group" aria-label={nome}>
      {inimigos.map((inimigo, i) => (
        <SpriteInimigo
          key={i}
          inimigo={inimigo}
          className={`grupo-inimigos-membro ${className}`}
          style={tamanhoDe(inimigo, contexto, larguraPadrao)}
        />
      ))}
    </div>
  );
}
