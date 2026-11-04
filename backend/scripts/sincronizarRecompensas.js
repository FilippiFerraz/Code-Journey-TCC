// scripts/sincronizarRecompensas.js
//
// Entrega o item de recompensa a todo jogador que já concluiu um desafio que
// dá item, mas ainda não tem esse item no inventário. Acontece quando um
// desafio ganha (ou troca de) item DEPOIS que alguém já o concluiu — pelo
// seed ou pelo painel de admin. Quem rejogar o desafio também recebe o item
// sozinho (ver progresso.service.js), mas este script resolve pra todo mundo
// de uma vez, sem precisar rejogar.
//
// Não duplica: quem já tem o item não recebe outro (concederItemSeNaoTiver).
// Pode rodar quantas vezes quiser.
//
// Uso:
//   npm run recompensas:sincronizar

require("dotenv").config();
const prisma = require("../src/config/prisma");
const { concederItemSeNaoTiver } = require("../src/services/personagem.service");

async function main() {
  const desafios = await prisma.desafio.findMany({
    where: { itemRecompensaId: { not: null } },
    select: {
      id: true,
      mundoId: true,
      numero: true,
      titulo: true,
      itemRecompensa: { select: { id: true, nome: true } },
    },
    orderBy: [{ mundoId: "asc" }, { numero: "asc" }],
  });

  let entregues = 0;
  for (const desafio of desafios) {
    const concluidos = await prisma.progresso.findMany({
      where: { desafioId: desafio.id, concluido: true },
      select: { usuarioId: true },
    });

    for (const { usuarioId } of concluidos) {
      // Conta excluída (soft delete) não recebe item.
      const ativo = await prisma.usuario.count({ where: { id: usuarioId } });
      if (!ativo) continue;

      const { concedido } = await concederItemSeNaoTiver(usuarioId, desafio.itemRecompensa.id);
      if (concedido) {
        entregues++;
        console.log(
          `Usuário ${usuarioId} recebeu "${desafio.itemRecompensa.nome}" (Mundo ${desafio.mundoId}, desafio ${desafio.numero}).`
        );
      }
    }
  }

  console.log(
    entregues
      ? `\n${entregues} item(ns) entregue(s).`
      : "Nenhum item pendente — todo mundo já tem as recompensas dos desafios que concluiu."
  );
}

main()
  .catch((erro) => {
    console.error("Erro ao sincronizar recompensas:", erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
