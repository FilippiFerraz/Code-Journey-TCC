import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp } from "pixelarticons/react/ArrowUp.js";
import { CircleQuestion } from "pixelarticons/react/CircleQuestion.js";
import { Close } from "pixelarticons/react/Close.js";
import { CornerUpLeft } from "pixelarticons/react/CornerUpLeft.js";
import { CornerUpRight } from "pixelarticons/react/CornerUpRight.js";
import { Repeat } from "pixelarticons/react/Repeat.js";
import { Sword } from "pixelarticons/react/Sword.js";
import api from "../../services/api";
import BotaoPixel from "../../components/BotaoPixel";
import IconePixel from "../../components/IconePixel";
import { BarraAvancoFala, BotaoPularFalas } from "../../components/ControlesFalas";
import { useAvancoAutomatico } from "../../hooks/useAvancoAutomatico";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import { BASE_PERSONAGEM, ORDEM_CAMADAS, camadaDoItem } from "../../data/spritesPersonagem";
import { tocarSom } from "../../utils/sons";
import mago from "../../assets/images/Mago.webp";
import { BLOCOS, NIVEIS } from "./niveisCristais";
import { contarBlocos, estadoInicial, executarPrograma, prepararNivel } from "./interpretador";
import { criarCena } from "./cenaIsometrica";
import "./DesafioCristais.css";

// Desafio da Cachoeira de Cristais: aberto pelo Cristal Gigante ou pela
// cachoeira do mapa (Home.jsx) depois que o portal 1 está concluído. O
// jogador monta um programa com blocos (mover, girar, atacar, repetir, se)
// e o herói o executa num tabuleiro isométrico, passando por besouros e
// aranhas de código até o Cristal. São 3 fases (niveisCristais.js); vencer
// a última leva ao Baú de Cristal (/bau-cristal — BauDaSorte com os itens
// de Item.exclusivoCristal).

const FALAS = [
  "Viajante! Ouviu esse barulho? É a Cachoeira de Cristais — ela alimenta o Cristal Gigante, a fonte de magia da Vila.",
  "Besouros-bug e Aranhas de Código invadiram as pontes de pedra e estão drenando a energia do cristal!",
  "Aqui as pontes são encantadas: o herói não anda sozinho, só obedece a comandos. Monte um programa com os blocos e aperte EXECUTAR.",
  "Chegue ao Cristal nas 3 fases. Vença a última e o Cristal Gigante te dará um Baú de Cristal!",
];

// Tempo de cada passo da animação (dividido pela velocidade escolhida).
const DURACAO_PASSO_MS = 560;
const DURACAO_CONDICAO_MS = 320;
const VELOCIDADES = [1, 2];

const ICONES_BLOCO = {
  mover: ArrowUp,
  esquerda: CornerUpLeft,
  direita: CornerUpRight,
  atacar: Sword,
  repetir: Repeat,
  se: CircleQuestion,
};

const ROTULOS_CONDICAO = { inimigo: "inimigo à frente", livre: "caminho livre" };

// Fase mais alta já liberada neste navegador — só conveniência pra não
// refazer as fases ao voltar. Sem storage, começa da fase 1.
const CHAVE_FASE = "codejourney:cristaisFase";
function lerFaseLiberada() {
  try {
    const n = Number(localStorage.getItem(CHAVE_FASE));
    return Number.isInteger(n) && n > 0 ? Math.min(n, NIVEIS.length - 1) : 0;
  } catch {
    return 0;
  }
}
function salvarFaseLiberada(indice) {
  try {
    localStorage.setItem(CHAVE_FASE, String(indice));
  } catch {
    // sem storage: só não lembra na próxima visita
  }
}

// ---------- Programa (árvore de blocos) ----------

let proximoId = 1;
function novoBloco(tipo) {
  const bloco = { id: proximoId++, tipo };
  if (tipo === "repetir") return { ...bloco, vezes: 3, corpo: [] };
  if (tipo === "se") return { ...bloco, condicao: "inimigo", corpo: [] };
  return bloco;
}

