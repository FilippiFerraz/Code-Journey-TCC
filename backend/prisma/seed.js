// prisma/seed.js
//
// Popula o banco com o conteúdo que hoje está hardcoded no frontend
// (ResolverDesafio.jsx e data/recompensas.js), pra não depender de inserir
// tudo manualmente pelo SQL Editor do Neon. Roda com `npx prisma db seed`
// (ou automaticamente depois de `prisma migrate dev`, via a config
// "prisma.seed" no package.json).
//
// Só semeia os desafios que já têm conteúdo real (1 e 2, trilha
// "iniciante" do mundo 1 — ver Home.jsx e SelecionarDificuldade.jsx pros
// ids reais). Os desafios 3-6 ainda não têm enunciado definido em nenhum
// lugar do projeto — quando existirem, adicione aqui em vez de inventar
// conteúdo placeholder no banco.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MUNDO_ID = 1;
const DIFICULDADE = "iniciante";

// Itens reais de equipamento, concedidos como recompensa ao concluir um
// desafio (ver Desafio.itemRecompensaId). O "tipo" precisa bater com um
// slot de EditarPersonagem.jsx: capacete|peitoral|sapato|arma|costas|acessorios.
const itens = [
  {
    nome: "Peitoral de Ferro",
    tipo: "peitoral",
    raridade: "comum",
    descricao:
      "Uma armadura simples, mas resistente — prova de que você sobreviveu ao seu primeiro combate de código.",
    icone: "🛡️",
    // nome do arquivo em frontend/src/assets/images — ver data/itemImagens.js,
    // que resolve isso pra imagem estática real (não é uma URL de verdade)
    imagemUrl: "Item_Peitoral.png",
    bonusDefesa: 5,
  },
];

// Item não tem uma coluna @unique (só "id"), então o upsert por nome é
// manual aqui em vez de usar prisma.item.upsert.
async function semearItemPorNome(dados) {
  const existente = await prisma.item.findFirst({ where: { nome: dados.nome } });
  if (existente) {
    return prisma.item.update({ where: { id: existente.id }, data: dados });
  }
  return prisma.item.create({ data: dados });
}

async function main() {
  const itensSemeados = {};
  for (const item of itens) {
    itensSemeados[item.nome] = await semearItemPorNome(item);
    console.log(`Item "${item.nome}" semeado.`);
  }

  const peitoralDeFerro = itensSemeados["Peitoral de Ferro"];

  const desafios = [
    {
      mundoId: MUNDO_ID,
      dificuldade: DIFICULDADE,
      numero: 1,
      titulo: "Print de Dados",
      enunciado: "Qual comando mostra uma mensagem no console em JavaScript?",
      dica: "É o comando que todo programador usa para conferir se o código chegou até ali.",
      alternativas: [
        { id: "a", texto: 'console.log("Olá, mundo!")', correta: true },
        { id: "b", texto: 'print("Olá, mundo!")', correta: false },
        { id: "c", texto: 'System.out.println("Olá, mundo!")', correta: false },
        { id: "d", texto: 'echo "Olá, mundo!"', correta: false },
      ],
      // recompensa é um item real — entra no inventário (ItemPersonagem)
      // na primeira vez que o jogador conclui este desafio
      tipoRecompensa: "item",
      nomeRecompensa: peitoralDeFerro.nome,
      descricaoRecompensa: peitoralDeFerro.descricao,
      iconeRecompensa: peitoralDeFerro.icone,
      itemRecompensaId: peitoralDeFerro.id,
    },
    {
      mundoId: MUNDO_ID,
      dificuldade: DIFICULDADE,
      numero: 2,
      titulo: "Tipos na Atribuição",
      enunciado:
        'Qual é o valor e o tipo de "x" depois de executar este código?\n\nlet x = "5";\nx = x + 1;',
      dica: "Em JavaScript, o operador + entre uma string e um número concatena, não soma — o número é convertido para texto.",
      alternativas: [
        { id: "a", texto: '"51" (string)', correta: true },
        { id: "b", texto: "6 (number)", correta: false },
        { id: "c", texto: "51 (number)", correta: false },
        { id: "d", texto: "NaN (number)", correta: false },
      ],
      // ainda sem Item real associado — recompensa só textual por enquanto
      tipoRecompensa: "item",
      nomeRecompensa: "1 Item Raro: Um Pergaminho",
      descricaoRecompensa: "Pergaminho com dicas secretas de código!",
      iconeRecompensa: "📜",
    },
  ];

  for (const desafio of desafios) {
    await prisma.desafio.upsert({
      where: {
        mundoId_dificuldade_numero: {
          mundoId: desafio.mundoId,
          dificuldade: desafio.dificuldade,
          numero: desafio.numero,
        },
      },
      update: desafio,
      create: desafio,
    });
    console.log(`Desafio ${desafio.numero} (${desafio.titulo}) semeado.`);
  }
}

main()
  .catch((erro) => {
    console.error("Erro ao semear o banco:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
