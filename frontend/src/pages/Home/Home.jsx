import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import mapa from "../../assets/images/mapa.png";
import portalDesafios from "../../assets/images/Portal_Desafios.gif";
import "./Home.css";

// Posições em % relativas ao tamanho da imagem do mapa (ajuste livremente)
const PORTAIS = [
  { id: "1", nome: "Vila Inicial", top: "16%", left: "39%" },
  { id: "2", nome: "Floresta Sombria", top: "56%", left: "51%" },
  { id: "3", nome: "Ponte do Código", top: "87%", left: "50%" },
];

function Home() {
  const navigate = useNavigate();

  function handlePortalClick(portal) {
    navigate(`/dificuldade/${portal.id}`, { state: { nomeMundo: portal.nome } });
  }

  return (
    <MainLayout titulo="HOME">
      <div className="home-mapa">
        <img src={mapa} alt="Mapa da jornada" className="home-mapa-imagem" />

        {PORTAIS.map((portal) => (
          <button
            key={portal.id}
            type="button"
            className="home-portal"
            style={{ top: portal.top, left: portal.left }}
            onClick={() => handlePortalClick(portal)}
          >
            <img
              src={portalDesafios}
              alt=""
              aria-hidden="true"
              className="home-portal-gif"
              draggable={false}
            />
            <span className="home-portal-nome">{portal.nome}</span>
          </button>
        ))}
      </div>
    </MainLayout>
  );
}

export default Home;