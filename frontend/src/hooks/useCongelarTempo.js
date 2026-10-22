import { useEffect, useState } from "react";
import api from "../services/api";
import { tocarSom } from "../utils/sons";

// Ampulheta Congelada, item da Lojinha do Mago (ver backend
// services/loja.service.js): segura o cronômetro do desafio por alguns
// segundos. O servidor só gasta o item (POST /api/loja/usar) — quem para a
// contagem é a própria tela, ligando o useCronometro com
// `ativo && !congelamento.congelado`.
//
// `ativo` = o cronômetro do desafio está rodando agora. O congelamento só
// desconta enquanto isso for verdade (pausas de animação não gastam os
// segundos congelados) e só pode ser ligado nesse momento.
//
// Devolve { quantidade, congelado, restante, usando, podeUsar, usar } — o
// Temporizador recebe esse objeto inteiro na prop `congelamento`.
export function useCongelarTempo(ativo) {
  const [quantidade, setQuantidade] = useState(0);
  const [restante, setRestante] = useState(0);
  const [usando, setUsando] = useState(false);

  useEffect(() => {
    let vivo = true;
    api
      .get("/loja")
      .then((res) => {
        if (!vivo) return;
        const ampulheta = res.data.itens.find((item) => item.chave === "congelar");
        setQuantidade(ampulheta?.quantidade ?? 0);
      })
      .catch(() => {
        // sem loja (ex: offline) — o botão de congelar só não aparece
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!ativo || restante <= 0) return;
    const id = setTimeout(() => setRestante((atual) => atual - 1), 1000);
    return () => clearTimeout(id);
  }, [ativo, restante]);

  const congelado = restante > 0;
  const podeUsar = ativo && !congelado && !usando && quantidade > 0;

  async function usar() {
    if (!podeUsar) return;
    setUsando(true);
    try {
      const { data } = await api.post("/loja/usar", { chave: "congelar" });
      setQuantidade(data.quantidade);
      setRestante(data.segundosCongelados);
      tocarSom("acerto");
    } catch {
      // recusado (ex: a ampulheta já tinha sido usada em outra aba)
      setQuantidade(0);
    } finally {
      setUsando(false);
    }
  }

  return { quantidade, congelado, restante, usando, podeUsar, usar };
}
