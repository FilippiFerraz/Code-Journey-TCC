import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/images/logo.png";
import "../Login/Login.css";
import "./EsqueciSenha.css";

function EsqueciSenha() {
  const navigate = useNavigate();

  // 1 = informar e-mail | 2 = informar código + nova senha
  const [passo, setPasso] = useState(1);

  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Extrai a mensagem de erro que o backend mandou, com um texto padrão.
  function mensagemErro(err, padrao) {
    return (
      err?.response?.data?.erro ||
      err?.response?.data?.mensagem ||
      err?.response?.data?.message ||
      padrao
    );
  }

  // Passo 1 — envia o código para o e-mail informado
  async function enviarCodigo(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!email) {
      setErro("Informe seu email.");
      return;
    }

    try {
      setCarregando(true);
      await api.post("/auth/esqueci-senha", { email });
      // Avança para o passo 2 (a resposta é neutra de propósito).
      setPasso(2);
    } catch (err) {
      setErro(
        mensagemErro(err, "Não foi possível enviar o código. Tente novamente.")
      );
    } finally {
      setCarregando(false);
    }
  }

  // Passo 2 — valida o código e grava a nova senha
  async function redefinirSenha(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!codigo) {
      setErro("Informe o código que você recebeu por email.");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setCarregando(true);
      await api.post("/auth/redefinir-senha", {
        email,
        codigo: codigo.trim(),
        novaSenha,
      });
      setSucesso("Senha redefinida com sucesso! Redirecionando para o login...");
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      setErro(
        mensagemErro(
          err,
          "Não foi possível redefinir a senha. Verifique o código e tente novamente."
        )
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="esqueci-titulo">
          {passo === 1 ? "Esqueceu a Senha?" : "Redefinir Senha"}
        </h1>
        <p className="esqueci-subtitulo">
          {passo === 1
            ? "Informe seu Email para o código de verificação ser enviado"
            : `Digite o código enviado para ${email} e escolha uma nova senha. Verifique também o spam.`}
        </p>

        {passo === 1 && (
          <form className="login-form" onSubmit={enviarCodigo}>
            <label className="login-label" htmlFor="email">
              Seu email:
            </label>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="Digite o email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {erro && <p className="login-erro">{erro}</p>}

            <button type="submit" className="login-button" disabled={carregando}>
              {carregando ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}

        {passo === 2 && (
          <form className="login-form" onSubmit={redefinirSenha}>
            <label className="login-label" htmlFor="codigo">
              Código de verificação:
            </label>
            <input
              id="codigo"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="login-input"
              placeholder="Código de 6 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />

            <label className="login-label" htmlFor="novaSenha">
              Nova senha:
            </label>
            <input
              id="novaSenha"
              type="password"
              className="login-input"
              placeholder="Mínimo de 6 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />

            <label className="login-label" htmlFor="confirmarSenha">
              Confirmar nova senha:
            </label>
            <input
              id="confirmarSenha"
              type="password"
              className="login-input"
              placeholder="Repita a nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />

            {erro && <p className="login-erro">{erro}</p>}
            {sucesso && <p className="esqueci-sucesso">{sucesso}</p>}

            <button type="submit" className="login-button" disabled={carregando}>
              {carregando ? "Redefinindo..." : "Redefinir senha"}
            </button>

            <button
              type="button"
              className="esqueci-voltar"
              onClick={() => {
                setPasso(1);
                setErro("");
                setSucesso("");
                setCodigo("");
                setNovaSenha("");
                setConfirmarSenha("");
              }}
            >
              Usar outro email
            </button>
          </form>
        )}

        <button
          type="button"
          className="esqueci-voltar"
          onClick={() => navigate("/")}
        >
          Voltar para o login
        </button>
      </div>

      <div className="login-logo">
        <img src={logo} alt="Code Journey" className="login-logo-icon" />
      </div>
    </div>
  );
}

export default EsqueciSenha;