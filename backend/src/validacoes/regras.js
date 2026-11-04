// Regras de validação de campos, reaproveitadas pelos esquemas de cada rota
// (ver esquemas.js) e pelo middleware validar (middlewares/validacao.middleware.js).
//
// Base na LGPD (Lei nº 13.709/2018):
// - art. 6º, III (necessidade): todo texto tem tamanho máximo, e o
//   middleware descarta campos que a rota não usa — o servidor só trata o
//   dado que precisa;
// - art. 6º, V (qualidade dos dados): os valores são padronizados antes de
//   chegar no banco (espaços aparados, e-mail em minúsculas, números de
//   verdade em vez de texto) — um mesmo e-mail não vira duas contas;
// - art. 46 (segurança): entrada malformada é recusada logo na entrada,
//   antes de chegar nos services, no bcrypt ou na IA.
//
// Cada regra recebe o valor bruto e devolve o valor já normalizado, ou
// lança um erro 400 com a mensagem pronta pra mostrar na tela.

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function vazio(valor) {
  return valor === undefined || valor === null || (typeof valor === "string" && valor.trim() === "");
}

// Caracteres de controle e invisíveis (largura zero, direção de texto) não
// têm uso legítimo em nome/e-mail e servem pra disfarçar um texto como outro.
const CARACTERES_INVISIVEIS = /[\u0000-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/;

// Envolve uma regra pra aceitar o campo ausente (devolve undefined, e o
// middleware simplesmente não repassa o campo).
function opcional(regra) {
  return (valor, rotulo) => (vazio(valor) ? undefined : regra(valor, rotulo));
}

function texto({ min = 1, max, rotulo: rotuloFixo, removerQuebras = true } = {}) {
  return (valor, rotuloCampo) => {
    const rotulo = rotuloFixo || rotuloCampo;
    if (vazio(valor)) throw erroDeValidacao(`Preencha o campo "${rotulo}".`);
    if (typeof valor !== "string") throw erroDeValidacao(`Valor inválido para "${rotulo}".`);

    let limpo = valor.trim();
    if (removerQuebras) limpo = limpo.replace(/\s+/g, " ");

    if (limpo.length < min) {
      throw erroDeValidacao(`O campo "${rotulo}" precisa ter pelo menos ${min} caracteres.`);
    }
    if (max && limpo.length > max) {
      throw erroDeValidacao(`O campo "${rotulo}" pode ter no máximo ${max} caracteres.`);
    }
    return limpo;
  };
}

// ---------- Dados pessoais ----------

const NOME_MINIMO = 2;
const NOME_MAXIMO = 50;
// Letras (com acento, de qualquer idioma), números, espaço e . ' - _
const NOME_PERMITIDO = /^[\p{L}\p{M}0-9 .'_-]+$/u;

function nome(valor) {
  if (typeof valor === "string" && CARACTERES_INVISIVEIS.test(valor.replace(/[\t\n\r]/g, " "))) {
    throw erroDeValidacao("O nome contém caracteres inválidos.");
  }
  const limpo = texto({ min: NOME_MINIMO, max: NOME_MAXIMO, rotulo: "nome" })(valor);
  if (!NOME_PERMITIDO.test(limpo)) {
    throw erroDeValidacao("O nome pode ter apenas letras, números, espaços e os símbolos . ' - _");
  }
  return limpo;
}

// RFC 5321: até 254 caracteres no total e 64 antes do @.
const EMAIL_MAXIMO = 254;
const EMAIL_LOCAL_MAXIMO = 64;
const EMAIL_FORMATO = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

function email(valor) {
  if (vazio(valor)) throw erroDeValidacao("Informe o e-mail.");
  if (typeof valor !== "string") throw erroDeValidacao("Informe um e-mail válido.");

  // Minúsculas: o mesmo endereço digitado com letras diferentes não pode
  // virar duas contas (qualidade dos dados, art. 6º, V).
  const limpo = valor.trim().toLowerCase();
  if (CARACTERES_INVISIVEIS.test(limpo)) throw erroDeValidacao("Informe um e-mail válido.");
  if (limpo.length > EMAIL_MAXIMO || limpo.split("@")[0].length > EMAIL_LOCAL_MAXIMO) {
    throw erroDeValidacao("Este e-mail é longo demais.");
  }
  if (!EMAIL_FORMATO.test(limpo)) throw erroDeValidacao("Informe um e-mail válido.");
  return limpo;
}

// O bcrypt só considera os primeiros 72 bytes da senha — o que passar disso
// seria ignorado em silêncio, então é recusado.
const SENHA_MAXIMO_BYTES = 72;
const SENHA_MINIMO = 8;

function senhaInformada(valor) {
  if (vazio(valor) || typeof valor !== "string") throw erroDeValidacao("Informe a senha.");
  if (Buffer.byteLength(valor, "utf8") > SENHA_MAXIMO_BYTES) {
    throw erroDeValidacao("A senha pode ter no máximo 72 caracteres.");
  }
  return valor; // senha nunca é aparada nem alterada
}

// Senha NOVA (cadastro e redefinição). Login e confirmações usam
// senhaInformada, sem regra de força — senão contas antigas, criadas quando
// o mínimo era 6, deixariam de entrar.
function senhaNova(valor) {
  const senha = senhaInformada(valor);
  if (
    senha.length < SENHA_MINIMO ||
    !/[A-Z]/.test(senha) ||
    !/[a-z]/.test(senha) ||
    !/[^A-Za-z0-9\s]/.test(senha)
  ) {
    throw erroDeValidacao(
      "A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, letra minúscula e um caractere especial."
    );
  }
  return senha;
}

// Idade mínima de 13 anos já era a regra do cadastro — a faixa etária do
// público é decisão do grupo (ver art. 14 da LGPD), não desta validação.
const IDADE_MINIMA = 13;
const IDADE_MAXIMA = 120;

function idade(valor) {
  if (vazio(valor)) throw erroDeValidacao("Informe sua idade.");
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < IDADE_MINIMA || numero > IDADE_MAXIMA) {
    throw erroDeValidacao(`Informe uma idade válida (mínimo ${IDADE_MINIMA} anos).`);
  }
  return numero;
}

function codigoSeisDigitos(valor) {
  const limpo = String(valor ?? "").trim();
  if (!/^\d{6}$/.test(limpo)) throw erroDeValidacao("O código deve ter exatamente 6 dígitos.");
  return limpo;
}

// ---------- Tipos genéricos ----------

// Limite do tipo Int do PostgreSQL — acima disso o Prisma estoura erro 500.
const INTEIRO_MAXIMO = 2147483647;

function inteiro({ min = 1, max = INTEIRO_MAXIMO } = {}) {
  return (valor, rotulo) => {
    const textoValor = String(valor ?? "").trim();
    if (!/^-?\d+$/.test(textoValor)) throw erroDeValidacao(`Valor inválido para "${rotulo}".`);
    const numero = Number(textoValor);
    if (numero < min || numero > max) throw erroDeValidacao(`Valor inválido para "${rotulo}".`);
    return numero;
  };
}

const idPositivo = inteiro({ min: 1 });

function numero({ min, max }) {
  return (valor, rotulo) => {
    const convertido = Number(valor);
    if (!Number.isFinite(convertido) || convertido < min || convertido > max) {
      throw erroDeValidacao(`Valor inválido para "${rotulo}".`);
    }
    return convertido;
  };
}

function booleano(valor, rotulo) {
  if (valor === true || valor === "true") return true;
  if (valor === false || valor === "false") return false;
  throw erroDeValidacao(`O campo "${rotulo}" deve ser verdadeiro ou falso.`);
}

function umDe(valoresPermitidos) {
  return (valor, rotulo) => {
    if (!valoresPermitidos.includes(valor)) {
      throw erroDeValidacao(`Valor inválido para "${rotulo}".`);
    }
    return valor;
  };
}

// Identificador curto vindo do frontend (id de alternativa, de bloco, de
// pergunta...) — texto ou número, sempre pequeno.
function identificador(valor, rotulo) {
  if ((typeof valor !== "string" && typeof valor !== "number") || String(valor).length === 0 || String(valor).length > 50) {
    throw erroDeValidacao(`Valor inválido para "${rotulo}".`);
  }
  return valor;
}

function lista(regraItem, { max = 50 } = {}) {
  return (valor, rotulo) => {
    if (!Array.isArray(valor) || valor.length > max) {
      throw erroDeValidacao(`Valor inválido para "${rotulo}".`);
    }
    return valor.map((item) => regraItem(item, rotulo));
  };
}

// Objeto com campos fixos (ex: cada golpe da batalha de chefe). Campos fora
// do esquema são descartados, igual ao corpo da requisição.
function objeto(esquema) {
  return (valor, rotulo) => {
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
      throw erroDeValidacao(`Valor inválido para "${rotulo}".`);
    }
    const resultado = {};
    for (const [campo, regra] of Object.entries(esquema)) {
      resultado[campo] = regra(valor[campo], rotulo);
    }
    return resultado;
  };
}

module.exports = {
  erroDeValidacao,
  opcional,
  texto,
  nome,
  email,
  senhaInformada,
  senhaNova,
  idade,
  codigoSeisDigitos,
  inteiro,
  idPositivo,
  numero,
  booleano,
  umDe,
  identificador,
  lista,
  objeto,
  NOME_MAXIMO,
};
