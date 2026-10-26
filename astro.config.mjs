import { defineConfig } from 'astro/config';

// `site` é o endereço público: o Open Graph (prévia no LinkedIn/WhatsApp) exige link completo na imagem.
// Quando o domínio próprio chegar (Parte 7), troque aqui.
export default defineConfig({
  site: 'https://portfolio-samuel-8fam.vercel.app',
  // a barrinha de ferramentas do Astro aparece em cima da página no `npm run dev` (e nos prints dos cartões OG)
  devToolbar: { enabled: false },
});
