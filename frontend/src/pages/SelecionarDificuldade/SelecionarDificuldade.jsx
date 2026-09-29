import { useNavigate, useParams } from "react-router-dom";
import BotaoPixel from "../../components/BotaoPixel";
import fundoTela from "../../assets/images/fundo_tela_selcionardesafio.png";
import "./SelecionarDificuldade.css";

// Dificuldades exibidas, na ordem dos botões. O "valor" é o que vai na URL
// (/desafios/:mundoId/:valor) e é o mesmo usado no progresso salvo no
// backend e em data/progresso.js — não trocar sem migrar esses dados. O
// "descricao" aparece como dica ao passar o mouse.
// Ícone aceita emoji ou caminho de imagem .png/.gif (ver IconeDificuldade).
const DIFICULDADES = [
  { valor: "iniciante", rotulo: "INICIANTE", nome: "Iniciante", descricao: "Dificuldade fácil", icone: "🗡️" },
  { valor: "guerreiro", rotulo: "GUERREIRO", nome: "Guerreiro", descricao: "Dificuldade difícil", icone: "⚔️" },
  // { valor: "mestre", rotulo: "MESTRE", nome: "Mestre", descricao: "Dificuldade extrema", icone: "👑" }, // TODO: reativar se um terceiro nível for criado
];

function IconeDificuldade({ icone }) {
  if (/\.(png|gif)$/i.test(icone)) {
    return <img src={icone} alt="" className="dif-opcao-icone-imagem" draggable={false} />;
  }
  return <span className="dif-opcao-icone-emoji">{icone}</span>;
}

function SelecionarDificuldade() {
  const { mundoId } = useParams();
  const navigate = useNavigate();

  function selecionar(valor) {
    navigate(`/desafios/${mundoId}/${valor}`);
  }

  return (
    <div className="dif-tela" style={{ backgroundImage: `url(${fundoTela})` }}>
      <BotaoPixel
        className="dif-voltar"
        classeMiolo="dif-voltar-miolo"
        onClick={() => navigate("/home")}
        aria-label="Voltar para o mapa"
      >
        <i className="hn hn-arrow-left" aria-hidden="true" />
      </BotaoPixel>

      <section className="dif-painel">
        <span className="dif-estandarte dif-estandarte--esquerda" aria-hidden="true" />
        <span className="dif-estandarte dif-estandarte--direita" aria-hidden="true" />
        <span className="dif-ponta-madeira dif-ponta-madeira--esquerda" aria-hidden="true" />
        <span className="dif-ponta-madeira dif-ponta-madeira--direita" aria-hidden="true" />

        <div className="dif-brasao" aria-hidden="true">
          <div className="dif-brasao-ferro">
            <div className="dif-brasao-escudo">
              <i className="hn hn-crown-solid" />
            </div>
          </div>
        </div>

        <div className="dif-moldura">
          <div className="dif-placa-titulo">
            <h1>DIFICULDADE</h1>
          </div>

          <div className="dif-pergaminho">
            <div className="dif-divisor" aria-hidden="true">
              <span className="dif-divisor-linha" />
              <span className="dif-divisor-ponto" />
              <span className="dif-divisor-losango" />
              <span className="dif-divisor-ponto" />
              <span className="dif-divisor-linha dif-divisor-linha--direita" />
            </div>

            <div className="dif-opcoes">
              {DIFICULDADES.map((d, indice) => (
                <button
                  key={d.valor}
                  type="button"
                  className="dif-opcao"
                  style={{ animationDelay: `${0.45 + indice * 0.1}s` }}
                  onClick={() => selecionar(d.valor)}
                  aria-label={`Dificuldade ${d.nome}`}
                  title={d.descricao}
                >
                  <span className="dif-opcao-canto dif-opcao-canto--se" aria-hidden="true" />
                  <span className="dif-opcao-canto dif-opcao-canto--sd" aria-hidden="true" />
                  <span className="dif-opcao-canto dif-opcao-canto--ie" aria-hidden="true" />
                  <span className="dif-opcao-canto dif-opcao-canto--id" aria-hidden="true" />

                  <span className="dif-opcao-icone" aria-hidden="true">
                    <IconeDificuldade icone={d.icone} />
                  </span>
                  <span className="dif-opcao-losango" aria-hidden="true" />
                  <span className="dif-opcao-rotulo">{d.rotulo}</span>
                </button>
              ))}
            </div>

            <div className="dif-divisor dif-divisor--inferior" aria-hidden="true">
              <span className="dif-divisor-losango dif-divisor-losango--pequeno" />
              <span className="dif-divisor-linha" />
              <i className="hn hn-crown-solid dif-divisor-coroa" />
              <span className="dif-divisor-linha dif-divisor-linha--direita" />
              <span className="dif-divisor-losango dif-divisor-losango--pequeno" />
            </div>
          </div>

          <span className="dif-cantoneira dif-cantoneira--esquerda" aria-hidden="true" />
          <span className="dif-cantoneira dif-cantoneira--direita" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}

export default SelecionarDificuldade;
