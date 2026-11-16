// Rolagem lateral da linha curva de projetos (só existe no layout horizontal). É melhoria progressiva: sem JavaScript a
// tela aparece inteira, todos os links funcionam e, se a área for mais larga que a tela, ela rola pelo mouse, pelo toque e
// pelo Tab nos links (o navegador leva o link focado para a vista). Com JavaScript:
//   · a área já abre mostrando o fim (o projeto mais recente), e não o começo;
//   · quando ela de fato rola, vira uma região focável (tabindex) com nome, e as setas do teclado a movem.
//
// Contrato com o HTML (src/components/projetos/CurvaProjetos.astro):
//   [data-curva]          raiz
//   [data-curva-rolagem]  a área que rola (overflow-x: auto)

export {}; // módulo (e não script global): os nomes deste arquivo não colidem com os dos outros scripts

const ROTULO = 'Linha do tempo dos projetos. Role para o lado com as setas do teclado';

function preparar(raiz: HTMLElement) {
  const area = raiz.querySelector<HTMLElement>('[data-curva-rolagem]');
  if (!area || area.dataset.pronta) return;
  area.dataset.pronta = '1';

  let posicionada = false;
  const medir = () => {
    if (!area.clientWidth) return; // layout horizontal escondido (celular e tablet): nada a medir
    const rola = area.scrollWidth > area.clientWidth + 1;
    if (rola) {
      area.tabIndex = 0;
      area.setAttribute('role', 'region');
      area.setAttribute('aria-label', ROTULO);
      if (!posicionada) area.scrollLeft = area.scrollWidth; // começa no fim, onde está o mais recente
    } else {
      area.removeAttribute('tabindex');
      area.removeAttribute('role');
      area.removeAttribute('aria-label');
    }
    posicionada = true;
  };

  new ResizeObserver(medir).observe(area);
  medir();
}

// Com a navegação sem recarregar (ClientRouter) este módulo roda uma vez; quem se repete é o evento.
document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLElement>('[data-curva]').forEach(preparar);
});
