// src/data/progresso.js
//
// Regras de desbloqueio de desafios e portais. O progresso em si vem sempre
// de GET /api/progresso (ver services/api.js) — cada tela busca a lista de
// progresso do usuário logado e passa pra essas funções, que só decidem
// "liberado ou não" a partir dela. Nada aqui lê localStorage: progresso
// salvo no navegador não é por usuário, então dois logins diferentes no
// mesmo navegador vazariam desbloqueios um pro outro — o bug que fazia
// portais e desafios aparecerem liberados pra usuários novos.

// Trilha usada pra checar o progresso entre mundos — hoje é a única com
// conteúdo real (ver SelecionarDificuldade.jsx).
const DIFICULDADE_PADRAO = "iniciante";

// Desafio 1 de uma trilha sempre começa liberado; os demais só liberam
// depois que o desafio anterior aparecer como concluído no progresso vindo
// da API (GET /api/progresso?mundoId=&dificuldade=).
export function desafioLiberado(progresso, mundoId, dificuldade, desafioId) {
  const numero = Number(desafioId);
  if (numero <= 1) return true;

  return progresso.some(
    (p) =>
      Number(p.mundoId) === Number(mundoId) &&
      p.dificuldade === dificuldade &&
      p.numero === numero - 1 &&
      p.concluido
  );
}

// Portal do mundo 1 sempre liberado (ponto de partida); os demais só abrem
// depois que TODOS os desafios cadastrados do mundo anterior (trilha
// padrão) estiverem concluídos — é a "chave" que o personagem menciona
// quando o portal está trancado. Se o mundo anterior ainda não tiver nenhum
// desafio cadastrado, também conta como bloqueado (não tem o que concluir).
export function mundoLiberado(progresso, mundoId) {
  const numero = Number(mundoId);
  if (numero <= 1) return true;

  const desafiosMundoAnterior = progresso.filter(
    (p) => Number(p.mundoId) === numero - 1 && p.dificuldade === DIFICULDADE_PADRAO
  );
  if (desafiosMundoAnterior.length === 0) return false;

  return desafiosMundoAnterior.every((p) => p.concluido);
}
