import BotaoPixel from "../../components/BotaoPixel";
import "./TutorialHome.css";
import mago from "../../assets/images/Mago.png";

// Mesmo visual do TutorialHome (overlay + balão do Mago), mas como um aviso
// de passo único — sem spotlight e sem sequência — mostrado sempre que o
// jogador tenta abrir um portal cujo mundo anterior ainda não foi vencido.
function AvisoPortalBloqueado({ nomeMundo, onFechar }) {
  return (
    <div className="tutorial-overlay" onClick={onFechar}>
      <div className="tutorial-balao" onClick={(e) => e.stopPropagation()}>
        <img src={mago} alt="" className="tutorial-guia" draggable={false} />

        <div className="tutorial-balao-corpo">
          <strong className="tutorial-balao-titulo">Portal trancado</strong>
          <p className="tutorial-balao-fala">
            {nomeMundo} ainda está bloqueado! Vença primeiro os desafios das fases
            anteriores pra conseguir a chave que abre esse cadeado e libera o caminho.
          </p>

          <div className="tutorial-rodape tutorial-rodape--fim">
            <BotaoPixel
              className="tutorial-botao"
              classeMiolo="tutorial-botao-miolo"
              onClick={onFechar}
            >
              Entendi!
            </BotaoPixel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvisoPortalBloqueado;
