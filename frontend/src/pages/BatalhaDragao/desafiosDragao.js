// Microdesafios da Batalha do Dragão (BatalhaDragao.jsx): perguntas rápidas
// de código que o jogador precisa responder antes de o dragão soltar o
// sopro. Fase 1 (dragão com 100% a 50% de vida): variáveis e condições.
// Fase 2 (Modo Fúria, abaixo de 50%): laços for/while.
//
// Cada desafio: { id, fase, enunciado, codigo, opcoes, correta, explicacao }
//   codigo: o trecho mostrado no painel; "____" marca a lacuna a completar.
//   correta: o texto da opção certa (as opções são embaralhadas na tela).

export const DESAFIOS_DRAGAO = [
  // ---------- Fase 1: variáveis e condições ----------
  {
    id: "f1-subtracao",
    fase: 1,
    enunciado: "O que aparece no console?",
    codigo: "let vida = 10;\nvida = vida - 3;\nconsole.log(vida);",
    opcoes: ["7", "13", "10", "vida - 3"],
    correta: "7",
    explicacao: "vida começa em 10 e recebe 10 - 3, então passa a valer 7.",
  },
  {
    id: "f1-operador",
    fase: 1,
    enunciado: "Qual operador faz a mensagem aparecer?",
    codigo: 'let ouro = 50;\nif (ouro ____ 30) {\n  console.log("Pode comprar!");\n}',
    opcoes: [">=", "<", "===", "<="],
    correta: ">=",
    explicacao: "50 >= 30 é verdadeiro; com <, === ou <= a condição seria falsa.",
  },
  {
    id: "f1-const",
    fase: 1,
    enunciado: "Por que este código dá erro?",
    codigo: "const escudo = 5;\nescudo = 8;",
    opcoes: ["const não pode ser reatribuída", "Falta ponto e vírgula", "8 não é um número", "escudo é palavra reservada"],
    correta: "const não pode ser reatribuída",
    explicacao: "Uma variável declarada com const não pode receber outro valor. Use let quando o valor muda.",
  },
  {
    id: "f1-else-if",
    fase: 1,
    enunciado: "O que aparece no console?",
    codigo: 'let nivel = 4;\nif (nivel > 5) {\n  console.log("A");\n} else if (nivel > 3) {\n  console.log("B");\n} else {\n  console.log("C");\n}',
    opcoes: ["B", "A", "C", "A e B"],
    correta: "B",
    explicacao: "4 > 5 é falso; 4 > 3 é verdadeiro, então só o bloco do else if roda.",
  },
  {
    id: "f1-concatena",
    fase: 1,
    enunciado: "Qual é o valor de x?",
    codigo: 'let x = "5" + 2;',
    opcoes: ['"52"', "7", '"7"', "Dá erro"],
    correta: '"52"',
    explicacao: "Com uma string, o + junta os textos: \"5\" + 2 vira \"52\".",
  },
  {
    id: "f1-e-logico",
    fase: 1,
    enunciado: "O que aparece no console?",
    codigo: "let temChave = true;\nlet portaAberta = false;\nconsole.log(temChave && portaAberta);",
    opcoes: ["false", "true", "undefined", "Dá erro"],
    correta: "false",
    explicacao: "O && só é verdadeiro se os dois lados forem verdadeiros — portaAberta é false.",
  },
  {
    id: "f1-ou-logico",
    fase: 1,
    enunciado: "O que aparece no console?",
    codigo: 'let dia = false;\nlet tocha = true;\nif (dia || tocha) {\n  console.log("Enxergo!");\n} else {\n  console.log("Escuro...");\n}',
    opcoes: ["Enxergo!", "Escuro...", "Nada aparece", "Os dois"],
    correta: "Enxergo!",
    explicacao: "O || é verdadeiro se pelo menos um dos lados for — tocha é true.",
  },
  {
    id: "f1-soma",
    fase: 1,
    enunciado: "O que completa a lacuna para mostrar 7?",
    codigo: "let a = 3;\nlet b = 4;\nlet soma = ____;\nconsole.log(soma); // 7",
    opcoes: ["a + b", "a * b", "a - b", '"a + b"'],
    correta: "a + b",
    explicacao: "3 + 4 = 7. Entre aspas, \"a + b\" seria só um texto.",
  },
  {
    id: "f1-estrito",
    fase: 1,
    enunciado: "O que aparece no console?",
    codigo: 'console.log(10 === "10");',
    opcoes: ["false", "true", "10", "Dá erro"],
    correta: "false",
    explicacao: "O === compara valor E tipo: número 10 e texto \"10\" são tipos diferentes.",
  },
  {
    id: "f1-atribuicao",
    fase: 1,
    enunciado: "Qual é o bug neste if?",
    codigo: 'let vida = 3;\nif (vida = 0) {\n  console.log("Fim de jogo");\n}',
    opcoes: ["Usou = em vez de ===", "Faltam aspas no 0", "if precisa de ;", "vida deveria ser const"],
    correta: "Usou = em vez de ===",
    explicacao: "Um = sozinho ATRIBUI o valor. Pra comparar, use ===.",
  },

  // ---------- Fase 2 (Modo Fúria): laços ----------
  {
    id: "f2-quantas-for",
    fase: 2,
    enunciado: "Quantas vezes aparece \"Fogo!\"?",
    codigo: 'for (let i = 0; i < 4; i++) {\n  console.log("Fogo!");\n}',
    opcoes: ["4", "3", "5", "Infinitas"],
    correta: "4",
    explicacao: "i vale 0, 1, 2 e 3 — quando chega em 4, a condição i < 4 fica falsa.",
  },
  {
    id: "f2-soma-for",
    fase: 2,
    enunciado: "O que aparece no console?",
    codigo: "let total = 0;\nfor (let i = 1; i <= 3; i++) {\n  total = total + i;\n}\nconsole.log(total);",
    opcoes: ["6", "3", "4", "0"],
    correta: "6",
    explicacao: "total soma 1, depois 2, depois 3: 0 + 1 + 2 + 3 = 6.",
  },
  {
    id: "f2-while-infinito",
    fase: 2,
    enunciado: "Por que este laço nunca termina?",
    codigo: "let i = 0;\nwhile (i < 5) {\n  console.log(i);\n}",
    opcoes: ["i nunca aumenta (falta i++)", "while não aceita <", "Falta um break", "console.log trava o laço"],
    correta: "i nunca aumenta (falta i++)",
    explicacao: "Sem i++ o i fica sempre 0, então i < 5 é sempre verdadeiro: um loop infinito!",
  },
  {
    id: "f2-incremento",
    fase: 2,
    enunciado: "O que completa a lacuna para o laço rodar 3 vezes?",
    codigo: 'for (let i = 0; i < 3; ____) {\n  console.log("Ataque!");\n}',
    opcoes: ["i++", "i--", "i = 0", "i < 3"],
    correta: "i++",
    explicacao: "i++ faz o i subir 0 → 1 → 2 → 3, e o laço para. Com i-- ele nunca chegaria a 3.",
  },
  {
    id: "f2-while-escamas",
    fase: 2,
    enunciado: "O que aparece no console?",
    codigo: "let escamas = 10;\nwhile (escamas > 4) {\n  escamas = escamas - 3;\n}\nconsole.log(escamas);",
    opcoes: ["4", "1", "7", "10"],
    correta: "4",
    explicacao: "10 → 7 → 4. Com 4, a condição 4 > 4 é falsa e o laço para.",
  },
  {
    id: "f2-ultimo",
    fase: 2,
    enunciado: "O que aparece no console?",
    codigo: "let ultimo;\nfor (let i = 2; i <= 8; i += 2) {\n  ultimo = i;\n}\nconsole.log(ultimo);",
    opcoes: ["8", "10", "6", "2"],
    correta: "8",
    explicacao: "i vale 2, 4, 6 e 8; a última volta guarda 8 em ultimo.",
  },
  {
    id: "f2-decremento",
    fase: 2,
    enunciado: "Quantos números aparecem no console?",
    codigo: "for (let i = 10; i > 0; i -= 5) {\n  console.log(i);\n}",
    opcoes: ["2", "10", "5", "1"],
    correta: "2",
    explicacao: "Aparecem 10 e 5. Depois i vira 0 e a condição i > 0 fica falsa.",
  },
  {
    id: "f2-break",
    fase: 2,
    enunciado: "O que aparece no console?",
    codigo: "for (let i = 1; i <= 5; i++) {\n  if (i === 3) break;\n  console.log(i);\n}",
    opcoes: ["1 e 2", "1, 2 e 3", "Só o 3", "1 até 5"],
    correta: "1 e 2",
    explicacao: "Quando i chega em 3, o break encerra o laço antes do console.log.",
  },
  {
    id: "f2-array",
    fase: 2,
    enunciado: "Quantas vezes o laço roda?",
    codigo: 'const golpes = ["fogo", "gelo", "raio"];\nfor (let i = 0; i < golpes.length; i++) {\n  console.log(golpes[i]);\n}',
    opcoes: ["3", "2", "4", "golpes.length - 1"],
    correta: "3",
    explicacao: "golpes.length é 3, então i vale 0, 1 e 2 — uma volta pra cada golpe.",
  },
  {
    id: "f2-sopro",
    fase: 2,
    enunciado: "O que falta para este laço NÃO virar um loop infinito?",
    codigo: 'let hp = 3;\nwhile (hp > 0) {\n  console.log("Sopro!");\n  ____;\n}',
    opcoes: ["hp--", "hp++", "hp = hp", "hp > 0"],
    correta: "hp--",
    explicacao: "hp-- diminui o hp a cada volta: 3 → 2 → 1 → 0, e o laço termina.",
  },
];

// Embaralha uma cópia (Fisher-Yates).
export function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Sorteia o próximo desafio da fase, sem repetir os já usados (quando
// acabam, recomeça a lista). As opções vêm embaralhadas.
export function sortearDesafio(fase, usados) {
  const daFase = DESAFIOS_DRAGAO.filter((d) => d.fase === fase);
  const disponiveis = daFase.filter((d) => !usados.includes(d.id));
  const lista = disponiveis.length > 0 ? disponiveis : daFase;
  const desafio = lista[Math.floor(Math.random() * lista.length)];
  return { ...desafio, opcoes: embaralhar(desafio.opcoes) };
}
