import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Perfil.css";
// Avatar provisório — troque pela arte real do personagem no futuro.
import avatar from "../../assets/images/Guerreiro_simples.png";

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

  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;

    api
      .get("/perfil")
      .then((res) => ativo && setPerfil(res.data))
      .catch(() => ativo && setErro("Não foi possível carregar o perfil."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) {
    return <div className="perfil-estado">Carregando perfil…</div>;
  }

  if (erro) {
    return <div className="perfil-estado perfil-estado--erro">{erro}</div>;
  }

  const membroDesde = formatarMesAno(perfil.membroDesde);
  const posicao = perfil.ranking?.posicao;
  const itens = perfil.itensDestaque ?? [];

  return (
    <div className="perfil">
      {/* Voltar para a Home */}
      <button
        type="button"
        className="perfil-voltar"
        onClick={() => navigate("/home")}
      >
        ← Voltar
      </button>

      {/* Banner do personagem */}
      <div className="perfil-banner">
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

      {/* Estatísticas — 0 até existirem Progresso/Conquistas */}
      <section className="perfil-stats">
        <div className="perfil-stat">
          <span className="perfil-stat-icone">🏆</span>
          <span className="perfil-stat-numero">{perfil.conquistas}</span>
          <span className="perfil-stat-rotulo">Conquistas</span>
        </div>
        <div className="perfil-stat">
          <span className="perfil-stat-icone">✅</span>
          <span className="perfil-stat-numero">{perfil.acertos}</span>
          <span className="perfil-stat-rotulo">Acertos</span>
        </div>
        <div className="perfil-stat">
          <span className="perfil-stat-icone">🔥</span>
          <span className="perfil-stat-numero">{perfil.diasOfensiva}</span>
          <span className="perfil-stat-rotulo">Dias de ofensiva</span>
        </div>
      </section>

      {/* Personalização virá numa etapa futura */}
      <button
        type="button"
        className="perfil-editar"
       onClick={() => navigate("/editar-personagem")}
      >
        Editar personagem
      </button>

      {/* Ranking mundial */}
      <section className="perfil-card">
        <header className="perfil-card-topo">Posição no ranking mundial 🌍</header>
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
              Ainda sem posição. Vença desafios para entrar no ranking.
            </p>
          )}
        </div>
      </section>

      {/* Itens em destaque */}
      <section className="perfil-card">
        <header className="perfil-card-topo">Itens em destaque 🎒</header>
        <div className="perfil-itens">
          {itens.length > 0 ? (
            itens.map((item) => (
              <div className="perfil-item" key={item.id}>
                <div className="perfil-item-icone">{item.icone ?? "🛡️"}</div>
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