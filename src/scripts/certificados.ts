// "ver os outros N" dos meses com muitos certificados. É melhoria progressiva: sem JavaScript todos os
// certificados aparecem e o botão nem existe (nasce `hidden`). O ano recolhido é um <details>, que não usa script.
//
// Contrato com o HTML (src/components/certificados/Certificados.astro):
//   [data-certificados]  raiz; data-limite = quantos certificados um mês mostra antes de recolher o resto
//   [data-status]        aviso para o leitor de tela (só muda quando a pessoa aperta o botão)
//   [data-mes]           um mês (data-nome = "out"); dentro dele os [data-cert] e o [data-ver-todos]

export {}; // módulo (e não script global): os nomes de função deste arquivo não colidem com os de pecas.ts

function preparar(raiz: HTMLElement) {
  if (raiz.dataset.pronta) return;
  raiz.dataset.pronta = '1';

  const limite = Number(raiz.dataset.limite ?? 9);
  const status = raiz.querySelector<HTMLElement>('[data-status]');

  raiz.querySelectorAll<HTMLElement>('[data-mes]').forEach((mes) => {
    const itens = [...mes.querySelectorAll<HTMLElement>('[data-cert]')];
    const botao = mes.querySelector<HTMLButtonElement>('[data-ver-todos]');
    if (!botao || itens.length <= limite) return;

    let aberto = false;
    const aplicar = (anunciar: boolean) => {
      itens.forEach((el, i) => {
        el.hidden = !aberto && i >= limite;
      });
      botao.hidden = false;
      botao.setAttribute('aria-expanded', String(aberto));
      botao.textContent = aberto ? 'recolher' : `ver os outros ${itens.length - limite} de ${mes.dataset.nome}`;
      // o leitor de tela só é avisado quando a pessoa aperta o botão, não na carga da página
      if (anunciar && status) {
        status.textContent = `${aberto ? itens.length : limite} de ${itens.length} certificados em ${mes.dataset.nome}`;
      }
    };

    botao.addEventListener('click', () => {
      aberto = !aberto;
      aplicar(true);
    });
    aplicar(false);
  });
}

// Com a navegação sem recarregar (ClientRouter) este módulo roda uma vez; quem se repete é o evento.
document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLElement>('[data-certificados]').forEach(preparar);
});
