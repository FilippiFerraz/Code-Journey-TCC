import BotaoPixel from "./BotaoPixel";
import "./ConfirmarSairDesafio.css";

// Popup de confirmação mostrado quando o jogador tenta sair de um desafio
// (batalha normal ou de chefe) antes de terminar — compartilhado entre
// ResolverDesafio.jsx e DesafioChefe.jsx em vez de duplicado nos dois.
function ConfirmarSairDesafio({ onManterDesafio, onSairDesafio }) {
  return (
    <div className="confirmar-sair-overlay" onClick={onManterDesafio}>
      <div className="confirmar-sair-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirmar-sair-titulo">Sair do desafio?</h2>
        <p className="confirmar-sair-texto">
          Se você voltar agora vai perder o progresso desta tentativa e vai
          precisar recomeçar o desafio do zero mais tarde.
        </p>

        <div className="confirmar-sair-botoes">
          <BotaoPixel
            className="confirmar-sair-botao confirmar-sair-botao--manter"
            classeMiolo="confirmar-sair-botao-miolo"
            onClick={onManterDesafio}
          >
            Continuar desafio
          </BotaoPixel>

          <BotaoPixel
            className="confirmar-sair-botao confirmar-sair-botao--sair"
            classeMiolo="confirmar-sair-botao-miolo"
            onClick={onSairDesafio}
          >
            Sair mesmo assim
          </BotaoPixel>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarSairDesafio;
