// Cursor personalizado: um ponto que cola no mouse e um anel que o segue com atraso (lerp).
// Só existe com mouse (pointer: fine) e sem "reduzir movimento". Sem JavaScript, ou se algo falhar,
// o cursor do sistema continua: ele só é escondido DEPOIS que este script começa a rodar.
import { adicionar } from './ticker';

const LERP = 0.18; // fração da distância percorrida por quadro a 60 fps (menor = mais atraso)
const SELETOR_CLICAVEL = 'a, button, summary, label, input, select, textarea, [role="button"]';

let anel: HTMLElement | null = null;
let ponto: HTMLElement | null = null;
let ouvindo = false;
let ativo = false;
let alvoX = 0;
let alvoY = 0;
let x = 0;
let y = 0;
let primeiroMovimento = true;

function mostrar(visivel: boolean) {
  anel?.classList.toggle('cursor--visivel', visivel);
  ponto?.classList.toggle('cursor--visivel', visivel);
}

function aoMover(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return; // toque e caneta: nada de cursor
  alvoX = e.clientX;
  alvoY = e.clientY;
  if (ponto) ponto.style.transform = `translate3d(${alvoX}px, ${alvoY}px, 0)`;
  if (primeiroMovimento) {
    x = alvoX;
    y = alvoY;
    primeiroMovimento = false;
  }
  mostrar(true);
}

function aoEntrarEmElemento(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !(e.target instanceof Element)) return;
  const sobreLink = Boolean(e.target.closest(SELETOR_CLICAVEL));
  anel?.classList.toggle('cursor--link', sobreLink);
  ponto?.classList.toggle('cursor--link', sobreLink);
}

function atualizar(_tempo: number, delta: number) {
  if (!anel) return;
  // lerp independente da taxa de quadros: 120 Hz e 60 Hz dão o mesmo atraso
  const fator = 1 - Math.pow(1 - LERP, delta / (1000 / 60));
  x += (alvoX - x) * fator;
  y += (alvoY - y) * fator;
  anel.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

/** Chamada a cada página (inclusive depois de uma navegação): liga o cursor se o aparelho permitir. */
export function iniciarCursor() {
  const podeTer =
    matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  anel = document.getElementById('cursor');
  ponto = document.getElementById('cursor-ponto');
  if (!podeTer || !anel || !ponto) return;

  ativo = true;
  document.documentElement.classList.add('cursor-ativo');
  if (ouvindo) return; // os ouvintes ficam no document e valem para o site inteiro, uma vez só
  ouvindo = true;
  window.addEventListener('pointermove', aoMover, { passive: true });
  document.addEventListener('pointerover', aoEntrarEmElemento, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => mostrar(false));
  document.documentElement.addEventListener('mouseenter', () => !primeiroMovimento && mostrar(true));
  adicionar(atualizar);
}

/** O Astro troca os atributos do <html> na navegação e apaga a classe: devolvemos antes de pintar. */
export function reaplicarCursor() {
  if (ativo) document.documentElement.classList.add('cursor-ativo');
}
