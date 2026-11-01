// Filtro por trilha/emissor e "ver todos" da cronologia de certificados. Tudo é opcional: sem JavaScript a
// página mostra todos os certificados (o quadro no desktop, a lista no celular) e nenhum botão aparece.
//
// Contrato com o HTML (src/components/certificados/):
//   [data-cronologia]   raiz; data-limite = quantos certificados cada raia mostra antes de recolher
//   [data-filtros]      barra de filtros (nasce `hidden`; só existe com muitos certificados ou mais de um emissor)
//   [data-filtro][data-valor]  botão de filtro ("trilha" ou "emissor"; "todas"/"todos" limpa)
//   [data-grupo]        uma raia (no quadro) ou uma raia de um ano (na lista): é o que recolhe e abre
//   [data-ver-todos]    botão do grupo (nasce `hidden`)
//   [data-cert]         um certificado (data-trilha, data-emissor; no quadro também data-col)
//   [data-quadro]       o quadro do desktop: as colunas ([data-col]) somem junto com o certificado
// O quadro recalcula as ligações (linha azul e pontilhada) com a mesma função que o servidor usa.

import { ligacoes } from '../lib/cronologia';

interface Filtro {
  trilha: string;
  emissor: string;
}

const numeroDe = (el: HTMLElement) => Number(el.dataset.col);

