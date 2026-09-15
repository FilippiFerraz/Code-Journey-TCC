const prisma = require("../config/prisma");

const LIMITE_PADRAO = 30;
const LIMITE_MAXIMO = 100;

// Grava uma linha de auditoria — chamado no fim de cada operação de
// escrita dos services de admin (ver desafio.service.js, admin.service.js).
// nomeUsuario/role são um retrato do momento da ação, não um join: assim o
// log continua legível mesmo se o admin for renomeado/rebaixado depois.
async function registrarLog({
  usuarioId,
  nomeUsuario,
  role,
  acao,
  entidade,
  entidadeId,
  descricao,
  alteracoes,
}) {
  return prisma.logAdmin.create({
    data: {
      usuarioId,
      nomeUsuario,
      role,
      acao,
      entidade,
      entidadeId: entidadeId ?? null,
      descricao: descricao ?? null,
      alteracoes: alteracoes && Object.keys(alteracoes).length > 0 ? alteracoes : undefined,
    },
  });
}

// Lista os logs mais recentes primeiro, com paginação e filtro opcional por
// ação/entidade — ver AdminLogs.jsx.
async function listarLogs({ pagina, limite, acao, entidade }) {
  const paginaNumero = Math.max(1, Number(pagina) || 1);
  const limiteNumero = Math.min(LIMITE_MAXIMO, Math.max(1, Number(limite) || LIMITE_PADRAO));

  const where = {
    ...(acao ? { acao } : {}),
    ...(entidade ? { entidade } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.logAdmin.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (paginaNumero - 1) * limiteNumero,
      take: limiteNumero,
    }),
    prisma.logAdmin.count({ where }),
  ]);

  return {
    logs,
    pagina: paginaNumero,
    limite: limiteNumero,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limiteNumero)),
  };
}

module.exports = { registrarLog, listarLogs };
