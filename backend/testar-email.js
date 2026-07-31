// ============================================================
// testar-email.js — teste isolado do envio de e-mail (Nodemailer/Gmail)
// Coloque este arquivo na pasta backend/ e rode:
//     node testar-email.js
// Ele NÃO depende do resto do app — serve só para descobrir o erro real.
// ============================================================

require("dotenv").config();
const nodemailer = require("nodemailer");

// Tenta os nomes de variável mais comuns. Ajuste conforme o SEU .env.
const EMAIL_USER =
  process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.EMAIL;
const EMAIL_PASS =
  process.env.EMAIL_PASS ||
  process.env.GMAIL_APP_PASSWORD ||
  process.env.EMAIL_SENHA ||
  process.env.SENHA_APP;

async function main() {
  console.log("==== Teste de envio de e-mail — Code Journey ====\n");
  console.log("Usuário (EMAIL_USER):", EMAIL_USER || "(NENHUM encontrado no .env)");
  console.log(
    "Senha de app presente?",
    EMAIL_PASS ? `sim — ${EMAIL_PASS.replace(/\s+/g, "").length} caracteres` : "NÃO"
  );

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error(
      "\n❌ Faltam variáveis no .env. Confira os NOMES das variáveis " +
        "(ex.: EMAIL_USER e EMAIL_PASS) e rode de novo."
    );
    return;
  }

  // App Password do Gmail tem 16 caracteres (sem espaços).
  const senha = EMAIL_PASS.replace(/\s+/g, "");
  if (senha.length !== 16) {
    console.warn(
      `\n⚠️  A senha tem ${senha.length} caracteres. O App Password do Gmail ` +
        "tem 16. Se você colou a senha NORMAL da conta, a autenticação vai falhar."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: senha },
  });

  // 1) Testa login/conexão ANTES de enviar (isola o problema de credencial)
  console.log("\n[1/2] Verificando login no Gmail...");
  try {
    await transporter.verify();
    console.log("✅ Login no Gmail OK — as credenciais funcionam.");
  } catch (err) {
    console.error("❌ Falha ao autenticar no Gmail. Erro real abaixo:\n");
    console.error(err);
    console.error(
      "\nDicas: 2FA precisa estar ATIVO na conta Google, e a senha tem que ser " +
        "um 'App Password' de 16 caracteres (não a senha normal)."
    );
    return;
  }

  // 2) Envia um e-mail de teste para você mesmo
  console.log("\n[2/2] Enviando e-mail de teste para", EMAIL_USER, "...");
  try {
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to: EMAIL_USER,
      subject: "Teste Code Journey — recuperação de senha",
      text: "Se você recebeu este e-mail, o Nodemailer está funcionando. Código de teste: 123456",
    });
    console.log("✅ E-mail enviado com sucesso!");
    console.log("   messageId:", info.messageId);
    console.log("   accepted :", info.accepted);
    console.log("   rejected :", info.rejected);
    console.log("   response :", info.response);
    console.log("\nConfira a caixa de entrada (e o Spam) de", EMAIL_USER);
  } catch (err) {
    console.error("❌ Erro ao enviar o e-mail. Erro real abaixo:\n");
    console.error(err);
  }
}

main();
