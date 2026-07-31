import { useNavigate, useParams } from "react-router-dom";
import "./SelecionarDificuldade.css";

// Duas dificuldades do jogo. O "rotulo" aparece ao passar o mouse.
const DIFICULDADES = [
  { id: "iniciante", nome: "Iniciante", rotulo: "Dificuldade fácil" },
  { id: "guerreiro", nome: "Guerreiro", rotulo: "Dificuldade difícil" },
];

function SelecionarDificuldade() {
  const { mundoId } = useParams();
  const navigate = useNavigate();

  function selecionar(dificuldadeId) {
    navigate(`/desafios/${mundoId}/${dificuldadeId}`);
  }

  return (
    <div className="dif-tela">
      <div className="dif-placa">
        <div className="dif-placa-topo">
          <h1 className="dif-placa-titulo">DIFICULDADE</h1>
          <button
            type="button"
            className="dif-fechar"
            onClick={() => navigate(-1)}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="dif-placa-corpo">
          <div className="dif-grid">
            {DIFICULDADES.map((d) => (
              <button
                key={d.id}
                type="button"
                className="dif-botao"
                onClick={() => selecionar(d.id)}
              >
                <span className="dif-botao-nome">{d.nome}</span>
                <span className="dif-tooltip">{d.rotulo}</span>
              </button>
            ))}
          </div>

          <div className="dif-espadas" aria-hidden="true">
            ⚔️
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelecionarDificuldade;