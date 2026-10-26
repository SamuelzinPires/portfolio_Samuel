// Collections do site. Schema aprovado na Parte 1B (Conteudo-Projetos.md e Conteudo-Certificados.md),
// com a `peca` tipada na Parte 5.
// Só o mínimo é obrigatório; todo o resto é opcional, e a seção sem dado some da página.
// `strictObject`: um campo escrito errado no frontmatter (ex.: `decisao:` em vez de `decisoes:`)
// quebra o build em vez de sumir em silêncio.
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const texto = z.string().min(1);
const dia = z.coerce.date();

// ── Peças-assinatura ────────────────────────────────────────────────────────
// Um tipo por componente em src/components/pecas/. Os dados ficam no frontmatter do projeto e o
// componente só desenha: um número errado aqui aparece na página, então cada campo é conferido.
// `comentario` é a linha "// …" que abre a peça (sem as barras).

const rotuloDeValor = z.strictObject({ nome: texto, valor: z.number() });

const peca = z.discriminatedUnion('tipo', [
  // 008 · uma execução da DAG por dia (grade tipo GitHub) + % renovável do dia aberto
  z.strictObject({
    tipo: z.literal('calendario'),
    dados: z.strictObject({
      comentario: texto,
      inicio: dia, // primeiro dia com execução ok
      fim: dia, // último dia do intervalo ok
      falhas: z.array(z.strictObject({ dia, motivo: texto })).default([]), // execuções fora do intervalo ok
      legendaFalha: z.string().optional(),
      rotuloValor: texto, // "% renovável da geração"
      selecionado: dia, // dia aberto ao carregar
      // Valores por dia: o normal é `arquivo`, o nome de um JSON em src/data (sem ".json"), gerado pelo
      // scripts/importar-geracao.mjs. Dia sem valores mostra só o status.
      arquivo: z.string().optional(),
      // Alternativa para poucos dias, digitados à mão. Com `arquivo`, estes são ignorados.
      valores: z
        .array(
          z.strictObject({
            dia,
            subsistemas: z.array(rotuloDeValor).min(1),
            total: rotuloDeValor.optional(), // linha de total (SIN), em barra vazada
          }),
        )
        .default([]),
    }),
  }),

  // 001 · da descrição do extrato à categoria, e as categorias com a contagem de palavras-chave
  z.strictObject({
    tipo: z.literal('categorias'),
    dados: z.strictObject({
      comentario: texto,
      aviso: z.string().optional(), // "descrições de exemplo, escritas para esta página…"
      exemplos: z
        .array(z.strictObject({ descricao: texto, categoria: z.string().optional(), regra: texto }))
        .min(1),
      rotuloCategorias: texto,
      categorias: z.array(z.strictObject({ nome: texto, palavras: z.number().int().positive() })).min(1),
      notas: z.array(texto).default([]),
    }),
  }),

  // 002 · as páginas da API enchendo a tabela até o total
  z.strictObject({
    tipo: z.literal('paginas'),
    dados: z.strictObject({
      comentario: texto,
      total: z.number().int().positive(),
      porPagina: z.number().int().positive(),
      selecionada: z.number().int().positive(), // número da requisição aberta ao carregar
      destino: z.strictObject({ slug: reference('projetos'), rotulo: texto }).optional(),
      banco: texto, // "SQLite (tabela vagas)"
      codigo: texto,
      notaCodigo: z.string().optional(),
      legenda: z.strictObject({ vaga: texto, vazia: texto }),
    }),
  }),

  // 003 · a forma da tabela em cada camada (larga → longa)
  z.strictObject({
    tipo: z.literal('camadas'),
    dados: z.strictObject({
      comentario: texto,
      camadas: z
        .array(
          z.strictObject({
            nome: texto,
            tom: z.enum(['bronze', 'lambda', 'prata', 'ouro']),
            formato: texto, // "CSV · S3"
            colunas: z.array(texto).optional(), // camada em forma de tabela
            linhas: z.number().int().min(0).optional(), // quantas linhas vazias desenhar
            passos: z.array(texto).optional(), // camada em forma de lista numerada
            itens: z.array(texto).optional(), // camada em forma de lista simples
            legenda: z.string().optional(),
          }),
        )
        .min(2),
      codigo: z.string().optional(),
      notaCodigo: z.string().optional(),
    }),
  }),

  // 004 · as execuções do CI em ordem, os commits entre elas e os testes
  z.strictObject({
    tipo: z.literal('fita-ci'),
    dados: z.strictObject({
      comentario: texto,
      execucoes: z.array(z.strictObject({ dia: texto, hora: texto, ok: z.boolean() })).min(1),
      tituloCommits: texto,
      commits: z.array(z.strictObject({ hora: texto, mensagem: texto, ok: z.boolean().default(false) })).default([]),
      testes: z.strictObject({ titulo: texto, resumo: texto, arvore: texto, nota: z.string().optional() }),
      legenda: z.strictObject({ falhou: texto, passou: texto, nota: z.string().optional() }),
    }),
  }),

  // 005 · tabelas de origem → views, cada view abre a pergunta de negócio e o SQL
  z.strictObject({
    tipo: z.literal('grafo'),
    dados: z.strictObject({
      comentario: texto,
      tabelas: z.array(texto).min(1),
      views: z
        .array(
          z.strictObject({
            nome: texto,
            conceito: texto, // etiqueta curta: "LAG()", "NTILE(5)"
            tabelas: z.array(texto).min(1),
            pergunta: texto,
            codigo: texto,
          }),
        )
        .min(1),
      selecionada: texto, // nome da view aberta ao carregar
      legenda: z.strictObject({ aberta: texto, ligacao: texto }),
    }),
  }),

  // 006 · os endpoints da API, com o exemplo de requisição/resposta
  z.strictObject({
    tipo: z.literal('endpoints'),
    dados: z.strictObject({
      comentario: texto,
      endpoints: z
        .array(
          z.strictObject({
            metodo: z.enum(['get', 'post', 'put', 'delete']),
            rota: texto,
            descricao: texto,
            resposta: texto, // "200 · 404"
            teste: z.boolean(), // coberto por teste automatizado
            exemplo: z.strictObject({ codigo: texto, nota: z.string().optional() }).optional(),
          }),
        )
        .min(1),
      selecionado: z.number().int().min(0), // índice do endpoint aberto ao carregar
      legenda: z.array(texto).default([]),
    }),
  }),

  // 007 · violações por regra sobre o total de linhas
  z.strictObject({
    tipo: z.literal('barras'),
    dados: z.strictObject({
      comentario: texto,
      total: z.number().int().positive(), // o trilho inteiro
      regras: z
        .array(z.strictObject({ regra: texto, violacoes: z.number().int().min(0), detalhe: z.string().optional() }))
        .min(1),
      codigo: z.string().optional(),
      legenda: z.array(texto).default([]),
    }),
  }),
]);

