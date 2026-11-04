import { useRef, useState } from "react";
import api from "../services/api";

// Salva a vitória de um desafio (POST /api/progresso) nas telas com
// conteúdo fixo (ResolverDesafio, ResolverDesafioPocao, DesafioChefe) e
// acompanha se deu certo.
//
// Antes cada tela disparava o POST e ignorava a resposta: se a rede caísse,
// o servidor estivesse fora ou recusasse a resposta, a tela mostrava a
// vitória mesmo assim — e o desafio voltava a aparecer como não vencido
// ("o histórico sumiu"). Agora a tela só libera a recompensa com o
// salvamento confirmado (estado "salvo"); nos outros casos mostra o aviso
// (AvisoSalvamento) com a opção de tentar de novo.
//
// estado: "parado" | "salvando" | "salvo" | "falhou" | "recusado"
// - falhou: rede/servidor/limite — dá pra reenviar a MESMA resposta
// - recusado: o servidor corrigiu e disse que a resposta está errada (o
//   conteúdo do desafio mudou no banco) — só refazendo o desafio
export function useSalvarVitoria({ mundoId, dificuldade, desafioId }) {
  const [estado, setEstado] = useState("parado");
  const [resultado, setResultado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const ultimoCorpo = useRef(null);

  async function salvar(corpo) {
    ultimoCorpo.current = corpo;
    setEstado("salvando");
    setMensagem("");
    try {
      const { data } = await api.post("/progresso", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: Number(desafioId),
        ...corpo,
      });
      if (data.correta === false) {
        setEstado("recusado");
        return;
      }
      setResultado(data);
      setEstado("salvo");
    } catch (erro) {
      setMensagem(erro.response?.data?.erro || "Sem conexão com o servidor.");
      setEstado("falhou");
    }
  }

  function tentarDeNovo() {
    if (ultimoCorpo.current) salvar(ultimoCorpo.current);
  }

  // A resposta que já foi salva ao ser corrigida (dissertativa: a própria
  // correção pela IA é o POST que grava a vitória).
  function marcarSalvo(dados) {
    setResultado(dados);
    setEstado("salvo");
  }

  // Nova tentativa do desafio: esquece o salvamento anterior.
  function reiniciar() {
    ultimoCorpo.current = null;
    setResultado(null);
    setMensagem("");
    setEstado("parado");
  }

  return {
    estado,
    resultado,
    mensagem,
    salvar,
    tentarDeNovo,
    marcarSalvo,
    reiniciar,
    salvo: estado === "salvo",
  };
}
