// prisma/seed.js
//
// Popula o banco com o conteúdo que hoje está hardcoded no frontend
// (ResolverDesafio.jsx), pra não depender de inserir
// tudo manualmente pelo SQL Editor do Neon. Roda com `npx prisma db seed`
// (ou automaticamente depois de `prisma migrate dev`, via a config
// "prisma.seed" no package.json).
//
// Só semeia os desafios que já têm conteúdo real: 1 a 6 (trilha completa)
// da trilha "iniciante" do mundo 1, e 1 e 2 da trilha "iniciante" do mundo 2
// (ver Home.jsx e SelecionarDificuldade.jsx pros ids reais). Os demais
// ainda não têm enunciado definido em nenhum lugar do projeto — quando
// existirem, adicione aqui em vez de inventar conteúdo placeholder no banco.

const { PrismaClient } = require("@prisma/client");
const desafioIA = require("./desafios/desafioIA");
const desafiosPortal3 = require("./desafios/portal3");
const { validarAlternativas } = require("../src/services/etapas.service");

const prisma = new PrismaClient();

const MUNDO_ID = 1;
const DIFICULDADE = "iniciante";

// ---------- Itens de equipamento ----------
//
// O personagem é montado em camadas (ver frontend/src/data/spritesPersonagem.js):
// cada FORMA (elmo, armadura...) é desenhada uma vez e recolorida em um
// MATERIAL por portal pelo script frontend/scripts/gerarItensPersonagem.mjs.
// Item.imagemUrl guarda a CHAVE do sprite gerado ("peitoral/armadura--ferro").
//
// "tipo" é o slot de EditarPersonagem.jsx: capacete|peitoral|arma|costas|botas.
const FORMAS = {
  elmo: { tipo: "capacete", icone: "🪖", descricao: "Protege a cabeça nas batalhas de código.", bonus: { bonusDefesa: 2 } },
  armadura: { tipo: "peitoral", icone: "🛡️", descricao: "Uma armadura que aguenta os golpes mais traiçoeiros.", bonus: { bonusDefesa: 5 } },
  espada: { tipo: "arma", icone: "🗡️", descricao: "Uma lâmina afiada para cortar bugs pela raiz.", bonus: { bonusAtaque: 3 } },
  capa: { tipo: "costas", icone: "🧣", descricao: "Tremula ao vento a cada desafio vencido.", bonus: { bonusDefesa: 1 } },
  botas: { tipo: "botas", icone: "🥾", descricao: "Passos firmes em qualquer trilha.", bonus: { bonusDefesa: 1 } },
};

// Um material por portal (mesmos ids de frontend/scripts/materiais.json).
// "nivel" multiplica os bônus da forma.
const MATERIAIS = {
  ferro: { nivel: 1, raridade: "comum", frase: "Feito de ferro simples e confiável." },
  elfico: { nivel: 2, raridade: "raro", frase: "Forjado com a leveza das artes élficas." },
  dourado: { nivel: 3, raridade: "epico", frase: "Banhado no ouro da Arena do Dragão." },
};

const NOMES = {
  elmo: { ferro: "Elmo de Ferro", elfico: "Elmo Élfico", dourado: "Elmo Dourado" },
  armadura: { ferro: "Peitoral de Ferro", elfico: "Peitoral Élfico", dourado: "Peitoral Dourado" },
  espada: { ferro: "Espada de Ferro", elfico: "Espada Élfica", dourado: "Espada Dourada" },
  capa: { ferro: "Capa do Escudeiro", elfico: "Capa Élfica", dourado: "Capa Dourada" },
  botas: { ferro: "Botas de Ferro", elfico: "Botas Élficas", dourado: "Botas Douradas" },
};

// Descrições que já existiam antes das camadas e continuam valendo.
const DESCRICOES_ORIGINAIS = {
  "Peitoral de Ferro":
    "Uma armadura simples, mas resistente — prova de que você sobreviveu ao seu primeiro combate de código.",
};

