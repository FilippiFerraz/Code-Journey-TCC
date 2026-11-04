import mago from "../../assets/images/Mago.webp";
import { linksExternos } from "../../utils/buscarDuvida";

// Resposta do Mago para uma dúvida pesquisada na barra (modo "Dúvidas" —
// ver BarraPesquisa.jsx). Abre como painel logo abaixo da barra, no mesmo
// lugar da lista de jogadores, com o visual do balão do Mago da Home
// (TutorialHome / AvisoPortalBloqueado).
//   resposta: { tipo: "resposta", entrada, relacionadas } | { tipo: "naoEncontrado", termo }

const FALA_NAO_ENCONTRADO =
  "Esse feitiço ainda não está no meu grimório... mas estes pergaminhos antigos podem te ajudar!";

function RespostaMago({ resposta, onFechar, onAbrirRelacionada }) {
  const encontrou = resposta.tipo === "resposta";

  return (
    <section className="busca-resposta" aria-live="polite" aria-label="Resposta do mago">
      <div className="busca-resposta-cena">
        <img src={mago} alt="" className="busca-resposta-mago" draggable={false} />

        <div className="busca-resposta-balao">
          {encontrou ? (
            <>
              <h3 className="busca-resposta-titulo">{resposta.entrada.titulo}</h3>
              <p className="busca-resposta-fala">{resposta.entrada.explicacao}</p>
              <pre className="busca-resposta-codigo">
                <code>{resposta.entrada.exemplo}</code>
              </pre>
            </>
          ) : (
            <>
              <h3 className="busca-resposta-titulo">Hmm, deixe-me ver...</h3>
              <p className="busca-resposta-fala">{FALA_NAO_ENCONTRADO}</p>
              {/* TODO: registrar no backend as dúvidas sem resposta (servirá para melhorar a base e como dado para o TCC) */}
              <ul className="busca-resposta-links">
                {linksExternos(resposta.termo).map((link) => (
                  <li key={link.nome}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="busca-resposta-link">
                      <i className="hn hn-external-link" aria-hidden="true" /> {link.nome}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {encontrou && resposta.relacionadas.length > 0 && (
        <div className="busca-resposta-relacionadas">
          <p className="busca-resposta-relacionadas-titulo">Você também pode querer saber:</p>
          {resposta.relacionadas.map((entrada) => (
            <button
              key={entrada.id}
              type="button"
              className="busca-resposta-relacionada"
              onClick={() => onAbrirRelacionada(entrada)}
            >
              {entrada.titulo}
            </button>
          ))}
        </div>
      )}

      <div className="busca-resposta-rodape">
        <button type="button" className="busca-resposta-fechar" onClick={onFechar}>
          Fechar e voltar à pesquisa
        </button>
      </div>
    </section>
  );
}

export default RespostaMago;
