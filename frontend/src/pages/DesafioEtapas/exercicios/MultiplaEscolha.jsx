import { useState } from "react";
import BotaoPixel from "../../../components/BotaoPixel";

// Múltipla escolha — mesmo visual de ResolverDesafio.jsx (renderOpcoes).
// Resposta: { opcaoId }, conferida pelo servidor.
export default function MultiplaEscolha({ etapa, travado, emErro, responder, limparErro }) {
  const [escolhida, setEscolhida] = useState(null);

  function escolher(id) {
    if (travado) return;
    setEscolhida(id);
    limparErro();
  }

  return (
    <>
      <div className="lista-opcoes">
        {etapa.opcoes.map((opcao) => {
          const estado = escolhida !== opcao.id ? "" : emErro ? "errada" : "selecionada";
          return (
            <BotaoPixel
              key={opcao.id}
              className={`opcao ${estado && `opcao--${estado}`}`}
              classeMiolo={`opcao-miolo ${estado && `opcao-miolo--${estado}`}`}
              onClick={() => escolher(opcao.id)}
              disabled={travado}
            >
              <span className="opcao-letra">{opcao.id.toUpperCase()}</span>
              <code className="opcao-codigo">{opcao.texto}</code>
            </BotaoPixel>
          );
        })}
      </div>

      <BotaoPixel
        className="botao-avante"
        classeMiolo="botao-avante-miolo"
        onClick={() => responder({ opcaoId: escolhida })}
        disabled={!escolhida || travado}
      >
        AVANTE!
      </BotaoPixel>
    </>
  );
}
