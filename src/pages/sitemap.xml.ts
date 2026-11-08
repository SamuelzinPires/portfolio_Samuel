// sitemap.xml: a lista de páginas públicas para os buscadores. Lê a collection no build, então um projeto novo
// (.md novo) entra sozinho. Fora: /design e 404 (noindex). Sem dependência nova (@astrojs/sitemap não é preciso
// para um site deste tamanho).
import type { APIRoute } from 'astro';
import { carregarProjetos } from '../lib/projetos';

export const GET: APIRoute = async ({ site }) => {
  const projetos = await carregarProjetos();
  const caminhos = ['/', '/projetos', ...projetos.map((p) => `/projetos/${p.id}`), '/certificacoes', '/contato'];
  const urls = caminhos.map((c) => `  <url><loc>${new URL(c, site).href}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
