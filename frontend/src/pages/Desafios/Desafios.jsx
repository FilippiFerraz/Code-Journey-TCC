import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import BotaoPixel from "../../components/BotaoPixel";
import "./Desafios.css";
import fundoPersonagem from "../../assets/images/Fundo_personagem.webp";
import detalheDesafios from "../../assets/images/Detalhe_desafios.webp";
import api from "../../services/api";
import { desafioConcluido, desafioLiberado } from "../../data/progresso";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import AvatarPersonagem from "../../components/AvatarPersonagem";
import { BookOpen } from "pixelarticons/react/BookOpen.js";
import { Crown } from "pixelarticons/react/Crown.js";
import { Potion } from "pixelarticons/react/Potion.js";
import { Script } from "pixelarticons/react/Script.js";
import { Shield } from "pixelarticons/react/Shield.js";
import { Sparkle } from "pixelarticons/react/Sparkle.js";
import { Sword } from "pixelarticons/react/Sword.js";
import IconePixel from "../../components/IconePixel";

// Ids dos desafios da trilha. Quem está liberado ou não é calculado a partir
// do progresso REAL do usuário (GET /api/progresso — ver desafioLiberado em
// data/progresso.js): o desafio 1 sempre começa aberto, e cada próximo só
// libera depois que o anterior aparecer como concluído no progresso vindo
// da API.
const IDS_DESAFIOS = [1, 2, 3, 4, 5, 6];

// O último desafio de toda trilha é a batalha de chefe (ver
// src/pages/DesafioChefe) — segue as mesmas regras de bloqueio/desbloqueio
// dos demais, só muda a rota de destino.
// TODO: quando a API de desafios existir, isso deveria vir marcado nos
// próprios dados do desafio (ex: desafio.tipo === "chefe"), em vez de fixo
// na posição da trilha.
const ID_DESAFIO_CHEFE = IDS_DESAFIOS[IDS_DESAFIOS.length - 1];

// Desafios que usam a mecânica de "montar poção" (ver
// src/pages/DesafioIntroPocao e src/pages/ResolverDesafioPocao) em vez da
// batalha de múltipla escolha/ordenar blocos/avaliar código padrão. Mesmo
// TODO do ID_DESAFIO_CHEFE acima: por enquanto fixo por mundo+posição, até
// a API de desafios existir de verdade e trazer isso marcado nos dados.
const DESAFIOS_POCAO = [{ mundoId: "1", numero: 5 }];

function ehDesafioPocao(mundoId, numero) {
  return DESAFIOS_POCAO.some((d) => d.mundoId === String(mundoId) && d.numero === numero);
}

// Ícone de cada card, pela posição na trilha. Aceita emoji ou caminho de
// imagem (.png/.gif — ver IconeDesafio).
// TODO: vir da API de desafios junto com o resto do conteúdo do desafio.
const ICONES_DESAFIOS = {
  1: Sword,
  2: Shield,
  3: BookOpen,
  4: Script,
  5: Potion,
  6: Crown,
};

// Cena do topo (o avatar do jogador aparece sempre por cima). Todos os
// portais usam a mesma arte do Campo de Treino — se um mundo ganhar arte
// própria, basta adicionar ele em CENAS_POR_MUNDO; quem não estiver lá cai
// na CENA_PADRAO.
const CENA_PADRAO = { titulo: "Campo de Treino", imagem: fundoPersonagem };
const CENAS_POR_MUNDO = {};

// Etiqueta da dificuldade atual (vinda de :dificuldade). As trilhas reais
// hoje são "iniciante" e "guerreiro" (ver SelecionarDificuldade.jsx); a
// cor segue a convenção fácil = verde, médio = amarelo, difícil = vermelho.
const DIFICULDADES = {
  iniciante: { nome: "Iniciante", cor: "verde" },
  guerreiro: { nome: "Guerreiro", cor: "vermelho" },
};

// Quanto tempo a mensagem de "caminho selado" fica na tela.
const DURACAO_MENSAGEM_BLOQUEIO_MS = 2000;
const DURACAO_TREMOR_MS = 400;

const ROTULO_ESTADO = {
  disponivel: "disponível",
  bloqueado: "bloqueado",
  concluido: "concluído",
};

