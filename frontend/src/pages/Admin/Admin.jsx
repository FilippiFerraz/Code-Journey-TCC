import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, NotebookPen, BarChart3, ClipboardList, Lock } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import BotaoPixel from "../../components/BotaoPixel";
import api from "../../services/api";
import "./Admin.css";

// Cada item ganha sua própria tela numa parte do projeto — os que ainda não
// têm tela ficam visíveis mas desabilitados, mesmo padrão já usado em
// Configuracoes.jsx. "icone" é o componente do lucide-react (não uma
// instância) — só é renderizado como <item.icone /> lá embaixo.
const ITENS = [
  { id: "usuarios", icone: Users, rotulo: "Usuários cadastrados", rota: "/admin/usuarios" },
  { id: "desafios", icone: NotebookPen, rotulo: "Desafios e recompensas", rota: "/admin/desafios" },
  { id: "dashboards", icone: BarChart3, rotulo: "Dashboards", rota: "/admin/dashboard" },
  { id: "logs", icone: ClipboardList, rotulo: "Logs de alterações", rota: "/admin/logs" },
  { id: "login-historico", icone: Lock, rotulo: "Histórico de login", rota: "/admin/login-historico" },
];

function Admin() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  // O ícone na navegação (ver MainLayout/useEhAdministrador) já só aparece
  // pra quem parece admin, mas quem decide de verdade é o backend — bate
  // aqui em GET /api/admin/status (protegido por verificarAdmin) antes de
  // mostrar qualquer coisa. Sem acesso (403) ou deslogado (401), some pra
  // Home em vez de deixar a tela de admin vazia no ar.
  useEffect(() => {
    let ativo = true;

    api
      .get("/admin/status")
      .then(() => ativo && setAutorizado(true))
      .catch(() => ativo && navigate("/home", { replace: true }))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [navigate]);

  if (carregando) {
    return (
      <MainLayout titulo="Administração">
        <div className="admin-estado">Verificando acesso…</div>
      </MainLayout>
    );
  }

  if (!autorizado) return null; // navigate() já disparou, evita piscar o menu

  return (
    <MainLayout titulo="Administração">
      <div className="admin">
        <p className="admin-intro">
          Gestão de usuários, conteúdo dos desafios e métricas do sistema.
        </p>

        <div className="admin-menu">
          {ITENS.map((item) => (
            <BotaoPixel
              key={item.id}
              className="admin-botao"
              classeMiolo="admin-botao-miolo"
              onClick={() => item.rota && navigate(item.rota)}
              disabled={!item.rota}
            >
              <span className="admin-icone" aria-hidden="true">
                <item.icone size={22} />
              </span>
              <span className="admin-rotulo">{item.rotulo}</span>
              {!item.rota && <span className="admin-selo">em breve</span>}
            </BotaoPixel>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Admin;
