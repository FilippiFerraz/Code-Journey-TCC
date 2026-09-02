import "../styles/botaoPixel.css";

// Botão com o recorte "escada" pixelado (mesma técnica do botão "DESAFIO N"
// em Desafios.jsx): duas camadas com o mesmo clip-path — a externa faz de
// moldura, a interna ("miolo") de preenchimento — dando uma borda em
// degraus de jogo 2D em vez de cantos arredondados suaves.
//
// `className` estiliza a moldura (cor de fundo, largura...); `classeMiolo`
// estiliza o preenchimento (gradiente, texto...) — cada tela define essas
// cores nas próprias folhas de estilo, só a geometria vem daqui. `as`
// troca o elemento raiz (ex: "a" pra virar link) quando não for um botão
// de verdade. `extra` renderiza algo como irmão do miolo, FORA do recorte
// pixelado — útil pra um tooltip posicionado fora da caixa do botão, que
// senão também seria cortado em degraus junto com o resto.
export default function BotaoPixel({
  as: Componente = "button",
  className = "",
  classeMiolo = "",
  children,
  extra,
  ...props
}) {
  return (
    <Componente className={`botao-pixel ${className}`} {...props}>
      <span className={`botao-pixel-miolo ${classeMiolo}`}>{children}</span>
      {extra}
    </Componente>
  );
}
