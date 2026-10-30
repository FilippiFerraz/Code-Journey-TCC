// Falas da batalha que citam o inimigo, no singular ou — quando o desafio
// tem um grupo de inimigos (ver CENAS_PORTAL_2 em data/cenasPortal3.js) —
// no plural. Usadas por ResolverDesafio.jsx e DesafioEtapas.jsx.

export function falasGolpe(nome, grupo = false) {
  return [
    grupo
      ? `${nome} avançam juntos e te acertam! Sacuda a poeira e tente de novo.`
      : `${nome} avança e te acerta! Sacuda a poeira e tente de novo.`,
    "Mais um golpe! Respira, olha com calma — a resposta está aí.",
  ];
}

export function falaDerrota(nome, grupo = false) {
  return `${nome} ${grupo ? "te derrubaram" : "te derrubou"} desta vez... mas todo herói cai antes de aprender o golpe. Levante e tente novamente!`;
}

export function tituloDerrotado(nome, grupo = false) {
  return `${nome} ${grupo ? "derrotados" : "derrotado"}!`;
}

export function falaGolpeCerteiro(nome, grupo = false) {
  return grupo ? `Golpe certeiro! ${nome} sentiram o impacto!` : `Golpe certeiro no ${nome}!`;
}
