import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import mapa from "../../assets/images/mapa.png";
import portalDesafios from "../../assets/images/Portal_Desafios.gif";
import cadeadoPortal from "../../assets/images/Cadeado_portal.png";
import api from "../../services/api";
import { mundoLiberado } from "../../data/progresso";
import TutorialHome from "./TutorialHome";
import AvisoPortalBloqueado from "./AvisoPortalBloqueado";
import "./Home.css";

// Posições em % relativas ao tamanho da imagem do mapa (ajuste livremente)
const PORTAIS = [
  { id: "1", nome: "Vila Inicial", top: "16%", left: "50%" },
  { id: "2", nome: "Acampamento Goblin", top: "47%", left: "50%" },
  { id: "3", nome: "Arena do Dragão", top: "71%", left: "50%" },
];

function Home() {
  const navigate = useNavigate();
  const [mostrarTutorial, setMostrarTutorial] = useState(false);
  // Portal clicado enquanto ainda trancado — guarda o objeto pra mostrar o
  // nome dele no aviso do Mago; null quando não há aviso na tela.
  const [portalBloqueado, setPortalBloqueado] = useState(null);
  // Progresso real do usuário logado (GET /api/progresso), usado pra decidir
  // quais portais estão liberados. Começa vazio — enquanto não chega (ou se
  // a chamada falhar), só o portal 1 aparece liberado, nunca o contrário.
  const [progresso, setProgresso] = useState([]);

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

    return () => {
      ativo = false;
    };
  }, []);

  function handlePortalClick(portal) {
    if (!mundoLiberado(progresso, portal.id)) {
      setPortalBloqueado(portal);
      return;
    }
    navigate(`/dificuldade/${portal.id}`, { state: { nomeMundo: portal.nome } });
  }

  function concluirTutorial() {
    setMostrarTutorial(false);
    api.post("/perfil/tutorial-visto").catch(() => {});
  }

  return (
    <MainLayout titulo="HOME">
      <div className="home-mapa">
        <img src={mapa} alt="Mapa da jornada" className="home-mapa-imagem" />

        {PORTAIS.map((portal) => {
          const liberado = mundoLiberado(progresso, portal.id);
          return (
            <button
              key={portal.id}
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
          );
        })}
      </div>

      {mostrarTutorial && <TutorialHome onConcluir={concluirTutorial} />}

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
