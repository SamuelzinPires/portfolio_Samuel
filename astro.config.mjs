import { defineConfig } from 'astro/config';

// `site` é o endereço público: o Open Graph (prévia no LinkedIn/WhatsApp) exige link completo na imagem.
// Quando o domínio próprio chegar (Parte 7), troque aqui.
export default defineConfig({
  site: 'https://portfolio-samuel-8fam.vercel.app',
  // a barrinha de ferramentas do Astro aparece em cima da página no `npm run dev` (e nos prints dos cartões OG)
  devToolbar: { enabled: false },
  // O Vite embute como texto (data:) todo arquivo menor que 4 KB, e um pedaço da fonte caía nessa regra. A política
  // de segurança (vercel.json) só aceita fonte vinda do próprio site, então tudo vira arquivo de verdade.
  vite: { build: { assetsInlineLimit: 0 } },
});
