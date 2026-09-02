import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import BotaoPixel from "../../components/BotaoPixel";
import guerreiroAtaque from "../../assets/images/Guerreiro_ataque.gif";
import slime from "../../assets/images/Slime.png";
import goblinJS from "../../assets/images/GoblinJS.png";
import fundoBatalha from "../../assets/images/Fundo_batalha.png";
import fundoBatalha2 from "../../assets/images/Fundo_batalha2.png";
import "./ResolverDesafio.css";

const VIDA_MAXIMA = 3;

// Quanto tempo o GIF de ataque fica visível antes de voltar pro herói
// parado. Ajuste esse valor pra bater com a duração real do
// Guerreiro_ataque.gif (hoje está um pouco antes do golpe "conectar"
// no slime, que acontece em 450ms — ver vencer()).
const DURACAO_GIF_ATAQUE_MS = 600;

// Enquanto a rota de desafios não existe no backend, o conteúdo fica aqui.
// Depois é só trocar por um GET /desafios/:mundoId/:dificuldade/:desafioId
//
// Aninhado por mundoId -> numero do desafio (mesmo motivo do INTROS em
// DesafioIntro.jsx): o numero se repete em cada trilha/portal.
//
// "tipo" diferencia o formato do exercício:
// - "multipla_escolha" (padrão, se omitido): desafio.opcoes com { id, texto, correta }
// - "ordenar_blocos": desafio.blocos (embaralhados na tela) + desafio.ordemCorreta
//   com a sequência de ids que forma o programa certo
// - "dissertativa": o jogador escreve a resposta com as próprias palavras
//   num <textarea>; a correção ainda é mockada localmente (ver
//   corrigirRespostaComIA) até existir a rota real de IA no backend
const DESAFIOS = {
  1: {
    1: {
      numero: 1,
      titulo: "Print de Dados",
      enunciado: "Qual comando mostra uma mensagem no console em JavaScript?",
      dica: "É o comando que todo programador usa para conferir se o código chegou até ali.",
      inimigo: { imagem: slime, nome: "Slime" },
      fundo: fundoBatalha,
      opcoes: [
        { id: "a", texto: 'console.log("Olá, mundo!")', correta: true },
        { id: "b", texto: 'print("Olá, mundo!")', correta: false },
        { id: "c", texto: 'System.out.println("Olá, mundo!")', correta: false },
        { id: "d", texto: 'echo "Olá, mundo!"', correta: false },
      ],
    },
    2: {
      numero: 2,
      titulo: "Tipos na Atribuição",
      enunciado:
        'Qual é o valor e o tipo de "x" depois de executar este código?\n\nlet x = "5";\nx = x + 1;',
      dica: "Em JavaScript, o operador + entre uma string e um número concatena, não soma — o número é convertido para texto.",
      inimigo: { imagem: goblinJS, nome: "GoblinJS" },
      fundo: fundoBatalha2,
      opcoes: [
        { id: "a", texto: '"51" (string)', correta: true },
        { id: "b", texto: "6 (number)", correta: false },
        { id: "c", texto: "51 (number)", correta: false },
        { id: "d", texto: "NaN (number)", correta: false },
      ],
    },
  },
  2: {
    1: {
      numero: 1,
      tipo: "ordenar_blocos",
      titulo: "Desafio JavaScript",
      enunciado:
        'Você está desenvolvendo um sistema que verifica se uma pessoa pode acessar uma área restrita.\n\nO programa deve receber a idade de uma pessoa e verificar se ela possui 18 anos ou mais. Caso tenha, deve exibir "Acesso permitido". Caso contrário, deve exibir "Acesso negado".\n\nOrganize os blocos de código na sequência correta para formar um programa JavaScript funcional.',
      dica: "o bloco if/else só executa o trecho entre chaves quando a condição é avaliada — preste atenção em qual chave abre e qual fecha cada parte.",
      // Reaproveitando a arte do GoblinJS — o portal 2 ainda não tem
      // inimigo nem cenário próprios desenhados.
      inimigo: { imagem: goblinJS, nome: "Goblin Guardião" },
      fundo: fundoBatalha,
      blocos: [
        { id: "b1", codigo: "let idade = 20;" },
        { id: "b2", codigo: "if (idade >= 18) {" },
        { id: "b3", codigo: 'console.log("Acesso permitido");', indent: 1 },
        { id: "b4", codigo: "} else {" },
        { id: "b5", codigo: 'console.log("Acesso negado");', indent: 1 },
        { id: "b6", codigo: "}" },
      ],
      ordemCorreta: ["b1", "b2", "b3", "b4", "b5", "b6"],
    },
    2: {
      numero: 2,
      tipo: "dissertativa",
      titulo: "Explique com suas palavras",
      enunciado:
        "O Goblin Sábio bloqueia o caminho e exige uma explicação antes de deixar você passar.\n\nCom suas próprias palavras, explique o que o comando console.log() faz em JavaScript e para que ele é usado.",
      dica: "pense no que aparece no console do navegador quando esse comando roda, e por que isso ajuda quem está programando.",
      // Reaproveitando a arte do GoblinJS — o portal 2 ainda não tem
      // inimigo nem cenário próprios desenhados.
      inimigo: { imagem: goblinJS, nome: "Goblin Sábio" },
      fundo: fundoBatalha2,
    },
  },
  3: {
    1: {
      numero: 1,
      tipo: "dissertativa",
      titulo: "Domine o Laço de Repetição",
      enunciado:
        "O Slime da Arena te desafia a provar que domina os laços de repetição.\n\nEscreva um bloco de código em JavaScript que use um laço de repetição (for ou while) para exibir os números de 1 a 5 no console, um por linha.",
      dica: "um laço for tem três partes separadas por ; — início, condição de continuar, e o que muda a cada volta. Coloque o console.log() dentro das chaves { } pra ele rodar em cada repetição.",
      // Reaproveitando a arte do Slime — o portal 3 ainda não tem inimigo
      // nem cenário próprios desenhados.
      inimigo: { imagem: slime, nome: "Slime da Arena" },
      fundo: fundoBatalha,
    },
  },
};

