// prisma/desafios/portal3.js
//
// Portal 3 — Arena do Dragão: desafios AVANÇADOS de JavaScript. Diferente
// dos outros portais, cada desafio tem 3 ETAPAS, respondidas em sequência
// (ver etapas.service.js). O desafio só é concluído — XP e item — quando a
// última etapa é vencida; o avanço fica salvo em Progresso.etapasConcluidas.
//
// Formato: alternativas = { tipo: "etapas", etapas: [etapa, etapa, etapa] }.
// Cada etapa tem titulo, enunciado, codigo (opcional), dica e os dados de UM
// dos tipos de exercício do jogo — os mesmos formatos dos outros portais:
//
//   multipla_escolha  opcoes: [{ id, texto, correta }]
//   ordenar_blocos    blocos: [{ id, codigo }], ordemCorreta: [id, ...]
//   avaliar_codigo    cartas: [{ id, codigo, correta }]
//   montar_pocao      ingredientesCorretos: [{ id, codigo }] (em ordem), distratores: [{ id, codigo }]
//   batalha_chefe     vidasNecessarias, perguntas: [{ id, enunciado, codigo?, opcoes }]
//   dissertativa      criterios: [texto], respostaReferencia (corrigida pela IA)
//
// O conteúdo vem da API (GET /api/desafios/:mundoId/:dificuldade/:numero),
// SEM o gabarito — então a tela pode ser redesenhada sem mexer aqui.
// Fundos, inimigos e recompensas deste portal ainda não foram definidos.

const MUNDO_ID = 3;
const DIFICULDADE = "iniciante";

