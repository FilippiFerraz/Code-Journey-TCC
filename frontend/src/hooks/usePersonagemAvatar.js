import { useEffect, useState } from "react";
import api from "../services/api";

// Itens equipados (formato { tipo, imagemUrl, ... } do Item do backend) a
// partir da lista de GET /personagem: [{ equipado, item }].
export function itensEquipadosDoPersonagem(itens = []) {
  return itens.filter((itemPersonagem) => itemPersonagem.equipado).map((ip) => ip.item);
}

// Itens equipados do personagem do usuário logado, pra desenhar o guerreiro
// em camadas com <AvatarPersonagem itensEquipados={...} />. Usado em toda
// tela que mostra o guerreiro (Desafios, Perfil, Ranking, batalhas).
// EditarPersonagem já carrega o personagem sozinho (pra montar os slots),
// então ali é só chamar itensEquipadosDoPersonagem(itens) direto.
// Último equipamento conhecido: a próxima tela já abre com o guerreiro
// equipado, em vez de aparecer sem item até a API responder.
let ultimosEquipados = [];

export function usePersonagemAvatar() {
  const [itensEquipados, setItensEquipados] = useState(ultimosEquipados);

  useEffect(() => {
    let ativo = true;

    api
      .get("/personagem")
      .then((res) => {
        ultimosEquipados = itensEquipadosDoPersonagem(res.data.itens);
        if (ativo) setItensEquipados(ultimosEquipados);
      })
      .catch(() => {
        // sem personagem carregado (ex: offline) — mostra só a base
      });

    return () => {
      ativo = false;
    };
  }, []);

  return itensEquipados;
}
