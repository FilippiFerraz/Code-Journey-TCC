import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import "./Desafios.css";
import magoImagem from "../../assets/images/mago.png";
import guerreiro from "../../assets/images/Guerreiro_simples.png";
import fundoPersonagem from "../../assets/images/Fundo_personagem.png";
import { desafioLiberado } from "../../data/progresso";

// Ids dos desafios da trilha. Quem está liberado ou não é calculado a partir
// do progresso salvo (ver desafioLiberado em data/progresso.js): o desafio 1
// sempre começa aberto, e cada próximo só libera depois que o anterior for
// concluído com sucesso.
const IDS_DESAFIOS = [1, 2, 3, 4, 5, 6];

function Desafios() {
  const { mundoId, dificuldade } = useParams();
  const navigate = useNavigate();

  const desafios = IDS_DESAFIOS.map((id) => ({
    id,
    bloqueado: !desafioLiberado(mundoId, dificuldade, id),
  }));

  function handleAbrirDesafio(desafio) {
    if (desafio.bloqueado) return;
    navigate(`/desafio/${mundoId}/${dificuldade}/${desafio.id}`);
  }

  return (
    <MainLayout titulo="DESAFIOS - ATO 1">
      <div className="desafios-container">
        {/* Cena do personagem */}
        <div
          className="desafios-cena"
          style={{
            backgroundImage: `url(${fundoPersonagem})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
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
              {desafios.map((desafio) => (
                <button
                  key={desafio.id}
                  type="button"
                  className={`desafios-botao ${
                    desafio.bloqueado ? "desafios-botao-bloqueado" : "desafios-botao-liberado"
                  }`}
                  onClick={() => handleAbrirDesafio(desafio)}
                  disabled={desafio.bloqueado}
                >
                  {/* miolo = camada interna, separada só pra poder ter o
                      mesmo recorte pixelado da borda externa, criando o
                      efeito de "moldura" em degraus */}
                  <span
                    className={`desafios-botao-miolo ${
                      desafio.bloqueado
                        ? "desafios-botao-miolo-bloqueado"
                        : "desafios-botao-miolo-liberado"
                    }`}
                  >
                    {desafio.bloqueado && (
                      <span className="desafios-cadeado">🔒</span>
                    )}
                    DESAFIO {desafio.id}
                  </span>
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