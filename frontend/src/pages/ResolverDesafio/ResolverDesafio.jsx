import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import guerreiro from "../../assets/images/Guerreiro_simples.png";
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
const DESAFIOS = {
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
};

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

  const desafio = DESAFIOS[desafioId] || DESAFIOS[1];

  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null);
  // null | "erro" | "derrota" | "acertando" | "vitoria"
  const [resultado, setResultado] = useState(null);
  const [vida, setVida] = useState(VIDA_MAXIMA);

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
  const travado = atacando || venceu || perdeu || tomandoGolpe;

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
  async function registrarVitoria(opcaoId) {
    try {
      const resposta = await api.post("/progresso", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: Number(desafioId),
        opcaoId,
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

  function avancar() {
    if (venceu) {
      // vitória confirmada -> tela de recompensa (insígnia/item), que depois
      // volta para a lista de desafios da trilha
      navigate(`/recompensa/${mundoId}/${dificuldade}/${desafioId}`, {
        state: { resultado: recompensaApi },
      });
      return;
    }

    if (!opcaoSelecionada || travado) return;

    const escolhida = desafio.opcoes.find((o) => o.id === opcaoSelecionada);
    if (escolhida.correta) {
      registrarVitoria(escolhida.id);
      vencer();
    } else {
      sofrerGolpe(vida - 1);
    }
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
  }

  function classeDaOpcao(opcao) {
    const classes = ["opcao"];
    if (opcaoSelecionada === opcao.id) classes.push("opcao--selecionada");
    if (
      (resultado === "erro" || resultado === "derrota") &&
      opcaoSelecionada === opcao.id
    ) {
      classes.push("opcao--errada");
    }
    return classes.join(" ");
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
          <button
            type="button"
            className="botao-avante botao-avante--roxo"
            onClick={tentarNovamente}
          >
            TENTAR NOVAMENTE
          </button>
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

          <button type="button" className="botao-avante" onClick={avancar}>
            VER RECOMPENSA
          </button>
        </div>
      );
    }

    if (atacando) {
      return (
        <div className="acerto-banner">
          <h2 className="acerto-titulo">Acertou!</h2>
          <p className="acerto-fala">Golpe certeiro no {desafio.inimigo.nome}!</p>
        </div>
      );
    }

    // estado padrão: respondendo
    return (
      <>
        <h2 className="painel-titulo">Escolha a resposta:</h2>
        <p className="painel-enunciado">{desafio.enunciado}</p>

        <div className="lista-opcoes">
          {desafio.opcoes.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={classeDaOpcao(opcao)}
              onClick={() => selecionarOpcao(opcao.id)}
              disabled={travado}
            >
              <span className="opcao-letra">{opcao.id.toUpperCase()}</span>
              <code className="opcao-codigo">{opcao.texto}</code>
            </button>
          ))}
        </div>

        {resultado === "erro" && (
          <div className="retorno retorno--erro">
            <p className="retorno-fala">{falaGolpe}</p>
            {mostrarDica && <p className="retorno-dica">Dica: {desafio.dica}</p>}
          </div>
        )}

        <button
          type="button"
          className="botao-avante"
          onClick={avancar}
          disabled={!opcaoSelecionada || travado}
        >
          AVANTE!
        </button>
      </>
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