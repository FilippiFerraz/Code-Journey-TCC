// Formata segundos como "m:ss" (ex: 75 -> "1:15") — usado no cronômetro das
// telas de desafio (ver hooks/useCronometro.js).
export function formatarTempo(segundosTotais) {
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = segundosTotais % 60;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}
