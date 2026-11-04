import { useEffect, useState, useSyncExternalStore } from "react";
import api from "../services/api";

// Itens equipados (formato { tipo, imagemUrl, ... } do Item do backend) a
// partir da lista de GET /personagem: [{ equipado, item }].
export function itensEquipadosDoPersonagem(itens = []) {
  return itens.filter((itemPersonagem) => itemPersonagem.equipado).map((ip) => ip.item);
}

// ---------- Aparência do herói do usuário logado ----------
//
// Personagem.aparencia (ver EscolherAparencia.jsx). Guardada aqui pra
// qualquer <AvatarPersonagem> sem a prop `aparencia` desenhar o herói do
// jogador logado, e no localStorage (marcada com o fim do token, pra não
// valer pra outra conta) pra ele não aparecer com a aparência padrão por
// um instante ao recarregar a página, até a API responder.
const CHAVE_ARMAZENADA = "aparenciaHeroi";
const ouvintes = new Set();

function marcaDoToken() {
  return (localStorage.getItem("token") || "").slice(-16);
}

function lerArmazenada() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_ARMAZENADA));
    return salvo?.token === marcaDoToken() ? salvo.aparencia : null;
  } catch {
    return null;
  }
}

let aparenciaPropria = lerArmazenada();
let tokenDaAparencia = marcaDoToken();

export function definirAparenciaPropria(aparencia) {
  tokenDaAparencia = marcaDoToken();
  try {
    localStorage.setItem(CHAVE_ARMAZENADA, JSON.stringify({ token: tokenDaAparencia, aparencia }));
  } catch {
    // sem localStorage (modo privado etc.) — fica só em memória
  }
  if (aparencia === aparenciaPropria) return;
  aparenciaPropria = aparencia;
  ouvintes.forEach((avisar) => avisar());
}

function lerAparenciaPropria() {
  // trocou de conta sem recarregar a página: a da conta anterior não vale
  if (tokenDaAparencia !== marcaDoToken()) {
    tokenDaAparencia = marcaDoToken();
    aparenciaPropria = lerArmazenada();
  }
  return aparenciaPropria;
}

// null enquanto não se sabe (o AvatarPersonagem usa a aparência padrão).
export function useAparenciaPropria() {
  return useSyncExternalStore((avisar) => {
    ouvintes.add(avisar);
    return () => ouvintes.delete(avisar);
  }, lerAparenciaPropria);
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
        definirAparenciaPropria(res.data.aparencia ?? null);
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
