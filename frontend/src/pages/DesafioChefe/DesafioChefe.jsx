import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import { useCronometro } from "../../hooks/useCronometro";
import { formatarTempo } from "../../utils/tempo";
import BotaoPixel from "../../components/BotaoPixel";
import goblinJS from "../../assets/images/GoblinJS.png";
import fundoBatalha2 from "../../assets/images/Fundo_batalha2.png";
import "./DesafioChefe.css";

// TODO: nome real do jogador viria do contexto de personagem/perfil (mesmo
// TODO já existente em RecompensaDesafio.jsx).
const NOME_PERSONAGEM_PADRAO = "Aventureiro(a)";

// Quantidade de "vidas" do chefe = quantidade de perguntas que o jogador
// precisa acertar pra vencer a batalha.
const VIDAS_CHEFE = 3;

// Este componente é o TEMPLATE genérico de batalha de chefe, reaproveitável
// pelo chefe final de qualquer portal — por isso o conteúdo abaixo é
// aninhado por mundoId, igual ao padrão já usado em ResolverDesafio.jsx e
// DesafioIntro.jsx.
//
// TODO: esse conteúdo virá do backend (modelo Desafio, provavelmente com um
// campo indicando que é o desafio-chefe da trilha) quando a rota de
// desafios existir de verdade na API. Por enquanto fica hardcoded aqui,
// seguindo o mesmo padrão mock do resto do projeto.
//
// Cada chefe tem um pool de perguntas (pode ter mais que as 3 necessárias
// pra vencer) — ver avancarPergunta() logo abaixo pra entender como o pool
// é percorrido e repetido se o jogador errar bastante.
const CHEFES = {
  1: {
    nome: "Rei GoblinJS",
    tag: "CHEFE",
    // Reaproveitando a arte do GoblinJS, em destaque — o chefe final do
    // Portal 1 ainda não tem sprite próprio desenhado.
    imagem: goblinJS,
    fundo: fundoBatalha2,
    introFalas: [
      "Você chega ao topo da torre, no fim do Portal 1...",
      "O Rei GoblinJS surge, cercado pelos ecos de tudo que você já enfrentou aqui.",
      "\"Vencer os outros foi fácil. Agora prove que realmente aprendeu.\"",
      "Ele vai testar tudo que você viu até aqui — são 3 golpes certeiros pra derrubá-lo.",
    ],
    perguntas: [
      {
        id: "p1",
        enunciado: "Qual comando exibe uma mensagem no console em JavaScript?",
        opcoes: [
          { id: "a", texto: 'console.log("mensagem")', correta: true },
          { id: "b", texto: 'print("mensagem")', correta: false },
          { id: "c", texto: 'console.exibir("mensagem")', correta: false },
          { id: "d", texto: 'System.out.println("mensagem")', correta: false },
        ],
      },
      {
        id: "p2",
        enunciado: 'Qual é o resultado de "5" + 3 em JavaScript?',
        opcoes: [
          { id: "a", texto: '"53" (string)', correta: true },
          { id: "b", texto: "8 (number)", correta: false },
          { id: "c", texto: "53 (number)", correta: false },
          { id: "d", texto: "NaN", correta: false },
        ],
      },
      {
        id: "p3",
        enunciado: "Qual operador compara valor E tipo em JavaScript?",
        opcoes: [
          { id: "a", texto: "===", correta: true },
          { id: "b", texto: "==", correta: false },
          { id: "c", texto: "=", correta: false },
          { id: "d", texto: "!=", correta: false },
        ],
      },
      {
        id: "p4",
        enunciado: "Qual palavra-chave declara uma variável que não pode ser reatribuída?",
        opcoes: [
          { id: "a", texto: "const", correta: true },
          { id: "b", texto: "let", correta: false },
          { id: "c", texto: "var", correta: false },
          { id: "d", texto: "function", correta: false },
        ],
      },
      {
        id: "p5",
        enunciado: 'O que "typeof \'5\'" retorna em JavaScript?',
        opcoes: [
          { id: "a", texto: '"string"', correta: true },
          { id: "b", texto: '"number"', correta: false },
          { id: "c", texto: '"undefined"', correta: false },
          { id: "d", texto: '"object"', correta: false },
        ],
      },
    ],
  },
};

