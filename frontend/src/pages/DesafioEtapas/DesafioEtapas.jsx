import { Suspense, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { usePersonagemAvatar, useAparenciaPropria } from "../../hooks/usePersonagemAvatar";
import { APARENCIA_PADRAO } from "../../data/spritesPersonagem";
import { useCronometro } from "../../hooks/useCronometro";
import { useCongelarTempo } from "../../hooks/useCongelarTempo";
import { textoMoedasElixir } from "../../utils/loja";
import { formatarTempo } from "../../utils/tempo";
import { tocarSom } from "../../utils/sons";
import AvatarPersonagem from "../../components/AvatarPersonagem";
import BotaoPixel from "../../components/BotaoPixel";
import ConfirmarSairDesafio from "../../components/ConfirmarSairDesafio";
import Temporizador from "../../components/Temporizador";
import MochilaItens from "../../components/MochilaItens";
import ControleMusica from "../../components/ControleMusica";
import guerreiroAtaque from "../../assets/images/Guerreiro_ataque.gif";
import { cenaDoDesafio } from "../../data/cenasPortal3";
import { falaDerrota, falaGolpeCerteiro, falasGolpe, tituloDerrotado } from "../../utils/textosInimigo";
import IntroEtapas from "./IntroEtapas";
import { GrupoInimigos } from "./SpriteInimigo";
import { EXERCICIOS, TITULO_PAINEL, precarregarExercicios } from "./exercicios";
import "../ResolverDesafio/ResolverDesafio.css";
import "../DesafioChefe/DesafioChefe.css";
import "./DesafioEtapas.css";

// Desafios com várias etapas (Portal 3) no MESMO padrão visual dos outros
// portais: introdução com o inimigo (IntroEtapas, visual de DesafioIntro)
// e uma batalha por etapa com a cena de ResolverDesafio.jsx — fundo, herói
// × inimigo, 3 corações, cronômetro, golpe/dano — ou a arena de
// DesafioChefe.jsx no desafio-chefe. A vida do inimigo tem um segmento por
// etapa: cada etapa vencida tira um; a última derruba o inimigo e leva à
// tela de recompensa.
//
// Diferente dos outros portais, o gabarito NÃO fica no frontend: o
// conteúdo vem de GET /api/desafios/:mundoId/:dificuldade/:numero e toda
// resposta é conferida pelo servidor — a da etapa inteira em POST
// /api/progresso (que guarda o avanço) e, nos exercícios ação-por-ação
// (cartões, poção, chefe), cada ação em POST .../verificar.
//
// Inimigos, fundos e falas: data/cenasPortal3.js. Um desafio pode ter um
// GRUPO de inimigos (portal 2): a tela continua tratando-o como um inimigo
// só — uma barra de vida, um estado de ataque/dano/morte — e GrupoInimigos
// aplica esse estado a todos os sprites ao mesmo tempo.

const VIDA_MAXIMA = 3;
// Duração do GIF de ataque do herói — mesmo valor de ResolverDesafio.jsx.
const DURACAO_GIF_ATAQUE_MS = 600;

export default function DesafioEtapas() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();
  const itensEquipados = usePersonagemAvatar();
  // O GIF de ataque é do guerreiro original: as outras aparências fazem a
  // investida (mesma animação CSS) com o próprio avatar em camadas.
  const usaGifAtaque = (useAparenciaPropria() ?? APARENCIA_PADRAO) === APARENCIA_PADRAO;
  const cena = cenaDoDesafio(Number(desafioId), Number(mundoId));
  const nomeInimigo = cena.nome;

  const [desafio, setDesafio] = useState(null);
  const [erroCarregar, setErroCarregar] = useState("");
  const [fase, setFase] = useState("intro"); // "intro" | "batalha"
  const [etapaAtual, setEtapaAtual] = useState(1);

  // null | "erro" | "derrota" | "acertando" | "etapaVencida" | "vitoria"
  const [resultado, setResultado] = useState(null);
  const [vida, setVida] = useState(VIDA_MAXIMA);
  const [enviando, setEnviando] = useState(false);
  const [feedbackIA, setFeedbackIA] = useState("");
  const [avisoFalha, setAvisoFalha] = useState("");
  const [resultadoApi, setResultadoApi] = useState(null);
  // Muda a cada nova tentativa/etapa — remonta o exercício do zero.
  const [tentativa, setTentativa] = useState(0);
  const [mostrarConfirmarSair, setMostrarConfirmarSair] = useState(false);

  // Animações da cena (mesmas de ResolverDesafio.jsx / DesafioChefe.jsx)
  const [tomandoGolpe, setTomandoGolpe] = useState(false);
  const [golpeHeroi, setGolpeHeroi] = useState(false);
  const [cicloAtaque, setCicloAtaque] = useState(0);
  const [inimigoFerido, setInimigoFerido] = useState(false);
  const [inimigoMorrendo, setInimigoMorrendo] = useState(false);
  const [foco, setFoco] = useState(false);
  const [chefeEsquivando, setChefeEsquivando] = useState(false);

  const etapa = desafio?.etapas[etapaAtual - 1];
  const total = desafio?.etapas.length ?? 0;
  const ehDissertativa = etapa?.tipo === "dissertativa";
  const ehBatalhaChefe = etapa?.tipo === "batalha_chefe";
  const corrigindo = enviando && ehDissertativa;
  const travado =
    enviando || tomandoGolpe || ["acertando", "etapaVencida", "vitoria", "derrota"].includes(resultado);

  // Segmentos de vida do inimigo = etapas que faltam vencer.
  const etapasVencidas = etapaAtual - 1 + (["etapaVencida", "vitoria"].includes(resultado) ? 1 : 0);
  const vidaInimigo = total - etapasVencidas;

  // Tempo TOTAL do desafio (todas as etapas), pausado em animações/espera.
  const cronometroAtivo = fase === "batalha" && (resultado === null || resultado === "erro") && !enviando;
  const congelamento = useCongelarTempo(cronometroAtivo);
  const [segundos] = useCronometro(cronometroAtivo && !congelamento.congelado);

  function carregar() {
    return api.get(`/desafios/${mundoId}/${dificuldade}/${desafioId}`).then(({ data }) => {
      setDesafio(data);
      precarregarExercicios(data.etapas.map((e) => e.tipo));
      // Continua de onde parou; desafio já concluído recomeça da etapa 1.
      const { concluido, etapasConcluidas, totalEtapas } = data.progresso;
      setEtapaAtual(concluido ? 1 : Math.min(etapasConcluidas + 1, totalEtapas));
    });
  }

  useEffect(() => {
    carregar().catch((erro) => setErroCarregar(erro.response?.data?.erro || "Não foi possível carregar este desafio."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mundoId, dificuldade, desafioId]);

  // Som de entrada do chefe, como em DesafioChefe.jsx.
  useEffect(() => {
    if (cena.chefe) tocarSom("boss");
  }, [cena.chefe]);

  function limparErro() {
    setAvisoFalha("");
    if (resultado === "erro") setResultado(null);
  }

  function sofrerGolpe() {
    tocarSom("erro");
    setTomandoGolpe(true);
    const restante = vida - 1;
    setVida(restante);
    setResultado(restante <= 0 ? "derrota" : "erro");
    setTimeout(() => setTomandoGolpe(false), 600);
  }

  // Golpe do herói que NÃO derruba o inimigo (venceu uma etapa que não é a
  // última): ataque + inimigo sentindo o golpe + painel "Etapa vencida".
  function vencerEtapa() {
    tocarSom("acerto");
    setResultado("acertando");
    setCicloAtaque((c) => c + 1);
    setGolpeHeroi(true);
    setTimeout(() => setInimigoFerido(true), 450);
    setTimeout(() => setGolpeHeroi(false), DURACAO_GIF_ATAQUE_MS);
    setTimeout(() => setInimigoFerido(false), 1100);
    setTimeout(() => setResultado("etapaVencida"), 1300);
  }

  // Golpe final — mesma sequência de vencer() em ResolverDesafio.jsx.
  function vencerDesafio() {
    tocarSom("acerto");
    setResultado("acertando");
    setCicloAtaque((c) => c + 1);
    setGolpeHeroi(true);
    setTimeout(() => {
      setInimigoMorrendo(true);
      setFoco(true);
    }, 450);
    setTimeout(() => setGolpeHeroi(false), DURACAO_GIF_ATAQUE_MS);
    setTimeout(() => setResultado("vitoria"), 1700);
  }

  // Resposta completa da etapa — conferida e registrada pelo servidor.
  async function responder(resposta) {
    setEnviando(true);
    setAvisoFalha("");
    setFeedbackIA("");
    try {
      const { data } = await api.post("/progresso", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: Number(desafioId),
        etapa: etapaAtual,
        tempoSegundos: segundos,
        ...resposta,
      });
      setFeedbackIA(data.feedbackIA || "");
      if (!data.correta) {
        sofrerGolpe();
        return;
      }
      setResultadoApi(data);
      if (data.desafioConcluido) vencerDesafio();
      else vencerEtapa();
    } catch (erro) {
      // Falha do servidor/IA ou etapa fora de ordem: não tira vida — a
      // falha não foi do jogador. No 409, sincroniza o avanço.
      setAvisoFalha(erro.response?.data?.erro || "Não foi possível enviar a resposta. Verifique sua conexão e tente de novo.");
      if (erro.response?.status === 409) carregar().catch(() => {});
    } finally {
      setEnviando(false);
    }
  }

  // Confere UMA ação (cartão, ingrediente, golpe no chefe) sem registrar.
  async function verificar(dados) {
    try {
      const { data } = await api.post(`/desafios/${mundoId}/${dificuldade}/${desafioId}/verificar`, {
        etapa: etapaAtual,
        ...dados,
      });
      return data.correto;
    } catch (erro) {
      setAvisoFalha(erro.response?.data?.erro || "Não foi possível conferir agora. Tente de novo.");
      if (erro.response?.status === 409) carregar().catch(() => {});
      return null;
    }
  }

  function animarChefe(tipo) {
    if (tipo === "atingido") {
      setInimigoFerido(true);
      setTimeout(() => setInimigoFerido(false), 600);
    } else {
      setChefeEsquivando(true);
      setTimeout(() => setChefeEsquivando(false), 700);
    }
  }

  function reiniciarRodada() {
    setVida(VIDA_MAXIMA);
    setResultado(null);
    setFeedbackIA("");
    setAvisoFalha("");
    setTomandoGolpe(false);
    setGolpeHeroi(false);
    setInimigoFerido(false);
    setTentativa((t) => t + 1);
  }

  function proximaEtapa() {
    reiniciarRodada();
    setEtapaAtual((e) => e + 1);
  }

  function irParaRecompensa() {
    navigate(`/recompensa/${mundoId}/${dificuldade}/${desafioId}`, {
      state: { resultado: resultadoApi, tempoSegundos: segundos },
    });
  }

  // ---------------------------------------------------------------------

  if (erroCarregar) {
    return (
      <div className="desafio-tela">
        <div className="derrota etapas-erro-carregar">
          <h2 className="derrota-titulo">Ops!</h2>
          <p className="derrota-fala">{erroCarregar}</p>
          <BotaoPixel className="botao-avante" classeMiolo="botao-avante-miolo" onClick={() => navigate(`/desafios/${mundoId}/${dificuldade}`)}>
            VOLTAR AOS DESAFIOS
          </BotaoPixel>
        </div>
      </div>
    );
  }

  if (!desafio) {
    return (
      <div className="desafio-tela">
        <p className="etapas-carregando">Carregando desafio…</p>
      </div>
    );
  }

  if (fase === "intro") {
    return (
      <IntroEtapas
        desafio={desafio}
        cena={cena}
        etapaInicial={etapaAtual}
        onIniciar={() => setFase("batalha")}
        onVoltar={() => navigate(-1)}
      />
    );
  }

  const Exercicio = EXERCICIOS[etapa.tipo];
  const golpes = falasGolpe(nomeInimigo, cena.grupo);
  const falaGolpe = golpes[VIDA_MAXIMA - 1 - vida] || golpes.at(-1);

  // Segmentos de vida do inimigo (um por etapa)
  const barraVidaInimigo = (classeBarra, classeSegmento) => (
    <div className={classeBarra} aria-label={`Vida de ${nomeInimigo}: ${vidaInimigo} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`${classeSegmento} ${i < vidaInimigo ? "" : `${classeSegmento}--vazio`}`} />
      ))}
    </div>
  );

  const coracoes = (
    <div className="cena-vida" aria-label={`Vida: ${vida} de ${VIDA_MAXIMA}`}>
      {Array.from({ length: VIDA_MAXIMA }).map((_, i) => (
        <span key={i} className={`coracao ${i < vida ? "" : "coracao--vazio"}`} aria-hidden="true">
          <i className="hn hn-heart-solid" />
        </span>
      ))}
    </div>
  );

  // ---------- Cena: arena de chefe ----------
  function renderArenaChefe() {
    return (
      <section
        className="chefe-arena"
        style={{
          backgroundImage: `url(${cena.fundo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      >
        <div className="chefe-card chefe-card-topo">
          <div className="chefe-card-cabecalho">
            <span className="chefe-tag">CHEFE</span>
            <span className="chefe-nome">{nomeInimigo}</span>
          </div>
          {barraVidaInimigo("chefe-vida-barra", "chefe-vida-segmento")}
        </div>

        <div className="chefe-palco">
          <AvatarPersonagem
            itensEquipados={itensEquipados}
            className={`chefe-sprite-heroi ${tomandoGolpe ? "etapas-heroi--atingido" : ""}`}
          />
          <GrupoInimigos
            inimigos={cena.inimigos}
            nome={nomeInimigo}
            classeGrupo="grupo-inimigos--chefe"
            className={`chefe-sprite-chefe ${tomandoGolpe ? "etapas-chefe--atacando" : ""} ${
              inimigoFerido ? "chefe-sprite-chefe--atingido" : ""
            } ${
              chefeEsquivando ? "chefe-sprite-chefe--esquivando" : ""
            } ${inimigoMorrendo ? "chefe-sprite-chefe--derrotado" : ""}`}
          />
        </div>

        <Temporizador className="chefe-cronometro" segundos={segundos} regressivo={false} tamanho="medio" pausado={!cronometroAtivo} congelamento={congelamento}>
          <ControleMusica variante="jogo" />
          <MochilaItens congelamento={congelamento} />
        </Temporizador>

        <div className="chefe-card chefe-card-jogador">
          <span className="chefe-jogador-nome">{total > 1 ? `Etapa ${etapaAtual} de ${total}` : "Batalha final"}</span>
          {coracoes}
        </div>

        {(inimigoFerido || tomandoGolpe) && <div className="chefe-flash" />}
      </section>
    );
  }

  // ---------- Cena: batalha comum (ResolverDesafio.jsx) ----------
  function renderCena() {
    return (
      <section
        className={`cena ${tomandoGolpe ? "cena--golpe" : ""} ${foco ? "cena--foco" : ""}`}
        style={{
          backgroundImage: `url(${cena.fundo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      >
        <div className={`cena-palco ${foco ? "cena-palco--foco" : ""}`}>
          {golpeHeroi && usaGifAtaque ? (
            <img
              key={`heroi-ataque-${cicloAtaque}`}
              src={guerreiroAtaque}
              alt="Guerreiro"
              className="cena-heroi cena-heroi--golpeando"
              style={{ width: 120, height: 120, imageRendering: "pixelated" }}
              draggable={false}
            />
          ) : (
            <AvatarPersonagem
              key={golpeHeroi ? `heroi-ataque-${cicloAtaque}` : "heroi"}
              itensEquipados={itensEquipados}
              alt="Guerreiro"
              className={`cena-heroi ${golpeHeroi ? "cena-heroi--golpeando" : ""} ${
                tomandoGolpe ? "cena-heroi--atingido" : ""
              }`}
              style={{ width: 120, height: 120 }}
            />
          )}

          <GrupoInimigos
            inimigos={cena.inimigos}
            nome={nomeInimigo}
            classeGrupo="grupo-inimigos--cena"
            larguraPadrao={96}
            className={`cena-inimigo ${tomandoGolpe ? "cena-inimigo--atacando" : ""} ${
              inimigoFerido ? "etapas-inimigo--ferido" : ""
            } ${inimigoMorrendo ? "cena-inimigo--morrendo" : ""}`}
          />
        </div>

        {/* Vida do inimigo: um segmento por etapa */}
        <div className="etapas-hud-inimigo">
          <span className="etapas-hud-nome">
            {nomeInimigo} · Etapa {Math.min(etapaAtual, total)}/{total}
          </span>
          {barraVidaInimigo("etapas-hud-barra", "etapas-hud-segmento")}
        </div>

        {coracoes}

        <Temporizador className="cena-cronometro" segundos={segundos} regressivo={false} tamanho="medio" pausado={!cronometroAtivo} congelamento={congelamento}>
          <ControleMusica variante="jogo" />
          <MochilaItens congelamento={congelamento} />
        </Temporizador>

        {tomandoGolpe && <div className="cena-flash" />}
      </section>
    );
  }

  // ---------- Painel ----------
  function renderPainel() {
    if (resultado === "derrota") {
      return (
        <div className="derrota">
          <h2 className="derrota-titulo">Você caiu!</h2>
          <p className="derrota-fala">{falaDerrota(nomeInimigo, cena.grupo)}</p>
          {etapaAtual > 1 && (
            <p className="derrota-fala etapas-salvo">
              As etapas que você já venceu continuam salvas — você volta direto na etapa {etapaAtual}.
            </p>
          )}
          <BotaoPixel className="botao-avante botao-avante--roxo" classeMiolo="botao-avante-miolo botao-avante-miolo--roxo" onClick={reiniciarRodada}>
            TENTAR NOVAMENTE
          </BotaoPixel>
        </div>
      );
    }

    if (resultado === "vitoria") {
      return (
        <div className="vitoria">
          <h2 className="vitoria-titulo">{tituloDerrotado(nomeInimigo, cena.grupo)}</h2>
          <p className="vitoria-fala">
            {feedbackIA ||
              (total > 1
                ? `Você venceu as ${total} etapas! O caminho à frente está livre.`
                : `${nomeInimigo} ${cena.grupo ? "foram derrotados" : "foi derrotado"}! O caminho à frente está livre.`)}
          </p>
          {resultadoApi?.xpConcedidoAgora > 0 && (
            <div className="vitoria-recompensa">
              <span className="vitoria-recompensa-rotulo">XP ganho</span>
              <span className="vitoria-recompensa-valor">
                +{resultadoApi.xpConcedidoAgora} XP • Tempo: {formatarTempo(resultadoApi.tempoSegundos ?? segundos)}
                {resultadoApi.acertouDePrimeira ? " • Sem errar nenhuma etapa!" : ""}
                {textoMoedasElixir(resultadoApi)}
              </span>
            </div>
          )}
          <BotaoPixel className="botao-avante" classeMiolo="botao-avante-miolo" onClick={irParaRecompensa}>
            VER RECOMPENSA
          </BotaoPixel>
        </div>
      );
    }

    if (resultado === "etapaVencida") {
      const faltam = total - etapaAtual;
      return (
        <div className="vitoria">
          <h2 className="vitoria-titulo">Etapa {etapaAtual} vencida!</h2>
          <p className="vitoria-fala">
            {feedbackIA || `${nomeInimigo} ${cena.grupo ? "cambalearam" : "cambaleou"} com o golpe!`}{" "}
            {faltam === 1
              ? `Falta só mais uma etapa para ${cena.grupo ? "derrubá-los" : "derrubá-lo"}.`
              : `Faltam ${faltam} etapas para ${cena.grupo ? "derrubá-los" : "derrubá-lo"}.`}
          </p>
          <BotaoPixel className="botao-avante" classeMiolo="botao-avante-miolo" onClick={proximaEtapa}>
            PRÓXIMA ETAPA
          </BotaoPixel>
        </div>
      );
    }

    if (resultado === "acertando") {
      return (
        <div className="acerto-banner">
          <h2 className="acerto-titulo">Acertou!</h2>
          <p className="acerto-fala">{feedbackIA || falaGolpeCerteiro(nomeInimigo, cena.grupo)}</p>
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

    return (
      <>
        {/* Na batalha do chefe o painel é o grid original (diálogo + menu de
            ataques) — a etapa já aparece no card do jogador, na arena. */}
        {!ehBatalhaChefe && (
          <>
            <span className="etapas-tag">
              {total > 1 ? `Etapa ${etapaAtual} de ${total}` : "Desafio"}
              {etapa.titulo ? ` · ${etapa.titulo}` : ""}
            </span>
            <h2 className="painel-titulo">{TITULO_PAINEL[etapa.tipo]}</h2>
            <p className="painel-enunciado">{etapa.enunciado}</p>
            {etapa.codigo && (
              <pre className="dissertativa-codigo">
                <code>{etapa.codigo}</code>
              </pre>
            )}
          </>
        )}

        {Exercicio ? (
          // alguns tipos são carregados sob demanda (ver exercicios/index.js)
          <Suspense fallback={<p className="painel-enunciado">Carregando…</p>}>
            <Exercicio
              key={`${etapaAtual}-${tentativa}`}
              etapa={etapa}
              nomeChefe={nomeInimigo}
              travado={travado}
              emErro={resultado === "erro"}
              responder={responder}
              verificar={verificar}
              sofrerGolpe={sofrerGolpe}
              limparErro={limparErro}
              animarChefe={animarChefe}
            />
          </Suspense>
        ) : (
          <p className="painel-enunciado">Tipo de exercício ainda não suportado: {etapa.tipo}</p>
        )}

        {resultado === "erro" && (
          <div className="retorno retorno--erro">
            <p className="retorno-fala">{feedbackIA || falaGolpe}</p>
            {vida <= 1 && etapa.dica && <p className="retorno-dica">Dica: {etapa.dica}</p>}
          </div>
        )}

        {avisoFalha && (
          <div className="retorno retorno--erro">
            <p className="retorno-fala"><i className="hn hn-exclamation-triangle-solid icone-aviso" aria-hidden="true" /> {avisoFalha}</p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={cena.chefe ? "chefe-tela" : "desafio-tela"}>
      <BotaoPixel
        className={cena.chefe ? "chefe-voltar" : "desafio-voltar"}
        classeMiolo={cena.chefe ? "chefe-voltar-miolo" : "desafio-voltar-miolo"}
        onClick={() => setMostrarConfirmarSair(true)}
      >
        <i className="hn hn-arrow-left" aria-hidden="true" /> Voltar
      </BotaoPixel>

      {mostrarConfirmarSair && (
        <ConfirmarSairDesafio
          onManterDesafio={() => setMostrarConfirmarSair(false)}
          onSairDesafio={() => navigate(`/desafios/${mundoId}/${dificuldade}`, { replace: true })}
        />
      )}

      {cena.chefe ? renderArenaChefe() : renderCena()}

      <section className={ehBatalhaChefe && !["vitoria", "derrota", "etapaVencida"].includes(resultado) ? "chefe-painel" : "painel"}>
        {renderPainel()}
      </section>
    </div>
  );
}
