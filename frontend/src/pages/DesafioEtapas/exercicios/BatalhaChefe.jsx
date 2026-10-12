import { useState } from "react";
import BotaoPixel from "../../../components/BotaoPixel";
import { tocarSom } from "../../../utils/sons";
import "../../DesafioChefe/DesafioChefe.css";

const NOME_PERSONAGEM_PADRAO = "Guerreiro";
const DURACAO_GOLPE_MS = 900;
const DURACAO_ESQUIVA_MS = 800;

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Batalha contra o chefe — mesmo visual e regra de DesafioChefe.jsx: uma
// pergunta por vez no menu de ataques; acerto = golpe certeiro (o chefe
// cambaleia), erro = o chefe se esquiva e vem outra pergunta. Cada golpe é
// conferido no servidor na hora (verificar). Com "vidasNecessarias" golpes
// certeiros, a etapa vai pra POST /api/progresso ({ respostas }).
// `animarChefe("atingido" | "esquiva")` dispara a animação na arena.
export default function BatalhaChefe({ etapa, nomeChefe, travado, verificar, responder, animarChefe }) {
  const [perguntas] = useState(() => embaralhar(etapa.perguntas));
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState([]);
  const [banner, setBanner] = useState(null); // null | "acerto" | "erro"
  const [conferindo, setConferindo] = useState(false);

  const pergunta = perguntas[indice % perguntas.length];
  const bloqueado = travado || conferindo || banner;

  async function atacar(opcao) {
    if (bloqueado) return;
    setConferindo(true);
    const correto = await verificar({ perguntaId: pergunta.id, opcaoId: opcao.id });
    setConferindo(false);
    if (correto === null) return; // falha de conexão: aviso já mostrado

    if (correto) {
      tocarSom("acerto");
      animarChefe("atingido");
      setBanner("acerto");
      const novos = [...acertos, { perguntaId: pergunta.id, opcaoId: opcao.id }];
      setTimeout(() => {
        setBanner(null);
        if (novos.length >= etapa.vidasNecessarias) {
          responder({ respostas: novos });
        } else {
          setAcertos(novos);
          setIndice((i) => i + 1);
        }
      }, DURACAO_GOLPE_MS);
    } else {
      tocarSom("erro");
      animarChefe("esquiva");
      setBanner("erro");
      setTimeout(() => {
        setBanner(null);
        setIndice((i) => i + 1);
      }, DURACAO_ESQUIVA_MS);
    }
  }

  if (banner === "acerto") {
    return (
      <div className="chefe-banner chefe-banner--acerto">
        <h2 className="chefe-banner-titulo">Golpe certeiro!</h2>
        <p className="chefe-banner-fala">
          {nomeChefe} cambaleou com o impacto! ({acertos.length + 1} de {etapa.vidasNecessarias})
        </p>
      </div>
    );
  }

  if (banner === "erro") {
    return (
      <div className="chefe-banner chefe-banner--erro">
        <h2 className="chefe-banner-titulo">Ele se esquivou!</h2>
        <p className="chefe-banner-fala">{nomeChefe} escapou do seu golpe... tente outro ataque!</p>
      </div>
    );
  }

  return (
    <>
      <div className="chefe-caixa-dialogo">
        <p className="chefe-dialogo-pergunta">
          O que {NOME_PERSONAGEM_PADRAO} vai fazer? · Golpes certeiros: {acertos.length} de {etapa.vidasNecessarias}
        </p>
        <p className="chefe-dialogo-enunciado">{pergunta.enunciado}</p>
        {pergunta.codigo && (
          <pre className="dissertativa-codigo">
            <code>{pergunta.codigo}</code>
          </pre>
        )}
      </div>

      <div className="chefe-menu-ataques">
        {pergunta.opcoes.map((opcao) => (
          <BotaoPixel
            key={opcao.id}
            className="chefe-ataque"
            classeMiolo="chefe-ataque-miolo"
            onClick={() => atacar(opcao)}
            disabled={bloqueado}
            extra={
              <span className="chefe-cursor" aria-hidden="true">
                ▶
              </span>
            }
          >
            {opcao.texto}
          </BotaoPixel>
        ))}
      </div>
    </>
  );
}
