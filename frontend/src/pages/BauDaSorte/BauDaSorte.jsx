import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import BotaoPixel from "../../components/BotaoPixel";
import IconeItem from "../../components/IconeItem";
import { tocarSom } from "../../utils/sons";
// Mesma arte da tela de Seleção de Dificuldade. Se o baú ganhar uma arte
// própria no futuro, basta trocar este import.
import fundoTela from "../../assets/images/fundo_tela_selcionardesafio.png";
import "./BauDaSorte.css";

// Tela cheia (sem MainLayout), aberta ao concluir um módulo (vitória no
// desafio-chefe). Os itens da roleta são os REAIS do jogo (GET /api/itens) e
// o prêmio é sorteado, creditado no inventário e travado contra reabertura
// pelo backend (POST /api/baus/:mundoId/abrir — ver bau.service.js). A
// animação só "encena" um resultado que já foi decidido antes do giro.

// Fita da roleta: quantas cartas ela tem e em qual posição fica o prêmio
// (perto do fim, pra dar várias voltas antes de parar).
const TOTAL_CARTAS = 40;
const INDICE_PREMIO = 34;
// Pausa entre os itens chegarem e a roleta começar a girar sozinha.
const ATRASO_GIRO_MS = 600;
// Mesma duração da transition de .sorte-fita--girando no CSS — usada como
// reserva caso o transitionend não dispare (ex: aba em segundo plano).
const DURACAO_GIRO_MS = 4500;
// Quanto a roleta pode parar fora do centro da carta vencedora (fração da
// largura da carta, pra cada lado) — sem isso ela pararia sempre no meio.
const DESVIO_MAXIMO_CARTA = 0.25;

// Rótulos do slot (Item.tipo) e da raridade (Item.raridade) — os valores
// são os definidos no schema.prisma.
const ROTULOS_TIPO = {
  capacete: "Capacete",
  peitoral: "Peitoral",
  sapato: "Sapato",
  arma: "Arma",
  costas: "Costas",
  acessorios: "Acessório",
};

const ROTULOS_RARIDADE = {
  comum: "Comum",
  raro: "Raro",
  epico: "Épico",
  lendario: "Lendário",
};

const CARTAS_CARREGANDO = 5;

// Converte o item da API pro formato da roleta. Mantém icone/imagemUrl com os
// nomes originais porque é o que IconeItem (o mesmo componente usado em
// EditarPersonagem e Perfil) espera pra resolver a imagem do item.
function normalizarItem(item) {
  return {
    id: item.id,
    nome: item.nome ?? null,
    tipo: item.tipo ?? null,
    raridade: item.raridade ?? null,
    icone: item.icone ?? null,
    imagemUrl: item.imagemUrl ?? null,
  };
}

// Fita longa com itens aleatórios da lista real e o prêmio fixo em
// INDICE_PREMIO. Com poucos itens no jogo, eles simplesmente se repetem.
function montarFita(itens, premio) {
  return Array.from({ length: TOTAL_CARTAS }, (_, indice) =>
    indice === INDICE_PREMIO ? premio : itens[Math.floor(Math.random() * itens.length)]
  );
}

function prefereMenosMovimento() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Abre o baú no backend. Se a abertura for recusada (400), consulta
// GET /api/baus pra saber o motivo: baú já aberto antes (mostra o prêmio
// que saiu na época) ou módulo ainda não concluído. Erros de rede/servidor
// sobem como exceção e viram a fase "erro".
async function abrirOuRecuperarBau(mundoId, dificuldade) {
  try {
    const res = await api.post(`/baus/${mundoId}/abrir`, { dificuldade });
    return { situacao: "aberto", premio: res.data.itemGanho };
  } catch (erro) {
    if (erro.response?.status !== 400) throw erro;

    const resBaus = await api.get("/baus");
    const bau = resBaus.data.find(
      (b) => String(b.mundoId) === String(mundoId) && b.dificuldade === dificuldade
    );
    if (bau?.aberto && bau.itemGanho) {
      return { situacao: "jaAberto", premio: bau.itemGanho };
    }
    return {
      situacao: "bloqueado",
      mensagem: erro.response.data?.erro || "Este baú ainda está trancado.",
    };
  }
}

