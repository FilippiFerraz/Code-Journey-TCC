import "./TelaCarregando.css";

// Mostrada pelo <Suspense> enquanto o arquivo de uma tela ainda está sendo
// baixado (ver telas.js). Tem o mesmo fundo do app pra não piscar branco.
export default function TelaCarregando() {
  return (
    <div className="tela-carregando" role="status" aria-live="polite" aria-label="Carregando">
      <span className="tela-carregando-ponto" />
      <span className="tela-carregando-ponto" />
      <span className="tela-carregando-ponto" />
    </div>
  );
}
