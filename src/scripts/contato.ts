// Contato em DAG: acende o caminho do canal escolhido e liga o botão "copiar". Tudo é opcional: sem
// JavaScript o e-mail fica aceso, "escrever" e os links dos perfis funcionam e o botão "copiar" nem aparece.
//
// Contrato com o HTML (src/components/contato/ContatoDag.astro):
//   [data-contato]       raiz; data-ativo = id do canal aceso
//   [data-canal="id"]    cada peça do canal (linha, fio, bolinha); data-ordem = posição de cima para baixo
//   [data-cartao]        o cartão do canal: ganha .canal--ativo quando o canal está aceso
//   [data-copiar]        botão "copiar" (nasce `hidden`); o endereço vem do link mailto do mesmo cartão
//   [data-copiar-status] aviso para leitor de tela

export {}; // módulo (e não script global): os nomes de função deste arquivo não colidem com os de pecas.ts

const tempoDoAviso = 2200;

function ativar(raiz: HTMLElement, id: string) {
  if (raiz.dataset.ativo === id) return;
  raiz.dataset.ativo = id;
  const aceso = Number(raiz.querySelector<HTMLElement>(`[data-canal="${id}"]`)?.dataset.ordem);

  raiz.querySelectorAll<HTMLElement | SVGElement>('[data-canal]').forEach((el) => {
    const ordem = Number(el.dataset.ordem);
    el.classList.toggle('is-ativo', ordem === aceso);
    el.classList.toggle('is-antes', ordem < aceso);
    el.classList.toggle('is-depois', ordem > aceso);
    // no SVG, quem vem depois pinta por cima: o fio aceso vai para o fim
    if (ordem === aceso && el instanceof SVGElement) el.parentNode?.appendChild(el);
  });
  raiz.querySelectorAll<HTMLElement>('[data-cartao]').forEach((cartao) => {
    cartao.classList.toggle('canal--ativo', cartao.closest<HTMLElement>('[data-canal]')?.dataset.canal === id);
  });
}

/** Copia para a área de transferência; sem a API (ou sem permissão), seleciona o texto para a pessoa copiar à mão. */
async function copiar(texto: string, alvo: Element | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    if (alvo) {
      const faixa = document.createRange();
      faixa.selectNodeContents(alvo);
      const selecao = getSelection();
      selecao?.removeAllRanges();
      selecao?.addRange(faixa);
    }
    return false;
  }
}

function preparar(raiz: HTMLElement) {
  if (raiz.dataset.pronta) return;
  raiz.dataset.pronta = '1';

  raiz.querySelectorAll<HTMLElement>('li[data-canal]').forEach((linha) => {
    const id = linha.dataset.canal!;
    linha.addEventListener('pointerenter', () => ativar(raiz, id));
    linha.addEventListener('focusin', () => ativar(raiz, id));
  });

  raiz.querySelectorAll<HTMLButtonElement>('[data-copiar]').forEach((botao) => {
    const cartao = botao.closest<HTMLElement>('[data-cartao]');
    const endereco = cartao?.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')?.getAttribute('href')?.replace(/^mailto:/, '');
    if (!cartao || !endereco) return; // sem o endereço, o botão continua escondido

    const status = cartao.querySelector<HTMLElement>('[data-copiar-status]');
    const rotulo = botao.textContent ?? 'copiar';
    let relogio: number | undefined;
    botao.hidden = false;

    botao.addEventListener('click', async () => {
      const ok = await copiar(endereco, cartao.querySelector('.canal__endereco'));
      botao.textContent = ok ? 'copiado' : 'copie à mão';
      if (status) status.textContent = ok ? 'Endereço de e-mail copiado.' : 'Não consegui copiar: o endereço ficou selecionado.';
      clearTimeout(relogio);
      relogio = window.setTimeout(() => {
        botao.textContent = rotulo;
        if (status) status.textContent = '';
      }, tempoDoAviso);
    });
  });
}

document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLElement>('[data-contato]').forEach(preparar);
});
