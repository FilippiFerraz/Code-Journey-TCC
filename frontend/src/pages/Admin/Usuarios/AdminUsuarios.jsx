import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import "./AdminUsuarios.css";

function formatarData(dataIso) {
  if (!dataIso) return "—";
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

function AdminUsuarios() {
  const navigate = useNavigate();

  // Id do admin logado — só pra desabilitar as ações numa linha que seria a
  // própria conta dele (o backend já recusa isso, mas evita um clique que
  // só vai voltar com erro).
  const [meuId, setMeuId] = useState(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [processandoId, setProcessandoId] = useState(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    api
      .get("/perfil")
      .then((res) => setMeuId(res.data.id))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");

    // Só espera (debounce) quando tem termo digitado — trocar de página não
    // precisa de atraso nenhum.
    const timer = setTimeout(
      () => {
        api
          .get("/admin/usuarios", { params: { busca: termoBusca.trim() || undefined, pagina } })
          .then((res) => ativo && setDados(res.data))
          .catch(() => ativo && setErro("Não foi possível carregar os usuários."))
          .finally(() => ativo && setCarregando(false));
      },
      termoBusca ? 350 : 0
    );

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [termoBusca, pagina]);

  async function alternarRole(usuario) {
    const novoRole = usuario.role === "administrador" ? "jogador" : "administrador";
    const identificacao = usuario.nome || usuario.email;
    const confirmado =
      novoRole === "administrador"
        ? window.confirm(`Tornar "${identificacao}" administrador?`)
        : window.confirm(`Remover o acesso de administrador de "${identificacao}"?`);
    if (!confirmado) return;

    setProcessandoId(usuario.id);
    try {
      await api.put(`/admin/usuarios/${usuario.id}/role`, { role: novoRole });
      setDados((atual) => ({
        ...atual,
        usuarios: atual.usuarios.map((u) => (u.id === usuario.id ? { ...u, role: novoRole } : u)),
      }));
    } catch (err) {
      window.alert(err.response?.data?.erro || "Não foi possível alterar o papel deste usuário.");
    } finally {
      setProcessandoId(null);
    }
  }

  async function alternarAtivo(usuario) {
    const novoAtivo = !usuario.ativo;
    const identificacao = usuario.nome || usuario.email;
    const confirmado = novoAtivo
      ? window.confirm(`Reativar a conta de "${identificacao}"?`)
      : window.confirm(
          `Desativar a conta de "${identificacao}"? Ela deixa de conseguir entrar no sistema até ser reativada.`
        );
    if (!confirmado) return;

    setProcessandoId(usuario.id);
    try {
      await api.put(`/admin/usuarios/${usuario.id}/ativo`, { ativo: novoAtivo });
      setDados((atual) => ({
        ...atual,
        usuarios: atual.usuarios.map((u) => (u.id === usuario.id ? { ...u, ativo: novoAtivo } : u)),
      }));
    } catch (err) {
      window.alert(err.response?.data?.erro || "Não foi possível alterar o status deste usuário.");
    } finally {
      setProcessandoId(null);
    }
  }

  // Bem mais destrutivo que promover/desativar — não tem como desfazer, e
  // some com progresso de verdade (desafios, itens, XP). Por isso o
  // window.confirm de 1 clique das outras ações não basta aqui: exige
  // digitar o nome/e-mail do usuário, igual "type to confirm" de painéis
  // de admin por aí.
  async function resetarProgresso(usuario) {
    const identificacao = usuario.nome || usuario.email;
    const digitado = window.prompt(
      `Isso apaga TODO o progresso de "${identificacao}" — desafios concluídos, itens do inventário, baús abertos e XP. A conta continua existindo, mas o jogo dele volta pro zero. Não tem como desfazer.\n\nDigite o nome ou e-mail dele pra confirmar:`
    );
    if (digitado === null) return; // cancelou

    const digitadoNormalizado = digitado.trim().toLowerCase();
    const confere =
      (usuario.nome && digitadoNormalizado === usuario.nome.toLowerCase()) ||
      (usuario.email && digitadoNormalizado === usuario.email.toLowerCase());
    if (!confere) {
      window.alert("Confirmação não bateu com o nome/e-mail do usuário. Nada foi alterado.");
      return;
    }

    setProcessandoId(usuario.id);
    try {
      const res = await api.post(`/admin/usuarios/${usuario.id}/resetar-progresso`);
      setDados((atual) => ({
        ...atual,
        usuarios: atual.usuarios.map((u) =>
          u.id === usuario.id ? { ...u, xpTotal: res.data.xpTotal } : u
        ),
      }));
      window.alert(`Progresso de "${identificacao}" reiniciado.`);
    } catch (err) {
      window.alert(
        err.response?.data?.erro || "Não foi possível reiniciar o progresso deste usuário."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  // Baixa os mesmos usuários da busca atual como planilha .xlsx. Precisa
  // passar pelo axios (não um <a href> direto) pra ir com o header
  // Authorization — é assim que a rota, protegida por autenticar, aceita a
  // requisição.
  async function exportarXlsx() {
    setExportando(true);
    try {
      const res = await api.get("/admin/usuarios/exportar", {
        params: { busca: termoBusca.trim() || undefined },
        responseType: "blob",
      });

      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "usuarios.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Não foi possível exportar a planilha. Tente novamente.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <MainLayout titulo="Usuários">
      <div className="admin-usuarios">
        <BotaoPixel
          className="admin-usuarios-voltar"
          classeMiolo="admin-usuarios-voltar-miolo"
          onClick={() => navigate("/admin")}
        >
          ← Painel
        </BotaoPixel>

        <div className="admin-usuarios-toolbar">
          <input
            type="text"
            className="admin-usuarios-busca"
            placeholder="Buscar por nome ou e-mail…"
            value={termoBusca}
            onChange={(e) => {
              setTermoBusca(e.target.value);
              setPagina(1);
            }}
          />

          <button
            type="button"
            className="admin-usuarios-exportar"
            onClick={exportarXlsx}
            disabled={exportando}
          >
            {exportando ? (
              "Exportando…"
            ) : (
              <>
                <Download size={14} aria-hidden="true" /> Exportar XLSX
              </>
            )}
          </button>
        </div>

        {carregando ? (
          <p className="admin-usuarios-mensagem">Carregando…</p>
        ) : erro ? (
          <p className="admin-usuarios-mensagem admin-usuarios-mensagem--erro">{erro}</p>
        ) : !dados || dados.usuarios.length === 0 ? (
          <p className="admin-usuarios-mensagem">Nenhum usuário encontrado.</p>
        ) : (
          <>
            <div className="admin-usuarios-tabela-wrap">
              <table className="admin-usuarios-tabela">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Papel</th>
                    <th>Status</th>
                    <th>XP</th>
                    <th>Desde</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.usuarios.map((usuario) => {
                    const souEu = usuario.id === meuId;
                    const processando = processandoId === usuario.id;
                    const ehAdmin = usuario.role === "administrador";

                    return (
                      <tr
                        key={usuario.id}
                        className={!usuario.ativo ? "admin-usuarios-linha--inativo" : ""}
                      >
                        <td>{usuario.nome || "—"}</td>
                        <td>{usuario.email || "—"}</td>
                        <td>
                          <span
                            className={`admin-usuarios-selo ${ehAdmin ? "admin-usuarios-selo--admin" : ""}`}
                          >
                            {ehAdmin ? "Admin" : "Jogador"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`admin-usuarios-selo ${
                              usuario.ativo ? "admin-usuarios-selo--ativo" : "admin-usuarios-selo--inativo"
                            }`}
                          >
                            {usuario.ativo ? "Ativo" : "Desativado"}
                          </span>
                        </td>
                        <td>{usuario.xpTotal}</td>
                        <td>{formatarData(usuario.criadoEm)}</td>
                        <td className="admin-usuarios-acoes">
                          <button
                            type="button"
                            className="admin-usuarios-acao"
                            disabled={souEu || processando}
                            title={souEu ? "Você não pode alterar seu próprio papel" : undefined}
                            onClick={() => alternarRole(usuario)}
                          >
                            {ehAdmin ? "Remover admin" : "Promover"}
                          </button>
                          <button
                            type="button"
                            className="admin-usuarios-acao admin-usuarios-acao--perigo"
                            disabled={souEu || processando}
                            title={souEu ? "Você não pode desativar sua própria conta" : undefined}
                            onClick={() => alternarAtivo(usuario)}
                          >
                            {usuario.ativo ? "Desativar" : "Reativar"}
                          </button>
                          <button
                            type="button"
                            className="admin-usuarios-acao admin-usuarios-acao--aviso"
                            disabled={processando}
                            onClick={() => resetarProgresso(usuario)}
                          >
                            Reiniciar progresso
                          </button>
                          <button
                            type="button"
                            className="admin-usuarios-acao"
                            onClick={() =>
                              navigate(
                                `/admin/login-historico?busca=${encodeURIComponent(usuario.email)}`
                              )
                            }
                          >
                            Ver logins
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-usuarios-paginacao">
              <button
                type="button"
                className="admin-usuarios-pagina-botao"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                ‹ Anterior
              </button>
              <span className="admin-usuarios-pagina-texto">
                Página {dados.pagina} de {dados.totalPaginas} • {dados.total} usuário(s)
              </span>
              <button
                type="button"
                className="admin-usuarios-pagina-botao"
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

export default AdminUsuarios;
