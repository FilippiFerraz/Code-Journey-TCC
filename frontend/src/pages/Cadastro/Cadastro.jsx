import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IDADE_MINIMA } from "../../data/privacidade";
import logo from "../../assets/images/logo.webp";
import api from "../../services/api";
import BotaoPixel from "../../components/BotaoPixel";
import CampoSenha from "../../components/CampoSenha";
import {
  DICA_SENHA,
  EMAIL_MAXIMO,
  NOME_MAXIMO,
  SENHA_MAXIMO,
  validarEmail,
  validarIdade,
  validarNome,
  validarSenhaNova,
} from "../../utils/validacoes";
import "./Cadastro.css";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
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

    // Mesmas regras do backend (ver utils/validacoes.js) — só evita uma
    // viagem ao servidor pra avisar algo que dá pra saber na hora.
    const erroCampo =
      validarNome(nome) || validarIdade(idade) || validarEmail(email) || validarSenhaNova(senha);
    if (erroCampo) {
      setErro(erroCampo);
      return;
    }
    const idadeNumero = Number(idade);

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    // LGPD: o backend também exige e registra o aceite (data e versão)
    if (!aceiteTermos) {
      setErro("Para criar a conta, leia e aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }

    try {
      setCarregando(true);

      const emailLimpo = email.trim().toLowerCase();
      await api.post("/auth/cadastro", {
        nome: nome.trim(),
        email: emailLimpo,
        senha,
        idade: idadeNumero,
        aceiteTermos,
      });

      // Sem login automático — a conta só fica ativa depois de confirmar
      // o código enviado por e-mail.
      navigate("/verificar-email", { state: { email: emailLimpo } });
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
            maxLength={NOME_MAXIMO}
            autoComplete="nickname"
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
            maxLength={EMAIL_MAXIMO}
            autoComplete="email"
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
            maxLength={SENHA_MAXIMO}
            autoComplete="new-password"
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
            maxLength={SENHA_MAXIMO}
            autoComplete="new-password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />

          {/* LGPD: aceite explícito (caixa nunca vem marcada) */}
          <label className="cadastro-aceite" htmlFor="aceiteTermos">
            <input
              id="aceiteTermos"
              type="checkbox"
              checked={aceiteTermos}
              onChange={(e) => setAceiteTermos(e.target.checked)}
            />
            <span>
              Tenho {IDADE_MINIMA} anos ou mais e li e aceito os{" "}
              <Link to="/termos" target="_blank" rel="noopener">Termos de Uso</Link> e a{" "}
              <Link to="/privacidade" target="_blank" rel="noopener">Política de Privacidade</Link>.
            </span>
          </label>

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