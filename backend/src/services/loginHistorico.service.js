const prisma = require("../config/prisma");
const { escaparLike } = require("../utils/busca");
const { limparDadosVencidos } = require("./privacidade.service");

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

// Grava uma linha a cada tentativa de login (sucesso ou falha) — chamado no
// fim de cada desfecho de auth.service.js::login. Nunca deve derrubar o
// login se a gravação falhar (ver o try/catch em volta da chamada lá).
async function registrarTentativaLogin({
  usuarioId,
  nomeUsuario,
  emailTentado,
  sucesso,
  motivoFalha,
  ip,
  userAgent,
}) {
  // LGPD (retenção): apaga histórico com mais de 6 meses e cadastros nunca
  // confirmados — no máximo a cada 6 h por instância (ver privacidade.service.js).
  // Falha aqui nunca atrapalha o login.
  limparDadosVencidos().catch((erro) => console.error("Limpeza de dados vencidos falhou:", erro.message));

  return prisma.loginHistorico.create({
    data: {
      usuarioId: usuarioId ?? null,
      nomeUsuario: nomeUsuario ?? null,
      emailTentado,
      sucesso,
      motivoFalha: motivoFalha ?? null,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    },
  });
}

// Mesmo filtro usado pela busca livre da tela (nome ou e-mail digitado no
// momento da tentativa) — bate em emailTentado/nomeUsuario, os campos
// "retrato" gravados na hora, não num join com Usuario (mesmo motivo do
// LogAdmin: continua pesquisável mesmo se a conta for renomeada, excluída,
// ou nem existir — caso de e-mail errado).
function construirFiltroBusca(busca) {
  const termo = escaparLike((busca ?? "").trim());
  if (!termo) return undefined;

  return {
    OR: [
      { emailTentado: { contains: termo, mode: "insensitive" } },
      { nomeUsuario: { contains: termo, mode: "insensitive" } },
    ],
  };
}

// Lista o histórico de login mais recente primeiro, com busca por
// nome/e-mail, filtro opcional por usuário exato (ver "Ver logins" em
// AdminUsuarios.jsx) e por sucesso/falha, e paginação — ver
// AdminLoginHistorico.jsx.
async function listarLoginHistorico({ busca, usuarioId, sucesso, pagina, limite }) {
  const paginaNumero = Math.max(1, Number(pagina) || 1);
  const limiteNumero = Math.min(LIMITE_MAXIMO, Math.max(1, Number(limite) || LIMITE_PADRAO));

  const usuarioIdNumero = Number(usuarioId);
  const where = {
    ...construirFiltroBusca(busca),
    ...(Number.isInteger(usuarioIdNumero) ? { usuarioId: usuarioIdNumero } : {}),
    ...(sucesso === "true" || sucesso === "false" ? { sucesso: sucesso === "true" } : {}),
  };

  const [registros, total] = await Promise.all([
    prisma.loginHistorico.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (paginaNumero - 1) * limiteNumero,
      take: limiteNumero,
    }),
    prisma.loginHistorico.count({ where }),
  ]);

  return {
    registros,
    pagina: paginaNumero,
    limite: limiteNumero,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limiteNumero)),
  };
}

module.exports = { registrarTentativaLogin, listarLoginHistorico };
