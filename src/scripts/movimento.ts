// Liga rolagem suave e cursor ao ciclo de vida das páginas (View Transitions do Astro).
// Com a navegação sem recarregar, este módulo roda uma vez só; quem muda a cada página é o evento:
//   astro:page-load   → depois da 1ª carga e de cada navegação: cria Lenis e cursor
//   astro:before-swap → antes de trocar a página: destrói o Lenis (ele guarda classes no <html>)
//   astro:after-swap  → logo depois da troca, antes de pintar: devolve a classe do cursor
import { reaplicarCursor, iniciarCursor } from './cursor';
import { destruirLenis, iniciarLenis } from './lenis';

const quemPediuMenosMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('astro:page-load', () => {
  if (!quemPediuMenosMovimento()) iniciarLenis(); // reduced-motion: rolagem nativa
  iniciarCursor();
});
document.addEventListener('astro:before-swap', destruirLenis);
document.addEventListener('astro:after-swap', reaplicarCursor);
