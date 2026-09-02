import { useNavigate, useParams } from "react-router-dom";
import BotaoPixel from "../../components/BotaoPixel";
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
          <BotaoPixel
            className="dif-fechar"
            classeMiolo="dif-fechar-miolo"
            onClick={() => navigate(-1)}
            aria-label="Fechar"
          >
            ✕
          </BotaoPixel>
        </div>

        <div className="dif-placa-corpo">
          <div className="dif-grid">
            {DIFICULDADES.map((d) => (
              <BotaoPixel
                key={d.id}
                className="dif-botao"
                classeMiolo="dif-botao-miolo"
                onClick={() => selecionar(d.id)}
                extra={<span className="dif-tooltip">{d.rotulo}</span>}
              >
                {d.nome}
              </BotaoPixel>
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