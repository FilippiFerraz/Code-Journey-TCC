import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import "./AdminLogs.css";

// Ícone (nome do ícone pixelado, ver @hackernoon/pixel-icon-library) +
// rótulo amigável por tipo de ação — bate com os valores gravados em
// log.service.js::registrarLog (desafio.service.js e admin.service.js).
const ACOES_INFO = {
  "desafio.atualizar": { icone: "pencil", rotulo: "Editou um desafio" },
  "usuario.role": { icone: "badge-check", rotulo: "Alterou papel de usuário" },
  "usuario.ativo": { icone: "bolt", rotulo: "Ativou/desativou conta" },
  "usuario.resetarProgresso": { icone: "refresh", rotulo: "Reiniciou progresso de usuário" },
};

function infoAcao(acao) {
  return ACOES_INFO[acao] || { icone: "clipboard", rotulo: acao };
}

function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarValorDiff(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

function AdminLogs() {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(1);
  const [filtroAcao, setFiltroAcao] = useState("");
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [expandidoId, setExpandidoId] = useState(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");

    api
      .get("/admin/logs", { params: { pagina, acao: filtroAcao || undefined } })
      .then((res) => ativo && setDados(res.data))
      .catch(() => ativo && setErro("Não foi possível carregar os logs."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [pagina, filtroAcao]);

  return (
    <MainLayout titulo="Logs">
      <div className="admin-logs">
        <BotaoPixel
          className="admin-logs-voltar"
          classeMiolo="admin-logs-voltar-miolo"
          onClick={() => navigate("/admin")}
        >
          ← Painel
        </BotaoPixel>

        <select
          className="admin-logs-filtro"
          value={filtroAcao}
          onChange={(e) => {
            setFiltroAcao(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todas as ações</option>
          {Object.entries(ACOES_INFO).map(([valor, info]) => (
            <option key={valor} value={valor}>
              {info.rotulo}
            </option>
          ))}
        </select>

        {carregando ? (
          <p className="admin-logs-mensagem">Carregando…</p>
        ) : erro ? (
          <p className="admin-logs-mensagem admin-logs-mensagem--erro">{erro}</p>
        ) : !dados || dados.logs.length === 0 ? (
          <p className="admin-logs-mensagem">Nenhum log registrado ainda.</p>
        ) : (
          <>
            <div className="admin-logs-lista">
              {dados.logs.map((log) => {
                const info = infoAcao(log.acao);
                const temDetalhe = log.alteracoes && Object.keys(log.alteracoes).length > 0;
                const expandido = expandidoId === log.id;

                return (
                  <div className="admin-logs-item" key={log.id}>
                    <div className="admin-logs-item-topo">
                      <span className="admin-logs-item-icone" aria-hidden="true">
                        <i className={`hn hn-${info.icone}`}></i>
                      </span>
                      <div className="admin-logs-item-corpo">
                        <p className="admin-logs-item-descricao">{log.descricao || info.rotulo}</p>
                        <p className="admin-logs-item-meta">
                          {log.nomeUsuario || "—"} ({log.role}) • {formatarDataHora(log.criadoEm)}
                        </p>
                      </div>
                    </div>

                    {temDetalhe && (
                      <>
                        <button
                          type="button"
                          className="admin-logs-item-expandir"
                          onClick={() => setExpandidoId(expandido ? null : log.id)}
                        >
                          {expandido ? "Ocultar detalhes ▲" : "Ver detalhes ▼"}
                        </button>

                        {expandido && (
                          <div className="admin-logs-diff-wrap">
                            <table className="admin-logs-diff">
                              <thead>
                                <tr>
                                  <th>Campo</th>
                                  <th>De</th>
                                  <th>Para</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(log.alteracoes).map(([campo, valores]) => (
                                  <tr key={campo}>
                                    <td>{campo}</td>
                                    <td>{formatarValorDiff(valores.de)}</td>
                                    <td>{formatarValorDiff(valores.para)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="admin-logs-paginacao">
              <button
                type="button"
                className="admin-logs-pagina-botao"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                ‹ Anterior
              </button>
              <span className="admin-logs-pagina-texto">
                Página {dados.pagina} de {dados.totalPaginas} • {dados.total} registro(s)
              </span>
              <button
                type="button"
                className="admin-logs-pagina-botao"
                disabled={pagina >= dados.totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima ›
              </button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default AdminLogs;
