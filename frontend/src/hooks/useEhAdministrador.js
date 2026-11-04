import { useEffect, useState } from "react";
import api from "../services/api";

// Só decide se mostra o ícone de administração na navegação (ver
// MainLayout.jsx) — não é a proteção de verdade. Toda rota de admin já é
// revalidada no backend a cada requisição (ver middlewares/admin.middleware.js,
// que consulta o "role" no banco, nunca confia em nada vindo do cliente),
// então não tem problema esse hook começar como "não admin" enquanto carrega,
// ou ficar defasado se o papel mudar no banco durante a sessão.
export function useEhAdministrador() {
  const [ehAdministrador, setEhAdministrador] = useState(false);

  useEffect(() => {
    let ativo = true;

    api
      .get("/perfil")
      .then((res) => {
        if (ativo) setEhAdministrador(res.data.role === "administrador");
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, []);

  return ehAdministrador;
}
