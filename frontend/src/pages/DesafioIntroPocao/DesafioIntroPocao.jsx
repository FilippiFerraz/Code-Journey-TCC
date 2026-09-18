import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BotaoPixel from "../../components/BotaoPixel";
import bruxaInimigo from "../../assets/images/bruxa_inimigo.png";
import "./DesafioIntroPocao.css";

// Introdução narrativa do desafio "Monte a Poção" — mesmo padrão visual
// novel do DesafioIntro.jsx (falas clicáveis + card de enunciado no final),
// só que com a Bruxa no lugar do inimigo, já que este desafio não é uma
// luta. Aninhado por mundoId -> numero do desafio, mesmo motivo do
// INTROS em DesafioIntro.jsx: o numero se repete em cada trilha/portal.
const INTROS_POCAO = {
  1: {
    5: {
      personagem: { imagem: bruxaInimigo, nome: "Bruxa Sintática" },
      falas: [
        "Uma bruxa aparece no seu caminho — mas não pra brigar.",
        '"Viajante! Preciso de ajuda pra terminar minha poção."',
        '"Os ingredientes são pedaços de código... mas nem todos servem pra essa receita."',
        '"Arraste os ingredientes certos pro caldeirão, na ordem certa, e a poção vai funcionar."',
      ],
      titulo: "Monte a Poção",
      texto:
        "Ajude a Bruxa Sintática arrastando os ingredientes certos pro caldeirão, na ordem certa, pra completar a poção.",
      dica: "nem todo ingrediente do monte serve pra essa receita — preste atenção no que cada trecho de código realmente faz antes de arrastar.",
    },
  },
};

// Quebra a dica em partes, tratando texto entre `crases` como trecho de
// código — mesma função de DesafioIntro.jsx.
function renderDica(dica) {
  return dica.split("`").map((parte, i) =>
    i % 2 === 1 ? <code key={i}>{parte}</code> : parte
  );
}

function DesafioIntroPocao() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();

  const intro = INTROS_POCAO[mundoId]?.[desafioId] || INTROS_POCAO[1][5];

  const [indice, setIndice] = useState(0);
  const [mostrarEnunciado, setMostrarEnunciado] = useState(false);

  function handleCliqueTela() {
    if (mostrarEnunciado) return;

    if (indice < intro.falas.length - 1) {
      setIndice((i) => i + 1);
    } else {
      setMostrarEnunciado(true);
    }
  }

  function handleIniciarDesafio(e) {
    e.stopPropagation();
    // Próxima etapa: tela de montar a poção (ver ResolverDesafioPocao)
    navigate(`/pocao/${mundoId}/${dificuldade}/${desafioId}`);
  }

  function handleVoltar(e) {
    e.stopPropagation();
    navigate(-1);
  }

  return (
    <div className="pocaoIntro-container" onClick={handleCliqueTela}>
      <BotaoPixel
        className="pocaoIntro-voltar"
        classeMiolo="pocaoIntro-voltar-miolo"
        onClick={handleVoltar}
      >
        ← Voltar
      </BotaoPixel>

      {/* Cena — anúncio (aviso + nome) acima da bruxa em destaque,
          flutuando, mesmo padrão de DesafioIntro.jsx */}
      <div className="pocaoIntro-cena">
        <div className="pocaoIntro-anuncio">
          <p className="pocaoIntro-aviso">
            Uma bruxa precisa da sua ajuda! Prepare-se para montar a poção certa.
          </p>
          <h2 className="pocaoIntro-nome">{intro.personagem.nome}</h2>
        </div>

        <img
          src={intro.personagem.imagem}
          alt={intro.personagem.nome}
          className="pocaoIntro-personagem"
          draggable={false}
        />
      </div>

      {/* Balão de fala (aparece até a última fala) */}
      {!mostrarEnunciado && (
        <div className="pocaoIntro-balao">
          <p className="pocaoIntro-fala" key={indice}>
            {intro.falas[indice]}
          </p>

          <div className="pocaoIntro-rodape-balao">
            <div className="pocaoIntro-pontos">
              {intro.falas.map((_, i) => (
                <span
                  key={i}
                  className={`pocaoIntro-ponto ${i <= indice ? "pocaoIntro-ponto-ativo" : ""}`}
                />
              ))}
            </div>
            <span className="pocaoIntro-continuar">toque para continuar ▶</span>
          </div>
        </div>
      )}

      {/* Enunciado do desafio (aparece após a última fala) */}
      {mostrarEnunciado && (
        <div className="pocaoIntro-enunciado-overlay">
          <div className="pocaoIntro-enunciado-card" onClick={(e) => e.stopPropagation()}>
            <span className="pocaoIntro-enunciado-tag">DESAFIO {desafioId}</span>
            <h2 className="pocaoIntro-enunciado-titulo">{intro.titulo}</h2>
            <p className="pocaoIntro-enunciado-texto">{intro.texto}</p>
            <p className="pocaoIntro-enunciado-dica">💡 Dica: {renderDica(intro.dica)}</p>

            <BotaoPixel
              className="pocaoIntro-botao-iniciar"
              classeMiolo="pocaoIntro-botao-iniciar-miolo"
              onClick={handleIniciarDesafio}
            >
              Iniciar Desafio
            </BotaoPixel>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesafioIntroPocao;
