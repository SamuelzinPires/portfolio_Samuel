// Collections do site. Schema aprovado na Parte 1B (Conteudo-Projetos.md e Conteudo-Certificados.md).
// Só o mínimo é obrigatório; todo o resto é opcional, e a seção sem dado some da página.
// `strictObject`: um campo escrito errado no frontmatter (ex.: `decisao:` em vez de `decisoes:`)
// quebra o build em vez de sumir em silêncio.
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projetos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projetos' }),
  schema: ({ image }) =>
    z.strictObject({
      // obrigatórios
      titulo: z.string(),
      resumo: z.string().max(160), // linha da página e descrição do Open Graph
      tipo: z.string(), // coluna "tipo" da lista
      inicio: z.coerce.date(), // define a ordem, o número #00X e a posição na linha do tempo
      stack: z.array(z.string()).min(1), // mais relevante primeiro: a lista mostra as 3 primeiras + "+N"

      // opcionais
      fim: z.coerce.date().optional(), // sem `fim` = em andamento
      destaque: z.number().int().min(1).max(4).optional(), // ★ e ordem dos destaques
      chamada: z.string().optional(), // coluna "destaque" da lista
      numeros: z
        .array(z.strictObject({ valor: z.union([z.string(), z.number()]), rotulo: z.string() }))
        .max(2)
        .optional(),
      peca: z
        .strictObject({
          tipo: z.enum(['calendario', 'barras', 'fita-ci', 'grafo', 'camadas', 'fluxo']),
          dados: z.unknown(),
        })
        .optional(),
      comoFunciona: z.array(z.strictObject({ etapa: z.string(), texto: z.string() })).optional(),
      decisoes: z.array(z.strictObject({ decisao: z.string(), motivo: z.string() })).optional(),
      aprendizados: z.array(z.string()).optional(),
      proximosPassos: z.array(z.string()).optional(), // só onde o README tem roadmap real
      repo: z.url().optional(), // sem `repo` o botão some (Airflow, enquanto o repositório é privado)
      demo: z.url().optional(),
      relacionados: z.array(reference('projetos')).optional(),
      imagens: z
        .array(z.strictObject({ src: image(), alt: z.string(), legenda: z.string().optional() }))
        .optional(),
      rascunho: z.boolean().default(false), // true = não publica
    }),
});

// Sem campo de PDF, de propósito: nada aqui aponta para arquivo de certificado.
const certificados = defineCollection({
  loader: file('src/data/certificados.json'),
  schema: z.strictObject({
    id: z.string(),
    titulo: z.string(),
    emissor: z.string(),
    trilha: z.enum(['linguagem', 'dados', 'conceitos']),
    conclusao: z.coerce.date(),
    urlVerificacao: z.url().optional(),
  }),
});

export const collections = { projetos, certificados };
