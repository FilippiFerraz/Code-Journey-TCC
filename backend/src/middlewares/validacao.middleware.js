// Valida e padroniza params, query e body de uma rota a partir de um
// esquema (ver validacoes/esquemas.js), antes do controller rodar.
//
// Cada parte declarada no esquema é SUBSTITUÍDA pela versão validada: os
// campos que a rota não declara são descartados (princípio da necessidade,
// art. 6º, III da LGPD — o servidor não trata dado que não usa), e os que
// ficam já chegam normalizados (e-mail em minúsculas, números convertidos,
// espaços aparados). Partes não declaradas (ex: body de uma rota que só
// valida params) passam intactas.
//
// Erro de validação vira 400 { erro } pelo error.middleware, igual ao resto
// da API — as telas já sabem mostrar essa mensagem.
function validar(esquema) {
  return (req, res, next) => {
    try {
      for (const origem of ["params", "query", "body"]) {
        const campos = esquema[origem];
        if (!campos) continue;

        const entrada = req[origem] && typeof req[origem] === "object" && !Array.isArray(req[origem])
          ? req[origem]
          : {};
        const validado = {};

        for (const [nomeCampo, { regra, rotulo }] of Object.entries(campos)) {
          const valor = regra(entrada[nomeCampo], rotulo);
          if (valor !== undefined) validado[nomeCampo] = valor;
        }

        req[origem] = validado;
      }
      return next();
    } catch (erro) {
      return next(erro);
    }
  };
}

module.exports = validar;
