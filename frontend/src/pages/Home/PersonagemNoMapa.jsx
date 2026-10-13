import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AvatarPersonagem from "../../components/AvatarPersonagem";

// Velocidade da caminhada em "% da altura do mapa por segundo" — com o
// mapa atual, ir de um portal ao vizinho leva uns 2 s, em qualquer tamanho
// de tela (a distância é medida na proporção real da imagem).
const VELOCIDADE = 14;
// Teto pra viagens longas (ex: da estrada de início até o último portal).
const DURACAO_MAXIMA_MS = 4000;
// Mesma duração da animação home-viajante-entrar em Home.css.
const DURACAO_ENTRADA_MS = 550;

// Personagem do jogador andando pela estrada do mapa da Home, de ponto em
// ponto de `pontos` (ver trechoEntre em caminhoMapa.js), com o mesmo visual
// em camadas do resto do jogo. Ao chegar no último ponto, "entra" no portal
// e chama onChegar. Posicionado em % dentro de .home-mapa — nada de
// position: fixed (o .app-frame quebra coordenadas de viewport no desktop).
export default function PersonagemNoMapa({ pontos, itensEquipados, onChegar }) {
  const raizRef = useRef(null);
  const direcaoRef = useRef(null);
  const [entrando, setEntrando] = useState(false);
  // onChegar mais recente sem reiniciar a caminhada a cada render do pai.
  const onChegarRef = useRef(onChegar);
  useEffect(() => {
    onChegarRef.current = onChegar;
  }, [onChegar]);

  useLayoutEffect(() => {
    const raiz = raizRef.current;
    const mapa = raiz?.parentElement;
    if (!raiz || !mapa || pontos.length === 0) return undefined;

    // Proporção do mapa: converte o x (em % da largura) pra % da altura,
    // pra medir as distâncias na escala real da imagem.
    const { width, height } = mapa.getBoundingClientRect();
    const escalaX = height > 0 ? width / height : 1;

    const trechos = [];
    let total = 0;
    for (let i = 1; i < pontos.length; i++) {
      const a = pontos[i - 1];
      const b = pontos[i];
      const comprimento = Math.hypot((b.x - a.x) * escalaX, b.y - a.y);
      trechos.push({ a, b, inicio: total, comprimento });
      total += comprimento;
    }

    function posicionar(ponto, indo) {
      raiz.style.left = `${ponto.x}%`;
      raiz.style.top = `${ponto.y}%`;
      // O desenho olha pra esquerda: espelha quando anda pra direita.
      // Trecho quase vertical mantém o lado em que já estava.
      if (direcaoRef.current && Math.abs(indo ?? 0) > 0.05) {
        direcaoRef.current.style.transform = indo > 0 ? "scaleX(-1)" : "scaleX(1)";
      }
      // Acompanha o personagem quando a estrada sai da área visível (o mapa
      // é mais alto que a tela). "nearest" não mexe se ele já está à vista.
      raiz.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    let quadro = 0;
    let timerEntrada = 0;

    function chegar() {
      setEntrando(true);
      timerEntrada = window.setTimeout(() => onChegarRef.current?.(), DURACAO_ENTRADA_MS);
    }

    posicionar(pontos[0]);

    if (total === 0) {
      chegar();
    } else {
      const duracao = Math.min((total / VELOCIDADE) * 1000, DURACAO_MAXIMA_MS);
      let comeco = null;

      const passo = (agora) => {
        if (comeco === null) comeco = agora;
        const percorrido = Math.min((agora - comeco) / duracao, 1) * total;
        const trecho =
          trechos.find((t) => percorrido <= t.inicio + t.comprimento) ?? trechos[trechos.length - 1];
        const fracao = trecho.comprimento > 0 ? (percorrido - trecho.inicio) / trecho.comprimento : 1;

        posicionar(
          {
            x: trecho.a.x + (trecho.b.x - trecho.a.x) * fracao,
            y: trecho.a.y + (trecho.b.y - trecho.a.y) * fracao,
          },
          trecho.b.x - trecho.a.x
        );

        if (percorrido < total) {
          quadro = requestAnimationFrame(passo);
        } else {
          chegar();
        }
      };
      quadro = requestAnimationFrame(passo);
    }

    return () => {
      cancelAnimationFrame(quadro);
      window.clearTimeout(timerEntrada);
    };
  }, [pontos]);

  return (
    <div
      ref={raizRef}
      className={`home-viajante ${entrando ? "home-viajante--entrando" : ""}`}
      aria-hidden="true"
    >
      <div ref={direcaoRef} className="home-viajante-direcao">
        <AvatarPersonagem itensEquipados={itensEquipados} className="home-viajante-avatar" alt="" />
      </div>
    </div>
  );
}
