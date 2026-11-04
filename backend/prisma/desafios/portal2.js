// prisma/desafios/portal2.js
//
// Portal 2 — Acampamento Goblin: desafios 1, 3, 4, 5 e 6 da trilha
// "iniciante". O desafio 2 (O Enigma da Bruxa, corrigido por IA) fica em
// desafios/desafioIA.js.
//
// Sequência do portal: if/else (1) -> if/else if/else (2) -> laços for e
// while (3) -> arrays (4) -> funções (5) -> chefe revisando tudo (6). Prepara
// o jogador pro Portal 3, que já assume laços, arrays e funções.
//
// Os tipos dos desafios 3 (avaliar código) e 4 (ordenar blocos) estão
// invertidos em relação ao Portal 1 de propósito, pra sequência dos dois
// portais não ficar idêntica.
//
// Estes desafios não têm tela própria no frontend: são jogados na tela
// genérica (DesafioEtapas), que busca o conteúdo na API — ver
// frontend/src/data/telasDesafio.js. O visual (inimigo, fundo, falas da
// introdução) fica em CENAS_PORTAL_2, em frontend/src/data/cenasPortal3.js.
//
// Formatos de "alternativas" (ver progresso.service.js::avaliarResposta):
// múltipla escolha precisa ser a LISTA de opções — o formato de objeto
// { tipo: "multipla_escolha", opcoes } passa no validador, mas o corretor
// de desafio de etapa única não o reconhece.
//
// Recompensas: itens élficos (1 a 5) e baú no 6 — ver
// RECOMPENSAS_POR_DESAFIO em seed.js.
//
// Para gravar só estes desafios num banco em uso, sem rodar o seed inteiro:
//   npm run desafios:portal2

const MUNDO_ID = 2;
const DIFICULDADE = "iniciante";

