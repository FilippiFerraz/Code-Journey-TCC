import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import IconeItem from "../../components/IconeItem";
import BotaoPixel from "../../components/BotaoPixel";
import { FUNDOS_PERFIL } from "../../data/fundosPerfil";
import "./EditarPerfil.css";

// Mesmo limite usado no backend (perfil.service.js) — validado de novo lá,
// isso aqui só evita uma viagem ao servidor pra avisar o óbvio.
const LIMITE_ITENS_DESTAQUE = 3;

function EditarPerfil() {
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(null);

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [rankingVisivel, setRankingVisivel] = useState(true);
  const [fundoPerfil, setFundoPerfil] = useState("padrao");
  const [itens, setItens] = useState([]);
  const [destaque, setDestaque] = useState([]); // ids de ItemPersonagem selecionados

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    Promise.all([api.get("/perfil"), api.get("/personagem")])
      .then(([perfilRes, personagemRes]) => {
        if (!ativo) return;

        setNome(perfilRes.data.nome ?? "");
        setIdade(perfilRes.data.idade != null ? String(perfilRes.data.idade) : "");
        setRankingVisivel(perfilRes.data.rankingVisivel ?? true);
        setFundoPerfil(perfilRes.data.fundoPerfil ?? "padrao");

        const itensPersonagem = personagemRes.data.itens ?? [];
        setItens(itensPersonagem);
        setDestaque(itensPersonagem.filter((ip) => ip.destaque).map((ip) => ip.id));
      })
      .catch(() => ativo && setErroCarregar("Não foi possível carregar seu perfil."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  function alternarDestaque(itemPersonagemId) {
    setErro("");
    setDestaque((atual) => {
      if (atual.includes(itemPersonagemId)) {
        return atual.filter((id) => id !== itemPersonagemId);
      }
      if (atual.length >= LIMITE_ITENS_DESTAQUE) {
        setErro(`Escolha no máximo ${LIMITE_ITENS_DESTAQUE} itens em destaque.`);
        return atual;
      }
      return [...atual, itemPersonagemId];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome não pode ficar vazio.");
      return;
    }

    const idadeNumero = idade === "" ? null : Number(idade);
    if (
      idadeNumero !== null &&
      (!Number.isInteger(idadeNumero) || idadeNumero < 13 || idadeNumero > 120)
    ) {
      setErro("Informe uma idade válida (mínimo 13 anos).");
      return;
    }

    try {
      setSalvando(true);

      await Promise.all([
        api.put("/perfil", {
          nome,
          ...(idadeNumero !== null ? { idade: idadeNumero } : {}),
          rankingVisivel,
          fundoPerfil,
        }),
        api.put("/perfil/itens-destaque", { itemPersonagemIds: destaque }),
      ]);

      navigate("/perfil");
    } catch (err) {
      const mensagem =
        err.response?.data?.erro || "Não foi possível salvar as alterações. Tente novamente.";
      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="editarperfil-estado">Carregando perfil…</div>;
  }

  if (erroCarregar) {
    return <div className="editarperfil-estado editarperfil-estado--erro">{erroCarregar}</div>;
  }

  return (
    <div className="editarperfil">
      <BotaoPixel
        className="editarperfil-voltar"
        classeMiolo="editarperfil-voltar-miolo"
        onClick={() => navigate("/perfil")}
      >
        ← Voltar
      </BotaoPixel>

      <h1 className="editarperfil-titulo">Editar perfil</h1>

      <form className="editarperfil-form" onSubmit={handleSubmit}>
        <section className="editarperfil-card">
          <label className="editarperfil-label" htmlFor="nome">
            Nome do perfil
          </label>
          <input
            id="nome"
            type="text"
            className="editarperfil-input"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <label className="editarperfil-label" htmlFor="idade">
            Idade
          </label>
          <input
            id="idade"
            type="number"
            inputMode="numeric"
            min="13"
            max="120"
            className="editarperfil-input"
            placeholder="Sua idade"
            value={idade}
            onChange={(e) => setIdade(e.target.value)}
          />

          <div className="editarperfil-toggle-linha">
            <div className="editarperfil-toggle-texto">
              <span className="editarperfil-toggle-titulo">
                Mostrar minha posição no ranking
              </span>
              <p className="editarperfil-toggle-descricao">
                Quando desativado, você some da lista pública do ranking — mas continua vendo
                sua própria posição no Perfil.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={rankingVisivel}
              className={`editarperfil-switch ${
                rankingVisivel ? "editarperfil-switch--ativo" : ""
              }`}
              onClick={() => setRankingVisivel((atual) => !atual)}
            >
              <span className="editarperfil-switch-bola" />
            </button>
          </div>
        </section>

        <section className="editarperfil-card">
          <header className="editarperfil-card-topo">
            Cor de fundo do perfil <i className="hn hn-paint-brush" aria-hidden="true"></i>
          </header>

          <div className="editarperfil-card-corpo">
            <p className="editarperfil-fundos-dica">
              Escolha a cor de fundo da sua tela de Perfil. As opções ficam fora do tom dos
              botões, pra eles continuarem bem visíveis.
            </p>
            <div className="editarperfil-fundos-grid">
              {FUNDOS_PERFIL.map((fundo) => (
                <button
                  key={fundo.id}
                  type="button"
                  className={`editarperfil-fundo ${
                    fundoPerfil === fundo.id ? "editarperfil-fundo--selecionado" : ""
                  }`}
                  style={{ background: fundo.gradiente }}
                  onClick={() => setFundoPerfil(fundo.id)}
                  title={fundo.nome}
                  aria-label={fundo.nome}
                  aria-pressed={fundoPerfil === fundo.id}
                >
                  {fundoPerfil === fundo.id && (
                    <span className="editarperfil-fundo-marca">
                      <i className="hn hn-check" aria-hidden="true"></i>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="editarperfil-card">
          <header className="editarperfil-card-topo">
            Itens em destaque <i className="hn hn-briefcase" aria-hidden="true"></i>
            <span className="editarperfil-contador">
              {destaque.length}/{LIMITE_ITENS_DESTAQUE}
            </span>
          </header>

          <div className="editarperfil-card-corpo">
            {itens.length === 0 ? (
              <p className="editarperfil-vazio">
                Nenhum item ainda. Derrote inimigos para conquistar equipamentos.
              </p>
            ) : (
              <div className="editarperfil-itens-grid">
                {itens.map((itemPersonagem) => (
                  <button
                    key={itemPersonagem.id}
                    type="button"
                    className={`editarperfil-item ${
                      destaque.includes(itemPersonagem.id) ? "editarperfil-item--selecionado" : ""
                    }`}
                    onClick={() => alternarDestaque(itemPersonagem.id)}
                    title={itemPersonagem.item.nome}
                  >
                    {destaque.includes(itemPersonagem.id) && (
                      <span className="editarperfil-item-marca">
                        <i className="hn hn-check" aria-hidden="true"></i>
                      </span>
                    )}
                    <IconeItem
                      item={itemPersonagem.item}
                      classeImagem="editarperfil-item-imagem"
                      classeEmoji="editarperfil-item-icone"
                    />
                    <span className="editarperfil-item-nome">{itemPersonagem.item.nome}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {erro && <p className="editarperfil-erro">{erro}</p>}

        <BotaoPixel
          type="submit"
          className="editarperfil-salvar"
          classeMiolo="editarperfil-salvar-miolo"
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </BotaoPixel>
      </form>
    </div>
  );
}

export default EditarPerfil;
