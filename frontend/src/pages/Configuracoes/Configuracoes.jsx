import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import BotaoPixel from "../../components/BotaoPixel";
import personagemIcon from "../../assets/images/personagem.png";
import portaIcon from "../../assets/images/porta.png";
import "./Configuracoes.css";

function Configuracoes() {
  const navigate = useNavigate();

  // Sai da conta: joga fora o token salvo no navegador (é ele que mantém o
  // login — ver services/api.js) e volta pro Login, sem deixar voltar pro
  // jogo pelo botão "voltar" do navegador.
  function sair() {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  }

  return (
    <MainLayout titulo="Configurações">
      <div className="configuracoes">
        {/* Seção de Configurações (topo) */}
        <section className="configuracoes-secao">
          <h2 className="configuracoes-secao-titulo">Minhas Configurações</h2>

          {/* Conta: nome, e-mail e — escondido em "Opções avançadas" — a
              exclusão da conta (ver Conta/Conta.jsx) */}
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
          <BotaoPixel
            className="configuracoes-botao configuracoes-botao--sair"
            classeMiolo="configuracoes-botao-miolo"
            onClick={sair}
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
