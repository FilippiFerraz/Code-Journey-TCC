// TODO: futuramente mover esta base para o banco de dados e buscar via API
//
// Grimório do Mago: respostas para as dúvidas de JavaScript pesquisadas na
// barra da Home (modo "Dúvidas" — ver components/BarraPesquisa e
// utils/buscarDuvida.js). Sem IA: a busca compara o texto do jogador com as
// palavrasChave de cada entrada.
//
// Regras para escrever uma entrada:
// - explicar o CONCEITO para quem nunca programou, em poucas frases;
// - NUNCA entregar a resposta de um desafio do jogo (não copiar enunciados,
//   códigos ou alternativas dos desafios — use exemplos próprios);
// - palavrasChave em minúsculas e sem acento (a busca já normaliza o texto
//   do jogador assim). Termos com símbolos ("console.log", "===") são
//   procurados como estão; palavras comuns, como palavras inteiras. Inclua
//   singular e plural quando fizer sentido.
// - relacionadas: ids de outras entradas sugeridas junto com esta.

export const BASE_DUVIDAS = [
  {
    id: "console-log",
    titulo: "Como mostrar algo na tela com console.log?",
    palavrasChave: ["console", "console.log", "log", "print", "printar", "imprimir", "mostrar", "exibir", "aparecer", "saida", "tela"],
    explicacao:
      "O console.log() é o seu pergaminho de mensagens! Tudo que você colocar dentro dos parênteses aparece no console do navegador (aperte F12 e abra a aba Console para ver). Programadores usam ele o tempo todo para conferir o que o código está fazendo.",
    exemplo: 'console.log("A aventura começou!");\nconsole.log(42);\n\nconst heroi = "Ada";\nconsole.log(heroi); // mostra: Ada',
    relacionadas: ["variaveis", "strings"],
  },
  {
    id: "variaveis",
    titulo: "O que são variáveis? Qual a diferença entre let e const?",
    palavrasChave: ["variavel", "variaveis", "let", "const", "var", "declarar", "declaracao", "guardar", "armazenar", "constante"],
    explicacao:
      "Uma variável é um baú com nome, onde você guarda um valor para usar depois. Use const quando o valor não vai mudar (é o mais comum) e let quando ele vai mudar ao longo do programa. Tentar trocar o valor de uma const gera erro.",
    exemplo: 'const nomeDoMago = "Merlin"; // nunca muda\nlet vidas = 3;               // pode mudar\n\nvidas = vidas - 1;\nconsole.log(vidas); // 2',
    relacionadas: ["tipos-de-dados", "nao-definido"],
  },
  {
    id: "tipos-de-dados",
    titulo: "Quais são os tipos de dados básicos?",
    palavrasChave: ["tipo", "tipos", "typeof", "string", "number", "numero", "boolean", "booleano", "true", "false", "verdadeiro", "falso", "dado", "dados"],
    explicacao:
      "Todo valor tem um tipo. Os três que você mais vai usar são: texto (string), sempre entre aspas; número (number), sem aspas; e booleano (boolean), que só pode ser true (verdadeiro) ou false (falso). O comando typeof mostra o tipo de um valor.",
    exemplo: 'const nome = "Ada";     // string (texto)\nconst nivel = 7;         // number (número)\nconst temEspada = true;  // boolean\n\nconsole.log(typeof nivel); // "number"',
    relacionadas: ["variaveis", "strings"],
  },
  {
    id: "strings",
    titulo: "Como juntar textos (concatenação e template string)?",
    palavrasChave: ["string", "strings", "texto", "textos", "juntar", "concatenar", "concatenacao", "template", "crase", "crases", "${", "aspas", "frase"],
    explicacao:
      "Para juntar textos você pode usar o + entre eles. Um jeito mais moderno é a template string: escreva o texto entre crases (`) e coloque variáveis dentro de ${ }. Fica mais fácil de ler, sem precisar de tantos +.",
    exemplo: 'const heroi = "Ada";\nconst classe = "maga";\n\nconsole.log("Olá, " + heroi + "!");\nconsole.log(`${heroi} é uma ${classe} poderosa`);',
    relacionadas: ["tipos-de-dados", "console-log"],
  },
  {
    id: "operadores",
    titulo: "Como fazer contas (operadores matemáticos)?",
    palavrasChave: ["conta", "contas", "calcular", "calculo", "matematica", "operador", "operadores", "somar", "soma", "subtrair", "multiplicar", "dividir", "divisao", "resto", "%", "*"],
    explicacao:
      "O JavaScript faz contas como uma calculadora: + soma, - subtrai, * multiplica e / divide. Tem também o %, que dá o resto de uma divisão (ótimo para saber se um número é par). A ordem é a da matemática: multiplicação e divisão antes de soma e subtração, e parênteses mudam a ordem.",
    exemplo: "console.log(10 - 4);       // 6\nconsole.log(6 * 2);        // 12\nconsole.log(9 / 3);        // 3\nconsole.log(7 % 2);        // 1 (resto)\nconsole.log((2 + 3) * 4);  // 20",
    relacionadas: ["comparacao", "variaveis"],
  },
  {
    id: "comparacao",
    titulo: "Qual a diferença entre == e ===?",
    palavrasChave: ["==", "===", "!=", "!==", "comparar", "comparacao", "igual", "iguais", "igualdade", "diferente", "maior", "menor"],
    explicacao:
      "Os dois comparam valores, mas o === é mais rigoroso: ele confere o valor E o tipo. Já o == tenta converter os tipos antes de comparar, o que pode trazer surpresas. Prefira sempre === (e !== para \"diferente\").",
    exemplo: 'const vidas = 3;\n\nconsole.log(vidas === 3);   // true\nconsole.log(vidas === "3"); // false (número x texto)\nconsole.log(vidas !== 0);   // true',
    relacionadas: ["if-else", "tipos-de-dados"],
  },
  {
    id: "if-else",
    titulo: "Como usar if e else (condições)?",
    palavrasChave: ["if", "else", "senao", "condicao", "condicoes", "condicional", "decisao", "decidir"],
    explicacao:
      "O if é como uma porta mágica: o bloco entre { } só é executado se a condição for verdadeira. O else é o caminho alternativo, quando ela é falsa. Com else if você testa várias condições em sequência, e só a primeira verdadeira é executada.",
    exemplo: 'const energia = 40;\n\nif (energia > 70) {\n  console.log("Pronto para a batalha!");\n} else if (energia > 20) {\n  console.log("Melhor tomar uma poção.");\n} else {\n  console.log("Hora de descansar.");\n}',
    relacionadas: ["comparacao", "for"],
  },
  {
    id: "arrays",
    titulo: "Como criar um array e acessar suas posições?",
    palavrasChave: ["array", "arrays", "lista", "listas", "vetor", "vetores", "indice", "posicao", "posicoes", "length", "push", "elemento", "colchetes"],
    explicacao:
      "Um array é uma mochila com vários itens em ordem, escrito entre colchetes [ ]. Cada item tem uma posição (índice) que começa no 0, não no 1! Use .length para saber quantos itens existem e .push() para colocar um item no fim.",
    exemplo: 'const mochila = ["espada", "escudo", "poção"];\n\nconsole.log(mochila[0]);      // "espada"\nconsole.log(mochila.length);  // 3\n\nmochila.push("mapa");\nconsole.log(mochila[3]);      // "mapa"',
    relacionadas: ["for", "variaveis"],
  },
  {
    id: "for",
    titulo: "Como usar o laço for (repetição)?",
    palavrasChave: ["for", "laco", "lacos", "loop", "loops", "repetir", "repeticao", "repeticoes", "iterar", "vezes", "while"],
    explicacao:
      "O for repete um bloco de código várias vezes, sem você precisar copiar e colar. Ele tem três partes separadas por ponto e vírgula: onde começa, até quando continua e o que muda a cada volta. Tudo que estiver dentro das { } roda em cada repetição.",
    exemplo: 'for (let passo = 1; passo <= 3; passo++) {\n  console.log("Subindo o degrau " + passo);\n}\n// Subindo o degrau 1\n// Subindo o degrau 2\n// Subindo o degrau 3',
    relacionadas: ["arrays", "if-else"],
  },
  {
    id: "funcoes",
    titulo: "Como criar e chamar uma função?",
    palavrasChave: ["funcao", "funcoes", "function", "chamar", "parametro", "parametros", "argumento", "argumentos", "return", "retornar", "retorno", "arrow", "=>"],
    explicacao:
      "Uma função é um feitiço guardado: você escreve uma vez e usa quantas vezes quiser, só chamando o nome dela com parênteses. Os parâmetros são os ingredientes que ela recebe, e o return devolve o resultado para quem chamou.",
    exemplo: 'function saudar(nome) {\n  return "Saudações, " + nome + "!";\n}\n\nconsole.log(saudar("Ada"));    // Saudações, Ada!\nconsole.log(saudar("Merlin")); // Saudações, Merlin!',
    relacionadas: ["variaveis", "console-log"],
  },
  {
    id: "nao-definido",
    titulo: 'O que significa o erro "is not defined"?',
    palavrasChave: ["is not defined", "not defined", "defined", "referenceerror", "erro", "erros", "nao definido", "nao definida", "undefined", "indefinido"],
    explicacao:
      'Esse erro quer dizer que o JavaScript não encontrou o nome que você usou. Quase sempre é: um erro de digitação (lembre que maiúsculas e minúsculas fazem diferença), uma variável que ainda não foi criada, ou uma variável criada dentro de { } e usada fora delas. Confira a mensagem: ela mostra o nome que faltou.',
    exemplo: 'const pontos = 10;\n\nconsole.log(pontos); // 10\nconsole.log(Pontos); // ReferenceError: Pontos is not defined\n                     // (P maiúsculo é outro nome!)',
    relacionadas: ["variaveis", "comentarios"],
  },
  {
    id: "comentarios",
    titulo: "Como escrever comentários no código?",
    palavrasChave: ["comentario", "comentarios", "comentar", "//", "/*", "anotacao", "anotar", "nota"],
    explicacao:
      "Comentários são anotações para pessoas: o JavaScript ignora tudo que estiver neles. Use // para comentar uma linha e /* ... */ para várias linhas. São ótimos para explicar o porquê de um trecho ou desligar uma linha temporariamente.",
    exemplo: '// Isto é um comentário de uma linha\nconst ouro = 50; // também dá para comentar no fim da linha\n\n/*\n  Comentário de várias linhas:\n  nada aqui é executado.\n*/',
    relacionadas: ["console-log", "nao-definido"],
  },
];
