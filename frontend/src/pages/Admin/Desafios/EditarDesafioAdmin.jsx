import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import EditorExercicio, { BotoesItem } from "./EditorExercicio";
import {
  TIPOS, modeloExercicio, mover, nomeDificuldade, nomePortal, rotuloTipo, tipoDoConteudo,
} from "./tiposDesafio";
import "./AdminDesafios.css";

// Tipos que podem ser escolhidos ao criar uma etapa nova.
const TIPOS_DE_ETAPA = Object.keys(TIPOS).filter((tipo) => tipo !== "etapas");

// Desafio.alternativas -> estado do formulário:
// - várias etapas (portal 3): { variasEtapas: true, etapas, resto }
// - etapa única: { variasEtapas: false, exercicio, eraLista } — a múltipla
//   escolha antiga (array puro) vira { tipo, opcoes } pra edição e volta a
//   ser array ao salvar (eraLista), que é o formato que o portal 1 espera.
function lerConteudo(alternativas) {
  if (alternativas?.tipo === "etapas" && Array.isArray(alternativas.etapas)) {
    const { etapas, ...resto } = alternativas;
    return { variasEtapas: true, etapas, resto };
  }
  if (Array.isArray(alternativas)) {
    return { variasEtapas: false, exercicio: { tipo: "multipla_escolha", opcoes: alternativas }, eraLista: true };
  }
  return { variasEtapas: false, exercicio: { ...alternativas, tipo: tipoDoConteudo(alternativas) }, eraLista: false };
}

