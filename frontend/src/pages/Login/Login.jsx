import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import api from "../../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

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

          <button type="submit" className="login-button" disabled={carregando}>
            {carregando ? "Entrando..." : "ENTRAR E COMEÇAR"}
          </button>
        </form>
      </div>

      {/* Divisor "Ou continue com" */}
      <div className="login-social-card">
        <div className="login-divider">
          <span>Ou continue com:</span>
        </div>

        <div className="login-social-buttons">
          <button type="button" className="login-social-btn login-social-google">
            <span className="login-social-icon">G</span>
            Google
          </button>
          <button type="button" className="login-social-btn login-social-facebook">
            <span className="login-social-icon">f</span>
            Facebook
          </button>
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