// Ícone da biblioteca pixelarticons (SVG em pixel art numa grade 24x24) no
// tamanho e na cor do texto em volta — igual aos ícones .hn da
// @hackernoon/pixel-icon-library usados no resto do app. Usado onde a
// hackernoon não tem o desenho (espada, escudo, poção, presente...).
//
// Uso: import { Sword } from "pixelarticons/react/Sword.js";
//      <IconePixel icone={Sword} className="..." />
// (importar cada ícone pelo próprio arquivo mantém só os usados no pacote)
export default function IconePixel({ icone: Icone, className = "", titulo, ...props }) {
  return (
    <Icone
      width="1em"
      height="1em"
      className={`icone-pixel ${className}`}
      focusable="false"
      {...(titulo ? { role: "img", "aria-label": titulo } : { "aria-hidden": "true" })}
      {...props}
    />
  );
}
