import { useState } from "react";
import api from "../services/api";
import { APARENCIAS, APARENCIA_PADRAO } from "../data/spritesPersonagem";
import { definirAparenciaPropria } from "../hooks/usePersonagemAvatar";
import AvatarPersonagem from "./AvatarPersonagem";
import BotaoPixel from "./BotaoPixel";

// Escolha da aparência do herói. Abre sozinha na Home no primeiro acesso
// (Personagem.aparencia ainda null, antes do tutorial) — sem `onFechar`,
// não dá pra pular — e pelo botão "Alterar aparência" em EditarPersonagem.
//
// Salva em PUT /api/personagem e avisa os outros <AvatarPersonagem> do
// jogador logado (definirAparenciaPropria) antes de chamar onConcluir.
// As opções aparecem sem equipamento: com elmo e armadura, as quatro
// ficariam quase iguais.
export default function EscolherAparencia({ aparenciaAtual, onConcluir, onFechar }) {
  const primeiraEscolha = !onFechar;
  const [selecionada, setSelecionada] = useState(aparenciaAtual ?? (primeiraEscolha ? null : APARENCIA_PADRAO));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function confirmar() {
    if (!selecionada || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await api.put("/personagem", { aparencia: selecionada });
      definirAparenciaPropria(selecionada);
      onConcluir(selecionada);
    } catch {
      setErro("Não foi possível salvar sua escolha. Tente de novo.");
      setSalvando(false);
    }
  }

  return (
    <div className="aparencia-overlay" role="dialog" aria-modal="true" aria-labelledby="aparencia-titulo">
      <div className="aparencia-painel">
        {onFechar && (
          <BotaoPixel
            className="aparencia-fechar"
            classeMiolo="aparencia-fechar-miolo"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar sem alterar"
          >
            <i className="hn hn-times" aria-hidden="true" />
          </BotaoPixel>
        )}

        <h2 id="aparencia-titulo" className="aparencia-titulo">
          Escolha a aparência do seu herói
        </h2>
        <p className="aparencia-subtitulo">
          {primeiraEscolha ? "para entrar na jornada do código" : "Você pode trocar quando quiser."}
        </p>

        <div className="aparencia-opcoes" role="radiogroup" aria-label="Aparências do herói">
          {APARENCIAS.map((aparencia, i) => {
            const marcada = selecionada === aparencia.id;
            return (
              <button
                key={aparencia.id}
                type="button"
                role="radio"
                aria-checked={marcada}
                aria-label={`${aparencia.nome}, opção ${i + 1}`}
                className={`aparencia-opcao ${marcada ? "aparencia-opcao--marcada" : ""}`}
                onClick={() => setSelecionada(aparencia.id)}
                disabled={salvando}
              >
                <AvatarPersonagem aparencia={aparencia.id} className="aparencia-avatar" alt="" />
                <span className="aparencia-nome">{aparencia.nome}</span>
                {marcada && <i className="hn hn-check-circle-solid aparencia-marca" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {erro && <p className="aparencia-erro">{erro}</p>}

        <BotaoPixel
          className="aparencia-confirmar"
          classeMiolo="aparencia-confirmar-miolo"
          onClick={confirmar}
          disabled={!selecionada || salvando}
        >
          {salvando ? "Salvando..." : primeiraEscolha ? "Entrar na jornada" : "Salvar aparência"}
        </BotaoPixel>
      </div>
    </div>
  );
}
