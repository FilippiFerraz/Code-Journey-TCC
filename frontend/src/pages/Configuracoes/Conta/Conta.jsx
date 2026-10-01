import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import verificarIcon from "../../../assets/images/verificar.png";
import atencaoIcon from "../../../assets/images/atencao.png";
import "./Conta.css";

// Tela "Minha Conta" (Configurações > Conta). Tudo aqui conversa com
// /api/conta (ver backend/src/services/conta.service.js):
// - nome: 1 troca a cada 30 dias
// - e-mail: 1 troca a cada 30 dias, em duas etapas (código no e-mail novo)
// - excluir conta: escondido em "Opções avançadas"; é um soft delete (a
//   conta é desativada, não apagada — um administrador pode reativar)

const TEXTO_CONFIRMACAO_EXCLUSAO = "EXCLUIR";

function formatarData(dataIso) {
  if (!dataIso) return null;
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

function textoDias(dias) {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

function mensagemDoErro(erro, padrao) {
  return erro.response?.data?.erro || padrao;
}

// Caixinha de retorno (sucesso/erro) usada em cada seção.
function Aviso({ aviso }) {
  if (!aviso) return null;
  return (
    <div className={aviso.tipo === "sucesso" ? "conta-sucesso" : "conta-erro"} role="status">
      {aviso.texto}
    </div>
  );
}

// ---------- Modal de exclusão ----------

function ModalExcluirConta({ onCancelar, onExcluida }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  const podeExcluir =
    senha.length > 0 && confirmacao.trim().toUpperCase() === TEXTO_CONFIRMACAO_EXCLUSAO;

  async function handleExcluir(e) {
    e.preventDefault();
    if (!podeExcluir || excluindo) return;
    setErro("");
    setExcluindo(true);
    try {
      await api.post("/conta/excluir", { senha, confirmacao });
      onExcluida();
    } catch (err) {
      setErro(mensagemDoErro(err, "Não foi possível excluir a conta. Tente novamente."));
      setExcluindo(false);
    }
  }

  return (
    <div className="conta-modal-fundo" role="presentation" onClick={onCancelar}>
      <form
        className="conta-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conta-modal-titulo"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleExcluir}
      >
        <h2 id="conta-modal-titulo" className="conta-modal-titulo">
          <img src={atencaoIcon} alt="" className="conta-info-icone-img" /> Excluir minha conta
        </h2>

        <p className="conta-modal-texto">Ao excluir sua conta:</p>
        <ul className="conta-modal-lista">
          <li>você não conseguirá mais entrar no Code Journey com ela;</li>
          <li>seu nome sai do ranking e da busca de jogadores;</li>
          <li>
            seu progresso, XP e itens <strong>ficam guardados</strong> — a conta é desativada, não
            apagada. Se mudar de ideia, peça a um administrador para reativá-la.
          </li>
        </ul>

        {erro && <div className="conta-erro">{erro}</div>}

        <div className="conta-campo">
          <label htmlFor="excluir-senha" className="conta-label">
            Senha atual:
          </label>
          <input
            id="excluir-senha"
            type="password"
            className="conta-input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            autoFocus
          />
        </div>

        <div className="conta-campo">
          <label htmlFor="excluir-confirmacao" className="conta-label">
            Para confirmar, digite <strong>{TEXTO_CONFIRMACAO_EXCLUSAO}</strong>:
          </label>
          <input
            id="excluir-confirmacao"
            type="text"
            className="conta-input"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="conta-modal-acoes">
          <button type="button" className="conta-botao-texto" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="submit"
            className="conta-botao-perigo"
            disabled={!podeExcluir || excluindo}
          >
            {excluindo ? "Excluindo…" : "Excluir conta"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Tela ----------

function Conta() {
  const navigate = useNavigate();
  const [conta, setConta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState("");

  const [nome, setNome] = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [avisoNome, setAvisoNome] = useState(null);

  const [novoEmail, setNovoEmail] = useState("");
  const [senhaEmail, setSenhaEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [avisoEmail, setAvisoEmail] = useState(null);

  const [mostrarExclusao, setMostrarExclusao] = useState(false);

  useEffect(() => {
    let ativo = true;

    api
      .get("/conta")
      .then((res) => {
        if (!ativo) return;
        setConta(res.data);
        setNome(res.data.nome || "");
      })
      .catch(() => ativo && setErroCarga("Não foi possível carregar as informações da conta."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  async function handleSalvarNome(e) {
    e.preventDefault();
    setAvisoNome(null);
    setSalvandoNome(true);
    try {
      const res = await api.put("/conta/nome", { nome });
      setConta(res.data);
      setNome(res.data.nome);
      setAvisoNome({ tipo: "sucesso", texto: "Nome alterado com sucesso!" });
    } catch (err) {
      setAvisoNome({ tipo: "erro", texto: mensagemDoErro(err, "Não foi possível alterar o nome.") });
    } finally {
      setSalvandoNome(false);
    }
  }

  async function handleSolicitarEmail(e) {
    e.preventDefault();
    setAvisoEmail(null);
    setEnviandoEmail(true);
    try {
      const res = await api.post("/conta/email", { novoEmail, senha: senhaEmail });
      setConta(res.data);
      setSenhaEmail("");
      setCodigo("");
      setAvisoEmail({
        tipo: "sucesso",
        texto: `Enviamos um código para ${res.data.emailPendente}. Ele vale por 15 minutos.`,
      });
    } catch (err) {
      setAvisoEmail({ tipo: "erro", texto: mensagemDoErro(err, "Não foi possível enviar o código.") });
    } finally {
      setEnviandoEmail(false);
    }
  }

  async function handleConfirmarEmail(e) {
    e.preventDefault();
    setAvisoEmail(null);
    setEnviandoEmail(true);
    try {
      const res = await api.post("/conta/email/confirmar", { codigo });
      setConta(res.data);
      setNovoEmail("");
      setCodigo("");
      setAvisoEmail({
        tipo: "sucesso",
        texto: `E-mail alterado! A partir de agora, entre com ${res.data.email}.`,
      });
    } catch (err) {
      setAvisoEmail({ tipo: "erro", texto: mensagemDoErro(err, "Não foi possível confirmar o código.") });
    } finally {
      setEnviandoEmail(false);
    }
  }

  async function handleCancelarEmail() {
    setAvisoEmail(null);
    try {
      const res = await api.delete("/conta/email");
      setConta(res.data);
      setCodigo("");
    } catch (err) {
      setAvisoEmail({ tipo: "erro", texto: mensagemDoErro(err, "Não foi possível cancelar a troca.") });
    }
  }

  // Conta excluída: mesma saída do botão "Sair" das Configurações.
  function handleContaExcluida() {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  }

  if (carregando || !conta) {
    return (
      <MainLayout titulo="Minha Conta">
        <div className="conta">
          <div className="conta-estado">{erroCarga || "Carregando informações…"}</div>
        </div>
      </MainLayout>
    );
  }

  const bloqueioNome = conta.diasParaAlterarNome > 0;
  const bloqueioEmail = conta.diasParaAlterarEmail > 0;
  const nomeMudou = nome.trim().replace(/\s+/g, " ") !== conta.nome;

  return (
    <MainLayout titulo="Minha Conta">
      <div className="conta">
        <BotaoPixel
          className="conta-voltar"
          classeMiolo="conta-voltar-miolo"
          onClick={() => navigate("/configuracoes")}
        >
          ← Voltar
        </BotaoPixel>

        <div className="conta-form">
          {/* ---------- Nome ---------- */}
          <form className="conta-fieldset" onSubmit={handleSalvarNome}>
            <h2 className="conta-fieldset-titulo">Nome</h2>

            <div className="conta-campo">
              <label htmlFor="nome" className="conta-label">
                Nome exibido no seu perfil e no ranking:
              </label>
              <input
                id="nome"
                type="text"
                className="conta-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={50}
                disabled={bloqueioNome}
              />
            </div>

            <div className="conta-info">
              {bloqueioNome ? (
                <>
                  <span className="conta-info-icone">ℹ️</span>
                  <span className="conta-info-texto">
                    Última alteração: {formatarData(conta.nomeAlteradoEm)} — faltam{" "}
                    <strong>{textoDias(conta.diasParaAlterarNome)}</strong> para poder alterar de novo.
                  </span>
                </>
              ) : (
                <>
                  <img src={verificarIcon} alt="" className="conta-info-icone-img" />
                  <span className="conta-info-texto">
                    Você pode alterar seu nome agora. Depois, só de novo daqui a{" "}
                    {conta.diasEntreAlteracoes} dias.
                  </span>
                </>
              )}
            </div>

            <Aviso aviso={avisoNome} />

            {!bloqueioNome && (
              <button
                type="submit"
                className="conta-botao"
                disabled={salvandoNome || !nomeMudou || !nome.trim()}
              >
                {salvandoNome ? "Salvando…" : "Salvar nome"}
              </button>
            )}
          </form>

          {/* ---------- E-mail ---------- */}
          <section className="conta-fieldset">
            <h2 className="conta-fieldset-titulo">E-mail</h2>

            <p className="conta-email-atual">
              E-mail atual: <strong>{conta.email}</strong>
            </p>

            {conta.emailPendente ? (
              /* Etapa 2: aguardando o código enviado pro e-mail novo */
              <form onSubmit={handleConfirmarEmail}>
                <div className="conta-info">
                  <span className="conta-info-icone">📧</span>
                  <span className="conta-info-texto">
                    Enviamos um código de 6 dígitos para <strong>{conta.emailPendente}</strong>.
                    Digite-o abaixo para concluir a troca.
                  </span>
                </div>

                <div className="conta-campo conta-campo--espaco">
                  <label htmlFor="codigo" className="conta-label">
                    Código de confirmação:
                  </label>
                  <input
                    id="codigo"
                    type="text"
                    inputMode="numeric"
                    className="conta-input conta-input--codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                  />
                </div>

                <Aviso aviso={avisoEmail} />

                <div className="conta-acoes-linha">
                  <button type="button" className="conta-botao-texto" onClick={handleCancelarEmail}>
                    Cancelar troca
                  </button>
                  <button
                    type="submit"
                    className="conta-botao"
                    disabled={enviandoEmail || codigo.length !== 6}
                  >
                    {enviandoEmail ? "Confirmando…" : "Confirmar código"}
                  </button>
                </div>
              </form>
            ) : bloqueioEmail ? (
              <>
                <div className="conta-info">
                  <span className="conta-info-icone">ℹ️</span>
                  <span className="conta-info-texto">
                    Última alteração: {formatarData(conta.emailAlteradoEm)} — faltam{" "}
                    <strong>{textoDias(conta.diasParaAlterarEmail)}</strong> para poder alterar de novo.
                  </span>
                </div>
                <Aviso aviso={avisoEmail} />
              </>
            ) : (
              /* Etapa 1: novo e-mail + senha -> envia o código */
              <form onSubmit={handleSolicitarEmail}>
                <div className="conta-campo">
                  <label htmlFor="novo-email" className="conta-label">
                    Novo e-mail:
                  </label>
                  <input
                    id="novo-email"
                    type="email"
                    className="conta-input"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="seu.novo.email@exemplo.com"
                    autoComplete="email"
                  />
                </div>

                <div className="conta-campo">
                  <label htmlFor="senha-email" className="conta-label">
                    Senha atual:
                  </label>
                  <input
                    id="senha-email"
                    type="password"
                    className="conta-input"
                    value={senhaEmail}
                    onChange={(e) => setSenhaEmail(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <div className="conta-info">
                  <img src={verificarIcon} alt="" className="conta-info-icone-img" />
                  <span className="conta-info-texto">
                    Vamos enviar um código para o novo e-mail. A troca só acontece depois que você
                    confirmar esse código. Depois, só dá para trocar de novo daqui a{" "}
                    {conta.diasEntreAlteracoes} dias.
                  </span>
                </div>

                <Aviso aviso={avisoEmail} />

                <button
                  type="submit"
                  className="conta-botao"
                  disabled={enviandoEmail || !novoEmail.trim() || !senhaEmail}
                >
                  {enviandoEmail ? "Enviando…" : "Enviar código"}
                </button>
              </form>
            )}
          </section>

          {/* ---------- Opções avançadas (fechado por padrão) ---------- */}
          <details className="conta-avancado">
            <summary className="conta-avancado-titulo">Opções avançadas</summary>
            <div className="conta-avancado-corpo">
              <p className="conta-avancado-texto">
                Excluir a conta desativa seu acesso ao Code Journey. Seu progresso fica guardado e um
                administrador pode reativar a conta se você pedir.
              </p>
              <button
                type="button"
                className="conta-botao-perigo"
                onClick={() => setMostrarExclusao(true)}
              >
                Excluir minha conta
              </button>
            </div>
          </details>
        </div>

        {mostrarExclusao && (
          <ModalExcluirConta
            onCancelar={() => setMostrarExclusao(false)}
            onExcluida={handleContaExcluida}
          />
        )}
      </div>
    </MainLayout>
  );
}

export default Conta;
