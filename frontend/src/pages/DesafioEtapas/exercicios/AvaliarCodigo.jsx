import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import BotaoPixel from "../../../components/BotaoPixel";
import { tocarSom } from "../../../utils/sons";

// Quanto o cartão precisa ser arrastado pra contar como resposta, e quanto
// tempo ele leva pra "voar" pra fora — mesmos valores de ResolverDesafio.jsx.
const LIMIAR_ARRASTE = 90;
const DURACAO_SAIDA_MS = 260;

// Avaliar código ao estilo Tinder — mesmo visual e mecânica de
// ResolverDesafio.jsx (renderAvaliarCodigo): direita = CERTO, esquerda =
// ERRADO. Cada cartão é conferido no servidor na hora (verificar), então
// errar um cartão tira vida e o jogador tenta o MESMO cartão de novo. No
// último acerto, a etapa inteira vai pra POST /api/progresso
// ({ classificacoes }), que revalida tudo.
export default function AvaliarCodigo({ etapa, travado, verificar, responder, sofrerGolpe, limparErro }) {
  const [indice, setIndice] = useState(0);
  const [arrasteX, setArrasteX] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [solto, setSolto] = useState(null); // null | "certo" | "errado"
  const [aguardandoProximo, setAguardandoProximo] = useState(false);
  const [conferindo, setConferindo] = useState(false);
  const [classificacoes, setClassificacoes] = useState([]);
  const origemRef = useRef(0);

  const carta = etapa.cartas[indice];
  const bloqueado = travado || conferindo || solto;

  function iniciarArraste(e) {
    if (bloqueado) return;
    setArrastando(true);
    origemRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
    limparErro();
  }

  function moverArraste(e) {
    if (!arrastando) return;
    setArrasteX(e.clientX - origemRef.current);
  }

  function soltarArraste() {
    if (!arrastando) return;
    setArrastando(false);
    if (arrasteX > LIMIAR_ARRASTE) responderCartao(true);
    else if (arrasteX < -LIMIAR_ARRASTE) responderCartao(false);
    else setArrasteX(0);
  }

  function responderCartao(marcouCerto) {
    setSolto(marcouCerto ? "certo" : "errado");
    setConferindo(true);

    const espera = new Promise((resolve) => setTimeout(resolve, DURACAO_SAIDA_MS));
    Promise.all([verificar({ indiceCarta: indice, marcouCerto }), espera]).then(([correto]) => {
      setConferindo(false);
      setSolto(null);
      setArrasteX(0);
      if (correto === null) return; // falha de conexão: aviso já mostrado, cartão volta

      if (!correto) {
        sofrerGolpe();
        return;
      }

      const novas = [...classificacoes, marcouCerto];
      if (indice === etapa.cartas.length - 1) {
        responder({ classificacoes: novas });
      } else {
        tocarSom("acerto");
        setClassificacoes(novas);
        setAguardandoProximo(true);
      }
    });
  }

  function avancarCartao() {
    setAguardandoProximo(false);
    setIndice((i) => i + 1);
  }

  if (aguardandoProximo) {
    return (
      <>
        <div className="acerto-banner">
          <h2 className="acerto-titulo">Certo!</h2>
          <p className="acerto-fala">
            Cartão {indice + 1} de {etapa.cartas.length} avaliado corretamente. Siga para o próximo!
          </p>
        </div>
        <BotaoPixel className="botao-avante" classeMiolo="botao-avante-miolo" onClick={avancarCartao}>
          PRÓXIMO CARTÃO
        </BotaoPixel>
      </>
    );
  }

  const deslocamentoX = solto === "certo" ? 480 : solto === "errado" ? -480 : arrasteX;
  const opacidadeErrado = deslocamentoX < 0 ? Math.min(-deslocamentoX / LIMIAR_ARRASTE, 1) : 0;
  const opacidadeCerto = deslocamentoX > 0 ? Math.min(deslocamentoX / LIMIAR_ARRASTE, 1) : 0;

  return (
    <div className="avaliar-area">
      <span className="avaliar-progresso">
        Cartão {indice + 1} de {etapa.cartas.length}
      </span>

      <div className="avaliar-carta-wrapper">
        <span className="avaliar-selo avaliar-selo--errado" style={{ opacity: opacidadeErrado }}>
          <X size={22} strokeWidth={3} />
        </span>
        <span className="avaliar-selo avaliar-selo--certo" style={{ opacity: opacidadeCerto }}>
          <Check size={22} strokeWidth={3} />
        </span>

        <div
          className={`avaliar-carta ${solto ? `avaliar-carta--${solto}` : ""} ${arrastando ? "avaliar-carta--arrastando" : ""}`}
          style={{ transform: `translateX(${deslocamentoX}px) rotate(${deslocamentoX / 18}deg)` }}
          onPointerDown={iniciarArraste}
          onPointerMove={moverArraste}
          onPointerUp={soltarArraste}
          onPointerCancel={soltarArraste}
        >
          <code className="avaliar-carta-codigo">{carta.codigo}</code>
        </div>
      </div>

      <p className="avaliar-instrucao">
        Arraste para a direita se estiver <strong>certo</strong>, ou para a esquerda se estiver <strong>errado</strong>
      </p>
    </div>
  );
}