// icone: caminho de imagem (.png/.gif) ou um ícone da pixelarticons
function IconeDesafio({ icone }) {
  if (typeof icone === "string" && /\.(png|gif)$/i.test(icone)) {
    return <img src={icone} alt="" className="desafio-card-icone-imagem" draggable={false} />;
  }
  return (
    <span className="desafio-card-icone-emoji">
      <IconePixel icone={icone ?? Sword} />
    </span>
  );
}

function Desafios() {
  const { mundoId, dificuldade } = useParams();
  const navigate = useNavigate();
  const itensEquipados = usePersonagemAvatar();
  // Começa vazio — enquanto não chega (ou se a chamada falhar), só o
  // desafio 1 aparece liberado, nunca o contrário.
  const [progresso, setProgresso] = useState([]);

  // Card bloqueado que acabou de ser clicado (dispara o tremor) e a
  // mensagem curta mostrada abaixo do grid.
  const [idTremendo, setIdTremendo] = useState(null);
  const [mensagemBloqueio, setMensagemBloqueio] = useState("");
  const timeoutTremorRef = useRef(null);
  const timeoutMensagemRef = useRef(null);

  // Pergaminho do Atalho (Lojinha do Mago): quantos o jogador tem, se está
  // confirmando o uso e a mensagem do resultado. Sobe a cada uso pra
  // recarregar o progresso.
  const [pergaminhos, setPergaminhos] = useState(0);
  const [confirmandoAtalho, setConfirmandoAtalho] = useState(false);
  const [usandoAtalho, setUsandoAtalho] = useState(false);
  const [mensagemAtalho, setMensagemAtalho] = useState("");
  const [versaoProgresso, setVersaoProgresso] = useState(0);

  useEffect(() => {
    let ativo = true;

    api
      .get("/progresso", { params: { mundoId, dificuldade } })
      .then((res) => {
        if (ativo) setProgresso(res.data);
      })
      .catch(() => {
        // sem progresso carregado (ex: offline) — mantém os desafios além
        // do 1 bloqueados em vez de liberar por engano
      });

    return () => {
      ativo = false;
    };
  }, [mundoId, dificuldade, versaoProgresso]);

  useEffect(() => {
    let ativo = true;
    api
      .get("/loja")
      .then((res) => {
        if (!ativo) return;
        setPergaminhos(res.data.itens.find((item) => item.chave === "pular")?.quantidade ?? 0);
      })
      .catch(() => {
        // sem loja — o atalho só não aparece
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutTremorRef.current);
      clearTimeout(timeoutMensagemRef.current);
    };
  }, []);

  const desafios = IDS_DESAFIOS.map((id) => {
    let estado = "bloqueado";
    if (desafioConcluido(progresso, mundoId, dificuldade, id)) estado = "concluido";
    else if (desafioLiberado(progresso, mundoId, dificuldade, id)) estado = "disponivel";

    // Desafios com várias etapas (portal 3) vêm marcados no progresso da API
    // (totalEtapas > 1) e abrem a tela genérica de etapas.
    const doProgresso = progresso.find(
      (p) => Number(p.mundoId) === Number(mundoId) && p.dificuldade === dificuldade && p.numero === id
    );

    return {
      id,
      numero: id,
      icone: ICONES_DESAFIOS[id],
      estado,
      chefe: id === ID_DESAFIO_CHEFE,
      totalEtapas: doProgresso?.totalEtapas ?? 1,
      etapasConcluidas: doProgresso?.etapasConcluidas ?? 0,
    };
  });

  // O atalho vale pro próximo desafio liberado e ainda não vencido — nunca
  // pra batalha de chefe (o backend também recusa).
  const desafioParaPular = desafios.find((d) => d.estado === "disponivel" && !d.chefe);

  async function usarAtalho() {
    if (!desafioParaPular || usandoAtalho) return;
    setUsandoAtalho(true);
    try {
      const { data } = await api.post("/loja/pular", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: desafioParaPular.numero,
      });
      setPergaminhos(data.quantidade);
      setMensagemAtalho(`Desafio ${data.numero} pulado! O caminho à frente se abriu.`);
      setVersaoProgresso((v) => v + 1);
    } catch (erro) {
      setMensagemAtalho(erro.response?.data?.erro || "O pergaminho falhou... tente de novo.");
    } finally {
      setUsandoAtalho(false);
      setConfirmandoAtalho(false);
    }
  }

  const cena = CENAS_POR_MUNDO[mundoId] ?? CENA_PADRAO;
  const infoDificuldade = DIFICULDADES[dificuldade] ?? { nome: dificuldade, cor: "neutra" };

  function avisarBloqueado(desafio) {
    // tira e recoloca a classe pra animação recomeçar num segundo clique
    setIdTremendo(null);
    clearTimeout(timeoutTremorRef.current);
    requestAnimationFrame(() => setIdTremendo(desafio.id));
    timeoutTremorRef.current = setTimeout(() => setIdTremendo(null), DURACAO_TREMOR_MS);

    setMensagemBloqueio("Este caminho ainda está selado. Vença o desafio anterior!");
    clearTimeout(timeoutMensagemRef.current);
    timeoutMensagemRef.current = setTimeout(
      () => setMensagemBloqueio(""),
      DURACAO_MENSAGEM_BLOQUEIO_MS
    );
  }

  function handleAbrirDesafio(desafio) {
    if (desafio.estado === "bloqueado") {
      avisarBloqueado(desafio);
      return;
    }
    if (desafio.totalEtapas > 1) {
      navigate(`/etapas/${mundoId}/${dificuldade}/${desafio.id}`);
    } else if (desafio.chefe) {
      navigate(`/desafio-chefe/${mundoId}/${dificuldade}/${desafio.id}`);
    } else if (ehDesafioPocao(mundoId, desafio.id)) {
      navigate(`/desafio-pocao/${mundoId}/${dificuldade}/${desafio.id}`);
    } else {
      navigate(`/desafio/${mundoId}/${dificuldade}/${desafio.id}`);
    }
  }

  return (
    <MainLayout titulo={`DESAFIOS - ATO ${mundoId}`}>
      <div className="desafios-container">
        {/* Fundo do salão (parede, tochas, folhagem) desenhado em CSS.
            TODO: trocar por imagem de fundo em pixel art quando existir
            (ver .desafios-container em Desafios.css). */}
        <div className="desafios-cenario" aria-hidden="true">
          <span className="desafios-tocha desafios-tocha--esquerda" />
          <span className="desafios-tocha desafios-tocha--direita" />
          <span className="desafios-folhagem desafios-folhagem--esquerda" />
          <span className="desafios-folhagem desafios-folhagem--direita" />
        </div>

        {/* Cena do topo, com a barra (voltar + placa "ATO <portal>") por cima */}
        <div className="desafios-cena">
          <div
            className="desafios-cena-fundo"
            style={{ backgroundImage: `url(${cena.imagem})` }}
            role="img"
            aria-label={cena.titulo}
          >
            <AvatarPersonagem itensEquipados={itensEquipados} className="desafios-cena-personagem" />
          </div>

          <div className="desafios-barra">
            <BotaoPixel
              className="desafios-voltar"
              classeMiolo="desafios-voltar-miolo"
              onClick={() => navigate("/home")}
              aria-label="Voltar para o mapa"
            >
              <i className="hn hn-arrow-left" aria-hidden="true" />
            </BotaoPixel>

            <div className="desafios-placa-ato">
              <span>ATO {mundoId}</span>
            </div>

            {/* espaço do tamanho do botão de voltar, só pra centralizar a placa */}
            <span className="desafios-barra-espaco" aria-hidden="true" />
          </div>
        </div>

        {/* Painel de pergaminho com a lista de desafios */}
        <section className="desafios-painel">
          <span className="desafios-painel-estandarte desafios-painel-estandarte--esquerda" aria-hidden="true" />
          <span className="desafios-painel-estandarte desafios-painel-estandarte--direita" aria-hidden="true" />
          <span className="desafios-painel-gema" aria-hidden="true" />
          <span className="desafios-painel-canto desafios-painel-canto--se" aria-hidden="true" />
          <span className="desafios-painel-canto desafios-painel-canto--sd" aria-hidden="true" />
          <span className="desafios-painel-canto desafios-painel-canto--ie" aria-hidden="true" />
          <span className="desafios-painel-canto desafios-painel-canto--id" aria-hidden="true" />

          <div className="desafios-painel-corpo">
            <div className="desafios-faixa">
              <div className="desafios-faixa-corpo">
                <span className="desafios-faixa-lis" aria-hidden="true"><IconePixel icone={Sparkle} /></span>
                <div className="desafios-faixa-textos">
                  <h2 className="desafios-faixa-titulo">DESAFIOS</h2>
                  <p className="desafios-faixa-subtitulo">
                    Escolha um desafio e prove seu conhecimento em programação!
                  </p>
                </div>
                <span className="desafios-faixa-lis" aria-hidden="true"><IconePixel icone={Sparkle} /></span>
              </div>
            </div>

            <span className={`desafios-dificuldade desafios-dificuldade--${infoDificuldade.cor}`}>
              Dificuldade: {infoDificuldade.nome}
            </span>

            <div className="desafios-grid">
              {desafios.map((desafio, indice) => {
                const bloqueado = desafio.estado === "bloqueado";
                const classes = [
                  "desafio-card",
                  `desafio-card--${desafio.estado}`,
                  desafio.chefe ? "desafio-card--chefe" : "",
                  idTremendo === desafio.id ? "desafio-card--tremendo" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={desafio.id}
                    type="button"
                    className={classes}
                    style={{ animationDelay: `${0.35 + indice * 0.06}s` }}
                    onClick={() => handleAbrirDesafio(desafio)}
                    aria-disabled={bloqueado ? "true" : undefined}
                    aria-label={`Desafio ${desafio.numero}${desafio.chefe ? " (chefe)" : ""}, ${
                      ROTULO_ESTADO[desafio.estado]
                    }`}
                  >
                    <span className="desafio-card-moldura">
                      <span className="desafio-card-corpo">
                        <span className="desafio-card-icone">
                          <IconeDesafio icone={desafio.icone} />
                          {bloqueado && <span className="desafio-card-cadeado"><i className="hn hn-lock-solid" aria-label="Bloqueado" /></span>}
                        </span>
                        <span className="desafio-card-rodape">
                          <span>
                            DESAFIO {desafio.numero}
                            {desafio.totalEtapas > 1 && desafio.estado !== "concluido" && (
                              <> · {desafio.etapasConcluidas}/{desafio.totalEtapas}</>
                            )}
                          </span>
                          {!bloqueado && <span className="desafio-card-seta">›</span>}
                        </span>
                      </span>
                    </span>

                    {desafio.estado === "concluido" && (
                      <span className="desafio-card-selo" aria-hidden="true"><i className="hn hn-check-solid" /></span>
                    )}

                    {desafio.chefe && !bloqueado && (
                      <>
                        <i className="hn hn-sparkles-solid desafio-card-estrela desafio-card-estrela--1" aria-hidden="true" />
                        <i className="hn hn-sparkles-solid desafio-card-estrela desafio-card-estrela--2" aria-hidden="true" />
                        <i className="hn hn-sparkles-solid desafio-card-estrela desafio-card-estrela--3" aria-hidden="true" />
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="desafios-mensagem-bloqueio" role="status" aria-live="polite">
              {mensagemBloqueio}
            </p>

            {pergaminhos > 0 && desafioParaPular && (
              <div className="desafios-atalho">
                {confirmandoAtalho ? (
                  <>
                    <span className="desafios-atalho-icone" aria-hidden="true">
                      <IconePixel icone={Script} />
                    </span>
                    <span className="desafios-atalho-texto">
                      Pular o Desafio {desafioParaPular.numero}? Você não ganha XP nem moedas por ele.
                    </span>
                    <span className="desafios-atalho-botoes">
                      <button
                        type="button"
                        className="desafios-atalho-botao desafios-atalho-botao--sim"
                        onClick={usarAtalho}
                        disabled={usandoAtalho}
                      >
                        Pular
                      </button>
                      <button
                        type="button"
                        className="desafios-atalho-botao"
                        onClick={() => setConfirmandoAtalho(false)}
                        disabled={usandoAtalho}
                      >
                        Cancelar
                      </button>
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    className="desafios-atalho-botao desafios-atalho-botao--usar"
                    onClick={() => {
                      setMensagemAtalho("");
                      setConfirmandoAtalho(true);
                    }}
                  >
                    <IconePixel icone={Script} className="desafios-atalho-icone-botao" />
                    Pergaminho do Atalho (x{pergaminhos}): pular o Desafio {desafioParaPular.numero}
                  </button>
                )}
              </div>
            )}
            {mensagemAtalho && (
              <p className="desafios-atalho-mensagem" role="status">
                {mensagemAtalho}
              </p>
            )}

            <div className="desafios-emblema">
              <span className="desafios-emblema-linha" aria-hidden="true" />
              <img
                src={detalheDesafios}
                alt=""
                aria-hidden="true"
                className="desafios-emblema-imagem"
                draggable={false}
              />
              <span className="desafios-emblema-linha desafios-emblema-linha--direita" aria-hidden="true" />
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default Desafios;
