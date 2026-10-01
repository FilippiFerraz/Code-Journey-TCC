import api from "./api";

// Confirmações já feitas com o backend, por rota e por token — o mesmo token
// não é revalidado a cada troca de tela, mas um login novo (ou um token
// diferente colado no localStorage) é conferido de novo. Não é a proteção
// de verdade (o backend revalida o token em toda requisição), só evita
// mostrar telas internas pra quem não tem acesso.
const confirmacoes = new Map(); // rota -> { token, promessa }

export function temToken() {
  return Boolean(localStorage.getItem("token"));
}

function confirmarComBackend(rota) {
  const token = localStorage.getItem("token");
  if (!token) return Promise.resolve(false);

  const emCache = confirmacoes.get(rota);
  if (emCache?.token === token) return emCache.promessa;

  const promessa = api
    .get(rota)
    .then(() => true)
    .catch((erro) => {
      const status = erro.response?.status;
      if (status === 401 || status === 403) return false;
      // Outro erro (servidor fora do ar): não decide nada nem fica em
      // cache — deixa a tela abrir e mostrar o próprio erro.
      confirmacoes.delete(rota);
      return true;
    });

  confirmacoes.set(rota, { token, promessa });
  return promessa;
}

// Token existe E o backend aceita (GET /perfil).
export function verificarSessao() {
  return confirmarComBackend("/perfil");
}

// Usuário logado é administrador (GET /admin/status, protegido por
// verificarAdmin no backend).
export function verificarAdmin() {
  return confirmarComBackend("/admin/status");
}
