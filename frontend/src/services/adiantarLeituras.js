import api from "./api";

// Começa as leituras da API que a tela vai pedir LOGO na abertura do site,
// antes do React montar qualquer coisa.
//
// O problema: com as telas carregadas sob demanda (telas.js), nada dentro do
// <Suspense> monta enquanto o arquivo da tela baixa — nem a guarda de rota
// (RotaProtegida) nem a tela. As chamadas à API só começavam DEPOIS do
// download do código, em fila: HTML -> pacote principal -> código da tela ->
// API. Medido em 4G: as leituras saíam em ~0,9 s, com o pacote principal
// pronto em ~0,5 s.
//
// Aqui elas saem junto com o download do código. Quando a tela pede a mesma
// leitura, o cache de cacheApi.js entrega a resposta (ou a chamada que já
// está a caminho) em vez de ir de novo ao servidor. Só entram rotas que
// estão nas REGRAS de lá — as outras não seriam reaproveitadas.

// Lidas em praticamente toda tela logada: cartão do perfil e verificação
// de admin (/perfil), avatar do herói (/personagem).
const SEMPRE = ["/perfil", "/personagem"];

// Leituras a mais conforme a tela aberta. Cada leitura é uma URL ou, quando
// depende da rota, uma função (partes do caminho) -> [url, config]. A config
// precisa ser IGUAL à que a tela usa, senão a chave do cache não bate.
const POR_ROTA = [
  { teste: /^\/home$/, leituras: ["/progresso", "/baus"] },
  // guarda RotaDesafio (components/Rotas.jsx) confere o progresso
  { teste: /^\/(dificuldade|desafios|desafio|codigo|desafio-chefe|desafio-pocao|pocao|etapas|recompensa|bau)\//, leituras: ["/progresso"] },
  // lista de desafios da trilha (pages/Desafios/Desafios.jsx)
  {
    teste: /^\/desafios\/([^/]+)\/([^/]+)$/,
    leituras: [([, mundoId, dificuldade]) => ["/progresso", { params: { mundoId, dificuldade } }]],
  },
  // conteúdo do desafio do portal 3 (pages/DesafioEtapas/DesafioEtapas.jsx)
  {
    teste: /^\/etapas\/([^/]+)\/([^/]+)\/([^/]+)$/,
    leituras: [([, mundoId, dificuldade, desafioId]) => [`/desafios/${mundoId}/${dificuldade}/${desafioId}`]],
  },
  { teste: /^\/bau\//, leituras: ["/baus"] },
  { teste: /^\/ranking$/, leituras: ["/ranking"] },
  { teste: /^\/desafio-do-rei$/, leituras: ["/baus/rei"] },
  { teste: /^\/desafio-dos-cristais$/, leituras: ["/baus/cristal"] },
  { teste: /^\/batalha-do-dragao$/, leituras: ["/baus/dragao"] },
];

// Telas públicas: sem leituras (nem token, normalmente).
const PUBLICAS = /^\/($|cadastrar|verificar-email|esqueci-senha)/;

export function adiantarLeituras(caminho) {
  if (PUBLICAS.test(caminho)) return;
  const leituras = new Map(SEMPRE.map((url) => [url, [url]])); // chave -> [url, config]
  for (const { teste, leituras: extras } of POR_ROTA) {
    const partes = caminho.match(teste);
    if (!partes) continue;
    for (const leitura of extras) {
      const pedido = typeof leitura === "function" ? leitura(partes.map(decodeURIComponent)) : [leitura];
      leituras.set(JSON.stringify(pedido), pedido);
    }
  }
  // Erros ficam pra quem pedir de verdade (a tela trata do jeito dela); um
  // 401 aqui já cai no interceptor de api.js, igual aconteceria depois.
  leituras.forEach(([url, config]) => api.get(url, config).catch(() => {}));
}
