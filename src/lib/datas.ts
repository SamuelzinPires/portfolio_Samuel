// Formatação de datas do site. Tudo em UTC: o frontmatter `2026-08-01` vira meia-noite UTC, e no
// fuso do Brasil (UTC−3) isso seria 31/07. Formatar em hora local mudaria o dia, às vezes o mês.
// Os meses são escritos à mão (`Intl` devolve "ago." com ponto, e o design usa "ago").
const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const mes = (d: Date) => meses[d.getUTCMonth()];
const ano = (d: Date) => d.getUTCFullYear();
const dois = (n: number) => String(n).padStart(2, '0');

/** "fev/2026", "fev–mar/2026", "dez/2026 – jan/2027" ou, sem `fim`, "ago/2026 → hoje". */
export function periodo(inicio: Date, fim?: Date): string {
  if (!fim) return `${mes(inicio)}/${ano(inicio)} → hoje`;
  if (ano(inicio) !== ano(fim)) return `${mes(inicio)}/${ano(inicio)} – ${mes(fim)}/${ano(fim)}`;
  if (mes(inicio) === mes(fim)) return `${mes(inicio)}/${ano(inicio)}`;
  return `${mes(inicio)}–${mes(fim)}/${ano(inicio)}`;
}

/** "03/08" */
export const diaMes = (d: Date) => `${dois(d.getUTCDate())}/${dois(d.getUTCMonth() + 1)}`;

/** "2026-08-03", para o atributo datetime */
export const isoDia = (d: Date) => `${ano(d)}-${dois(d.getUTCMonth() + 1)}-${dois(d.getUTCDate())}`;