function BauDaSorte() {
  const navigate = useNavigate();
  const { mundoId, dificuldade } = useParams();

  // "carregando" | "preparando" | "girando" | "revelado" | "erro" | "vazio"
  // | "bloqueado" (módulo ainda não concluído — o backend recusou abrir)
  const [fase, setFase] = useState("carregando");
  const [fita, setFita] = useState([]);
  const [premio, setPremio] = useState(null);
  const [jaAbertoAntes, setJaAbertoAntes] = useState(false);
  const [mensagemBloqueio, setMensagemBloqueio] = useState("");
  const [deslocamento, setDeslocamento] = useState(0);
  // Cada "TENTAR DE NOVO" incrementa isso e refaz a busca.
  const [tentativa, setTentativa] = useState(0);

  const janelaRef = useRef(null);
  const fitaRef = useRef(null);
  const primeiraCartaRef = useRef(null);
  // Abrir o baú não é idempotente: o POST sai UMA vez por tentativa e a
  // promessa fica guardada aqui — o StrictMode roda o efeito de carga duas
  // vezes em dev e, sem isso, a 2ª chamada responderia "já abriu".
  const aberturaRef = useRef({ chave: null, promessa: null });
  // Trava do giro: garante que ele só começa e só termina uma vez.
  const giroRef = useRef({ iniciado: false, finalizado: false });
  // Desvio sorteado dentro da carta vencedora — guardado pra que o
  // recálculo no resize pare exatamente no mesmo lugar.
  const desvioRef = useRef(0);

  // ---------- Carga: itens reais + abertura do baú ----------

  useEffect(() => {
    let ativo = true;
    const controlador = new AbortController();

    setFase("carregando");
    setJaAbertoAntes(false);
    giroRef.current = { iniciado: false, finalizado: false };

    const chave = `${mundoId}:${dificuldade}:${tentativa}`;
    if (aberturaRef.current.chave !== chave) {
      aberturaRef.current = { chave, promessa: abrirOuRecuperarBau(mundoId, dificuldade) };
    }

    Promise.all([
      api.get("/itens", { signal: controlador.signal }),
      aberturaRef.current.promessa,
    ])
      .then(([resItens, abertura]) => {
        if (!ativo) return;
        const itens = resItens.data.map(normalizarItem);

        if (itens.length === 0) {
          setFase("vazio");
          return;
        }
        if (abertura.situacao === "bloqueado") {
          setMensagemBloqueio(abertura.mensagem);
          setFase("bloqueado");
          return;
        }

        const itemPremio = normalizarItem(abertura.premio);
        desvioRef.current = (Math.random() * 2 - 1) * DESVIO_MAXIMO_CARTA;
        setPremio(itemPremio);
        setFita(montarFita(itens, itemPremio));
        setDeslocamento(0);

        if (abertura.situacao === "jaAberto") {
          // Baú aberto numa visita anterior: mostra direto o prêmio que saiu.
          setJaAbertoAntes(true);
          giroRef.current = { iniciado: true, finalizado: true };
          setFase("revelado");
        } else {
          setFase("preparando");
        }
      })
      .catch((erro) => {
        if (!ativo || erro?.name === "CanceledError") return;
        setFase("erro");
      });

    return () => {
      ativo = false;
      controlador.abort();
    };
  }, [mundoId, dificuldade, tentativa]);

  // ---------- Posição da fita ----------

  // translateX que deixa a carta do prêmio sob os triângulos (centro da
  // janela), com o desvio sorteado dentro da própria carta.
  const calcularDeslocamentoFinal = useCallback(() => {
    const janela = janelaRef.current;
    const carta = primeiraCartaRef.current;
    if (!janela || !carta) return 0;

    const larguraJanela = janela.getBoundingClientRect().width;
    const larguraCarta = carta.getBoundingClientRect().width;
    const vao = parseFloat(getComputedStyle(fitaRef.current).columnGap) || 0;
    const passo = larguraCarta + vao;

    const centroPremio = INDICE_PREMIO * passo + larguraCarta / 2;
    return larguraJanela / 2 - (centroPremio + desvioRef.current * larguraCarta);
  }, []);

  const finalizarGiro = useCallback(() => {
    if (giroRef.current.finalizado) return;
    giroRef.current.finalizado = true;
    setFase("revelado");
    tocarSom("recompensa");
  }, []);

  // preparando -> (600ms) -> girando. Com "reduzir movimento", pula o giro e
  // já posiciona no prêmio.
  useEffect(() => {
    if (fase !== "preparando" || giroRef.current.iniciado) return;

    const timer = setTimeout(() => {
      giroRef.current.iniciado = true;
      if (prefereMenosMovimento()) {
        finalizarGiro();
        return;
      }
      setDeslocamento(calcularDeslocamentoFinal());
      setFase("girando");
    }, ATRASO_GIRO_MS);

    return () => clearTimeout(timer);
  }, [fase, calcularDeslocamentoFinal, finalizarGiro]);

  // Reserva caso o transitionend se perca (ex: aba em segundo plano).
  useEffect(() => {
    if (fase !== "girando") return;
    const timer = setTimeout(finalizarGiro, DURACAO_GIRO_MS + 400);
    return () => clearTimeout(timer);
  }, [fase, finalizarGiro]);

  // Revelado: garante a posição exata (inclusive quando pulou o giro) e
  // recalcula se a janela mudar de tamanho depois.
  useLayoutEffect(() => {
    if (fase !== "revelado") return;

    const reposicionar = () => setDeslocamento(calcularDeslocamentoFinal());
    reposicionar();
    window.addEventListener("resize", reposicionar);
    return () => window.removeEventListener("resize", reposicionar);
  }, [fase, calcularDeslocamentoFinal]);

  function handleFimTransicao(e) {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (fase === "girando") finalizarGiro();
  }

  function irParaHome() {
    navigate("/home", { replace: true });
  }

  const voltarDesabilitado = fase === "carregando" || fase === "preparando" || fase === "girando";
  const revelado = fase === "revelado";
  const rotuloTipo = premio?.tipo ? ROTULOS_TIPO[premio.tipo] ?? premio.tipo : null;
  const rotuloRaridade = premio?.raridade
    ? ROTULOS_RARIDADE[premio.raridade] ?? premio.raridade
    : null;

  // ---------- Render ----------

  function renderCartas() {
    if (fase === "carregando" || fita.length === 0) {
      return Array.from({ length: CARTAS_CARREGANDO }, (_, i) => (
        <div key={i} className="sorte-carta sorte-carta--vazia" />
      ));
    }

    return fita.map((item, indice) => {
      const vencedora = revelado && indice === INDICE_PREMIO;
      return (
        <div
          key={indice}
          ref={indice === 0 ? primeiraCartaRef : undefined}
          className={`sorte-carta ${vencedora ? "sorte-carta--vencedora" : ""}`}
        >
          <IconeItem
            item={item}
            classeImagem="sorte-carta-imagem"
            classeEmoji="sorte-carta-emoji"
          />
        </div>
      );
    });
  }

  function renderStatus() {
    if (fase === "carregando") {
      return <p className="sorte-mensagem">Abrindo o baú...</p>;
    }

    if (fase === "erro") {
      return (
        <>
          <p className="sorte-mensagem">O baú está emperrado! Tente novamente.</p>
          <BotaoPixel
            className="sorte-botao"
            classeMiolo="sorte-botao-miolo"
            onClick={() => setTentativa((t) => t + 1)}
          >
            TENTAR DE NOVO
          </BotaoPixel>
        </>
      );
    }

    if (fase === "bloqueado") {
      return (
        <>
          <p className="sorte-mensagem">{mensagemBloqueio}</p>
          <BotaoPixel className="sorte-botao" classeMiolo="sorte-botao-miolo" onClick={irParaHome}>
            VOLTAR AO MAPA
          </BotaoPixel>
        </>
      );
    }

    if (fase === "vazio") {
      return (
        <>
          <p className="sorte-mensagem">O baú está vazio... por enquanto.</p>
          <BotaoPixel className="sorte-botao" classeMiolo="sorte-botao-miolo" onClick={irParaHome}>
            CONTINUAR
          </BotaoPixel>
        </>
      );
    }

    if (revelado && premio) {
      return (
        <>
          <div className="sorte-placa-premio">
            <strong>{premio.nome ?? "Item misterioso"}</strong>
            {(rotuloTipo || rotuloRaridade) && (
              <span className="sorte-placa-detalhe">
                {rotuloTipo}
                {rotuloTipo && rotuloRaridade && " · "}
                {rotuloRaridade && (
                  <span className={`sorte-raridade sorte-raridade--${premio.raridade}`}>
                    {rotuloRaridade}
                  </span>
                )}
              </span>
            )}
          </div>
          <p className="sorte-aviso">
            {jaAbertoAntes
              ? "Você já abriu este baú — este foi o seu prêmio."
              : "O item já está no seu inventário."}
          </p>
          <BotaoPixel
            className="sorte-botao sorte-botao--continuar"
            classeMiolo="sorte-botao-miolo"
            onClick={irParaHome}
          >
            CONTINUAR
          </BotaoPixel>
        </>
      );
    }

    return null;
  }

  return (
    <div className="sorte-tela" style={{ backgroundImage: `url(${fundoTela})` }}>
      <BotaoPixel
        className="sorte-voltar"
        classeMiolo="sorte-voltar-miolo"
        onClick={irParaHome}
        disabled={voltarDesabilitado}
        aria-label="Voltar para o mapa"
      >
        <i className="hn hn-arrow-left" aria-hidden="true" />
      </BotaoPixel>

      <main className="sorte-conteudo">
        <div className="sorte-faixa">
          <div className="sorte-brasao" aria-hidden="true">
            <div className="sorte-brasao-ferro">
              <div className="sorte-brasao-escudo">
                <i className="hn hn-crown-solid" />
              </div>
            </div>
          </div>
          <div className="sorte-faixa-corpo">
            <h1 className="sorte-faixa-titulo">MÓDULO CONCLUÍDO!</h1>
          </div>
        </div>

        <p className="sorte-subtitulo">
          <span aria-hidden="true">✦</span> Você ganhou uma recompensa!{" "}
          <span aria-hidden="true">✦</span>
        </p>

        <div className={`sorte-roleta ${revelado ? "sorte-roleta--revelada" : ""}`}>
          <span className="sorte-indicador sorte-indicador--topo" aria-hidden="true" />
          <span className="sorte-indicador sorte-indicador--base" aria-hidden="true" />
          <span className="sorte-cantoneira sorte-cantoneira--se" aria-hidden="true" />
          <span className="sorte-cantoneira sorte-cantoneira--sd" aria-hidden="true" />
          <span className="sorte-cantoneira sorte-cantoneira--ie" aria-hidden="true" />
          <span className="sorte-cantoneira sorte-cantoneira--id" aria-hidden="true" />

          <div className="sorte-janela" ref={janelaRef} aria-hidden="true">
            <div
              ref={fitaRef}
              className={`sorte-fita ${fase === "carregando" ? "sorte-fita--carregando" : ""} ${
                fase === "girando" ? "sorte-fita--girando" : ""
              }`}
              style={
                fase === "carregando" ? undefined : { transform: `translateX(${deslocamento}px)` }
              }
              onTransitionEnd={handleFimTransicao}
            >
              {renderCartas()}
            </div>
            {revelado && <div className="sorte-flash" />}
          </div>

          {revelado && (
            <div className="sorte-faiscas" aria-hidden="true">
              <i className="hn hn-sparkles-solid sorte-faisca sorte-faisca--1" />
              <i className="hn hn-sparkles-solid sorte-faisca sorte-faisca--2" />
              <i className="hn hn-sparkles-solid sorte-faisca sorte-faisca--3" />
              <i className="hn hn-sparkles-solid sorte-faisca sorte-faisca--4" />
            </div>
          )}
        </div>

        <div className="sorte-status">{renderStatus()}</div>

        <p className="sorte-leitor-tela" aria-live="polite">
          {revelado && premio ? `Você ganhou: ${premio.nome}` : ""}
        </p>
      </main>
    </div>
  );
}

export default BauDaSorte;
