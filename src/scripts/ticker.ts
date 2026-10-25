// Um único requestAnimationFrame para o site inteiro.
// Lenis, cursor e (na Parte 3) o WebGL se inscrevem aqui, em vez de cada um abrir o próprio loop:
// um loop só = uma conta de quadros só, e a rolagem suave fica sincronizada com a cena.
// O loop só roda enquanto houver alguém inscrito.
type Assinante = (tempoMs: number, deltaMs: number) => void;

const assinantes = new Set<Assinante>();
let quadro = 0;
let anterior = 0;

function ciclo(tempo: number) {
  const delta = anterior ? tempo - anterior : 1000 / 60;
  anterior = tempo;
  for (const fn of assinantes) fn(tempo, delta);
  quadro = assinantes.size ? requestAnimationFrame(ciclo) : 0;
}

export function remover(fn: Assinante) {
  assinantes.delete(fn);
  if (!assinantes.size && quadro) {
    cancelAnimationFrame(quadro);
    quadro = 0;
  }
}

/** Inscreve `fn` no loop. Devolve a função que cancela a inscrição. */
export function adicionar(fn: Assinante) {
  assinantes.add(fn);
  if (!quadro) {
    anterior = 0;
    quadro = requestAnimationFrame(ciclo);
  }
  return () => remover(fn);
}