function montarAlternativas(conteudo) {
  if (conteudo.variasEtapas) return { ...conteudo.resto, tipo: "etapas", etapas: conteudo.etapas };
  const { exercicio } = conteudo;
  if (conteudo.eraLista && exercicio.tipo === "multipla_escolha") return exercicio.opcoes;
  return exercicio;
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

  const [conteudo, setConteudo] = useState(null);
  // modo avançado: o conteúdo inteiro como JSON
  const [modoJson, setModoJson] = useState(false);
  const [json, setJson] = useState("");
  const [etapasAbertas, setEtapasAbertas] = useState(() => new Set());
  const [tipoNovaEtapa, setTipoNovaEtapa] = useState("multipla_escolha");

  const [itensCatalogo, setItensCatalogo] = useState([]);
  // A única recompensa personalizável de um desafio é um item de
  // equipamento. "" = o desafio dá só XP.
  const [itemRecompensaId, setItemRecompensaId] = useState("");

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
        setConteudo(lerConteudo(d.alternativas));
        setItemRecompensaId(d.itemRecompensaId ? String(d.itemRecompensaId) : "");
        setItensCatalogo(resItens.data);
      })
      .catch(() => ativo && setErroCarregar("Não foi possível carregar este desafio."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [desafioId]);

  const voltarParaLista = () =>
    navigate(cabecalho ? `/admin/desafios?portal=${cabecalho.mundoId}` : "/admin/desafios");

  // ---------- etapas (portal 3) ----------
  const etapas = conteudo?.variasEtapas ? conteudo.etapas : [];
  const alterarEtapas = (novas) => setConteudo((atual) => ({ ...atual, etapas: novas }));
  const alterarEtapa = (indice, nova) => alterarEtapas(etapas.map((e, i) => (i === indice ? nova : e)));

  function alternarEtapa(indice) {
    setEtapasAbertas((atual) => {
      const novo = new Set(atual);
      if (novo.has(indice)) novo.delete(indice);
      else novo.add(indice);
      return novo;
    });
  }

  function adicionarEtapa() {
    alterarEtapas([...etapas, { titulo: "", enunciado: "", ...modeloExercicio(tipoNovaEtapa) }]);
    setEtapasAbertas((atual) => new Set(atual).add(etapas.length));
  }

  function moverEtapa(indice, direcao) {
    alterarEtapas(mover(etapas, indice, direcao));
    // a etapa aberta acompanha a mudança de posição
    setEtapasAbertas((atual) => {
      const destino = indice + direcao;
      const novo = new Set();
      atual.forEach((i) => novo.add(i === indice ? destino : i === destino ? indice : i));
      return novo;
    });
  }

  function removerEtapa(indice) {
    const nome = etapas[indice].titulo || `Etapa ${indice + 1}`;
    if (!window.confirm(`Remover "${nome}"? Isso só vale depois de salvar.`)) return;
    alterarEtapas(etapas.filter((_, i) => i !== indice));
    setEtapasAbertas(new Set());
  }

  // ---------- modo JSON ----------
  function alternarModoJson() {
    setErro("");
    if (!modoJson) {
      setJson(JSON.stringify(montarAlternativas(conteudo), null, 2));
      setModoJson(true);
      return;
    }
    try {
      setConteudo(lerConteudo(JSON.parse(json)));
      setModoJson(false);
    } catch {
      setErro("O JSON está mal formatado — corrija antes de voltar pro formulário.");
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

    let alternativas;
    if (modoJson) {
      try {
        alternativas = JSON.parse(json);
      } catch {
        setErro("O JSON do conteúdo está mal formatado.");
        return;
      }
    } else {
      alternativas = montarAlternativas(conteudo);
    }

    const xpNumero = Number(xpConcedido);
    if (!Number.isInteger(xpNumero) || xpNumero < 0) {
      setErro("Informe um XP válido (número inteiro, 0 ou mais).");
      return;
    }

    try {
      setSalvando(true);

      // a validação completa do conteúdo (todos os tipos e etapas) é a do
      // backend — o erro dele já diz a etapa e o problema
      await api.put(`/admin/desafios/${desafioId}`, {
        titulo,
        enunciado,
        dica: dica || null,
        alternativas,
        xpConcedido: xpNumero,
        itemRecompensaId: itemRecompensaId ? Number(itemRecompensaId) : null,
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

  const tipoAtual = conteudo.variasEtapas ? "etapas" : conteudo.exercicio.tipo;

  return (
    <MainLayout titulo="Editar desafio">
      <div className="admin-desafios">
        <BotaoPixel
          className="admin-desafios-voltar"
          classeMiolo="admin-desafios-voltar-miolo"
          onClick={voltarParaLista}
        >
          <i className="hn hn-arrow-left" aria-hidden="true" /> Portal {cabecalho.mundoId}
        </BotaoPixel>

        <p className="admin-desafios-trilha-info">
          Portal {cabecalho.mundoId} — {nomePortal(cabecalho.mundoId)} • {nomeDificuldade(cabecalho.dificuldade)} •
          Desafio {cabecalho.numero}
          <span className="admin-desafios-tipo">
            <i className={`hn ${TIPOS[tipoAtual]?.icone ?? "hn-question"}`} aria-hidden="true" />
            {rotuloTipo(tipoAtual)}
            {conteudo.variasEtapas && ` (${etapas.length})`}
          </span>
        </p>

        {cabecalho.mundoId === 1 && (
          <p className="admin-desafios-aviso">
            <i className="hn hn-lightbulb" aria-hidden="true" /> As telas do Portal 1 ainda mostram o enunciado e as
            alternativas fixos no código do jogo. O que você salva aqui é o gabarito usado pelo servidor para corrigir
            as respostas — mantenha os dois iguais.
          </p>
        )}

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
                {conteudo.variasEtapas ? "Introdução do desafio" : "Enunciado"}
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
                className="admin-desafios-input admin-desafios-input--curto"
                value={xpConcedido}
                onChange={(e) => setXpConcedido(e.target.value)}
              />
            </div>
          </section>

          {/* ---------- Conteúdo do exercício ---------- */}
          <section className="admin-desafios-card">
            <header className="admin-desafios-card-topo admin-desafios-card-topo--acoes">
              <span>{conteudo.variasEtapas ? `Etapas (${etapas.length})` : `Exercício — ${rotuloTipo(tipoAtual)}`}</span>
              <button type="button" className="admin-desafios-modo" onClick={alternarModoJson}>
                {modoJson ? "Voltar ao formulário" : "Editar como JSON"}
              </button>
            </header>
            <div className="admin-desafios-card-corpo">
              {modoJson ? (
                <>
                  <p className="admin-desafios-dica">
                    Modo avançado: o conteúdo inteiro (campo "alternativas") como JSON.
                  </p>
                  <textarea
                    className="admin-desafios-textarea admin-desafios-json"
                    rows={20}
                    spellCheck={false}
                    value={json}
                    onChange={(e) => setJson(e.target.value)}
                  />
                </>
              ) : conteudo.variasEtapas ? (
                <>
                  <p className="admin-desafios-dica">
                    O jogador responde as etapas em ordem e só ganha o XP ao vencer todas. Reordenar ou remover etapas
                    afeta quem está no meio deste desafio.
                  </p>
                  {etapas.map((etapa, indice) => {
                    const aberta = etapasAbertas.has(indice);
                    const tipo = tipoDoConteudo(etapa);
                    return (
                      <div className={`admin-etapa${aberta ? " admin-etapa--aberta" : ""}`} key={indice}>
                        <div className="admin-etapa-topo">
                          <button
                            type="button"
                            className="admin-etapa-alternar"
                            onClick={() => alternarEtapa(indice)}
                            aria-expanded={aberta}
                          >
                            <span className="admin-etapa-numero">{indice + 1}</span>
                            <span className="admin-etapa-textos">
                              <strong>{etapa.titulo || "Etapa sem título"}</strong>
                              <small>
                                <i className={`hn ${TIPOS[tipo]?.icone ?? "hn-question"}`} aria-hidden="true" />{" "}
                                {rotuloTipo(tipo)}
                              </small>
                            </span>
                            <i className={`hn ${aberta ? "hn-chevron-up" : "hn-chevron-down"}`} aria-hidden="true" />
                          </button>
                          <BotoesItem
                            indice={indice}
                            total={etapas.length}
                            onMover={moverEtapa}
                            onRemover={removerEtapa}
                            rotuloRemover="Remover etapa"
                          />
                        </div>

                        {aberta && (
                          <div className="admin-etapa-corpo">
                            <label className="admin-desafios-label" htmlFor={`etapa${indice}-titulo`}>
                              Título da etapa
                            </label>
                            <input
                              id={`etapa${indice}-titulo`}
                              type="text"
                              className="admin-desafios-input"
                              value={etapa.titulo ?? ""}
                              onChange={(e) => alterarEtapa(indice, { ...etapa, titulo: e.target.value })}
                            />
                            <label className="admin-desafios-label" htmlFor={`etapa${indice}-enunciado`}>
                              Enunciado
                            </label>
                            <textarea
                              id={`etapa${indice}-enunciado`}
                              className="admin-desafios-textarea"
                              rows={3}
                              value={etapa.enunciado ?? ""}
                              onChange={(e) => alterarEtapa(indice, { ...etapa, enunciado: e.target.value })}
                            />
                            <label className="admin-desafios-label" htmlFor={`etapa${indice}-dica`}>
                              Dica (opcional)
                            </label>
                            <input
                              id={`etapa${indice}-dica`}
                              type="text"
                              className="admin-desafios-input"
                              value={etapa.dica ?? ""}
                              onChange={(e) =>
                                alterarEtapa(indice, { ...etapa, dica: e.target.value || undefined })
                              }
                            />
                            <EditorExercicio
                              exercicio={{ ...etapa, tipo }}
                              nome={`etapa${indice}`}
                              mostrarCodigo
                              onChange={(nova) => alterarEtapa(indice, nova)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="admin-etapa-nova">
                    <select
                      className="admin-desafios-input"
                      value={tipoNovaEtapa}
                      onChange={(e) => setTipoNovaEtapa(e.target.value)}
                      aria-label="Tipo da nova etapa"
                    >
                      {TIPOS_DE_ETAPA.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {rotuloTipo(tipo)}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="admin-desafios-adicionar" onClick={adicionarEtapa}>
                      + Adicionar etapa
                    </button>
                  </div>
                </>
              ) : (
                <EditorExercicio
                  exercicio={conteudo.exercicio}
                  nome="exercicio"
                  mostrarCodigo={tipoAtual === "dissertativa"}
                  onChange={(exercicio) => setConteudo((atual) => ({ ...atual, exercicio }))}
                />
              )}
            </div>
          </section>

          {/* ---------- Recompensa ---------- */}
          <section className="admin-desafios-card">
            <header className="admin-desafios-card-topo">Recompensa</header>
            <div className="admin-desafios-card-corpo">
              <label className="admin-desafios-label" htmlFor="item">
                Item de recompensa
              </label>
              <select
                id="item"
                className="admin-desafios-input"
                value={itemRecompensaId}
                onChange={(e) => setItemRecompensaId(e.target.value)}
              >
                <option value="">Nenhum — o desafio dá só XP</option>
                {itensCatalogo.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} ({item.tipo})
                  </option>
                ))}
              </select>
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
