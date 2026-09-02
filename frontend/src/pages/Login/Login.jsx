import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import api from "../../services/api";
import BotaoPixel from "../../components/BotaoPixel";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  // true quando o backend recusou o login por e-mail ainda não confirmado
  // (403) — mostra um atalho pra tela de verificação em vez de só o erro.
  const [emailNaoVerificado, setEmailNaoVerificado] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setEmailNaoVerificado(false);

    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await api.post("/auth/login", { email, senha });

      localStorage.setItem("token", resposta.data.token);
      navigate("/home");
    } catch (err) {
      const mensagem = err.response?.data?.erro || "Não foi possível entrar. Verifique seus dados.";
      setErro(mensagem);
      setEmailNaoVerificado(err.response?.status === 403);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Abas Entrar / Cadastrar */}
        <div className="login-tabs">
          <button
            type="button"
            className="login-tab login-tab-active"
            onClick={() => navigate("/")}
          >
            ENTRAR
          </button>
          <button
            type="button"
            className="login-tab"
            onClick={() => navigate("/cadastrar")}
          >
            CADASTRAR
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
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
          <input
            id="senha"
            type="password"
            className="login-input"
            placeholder="••••••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            type="button"
            className="login-forgot"
            onClick={() => navigate("/esqueci-senha")}
          >
            Esqueceu a senha?
          </button>

          {erro && <p className="login-erro">{erro}</p>}
          {emailNaoVerificado && (
            <button
              type="button"
              className="login-forgot"
              onClick={() => navigate("/verificar-email", { state: { email } })}
            >
              Confirmar e-mail agora
            </button>
          )}

          <BotaoPixel
            as="button"
            type="submit"
            className="login-button"
            classeMiolo="login-button-miolo"
            disabled={carregando}
          >
            {carregando ? "Entrando..." : "ENTRAR E COMEÇAR"}
          </BotaoPixel>
        </form>
      </div>

      {/* Divisor "Ou continue com" */}
      <div className="login-social-card">
        <div className="login-divider">
          <span>Ou continue com:</span>
        </div>

        <div className="login-social-buttons">
          <BotaoPixel className="login-social-btn" classeMiolo="login-social-miolo">
            <span className="login-social-icon">G</span>
            Google
          </BotaoPixel>
          <BotaoPixel className="login-social-btn" classeMiolo="login-social-miolo">
            <span className="login-social-icon">f</span>
            Facebook
          </BotaoPixel>
        </div>
      </div>

      {/* Logo do app */}
      <div className="login-logo">
        <img src={logo} alt="Code Journey" className="login-logo-icon" />
      </div>
    </div>
  );
}

export default Login;