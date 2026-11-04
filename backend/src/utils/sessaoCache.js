// Memória curta de "esta conta existe, está ativa e está na versão de
// sessão X", usada por auth.middleware.js. Sem ela, TODA requisição
// autenticada fazia uma consulta ao banco só pra reconfirmar a conta — e na
// Vercel cada consulta é uma ida e volta de rede até o banco.
//
// O custo: uma conta excluída/desativada (ou com a senha redefinida) pode
// continuar sendo aceita por até TTL_MS nas OUTRAS instâncias onde ela
// estava em memória. Na instância que executa a ação o efeito é imediato
// (esquecerConta é chamada em conta.service.js, admin.service.js e
// auth.service.js).
const TTL_MS = 30 * 1000;
const LIMITE_ENTRADAS = 5000;
const cache = new Map(); // usuarioId -> { validoAte, sessaoVersao }

// Versão de sessão conhecida da conta, ou undefined se não está em memória
// (ou expirou).
function versaoEmCache(usuarioId) {
  const entrada = cache.get(usuarioId);
  if (!entrada) return undefined;
  if (entrada.validoAte < Date.now()) {
    cache.delete(usuarioId);
    return undefined;
  }
  return entrada.sessaoVersao;
}

function lembrarContaAtiva(usuarioId, sessaoVersao) {
  if (cache.size >= LIMITE_ENTRADAS) cache.clear();
  cache.set(usuarioId, { validoAte: Date.now() + TTL_MS, sessaoVersao });
}

function esquecerConta(usuarioId) {
  cache.delete(usuarioId);
}

module.exports = { versaoEmCache, lembrarContaAtiva, esquecerConta };
