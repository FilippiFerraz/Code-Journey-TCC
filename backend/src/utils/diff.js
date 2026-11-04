// Compara "antes" e "depois" só nos campos informados e devolve um objeto
// { campo: { de, para } } com o que realmente mudou — usado pelos services
// de admin pra montar o "alteracoes" de LogAdmin (ver log.service.js).
function calcularDiferencas(antes, depois, campos) {
  const diferencas = {};

  for (const campo of campos) {
    const valorAntes = antes[campo];
    const valorDepois = depois[campo];

    if (JSON.stringify(valorAntes) !== JSON.stringify(valorDepois)) {
      diferencas[campo] = { de: valorAntes, para: valorDepois };
    }
  }

  return diferencas;
}

module.exports = { calcularDiferencas };
