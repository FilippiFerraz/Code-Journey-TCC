import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import mapa from "../../assets/images/mapa.webp";
import portalDesafios from "../../assets/images/Portal_Desafios.webp";
import cadeadoPortal from "../../assets/images/Cadeado_portal.png";
import api from "../../services/api";
import { mundoLiberado } from "../../data/progresso";
import { useIsMobile } from "../../hooks/useIsMobile";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import TutorialHome from "./TutorialHome";
import AvisoPortalBloqueado from "./AvisoPortalBloqueado";
import PersonagemNoMapa from "./PersonagemNoMapa";
import { lerUltimoPortal, salvarUltimoPortal, trechoEntre } from "./caminhoMapa";
import "./Home.css";

// Mesmo breakpoint usado pelo MainLayout pra trocar entre rodapé (mobile) e
// sidebar (desktop) — precisa bater com o de lá pra decidir corretamente
// onde a barra de busca aparece (ver comentário mais abaixo).
const BREAKPOINT_MOBILE = 768;

// Posições em % relativas ao tamanho da imagem do mapa. Mudou alguma? Ajuste
// também o ponto do portal em CAMINHO (caminhoMapa.js), por onde o
// personagem anda.
const PORTAIS = [
  { id: "1", nome: "Vila Inicial", top: "16%", left: "50%" },
  { id: "2", nome: "Acampamento Goblin", top: "47%", left: "50%" },
  { id: "3", nome: "Arena do Dragão", top: "71%", left: "50%" },
];

// Castelo do mapa (canto superior direito da arte): abre o Desafio do Rei
// depois que os dois primeiros portais estão concluídos. Centro e tamanho
// em % da imagem do mapa, cobrindo o desenho do castelo.
const CASTELO = { top: "21%", left: "80.5%", largura: "33%", altura: "19%" };

