// Gera as imagens de compartilhamento (Open Graph, 1200 × 630) em public/og/<slug>.png.
//
// Como usar (2 terminais):
//   1) npm run dev            deixa ligado: ele serve os cartões em /og/<slug>
//   2) npm run og             tira o print de cada cartão (todos os .md de src/content/projetos + o padrão)
//      npm run og -- <slug>   só um projeto (ou "padrao")
// Depois é só commitar os PNGs. Projeto novo = rodar de novo (sem imagem, a página usa /og/padrao.png).
//
// Sem dependência nova: usa o Chrome já instalado, em modo "headless". Se o seu Chrome estiver em outro
// lugar, aponte com CHROME_PATH=...  A porta do dev server pode mudar com BASE=http://localhost:4322.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const base = process.env.BASE ?? 'http://localhost:4321';
const candidatos = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = candidatos.find((c) => existsSync(c));
if (!chrome) {
  console.error('Chrome não encontrado. Aponte com CHROME_PATH=caminho/do/chrome');
  process.exit(1);
}

const pedidos = process.argv.slice(2);
const slugs = pedidos.length
  ? pedidos
  : [
      'padrao',
      ...readdirSync(join(raiz, 'src', 'content', 'projetos'))
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/\.md$/, '')),
    ];

try {
  const resposta = await fetch(`${base}/og/padrao`);
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
} catch (erro) {
  console.error(`Não consegui abrir ${base}/og/padrao (${erro.message}). Deixe o "npm run dev" ligado em outro terminal.`);
  process.exit(1);
}

const saida = join(raiz, 'public', 'og');
mkdirSync(saida, { recursive: true });
const perfil = mkdtempSync(join(tmpdir(), 'og-chrome-'));

let falhas = 0;
for (const slug of slugs) {
  const arquivo = join(saida, `${slug}.png`);
  const r = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      '--virtual-time-budget=5000', // espera a fonte carregar antes do print
      `--user-data-dir=${perfil}`,
      `--screenshot=${arquivo}`,
      `${base}/og/${slug}`,
    ],
    { stdio: 'ignore', timeout: 60_000 },
  );
  if (r.status !== 0 || !existsSync(arquivo)) {
    console.error(`✗ ${slug}: o Chrome não gerou a imagem`);
    falhas++;
    continue;
  }
  // confere o tamanho no cabeçalho do PNG (bytes 16–23 = largura e altura)
  const png = readFileSync(arquivo);
  const largura = png.readUInt32BE(16);
  const altura = png.readUInt32BE(20);
  const ok = largura === 1200 && altura === 630;
  console.log(`${ok ? '✓' : '!'} public/og/${slug}.png  ${largura}×${altura}${ok ? '' : '  (esperado 1200×630)'}`);
  if (!ok) falhas++;
}

rmSync(perfil, { recursive: true, force: true });
process.exit(falhas ? 1 : 0);
