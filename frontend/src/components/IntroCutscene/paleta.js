// Paleta limitada da cutscene (24 cores), no espírito do SNES/GBC: tudo o que
// é desenhado usa SÓ estas cores — nada de transparência nem degradê suave
// (os "degradês" são feitos com pontilhado, ver dither() em pixel.js).
//
// Cada cor tem uma letra/dígito, usado também nos mapas de sprite de
// sprites.js ("." = transparente).
export const P = {
  0: "#140c1c", // preto azulado (contornos)
  1: "#2a1238", // roxo noite
  2: "#5b2a86", // roxo
  3: "#9b3bd9", // ROXO FORTE (dragão e corrupção)
  4: "#d27cff", // lilás brilhante (magia)
  5: "#f4e4bc", // pergaminho claro
  6: "#e0c48c", // pergaminho
  7: "#b8955a", // pergaminho sombra
  8: "#4a2a1a", // madeira escura
  9: "#7a4626", // madeira
  a: "#a8683a", // madeira clara
  b: "#1e5a32", // verde floresta escuro
  c: "#3c8c3c", // verde
  d: "#78c850", // verde claro
  e: "#4a4e5e", // pedra escura
  f: "#7c8494", // pedra
  g: "#b8bcc8", // pedra clara / prata
  h: "#c8321e", // vermelho fogo
  i: "#f07820", // laranja fogo
  j: "#ffd23c", // amarelo / ouro
  k: "#5cb4f0", // céu azul
  l: "#a8e0ff", // céu claro
  m: "#f0b080", // pele
  n: "#fff8f0", // branco
  o: "#2c5cc8", // azul (roupas)
};
