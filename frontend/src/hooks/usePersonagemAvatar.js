import { useEffect, useState } from "react";
import api from "../services/api";
import guerreiroSimples from "../assets/images/Guerreiro_simples.png";
import guerreiroPeitoral from "../assets/images/Guerreiro_Peitoral.png";
import guerreiroChapeu from "../assets/images/Guerreiro_Chapeu.png";
import guerreiroPeitoralChapeu from "../assets/images/Guerreiro_Peitoral_Chapeu.png";

// Escolhe o sprite do guerreiro a partir dos itens equipados (itens no
// formato devolvido por GET /personagem: [{ equipado, item: { tipo, nome } }]).
//
// Cada combinação de equipamento visual tem um sprite fixo próprio (não são
// camadas compostas em runtime): nenhum item, só peitoral, só chapéu, ou os
// dois juntos. Quando existirem mais itens de equipamento visual, isso vira
// camadas por slot em vez de sprites fixos por combinação.
export function resolverAvatarPersonagem(itens = []) {
  const equipados = itens.filter((itemPersonagem) => itemPersonagem.equipado);
  const peitoralEquipado = equipados.some((ip) => ip.item?.tipo === "peitoral");
  const chapeuGoblinEquipado = equipados.some(
    (ip) => ip.item?.tipo === "capacete" && ip.item?.nome === "Chapéu Goblin"
  );

  if (peitoralEquipado && chapeuGoblinEquipado) return guerreiroPeitoralChapeu;
  if (peitoralEquipado) return guerreiroPeitoral;
  if (chapeuGoblinEquipado) return guerreiroChapeu;
  return guerreiroSimples;
}

// Usado em toda tela que mostra o guerreiro (Perfil, Desafios, Ranking,
// ResolverDesafio) — centraliza a busca do personagem num só lugar.
// EditarPersonagem já carrega o personagem sozinho (pra montar os slots de
// equipamento), então ali é só chamar resolverAvatarPersonagem(itens)
// direto, sem duplicar a busca.
export function usePersonagemAvatar() {
  const [avatar, setAvatar] = useState(guerreiroSimples);

  useEffect(() => {
    let ativo = true;

    api
      .get("/personagem")
      .then((res) => {
        if (ativo) setAvatar(resolverAvatarPersonagem(res.data.itens));
      })
      .catch(() => {
        // sem personagem carregado (ex: offline, sem login) — mantém o
        // sprite padrão em vez de travar a tela
      });

    return () => {
      ativo = false;
    };
  }, []);

  return avatar;
}