function Home() {
  const navigate = useNavigate();
  const ehMobile = useIsMobile(BREAKPOINT_MOBILE);
  const [mostrarTutorial, setMostrarTutorial] = useState(false);
  // Portal clicado enquanto ainda trancado — guarda o objeto pra mostrar o
  // nome dele no aviso do Mago; null quando não há aviso na tela.
  const [portalBloqueado, setPortalBloqueado] = useState(null);
  const [avisoCastelo, setAvisoCastelo] = useState(false);
  // Portal pro qual o personagem está caminhando (animação antes de abrir a
  // dificuldade); null quando ninguém está andando no mapa.
  const [destino, setDestino] = useState(null);
  const itensEquipados = usePersonagemAvatar();
  // Calculado uma vez por viagem — PersonagemNoMapa reinicia a caminhada
  // sempre que recebe uma lista nova.
  const trechoViagem = useMemo(
    () => (destino ? trechoEntre(lerUltimoPortal(), destino.id) : []),
    [destino]
  );
  // Progresso real do usuário logado (GET /api/progresso), usado pra decidir
  // quais portais estão liberados. Começa vazio — enquanto não chega (ou se
  // a chamada falhar), só o portal 1 aparece liberado, nunca o contrário.
  const [progresso, setProgresso] = useState([]);
  // Baús de fim de mundo (GET /api/baus): um por trilha, com "disponivel"
  // quando todos os desafios dela foram concluídos e o baú ainda não foi
  // aberto — é isso que faz o ícone do baú aparecer ao lado do portal.
  const [baus, setBaus] = useState([]);
  // Barra de pesquisa de jogadores (GET /api/perfil/buscar?nome=).
  const [termoBusca, setTermoBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // Só mostra o tutorial guiado se o perfil confirmar que o usuário ainda
  // não viu (Usuario.tutorialVisto). Se a chamada falhar (ex: offline), não
  // bloqueia a Home — o tutorial simplesmente não aparece dessa vez.
  useEffect(() => {
    let ativo = true;

    api
      .get("/perfil")
      .then((res) => {
        if (ativo && res.data.tutorialVisto === false) {
          setMostrarTutorial(true);
        }
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    api
      .get("/progresso")
      .then((res) => {
        if (ativo) setProgresso(res.data);
      })
      .catch(() => {
        // sem progresso carregado (ex: offline) — mantém todo portal além
        // do 1 bloqueado em vez de liberar por engano
      });

    api
      .get("/baus")
      .then((res) => {
        if (ativo) setBaus(res.data);
      })
      .catch(() => {
        // sem baús carregados — só não mostra o ícone de baú no mapa
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Busca jogadores pelo nome com um pequeno debounce, pra não disparar uma
  // requisição a cada tecla digitada.
  useEffect(() => {
    const termo = termoBusca.trim();
    if (!termo) {
      setResultadosBusca([]);
      setBuscando(false);
      return;
    }

    let ativo = true;
    setBuscando(true);

    const timer = setTimeout(() => {
      api
        .get("/perfil/buscar", { params: { nome: termo } })
        .then((res) => ativo && setResultadosBusca(res.data))
        .catch(() => ativo && setResultadosBusca([]))
        .finally(() => ativo && setBuscando(false));
    }, 350);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [termoBusca]);

  function abrirPerfilBuscado(usuario) {
    setTermoBusca("");
    setResultadosBusca([]);
    navigate(`/perfil/${usuario.id}`);
  }

  function handlePortalClick(portal) {
    if (destino) return; // já está caminhando pra um portal
    if (!mundoLiberado(progresso, portal.id)) {
      setPortalBloqueado(portal);
      return;
    }
    // Com "reduzir movimento" no sistema, pula a caminhada.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      entrarNoPortal(portal);
      return;
    }
    setDestino(portal);
  }

  // Desafio do Rei: liberado com os portais 1 e 2 concluídos (o portal 3
  // abrir é exatamente isso — ver mundoLiberado).
  const casteloLiberado = mundoLiberado(progresso, "3");

  function handleCasteloClick() {
    if (destino) return;
    if (!casteloLiberado) {
      setAvisoCastelo(true);
      return;
    }
    navigate("/desafio-do-rei");
  }

  function entrarNoPortal(portal) {
    salvarUltimoPortal(portal.id);
    navigate(`/dificuldade/${portal.id}`, { state: { nomeMundo: portal.nome } });
  }

  function concluirTutorial() {
    setMostrarTutorial(false);
    api.post("/perfil/tutorial-visto").catch(() => {});
  }

  // Barra de busca de jogadores — mesma JSX em mobile e desktop, só muda
  // ONDE ela aparece (ver uso logo abaixo): no mobile continua dentro do
  // corpo da página, como sempre foi; no desktop vai pro slot central do
  // cabeçalho (MainLayout.jsx), centralizada e maior. Extraída pra
  // variável em vez de duplicada porque é o MESMO estado (termoBusca,
  // resultadosBusca) controlando as duas — nunca as duas ao mesmo tempo.
  const barraBusca = (
    <div className="home-busca">
      <div className="home-busca-campo">
        <span className="home-busca-icone" aria-hidden="true">
          <i className="hn hn-search"></i>
        </span>
        <input
          type="text"
          className="home-busca-input"
          placeholder="Buscar jogador pelo nome…"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          aria-label="Buscar jogador pelo nome"
        />
        {termoBusca && (
          <button
            type="button"
            className="home-busca-limpar"
            aria-label="Limpar busca"
            onClick={() => setTermoBusca("")}
          >
            <i className="hn hn-times" aria-hidden="true"></i>
          </button>
        )}
      </div>

      {termoBusca.trim() && (
        <div className="home-busca-resultados">
          {buscando ? (
            <p className="home-busca-mensagem">Buscando…</p>
          ) : resultadosBusca.length > 0 ? (
            resultadosBusca.map((usuario) => (
              <button
                key={usuario.id}
                type="button"
                className="home-busca-resultado"
                onClick={() => abrirPerfilBuscado(usuario)}
              >
                <span className="home-busca-resultado-nome">{usuario.nome}</span>
                <span className="home-busca-resultado-handle">@{usuario.nomeUsuario}</span>
              </button>
            ))
          ) : (
            <p className="home-busca-mensagem">Nenhum jogador encontrado.</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <MainLayout titulo="HOME" buscaHeader={!ehMobile ? barraBusca : undefined}>
      {ehMobile && barraBusca}

      <div className="home-mapa">
        <img src={mapa} alt="Mapa da jornada" className="home-mapa-imagem" />

        <button
          type="button"
          className={`home-castelo ${casteloLiberado ? "" : "home-castelo--bloqueado"}`}
          style={{ top: CASTELO.top, left: CASTELO.left, width: CASTELO.largura, height: CASTELO.altura }}
          onClick={handleCasteloClick}
          aria-label={casteloLiberado ? "Desafio do Rei" : "Desafio do Rei (bloqueado)"}
        >
          <span className="home-castelo-placa">
            <i
              className={`hn ${casteloLiberado ? "hn-crown-solid" : "hn-lock"} home-castelo-icone`}
              aria-hidden="true"
            />
            Desafio do Rei
          </span>
        </button>

        {PORTAIS.map((portal) => {
          const liberado = mundoLiberado(progresso, portal.id);
          const bauDisponivel = baus.find(
            (bau) => String(bau.mundoId) === portal.id && bau.disponivel
          );
          return (
            <Fragment key={portal.id}>
              <button
                type="button"
                className={`home-portal ${liberado ? "" : "home-portal--bloqueado"}`}
                style={{ top: portal.top, left: portal.left }}
                onClick={() => handlePortalClick(portal)}
                data-tutorial-alvo={portal.id === "1" ? "portal-desafios" : undefined}
              >
                <img
                  src={portalDesafios}
                  alt=""
                  aria-hidden="true"
                  className="home-portal-gif"
                  draggable={false}
                />
                {!liberado && (
                  <img
                    src={cadeadoPortal}
                    alt="Bloqueado"
                    className="home-portal-cadeado"
                    draggable={false}
                  />
                )}
                <span className="home-portal-nome">{portal.nome}</span>
              </button>

              {/* Baú de fim de mundo — irmão do portal (não dentro dele, pra
                  não aninhar <button>), posicionado logo à direita. */}
              {bauDisponivel && (
                <button
                  type="button"
                  className="home-bau"
                  style={{ top: portal.top, left: `calc(${portal.left} + 64px)` }}
                  onClick={() =>
                    navigate(`/bau/${portal.id}/${bauDisponivel.dificuldade}`)
                  }
                  aria-label={`Abrir o baú de ${portal.nome}`}
                >
                  <span className="home-bau-icone" aria-hidden="true">🎁</span>
                  <span className="home-bau-texto">Abrir baú!</span>
                </button>
              )}
            </Fragment>
          );
        })}

        {destino && (
          <PersonagemNoMapa
            pontos={trechoViagem}
            itensEquipados={itensEquipados}
            onChegar={() => entrarNoPortal(destino)}
          />
        )}
      </div>

      {mostrarTutorial && <TutorialHome onConcluir={concluirTutorial} />}

      {avisoCastelo && (
        <AvisoPortalBloqueado
          titulo="Castelo fechado"
          fala="O Rei só recebe heróis que já venceram a Vila Inicial e o Acampamento Goblin. Conclua os dois primeiros portais e ele vai te chamar para o Desafio do Rei!"
          onFechar={() => setAvisoCastelo(false)}
        />
      )}

      {portalBloqueado && (
        <AvisoPortalBloqueado
          nomeMundo={portalBloqueado.nome}
          onFechar={() => setPortalBloqueado(null)}
        />
      )}
    </MainLayout>
  );
}

export default Home;
