# Deploy no Vercel (frontend + backend)

O projeto vai pro Vercel como **dois projetos** ligados ao mesmo repositório do GitHub:
um com a pasta `frontend` e outro com a pasta `backend`.

## 1. Backend (crie primeiro, pra ter a URL)

1. vercel.com > **Add New > Project** > importe `Code-Journey-TCC`.
2. **Root Directory:** `backend`.
3. **Framework Preset:** `Other` (importante — não deixe "Express").
4. Em **Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | connection string do Neon, de preferência a **pooled** (host com `-pooler`) |
| `JWT_SECRET` | uma chave **nova** e longa (não use a de desenvolvimento) |
| `FRONTEND_URL` | URL do frontend no Vercel, ex: `https://code-journey.vercel.app` (preencha depois de criar o frontend; várias URLs separadas por vírgula) |
| `EMAIL_USER`, `EMAIL_PASS` | conta e senha de app do e-mail que envia os códigos |
| `IA_PROVEDOR` | `gemini` (ou `claude`) |
| `GEMINI_API_KEY` | chave do Google AI Studio (ou `ANTHROPIC_API_KEY` se for `claude`) |

5. **Deploy.** Teste abrindo `https://SEU-BACKEND.vercel.app/api/` — qualquer resposta JSON/404 do Express
   (e não uma página de erro do Vercel) indica que a função subiu.

## 2. Frontend

1. **Add New > Project** > o mesmo repositório.
2. **Root Directory:** `frontend`. **Framework Preset:** `Vite` (detectado sozinho).
3. Variável de ambiente:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `https://SEU-BACKEND.vercel.app/api` |

4. **Deploy.**
5. Volte no projeto do **backend**, preencha `FRONTEND_URL` com a URL final do frontend e faça um **Redeploy**
   (variáveis só valem em deploys novos). O mesmo vale pro frontend: mudou `VITE_API_URL`, precisa de novo deploy.

## Branch de produção

O Vercel publica a branch `main` como produção. O time trabalha na `dev`: ou faça o merge `dev` -> `main`,
ou troque em **Settings > Git > Production Branch**. Branches/PRs geram URLs de pré-visualização; elas **não**
estão em `FRONTEND_URL`, então a API recusa (CORS) chamadas vindas delas — adicione a URL na variável se
quiser testar por lá.

## Banco de dados

- O Neon atual é o mesmo de desenvolvimento: o site online usa os mesmos jogadores e dados. Para separar,
  crie outro banco no Neon, aponte `DATABASE_URL` pra ele e rode as migrations e o seed uma vez, do seu
  computador, com a `DATABASE_URL` do novo banco:
  `npx prisma migrate deploy` e `npx prisma db seed` (dentro de `backend/`).
- As migrations **não rodam sozinhas** no deploy; mudou o schema, rode `npx prisma migrate deploy` apontando
  pro banco de produção.

## O que foi adaptado no código pra funcionar no Vercel

- `frontend/src/services/api.js`: o endereço da API vem de `VITE_API_URL` (antes era fixo em `localhost`).
- `frontend/vercel.json`: toda rota cai no `index.html` (senão recarregar `/home` daria 404) e os arquivos de
  `/assets` ficam em cache.
- `backend/api/index.js` + `backend/vercel.json`: entrada da função serverless (o app do Express, sem `listen`).
- `backend/src/server.js`: só abre a porta quando executado direto (`node src/server.js`); também exporta o app.
- `backend/src/app.js`: `trust proxy` (o limite de tentativas por IP precisa do IP real, não do proxy) e o
  `FRONTEND_URL` ignora barra no final.
- `backend/prisma/schema.prisma`: `binaryTargets` com `rhel-openssl-3.0.x` (Linux do Vercel) e
  `postinstall: prisma generate` no `package.json`.
- Corrigido o import `./pages/Editarpersonagem/...` em `App.jsx` (a maiúscula errada funciona no Windows, mas
  quebra o build em Linux).

## Limitações conhecidas

- Funções serverless "esfriam": a primeira chamada depois de um tempo parado é mais lenta.
- A correção por IA pode demorar; o limite de tempo da função está em 60 s (`backend/vercel.json`), e o limite
  efetivo depende do plano do Vercel.
