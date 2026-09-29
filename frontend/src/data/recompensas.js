// src/data/recompensas.js
//
// Fonte de dados das recompensas concedidas ao vencer cada desafio.
// Por enquanto fica hardcoded aqui, seguindo o mesmo padrão já usado em
// ResolverDesafio (conteúdo hardcoded no frontend). Quando o modelo
// "Desafio" existir no backend (ver pendências do TCC — seção 5.2 do
// contexto), esses dados devem vir da API junto com o próprio desafio.
//
// Tipos de recompensa suportados hoje: "insignia" (badge/conquista) e
// "item" (item de inventário). Os dois usam a mesma tela visualmente,
// só muda o texto e o ícone.
//
// `imagemUrl` segue o mesmo formato de Item.imagemUrl no backend (nome do
// arquivo, resolvido por data/itemImagens.js); sem ela, a tela cai no emoji
// de `icone`.
//
// `falaMago` é a fala do mago na tela de recompensa: uma lista de
// parágrafos, cada um uma lista de trechos — trechos com `destaque: true`
// aparecem em dourado (o conceito de JavaScript reforçado pelo desafio).
// TODO: a fala também deve vir do backend junto com o desafio.
//
// Organizado por mundoId -> numero do desafio: o numero se repete em cada
// trilha/portal (desafio 1 do mundo 1 e desafio 1 do mundo 2 são coisas
// diferentes), então uma chave só pelo numero colidiria entre portais.
const recompensasPorMundo = {
  1: {
    1: {
      tipo: 'item',
      nome: 'Peitoral de Ferro',
      descricao:
        'Uma armadura simples, mas resistente — prova de que você sobreviveu ao seu primeiro combate de código.',
      icone: '🛡️',
      imagemUrl: 'Item_Peitoral.png',
      falaMago: [
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
    },
    2: {
      tipo: 'item',
      nome: 'Chapéu Goblin',
      descricao:
        'Um chapéu esfarrapado tomado do Goblin derrotado — nem toda vitória vem com um troféu bonito, mas essa você ganhou.',
      icone: '🎩',
      imagemUrl: 'chapeu_goblin.png',
      falaMago: [
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
  },
  2: {
    1: {
      tipo: 'insignia',
      nome: 'Guardião das Condicionais',
      descricao:
        'Uma insígnia concedida a quem provou domínio sobre if/else — a lógica que decide os rumos de qualquer programa.',
      icone: '🏅',
      falaMago: [
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
    },
    2: {
      tipo: 'insignia',
      nome: 'Voz do Sábio',
      descricao:
        'Uma insígnia concedida a quem sabe não só escrever código, mas explicar o que ele faz — a marca de quem realmente entende.',
      icone: '📜',
      falaMago: [
        [
          { texto: 'Sábias palavras, aventureiro! Saber ' },
          { texto: 'explicar o código', destaque: true },
          { texto: ' é um poder que poucos dominam.' },
        ],
        [{ texto: 'Quem entende o porquê das coisas nunca fica sem saída numa batalha.' }],
      ],
    },
  },
  3: {
    1: {
      tipo: 'insignia',
      nome: 'Mestre dos Laços',
      descricao:
        'Uma insígnia concedida a quem domina a repetição — a base de todo código que faz muito sem se repetir na hora de escrever.',
      icone: '🔁',
      falaMago: [
        [
          { texto: 'Formidável, aventureiro! Você dominou os ' },
          { texto: 'Laços de Repetição', destaque: true },
          { texto: ' e fez o código trabalhar por você.' },
        ],
        [{ texto: 'Um único comando repetido com sabedoria vale mais que mil golpes escritos à mão!' }],
      ],
    },
  },
};

// Recompensa usada quando o desafio ainda não tem uma entrada específica
// definida acima (evita a tela quebrar enquanto o conteúdo dos 6 desafios
// de cada trilha ainda não foi todo escrito — ver pendência 8.5 do TCC).
const recompensaPadrao = {
  tipo: 'item',
  nome: 'Recompensa Misteriosa',
  descricao: 'Você ganhou algo especial por essa vitória!',
  icone: '🎁',
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

export function getRecompensaPorDesafio(desafioId, mundoId = 1) {
  return recompensasPorMundo[mundoId]?.[desafioId] || recompensaPadrao;
}

export function getFalaMagoPorDesafio(desafioId, mundoId = 1) {
  const falaPropria = recompensasPorMundo[mundoId]?.[desafioId]?.falaMago;
  if (falaPropria) return falaPropria;
  return desafioId === NUMERO_DESAFIO_CHEFE ? falaMagoChefe : falaMagoPadrao;
}

export default recompensasPorMundo;
