// Busca de dúvidas de JavaScript no grimório local (data/baseDuvidas.js),
// usada pela barra de pesquisa da Home no modo "Dúvidas". SEM IA: só
// normalização de texto e contagem de palavras-chave.
//
// Isolada do componente de propósito — para trocar por uma API depois, basta
// manter a mesma assinatura: buscarDuvida(texto) -> { melhor, relacionadas }.
// TODO: quando a base for para o banco, trocar por GET /api/duvidas?q=
import { BASE_DUVIDAS } from "../data/baseDuvidas";

// Palavras que não ajudam a identificar o assunto da dúvida.
const PALAVRAS_VAZIAS = new Set([
  "como", "o", "a", "os", "as", "de", "que", "eu", "faco", "fazer", "para", "pra", "um", "uma",
  "e", "é", "no", "na", "nos", "nas", "do", "da", "dos", "das", "em", "qual", "quais", "quero",
  "se", "ao", "com", "por", "me", "meu", "minha", "isso", "esse", "essa", "usar", "uso",
  "serve", "funciona", "javascript", "js",
]);

// Pontuação mínima para uma entrada contar como resposta (1 palavra-chave).
const PONTUACAO_MINIMA = 1;
const MAXIMO_RELACIONADAS = 2;

// minúsculas e sem acentos ("Função" -> "funcao")
function semAcentos(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Texto do jogador pronto para comparar:
// - "tecnico": mantém símbolos (para achar console.log, ===, ${, //...)
// - "palavras": só letras e números, sem palavras vazias
// - "frase": as palavras juntas por espaço (para palavras-chave compostas,
//   como "is not defined")
export function normalizarTexto(texto) {
  const tecnico = semAcentos(texto).replace(/\s+/g, " ").trim();
  const palavras = tecnico
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((palavra) => palavra && !PALAVRAS_VAZIAS.has(palavra));
  return { tecnico, palavras: new Set(palavras), frase: ` ${palavras.join(" ")} ` };
}

// Palavra-chave com algum símbolo (console.log, ===, %, //) é procurada
// como está; sem símbolos, como palavra inteira (ou frase inteira).
function temSimbolo(palavraChave) {
  return /[^a-z0-9 ]/.test(palavraChave);
}

function casou(palavraChave, normalizado) {
  const chave = semAcentos(palavraChave);
  if (temSimbolo(chave)) return normalizado.tecnico.includes(chave);
  if (chave.includes(" ")) return normalizado.frase.includes(` ${chave} `);
  return normalizado.palavras.has(chave);
}

// Quantas palavras-chave da entrada aparecem no texto.
export function pontuarEntrada(entrada, normalizado) {
  return entrada.palavrasChave.reduce((total, chave) => total + (casou(chave, normalizado) ? 1 : 0), 0);
}

export function duvidaPorId(id) {
  return BASE_DUVIDAS.find((entrada) => entrada.id === id) ?? null;
}

// Devolve { melhor, relacionadas }:
// - melhor: a entrada com mais palavras-chave casadas (empate: a primeira
//   da lista), ou null se nenhuma atingiu PONTUACAO_MINIMA;
// - relacionadas: até 2 outras sugestões — primeiro as que também casaram
//   com a pergunta, depois as "relacionadas" cadastradas na melhor.
export function buscarDuvida(texto) {
  const normalizado = normalizarTexto(texto);
  if (!normalizado.tecnico) return { melhor: null, relacionadas: [] };

  const pontuadas = BASE_DUVIDAS.map((entrada, posicao) => ({
    entrada,
    posicao,
    pontos: pontuarEntrada(entrada, normalizado),
  }))
    .filter((item) => item.pontos >= PONTUACAO_MINIMA)
    .sort((a, b) => b.pontos - a.pontos || a.posicao - b.posicao);

  if (pontuadas.length === 0) return { melhor: null, relacionadas: [] };

  const melhor = pontuadas[0].entrada;
  return { melhor, relacionadas: relacionadasDe(melhor, pontuadas.slice(1).map((item) => item.entrada)) };
}

// Sugestões para mostrar junto de uma entrada (também usado ao abrir uma
// relacionada pelo clique, quando não há outras entradas casadas).
export function relacionadasDe(entrada, outrasCasadas = []) {
  const sugestoes = [];
  const jaTem = new Set([entrada.id]);
  const adicionar = (candidata) => {
    if (candidata && !jaTem.has(candidata.id) && sugestoes.length < MAXIMO_RELACIONADAS) {
      jaTem.add(candidata.id);
      sugestoes.push(candidata);
    }
  };
  outrasCasadas.forEach(adicionar);
  entrada.relacionadas.map(duvidaPorId).forEach(adicionar);
  return sugestoes;
}

// Links de busca para o fallback (abrem em nova aba).
export function linksExternos(termo) {
  const q = encodeURIComponent(String(termo ?? "").trim());
  return [
    { nome: "MDN em português", url: `https://developer.mozilla.org/pt-BR/search?q=${q}` },
    { nome: "Stack Overflow em Português", url: `https://pt.stackoverflow.com/search?q=${q}` },
  ];
}
