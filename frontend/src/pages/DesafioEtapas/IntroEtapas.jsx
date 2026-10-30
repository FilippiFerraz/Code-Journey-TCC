import { useState } from "react";
import BotaoPixel from "../../components/BotaoPixel";
import { BarraAvancoFala, BotaoPularFalas } from "../../components/ControlesFalas";
import { useAvancoAutomatico } from "../../hooks/useAvancoAutomatico";
import { GrupoInimigos } from "./SpriteInimigo";
import "../DesafioIntro/DesafioIntro.css";
import "../DesafioChefe/DesafioChefe.css";

// Mesmo texto entre crases vira <code> (padrão de DesafioIntro.jsx).
function renderDica(dica) {
  return dica.split("`").map((parte, i) => (i % 2 === 1 ? <code key={i}>{parte}</code> : parte));
}

// Introdução de um desafio com etapas — mesmo visual de DesafioIntro.jsx
// (inimigo flutuando + falas com avanço automático + card do enunciado) e,
// no desafio-chefe, o de DesafioChefe.jsx. O card lista as 3 etapas e
// avisa se o jogador está continuando de onde parou.
export default function IntroEtapas({ desafio, cena, etapaInicial, onIniciar, onVoltar }) {
  const [indice, setIndice] = useState(0);
  const [mostrarEnunciado, setMostrarEnunciado] = useState(false);
  const falas = cena.falas;
  const { concluido, etapasConcluidas } = desafio.progresso;
  const continuando = !concluido && etapasConcluidas > 0;
  // Desafio de etapa única (portais 1 e 2 jogados nesta tela): sem a lista
  // e sem "N ETAPAS" no card.
  const variasEtapas = desafio.etapas.length > 1;

  function avancar() {
    if (mostrarEnunciado) return;
    if (indice < falas.length - 1) setIndice((i) => i + 1);
    else setMostrarEnunciado(true);
  }

  useAvancoAutomatico(!mostrarEnunciado, indice, avancar);

  function iniciar(e) {
    e.stopPropagation();
    onIniciar();
  }

  function voltar(e) {
    e.stopPropagation();
    onVoltar();
  }

  const cardEnunciado = (
    <div className="intro-enunciado-overlay">
      <div className="intro-enunciado-card" onClick={(e) => e.stopPropagation()}>
        <span className="intro-enunciado-tag">
          {cena.chefe ? "CHEFE · " : ""}DESAFIO {desafio.numero}
          {variasEtapas ? ` · ${desafio.etapas.length} ETAPAS` : ""}
        </span>
        <h2 className="intro-enunciado-titulo">{desafio.titulo}</h2>
        <p className="intro-enunciado-texto">{desafio.enunciado}</p>

        {variasEtapas && (
          <ol className="etapas-intro-lista">
            {desafio.etapas.map((etapa) => (
              <li
                key={etapa.numero}
                className={etapa.numero <= etapasConcluidas && !concluido ? "etapas-intro-lista--feita" : ""}
              >
                <span>{etapa.numero <= etapasConcluidas && !concluido ? <i className="hn hn-check-solid" aria-label="concluída" /> : etapa.numero}</span>
                {etapa.titulo || `Etapa ${etapa.numero}`}
              </li>
            ))}
          </ol>
        )}

        {desafio.dica && <p className="intro-enunciado-dica"><i className="hn hn-lightbulb-solid icone-dica" aria-hidden="true" /> Dica: {renderDica(desafio.dica)}</p>}
        {continuando && (
          <p className="etapas-intro-aviso">Você já venceu {etapasConcluidas} etapa(s) — vai continuar de onde parou.</p>
        )}
        {concluido && <p className="etapas-intro-aviso">Você já venceu este desafio — refazendo para treinar.</p>}

        <BotaoPixel className="intro-botao-iniciar" classeMiolo="intro-botao-iniciar-miolo" onClick={iniciar}>
          {continuando ? `Continuar (etapa ${etapaInicial})` : "Iniciar Desafio"}
        </BotaoPixel>
      </div>
    </div>
  );

  // ---------- Desafio-chefe: intro no visual de DesafioChefe.jsx ----------
  if (cena.chefe) {
    return (
      <div className="chefe-tela">
        <BotaoPixel className="chefe-voltar" classeMiolo="chefe-voltar-miolo" onClick={voltar}>
          <i className="hn hn-arrow-left" aria-hidden="true" /> Voltar
        </BotaoPixel>
        <div className="chefe-intro" onClick={avancar}>
          {!mostrarEnunciado && <BotaoPularFalas onPular={() => setMostrarEnunciado(true)} className="chefe-pular" />}

          <div className="chefe-intro-cena">
            <div className="chefe-intro-anuncio">
              <p className="chefe-intro-aviso">
                {cena.grupo
                  ? "O chefe da trilha apareceu — e não veio sozinho! Você vai precisar derrotar todos."
                  : "O chefe da trilha apareceu! Você vai precisar derrotá-lo."}
              </p>
              <h2 className="chefe-intro-nome">{cena.nome}</h2>
            </div>
            <GrupoInimigos
              inimigos={cena.inimigos}
              nome={cena.nome}
              className="chefe-intro-sprite"
              classeGrupo="grupo-inimigos--intro"
              contexto="intro"
            />
          </div>

          {!mostrarEnunciado && (
            <div className="chefe-intro-balao">
              <p className="chefe-intro-fala" key={indice}>
                {falas[indice]}
              </p>
              <div className="chefe-intro-rodape">
                <div className="chefe-intro-pontos">
                  {falas.map((_, i) => (
                    <span key={i} className={`chefe-intro-ponto ${i <= indice ? "chefe-intro-ponto--ativo" : ""}`} />
                  ))}
                </div>
                <span className="chefe-intro-continuar">toque para continuar <i className="hn hn-play-solid" aria-hidden="true" /></span>
              </div>
              <BarraAvancoFala chave={indice} />
            </div>
          )}
          {mostrarEnunciado && cardEnunciado}
        </div>
      </div>
    );
  }

  // ---------- Desafio comum: intro no visual de DesafioIntro.jsx ----------
  return (
    <div className="intro-container" onClick={avancar}>
      <BotaoPixel className="intro-voltar" classeMiolo="intro-voltar-miolo" onClick={voltar}>
        <i className="hn hn-arrow-left" aria-hidden="true" /> Voltar
      </BotaoPixel>

      {!mostrarEnunciado && <BotaoPularFalas onPular={() => setMostrarEnunciado(true)} />}

      <div className="intro-cena">
        <div className="intro-inimigo-anuncio">
          <p className="intro-inimigo-aviso">
            {cena.grupo
              ? "Um grupo de inimigos surgiu no seu caminho! Você vai precisar enfrentar todos."
              : "Um inimigo surgiu no seu caminho! Você vai precisar enfrentá-lo."}
          </p>
          <h2 className="intro-inimigo-nome">{cena.nome}</h2>
        </div>
        <GrupoInimigos
          inimigos={cena.inimigos}
          nome={cena.nome}
          className="intro-inimigo-destaque"
          classeGrupo="grupo-inimigos--intro"
          contexto="intro"
        />
      </div>

      {!mostrarEnunciado && (
        <div className="intro-balao">
          <p className="intro-fala" key={indice}>
            {falas[indice]}
          </p>
          <div className="intro-rodape-balao">
            <div className="intro-pontos">
              {falas.map((_, i) => (
                <span key={i} className={`intro-ponto ${i <= indice ? "intro-ponto-ativo" : ""}`} />
              ))}
            </div>
            <span className="intro-continuar">toque para continuar <i className="hn hn-play-solid" aria-hidden="true" /></span>
          </div>
          <BarraAvancoFala chave={indice} />
        </div>
      )}

      {mostrarEnunciado && cardEnunciado}
    </div>
  );
}
