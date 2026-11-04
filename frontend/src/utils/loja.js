// Complemento da linha "+N XP • Tempo..." das telas de vitória: as moedas
// ganhas pra Lojinha do Mago, o aviso do Elixir do Sábio, quando ele dobrou
// o XP, e o bônus do modo Guerreiro (campos moedasGanhas/elixirUsado/
// bonusDificuldade/multiplicadorXp de POST /api/progresso).
export function textoMoedasElixir(resultado) {
  let texto = "";
  if (resultado?.moedasGanhas > 0) texto += ` • +${resultado.moedasGanhas} de ouro`;
  if (resultado?.bonusDificuldade > 0) texto += ` • Modo Guerreiro: XP e ouro x${resultado.multiplicadorXp}!`;
  if (resultado?.elixirUsado) texto += " • Elixir do Sábio: XP x2!";
  return texto;
}
