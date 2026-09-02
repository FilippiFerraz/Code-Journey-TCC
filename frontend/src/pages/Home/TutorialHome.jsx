import { useEffect, useState } from "react";
import BotaoPixel from "../../components/BotaoPixel";
import "./TutorialHome.css";
import mago from "../../assets/images/Mago.png";

// Cada passo aponta pra um elemento real da tela via [data-tutorial-alvo]
// (portal na Home, ícones no rodapé de MainLayout.jsx). O tutorial mede a
// posição real desse elemento e desenha um "spotlight" ao redor dele.
const PASSOS = [
  {
    alvo: '[data-tutorial-alvo="portal-desafios"]',
    titulo: "Portais de desafio",
    texto:
      "Esses portais no mapa levam aos mundos de desafios! Toque em um portal pra escolher a dificuldade e começar a resolver desafios de programação.",
  },
  {
    alvo: '[data-tutorial-alvo="perfil"]',
    titulo: "Seu perfil",
    texto:
      "Aqui é o seu perfil — veja seu personagem, suas estatísticas e os itens que você já conquistou.",
  },
  {
    alvo: '[data-tutorial-alvo="ranking"]',
    titulo: "Ranking mundial",
    texto: "Aqui fica o ranking — compare seu XP com o de outros jogadores pelo mundo todo.",
  },
  {
    alvo: '[data-tutorial-alvo="configuracoes"]',
    titulo: "Configurações",
    texto: "E aqui ficam as configurações do jogo, pra ajustar tudo do seu jeito.",
  },
];

function medirAlvo(seletor) {
  const elemento = document.querySelector(seletor);
  if (!elemento) return null;

  const retangulo = elemento.getBoundingClientRect();

  // getBoundingClientRect() é sempre relativo à janela do navegador, mas o
  // spotlight (position:fixed) fica contido dentro de .app-frame — o
  // transform em App.css cria um novo "containing block" pra fixed. No
  // celular os dois coincidem (offset 0); no desktop, com a moldura
  // centralizada, é preciso descontar esse deslocamento.
  const moldura = document.querySelector(".app-frame")?.getBoundingClientRect();
  const deslocamentoX = moldura?.left ?? 0;
  const deslocamentoY = moldura?.top ?? 0;

  return {
    top: retangulo.top - deslocamentoY,
    left: retangulo.left - deslocamentoX,
    width: retangulo.width,
    height: retangulo.height,
  };
}

// Respiro (em px) entre o elemento destacado e o anel do spotlight.
const FOLGA_SPOTLIGHT = 10;

function TutorialHome({ onConcluir }) {
  const [indice, setIndice] = useState(0);
  const [area, setArea] = useState(null);

  const passo = PASSOS[indice];
  const ultimoPasso = indice === PASSOS.length - 1;

  useEffect(() => {
    function atualizarArea() {
      setArea(medirAlvo(passo.alvo));
    }

    atualizarArea();
    window.addEventListener("resize", atualizarArea);
    window.addEventListener("scroll", atualizarArea, true);

    return () => {
      window.removeEventListener("resize", atualizarArea);
      window.removeEventListener("scroll", atualizarArea, true);
    };
  }, [passo.alvo]);

  function avancar() {
    if (ultimoPasso) {
      onConcluir();
    } else {
      setIndice((i) => i + 1);
    }
  }

  return (
    <div className="tutorial-overlay" onClick={avancar}>
      {area && (
        <div
          className="tutorial-spot"
          style={{
            top: area.top - FOLGA_SPOTLIGHT,
            left: area.left - FOLGA_SPOTLIGHT,
            width: area.width + FOLGA_SPOTLIGHT * 2,
            height: area.height + FOLGA_SPOTLIGHT * 2,
          }}
        />
      )}

      <div className="tutorial-balao" onClick={(e) => e.stopPropagation()}>
        <img src={mago} alt="" className="tutorial-guia" draggable={false} />

        <div className="tutorial-balao-corpo">
          <strong className="tutorial-balao-titulo">{passo.titulo}</strong>
          <p className="tutorial-balao-fala" key={indice}>
            {passo.texto}
          </p>

          <div className="tutorial-rodape">
            <div className="tutorial-pontos">
              {PASSOS.map((_, i) => (
                <span
                  key={i}
                  className={`tutorial-ponto ${i <= indice ? "tutorial-ponto-ativo" : ""}`}
                />
              ))}
            </div>

            <BotaoPixel
              className="tutorial-botao"
              classeMiolo="tutorial-botao-miolo"
              onClick={avancar}
            >
              {ultimoPasso ? "Entendi!" : "Próximo ▶"}
            </BotaoPixel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialHome;