function adicionarEm(lista, alvoId, bloco) {
  if (alvoId === null) return [...lista, bloco];
  return lista.map((b) =>
    b.id === alvoId ? { ...b, corpo: [...b.corpo, bloco] } : b.corpo ? { ...b, corpo: adicionarEm(b.corpo, alvoId, bloco) } : b
  );
}

function removerDe(lista, id) {
  return lista.filter((b) => b.id !== id).map((b) => (b.corpo ? { ...b, corpo: removerDe(b.corpo, id) } : b));
}

function atualizarEm(lista, id, mudanca) {
  return lista.map((b) =>
    b.id === id ? { ...b, ...mudanca } : b.corpo ? { ...b, corpo: atualizarEm(b.corpo, id, mudanca) } : b
  );
}

function contem(lista, id) {
  return lista.some((b) => b.id === id || (b.corpo && contem(b.corpo, id)));
}

function carregarCamadas(itensEquipados) {
  return ORDEM_CAMADAS.map((slot) => {
    if (slot === "base") return BASE_PERSONAGEM;
    const item = itensEquipados.find((it) => it?.tipo === slot);
    return camadaDoItem(item?.imagemUrl);
  })
    .filter(Boolean)
    .map((src) => {
      const imagem = new Image();
      imagem.src = src;
      return imagem;
    });
}

// ---------- Peças da interface ----------

function RotuloBloco({ tipo }) {
  return (
    <>
      <IconePixel icone={ICONES_BLOCO[tipo]} className="crs-bloco-icone" />
      <span>{BLOCOS[tipo].rotulo}</span>
    </>
  );
}

function ListaPrograma({ lista, editavel, alvoId, blocoAtivo, condicaoAtiva, aoRemover, aoEscolherAlvo, aoMudar }) {
  return lista.map((bloco) => {
    const categoria = BLOCOS[bloco.tipo].categoria;
    const ativo = blocoAtivo === bloco.id;
    const container = Boolean(bloco.corpo);
    return (
      <div key={bloco.id} className="crs-item">
        <div className={`crs-bloco crs-bloco--${categoria} ${ativo ? "crs-bloco--ativo" : ""}`}>
          <IconePixel icone={ICONES_BLOCO[bloco.tipo]} className="crs-bloco-icone" />
          {bloco.tipo === "repetir" ? (
            <span className="crs-bloco-texto">
              Repetir
              <button
                type="button"
                className="crs-mini"
                disabled={!editavel || bloco.vezes <= 2}
                onClick={() => aoMudar(bloco.id, { vezes: bloco.vezes - 1 })}
                aria-label="Repetir menos vezes"
              >
                −
              </button>
              <strong className="crs-vezes">{bloco.vezes}</strong>
              <button
                type="button"
                className="crs-mini"
                disabled={!editavel || bloco.vezes >= 9}
                onClick={() => aoMudar(bloco.id, { vezes: bloco.vezes + 1 })}
                aria-label="Repetir mais vezes"
              >
                +
              </button>
              vezes
            </span>
          ) : bloco.tipo === "se" ? (
            <span className="crs-bloco-texto">
              Se
              <button
                type="button"
                className="crs-condicao"
                disabled={!editavel}
                onClick={() => aoMudar(bloco.id, { condicao: bloco.condicao === "inimigo" ? "livre" : "inimigo" })}
                title="Trocar a condição"
              >
                {ROTULOS_CONDICAO[bloco.condicao]}
              </button>
              {ativo && condicaoAtiva !== null && (
                <span className={`crs-resultado ${condicaoAtiva ? "crs-resultado--sim" : "crs-resultado--nao"}`}>
                  {condicaoAtiva ? "sim" : "não"}
                </span>
              )}
            </span>
          ) : (
            <span className="crs-bloco-texto">{BLOCOS[bloco.tipo].rotulo}</span>
          )}
          {editavel && (
            <button type="button" className="crs-remover" onClick={() => aoRemover(bloco.id)} aria-label="Remover bloco">
              <IconePixel icone={Close} />
            </button>
          )}
        </div>

        {container && (
          <div
            className={`crs-corpo ${alvoId === bloco.id ? "crs-corpo--alvo" : ""}`}
            onClick={
              editavel
                ? (e) => {
                    // só o fundo da caixa (ou a dica) escolhe o alvo — tocar num
                    // bloco de dentro não pode "vazar" pros Repetir/Se de fora
                    if (e.target === e.currentTarget || e.target.dataset.alvo) {
                      e.stopPropagation(); // senão o Repetir/Se de fora também se escolheria
                      aoEscolherAlvo(bloco.id);
                    }
                  }
                : undefined
            }
          >
            <ListaPrograma
              lista={bloco.corpo}
              editavel={editavel}
              alvoId={alvoId}
              blocoAtivo={blocoAtivo}
              condicaoAtiva={condicaoAtiva}
              aoRemover={aoRemover}
              aoEscolherAlvo={aoEscolherAlvo}
              aoMudar={aoMudar}
            />
            {editavel && (
              <span className="crs-corpo-dica" data-alvo="1">
                {alvoId === bloco.id ? "Os próximos blocos entram aqui" : "Toque aqui para colocar blocos dentro"}
              </span>
            )}
          </div>
        )}
      </div>
    );
  });
}

