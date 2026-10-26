// Valores diários que alimentam a peça "calendario" (hoje: % renovável por subsistema do Airflow).
// Ficam em src/data/<nome>.json, e não em centenas de linhas de YAML no .md. O arquivo é conferido no
// build: formato errado, dia repetido ou valor fora de 0–100 quebra o build em vez de ir para a página.
//
// Formato (os números seguem a ordem de `nomes`, e o último é o `total`, se houver):
//   { "fonte": "…", "nomes": ["Nordeste", "Sul", …], "total": "Brasil (SIN)",
//     "dias": { "2026-09-15": [98.14, 89.91, 83.94, 56.11, 86.89], … } }
// Quem gera é o scripts/importar-geracao.mjs, a partir do CSV exportado do Postgres do pipeline.
import { z } from 'astro/zod';

const esquemaGeracao = z
  .strictObject({
    fonte: z.string().min(1),
    nomes: z.array(z.string().min(1)).min(1),
    total: z.string().min(1).optional(),
    dias: z.record(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'a chave de cada dia é AAAA-MM-DD'),
      z.array(z.number().min(0).max(100)),
    ),
  })
  .superRefine((g, contexto) => {
    const esperado = g.nomes.length + (g.total ? 1 : 0);
    for (const [dia, valores] of Object.entries(g.dias)) {
      if (valores.length !== esperado) {
        contexto.addIssue({
          code: 'custom',
          message: `${dia}: ${valores.length} valores, esperados ${esperado} (${g.nomes.join(', ')}${g.total ? `, ${g.total}` : ''})`,
        });
      }
    }
  });

export type Geracao = z.infer<typeof esquemaGeracao>;

const arquivos = import.meta.glob<unknown>('../data/*.json', { eager: true, import: 'default' });

/** Lê src/data/<nome>.json e confere o formato. */
export function carregarGeracao(nome: string): Geracao {
  const bruto = arquivos[`../data/${nome}.json`];
  if (bruto === undefined) throw new Error(`Arquivo de dados não encontrado: src/data/${nome}.json`);
  const lido = esquemaGeracao.safeParse(bruto);
  if (!lido.success) throw new Error(`src/data/${nome}.json fora do formato:\n${lido.error.message}`);
  return lido.data;
}
