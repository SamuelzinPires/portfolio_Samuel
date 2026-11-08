// robots.txt: libera o site inteiro para os buscadores e aponta o sitemap. Gerado no build a partir do `site`
// do astro.config.mjs, então muda sozinho quando o domínio próprio chegar. (A /design e a 404 não precisam de
// bloqueio aqui: as duas têm `noindex` na própria página.)
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = site ? `\nSitemap: ${new URL('/sitemap.xml', site).href}\n` : '';
  return new Response(`User-agent: *\nAllow: /\n${sitemap}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
