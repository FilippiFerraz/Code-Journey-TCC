import { useState } from "react";
import BotaoPixel from "../../../components/BotaoPixel";

// Mesmo limite do backend (TAMANHO_MAXIMO_RESPOSTA em ia.service.js).
const TAMANHO_MAXIMO_RESPOSTA = 2000;

// Resposta escrita corrigida pela IA — mesmo visual de ResolverDesafio.jsx
// (renderRespostaDissertativa). Enquanto a IA corrige, a página mostra o
// painel "O mago está avaliando". Resposta: { respostaTexto }.
export default function Dissertativa({ travado, responder, limparErro }) {
  const [texto, setTexto] = useState("");

  return (
    <>
      <div className="dissertativa-area">
        <textarea
          className="dissertativa-textarea"
          placeholder="Escreva sua resposta com suas próprias palavras..."
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            limparErro();
          }}
          disabled={travado}
          rows={5}
          maxLength={TAMANHO_MAXIMO_RESPOSTA}
        />
      </div>

      <BotaoPixel
        className="botao-avante"
        classeMiolo="botao-avante-miolo"
        onClick={() => responder({ respostaTexto: texto })}
        disabled={!texto.trim() || travado}
      >
        ATACAR
      </BotaoPixel>
    </>
  );
}
