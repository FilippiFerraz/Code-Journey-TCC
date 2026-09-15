const ExcelJS = require("exceljs");
const prisma = require("../config/prisma");
const { registrarLog } = require("./log.service");

const PAPEIS_VALIDOS = ["jogador", "administrador"];
const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function erroNaoEncontrado(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 404;
  return erro;
}

// Usa prisma.semFiltro de propósito: a tabela de administração precisa ver
// contas desativadas (deletedAt preenchido) pra poder reativá-las — o
// cliente padrão (ver config/prisma.js) esconde isso em toda leitura normal.
async function buscarUsuarioOuFalhar(usuarioId) {
  const usuario = await prisma.semFiltro.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw erroNaoEncontrado("Usuário não encontrado.");
  return usuario;
}

// Mesmo filtro de busca usado pela tabela (listarUsuarios) e pela
// exportação em XLSX (exportarUsuariosXlsx) — os dois precisam concordar,
// senão "exportar" traria gente que não apareceu na busca da tela.
function construirFiltroBusca(busca) {
  const termo = (busca ?? "").trim();
  if (!termo) return undefined;

  return {
    OR: [
      { nome: { contains: termo, mode: "insensitive" } },
      { email: { contains: termo, mode: "insensitive" } },
    ],
  };
}

// Lista os usuários cadastrados (ativos e desativados) pra tabela de
// administração, com busca por nome/e-mail e paginação.
async function listarUsuarios({ busca, pagina, limite }) {
  const paginaNumero = Math.max(1, Number(pagina) || 1);
  const limiteNumero = Math.min(LIMITE_MAXIMO, Math.max(1, Number(limite) || LIMITE_PADRAO));
  const where = construirFiltroBusca(busca);

  const [usuarios, total] = await Promise.all([
    prisma.semFiltro.usuario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        xpTotal: true,
        criadoEm: true,
        deletedAt: true,
      },
      orderBy: { criadoEm: "desc" },
      skip: (paginaNumero - 1) * limiteNumero,
      take: limiteNumero,
    }),
    prisma.semFiltro.usuario.count({ where }),
  ]);

  return {
    usuarios: usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      xpTotal: usuario.xpTotal,
      criadoEm: usuario.criadoEm,
      ativo: !usuario.deletedAt,
    })),
    pagina: paginaNumero,
    limite: limiteNumero,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limiteNumero)),
  };
}

// Promove/remove administrador. Um admin nunca altera o próprio papel por
// aqui — evita ele se trancar fora do painel sem querer. "admin" é
// { id, nome, role } (ver middlewares/admin.middleware.js), usado tanto pra
// essa trava quanto pra gravar quem fez a alteração em LogAdmin.
async function alterarRole(admin, usuarioId, role) {
  if (!PAPEIS_VALIDOS.includes(role)) {
    throw erroDeValidacao('Papel inválido — use "jogador" ou "administrador".');
  }
  if (usuarioId === admin.id) {
    throw erroDeValidacao("Você não pode alterar seu próprio papel.");
  }

  const usuario = await buscarUsuarioOuFalhar(usuarioId);

  const atualizado = await prisma.semFiltro.usuario.update({
    where: { id: usuarioId },
    data: { role },
  });

  if (role !== usuario.role) {
    await registrarLog({
      usuarioId: admin.id,
      nomeUsuario: admin.nome,
      role: admin.role,
      acao: "usuario.role",
      entidade: "Usuario",
      entidadeId: usuarioId,
      descricao: `Alterou o papel de "${usuario.nome || usuario.email}" de "${usuario.role}" para "${role}".`,
      alteracoes: { role: { de: usuario.role, para: role } },
    });
  }

  return { id: atualizado.id, role: atualizado.role };
}

// Desativa (soft delete) ou reativa uma conta. Mesma trava de segurança:
// um admin não desativa a própria conta por aqui.
async function alterarAtivo(admin, usuarioId, ativo) {
  if (usuarioId === admin.id) {
    throw erroDeValidacao("Você não pode desativar sua própria conta.");
  }

  const usuario = await buscarUsuarioOuFalhar(usuarioId);
  const ativoAntes = !usuario.deletedAt;

  const atualizado = await prisma.semFiltro.usuario.update({
    where: { id: usuarioId },
    data: { deletedAt: ativo ? null : new Date() },
  });

  if (ativo !== ativoAntes) {
    await registrarLog({
      usuarioId: admin.id,
      nomeUsuario: admin.nome,
      role: admin.role,
      acao: "usuario.ativo",
      entidade: "Usuario",
      entidadeId: usuarioId,
      descricao: `${ativo ? "Reativou" : "Desativou"} a conta de "${usuario.nome || usuario.email}".`,
      alteracoes: { ativo: { de: ativoAntes, para: ativo } },
    });
  }

  return { id: atualizado.id, ativo: !atualizado.deletedAt };
}

