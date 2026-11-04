import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BotaoPixel from "../../components/BotaoPixel";
import "./TutorialHome.css";
import mago from "../../assets/images/Mago.webp";

// Cada passo aponta pra um elemento real da tela via [data-tutorial-alvo]
// (portal na Home, ícones no rodapé/sidebar de MainLayout.jsx). O tutorial
// mede a posição real desse elemento, desenha um "spotlight" ao redor dele
// e coloca o balão do guia AO LADO do alvo (nunca por cima), com uma
// setinha apontando pra ele — ver posicionarBalao.
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

// Respiro (em px) entre o elemento destacado e o anel do spotlight.
const FOLGA_SPOTLIGHT = 10;
// Distância entre o anel do spotlight e o balão (cabe a setinha).
const DISTANCIA_BALAO = 16;
// Margem mínima entre o balão e a borda da tela.
const MARGEM_TELA = 12;
const LARGURA_MAXIMA_BALAO = 360;
// Altura estimada só pro primeiro quadro, antes de o balão ser medido.
const ALTURA_ESTIMADA_BALAO = 170;

// Primeiro elemento VISÍVEL que bate com o seletor — o mesmo item de
// navegação existe no rodapé (mobile) e na sidebar (desktop), e só um deles
// está na tela.
function encontrarAlvo(seletor) {
  return [...document.querySelectorAll(seletor)].find((el) => el.getClientRects().length > 0) ?? null;
}

function medirAlvo(seletor) {
  const elemento = encontrarAlvo(seletor);
  if (!elemento) return null;

  const retangulo = elemento.getBoundingClientRect();

  // getBoundingClientRect() é sempre relativo à janela do navegador, mas o
  // spotlight e o balão (position:fixed) ficam contidos dentro de
  // .app-frame — o transform em App.css cria um novo "containing block"
  // pra fixed. No celular os dois coincidem (offset 0); no desktop, com a
  // moldura centralizada, é preciso descontar esse deslocamento.
  const moldura = document.querySelector(".app-frame")?.getBoundingClientRect();

  return {
    top: retangulo.top - (moldura?.top ?? 0),
    left: retangulo.left - (moldura?.left ?? 0),
    width: retangulo.width,
    height: retangulo.height,
    larguraTela: moldura?.width ?? window.innerWidth,
    alturaTela: moldura?.height ?? window.innerHeight,
  };
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), Math.max(minimo, maximo));
}

// Onde o balão fica em relação ao alvo:
// - "direita": alvo estreito no lado esquerdo com espaço sobrando à direita
//   (itens da sidebar no desktop);
// - "acima": alvo na metade de baixo da tela (rodapé no celular);
// - "abaixo": alvo na metade de cima (portal no mapa).
// `seta` é a posição (px, dentro do balão) da ponta que aponta pro centro
// do alvo.
function posicionarBalao(area, alturaBalao) {
  const { larguraTela, alturaTela } = area;
  const largura = Math.min(LARGURA_MAXIMA_BALAO, larguraTela - MARGEM_TELA * 2);
  const centroX = area.left + area.width / 2;
  const centroY = area.top + area.height / 2;
  const afastamento = FOLGA_SPOTLIGHT + DISTANCIA_BALAO;

  const inicioDireita = area.left + area.width + afastamento;
  if (centroX < larguraTela * 0.35 && inicioDireita + largura + MARGEM_TELA <= larguraTela) {
    const top = limitar(centroY - alturaBalao / 2, MARGEM_TELA, alturaTela - alturaBalao - MARGEM_TELA);
    return { lado: "direita", top, left: inicioDireita, largura, seta: limitar(centroY - top, 22, alturaBalao - 22) };
  }

  const left = limitar(centroX - largura / 2, MARGEM_TELA, larguraTela - largura - MARGEM_TELA);
  const seta = limitar(centroX - left, 22, largura - 22);
  if (centroY > alturaTela / 2) {
    return { lado: "acima", top: area.top - afastamento - alturaBalao, left, largura, seta };
  }
  return { lado: "abaixo", top: area.top + area.height + afastamento, left, largura, seta };
}

function TutorialHome({ onConcluir }) {
  const [indice, setIndice] = useState(0);
  const [area, setArea] = useState(null);
  const [alturaBalao, setAlturaBalao] = useState(ALTURA_ESTIMADA_BALAO);
  const balaoRef = useRef(null);

  const passo = PASSOS[indice];
  const ultimoPasso = indice === PASSOS.length - 1;

  useEffect(() => {
    // Alvo fora da tela (ex: celular pequeno com o mapa rolado): traz pra
    // perto do centro antes de medir.
    const elemento = encontrarAlvo(passo.alvo);
    const retangulo = elemento?.getBoundingClientRect();
    if (retangulo && (retangulo.top < 0 || retangulo.bottom > window.innerHeight)) {
      elemento.scrollIntoView({ block: "center" });
    }

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

  // O texto de cada passo tem um tamanho: mede o balão de verdade antes de
  // pintar, pra "acima" e "direita" ficarem colados no alvo sem cobrir.
  // (a largura do balão depende da tela, então muda junto com `area`)
  useLayoutEffect(() => {
    const altura = balaoRef.current?.offsetHeight;
    if (altura) setAlturaBalao(altura);
  }, [indice, area]);

  function avancar() {
    if (ultimoPasso) {
      onConcluir();
    } else {
      setIndice((i) => i + 1);
    }
  }

  const posicao = area ? posicionarBalao(area, alturaBalao) : null;

  return (
    <div className={`tutorial-overlay ${area ? "tutorial-overlay--com-spot" : ""}`} onClick={avancar}>
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

      <div
        ref={balaoRef}
        className={`tutorial-balao tutorial-balao--guiado ${
          posicao ? `tutorial-balao--${posicao.lado}` : "tutorial-balao--sem-alvo"
        }`}
        style={
          posicao
            ? { top: posicao.top, left: posicao.left, width: posicao.largura, "--seta": `${posicao.seta}px` }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-live="polite"
        aria-label={`Tutorial, passo ${indice + 1} de ${PASSOS.length}: ${passo.titulo}`}
      >
        {/* key: o conteúdo "entra" de novo a cada passo, enquanto a caixa
            desliza até o próximo alvo */}
        <div className="tutorial-balao-corpo" key={indice}>
          <img src={mago} alt="" className="tutorial-guia" draggable={false} />

          <div className="tutorial-balao-texto">
            <strong className="tutorial-balao-titulo">{passo.titulo}</strong>
            <p className="tutorial-balao-fala">{passo.texto}</p>

            <div className="tutorial-rodape">
              <div className="tutorial-pontos" aria-hidden="true">
                {PASSOS.map((_, i) => (
                  <span
                    key={i}
                    className={`tutorial-ponto ${i <= indice ? "tutorial-ponto-ativo" : ""} ${
                      i === indice ? "tutorial-ponto-atual" : ""
                    }`}
                  />
                ))}
              </div>

              <BotaoPixel className="tutorial-botao" classeMiolo="tutorial-botao-miolo" onClick={avancar}>
                {ultimoPasso ? "Entendi!" : <>Próximo <i className="hn hn-play-solid" aria-hidden="true" /></>}
              </BotaoPixel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialHome;
