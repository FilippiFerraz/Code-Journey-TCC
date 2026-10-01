import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import { temToken, verificarAdmin, verificarSessao } from "../services/sessao";
import { desafioConcluido, desafioLiberado, mundoLiberado } from "../data/progresso";

// Guardas de rota do App.jsx. Elas só decidem qual TELA aparece — quem
// protege os dados de verdade é o backend (auth.middleware.js,
// admin.middleware.js e as regras de desbloqueio em progresso.service.js),
// que revalida tudo a cada requisição. Sem elas, qualquer tela abria só
// digitando a URL (ex: localhost/home sem estar logado).

// Roda uma checagem assíncrona e devolve null enquanto carrega, depois
// true/false. "chave" refaz a checagem quando muda (ex: trocou de desafio).
function useChecagem(checar, chave) {
  const [resultado, setResultado] = useState({ chave: null, permitido: null });

  useEffect(() => {
    let ativo = true;
    Promise.resolve(checar()).then((permitido) => {
      if (ativo) setResultado({ chave, permitido });
    });
    return () => {
      ativo = false;
    };
  }, [chave]);

  return resultado.chave === chave ? resultado.permitido : null;
}

// Só para quem está logado (token aceito pelo backend). Senão vai pro Login.
export function RotaProtegida() {
  const location = useLocation();
  const permitido = useChecagem(verificarSessao, "sessao");

  if (!temToken()) return <Navigate to="/" replace state={{ de: location.pathname }} />;
  if (permitido === null) return null;
  if (!permitido) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Só para administradores — confere em GET /api/admin/status. Sem acesso,
// volta pra Home (o usuário está logado, só não é admin).
export function RotaAdmin() {
  const permitido = useChecagem(verificarAdmin, "admin");

  if (permitido === null) {
    return (
      <MainLayout titulo="Administração">
        <div className="admin-estado">Verificando acesso…</div>
      </MainLayout>
    );
  }
  if (!permitido) return <Navigate to="/home" replace />;
  return <Outlet />;
}

// Login e Cadastro: quem já está logado vai direto pra Home em vez de ver o
// formulário de novo.
export function RotaPublica() {
  if (temToken()) return <Navigate to="/home" replace />;
  return <Outlet />;
}

// Telas de jogo que dependem do progresso (GET /api/progresso), com as
// mesmas regras de data/progresso.js usadas pra trancar portais e cards:
// - "mundo": o mundo da URL precisa estar liberado
// - "desafio": mundo liberado + desafio anterior concluído
// - "concluido": o próprio desafio já concluído (tela de recompensa)
// Trancado = volta pra tela anterior da trilha.
export function RotaDesafio({ exigir, children }) {
  const { mundoId, dificuldade, desafioId } = useParams();
  const chave = `${exigir}:${mundoId}:${dificuldade}:${desafioId}`;

  const permitido = useChecagem(async () => {
    try {
      const { data: progresso } = await api.get("/progresso");
      if (!mundoLiberado(progresso, mundoId)) return false;
      if (exigir === "desafio") return desafioLiberado(progresso, mundoId, dificuldade, desafioId);
      if (exigir === "concluido") return desafioConcluido(progresso, mundoId, dificuldade, desafioId);
      return true;
    } catch {
      // Servidor fora do ar: deixa a tela abrir — o envio da resposta é
      // revalidado no backend de qualquer forma.
      return true;
    }
  }, chave);

  if (permitido === null) return null;
  if (!permitido) {
    const destino = exigir === "mundo" ? "/home" : `/desafios/${mundoId}/${dificuldade}`;
    return <Navigate to={destino} replace />;
  }
  return children;
}
