import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import BotaoPixel from "../../components/BotaoPixel";
import sinoIcon from "../../assets/images/sino.png";
import personagemIcon from "../../assets/images/personagem.png";
import atencaoIcon from "../../assets/images/atencao.png";
import portaIcon from "../../assets/images/porta.png";
import "./Configuracoes.css";

function Configuracoes() {
  const navigate = useNavigate();

  return (
    <MainLayout titulo="Configurações">
      <div className="configuracoes">
        {/* Seção de Configurações (topo) */}
        <section className="configuracoes-secao">
          <h2 className="configuracoes-secao-titulo">Minhas Configurações</h2>

          {/* Botão Notificações */}
          <BotaoPixel
            className="configuracoes-botao configuracoes-botao--notificacoes"
            classeMiolo="configuracoes-botao-miolo"
            onClick={() => {}}
          >
            <img src={sinoIcon} alt="" className="configuracoes-icone" />
            Notificações
          </BotaoPixel>

          {/* Botão Conta */}
          <BotaoPixel
            className="configuracoes-botao configuracoes-botao--conta"
            classeMiolo="configuracoes-botao-miolo"
            onClick={() => navigate("/conta")}
          >
            <img src={personagemIcon} alt="" className="configuracoes-icone" />
            Conta
          </BotaoPixel>
        </section>

        {/* Seção de Ações (embaixo, próximo ao footer) */}
        <section className="configuracoes-secao configuracoes-secao--acoes">
          {/* Botão Excluir Conta */}
          <BotaoPixel
            className="configuracoes-botao configuracoes-botao--deletar"
            classeMiolo="configuracoes-botao-miolo"
            onClick={() => {}}
          >
            <img src={atencaoIcon} alt="" className="configuracoes-icone" />
            Excluir Conta
          </BotaoPixel>

          {/* Botão Sair */}
          <BotaoPixel
            className="configuracoes-botao configuracoes-botao--sair"
            classeMiolo="configuracoes-botao-miolo"
            onClick={() => {}}
          >
            <img src={portaIcon} alt="" className="configuracoes-icone" />
            Sair
          </BotaoPixel>
        </section>
      </div>
    </MainLayout>
  );
}

export default Configuracoes;