function DesafioChefe() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();
  const guerreiro = usePersonagemAvatar();

  const chefe = CHEFES[mundoId] || CHEFES[1];

  // "intro" (cena narrativa curta, no estilo de DesafioIntro) -> "batalha"
  const [fase, setFase] = useState("intro");
  const [falaIndice, setFalaIndice] = useState(0);

  // Índice "cru" da pergunta — sempre lido com % chefe.perguntas.length, o
  // que faz o pool repetir sozinho se o jogador errar bastante e o pool
  // "acabar" (decisão do escopo: pode repetir perguntas do pool).
  const [indicePergunta, setIndicePergunta] = useState(0);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null);
  // null | "acerto" | "erro" | "vitoria"
  const [resultado, setResultado] = useState(null);
  const [vidasChefe, setVidasChefe] = useState(VIDAS_CHEFE);

  // Resposta de POST /api/progresso, levada pra tela de recompensa — mesmo
  // padrão de ResolverDesafio.jsx.
  const [recompensaApi, setRecompensaApi] = useState(null);

  // flags de animação da arena
  const [heroiAtacando, setHeroiAtacando] = useState(false);
  const [chefeSofrendoGolpe, setChefeSofrendoGolpe] = useState(false);
  const [chefeEsquivando, setChefeEsquivando] = useState(false);
  const [chefeMorrendo, setChefeMorrendo] = useState(false);

  const travado = resultado === "acerto" || resultado === "erro" || resultado === "vitoria";
  const perguntaAtual = chefe.perguntas[indicePergunta % chefe.perguntas.length];

  // Cronômetro da batalha inteira (as 3 vidas do chefe contam como um único
  // desafio pra fins de pontuação — ver tempoSegundos em registrarVitoria) —
  // conta desde o início da batalha até a vitória, pausando durante a
  // animação final de derrota do chefe. Mesmo hook usado em ResolverDesafio.jsx.
  const cronometroAtivo = fase === "batalha" && resultado !== "vitoria";
  const [segundosBatalha] = useCronometro(cronometroAtivo);

  function avancarIntro() {
    if (falaIndice < chefe.introFalas.length - 1) {
      setFalaIndice((i) => i + 1);
    } else {
      setFase("batalha");
    }
  }

  function avancarPergunta() {
    setIndicePergunta((i) => i + 1);
  }

  // Registra a vitória no backend (XP + item de recompensa), igual ao
  // fluxo de ResolverDesafio.jsx — roda em paralelo com a animação de
  // derrota do chefe; se falhar, a tela de recompensa cai pro conteúdo
  // hardcoded como reserva.
  async function registrarVitoria() {
    try {
      const resposta = await api.post("/progresso", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: Number(desafioId),
        tempoSegundos: segundosBatalha,
      });
      setRecompensaApi(resposta.data);
    } catch (erro) {
      console.error("Não foi possível registrar o progresso no servidor:", erro);
    }
  }

  function irParaRecompensa() {
    navigate(`/recompensa/${mundoId}/${dificuldade}/${desafioId}`, {
      state: { resultado: recompensaApi },
    });
  }

  // Acerto: herói golpeia, chefe leva o hit e perde uma vida. Na última
  // vida, encadeia direto pra animação de derrota do chefe.
  function golpeCerteiro() {
    setResultado("acerto");
    setHeroiAtacando(true);

    setTimeout(() => setChefeSofrendoGolpe(true), 300);
    setTimeout(() => setHeroiAtacando(false), 600);

    setTimeout(() => {
      setChefeSofrendoGolpe(false);
      const vidaRestante = vidasChefe - 1;
      setVidasChefe(vidaRestante);

      if (vidaRestante <= 0) {
        registrarVitoria();
        setChefeMorrendo(true);
        setTimeout(() => setResultado("vitoria"), 900);
      } else {
        setResultado(null);
        setOpcaoSelecionada(null);
        avancarPergunta();
      }
    }, 900);
  }

  // Erro: o chefe apenas se esquiva — TODO: dano ao jogador (versão futura
  // pode tirar HP do personagem aqui; por ora o jogador não sofre dano,
  // só perde a chance de avançar mais rápido no pool de perguntas).
  function golpeEsquivado() {
    setResultado("erro");
    setChefeEsquivando(true);

    setTimeout(() => {
      setChefeEsquivando(false);
      setResultado(null);
      setOpcaoSelecionada(null);
      avancarPergunta();
    }, 800);
  }

  function escolherAtaque(opcao) {
    if (travado) return;
    setOpcaoSelecionada(opcao.id);
    if (opcao.correta) {
      golpeCerteiro();
    } else {
      golpeEsquivado();
    }
  }

  function renderIntro() {
    const ultimaFala = falaIndice === chefe.introFalas.length - 1;
    return (
      <div className="chefe-intro" onClick={avancarIntro}>
        <div className="chefe-intro-cena">
          <img
            src={chefe.imagem}
            alt={chefe.nome}
            className="chefe-intro-sprite"
            draggable={false}
          />
        </div>

        <div className="chefe-intro-balao">
          <p className="chefe-intro-fala" key={falaIndice}>
            {chefe.introFalas[falaIndice]}
          </p>

          <div className="chefe-intro-rodape">
            <div className="chefe-intro-pontos">
              {chefe.introFalas.map((_, i) => (
                <span
                  key={i}
                  className={`chefe-intro-ponto ${i <= falaIndice ? "chefe-intro-ponto--ativo" : ""}`}
                />
              ))}
            </div>
            <span className="chefe-intro-continuar">
              {ultimaFala ? "toque para enfrentar ▶" : "toque para continuar ▶"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  function renderArena() {
    return (
      <section
        className="chefe-arena"
        style={{
          backgroundImage: `url(${chefe.fundo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      >
        <div className="chefe-card chefe-card-topo">
          <div className="chefe-card-cabecalho">
            <span className="chefe-tag">{chefe.tag}</span>
            <span className="chefe-nome">{chefe.nome}</span>
          </div>
          <div
            className="chefe-vida-barra"
            aria-label={`Vida do chefe: ${vidasChefe} de ${VIDAS_CHEFE}`}
          >
            {Array.from({ length: VIDAS_CHEFE }).map((_, i) => (
              <span
                key={i}
                className={`chefe-vida-segmento ${i < vidasChefe ? "" : "chefe-vida-segmento--vazio"}`}
              />
            ))}
          </div>
        </div>

        <div className="chefe-palco">
          {/* De costas, como nas batalhas Pokémon — TODO: sprite dedicado
              de costas; por ora espelha o sprite padrão do personagem. */}
          <img
            src={guerreiro}
            alt="Seu personagem"
            className="chefe-sprite-heroi"
            style={{ imageRendering: "pixelated" }}
            draggable={false}
          />

          <img
            src={chefe.imagem}
            alt={chefe.nome}
            className={`chefe-sprite-chefe ${chefeSofrendoGolpe ? "chefe-sprite-chefe--atingido" : ""} ${
              chefeEsquivando ? "chefe-sprite-chefe--esquivando" : ""
            } ${chefeMorrendo ? "chefe-sprite-chefe--derrotado" : ""}`}
            style={{ imageRendering: "pixelated" }}
            draggable={false}
          />
        </div>

        <div className="chefe-cronometro" aria-label={`Tempo de batalha: ${formatarTempo(segundosBatalha)}`}>
          ⏱ {formatarTempo(segundosBatalha)}
        </div>

        <div className="chefe-card chefe-card-jogador">
          <span className="chefe-jogador-nome">{NOME_PERSONAGEM_PADRAO}</span>
          {/* TODO: dano ao jogador — barra decorativa nesta primeira
              versão, sem lógica de HP real do jogador ainda. */}
          <div className="chefe-jogador-barra-hp">
            <div className="chefe-jogador-barra-hp-preenchimento" />
          </div>
        </div>

        {chefeSofrendoGolpe && <div className="chefe-flash" />}
      </section>
    );
  }

  function renderPainel() {
    if (resultado === "vitoria") {
      return (
        <div className="chefe-vitoria">
          <h2 className="chefe-vitoria-titulo">{chefe.nome} derrotado!</h2>
          <p className="chefe-vitoria-fala">
            Golpe final! O caminho para o próximo portal está livre.
          </p>

          {/* Só aparece quando o backend realmente concedeu XP agora — hoje
              só acontece quando esse chefe já tiver um Desafio cadastrado no
              banco (ver TODO no topo do arquivo sobre o conteúdo mock). */}
          {recompensaApi?.xpConcedidoAgora > 0 && (
            <div className="vitoria-recompensa">
              <span className="vitoria-recompensa-rotulo">XP ganho</span>
              <span className="vitoria-recompensa-valor">
                +{recompensaApi.xpConcedidoAgora} XP • Tempo: {formatarTempo(recompensaApi.tempoSegundos ?? segundosBatalha)}
                {recompensaApi.acertouDePrimeira ? " • Acertou de primeira!" : ""}
              </span>
            </div>
          )}

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

    if (resultado === "acerto") {
      return (
        <div className="chefe-banner chefe-banner--acerto">
          <h2 className="chefe-banner-titulo">Golpe certeiro!</h2>
          <p className="chefe-banner-fala">{chefe.nome} cambaleou com o impacto!</p>
        </div>
      );
    }

    if (resultado === "erro") {
      return (
        <div className="chefe-banner chefe-banner--erro">
          <h2 className="chefe-banner-titulo">Ele se esquivou!</h2>
          <p className="chefe-banner-fala">
            {chefe.nome} escapou do seu golpe... tente outro ataque!
          </p>
        </div>
      );
    }

    // estado padrão: escolhendo o próximo ataque
    return (
      <>
        <div className="chefe-caixa-dialogo">
          <p className="chefe-dialogo-pergunta">
            O que {NOME_PERSONAGEM_PADRAO} vai fazer?
          </p>
          <p className="chefe-dialogo-enunciado">{perguntaAtual.enunciado}</p>
        </div>

        <div className="chefe-menu-ataques">
          {perguntaAtual.opcoes.map((opcao) => (
            <BotaoPixel
              key={opcao.id}
              className="chefe-ataque"
              classeMiolo="chefe-ataque-miolo"
              onClick={() => escolherAtaque(opcao)}
              disabled={travado}
              extra={
                <span className="chefe-cursor" aria-hidden="true">
                  ▶
                </span>
              }
            >
              {opcao.texto}
            </BotaoPixel>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="chefe-tela">
      {fase === "intro" ? (
        renderIntro()
      ) : (
        <>
          {renderArena()}
          <section className="chefe-painel">{renderPainel()}</section>
        </>
      )}
    </div>
  );
}

export default DesafioChefe;
