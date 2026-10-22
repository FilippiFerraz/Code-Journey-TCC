require("dotenv").config();
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "ok" : "VAZIO");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "ok" : "VAZIO");
const path = require("path");
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

// ---------- Modelo visual dos e-mails ----------
//
// Os três e-mails com código (cadastro, recuperação de senha, troca de
// e-mail) usam o mesmo modelo com a identidade do Code Journey: cabeçalho
// em degradê roxo → azul com a logo e o nome, cartão branco com o código em
// destaque e rodapé escuro.
//
// - Layout em <table> com estilos inline: é o que Gmail, Outlook e os apps
//   de celular respeitam (eles ignoram <style>, flex, grid...).
// - A logo vai ANEXADA no próprio e-mail (cid:), não por link: imagem
//   externa costuma vir bloqueada até o usuário clicar em "mostrar imagens".
// - O código fica num texto só (não um dígito por célula), pra dar pra
//   copiar e colar inteiro.

const CORES = {
  roxo: "#7a1fa8",
  roxoEscuro: "#4c1d95",
  azul: "#2563eb",
  lilas: "#f3edff",
  noite: "#120c2e",
  texto: "#22283a",
  cinza: "#6b7280",
};

const LOGO = {
  filename: "code-journey.png",
  path: path.join(__dirname, "../assets/logo-email.png"),
  cid: "logo-code-journey",
};

// O nome vem do cadastro — escapado pra nunca virar HTML no e-mail.
function escaparHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// titulo: o que o e-mail é ("Confirme seu e-mail"); mensagem: parágrafo
// explicando o pedido (HTML confiável, escrito aqui); aviso: o que fazer se
// não foi a pessoa; preheader: a prévia que aparece na caixa de entrada.
function montarHtml({ titulo, nome, mensagem, codigo, aviso, preheader }) {
  const nomeSeguro = escaparHtml(nome);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>${titulo} — Code Journey</title>
</head>
<body style="margin:0; padding:0; background-color:${CORES.noite};">
  <!-- prévia na caixa de entrada (escondida no corpo) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CORES.noite}" style="background-color:${CORES.noite}; background-image:linear-gradient(180deg, ${CORES.roxoEscuro} 0%, ${CORES.noite} 60%);">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; border-radius:18px; overflow:hidden; font-family:'Segoe UI', Roboto, Arial, sans-serif;">

          <!-- Cabeçalho: logo + nome, degradê roxo → azul -->
          <tr>
            <td align="center" bgcolor="${CORES.roxo}" style="background-color:${CORES.roxo}; background-image:linear-gradient(135deg, ${CORES.roxo} 0%, ${CORES.azul} 100%); padding:30px 24px 26px;">
              <img src="cid:${LOGO.cid}" width="120" height="120" alt="Code Journey" style="display:block; width:120px; height:120px; border:0; margin:0 auto 14px;">
              <div style="font-size:28px; line-height:32px; font-weight:800; letter-spacing:1px; color:#ffffff;">Code Journey</div>
              <div style="margin-top:6px; font-size:13px; line-height:18px; color:#e0d4ff;">Aprenda programação numa aventura medieval</div>
            </td>
          </tr>

          <!-- Faixa de destaque com o título -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding:28px 28px 8px;">
              <div style="display:inline-block; padding:5px 12px; border-radius:999px; background-color:${CORES.lilas}; color:${CORES.roxo}; font-size:12px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase;">${titulo}</div>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding:12px 28px 4px; color:${CORES.texto}; font-size:16px; line-height:24px;">
              <p style="margin:0 0 12px;">Olá, <strong>${nomeSeguro}</strong>!</p>
              <p style="margin:0 0 20px;">${mensagem}</p>
            </td>
          </tr>

          <!-- Código -->
          <tr>
            <td bgcolor="#ffffff" align="center" style="background-color:#ffffff; padding:0 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="${CORES.lilas}" style="background-color:${CORES.lilas}; border:2px dashed ${CORES.roxo}; border-radius:14px; padding:18px 10px;">
                    <div style="font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${CORES.roxo}; margin-bottom:6px;">Seu código</div>
                    <div style="font-family:'Courier New', Courier, monospace; font-size:38px; line-height:44px; font-weight:800; letter-spacing:10px; color:${CORES.roxoEscuro};">${codigo}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Validade e aviso -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding:18px 28px 28px;">
              <p style="margin:0 0 10px; text-align:center;">
                <span style="display:inline-block; padding:6px 12px; border-radius:999px; background-color:#e7efff; color:${CORES.azul}; font-size:13px; font-weight:700;">&#9203; Válido por 15 minutos</span>
              </p>
              <p style="margin:0; color:${CORES.cinza}; font-size:13px; line-height:20px; text-align:center;">${aviso}</p>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td align="center" bgcolor="${CORES.noite}" style="background-color:${CORES.noite}; padding:18px 24px; border-top:3px solid ${CORES.azul};">
              <div style="font-size:14px; font-weight:800; color:#ffffff; letter-spacing:0.5px;">Code Journey</div>
              <div style="margin-top:4px; font-size:12px; line-height:18px; color:#a5a3c8;">
                Este é um e-mail automático, não precisa responder.<br>
                Nunca compartilhe seu código com ninguém.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Monta e envia. Tem `await` interno — se o envio falhar, o erro é LANÇADO
