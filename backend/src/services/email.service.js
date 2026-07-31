require("dotenv").config();
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "ok" : "VAZIO");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "ok" : "VAZIO");
const nodemailer = require("nodemailer");

// Mesmos nomes de variável que funcionaram no seu teste.
const EMAIL_USER = process.env.EMAIL_USER || process.env.GMAIL_USER;
const EMAIL_PASS = (
  process.env.EMAIL_PASS ||
  process.env.GMAIL_APP_PASSWORD ||
  ""
).replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// Assinatura compatível com o auth.service: (email, nome, codigo).
// Tem `await` interno — se o envio falhar, o erro é LANÇADO (sem falso positivo).
async function enviarEmailRecuperacao(email, nome, codigo) {
  await transporter.sendMail({
    from: `Code Journey <${EMAIL_USER}>`,
    to: email,
    subject: "Código de recuperação de senha — Code Journey",
    text:
      `Olá, ${nome}!\n\n` +
      `Seu código de recuperação é: ${codigo}\n\n` +
      `Ele expira em 15 minutos. Se você não pediu a recuperação, ignore este e-mail.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #6a3fd9;">Recuperação de senha</h2>
        <p>Olá, <strong>${nome}</strong>! Use o código abaixo para redefinir sua senha no <strong>Code Journey</strong>:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;
                  color: #22283a; background: #f2effa; padding: 14px 0;
                  text-align: center; border-radius: 10px;">
          ${codigo}
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          O código expira em 15 minutos. Se você não pediu isso, ignore este e-mail.
        </p>
      </div>
    `,
  });
}

module.exports = { transporter, enviarEmailRecuperacao };