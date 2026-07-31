import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import api from "../../services/api";
import "./Cadastro.css";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!nome || !email || !senha) {
      setErro("Preencha nome, e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await api.post("/auth/cadastro", { nome, email, senha });

      localStorage.setItem("token", resposta.data.token);
      navigate("/home");
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

          {erro && <p className="login-erro login-erro-cadastro">{erro}</p>}

          <button
            type="submit"
            className="login-button login-button-cadastro"
            disabled={carregando}
          >
            {carregando ? "Criando conta..." : "CRIAR CONTA"}
          </button>
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