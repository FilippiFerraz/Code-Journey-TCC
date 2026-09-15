import { useEffect, useState } from "react";

// Cronômetro em segundos usado nas telas de desafio (ResolverDesafio,
// DesafioChefe) pra medir o tempo de resolução — quanto menor o tempo, maior
// a pontuação (ver bonusVelocidade em backend/src/services/progresso.service.js).
//
// `ativo` liga/desliga a contagem sem perder o valor atual — cada tela decide
// quando pausar (ex: durante a animação de acerto/derrota, que não deveria
// contar contra o jogador). Devolve [segundos, reiniciar]; reiniciar() zera a
// contagem (ex: ao tentar de novo depois de uma derrota).
export function useCronometro(ativo) {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!ativo) return;
    const id = setInterval(() => setSegundos((atual) => atual + 1), 1000);
    return () => clearInterval(id);
  }, [ativo]);

  function reiniciar() {
    setSegundos(0);
  }

  return [segundos, reiniciar];
}
