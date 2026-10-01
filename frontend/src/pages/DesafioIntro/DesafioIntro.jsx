import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BotaoPixel from "../../components/BotaoPixel";
import { BarraAvancoFala, BotaoPularFalas } from "../../components/ControlesFalas";
import { useAvancoAutomatico } from "../../hooks/useAvancoAutomatico";
import "./DesafioIntro.css";
import slime from "../../assets/images/Slime.png";
import goblinJS from "../../assets/images/GoblinJS.png";
import esqueletoInimigo from "../../assets/images/esqueleto_inimigo.png";
import mercadorInimigo from "../../assets/images/mercador_inimigo.png";
import bruxaInimigo from "../../assets/images/bruxa_inimigo.png";

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
    3: {
      inimigo: { imagem: esqueletoInimigo, nome: "Esqueleto Contador" },
      falas: [
        "Você chegou a uma nova área da Vila Inicial...",
        "Um Esqueleto Contador vigia a entrada de uma área restrita.",
        "Ele só deixa passar quem prova que sabe somar valores em JavaScript.",
        "Sua missão: montar um programa que declara dois números, soma e exibe o resultado.",
      ],
      titulo: "Soma de Números",
      texto:
        "Monte, na ordem correta, um programa em JavaScript que declara duas variáveis numéricas, soma os valores e exibe o resultado no console.",
      dica: "declare as duas variáveis primeiro — a soma só pode usar o que já existe.",
    },
    4: {
      inimigo: { imagem: mercadorInimigo, nome: "Elfo Mercador" },
      falas: [
        "Você chega a uma bifurcação vigiada pelo Elfo Mercador...",
        "Ele não luta com espada — luta reconhecendo código certo e errado.",
        "Vai te mostrar 3 trechos de código, um de cada vez, pra você julgar.",
        "Sua missão: arrastar cada cartão pra direita se estiver certo, ou pra esquerda se estiver errado.",
      ],
      titulo: "Certo ou Errado?",
      texto:
        "Analise cada cartão de código e arraste pra direita se estiver CERTO, ou pra esquerda se estiver ERRADO. Acerte os 3 para vencer.",
      dica: "preste atenção nos detalhes pequenos, como chaves que não fecham ou um = sozinho onde deveria ter === .",
    },
  },
  2: {
    1: {
      inimigo: { imagem: goblinJS, nome: "Goblin Sentinela" },
      falas: [
        "Bem-vindo ao Acampamento Goblin, viajante...",
        "Um Goblin Sentinela vigia a entrada e só deixa passar quem sabe controlar o acesso.",
        "Ele embaralhou o código do portão! As peças estão todas fora de ordem.",
        "Sua missão: organizar os blocos para decidir quem pode entrar.",
      ],
      titulo: "Desafio JavaScript",
      texto:
        'Monte um programa que verifica se a idade é 18 ou mais e exibe "Acesso permitido" ou "Acesso negado".',
      dica: "o bloco `if/else` só executa o trecho entre chaves quando a condição é avaliada — preste atenção em qual chave abre e qual fecha cada parte.",
    },
    2: {
      inimigo: { imagem: bruxaInimigo, nome: "Bruxa do Acampamento" },
      falas: [
        "No fundo do acampamento, uma Bruxa guarda o portão...",
        "Ela não aceita respostas decoradas. Quer ouvir você explicar com as próprias palavras.",
        "Desta vez, quem vai julgar sua resposta é o Mago Corretor: ele lê o que você escrever e decide se você entendeu de verdade.",
        "Sua missão: ler um código com if, else if e else e explicar qual mensagem aparece no console e por quê.",
      ],
      titulo: "O Enigma da Bruxa",
      texto:
        "Leia o código e explique, com suas palavras, qual mensagem aparece no console e por quê. Sua resposta será corrigida por inteligência artificial.",
      dica: "o JavaScript testa as condições de cima para baixo e executa só o primeiro bloco cuja condição for verdadeira.",
    },
  },
  3: {
    1: {
      // Reaproveitando a arte do GoblinJS — o portal 3 ainda não tem
      // inimigo próprio desenhado.
      inimigo: { imagem: goblinJS, nome: "Goblin Sábio" },
      falas: [
        "Você chega à Arena do Dragão...",
        "Um Goblin Sábio observa você, sem levantar arma nenhuma.",
        "Ele não quer lutar — quer ouvir você explicar o que aprendeu.",
        "Sua missão: escrever, com suas próprias palavras, o que o console.log() faz em JavaScript.",
      ],
      titulo: "Explique com suas palavras",
      texto:
        "Explique, com suas próprias palavras, o que o comando console.log() faz em JavaScript e para que ele é usado.",
      dica: "pense no que aparece no console do navegador quando esse comando roda, e por que isso ajuda quem está programando.",
    },
    2: {
      // Reaproveitando a arte do Slime — o portal 3 ainda não tem inimigo
      // nem cenário próprios desenhados.
      inimigo: { imagem: slime, nome: "Slime da Arena" },
      falas: [
        "Você avança mais fundo na Arena do Dragão...",
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

  // Cada fala passa sozinha depois de alguns segundos (tocar na tela
  // continua funcionando e reinicia a contagem) — na última, abre o card do
  // enunciado, que espera o jogador clicar em "Iniciar Desafio".
  useAvancoAutomatico(!mostrarEnunciado, indice, handleCliqueTela);

  // "Pular": vai direto pro card do enunciado, sem passar pelas falas.
  function pularFalas() {
    setMostrarEnunciado(true);
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

      {!mostrarEnunciado && <BotaoPularFalas onPular={pularFalas} />}

      {/* Cena — anúncio do confronto (aviso + nome) acima do inimigo do
          desafio, em destaque e centralizado, flutuando */}
      <div className="intro-cena">
        <div className="intro-inimigo-anuncio">
          <p className="intro-inimigo-aviso">
            Um inimigo surgiu no seu caminho! Você vai precisar enfrentá-lo.
          </p>
          <h2 className="intro-inimigo-nome">{intro.inimigo.nome}</h2>
        </div>

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
          <BarraAvancoFala chave={indice} />
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
