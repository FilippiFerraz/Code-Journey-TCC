// scripts/exportarIntro.mjs
//
// Grava a cutscene de introdução em vídeo: intro.mp4, 1920x1080, 30fps, 15s,
// com o áudio chiptune. Pra usar em apresentações.
//
// Como funciona:
// 1. sobe um servidor Vite próprio (porta livre) e abre intro-preview.html?export=1
//    num Chrome/Edge sem janela (puppeteer-core — usa o navegador já instalado);
// 2. pra cada um dos 450 quadros, pede à página o desenho do instante exato
//    (quadro * 1000/30 ms) — a timeline só depende do tempo, então o vídeo
//    sai perfeito mesmo que o computador seja lento;
// 3. renderiza o áudio offline (OfflineAudioContext) e baixa como WAV;
// 4. o ffmpeg (ffmpeg-static) amplia cada quadro 320x180 -> 1920x1080 (6x,
//    "vizinho mais próximo": pixels continuam quadrados) e junta o áudio.
//
// Uso:
//   npm run intro:video                    -> gera frontend/intro.mp4
//   npm run intro:video -- caminho/saida.mp4
// Navegador em outro lugar? defina CHROME_PATH com o caminho do executável.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";
import puppeteer from "puppeteer-core";
import { createServer } from "vite";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = resolve(process.argv[2] ?? join(RAIZ, "intro.mp4"));
const FPS = 30;

function acharNavegador() {
  const candidatos = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const achado = candidatos.find((c) => existsSync(c));
  if (!achado) throw new Error("Chrome/Edge não encontrado. Defina CHROME_PATH com o caminho do navegador.");
  return achado;
}

async function main() {
  const temp = await mkdtemp(join(tmpdir(), "intro-"));
  const servidor = await createServer({
    root: RAIZ,
    logLevel: "error",
    server: { port: 5199, strictPort: false },
  });
  await servidor.listen();
  const endereco = servidor.resolvedUrls.local[0];
  const navegador = await puppeteer.launch({
    executablePath: acharNavegador(),
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });

  try {
    const pagina = await navegador.newPage();
    pagina.on("pageerror", (erro) => console.error("Erro na página:", erro.message));
    await pagina.goto(`${endereco}intro-preview.html?export=1`, { waitUntil: "networkidle0" });
    await pagina.waitForFunction(() => window.__intro);
    await pagina.evaluate(() => window.__intro.pronto);
    const duracaoMs = await pagina.evaluate(() => window.__intro.duracaoMs);

    console.log("Renderizando áudio...");
    const wav = join(temp, "intro.wav");
    await writeFile(wav, Buffer.from(await pagina.evaluate(() => window.__intro.audioWav()), "base64"));

    const totalQuadros = Math.round((duracaoMs / 1000) * FPS);
    console.log(`Gravando ${totalQuadros} quadros (${duracaoMs / 1000}s a ${FPS}fps)...`);
    const ff = spawn(ffmpeg, [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
      "-i", wav,
      "-vf", "scale=1920:1080:flags=neighbor",
      "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k",
      "-t", String(duracaoMs / 1000),
      "-movflags", "+faststart",
      SAIDA,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const terminou = new Promise((ok, falha) => {
      ff.on("error", falha);
      ff.on("close", (codigo) => (codigo === 0 ? ok() : falha(new Error(`ffmpeg saiu com código ${codigo}`))));
    });

    for (let i = 0; i < totalQuadros; i++) {
      const png = await pagina.evaluate((t) => window.__intro.quadro(t), (i * 1000) / FPS);
      if (!ff.stdin.write(Buffer.from(png, "base64"))) {
        await new Promise((ok) => ff.stdin.once("drain", ok));
      }
      if (i % 30 === 0) process.stdout.write(`\r  ${Math.round((i / totalQuadros) * 100)}%`);
    }
    ff.stdin.end();
    await terminou;
    console.log(`\r  100%\nPronto: ${SAIDA}`);
  } finally {
    await navegador.close();
    await servidor.close();
    await rm(temp, { recursive: true, force: true });
  }
}

main().catch((erro) => {
  console.error("Erro ao exportar a intro:", erro);
  process.exit(1);
});
