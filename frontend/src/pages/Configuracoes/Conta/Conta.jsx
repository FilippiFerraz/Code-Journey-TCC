import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import verificarIcon from "../../../assets/images/verificar.png";
import smartphoneIcon from "../../../assets/images/smartphone.png";
import "./Conta.css";

function formatarData(dataIso) {
  if (!dataIso) return null;
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

function Conta() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [nomePersonagem, setNomePersonagem] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucessoMensagem, setSucessoMensagem] = useState("");

  useEffect(() => {
    let ativo = true;

    api
      .get("/perfil")
      .then((res) => {
        if (ativo) {
          setPerfil(res.data);
          setNomePersonagem(res.data.nome || "");
          setTelefone(res.data.telefone || "");
          setEmail(res.data.email || "");
        }
      })
      .catch(() => ativo && setErro("Não foi possível carregar as informações."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  async function handleSalvar(e) {
    e.preventDefault();
    setErro("");
    setSucessoMensagem("");

    if (!nomePersonagem.trim()) {
      setErro("O nome do personagem não pode estar vazio.");
      return;
    }

    try {
      setSalvando(true);

      await api.put("/perfil", {
        nome: nomePersonagem,
        telefone: telefone || null,
        email: email,
      });

      setSucessoMensagem("Alterações salvas com sucesso!");
      setTimeout(() => setSucessoMensagem(""), 3000);
    } catch (err) {
      const mensagem =
        err.response?.data?.erro ||
        "Não foi possível salvar as alterações. Tente novamente.";
      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <MainLayout titulo="Configurações">
        <div className="conta">
          <div className="conta-estado">Carregando informações…</div>
        </div>
      </MainLayout>
    );
  }

  const ultimaAlteracaoNome = perfil?.ultimaAlteracaoNome
    ? formatarData(perfil.ultimaAlteracaoNome)
    : null;
  const ultimaAlteracaoEmail = perfil?.ultimaAlteracaoEmail
    ? formatarData(perfil.ultimaAlteracaoEmail)
    : null;
  const diasRestantesNome = perfil?.diasRestantesNome || 0;
  const diasRestantesEmail = perfil?.diasRestantesEmail || 0;

  return (
    <MainLayout titulo="Minha Conta">
      <div className="conta">
        {/* Botão Voltar */}
        <BotaoPixel
          className="conta-voltar"
          classeMiolo="conta-voltar-miolo"
          onClick={() => navigate("/configuracoes")}
        >
          ← Voltar
        </BotaoPixel>

        {/* Mensagens de status */}
        {erro && <div className="conta-erro">{erro}</div>}
        {sucessoMensagem && (
          <div className="conta-sucesso">{sucessoMensagem}</div>
        )}

        {/* Formulário */}
        <form className="conta-form" onSubmit={handleSalvar}>
          {/* Campo: Nome do Personagem */}
          <fieldset className="conta-fieldset">
            <legend className="conta-fieldset-titulo">Nome do Personagem</legend>

            <div className="conta-campo">
              <label htmlFor="nome" className="conta-label">
                Nome:
              </label>
              <input
                id="nome"
                type="text"
                className="conta-input"
                value={nomePersonagem}
                onChange={(e) => setNomePersonagem(e.target.value)}
                maxLength="50"
                placeholder="Nome do seu personagem"
              />
            </div>

            {ultimaAlteracaoNome && (
              <div className="conta-info">
                <span className="conta-info-icone">ℹ️</span>
                <span className="conta-info-texto">
                  Última alteração: {ultimaAlteracaoNome} — Faltam{" "}
                  <strong>{diasRestantesNome} dias</strong> para poder alterar novamente.
                </span>
              </div>
            )}
            {!ultimaAlteracaoNome && (
              <div className="conta-info">
                <img src={verificarIcon} alt="" className="conta-info-icone-img" />
                <span className="conta-info-texto">
                  Você pode alterar seu nome agora.
                </span>
              </div>
            )}
          </fieldset>

          {/* Campo: E-mail */}
          <fieldset className="conta-fieldset">
            <legend className="conta-fieldset-titulo">E-mail</legend>

            <div className="conta-campo">
              <label htmlFor="email" className="conta-label">
                E-mail:
              </label>
              <input
                id="email"
                type="email"
                className="conta-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
              />
            </div>

            {ultimaAlteracaoEmail && (
              <div className="conta-info">
                <span className="conta-info-icone">ℹ️</span>
                <span className="conta-info-texto">
                  Última alteração: {ultimaAlteracaoEmail} — Faltam{" "}
                  <strong>{diasRestantesEmail} dias</strong> para poder alterar novamente.
                </span>
              </div>
            )}
            {!ultimaAlteracaoEmail && (
              <div className="conta-info">
                <img src={verificarIcon} alt="" className="conta-info-icone-img" />
                <span className="conta-info-texto">
                  Você pode alterar seu e-mail agora.
                </span>
              </div>
            )}
          </fieldset>

          {/* Campo: Telefone */}
          <fieldset className="conta-fieldset">
            <legend className="conta-fieldset-titulo">Telefone (Opcional)</legend>

            <div className="conta-campo">
              <label htmlFor="telefone" className="conta-label">
                Telefone:
              </label>
              <input
                id="telefone"
                type="tel"
                className="conta-input"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 9 9999-9999"
              />
            </div>

            <div className="conta-info">
              <img src={smartphoneIcon} alt="" className="conta-info-icone-img" />
              <span className="conta-info-texto">
                Seu telefone não é obrigatório e pode ser alterado a qualquer momento.
              </span>
            </div>
          </fieldset>

          {/* Botão Salvar */}
          <BotaoPixel
            type="submit"
            className="conta-salvar"
            classeMiolo="conta-salvar-miolo"
            disabled={salvando}
          >
            {salvando ? "Salvando…" : "💾 Salvar Alterações"}
          </BotaoPixel>
        </form>
      </div>
    </MainLayout>
  );
}

export default Conta;
