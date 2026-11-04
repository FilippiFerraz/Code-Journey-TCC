import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { tocarSom } from "../utils/sons";
import BotaoPixel from "./BotaoPixel";
import IconePixel from "./IconePixel";
import mochila from "../assets/images/mochila.webp";
import { Hourglass } from "pixelarticons/react/Hourglass.js";
import { Potion } from "pixelarticons/react/Potion.js";
import { Script } from "pixelarticons/react/Script.js";
import "./MochilaItens.css";

// Mochila dos itens de ajuda da Lojinha do Mago, nas telas de desafio
// (ResolverDesafio, ResolverDesafioPocao, DesafioChefe, DesafioEtapas). Fica
// logo abaixo do cronômetro (ver o slot `children` do Temporizador) e, ao
// clicar, abre um painel com os itens que o jogador tem pra usar ali:
// - Ampulheta Congelada: congela o cronômetro (useCongelarTempo, recebido
//   da tela em `congelamento`, que é quem para a contagem);
// - Elixir do Sábio: bebido neste desafio, dobra o XP dele ao vencer
//   (POST /api/loja/usar);
// - Pergaminho do Atalho: pula este desafio e volta pra lista
//   (POST /api/loja/pular).
// O Baú Misterioso não entra aqui: ele abre na hora em que é comprado.
//
// O desafio atual vem da URL (:mundoId/:dificuldade/:desafioId) — igual em
// todas as telas — e o progresso da trilha diz se ele já foi vencido (aí o
// elixir não teria XP pra dobrar) e se é o chefe (que não pode ser pulado).

function motivoAmpulheta(congelamento) {
  if (congelamento.congelado) return `Congelado (${congelamento.restante}s)`;
  if (congelamento.quantidade <= 0) return "Você não tem";
  if (!congelamento.podeUsar) return "Agora não";
  return null;
}

