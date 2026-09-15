import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import "./AdminLoginHistorico.css";

function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AdminLoginHistorico() {
  const navigate = useNavigate();
  // "busca" na URL permite chegar aqui já filtrado pelo e-mail de um
  // usuário específico (ver o botão "Ver logins" em AdminUsuarios.jsx) —
  // um link direto e compartilhável, não só um estado interno da tela.
  const [searchParams] = useSearchParams();

  const [termoBusca, setTermoBusca] = useState(searchParams.get("busca") || "");
  const [filtroSucesso, setFiltroSucesso] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");

    // Só espera (debounce) quando tem termo digitado — trocar de página ou
    // de filtro de status não precisa de atraso nenhum.
    const timer = setTimeout(
      () => {
        api
          .get("/admin/login-historico", {
            params: {
              busca: termoBusca.trim() || undefined,
              sucesso: filtroSucesso || undefined,
              pagina,
            },
          })
          .then((res) => ativo && setDados(res.data))
          .catch(() => ativo && setErro("Não foi possível carregar o histórico de login."))
          .finally(() => ativo && setCarregando(false));
      },
      termoBusca ? 350 : 0
    );

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [termoBusca, filtroSucesso, pagina]);

  return (
    <MainLayout titulo="Histórico de Login">
      <div className="admin-login-hist">
        <BotaoPixel
          className="admin-login-hist-voltar"
          classeMiolo="admin-login-hist-voltar-miolo"
          onClick={() => navigate("/admin")}
        >
          ← Painel
        </BotaoPixel>

        <div className="admin-login-hist-toolbar">
          <input
            type="text"
            className="admin-login-hist-busca"
            placeholder="Buscar por nome ou e-mail…"
            value={termoBusca}
            onChange={(e) => {
              setTermoBusca(e.target.value);
              setPagina(1);
            }}
          />

          <select
            className="admin-login-hist-filtro"
            value={filtroSucesso}
            onChange={(e) => {
              setFiltroSucesso(e.target.value);
              setPagina(1);
            }}
          >
            <option value="">Sucesso e falha</option>
            <option value="true">Só sucesso</option>
            <option value="false">Só falha</option>
          </select>
        </div>

        {carregando ? (
          <p className="admin-login-hist-mensagem">Carregando…</p>
        ) : erro ? (
          <p className="admin-login-hist-mensagem admin-login-hist-mensagem--erro">{erro}</p>
        ) : !dados || dados.registros.length === 0 ? (
          <p className="admin-login-hist-mensagem">Nenhuma tentativa de login encontrada.</p>
        ) : (
          <>
            <div className="admin-login-hist-tabela-wrap">
              <table className="admin-login-hist-tabela">
                <thead>
                  <tr>
                    <th>Data/hora</th>
                    <th>Usuário</th>
                    <th>IP</th>
                    <th>Status</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.registros.map((registro) => (
                    <tr key={registro.id}>
                      <td>{formatarDataHora(registro.criadoEm)}</td>
                      <td>
                        <div className="admin-login-hist-usuario">
                          <span>{registro.nomeUsuario || "—"}</span>
                          <span className="admin-login-hist-email">{registro.emailTentado}</span>
                        </div>
                      </td>
                      <td>{registro.ip || "—"}</td>
                      <td>
                        <span
                          className={`admin-login-hist-selo ${
                            registro.sucesso
                              ? "admin-login-hist-selo--sucesso"
                              : "admin-login-hist-selo--falha"
                          }`}
                        >
                          {registro.sucesso ? "Sucesso" : "Falha"}
                        </span>
                      </td>
                      <td>{registro.motivoFalha || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-login-hist-paginacao">
              <button
                type="button"
                className="admin-login-hist-pagina-botao"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                ‹ Anterior
              </button>
              <span className="admin-login-hist-pagina-texto">
                Página {dados.pagina} de {dados.totalPaginas} • {dados.total} registro(s)
              </span>
              <button
                type="button"
                className="admin-login-hist-pagina-botao"
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

export default AdminLoginHistorico;
