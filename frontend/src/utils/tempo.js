// Formata segundos como "m:ss" (ex: 75 -> "1:15") — usado no cronômetro das
// telas de desafio (ver hooks/useCronometro.js).
export function formatarTempo(segundosTotais) {
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = segundosTotais % 60;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

// Formata segundos por extenso, pra leitura (ex: 75 -> "1 minuto e 15
// segundos") — usado na tela de recompensa (RecompensaDesafio.jsx).
export function formatarDuracao(segundosTotais) {
  const total = Math.max(0, Math.round(segundosTotais));
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  const textoSegundos = `${segundos} ${segundos === 1 ? "segundo" : "segundos"}`;

  if (minutos === 0) return textoSegundos;
  const textoMinutos = `${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  return segundos === 0 ? textoMinutos : `${textoMinutos} e ${textoSegundos}`;
}
