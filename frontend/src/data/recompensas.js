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

const recompensas = {
  1: {
    tipo: 'insignia',
    nome: 'Insígnia "O Iniciado"',
    descricao: 'Prova de seu primeiro feito.',
    icone: '🏆',
  },
  2: {
    tipo: 'item',
    nome: '1 Item Raro: Um Pergaminho',
    descricao: 'Pergaminho com dicas secretas de código!',
    icone: '📜',
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

export function getRecompensaPorDesafio(desafioId) {
  return recompensas[desafioId] || recompensaPadrao;
}

export default recompensas;