export default function MochilaItens({ congelamento }) {
  const navigate = useNavigate();
  const { mundoId, dificuldade, desafioId } = useParams();
  const numero = Number(desafioId);

  const [aberta, setAberta] = useState(false);
  const [elixires, setElixires] = useState(0);
  const [elixirAtivo, setElixirAtivo] = useState(false);
  const [pergaminhos, setPergaminhos] = useState(0);
  const [concluido, setConcluido] = useState(false);
  const [chefe, setChefe] = useState(false);
  const [usando, setUsando] = useState(null);
  const [confirmandoPular, setConfirmandoPular] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;
    api
      .get("/loja")
      .then((res) => {
        if (!ativo) return;
        const quantidade = (chave) => res.data.itens.find((item) => item.chave === chave)?.quantidade ?? 0;
        setElixires(quantidade("elixir"));
        setPergaminhos(quantidade("pular"));
        setElixirAtivo(Boolean(res.data.elixirAtivo));
      })
      .catch(() => {});
    api
      .get("/progresso", { params: { mundoId, dificuldade } })
      .then((res) => {
        if (!ativo) return;
        const trilha = res.data;
        setConcluido(Boolean(trilha.find((d) => d.numero === numero)?.concluido));
        setChefe(trilha.length > 0 && numero === Math.max(...trilha.map((d) => d.numero)));
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [mundoId, dificuldade, numero]);

  // Esc fecha o painel.
  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberta]);

  function abrir() {
    setMensagem("");
    setConfirmandoPular(false);
    setAberta(true);
  }

  function fechar() {
    setAberta(false);
    setConfirmandoPular(false);
  }

  async function usarAmpulheta() {
    await congelamento.usar();
    fechar();
  }

  async function beberElixir() {
    setUsando("elixir");
    try {
      const { data } = await api.post("/loja/usar", {
        chave: "elixir",
        mundoId: Number(mundoId),
        dificuldade,
        numero,
      });
      setElixires(data.quantidade);
      setElixirAtivo(true);
      setMensagem("Glup! O Elixir do Sábio está fazendo efeito: vença este desafio para ganhar XP em dobro.");
      tocarSom("acerto");
    } catch (erro) {
      setMensagem(erro.response?.data?.erro || "O frasco não abriu... tente de novo.");
      tocarSom("erro");
    } finally {
      setUsando(null);
    }
  }

  async function pularDesafio() {
    setUsando("pular");
    try {
      await api.post("/loja/pular", { mundoId: Number(mundoId), dificuldade, numero });
      tocarSom("recompensa");
      navigate(`/desafios/${mundoId}/${dificuldade}`, { replace: true });
    } catch (erro) {
      setMensagem(erro.response?.data?.erro || "O pergaminho falhou... tente de novo.");
      tocarSom("erro");
      setUsando(null);
      setConfirmandoPular(false);
    }
  }

  const quantidadeAmpulhetas = congelamento?.quantidade ?? 0;
  const total = quantidadeAmpulhetas + elixires + pergaminhos;

  const bloqueioElixir = elixirAtivo
    ? "Fazendo efeito"
    : concluido
      ? "Desafio já vencido"
      : elixires <= 0
        ? "Você não tem"
        : null;
  const bloqueioPular = chefe
    ? "Não funciona no chefe"
    : concluido
      ? "Desafio já vencido"
      : pergaminhos <= 0
        ? "Você não tem"
        : null;

  const itens = [
    {
      chave: "congelar",
      icone: Hourglass,
      cor: "gelo",
      nome: "Ampulheta Congelada",
      efeito: "Congela o cronômetro por 30 segundos.",
      quantidade: quantidadeAmpulhetas,
      bloqueio: congelamento ? motivoAmpulheta(congelamento) : "Você não tem",
      usar: usarAmpulheta,
    },
    {
      chave: "elixir",
      icone: Potion,
      cor: "verde",
      nome: "Elixir do Sábio",
      efeito: "Vença este desafio e ganhe XP em dobro.",
      quantidade: elixires,
      bloqueio: bloqueioElixir,
      usar: beberElixir,
    },
    {
      chave: "pular",
      icone: Script,
      cor: "roxo",
      nome: "Pergaminho do Atalho",
      efeito: "Pula este desafio (sem XP nem moedas).",
      quantidade: pergaminhos,
      bloqueio: bloqueioPular,
      usar: () => setConfirmandoPular(true),
    },
  ];

  const painel = (
    <div className="mochila-fundo" onClick={fechar}>
      <div
        className="mochila-painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mochila-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mochila-cabecalho">
          <img src={mochila} alt="" className="mochila-cabecalho-imagem" draggable={false} />
          <h2 id="mochila-titulo" className="mochila-titulo">
            Mochila
          </h2>
          <button type="button" className="mochila-fechar" onClick={fechar} aria-label="Fechar a mochila">
            <i className="hn hn-times" aria-hidden="true" />
          </button>
        </div>

        {elixirAtivo && (
          <p className="mochila-efeito">
            <IconePixel icone={Potion} /> Elixir do Sábio ativo: XP em dobro na próxima vitória!
          </p>
        )}

        {confirmandoPular ? (
          <div className="mochila-confirmar">
            <p>
              Usar o Pergaminho do Atalho e pular o Desafio {numero}? Você não ganha XP nem moedas por ele, e a
              recompensa fica para quando vencê-lo de verdade.
            </p>
            <div className="mochila-confirmar-botoes">
              <button
                type="button"
                className="mochila-usar"
                onClick={pularDesafio}
                disabled={usando === "pular"}
              >
                {usando === "pular" ? "..." : "Pular"}
              </button>
              <button
                type="button"
                className="mochila-usar mochila-usar--cancelar"
                onClick={() => setConfirmandoPular(false)}
                disabled={usando === "pular"}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <ul className="mochila-itens">
            {itens.map((item) => (
              <li key={item.chave} className={`mochila-item mochila-item--${item.cor}`}>
                <span className="mochila-item-icone" aria-hidden="true">
                  <IconePixel icone={item.icone} />
                  <span className="mochila-item-quantidade">{item.quantidade}</span>
                </span>
                <span className="mochila-item-textos">
                  <strong className="mochila-item-nome">{item.nome}</strong>
                  <span className="mochila-item-efeito">{item.efeito}</span>
                </span>
                <button
                  type="button"
                  className="mochila-usar"
                  onClick={item.usar}
                  disabled={Boolean(item.bloqueio) || usando !== null}
                  aria-label={`Usar ${item.nome}${item.bloqueio ? ` (${item.bloqueio})` : ""}`}
                >
                  {usando === item.chave ? "..." : item.bloqueio ?? "Usar"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mochila-mensagem" aria-live="polite">
          {mensagem}
        </p>

        {total === 0 && !elixirAtivo && (
          <p className="mochila-vazia">
            Sua mochila está vazia. Compre itens de ajuda na Lojinha do Mago, no canto do mapa.
          </p>
        )}

        <BotaoPixel className="mochila-voltar" classeMiolo="mochila-voltar-miolo" onClick={fechar}>
          Voltar ao desafio
        </BotaoPixel>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className={`mochila-botao ${total > 0 ? "mochila-botao--cheia" : ""}`}
        onClick={abrir}
        aria-label={`Abrir a mochila de itens de ajuda (${total} ${total === 1 ? "item" : "itens"})`}
      >
        <img src={mochila} alt="" className="mochila-botao-imagem" draggable={false} />
        {total > 0 && <span className="mochila-botao-contador">{total}</span>}
      </button>
      {aberta && createPortal(painel, document.body)}
    </>
  );
}
