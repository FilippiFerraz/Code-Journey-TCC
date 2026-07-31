import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import "./Desafios.css";
import magoImagem from "../../assets/images/mago.png";
import guerreiro from "../../assets/images/Guerreiro_simples.png";

// Por enquanto, só o primeiro desafio vem desbloqueado (o resto libera conforme o progresso do jogador)
const DESAFIOS = [
  { id: 1, bloqueado: false },
  { id: 2, bloqueado: true },
  { id: 3, bloqueado: true },
  { id: 4, bloqueado: true },
  { id: 5, bloqueado: true },
  { id: 6, bloqueado: true },
];

function Desafios() {
  const { mundoId, dificuldade } = useParams();
  const navigate = useNavigate();

  function handleAbrirDesafio(desafio) {
    if (desafio.bloqueado) return;
    navigate(`/desafio/${mundoId}/${dificuldade}/${desafio.id}`);
  }

  return (
    <MainLayout titulo="DESAFIOS - ATO 1">
      <div className="desafios-container">
        {/* Cena do personagem */}
        <div className="desafios-cena">
          <img src={guerreiro} alt="Guerreiro" className="personagem" />
        </div>

        {/* Placa de madeira com a lista de desafios */}
        <div className="desafios-placa">
          <div className="desafios-placa-topo">
            <h2 className="desafios-placa-titulo">DESAFIOS</h2>
            <button
              type="button"
              className="desafios-fechar"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              ✕
            </button>
          </div>

          <div className="desafios-placa-corpo">
            <div className="desafios-grid">
              {DESAFIOS.map((desafio) => (
                <button
                  key={desafio.id}
                  type="button"
                  className={`desafios-botao ${
                    desafio.bloqueado ? "desafios-botao-bloqueado" : "desafios-botao-liberado"
                  }`}
                  onClick={() => handleAbrirDesafio(desafio)}
                  disabled={desafio.bloqueado}
                >
                  {desafio.bloqueado && <span className="desafios-cadeado">🔒</span>}
                  DESAFIO {desafio.id}
                </button>
              ))}
            </div>

            <div className="desafios-espadas">⚔️</div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Desafios;