import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./Perfil.css";
import { usePersonagemAvatar, resolverAvatarPersonagem } from "../../hooks/usePersonagemAvatar";
import IconeItem from "../../components/IconeItem";
import BotaoPixel from "../../components/BotaoPixel";
import fundoPersonagemPerfil from "../../assets/images/Fundo_Personagem_Perfil.png";

// "2024-04-10..." -> "abril de 2024"
function formatarMesAno(dataIso) {
  if (!dataIso) return null;
  return new Date(dataIso).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function Perfil() {
  const navigate = useNavigate();
  // Presente só quando esta tela abriu a partir de um resultado da busca
  // da Home (ver App.jsx: rotas "/perfil" e "/perfil/:usuarioId") — nesse
  // caso é o perfil de OUTRA pessoa, então some tudo que é edição.
  const { usuarioId } = useParams();
  const modoVisita = Boolean(usuarioId);

  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  // Só usado no modo "meu perfil" — no modo visita o sprite vem dos itens
  // equipados de QUEM está sendo visitado, devolvidos junto do perfil
  // público (ver perfil.itensEquipados abaixo).
  const avatarProprio = usePersonagemAvatar();

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    const url = modoVisita ? `/perfil/${usuarioId}` : "/perfil";

    api
      .get(url)
      .then((res) => ativo && setPerfil(res.data))
      .catch(() => ativo && setErro("Não foi possível carregar o perfil."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [modoVisita, usuarioId]);

  if (carregando) {
    return <div className="perfil-estado">Carregando perfil…</div>;
  }

  if (erro) {
    return <div className="perfil-estado perfil-estado--erro">{erro}</div>;
  }

  const membroDesde = formatarMesAno(perfil.membroDesde);
  const posicao = perfil.ranking?.posicao;
  const itens = perfil.itensDestaque ?? [];
  const avatar = modoVisita ? resolverAvatarPersonagem(perfil.itensEquipados) : avatarProprio;

  return (
    <div className="perfil">
      {/* Voltar — pra Home no meu perfil, ou pra tela anterior (a busca)
          quando estou visitando o perfil de outra pessoa */}
      <BotaoPixel
        className="perfil-voltar"
        classeMiolo="perfil-voltar-miolo"
        onClick={() => (modoVisita ? navigate(-1) : navigate("/home"))}
      >
        ← Voltar
      </BotaoPixel>

      {/* Banner do personagem */}
      <div
        className="perfil-banner"
        style={{
          backgroundImage: `url(${fundoPersonagemPerfil})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <img
          src={avatar}
          alt="Personagem"
          className="perfil-avatar"
          draggable={false}
        />
      </div>

      {/* Identidade — dados reais do banco */}
      <section className="perfil-identidade">
        <h1 className="perfil-nome">{perfil.nome}</h1>
        <p className="perfil-sub">
          <span className="perfil-handle">@{perfil.nomeUsuario}</span>
          {membroDesde && (
            <span className="perfil-desde"> • Joga desde {membroDesde}</span>
          )}
        </p>
      </section>

      {/* Estatísticas */}
      <section className="perfil-stats">
        <div className="perfil-stat">
          <span className="perfil-stat-icone">
            <i className="hn hn-check-circle" aria-hidden="true"></i>
          </span>
          <span className="perfil-stat-numero">{perfil.acertos}</span>
          <span className="perfil-stat-rotulo">Acertos</span>
        </div>
        <div className="perfil-stat">
          <span className="perfil-stat-icone">
            <i className="hn hn-fire" aria-hidden="true"></i>
          </span>
          <span className="perfil-stat-numero">{perfil.diasOfensiva}</span>
          <span className="perfil-stat-rotulo">Dias de ofensiva</span>
        </div>
      </section>

      {!modoVisita && (
        <BotaoPixel
          className="perfil-editar"
          classeMiolo="perfil-editar-miolo"
          onClick={() => navigate("/editar-personagem")}
        >
          Editar personagem
        </BotaoPixel>
      )}

      {/* Ranking mundial */}
      <section className="perfil-card">
        <header className="perfil-card-topo">
          Posição no ranking mundial <i className="hn hn-globe" aria-hidden="true"></i>
        </header>
        <div className="perfil-ranking">
          {posicao ? (
            <>
              <span className="perfil-ranking-nome">{perfil.nome}</span>
              <span className="perfil-ranking-divisor" />
              <span className="perfil-ranking-posicao">
                #{posicao.toLocaleString("pt-BR")}
              </span>
            </>
          ) : (
            <p className="perfil-vazio">
              {modoVisita
                ? "Este jogador prefere manter a posição no ranking em privado."
                : "Ainda sem posição. Vença desafios para entrar no ranking."}
            </p>
          )}
        </div>
      </section>

      {/* Itens em destaque */}
      <section className="perfil-card">
        <header className="perfil-card-topo">
          Itens em destaque <i className="hn hn-briefcase" aria-hidden="true"></i>
        </header>
        <div className="perfil-itens">
          {itens.length > 0 ? (
            itens.map((item) => (
              <div className="perfil-item" key={item.id}>
                <IconeItem
                  item={item}
                  classeImagem="perfil-item-imagem"
                  classeEmoji="perfil-item-icone"
                />
                <span className="perfil-item-nome">{item.nome}</span>
              </div>
            ))
          ) : (
            <p className="perfil-vazio">
              Nenhum item ainda. Derrote inimigos para conquistar equipamentos.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Perfil;