const desafios = [
  // -------------------------------------------------------------------
  {
    numero: 1,
    titulo: "O Labirinto do Escopo",
    enunciado:
      "A entrada da Arena do Dragão é um labirinto onde as variáveis aparecem e somem. Só atravessa quem entende escopo, hoisting e a zona morta temporal.",
    dica: "var é içada (hoisting) com valor undefined; let e const também são içadas, mas ficam inacessíveis até a linha da declaração.",
    xpConcedido: 30,
    etapas: [
      {
        tipo: "multipla_escolha",
        titulo: "O eco do var",
        enunciado: "O que este código exibe no console?",
        codigo: "console.log(tesouro);\nvar tesouro = 'ouro';",
        dica: "Com var, a declaração sobe para o topo do escopo, mas a atribuição não.",
        opcoes: [
          { id: "a", texto: "undefined", correta: true },
          { id: "b", texto: "'ouro'", correta: false },
          { id: "c", texto: "ReferenceError: tesouro is not defined", correta: false },
          { id: "d", texto: "null", correta: false },
        ],
      },
      {
        tipo: "multipla_escolha",
        titulo: "A zona morta",
        enunciado: "E agora, trocando var por let?",
        codigo: "console.log(chave);\nlet chave = 'prata';",
        dica: "Pesquise sobre a 'temporal dead zone' (zona morta temporal) do let e do const.",
        opcoes: [
          { id: "a", texto: "undefined", correta: false },
          { id: "b", texto: "'prata'", correta: false },
          { id: "c", texto: "ReferenceError: Cannot access 'chave' before initialization", correta: true },
          { id: "d", texto: "TypeError: chave is not a function", correta: false },
        ],
      },
      {
        tipo: "avaliar_codigo",
        titulo: "Portas que travam",
        enunciado:
          "Cada cartão traz um trecho de código. Arraste para CERTO se ele roda sem lançar erro, ou para ERRADO se ele lança um erro.",
        dica: "const impede reatribuir a variável, não alterar o objeto. Variáveis let só existem dentro do bloco { } onde foram criadas.",
        cartas: [
          { id: "c1", codigo: "const vidas = 3;\nvidas = 2;", correta: false },
          { id: "c2", codigo: "const heroi = { nivel: 1 };\nheroi.nivel = 2;", correta: true },
          { id: "c3", codigo: "if (true) {\n  let escudo = 10;\n}\nconsole.log(escudo);", correta: false },
          { id: "c4", codigo: "for (var i = 0; i < 3; i++) {}\nconsole.log(i);", correta: true },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------
  {
    numero: 2,
    titulo: "As Garras das Closures",
    enunciado:
      "Um guardião de garras afiadas lembra de tudo que já viu — assim como uma closure lembra das variáveis do escopo onde foi criada.",
    dica: "Uma função criada dentro de outra mantém acesso às variáveis da função externa, mesmo depois que ela terminou de executar.",
    xpConcedido: 30,
    etapas: [
      {
        tipo: "multipla_escolha",
        titulo: "Dois contadores",
        enunciado: "O que é exibido no console?",
        codigo:
          "function criarContador() {\n  let total = 0;\n  return () => ++total;\n}\n\nconst a = criarContador();\nconst b = criarContador();\na();\na();\nconsole.log(a(), b());",
        dica: "Cada chamada de criarContador cria um 'total' novo e independente.",
        opcoes: [
          { id: "a", texto: "3 1", correta: true },
          { id: "b", texto: "3 4", correta: false },
          { id: "c", texto: "1 1", correta: false },
          { id: "d", texto: "2 1", correta: false },
        ],
      },
      {
        tipo: "ordenar_blocos",
        titulo: "Forje um multiplicador",
        enunciado:
          "Monte o código de uma fábrica de funções: criarMultiplicador recebe um fator e devolve uma função que multiplica qualquer número por ele. No fim, dobro(21) deve exibir 42.",
        dica: "A função interna usa 'fator', que pertence à função externa — isso é uma closure.",
        blocos: [
          { id: "b1", codigo: "function criarMultiplicador(fator) {" },
          { id: "b2", codigo: "  return function (numero) {" },
          { id: "b3", codigo: "    return numero * fator;" },
          { id: "b4", codigo: "  };" },
          { id: "b5", codigo: "}" },
          { id: "b6", codigo: "const dobro = criarMultiplicador(2);" },
          { id: "b7", codigo: "console.log(dobro(21));" },
        ],
        ordemCorreta: ["b1", "b2", "b3", "b4", "b5", "b6", "b7"],
      },
      {
        tipo: "multipla_escolha",
        titulo: "A armadilha do laço",
        enunciado: "O que este código exibe, depois que os timers disparam?",
        codigo: "for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}",
        dica: "Com var existe UM único i para o laço inteiro; com let, cada volta do laço teria o seu próprio i.",
        opcoes: [
          { id: "a", texto: "0 1 2", correta: false },
          { id: "b", texto: "3 3 3", correta: true },
          { id: "c", texto: "2 2 2", correta: false },
          { id: "d", texto: "undefined undefined undefined", correta: false },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------
  {
    numero: 3,
    titulo: "O Mestre dos Arrays",
    enunciado:
      "O Mestre dos Arrays transforma listas inteiras com um único encadeamento. Domine map, filter e reduce para passar por ele.",
    dica: "map transforma cada item, filter escolhe itens e reduce combina todos num único valor. Alguns métodos alteram o array original!",
    xpConcedido: 30,
    etapas: [
      {
        tipo: "multipla_escolha",
        titulo: "Encadeamento",
        enunciado: "Qual é o resultado?",
        codigo: "const resultado = [1, 2, 3, 4]\n  .filter((n) => n % 2 === 0)\n  .map((n) => n * 10);\n\nconsole.log(resultado);",
        dica: "Primeiro o filter fica só com os pares; depois o map multiplica o que sobrou.",
        opcoes: [
          { id: "a", texto: "[20, 40]", correta: true },
          { id: "b", texto: "[10, 30]", correta: false },
          { id: "c", texto: "[10, 20, 30, 40]", correta: false },
          { id: "d", texto: "60", correta: false },
        ],
      },
      {
        tipo: "montar_pocao",
        titulo: "Poção do tesouro",
        enunciado:
          "Monte, na ordem, a expressão que soma apenas os preços MAIORES que 10 da lista abaixo. O resultado deve ser 42.",
        codigo: "const precos = [5, 12, 30, 8];",
        dica: "Primeiro filtre os preços, depois reduza a um total — e não esqueça o valor inicial da soma.",
        ingredientesCorretos: [
          { id: "i1", codigo: "precos" },
          { id: "i2", codigo: ".filter((p) => p > 10)" },
          { id: "i3", codigo: ".reduce((soma, p) => soma + p, 0)" },
        ],
        distratores: [
          { id: "d1", codigo: ".map((p) => p > 10)" },
          { id: "d2", codigo: ".find((p) => p > 10)" },
          { id: "d3", codigo: ".forEach((p) => soma + p)" },
        ],
      },
      {
        tipo: "avaliar_codigo",
        titulo: "Profecias de arrays",
        enunciado:
          "Cada cartão traz um código e, no comentário, o resultado prometido. Arraste para CERTO se o resultado está correto, ou para ERRADO se não está.",
        dica: "forEach sempre devolve undefined. Sem uma função de comparação, sort ordena como TEXTO.",
        cartas: [
          { id: "c1", codigo: "[1, 2, 3].map((n) => n * 2);\n// [2, 4, 6]", correta: true },
          { id: "c2", codigo: "[1, 2, 3].forEach((n) => n * 2);\n// [2, 4, 6]", correta: false },
          { id: "c3", codigo: "[10, 1, 3].sort();\n// [1, 3, 10]", correta: false },
          { id: "c4", codigo: "[1, 2, 3].reduce((a, b) => a + b);\n// 6", correta: true },
          { id: "c5", codigo: "[1, 2, 3].includes('2');\n// true", correta: false },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------
  {
    numero: 4,
    titulo: "O Relógio do Event Loop",
    enunciado:
      "Na torre do relógio, o tempo não anda em linha reta: código síncrono, microtarefas e timers disputam a vez. Entenda o event loop para não se perder.",
    dica: "Ordem: primeiro todo o código síncrono, depois as microtarefas (Promises), depois os timers (setTimeout) — mesmo com 0 ms.",
    xpConcedido: 30,
    etapas: [
      {
        tipo: "multipla_escolha",
        titulo: "Quem fala primeiro?",
        enunciado: "Em que ordem as letras aparecem no console?",
        codigo:
          "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');",
        dica: "O .then de uma Promise é uma microtarefa: roda antes de qualquer setTimeout.",
        opcoes: [
          { id: "a", texto: "A B C D", correta: false },
          { id: "b", texto: "A D C B", correta: true },
          { id: "c", texto: "A D B C", correta: false },
          { id: "d", texto: "A C D B", correta: false },
        ],
      },
      {
        tipo: "ordenar_blocos",
        titulo: "Invocação assíncrona",
        enunciado:
          "Monte uma função assíncrona que espera buscarHeroi() terminar, exibe o nome do herói e, se a busca falhar, exibe a mensagem do erro.",
        dica: "await só pode ser usado dentro de uma função async; o try envolve o que pode falhar.",
        blocos: [
          { id: "b1", codigo: "async function carregarHeroi() {" },
          { id: "b2", codigo: "  try {" },
          { id: "b3", codigo: "    const heroi = await buscarHeroi();" },
          { id: "b4", codigo: "    console.log(heroi.nome);" },
          { id: "b5", codigo: "  } catch (erro) {" },
          { id: "b6", codigo: "    console.log('Falhou:', erro.message);" },
          { id: "b7", codigo: "  }" },
          { id: "b8", codigo: "}" },
        ],
        ordemCorreta: ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"],
      },
      {
        tipo: "dissertativa",
        titulo: "O enigma do zero",
        enunciado:
          "O código abaixo exibe 1, depois 3 e só então 2 — mesmo com o setTimeout configurado para 0 milissegundos. Explique, com suas palavras, por que isso acontece.",
        codigo: "console.log(1);\nsetTimeout(() => console.log(2), 0);\nconsole.log(3);",
        dica: "Pense no que o setTimeout faz com a função que recebe e em quando essa função pode, de fato, executar.",
        criterios: [
          "Explica que o setTimeout não executa a função na hora: ele agenda o callback para depois (é assíncrono).",
          "Explica que o código síncrono (os console.log de 1 e 3) termina de executar antes do callback.",
          "Explica que o callback só roda quando a pilha de execução fica vazia (event loop / fila de tarefas), por isso o 0 ms não faz ele rodar imediatamente.",
        ],
        respostaReferencia:
          "O setTimeout não executa a função imediatamente: ele entrega o callback para ser executado depois, colocando-o na fila de tarefas. O JavaScript primeiro termina todo o código síncrono, exibindo 1 e 3. Só quando a pilha de execução fica vazia o event loop pega o callback da fila e exibe 2. O 0 ms é apenas o tempo mínimo de espera, não uma execução imediata.",
      },
    ],
  },

  // -------------------------------------------------------------------
  {
    numero: 5,
    titulo: "As Armadilhas da Igualdade",
    enunciado:
      "No salão dos espelhos, nada é o que parece: valores se convertem sozinhos e objetos que parecem iguais são diferentes. Desconfie de tudo.",
    dica: "== converte os tipos antes de comparar; === não converte. Objetos são comparados e copiados por REFERÊNCIA.",
    xpConcedido: 30,
    etapas: [
      {
        tipo: "avaliar_codigo",
        titulo: "Espelhos enganosos",
        enunciado:
          "Cada cartão traz uma expressão e, no comentário, o resultado prometido. Arraste para CERTO se o resultado está correto, ou para ERRADO se não está.",
        dica: "NaN não é igual nem a si mesmo. O operador * converte textos em números; null e undefined só são iguais com ==.",
        cartas: [
          { id: "c1", codigo: "0 == ''\n// true", correta: true },
          { id: "c2", codigo: "null === undefined\n// true", correta: false },
          { id: "c3", codigo: "NaN === NaN\n// true", correta: false },
          { id: "c4", codigo: "'5' * '2'\n// 10", correta: true },
          { id: "c5", codigo: "[1, 2] === [1, 2]\n// true", correta: false },
        ],
      },
      {
        tipo: "multipla_escolha",
        titulo: "O reflexo traiçoeiro",
        enunciado: "O que é exibido no console?",
        codigo: "const original = { vida: 100 };\nconst reflexo = original;\nreflexo.vida = 50;\n\nconsole.log(original.vida);",
        dica: "Atribuir um objeto a outra variável não cria uma cópia: as duas apontam para o mesmo objeto.",
        opcoes: [
          { id: "a", texto: "100", correta: false },
          { id: "b", texto: "50", correta: true },
          { id: "c", texto: "undefined", correta: false },
          { id: "d", texto: "TypeError", correta: false },
        ],
      },
      {
        tipo: "montar_pocao",
        titulo: "Poção da cópia perfeita",
        enunciado:
          "Monte, na ordem, uma linha que cria uma CÓPIA do objeto heroi com o nivel alterado para 2, sem modificar o heroi original.",
        codigo: "const heroi = { nome: 'Ada', nivel: 1 };",
        dica: "O operador spread (...) espalha as propriedades de um objeto dentro de um objeto novo.",
        ingredientesCorretos: [
          { id: "i1", codigo: "const copia =" },
          { id: "i2", codigo: "{ ...heroi," },
          { id: "i3", codigo: "nivel: 2 };" },
        ],
        distratores: [
          { id: "d1", codigo: "heroi;" },
          { id: "d2", codigo: "[ ...heroi," },
          { id: "d3", codigo: "{ heroi," },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------
  {
    numero: 6,
    titulo: "O Dragão do Código",
    enunciado:
      "O Dragão do Código desperta no centro da arena. Ele vai testar tudo que você dominou neste portal — recursão, this e as armadilhas da linguagem. Vença as três etapas para derrubá-lo.",
    dica: "Revise os desafios anteriores do portal: o dragão mistura todos os assuntos.",
    xpConcedido: 50,
    etapas: [
      {
        tipo: "ordenar_blocos",
        titulo: "O feitiço recursivo",
        enunciado:
          "Monte uma função recursiva que calcula o fatorial de um número. No fim, fatorial(5) deve exibir 120.",
        dica: "Toda recursão precisa de um caso base que para as chamadas — senão ela nunca termina.",
        blocos: [
          { id: "b1", codigo: "function fatorial(n) {" },
          { id: "b2", codigo: "  if (n <= 1) return 1;" },
          { id: "b3", codigo: "  return n * fatorial(n - 1);" },
          { id: "b4", codigo: "}" },
          { id: "b5", codigo: "console.log(fatorial(5));" },
        ],
        ordemCorreta: ["b1", "b2", "b3", "b4", "b5"],
      },
      {
        tipo: "multipla_escolha",
        titulo: "O olhar do this",
        enunciado: "O que é exibido no console?",
        codigo:
          "const heroi = {\n  nome: 'Ada',\n  saudar() {\n    return () => this.nome;\n  },\n};\n\nconsole.log(heroi.saudar()());",
        dica: "Arrow functions não têm this próprio: usam o this do lugar onde foram criadas.",
        opcoes: [
          { id: "a", texto: "'Ada'", correta: true },
          { id: "b", texto: "undefined", correta: false },
          { id: "c", texto: "TypeError: this is undefined", correta: false },
          { id: "d", texto: "'' (texto vazio)", correta: false },
        ],
      },
      {
        tipo: "batalha_chefe",
        titulo: "O sopro final",
        enunciado:
          "O dragão ataca com perguntas rápidas! Acerte 3 golpes certeiros para derrubá-lo de vez.",
        dica: "As perguntas misturam tipos, coerção, desestruturação e encadeamento opcional.",
        vidasNecessarias: 3,
        perguntas: [
          {
            id: "p1",
            enunciado: "Qual é o resultado de typeof null?",
            opcoes: [
              { id: "a", texto: "'object'", correta: true },
              { id: "b", texto: "'null'", correta: false },
              { id: "c", texto: "'undefined'", correta: false },
              { id: "d", texto: "'number'", correta: false },
            ],
          },
          {
            id: "p2",
            enunciado: "Depois da desestruturação abaixo, qual é o valor de b?",
            codigo: "const [a, , b] = [10, 20, 30];",
            opcoes: [
              { id: "a", texto: "20", correta: false },
              { id: "b", texto: "30", correta: true },
              { id: "c", texto: "undefined", correta: false },
              { id: "d", texto: "[20, 30]", correta: false },
            ],
          },
          {
            id: "p3",
            enunciado: "Qual é o resultado da expressão abaixo?",
            codigo: "'2' + 2 * '2'",
            opcoes: [
              { id: "a", texto: "'24'", correta: true },
              { id: "b", texto: "8", correta: false },
              { id: "c", texto: "'222'", correta: false },
              { id: "d", texto: "6", correta: false },
            ],
          },
          {
            id: "p4",
            enunciado: "O que é exibido no console?",
            codigo: "const heroi = {};\nconsole.log(heroi.arma?.nome);",
            opcoes: [
              { id: "a", texto: "undefined", correta: true },
              { id: "b", texto: "TypeError", correta: false },
              { id: "c", texto: "null", correta: false },
              { id: "d", texto: "''", correta: false },
            ],
          },
          {
            id: "p5",
            enunciado: "Qual é o resultado?",
            codigo: "[...'dragao'].length",
            opcoes: [
              { id: "a", texto: "6", correta: true },
              { id: "b", texto: "1", correta: false },
              { id: "c", texto: "'dragao'", correta: false },
              { id: "d", texto: "TypeError", correta: false },
            ],
          },
        ],
      },
    ],
  },
];

module.exports = desafios.map(({ etapas, ...desafio }) => ({
  ...desafio,
  mundoId: MUNDO_ID,
  dificuldade: DIFICULDADE,
  alternativas: { tipo: "etapas", etapas },
}));
