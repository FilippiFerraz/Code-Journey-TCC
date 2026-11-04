import BotaoPixel from "./BotaoPixel";
import "./AvisoSalvamento.css";

// Aviso no painel de vitória enquanto a vitória não está salva no servidor
// (ver hooks/useSalvarVitoria.js). Some quando o salvamento é confirmado.
export default function AvisoSalvamento({ salvamento, onRefazer }) {
  const { estado, mensagem, tentarDeNovo } = salvamento;
  if (estado === "salvo" || estado === "parado") return null;

  if (estado === "salvando") {
    return (
      <p className="aviso-salvamento" role="status">
        Salvando sua vitória...
      </p>
    );
  }

  if (estado === "falhou") {
    return (
      <div className="aviso-salvamento aviso-salvamento--erro" role="alert">
        <p>Não consegui salvar sua vitória: {mensagem}</p>
        <BotaoPixel className="aviso-salvamento-botao" classeMiolo="aviso-salvamento-botao-miolo" onClick={tentarDeNovo}>
          TENTAR SALVAR DE NOVO
        </BotaoPixel>
      </div>
    );
  }

  // recusado: o desafio mudou no servidor — a vitória desta tela não vale
  return (
    <div className="aviso-salvamento aviso-salvamento--erro" role="alert">
      <p>O mago não confirmou esta resposta — o desafio pode ter sido atualizado. Refaça o desafio para salvar a vitória.</p>
      <BotaoPixel className="aviso-salvamento-botao" classeMiolo="aviso-salvamento-botao-miolo" onClick={onRefazer}>
        REFAZER DESAFIO
      </BotaoPixel>
    </div>
  );
}
