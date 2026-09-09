import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import IconeItem from "../../components/IconeItem";
import BotaoPixel from "../../components/BotaoPixel";
import "./AbrirBau.css";

// Mesma trilha usada em todo o resto do progresso — hoje é a única com
// desafios reais (ver data/progresso.js e bau.controller.js no backend).
const DIFICULDADE = "iniciante";

// Layout da fita da roleta (ver .bau-roleta-* em AbrirBau.css — os valores
// aqui precisam bater com a largura real do slot definida lá).
const LARGURA_SLOT = 92;
const SLOTS_VISIVEIS = 3;
const REPETICOES_FITA = 6;
// Loop (0-indexado) da fita repetida onde a roleta realmente para — os
// anteriores são só volta visual, pra dar a sensação de giro antes de
// chegar no slot sorteado pelo backend (ver indiceVencedor).
const LOOP_ALVO = 4;

function calcularDeslocamento(indiceVencedor, totalSlots) {
  const indiceAbsoluto = LOOP_ALVO * totalSlots + indiceVencedor;
  const centroJanela = (LARGURA_SLOT * SLOTS_VISIVEIS) / 2;
  return -(indiceAbsoluto * LARGURA_SLOT + LARGURA_SLOT / 2 - centroJanela);
}

function AbrirBau() {
  const navigate = useNavigate();
  const { mundoId } = useParams();

  // "abrindo" (báu balançando, aguardando a API) -> "girando" (roleta
  // deslizando até o slot sorteado) -> "resultado" (item revelado) | "erro"
  const [estado, setEstado] = useState("abrindo");
  const [dados, setDados] = useState(null); // { itemGanho, slots, indiceVencedor }
  const [erro, setErro] = useState("");
  const [deslocamento, setDeslocamento] = useState(0);

  useEffect(() => {
    let ativo = true;
    const inicio = Date.now();
    // Duração mínima da animação do báu balançando, mesmo se a API responder
    // na hora — sem isso, numa rede rápida a abertura "pula" direto pra
    // roleta sem dar tempo do jogador registrar a cena.
    const DURACAO_MINIMA_MS = 1100;

    api
      .post(`/baus/${mundoId}/abrir`, { dificuldade: DIFICULDADE })
      .then((res) => {
        if (!ativo) return;
        const restante = Math.max(0, DURACAO_MINIMA_MS - (Date.now() - inicio));
        setTimeout(() => {
          if (!ativo) return;
          setDados(res.data);
          setEstado("girando");
        }, restante);
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(err.response?.data?.erro || "Não foi possível abrir o baú. Tente novamente.");
        setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [mundoId]);

  // Dispara a animação da roleta assim que os dados chegam: começa parada
  // em 0 e, logo em seguida, desliza até o slot sorteado — o intervalo é
  // pra garantir que o navegador pinte o quadro em 0 antes de animar
  // (senão o transition CSS não tem "de onde" partir).
  useEffect(() => {
    if (estado !== "girando" || !dados) return;

    const alvo = calcularDeslocamento(dados.indiceVencedor, dados.slots.length);
    const timer = setTimeout(() => setDeslocamento(alvo), 80);
    return () => clearTimeout(timer);
  }, [estado, dados]);

  function handleFimDoGiro(e) {
    if (e.propertyName === "transform" && estado === "girando") {
      setEstado("resultado");
    }
  }

  const fita = dados ? Array.from({ length: REPETICOES_FITA }, () => dados.slots).flat() : [];

  return (
    <div className="bau">
      <BotaoPixel
        className="bau-voltar"
        classeMiolo="bau-voltar-miolo"
        onClick={() => navigate("/home")}
      >
        ← Voltar
      </BotaoPixel>

      {estado === "abrindo" && (
        <div className="bau-cena">
          <span className="bau-emoji bau-emoji--abrindo" role="img" aria-label="Baú abrindo">
            🎁
          </span>
          <p className="bau-legenda">Abrindo o baú…</p>
        </div>
      )}

      {(estado === "girando" || estado === "resultado") && dados && (
        <div className="bau-cena">
          <h1 className="bau-titulo">
            {estado === "girando" ? "Girando a roleta…" : "Recompensa conquistada!"}
          </h1>

          <div className="bau-roleta-janela">
            <div className="bau-roleta-marcador" aria-hidden="true" />
            <div
              className="bau-roleta-fita"
              style={{ transform: `translateX(${deslocamento}px)` }}
              onTransitionEnd={handleFimDoGiro}
            >
              {fita.map((item, indice) => (
                <div className="bau-roleta-slot" key={indice}>
                  <IconeItem
                    item={item}
                    classeImagem="bau-roleta-imagem"
                    classeEmoji="bau-roleta-icone"
                  />
                </div>
              ))}
            </div>
          </div>

          {estado === "resultado" && (
            <div className="bau-resultado">
              <div className="bau-resultado-caixa">
                <IconeItem
                  item={dados.itemGanho}
                  classeImagem="bau-resultado-imagem"
                  classeEmoji="bau-resultado-icone"
                />
              </div>
              <strong className="bau-resultado-nome">
                {dados.itemGanho.nome}
                {dados.itemGanho.quantidade > 1 && ` x${dados.itemGanho.quantidade}`}
              </strong>
              {dados.itemGanho.descricao && (
                <p className="bau-resultado-descricao">{dados.itemGanho.descricao}</p>
              )}
              <p className="bau-resultado-aviso">O item já está no seu inventário.</p>

              <BotaoPixel
                className="bau-resultado-botao"
                classeMiolo="bau-resultado-botao-miolo"
                onClick={() => navigate("/editar-personagem")}
              >
                Ver no inventário
              </BotaoPixel>
              <BotaoPixel
                className="bau-resultado-botao bau-resultado-botao--secundario"
                classeMiolo="bau-resultado-botao-miolo bau-resultado-botao-miolo--secundario"
                onClick={() => navigate("/home")}
              >
                Voltar ao mapa
              </BotaoPixel>
            </div>
          )}
        </div>
      )}

      {estado === "erro" && (
        <div className="bau-cena">
          <span className="bau-emoji" role="img" aria-label="Baú fechado">
            🔒
          </span>
          <p className="bau-erro">{erro}</p>
          <BotaoPixel
            className="bau-resultado-botao"
            classeMiolo="bau-resultado-botao-miolo"
            onClick={() => navigate("/home")}
          >
            Voltar ao mapa
          </BotaoPixel>
        </div>
      )}
    </div>
  );
}

export default AbrirBau;
