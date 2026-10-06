import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import "./AdminDesafios.css";

function AdminDesafios() {
  const navigate = useNavigate();
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

  return (
    <MainLayout titulo="Desafios">
      <div className="admin-desafios">
        <BotaoPixel
          className="admin-desafios-voltar"
          classeMiolo="admin-desafios-voltar-miolo"
          onClick={() => navigate("/admin")}
        >
          ← Painel
        </BotaoPixel>

        {carregando ? (
          <p className="admin-desafios-mensagem">Carregando…</p>
        ) : erro ? (
          <p className="admin-desafios-mensagem admin-desafios-mensagem--erro">{erro}</p>
        ) : desafios.length === 0 ? (
          <p className="admin-desafios-mensagem">Nenhum desafio cadastrado ainda.</p>
        ) : (
          <div className="admin-desafios-lista">
            {desafios.map((desafio) => (
              <button
                key={desafio.id}
                type="button"
                className="admin-desafios-item"
                onClick={() => navigate(`/admin/desafios/${desafio.id}`)}
              >
                <div className="admin-desafios-item-topo">
                  <span className="admin-desafios-item-trilha">
                    Mundo {desafio.mundoId} • {desafio.dificuldade} • Desafio {desafio.numero}
                  </span>
                  <span className="admin-desafios-item-seta">›</span>
                </div>
                <strong className="admin-desafios-item-titulo">{desafio.titulo}</strong>
                <span className="admin-desafios-item-recompensa">
                  {desafio.itemRecompensa
                    ? `Item: ${desafio.itemRecompensa.icone ? `${desafio.itemRecompensa.icone} ` : ""}${desafio.itemRecompensa.nome}`
                    : "Sem item — só XP"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default AdminDesafios;