const desafios = [
  {
    // Múltipla escolha — if/else e a diferença entre > e >=.
    numero: 1,
    titulo: "O Portão do Acampamento",
    enunciado:
      'O Goblin Sentinela só abre o portão do acampamento para quem for forte o bastante. Ele mostra o código que decide quem entra:\n\nlet forca = 5;\nif (forca > 5) {\nconsole.log("Pode entrar no acampamento!");\n} else {\nconsole.log("Volte quando estiver mais forte.");\n}\n\nQual mensagem aparece no console?',
    dica: "o operador > significa \"maior que\" — e 5 não é maior que 5. Para incluir o próprio 5, seria preciso usar >=.",
    alternativas: [
      { id: "a", texto: '"Pode entrar no acampamento!"', correta: false },
      { id: "b", texto: '"Volte quando estiver mais forte."', correta: true },
      { id: "c", texto: "As duas mensagens, uma depois da outra", correta: false },
      { id: "d", texto: "Nenhuma mensagem aparece", correta: false },
    ],
  },
  {
    // Avaliar código — laços for e while.
    numero: 3,
    titulo: "A Ronda dos Goblins",
    enunciado:
      "O Goblin Patrulheiro anota no código cada ronda que a patrulha precisa fazer — mas nem todo laço dele funciona.\n\nCada cartão diz, no comentário, o que o laço deveria fazer. Arraste para a direita se o código faz isso CERTO, ou para a esquerda se está ERRADO. Acerte os 4 cartões para derrotá-lo.",
    dica: "confira as três partes do laço: onde começa, até onde vai (< ou <=) e o que muda a cada volta. Um laço sem i++ ou i-- nunca termina.",
    alternativas: {
      tipo: "avaliar_codigo",
      cartas: [
        {
          id: "c1",
          codigo: '// anunciar as rondas 1, 2 e 3\nfor (let i = 1; i <= 3; i++) {\n  console.log("Ronda " + i);\n}',
          correta: true,
          explicacao:
            "Certo! O laço começa em 1 e continua enquanto i <= 3, então anuncia as rondas 1, 2 e 3.",
        },
        {
          id: "c2",
          codigo: '// anunciar as rondas 1, 2 e 3\nfor (let i = 1; i < 3; i++) {\n  console.log("Ronda " + i);\n}',
          correta: false,
          explicacao:
            "Errado! Com i < 3, o laço para quando i chega a 3 — só as rondas 1 e 2 são anunciadas. Para incluir o 3, seria preciso <=.",
        },
        {
          id: "c3",
          codigo: "// contar de 1 até 3\nlet i = 1;\nwhile (i <= 3) {\n  console.log(i);\n}",
          correta: false,
          explicacao:
            "Errado! Falta o i++ dentro do while. O i continua valendo 1 para sempre, a condição nunca fica falsa e o laço nunca termina.",
        },
        {
          id: "c4",
          codigo: '// contagem regressiva: 3, 2, 1\nfor (let i = 3; i >= 1; i--) {\n  console.log(i);\n}',
          correta: true,
          explicacao:
            "Certo! O laço começa em 3 e o i-- diminui um a cada volta; ele para quando i fica menor que 1. Saem 3, 2 e 1.",
        },
      ],
    },
  },
  {
    // Ordenar blocos — arrays (criar, push, length, percorrer com for).
    numero: 4,
    titulo: "O Inventário Goblin",
    enunciado:
      'O Goblin Intendente bagunçou o código do inventário do acampamento e precisa da sua ajuda para colocá-lo em ordem.\n\nMonte um programa que crie a lista de itens com "espada" e "escudo", guarde a "poção" no fim da lista, mostre quantos itens há e, depois, mostre cada item, um por linha.\n\nOrganize os blocos de código na sequência correta para formar um programa JavaScript funcional.',
    dica: "a lista precisa existir antes de receber a poção, e a quantidade só fica certa depois do push(). Para mostrar cada item, o laço começa na posição 0 e vai até antes de itens.length.",
    alternativas: {
      tipo: "ordenar_blocos",
      blocos: [
        { id: "b1", codigo: 'let itens = ["espada", "escudo"];' },
        { id: "b2", codigo: 'itens.push("poção");' },
        { id: "b3", codigo: 'console.log("Total de itens: " + itens.length);' },
        { id: "b4", codigo: "for (let i = 0; i < itens.length; i++) {" },
        { id: "b5", codigo: "console.log(itens[i]);", indent: 1 },
        { id: "b6", codigo: "}" },
      ],
      ordemCorreta: ["b1", "b2", "b3", "b4", "b5", "b6"],
    },
  },
  {
    // Montar poção — funções (parâmetro, return, chamada).
    numero: 5,
    titulo: "A Poção da Bruxa",
    enunciado:
      "A Bruxa do Acampamento cansou de escrever a receita inteira toda vez que alguém pede uma poção — ela quer uma FUNÇÃO.\n\nArraste cada ingrediente até o caldeirão, na ordem certa: crie a função de poções, use-a com um cogumelo e mostre a poção pronta. Os ingredientes falsos são cuspidos de volta.",
    dica: 'a função vem primeiro e inteira: function, depois o return, depois o } que fecha. Só então chame prepararPocao("cogumelo") e mostre o resultado com console.log().',
    alternativas: {
      tipo: "montar_pocao",
      ingredientesCorretos: [
        { id: "i1", codigo: "function prepararPocao(ingrediente) {" },
        { id: "i2", codigo: 'return "Poção de " + ingrediente;' },
        { id: "i3", codigo: "}" },
        { id: "i4", codigo: 'let pocao = prepararPocao("cogumelo");' },
        { id: "i5", codigo: "console.log(pocao);" },
      ],
      distratores: [
        { id: "d1", codigo: 'retorne "Poção de " + ingrediente;' },
        { id: "d2", codigo: "let pocao = prepararPocao;" },
        { id: "d3", codigo: "print(pocao);" },
      ],
    },
  },
  {
    // Chefe do portal — revisa condicionais, && e ||, laços, arrays e
    // funções. Precisa acertar 3 perguntas do pool; a resposta certa muda de
    // posição (a tela não embaralha as alternativas).
    numero: 6,
    titulo: "General Goblin",
    enunciado:
      "O General Goblin sai da maior tenda do acampamento, cercado pelos goblins que você já derrotou. Ele vai testar tudo que você aprendeu no Portal 2 — acerte 3 golpes certeiros para derrubá-lo.",
    dica: "releia cada pergunta com calma — elas revisam os desafios anteriores do acampamento.",
    alternativas: {
      tipo: "batalha_chefe",
      vidasNecessarias: 3,
      perguntas: [
        {
          id: "p1",
          enunciado: "O que aparece no console?",
          codigo:
            'let moedas = 12;\n\nif (moedas >= 20) {\n  console.log("Espada");\n} else if (moedas >= 10) {\n  console.log("Escudo");\n} else {\n  console.log("Nada");\n}',
          opcoes: [
            { id: "a", texto: '"Espada"', correta: false },
            { id: "b", texto: '"Escudo"', correta: true },
            { id: "c", texto: '"Nada"', correta: false },
            { id: "d", texto: '"Escudo" e depois "Nada"', correta: false },
          ],
        },
        {
          id: "p2",
          enunciado: "O portão só abre se as DUAS condições forem verdadeiras. O que aparece no console?",
          codigo: "let temChave = true;\nlet ehNoite = false;\n\nconsole.log(temChave && ehNoite);",
          opcoes: [
            { id: "a", texto: "true", correta: false },
            { id: "b", texto: "true false", correta: false },
            { id: "c", texto: "false", correta: true },
            { id: "d", texto: "undefined", correta: false },
          ],
        },
        {
          id: "p3",
          enunciado: "Qual é o resultado desta expressão?",
          codigo: "false || true",
          opcoes: [
            { id: "a", texto: "true", correta: true },
            { id: "b", texto: "false", correta: false },
            { id: "c", texto: "undefined", correta: false },
            { id: "d", texto: "Dá erro", correta: false },
          ],
        },
        {
          id: "p4",
          enunciado: 'Quantas vezes "Avante!" aparece no console?',
          codigo: 'for (let i = 0; i < 4; i++) {\n  console.log("Avante!");\n}',
          opcoes: [
            { id: "a", texto: "3 vezes", correta: false },
            { id: "b", texto: "5 vezes", correta: false },
            { id: "c", texto: "Infinitas vezes", correta: false },
            { id: "d", texto: "4 vezes", correta: true },
          ],
        },
        {
          id: "p5",
          enunciado: "Qual é o valor de armas[1]?",
          codigo: 'let armas = ["arco", "machado", "lança"];',
          opcoes: [
            { id: "a", texto: '"arco"', correta: false },
            { id: "b", texto: '"machado"', correta: true },
            { id: "c", texto: '"lança"', correta: false },
            { id: "d", texto: "undefined", correta: false },
          ],
        },
        {
          id: "p6",
          enunciado: "O que dobro(5) retorna?",
          codigo: "function dobro(n) {\n  return n * 2;\n}",
          opcoes: [
            { id: "a", texto: "5", correta: false },
            { id: "b", texto: "25", correta: false },
            { id: "c", texto: "10", correta: true },
            { id: "d", texto: '"55"', correta: false },
          ],
        },
      ],
    },
  },
];

module.exports = desafios.map((desafio) => ({
  mundoId: MUNDO_ID,
  dificuldade: DIFICULDADE,
  ...desafio,
}));
