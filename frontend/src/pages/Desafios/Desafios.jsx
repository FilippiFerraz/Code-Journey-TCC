import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import BotaoPixel from "../../components/BotaoPixel";
import "./Desafios.css";
import magoImagem from "../../assets/images/mago.png";
import fundoPersonagem from "../../assets/images/Fundo_personagem.png";
import detalheDesafios from "../../assets/images/Detalhe_desafios.png";
import api from "../../services/api";
import { desafioLiberado } from "../../data/progresso";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";

// Ids dos desafios da trilha. Quem está liberado ou não é calculado a partir
// do progresso REAL do usuário (GET /api/progresso — ver desafioLiberado em
// data/progresso.js): o desafio 1 sempre começa aberto, e cada próximo só
// libera depois que o anterior aparecer como concluído no progresso vindo
// da API.
const IDS_DESAFIOS = [1, 2, 3, 4, 5, 6];

// O último desafio de toda trilha é a batalha de chefe (ver
// src/pages/DesafioChefe) — segue as mesmas regras de bloqueio/desbloqueio
// dos demais, só muda a rota de destino.
// TODO: quando a API de desafios existir, isso deveria vir marcado nos
// próprios dados do desafio (ex: desafio.tipo === "chefe"), em vez de fixo
// na posição da trilha.
const ID_DESAFIO_CHEFE = IDS_DESAFIOS[IDS_DESAFIOS.length - 1];

function Desafios() {
  const { mundoId, dificuldade } = useParams();
  const navigate = useNavigate();
  const guerreiro = usePersonagemAvatar();
  // Começa vazio — enquanto não chega (ou se a chamada falhar), só o
  // desafio 1 aparece liberado, nunca o contrário.
  const [progresso, setProgresso] = useState([]);

  useEffect(() => {
    let ativo = true;

    api
      .get("/progresso", { params: { mundoId, dificuldade } })
      .then((res) => {
        if (ativo) setProgresso(res.data);
      })
      .catch(() => {
        // sem progresso carregado (ex: offline) — mantém os desafios além
        // do 1 bloqueados em vez de liberar por engano
      });

    return () => {
      ativo = false;
    };
  }, [mundoId, dificuldade]);

  const desafios = IDS_DESAFIOS.map((id) => ({
    id,
    bloqueado: !desafioLiberado(progresso, mundoId, dificuldade, id),
  }));

  function handleAbrirDesafio(desafio) {
    if (desafio.bloqueado) return;
    if (desafio.id === ID_DESAFIO_CHEFE) {
      navigate(`/desafio-chefe/${mundoId}/${dificuldade}/${desafio.id}`);
    } else {
      navigate(`/desafio/${mundoId}/${dificuldade}/${desafio.id}`);
    }
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
            <BotaoPixel
              className="desafios-fechar"
              classeMiolo="desafios-fechar-miolo"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              ✕
            </BotaoPixel>
          </div>

          <div className="desafios-placa-corpo">
            <div className="desafios-grid">
              {desafios.map((desafio) => (
                <BotaoPixel
                  key={desafio.id}
                  className={desafio.bloqueado ? "desafios-botao-bloqueado" : "desafios-botao-liberado"}
                  classeMiolo={
                    desafio.bloqueado
                      ? "desafios-botao-miolo-bloqueado"
                      : "desafios-botao-miolo-liberado"
                  }
                  onClick={() => handleAbrirDesafio(desafio)}
                  disabled={desafio.bloqueado}
                >
                  {desafio.bloqueado && <span className="desafios-cadeado">🔒</span>}
                  {!desafio.bloqueado && desafio.id === ID_DESAFIO_CHEFE && (
                    <span className="desafios-coroa" aria-hidden="true">👑</span>
                  )}
                  DESAFIO {desafio.id}
                </BotaoPixel>
              ))}
            </div>

            <img
              src={detalheDesafios}
              alt=""
              aria-hidden="true"
              className="desafios-espadas"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Desafios;