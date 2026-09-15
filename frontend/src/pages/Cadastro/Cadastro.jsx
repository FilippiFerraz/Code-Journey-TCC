import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import api from "../../services/api";
import BotaoPixel from "../../components/BotaoPixel";
import CampoSenha from "../../components/CampoSenha";
import "./Cadastro.css";

// Mesma regra aplicada no backend (auth.service.js) — validar aqui também
// só evita uma viagem ao servidor pra avisar algo que dá pra saber na hora.
const SENHA_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{6,}$/;
const DICA_SENHA = "Mínimo 6 caracteres, 1 letra maiúscula e 1 caractere especial.";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!nome || !idade || !email || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    const idadeNumero = Number(idade);
    if (!Number.isInteger(idadeNumero) || idadeNumero < 13 || idadeNumero > 120) {
      setErro("Informe uma idade válida (mínimo 13 anos).");
      return;
    }

    if (!SENHA_REGEX.test(senha)) {
      setErro(DICA_SENHA);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setCarregando(true);

      await api.post("/auth/cadastro", { nome, email, senha, idade: idadeNumero });

      // Sem login automático — a conta só fica ativa depois de confirmar
      // o código enviado por e-mail.
      navigate("/verificar-email", { state: { email } });
    } catch (err) {
      const mensagem = err.response?.data?.erro || "Não foi possível criar a conta. Tente novamente.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Abas Entrar / Cadastrar -> navegam entre rotas */}
        <div className="login-tabs">
          <button
            type="button"
            className="login-tab"
            onClick={() => navigate("/")}
          >
            ENTRAR
          </button>
          <button
            type="button"
            className="login-tab login-tab-active"
            onClick={() => navigate("/cadastrar")}
          >
            CADASTRAR
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="nome">
            Nome:
          </label>
          <input
            id="nome"
            type="text"
            className="login-input"
            placeholder="Seu Username"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <label className="login-label" htmlFor="idade">
            Idade:
          </label>
          <input
            id="idade"
            type="number"
            inputMode="numeric"
            min="13"
            max="120"
            className="login-input"
            placeholder="Sua idade"
            value={idade}
            onChange={(e) => setIdade(e.target.value)}
          />

          <label className="login-label" htmlFor="email">
            Email:
          </label>
          <input
            id="email"
            type="email"
            className="login-input"
            placeholder="seuemail@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="login-label" htmlFor="senha">
            Senha:
          </label>
          <CampoSenha
            id="senha"
            className="login-input"
            placeholder="••••••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <p className="cadastro-dica-senha">{DICA_SENHA}</p>

          <label className="login-label" htmlFor="confirmarSenha">
            Confirmar senha:
          </label>
          <CampoSenha
            id="confirmarSenha"
            className="login-input"
            placeholder="••••••••••••"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />

          {erro && <p className="login-erro login-erro-cadastro">{erro}</p>}

          <BotaoPixel
            type="submit"
            className="login-button login-button-cadastro"
            classeMiolo="login-button-miolo"
            disabled={carregando}
          >
            {carregando ? "Criando conta..." : "CRIAR CONTA"}
          </BotaoPixel>
        </form>
      </div>

      {/* Logo do app */}
      <div className="login-logo">
        <img src={logo} alt="Code Journey" className="login-logo-icon" />
      </div>
    </div>
  );
}

export default Cadastro;