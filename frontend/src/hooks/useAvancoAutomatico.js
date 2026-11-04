import { useEffect, useRef } from "react";

// Tempo que cada balão de fala fica na tela antes de passar sozinho pra
// próxima fala. Também usado pela barrinha de progresso do balão (ver
// BarraAvancoFala em components/ControlesFalas.jsx), pra os dois baterem.
export const INTERVALO_FALA_MS = 10000;

// Avança os balões de fala sozinho (DesafioIntro, DesafioIntroPocao e a
// abertura do DesafioChefe). `chave` é o índice da fala atual: quando o
// jogador avança na mão, a chave muda e a contagem recomeça do zero — a
// próxima fala sempre tem o tempo cheio pra ser lida. Com `ativo` false
// (ex: já mostrando o enunciado), não conta nada.
export function useAvancoAutomatico(ativo, chave, aoAvancar, intervaloMs = INTERVALO_FALA_MS) {
  // Guarda sempre a versão mais nova da função sem reiniciar o timer a cada
  // render (a tela recria aoAvancar toda vez que renderiza).
  const aoAvancarRef = useRef(aoAvancar);
  useEffect(() => {
    aoAvancarRef.current = aoAvancar;
  });

  useEffect(() => {
    if (!ativo) return;
    const timer = setTimeout(() => aoAvancarRef.current(), intervaloMs);
    return () => clearTimeout(timer);
  }, [ativo, chave, intervaloMs]);
}
