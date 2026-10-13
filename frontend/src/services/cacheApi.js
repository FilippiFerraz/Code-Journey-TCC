// Cache curto + deduplicação das leituras (GET) mais repetidas da API.
//
// O problema que isto resolve: uma mesma tela disparava a mesma chamada várias
// vezes ao mesmo tempo (a Home pedia /perfil 3 vezes: guarda de rota, hook de
// admin e a própria tela; /progresso e /baus 2 vezes) e cada navegação
// repetia tudo de novo. Cada chamada custa uma ida e volta de rede inteira.
//
// Regras (simples de propósito, pra nunca mostrar dado velho depois de o
// jogador mudar alguma coisa):
// - leituras iguais feitas ao mesmo tempo viram UMA chamada só;
// - o resultado fica guardado por poucos segundos (TTL);
// - QUALQUER escrita (POST/PUT/PATCH/DELETE) limpa o cache inteiro, então
//   depois de concluir um desafio, equipar um item etc. a próxima leitura
//   já vem fresca do servidor;
// - só as rotas listadas em REGRAS entram (nada de admin, login, busca...).

const TTL_CURTO_MS = 20 * 1000;
const TTL_LONGO_MS = 5 * 60 * 1000; // catálogo de itens quase nunca muda

const REGRAS = [
  { teste: /^\/perfil(\/\d+)?$/, ttl: TTL_CURTO_MS },
  { teste: /^\/progresso$/, ttl: TTL_CURTO_MS },
  { teste: /^\/personagem$/, ttl: TTL_CURTO_MS },
  { teste: /^\/baus$/, ttl: TTL_CURTO_MS },
  { teste: /^\/ranking$/, ttl: TTL_CURTO_MS },
  { teste: /^\/itens$/, ttl: TTL_LONGO_MS },
];

// POST .../verificar só confere uma ação (cartão, ingrediente, golpe) e não
// altera nada guardado — não precisa limpar o cache.
const NAO_LIMPA_CACHE = /\/verificar$/;

const guardado = new Map(); // chave -> { ate, resposta }
const emVoo = new Map(); // chave -> promessa
// Sobe a cada limpeza: uma resposta que estava a caminho quando o jogador
// alterou algo é entregue a quem pediu, mas NÃO é guardada (viria velha).
let geracao = 0;

function ttlDe(url) {
  const regra = REGRAS.find((r) => r.teste.test(url));
  return regra ? regra.ttl : 0;
}

function chaveDe(url, config) {
  const token = localStorage.getItem("token") || "";
  return token + "|" + url + "|" + JSON.stringify(config?.params ?? null);
}

// Cada chamador recebe a SUA cópia: uma tela que altere res.data não
// contamina o que está guardado nem o que as outras telas vão ler.
function clonar(resposta) {
  return { ...resposta, data: structuredClone(resposta.data) };
}

function enxugar(resposta) {
  const { data, status, statusText, headers, config } = resposta;
  return { data: structuredClone(data), status, statusText, headers, config };
}

export function limparCacheApi() {
  geracao += 1;
  guardado.clear();
  emVoo.clear();
}

export function instalarCache(api) {
  const lerOriginal = api.get.bind(api);

  api.get = (url, config) => {
    // com signal (cancelável) não compartilha: cancelar uma tela derrubaria
    // a chamada das outras
    const ttl = config?.signal ? 0 : ttlDe(url);
    if (!ttl) return lerOriginal(url, config);

    const chave = chaveDe(url, config);
    const guardada = guardado.get(chave);
    if (guardada && guardada.ate > Date.now()) return Promise.resolve(clonar(guardada.resposta));

    let promessa = emVoo.get(chave);
    if (!promessa) {
      const geracaoInicial = geracao;
      promessa = lerOriginal(url, config)
        .then((resposta) => {
          if (geracao === geracaoInicial) {
            guardado.set(chave, { ate: Date.now() + ttl, resposta: enxugar(resposta) });
          }
          return resposta;
        })
        .finally(() => {
          if (emVoo.get(chave) === promessa) emVoo.delete(chave);
        });
      emVoo.set(chave, promessa);
    }
    return promessa.then(clonar);
  };

  for (const metodo of ["post", "put", "patch", "delete"]) {
    const escreverOriginal = api[metodo].bind(api);
    api[metodo] = (url, ...resto) => {
      const promessa = escreverOriginal(url, ...resto);
      if (!NAO_LIMPA_CACHE.test(String(url))) promessa.then(limparCacheApi, limparCacheApi);
      return promessa;
    };
  }
}
