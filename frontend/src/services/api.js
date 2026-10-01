import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3333/api",
});

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
      if (window.location.pathname !== "/") window.location.replace("/");
    }
    return Promise.reject(erro);
  }
);

export default api;
