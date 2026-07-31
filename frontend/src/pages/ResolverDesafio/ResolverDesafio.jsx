import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import guerreiro from "../../assets/images/Guerreiro_simples.png";
import slime from "../../assets/images/Slime.png";
import fundoBatalha from "../../assets/images/Fundo_batalha.png";
import "./ResolverDesafio.css";

const VIDA_MAXIMA = 3;

// Enquanto a rota de desafios não existe no backend, o conteúdo fica aqui.
// Depois é só trocar por um GET /desafios/:mundoId/:dificuldade/:desafioId
const DESAFIOS = {
  1: {
    numero: 1,
    titulo: "Print de Dados",
    enunciado: "Qual comando mostra uma mensagem no console em JavaScript?",
    dica: "É o comando que todo programador usa para conferir se o código chegou até ali.",
    opcoes: [
      { id: "a", texto: 'console.log("Olá, mundo!")', correta: true },
      { id: "b", texto: 'print("Olá, mundo!")', correta: false },
      { id: "c", texto: 'System.out.println("Olá, mundo!")', correta: false },
      { id: "d", texto: 'echo "Olá, mundo!"', correta: false },
    ],
  },
};

// Falas do golpe, em ordem de vida restante (2 -> 1 coração).
// A intenção é dar o tom de "tomou dano" sem desanimar o jogador.
const FALAS_GOLPE = [
  "O slime avança e te acerta! Sacuda a poeira e tente de novo.",
  "Mais um golpe! Respira, olha com calma — a resposta está aí.",
];

const FALA_DERROTA =
  "O slime te derrubou desta vez... mas todo herói cai antes de aprender o golpe. Levante e tente novamente!";

function ResolverDesafio() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();

  const desafio = DESAFIOS[desafioId] || DESAFIOS[1];

  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null);
  // null | "erro" | "derrota" | "acertando" | "vitoria"
  const [resultado, setResultado] = useState(null);
  const [vida, setVida] = useState(VIDA_MAXIMA);

  // flags de animação da cena
  const [tomandoGolpe, setTomandoGolpe] = useState(false); // herói leva dano
  const [golpeHeroi, setGolpeHeroi] = useState(false); // herói ataca
  const [slimeMorrendo, setSlimeMorrendo] = useState(false); // slime dissolve
  const [focoSlime, setFocoSlime] = useState(false); // "câmera" foca no slime

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

  function vencer() {
    // 1) herói avança e desfere o golpe
    setResultado("acertando");
    setGolpeHeroi(true);

    // TODO: registrar acerto/progresso no backend quando a rota existir

    // 2) golpe conecta -> slime começa a morrer e a câmera foca nele
    setTimeout(() => {
      setSlimeMorrendo(true);
      setFocoSlime(true);
    }, 450);

    // 3) slime desfeito -> painel de vitória (prepara XP/recompensa)
    setTimeout(() => setResultado("vitoria"), 1700);
  }

  function avancar() {
    if (venceu) {
      // caminho para as futuras telas de XP / recompensa
      navigate(`/desafios/${mundoId}/${dificuldade}`);
      return;
    }

    if (!opcaoSelecionada || travado) return;

    const escolhida = desafio.opcoes.find((o) => o.id === opcaoSelecionada);
    if (escolhida.correta) {
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

  const falaGolpe = FALAS_GOLPE[VIDA_MAXIMA - 1 - vida] || FALAS_GOLPE.at(-1);
  const mostrarDica = vida <= 1;

  function renderPainel() {
    if (perdeu) {
      return (
        <div className="derrota">
          <h2 className="derrota-titulo">Você caiu!</h2>
          <p className="derrota-fala">{FALA_DERROTA}</p>
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
          <h2 className="vitoria-titulo">Slime derrotado!</h2>
          <p className="vitoria-fala">
            Golpe certeiro! O caminho à frente está livre.
          </p>

          {/* TODO: telas futuras — XP ganho, moedas/itens e barra de progresso
              entram aqui. Este bloco é só o marcador visual do lugar. */}
          <div className="vitoria-recompensa" aria-hidden="true">
            <span className="vitoria-recompensa-rotulo">Recompensa</span>
            <span className="vitoria-recompensa-valor">a caminho…</span>
          </div>

          <button type="button" className="botao-avante" onClick={avancar}>
            CONTINUAR
          </button>
        </div>
      );
    }

    if (atacando) {
      return (
        <div className="acerto-banner">
          <h2 className="acerto-titulo">Acertou!</h2>
          <p className="acerto-fala">Golpe certeiro no slime!</p>
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
          backgroundImage: `url(${fundoBatalha})`,
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
            src={guerreiro}
            alt="Guerreiro"
            className={`cena-heroi ${
              tomandoGolpe ? "cena-heroi--atingido" : ""
            } ${golpeHeroi ? "cena-heroi--golpeando" : ""}`}
            style={{ width: 120, imageRendering: "pixelated" }}
            draggable={false}
          />

          <img
            src={slime}
            alt="Slime"
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