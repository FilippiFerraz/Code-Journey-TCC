import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import api from "../../services/api";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import "./Ranking.css";

function classePorPosicao(posicao) {
  if (posicao === 1) return "ranking-linha--ouro";
  if (posicao === 2) return "ranking-linha--prata";
  if (posicao === 3) return "ranking-linha--bronze";
  return "";
}

// Ícone da placa de cada posição — sem retrato próprio por jogador (a API
// só devolve nome/xp de quem não é o usuário logado), então o 1º lugar
// ganha uma coroa e os demais um brasão genérico, no espírito medieval.
function iconePorPosicao(posicao) {
  return posicao === 1 ? "👑" : "🛡️";
}

function Ranking() {
  const [ranking, setRanking] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const avatar = usePersonagemAvatar();

  useEffect(() => {
    let ativo = true;

    api
      .get("/ranking")
      .then((res) => ativo && setRanking(res.data))
      .catch(() => ativo && setErro("Não foi possível carregar o ranking."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) {
    return (
      <MainLayout titulo="Ranking">
        <div className="ranking-tela">
          <div className="ranking-estado">Carregando ranking…</div>
        </div>
      </MainLayout>
    );
  }

  if (erro) {
    return (
      <MainLayout titulo="Ranking">
        <div className="ranking-tela">
          <div className="ranking-estado ranking-estado--erro">{erro}</div>
        </div>
      </MainLayout>
    );
  }

  const { eu, top } = ranking;

  return (
    <MainLayout titulo="Ranking">
      <div className="ranking-tela">
        {/* Placa-título de madeira, com a coroa pendurada embaixo */}
        <div className="ranking-titulo-placa">
          <h2 className="ranking-titulo">Ranking das Lendas</h2>
          <span className="ranking-titulo-coroa" aria-hidden="true">
            👑
          </span>
        </div>

        {/* Resumo do jogador logado — sempre visível, esteja ele no top ou não */}
        <div className="ranking-eu">
          <img src={avatar} alt="" className="ranking-eu-avatar" draggable={false} />
          <span className="ranking-eu-nome">{eu.nome}</span>
          <span className="ranking-eu-posicao">#{eu.posicao.toLocaleString("pt-BR")}</span>
        </div>

        <div className="ranking-lista">
          {top.length === 0 && <p className="ranking-vazio">Ninguém no ranking ainda.</p>}

          {top.map((usuario) => (
            <div
              key={usuario.id}
              className={`ranking-linha ${classePorPosicao(usuario.posicao)} ${
                usuario.id === eu.id ? "ranking-linha--eu" : ""
              }`}
            >
              <span className="ranking-posicao" aria-hidden="true">
                {usuario.posicao}º
              </span>
              <span className="ranking-icone" aria-hidden="true">
                {iconePorPosicao(usuario.posicao)}
              </span>
              <span className="ranking-nome">{usuario.nome}</span>
              <span className="ranking-pontos">
                {usuario.xpTotal.toLocaleString("pt-BR")}
                <span className="ranking-pontos-rotulo">pts</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Ranking;
