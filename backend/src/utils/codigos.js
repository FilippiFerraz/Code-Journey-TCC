// Códigos de 6 dígitos enviados por e-mail (recuperação de senha, confirmação
// de cadastro e troca de e-mail): geração e conferência seguras.
//
// Por que existe: o código tem só 900 mil valores possíveis e vale 15
// minutos. O limite de tentativas por IP (express-rate-limit) fica na
// MEMÓRIA de cada instância da Vercel — some a cada partida a frio, não é
// compartilhado entre instâncias e o atacante pode trocar de IP. Dava pra
// tentar códigos até acertar e trocar a senha de qualquer conta. Agora o
// limite é POR CÓDIGO e fica no banco: errou MAX_TENTATIVAS vezes, o código
// é descartado e só um novo e-mail libera outro.
const crypto = require("crypto");
const prisma = require("../config/prisma");

const MAX_TENTATIVAS = 5;

// Math.random() não é feito pra segredos (é previsível); randomInt usa o
// gerador criptográfico do sistema.
function gerarCodigo() {
  return String(crypto.randomInt(100000, 1000000));
}

// Comparação em tempo constante (não vaza, pelo tempo de resposta, quantos
// dígitos do começo estavam certos).
function codigosIguais(a, b) {
  const x = Buffer.from(String(a ?? ""));
  const y = Buffer.from(String(b ?? ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function erro400(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

// Confere o código informado contra o guardado em `usuario`.
//   campos: { codigo, expiraEm, tentativas } — nomes das colunas em Usuario
//   descartar: colunas a limpar quando o código for "queimado" (ex: o
//     emailPendente da troca de e-mail)
// Cada chamada RESERVA uma tentativa no banco de forma atômica ANTES de
// comparar (updateMany condicional): nem tentativas em paralelo passam do
// limite. Acertou: quem chamou limpa o código (e zera as tentativas) no
// mesmo update que aplica a ação. Lança erro 400 em qualquer falha.
async function conferirCodigo(usuario, codigoInformado, { campos, mensagens = {}, descartar = [] }) {
  const { codigo, expiraEm, tentativas } = campos;
  const semCodigo = mensagens.semCodigo ?? "Código inválido. Peça um novo código.";

  if (!usuario || !usuario[codigo] || !usuario[expiraEm]) throw erro400(semCodigo);

  const limpar = Object.fromEntries([codigo, expiraEm, ...descartar].map((c) => [c, null]));

  if (new Date() > usuario[expiraEm]) {
    throw erro400(mensagens.expirado ?? "Código expirado. Peça um novo código.");
  }

  const { count } = await prisma.usuario.updateMany({
    where: { id: usuario.id, [codigo]: usuario[codigo], [tentativas]: { lt: MAX_TENTATIVAS } },
    data: { [tentativas]: { increment: 1 } },
  });
  if (count === 0) {
    // limite atingido (ou o código acabou de ser trocado/usado): queima o código
    await prisma.usuario.updateMany({
      where: { id: usuario.id, [codigo]: usuario[codigo] },
      data: { ...limpar, [tentativas]: 0 },
    });
    throw erro400("Muitas tentativas com este código. Peça um novo código.");
  }

  if (!codigosIguais(codigoInformado, usuario[codigo])) {
    const restantes = MAX_TENTATIVAS - (usuario[tentativas] + 1);
    if (restantes <= 0) {
      await prisma.usuario.updateMany({
        where: { id: usuario.id, [codigo]: usuario[codigo] },
        data: { ...limpar, [tentativas]: 0 },
      });
      throw erro400("Código incorreto. Este código foi bloqueado — peça um novo código.");
    }
    throw erro400(mensagens.incorreto ?? "Código incorreto.");
  }

  return usuario;
}

module.exports = { MAX_TENTATIVAS, gerarCodigo, conferirCodigo };
