import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { getFalaMagoPorDesafio, NUMERO_DESAFIO_CHEFE } from '../../data/falasMago';
import BotaoPixel from '../../components/BotaoPixel';
import IconeItem from '../../components/IconeItem';
import { tocarSom } from '../../utils/sons';
import { formatarDuracao } from '../../utils/tempo';
import mago from '../../assets/images/Mago.png';
import './RecompensaDesafio.css';

// Tela cheia (sem MainLayout), igual às telas de batalha — é a continuação
// direta da vitória em ResolverDesafio, ResolverDesafioPocao e DesafioChefe.

// Posições das faíscas em volta da moldura do item (em % da área de
// destaque) — cada uma pisca com um atraso diferente pra não sincronizar.
// Os atrasos começam depois da moldura surgir (~0.9s, ver animações em
// RecompensaDesafio.css).
const ESTRELAS = [
  { top: '8%', left: '18%', atraso: '0.9s', tamanho: 14 },
  { top: '14%', left: '80%', atraso: '1.4s', tamanho: 10 },
  { top: '46%', left: '6%', atraso: '2s', tamanho: 10 },
  { top: '52%', left: '90%', atraso: '1.2s', tamanho: 14 },
  { top: '84%', left: '22%', atraso: '1.7s', tamanho: 10 },
  { top: '80%', left: '76%', atraso: '2.3s', tamanho: 12 },
];

// Espadas cruzadas em pixel art (grade 16x16) — a biblioteca de ícones
// pixelados do projeto não tem espada, então o ícone é desenhado aqui.
const PIXELS_ESPADAS = [
  // lâminas
  ...Array.from({ length: 8 }, (_, i) => ({ x: 2 + i, y: 2 + i, cor: '#e8e8f0' })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: 13 - i, y: 2 + i, cor: '#c9c9d6' })),
  // guardas
  { x: 9, y: 11, cor: '#f4c542' },
  { x: 11, y: 9, cor: '#f4c542' },
  { x: 10, y: 10, cor: '#f4c542' },
  { x: 4, y: 9, cor: '#f4c542' },
  { x: 6, y: 11, cor: '#f4c542' },
  { x: 5, y: 10, cor: '#f4c542' },
  // cabos e pomos
  { x: 11, y: 11, cor: '#8a5a12' },
  { x: 12, y: 12, cor: '#8a5a12' },
  { x: 13, y: 13, cor: '#f4c542' },
  { x: 4, y: 11, cor: '#8a5a12' },
  { x: 3, y: 12, cor: '#8a5a12' },
  { x: 2, y: 13, cor: '#f4c542' },
];

function IconeEspadas() {
  return (
    <svg
      className="recompensa-icone-espadas"
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {PIXELS_ESPADAS.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width="1" height="1" fill={p.cor} />
      ))}
    </svg>
  );
}

// Frase de incentivo conforme o tempo que o jogador levou pra vencer. As
// duas primeiras faixas acompanham o bônus de velocidade do backend (cheio
// até 20s, some aos 90s — ver calcularBonusVelocidade em
// progresso.service.js); as mais lentas valorizam a persistência, nunca
// soam como bronca.
const FAIXAS_DE_TEMPO = [
  { ate: 20, icone: 'hn-bolt-solid', frase: 'Rápido como um raio! Você dominou esse desafio.' },
  { ate: 60, icone: 'hn-fire-solid', frase: 'Golpe certeiro! Mandou muito bem, aventureiro.' },
  { ate: 180, icone: 'hn-star-solid', frase: 'Belo trabalho! Com calma e atenção, você chegou lá.' },
  { ate: Infinity, icone: 'hn-trophy-solid', frase: 'Persistência de herói! Cada minuto de estudo te deixa mais forte.' },
];

function faixaDoTempo(segundos) {
  return FAIXAS_DE_TEMPO.find((faixa) => segundos <= faixa.ate);
}

