import { Link } from "react-router-dom";

// Links para a Política de Privacidade e os Termos de Uso (LGPD — ver
// pages/Privacidade). Estilo em pages/Privacidade/Privacidade.css.
export default function LinksLegais({ className = "" }) {
  return (
    <nav className={`links-legais ${className}`} aria-label="Privacidade e termos">
      <Link to="/privacidade">Política de Privacidade</Link>
      <Link to="/termos">Termos de Uso</Link>
    </nav>
  );
}
