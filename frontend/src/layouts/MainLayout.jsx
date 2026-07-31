import { NavLink } from "react-router-dom";
import logo from "../assets/images/logo.png";
import "./MainLayout.css";

function MainLayout({ titulo, children }) {
  return (
    <div className="layout-container">
      {/* Cabeçalho */}
      <header className="layout-header">
        <h1 className="layout-header-titulo">{titulo}</h1>
        <img src={logo} alt="Code Journey" className="layout-header-logo" />
      </header>
      <div className="layout-linha-gradiente" />

      {/* Conteúdo da página (rolável) */}
      <main className="layout-conteudo">{children}</main>

      {/* Rodapé com navegação */}
      <div className="layout-linha-gradiente" />
      <nav className="layout-footer">
        <NavLink
          to="/ranking"
          className={({ isActive }) =>
            `layout-footer-item ${isActive ? "layout-footer-item-ativo" : ""}`
          }
        >
          <svg viewBox="0 0 24 24" fill="none" className="layout-footer-icon">
            <path
              d="M8 21h8M12 17v4M17 5h2a1 1 0 0 1 1 1c0 2.5-1.5 4-3.2 4.3M7 5H5a1 1 0 0 0-1 1c0 2.5 1.5 4 3.2 4.3M7 5h10v3.5A5 5 0 0 1 12 13.5 5 5 0 0 1 7 8.5V5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </NavLink>

        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `layout-footer-item ${isActive ? "layout-footer-item-ativo" : ""}`
          }
        >
          <svg viewBox="0 0 24 24" fill="none" className="layout-footer-icon">
            <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </NavLink>

        <NavLink
          to="/home"
          className={({ isActive }) =>
            `layout-footer-item ${isActive ? "layout-footer-item-ativo" : ""}`
          }
        >
          <svg viewBox="0 0 24 24" fill="none" className="layout-footer-icon">
            <path
              d="M4 11.5 12 4l8 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </NavLink>

        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `layout-footer-item ${isActive ? "layout-footer-item-ativo" : ""}`
          }
        >
          <svg viewBox="0 0 24 24" fill="none" className="layout-footer-icon">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.2.9a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.2-.9-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.2-.9c.77.66 1.65 1.17 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2.6-1.5l2.2.9 2-3.4-1.9-1.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </NavLink>
      </nav>
    </div>
  );
}

export default MainLayout;