export type Peca = z.infer<typeof peca>;

// ── Projetos ────────────────────────────────────────────────────────────────

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
        .array(
          z.strictObject({
            valor: z.union([z.string(), z.number()]),
            rotulo: z.string(),
            tom: z.enum(['ok', 'falha']).optional(), // verde / âmbar
          }),
        )
        .max(2)
        .optional(),
      peca: peca.optional(),
      comoFunciona: z
        .strictObject({
          nota: z.string().optional(), // "@daily · UTC · retries: 3", à direita do título
          tom: z.enum(['ok', 'azul']).default('azul'), // verde = tarefas que rodaram (Airflow)
          etapas: z.array(z.strictObject({ etapa: z.string(), texto: z.string() })).min(1),
        })
        .optional(),
      decisoes: z.array(z.strictObject({ decisao: z.string(), motivo: z.string() })).optional(),
      aprendizados: z.array(z.string()).optional(),
      proximosPassos: z.array(z.string()).optional(), // só onde o README tem roadmap real
      stackDetalhe: z.array(z.string()).optional(), // coluna lateral; sem isso, usa `stack`
      links: z
        .array(z.strictObject({ rotulo: z.string(), texto: z.string(), url: z.url() }))
        .optional(), // links extras na lateral (ex.: a fonte dos dados)
      repo: z.url().optional(), // sem `repo` o botão some (Airflow, enquanto o repositório é privado)
      demo: z.url().optional(),
      relacionados: z.array(reference('projetos')).optional(),
      imagens: z
        .array(z.strictObject({ src: image(), alt: z.string().min(1), legenda: z.string().optional() }))
        .optional(), // só imagens aprovadas; `alt` é obrigatório
      textosAprovados: z.boolean().default(false), // false = "por que existe", decisões e aprendizados ainda são rascunho
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