const itens = [
  ...Object.entries(FORMAS).flatMap(([forma, dadosForma]) =>
    Object.entries(MATERIAIS).map(([material, dadosMaterial]) => {
      const nome = NOMES[forma][material];
      const bonus = Object.fromEntries(
        Object.entries(dadosForma.bonus).map(([campo, valor]) => [campo, valor * dadosMaterial.nivel])
      );
      return {
        nome,
        tipo: dadosForma.tipo,
        raridade: dadosMaterial.raridade,
        descricao: DESCRICOES_ORIGINAIS[nome] ?? `${dadosForma.descricao} ${dadosMaterial.frase}`,
        icone: dadosForma.icone,
        imagemUrl: `${dadosForma.tipo}/${forma}--${material}`,
        ...bonus,
      };
    })
  ),
  // Item único (desenho próprio, sem variações de material).
  {
    nome: "Chapéu Goblin",
    tipo: "capacete",
    raridade: "comum",
    descricao:
      "Um chapéu esfarrapado tomado do Goblin derrotado — nem toda vitória vem com um troféu bonito, mas essa você ganhou.",
    icone: "🎩",
    imagemUrl: "capacete/chapeu-goblin",
    bonusDefesa: 2,
  },
  // Ícones originais em frontend/src/assets/images (Item_espada.png e
  // Item_bota.png); as camadas do personagem foram derivadas deles.
  {
    nome: "Espada de Cristal",
    tipo: "arma",
    raridade: "raro",
    descricao: "Uma lâmina de cristal azul que brilha mais forte a cada bug derrotado.",
    icone: "🗡️",
    imagemUrl: "arma/espada-de-cristal",
    bonusAtaque: 4,
  },
  {
    nome: "Botas Arcanas",
    tipo: "botas",
    raridade: "raro",
    descricao: "Botas encantadas que deixam o passo leve como um código bem indentado.",
    icone: "🥾",
    imagemUrl: "botas/botas-arcanas",
    bonusDefesa: 2,
  },
  // Importados com `npm run itens:importar` a partir de Item_asas.png e
  // Item_espada_2.png (frontend/src/assets/images).
  {
    nome: "Asas Flamejantes",
    tipo: "costas",
    raridade: "epico",
    descricao: "Asas em chamas que só se abrem para quem domina a contagem de variáveis.",
    icone: "🔥",
    imagemUrl: "costas/asas-flamejantes",
    bonusDefesa: 3,
  },
  {
    nome: "Espada Flamejante",
    tipo: "arma",
    raridade: "lendario",
    descricao: "A lâmina incandescente arrancada do Rei GoblinJS — prova de que o chefe do portal caiu.",
    icone: "⚔️",
    imagemUrl: "arma/espada-flamejante",
    bonusAtaque: 6,
  },
];

