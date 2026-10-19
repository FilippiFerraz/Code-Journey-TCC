import { Suspense, lazy, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import BotaoPixel from "../../components/BotaoPixel";
import { BarraAvancoFala, BotaoPularFalas } from "../../components/ControlesFalas";
import { useAvancoAutomatico } from "../../hooks/useAvancoAutomatico";
import { usePersonagemAvatar, useAparenciaPropria } from "../../hooks/usePersonagemAvatar";
import { camadasDoPersonagem } from "../../data/spritesPersonagem";
import { pararSom, tocarSom } from "../../utils/sons";
import mago from "../../assets/images/Mago.webp";
import { HP_DRAGAO, VIDAS, estadoInicial, reducerBatalha } from "./estadoBatalha.js";
import { DURACOES, criarCenaDragao } from "./cenaDragao";
import "./BatalhaDragao.css";

// Cutscene final de vitória (10s): baixa em segundo plano quando a luta
// começa (ver comecar), pra já estar pronta na hora da vitória.
const carregarCutsceneFinal = () => import("../../components/BossDefeatCutscene/BossDefeatCutscene");
const BossDefeatCutscene = lazy(carregarCutsceneFinal);
// baixa o código e já prepara sprite, arenas e fonte da cutscene
function prepararCutsceneFinal() {
  carregarCutsceneFinal()
    .then(() => import("../../components/BossDefeatCutscene/recursos"))
    .then((m) => m.preCarregar())
    .catch(() => {});
}

// Prêmio do Baú do Dragão já sorteado no servidor ANTES da cutscene (a
// vitória fica salva mesmo se o jogador pular ou recarregar no meio). A tela
// do baú (BauDaSorte) lê daqui pra girar a roleta com esse prêmio.
export const CHAVE_BAU_PENDENTE = "bauPendente:dragao";
// "Pular" só aparece a partir da 2ª vez que o jogador vê a cutscene.
const CHAVE_CUTSCENE_VISTA = "cutsceneFinalVista";

function lerArmazenado(armazenamento, chave) {
  try {
    return armazenamento.getItem(chave);
  } catch {
    return null;
  }
}

function gravarArmazenado(armazenamento, chave, valor) {
  try {
    armazenamento.setItem(chave, valor);
  } catch {
    // ignora (aba anônima etc.)
  }
}

// Batalha contra o Dragão do Código Fonte: aberta pelo dragão da arena no
// mapa (Home.jsx) depois que os três portais estão concluídos. A cada
// rodada o dragão carrega o Sopro de Loop Infinito enquanto o jogador
// resolve um microdesafio de código (desafiosDragao.js): acertar no tempo
// ativa o Escudo de Código e contra-ataca; errar ou deixar o tempo acabar
// custa uma vida. Abaixo de 50% de vida o dragão entra no Modo Fúria
// (prazo menor, desafios de laços). Vencer leva ao Baú do Dragão
// (/bau-dragao — BauDaSorte com os itens de Item.exclusivoDragao).
//
// Regras e estados: estadoBatalha.js. Desenho e efeitos: cenaDragao.js.
//
// Vitória: a última resposta certa leva direto ao estado "victory"; a tela
// abre o baú no servidor (salva o prêmio), toca a cutscene final
// (components/BossDefeatCutscene) e no fim vai pra /bau-dragao.
// Teste rápido: /batalha-do-dragao?debug=bossDefeat dispara a cutscene na
// hora, SEM salvar vitória nem dar prêmio (no fim volta ao mapa — ou ao baú,
// se ele já tinha sido aberto antes).

const FALAS = [
  { quem: "mago", texto: "Viajante... você venceu os três portais. Agora só resta ELE." },
  { quem: "dragao", texto: "EU SOU O DRAGÃO DO CÓDIGO FONTE! Cada bug deste reino nasceu das minhas escamas!" },
  { quem: "dragao", texto: "Meu SOPRO DE LOOP INFINITO vai prender você para sempre... a não ser que resolva meus enigmas antes que ele fique pronto!" },
  {
    quem: "mago",
    texto: `Responda cada desafio antes de a barra do sopro encher: acertar ativa o Escudo de Código e contra-ataca. Você tem ${VIDAS} vidas. Coragem!`,
  },
];

const NOMES = { mago: "Mago da Corte", dragao: "Dragão do Código Fonte" };

// Depois de um acerto (ou da fúria), a próxima rodada começa sozinha.
const PAUSA_ENTRE_RODADAS_MS = 1000;
// Mesma duração da animação drg-tremer (screen shake) do CSS.
const DURACAO_TREMOR_MS = 650;

function carregarCamadas(itensEquipados, aparencia) {
  return camadasDoPersonagem(itensEquipados, aparencia).map(({ src }) => {
    const imagem = new Image();
    imagem.src = src;
    return imagem;
  });
}

// Código do desafio com números de linha; "____" vira a lacuna destacada.
function CodigoDesafio({ codigo }) {
  return (
    <pre className="drg-codigo">
      {codigo.split("\n").map((linha, i) => (
        <span key={i} className="drg-codigo-linha">
          <span className="drg-codigo-numero">{i + 1}</span>
          <code>
            {linha.split("____").map((parte, j, partes) => (
              <span key={j}>
                {parte}
                {j < partes.length - 1 && <span className="drg-lacuna">____</span>}
              </span>
            ))}
          </code>
        </span>
      ))}
    </pre>
  );
}

function BatalhaDragao() {
  const navigate = useNavigate();
  const itensEquipados = usePersonagemAvatar();
  const aparencia = useAparenciaPropria();

  // carregando | bloqueado | erro | batalha
  const [tela, setTela] = useState("carregando");
  const [bauJaAberto, setBauJaAberto] = useState(false);
  const [indiceFala, setIndiceFala] = useState(0);
  const [s, despachar] = useReducer(reducerBatalha, undefined, estadoInicial);
  const [tremendo, setTremendo] = useState(false);
  // cutscene final: null ou { pular, debug }
  const [final, setFinal] = useState(null);
  const debugFinal = useMemo(() => new URLSearchParams(window.location.search).get("debug") === "bossDefeat", []);

  const canvasRef = useRef(null);
  const cenaRef = useRef(null);
  const barraCastRef = useRef(null);
  const segundosRef = useRef(null);

  // ---------- Situação (liberado? baú já aberto?) ----------

  useEffect(() => {
    // vitória já salva (recarregou durante a cutscene): direto pra recompensa
    if (lerArmazenado(sessionStorage, CHAVE_BAU_PENDENTE)) {
      navigate("/bau-dragao", { replace: true });
      return undefined;
    }
    let ativo = true;
    api
      .get("/baus/dragao")
      .then((res) => {
        if (!ativo) return;
        setBauJaAberto(Boolean(res.data.aberto));
        setTela(res.data.liberado ? "batalha" : "bloqueado");
      })
      .catch(() => ativo && setTela("erro"));
    return () => {
      ativo = false;
      pararSom("boss");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Cena ----------

  const camadas = useMemo(() => carregarCamadas(itensEquipados, aparencia), [itensEquipados, aparencia]);
  const camadasRef = useRef(camadas);
  useEffect(() => {
    camadasRef.current.splice(0, camadasRef.current.length, ...camadas);
  }, [camadas]);

  useEffect(() => {
    // durante a cutscene final a arena da batalha para de animar (fica por baixo)
    if (tela !== "batalha" || !canvasRef.current || final) return undefined;
    const cena = criarCenaDragao(canvasRef.current, { camadas: camadasRef.current });
    cenaRef.current = cena;
    return () => {
      cena.destruir();
      cenaRef.current = null;
    };
  }, [tela, final]);

  useEffect(() => {
    cenaRef.current?.atualizar({
      // enquanto a vitória é salva, a arena mostra o clarão do golpe
      estado: s.estado === "victory" ? "hit" : s.estado,
      fase: s.fase,
      escudo: s.escudo,
      inicioCarga: s.inicioCarga,
      prazoMs: s.prazoMs,
    });
  }, [s.estado, s.fase, s.escudo, s.inicioCarga, s.prazoMs, tela]);

  // ---------- História ----------

  function avancarFala() {
    if (s.estado !== "intro") return;
    if (indiceFala < FALAS.length - 1) setIndiceFala((i) => i + 1);
    else comecar();
  }
  useAvancoAutomatico(tela === "batalha" && s.estado === "intro", indiceFala, avancarFala);

  function comecar() {
    tocarSom("boss");
    despachar({ tipo: "COMECAR" });
    prepararCutsceneFinal();
  }

  // ---------- Ciclo da batalha ----------

  // idle: a próxima rodada começa sozinha (depois de um erro, o jogador lê
  // a explicação e toca em CONTINUAR).
  useEffect(() => {
    if (s.estado !== "idle" || s.ultima?.acertou === false) return undefined;
    const timer = setTimeout(() => despachar({ tipo: "NOVA_RODADA", agora: performance.now() }), PAUSA_ENTRE_RODADAS_MS);
    return () => clearTimeout(timer);
  }, [s.estado, s.ultima]);

  // fim das animações de acerto, sopro e fúria
  useEffect(() => {
    const duracao = DURACOES[s.estado];
    if (!duracao) return undefined;
    const timer = setTimeout(() => despachar({ tipo: "FIM_ANIMACAO" }), duracao);
    return () => clearTimeout(timer);
  }, [s.estado]);

  // efeitos de som e o tremor da tela inteira
  useEffect(() => {
    if (s.estado === "hit") tocarSom("acerto");
    if (s.estado === "furia") tocarSom("boss");
    if (s.estado === "attacking" || s.estado === "furia") {
      tocarSom("erro");
      const inicio = setTimeout(() => setTremendo(true), s.estado === "attacking" ? 280 : 350);
      const fim = setTimeout(() => setTremendo(false), (s.estado === "attacking" ? 280 : 350) + DURACAO_TREMOR_MS);
      return () => {
        clearTimeout(inicio);
        clearTimeout(fim);
        setTremendo(false);
      };
    }
    return undefined;
  }, [s.estado]);

  // ?debug=bossDefeat: pula a luta direto pra vitória
  useEffect(() => {
    if (debugFinal && tela === "batalha" && s.estado === "intro") {
      prepararCutsceneFinal();
      despachar({ tipo: "DEBUG_VITORIA" });
    }
  }, [debugFinal, tela, s.estado]);

  // Vitória: salva ANTES da animação (abre o baú no servidor e guarda o
  // prêmio na sessão) e só então toca a cutscene final.
  useEffect(() => {
    if (s.estado !== "victory") return undefined;
    let ativo = true;
    pararSom("boss");
    const jaViu = lerArmazenado(localStorage, CHAVE_CUTSCENE_VISTA) === "1";
    gravarArmazenado(localStorage, CHAVE_CUTSCENE_VISTA, "1");
    const salvar =
      debugFinal || bauJaAberto
        ? Promise.resolve()
        : api
            .post("/baus/dragao/abrir", null, { timeout: 8000 })
            .then((res) => gravarArmazenado(sessionStorage, CHAVE_BAU_PENDENTE, JSON.stringify(res.data)))
            // falhou (rede)? a cutscene toca igual e o baú tenta abrir de novo na tela dele
            .catch(() => {});
    salvar.then(() => ativo && setFinal({ pular: jaViu || debugFinal, debug: debugFinal }));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.estado]);

  function concluirFinal() {
    if (final?.debug) navigate(bauJaAberto ? "/bau-dragao" : "/home", { replace: true });
    else navigate("/bau-dragao", { replace: true });
  }

  // temporizador do sopro: barra de cast e prazo esgotado
  useEffect(() => {
    if (s.estado !== "charging") return undefined;
    let quadro = 0;
    let esgotado = false;
    const passo = () => {
      const restante = Math.max(0, s.inicioCarga + s.prazoMs - performance.now());
      const fracao = 1 - restante / s.prazoMs;
      if (barraCastRef.current) barraCastRef.current.style.width = `${fracao * 100}%`;
      if (segundosRef.current) segundosRef.current.textContent = `${Math.ceil(restante / 1000)}s`;
      if (restante <= 0 && !esgotado) {
        esgotado = true;
        despachar({ tipo: "TEMPO_ESGOTADO" });
        return;
      }
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [s.estado, s.inicioCarga, s.prazoMs]);

  function responder(opcao) {
    despachar({ tipo: "RESPONDER", opcao });
  }

  function voltarAoMapa() {
    navigate("/home", { replace: true });
  }

  // ---------- Render ----------

  function botao(texto, onClick, secundario = false) {
    return (
      <BotaoPixel
        key={texto}
        className={`drg-botao ${secundario ? "drg-botao--secundario" : ""}`}
        classeMiolo="drg-botao-miolo"
        onClick={onClick}
      >
        {texto}
      </BotaoPixel>
    );
  }

  function renderCaixa(titulo, texto, botoes, classe = "") {
    return (
      <div className="drg-sobreposicao">
        <div className={`drg-caixa ${classe}`}>
          <strong className="drg-caixa-titulo">{titulo}</strong>
          {texto && <p className="drg-caixa-texto">{texto}</p>}
          <div className="drg-caixa-botoes">{botoes}</div>
        </div>
      </div>
    );
  }

  function renderPainel() {
    if (s.estado === "charging" && s.desafio) {
      return (
        <div className="drg-desafio" key={s.rodada}>
          <p className="drg-enunciado">{s.desafio.enunciado}</p>
          <CodigoDesafio codigo={s.desafio.codigo} />
          <div className="drg-opcoes">
            {s.desafio.opcoes.map((opcao) => (
              <button key={opcao} type="button" className="drg-opcao" onClick={() => responder(opcao)}>
                <code>{opcao}</code>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // a fúria vem antes do retorno do acerto que a causou
    if (s.estado === "furia") {
      return (
        <div className="drg-retorno drg-retorno--furia">
          <strong className="drg-retorno-titulo">MODO FÚRIA!</strong>
          <p className="drg-retorno-texto">O dragão ruge: o sopro carrega mais rápido e os enigmas agora têm laços!</p>
        </div>
      );
    }

    if (s.ultima) {
      const { acertou, motivo, correta, explicacao } = s.ultima;
      return (
        <div className={`drg-retorno ${acertou ? "drg-retorno--acerto" : "drg-retorno--erro"}`}>
          <strong className="drg-retorno-titulo">
            {acertou ? "Escudo de Código ativado! Contra-ataque!" : motivo === "tempo" ? "O tempo acabou!" : "Resposta errada!"}
          </strong>
          {!acertou && (
            <p className="drg-retorno-texto">
              A resposta certa era <code>{correta}</code>.
            </p>
          )}
          <p className="drg-retorno-texto">{explicacao}</p>
          {!acertou && s.estado === "idle" && (
            <div className="drg-retorno-botao">
              {botao("CONTINUAR", () => despachar({ tipo: "NOVA_RODADA", agora: performance.now() }))}
            </div>
          )}
        </div>
      );
    }

    return <p className="drg-aguardando">O dragão está se preparando...</p>;
  }

  if (tela !== "batalha") {
    return (
      <div className="drg-tela drg-tela--aviso">
        {tela === "carregando" && <p className="drg-carregando">A arena treme...</p>}
        {tela === "erro" &&
          renderCaixa("A arena não respondeu", "Verifique sua conexão e tente de novo.", [
            botao("TENTAR DE NOVO", () => window.location.reload()),
            botao("VOLTAR AO MAPA", voltarAoMapa, true),
          ])}
        {tela === "bloqueado" &&
          renderCaixa(
            "O dragão ainda dorme",
            "Só quem venceu os três portais pode despertar o Dragão do Código Fonte. Conclua a Vila Inicial, o Acampamento Goblin e a Arena do Dragão primeiro!",
            [botao("VOLTAR AO MAPA", voltarAoMapa)]
          )}
      </div>
    );
  }

  const fala = FALAS[indiceFala];
  const hpPorcento = (s.hpDragao / HP_DRAGAO) * 100;

  return (
    <div className={`drg-tela ${tremendo ? "drg-tela--tremendo" : ""} ${s.fase === 2 ? "drg-tela--furia" : ""}`}>
      {/* HUD do topo: nome, vida do dragão e barra do sopro */}
      <header className="drg-hud">
        <BotaoPixel className="drg-voltar" classeMiolo="drg-voltar-miolo" onClick={voltarAoMapa} aria-label="Voltar para o mapa">
          <i className="hn hn-arrow-left" aria-hidden="true" />
        </BotaoPixel>
        <div className="drg-boss">
          <div className="drg-boss-linha">
            <strong className="drg-boss-nome">DRAGÃO DO CÓDIGO FONTE</strong>
            <span className={`drg-fase ${s.fase === 2 ? "drg-fase--furia" : ""}`}>{s.fase === 2 ? "MODO FÚRIA" : "FASE 1"}</span>
          </div>
          <div className="drg-hp" role="progressbar" aria-label="Vida do dragão" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hpPorcento)}>
            <span className="drg-hp-fantasma" style={{ width: `${hpPorcento}%` }} />
            <span className="drg-hp-barra" style={{ width: `${hpPorcento}%` }} />
            <span className="drg-hp-texto">
              {s.hpDragao}/{HP_DRAGAO}
            </span>
          </div>
        </div>
      </header>

      <div className={`drg-cast ${s.estado === "charging" ? "drg-cast--ativo" : ""}`} aria-hidden={s.estado !== "charging"}>
        <span className="drg-cast-rotulo">
          <i className="hn hn-fire-solid" aria-hidden="true" /> SOPRO DE LOOP INFINITO
        </span>
        <div className="drg-cast-trilho">
          <span ref={barraCastRef} className="drg-cast-barra" />
        </div>
        <span ref={segundosRef} className="drg-cast-segundos" />
      </div>

      <div className="drg-palco">
        <canvas ref={canvasRef} className="drg-canvas" aria-label="Arena da batalha contra o dragão" />
        {/* vinheta do sopro e clarão da fúria: desenhados no canvas, em pixel (cenaDragao.js) */}
      </div>

      {/* status do jogador */}
      <div className="drg-jogador">
        <span className="drg-vidas" aria-label={`${s.vidas} de ${VIDAS} vidas`}>
          {Array.from({ length: VIDAS }, (_, i) => (
            <i key={i} className={`hn hn-heart-solid drg-coracao ${i < s.vidas ? "" : "drg-coracao--perdido"}`} aria-hidden="true" />
          ))}
        </span>
        <span className={`drg-escudo ${s.escudo ? "drg-escudo--ativo" : ""}`}>
          <i className="hn hn-badge-check-solid" aria-hidden="true" /> Escudo de Código: {s.escudo ? "ativo" : s.estado === "attacking" ? "quebrado!" : "inativo"}
        </span>
      </div>

      <section className="drg-painel" aria-live="polite">
        {renderPainel()}
      </section>

      {s.estado === "intro" && (
        <div className="drg-intro" onClick={avancarFala}>
          <BotaoPularFalas
            onPular={() => comecar()}
            className="drg-pular"
          />
          <div className={`drg-balao drg-balao--${fala.quem}`}>
            {fala.quem === "mago" && <img src={mago} alt="" className="drg-mago" draggable={false} />}
            <strong className="drg-balao-nome">{NOMES[fala.quem]}</strong>
            <p key={indiceFala} className="drg-balao-fala">
              {fala.texto}
            </p>
            <span className="drg-balao-continuar">
              Toque para continuar <i className="hn hn-play-solid" aria-hidden="true" />
            </span>
            <BarraAvancoFala chave={indiceFala} />
          </div>
        </div>
      )}

      {/* vitória: tela preta bloqueando tudo enquanto salva, depois a cutscene */}
      {s.estado === "victory" && (
        <Suspense fallback={<div className="final-cutscene" />}>
          {final ? (
            <BossDefeatCutscene camadas={camadasRef.current} permitirPular={final.pular} onConcluir={concluirFinal} />
          ) : (
            <div className="final-cutscene" aria-busy="true" />
          )}
        </Suspense>
      )}

      {s.estado === "defeat" &&
        renderCaixa(
          "Preso no loop infinito...",
          "O sopro do dragão te venceu desta vez. Revise os laços e as condições e volte para a revanche!",
          [botao("TENTAR DE NOVO", () => despachar({ tipo: "REINICIAR" })), botao("VOLTAR AO MAPA", voltarAoMapa, true)],
          "drg-caixa--derrota"
        )}
    </div>
  );
}

export default BatalhaDragao;