// Reinicia o progresso de um jogador do zero: apaga todo o histórico de
// Progresso (desafios concluídos/tentativas), todos os itens do inventário
// (ItemPersonagem), os baús de fim de mundo já abertos (senão ficariam
// travados mesmo depois de refazer as trilhas) e zera Usuario.xpTotal — o
// personagem em si volta pra configuração padrão em vez de ser apagado.
// A conta (nome, e-mail, senha, papel, status) não é tocada — isso não é
// exclusão de conta, é só o progresso de jogo.
//
// Roda tudo em uma transação no cliente SEM o filtro de soft delete
// (prisma.semFiltro.$transaction, não prisma.$transaction) — assim
// tx.usuario.update funciona mesmo se a conta estiver desativada, sem cair
// na extensão que força "deletedAt: null" no where (ver config/prisma.js).
async function resetarProgresso(admin, usuarioId) {
  const usuario = await buscarUsuarioOuFalhar(usuarioId);

  const resultado = await prisma.semFiltro.$transaction(async (tx) => {
    const personagem = await tx.personagem.findUnique({ where: { usuarioId } });

    const totalItens = personagem
      ? await tx.itemPersonagem.count({ where: { personagemId: personagem.id } })
      : 0;
    const totalProgresso = await tx.progresso.count({ where: { usuarioId } });
    const totalBaus = await tx.bauMundo.count({ where: { usuarioId } });

    if (personagem) {
      await tx.itemPersonagem.deleteMany({ where: { personagemId: personagem.id } });
      await tx.personagem.update({
        where: { id: personagem.id },
        data: { nome: "Guerreiro", nivel: 1, vidaAtual: 100, vidaMax: 100, imagemUrl: null },
      });
    }

    await tx.progresso.deleteMany({ where: { usuarioId } });
    await tx.bauMundo.deleteMany({ where: { usuarioId } });
    await tx.usuario.update({ where: { id: usuarioId }, data: { xpTotal: 0 } });

    return { totalItens, totalProgresso, totalBaus };
  });

  await registrarLog({
    usuarioId: admin.id,
    nomeUsuario: admin.nome,
    role: admin.role,
    acao: "usuario.resetarProgresso",
    entidade: "Usuario",
    entidadeId: usuarioId,
    descricao:
      `Reiniciou o progresso de "${usuario.nome || usuario.email}" — removeu ` +
      `${resultado.totalProgresso} desafio(s) concluído(s), ${resultado.totalItens} ` +
      `item(ns) e ${resultado.totalBaus} baú(s) aberto(s).`,
    alteracoes: {
      xpTotal: { de: usuario.xpTotal, para: 0 },
      desafiosConcluidos: { de: resultado.totalProgresso, para: 0 },
      itensInventario: { de: resultado.totalItens, para: 0 },
      bausAbertos: { de: resultado.totalBaus, para: 0 },
    },
  });

  return { id: usuarioId, xpTotal: 0 };
}

// Gera a planilha XLSX com os mesmos usuários (e o mesmo filtro de busca)
// que a tabela de administração mostra — sem paginação, pra sair tudo que
// bate com a busca de uma vez. Devolve o arquivo já como Buffer, pronto
// pro controller mandar como download.
async function exportarUsuariosXlsx({ busca }) {
  const usuarios = await prisma.semFiltro.usuario.findMany({
    where: construirFiltroBusca(busca),
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      xpTotal: true,
      criadoEm: true,
      deletedAt: true,
    },
    orderBy: { criadoEm: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const planilha = workbook.addWorksheet("Usuários");

  planilha.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Nome", key: "nome", width: 26 },
    { header: "E-mail", key: "email", width: 32 },
    { header: "Papel", key: "role", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "XP total", key: "xpTotal", width: 12 },
    { header: "Cadastrado em", key: "criadoEm", width: 18 },
  ];

  const linhaCabecalho = planilha.getRow(1);
  linhaCabecalho.font = { bold: true, color: { argb: "FFFFFFFF" } };
  linhaCabecalho.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF8A2FB8" },
  };

  usuarios.forEach((usuario) => {
    planilha.addRow({
      id: usuario.id,
      nome: usuario.nome || "—",
      email: usuario.email || "—",
      role: usuario.role === "administrador" ? "Administrador" : "Jogador",
      status: usuario.deletedAt ? "Desativado" : "Ativo",
      xpTotal: usuario.xpTotal,
      criadoEm: usuario.criadoEm ? usuario.criadoEm.toLocaleDateString("pt-BR") : "—",
    });
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = {
  listarUsuarios,
  alterarRole,
  alterarAtivo,
  resetarProgresso,
  exportarUsuariosXlsx,
};
