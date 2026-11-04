// Roda `tarefa` só depois que a tela atual terminou de baixar o que mostra —
// pra downloads em segundo plano (código das próximas telas, sons) não
// disputarem a rede com a imagem principal. Medido em 4G lenta: a pré-busca
// disparada pelo requestIdleCallback sozinho (CPU ociosa != rede livre)
// saía no meio do download do mapa da Home e atrasava ele em segundos.
//
// "Terminou" = todas as <img> da página carregadas (as com loading="lazy",
// que só baixam ao rolar, não contam) — com limite de tempo, pra uma imagem
// lenta ou quebrada nunca segurar a tarefa pra sempre. Depois disso, ainda
// espera o navegador ficar ocioso.
const INTERVALO_MS = 250;
const LIMITE_MS = 8000;

function imagensVisiveisProntas() {
  for (const imagem of document.images) {
    if (imagem.loading === "lazy") continue;
    if (!imagem.complete) return false;
  }
  return true;
}

function quandoOcioso(tarefa) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(tarefa, { timeout: 3000 });
  } else {
    setTimeout(tarefa, 300);
  }
}

export function quandoRedeLivre(tarefa) {
  const inicio = Date.now();
  // a tela (e as imagens dela) ainda está sendo montada quando isto é chamado:
  // a primeira olhada vem depois de um intervalo
  const conferir = () => {
    const carregou = document.readyState === "complete" && imagensVisiveisProntas();
    if (carregou || Date.now() - inicio > LIMITE_MS) quandoOcioso(tarefa);
    else setTimeout(conferir, INTERVALO_MS);
  };
  setTimeout(conferir, INTERVALO_MS);
}
