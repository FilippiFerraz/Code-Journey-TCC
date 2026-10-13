import axios from "axios";
import { instalarCache, limparCacheApi } from "./cacheApi";

// Endereço da API: em produção (Vercel) vem de VITE_API_URL, definida no painel
// do projeto (ex: https://meu-backend.vercel.app/api). Sem ela, vale o backend
// local de desenvolvimento. O valor é gravado no build — mudou a variável,
// precisa de um novo deploy.
function tirarBarraFinal(endereco) {
  let fim = endereco.length;
  while (fim > 0 && endereco[fim - 1] === "/") fim--;
  return endereco.slice(0, fim);
}

const api = axios.create({
  baseURL: tirarBarraFinal(import.meta.env.VITE_API_URL || "http://localhost:3333/api"),
});

// Leituras repetidas viram uma chamada só e ficam guardadas por poucos segundos
// (ver cacheApi.js); qualquer escrita limpa o cache.
instalarCache(api);

// Anexa o token JWT automaticamente em toda requisição, se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 fora de /auth = token expirado, adulterado ou conta desativada (ver
// auth.middleware.js no backend): descarta o token e volta pro Login. As
// rotas /auth ficam de fora porque lá 401 é "senha errada" e quem trata é a
// própria tela de login.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const ehRotaAuth = erro.config?.url?.startsWith("/auth");
    if (erro.response?.status === 401 && !ehRotaAuth) {
      localStorage.removeItem("token");
      limparCacheApi();
      if (window.location.pathname !== "/") window.location.replace("/");
    }
    return Promise.reject(erro);
  }
);

export default api;
