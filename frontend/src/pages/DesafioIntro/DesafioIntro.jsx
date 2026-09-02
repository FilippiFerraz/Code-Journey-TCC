import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BotaoPixel from "../../components/BotaoPixel";
import "./DesafioIntro.css";
import slime from "../../assets/images/Slime.png";
import goblinJS from "../../assets/images/GoblinJS.png";

// Enquanto a rota de desafios não existe no backend, o conteúdo fica aqui,
// espelhando os desafios definidos em ResolverDesafio.jsx (mesmo mundo,
// mesmo numero, mesmo inimigo). Depois é só trocar por um GET
// /desafios/:mundoId/:dificuldade/:desafioId.
//
// Aninhado por mundoId -> numero do desafio, porque o numero (1, 2, 3...) se
// repete em cada trilha — sem o mundoId como primeiro nível, o desafio 1 do
// portal 2 cairia em cima do desafio 1 do portal 1.
const INTROS = {
  1: {
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
  },
  2: {
    1: {
      // Reaproveitando a arte do GoblinJS — o portal 2 ainda não tem
      // inimigo próprio desenhado.
      inimigo: { imagem: goblinJS, nome: "Goblin Guardião" },
      falas: [
        "Você chegou ao Acampamento Goblin...",
        "Um Goblin Guardião vigia a entrada de uma área restrita do acampamento.",
        "Ele só deixa passar quem prova que sabe decidir com lógica, não com força.",
        "Sua missão: montar um programa que decide quem pode entrar, usando if/else.",
      ],
      titulo: "Desafio JavaScript",
      texto:
        "Monte, na ordem correta, um programa em JavaScript que verifica se uma pessoa pode acessar uma área restrita.",
      dica: "utilize `if` para testar a condição e `else` para o caso contrário.",
    },
    2: {
      // Reaproveitando a arte do GoblinJS — o portal 2 ainda não tem
      // inimigo próprio desenhado.
      inimigo: { imagem: goblinJS, nome: "Goblin Sábio" },
      falas: [
        "Você avança mais fundo no Acampamento Goblin...",
        "Um Goblin Sábio observa você, sem levantar arma nenhuma.",
        "Ele não quer lutar — quer ouvir você explicar o que aprendeu.",
        "Sua missão: escrever, com suas próprias palavras, o que o console.log() faz em JavaScript.",
      ],
      titulo: "Explique com suas palavras",
      texto:
        "Explique, com suas próprias palavras, o que o comando console.log() faz em JavaScript e para que ele é usado.",
      dica: "pense no que aparece no console do navegador quando esse comando roda, e por que isso ajuda quem está programando.",
    },
  },
  3: {
    1: {
      // Reaproveitando a arte do Slime — o portal 3 ainda não tem inimigo
      // nem cenário próprios desenhados.
      inimigo: { imagem: slime, nome: "Slime da Arena" },
      falas: [
        "Você chega à Arena do Dragão...",
        "Antes do verdadeiro guardião, um Slime da Arena testa quem ousa entrar.",
        "Ele não ataca à toa — quer ver se você sabe repetir uma ação sem repetir o código à mão.",
        "Sua missão: escrever um laço de repetição em JavaScript.",
      ],
      titulo: "Domine o Laço de Repetição",
      texto:
        "Escreva um bloco de código em JavaScript que use um laço de repetição (for ou while) para exibir os números de 1 a 5 no console.",
      dica: "um laço `for` tem três partes: início, condição e o que muda a cada volta — e o `console.log()` precisa estar dentro das chaves pra rodar em cada repetição.",
    },
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

  const intro = INTROS[mundoId]?.[desafioId] || INTROS[1][1];

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
      <BotaoPixel
        className="intro-voltar"
        classeMiolo="intro-voltar-miolo"
        onClick={handleVoltar}
      >
        ← Voltar
      </BotaoPixel>

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

            <BotaoPixel
              className="intro-botao-iniciar"
              classeMiolo="intro-botao-iniciar-miolo"
              onClick={handleIniciarDesafio}
            >
              Iniciar Desafio
            </BotaoPixel>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesafioIntro;
