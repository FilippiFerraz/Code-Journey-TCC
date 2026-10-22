// Complemento da linha "+N XP • Tempo..." das telas de vitória: as moedas
// ganhas pra Lojinha do Mago e o aviso do Elixir do Sábio, quando ele dobrou
// o XP (campos moedasGanhas/elixirUsado de POST /api/progresso).
export function textoMoedasElixir(resultado) {
  let texto = "";
  if (resultado?.moedasGanhas > 0) texto += ` • +${resultado.moedasGanhas} de ouro`;
  if (resultado?.elixirUsado) texto += " • Elixir do Sábio: XP x2!";
  return texto;
}