function preparar(raiz: HTMLElement) {
  if (raiz.dataset.pronta) return;
  raiz.dataset.pronta = '1';

  const limite = Number(raiz.dataset.limite ?? 5);
  const filtro: Filtro = { trilha: 'todas', emissor: 'todos' };
  const abertos = new Set<HTMLElement>(); // grupos onde o "ver todos" foi apertado

  const grupos = [...raiz.querySelectorAll<HTMLElement>('[data-grupo]')];
  const certificados = [...raiz.querySelectorAll<HTMLElement>('[data-cert]')];
  const quadro = raiz.querySelector<HTMLElement>('[data-quadro]');
  const status = raiz.querySelector<HTMLElement>('[data-status]');
  const dica = raiz.querySelector<HTMLElement>('[data-dica]');
  const rolagem = raiz.querySelector<HTMLElement>('[data-rolagem]');

  const passaNoFiltro = (el: HTMLElement) =>
    (filtro.trilha === 'todas' || el.dataset.trilha === filtro.trilha) &&
    (filtro.emissor === 'todos' || el.dataset.emissor === filtro.emissor);

  function aplicar(anunciar = false) {
    // 1) quem aparece: passa no filtro e, se a raia estiver recolhida, é um dos `limite` mais recentes
    const visiveis = new Set<HTMLElement>();
    for (const grupo of grupos) {
      const itens = [...grupo.querySelectorAll<HTMLElement>('[data-cert]')].filter(passaNoFiltro);
      const recolhido = itens.length > limite && !abertos.has(grupo);
      itens.forEach((el, i) => {
        if (!recolhido || i >= itens.length - limite) visiveis.add(el);
      });

      const botao = grupo.querySelector<HTMLButtonElement>('[data-ver-todos]');
      if (botao) {
        botao.hidden = itens.length <= limite;
        botao.setAttribute('aria-expanded', String(!recolhido));
        botao.textContent = recolhido ? `ver todos (${itens.length})` : 'recolher';
      }
    }
    for (const el of certificados) el.hidden = !visiveis.has(el);

    // 2) raia (ou ano) sem nenhum certificado visível some
    for (const grupo of grupos) grupo.hidden = !grupo.querySelector('[data-cert]:not([hidden])');
    raiz.querySelectorAll<HTMLElement>('[data-ano]').forEach((ano) => {
      ano.hidden = !ano.querySelector('[data-grupo]:not([hidden])');
    });

    if (quadro) refazerQuadro(quadro);
    atualizarDica();

    // o leitor de tela só é avisado quando a pessoa mexe nos botões, não na carga da página
    if (anunciar && status) {
      const mostrados = quadro ? quadro.querySelectorAll('[data-cert]:not([hidden])').length : visiveis.size;
      status.textContent = `${mostrados} de ${raiz.dataset.total} certificados`;
    }
  }

  // No quadro, cada certificado é uma coluna: a coluna some com ele e as ligações são refeitas
  function refazerQuadro(q: HTMLElement) {
    const nos = [...q.querySelectorAll<HTMLElement>('[data-cert]:not([hidden])')];
    const colunas = new Set(nos.map(numeroDe));
    q.querySelectorAll<HTMLElement>('[data-col]').forEach((el) => {
      el.hidden = !colunas.has(numeroDe(el));
    });

    const raias = [...q.querySelectorAll<HTMLElement>('.raia')].filter((r) => !r.hidden);
    q.querySelectorAll<HTMLElement>('.raia').forEach((r) => r.classList.remove('raia--primeira'));
    raias[0]?.classList.add('raia--primeira');

    const porRaia = raias.map((r) =>
      [...r.querySelectorAll<HTMLElement>('[data-cert]:not([hidden])')].map(numeroDe),
    );
    raias.forEach((raia, r) => {
      raia.querySelectorAll<HTMLElement>('.celula:not([hidden])').forEach((celula) => {
        const lig = ligacoes(porRaia, r, numeroDe(celula));
        celula.classList.toggle('celula--esq', lig.esq);
        celula.classList.toggle('celula--dir', lig.dir);
        celula.classList.toggle('celula--prumo', lig.prumo);
      });
    });

    // o cabeçalho do mês só aparece quando sobram dois ou mais meses
    const pontos = [...q.querySelectorAll<HTMLElement>('.eixo__ponto:not([hidden])')];
    const varios = new Set(pontos.map((p) => p.dataset.mes)).size > 1;
    pontos.forEach((p, i) => {
      p.classList.toggle('eixo__ponto--mes', varios && (i === 0 || pontos[i - 1].dataset.mes !== p.dataset.mes));
    });
  }

  // Quadro mais largo que a tela: o lado direito esmaece e a dica aparece, até a pessoa rolar até o fim
  function atualizarDica() {
    if (!rolagem) return;
    const rola = rolagem.scrollWidth > rolagem.clientWidth + 1;
    const fim = rolagem.scrollLeft + rolagem.clientWidth >= rolagem.scrollWidth - 1;
    rolagem.dataset.rolavel = rola ? '1' : '0';
    rolagem.dataset.fim = fim ? '1' : '0';
    if (dica) dica.hidden = !rola || fim;
  }

  raiz.querySelectorAll<HTMLElement>('[data-filtros]').forEach((barra) => {
    barra.hidden = false;
    barra.addEventListener('click', (e) => {
      const botao = (e.target as Element).closest<HTMLButtonElement>('[data-filtro]');
      if (!botao) return;
      const campo = botao.dataset.filtro as keyof Filtro;
      filtro[campo] = botao.dataset.valor!;
      botao
        .closest('.filtro')!
        .querySelectorAll<HTMLButtonElement>('[data-filtro]')
        .forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
      aplicar(true);
    });
  });

  raiz.addEventListener('click', (e) => {
    const botao = (e.target as Element).closest<HTMLElement>('[data-ver-todos]');
    const grupo = botao?.closest<HTMLElement>('[data-grupo]');
    if (!botao || !grupo) return;
    if (abertos.has(grupo)) abertos.delete(grupo);
    else abertos.add(grupo);
    aplicar(true);
  });

  if (rolagem) {
    new ResizeObserver(atualizarDica).observe(rolagem);
    rolagem.addEventListener('scroll', atualizarDica, { passive: true });
  }
  aplicar();
}

// Com a navegação sem recarregar (ClientRouter) este módulo roda uma vez; quem se repete é o evento.
document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLElement>('[data-cronologia]').forEach(preparar);
});
