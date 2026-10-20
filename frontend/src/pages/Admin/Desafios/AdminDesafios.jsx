import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import { TIPOS, nomeDificuldade, nomePortal, rotuloTipo } from "./tiposDesafio";
import "./AdminDesafios.css";

// Gestão de desafios: um bloco por portal do mapa ("Portal 1 — Vila
// Inicial"); ao clicar, ele abre com todos os desafios daquele portal,
// separados por dificuldade, e cada um leva ao editor
// (EditarDesafioAdmin.jsx). O portal aberto fica na URL (?portal=1), então
// voltar do editor reabre o mesmo portal.
function AdminDesafios() {
  const navigate = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const portalAberto = parametros.get("portal");

  const [desafios, setDesafios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    api
      .get("/admin/desafios")
      .then((res) => ativo && setDesafios(res.data))
      .catch(() => ativo && setErro("Não foi possível carregar os desafios."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  // { mundoId, desafios, dificuldades: [{ dificuldade, desafios }] } por portal
  const portais = useMemo(() => {
    const porMundo = new Map();
    for (const desafio of desafios) {
      if (!porMundo.has(desafio.mundoId)) porMundo.set(desafio.mundoId, []);
      porMundo.get(desafio.mundoId).push(desafio);
    }
    return [...porMundo.entries()]
      .sort(([a], [b]) => a - b)
      .map(([mundoId, lista]) => {
        const porDificuldade = new Map();
        for (const desafio of lista) {
          if (!porDificuldade.has(desafio.dificuldade)) porDificuldade.set(desafio.dificuldade, []);
          porDificuldade.get(desafio.dificuldade).push(desafio);
        }
        return {
          mundoId,
          desafios: lista,
          dificuldades: [...porDificuldade.entries()].map(([dificuldade, itens]) => ({ dificuldade, desafios: itens })),
        };
      });
  }, [desafios]);

  function alternarPortal(mundoId) {
    const id = String(mundoId);
    setParametros(portalAberto === id ? {} : { portal: id }, { replace: true });
  }

  return (
    <MainLayout titulo="Desafios">
      <div className="admin-desafios">
        <BotaoPixel
          className="admin-desafios-voltar"
          classeMiolo="admin-desafios-voltar-miolo"
          onClick={() => navigate("/admin")}
        >
          <i className="hn hn-arrow-left" aria-hidden="true" /> Painel
        </BotaoPixel>

        {carregando ? (
          <p className="admin-desafios-mensagem">Carregando…</p>
        ) : erro ? (
          <p className="admin-desafios-mensagem admin-desafios-mensagem--erro">{erro}</p>
        ) : portais.length === 0 ? (
          <p className="admin-desafios-mensagem">Nenhum desafio cadastrado ainda.</p>
        ) : (
          <>
            <p className="admin-desafios-dica">Escolha um portal para ver e editar os desafios dele.</p>
            <div className="admin-portais">
              {portais.map((portal) => {
                const aberto = portalAberto === String(portal.mundoId);
                const idLista = `admin-portal-${portal.mundoId}`;
                return (
                  <section key={portal.mundoId} className={`admin-portal${aberto ? " admin-portal--aberto" : ""}`}>
                    <button
                      type="button"
                      className="admin-portal-cabecalho"
                      onClick={() => alternarPortal(portal.mundoId)}
                      aria-expanded={aberto}
                      aria-controls={idLista}
                    >
                      <span className="admin-portal-numero">{portal.mundoId}</span>
                      <span className="admin-portal-textos">
                        <strong>Desafios do Portal {portal.mundoId}</strong>
                        <small>
                          {nomePortal(portal.mundoId)} • {portal.desafios.length}{" "}
                          {portal.desafios.length === 1 ? "desafio" : "desafios"}
                        </small>
                      </span>
                      <i className={`hn ${aberto ? "hn-chevron-up" : "hn-chevron-down"}`} aria-hidden="true" />
                    </button>

                    {aberto && (
                      <div className="admin-portal-corpo" id={idLista}>
                        {portal.dificuldades.map(({ dificuldade, desafios: lista }) => (
                          <div key={dificuldade}>
                            <h3 className="admin-portal-dificuldade">{nomeDificuldade(dificuldade)}</h3>
                            <div className="admin-desafios-lista">
                              {lista.map((desafio) => (
                                <button
                                  key={desafio.id}
                                  type="button"
                                  className="admin-desafios-item"
                                  onClick={() => navigate(`/admin/desafios/${desafio.id}`)}
                                >
                                  <div className="admin-desafios-item-topo">
                                    <span className="admin-desafios-item-trilha">Desafio {desafio.numero}</span>
                                    <span className="admin-desafios-tipo">
                                      <i
                                        className={`hn ${TIPOS[desafio.tipo]?.icone ?? "hn-question"}`}
                                        aria-hidden="true"
                                      />
                                      {rotuloTipo(desafio.tipo)}
                                      {desafio.tiposEtapas && ` (${desafio.tiposEtapas.length})`}
                                    </span>
                                  </div>
                                  <strong className="admin-desafios-item-titulo">{desafio.titulo}</strong>
                                  <span className="admin-desafios-item-recompensa">
                                    {desafio.itemRecompensa
                                      ? `Item: ${desafio.itemRecompensa.nome}`
                                      : "Sem item — só XP"}
                                    <span className="admin-desafios-item-seta" aria-hidden="true">
                                      Editar ›
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default AdminDesafios;
