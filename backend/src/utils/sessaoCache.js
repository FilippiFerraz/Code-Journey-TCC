// Memória curta de "esta conta existe e está ativa", usada por
// auth.middleware.js. Sem ela, TODA requisição autenticada fazia uma consulta
// ao banco só pra reconfirmar a conta — e na Vercel cada consulta é uma ida e
// volta de rede até o banco.
//
// O custo: uma conta excluída/desativada pode continuar sendo aceita por até
// TTL_MS na instância onde ela estava em memória. Na instância que executa a
// exclusão o efeito é imediato (esquecerConta é chamada em conta.service.js e
// admin.service.js).
const TTL_MS = 30 * 1000;
const LIMITE_ENTRADAS = 5000;
const validoAte = new Map();

function contaConfirmadaRecentemente(usuarioId) {
  const limite = validoAte.get(usuarioId);
  if (limite === undefined) return false;
  if (limite < Date.now()) {
    validoAte.delete(usuarioId);
    return false;
  }
  return true;
}

function lembrarContaAtiva(usuarioId) {
  if (validoAte.size >= LIMITE_ENTRADAS) validoAte.clear();
  validoAte.set(usuarioId, Date.now() + TTL_MS);
}

function esquecerConta(usuarioId) {
  validoAte.delete(usuarioId);
}

module.exports = { contaConfirmadaRecentemente, lembrarContaAtiva, esquecerConta };
