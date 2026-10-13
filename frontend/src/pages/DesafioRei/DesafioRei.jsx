import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import BotaoPixel from "../../components/BotaoPixel";
import { BarraAvancoFala, BotaoPularFalas } from "../../components/ControlesFalas";
import { useAvancoAutomatico } from "../../hooks/useAvancoAutomatico";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import { BASE_PERSONAGEM, ORDEM_CAMADAS, camadaDoItem } from "../../data/spritesPersonagem";
import { tocarSom } from "../../utils/sons";
import mago from "../../assets/images/Mago.webp";
import reiTiribyte from "../../assets/images/rei_tiribyte.webp";
import { TOTAL_TORRES, criarJogo } from "./jogoTorres";
import "./DesafioRei.css";

// Desafio do Rei: aberto pelo castelo do mapa (Home.jsx) depois que os dois
// primeiros portais estão concluídos. Primeiro o Mago da Corte conta a
// história; depois vem o minijogo "Torres do Vento" (estilo Flappy Bird,
// ver jogoTorres.js). Atravessar as torres sem cair, em até 3 tentativas,
// leva ao Baú Real (/bau-rei — BauDaSorte com a roleta das 6 asas da
// coleção do Rei Tiribyte, itens com Item.exclusivoRei).

const CHANCES = 3;

// Quem fala em cada balão da história: o Mago da Corte apresenta o desafio
// e o próprio Rei Tiribyte promete o prêmio.
const PERSONAGENS = {
  mago: { nome: "Mago da Corte", imagem: mago, classe: "rei-falante--mago" },
  rei: { nome: "Rei Tiribyte", imagem: reiTiribyte, classe: "rei-falante--rei" },
};

const FALAS = [
  { quem: "mago", texto: "Viajante! As notícias das suas vitórias chegaram ao castelo..." },
  {
    quem: "mago",
    texto: "Você libertou a Vila Inicial e expulsou os goblins do acampamento. Sua Majestade quer conhecer o herói que fez isso!",
  },
  { quem: "rei", texto: "Então é você o herói de quem todos falam! Eu sou Tiribyte, Rei deste castelo." },
  {
    quem: "rei",
    texto: "Guardo aqui a maior coleção de asas do reino: de fênix, de dragão, de cristal, de fada, de sombra... e as minhas favoritas, de ouro puro.",
  },
  {
    quem: "rei",
    texto: `Prove seu valor nas Torres do Vento: atravesse as ${TOTAL_TORRES} torres sem cair e eu te darei um par de asas da minha coleção!`,
  },
  {
    quem: "mago",
    texto: `Vou lançar em você o feitiço das Asas do Vento. Toque na tela (ou aperte Espaço) para bater as asas. Ele só aguenta ${CHANCES} tentativas — boa sorte!`,
  },
];

// <img> de cada camada do personagem equipado, na ordem de desenho (a
// mesma do AvatarPersonagem), pro canvas poder desenhá-lo.
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

