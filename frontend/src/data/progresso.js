// src/data/progresso.js
//
// Controla quais desafios de uma trilha (mundo + dificuldade) o jogador já
// concluiu. Regra do jogo: o desafio N só libera depois que o desafio N-1
// foi concluído com sucesso; o desafio 1 sempre começa liberado.
//
// Por enquanto isso fica salvo no localStorage do navegador, seguindo o
// mesmo padrão "hardcoded/local no frontend" já usado em recompensas.js e
// em ResolverDesafio. O model Progresso já existe no schema do Prisma
// (backend/prisma/schema.prisma), mas ainda não tem rota exposta — quando
// existir (ex: POST /api/progresso), estas funções devem ser trocadas por
// chamadas à API em vez de localStorage.

const PREFIXO_CHAVE = "codejourney:progresso";

function chave(mundoId, dificuldade) {
  return `${PREFIXO_CHAVE}:${mundoId}:${dificuldade}`;
}

export function obterConcluidos(mundoId, dificuldade) {
  try {
    const bruto = localStorage.getItem(chave(mundoId, dificuldade));
    const lista = bruto ? JSON.parse(bruto) : [];
    return new Set(lista);
  } catch {
    // localStorage indisponível (modo privado, SSR, etc.) ou dado corrompido
    return new Set();
  }
}

export function marcarConcluido(mundoId, dificuldade, desafioId) {
  try {
    const concluidos = obterConcluidos(mundoId, dificuldade);
    concluidos.add(Number(desafioId));
    localStorage.setItem(
      chave(mundoId, dificuldade),
      JSON.stringify([...concluidos])
    );
  } catch {
    // sem localStorage não tem como persistir; a trilha simplesmente não
    // lembra o progresso nesta sessão
  }
}

// Desafio 1 sempre liberado; os demais exigem o anterior concluído.
export function desafioLiberado(mundoId, dificuldade, desafioId) {
  const numero = Number(desafioId);
  if (numero <= 1) return true;
  return obterConcluidos(mundoId, dificuldade).has(numero - 1);
}
