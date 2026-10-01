import { useNavigate } from "react-router-dom";
import { Users, NotebookPen, BarChart3, ClipboardList, Lock } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import BotaoPixel from "../../components/BotaoPixel";
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

  // O acesso de administrador já foi conferido em GET /api/admin/status
  // antes desta tela abrir (RotaAdmin em components/Rotas.jsx, que cobre
  // todas as telas /admin/*).
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
