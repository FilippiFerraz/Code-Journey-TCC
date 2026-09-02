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
    },
    2: {
      tipo: 'item',
      nome: 'Chapéu Goblin',
      descricao:
        'Um chapéu esfarrapado tomado do Goblin derrotado — nem toda vitória vem com um troféu bonito, mas essa você ganhou.',
      icone: '🎩',
    },
  },
  2: {
    1: {
      tipo: 'insignia',
      nome: 'Guardião das Condicionais',
      descricao:
        'Uma insígnia concedida a quem provou domínio sobre if/else — a lógica que decide os rumos de qualquer programa.',
      icone: '🏅',
    },
    2: {
      tipo: 'insignia',
      nome: 'Voz do Sábio',
      descricao:
        'Uma insígnia concedida a quem sabe não só escrever código, mas explicar o que ele faz — a marca de quem realmente entende.',
      icone: '📜',
    },
  },
  3: {
    1: {
      tipo: 'insignia',
      nome: 'Mestre dos Laços',
      descricao:
        'Uma insígnia concedida a quem domina a repetição — a base de todo código que faz muito sem se repetir na hora de escrever.',
      icone: '🔁',
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

export function getRecompensaPorDesafio(desafioId, mundoId = 1) {
  return recompensasPorMundo[mundoId]?.[desafioId] || recompensaPadrao;
}

export default recompensasPorMundo;