function Coracoes({ restantes }) {
  return (
    <span className="rei-coracoes" aria-label={`${restantes} de ${CHANCES} chances`}>
      {Array.from({ length: CHANCES }, (_, i) => (
        <i
          key={i}
          className={`hn hn-heart-solid rei-coracao ${i < restantes ? "" : "rei-coracao--perdido"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function DesafioRei() {
  const navigate = useNavigate();
  const itensEquipados = usePersonagemAvatar();

  // carregando | bloqueado | erro | historia | regras | jogo
  const [fase, setFase] = useState("carregando");
  const [bauJaAberto, setBauJaAberto] = useState(false);
  const [indiceFala, setIndiceFala] = useState(0);

  // Dentro do jogo: pronto | voando | caiu | derrota | vitoria
  const [estadoJogo, setEstadoJogo] = useState("pronto");
  const [chances, setChances] = useState(CHANCES);
  const [torresPassadas, setTorresPassadas] = useState(0);

  const canvasRef = useRef(null);
  const jogoRef = useRef(null);
  const chancesRef = useRef(CHANCES);

  // ---------- Situação do desafio (liberado? baú já aberto?) ----------

  useEffect(() => {
    let ativo = true;
    api
      .get("/baus/rei")
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

  // ---------- História ----------

  function avancarFala() {
    if (fase !== "historia") return;
    if (indiceFala < FALAS.length - 1) setIndiceFala((i) => i + 1);
    else setFase("regras");
  }

  useAvancoAutomatico(fase === "historia", indiceFala, avancarFala);

  // ---------- Jogo ----------

  const camadas = useMemo(() => carregarCamadas(itensEquipados), [itensEquipados]);
  const camadasRef = useRef(camadas);
  useEffect(() => {
    camadasRef.current.splice(0, camadasRef.current.length, ...camadas);
  }, [camadas]);

  useEffect(() => {
    if (fase !== "jogo" || !canvasRef.current) return undefined;

    const jogo = criarJogo(canvasRef.current, {
      camadas: camadasRef.current,
      aoPassar: (total) => {
        setTorresPassadas(total);
        tocarSom("acerto");
      },
      aoCair: () => {
        tocarSom("erro");
        chancesRef.current -= 1;
        setChances(chancesRef.current);
        setEstadoJogo(chancesRef.current > 0 ? "caiu" : "derrota");
      },
      aoVencer: () => {
        tocarSom("recompensa");
        setEstadoJogo("vitoria");
      },
    });
    jogoRef.current = jogo;

    return () => {
      jogo.destruir();
      jogoRef.current = null;
    };
  }, [fase]);

  const bater = useCallback(() => {
    if (estadoJogo !== "pronto" && estadoJogo !== "voando") return;
    jogoRef.current?.bater();
    if (estadoJogo === "pronto") setEstadoJogo("voando");
  }, [estadoJogo]);

  // Espaço / seta pra cima / W batem as asas
  useEffect(() => {
    if (fase !== "jogo") return undefined;
    function aoTeclar(e) {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        bater();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [fase, bater]);

  function tentarDeNovo() {
    jogoRef.current?.reiniciar();
    setTorresPassadas(0);
    setEstadoJogo("pronto");
  }

  function comecarJogo() {
    chancesRef.current = CHANCES;
    setChances(CHANCES);
    setTorresPassadas(0);
    setEstadoJogo("pronto");
    setFase("jogo");
  }

  function voltarAoMapa() {
    navigate("/home", { replace: true });
  }

  // ---------- Render ----------

  const falaAtual = FALAS[indiceFala];
  const falante = PERSONAGENS[falaAtual.quem];

  // comRei: mostra o Rei Tiribyte no alto da caixa (vitória e regras)
  function renderCaixa(titulo, texto, botoes, comRei = false) {
    return (
      <div className={`rei-caixa ${comRei ? "rei-caixa--com-rei" : ""}`} onPointerDown={(e) => e.stopPropagation()}>
        {comRei && <img src={reiTiribyte} alt="Rei Tiribyte" className="rei-caixa-rei" draggable={false} />}
        <strong className="rei-caixa-titulo">{titulo}</strong>
        {texto && <p className="rei-caixa-texto">{texto}</p>}
        <div className="rei-caixa-botoes">{botoes}</div>
      </div>
    );
  }

  function botao(texto, onClick, secundario = false) {
    return (
      <BotaoPixel
        key={texto}
        className={`rei-botao ${secundario ? "rei-botao--secundario" : ""}`}
        classeMiolo="rei-botao-miolo"
        onClick={onClick}
      >
        {texto}
      </BotaoPixel>
    );
  }

  function renderSobreposicaoJogo() {
    if (estadoJogo === "pronto") {
      return (
        <div className="rei-dica-toque" aria-live="polite">
          <i className="hn hn-arrow-up rei-dica-mao" aria-hidden="true" />
          Toque para voar
        </div>
      );
    }
    if (estadoJogo === "caiu") {
      return renderCaixa(
        "Você caiu!",
        `O feitiço ainda aguenta ${chances} ${chances === 1 ? "tentativa" : "tentativas"}. Respire fundo e tente de novo.`,
        [botao("TENTAR DE NOVO", tentarDeNovo)]
      );
    }
    if (estadoJogo === "derrota") {
      return renderCaixa(
        "As asas se desfizeram...",
        "Suas 3 chances acabaram. Descanse um pouco e volte ao castelo quando estiver pronto — o Rei vai esperar por você.",
        [botao("VOLTAR AO MAPA", voltarAoMapa)]
      );
    }
    if (estadoJogo === "vitoria") {
      return renderCaixa(
        "Você chegou ao salão do trono!",
        bauJaAberto
          ? "Rei Tiribyte: \"Você já levou um par de asas da minha coleção... mas que voo magnífico, de novo!\""
          : "Rei Tiribyte: \"Magnífico! Voou como um verdadeiro papagaio real! Abra o Baú Real e leve um par de asas da minha coleção.\"",
        bauJaAberto
          ? [botao("VER O BAÚ REAL", () => navigate("/bau-rei", { replace: true })), botao("VOLTAR AO MAPA", voltarAoMapa, true)]
          : [botao("ABRIR O BAÚ REAL", () => navigate("/bau-rei", { replace: true }))],
        true
      );
    }
    return null;
  }

  if (fase === "jogo") {
    return (
      <div className="rei-tela rei-tela--jogo">
        <div className="rei-palco" onPointerDown={bater}>
          <canvas ref={canvasRef} className="rei-canvas" aria-label="Minijogo Torres do Vento" />

          <div className="rei-hud" onPointerDown={(e) => e.stopPropagation()}>
            <BotaoPixel
              className="rei-voltar"
              classeMiolo="rei-voltar-miolo"
              onClick={voltarAoMapa}
              aria-label="Voltar para o mapa"
            >
              <i className="hn hn-arrow-left" aria-hidden="true" />
            </BotaoPixel>
            <span className="rei-placar">
              <i className="hn hn-flag-solid rei-placar-icone" aria-hidden="true" />
              {torresPassadas}/{TOTAL_TORRES}
            </span>
            <Coracoes restantes={chances} />
          </div>

          {renderSobreposicaoJogo()}
        </div>
      </div>
    );
  }

  return (
    <div className="rei-tela" onClick={fase === "historia" ? avancarFala : undefined}>
      <BotaoPixel
        className="rei-voltar rei-voltar--fixo"
        classeMiolo="rei-voltar-miolo"
        onClick={(e) => {
          e.stopPropagation();
          voltarAoMapa();
        }}
        aria-label="Voltar para o mapa"
      >
        <i className="hn hn-arrow-left" aria-hidden="true" />
      </BotaoPixel>

      {fase === "historia" && <BotaoPularFalas onPular={() => setFase("regras")} className="rei-pular" />}

      <div className="rei-faixa">
        <i className="hn hn-crown-solid rei-faixa-coroa" aria-hidden="true" />
        <h1 className="rei-faixa-titulo">DESAFIO DO REI</h1>
      </div>

      {fase === "carregando" && <p className="rei-mensagem">Abrindo os portões do castelo...</p>}

      {fase === "erro" && (
        <div className="rei-centro">
          {renderCaixa("O castelo não respondeu", "Verifique sua conexão e tente de novo.", [
            botao("TENTAR DE NOVO", () => window.location.reload()),
            botao("VOLTAR AO MAPA", voltarAoMapa, true),
          ])}
        </div>
      )}

      {fase === "bloqueado" && (
        <div className="rei-centro">
          {renderCaixa(
            "Os portões estão fechados",
            "O Rei só recebe quem já venceu a Vila Inicial e o Acampamento Goblin. Conclua os dois primeiros portais e volte aqui!",
            [botao("VOLTAR AO MAPA", voltarAoMapa)]
          )}
        </div>
      )}

      {fase === "historia" && (
        <div className="rei-historia">
          <img
            key={falaAtual.quem}
            src={falante.imagem}
            alt=""
            className={`rei-falante ${falante.classe}`}
            draggable={false}
          />
          <div className="rei-balao" aria-live="polite">
            <strong className="rei-balao-nome">{falante.nome}</strong>
            <p key={indiceFala} className="rei-balao-fala">
              {falaAtual.texto}
            </p>
            <span className="rei-balao-continuar">Toque para continuar ▸</span>
            <BarraAvancoFala chave={indiceFala} />
          </div>
        </div>
      )}

      {fase === "regras" && (
        <div className="rei-centro">
          <div className="rei-caixa rei-caixa--regras rei-caixa--com-rei" onClick={(e) => e.stopPropagation()}>
            <img src={reiTiribyte} alt="Rei Tiribyte" className="rei-caixa-rei" draggable={false} />
            <strong className="rei-caixa-titulo">Torres do Vento</strong>
            <ul className="rei-regras">
              <li>
                <i className="hn hn-arrow-up" aria-hidden="true" /> Toque na tela, clique ou aperte
                Espaço para bater as asas.
              </li>
              <li>
                <i className="hn hn-flag-solid" aria-hidden="true" /> Passe pelas {TOTAL_TORRES} torres sem
                encostar nelas nem no chão.
              </li>
              <li>
                <i className="hn hn-heart-solid" aria-hidden="true" /> Você tem {CHANCES} chances.
              </li>
              <li>
                <i className="hn hn-crown-solid" aria-hidden="true" /> Prêmio: o Baú Real, com um dos 6 pares de
                asas da coleção do Rei Tiribyte — que não saem em nenhum outro lugar
                {bauJaAberto ? " (você já abriu o seu, mas pode voar de novo!)" : ""}.
              </li>
            </ul>
            <div className="rei-caixa-botoes">{botao("COMEÇAR!", comecarJogo)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesafioRei;
