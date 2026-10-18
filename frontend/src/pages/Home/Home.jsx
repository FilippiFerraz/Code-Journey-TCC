import { Fragment, Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import mapa from "../../assets/images/mapa.webp";
// prévia minúscula (7 KB) mostrada enquanto o mapa (o maior arquivo do site) carrega
import mapaPrevia from "../../assets/images/mapa-previa.webp";
import portalDesafios from "../../assets/images/Portal_Desafios.webp";
import cadeadoPortal from "../../assets/images/Cadeado_portal.webp";
// nuvens recortadas do céu do próprio mapa (ver scripts/gerarNuvens.mjs);
// ?no-inline: arquivos à parte, baixados só ao rolar até o fim do mapa
import nuvem1 from "../../assets/images/nuvens/nuvem-1.webp?no-inline";
import nuvem2 from "../../assets/images/nuvens/nuvem-2.webp?no-inline";
import nuvem3 from "../../assets/images/nuvens/nuvem-3.webp?no-inline";
import api from "../../services/api";
import { mundoLiberado } from "../../data/progresso";
import { tocarSom } from "../../utils/sons";
import { useIsMobile } from "../../hooks/useIsMobile";
import { usePersonagemAvatar, definirAparenciaPropria } from "../../hooks/usePersonagemAvatar";
import EscolherAparencia from "../../components/EscolherAparencia";
import TutorialHome from "./TutorialHome";
import AvisoPortalBloqueado from "./AvisoPortalBloqueado";
import PersonagemNoMapa from "./PersonagemNoMapa";
import { Gift } from "pixelarticons/react/Gift.js";
import IconePixel from "../../components/IconePixel";
import { lerUltimoPortal, salvarUltimoPortal, trechoEntre } from "./caminhoMapa";
import "./Home.css";

// Cutscene de introdução (só no primeiro acesso): arquivo à parte, baixado
// só por quem vai assistir.
const IntroCutscene = lazy(() => import("../../components/IntroCutscene/IntroCutscene"));

// Marca local de "já viu a intro" — reserva pra quando o backend não
// responde (ou ainda não tem o campo introVista). O que vale é o banco.
const chaveIntroLocal = (usuarioId) => `introVista:${usuarioId}`;

function introVistaLocal(usuarioId) {
  try {
    return localStorage.getItem(chaveIntroLocal(usuarioId)) === "1";
  } catch {
    return false;
  }
}

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

// Cristal Gigante e a cachoeira ao lado dele (lado esquerdo da arte): os
// dois abrem o Desafio da Cachoeira de Cristais, liberado com o portal 1
// concluído. Centro e tamanho em % da imagem do mapa.
const PONTOS_CRISTAIS = [
  { id: "cristal", nome: "Cristal Gigante", top: "39%", left: "17%", largura: "19%", altura: "10.5%" },
  { id: "cachoeira", nome: "Cachoeira", top: "40%", left: "30.3%", largura: "7%", altura: "9%" },
];
// Placa com o nome do desafio, entre o cristal e a cachoeira.
const PLACA_CRISTAIS = { top: "45.6%", left: "24.5%" };
// Duração da transição (brilho + partículas) antes de abrir o minijogo.
const DURACAO_TRANSICAO_CRISTAIS_MS = 900;

// Dragão adormecido no centro da arena (fundo do mapa, abaixo do portal 3):
// abre a Batalha do Dragão, liberada com os três portais concluídos.
const DRAGAO = { top: "84.3%", left: "50%", largura: "32%", altura: "11%" };
// Transição dramática (tremor, flash e fogo roxo) antes de abrir a batalha.
const DURACAO_TRANSICAO_DRAGAO_MS = 1300;

// Nuvens do fim do mapa, depois da arena do Dragão: o caminho some nelas,
// avisando que o jogo continua num próximo mundo. Posição e largura em %
// da faixa; cada uma vai e volta devagar, com ritmo próprio (duração em s).
const NUVENS_FIM = [
  { src: nuvem1, left: -6, top: 6, largura: 34, duracao: 9 },
  { src: nuvem3, left: 24, top: 10, largura: 30, duracao: 11, espelhada: true },
  { src: nuvem2, left: 50, top: 4, largura: 30, duracao: 8 },
  { src: nuvem1, left: 74, top: 9, largura: 34, duracao: 10, espelhada: true },
  { src: nuvem3, left: 6, top: 40, largura: 28, duracao: 12, espelhada: true },
  { src: nuvem2, left: 68, top: 42, largura: 30, duracao: 9 },
  { src: nuvem3, left: 36, top: 70, largura: 28, duracao: 10 },
];

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const ehMobile = useIsMobile(BREAKPOINT_MOBILE);
  // Cutscene de introdução: conta recém-criada (VerificarEmail manda
  // introPendente) já abre com ela, sem esperar o /perfil — que depois
  // confirma ou cancela (Usuario.introVista).
  const [mostrarIntro, setMostrarIntro] = useState(Boolean(location.state?.introPendente));
  const introConcluidaRef = useRef(false);
  const usuarioIdRef = useRef(null);
  const [mostrarTutorial, setMostrarTutorial] = useState(false);
  // Primeiro acesso: escolha da aparência do herói, antes do tutorial.
  const [escolherAparencia, setEscolherAparencia] = useState(false);
  // Portal clicado enquanto ainda trancado — guarda o objeto pra mostrar o
  // nome dele no aviso do Mago; null quando não há aviso na tela.
  const [portalBloqueado, setPortalBloqueado] = useState(null);
  const [avisoCastelo, setAvisoCastelo] = useState(false);
  const [avisoCristais, setAvisoCristais] = useState(false);
  const [abrindoCristais, setAbrindoCristais] = useState(false);
  const [avisoDragao, setAvisoDragao] = useState(false);
  const [abrindoDragao, setAbrindoDragao] = useState(false);
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
  // Antes dele, quem ainda não escolheu a aparência do herói (aparencia
  // null — undefined seria um backend sem o campo) escolhe.
  // A cutscene de introdução vem antes de tudo: só pra quem o banco diz que
  // ainda não viu (introVista false). Backend sem o campo (undefined) usa a
  // marca local como reserva.
  useEffect(() => {
    let ativo = true;

    // o aviso "introPendente" vale só pra esta entrada: sai do histórico pra
    // um F5 não reabrir a intro antes do /perfil responder
    if (location.state?.introPendente) navigate(location.pathname, { replace: true, state: null });

    api
      .get("/perfil")
      .then((res) => {
        if (!ativo) return;
        usuarioIdRef.current = res.data.id;
        const jaViu =
          introConcluidaRef.current ||
          introVistaLocal(res.data.id) ||
          (res.data.introVista !== undefined && res.data.introVista !== false);
        setMostrarIntro(!jaViu);
        if (res.data.aparencia === null) setEscolherAparencia(true);
        else if (res.data.aparencia) definirAparenciaPropria(res.data.aparencia);
        if (res.data.tutorialVisto === false) setMostrarTutorial(true);
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
    // roda só na entrada da Home (location/navigate usados uma vez acima)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Desafio da Cachoeira de Cristais: liberado com o portal 1 concluído (o
  // portal 2 abrir é exatamente isso — ver mundoLiberado).
  const cristaisLiberados = mundoLiberado(progresso, "2");

  function handleCristaisClick() {
    if (destino || abrindoCristais) return;
    if (!cristaisLiberados) {
      setAvisoCristais(true);
      return;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      navigate("/desafio-dos-cristais");
      return;
    }
    setAbrindoCristais(true);
    window.setTimeout(() => navigate("/desafio-dos-cristais"), DURACAO_TRANSICAO_CRISTAIS_MS);
  }

  // Batalha do Dragão: liberada com os portais 1, 2 e 3 concluídos (o
  // "portal 4" abrir é exatamente o portal 3 concluído — ver mundoLiberado).
  const dragaoLiberado =
    mundoLiberado(progresso, "2") && mundoLiberado(progresso, "3") && mundoLiberado(progresso, "4");

  function handleDragaoClick() {
    if (destino || abrindoDragao) return;
    if (!dragaoLiberado) {
      setAvisoDragao(true);
      return;
    }
    tocarSom("boss"); // o rugido
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      navigate("/batalha-do-dragao");
      return;
    }
    setAbrindoDragao(true);
    window.setTimeout(() => navigate("/batalha-do-dragao"), DURACAO_TRANSICAO_DRAGAO_MS);
  }

  function entrarNoPortal(portal) {
    salvarUltimoPortal(portal.id);
    navigate(`/dificuldade/${portal.id}`, { state: { nomeMundo: portal.nome } });
  }

  // Terminou ou pulou a intro: grava no perfil (banco) e, de reserva, no
  // navegador. Depois dela abrem a escolha de aparência e o tutorial.
  function concluirIntro() {
    introConcluidaRef.current = true;
    setMostrarIntro(false);
    if (usuarioIdRef.current != null) {
      try {
        localStorage.setItem(chaveIntroLocal(usuarioIdRef.current), "1");
      } catch {
        // ignora (aba anônima etc.)
      }
    }
    api.post("/perfil/intro-vista").catch(() => {});
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

      <div
        className={`home-mapa ${abrindoDragao ? "home-mapa--tremendo" : ""}`}
        style={{ backgroundImage: `url(${mapaPrevia})` }}
      >
        {/* width/height = tamanho real da arte: o navegador reserva o espaço
            antes de baixar (sem o mapa "pular" a tela) e fetchPriority avisa
            que é a imagem principal da tela */}
        <img
          src={mapa}
          alt="Mapa da jornada"
          className="home-mapa-imagem"
          width={941}
          height={1672}
          fetchPriority="high"
          decoding="async"
        />

        {PONTOS_CRISTAIS.map((ponto) => (
          <button
            key={ponto.id}
            type="button"
            className={`home-cristais ${cristaisLiberados ? "" : "home-cristais--bloqueado"}`}
            style={{ top: ponto.top, left: ponto.left, width: ponto.largura, height: ponto.altura }}
            onClick={handleCristaisClick}
            aria-label={`${ponto.nome}: Desafio da Cachoeira de Cristais${cristaisLiberados ? "" : " (bloqueado)"}`}
          />
        ))}
        <button
          type="button"
          className={`home-cristais-placa ${cristaisLiberados ? "" : "home-cristais-placa--bloqueada"}`}
          style={{ top: PLACA_CRISTAIS.top, left: PLACA_CRISTAIS.left }}
          onClick={handleCristaisClick}
          aria-label={`Desafio da Cachoeira de Cristais${cristaisLiberados ? "" : " (bloqueado)"}`}
        >
          <i
            className={`hn ${cristaisLiberados ? "hn-sparkles-solid" : "hn-lock"} home-cristais-icone`}
            aria-hidden="true"
          />
          Cachoeira de Cristais
        </button>

        <button
          type="button"
          className={`home-dragao ${dragaoLiberado ? "" : "home-dragao--bloqueado"}`}
          style={{ top: DRAGAO.top, left: DRAGAO.left, width: DRAGAO.largura, height: DRAGAO.altura }}
          onClick={handleDragaoClick}
          aria-label={`Batalha contra o Dragão do Código Fonte${dragaoLiberado ? "" : " (bloqueada)"}`}
        >
          <span className="home-dragao-placa">
            <i className={`hn ${dragaoLiberado ? "hn-fire-solid" : "hn-lock"} home-dragao-icone`} aria-hidden="true" />
            Dragão do Código Fonte
          </span>
        </button>

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
                  <span className="home-bau-icone" aria-hidden="true"><IconePixel icone={Gift} /></span>
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

      {/* Fim do mapa: nuvens com o aviso de que há mais mundos depois deste */}
      <div className="home-fim-mapa">
        {NUVENS_FIM.map((nuvem, i) => (
          <img
            key={i}
            src={nuvem.src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            draggable={false}
            className={`home-fim-nuvem ${nuvem.espelhada ? "home-fim-nuvem--espelhada" : ""}`}
            style={{
              left: `${nuvem.left}%`,
              top: `${nuvem.top}%`,
              width: `${nuvem.largura}%`,
              "--duracao": `${nuvem.duracao}s`,
              "--atraso": `${-i * 1.7}s`,
            }}
          />
        ))}

        <p className="home-fim-placa">
          <i className="hn hn-lock" aria-hidden="true" />
          <span>
            Termine o Mundo 1 para continuar
            <small>Novos mundos em breve...</small>
          </span>
        </p>
      </div>

      {mostrarIntro ? (
        // fundo preto (também em portal, pelo mesmo motivo da cutscene)
        // enquanto o arquivo da cutscene baixa
        <Suspense fallback={createPortal(<div className="intro-cutscene" />, document.body)}>
          <IntroCutscene onConcluir={concluirIntro} />
        </Suspense>
      ) : escolherAparencia ? (
        <EscolherAparencia onConcluir={() => setEscolherAparencia(false)} />
      ) : (
        mostrarTutorial && <TutorialHome onConcluir={concluirTutorial} />
      )}

      {avisoCristais && (
        <AvisoPortalBloqueado
          titulo="Ponte submersa"
          fala="A ponte até o Cristal Gigante ainda está debaixo d'água! Vença a Vila Inicial e a cachoeira vai revelar o Desafio da Cachoeira de Cristais."
          onFechar={() => setAvisoCristais(false)}
        />
      )}

      {/* transição ao abrir o minijogo: brilho roxo e partículas de cristal */}
      {abrindoCristais && (
        <div className="home-transicao-cristais" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} className="home-transicao-particula" style={{ "--i": i }} />
          ))}
        </div>
      )}

      {avisoDragao && (
        <AvisoPortalBloqueado
          titulo="O dragão dorme..."
          fala="Shhh! O Dragão do Código Fonte só desperta para quem venceu os três portais: a Vila Inicial, o Acampamento Goblin e a Arena do Dragão. Conclua todos e volte para a batalha final!"
          onFechar={() => setAvisoDragao(false)}
        />
      )}

      {/* transição da batalha: flash, fogo roxo subindo e o mapa tremendo */}
      {abrindoDragao && (
        <div className="home-transicao-dragao" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} className="home-transicao-fogo" style={{ "--i": i }} />
          ))}
        </div>
      )}

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