// Embaralha uma lista sem alterar a original (Fisher-Yates) — usado para
// espalhar os blocos de código na área "disponíveis" a cada tentativa.
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Simula a correção por IA de uma resposta dissertativa: espera ~1,5s (pra
// imitar o tempo de resposta de uma API de IA de verdade) e sorteia acerto
// ou erro, com uma mensagem de feedback fixa de exemplo pra cada caso.
//
// TODO: substituir por chamada real à API quando a rota
// POST /api/desafios/:id/responder existir (ver responderDissertativa
// logo abaixo — é o único ponto que precisa trocar).
function corrigirRespostaComIA(_texto) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const acertou = Math.random() < 0.5;
      resolve({
        correta: acertou,
        mensagem: acertou
          ? "Boa explicação! Você entendeu que o console.log() serve pra exibir informações no console, ajudando a conferir o que o código está fazendo."
          : "Quase lá! Sua explicação ainda não deixa claro que o console.log() serve pra exibir informações no console do navegador — tente detalhar isso.",
      });
    }, 1500);
  });
}

// Falas do golpe, em ordem de vida restante (2 -> 1 coração).
// A intenção é dar o tom de "tomou dano" sem desanimar o jogador.
// Recebem o nome do inimigo do desafio atual pra bater com a imagem exibida.
function falasGolpe(nomeInimigo) {
  return [
    `${nomeInimigo} avança e te acerta! Sacuda a poeira e tente de novo.`,
    "Mais um golpe! Respira, olha com calma — a resposta está aí.",
  ];
}

function falaDerrota(nomeInimigo) {
  return `${nomeInimigo} te derrubou desta vez... mas todo herói cai antes de aprender o golpe. Levante e tente novamente!`;
}

