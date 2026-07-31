import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DesafioIntro.css";
import slime from "../../assets/images/Slime.png";

// Falas exibidas em sequência, uma a cada clique na tela
const FALAS = [
  "Viajante! Que bom que chegou...",
  "Um Slime apareceu nas terras próximas e está bloqueando o caminho dos aldeões!",
  "Ninguém consegue passar enquanto ele estiver ali.",
  "Para derrotá-lo, você vai precisar provar seu conhecimento em JavaScript.",
  "Sua missão é simples: exibir uma informação no console.",
];

function DesafioIntro() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();

  const [indice, setIndice] = useState(0);
  const [mostrarEnunciado, setMostrarEnunciado] = useState(false);

  function handleCliqueTela() {
    if (mostrarEnunciado) return;

    if (indice < FALAS.length - 1) {
      setIndice((i) => i + 1);
    } else {
      setMostrarEnunciado(true);
    }
  }

  function handleIniciarDesafio(e) {
    e.stopPropagation();
    // Próxima etapa: tela do editor de código do desafio
    navigate(`/codigo/${mundoId}/${dificuldade}/${desafioId}`);
  }

  function handleVoltar(e) {
    e.stopPropagation();
    navigate(-1);
  }

  return (
    <div className="intro-container" onClick={handleCliqueTela}>
      <button type="button" className="intro-voltar" onClick={handleVoltar}>
        ← Voltar
      </button>

      {/* Cena — apenas o slime, em destaque e centralizado, flutuando */}
      <div className="intro-cena">
        <img
          src={slime}
          alt="Slime"
          className="intro-slime-destaque"
          draggable={false}
        />
      </div>

      {/* Balão de fala (aparece até a última fala) */}
      {!mostrarEnunciado && (
        <div className="intro-balao">
          <p className="intro-fala" key={indice}>
            {FALAS[indice]}
          </p>

          <div className="intro-rodape-balao">
            <div className="intro-pontos">
              {FALAS.map((_, i) => (
                <span
                  key={i}
                  className={`intro-ponto ${i <= indice ? "intro-ponto-ativo" : ""}`}
                />
              ))}
            </div>
            <span className="intro-continuar">toque para continuar ▶</span>
          </div>
        </div>
      )}

      {/* Enunciado do desafio (aparece após a última fala) */}
      {mostrarEnunciado && (
        <div className="intro-enunciado-overlay">
          <div className="intro-enunciado-card" onClick={(e) => e.stopPropagation()}>
            <span className="intro-enunciado-tag">DESAFIO {desafioId}</span>
            <h2 className="intro-enunciado-titulo">Print de Dados</h2>
            <p className="intro-enunciado-texto">
              Faça um print de dados em JavaScript.
            </p>
            <p className="intro-enunciado-dica">
              💡 Dica: utilize o comando <code>console.log()</code> para exibir uma
              informação no console.
            </p>

            <button
              type="button"
              className="intro-botao-iniciar"
              onClick={handleIniciarDesafio}
            >
              Iniciar Desafio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesafioIntro;