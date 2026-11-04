import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { buscarDuvida, relacionadasDe } from "../../utils/buscarDuvida";
import RespostaMago from "./RespostaMago";

// Barra de pesquisa da Home (no cabeçalho, no desktop; no topo do mapa, no
// celular — ver Home.jsx). Dois modos:
// - "usuarios" (padrão): busca jogadores pelo nome enquanto digita
//   (GET /api/perfil/buscar?nome=, com espera de 350 ms) — o mesmo
//   comportamento de sempre, que antes ficava direto em Home.jsx;
// - "duvidas": pergunta ao Mago, ao enviar (Enter ou botão). Procura no
//   grimório local (data/baseDuvidas.js, via utils/buscarDuvida.js) — sem IA.
//   Não achou: links de busca para a MDN e o Stack Overflow em português.
// Estilos: home-busca-* (Home.css) e busca-* (BarraPesquisa.css).

const MODOS = [
  { id: "usuarios", rotulo: "Usuários", placeholder: "Buscar jogador...", ajuda: "Buscar jogador pelo nome" },
  {
    id: "duvidas",
    rotulo: "Dúvidas",
    placeholder: "Pergunte ao mago... (ex: como usar console.log)",
    ajuda: "Perguntar uma dúvida de JavaScript ao mago",
  },
];

function BarraPesquisa() {
  const navigate = useNavigate();
  const [modo, setModo] = useState("usuarios");
  const [termo, setTermo] = useState("");
  const campoRef = useRef(null);

  // ---- modo "usuarios" ----
  const [resultadosUsuarios, setResultadosUsuarios] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // ---- modo "duvidas" ----
  // null | { tipo: "resposta", entrada, relacionadas } | { tipo: "naoEncontrado", termo }
  const [resposta, setResposta] = useState(null);

  // Busca jogadores pelo nome com um pequeno debounce, pra não disparar uma
  // requisição a cada tecla digitada. Só no modo "usuarios".
  useEffect(() => {
    const busca = termo.trim();
    if (modo !== "usuarios" || !busca) {
      setResultadosUsuarios([]);
      setBuscando(false);
      return;
    }

    let ativo = true;
    setBuscando(true);

    const timer = setTimeout(() => {
      api
        .get("/perfil/buscar", { params: { nome: busca } })
        .then((res) => ativo && setResultadosUsuarios(res.data))
        .catch(() => ativo && setResultadosUsuarios([]))
        .finally(() => ativo && setBuscando(false));
    }, 350);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [termo, modo]);

  function abrirPerfilBuscado(usuario) {
    setTermo("");
    setResultadosUsuarios([]);
    navigate(`/perfil/${usuario.id}`);
  }

  function trocarModo(novoModo) {
    if (novoModo === modo) return;
    setModo(novoModo);
    setTermo("");
    setResposta(null);
    campoRef.current?.focus();
  }

  function limpar() {
    setTermo("");
    setResposta(null);
    campoRef.current?.focus();
  }

  function perguntar(e) {
    e.preventDefault();
    if (modo !== "duvidas") return; // jogadores: a busca já roda ao digitar
    const pergunta = termo.trim();
    if (!pergunta) return;

    const { melhor, relacionadas } = buscarDuvida(pergunta);
    if (melhor) {
      setResposta({ tipo: "resposta", entrada: melhor, relacionadas });
    } else {
      // TODO: registrar no backend as dúvidas sem resposta (servirá para melhorar a base e como dado para o TCC)
      setResposta({ tipo: "naoEncontrado", termo: pergunta });
    }
  }

  // "Você também pode querer saber": abre aquela resposta direto
  function abrirRelacionada(entrada) {
    setResposta({ tipo: "resposta", entrada, relacionadas: relacionadasDe(entrada) });
  }

  function fecharResposta() {
    setResposta(null);
    campoRef.current?.focus();
  }

  // Esc fecha a resposta do mago
  useEffect(() => {
    if (!resposta) return;
    const aoTeclar = (e) => {
      if (e.key !== "Escape") return;
      setResposta(null);
      campoRef.current?.focus();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [resposta]);

  const modoAtual = MODOS.find((m) => m.id === modo);

  return (
    <div className={`home-busca busca-barra busca-barra--${modo}`}>
      <form className="home-busca-campo busca-campo" onSubmit={perguntar} role="search">
        <div className="busca-modos" role="radiogroup" aria-label="O que você quer pesquisar?">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={modo === m.id}
              className={`busca-modo ${modo === m.id ? "busca-modo--ativo" : ""}`}
              onClick={() => trocarModo(m.id)}
            >
              {m.rotulo}
            </button>
          ))}
        </div>

        <input
          ref={campoRef}
          type="text"
          className="home-busca-input"
          placeholder={modoAtual.placeholder}
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          aria-label={modoAtual.ajuda}
          enterKeyHint={modo === "duvidas" ? "search" : undefined}
          maxLength={200}
        />

        {termo && (
          <button type="button" className="home-busca-limpar" aria-label="Limpar busca" onClick={limpar}>
            <i className="hn hn-times" aria-hidden="true"></i>
          </button>
        )}

        {modo === "duvidas" && (
          <button type="submit" className="busca-perguntar" aria-label="Perguntar ao mago" disabled={!termo.trim()}>
            <i className="hn hn-search" aria-hidden="true"></i>
          </button>
        )}
      </form>

      {modo === "usuarios" && termo.trim() && (
        <div className="home-busca-resultados">
          {buscando ? (
            <p className="home-busca-mensagem">Buscando…</p>
          ) : resultadosUsuarios.length > 0 ? (
            resultadosUsuarios.map((usuario) => (
              <button
                key={usuario.id}
                type="button"
                className="home-busca-resultado"
                onClick={() => abrirPerfilBuscado(usuario)}
              >
                <span className="home-busca-resultado-nome">{usuario.nome}</span>
                <span className="home-busca-resultado-handle">@{usuario.nomeUsuario}</span>
              </button>
            ))
          ) : (
            <p className="home-busca-mensagem">Nenhum jogador encontrado.</p>
          )}
        </div>
      )}

      {modo === "duvidas" && resposta && (
        <RespostaMago resposta={resposta} onFechar={fecharResposta} onAbrirRelacionada={abrirRelacionada} />
      )}
    </div>
  );
}

export default BarraPesquisa;
