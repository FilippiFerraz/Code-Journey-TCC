const prisma = require("../config/prisma");
const { buscarOuCriarPersonagem } = require("./personagem.service");

// Libera o jogo inteiro pra uma conta: marca TODOS os desafios como
// concluídos (o que abre todos os portais, os minijogos do mapa e deixa os
// baús prontos pra abrir) e coloca no inventário todos os itens do jogo.
// Usado pelo painel de administração (POST /api/admin/usuarios/:id/liberar-tudo)
// e pelo script de linha de comando (npm run conta:liberar-tudo).
//
// - Desafio que a conta já tinha concluído fica como está (XP e tempo dela).
// - Os concluídos por aqui não dão XP nem moedas (xpGanho 0): a conta não
//   sobe no ranking por causa disso.
// - Desafio de várias etapas fica com todas as etapas vencidas.
// - Os baús NÃO são abertos: ficam disponíveis pra conta abrir no jogo.
// - Não duplica nada. Pode rodar quantas vezes quiser.
//
// Tudo em poucas operações em lote (não uma consulta por desafio/item) —
// no servidor da Vercel cada ida ao banco custa uma viagem de rede.
// Devolve { desafiosLiberados, totalDesafios, itensNovos, totalItens }.
async function liberarTudo(usuarioId) {
  const [desafios, existentes, itens, personagem] = await Promise.all([
    prisma.desafio.findMany({ select: { id: true, alternativas: true } }),
    prisma.progresso.findMany({ where: { usuarioId }, select: { desafioId: true, concluido: true } }),
    prisma.item.findMany({ select: { id: true } }),
    buscarOuCriarPersonagem(usuarioId),
  ]);

  const etapasDe = (desafio) =>
    Array.isArray(desafio.alternativas?.etapas) ? desafio.alternativas.etapas.length : 0;
  const progressoPorDesafio = new Map(existentes.map((p) => [p.desafioId, p]));
  const agora = new Date();

  const semProgresso = desafios.filter((d) => !progressoPorDesafio.has(d.id));
  const naoConcluidos = desafios.filter((d) => progressoPorDesafio.get(d.id)?.concluido === false);

  const itensNovos = await prisma.$transaction(async (tx) => {
    await tx.progresso.createMany({
      data: semProgresso.map((d) => ({
        usuarioId,
        desafioId: d.id,
        concluido: true,
        tentativas: 1,
        xpGanho: 0,
        dataConclusao: agora,
        etapasConcluidas: etapasDe(d),
      })),
      skipDuplicates: true,
    });
    // os já tentados (e não vencidos) mantêm as tentativas; só concluem
    for (const d of naoConcluidos) {
      await tx.progresso.update({
        where: { usuarioId_desafioId: { usuarioId, desafioId: d.id } },
        data: { concluido: true, dataConclusao: agora, etapasConcluidas: etapasDe(d) },
      });
    }
    const { count } = await tx.itemPersonagem.createMany({
      data: itens.map((item) => ({ personagemId: personagem.id, itemId: item.id })),
      skipDuplicates: true,
    });
    return count;
  });

  return {
    desafiosLiberados: semProgresso.length + naoConcluidos.length,
    totalDesafios: desafios.length,
    itensNovos,
    totalItens: itens.length,
  };
}

module.exports = { liberarTudo };
