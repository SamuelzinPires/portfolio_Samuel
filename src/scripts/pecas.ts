// Interação das peças-assinatura da página de projeto. Tudo é opcional: sem JavaScript a peça aparece no
// estado inicial (o item aberto já vem marcado no HTML) e continua legível.
//
// Contrato com o HTML (feito pelos componentes em src/components/pecas/):
//   [data-peca]        raiz da peça
//   [data-item="id"]   algo selecionável (quadrado, coluna, linha, botão). Atributos `data-*` do item
//                      alimentam os elementos [data-campo="nome"] (texto do painel) e o anel [data-anel]
//                      (data-anel-x / data-anel-y). `data-grupo` escolhe o painel padrão "*grupo".
//   [data-painel="id"] bloco do painel que só aparece quando o item `id` está aberto; "*grupo" é o padrão
//                      de quem não tem bloco próprio (ex.: dia do calendário sem valores)
//   [data-valores]     (no item) números separados por vírgula; o bloco [data-painel="*valores"] mostra
//                      um dia por vez: uma linha .barra-dado por número, na mesma ordem
//   [data-liga="a b"]  elementos que acendem (.is-ligado) quando um dos ids está aberto
//   [data-passo="±1"]  botões "‹ ›" do celular: andam na ordem em que os itens aparecem no HTML
//   [data-teclas]      área que aceita as setas do teclado (data-passo-h / data-passo-v = tamanho do passo)
// Mouse abre ao passar; toque e teclado abrem ao tocar/focar. Nada anima: respeita reduced-motion.

const formatoPercentual = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function preparar(raiz: HTMLElement) {
  if (raiz.dataset.pronta) return;
  raiz.dataset.pronta = '1';

  const itens = [...raiz.querySelectorAll<HTMLElement>('[data-item]')];
  if (!itens.length) return;
  const ordem = [...new Set(itens.map((i) => i.dataset.item!))];
  const anel = raiz.querySelector<SVGElement>('[data-anel]');

  // o item aberto vem marcado no HTML (botões com .is-ativo); nos SVG o anel diz qual é
  const marcado = raiz.querySelector<HTMLElement>('[data-item].is-ativo')?.dataset.item;
  const doAnel = anel
    ? itens.find((i) => i.dataset.anelX === anel.getAttribute('x') && (i.dataset.anelY ?? '0') === (anel.getAttribute('y') ?? '0'))
        ?.dataset.item
    : undefined;
  let atual = marcado ?? doAnel ?? ordem[0];

  function selecionar(id: string) {
    atual = id;
    const referencia = itens.find((i) => i.dataset.item === id)!;

    for (const item of itens) {
      const aberto = item.dataset.item === id;
      item.classList.toggle('is-ativo', aberto);
      if (item.tagName === 'BUTTON') item.setAttribute('aria-pressed', String(aberto));
    }

    // painel do item: o bloco com o id dele; senão o "*valores" (item com data-valores) ou o "*grupo"
    const valores = referencia.dataset.valores;
    const temPainelProprio = raiz.querySelector(`[data-painel="${CSS.escape(id)}"]`) !== null;
    const padrao = valores ? '*valores' : referencia.dataset.grupo ? `*${referencia.dataset.grupo}` : '';
    raiz.querySelectorAll<HTMLElement>('[data-painel]').forEach((painel) => {
      const alvo = painel.dataset.painel!;
      painel.hidden = !(alvo === id || (!temPainelProprio && alvo === padrao));
    });

    // o bloco de barras "*valores" é um só: reescreve largura e número de cada linha
    if (valores) {
      const linhas = raiz.querySelectorAll<HTMLElement>('[data-painel="*valores"] .barra-dado');
      valores.split(',').forEach((texto, i) => {
        const numero = Number(texto);
        linhas[i]?.querySelector('.barra-dado__valor')?.setAttribute('width', String(Math.round(Math.max(numero, 0.6) * 100) / 100));
        const rotulo = linhas[i]?.querySelector('.barra-dado__numero');
        if (rotulo) rotulo.textContent = `${formatoPercentual.format(numero)}%`;
      });
    }

    raiz.querySelectorAll<Element>('[data-liga]').forEach((el) => {
      const ligado = (el.getAttribute('data-liga') ?? '').split(' ').includes(id);
      el.classList.toggle('is-ligado', ligado);
      // linha acesa por cima das outras (SVG pinta na ordem do documento)
      if (ligado && el instanceof SVGElement) el.parentNode?.appendChild(el);
    });

    raiz.querySelectorAll<HTMLElement>('[data-campo]').forEach((el) => {
      const valor = referencia.dataset[el.dataset.campo!];
      if (valor !== undefined) el.textContent = valor;
    });

    if (anel && referencia.dataset.anelX !== undefined) {
      anel.setAttribute('x', referencia.dataset.anelX);
      anel.setAttribute('y', referencia.dataset.anelY ?? '0');
    }
  }

  function andar(passo: number) {
    const proximo = Math.min(ordem.length - 1, Math.max(0, ordem.indexOf(atual) + passo));
    selecionar(ordem[proximo]);
  }

  const itemDo = (alvo: EventTarget | null) => (alvo as Element | null)?.closest<HTMLElement>('[data-item]') ?? null;

  raiz.addEventListener('click', (e) => {
    const item = itemDo(e.target);
    if (item && raiz.contains(item)) selecionar(item.dataset.item!);
  });
  raiz.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const item = itemDo(e.target);
    if (item && item.dataset.item !== atual) selecionar(item.dataset.item!);
  });
  raiz.addEventListener('focusin', (e) => {
    const item = itemDo(e.target);
    if (item && item.dataset.item !== atual) selecionar(item.dataset.item!);
  });

  raiz.querySelectorAll<HTMLElement>('[data-passo]').forEach((botao) => {
    botao.addEventListener('click', () => andar(Number(botao.dataset.passo)));
  });

  const area = raiz.querySelector<HTMLElement>('[data-teclas]');
  area?.addEventListener('keydown', (e) => {
    const h = Number(area.dataset.passoH ?? 1);
    const v = Number(area.dataset.passoV ?? 0);
    const passo = ({ ArrowLeft: -h, ArrowRight: h, ArrowUp: -v, ArrowDown: v } as Record<string, number>)[e.key];
    if (!passo) return;
    e.preventDefault();
    andar(passo);
  });
}

// Com a navegação sem recarregar (ClientRouter) este módulo roda uma vez; quem se repete é o evento.
document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLElement>('[data-peca]').forEach(preparar);
});
