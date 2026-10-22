import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import { temToken, verificarAdmin, verificarSessao } from "../services/sessao";
import { desafioConcluido, desafioLiberado, mundoLiberado } from "../data/progresso";
import { temTelaPropria } from "../data/telasDesafio";
import { prefetchTelas } from "../telas";
import { precarregarSons } from "../utils/sons";

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

  // Sessão confirmada: baixa em segundo plano as telas mais usadas, pra a
  // próxima navegação já encontrar tudo pronto.
  useEffect(() => {
    if (permitido) {
      prefetchTelas();
      precarregarSons();
    }
  }, [permitido]);

  if (!temToken()) return <Navigate to="/" replace state={{ de: location.pathname }} />;
  // Enquanto o backend ainda não respondeu (permitido === null) a tela já
  // aparece: antes o app ficava EM BRANCO esperando a API. Quem protege os
  // dados é o backend (cada requisição revalida o token), e um token
  // recusado cai no 401 que desloga e volta pro Login logo em seguida.
  if (permitido === false) return <Navigate to="/" replace />;
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

// Telas com conteúdo fixo no frontend (ver data/telasDesafio.js): só abrem
// os desafios que elas conhecem. Qualquer outro (link antigo, URL digitada,
// desafio novo cadastrado pelo admin) vai pra tela genérica /etapas, que
// busca conteúdo e correção na API — antes caía no conteúdo do desafio 1.
export function TelaPropria({ tela, children }) {
  const { mundoId, dificuldade, desafioId } = useParams();
  if (!temTelaPropria(tela, mundoId, desafioId)) {
    return <Navigate to={`/etapas/${mundoId}/${dificuldade}/${desafioId}`} replace />;
  }
  return children;
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

  // Mesmo raciocínio de RotaProtegida: a tela abre na hora e, se o progresso
  // (que costuma já estar em cache) disser que está trancada, volta pra
  // anterior. O servidor revalida cada resposta de qualquer forma.
  if (permitido === false) {
    const destino = exigir === "mundo" ? "/home" : `/desafios/${mundoId}/${dificuldade}`;
    return <Navigate to={destino} replace />;
  }
  return children;
}
