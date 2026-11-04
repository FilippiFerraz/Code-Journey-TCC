const { PrismaClient } = require("@prisma/client");

// Soft delete de Usuario: em vez de apagar a linha, marcamos "deletedAt" e
// esse campo fica sempre invisível nas leituras normais — nenhum service
// precisa lembrar de filtrar isso manualmente em toda query.
//
// Ainda não existe nenhum fluxo de exclusão de usuário implementado (nem
// endpoint, nem UI) — esta é só a infraestrutura, pronta pra quando esse
// fluxo existir. Quando existir, basta chamar prisma.usuario.delete(...)
// normalmente: a extensão abaixo intercepta e transforma isso num soft
// delete de verdade.
//
// Observação: como Usuario.email tem @unique e o soft delete não libera
// esse e-mail pra um novo cadastro (a linha antiga continua ocupando o
// valor), o fluxo de exclusão futuro provavelmente vai precisar decidir o
// que fazer com o e-mail no momento do soft delete (ex: anexar um sufixo)
// se quiser permitir recadastro com o mesmo e-mail depois.

// Cliente sem a extensão — só pra poder olhar um usuário mesmo que ele
// esteja com deletedAt preenchido (ex: usuarioFoiExcluido abaixo). Não
// exportado: nenhum outro lugar do código deve usar isso pra ler usuário,
// senão volta a vazar contas excluídas nas queries normais.
const prismaSemFiltro = new PrismaClient();

const prisma = prismaSemFiltro.$extends({
  name: "softDeleteUsuario",
  client: {
    // Usado por login() em auth.service.js pra distinguir "e-mail nunca
    // existiu" de "e-mail existe mas a conta foi desativada", e mostrar
    // uma mensagem melhor nesse segundo caso.
    async usuarioFoiExcluido(email) {
      const usuario = await prismaSemFiltro.usuario.findUnique({ where: { email } });
      return Boolean(usuario?.deletedAt);
    },
  },
  query: {
    usuario: {
      async findUnique({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async update({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async updateMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // "Apagar" um usuário só marca deletedAt — a linha continua no banco,
      // preservando a integridade com Progresso/Personagem/Ranking.
      async delete({ args }) {
        return prisma.usuario.update({
          where: args.where,
          data: { deletedAt: new Date() },
        });
      },
      async deleteMany({ args }) {
        return prisma.usuario.updateMany({
          where: args.where,
          data: { deletedAt: new Date() },
        });
      },
    },
  },
});

// Escape hatch só pro painel de administração (ver admin.service.js): listar
// TODOS os usuários (inclusive desativados, pra poder reativar) e alternar
// role/deletedAt sem a query forçar "deletedAt: null" no meio do caminho.
// Continua sendo o mesmo cliente de sempre pra todo o resto do código —
// só ganhou essa propriedade extra.
prisma.semFiltro = prismaSemFiltro;

module.exports = prisma;
