// Gera os ícones do site (aba do navegador, tela inicial do celular e a
// imagem de prévia ao compartilhar o link) a partir da logo do Code Journey.
// Uso (dentro de frontend/): npm run icones:gerar
//
// Fonte: arte-original/logo.png. Saída: public/ (servido na raiz do site).
// A logo tem uma margem transparente em volta do quadrado arredondado; ela é
// recortada antes de redimensionar, senão o ícone ficaria pequeno e perdido.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = path.join(RAIZ, "arte-original/logo.png");
const PUBLICO = path.join(RAIZ, "public");

// Cor das bordas da logo — usada de fundo onde o sistema não aceita transparência
// (ícone do iOS) pra os cantos arredondados não virarem preto.
const FUNDO_ESCURO = { r: 27, g: 20, b: 92, alpha: 1 };

const recortada = await sharp(FONTE).trim({ threshold: 10 }).toBuffer();
const meta = await sharp(recortada).metadata();
const lado = Math.max(meta.width, meta.height);
// quadrado perfeito, logo centralizada
const quadrada = await sharp(recortada)
  .resize({ width: lado, height: lado, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

async function png(tamanho, arquivo, { fundo } = {}) {
  let img = sharp(quadrada).resize(tamanho, tamanho, { kernel: "lanczos3" });
  if (fundo) img = img.flatten({ background: fundo });
  const dados = await img.png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
  fs.writeFileSync(path.join(PUBLICO, arquivo), dados);
  console.log(arquivo.padEnd(24), tamanho + "x" + tamanho, Math.round(dados.length / 1024) + " KB");
  return dados;
}

await png(32, "favicon-32.png");
await png(192, "icon-192.png");
await png(512, "icon-512.png");
// iOS ("Adicionar à tela inicial"): sem transparência
await png(180, "apple-touch-icon.png", { fundo: FUNDO_ESCURO });

// favicon.ico (alguns navegadores e leitores ainda pedem /favicon.ico direto):
// um .ico pode guardar um PNG inteiro dentro, é só montar o cabeçalho.
const png48 = await sharp(quadrada).resize(48, 48, { kernel: "lanczos3" }).png().toBuffer();
const cabecalho = Buffer.alloc(22);
cabecalho.writeUInt16LE(0, 0); // reservado
cabecalho.writeUInt16LE(1, 2); // tipo: ícone
cabecalho.writeUInt16LE(1, 4); // 1 imagem
cabecalho.writeUInt8(48, 6); // largura
cabecalho.writeUInt8(48, 7); // altura
cabecalho.writeUInt8(0, 8); // sem paleta
cabecalho.writeUInt8(0, 9); // reservado
cabecalho.writeUInt16LE(1, 10); // planos
cabecalho.writeUInt16LE(32, 12); // bits por pixel
cabecalho.writeUInt32LE(png48.length, 14); // tamanho dos dados
cabecalho.writeUInt32LE(22, 18); // onde os dados começam
fs.writeFileSync(path.join(PUBLICO, "favicon.ico"), Buffer.concat([cabecalho, png48]));
console.log("favicon.ico".padEnd(24), "48x48", Math.round((22 + png48.length) / 1024) + " KB");

// Imagem de prévia (WhatsApp, Discord, redes sociais): 1200x630, a logo sobre
// o mesmo degradê da tela de login.
const L = 1200, A = 630, tamLogo = 520;
const fundo = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}">
     <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#2f6fed"/><stop offset="0.45" stop-color="#6a3fd9"/>
       <stop offset="0.8" stop-color="#9b2fc9"/><stop offset="1" stop-color="#b229c4"/>
     </linearGradient></defs>
     <rect width="100%" height="100%" fill="url(#g)"/>
   </svg>`
);
const logoGrande = await sharp(quadrada).resize(tamLogo, tamLogo, { kernel: "lanczos3" }).toBuffer();
const og = await sharp(fundo)
  .composite([{ input: logoGrande, left: Math.round((L - tamLogo) / 2), top: Math.round((A - tamLogo) / 2) }])
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toBuffer();
fs.writeFileSync(path.join(PUBLICO, "og-image.png"), og);
console.log("og-image.png".padEnd(24), L + "x" + A, Math.round(og.length / 1024) + " KB");