// (sem falso positivo pro auth.service/conta.service).
async function enviarComCodigo({ email, assunto, texto, ...modelo }) {
  await transporter.sendMail({
    from: `Code Journey <${EMAIL_USER}>`,
    to: email,
    subject: assunto,
    text: texto,
    html: montarHtml(modelo),
    attachments: [LOGO],
  });
}

// Assinatura compatível com o auth.service: (email, nome, codigo).
async function enviarEmailRecuperacao(email, nome, codigo) {
  await enviarComCodigo({
    email,
    assunto: "Código de recuperação de senha — Code Journey",
    texto:
      `Olá, ${nome}!\n\n` +
      `Seu código de recuperação é: ${codigo}\n\n` +
      `Ele expira em 15 minutos. Se você não pediu a recuperação, ignore este e-mail.\n\n— Code Journey`,
    titulo: "Recuperação de senha",
    nome,
    codigo,
    preheader: `Seu código para redefinir a senha é ${codigo}.`,
    mensagem: "Recebemos um pedido para redefinir a senha da sua conta no <strong>Code Journey</strong>. Use o código abaixo para criar uma nova senha e voltar à sua jornada:",
    aviso: "Se você não pediu isso, ignore este e-mail — sua senha continua a mesma.",
  });
}

// Código de confirmação enviado logo após o cadastro — sem ele, o login
// fica bloqueado (ver Usuario.emailVerificado em auth.service.js).
async function enviarEmailVerificacao(email, nome, codigo) {
  await enviarComCodigo({
    email,
    assunto: "Confirme seu e-mail — Code Journey",
    texto:
      `Olá, ${nome}!\n\n` +
      `Seu código de confirmação é: ${codigo}\n\n` +
      `Ele expira em 15 minutos. Se você não criou uma conta no Code Journey, ignore este e-mail.\n\n— Code Journey`,
    titulo: "Confirme seu e-mail",
    nome,
    codigo,
    preheader: `Seu código de confirmação é ${codigo}. Falta pouco para começar sua jornada!`,
    mensagem: "Que bom ter você no <strong>Code Journey</strong>! Falta só um passo para começar a aventura: confirme seu e-mail com o código abaixo.",
    aviso: "Se você não criou essa conta, ignore este e-mail.",
  });
}

// Código enviado pro e-mail NOVO quando o jogador pede pra trocar o e-mail
// da conta (tela Minha Conta) — a troca só acontece depois que ele digitar
// esse código (ver conta.service.js).
async function enviarEmailTrocaEmail(email, nome, codigo) {
  await enviarComCodigo({
    email,
    assunto: "Confirme seu novo e-mail — Code Journey",
    texto:
      `Olá, ${nome}!\n\n` +
      `Você pediu para trocar o e-mail da sua conta no Code Journey para este endereço.\n` +
      `Seu código de confirmação é: ${codigo}\n\n` +
      `Ele expira em 15 minutos. Se não foi você, ignore este e-mail — nada será alterado.\n\n— Code Journey`,
    titulo: "Confirme seu novo e-mail",
    nome,
    codigo,
    preheader: `Seu código para confirmar o novo e-mail é ${codigo}.`,
    mensagem: "Você pediu para trocar o e-mail da sua conta no <strong>Code Journey</strong> para este endereço. Use o código abaixo para confirmar a troca:",
    aviso: "Se não foi você, ignore este e-mail — nada será alterado na sua conta.",
  });
}

module.exports = {
  transporter,
  montarHtml,
  enviarEmailRecuperacao,
  enviarEmailVerificacao,
  enviarEmailTrocaEmail,
};
