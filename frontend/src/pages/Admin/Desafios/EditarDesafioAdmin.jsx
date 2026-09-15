import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import "./AdminDesafios.css";

// Próxima letra livre pra id de uma nova alternativa (a, b, c…) — mesmo
// esquema de ids já usado nos desafios existentes (ver seed.js).
function proximoIdOpcao(opcoes) {
  return String.fromCharCode(97 + opcoes.length);
}

function EditarDesafioAdmin() {
  const navigate = useNavigate();
  const { desafioId } = useParams();

  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [cabecalho, setCabecalho] = useState(null); // { mundoId, dificuldade, numero }

  const [titulo, setTitulo] = useState("");
  const [enunciado, setEnunciado] = useState("");
  const [dica, setDica] = useState("");
  const [xpConcedido, setXpConcedido] = useState("10");

  // "multipla" | "ordenar_blocos"
  const [tipoAlternativas, setTipoAlternativas] = useState("multipla");
  const [opcoes, setOpcoes] = useState([]); // [{ id, texto, correta }]
  const [blocosJson, setBlocosJson] = useState("");

  const [itensCatalogo, setItensCatalogo] = useState([]);
  const [tipoRecompensa, setTipoRecompensa] = useState(""); // "" | "insignia" | "item"
  const [itemRecompensaId, setItemRecompensaId] = useState("");
  const [nomeRecompensa, setNomeRecompensa] = useState("");
  const [descricaoRecompensa, setDescricaoRecompensa] = useState("");
  const [iconeRecompensa, setIconeRecompensa] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    let ativo = true;

    Promise.all([api.get(`/admin/desafios/${desafioId}`), api.get("/admin/itens")])
      .then(([resDesafio, resItens]) => {
        if (!ativo) return;
        const d = resDesafio.data;

        setCabecalho({ mundoId: d.mundoId, dificuldade: d.dificuldade, numero: d.numero });
        setTitulo(d.titulo);
        setEnunciado(d.enunciado);
        setDica(d.dica || "");
        setXpConcedido(String(d.xpConcedido));

        if (Array.isArray(d.alternativas)) {
          setTipoAlternativas("multipla");
          setOpcoes(d.alternativas.map((alt) => ({ ...alt })));
        } else {
          setTipoAlternativas("ordenar_blocos");
          setBlocosJson(JSON.stringify(d.alternativas, null, 2));
        }

        setTipoRecompensa(d.tipoRecompensa || "");
        setItemRecompensaId(d.itemRecompensaId ? String(d.itemRecompensaId) : "");
        setNomeRecompensa(d.nomeRecompensa || "");
        setDescricaoRecompensa(d.descricaoRecompensa || "");
        setIconeRecompensa(d.iconeRecompensa || "");

        setItensCatalogo(resItens.data);
      })
      .catch(() => ativo && setErroCarregar("Não foi possível carregar este desafio."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [desafioId]);

  function atualizarOpcao(indice, campo, valor) {
    setOpcoes((atual) => atual.map((op, i) => (i === indice ? { ...op, [campo]: valor } : op)));
  }

  function marcarCorreta(indice) {
    setOpcoes((atual) => atual.map((op, i) => ({ ...op, correta: i === indice })));
  }

  function adicionarOpcao() {
    setOpcoes((atual) => [...atual, { id: proximoIdOpcao(atual), texto: "", correta: false }]);
  }

  function removerOpcao(indice) {
    setOpcoes((atual) => atual.filter((_, i) => i !== indice));
  }

  // Ao escolher um item pra recompensa, pré-preenche nome/ícone/descrição a
  // partir do catálogo — o admin ainda pode ajustar o texto manualmente
  // depois, já que esses campos ficam salvos no próprio Desafio.
  function selecionarItemRecompensa(id) {
    setItemRecompensaId(id);
    const item = itensCatalogo.find((it) => String(it.id) === id);
    if (item) {
      setNomeRecompensa(item.nome);
      setIconeRecompensa(item.icone || "");
      setDescricaoRecompensa(item.descricao || "");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!titulo.trim() || !enunciado.trim()) {
      setErro("Título e enunciado não podem ficar vazios.");
      return;
    }

    let alternativasFinal;
    if (tipoAlternativas === "multipla") {
      if (opcoes.length < 2) {
        setErro("Inclua ao menos duas alternativas.");
        return;
      }
      if (opcoes.some((op) => !op.texto.trim())) {
        setErro("Preencha o texto de todas as alternativas.");
        return;
      }
      if (!opcoes.some((op) => op.correta)) {
        setErro("Marque qual alternativa é a correta.");
        return;
      }
      alternativasFinal = opcoes;
    } else {
      try {
        alternativasFinal = JSON.parse(blocosJson);
      } catch {
        setErro("O JSON dos blocos está mal formatado.");
        return;
      }
    }

    const xpNumero = Number(xpConcedido);
    if (!Number.isInteger(xpNumero) || xpNumero < 0) {
      setErro("Informe um XP válido (número inteiro, 0 ou mais).");
      return;
    }

    if (tipoRecompensa === "item" && !itemRecompensaId) {
      setErro("Selecione um item pra recompensa.");
      return;
    }

    try {
      setSalvando(true);

      await api.put(`/admin/desafios/${desafioId}`, {
        titulo,
        enunciado,
        dica: dica || null,
        alternativas: alternativasFinal,
        xpConcedido: xpNumero,
        tipoRecompensa: tipoRecompensa || null,
        itemRecompensaId: tipoRecompensa === "item" ? Number(itemRecompensaId) : null,
        nomeRecompensa: tipoRecompensa ? nomeRecompensa || null : null,
        descricaoRecompensa: tipoRecompensa ? descricaoRecompensa || null : null,
        iconeRecompensa: tipoRecompensa ? iconeRecompensa || null : null,
      });

      setSucesso("Alterações salvas com sucesso!");
      setTimeout(() => setSucesso(""), 3000);
    } catch (err) {
      setErro(err.response?.data?.erro || "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <MainLayout titulo="Editar desafio">
        <p className="admin-desafios-mensagem">Carregando…</p>
      </MainLayout>
    );
  }

  if (erroCarregar) {
    return (
      <MainLayout titulo="Editar desafio">
        <p className="admin-desafios-mensagem admin-desafios-mensagem--erro">{erroCarregar}</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout titulo="Editar desafio">
      <div className="admin-desafios">
        <BotaoPixel
          className="admin-desafios-voltar"
          classeMiolo="admin-desafios-voltar-miolo"
          onClick={() => navigate("/admin/desafios")}
        >
          ← Desafios
        </BotaoPixel>

        <p className="admin-desafios-trilha-info">
          Mundo {cabecalho.mundoId} • {cabecalho.dificuldade} • Desafio {cabecalho.numero}
        </p>

        <form onSubmit={handleSubmit}>
          {/* ---------- Informações básicas ---------- */}
          <section className="admin-desafios-card">
            <header className="admin-desafios-card-topo">Enunciado</header>
            <div className="admin-desafios-card-corpo">
              <label className="admin-desafios-label" htmlFor="titulo">
                Título
              </label>
              <input
                id="titulo"
                type="text"
                className="admin-desafios-input"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />

              <label className="admin-desafios-label" htmlFor="enunciado">
                Enunciado
              </label>
              <textarea
                id="enunciado"
                className="admin-desafios-textarea"
                rows={4}
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
              />

              <label className="admin-desafios-label" htmlFor="dica">
                Dica (opcional)
              </label>
              <input
                id="dica"
                type="text"
                className="admin-desafios-input"
                value={dica}
                onChange={(e) => setDica(e.target.value)}
              />

              <label className="admin-desafios-label" htmlFor="xp">
                XP concedido
              </label>
              <input
                id="xp"
                type="number"
                min="0"
                className="admin-desafios-input"
                value={xpConcedido}
                onChange={(e) => setXpConcedido(e.target.value)}
              />
            </div>
          </section>

          {/* ---------- Alternativas ---------- */}
          <section className="admin-desafios-card">
            <header className="admin-desafios-card-topo">
              Alternativas {tipoAlternativas === "ordenar_blocos" && "(ordenar blocos)"}
            </header>
            <div className="admin-desafios-card-corpo">
              {tipoAlternativas === "multipla" ? (
                <>
                  {opcoes.map((opcao, indice) => (
                    <div className="admin-desafios-opcao" key={indice}>
                      <input
                        type="radio"
                        name="correta"
                        checked={Boolean(opcao.correta)}
                        onChange={() => marcarCorreta(indice)}
                        title="Marcar como correta"
                      />
                      <input
                        type="text"
                        className="admin-desafios-input admin-desafios-opcao-texto"
                        placeholder={`Alternativa ${opcao.id}`}
                        value={opcao.texto}
                        onChange={(e) => atualizarOpcao(indice, "texto", e.target.value)}
                      />
                      <button
                        type="button"
                        className="admin-desafios-opcao-remover"
                        onClick={() => removerOpcao(indice)}
                        aria-label="Remover alternativa"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="admin-desafios-adicionar"
                    onClick={adicionarOpcao}
                  >
                    + Adicionar alternativa
                  </button>
                </>
              ) : (
                <>
                  <p className="admin-desafios-dica">
                    Formato "ordenar blocos" — edite o JSON diretamente (campos: blocos e
                    ordemCorreta).
                  </p>
                  <textarea
                    className="admin-desafios-textarea admin-desafios-json"
                    rows={12}
                    value={blocosJson}
                    onChange={(e) => setBlocosJson(e.target.value)}
                  />
                </>
              )}
            </div>
          </section>

          {/* ---------- Recompensa ---------- */}
          <section className="admin-desafios-card">
            <header className="admin-desafios-card-topo">Recompensa</header>
            <div className="admin-desafios-card-corpo">
              <label className="admin-desafios-label" htmlFor="tipoRecompensa">
                Tipo de recompensa
              </label>
              <select
                id="tipoRecompensa"
                className="admin-desafios-input"
                value={tipoRecompensa}
                onChange={(e) => setTipoRecompensa(e.target.value)}
              >
                <option value="">Sem recompensa</option>
                <option value="insignia">Insígnia</option>
                <option value="item">Item de inventário</option>
              </select>

              {tipoRecompensa === "item" && (
                <>
                  <label className="admin-desafios-label" htmlFor="item">
                    Item
                  </label>
                  <select
                    id="item"
                    className="admin-desafios-input"
                    value={itemRecompensaId}
                    onChange={(e) => selecionarItemRecompensa(e.target.value)}
                  >
                    <option value="">Selecione um item…</option>
                    {itensCatalogo.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.icone ? `${item.icone} ` : ""}
                        {item.nome} ({item.tipo})
                      </option>
                    ))}
                  </select>
                </>
              )}

              {tipoRecompensa && (
                <>
                  <label className="admin-desafios-label" htmlFor="nomeRecompensa">
                    Nome exibido
                  </label>
                  <input
                    id="nomeRecompensa"
                    type="text"
                    className="admin-desafios-input"
                    value={nomeRecompensa}
                    onChange={(e) => setNomeRecompensa(e.target.value)}
                  />

                  <label className="admin-desafios-label" htmlFor="descricaoRecompensa">
                    Descrição
                  </label>
                  <textarea
                    id="descricaoRecompensa"
                    className="admin-desafios-textarea"
                    rows={3}
                    value={descricaoRecompensa}
                    onChange={(e) => setDescricaoRecompensa(e.target.value)}
                  />

                  <label className="admin-desafios-label" htmlFor="iconeRecompensa">
                    Ícone (emoji)
                  </label>
                  <input
                    id="iconeRecompensa"
                    type="text"
                    className="admin-desafios-input admin-desafios-input--curto"
                    value={iconeRecompensa}
                    onChange={(e) => setIconeRecompensa(e.target.value)}
                  />
                </>
              )}
            </div>
          </section>

          {erro && <p className="admin-desafios-erro">{erro}</p>}
          {sucesso && <p className="admin-desafios-sucesso">{sucesso}</p>}

          <BotaoPixel
            type="submit"
            className="admin-desafios-salvar"
            classeMiolo="admin-desafios-salvar-miolo"
            disabled={salvando}
          >
            {salvando ? "Salvando…" : "Salvar alterações"}
          </BotaoPixel>
        </form>
      </div>
    </MainLayout>
  );
}

export default EditarDesafioAdmin;
