import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { getRecompensaPorDesafio } from '../../data/recompensas';
import { marcarConcluido } from '../../data/progresso';
import './RecompensaDesafio.css';

// TODO: quando existir contexto de personagem/perfil, puxar o nome real
// do jogador em vez desse placeholder.
const NOME_PERSONAGEM_PADRAO = 'Aventureiro(a)';

// Fala do mago varia um pouco conforme o desafio, mantendo o tom de RPG
// já usado no resto do app (ver seção 7.5 do contexto — nomenclatura e
// tom em português).
function montarTextoMago({ nomePersonagem, numeroDesafio, nomeInimigo }) {
  if (numeroDesafio === 1) {
    return `Excelente(a) ${nomePersonagem}, sua primeira Palavra de Comando foi um sucesso esmagador! O ${nomeInimigo} foi afastado e forçado a recuar, provando o poder de seu sistema. Você domina o conceito de Saída de Dados e deu o passo mais importante: começar!`;
  }
  return `Muito bem, ${nomePersonagem}! Sua lógica foi afiada como uma lâmina, e o ${nomeInimigo} não teve chance. Continue assim e nenhum desafio será páreo para você!`;
}

export default function RecompensaDesafio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mundoId, dificuldade, desafioId } = useParams();

  const idNumerico = Number(desafioId);

  // ResolverDesafio manda o retorno de POST /api/progresso (com o item real
  // que entrou no inventário) via state da navegação. Se não tiver chegado
  // (chamada falhou, offline, ou a tela foi aberta direto por essa URL),
  // cai pro conteúdo hardcoded de data/recompensas.js como reserva.
  const itemGanho = location.state?.resultado?.itemGanho;
  const recompensaFallback = getRecompensaPorDesafio(idNumerico);
  const recompensa = itemGanho
    ? {
        icone: itemGanho.icone ?? recompensaFallback.icone,
        nome: itemGanho.nome,
        descricao: itemGanho.descricao ?? recompensaFallback.descricao,
      }
    : recompensaFallback;

  // Chegar nesta tela já significa que o desafio foi vencido (ResolverDesafio
  // só navega pra cá depois da vitória) — é aqui que o progresso é gravado,
  // liberando o próximo desafio da trilha em Desafios.jsx.
  useEffect(() => {
    marcarConcluido(mundoId, dificuldade, idNumerico);
  }, [mundoId, dificuldade, idNumerico]);

  const nomePersonagem = NOME_PERSONAGEM_PADRAO;
  // TODO: nome do inimigo deveria vir dos dados do próprio desafio
  // (hoje ResolverDesafio também tem o inimigo hardcoded como slime).
  const nomeInimigo = 'Dragão Escoriado Vermelho';

  const textoMago = montarTextoMago({
    nomePersonagem,
    numeroDesafio: idNumerico,
    nomeInimigo,
  });

  function handleVoltar() {
    navigate(-1);
  }

  function handleAvante() {
    navigate(`/desafios/${mundoId}/${dificuldade}`);
  }

  return (
    // Se o MainLayout do projeto não aceitar filhos "soltos" dessa forma,
    // ajuste este wrapper para bater com a assinatura real do componente.
    <MainLayout>
      <div className="recompensa-tela">
        <div className="recompensa-cabecalho">
          <button
            type="button"
            className="recompensa-icone-voltar"
            onClick={handleVoltar}
            aria-label="Voltar"
          >
            ←
          </button>
          <h1 className="recompensa-titulo">Desafio {desafioId}</h1>
          <span className="recompensa-icone-menu" aria-hidden="true">
            ⚔️
          </span>
        </div>

        <div className="recompensa-banner-vitoria">
          <span className="recompensa-banner-texto">
            VITÓRIA ÉPICA: O CÓDIGO VENCEU A FERA!
          </span>
        </div>

        <div className="recompensa-caixa-icone">
          <span className="recompensa-icone" role="img" aria-label="Recompensa">
            {recompensa.icone}
          </span>
        </div>

        <div className="recompensa-texto-premio">
          <strong>{recompensa.nome}</strong>
          <p>{recompensa.descricao}</p>
        </div>

        <div className="recompensa-caixa-dialogo">
          <p>{textoMago}</p>
        </div>

        <button
          type="button"
          className="recompensa-botao-avante"
          onClick={handleAvante}
        >
          AVANTE!
        </button>
      </div>
    </MainLayout>
  );
}
