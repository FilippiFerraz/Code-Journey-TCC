// Baixa imagens em segundo plano pro cache do navegador, sem mostrar nada.
//
// Usado nas introduções dos desafios: enquanto o jogador lê as falas, a rede
// está parada — aproveita pra já baixar o fundo da batalha (100–200 KB) e os
// inimigos, que entram via CSS (background-image) e por isso só começariam
// a baixar no instante em que a batalha aparece. Espera a tela atual
// terminar as próprias imagens (quandoRedeLivre) pra não disputar a rede com
// elas, e respeita o modo "economia de dados" do celular.
import { quandoRedeLivre } from "./redeLivre";

const jaPedidas = new Set();

export function precarregarImagens(urls) {
  if (navigator.connection?.saveData) return;
  const novas = urls.filter((url) => url && !jaPedidas.has(url));
  if (novas.length === 0) return;
  novas.forEach((url) => jaPedidas.add(url));
  quandoRedeLivre(() => {
    for (const url of novas) {
      const imagem = new Image();
      imagem.decoding = "async";
      imagem.src = url;
    }
  });
}

// Imagens de uma cena de batalha no formato usado pelas telas de desafio
// ({ fundo, inimigo: { imagem }, inimigos: [{ imagem }] }).
export function imagensDaCena(cena) {
  if (!cena) return [];
  const inimigos = cena.inimigos ?? (cena.inimigo ? [cena.inimigo] : []);
  return [cena.fundo, ...inimigos.map((i) => i?.imagem)];
}