export default function RecompensaDesafio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mundoId, dificuldade, desafioId } = useParams();

  const idNumerico = Number(desafioId);
  const idMundo = Number(mundoId);

  useEffect(() => {
    tocarSom('recompensa');
  }, []);

  // Se esta vitória concluiu o módulo inteiro, o baú de fim de mundo já
  // fica disponível (GET /api/baus) — ver handleAvante.
  const [bauDisponivel, setBauDisponivel] = useState(false);

  useEffect(() => {
    let ativo = true;
    api
      .get('/baus')
      .then((res) => {
        const bau = res.data.find(
          (b) => String(b.mundoId) === String(mundoId) && b.dificuldade === dificuldade
        );
        if (ativo) setBauDisponivel(Boolean(bau?.disponivel));
      })
      .catch(() => {
        // sem resposta — o baú continua acessível pelo mapa da Home
      });
    return () => {
      ativo = false;
    };
  }, [mundoId, dificuldade]);

  // A tela de batalha manda o retorno de POST /api/progresso via state da
  // navegação (a rota já valida a resposta, grava o Progresso, soma o XP e
  // concede o item ao inventário do personagem — ver progresso.service.js).
  // A única recompensa personalizável do jogo é o item de equipamento, e ele
  // vem SEMPRE da API: desafio sem item (ou tela aberta direto pela URL /
  // recarregada) mostra só a vitória, sem item inventado.
  const resultadoApi = location.state?.resultado;
  const item = resultadoApi?.itemGanho ?? null;

  const xpGanho = resultadoApi?.xpConcedidoAgora > 0 ? resultadoApi.xpConcedidoAgora : null;

  // Tempo DESTA vitória, medido pelo cronômetro da tela de batalha e mandado
  // no state da navegação. (O tempoSegundos da API é o da primeira
  // conclusão, que fica gravado — num desafio rejogado mostraria o tempo
  // antigo.) Tela aberta direto pela URL/recarregada: sem tempo, sem bloco.
  const tempoSegundos = Number.isFinite(location.state?.tempoSegundos)
    ? location.state.tempoSegundos
    : null;
  const faixaTempo = tempoSegundos !== null ? faixaDoTempo(tempoSegundos) : null;
  const falaMago = getFalaMagoPorDesafio(idNumerico, idMundo);

  // replace: o jogador não deve conseguir voltar pra tela de vitória pelo
  // botão "voltar" do navegador.
  function voltarParaDesafios() {
    navigate(`/desafios/${mundoId}/${dificuldade}`, { replace: true });
  }

  // Vitória no desafio-chefe que concluiu o módulo (baú ainda fechado, ver
  // bauDisponivel acima): "AVANTE!" leva pro Baú da Sorte em vez da lista de
  // desafios. Rejogar o chefe com o baú já aberto volta pra lista normal.
  function handleAvante() {
    if (idNumerico === NUMERO_DESAFIO_CHEFE && bauDisponivel) {
      navigate(`/bau/${mundoId}/${dificuldade}`, { replace: true });
    } else {
      voltarParaDesafios();
    }
  }

  function irParaEditarPersonagem() {
    navigate('/editar-personagem');
  }

  return (
    <div className="recompensa-tela">
      {/* Cenário do salão (estandartes, tochas, folhagens) desenhado em CSS.
          TODO: trocar por uma imagem de fundo em pixel art quando existir
          (ver .recompensa-tela em RecompensaDesafio.css). */}
      <div className="recompensa-cenario" aria-hidden="true">
        <span className="recompensa-estandarte recompensa-estandarte--esquerda" />
        <span className="recompensa-estandarte recompensa-estandarte--direita" />
        <span className="recompensa-tocha recompensa-tocha--esquerda" />
        <span className="recompensa-tocha recompensa-tocha--direita" />
        <span className="recompensa-folhagem recompensa-folhagem--esquerda" />
        <span className="recompensa-folhagem recompensa-folhagem--direita" />
      </div>

      <header className="recompensa-barra">
        <BotaoPixel
          className="recompensa-botao-quadrado"
          classeMiolo="recompensa-botao-quadrado-miolo"
          onClick={voltarParaDesafios}
          aria-label="Voltar"
        >
          <i className="hn hn-arrow-left" aria-hidden="true" />
        </BotaoPixel>

        <div className="recompensa-placa-titulo">
          <h1>Desafio {desafioId}</h1>
        </div>

        <BotaoPixel
          className="recompensa-botao-quadrado"
          classeMiolo="recompensa-botao-quadrado-miolo"
          onClick={irParaEditarPersonagem}
          aria-label="Equipar item"
        >
          <IconeEspadas />
        </BotaoPixel>
      </header>

      <div className="recompensa-faixa">
        <div className="recompensa-faixa-corpo">
          <i className="hn hn-crown-solid recompensa-faixa-coroa" aria-hidden="true" />
          <div className="recompensa-faixa-textos">
            <h2 className="recompensa-faixa-titulo">VITÓRIA ÉPICA!</h2>
            <p className="recompensa-faixa-subtitulo">O CÓDIGO VENCEU A FERA!</p>
          </div>
        </div>
      </div>

      <div className="recompensa-destaque">
        <div className="recompensa-raios" aria-hidden="true" />
        <div className="recompensa-brilho" aria-hidden="true" />
        {ESTRELAS.map((estrela, i) => (
          <i
            key={i}
            className="hn hn-sparkles-solid recompensa-estrela"
            aria-hidden="true"
            style={{
              top: estrela.top,
              left: estrela.left,
              fontSize: estrela.tamanho,
              animationDelay: estrela.atraso,
            }}
          />
        ))}

        <div className="recompensa-moldura">
          <div className="recompensa-moldura-interna">
            {item ? (
              <IconeItem
                item={item}
                classeImagem="recompensa-item-imagem"
                classeEmoji="recompensa-item-emoji"
              />
            ) : (
              // Desafio sem item: a moldura mostra a coroa da vitória.
              <i className="hn hn-crown-solid recompensa-sem-item-icone" aria-hidden="true" />
            )}
          </div>
          <div className="recompensa-moldura-flash" aria-hidden="true" />
        </div>
      </div>

      <div className="recompensa-info">
        {item ? (
          <>
            <div className="recompensa-placa-nome">
              <strong>{item.nome}</strong>
            </div>
            <span className="recompensa-etiqueta-tipo">◆ Item de Equipamento ◆</span>
            {item.descricao && <p className="recompensa-descricao">{item.descricao}</p>}
          </>
        ) : (
          <div className="recompensa-placa-nome">
            <strong>Desafio concluído</strong>
          </div>
        )}
        {xpGanho && <p className="recompensa-xp">+{xpGanho} XP</p>}

        {faixaTempo && (
          <div className="recompensa-tempo">
            <p className="recompensa-tempo-valor">
              <i className="hn hn-clock-solid" aria-hidden="true" />
              Você venceu em <strong>{formatarDuracao(tempoSegundos)}</strong>
            </p>
            <p className="recompensa-tempo-frase">
              <i className={`hn ${faixaTempo.icone}`} aria-hidden="true" />
              {faixaTempo.frase}
            </p>
          </div>
        )}
      </div>

      <div className="recompensa-divisor" aria-hidden="true">
        <span />
      </div>

      <div className="recompensa-dialogo">
        <div className="recompensa-dialogo-corpo">
          <img src={mago} alt="Mago" className="recompensa-mago" draggable={false} />
          <div className="recompensa-dialogo-textos">
            {falaMago.map((paragrafo, i) => (
              <p key={i}>
                {paragrafo.map((trecho, j) =>
                  trecho.destaque ? (
                    <span key={j} className="recompensa-termo">
                      {trecho.texto}
                    </span>
                  ) : (
                    <span key={j}>{trecho.texto}</span>
                  )
                )}
              </p>
            ))}
          </div>
        </div>
      </div>

      <BotaoPixel
        className="recompensa-avante"
        classeMiolo="recompensa-avante-miolo"
        onClick={handleAvante}
      >
        <i className="hn hn-crown-solid" aria-hidden="true" />
        <span className="recompensa-avante-texto">AVANTE!</span>
        <i className="hn hn-arrow-right" aria-hidden="true" />
      </BotaoPixel>
    </div>
  );
}
