// Gradientes de fundo que o jogador pode escolher pra tela de Perfil (ver
// EditarPerfil.jsx, seção "Cor de fundo do perfil"). Os ids precisam ficar
// em sincronia com FUNDOS_PERFIL_VALIDOS em
// backend/src/services/perfil.service.js.
//
// Escolhidos de propósito fora da faixa teal/roxo dos botões "Editar
// personagem"/"Editar perfil" e dos cabeçalhos roxo dos cards (ver
// Perfil.css) — nenhuma dessas cores compete com o fundo escolhido.
export const FUNDOS_PERFIL = [
  { id: "padrao", nome: "Padrão", gradiente: "#ffffff" },
  {
    id: "verde-esmeralda",
    nome: "Verde-esmeralda",
    gradiente: "linear-gradient(160deg, #1f8f5f 0%, #0c4028 100%)",
  },
  {
    id: "laranja-por-do-sol",
    nome: "Laranja pôr do sol",
    gradiente: "linear-gradient(160deg, #ff9142 0%, #c94e12 100%)",
  },
  {
    id: "vermelho-coral",
    nome: "Vermelho-coral",
    gradiente: "linear-gradient(160deg, #ff6b6b 0%, #b02e2e 100%)",
  },
  {
    id: "dourado",
    nome: "Dourado",
    gradiente: "linear-gradient(160deg, #f5c451 0%, #b8801a 100%)",
  },
  {
    id: "grafite",
    nome: "Grafite",
    gradiente: "linear-gradient(160deg, #4a5160 0%, #1c2027 100%)",
  },
  {
    id: "rosa-quartzo",
    nome: "Rosa-quartzo",
    gradiente: "linear-gradient(160deg, #ff8fb1 0%, #c94571 100%)",
  },
];

const FUNDO_PADRAO = FUNDOS_PERFIL[0];

export function resolverFundoPerfil(id) {
  return FUNDOS_PERFIL.find((fundo) => fundo.id === id) ?? FUNDO_PADRAO;
}
