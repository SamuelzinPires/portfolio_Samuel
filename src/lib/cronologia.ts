// Geometria da cronologia de certificados que o servidor (Astro) e o navegador (scripts/certificados.ts)
// calculam do mesmo jeito: quem liga com quem. Sem importar nada do Astro, para rodar nos dois lados.
//
// O quadro é uma grade: cada certificado ocupa uma coluna própria (eixo ordinal, por ordem de conclusão)
// e a raia da trilha dele. `nos[r]` = as colunas que têm certificado na raia r (r = posição visível, de cima
// para baixo). Com o filtro ou o "ver todos", só entram os certificados que estão visíveis.

export interface LigacoesDaCelula {
  /** A linha da raia chega pela esquerda (há certificado desta raia mais à esquerda). */
  esq: boolean;
  /** A linha da raia sai pela direita (há certificado desta raia mais à direita). */
  dir: boolean;
  /** Linha pontilhada que desce do certificado desta coluna (de uma raia mais acima) até o eixo. */
  prumo: boolean;
}

/** Ligações da célula da raia `r`, coluna `col`. A raia é uma linha só, do primeiro ao último certificado dela. */
export function ligacoes(nos: number[][], r: number, col: number): LigacoesDaCelula {
  const meus = nos[r] ?? [];
  const primeiro = Math.min(...meus);
  const ultimo = Math.max(...meus);
  // a linha vai do centro do primeiro certificado ao centro do último: a célula do primeiro só tem a
  // metade da direita, a do último só a da esquerda, e as do meio (com ou sem certificado) têm as duas
  return {
    esq: meus.length > 0 && col > primeiro && col <= ultimo,
    dir: meus.length > 0 && col >= primeiro && col < ultimo,
    prumo: !meus.includes(col) && nos.slice(0, r).some((acima) => acima.includes(col)),
  };
}
