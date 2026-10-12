import { useState } from "react";
import BotaoPixel from "../../../components/BotaoPixel";

// Ordenar blocos — mesmo visual e mesmas formas de montar de
// ResolverDesafio.jsx (renderMontagemBlocos): tocar, arrastar (HTML5) e
// reordenar com ▲▼✕. Os blocos já vêm embaralhados da API.
// Resposta: { ordem: [id, ...] }, conferida pelo servidor.
export default function OrdenarBlocos({ etapa, travado, emErro, responder, limparErro }) {
  const blocosPorId = Object.fromEntries(etapa.blocos.map((b) => [b.id, b]));
  const [disponiveis, setDisponiveis] = useState(() => etapa.blocos.map((b) => b.id));
  const [resposta, setResposta] = useState([]);

  function moverParaResposta(id) {
    if (travado) return;
    setDisponiveis((atual) => atual.filter((x) => x !== id));
    setResposta((atual) => [...atual, id]);
    limparErro();
  }

  function removerDaResposta(id) {
    if (travado) return;
    setResposta((atual) => atual.filter((x) => x !== id));
    setDisponiveis((atual) => [...atual, id]);
  }

  function moverBloco(indice, delta) {
    if (travado) return;
    setResposta((atual) => {
      const alvo = indice + delta;
      if (alvo < 0 || alvo >= atual.length) return atual;
      const novo = [...atual];
      [novo[indice], novo[alvo]] = [novo[alvo], novo[indice]];
      return novo;
    });
  }

  function iniciarArraste(e, id) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function permitirSolto(e) {
    e.preventDefault();
  }

  function soltarNaResposta(e, indiceAlvo) {
    e.preventDefault();
    e.stopPropagation();
    if (travado) return;
    const id = e.dataTransfer.getData("text/plain");
    if (!blocosPorId[id]) return;
    setDisponiveis((atual) => atual.filter((x) => x !== id));
    setResposta((atual) => {
      const semId = atual.filter((x) => x !== id);
      const alvo = Math.min(indiceAlvo, semId.length);
      return [...semId.slice(0, alvo), id, ...semId.slice(alvo)];
    });
    limparErro();
  }

  function soltarNoPool(e) {
    e.preventDefault();
    if (travado) return;
    const id = e.dataTransfer.getData("text/plain");
    if (!blocosPorId[id]) return;
    setResposta((atual) => atual.filter((x) => x !== id));
    setDisponiveis((atual) => (atual.includes(id) ? atual : [...atual, id]));
  }

  return (
    <>
      <div className="blocos-area">
        <div className="blocos-secao">
          <span className="blocos-rotulo">Blocos disponíveis</span>
          <div className="blocos-pool" onDragOver={permitirSolto} onDrop={soltarNoPool}>
            {disponiveis.length === 0 && <span className="blocos-vazio">Todos os blocos já estão na resposta.</span>}
            {disponiveis.map((id) => (
              <button
                key={id}
                type="button"
                className="bloco-codigo"
                draggable={!travado}
                onDragStart={(e) => iniciarArraste(e, id)}
                onClick={() => moverParaResposta(id)}
                disabled={travado}
                aria-label={`Adicionar bloco: ${blocosPorId[id].codigo}`}
              >
                <code>{blocosPorId[id].codigo}</code>
              </button>
            ))}
          </div>
        </div>

        <div className="blocos-secao">
          <span className="blocos-rotulo">Sua resposta</span>
          <div
            className={`blocos-resposta ${emErro ? "blocos-resposta--erro" : ""}`}
            onDragOver={permitirSolto}
            onDrop={(e) => soltarNaResposta(e, resposta.length)}
          >
            {resposta.length === 0 && (
              <span className="blocos-vazio">Toque nos blocos acima para montar o código.</span>
            )}
            {resposta.map((id, indice) => (
              <div
                key={id}
                className="bloco-codigo bloco-codigo--colocado"
                draggable={!travado}
                onDragStart={(e) => iniciarArraste(e, id)}
                onDragOver={permitirSolto}
                onDrop={(e) => soltarNaResposta(e, indice)}
              >
                <code>{blocosPorId[id].codigo}</code>
                <span className="bloco-controles">
                  <button type="button" aria-label="Mover bloco para cima" onClick={() => moverBloco(indice, -1)} disabled={indice === 0 || travado}>
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="Mover bloco para baixo"
                    onClick={() => moverBloco(indice, 1)}
                    disabled={indice === resposta.length - 1 || travado}
                  >
                    ▼
                  </button>
                  <button type="button" aria-label="Remover bloco da resposta" onClick={() => removerDaResposta(id)} disabled={travado}>
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BotaoPixel
        className="botao-avante"
        classeMiolo="botao-avante-miolo"
        onClick={() => responder({ ordem: resposta })}
        disabled={resposta.length !== etapa.blocos.length || travado}
      >
        VERIFICAR
      </BotaoPixel>
    </>
  );
}
