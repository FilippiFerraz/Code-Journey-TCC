import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import BotaoPixel from "../../../components/BotaoPixel";
import api from "../../../services/api";
import "./AdminDashboard.css";

// Cada barra é comparação de magnitude (contagem, %, xp) — uma única cor
// carrega o significado, então nenhum desses gráficos usa paleta
// categórica: a altura/comprimento já diz tudo, a cor só marca "isso é uma
// medida". Rótulo direto em cada barra substitui o eixo (poucos itens em
// cada gráfico, então não é "número em todo ponto" — ver dataviz skill).

function StatTile({ rotulo, valor }) {
  return (
    <div className="dash-stat">
      <span className="dash-stat-valor">{valor}</span>
      <span className="dash-stat-rotulo">{rotulo}</span>
    </div>
  );
}

function Meter({ percentual }) {
  return (
    <div className="dash-meter">
      <div className="dash-meter-trilha">
        <div className="dash-meter-preenchimento" style={{ width: `${percentual}%` }} />
      </div>
      <span className="dash-meter-valor">{percentual}%</span>
    </div>
  );
}

function BarraHorizontal({ dados, chaveRotulo, chaveValor, sufixo = "" }) {
  const maximo = Math.max(1, ...dados.map((item) => item[chaveValor]));

  return (
    <div className="dash-barras-h">
      {dados.map((item) => (
        <div className="dash-barra-h-linha" key={item[chaveRotulo]}>
          <span className="dash-barra-h-rotulo">{item[chaveRotulo]}</span>
          <div className="dash-barra-h-trilha">
            <div
              className="dash-barra-h-preenchimento"
              style={{ width: `${(item[chaveValor] / maximo) * 100}%` }}
            />
          </div>
          <span className="dash-barra-h-valor">
            {item[chaveValor]}
            {sufixo}
          </span>
        </div>
      ))}
    </div>
  );
}

function BarrasVerticais({ dados, chaveRotulo, chaveValor }) {
  const maximo = Math.max(1, ...dados.map((item) => item[chaveValor]));

  return (
    <div className="dash-barras-v">
      {dados.map((item) => (
        <div className="dash-barra-v-coluna" key={item[chaveRotulo]}>
          <span className="dash-barra-v-valor">{item[chaveValor]}</span>
          <div className="dash-barra-v-trilha">
            <div
              className="dash-barra-v-preenchimento"
              style={{ height: `${(item[chaveValor] / maximo) * 100}%` }}
            />
          </div>
          <span className="dash-barra-v-rotulo">{item[chaveRotulo]}</span>
        </div>
      ))}
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    api
      .get("/admin/dashboard")
      .then((res) => ativo && setDados(res.data))
      .catch(() => ativo && setErro("Não foi possível carregar as métricas."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  const percentualAtivos =
    dados && dados.resumo.totalUsuarios > 0
      ? Math.round((dados.resumo.totalAtivos / dados.resumo.totalUsuarios) * 100)
      : 0;

  return (
    <MainLayout titulo="Dashboards">
      <div className="admin-dashboard">
        <BotaoPixel
          className="admin-dashboard-voltar"
          classeMiolo="admin-dashboard-voltar-miolo"
          onClick={() => navigate("/admin")}
        >
          ← Painel
        </BotaoPixel>

        {carregando ? (
          <p className="admin-dashboard-mensagem">Carregando…</p>
        ) : erro ? (
          <p className="admin-dashboard-mensagem admin-dashboard-mensagem--erro">{erro}</p>
        ) : (
          <>
            <div className="dash-kpis">
              <StatTile rotulo="Usuários cadastrados" valor={dados.resumo.totalUsuarios} />
              <StatTile rotulo="Administradores" valor={dados.resumo.totalAdmins} />
              <StatTile rotulo="Contas ativas" valor={dados.resumo.totalAtivos} />
              <StatTile rotulo="Contas desativadas" valor={dados.resumo.totalDesativados} />
            </div>

            <section className="admin-dashboard-card">
              <header className="admin-dashboard-card-topo">% de contas ativas</header>
              <div className="admin-dashboard-card-corpo">
                <Meter percentual={percentualAtivos} />
              </div>
            </section>

            <section className="admin-dashboard-card">
              <header className="admin-dashboard-card-topo">Usuários por faixa etária</header>
              <div className="admin-dashboard-card-corpo">
                <BarraHorizontal dados={dados.porIdade} chaveRotulo="faixa" chaveValor="total" />
              </div>
            </section>

            <section className="admin-dashboard-card">
              <header className="admin-dashboard-card-topo">Novos cadastros por mês</header>
              <div className="admin-dashboard-card-corpo">
                <BarrasVerticais dados={dados.porMes} chaveRotulo="mes" chaveValor="total" />
              </div>
            </section>

            <section className="admin-dashboard-card">
              <header className="admin-dashboard-card-topo">Top 5 por XP</header>
              <div className="admin-dashboard-card-corpo">
                {dados.topXp.length === 0 ? (
                  <p className="admin-dashboard-vazio">Ninguém pontuou ainda.</p>
                ) : (
                  <BarraHorizontal
                    dados={dados.topXp}
                    chaveRotulo="nome"
                    chaveValor="xpTotal"
                    sufixo=" xp"
                  />
                )}
              </div>
            </section>

            <section className="admin-dashboard-card">
              <header className="admin-dashboard-card-topo">Taxa de conclusão por desafio</header>
              <div className="admin-dashboard-card-corpo">
                {dados.taxaConclusao.length === 0 ? (
                  <p className="admin-dashboard-vazio">Nenhum desafio cadastrado ainda.</p>
                ) : (
                  <BarraHorizontal
                    dados={dados.taxaConclusao}
                    chaveRotulo="rotulo"
                    chaveValor="percentual"
                    sufixo="%"
                  />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default AdminDashboard;