// Qual item cada desafio dá ao ser concluído pela primeira vez, por
// "mundoId/numero" (trilha iniciante). Em cada portal, os itens são do
// material daquele portal. Desafio que ainda não existe no banco é ignorado
// e recebe o item quando for cadastrado (rodando o seed de novo, ou pelo
// painel de admin). O desafio 6 do portal 2 em diante leva ao baú.
const RECOMPENSAS_POR_DESAFIO = {
  "1/1": "Peitoral de Ferro",
  "1/2": "Chapéu Goblin",
  "1/3": "Asas Flamejantes",
  "1/4": "Espada de Cristal",
  "1/5": "Botas Arcanas",
  "1/6": "Espada Flamejante",
  "2/1": "Botas Élficas",
  "2/2": "Peitoral Élfico",
  "2/3": "Espada Élfica",
  "2/4": "Capa Élfica",
  "2/5": "Elmo Élfico",
  "3/1": "Botas Douradas",
  "3/2": "Peitoral Dourado",
  "3/3": "Espada Dourada",
  "3/4": "Capa Dourada",
  "3/5": "Elmo Dourado",
};

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
    },
    {
      mundoId: MUNDO_ID,
      dificuldade: DIFICULDADE,
      numero: 3,
      titulo: "Soma de Números",
      enunciado:
        "O Esqueleto Contador guarda a passagem seguinte e só deixa passar quem consegue somar dois números corretamente.\n\nEscreva um programa em JavaScript que declare duas variáveis com valores numéricos, guarde a soma delas em uma terceira variável e exiba o resultado no console.\n\nOrganize os blocos de código na sequência correta para formar um programa JavaScript funcional.",
      dica: "toda variável só pode ser usada depois de declarada — a soma dos dois números precisa vir antes do console.log() que exibe o resultado.",
      alternativas: {
        tipo: "ordenar_blocos",
        blocos: [
          { id: "b1", codigo: "let numeroA = 4;" },
          { id: "b2", codigo: "let numeroB = 7;" },
          { id: "b3", codigo: "let soma = numeroA + numeroB;" },
          { id: "b4", codigo: "console.log(soma);" },
        ],
        ordemCorreta: ["b1", "b2", "b3", "b4"],
      },
    },
    {
      // Exercício "avaliar_codigo": o jogador arrasta cada cartão pra
      // direita ("certo") ou esquerda ("errado") em vez de escolher entre
      // alternativas ou montar blocos — ver ResolverDesafio.jsx e o
      // comentário em schema.prisma sobre os três formatos de
      // "alternativas".
      mundoId: MUNDO_ID,
      dificuldade: DIFICULDADE,
      numero: 4,
      titulo: "Certo ou Errado?",
      enunciado:
        "O Elfo Mercador quer saber se você reconhece código correto de verdade.\n\nArraste cada cartão para a direita se achar que o código está CERTO, ou para a esquerda se achar que está ERRADO. Acerte os 3 cartões para derrotá-lo.",
      dica: "leia com calma — às vezes o erro está em um detalhe pequeno, como um sinal de igual sozinho ou uma chave que não fecha.",
      alternativas: {
        tipo: "avaliar_codigo",
        cartas: [
          {
            id: "c1",
            codigo: 'function somar(a, b) {\n  return a + b;\n}\n\nconsole.log(somar(2, 3));',
            correta: true,
            explicacao:
              "Certo! A função declara os parâmetros direito, usa return pra devolver o resultado, e o console.log() exibe 5 corretamente.",
          },
          {
            id: "c2",
            codigo:
              'function saudacao(nome) {\n  console.log("Olá, " + nome);\n\nsaudacao("Ana");',
            correta: false,
            explicacao:
              "Errado! Falta a chave de fechamento } da função saudacao() — sem ela, o código tem um erro de sintaxe e nem chega a rodar.",
          },
          {
            id: "c3",
            codigo:
              'let nota = 8;\n\nif (nota >= 6) {\n  console.log("Aprovado");\n} else {\n  console.log("Reprovado");\n}',
            correta: true,
            explicacao:
              "Certo! O operador >= compara nota com 6 corretamente, e o if/else cobre os dois resultados possíveis.",
          },
        ],
      },
    },
    {
      // Exercício "montar_pocao": o jogador arrasta ingredientes de código
      // até um caldeirão, na ordem certa, com distratores misturados no
      // monte — ver ResolverDesafioPocao.jsx e o comentário em
      // schema.prisma sobre os formatos de "alternativas".
      mundoId: MUNDO_ID,
      dificuldade: DIFICULDADE,
      numero: 5,
      titulo: "Monte a Poção",
      enunciado:
        "Arraste cada ingrediente até o caldeirão, na ordem certa, para completar a poção da Bruxa Sintática. Nem todo ingrediente do monte serve — os que não fazem parte da receita são cuspidos de volta.",
      dica:
        'primeiro crie a variável vazia com aspas (""), depois vá somando cada ingrediente com +=, e só no final mostre o resultado com console.log().',
      alternativas: {
        tipo: "montar_pocao",
        ingredientesCorretos: [
          { id: "i1", codigo: 'let pocao = "";' },
          { id: "i2", codigo: 'pocao += "3 pitadas de erva-lua, ";' },
          { id: "i3", codigo: 'pocao += "1 lágrima de fênix, ";' },
          { id: "i4", codigo: 'pocao += "2 escamas de dragão.";' },
          { id: "i5", codigo: "console.log(pocao);" },
        ],
        distratores: [
          { id: "d1", codigo: "let pocao = 0;" },
          { id: "d2", codigo: 'pocao.add("pó de unicórnio");' },
          { id: "d3", codigo: "console.log(receita);" },
        ],
      },
    },
    {
      // Chefe da trilha (último desafio do portal — ver ID_DESAFIO_CHEFE em
      // Desafios.jsx). Exercício "batalha_chefe": o jogador precisa acertar
      // "vidasNecessarias" perguntas do pool (pode repetir perguntas se
      // errar bastante) — ver DesafioChefe.jsx e avaliarBatalhaChefe em
      // progresso.service.js.
      mundoId: MUNDO_ID,
      dificuldade: DIFICULDADE,
      numero: 6,
      titulo: "Rei GoblinJS",
      enunciado:
        "O Rei GoblinJS surge no topo da torre, cercado pelos ecos de tudo que você já enfrentou no Portal 1. Ele vai testar tudo que você aprendeu até aqui — acerte 3 golpes certeiros para derrubá-lo.",
      dica: "releia cada pergunta com calma — elas revisam os desafios anteriores desta trilha.",
      alternativas: {
        tipo: "batalha_chefe",
        vidasNecessarias: 3,
        perguntas: [
          {
            id: "p1",
            opcoes: [
              { id: "a", texto: 'console.log("mensagem")', correta: true },
              { id: "b", texto: 'print("mensagem")', correta: false },
              { id: "c", texto: 'console.exibir("mensagem")', correta: false },
              { id: "d", texto: 'System.out.println("mensagem")', correta: false },
            ],
          },
          {
            id: "p2",
            opcoes: [
              { id: "a", texto: '"53" (string)', correta: true },
              { id: "b", texto: "8 (number)", correta: false },
              { id: "c", texto: "53 (number)", correta: false },
              { id: "d", texto: "NaN", correta: false },
            ],
          },
          {
            id: "p3",
            opcoes: [
              { id: "a", texto: "===", correta: true },
              { id: "b", texto: "==", correta: false },
              { id: "c", texto: "=", correta: false },
              { id: "d", texto: "!=", correta: false },
            ],
          },
          {
            id: "p4",
            opcoes: [
              { id: "a", texto: "const", correta: true },
              { id: "b", texto: "let", correta: false },
              { id: "c", texto: "var", correta: false },
              { id: "d", texto: "function", correta: false },
            ],
          },
          {
            id: "p5",
            opcoes: [
              { id: "a", texto: '"string"', correta: true },
              { id: "b", texto: '"number"', correta: false },
              { id: "c", texto: '"undefined"', correta: false },
              { id: "d", texto: '"object"', correta: false },
            ],
          },
        ],
      },
    },
    {
      // Primeiro desafio do mundo 2 (portal "Acampamento Goblin" — ver
      // Home.jsx). Exercício de "ordenar blocos": o jogador monta o
      // programa arrastando/organizando os blocos na ordem certa, em vez
      // de escolher entre alternativas — daí o formato diferente aqui em
      // "alternativas" (ver comentário em schema.prisma).
      mundoId: 2,
      dificuldade: DIFICULDADE,
      numero: 1,
      titulo: "Desafio JavaScript",
      enunciado:
        'Você está desenvolvendo um sistema que verifica se uma pessoa pode acessar uma área restrita.\n\nO programa deve receber a idade de uma pessoa e verificar se ela possui 18 anos ou mais. Caso tenha, deve exibir "Acesso permitido". Caso contrário, deve exibir "Acesso negado".\n\nOrganize os blocos de código na sequência correta para formar um programa JavaScript funcional.',
      dica: "o bloco if/else só executa o trecho entre chaves quando a condição é avaliada — preste atenção em qual chave abre e qual fecha cada parte.",
      alternativas: {
        tipo: "ordenar_blocos",
        blocos: [
          { id: "b1", codigo: "let idade = 20;" },
          { id: "b2", codigo: "if (idade >= 18) {" },
          { id: "b3", codigo: 'console.log("Acesso permitido");', indent: 1 },
          { id: "b4", codigo: "} else {" },
          { id: "b5", codigo: 'console.log("Acesso negado");', indent: 1 },
          { id: "b6", codigo: "}" },
        ],
        ordemCorreta: ["b1", "b2", "b3", "b4", "b5", "b6"],
      },
    },
    // Segundo desafio do mundo 2: resposta dissertativa corrigida por IA.
    // Conteúdo em prisma/desafios/desafioIA.js (também usado por
    // scripts/criarDesafioIA.js, que cadastra só ele).
    desafioIA,

    // Portal 3 — Arena do Dragão: 6 desafios avançados, cada um com 3 etapas
    // (ver prisma/desafios/portal3.js e src/services/etapas.service.js).
    ...desafiosPortal3,
  ];

  // Confere o formato de todo conteúdo antes de gravar qualquer desafio —
  // um erro de digitação aqui viraria um desafio impossível de vencer.
  for (const desafio of desafios) {
    try {
      validarAlternativas(desafio.alternativas);
    } catch (erro) {
      throw new Error(`Desafio ${desafio.mundoId}/${desafio.numero} (${desafio.titulo}): ${erro.message}`);
    }
  }

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

  // Recompensas: aplicadas depois dos desafios pra valer também pros que
  // foram cadastrados fora deste seed (ex: scripts/criarDesafioIA.js).
  for (const [chave, nomeItem] of Object.entries(RECOMPENSAS_POR_DESAFIO)) {
    const [mundoId, numero] = chave.split("/").map(Number);
    const { count } = await prisma.desafio.updateMany({
      where: { mundoId, dificuldade: DIFICULDADE, numero },
      data: { itemRecompensaId: itensSemeados[nomeItem].id },
    });
    if (count > 0) console.log(`Recompensa do desafio ${chave}: ${nomeItem}.`);
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
