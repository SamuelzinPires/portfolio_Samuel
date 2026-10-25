// Rolagem suave (Lenis) movida pelo ticker único. No toque o Lenis não interfere (rolagem nativa).
// O CSS do Lenis é importado no layout (Base.astro), para ir junto com o <head>.
import Lenis from 'lenis';
import { adicionar } from './ticker';

let instancia: Lenis | null = null;
let cancelar: (() => void) | null = null;

export function iniciarLenis() {
  if (instancia) return;
  const lenis = new Lenis({ autoRaf: false });
  instancia = lenis;
  cancelar = adicionar((tempo) => lenis.raf(tempo));
}

export function destruirLenis() {
  cancelar?.();
  cancelar = null;
  instancia?.destroy();
  instancia = null;
}
