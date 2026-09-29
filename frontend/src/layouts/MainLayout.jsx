import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/images/logo.png";
import { useEhAdministrador } from "../hooks/useEhAdministrador";
import { useIsMobile } from "../hooks/useIsMobile";
import "./MainLayout.css";

// Mesmo valor usado nas media queries de MainLayout.css — mantenha os dois
// alinhados se decidir ajustar o ponto de troca entre mobile e desktop.
const BREAKPOINT_MOBILE = 768;

function IconeInicio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="layout-nav-icon">
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
  );
}

function IconeRanking() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="layout-nav-icon">
      <path
        d="M8 21h8M12 17v4M17 5h2a1 1 0 0 1 1 1c0 2.5-1.5 4-3.2 4.3M7 5H5a1 1 0 0 0-1 1c0 2.5 1.5 4 3.2 4.3M7 5h10v3.5A5 5 0 0 1 12 13.5 5 5 0 0 1 7 8.5V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconePerfil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="layout-nav-icon">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Ainda sem SVG definitivo pra "editar personagem" — desenhado no mesmo
// estilo (traço, sem preenchimento) dos demais até existir um ícone próprio.
// Espada em diagonal com uma guarda cruzada perto do cabo.
function IconePersonagem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="layout-nav-icon">
      <path d="M19 4 5 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 12 10.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconeConfiguracoes() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="layout-nav-icon">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.2.9a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.2-.9-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.2-.9c.77.66 1.65 1.17 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2.6-1.5l2.2.9 2-3.4-1.9-1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeAdmin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="layout-nav-icon">
      <path
        d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12l1.8 1.8L14.5 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Itens usados tanto no rodapé (mobile) quanto na sidebar (desktop) — só a
// apresentação muda entre as duas telas (ver ItemNavegacao). "tutorialAlvo"
// vira o atributo data-tutorial-alvo, usado por TutorialHome.jsx pra
// posicionar as setas do tutorial guiado sobre o item certo.
const ITENS_NAVEGACAO = [
  { to: "/home", rotulo: "Início", tutorialAlvo: undefined, Icone: IconeInicio },
  { to: "/ranking", rotulo: "Ranking", tutorialAlvo: "ranking", Icone: IconeRanking },
  { to: "/perfil", rotulo: "Perfil", tutorialAlvo: "perfil", Icone: IconePerfil },
  {
    to: "/editar-personagem",
    rotulo: "Personagem",
    tutorialAlvo: undefined,
    Icone: IconePersonagem,
  },
  {
    to: "/configuracoes",
    rotulo: "Configurações",
    tutorialAlvo: "configuracoes",
    Icone: IconeConfiguracoes,
  },
];

const ITEM_ADMIN = {
  to: "/admin",
  rotulo: "Administração",
  tutorialAlvo: undefined,
  Icone: IconeAdmin,
};

// "footer" (mobile, só ícone) ou "sidebar" (desktop, ícone + texto). O
// estado ativo vem de fora (comparando useLocation().pathname), não do
// isActive nativo do NavLink, porque a mesma lista de itens alimenta as
// duas apresentações e o destaque visual precisa ser idêntico nas duas.
function ItemNavegacao({ item, ativo, variante }) {
  const Icone = item.Icone;

  return (
    <NavLink
      to={item.to}
      data-tutorial-alvo={item.tutorialAlvo}
      className={`layout-nav-item layout-nav-item--${variante} ${
        ativo ? "layout-nav-item-ativo" : ""
      }`}
    >
      <Icone />
      {variante === "sidebar" && <span className="layout-nav-item-texto">{item.rotulo}</span>}
    </NavLink>
  );
}

// No rodapé mobile, o ícone de início (casinha) fica centralizado entre os
// demais — mesmo padrão de apps que destacam a ação principal no meio da
// barra — em vez de na ponta. A sidebar do desktop mantém a ordem
// convencional (início primeiro), então essa reordenação só se aplica ao
// rodapé mobile.
function ordenarParaRodapeMobile(itens) {
  const inicio = itens.find((item) => item.to === "/home");
  const outros = itens.filter((item) => item.to !== "/home");
  if (!inicio) return itens;

  const meio = Math.floor(outros.length / 2);
  return [...outros.slice(0, meio), inicio, ...outros.slice(meio)];
}

function MainLayout({ titulo, children, buscaHeader }) {
  const ehAdministrador = useEhAdministrador();
  const ehMobile = useIsMobile(BREAKPOINT_MOBILE);
  const location = useLocation();

  const itens = ehAdministrador ? [...ITENS_NAVEGACAO, ITEM_ADMIN] : ITENS_NAVEGACAO;
  const itensRodapeMobile = ordenarParaRodapeMobile(itens);

  return (
    <div className="layout-container">
      {/* Cabeçalho — igual em mobile e desktop, exceto pelo slot central de
          busca: só quem passa a prop `buscaHeader` usa ele (hoje só a Home,
          e só na versão desktop — no mobile ela mesma decide manter a
          busca no corpo da página, ver Home.jsx). Em quem não passa nada,
          essa célula do grid fica vazia e o layout cai de volta pro mesmo
          resultado visual de antes (título à esquerda, logo à direita). */}
      <header className="layout-header">
        <h1 className="layout-header-titulo">{titulo}</h1>
        {/* Sempre renderizada (mesmo vazia) pra manter as 3 colunas do grid
            na ordem certa — sem isso, com só título+logo, o logo cairia na
            coluna do meio (1fr) em vez da direita quando ninguém passa
            buscaHeader. */}
        <div className="layout-header-busca">{buscaHeader}</div>
        <img src={logo} alt="Code Journey" className="layout-header-logo" />
      </header>
      <div className="layout-linha-gradiente" />

      {ehMobile ? (
        <>
          {/* Conteúdo da página (rolável) */}
          <main className="layout-conteudo">{children}</main>

          {/* Rodapé com navegação — só ícones */}
          <div className="layout-linha-gradiente" />
          <nav className="layout-footer">
            {itensRodapeMobile.map((item) => (
              <ItemNavegacao
                key={item.to}
                item={item}
                variante="footer"
                ativo={location.pathname === item.to}
              />
            ))}
          </nav>
        </>
      ) : (
        // Desktop, estilo Duolingo: sidebar fixa à esquerda (ícone + texto),
        // conteúdo central e coluna direita reservada pra widgets de
        // progresso (XP, ranking resumido, missão do dia — a preencher
        // depois). .layout-conteudo continua sendo a única área que rola.
        <div className="layout-corpo-desktop">
          <nav className="layout-sidebar">
            {itens.map((item) => (
              <ItemNavegacao
                key={item.to}
                item={item}
                variante="sidebar"
                ativo={location.pathname === item.to}
              />
            ))}
          </nav>

          <main className="layout-conteudo">{children}</main>

          <aside className="layout-coluna-direita">
            {/* TODO: widgets de XP, ranking resumido e missão do dia */}
            <div className="layout-widget-placeholder">
              <p className="layout-widget-placeholder-texto">
                Em breve: seu progresso, XP e missão do dia aparecem por aqui.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default MainLayout;
