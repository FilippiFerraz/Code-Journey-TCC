// Validação dos formulários de conta (Cadastro, Login, EsqueciSenha,
// VerificarEmail) — espelho das regras do backend
// (backend/src/validacoes/regras.js). Aqui é só usabilidade: avisa na hora
// o que o servidor recusaria. Quem garante as regras de verdade é o backend.
//
// Cada função devolve a mensagem de erro, ou "" quando o valor é válido.

export const NOME_MAXIMO = 50;
export const EMAIL_MAXIMO = 254;
export const SENHA_MAXIMO = 72;
export const IDADE_MINIMA = 13;

export const DICA_SENHA =
  "Mínimo 8 caracteres, com letra maiúscula, letra minúscula e um caractere especial.";

const NOME_PERMITIDO = /^[\p{L}\p{M}0-9 .'_-]+$/u;
const EMAIL_FORMATO = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export function validarNome(nome) {
  const limpo = nome.trim().replace(/\s+/g, " ");
  if (limpo.length < 2) return "O nome precisa ter pelo menos 2 caracteres.";
  if (limpo.length > NOME_MAXIMO) return `O nome pode ter no máximo ${NOME_MAXIMO} caracteres.`;
  if (!NOME_PERMITIDO.test(limpo)) {
    return "O nome pode ter apenas letras, números, espaços e os símbolos . ' - _";
  }
  return "";
}

export function validarEmail(email) {
  const limpo = email.trim().toLowerCase();
  if (!limpo) return "Informe o e-mail.";
  if (limpo.length > EMAIL_MAXIMO) return "Este e-mail é longo demais.";
  if (!EMAIL_FORMATO.test(limpo)) return "Informe um e-mail válido.";
  return "";
}

// Senha NOVA (cadastro e redefinição). No login não se aplica: contas
// antigas foram criadas quando o mínimo era 6.
export function validarSenhaNova(senha) {
  if (new TextEncoder().encode(senha).length > SENHA_MAXIMO) {
    return "A senha pode ter no máximo 72 caracteres.";
  }
  if (
    senha.length < 8 ||
    !/[A-Z]/.test(senha) ||
    !/[a-z]/.test(senha) ||
    !/[^A-Za-z0-9\s]/.test(senha)
  ) {
    return `A senha não atende aos requisitos: ${DICA_SENHA.toLowerCase()}`;
  }
  return "";
}

export function validarIdade(idade) {
  const numero = Number(idade);
  if (!Number.isInteger(numero) || numero < IDADE_MINIMA || numero > 120) {
    return `Informe uma idade válida (mínimo ${IDADE_MINIMA} anos).`;
  }
  return "";
}

export function validarCodigo(codigo) {
  if (!/^\d{6}$/.test(codigo.trim())) return "O código deve ter exatamente 6 dígitos.";
  return "";
}
