import { useEffect, useState } from "react";

// Detecta se a tela está no tamanho "mobile" (largura <= breakpoint) via
// matchMedia — usado pelo MainLayout pra decidir entre o rodapé de ícones
// (mobile) e a sidebar + coluna direita (desktop).
//
// Não usa navigator.userAgent de propósito: userAgent não reflete o
// tamanho real da janela (redimensionar uma janela de desktop até ficar
// estreita continua "desktop" pelo userAgent) e não dispara evento nenhum
// quando a janela muda de tamanho — só matchMedia reage em tempo real a
// redimensionamento/rotação, sem precisar recarregar a página.
//
// O estado inicial já vem do matchMedia (não de um valor fixo corrigido
// depois em useEffect), pra não piscar o layout errado no primeiro render.
export function useIsMobile(breakpoint = 768) {
  const consulta = `(max-width: ${breakpoint}px)`;
  const [ehMobile, setEhMobile] = useState(() => window.matchMedia(consulta).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(consulta);
    setEhMobile(mediaQueryList.matches);

    function aoMudar(evento) {
      setEhMobile(evento.matches);
    }

    // addEventListener("change") só dispara quando o resultado da consulta
    // realmente muda (cruzou o breakpoint) — bem mais barato que ouvir
    // "resize" da window e recalcular a cada pixel arrastado.
    mediaQueryList.addEventListener("change", aoMudar);
    return () => mediaQueryList.removeEventListener("change", aoMudar);
  }, [consulta]);

  return ehMobile;
}
