import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DesafioIntro.css";
import slime from "../../assets/images/Slime.png";
import goblinJS from "../../assets/images/GoblinJS.png";

// Enquanto a rota de desafios não existe no backend, o conteúdo fica aqui,
// espelhando os desafios definidos em ResolverDesafio.jsx (mesmo id, mesmo
// inimigo). Depois é só trocar por um GET /desafios/:mundoId/:dificuldade/:desafioId
const INTROS = {
  1: {
    inimigo: { imagem: slime, nome: "Slime" },
    falas: [
      "Viajante! Que bom que chegou...",
      "Um Slime apareceu nas terras próximas e está bloqueando o caminho dos aldeões!",
      "Ninguém consegue passar enquanto ele estiver ali.",
      "Para derrotá-lo, você vai precisar provar seu conhecimento em JavaScript.",
      "Sua missão é simples: exibir uma informação no console.",
    ],
    titulo: "Print de Dados",
    texto: "Faça um print de dados em JavaScript.",
    dica: "utilize o comando `console.log()` para exibir uma informação no console.",
  },
  2: {
    inimigo: { imagem: goblinJS, nome: "GoblinJS" },
    falas: [
      "Viajante! De novo por aqui...",
      "Um GoblinJS apareceu logo depois do Slime e também está bloqueando o caminho!",
      "Esse é mais esperto — ele gosta de confundir quem não entende bem os tipos do JavaScript.",
      "Para derrotá-lo, você vai precisar entender o que acontece quando uma variável é reatribuída.",
      "Sua missão: descobrir o valor e o tipo final de uma variável em JavaScript.",
    ],
    titulo: "Tipos na Atribuição",
    texto:
      "Descubra o valor e o tipo de uma variável em JavaScript depois que ela é reatribuída.",
    dica: "o operador `+` entre uma string e um número concatena os valores, não soma — o número é convertido para texto.",
  },
};

// Quebra a dica em partes, tratando texto entre `crases` como trecho de código
function renderDica(dica) {
  return dica.split("`").map((parte, i) =>
    i % 2 === 1 ? <code key={i}>{parte}</code> : parte
  );
}

function DesafioIntro() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();

  const intro = INTROS[desafioId] || INTROS[1];

  const [indice, setIndice] = useState(0);
  const [mostrarEnunciado, setMostrarEnunciado] = useState(false);

  function handleCliqueTela() {
    if (mostrarEnunciado) return;

    if (indice < intro.falas.length - 1) {
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

      {/* Cena — apenas o inimigo do desafio, em destaque e centralizado, flutuando */}
      <div className="intro-cena">
        <img
          src={intro.inimigo.imagem}
          alt={intro.inimigo.nome}
          className="intro-inimigo-destaque"
          draggable={false}
        />
      </div>

      {/* Balão de fala (aparece até a última fala) */}
      {!mostrarEnunciado && (
        <div className="intro-balao">
          <p className="intro-fala" key={indice}>
            {intro.falas[indice]}
          </p>

          <div className="intro-rodape-balao">
            <div className="intro-pontos">
              {intro.falas.map((_, i) => (
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
            <h2 className="intro-enunciado-titulo">{intro.titulo}</h2>
            <p className="intro-enunciado-texto">{intro.texto}</p>
            <p className="intro-enunciado-dica">💡 Dica: {renderDica(intro.dica)}</p>

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