// ---------- Tela ----------

function DesafioCristais() {
  const navigate = useNavigate();
  const itensEquipados = usePersonagemAvatar();

  // carregando | bloqueado | erro | historia | jogo
  const [fase, setFase] = useState("carregando");
  const [bauJaAberto, setBauJaAberto] = useState(false);
  const [indiceFala, setIndiceFala] = useState(0);

  const [nivelAtual, setNivelAtual] = useState(lerFaseLiberada);
  const [faseLiberada, setFaseLiberada] = useState(lerFaseLiberada);
  // briefing | editando | executando | falhou | venceu
  const [execucao, setExecucao] = useState("briefing");
  const [programa, setPrograma] = useState([]);
  const [alvoId, setAlvoId] = useState(null);
  const [blocoAtivo, setBlocoAtivo] = useState(null);
  const [condicaoAtiva, setCondicaoAtiva] = useState(null);
  const [mensagemErro, setMensagemErro] = useState("");
  const [velocidade, setVelocidade] = useState(1);

  const canvasRef = useRef(null);
  const cenaRef = useRef(null);
  const timersRef = useRef([]);

  const nivel = NIVEIS[nivelAtual];
  const ultimoNivel = nivelAtual === NIVEIS.length - 1;
  const totalBlocos = contarBlocos(programa);
  const editavel = execucao === "editando";
  const cheio = totalBlocos >= nivel.limiteBlocos;

  // ---------- Situação (liberado? baú já aberto?) ----------

  useEffect(() => {
    let ativo = true;
    api
      .get("/baus/cristal")
      .then((res) => {
        if (!ativo) return;
        setBauJaAberto(Boolean(res.data.aberto));
        setFase(res.data.liberado ? "historia" : "bloqueado");
      })
      .catch(() => ativo && setFase("erro"));
    return () => {
      ativo = false;
    };
  }, []);

  function avancarFala() {
    if (fase !== "historia") return;
    if (indiceFala < FALAS.length - 1) setIndiceFala((i) => i + 1);
    else setFase("jogo");
  }
  useAvancoAutomatico(fase === "historia", indiceFala, avancarFala);

  // ---------- Cena ----------

  const camadas = useMemo(() => carregarCamadas(itensEquipados), [itensEquipados]);
  const camadasRef = useRef(camadas);
  useEffect(() => {
    camadasRef.current.splice(0, camadasRef.current.length, ...camadas);
  }, [camadas]);

  const cenario = useMemo(() => prepararNivel(nivel), [nivel]);

  useEffect(() => {
    if (fase !== "jogo" || !canvasRef.current) return undefined;
    const cena = criarCena(canvasRef.current, cenario, { camadas: camadasRef.current });
    cena.mostrar(estadoInicial(cenario));
    cenaRef.current = cena;
    return () => {
      cena.destruir();
      cenaRef.current = null;
    };
  }, [fase, cenario]);

  function limparTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  useEffect(() => limparTimers, []);

  // ---------- Edição ----------

  function adicionar(tipo) {
    if (!editavel || cheio) return;
    const bloco = novoBloco(tipo);
    setPrograma((p) => adicionarEm(p, alvoId !== null && contem(p, alvoId) ? alvoId : null, bloco));
  }

  function remover(id) {
    setPrograma((p) => removerDe(p, id));
    setAlvoId((a) => (a === id ? null : a));
  }

  function mudar(id, mudanca) {
    setPrograma((p) => atualizarEm(p, id, mudanca));
  }

  // Tocar numa caixa de Repetir/Se sempre a escolhe (não alterna): pra voltar
  // ao programa principal há o botão "Programa principal" no topo do editor.
  function escolherAlvo(id) {
    setAlvoId(id);
  }

  function limparPrograma() {
    setPrograma([]);
    setAlvoId(null);
  }

  // ---------- Execução ----------

  function executar() {
    if (!editavel || programa.length === 0) return;
    const { quadros, resultado } = executarPrograma(nivel, programa);
    setExecucao("executando");
    setAlvoId(null);

    let anterior = estadoInicial(cenario);
    let espera = 0;
    for (const quadro of quadros) {
      const ehCondicao = quadro.acao === "condicao";
      const duracao = (ehCondicao ? DURACAO_CONDICAO_MS : DURACAO_PASSO_MS) / velocidade;
      const de = anterior;
      timersRef.current.push(
        setTimeout(() => {
          setBlocoAtivo(quadro.blocoId);
          setCondicaoAtiva(ehCondicao ? quadro.condicao : null);
          if (!ehCondicao) cenaRef.current?.animar(de, quadro.estado, quadro, duracao);
          if (quadro.acao === "atacar" && quadro.acertou) tocarSom("acerto");
        }, espera)
      );
      espera += duracao;
      anterior = quadro.estado;
    }

    timersRef.current.push(
      setTimeout(() => {
        setBlocoAtivo(null);
        setCondicaoAtiva(null);
        if (resultado.tipo === "vitoria") {
          cenaRef.current?.vitoria();
          tocarSom("recompensa");
          if (!ultimoNivel && nivelAtual + 1 > faseLiberada) {
            setFaseLiberada(nivelAtual + 1);
            salvarFaseLiberada(nivelAtual + 1);
          }
          timersRef.current.push(setTimeout(() => setExecucao("venceu"), 900));
        } else {
          cenaRef.current?.erro();
          tocarSom("erro");
          setMensagemErro(resultado.mensagem);
          timersRef.current.push(setTimeout(() => setExecucao("falhou"), 700));
        }
      }, espera + 80)
    );
  }

  function corrigir() {
    limparTimers();
    cenaRef.current?.mostrar(estadoInicial(cenario));
    setBlocoAtivo(null);
    setCondicaoAtiva(null);
    setExecucao("editando");
  }

  function irParaNivel(indice) {
    if (indice > faseLiberada || execucao === "executando") return;
    limparTimers();
    setNivelAtual(indice);
    setPrograma([]);
    setAlvoId(null);
    setBlocoAtivo(null);
    setExecucao("briefing");
  }

  function voltarAoMapa() {
    navigate("/home", { replace: true });
  }

  // ---------- Render ----------

  function botao(texto, onClick, secundario = false) {
    return (
      <BotaoPixel
        key={texto}
        className={`crs-botao ${secundario ? "crs-botao--secundario" : ""}`}
        classeMiolo="crs-botao-miolo"
        onClick={onClick}
      >
        {texto}
      </BotaoPixel>
    );
  }

  function renderCaixa(titulo, conteudo, botoes) {
    return (
      <div className="crs-sobreposicao">
        <div className="crs-caixa">
          <strong className="crs-caixa-titulo">{titulo}</strong>
          {conteudo}
          <div className="crs-caixa-botoes">{botoes}</div>
        </div>
      </div>
    );
  }

  function renderSobreposicao() {
    if (execucao === "briefing") {
      return renderCaixa(
        `Fase ${nivelAtual + 1}: ${nivel.titulo}`,
        <>
          <span className="crs-conceito">Conceito: {nivel.conceito}</span>
          <p className="crs-caixa-texto">{nivel.objetivo}</p>
          <div className="crs-caixa-blocos">
            {nivel.blocos.map((tipo) => (
              <span key={tipo} className={`crs-bloco crs-bloco--${BLOCOS[tipo].categoria} crs-bloco--mini`}>
                <RotuloBloco tipo={tipo} />
              </span>
            ))}
          </div>
          <p className="crs-caixa-texto crs-caixa-texto--pequeno">Limite: {nivel.limiteBlocos} blocos.</p>
        </>,
        [botao("PROGRAMAR!", () => setExecucao("editando"))]
      );
    }
    if (execucao === "falhou") {
      return renderCaixa(
        "Bug encontrado!",
        <p className="crs-caixa-texto">{mensagemErro}</p>,
        [botao("CORRIGIR O PROGRAMA", corrigir)]
      );
    }
    if (execucao === "venceu") {
      if (!ultimoNivel) {
        return renderCaixa(
          "Fase concluída!",
          <p className="crs-caixa-texto">O herói chegou ao Cristal. A próxima ponte acabou de se iluminar!</p>,
          [botao("PRÓXIMA FASE", () => irParaNivel(nivelAtual + 1)), botao("REFAZER ESTA FASE", corrigir, true)]
        );
      }
      return renderCaixa(
        "O Cristal Gigante voltou a brilhar!",
        <p className="crs-caixa-texto">
          {bauJaAberto
            ? "Você já recebeu o Baú de Cristal antes — mas o cristal agradece de novo!"
            : "A magia voltou para a Vila. Como agradecimento, o Cristal Gigante abriu um Baú de Cristal para você."}
        </p>,
        bauJaAberto
          ? [botao("VER O BAÚ DE CRISTAL", () => navigate("/bau-cristal", { replace: true })), botao("VOLTAR AO MAPA", voltarAoMapa, true)]
          : [botao("ABRIR O BAÚ DE CRISTAL", () => navigate("/bau-cristal", { replace: true }))]
      );
    }
    return null;
  }

  if (fase === "jogo") {
    return (
      <div className="crs-tela crs-tela--jogo">
        <header className="crs-topo">
          <BotaoPixel className="crs-voltar" classeMiolo="crs-voltar-miolo" onClick={voltarAoMapa} aria-label="Voltar para o mapa">
            <i className="hn hn-arrow-left" aria-hidden="true" />
          </BotaoPixel>
          <div className="crs-topo-textos">
            <strong className="crs-topo-titulo">Cachoeira de Cristais</strong>
            <span className="crs-topo-sub">
              Fase {nivelAtual + 1}: {nivel.titulo}
            </span>
          </div>
          <div className="crs-fases" role="tablist" aria-label="Fases">
            {NIVEIS.map((n, i) => (
              <button
                key={n.titulo}
                type="button"
                role="tab"
                aria-selected={i === nivelAtual}
                className={`crs-fase ${i === nivelAtual ? "crs-fase--atual" : ""}`}
                disabled={i > faseLiberada || execucao === "executando"}
                onClick={() => irParaNivel(i)}
                aria-label={`Fase ${i + 1}${i > faseLiberada ? " (bloqueada)" : ""}`}
              >
                {i > faseLiberada ? <i className="hn hn-lock-solid" aria-hidden="true" /> : i + 1}
              </button>
            ))}
          </div>
        </header>

        <div className="crs-palco">
          <canvas ref={canvasRef} className="crs-canvas" aria-label="Tabuleiro da fase" />
        </div>

        <section className="crs-editor" aria-label="Programa">
          <div className="crs-editor-topo">
            <button
              type="button"
              className={`crs-alvo ${alvoId === null ? "crs-alvo--ativo" : ""}`}
              onClick={() => setAlvoId(null)}
              disabled={!editavel}
            >
              Programa principal
            </button>
            <span className={`crs-contador ${cheio ? "crs-contador--cheio" : ""}`}>
              {totalBlocos}/{nivel.limiteBlocos} blocos
            </span>
          </div>

          <div className="crs-programa">
            {programa.length === 0 ? (
              <p className="crs-vazio">Toque nos blocos abaixo para montar o programa.</p>
            ) : (
              <ListaPrograma
                lista={programa}
                editavel={editavel}
                alvoId={alvoId}
                blocoAtivo={blocoAtivo}
                condicaoAtiva={condicaoAtiva}
                aoRemover={remover}
                aoEscolherAlvo={escolherAlvo}
                aoMudar={mudar}
              />
            )}
          </div>

          <div className="crs-paleta">
            {nivel.blocos.map((tipo) => (
              <button
                key={tipo}
                type="button"
                className={`crs-bloco crs-bloco--${BLOCOS[tipo].categoria} crs-bloco--paleta`}
                onClick={() => adicionar(tipo)}
                disabled={!editavel || cheio}
              >
                <RotuloBloco tipo={tipo} />
              </button>
            ))}
          </div>

          <div className="crs-acoes">
            <button type="button" className="crs-acao-secundaria" onClick={limparPrograma} disabled={!editavel || programa.length === 0}>
              <i className="hn hn-trash-solid" aria-hidden="true" /> Limpar
            </button>
            <BotaoPixel
              className="crs-executar"
              classeMiolo="crs-executar-miolo"
              onClick={executar}
              disabled={!editavel || programa.length === 0}
            >
              <i className="hn hn-play-solid" aria-hidden="true" /> {execucao === "executando" ? "EXECUTANDO..." : "EXECUTAR"}
            </BotaoPixel>
            <button
              type="button"
              className="crs-acao-secundaria"
              onClick={() => setVelocidade((v) => VELOCIDADES[(VELOCIDADES.indexOf(v) + 1) % VELOCIDADES.length])}
              aria-label={`Velocidade ${velocidade}x`}
            >
              <i className="hn hn-bolt-solid" aria-hidden="true" /> {velocidade}x
            </button>
          </div>
        </section>

        {/* por cima da tela toda (tabuleiro + editor), dentro da moldura do app */}
        {renderSobreposicao()}
      </div>
    );
  }

  return (
    <div className="crs-tela crs-tela--historia" onClick={fase === "historia" ? avancarFala : undefined}>
      <BotaoPixel
        className="crs-voltar crs-voltar--fixo"
        classeMiolo="crs-voltar-miolo"
        onClick={(e) => {
          e.stopPropagation();
          voltarAoMapa();
        }}
        aria-label="Voltar para o mapa"
      >
        <i className="hn hn-arrow-left" aria-hidden="true" />
      </BotaoPixel>

      {fase === "historia" && <BotaoPularFalas onPular={() => setFase("jogo")} className="crs-pular" />}

      <div className="crs-faixa">
        <i className="hn hn-sparkles-solid crs-faixa-icone" aria-hidden="true" />
        <h1 className="crs-faixa-titulo">DESAFIO DA CACHOEIRA DE CRISTAIS</h1>
      </div>

      {fase === "carregando" && <p className="crs-mensagem">A névoa da cachoeira está se abrindo...</p>}

      {fase === "erro" &&
        renderCaixa("A cachoeira não respondeu", <p className="crs-caixa-texto">Verifique sua conexão e tente de novo.</p>, [
          botao("TENTAR DE NOVO", () => window.location.reload()),
          botao("VOLTAR AO MAPA", voltarAoMapa, true),
        ])}

      {fase === "bloqueado" &&
        renderCaixa(
          "A ponte está submersa",
          <p className="crs-caixa-texto">
            O caminho até o Cristal Gigante só aparece para quem já venceu a Vila Inicial. Conclua o primeiro portal e volte aqui!
          </p>,
          [botao("VOLTAR AO MAPA", voltarAoMapa)]
        )}

      {fase === "historia" && (
        <div className="crs-historia">
          <img src={mago} alt="" className="crs-mago" draggable={false} />
          <div className="crs-balao" aria-live="polite">
            <strong className="crs-balao-nome">Mago da Corte</strong>
            <p key={indiceFala} className="crs-balao-fala">
              {FALAS[indiceFala]}
            </p>
            <span className="crs-balao-continuar">
              Toque para continuar <i className="hn hn-play-solid" aria-hidden="true" />
            </span>
            <BarraAvancoFala chave={indiceFala} />
          </div>
        </div>
      )}
    </div>
  );
}

export default DesafioCristais;
