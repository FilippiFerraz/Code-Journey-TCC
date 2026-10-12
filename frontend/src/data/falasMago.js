// src/data/falasMago.js
//
// Fala do mago na tela de recompensa (RecompensaDesafio.jsx), reforçando o
// conceito de JavaScript que o desafio trabalhou. A recompensa em si (o item
// de equipamento, quando o desafio dá um) vem sempre da API — ver
// formatarItem em backend/src/services/progresso.service.js.
//
// Cada fala é uma lista de parágrafos, e cada parágrafo uma lista de
// trechos — trechos com `destaque: true` aparecem em dourado.
// TODO: a fala também deve vir do backend junto com o desafio.
//
// Organizado por mundoId -> numero do desafio: o numero se repete em cada
// trilha/portal (desafio 1 do mundo 1 e desafio 1 do mundo 2 são coisas
// diferentes), então uma chave só pelo numero colidiria entre portais.
const falasPorMundo = {
  1: {
    1: [
      [
        { texto: 'Excelente trabalho, aventureiro! Sua primeira ' },
        { texto: 'Palavra de Comando', destaque: true },
        {
          texto:
            ' foi um sucesso esmagador! O inimigo foi forçado a recuar, provando o poder do seu código.',
        },
      ],
      [
        { texto: 'Você domina o conceito de ' },
        { texto: 'Saída de Dados', destaque: true },
        { texto: ' e deu o passo mais importante: começar!' },
      ],
    ],
    2: [
      [
        { texto: 'Muito bem, aventureiro! O Goblin tentou te confundir, mas você enxergou através da ' },
        { texto: 'Reatribuição de Variáveis', destaque: true },
        { texto: '.' },
      ],
      [
        { texto: 'Entender os ' },
        { texto: 'Tipos de Dados', destaque: true },
        { texto: ' é o que separa um aprendiz de um verdadeiro programador!' },
      ],
    ],
  },
  2: {
    1: [
      [
        { texto: 'Impressionante, aventureiro! Você escolheu o caminho certo usando ' },
        { texto: 'if/else', destaque: true },
        { texto: ' como um verdadeiro estrategista.' },
      ],
      [
        { texto: 'Com as ' },
        { texto: 'Condicionais', destaque: true },
        { texto: ', seu código agora sabe tomar decisões sozinho!' },
      ],
    ],
    2: [
      [
        { texto: 'Sábias palavras, aventureiro! Saber ' },
        { texto: 'explicar o código', destaque: true },
        { texto: ' é um poder que poucos dominam.' },
      ],
      [{ texto: 'Quem entende o porquê das coisas nunca fica sem saída numa batalha.' }],
    ],
  },
  // Portal 3 — Arena do Dragão (desafios de 3 etapas, ver
  // backend/prisma/desafios/portal3.js).
  3: {
    1: [
      [
        { texto: 'Impressionante! Você atravessou o labirinto dominando ' },
        { texto: 'escopo', destaque: true },
        { texto: ', ' },
        { texto: 'hoisting', destaque: true },
        { texto: ' e a ' },
        { texto: 'zona morta temporal', destaque: true },
        { texto: '.' },
      ],
      [{ texto: 'Saber onde uma variável vive é o primeiro passo para nunca ser pego de surpresa.' }],
    ],
    2: [
      [
        { texto: 'As garras foram cortadas! Agora você entende as ' },
        { texto: 'closures', destaque: true },
        { texto: ': funções que lembram do lugar onde nasceram.' },
      ],
      [{ texto: 'Fábricas de funções e contadores independentes são poderes de quem domina o escopo.' }],
    ],
    3: [
      [
        { texto: 'O Mestre dos Arrays se curvou! ' },
        { texto: 'map', destaque: true },
        { texto: ', ' },
        { texto: 'filter', destaque: true },
        { texto: ' e ' },
        { texto: 'reduce', destaque: true },
        { texto: ' agora obedecem a você.' },
      ],
      [{ texto: 'Um bom encadeamento transforma uma lista inteira em uma única linha de feitiço.' }],
    ],
    4: [
      [
        { texto: 'O relógio voltou a girar certo! Você decifrou o ' },
        { texto: 'event loop', destaque: true },
        { texto: ' e a ordem entre código síncrono, ' },
        { texto: 'Promises', destaque: true },
        { texto: ' e timers.' },
      ],
      [{ texto: 'Quem entende o tempo do JavaScript nunca mais se perde no assíncrono.' }],
    ],
    5: [
      [
        { texto: 'Os espelhos se quebraram! Você viu através da ' },
        { texto: 'coerção de tipos', destaque: true },
        { texto: ' e das armadilhas de ' },
        { texto: 'referência', destaque: true },
        { texto: '.' },
      ],
      [{ texto: 'Comparar com === e copiar com spread é a marca de quem desconfia na medida certa.' }],
    ],
    6: [
      [
        { texto: 'INACREDITÁVEL! O ' },
        { texto: 'Dragão do Código', destaque: true },
        { texto: ' caiu diante de você!' },
      ],
      [
        { texto: 'Recursão, ' },
        { texto: 'this', destaque: true },
        { texto: ' e as manhas da linguagem: você dominou o JavaScript avançado da Arena do Dragão.' },
      ],
    ],
  },
};

// Falas genéricas do mago pra desafios que ainda não têm uma fala própria.
// O desafio-chefe (último de cada trilha) ganha uma fala à parte.
const falaMagoPadrao = [
  [
    { texto: 'Excelente trabalho, aventureiro! Sua ' },
    { texto: 'lógica', destaque: true },
    { texto: ' foi afiada como uma lâmina, e o inimigo não teve chance.' },
  ],
  [{ texto: 'Continue assim e nenhum desafio será páreo para você!' }],
];

const falaMagoChefe = [
  [
    { texto: 'Inacreditável, aventureiro! O ' },
    { texto: 'chefe da trilha', destaque: true },
    { texto: ' caiu diante do seu código!' },
  ],
  [
    { texto: 'Tudo o que você aprendeu neste portal se uniu num só golpe. O caminho para o ' },
    { texto: 'próximo portal', destaque: true },
    { texto: ' está livre!' },
  ],
];

// Mesmo número do desafio-chefe usado em Desafios.jsx (ID_DESAFIO_CHEFE).
export const NUMERO_DESAFIO_CHEFE = 6;

export function getFalaMagoPorDesafio(desafioId, mundoId = 1) {
  const falaPropria = falasPorMundo[mundoId]?.[desafioId];
  if (falaPropria) return falaPropria;
  return desafioId === NUMERO_DESAFIO_CHEFE ? falaMagoChefe : falaMagoPadrao;
}
