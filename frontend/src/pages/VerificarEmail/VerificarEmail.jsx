import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/images/logo.png";
import BotaoPixel from "../../components/BotaoPixel";
import { EMAIL_MAXIMO, validarCodigo, validarEmail } from "../../utils/validacoes";
import "../Login/Login.css";
import "./VerificarEmail.css";

function VerificarEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // Vem do Cadastro.jsx via navigate(..., { state: { email } }). Se a tela
  // for aberta direto (sem passar por lá), deixa o campo editável.
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [codigo, setCodigo] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  function mensagemErro(err, padrao) {
    return err?.response?.data?.erro || err?.response?.data?.mensagem || padrao;
  }

  async function handleVerificar(e) {
    e.preventDefault();
    setErro("");
    setAviso("");

    if (!email) {
      setErro("Informe o e-mail que você cadastrou.");
      return;
    }
    if (!codigo) {
      setErro("Informe o código que você recebeu por e-mail.");
      return;
    }
    const erroCampo = validarEmail(email) || validarCodigo(codigo);
    if (erroCampo) {
      setErro(erroCampo);
      return;
    }

    try {
      setCarregando(true);
      const resposta = await api.post("/auth/verificar-email", {
        email: email.trim().toLowerCase(),
        codigo: codigo.trim(),
      });

      localStorage.setItem("token", resposta.data.token);
      navigate("/home");
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível confirmar. Verifique o código e tente novamente."));
    } finally {
      setCarregando(false);
    }
  }

  async function handleReenviar() {
    setErro("");
    setAviso("");

    if (!email) {
      setErro("Informe o e-mail que você cadastrou.");
      return;
    }
    const erroEmail = validarEmail(email);
    if (erroEmail) {
      setErro(erroEmail);
      return;
    }

    try {
      setReenviando(true);
      await api.post("/auth/reenviar-verificacao", { email: email.trim().toLowerCase() });
      setAviso("Se essa conta ainda não foi confirmada, reenviamos o código.");
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível reenviar o código agora."));
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="verificar-titulo">Confirme seu e-mail</h1>
        <p className="verificar-subtitulo">
          Enviamos um código de 6 dígitos {email && <>para <strong>{email}</strong></>} — confira
          também o spam.
        </p>

        <form className="login-form" onSubmit={handleVerificar}>
          {!location.state?.email && (
            <>
              <label className="login-label" htmlFor="email">
                Seu email:
              </label>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="seuemail@gmail.com"
                maxLength={EMAIL_MAXIMO}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}

          <label className="login-label" htmlFor="codigo">
            Código de confirmação:
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

          {erro && <p className="login-erro">{erro}</p>}
          {aviso && <p className="verificar-aviso">{aviso}</p>}

          <BotaoPixel
            type="submit"
            className="login-button"
            classeMiolo="login-button-miolo"
            disabled={carregando}
          >
            {carregando ? "Confirmando..." : "Confirmar e-mail"}
          </BotaoPixel>

          <button
            type="button"
            className="verificar-reenviar"
            onClick={handleReenviar}
            disabled={reenviando}
          >
            {reenviando ? "Reenviando..." : "Reenviar código"}
          </button>
        </form>

        <button type="button" className="verificar-reenviar" onClick={() => navigate("/")}>
          Voltar para o login
        </button>
      </div>

      <div className="login-logo">
        <img src={logo} alt="Code Journey" className="login-logo-icon" />
      </div>
    </div>
  );
}

export default VerificarEmail;
