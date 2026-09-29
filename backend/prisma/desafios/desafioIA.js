// Desafio 2 do mundo 2 ("Acampamento Goblin"): resposta dissertativa
// corrigida por IA (ver src/services/ia.service.js).
//
// Fica num arquivo próprio pra ser usado em dois lugares sem duplicar:
// - prisma/seed.js (semeia o banco inteiro)
// - scripts/criarDesafioIA.js (cadastra só este desafio, sem mexer no resto)
//
// Em "alternativas", os campos que a IA usa pra corrigir:
// - codigo: trecho mostrado pro jogador e enviado junto pra IA
// - criterios: o que a resposta PRECISA ter pra ser considerada correta
// - respostaReferencia: um exemplo de resposta certa (não precisa ser igual)
// O frontend mostra o mesmo enunciado/código (ver DESAFIOS[2][2] em
// frontend/src/pages/ResolverDesafio/ResolverDesafio.jsx) — se mudar um,
// mude o outro.

const CODIGO = `let moedas = 7;

if (moedas >= 10) {
  console.log("Você pode comprar a espada!");
} else if (moedas >= 5) {
  console.log("Você pode comprar o escudo!");
} else {
  console.log("Continue juntando moedas.");
}`;

module.exports = {
  mundoId: 2,
  dificuldade: "iniciante",
  numero: 2,
  titulo: "O Enigma da Bruxa",
  enunciado:
    "A Bruxa do Acampamento guarda o portão com um enigma e só deixa passar quem entende de verdade como o JavaScript toma decisões.\n\nLeia o código abaixo e explique, com suas palavras, qual mensagem aparece no console e por quê.",
  dica: "o JavaScript testa as condições de cima para baixo e executa só o primeiro bloco cuja condição for verdadeira.",
  alternativas: {
    tipo: "dissertativa",
    codigo: CODIGO,
    criterios: [
      'Diz qual mensagem aparece no console: "Você pode comprar o escudo!" (vale uma paráfrase clara, como "aparece a mensagem do escudo").',
      "Explica que a primeira condição (moedas >= 10) é falsa, porque 7 é menor que 10.",
      "Explica que a segunda condição (moedas >= 5) é verdadeira, porque 7 é maior ou igual a 5, e por isso o bloco do else if é executado.",
      "Não afirma que mais de uma mensagem aparece: só um dos blocos (if, else if ou else) é executado.",
    ],
    respostaReferencia:
      'Aparece "Você pode comprar o escudo!". O programa testa as condições em ordem: 7 não é maior ou igual a 10, então o primeiro bloco é pulado; 7 é maior ou igual a 5, então o else if é executado e mostra a mensagem do escudo. Como uma condição já foi verdadeira, o else não roda.',
  },
  xpConcedido: 15,
  // mesma insígnia já prevista no frontend pra este desafio (ver
  // recompensasPorMundo[2][2] em frontend/src/data/recompensas.js)
  tipoRecompensa: "insignia",
  nomeRecompensa: "Voz do Sábio",
  descricaoRecompensa:
    "Uma insígnia concedida a quem sabe não só escrever código, mas explicar o que ele faz — a marca de quem realmente entende.",
  iconeRecompensa: "📜",
};