function ResolverDesafio() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();
  const guerreiro = usePersonagemAvatar();

  const desafio = DESAFIOS[mundoId]?.[desafioId] || DESAFIOS[1][1];
  const ehOrdenarBlocos = desafio.tipo === "ordenar_blocos";
  const ehDissertativa = desafio.tipo === "dissertativa";

  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null);
  // null | "erro" | "derrota" | "acertando" | "vitoria"
  const [resultado, setResultado] = useState(null);
  const [vida, setVida] = useState(VIDA_MAXIMA);

  // Estado do exercício "ordenar_blocos": ids ainda disponíveis pra usar e
  // ids já colocados na resposta, na ordem em que o jogador os organizou.
  const [blocosDisponiveis, setBlocosDisponiveis] = useState(() =>
    ehOrdenarBlocos ? embaralhar(desafio.blocos.map((b) => b.id)) : []
  );
  const [blocosResposta, setBlocosResposta] = useState([]);
  const blocosPorId = Object.fromEntries((desafio.blocos || []).map((b) => [b.id, b]));

  // Estado do exercício "dissertativa": texto que o jogador escreveu,
  // se a correção mockada por IA está rodando, e o feedback que ela
  // devolveu (mostrado tanto no acerto quanto no erro).
  const [respostaTexto, setRespostaTexto] = useState("");
  const [corrigindo, setCorrigindo] = useState(false);
  const [feedbackDissertativa, setFeedbackDissertativa] = useState("");

  // Resposta de POST /api/progresso (xpGanho, itemGanho, ...), levada pra
  // tela de recompensa. Fica null se a chamada ainda não voltou ou falhou —
  // RecompensaDesafio cai de volta pro conteúdo hardcoded nesse caso.
  const [recompensaApi, setRecompensaApi] = useState(null);

  // flags de animação da cena
  const [tomandoGolpe, setTomandoGolpe] = useState(false); // herói leva dano
  const [golpeHeroi, setGolpeHeroi] = useState(false); // herói ataca (GIF tocando)
  const [slimeMorrendo, setSlimeMorrendo] = useState(false); // slime dissolve
  const [focoSlime, setFocoSlime] = useState(false); // "câmera" foca no slime

  // Incrementa a cada ataque pra forçar o <img> do GIF a remontar e
  // reiniciar do primeiro quadro (senão, num segundo ataque, o GIF
  // simplesmente não tocaria de novo — ficaria parado no último frame).
  const [cicloAtaque, setCicloAtaque] = useState(0);

  const atacando = resultado === "acertando";
  const venceu = resultado === "vitoria";
  const perdeu = resultado === "derrota";
  const travado = atacando || venceu || perdeu || tomandoGolpe || corrigindo;

  function selecionarOpcao(id) {
    if (travado) return;
    setOpcaoSelecionada(id);
    if (resultado === "erro") setResultado(null);
  }

  function sofrerGolpe(vidaRestante) {
    setTomandoGolpe(true);
    setVida(vidaRestante);
    setResultado(vidaRestante <= 0 ? "derrota" : "erro");
    setTimeout(() => setTomandoGolpe(false), 600);
  }

  // Registra a vitória no backend (XP + item de recompensa, se o desafio
  // tiver um) assim que a resposta certa é confirmada. Roda em paralelo com
  // a animação de vencer() — se falhar (ex: offline), o jogo continua e a
  // tela de recompensa usa o conteúdo hardcoded como reserva.
  async function registrarVitoria(respostaExtra) {
    try {
      const resposta = await api.post("/progresso", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: Number(desafioId),
        ...respostaExtra,
      });
      setRecompensaApi(resposta.data);
    } catch (erro) {
      console.error("Não foi possível registrar o progresso no servidor:", erro);
    }
  }

  function vencer() {
    // 1) herói avança e desfere o golpe — troca a imagem parada pelo GIF
    setResultado("acertando");
    setCicloAtaque((ciclo) => ciclo + 1);
    setGolpeHeroi(true);

    // 2) golpe conecta -> slime começa a morrer e a câmera foca nele
    setTimeout(() => {
      setSlimeMorrendo(true);
      setFocoSlime(true);
    }, 450);

    // 3) GIF de ataque termina -> volta o herói pra imagem parada
    setTimeout(() => setGolpeHeroi(false), DURACAO_GIF_ATAQUE_MS);

    // 4) slime desfeito -> painel de vitória (prepara XP/recompensa)
    setTimeout(() => setResultado("vitoria"), 1700);
  }

  // Vitória confirmada -> tela de recompensa (insígnia/item), que depois
  // volta para a lista de desafios da trilha. Compartilhada pelos dois
  // tipos de exercício — é o onClick do botão "VER RECOMPENSA".
  function irParaRecompensa() {
    navigate(`/recompensa/${mundoId}/${dificuldade}/${desafioId}`, {
      state: { resultado: recompensaApi },
    });
  }

  function responderMultiplaEscolha() {
    if (!opcaoSelecionada || travado) return;

    const escolhida = desafio.opcoes.find((o) => o.id === opcaoSelecionada);
    if (escolhida.correta) {
      registrarVitoria({ opcaoId: escolhida.id });
      vencer();
    } else {
      sofrerGolpe(vida - 1);
    }
  }

  // Compara a sequência montada pelo jogador com o gabarito do desafio.
  // Em erro, os blocos continuam onde estavam — o jogador só reorganiza e
  // tenta de novo, sem perder o que já tinha montado certo.
  function verificarBlocos() {
    if (travado || blocosResposta.length !== desafio.blocos.length) return;

    const correta = desafio.ordemCorreta.every((id, i) => blocosResposta[i] === id);
    if (correta) {
      registrarVitoria({ ordem: blocosResposta });
      vencer();
    } else {
      sofrerGolpe(vida - 1);
    }
  }

  function alterarRespostaTexto(texto) {
    if (travado) return;
    setRespostaTexto(texto);
    if (resultado === "erro") setResultado(null);
  }

  // Envia a resposta dissertativa pra correção. Enquanto "corrigindo" está
  // true, a tela mostra o painel de "avaliando" (ver renderPainel) — feito
  // assim, e não com um resultado "acertando" comum, porque o veredito só
  // chega depois da resposta da correção, diferente dos outros dois tipos
  // de desafio, que sabem na hora se acertaram.
  async function responderDissertativa() {
    if (travado || !respostaTexto.trim()) return;

    setCorrigindo(true);
    const resultadoIA = await corrigirRespostaComIA(respostaTexto);
    setCorrigindo(false);
    setFeedbackDissertativa(resultadoIA.mensagem);

    if (resultadoIA.correta) {
      registrarVitoria({ respostaTexto });
      vencer();
    } else {
      sofrerGolpe(vida - 1);
    }
  }

  function moverParaResposta(id) {
    if (travado) return;
    setBlocosDisponiveis((atual) => atual.filter((x) => x !== id));
    setBlocosResposta((atual) => [...atual, id]);
    if (resultado === "erro") setResultado(null);
  }

  function removerDaResposta(id) {
    if (travado) return;
    setBlocosResposta((atual) => atual.filter((x) => x !== id));
    setBlocosDisponiveis((atual) => [...atual, id]);
  }

  function moverBloco(indice, delta) {
    if (travado) return;
    setBlocosResposta((atual) => {
      const alvo = indice + delta;
      if (alvo < 0 || alvo >= atual.length) return atual;
      const novo = [...atual];
      [novo[indice], novo[alvo]] = [novo[alvo], novo[indice]];
      return novo;
    });
  }

  // Drag and drop nativo (HTML5) — reordena/realoca ao soltar. Cada bloco
  // também pode ser movido por toque/clique (moverParaResposta,
  // removerDaResposta, moverBloco), então o recurso funciona sem mouse.
  function iniciarArraste(e, id, origem) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, origem }));
    e.dataTransfer.effectAllowed = "move";
  }

  function permitirSolto(e) {
    e.preventDefault();
  }

  function soltarNaResposta(e, indiceAlvo) {
    e.preventDefault();
    e.stopPropagation();
    if (travado) return;

    const dados = e.dataTransfer.getData("text/plain");
    if (!dados) return;
    const { id } = JSON.parse(dados);

    setBlocosDisponiveis((atual) => atual.filter((x) => x !== id));
    setBlocosResposta((atual) => {
      const semId = atual.filter((x) => x !== id);
      const alvo = Math.min(indiceAlvo, semId.length);
      return [...semId.slice(0, alvo), id, ...semId.slice(alvo)];
    });
    if (resultado === "erro") setResultado(null);
  }

  function soltarNoPool(e) {
    e.preventDefault();
    if (travado) return;

    const dados = e.dataTransfer.getData("text/plain");
    if (!dados) return;
    const { id } = JSON.parse(dados);

    setBlocosResposta((atual) => atual.filter((x) => x !== id));
    setBlocosDisponiveis((atual) => (atual.includes(id) ? atual : [...atual, id]));
  }

  function tentarNovamente() {
    setVida(VIDA_MAXIMA);
    setResultado(null);
    setOpcaoSelecionada(null);
    setTomandoGolpe(false);
    setRecompensaApi(null);
    // reset das flags de animação da batalha anterior, senão uma nova
    // tentativa pode começar com o slime já "morto" ou a câmera focada nele
    setGolpeHeroi(false);
    setSlimeMorrendo(false);
    setFocoSlime(false);
    if (ehOrdenarBlocos) {
      setBlocosDisponiveis(embaralhar(desafio.blocos.map((b) => b.id)));
      setBlocosResposta([]);
    }
    if (ehDissertativa) {
      setRespostaTexto("");
      setCorrigindo(false);
      setFeedbackDissertativa("");
    }
  }

  // "" | "selecionada" | "errada" — usado tanto na moldura (opcao--X)
  // quanto no miolo (opcao-miolo--X) do BotaoPixel dessa alternativa.
  function estadoDaOpcao(opcao) {
    if (opcaoSelecionada !== opcao.id) return "";
    if (resultado === "erro" || resultado === "derrota") return "errada";
    return "selecionada";
  }

  const golpesInimigo = falasGolpe(desafio.inimigo.nome);
  const falaGolpe = golpesInimigo[VIDA_MAXIMA - 1 - vida] || golpesInimigo.at(-1);
  const mostrarDica = vida <= 1;

  function renderPainel() {
    if (perdeu) {
      return (
        <div className="derrota">
          <h2 className="derrota-titulo">Você caiu!</h2>
          <p className="derrota-fala">{falaDerrota(desafio.inimigo.nome)}</p>
          <BotaoPixel
            className="botao-avante botao-avante--roxo"
            classeMiolo="botao-avante-miolo botao-avante-miolo--roxo"
            onClick={tentarNovamente}
          >
            TENTAR NOVAMENTE
          </BotaoPixel>
        </div>
      );
    }

    if (venceu) {
      return (
        <div className="vitoria">
          <h2 className="vitoria-titulo">{desafio.inimigo.nome} derrotado!</h2>
          <p className="vitoria-fala">
            Golpe certeiro! O caminho à frente está livre.
          </p>

          <BotaoPixel
            className="botao-avante"
            classeMiolo="botao-avante-miolo"
            onClick={irParaRecompensa}
          >
            VER RECOMPENSA
          </BotaoPixel>
        </div>
      );
    }

    if (atacando) {
      return (
        <div className="acerto-banner">
          <h2 className="acerto-titulo">Acertou!</h2>
          <p className="acerto-fala">
            {ehOrdenarBlocos
              ? "Muito bem! Você organizou o código corretamente."
              : ehDissertativa
                ? feedbackDissertativa
                : `Golpe certeiro no ${desafio.inimigo.nome}!`}
          </p>
        </div>
      );
    }

    if (corrigindo) {
      return (
        <div className="corrigindo-banner">
          <h2 className="corrigindo-titulo">Avaliando</h2>
          <p className="corrigindo-fala">
            O mago está avaliando sua resposta
            <span className="corrigindo-pontos">...</span>
          </p>
        </div>
      );
    }

    // estado padrão: respondendo
    return (
      <>
        <h2 className="painel-titulo">
          {ehOrdenarBlocos
            ? "Monte o código:"
            : ehDissertativa
              ? "Escreva sua resposta:"
              : "Escolha a resposta:"}
        </h2>
        <p className="painel-enunciado">{desafio.enunciado}</p>

        {ehOrdenarBlocos
          ? renderMontagemBlocos()
          : ehDissertativa
            ? renderRespostaDissertativa()
            : renderOpcoes()}

        {resultado === "erro" && (
          <div className="retorno retorno--erro">
            <p className="retorno-fala">{ehDissertativa ? feedbackDissertativa : falaGolpe}</p>
            {mostrarDica && <p className="retorno-dica">Dica: {desafio.dica}</p>}
          </div>
        )}

        <BotaoPixel
          className="botao-avante"
          classeMiolo="botao-avante-miolo"
          onClick={
            ehOrdenarBlocos
              ? verificarBlocos
              : ehDissertativa
                ? responderDissertativa
                : responderMultiplaEscolha
          }
          disabled={
            ehOrdenarBlocos
              ? blocosResposta.length !== desafio.blocos.length || travado
              : ehDissertativa
                ? !respostaTexto.trim() || travado
                : !opcaoSelecionada || travado
          }
        >
          {ehOrdenarBlocos ? "VERIFICAR" : ehDissertativa ? "ATACAR" : "AVANTE!"}
        </BotaoPixel>
      </>
    );
  }

  function renderOpcoes() {
    return (
      <div className="lista-opcoes">
        {desafio.opcoes.map((opcao) => {
          const estado = estadoDaOpcao(opcao);
          return (
            <BotaoPixel
              key={opcao.id}
              className={`opcao ${estado && `opcao--${estado}`}`}
              classeMiolo={`opcao-miolo ${estado && `opcao-miolo--${estado}`}`}
              onClick={() => selecionarOpcao(opcao.id)}
              disabled={travado}
            >
              <span className="opcao-letra">{opcao.id.toUpperCase()}</span>
              <code className="opcao-codigo">{opcao.texto}</code>
            </BotaoPixel>
          );
        })}
      </div>
    );
  }

  function renderRespostaDissertativa() {
    return (
      <div className="dissertativa-area">
        <textarea
          className="dissertativa-textarea"
          placeholder="Escreva sua resposta com suas próprias palavras..."
          value={respostaTexto}
          onChange={(e) => alterarRespostaTexto(e.target.value)}
          disabled={travado}
          rows={5}
        />
      </div>
    );
  }

  function renderMontagemBlocos() {
    return (
      <div className="blocos-area">
        <div className="blocos-secao">
          <span className="blocos-rotulo">Blocos disponíveis</span>
          <div
            className="blocos-pool"
            onDragOver={permitirSolto}
            onDrop={soltarNoPool}
          >
            {blocosDisponiveis.length === 0 && (
              <span className="blocos-vazio">Todos os blocos já estão na resposta.</span>
            )}
            {blocosDisponiveis.map((id) => {
              const bloco = blocosPorId[id];
              return (
                <button
                  key={id}
                  type="button"
                  className="bloco-codigo"
                  draggable={!travado}
                  onDragStart={(e) => iniciarArraste(e, id, "pool")}
                  onClick={() => moverParaResposta(id)}
                  disabled={travado}
                  aria-label={`Adicionar bloco: ${bloco.codigo}`}
                >
                  <code>{bloco.codigo}</code>
                </button>
              );
            })}
          </div>
        </div>

        <div className="blocos-secao">
          <span className="blocos-rotulo">Sua resposta</span>
          <div
            className={`blocos-resposta ${
              resultado === "erro" ? "blocos-resposta--erro" : ""
            }`}
            onDragOver={permitirSolto}
            onDrop={(e) => soltarNaResposta(e, blocosResposta.length)}
          >
            {blocosResposta.length === 0 && (
              <span className="blocos-vazio">Toque nos blocos acima para montar o código.</span>
            )}
            {blocosResposta.map((id, indice) => {
              const bloco = blocosPorId[id];
              return (
                <div
                  key={id}
                  className="bloco-codigo bloco-codigo--colocado"
                  draggable={!travado}
                  onDragStart={(e) => iniciarArraste(e, id, "resposta")}
                  onDragOver={permitirSolto}
                  onDrop={(e) => soltarNaResposta(e, indice)}
                  style={{ paddingLeft: 12 + (bloco.indent || 0) * 20 }}
                >
                  <code>{bloco.codigo}</code>
                  <span className="bloco-controles">
                    <button
                      type="button"
                      aria-label="Mover bloco para cima"
                      onClick={() => moverBloco(indice, -1)}
                      disabled={indice === 0 || travado}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label="Mover bloco para baixo"
                      onClick={() => moverBloco(indice, 1)}
                      disabled={indice === blocosResposta.length - 1 || travado}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      aria-label="Remover bloco da resposta"
                      onClick={() => removerDaResposta(id)}
                      disabled={travado}
                    >
                      ✕
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="desafio-tela">
      {/* Cena da batalha — fundo agora usa a arte Fundo_batalha.png */}
      <section
        className={`cena ${tomandoGolpe ? "cena--golpe" : ""} ${
          focoSlime ? "cena--foco" : ""
        }`}
        style={{
          backgroundImage: `url(${desafio.fundo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      >
        {/* palco = tudo que sofre o zoom da "câmera" */}
        <div className={`cena-palco ${focoSlime ? "cena-palco--foco" : ""}`}>
          {/* chão marrom antigo desligado — o fundo novo já traz o piso */}
          <div className="cena-chao" style={{ background: "transparent" }} />

          <img
            // key muda a cada golpe pra forçar o navegador a reiniciar o
            // GIF do quadro zero, e volta pra uma key fixa quando parado
            key={golpeHeroi ? `heroi-ataque-${cicloAtaque}` : "heroi-parado"}
            src={golpeHeroi ? guerreiroAtaque : guerreiro}
            alt="Guerreiro"
            className={`cena-heroi ${
              tomandoGolpe ? "cena-heroi--atingido" : ""
            } ${golpeHeroi ? "cena-heroi--golpeando" : ""}`}
            style={{ width: 120, imageRendering: "pixelated" }}
            draggable={false}
          />

          <img
            src={desafio.inimigo.imagem}
            alt={desafio.inimigo.nome}
            className={`cena-inimigo ${
              tomandoGolpe ? "cena-inimigo--atacando" : ""
            } ${slimeMorrendo ? "cena-inimigo--morrendo" : ""}`}
            style={{ width: 96, imageRendering: "pixelated" }}
            draggable={false}
          />
        </div>

        {/* HUD de vida fica fora do zoom */}
        <div className="cena-vida" aria-label={`Vida: ${vida} de ${VIDA_MAXIMA}`}>
          {Array.from({ length: VIDA_MAXIMA }).map((_, i) => (
            <span
              key={i}
              className={`coracao ${i < vida ? "" : "coracao--vazio"}`}
              aria-hidden="true"
            >
              {i < vida ? "❤️" : "🖤"}
            </span>
          ))}
        </div>

        {tomandoGolpe && <div className="cena-flash" />}
      </section>

      <section className="painel">{renderPainel()}</section>
    </div>
  );
}

export default ResolverDesafio;